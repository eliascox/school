'use client';

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 📜 OFFICIAL CERTIFICATE & TESTIMONIAL DOCUMENT ENGINE
 * ─────────────────────────────────────────────────────────────────────────────
 * Dual-capable print & PNG canvas renderer:
 * 1) Institutional Letterhead Pad mode (SchoolPadWrapper for pre-uploaded pads)
 * 2) Studio Frame & Bilingual Testimonial mode (A4 Portrait/Landscape,
 *    perforated office copy stub, 12 ornamental borders, 7+ color themes,
 *    ribbon/line titles, 35x45mm photo box, header show/hide, WYSIWYG inline
 *    editing, and live public QR verification code).
 * ═════════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Scissors, User } from 'lucide-react';
import {
  SchoolSettings,
  settingsService,
  DEFAULT_PAD_MARGINS,
  DEFAULT_PAD_HEADER_FIELDS,
  getEnglishSchoolName,
  getEnglishAddress,
} from '@/services/settingsService';
import {
  CertificateRecord,
  CertificateLayoutStyle,
} from '@/services/certificateService';
import {
  buildCertificateVerifyUrl,
  formatCertificateDate,
  getDefaultCertificateTitle,
  localizeNumericText,
  resolveGenderGrammar,
  cleanEntityText,
  DOTTED_BLANK,
} from '@/lib/certificateEngine';
import {
  CERTIFICATE_BORDER_PRESETS,
  resolveThemePalette,
} from './certificates/certificateThemes';
import CertificateFrameDecor from './certificates/CertificateFrameDecor';
import SchoolPadWrapper, { PadHeaderFieldsOverlay } from './SchoolPadWrapper';

const HAS_BENGALI_RE = /[\u0980-\u09FF]/;
const CURSIVE_FONT_STACK =
  "'Great Vibes', 'Alex Brush', 'Edwardian Script ITC', 'Brush Script MT', 'Corsiva', 'Hind Siliguri', cursive";
const EDITORIAL_SERIF_STACK =
  "'Cormorant Garamond', 'Playfair Display', Georgia, 'Times New Roman', 'Hind Siliguri', serif";

export interface OfficialCertificateDocProps {
  cert: CertificateRecord;
  settings: SchoolSettings;
  overrideStyle?: CertificateLayoutStyle;
  mode?: 'full_pad' | 'preprinted' | 'blank_pad';
  onModeChange?: (mode: 'full_pad' | 'preprinted' | 'blank_pad') => void;
  onOpenSettings?: () => void;
  hideHeaderActions?: boolean;
  sheetRef?: React.Ref<HTMLDivElement>;
  inlineEditable?: boolean;
  onInlineTitleChange?: (nextTitle: string) => void;
  onInlineBodyChange?: (nextBody: string) => void;
}

export default function OfficialCertificateDoc({
  cert,
  settings,
  overrideStyle,
  mode = 'full_pad',
  onModeChange,
  onOpenSettings,
  hideHeaderActions = true,
  sheetRef,
  inlineEditable = false,
  onInlineTitleChange,
  onInlineBodyChange,
}: OfficialCertificateDocProps) {
  const safeSettings: SchoolSettings = {
    ...settingsService.getSettings(),
    ...(settings || {}),
  };

  const lang = cert.language === 'en' ? 'en' : 'bn';
  const effectiveLayout = overrideStyle || cert.layoutStyle || 'pad';
  const isLandscape = cert.orientation === 'landscape';
  const showHeader = cert.showHeader !== undefined ? cert.showHeader : mode !== 'preprinted';
  const showOfficeStub = Boolean(cert.showOfficeStub);
  const showPhotoBox = Boolean(cert.showPhotoBox);
  const showQrCode = cert.showQrCode !== false;
  const showCornerBands = Boolean(cert.showCornerBands);
  const showSecondarySigner = Boolean(cert.showSecondarySigner);
  const useCursiveNames = lang === 'en' && cert.cursiveNames !== false;
  const isEnglishTestimonial = lang === 'en' && cert.type === 'ssc_testimonial';
  const fontSize = cert.fontSize || (isEnglishTestimonial ? 17.5 : safeSettings.padFontSize || 15);
  const titleVariant = cert.titleVariant || 'ribbon';
  const palette = resolveThemePalette('royal_indigo', cert.themeColor);
  const borderPresetMeta =
    CERTIFICATE_BORDER_PRESETS.find((b) => b.id === cert.borderPreset) ||
    (effectiveLayout === 'royal_border'
      ? CERTIFICATE_BORDER_PRESETS[0]
      : effectiveLayout === 'modern_clean'
      ? CERTIFICATE_BORDER_PRESETS[4]
      : CERTIFICATE_BORDER_PRESETS[11]);

  const title =
    cleanEntityText(cert.title) || getDefaultCertificateTitle(cert.type, lang);

  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!showQrCode) {
      setQrDataUrl('');
      return;
    }
    let active = true;
    const url = buildCertificateVerifyUrl(cert);
    QRCode.toDataURL(url, {
      width: 112,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((res) => {
        if (active) setQrDataUrl(res);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [
    showQrCode,
    cert.id,
    cert.studentName,
    cert.studentNameEn,
    cert.boardRoll,
    cert.roll,
    cert.gpa,
    cert.passingYear,
    cert.issueDate,
  ]);

  const grammar = resolveGenderGrammar(cert.gender, cert.studentName);
  const formattedIssueDate = formatCertificateDate(cert.issueDate, lang);
  const refLabel = lang === 'en' ? 'Ref No' : 'স্মারক নং';
  const dateLabelText = lang === 'en' ? 'Date' : 'তারিখ';

  const schoolNameDisplay =
    lang === 'en'
      ? cleanEntityText(getEnglishSchoolName(safeSettings, 'EDUCATIONAL INSTITUTION'))
      : cleanEntityText(safeSettings.schoolName || 'শিক্ষা প্রতিষ্ঠান');
  const schoolAddressDisplay =
    lang === 'en'
      ? cleanEntityText(getEnglishAddress(safeSettings, ''))
      : cleanEntityText(safeSettings.address || '');
  const principalNameDisplay =
    cert.principalTitle ||
    cleanEntityText(safeSettings.principalName) ||
    (lang === 'en' ? 'Headmaster / Principal' : 'প্রধান শিক্ষক / অধ্যক্ষ');
  const principalRoleDisplay =
    cleanEntityText(safeSettings.principalTitle) ||
    (lang === 'en' ? 'Headmaster' : 'প্রধান শিক্ষক');

  const studentTargetEn = cleanEntityText(cert.studentNameEn || cert.studentName).toLowerCase();
  const fatherTargetEn = cleanEntityText(cert.fatherNameEn || cert.fatherName).toLowerCase();
  const motherTargetEn = cleanEntityText(cert.motherNameEn || cert.motherName).toLowerCase();

  const renderStyledToken = (text: string, idx: number | string) => {
    const clean = text.trim();
    const low = clean.toLowerCase();
    const containsBn = HAS_BENGALI_RE.test(clean);

    const isStudentName = Boolean(studentTargetEn && low === studentTargetEn);
    const isParentName = Boolean(
      (fatherTargetEn && low === fatherTargetEn) || (motherTargetEn && low === motherTargetEn),
    );

    if (useCursiveNames && !containsBn && (isStudentName || isParentName)) {
      return (
        <span
          key={idx}
          style={{
            fontFamily: CURSIVE_FONT_STACK,
            fontSize: isStudentName ? '1.62em' : '1.36em',
            fontWeight: 400,
            fontStyle: 'normal',
            lineHeight: 1.04,
            color: '#020617',
            borderBottom: '1.5px dotted #334155',
            padding: isStudentName ? '0 14px 1px' : '0 8px 1px',
            minWidth: isStudentName ? '200px' : undefined,
            textAlign: isStudentName ? 'center' : undefined,
            display: 'inline-block',
            letterSpacing: '0.015em',
          }}
        >
          {clean}
        </span>
      );
    }

    if (isEnglishTestimonial && !containsBn) {
      return (
        <strong
          key={idx}
          style={{
            fontWeight: 700,
            fontStyle: 'italic',
            color: '#020617',
            borderBottom: '1.5px dotted #475569',
            padding: '0 4px 1px',
            display: 'inline-block',
            lineHeight: 1.2,
          }}
        >
          {clean}
        </strong>
      );
    }

    return (
      <strong key={idx} style={{ fontWeight: 800, color: '#020617' }}>
        {text}
      </strong>
    );
  };

  const renderFormattedLine = (para: string) => {
    const parts = para.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return renderStyledToken(part.slice(2, -2), idx);
      }
      return part;
    });
  };

  const renderFallbackBody = () => {
    const father = cleanEntityText(lang === 'en' ? cert.fatherNameEn || cert.fatherName : cert.fatherName) || DOTTED_BLANK;
    const mother = cleanEntityText(lang === 'en' ? cert.motherNameEn || cert.motherName : cert.motherName) || DOTTED_BLANK;
    const vill = cleanEntityText(cert.village) || DOTTED_BLANK;
    const po = cleanEntityText(cert.postOffice) || DOTTED_BLANK;
    const upz = cleanEntityText(cert.upazila) || DOTTED_BLANK;
    const dist = cleanEntityText(cert.district) || DOTTED_BLANK;
    const studentName = cleanEntityText(lang === 'en' ? cert.studentNameEn || cert.studentName : cert.studentName) || DOTTED_BLANK;

    if (lang === 'en') {
      return (
        <>
          <p style={{ marginBottom: '12px', textIndent: '28px' }}>
            This is to certify that {renderStyledToken(studentName, 'st-name')}, {grammar.sonDaughterEn}{' '}
            {renderStyledToken(father, 'fa-name')} and {renderStyledToken(mother, 'mo-name')}, Village:{' '}
            {renderStyledToken(vill, 'vill')}, Post Office: {renderStyledToken(po, 'po')}, Upazila:{' '}
            {renderStyledToken(upz, 'upz')}, District: {renderStyledToken(dist, 'dist')}.
          </p>
          <p style={{ marginBottom: '12px', textIndent: '28px' }}>
            {grammar.heShe} {cert.isAlumni ? 'was' : 'is'} a regular student of Class {renderStyledToken(cert.grade, 'cls')} ({renderStyledToken(cert.group, 'grp')} Group), Roll No.{' '}
            {renderStyledToken(cert.roll, 'roll')}, Session {renderStyledToken(cert.session, 'sess')}.{' '}
            {cert.dob && (
              <>
                {grammar.HisHer} date of birth as per school register is {renderStyledToken(formatCertificateDate(cert.dob, 'en'), 'dob')}.
              </>
            )}
          </p>
          <p style={{ marginBottom: '12px', textIndent: '28px' }}>
            {cert.characterRemarks || `During stay in this institution, ${grammar.hisHer} moral character and conduct were satisfactory.`}
          </p>
        </>
      );
    }

    return (
      <>
        <p style={{ marginBottom: '12px', textIndent: '28px' }}>
          এই মর্মে <strong style={{ fontWeight: 800 }}>{title}</strong> প্রদান করা যাচ্ছে যে,{' '}
          <strong style={{ fontWeight: 800, textDecoration: 'underline' }}>{studentName}</strong>, পিতা:{' '}
          <strong>{father}</strong>, মাতা: <strong>{mother}</strong>,{' '}
          {cert.address && !cert.village ? (
            <>ঠিকানা: <strong>{cleanEntityText(cert.address)}</strong>।</>
          ) : (
            <>গ্রাম: <strong>{vill}</strong>, ডাকঘর: <strong>{po}</strong>, উপজেলা: <strong>{upz}</strong>, জেলা: <strong>{dist}</strong>।</>
          )}
        </p>
        <p style={{ marginBottom: '12px', textIndent: '28px' }}>
          {grammar.pronounBn} অত্র বিদ্যালয়ের <strong>{cert.grade}</strong> শ্রেণির <strong>{cert.group}</strong> বিভাগের একজন নিয়মিত{' '}
          <strong>{grammar.studentNounBn}</strong>{' '}
          {cert.isAlumni ? 'ছিল' : 'হিসেবে বর্তমানে অধ্যয়নরত আছে'}। {grammar.possessiveBn} শ্রেণি রোল নম্বর:{' '}
          <strong>{localizeNumericText(cert.roll, 'bn')}</strong>, শিক্ষাবর্ষ:{' '}
          <strong>{localizeNumericText(cert.session, 'bn')}</strong>।{' '}
          {cert.dob && (
            <>
              ভর্তিবহি অনুযায়ী {grammar.possessiveBn} জন্ম তারিখ: <strong>{formatCertificateDate(cert.dob, 'bn')}</strong> খ্রি.।
            </>
          )}
        </p>
        {cert.achievementTitle && (
          <p style={{ marginBottom: '12px', textIndent: '28px' }}>
            এই প্রতিষ্ঠানে অধ্যয়নকালে {grammar.pronounBn} <strong>{cert.achievementTitle}</strong> হিসেবে কৃতিত্বপূর্ণ ভূমিকা পালন করে।
          </p>
        )}
        <p style={{ marginBottom: '12px', textIndent: '28px' }}>
          {cert.characterRemarks || `বিদ্যালয়ে অবস্থানকালে ${grammar.possessiveBn} চরিত্র, শৃঙ্খলা ও আচার-আচরণ অত্যন্ত প্রশংসনীয় ছিল।`}
        </p>
        <p style={{ textIndent: '28px' }}>আমি {grammar.possessiveBn} উজ্জ্বল ভবিষ্যৎ ও সার্বিক উন্নতি কামনা করি।</p>
      </>
    );
  };

  // Legacy pure Uploaded-Pad fast path when no Studio visual overrides are active
  const usePurePadWrapper =
    effectiveLayout === 'pad' &&
    (!cert.borderPreset || cert.borderPreset === 'no_border_pad') &&
    !isLandscape &&
    !showOfficeStub &&
    !showPhotoBox &&
    !showCornerBands &&
    !inlineEditable &&
    Boolean(safeSettings.uploadedPadTemplateUrl?.trim());

  if (usePurePadWrapper) {
    const padMargins = {
      ...DEFAULT_PAD_MARGINS,
      ...(safeSettings.padMargins || {}),
    };
    const docSettings: SchoolSettings = { ...safeSettings, padMargins };

    return (
      <div ref={sheetRef}>
        <SchoolPadWrapper
          settings={docSettings}
          mode={mode}
          onModeChange={onModeChange}
          onOpenSettings={onOpenSettings}
          refNo={cert.refNo ? `${cert.refNo}` : undefined}
          date={cert.issueDate || formattedIssueDate}
          dateLabel={dateLabelText}
          dateLang={lang}
          title={title}
          hideHeaderActions={hideHeaderActions}
          signatures={[
            {
              title: principalNameDisplay,
              designation: principalRoleDisplay,
              institution: schoolNameDisplay,
              address: schoolAddressDisplay,
              rightAligned: true,
            },
          ]}
        >
          <div
            className="space-y-4 text-justify px-1 pt-1 pb-2"
            style={{
              fontSize: `${fontSize}px`,
              fontFamily: isEnglishTestimonial ? EDITORIAL_SERIF_STACK : undefined,
              fontStyle: isEnglishTestimonial ? 'italic' : 'normal',
              lineHeight: isEnglishTestimonial ? 2.0 : undefined,
            }}
          >
            {cert.customBody ? (
              cert.customBody.split('\n\n').map((para, i) => (
                <p key={i} className="mb-4 leading-relaxed text-justify indent-6">
                  {renderFormattedLine(para)}
                </p>
              ))
            ) : (
              <div className="space-y-4 text-justify">{renderFallbackBody()}</div>
            )}

            {showQrCode && qrDataUrl && (
              <div className="pt-4 flex items-center gap-2.5 text-[10px] text-slate-600 not-italic">
                <img src={qrDataUrl} alt="QR Verify" className="w-14 h-14 border border-slate-300 rounded p-0.5 bg-white" />
                <div>
                  <p className="font-bold text-slate-800">{lang === 'en' ? 'Scan to Verify Online' : 'অনলাইনে সত্যতা যাচাই করুন'}</p>
                  <p className="font-mono text-slate-500">{cert.id}</p>
                </div>
              </div>
            )}
          </div>
        </SchoolPadWrapper>
      </div>
    );
  }

  // Studio Sheet dimensions in mm (A4 Portrait 210x297 or Landscape 297x210)
  const sheetWidthMm = isLandscape ? 297 : 210;
  const sheetHeightMm = isLandscape ? 210 : 297;
  const padHeaderFields = {
    ...DEFAULT_PAD_HEADER_FIELDS,
    ...(safeSettings.padHeaderFields || {}),
  };
  const padTopIn = !showHeader ? (safeSettings.padMargins?.top ?? DEFAULT_PAD_MARGINS.top) : 0;
  const uploadedPadUrl =
    mode === 'full_pad' && borderPresetMeta.id === 'no_border_pad'
      ? safeSettings.uploadedPadTemplateUrl?.trim() || ''
      : '';
  const useStudioPadHeaderOverlay =
    !isLandscape &&
    (!showHeader || Boolean(uploadedPadUrl)) &&
    padHeaderFields.placement === 'pad_header_boxes';
  const customBorderUrl =
    cert.customBorderUrl ||
    (borderPresetMeta.id === 'custom_png' ? safeSettings.customBorderPng || safeSettings.customBorders?.[0]?.url : '');

  const stubWidthMm = isLandscape ? 54 : 44;

  return (
    <div className="w-full overflow-x-auto pb-2 flex justify-center">
      <div
        ref={sheetRef}
        className="certificate-studio-sheet relative bg-white text-slate-950 shadow-2xl print:shadow-none print:m-0 mx-auto overflow-hidden flex"
        style={{
          width: `${sheetWidthMm}mm`,
          minWidth: `${sheetWidthMm}mm`,
          minHeight: `${sheetHeightMm}mm`,
          backgroundColor: '#ffffff',
          color: '#0f172a',
          boxSizing: 'border-box',
          fontFamily:
            lang === 'en'
              ? "'Georgia', 'Times New Roman', 'Kalpurush', serif"
              : "'Kalpurush', 'SolaimanLipi', 'Nikosh', 'Hind Siliguri', 'Times New Roman', serif",
        }}
      >
        {/* Uploaded Pad Background if applicable */}
        {uploadedPadUrl && (
          <img
            src={uploadedPadUrl}
            alt="School Pad"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}

        {/* Institutional Pad Header Boxes Overlay (সূত্র: & তারিখ: [][][]) */}
        {useStudioPadHeaderOverlay && (
          <PadHeaderFieldsOverlay
            refNo={cert.refNo || cert.id}
            date={cert.issueDate || formattedIssueDate}
            lang={lang}
            config={padHeaderFields}
          />
        )}

        {/* Left Perforated Office Copy Counterfoil Stub */}
        {showOfficeStub && (
          <aside
            style={{
              width: `${stubWidthMm}mm`,
              minWidth: `${stubWidthMm}mm`,
              borderRight: `1.5px dashed #64748b`,
              backgroundColor: palette.softTint,
              padding: isLandscape ? '18px 12px' : '22px 10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              zIndex: 15,
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: '-9px',
                top: '18px',
                backgroundColor: '#ffffff',
                color: '#475569',
                borderRadius: '999px',
                padding: '2px',
              }}
            >
              <Scissors size={14} />
            </div>

            <div style={{ fontSize: '10.5px', lineHeight: 1.45, color: '#0f172a' }}>
              <div style={{ textAlign: 'center', borderBottom: `1.5px solid ${palette.primary}`, paddingBottom: '6px', marginBottom: '8px' }}>
                <p style={{ fontWeight: 900, fontSize: '11px', color: palette.primary, letterSpacing: '0.04em' }}>
                  {lang === 'en' ? 'OFFICE COPY' : 'অফিস কপি'}
                </p>
                <p style={{ fontWeight: 700, fontSize: '9.5px', color: '#475569' }}>
                  {schoolNameDisplay}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>{lang === 'en' ? 'Cert ID / Serial' : 'সনদ নং'}</span>
                  <strong style={{ fontFamily: 'monospace', fontSize: '10px', color: palette.primary }}>{cert.id}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>{refLabel}</span>
                  <strong style={{ fontFamily: 'monospace', fontSize: '10px' }}>{cert.refNo || '—'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>{dateLabelText}</span>
                  <strong>{formattedIssueDate}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>{lang === 'en' ? 'Document Type' : 'সনদের ধরন'}</span>
                  <strong>{title}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>{lang === 'en' ? 'Student Name' : 'শিক্ষার্থীর নাম'}</span>
                  <strong>{lang === 'en' ? cert.studentNameEn || cert.studentName : cert.studentName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>{lang === 'en' ? 'Father' : 'পিতা'}</span>
                  <strong>{cleanEntityText(lang === 'en' ? cert.fatherNameEn || cert.fatherName : cert.fatherName) || DOTTED_BLANK}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>{lang === 'en' ? 'Class' : 'শ্রেণি'}</span>
                    <strong>{cert.grade}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>{lang === 'en' ? 'Roll' : 'রোল'}</span>
                    <strong>{localizeNumericText(cert.roll, lang)}</strong>
                  </div>
                </div>
                {cert.gpa && (
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>GPA</span>
                    <strong>{localizeNumericText(cert.gpa, lang)}</strong>
                  </div>
                )}
              </div>
            </div>

            <div style={{ fontSize: '9.5px', color: '#334155', paddingTop: '14px' }}>
              <div style={{ borderTop: '1px solid #475569', paddingTop: '3px', marginBottom: '12px', textAlign: 'center' }}>
                {lang === 'en' ? 'Receiver Signature' : 'গ্রহণকারীর স্বাক্ষর'}
              </div>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: '3px', textAlign: 'center', fontWeight: 700 }}>
                {lang === 'en' ? 'Issuing Officer' : 'প্রদানকারীর স্বাক্ষর'}
              </div>
            </div>
          </aside>
        )}

        {/* Main Certificate Area */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingTop: showHeader ? (isLandscape ? '24px' : '28px') : `${padTopIn}in`,
            paddingLeft: isLandscape ? '34px' : '32px',
            paddingRight: isLandscape ? '34px' : '32px',
            paddingBottom: isLandscape ? '22px' : '26px',
            boxSizing: 'border-box',
          }}
        >
          {/* Ornamental Frame + Corner Bands + Watermark */}
          <CertificateFrameDecor
            preset={borderPresetMeta}
            theme={palette}
            customBorderUrl={customBorderUrl}
            showCornerBands={showCornerBands}
            watermarkUrl={safeSettings.schoolLogo}
            showWatermark={safeSettings.showWatermark !== false}
            watermarkOpacity={Math.min(0.14, safeSettings.watermarkOpacity || 0.055)}
          />

          {/* Top Block: Header + Ref/Date + Photo + Title */}
          <div style={{ position: 'relative', zIndex: 14 }}>
            {/* Institutional Header (toggleable for pre-printed pads) */}
            {showHeader && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  borderBottom: `2px solid ${palette.primary}`,
                  paddingBottom: '10px',
                  marginBottom: '10px',
                }}
              >
                <div style={{ width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {safeSettings.schoolLogo ? (
                    <img
                      src={safeSettings.schoolLogo}
                      alt="School Crest"
                      style={{ width: '62px', height: '62px', objectFit: 'contain' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '999px',
                        border: `2px solid ${palette.primary}`,
                        backgroundColor: palette.softTint,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '14px',
                        color: palette.primary,
                      }}
                    >
                      SC
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, textAlign: 'center' }}>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: isLandscape ? '22px' : '23px',
                      fontWeight: 900,
                      color: palette.primary,
                      letterSpacing: '0.02em',
                      lineHeight: 1.2,
                    }}
                  >
                    {schoolNameDisplay}
                  </h1>
                  {schoolAddressDisplay && (
                    <p style={{ margin: '2px 0 0', fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                      {schoolAddressDisplay}
                    </p>
                  )}
                  <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                    {[
                      safeSettings.estdYear ? `${lang === 'en' ? 'Estd.' : 'স্থাপিত'}: ${localizeNumericText(safeSettings.estdYear, lang)}` : '',
                      safeSettings.eiin ? `EIIN: ${localizeNumericText(safeSettings.eiin, lang)}` : '',
                      safeSettings.phone ? `${lang === 'en' ? 'Phone' : 'ফোন'}: ${localizeNumericText(safeSettings.phone, lang)}` : '',
                    ]
                      .filter(Boolean)
                      .join('  |  ')}
                  </p>
                </div>

                {/* Right spacer or 35x45mm Photo Box */}
                <div style={{ width: showPhotoBox ? 'auto' : '64px', flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
                  {showPhotoBox && (
                    <div
                      style={{
                        width: '30mm',
                        height: '38mm',
                        border: `1.5px solid ${palette.primary}`,
                        borderRadius: '4px',
                        backgroundColor: '#f8fafc',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {cert.photoUrl ? (
                        <img
                          src={cert.photoUrl}
                          alt={cert.studentName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '9px', padding: '4px' }}>
                          <User size={22} style={{ margin: '0 auto 2px' }} />
                          <span>35×45 mm</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* If Header Hidden AND Photo Box enabled, place photo floating cleanly on top right */}
            {!showHeader && showPhotoBox && (
              <div
                style={{
                  position: 'absolute',
                  right: '4px',
                  top: '2px',
                  width: '28mm',
                  height: '35mm',
                  border: `1.5px solid ${palette.primary}`,
                  borderRadius: '4px',
                  backgroundColor: '#f8fafc',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20,
                }}
              >
                {cert.photoUrl ? (
                  <img src={cert.photoUrl} alt={cert.studentName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>Photo</span>
                )}
              </div>
            )}

            {/* Ref & Date Row (hidden when placed directly onto pad header boxes) */}
            {!useStudioPadHeaderOverlay && padHeaderFields.placement !== 'hide_ref_date' && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#1e293b',
                  borderBottom: '1px dotted #cbd5e1',
                  paddingBottom: '5px',
                  marginBottom: isLandscape ? '10px' : '16px',
                }}
              >
                <span>
                  {refLabel}: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{cert.refNo || cert.id}</strong>
                </span>
                <span>
                  {dateLabelText}: <strong>{formattedIssueDate}</strong>
                </span>
              </div>
            )}

            {/* Document Title (3 Variants + Live Inline Editable) */}
            <div style={{ textAlign: 'center', marginBottom: isLandscape ? '14px' : '22px' }}>
              <span
                contentEditable={inlineEditable}
                suppressContentEditableWarning
                onBlur={(e) => {
                  if (inlineEditable && onInlineTitleChange) {
                    onInlineTitleChange(e.currentTarget.textContent?.trim() || title);
                  }
                }}
                style={{
                  display: 'inline-block',
                  padding: titleVariant === 'ribbon' ? '6px 32px' : '4px 18px',
                  fontSize: isLandscape ? '18px' : '20px',
                  fontWeight: 900,
                  letterSpacing: '0.06em',
                  borderRadius: titleVariant === 'ribbon' ? '999px' : '2px',
                  backgroundColor: titleVariant === 'ribbon' ? palette.primary : 'transparent',
                  color: titleVariant === 'ribbon' ? palette.titleTextOnRibbon : palette.primary,
                  borderBottom:
                    titleVariant === 'underline'
                      ? `2.5px solid ${palette.secondary}`
                      : titleVariant === 'ribbon'
                      ? `2px solid ${palette.secondary}`
                      : 'none',
                  outline: inlineEditable ? `1.5px dashed ${palette.secondary}` : 'none',
                  cursor: inlineEditable ? 'text' : 'default',
                }}
              >
                {title}
              </span>
            </div>

            {/* Body Paragraphs (WYSIWYG inline editable when enabled) */}
            <div
              contentEditable={inlineEditable}
              suppressContentEditableWarning
              onBlur={(e) => {
                if (inlineEditable && onInlineBodyChange) {
                  const text = e.currentTarget.innerText
                    .replace(/\r\n/g, '\n')
                    .replace(/\n{3,}/g, '\n\n')
                    .trim();
                  if (text) onInlineBodyChange(text);
                }
              }}
              style={{
                fontSize: `${fontSize}px`,
                fontFamily: isEnglishTestimonial ? EDITORIAL_SERIF_STACK : undefined,
                fontStyle: isEnglishTestimonial ? 'italic' : 'normal',
                lineHeight: isEnglishTestimonial
                  ? isLandscape
                    ? 1.9
                    : 2.08
                  : isLandscape
                  ? 1.75
                  : 1.95,
                textAlign: 'justify',
                color: '#0f172a',
                whiteSpace: inlineEditable ? 'pre-wrap' : 'normal',
                outline: inlineEditable ? `1.5px dashed ${palette.secondary}` : 'none',
                borderRadius: '6px',
                padding: inlineEditable ? '6px 8px' : '0 2px',
                backgroundColor: inlineEditable ? 'rgba(255, 251, 235, 0.45)' : 'transparent',
                cursor: inlineEditable ? 'text' : 'default',
              }}
            >
              {cert.customBody ? (
                inlineEditable ? (
                  cert.customBody
                ) : (
                  cert.customBody.split('\n\n').map((para, i) => (
                    <p key={i} style={{ marginBottom: isLandscape ? '10px' : '14px', textIndent: '28px', marginTop: 0 }}>
                      {renderFormattedLine(para)}
                    </p>
                  ))
                )
              ) : (
                renderFallbackBody()
              )}
            </div>
          </div>

          {/* Footer: QR Verification + Prepared By / Secondary Signer + Headmaster Signature */}
          <div
            style={{
              position: 'relative',
              zIndex: 14,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '16px',
              paddingTop: isLandscape ? '18px' : '32px',
            }}
          >
            {/* Left: Verification QR Code */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '140px' }}>
              {showQrCode && qrDataUrl && (
                <>
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    style={{
                      width: '56px',
                      height: '56px',
                      border: `1px solid ${palette.primary}`,
                      borderRadius: '4px',
                      padding: '2px',
                      backgroundColor: '#ffffff',
                    }}
                  />
                  <div style={{ fontSize: '9.5px', color: '#475569', lineHeight: 1.35 }}>
                    <div style={{ fontWeight: 800, color: palette.primary }}>
                      {lang === 'en' ? 'Scan to Verify' : 'QR যাচাই'}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{cert.id}</div>
                    {cert.verificationCode && (
                      <div style={{ fontFamily: 'monospace', fontSize: '8.5px' }}>{cert.verificationCode}</div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Optional Middle Secondary Signature */}
            {showSecondarySigner && (
              <div style={{ textAlign: 'center', minWidth: '155px', fontSize: '11.5px', color: '#1e293b' }}>
                <div style={{ borderTop: '1.5px solid #334155', width: '150px', margin: '0 auto 4px' }} />
                <p style={{ margin: 0, fontWeight: 800 }}>
                  {cert.secondarySignerTitle || (lang === 'en' ? 'Class Teacher / Asst. Headmaster' : 'শ্রেণি শিক্ষক / সহকারী প্রধান শিক্ষক')}
                </p>
                {cert.secondarySignerName && <p style={{ margin: '1px 0 0', fontSize: '10.5px', color: '#475569' }}>{cert.secondarySignerName}</p>}
              </div>
            )}

            {/* Right: Principal / Headmaster Signature */}
            <div style={{ textAlign: 'center', minWidth: '185px', fontSize: '11.5px', color: '#0f172a', marginLeft: 'auto' }}>
              <div style={{ borderTop: `1.8px solid ${palette.primary}`, width: '175px', margin: '0 auto 4px' }} />
              <p style={{ margin: 0, fontWeight: 900, fontSize: '12.5px', color: palette.primary }}>{principalNameDisplay}</p>
              <p style={{ margin: '1px 0 0', fontWeight: 700, fontSize: '11px', color: '#334155' }}>{principalRoleDisplay}</p>
              <p style={{ margin: '1px 0 0', fontWeight: 600, fontSize: '10.5px', color: '#475569' }}>{schoolNameDisplay}</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 ${isLandscape ? 'landscape' : 'portrait'};
            margin: 0mm !important;
          }
          html,
          body {
            margin: 0mm !important;
            padding: 0mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
