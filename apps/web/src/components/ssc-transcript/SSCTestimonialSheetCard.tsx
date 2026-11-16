'use client';

import React from 'react';
import { GraduationCap } from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';
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

export default function SSCTestimonialSheetCard({
  record,
  schoolSettings,
  layoutConfig,
  borderImageUrl = '',
  qrCodeUrl = '',
}: SSCTestimonialSheetCardProps) {
  const schoolNameEn = record.schoolNameEn || 'BORAITOLI HIGH SCHOOL';
  const schoolAddressEn = record.schoolAddressEn || "Boraitoli, Chakaria, Cox's Bazar";
  const schoolPhone =
    layoutConfig.customPhone !== undefined && layoutConfig.customPhone !== ''
      ? layoutConfig.customPhone
      : schoolSettings?.phone || '01819-000000';

  const detectedGen = detectGender(record.gender, record.studentName);
  const isFemale = detectedGen === 'Female';

  const titleFontFamily =
    layoutConfig.titleStyle === 'playfair'
      ? "'Playfair Display', Georgia, serif"
      : layoutConfig.titleStyle === 'classic'
        ? "'Times New Roman', Times, serif"
        : "'Cinzel', 'Cinzel Decorative', 'Playfair Display', Georgia, serif";

  const bodyFontSizePx = (15.4 * (layoutConfig.fontScale || 100)) / 100;
  const metaFontSizePx = Math.max(11.5, (12.2 * (layoutConfig.fontScale || 100)) / 100);

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
            className="w-[3.1in] h-[3.1in] object-contain opacity-[0.045] grayscale contrast-125"
          />
        ) : (
          <GraduationCap className="w-[2.8in] h-[2.8in] text-slate-900 opacity-[0.035]" />
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
        <div className="absolute inset-[0.20in] pointer-events-none select-none z-10">
          <div className="w-full h-full border-[2.5px] border-slate-900 relative p-[4px]">
            <div className="w-full h-full border border-amber-900/70 relative">
              <div className="absolute -top-[3px] -left-[3px] w-3.5 h-3.5 border-t-[3px] border-l-[3px] border-amber-800" />
              <div className="absolute -top-[3px] -right-[3px] w-3.5 h-3.5 border-t-[3px] border-r-[3px] border-amber-800" />
              <div className="absolute -bottom-[3px] -left-[3px] w-3.5 h-3.5 border-b-[3px] border-l-[3px] border-amber-800" />
              <div className="absolute -bottom-[3px] -right-[3px] w-3.5 h-3.5 border-b-[3px] border-r-[3px] border-amber-800" />
            </div>
          </div>
        </div>
      )}

      {/* Inner Safe Margin Container */}
      <div
        className="w-full h-full flex flex-col justify-between relative z-20"
        style={{
          paddingTop: `${layoutConfig.topMargin || 0.5}in`,
          paddingBottom: `${layoutConfig.bottomMargin || 0.5}in`,
          paddingLeft: `${layoutConfig.leftMargin || 0.5}in`,
          paddingRight: `${layoutConfig.rightMargin || 0.5}in`,
          boxSizing: 'border-box',
        }}
      >
        <div>
          {/* Institutional Header */}
          <div className="text-center flex flex-col items-center justify-center space-y-1">
            <div className="flex items-center justify-center gap-3.5">
              {schoolSettings?.schoolLogo ? (
                <img src={schoolSettings.schoolLogo} alt="Logo" className="w-15 h-15 object-contain shrink-0" />
              ) : (
                <div className="w-13 h-13 rounded-full border-2 border-slate-950 flex flex-col items-center justify-center bg-slate-50">
                  <GraduationCap className="w-7 h-7 text-slate-800" />
                </div>
              )}
              <div className="text-center">
                <h1
                  className="text-[26px] sm:text-[29px] font-black text-slate-950 tracking-[0.04em] uppercase leading-none mb-1"
                  style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
                >
                  {schoolNameEn}
                </h1>
                <p className="text-[13px] font-semibold text-slate-800 tracking-wide font-serif">
                  {schoolAddressEn}
                </p>
              </div>
            </div>

            <p className="text-[12px] font-bold text-slate-800 font-mono tracking-wider pt-0.5">
              EIIN: {record.eiin}, Established: {schoolSettings?.estdYear || '1969'}
            </p>
            <p className="text-[12px] font-black text-slate-950 font-mono tracking-wider">
              Mobile: {schoolPhone}
            </p>
          </div>

          {/* Ref No & Date Bar */}
          <div
            className="flex justify-between items-center font-bold text-slate-800 px-3 sm:px-6 mt-3 mb-2"
            style={{ fontSize: `${metaFontSizePx}px` }}
          >
            <div>
              <span className="font-serif italic font-semibold text-slate-700">Ref. No: </span>
              <span className="font-mono font-black text-slate-950 tracking-tight">{record.refNo}</span>
            </div>
            <div>
              <span className="font-serif italic font-semibold text-slate-700">Date: </span>
              <span className="font-mono font-black text-slate-950">{record.issueDate}</span>
            </div>
          </div>

          {/* Testimonial Title */}
          <div className="text-center my-2.5 sm:my-3">
            <div className="inline-flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-3">
                <span className="text-amber-800 text-base font-serif select-none">❖</span>
                <h2
                  className="text-[26px] sm:text-[29px] font-black text-slate-950 uppercase tracking-[0.24em] select-none"
                  style={{
                    fontFamily: titleFontFamily,
                    fontWeight: 900,
                    letterSpacing: '0.24em',
                    lineHeight: 1.1,
                  }}
                >
                  TESTIMONIAL
                </h2>
                <span className="text-amber-800 text-base font-serif select-none">❖</span>
              </div>

              <div className="flex items-center justify-center gap-1.5 w-full mt-1.5">
                <div className="h-[2px] w-14 bg-slate-950 rounded-full" />
                <div className="h-[1px] w-24 bg-slate-600" />
                <div className="w-2 h-2 rotate-45 bg-amber-800 shrink-0" />
                <div className="h-[1px] w-24 bg-slate-600" />
                <div className="h-[2px] w-14 bg-slate-950 rounded-full" />
              </div>
            </div>

            <div className="mt-1.5">
              <span className="text-[11px] sm:text-[12px] font-extrabold text-slate-800 tracking-[0.18em] uppercase font-serif">
                SECONDARY SCHOOL CERTIFICATE EXAMINATION — {record.passingYear}
              </span>
            </div>
          </div>

          {/* Official Testimonial Text */}
          <div
            className="font-serif text-slate-950 text-justify px-3 sm:px-6 space-y-3.5 print-quality-boost mt-3"
            style={{
              fontSize: `${bodyFontSizePx}px`,
              lineHeight:
                layoutConfig.lineHeight === 'tight'
                  ? 1.65
                  : layoutConfig.lineHeight === 'relaxed'
                    ? 2.15
                    : 1.9,
              wordSpacing: '0.03em',
              fontFamily: "'Times New Roman', 'Playfair Display', Georgia, serif",
            }}
          >
            <p>
              This is to certify that{' '}
              <strong className="font-serif font-black text-slate-950 tracking-wide uppercase border-b border-dotted border-slate-900 pb-[1px] px-0.5">
                {record.studentName}
              </strong>
              , {isFemale ? 'daughter' : 'son'} of Mr.{' '}
              <strong className="font-serif font-bold text-slate-950">{cleanFatherName(record.fatherName)}</strong>{' '}
              and Mrs.{' '}
              <strong className="font-serif font-bold text-slate-950">{cleanMotherName(record.motherName)}</strong>,
              Village: <strong className="font-serif font-bold text-slate-950">{record.village || 'Boraitoli'}</strong>,
              Post Office:{' '}
              <strong className="font-serif font-bold text-slate-950">{record.postOffice || 'Boraitoli'}</strong>,
              Upazilla:{' '}
              <strong className="font-serif font-bold text-slate-950">
                {record.upazilla || record.upazila || 'Chakaria'}
              </strong>
              , District:{' '}
              <strong className="font-serif font-bold text-slate-950">{record.district || "Cox's Bazar"}</strong>, was a
              student of this school bearing Roll No.{' '}
              <strong className="font-mono font-bold text-slate-950">{record.boardRoll}</strong>, Registration No.{' '}
              <strong className="font-mono font-bold text-slate-950">{record.boardReg}</strong>, Session{' '}
              <strong className="font-mono font-bold text-slate-950">{record.session}</strong>, Group{' '}
              <strong className="font-serif font-bold uppercase text-slate-950">{record.group}</strong>.
            </p>

            <p>
              {isFemale ? 'She' : 'He'} has duly passed the S.S.C. Examination held in the year{' '}
              <strong className="font-mono font-bold text-slate-950">{record.passingYear}</strong> and secured a GPA of{' '}
              <strong className="font-mono font-black text-slate-950">{record.gpa}</strong> out of 5.00, under the{' '}
              {record.boardName || 'Board of Intermediate and Secondary Education, Chattogram'}.
            </p>

            <p>
              During {isFemale ? 'her' : 'his'} stay in this institution, {isFemale ? 'her' : 'his'} moral character
              and conduct were good. There is no information of {isFemale ? 'her' : 'his'} being involved in any
              activity subversive to the interest of the state or against school discipline.
            </p>

            <p>We wish {isFemale ? 'her' : 'him'} success in life.</p>
          </div>
        </div>

        {/* Footer Signature & QR Verification */}
        <div
          className="pt-2 flex items-end justify-between text-xs font-bold text-slate-950 px-3 sm:px-6"
          style={{ marginTop: `${layoutConfig.signatureGap || 18}px` }}
        >
          {qrCodeUrl ? (
            <div className="flex flex-col items-center text-center">
              <div className="p-1 bg-white border border-slate-300 rounded shadow-2xs">
                <img src={qrCodeUrl} alt="Scan to Verify Testimonial" className="w-16 h-16 object-contain" />
              </div>
              <span className="text-[8.5px] font-mono font-black text-slate-800 mt-1 tracking-widest uppercase">
                QR VERIFIED
              </span>
            </div>
          ) : (
            <div />
          )}

          <div className="text-center">
            <div className="w-60 border-t-[1.5px] border-slate-950 pt-1.5">
              <p className="font-black text-slate-950 text-[13px] uppercase font-serif tracking-wide">
                {getEnglishPrincipalName(schoolSettings?.principalName)}
              </p>
              <p className="text-[11.5px] font-bold text-slate-800 font-serif">
                {getEnglishPrincipalTitle(schoolSettings?.principalTitle)}
              </p>
              <p className="text-[10.5px] font-bold text-slate-700 font-serif tracking-wide">{schoolNameEn}</p>
              <p className="text-[9.5px] text-slate-600 font-serif">{schoolAddressEn}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
