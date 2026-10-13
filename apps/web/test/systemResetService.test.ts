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

import { systemResetService } from '../src/services/systemResetService';
import { studentService } from '../src/services/studentService';
import { financeService } from '../src/services/financeService';
import { ledgerService } from '../src/services/ledgerService';

describe('systemResetService multi-layer synchronized purge', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('completely wipes all layers of data and records the security comment', () => {
    // Seed multi-layer data
    localStorage.setItem('sms_students', JSON.stringify([{ id: 'ST-1', name: 'করিম', roll: '01' }]));
    localStorage.setItem('sms_marks_half_yearly_6th_A_gen_01', JSON.stringify({ math: 85 }));
    localStorage.setItem('sms_marks_annual_7th_B_sci_02', JSON.stringify({ science: 90 }));
    localStorage.setItem('attendance_records_v1', JSON.stringify([{ id: 'att-1' }]));
    localStorage.setItem('sms_attendance_2026-10-12_6th-A', JSON.stringify([{ id: 'att-2' }]));
    localStorage.setItem('school_ledger_records', JSON.stringify([{ id: 'LEDG-1001', amount: 5000 }]));
    localStorage.setItem('sms_payment_history', JSON.stringify([{ id: 'PAY-1' }]));
    localStorage.setItem('sms_vouchers_ledger', JSON.stringify([{ id: 'V-1' }]));
    localStorage.setItem('sms_bank_accounts', JSON.stringify([
      { id: 'bank-1', bankName: 'সোনালী ব্যাংক', balance: 580000, accountCode: '1020' },
      { id: 'bank-2', bankName: 'ইসলামী ব্যাংক', balance: 320000, accountCode: '1030' }
    ]));
    localStorage.setItem('school_notices_v1', JSON.stringify([{ id: 'N-1' }]));
    localStorage.setItem('sms_certificate_101', JSON.stringify({ certNo: 'CERT-001' }));

    const comment = 'বার্ষিক পরীক্ষা শেষে সম্পূর্ণ ডাটা ক্লিন রিসেট';
    const report = systemResetService.purgeAllSystemData(comment, 'অধ্যক্ষ মহোদয়');

    expect(report.success).toBe(true);
    expect(report.comment).toBe(comment);
    expect(report.performedBy).toBe('অধ্যক্ষ মহোদয়');
    expect(report.purgedLayers.length).toBeGreaterThanOrEqual(7);

    // 1. Student layer verified empty
    expect(studentService.getAllStudents()).toEqual([]);

    // 2. Marks verified purged
    expect(localStorage.getItem('sms_marks_half_yearly_6th_A_gen_01')).toBeNull();
    expect(localStorage.getItem('sms_marks_annual_7th_B_sci_02')).toBeNull();

    // 3. Attendance verified purged
    expect(JSON.parse(localStorage.getItem('attendance_records_v1') || '[]')).toEqual([]);
    expect(localStorage.getItem('sms_attendance_2026-10-12_6th-A')).toBeNull();

    // 4. Ledger and finance verified empty
    expect(ledgerService.getAllRecords()).toEqual([]);
    expect(financeService.getVouchers()).toEqual([]);
    expect(financeService.getExpenses()).toEqual([]);

    // 5. Bank balances verified 0
    const banks = financeService.getBankAccounts();
    banks.forEach(b => expect(b.balance).toBe(0));

    // 6. Notices verified empty
    expect(JSON.parse(localStorage.getItem('sms_notices') || '[]')).toEqual([]);

    // 7. Flags set
    expect(localStorage.getItem('sms_demo_cleared')).toBe('true');
    expect(localStorage.getItem('sms_fresh_install_mode')).toBe('true');

    // 8. Audit log records the comment
    const auditLogs = JSON.parse(localStorage.getItem('sms_audit_logs') || '[]');
    expect(auditLogs.length).toBeGreaterThan(0);
    const lastLog = auditLogs[auditLogs.length - 1];
    expect(lastLog.action).toBe('MASTER_SYSTEM_DATA_PURGE');
    expect(lastLog.details).toContain(comment);
    expect(lastLog.performedBy).toBe('অধ্যক্ষ মহোদয়');
  });

  it('studentService.clearAllDemoData delegates to systemResetService with comment', () => {
    localStorage.setItem('sms_students', JSON.stringify([{ id: 'ST-99', name: 'রহিম' }]));
    localStorage.setItem('school_ledger_records', JSON.stringify([{ id: 'LEDG-99', amount: 100 }]));

    const report = studentService.clearAllDemoData('নতুন শিক্ষাবর্ষের ফ্রেশ স্টার্ট', 'প্রধান শিক্ষক');
    expect(report.success).toBe(true);
    expect(report.comment).toBe('নতুন শিক্ষাবর্ষের ফ্রেশ স্টার্ট');

    expect(studentService.getAllStudents()).toEqual([]);
    expect(ledgerService.getAllRecords()).toEqual([]);
  });
});
