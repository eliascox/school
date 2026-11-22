/**
 * Single-Source-of-Truth Exact-Millimeter OMR Sheet Template Geometry
 *
 * Both the printable vector SVG generator (`omrSheetSvg.ts`) and the
 * perspective-corrected computer-vision scanner (`omrVisionEngine.ts`)
 * read bubble coordinates from this file so printed sheets and scanned
 * coordinates match to sub-millimeter precision.
 */

export type OmrTemplateId = 'a5_25' | 'a5_30' | 'a5_40' | 'a5_50' | 'a4_100';
export type OmrOptionStyle = 'bn' | 'en';
export type OmrColorTheme = 'pink' | 'bw';
export type OmrPrintLayout = 'a5_single' | 'a4_2up' | 'a4_single';

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
  id: OmrTemplateId;
  nameBn: string;
  nameEn: string;
  questionCount: number;
  pageSize: 'A5' | 'A4';
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
  templateId: OmrTemplateId;
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

export interface OmrResolvedLayout {
  preset: OmrTemplatePreset;
  rollDigits: number;
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
  rollBox: { xMm: number; yMm: number; widthMm: number; heightMm: number; colPitchMm: number; firstColXMm: number; writeBoxYMm: number };
  /** setBubbles[0..3] (empty if setCount === 1) */
  setBubbles: OmrBubbleCoord[];
  setBox: { xMm: number; yMm: number; widthMm: number; heightMm: number };
  infoBox: { xMm: number; yMm: number; widthMm: number; heightMm: number };
  /** questionBubbles[qIndex 0..N-1][option 0..3] */
  questionBubbles: OmrBubbleCoord[][];
  questionColumns: OmrResolvedColumnBox[];
  mcqBandBox: { xMm: number; yMm: number; widthMm: number; heightMm: number };
  headerBox: { xMm: number; yMm: number; widthMm: number; heightMm: number };
}

export const OMR_OPTION_LABELS: Record<OmrOptionStyle, [string, string, string, string]> = {
  bn: ['ক', 'খ', 'গ', 'ঘ'],
  en: ['A', 'B', 'C', 'D'],
};

export const OMR_SET_LABELS: Record<OmrOptionStyle, [string, string, string, string]> = {
  bn: ['ক', 'খ', 'গ', 'ঘ'],
  en: ['A', 'B', 'C', 'D'],
};

export const OMR_TEMPLATE_PRESETS: Record<OmrTemplateId, OmrTemplatePreset> = {
  a5_25: {
    id: 'a5_25',
    nameBn: '২৫ প্রশ্ন (A5 / ২-আপ A4)',
    nameEn: '25 MCQ (A5 / 2-up A4)',
    questionCount: 25,
    pageSize: 'A5',
    pageWidthMm: 148,
    pageHeightMm: 210,
    fiducialInsetMm: 7.0,
    fiducialSizeMm: 4.0,
    columns: 2,
    rowsPerColumn: [13, 12],
    defaultRollDigits: 3,
    recommendedForBn: 'পদার্থ, রসায়ন, জীববিজ্ঞান, আইসিটি, কৃষি (২৫ MCQ)',
  },
  a5_30: {
    id: 'a5_30',
    nameBn: '৩০ প্রশ্ন (A5 / ২-আপ A4)',
    nameEn: '30 MCQ (A5 / 2-up A4)',
    questionCount: 30,
    pageSize: 'A5',
    pageWidthMm: 148,
    pageHeightMm: 210,
    fiducialInsetMm: 7.0,
    fiducialSizeMm: 4.0,
    columns: 2,
    rowsPerColumn: [15, 15],
    defaultRollDigits: 3,
    recommendedForBn: 'বাংলা, গণিত, বিজ্ঞান, সমাজ, ইসলাম, হিসাববিজ্ঞান (৩০ MCQ)',
  },
  a5_40: {
    id: 'a5_40',
    nameBn: '৪০ প্রশ্ন (A5 / ২-আপ A4)',
    nameEn: '40 MCQ (A5 / 2-up A4)',
    questionCount: 40,
    pageSize: 'A5',
    pageWidthMm: 148,
    pageHeightMm: 210,
    fiducialInsetMm: 7.0,
    fiducialSizeMm: 4.0,
    columns: 2,
    rowsPerColumn: [20, 20],
    defaultRollDigits: 3,
    recommendedForBn: 'ক্লাস টেস্ট ও সাপ্তাহিক মূল্যায়ন (৪০ MCQ)',
  },
  a5_50: {
    id: 'a5_50',
    nameBn: '৫০ প্রশ্ন (A5 / ২-আপ A4)',
    nameEn: '50 MCQ (A5 / 2-up A4)',
    questionCount: 50,
    pageSize: 'A5',
    pageWidthMm: 148,
    pageHeightMm: 210,
    fiducialInsetMm: 7.0,
    fiducialSizeMm: 4.0,
    columns: 3,
    rowsPerColumn: [17, 17, 16],
    defaultRollDigits: 3,
    recommendedForBn: 'মডেল টেস্ট ও বৃত্তি পরীক্ষা (৫০ MCQ)',
  },
  a4_100: {
    id: 'a4_100',
    nameBn: '১০০ প্রশ্ন (A4 পূর্ণ শিট)',
    nameEn: '100 MCQ (Full A4 Sheet)',
    questionCount: 100,
    pageSize: 'A4',
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

export function recommendTemplateForMcqCount(mcqCount: number): OmrTemplateId {
  if (mcqCount <= 25) return 'a5_25';
  if (mcqCount <= 30) return 'a5_30';
  if (mcqCount <= 40) return 'a5_40';
  if (mcqCount <= 50) return 'a5_50';
  return 'a4_100';
}

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
 * Resolve exact millimeter & normalized fiducial-relative coordinates
 * for any OMR template configuration.
 */
export function getOmrTemplateLayout(config: OmrLayoutConfig): OmrResolvedLayout {
  const preset = OMR_TEMPLATE_PRESETS[config.templateId] || OMR_TEMPLATE_PRESETS.a5_30;
  const rollDigits = Math.max(2, Math.min(6, Math.round(config.rollDigits ?? preset.defaultRollDigits)));
  const optionStyle: OmrOptionStyle = config.optionStyle === 'en' ? 'en' : 'bn';
  const setCount: 1 | 4 = config.setCount === 1 ? 1 : 4;
  const optionLabels = OMR_OPTION_LABELS[optionStyle];
  const setLabels = setCount === 4 ? [...OMR_SET_LABELS[optionStyle]] : [];

  const W = preset.pageWidthMm;
  const H = preset.pageHeightMm;
  const inset = preset.fiducialInsetMm;
  const fSize = preset.fiducialSizeMm;

  const fiducials = {
    tl: { id: 'tl' as const, xMm: inset, yMm: inset, sizeMm: fSize },
    tr: { id: 'tr' as const, xMm: W - inset, yMm: inset, sizeMm: fSize },
    br: { id: 'br' as const, xMm: W - inset, yMm: H - inset, sizeMm: fSize },
    bl: { id: 'bl' as const, xMm: inset, yMm: H - inset, sizeMm: fSize },
  };

  const spanWidthMm = fiducials.tr.xMm - fiducials.tl.xMm;
  const spanHeightMm = fiducials.bl.yMm - fiducials.tl.yMm;

  const canonicalWidthPx = preset.pageSize === 'A4' ? 1100 : 960;
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

  const isA4 = preset.pageSize === 'A4';

  // Header & top identity section dimensions
  const marginX = isA4 ? 14 : 11.5;
  const innerW = W - marginX * 2;
  const headerBox = isA4
    ? { xMm: marginX, yMm: 13.5, widthMm: innerW, heightMm: 26 }
    : { xMm: marginX, yMm: 11.0, widthMm: innerW, heightMm: 22 };

  // Roll Number Grid (left)
  const rollY = isA4 ? 42.5 : 35.0;
  const rollH = isA4 ? 63.0 : 54.0;
  const rollColPitch = isA4 ? 7.6 : 6.4;
  const rollPadX = isA4 ? 5.5 : 4.6;
  const rollBoxW = Math.max(isA4 ? 42 : 34, rollPadX * 2 + (rollDigits - 1) * rollColPitch + 5.2);
  const rollBox = {
    xMm: marginX,
    yMm: rollY,
    widthMm: rollBoxW,
    heightMm: rollH,
    colPitchMm: rollColPitch,
    firstColXMm: marginX + (rollBoxW - (rollDigits - 1) * rollColPitch) / 2,
    writeBoxYMm: rollY + (isA4 ? 6.2 : 5.2),
  };

  const rollRowStartY = rollY + (isA4 ? 15.6 : 13.6);
  const rollRowPitch = isA4 ? 4.9 : 4.15;
  const rollRadius = isA4 ? 1.9 : 1.6;

  const rollBubbles: OmrBubbleCoord[][] = [];
  for (let dCol = 0; dCol < rollDigits; dCol++) {
    const colBubbles: OmrBubbleCoord[] = [];
    const cx = rollBox.firstColXMm + dCol * rollColPitch;
    for (let digit = 0; digit <= 9; digit++) {
      const cy = rollRowStartY + digit * rollRowPitch;
      const lbl = optionStyle === 'bn' ? toBanglaDigits(digit) : String(digit);
      colBubbles.push(makeBubble(cx, cy, rollRadius, lbl));
    }
    rollBubbles.push(colBubbles);
  }

  // Set Code Box (middle-top) & Info Box (right)
  const gapMid = isA4 ? 3.5 : 2.5;
  const afterRollX = rollBox.xMm + rollBox.widthMm + gapMid;
  const remainingW = marginX + innerW - afterRollX;

  const setBoxW = setCount === 4 ? (isA4 ? 48 : 35) : 0;
  const setBoxH = isA4 ? 22 : 18.5;
  const setBox = {
    xMm: afterRollX,
    yMm: rollY,
    widthMm: setBoxW,
    heightMm: setBoxH,
  };

  const setBubbles: OmrBubbleCoord[] = [];
  if (setCount === 4) {
    const setPitch = isA4 ? 9.8 : 7.4;
    const setStartX = setBox.xMm + (setBox.widthMm - 3 * setPitch) / 2;
    const setY = setBox.yMm + (isA4 ? 14.5 : 12.2);
    const setR = isA4 ? 2.1 : 1.75;
    for (let i = 0; i < 4; i++) {
      setBubbles.push(makeBubble(setStartX + i * setPitch, setY, setR, setLabels[i]));
    }
  }

  const infoX = setCount === 4 ? setBox.xMm + setBox.widthMm + gapMid : afterRollX;
  const infoW = setCount === 4 ? remainingW - setBoxW - gapMid : remainingW;
  const infoBox = {
    xMm: infoX,
    yMm: rollY,
    widthMm: Math.max(30, infoW),
    heightMm: rollH,
  };

  // MCQ Answer Band
  const mcqTopY = rollY + rollH + (isA4 ? 4.5 : 3.2);
  const mcqBottomY = fiducials.bl.yMm - (isA4 ? 6.5 : 5.2);
  const mcqH = mcqBottomY - mcqTopY;
  const mcqBandBox = {
    xMm: marginX,
    yMm: mcqTopY,
    widthMm: innerW,
    heightMm: mcqH,
  };

  const colCount = preset.columns;
  const colGap = isA4 ? 3.4 : colCount === 3 ? 2.6 : 4.5;
  const colWidth = (innerW - colGap * (colCount - 1)) / colCount;

  // Per-template fine-tuned row pitch, option pitch & bubble radius
  let rowPitchMm = 6.4;
  let optionPitchMm = 8.4;
  let bubbleRMm = 1.85;
  let qNumWidthMm = 11.5;

  if (preset.id === 'a5_25') {
    rowPitchMm = 7.1;
    optionPitchMm = 8.8;
    bubbleRMm = 1.9;
    qNumWidthMm = 11.5;
  } else if (preset.id === 'a5_30') {
    rowPitchMm = 6.25;
    optionPitchMm = 8.8;
    bubbleRMm = 1.85;
    qNumWidthMm = 11.5;
  } else if (preset.id === 'a5_40') {
    rowPitchMm = 4.82;
    optionPitchMm = 8.6;
    bubbleRMm = 1.7;
    qNumWidthMm = 11.5;
  } else if (preset.id === 'a5_50') {
    rowPitchMm = 5.6;
    optionPitchMm = 6.9;
    bubbleRMm = 1.65;
    qNumWidthMm = 9.0;
  } else if (preset.id === 'a4_100') {
    rowPitchMm = 6.45;
    optionPitchMm = 7.8;
    bubbleRMm = 1.95;
    qNumWidthMm = 10.5;
  }

  const questionBubbles: OmrBubbleCoord[][] = [];
  const questionColumns: OmrResolvedColumnBox[] = [];

  let qCursor = 1;
  const headerBandH = isA4 ? 7.2 : 6.0;

  for (let c = 0; c < colCount; c++) {
    const rowsInCol = preset.rowsPerColumn[c] || 0;
    const colX = marginX + c * (colWidth + colGap);
    const firstRowYMm = mcqTopY + headerBandH + rowPitchMm * 0.56;

    const totalOptsWidth = 3 * optionPitchMm;
    const optStartX = colX + qNumWidthMm + (colWidth - qNumWidthMm - totalOptsWidth) / 2;
    const optionXMm = [0, 1, 2, 3].map((i) => optStartX + i * optionPitchMm);
    const qNumXMm = colX + qNumWidthMm * 0.52;

    questionColumns.push({
      colIndex: c,
      xMm: colX,
      yMm: mcqTopY,
      widthMm: colWidth,
      heightMm: mcqH,
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

  return {
    preset,
    rollDigits,
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
    setBubbles,
    setBox,
    infoBox,
    questionBubbles,
    questionColumns,
    mcqBandBox,
    headerBox,
  };
}
