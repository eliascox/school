'use client';

import React from 'react';
import { GraduationCap } from 'lucide-react';
import { SchoolSettings, getEnglishSchoolName, getEnglishAddress } from '@/services/settingsService';
import { formatDobOrdinalEn } from '@/lib/padUtils';
import {
  SSCTestimonialRecord,
  PrintLayoutConfig,
  cleanFatherName,
  cleanMotherName,
  detectGender,
  getEnglishPrincipalName,
  getEnglishPrincipalTitle,
} from './sscTranscriptUtils';

export interface SSCTestimonialSheetCardProps {
  record: SSCTestimonialRecord;
  schoolSettings: SchoolSettings;
  layoutConfig: PrintLayoutConfig;
  borderImageUrl?: string;
  qrCodeUrl?: string;
}

const HAS_BENGALI_RE = /[\u0980-\u09FF]/;
const CURSIVE_FONT_STACK =
  "'Great Vibes', 'Alex Brush', 'Edwardian Script ITC', 'Brush Script MT', 'Corsiva', 'Hind Siliguri', cursive";
const EDITORIAL_SERIF_STACK =
  "'Cormorant Garamond', 'Playfair Display', Georgia, 'Times New Roman', 'Hind Siliguri', serif";

export default function SSCTestimonialSheetCard({
  record,
  schoolSettings,
  layoutConfig,
  borderImageUrl = '',
  qrCodeUrl = '',
}: SSCTestimonialSheetCardProps) {
  const schoolNameEn = record.schoolNameEn || getEnglishSchoolName(schoolSettings) || 'EDUCATIONAL INSTITUTION';
  const schoolAddressEn = record.schoolAddressEn || getEnglishAddress(schoolSettings) || '';
  const schoolPhone =
    layoutConfig.customPhone !== undefined && layoutConfig.customPhone !== ''
      ? layoutConfig.customPhone
      : schoolSettings?.phone || '';

  const detectedGen = detectGender(record.gender, record.studentName);
  const isFemale = detectedGen === 'Female';

  const titleFontFamily =
    layoutConfig.titleStyle === 'playfair'
      ? "'Playfair Display', Georgia, serif"
      : layoutConfig.titleStyle === 'classic'
        ? "'Times New Roman', Georgia, serif"
        : "'Cinzel', 'Cinzel Decorative', 'Playfair Display', Georgia, serif";

  const nameStyle = layoutConfig.nameFontStyle || 'cursive';
  const scaleFactor = (layoutConfig.fontScale || 100) / 100;
  // Generous, legible editorial sizing calibrated to 9.2" x 8.2" sheet
  const bodyFontSizePx = +(18.5 * scaleFactor).toFixed(1);
  const metaFontSizePx = Math.max(12.5, +(13.8 * scaleFactor).toFixed(1));
  const studentNameFontPx = +(bodyFontSizePx * (nameStyle === 'cursive' ? 1.62 : 1.18)).toFixed(1);
  const parentNameFontPx = +(bodyFontSizePx * (nameStyle === 'cursive' ? 1.36 : 1.06)).toFixed(1);

  const dobDisplay = formatDobOrdinalEn(record.dob) || record.dobWords || record.dob || '';

  const renderStyledName = (value: string, isPrimary = false) => {
    const clean = (value || '................').trim();
    const containsBn = HAS_BENGALI_RE.test(clean);
    const useCursive = nameStyle === 'cursive' && !containsBn;

    return (
      <span
        className={`inline-block border-b-[1.5px] border-dotted border-slate-700 text-slate-950 ${
          isPrimary ? 'min-w-[230px] text-center px-5' : 'px-2.5'
        }`}
        style={{
          fontFamily: useCursive ? CURSIVE_FONT_STACK : EDITORIAL_SERIF_STACK,
          fontSize: useCursive
            ? `${isPrimary ? studentNameFontPx : parentNameFontPx}px`
            : `${Math.round(bodyFontSizePx * (isPrimary ? 1.14 : 1.04))}px`,
          fontWeight: useCursive ? 400 : 700,
          fontStyle: useCursive ? 'normal' : 'italic',
          lineHeight: useCursive ? 1.02 : 1.25,
          paddingBottom: '1px',
          verticalAlign: 'baseline',
          letterSpacing: useCursive ? '0.015em' : '0.01em',
        }}
      >
        {clean}
      </span>
    );
  };

  const renderFieldValue = (value?: string, minWidth = false) => (
    <span
      className={`inline-block border-b-[1.5px] border-dotted border-slate-700 font-bold italic text-slate-950 px-1.5 ${
        minWidth ? 'min-w-[68px] text-center' : ''
      }`}
      style={{ lineHeight: 1.2, paddingBottom: '1px' }}
    >
      {value && value.trim() ? value.trim() : '................'}
    </span>
  );

  return (
    <div
      className="testimonial-sheet bg-white shadow-xl mx-auto text-slate-950 font-sans relative print:shadow-none print:m-0"
      style={{
        width: '9.2in',
        height: '8.2in',
        minHeight: '8.2in',
        maxHeight: '8.2in',
        position: 'relative',
        background: '#ffffff',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Subtle Institutional Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
        {schoolSettings?.schoolLogo ? (
          <img
            src={schoolSettings.schoolLogo}
            alt=""
            aria-hidden="true"
            className="w-[3.4in] h-[3.4in] object-contain opacity-[0.06] contrast-110"
          />
        ) : (
          <GraduationCap className="w-[3.0in] h-[3.0in] text-slate-900 opacity-[0.04]" />
        )}
      </div>

      {/* PNG Border Overlay */}
      {borderImageUrl ? (
        <img
          src={borderImageUrl}
          alt="Certificate Border"
          className="absolute inset-0 pointer-events-none select-none z-10"
          style={{
            width: '9.2in',
            height: '8.2in',
            objectFit: 'fill',
            padding: `${layoutConfig.borderInset || 0}mm`,
            opacity: layoutConfig.borderOpacity || 1.0,
          }}
        />
      ) : (
        <div className="absolute inset-[0.18in] pointer-events-none select-none z-10">
          <div className="w-full h-full border-[2.5px] border-slate-900 relative p-[4px]">
            <div className="w-full h-full border border-emerald-900/70 relative">
              <div className="absolute -top-[3px] -left-[3px] w-3.5 h-3.5 border-t-[3px] border-l-[3px] border-emerald-800" />
              <div className="absolute -top-[3px] -right-[3px] w-3.5 h-3.5 border-t-[3px] border-r-[3px] border-emerald-800" />
              <div className="absolute -bottom-[3px] -left-[3px] w-3.5 h-3.5 border-b-[3px] border-l-[3px] border-emerald-800" />
              <div className="absolute -bottom-[3px] -right-[3px] w-3.5 h-3.5 border-b-[3px] border-r-[3px] border-emerald-800" />
            </div>
          </div>
        </div>
      )}

      {/* Inner Safe Margin Container */}
      <div
        className="w-full h-full flex flex-col justify-between relative z-20"
        style={{
          paddingTop: `${layoutConfig.topMargin || 0.45}in`,
          paddingBottom: `${layoutConfig.bottomMargin || 0.45}in`,
          paddingLeft: `${layoutConfig.leftMargin || 0.55}in`,
          paddingRight: `${layoutConfig.rightMargin || 0.55}in`,
          boxSizing: 'border-box',
        }}
      >
        <div>
          {/* Institutional Header */}
          <div className="flex items-center justify-between gap-4 px-2 sm:px-4">
            <div className="w-16 h-16 flex items-center justify-center shrink-0">
              {schoolSettings?.schoolLogo ? (
                <img src={schoolSettings.schoolLogo} alt="Logo" className="w-16 h-16 object-contain" />
              ) : (
                <div className="w-14 h-14 rounded-full border-2 border-slate-950 flex flex-col items-center justify-center bg-slate-50">
                  <GraduationCap className="w-7 h-7 text-slate-800" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center space-y-0.5">
              <h1
                className="text-[28px] sm:text-[31px] font-black text-slate-950 tracking-[0.04em] uppercase leading-tight"
                style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
              >
                {schoolNameEn}
              </h1>
              {schoolAddressEn && (
                <p className="text-[14px] font-semibold text-slate-800 tracking-wide font-serif">
                  {schoolAddressEn}
                </p>
              )}
              <p className="text-[12.5px] font-bold text-slate-800 font-mono tracking-wider">
                EIIN: {record.eiin} &nbsp;|&nbsp; ESTD: {schoolSettings?.estdYear || '1969'}
                {schoolPhone ? ` | Mobile: ${schoolPhone}` : ''}
              </p>
            </div>

            <div className="w-16 shrink-0" aria-hidden="true" />
          </div>

          {/* Testimonial Badge Title */}
          <div className="text-center mt-2 mb-2.5">
            <div className="inline-block border-[1.8px] border-emerald-900 px-6 py-0.5 shadow-2xs">
              <h2
                className="text-[21px] sm:text-[23px] font-black text-emerald-950 uppercase tracking-[0.26em] select-none"
                style={{
                  fontFamily: titleFontFamily,
                  fontWeight: 900,
                  letterSpacing: '0.26em',
                  lineHeight: 1.2,
                }}
              >
                TESTIMONIAL
              </h2>
            </div>
          </div>

          {/* SL No / Ref No & Date Bar */}
          <div
            className="flex justify-between items-center font-bold text-slate-900 px-2 sm:px-4 mb-2"
            style={{ fontSize: `${metaFontSizePx}px` }}
          >
            <div>
              <span className="font-sans font-extrabold text-slate-950">SL_NO.: </span>
              <span className="font-mono font-black text-slate-950 tracking-tight">{record.refNo}</span>
            </div>
            <div>
              <span className="font-sans font-extrabold text-slate-950">Date: </span>
              <span className="font-mono font-black text-slate-950">{record.issueDate}</span>
            </div>
          </div>

          {/* Official Testimonial Prose (Editorial Italic Serif + Calligraphic Cursive Names) */}
          <div
            className="text-slate-950 text-justify px-2 sm:px-4 print-quality-boost mt-1"
            style={{
              fontSize: `${bodyFontSizePx}px`,
              lineHeight:
                layoutConfig.lineHeight === 'tight'
                  ? 1.75
                  : layoutConfig.lineHeight === 'relaxed'
                    ? 2.25
                    : 1.98,
              wordSpacing: '0.02em',
              fontFamily: EDITORIAL_SERIF_STACK,
              fontStyle: 'italic',
            }}
          >
            <p className="mb-1.5">
              This is to certify that{' '}
              {renderStyledName(record.studentName, true)}, {isFemale ? 'daughter' : 'son'} of Mr.{' '}
              {renderStyledName(cleanFatherName(record.fatherName))} &amp; Mrs.{' '}
              {renderStyledName(cleanMotherName(record.motherName))}, of Village:{' '}
              {renderFieldValue(record.village)}, Post Office:{' '}
              {renderFieldValue(record.postOffice)}, Upazila:{' '}
              {renderFieldValue(record.upazilla || record.upazila)}, District:{' '}
              {renderFieldValue(record.district)}, appeared at the SSC Examination under the{' '}
              {record.boardName || 'Board of Intermediate and Secondary Education, Chattogram'}, from this
              school in {renderFieldValue(record.passingYear)} and secured G.P.A.{' '}
              {renderFieldValue(record.gpa, true)} out of 5.00 in {renderFieldValue(record.group)} group.{' '}
              {isFemale ? 'Her' : 'His'} Roll No. was {renderFieldValue(record.boardRoll)}, and{' '}
              {isFemale ? 'her' : 'his'} Registration No. was {renderFieldValue(record.boardReg)}, Session:{' '}
              {renderFieldValue(record.session)}
              {dobDisplay ? (
                <>
                  , Date of Birth: {renderFieldValue(dobDisplay)}
                </>
              ) : null}
              . During {isFemale ? 'her' : 'his'} school life, {isFemale ? 'she' : 'he'} was not involved in any
              subversive activity against the state or the discipline of the school. {isFemale ? 'She' : 'He'}{' '}
              exhibits excellent moral character.
            </p>

            <p className="font-bold italic text-slate-950 mt-2.5 not-italic" style={{ fontStyle: 'italic' }}>
              I wish {isFemale ? 'her' : 'him'} a bright future in life.
            </p>
          </div>
        </div>

        {/* Footer Signature & QR Verification */}
        <div
          className="pt-1 flex items-end justify-between text-xs font-bold text-slate-950 px-2 sm:px-4"
          style={{ marginTop: `${layoutConfig.signatureGap || 14}px` }}
        >
          {qrCodeUrl ? (
            <div className="flex flex-col items-center text-center">
              <div className="p-1 bg-white border border-slate-300 rounded shadow-2xs">
                <img src={qrCodeUrl} alt="Scan to Verify Testimonial" className="w-16 h-16 object-contain" />
              </div>
              <span className="text-[9.5px] font-sans font-semibold text-slate-700 mt-0.5">
                Scan to verify online
              </span>
            </div>
          ) : (
            <div />
          )}

          <div className="text-center">
            <div className="w-60 border-t-[1.8px] border-slate-950 pt-1">
              <p className="font-black text-slate-950 text-[14px] tracking-wide font-sans">
                {schoolSettings?.principalTitleEn?.trim() || getEnglishPrincipalTitle(schoolSettings?.principalTitle)}
              </p>
              <p className="text-[11.5px] font-bold text-slate-800 uppercase font-sans tracking-wide">
                {schoolSettings?.principalNameEn?.trim() || getEnglishPrincipalName(schoolSettings?.principalName)}
              </p>
              <p className="text-[11.5px] font-bold text-slate-800 font-sans tracking-wide">{schoolNameEn}</p>
              {schoolAddressEn && <p className="text-[10.5px] text-slate-600 font-sans">{schoolAddressEn}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
