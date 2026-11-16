'use client';

import { leaveService } from './leaveService';
import { teacherRBACService } from './teacherRBACService';
import { auditTrailService } from './auditTrailService';

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

export interface RoutineConflict {
  type: 'teacher' | 'room';
  message: string;
  conflictingSlot: RoutineSlot;
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

export const ROUTINE_DAYS: { key: RoutineSlot['day']; labelBn: string }[] = [
  { key: 'Saturday', labelBn: 'শনিবার' },
  { key: 'Sunday', labelBn: 'রবিবার' },
  { key: 'Monday', labelBn: 'সোমবার' },
  { key: 'Tuesday', labelBn: 'মঙ্গলবার' },
  { key: 'Wednesday', labelBn: 'বুধবার' },
  { key: 'Thursday', labelBn: 'বৃহস্পতিবার' },
];

const STORAGE_KEY = 'sms_master_class_routine';
const SUBSTITUTION_STORAGE_KEY = 'sms_routine_substitutions';

const JS_DAY_TO_ROUTINE_DAY: Record<number, RoutineSlot['day'] | null> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: null, // Friday holiday
  6: 'Saturday',
};

const norm = (v?: string) => (v || '').trim().toLowerCase();

class RoutineService {
  getRoutines(): RoutineSlot[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
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
    return JS_DAY_TO_ROUTINE_DAY[d.getDay()] ?? null;
  }

  detectConflict(candidate: RoutineSlot, existingList?: RoutineSlot[]): RoutineConflict | null {
    const list = existingList || this.getRoutines();
    const candTeacherId = norm(candidate.teacherId);
    const candTeacherName = norm(candidate.teacherName);
    const candRoom = norm(candidate.roomNo);

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
        return {
          type: 'teacher',
          message: `শিক্ষক "${candidate.teacherName}" একই সময়ে (${candidate.dayBn} • পিরিয়ড ${candidate.periodNo}) ইতিমধ্যেই "${slot.classId}" শ্রেণিতে নির্ধারিত আছেন।`,
          conflictingSlot: slot,
        };
      }

      if (candRoom && candRoom !== 'tbd' && norm(slot.roomNo) === candRoom) {
        return {
          type: 'room',
          message: `কক্ষ নং "${candidate.roomNo}" একই সময়ে "${slot.classId}" শ্রেণির জন্য বরাদ্দ রয়েছে।`,
          conflictingSlot: slot,
        };
      }
    }
    return null;
  }

  saveRoutine(
    slot: RoutineSlot,
    options?: { skipConflictCheck?: boolean }
  ): { success: boolean; message: string; conflict?: RoutineConflict } {
    if (typeof window === 'undefined') return { success: false, message: 'ব্রাউজার অনুপস্থিত' };

    const periodMeta = ROUTINE_PERIODS.find((p) => p.periodNo === slot.periodNo);
    if (periodMeta?.isBreak) {
      return { success: false, message: 'টিফিন বিরতি পিরিয়ডে ক্লাস নির্ধারণ করা যাবে না।' };
    }

    const dayMeta = ROUTINE_DAYS.find((d) => d.key === slot.day);
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

    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event('storage'));
    return { success: true, message: 'ক্লাস রুটিন সফলভাবে আপডেট করা হয়েছে!' };
  }

  deleteRoutineSlot(slotId: string): { success: boolean; message: string } {
    if (typeof window === 'undefined') return { success: false, message: 'ব্রাউজার অনুপস্থিত' };
    const all = this.getRoutines();
    const next = all.filter((r) => r.id !== slotId);
    if (next.length === all.length) {
      return { success: false, message: 'স্লটটি পাওয়া যায়নি।' };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('storage'));
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event('storage'));
    return { success: true, message: 'দুটি পিরিয়ড সফলভাবে অদলবদল করা হয়েছে!' };
  }

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
    window.dispatchEvent(new Event('storage'));
    return { success: true, message: 'বিকল্প (প্রক্সি) শিক্ষক সফলভাবে নির্ধারিত হয়েছে!', record: newRec };
  }

  removeSubstitute(subId: string): void {
    if (typeof window === 'undefined') return;
    const next = this.getSubstitutions().filter((s) => s.id !== subId);
    localStorage.setItem(SUBSTITUTION_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('storage'));
  }

  autoAssignSubstitutesForDate(dateIso: string): { assignedCount: number; message: string } {
    const day = this.getDayFromDate(dateIso);
    if (!day) {
      return { assignedCount: 0, message: 'নির্বাচিত তারিখটি সাপ্তাহিক ছুটির দিন (শুক্রবার)।' };
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

        const candidates = this.suggestSubstituteTeachers(dateIso, slot.periodNo, slot.teacherId || slot.teacherName);
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
