'use client';

import React, { useState, useEffect } from 'react';
import { SchoolSettings, DEFAULT_PAD_MARGINS } from '@/services/settingsService';
import { Printer, FileText, Upload, Sparkles } from 'lucide-react';

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
}

export default function SchoolPadWrapper({
  children,
  title,
  refNo,
  date,
  dateLabel,
  institutionName,
  institutionAddress,
  institutionSubtext,
  mode = 'full_pad',
  settings,
  signatures,
  showSignatures = true,
  className = '',
  hideHeaderActions = false,
  signaturePosition = 'bottom',
  onPrint,
  onModeChange,
}: SchoolPadWrapperProps) {
  const [imgLoadError, setImgLoadError] = useState(false);
  const rawPadUrl = settings?.uploadedPadTemplateUrl?.trim() || '';
  const padUrl = imgLoadError ? '' : rawPadUrl;
  const padType = settings?.uploadedPadType || (rawPadUrl.includes('application/pdf') || rawPadUrl.endsWith('.pdf') ? 'pdf' : 'image');

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

  const isCustomPadActive = Boolean(padUrl && !imgLoadError && mode !== 'preprinted');

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
                title="সম্পূর্ণ ডিজিটাল লেটারহেড প্যাড সহ প্রিন্ট হবে"
              >
                ডিজিটাল প্যাড
              </button>
              <button
                type="button"
                onClick={() => onModeChange && onModeChange('preprinted')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  mode === 'preprinted' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
                title="ম্যানুয়েল ছাপা প্যাডে প্রিন্টের জন্য হেডার স্পেস ফাঁকা থাকবে"
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

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-300 font-mono hidden sm:inline bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              মার্জিন: উপরে <strong>{padMargins.top}&quot;</strong> | বামে <strong>{padMargins.left}&quot;</strong> | ডানে <strong>{padMargins.right}&quot;</strong> | নিচে <strong>{padMargins.bottom}&quot;</strong>
            </span>

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
          fontFamily: "'Hind Siliguri', 'Kalpurush', 'SolaimanLipi', 'Nikosh', sans-serif"
        }}
      >
        {/* ─── 1. UPLOADED PDF / IMAGE PAD TEMPLATE BACKGROUND ─────────── */}
        {isCustomPadActive && (
          <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden print:w-[210mm] print:h-[297mm]">
            {padType === 'pdf' ? (
              <object
                data={padUrl}
                type="application/pdf"
                className="w-full h-full pointer-events-none select-none print:w-[210mm] print:h-[297mm]"
              >
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
              </object>
            ) : (
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
            )}
          </div>
        )}

        {/* ─── 2. DEFAULT INSTITUTIONAL HEADER IF NO PAD UPLOADED ──────── */}
        {mode !== 'preprinted' && !isCustomPadActive && (
          <div 
            className="default-pad-header relative z-10"
            style={{
              paddingTop: `${padMargins.top}in`,
              paddingLeft: `${padMargins.left}in`,
              paddingRight: `${padMargins.right}in`,
            }}
          >
            {/* Optional Slogan / Bismillah on Top */}
            {(settings?.padSlogan || 'বিসমিল্লাহির রাহমানির রাহিম') && (
              <div className="text-center text-[10px] text-slate-600 font-serif mb-1 tracking-wider">
                {settings?.padSlogan || 'বিসমিল্লাহির রাহমানির রাহিম'}
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              {/* Left Column: Primary Monogram / Logo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
                {settings?.schoolLogo ? (
                  <img
                    src={settings.schoolLogo}
                    alt="Logo"
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent && !parent.querySelector('.logo-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'logo-fallback w-16 h-16 rounded-full bg-emerald-800 text-white flex items-center justify-center font-black text-sm shadow-md';
                        fallback.innerText = 'BHS';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-emerald-800 text-white flex items-center justify-center font-black text-sm shadow-md">
                    BHS
                  </div>
                )}
              </div>

              {/* Center Column: School Name, Address, EIIN, Code, Estd */}
              <div className="text-center flex-1 min-w-0 px-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-serif tracking-tight leading-tight uppercase">
                  {institutionName || settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                </h1>
                <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                  {institutionAddress || settings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার।'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[11px] font-medium text-slate-700 mt-0.5">
                  <span>EIIN: <strong className="font-mono text-slate-900">{settings?.eiin || '106184'}</strong></span>
                  <span>•</span>
                  <span>বিদ্যালয় কোড: <strong className="font-mono text-slate-900">৩২০১</strong></span>
                  <span>•</span>
                  <span>স্থাপিত: <strong className="font-mono text-slate-900">{settings?.estdYear || '১৯৬৯'}</strong> খ্রি.</span>
                </div>
                {(settings?.phone || settings?.email) && (
                  <p className="text-[10px] text-slate-600 mt-0.5 font-mono">
                    {settings?.phone ? `মোবাইল: ${settings.phone}` : ''}
                    {settings?.phone && settings?.email ? ' | ' : ''}
                    {settings?.email ? `ইমেইল: ${settings.email}` : ''}
                  </p>
                )}
              </div>

              {/* Right Column: Secondary Logo or Exact Balance Spacer */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
                {settings?.padSecondaryLogo ? (
                  <img
                    src={settings.padSecondaryLogo}
                    alt="Secondary Logo"
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 opacity-0 pointer-events-none select-none" aria-hidden="true" />
                )}
              </div>
            </div>

            {/* Official Double Rule Bottom Divider */}
            <div className="mt-2.5 border-b-2 border-slate-900"></div>
            <div className="mt-0.5 border-b border-slate-700"></div>
          </div>
        )}

        {/* ─── 3. WATERMARK (Subtle Institutional Logo / Text) ────────── */}
        {mode !== 'blank_pad' && (settings?.showPadWatermark || settings?.showWatermark) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
            <div 
              className="text-center transform -rotate-12"
              style={{ opacity: settings?.padWatermarkOpacity || settings?.watermarkOpacity || 0.035 }}
            >
              {settings?.schoolLogo ? (
                <img
                  src={settings.schoolLogo}
                  alt=""
                  className="w-72 h-72 sm:w-96 sm:h-96 object-contain grayscale mx-auto"
                />
              ) : (
                <div className="text-5xl sm:text-6xl font-black text-slate-950 uppercase tracking-widest">
                  {settings?.padWatermarkText || settings?.watermarkText || settings?.schoolName || 'BORATOLI HIGH SCHOOL'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── 4. OFFICIAL PAD FOOTER (Bottom of A4 Sheet) ─────────────── */}
        {mode !== 'preprinted' && !isCustomPadActive && settings?.showPadFooter !== false && (
          <div 
            className="absolute bottom-3 inset-x-0 z-10 pointer-events-none text-center"
            style={{
              paddingLeft: `${padMargins.left}in`,
              paddingRight: `${padMargins.right}in`,
            }}
          >
            <div className="border-t border-slate-300 pt-1 flex items-center justify-between text-[10px] text-slate-500 font-sans">
              <span>{settings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার।'}</span>
              <span className="font-medium text-slate-600">
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
            height: isCustomPadActive ? '100%' : 'calc(100% - 135px)',
            minHeight: 'auto',
            boxSizing: 'border-box',
            paddingTop: isCustomPadActive
              ? `${padMargins.top > 0.8 ? padMargins.top : 1.8}in`
              : (mode === 'preprinted'
                ? `${padMargins.top > 0.8 ? padMargins.top : 1.8}in`
                : '0.4rem'),
            paddingLeft: `${padMargins.left}in`,
            paddingRight: `${padMargins.right}in`,
            paddingBottom: `${padMargins.bottom}in`,
          }}
        >
          <div>
            {/* Smarok / Ref & Date line if available */}
            {mode !== 'blank_pad' && (title || refNo) && (
              <div className="flex justify-between items-center text-xs font-bold text-slate-900 mb-3 pb-1.5 border-b border-slate-300">
                <div>
                  <span className="font-semibold text-slate-800">{formattedRef}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">
                    {dateLabel ? (dateLabel.endsWith(':') ? dateLabel : `${dateLabel}: `) : 'তারিখ: '}
                  </span>
                  <span className="font-mono font-bold text-slate-950">{formattedDate}</span>
                </div>
              </div>
            )}

            {/* Document Title if specified */}
            {mode !== 'blank_pad' && title && (
              <div className="text-center my-3">
                <h2 className="text-base sm:text-lg font-black text-slate-950 inline-block px-5 py-0.5 border-b-2 border-slate-900 font-serif tracking-wide">
                  {title}
                </h2>
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

          {/* ─── 6. SIGNATURES (if any) ─────────────────────────────────── */}
          {mode !== 'blank_pad' && showSignatures && (
            <div className={signaturePosition === 'flow' ? 'mt-8 sm:mt-12 pt-2' : 'mt-8 pt-4'}>
              {signatures && signatures.length > 0 ? (
                <div className={`pt-4 pb-2 flex ${signatures.length === 1 && signatures[0].rightAligned ? 'justify-end' : 'justify-between'} items-end text-center text-xs font-bold text-slate-900`}>
                  {signatures.map((sig, idx) => (
                    <div key={idx} className={`space-y-0.5 text-center ${sig.rightAligned ? 'ml-auto' : ''}`}>
                      <div className="w-52 border-b border-slate-900 mx-auto mb-1.5"></div>
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
                    <div className="w-52 border-b border-slate-900 mx-auto mb-1.5"></div>
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
