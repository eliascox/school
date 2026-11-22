import { beforeEach, describe, expect, it, vi } from 'vitest';

const store: Record<string, string> = {};
Object.defineProperty(globalThis, 'localStorage', {
  value: {
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
  },
  configurable: true,
});
Object.defineProperty(globalThis, 'window', {
  value: { dispatchEvent: () => true, location: { origin: 'http://localhost:3000' } },
  configurable: true,
});

import { paymentGatewayService } from '../src/services/paymentGatewayService';
import { homeworkService } from '../src/services/homeworkService';
import { libraryService } from '../src/services/libraryService';
import { alumniService } from '../src/services/alumniService';
import { financeService } from '../src/services/financeService';
import {
  buildBANBEISData,
  buildEMISWorkbook,
  buildStipendBoardWorkbook,
} from '../src/lib/boardExcelExport';
import type { Student } from '../src/services/studentService';
import type { SchoolSettings } from '../src/services/settingsService';

const sampleStudent: Student = {
  id: 'STU-900',
  name: 'মাহমুদ হাসান',
  roll: '11',
  grade: '8th',
  section: 'A',
  branch: 'A',
  group: 'সাধারণ',
  guardian: 'আবুল হাসান',
  mobile: '01755555555',
  gender: 'ছাত্র',
  religion: 'ইসলাম',
};

const sampleSettings: SchoolSettings = {
  schoolName: 'বরইতলী উচ্চ বিদ্যালয়',
  eiin: '104920',
  address: 'চকরিয়া, কক্সবাজার',
  estdYear: '১৯৬৮',
} as SchoolSettings;

describe('Phase 3 Core Modules & Exports Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('paymentGatewayService verifies online payment, creates receipt & journal, and resolves findReceiptById', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        mode: 'sandbox',
        verified: true,
        trxId: 'BKASH12345',
        signature: 'SIG998877',
      }),
    }) as unknown as typeof fetch;

    const bad = await paymentGatewayService.verifyAndSettlePayment({
      provider: 'bKash',
      student: sampleStudent,
      amount: 500,
      trxId: '123',
      monthsPaid: ['জানুয়ারি'],
    });
    expect(bad.success).toBe(false);

    const res = await paymentGatewayService.verifyAndSettlePayment({
      provider: 'bKash',
      student: sampleStudent,
      amount: 500,
      trxId: 'BKASH12345',
      monthsPaid: ['জানুয়ারি'],
    });
    expect(res.success).toBe(true);
    expect(res.receipt?.receiptId).toMatch(/^REC-/);

    const fetched = paymentGatewayService.findReceiptById(res.receipt!.receiptId);
    expect(fetched?.studentId).toBe('STU-900');
    expect(fetched?.paidAmount).toBe(500);
    expect(financeService.getVouchers().length).toBeGreaterThan(0);
  });

  it('homeworkService creates, toggles student submissions, archives, and filters cleanly', () => {
    const created = homeworkService.createHomework({
      title: 'অধ্যায় ৩ অনুশীলনী',
      description: 'সব অংক সমাধান করবে',
      grade: '8th',
      section: 'A',
      subject: 'গণিত',
      teacherName: 'নাজমুল হক',
      dueDate: '2026-11-25',
    });
    expect(created.success).toBe(true);
    const hwId = created.homework!.id;

    const toggled = homeworkService.toggleStudentSubmission(hwId, 'STU-900');
    expect(toggled?.submittedStudentIds).toContain('STU-900');

    homeworkService.toggleArchive(hwId);
    expect(homeworkService.getHomeworks({ includeArchived: false })).toHaveLength(0);
    expect(homeworkService.getHomeworks({ includeArchived: true })).toHaveLength(1);
  });

  it('libraryService handles book issue, overdue fine calculation, and finance voucher sync on return', () => {
    const added = libraryService.addBook({
      accessionNo: 'ACC-101',
      title: 'সাতকাহন',
      author: 'সমরেশ মজুমদার',
      category: 'উপন্যাস',
      shelfNo: 'B-2',
      totalCopies: 2,
    });
    expect(added.success).toBe(true);
    const bookId = added.book!.id;

    const issueRes = libraryService.issueBook({
      bookId,
      borrowerType: 'student',
      borrowerId: 'STU-900',
      borrowerName: 'মাহমুদ হাসান',
      borrowerMeta: '8th • রোল ১১',
      issueDate: '2026-11-01',
      dueDate: '2026-11-05',
      finePerDay: 10,
    });
    expect(issueRes.success).toBe(true);
    expect(libraryService.getBooks()[0].availableCopies).toBe(1);

    // Deleting actively loaned book must be rejected
    expect(libraryService.deleteBook(bookId).success).toBe(false);

    const retRes = libraryService.returnBook(issueRes.loan!.id, '2026-11-09', true);
    expect(retRes.success).toBe(true);
    expect(retRes.fineAmount).toBe(40); // 4 days overdue * 10
    expect(libraryService.getBooks()[0].availableCopies).toBe(2);
    expect(financeService.getVouchers().some((v) => v.sourceModule === 'library' && v.totalAmount === 40)).toBe(true);
  });

  it('alumniService archives graduates without duplication and boardExcelExport builds valid workbooks', () => {
    const femaleSciStudent: Student = {
      id: 'STU-901',
      name: 'নুসরাত জাহান',
      roll: '01',
      grade: '10th',
      section: 'Science',
      group: 'বিজ্ঞান',
      guardian: 'রফিক উদ্দিন',
      mobile: '01766666666',
      gender: 'ছাত্রী',
      isStipend: true,
      stipendCategory: 'মেধাবৃত্তি',
    };

    const firstCount = alumniService.archiveGraduatingStudents([sampleStudent, femaleSciStudent], '2026', 'SSC-2026');
    const secondCount = alumniService.archiveGraduatingStudents([sampleStudent, femaleSciStudent], '2026', 'SSC-2026');
    expect(firstCount).toBe(2);
    expect(secondCount).toBe(0);
    expect(alumniService.getAlumni()).toHaveLength(2);

    const { wb, summaryRows } = buildBANBEISData([sampleStudent, femaleSciStudent], sampleSettings);
    expect(wb.SheetNames).toEqual(['School_Info', 'BANBEIS_Summary', 'Student_Roster']);
    const class10Row = summaryRows.find((r) => r.শ্রেণি.includes('10th'));
    expect(class10Row?.মোট_শিক্ষার্থী).toBe(1);
    expect(class10Row?.ছাত্রী).toBe(1);
    expect(class10Row?.বিজ্ঞান).toBe(1);
    expect(class10Row?.উপবৃত্তিপ্রাপ্ত).toBe(1);

    const emisWb = buildEMISWorkbook([sampleStudent], sampleSettings);
    expect(emisWb.SheetNames).toContain('EMIS_Students');

    const stipendWb = buildStipendBoardWorkbook(
      [{ ...femaleSciStudent, attRate: 92, examScore: 84, monthlyAmount: 600, isEligible: true }],
      sampleSettings
    );
    expect(stipendWb.SheetNames).toContain('Upobritti_Stipend_List');
  });
});
