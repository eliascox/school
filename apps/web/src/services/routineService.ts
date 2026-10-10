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

// ─── DEFAULT STANDARD SCHEDULE ───────────────────────────────────────────
const generateDefaultRoutines = (): RoutineSlot[] => {
  const list: RoutineSlot[] = [];
  const classes = [
    { grade: '6th', branch: 'A', name: '6th-A', room: '১০১' },
    { grade: '7th', branch: 'A', name: '7th-A', room: '১০২' },
    { grade: '8th', branch: 'A', name: '8th-A', room: '১০৩' },
    { grade: '9th', branch: 'Science', name: '9th-Science', room: '২০১' },
    { grade: '9th', branch: 'Humanities', name: '9th-Humanities', room: '২০২' },
    { grade: '10th', branch: 'Science', name: '10th-Science', room: '২০৩' },
    { grade: '10th', branch: 'Commerce', name: '10th-Commerce', room: '২০৪' },
  ];

  const subjectsPool = ['বাংলা ১ম', 'ইংরেজি ১ম', 'সাধারণ গণিত', 'বিজ্ঞান', 'আইসিটি', 'বাংলাদেশ ও বিশ্বপরিচয়', 'ইসলাম ও নৈতিক শিক্ষা', 'পদার্থবিজ্ঞান', 'রসায়ন'];
  const teachersPool = [
    { id: 'TCH-101', name: 'মোহাম্মদ আবদুল করিম' },
    { id: 'TCH-102', name: 'নাসরিন আক্তার' },
    { id: 'TCH-103', name: 'রফিকুল ইসলাম' },
    { id: 'TCH-104', name: 'সুকুমার বড়ুয়া' },
    { id: 'TCH-105', name: 'তানভীর হাসান' }
  ];

  ROUTINE_DAYS.forEach((d) => {
    classes.forEach((c) => {
      [1, 2, 3, 4, 6, 7, 8].forEach((pNo, idx) => {
        const sub = subjectsPool[(idx + classes.indexOf(c)) % subjectsPool.length];
        const tch = teachersPool[(idx + pNo) % teachersPool.length];
        list.push({
          id: `ROT-${c.name}-${d.key}-P${pNo}`,
          classId: c.name,
          grade: c.grade,
          branch: c.branch,
          day: d.key,
          dayBn: d.labelBn,
          periodNo: pNo,
          subject: sub,
          teacherId: tch.id,
          teacherName: tch.name,
          roomNo: c.room
        });
      });
    });
  });

  return list;
};

class RoutineService {
  getRoutines(): RoutineSlot[] {
    if (typeof window === 'undefined') return generateDefaultRoutines();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      const defaults = generateDefaultRoutines();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    } catch (e) {
      console.error(e);
      return generateDefaultRoutines();
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
