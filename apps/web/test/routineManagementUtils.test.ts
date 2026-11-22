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

import {
  ROUTINE_DAYS,
  ROUTINE_PERIODS,
  RoutineSlot,
  routineService,
} from '@/services/routineService';
import {
  buildClassOptions,
  filterTeacherCandidates,
  formatClassIdBn,
} from '@/components/routine/routineHelpers';
import { DEFAULT_CLASSES } from '@/services/classSectionService';

const makeSlot = (overrides: Partial<RoutineSlot>): RoutineSlot => ({
  id:
    overrides.id ||
    `ROT-${overrides.classId || '6th-A'}-${overrides.day || 'Sunday'}-P${overrides.periodNo || 1}`,
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

describe('routineManagementUtils — Dynamic Periods, Days, Conflicts & Master Routine', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      'sms_rbac_teachers',
      JSON.stringify([
        {
          id: 'TCH-1',
          name: 'রফিকুল ইসলাম',
          designation: 'সিনিয়র শিক্ষক',
          phone: '01711000001',
          status: 'active',
        },
        {
          id: 'TCH-2',
          name: 'সালমা আক্তার',
          designation: 'সহকারী শিক্ষক',
          phone: '01722000002',
          status: 'active',
        },
        {
          id: 'TCH-3',
          name: 'কামরুল হাসান',
          designation: 'সহকারী শিক্ষক',
          phone: '01733000003',
          status: 'active',
        },
      ])
    );
    localStorage.setItem(
      'sms_rbac_subject_assignments',
      JSON.stringify([
        {
          id: 'SA-1',
          teacherId: 'TCH-2',
          classId: '8th',
          subjectId: 'সাধারণ গণিত',
          academicYear: 2026,
        },
      ])
    );
  });

  it('manages dynamic periods (add, edit, custom break enforcement, sole-period delete guard, reset)', () => {
    // Defaults match ROUTINE_PERIODS
    expect(routineService.getPeriods()).toHaveLength(ROUTINE_PERIODS.length);

    // Add custom period
    const added = routineService.addPeriod({
      periodName: '৮ম পিরিয়ড',
      startTime: '০৪:০০ PM',
      endTime: '০৪:৪০ PM',
      isBreak: false,
    });
    expect(added.success).toBe(true);
    expect(added.period?.periodNo).toBe(9);
    expect(routineService.getPeriods()).toHaveLength(ROUTINE_PERIODS.length + 1);

    // Mark period 3 as break -> saveRoutine rejects period 3 dynamically
    const updatedBreak = routineService.updatePeriod(3, {
      periodName: 'সকালের বিরতি',
      isBreak: true,
    });
    expect(updatedBreak.success).toBe(true);
    const blocked = routineService.saveRoutine(makeSlot({ periodNo: 3 }));
    expect(blocked.success).toBe(false);

    // Delete period 9 works
    const del = routineService.deletePeriod(9);
    expect(del.success).toBe(true);
    expect(routineService.getPeriods().some((p) => p.periodNo === 9)).toBe(false);

    // Cannot delete sole remaining period
    routineService.savePeriods([
      { periodNo: 1, periodName: '১ম পিরিয়ড', startTime: '১০:০০ AM', endTime: '১০:৪৫ AM' },
    ]);
    const soleDel = routineService.deletePeriod(1);
    expect(soleDel.success).toBe(false);

    // Reset restores defaults
    const reset = routineService.resetDefaultPeriods();
    expect(reset).toHaveLength(ROUTINE_PERIODS.length);
  });

  it('manages dynamic week days (delete Saturday for Sun-Thu, re-add Saturday, reorder, sole-day guard)', () => {
    expect(routineService.getDays()).toHaveLength(ROUTINE_DAYS.length);

    // Remove Saturday -> 5 days (Sun-Thu)
    const removedSat = routineService.deleteDay('Saturday');
    expect(removedSat.success).toBe(true);
    expect(routineService.getDays().map((d) => d.key)).toEqual([
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
    ]);
    // Saturday date (2026-11-14) is now treated as holiday (null)
    expect(routineService.getDayFromDate('2026-11-14')).toBeNull();

    // Re-add Saturday & move up
    const addedSat = routineService.addDay('Saturday');
    expect(addedSat.success).toBe(true);
    expect(routineService.addDay('Saturday').success).toBe(false); // duplicate rejected
    expect(routineService.getDayFromDate('2026-11-14')).toBe('Saturday');

    routineService.moveDay('Thursday', 'up');
    const keys = routineService.getDays().map((d) => d.key);
    expect(keys.indexOf('Thursday')).toBeLessThan(keys.indexOf('Wednesday'));

    // Guard deleting sole remaining day
    routineService.saveDays([{ key: 'Sunday', labelBn: 'রবিবার' }]);
    expect(routineService.deleteDay('Sunday').success).toBe(false);
  });

  it('detects detailed teacher conflicts with class & subject info and maps slot conflict IDs for Master Grid', () => {
    const slotA = makeSlot({
      id: 'SLOT-A',
      classId: '6th-A',
      day: 'Sunday',
      periodNo: 1,
      subject: 'বাংলা ১ম পত্র',
      teacherId: 'TCH-1',
      teacherName: 'রফিকুল ইসলাম',
      roomNo: '১০১',
    });
    const slotB = makeSlot({
      id: 'SLOT-B',
      classId: '8th-A',
      grade: '8th',
      day: 'Sunday',
      periodNo: 1,
      subject: 'ইংরেজি',
      teacherId: 'TCH-1',
      teacherName: 'রফিকুল ইসলাম',
      roomNo: '২০১',
    });

    routineService.saveRoutine(slotA);
    const conflictRes = routineService.saveRoutine(slotB);
    expect(conflictRes.success).toBe(false);
    expect(conflictRes.conflict?.type).toBe('teacher');
    expect(conflictRes.message).toContain('6th-A');
    expect(conflictRes.message).toContain('বাংলা ১ম পত্র');

    // Force-save to verify Master Grid conflict scanner flags both clashing cells
    routineService.saveRoutine(slotB, { skipConflictCheck: true });
    const conflictMap = routineService.findSlotConflictIds();
    expect(conflictMap.has('SLOT-A')).toBe(true);
    expect(conflictMap.has('SLOT-B')).toBe(true);
  });

  it('filters teacher availability by free-only, subject assignment, and Bangla/English search', () => {
    routineService.saveRoutine(
      makeSlot({
        id: 'BUSY-1',
        classId: '6th-A',
        day: 'Sunday',
        periodNo: 2,
        subject: 'বাংলা',
        teacherId: 'TCH-1',
        teacherName: 'রফিকুল ইসলাম',
        roomNo: '১০১',
      })
    );

    const availability = routineService.getTeacherAvailabilityForSlot('Sunday', 2, {
      excludeClassId: '8th-A',
    });

    // Free-only excludes TCH-1
    const freeList = filterTeacherCandidates(availability, { freeOnly: true });
    expect(freeList.map((c) => c.teacher.id)).not.toContain('TCH-1');
    expect(freeList.map((c) => c.teacher.id)).toContain('TCH-2');

    // Assigned-only for 8th + সাধারণ গণিত returns TCH-2
    const assignedList = filterTeacherCandidates(availability, {
      assignedOnly: true,
      targetGrade: '8th',
      targetSubject: 'সাধারণ গণিত',
    });
    expect(assignedList.map((c) => c.teacher.id)).toEqual(['TCH-2']);

    // Bangla-digit phone search matches TCH-3 ('01733000003')
    const phoneMatch = filterTeacherCandidates(availability, { query: '০১৭৩৩' });
    expect(phoneMatch.map((c) => c.teacher.id)).toEqual(['TCH-3']);
  });

  it('builds complete Master Routine class options across grades 6-10 and formats Bangla labels', () => {
    const options = buildClassOptions(DEFAULT_CLASSES, []);
    // 6th (A), 7th (A), 8th (A), 9th (Sci/Hum/Com), 10th (Sci/Hum/Com) => 9 options
    expect(options).toHaveLength(9);
    expect(options[0].classId).toBe('6th-A');
    expect(formatClassIdBn('8th-A', options)).toBe('৮ম শ্রেণি — ক শাখা');
    expect(formatClassIdBn('9th-Science', options)).toBe('৯ম শ্রেণি — বিজ্ঞান');
  });
});
