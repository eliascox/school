import type { Student } from '@/services/studentService';
import type {
  ClassTeacherAssignment,
  SubjectAssignment,
} from '@/services/teacherRBACService';
import {
  ROUTINE_DAYS,
  ROUTINE_PERIODS,
  routineService,
  type RoutineSlot,
  type SubstitutionRecord,
} from '@/services/routineService';
import { localDateKey } from '@/lib/dateUtils';

export type TeacherPortalTab =
  | 'home'
  | 'routine'
  | 'attendance'
  | 'marks'
  | 'students'
  | 'homework'
  | 'leaves'
  | 'notices'
  | 'profile';

export const VALID_PORTAL_TABS: readonly TeacherPortalTab[] = [
  'home',
  'routine',
  'attendance',
  'marks',
  'students',
  'homework',
  'leaves',
  'notices',
  'profile',
] as const;

export interface TodayAttendanceSummary {
  hasRollCall: boolean;
  boys: number;
  girls: number;
  total: number;
  totalEnrolled: number;
  absent: number;
  rate: number;
}

export interface TeacherAuditLog {
  action: string;
  category: string;
  details: string;
  performedBy: string;
  timestamp: string | number;
  status?: string;
}

export interface StudentBasicEditForm {
  name: string;
  guardian: string;
  fatherName: string;
  motherName: string;
  mobile: string;
  dob: string;
  gender: string;
  religion: string;
  bloodGroup: string;
  currentAddress: string;
  permanentAddress: string;
  photo: string;
  remarks: string;
}

const GRADE_LABEL_MAP: Record<string, string> = {
  '6th': '৬ষ্ঠ শ্রেণি',
  '7th': '৭ম শ্রেণি',
  '8th': '৮ম শ্রেণি',
  '9th': '৯ম শ্রেণি',
  '10th': '১০ম শ্রেণি',
};

const BRANCH_LABEL_MAP: Record<string, string> = {
  A: 'ক শাখা',
  B: 'খ শাখা',
  C: 'গ শাখা',
  Science: 'বিজ্ঞান',
  Humanities: 'মানবিক',
  Commerce: 'ব্যবসায় শিক্ষা',
};

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function isValidPortalTab(
  tab: string | null | undefined
): tab is TeacherPortalTab {
  if (!tab) return false;
  return (VALID_PORTAL_TABS as readonly string[]).includes(tab);
}

export function gradeLabel(g: string): string {
  const key = String(g ?? '').trim();
  if (!key) return '';
  const base = key.split('-')[0];
  return GRADE_LABEL_MAP[key] || GRADE_LABEL_MAP[base] || key;
}

export function branchLabel(b: string): string {
  const key = String(b ?? '').trim();
  return BRANCH_LABEL_MAP[key] || key;
}

export function formatClassIdBn(classId: string): string {
  const raw = String(classId ?? '').trim();
  if (!raw) return '';
  const parts = raw.split('-').map((p) => p.trim()).filter(Boolean);
  const g = gradeLabel(parts[0] || raw);
  const b = parts[1] ? branchLabel(parts[1]) : '';
  return b ? `${g} — ${b}` : g;
}

export function toBnDigit(num: number | string): string {
  return String(num ?? '').replace(/[0-9]/g, (d) => BN_DIGITS[parseInt(d, 10)] ?? d);
}

export function toAsciiDigit(value: string): string {
  return String(value ?? '').replace(/[০-৯]/g, (d) =>
    String('০১২৩৪৫৬৭৮৯'.indexOf(d))
  );
}

export function getTodayRoutineDay(): RoutineSlot['day'] {
  const todayDay = routineService.getDayFromDate(localDateKey());
  return todayDay || 'Saturday';
}

export function getRoutineDayLabelBn(day: RoutineSlot['day']): string {
  return ROUTINE_DAYS.find((d) => d.key === day)?.labelBn || day;
}

export function getPeriodTimeRange(periodNo: number): string {
  const found = ROUTINE_PERIODS.find((p) => p.periodNo === periodNo);
  if (!found) return '';
  return `${found.startTime} – ${found.endTime}`;
}

export function isTeacherRoutineSlot(
  slot: RoutineSlot,
  teacherId: string,
  teacherNames: string[]
): boolean {
  const cleanId = teacherId.trim().toLowerCase();
  const cleanNames = teacherNames
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean);

  if (cleanId && slot.teacherId && slot.teacherId.trim().toLowerCase() === cleanId) {
    return true;
  }
  if (
    slot.teacherName &&
    cleanNames.includes(slot.teacherName.trim().toLowerCase())
  ) {
    return true;
  }
  return false;
}

export function isTeacherSubstitution(
  sub: SubstitutionRecord,
  teacherId: string,
  teacherNames: string[]
): boolean {
  const cleanId = teacherId.trim().toLowerCase();
  const cleanNames = teacherNames
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean);

  if (
    cleanId &&
    sub.substituteTeacherId &&
    sub.substituteTeacherId.trim().toLowerCase() === cleanId
  ) {
    return true;
  }
  if (
    sub.substituteTeacherName &&
    cleanNames.includes(sub.substituteTeacherName.trim().toLowerCase())
  ) {
    return true;
  }
  return false;
}

export function sortGradeKeys(keys: string[]): string[] {
  const gradeOrder = ['6th', '7th', '8th', '9th', '10th'];
  return [...keys].sort((a, b) => {
    const idxA = gradeOrder.indexOf(a);
    const idxB = gradeOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
}

export function resolveClassTeacherStudents(
  classTeachers: ClassTeacherAssignment[],
  allStudents: Student[]
): Student[] {
  if (classTeachers.length === 0) return [];
  return allStudents.filter((st) =>
    classTeachers.some((ct) => {
      const parts = ct.classId.split('-');
      const ctGrade = (parts[0] || '').toLowerCase();
      const ctBranch = (parts[1] || '').toLowerCase();
      const stGrade = (st.grade || '').toLowerCase();
      const stSection = (st.section || st.branch || '').toLowerCase();
      const stGroup = (st.group || '').toLowerCase();

      const gradeMatch =
        stGrade.includes(ctGrade) || ctGrade.includes(stGrade);
      const branchMatch =
        !ctBranch ||
        stSection.includes(ctBranch) ||
        stGroup.includes(ctBranch);
      return gradeMatch && branchMatch;
    })
  );
}

interface StoredAttendanceRecord {
  id?: string;
  roll?: string;
  grade?: string;
  gender?: string;
  status?: string;
}

function readAttendanceArray(storageKey: string): StoredAttendanceRecord[] | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(storageKey);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as StoredAttendanceRecord[];
    }
  } catch {
    // Ignore malformed JSON
  }
  return null;
}

export function computeTodayAttendanceSummary(
  myCT: ClassTeacherAssignment[],
  myAssignments: SubjectAssignment[],
  resolvedClassStudents: Student[],
  allStudents: Student[]
): TodayAttendanceSummary | null {
  if (typeof window === 'undefined') return null;

  try {
    const localToday = localDateKey();
    const utcToday = new Date().toISOString().split('T')[0];
    const dateCandidates =
      localToday === utcToday ? [localToday] : [localToday, utcToday];

    let foundRecords: StoredAttendanceRecord[] | null = null;

    // 1. First priority: Check assigned class teacher class(es)
    if (myCT.length > 0) {
      outerCt: for (const dateKey of dateCandidates) {
        for (const ct of myCT) {
          const parsed = readAttendanceArray(`sms_attendance_${dateKey}_${ct.classId}`);
          if (parsed) {
            foundRecords = parsed;
            break outerCt;
          }
        }
      }
    }

    // 2. Second priority: Check assigned subject classes
    if (!foundRecords && myAssignments.length > 0) {
      outerSub: for (const dateKey of dateCandidates) {
        for (const a of myAssignments) {
          const prefix = `sms_attendance_${dateKey}_${a.classId}`;
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(prefix)) {
              const parsed = readAttendanceArray(k);
              if (parsed) {
                foundRecords = parsed;
                break outerSub;
              }
            }
          }
        }
      }
    }

    // 3. Fallback: check any class attendance taken today in school
    if (!foundRecords) {
      outerAny: for (const dateKey of dateCandidates) {
        const prefix = `sms_attendance_${dateKey}_`;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) {
            const parsed = readAttendanceArray(k);
            if (parsed) {
              foundRecords = parsed;
              break outerAny;
            }
          }
        }
      }
    }

    if (foundRecords && foundRecords.length > 0) {
      let boys = 0;
      let girls = 0;
      let present = 0;
      let absent = 0;

      foundRecords.forEach((rec) => {
        if (rec.status === 'Present') {
          present++;
          const matched = allStudents.find(
            (s) =>
              s.id === rec.id ||
              (s.roll === rec.roll && (s.grade === rec.grade || !s.grade))
          );
          const g = (matched?.gender || rec.gender || '').toLowerCase();
          const isGirl =
            g.includes('নারী') ||
            g.includes('মহিলা') ||
            g.includes('মেয়ে') ||
            g.includes('মেয়ে') ||
            g.includes('ছাত্রী') ||
            g === 'female' ||
            g === 'girl';

          if (isGirl) {
            girls++;
          } else {
            boys++;
          }
        } else if (rec.status === 'Absent' || rec.status === 'Leave') {
          absent++;
        }
      });

      const totalEnrolled = Math.max(
        foundRecords.length,
        resolvedClassStudents.length > 0
          ? resolvedClassStudents.length
          : foundRecords.length
      );
      const effectiveAbsent =
        absent > 0 ? absent : Math.max(0, totalEnrolled - present);
      const rate =
        totalEnrolled > 0 ? Math.round((present / totalEnrolled) * 100) : 0;

      return {
        hasRollCall: true,
        boys,
        girls,
        total: present,
        totalEnrolled,
        absent: effectiveAbsent,
        rate,
      };
    }

    // No roll call yet today — calculate enrolled count cleanly
    const assignedGradeKeys = Array.from(
      new Set(myAssignments.map((a) => a.classId))
    );
    const assignedStudents = allStudents.filter((st) => {
      const stGrade = (st.grade || '').toLowerCase();
      return assignedGradeKeys.some((cid) => {
        const g = cid.split('-')[0].toLowerCase();
        return stGrade.includes(g) || g.includes(stGrade);
      });
    });
    const totalEnrolled =
      resolvedClassStudents.length > 0
        ? resolvedClassStudents.length
        : assignedStudents.length > 0
        ? assignedStudents.length
        : allStudents.length;

    return {
      hasRollCall: false,
      boys: 0,
      girls: 0,
      total: 0,
      totalEnrolled,
      absent: 0,
      rate: 0,
    };
  } catch (err) {
    console.error('Attendance calculation error:', err);
    return null;
  }
}
