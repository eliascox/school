'use client';

import React from 'react';
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
  const padMargins = settings?.padMargins || DEFAULT_PAD_MARGINS;
  const padUrl = settings?.uploadedPadTemplateUrl;
  const padType = settings?.uploadedPadType || (padUrl?.includes('application/pdf') || padUrl?.endsWith('.pdf') ? 'pdf' : 'image');

  const formattedDate = date || new Date().toLocaleDateString('bn-BD');
  const formattedRef = refNo || `${settings?.padRefPrefix || 'স্মারক নং: ব.উ.বি/'}২০২৬/${Math.floor(100 + Math.random() * 900)}`;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else if (typeof window !== 'undefined') {
      window.print();
    }
  };

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
                title="আপলোড করা প্যাড ব্যাকগ্রাউন্ড সহ প্রিন্ট হবে"
              >
                ডিজিটাল প্যাড
              </button>
              <button
                type="button"
                onClick={() => onModeChange && onModeChange('preprinted')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  mode === 'preprinted' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
                title="ম্যানুয়েল প্রি-প্রিন্টেড প্যাডে প্রিন্টের জন্য ব্যাকগ্রাউন্ড হাইড হবে (শুধু লেখা প্রিন্ট হবে)"
              >
                প্রি-প্রিন্টেড প্যাড
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
        {mode !== 'preprinted' && padUrl && (
          <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden print:w-[210mm] print:h-[297mm]">
            <img
              src={padUrl}
              alt="Uploaded School Pad"
              className="w-full h-full object-fill pointer-events-none select-none print:w-[210mm] print:h-[297mm]"
              style={{
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            />
          </div>
        )}

        {/* ─── 2. DEFAULT INSTITUTIONAL HEADER IF NO PAD UPLOADED ──────── */}
        {mode !== 'preprinted' && !padUrl && (
          <div 
            className="default-pad-header border-b-2 border-slate-900 pb-3"
            style={{
              paddingTop: `${padMargins.top}in`,
              paddingLeft: `${padMargins.left}in`,
              paddingRight: `${padMargins.right}in`,
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                {settings?.schoolLogo ? (
                  <img src={settings.schoolLogo} alt="Logo" className="w-16 h-16 object-contain" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
                    BHS
                  </div>
                )}
              </div>
              <div className="text-center flex-1 pr-16">
                <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                  {institutionName || settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                </h1>
                <p className="text-xs font-bold text-slate-800">
                  {institutionAddress || settings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার।'}
                </p>
                <p className="text-[11px] text-slate-600">
                  {institutionSubtext || `EIIN: ${settings?.eiin || '106184'} , স্থাপিত: ${settings?.estdYear || '১৯৬৯'} খ্রি.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── 3. MAIN DOCUMENT CONTENT CONTAINER ─────────────────────── */}
        <div 
          className={`relative z-10 flex flex-col ${signaturePosition === 'flow' ? 'justify-start' : 'justify-between'}`}
          style={{
            height: padUrl ? '100%' : 'calc(100% - 110px)',
            minHeight: 'auto',
            boxSizing: 'border-box',
            paddingTop: padUrl ? `${padMargins.top}in` : (!padUrl && mode === 'preprinted' ? `${padMargins.top}in` : '0.5rem'),
            paddingLeft: `${padMargins.left}in`,
            paddingRight: `${padMargins.right}in`,
            paddingBottom: `${padMargins.bottom}in`,
          }}
        >
          <div>
            {/* Smarok / Ref & Date line if available */}
            {mode !== 'blank_pad' && (title || refNo) && (
              <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-3 pb-1 border-b border-slate-300">
                <div>
                  <span>{formattedRef}</span>
                </div>
                <div>
                  <span>{dateLabel || 'তারিখ: '}</span>
                  <span className="font-mono">{formattedDate}</span>
                </div>
              </div>
            )}

            {/* Document Title if specified */}
            {mode !== 'blank_pad' && title && (
              <div className="text-center my-3">
                <h2 className="text-base sm:text-lg font-black text-slate-950 inline-block px-4 py-0.5 border-b-2 border-slate-900 font-serif">
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

          {/* ─── 4. SIGNATURES (if any) ─────────────────────────────────── */}
          {mode !== 'blank_pad' && showSignatures && (
            <div className={signaturePosition === 'flow' ? 'mt-12 sm:mt-16 pt-2' : 'mt-8 pt-4'}>
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
