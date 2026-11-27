/**
 * Ephemeral High-Resolution (300 DPI / 600 DPI) Client-Side Canvas Renderer & Pure-TS PDF 1.4 Composer.
 *
 * ZERO-SERVER-SPACE ARCHITECTURE:
 * - Every PDF and PNG is synthesized strictly in transient browser memory.
 * - ZERO bytes are uploaded to Firebase Storage, Firestore, or any server disk.
 * - Immediately after handing the Blob to the browser download manager, every offscreen canvas
 *   is collapsed to 0x0 and ObjectURLs are revoked so RAM & disk stay completely clean.
 */

import QRCode from 'qrcode';
import type { Student } from '@/services/studentService';
import {
  type SchoolSettings,
  getEnglishAddress,
  getEnglishPrincipalTitleFromSettings,
  getEnglishSchoolName,
} from '@/services/settingsService';
import { toAsciiDigits, toBanglaDigits } from '@/lib/omr/omrTemplates';
import {
  type IdCardDocLang,
  type IdCardTemplateConfig,
  getIdCardGradeLabel,
  getIdCardScopeLabel,
} from './idCardTemplateTypes';
import {
  type IdCardPageSettings,
  type IdCardPrintSheetPage,
  type SheetGridMetrics,
  mmToPx,
} from './idCardLayoutUtils';

export interface PdfJpegPageInput {
  jpegBytes: Uint8Array;
  pixelWidth: number;
  pixelHeight: number;
  pageWidthMm: number;
  pageHeightMm: number;
}

export interface EphemeralExportReceipt {
  fileName: string;
  pageCount: number;
  dpi: number;
  fileBytes: number;
  serverBytesUsed: 0;
  memoryPurged: true;
}

const MM_TO_PDF_PT = 72 / 25.4;

/**
 * Pure TypeScript PDF 1.4 composer — embeds high-DPI JPEG page streams into millimeter-exact
 * PDF MediaBox pages without any heavy third-party dependency or server round-trip.
 */
export function composePdfFromJpegPages(pages: PdfJpegPageInput[]): Uint8Array {
  if (pages.length === 0) {
    throw new Error('PDF তৈরির জন্য কোনো পেইজ পাওয়া যায়নি।');
  }

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let offset = 0;

  const pushStr = (s: string) => {
    const bytes = encoder.encode(s);
    chunks.push(bytes);
    offset += bytes.length;
  };
  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    offset += bytes.length;
  };

  // Header with binary marker comment
  pushStr('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  // Object layout:
  // 1 = Catalog, 2 = Pages
  // For each page i (0..N-1):
  //   pageObj = 3 + i * 3
  //   imgObj  = 4 + i * 3
  //   cntObj  = 5 + i * 3
  const totalObjects = 2 + pages.length * 3;
  const xrefOffsets: number[] = new Array(totalObjects + 1).fill(0);

  // 1 0 obj: Catalog
  xrefOffsets[1] = offset;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // 2 0 obj: Pages
  const kidsRefs = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  xrefOffsets[2] = offset;
  pushStr(`2 0 obj\n<< /Type /Pages /Count ${pages.length} /Kids [ ${kidsRefs} ] >>\nendobj\n`);

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const pageObjId = 3 + i * 3;
    const imgObjId = 4 + i * 3;
    const cntObjId = 5 + i * 3;

    const wPt = (p.pageWidthMm * MM_TO_PDF_PT).toFixed(2);
    const hPt = (p.pageHeightMm * MM_TO_PDF_PT).toFixed(2);

    // Page object
    xrefOffsets[pageObjId] = offset;
    pushStr(
      `${pageObjId} 0 obj\n` +
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt} ${hPt}] ` +
        `/Resources << /XObject << /Im0 ${imgObjId} 0 R >> >> /Contents ${cntObjId} 0 R >>\n` +
        `endobj\n`,
    );

    // High-DPI JPEG Image XObject
    xrefOffsets[imgObjId] = offset;
    pushStr(
      `${imgObjId} 0 obj\n` +
        `<< /Type /XObject /Subtype /Image /Width ${p.pixelWidth} /Height ${p.pixelHeight} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpegBytes.length} >>\n` +
        `stream\n`,
    );
    pushBytes(p.jpegBytes);
    pushStr('\nendstream\nendobj\n');

    // Content stream stretching image to exact MediaBox dimensions
    const contentStream = `q\n${wPt} 0 0 ${hPt} 0 0 cm\n/Im0 Do\nQ\n`;
    const contentBytes = encoder.encode(contentStream);
    xrefOffsets[cntObjId] = offset;
    pushStr(`${cntObjId} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
    pushBytes(contentBytes);
    pushStr('endstream\nendobj\n');
  }

  // XRef table
  const xrefStart = offset;
  pushStr(`xref\n0 ${totalObjects + 1}\n`);
  pushStr('0000000000 65535 f \n');
  for (let id = 1; id <= totalObjects; id++) {
    pushStr(`${String(xrefOffsets[id]).padStart(10, '0')} 00000 n \n`);
  }

  // Trailer
  pushStr(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`,
  );

  // Merge chunks into single Uint8Array
  const out = new Uint8Array(offset);
  let cursor = 0;
  for (const chunk of chunks) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }
  chunks.length = 0;
  return out;
}

function loadCanvasImage(src: string | undefined): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const imgRatio = img.naturalWidth / Math.max(1, img.naturalHeight);
  const boxRatio = w / Math.max(1, h);
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (imgRatio > boxRatio) {
    sw = img.naturalHeight * boxRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / boxRatio;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function fitTextEllipsis(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}…`;
}

function drawCropMarks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  pxPerMm: number,
) {
  const len = 2.6 * pxPerMm;
  const off = 0.8 * pxPerMm;
  ctx.save();
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = Math.max(1, 0.22 * pxPerMm);
  ctx.beginPath();
  // Top-left
  ctx.moveTo(x - off - len, y);
  ctx.lineTo(x - off, y);
  ctx.moveTo(x, y - off - len);
  ctx.lineTo(x, y - off);
  // Top-right
  ctx.moveTo(x + w + off, y);
  ctx.lineTo(x + w + off + len, y);
  ctx.moveTo(x + w, y - off - len);
  ctx.lineTo(x + w, y - off);
  // Bottom-left
  ctx.moveTo(x - off - len, y + h);
  ctx.lineTo(x - off, y + h);
  ctx.moveTo(x, y + h + off);
  ctx.lineTo(x, y + h + off + len);
  // Bottom-right
  ctx.moveTo(x + w + off, y + h);
  ctx.lineTo(x + w + off + len, y + h);
  ctx.moveTo(x + w, y + h + off);
  ctx.lineTo(x + w, y + h + off + len);
  ctx.stroke();
  ctx.restore();
}

interface RenderCardFaceArgs {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  w: number;
  h: number;
  pxPerMm: number;
  student: Student;
  settings: SchoolSettings;
  template: IdCardTemplateConfig;
  docLang: IdCardDocLang;
  sessionYear: string;
  side: 'front' | 'back';
  logoImg: HTMLImageElement | null;
  frontBgImg: HTMLImageElement | null;
  backBgImg: HTMLImageElement | null;
  signatureImg: HTMLImageElement | null;
}

async function drawSingleCardFace({
  ctx,
  x,
  y,
  w,
  h,
  pxPerMm,
  student,
  settings,
  template,
  docLang,
  sessionYear,
  side,
  logoImg,
  frontBgImg,
  backBgImg,
  signatureImg,
}: RenderCardFaceArgs): Promise<void> {
  const isEn = docLang === 'en';
  const isPortrait = h >= w;
  const fmt = (v: string | number) => (isEn ? toAsciiDigits(String(v)) : toBanglaDigits(v));
  const fontStack = isEn
    ? "'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif"
    : "'Hind Siliguri', 'Nirmala UI', 'Segoe UI', sans-serif";

  const schoolName = isEn
    ? getEnglishSchoolName(settings, 'Educational Institution')
    : settings.schoolName || 'শিক্ষা প্রতিষ্ঠান';
  const schoolAddress = isEn
    ? getEnglishAddress(settings, '')
    : settings.address || '';
  const principalTitle = isEn
    ? getEnglishPrincipalTitleFromSettings(settings, 'Headmaster')
    : settings.principalTitle || 'প্রধান শিক্ষক';

  const studentName = isEn ? student.nameEn || student.name : student.name;
  const guardianName = isEn
    ? student.fatherNameEn || student.guardian || student.fatherName || '—'
    : student.guardian || student.fatherName || '—';
  const gradeLabel = getIdCardGradeLabel(student.grade, docLang);
  const scopeLabel = getIdCardScopeLabel(student.grade, student.section || student.branch, student.group, docLang);

  ctx.save();
  // Clip to exact card rectangle
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // Base card surface
  ctx.fillStyle = template.surfaceBg || '#FFFFFF';
  ctx.fillRect(x, y, w, h);

  // Optional custom uploaded artwork background
  const bgImg = side === 'front' ? frontBgImg : backBgImg;
  if (bgImg) {
    drawImageCover(ctx, bgImg, x, y, w, h);
    const veil = template.artworkOverlayOpacity ?? 0.14;
    if (veil > 0) {
      ctx.fillStyle = `rgba(255,255,255,${veil})`;
      ctx.fillRect(x, y, w, h);
    }
  }

  // Optional subtle crest watermark
  if (template.showWatermark && logoImg && !bgImg) {
    ctx.save();
    ctx.globalAlpha = 0.06;
    const wmSize = Math.min(w, h) * 0.56;
    ctx.drawImage(logoImg, x + (w - wmSize) / 2, y + (h - wmSize) / 2, wmSize, wmSize);
    ctx.restore();
  }

  // Classic royal inner double border
  if (template.baseStyle === 'classic_royal') {
    ctx.strokeStyle = template.primaryColor;
    ctx.lineWidth = 0.45 * pxPerMm;
    ctx.strokeRect(x + 1.4 * pxPerMm, y + 1.4 * pxPerMm, w - 2.8 * pxPerMm, h - 2.8 * pxPerMm);
    ctx.strokeStyle = template.accentColor;
    ctx.lineWidth = 0.2 * pxPerMm;
    ctx.strokeRect(x + 2.2 * pxPerMm, y + 2.2 * pxPerMm, w - 4.4 * pxPerMm, h - 4.4 * pxPerMm);
  }

  // Helper to paint stylized header band
  const drawHeaderBand = (bandH: number) => {
    const grad = ctx.createLinearGradient(x, y, x + w, y + bandH);
    grad.addColorStop(0, template.primaryColor);
    grad.addColorStop(1, template.secondaryColor);

    if (template.headerStyle === 'minimal') {
      ctx.fillStyle = template.primaryColor;
      ctx.fillRect(x, y, w, 2.2 * pxPerMm);
      ctx.fillStyle = template.accentColor;
      ctx.fillRect(x, y + 2.2 * pxPerMm, w * 0.36, 0.7 * pxPerMm);
      return;
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    if (template.headerStyle === 'wave') {
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + bandH * 0.82);
      ctx.bezierCurveTo(
        x + w * 0.68,
        y + bandH * 1.15,
        x + w * 0.32,
        y + bandH * 0.68,
        x,
        y + bandH * 0.96,
      );
      ctx.closePath();
    } else if (template.headerStyle === 'angled') {
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + bandH * 0.76);
      ctx.lineTo(x, y + bandH);
      ctx.closePath();
    } else {
      ctx.rect(x, y, w, bandH);
    }
    ctx.fill();

    // Accent trim ribbon
    ctx.fillStyle = template.accentColor;
    if (template.headerStyle === 'angled') {
      ctx.beginPath();
      ctx.moveTo(x, y + bandH);
      ctx.lineTo(x + w, y + bandH * 0.76);
      ctx.lineTo(x + w, y + bandH * 0.76 + 1.1 * pxPerMm);
      ctx.lineTo(x, y + bandH + 1.1 * pxPerMm);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(x, y + bandH - 0.8 * pxPerMm, w, 0.8 * pxPerMm);
    }
  };

  if (side === 'front') {
    const headerH = isPortrait ? 18.5 * pxPerMm : 13.5 * pxPerMm;
    const isMinimal = template.headerStyle === 'minimal';
    drawHeaderBand(headerH);

    // School Logo + Name in Header
    const logoSize = isPortrait ? 9.2 * pxPerMm : 8.2 * pxPerMm;
    const logoX = x + 3.2 * pxPerMm;
    const logoY = y + (isMinimal ? 4.2 * pxPerMm : 3.2 * pxPerMm);
    if (logoImg) {
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.clip();
      ctx.drawImage(logoImg, logoX + 0.6 * pxPerMm, logoY + 0.6 * pxPerMm, logoSize - 1.2 * pxPerMm, logoSize - 1.2 * pxPerMm);
      ctx.restore();
    }

    const textStartX = logoImg ? logoX + logoSize + 2.2 * pxPerMm : x + 3.5 * pxPerMm;
    const textMaxW = x + w - textStartX - 3 * pxPerMm;
    ctx.fillStyle = isMinimal ? template.primaryColor : '#FFFFFF';
    ctx.font = `800 ${Math.round(3.15 * pxPerMm)}px ${fontStack}`;
    ctx.textBaseline = 'top';
    ctx.fillText(fitTextEllipsis(ctx, schoolName, textMaxW), textStartX, logoY + 0.5 * pxPerMm);

    ctx.fillStyle = isMinimal ? '#475569' : 'rgba(255,255,255,0.88)';
    ctx.font = `600 ${Math.round(2.05 * pxPerMm)}px ${fontStack}`;
    const subMeta = [
      settings.eiin ? `EIIN: ${fmt(settings.eiin)}` : '',
      isEn ? `Session ${fmt(sessionYear)}` : `সেশন ${fmt(sessionYear)}`,
    ]
      .filter(Boolean)
      .join(' • ');
    ctx.fillText(fitTextEllipsis(ctx, subMeta, textMaxW), textStartX, logoY + 4.4 * pxPerMm);

    const studentPhoto = await loadCanvasImage(student.photo);
    const initials = (studentName || 'S')
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0] || '')
      .join('')
      .toUpperCase();

    if (isPortrait) {
      // Badge pill
      const badgeW = 28 * pxPerMm;
      const badgeH = 4.6 * pxPerMm;
      const badgeX = x + (w - badgeW) / 2;
      const badgeY = y + headerH + 1.6 * pxPerMm;
      ctx.fillStyle = template.accentColor;
      drawRoundedRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 2.3 * pxPerMm);
      ctx.fill();
      ctx.fillStyle = '#0F172A';
      ctx.font = `800 ${Math.round(2.1 * pxPerMm)}px ${fontStack}`;
      ctx.textAlign = 'center';
      ctx.fillText(
        isEn ? 'STUDENT ID CARD' : 'শিক্ষার্থী পরিচয়পত্র',
        x + w / 2,
        badgeY + 1.15 * pxPerMm,
      );

      // Student Photo Frame
      const photoSize = 21.5 * pxPerMm;
      const photoX = x + (w - photoSize) / 2;
      const photoY = badgeY + badgeH + 2.2 * pxPerMm;
      ctx.save();
      // White outer halo + accent border
      if (template.photoShape === 'circle') {
        ctx.beginPath();
        ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2 + 0.9 * pxPerMm, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 0.7 * pxPerMm;
        ctx.strokeStyle = template.primaryColor;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
        ctx.clip();
      } else {
        const rad = template.photoShape === 'rounded' ? 2.8 * pxPerMm : 0.8 * pxPerMm;
        drawRoundedRectPath(ctx, photoX - 0.6 * pxPerMm, photoY - 0.6 * pxPerMm, photoSize + 1.2 * pxPerMm, photoSize + 1.2 * pxPerMm, rad);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 0.7 * pxPerMm;
        ctx.strokeStyle = template.primaryColor;
        ctx.stroke();

        drawRoundedRectPath(ctx, photoX, photoY, photoSize, photoSize, rad);
        ctx.clip();
      }

      if (studentPhoto) {
        drawImageCover(ctx, studentPhoto, photoX, photoY, photoSize, photoSize);
      } else {
        ctx.fillStyle = '#F1F5F9';
        ctx.fillRect(photoX, photoY, photoSize, photoSize);
        ctx.fillStyle = template.primaryColor;
        ctx.font = `800 ${Math.round(6.5 * pxPerMm)}px ${fontStack}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, photoX + photoSize / 2, photoY + photoSize / 2);
      }
      ctx.restore();

      // Student Name + Class/Roll
      const nameY = photoY + photoSize + 2.8 * pxPerMm;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = template.primaryColor;
      ctx.font = `800 ${Math.round(3.5 * pxPerMm)}px ${fontStack}`;
      ctx.fillText(fitTextEllipsis(ctx, studentName, w - 6 * pxPerMm), x + w / 2, nameY);

      ctx.fillStyle = '#334155';
      ctx.font = `700 ${Math.round(2.45 * pxPerMm)}px ${fontStack}`;
      const clsRollLine = isEn
        ? `${gradeLabel} (${scopeLabel}) • Roll: ${fmt(student.roll)}`
        : `${gradeLabel} (${scopeLabel}) • রোল: ${fmt(student.roll)}`;
      ctx.fillText(fitTextEllipsis(ctx, clsRollLine, w - 6 * pxPerMm), x + w / 2, nameY + 4.4 * pxPerMm);

      // Compact Info Card Grid
      const boxX = x + 3.6 * pxPerMm;
      const boxY = nameY + 8.6 * pxPerMm;
      const boxW = w - 7.2 * pxPerMm;
      const rowsData: Array<{ label: string; value: string; accent?: boolean }> = [
        { label: isEn ? 'ID NO' : 'আইডি নং', value: fmt(student.id) },
      ];
      if (template.showBloodGroup) {
        rowsData.push({
          label: isEn ? 'BLOOD' : 'রক্তের গ্রুপ',
          value: student.bloodGroup || (isEn ? 'N/A' : 'উল্লেখ নেই'),
          accent: true,
        });
      }
      if (template.showGuardian) {
        rowsData.push({ label: isEn ? 'GUARDIAN' : 'অভিভাবক', value: guardianName });
      }
      if (template.showDob && student.dob) {
        rowsData.push({ label: isEn ? 'DOB' : 'জন্ম তারিখ', value: fmt(student.dob) });
      }

      const rowH = 4.2 * pxPerMm;
      const boxH = Math.min(18.5 * pxPerMm, rowsData.length * rowH + 2.4 * pxPerMm);
      ctx.fillStyle = '#F8FAFC';
      drawRoundedRectPath(ctx, boxX, boxY, boxW, boxH, 1.8 * pxPerMm);
      ctx.fill();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 0.25 * pxPerMm;
      ctx.stroke();

      ctx.textAlign = 'left';
      rowsData.slice(0, 4).forEach((item, idx) => {
        const ry = boxY + 1.4 * pxPerMm + idx * rowH;
        ctx.fillStyle = '#64748B';
        ctx.font = `700 ${Math.round(1.95 * pxPerMm)}px ${fontStack}`;
        ctx.fillText(`${item.label}:`, boxX + 2 * pxPerMm, ry);
        ctx.fillStyle = item.accent ? '#BE123C' : template.textColor;
        ctx.font = `800 ${Math.round(2.1 * pxPerMm)}px ${fontStack}`;
        ctx.fillText(
          fitTextEllipsis(ctx, item.value, boxW - 18 * pxPerMm),
          boxX + 16.5 * pxPerMm,
          ry,
        );
      });
    } else {
      // LANDSCAPE FRONT BODY
      const bodyTop = y + headerH + 2.4 * pxPerMm;
      const photoW = 20 * pxPerMm;
      const photoH = 24 * pxPerMm;
      const photoX = x + 4.2 * pxPerMm;
      const photoY = bodyTop + 1.5 * pxPerMm;

      ctx.save();
      if (template.photoShape === 'circle') {
        const d = Math.min(photoW, photoH);
        ctx.beginPath();
        ctx.arc(photoX + d / 2, photoY + d / 2, d / 2 + 0.6 * pxPerMm, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 0.65 * pxPerMm;
        ctx.strokeStyle = template.primaryColor;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(photoX + d / 2, photoY + d / 2, d / 2, 0, Math.PI * 2);
        ctx.clip();
      } else {
        const rad = template.photoShape === 'rounded' ? 2.2 * pxPerMm : 0.6 * pxPerMm;
        drawRoundedRectPath(ctx, photoX, photoY, photoW, photoH, rad);
        ctx.strokeStyle = template.primaryColor;
        ctx.lineWidth = 0.65 * pxPerMm;
        ctx.stroke();
        ctx.clip();
      }
      if (studentPhoto) {
        drawImageCover(ctx, studentPhoto, photoX, photoY, photoW, photoH);
      } else {
        ctx.fillStyle = '#F1F5F9';
        ctx.fillRect(photoX, photoY, photoW, photoH);
        ctx.fillStyle = template.primaryColor;
        ctx.font = `800 ${Math.round(6 * pxPerMm)}px ${fontStack}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, photoX + photoW / 2, photoY + photoH / 2);
      }
      ctx.restore();

      const infoX = photoX + photoW + 3.6 * pxPerMm;
      const infoW = x + w - infoX - 3.6 * pxPerMm;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // Pill badge
      ctx.fillStyle = template.accentColor;
      drawRoundedRectPath(ctx, infoX, bodyTop + 0.6 * pxPerMm, 25 * pxPerMm, 4.1 * pxPerMm, 2 * pxPerMm);
      ctx.fill();
      ctx.fillStyle = '#0F172A';
      ctx.font = `800 ${Math.round(1.95 * pxPerMm)}px ${fontStack}`;
      ctx.fillText(isEn ? 'STUDENT ID CARD' : 'শিক্ষার্থী পরিচয়পত্র', infoX + 2 * pxPerMm, bodyTop + 1.5 * pxPerMm);

      ctx.fillStyle = template.primaryColor;
      ctx.font = `800 ${Math.round(3.6 * pxPerMm)}px ${fontStack}`;
      ctx.fillText(fitTextEllipsis(ctx, studentName, infoW), infoX, bodyTop + 6 * pxPerMm);

      ctx.fillStyle = '#1E293B';
      ctx.font = `700 ${Math.round(2.45 * pxPerMm)}px ${fontStack}`;
      const clsText = isEn
        ? `${gradeLabel} (${scopeLabel}) • Roll: ${fmt(student.roll)}`
        : `${gradeLabel} (${scopeLabel}) • রোল: ${fmt(student.roll)}`;
      ctx.fillText(fitTextEllipsis(ctx, clsText, infoW), infoX, bodyTop + 11 * pxPerMm);

      let cursorY = bodyTop + 15.2 * pxPerMm;
      ctx.font = `600 ${Math.round(2.2 * pxPerMm)}px ${fontStack}`;
      if (template.showGuardian) {
        ctx.fillStyle = '#475569';
        const gLine = isEn ? `Guardian: ${guardianName}` : `অভিভাবক: ${guardianName}`;
        ctx.fillText(fitTextEllipsis(ctx, gLine, infoW), infoX, cursorY);
        cursorY += 3.8 * pxPerMm;
      }
      ctx.fillStyle = '#334155';
      const idBloodLine = [
        isEn ? `ID: ${fmt(student.id)}` : `আইডি: ${fmt(student.id)}`,
        template.showBloodGroup
          ? isEn
            ? `Blood: ${student.bloodGroup || 'N/A'}`
            : `রক্ত: ${student.bloodGroup || 'উল্লেখ নেই'}`
          : '',
      ]
        .filter(Boolean)
        .join('  •  ');
      ctx.fillText(fitTextEllipsis(ctx, idBloodLine, infoW), infoX, cursorY);
    }

    // Bottom Signature & Validity Strip
    const footerH = 8.4 * pxPerMm;
    const footerY = y + h - footerH;
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(x, footerY, w, footerH);
    ctx.fillStyle = template.primaryColor;
    ctx.fillRect(x, y + h - 1.3 * pxPerMm, w, 1.3 * pxPerMm);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#475569';
    ctx.font = `700 ${Math.round(1.95 * pxPerMm)}px ${fontStack}`;
    const leftFooterText = template.showValidity
      ? isEn
        ? template.validityTextEn
        : template.validityTextBn
      : isEn
        ? `ID: ${fmt(student.id)}`
        : `আইডি: ${fmt(student.id)}`;
    ctx.fillText(leftFooterText, x + 3.2 * pxPerMm, footerY + footerH * 0.44);

    // Optional uploaded signature image above principal title
    if (signatureImg) {
      const sigW = 12 * pxPerMm;
      const sigH = 4 * pxPerMm;
      ctx.drawImage(signatureImg, x + w - sigW - 3.5 * pxPerMm, footerY + 0.2 * pxPerMm, sigW, sigH);
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = template.textColor;
    ctx.font = `800 ${Math.round(2.05 * pxPerMm)}px ${fontStack}`;
    ctx.fillText(principalTitle, x + w - 3.2 * pxPerMm, footerY + footerH * 0.54);
  } else {
    // BACK SIDE FACE
    const topBarH = 9.5 * pxPerMm;
    ctx.fillStyle = template.primaryColor;
    ctx.fillRect(x, y, w, topBarH);
    ctx.fillStyle = template.accentColor;
    ctx.fillRect(x, y + topBarH, w, 0.9 * pxPerMm);

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.round(2.45 * pxPerMm)}px ${fontStack}`;
    ctx.fillText(
      isEn ? 'DIGITAL SMART IDENTITY' : 'ডিজিটাল স্মার্ট পরিচয়পত্র',
      x + 3.2 * pxPerMm,
      y + topBarH / 2,
    );
    ctx.textAlign = 'right';
    ctx.font = `700 ${Math.round(2.05 * pxPerMm)}px ${fontStack}`;
    ctx.fillText(
      isEn ? `Session ${fmt(sessionYear)}` : `সেশন ${fmt(sessionYear)}`,
      x + w - 3.2 * pxPerMm,
      y + topBarH / 2,
    );

    const qrSize = isPortrait ? 22 * pxPerMm : 23 * pxPerMm;
    const qrX = isPortrait ? x + (w - qrSize) / 2 : x + 4.5 * pxPerMm;
    const qrY = isPortrait ? y + topBarH + 4 * pxPerMm : y + topBarH + 6 * pxPerMm;

    if (template.showQrCode) {
      const qrPayload = `SMS-STU|${student.id}|${student.roll}|${student.grade}`;
      const qrCanvas = document.createElement('canvas');
      try {
        await QRCode.toCanvas(qrCanvas, qrPayload, {
          width: Math.max(200, Math.round(qrSize)),
          margin: 1,
          color: { dark: '#0F172A', light: '#FFFFFF' },
        });
        ctx.fillStyle = '#FFFFFF';
        drawRoundedRectPath(ctx, qrX - 1 * pxPerMm, qrY - 1 * pxPerMm, qrSize + 2 * pxPerMm, qrSize + 2 * pxPerMm, 1.8 * pxPerMm);
        ctx.fill();
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 0.3 * pxPerMm;
        ctx.stroke();
        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
      } finally {
        qrCanvas.width = 0;
        qrCanvas.height = 0;
      }
    }

    // Contact & emergency info box
    const infoBoxX = isPortrait ? x + 3.8 * pxPerMm : qrX + qrSize + 4.2 * pxPerMm;
    const infoBoxY = isPortrait ? qrY + qrSize + 4.5 * pxPerMm : y + topBarH + 5 * pxPerMm;
    const infoBoxW = isPortrait ? w - 7.6 * pxPerMm : x + w - infoBoxX - 4 * pxPerMm;
    const infoBoxH = isPortrait ? 22 * pxPerMm : 21 * pxPerMm;

    ctx.fillStyle = '#F8FAFC';
    drawRoundedRectPath(ctx, infoBoxX, infoBoxY, infoBoxW, infoBoxH, 2 * pxPerMm);
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 0.25 * pxPerMm;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let iy = infoBoxY + 2.2 * pxPerMm;
    const addBackLine = (label: string, value: string, bold = false) => {
      ctx.fillStyle = bold ? template.textColor : '#334155';
      ctx.font = `${bold ? 800 : 600} ${Math.round(2.15 * pxPerMm)}px ${fontStack}`;
      ctx.fillText(
        fitTextEllipsis(ctx, `${label}: ${value}`, infoBoxW - 4 * pxPerMm),
        infoBoxX + 2.2 * pxPerMm,
        iy,
      );
      iy += 4.3 * pxPerMm;
    };

    if (template.showGuardian) {
      addBackLine(isEn ? 'Guardian' : 'অভিভাবক', guardianName, true);
    }
    if (template.showEmergencyPhone) {
      addBackLine(
        isEn ? 'Emergency' : 'জরুরি ফোন',
        fmt(student.mobile || settings.phone || '—'),
        true,
      );
    }
    if (template.showAddress) {
      const rawAddr = (student.currentAddress || '').trim();
      const addrDisplay = isEn
        ? rawAddr && !/[\u0980-\u09FF]/.test(rawAddr)
          ? rawAddr
          : schoolAddress || 'Bangladesh'
        : rawAddr || schoolAddress || 'বাংলাদেশ';
      addBackLine(isEn ? 'Address' : 'ঠিকানা', addrDisplay);
    }
    if (template.showValidity) {
      addBackLine(
        isEn ? 'Validity' : 'মেয়াদ',
        isEn ? template.validityTextEn : template.validityTextBn,
      );
    }

    // Notice paragraph (wrapped up to 3 lines)
    const noticeText = isEn ? template.backNoticeEn : template.backNoticeBn;
    const noticeY = infoBoxY + infoBoxH + 2.8 * pxPerMm;
    ctx.fillStyle = '#475569';
    ctx.font = `600 ${Math.round(1.9 * pxPerMm)}px ${fontStack}`;
    ctx.textAlign = isPortrait ? 'center' : 'left';
    const words = noticeText.split(/\s+/);
    let line = '';
    let ny = noticeY;
    const maxNoticeW = infoBoxW;
    let linesDrawn = 0;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxNoticeW && line) {
        if (linesDrawn < 3) {
          ctx.fillText(line, isPortrait ? x + w / 2 : infoBoxX, ny);
          ny += 2.7 * pxPerMm;
          linesDrawn++;
        }
        line = word;
      } else {
        line = test;
      }
    }
    if (line && linesDrawn < 3) {
      ctx.fillText(line, isPortrait ? x + w / 2 : infoBoxX, ny);
    }

    // Back footer bar
    const backFooterH = 6.2 * pxPerMm;
    ctx.fillStyle = template.primaryColor;
    ctx.fillRect(x, y + h - backFooterH, w, backFooterH);
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(2.0 * pxPerMm)}px ${fontStack}`;
    ctx.fillText(fitTextEllipsis(ctx, schoolName, w * 0.65), x + 3 * pxPerMm, y + h - backFooterH / 2);
    ctx.textAlign = 'right';
    ctx.fillText(
      settings.eiin ? `EIIN: ${fmt(settings.eiin)}` : '',
      x + w - 3 * pxPerMm,
      y + h - backFooterH / 2,
    );
  }

  // Subtle hairline outer card border
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.14)';
  ctx.lineWidth = Math.max(1, 0.18 * pxPerMm);
  ctx.strokeRect(x, y, w, h);

  ctx.restore();
}

export async function renderSheetPageToCanvas(args: {
  page: IdCardPrintSheetPage<Student>;
  metrics: SheetGridMetrics;
  pageSettings: IdCardPageSettings;
  schoolSettings: SchoolSettings;
  template: IdCardTemplateConfig;
  docLang: IdCardDocLang;
  sessionYear: string;
}): Promise<HTMLCanvasElement> {
  const { page, metrics, pageSettings, schoolSettings, template, docLang, sessionYear } = args;
  const dpi = pageSettings.dpi;
  // Cap canvas dimensions safely for massive A3 @ 600 DPI browsers (~10000px safety ceiling)
  const rawW = mmToPx(metrics.pageWidthMm, dpi);
  const rawH = mmToPx(metrics.pageHeightMm, dpi);
  const maxDim = 9600;
  const scaleFactor = Math.min(1, maxDim / Math.max(rawW, rawH));
  const canvasW = Math.max(1, Math.round(rawW * scaleFactor));
  const canvasH = Math.max(1, Math.round(rawH * scaleFactor));
  const pxPerMm = canvasW / metrics.pageWidthMm;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('হাই-রেজুলেশন ক্যানভাস তৈরি করা যায়নি।');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Pre-load shared institutional assets once per sheet
  const [logoImg, frontBgImg, backBgImg, signatureImg] = await Promise.all([
    loadCanvasImage(schoolSettings.schoolLogo),
    loadCanvasImage(template.customFrontBgDataUrl),
    loadCanvasImage(template.customBackBgDataUrl),
    loadCanvasImage(template.principalSignatureDataUrl),
  ]);

  const cardW = metrics.cardWidthMm * pxPerMm;
  const cardH = metrics.cardHeightMm * pxPerMm;
  const pairGap = metrics.innerPairGapMm * pxPerMm;

  for (const slot of page.slots) {
    if (!slot.student) continue;
    const sx = slot.xMm * pxPerMm;
    const sy = slot.yMm * pxPerMm;

    if (slot.side === 'pair') {
      if (pageSettings.showCropMarks && !metrics.isSinglePvcMode) {
        drawCropMarks(ctx, sx, sy, cardW, cardH, pxPerMm);
        drawCropMarks(ctx, sx + cardW + pairGap, sy, cardW, cardH, pxPerMm);
      }
      await drawSingleCardFace({
        ctx,
        x: sx,
        y: sy,
        w: cardW,
        h: cardH,
        pxPerMm,
        student: slot.student,
        settings: schoolSettings,
        template,
        docLang,
        sessionYear,
        side: 'front',
        logoImg,
        frontBgImg,
        backBgImg,
        signatureImg,
      });
      await drawSingleCardFace({
        ctx,
        x: sx + cardW + pairGap,
        y: sy,
        w: cardW,
        h: cardH,
        pxPerMm,
        student: slot.student,
        settings: schoolSettings,
        template,
        docLang,
        sessionYear,
        side: 'back',
        logoImg,
        frontBgImg,
        backBgImg,
        signatureImg,
      });
    } else {
      if (pageSettings.showCropMarks && !metrics.isSinglePvcMode) {
        drawCropMarks(ctx, sx, sy, cardW, cardH, pxPerMm);
      }
      await drawSingleCardFace({
        ctx,
        x: sx,
        y: sy,
        w: cardW,
        h: cardH,
        pxPerMm,
        student: slot.student,
        settings: schoolSettings,
        template,
        docLang,
        sessionYear,
        side: slot.side,
        logoImg,
        frontBgImg,
        backBgImg,
        signatureImg,
      });
    }
  }

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('ইমেজ বাফার তৈরি করা যায়নি।'));
        else resolve(blob);
      },
      mime,
      quality,
    );
  });
}

function triggerEphemeralBlobDownload(blob: Blob, fileName: string): number {
  const byteSize = blob.size;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke transient ObjectURL shortly after browser initiates download stream (0 retained server/local storage)
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
  return byteSize;
}

/**
 * Exports a single print page at 300/600 DPI PNG and immediately purges offscreen canvas & ObjectURL.
 */
export async function exportIdCardPageAsPng(args: {
  page: IdCardPrintSheetPage<Student>;
  metrics: SheetGridMetrics;
  pageSettings: IdCardPageSettings;
  schoolSettings: SchoolSettings;
  template: IdCardTemplateConfig;
  docLang: IdCardDocLang;
  sessionYear: string;
  fileName: string;
}): Promise<EphemeralExportReceipt> {
  const canvas = await renderSheetPageToCanvas(args);
  try {
    const blob = await canvasToBlob(canvas, 'image/png');
    const fileBytes = triggerEphemeralBlobDownload(blob, args.fileName);
    return {
      fileName: args.fileName,
      pageCount: 1,
      dpi: args.pageSettings.dpi,
      fileBytes,
      serverBytesUsed: 0,
      memoryPurged: true,
    };
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

/**
 * Exports one or many print pages at 300/600 DPI into a millimeter-accurate print-ready PDF file,
 * releasing each page canvas immediately after encoding and revoking the PDF Blob right after download.
 */
export async function exportIdCardPagesAsPdf(args: {
  pages: IdCardPrintSheetPage<Student>[];
  metrics: SheetGridMetrics;
  pageSettings: IdCardPageSettings;
  schoolSettings: SchoolSettings;
  template: IdCardTemplateConfig;
  docLang: IdCardDocLang;
  sessionYear: string;
  fileName: string;
  onProgress?: (current: number, total: number) => void;
}): Promise<EphemeralExportReceipt> {
  const pdfInputs: PdfJpegPageInput[] = [];

  for (let i = 0; i < args.pages.length; i++) {
    args.onProgress?.(i + 1, args.pages.length);
    const canvas = await renderSheetPageToCanvas({
      page: args.pages[i],
      metrics: args.metrics,
      pageSettings: args.pageSettings,
      schoolSettings: args.schoolSettings,
      template: args.template,
      docLang: args.docLang,
      sessionYear: args.sessionYear,
    });

    try {
      const pixelWidth = canvas.width;
      const pixelHeight = canvas.height;
      // High quality 0.94 JPEG preserves sharp print typography while keeping PDF lean
      const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', 0.94);
      const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
      pdfInputs.push({
        jpegBytes,
        pixelWidth,
        pixelHeight,
        pageWidthMm: args.metrics.pageWidthMm,
        pageHeightMm: args.metrics.pageHeightMm,
      });
    } finally {
      // Release every single page canvas immediately before starting the next page
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  const pdfBytes = composePdfFromJpegPages(pdfInputs);
  // Clear intermediate page JPEG buffers before triggering download
  pdfInputs.length = 0;

  const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const fileBytes = triggerEphemeralBlobDownload(pdfBlob, args.fileName);

  return {
    fileName: args.fileName,
    pageCount: args.pages.length,
    dpi: args.pageSettings.dpi,
    fileBytes,
    serverBytesUsed: 0,
    memoryPurged: true,
  };
}
