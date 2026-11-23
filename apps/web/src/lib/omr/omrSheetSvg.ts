/**
 * Exact-Millimeter Vector SVG OMR Sheet Generator (v2)
 *
 * Features:
 *  - Dynamic 10..100 MCQ layouts (Legal Half 177.8x215.9mm, A5 148x210mm, A4 210x297mm)
 *  - 4 solid black corner fiducial squares for perspective correction
 *  - On-sheet scannable Roll + 3-Digit Subject Code + Class (6th-10th) + Group + Set grids
 *  - Optional pre-fill for Subject Code, Class, Group, and Student Roll bubbles
 *  - Exact Legal Landscape 2-Up generator (355.6mm x 215.9mm) with centered
 *    cutting line at x = 177.8mm and top/bottom scissor (✂) guide marks
 */

import {
  LEGAL_HALF_WIDTH_MM,
  LEGAL_LANDSCAPE_HEIGHT_MM,
  LEGAL_LANDSCAPE_WIDTH_MM,
  OMR_GRADE_OPTIONS,
  OMR_GROUP_OPTIONS,
  OmrColorTheme,
  OmrLayoutConfig,
  OmrResolvedLayout,
  getOmrTemplateLayout,
  toAsciiDigits,
  toBanglaDigits,
} from './omrTemplates';

export interface OmrSheetHeaderMeta {
  schoolName: string;
  schoolAddress?: string;
  eiin?: string;
  schoolLogo?: string;
  examTitle: string;
  classLabel: string;
  sectionOrGroupLabel?: string;
  subjectLabel: string;
  subjectCode?: string;
  examDate?: string;
}

export interface OmrPreFilledStudent {
  id: string;
  name: string;
  roll: string;
  section?: string;
  group?: string;
}

export interface OmrSheetRenderOptions extends OmrLayoutConfig {
  colorTheme?: OmrColorTheme;
  header: OmrSheetHeaderMeta;
  student?: OmrPreFilledStudent;
  /** If true and student is provided, fill roll bubbles directly for zero-error scanning */
  preFillRollBubbles?: boolean;
  /** Optional 3-digit subject code (e.g. '136') to display & optionally pre-fill */
  subjectCodeValue?: string;
  preFillSubjectCodeBubbles?: boolean;
  /** Optional grade ('6th'..'10th') & group ('সাধারণ'|'বিজ্ঞান'|'মানবিক'|'ব্যবসায় শিক্ষা') to pre-fill */
  preFillGrade?: string;
  preFillGroup?: string;
  /** Optional answer key to render a filled Answer Key preview / sheet */
  preFillAnswers?: Array<number | null>;
  preFillSetIndex?: number | null;
}

function escapeXml(str: string | undefined | null): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getDigitsArray(raw: string | undefined, digitCount: number): number[] | null {
  const digitsOnly = toAsciiDigits(raw || '').replace(/\D/g, '');
  if (!digitsOnly) return null;
  const padded = digitsOnly.slice(-digitCount).padStart(digitCount, '0');
  return padded.split('').map((ch) => Math.max(0, Math.min(9, parseInt(ch, 10) || 0)));
}

function resolveGroupIndex(groupRaw?: string): number {
  if (!groupRaw) return -1;
  const g = groupRaw.toLowerCase();
  if (g.includes('বিজ্ঞান') || g.includes('science')) return 1;
  if (g.includes('মানবিক') || g.includes('humanities')) return 2;
  if (g.includes('ব্যবসা') || g.includes('commerce') || g.includes('business')) return 3;
  if (g.includes('সাধারণ') || g.includes('general')) return 0;
  return -1;
}

function resolveGradeIndex(gradeRaw?: string): number {
  if (!gradeRaw) return -1;
  return OMR_GRADE_OPTIONS.findIndex((opt) => opt.id === gradeRaw);
}

/**
 * Generates a standalone exact-mm SVG string for a single OMR sheet.
 */
export function generateOmrSheetSvg(options: OmrSheetRenderOptions): string {
  const layout: OmrResolvedLayout = getOmrTemplateLayout(options);
  const {
    preset,
    fiducials,
    rollBox,
    subjectCodeBox,
    gradeBox,
    groupBox,
    setBox,
    infoBox,
    headerBox,
  } = layout;

  const isPink = (options.colorTheme ?? 'pink') === 'pink';
  const isBn = layout.optionStyle === 'bn';
  const isA4 = layout.paperFormat === 'a4';
  const isA5 = layout.paperFormat === 'a5';

  // Pink dropout ink disappears in the Red channel while black/blue ballpoint pen pops!
  const accent = isPink ? '#d4146e' : '#334155';
  const accentDark = isPink ? '#9d174d' : '#0f172a';
  const rowAltFill = isPink ? '#fff1f7' : '#f8fafc';
  const headerBandFill = isPink ? '#fce7f3' : '#e2e8f0';
  const borderColor = isPink ? '#f472b6' : '#64748b';
  const subtleText = isPink ? '#be185d' : '#475569';
  const bubbleStroke = isPink ? '#d4146e' : '#334155';
  const bubbleStrokeW = isA4 ? 0.34 : isA5 ? 0.28 : 0.31;

  const displayRollDigits = options.student
    ? getDigitsArray(options.student.roll, layout.rollDigits)
    : null;
  const preFilledRollDigits =
    options.student && options.preFillRollBubbles ? displayRollDigits : null;

  const displaySubCodeDigits = getDigitsArray(
    options.subjectCodeValue ?? options.header.subjectCode,
    3,
  );
  const preFilledSubCodeDigits = options.preFillSubjectCodeBubbles
    ? displaySubCodeDigits
    : null;

  const preFillGradeIdx = resolveGradeIndex(options.preFillGrade);
  const preFillGroupIdx = resolveGroupIndex(options.preFillGroup);

  const parts: string[] = [];

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${preset.pageWidthMm} ${preset.pageHeightMm}" width="${preset.pageWidthMm}mm" height="${preset.pageHeightMm}mm" style="background:#ffffff;display:block;font-family:'Hind Siliguri','Noto Sans Bengali','Segoe UI',Arial,sans-serif;">`,
  );

  // Solid white paper background
  parts.push(
    `<rect x="0" y="0" width="${preset.pageWidthMm}" height="${preset.pageHeightMm}" fill="#ffffff" />`,
  );

  // ── 1. FOUR SOLID BLACK CORNER FIDUCIAL SQUARES ─────────────────────────
  for (const f of [fiducials.tl, fiducials.tr, fiducials.br, fiducials.bl]) {
    const half = f.sizeMm / 2;
    parts.push(
      `<rect data-fiducial="${f.id}" x="${(f.xMm - half).toFixed(3)}" y="${(f.yMm - half).toFixed(3)}" width="${f.sizeMm.toFixed(3)}" height="${f.sizeMm.toFixed(3)}" fill="#000000" />`,
    );
  }

  // Light decorative frame well inside corner fiducials
  const frameInsetX = preset.fiducialInsetMm + preset.fiducialSizeMm * 0.9;
  const frameInsetY = preset.fiducialInsetMm + preset.fiducialSizeMm * 0.72;
  parts.push(
    `<rect x="${frameInsetX.toFixed(2)}" y="${frameInsetY.toFixed(2)}" width="${(preset.pageWidthMm - frameInsetX * 2).toFixed(2)}" height="${(preset.pageHeightMm - frameInsetY * 2).toFixed(2)}" rx="1.6" fill="none" stroke="${borderColor}" stroke-width="0.25" />`,
  );

  // ── 2. INSTITUTIONAL HEADER (TIGHT LOGO + BALANCED TITLE + BADGE) ───────
  const hx = headerBox.xMm;
  const hy = headerBox.yMm;
  const hw = headerBox.widthMm;
  const hh = headerBox.heightMm;

  parts.push(
    `<rect x="${hx.toFixed(2)}" y="${hy.toFixed(2)}" width="${hw.toFixed(2)}" height="${hh.toFixed(2)}" rx="1.6" fill="${rowAltFill}" stroke="${borderColor}" stroke-width="0.32" />`,
  );

  const hasLogo = Boolean(options.header.schoolLogo && options.header.schoolLogo.length > 5);
  const logoSize = isA4 ? 15.0 : isA5 ? 12.0 : 13.0;
  const schoolTitleStr = options.header.schoolName || 'শিক্ষা প্রতিষ্ঠান';
  const schoolNameFs = isA4 ? 5.8 : isA5 ? 4.3 : 4.9;
  const examTitleFs = isA4 ? 3.8 : isA5 ? 3.0 : 3.3;
  const subMetaFs = isA4 ? 3.0 : isA5 ? 2.4 : 2.7;

  // Position logo snugly beside the title block (no awkward wide gap!)
  const estTitleHalfW = Math.min(hw * 0.34, Math.max(24, schoolTitleStr.length * (schoolNameFs * 0.27)));
  const centerX = hx + hw / 2 + (hasLogo ? logoSize * 0.28 : 0);

  if (hasLogo) {
    const logoX = Math.max(hx + 3.2, centerX - estTitleHalfW - logoSize - 3.5);
    const logoY = hy + (hh - logoSize) / 2;
    parts.push(
      `<circle cx="${(logoX + logoSize / 2).toFixed(2)}" cy="${(logoY + logoSize / 2).toFixed(2)}" r="${(logoSize / 2 + 0.7).toFixed(2)}" fill="#ffffff" stroke="${borderColor}" stroke-width="0.22" />`,
    );
    parts.push(
      `<image href="${escapeXml(options.header.schoolLogo)}" x="${logoX.toFixed(2)}" y="${logoY.toFixed(2)}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet" />`,
    );
  }

  parts.push(
    `<text x="${centerX.toFixed(2)}" y="${(hy + (isA4 ? 7.6 : 6.0)).toFixed(2)}" text-anchor="middle" font-size="${schoolNameFs}" font-weight="800" fill="${accentDark}">${escapeXml(schoolTitleStr)}</text>`,
  );

  const subAddressLine = [
    options.header.schoolAddress,
    options.header.eiin ? `EIIN: ${options.header.eiin}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  if (subAddressLine) {
    parts.push(
      `<text x="${centerX.toFixed(2)}" y="${(hy + (isA4 ? 11.8 : 9.2)).toFixed(2)}" text-anchor="middle" font-size="${(subMetaFs * 0.9).toFixed(2)}" font-weight="600" fill="${subtleText}">${escapeXml(subAddressLine)}</text>`,
    );
  }

  const examBadgeText = `${options.header.examTitle || 'বহুনির্বাচনি পরীক্ষা'} · ${isBn ? 'OMR উত্তরপত্র' : 'OMR ANSWER SHEET'}`;
  parts.push(
    `<text x="${centerX.toFixed(2)}" y="${(hy + (isA4 ? 17.0 : 13.3)).toFixed(2)}" text-anchor="middle" font-size="${examTitleFs}" font-weight="700" fill="${accent}">${escapeXml(examBadgeText)}</text>`,
  );

  const classSubLine = [
    `${isBn ? 'শ্রেণি' : 'Class'}: ${options.header.classLabel}`,
    options.header.sectionOrGroupLabel ? options.header.sectionOrGroupLabel : '',
    `${isBn ? 'বিষয়' : 'Subject'}: ${options.header.subjectLabel}${options.header.subjectCode ? ` (${options.header.subjectCode})` : ''}`,
    `${isBn ? 'পূর্ণমান' : 'Marks'}: ${isBn ? toBanglaDigits(layout.questionCount) : layout.questionCount}`,
  ]
    .filter(Boolean)
    .join('  |  ');

  parts.push(
    `<text x="${centerX.toFixed(2)}" y="${(hy + (isA4 ? 21.8 : 17.4)).toFixed(2)}" text-anchor="middle" font-size="${subMetaFs}" font-weight="700" fill="#1e293b">${escapeXml(classSubLine)}</text>`,
  );

  // ── HELPER FOR VERTICAL 0-9 DIGIT GRIDS (ROLL + SUBJECT CODE) ───────────
  const bandTitleH = isA4 ? 5.0 : isA5 ? 4.0 : 4.2;
  const bandTitleFs = isA4 ? 2.9 : isA5 ? 2.15 : 2.35;

  const renderDigitGrid = (
    box: typeof rollBox,
    bubbles: typeof layout.rollBubbles,
    title: string,
    displayDigits: number[] | null,
    filledDigits: number[] | null,
    dataTag: string,
  ) => {
    parts.push(
      `<rect data-grid="${dataTag}" x="${box.xMm.toFixed(2)}" y="${box.yMm.toFixed(2)}" width="${box.widthMm.toFixed(2)}" height="${box.heightMm.toFixed(2)}" rx="1.3" fill="#ffffff" stroke="${borderColor}" stroke-width="0.28" />`,
    );
    parts.push(
      `<rect x="${box.xMm.toFixed(2)}" y="${box.yMm.toFixed(2)}" width="${box.widthMm.toFixed(2)}" height="${bandTitleH.toFixed(2)}" rx="1.1" fill="${headerBandFill}" />`,
    );
    parts.push(
      `<text x="${(box.xMm + box.widthMm / 2).toFixed(2)}" y="${(box.yMm + bandTitleH * 0.73).toFixed(2)}" text-anchor="middle" font-size="${bandTitleFs}" font-weight="800" fill="${accentDark}">${escapeXml(title)}</text>`,
    );

    const writeBoxSize = Math.min(isA4 ? 5.4 : isA5 ? 3.8 : 4.4, box.colPitchMm - 0.6);
    const writeBoxY = box.writeBoxYMm;

    for (let colIdx = 0; colIdx < bubbles.length; colIdx++) {
      const colBubbles = bubbles[colIdx];
      const cx = colBubbles[0].xMm;

      parts.push(
        `<rect x="${(cx - writeBoxSize / 2).toFixed(2)}" y="${writeBoxY.toFixed(2)}" width="${writeBoxSize.toFixed(2)}" height="${writeBoxSize.toFixed(2)}" rx="0.55" fill="#ffffff" stroke="${accent}" stroke-width="0.24" />`,
      );
      if (displayDigits && displayDigits[colIdx] !== undefined) {
        const dText = isBn ? toBanglaDigits(displayDigits[colIdx]) : String(displayDigits[colIdx]);
        parts.push(
          `<text x="${cx.toFixed(2)}" y="${(writeBoxY + writeBoxSize * 0.74).toFixed(2)}" text-anchor="middle" font-size="${(writeBoxSize * 0.66).toFixed(2)}" font-weight="800" fill="#0f172a">${dText}</text>`,
        );
      }

      for (let digit = 0; digit <= 9; digit++) {
        const b = colBubbles[digit];
        const isFilled = Boolean(filledDigits && filledDigits[colIdx] === digit);
        parts.push(
          `<circle cx="${b.xMm.toFixed(3)}" cy="${b.yMm.toFixed(3)}" r="${b.rMm.toFixed(3)}" fill="${isFilled ? '#000000' : '#ffffff'}" stroke="${isFilled ? '#000000' : bubbleStroke}" stroke-width="${bubbleStrokeW}" />`,
        );
        if (!isFilled) {
          parts.push(
            `<text x="${b.xMm.toFixed(3)}" y="${(b.yMm + b.rMm * 0.36).toFixed(3)}" text-anchor="middle" font-size="${(b.rMm * 1.12).toFixed(2)}" font-weight="700" fill="${accent}">${escapeXml(b.label)}</text>`,
          );
        }
      }
    }
  };

  // ── 3a. ROLL NUMBER GRID ────────────────────────────────────────────────
  renderDigitGrid(
    rollBox,
    layout.rollBubbles,
    isBn ? 'রোল নম্বর' : 'ROLL NO',
    displayRollDigits,
    preFilledRollDigits,
    'roll',
  );

  // ── 3b. 3-DIGIT SUBJECT CODE GRID ───────────────────────────────────────
  renderDigitGrid(
    subjectCodeBox,
    layout.subjectCodeBubbles,
    isBn ? 'বিষয় কোড' : 'SUB CODE',
    displaySubCodeDigits,
    preFilledSubCodeDigits,
    'subject-code',
  );

  // ── 3c. CLASS + GROUP + SET STACK ───────────────────────────────────────
  const miniTitleH = isA4 ? 4.6 : isA5 ? 3.8 : 4.0;
  const miniTitleFs = isA4 ? 2.7 : isA5 ? 2.0 : 2.25;
  const captionFs = isA4 ? 2.1 : isA5 ? 1.65 : 1.8;

  // Class (6th-10th) Box
  parts.push(
    `<rect data-grid="grade" x="${gradeBox.xMm.toFixed(2)}" y="${gradeBox.yMm.toFixed(2)}" width="${gradeBox.widthMm.toFixed(2)}" height="${gradeBox.heightMm.toFixed(2)}" rx="1.2" fill="#ffffff" stroke="${borderColor}" stroke-width="0.26" />`,
  );
  parts.push(
    `<rect x="${gradeBox.xMm.toFixed(2)}" y="${gradeBox.yMm.toFixed(2)}" width="${gradeBox.widthMm.toFixed(2)}" height="${miniTitleH.toFixed(2)}" rx="1.0" fill="${headerBandFill}" />`,
  );
  parts.push(
    `<text x="${(gradeBox.xMm + gradeBox.widthMm / 2).toFixed(2)}" y="${(gradeBox.yMm + miniTitleH * 0.74).toFixed(2)}" text-anchor="middle" font-size="${miniTitleFs}" font-weight="800" fill="${accentDark}">${isBn ? 'শ্রেণি (CLASS)' : 'CLASS (6–10)'}</text>`,
  );
  layout.gradeBubbles.forEach((b, idx) => {
    const isFilled = preFillGradeIdx === idx;
    parts.push(
      `<circle cx="${b.xMm.toFixed(3)}" cy="${b.yMm.toFixed(3)}" r="${b.rMm.toFixed(3)}" fill="${isFilled ? '#000000' : '#ffffff'}" stroke="${isFilled ? '#000000' : bubbleStroke}" stroke-width="${bubbleStrokeW}" />`,
    );
    if (!isFilled) {
      parts.push(
        `<text x="${b.xMm.toFixed(3)}" y="${(b.yMm + b.rMm * 0.36).toFixed(3)}" text-anchor="middle" font-size="${(b.rMm * 1.02).toFixed(2)}" font-weight="700" fill="${accent}">${escapeXml(b.label)}</text>`,
      );
    }
    const topLabel = isBn ? OMR_GRADE_OPTIONS[idx].shortBn + (idx === 0 ? 'ষ্ঠ' : idx === 1 ? 'ম' : idx === 2 ? 'ম' : idx === 3 ? 'ম' : 'ম') : OMR_GRADE_OPTIONS[idx].shortEn;
    parts.push(
      `<text x="${b.xMm.toFixed(2)}" y="${(b.yMm - b.rMm - 0.85).toFixed(2)}" text-anchor="middle" font-size="${captionFs}" font-weight="700" fill="${subtleText}">${escapeXml(topLabel)}</text>`,
    );
  });

  // Department / Group Box
  parts.push(
    `<rect data-grid="group" x="${groupBox.xMm.toFixed(2)}" y="${groupBox.yMm.toFixed(2)}" width="${groupBox.widthMm.toFixed(2)}" height="${groupBox.heightMm.toFixed(2)}" rx="1.2" fill="#ffffff" stroke="${borderColor}" stroke-width="0.26" />`,
  );
  parts.push(
    `<rect x="${groupBox.xMm.toFixed(2)}" y="${groupBox.yMm.toFixed(2)}" width="${groupBox.widthMm.toFixed(2)}" height="${miniTitleH.toFixed(2)}" rx="1.0" fill="${headerBandFill}" />`,
  );
  parts.push(
    `<text x="${(groupBox.xMm + groupBox.widthMm / 2).toFixed(2)}" y="${(groupBox.yMm + miniTitleH * 0.74).toFixed(2)}" text-anchor="middle" font-size="${miniTitleFs}" font-weight="800" fill="${accentDark}">${isBn ? 'বিভাগ (GROUP)' : 'GROUP / DEPT'}</text>`,
  );
  layout.groupBubbles.forEach((b, idx) => {
    const isFilled = preFillGroupIdx === idx;
    parts.push(
      `<circle cx="${b.xMm.toFixed(3)}" cy="${b.yMm.toFixed(3)}" r="${b.rMm.toFixed(3)}" fill="${isFilled ? '#000000' : '#ffffff'}" stroke="${isFilled ? '#000000' : bubbleStroke}" stroke-width="${bubbleStrokeW}" />`,
    );
    if (!isFilled) {
      parts.push(
        `<text x="${b.xMm.toFixed(3)}" y="${(b.yMm + b.rMm * 0.36).toFixed(3)}" text-anchor="middle" font-size="${(b.rMm * 1.02).toFixed(2)}" font-weight="700" fill="${accent}">${escapeXml(b.label)}</text>`,
      );
    }
    const grpCaption = isBn ? OMR_GROUP_OPTIONS[idx].captionBn : OMR_GROUP_OPTIONS[idx].shortEn;
    parts.push(
      `<text x="${b.xMm.toFixed(2)}" y="${(b.yMm - b.rMm - 0.85).toFixed(2)}" text-anchor="middle" font-size="${captionFs}" font-weight="700" fill="${subtleText}">${escapeXml(grpCaption)}</text>`,
    );
  });

  // Set Code Box (or Compact Filling Guide when setCount === 1)
  parts.push(
    `<rect data-grid="set" x="${setBox.xMm.toFixed(2)}" y="${setBox.yMm.toFixed(2)}" width="${setBox.widthMm.toFixed(2)}" height="${setBox.heightMm.toFixed(2)}" rx="1.2" fill="#ffffff" stroke="${borderColor}" stroke-width="0.26" />`,
  );
  parts.push(
    `<rect x="${setBox.xMm.toFixed(2)}" y="${setBox.yMm.toFixed(2)}" width="${setBox.widthMm.toFixed(2)}" height="${miniTitleH.toFixed(2)}" rx="1.0" fill="${headerBandFill}" />`,
  );

  if (layout.setCount === 4 && layout.setBubbles.length === 4) {
    parts.push(
      `<text x="${(setBox.xMm + setBox.widthMm / 2).toFixed(2)}" y="${(setBox.yMm + miniTitleH * 0.74).toFixed(2)}" text-anchor="middle" font-size="${miniTitleFs}" font-weight="800" fill="${accentDark}">${isBn ? 'সেট কোড (SET)' : 'SET CODE'}</text>`,
    );
    layout.setBubbles.forEach((b, idx) => {
      const isFilled = options.preFillSetIndex === idx;
      parts.push(
        `<circle cx="${b.xMm.toFixed(3)}" cy="${b.yMm.toFixed(3)}" r="${b.rMm.toFixed(3)}" fill="${isFilled ? '#000000' : '#ffffff'}" stroke="${isFilled ? '#000000' : bubbleStroke}" stroke-width="${bubbleStrokeW}" />`,
      );
      if (!isFilled) {
        parts.push(
          `<text x="${b.xMm.toFixed(3)}" y="${(b.yMm + b.rMm * 0.36).toFixed(3)}" text-anchor="middle" font-size="${(b.rMm * 1.05).toFixed(2)}" font-weight="700" fill="${accent}">${escapeXml(b.label)}</text>`,
        );
      }
    });
  } else {
    parts.push(
      `<text x="${(setBox.xMm + setBox.widthMm / 2).toFixed(2)}" y="${(setBox.yMm + miniTitleH * 0.74).toFixed(2)}" text-anchor="middle" font-size="${miniTitleFs}" font-weight="800" fill="${accentDark}">${isBn ? 'ভরাটের নিয়ম' : 'GUIDE'}</text>`,
    );
    const sampleY = setBox.yMm + setBox.heightMm * 0.68;
    const sampleR = isA4 ? 1.1 : 0.9;
    parts.push(`<circle cx="${(setBox.xMm + 6.0).toFixed(2)}" cy="${sampleY.toFixed(2)}" r="${sampleR}" fill="#000000" />`);
    parts.push(
      `<text x="${(setBox.xMm + 8.4).toFixed(2)}" y="${(sampleY + 0.7).toFixed(2)}" font-size="${captionFs}" font-weight="700" fill="#047857">${isBn ? 'সঠিক' : 'Right'}</text>`,
    );
    const wx = setBox.xMm + setBox.widthMm * 0.56;
    parts.push(`<circle cx="${wx.toFixed(2)}" cy="${sampleY.toFixed(2)}" r="${sampleR}" fill="none" stroke="#dc2626" stroke-width="0.24" />`);
    parts.push(`<line x1="${(wx - 0.7).toFixed(2)}" y1="${(sampleY - 0.7).toFixed(2)}" x2="${(wx + 0.7).toFixed(2)}" y2="${(sampleY + 0.7).toFixed(2)}" stroke="#dc2626" stroke-width="0.25" />`);
    parts.push(
      `<text x="${(wx + 2.2).toFixed(2)}" y="${(sampleY + 0.7).toFixed(2)}" font-size="${captionFs}" font-weight="700" fill="#dc2626">${isBn ? 'ভুল' : 'Wrong'}</text>`,
    );
  }

  // ── 3d. STUDENT INFO & SCORE BOX (FAR RIGHT) ────────────────────────────
  parts.push(
    `<rect x="${infoBox.xMm.toFixed(2)}" y="${infoBox.yMm.toFixed(2)}" width="${infoBox.widthMm.toFixed(2)}" height="${infoBox.heightMm.toFixed(2)}" rx="1.3" fill="#ffffff" stroke="${borderColor}" stroke-width="0.28" />`,
  );
  parts.push(
    `<rect x="${infoBox.xMm.toFixed(2)}" y="${infoBox.yMm.toFixed(2)}" width="${infoBox.widthMm.toFixed(2)}" height="${bandTitleH.toFixed(2)}" rx="1.1" fill="${headerBandFill}" />`,
  );
  parts.push(
    `<text x="${(infoBox.xMm + infoBox.widthMm / 2).toFixed(2)}" y="${(infoBox.yMm + bandTitleH * 0.73).toFixed(2)}" text-anchor="middle" font-size="${bandTitleFs}" font-weight="800" fill="${accentDark}">${isBn ? 'শিক্ষার্থীর তথ্য' : 'STUDENT INFO'}</text>`,
  );

  const infoLines: Array<{ label: string; value: string }> = [
    { label: isBn ? 'নাম:' : 'Name:', value: options.student?.name || '' },
    { label: isBn ? 'শ্রেণি:' : 'Class:', value: options.header.classLabel || '' },
    {
      label: isBn ? 'বিভাগ/শাখা:' : 'Grp/Sec:',
      value: options.student?.group || options.student?.section || options.header.sectionOrGroupLabel || '',
    },
    { label: isBn ? 'বিষয়:' : 'Sub:', value: options.header.subjectLabel || '' },
    { label: isBn ? 'তারিখ:' : 'Date:', value: options.header.examDate || '' },
  ];

  const infoPadX = isA4 ? 3.2 : 2.5;
  const infoStartY = infoBox.yMm + bandTitleH + (isA4 ? 7.2 : 6.0);
  const infoRowPitch = isA4 ? 8.8 : isA5 ? 7.0 : 7.3;
  const infoFs = isA4 ? 3.0 : isA5 ? 2.25 : 2.55;
  const labelW = isA4 ? 16.0 : isA5 ? 11.2 : 13.0;

  infoLines.forEach((line, idx) => {
    const ly = infoStartY + idx * infoRowPitch;
    parts.push(
      `<text x="${(infoBox.xMm + infoPadX).toFixed(2)}" y="${ly.toFixed(2)}" font-size="${infoFs}" font-weight="700" fill="${subtleText}">${escapeXml(line.label)}</text>`,
    );
    const valX = infoBox.xMm + infoPadX + labelW;
    if (line.value) {
      parts.push(
        `<text x="${valX.toFixed(2)}" y="${ly.toFixed(2)}" font-size="${infoFs}" font-weight="700" fill="#0f172a">${escapeXml(line.value.slice(0, isA5 ? 15 : 22))}</text>`,
      );
    }
    parts.push(
      `<line x1="${valX.toFixed(2)}" y1="${(ly + 1.2).toFixed(2)}" x2="${(infoBox.xMm + infoBox.widthMm - infoPadX).toFixed(2)}" y2="${(ly + 1.2).toFixed(2)}" stroke="${borderColor}" stroke-width="0.22" stroke-dasharray="0.9 0.7" />`,
    );
  });

  // Crisp Obtained Score Box at bottom of Student Info
  const scoreBoxH = isA4 ? 10.5 : 8.8;
  const scoreBoxY = infoBox.yMm + infoBox.heightMm - scoreBoxH - 2.2;

  parts.push(
    `<rect x="${(infoBox.xMm + infoPadX).toFixed(2)}" y="${scoreBoxY.toFixed(2)}" width="${(infoBox.widthMm - infoPadX * 2).toFixed(2)}" height="${scoreBoxH.toFixed(2)}" rx="1.1" fill="${rowAltFill}" stroke="${accent}" stroke-width="0.28" />`,
  );
  parts.push(
    `<text x="${(infoBox.xMm + infoPadX + 2.2).toFixed(2)}" y="${(scoreBoxY + scoreBoxH * 0.65).toFixed(2)}" font-size="${(infoFs * 1.02).toFixed(2)}" font-weight="800" fill="${accentDark}">${isBn ? 'প্রাপ্ত নম্বর:' : 'Score:'}</text>`,
  );
  parts.push(
    `<text x="${(infoBox.xMm + infoBox.widthMm - infoPadX - 2.2).toFixed(2)}" y="${(scoreBoxY + scoreBoxH * 0.65).toFixed(2)}" text-anchor="end" font-size="${(infoFs * 1.04).toFixed(2)}" font-weight="800" fill="${subtleText}">/ ${isBn ? toBanglaDigits(layout.questionCount) : layout.questionCount}</text>`,
  );

  // ── 4. DYNAMIC MCQ ANSWER COLUMNS (BOARD-GRADE BOLD BUBBLES, ZERO SIDE GAPS) ──
  const colHeaderH = isA4 ? 7.4 : isA5 ? 5.8 : 6.4;
  const colCount = layout.questionColumns.length;
  const qNumFs = isA4
    ? 3.5
    : colCount === 2
      ? isA5
        ? 3.0
        : 3.45
      : colCount === 3
        ? 2.65
        : isA5
          ? 2.15
          : 2.4;

  let qIdx = 0;
  for (const col of layout.questionColumns) {
    parts.push(
      `<rect x="${col.xMm.toFixed(2)}" y="${col.yMm.toFixed(2)}" width="${col.widthMm.toFixed(2)}" height="${col.heightMm.toFixed(2)}" rx="1.5" fill="#ffffff" stroke="${borderColor}" stroke-width="0.32" />`,
    );
    parts.push(
      `<rect x="${col.xMm.toFixed(2)}" y="${col.yMm.toFixed(2)}" width="${col.widthMm.toFixed(2)}" height="${colHeaderH.toFixed(2)}" rx="1.2" fill="${headerBandFill}" />`,
    );
    // Clean vertical divider separating Q# column from Option bubbles
    const sepX = col.xMm + (col.qNumXMm - col.xMm) * 2;
    parts.push(
      `<line x1="${sepX.toFixed(2)}" y1="${col.yMm.toFixed(2)}" x2="${sepX.toFixed(2)}" y2="${(col.yMm + col.heightMm).toFixed(2)}" stroke="${borderColor}" stroke-width="0.22" opacity="0.7" />`,
    );

    parts.push(
      `<text x="${col.qNumXMm.toFixed(2)}" y="${(col.yMm + colHeaderH * 0.7).toFixed(2)}" text-anchor="middle" font-size="${(qNumFs * 0.92).toFixed(2)}" font-weight="800" fill="${accentDark}">${isBn ? 'প্রশ্ন' : 'Q.'}</text>`,
    );
    layout.optionLabels.forEach((lbl, oIdx) => {
      parts.push(
        `<text x="${col.optionXMm[oIdx].toFixed(2)}" y="${(col.yMm + colHeaderH * 0.7).toFixed(2)}" text-anchor="middle" font-size="${(qNumFs * 0.98).toFixed(2)}" font-weight="800" fill="${accentDark}">${escapeXml(lbl)}</text>`,
      );
    });

    const rowCount = col.endQ - col.startQ + 1;
    for (let r = 0; r < rowCount; r++) {
      const qNumber = col.startQ + r;
      const rowBubbles = layout.questionBubbles[qIdx];
      const cy = rowBubbles[0].yMm;

      if (r % 2 === 1) {
        parts.push(
          `<rect x="${(col.xMm + 0.35).toFixed(2)}" y="${(cy - col.rowPitchMm / 2).toFixed(2)}" width="${(col.widthMm - 0.7).toFixed(2)}" height="${col.rowPitchMm.toFixed(2)}" fill="${rowAltFill}" />`,
        );
      }

      // Subtle row guide hairline so students align effortlessly across bubbles
      if (r < rowCount - 1) {
        parts.push(
          `<line x1="${(col.xMm + 0.6).toFixed(2)}" y1="${(cy + col.rowPitchMm / 2).toFixed(2)}" x2="${(col.xMm + col.widthMm - 0.6).toFixed(2)}" y2="${(cy + col.rowPitchMm / 2).toFixed(2)}" stroke="${borderColor}" stroke-width="0.14" opacity="0.45" />`,
        );
      }

      const qLabel = isBn ? toBanglaDigits(qNumber) : String(qNumber);
      parts.push(
        `<text x="${col.qNumXMm.toFixed(2)}" y="${(cy + qNumFs * 0.35).toFixed(2)}" text-anchor="middle" font-size="${qNumFs}" font-weight="800" fill="${accentDark}">${qLabel}</text>`,
      );

      const preFilledOpt = options.preFillAnswers ? options.preFillAnswers[qIdx] : null;
      rowBubbles.forEach((b, optIdx) => {
        const isFilled = preFilledOpt === optIdx;
        parts.push(
          `<circle cx="${b.xMm.toFixed(3)}" cy="${b.yMm.toFixed(3)}" r="${b.rMm.toFixed(3)}" fill="${isFilled ? '#000000' : '#ffffff'}" stroke="${isFilled ? '#000000' : bubbleStroke}" stroke-width="${bubbleStrokeW}" />`,
        );
        if (!isFilled) {
          parts.push(
            `<text x="${b.xMm.toFixed(3)}" y="${(b.yMm + b.rMm * 0.36).toFixed(3)}" text-anchor="middle" font-size="${(b.rMm * 1.02).toFixed(2)}" font-weight="700" fill="${accent}">${escapeXml(b.label)}</text>`,
          );
        }
      });

      qIdx++;
    }
  }

  // ── 5. BALANCED BOTTOM INSTRUCTIONS & OFFICIAL SIGNATURE PANEL (ZERO DEAD SPACE!) ──
  const bottomLimitY = fiducials.bl.yMm - (isA4 ? 6.0 : 4.8);
  const footerBoxY = layout.mcqBandBox.yMm + layout.mcqBandBox.heightMm + (isA4 ? 3.2 : 2.2);
  const footerBoxH = bottomLimitY - footerBoxY;
  const fx = layout.mcqBandBox.xMm;
  const fw = layout.mcqBandBox.widthMm;

  if (footerBoxH >= 10.5) {
    const isExpandedFooter = footerBoxH >= 23.0;
    const fPad = isA4 ? 3.5 : 2.6;
    const smallR = isA4 ? 1.15 : 0.95; // Tiny legend icons (well below scannable bubble radius)

    if (isExpandedFooter) {
      // Generous 2-Card Official Board Instructions + Signatures Box (ideal for 10–20 MCQ sheets!)
      const leftCardW = fw * 0.54;
      const cardGap = 2.6;
      const rightCardX = fx + leftCardW + cardGap;
      const rightCardW = fw - leftCardW - cardGap;
      const cardTitleH = isA4 ? 5.6 : 4.6;
      const cardTitleFs = isA4 ? 2.9 : 2.35;
      const bodyFs = isA4 ? 2.6 : 2.15;

      // Left Card: Filling Rules & Visual Guide
      parts.push(
        `<rect x="${fx.toFixed(2)}" y="${footerBoxY.toFixed(2)}" width="${leftCardW.toFixed(2)}" height="${footerBoxH.toFixed(2)}" rx="1.4" fill="${rowAltFill}" stroke="${borderColor}" stroke-width="0.28" />`,
      );
      parts.push(
        `<rect x="${fx.toFixed(2)}" y="${footerBoxY.toFixed(2)}" width="${leftCardW.toFixed(2)}" height="${cardTitleH.toFixed(2)}" rx="1.2" fill="${headerBandFill}" />`,
      );
      parts.push(
        `<text x="${(fx + leftCardW / 2).toFixed(2)}" y="${(footerBoxY + cardTitleH * 0.72).toFixed(2)}" text-anchor="middle" font-size="${cardTitleFs}" font-weight="800" fill="${accentDark}">${isBn ? 'উত্তরপত্র পূরণের নির্দেশাবলী' : 'OMR FILLING INSTRUCTIONS'}</text>`,
      );

      // Visual correct vs wrong samples
      const legY = footerBoxY + cardTitleH + 4.4;
      parts.push(`<circle cx="${(fx + fPad + 2.2).toFixed(2)}" cy="${legY.toFixed(2)}" r="${smallR}" fill="#000000" />`);
      parts.push(
        `<text x="${(fx + fPad + 4.6).toFixed(2)}" y="${(legY + 0.75).toFixed(2)}" font-size="${bodyFs}" font-weight="800" fill="#047857">${isBn ? 'সঠিক পদ্ধতি' : 'Correct'}</text>`,
      );

      const wx1 = fx + leftCardW * 0.44;
      parts.push(`<circle cx="${wx1.toFixed(2)}" cy="${legY.toFixed(2)}" r="${smallR}" fill="#ffffff" stroke="#dc2626" stroke-width="0.26" />`);
      parts.push(`<line x1="${(wx1 - 0.75).toFixed(2)}" y1="${(legY - 0.75).toFixed(2)}" x2="${(wx1 + 0.75).toFixed(2)}" y2="${(legY + 0.75).toFixed(2)}" stroke="#dc2626" stroke-width="0.28" />`);
      parts.push(`<line x1="${(wx1 + 0.75).toFixed(2)}" y1="${(legY - 0.75).toFixed(2)}" x2="${(wx1 - 0.75).toFixed(2)}" y2="${(legY + 0.75).toFixed(2)}" stroke="#dc2626" stroke-width="0.28" />`);
      const wx2 = wx1 + 3.4;
      parts.push(`<circle cx="${wx2.toFixed(2)}" cy="${legY.toFixed(2)}" r="${smallR}" fill="#ffffff" stroke="#dc2626" stroke-width="0.26" />`);
      parts.push(`<circle cx="${wx2.toFixed(2)}" cy="${legY.toFixed(2)}" r="${(smallR * 0.45).toFixed(2)}" fill="#dc2626" />`);
      parts.push(
        `<text x="${(wx2 + 2.4).toFixed(2)}" y="${(legY + 0.75).toFixed(2)}" font-size="${bodyFs}" font-weight="800" fill="#dc2626">${isBn ? 'ভুল পদ্ধতি (বাতিল)' : 'Wrong'}</text>`,
      );

      const rules = isBn
        ? [
            '১. শুধুমাত্র কালো কালির বলপেন দিয়ে সঠিক বৃত্তটি সম্পূর্ণ ভরাট করুন।',
            '২. প্রতিটি প্রশ্নের জন্য একাধিক বৃত্ত ভরাট করলে উত্তর বাতিল বলে গণ্য হবে।',
            '৩. OMR শিটটি ভাঁজ, ছেঁড়া বা ৪ কোণার কালো চিহ্নে দাগ দেওয়া সম্পূর্ণ নিষেধ।',
          ]
        : [
            '1. Use only a black ballpoint pen to darken the selected circle completely.',
            '2. Marking more than one circle for a question invalidates that answer.',
            '3. Do not fold, tear, or mark over the 4 black corner alignment squares.',
          ];

      const ruleStartY = legY + 5.0;
      const ruleGap = Math.min(5.2, Math.max(3.6, (footerBoxH - cardTitleH - 11.5) / 3));
      rules.forEach((rule, idx) => {
        parts.push(
          `<text x="${(fx + fPad).toFixed(2)}" y="${(ruleStartY + idx * ruleGap).toFixed(2)}" font-size="${(bodyFs * 0.94).toFixed(2)}" font-weight="600" fill="#334155">${escapeXml(rule)}</text>`,
        );
      });

      // Right Card: Official Signatures & Evaluation
      parts.push(
        `<rect x="${rightCardX.toFixed(2)}" y="${footerBoxY.toFixed(2)}" width="${rightCardW.toFixed(2)}" height="${footerBoxH.toFixed(2)}" rx="1.4" fill="#ffffff" stroke="${borderColor}" stroke-width="0.28" />`,
      );
      parts.push(
        `<rect x="${rightCardX.toFixed(2)}" y="${footerBoxY.toFixed(2)}" width="${rightCardW.toFixed(2)}" height="${cardTitleH.toFixed(2)}" rx="1.2" fill="${headerBandFill}" />`,
      );
      parts.push(
        `<text x="${(rightCardX + rightCardW / 2).toFixed(2)}" y="${(footerBoxY + cardTitleH * 0.72).toFixed(2)}" text-anchor="middle" font-size="${cardTitleFs}" font-weight="800" fill="${accentDark}">${isBn ? 'স্বাক্ষর ও অফিসিয়াল মূল্যায়ন' : 'SIGNATURES & EVALUATION'}</text>`,
      );

      const sigLabels = isBn
        ? ['শিক্ষার্থীর স্বাক্ষর', 'কক্ষ পরিদর্শকের স্বাক্ষর', 'পরীক্ষকের স্বাক্ষর ও তারিখ']
        : ['Student Signature', 'Invigilator Signature', 'Examiner Sign & Date'];
      const sigRowTop = footerBoxY + cardTitleH + 3.2;
      const sigRowH = (footerBoxH - cardTitleH - 5.2) / 3;
      sigLabels.forEach((sLbl, idx) => {
        const lineY = sigRowTop + (idx + 1) * sigRowH - 2.6;
        parts.push(
          `<line x1="${(rightCardX + fPad + 2).toFixed(2)}" y1="${lineY.toFixed(2)}" x2="${(rightCardX + rightCardW - fPad - 2).toFixed(2)}" y2="${lineY.toFixed(2)}" stroke="${borderColor}" stroke-width="0.24" stroke-dasharray="1.2 0.9" />`,
        );
        parts.push(
          `<text x="${(rightCardX + rightCardW / 2).toFixed(2)}" y="${(lineY + 2.7).toFixed(2)}" text-anchor="middle" font-size="${(bodyFs * 0.92).toFixed(2)}" font-weight="700" fill="${subtleText}">${escapeXml(sLbl)}</text>`,
        );
      });
    } else {
      // Compact Single-Row Institutional Strip (ideal for 25–30 MCQ sheets!)
      parts.push(
        `<rect x="${fx.toFixed(2)}" y="${footerBoxY.toFixed(2)}" width="${fw.toFixed(2)}" height="${footerBoxH.toFixed(2)}" rx="1.3" fill="${rowAltFill}" stroke="${borderColor}" stroke-width="0.26" />`,
      );
      const midY = footerBoxY + footerBoxH * 0.54;
      const compactFs = isA4 ? 2.5 : 2.05;

      // Left inline legend
      parts.push(`<circle cx="${(fx + 3.8).toFixed(2)}" cy="${(midY - 0.5).toFixed(2)}" r="${smallR}" fill="#000000" />`);
      parts.push(
        `<text x="${(fx + 6.0).toFixed(2)}" y="${(midY + 0.3).toFixed(2)}" font-size="${compactFs}" font-weight="800" fill="#047857">${isBn ? 'সঠিক' : 'Right'}</text>`,
      );
      const cwx = fx + (isA5 ? 16.5 : 19.5);
      parts.push(`<circle cx="${cwx.toFixed(2)}" cy="${(midY - 0.5).toFixed(2)}" r="${smallR}" fill="#ffffff" stroke="#dc2626" stroke-width="0.24" />`);
      parts.push(`<line x1="${(cwx - 0.7).toFixed(2)}" y1="${(midY - 1.2).toFixed(2)}" x2="${(cwx + 0.7).toFixed(2)}" y2="${(midY + 0.2).toFixed(2)}" stroke="#dc2626" stroke-width="0.25" />`);
      parts.push(
        `<text x="${(cwx + 2.2).toFixed(2)}" y="${(midY + 0.3).toFixed(2)}" font-size="${compactFs}" font-weight="800" fill="#dc2626">${isBn ? 'ভুল' : 'Wrong'}</text>`,
      );
      parts.push(
        `<text x="${(cwx + (isA5 ? 9.5 : 11.5)).toFixed(2)}" y="${(midY + 0.3).toFixed(2)}" font-size="${(compactFs * 0.92).toFixed(2)}" font-weight="600" fill="#475569">${isBn ? '· কালো বলপেন ব্যবহার করুন' : '· Use black ballpoint pen'}</text>`,
      );

      // Right 2 signature lines
      const sigAreaStart = fx + fw * 0.56;
      const sigSlotW = (fw * 0.42) / 2;
      const compactSigs = isBn
        ? ['শিক্ষার্থীর স্বাক্ষর', 'কক্ষ পরিদর্শকের স্বাক্ষর']
        : ['Student Sign', 'Invigilator Sign'];
      compactSigs.forEach((lbl, idx) => {
        const sx0 = sigAreaStart + idx * (sigSlotW + 2.5);
        const sx1 = sx0 + sigSlotW - 1.5;
        const slY = footerBoxY + footerBoxH - 4.4;
        parts.push(
          `<line x1="${sx0.toFixed(2)}" y1="${slY.toFixed(2)}" x2="${sx1.toFixed(2)}" y2="${slY.toFixed(2)}" stroke="${borderColor}" stroke-width="0.24" stroke-dasharray="1 0.8" />`,
        );
        parts.push(
          `<text x="${((sx0 + sx1) / 2).toFixed(2)}" y="${(slY + 2.9).toFixed(2)}" text-anchor="middle" font-size="${(compactFs * 0.92).toFixed(2)}" font-weight="700" fill="${subtleText}">${escapeXml(lbl)}</text>`,
        );
      });
    }
  }

  // Subtle footer code inside bottom border (clear of corner fiducials)
  const footerText = `SchoolPro OMR · ${layout.paperFormat.toUpperCase()} · ${layout.questionCount}Q · ${layout.rollDigits}D`;
  parts.push(
    `<text x="${(preset.pageWidthMm / 2).toFixed(2)}" y="${(preset.pageHeightMm - preset.fiducialInsetMm + 1.2).toFixed(2)}" text-anchor="middle" font-size="${isA4 ? 2.4 : 2.0}" font-weight="600" fill="#94a3b8">${escapeXml(footerText)}</text>`,
  );

  parts.push('</svg>');
  return parts.join('\n');
}

/**
 * Composes two Legal Half-Sheet SVGs (each 177.8mm x 215.9mm) side-by-side onto
 * an exact Legal Landscape sheet (355.6mm x 215.9mm / 14in x 8.5in) with a crisp
 * dashed center cutting line at x = 177.8mm and top & bottom scissor (✂) guide marks.
 */
export function generateLegalTwoUpPrintSvg(leftSheetSvg: string, rightSheetSvg?: string): string {
  const stripOuterSvg = (svg: string) =>
    svg
      .replace(/^<svg[^>]*>/i, '')
      .replace(/<\/svg>\s*$/i, '');

  const leftInner = stripOuterSvg(leftSheetSvg);
  const rightInner = rightSheetSvg ? stripOuterSvg(rightSheetSvg) : '';
  const cx = LEGAL_HALF_WIDTH_MM; // 177.8mm

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LEGAL_LANDSCAPE_WIDTH_MM} ${LEGAL_LANDSCAPE_HEIGHT_MM}" width="${LEGAL_LANDSCAPE_WIDTH_MM}mm" height="${LEGAL_LANDSCAPE_HEIGHT_MM}mm" style="background:#ffffff;display:block;font-family:'Hind Siliguri','Noto Sans Bengali','Segoe UI',Arial,sans-serif;">`,
    `<rect x="0" y="0" width="${LEGAL_LANDSCAPE_WIDTH_MM}" height="${LEGAL_LANDSCAPE_HEIGHT_MM}" fill="#ffffff" />`,
    `<g data-slot="left" transform="translate(0, 0)">${leftInner}</g>`,
    rightInner
      ? `<g data-slot="right" transform="translate(${cx}, 0)">${rightInner}</g>`
      : '',
    // Exact center cutting line at x = 177.8mm with top & bottom scissor marks
    `<line data-cutting-line="center" x1="${cx}" y1="0" x2="${cx}" y2="${LEGAL_LANDSCAPE_HEIGHT_MM}" stroke="#64748b" stroke-width="0.35" stroke-dasharray="3 2" />`,
    `<text data-scissor-guide="top" x="${cx}" y="5.5" text-anchor="middle" font-size="4.2" fill="#475569">✂</text>`,
    `<text data-scissor-guide="bottom" x="${cx}" y="${(LEGAL_LANDSCAPE_HEIGHT_MM - 2.2).toFixed(1)}" text-anchor="middle" font-size="4.2" fill="#475569">✂</text>`,
    `<text x="${(cx + 2.2).toFixed(1)}" y="${(LEGAL_LANDSCAPE_HEIGHT_MM / 2).toFixed(1)}" text-anchor="middle" font-size="2.2" font-weight="700" fill="#94a3b8" transform="rotate(-90 ${(cx + 2.2).toFixed(1)} ${(LEGAL_LANDSCAPE_HEIGHT_MM / 2).toFixed(1)})">✂ কাটিং লাইন (সমান দুই ভাগে কাটুন)</text>`,
    `</svg>`,
  ].join('\n');
}
