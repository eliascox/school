import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import { isReligionSubject } from '@/lib/religionUtils';
import type {
  ClassTeacherAssignment,
  SubjectAssignment,
  TeacherRecord,
} from '@/services/teacherRBACService';

export type TeacherTab =
  | 'teachers'
  | 'assignments'
  | 'class_teachers'
  | 'permission_test'
  | 'leave_applications'
  | 'audit_trail';

export type TeacherDirectoryFilter =
  | 'all'
  | 'active'
  | 'inactive'
  | 'class_teacher'
  | 'must_change_password';

export interface DynamicConfiguredSubject {
  code: string;
  name: string;
  category: string;
}

export interface TeacherDirectoryCounts {
  all: number;
  active: number;
  inactive: number;
  classTeacher: number;
  mustChangePassword: number;
}

export const TEACHER_DESIGNATION_PRESETS: string[] = [
  'প্রধান শিক্ষক',
  'সহকারী প্রধান শিক্ষক',
  'সিনিয়র শিক্ষক',
  'সহকারী শিক্ষক',
  'সহকারী শিক্ষক (বাংলা)',
  'সহকারী শিক্ষক (ইংরেজি)',
  'সহকারী শিক্ষক (গণিত)',
  'সহকারী শিক্ষক (বিজ্ঞান)',
  'সহকারী শিক্ষক (সমাজবিজ্ঞান)',
  'সহকারী শিক্ষক (ব্যবসায় শিক্ষা)',
  'সহকারী শিক্ষক (ধর্ম)',
  'সহকারী শিক্ষক (আইসিটি)',
  'সহকারী শিক্ষক (শারীরিক শিক্ষা)',
  'সহকারী শিক্ষক (কৃষি শিক্ষা)',
  'সহকারী গ্রন্থাগারিক',
  'অফিস সহকারী কাম কম্পিউটার অপারেটর',
];

export const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const CLASS_LABEL_MAP_BN: Record<string, string> = {
  '6th': '৬ষ্ঠ শ্রেণি',
  '7th': '৭ম শ্রেণি',
  '8th': '৮ম শ্রেণি',
  '9th': '৯ম শ্রেণি',
  '10th': '১০ম শ্রেণি',
};

const CLASS_SHORT_MAP_BN: Record<string, string> = {
  '6th': '৬ষ্ঠ',
  '7th': '৭ম',
  '8th': '৮ম',
  '9th': '৯ম',
  '10th': '১০ম',
};

/**
 * Converts Bengali digits (০-৯) into ASCII digits (0-9) for reliable search & parsing.
 */
export function toAsciiDigits(value: string): string {
  return String(value ?? '').replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
}

/**
 * Converts ASCII digits (0-9) into Bengali digits (০-৯) for executive display.
 */
export function toBanglaDigits(value: string | number): string {
  return String(value ?? '').replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

/**
 * Generates an easy-to-communicate 8-character temporary teacher password
 * avoiding ambiguous characters (0/O, 1/l/I).
 */
export function generateSecureTeacherPassword(length = 8): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const all = letters + digits;
  const targetLen = Math.max(6, length);
  let out = 'T';
  for (let i = 1; i < targetLen - 2; i++) {
    out += all.charAt(Math.floor(Math.random() * all.length));
  }
  out += digits.charAt(Math.floor(Math.random() * digits.length));
  out += digits.charAt(Math.floor(Math.random() * digits.length));
  return out;
}

/**
 * Institutional seniority ranking for Bangladeshi secondary schools:
 * 1. প্রধান শিক্ষক / অধ্যক্ষ
 * 2. সহকারী প্রধান শিক্ষক / উপাধ্যক্ষ
 * 3. সিনিয়র / জ্যেষ্ঠ শিক্ষক
 * 4. সহকারী শিক্ষক
 * 5. গ্রন্থাগারিক / অফিস স্টাফ / অন্যান্য
 */
export function getDesignationSeniorityRank(designation?: string): number {
  const d = String(designation ?? '').trim().toLowerCase();
  if (!d) return 50;
  if (
    (d.includes('সহকারী প্রধান') || d.includes('উপাধ্যক্ষ') || d.includes('assistant head') || d.includes('vice principal'))
  ) {
    return 2;
  }
  if (d.includes('প্রধান শিক্ষক') || d.includes('অধ্যক্ষ') || d.includes('principal') || d.includes('headmaster')) {
    return 1;
  }
  if (d.includes('সিনিয়র') || d.includes('সিনিয়র') || d.includes('জ্যেষ্ঠ') || d.includes('senior')) {
    return 3;
  }
  if (d.includes('সহকারী শিক্ষক') || d.includes('assistant teacher') || d.includes('শিক্ষক')) {
    return 4;
  }
  if (d.includes('গ্রন্থাগারিক') || d.includes('librarian')) {
    return 5;
  }
  return 6;
}

/**
 * Sorts teachers by institutional seniority (Active first -> Designation rank -> Name A-Z).
 */
export function sortTeachersExecutive(teachers: TeacherRecord[]): TeacherRecord[] {
  return [...teachers].sort((a, b) => {
    const activeA = a.status === 'active' ? 0 : 1;
    const activeB = b.status === 'active' ? 0 : 1;
    if (activeA !== activeB) return activeA - activeB;

    const rankA = getDesignationSeniorityRank(a.designation);
    const rankB = getDesignationSeniorityRank(b.designation);
    if (rankA !== rankB) return rankA - rankB;

    return (a.name || '').localeCompare(b.name || '', 'bn', {
      numeric: true,
      sensitivity: 'base',
    });
  });
}

/**
 * Formats class or class-section IDs into natural Bangla labels.
 * Examples:
 * - '8th-A' -> '৮ম শ্রেণি — শাখা A'
 * - '9th'   -> '৯ম শ্রেণি'
 */
export function formatClassSectionLabelBn(classId: string): string {
  const raw = String(classId ?? '').trim();
  if (!raw) return '';
  const parts = raw.split('-').map((p) => p.trim()).filter(Boolean);
  const baseKey = parts[0] || raw;
  const section = parts.slice(1).join('-');
  const baseLabel = CLASS_LABEL_MAP_BN[baseKey] || baseKey;
  if (section) {
    return `${baseLabel} — শাখা ${section}`;
  }
  return baseLabel;
}

/**
 * Compact Bangla class badge formatter (e.g. '8th' -> '৮ম', '8th-A' -> '৮ম (A)').
 */
export function formatClassShortLabelBn(classId: string): string {
  const raw = String(classId ?? '').trim();
  if (!raw) return '';
  const parts = raw.split('-').map((p) => p.trim()).filter(Boolean);
  const baseKey = parts[0] || raw;
  const section = parts.slice(1).join('-');
  const shortBase = CLASS_SHORT_MAP_BN[baseKey] || baseKey;
  return section ? `${shortBase} (${section})` : shortBase;
}

/**
 * Computes inline filter pill counts for the Teacher Directory.
 */
export function computeTeacherDirectoryCounts(
  teachers: TeacherRecord[],
  classTeachers: ClassTeacherAssignment[]
): TeacherDirectoryCounts {
  const ctTeacherIds = new Set(classTeachers.map((ct) => ct.teacherId));
  let active = 0;
  let inactive = 0;
  let classTeacher = 0;
  let mustChangePassword = 0;

  for (const t of teachers) {
    if (t.status === 'active') active++;
    else inactive++;
    if (ctTeacherIds.has(t.id)) classTeacher++;
    if (t.mustChangePassword) mustChangePassword++;
  }

  return {
    all: teachers.length,
    active,
    inactive,
    classTeacher,
    mustChangePassword,
  };
}

/**
 * Filters teachers by status/role pill, optional designation, and unified search query
 * (supports Bangla/English digits for phone/ID/indexNo, designation, qualification, assigned subjects, and class teacher roles).
 */
export function filterTeacherDirectory(
  teachers: TeacherRecord[],
  subjectAssignments: SubjectAssignment[],
  classTeachers: ClassTeacherAssignment[],
  options: { query?: string; filter?: TeacherDirectoryFilter; designation?: string } = {}
): TeacherRecord[] {
  const filter = options.filter || 'all';
  const designationFilter = (options.designation || 'all').trim();
  const rawQuery = (options.query || '').trim();
  const normalizedQuery = toAsciiDigits(rawQuery).toLowerCase();
  const rawLower = rawQuery.toLowerCase();

  const ctMap = new Map<string, ClassTeacherAssignment[]>();
  for (const ct of classTeachers) {
    const list = ctMap.get(ct.teacherId) || [];
    list.push(ct);
    ctMap.set(ct.teacherId, list);
  }

  const subMap = new Map<string, SubjectAssignment[]>();
  for (const sa of subjectAssignments) {
    const list = subMap.get(sa.teacherId) || [];
    list.push(sa);
    subMap.set(sa.teacherId, list);
  }

  return teachers.filter((t) => {
    if (filter === 'active' && t.status !== 'active') return false;
    if (filter === 'inactive' && t.status === 'active') return false;
    if (filter === 'class_teacher' && !ctMap.has(t.id)) return false;
    if (filter === 'must_change_password' && !t.mustChangePassword) return false;
    if (designationFilter && designationFilter !== 'all' && t.designation !== designationFilter) {
      return false;
    }

    if (!rawQuery) return true;

    const teacherSubs = subMap.get(t.id) || [];
    const teacherCTs = ctMap.get(t.id) || [];

    const haystackParts = [
      t.name,
      t.id,
      t.phone,
      toAsciiDigits(t.phone),
      t.designation,
      t.qualification || '',
      t.indexNo || '',
      toAsciiDigits(t.indexNo || ''),
      t.email || '',
      t.subjectSpecialty || '',
      ...teacherSubs.flatMap((sa) => [
        sa.subjectId,
        sa.classId,
        formatClassSectionLabelBn(sa.classId),
      ]),
      ...teacherCTs.flatMap((ct) => [ct.classId, formatClassSectionLabelBn(ct.classId)]),
    ];

    const haystack = haystackParts.join(' ').toLowerCase();
    const asciiHaystack = toAsciiDigits(haystack);

    return haystack.includes(rawLower) || asciiHaystack.includes(normalizedQuery);
  });
}

/**
 * Loads deduplicated active NCTB curriculum subjects for a class/group,
 * splitting generic religion subjects into Islam & Hindu assignments.
 */
export function getDynamicConfiguredSubjects(
  gradeStr: string,
  group: string = 'all',
  isMounted: boolean = false
): DynamicConfiguredSubject[] {
  const normalized = toAsciiDigits(gradeStr);
  const gradeNum = parseInt(normalized.replace(/\D/g, ''), 10) || 8;

  if (!isMounted && typeof window === 'undefined') return [];

  const groupsToLoad =
    gradeNum >= 9 && group === 'all'
      ? ['science', 'humanities', 'commerce']
      : [gradeNum >= 9 ? group : 'সাধারণ'];

  const seen = new Set<string>();
  const combined: DynamicConfiguredSubject[] = [];

  for (const grp of groupsToLoad) {
    for (const sub of getActiveCurriculumSubjects(gradeStr, grp)) {
      if (seen.has(sub.name)) continue;
      seen.add(sub.name);
      const isRel = isReligionSubject(`${sub.code} ${sub.name}`);
      if (isRel) {
        const relOptions: Array<{ code: string; name: string }> = [
          { code: '111', name: 'ইসলাম ও নৈতিক শিক্ষা' },
          { code: '112', name: 'হিন্দুধর্ম ও নৈতিক শিক্ষা' },
        ];
        for (const relOpt of relOptions) {
          if (!seen.has(relOpt.name)) {
            seen.add(relOpt.name);
            combined.push({ code: relOpt.code, name: relOpt.name, category: sub.category || 'আবশ্যিক' });
          }
        }
      } else {
        combined.push({ code: sub.code, name: sub.name, category: sub.group || sub.category || 'সাধারণ' });
      }
    }
  }

  return combined;
}
