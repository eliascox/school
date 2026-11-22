import type { Student } from '@/services/studentService';

export type AcademicShift = 'প্রভাতি (Morning)' | 'দিবা (Day)';

export interface SectionBranch {
  id: string;
  name: string;
  room: string;
  capacity: number;
  studentCount: number;
  sectionTeacher: string;
  shift: AcademicShift;
  /** True when manually created or explicitly edited by an admin. */
  isCustom?: boolean;
}

export interface ClassSubjectSummary {
  code: string;
  name: string;
  category?: string;
  fullMarks: number;
  cq?: number;
  mcq?: number;
  practical?: number;
  ca?: number;
  passRule?: string;
  jointPass?: boolean;
  combinedWithCode?: string;
}

export interface ClassItem {
  id: string;
  code: string;
  name: string;
  nameBn: string;
  gradeNumber: number;
  shift: AcademicShift;
  classTeacher: string;
  totalStudents: number;
  sections: SectionBranch[];
  groups: string[];
  subjects?: ClassSubjectSummary[];
  subjectsCount?: number;
}

export const CLASSES_STORAGE_KEY = 'sms_academic_classes';

export const DEMO_TEACHER_NAMES: readonly string[] = [
  'ইমরান রেজা (সহকারী শিক্ষক)',
  'মহসিন রেজা (সহকারী শিক্ষক)',
  'তারেক রহমান (জ্যেষ্ঠ শিক্ষক)',
  'ড. রফিকুল ইসলাম (হেড অব সায়েন্স)',
  'ড. রফিকুল ইসলাম (হেড অব সায়েন্স)',
  'আব্দুস সালাম (জ্যেষ্ঠ শিক্ষক)',
  'মৌসুমী হোসেন (ভাইস প্রিন্সিপাল)',
  'মোবারক হোসেন (ভাইস প্রিন্সিপাল)',
  'ইমরান রেজা',
  'মহসিন রেজা',
  'তারেক রহমান',
  'ড. রফিকুল ইসলাম',
  'আব্দুস সালাম',
  'মৌসুমী হোসেন',
  'মোবারক হোসেন',
  'ফাতিমা খাতুন',
  'নূরুল ইসলাম',
  'নুসরাত সুলতানা',
  'তারেক মাহমুদ',
  'কামরুল হাসান',
  'ফারজানা ববি',
  'বিলকিস বেগম',
  'তানভির আহমেদ',
  'শ্রেণি শিক্ষক',
];

const DEMO_TEACHER_SET = new Set(DEMO_TEACHER_NAMES);

/**
 * Default Bangladeshi secondary school classes (Classes 6–10).
 * Classes 6, 7, and 8 default to a single "Section A (ক শাখা)" so admins
 * add 2nd/3rd sections manually only when needed.
 * Classes 9 and 10 retain all 3 NCTB groups (বিজ্ঞান, মানবিক, ব্যবসায় শিক্ষা).
 */
export const DEFAULT_CLASSES: ClassItem[] = [
  {
    id: 'cls-6',
    code: 'CLS-06',
    name: 'Class 6',
    nameBn: '৬ষ্ঠ শ্রেণি',
    gradeNumber: 6,
    shift: 'দিবা (Day)',
    classTeacher: '',
    totalStudents: 0,
    groups: ['সাধারণ (General)'],
    sections: [
      {
        id: 'sec-6a',
        name: 'Section A (ক শাখা)',
        room: 'রুম ১০১',
        capacity: 50,
        studentCount: 0,
        sectionTeacher: '',
        shift: 'দিবা (Day)',
      },
    ],
  },
  {
    id: 'cls-7',
    code: 'CLS-07',
    name: 'Class 7',
    nameBn: '৭ম শ্রেণি',
    gradeNumber: 7,
    shift: 'দিবা (Day)',
    classTeacher: '',
    totalStudents: 0,
    groups: ['সাধারণ (General)'],
    sections: [
      {
        id: 'sec-7a',
        name: 'Section A (ক শাখা)',
        room: 'রুম ১০৩',
        capacity: 50,
        studentCount: 0,
        sectionTeacher: '',
        shift: 'দিবা (Day)',
      },
    ],
  },
  {
    id: 'cls-8',
    code: 'CLS-08',
    name: 'Class 8',
    nameBn: '৮ম শ্রেণি',
    gradeNumber: 8,
    shift: 'দিবা (Day)',
    classTeacher: '',
    totalStudents: 0,
    groups: ['সাধারণ (General)'],
    sections: [
      {
        id: 'sec-8a',
        name: 'Section A (ক শাখা)',
        room: 'রুম ২০১',
        capacity: 50,
        studentCount: 0,
        sectionTeacher: '',
        shift: 'দিবা (Day)',
      },
    ],
  },
  {
    id: 'cls-9',
    code: 'CLS-09',
    name: 'Class 9',
    nameBn: '৯ম শ্রেণি',
    gradeNumber: 9,
    shift: 'দিবা (Day)',
    classTeacher: '',
    totalStudents: 0,
    groups: ['বিজ্ঞান (Science)', 'মানবিক (Humanities)', 'ব্যবসায় শিক্ষা (Commerce)'],
    sections: [
      {
        id: 'sec-9a',
        name: 'Section A (বিজ্ঞান)',
        room: 'রুম ৩০১',
        capacity: 60,
        studentCount: 0,
        sectionTeacher: '',
        shift: 'দিবা (Day)',
      },
      {
        id: 'sec-9b',
        name: 'Section B (মানবিক)',
        room: 'রুম ৩০২',
        capacity: 50,
        studentCount: 0,
        sectionTeacher: '',
        shift: 'দিবা (Day)',
      },
      {
        id: 'sec-9c',
        name: 'Section C (ব্যবসায়)',
        room: 'রুম ৩০৩',
        capacity: 50,
        studentCount: 0,
        sectionTeacher: '',
        shift: 'দিবা (Day)',
      },
    ],
  },
  {
    id: 'cls-10',
    code: 'CLS-10',
    name: 'Class 10',
    nameBn: '১০ম শ্রেণি',
    gradeNumber: 10,
    shift: 'দিবা (Day)',
    classTeacher: '',
    totalStudents: 0,
    groups: ['বিজ্ঞান (Science)', 'মানবিক (Humanities)', 'ব্যবসায় শিক্ষা (Commerce)'],
    sections: [
      {
        id: 'sec-10a',
        name: 'Section A (বিজ্ঞান)',
        room: 'রুম ৪০১',
        capacity: 60,
        studentCount: 0,
        sectionTeacher: '',
        shift: 'দিবা (Day)',
      },
      {
        id: 'sec-10b',
        name: 'Section B (মানবিক)',
        room: 'রুম ৪০২',
        capacity: 50,
        studentCount: 0,
        sectionTeacher: '',
        shift: 'দিবা (Day)',
      },
      {
        id: 'sec-10c',
        name: 'Section C (ব্যবসায়)',
        room: 'রুম ৪০৩',
        capacity: 50,
        studentCount: 0,
        sectionTeacher: '',
        shift: 'দিবা (Day)',
      },
    ],
  },
];

export function gradeNumberToKey(gradeNumber: number): '6th' | '7th' | '8th' | '9th' | '10th' {
  if (gradeNumber === 6) return '6th';
  if (gradeNumber === 7) return '7th';
  if (gradeNumber === 8) return '8th';
  if (gradeNumber === 9) return '9th';
  return '10th';
}

export function isDemoTeacherName(name?: string | null): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  return trimmed === '' || DEMO_TEACHER_SET.has(trimmed);
}

function normalizeGradeKey(raw: string | number | undefined): string {
  const str = String(raw || '').trim().toLowerCase();
  if (!str) return '';
  if (str.includes('10') || str.includes('ten') || str.includes('১০')) return '10th';
  if (str.includes('9') || str.includes('nine') || str.includes('৯')) return '9th';
  if (str.includes('8') || str.includes('eight') || str.includes('৮')) return '8th';
  if (str.includes('7') || str.includes('seven') || str.includes('৭')) return '7th';
  if (str.includes('6') || str.includes('six') || str.includes('৬')) return '6th';
  return str;
}

const BANGLA_LETTER_TO_TOKEN: Record<string, string> = {
  ক: 'A',
  খ: 'B',
  গ: 'C',
  ঘ: 'D',
  ঙ: 'E',
};

/**
 * Extracts a canonical section token ('A', 'B', 'C', 'D', ...) or cleaned custom label
 * without falsely matching letters inside the words "section" or "branch" (e.g. 'c' in "section").
 */
export function extractSectionToken(raw: string | undefined | null): string {
  const input = String(raw || '').trim();
  if (!input) return '';

  const cleaned = input
    .toLowerCase()
    .replace(/\b(section|branch|sec)\b/g, ' ')
    .replace(/শাখা/g, ' ')
    .replace(/[()[\],.:;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  const tokens = cleaned.split(' ').filter(Boolean);
  for (const tok of tokens) {
    if (/^[a-z]$/.test(tok)) {
      return tok.toUpperCase();
    }
    if (BANGLA_LETTER_TO_TOKEN[tok]) {
      return BANGLA_LETTER_TO_TOKEN[tok];
    }
  }

  return cleaned;
}

function isScienceLabel(value: string): boolean {
  const lower = value.toLowerCase();
  return lower.includes('বিজ্ঞান') || lower.includes('science');
}

function isHumanitiesLabel(value: string): boolean {
  const lower = value.toLowerCase();
  return lower.includes('মানবিক') || lower.includes('humanities') || lower.includes('arts');
}

function isCommerceLabel(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower.includes('ব্যবসায়') ||
    lower.includes('ব্যবসায়') ||
    lower.includes('commerce') ||
    lower.includes('business')
  );
}

export function countClassStudents(
  students: Array<Pick<Student, 'grade' | 'gradeBn'>>,
  gradeNumber: number,
): number {
  const targetKey = gradeNumberToKey(gradeNumber);
  return students.filter((st) => normalizeGradeKey(st.grade || st.gradeBn) === targetKey).length;
}

export function countSectionStudents(
  students: Array<Pick<Student, 'grade' | 'gradeBn' | 'section' | 'branch' | 'group'>>,
  gradeNumber: number,
  sectionName: string,
): number {
  const targetKey = gradeNumberToKey(gradeNumber);
  const gradeStudents = students.filter(
    (st) => normalizeGradeKey(st.grade || st.gradeBn) === targetKey,
  );

  const secName = String(sectionName || '');
  const targetToken = extractSectionToken(secName);

  return gradeStudents.filter((st) => {
    const stGroup = String(st.group || '').trim();
    const stSecRaw = String(st.section || st.branch || '').trim();
    const stSecToken = extractSectionToken(stSecRaw);

    if (gradeNumber === 9 || gradeNumber === 10) {
      if (isScienceLabel(secName)) {
        return (
          isScienceLabel(stGroup) ||
          (!stGroup && (stSecToken === 'A' || isScienceLabel(stSecRaw)))
        );
      }
      if (isHumanitiesLabel(secName)) {
        return (
          isHumanitiesLabel(stGroup) ||
          (!stGroup && (stSecToken === 'B' || isHumanitiesLabel(stSecRaw)))
        );
      }
      if (isCommerceLabel(secName)) {
        return (
          isCommerceLabel(stGroup) ||
          (!stGroup && (stSecToken === 'C' || isCommerceLabel(stSecRaw)))
        );
      }
    }

    if (targetToken === 'A') {
      return !stSecToken || stSecToken === 'A';
    }
    if (targetToken) {
      return stSecToken === targetToken;
    }

    return true;
  }).length;
}

// ─── SAFE LEGACY MIGRATION HELPERS ──────────────────────────────────────────

const LEGACY_EXTRA_SECTION_IDS = new Set([
  'sec-6b',
  'sec-6c',
  'sec-7b',
  'sec-7c',
  'sec-8b',
  'sec-8c',
]);

const LEGACY_EXTRA_SECTION_NAMES = new Set([
  'section b (খ শাখা)',
  'section c (গ শাখা)',
  'section b (খ)',
  'section c (গ)',
  'section b',
  'section c',
  'খ শাখা (section b)',
  'গ শাখা (section c)',
  'খ শাখা',
  'গ শাখা',
  'শাখা খ',
  'শাখা গ',
  'b',
  'c',
  'খ',
  'গ',
]);

export function isLegacyExtraSectionName(name: string | undefined | null): boolean {
  const normalized = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return LEGACY_EXTRA_SECTION_NAMES.has(normalized);
}

/**
 * Returns true ONLY if `section` is an untouched legacy auto-generated B/C section
 * inside Classes 6–8 (never Classes 9–10, never manually added / custom sections).
 */
export function isLegacyAutoDefaultExtraSection(
  gradeNumber: number,
  section: Partial<SectionBranch>,
): boolean {
  // Never touch Classes 9 & 10 (or any grade outside 6–8)
  if (gradeNumber < 6 || gradeNumber > 8) return false;

  // Never remove sections explicitly marked as manually created / edited
  if (section.isCustom === true) return false;

  // Never remove a section where an admin has assigned a real (non-demo) teacher
  if (!isDemoTeacherName(section.sectionTeacher)) return false;

  const idLower = String(section.id || '').trim().toLowerCase();

  // Standard legacy auto-default IDs (sec-6b, sec-6c, sec-7b, sec-7c, sec-8b, sec-8c)
  if (LEGACY_EXTRA_SECTION_IDS.has(idLower)) {
    return true;
  }

  // Older legacy snapshots created before explicit IDs (missing id or single-digit index id like sec-6-1, sec-8-2)
  const isLegacyMissingOrIndexedId = idLower === '' || /^sec-[678]-[12]$/.test(idLower);
  if (isLegacyMissingOrIndexedId && isLegacyExtraSectionName(section.name)) {
    return true;
  }

  return false;
}

export interface MigrateClassesOptions {
  /**
   * Returns live student count for a given (gradeNumber, sectionName).
   * Combined conservatively with stored `section.studentCount` so no populated section is ever removed.
   */
  getLiveStudentCount?: (gradeNumber: number, sectionName: string) => number;
}

export interface MigrateClassesResult {
  classes: ClassItem[];
  migrated: boolean;
  removedCount: number;
}

/**
 * Safely migrates legacy auto-default empty B/C sections in Classes 6–8
 * while preserving:
 *  - Any section with live students (> 0) or stored studentCount (> 0)
 *  - Any manually created / custom section (isCustom or non-legacy ID)
 *  - At least 1 section per class (never produces a 0-section class from a non-empty class)
 *  - All Classes 9 & 10 groups/sections untouched
 */
export function migrateLegacyAutoDefaultSections(
  classes: ClassItem[],
  options?: MigrateClassesOptions,
): MigrateClassesResult {
  let removedCount = 0;

  const migratedClasses = classes.map((cls) => {
    if (cls.gradeNumber < 6 || cls.gradeNumber > 8 || cls.sections.length <= 1) {
      return cls;
    }

    const keptSections = cls.sections.filter((sec) => {
      if (!isLegacyAutoDefaultExtraSection(cls.gradeNumber, sec)) {
        return true;
      }

      const liveCount = options?.getLiveStudentCount
        ? options.getLiveStudentCount(cls.gradeNumber, sec.name)
        : 0;
      const storedCount = Number(sec.studentCount) || 0;

      if (liveCount > 0 || storedCount > 0) {
        return true;
      }

      return false;
    });

    // Safety guard: never drop a non-empty class down to 0 sections
    const finalSections = keptSections.length > 0 ? keptSections : cls.sections.slice(0, 1);
    const diff = cls.sections.length - finalSections.length;

    if (diff > 0) {
      removedCount += diff;
      return {
        ...cls,
        sections: finalSections,
      };
    }

    return cls;
  });

  return {
    classes: migratedClasses,
    migrated: removedCount > 0,
    removedCount,
  };
}

function normalizeShift(shift: string | undefined): AcademicShift {
  if (shift === 'প্রভাতি (Morning)' || shift === 'Morning') {
    return 'প্রভাতি (Morning)';
  }
  return 'দিবা (Day)';
}

function defaultBanglaClassName(gradeNumber: number): string {
  if (gradeNumber === 6) return '৬ষ্ঠ শ্রেণি';
  if (gradeNumber === 7) return '৭ম শ্রেণি';
  if (gradeNumber === 8) return '৮ম শ্রেণি';
  if (gradeNumber === 9) return '৯ম শ্রেণি';
  if (gradeNumber === 10) return '১০ম শ্রেণি';
  return `${gradeNumber}ম শ্রেণি`;
}

/**
 * Normalizes raw parsed `sms_academic_classes` JSON from localStorage, strips legacy demo
 * teacher names, and runs safe legacy empty section migration.
 */
export function normalizeAndMigrateClasses(
  rawItems: Array<Partial<ClassItem>>,
  options?: MigrateClassesOptions,
): MigrateClassesResult {
  let normalizedChanged = false;

  const formatted: ClassItem[] = rawItems.map((cls) => {
    const gNum = Number(cls.gradeNumber) || 6;
    const cleanedClassTeacher = isDemoTeacherName(cls.classTeacher)
      ? ''
      : String(cls.classTeacher || '').trim();
    if ((cls.classTeacher || '') !== cleanedClassTeacher) {
      normalizedChanged = true;
    }

    const classShift = normalizeShift(cls.shift);
    const rawSections = Array.isArray(cls.sections) ? cls.sections : [];

    const normalizedSections: SectionBranch[] = rawSections.map((sec, idx) => {
      const cleanedSecTeacher = isDemoTeacherName(sec.sectionTeacher)
        ? ''
        : String(sec.sectionTeacher || '').trim();
      if ((sec.sectionTeacher || '') !== cleanedSecTeacher) {
        normalizedChanged = true;
      }

      return {
        id: sec.id || `sec-${gNum}-${idx}`,
        name: sec.name || `Section ${String.fromCharCode(65 + idx)}`,
        room: sec.room || `রুম ${gNum}0${idx + 1}`,
        capacity: Number(sec.capacity) || 50,
        studentCount: Number(sec.studentCount) || 0,
        sectionTeacher: cleanedSecTeacher,
        shift: normalizeShift(sec.shift || classShift),
        ...(sec.isCustom ? { isCustom: true } : {}),
      };
    });

    return {
      id: cls.id || `cls-${gNum}`,
      code: cls.code || `CLS-${gNum < 10 ? `0${gNum}` : gNum}`,
      name: cls.name || `Class ${gNum}`,
      nameBn: cls.nameBn || defaultBanglaClassName(gNum),
      gradeNumber: gNum,
      shift: classShift,
      classTeacher: cleanedClassTeacher,
      totalStudents: Number(cls.totalStudents) || 0,
      groups:
        Array.isArray(cls.groups) && cls.groups.length > 0
          ? cls.groups
          : gNum >= 9
            ? ['বিজ্ঞান (Science)', 'মানবিক (Humanities)', 'ব্যবসায় শিক্ষা (Commerce)']
            : ['সাধারণ (General)'],
      subjects: cls.subjects,
      subjectsCount: cls.subjectsCount,
      sections: normalizedSections,
    };
  });

  const migrationResult = migrateLegacyAutoDefaultSections(formatted, options);

  return {
    classes: migrationResult.classes,
    migrated: migrationResult.migrated || normalizedChanged,
    removedCount: migrationResult.removedCount,
  };
}

// ─── UI HELPERS ─────────────────────────────────────────────────────────────

const NEXT_SECTION_SUGGESTIONS: Array<{ en: string; bn: string }> = [
  { en: 'A', bn: 'ক' },
  { en: 'B', bn: 'খ' },
  { en: 'C', bn: 'গ' },
  { en: 'D', bn: 'ঘ' },
  { en: 'E', bn: 'ঙ' },
];

export function suggestNextSectionDefaults(cls: ClassItem): {
  placeholderName: string;
  room: string;
  capacity: number;
  shift: AcademicShift;
} {
  const existingTokens = new Set(cls.sections.map((s) => extractSectionToken(s.name)));
  const nextLetter = NEXT_SECTION_SUGGESTIONS.find((item) => !existingTokens.has(item.en));
  const placeholderName = nextLetter
    ? `Section ${nextLetter.en} (${nextLetter.bn} শাখা)`
    : `Section ${cls.sections.length + 1}`;

  const floorBase = cls.gradeNumber <= 7 ? 100 : cls.gradeNumber === 8 ? 200 : cls.gradeNumber === 9 ? 300 : 400;
  const roomNum = floorBase + cls.sections.length + 1;
  const bnRoomNum = String(roomNum).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)] ?? d);

  return {
    placeholderName,
    room: `রুম ${bnRoomNum}`,
    capacity: 50,
    shift: cls.shift,
  };
}

export function getSectionBadgeLabel(name: string): string {
  if (isScienceLabel(name)) return 'বি';
  if (isHumanitiesLabel(name)) return 'মা';
  if (isCommerceLabel(name)) return 'ব্য';

  const token = extractSectionToken(name);
  if (token === 'A') return 'ক';
  if (token === 'B') return 'খ';
  if (token === 'C') return 'গ';
  if (token === 'D') return 'ঘ';
  if (token === 'E') return 'ঙ';

  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : 'শ';
}

export function matchesSubjectGroupFilter(
  subject: { group?: string; category?: string },
  filterKey: string,
): boolean {
  if (filterKey === 'all') return true;
  const grp = String(subject.group || '');
  const cat = String(subject.category || '');

  if (filterKey === '৪র্থ বিষয়') {
    return cat === '৪র্থ বিষয়' || grp === '৪র্থ বিষয়';
  }
  if (filterKey === 'ব্যবসায় শিক্ষা' || filterKey === 'ব্যবসায় শিক্ষা') {
    return isCommerceLabel(grp);
  }
  if (filterKey === 'মানবিক') {
    return isHumanitiesLabel(grp);
  }
  if (filterKey === 'বিজ্ঞান') {
    return isScienceLabel(grp);
  }
  return grp === filterKey || cat === filterKey;
}
