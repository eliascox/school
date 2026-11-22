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
  OMR_TEMPLATE_LIST,
  OmrLayoutConfig,
  getOmrTemplateLayout,
} from '@/lib/omr/omrTemplates';
import { generateOmrSheetSvg } from '@/lib/omr/omrSheetSvg';
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
  omrService,
} from '@/services/omrService';
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
 * Renders a synthetic OMR sheet onto a clean pixel buffer, then optionally
 * applies a perspective camera transform onto a darker wooden desk background.
 */
function renderSyntheticOmrPhoto(params: {
  config: OmrLayoutConfig;
  rollDigits: number[];
  setIndex: number | null;
  filledAnswers: Map<number, { indices: number[]; ink?: [number, number, number] }>;
  pinkTheme?: boolean;
  perspectiveDistort?: boolean;
}): RgbaImageBuffer {
  const layout = getOmrTemplateLayout(params.config);
  const pxPerMm = 6.5; // crisp ~962 x 1365 A5 page
  const pageW = Math.round(layout.preset.pageWidthMm * pxPerMm);
  const pageH = Math.round(layout.preset.pageHeightMm * pxPerMm);
  const sheet: RgbaImageBuffer = {
    data: new Uint8ClampedArray(pageW * pageH * 4),
    width: pageW,
    height: pageH,
  };

  // White paper background
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
      drawCircleRgba(sheet, cx, cy, r, ringColor[0], ringColor[1], ringColor[2], false, 1.8);
      if (params.rollDigits[cIdx] === digit) {
        drawCircleRgba(sheet, cx, cy, r * 0.85, 22, 22, 24, true);
      }
    });
  });

  // Set bubbles
  layout.setBubbles.forEach((b, idx) => {
    const cx = b.xMm * pxPerMm;
    const cy = b.yMm * pxPerMm;
    const r = b.rMm * pxPerMm;
    drawCircleRgba(sheet, cx, cy, r, ringColor[0], ringColor[1], ringColor[2], false, 1.8);
    if (params.setIndex === idx) {
      drawCircleRgba(sheet, cx, cy, r * 0.85, 20, 20, 22, true);
    }
  });

  // Question bubbles
  layout.questionBubbles.forEach((row, qIdx) => {
    const entry = params.filledAnswers.get(qIdx);
    const ink = entry?.ink || [24, 24, 28];
    row.forEach((b, optIdx) => {
      const cx = b.xMm * pxPerMm;
      const cy = b.yMm * pxPerMm;
      const r = b.rMm * pxPerMm;
      drawCircleRgba(sheet, cx, cy, r, ringColor[0], ringColor[1], ringColor[2], false, 1.8);
      if (entry && entry.indices.includes(optIdx)) {
        drawCircleRgba(sheet, cx, cy, r * 0.84, ink[0], ink[1], ink[2], true);
      }
    });
  });

  if (!params.perspectiveDistort) return sheet;

  // Place sheet onto a larger photo frame with realistic desk border + tilt + perspective skew
  const photoW = Math.round(pageW * 1.18);
  const photoH = Math.round(pageH * 1.18);
  const photo: RgbaImageBuffer = {
    data: new Uint8ClampedArray(photoW * photoH * 4),
    width: photoW,
    height: photoH,
  };
  // Wooden desk background
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

  // Inverse homography maps photo pixel -> sheet pixel
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

describe('OMR Template Geometry & SVG Generator', () => {
  it('generates valid non-overlapping in-bounds coordinates for all 5 presets (25/30/40/50/100 MCQ)', () => {
    for (const preset of OMR_TEMPLATE_LIST) {
      const layout = getOmrTemplateLayout({
        templateId: preset.id,
        rollDigits: preset.defaultRollDigits,
        optionStyle: 'bn',
        setCount: 4,
      });

      expect(layout.questionBubbles).toHaveLength(preset.questionCount);
      expect(layout.rollBubbles).toHaveLength(preset.defaultRollDigits);
      expect(layout.setBubbles).toHaveLength(4);

      for (const row of layout.questionBubbles) {
        expect(row).toHaveLength(4);
        for (let i = 0; i < 4; i++) {
          const b = row[i];
          expect(b.u).toBeGreaterThan(0.02);
          expect(b.u).toBeLessThan(0.98);
          expect(b.v).toBeGreaterThan(0.02);
          expect(b.v).toBeLessThan(0.98);
          if (i > 0) {
            // Bubbles in same row must not overlap
            expect(b.xMm - row[i - 1].xMm).toBeGreaterThan(b.rMm * 2.2);
          }
        }
      }

      const svg = generateOmrSheetSvg({
        templateId: preset.id,
        rollDigits: preset.defaultRollDigits,
        optionStyle: 'bn',
        setCount: 4,
        colorTheme: 'pink',
        header: {
          schoolName: 'বগুড়া জিলা স্কুল',
          examTitle: 'বার্ষিক পরীক্ষা ২০২৬',
          classLabel: '৯ম শ্রেণি',
          subjectLabel: 'সাধারণ গণিত',
          subjectCode: '109',
        },
        student: { id: 'st-1', name: 'রাফি আহমেদ', roll: '05' },
        preFillRollBubbles: true,
      });

      expect(svg).toContain('data-fiducial="tl"');
      expect(svg).toContain('data-fiducial="tr"');
      expect(svg).toContain('data-fiducial="br"');
      expect(svg).toContain('data-fiducial="bl"');
      expect(svg).toContain('#d4146e');
      expect(svg).toContain('রাফি আহমেদ');
    }
  });
});

describe('OMR Pure-TypeScript Computer Vision Engine', () => {
  it('accurately decodes roll, set, black pen, blue pen, blank, and double-marked bubbles from a perspective-tilted pink OMR photo', () => {
    const config: OmrLayoutConfig = {
      templateId: 'a5_30',
      rollDigits: 3,
      optionStyle: 'bn',
      setCount: 4,
    };

    const filledMap = new Map<number, { indices: number[]; ink?: [number, number, number] }>();
    for (let q = 0; q < 27; q++) {
      filledMap.set(q, { indices: [q % 4] });
    }
    // Q28 (index 27) = blank
    // Q29 (index 28) = double-marked (0 & 2)
    filledMap.set(28, { indices: [0, 2] });
    // Q30 (index 29) = blue ballpoint pen
    filledMap.set(29, { indices: [3], ink: [28, 52, 165] });

    const photo = renderSyntheticOmrPhoto({
      config,
      rollDigits: [0, 2, 7],
      setIndex: 1, // 'খ'
      filledAnswers: filledMap,
      pinkTheme: true,
      perspectiveDistort: true,
    });

    const decoded = decodeOmrImageBuffer(photo, config);
    expect(decoded.success).toBe(true);
    expect(decoded.decodedRollRaw).toBe('027');
    expect(decoded.rollUncertain).toBe(false);
    expect(decoded.setIndex).toBe(1);
    expect(decoded.setCode).toBe('খ');

    for (let q = 0; q < 27; q++) {
      expect(decoded.questions[q].status).toBe('filled');
      expect(decoded.questions[q].selectedIndex).toBe(q % 4);
    }

    expect(decoded.questions[27].status).toBe('blank');
    expect(decoded.questions[27].selectedIndex).toBeNull();

    expect(decoded.questions[28].status).toBe('double');
    expect(decoded.doubleMarkedQuestions).toContain(29);

    expect(decoded.questions[29].status).toBe('filled');
    expect(decoded.questions[29].selectedIndex).toBe(3);
  });

  it('also decodes B&W laser-printed OMR sheets accurately', () => {
    const config: OmrLayoutConfig = {
      templateId: 'a5_25',
      rollDigits: 3,
      optionStyle: 'en',
      setCount: 4,
    };
    const filledMap = new Map<number, { indices: number[] }>();
    for (let q = 0; q < 25; q++) {
      filledMap.set(q, { indices: [(q + 1) % 4] });
    }

    const photo = renderSyntheticOmrPhoto({
      config,
      rollDigits: [1, 0, 4],
      setIndex: 2, // 'C'
      filledAnswers: filledMap,
      pinkTheme: false,
      perspectiveDistort: true,
    });

    const decoded = decodeOmrImageBuffer(photo, config);
    expect(decoded.success).toBe(true);
    expect(decoded.decodedRollRaw).toBe('104');
    expect(decoded.setCode).toBe('C');
    expect(decoded.questions.every((q, idx) => q.selectedIndex === (idx + 1) % 4)).toBe(true);
  });

  it('flags disagreeing questions as uncertain in dual-frame consensus', () => {
    const config: OmrLayoutConfig = {
      templateId: 'a5_25',
      rollDigits: 3,
      optionStyle: 'bn',
      setCount: 4,
    };
    const map1 = new Map<number, { indices: number[] }>();
    const map2 = new Map<number, { indices: number[] }>();
    for (let q = 0; q < 25; q++) {
      map1.set(q, { indices: [0] });
      map2.set(q, { indices: [q === 11 ? 2 : 0] }); // Q12 disagrees!
    }

    const d1 = decodeOmrImageBuffer(
      renderSyntheticOmrPhoto({ config, rollDigits: [0, 0, 5], setIndex: 0, filledAnswers: map1 }),
      config,
    );
    const d2 = decodeOmrImageBuffer(
      renderSyntheticOmrPhoto({ config, rollDigits: [0, 0, 5], setIndex: 0, filledAnswers: map2 }),
      config,
    );

    const merged = mergeDualFrameDecodes(d1, d2);
    expect(merged.uncertainQuestions).toContain(12);
    expect(merged.questions[11].status).toBe('uncertain');
    expect(merged.questions[0].status).toBe('filled');
  });
});

describe('OMR Student-Wise Persistence, Duplicate Guard & Lossless Mark Entry Sync', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      'sms_students',
      JSON.stringify([
        {
          id: 'st-9-05',
          name: 'তানভীর হাসান',
          roll: '05',
          grade: '9th',
          section: 'Science',
          branch: 'Science',
          group: 'বিজ্ঞান',
          religion: 'Muslim',
        },
        {
          id: 'st-9-27',
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

  it('matches students accurately, blocks silent duplicates, re-grades on key update, and syncs MCQ without touching CQ/Practical', () => {
    const session = omrService.findOrCreateSession({
      examId: 'ex-annual-2026',
      examTitle: 'বার্ষিক পরীক্ষা ২০২৬',
      grade: '9th',
      branch: 'Science',
      group: 'বিজ্ঞান',
      subjectCode: '136',
      subjectName: 'পদার্থবিজ্ঞান (Physics)',
      subjectMcqMax: 25,
      templateId: 'a5_25',
      rollDigits: 3,
      optionStyle: 'bn',
      setCount: 4,
    });

    // Set Answer Key for Set 'খ': all 25 questions = index 1 ('খ')
    const key25 = Array.from({ length: 25 }, () => 1);
    const updatedSession = omrService.updateAnswerKey(session.id, 'খ', key25)!;

    // Synthetic scan for Roll 027 (matches Roll '27' -> নুসরাত জাহান) with 22 correct, 3 wrong
    const filledMap = new Map<number, { indices: number[] }>();
    for (let q = 0; q < 25; q++) {
      filledMap.set(q, { indices: [q < 22 ? 1 : 0] });
    }
    const decoded = decodeOmrImageBuffer(
      renderSyntheticOmrPhoto({
        config: { templateId: 'a5_25', rollDigits: 3, optionStyle: 'bn', setCount: 4 },
        rollDigits: [0, 2, 7],
        setIndex: 1, // 'খ'
        filledAnswers: filledMap,
      }),
      { templateId: 'a5_25', rollDigits: 3, optionStyle: 'bn', setCount: 4 },
    );

    const save1 = omrService.recordDecodedScan({
      session: updatedSession,
      decode: decoded,
      sourceType: 'image',
      scannedBy: 'অ্যাডমিন',
    });

    expect(save1.status).toBe('saved');
    expect(save1.record.matchStatus).toBe('matched');
    expect(save1.record.studentId).toBe('st-9-27');
    expect(save1.record.studentName).toBe('নুসরাত জাহান');
    expect(save1.record.correctCount).toBe(22);
    expect(save1.record.wrongCount).toBe(3);
    expect(save1.record.obtainedMarks).toBe(22);

    // Duplicate roll scan without overwrite -> triggers duplicate_conflict!
    const dupCheck = omrService.recordDecodedScan({
      session: updatedSession,
      decode: decoded,
      sourceType: 'camera',
      scannedBy: 'অ্যাডমিন',
    });
    expect(dupCheck.status).toBe('duplicate_conflict');
    expect(omrService.getScansForSession(session.id)).toHaveLength(1);

    // Seed existing CQ=44 and Practical=23 in official Mark Entry storage before OMR sync
    const existingMarkKey = 'sms_marks_বার্ষিক পরীক্ষা ২০২৬_9th_Science_science_পদার্থবিজ্ঞান (Physics)';
    localStorage.setItem(
      existingMarkKey,
      JSON.stringify([
        { id: 'st-9-05', roll: '05', name: 'তানভীর হাসান', written: 40, mcq: 18, practical: 20, total: 78 },
        { id: 'st-9-27', roll: '27', name: 'নুসরাত জাহান', written: 44, mcq: 0, practical: 23, total: 67 },
      ]),
    );

    // Sync verified OMR MCQ marks into official Mark Entry
    const syncReport = omrService.syncSessionMarksToMarkEntry(session.id, 'অ্যাডমিন');
    expect(syncReport.syncedCount).toBe(1);

    // Verify Roll 27 has CQ=44 & Practical=23 PRESERVED, and MCQ updated to 22 -> Total=89!
    const retrieved27 = getUniversalStudentMark({
      exam: 'বার্ষিক পরীক্ষা ২০২৬',
      grade: '9th',
      branch: 'Science',
      group: 'বিজ্ঞান',
      subjectCodeOrName: '136',
      studentRoll: '27',
      studentId: 'st-9-27',
      studentName: 'নুসরাত জাহান',
    });
    expect(retrieved27.hasMarks).toBe(true);
    expect(retrieved27.cq).toBe(44);
    expect(retrieved27.practical).toBe(23);
    expect(retrieved27.mcq).toBe(22);
    expect(retrieved27.total).toBe(89);

    // Verify Roll 05 (not scanned in OMR) retained its previous marks intact!
    const retrieved05 = getUniversalStudentMark({
      exam: 'বার্ষিক পরীক্ষা ২০২৬',
      grade: '9th',
      branch: 'Science',
      group: 'বিজ্ঞান',
      subjectCodeOrName: '136',
      studentRoll: '05',
      studentId: 'st-9-05',
      studentName: 'তানভীর হাসান',
    });
    expect(retrieved05.cq).toBe(40);
    expect(retrieved05.mcq).toBe(18);
    expect(retrieved05.practical).toBe(20);
    expect(retrieved05.total).toBe(78);

    // Verify storage keys persisted cleanly
    expect(JSON.parse(localStorage.getItem(OMR_SESSIONS_STORAGE_KEY) || '[]')).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(OMR_SCANS_STORAGE_KEY) || '[]')[0].syncedToMarkEntry).toBe(true);
  });
});
