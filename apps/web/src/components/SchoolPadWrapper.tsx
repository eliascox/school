'use client';

import React, { useState, useEffect } from 'react';
import { SchoolSettings, DEFAULT_PAD_MARGINS } from '@/services/settingsService';
import { Printer, FileText, Sliders, Upload, AlertCircle } from 'lucide-react';

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
  mode = 'full_pad',
  settings,
  signatures,
  showSignatures = true,
  className = '',
  hideHeaderActions = false,
  onPrint,
  onModeChange,
  onOpenSettings,
}: SchoolPadWrapperProps) {
  const [imgLoadError, setImgLoadError] = useState(false);
  const rawPadUrl = settings?.uploadedPadTemplateUrl?.trim() || '';
  const padUrl = imgLoadError ? '' : rawPadUrl;

  const padMargins = settings?.padMargins || DEFAULT_PAD_MARGINS;
  const fontSize = settings?.padFontSize || 14;
  const lineHeight = settings?.padLineHeight || 2.1;
  const signatureGap = settings?.padSignatureGap || 2.5;

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

  const isUploadedPadActive = Boolean(padUrl && !imgLoadError && mode !== 'preprinted');

  return (
    <div className={`school-pad-container ${className}`}>
      {/* ─── ACTION BAR (Screen Only) ────────────────────────────────── */}
      {!hideHeaderActions && (
        <div className="mb-4 bg-slate-900 text-white p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-black rounded-lg flex items-center gap-1.5">
              <FileText size={14} /> লেটারহেড প্যাড
            </span>

            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => onModeChange && onModeChange('full_pad')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  mode === 'full_pad' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
                title="আপলোডকৃত প্রাতিষ্ঠানিক লেটারহেড প্যাড ব্যাকগ্রাউন্ডে থাকবে"
              >
                আপলোডকৃত প্যাড
              </button>
              <button
                type="button"
                onClick={() => onModeChange && onModeChange('preprinted')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  mode === 'preprinted' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
                title="প্রিন্টারে আগে থেকেই ছাপানো প্যাড পেপার থাকলে এই মোড ব্যবহার করুন (হেডার ও ফুটার ফাঁকা থাকবে)"
              >
                ছাপা প্যাড
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-slate-300 font-mono hidden md:inline bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              মার্জিন: উপরে <strong>{padMargins.top}&quot;</strong> | বামে <strong>{padMargins.left}&quot;</strong> | ডানে <strong>{padMargins.right}&quot;</strong> | নিচে <strong>{padMargins.bottom}&quot;</strong>
            </span>

            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                title="প্যাড আপলোড ও লেখার মার্জিন কাস্টমাইজ প্যানেল"
              >
                <Sliders size={14} /> প্যাড ও মার্জিন সেটিংস
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
        {isUploadedPadActive && (
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

        {/* ─── 2. NO PAD UPLOADED PROMPT (SCREEN ONLY, IF EMPTY) ──────── */}
        {!isUploadedPadActive && mode !== 'preprinted' && (
          <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl text-amber-900 text-xs text-center space-y-2 print:hidden m-6 shadow-sm">
            <div className="flex items-center justify-center gap-2 font-black text-sm text-amber-950">
              <AlertCircle size={18} className="text-amber-600" />
              আপনার প্রতিষ্ঠানের নিজস্ব প্যাড আপলোড করুন
            </div>
            <p className="text-[11px] text-amber-800 max-w-lg mx-auto leading-relaxed">
              সিস্টেম জেনারেট করা ডামি প্যাড বন্ধ করা হয়েছে। আপনার প্রতিষ্ঠানের তৈরি করা অফিশিয়াল লেটারহেড প্যাড (PDF বা ছবি) আপলোড করলে তা স্বয়ংক্রিয়ভাবে ব্যাকগ্রাউন্ডে চলে আসবে।
            </p>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Upload size={14} /> নিজস্ব প্যাড আপলোড ও মার্জিন সেট করুন
              </button>
            )}
          </div>
        )}

        {/* ─── 3. MAIN DOCUMENT CONTENT CONTAINER ─────────────────────── */}
        <div
          className="relative z-10 flex flex-col justify-start"
          style={{
            minHeight: 'auto',
            boxSizing: 'border-box',
            paddingTop: `${padMargins.top}in`,
            paddingLeft: `${padMargins.left}in`,
            paddingRight: `${padMargins.right}in`,
            paddingBottom: `${padMargins.bottom}in`,
          }}
        >
          {/* Smarok / Ref & Date line */}
          {mode !== 'blank_pad' && (title || refNo) && (
            <div className="flex justify-between items-end text-xs font-bold text-slate-900 mb-4 pb-1 border-b border-dotted border-slate-400">
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

          {/* Document Title if specified - prominent & bold */}
          {title && (
            <div className="text-center my-4 print:my-3">
              <span className="inline-block px-10 py-1.5 border-2 border-slate-950 rounded-sm font-serif font-black text-xl sm:text-2xl text-slate-950 tracking-wider shadow-xs bg-slate-100/70">
                {title}
              </span>
            </div>
          )}

          {/* Document Content */}
          <div
            className="school-pad-body my-2"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
            }}
          >
            {children}
          </div>

          {/* ─── 4. PRINCIPAL SIGNATURE (AUTO-SCALING FLOW AFTER TEXT) ── */}
          {mode !== 'blank_pad' && showSignatures && (
            <div
              className="pt-2 select-none"
              style={{
                marginTop: `${signatureGap}rem`,
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
              }}
            >
              {signatures && signatures.length > 0 ? (
                <div
                  className={`flex ${
                    signatures.length === 1 && signatures[0].rightAligned ? 'justify-end' : 'justify-between'
                  } items-end text-center text-xs font-bold text-slate-900`}
                >
                  {signatures.map((sig, idx) => (
                    <div key={idx} className={`space-y-0.5 text-center min-w-[210px] ${sig.rightAligned ? 'ml-auto' : ''}`}>
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
                <div className="flex justify-end text-center text-xs font-bold text-slate-900">
                  <div className="space-y-0.5 ml-auto text-center min-w-[210px]">
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
