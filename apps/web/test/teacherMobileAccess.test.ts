import { describe, it, expect, beforeEach } from 'vitest';

const store: Record<string, string> = {};
const mockStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = String(v);
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
(globalThis as any).localStorage = mockStorage;
(globalThis as any).window = {
  localStorage: mockStorage,
  dispatchEvent: () => true,
};

import { teacherAuthService } from '@/services/teacherAuthService';
import { teacherRBACService } from '@/services/teacherRBACService';
import { attendanceService } from '@/services/attendanceService';
import { homeworkService } from '@/services/homeworkService';
import { leaveService } from '@/services/leaveService';
import {
  getAvailableExamNames,
  getNextMarkInputKey,
  loadMobileMarkRows,
  parseClassTeacherClassId,
  saveClassTeacherDailyAttendance,
  saveTeacherSubjectMarks,
  STANDARD_EXAMS,
} from '@/lib/teacherMobileUtils';

describe('Mobile App Teacher Login, Assigned Subject Mark Entry & Class Teacher Attendance RBAC', () => {
  beforeEach(() => {
    localStorage.clear();
    // Seed 2 students in Class 8th Section A and 1 in Section B
    localStorage.setItem(
      'sms_students',
      JSON.stringify([
        {
          id: 'ST-8A-1',
          roll: '1',
          name: 'মোঃ তানভীর আহমেদ',
          grade: '8th',
          section: 'A',
          branch: 'A',
          group: 'সাধারণ',
          religion: 'ইসলাম',
          guardian: 'মোঃ রফিকুল ইসলাম',
          mobile: '01711000001',
        },
        {
          id: 'ST-8A-2',
          roll: '2',
          name: 'অনন্যা রানী দাস',
          grade: '8th',
          section: 'A',
          branch: 'A',
          group: 'সাধারণ',
          religion: 'হিন্দু',
          guardian: 'সুশীল দাস',
          mobile: '01711000002',
        },
        {
          id: 'ST-8B-1',
          roll: '1',
          name: 'সাদিয়া আক্তার',
          grade: '8th',
          section: 'B',
          branch: 'B',
          group: 'সাধারণ',
          religion: 'ইসলাম',
          guardian: 'আবদুল করিম',
          mobile: '01711000003',
        },
      ]),
    );
  });

  it('allows teacher login, permits marks entry ONLY for assigned subjects, and persists clamped marks', async () => {
    const created = await teacherRBACService.createTeacher({
      name: 'জনাব মাহমুদুল হাসান',
      phone: '01755112233',
      designation: 'সহকারী শিক্ষক (গণিত)',
      dob: '1990-05-10',
      status: 'active',
      passwordHash: 'Teach@2026',
    });
    expect(created.success).toBe(true);
    const teacherId = created.teacher!.id;

    // Assign ONLY Class 8th -> সাধারণ গণিত
    localStorage.setItem('sms_rbac_subject_assignments', JSON.stringify([]));
    const assigned = teacherRBACService.assignSubject(teacherId, '8th', 'সাধারণ গণিত', 2026);
    expect(assigned.success).toBe(true);

    // 1. Teacher logs in via unifiedLogin (same path used by Mobile App Login Sheet)
    const loginRes = await teacherAuthService.unifiedLogin('01755112233', 'Teach@2026');
    expect(loginRes.success).toBe(true);
    expect(loginRes.role).toBe('teacher');
    const session = teacherAuthService.getSession();
    expect(session?.role).toBe('teacher');
    expect(session?.teacherId).toBe(teacherId);

    // 2. Load mark rows for assigned subject and enter marks (including out-of-range test for clamping)
    const exam = STANDARD_EXAMS[0];
    const { rows } = loadMobileMarkRows({
      exam,
      grade: '8th',
      branch: 'A',
      group: 'science',
      subject: 'সাধারণ গণিত',
    });
    expect(rows).toHaveLength(2);

    const editedRows = rows.map((r, idx) =>
      idx === 0
        ? { ...r, written: 65, mcq: 25, practical: 0, total: 90 }
        : { ...r, written: 999, mcq: -5, practical: 0, total: 994 },
    );

    const saveAllowed = saveTeacherSubjectMarks({
      session,
      exam,
      grade: '8th',
      branch: 'A',
      group: 'science',
      subject: 'সাধারণ গণিত',
      rows: editedRows,
    });
    expect(saveAllowed.success).toBe(true);
    expect(saveAllowed.savedKeys.length).toBeGreaterThan(0);

    // Verify saved & clamped marks reload accurately
    const reloaded = loadMobileMarkRows({
      exam,
      grade: '8th',
      branch: 'A',
      group: 'science',
      subject: 'সাধারণ গণিত',
    });
    expect(reloaded.rows[0].written).toBe(65);
    expect(reloaded.rows[0].mcq).toBe(25);
    expect(reloaded.rows[0].total).toBe(90);
    // Clamped to writtenMax (70) and min (0)
    expect(reloaded.rows[1].written).toBe(reloaded.limits.writtenMax);
    expect(reloaded.rows[1].mcq).toBe(0);

    // 3. Strictly DENY marks entry for an unassigned subject in same class
    const saveUnassignedSubject = saveTeacherSubjectMarks({
      session,
      exam,
      grade: '8th',
      branch: 'A',
      group: 'science',
      subject: 'ইংরেজি ১ম পত্র',
      rows: editedRows,
    });
    expect(saveUnassignedSubject.success).toBe(false);

    // 4. Strictly DENY marks entry for an unassigned class
    const saveUnassignedClass = saveTeacherSubjectMarks({
      session,
      exam,
      grade: '9th',
      branch: 'Science',
      group: 'science',
      subject: 'সাধারণ গণিত',
      rows: editedRows,
    });
    expect(saveUnassignedClass.success).toBe(false);
  });

  it('enforces strict Class Teacher RBAC for taking daily attendance', async () => {
    const ctCreated = await teacherRBACService.createTeacher({
      name: 'মিসেস ফারহানা আক্তার',
      phone: '01766112233',
      designation: 'সহকারী শিক্ষক',
      dob: '1992-03-14',
      status: 'active',
      passwordHash: 'ClassT@2026',
    });
    const asstCreated = await teacherRBACService.createTeacher({
      name: 'জনাব কামাল উদ্দিন',
      phone: '01777112233',
      designation: 'সহকারী শিক্ষক',
      dob: '1988-08-20',
      status: 'active',
      passwordHash: 'AsstT@2026',
    });

    const ctId = ctCreated.teacher!.id;
    const asstId = asstCreated.teacher!.id;

    // Assign ফারহানা as Class Teacher of 8th-A only; কামাল is NOT a Class Teacher
    teacherRBACService.assignClassTeacher(ctId, '8th-A', 2026);

    // 1. Class Teacher logs in -> CAN take attendance for 8th-A
    await teacherAuthService.unifiedLogin('01766112233', 'ClassT@2026');
    const ctSession = teacherAuthService.getSession();
    const initial8A = attendanceService.getAttendance('2026-11-19', '8th', 'A');
    expect(initial8A).toHaveLength(2);
    initial8A[1].status = 'Absent';
    initial8A[1].reason = 'অসুস্থতা';

    const saveOwnClass = saveClassTeacherDailyAttendance({
      session: ctSession,
      date: '2026-11-19',
      grade: '8th',
      branch: 'A',
      records: initial8A,
    });
    expect(saveOwnClass.success).toBe(true);

    const persisted8A = attendanceService.getAttendance('2026-11-19', '8th', 'A');
    expect(persisted8A.find((s) => s.id === 'ST-8A-2')?.status).toBe('Absent');

    // 2. Class Teacher of 8th-A CANNOT take attendance for 8th-B
    const initial8B = attendanceService.getAttendance('2026-11-19', '8th', 'B');
    const saveOtherSection = saveClassTeacherDailyAttendance({
      session: ctSession,
      date: '2026-11-19',
      grade: '8th',
      branch: 'B',
      records: initial8B,
    });
    expect(saveOtherSection.success).toBe(false);

    // 3. Non-Class-Teacher (Assistant Teacher) logs in -> CANNOT take attendance for ANY class
    await teacherAuthService.unifiedLogin('01777112233', 'AsstT@2026');
    const asstSession = teacherAuthService.getSession();
    expect(teacherRBACService.isTeacherClassTeacher(asstId)).toBe(false);

    const saveByNonClassTeacher = saveClassTeacherDailyAttendance({
      session: asstSession,
      date: '2026-11-19',
      grade: '8th',
      branch: 'A',
      records: initial8A,
    });
    expect(saveByNonClassTeacher.success).toBe(false);

    // 4. Unauthenticated user CANNOT save attendance or marks
    const saveAnonAtt = saveClassTeacherDailyAttendance({
      session: null,
      date: '2026-11-19',
      grade: '8th',
      branch: 'A',
      records: initial8A,
    });
    expect(saveAnonAtt.success).toBe(false);
  }, 15000);

  it('normalizes Class Teacher classId variants like "8th - A" and "9th-বিজ্ঞান"', () => {
    expect(parseClassTeacherClassId('8th - A')).toEqual({ grade: '8th', branch: 'A' });
    expect(parseClassTeacherClassId('9th-বিজ্ঞান')).toEqual({ grade: '9th', branch: 'Science' });
    expect(parseClassTeacherClassId('10th-মানবিক')).toEqual({ grade: '10th', branch: 'Humanities' });

    teacherRBACService.assignClassTeacher('TCH-NORM', '9th - বিজ্ঞান', 2026);
    expect(teacherRBACService.canTakeClassAttendance('TCH-NORM', '9th-Science')).toBe(true);
    expect(teacherRBACService.canTakeClassAttendance('TCH-NORM', '9th-Humanities')).toBe(false);
  });

  it('syncs custom exams from sms_exam_setup and computes rapid keyboard auto-advance keys accurately', () => {
    localStorage.setItem(
      'sms_exam_setup',
      JSON.stringify({
        activeExam: 'মডেল টেস্ট ২০২৬',
        exams: [{ name: 'মডেল টেস্ট ২০২৬' }, { name: 'প্রি-টেস্ট ২০২৬' }],
      }),
    );

    const exams = getAvailableExamNames();
    expect(exams[0]).toBe('মডেল টেস্ট ২০২৬');
    expect(exams).toContain('প্রি-টেস্ট ২০২৬');
    expect(exams).toContain(STANDARD_EXAMS[0]);

    const rowIds = ['ST-8A-1', 'ST-8A-2'];
    // Written + MCQ + Practical subject
    expect(getNextMarkInputKey(rowIds, 'ST-8A-1', 'written', { hasMcq: true, hasPractical: true })).toBe('ST-8A-1:mcq');
    expect(getNextMarkInputKey(rowIds, 'ST-8A-1', 'mcq', { hasMcq: true, hasPractical: true })).toBe('ST-8A-1:practical');
    expect(getNextMarkInputKey(rowIds, 'ST-8A-1', 'practical', { hasMcq: true, hasPractical: true })).toBe('ST-8A-2:written');
    expect(getNextMarkInputKey(rowIds, 'ST-8A-2', 'practical', { hasMcq: true, hasPractical: true })).toBeNull();

    // Written-only subject skips straight to next student
    expect(getNextMarkInputKey(rowIds, 'ST-8A-1', 'written', { hasMcq: false, hasPractical: false })).toBe('ST-8A-2:written');
  });

  it('persists auto-saved marks, auto-saved attendance, and in-app homework/leave submissions seamlessly', async () => {
    const created = await teacherRBACService.createTeacher({
      name: 'জনাব রফিকুল ইসলাম',
      phone: '01788112233',
      designation: 'সহকারী শিক্ষক',
      dob: '1991-04-12',
      status: 'active',
      passwordHash: 'AutoSave@2026',
    });
    const tid = created.teacher!.id;
    teacherRBACService.assignSubject(tid, '8th', 'সাধারণ গণিত', 2026);
    teacherRBACService.assignClassTeacher(tid, '8th-A', 2026);

    await teacherAuthService.unifiedLogin('01788112233', 'AutoSave@2026');
    const session = teacherAuthService.getSession();

    // Auto-save marks
    const { rows, limits } = loadMobileMarkRows({
      exam: STANDARD_EXAMS[0],
      grade: '8th',
      branch: 'A',
      group: 'science',
      subject: 'সাধারণ গণিত',
    });
    const expectedMcq = limits.hasMcq ? Math.min(limits.mcqMax, 24) : 0;
    const autoMarksRes = saveTeacherSubjectMarks({
      session,
      exam: STANDARD_EXAMS[0],
      grade: '8th',
      branch: 'A',
      group: 'science',
      subject: 'সাধারণ গণিত',
      rows: rows.map((r, i) => (i === 0 ? { ...r, written: 58, mcq: expectedMcq, total: 58 + expectedMcq } : r)),
      mode: 'auto',
      skipCloudSync: true,
    });
    expect(autoMarksRes.success).toBe(true);
    expect(autoMarksRes.savedTimeBn).toBeTruthy();

    const reloadedMarks = loadMobileMarkRows({
      exam: STANDARD_EXAMS[0],
      grade: '8th',
      branch: 'A',
      group: 'science',
      subject: 'সাধারণ গণিত',
    });
    expect(reloadedMarks.rows[0].total).toBe(58 + expectedMcq);

    // Auto-save attendance (instant local persist)
    const attRows = attendanceService.getAttendance('2026-11-25', '8th', 'A');
    attRows[0].status = 'Present';
    attRows[1].status = 'Leave';
    attRows[1].reason = 'অসুস্থতা';

    const autoAttRes = saveClassTeacherDailyAttendance({
      session,
      date: '2026-11-25',
      grade: '8th',
      branch: 'A',
      records: attRows,
      mode: 'auto',
      skipCloudSync: true,
    });
    expect(autoAttRes.success).toBe(true);
    expect(autoAttRes.presentCount).toBe(1);
    expect(autoAttRes.leaveCount).toBe(1);
    expect(attendanceService.getAttendance('2026-11-25', '8th', 'A').find((s) => s.id === 'ST-8A-2')?.status).toBe('Leave');

    // In-app homework & leave tools
    const hwRes = homeworkService.createHomework({
      title: 'পদ্য মুখস্থ ও প্রশ্নোত্তর',
      description: 'পৃষ্ঠা ১২ এর ১-৫ নং প্রশ্ন',
      grade: '8th',
      section: 'A',
      subject: 'বাংলা ১ম পত্র',
      teacherId: tid,
      teacherName: 'জনাব রফিকুল ইসলাম',
      dueDate: '2026-11-28',
    });
    expect(hwRes.success).toBe(true);
    expect(homeworkService.getHomeworks({ grade: '8th' }).length).toBe(1);

    const lvRes = leaveService.submitLeave({
      teacherId: tid,
      teacherName: 'জনাব রফিকুল ইসলাম',
      designation: 'সহকারী শিক্ষক',
      leaveType: 'casual',
      startDate: '2026-11-26',
      endDate: '2026-11-27',
      totalDays: 2,
      reason: 'পারিবারিক জরুরি কাজ',
    });
    expect(lvRes.success).toBe(true);
    expect(leaveService.getTeacherLeaves(tid).length).toBe(1);
  });
});
