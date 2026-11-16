'use client';

import React from 'react';
import { ArrowLeft, Copy, Edit3, Printer } from 'lucide-react';
import { Notice } from '@/services/noticeService';
import { SchoolSettings } from '@/services/settingsService';
import SchoolPadWrapper from '@/components/SchoolPadWrapper';
import { formatNoticeDate } from './noticeHelpers';

export interface NoticePrintSheetViewProps {
  notice: Notice;
  schoolSettings: SchoolSettings;
  printMode: 'full' | 'pad';
  setPrintMode: (m: 'full' | 'pad') => void;
  contentFontSize: number;
  onUpdateFontSize: (size: number) => void;
  showWatermark: boolean;
  setShowWatermark: (v: boolean) => void;
  previewZoom: number;
  onBackToList: () => void;
  onCopyNoticeText: () => void;
  onEditNotice: (notice: Notice) => void;
  onPrint: () => void;
}

export default function NoticePrintSheetView({
  notice,
  schoolSettings,
  printMode,
  setPrintMode,
  contentFontSize,
  onUpdateFontSize,
  showWatermark,
  setShowWatermark,
  previewZoom,
  onBackToList,
  onCopyNoticeText,
  onEditNotice,
  onPrint,
}: NoticePrintSheetViewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={onBackToList}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl font-black text-xs transition cursor-pointer"
            >
              <ArrowLeft size={16} /> নোটিশ তালিকায় ফিরুন
            </button>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPrintMode('full')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  printMode === 'full'
                    ? 'bg-white dark:bg-slate-900 text-indigo-950 dark:text-indigo-200 shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🏫 ফুল হেডারসহ প্রিন্ট
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('pad')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  printMode === 'pad'
                    ? 'bg-white dark:bg-slate-900 text-emerald-950 dark:text-emerald-200 shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="বিদ্যালয়ের নিজস্ব প্রিন্টেড প্যাডের জন্য উপরে ৩ ইঞ্চি ফাঁকা রাখবে"
              >
                📄 প্যাডে প্রিন্ট (উপরে ৩&quot; ফাঁকা)
              </button>
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
              <span className="px-2 text-slate-500 dark:text-slate-400 font-bold text-[11px]">ফন্ট সাইজ:</span>
              {[12, 13, 14, 15, 16].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onUpdateFontSize(size)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    contentFontSize === size
                      ? 'bg-white dark:bg-slate-900 text-indigo-950 dark:text-indigo-200 font-black shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                  title={size === 14 ? 'স্ট্যান্ডার্ড ফন্ট সাইজ (১৪px)' : `${size}px`}
                >
                  {size}px{size === 14 ? ' ★' : ''}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showWatermark}
                onChange={(e) => setShowWatermark(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
              <span>জলছাপ (Watermark)</span>
            </label>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onCopyNoticeText}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl font-black text-xs transition border border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              <Copy size={15} /> টেক্সট কপি
            </button>

            <button
              type="button"
              onClick={() => onEditNotice(notice)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-2xl font-black text-xs transition border border-indigo-200 dark:border-indigo-800/60 cursor-pointer"
            >
              <Edit3 size={15} /> এডিট
            </button>

            <button
              type="button"
              onClick={onPrint}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-xl transition transform active:scale-95 cursor-pointer"
            >
              <Printer size={16} /> A4 প্রিন্ট / PDF সংরক্ষণ
            </button>
          </div>
        </div>
      </div>

      {/* Centered A4 Canvas */}
      <div className="bg-slate-200/80 dark:bg-slate-800/80 p-4 sm:p-8 rounded-3xl flex justify-center overflow-x-auto print:p-0 print:bg-transparent print:rounded-none print:shadow-none print:w-full print:block">
        <div
          style={{
            transform: `scale(${previewZoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-in-out',
          }}
          className="print:transform-none print:w-full"
        >
          <SchoolPadWrapper
            settings={schoolSettings}
            mode={printMode === 'pad' ? 'preprinted' : 'full_pad'}
            refNo={notice.refNo ? `স্মারক নং: ${notice.refNo}` : undefined}
            date={formatNoticeDate(notice.publishedAt)}
            title="বিজ্ঞপ্তি / নোটিশ"
            hideHeaderActions={true}
            signatures={[
              {
                title: notice.publisherName || schoolSettings.principalName || 'মোহাম্মদ রফিকুল ইসলাম',
                designation: notice.publisherRole || schoolSettings.principalTitle || 'প্রধান শিক্ষক',
                institution: schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
                address: schoolSettings.address || 'বরইতলী, চকরিয়া, কক্সবাজার।',
                rightAligned: true,
              },
            ]}
          >
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-black text-slate-950 text-center font-serif leading-snug">
                {notice.title}
              </h3>

              <div
                className="text-slate-950 text-justify whitespace-pre-line leading-relaxed font-normal py-2"
                style={{ fontSize: `${contentFontSize}px`, lineHeight: 1.85 }}
              >
                {notice.content}
              </div>

              <div className="pt-4 text-[10.5px] text-slate-700 space-y-0.5 font-normal">
                <p className="font-bold text-slate-900 underline">অনুলিপি (সদয় অবগতির জন্য প্রেরিত হলো):</p>
                <p>১. নোটিশ বোর্ড / প্রাতিষ্ঠানিক ডিজিটাল পোর্টাল</p>
                <p>২. শিক্ষক মিলনায়তন ও সংশ্লিষ্ট বিভাগ</p>
                <p>৩. অফিস সংরক্ষণ নথি</p>
              </div>
            </div>
          </SchoolPadWrapper>
        </div>
      </div>
    </div>
  );
}
