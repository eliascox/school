'use client';

import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Phone, Droplet, MapPin, ShieldCheck, Calendar, User } from 'lucide-react';
import type { Student } from '@/services/studentService';
import {
  type SchoolSettings,
  getEnglishAddress,
  getEnglishPrincipalTitleFromSettings,
  getEnglishSchoolName,
} from '@/services/settingsService';
import { toAsciiDigits, toBanglaDigits } from '@/lib/omr/omrTemplates';
import {
  BUILT_IN_ID_CARD_TEMPLATES,
  type IdCardDocLang,
  type IdCardOrientation,
  type IdCardSideMode,
  type IdCardTemplateConfig,
  getIdCardGradeLabel,
  getIdCardScopeLabel,
  mapLegacyThemeToTemplateId,
} from '@/lib/idCardTemplateTypes';

export type { IdCardOrientation, IdCardDocLang };
export type IdCardTheme = 'indigo' | 'emerald' | 'crimson';
export type LegacyIdCardSideMode = 'both' | IdCardSideMode;

export interface StudentIdCardPreviewProps {
  student: Student;
  settings: SchoolSettings;
  orientation: IdCardOrientation;
  sideMode: LegacyIdCardSideMode;
  theme?: IdCardTheme;
  template?: IdCardTemplateConfig;
  docLang?: IdCardDocLang;
  sessionYear: string;
  showCropMarks?: boolean;
  cardWidthMm?: number;
  cardHeightMm?: number;
  innerPairGapMm?: number;
}

const QR_SVG_URI_CACHE = new Map<string, string>();

function encodeSvgDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function StudentIdCardPreview({
  student,
  settings,
  orientation,
  sideMode,
  theme = 'emerald',
  template,
  docLang,
  sessionYear,
  showCropMarks = true,
  cardWidthMm,
  cardHeightMm,
  innerPairGapMm = 2,
}: StudentIdCardPreviewProps) {
  const activeTemplate = useMemo<IdCardTemplateConfig>(() => {
    if (template) return template;
    const mappedId = mapLegacyThemeToTemplateId(theme);
    return (
      BUILT_IN_ID_CARD_TEMPLATES.find((t) => t.id === mappedId) || BUILT_IN_ID_CARD_TEMPLATES[0]
    );
  }, [template, theme]);

  const effectiveLang: IdCardDocLang = docLang || (settings?.language === 'en' ? 'en' : 'bn');
  const isEn = effectiveLang === 'en';
  const isPortrait = orientation === 'portrait';
  const fmt = (val: string | number) => (isEn ? toAsciiDigits(String(val)) : toBanglaDigits(val));

  const payload = `SMS-STU|${student.id}|${student.roll}|${student.grade}`;
  const [qrSvgUri, setQrSvgUri] = useState<string>(() => QR_SVG_URI_CACHE.get(payload) || '');

  const needsBack =
    sideMode === 'back' ||
    sideMode === 'both' ||
    sideMode === 'both_side_by_side' ||
    sideMode === 'duplex_mirrored';
  const needsFront =
    sideMode === 'front' || sideMode === 'both' || sideMode === 'both_side_by_side';

  useEffect(() => {
    if (!needsBack || !activeTemplate.showQrCode) return;
    const cached = QR_SVG_URI_CACHE.get(payload);
    if (cached) {
      setQrSvgUri(cached);
      return;
    }
    let active = true;
    // Generate infinite-resolution vector SVG QR code (crisp at 300/600/1200+ DPI!)
    QRCode.toString(payload, {
      type: 'svg',
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((svgStr) => {
        const uri = encodeSvgDataUri(svgStr);
        QR_SVG_URI_CACHE.set(payload, uri);
        if (active) setQrSvgUri(uri);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [payload, needsBack, activeTemplate.showQrCode]);

  const wMm = cardWidthMm ?? (isPortrait ? 53.98 : 85.6);
  const hMm = cardHeightMm ?? (isPortrait ? 85.6 : 53.98);

  const cardSizeStyle: React.CSSProperties = {
    width: `${wMm}mm`,
    height: `${hMm}mm`,
    backgroundColor: activeTemplate.surfaceBg || '#FFFFFF',
    color: activeTemplate.textColor || '#0F172A',
    WebkitPrintColorAdjust: 'exact',
    printColorAdjust: 'exact',
  };

  // Strict Single-Language School & Student Identity (NEVER mix Bangla + English side-by-side)
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
  const gradeLabel = getIdCardGradeLabel(student.grade, effectiveLang);
  const scopeLabel = getIdCardScopeLabel(
    student.grade,
    student.section || student.branch,
    student.group,
    effectiveLang,
  );
  const rawStudentAddr = (student.currentAddress || '').trim();
  const displayAddress = isEn
    ? rawStudentAddr && !/[\u0980-\u09FF]/.test(rawStudentAddr)
      ? rawStudentAddr
      : schoolAddress || 'Bangladesh'
    : rawStudentAddr || schoolAddress || 'বাংলাদেশ';

  const initials = (studentName || 'S')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();

  const photoRadiusClass =
    activeTemplate.photoShape === 'circle'
      ? 'rounded-full'
      : activeTemplate.photoShape === 'square'
        ? 'rounded-[3px]'
        : 'rounded-lg';

  const renderCornerCropMarks = () => {
    if (!showCropMarks) return null;
    return (
      <>
        <span className="pointer-events-none absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-slate-500/80 z-30" />
        <span className="pointer-events-none absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-slate-500/80 z-30" />
        <span className="pointer-events-none absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-slate-500/80 z-30" />
        <span className="pointer-events-none absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-slate-500/80 z-30" />
      </>
    );
  };

  const renderHeaderGraphic = (isFrontPortrait: boolean) => {
    const isMinimal = activeTemplate.headerStyle === 'minimal';
    const gradId = `id-grad-${activeTemplate.id.replace(/[^a-zA-Z0-9]/g, '')}-${student.id.replace(/[^a-zA-Z0-9]/g, '')}`;

    if (isMinimal) {
      return (
        <div className="relative z-10 shrink-0 px-2.5 pt-2 pb-1.5 border-b border-slate-200/90">
          <div
            className="absolute top-0 inset-x-0 h-[2.2mm]"
            style={{ backgroundColor: activeTemplate.primaryColor }}
          />
          <div
            className="absolute top-[2.2mm] left-0 w-[36%] h-[0.7mm]"
            style={{ backgroundColor: activeTemplate.accentColor }}
          />
          <div className="flex items-center gap-2 pt-1.5">
            {settings.schoolLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.schoolLogo}
                alt={schoolName}
                className="w-7 h-7 rounded-full bg-white object-contain p-0.5 border border-slate-200 shrink-0"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
                style={{ backgroundColor: activeTemplate.primaryColor }}
              >
                ID
              </div>
            )}
            <div className="min-w-0 leading-tight">
              <p
                className="text-[8.5px] font-black truncate"
                style={{ color: activeTemplate.primaryColor }}
              >
                {schoolName}
              </p>
              <p className="text-[6px] font-semibold text-slate-500 truncate">
                {[
                  settings.eiin ? `EIIN: ${fmt(settings.eiin)}` : '',
                  isEn ? `Session ${fmt(sessionYear)}` : `সেশন ${fmt(sessionYear)}`,
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
            </div>
          </div>
        </div>
      );
    }

    const headerHeightMm = isFrontPortrait ? 18.5 : 13.5;

    return (
      <div
        className="relative z-10 shrink-0 overflow-hidden"
        style={{ height: `${headerHeightMm}mm` }}
      >
        {/* Crisp Vector SVG Background Header */}
        <svg
          viewBox="0 0 200 72"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={activeTemplate.primaryColor} />
              <stop offset="100%" stopColor={activeTemplate.secondaryColor} />
            </linearGradient>
          </defs>
          {activeTemplate.headerStyle === 'wave' ? (
            <>
              <path
                d="M0,0 L200,0 L200,56 C145,76 62,48 0,66 Z"
                fill={`url(#${gradId})`}
              />
              <path
                d="M0,66 C62,48 145,76 200,56 L200,60 C145,80 62,52 0,70 Z"
                fill={activeTemplate.accentColor}
                opacity="0.95"
              />
            </>
          ) : activeTemplate.headerStyle === 'angled' ? (
            <>
              <polygon points="0,0 200,0 200,52 0,68" fill={`url(#${gradId})`} />
              <polygon points="0,68 200,52 200,57 0,72" fill={activeTemplate.accentColor} />
            </>
          ) : (
            <>
              <rect x="0" y="0" width="200" height="67" fill={`url(#${gradId})`} />
              <rect x="0" y="67" width="200" height="5" fill={activeTemplate.accentColor} />
            </>
          )}
        </svg>

        {/* Subtle geometric highlight circle */}
        <div
          className="pointer-events-none absolute -top-5 -right-5 w-16 h-16 rounded-full opacity-15"
          style={{ backgroundColor: activeTemplate.accentColor }}
        />

        <div className="relative z-10 h-full px-2.5 pt-2 pb-3 flex items-center gap-2 text-white">
          {settings.schoolLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.schoolLogo}
              alt={schoolName}
              className="w-7 h-7 rounded-full bg-white object-contain p-0.5 shadow-2xs shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[8px] font-black shrink-0">
              ID
            </div>
          )}
          <div className="min-w-0 leading-tight">
            <p className="text-[8.6px] font-black tracking-tight truncate drop-shadow-2xs">
              {schoolName}
            </p>
            <p className="text-[6px] font-semibold text-white/85 truncate">
              {[
                settings.eiin ? `EIIN: ${fmt(settings.eiin)}` : '',
                isEn ? `Session ${fmt(sessionYear)}` : `সেশন ${fmt(sessionYear)}`,
              ]
                .filter(Boolean)
                .join(' • ')}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderCardBackdrop = (side: 'front' | 'back') => {
    const customBg =
      side === 'front' ? activeTemplate.customFrontBgDataUrl : activeTemplate.customBackBgDataUrl;
    return (
      <>
        {customBg && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={customBg}
              alt=""
              className="pointer-events-none absolute inset-0 w-full h-full object-cover z-0"
            />
            <div
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                backgroundColor: `rgba(255,255,255,${activeTemplate.artworkOverlayOpacity ?? 0.14})`,
              }}
            />
          </>
        )}

        {activeTemplate.showWatermark && settings.schoolLogo && !customBg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.schoolLogo}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28mm] h-[28mm] object-contain opacity-[0.06] z-0"
          />
        )}

        {activeTemplate.baseStyle === 'classic_royal' && (
          <>
            <div
              className="pointer-events-none absolute inset-[1.4mm] border z-20"
              style={{ borderColor: activeTemplate.primaryColor }}
            />
            <div
              className="pointer-events-none absolute inset-[2.2mm] border z-20"
              style={{ borderColor: activeTemplate.accentColor, opacity: 0.7 }}
            />
          </>
        )}
      </>
    );
  };

  const renderFront = () => (
    <div
      style={cardSizeStyle}
      className="relative overflow-hidden flex flex-col justify-between select-none shrink-0 rounded-[4px] print:rounded-none shadow-xs print:shadow-none border border-slate-200/90 print:border-slate-300/60"
    >
      {renderCardBackdrop('front')}
      {renderCornerCropMarks()}
      {renderHeaderGraphic(isPortrait)}

      {/* Body */}
      {isPortrait ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-2.5 py-1 text-center gap-1">
          <span
            className="px-2.5 py-0.5 rounded-full text-[6.3px] font-black uppercase tracking-wider shadow-2xs"
            style={{
              backgroundColor: activeTemplate.accentColor,
              color: '#0F172A',
            }}
          >
            {isEn ? 'STUDENT ID CARD' : 'শিক্ষার্থী পরিচয়পত্র'}
          </span>

          {/* Photo with Crisp Outer Halo */}
          <div
            className={`p-[2px] bg-white shadow-xs mt-0.5 ${photoRadiusClass}`}
            style={{ border: `1.5px solid ${activeTemplate.primaryColor}` }}
          >
            {student.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={student.photo}
                alt={studentName}
                className={`w-[19mm] h-[19mm] object-cover block ${photoRadiusClass}`}
              />
            ) : (
              <div
                className={`w-[19mm] h-[19mm] bg-slate-100 flex items-center justify-center text-sm font-black ${photoRadiusClass}`}
                style={{ color: activeTemplate.primaryColor }}
              >
                {initials}
              </div>
            )}
          </div>

          <div className="w-full mt-0.5">
            <h4
              className="text-[10.2px] font-black leading-tight line-clamp-2"
              style={{ color: activeTemplate.primaryColor }}
            >
              {studentName}
            </h4>
            <p className="text-[7.4px] font-bold text-slate-700 mt-0.5">
              {gradeLabel} ({scopeLabel}) • {isEn ? 'Roll:' : 'রোল:'} {fmt(student.roll)}
            </p>
          </div>

          {/* Crisp Structured Info Grid */}
          <div className="w-full rounded-md bg-slate-50/90 border border-slate-200/90 px-2 py-1.5 text-left space-y-0.5 text-[6.7px]">
            <div className="flex items-center justify-between gap-1">
              <span className="text-slate-500 font-semibold">{isEn ? 'ID No:' : 'আইডি নং:'}</span>
              <span className="font-black text-slate-900 truncate tabular-nums">
                {fmt(student.id)}
              </span>
            </div>
            {activeTemplate.showBloodGroup && (
              <div className="flex items-center justify-between gap-1">
                <span className="text-slate-500 font-semibold">
                  {isEn ? 'Blood Group:' : 'রক্তের গ্রুপ:'}
                </span>
                <span className="font-black text-rose-600 inline-flex items-center gap-0.5">
                  <Droplet className="w-2 h-2" />
                  {student.bloodGroup || (isEn ? 'N/A' : 'উল্লেখ নেই')}
                </span>
              </div>
            )}
            {activeTemplate.showGuardian && (
              <div className="flex items-center justify-between gap-1">
                <span className="text-slate-500 font-semibold shrink-0">
                  {isEn ? 'Guardian:' : 'অভিভাবক:'}
                </span>
                <span className="font-bold text-slate-800 truncate">{guardianName}</span>
              </div>
            )}
            {activeTemplate.showDob && student.dob && (
              <div className="flex items-center justify-between gap-1">
                <span className="text-slate-500 font-semibold shrink-0">
                  {isEn ? 'DOB:' : 'জন্ম তারিখ:'}
                </span>
                <span className="font-bold text-slate-800 tabular-nums">{fmt(student.dob)}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex-1 flex items-center gap-2.5 px-3 py-1">
          <div
            className={`p-[2px] bg-white shadow-xs shrink-0 ${photoRadiusClass}`}
            style={{ border: `1.5px solid ${activeTemplate.primaryColor}` }}
          >
            {student.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={student.photo}
                alt={studentName}
                className={`w-[17mm] h-[20mm] object-cover block ${photoRadiusClass}`}
              />
            ) : (
              <div
                className={`w-[17mm] h-[20mm] bg-slate-100 flex items-center justify-center text-xs font-black ${photoRadiusClass}`}
                style={{ color: activeTemplate.primaryColor }}
              >
                {initials}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-0.5 text-[7.4px]">
            <span
              className="inline-block px-2 py-0.5 rounded-full text-[5.9px] font-black uppercase tracking-wider"
              style={{
                backgroundColor: activeTemplate.accentColor,
                color: '#0F172A',
              }}
            >
              {isEn ? 'STUDENT ID CARD' : 'শিক্ষার্থী পরিচয়পত্র'}
            </span>
            <h4
              className="text-[10.5px] font-black truncate leading-tight"
              style={{ color: activeTemplate.primaryColor }}
            >
              {studentName}
            </h4>
            <p className="font-bold text-slate-800 truncate">
              {gradeLabel} ({scopeLabel}) • {isEn ? 'Roll:' : 'রোল:'} {fmt(student.roll)}
            </p>
            {activeTemplate.showGuardian && (
              <p className="text-slate-600 font-semibold truncate flex items-center gap-1">
                <User className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                <span className="truncate">
                  {isEn ? 'Guardian:' : 'অভিভাবক:'} {guardianName}
                </span>
              </p>
            )}
            <div className="flex items-center justify-between gap-2 pt-0.5 text-[6.7px] font-bold">
              <span className="text-slate-800 tabular-nums">
                {isEn ? 'ID:' : 'আইডি:'} {fmt(student.id)}
              </span>
              {activeTemplate.showBloodGroup && (
                <span className="text-rose-600 inline-flex items-center gap-0.5 shrink-0">
                  <Droplet className="w-2 h-2" />
                  {student.bloodGroup || (isEn ? 'N/A' : 'উল্লেখ নেই')}
                </span>
              )}
              {activeTemplate.showDob && student.dob && (
                <span className="text-slate-600 inline-flex items-center gap-0.5 shrink-0">
                  <Calendar className="w-2 h-2" />
                  {fmt(student.dob)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Signature & Validity Strip */}
      <div className="relative z-10 px-2.5 pt-1 pb-1.5 bg-slate-50/95 border-t border-slate-200 flex items-end justify-between text-[6px] shrink-0">
        <div
          className="absolute bottom-0 inset-x-0 h-[1.2mm]"
          style={{ backgroundColor: activeTemplate.primaryColor }}
        />
        <span className="text-slate-600 font-bold pb-0.5 truncate max-w-[54%]">
          {activeTemplate.showValidity
            ? isEn
              ? activeTemplate.validityTextEn
              : activeTemplate.validityTextBn
            : `${isEn ? 'ID:' : 'আইডি:'} ${fmt(student.id)}`}
        </span>
        <div className="text-right pb-0.5 shrink-0">
          {activeTemplate.principalSignatureDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeTemplate.principalSignatureDataUrl}
              alt=""
              className="h-[3.5mm] max-w-[14mm] object-contain ml-auto -mb-0.5"
            />
          )}
          <span className="font-black text-slate-800 border-t border-slate-400 px-1 pt-0.5 inline-block">
            {principalTitle}
          </span>
        </div>
      </div>
    </div>
  );

  const renderBack = () => (
    <div
      style={cardSizeStyle}
      className="relative overflow-hidden flex flex-col justify-between select-none shrink-0 rounded-[4px] print:rounded-none shadow-xs print:shadow-none border border-slate-200/90 print:border-slate-300/60"
    >
      {renderCardBackdrop('back')}
      {renderCornerCropMarks()}

      {/* Top Back Banner */}
      <div
        className="relative z-10 text-white px-2.5 py-1.5 flex items-center justify-between shrink-0"
        style={{
          backgroundColor: activeTemplate.primaryColor,
          borderBottom: `2px solid ${activeTemplate.accentColor}`,
        }}
      >
        <span className="text-[7.2px] font-black tracking-wide inline-flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 shrink-0" />
          {isEn ? 'DIGITAL SMART IDENTITY' : 'ডিজিটাল স্মার্ট পরিচয়পত্র'}
        </span>
        <span className="text-[6.2px] font-bold text-white/85">
          {isEn ? `Session ${fmt(sessionYear)}` : `সেশন ${fmt(sessionYear)}`}
        </span>
      </div>

      {/* Back Body */}
      <div
        className={`relative z-10 flex-1 px-2.5 py-2 flex ${
          isPortrait ? 'flex-col items-center justify-between gap-1.5' : 'flex-row items-center gap-2.5'
        }`}
      >
        {activeTemplate.showQrCode && (
          <div className="flex flex-col items-center shrink-0">
            <div className="p-1 bg-white rounded-md border border-slate-200 shadow-2xs">
              {qrSvgUri ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrSvgUri}
                  alt={isEn ? 'Student Verification QR' : 'শিক্ষার্থী যাচাইকরণ QR'}
                  className="w-[16mm] h-[16mm] block"
                />
              ) : (
                <div className="w-[16mm] h-[16mm] flex items-center justify-center text-[7px] font-bold text-slate-400">
                  QR
                </div>
              )}
            </div>
            <span className="text-[5.5px] font-bold text-slate-500 mt-0.5">
              {isEn ? 'Scan to Verify ID' : 'কার্ড যাচাইয়ে স্ক্যান করুন'}
            </span>
          </div>
        )}

        <div className={`text-[6.6px] space-y-1 min-w-0 ${isPortrait ? 'w-full' : 'flex-1'}`}>
          <div className="bg-slate-50/90 border border-slate-200 rounded-md p-1.5 space-y-0.5">
            {activeTemplate.showGuardian && (
              <p className="font-bold text-slate-800 truncate">
                {isEn ? 'Guardian:' : 'অভিভাবক:'} {guardianName}
              </p>
            )}
            {activeTemplate.showEmergencyPhone && (
              <p className="font-bold text-slate-700 flex items-center gap-1 tabular-nums">
                <Phone className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  {isEn ? 'Emergency:' : 'জরুরি ফোন:'}{' '}
                  {fmt(student.mobile || settings.phone || '—')}
                </span>
              </p>
            )}
            {activeTemplate.showAddress && (
              <p className="text-slate-600 flex items-start gap-1 line-clamp-2">
                <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0 mt-0.5" />
                <span>{displayAddress}</span>
              </p>
            )}
          </div>

          <p className="text-[5.8px] text-slate-500 leading-snug text-center line-clamp-3">
            {isEn ? activeTemplate.backNoticeEn : activeTemplate.backNoticeBn}
          </p>
        </div>
      </div>

      {/* Bottom Back Strip */}
      <div
        className="relative z-10 text-white/95 px-2.5 py-1 text-[5.9px] font-bold flex items-center justify-between gap-2 shrink-0"
        style={{ backgroundColor: activeTemplate.primaryColor }}
      >
        <span className="truncate">{schoolName}</span>
        {settings.eiin && <span className="shrink-0">EIIN: {fmt(settings.eiin)}</span>}
      </div>
    </div>
  );

  if (sideMode === 'front') return renderFront();
  if (sideMode === 'back' || sideMode === 'duplex_mirrored') return renderBack();

  return (
    <div
      className="inline-flex items-center flex-nowrap"
      style={{ gap: `${innerPairGapMm}mm` }}
    >
      {needsFront && renderFront()}
      {needsBack && renderBack()}
    </div>
  );
}
