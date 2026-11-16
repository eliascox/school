'use client';

import { Student } from './studentService';
import { leaveService } from './leaveService';
import { TeacherRecord } from './teacherRBACService';
import { auditTrailService } from './auditTrailService';

export interface ExamHallRoom {
  id: string;
  roomNo: string;
  roomName: string;
  building?: string;
  rows: number;
  cols: number;
  seatsPerBench: 1 | 2 | 3;
}

export interface SeatPlanEntry {
  id: string;
  examId: string;
  examTitle: string;
  roomId: string;
  roomNo: string;
  roomName: string;
  benchNo: number;
  rowIndex: number;
  colIndex: number;
  seatPosition: 'L' | 'M' | 'R';
  studentId: string;
  studentName: string;
  roll: string;
  grade: string;
  section: string;
  group: string;
}

export interface InvigilatorDuty {
  id: string;
  examId: string;
  examTitle: string;
  date: string;
  shift: 'Morning' | 'Afternoon';
  roomId: string;
  roomNo: string;
  roomName: string;
  teacherIds: string[];
  teacherNames: string[];
}

const ROOMS_STORAGE_KEY = 'sms_exam_hall_rooms';
const SEATS_STORAGE_KEY = 'sms_exam_seat_plans';
const DUTY_STORAGE_KEY = 'sms_exam_invigilator_duties';

const DEFAULT_ROOMS: ExamHallRoom[] = [
  { id: 'room-101', roomNo: '১০১', roomName: 'কক্ষ নং ১০১ (মূল ভবন)', building: 'মূল ভবন', rows: 5, cols: 2, seatsPerBench: 2 },
  { id: 'room-102', roomNo: '১০২', roomName: 'কক্ষ নং ১০২ (মূল ভবন)', building: 'মূল ভবন', rows: 5, cols: 2, seatsPerBench: 2 },
  { id: 'room-201', roomNo: '২০১', roomName: 'বিজ্ঞান ভবন হল', building: 'বিজ্ঞান ভবন', rows: 6, cols: 3, seatsPerBench: 2 },
];

const compareRolls = (a: Student, b: Student) => {
  const na = parseInt(a.roll || '0', 10);
  const nb = parseInt(b.roll || '0', 10);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
  return String(a.roll || '').localeCompare(String(b.roll || ''));
};

export const examSeatPlanService = {
  getRooms(): ExamHallRoom[] {
    if (typeof window === 'undefined') return DEFAULT_ROOMS;
    try {
      const raw = localStorage.getItem(ROOMS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(DEFAULT_ROOMS));
      return DEFAULT_ROOMS;
    } catch {
      return DEFAULT_ROOMS;
    }
  },

  saveRoom(room: ExamHallRoom): ExamHallRoom[] {
    const rooms = this.getRooms();
    const idx = rooms.findIndex((r) => r.id === room.id);
    const next = idx >= 0 ? rooms.map((r) => (r.id === room.id ? room : r)) : [...rooms, room];
    if (typeof window !== 'undefined') {
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event('storage'));
    }
    return next;
  },

  deleteRoom(roomId: string): ExamHallRoom[] {
    const next = this.getRooms().filter((r) => r.id !== roomId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event('storage'));
    }
    return next;
  },

  getSeatPlans(examId?: string): SeatPlanEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(SEATS_STORAGE_KEY);
      const parsed: SeatPlanEntry[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return examId ? parsed.filter((s) => s.examId === examId) : parsed;
    } catch {
      return [];
    }
  },

  clearExamSeatPlan(examId: string): void {
    if (typeof window === 'undefined') return;
    const next = this.getSeatPlans().filter((s) => s.examId !== examId);
    localStorage.setItem(SEATS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('storage'));
  },

  generateSeatPlan(params: {
    examId: string;
    examTitle: string;
    primaryStudents: Student[];
    secondaryStudents?: Student[];
    roomIds: string[];
    mode: 'single' | 'mixed_alternate';
  }): { success: boolean; message: string; entries: SeatPlanEntry[]; unassignedCount: number } {
    const rooms = this.getRooms().filter((r) => params.roomIds.includes(r.id));
    if (rooms.length === 0) {
      return { success: false, message: 'অন্তত একটি পরীক্ষা কক্ষ নির্বাচন করুন।', entries: [], unassignedCount: 0 };
    }

    const pQueue = [...params.primaryStudents].sort(compareRolls);
    const sQueue = [...(params.secondaryStudents || [])].sort(compareRolls);
    let pIdx = 0;
    let sIdx = 0;

    const generated: SeatPlanEntry[] = [];
    const seenStudentIds = new Set<string>();

    const takeStudent = (preferSecondary: boolean): Student | null => {
      const takeFrom = (queue: Student[], idxRef: 'p' | 's'): Student | null => {
        while ((idxRef === 'p' ? pIdx : sIdx) < queue.length) {
          const st = queue[idxRef === 'p' ? pIdx++ : sIdx++];
          if (!seenStudentIds.has(st.id)) {
            seenStudentIds.add(st.id);
            return st;
          }
        }
        return null;
      };
      if (preferSecondary) {
        return takeFrom(sQueue, 's') || takeFrom(pQueue, 'p');
      }
      return takeFrom(pQueue, 'p') || takeFrom(sQueue, 's');
    };

    for (const room of rooms) {
      const totalBenches = room.rows * room.cols;
      for (let b = 0; b < totalBenches; b++) {
        const rowIndex = Math.floor(b / room.cols) + 1;
        const colIndex = (b % room.cols) + 1;
        const benchNo = b + 1;
        const positions: Array<'L' | 'M' | 'R'> =
          room.seatsPerBench === 1 ? ['L'] : room.seatsPerBench === 2 ? ['L', 'R'] : ['L', 'M', 'R'];

        for (let posIdx = 0; posIdx < positions.length; posIdx++) {
          const preferSecondary = params.mode === 'mixed_alternate' && posIdx % 2 === 1;
          const st = takeStudent(preferSecondary);
          if (!st) break;
          generated.push({
            id: `SEAT-${params.examId}-${room.id}-B${benchNo}-${positions[posIdx]}`,
            examId: params.examId,
            examTitle: params.examTitle,
            roomId: room.id,
            roomNo: room.roomNo,
            roomName: room.roomName,
            benchNo,
            rowIndex,
            colIndex,
            seatPosition: positions[posIdx],
            studentId: st.id,
            studentName: st.name,
            roll: st.roll,
            grade: st.grade,
            section: st.section || st.branch || 'A',
            group: st.group || 'সাধারণ',
          });
        }
      }
    }

    const totalUnique = new Set([...pQueue, ...sQueue].map((s) => s.id)).size;
    const unassignedCount = Math.max(0, totalUnique - generated.length);

    if (typeof window !== 'undefined') {
      const others = this.getSeatPlans().filter((s) => s.examId !== params.examId);
      localStorage.setItem(SEATS_STORAGE_KEY, JSON.stringify([...others, ...generated]));
      auditTrailService.addLog({
        action: 'EXAM_SEAT_PLAN_GENERATED',
        category: 'Examination',
        details: `${params.examTitle}-এর জন্য ${rooms.length}টি কক্ষে ${generated.length} জন শিক্ষার্থীর সিট প্ল্যান তৈরি হয়েছে।`,
        performedBy: 'অ্যাডমিন',
        status: 'Success',
      });
      window.dispatchEvent(new Event('storage'));
    }

    return {
      success: true,
      message:
        unassignedCount > 0
          ? `${generated.length}টি আসন বণ্টিত হয়েছে (${unassignedCount} জন শিক্ষার্থীর জন্য অতিরিক্ত কক্ষ প্রয়োজন)।`
          : `${generated.length} জন শিক্ষার্থীর আসন বণ্টন সম্পন্ন হয়েছে!`,
      entries: generated,
      unassignedCount,
    };
  },

  getInvigilatorDuties(examId?: string): InvigilatorDuty[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(DUTY_STORAGE_KEY);
      const parsed: InvigilatorDuty[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return examId ? parsed.filter((d) => d.examId === examId) : parsed;
    } catch {
      return [];
    }
  },

  autoAssignInvigilators(params: {
    examId: string;
    examTitle: string;
    date: string;
    shift: 'Morning' | 'Afternoon';
    roomIds: string[];
    teachers: TeacherRecord[];
    teachersPerRoom?: number;
  }): { success: boolean; message: string; duties: InvigilatorDuty[] } {
    const rooms = this.getRooms().filter((r) => params.roomIds.includes(r.id));
    if (rooms.length === 0) {
      return { success: false, message: 'পরীক্ষা কক্ষ নির্বাচন করুন।', duties: [] };
    }

    const leavesOnDate = leaveService
      .getLeaves()
      .filter((l) => l.status === 'approved' && l.startDate <= params.date && l.endDate >= params.date);
    const leaveIds = new Set(leavesOnDate.map((l) => l.teacherId.toLowerCase()));
    const leaveNames = new Set(leavesOnDate.map((l) => l.teacherName.trim().toLowerCase()));

    const eligible = params.teachers.filter(
      (t) =>
        t.status === 'active' &&
        !leaveIds.has(t.id.toLowerCase()) &&
        !leaveNames.has(t.name.trim().toLowerCase())
    );

    if (eligible.length === 0) {
      return { success: false, message: 'নির্বাচিত তারিখে দায়িত্ব দেওয়ার মতো সক্রিয় শিক্ষক পাওয়া যায়নি।', duties: [] };
    }

    const perRoom = Math.max(1, params.teachersPerRoom || 2);
    const duties: InvigilatorDuty[] = [];
    let cursor = 0;

    for (const room of rooms) {
      const assignedIds: string[] = [];
      const assignedNames: string[] = [];
      for (let i = 0; i < Math.min(perRoom, eligible.length); i++) {
        const tch = eligible[cursor % eligible.length];
        cursor++;
        if (!assignedIds.includes(tch.id)) {
          assignedIds.push(tch.id);
          assignedNames.push(tch.name);
        }
      }
      duties.push({
        id: `INV-${params.examId}-${params.date}-${params.shift}-${room.id}`,
        examId: params.examId,
        examTitle: params.examTitle,
        date: params.date,
        shift: params.shift,
        roomId: room.id,
        roomNo: room.roomNo,
        roomName: room.roomName,
        teacherIds: assignedIds,
        teacherNames: assignedNames,
      });
    }

    if (typeof window !== 'undefined') {
      const others = this.getInvigilatorDuties().filter(
        (d) => !(d.examId === params.examId && d.date === params.date && d.shift === params.shift)
      );
      localStorage.setItem(DUTY_STORAGE_KEY, JSON.stringify([...others, ...duties]));
      window.dispatchEvent(new Event('storage'));
    }

    return {
      success: true,
      message: `${rooms.length}টি কক্ষে ${duties.length}টি পরিদর্শক ডিউটি রোস্টার তৈরি হয়েছে!`,
      duties,
    };
  },
};
