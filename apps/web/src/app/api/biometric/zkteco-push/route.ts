import { NextRequest, NextResponse } from 'next/server';

export interface BiometricPunchItem {
  userId: string;
  timestamp: string;
  deviceId: string;
  state: string;
}

const MAX_BUFFERED_PUNCHES = 500;

declare global {
  var __smsNextBiometricQueue: BiometricPunchItem[] | undefined;
}

function getPunchQueue(): BiometricPunchItem[] {
  if (!globalThis.__smsNextBiometricQueue) {
    globalThis.__smsNextBiometricQueue = [];
  }
  return globalThis.__smsNextBiometricQueue;
}

function isAuthorizedDevice(req: NextRequest): boolean {
  const expectedToken = process.env.ZKTECO_PUSH_TOKEN || '';
  if (!expectedToken) return true;
  const provided = req.headers.get('x-device-token') || '';
  return provided === expectedToken;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedDevice(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized device token' }, { status: 401 });
  }
  const queue = getPunchQueue();
  const shouldClear = req.nextUrl.searchParams.get('clear') === '1';
  const punches = [...queue];
  if (shouldClear) {
    queue.length = 0;
  }
  return NextResponse.json({ success: true, punches });
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedDevice(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized device token' }, { status: 401 });
  }

  let rawBody = '';
  try {
    rawBody = (await req.text()).trim();
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to read request body' }, { status: 400 });
  }

  if (!rawBody) {
    return NextResponse.json({ success: false, error: 'Empty punch payload' }, { status: 400 });
  }

  const deviceSn = req.headers.get('x-device-sn') || 'ZKTECO-PUSH';
  const accepted: BiometricPunchItem[] = [];

  try {
    if (rawBody.startsWith('{') || rawBody.startsWith('[')) {
      const parsed = JSON.parse(rawBody) as
        | Record<string, unknown>
        | Array<Record<string, unknown>>
        | { punches?: Array<Record<string, unknown>> };
      const items: Array<Record<string, unknown>> = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { punches?: unknown }).punches)
        ? ((parsed as { punches: Array<Record<string, unknown>> }).punches)
        : [parsed as Record<string, unknown>];

      for (const item of items) {
        const userId = String(item.userId || item.roll || item.pin || '').trim();
        if (!userId) continue;
        accepted.push({
          userId,
          timestamp: String(item.timestamp || item.time || new Date().toISOString()).trim(),
          deviceId: String(item.deviceId || deviceSn).trim(),
          state: String(item.state || item.status || '0').trim(),
        });
      }
    } else {
      const lines = rawBody.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        const parts = line.split(/[\t,]+/).map((p) => p.trim());
        if (parts.length >= 2 && parts[0]) {
          accepted.push({
            userId: parts[0],
            timestamp: parts[1],
            deviceId: String(parts[3] || deviceSn).trim(),
            state: String(parts[2] || '0').trim(),
          });
        }
      }
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Malformed biometric payload' }, { status: 400 });
  }

  if (accepted.length === 0) {
    return NextResponse.json({ success: false, error: 'No valid biometric punch records found' }, { status: 400 });
  }

  const queue = getPunchQueue();
  queue.push(...accepted);
  if (queue.length > MAX_BUFFERED_PUNCHES) {
    queue.splice(0, queue.length - MAX_BUFFERED_PUNCHES);
  }

  return NextResponse.json({
    success: true,
    accepted: accepted.length,
    totalBuffered: queue.length,
  });
}
