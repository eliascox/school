'use client';

import { Student } from './studentService';
import { leaveService } from './leaveService';
import { TeacherRecord } from './teacherRBACService';
import { auditTrailService } from './auditTrailService';
import type { ClassItem } from './classSectionService';
import {
  type ColumnGenderRule,
  type NormalizedGender,
  type SeatGenderMode,
  type ClassDistributionMode,
  type SeatFillOrder,
  compareSeatRolls,
  normalizeSeatGender,
  getStudentClassBucketKey,
  getBenchesForColumn,
  getRoomColumnGenders,
  formatGenderRuleBn,
  toAsciiDigits,
  toBanglaDigits,
} from '@/lib/seatPlanUtils';

export interface ExamHallRoom {
  id: string;
  roomNo: string;
  roomName: string;
  building?: string;
  rows: number;
  cols: number;
  seatsPerBench: 1 | 2 | 3;
  columnGenders?: ColumnGenderRule[];
  roomGender?: ColumnGenderRule;
  benchesPerColumn?: number[];
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
  gender?: NormalizedGender;
  columnLabel?: string;
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

export interface AdvancedSeatPlanParams {
  examId: string;
  examTitle: string;
  students: Student[];
  roomIds: string[];
  genderMode: SeatGenderMode;
  classDistribution: ClassDistributionMode;
  globalColumnGenders?: ColumnGenderRule[];
  fillOrder?: SeatFillOrder;
  strictGenderOverflow?: boolean;
  strictAntiCheatSinglePerBench?: boolean;
}

export interface AdvancedSeatPlanResult {
  success: boolean;
  message: string;
  entries: SeatPlanEntry[];
  totalSelected: number;
  totalBoys: number;
  totalGirls: number;
  totalOther: number;
  assignedBoys: number;
  assignedGirls: number;
  assignedOther: number;
  unassignedCount: number;
  unassignedBoys: number;
  unassignedGirls: number;
  unassignedOther: number;
  unassignedStudents: Student[];
}

const ROOMS_STORAGE_KEY = 'sms_exam_hall_rooms';
const SEATS_STORAGE_KEY = 'sms_exam_seat_plans';
const DUTY_STORAGE_KEY = 'sms_exam_invigilator_duties';

const DEFAULT_ROOMS: ExamHallRoom[] = [
  {
    id: 'room-101',
    roomNo: '১০১',
    roomName: 'কক্ষ নং ১০১ (মূল ভবন)',
    building: 'মূল ভবন',
    rows: 7,
    cols: 3,
    seatsPerBench: 2,
    columnGenders: ['male', 'female', 'female'],
    roomGender: 'any',
  },
  {
    id: 'room-102',
    roomNo: '১০২',
    roomName: 'কক্ষ নং ১০২ (মূল ভবন)',
    building: 'মূল ভবন',
    rows: 7,
    cols: 3,
    seatsPerBench: 2,
    columnGenders: ['male', 'female', 'female'],
    roomGender: 'any',
  },
  {
    id: 'room-201',
    roomNo: '২০১',
    roomName: 'বিজ্ঞান ভবন হল',
    building: 'বিজ্ঞান ভবন',
    rows: 7,
    cols: 3,
    seatsPerBench: 2,
    columnGenders: ['male', 'female', 'female'],
    roomGender: 'any',
  },
];

const CLASS_ORDER_WEIGHT: Record<string, number> = {
  '6th': 10,
  '7th': 20,
  '8th': 30,
  '9th::বিজ্ঞান': 41,
  '9th::মানবিক': 42,
  '9th::ব্যবসায় শিক্ষা': 43,
  '9th::সাধারণ': 44,
  '10th::বিজ্ঞান': 51,
  '10th::মানবিক': 52,
  '10th::ব্যবসায় শিক্ষা': 53,
  '10th::সাধারণ': 54,
};

const getPositions = (seatsPerBench: 1 | 2 | 3): Array<'L' | 'M' | 'R'> =>
  seatsPerBench === 1 ? ['L'] : seatsPerBench === 2 ? ['L', 'R'] : ['L', 'M', 'R'];

interface SlotDescriptor {
  room: ExamHallRoom;
  colIndex: number; // 1-based
  rowIndex: number; // 1-based
  benchNo: number; // 1-based unique per room
  seatPosition: 'L' | 'M' | 'R';
  benchKey: string;
  rule: ColumnGenderRule;
  columnLabel: string;
}

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

  saveRooms(rooms: ExamHallRoom[]): ExamHallRoom[] {
    const safeRooms = rooms.length > 0 ? rooms : DEFAULT_ROOMS;
    if (typeof window !== 'undefined') {
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(safeRooms));
      window.dispatchEvent(new Event('storage'));
    }
    return safeRooms;
  },

  deleteRoom(roomId: string): ExamHallRoom[] {
    const next = this.getRooms().filter((r) => r.id !== roomId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event('storage'));
    }
    return next;
  },

  syncRoomsFromAcademicClasses(
    classes: ClassItem[],
    defaults?: {
      cols?: number;
      rows?: number;
      seatsPerBench?: 1 | 2 | 3;
      columnGenders?: ColumnGenderRule[];
    }
  ): ExamHallRoom[] {
    const existing = this.getRooms();
    const existingByNormNo = new Map<string, ExamHallRoom>();
    existing.forEach((r) => {
      const norm = toAsciiDigits(r.roomNo).replace(/[^\da-z]/gi, '').toLowerCase();
      if (norm) existingByNormNo.set(norm, r);
    });

    const cols = Math.min(6, Math.max(1, defaults?.cols || 3));
    const rows = Math.min(20, Math.max(1, defaults?.rows || 7));
    const seatsPerBench: 1 | 2 | 3 =
      defaults?.seatsPerBench === 1 || defaults?.seatsPerBench === 3 ? defaults.seatsPerBench : 2;
    const colGenders: ColumnGenderRule[] = Array.from(
      { length: cols },
      (_, i) => defaults?.columnGenders?.[i] || 'any'
    );

    const syncedRooms: ExamHallRoom[] = [...existing];
    let added = 0;

    for (const cls of classes) {
      for (const sec of cls.sections || []) {
        const rawRoom = (sec.room || '').trim();
        if (!rawRoom) continue;
        const numMatch = toAsciiDigits(rawRoom).match(/\d+/);
        const roomNoAscii = numMatch ? numMatch[0] : rawRoom;
        const normKey = roomNoAscii.replace(/[^\da-z]/gi, '').toLowerCase();
        if (!normKey || existingByNormNo.has(normKey)) continue;

        const roomNoBn = toBanglaDigits(roomNoAscii);
        const estimatedBenches = Math.max(
          rows,
          Math.ceil((sec.capacity || cols * rows * seatsPerBench) / (cols * seatsPerBench))
        );
        const newRoom: ExamHallRoom = {
          id: `room-cls-${normKey}`,
          roomNo: roomNoBn,
          roomName: `কক্ষ নং ${roomNoBn} (${cls.nameBn || cls.name})`,
          building: cls.nameBn || 'একাডেমিক ভবন',
          rows: Math.min(20, Math.max(1, estimatedBenches)),
          cols,
          seatsPerBench,
          columnGenders: [...colGenders],
          roomGender: 'any',
        };
        existingByNormNo.set(normKey, newRoom);
        syncedRooms.push(newRoom);
        added += 1;
      }
    }

    if (added > 0 && typeof window !== 'undefined') {
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(syncedRooms));
      window.dispatchEvent(new Event('storage'));
    }

    return syncedRooms;
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

  swapSeats(
    examId: string,
    seatIdA: string,
    seatIdB: string
  ): { success: boolean; message: string; entries: SeatPlanEntry[] } {
    if (seatIdA === seatIdB) {
      return {
        success: false,
        message: 'অদল-বদল করার জন্য দুটি ভিন্ন আসন নির্বাচন করুন।',
        entries: this.getSeatPlans(examId),
      };
    }

    const all = this.getSeatPlans();
    const idxA = all.findIndex((s) => s.examId === examId && s.id === seatIdA);
    const idxB = all.findIndex((s) => s.examId === examId && s.id === seatIdB);

    if (idxA < 0 || idxB < 0) {
      return {
        success: false,
        message: 'নির্বাচিত আসন খুঁজে পাওয়া যায়নি।',
        entries: this.getSeatPlans(examId),
      };
    }

    const a = all[idxA];
    const b = all[idxB];

    const updatedA: SeatPlanEntry = {
      ...a,
      studentId: b.studentId,
      studentName: b.studentName,
      roll: b.roll,
      grade: b.grade,
      section: b.section,
      group: b.group,
      gender: b.gender,
    };

    const updatedB: SeatPlanEntry = {
      ...b,
      studentId: a.studentId,
      studentName: a.studentName,
      roll: a.roll,
      grade: a.grade,
      section: a.section,
      group: a.group,
      gender: a.gender,
    };

    const nextAll = all.map((entry, idx) =>
      idx === idxA ? updatedA : idx === idxB ? updatedB : entry
    );

    if (typeof window !== 'undefined') {
      localStorage.setItem(SEATS_STORAGE_KEY, JSON.stringify(nextAll));
      window.dispatchEvent(new Event('storage'));
    }

    return {
      success: true,
      message: `${a.studentName} (রোল ${a.roll}) এবং ${b.studentName} (রোল ${b.roll})-এর আসন অদল-বদল হয়েছে।`,
      entries: nextAll.filter((s) => s.examId === examId),
    };
  },

  /**
   * Legacy seat-plan generator preserved for 100% backward compatibility.
   */
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

    const pQueue = [...params.primaryStudents].sort(compareSeatRolls);
    const sQueue = [...(params.secondaryStudents || [])].sort(compareSeatRolls);
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
        const positions = getPositions(room.seatsPerBench);

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
            gender: normalizeSeatGender(st.gender),
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

  /**
   * Advanced multi-class, column-gender-aware & anti-cheat seat plan generator.
   * Supports:
   * - column_split (e.g., Col 1 = Boys, Col 2 & 3 = Girls)
   * - boys_only / girls_only
   * - separate_rooms (dedicated boys rooms & girls rooms — never mixed in same room)
   * - combined (all together)
   * Seamlessly combines with anti_cheat_bench / sequential / anti_cheat_alternate!
   */
  generateAdvancedSeatPlan(params: AdvancedSeatPlanParams): AdvancedSeatPlanResult {
    const allRooms = this.getRooms();
    // Preserve the exact room order selected by the user
    const roomById = new Map(allRooms.map((r) => [r.id, r]));
    const selectedRooms: ExamHallRoom[] = params.roomIds
      .map((id) => roomById.get(id))
      .filter((r): r is ExamHallRoom => Boolean(r));

    const emptyResult = (message: string): AdvancedSeatPlanResult => ({
      success: false,
      message,
      entries: [],
      totalSelected: 0,
      totalBoys: 0,
      totalGirls: 0,
      totalOther: 0,
      assignedBoys: 0,
      assignedGirls: 0,
      assignedOther: 0,
      unassignedCount: 0,
      unassignedBoys: 0,
      unassignedGirls: 0,
      unassignedOther: 0,
      unassignedStudents: [],
    });

    if (selectedRooms.length === 0) {
      return emptyResult('অন্তত একটি পরীক্ষা কক্ষ নির্বাচন করুন।');
    }

    // Deduplicate students and normalize gender
    const uniqueStudents: Array<{ student: Student; gender: NormalizedGender; classKey: string }> = [];
    const dedupeSet = new Set<string>();

    for (const st of params.students) {
      if (!st || !st.id || dedupeSet.has(st.id)) continue;
      const g = normalizeSeatGender(st.gender);
      if (params.genderMode === 'boys_only' && g !== 'male') continue;
      if (params.genderMode === 'girls_only' && g !== 'female') continue;
      dedupeSet.add(st.id);
      uniqueStudents.push({
        student: st,
        gender: g,
        classKey: getStudentClassBucketKey(st),
      });
    }

    if (uniqueStudents.length === 0) {
      return emptyResult('নির্বাচিত শ্রেণি ও লিঙ্গ ফিল্টার অনুযায়ী কোনো শিক্ষার্থী পাওয়া যায়নি।');
    }

    // Group into ordered class queues (each sorted numerically by roll)
    const classQueueMap = new Map<
      string,
      Array<{ student: Student; gender: NormalizedGender; classKey: string }>
    >();
    for (const item of uniqueStudents) {
      if (!classQueueMap.has(item.classKey)) classQueueMap.set(item.classKey, []);
      classQueueMap.get(item.classKey)!.push(item);
    }

    const classQueues = Array.from(classQueueMap.entries())
      .sort(([kA], [kB]) => {
        const wA = CLASS_ORDER_WEIGHT[kA] ?? 99;
        const wB = CLASS_ORDER_WEIGHT[kB] ?? 99;
        if (wA !== wB) return wA - wB;
        return kA.localeCompare(kB);
      })
      .map(([classKey, items]) => ({
        classKey,
        items: items.sort((a, b) => compareSeatRolls(a.student, b.student)),
      }));

    const seatedIds = new Set<string>();
    let roundRobinCursor = 0;

    const countRemaining = (
      queue: { classKey: string; items: Array<{ student: Student; gender: NormalizedGender }> },
      rule: ColumnGenderRule
    ): number => {
      let c = 0;
      for (const it of queue.items) {
        if (seatedIds.has(it.student.id)) continue;
        if (rule === 'any' || it.gender === rule) c += 1;
      }
      return c;
    };

    const totalRemainingByGender = (g: NormalizedGender): number => {
      let c = 0;
      for (const q of classQueues) {
        for (const it of q.items) {
          if (!seatedIds.has(it.student.id) && it.gender === g) c += 1;
        }
      }
      return c;
    };

    const popFromQueue = (
      queue: { classKey: string; items: Array<{ student: Student; gender: NormalizedGender; classKey: string }> },
      rule: ColumnGenderRule
    ) => {
      for (const it of queue.items) {
        if (seatedIds.has(it.student.id)) continue;
        if (rule === 'any' || it.gender === rule) {
          seatedIds.add(it.student.id);
          return it;
        }
      }
      return null;
    };

    const pickStudentForSlot = (
      rule: ColumnGenderRule,
      benchUsedClasses: Set<string>,
      isSubsequentSeatOnBench: boolean
    ): { student: Student; gender: NormalizedGender; classKey: string } | null => {
      const activeQueues = classQueues
        .map((q) => ({ q, rem: countRemaining(q, rule) }))
        .filter((x) => x.rem > 0);

      if (activeQueues.length === 0) return null;

      if (params.classDistribution === 'sequential') {
        return popFromQueue(activeQueues[0].q, rule);
      }

      if (params.classDistribution === 'anti_cheat_bench') {
        const distinct = activeQueues.filter((x) => !benchUsedClasses.has(x.q.classKey));
        if (distinct.length > 0) {
          // Pick the class with the largest remaining pool to maximize cross-class bench pairings
          distinct.sort((a, b) => b.rem - a.rem);
          return popFromQueue(distinct[0].q, rule);
        }
        if (params.strictAntiCheatSinglePerBench && isSubsequentSeatOnBench) {
          return null;
        }
        activeQueues.sort((a, b) => b.rem - a.rem);
        return popFromQueue(activeQueues[0].q, rule);
      }

      // anti_cheat_alternate: round-robin across distinct classes first
      const distinct = activeQueues.filter((x) => !benchUsedClasses.has(x.q.classKey));
      const candidates =
        distinct.length > 0
          ? distinct
          : params.strictAntiCheatSinglePerBench && isSubsequentSeatOnBench
          ? []
          : activeQueues;

      if (candidates.length === 0) return null;
      const chosen = candidates[roundRobinCursor % candidates.length];
      roundRobinCursor += 1;
      return popFromQueue(chosen.q, rule);
    };

    const fillOrder: SeatFillOrder = params.fillOrder || 'column_first';
    const strictGender = params.strictGenderOverflow !== false;

    const buildRoomSlots = (room: ExamHallRoom, overrideRoomRule?: ColumnGenderRule): SlotDescriptor[] => {
      const cols = Math.max(1, room.cols || 1);
      const colRules = getRoomColumnGenders(room, params.globalColumnGenders);
      const positions = getPositions(room.seatsPerBench || 2);
      const colBenchCounts = Array.from({ length: cols }, (_, c) => getBenchesForColumn(room, c));
      const maxRows = Math.max(...colBenchCounts, 1);

      const slots: SlotDescriptor[] = [];

      const resolveRule = (colZeroIdx: number): ColumnGenderRule => {
        if (overrideRoomRule) return overrideRoomRule;
        if (params.genderMode === 'boys_only') return 'male';
        if (params.genderMode === 'girls_only') return 'female';
        if (params.genderMode === 'combined') return 'any';
        return colRules[colZeroIdx] || 'any';
      };

      // Precompute unique 1-based benchNo per (col, row)
      const benchNoGrid = new Map<string, number>();
      let runningBench = 1;
      if (fillOrder === 'column_first') {
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < colBenchCounts[c]; r++) {
            benchNoGrid.set(`${c}:${r}`, runningBench++);
          }
        }
      } else {
        for (let r = 0; r < maxRows; r++) {
          for (let c = 0; c < cols; c++) {
            if (r < colBenchCounts[c]) {
              benchNoGrid.set(`${c}:${r}`, runningBench++);
            }
          }
        }
      }

      if (fillOrder === 'column_first') {
        for (let c = 0; c < cols; c++) {
          const rule = resolveRule(c);
          const colLabel = `সারি ${toBanglaDigits(c + 1)} (${formatGenderRuleBn(rule)})`;
          for (let r = 0; r < colBenchCounts[c]; r++) {
            const benchNo = benchNoGrid.get(`${c}:${r}`) || 1;
            const benchKey = `${room.id}-B${benchNo}`;
            for (const pos of positions) {
              slots.push({
                room,
                colIndex: c + 1,
                rowIndex: r + 1,
                benchNo,
                seatPosition: pos,
                benchKey,
                rule,
                columnLabel: colLabel,
              });
            }
          }
        }
      } else {
        for (let r = 0; r < maxRows; r++) {
          for (let c = 0; c < cols; c++) {
            if (r >= colBenchCounts[c]) continue;
            const rule = resolveRule(c);
            const colLabel = `সারি ${toBanglaDigits(c + 1)} (${formatGenderRuleBn(rule)})`;
            const benchNo = benchNoGrid.get(`${c}:${r}`) || 1;
            const benchKey = `${room.id}-B${benchNo}`;
            for (const pos of positions) {
              slots.push({
                room,
                colIndex: c + 1,
                rowIndex: r + 1,
                benchNo,
                seatPosition: pos,
                benchKey,
                rule,
                columnLabel: colLabel,
              });
            }
          }
        }
      }

      return slots;
    };

    const generated: SeatPlanEntry[] = [];
    const filledSlotIndices = new Set<number>();
    const benchClassesUsed = new Map<string, Set<string>>();
    const allSlots: SlotDescriptor[] = [];

    const fillSlotList = (slots: SlotDescriptor[], baseOffset: number) => {
      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        if (!benchClassesUsed.has(slot.benchKey)) {
          benchClassesUsed.set(slot.benchKey, new Set());
        }
        const usedClasses = benchClassesUsed.get(slot.benchKey)!;
        const picked = pickStudentForSlot(slot.rule, usedClasses, usedClasses.size > 0);
        if (!picked) continue;

        usedClasses.add(picked.classKey);
        filledSlotIndices.add(baseOffset + i);
        generated.push({
          id: `SEAT-${params.examId}-${slot.room.id}-B${slot.benchNo}-${slot.seatPosition}`,
          examId: params.examId,
          examTitle: params.examTitle,
          roomId: slot.room.id,
          roomNo: slot.room.roomNo,
          roomName: slot.room.roomName,
          benchNo: slot.benchNo,
          rowIndex: slot.rowIndex,
          colIndex: slot.colIndex,
          seatPosition: slot.seatPosition,
          studentId: picked.student.id,
          studentName: picked.student.name,
          roll: picked.student.roll,
          grade: picked.student.grade,
          section: picked.student.section || picked.student.branch || 'A',
          group: picked.student.group || 'সাধারণ',
          gender: picked.gender,
          columnLabel: slot.columnLabel,
        });
      }
    };

    if (params.genderMode === 'separate_rooms') {
      // Pass 1: Dedicated boys rooms & dedicated girls rooms first
      const explicitMaleRooms = selectedRooms.filter((r) => r.roomGender === 'male');
      const explicitFemaleRooms = selectedRooms.filter((r) => r.roomGender === 'female');
      const flexRooms = selectedRooms.filter((r) => !r.roomGender || r.roomGender === 'any');

      for (const room of explicitMaleRooms) {
        const offset = allSlots.length;
        const slots = buildRoomSlots(room, 'male');
        allSlots.push(...slots);
        fillSlotList(slots, offset);
      }

      for (const room of explicitFemaleRooms) {
        const offset = allSlots.length;
        const slots = buildRoomSlots(room, 'female');
        allSlots.push(...slots);
        fillSlotList(slots, offset);
      }

      // Pass 2: Flexible rooms assigned cleanly to one gender per room (Boys rooms contiguous, then Girls rooms)
      for (const room of flexRooms) {
        const remBoys = totalRemainingByGender('male');
        const remGirls = totalRemainingByGender('female');
        const remOther = totalRemainingByGender('other');

        let roomRule: ColumnGenderRule | null = null;
        if (remBoys > 0) roomRule = 'male';
        else if (remGirls > 0) roomRule = 'female';
        else if (remOther > 0) roomRule = 'any';

        if (!roomRule) break;
        const offset = allSlots.length;
        const slots = buildRoomSlots(room, roomRule);
        allSlots.push(...slots);
        fillSlotList(slots, offset);
      }
    } else {
      // Standard pass across all selected rooms honoring per-column gender rules
      for (const room of selectedRooms) {
        const offset = allSlots.length;
        const slots = buildRoomSlots(room);
        allSlots.push(...slots);
        fillSlotList(slots, offset);
      }

      // Optional overflow pass (only if user explicitly disables strictGenderOverflow)
      if (!strictGender && seatedIds.size < uniqueStudents.length) {
        for (let i = 0; i < allSlots.length; i++) {
          if (filledSlotIndices.has(i)) continue;
          const slot = allSlots[i];
          if (!benchClassesUsed.has(slot.benchKey)) {
            benchClassesUsed.set(slot.benchKey, new Set());
          }
          const usedClasses = benchClassesUsed.get(slot.benchKey)!;
          const picked = pickStudentForSlot('any', usedClasses, usedClasses.size > 0);
          if (!picked) break;

          usedClasses.add(picked.classKey);
          filledSlotIndices.add(i);
          generated.push({
            id: `SEAT-${params.examId}-${slot.room.id}-B${slot.benchNo}-${slot.seatPosition}`,
            examId: params.examId,
            examTitle: params.examTitle,
            roomId: slot.room.id,
            roomNo: slot.room.roomNo,
            roomName: slot.room.roomName,
            benchNo: slot.benchNo,
            rowIndex: slot.rowIndex,
            colIndex: slot.colIndex,
            seatPosition: slot.seatPosition,
            studentId: picked.student.id,
            studentName: picked.student.name,
            roll: picked.student.roll,
            grade: picked.student.grade,
            section: picked.student.section || picked.student.branch || 'A',
            group: picked.student.group || 'সাধারণ',
            gender: picked.gender,
            columnLabel: slot.columnLabel,
          });
        }
      }
    }

    // Sort generated entries cleanly by room order -> colIndex -> rowIndex -> seatPosition
    const roomOrderMap = new Map(selectedRooms.map((r, idx) => [r.id, idx]));
    const posWeight: Record<'L' | 'M' | 'R', number> = { L: 0, M: 1, R: 2 };
    generated.sort((a, b) => {
      const ra = roomOrderMap.get(a.roomId) ?? 999;
      const rb = roomOrderMap.get(b.roomId) ?? 999;
      if (ra !== rb) return ra - rb;
      if (a.colIndex !== b.colIndex) return a.colIndex - b.colIndex;
      if (a.rowIndex !== b.rowIndex) return a.rowIndex - b.rowIndex;
      return posWeight[a.seatPosition] - posWeight[b.seatPosition];
    });

    const unassignedItems = uniqueStudents.filter((u) => !seatedIds.has(u.student.id));
    const totalBoys = uniqueStudents.filter((u) => u.gender === 'male').length;
    const totalGirls = uniqueStudents.filter((u) => u.gender === 'female').length;
    const totalOther = uniqueStudents.filter((u) => u.gender === 'other').length;

    const assignedBoys = generated.filter((e) => e.gender === 'male').length;
    const assignedGirls = generated.filter((e) => e.gender === 'female').length;
    const assignedOther = generated.filter((e) => e.gender === 'other').length;

    const unassignedBoys = unassignedItems.filter((u) => u.gender === 'male').length;
    const unassignedGirls = unassignedItems.filter((u) => u.gender === 'female').length;
    const unassignedOther = unassignedItems.filter((u) => u.gender === 'other').length;

    if (typeof window !== 'undefined') {
      const others = this.getSeatPlans().filter((s) => s.examId !== params.examId);
      localStorage.setItem(SEATS_STORAGE_KEY, JSON.stringify([...others, ...generated]));
      auditTrailService.addLog({
        action: 'EXAM_SEAT_PLAN_GENERATED',
        category: 'Examination',
        details: `${params.examTitle}-এর জন্য ${selectedRooms.length}টি কক্ষে ${generated.length} জন শিক্ষার্থীর (ছাত্র ${assignedBoys}, ছাত্রী ${assignedGirls}) সিট প্ল্যান তৈরি হয়েছে।`,
        performedBy: 'অ্যাডমিন',
        status: 'Success',
      });
      window.dispatchEvent(new Event('storage'));
    }

    const usedRoomCount = new Set(generated.map((e) => e.roomId)).size;
    const shortfallParts: string[] = [];
    if (unassignedBoys > 0) shortfallParts.push(`ছাত্র ${toBanglaDigits(unassignedBoys)} জন`);
    if (unassignedGirls > 0) shortfallParts.push(`ছাত্রী ${toBanglaDigits(unassignedGirls)} জন`);
    if (unassignedOther > 0) shortfallParts.push(`অন্যান্য ${toBanglaDigits(unassignedOther)} জন`);

    const message =
      unassignedItems.length > 0
        ? `${toBanglaDigits(usedRoomCount)}টি কক্ষে ${toBanglaDigits(generated.length)} জনের আসন বণ্টিত হয়েছে — বাকি ${shortfallParts.join(', ')} (অতিরিক্ত কক্ষ বা সারি সমন্বয় করুন)।`
        : `${toBanglaDigits(usedRoomCount)}টি কক্ষে ${toBanglaDigits(generated.length)} জন শিক্ষার্থীর (ছাত্র ${toBanglaDigits(assignedBoys)}, ছাত্রী ${toBanglaDigits(assignedGirls)}) আসন বিন্যাস সম্পন্ন হয়েছে!`;

    return {
      success: true,
      message,
      entries: generated,
      totalSelected: uniqueStudents.length,
      totalBoys,
      totalGirls,
      totalOther,
      assignedBoys,
      assignedGirls,
      assignedOther,
      unassignedCount: unassignedItems.length,
      unassignedBoys,
      unassignedGirls,
      unassignedOther,
      unassignedStudents: unassignedItems.map((u) => u.student),
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
