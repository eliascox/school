/**
 * 100% Client-Side Pure TypeScript OMR Computer Vision Engine
 *
 * Pipeline:
 *  1. Adaptive grayscale + integral image thresholding (shadow & lighting invariant)
 *  2. 4-corner solid black fiducial square detection via connected-component analysis
 *  3. Exact 8-DOF homography solver (Gaussian elimination) + bilinear perspective warp
 *  4. Red-channel/luma pink-dropout + B&W-laser-safe inner-core bubble classifier
 *  5. Blank / Single / Double / Uncertain classification + Dual-frame consensus merger
 *  6. Lightweight live-camera quality gate (4-corner lock, motion stability, sharpness)
 *
 * Zero external servers, zero paid APIs, works offline & in Next.js Static Export.
 */

import {
  OMR_GRADE_OPTIONS,
  OMR_GROUP_OPTIONS,
  OmrBubbleCoord,
  OmrLayoutConfig,
  OmrResolvedLayout,
  getOmrTemplateLayout,
} from './omrTemplates';

export interface Point2D {
  x: number;
  y: number;
}

export interface DetectedCorners {
  tl: Point2D;
  tr: Point2D;
  br: Point2D;
  bl: Point2D;
  confidence: number; // 0..1
}

export interface RgbaImageBuffer {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export type BubbleChoiceStatus = 'filled' | 'blank' | 'double' | 'uncertain';

export interface DecodedQuestionResult {
  questionNumber: number; // 1-based
  selectedIndex: number | null; // 0..3 or null
  filledIndices: number[]; // all indices considered filled (for double-mark visibility)
  status: BubbleChoiceStatus;
  confidence: number; // 0..1
  scores: [number, number, number, number];
}

export interface DecodedRollColumnResult {
  colIndex: number;
  digit: number | null; // 0..9
  status: BubbleChoiceStatus;
  confidence: number;
  scores: number[];
}

export interface OmrDecodeResult {
  success: boolean;
  error?: string;
  corners: DetectedCorners | null;
  decodedRollRaw: string; // e.g. "027" or "0?7"
  rollColumns: DecodedRollColumnResult[];
  rollUncertain: boolean;
  /** 3-digit subject code decoded from on-sheet subject code grid (e.g. "136", or "" if blank) */
  decodedSubjectCodeRaw: string;
  subjectCodeColumns: DecodedRollColumnResult[];
  subjectCodeFilled: boolean;
  subjectCodeUncertain: boolean;
  /** Class/grade decoded from on-sheet grade bubbles ('6th'..'10th' or null if blank) */
  decodedGradeIndex: number | null;
  decodedGrade: '6th' | '7th' | '8th' | '9th' | '10th' | null;
  gradeStatus: BubbleChoiceStatus;
  /** Department/group decoded from on-sheet group bubbles or null if blank */
  decodedGroupIndex: number | null;
  decodedGroup: 'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা' | null;
  groupStatus: BubbleChoiceStatus;
  setIndex: number | null; // 0..3
  setCode: string | null; // 'ক'|'খ'|'গ'|'ঘ' or 'A'|'B'|'C'|'D'
  setStatus: BubbleChoiceStatus;
  questions: DecodedQuestionResult[];
  uncertainQuestions: number[]; // 1-based question numbers
  doubleMarkedQuestions: number[]; // 1-based question numbers
  overallConfidence: number; // 0..1
  warpedBuffer?: RgbaImageBuffer;
}

export interface LiveFrameQualityReport {
  hasFourCorners: boolean;
  cornersNormalized: {
    tl: Point2D;
    tr: Point2D;
    br: Point2D;
    bl: Point2D;
  } | null;
  sharpness: number; // Laplacian variance proxy
  motion: number; // Mean abs diff vs previous frame (0..255)
  paperBrightness: number; // 0..255
  isSharp: boolean;
  isSteady: boolean;
  isWellLit: boolean;
  readyToCapture: boolean;
  hintBn: string;
}

// ─── 1. GRAYSCALE & INTEGRAL IMAGE ───────────────────────────────────────────

function toGrayscaleDownscaled(
  buf: RgbaImageBuffer,
  maxDim: number,
): { gray: Uint8Array; width: number; height: number; scaleX: number; scaleY: number } {
  const { data, width, height } = buf;
  const maxSide = Math.max(width, height);
  const ratio = maxSide > maxDim ? maxDim / maxSide : 1;
  const outW = Math.max(16, Math.round(width * ratio));
  const outH = Math.max(16, Math.round(height * ratio));
  const scaleX = width / outW;
  const scaleY = height / outH;
  const gray = new Uint8Array(outW * outH);

  for (let y = 0; y < outH; y++) {
    const sy = Math.min(height - 1, Math.floor(y * scaleY));
    const rowOff = sy * width;
    const outOff = y * outW;
    for (let x = 0; x < outW; x++) {
      const sx = Math.min(width - 1, Math.floor(x * scaleX));
      const idx = (rowOff + sx) * 4;
      // Standard luminance (R-heavy to keep pink light and black fiducials dark)
      gray[outOff + x] = (data[idx] * 5 + data[idx + 1] * 2 + data[idx + 2]) >> 3;
    }
  }

  return { gray, width: outW, height: outH, scaleX, scaleY };
}

function buildIntegralImage(gray: Uint8Array, w: number, h: number): Float64Array {
  const integral = new Float64Array((w + 1) * (h + 1));
  const stride = w + 1;
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    const gOff = y * w;
    const prevOff = y * stride;
    const currOff = (y + 1) * stride;
    for (let x = 0; x < w; x++) {
      rowSum += gray[gOff + x];
      integral[currOff + x + 1] = integral[prevOff + x + 1] + rowSum;
    }
  }
  return integral;
}

function rectMean(
  integral: Float64Array,
  w: number,
  h: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): number {
  const cx0 = Math.max(0, Math.min(w, x0));
  const cy0 = Math.max(0, Math.min(h, y0));
  const cx1 = Math.max(cx0 + 1, Math.min(w, x1));
  const cy1 = Math.max(cy0 + 1, Math.min(h, y1));
  const stride = w + 1;
  const sum =
    integral[cy1 * stride + cx1] -
    integral[cy0 * stride + cx1] -
    integral[cy1 * stride + cx0] +
    integral[cy0 * stride + cx0];
  return sum / ((cx1 - cx0) * (cy1 - cy0));
}

// ─── 2. FOUR-CORNER FIDUCIAL DETECTOR ────────────────────────────────────────

interface FiducialCandidate {
  cx: number;
  cy: number;
  bw: number;
  bh: number;
  area: number;
  fillRatio: number;
  ringContrast: number;
  score: number;
}

function findCornerCandidatesInRoi(
  gray: Uint8Array,
  integral: Float64Array,
  w: number,
  h: number,
  roiX0: number,
  roiY0: number,
  roiX1: number,
  roiY1: number,
  targetCornerX: number,
  targetCornerY: number,
): FiducialCandidate[] {
  const minSide = Math.min(w, h);
  const minBlobSide = Math.max(5, Math.floor(minSide * 0.011));
  const maxBlobSide = Math.max(14, Math.ceil(minSide * 0.085));
  const minArea = minBlobSide * minBlobSide * 0.55;
  const maxArea = maxBlobSide * maxBlobSide * 1.15;
  const winHalf = Math.max(10, Math.round(minSide * 0.032));

  const roiW = roiX1 - roiX0;
  const roiH = roiY1 - roiY0;
  if (roiW <= 4 || roiH <= 4) return [];

  // Adaptive dark mask inside ROI
  const mask = new Uint8Array(roiW * roiH);
  for (let y = 0; y < roiH; y++) {
    const gy = roiY0 + y;
    for (let x = 0; x < roiW; x++) {
      const gx = roiX0 + x;
      const val = gray[gy * w + gx];
      if (val > 145) continue;
      const localBg = rectMean(integral, w, h, gx - winHalf, gy - winHalf, gx + winHalf, gy + winHalf);
      if (val < Math.min(130, localBg - 28)) {
        mask[y * roiW + x] = 1;
      }
    }
  }

  const visited = new Uint8Array(roiW * roiH);
  const queueX = new Int32Array(roiW * roiH);
  const queueY = new Int32Array(roiW * roiH);
  const candidates: FiducialCandidate[] = [];

  for (let sy = 1; sy < roiH - 1; sy++) {
    for (let sx = 1; sx < roiW - 1; sx++) {
      const startIdx = sy * roiW + sx;
      if (!mask[startIdx] || visited[startIdx]) continue;

      let head = 0;
      let tail = 0;
      queueX[tail] = sx;
      queueY[tail] = sy;
      tail++;
      visited[startIdx] = 1;

      let minX = sx;
      let maxX = sx;
      let minY = sy;
      let maxY = sy;
      let sumX = 0;
      let sumY = 0;
      let count = 0;

      while (head < tail) {
        const cx = queueX[head];
        const cy = queueY[head];
        head++;
        count++;
        sumX += cx;
        sumY += cy;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        // 4-neighbor BFS
        if (cx > 0) {
          const ni = cy * roiW + (cx - 1);
          if (mask[ni] && !visited[ni]) {
            visited[ni] = 1;
            queueX[tail] = cx - 1;
            queueY[tail] = cy;
            tail++;
          }
        }
        if (cx + 1 < roiW) {
          const ni = cy * roiW + (cx + 1);
          if (mask[ni] && !visited[ni]) {
            visited[ni] = 1;
            queueX[tail] = cx + 1;
            queueY[tail] = cy;
            tail++;
          }
        }
        if (cy > 0) {
          const ni = (cy - 1) * roiW + cx;
          if (mask[ni] && !visited[ni]) {
            visited[ni] = 1;
            queueX[tail] = cx;
            queueY[tail] = cy - 1;
            tail++;
          }
        }
        if (cy + 1 < roiH) {
          const ni = (cy + 1) * roiW + cx;
          if (mask[ni] && !visited[ni]) {
            visited[ni] = 1;
            queueX[tail] = cx;
            queueY[tail] = cy + 1;
            tail++;
          }
        }
      }

      if (count < minArea || count > maxArea) continue;
      const bw = maxX - minX + 1;
      const bh = maxY - minY + 1;
      if (bw < minBlobSide || bh < minBlobSide || bw > maxBlobSide || bh > maxBlobSide) continue;

      const aspect = bw / bh;
      if (aspect < 0.62 || aspect > 1.62) continue;

      const fillRatio = count / (bw * bh);
      if (fillRatio < 0.56) continue;

      const gx0 = roiX0 + minX;
      const gy0 = roiY0 + minY;
      const gx1 = roiX0 + maxX + 1;
      const gy1 = roiY0 + maxY + 1;

      const coreMean = rectMean(integral, w, h, gx0, gy0, gx1, gy1);
      const pad = Math.max(3, Math.round(Math.max(bw, bh) * 0.55));
      const outerMean = rectMean(integral, w, h, gx0 - pad, gy0 - pad, gx1 + pad, gy1 + pad);
      const ringContrast = outerMean - coreMean;
      if (ringContrast < 26) continue;

      const cx = roiX0 + sumX / count;
      const cy = roiY0 + sumY / count;

      const distToCorner = Math.hypot(cx - targetCornerX, cy - targetCornerY) / Math.hypot(roiW, roiH);
      const squareScore = 1 - Math.min(1, Math.abs(1 - aspect));
      const score =
        fillRatio * 0.36 +
        squareScore * 0.24 +
        Math.min(1, ringContrast / 110) * 0.25 +
        (1 - Math.min(1, distToCorner)) * 0.15;

      candidates.push({
        cx,
        cy,
        bw,
        bh,
        area: count,
        fillRatio,
        ringContrast,
        score,
      });
    }
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, 6);
}

function cross2D(o: Point2D, a: Point2D, b: Point2D): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/**
 * Detects the 4 solid black corner fiducial squares on an OMR sheet image.
 */
export function detectCornerFiducials(buf: RgbaImageBuffer): DetectedCorners | null {
  const { gray, width: w, height: h, scaleX, scaleY } = toGrayscaleDownscaled(buf, 680);
  const integral = buildIntegralImage(gray, w, h);

  const rx = Math.round(w * 0.36);
  const ry = Math.round(h * 0.34);

  const tlCands = findCornerCandidatesInRoi(gray, integral, w, h, 0, 0, rx, ry, 0, 0);
  const trCands = findCornerCandidatesInRoi(gray, integral, w, h, w - rx, 0, w, ry, w, 0);
  const blCands = findCornerCandidatesInRoi(gray, integral, w, h, 0, h - ry, rx, h, 0, h);
  const brCands = findCornerCandidatesInRoi(gray, integral, w, h, w - rx, h - ry, w, h, w, h);

  if (!tlCands.length || !trCands.length || !blCands.length || !brCands.length) {
    return null;
  }

  let bestQuad: {
    tl: FiducialCandidate;
    tr: FiducialCandidate;
    br: FiducialCandidate;
    bl: FiducialCandidate;
    totalScore: number;
  } | null = null;

  for (const tl of tlCands) {
    for (const tr of trCands) {
      for (const br of brCands) {
        for (const bl of blCands) {
          // Verify convex clockwise quadrilateral TL -> TR -> BR -> BL
          const pTL = { x: tl.cx, y: tl.cy };
          const pTR = { x: tr.cx, y: tr.cy };
          const pBR = { x: br.cx, y: br.cy };
          const pBL = { x: bl.cx, y: bl.cy };

          if (
            cross2D(pTL, pTR, pBR) <= 0 ||
            cross2D(pTR, pBR, pBL) <= 0 ||
            cross2D(pBR, pBL, pTL) <= 0 ||
            cross2D(pBL, pTL, pTR) <= 0
          ) {
            continue;
          }

          const topW = Math.hypot(pTR.x - pTL.x, pTR.y - pTL.y);
          const botW = Math.hypot(pBR.x - pBL.x, pBR.y - pBL.y);
          const leftH = Math.hypot(pBL.x - pTL.x, pBL.y - pTL.y);
          const rightH = Math.hypot(pBR.x - pTR.x, pBR.y - pTR.y);

          if (topW < w * 0.35 || botW < w * 0.35 || leftH < h * 0.35 || rightH < h * 0.35) {
            continue;
          }

          const widthRatio = Math.min(topW, botW) / Math.max(topW, botW);
          const heightRatio = Math.min(leftH, rightH) / Math.max(leftH, rightH);
          if (widthRatio < 0.72 || heightRatio < 0.72) continue;

          // Fiducials should have mutually consistent areas
          const areas = [tl.area, tr.area, br.area, bl.area];
          const minA = Math.min(...areas);
          const maxA = Math.max(...areas);
          const areaConsistency = minA / maxA;
          if (areaConsistency < 0.42) continue;

          // Expect portrait OMR aspect ratio ~ 0.65..0.84 (allow perspective 0.46..1.05)
          const avgW = (topW + botW) / 2;
          const avgH = (leftH + rightH) / 2;
          const sheetAspect = avgW / avgH;
          if (sheetAspect < 0.46 || sheetAspect > 1.05) continue;

          const baseScore = (tl.score + tr.score + br.score + bl.score) / 4;
          const geomScore = widthRatio * 0.35 + heightRatio * 0.35 + areaConsistency * 0.3;
          const totalScore = baseScore * 0.55 + geomScore * 0.45;

          if (!bestQuad || totalScore > bestQuad.totalScore) {
            bestQuad = { tl, tr, br, bl, totalScore };
          }
        }
      }
    }
  }

  if (!bestQuad) return null;

  return {
    tl: { x: bestQuad.tl.cx * scaleX, y: bestQuad.tl.cy * scaleY },
    tr: { x: bestQuad.tr.cx * scaleX, y: bestQuad.tr.cy * scaleY },
    br: { x: bestQuad.br.cx * scaleX, y: bestQuad.br.cy * scaleY },
    bl: { x: bestQuad.bl.cx * scaleX, y: bestQuad.bl.cy * scaleY },
    confidence: Math.max(0, Math.min(1, bestQuad.totalScore)),
  };
}

// ─── 3. 8-DOF HOMOGRAPHY SOLVER & BILINEAR PERSPECTIVE WARP ──────────────────

/**
 * Solves 3x3 homography matrix H mapping dst (canonical) -> src (original photo).
 */
export function computeHomography(
  srcPts: [Point2D, Point2D, Point2D, Point2D],
  dstPts: [Point2D, Point2D, Point2D, Point2D],
): Float64Array | null {
  // Solve A * h = b for 8 unknowns [h0..h7], h8 = 1
  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const x = dstPts[i].x;
    const y = dstPts[i].y;
    const u = srcPts[i].x;
    const v = srcPts[i].y;

    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }

  // Gaussian elimination with partial pivoting
  const n = 8;
  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxVal = Math.abs(A[col][col]);
    for (let r = col + 1; r < n; r++) {
      const val = Math.abs(A[r][col]);
      if (val > maxVal) {
        maxVal = val;
        pivotRow = r;
      }
    }
    if (maxVal < 1e-10) return null;

    if (pivotRow !== col) {
      [A[col], A[pivotRow]] = [A[pivotRow], A[col]];
      [b[col], b[pivotRow]] = [b[pivotRow], b[col]];
    }

    const pivot = A[col][col];
    for (let r = col + 1; r < n; r++) {
      const factor = A[r][col] / pivot;
      for (let c = col; c < n; c++) {
        A[r][c] -= factor * A[col][c];
      }
      b[r] -= factor * b[col];
    }
  }

  const h = new Float64Array(9);
  for (let r = n - 1; r >= 0; r--) {
    let sum = b[r];
    for (let c = r + 1; c < n; c++) {
      sum -= A[r][c] * h[c];
    }
    h[r] = sum / A[r][r];
  }
  h[8] = 1;
  return h;
}

/**
 * Perspective-warps the fiducial-bounded sheet region onto a clean canonical RGBA buffer.
 */
export function warpSheetToCanonical(
  src: RgbaImageBuffer,
  corners: DetectedCorners,
  canonicalWidth: number,
  canonicalHeight: number,
): RgbaImageBuffer | null {
  const dstPts: [Point2D, Point2D, Point2D, Point2D] = [
    { x: 0, y: 0 },
    { x: canonicalWidth - 1, y: 0 },
    { x: canonicalWidth - 1, y: canonicalHeight - 1 },
    { x: 0, y: canonicalHeight - 1 },
  ];
  const srcPts: [Point2D, Point2D, Point2D, Point2D] = [
    corners.tl,
    corners.tr,
    corners.br,
    corners.bl,
  ];

  const H = computeHomography(srcPts, dstPts);
  if (!H) return null;

  const outData = new Uint8ClampedArray(canonicalWidth * canonicalHeight * 4);
  const { data: sData, width: sW, height: sH } = src;
  const maxSx = sW - 2;
  const maxSy = sH - 2;

  const h0 = H[0], h1 = H[1], h2 = H[2];
  const h3 = H[3], h4 = H[4], h5 = H[5];
  const h6 = H[6], h7 = H[7], h8 = H[8];

  for (let y = 0; y < canonicalHeight; y++) {
    const h1y = h1 * y + h2;
    const h4y = h4 * y + h5;
    const h7y = h7 * y + h8;
    const rowOff = y * canonicalWidth;

    for (let x = 0; x < canonicalWidth; x++) {
      const denom = h6 * x + h7y;
      if (Math.abs(denom) < 1e-8) continue;

      const sx = (h0 * x + h1y) / denom;
      const sy = (h3 * x + h4y) / denom;

      const oIdx = (rowOff + x) * 4;
      if (sx < 0 || sy < 0 || sx > maxSx || sy > maxSy) {
        outData[oIdx] = 255;
        outData[oIdx + 1] = 255;
        outData[oIdx + 2] = 255;
        outData[oIdx + 3] = 255;
        continue;
      }

      const x0 = sx | 0;
      const y0 = sy | 0;
      const fx = sx - x0;
      const fy = sy - y0;
      const fx1 = 1 - fx;
      const fy1 = 1 - fy;

      const w00 = fx1 * fy1;
      const w10 = fx * fy1;
      const w01 = fx1 * fy;
      const w11 = fx * fy;

      const i00 = (y0 * sW + x0) * 4;
      const i10 = i00 + 4;
      const i01 = i00 + sW * 4;
      const i11 = i01 + 4;

      outData[oIdx] = (sData[i00] * w00 + sData[i10] * w10 + sData[i01] * w01 + sData[i11] * w11) | 0;
      outData[oIdx + 1] =
        (sData[i00 + 1] * w00 + sData[i10 + 1] * w10 + sData[i01 + 1] * w01 + sData[i11 + 1] * w11) | 0;
      outData[oIdx + 2] =
        (sData[i00 + 2] * w00 + sData[i10 + 2] * w10 + sData[i01 + 2] * w01 + sData[i11 + 2] * w11) | 0;
      outData[oIdx + 3] = 255;
    }
  }

  return {
    data: outData,
    width: canonicalWidth,
    height: canonicalHeight,
  };
}

// ─── 4. PINK-DROPOUT + B&W-SAFE BUBBLE SAMPLER & CLASSIFIER ──────────────────

/**
 * Computes a normalized darkness fill score [0..1] for a bubble in canonical space.
 *
 * Uses Red-dominant channel (0.85*R + 0.15*G):
 *  - White paper -> ~245 (bright)
 *  - Pink dropout ink (#d4146e) -> ~185 (bright, effectively drops out!)
 *  - Black OR Blue ballpoint pen -> ~20-45 (deeply dark!)
 *
 * Samples strictly inside the inner 68% core disc (excluding the outer printed ring)
 * and compares against the local bright paper percentile around the bubble so
 * shadows, uneven lighting, and B&W laser prints all decode cleanly.
 */
function sampleBubbleFillScore(warped: RgbaImageBuffer, bubble: OmrBubbleCoord): number {
  const { data, width: w, height: h } = warped;
  const cx = bubble.u * (w - 1);
  const cy = bubble.v * (h - 1);
  const rPx = ((bubble.rU * w) + (bubble.rV * h)) / 2;

  // Inner core radius (excludes printed circle border)
  const coreR = Math.max(2.2, rPx * 0.68);
  const coreR2 = coreR * coreR;

  // Local paper reference ring just outside the bubble (1.35R .. 1.85R)
  const bgInnerR2 = (rPx * 1.32) * (rPx * 1.32);
  const bgOuterR = rPx * 1.88;
  const bgOuterR2 = bgOuterR * bgOuterR;

  const minX = Math.max(0, Math.floor(cx - bgOuterR));
  const maxX = Math.min(w - 1, Math.ceil(cx + bgOuterR));
  const minY = Math.max(0, Math.floor(cy - bgOuterR));
  const maxY = Math.min(h - 1, Math.ceil(cy + bgOuterR));

  const bgSamples: number[] = [];
  const coreSamples: number[] = [];

  for (let y = minY; y <= maxY; y++) {
    const dy = y - cy;
    const dy2 = dy * dy;
    const rowOff = y * w;
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const d2 = dx * dx + dy2;
      if (d2 > bgOuterR2) continue;

      const idx = (rowOff + x) * 4;
      // Red-dominant channel drops out pink ink while preserving black & blue ink
      const signal = data[idx] * 0.85 + data[idx + 1] * 0.15;

      if (d2 <= coreR2) {
        coreSamples.push(signal);
      } else if (d2 >= bgInnerR2) {
        bgSamples.push(signal);
      }
    }
  }

  if (coreSamples.length === 0) return 0;

  // 75th percentile of local ring = clean paper white even if adjacent bubble is dark
  let localPaper = 235;
  if (bgSamples.length >= 6) {
    bgSamples.sort((a, b) => a - b);
    localPaper = bgSamples[Math.floor(bgSamples.length * 0.78)];
  }
  localPaper = Math.max(95, localPaper);

  // Dark threshold relative to local paper
  const darkCutoff = localPaper - Math.max(36, localPaper * 0.25);
  let darkCount = 0;
  let darknessSum = 0;

  for (let i = 0; i < coreSamples.length; i++) {
    const s = coreSamples[i];
    if (s < darkCutoff) {
      darkCount++;
    }
    const drop = Math.max(0, localPaper - s) / localPaper;
    darknessSum += drop;
  }

  const darkRatio = darkCount / coreSamples.length;
  const meanDrop = darknessSum / coreSamples.length;

  // Weighted fill score: 65% dark pixel coverage + 35% mean intensity drop
  return Math.max(0, Math.min(1, darkRatio * 0.65 + meanDrop * 0.35));
}

function classifyBubbleGroup(scores: number[]): {
  selectedIndex: number | null;
  filledIndices: number[];
  status: BubbleChoiceStatus;
  confidence: number;
} {
  if (scores.length === 0) {
    return { selectedIndex: null, filledIndices: [], status: 'blank', confidence: 1 };
  }

  const indexed = scores.map((score, idx) => ({ score, idx })).sort((a, b) => b.score - a.score);
  const top1 = indexed[0];
  const top2 = indexed[1] ?? { score: 0, idx: -1 };

  // Baseline = median of non-top bubbles (absorbs any faint B&W printed letter inside bubble)
  const restScores = indexed.slice(1).map((x) => x.score);
  const baseline =
    restScores.length > 0
      ? Math.min(0.24, restScores[Math.floor(restScores.length / 2)])
      : 0.08;

  const delta1 = top1.score - baseline;
  const delta2 = top2.score - baseline;

  // Blank check
  if (top1.score < 0.24 || delta1 < 0.13) {
    // Borderline faint smudge? Mark uncertain if slightly above empty noise
    if (top1.score >= 0.18 && delta1 >= 0.095) {
      return {
        selectedIndex: null,
        filledIndices: [],
        status: 'uncertain',
        confidence: 0.45,
      };
    }
    return {
      selectedIndex: null,
      filledIndices: [],
      status: 'blank',
      confidence: Math.max(0.75, 1 - top1.score * 2),
    };
  }

  // Double-mark check (two or more bubbles significantly filled)
  const filledIndices = indexed
    .filter((item) => item.score >= 0.27 && item.score - baseline >= 0.16 && item.score - baseline >= delta1 * 0.56)
    .map((item) => item.idx);

  if (filledIndices.length >= 2 || (top2.score >= 0.28 && delta2 >= 0.17 && delta2 >= delta1 * 0.58)) {
    return {
      selectedIndex: null,
      filledIndices: filledIndices.length >= 2 ? filledIndices : [top1.idx, top2.idx],
      status: 'double',
      confidence: 0.9,
    };
  }

  // Confident single fill
  const separation = top1.score - top2.score;
  if (top1.score >= 0.30 && delta1 >= 0.19 && separation >= 0.12) {
    const conf = Math.max(0.75, Math.min(0.99, 0.55 + delta1 * 0.75 + separation * 0.3));
    return {
      selectedIndex: top1.idx,
      filledIndices: [top1.idx],
      status: 'filled',
      confidence: conf,
    };
  }

  // Faint or borderline single mark -> flag uncertain for quick visual review
  return {
    selectedIndex: top1.idx,
    filledIndices: [top1.idx],
    status: 'uncertain',
    confidence: Math.max(0.35, Math.min(0.72, 0.35 + delta1)),
  };
}

/**
 * Decodes an already-warped canonical OMR image buffer against the exact layout.
 */
export function decodeCanonicalOmrBuffer(
  warped: RgbaImageBuffer,
  layout: OmrResolvedLayout,
  corners: DetectedCorners | null = null,
): OmrDecodeResult {
  // 1. Roll columns
  const rollColumns: DecodedRollColumnResult[] = [];
  let decodedRollRaw = '';
  let rollUncertain = false;

  for (let c = 0; c < layout.rollBubbles.length; c++) {
    const colBubbles = layout.rollBubbles[c];
    const scores = colBubbles.map((b) => sampleBubbleFillScore(warped, b));
    const cls = classifyBubbleGroup(scores);
    rollColumns.push({
      colIndex: c,
      digit: cls.selectedIndex,
      status: cls.status,
      confidence: cls.confidence,
      scores,
    });
    if (cls.selectedIndex !== null && cls.status === 'filled') {
      decodedRollRaw += String(cls.selectedIndex);
    } else if (cls.selectedIndex !== null && cls.status === 'uncertain') {
      decodedRollRaw += String(cls.selectedIndex);
      rollUncertain = true;
    } else {
      decodedRollRaw += '?';
      rollUncertain = true;
    }
  }

  // 2. 3-Digit Subject Code columns (optional if left completely blank on older sheets)
  const subjectCodeColumns: DecodedRollColumnResult[] = [];
  let rawSubDigits = '';
  let anySubColMarked = false;
  let subjectCodeUncertain = false;

  for (let c = 0; c < layout.subjectCodeBubbles.length; c++) {
    const colBubbles = layout.subjectCodeBubbles[c];
    const scores = colBubbles.map((b) => sampleBubbleFillScore(warped, b));
    const cls = classifyBubbleGroup(scores);
    subjectCodeColumns.push({
      colIndex: c,
      digit: cls.selectedIndex,
      status: cls.status,
      confidence: cls.confidence,
      scores,
    });
    if (cls.status !== 'blank') anySubColMarked = true;
    if (cls.selectedIndex !== null && cls.status === 'filled') {
      rawSubDigits += String(cls.selectedIndex);
    } else if (cls.selectedIndex !== null && cls.status === 'uncertain') {
      rawSubDigits += String(cls.selectedIndex);
      subjectCodeUncertain = true;
    } else {
      rawSubDigits += '?';
      if (cls.status !== 'blank') subjectCodeUncertain = true;
    }
  }
  const decodedSubjectCodeRaw = anySubColMarked ? rawSubDigits : '';
  if (anySubColMarked && rawSubDigits.includes('?')) {
    subjectCodeUncertain = true;
  }

  // 3. Class / Grade bubbles (6th..10th)
  let decodedGradeIndex: number | null = null;
  let decodedGrade: '6th' | '7th' | '8th' | '9th' | '10th' | null = null;
  let gradeStatus: BubbleChoiceStatus = 'blank';
  if (layout.gradeBubbles.length === OMR_GRADE_OPTIONS.length) {
    const gradeScores = layout.gradeBubbles.map((b) => sampleBubbleFillScore(warped, b));
    const gradeCls = classifyBubbleGroup(gradeScores);
    decodedGradeIndex = gradeCls.selectedIndex;
    decodedGrade =
      decodedGradeIndex !== null ? OMR_GRADE_OPTIONS[decodedGradeIndex]?.id ?? null : null;
    gradeStatus = gradeCls.status;
  }

  // 4. Department / Group bubbles (সাধারণ, বিজ্ঞান, মানবিক, ব্যবসায় শিক্ষা)
  let decodedGroupIndex: number | null = null;
  let decodedGroup: 'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা' | null = null;
  let groupStatus: BubbleChoiceStatus = 'blank';
  if (layout.groupBubbles.length === OMR_GROUP_OPTIONS.length) {
    const groupScores = layout.groupBubbles.map((b) => sampleBubbleFillScore(warped, b));
    const groupCls = classifyBubbleGroup(groupScores);
    decodedGroupIndex = groupCls.selectedIndex;
    decodedGroup =
      decodedGroupIndex !== null ? OMR_GROUP_OPTIONS[decodedGroupIndex]?.id ?? null : null;
    groupStatus = groupCls.status;
  }

  // 5. Set code (optional 4-set grid)
  let setIndex: number | null = null;
  let setCode: string | null = null;
  let setStatus: BubbleChoiceStatus = 'blank';
  if (layout.setCount === 4 && layout.setBubbles.length === 4) {
    const setScores = layout.setBubbles.map((b) => sampleBubbleFillScore(warped, b));
    const setCls = classifyBubbleGroup(setScores);
    setIndex = setCls.selectedIndex;
    setCode = setIndex !== null ? layout.setLabels[setIndex] ?? null : null;
    setStatus = setCls.status;
  }

  // 6. MCQ questions
  const questions: DecodedQuestionResult[] = [];
  const uncertainQuestions: number[] = [];
  const doubleMarkedQuestions: number[] = [];
  let confSum = 0;

  for (let q = 0; q < layout.questionBubbles.length; q++) {
    const rowBubbles = layout.questionBubbles[q];
    const scores = rowBubbles.map((b) => sampleBubbleFillScore(warped, b)) as [number, number, number, number];
    const cls = classifyBubbleGroup(scores);
    const qNum = q + 1;

    questions.push({
      questionNumber: qNum,
      selectedIndex: cls.selectedIndex,
      filledIndices: cls.filledIndices,
      status: cls.status,
      confidence: cls.confidence,
      scores,
    });

    confSum += cls.confidence;
    if (cls.status === 'uncertain') uncertainQuestions.push(qNum);
    if (cls.status === 'double') doubleMarkedQuestions.push(qNum);
  }

  const overallConfidence =
    questions.length > 0 ? Number((confSum / questions.length).toFixed(3)) : 0;

  return {
    success: true,
    corners,
    decodedRollRaw,
    rollColumns,
    rollUncertain,
    decodedSubjectCodeRaw,
    subjectCodeColumns,
    subjectCodeFilled: anySubColMarked,
    subjectCodeUncertain,
    decodedGradeIndex,
    decodedGrade,
    gradeStatus,
    decodedGroupIndex,
    decodedGroup,
    groupStatus,
    setIndex,
    setCode,
    setStatus,
    questions,
    uncertainQuestions,
    doubleMarkedQuestions,
    overallConfidence,
    warpedBuffer: warped,
  };
}

/**
 * Full end-to-end decode of a raw camera frame, uploaded photo, or PDF page buffer.
 */
export function decodeOmrImageBuffer(
  src: RgbaImageBuffer,
  config: OmrLayoutConfig,
  preDetectedCorners?: DetectedCorners | null,
): OmrDecodeResult {
  const layout = getOmrTemplateLayout(config);
  const corners = preDetectedCorners ?? detectCornerFiducials(src);

  const makeFailure = (error: string, detected: DetectedCorners | null): OmrDecodeResult => ({
    success: false,
    error,
    corners: detected,
    decodedRollRaw: '?'.repeat(layout.rollDigits),
    rollColumns: [],
    rollUncertain: true,
    decodedSubjectCodeRaw: '',
    subjectCodeColumns: [],
    subjectCodeFilled: false,
    subjectCodeUncertain: false,
    decodedGradeIndex: null,
    decodedGrade: null,
    gradeStatus: 'blank',
    decodedGroupIndex: null,
    decodedGroup: null,
    groupStatus: 'blank',
    setIndex: null,
    setCode: null,
    setStatus: 'blank',
    questions: [],
    uncertainQuestions: [],
    doubleMarkedQuestions: [],
    overallConfidence: 0,
  });

  if (!corners) {
    return makeFailure(
      'OMR শিটের ৪ কোণার কালো বর্গাকার চিহ্ন (Fiducial Marks) সঠিকভাবে পাওয়া যায়নি। শিটটি সোজা ও পর্যাপ্ত আলোতে ধরে আবার চেষ্টা করুন।',
      null,
    );
  }

  const warped = warpSheetToCanonical(
    src,
    corners,
    layout.canonicalWidthPx,
    layout.canonicalHeightPx,
  );

  if (!warped) {
    return makeFailure(
      'শিটের পার্সপেক্টিভ সংশোধন (Homography) সম্পন্ন করা যায়নি। ক্যামেরা সোজা রেখে আবার চেষ্টা করুন।',
      corners,
    );
  }

  return decodeCanonicalOmrBuffer(warped, layout, corners);
}

// ─── 5. DUAL-FRAME CONSENSUS VERIFIER ────────────────────────────────────────

/**
 * Merges two consecutive live-camera decodes. Any roll digit, subject code digit,
 * class, group, set code, or MCQ where Frame 1 and Frame 2 disagree is explicitly
 * flagged as `uncertain` instead of guessing silently.
 */
export function mergeDualFrameDecodes(
  frame1: OmrDecodeResult,
  frame2: OmrDecodeResult,
): OmrDecodeResult {
  if (!frame1.success) return frame2;
  if (!frame2.success) return frame1;

  // Roll consensus
  const rollColumns: DecodedRollColumnResult[] = frame2.rollColumns.map((c2, idx) => {
    const c1 = frame1.rollColumns[idx];
    if (c1 && c1.digit !== c2.digit) {
      return {
        ...c2,
        status: 'uncertain',
        confidence: Math.min(c1.confidence, c2.confidence) * 0.65,
      };
    }
    return c2;
  });

  let decodedRollRaw = '';
  let rollUncertain = false;
  for (const col of rollColumns) {
    if (col.digit !== null && col.status === 'filled') {
      decodedRollRaw += String(col.digit);
    } else if (col.digit !== null && col.status === 'uncertain') {
      decodedRollRaw += String(col.digit);
      rollUncertain = true;
    } else {
      decodedRollRaw += '?';
      rollUncertain = true;
    }
  }

  // Subject Code consensus
  const subjectCodeColumns: DecodedRollColumnResult[] = frame2.subjectCodeColumns.map((c2, idx) => {
    const c1 = frame1.subjectCodeColumns[idx];
    if (c1 && c1.digit !== c2.digit) {
      return {
        ...c2,
        status: 'uncertain',
        confidence: Math.min(c1.confidence, c2.confidence) * 0.65,
      };
    }
    return c2;
  });

  const subjectCodeFilled = frame1.subjectCodeFilled || frame2.subjectCodeFilled;
  let decodedSubjectCodeRaw = '';
  let subjectCodeUncertain = false;
  if (subjectCodeFilled) {
    for (const col of subjectCodeColumns) {
      if (col.digit !== null && col.status === 'filled') {
        decodedSubjectCodeRaw += String(col.digit);
      } else if (col.digit !== null && col.status === 'uncertain') {
        decodedSubjectCodeRaw += String(col.digit);
        subjectCodeUncertain = true;
      } else {
        decodedSubjectCodeRaw += '?';
        subjectCodeUncertain = true;
      }
    }
  }

  // Class, Group, Set consensus
  const gradeDisagrees = frame1.decodedGrade !== frame2.decodedGrade;
  const gradeStatus: BubbleChoiceStatus = gradeDisagrees ? 'uncertain' : frame2.gradeStatus;

  const groupDisagrees = frame1.decodedGroup !== frame2.decodedGroup;
  const groupStatus: BubbleChoiceStatus = groupDisagrees ? 'uncertain' : frame2.groupStatus;

  const setDisagrees = frame1.setIndex !== frame2.setIndex;
  const setStatus: BubbleChoiceStatus = setDisagrees ? 'uncertain' : frame2.setStatus;

  // Questions consensus
  const uncertainQuestions: number[] = [];
  const doubleMarkedQuestions: number[] = [];
  const questions: DecodedQuestionResult[] = frame2.questions.map((q2, idx) => {
    const q1 = frame1.questions[idx];
    if (!q1) return q2;

    const agrees = q1.selectedIndex === q2.selectedIndex && q1.status === q2.status;
    let status = q2.status;
    let confidence = q2.confidence;

    if (!agrees) {
      status = 'uncertain';
      confidence = Math.min(q1.confidence, q2.confidence) * 0.6;
    } else if (status === 'filled') {
      confidence = Math.min(0.995, (q1.confidence + q2.confidence) / 2 + 0.04);
    }

    if (status === 'uncertain') uncertainQuestions.push(q2.questionNumber);
    if (status === 'double') doubleMarkedQuestions.push(q2.questionNumber);

    return {
      ...q2,
      status,
      confidence,
    };
  });

  const overallConfidence =
    questions.length > 0
      ? Number((questions.reduce((s, q) => s + q.confidence, 0) / questions.length).toFixed(3))
      : frame2.overallConfidence;

  return {
    ...frame2,
    decodedRollRaw,
    rollColumns,
    rollUncertain,
    decodedSubjectCodeRaw,
    subjectCodeColumns,
    subjectCodeFilled,
    subjectCodeUncertain,
    gradeStatus,
    groupStatus,
    setStatus,
    questions,
    uncertainQuestions,
    doubleMarkedQuestions,
    overallConfidence,
  };
}

// ─── 6. LIVE CAMERA QUALITY GATE (FAST ~15ms LOOP) ───────────────────────────

/**
 * Evaluates a live camera preview frame for 4-corner detection, sharpness
 * (Laplacian variance), lighting brightness, and motion stability against
 * the previous frame's downscaled grayscale buffer.
 */
export function evaluateLiveFrameQuality(
  buf: RgbaImageBuffer,
  prevSmallGray: Uint8Array | null,
): { report: LiveFrameQualityReport; smallGray: Uint8Array } {
  // Motion + sharpness + brightness on fast 160px grayscale
  const small = toGrayscaleDownscaled(buf, 160);
  const { gray, width: sw, height: sh } = small;

  let brightSum = 0;
  for (let i = 0; i < gray.length; i++) brightSum += gray[i];
  const paperBrightness = gray.length > 0 ? brightSum / gray.length : 0;

  let motion = 0;
  if (prevSmallGray && prevSmallGray.length === gray.length) {
    let diffSum = 0;
    for (let i = 0; i < gray.length; i++) {
      diffSum += Math.abs(gray[i] - prevSmallGray[i]);
    }
    motion = diffSum / gray.length;
  } else {
    motion = 99;
  }

  // Laplacian sharpness variance inside central 70% area
  let lapSum = 0;
  let lapSqSum = 0;
  let lapCount = 0;
  const xStart = Math.floor(sw * 0.15);
  const xEnd = Math.ceil(sw * 0.85);
  const yStart = Math.floor(sh * 0.15);
  const yEnd = Math.ceil(sh * 0.85);

  for (let y = Math.max(1, yStart); y < Math.min(sh - 1, yEnd); y++) {
    const row = y * sw;
    for (let x = Math.max(1, xStart); x < Math.min(sw - 1, xEnd); x++) {
      const idx = row + x;
      const lap =
        gray[idx - 1] +
        gray[idx + 1] +
        gray[idx - sw] +
        gray[idx + sw] -
        4 * gray[idx];
      lapSum += lap;
      lapSqSum += lap * lap;
      lapCount++;
    }
  }
  const lapMean = lapCount > 0 ? lapSum / lapCount : 0;
  const sharpness = lapCount > 0 ? lapSqSum / lapCount - lapMean * lapMean : 0;

  // 4-corner detection
  const corners = detectCornerFiducials(buf);
  const hasFourCorners = Boolean(corners && corners.confidence >= 0.45);
  const isWellLit = paperBrightness >= 75 && paperBrightness <= 248;
  const isSteady = motion <= 6.5;
  const isSharp = sharpness >= 24;
  const readyToCapture = hasFourCorners && isWellLit && isSteady && isSharp;

  let hintBn = 'OMR শিটটি ফ্রেমের ভেতর ৪ কোণার কালো চিহ্নসহ ধরুন';
  if (!isWellLit) {
    hintBn = paperBrightness < 75 ? 'আলো কম — টর্চ/ফ্ল্যাশ চালু করুন' : 'অতিরিক্ত ঝলকানি — একটু কোণ পরিবর্তন করুন';
  } else if (!hasFourCorners) {
    hintBn = 'শিটের ৪ কোণার কালো স্কয়ার পুরোপুরি ফ্রেমে রাখুন';
  } else if (!isSteady) {
    hintBn = 'হাত স্থির রাখুন...';
  } else if (!isSharp) {
    hintBn = 'ফোকাস হচ্ছে — একটু স্থির থাকুন...';
  } else {
    hintBn = 'নিখুঁত! স্ক্যান হচ্ছে...';
  }

  return {
    smallGray: gray,
    report: {
      hasFourCorners,
      cornersNormalized: corners
        ? {
            tl: { x: corners.tl.x / buf.width, y: corners.tl.y / buf.height },
            tr: { x: corners.tr.x / buf.width, y: corners.tr.y / buf.height },
            br: { x: corners.br.x / buf.width, y: corners.br.y / buf.height },
            bl: { x: corners.bl.x / buf.width, y: corners.bl.y / buf.height },
          }
        : null,
      sharpness: Math.round(sharpness),
      motion: Number(motion.toFixed(1)),
      paperBrightness: Math.round(paperBrightness),
      isSharp,
      isSteady,
      isWellLit,
      readyToCapture,
      hintBn,
    },
  };
}

/**
 * Helper (Browser-only): Converts a warped RGBA buffer into a compact JPEG data URL
 * for local visual review & tap-to-fix overlay modal.
 */
export function warpedBufferToDataUrl(
  warped: RgbaImageBuffer,
  maxWidth: number = 640,
  quality: number = 0.78,
): string | undefined {
  if (typeof document === 'undefined') return undefined;
  try {
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = warped.width;
    srcCanvas.height = warped.height;
    const sCtx = srcCanvas.getContext('2d');
    if (!sCtx) return undefined;
    const imgData = new ImageData(new Uint8ClampedArray(warped.data), warped.width, warped.height);
    sCtx.putImageData(imgData, 0, 0);

    if (warped.width <= maxWidth) {
      return srcCanvas.toDataURL('image/jpeg', quality);
    }
    const scale = maxWidth / warped.width;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = maxWidth;
    outCanvas.height = Math.round(warped.height * scale);
    const oCtx = outCanvas.getContext('2d');
    if (!oCtx) return srcCanvas.toDataURL('image/jpeg', quality);
    oCtx.drawImage(srcCanvas, 0, 0, outCanvas.width, outCanvas.height);
    return outCanvas.toDataURL('image/jpeg', quality);
  } catch {
    return undefined;
  }
}
