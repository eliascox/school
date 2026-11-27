/**
 * Pure Page Settings, Grid Auto-Fit, Duplex Back-Mirror Pagination & @page Print CSS Utilities
 * for `/dashboard/students/id-card` (Student ID Card Design & High-Res Print Studio).
 */

import type { IdCardOrientation, IdCardSideMode } from './idCardTemplateTypes';

export type IdCardPageSizeId = 'a4' | 'letter' | 'legal' | 'a3' | 'cr80_pvc' | 'custom';
export type IdCardPrintScope = 'all' | 'current' | 'range';
export type IdCardResolutionDpi = 300 | 600;

export interface IdCardPageSettings {
  pageSize: IdCardPageSizeId;
  customPageWidthMm: number;
  customPageHeightMm: number;
  pageOrientation: IdCardOrientation;
  cardOrientation: IdCardOrientation;
  /** Standard ISO CR80 portrait dimensions: 53.98mm x 85.6mm */
  cardWidthMm: number;
  cardHeightMm: number;
  marginTopMm: number;
  marginRightMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  gapXMm: number;
  gapYMm: number;
  bleedMm: number;
  showCropMarks: boolean;
  autoGrid: boolean;
  manualCols: number;
  manualRows: number;
  printScalePercent: number;
  dpi: IdCardResolutionDpi;
}

export interface PageSizePresetMeta {
  id: IdCardPageSizeId;
  labelBn: string;
  labelEn: string;
  widthMm: number;
  heightMm: number;
  noteBn: string;
}

export const PAGE_SIZE_PRESETS: Record<IdCardPageSizeId, PageSizePresetMeta> = {
  a4: {
    id: 'a4',
    labelBn: 'A4 শিট (210 × 297 mm)',
    labelEn: 'A4 Sheet (210 × 297 mm)',
    widthMm: 210,
    heightMm: 297,
    noteBn: 'স্ট্যান্ডার্ড প্রিন্ট শিট (প্রতি পেইজে সর্বোচ্চ ৯–১০টি কার্ড)',
  },
  letter: {
    id: 'letter',
    labelBn: 'Letter শিট (215.9 × 279.4 mm)',
    labelEn: 'US Letter (215.9 × 279.4 mm)',
    widthMm: 215.9,
    heightMm: 279.4,
    noteBn: 'US Letter পেপার ফরমেট',
  },
  legal: {
    id: 'legal',
    labelBn: 'Legal শিট (215.9 × 355.6 mm)',
    labelEn: 'Legal Sheet (215.9 × 355.6 mm)',
    widthMm: 215.9,
    heightMm: 355.6,
    noteBn: 'লম্বা লিগ্যাল পেপার (প্রতি পেইজে ১২টি পর্যন্ত কার্ড)',
  },
  a3: {
    id: 'a3',
    labelBn: 'A3 প্রেস শিট (297 × 420 mm)',
    labelEn: 'A3 Press Sheet (297 × 420 mm)',
    widthMm: 297,
    heightMm: 420,
    noteBn: 'বড় প্রিন্টিং প্রেস শিট (প্রতি পেইজে ২০+ কার্ড)',
  },
  cr80_pvc: {
    id: 'cr80_pvc',
    labelBn: 'CR80 সিঙ্গেল PVC প্রিন্টার',
    labelEn: 'CR80 Direct PVC Printer',
    widthMm: 53.98,
    heightMm: 85.6,
    noteBn: 'সরাসরি Evolis / Fargo / Zebra PVC কার্ড প্রিন্টার (১ কার্ড/পেইজ)',
  },
  custom: {
    id: 'custom',
    labelBn: 'কাস্টম পেইজ সাইজ (mm)',
    labelEn: 'Custom Page Size (mm)',
    widthMm: 210,
    heightMm: 297,
    noteBn: 'পছন্দমতো প্রস্থ ও উচ্চতা (মিলিমিটার)',
  },
};

export const DEFAULT_ID_CARD_PAGE_SETTINGS: IdCardPageSettings = {
  pageSize: 'a4',
  customPageWidthMm: 210,
  customPageHeightMm: 297,
  pageOrientation: 'portrait',
  cardOrientation: 'portrait',
  cardWidthMm: 53.98,
  cardHeightMm: 85.6,
  marginTopMm: 8,
  marginRightMm: 8,
  marginBottomMm: 8,
  marginLeftMm: 8,
  gapXMm: 4,
  gapYMm: 4,
  bleedMm: 1.5,
  showCropMarks: true,
  autoGrid: true,
  manualCols: 3,
  manualRows: 3,
  printScalePercent: 100,
  dpi: 300,
};

function clampNum(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, val));
}

export function roundMm(val: number): number {
  return Math.round(val * 100) / 100;
}

/**
 * Resolves single CR80 (or custom) card dimensions taking orientation & calibration scale into account.
 */
export function resolveCardDimensionsMm(settings: IdCardPageSettings): {
  widthMm: number;
  heightMm: number;
} {
  const shortSide = clampNum(Math.min(settings.cardWidthMm, settings.cardHeightMm), 35, 160);
  const longSide = clampNum(Math.max(settings.cardWidthMm, settings.cardHeightMm), 45, 220);
  const scale = clampNum(settings.printScalePercent || 100, 85, 115) / 100;
  if (settings.cardOrientation === 'landscape') {
    return {
      widthMm: roundMm(longSide * scale),
      heightMm: roundMm(shortSide * scale),
    };
  }
  return {
    widthMm: roundMm(shortSide * scale),
    heightMm: roundMm(longSide * scale),
  };
}

/**
 * Resolves physical sheet dimensions (mm) for the chosen page size & orientation.
 */
export function resolvePageDimensionsMm(settings: IdCardPageSettings): {
  widthMm: number;
  heightMm: number;
} {
  if (settings.pageSize === 'cr80_pvc') {
    return resolveCardDimensionsMm(settings);
  }
  const baseW =
    settings.pageSize === 'custom'
      ? clampNum(settings.customPageWidthMm, 60, 600)
      : PAGE_SIZE_PRESETS[settings.pageSize].widthMm;
  const baseH =
    settings.pageSize === 'custom'
      ? clampNum(settings.customPageHeightMm, 60, 800)
      : PAGE_SIZE_PRESETS[settings.pageSize].heightMm;

  const shortSide = Math.min(baseW, baseH);
  const longSide = Math.max(baseW, baseH);
  if (settings.pageOrientation === 'landscape') {
    return { widthMm: roundMm(longSide), heightMm: roundMm(shortSide) };
  }
  return { widthMm: roundMm(shortSide), heightMm: roundMm(longSide) };
}

export interface SheetGridMetrics {
  pageWidthMm: number;
  pageHeightMm: number;
  cardWidthMm: number;
  cardHeightMm: number;
  /** Width of one grid slot (for side-by-side pairs, this is 2 cards + innerPairGapMm) */
  slotWidthMm: number;
  slotHeightMm: number;
  innerPairGapMm: number;
  gapXMm: number;
  gapYMm: number;
  marginTopMm: number;
  marginRightMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  maxCols: number;
  maxRows: number;
  cols: number;
  rows: number;
  slotsPerPage: number;
  /** Centered start offsets inside the page so front & back sheets align cleanly */
  contentOriginXMm: number;
  contentOriginYMm: number;
  isSinglePvcMode: boolean;
}

export function computeSheetGridMetrics(
  settings: IdCardPageSettings,
  sideMode: IdCardSideMode,
): SheetGridMetrics {
  const page = resolvePageDimensionsMm(settings);
  const card = resolveCardDimensionsMm(settings);
  const isSinglePvcMode = settings.pageSize === 'cr80_pvc';

  if (isSinglePvcMode) {
    return {
      pageWidthMm: page.widthMm,
      pageHeightMm: page.heightMm,
      cardWidthMm: card.widthMm,
      cardHeightMm: card.heightMm,
      slotWidthMm: card.widthMm,
      slotHeightMm: card.heightMm,
      innerPairGapMm: 0,
      gapXMm: 0,
      gapYMm: 0,
      marginTopMm: 0,
      marginRightMm: 0,
      marginBottomMm: 0,
      marginLeftMm: 0,
      maxCols: 1,
      maxRows: 1,
      cols: 1,
      rows: 1,
      slotsPerPage: 1,
      contentOriginXMm: 0,
      contentOriginYMm: 0,
      isSinglePvcMode: true,
    };
  }

  const marginTopMm = clampNum(settings.marginTopMm, 0, 40);
  const marginRightMm = clampNum(settings.marginRightMm, 0, 40);
  const marginBottomMm = clampNum(settings.marginBottomMm, 0, 40);
  const marginLeftMm = clampNum(settings.marginLeftMm, 0, 40);
  const gapXMm = clampNum(settings.gapXMm, 0, 25);
  const gapYMm = clampNum(settings.gapYMm, 0, 25);
  const innerPairGapMm = sideMode === 'both_side_by_side' ? Math.max(1.5, Math.min(gapXMm, 3)) : 0;

  const slotWidthMm =
    sideMode === 'both_side_by_side' ? roundMm(card.widthMm * 2 + innerPairGapMm) : card.widthMm;
  const slotHeightMm = card.heightMm;

  const usableW = Math.max(1, page.widthMm - marginLeftMm - marginRightMm);
  const usableH = Math.max(1, page.heightMm - marginTopMm - marginBottomMm);

  const maxCols = Math.max(1, Math.floor((usableW + gapXMm + 0.05) / (slotWidthMm + gapXMm)));
  const maxRows = Math.max(1, Math.floor((usableH + gapYMm + 0.05) / (slotHeightMm + gapYMm)));

  const cols = settings.autoGrid ? maxCols : clampNum(Math.round(settings.manualCols), 1, maxCols);
  const rows = settings.autoGrid ? maxRows : clampNum(Math.round(settings.manualRows), 1, maxRows);

  const gridTotalW = cols * slotWidthMm + Math.max(0, cols - 1) * gapXMm;
  const gridTotalH = rows * slotHeightMm + Math.max(0, rows - 1) * gapYMm;

  const extraX = Math.max(0, usableW - gridTotalW);
  const extraY = Math.max(0, usableH - gridTotalH);

  return {
    pageWidthMm: page.widthMm,
    pageHeightMm: page.heightMm,
    cardWidthMm: card.widthMm,
    cardHeightMm: card.heightMm,
    slotWidthMm,
    slotHeightMm,
    innerPairGapMm,
    gapXMm,
    gapYMm,
    marginTopMm,
    marginRightMm,
    marginBottomMm,
    marginLeftMm,
    maxCols,
    maxRows,
    cols,
    rows,
    slotsPerPage: cols * rows,
    contentOriginXMm: roundMm(marginLeftMm + extraX / 2),
    contentOriginYMm: roundMm(marginTopMm + extraY / 2),
    isSinglePvcMode: false,
  };
}

export interface IdCardSheetSlot<T> {
  row: number;
  col: number;
  xMm: number;
  yMm: number;
  student: T | null;
  side: 'front' | 'back' | 'pair';
}

export interface IdCardPrintSheetPage<T> {
  /** 1-based page number */
  pageNumber: number;
  pageKind: 'front' | 'back' | 'pair' | 'back_mirrored';
  labelBn: string;
  labelEn: string;
  slots: IdCardSheetSlot<T>[];
}

/**
 * Paginates students into exact print pages with coordinates (mm).
 * In `duplex_mirrored` mode, every Front page is followed immediately by a horizontally
 * row-mirrored Back page so duplex printers align fronts & backs millimeter-perfectly!
 */
export function paginateStudentsForPrint<T>(
  students: T[],
  settings: IdCardPageSettings,
  sideMode: IdCardSideMode,
): {
  metrics: SheetGridMetrics;
  pages: IdCardPrintSheetPage<T>[];
} {
  const metrics = computeSheetGridMetrics(settings, sideMode);
  const pages: IdCardPrintSheetPage<T>[] = [];
  if (students.length === 0) {
    return { metrics, pages };
  }

  // Direct CR80 PVC Printer Mode: 1 card face per page
  if (metrics.isSinglePvcMode) {
    let pageCounter = 1;
    for (const st of students) {
      if (sideMode === 'front' || sideMode === 'both_side_by_side' || sideMode === 'duplex_mirrored') {
        pages.push({
          pageNumber: pageCounter++,
          pageKind: 'front',
          labelBn: 'PVC সামনের দিক',
          labelEn: 'PVC Front Side',
          slots: [{ row: 0, col: 0, xMm: 0, yMm: 0, student: st, side: 'front' }],
        });
      }
      if (sideMode === 'back' || sideMode === 'both_side_by_side' || sideMode === 'duplex_mirrored') {
        pages.push({
          pageNumber: pageCounter++,
          pageKind: 'back',
          labelBn: 'PVC পেছনের দিক',
          labelEn: 'PVC Back Side',
          slots: [{ row: 0, col: 0, xMm: 0, yMm: 0, student: st, side: 'back' }],
        });
      }
    }
    return { metrics, pages };
  }

  const perPage = metrics.slotsPerPage;
  let pageCounter = 1;

  for (let start = 0; start < students.length; start += perPage) {
    const chunk = students.slice(start, start + perPage);

    if (sideMode === 'duplex_mirrored') {
      // 1. Front page (left -> right)
      const frontSlots: IdCardSheetSlot<T>[] = [];
      for (let i = 0; i < chunk.length; i++) {
        const row = Math.floor(i / metrics.cols);
        const col = i % metrics.cols;
        frontSlots.push({
          row,
          col,
          xMm: roundMm(metrics.contentOriginXMm + col * (metrics.slotWidthMm + metrics.gapXMm)),
          yMm: roundMm(metrics.contentOriginYMm + row * (metrics.slotHeightMm + metrics.gapYMm)),
          student: chunk[i],
          side: 'front',
        });
      }
      pages.push({
        pageNumber: pageCounter++,
        pageKind: 'front',
        labelBn: 'ডুপ্লেক্স — সামনের দিক',
        labelEn: 'Duplex — Front Sheet',
        slots: frontSlots,
      });

      // 2. Mirrored Back page (horizontally reversed per row so flipping paper aligns 1-to-1!)
      const backSlots: IdCardSheetSlot<T>[] = [];
      const usedRows = Math.ceil(chunk.length / metrics.cols);
      for (let row = 0; row < usedRows; row++) {
        for (let col = 0; col < metrics.cols; col++) {
          const mirroredSrcCol = metrics.cols - 1 - col;
          const srcIndex = row * metrics.cols + mirroredSrcCol;
          const student = srcIndex < chunk.length ? chunk[srcIndex] : null;
          backSlots.push({
            row,
            col,
            xMm: roundMm(metrics.contentOriginXMm + col * (metrics.slotWidthMm + metrics.gapXMm)),
            yMm: roundMm(metrics.contentOriginYMm + row * (metrics.slotHeightMm + metrics.gapYMm)),
            student,
            side: 'back',
          });
        }
      }
      pages.push({
        pageNumber: pageCounter++,
        pageKind: 'back_mirrored',
        labelBn: 'ডুপ্লেক্স — পেছনের দিক (মিরর)',
        labelEn: 'Duplex — Back Sheet (Mirrored)',
        slots: backSlots,
      });
    } else {
      const slotSide: 'front' | 'back' | 'pair' =
        sideMode === 'both_side_by_side' ? 'pair' : sideMode === 'back' ? 'back' : 'front';
      const slots: IdCardSheetSlot<T>[] = [];
      for (let i = 0; i < chunk.length; i++) {
        const row = Math.floor(i / metrics.cols);
        const col = i % metrics.cols;
        slots.push({
          row,
          col,
          xMm: roundMm(metrics.contentOriginXMm + col * (metrics.slotWidthMm + metrics.gapXMm)),
          yMm: roundMm(metrics.contentOriginYMm + row * (metrics.slotHeightMm + metrics.gapYMm)),
          student: chunk[i],
          side: slotSide,
        });
      }
      pages.push({
        pageNumber: pageCounter++,
        pageKind: slotSide,
        labelBn:
          slotSide === 'pair'
            ? 'সামনে ও পেছনে পাশাপাশি'
            : slotSide === 'back'
              ? 'পেছনের দিক শিট'
              : 'সামনের দিক শিট',
        labelEn:
          slotSide === 'pair'
            ? 'Front & Back Side-by-Side'
            : slotSide === 'back'
              ? 'Back Side Sheet'
              : 'Front Side Sheet',
        slots,
      });
    }
  }

  return { metrics, pages };
}

/**
 * Parses a page range string like "1, 3-5, 8" into sorted unique 1-based page numbers within [1..totalPages].
 */
export function parsePageRangeExpression(expr: string, totalPages: number): number[] {
  if (totalPages <= 0) return [];
  const bnToAscii = String(expr || '').replace(/[০-৯]/g, (d) =>
    String('০১২৩৪৫৬৭৮৯'.indexOf(d)),
  );
  const picked = new Set<number>();
  const tokens = bnToAscii
    .split(/[,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  for (const token of tokens) {
    const rangeMatch = token.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
    if (rangeMatch) {
      const a = parseInt(rangeMatch[1], 10);
      const b = parseInt(rangeMatch[2], 10);
      const lo = Math.max(1, Math.min(a, b));
      const hi = Math.min(totalPages, Math.max(a, b));
      for (let p = lo; p <= hi; p++) {
        picked.add(p);
      }
      continue;
    }
    const single = parseInt(token, 10);
    if (Number.isFinite(single) && single >= 1 && single <= totalPages) {
      picked.add(single);
    }
  }

  return Array.from(picked).sort((a, b) => a - b);
}

export function resolveTargetPageNumbers(
  scope: IdCardPrintScope,
  currentPage: number,
  rangeExpr: string,
  totalPages: number,
): number[] {
  if (totalPages <= 0) return [];
  if (scope === 'current') {
    const clamped = Math.max(1, Math.min(totalPages, currentPage));
    return [clamped];
  }
  if (scope === 'range') {
    const parsed = parsePageRangeExpression(rangeExpr, totalPages);
    return parsed.length > 0 ? parsed : [Math.max(1, Math.min(totalPages, currentPage))];
  }
  return Array.from({ length: totalPages }, (_, i) => i + 1);
}

/**
 * Generates exact @media print CSS for millimeter-accurate multi-page printing.
 */
export function buildIdCardPrintCss(settings: IdCardPageSettings): string {
  const { widthMm, heightMm } = resolvePageDimensionsMm(settings);
  return `
    @media print {
      @page {
        size: ${widthMm}mm ${heightMm}mm;
        margin: 0 !important;
      }
      html, body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .id-card-print-sheet {
        width: ${widthMm}mm !important;
        height: ${heightMm}mm !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        transform: none !important;
        break-after: page !important;
        page-break-after: always !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        overflow: hidden !important;
      }
      .id-card-print-sheet:last-of-type {
        break-after: auto !important;
        page-break-after: auto !important;
      }
    }
  `;
}

export function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi);
}
