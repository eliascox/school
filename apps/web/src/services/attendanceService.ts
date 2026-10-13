import { auditTrailService } from './auditTrailService';
import { studentService } from './studentService';
import { syncQueueService } from './syncQueueService';

export interface StudentAttendanceRecord {
  id: string;
  roll: string;
  name: string;
  grade: string;
  branch: string;
  guardian: string;
  mobile: string;
  status: 'Present' | 'Absent' | 'Leave';
  reason?: string;
}

export interface AttendanceMonthlySummary {
  studentId: string;
  studentName: string;
  roll: string;
  grade: string;
  branch: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  attendancePercentage: number;
}

const listeners: (() => void)[] = [];

export const attendanceService = {
  /**
   * Generates standard storage key for daily class attendance
   */
  getStorageKey: (date: string, grade: string, branch: string): string => {
    return `sms_attendance_${date}_${grade}-${branch}`;
  },

  /**
   * Retrieves attendance records for a class on a specific date.
   * If not yet marked, generates an initial list from active students in that class.
   */
  getAttendance: (date: string, grade: string, branch: string): StudentAttendanceRecord[] => {
    if (typeof window === 'undefined') return [];

    const key = attendanceService.getStorageKey(date, grade, branch);
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading attendance storage:', e);
    }

    // Default: initialize from student list
    const isClass9or10 = grade === '9th' || grade === '10th';
    const targetGroup = isClass9or10
      ? (branch === 'Science' || branch === 'A' ? 'বিজ্ঞান' :
         branch === 'Humanities' || branch === 'B' ? 'মানবিক' :
         branch === 'Commerce' || branch === 'C' ? 'ব্যবসায় শিক্ষা' : branch)
      : undefined;

    const rawStudents = studentService.getStudentsByFilter(grade, branch, targetGroup);
    return rawStudents.map((s, idx) => ({
      id: s.id || `st-${s.roll || idx + 1}`,
      roll: s.roll || String(idx + 1).padStart(2, '0'),
      name: s.name,
      grade: s.grade || grade,
      branch: branch,
      guardian: s.guardian || s.fatherName || 'অভিভাবক',
      mobile: s.mobile || '01800000000',
      status: 'Present'
    }));
  },

  /**
   * Saves and persists attendance records for a class on a specific date.
   * Enforces uniqueness (no duplicate students within the same date/class).
   */
  saveAttendance: (params: {
    date: string;
    grade: string;
    branch: string;
    records: StudentAttendanceRecord[];
    performedBy?: string;
  }): boolean => {
    if (typeof window === 'undefined') return false;
    const { date, grade, branch, records, performedBy } = params;

    // Deduplicate records by student id / roll to prevent duplicate attendance lines
    const uniqueMap = new Map<string, StudentAttendanceRecord>();
    records.forEach((rec) => {
      const dedupeKey = rec.id || `${grade}_${branch}_${rec.roll}`;
      uniqueMap.set(dedupeKey, rec);
    });
    const validatedRecords = Array.from(uniqueMap.values());

    const key = attendanceService.getStorageKey(date, grade, branch);
    try {
      localStorage.setItem(key, JSON.stringify(validatedRecords));
    } catch (e) {
      console.error('Error saving attendance:', e);
      return false;
    }

    const presentCnt = validatedRecords.filter(s => s.status === 'Present').length;
    const absentCnt = validatedRecords.filter(s => s.status === 'Absent').length;
    const leaveCnt = validatedRecords.filter(s => s.status === 'Leave').length;

    auditTrailService.addLog({
      action: 'MARK_ATTENDANCE',
      category: 'ATTENDANCE',
      details: `শ্রেণি ${grade} (${branch}) এর তারিখ ${date} এর উপস্থিতি সেভ করা হয়েছে (উপস্থিত: ${presentCnt}, অনুপস্থিত: ${absentCnt}, ছুটি: ${leaveCnt})`,
      performedBy: performedBy || 'শিক্ষক',
      status: 'SUCCESS'
    });

    // Enqueue mutation for sync
    const syncEntityId = `${date}-${grade}-${branch}`;
    syncQueueService.enqueue('attendance', syncEntityId, 'UPDATE', {
      date,
      grade,
      branch,
      presentCnt,
      absentCnt,
      leaveCnt,
      recordsCount: validatedRecords.length
    }).catch(() => {});

    window.dispatchEvent(new Event('storage'));
    listeners.forEach(fn => fn());
    return true;
  },

  /**
   * Gathers all absentees and students on leave across all grades for a specific date
   */
  getAllAbsenteesForDate: (date: string): StudentAttendanceRecord[] => {
    if (typeof window === 'undefined') return [];

    const grades = ['6th', '7th', '8th', '9th', '10th'];
    const list: StudentAttendanceRecord[] = [];
    const seen = new Set<string>();

    grades.forEach(g => {
      const is9or10 = g === '9th' || g === '10th';
      const branches = is9or10
        ? ['Science', 'Humanities', 'Commerce', 'A', 'B', 'C', 'বিজ্ঞান', 'মানবিক', 'ব্যবসায় শিক্ষা']
        : ['A', 'B', 'C'];

      branches.forEach(b => {
        const key = attendanceService.getStorageKey(date, g, b);
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const records: StudentAttendanceRecord[] = JSON.parse(stored);
            records.forEach(r => {
              if (r.status === 'Absent' || r.status === 'Leave') {
                const uid = `${g}_${r.id || r.roll}`;
                if (!seen.has(uid)) {
                  seen.add(uid);
                  list.push({ ...r, grade: g, branch: b });
                }
              }
            });
          }
        } catch (e) {}
      });
    });

    return list;
  },

  /**
   * Calculates monthly attendance stats for a specific class or student
   */
  getMonthlyClassAttendance: (yearMonthPrefix: string, grade: string, branch: string): {
    totalRecordedDays: number;
    dates: string[];
  } => {
    if (typeof window === 'undefined') return { totalRecordedDays: 0, dates: [] };

    const matchingDates: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(`sms_attendance_${yearMonthPrefix}`) && k.endsWith(`_${grade}-${branch}`)) {
          const parts = k.replace('sms_attendance_', '').split('_');
          if (parts[0]) matchingDates.push(parts[0]);
        }
      }
    } catch (e) {}

    return {
      totalRecordedDays: matchingDates.length,
      dates: matchingDates.sort()
    };
  },

  subscribe: (fn: () => void) => {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }
};
