'use client';

export interface RoutinePeriod {
  periodNo: number;
  periodName: string;
  startTime: string;
  endTime: string;
  isBreak?: boolean;
}

export interface RoutineSlot {
  id: string;
  classId: string; // e.g. "6th-A", "8th-A", "9th-Science"
  grade: string;   // e.g. "6th", "8th", "9th"
  branch: string;  // e.g. "A", "B", "Science", "Humanities"
  day: 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday';
  dayBn: string;
  periodNo: number;
  subject: string;
  teacherId?: string;
  teacherName: string;
  roomNo: string;
}

export const ROUTINE_PERIODS: RoutinePeriod[] = [
  { periodNo: 1, periodName: '১ম পিরিয়ড', startTime: '১০:০০ AM', endTime: '১০:৪৫ AM' },
  { periodNo: 2, periodName: '২য় পিরিয়ড', startTime: '১০:৪৫ AM', endTime: '১১:৩০ AM' },
  { periodNo: 3, periodName: '৩য় পিরিয়ড', startTime: '১১:৩০ AM', endTime: '১২:১৫ PM' },
  { periodNo: 4, periodName: '৪র্থ পিরিয়ড', startTime: '১২:১৫ PM', endTime: '০১:০০ PM' },
  { periodNo: 5, periodName: 'টিফিন বিরতি', startTime: '০১:০০ PM', endTime: '০১:৪৫ PM', isBreak: true },
  { periodNo: 6, periodName: '৫ম পিরিয়ড', startTime: '০১:৪৫ PM', endTime: '০২:৩০ PM' },
  { periodNo: 7, periodName: '৬ষ্ঠ পিরিয়ড', startTime: '০২:৩০ PM', endTime: '০৩:১৫ PM' },
  { periodNo: 8, periodName: '৭ম পিরিয়ড', startTime: '০৩:১৫ PM', endTime: '০৪:০০ PM' },
];

export const ROUTINE_DAYS: { key: RoutineSlot['day']; labelBn: string }[] = [
  { key: 'Saturday', labelBn: 'শনিবার' },
  { key: 'Sunday', labelBn: 'রবিবার' },
  { key: 'Monday', labelBn: 'সোমবার' },
  { key: 'Tuesday', labelBn: 'মঙ্গলবার' },
  { key: 'Wednesday', labelBn: 'বুধবার' },
  { key: 'Thursday', labelBn: 'বৃহস্পতিবার' }
];

const STORAGE_KEY = 'sms_master_class_routine';
// ─── NO DEMO ROUTINES ────────────────────────────────────────────────────────
// Class routines must be created via the Routine Management panel.
// System starts with an empty routine so no fake teacher names appear.
// ─────────────────────────────────────────────────────────────────────────────

class RoutineService {
  getRoutines(): RoutineSlot[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  getClassRoutine(classId: string): RoutineSlot[] {
    if (!classId) return [];
    const all = this.getRoutines();
    const clean = classId.trim().toLowerCase();
    return all.filter(r => 
      r.classId.toLowerCase() === clean || 
      r.classId.toLowerCase().startsWith(clean) ||
      clean.startsWith(r.classId.toLowerCase())
    );
  }

  getTeacherRoutine(teacherIdentifier: string): RoutineSlot[] {
    if (!teacherIdentifier) return [];
    const all = this.getRoutines();
    const clean = teacherIdentifier.trim().toLowerCase();
    return all.filter(r => 
      (r.teacherId && r.teacherId.toLowerCase() === clean) ||
      (r.teacherName && r.teacherName.toLowerCase().includes(clean)) ||
      clean.includes(r.teacherName.toLowerCase())
    );
  }

  saveRoutine(slot: RoutineSlot): { success: boolean; message: string } {
    if (typeof window === 'undefined') return { success: false, message: 'ব্রাউজার অনুপস্থিত' };
    const all = this.getRoutines();
    const idx = all.findIndex(r => r.id === slot.id || (r.classId === slot.classId && r.day === slot.day && r.periodNo === slot.periodNo));

    if (idx !== -1) {
      all[idx] = slot;
    } else {
      all.push({
        ...slot,
        id: slot.id || `ROT-${slot.classId}-${slot.day}-P${slot.periodNo}`
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event('storage'));
    return { success: true, message: 'ক্লাস রুটিন সফলভাবে আপডেট করা হয়েছে!' };
  }
}

export const routineService = new RoutineService();
