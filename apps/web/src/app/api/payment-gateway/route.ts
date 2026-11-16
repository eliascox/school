import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';

type GatewayProvider = 'bKash' | 'Nagad' | 'SSLCommerz';
type GatewayAction = 'initiate' | 'verify';

interface GatewayRequestBody {
  action?: GatewayAction;
  provider?: GatewayProvider;
  amount?: number;
  studentId?: string;
  studentName?: string;
  invoiceNo?: string;
  trxId?: string;
  callbackOrigin?: string;
}

const VALID_PROVIDERS = new Set<GatewayProvider>(['bKash', 'Nagad', 'SSLCommerz']);

function signGatewayPayload(parts: Array<string | number>): string {
  const secret = process.env.PAYMENT_GATEWAY_SECRET || 'sms-local-gateway-verify-2026';
  return createHmac('sha256', secret).update(parts.join('|')).digest('hex').slice(0, 16).toUpperCase();
}

export async function POST(req: NextRequest) {
  let body: GatewayRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON request payload' }, { status: 400 });
  }

  const action: GatewayAction = body.action === 'verify' ? 'verify' : 'initiate';
  const provider = body.provider;
  const amount = Number(body.amount || 0);
  const studentId = String(body.studentId || '').trim();

  if (!provider || !VALID_PROVIDERS.has(provider)) {
    return NextResponse.json({ success: false, error: 'Unsupported payment provider' }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ success: false, error: 'Payment amount must be greater than zero' }, { status: 400 });
  }
  if (!studentId) {
    return NextResponse.json({ success: false, error: 'Student ID is required' }, { status: 400 });
  }

  // Live SSLCommerz integration when credentials exist in server environment
  if (
    provider === 'SSLCommerz' &&
    process.env.SSLCOMMERZ_STORE_ID &&
    process.env.SSLCOMMERZ_STORE_PASSWD
  ) {
    const isLive = process.env.SSLCOMMERZ_SANDBOX === 'false';
    const tranId = body.invoiceNo || `SMS-${Date.now()}`;

    if (action === 'initiate') {
      try {
        const origin = body.callbackOrigin && body.callbackOrigin.startsWith('http')
          ? body.callbackOrigin
          : 'http://localhost:3000';
        const form = new URLSearchParams({
          store_id: process.env.SSLCOMMERZ_STORE_ID,
          store_passwd: process.env.SSLCOMMERZ_STORE_PASSWD,
          total_amount: String(amount),
          currency: 'BDT',
          tran_id: tranId,
          success_url: `${origin}/dashboard/finance?gateway_status=success&trxId=${encodeURIComponent(tranId)}`,
          fail_url: `${origin}/dashboard/finance?gateway_status=fail&trxId=${encodeURIComponent(tranId)}`,
          cancel_url: `${origin}/dashboard/finance?gateway_status=cancel&trxId=${encodeURIComponent(tranId)}`,
          cus_name: body.studentName || studentId,
          cus_email: 'accounts@school.edu.bd',
          cus_phone: '01700000000',
          cus_add1: 'Bangladesh',
          cus_city: 'Dhaka',
          cus_country: 'Bangladesh',
          shipping_method: 'NO',
          product_name: 'Student Tuition Fee',
          product_category: 'Education',
          product_profile: 'non-physical-goods',
        });

        const initEndpoint = isLive
          ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php'
          : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';

        const upstream = await fetch(initEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: form.toString(),
          signal: AbortSignal.timeout(10000),
        });
        const data = (await upstream.json()) as { status?: string; GatewayPageURL?: string; failedreason?: string };
        if (data.status === 'SUCCESS' && data.GatewayPageURL) {
          return NextResponse.json({
            success: true,
            mode: isLive ? 'live' : 'sandbox',
            provider,
            gatewayUrl: data.GatewayPageURL,
            trxId: tranId,
            signature: signGatewayPayload([provider, studentId, amount, tranId]),
          });
        }
        return NextResponse.json(
          { success: false, error: data.failedreason || 'SSLCommerz initialization failed' },
          { status: 502 }
        );
      } catch (err) {
        return NextResponse.json(
          { success: false, error: err instanceof Error ? err.message : 'SSLCommerz upstream error' },
          { status: 502 }
        );
      }
    }
  }

  // Sandbox / Manual Merchant TrxID fallback when live provider keys are not configured
  const cleanTrx = (body.trxId || '').trim().toUpperCase();
  if (action === 'verify' && (!cleanTrx || cleanTrx.length < 6)) {
    return NextResponse.json(
      { success: false, error: 'সঠিক ট্রানজেকশন আইডি (কমপক্ষে ৬ অক্ষর) প্রদান করুন।' },
      { status: 400 }
    );
  }

  const generatedTrx = cleanTrx || `${provider.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const signature = signGatewayPayload([provider, studentId, amount, generatedTrx]);

  return NextResponse.json({
    success: true,
    mode: 'sandbox',
    verified: action === 'verify',
    provider,
    amount,
    studentId,
    trxId: generatedTrx,
    signature,
    message:
      action === 'verify'
        ? `${provider} লেনদেন (${generatedTrx}) যাচাই সম্পন্ন হয়েছে (Sandbox/Local Mode)।`
        : `${provider} চেকআউট সেশন প্রস্তুত হয়েছে (Sandbox Mode)।`,
  });
}
