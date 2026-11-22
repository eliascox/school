import type { ClassItem } from '@/services/classSectionService';
import type { RoutineSlot, TeacherSlotAvailability } from '@/services/routineService';

export type RoutineTabId =
  | 'class_grid'
  | 'master_grid'
  | 'teacher_view'
  | 'substitution'
  | 'setup';

export type RoutinePrintMode =
  | 'current_class'
  | 'all_classes'
  | 'current_teacher'
  | 'all_teachers'
  | 'master_day'
  | 'master_week'
  | 'substitution';

export interface ClassOption {
  classId: string;
  grade: string;
  gradeNumber: number;
  branch: string;
  label: string;
  shortLabel: string;
  defaultRoom: string;
}

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export const GRADE_NUM_MAP: Record<number, string> = {
  6: '6th',
  7: '7th',
  8: '8th',
  9: '9th',
  10: '10th',
};

const GRADE_LABEL_BN: Record<string, string> = {
  '6th': '৬ষ্ঠ শ্রেণি',
  '7th': '৭ম শ্রেণি',
  '8th': '৮ম শ্রেণি',
  '9th': '৯ম শ্রেণি',
  '10th': '১০ম শ্রেণি',
};

const GRADE_SHORT_BN: Record<string, string> = {
  '6th': '৬ষ্ঠ',
  '7th': '৭ম',
  '8th': '৮ম',
  '9th': '৯ম',
  '10th': '১০ম',
};

const BRANCH_LABEL_BN: Record<string, string> = {
  A: 'ক শাখা',
  B: 'খ শাখা',
  C: 'গ শাখা',
  Science: 'বিজ্ঞান',
  Humanities: 'মানবিক',
  Commerce: 'ব্যবসায় শিক্ষা',
};

export function toBanglaDigits(value: string | number | null | undefined): string {
  return String(value ?? '').replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

export function toAsciiDigits(value: string | number | null | undefined): string {
  return String(value ?? '').replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
}

export function normalizeBranch(secName: string): string {
  const s = String(secName || '').trim();
  if (/section\s*a|ক\s*শাখা/i.test(s) || s === 'A') return 'A';
  if (/section\s*b|খ\s*শাখা/i.test(s) || s === 'B') return 'B';
  if (/section\s*c|গ\s*শাখা/i.test(s) || s === 'C') return 'C';
  if (/science|বিজ্ঞান/i.test(s)) return 'Science';
  if (/humanities|মানবিক/i.test(s)) return 'Humanities';
  if (/commerce|ব্যবসায়|ব্যবসায়/i.test(s)) return 'Commerce';
  return s || 'A';
}

export function branchToGroup(branch: string): string {
  if (/science|বিজ্ঞান/i.test(branch)) return 'বিজ্ঞান';
  if (/commerce|ব্যবসায়|ব্যবসায়/i.test(branch)) return 'ব্যবসায় শিক্ষা';
  if (/humanities|মানবিক/i.test(branch)) return 'মানবিক';
  return 'সাধারণ';
}

export function formatBranchLabelBn(branch: string): string {
  const clean = normalizeBranch(branch);
  return BRANCH_LABEL_BN[clean] || branch || 'ক শাখা';
}

export function formatClassIdBn(classId: string, classOptions?: ClassOption[]): string {
  if (classOptions) {
    const found = classOptions.find((o) => o.classId === classId);
    if (found) return found.label;
  }
  const parts = String(classId || '').split('-');
  const grade = parts[0] || classId;
  const branch = parts.slice(1).join('-');
  const gBn = GRADE_LABEL_BN[grade] || grade;
  if (!branch) return gBn;
  return `${gBn} — ${formatBranchLabelBn(branch)}`;
}

/**
 * Builds an ordered list of all Class + Section options across Grades 6–10
 * from `classSectionService` merged with any existing routine slots.
 */
export function buildClassOptions(classes: ClassItem[], routines: RoutineSlot[]): ClassOption[] {
  const map = new Map<string, ClassOption>();

  for (const c of classes) {
    const gradeNum = Number(c.gradeNumber) || parseInt(String(c.id).replace(/\D/g, ''), 10) || 6;
    const grade = GRADE_NUM_MAP[gradeNum] || `${gradeNum}th`;
    const gradeBn = c.nameBn || GRADE_LABEL_BN[grade] || c.name;
    const shortGrade = GRADE_SHORT_BN[grade] || gradeBn;

    if (c.sections && c.sections.length > 0) {
      for (const sec of c.sections) {
        const branch = normalizeBranch(sec.name);
        const classId = `${grade}-${branch}`;
        const branchBn = formatBranchLabelBn(branch);
        if (!map.has(classId)) {
          map.set(classId, {
            classId,
            grade,
            gradeNumber: gradeNum,
            branch,
            label: `${gradeBn} — ${branchBn}`,
            shortLabel: `${shortGrade} (${branchBn})`,
            defaultRoom: (sec.room || '').replace(/^রুম\s*/i, '').trim() || '১০১',
          });
        }
      }
    } else {
      const classId = `${grade}-A`;
      if (!map.has(classId)) {
        map.set(classId, {
          classId,
          grade,
          gradeNumber: gradeNum,
          branch: 'A',
          label: `${gradeBn} — ক শাখা`,
          shortLabel: `${shortGrade} (ক শাখা)`,
          defaultRoom: '১০১',
        });
      }
    }
  }

  for (const slot of routines) {
    if (!map.has(slot.classId)) {
      const gradeNum = parseInt(String(slot.grade || slot.classId).replace(/\D/g, ''), 10) || 6;
      const grade = slot.grade || GRADE_NUM_MAP[gradeNum] || `${gradeNum}th`;
      const branch = slot.branch || normalizeBranch(slot.classId.split('-')[1] || 'A');
      const gradeBn = GRADE_LABEL_BN[grade] || grade;
      const shortGrade = GRADE_SHORT_BN[grade] || grade;
      const branchBn = formatBranchLabelBn(branch);
      map.set(slot.classId, {
        classId: slot.classId,
        grade,
        gradeNumber: gradeNum,
        branch,
        label: `${gradeBn} — ${branchBn}`,
        shortLabel: `${shortGrade} (${branchBn})`,
        defaultRoom: slot.roomNo || '১০১',
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.gradeNumber !== b.gradeNumber) return a.gradeNumber - b.gradeNumber;
    return a.classId.localeCompare(b.classId);
  });
}

export interface TeacherCandidateFilterOptions {
  query?: string;
  freeOnly?: boolean;
  assignedOnly?: boolean;
  targetGrade?: string;
  targetSubject?: string;
}

/**
 * Checks whether a teacher has an RBAC subject assignment matching the target grade/subject.
 */
export function isTeacherAssignedForContext(
  candidate: TeacherSlotAvailability,
  targetGrade?: string,
  targetSubject?: string
): boolean {
  const gNorm = (targetGrade || '').trim().toLowerCase();
  const sNorm = (targetSubject || '').trim().toLowerCase();
  if (candidate.assignedSubjects.length === 0) return false;

  return candidate.assignedSubjects.some((sa) => {
    const saGrade = (sa.classId || '').trim().toLowerCase();
    const saSub = (sa.subjectId || '').trim().toLowerCase();
    const gradeMatch = !gNorm || saGrade === gNorm || saGrade.startsWith(gNorm);
    const subjectMatch =
      !sNorm || saSub === sNorm || saSub.includes(sNorm) || sNorm.includes(saSub);
    return gradeMatch && subjectMatch;
  });
}

/**
 * Filters and ranks teacher candidates inside the Routine Slot Editor:
 * - Free-only toggle ("শুধু এই পিরিয়ডে ফ্রি")
 * - Assigned-only toggle ("বিষয়ভিত্তিক নির্ধারিত শিক্ষক")
 * - Bilingual search across name, designation, phone, and assigned subjects
 * - Ranks assigned + free teachers first, followed by other free teachers, then busy teachers.
 */
export function filterTeacherCandidates(
  candidates: TeacherSlotAvailability[],
  options: TeacherCandidateFilterOptions = {}
): TeacherSlotAvailability[] {
  const rawQ = (options.query || '').trim();
  const qLower = rawQ.toLowerCase();
  const qAscii = toAsciiDigits(rawQ).toLowerCase();

  const filtered = candidates.filter((c) => {
    if (options.freeOnly && !c.isFree) return false;

    if (options.assignedOnly) {
      const assignedMatch = isTeacherAssignedForContext(
        c,
        options.targetGrade,
        options.targetSubject
      );
      if (!assignedMatch) return false;
    }

    if (!rawQ) return true;

    const haystack = [
      c.teacher.name,
      c.teacher.id,
      c.teacher.designation,
      c.teacher.phone,
      toAsciiDigits(c.teacher.phone),
      ...c.assignedSubjects.map((sa) => `${sa.classId} ${sa.subjectId}`),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(qLower) || toAsciiDigits(haystack).includes(qAscii);
  });

  return [...filtered].sort((a, b) => {
    const aAssigned = isTeacherAssignedForContext(a, options.targetGrade, options.targetSubject) ? 1 : 0;
    const bAssigned = isTeacherAssignedForContext(b, options.targetGrade, options.targetSubject) ? 1 : 0;
    if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
    if (aAssigned !== bAssigned) return bAssigned - aAssigned;
    return a.dayLoad - b.dayLoad;
  });
}
