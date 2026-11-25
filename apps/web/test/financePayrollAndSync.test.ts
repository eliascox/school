import { describe, it, expect, beforeEach } from 'vitest';

const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
  removeItem: (k: string) => {
    delete store[k];
  },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
  get length() {
    return Object.keys(store).length;
  },
  key: (i: number) => Object.keys(store)[i] ?? null,
};
(globalThis as any).window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

import { financeService, PayrollRecord } from '../src/services/financeService';
import { ledgerService } from '../src/services/ledgerService';
import { studentService, Student } from '../src/services/studentService';
import {
  buildMonthlyPayrollDrafts,
  computePayrollBreakdown,
  getStaffMonthlyApprovedLeaveDays,
  inferStaffCategory,
  saveStaffSalaryProfile,
} from '../src/lib/payrollEngine';
import { buildSyncedStipendList } from '../src/lib/stipendSyncUtils';
import { TeacherRecord } from '../src/services/teacherRBACService';

describe('Finance, Payroll Engine & Cross-Module Sync Integrity Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Payroll Engine Validation & HR/Leave Sync', () => {
    it('validates gross > 0 and rejects deductions exceeding gross salary', () => {
      const zeroRes = computePayrollBreakdown({
        baseSalary: 0,
        allowances: 0,
        bonus: 0,
        pfDeduction: 0,
      });
      expect(zeroRes.valid).toBe(false);

      const overDeduct = computePayrollBreakdown({
        baseSalary: 10000,
        allowances: 2000,
        bonus: 0,
        pfDeduction: 10000,
        otherDeduction: 3000,
      });
      expect(overDeduct.valid).toBe(false);

      const validRes = computePayrollBreakdown({
        baseSalary: 20000,
        allowances: 3000,
        bonus: 2000,
        pfDeduction: 1000,
        otherDeduction: 500,
      });
      expect(validRes.valid).toBe(true);
      expect(validRes.grossSalary).toBe(25000);
      expect(validRes.totalDeductions).toBe(1500);
      expect(validRes.netPayable).toBe(23500);
    });

    it('distinguishes Teacher (5010) vs Office Staff (5020) designations accurately', () => {
      expect(inferStaffCategory('সহকারী শিক্ষক (গণিত)')).toBe('teacher');
      expect(inferStaffCategory('প্রধান শিক্ষক')).toBe('teacher');
      expect(inferStaffCategory('অফিস সহকারী কাম কম্পিউটার অপারেটর')).toBe('staff');
      expect(inferStaffCategory('নৈশপ্রহরী')).toBe('staff');
      expect(inferStaffCategory('হিসাবরক্ষক')).toBe('staff');
    });

    it('counts approved monthly leave days and builds bulk Pending payroll drafts without duplicates', () => {
      localStorage.setItem(
        'sms_teacher_leave_applications',
        JSON.stringify([
          {
            id: 'LV-1',
            teacherId: 'TCH-01',
            teacherName: 'মোঃ কামাল উদ্দিন',
            designation: 'সহকারী শিক্ষক',
            leaveType: 'medical',
            startDate: '2026-08-10',
            endDate: '2026-08-12',
            totalDays: 3,
            reason: 'জ্বর',
            status: 'approved',
            appliedAt: '2026-08-09',
          },
          {
            id: 'LV-2',
            teacherId: 'TCH-01',
            teacherName: 'মোঃ কামাল উদ্দিন',
            designation: 'সহকারী শিক্ষক',
            leaveType: 'casual',
            startDate: '2026-08-15',
            endDate: '2026-08-15',
            totalDays: 1,
            reason: 'ব্যক্তিগত',
            status: 'pending',
            appliedAt: '2026-08-14',
          },
        ])
      );

      expect(getStaffMonthlyApprovedLeaveDays('TCH-01', 'মোঃ কামাল উদ্দিন', 'আগস্ট', 2026)).toBe(3);

      saveStaffSalaryProfile({
        teacherId: 'TCH-01',
        staffCategory: 'teacher',
        baseSalary: 20000,
        houseRent: 4000,
        medicalAllowance: 1000,
        otherAllowance: 0,
        pfPercent: 5,
        defaultPaymentMethod: 'Bank Transfer',
        bankAccountId: 'bank-2',
      });

      const teachers: TeacherRecord[] = [
        {
          id: 'TCH-01',
          name: 'মোঃ কামাল উদ্দিন',
          designation: 'সহকারী শিক্ষক',
          subjectSpecialty: 'গণিত',
          phone: '01700000001',
          email: 'kamal@school.edu',
          dob: '1988-05-10',
          status: 'active',
          passwordHash: 'hash1',
          mustChangePassword: false,
          createdAt: '2026-01-01',
        },
        {
          id: 'TCH-02',
          name: 'রফিকুল ইসলাম',
          designation: 'অফিস সহকারী',
          phone: '01700000002',
          email: 'rafiq@school.edu',
          dob: '1990-03-12',
          status: 'active',
          passwordHash: 'hash2',
          mustChangePassword: false,
          createdAt: '2026-01-01',
        },
      ];

      const { createdDrafts, skippedNoSalary, skippedExisting } = buildMonthlyPayrollDrafts({
        teachers,
        existingPayrolls: [],
        month: 'আগস্ট',
        year: 2026,
      });

      expect(createdDrafts.length).toBe(1);
      expect(skippedNoSalary).toBe(1);
      expect(skippedExisting).toBe(0);
      expect(createdDrafts[0].status).toBe('Pending');
      expect(createdDrafts[0].baseSalary + createdDrafts[0].allowances + createdDrafts[0].bonus).toBe(25000);
      expect(createdDrafts[0].pfDeduction).toBe(1000); // 5% of 20,000
      expect(createdDrafts[0].netPayable).toBe(24000);
      expect(createdDrafts[0].approvedLeaveDays).toBe(3);
    });
  });

  describe('2. Payroll Double-Entry Lifecycle, COA Split & Cascade Rollback', () => {
    it('does not post voucher for Pending payroll, posts exact COA split on Disburse, and cascades on Delete', () => {
      const pendingStaffPay: PayrollRecord = {
        id: 'PAY-STAFF-1',
        teacherId: 'STF-10',
        teacherName: 'জামাল হোসেন',
        designation: 'অফিস সহকারী',
        staffCategory: 'staff',
        month: 'সেপ্টেম্বর',
        year: 2026,
        baseSalary: 15000,
        allowances: 2000,
        bonus: 1000,
        pfDeduction: 750,
        otherDeduction: 250,
        deductions: 1000,
        netPayable: 17000,
        paidAmount: 0,
        paymentDate: '2026-09-30',
        paymentMethod: 'Bank Transfer',
        bankAccountId: 'bank-2', // Islami Bank -> COA 1030
        status: 'Pending',
        voucherNo: 'PV-202609-9901',
      };

      financeService.savePayrollRecord(pendingStaffPay);
      expect(financeService.getVouchers().length).toBe(0);
      expect(ledgerService.getAllRecords().length).toBe(0);

      // Disburse Pending -> Paid
      const disbursed = financeService.disbursePayrollRecord('PAY-STAFF-1', {
        paymentMethod: 'Bank Transfer',
        bankAccountId: 'bank-2',
      });
      expect(disassembledOrPaid(disbursed)).toBe('Paid');

      const vouchers = financeService.getVouchers();
      expect(vouchers.length).toBe(1);
      const pv = vouchers[0];
      // Verify Office Staff expense hits 5020, PF hits 2020, Agrani Bank hits 1030
      const expLine = pv.entries.find((e) => e.accountCode === '5020');
      const pfLine = pv.entries.find((e) => e.accountCode === '2020');
      const bankLine = pv.entries.find((e) => e.accountCode === '1030');
      expect(expLine?.debit).toBe(17750); // gross 18000 - otherDeduction 250
      expect(pfLine?.credit).toBe(750);
      expect(bankLine?.credit).toBe(17000);
      expect(financeService.getTrialBalance().isBalanced).toBe(true);

      // Synced to General Ledger
      const glRecords = ledgerService.getAllRecords();
      expect(glRecords.some((r) => r.voucherNo === 'PV-202609-9901' && r.amount === 17000)).toBe(true);

      // Delete Payroll -> cascades cleanly from both vouchers & ledgerService
      financeService.deletePayrollRecord('PAY-STAFF-1');
      expect(financeService.getVouchers().length).toBe(0);
      expect(ledgerService.getAllRecords().length).toBe(0);
    });
  });

  describe('3. Reconciled Treasury & Bidirectional Contra Transfers', () => {
    it('computes net Cash, Bank, bKash, and Nagad balances after inflows, outflows, and Contra transfers', () => {
      // Collect ৳10,000 via bKash and ৳5,000 via Cash
      financeService.postFeeReceiptJournal({
        receiptId: 'REC-T1',
        studentName: 'আরিফ',
        roll: '1',
        grade: '6th',
        paidAmount: 10000,
        subtotal: 10000,
        discount: 0,
        paymentMethod: 'bKash',
        feeItems: [{ name: 'মাসিক বেতন', amount: 10000 }],
        date: '2026-10-01',
        collectedBy: 'ক্যাশিয়ার',
      });

      financeService.postFeeReceiptJournal({
        receiptId: 'REC-T2',
        studentName: 'সাকিব',
        roll: '2',
        grade: '7th',
        paidAmount: 5000,
        subtotal: 5000,
        discount: 0,
        paymentMethod: 'Cash',
        feeItems: [{ name: 'মাসিক বেতন', amount: 5000 }],
        date: '2026-10-01',
        collectedBy: 'ক্যাশিয়ার',
      });

      // Spend ৳2,000 from bKash
      financeService.saveExpense({
        id: 'EXP-1',
        voucherNo: 'EV-202610-01',
        category: 'ইন্টারনেট ও সফটওয়্যার সেবা',
        amount: 2000,
        date: '2026-10-02',
        paidTo: 'ব্রডব্যান্ড আইএসপি',
        paymentMethod: 'bKash',
        note: 'ইন্টারনেট বিল',
        recordedBy: 'প্রধান শিক্ষক',
      });

      // Transfer ৳3,000 from bKash (1050) -> Sonali Bank (1020)
      financeService.postContraJournal({
        from: 'বিকাশ (1050)',
        to: 'সোনালী ব্যাংক (1020)',
        date: '2026-10-03',
        amount: 3000,
        fromAccountCode: '1050',
        toAccountCode: '1020',
        refNo: 'REF-TR-01',
        note: 'বিকাশ সেটেলমেন্ট',
      });

      // Reject invalid same-account or zero contra
      expect(() =>
        financeService.postContraJournal({
          from: 'ক্যাশ',
          to: 'ক্যাশ',
          date: '2026-10-03',
          amount: 1000,
          fromAccountCode: '1010',
          toAccountCode: '1010',
          refNo: 'ERR-1',
          note: 'Invalid transfer',
        })
      ).toThrow();

      const summary = financeService.getReconciledTreasurySummary();
      expect(summary.cashInHand).toBe(5000);
      expect(summary.bkashBalance).toBe(5000); // 10000 - 2000 - 3000
      expect(summary.bankBalances['bank-1']).toBe(3000);
      expect(summary.totalLiquidFunds).toBe(13000); // 5000 cash + 5000 bkash + 3000 bank
      expect(financeService.getTrialBalance().isBalanced).toBe(true);

      // Bank Transfer Fee Receipt targeted to specific bank (bank-2 -> COA 1030)
      financeService.postFeeReceiptJournal({
        receiptId: 'REC-BANK-2',
        studentName: 'মাহমুদ',
        roll: '3',
        grade: '8th',
        paidAmount: 4500,
        subtotal: 4500,
        discount: 0,
        paymentMethod: 'Bank Transfer',
        bankAccountId: 'bank-2',
        feeItems: [{ name: 'মাসিক বেতন', amount: 4500 }],
        date: '2026-10-04',
        collectedBy: 'ক্যাশিয়ার',
      });

      const updatedSummary = financeService.getReconciledTreasurySummary();
      expect(updatedSummary.bankBalances['bank-2']).toBe(4500);
      expect(financeService.getBankBook('1030').closingBalance).toBe(4500);
      expect(financeService.getTrialBalance().isBalanced).toBe(true);
    });
  });

  describe('4. Waivers-to-Ledger Live Sync, Multi-Item Invoices, Refunds & Manual Ledger Sync', () => {
    it('syncs approved waivers into student ledgers live and restores dues when deleted', () => {
      const testStudent: Student = {
        id: 'STD-WAIV-1',
        roll: '10',
        name: 'তানভীর আহমেদ',
        grade: '8th',
        section: 'A',
        group: 'সাধারণ',
        mobile: '01811111111',
        isStipend: false,
      };
      localStorage.setItem('sms_students', JSON.stringify([testStudent]));

      const beforeLedgers = financeService.getAllStudentLedgers();
      const baseDue = beforeLedgers['STD-WAIV-1'].totalDue;
      expect(baseDue).toBeGreaterThan(0);

      // Apply 50% waiver
      financeService.saveWaiver({
        id: 'WAIV-01',
        studentId: 'STD-WAIV-1',
        studentName: 'তানভীর আহমেদ',
        roll: '10',
        grade: '8th',
        type: 'percent',
        value: 50,
        reason: 'ভাই-বোন ছাড়',
        approvedBy: 'প্রধান শিক্ষক',
        date: '2026-01-01',
      });

      const afterWaiverLedgers = financeService.getAllStudentLedgers();
      expect(afterWaiverLedgers['STD-WAIV-1'].appliedWaiverId).toBe('WAIV-01');
      expect(afterWaiverLedgers['STD-WAIV-1'].totalDue).toBeLessThan(baseDue);

      // Delete waiver -> original due restored
      financeService.deleteWaiver('WAIV-01');
      const restoredLedgers = financeService.getAllStudentLedgers();
      expect(restoredLedgers['STD-WAIV-1'].appliedWaiverId).toBeUndefined();
      expect(restoredLedgers['STD-WAIV-1'].totalDue).toBe(baseDue);
    });

    it('pays multi-item invoice without violating Debit===Credit and syncs payment history & ledger', () => {
      financeService.saveInvoices([
        {
          id: 'INV-MULTI-1',
          invoiceNo: 'INV-202610-001',
          studentId: 'STD-INV-1',
          studentName: 'নাদিয়া সুলতানা',
          roll: '04',
          grade: '9th',
          section: 'A',
          month: 'অক্টোবর',
          year: 2026,
          issueDate: '2026-10-01',
          dueDate: '2026-10-15',
          items: [
            { sectorId: 'tuition', name: 'মাসিক বেতন', amount: 500, discount: 0, netAmount: 500 },
            { sectorId: 'exam', name: 'পরীক্ষা ফি', amount: 400, discount: 0, netAmount: 400 },
          ],
          subtotal: 900,
          totalDiscount: 0,
          totalPayable: 900,
          netPayable: 900,
          totalPaid: 0,
          paidAmount: 0,
          dueAmount: 900,
          status: 'unpaid',
          payments: [],
          createdAt: '2026-10-01T00:00:00.000Z',
        },
      ]);

      // Partial payment on multi-item invoice (previously crashed Debit !== Credit!)
      const paidResult = financeService.payInvoice('INV-MULTI-1', {
        amount: 600,
        paymentMethod: 'Cash',
        collectedBy: 'ক্যাশিয়ার',
      });
      expect(paidResult?.invoice.status).toBe('partial');
      expect(paidResult?.invoice.paidAmount).toBe(600);
      expect(financeService.getPaymentHistory().length).toBe(1);
      expect(financeService.getTrialBalance().isBalanced).toBe(true);
    });

    it('syncs Refunds and Manual General Ledger entries bidirectionally and cascades deletions', () => {
      financeService.saveRefund({
        id: 'REF-01',
        receiptId: 'REC-101',
        studentId: 'STD-1',
        studentName: 'হাসান',
        amount: 400,
        reason: 'ডুপ্লিকেট পেমেন্ট',
        date: '2026-10-05',
        processedBy: 'ক্যাশিয়ার',
        paymentMethod: 'Cash',
      });

      expect(financeService.getVouchers().some((v) => v.sourceId === 'REF-01')).toBe(true);
      expect(ledgerService.getAllRecords().some((r) => r.sourceId === 'REF-01')).toBe(true);

      financeService.deleteRefund('REF-01');
      expect(financeService.getVouchers().some((v) => v.sourceId === 'REF-01')).toBe(false);
      expect(ledgerService.getAllRecords().some((r) => r.sourceId === 'REF-01')).toBe(false);

      // Manual General Ledger entry posts balanced voucher and deletes cleanly
      const added = ledgerService.addRecord({
        type: 'Income',
        category: 'অন্যান্য আয়',
        grade: 'all',
        amount: 2500,
        voucherNo: 'GL-INC-101',
        date: '2026-10-06',
        paymentMethod: 'Cash',
        description: 'পুরাতন কাগজ বিক্রি',
        sourceModule: 'manual_voucher',
      });
      financeService.postManualLedgerEntryJournal(added);
      expect(financeService.getIncomeStatement().totalIncome).toBe(2500);
      expect(financeService.getTrialBalance().isBalanced).toBe(true);

      financeService.deleteManualLedgerVoucher(added.id, added.voucherNo);
      expect(financeService.getIncomeStatement().totalIncome).toBe(0);
    });
  });

  describe('5. Real Data-Synced Stipend Evaluation & Revocation Sync', () => {
    it('does not fabricate fake stipend flags/metrics and cleanly revokes stipends in both Stipend and Fee Ledgers', () => {
      const students: Student[] = [
        {
          id: 'ST-REAL-1',
          roll: '01',
          name: 'সুমাইয়া আক্তার',
          grade: '6th',
          section: 'A',
          group: 'সাধারণ',
          isStipend: true,
          stipendCategory: 'মেধাভিত্তিক উপবৃত্তি',
          stipendStatus: 'Active',
          gpa: '4.50',
        },
        {
          id: 'ST-REAL-2',
          roll: '02',
          name: 'রিয়াদ হোসেন',
          grade: '6th',
          section: 'A',
          group: 'সাধারণ',
          // Neither stipend nor attendance nor GPA recorded
        },
      ];
      localStorage.setItem('sms_students', JSON.stringify(students));

      // Seed real attendance logs for ST-REAL-1 (4/5 days = 80%)
      for (let d = 1; d <= 5; d++) {
        localStorage.setItem(
          `sms_attendance_6th_A_2026-10-0${d}`,
          JSON.stringify([
            { id: 'ST-REAL-1', status: d <= 4 ? 'Present' : 'Absent' },
          ])
        );
      }

      const synced = buildSyncedStipendList(students);
      const st1 = synced.find((s) => s.id === 'ST-REAL-1')!;
      const st2 = synced.find((s) => s.id === 'ST-REAL-2')!;

      expect(st1.isStipend).toBe(true);
      expect(st1.attRate).toBe(80);
      expect(st1.examScore).toBe(90); // 4.50 / 5 * 100
      expect(st1.isEligible).toBe(true);

      // No fake modulo stipend or fabricated attendance/exam for ST-REAL-2
      expect(st2.isStipend).toBe(false);
      expect(st2.attRate).toBeNull();
      expect(st2.examScore).toBeNull();

      // Revoking stipend must clear stipendCategory & update both Stipend and Fee Ledger!
      studentService.toggleStipendStatus('ST-REAL-1', false);
      const refreshedStudents = studentService.getAllStudents();
      const revoked = refreshedStudents.find((s) => s.id === 'ST-REAL-1')!;
      expect(revoked.isStipend).toBe(false);
      expect(revoked.stipendCategory).toBeUndefined();
      expect(revoked.stipendStatus).toBe('Revoked');

      const postRevokeStipend = buildSyncedStipendList(refreshedStudents).find((s) => s.id === 'ST-REAL-1')!;
      expect(postRevokeStipend.isStipend).toBe(false);

      financeService.syncStudentLedgersWithClassFees();
      const postRevokeLedger = financeService.getAllStudentLedgers()['ST-REAL-1'];
      expect(postRevokeLedger.isStipend).toBe(false);
      expect(postRevokeLedger.months.every((m) => m.status !== 'waived')).toBe(true);
    });
  });
});

function disassembledOrPaid(record: PayrollRecord | null): string | undefined {
  return record?.status;
}
