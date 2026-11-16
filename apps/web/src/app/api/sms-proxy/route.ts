import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_SMS_PROXY_HOSTS = new Set([
  'bulksmsdhaka.net',
  'www.bulksmsdhaka.net',
  'bulksmsbd.net',
  'www.bulksmsbd.net',
  'portal.bulksmsbd.com',
  'api.greenweb.com.bd'
]);

const MAX_TARGET_URL_LENGTH = 4096;

function isPrivateOrUnsafeHost(hostnameInput: string): boolean {
  const host = hostnameInput.trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!host) return true;

  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '::' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return true;
  }

  // IPv4 private / link-local / CGNAT ranges
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const a = Number(ipv4Match[1]);
    const b = Number(ipv4Match[2]);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }

  // IPv6 ULA / link-local / IPv4-mapped loopback
  if (
    host.startsWith('fc') ||
    host.startsWith('fd') ||
    host.startsWith('fe80') ||
    host.startsWith('::ffff:127.') ||
    host.startsWith('::ffff:10.') ||
    host.startsWith('::ffff:192.168.') ||
    host.startsWith('::ffff:169.254.')
  ) {
    return true;
  }

  return false;
}

function validateAndEnrichTargetUrl(
  rawUrl: string
): { ok: true; targetUrl: string } | { ok: false; status: number; error: string; ssrfBlocked?: boolean } {
  if (!rawUrl || rawUrl.length > MAX_TARGET_URL_LENGTH) {
    return { ok: false, status: 400, error: 'Missing or oversized target URL' };
  }

  let urlObj: URL;
  try {
    urlObj = new URL(rawUrl);
  } catch {
    return { ok: false, status: 400, error: 'Invalid URL format' };
  }

  if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
    return {
      ok: false,
      status: 400,
      error: 'Security Violation: Only HTTP/HTTPS gateway URLs are permitted.',
      ssrfBlocked: true
    };
  }

  const hostname = urlObj.hostname.toLowerCase();
  if (isPrivateOrUnsafeHost(hostname)) {
    return {
      ok: false,
      status: 400,
      error: 'Security Violation: Private or loopback SSRF targets are strictly disallowed.',
      ssrfBlocked: true
    };
  }

  if (!ALLOWED_SMS_PROXY_HOSTS.has(hostname)) {
    return { ok: false, status: 403, error: 'Forbidden SMS gateway hostname' };
  }

  // Optional server-managed API key injection (prevents exposing keys on the client when env vars are set)
  if (hostname.endsWith('bulksmsbd.net')) {
    const existing = urlObj.searchParams.get('api_key');
    if ((!existing || existing === 'SERVER_MANAGED') && process.env.BULKSMSBD_API_KEY) {
      urlObj.searchParams.set('api_key', process.env.BULKSMSBD_API_KEY);
    }
  }
  if (hostname.endsWith('bulksmsdhaka.net')) {
    const existing = urlObj.searchParams.get('apikey');
    if ((!existing || existing === 'SERVER_MANAGED') && process.env.BULKSMSDHAKA_API_KEY) {
      urlObj.searchParams.set('apikey', process.env.BULKSMSDHAKA_API_KEY);
    }
  }

  return { ok: true, targetUrl: urlObj.toString() };
}

function buildGatewayUrlFromStructuredBody(body: Record<string, unknown>): string | null {
  const provider = typeof body.provider === 'string' ? body.provider : '';
  const number = typeof body.number === 'string' ? body.number : '';
  const message = typeof body.message === 'string' ? body.message : '';
  const senderId = typeof body.senderId === 'string' ? body.senderId : typeof body.callerID === 'string' ? body.callerID : '';
  const apiKey = typeof body.apiKey === 'string' ? body.apiKey : 'SERVER_MANAGED';
  const action = typeof body.action === 'string' ? body.action : 'send';
  const typeParam = typeof body.type === 'string' ? body.type : 'unicode';

  if (provider === 'bulksmsbd') {
    if (action === 'balance') {
      return `https://bulksmsbd.net/api/getBalanceApi?api_key=${encodeURIComponent(apiKey)}`;
    }
    return `https://bulksmsbd.net/api/smsapi?api_key=${encodeURIComponent(apiKey)}&type=${encodeURIComponent(typeParam)}&number=${encodeURIComponent(number)}&senderid=${encodeURIComponent(senderId)}&message=${encodeURIComponent(message)}`;
  }

  if (provider === 'bulksmsdhaka') {
    const endpoint = action === 'otp' ? 'otpsend' : 'sendtext';
    return `https://bulksmsdhaka.net/api/${endpoint}?apikey=${encodeURIComponent(apiKey)}&callerID=${encodeURIComponent(senderId || '1234')}&number=${encodeURIComponent(number)}&message=${encodeURIComponent(message)}`;
  }

  return null;
}

async function forwardSmsGatewayRequest(targetUrl: string): Promise<NextResponse> {
  const validated = validateAndEnrichTargetUrl(targetUrl);
  if (!validated.ok) {
    return NextResponse.json(
      { success: false, error: validated.error },
      {
        status: validated.status,
        headers: validated.ssrfBlocked ? { 'X-SSRF-Protection': 'BLOCKED' } : undefined
      }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const upstreamRes = await fetch(validated.targetUrl, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store'
    });
    const text = await upstreamRes.text();
    const contentType = upstreamRes.headers.get('content-type') || 'text/plain; charset=utf-8';
    return new NextResponse(text, {
      status: upstreamRes.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store'
      }
    });
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      {
        success: false,
        error: isAbort ? 'SMS gateway request timed out' : 'SMS gateway proxy request failed'
      },
      { status: isAbort ? 504 : 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get('url') || '';
  return forwardSmsGatewayRequest(targetUrl);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const rawUrl =
      (typeof body.url === 'string' && body.url) ||
      buildGatewayUrlFromStructuredBody(body) ||
      '';
    return forwardSmsGatewayRequest(rawUrl);
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
  }
}
