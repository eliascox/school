/**
 * Pure Ranking, Deduplication, Statistical Summary & Export Utilities
 * for `/dashboard/exam/rank-result` (Class Merit List & School Champions).
 */

import type { ReligionType } from '@/lib/religionUtils';
import { toAsciiDigits, toBanglaDigits } from '@/lib/omr/omrTemplates';

export interface RankStudentBase {
  id: string;
  roll: string;
  name: string;
  grade: string; // '6th' | '7th' | '8th' | '9th' | '10th'
  gradeBn: string;
  section: string; // 'A' | 'B' | 'C' | 'Science' | 'Humanities' | 'Commerce'
  group: string; // 'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা'
  optionalSubject: string;
  religion: ReligionType;
}

export interface EvaluatedRankStudent extends RankStudentBase {
  totalObtained: number;
  totalFull: number;
  obtainedPercentage: number;
  gpaWithout4th: number;
  bonusGP: number;
  finalGPA: number;
  overallGrade: string;
  hasFailed: boolean;
  failedCount: number;
  failedSubjects: string[];
  hasIncompleteMarks?: boolean;
  isConsidered: boolean;
  /** Official merit rank among ALL passed students of this class/section/group (null if failed) */
  meritPosition: number | null;
  /** Sequential position in the criteria-filtered class list BEFORE search filter (1..N) */
  listOrder: number;
  /** School-wide rank among all passed students (1..N, null if failed) */
  schoolPosition: number | null;
  /** Class-wide rank among passed students in the same grade (1..N, null if failed) */
  classPosition: number | null;
  badge: string;
}

export interface CombinedRankCriteria {
  includePass: boolean;
  includeFail1: boolean;
  includeFail2: boolean;
  includeFail3: boolean;
  includeFail4Plus: boolean;
  includeConsidered: boolean;
}

export type RankSortMode = 'merit' | 'roll';
export type RankTieBreakerMode = 'gpa_first' | 'marks_first';
export type RankTopNLimit = 'all' | 3 | 5 | 10 | 20;
export type RankDocLang = 'bn' | 'en';
export type RankPresetMode = 'pass_only' | 'notice_default' | 'fail_only' | 'all' | 'custom';

export interface RankColumnConfig {
  showMarks: boolean;
  showSecondaryMetric: boolean;
}

export interface RankFilterOptions {
  sortMode?: RankSortMode;
  tieBreaker?: RankTieBreakerMode;
  topN?: RankTopNLimit;
}

export interface PopulatedScopeSummary {
  grade: '6th' | '7th' | '8th' | '9th' | '10th';
  section: string;
  group: 'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা';
  count: number;
  labelBn: string;
}

export interface ClassRankSummaryStats {
  totalStudents: number;
  passedCount: number;
  passRate: number;
  aPlusCount: number;
  fail1Count: number;
  fail2Count: number;
  fail3Count: number;
  fail4PlusCount: number;
  consideredCount: number;
  selectedCount: number;
  highestMarks: number;
  highestGpa: number;
}

export const RANK_GRADE_BN_MAP: Record<string, string> = {
  '6th': '৬ষ্ঠ শ্রেণি',
  '7th': '৭ম শ্রেণি',
  '8th': '৮ম শ্রেণি',
  '9th': '৯ম শ্রেণি',
  '10th': '১০ম শ্রেণি',
};

export const RANK_GRADE_SHORT_BN: Record<string, string> = {
  '6th': '৬ষ্ঠ',
  '7th': '৭ম',
  '8th': '৮ম',
  '9th': '৯ম',
  '10th': '১০ম',
};

export const RANK_GRADE_EN_MAP: Record<string, string> = {
  '6th': 'Class Six (6th)',
  '7th': 'Class Seven (7th)',
  '8th': 'Class Eight (8th)',
  '9th': 'Class Nine (9th)',
  '10th': 'Class Ten (10th)',
};

export const RANK_GRADE_SHORT_EN: Record<string, string> = {
  '6th': 'Class 6',
  '7th': 'Class 7',
  '8th': 'Class 8',
  '9th': 'Class 9',
  '10th': 'Class 10',
};

export function getRankGroupEn(groupBn: string): string {
  const g = (groupBn || '').toLowerCase();
  if (g.includes('বিজ্ঞান') || g.includes('science')) return 'Science';
  if (g.includes('মানবিক') || g.includes('humanities')) return 'Humanities';
  if (g.includes('ব্যবসা') || g.includes('commerce') || g.includes('business')) return 'Business Studies';
  return 'General';
}

export function formatEnglishOrdinal(n: number): string {
  if (n <= 0) return '—';
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const mod10 = n % 10;
  if (mod10 === 1) return `${n}st`;
  if (mod10 === 2) return `${n}nd`;
  if (mod10 === 3) return `${n}rd`;
  return `${n}th`;
}

export function buildCriteriaForPreset(
  preset: Exclude<RankPresetMode, 'custom'>,
): CombinedRankCriteria {
  if (preset === 'pass_only') {
    return {
      includePass: true,
      includeFail1: false,
      includeFail2: false,
      includeFail3: false,
      includeFail4Plus: false,
      includeConsidered: false,
    };
  }
  if (preset === 'fail_only') {
    return {
      includePass: false,
      includeFail1: true,
      includeFail2: true,
      includeFail3: true,
      includeFail4Plus: true,
      includeConsidered: false,
    };
  }
  if (preset === 'all') {
    return {
      includePass: true,
      includeFail1: true,
      includeFail2: true,
      includeFail3: true,
      includeFail4Plus: true,
      includeConsidered: true,
    };
  }
  return {
    includePass: true,
    includeFail1: true,
    includeFail2: true,
    includeFail3: false,
    includeFail4Plus: false,
    includeConsidered: true,
  };
}

export function detectRankPresetMode(c: CombinedRankCriteria): RankPresetMode {
  if (
    c.includePass &&
    !c.includeFail1 &&
    !c.includeFail2 &&
    !c.includeFail3 &&
    !c.includeFail4Plus &&
    !c.includeConsidered
  ) {
    return 'pass_only';
  }
  if (
    c.includePass &&
    c.includeFail1 &&
    c.includeFail2 &&
    !c.includeFail3 &&
    !c.includeFail4Plus &&
    c.includeConsidered
  ) {
    return 'notice_default';
  }
  if (
    !c.includePass &&
    c.includeFail1 &&
    c.includeFail2 &&
    c.includeFail3 &&
    c.includeFail4Plus &&
    !c.includeConsidered
  ) {
    return 'fail_only';
  }
  if (
    c.includePass &&
    c.includeFail1 &&
    c.includeFail2 &&
    c.includeFail3 &&
    c.includeFail4Plus &&
    c.includeConsidered
  ) {
    return 'all';
  }
  return 'custom';
}

export function summarizeAvailableScopes(allStudents: RankStudentBase[]): {
  byGrade: Record<'6th' | '7th' | '8th' | '9th' | '10th', number>;
  populatedScopes: PopulatedScopeSummary[];
} {
  const byGrade: Record<'6th' | '7th' | '8th' | '9th' | '10th', number> = {
    '6th': 0,
    '7th': 0,
    '8th': 0,
    '9th': 0,
    '10th': 0,
  };
  const scopeMap = new Map<string, PopulatedScopeSummary>();

  for (const st of allStudents) {
    const g = normalizeRankGrade(st.grade);
    byGrade[g] = (byGrade[g] || 0) + 1;
    const is9or10 = g === '9th' || g === '10th';
    const grp = (
      is9or10
        ? st.group === 'মানবিক'
          ? 'মানবিক'
          : st.group === 'ব্যবসায় শিক্ষা'
            ? 'ব্যবসায় শিক্ষা'
            : 'বিজ্ঞান'
        : 'সাধারণ'
    ) as PopulatedScopeSummary['group'];
    const sec = is9or10
      ? grp === 'বিজ্ঞান'
        ? 'Science'
        : grp === 'মানবিক'
          ? 'Humanities'
          : 'Commerce'
      : st.section || 'A';
    const key = `${g}__${is9or10 ? grp : sec}`;
    const existing = scopeMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      scopeMap.set(key, {
        grade: g,
        section: sec,
        group: grp,
        count: 1,
        labelBn: is9or10
          ? `${RANK_GRADE_SHORT_BN[g]} · ${grp}`
          : `${RANK_GRADE_SHORT_BN[g]} · শাখা ${sec}`,
      });
    }
  }

  const gradeRank: Record<string, number> = { '6th': 6, '7th': 7, '8th': 8, '9th': 9, '10th': 10 };
  const populatedScopes = Array.from(scopeMap.values()).sort((a, b) => {
    if (gradeRank[a.grade] !== gradeRank[b.grade]) return gradeRank[a.grade] - gradeRank[b.grade];
    return b.count - a.count;
  });

  return { byGrade, populatedScopes };
}

/**
 * Converts a Bengali or English roll string (e.g., "০৫", "05", "12") into a comparable integer.
 */
export function normalizeRankRollNumber(roll: string | number | null | undefined): number {
  const ascii = toAsciiDigits(String(roll ?? '')).replace(/\D/g, '');
  if (!ascii) return Number.MAX_SAFE_INTEGER;
  const num = parseInt(ascii, 10);
  return Number.isFinite(num) ? num : Number.MAX_SAFE_INTEGER;
}

/**
 * Normalizes any raw grade string into canonical '6th'..'10th'.
 */
export function normalizeRankGrade(rawGrade: unknown): '6th' | '7th' | '8th' | '9th' | '10th' {
  const raw = String(rawGrade ?? '6th').trim().toLowerCase();
  if (raw.includes('10') || raw.includes('১০') || raw.includes('ten') || raw.includes('দশম')) return '10th';
  if (raw.includes('9') || raw.includes('৯') || raw.includes('nine') || raw.includes('নবম')) return '9th';
  if (raw.includes('8') || raw.includes('৮') || raw.includes('eight') || raw.includes('অষ্টম')) return '8th';
  if (raw.includes('7') || raw.includes('৭') || raw.includes('seven') || raw.includes('সপ্তম')) return '7th';
  return '6th';
}

/**
 * Normalizes group (Bangla) and branch/section so Class 9–10 groups never collide during deduplication.
 */
export function normalizeRankGroupAndSection(
  grade: string,
  rawSection?: unknown,
  rawGroup?: unknown,
): { groupBn: string; sectionNorm: string } {
  const is9or10 = grade === '9th' || grade === '10th';
  const combined = `${String(rawGroup ?? '')} ${String(rawSection ?? '')}`.toLowerCase();

  if (is9or10) {
    if (combined.includes('মানবিক') || combined.includes('humanities')) {
      return { groupBn: 'মানবিক', sectionNorm: 'Humanities' };
    }
    if (combined.includes('ব্যবসা') || combined.includes('commerce') || combined.includes('business')) {
      return { groupBn: 'ব্যবসায় শিক্ষা', sectionNorm: 'Commerce' };
    }
    return { groupBn: 'বিজ্ঞান', sectionNorm: 'Science' };
  }

  const secRaw = String(rawSection ?? 'A').trim().toUpperCase();
  const sectionNorm = ['A', 'B', 'C', 'D'].includes(secRaw) ? secRaw : 'A';
  return { groupBn: 'সাধারণ', sectionNorm };
}

/**
 * Builds a collision-free student dedup key across all classes, sections, and 9–10 groups.
 */
export function buildStudentRankDedupKey(
  grade: string,
  sectionNorm: string,
  groupBn: string,
  roll: string,
): string {
  const rollNum = normalizeRankRollNumber(roll);
  const rollPart = rollNum !== Number.MAX_SAFE_INTEGER ? String(rollNum) : String(roll).trim();
  return `${grade}_${groupBn}_${sectionNorm}_${rollPart}`;
}

/**
 * Comparator for official Class-level Merit ordering (strictly for passed students).
 * Priority: Final GPA → GPA without 4th → Total Obtained Marks → Percentage → Roll (asc).
 */
export function comparePassedClassMerit(
  a: EvaluatedRankStudent,
  b: EvaluatedRankStudent,
  tieBreaker: RankTieBreakerMode = 'gpa_first',
): number {
  if (tieBreaker === 'marks_first') {
    if (b.totalObtained !== a.totalObtained) return b.totalObtained - a.totalObtained;
    if (b.finalGPA !== a.finalGPA) return b.finalGPA - a.finalGPA;
    if (b.gpaWithout4th !== a.gpaWithout4th) return b.gpaWithout4th - a.gpaWithout4th;
    if (b.obtainedPercentage !== a.obtainedPercentage) return b.obtainedPercentage - a.obtainedPercentage;
    return normalizeRankRollNumber(a.roll) - normalizeRankRollNumber(b.roll);
  }
  if (b.finalGPA !== a.finalGPA) return b.finalGPA - a.finalGPA;
  if (b.gpaWithout4th !== a.gpaWithout4th) return b.gpaWithout4th - a.gpaWithout4th;
  if (b.totalObtained !== a.totalObtained) return b.totalObtained - a.totalObtained;
  if (b.obtainedPercentage !== a.obtainedPercentage) return b.obtainedPercentage - a.obtainedPercentage;
  return normalizeRankRollNumber(a.roll) - normalizeRankRollNumber(b.roll);
}

/**
 * Comparator for Cross-Class School Champion ordering (fair across different full marks).
 * Priority: Final GPA → Obtained Percentage (%) → GPA without 4th → Total Obtained → Roll (asc).
 */
export function comparePassedSchoolMerit(a: EvaluatedRankStudent, b: EvaluatedRankStudent): number {
  if (b.finalGPA !== a.finalGPA) return b.finalGPA - a.finalGPA;
  if (b.obtainedPercentage !== a.obtainedPercentage) return b.obtainedPercentage - a.obtainedPercentage;
  if (b.gpaWithout4th !== a.gpaWithout4th) return b.gpaWithout4th - a.gpaWithout4th;
  if (b.totalObtained !== a.totalObtained) return b.totalObtained - a.totalObtained;
  return normalizeRankRollNumber(a.roll) - normalizeRankRollNumber(b.roll);
}

/**
 * Formats an integer ordinal in Bangla (১ম, ২য়, ৩য়, ৪র্থ, ৫ম...).
 */
export function formatBanglaOrdinal(n: number): string {
  if (n <= 0) return '—';
  const bn = toBanglaDigits(n);
  if (n === 1) return `${bn}ম`;
  if (n === 2 || n === 3) return `${bn}য়`;
  if (n === 4) return `${bn}র্থ`;
  if (n >= 5 && n <= 10) return `${bn}ম`;
  return `${bn}তম`;
}

/**
 * Ranks all students in a single Class/Section/Group with strict board logic:
 *   1. Computes TRUE `meritPosition` across ALL passed students FIRST (before any filter/search).
 *   2. Filters by criteria checkboxes and assigns TRUE `listOrder` (1..N) BEFORE search query.
 *   3. Applies `searchQuery` LAST so searching for a student NEVER alters their merit rank or list order!
 */
export function rankAndFilterClassStudents(
  classStudents: EvaluatedRankStudent[],
  criteria: CombinedRankCriteria,
  searchQuery: string = '',
  options: RankFilterOptions = {},
): {
  criteriaMatchedList: EvaluatedRankStudent[];
  displayedList: EvaluatedRankStudent[];
  summary: ClassRankSummaryStats;
} {
  const sortMode: RankSortMode = options.sortMode || 'merit';
  const tieBreaker: RankTieBreakerMode = options.tieBreaker || 'gpa_first';
  const topN: RankTopNLimit = options.topN ?? 'all';

  // 1. Compute true meritPosition among ALL passed students of this class
  const allPassed = classStudents
    .filter((s) => !s.hasFailed)
    .sort((a, b) => comparePassedClassMerit(a, b, tieBreaker));
  const meritMap = new Map<string, number>();
  allPassed.forEach((st, idx) => {
    meritMap.set(st.id, idx + 1);
  });

  // 2. Apply criteria checkboxes (passed + selected fail buckets + special consideration)
  const criteriaMatched = classStudents.filter((st) => {
    if (criteria.includeConsidered && st.isConsidered) return true;
    if (!st.hasFailed && criteria.includePass) return true;
    if (st.hasFailed) {
      if (st.failedCount === 1 && criteria.includeFail1) return true;
      if (st.failedCount === 2 && criteria.includeFail2) return true;
      if (st.failedCount === 3 && criteria.includeFail3) return true;
      if ((st.failedCount >= 4 || st.failedCount === 0) && criteria.includeFail4Plus) return true;
    }
    return false;
  });

  // 3. Sort criteria-matched students by either Merit Order or Roll Order
  const sortedCriteriaMatched = [...criteriaMatched].sort((a, b) => {
    if (sortMode === 'roll') {
      const rollDiff = normalizeRankRollNumber(a.roll) - normalizeRankRollNumber(b.roll);
      if (rollDiff !== 0) return rollDiff;
      return a.name.localeCompare(b.name);
    }
    if (a.hasFailed !== b.hasFailed) return a.hasFailed ? 1 : -1;
    if (!a.hasFailed && !b.hasFailed) {
      return comparePassedClassMerit(a, b, tieBreaker);
    }
    if (a.isConsidered !== b.isConsidered) return a.isConsidered ? -1 : 1;
    if (a.failedCount !== b.failedCount) return a.failedCount - b.failedCount;
    if (b.totalObtained !== a.totalObtained) return b.totalObtained - a.totalObtained;
    return normalizeRankRollNumber(a.roll) - normalizeRankRollNumber(b.roll);
  });

  const rankedCriteriaList: EvaluatedRankStudent[] = sortedCriteriaMatched.map((st, idx) => {
    const listOrder = idx + 1;
    const meritPosition = !st.hasFailed ? (meritMap.get(st.id) ?? null) : null;
    let badge = 'বিশেষ বিবেচনা';
    if (meritPosition !== null) {
      badge = `${formatBanglaOrdinal(meritPosition)} মেধা`;
    } else if (st.isConsidered) {
      badge = 'বিশেষ বিবেচনা (অনুমোদিত)';
    }
    return {
      ...st,
      meritPosition,
      listOrder,
      badge,
    };
  });

  // 4. Optional Top-N slice (applied after true merit ranking & list order)
  const limitedList =
    topN === 'all' ? rankedCriteriaList : rankedCriteriaList.slice(0, topN);

  // 5. Apply search query WITHOUT recalculating meritPosition or listOrder!
  const q = searchQuery.trim().toLowerCase();
  const qAscii = toAsciiDigits(q);
  const displayedList = !q
    ? limitedList
    : limitedList.filter((st) => {
        const nameHit = st.name.toLowerCase().includes(q);
        const rollAscii = toAsciiDigits(st.roll).toLowerCase();
        const rollHit = rollAscii.includes(qAscii) || st.roll.toLowerCase().includes(q);
        return nameHit || rollHit;
      });

  // 5. Class summary statistics
  const totalStudents = classStudents.length;
  const passedCount = allPassed.length;
  const passRate = totalStudents > 0 ? Number(((passedCount / totalStudents) * 100).toFixed(1)) : 0;
  const aPlusCount = allPassed.filter((s) => s.overallGrade === 'A+').length;
  const fail1Count = classStudents.filter((s) => s.hasFailed && s.failedCount === 1).length;
  const fail2Count = classStudents.filter((s) => s.hasFailed && s.failedCount === 2).length;
  const fail3Count = classStudents.filter((s) => s.hasFailed && s.failedCount === 3).length;
  const fail4PlusCount = classStudents.filter((s) => s.hasFailed && (s.failedCount >= 4 || s.failedCount === 0)).length;
  const consideredCount = classStudents.filter((s) => s.isConsidered).length;
  const highestMarks = classStudents.reduce((acc, s) => Math.max(acc, s.totalObtained), 0);
  const highestGpa = allPassed.length > 0 ? allPassed[0].finalGPA : 0;

  return {
    criteriaMatchedList: rankedCriteriaList,
    displayedList,
    summary: {
      totalStudents,
      passedCount,
      passRate,
      aPlusCount,
      fail1Count,
      fail2Count,
      fail3Count,
      fail4PlusCount,
      consideredCount,
      selectedCount: displayedList.length,
      highestMarks,
      highestGpa,
    },
  };
}

export interface ChampionBucket {
  key: string;
  labelBn: string;
  grade: string;
  winners: EvaluatedRankStudent[];
}

/**
 * Computes All-School Champion (100% pass) + Top 3 per class (or per 9–10 group when `split910ByGroup` is true).
 */
export function computeSchoolChampions(
  allStudents: EvaluatedRankStudent[],
  split910ByGroup: boolean = false,
): {
  schoolChampion: EvaluatedRankStudent | null;
  allSchoolPassed: EvaluatedRankStudent[];
  buckets: ChampionBucket[];
} {
  const allSchoolPassed = allStudents
    .filter((s) => !s.hasFailed && s.totalFull > 0)
    .sort(comparePassedSchoolMerit)
    .map((st, idx) => ({
      ...st,
      schoolPosition: idx + 1,
    }));

  const schoolChampion = allSchoolPassed.length > 0 ? allSchoolPassed[0] : null;
  const grades: Array<'6th' | '7th' | '8th' | '9th' | '10th'> = ['6th', '7th', '8th', '9th', '10th'];
  const buckets: ChampionBucket[] = [];

  for (const grade of grades) {
    const is9or10 = grade === '9th' || grade === '10th';
    if (is9or10 && split910ByGroup) {
      const groups: Array<'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা'> = [
        'বিজ্ঞান',
        'মানবিক',
        'ব্যবসায় শিক্ষা',
      ];
      for (const grp of groups) {
        const winners = allSchoolPassed
          .filter((s) => s.grade === grade && s.group === grp)
          .sort(comparePassedSchoolMerit)
          .slice(0, 3)
          .map((st, idx) => ({
            ...st,
            classPosition: idx + 1,
          }));
        buckets.push({
          key: `${grade}_${grp}`,
          labelBn: `${RANK_GRADE_BN_MAP[grade]} (${grp})`,
          grade,
          winners,
        });
      }
    } else {
      const winners = allSchoolPassed
        .filter((s) => s.grade === grade)
        .sort(comparePassedSchoolMerit)
        .slice(0, 3)
        .map((st, idx) => ({
          ...st,
          classPosition: idx + 1,
        }));
      buckets.push({
        key: grade,
        labelBn: RANK_GRADE_BN_MAP[grade],
        grade,
        winners,
      });
    }
  }

  return { schoolChampion, allSchoolPassed, buckets };
}

/**
 * Builds clean Excel rows for Class Merit List export.
 */
export function buildClassRankExcelRows(
  list: EvaluatedRankStudent[],
  options: { isClass9or10: boolean; officeCopyMode: boolean; lang?: RankDocLang },
): Array<Record<string, string | number>> {
  const isEn = options.lang === 'en';
  if (isEn) {
    return list.map((st) => {
      const base: Record<string, string | number> = {
        'SL': st.listOrder,
        'Merit Position': st.meritPosition !== null ? formatEnglishOrdinal(st.meritPosition) : '—',
        'Roll': toAsciiDigits(st.roll),
        'Student Name': st.name,
        'Obtained Marks': st.totalObtained,
        'Full Marks': st.totalFull,
        'Percentage (%)': `${st.obtainedPercentage}%`,
      };
      if (options.isClass9or10) {
        base['GPA (W/O 4th)'] = st.hasFailed ? '0.00' : st.gpaWithout4th.toFixed(2);
      }
      base['Final GPA'] = st.hasFailed ? '0.00' : st.finalGPA.toFixed(2);
      base['Grade'] = st.overallGrade;
      base['Result / Status'] = st.hasFailed
        ? st.isConsidered
          ? 'Special Consideration (Approved)'
          : 'Special Consideration'
        : 'Passed';
      if (options.officeCopyMode) {
        base['Failed Subjects Count'] = st.failedCount;
        base['Failed Subjects'] = st.failedSubjects.join(', ');
      }
      return base;
    });
  }

  return list.map((st) => {
    const base: Record<string, string | number> = {
      'ক্রম': st.listOrder,
      'মেধা স্থান': st.meritPosition !== null ? formatBanglaOrdinal(st.meritPosition) : '—',
      'রোল': st.roll,
      'শিক্ষার্থীর নাম': st.name,
      'প্রাপ্ত নম্বর': st.totalObtained,
      'পূর্ণমান': st.totalFull,
      'শতকরা (%)': `${st.obtainedPercentage}%`,
    };
    if (options.isClass9or10) {
      base['GPA (৪র্থ ছাড়া)'] = st.hasFailed ? '0.00' : st.gpaWithout4th.toFixed(2);
    }
    base['চূড়ান্ত GPA'] = st.hasFailed ? '0.00' : st.finalGPA.toFixed(2);
    base['গ্রেড'] = st.overallGrade;
    base['ফলাফল / মন্তব্য'] = st.hasFailed
      ? st.isConsidered
        ? 'বিশেষ বিবেচনা (অনুমোদিত)'
        : 'বিশেষ বিবেচনা'
      : 'উত্তীর্ণ (পাস)';
    if (options.officeCopyMode) {
      base['অকৃতকার্য বিষয় সংখ্যা'] = st.failedCount;
      base['অকৃতকার্য বিষয়সমূহ'] = st.failedSubjects.join(', ');
    }
    return base;
  });
}

/**
 * Builds clean Excel rows for School Champions & Top 3 export.
 */
export function buildChampionsExcelRows(
  buckets: ChampionBucket[],
  lang: RankDocLang = 'bn',
): Array<Record<string, string | number>> {
  const rows: Array<Record<string, string | number>> = [];
  for (const bucket of buckets) {
    for (const st of bucket.winners) {
      if (lang === 'en') {
        rows.push({
          'Class / Group':
            st.grade === '9th' || st.grade === '10th'
              ? `${RANK_GRADE_SHORT_EN[st.grade]} (${getRankGroupEn(st.group)})`
              : RANK_GRADE_EN_MAP[st.grade] || st.grade,
          'Merit Rank': st.classPosition ? `${formatEnglishOrdinal(st.classPosition)} Merit` : '—',
          'Roll': toAsciiDigits(st.roll),
          'Student Name': st.name,
          'Section / Group':
            st.grade === '9th' || st.grade === '10th' ? getRankGroupEn(st.group) : `Section ${st.section}`,
          'Marks': `${st.totalObtained}/${st.totalFull}`,
          'Percentage (%)': `${st.obtainedPercentage}%`,
          'GPA': st.finalGPA.toFixed(2),
          'Grade': st.overallGrade,
          'School Position': st.schoolPosition ? formatEnglishOrdinal(st.schoolPosition) : '—',
        });
      } else {
        rows.push({
          'শ্রেণি / বিভাগ': bucket.labelBn,
          'মেধা স্থান': st.classPosition ? `${formatBanglaOrdinal(st.classPosition)} মেধা` : '—',
          'রোল': st.roll,
          'শিক্ষার্থীর নাম': st.name,
          'শাখা / বিভাগ': st.grade === '9th' || st.grade === '10th' ? st.group : `শাখা ${st.section}`,
          'প্রাপ্ত নম্বর': `${st.totalObtained}/${st.totalFull}`,
          'শতকরা (%)': `${st.obtainedPercentage}%`,
          'GPA': st.finalGPA.toFixed(2),
          'গ্রেড': st.overallGrade,
          'বিদ্যালয় স্থান': st.schoolPosition ? formatBanglaOrdinal(st.schoolPosition) : '—',
        });
      }
    }
  }
  return rows;
}
