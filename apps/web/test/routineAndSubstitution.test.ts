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

import { routineService, RoutineSlot } from '../src/services/routineService';

const makeSlot = (overrides: Partial<RoutineSlot>): RoutineSlot => ({
  id: overrides.id || `ROT-${overrides.classId || '6th-A'}-${overrides.day || 'Sunday'}-P${overrides.periodNo || 1}`,
  classId: '6th-A',
  grade: '6th',
  branch: 'A',
  day: 'Sunday',
  dayBn: 'রবিবার',
  periodNo: 1,
  subject: 'বাংলা',
  teacherId: 'TCH-1',
  teacherName: 'রফিকুল ইসলাম',
  roomNo: '১০১',
  ...overrides,
});

describe('routineService & Substitution Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      'sms_rbac_teachers',
      JSON.stringify([
        { id: 'TCH-1', name: 'রফিকুল ইসলাম', designation: 'সিনিয়র শিক্ষক', phone: '01711111111', status: 'active' },
        { id: 'TCH-2', name: 'সালমা আক্তার', designation: 'সহকারী শিক্ষক', phone: '01722222222', status: 'active' },
        { id: 'TCH-3', name: 'কামরুল হাসান', designation: 'সহকারী শিক্ষক', phone: '01733333333', status: 'active' },
      ])
    );
  });

  it('rejects assigning a class on break period (period 5) and detects teacher & room conflicts', () => {
    const breakRes = routineService.saveRoutine(makeSlot({ periodNo: 5 }));
    expect(breakRes.success).toBe(false);

    const first = routineService.saveRoutine(
      makeSlot({ classId: '6th-A', teacherId: 'TCH-1', teacherName: 'রফিকুল ইসলাম', roomNo: '১০১', periodNo: 1 })
    );
    expect(first.success).toBe(true);

    const teacherConflict = routineService.saveRoutine(
      makeSlot({ id: 'ROT-7th-A-Sunday-P1', classId: '7th-A', grade: '7th', teacherId: 'TCH-1', teacherName: 'রফিকুল ইসলাম', roomNo: '১০২', periodNo: 1 })
    );
    expect(teacherConflict.success).toBe(false);
    expect(teacherConflict.conflict?.type).toBe('teacher');

    const roomConflict = routineService.saveRoutine(
      makeSlot({ id: 'ROT-7th-A-Sunday-P1-R', classId: '7th-A', grade: '7th', teacherId: 'TCH-2', teacherName: 'সালমা আক্তার', roomNo: '১০১', periodNo: 1 })
    );
    expect(roomConflict.success).toBe(false);
    expect(roomConflict.conflict?.type).toBe('room');
  });

  it('swaps two routine slots safely when free of conflicts and rejects conflicting swaps', () => {
    routineService.saveRoutine(
      makeSlot({ id: 'S1', classId: '6th-A', day: 'Sunday', periodNo: 1, subject: 'বাংলা', teacherId: 'TCH-1', teacherName: 'রফিকুল ইসলাম', roomNo: '১০১' })
    );
    routineService.saveRoutine(
      makeSlot({ id: 'S2', classId: '6th-A', day: 'Sunday', periodNo: 2, subject: 'গণিত', teacherId: 'TCH-2', teacherName: 'সালমা আক্তার', roomNo: '১০২' })
    );

    const swapped = routineService.swapRoutineSlots('S1', 'S2');
    expect(swapped.success).toBe(true);
    const slots = routineService.getClassRoutine('6th-A');
    expect(slots.find((s) => s.id === 'S1')?.subject).toBe('গণিত');
    expect(slots.find((s) => s.id === 'S2')?.subject).toBe('বাংলা');

    routineService.saveRoutine(
      makeSlot({ id: 'S3', classId: '7th-A', grade: '7th', day: 'Sunday', periodNo: 1, subject: 'ইংরেজি', teacherId: 'TCH-1', teacherName: 'রফিকুল ইসলাম', roomNo: '২০১' })
    );
    const blockedSwap = routineService.swapRoutineSlots('S1', 'S2');
    expect(blockedSwap.success).toBe(false);
  });

  it('suggests free lowest-workload substitute teachers excluding on-leave & busy teachers and auto-assigns proxies', () => {
    routineService.saveRoutine(
      makeSlot({ id: 'R1', classId: '6th-A', day: 'Sunday', periodNo: 1, subject: 'বাংলা', teacherId: 'TCH-1', teacherName: 'রফিকুল ইসলাম', roomNo: '১০১' })
    );
    routineService.saveRoutine(
      makeSlot({ id: 'R2', classId: '7th-A', grade: '7th', day: 'Sunday', periodNo: 1, subject: 'বিজ্ঞান', teacherId: 'TCH-2', teacherName: 'সালমা আক্তার', roomNo: '১০২' })
    );
    routineService.saveRoutine(
      makeSlot({ id: 'R3', classId: '8th-A', grade: '8th', day: 'Sunday', periodNo: 3, subject: 'গণিত', teacherId: 'TCH-3', teacherName: 'কামরুল হাসান', roomNo: '১০৩' })
    );

    localStorage.setItem(
      'sms_teacher_leave_applications',
      JSON.stringify([
        {
          id: 'LEV-1',
          teacherId: 'TCH-1',
          teacherName: 'রফিকুল ইসলাম',
          designation: 'সিনিয়র শিক্ষক',
          leaveType: 'casual',
          startDate: '2026-11-14',
          endDate: '2026-11-16',
          totalDays: 3,
          reason: 'পারিবারিক প্রয়োজন',
          appliedAt: '2026-11-13',
          status: 'approved',
        },
      ])
    );

    const candidates = routineService.suggestSubstituteTeachers('2026-11-15', 1, 'TCH-1');
    const salma = candidates.find((c) => c.teacherId === 'TCH-2');
    const kamrul = candidates.find((c) => c.teacherId === 'TCH-3');
    expect(salma?.isFreeAtPeriod).toBe(false);
    expect(kamrul?.isFreeAtPeriod).toBe(true);

    const autoRes = routineService.autoAssignSubstitutesForDate('2026-11-15');
    expect(autoRes.assignedCount).toBe(1);
    const subs = routineService.getSubstitutions('2026-11-15');
    expect(subs).toHaveLength(1);
    expect(subs[0].substituteTeacherId).toBe('TCH-3');
    expect(subs[0].absentTeacherId).toBe('TCH-1');
  });
});
