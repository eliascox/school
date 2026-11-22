import type { ExamItem } from '@/services/examService';

export type PortalLang = 'bn' | 'en';

const BN_DIGIT_MAP: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

const EN_TO_BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/**
 * Converts Bengali digits (০-৯) to ASCII digits (0-9) and trims whitespace
 * so students/parents typing rolls with a Bangla keyboard match seamlessly.
 */
export function normalizeRollDigits(input: string): string {
  return String(input || '')
    .replace(/[০-৯]/g, (ch) => BN_DIGIT_MAP[ch] ?? ch)
    .trim();
}

export function toBanglaDigits(value: string | number | null | undefined): string {
  return String(value ?? '').replace(/[0-9]/g, (d) => EN_TO_BN_DIGITS[Number(d)] ?? d);
}

export function formatPortalNumber(value: string | number, lang: PortalLang): string {
  return lang === 'bn' ? toBanglaDigits(value) : String(value);
}

export const PORTAL_CLASS_OPTIONS: Array<{ value: string; labelEn: string; labelBn: string }> = [
  { value: '6th', labelEn: 'Class 6', labelBn: '৬ষ্ঠ শ্রেণি' },
  { value: '7th', labelEn: 'Class 7', labelBn: '৭ম শ্রেণি' },
  { value: '8th', labelEn: 'Class 8', labelBn: '৮ম শ্রেণি' },
  { value: '9th', labelEn: 'Class 9', labelBn: '৯ম শ্রেণি' },
  { value: '10th', labelEn: 'Class 10', labelBn: '১০ম শ্রেণি' },
];

export const PORTAL_GROUP_OPTIONS: Array<{ value: string; labelEn: string; labelBn: string }> = [
  { value: 'Science', labelEn: 'Science', labelBn: 'বিজ্ঞান' },
  { value: 'Humanities', labelEn: 'Humanities', labelBn: 'মানবিক' },
  { value: 'Business Studies', labelEn: 'Business Studies', labelBn: 'ব্যবসায় শিক্ষা' },
  { value: 'General', labelEn: 'General', labelBn: 'সাধারণ' },
];

export function formatPortalClassName(grade: string | undefined, lang: PortalLang): string {
  if (!grade) return lang === 'bn' ? '৬ষ্ঠ শ্রেণি' : 'Class 6';
  const clean = normalizeRollDigits(grade);
  const num = clean.replace(/\D/g, '');
  const matched = PORTAL_CLASS_OPTIONS.find(
    (c) => c.value === grade || (num && c.value.startsWith(num))
  );
  if (matched) return lang === 'bn' ? matched.labelBn : matched.labelEn;
  return grade;
}

export function formatPortalGroupName(group: string | undefined, lang: PortalLang): string {
  if (!group) return lang === 'bn' ? 'সাধারণ' : 'General';
  const g = group.trim();
  const low = g.toLowerCase();
  if (g.includes('বিজ্ঞান') || low.includes('science')) {
    return lang === 'bn' ? 'বিজ্ঞান' : 'Science';
  }
  if (g.includes('মানবিক') || low.includes('humanities') || low.includes('arts')) {
    return lang === 'bn' ? 'মানবিক' : 'Humanities';
  }
  if (g.includes('ব্যবসায়') || g.includes('ব্যবসায়') || low.includes('commerce') || low.includes('business')) {
    return lang === 'bn' ? 'ব্যবসায় শিক্ষা' : 'Business Studies';
  }
  if (g.includes('সাধারণ') || low.includes('general')) {
    return lang === 'bn' ? 'সাধারণ' : 'General';
  }
  return g;
}

export interface GradingScaleRow {
  interval: string;
  intervalBn: string;
  grade: string;
  point: string;
  pointBn: string;
  remarkEn: string;
  remarkBn: string;
  badgeClass: string;
}

export const NCTB_GRADING_SCALE: GradingScaleRow[] = [
  {
    interval: '80 – 100',
    intervalBn: '৮০ – ১০০',
    grade: 'A+',
    point: '5.00',
    pointBn: '৫.০০',
    remarkEn: 'Outstanding',
    remarkBn: 'অসাধারণ',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    interval: '70 – 79',
    intervalBn: '৭০ – ৭৯',
    grade: 'A',
    point: '4.00',
    pointBn: '৪.০০',
    remarkEn: 'Excellent',
    remarkBn: 'অতি উত্তম',
    badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    interval: '60 – 69',
    intervalBn: '৬০ – ৬৯',
    grade: 'A-',
    point: '3.50',
    pointBn: '৩.৫০',
    remarkEn: 'Very Good',
    remarkBn: 'উত্তম',
    badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  {
    interval: '50 – 59',
    intervalBn: '৫০ – ৫৯',
    grade: 'B',
    point: '3.00',
    pointBn: '৩.০০',
    remarkEn: 'Good',
    remarkBn: 'ভালো',
    badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  {
    interval: '40 – 49',
    intervalBn: '৪০ – ৪৯',
    grade: 'C',
    point: '2.00',
    pointBn: '২.০০',
    remarkEn: 'Satisfactory',
    remarkBn: 'সন্তোষজনক',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    interval: '33 – 39',
    intervalBn: '৩৩ – ৩৯',
    grade: 'D',
    point: '1.00',
    pointBn: '১.০০',
    remarkEn: 'Pass',
    remarkBn: 'চলনসই',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
  {
    interval: '00 – 32',
    intervalBn: '০০ – ৩২',
    grade: 'F',
    point: '0.00',
    pointBn: '০.০০',
    remarkEn: 'Fail',
    remarkBn: 'অকৃতকার্য',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
];

/**
 * Picks the smartest default exam title:
 * 1. Explicit URL parameter if present in active exams.
 * 2. First published active exam so visitors immediately land on live results.
 * 3. First active exam or fallback string.
 */
export function pickDefaultExamTitle(
  exams: ExamItem[],
  preferredTitle?: string | null,
  formatDisplay?: (title: string) => string
): string {
  if (!exams || exams.length === 0) {
    return preferredTitle?.trim() || 'Annual Examination 2026';
  }

  if (preferredTitle && preferredTitle.trim()) {
    const exactOrFormatted = exams.find(
      (e) =>
        e.title === preferredTitle ||
        (formatDisplay ? formatDisplay(e.title) === preferredTitle : false)
    );
    if (exactOrFormatted) return exactOrFormatted.title;
  }

  const firstPublished = exams.find((e) => Boolean(e.isPublished));
  if (firstPublished) return firstPublished.title;

  return exams[0].title;
}

export function buildResultShareUrl(
  origin: string,
  params: { exam: string; grade: string; group?: string; roll: string }
): string {
  const qs = new URLSearchParams();
  if (params.exam) qs.set('exam', params.exam);
  if (params.grade) qs.set('grade', params.grade);
  if (params.group && (params.grade === '9th' || params.grade === '10th')) {
    qs.set('group', params.group);
  }
  if (params.roll) qs.set('roll', normalizeRollDigits(params.roll));
  const cleanOrigin = origin.replace(/\/+$/, '');
  return `${cleanOrigin}/result/?${qs.toString()}`;
}
