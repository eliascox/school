import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage for test environment
const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};
(globalThis as any).window = {
  dispatchEvent: () => true
};

import { ledgerService } from '../src/services/ledgerService';

describe('ledgerService demo cleanup & empty start', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts clean with 0 records when uninitialized', () => {
    const records = ledgerService.getAllRecords();
    expect(records).toEqual([]);
    const summary = ledgerService.getSummary(records);
    expect(summary.totalIncome).toBe(0);
    expect(summary.totalExpense).toBe(0);
    expect(summary.netBalance).toBe(0);
  });

  it('automatically purges leftover hardcoded demo records', () => {
    // Simulate legacy browser state where demo records were stored
    const legacyDemo = [
      {
        id: 'LEDG-1001',
        type: 'Income',
        category: 'মাসিক বেতন',
        grade: '6th',
        amount: 1500,
        voucherNo: 'REC-2026-001',
        date: '2026-08-12',
        paymentMethod: 'Cash',
        description: '৬ষ্ঠ শ্রেণির জুলাই মাসের বেতন পরিশোধ'
      },
      {
        id: 'LEDG-2001',
        type: 'Expense',
        category: 'শিক্ষক বেতন',
        grade: 'all',
        amount: 45000,
        voucherNo: 'EXP-2026-001',
        date: '2026-08-01',
        paymentMethod: 'Bank Transfer',
        description: 'সহকারী শিক্ষক ও কর্মচারী সমূহের জুলাই মাসের সম্মানী'
      }
    ];
    store['school_ledger_records'] = JSON.stringify(legacyDemo);

    // When getAllRecords is called, demo records must be purged automatically
    const cleaned = ledgerService.getAllRecords();
    expect(cleaned).toEqual([]);
    expect(store['school_ledger_records']).toBe(JSON.stringify([]));
  });

  it('preserves user-entered records while purging demo records', () => {
    const mixed = [
      {
        id: 'LEDG-1001',
        type: 'Income',
        category: 'মাসিক বেতন',
        grade: '6th',
        amount: 1500,
        voucherNo: 'REC-2026-001',
        date: '2026-08-12',
        paymentMethod: 'Cash',
        description: 'ডেমো আয়'
      },
      {
        id: 'LEDG-9988',
        type: 'Income',
        category: 'ভর্তি ফি',
        grade: '7th',
        amount: 2500,
        voucherNo: 'REC-REAL-001',
        date: '2026-09-01',
        paymentMethod: 'bKash',
        description: 'আসল ভর্তি ফি'
      }
    ];
    store['school_ledger_records'] = JSON.stringify(mixed);

    const records = ledgerService.getAllRecords();
    expect(records.length).toBe(1);
    expect(records[0].id).toBe('LEDG-9988');
    expect(records[0].amount).toBe(2500);
  });

  it('clears all records when clearAllLedgerData is called', () => {
    ledgerService.addRecord({
      type: 'Income',
      category: 'মাসিক বেতন',
      amount: 1000,
      voucherNo: 'REC-TEST-01',
      date: '2026-09-01',
      paymentMethod: 'Cash',
      description: 'টেস্ট'
    });
    expect(ledgerService.getAllRecords().length).toBe(1);

    ledgerService.clearAllLedgerData();
    expect(ledgerService.getAllRecords()).toEqual([]);
  });
});
