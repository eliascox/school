import { describe, it, expect } from 'vitest';
import {
  DEFAULT_ID_CARD_PAGE_SETTINGS,
  buildIdCardPrintCss,
  computeSheetGridMetrics,
  mmToPx,
  paginateStudentsForPrint,
  parsePageRangeExpression,
  resolvePageDimensionsMm,
  resolveTargetPageNumbers,
} from '@/lib/idCardLayoutUtils';
import {
  BUILT_IN_ID_CARD_TEMPLATES,
  createBlankCustomTemplate,
  getIdCardGradeLabel,
  getIdCardScopeLabel,
} from '@/lib/idCardTemplateTypes';
import {
  parseAndValidateTemplateJson,
  sanitizeTemplateConfig,
  serializeTemplateToJson,
} from '@/lib/idCardTemplateStorage';
import { composePdfFromJpegPages } from '@/lib/idCardHighResExporter';

describe('Student ID Card Studio — Page Math, Duplex Mirror, Custom Templates & Pure PDF 1.4', () => {
  it('resolves exact page sizes & orientations for A4, Legal, CR80 PVC, and Custom mm', () => {
    expect(resolvePageDimensionsMm(DEFAULT_ID_CARD_PAGE_SETTINGS)).toEqual({
      widthMm: 210,
      heightMm: 297,
    });
    expect(
      resolvePageDimensionsMm({
        ...DEFAULT_ID_CARD_PAGE_SETTINGS,
        pageOrientation: 'landscape',
      }),
    ).toEqual({ widthMm: 297, heightMm: 210 });

    expect(
      resolvePageDimensionsMm({
        ...DEFAULT_ID_CARD_PAGE_SETTINGS,
        pageSize: 'legal',
      }),
    ).toEqual({ widthMm: 215.9, heightMm: 355.6 });

    expect(
      resolvePageDimensionsMm({
        ...DEFAULT_ID_CARD_PAGE_SETTINGS,
        pageSize: 'cr80_pvc',
        cardOrientation: 'landscape',
      }),
    ).toEqual({ widthMm: 85.6, heightMm: 53.98 });

    expect(
      resolvePageDimensionsMm({
        ...DEFAULT_ID_CARD_PAGE_SETTINGS,
        pageSize: 'custom',
        customPageWidthMm: 250,
        customPageHeightMm: 340,
      }),
    ).toEqual({ widthMm: 250, heightMm: 340 });

    // High-Res 300/600 DPI pixel conversion
    expect(mmToPx(210, 300)).toBe(2480);
    expect(mmToPx(53.98, 600)).toBe(1275);
  });

  it('auto-fits CR80 grid cleanly and enforces manual column/row limits', () => {
    // A4 Portrait (210x297), 8mm margins -> 194x281 usable; single front CR80 (53.98x85.6) + 4mm gap -> 3 cols x 3 rows = 9 cards/page
    const frontMetrics = computeSheetGridMetrics(DEFAULT_ID_CARD_PAGE_SETTINGS, 'front');
    expect(frontMetrics.cols).toBe(3);
    expect(frontMetrics.rows).toBe(3);
    expect(frontMetrics.slotsPerPage).toBe(9);

    // Side-by-side pairs (2 * 53.98 + 3 = 110.96mm wide) -> 1 col x 3 rows on A4 Portrait, 2 cols x 2 rows on A4 Landscape
    const pairLandscape = computeSheetGridMetrics(
      { ...DEFAULT_ID_CARD_PAGE_SETTINGS, pageOrientation: 'landscape' },
      'both_side_by_side',
    );
    expect(pairLandscape.cols).toBe(2);
    expect(pairLandscape.rows).toBe(2);
    expect(pairLandscape.slotsPerPage).toBe(4);

    // Manual override clamps safely to maxCols/maxRows
    const manual = computeSheetGridMetrics(
      { ...DEFAULT_ID_CARD_PAGE_SETTINGS, autoGrid: false, manualCols: 2, manualRows: 2 },
      'front',
    );
    expect(manual.cols).toBe(2);
    expect(manual.rows).toBe(2);
    expect(manual.slotsPerPage).toBe(4);
  });

  it('horizontally mirrors every row in duplex_mirrored mode so front & back sheets align 1-to-1', () => {
    const sample = ['S1', 'S2', 'S3', 'S4', 'S5'].map((id) => ({ id }));
    // 3 cols x 3 rows = 9 per front sheet
    const { pages } = paginateStudentsForPrint(sample, DEFAULT_ID_CARD_PAGE_SETTINGS, 'duplex_mirrored');
    expect(pages).toHaveLength(2);
    expect(pages[0].pageKind).toBe('front');
    expect(pages[1].pageKind).toBe('back_mirrored');

    // Front row 0: [S1, S2, S3], row 1: [S4, S5]
    expect(pages[0].slots.map((s) => s.student?.id)).toEqual(['S1', 'S2', 'S3', 'S4', 'S5']);

    // Mirrored Back row 0 MUST be [S3, S2, S1], row 1 MUST be [null, S5, S4]
    expect(pages[1].slots.map((s) => s.student?.id ?? null)).toEqual([
      'S3',
      'S2',
      'S1',
      null,
      'S5',
      'S4',
    ]);
  });

  it('emits dedicated front & back CR80 PVC pages per student and parses Bangla/English page ranges', () => {
    const sample = [{ id: 'A' }, { id: 'B' }];
    const pvc = paginateStudentsForPrint(
      sample,
      { ...DEFAULT_ID_CARD_PAGE_SETTINGS, pageSize: 'cr80_pvc' },
      'both_side_by_side',
    );
    expect(pvc.pages).toHaveLength(4);
    expect(pvc.pages.map((p) => `${p.slots[0].student?.id}:${p.pageKind}`)).toEqual([
      'A:front',
      'A:back',
      'B:front',
      'B:back',
    ]);

    expect(parsePageRangeExpression('1, 3-5, ৯৯', 6)).toEqual([1, 3, 4, 5]);
    expect(parsePageRangeExpression('২-৪', 5)).toEqual([2, 3, 4]);
    expect(resolveTargetPageNumbers('current', 3, '', 6)).toEqual([3]);
    expect(resolveTargetPageNumbers('range', 1, '2, 4-5', 6)).toEqual([2, 4, 5]);

    const css = buildIdCardPrintCss({
      ...DEFAULT_ID_CARD_PAGE_SETTINGS,
      pageSize: 'legal',
      pageOrientation: 'landscape',
    });
    expect(css).toContain('size: 355.6mm 215.9mm;');
  });

  it('serializes, validates & sanitizes custom design templates and preserves strict single-language labels', () => {
    expect(BUILT_IN_ID_CARD_TEMPLATES).toHaveLength(6);
    expect(getIdCardGradeLabel('9th', 'bn')).toBe('৯ম শ্রেণি');
    expect(getIdCardGradeLabel('9th', 'en')).toBe('Class 9');
    expect(getIdCardScopeLabel('9th', 'Science', 'বিজ্ঞান', 'en')).toBe('Science');
    expect(getIdCardScopeLabel('9th', 'Science', 'বিজ্ঞান', 'bn')).toBe('বিজ্ঞান');

    const custom = createBlankCustomTemplate(BUILT_IN_ID_CARD_TEMPLATES[1], 'স্কুল স্পেশাল ২০২৬');
    const json = serializeTemplateToJson(custom);
    const reimported = parseAndValidateTemplateJson(json);
    expect(reimported.name).toBe('স্কুল স্পেশাল ২০২৬');
    expect(reimported.isBuiltIn).toBe(false);
    expect(reimported.id).not.toBe(custom.id);

    // Strips unsafe image data URLs and invalid colors
    const sanitized = sanitizeTemplateConfig({
      primaryColor: 'javascript:alert(1)',
      customFrontBgDataUrl: 'javascript:alert(1)',
      customBackBgDataUrl: 'data:image/png;base64,iVBORw0KGgo=',
    });
    expect(sanitized.primaryColor).toBe(BUILT_IN_ID_CARD_TEMPLATES[0].primaryColor);
    expect(sanitized.customFrontBgDataUrl).toBeUndefined();
    expect(sanitized.customBackBgDataUrl).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  it('composes a valid multi-page PDF 1.4 binary with exact millimeter MediaBox points', () => {
    const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9]);
    const pdfBytes = composePdfFromJpegPages([
      {
        jpegBytes: fakeJpeg,
        pixelWidth: 2480,
        pixelHeight: 3508,
        pageWidthMm: 210,
        pageHeightMm: 297,
      },
      {
        jpegBytes: fakeJpeg,
        pixelWidth: 638,
        pixelHeight: 1011,
        pageWidthMm: 53.98,
        pageHeightMm: 85.6,
      },
    ]);

    const pdfText = new TextDecoder('latin1').decode(pdfBytes);
    expect(pdfText.startsWith('%PDF-1.4\n')).toBe(true);
    expect(pdfText).toContain('/Count 2');
    expect(pdfText).toContain('/MediaBox [0 0 595.28 841.89]');
    expect(pdfText).toContain('/MediaBox [0 0 153.01 242.65]');
    expect(pdfText).toContain('xref\n0 9\n');
    expect(pdfText.trim().endsWith('%%EOF')).toBe(true);
  });
});
