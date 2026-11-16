import { beforeEach, describe, expect, it } from 'vitest';

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
  value: { dispatchEvent: () => true },
  configurable: true,
});

import { examSeatPlanService } from '../src/services/examSeatPlanService';
import type { Student } from '../src/services/studentService';
import type { TeacherRecord } from '../src/services/teacherRBACService';

const makeStudent = (id: string, roll: string, grade: string): Student => ({
  id,
  name: `শিক্ষার্থী ${id}`,
  roll,
  grade,
  section: 'A',
  branch: 'A',
  group: 'সাধারণ',
  guardian: 'অভিভাবক',
  mobile: '01700000000',
});

describe('examSeatPlanService Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('rejects generation with no valid rooms and tracks capacity shortfall cleanly', () => {
    const emptyRes = examSeatPlanService.generateSeatPlan({
      examId: 'EX-1',
      examTitle: 'বার্ষিক পরীক্ষা',
      primaryStudents: [makeStudent('S1', '1', '6th')],
      roomIds: [],
      mode: 'single',
    });
    expect(emptyRes.success).toBe(false);

    examSeatPlanService.saveRoom({
      id: 'RM-SMALL',
      roomNo: '৯০১',
      roomName: 'ছোট কক্ষ',
      building: 'মূল ভবন',
      rows: 1,
      cols: 2,
      seatsPerBench: 1,
    });

    const threeStudents = [
      makeStudent('S1', '01', '6th'),
      makeStudent('S2', '02', '6th'),
      makeStudent('S3', '03', '6th'),
    ];
    const capRes = examSeatPlanService.generateSeatPlan({
      examId: 'EX-1',
      examTitle: 'বার্ষিক পরীক্ষা',
      primaryStudents: threeStudents,
      roomIds: ['RM-SMALL'],
      mode: 'single',
    });
    expect(capRes.success).toBe(true);
    expect(capRes.entries).toHaveLength(2);
    expect(capRes.unassignedCount).toBe(1);
  });

  it('alternates two classes side-by-side in mixed_alternate anti-cheat mode', () => {
    examSeatPlanService.saveRoom({
      id: 'RM-MIX',
      roomNo: '৩০১',
      roomName: 'হল রুম',
      building: 'নতুন ভবন',
      rows: 2,
      cols: 1,
      seatsPerBench: 2,
    });

    const primary = [makeStudent('A1', '01', '6th'), makeStudent('A2', '02', '6th')];
    const secondary = [makeStudent('B1', '01', '7th'), makeStudent('B2', '02', '7th')];

    const res = examSeatPlanService.generateSeatPlan({
      examId: 'EX-MIX',
      examTitle: 'অর্ধবার্ষিক',
      primaryStudents: primary,
      secondaryStudents: secondary,
      roomIds: ['RM-MIX'],
      mode: 'mixed_alternate',
    });

    expect(res.success).toBe(true);
    expect(res.unassignedCount).toBe(0);
    expect(res.entries).toHaveLength(4);
    expect(res.entries[0].seatPosition).toBe('L');
    expect(res.entries[0].grade).toBe('6th');
    expect(res.entries[1].seatPosition).toBe('R');
    expect(res.entries[1].grade).toBe('7th');
  });

  it('excludes inactive and approved-on-leave teachers when auto-assigning invigilators', () => {
    localStorage.setItem(
      'sms_teacher_leave_applications',
      JSON.stringify([
        {
          id: 'LEV-INV-1',
          teacherId: 'T-LEAVE',
          teacherName: 'অনুপস্থিত শিক্ষক',
          designation: 'শিক্ষক',
          leaveType: 'medical',
          startDate: '2026-11-20',
          endDate: '2026-11-22',
          totalDays: 3,
          reason: 'অসুস্থ',
          appliedAt: '2026-11-19',
          status: 'approved',
        },
      ])
    );

    const teachers: TeacherRecord[] = [
      {
        id: 'T-LEAVE',
        name: 'অনুপস্থিত শিক্ষক',
        designation: 'সহকারী শিক্ষক',
        phone: '01711111111',
        dob: '1990-01-01',
        status: 'active',
        passwordHash: '',
        mustChangePassword: false,
        createdAt: '2026-01-01',
      },
      {
        id: 'T-INACTIVE',
        name: 'নিষ্ক্রিয় শিক্ষক',
        designation: 'সহকারী শিক্ষক',
        phone: '01722222222',
        dob: '1990-01-01',
        status: 'inactive',
        passwordHash: '',
        mustChangePassword: false,
        createdAt: '2026-01-01',
      },
      {
        id: 'T-OK-1',
        name: 'উপস্থিত শিক্ষক ১',
        designation: 'সহকারী শিক্ষক',
        phone: '01733333333',
        dob: '1990-01-01',
        status: 'active',
        passwordHash: '',
        mustChangePassword: false,
        createdAt: '2026-01-01',
      },
      {
        id: 'T-OK-2',
        name: 'উপস্থিত শিক্ষক ২',
        designation: 'সহকারী শিক্ষক',
        phone: '01744444444',
        dob: '1990-01-01',
        status: 'active',
        passwordHash: '',
        mustChangePassword: false,
        createdAt: '2026-01-01',
      },
    ];

    const dutyRes = examSeatPlanService.autoAssignInvigilators({
      examId: 'EX-MIX',
      examTitle: 'অর্ধবার্ষিক',
      date: '2026-11-21',
      shift: 'Morning',
      roomIds: ['room-101'],
      teachers,
      teachersPerRoom: 2,
    });

    expect(dutyRes.success).toBe(true);
    expect(dutyRes.duties).toHaveLength(1);
    expect(dutyRes.duties[0].teacherIds).toEqual(['T-OK-1', 'T-OK-2']);
  });
});
