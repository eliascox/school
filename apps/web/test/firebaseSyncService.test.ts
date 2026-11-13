import { describe, it, expect, beforeEach } from 'vitest';

const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};
(globalThis as any).sessionStorage = (globalThis as any).localStorage;
(globalThis as any).window = globalThis;
(globalThis as any).window.dispatchEvent = () => true;

try {
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: true },
    configurable: true,
    writable: true
  });
} catch {}

import { firebaseSyncService } from '../src/services/firebaseSyncService';
import { isFirebaseConfigured, firebaseConfig } from '../src/lib/firebase';
import { studentService } from '../src/services/studentService';
import { canonicalizeLocalStorageKeys } from '../src/lib/storageMigration';
import { backupService } from '../src/services/backupService';

describe('firebaseSyncService Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('verifies that Firebase is properly configured with project bhsedu-e0906', () => {
    expect(isFirebaseConfigured()).toBe(true);
    expect(firebaseConfig.projectId).toBe('bhsedu-e0906');
    expect(firebaseConfig.authDomain).toContain('bhsedu-e0906.firebaseapp.com');
  });

  it('retrieves live status matching configured project', () => {
    const status = firebaseSyncService.getStatus();
    expect(status.isConfigured).toBe(true);
    expect(status.projectId).toBe('bhsedu-e0906');
  });

  it('allows safe local student mutations without throwing network errors', () => {
    const student = studentService.addStudent({
      name: 'সাকিব আল হাসান',
      roll: '১',
      grade: '9th',
      section: 'A',
      group: 'বিজ্ঞান'
    });

    expect(student.id).toBeDefined();
    expect(student.name).toBe('সাকিব আল হাসান');

    const all = studentService.getAllStudents();
    expect(all.length).toBe(1);

    const updateRes = studentService.updateStudent({
      ...student,
      mobile: '01712345678'
    });
    expect(updateRes).toBe(true);

    const delRes = studentService.deleteStudent(student.id);
    expect(delRes).toBe(true);
    expect(studentService.getAllStudents().length).toBe(0);
  });

  it('safely handles fetchLandingPageCloudData and subscribeLandingPageCloud without throwing', async () => {
    const cloudData = await firebaseSyncService.fetchLandingPageCloudData();
    expect(cloudData).toBeDefined();

    let receivedUpdate = false;
    const unsub = firebaseSyncService.subscribeLandingPageCloud((data) => {
      receivedUpdate = true;
    });

    expect(typeof unsub).toBe('function');
    unsub();

    // Verify settings and landing config cloud sync signatures
    await expect(firebaseSyncService.syncSettingsToCloud({ schoolName: 'বাঘমারা উচ্চ বিদ্যালয়' })).resolves.not.toThrow();
    await expect(firebaseSyncService.syncNoticeToCloud({
      id: 'NOT-1',
      title: 'টেস্ট নোটিশ',
      content: 'টেস্ট বিবরণ',
      category: 'general',
      targetAudience: 'all',
      priority: 'normal',
      publisherName: 'প্রধান শিক্ষক',
      publisherRole: 'প্রধান শিক্ষক',
      publishedAt: new Date().toISOString(),
      isPinned: false
    })).resolves.not.toThrow();
    await expect(firebaseSyncService.deleteNoticeFromCloud('NOT-1')).resolves.not.toThrow();
  });

  it('idempotently canonicalizes legacy localStorage keys without overwriting canonical data', () => {
    localStorage.setItem('students', JSON.stringify([{ id: 'STD-LEG', name: 'Legacy Student', grade: '6th', roll: '01' }]));
    localStorage.setItem('sms_uploaded_students', JSON.stringify([{ id: 'STD-UP', name: 'Uploaded Student', grade: '7th', roll: '02' }]));
    localStorage.setItem('teachers_v1', JSON.stringify([{ id: 'T-1', name: 'Teacher One' }]));
    localStorage.setItem('school_notices_v1', JSON.stringify([{ id: 'N-1', title: 'Old Notice' }]));
    localStorage.setItem('school_settings_v1', JSON.stringify({ schoolName: 'Test School' }));
    localStorage.setItem('sms_expense_records', JSON.stringify([{ id: 'EXP-1', category: 'Chalk', amount: 150, date: '2026-11-01', paidTo: 'Shop' }]));
    localStorage.setItem('sms_teacher_leaves', JSON.stringify([{ id: 'LV-1', teacherId: 'T-1', teacherName: 'Teacher One', leaveType: 'casual', startDate: '2026-11-05', endDate: '2026-11-06', totalDays: 2, reason: 'Personal work', status: 'Pending' }]));

    const firstPass = canonicalizeLocalStorageKeys();
    expect(firstPass.migratedKeys.length).toBeGreaterThanOrEqual(6);

    const students = JSON.parse(localStorage.getItem('sms_students') || '[]');
    expect(students.map((s: any) => s.id)).toEqual(expect.arrayContaining(['STD-LEG', 'STD-UP']));
    expect(localStorage.getItem('students')).toBeNull();
    expect(localStorage.getItem('sms_uploaded_students')).toBeNull();
    expect(JSON.parse(localStorage.getItem('sms_rbac_teachers') || '[]')).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('sms_notices') || '[]')).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('sms_school_settings') || '{}').schoolName).toBe('Test School');
    expect(JSON.parse(localStorage.getItem('sms_expenses') || '[]')).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('sms_teacher_leave_applications') || '[]')).toHaveLength(1);

    // Running again is an idempotent no-op
    const secondPass = canonicalizeLocalStorageKeys();
    expect(secondPass.migratedKeys).toEqual([]);

    // Never overwrites non-empty canonical arrays
    localStorage.setItem('teachers_v1', JSON.stringify([{ id: 'T-OLD', name: 'Stale' }]));
    canonicalizeLocalStorageKeys();
    expect(JSON.parse(localStorage.getItem('sms_rbac_teachers') || '[]')[0].id).toBe('T-1');
  });

  it('backupService reads stats & operational data from canonical sms_* storage keys', () => {
    localStorage.setItem('sms_students', JSON.stringify([{ id: 'S-1', name: 'Amina', grade: '6th', roll: '01' }]));
    localStorage.setItem('sms_rbac_teachers', JSON.stringify([{ id: 'T-1', name: 'Karim' }]));
    localStorage.setItem('sms_fee_invoices', JSON.stringify([{ id: 'INV-1', studentId: 'S-1', studentName: 'Amina', totalPayable: 500, totalPaid: 500, dueAmount: 0, status: 'paid' }]));
    localStorage.setItem('sms_marks_Annual_6th_A_সাধারণ_BAN-601', JSON.stringify([{ studentId: 'S-1', cq: 60 }, { studentId: 'S-2', cq: 55 }]));
    localStorage.setItem('sms_attendance_2026-11-10_6th-A', JSON.stringify([{ studentId: 'S-1', status: 'Present' }]));
    localStorage.setItem('sms_notices', JSON.stringify([{ id: 'N-1', title: 'Holiday' }]));
    localStorage.setItem('sms_school_settings', JSON.stringify({ schoolName: 'Ideal High School' }));

    const stats = backupService.getDatabaseStats();
    expect(stats.studentsCount).toBe(1);
    expect(stats.teachersCount).toBe(1);
    expect(stats.markEntriesCount).toBe(2);
    expect(stats.attendanceDaysCount).toBe(1);
    expect(stats.noticesCount).toBe(1);

    const op = backupService.getWebOperationalData();
    expect(op.students).toHaveLength(1);
    expect(op.fee_collections).toHaveLength(1);
    expect(op.exam_marks).toHaveLength(1);
    expect(op.settings.schoolName).toBe('Ideal High School');
  });

  it('safely handles extended finance, leave, routine, curriculum, and public admission cloud sync calls', async () => {
    localStorage.setItem('sms_fee_invoices', JSON.stringify([{ id: 'INV-1', studentId: 'S-1', studentName: 'Amina', totalPayable: 500, totalPaid: 200, dueAmount: 300, status: 'partial' }]));
    localStorage.setItem('sms_student_fee_ledgers', JSON.stringify({ 'S-1': { studentId: 'S-1', sessionYear: 2026, totalBilled: 500, totalPaid: 200, totalDue: 300, months: [] } }));
    localStorage.setItem('sms_payroll_records', JSON.stringify([{ id: 'PAY-1', teacherId: 'T-1', teacherName: 'Karim', month: 'November', year: 2026, netPayable: 15000, paidAmount: 15000, status: 'Paid', paymentMethod: 'Cash' }]));
    localStorage.setItem('sms_expenses', JSON.stringify([{ id: 'EXP-1', category: 'Stationery', amount: 250, date: '2026-11-10', paidTo: 'Store' }]));
    localStorage.setItem('school_ledger_records', JSON.stringify([{ id: 'LED-1', type: 'Income', category: 'Fee', amount: 500, voucherNo: 'V-1', date: '2026-11-10' }]));
    localStorage.setItem('sms_students', JSON.stringify([{ id: 'S-1', name: 'Amina', grade: '6th', roll: '01', isStipend: true }]));
    localStorage.setItem('sms_teacher_leave_applications', JSON.stringify([{ id: 'LV-1', teacherId: 'T-1', teacherName: 'Karim', leaveType: 'casual', startDate: '2026-11-12', endDate: '2026-11-13', totalDays: 2, reason: 'Family emergency', status: 'Pending' }]));
    localStorage.setItem('sms_master_class_routine', JSON.stringify([{ id: 'ROT-1', classId: '6th-A', day: 'Sunday', periodNo: 1, subject: 'Bangla' }]));
    localStorage.setItem('sms_curriculum_subjects', JSON.stringify([{ id: 'curr-1', code: 'BAN-601', name: 'Bangla 1st', grade: '6th', group: 'সাধারণ' }]));
    localStorage.setItem('sms_academic_sessions', JSON.stringify([{ id: 'SES-2026', name: '2026', year: 2026, isCurrent: true, status: 'Active' }]));

    await expect(firebaseSyncService.syncFinanceToCloud()).resolves.toMatchObject({ uploadedCount: expect.any(Number) });
    await expect(firebaseSyncService.syncLeaveToCloud()).resolves.not.toThrow();
    await expect(firebaseSyncService.syncRoutineToCloud()).resolves.not.toThrow();
    await expect(firebaseSyncService.syncCurriculumToCloud()).resolves.not.toThrow();
    await expect(firebaseSyncService.syncOnlineApplicationToCloud({
      appId: 'APP-2026-9999',
      name: 'Test Applicant',
      grade: '6th',
      status: 'Admitted',
      isStipend: true,
    })).resolves.not.toThrow();
  });
});
