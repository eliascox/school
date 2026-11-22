'use client';

import { leaveService } from './leaveService';
import {
  SubjectAssignment,
  TeacherRecord,
  teacherRBACService,
} from './teacherRBACService';
import { auditTrailService } from './auditTrailService';

export type RoutineDayKey =
  | 'Saturday'
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday';

export interface RoutineDayConfig {
  key: RoutineDayKey;
  labelBn: string;
}

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
  grade: string; // e.g. "6th", "8th", "9th"
  branch: string; // e.g. "A", "B", "Science", "Humanities"
  day: RoutineDayKey;
  dayBn: string;
  periodNo: number;
  subject: string;
  teacherId?: string;
  teacherName: string;
  roomNo: string;
}

export interface RoutineConflict {
  type: 'teacher' | 'room';
  message: string;
  conflictingSlot: RoutineSlot;
}

export interface TeacherSlotAvailability {
  teacher: TeacherRecord;
  isFree: boolean;
  conflictingSlot?: RoutineSlot;
  assignedSubjects: SubjectAssignment[];
  dayLoad: number;
  weeklyLoad: number;
}

export interface SubstitutionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  day: RoutineSlot['day'];
  periodNo: number;
  classId: string;
  subject: string;
  absentTeacherId?: string;
  absentTeacherName: string;
  substituteTeacherId?: string;
  substituteTeacherName: string;
  roomNo?: string;
  reason?: string;
  status: 'assigned' | 'completed';
  createdAt: string;
}

export interface SubstituteCandidate {
  teacherId: string;
  teacherName: string;
  designation: string;
  isFreeAtPeriod: boolean;
  periodsAssignedOnDay: number;
  isOnLeave: boolean;
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

export const ALL_WEEK_DAYS: RoutineDayConfig[] = [
  { key: 'Saturday', labelBn: 'শনিবার' },
  { key: 'Sunday', labelBn: 'রবিবার' },
  { key: 'Monday', labelBn: 'সোমবার' },
  { key: 'Tuesday', labelBn: 'মঙ্গলবার' },
  { key: 'Wednesday', labelBn: 'বুধবার' },
  { key: 'Thursday', labelBn: 'বৃহস্পতিবার' },
  { key: 'Friday', labelBn: 'শুক্রবার' },
];

export const ROUTINE_DAYS: RoutineDayConfig[] = [
  { key: 'Saturday', labelBn: 'শনিবার' },
  { key: 'Sunday', labelBn: 'রবিবার' },
  { key: 'Monday', labelBn: 'সোমবার' },
  { key: 'Tuesday', labelBn: 'মঙ্গলবার' },
  { key: 'Wednesday', labelBn: 'বুধবার' },
  { key: 'Thursday', labelBn: 'বৃহস্পতিবার' },
];

export const ROUTINE_STORAGE_KEY = 'sms_master_class_routine';
export const SUBSTITUTION_STORAGE_KEY = 'sms_routine_substitutions';
export const PERIODS_STORAGE_KEY = 'sms_routine_periods_config';
export const DAYS_STORAGE_KEY = 'sms_routine_days_config';

const JS_DAY_TO_ROUTINE_DAY: Record<number, RoutineDayKey> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

const VALID_DAY_KEYS = new Set<RoutineDayKey>(ALL_WEEK_DAYS.map((d) => d.key));

const norm = (v?: string) => (v || '').trim().toLowerCase();

const dispatchStorageSync = () => {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new Event('storage'));
    } catch {
      // Ignore synthetic Event issues in non-DOM test runtimes
    }
  }
};

class RoutineService {
  // ─── DYNAMIC PERIODS CONFIGURATION ────────────────────────────────────────
  getPeriods(): RoutinePeriod[] {
    if (typeof window === 'undefined') {
      return ROUTINE_PERIODS.map((p) => ({ ...p }));
    }
    try {
      const raw = localStorage.getItem(PERIODS_STORAGE_KEY);
      if (!raw) return ROUTINE_PERIODS.map((p) => ({ ...p }));
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return ROUTINE_PERIODS.map((p) => ({ ...p }));
      }
      const seen = new Set<number>();
      const valid: RoutinePeriod[] = [];
      for (const item of parsed) {
        if (!item || typeof item !== 'object') continue;
        const pNo = Number((item as Partial<RoutinePeriod>).periodNo);
        if (!Number.isInteger(pNo) || pNo <= 0 || seen.has(pNo)) continue;
        seen.add(pNo);
        valid.push({
          periodNo: pNo,
          periodName: String((item as Partial<RoutinePeriod>).periodName || `পিরিয়ড ${pNo}`).trim(),
          startTime: String((item as Partial<RoutinePeriod>).startTime || '').trim() || '১০:০০ AM',
          endTime: String((item as Partial<RoutinePeriod>).endTime || '').trim() || '১০:৪৫ AM',
          isBreak: Boolean((item as Partial<RoutinePeriod>).isBreak),
        });
      }
      return valid.length > 0 ? valid : ROUTINE_PERIODS.map((p) => ({ ...p }));
    } catch {
      return ROUTINE_PERIODS.map((p) => ({ ...p }));
    }
  }

  savePeriods(periods: RoutinePeriod[]): { success: boolean; message: string; periods: RoutinePeriod[] } {
    if (typeof window === 'undefined') {
      return { success: false, message: 'ব্রাউজার অনুপস্থিত', periods };
    }
    if (!Array.isArray(periods) || periods.length === 0) {
      return {
        success: false,
        message: 'রুটিনে অন্তত একটি পিরিয়ড থাকতে হবে।',
        periods: this.getPeriods(),
      };
    }

    const seen = new Set<number>();
    const cleaned: RoutinePeriod[] = [];
    for (let i = 0; i < periods.length; i++) {
      const item = periods[i];
      const name = String(item.periodName || '').trim();
      const startTime = String(item.startTime || '').trim();
      const endTime = String(item.endTime || '').trim();
      if (!name || !startTime || !endTime) {
        return {
          success: false,
          message: 'প্রতিটি পিরিয়ডের নাম, শুরুর সময় এবং শেষের সময় অবশ্যই পূরণ করতে হবে।',
          periods: this.getPeriods(),
        };
      }
      let pNo = Number(item.periodNo);
      if (!Number.isInteger(pNo) || pNo <= 0 || seen.has(pNo)) {
        pNo = Math.max(0, ...Array.from(seen), ...periods.map((p) => Number(p.periodNo) || 0)) + 1;
      }
      seen.add(pNo);
      cleaned.push({
        periodNo: pNo,
        periodName: name,
        startTime,
        endTime,
        isBreak: Boolean(item.isBreak),
      });
    }

    localStorage.setItem(PERIODS_STORAGE_KEY, JSON.stringify(cleaned));
    dispatchStorageSync();
    return {
      success: true,
      message: 'পিরিয়ড ও সময়সূচি সফলভাবে সংরক্ষণ করা হয়েছে।',
      periods: cleaned,
    };
  }

  addPeriod(input: {
    periodName: string;
    startTime: string;
    endTime: string;
    isBreak?: boolean;
  }): { success: boolean; message: string; period?: RoutinePeriod; periods: RoutinePeriod[] } {
    const current = this.getPeriods();
    const name = input.periodName.trim();
    const startTime = input.startTime.trim();
    const endTime = input.endTime.trim();
    if (!name || !startTime || !endTime) {
      return {
        success: false,
        message: 'পিরিয়ডের নাম, শুরুর সময় ও শেষের সময় প্রদান করুন।',
        periods: current,
      };
    }
    const nextPeriodNo = current.reduce((max, p) => Math.max(max, p.periodNo), 0) + 1;
    const created: RoutinePeriod = {
      periodNo: nextPeriodNo,
      periodName: name,
      startTime,
      endTime,
      isBreak: Boolean(input.isBreak),
    };
    const res = this.savePeriods([...current, created]);
    return {
      success: res.success,
      message: res.success ? `"${created.periodName}" সফলভাবে যুক্ত করা হয়েছে।` : res.message,
      period: res.success ? created : undefined,
      periods: res.periods,
    };
  }

  updatePeriod(
    periodNo: number,
    updates: Partial<Omit<RoutinePeriod, 'periodNo'>>
  ): { success: boolean; message: string; periods: RoutinePeriod[] } {
    const current = this.getPeriods();
    if (!current.some((p) => p.periodNo === periodNo)) {
      return { success: false, message: 'নির্বাচিত পিরিয়ডটি পাওয়া যায়নি।', periods: current };
    }
    const next = current.map((p) => (p.periodNo === periodNo ? { ...p, ...updates } : p));
    return this.savePeriods(next);
  }

  deletePeriod(periodNo: number): { success: boolean; message: string; periods: RoutinePeriod[] } {
    const current = this.getPeriods();
    if (current.length <= 1) {
      return {
        success: false,
        message: 'অন্তত একটি পিরিয়ড রাখতে হবে; একমাত্র পিরিয়ডটি মুছে ফেলা যাবে না।',
        periods: current,
      };
    }
    const next = current.filter((p) => p.periodNo !== periodNo);
    if (next.length === current.length) {
      return { success: false, message: 'পিরিয়ডটি পাওয়া যায়নি।', periods: current };
    }
    const res = this.savePeriods(next);
    return {
      success: res.success,
      message: res.success ? 'পিরিয়ডটি তালিকা থেকে মুছে ফেলা হয়েছে।' : res.message,
      periods: res.periods,
    };
  }

  resetDefaultPeriods(): RoutinePeriod[] {
    const defaults = ROUTINE_PERIODS.map((p) => ({ ...p }));
    if (typeof window !== 'undefined') {
      localStorage.setItem(PERIODS_STORAGE_KEY, JSON.stringify(defaults));
      dispatchStorageSync();
    }
    return defaults;
  }

  // ─── DYNAMIC DAYS CONFIGURATION ───────────────────────────────────────────
  getDays(): RoutineDayConfig[] {
    if (typeof window === 'undefined') {
      return ROUTINE_DAYS.map((d) => ({ ...d }));
    }
    try {
      const raw = localStorage.getItem(DAYS_STORAGE_KEY);
      if (!raw) return ROUTINE_DAYS.map((d) => ({ ...d }));
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return ROUTINE_DAYS.map((d) => ({ ...d }));
      }
      const seen = new Set<RoutineDayKey>();
      const valid: RoutineDayConfig[] = [];
      for (const item of parsed) {
        if (!item || typeof item !== 'object') continue;
        const key = (item as Partial<RoutineDayConfig>).key as RoutineDayKey;
        if (!VALID_DAY_KEYS.has(key) || seen.has(key)) continue;
        seen.add(key);
        const fallbackLabel = ALL_WEEK_DAYS.find((d) => d.key === key)?.labelBn || key;
        valid.push({
          key,
          labelBn: String((item as Partial<RoutineDayConfig>).labelBn || fallbackLabel).trim() || fallbackLabel,
        });
      }
      return valid.length > 0 ? valid : ROUTINE_DAYS.map((d) => ({ ...d }));
    } catch {
      return ROUTINE_DAYS.map((d) => ({ ...d }));
    }
  }

  saveDays(days: RoutineDayConfig[]): { success: boolean; message: string; days: RoutineDayConfig[] } {
    if (typeof window === 'undefined') {
      return { success: false, message: 'ব্রাউজার অনুপস্থিত', days };
    }
    if (!Array.isArray(days) || days.length === 0) {
      return {
        success: false,
        message: 'সপ্তাহে অন্তত একটি কার্যদিবস (বার) থাকতে হবে।',
        days: this.getDays(),
      };
    }

    const seen = new Set<RoutineDayKey>();
    const cleaned: RoutineDayConfig[] = [];
    for (const d of days) {
      if (!VALID_DAY_KEYS.has(d.key) || seen.has(d.key)) continue;
      seen.add(d.key);
      const fallback = ALL_WEEK_DAYS.find((w) => w.key === d.key)?.labelBn || d.key;
      cleaned.push({
        key: d.key,
        labelBn: String(d.labelBn || fallback).trim() || fallback,
      });
    }

    if (cleaned.length === 0) {
      return {
        success: false,
        message: 'সঠিক কার্যদিবস নির্বাচন করুন।',
        days: this.getDays(),
      };
    }

    localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(cleaned));
    dispatchStorageSync();
    return {
      success: true,
      message: 'সাপ্তাহিক কার্যদিবস (বার) সফলভাবে সংরক্ষণ করা হয়েছে।',
      days: cleaned,
    };
  }

  addDay(
    dayKey: RoutineDayKey,
    customLabelBn?: string
  ): { success: boolean; message: string; days: RoutineDayConfig[] } {
    const current = this.getDays();
    if (!VALID_DAY_KEYS.has(dayKey)) {
      return { success: false, message: 'অবৈধ বার নির্বাচন করা হয়েছে।', days: current };
    }
    if (current.some((d) => d.key === dayKey)) {
      return { success: false, message: 'এই বারটি ইতোমধ্যে রুটিনে যুক্ত আছে।', days: current };
    }
    const meta = ALL_WEEK_DAYS.find((d) => d.key === dayKey);
    const labelBn = (customLabelBn || '').trim() || meta?.labelBn || dayKey;
    const res = this.saveDays([...current, { key: dayKey, labelBn }]);
    return {
      success: res.success,
      message: res.success ? `"${labelBn}" রুটিনে যুক্ত করা হয়েছে।` : res.message,
      days: res.days,
    };
  }

  deleteDay(dayKey: RoutineDayKey): { success: boolean; message: string; days: RoutineDayConfig[] } {
    const current = this.getDays();
    if (current.length <= 1) {
      return {
        success: false,
        message: 'সপ্তাহে অন্তত একটি বার রাখতে হবে; একমাত্র বারটি মুছে ফেলা যাবে না।',
        days: current,
      };
    }
    const target = current.find((d) => d.key === dayKey);
    if (!target) {
      return { success: false, message: 'নির্বাচিত বারটি পাওয়া যায়নি।', days: current };
    }
    const next = current.filter((d) => d.key !== dayKey);
    const res = this.saveDays(next);
    return {
      success: res.success,
      message: res.success ? `"${target.labelBn}" রুটিন থেকে সরানো হয়েছে।` : res.message,
      days: res.days,
    };
  }

  moveDay(
    dayKey: RoutineDayKey,
    direction: 'up' | 'down'
  ): { success: boolean; message: string; days: RoutineDayConfig[] } {
    const current = this.getDays();
    const idx = current.findIndex((d) => d.key === dayKey);
    if (idx === -1) return { success: false, message: 'বারটি পাওয়া যায়নি।', days: current };
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= current.length) {
      return { success: true, message: '', days: current };
    }
    const copy = [...current];
    const tmp = copy[idx];
    copy[idx] = copy[swapIdx];
    copy[swapIdx] = tmp;
    return this.saveDays(copy);
  }

  resetDefaultDays(): RoutineDayConfig[] {
    const defaults = ROUTINE_DAYS.map((d) => ({ ...d }));
    if (typeof window !== 'undefined') {
      localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(defaults));
      dispatchStorageSync();
    }
    return defaults;
  }

  // ─── ROUTINE SLOTS CRUD & CONFLICT ENGINE ─────────────────────────────────
  getRoutines(): RoutineSlot[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(ROUTINE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch {
      return [];
    }
  }

  getClassRoutine(classId: string): RoutineSlot[] {
    if (!classId) return [];
    const all = this.getRoutines();
    const clean = norm(classId);
    return all.filter(
      (r) =>
        norm(r.classId) === clean ||
        norm(r.classId).startsWith(clean) ||
        clean.startsWith(norm(r.classId))
    );
  }

  getTeacherRoutine(teacherIdentifier: string): RoutineSlot[] {
    if (!teacherIdentifier) return [];
    const all = this.getRoutines();
    const clean = norm(teacherIdentifier);
    return all.filter(
      (r) =>
        (r.teacherId && norm(r.teacherId) === clean) ||
        (r.teacherName && (norm(r.teacherName).includes(clean) || clean.includes(norm(r.teacherName))))
    );
  }

  getDayFromDate(dateIso: string): RoutineSlot['day'] | null {
    if (!dateIso) return null;
    const parts = dateIso.split('-').map(Number);
    const d =
      parts.length === 3 && parts.every((n) => Number.isFinite(n))
        ? new Date(parts[0], parts[1] - 1, parts[2])
        : new Date(dateIso);
    if (Number.isNaN(d.getTime())) return null;
    const mapped = JS_DAY_TO_ROUTINE_DAY[d.getDay()];
    if (!mapped) return null;
    const activeDays = this.getDays();
    return activeDays.some((dayCfg) => dayCfg.key === mapped) ? mapped : null;
  }

  detectAllConflicts(candidate: RoutineSlot, existingList?: RoutineSlot[]): RoutineConflict[] {
    const list = existingList || this.getRoutines();
    const candTeacherId = norm(candidate.teacherId);
    const candTeacherName = norm(candidate.teacherName);
    const candRoom = norm(candidate.roomNo);
    const periods = this.getPeriods();
    const periodLabel =
      periods.find((p) => p.periodNo === candidate.periodNo)?.periodName ||
      `পিরিয়ড ${candidate.periodNo}`;
    const dayLabel =
      candidate.dayBn ||
      this.getDays().find((d) => d.key === candidate.day)?.labelBn ||
      ALL_WEEK_DAYS.find((d) => d.key === candidate.day)?.labelBn ||
      candidate.day;

    const conflicts: RoutineConflict[] = [];

    for (const slot of list) {
      const isSameCell =
        slot.id === candidate.id ||
        (norm(slot.classId) === norm(candidate.classId) &&
          slot.day === candidate.day &&
          slot.periodNo === candidate.periodNo);
      if (isSameCell) continue;
      if (slot.day !== candidate.day || slot.periodNo !== candidate.periodNo) continue;

      const sameTeacher =
        (candTeacherId && norm(slot.teacherId) === candTeacherId) ||
        (candTeacherName && norm(slot.teacherName) === candTeacherName);

      if (sameTeacher) {
        conflicts.push({
          type: 'teacher',
          message: `শিক্ষক "${candidate.teacherName}" একই সময়ে (${dayLabel} • ${periodLabel}) ইতিমধ্যেই "${slot.classId}" (${slot.subject}) ক্লাসে নির্ধারিত আছেন।`,
          conflictingSlot: slot,
        });
      }

      if (candRoom && candRoom !== 'tbd' && candRoom !== '—' && norm(slot.roomNo) === candRoom) {
        conflicts.push({
          type: 'room',
          message: `কক্ষ নং "${candidate.roomNo}" একই সময়ে (${dayLabel} • ${periodLabel}) "${slot.classId}" (${slot.subject}) ক্লাসের জন্য বরাদ্দ রয়েছে।`,
          conflictingSlot: slot,
        });
      }
    }

    return conflicts;
  }

  detectConflict(candidate: RoutineSlot, existingList?: RoutineSlot[]): RoutineConflict | null {
    const conflicts = this.detectAllConflicts(candidate, existingList);
    return conflicts[0] || null;
  }

  /**
   * Scans the entire routine list and maps every conflicting slot ID to its conflicts.
   */
  findSlotConflictIds(routines?: RoutineSlot[]): Map<string, RoutineConflict[]> {
    const list = routines || this.getRoutines();
    const map = new Map<string, RoutineConflict[]>();
    for (const slot of list) {
      const conflicts = this.detectAllConflicts(slot, list);
      if (conflicts.length > 0) {
        map.set(slot.id, conflicts);
      }
    }
    return map;
  }

  /**
   * Computes live teacher availability, conflict slot details, RBAC subject assignments, and loads
   * for a specific (day, periodNo) cell.
   */
  getTeacherAvailabilityForSlot(
    day: RoutineDayKey,
    periodNo: number,
    options?: {
      excludeSlotId?: string;
      excludeClassId?: string;
      routines?: RoutineSlot[];
      teachers?: TeacherRecord[];
      subjectAssignments?: SubjectAssignment[];
    }
  ): TeacherSlotAvailability[] {
    const routines = options?.routines || this.getRoutines();
    const teachers =
      options?.teachers || teacherRBACService.getTeachers().filter((t) => t.status === 'active');
    const subjectAssignments =
      options?.subjectAssignments || teacherRBACService.getSubjectAssignments();

    return teachers.map((teacher) => {
      const tId = norm(teacher.id);
      const tName = norm(teacher.name);

      const matchesTeacher = (r: RoutineSlot) =>
        (r.teacherId && norm(r.teacherId) === tId) || norm(r.teacherName) === tName;

      const teacherSlots = routines.filter(matchesTeacher);
      const daySlots = teacherSlots.filter((r) => r.day === day);
      const conflictingSlot = daySlots.find((r) => {
        if (r.periodNo !== periodNo) return false;
        if (options?.excludeSlotId && r.id === options.excludeSlotId) return false;
        if (options?.excludeClassId && norm(r.classId) === norm(options.excludeClassId)) {
          return false;
        }
        return true;
      });

      const assignedSubjects = subjectAssignments.filter(
        (sa) => norm(sa.teacherId) === tId
      );

      return {
        teacher,
        isFree: !conflictingSlot,
        conflictingSlot,
        assignedSubjects,
        dayLoad: daySlots.length,
        weeklyLoad: teacherSlots.length,
      };
    });
  }

  saveRoutine(
    slot: RoutineSlot,
    options?: { skipConflictCheck?: boolean }
  ): { success: boolean; message: string; conflict?: RoutineConflict } {
    if (typeof window === 'undefined') return { success: false, message: 'ব্রাউজার অনুপস্থিত' };

    const periodMeta = this.getPeriods().find((p) => p.periodNo === slot.periodNo);
    if (periodMeta?.isBreak) {
      return { success: false, message: 'টিফিন বিরতি পিরিয়ডে ক্লাস নির্ধারণ করা যাবে না।' };
    }

    const dayMeta =
      this.getDays().find((d) => d.key === slot.day) ||
      ALL_WEEK_DAYS.find((d) => d.key === slot.day);
    const normalizedSlot: RoutineSlot = {
      ...slot,
      id: slot.id || `ROT-${slot.classId}-${slot.day}-P${slot.periodNo}`,
      dayBn: slot.dayBn || dayMeta?.labelBn || slot.day,
    };

    const all = this.getRoutines();
    if (!options?.skipConflictCheck) {
      const conflict = this.detectConflict(normalizedSlot, all);
      if (conflict) {
        return { success: false, message: conflict.message, conflict };
      }
    }

    const idx = all.findIndex(
      (r) =>
        r.id === normalizedSlot.id ||
        (r.classId === normalizedSlot.classId &&
          r.day === normalizedSlot.day &&
          r.periodNo === normalizedSlot.periodNo)
    );

    if (idx !== -1) {
      all[idx] = normalizedSlot;
    } else {
      all.push(normalizedSlot);
    }

    localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(all));
    dispatchStorageSync();
    return { success: true, message: 'ক্লাস রুটিন সফলভাবে আপডেট করা হয়েছে!' };
  }

  deleteRoutineSlot(slotId: string): { success: boolean; message: string } {
    if (typeof window === 'undefined') return { success: false, message: 'ব্রাউজার অনুপস্থিত' };
    const all = this.getRoutines();
    const next = all.filter((r) => r.id !== slotId);
    if (next.length === all.length) {
      return { success: false, message: 'স্লটটি পাওয়া যায়নি।' };
    }
    localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(next));
    dispatchStorageSync();
    return { success: true, message: 'রুটিন স্লট মুছে ফেলা হয়েছে।' };
  }

  swapRoutineSlots(slotAId: string, slotBId: string): { success: boolean; message: string } {
    if (typeof window === 'undefined') return { success: false, message: 'ব্রাউজার অনুপস্থিত' };
    if (slotAId === slotBId) return { success: false, message: 'একই স্লট সোয়াপ করা যায় না।' };

    const all = this.getRoutines();
    const idxA = all.findIndex((s) => s.id === slotAId);
    const idxB = all.findIndex((s) => s.id === slotBId);
    if (idxA === -1 || idxB === -1) {
      return { success: false, message: 'সোয়াপ করার জন্য দুটি স্লটই থাকতে হবে।' };
    }

    const a = all[idxA];
    const b = all[idxB];
    const nextA: RoutineSlot = {
      ...a,
      subject: b.subject,
      teacherId: b.teacherId,
      teacherName: b.teacherName,
      roomNo: b.roomNo,
    };
    const nextB: RoutineSlot = {
      ...b,
      subject: a.subject,
      teacherId: a.teacherId,
      teacherName: a.teacherName,
      roomNo: a.roomNo,
    };

    const remaining = all.filter((s) => s.id !== slotAId && s.id !== slotBId);
    const conflictA = this.detectConflict(nextA, [...remaining, nextB]);
    if (conflictA) return { success: false, message: conflictA.message };
    const conflictB = this.detectConflict(nextB, [...remaining, nextA]);
    if (conflictB) return { success: false, message: conflictB.message };

    all[idxA] = nextA;
    all[idxB] = nextB;
    localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(all));
    dispatchStorageSync();
    return { success: true, message: 'দুটি পিরিয়ড সফলভাবে অদলবদল করা হয়েছে!' };
  }

  // ─── SUBSTITUTION / PROXY ENGINE (100% PRESERVED) ─────────────────────────
  getSubstitutions(date?: string): SubstitutionRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(SUBSTITUTION_STORAGE_KEY);
      const parsed: SubstitutionRecord[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return date ? parsed.filter((s) => s.date === date) : parsed;
    } catch {
      return [];
    }
  }

  getTeachersOnLeaveForDate(dateIso: string) {
    if (!dateIso) return [];
    return leaveService
      .getLeaves()
      .filter((l) => l.status === 'approved' && l.startDate <= dateIso && l.endDate >= dateIso);
  }

  suggestSubstituteTeachers(
    dateIso: string,
    periodNo: number,
    absentTeacherIdentifier?: string
  ): SubstituteCandidate[] {
    const day = this.getDayFromDate(dateIso);
    const allTeachers = teacherRBACService.getTeachers().filter((t) => t.status === 'active');
    const routines = this.getRoutines();
    const activeSubs = this.getSubstitutions(dateIso);
    const leaveTeachers = this.getTeachersOnLeaveForDate(dateIso);
    const absentNorm = norm(absentTeacherIdentifier);

    return allTeachers
      .filter((t) => norm(t.id) !== absentNorm && norm(t.name) !== absentNorm)
      .map((t) => {
        const isOnLeave = leaveTeachers.some(
          (l) => norm(l.teacherId) === norm(t.id) || norm(l.teacherName) === norm(t.name)
        );
        const daySlots = day
          ? routines.filter(
              (r) =>
                r.day === day &&
                ((r.teacherId && norm(r.teacherId) === norm(t.id)) || norm(r.teacherName) === norm(t.name))
            )
          : [];
        const busyInRoutine = daySlots.some((s) => s.periodNo === periodNo);
        const busyInSub = activeSubs.some(
          (s) =>
            s.periodNo === periodNo &&
            ((s.substituteTeacherId && norm(s.substituteTeacherId) === norm(t.id)) ||
              norm(s.substituteTeacherName) === norm(t.name))
        );
        const extraSubsCount = activeSubs.filter(
          (s) =>
            (s.substituteTeacherId && norm(s.substituteTeacherId) === norm(t.id)) ||
            norm(s.substituteTeacherName) === norm(t.name)
        ).length;

        return {
          teacherId: t.id,
          teacherName: t.name,
          designation: t.designation || 'সহকারী শিক্ষক',
          isFreeAtPeriod: !busyInRoutine && !busyInSub && !isOnLeave,
          periodsAssignedOnDay: daySlots.length + extraSubsCount,
          isOnLeave,
        };
      })
      .sort((a, b) => {
        if (a.isFreeAtPeriod !== b.isFreeAtPeriod) return a.isFreeAtPeriod ? -1 : 1;
        if (a.isOnLeave !== b.isOnLeave) return a.isOnLeave ? 1 : -1;
        return a.periodsAssignedOnDay - b.periodsAssignedOnDay;
      });
  }

  assignSubstitute(payload: Omit<SubstitutionRecord, 'id' | 'createdAt' | 'status'>): {
    success: boolean;
    message: string;
    record?: SubstitutionRecord;
  } {
    if (typeof window === 'undefined') return { success: false, message: 'ব্রাউজার অনুপস্থিত' };
    if (!payload.substituteTeacherName.trim()) {
      return { success: false, message: 'বিকল্প শিক্ষক নির্বাচন করুন।' };
    }
    const existing = this.getSubstitutions().filter(
      (s) => !(s.date === payload.date && s.classId === payload.classId && s.periodNo === payload.periodNo)
    );
    const newRec: SubstitutionRecord = {
      ...payload,
      id: `SUB-${payload.date}-${payload.classId}-P${payload.periodNo}`,
      status: 'assigned',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(SUBSTITUTION_STORAGE_KEY, JSON.stringify([newRec, ...existing]));
    auditTrailService.addLog({
      action: 'ROUTINE_SUBSTITUTION_ASSIGNED',
      category: 'Academic',
      details: `${payload.date} (${payload.classId}, পিরিয়ড ${payload.periodNo}): ${payload.absentTeacherName}-এর পরিবর্তে ${payload.substituteTeacherName}-কে প্রক্সি দায়িত্ব দেওয়া হয়েছে।`,
      performedBy: 'অ্যাডমিন',
      status: 'Success',
    });
    dispatchStorageSync();
    return { success: true, message: 'বিকল্প (প্রক্সি) শিক্ষক সফলভাবে নির্ধারিত হয়েছে!', record: newRec };
  }

  removeSubstitute(subId: string): void {
    if (typeof window === 'undefined') return;
    const next = this.getSubstitutions().filter((s) => s.id !== subId);
    localStorage.setItem(SUBSTITUTION_STORAGE_KEY, JSON.stringify(next));
    dispatchStorageSync();
  }

  autoAssignSubstitutesForDate(dateIso: string): { assignedCount: number; message: string } {
    const day = this.getDayFromDate(dateIso);
    if (!day) {
      return { assignedCount: 0, message: 'নির্বাচিত তারিখটি সাপ্তাহিক ছুটির দিন।' };
    }
    const onLeave = this.getTeachersOnLeaveForDate(dateIso);
    if (onLeave.length === 0) {
      return { assignedCount: 0, message: 'এই তারিখে কোনো অনুমোদিত ছুটির শিক্ষক নেই।' };
    }
    const routines = this.getRoutines().filter((r) => r.day === day);
    const existingSubs = this.getSubstitutions(dateIso);
    let assignedCount = 0;

    for (const leave of onLeave) {
      const affectedSlots = routines.filter(
        (r) =>
          (r.teacherId && norm(r.teacherId) === norm(leave.teacherId)) ||
          norm(r.teacherName) === norm(leave.teacherName)
      );
      for (const slot of affectedSlots) {
        const alreadyCovered = existingSubs.some(
          (s) => s.classId === slot.classId && s.periodNo === slot.periodNo
        );
        if (alreadyCovered) continue;

        const candidates = this.suggestSubstituteTeachers(
          dateIso,
          slot.periodNo,
          slot.teacherId || slot.teacherName
        );
        const best = candidates.find((c) => c.isFreeAtPeriod);
        if (best) {
          const res = this.assignSubstitute({
            date: dateIso,
            day,
            periodNo: slot.periodNo,
            classId: slot.classId,
            subject: slot.subject,
            absentTeacherId: slot.teacherId,
            absentTeacherName: slot.teacherName,
            substituteTeacherId: best.teacherId,
            substituteTeacherName: best.teacherName,
            roomNo: slot.roomNo,
            reason: leave.leaveType,
          });
          if (res.success && res.record) {
            existingSubs.push(res.record);
            assignedCount++;
          }
        }
      }
    }

    return {
      assignedCount,
      message:
        assignedCount > 0
          ? `মোট ${assignedCount}টি ক্লাসে স্বয়ংক্রিয়ভাবে বিকল্প শিক্ষক নির্ধারিত হয়েছে!`
          : 'নতুন কোনো প্রক্সি স্লট ফাঁকা বা প্রযোজ্য পাওয়া যায়নি।',
    };
  }
}

export const routineService = new RoutineService();
