/**
 * Pure Utilities for `/dashboard/academic/marksheet` (Official Marksheet & Print Studio):
 *  - Dynamic Class 9–10 Group <-> Branch auto-sync
 *  - Bengali & English roll parsing, searching & sorting
 *  - Centralized Merit Position computation aligned with `resultService`
 *  - Selective Batch Print filtering (Selected, Passed Only, Roll Range, Full Class)
 *  - Synchronous Vector QR SVG path builder (zero async flash on immediate print)
 */

import QRCode from 'qrcode';
import { toAsciiDigits, toBanglaDigits } from '@/lib/omr/omrTemplates';
import type { PassEvaluationMode } from '@/services/resultService';
import type { StudentProfile } from '@/components/OfficialMarksheetSheet';

export type MarksheetBorderPreset =
  | 'classic_double'
  | 'emerald_gold'
  | 'royal_navy'
  | 'minimal'
  | 'custom_png';

export type MarksheetBatchFilterMode =
  | 'selected'
  | 'passed_only'
  | 'roll_range'
  | 'all';

export type MarksheetStatusFilter = 'all' | 'passed' | 'failed';

export interface EvaluatedMarksheetItem<TData = unknown> {
  student: StudentProfile;
  marksheetData: TData;
  totalObtained: number;
  totalFull: number;
  obtainedPercentage: number;
  gpaWithout4th: number;
  finalGPA: number;
  overallGrade: string;
  hasFailed: boolean;
  failedCount: number;
  /** Official class merit rank among 100% passed students (null if failed) */
  meritPosition: number | null;
  totalClassStudents: number;
}

export const MARKSHEET_BORDER_PRESETS: Array<{
  id: Exclude<MarksheetBorderPreset, 'custom_png'>;
  labelBn: string;
  descBn: string;
  accentHex: string;
}> = [
  {
    id: 'classic_double',
    labelBn: 'ক্লাসিক বোর্ড',
    descBn: 'দ্বৈত কালো ফ্রেম ও কোণ অলংকরণ',
    accentHex: '#0f172a',
  },
  {
    id: 'emerald_gold',
    labelBn: 'এমেরাল্ড ও গোল্ড',
    descBn: 'প্রাতিষ্ঠানিক সবুজ ও সোনালি রেখা',
    accentHex: '#0B5D3B',
  },
  {
    id: 'royal_navy',
    labelBn: 'রয়্যাল নেভি',
    descBn: 'গাঢ় নীল ফরমাল একাডেমিক বর্ডার',
    accentHex: '#0f294a',
  },
  {
    id: 'minimal',
    labelBn: 'মিনিমাল ক্লিন',
    descBn: 'হালকা একক বর্ডার (ইংক-সেভার)',
    accentHex: '#334155',
  },
];

/**
 * Parses Bengali ("০৫", "১২") or English ("05", "12") roll strings to an integer.
 */
export function normalizeMarksheetRollNumber(roll: string | number | null | undefined): number {
  const ascii = toAsciiDigits(String(roll ?? '')).replace(/\D/g, '');
  if (!ascii) return Number.MAX_SAFE_INTEGER;
  const parsed = parseInt(ascii, 10);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

/**
 * Normalizes Grade + Group + Branch so Class 9–10 groups ALWAYS stay synced with
 * their matching storage branch ('Science' | 'Humanities' | 'Commerce').
 */
export function resolveBranchForGradeAndGroup(
  grade: string,
  branch: string,
  group: string,
): { normalizedBranch: string; normalizedGroupBn: string } {
  const is9or10 = grade === '9th' || grade === '10th';
  if (!is9or10) {
    const cleanSec = ['A', 'B', 'C'].includes(branch) ? branch : 'A';
    return { normalizedBranch: cleanSec, normalizedGroupBn: 'সাধারণ' };
  }

  const raw = `${group || ''} ${branch || ''}`.toLowerCase();
  if (raw.includes('মানবিক') || raw.includes('humanities') || raw.includes('arts')) {
    return { normalizedBranch: 'Humanities', normalizedGroupBn: 'মানবিক' };
  }
  if (raw.includes('ব্যবসা') || raw.includes('commerce') || raw.includes('business')) {
    return { normalizedBranch: 'Commerce', normalizedGroupBn: 'ব্যবসায় শিক্ষা' };
  }
  return { normalizedBranch: 'Science', normalizedGroupBn: 'বিজ্ঞান' };
}

/**
 * Formats an English ordinal string (1st, 2nd, 3rd, 4th, 11th, 21st...).
 */
export function formatMeritPositionEn(position: number | null | undefined): string {
  if (!position || position <= 0) return '—';
  const mod100 = position % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${position}th`;
  const mod10 = position % 10;
  if (mod10 === 1) return `${position}st`;
  if (mod10 === 2) return `${position}nd`;
  if (mod10 === 3) return `${position}rd`;
  return `${position}th`;
}

/**
 * Formats a Bangla ordinal string (১ম, ২য়, ৩য়, ৪র্থ, ৫ম...).
 */
export function formatMeritPositionBn(position: number | null | undefined): string {
  if (!position || position <= 0) return '—';
  const bn = toBanglaDigits(position);
  if (position === 1) return `${bn}ম`;
  if (position === 2 || position === 3) return `${bn}য়`;
  if (position === 4) return `${bn}র্থ`;
  if (position >= 5 && position <= 10) return `${bn}ম`;
  return `${bn}তম`;
}

export interface MarksheetSummaryCalcShape {
  totalObtained: number;
  totalFull: number;
  gpaWithout4th: number;
  finalGPA: number;
  overallGrade: string;
  hasFailed: boolean;
  subjects?: Array<{ isPassed?: boolean; isJointSlave?: boolean }>;
}

/**
 * Evaluates all students in a class/section/group in a SINGLE pass (using the centralized
 * `evaluateSubjectGradeAndPass` engine inside `generateStudentMarksheetData`) and attaches
 * TRUE Merit Positions strictly among 100% passed students (GPA -> GPA w/o 4th -> Total -> Roll asc).
 */
export function evaluateClassMarksheetsWithMerit<TData extends MarksheetSummaryCalcShape>(
  students: StudentProfile[],
  buildMarksheetData: (student: StudentProfile) => TData,
  _context?: {
    selectedExam: string;
    selectedGrade: string;
    selectedBranch: string;
    passMode?: PassEvaluationMode;
  },
): EvaluatedMarksheetItem<TData>[] {
  void _context;
  const totalClassStudents = students.length;

  const rawItems: EvaluatedMarksheetItem<TData>[] = students.map((student) => {
    const marksheetData = buildMarksheetData(student);
    const totalFull = marksheetData.totalFull;
    const totalObtained = marksheetData.totalObtained;
    const obtainedPercentage =
      totalFull > 0 ? Number(((totalObtained / totalFull) * 100).toFixed(1)) : 0;

    const hasFailed = Boolean(marksheetData.hasFailed);
    const finalGPA = hasFailed ? 0 : marksheetData.finalGPA;
    const gpaWithout4th = hasFailed ? 0 : marksheetData.gpaWithout4th;
    const overallGrade = hasFailed ? 'F' : marksheetData.overallGrade;
    const failedCount = Array.isArray(marksheetData.subjects)
      ? marksheetData.subjects.filter((s) => !s.isJointSlave && s.isPassed === false).length
      : hasFailed
        ? 1
        : 0;

    return {
      student,
      marksheetData,
      totalObtained,
      totalFull,
      obtainedPercentage,
      gpaWithout4th,
      finalGPA,
      overallGrade,
      hasFailed,
      failedCount,
      meritPosition: null,
      totalClassStudents,
    };
  });

  // Compute TRUE Merit Position strictly among 100% passed students with marks
  const passedSorted = rawItems
    .filter((item) => !item.hasFailed && item.totalFull > 0)
    .sort((a, b) => {
      if (b.finalGPA !== a.finalGPA) return b.finalGPA - a.finalGPA;
      if (b.gpaWithout4th !== a.gpaWithout4th) return b.gpaWithout4th - a.gpaWithout4th;
      if (b.totalObtained !== a.totalObtained) return b.totalObtained - a.totalObtained;
      return (
        normalizeMarksheetRollNumber(a.student.roll) -
        normalizeMarksheetRollNumber(b.student.roll)
      );
    });

  const meritMap = new Map<string, number>();
  passedSorted.forEach((item, idx) => {
    meritMap.set(item.student.id, idx + 1);
  });

  return rawItems.map((item) => ({
    ...item,
    meritPosition: !item.hasFailed ? (meritMap.get(item.student.id) ?? null) : null,
  }));
}

/**
 * Filters the student directory by Bengali/English roll or name + pass/fail status,
 * without altering each student's true meritPosition.
 */
export function filterMarksheetDirectory<TData>(
  items: EvaluatedMarksheetItem<TData>[],
  options: {
    searchQuery: string;
    statusFilter: MarksheetStatusFilter;
  },
): EvaluatedMarksheetItem<TData>[] {
  const q = (options.searchQuery || '').trim().toLowerCase();
  const qAscii = toAsciiDigits(q);

  return items.filter((item) => {
    if (options.statusFilter === 'passed' && item.hasFailed) return false;
    if (options.statusFilter === 'failed' && !item.hasFailed) return false;
    if (!q) return true;
    const nameMatch = item.student.name.toLowerCase().includes(q);
    const rollRaw = String(item.student.roll || '').toLowerCase();
    const rollAscii = toAsciiDigits(rollRaw);
    const rollMatch = rollRaw.includes(q) || rollAscii.includes(qAscii);
    return nameMatch || rollMatch;
  });
}

/**
 * Resolves exact students to include in Selective Batch Print:
 *  - 'selected': checkbox-checked students
 *  - 'passed_only': 100% passed students
 *  - 'roll_range': students whose numeric roll falls within [rollFrom..rollTo] (Bangla or English digits)
 *  - 'all': full class/section/group
 */
export function filterMarksheetBatchStudents<TData>(
  items: EvaluatedMarksheetItem<TData>[],
  options: {
    mode: MarksheetBatchFilterMode;
    selectedIds: string[];
    rollFrom?: string;
    rollTo?: string;
  },
): EvaluatedMarksheetItem<TData>[] {
  if (options.mode === 'all') {
    return items;
  }
  if (options.mode === 'passed_only') {
    return items.filter((it) => !it.hasFailed);
  }
  if (options.mode === 'selected') {
    const idSet = new Set(options.selectedIds);
    return items.filter((it) => idSet.has(it.student.id));
  }

  // 'roll_range'
  const fromRaw = toAsciiDigits(String(options.rollFrom ?? '')).replace(/\D/g, '');
  const toRaw = toAsciiDigits(String(options.rollTo ?? '')).replace(/\D/g, '');
  const fromNum = fromRaw ? parseInt(fromRaw, 10) : 1;
  const toNum = toRaw ? parseInt(toRaw, 10) : Number.MAX_SAFE_INTEGER;
  const minR = Math.min(fromNum, toNum);
  const maxR = Math.max(fromNum, toNum);

  return items.filter((it) => {
    const r = normalizeMarksheetRollNumber(it.student.roll);
    return r >= minR && r <= maxR;
  });
}

/**
 * Builds a compact, human- & scanner-readable verification payload for the marksheet QR code.
 */
export function buildMarksheetQrPayload(params: {
  eiin?: string;
  examName: string;
  grade: string;
  roll: string;
  studentName: string;
  gpa: string;
  gradeLetter: string;
  meritPosition?: number | null;
}): string {
  const parts = [
    'SCHOOLPRO-TRANSCRIPT',
    `EIIN:${toAsciiDigits(params.eiin || 'NA')}`,
    `EXAM:${params.examName}`,
    `CLASS:${params.grade}`,
    `ROLL:${toAsciiDigits(params.roll)}`,
    `NAME:${params.studentName}`,
    `GPA:${params.gpa}(${params.gradeLetter})`,
    `MERIT:${formatMeritPositionEn(params.meritPosition)}`,
  ];
  return parts.join('|');
}

/**
 * Synchronously generates a crisp SVG `<path>` for any QR code string using `QRCode.create`.
 * Guarantees zero async flicker and instant availability during immediate print / batch print.
 */
export function generateQrSvgPath(payload: string): { size: number; path: string } | null {
  try {
    const qr = QRCode.create(payload || 'SCHOOLPRO', { errorCorrectionLevel: 'M' });
    const size = qr.modules.size;
    let d = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (qr.modules.get(r, c)) {
          d += `M${c},${r}h1v1h-1z`;
        }
      }
    }
    return { size, path: d };
  } catch {
    return null;
  }
}
