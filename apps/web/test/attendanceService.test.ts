import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage & window
const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null
};
(globalThis as any).window = { dispatchEvent: () => true };

import { attendanceService, StudentAttendanceRecord } from '../src/services/attendanceService';

describe('attendanceService Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates consistent storage keys', () => {
    const key = attendanceService.getStorageKey('2026-10-13', '8th', 'A');
    expect(key).toBe('sms_attendance_2026-10-13_8th-A');
  });

  it('saves and retrieves class attendance correctly', () => {
    const records: StudentAttendanceRecord[] = [
      {
        id: 'st-01',
        roll: '01',
        name: 'সাকিব আল হাসান',
        grade: '8th',
        branch: 'A',
        guardian: 'অভিভাবক',
        mobile: '01711111111',
        status: 'Present'
      },
      {
        id: 'st-02',
        roll: '02',
        name: 'তামিম ইকবাল',
        grade: '8th',
        branch: 'A',
        guardian: 'অভিভাবক',
        mobile: '01722222222',
        status: 'Absent',
        reason: 'অসুস্থ'
      }
    ];

    const saved = attendanceService.saveAttendance({
      date: '2026-10-13',
      grade: '8th',
      branch: 'A',
      records,
      performedBy: 'শ্রেণি শিক্ষক'
    });

    expect(saved).toBe(true);

    const retrieved = attendanceService.getAttendance('2026-10-13', '8th', 'A');
    expect(retrieved.length).toBe(2);
    expect(retrieved[0].name).toBe('সাকিব আল হাসান');
    expect(retrieved[0].status).toBe('Present');
    expect(retrieved[1].name).toBe('তামিম ইকবাল');
    expect(retrieved[1].status).toBe('Absent');
  });

  it('enforces uniqueness and prevents duplicate student attendance lines in the same day', () => {
    const duplicateList: StudentAttendanceRecord[] = [
      {
        id: 'st-01',
        roll: '01',
        name: 'সাকিব আল হাসান',
        grade: '8th',
        branch: 'A',
        guardian: 'অভিভাবক',
        mobile: '01711111111',
        status: 'Present'
      },
      {
        id: 'st-01', // same id
        roll: '01',
        name: 'সাকিব আল হাসান',
        grade: '8th',
        branch: 'A',
        guardian: 'অভিভাবক',
        mobile: '01711111111',
        status: 'Present'
      }
    ];

    attendanceService.saveAttendance({
      date: '2026-10-13',
      grade: '8th',
      branch: 'A',
      records: duplicateList
    });

    const retrieved = attendanceService.getAttendance('2026-10-13', '8th', 'A');
    expect(retrieved.length).toBe(1);
  });

  it('correctly aggregates absentees across multiple classes', () => {
    const class8A: StudentAttendanceRecord[] = [
      {
        id: 'st-8a-01',
        roll: '01',
        name: 'ছাত্র ১',
        grade: '8th',
        branch: 'A',
        guardian: 'অভিভাবক',
        mobile: '01700000000',
        status: 'Absent'
      }
    ];

    const class9Science: StudentAttendanceRecord[] = [
      {
        id: 'st-9sc-05',
        roll: '05',
        name: 'ছাত্র ২',
        grade: '9th',
        branch: 'Science',
        guardian: 'অভিভাবক',
        mobile: '01800000000',
        status: 'Leave',
        reason: 'ছুটি'
      }
    ];

    attendanceService.saveAttendance({ date: '2026-10-13', grade: '8th', branch: 'A', records: class8A });
    attendanceService.saveAttendance({ date: '2026-10-13', grade: '9th', branch: 'Science', records: class9Science });

    const allAbsentees = attendanceService.getAllAbsenteesForDate('2026-10-13');
    expect(allAbsentees.length).toBe(2);
    expect(allAbsentees.some(a => a.id === 'st-8a-01')).toBe(true);
    expect(allAbsentees.some(a => a.id === 'st-9sc-05')).toBe(true);
  });
});
