/**
 * Single-Source-of-Truth Exact-Millimeter OMR Sheet Template Geometry (v2)
 *
 * Supports:
 *  - Dynamic custom MCQ count from 10 to 100 (Bangla 0-9 & ASCII 0-9)
 *  - Legal Landscape 2-Up Half-Sheet (177.8mm x 215.9mm, 2 sheets on 355.6mm x 215.9mm)
 *    as primary/default paper format, plus A5 (148 x 210mm) & A4 (210 x 297mm)
 *  - On-sheet scannable bubble grids for:
 *      1. Roll Number (2-6 digits, 0-9)
 *      2. 3-Digit Subject Code (000-999, 0-9 x 3)
 *      3. Class / Grade (6th-10th)
 *      4. Department / Group (General, Science, Humanities, Business Studies)
 *      5. Set Code (ক/খ/গ/ঘ or A/B/C/D)
 *      6. Dynamic 10..100 MCQ Questions (4 options each)
 */

export type OmrTemplateId = 'a5_25' | 'a5_30' | 'a5_40' | 'a5_50' | 'a4_100' | 'custom';
export type OmrPaperFormat = 'legal_half' | 'a5' | 'a4';
export type OmrOptionStyle = 'bn' | 'en';
export type OmrColorTheme = 'pink' | 'bw';
export type OmrPrintLayout = 'legal_2up' | 'a4_2up' | 'a4_single' | 'a5_single';

export const LEGAL_LANDSCAPE_WIDTH_MM = 355.6; // 14 inches
export const LEGAL_LANDSCAPE_HEIGHT_MM = 215.9; // 8.5 inches
export const LEGAL_HALF_WIDTH_MM = 177.8; // Exact center = 355.6 / 2

export const OMR_MIN_QUESTIONS = 10;
export const OMR_MAX_QUESTIONS = 100;
export const OMR_QUICK_QUESTION_CHIPS: readonly number[] = [15, 20, 25, 30];

export interface OmrGradeBubbleOption {
  id: '6th' | '7th' | '8th' | '9th' | '10th';
  labelBn: string;
  shortBn: string;
  shortEn: string;
}

export const OMR_GRADE_OPTIONS: readonly OmrGradeBubbleOption[] = [
  { id: '6th', labelBn: '৬ষ্ঠ শ্রেণি', shortBn: '৬', shortEn: '6' },
  { id: '7th', labelBn: '৭ম শ্রেণি', shortBn: '৭', shortEn: '7' },
  { id: '8th', labelBn: '৮ম শ্রেণি', shortBn: '৮', shortEn: '8' },
  { id: '9th', labelBn: '৯ম শ্রেণি', shortBn: '৯', shortEn: '9' },
  { id: '10th', labelBn: '১০ম শ্রেণি', shortBn: '১০', shortEn: '10' },
];

export interface OmrGroupBubbleOption {
  id: 'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা';
  labelBn: string;
  captionBn: string;
  shortBn: string;
  shortEn: string;
}

export const OMR_GROUP_OPTIONS: readonly OmrGroupBubbleOption[] = [
  { id: 'সাধারণ', labelBn: 'সাধারণ', captionBn: 'সাধা.', shortBn: 'সা', shortEn: 'G' },
  { id: 'বিজ্ঞান', labelBn: 'বিজ্ঞান', captionBn: 'বিজ্ঞা.', shortBn: 'বি', shortEn: 'S' },
  { id: 'মানবিক', labelBn: 'মানবিক', captionBn: 'মান.', shortBn: 'মা', shortEn: 'H' },
  { id: 'ব্যবসায় শিক্ষা', labelBn: 'ব্যবসায় শিক্ষা', captionBn: 'ব্যব.', shortBn: 'ব্য', shortEn: 'B' },
];

export interface OmrBubbleCoord {
  /** Center X in page millimeters */
  xMm: number;
  /** Center Y in page millimeters */
  yMm: number;
  /** Bubble radius in millimeters */
  rMm: number;
  /** Normalized U in [0, 1] relative to the 4 corner fiducial centers */
  u: number;
  /** Normalized V in [0, 1] relative to the 4 corner fiducial centers */
  v: number;
  /** Normalized radius relative to fiducial span width */
  rU: number;
  /** Normalized radius relative to fiducial span height */
  rV: number;
  /** Display label inside the bubble */
  label: string;
}

export interface OmrFiducialPoint {
  id: 'tl' | 'tr' | 'br' | 'bl';
  xMm: number;
  yMm: number;
  sizeMm: number;
}

export interface OmrTemplatePreset {
  id: Exclude<OmrTemplateId, 'custom'>;
  nameBn: string;
  nameEn: string;
  questionCount: number;
  pageSize: 'LEGAL_HALF' | 'A5' | 'A4';
  paperFormat: OmrPaperFormat;
  pageWidthMm: number;
  pageHeightMm: number;
  fiducialInsetMm: number;
  fiducialSizeMm: number;
  columns: number;
  rowsPerColumn: number[];
  defaultRollDigits: number;
  recommendedForBn: string;
}

export interface OmrLayoutConfig {
  templateId?: OmrTemplateId;
  /** Dynamic question count 10..100 (overrides templateId questionCount if provided) */
  questionCount?: number;
  /** Target sheet paper format: 'legal_half' (177.8x215.9mm, default), 'a5' (148x210mm), or 'a4' (210x297mm) */
  paperFormat?: OmrPaperFormat;
  rollDigits?: number; // 2..6 (default 3)
  optionStyle?: OmrOptionStyle; // 'bn' | 'en'
  setCount?: 1 | 4; // 1 = no set grid, 4 = ক/খ/গ/ঘ or A/B/C/D
}

export interface OmrResolvedColumnBox {
  colIndex: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  startQ: number;
  endQ: number;
  rowPitchMm: number;
  firstRowYMm: number;
  optionXMm: number[];
  qNumXMm: number;
}

export interface OmrResolvedBox {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

export interface OmrResolvedDigitGridBox extends OmrResolvedBox {
  colPitchMm: number;
  firstColXMm: number;
  writeBoxYMm: number;
}

export interface OmrResolvedLayout {
  preset: {
    id: OmrTemplateId;
    nameBn: string;
    questionCount: number;
    pageSize: 'LEGAL_HALF' | 'A5' | 'A4';
    paperFormat: OmrPaperFormat;
    pageWidthMm: number;
    pageHeightMm: number;
    fiducialInsetMm: number;
    fiducialSizeMm: number;
    columns: number;
    rowsPerColumn: number[];
    defaultRollDigits: number;
  };
  questionCount: number;
  paperFormat: OmrPaperFormat;
  rollDigits: number;
  subjectCodeDigits: 3;
  optionStyle: OmrOptionStyle;
  optionLabels: [string, string, string, string];
  setCount: 1 | 4;
  setLabels: string[];
  fiducials: {
    tl: OmrFiducialPoint;
    tr: OmrFiducialPoint;
    br: OmrFiducialPoint;
    bl: OmrFiducialPoint;
  };
  /** Canonical span between fiducial centers */
  spanWidthMm: number;
  spanHeightMm: number;
  /** Canonical pixel size for perspective warp (aspect ratio = spanWidth/spanHeight) */
  canonicalWidthPx: number;
  canonicalHeightPx: number;
  /** rollBubbles[digitCol][0..9] */
  rollBubbles: OmrBubbleCoord[][];
  rollBox: OmrResolvedDigitGridBox;
  /** subjectCodeBubbles[0..2][0..9] (3-digit NCTB subject code) */
  subjectCodeBubbles: OmrBubbleCoord[][];
  subjectCodeBox: OmrResolvedDigitGridBox;
  /** gradeBubbles[0..4] (6th..10th) */
  gradeBubbles: OmrBubbleCoord[];
  gradeBox: OmrResolvedBox;
  /** groupBubbles[0..3] (সাধারণ, বিজ্ঞান, মানবিক, ব্যবসায় শিক্ষা) */
  groupBubbles: OmrBubbleCoord[];
  groupBox: OmrResolvedBox;
  /** setBubbles[0..3] (empty if setCount === 1) */
  setBubbles: OmrBubbleCoord[];
  setBox: OmrResolvedBox;
  infoBox: OmrResolvedBox;
  /** questionBubbles[qIndex 0..N-1][option 0..3] */
  questionBubbles: OmrBubbleCoord[][];
  questionColumns: OmrResolvedColumnBox[];
  mcqBandBox: OmrResolvedBox;
  headerBox: OmrResolvedBox;
}

export const OMR_OPTION_LABELS: Record<OmrOptionStyle, [string, string, string, string]> = {
  bn: ['ক', 'খ', 'গ', 'ঘ'],
  en: ['A', 'B', 'C', 'D'],
};

export const OMR_SET_LABELS: Record<OmrOptionStyle, [string, string, string, string]> = {
  bn: ['ক', 'খ', 'গ', 'ঘ'],
  en: ['A', 'B', 'C', 'D'],
};

export const OMR_TEMPLATE_PRESETS: Record<Exclude<OmrTemplateId, 'custom'>, OmrTemplatePreset> = {
  a5_25: {
    id: 'a5_25',
    nameBn: '২৫ প্রশ্ন (লিগাল ২-আপ / A5)',
    nameEn: '25 MCQ (Legal 2-up / A5)',
    questionCount: 25,
    pageSize: 'LEGAL_HALF',
    paperFormat: 'legal_half',
    pageWidthMm: LEGAL_HALF_WIDTH_MM,
    pageHeightMm: LEGAL_LANDSCAPE_HEIGHT_MM,
    fiducialInsetMm: 7.0,
    fiducialSizeMm: 4.0,
    columns: 2,
    rowsPerColumn: [13, 12],
    defaultRollDigits: 3,
    recommendedForBn: 'পদার্থ, রসায়ন, জীববিজ্ঞান, আইসিটি, কৃষি (২৫ MCQ)',
  },
  a5_30: {
    id: 'a5_30',
    nameBn: '৩০ প্রশ্ন (লিগাল ২-আপ / A5)',
    nameEn: '30 MCQ (Legal 2-up / A5)',
    questionCount: 30,
    pageSize: 'LEGAL_HALF',
    paperFormat: 'legal_half',
    pageWidthMm: LEGAL_HALF_WIDTH_MM,
    pageHeightMm: LEGAL_LANDSCAPE_HEIGHT_MM,
    fiducialInsetMm: 7.0,
    fiducialSizeMm: 4.0,
    columns: 2,
    rowsPerColumn: [15, 15],
    defaultRollDigits: 3,
    recommendedForBn: 'বাংলা, গণিত, বিজ্ঞান, সমাজ, ইসলাম, হিসাববিজ্ঞান (৩০ MCQ)',
  },
  a5_40: {
    id: 'a5_40',
    nameBn: '৪০ প্রশ্ন (লিগাল ২-আপ / A5)',
    nameEn: '40 MCQ (Legal 2-up / A5)',
    questionCount: 40,
    pageSize: 'LEGAL_HALF',
    paperFormat: 'legal_half',
    pageWidthMm: LEGAL_HALF_WIDTH_MM,
    pageHeightMm: LEGAL_LANDSCAPE_HEIGHT_MM,
    fiducialInsetMm: 7.0,
    fiducialSizeMm: 4.0,
    columns: 2,
    rowsPerColumn: [20, 20],
    defaultRollDigits: 3,
    recommendedForBn: 'ক্লাস টেস্ট ও সাপ্তাহিক মূল্যায়ন (৪০ MCQ)',
  },
  a5_50: {
    id: 'a5_50',
    nameBn: '৫০ প্রশ্ন (লিগাল ২-আপ / A5)',
    nameEn: '50 MCQ (Legal 2-up / A5)',
    questionCount: 50,
    pageSize: 'LEGAL_HALF',
    paperFormat: 'legal_half',
    pageWidthMm: LEGAL_HALF_WIDTH_MM,
    pageHeightMm: LEGAL_LANDSCAPE_HEIGHT_MM,
    fiducialInsetMm: 7.0,
    fiducialSizeMm: 4.0,
    columns: 3,
    rowsPerColumn: [17, 17, 16],
    defaultRollDigits: 3,
    recommendedForBn: 'মডেল টেস্ট ও বৃত্তি পরীক্ষা (৫০ MCQ)',
  },
  a4_100: {
    id: 'a4_100',
    nameBn: '১০০ প্রশ্ন (লিগাল ২-আপ / A4)',
    nameEn: '100 MCQ (Legal 2-up / Full A4)',
    questionCount: 100,
    pageSize: 'A4',
    paperFormat: 'a4',
    pageWidthMm: 210,
    pageHeightMm: 297,
    fiducialInsetMm: 8.5,
    fiducialSizeMm: 4.5,
    columns: 4,
    rowsPerColumn: [25, 25, 25, 25],
    defaultRollDigits: 4,
    recommendedForBn: 'বোর্ড মডেল টেস্ট ও ভর্তি পরীক্ষা (১০০ MCQ)',
  },
};

export const OMR_TEMPLATE_LIST: OmrTemplatePreset[] = [
  OMR_TEMPLATE_PRESETS.a5_30,
  OMR_TEMPLATE_PRESETS.a5_25,
  OMR_TEMPLATE_PRESETS.a5_40,
  OMR_TEMPLATE_PRESETS.a5_50,
  OMR_TEMPLATE_PRESETS.a4_100,
];

export function toBanglaDigits(value: string | number): string {
  const map: Record<string, string> = {
    '0': '০',
    '1': '১',
    '2': '২',
    '3': '৩',
    '4': '৪',
    '5': '৫',
    '6': '৬',
    '7': '৭',
    '8': '৮',
    '9': '৯',
  };
  return String(value).replace(/[0-9]/g, (d) => map[d] || d);
}

export function toAsciiDigits(value: string | number): string {
  const map: Record<string, string> = {
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
  return String(value).replace(/[০-৯]/g, (d) => map[d] || d);
}

/**
 * Parses Bangla or English numeric input and clamps to [10, 100].
 */
export function clampOmrQuestionCount(raw: string | number | undefined | null, fallback = 30): number {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const ascii = toAsciiDigits(String(raw)).replace(/[^\d]/g, '');
  if (!ascii) return fallback;
  const n = parseInt(ascii, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(OMR_MIN_QUESTIONS, Math.min(OMR_MAX_QUESTIONS, n));
}

export function recommendTemplateForMcqCount(mcqCount: number): OmrTemplateId {
  if (mcqCount === 25) return 'a5_25';
  if (mcqCount === 30) return 'a5_30';
  if (mcqCount === 40) return 'a5_40';
  if (mcqCount === 50) return 'a5_50';
  if (mcqCount === 100) return 'a4_100';
  return 'custom';
}

/**
 * Computes balanced column distribution for any custom question count (10..100).
 */
export function computeDynamicMcqColumns(questionCount: number): {
  columns: number;
  rowsPerColumn: number[];
} {
  const count = clampOmrQuestionCount(questionCount, 30);
  const columns = count <= 40 ? 2 : count <= 65 ? 3 : 4;
  const baseRows = Math.floor(count / columns);
  const remainder = count % columns;
  const rowsPerColumn: number[] = [];
  for (let c = 0; c < columns; c++) {
    rowsPerColumn.push(baseRows + (c < remainder ? 1 : 0));
  }
  return { columns, rowsPerColumn };
}

/**
 * Resolve exact millimeter & normalized fiducial-relative coordinates
 * for ANY custom questionCount (10..100) and ANY paperFormat (legal_half / a5 / a4).
 */
export function getOmrTemplateLayout(config: OmrLayoutConfig): OmrResolvedLayout {
  const presetFromId =
    config.templateId && config.templateId !== 'custom'
      ? OMR_TEMPLATE_PRESETS[config.templateId]
      : undefined;

  const questionCount = clampOmrQuestionCount(
    config.questionCount ?? presetFromId?.questionCount ?? 30,
    30,
  );

  const paperFormat: OmrPaperFormat =
    config.paperFormat ||
    (config.templateId === 'a4_100' ? 'a4' : 'legal_half');

  const pageWidthMm =
    paperFormat === 'a4' ? 210 : paperFormat === 'a5' ? 148 : LEGAL_HALF_WIDTH_MM;
  const pageHeightMm =
    paperFormat === 'a4' ? 297 : paperFormat === 'a5' ? 210 : LEGAL_LANDSCAPE_HEIGHT_MM;
  const pageSize: 'LEGAL_HALF' | 'A5' | 'A4' =
    paperFormat === 'a4' ? 'A4' : paperFormat === 'a5' ? 'A5' : 'LEGAL_HALF';

  const isA4 = paperFormat === 'a4';
  const isA5 = paperFormat === 'a5';
  const fiducialInsetMm = isA4 ? 8.5 : 7.0;
  const fiducialSizeMm = isA4 ? 4.5 : 4.0;

  const defaultRollDigits = isA4 ? 4 : 3;
  const rollDigits = Math.max(2, Math.min(6, Math.round(config.rollDigits ?? defaultRollDigits)));
  const optionStyle: OmrOptionStyle = config.optionStyle === 'en' ? 'en' : 'bn';
  const setCount: 1 | 4 = config.setCount === 1 ? 1 : 4;
  const optionLabels = OMR_OPTION_LABELS[optionStyle];
  const setLabels = setCount === 4 ? [...OMR_SET_LABELS[optionStyle]] : [];

  const fiducials = {
    tl: { id: 'tl' as const, xMm: fiducialInsetMm, yMm: fiducialInsetMm, sizeMm: fiducialSizeMm },
    tr: { id: 'tr' as const, xMm: pageWidthMm - fiducialInsetMm, yMm: fiducialInsetMm, sizeMm: fiducialSizeMm },
    br: { id: 'br' as const, xMm: pageWidthMm - fiducialInsetMm, yMm: pageHeightMm - fiducialInsetMm, sizeMm: fiducialSizeMm },
    bl: { id: 'bl' as const, xMm: fiducialInsetMm, yMm: pageHeightMm - fiducialInsetMm, sizeMm: fiducialSizeMm },
  };

  const spanWidthMm = fiducials.tr.xMm - fiducials.tl.xMm;
  const spanHeightMm = fiducials.bl.yMm - fiducials.tl.yMm;

  const canonicalWidthPx = isA4 ? 1120 : isA5 ? 960 : 1060;
  const canonicalHeightPx = Math.round((canonicalWidthPx * spanHeightMm) / spanWidthMm);

  const makeBubble = (xMm: number, yMm: number, rMm: number, label: string): OmrBubbleCoord => ({
    xMm,
    yMm,
    rMm,
    u: (xMm - fiducials.tl.xMm) / spanWidthMm,
    v: (yMm - fiducials.tl.yMm) / spanHeightMm,
    rU: rMm / spanWidthMm,
    rV: rMm / spanHeightMm,
    label,
  });

  // ── 1. HEADER BOX ────────────────────────────────────────────────────────
  const marginX = isA4 ? 14.0 : isA5 ? 11.0 : 11.2;
  const innerW = pageWidthMm - marginX * 2;
  const headerBox: OmrResolvedBox = isA4
    ? { xMm: marginX, yMm: 13.5, widthMm: innerW, heightMm: 24.5 }
    : isA5
      ? { xMm: marginX, yMm: 10.5, widthMm: innerW, heightMm: 19.0 }
      : { xMm: marginX, yMm: 10.5, widthMm: innerW, heightMm: 19.5 };

  // ── 2. TOP IDENTITY BAND: ROLL + 3-DIGIT SUBJECT CODE + CLASS/GROUP/SET + INFO ──
  const idY = isA4 ? 40.5 : isA5 ? 31.2 : 31.8;
  const idH = isA4 ? 65.0 : isA5 ? 53.5 : 55.5;
  const idGap = isA4 ? 2.6 : isA5 ? 1.5 : 2.0;

  // 2a. Roll Grid (2..6 digits) — larger, clearer bubbles
  const rollColPitch = isA4
    ? rollDigits >= 5
      ? 6.3
      : 7.2
    : isA5
      ? rollDigits >= 5
        ? 4.35
        : 5.0
      : rollDigits >= 5
        ? 5.35
        : 6.15;
  const rollR = isA4 ? 1.92 : isA5 ? 1.46 : rollDigits >= 5 ? 1.54 : 1.68;
  const rollRowPitch = isA4 ? 4.95 : isA5 ? 4.1 : 4.22;
  const rollRowStartY = idY + (isA4 ? 16.2 : isA5 ? 13.2 : 14.0);
  const rollBoxW = Math.max(
    isA4 ? 29.0 : isA5 ? 20.5 : 24.5,
    (rollDigits - 1) * rollColPitch + (isA4 ? 10.2 : isA5 ? 7.2 : 9.0),
  );

  const rollBox: OmrResolvedDigitGridBox = {
    xMm: marginX,
    yMm: idY,
    widthMm: rollBoxW,
    heightMm: idH,
    colPitchMm: rollColPitch,
    firstColXMm: marginX + (rollBoxW - (rollDigits - 1) * rollColPitch) / 2,
    writeBoxYMm: idY + (isA4 ? 5.8 : isA5 ? 4.8 : 5.1),
  };

  const rollBubbles: OmrBubbleCoord[][] = [];
  for (let dCol = 0; dCol < rollDigits; dCol++) {
    const colArr: OmrBubbleCoord[] = [];
    const cx = rollBox.firstColXMm + dCol * rollColPitch;
    for (let digit = 0; digit <= 9; digit++) {
      const cy = rollRowStartY + digit * rollRowPitch;
      const lbl = optionStyle === 'bn' ? toBanglaDigits(digit) : String(digit);
      colArr.push(makeBubble(cx, cy, rollR, lbl));
    }
    rollBubbles.push(colArr);
  }

  // 2b. 3-Digit Subject Code Grid (000..999)
  const subColPitch = isA4 ? 7.1 : isA5 ? 5.0 : 6.15;
  const subR = isA4 ? 1.92 : isA5 ? 1.46 : 1.68;
  const subBoxW = isA4 ? 28.0 : isA5 ? 20.2 : 24.5;
  const subX = rollBox.xMm + rollBox.widthMm + idGap;

  const subjectCodeBox: OmrResolvedDigitGridBox = {
    xMm: subX,
    yMm: idY,
    widthMm: subBoxW,
    heightMm: idH,
    colPitchMm: subColPitch,
    firstColXMm: subX + (subBoxW - 2 * subColPitch) / 2,
    writeBoxYMm: rollBox.writeBoxYMm,
  };

  const subjectCodeBubbles: OmrBubbleCoord[][] = [];
  for (let sCol = 0; sCol < 3; sCol++) {
    const colArr: OmrBubbleCoord[] = [];
    const cx = subjectCodeBox.firstColXMm + sCol * subColPitch;
    for (let digit = 0; digit <= 9; digit++) {
      const cy = rollRowStartY + digit * rollRowPitch;
      const lbl = optionStyle === 'bn' ? toBanglaDigits(digit) : String(digit);
      colArr.push(makeBubble(cx, cy, subR, lbl));
    }
    subjectCodeBubbles.push(colArr);
  }

  // 2c. Class (6th-10th) + Department/Group + Set Code vertical stack
  const stackX = subjectCodeBox.xMm + subjectCodeBox.widthMm + idGap;
  const stackW = isA4 ? 54.0 : isA5 ? 37.5 : 46.0;
  const stackGapY = isA4 ? 1.8 : 1.2;
  const subBoxH = (idH - stackGapY * 2) / 3;

  const gradeBox: OmrResolvedBox = {
    xMm: stackX,
    yMm: idY,
    widthMm: stackW,
    heightMm: subBoxH,
  };
  const groupBox: OmrResolvedBox = {
    xMm: stackX,
    yMm: idY + subBoxH + stackGapY,
    widthMm: stackW,
    heightMm: subBoxH,
  };
  const setBox: OmrResolvedBox = {
    xMm: stackX,
    yMm: idY + (subBoxH + stackGapY) * 2,
    widthMm: stackW,
    heightMm: subBoxH,
  };

  const metaBubbleR = isA4 ? 2.1 : isA5 ? 1.56 : 1.84;
  const gradePitch = isA4 ? 9.4 : isA5 ? 6.5 : 8.0;
  const gradeStartX = gradeBox.xMm + (gradeBox.widthMm - 4 * gradePitch) / 2;
  const gradeY = gradeBox.yMm + subBoxH * 0.69;

  const gradeBubbles: OmrBubbleCoord[] = OMR_GRADE_OPTIONS.map((g, idx) =>
    makeBubble(
      gradeStartX + idx * gradePitch,
      gradeY,
      metaBubbleR,
      optionStyle === 'bn' ? g.shortBn : g.shortEn,
    ),
  );

  const groupPitch = isA4 ? 11.8 : isA5 ? 8.1 : 10.0;
  const groupStartX = groupBox.xMm + (groupBox.widthMm - 3 * groupPitch) / 2;
  const groupY = groupBox.yMm + subBoxH * 0.69;

  const groupBubbles: OmrBubbleCoord[] = OMR_GROUP_OPTIONS.map((grp, idx) =>
    makeBubble(
      groupStartX + idx * groupPitch,
      groupY,
      metaBubbleR,
      optionStyle === 'bn' ? grp.shortBn : grp.shortEn,
    ),
  );

  const setBubbles: OmrBubbleCoord[] = [];
  if (setCount === 4) {
    const setPitch = groupPitch;
    const setStartX = setBox.xMm + (setBox.widthMm - 3 * setPitch) / 2;
    const setY = setBox.yMm + subBoxH * 0.66;
    for (let i = 0; i < 4; i++) {
      setBubbles.push(makeBubble(setStartX + i * setPitch, setY, metaBubbleR + 0.08, setLabels[i]));
    }
  }

  // 2d. Student Info & Score Box (far right)
  const infoX = stackX + stackW + idGap;
  const infoW = Math.max(24, marginX + innerW - infoX);
  const infoBox: OmrResolvedBox = {
    xMm: infoX,
    yMm: idY,
    widthMm: infoW,
    heightMm: idH,
  };

  // ── 3. DYNAMIC MCQ ANSWER BAND (OPTIMIZED FOR 10..30 + SUPPORTS UP TO 100) ──
  const mcqTopY = idY + idH + (isA4 ? 4.2 : 2.5);
  // Reserve clean bottom footer space (13.5mm) for official filling guide & signatures
  const footerReserveMm = isA4 ? 18.0 : isA5 ? 13.0 : 14.0;
  const mcqMaxBottomY = fiducials.bl.yMm - (isA4 ? 6.5 : 5.0) - footerReserveMm;
  const maxAvailableMcqH = mcqMaxBottomY - mcqTopY;

  const { columns: colCount, rowsPerColumn } = computeDynamicMcqColumns(questionCount);
  const maxRows = Math.max(...rowsPerColumn, 1);

  const colGap = isA4
    ? colCount === 4
      ? 3.2
      : 5.5
    : isA5
      ? colCount === 4
        ? 1.8
        : colCount === 3
          ? 2.4
          : 4.5
      : colCount === 4
        ? 2.2
        : colCount === 3
          ? 3.2
          : 5.4;

  const colWidth = (innerW - colGap * (colCount - 1)) / colCount;
  const colHeaderH = isA4 ? 7.4 : isA5 ? 5.8 : 6.4;
  const usableRowsH = maxAvailableMcqH - colHeaderH - 2.0;

  // Comfortable, generous row pitch so 10-30 MCQs look bold, airy & well-proportioned
  const maxRowPitchCap = isA4 ? 9.6 : isA5 ? 8.2 : 8.6;
  const rowPitchMm = Math.min(maxRowPitchCap, usableRowsH / maxRows);

  // Full-width symmetric distribution inside each column (eliminates awkward side gaps!)
  let qNumWidthMm: number;
  let optionPitchMm: number;
  if (colCount === 2) {
    // 10..40 MCQs (including the core 15/20/25/30 range): wide bold board-style layout
    qNumWidthMm = isA4 ? 19.0 : isA5 ? 14.5 : 17.5;
    const optZoneW = colWidth - qNumWidthMm;
    optionPitchMm = (optZoneW - (isA4 ? 12.0 : isA5 ? 8.5 : 10.5)) / 3;
  } else if (colCount === 3) {
    qNumWidthMm = isA4 ? 12.5 : isA5 ? 8.2 : 9.8;
    const optZoneW = colWidth - qNumWidthMm;
    optionPitchMm = (optZoneW - (isA4 ? 8.0 : isA5 ? 5.6 : 7.0)) / 3;
  } else {
    qNumWidthMm = isA4 ? 10.2 : isA5 ? 6.4 : 8.0;
    const optZoneW = colWidth - qNumWidthMm;
    optionPitchMm = (optZoneW - (isA4 ? 6.5 : isA5 ? 4.4 : 5.6)) / 3;
  }

  // Generous, crisp bubble radius: ~2.40–2.58mm on Legal Half (4.8–5.16mm diameter!) for 10..30 MCQ
  const maxRFromRow = rowPitchMm / 2.52;
  const maxRFromOpt = optionPitchMm / 2.6;
  const maxRCap =
    colCount === 2
      ? isA4
        ? 2.7
        : isA5
          ? 2.25
          : 2.52
      : colCount === 3
        ? isA4
          ? 2.25
          : isA5
            ? 1.72
            : 1.95
        : isA4
          ? 2.0
          : isA5
            ? 1.42
            : 1.62;
  const bubbleRMm = Number(Math.max(1.22, Math.min(maxRCap, maxRFromRow, maxRFromOpt)).toFixed(3));

  // Hug the actual rows tightly so there is ZERO awkward empty bottom box for 15/20/25 MCQ!
  const actualMcqH = Number((colHeaderH + maxRows * rowPitchMm + 2.2).toFixed(2));
  const mcqBandBox: OmrResolvedBox = {
    xMm: marginX,
    yMm: mcqTopY,
    widthMm: innerW,
    heightMm: actualMcqH,
  };

  const questionBubbles: OmrBubbleCoord[][] = [];
  const questionColumns: OmrResolvedColumnBox[] = [];

  let qCursor = 1;
  for (let c = 0; c < colCount; c++) {
    const rowsInCol = rowsPerColumn[c] || 0;
    const colX = marginX + c * (colWidth + colGap);
    const firstRowYMm = mcqTopY + colHeaderH + 1.0 + rowPitchMm * 0.5;

    const totalOptsWidth = 3 * optionPitchMm;
    const optStartX = colX + qNumWidthMm + (colWidth - qNumWidthMm - totalOptsWidth) / 2;
    const optionXMm = [0, 1, 2, 3].map((i) => optStartX + i * optionPitchMm);
    const qNumXMm = colX + qNumWidthMm * 0.5;

    questionColumns.push({
      colIndex: c,
      xMm: colX,
      yMm: mcqTopY,
      widthMm: colWidth,
      heightMm: actualMcqH,
      startQ: qCursor,
      endQ: qCursor + rowsInCol - 1,
      rowPitchMm,
      firstRowYMm,
      optionXMm,
      qNumXMm,
    });

    for (let r = 0; r < rowsInCol; r++) {
      const cy = firstRowYMm + r * rowPitchMm;
      const rowBubbles: OmrBubbleCoord[] = optionXMm.map((cx, optIdx) =>
        makeBubble(cx, cy, bubbleRMm, optionLabels[optIdx]),
      );
      questionBubbles.push(rowBubbles);
      qCursor++;
    }
  }

  const resolvedId: OmrTemplateId = recommendTemplateForMcqCount(questionCount);

  return {
    preset: {
      id: resolvedId,
      nameBn: `${toBanglaDigits(questionCount)} প্রশ্ন (${pageSize === 'LEGAL_HALF' ? 'লিগাল ২-আপ' : pageSize})`,
      questionCount,
      pageSize,
      paperFormat,
      pageWidthMm,
      pageHeightMm,
      fiducialInsetMm,
      fiducialSizeMm,
      columns: colCount,
      rowsPerColumn,
      defaultRollDigits,
    },
    questionCount,
    paperFormat,
    rollDigits,
    subjectCodeDigits: 3,
    optionStyle,
    optionLabels,
    setCount,
    setLabels,
    fiducials,
    spanWidthMm,
    spanHeightMm,
    canonicalWidthPx,
    canonicalHeightPx,
    rollBubbles,
    rollBox,
    subjectCodeBubbles,
    subjectCodeBox,
    gradeBubbles,
    gradeBox,
    groupBubbles,
    groupBox,
    setBubbles,
    setBox,
    infoBox,
    questionBubbles,
    questionColumns,
    mcqBandBox,
    headerBox,
  };
}
