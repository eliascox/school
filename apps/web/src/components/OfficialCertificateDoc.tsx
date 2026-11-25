'use client';

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 📜 OFFICIAL CERTIFICATE & TESTIMONIAL DOCUMENT ENGINE
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified Pad-First & Digital-Frame A4 Print / PNG Renderer:
 * 1) Uploaded School Pad & Pre-Printed Pad Canvas (default for ALL certificates):
 *    Full-bleed 210x297mm A4 Portrait pad background, exact inch margins
 *    (padMargins), mm-calibrated Ref/Date header boxes (PadHeaderFieldsOverlay),
 *    line-height & signature-gap fidelity, inline WYSIWYG editing directly on
 *    the pad, optional 35x45mm photo, 2nd signer, and live verification QR.
 * 2) Optional Digital Ornamental Frame mode (12 borders, 7+ color themes,
 *    Portrait/Landscape, Office Copy Stub, Ribbon/Underline titles, QR verify).
 * ═════════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { AlertCircle, Scissors, Upload, User } from 'lucide-react';
import {
  SchoolSettings,
  settingsService,
  DEFAULT_PAD_MARGINS,
  DEFAULT_PAD_HEADER_FIELDS,
  getEnglishSchoolName,
  getEnglishAddress,
} from '@/services/settingsService';
import {
  CertificateCanvasMode,
  CertificateRecord,
  CertificateLayoutStyle,
} from '@/services/certificateService';
import {
  buildCertificateVerifyUrl,
  formatCertificateDate,
  getDefaultCertificateTitle,
  localizeNumericText,
  resolveCertificateCanvasMode,
  resolveGenderGrammar,
  cleanEntityText,
  DOTTED_BLANK,
} from '@/lib/certificateEngine';
import {
  CERTIFICATE_BORDER_PRESETS,
  resolveThemePalette,
} from './certificates/certificateThemes';
import CertificateFrameDecor from './certificates/CertificateFrameDecor';
import { PadHeaderFieldsOverlay } from './SchoolPadWrapper';

const HAS_BENGALI_RE = /[\u0980-\u09FF]/;
const CURSIVE_FONT_STACK =
  "'Great Vibes', 'Alex Brush', 'Edwardian Script ITC', 'Brush Script MT', 'Corsiva', 'Hind Siliguri', cursive";
const EDITORIAL_SERIF_STACK =
  "'Cormorant Garamond', 'Playfair Display', Georgia, 'Times New Roman', 'Hind Siliguri', serif";
const BENGALI_PAD_FONT_STACK =
  "'Kalpurush', 'SolaimanLipi', 'Nikosh', 'Hind Siliguri', 'Times New Roman', serif";

export interface OfficialCertificateDocProps {
  cert: CertificateRecord;
  settings: SchoolSettings;
  canvasMode?: CertificateCanvasMode;
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
  canvasMode,
  overrideStyle,
  mode = 'full_pad',
  onOpenSettings,
  sheetRef,
  inlineEditable = false,
  onInlineTitleChange,
  onInlineBodyChange,
}: OfficialCertificateDocProps) {
  const safeSettings: SchoolSettings = {
    ...settingsService.getSettings(),
    ...(settings || {}),
  };

  const [padImgError, setPadImgError] = useState(false);
  const rawUploadedPadUrl = safeSettings.uploadedPadTemplateUrl?.trim() || '';
  useEffect(() => {
    setPadImgError(false);
  }, [rawUploadedPadUrl]);

  const effectiveCanvasMode: CertificateCanvasMode =
    canvasMode || resolveCertificateCanvasMode(cert, overrideStyle, mode);
  const isPadCanvas =
    effectiveCanvasMode === 'uploaded_pad' || effectiveCanvasMode === 'preprinted_pad';

  const lang = cert.language === 'en' ? 'en' : 'bn';
  const effectiveLayout = overrideStyle || cert.layoutStyle || 'pad';
  const isLandscape = !isPadCanvas && cert.orientation === 'landscape';
  const showHeader = isPadCanvas
    ? false
    : cert.showHeader !== undefined
    ? cert.showHeader
    : mode !== 'preprinted';
  const showOfficeStub = !isPadCanvas && Boolean(cert.showOfficeStub);
  const showPhotoBox = Boolean(cert.showPhotoBox);
  const showQrCode = cert.showQrCode !== false;
  const showCornerBands = !isPadCanvas && Boolean(cert.showCornerBands);
  const showSecondarySigner = Boolean(cert.showSecondarySigner);
  const hideTitle = Boolean(cert.hideTitle);
  const useCursiveNames = lang === 'en' && cert.cursiveNames !== false;
  const isEnglishTestimonial = lang === 'en' && cert.type === 'ssc_testimonial';
  const fontSize =
    cert.fontSize ||
    (isPadCanvas
      ? safeSettings.padFontSize || 14.5
      : isEnglishTestimonial
      ? 17.5
      : safeSettings.padFontSize || 15);
  const padLineHeight = safeSettings.padLineHeight || 2.05;
  const padSignatureGap = safeSettings.padSignatureGap ?? 2.5;
  const titleVariant = cert.titleVariant || (isPadCanvas ? 'boxed' : 'ribbon');
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
            fontSize: isStudentName ? '1.52em' : '1.3em',
            fontWeight: 400,
            fontStyle: 'normal',
            lineHeight: 1.04,
            color: '#020617',
            borderBottom: '1.5px dotted #334155',
            padding: isStudentName ? '0 10px 1px' : '0 6px 1px',
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
    const father =
      cleanEntityText(lang === 'en' ? cert.fatherNameEn || cert.fatherName : cert.fatherName) ||
      DOTTED_BLANK;
    const mother =
      cleanEntityText(lang === 'en' ? cert.motherNameEn || cert.motherName : cert.motherName) ||
      DOTTED_BLANK;
    const vill = cleanEntityText(cert.village) || DOTTED_BLANK;
    const po = cleanEntityText(cert.postOffice) || DOTTED_BLANK;
    const upz = cleanEntityText(cert.upazila) || DOTTED_BLANK;
    const dist = cleanEntityText(cert.district) || DOTTED_BLANK;
    const studentName =
      cleanEntityText(lang === 'en' ? cert.studentNameEn || cert.studentName : cert.studentName) ||
      DOTTED_BLANK;

    if (lang === 'en') {
      return (
        <>
          <p style={{ marginBottom: '12px', textIndent: '28px', marginTop: 0 }}>
            This is to certify that {renderStyledToken(studentName, 'st-name')}, {grammar.sonDaughterEn}{' '}
            {renderStyledToken(father, 'fa-name')} and {renderStyledToken(mother, 'mo-name')}, Village:{' '}
            {renderStyledToken(vill, 'vill')}, Post Office: {renderStyledToken(po, 'po')}, Upazila:{' '}
            {renderStyledToken(upz, 'upz')}, District: {renderStyledToken(dist, 'dist')}.
          </p>
          <p style={{ marginBottom: '12px', textIndent: '28px', marginTop: 0 }}>
            {grammar.heShe} {cert.isAlumni ? 'was' : 'is'} a regular student of Class{' '}
            {renderStyledToken(cert.grade, 'cls')} ({renderStyledToken(cert.group, 'grp')} Group), Roll No.{' '}
            {renderStyledToken(cert.roll, 'roll')}, Session {renderStyledToken(cert.session, 'sess')}.{' '}
            {cert.dob && (
              <>
                {grammar.HisHer} date of birth as per school register is{' '}
                {renderStyledToken(formatCertificateDate(cert.dob, 'en'), 'dob')}.
              </>
            )}
          </p>
          <p style={{ marginBottom: '12px', textIndent: '28px', marginTop: 0 }}>
            {cert.characterRemarks ||
              `During stay in this institution, ${grammar.hisHer} moral character and conduct were satisfactory.`}
          </p>
        </>
      );
    }

    return (
      <>
        <p style={{ marginBottom: '12px', textIndent: '28px', marginTop: 0 }}>
          এই মর্মে <strong style={{ fontWeight: 800 }}>{title}</strong> প্রদান করা যাচ্ছে যে,{' '}
          <strong style={{ fontWeight: 800, textDecoration: 'underline' }}>{studentName}</strong>, পিতা:{' '}
          <strong>{father}</strong>, মাতা: <strong>{mother}</strong>,{' '}
          {cert.address && !cert.village ? (
            <>ঠিকানা: <strong>{cleanEntityText(cert.address)}</strong>।</>
          ) : (
            <>
              গ্রাম: <strong>{vill}</strong>, ডাকঘর: <strong>{po}</strong>, উপজেলা: <strong>{upz}</strong>,
              জেলা: <strong>{dist}</strong>।
            </>
          )}
        </p>
        <p style={{ marginBottom: '12px', textIndent: '28px', marginTop: 0 }}>
          {grammar.pronounBn} অত্র বিদ্যালয়ের <strong>{cert.grade}</strong> শ্রেণির{' '}
          <strong>{cert.group}</strong> বিভাগের একজন নিয়মিত <strong>{grammar.studentNounBn}</strong>{' '}
          {cert.isAlumni ? 'ছিল' : 'হিসেবে বর্তমানে অধ্যয়নরত আছে'}। {grammar.possessiveBn} শ্রেণি রোল নম্বর:{' '}
          <strong>{localizeNumericText(cert.roll, 'bn')}</strong>, শিক্ষাবর্ষ:{' '}
          <strong>{localizeNumericText(cert.session, 'bn')}</strong>।{' '}
          {cert.dob && (
            <>
              ভর্তিবহি অনুযায়ী {grammar.possessiveBn} জন্ম তারিখ:{' '}
              <strong>{formatCertificateDate(cert.dob, 'bn')}</strong> খ্রি.।
            </>
          )}
        </p>
        {cert.achievementTitle && (
          <p style={{ marginBottom: '12px', textIndent: '28px', marginTop: 0 }}>
            এই প্রতিষ্ঠানে অধ্যয়নকালে {grammar.pronounBn} <strong>{cert.achievementTitle}</strong> হিসেবে
            কৃতিত্বপূর্ণ ভূমিকা পালন করে।
          </p>
        )}
        <p style={{ marginBottom: '12px', textIndent: '28px', marginTop: 0 }}>
          {cert.characterRemarks ||
            `বিদ্যালয়ে অবস্থানকালে ${grammar.possessiveBn} চরিত্র, শৃঙ্খলা ও আচার-আচরণ অত্যন্ত প্রশংসনীয় ছিল।`}
        </p>
        <p style={{ textIndent: '28px', marginTop: 0 }}>
          আমি {grammar.possessiveBn} উজ্জ্বল ভবিষ্যৎ ও সার্বিক উন্নতি কামনা করি।
        </p>
      </>
    );
  };

  const padMargins = {
    ...DEFAULT_PAD_MARGINS,
    ...(safeSettings.padMargins || {}),
  };
  const padHeaderFields = {
    ...DEFAULT_PAD_HEADER_FIELDS,
    ...(safeSettings.padHeaderFields || {}),
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. UNIFIED UPLOADED PAD / PRE-PRINTED PAD CANVAS (DEFAULT FOR ALL CERTS)
  // ═══════════════════════════════════════════════════════════════════════════
  if (isPadCanvas) {
    const showUploadedPadBg =
      effectiveCanvasMode === 'uploaded_pad' && Boolean(rawUploadedPadUrl) && !padImgError;
    const usePadHeaderOverlay = padHeaderFields.placement === 'pad_header_boxes';
    const showInlineRefDate = padHeaderFields.placement === 'inline_below';

    const padTitleStyle: React.CSSProperties =
      titleVariant === 'ribbon'
        ? {
            display: 'inline-block',
            padding: '5px 30px',
            fontSize: '19px',
            fontWeight: 900,
            letterSpacing: '0.05em',
            borderRadius: '999px',
            backgroundColor: palette.primary,
            color: '#ffffff',
            borderBottom: `2px solid ${palette.secondary}`,
          }
        : titleVariant === 'underline'
        ? {
            display: 'inline-block',
            padding: '3px 16px 5px',
            fontSize: '21px',
            fontWeight: 900,
            letterSpacing: '0.05em',
            color: '#0f172a',
            borderBottom: '2.5px double #0f172a',
          }
        : titleVariant === 'minimal'
        ? {
            display: 'inline-block',
            padding: '2px 12px',
            fontSize: '21px',
            fontWeight: 900,
            letterSpacing: '0.04em',
            color: '#0f172a',
          }
        : {
            // Classic Bangladeshi Institutional Pad Title Box ('boxed')
            display: 'inline-block',
            padding: '5px 32px',
            fontSize: '20px',
            fontWeight: 900,
            letterSpacing: '0.05em',
            color: '#020617',
            border: '2px solid #0f172a',
            borderRadius: '4px',
            backgroundColor: 'rgba(248, 250, 252, 0.85)',
          };

    return (
      <div className="school-pad-container w-full flex justify-center print:block">
        <div
          ref={sheetRef}
          className="school-pad-sheet certificate-studio-sheet relative bg-white text-slate-950 shadow-2xl mx-auto overflow-hidden print:shadow-none print:m-0"
          style={{
            width: '210mm',
            minWidth: '210mm',
            height: '297mm',
            minHeight: '297mm',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            boxSizing: 'border-box',
            fontFamily: lang === 'en' ? "'Georgia', 'Times New Roman', 'Hind Siliguri', serif" : BENGALI_PAD_FONT_STACK,
          }}
        >
          {/* Full-bleed Uploaded Official School Pad Background */}
          {showUploadedPadBg && (
            <img
              src={rawUploadedPadUrl}
              alt="Uploaded Official School Pad"
              onError={() => setPadImgError(true)}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'fill',
                pointerEvents: 'none',
                zIndex: 0,
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            />
          )}

          {/* Screen-Only Helper Banner when Uploaded Pad is not uploaded yet */}
          {effectiveCanvasMode === 'uploaded_pad' && !showUploadedPadBg && (
            <div
              className="print:hidden"
              style={{
                position: 'absolute',
                top: '14mm',
                left: '16mm',
                right: '16mm',
                zIndex: 22,
                backgroundColor: '#fffbeb',
                border: '1.5px dashed #f59e0b',
                borderRadius: '14px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={18} style={{ color: '#d97706', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#78350f' }}>
                    এখনো প্রতিষ্ঠানের প্যাড আপলোড করা হয়নি
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#92400e' }}>
                    আপনার প্রতিষ্ঠানের PDF বা ছবির প্যাড আপলোড করলেই ব্যাকগ্রাউন্ডে স্বয়ংক্রিয়ভাবে বসে যাবে।
                  </div>
                </div>
              </div>
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  style={{
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '7px 12px',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Upload size={13} /> প্যাড আপলোড করুন
                </button>
              )}
            </div>
          )}

          {/* Calibrated Header Overlay for সূত্র: & তারিখ: [দিন][মাস][সাল] */}
          {usePadHeaderOverlay && (
            <PadHeaderFieldsOverlay
              refNo={cert.refNo || cert.id}
              date={cert.issueDate || formattedIssueDate}
              lang={lang}
              config={padHeaderFields}
            />
          )}

          {/* Optional Floating 35x45mm Photo Box positioned neatly inside margins */}
          {showPhotoBox && (
            <div
              style={{
                position: 'absolute',
                top: `${padMargins.top}in`,
                right: `${padMargins.right}in`,
                width: '28mm',
                height: '35mm',
                border: '1.5px solid #1e293b',
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
                <img
                  src={cert.photoUrl}
                  alt={cert.studentName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '9px' }}>
                  <User size={20} style={{ margin: '0 auto 2px' }} />
                  <span>35×45 mm</span>
                </div>
              )}
            </div>
          )}

          {/* Main Printable Content Layer obeying exact padMargins */}
          <div
            style={{
              position: 'relative',
              zIndex: 12,
              boxSizing: 'border-box',
              paddingTop: `${padMargins.top}in`,
              paddingLeft: `${padMargins.left}in`,
              paddingRight: `${padMargins.right}in`,
              paddingBottom: `${padMargins.bottom}in`,
              minHeight: '297mm',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
            }}
          >
            {/* Inline Ref & Date Row (when user sets placement = 'inline_below') */}
            {showInlineRefDate && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0f172a',
                  borderBottom: '1px dotted #94a3b8',
                  paddingBottom: '5px',
                  marginBottom: '14px',
                }}
              >
                <span>
                  {refLabel}:{' '}
                  <strong style={{ fontFamily: 'monospace' }}>{cert.refNo || cert.id}</strong>
                </span>
                <span>
                  {dateLabelText}: <strong>{formattedIssueDate}</strong>
                </span>
              </div>
            )}

            {/* Certificate Title (Optional / Inline Editable on Pad) */}
            {!hideTitle && (
              <div
                style={{
                  textAlign: 'center',
                  marginTop: '6px',
                  marginBottom: '20px',
                  paddingRight: showPhotoBox ? '32mm' : undefined,
                  paddingLeft: showPhotoBox ? '32mm' : undefined,
                }}
              >
                <span
                  contentEditable={inlineEditable}
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    if (inlineEditable && onInlineTitleChange) {
                      onInlineTitleChange(e.currentTarget.textContent?.trim() || title);
                    }
                  }}
                  style={{
                    ...padTitleStyle,
                    outline: inlineEditable ? '1.5px dashed #d97706' : 'none',
                    cursor: inlineEditable ? 'text' : 'default',
                  }}
                >
                  {title}
                </span>
              </div>
            )}

            {/* Body Paragraphs (Inline WYSIWYG Editable directly on Uploaded Pad!) */}
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
                lineHeight: isEnglishTestimonial ? Math.max(1.9, padLineHeight) : padLineHeight,
                textAlign: 'justify',
                color: '#0f172a',
                whiteSpace: inlineEditable ? 'pre-wrap' : 'normal',
                outline: inlineEditable ? '1.5px dashed #d97706' : 'none',
                borderRadius: '6px',
                padding: inlineEditable ? '6px 8px' : '0 2px',
                backgroundColor: inlineEditable ? 'rgba(255, 251, 235, 0.55)' : 'transparent',
                cursor: inlineEditable ? 'text' : 'default',
              }}
            >
              {cert.customBody ? (
                inlineEditable ? (
                  cert.customBody
                ) : (
                  cert.customBody.split('\n\n').map((para, i) => (
                    <p key={i} style={{ marginBottom: '14px', textIndent: '28px', marginTop: 0 }}>
                      {renderFormattedLine(para)}
                    </p>
                  ))
                )
              ) : (
                renderFallbackBody()
              )}
            </div>

            {/* Footer: QR Verify + Optional 2nd Signer + Principal Signature */}
            <div
              style={{
                marginTop: `${padSignatureGap}rem`,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: '16px',
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
              }}
            >
              {/* Left: Verification QR */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '130px' }}>
                {showQrCode && qrDataUrl && (
                  <>
                    <img
                      src={qrDataUrl}
                      alt="QR Code"
                      style={{
                        width: '52px',
                        height: '52px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '2px',
                        backgroundColor: '#ffffff',
                      }}
                    />
                    <div style={{ fontSize: '9px', color: '#475569', lineHeight: 1.35 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>
                        {lang === 'en' ? 'Scan to Verify' : 'অনলাইনে যাচাই'}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                        {cert.id}
                      </div>
                      {cert.verificationCode && (
                        <div style={{ fontFamily: 'monospace', fontSize: '8.5px' }}>
                          {cert.verificationCode}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Optional Middle Secondary Signer */}
              {showSecondarySigner && (
                <div style={{ textAlign: 'center', minWidth: '150px', fontSize: '11px', color: '#0f172a' }}>
                  <div style={{ borderTop: '1.5px solid #334155', width: '145px', margin: '0 auto 5px' }} />
                  <p style={{ margin: 0, fontWeight: 800 }}>
                    {cert.secondarySignerTitle ||
                      (lang === 'en' ? 'Class Teacher / Asst. Headmaster' : 'শ্রেণি শিক্ষক / সহকারী প্রধান শিক্ষক')}
                  </p>
                  {cert.secondarySignerName && (
                    <p style={{ margin: '1px 0 0', fontSize: '10.5px', color: '#334155' }}>
                      {cert.secondarySignerName}
                    </p>
                  )}
                </div>
              )}

              {/* Right: Principal / Headmaster Signature */}
              <div style={{ textAlign: 'center', minWidth: '190px', fontSize: '11.5px', color: '#0f172a', marginLeft: 'auto' }}>
                <div style={{ borderTop: '1.8px solid #0f172a', width: '180px', margin: '0 auto 5px' }} />
                <p style={{ margin: 0, fontWeight: 900, fontSize: '12.5px', color: '#020617' }}>
                  {principalNameDisplay}
                </p>
                <p style={{ margin: '1px 0 0', fontWeight: 700, fontSize: '11px', color: '#1e293b' }}>
                  {principalRoleDisplay}
                </p>
                <p style={{ margin: '1px 0 0', fontWeight: 600, fontSize: '10.5px', color: '#334155' }}>
                  {schoolNameDisplay}
                </p>
                {schoolAddressDisplay && (
                  <p style={{ margin: '1px 0 0', fontSize: '9.5px', color: '#475569' }}>
                    {schoolAddressDisplay}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media print {
            @page {
              size: A4 portrait;
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. OPTIONAL DIGITAL ORNAMENTAL FRAME STUDIO CANVAS (Portrait / Landscape)
  // ═══════════════════════════════════════════════════════════════════════════
  const sheetWidthMm = isLandscape ? 297 : 210;
  const sheetHeightMm = isLandscape ? 210 : 297;
  const customBorderUrl =
    cert.customBorderUrl ||
    (borderPresetMeta.id === 'custom_png'
      ? safeSettings.customBorderPng || safeSettings.customBorders?.[0]?.url
      : '');
  const stubWidthMm = isLandscape ? 54 : 44;

  return (
    <div className="w-full overflow-x-auto pb-2 flex justify-center print:overflow-visible print:pb-0">
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
              : BENGALI_PAD_FONT_STACK,
        }}
      >
        {/* Left Perforated Office Copy Counterfoil Stub (uses <div> so @media print never hides it!) */}
        {showOfficeStub && (
          <div
            style={{
              width: `${stubWidthMm}mm`,
              minWidth: `${stubWidthMm}mm`,
              borderRight: '1.5px dashed #64748b',
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
              <div
                style={{
                  textAlign: 'center',
                  borderBottom: `1.5px solid ${palette.primary}`,
                  paddingBottom: '6px',
                  marginBottom: '8px',
                }}
              >
                <p style={{ fontWeight: 900, fontSize: '11px', color: palette.primary, letterSpacing: '0.04em', margin: 0 }}>
                  {lang === 'en' ? 'OFFICE COPY' : 'অফিস কপি'}
                </p>
                <p style={{ fontWeight: 700, fontSize: '9.5px', color: '#475569', margin: '2px 0 0' }}>
                  {schoolNameDisplay}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>
                    {lang === 'en' ? 'Cert ID / Serial' : 'সনদ নং'}
                  </span>
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
                  <span style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>
                    {lang === 'en' ? 'Document Type' : 'সনদের ধরন'}
                  </span>
                  <strong>{title}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>
                    {lang === 'en' ? 'Student Name' : 'শিক্ষার্থীর নাম'}
                  </span>
                  <strong>{lang === 'en' ? cert.studentNameEn || cert.studentName : cert.studentName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>
                    {lang === 'en' ? 'Father' : 'পিতা'}
                  </span>
                  <strong>
                    {cleanEntityText(lang === 'en' ? cert.fatherNameEn || cert.fatherName : cert.fatherName) || DOTTED_BLANK}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>
                      {lang === 'en' ? 'Class' : 'শ্রেণি'}
                    </span>
                    <strong>{cert.grade}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>
                      {lang === 'en' ? 'Roll' : 'রোল'}
                    </span>
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
          </div>
        )}

        {/* Main Certificate Area */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingTop: showHeader ? (isLandscape ? '24px' : '28px') : `${padMargins.top}in`,
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
                      safeSettings.estdYear
                        ? `${lang === 'en' ? 'Estd.' : 'স্থাপিত'}: ${localizeNumericText(safeSettings.estdYear, lang)}`
                        : '',
                      safeSettings.eiin ? `EIIN: ${localizeNumericText(safeSettings.eiin, lang)}` : '',
                      safeSettings.phone
                        ? `${lang === 'en' ? 'Phone' : 'ফোন'}: ${localizeNumericText(safeSettings.phone, lang)}`
                        : '',
                    ]
                      .filter(Boolean)
                      .join('  |  ')}
                  </p>
                </div>

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

            {/* Ref & Date Row */}
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

            {/* Document Title */}
            {!hideTitle && (
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
                    borderRadius: titleVariant === 'ribbon' ? '999px' : '4px',
                    backgroundColor: titleVariant === 'ribbon' ? palette.primary : 'transparent',
                    color: titleVariant === 'ribbon' ? palette.titleTextOnRibbon : palette.primary,
                    border: titleVariant === 'boxed' ? `2px solid ${palette.primary}` : undefined,
                    borderBottom:
                      titleVariant === 'underline'
                        ? `2.5px solid ${palette.secondary}`
                        : titleVariant === 'ribbon'
                        ? `2px solid ${palette.secondary}`
                        : undefined,
                    outline: inlineEditable ? `1.5px dashed ${palette.secondary}` : 'none',
                    cursor: inlineEditable ? 'text' : 'default',
                  }}
                >
                  {title}
                </span>
              </div>
            )}

            {/* Body Paragraphs */}
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

          {/* Footer: QR + Optional Secondary Signer + Principal Signature */}
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

            {showSecondarySigner && (
              <div style={{ textAlign: 'center', minWidth: '155px', fontSize: '11.5px', color: '#1e293b' }}>
                <div style={{ borderTop: '1.5px solid #334155', width: '150px', margin: '0 auto 4px' }} />
                <p style={{ margin: 0, fontWeight: 800 }}>
                  {cert.secondarySignerTitle ||
                    (lang === 'en' ? 'Class Teacher / Asst. Headmaster' : 'শ্রেণি শিক্ষক / সহকারী প্রধান শিক্ষক')}
                </p>
                {cert.secondarySignerName && (
                  <p style={{ margin: '1px 0 0', fontSize: '10.5px', color: '#475569' }}>{cert.secondarySignerName}</p>
                )}
              </div>
            )}

            <div style={{ textAlign: 'center', minWidth: '185px', fontSize: '11.5px', color: '#0f172a', marginLeft: 'auto' }}>
              <div style={{ borderTop: `1.8px solid ${palette.primary}`, width: '175px', margin: '0 auto 4px' }} />
              <p style={{ margin: 0, fontWeight: 900, fontSize: '12.5px', color: palette.primary }}>
                {principalNameDisplay}
              </p>
              <p style={{ margin: '1px 0 0', fontWeight: 700, fontSize: '11px', color: '#334155' }}>
                {principalRoleDisplay}
              </p>
              <p style={{ margin: '1px 0 0', fontWeight: 600, fontSize: '10.5px', color: '#475569' }}>
                {schoolNameDisplay}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
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
