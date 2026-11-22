/**
 * Exact-Millimeter Vector SVG OMR Sheet Generator
 *
 * Produces crisp, print-ready OMR sheets with:
 *  - 4 solid black corner fiducial squares for exact perspective correction
 *  - Pink dropout border theme (#d4146e rings/labels, #fff1f7 alternating rows)
 *    for maximal black/blue pen contrast, plus B&W Laser mode
 *  - Uniform bubble radius across all scannable bubbles (tiny sample icons so
 *    they are never mistaken for real bubbles)
 *  - Optional pre-labeled student name/roll & pre-filled roll bubbles for
 *    class-wise batch printing with near-zero roll errors
 */

import {
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

function getRollDigitsArray(roll: string, digitCount: number): number[] {
  const digitsOnly = toAsciiDigits(roll || '').replace(/\D/g, '');
  const padded = digitsOnly.slice(-digitCount).padStart(digitCount, '0');
  return padded.split('').map((ch) => Math.max(0, Math.min(9, parseInt(ch, 10) || 0)));
}

/**
 * Generates a standalone exact-mm SVG string for a single OMR sheet.
 */
export function generateOmrSheetSvg(options: OmrSheetRenderOptions): string {
  const layout: OmrResolvedLayout = getOmrTemplateLayout(options);
  const { preset, fiducials, rollBox, setBox, infoBox, headerBox } = layout;
  const isPink = (options.colorTheme ?? 'pink') === 'pink';
  const isBn = layout.optionStyle === 'bn';
  const isA4 = preset.pageSize === 'A4';

  // Color tokens — pink dropout ink disappears in the Red channel while black/blue ink pops!
  const accent = isPink ? '#d4146e' : '#334155';
  const accentDark = isPink ? '#9d174d' : '#0f172a';
  const rowAltFill = isPink ? '#fff1f7' : '#f8fafc';
  const headerBandFill = isPink ? '#fce7f3' : '#e2e8f0';
  const borderColor = isPink ? '#f472b6' : '#64748b';
  const subtleText = isPink ? '#be185d' : '#475569';
  const bubbleStroke = isPink ? '#d4146e' : '#475569';
  const bubbleStrokeW = isA4 ? 0.28 : 0.24;

  const preFilledRollDigits =
    options.student && options.preFillRollBubbles
      ? getRollDigitsArray(options.student.roll, layout.rollDigits)
      : null;

  const displayRollDigits = options.student
    ? getRollDigitsArray(options.student.roll, layout.rollDigits)
    : null;

  const parts: string[] = [];

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${preset.pageWidthMm} ${preset.pageHeightMm}" width="${preset.pageWidthMm}mm" height="${preset.pageHeightMm}mm" style="background:#ffffff;display:block;font-family:'Hind Siliguri','Noto Sans Bengali','Segoe UI',Arial,sans-serif;">`,
  );

  // Solid white paper background
  parts.push(`<rect x="0" y="0" width="${preset.pageWidthMm}" height="${preset.pageHeightMm}" fill="#ffffff" />`);

  // ── 1. FOUR SOLID BLACK CORNER FIDUCIAL SQUARES ─────────────────────────
  const fList = [fiducials.tl, fiducials.tr, fiducials.br, fiducials.bl];
  for (const f of fList) {
    const half = f.sizeMm / 2;
    parts.push(
      `<rect data-fiducial="${f.id}" x="${(f.xMm - half).toFixed(3)}" y="${(f.yMm - half).toFixed(3)}" width="${f.sizeMm.toFixed(3)}" height="${f.sizeMm.toFixed(3)}" fill="#000000" />`,
    );
  }

  // Outer light decorative frame inside fiducials (keeps clear margin around fiducial marks)
  const frameInsetX = preset.fiducialInsetMm + preset.fiducialSizeMm * 0.9;
  const frameInsetY = preset.fiducialInsetMm + preset.fiducialSizeMm * 0.72;
  parts.push(
    `<rect x="${frameInsetX.toFixed(2)}" y="${frameInsetY.toFixed(2)}" width="${(preset.pageWidthMm - frameInsetX * 2).toFixed(2)}" height="${(preset.pageHeightMm - frameInsetY * 2).toFixed(2)}" rx="1.6" fill="none" stroke="${borderColor}" stroke-width="0.25" />`,
  );

  // ── 2. INSTITUTIONAL HEADER ─────────────────────────────────────────────
  const hx = headerBox.xMm;
  const hy = headerBox.yMm;
  const hw = headerBox.widthMm;
  const hh = headerBox.heightMm;

  parts.push(
    `<rect x="${hx.toFixed(2)}" y="${hy.toFixed(2)}" width="${hw.toFixed(2)}" height="${hh.toFixed(2)}" rx="1.5" fill="${rowAltFill}" stroke="${borderColor}" stroke-width="0.28" />`,
  );

  const hasLogo = Boolean(options.header.schoolLogo && options.header.schoolLogo.length > 5);
  const logoSize = isA4 ? 15 : 12.5;
  if (hasLogo) {
    parts.push(
      `<image href="${escapeXml(options.header.schoolLogo)}" x="${(hx + 3).toFixed(2)}" y="${(hy + (hh - logoSize) / 2).toFixed(2)}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet" />`,
    );
  }

  const centerX = hx + hw / 2 + (hasLogo ? 3 : 0);
  const schoolNameFs = isA4 ? 5.6 : 4.4;
  const examTitleFs = isA4 ? 3.8 : 3.1;
  const subMetaFs = isA4 ? 3.1 : 2.55;

  parts.push(
    `<text x="${centerX.toFixed(2)}" y="${(hy + (isA4 ? 8.0 : 6.6)).toFixed(2)}" text-anchor="middle" font-size="${schoolNameFs}" font-weight="800" fill="${accentDark}">${escapeXml(options.header.schoolName || 'শিক্ষা প্রতিষ্ঠান')}</text>`,
  );

  const subAddressLine = [
    options.header.schoolAddress,
    options.header.eiin ? `EIIN: ${options.header.eiin}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  if (subAddressLine) {
    parts.push(
      `<text x="${centerX.toFixed(2)}" y="${(hy + (isA4 ? 12.5 : 10.2)).toFixed(2)}" text-anchor="middle" font-size="${(subMetaFs * 0.92).toFixed(2)}" font-weight="600" fill="${subtleText}">${escapeXml(subAddressLine)}</text>`,
    );
  }

  // Exam & Subject pill
  const examBadgeText = `${options.header.examTitle || 'বহুনির্বাচনি পরীক্ষা'} · ${isBn ? 'OMR উত্তরপত্র' : 'OMR ANSWER SHEET'}`;
  parts.push(
    `<text x="${centerX.toFixed(2)}" y="${(hy + (isA4 ? 18.2 : 14.9)).toFixed(2)}" text-anchor="middle" font-size="${examTitleFs}" font-weight="700" fill="${accent}">${escapeXml(examBadgeText)}</text>`,
  );

  const classSubLine = [
    `${isBn ? 'শ্রেণি' : 'Class'}: ${options.header.classLabel}`,
    options.header.sectionOrGroupLabel ? `${options.header.sectionOrGroupLabel}` : '',
    `${isBn ? 'বিষয়' : 'Subject'}: ${options.header.subjectLabel}${options.header.subjectCode ? ` (${options.header.subjectCode})` : ''}`,
    `${isBn ? 'পূর্ণমান' : 'Full Marks'}: ${isBn ? toBanglaDigits(preset.questionCount) : preset.questionCount}`,
  ]
    .filter(Boolean)
    .join('   |   ');

  parts.push(
    `<text x="${centerX.toFixed(2)}" y="${(hy + (isA4 ? 23.2 : 19.3)).toFixed(2)}" text-anchor="middle" font-size="${subMetaFs}" font-weight="700" fill="#1e293b">${escapeXml(classSubLine)}</text>`,
  );

  // ── 3. ROLL NUMBER BUBBLE GRID ──────────────────────────────────────────
  parts.push(
    `<rect x="${rollBox.xMm.toFixed(2)}" y="${rollBox.yMm.toFixed(2)}" width="${rollBox.widthMm.toFixed(2)}" height="${rollBox.heightMm.toFixed(2)}" rx="1.4" fill="#ffffff" stroke="${borderColor}" stroke-width="0.3" />`,
  );
  const rollTitleH = isA4 ? 5.2 : 4.4;
  parts.push(
    `<rect x="${rollBox.xMm.toFixed(2)}" y="${rollBox.yMm.toFixed(2)}" width="${rollBox.widthMm.toFixed(2)}" height="${rollTitleH}" rx="1.2" fill="${headerBandFill}" />`,
  );
  parts.push(
    `<text x="${(rollBox.xMm + rollBox.widthMm / 2).toFixed(2)}" y="${(rollBox.yMm + rollTitleH * 0.72).toFixed(2)}" text-anchor="middle" font-size="${isA4 ? 3.1 : 2.55}" font-weight="800" fill="${accentDark}">${isBn ? 'রোল নম্বর (ROLL NO)' : 'ROLL NUMBER'}</text>`,
  );

  const writeBoxSize = isA4 ? 5.6 : 4.6;
  const writeBoxY = rollBox.writeBoxYMm;

  for (let dCol = 0; dCol < layout.rollDigits; dCol++) {
    const colBubbles = layout.rollBubbles[dCol];
    const cx = colBubbles[0].xMm;
    // Top digit write-in box
    parts.push(
      `<rect x="${(cx - writeBoxSize / 2).toFixed(2)}" y="${writeBoxY.toFixed(2)}" width="${writeBoxSize.toFixed(2)}" height="${writeBoxSize.toFixed(2)}" rx="0.6" fill="#ffffff" stroke="${accent}" stroke-width="0.25" />`,
    );
    if (displayRollDigits) {
      const digitText = isBn ? toBanglaDigits(displayRollDigits[dCol]) : String(displayRollDigits[dCol]);
      parts.push(
        `<text x="${cx.toFixed(2)}" y="${(writeBoxY + writeBoxSize * 0.74).toFixed(2)}" text-anchor="middle" font-size="${isA4 ? 3.6 : 3.0}" font-weight="800" fill="#0f172a">${digitText}</text>`,
      );
    }

    for (let digit = 0; digit <= 9; digit++) {
      const b = colBubbles[digit];
      const isFilled = Boolean(preFilledRollDigits && preFilledRollDigits[dCol] === digit);
      parts.push(
        `<circle cx="${b.xMm.toFixed(3)}" cy="${b.yMm.toFixed(3)}" r="${b.rMm.toFixed(3)}" fill="${isFilled ? '#000000' : '#ffffff'}" stroke="${isFilled ? '#000000' : bubbleStroke}" stroke-width="${bubbleStrokeW}" />`,
      );
      if (!isFilled) {
        parts.push(
          `<text x="${b.xMm.toFixed(3)}" y="${(b.yMm + b.rMm * 0.36).toFixed(3)}" text-anchor="middle" font-size="${(b.rMm * 1.15).toFixed(2)}" font-weight="700" fill="${accent}">${escapeXml(b.label)}</text>`,
        );
      }
    }
  }

  // ── 4. SET CODE GRID & INSTRUCTIONS (MIDDLE) ────────────────────────────
  if (layout.setCount === 4 && layout.setBubbles.length === 4) {
    parts.push(
      `<rect x="${setBox.xMm.toFixed(2)}" y="${setBox.yMm.toFixed(2)}" width="${setBox.widthMm.toFixed(2)}" height="${setBox.heightMm.toFixed(2)}" rx="1.4" fill="#ffffff" stroke="${borderColor}" stroke-width="0.3" />`,
    );
    parts.push(
      `<rect x="${setBox.xMm.toFixed(2)}" y="${setBox.yMm.toFixed(2)}" width="${setBox.widthMm.toFixed(2)}" height="${rollTitleH}" rx="1.2" fill="${headerBandFill}" />`,
    );
    parts.push(
      `<text x="${(setBox.xMm + setBox.widthMm / 2).toFixed(2)}" y="${(setBox.yMm + rollTitleH * 0.72).toFixed(2)}" text-anchor="middle" font-size="${isA4 ? 3.0 : 2.45}" font-weight="800" fill="${accentDark}">${isBn ? 'সেট কোড (SET)' : 'SET CODE'}</text>`,
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

    // Compact instructions & invigilator box below Set Code
    const guideY = setBox.yMm + setBox.heightMm + (isA4 ? 3.0 : 2.2);
    const guideH = rollBox.heightMm - setBox.heightMm - (isA4 ? 3.0 : 2.2);
    parts.push(
      `<rect x="${setBox.xMm.toFixed(2)}" y="${guideY.toFixed(2)}" width="${setBox.widthMm.toFixed(2)}" height="${guideH.toFixed(2)}" rx="1.4" fill="#ffffff" stroke="${borderColor}" stroke-width="0.25" />`,
    );
    const gFs = isA4 ? 2.5 : 2.05;
    parts.push(
      `<text x="${(setBox.xMm + setBox.widthMm / 2).toFixed(2)}" y="${(guideY + (isA4 ? 4.6 : 3.8)).toFixed(2)}" text-anchor="middle" font-size="${gFs}" font-weight="800" fill="${accentDark}">${isBn ? 'বৃত্ত ভরাটের নিয়ম' : 'FILLING GUIDE'}</text>`,
    );

    // Tiny sample bubbles (r <= 1.0mm — never mistaken for real bubbles)
    const sampleY = guideY + (isA4 ? 10.5 : 8.5);
    const sampleR = isA4 ? 1.15 : 0.95;
    parts.push(`<circle cx="${(setBox.xMm + 6.5).toFixed(2)}" cy="${sampleY.toFixed(2)}" r="${sampleR}" fill="#000000" />`);
    parts.push(
      `<text x="${(setBox.xMm + 9.2).toFixed(2)}" y="${(sampleY + 0.8).toFixed(2)}" font-size="${gFs}" font-weight="700" fill="#047857">${isBn ? 'সঠিক' : 'Right'}</text>`,
    );
    const wrongX = setBox.xMm + setBox.widthMm * 0.56;
    parts.push(`<circle cx="${wrongX.toFixed(2)}" cy="${sampleY.toFixed(2)}" r="${sampleR}" fill="none" stroke="#dc2626" stroke-width="0.25" />`);
    parts.push(`<line x1="${(wrongX - 0.8).toFixed(2)}" y1="${(sampleY - 0.8).toFixed(2)}" x2="${(wrongX + 0.8).toFixed(2)}" y2="${(sampleY + 0.8).toFixed(2)}" stroke="#dc2626" stroke-width="0.28" />`);
    parts.push(
      `<text x="${(wrongX + 2.5).toFixed(2)}" y="${(sampleY + 0.8).toFixed(2)}" font-size="${gFs}" font-weight="700" fill="#dc2626">${isBn ? 'ভুল' : 'Wrong'}</text>`,
    );

    parts.push(
      `<text x="${(setBox.xMm + setBox.widthMm / 2).toFixed(2)}" y="${(guideY + (isA4 ? 17.5 : 14.2)).toFixed(2)}" text-anchor="middle" font-size="${(gFs * 0.92).toFixed(2)}" fill="#475569">${isBn ? 'কালো বলপেন ব্যবহার করুন' : 'Use black ballpoint pen'}</text>`,
    );

    // Invigilator signature line at bottom of guide box
    const sigY = guideY + guideH - (isA4 ? 5.5 : 4.2);
    parts.push(
      `<line x1="${(setBox.xMm + 3.5).toFixed(2)}" y1="${sigY.toFixed(2)}" x2="${(setBox.xMm + setBox.widthMm - 3.5).toFixed(2)}" y2="${sigY.toFixed(2)}" stroke="${borderColor}" stroke-width="0.22" stroke-dasharray="1 0.8" />`,
    );
    parts.push(
      `<text x="${(setBox.xMm + setBox.widthMm / 2).toFixed(2)}" y="${(sigY + (isA4 ? 3.5 : 2.8)).toFixed(2)}" text-anchor="middle" font-size="${(gFs * 0.92).toFixed(2)}" font-weight="700" fill="${subtleText}">${isBn ? 'পরিদর্শকের স্বাক্ষর' : 'Invigilator Sign'}</text>`,
    );
  }

  // ── 5. STUDENT INFO & SCORE BOX (RIGHT) ─────────────────────────────────
  parts.push(
    `<rect x="${infoBox.xMm.toFixed(2)}" y="${infoBox.yMm.toFixed(2)}" width="${infoBox.widthMm.toFixed(2)}" height="${infoBox.heightMm.toFixed(2)}" rx="1.4" fill="#ffffff" stroke="${borderColor}" stroke-width="0.3" />`,
  );
  parts.push(
    `<rect x="${infoBox.xMm.toFixed(2)}" y="${infoBox.yMm.toFixed(2)}" width="${infoBox.widthMm.toFixed(2)}" height="${rollTitleH}" rx="1.2" fill="${headerBandFill}" />`,
  );
  parts.push(
    `<text x="${(infoBox.xMm + infoBox.widthMm / 2).toFixed(2)}" y="${(infoBox.yMm + rollTitleH * 0.72).toFixed(2)}" text-anchor="middle" font-size="${isA4 ? 3.0 : 2.45}" font-weight="800" fill="${accentDark}">${isBn ? 'শিক্ষার্থীর তথ্য' : 'STUDENT DETAILS'}</text>`,
  );

  const infoLines: Array<{ label: string; value: string }> = [
    { label: isBn ? 'নাম:' : 'Name:', value: options.student?.name || '' },
    { label: isBn ? 'শ্রেণি:' : 'Class:', value: options.header.classLabel || '' },
    {
      label: isBn ? 'শাখা/বিভাগ:' : 'Sec/Grp:',
      value: options.student?.section || options.student?.group || options.header.sectionOrGroupLabel || '',
    },
    { label: isBn ? 'বিষয়:' : 'Subject:', value: options.header.subjectLabel || '' },
    { label: isBn ? 'তারিখ:' : 'Date:', value: options.header.examDate || '' },
  ];

  const infoPadX = isA4 ? 3.2 : 2.6;
  const infoStartY = infoBox.yMm + rollTitleH + (isA4 ? 6.5 : 5.4);
  const infoRowPitch = isA4 ? 8.2 : 7.0;
  const infoFs = isA4 ? 2.9 : 2.35;

  infoLines.forEach((line, idx) => {
    const ly = infoStartY + idx * infoRowPitch;
    parts.push(
      `<text x="${(infoBox.xMm + infoPadX).toFixed(2)}" y="${ly.toFixed(2)}" font-size="${infoFs}" font-weight="700" fill="${subtleText}">${escapeXml(line.label)}</text>`,
    );
    const valX = infoBox.xMm + infoPadX + (isA4 ? 17.5 : 13.5);
    if (line.value) {
      parts.push(
        `<text x="${valX.toFixed(2)}" y="${ly.toFixed(2)}" font-size="${infoFs}" font-weight="700" fill="#0f172a">${escapeXml(line.value.slice(0, 22))}</text>`,
      );
    }
    parts.push(
      `<line x1="${valX.toFixed(2)}" y1="${(ly + 1.2).toFixed(2)}" x2="${(infoBox.xMm + infoBox.widthMm - infoPadX).toFixed(2)}" y2="${(ly + 1.2).toFixed(2)}" stroke="${borderColor}" stroke-width="0.2" stroke-dasharray="0.9 0.7" />`,
    );
  });

  // Obtained Score Box at bottom right of Student Info
  const scoreBoxH = isA4 ? 10.0 : 8.5;
  const scoreBoxY = infoBox.yMm + infoBox.heightMm - scoreBoxH - 2.2;
  parts.push(
    `<rect x="${(infoBox.xMm + infoPadX).toFixed(2)}" y="${scoreBoxY.toFixed(2)}" width="${(infoBox.widthMm - infoPadX * 2).toFixed(2)}" height="${scoreBoxH.toFixed(2)}" rx="1.0" fill="${rowAltFill}" stroke="${accent}" stroke-width="0.25" />`,
  );
  parts.push(
    `<text x="${(infoBox.xMm + infoPadX + 2.2).toFixed(2)}" y="${(scoreBoxY + scoreBoxH * 0.65).toFixed(2)}" font-size="${(infoFs * 0.95).toFixed(2)}" font-weight="800" fill="${accentDark}">${isBn ? 'প্রাপ্ত নম্বর:' : 'Score:'}</text>`,
  );
  parts.push(
    `<text x="${(infoBox.xMm + infoBox.widthMm - infoPadX - 2.5).toFixed(2)}" y="${(scoreBoxY + scoreBoxH * 0.65).toFixed(2)}" text-anchor="end" font-size="${(infoFs * 0.95).toFixed(2)}" font-weight="700" fill="${subtleText}">/ ${isBn ? toBanglaDigits(preset.questionCount) : preset.questionCount}</text>`,
  );

  // ── 6. MCQ ANSWER COLUMNS ───────────────────────────────────────────────
  const colHeaderH = isA4 ? 6.8 : 5.6;
  const qNumFs = isA4 ? 3.2 : preset.id === 'a5_50' ? 2.4 : 2.7;

  let qIdx = 0;
  for (const col of layout.questionColumns) {
    // Column container
    parts.push(
      `<rect x="${col.xMm.toFixed(2)}" y="${col.yMm.toFixed(2)}" width="${col.widthMm.toFixed(2)}" height="${col.heightMm.toFixed(2)}" rx="1.4" fill="#ffffff" stroke="${borderColor}" stroke-width="0.3" />`,
    );
    // Column top header bar
    parts.push(
      `<rect x="${col.xMm.toFixed(2)}" y="${col.yMm.toFixed(2)}" width="${col.widthMm.toFixed(2)}" height="${colHeaderH.toFixed(2)}" rx="1.2" fill="${headerBandFill}" />`,
    );
    parts.push(
      `<text x="${col.qNumXMm.toFixed(2)}" y="${(col.yMm + colHeaderH * 0.72).toFixed(2)}" text-anchor="middle" font-size="${(qNumFs * 0.9).toFixed(2)}" font-weight="800" fill="${accentDark}">${isBn ? 'প্রশ্ন' : 'Q.'}</text>`,
    );
    layout.optionLabels.forEach((lbl, oIdx) => {
      parts.push(
        `<text x="${col.optionXMm[oIdx].toFixed(2)}" y="${(col.yMm + colHeaderH * 0.72).toFixed(2)}" text-anchor="middle" font-size="${(qNumFs * 0.95).toFixed(2)}" font-weight="800" fill="${accentDark}">${escapeXml(lbl)}</text>`,
      );
    });

    const rowCount = col.endQ - col.startQ + 1;
    for (let r = 0; r < rowCount; r++) {
      const qNumber = col.startQ + r;
      const rowBubbles = layout.questionBubbles[qIdx];
      const cy = rowBubbles[0].yMm;

      // Subtle alternating row shading for fast visual alignment
      if (r % 2 === 1) {
        parts.push(
          `<rect x="${(col.xMm + 0.4).toFixed(2)}" y="${(cy - col.rowPitchMm / 2).toFixed(2)}" width="${(col.widthMm - 0.8).toFixed(2)}" height="${col.rowPitchMm.toFixed(2)}" fill="${rowAltFill}" />`,
        );
      }

      // Question number label
      const qLabel = isBn ? toBanglaDigits(qNumber) : String(qNumber);
      parts.push(
        `<text x="${col.qNumXMm.toFixed(2)}" y="${(cy + qNumFs * 0.35).toFixed(2)}" text-anchor="middle" font-size="${qNumFs}" font-weight="800" fill="${accentDark}">${qLabel}</text>`,
      );

      // 4 Option Bubbles
      const preFilledOpt = options.preFillAnswers ? options.preFillAnswers[qIdx] : null;
      rowBubbles.forEach((b, optIdx) => {
        const isFilled = preFilledOpt === optIdx;
        parts.push(
          `<circle cx="${b.xMm.toFixed(3)}" cy="${b.yMm.toFixed(3)}" r="${b.rMm.toFixed(3)}" fill="${isFilled ? '#000000' : '#ffffff'}" stroke="${isFilled ? '#000000' : bubbleStroke}" stroke-width="${bubbleStrokeW}" />`,
        );
        if (!isFilled) {
          parts.push(
            `<text x="${b.xMm.toFixed(3)}" y="${(b.yMm + b.rMm * 0.36).toFixed(3)}" text-anchor="middle" font-size="${(b.rMm * 1.05).toFixed(2)}" font-weight="700" fill="${accent}">${escapeXml(b.label)}</text>`,
          );
        }
      });

      qIdx++;
    }
  }

  // Subtle footer code inside bottom border (clear of corner fiducials)
  const footerText = `SchoolPro OMR · ${preset.id.toUpperCase()} · ${layout.rollDigits}D`;
  parts.push(
    `<text x="${(preset.pageWidthMm / 2).toFixed(2)}" y="${(preset.pageHeightMm - preset.fiducialInsetMm + 1.2).toFixed(2)}" text-anchor="middle" font-size="${isA4 ? 2.4 : 2.0}" font-weight="600" fill="#94a3b8">${escapeXml(footerText)}</text>`,
  );

  parts.push('</svg>');
  return parts.join('\n');
}
