import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage & window
const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null
};
(globalThis as any).window = { dispatchEvent: () => true };

import { financeService, VoucherRecord } from '../src/services/financeService';

describe('Double-Entry Accounting & Ledger Integrity Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('enforces Total Debit = Total Credit invariant when posting vouchers', () => {
    const balancedVoucher: VoucherRecord = {
      id: 'VOUCH-TEST-01',
      voucherNo: 'RV-2026-0001',
      voucherType: 'Receipt',
      date: '2026-10-13',
      reference: 'টেস্ট রসিদ',
      narration: 'ফি আদায়',
      sourceModule: 'student_fees',
      totalAmount: 1500,
      createdBy: 'ক্যাশিয়ার',
      entries: [
        { accountCode: '1010', accountName: 'Cash', debit: 1500, credit: 0 },
        { accountCode: '4010', accountName: 'Tuition Fee Revenue', debit: 0, credit: 1500 }
      ]
    };

    // Balanced voucher must succeed
    const list = financeService.addVoucher(balancedVoucher);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toBe('VOUCH-TEST-01');
  });

  it('rejects an imbalanced voucher where Total Debit !== Total Credit', () => {
    const imbalancedVoucher: VoucherRecord = {
      id: 'VOUCH-ERR-01',
      voucherNo: 'RV-2026-0002',
      voucherType: 'Receipt',
      date: '2026-10-13',
      reference: 'ত্রুটিযুক্ত ভাউচার',
      narration: 'অসামঞ্জস্যপূর্ণ এন্ট্রি',
      sourceModule: 'manual_voucher',
      totalAmount: 1000,
      createdBy: 'অ্যাকাউন্টস',
      entries: [
        { accountCode: '1010', accountName: 'Cash', debit: 1000, credit: 0 },
        { accountCode: '4010', accountName: 'Tuition Fee Revenue', debit: 0, credit: 900 } // missing 100
      ]
    };

    // Must throw error
    expect(() => {
      financeService.addVoucher(imbalancedVoucher);
    }).toThrowError(/Double-entry invariant violated/);
  });

  it('falls back to 0 opening balance for Cash Book and Bank Book when uninitialized or cleared', () => {
    // When no chart of accounts or cleared demo state exists
    const cashBook = financeService.getCashBook();
    expect(cashBook.openingBalance).toBe(0);

    const bankBook = financeService.getBankBook('1020');
    expect(bankBook.openingBalance).toBe(0);
  });

  it('deduplicates payment records by receiptId in getPaymentHistory and addPaymentRecord', () => {
    const payment = {
      receiptId: 'REC-202610-1001',
      studentId: 'STD-101',
      studentName: 'রাকিব হাসান',
      roll: '05',
      grade: '8th',
      section: 'A',
      feeItems: [{ name: 'বেতন', amount: 500 }],
      subtotal: 500,
      discount: 0,
      paidAmount: 500,
      paymentMethod: 'Cash',
      date: '2026-10-13',
      collectedBy: 'ক্যাশিয়ার'
    };

    // Add once
    financeService.addPaymentRecord(payment);
    expect(financeService.getPaymentHistory().length).toBe(1);

    // Add again with exact same receiptId (duplicate attempt)
    financeService.addPaymentRecord(payment);
    expect(financeService.getPaymentHistory().length).toBe(1);
  });
});
