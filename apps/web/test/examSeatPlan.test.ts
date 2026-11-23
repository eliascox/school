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
import {
  buildBatchRooms,
  buildRoomDoorSummaries,
  calculateCapacityForecast,
  compareSeatRolls,
  formatRollRangesBn,
  normalizeSeatGender,
} from '../src/lib/seatPlanUtils';
import type { Student } from '../src/services/studentService';
import type { TeacherRecord } from '../src/services/teacherRBACService';
import type { ClassItem } from '../src/services/classSectionService';

const makeStudent = (
  id: string,
  roll: string,
  grade: string,
  gender: string = 'পুরুষ',
  group: string = 'সাধারণ'
): Student => ({
  id,
  name: `শিক্ষার্থী ${id}`,
  roll,
  grade,
  section: 'A',
  branch: 'A',
  group,
  gender,
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

  it('normalizes Bangla & English genders accurately and sorts Bangla/English rolls numerically', () => {
    expect(normalizeSeatGender('পুরুষ')).toBe('male');
    expect(normalizeSeatGender('ছাত্র')).toBe('male');
    expect(normalizeSeatGender('Male')).toBe('male');
    expect(normalizeSeatGender('মহিলা')).toBe('female');
    expect(normalizeSeatGender('ছাত্রী')).toBe('female');
    expect(normalizeSeatGender('মেয়ে')).toBe('female');
    expect(normalizeSeatGender('Female')).toBe('female');
    expect(normalizeSeatGender('')).toBe('other');

    const unsorted = [
      makeStudent('R10', '১০', '6th'),
      makeStudent('R2', '২', '6th'),
      makeStudent('R1', '01', '6th'),
      makeStudent('R3', '3', '6th'),
    ];
    const sorted = [...unsorted].sort(compareSeatRolls);
    expect(sorted.map((s) => s.id)).toEqual(['R1', 'R2', 'R3', 'R10']);
    expect(formatRollRangesBn(['০১', '02', '3', '৫', '6', '৭'])).toBe('১–৩, ৫–৭');
  });

  it('seats Boys in Column 1 and Girls in Columns 2 & 3 with anti-cheat cross-class bench pairing', () => {
    examSeatPlanService.saveRooms([
      {
        id: 'RM-3COL',
        roomNo: '১০১',
        roomName: 'কক্ষ নং ১০১',
        building: 'মূল ভবন',
        cols: 3,
        rows: 2,
        seatsPerBench: 2,
        columnGenders: ['male', 'female', 'female'],
      },
    ]);

    const students: Student[] = [
      // 4 boys (2 Class 6, 2 Class 8)
      makeStudent('B6-1', '1', '6th', 'ছাত্র'),
      makeStudent('B6-2', '2', '6th', 'পুরুষ'),
      makeStudent('B8-1', '1', '8th', 'Male'),
      makeStudent('B8-2', '2', '8th', 'ছেলে'),
      // 8 girls (4 Class 6, 4 Class 8)
      makeStudent('G6-1', '3', '6th', 'ছাত্রী'),
      makeStudent('G6-2', '4', '6th', 'মহিলা'),
      makeStudent('G6-3', '5', '6th', 'Female'),
      makeStudent('G6-4', '6', '6th', 'মেয়ে'),
      makeStudent('G8-1', '3', '8th', 'ছাত্রী'),
      makeStudent('G8-2', '4', '8th', 'মহিলা'),
      makeStudent('G8-3', '5', '8th', 'Female'),
      makeStudent('G8-4', '6', '8th', 'মেয়ে'),
    ];

    const res = examSeatPlanService.generateAdvancedSeatPlan({
      examId: 'EX-COL',
      examTitle: 'বার্ষিক পরীক্ষা ২০২৬',
      students,
      roomIds: ['RM-3COL'],
      genderMode: 'column_split',
      globalColumnGenders: ['male', 'female', 'female'],
      classDistribution: 'anti_cheat_bench',
      fillOrder: 'column_first',
      strictGenderOverflow: true,
    });

    expect(res.success).toBe(true);
    expect(res.unassignedCount).toBe(0);
    expect(res.assignedBoys).toBe(4);
    expect(res.assignedGirls).toBe(8);

    const col1 = res.entries.filter((e) => e.colIndex === 1);
    const col2 = res.entries.filter((e) => e.colIndex === 2);
    const col3 = res.entries.filter((e) => e.colIndex === 3);

    expect(col1).toHaveLength(4);
    expect(col1.every((e) => e.gender === 'male')).toBe(true);

    expect(col2).toHaveLength(4);
    expect(col2.every((e) => e.gender === 'female')).toBe(true);

    expect(col3).toHaveLength(4);
    expect(col3.every((e) => e.gender === 'female')).toBe(true);

    // Anti-cheat check: every bench has two DIFFERENT classes sitting side by side
    const byBench = new Map<number, string[]>();
    res.entries.forEach((e) => {
      if (!byBench.has(e.benchNo)) byBench.set(e.benchNo, []);
      byBench.get(e.benchNo)!.push(e.grade);
    });
    byBench.forEach((grades) => {
      expect(grades).toHaveLength(2);
      expect(grades[0]).not.toBe(grades[1]);
    });
  });

  it('supports boys_only, girls_only, and separate_rooms with zero cross-gender mixing in any room', () => {
    const batch = buildBatchRooms({
      count: 2,
      startNo: 101,
      cols: 2,
      rows: 1,
      seatsPerBench: 2,
    });
    examSeatPlanService.saveRooms(batch);
    const roomIds = batch.map((r) => r.id);

    const students: Student[] = [
      makeStudent('B1', '1', '6th', 'ছাত্র'),
      makeStudent('B2', '2', '6th', 'ছাত্র'),
      makeStudent('B3', '3', '6th', 'ছাত্র'),
      makeStudent('G1', '4', '6th', 'ছাত্রী'),
      makeStudent('G2', '5', '6th', 'ছাত্রী'),
      makeStudent('G3', '6', '6th', 'ছাত্রী'),
    ];

    const boysRes = examSeatPlanService.generateAdvancedSeatPlan({
      examId: 'EX-BOYS',
      examTitle: 'ছাত্র সিট প্ল্যান',
      students,
      roomIds,
      genderMode: 'boys_only',
      classDistribution: 'sequential',
    });
    expect(boysRes.entries).toHaveLength(3);
    expect(boysRes.entries.every((e) => e.gender === 'male')).toBe(true);

    const girlsRes = examSeatPlanService.generateAdvancedSeatPlan({
      examId: 'EX-GIRLS',
      examTitle: 'ছাত্রী সিট প্ল্যান',
      students,
      roomIds,
      genderMode: 'girls_only',
      classDistribution: 'sequential',
    });
    expect(girlsRes.entries).toHaveLength(3);
    expect(girlsRes.entries.every((e) => e.gender === 'female')).toBe(true);

    const sepRes = examSeatPlanService.generateAdvancedSeatPlan({
      examId: 'EX-SEP',
      examTitle: 'আলাদা কক্ষ সিট প্ল্যান',
      students,
      roomIds,
      genderMode: 'separate_rooms',
      classDistribution: 'sequential',
    });
    expect(sepRes.unassignedCount).toBe(0);
    const room1Seats = sepRes.entries.filter((e) => e.roomId === roomIds[0]);
    const room2Seats = sepRes.entries.filter((e) => e.roomId === roomIds[1]);
    expect(room1Seats).toHaveLength(3);
    expect(room1Seats.every((e) => e.gender === 'male')).toBe(true);
    expect(room2Seats).toHaveLength(3);
    expect(room2Seats.every((e) => e.gender === 'female')).toBe(true);
  });

  it('tracks gender-specific shortfall in strict mode and fills spare seats when overflow is allowed', () => {
    examSeatPlanService.saveRooms([
      {
        id: 'RM-STRICT',
        roomNo: '২০১',
        roomName: 'কক্ষ ২০১',
        cols: 3,
        rows: 1,
        seatsPerBench: 2,
        columnGenders: ['male', 'female', 'female'], // 2 male seats, 4 female seats
      },
    ]);

    const students = [
      makeStudent('B1', '1', '7th', 'ছাত্র'),
      makeStudent('B2', '2', '7th', 'ছাত্র'),
      makeStudent('B3', '3', '7th', 'ছাত্র'),
      makeStudent('B4', '4', '7th', 'ছাত্র'),
      makeStudent('G1', '5', '7th', 'ছাত্রী'),
      makeStudent('G2', '6', '7th', 'ছাত্রী'),
    ];

    const strictRes = examSeatPlanService.generateAdvancedSeatPlan({
      examId: 'EX-STRICT',
      examTitle: 'মডেল টেস্ট',
      students,
      roomIds: ['RM-STRICT'],
      genderMode: 'column_split',
      globalColumnGenders: ['male', 'female', 'female'],
      classDistribution: 'sequential',
      strictGenderOverflow: true,
    });
    expect(strictRes.assignedBoys).toBe(2);
    expect(strictRes.assignedGirls).toBe(2);
    expect(strictRes.unassignedBoys).toBe(2);
    expect(strictRes.unassignedGirls).toBe(0);

    const overflowRes = examSeatPlanService.generateAdvancedSeatPlan({
      examId: 'EX-OVERFLOW',
      examTitle: 'মডেল টেস্ট',
      students,
      roomIds: ['RM-STRICT'],
      genderMode: 'column_split',
      globalColumnGenders: ['male', 'female', 'female'],
      classDistribution: 'sequential',
      strictGenderOverflow: false,
    });
    expect(overflowRes.unassignedCount).toBe(0);
    expect(overflowRes.entries).toHaveLength(6);
  });

  it('swaps seats cleanly, syncs academic class rooms, and computes forecast & door summaries', () => {
    const academicClasses: ClassItem[] = [
      {
        id: 'cls-6',
        code: 'CLS-06',
        name: 'Class 6',
        nameBn: '৬ষ্ঠ শ্রেণি',
        gradeNumber: 6,
        shift: 'দিবা (Day)',
        classTeacher: '',
        totalStudents: 40,
        groups: ['সাধারণ'],
        sections: [
          {
            id: 'sec-6a',
            name: 'Section A',
            room: 'রুম ৫০১',
            capacity: 42,
            studentCount: 40,
            sectionTeacher: '',
            shift: 'দিবা (Day)',
          },
        ],
      },
    ];

    const syncedRooms = examSeatPlanService.syncRoomsFromAcademicClasses(academicClasses, {
      cols: 3,
      rows: 7,
      seatsPerBench: 2,
      columnGenders: ['male', 'female', 'female'],
    });
    expect(syncedRooms.some((r) => r.roomNo === '৫০১')).toBe(true);

    const students = [
      makeStudent('S1', '1', '6th', 'ছাত্র'),
      makeStudent('S2', '2', '6th', 'ছাত্র'),
      makeStudent('S3', '3', '6th', 'ছাত্রী'),
      makeStudent('S4', '4', '6th', 'ছাত্রী'),
    ];

    const forecast = calculateCapacityForecast({
      students,
      rooms: syncedRooms.filter((r) => r.roomNo === '৫০১'),
      genderMode: 'column_split',
      globalColumnGenders: ['male', 'female', 'female'],
      templateRoom: { cols: 3, rows: 7, seatsPerBench: 2, columnGenders: ['male', 'female', 'female'] },
    });
    expect(forecast.shortfallTotal).toBe(0);
    expect(forecast.recommendedRoomCount).toBe(1);

    const targetRoom = syncedRooms.find((r) => r.roomNo === '৫০১')!;
    const gen = examSeatPlanService.generateAdvancedSeatPlan({
      examId: 'EX-SWAP',
      examTitle: 'অর্ধবার্ষিক',
      students,
      roomIds: [targetRoom.id],
      genderMode: 'column_split',
      globalColumnGenders: ['male', 'female', 'female'],
      classDistribution: 'sequential',
    });

    const first = gen.entries[0];
    const second = gen.entries[1];
    const swapped = examSeatPlanService.swapSeats('EX-SWAP', first.id, second.id);
    expect(swapped.success).toBe(true);
    const updatedFirst = swapped.entries.find((e) => e.id === first.id)!;
    const updatedSecond = swapped.entries.find((e) => e.id === second.id)!;
    expect(updatedFirst.studentId).toBe(second.studentId);
    expect(updatedSecond.studentId).toBe(first.studentId);

    const summaries = buildRoomDoorSummaries(swapped.entries, [targetRoom]);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].boys).toBe(2);
    expect(summaries[0].girls).toBe(2);
    expect(summaries[0].classRanges[0].rollRangeLabel).toBe('১–৪');
  });
});
