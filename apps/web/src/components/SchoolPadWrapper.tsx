'use client';

import React, { useState, useEffect } from 'react';
import { SchoolSettings, DEFAULT_PAD_MARGINS } from '@/services/settingsService';
import { Printer, FileText, Sliders, Sparkles, CheckCircle2, Shield } from 'lucide-react';

export interface SignatureItem {
  title: string;
  designation?: string;
  institution?: string;
  address?: string;
  subtitle?: string;
  date?: string;
  rightAligned?: boolean;
}

export interface SchoolPadWrapperProps {
  children?: React.ReactNode;
  title?: string;
  refNo?: string;
  date?: string;
  dateLabel?: string;
  institutionName?: string;
  institutionAddress?: string;
  institutionSubtext?: string;
  mode?: 'full_pad' | 'preprinted' | 'blank_pad';
  settings?: SchoolSettings;
  signatures?: SignatureItem[];
  showSignatures?: boolean;
  className?: string;
  hideHeaderActions?: boolean;
  signaturePosition?: 'bottom' | 'flow';
  onPrint?: () => void;
  onModeChange?: (mode: 'full_pad' | 'preprinted' | 'blank_pad') => void;
  onOpenSettings?: () => void;
}

export default function SchoolPadWrapper({
  children,
  title,
  refNo,
  date,
  dateLabel,
  institutionName,
  institutionAddress,
  mode = 'full_pad',
  settings,
  signatures,
  showSignatures = true,
  className = '',
  hideHeaderActions = false,
  signaturePosition = 'bottom',
  onPrint,
  onModeChange,
  onOpenSettings,
}: SchoolPadWrapperProps) {
  const [imgLoadError, setImgLoadError] = useState(false);
  const rawPadUrl = settings?.uploadedPadTemplateUrl?.trim() || '';
  const padUrl = imgLoadError ? '' : rawPadUrl;

  const padMargins = settings?.padMargins || DEFAULT_PAD_MARGINS;

  useEffect(() => {
    setImgLoadError(false);
  }, [rawPadUrl]);

  const formattedDate = date || new Date().toLocaleDateString('bn-BD');
  const formattedRef = refNo || `${settings?.padRefPrefix || 'স্মারক নং: ব.উ.বি/'}২০২৬/${Math.floor(100 + Math.random() * 900)}`;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Determine whether to use Custom Uploaded Pad
  // If activePadMode is 'system', teacher explicitly chose the system-generated pad
  const wantsUploadedPad = settings?.activePadMode === 'uploaded' || (!settings?.activePadMode && Boolean(padUrl));
  const isCustomPadActive = Boolean(padUrl && !imgLoadError && mode !== 'preprinted' && wantsUploadedPad);

  const themeColor = settings?.padThemeColor || '#064e3b'; // Default Forest Emerald or Navy

  return (
    <div className={`school-pad-container ${className}`}>
      {/* ─── ACTION BAR (Screen Only) ────────────────────────────────── */}
      {!hideHeaderActions && (
        <div className="mb-4 bg-slate-900 text-white p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-black rounded-lg flex items-center gap-1.5">
              <FileText size={14} /> স্কুল প্যাড প্রিন্ট মোড
            </span>

            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => onModeChange && onModeChange('full_pad')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  mode === 'full_pad' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
                title={isCustomPadActive ? 'আপলোডকৃত পিডিএফ/ছবি প্যাড ব্যাকগ্রাউন্ড সহ প্রিন্ট হবে' : 'সিস্টেম জেনারেট করা প্রিমিয়াম প্যাড সহ প্রিন্ট হবে'}
              >
                {isCustomPadActive ? 'আপলোডকৃত প্যাড' : 'ডিজিটাল প্যাড'}
              </button>
              <button
                type="button"
                onClick={() => onModeChange && onModeChange('preprinted')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  mode === 'preprinted' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
                title="ম্যানুয়েল ছাপা প্যাডে প্রিন্টের জন্য হেডার ও ফুটার ফাঁকা থাকবে"
              >
                ছাপা প্যাড
              </button>
              <button
                type="button"
                onClick={() => onModeChange && onModeChange('blank_pad')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  mode === 'blank_pad' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
                title="শুধু ফাঁকা প্যাড প্রিন্ট করুন"
              >
                ব্লাংক প্যাড
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="প্যাড আপলোড ও মার্জিন সেটিংস প্যানেল খুলুন"
              >
                <Sliders size={14} /> প্যাড সেটিংস ও মার্জিন
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Printer size={15} /> প্রিন্ট করুন
            </button>
          </div>
        </div>
      )}

      {/* ─── PRINTABLE A4 PAD SHEET ───────────────────────────────────── */}
      <div
        className="school-pad-sheet bg-white text-slate-950 shadow-2xl rounded-sm mx-auto relative overflow-hidden print:shadow-none print:m-0 print:w-[210mm] print:h-[297mm] print:max-h-[297mm] print:rounded-none"
        style={{
          width: '100%',
          maxWidth: '210mm',
          minHeight: '297mm',
          height: '297mm',
          boxSizing: 'border-box',
          fontFamily: "'Kalpurush', 'SolaimanLipi', 'Nikosh', 'Hind Siliguri', 'Times New Roman', serif",
        }}
      >
        {/* ─── 1. UPLOADED PDF / IMAGE PAD TEMPLATE BACKGROUND ─────────── */}
        {isCustomPadActive && (
          <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden print:w-[210mm] print:h-[297mm]">
            <img
              src={padUrl}
              alt="Uploaded School Pad"
              onError={() => setImgLoadError(true)}
              className="w-full h-full object-fill pointer-events-none select-none print:w-[210mm] print:h-[297mm]"
              style={{
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            />
          </div>
        )}

        {/* ─── 2. REVAMPED PRESTIGIOUS SYSTEM-GENERATED INSTITUTIONAL PAD ── */}
        {mode !== 'preprinted' && !isCustomPadActive && (
          <div
            className="default-pad-header relative z-10"
            style={{
              paddingTop: `${padMargins.top}in`,
              paddingLeft: `${padMargins.left}in`,
              paddingRight: `${padMargins.right}in`,
            }}
          >
            {/* 2A. Top Invocation / Bismillah */}
            {(settings?.padSlogan || 'বিসমিল্লাহির রাহমানির রাহিম') && (
              <div className="text-center mb-1 text-[11px] font-serif text-slate-700 tracking-wider flex items-center justify-center gap-3">
                <span className="h-[1px] w-14 bg-gradient-to-r from-transparent via-slate-400 to-slate-600"></span>
                <span className="font-medium">{settings?.padSlogan || 'বিসমিল্লাহির রাহমানির রাহিম'}</span>
                <span className="h-[1px] w-14 bg-gradient-to-l from-transparent via-slate-400 to-slate-600"></span>
              </div>
            )}

            {/* 2B. Main Header Symmetrical Grid */}
            <div className="flex items-center justify-between gap-3">
              {/* Left Column: Primary Crest / Monogram */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
                {settings?.schoolLogo ? (
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-2 border-slate-900 p-0.5 bg-white shadow-xs flex items-center justify-center">
                    <img
                      src={settings.schoolLogo}
                      alt="Logo"
                      className="w-full h-full object-contain rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent && !parent.querySelector('.logo-fallback')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'logo-fallback w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-md';
                          fallback.innerText = 'BHS';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-2 border-slate-900 bg-slate-900 text-white flex flex-col items-center justify-center font-black text-xs shadow-md">
                    <span>ESTD</span>
                    <span className="text-[11px]">{settings?.estdYear || '১৯৬৯'}</span>
                  </div>
                )}
              </div>

              {/* Center Column: Institution Name, Affiliation, Codes, Address */}
              <div className="text-center flex-1 min-w-0 px-2 space-y-0.5">
                {/* Government / Board Recognition Line */}
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-700 tracking-wide">
                  {settings?.padAffiliationText || 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত ও শিক্ষা বোর্ড অধিভুক্ত'}
                </p>

                {/* Primary Bengali School Name */}
                <h1
                  className="text-2xl sm:text-[27px] font-black tracking-normal leading-tight font-serif"
                  style={{ color: themeColor }}
                >
                  {institutionName || settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                </h1>

                {/* English School Name (Crisp Serif Small-Caps) */}
                <p className="text-[11px] sm:text-xs font-bold tracking-widest text-slate-800 uppercase font-serif">
                  {settings?.schoolNameEn || 'BORAITOLI HIGH SCHOOL'}
                </p>

                {/* Official Identity Credentials Badges */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-800 pt-0.5">
                  <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-300">
                    ইআইআইএন (EIIN): <strong className="font-mono text-slate-950 font-bold">{settings?.eiin || '106184'}</strong>
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-300">
                    বিদ্যালয় কোড: <strong className="font-mono text-slate-950 font-bold">৩২০১</strong>
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-300">
                    স্থাপিত: <strong className="font-mono text-slate-950 font-bold">{settings?.estdYear || '১৯৬৯'}</strong> খ্রি.
                  </span>
                </div>

                {/* Address & Digital Helpline */}
                <p className="text-[10px] text-slate-800 font-medium pt-0.5">
                  {institutionAddress || settings?.address || 'ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার।'}
                </p>
                {(settings?.phone || settings?.email) && (
                  <p className="text-[9.5px] text-slate-600 font-mono">
                    {settings?.phone ? `মোবাইল: ${settings.phone}` : ''}
                    {settings?.phone && settings?.email ? ' | ' : ''}
                    {settings?.email ? `ইমেইল: ${settings.email}` : ''}
                  </p>
                )}
              </div>

              {/* Right Column: Secondary Logo or Government Emblem Balance */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
                {settings?.padSecondaryLogo ? (
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-2 border-slate-900 p-0.5 bg-white shadow-xs flex items-center justify-center">
                    <img
                      src={settings.padSecondaryLogo}
                      alt="Secondary Logo"
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-2 border-dashed border-slate-400 p-1 flex flex-col items-center justify-center text-center text-slate-600">
                    <Shield size={24} className="text-slate-700" />
                    <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5">OFFICIAL SEAL</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2C. Prestigious Institutional Multi-tier Divider */}
            <div className="mt-2.5 relative flex items-center justify-center">
              <div className="w-full border-b-[2.5px] border-slate-900"></div>
              <span className="absolute bg-white px-2 text-[10px] text-slate-800 font-serif">✦</span>
            </div>
            <div className="mt-0.5 border-b border-slate-500"></div>
          </div>
        )}

        {/* ─── 3. FAINT INSTITUTIONAL WATERMARK ─────────────────────────── */}
        {mode !== 'blank_pad' && !isCustomPadActive && (settings?.showPadWatermark || settings?.showWatermark) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
            <div
              className="text-center"
              style={{ opacity: settings?.padWatermarkOpacity || settings?.watermarkOpacity || 0.038 }}
            >
              {settings?.schoolLogo ? (
                <img
                  src={settings.schoolLogo}
                  alt=""
                  className="w-80 h-80 sm:w-96 sm:h-96 object-contain grayscale mx-auto"
                />
              ) : (
                <div className="text-5xl sm:text-6xl font-black text-slate-950 uppercase tracking-widest font-serif">
                  {settings?.padWatermarkText || settings?.watermarkText || settings?.schoolName || 'BORATOLI HIGH SCHOOL'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── 4. OFFICIAL INSTITUTIONAL FOOTER ─────────────────────────── */}
        {mode !== 'preprinted' && !isCustomPadActive && settings?.showPadFooter !== false && (
          <div
            className="absolute bottom-2.5 inset-x-0 z-10 pointer-events-none text-center"
            style={{
              paddingLeft: `${padMargins.left}in`,
              paddingRight: `${padMargins.right}in`,
            }}
          >
            {/* Motto Ribbon */}
            <p className="text-[10px] text-slate-700 font-serif font-semibold italic mb-1">
              &ldquo;{settings?.padSlogan || 'শিক্ষাই জাতির মেরুদণ্ড — চরিত্রই মানব জীবনের শ্রেষ্ঠ সম্পদ'}&rdquo;
            </p>
            <div className="border-t border-slate-400 pt-1 flex items-center justify-between text-[9.5px] text-slate-600 font-sans">
              <span>{settings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার।'}</span>
              <span className="font-semibold text-slate-800 font-mono">
                {settings?.padFooterText || (settings?.website ? settings.website : 'www.boroitolihs.edu.bd')}
              </span>
              <span>ইমেইল: {settings?.email || 'boroitoli.high.school@gmail.com'}</span>
            </div>
          </div>
        )}

        {/* ─── 5. MAIN DOCUMENT CONTENT CONTAINER ─────────────────────── */}
        <div
          className={`relative z-10 flex flex-col ${signaturePosition === 'flow' ? 'justify-start' : 'justify-between'}`}
          style={{
            height: isCustomPadActive ? '100%' : 'calc(100% - 145px)',
            minHeight: 'auto',
            boxSizing: 'border-box',
            paddingTop: isCustomPadActive
              ? `${padMargins.top}in`
              : mode === 'preprinted'
              ? `${padMargins.top}in`
              : '0.4rem',
            paddingLeft: `${padMargins.left}in`,
            paddingRight: `${padMargins.right}in`,
            paddingBottom: `${padMargins.bottom}in`,
          }}
        >
          <div>
            {/* Smarok / Ref & Date line */}
            {mode !== 'blank_pad' && (title || refNo) && (
              <div className="flex justify-between items-end text-xs font-bold text-slate-900 mb-3 pb-1 border-b border-dotted border-slate-400">
                <div>
                  <span className="font-bold text-slate-800">স্মারক নং: </span>
                  <span className="font-mono font-bold text-slate-950">{formattedRef}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800">
                    {dateLabel ? (dateLabel.endsWith(':') ? dateLabel : `${dateLabel}: `) : 'তারিখ: '}
                  </span>
                  <span className="font-mono font-bold text-slate-950">{formattedDate} খ্রি.</span>
                </div>
              </div>
            )}

            {/* Document Title if specified */}
            {mode !== 'blank_pad' && title && (
              <div className="text-center my-3">
                <span className="inline-block px-8 py-1 border-2 border-slate-900 rounded-sm font-serif font-black text-base sm:text-lg text-slate-950 tracking-wider shadow-xs bg-slate-50/50">
                  {title}
                </span>
              </div>
            )}

            {/* Document Content or Blank Space */}
            {mode === 'blank_pad' ? (
              <div className="py-20 text-center text-slate-400 select-none print:hidden">
                <span className="text-xs font-mono bg-slate-100/80 px-4 py-1.5 rounded-full border border-dashed border-slate-300">
                  [ফাঁকা স্কুল প্যাড প্রিন্ট মোড - টেক্সট এরিয়া খালি থাকবে]
                </span>
              </div>
            ) : (
              <div className="school-pad-body my-2">
                {children}
              </div>
            )}
          </div>

          {/* ─── 6. SIGNATURES (4-LINE PRINCIPAL DESIGNATION) ────────────── */}
          {mode !== 'blank_pad' && showSignatures && (
            <div className={signaturePosition === 'flow' ? 'mt-8 sm:mt-12 pt-2' : 'mt-8 pt-4'}>
              {signatures && signatures.length > 0 ? (
                <div
                  className={`pt-4 pb-2 flex ${
                    signatures.length === 1 && signatures[0].rightAligned ? 'justify-end' : 'justify-between'
                  } items-end text-center text-xs font-bold text-slate-900`}
                >
                  {signatures.map((sig, idx) => (
                    <div key={idx} className={`space-y-0.5 text-center ${sig.rightAligned ? 'ml-auto' : ''}`}>
                      <div className="w-52 border-b-2 border-slate-900 mx-auto mb-1.5"></div>
                      <p className="font-black text-slate-950 text-xs sm:text-sm">{sig.title}</p>
                      {sig.designation && <p className="text-[11px] text-slate-800 font-bold">{sig.designation}</p>}
                      {sig.institution && <p className="text-[11px] text-slate-700 font-semibold">{sig.institution}</p>}
                      {sig.address && <p className="text-[10px] text-slate-600">{sig.address}</p>}
                      {!sig.designation && sig.subtitle && <p className="text-[11px] text-slate-700 font-bold">{sig.subtitle}</p>}
                      {sig.date && <p className="text-[10px] text-slate-500 font-normal">তারিখ: {sig.date}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-4 pb-2 flex justify-end text-center text-xs font-bold text-slate-900">
                  <div className="space-y-0.5 ml-auto text-center">
                    <div className="w-52 border-b-2 border-slate-900 mx-auto mb-1.5"></div>
                    <p className="font-black text-slate-950 text-xs sm:text-sm">
                      {settings?.principalName || 'মোহাম্মদ রফিকুল ইসলাম'}
                    </p>
                    <p className="text-[11px] text-slate-800 font-bold">
                      {settings?.principalTitle || 'প্রধান শিক্ষক'}
                    </p>
                    <p className="text-[11px] text-slate-700 font-semibold">
                      {settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      {settings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার।'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
