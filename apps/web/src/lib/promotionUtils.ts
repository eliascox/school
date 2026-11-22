import { normalizeRollDigits } from '@/lib/resultPortalUtils';

export type PromotionGradeKey = '6th' | '7th' | '8th' | '9th' | '10th';
export type PromotionRollMode = 'keep' | 'merit';
export type PromotionStatusFilter = 'all' | 'Pass' | 'Fail' | 'Pending' | 'selected';

export interface StudentPromotionItem {
  id: string;
  roll: string;
  name: string;
  grade: string;
  section: string;
  group: string;
  gpa: string;
  letterGrade?: string;
  status: 'Pass' | 'Fail' | 'Pending';
  hasMarks: boolean;
  failedCount?: number;
  totalObtained?: number;
  selected: boolean;
  alreadyPromoted?: boolean;
}

export interface PromotionStepConfig {
  fromKey: PromotionGradeKey;
  fromShortBn: string;
  fromLabelBn: string;
  toKey: string;
  toLabelBn: string;
  toShortBn: string;
}

export const PROMOTION_STEPS: PromotionStepConfig[] = [
  {
    fromKey: '6th',
    fromShortBn: '৬ষ্ঠ',
    fromLabelBn: '৬ষ্ঠ শ্রেণি',
    toKey: '7th',
    toLabelBn: '৭ম শ্রেণি (7th)',
    toShortBn: '৭ম শ্রেণি',
  },
  {
    fromKey: '7th',
    fromShortBn: '৭ম',
    fromLabelBn: '৭ম শ্রেণি',
    toKey: '8th',
    toLabelBn: '৮ম শ্রেণি (8th)',
    toShortBn: '৮ম শ্রেণি',
  },
  {
    fromKey: '8th',
    fromShortBn: '৮ম',
    fromLabelBn: '৮ম শ্রেণি',
    toKey: '9th',
    toLabelBn: '৯ম শ্রেণি (9th)',
    toShortBn: '৯ম শ্রেণি',
  },
  {
    fromKey: '9th',
    fromShortBn: '৯ম',
    fromLabelBn: '৯ম শ্রেণি',
    toKey: '10th',
    toLabelBn: '১০ম শ্রেণি (10th)',
    toShortBn: '১০ম শ্রেণি',
  },
  {
    fromKey: '10th',
    fromShortBn: '১০ম',
    fromLabelBn: '১০ম শ্রেণি',
    toKey: 'Alumni',
    toLabelBn: 'এসএসসি পাস আউট (Alumni)',
    toShortBn: 'অ্যালুমনাই (পাস আউট)',
  },
];

export function getPromotionStep(fromKey: PromotionGradeKey): PromotionStepConfig {
  return PROMOTION_STEPS.find((s) => s.fromKey === fromKey) || PROMOTION_STEPS[0];
}

export interface PromotionCounts {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  alreadyPromoted: number;
  selected: number;
  selectedPassed: number;
  selectedPending: number;
  selectedFailed: number;
}

export function computePromotionCounts(students: StudentPromotionItem[]): PromotionCounts {
  let passed = 0;
  let failed = 0;
  let pending = 0;
  let alreadyPromoted = 0;
  let selected = 0;
  let selectedPassed = 0;
  let selectedPending = 0;
  let selectedFailed = 0;

  for (const st of students) {
    if (st.status === 'Pass') passed++;
    else if (st.status === 'Fail') failed++;
    else pending++;

    if (st.alreadyPromoted) {
      alreadyPromoted++;
      continue;
    }

    if (st.selected) {
      selected++;
      if (st.status === 'Pass') selectedPassed++;
      else if (st.status === 'Fail') selectedFailed++;
      else selectedPending++;
    }
  }

  return {
    total: students.length,
    passed,
    failed,
    pending,
    alreadyPromoted,
    selected,
    selectedPassed,
    selectedPending,
    selectedFailed,
  };
}

function parseRollNumber(roll: string): number {
  const digits = normalizeRollDigits(roll).replace(/\D/g, '');
  const n = parseInt(digits, 10);
  return Number.isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
}

function formatPaddedRoll(num: number): string {
  return String(num).padStart(2, '0');
}

/**
 * Computes the previewed next-class roll number for every selected promotable student.
 * - `keep`: preserves normalized existing roll.
 * - `merit`: ranks eligible selected students by Pass > Pending > Fail, GPA desc,
 *            totalObtained desc, original roll asc, assigning sequential 01, 02, ...
 * - Returns `{}` when targetGradeKey === 'Alumni' (graduated students are archived, not re-rolled).
 */
export function computeNewRollPreviewMap(
  students: StudentPromotionItem[],
  rollMode: PromotionRollMode,
  targetGradeKey: string
): Record<string, string> {
  if (targetGradeKey === 'Alumni') return {};

  const eligibleSelected = students.filter((s) => s.selected && !s.alreadyPromoted);
  const result: Record<string, string> = {};

  if (rollMode === 'keep') {
    for (const st of eligibleSelected) {
      const clean = normalizeRollDigits(st.roll);
      const n = parseRollNumber(clean);
      result[st.id] = n !== Number.MAX_SAFE_INTEGER ? formatPaddedRoll(n) : clean || '01';
    }
    return result;
  }

  const statusRank = (status: StudentPromotionItem['status']): number => {
    if (status === 'Pass') return 0;
    if (status === 'Pending') return 1;
    return 2;
  };

  const ranked = [...eligibleSelected].sort((a, b) => {
    const sDiff = statusRank(a.status) - statusRank(b.status);
    if (sDiff !== 0) return sDiff;

    const gpaA = parseFloat(a.gpa);
    const gpaB = parseFloat(b.gpa);
    const safeGpaA = Number.isNaN(gpaA) ? -1 : gpaA;
    const safeGpaB = Number.isNaN(gpaB) ? -1 : gpaB;
    if (safeGpaB !== safeGpaA) return safeGpaB - safeGpaA;

    const marksA = a.totalObtained ?? 0;
    const marksB = b.totalObtained ?? 0;
    if (marksB !== marksA) return marksB - marksA;

    return parseRollNumber(a.roll) - parseRollNumber(b.roll);
  });

  ranked.forEach((st, idx) => {
    result[st.id] = formatPaddedRoll(idx + 1);
  });

  return result;
}

export function normalizeGroupForMatch(group: string | undefined): string {
  const g = (group || 'সাধারণ').trim();
  const low = g.toLowerCase();
  if (g.includes('বিজ্ঞান') || low.includes('science')) return 'বিজ্ঞান';
  if (g.includes('মানবিক') || low.includes('humanities') || low.includes('arts')) return 'মানবিক';
  if (
    g.includes('ব্যবসায়') ||
    g.includes('ব্যবসায়') ||
    low.includes('business') ||
    low.includes('commerce')
  ) {
    return 'ব্যবসায় শিক্ষা';
  }
  return 'সাধারণ';
}

export function filterPromotionStudents(
  students: StudentPromotionItem[],
  filters: {
    statusFilter?: PromotionStatusFilter;
    groupFilter?: string;
    query?: string;
  }
): StudentPromotionItem[] {
  const statusFilter = filters.statusFilter || 'all';
  const groupFilter = filters.groupFilter || 'all';
  const q = normalizeRollDigits(filters.query || '').toLowerCase();

  return students.filter((st) => {
    if (statusFilter === 'selected') {
      if (!st.selected || st.alreadyPromoted) return false;
    } else if (statusFilter !== 'all') {
      if (st.status !== statusFilter) return false;
    }

    if (groupFilter !== 'all') {
      if (normalizeGroupForMatch(st.group) !== normalizeGroupForMatch(groupFilter)) {
        return false;
      }
    }

    if (q) {
      const haystack = [
        st.name,
        st.id,
        normalizeRollDigits(st.roll),
        st.section,
        st.group,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}
