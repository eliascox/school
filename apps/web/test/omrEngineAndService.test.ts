import { describe, it, expect, beforeEach } from 'vitest';

// Polyfill browser localStorage/window for Node Vitest environment
const memStore: Record<string, string> = {};
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => (k in memStore ? memStore[k] : null),
  setItem: (k: string, v: string) => {
    memStore[k] = String(v);
  },
  removeItem: (k: string) => {
    delete memStore[k];
  },
  clear: () => {
    for (const k of Object.keys(memStore)) delete memStore[k];
  },
  get length() {
    return Object.keys(memStore).length;
  },
  key: (i: number) => Object.keys(memStore)[i] ?? null,
};
(globalThis as unknown as { window: unknown }).window = globalThis;

import {
  LEGAL_HALF_WIDTH_MM,
  LEGAL_LANDSCAPE_HEIGHT_MM,
  LEGAL_LANDSCAPE_WIDTH_MM,
  OmrLayoutConfig,
  OmrPaperFormat,
  clampOmrQuestionCount,
  getOmrTemplateLayout,
} from '@/lib/omr/omrTemplates';
import {
  generateLegalTwoUpPrintSvg,
  generateOmrSheetSvg,
} from '@/lib/omr/omrSheetSvg';
import {
  Point2D,
  RgbaImageBuffer,
  computeHomography,
  decodeOmrImageBuffer,
  mergeDualFrameDecodes,
} from '@/lib/omr/omrVisionEngine';
import {
  OMR_SCANS_STORAGE_KEY,
  OMR_SESSIONS_STORAGE_KEY,
  getAllOmrCurriculumSubjects,
  getSiblingScopesForSession,
  omrService,
} from '@/services/omrService';
import {
  buildAnswerKeyExcelRows,
  computeAnswerKeyStats,
  formatAnswerKeyAsCopyText,
  getVerticalAnswerColumns,
  mergeParsedAnswerKey,
  parseBulkAnswerKeyText,
} from '@/lib/omr/omrAnswerKeyUtils';
import { DEFAULT_CURRICULUM_DATA, curriculumService } from '@/services/curriculumService';
import { getUniversalStudentMark } from '@/lib/markStorageUtils';

// ─── SYNTHETIC OMR SHEET RENDERER (PURE PIXEL BUFFER FOR NODE/VITEST) ────────

function fillRectRgba(
  buf: RgbaImageBuffer,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
  g: number,
  b: number,
) {
  const ix0 = Math.max(0, Math.floor(x0));
  const iy0 = Math.max(0, Math.floor(y0));
  const ix1 = Math.min(buf.width - 1, Math.ceil(x1));
  const iy1 = Math.min(buf.height - 1, Math.ceil(y1));
  for (let y = iy0; y <= iy1; y++) {
    const row = y * buf.width;
    for (let x = ix0; x <= ix1; x++) {
      const idx = (row + x) * 4;
      buf.data[idx] = r;
      buf.data[idx + 1] = g;
      buf.data[idx + 2] = b;
      buf.data[idx + 3] = 255;
    }
  }
}

function drawCircleRgba(
  buf: RgbaImageBuffer,
  cx: number,
  cy: number,
  radius: number,
  r: number,
  g: number,
  b: number,
  filled: boolean,
  strokeWidth: number = 1.6,
) {
  const minX = Math.max(0, Math.floor(cx - radius - 2));
  const maxX = Math.min(buf.width - 1, Math.ceil(cx + radius + 2));
  const minY = Math.max(0, Math.floor(cy - radius - 2));
  const maxY = Math.min(buf.height - 1, Math.ceil(cy + radius + 2));
  const rOut2 = (radius + strokeWidth / 2) ** 2;
  const rIn2 = Math.max(0, radius - strokeWidth / 2) ** 2;

  for (let y = minY; y <= maxY; y++) {
    const dy = y - cy;
    const row = y * buf.width;
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const d2 = dx * dx + dy * dy;
      const hit = filled ? d2 <= radius * radius : d2 <= rOut2 && d2 >= rIn2;
      if (hit) {
        const idx = (row + x) * 4;
        buf.data[idx] = r;
        buf.data[idx + 1] = g;
        buf.data[idx + 2] = b;
        buf.data[idx + 3] = 255;
      }
    }
  }
}

/**
 * Renders a synthetic OMR sheet (including Roll, 3-Digit Subject Code, Class, Group,
 * Set, and dynamic N questions) onto a pixel buffer, then optionally applies realistic
 * perspective skew & tilt onto a wooden desk background.
 */
function renderSyntheticOmrPhoto(params: {
  config: OmrLayoutConfig;
  rollDigits: number[];
  subjectCodeDigits?: number[] | null;
  gradeIndex?: number | null;
  groupIndex?: number | null;
  setIndex: number | null;
  filledAnswers: Map<number, { indices: number[]; ink?: [number, number, number] }>;
  pinkTheme?: boolean;
  perspectiveDistort?: boolean;
}): RgbaImageBuffer {
  const layout = getOmrTemplateLayout(params.config);
  const pxPerMm = 6.2;
  const pageW = Math.round(layout.preset.pageWidthMm * pxPerMm);
  const pageH = Math.round(layout.preset.pageHeightMm * pxPerMm);
  const sheet: RgbaImageBuffer = {
    data: new Uint8ClampedArray(pageW * pageH * 4),
    width: pageW,
    height: pageH,
  };

  fillRectRgba(sheet, 0, 0, pageW, pageH, 248, 248, 248);

  // 4 solid black corner fiducials
  for (const f of [layout.fiducials.tl, layout.fiducials.tr, layout.fiducials.br, layout.fiducials.bl]) {
    const half = (f.sizeMm / 2) * pxPerMm;
    fillRectRgba(
      sheet,
      f.xMm * pxPerMm - half,
      f.yMm * pxPerMm - half,
      f.xMm * pxPerMm + half,
      f.yMm * pxPerMm + half,
      12,
      12,
      12,
    );
  }

  const ringColor: [number, number, number] = params.pinkTheme === false ? [71, 85, 105] : [212, 20, 110];

  // Roll bubbles
  layout.rollBubbles.forEach((col, cIdx) => {
    col.forEach((b, digit) => {
      const cx = b.xMm * pxPerMm;
      const cy = b.yMm * pxPerMm;
      const r = b.rMm * pxPerMm;
      drawCircleRgba(sheet, cx, cy, r, ringColor[0], ringColor[1], ringColor[2], false, 1.7);
      if (params.rollDigits[cIdx] === digit) {
        drawCircleRgba(sheet, cx, cy, r * 0.85, 22, 22, 24, true);
      }
    });
  });

  // 3-Digit Subject Code bubbles
  layout.subjectCodeBubbles.forEach((col, cIdx) => {
    col.forEach((b, digit) => {
      const cx = b.xMm * pxPerMm;
      const cy = b.yMm * pxPerMm;
      const r = b.rMm * pxPerMm;
      drawCircleRgba(sheet, cx, cy, r, ringColor[0], ringColor[1], ringColor[2], false, 1.7);
      if (params.subjectCodeDigits && params.subjectCodeDigits[cIdx] === digit) {
        drawCircleRgba(sheet, cx, cy, r * 0.85, 20, 20, 22, true);
      }
    });
  });

  // Class / Grade bubbles (6th..10th)
  layout.gradeBubbles.forEach((b, idx) => {
    const cx = b.xMm * pxPerMm;
    const cy = b.yMm * pxPerMm;
    const r = b.rMm * pxPerMm;
    drawCircleRgba(sheet, cx, cy, r, ringColor[0], ringColor[1], ringColor[2], false, 1.7);
    if (params.gradeIndex === idx) {
      drawCircleRgba(sheet, cx, cy, r * 0.85, 20, 20, 22, true);
    }
  });

  // Group / Department bubbles
  layout.groupBubbles.forEach((b, idx) => {
    const cx = b.xMm * pxPerMm;
    const cy = b.yMm * pxPerMm;
    const r = b.rMm * pxPerMm;
    drawCircleRgba(sheet, cx, cy, r, ringColor[0], ringColor[1], ringColor[2], false, 1.7);
    if (params.groupIndex === idx) {
      drawCircleRgba(sheet, cx, cy, r * 0.85, 20, 20, 22, true);
    }
  });

  // Set bubbles
  layout.setBubbles.forEach((b, idx) => {
    const cx = b.xMm * pxPerMm;
    const cy = b.yMm * pxPerMm;
    const r = b.rMm * pxPerMm;
    drawCircleRgba(sheet, cx, cy, r, ringColor[0], ringColor[1], ringColor[2], false, 1.7);
    if (params.setIndex === idx) {
      drawCircleRgba(sheet, cx, cy, r * 0.85, 20, 20, 22, true);
    }
  });

  // Dynamic Question bubbles
  layout.questionBubbles.forEach((row, qIdx) => {
    const entry = params.filledAnswers.get(qIdx);
    const ink = entry?.ink || [24, 24, 28];
    row.forEach((b, optIdx) => {
      const cx = b.xMm * pxPerMm;
      const cy = b.yMm * pxPerMm;
      const r = b.rMm * pxPerMm;
      drawCircleRgba(sheet, cx, cy, r, ringColor[0], ringColor[1], ringColor[2], false, 1.7);
      if (entry && entry.indices.includes(optIdx)) {
        drawCircleRgba(sheet, cx, cy, r * 0.84, ink[0], ink[1], ink[2], true);
      }
    });
  });

  if (!params.perspectiveDistort) return sheet;

  const photoW = Math.round(pageW * 1.18);
  const photoH = Math.round(pageH * 1.18);
  const photo: RgbaImageBuffer = {
    data: new Uint8ClampedArray(photoW * photoH * 4),
    width: photoW,
    height: photoH,
  };
  fillRectRgba(photo, 0, 0, photoW, photoH, 118, 96, 78);

  const dstQuad: [Point2D, Point2D, Point2D, Point2D] = [
    { x: photoW * 0.09, y: photoH * 0.08 },
    { x: photoW * 0.90, y: photoH * 0.11 },
    { x: photoW * 0.93, y: photoH * 0.92 },
    { x: photoW * 0.07, y: photoH * 0.89 },
  ];
  const srcQuad: [Point2D, Point2D, Point2D, Point2D] = [
    { x: 0, y: 0 },
    { x: pageW - 1, y: 0 },
    { x: pageW - 1, y: pageH - 1 },
    { x: 0, y: pageH - 1 },
  ];

  const H = computeHomography(srcQuad, dstQuad)!;
  for (let y = 0; y < photoH; y++) {
    const row = y * photoW;
    for (let x = 0; x < photoW; x++) {
      const denom = H[6] * x + H[7] * y + H[8];
      const sx = (H[0] * x + H[1] * y + H[2]) / denom;
      const sy = (H[3] * x + H[4] * y + H[5]) / denom;
      if (sx >= 0 && sy >= 0 && sx < pageW - 1 && sy < pageH - 1) {
        const ix = Math.round(sx);
        const iy = Math.round(sy);
        const sIdx = (iy * pageW + ix) * 4;
        const pIdx = (row + x) * 4;
        photo.data[pIdx] = sheet.data[sIdx];
        photo.data[pIdx + 1] = sheet.data[sIdx + 1];
        photo.data[pIdx + 2] = sheet.data[sIdx + 2];
        photo.data[pIdx + 3] = 255;
      }
    }
  }

  return photo;
}

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('OMR v2 Dynamic Custom Question Count, Identity Grids & Legal 2-Up Print', () => {
  it('parses Bangla/English custom question counts and enforces non-overlapping geometry for 15, 35, 60, and 100 questions across Legal Half, A5, and A4', () => {
    expect(clampOmrQuestionCount('৩৫')).toBe(35);
    expect(clampOmrQuestionCount('১৫')).toBe(15);
    expect(clampOmrQuestionCount('3')).toBe(10);
    expect(clampOmrQuestionCount('180')).toBe(100);

    const formats: OmrPaperFormat[] = ['legal_half', 'a5', 'a4'];
    const customCounts = [15, 35, 60, 100];

    for (const paperFormat of formats) {
      for (const questionCount of customCounts) {
        const layout = getOmrTemplateLayout({
          questionCount,
          paperFormat,
          rollDigits: 3,
          optionStyle: 'bn',
          setCount: 4,
        });

        expect(layout.questionCount).toBe(questionCount);
        expect(layout.questionBubbles).toHaveLength(questionCount);
        expect(layout.subjectCodeBubbles).toHaveLength(3);
        expect(layout.gradeBubbles).toHaveLength(5);
        expect(layout.groupBubbles).toHaveLength(4);

        if (paperFormat === 'legal_half') {
          expect(layout.preset.pageWidthMm).toBe(LEGAL_HALF_WIDTH_MM);
          expect(layout.preset.pageHeightMm).toBe(LEGAL_LANDSCAPE_HEIGHT_MM);
        }

        // Verify zero horizontal & vertical overlap and strict bounds inside fiducials
        for (const row of layout.questionBubbles) {
          expect(row).toHaveLength(4);
          for (let i = 0; i < 4; i++) {
            const b = row[i];
            expect(b.u).toBeGreaterThan(0.02);
            expect(b.u).toBeLessThan(0.98);
            expect(b.v).toBeGreaterThan(0.02);
            expect(b.v).toBeLessThan(0.98);
            if (i > 0) {
              expect(b.xMm - row[i - 1].xMm).toBeGreaterThan(b.rMm * 2.15);
            }
          }
        }
      }
    }

    // Verify Legal Landscape 2-Up SVG exact dimensions (355.6 x 215.9mm) + center cutting line (x = 177.8mm) & scissor mark
    const leftSvg = generateOmrSheetSvg({
      questionCount: 35,
      paperFormat: 'legal_half',
      rollDigits: 3,
      optionStyle: 'bn',
      setCount: 4,
      colorTheme: 'pink',
      header: {
        schoolName: 'বগুড়া জিলা স্কুল',
        examTitle: 'বার্ষিক পরীক্ষা ২০২৬',
        classLabel: '৯ম শ্রেণি',
        sectionOrGroupLabel: 'বিজ্ঞান',
        subjectLabel: 'পদার্থবিজ্ঞান',
        subjectCode: '136',
      },
      student: { id: 'st-1', name: 'রাফি আহমেদ', roll: '05', group: 'বিজ্ঞান' },
      preFillRollBubbles: true,
      subjectCodeValue: '136',
      preFillSubjectCodeBubbles: true,
      preFillGrade: '9th',
      preFillGroup: 'বিজ্ঞান',
    });

    expect(leftSvg).toContain('data-grid="subject-code"');
    expect(leftSvg).toContain('data-grid="grade"');
    expect(leftSvg).toContain('data-grid="group"');
    expect(leftSvg).toContain('width="177.8mm"');

    const twoUpSvg = generateLegalTwoUpPrintSvg(leftSvg, leftSvg);
    expect(twoUpSvg).toContain(`viewBox="0 0 ${LEGAL_LANDSCAPE_WIDTH_MM} ${LEGAL_LANDSCAPE_HEIGHT_MM}"`);
    expect(twoUpSvg).toContain(`x1="${LEGAL_HALF_WIDTH_MM}"`);
    expect(twoUpSvg).toContain(`x2="${LEGAL_HALF_WIDTH_MM}"`);
    expect(twoUpSvg).toContain('data-cutting-line="center"');
    expect(twoUpSvg).toContain('✂');
  });
});

describe('OMR v2 Computer Vision Multi-Field Auto-Decode & Auto-Routing Sync', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      'sms_students',
      JSON.stringify([
        {
          id: 'st-9-sci-01',
          name: 'সাকিব আল হাসান',
          roll: '01',
          grade: '9th',
          section: 'Science',
          branch: 'Science',
          group: 'বিজ্ঞান',
          religion: 'Muslim',
        },
        {
          id: 'st-9-hum-01',
          name: 'মাহিনুর রহমান',
          roll: '01',
          grade: '9th',
          section: 'Humanities',
          branch: 'Humanities',
          group: 'মানবিক',
          religion: 'Muslim',
        },
        {
          id: 'st-9-sci-27',
          name: 'নুসরাত জাহান',
          roll: '27',
          grade: '9th',
          section: 'Science',
          branch: 'Science',
          group: 'বিজ্ঞান',
          religion: 'Muslim',
        },
      ]),
    );
  });

  it('decodes 3-digit subject code (136), class (9th), group (বিজ্ঞান), roll (027), set (খ) & custom 35 MCQs from perspective-tilted Legal Half photo and auto-routes to exact subject session', () => {
    const config: OmrLayoutConfig = {
      questionCount: 35,
      paperFormat: 'legal_half',
      rollDigits: 3,
      optionStyle: 'bn',
      setCount: 4,
    };

    const filledMap = new Map<number, { indices: number[]; ink?: [number, number, number] }>();
    for (let q = 0; q < 32; q++) {
      filledMap.set(q, { indices: [q % 4] });
    }
    // Q33 (idx 32) = blank
    // Q34 (idx 33) = double-marked (0 & 2)
    filledMap.set(33, { indices: [0, 2] });
    // Q35 (idx 34) = blue ballpoint pen
    filledMap.set(34, { indices: [3], ink: [28, 52, 165] });

    const photo = renderSyntheticOmrPhoto({
      config,
      rollDigits: [0, 2, 7],
      subjectCodeDigits: [1, 3, 6], // 136 = পদার্থবিজ্ঞান
      gradeIndex: 3, // '9th'
      groupIndex: 1, // 'বিজ্ঞান'
      setIndex: 1, // 'খ'
      filledAnswers: filledMap,
      pinkTheme: true,
      perspectiveDistort: true,
    });

    const decoded = decodeOmrImageBuffer(photo, config);
    expect(decoded.success).toBe(true);
    expect(decoded.decodedRollRaw).toBe('027');
    expect(decoded.decodedSubjectCodeRaw).toBe('136');
    expect(decoded.subjectCodeFilled).toBe(true);
    expect(decoded.subjectCodeUncertain).toBe(false);
    expect(decoded.decodedGrade).toBe('9th');
    expect(decoded.decodedGroup).toBe('বিজ্ঞান');
    expect(decoded.setCode).toBe('খ');
    expect(decoded.questions).toHaveLength(35);

    for (let q = 0; q < 32; q++) {
      expect(decoded.questions[q].status).toBe('filled');
      expect(decoded.questions[q].selectedIndex).toBe(q % 4);
    }
    expect(decoded.questions[32].status).toBe('blank');
    expect(decoded.questions[33].status).toBe('double');
    expect(decoded.questions[34].selectedIndex).toBe(3);

    // Pre-create Physics 136 session with 35-question Answer Key (matching q % 4, Q35 = 3)
    const physicsSession = omrService.findOrCreateSession({
      examId: 'ex-annual-2026',
      examTitle: 'বার্ষিক পরীক্ষা ২০২৬',
      grade: '9th',
      branch: 'Science',
      group: 'বিজ্ঞান',
      subjectCode: '136',
      subjectName: 'পদার্থবিজ্ঞান (Physics)',
      questionCount: 35,
      paperFormat: 'legal_half',
    });
    const key35 = Array.from({ length: 35 }, (_, i) => (i === 34 ? 3 : i % 4));
    omrService.updateAnswerKey(physicsSession.id, 'খ', key35);

    // Suppose the teacher currently has Bangla 101 open while scanning this Physics 136 sheet!
    const banglaSession = omrService.findOrCreateSession({
      examId: 'ex-annual-2026',
      examTitle: 'বার্ষিক পরীক্ষা ২০২৬',
      grade: '9th',
      branch: 'Science',
      group: 'বিজ্ঞান',
      subjectCode: '101',
      subjectName: 'বাংলা ১ম পত্র (সাহিত্য)',
      questionCount: 35,
      paperFormat: 'legal_half',
    });

    const outcome = omrService.recordDecodedScan({
      session: banglaSession,
      decode: decoded,
      sourceType: 'camera',
      scannedBy: 'অ্যাডমিন',
      autoSyncIdentity: true,
    });

    expect(outcome.status).toBe('saved');
    expect(outcome.autoRouted).toBe(true);
    expect(outcome.targetSession.id).toBe(physicsSession.id);
    expect(outcome.record.subjectCode).toBe('136');
    expect(outcome.record.studentId).toBe('st-9-sci-27');
    expect(outcome.record.studentName).toBe('নুসরাত জাহান');
    expect(outcome.record.correctCount).toBe(33); // 32 + Q35 blue pen
    expect(outcome.record.blankCount).toBe(1);
    expect(outcome.record.doubleCount).toBe(1);
    expect(outcome.record.obtainedMarks).toBe(33);
  });

  it('prevents roll collisions across Class 9 groups (Science Roll 01 vs Humanities Roll 01) and syncs Class 6-10 curriculum excluding 113/114', () => {
    // 1. Add a custom subject with mcq: 0 to live curriculum and verify immediate OMR availability
    const customList = [
      ...DEFAULT_CURRICULUM_DATA,
      {
        id: 'curr-8th-199-custom',
        code: '199',
        name: 'রোবটিক্স ও কোডিং',
        grade: '8th',
        group: 'সাধারণ',
        cq: 50,
        mcq: 0,
        practical: 50,
        ca: 0,
        fullMarks: 100,
        passMarks: 33,
        passRules: '৩৩%',
        category: 'ঐচ্ছিক',
      },
    ];
    curriculumService.saveCurriculumList(customList);

    const class8Subjects = getAllOmrCurriculumSubjects('8th');
    expect(class8Subjects.some((s) => s.code === '199' && s.name === 'রোবটিক্স ও কোডিং')).toBe(true);
    expect(class8Subjects.some((s) => s.code === '111')).toBe(true); // Islam
    expect(class8Subjects.some((s) => s.code === '112')).toBe(true); // Hindu
    // Per user instruction: Buddhist 113 and Christian 114 are NOT injected
    expect(class8Subjects.some((s) => s.code === '113' || s.code === '114')).toBe(false);

    // 2. Same Roll 01 in Science vs Humanities — ZERO collision via on-sheet Group + Subject Code!
    const cfg: OmrLayoutConfig = {
      questionCount: 20,
      paperFormat: 'legal_half',
      rollDigits: 3,
      optionStyle: 'bn',
      setCount: 4,
    };
    const answers20 = new Map<number, { indices: number[] }>();
    for (let q = 0; q < 20; q++) answers20.set(q, { indices: [0] });

    const sciDecode = decodeOmrImageBuffer(
      renderSyntheticOmrPhoto({
        config: cfg,
        rollDigits: [0, 0, 1],
        subjectCodeDigits: [1, 3, 6], // Physics (Science)
        gradeIndex: 3, // 9th
        groupIndex: 1, // বিজ্ঞান
        setIndex: 0,
        filledAnswers: answers20,
      }),
      cfg,
    );

    const humDecode = decodeOmrImageBuffer(
      renderSyntheticOmrPhoto({
        config: cfg,
        rollDigits: [0, 0, 1],
        subjectCodeDigits: [1, 5, 3], // History (Humanities)
        gradeIndex: 3, // 9th
        groupIndex: 2, // মানবিক
        setIndex: 0,
        filledAnswers: answers20,
      }),
      cfg,
    );

    const baseSession = omrService.findOrCreateSession({
      examId: 'ex-half-2026',
      examTitle: 'অর্ধ-বার্ষিক পরীক্ষা ২০২৬',
      grade: '9th',
      branch: 'Science',
      group: 'বিজ্ঞান',
      subjectCode: '136',
      subjectName: 'পদার্থবিজ্ঞান (Physics)',
      questionCount: 20,
      paperFormat: 'legal_half',
    });

    const outSci = omrService.recordDecodedScan({
      session: baseSession,
      decode: sciDecode,
      sourceType: 'image',
      scannedBy: 'অ্যাডমিন',
      autoSyncIdentity: true,
    });
    const outHum = omrService.recordDecodedScan({
      session: baseSession,
      decode: humDecode,
      sourceType: 'image',
      scannedBy: 'অ্যাডমিন',
      autoSyncIdentity: true,
    });

    expect(outSci.record.studentId).toBe('st-9-sci-01');
    expect(outSci.record.studentName).toBe('সাকিব আল হাসান');
    expect(outSci.record.group).toBe('বিজ্ঞান');

    expect(outHum.autoRouted).toBe(true);
    expect(outHum.record.studentId).toBe('st-9-hum-01');
    expect(outHum.record.studentName).toBe('মাহিনুর রহমান');
    expect(outHum.record.group).toBe('মানবিক');
    expect(outHum.record.subjectCode).toBe('153');
  });

  it('decodes B&W laser prints, flags dual-frame disagreement, guards duplicate rolls, and syncs MCQ losslessly', () => {
    const cfg: OmrLayoutConfig = {
      questionCount: 25,
      paperFormat: 'a5',
      rollDigits: 3,
      optionStyle: 'en',
      setCount: 4,
    };

    const map1 = new Map<number, { indices: number[] }>();
    const map2 = new Map<number, { indices: number[] }>();
    for (let q = 0; q < 25; q++) {
      map1.set(q, { indices: [1] });
      map2.set(q, { indices: [q === 11 ? 3 : 1] });
    }

    const d1 = decodeOmrImageBuffer(
      renderSyntheticOmrPhoto({
        config: cfg,
        rollDigits: [0, 2, 7],
        subjectCodeDigits: [1, 3, 6],
        gradeIndex: 3,
        groupIndex: 1,
        setIndex: 1,
        filledAnswers: map1,
        pinkTheme: false,
        perspectiveDistort: true,
      }),
      cfg,
    );
    expect(d1.success).toBe(true);
    expect(d1.decodedRollRaw).toBe('027');
    expect(d1.decodedSubjectCodeRaw).toBe('136');

    const d2 = decodeOmrImageBuffer(
      renderSyntheticOmrPhoto({
        config: cfg,
        rollDigits: [0, 2, 7],
        subjectCodeDigits: [1, 3, 6],
        gradeIndex: 3,
        groupIndex: 1,
        setIndex: 1,
        filledAnswers: map2,
        pinkTheme: false,
      }),
      cfg,
    );

    const merged = mergeDualFrameDecodes(d1, d2);
    expect(merged.uncertainQuestions).toContain(12);

    const session = omrService.findOrCreateSession({
      examId: 'ex-annual-2026',
      examTitle: 'বার্ষিক পরীক্ষা ২০২৬',
      grade: '9th',
      branch: 'Science',
      group: 'বিজ্ঞান',
      subjectCode: '136',
      subjectName: 'পদার্থবিজ্ঞান (Physics)',
      subjectMcqMax: 25,
      questionCount: 25,
      paperFormat: 'a5',
      optionStyle: 'en',
    });
    const updated = omrService.updateAnswerKey(
      session.id,
      'B',
      Array.from({ length: 25 }, () => 1),
    )!;

    const saved = omrService.recordDecodedScan({
      session: updated,
      decode: d1,
      sourceType: 'image',
      scannedBy: 'অ্যাডমিন',
    });
    expect(saved.status).toBe('saved');
    expect(saved.record.obtainedMarks).toBe(25);

    const dup = omrService.recordDecodedScan({
      session: updated,
      decode: d1,
      sourceType: 'camera',
      scannedBy: 'অ্যাডমিন',
    });
    expect(dup.status).toBe('duplicate_conflict');

    // Existing CQ=44 + Practical=23 must remain untouched during MCQ sync!
    const existingMarkKey = 'sms_marks_বার্ষিক পরীক্ষা ২০২৬_9th_Science_science_পদার্থবিজ্ঞান (Physics)';
    localStorage.setItem(
      existingMarkKey,
      JSON.stringify([
        { id: 'st-9-sci-27', roll: '27', name: 'নুসরাত জাহান', written: 44, mcq: 0, practical: 23, total: 67 },
      ]),
    );

    const syncReport = omrService.syncSessionMarksToMarkEntry(session.id, 'অ্যাডমিন');
    expect(syncReport.syncedCount).toBe(1);

    const retrieved = getUniversalStudentMark({
      exam: 'বার্ষিক পরীক্ষা ২০২৬',
      grade: '9th',
      branch: 'Science',
      group: 'বিজ্ঞান',
      subjectCodeOrName: '136',
      studentRoll: '27',
      studentId: 'st-9-sci-27',
      studentName: 'নুসরাত জাহান',
    });
    expect(retrieved.cq).toBe(44);
    expect(retrieved.practical).toBe(23);
    expect(retrieved.mcq).toBe(25);
    expect(retrieved.total).toBe(92);

    expect(JSON.parse(localStorage.getItem(OMR_SESSIONS_STORAGE_KEY) || '[]').length).toBeGreaterThanOrEqual(1);
    expect(JSON.parse(localStorage.getItem(OMR_SCANS_STORAGE_KEY) || '[]')[0].syncedToMarkEntry).toBe(true);
  });
});

describe('OMR Subject-Wise Answer Key Studio Utilities & Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('parses bulk Bangla, English, numeric, and numbered-pair answer strings with merge strategies and board-column layout', () => {
    // 1. Compact Bangla sequence
    const bnCompact = parseBulkAnswerKeyText('কখগঘকখগঘকখ', 10);
    expect(bnCompact.mode).toBe('sequence');
    expect(bnCompact.parsedCount).toBe(10);
    expect(bnCompact.answers).toEqual([0, 1, 2, 3, 0, 1, 2, 3, 0, 1]);

    // 2. Spaced English with blank placeholder
    const enSpaced = parseBulkAnswerKeyText('A b - D 1 2 3 4 a B', 10);
    expect(enSpaced.parsedCount).toBe(9);
    expect(enSpaced.answers[2]).toBeNull();
    expect(enSpaced.answers[3]).toBe(3);

    // 3. Numbered pairs (Bangla + English digits) preserving untouched slots & clearing explicit '-'
    const existing15: Array<number | null> = Array.from({ length: 15 }, () => 0);
    const numbered = parseBulkAnswerKeyText('১. গ, 5:ঘ, 10:-', 15);
    expect(numbered.mode).toBe('numbered');
    expect(numbered.providedIndices).toEqual([0, 4, 9]);
    const replaced = mergeParsedAnswerKey(existing15, numbered, 15, 'replace');
    expect(replaced[0]).toBe(2); // updated Q1
    expect(replaced[1]).toBe(0); // preserved Q2
    expect(replaced[4]).toBe(3); // updated Q5
    expect(replaced[9]).toBeNull(); // explicitly cleared Q10

    // 4. Fill missing only strategy
    const partialBase: Array<number | null> = [0, null, 2, null, 1, null, null, null, null, null];
    const fillParsed = parseBulkAnswerKeyText('DDDDDDDDDD', 10);
    const filledOnly = mergeParsedAnswerKey(partialBase, fillParsed, 10, 'fill_missing');
    expect(filledOnly[0]).toBe(0); // kept original
    expect(filledOnly[1]).toBe(3); // filled missing
    expect(filledOnly[2]).toBe(2); // kept original
    expect(filledOnly[3]).toBe(3); // filled missing

    // 5. Stats, vertical board columns, copy text & Excel rows
    const stats = computeAnswerKeyStats([0, 1, 2, 3, null, 0, 1, 2, 3, 0], 10);
    expect(stats.filled).toBe(9);
    expect(stats.missingCount).toBe(1);
    expect(stats.missingQuestionNumbers).toEqual([5]);
    expect(stats.optionCounts).toEqual([3, 2, 2, 2]);
    expect(stats.isComplete).toBe(false);

    const cols30 = getVerticalAnswerColumns(30);
    expect(cols30).toHaveLength(2);
    expect(cols30[0]).toEqual({ colIndex: 0, startIndex: 0, endIndex: 14 });
    expect(cols30[1]).toEqual({ colIndex: 1, startIndex: 15, endIndex: 29 });
    expect(getVerticalAnswerColumns(45)).toHaveLength(3);
    expect(getVerticalAnswerColumns(100)).toHaveLength(4);

    const copyTxt = formatAnswerKeyAsCopyText([0, 1, null, 3], 'bn', 'numbered');
    expect(copyTxt).toContain('১.ক');
    expect(copyTxt).toContain('৩.-');

    const excelRows = buildAnswerKeyExcelRows([
      {
        examTitle: 'বার্ষিক পরীক্ষা ২০২৬',
        gradeLabel: '৯ম শ্রেণি',
        scopeLabel: 'বিজ্ঞান',
        subjectCode: '109',
        subjectName: 'গণিত',
        questionCount: 15,
        optionStyle: 'bn',
        markPerCorrect: 1,
        negativeMark: 0,
        setCode: 'ক',
        answers: Array.from({ length: 15 }, (_, i) => i % 4),
      },
    ]);
    expect(excelRows).toHaveLength(1);
    expect(excelRows[0]['বিষয় কোড']).toBe('109');
    expect(excelRows[0]['প্রশ্ন 1']).toBe('ক');
    expect(excelRows[0]['প্রশ্ন 2']).toBe('খ');
  });

  it('tracks subject readiness without creating empty sessions, enforces lock guard, syncs sibling sections/groups, and round-trips JSON backups', () => {
    const class9ScienceSubjects = getAllOmrCurriculumSubjects('9th', 'বিজ্ঞান');
    expect(class9ScienceSubjects.some((s) => s.code === '111')).toBe(true);
    expect(class9ScienceSubjects.some((s) => s.code === '112')).toBe(true);
    expect(class9ScienceSubjects.some((s) => s.code === '113' || s.code === '114')).toBe(false);

    // 1. Read-only readiness check must NOT pollute localStorage with empty sessions
    const initialReadiness = omrService.getSubjectKeyReadinessList({
      examTitle: 'অর্ধ-বার্ষিক পরীক্ষা ২০২৬',
      grade: '9th',
      branch: 'Science',
      group: 'বিজ্ঞান',
      subjects: class9ScienceSubjects,
    });
    expect(initialReadiness.length).toBe(class9ScienceSubjects.length);
    expect(initialReadiness.every((r) => r.status === 'empty' && r.sessionId === null)).toBe(true);
    expect(omrService.getSessions()).toHaveLength(0);

    // 2. Prepare Math (109, shared across Science/Humanities/Commerce) with 15 MCQ & 1 set
    const mathSession = omrService.findOrCreateSession({
      examId: 'ex-half-2026',
      examTitle: 'অর্ধ-বার্ষিক পরীক্ষা ২০২৬',
      grade: '9th',
      branch: 'Science',
      group: 'বিজ্ঞান',
      subjectCode: '109',
      subjectName: 'গণিত (Mathematics)',
      questionCount: 15,
      setCount: 1,
      optionStyle: 'bn',
    });

    const mathKey = Array.from({ length: 15 }, (_, i) => i % 4);
    omrService.updateAnswerKey(mathSession.id, 'default', mathKey, { updatedBy: 'প্রধান শিক্ষক' });
    omrService.updateSessionKeyMeta(mathSession.id, { keyNote: 'বোর্ড মডেল সেট' });

    const afterMath = omrService.getSubjectKeyReadinessList({
      examTitle: 'অর্ধ-বার্ষিক পরীক্ষা ২০২৬',
      grade: '9th',
      branch: 'Science',
      group: 'বিজ্ঞান',
      subjects: class9ScienceSubjects,
    });
    const mathRow = afterMath.find((r) => r.subjectCode === '109');
    expect(mathRow?.status).toBe('complete');
    expect(mathRow?.completedSetCount).toBe(1);
    expect(mathRow?.keyNote).toBe('বোর্ড মডেল সেট');

    // 3. Lock Guard: locked Answer Key blocks edits until explicitly unlocked
    omrService.setAnswerKeyLock(mathSession.id, true, 'প্রধান শিক্ষক');
    const blocked = omrService.updateAnswerKey(
      mathSession.id,
      'default',
      Array.from({ length: 15 }, () => 3),
    );
    expect(blocked).toBeNull();
    expect(omrService.getSessionById(mathSession.id)?.answerKeys.default[0]).toBe(0);

    omrService.setAnswerKeyLock(mathSession.id, false, 'প্রধান শিক্ষক');
    const unlockedEdit = omrService.updateAnswerKey(
      mathSession.id,
      'default',
      Array.from({ length: 15 }, () => 2),
    );
    expect(unlockedEdit?.answerKeys.default[0]).toBe(2);

    // 4. Sibling Scope Sync:
    //    (a) Shared Class 9 Math (109) syncs Science -> Humanities & Business Studies
    const mathSiblings = getSiblingScopesForSession(unlockedEdit!);
    expect(mathSiblings.map((s) => s.group)).toEqual(['মানবিক', 'ব্যবসায় শিক্ষা']);
    const sync9 = omrService.applyAnswerKeyToSiblingScopes(mathSession.id, { updatedBy: 'অ্যাডমিন' });
    expect(sync9.updatedCount).toBe(2);

    const humMath = omrService
      .getSessions()
      .find((s) => s.grade === '9th' && s.group === 'মানবিক' && s.subjectCode === '109');
    expect(humMath?.answerKeys.default).toEqual(Array.from({ length: 15 }, () => 2));

    //    (b) Exclusive Class 9 Physics (136) has 0 sibling groups
    const phySession = omrService.findOrCreateSession({
      examId: 'ex-half-2026',
      examTitle: 'অর্ধ-বার্ষিক পরীক্ষা ২০২৬',
      grade: '9th',
      branch: 'Science',
      group: 'বিজ্ঞান',
      subjectCode: '136',
      subjectName: 'পদার্থবিজ্ঞান (Physics)',
      questionCount: 25,
    });
    expect(getSiblingScopesForSession(phySession)).toHaveLength(0);

    //    (c) Class 6 Math Branch A syncs -> Branch B & Branch C
    const c6MathA = omrService.findOrCreateSession({
      examId: 'ex-half-2026',
      examTitle: 'অর্ধ-বার্ষিক পরীক্ষা ২০২৬',
      grade: '6th',
      branch: 'A',
      group: 'সাধারণ',
      subjectCode: '109',
      subjectName: 'গণিত (Mathematics)',
      questionCount: 20,
      setCount: 1,
    });
    omrService.updateAnswerKey(c6MathA.id, 'default', Array.from({ length: 20 }, () => 1));
    const sync6 = omrService.applyAnswerKeyToSiblingScopes(c6MathA.id);
    expect(sync6.updatedCount).toBe(2);
    expect(sync6.targetLabelsBn).toEqual(['শাখা B', 'শাখা C']);

    // 5. Portable JSON Backup & Restore across fresh storage
    const bundle = omrService.exportAnswerKeysBundle({ examTitle: 'অর্ধ-বার্ষিক পরীক্ষা ২০২৬' });
    expect(bundle.schemaVersion).toBe(1);
    expect(bundle.entries.length).toBeGreaterThanOrEqual(6); // Math 9th x3 + Math 6th x3 (Physics empty excluded)

    localStorage.clear();
    expect(omrService.getSessions()).toHaveLength(0);

    const restored = omrService.importAnswerKeysBundle(bundle, 'অ্যাডমিন');
    expect(restored.importedCount).toBe(bundle.entries.length);
    expect(restored.skippedCount).toBe(0);
    const restoredMath = omrService
      .getSessions()
      .find((s) => s.grade === '9th' && s.group === 'বিজ্ঞান' && s.subjectCode === '109');
    expect(restoredMath?.questionCount).toBe(15);
    expect(restoredMath?.answerKeys.default).toEqual(Array.from({ length: 15 }, () => 2));
    expect(restoredMath?.keyNote).toBe('বোর্ড মডেল সেট');
  });
});
