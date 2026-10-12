import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage and window for test environment
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

import { financeService, BankAccount } from '../src/services/financeService';
import { studentService } from '../src/services/studentService';

describe('financeService Cash & Bank Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults bank accounts to 0 balance', () => {
    const banks = financeService.getBankAccounts();
    expect(banks.length).toBeGreaterThan(0);
    banks.forEach(b => {
      expect(b.balance).toBe(0);
    });
  });

  it('automatically purges legacy demo balances (580,000, 320,000, 185,000) to 0', () => {
    const legacy = [
      { id: 'bank-1', bankName: 'সোনালী ব্যাংক পিএলসি', accountName: 'সাধারণ তহবিল', accountNumber: '1042003819201', branch: 'চকরিয়া', balance: 580000, accountCode: '1020' },
      { id: 'bank-2', bankName: 'ইসলামী ব্যাংক বাংলাদেশ', accountName: 'উন্নয়ন তহবিল', accountNumber: '2050210034891', branch: 'চকরিয়া', balance: 320000, accountCode: '1030' },
      { id: 'bank-3', bankName: 'ডাচ-বাংলা ব্যাংক', accountName: 'অনলাইন ফি', accountNumber: '1151200492100', branch: 'চকরিয়া', balance: 185000, accountCode: '1040' }
    ];
    localStorage.setItem('sms_bank_accounts', JSON.stringify(legacy));

    const cleaned = financeService.getBankAccounts();
    expect(cleaned[0].balance).toBe(0);
    expect(cleaned[1].balance).toBe(0);
    expect(cleaned[2].balance).toBe(0);
  });

  it('supports editing an existing bank account name, branch, and balance', () => {
    const banks = financeService.getBankAccounts();
    const target = banks[0];

    financeService.addOrUpdateBankAccount({
      ...target,
      bankName: 'সোনালী ব্যাংক পিএলসি (প্রধান শাখা)',
      balance: 15000,
      branch: 'কক্সবাজার সদর'
    });

    const updated = financeService.getBankAccounts();
    const found = updated.find(b => b.id === target.id);
    expect(found?.bankName).toBe('সোনালী ব্যাংক পিএলসি (প্রধান শাখা)');
    expect(found?.balance).toBe(15000);
    expect(found?.branch).toBe('কক্সবাজার সদর');
  });

  it('supports adding a new custom bank account and deleting it', () => {
    const newBank: BankAccount = {
      id: 'bank-custom-1',
      bankName: 'পূবালী ব্যাংক লিমিটেড',
      accountName: 'শিক্ষার্থী বৃত্তি তহবিল',
      accountNumber: '992011234',
      branch: 'চকরিয়া',
      accountCode: '1050',
      balance: 25000
    };

    financeService.addOrUpdateBankAccount(newBank);
    let current = financeService.getBankAccounts();
    expect(current.some(b => b.id === 'bank-custom-1')).toBe(true);

    financeService.deleteBankAccount('bank-custom-1');
    current = financeService.getBankAccounts();
    expect(current.some(b => b.id === 'bank-custom-1')).toBe(false);
  });

  it('resets all bank account balances to 0 on resetAllBankBalancesToZero', () => {
    financeService.addOrUpdateBankAccount({
      id: 'bank-1',
      bankName: 'সোনালী ব্যাংক',
      accountName: 'সাধারণ তহবিল',
      accountNumber: '111',
      branch: 'চকরিয়া',
      accountCode: '1020',
      balance: 75000
    });

    financeService.resetAllBankBalancesToZero();
    const after = financeService.getBankAccounts();
    after.forEach(b => {
      expect(b.balance).toBe(0);
    });
  });

  it('clears bank balances on clearAllFinanceData', () => {
    financeService.addOrUpdateBankAccount({
      id: 'bank-1',
      bankName: 'সোনালী ব্যাংক',
      accountName: 'সাধারণ তহবিল',
      accountNumber: '111',
      branch: 'চকরিয়া',
      accountCode: '1020',
      balance: 50000
    });

    financeService.clearAllFinanceData();
    const after = financeService.getBankAccounts();
    after.forEach(b => {
      expect(b.balance).toBe(0);
    });
  });

  it('studentService.clearAllDemoData zeroes out stored bank accounts', () => {
    const legacy = [
      { id: 'bank-1', bankName: 'সোনালী ব্যাংক', accountName: 'সাধারণ', accountNumber: '111', balance: 580000 },
      { id: 'bank-2', bankName: 'ইসলামী ব্যাংক', accountName: 'উন্নয়ন', accountNumber: '222', balance: 320000 }
    ];
    localStorage.setItem('sms_bank_accounts', JSON.stringify(legacy));

    studentService.clearAllDemoData();

    const stored = JSON.parse(localStorage.getItem('sms_bank_accounts') || '[]');
    expect(stored[0].balance).toBe(0);
    expect(stored[1].balance).toBe(0);
  });
});
