'use client';

import { financeService, normalizeGradeKey } from './financeService';
import { Student } from './studentService';
import { auditTrailService } from './auditTrailService';
import { PaymentRecord } from '@/components/finance/financeShared';

export type PaymentGatewayProvider = 'bKash' | 'Nagad' | 'SSLCommerz';

export interface PaymentGatewayConfig {
  bKashEnabled: boolean;
  bKashMerchantNo: string;
  nagadEnabled: boolean;
  nagadMerchantNo: string;
  sslEnabled: boolean;
  sandboxMode: boolean;
}

export interface OnlinePaymentTransaction {
  id: string;
  receiptId: string;
  provider: PaymentGatewayProvider;
  studentId: string;
  studentName: string;
  roll: string;
  grade: string;
  section: string;
  amount: number;
  trxId: string;
  signature: string;
  mode: 'live' | 'sandbox' | 'manual';
  status: 'initiated' | 'verified' | 'failed';
  monthsPaid: string[];
  extraFeeIds: string[];
  createdAt: string;
  verifiedAt?: string;
}

const GATEWAY_CONFIG_KEY = 'sms_payment_gateway_config';
const TRANSACTIONS_STORAGE_KEY = 'sms_payment_transactions';
const PAYMENT_HISTORY_KEY = 'sms_payment_history';

const DEFAULT_CONFIG: PaymentGatewayConfig = {
  bKashEnabled: true,
  bKashMerchantNo: '',
  nagadEnabled: true,
  nagadMerchantNo: '',
  sslEnabled: true,
  sandboxMode: true,
};

function buildReceiptShareUrl(receiptId: string, origin?: string): string {
  const base =
    origin ||
    (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '');
  return `${base}/verify-certificate/?type=receipt&id=${encodeURIComponent(receiptId)}`;
}

async function callGatewayEndpoint(payload: Record<string, unknown>) {
  const res = await fetch('/api/payment-gateway', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json() as Promise<{
    success: boolean;
    mode?: 'live' | 'sandbox';
    verified?: boolean;
    trxId?: string;
    signature?: string;
    gatewayUrl?: string;
    message?: string;
    error?: string;
  }>;
}

export const paymentGatewayService = {
  getConfig(): PaymentGatewayConfig {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    try {
      const raw = localStorage.getItem(GATEWAY_CONFIG_KEY);
      if (!raw) return DEFAULT_CONFIG;
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  saveConfig(cfg: Partial<PaymentGatewayConfig>): PaymentGatewayConfig {
    const next = { ...this.getConfig(), ...cfg };
    if (typeof window !== 'undefined') {
      localStorage.setItem(GATEWAY_CONFIG_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event('storage'));
    }
    return next;
  },

  getTransactions(): OnlinePaymentTransaction[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  findReceiptById(receiptId: string): PaymentRecord | null {
    if (typeof window === 'undefined' || !receiptId.trim()) return null;
    const target = receiptId.trim().toUpperCase();
    try {
      const rawHistory = localStorage.getItem(PAYMENT_HISTORY_KEY);
      const list: PaymentRecord[] = rawHistory ? JSON.parse(rawHistory) : [];
      const hit = list.find((p) => String(p.receiptId || '').toUpperCase() === target);
      if (hit) return hit;
    } catch {}

    const tx = this.getTransactions().find(
      (t) =>
        t.status === 'verified' &&
        (t.receiptId.toUpperCase() === target || t.trxId.toUpperCase() === target)
    );
    if (!tx) return null;
    return {
      receiptId: tx.receiptId,
      studentId: tx.studentId,
      studentName: tx.studentName,
      roll: tx.roll,
      grade: tx.grade,
      section: tx.section,
      mobile: 'N/A',
      feeItems: tx.monthsPaid.map((m) => ({ name: `${m} বেতন (অনলাইন)`, amount: tx.amount })),
      subtotal: tx.amount,
      discount: 0,
      paidAmount: tx.amount,
      dueRemaining: 0,
      paymentMethod: tx.provider,
      trxId: tx.trxId,
      date: (tx.verifiedAt || tx.createdAt).split('T')[0],
      collectedBy: `Online (${tx.provider})`,
    };
  },

  getReceiptVerifyUrl(receiptId: string): string {
    return buildReceiptShareUrl(receiptId);
  },

  buildWhatsAppShareUrl(rec: PaymentRecord, schoolNameBn: string): string {
    const verifyUrl = buildReceiptShareUrl(rec.receiptId);
    const text = `${schoolNameBn}\nডিজিটাল মানি রিসিপ্ট: ${rec.receiptId}\nশিক্ষার্থী: ${rec.studentName} (রোল: ${rec.roll}, শ্রেণি: ${rec.grade})\nপরিশোধ: ৳${rec.paidAmount} (${rec.paymentMethod}${rec.trxId ? ` / ${rec.trxId}` : ''})\nতারিখ: ${rec.date}\nযাচাই লিংক: ${verifyUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  },

  async initiateCheckout(params: {
    provider: PaymentGatewayProvider;
    student: Student;
    amount: number;
    monthsPaid: string[];
    extraFeeIds?: string[];
  }): Promise<{
    success: boolean;
    message: string;
    transaction?: OnlinePaymentTransaction;
    gatewayUrl?: string;
  }> {
    if (params.amount <= 0) {
      return { success: false, message: 'পরিশোধযোগ্য অর্থের পরিমাণ ০ টাকার বেশি হতে হবে।' };
    }

    const now = new Date();
    const receiptId = `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

    let mode: 'live' | 'sandbox' | 'manual' = 'sandbox';
    let trxId = `${params.provider.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    let signature = `LOCAL-${Math.floor(100000 + Math.random() * 899999)}`;
    let gatewayUrl: string | undefined;

    try {
      const apiRes = await callGatewayEndpoint({
        action: 'initiate',
        provider: params.provider,
        amount: params.amount,
        studentId: params.student.id,
        studentName: params.student.name,
        invoiceNo: receiptId,
        callbackOrigin: origin,
      });
      if (!apiRes.success) {
        return { success: false, message: apiRes.error || 'গেটওয়ে ইনিশিয়েট ব্যর্থ হয়েছে।' };
      }
      mode = apiRes.mode || 'sandbox';
      trxId = apiRes.trxId || trxId;
      signature = apiRes.signature || signature;
      gatewayUrl = apiRes.gatewayUrl;
    } catch {
      mode = 'manual';
    }

    const tx: OnlinePaymentTransaction = {
      id: `PG-${Date.now()}`,
      receiptId,
      provider: params.provider,
      studentId: params.student.id,
      studentName: params.student.name,
      roll: String(params.student.roll || ''),
      grade: params.student.grade || '6th',
      section: params.student.section || params.student.branch || 'A',
      amount: params.amount,
      trxId,
      signature,
      mode,
      status: 'initiated',
      monthsPaid: params.monthsPaid,
      extraFeeIds: params.extraFeeIds || [],
      createdAt: now.toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify([tx, ...this.getTransactions()]));
    }

    return {
      success: true,
      message: `${params.provider} পেমেন্ট সেশন তৈরি হয়েছে।`,
      transaction: tx,
      gatewayUrl,
    };
  },

  async verifyAndSettlePayment(params: {
    provider: PaymentGatewayProvider;
    student: Student;
    amount: number;
    trxId: string;
    monthsPaid: string[];
    extraFeeIds?: string[];
    collectedBy?: string;
    discountAmount?: number;
  }): Promise<{
    success: boolean;
    message: string;
    receipt?: PaymentRecord;
    transaction?: OnlinePaymentTransaction;
  }> {
    const cleanTrx = params.trxId.trim().toUpperCase();
    if (cleanTrx.length < 6) {
      return { success: false, message: 'সঠিক ট্রানজেকশন আইডি (কমপক্ষে ৬ অক্ষর) প্রদান করুন।' };
    }
    if (params.amount <= 0) {
      return { success: false, message: 'পরিশোধযোগ্য অর্থের পরিমাণ সঠিক নয়।' };
    }

    let mode: 'live' | 'sandbox' | 'manual' = 'manual';
    let signature = `VER-${cleanTrx.slice(0, 8)}`;

    try {
      const apiRes = await callGatewayEndpoint({
        action: 'verify',
        provider: params.provider,
        amount: params.amount,
        studentId: params.student.id,
        trxId: cleanTrx,
      });
      if (!apiRes.success) {
        return { success: false, message: apiRes.error || 'ট্রানজেকশন যাচাই ব্যর্থ হয়েছে।' };
      }
      mode = apiRes.mode || 'sandbox';
      signature = apiRes.signature || signature;
    } catch {
      mode = 'manual';
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const receiptId = `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const financeMethod = params.provider === 'SSLCommerz' ? 'Bank Transfer' : params.provider;
    const gradeKey = normalizeGradeKey(params.student.grade || '6th');
    const isStipend = Boolean(
      params.student.isStipend || params.student.stipendCategory || params.student.stipendStatus === 'Active'
    );

    const { updatedLedger, paidFeeItems } = financeService.applyPaymentToStudentLedger({
      studentId: params.student.id,
      studentName: params.student.name,
      roll: String(params.student.roll || ''),
      grade: gradeKey,
      section: params.student.section || params.student.branch || 'A',
      mobile: params.student.mobile || 'N/A',
      selectedMonths: params.monthsPaid,
      selectedOtherFeeIds: params.extraFeeIds || [],
      paymentAmount: params.amount,
      discountAmount: params.discountAmount || 0,
      paymentMethod: financeMethod,
      trxId: `${params.provider}:${cleanTrx}`,
      receiptId,
      collectedBy: params.collectedBy || `অনলাইন (${params.provider})`,
      date: dateStr,
      isStipend,
    });

    const discount = params.discountAmount || 0;
    const receipt: PaymentRecord = {
      receiptId,
      studentId: params.student.id,
      studentName: params.student.name,
      roll: String(params.student.roll || ''),
      grade: params.student.grade || '6th',
      section: params.student.section || params.student.branch || 'A',
      mobile: params.student.mobile || 'N/A',
      feeItems: paidFeeItems.map((f) => ({
        name: f.name,
        amount: f.amount,
        dueRemaining: f.dueRemaining,
      })),
      subtotal: params.amount + discount,
      discount,
      paidAmount: params.amount,
      dueRemaining: updatedLedger.totalDue,
      paymentMethod: params.provider,
      trxId: cleanTrx,
      date: dateStr,
      collectedBy: params.collectedBy || `অনলাইন (${params.provider})`,
    };

    const tx: OnlinePaymentTransaction = {
      id: `PG-${Date.now()}`,
      receiptId,
      provider: params.provider,
      studentId: params.student.id,
      studentName: params.student.name,
      roll: String(params.student.roll || ''),
      grade: params.student.grade || '6th',
      section: params.student.section || params.student.branch || 'A',
      amount: params.amount,
      trxId: cleanTrx,
      signature,
      mode,
      status: 'verified',
      monthsPaid: params.monthsPaid,
      extraFeeIds: params.extraFeeIds || [],
      createdAt: now.toISOString(),
      verifiedAt: now.toISOString(),
    };

    if (typeof window !== 'undefined') {
      const existingHistoryRaw = localStorage.getItem(PAYMENT_HISTORY_KEY);
      const existingHistory: PaymentRecord[] = existingHistoryRaw ? JSON.parse(existingHistoryRaw) : [];
      localStorage.setItem(PAYMENT_HISTORY_KEY, JSON.stringify([receipt, ...existingHistory]));
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify([tx, ...this.getTransactions()]));
    }

    financeService.postFeeReceiptJournal({
      receiptId,
      studentName: params.student.name,
      roll: String(params.student.roll || ''),
      grade: gradeKey,
      paidAmount: params.amount,
      subtotal: params.amount + discount,
      discount,
      paymentMethod: financeMethod,
      feeItems: paidFeeItems.map((f) => ({ name: f.name, amount: f.amount })),
      date: dateStr,
      collectedBy: params.collectedBy || `অনলাইন (${params.provider})`,
    });

    auditTrailService.addLog({
      action: 'ONLINE_FEE_PAYMENT_VERIFIED',
      category: 'Finance',
      details: `${params.provider} পেমেন্ট (${cleanTrx}) — ${params.student.name} (৳${params.amount}), রসিদ: ${receiptId}`,
      performedBy: params.collectedBy || 'গেটওয়ে',
      status: 'Success',
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }

    return {
      success: true,
      message: `${params.provider} লেনদেন যাচাই ও রসিদ (${receiptId}) ইস্যু সম্পন্ন হয়েছে!`,
      receipt,
      transaction: tx,
    };
  },
};
