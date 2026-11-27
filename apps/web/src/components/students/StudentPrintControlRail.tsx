'use client';

import React from 'react';
import {
  Columns3,
  Globe,
  LayoutList,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { toBanglaDigits } from '@/lib/omr/omrTemplates';
import {
  STUDENT_PRINT_COLUMNS_META,
  STUDENT_PRINT_PRESETS,
  type StudentPrintColumnKey,
  type StudentPrintFilters,
  type StudentPrintLang,
  type StudentPrintMargin,
  type StudentPrintOrientation,
  type StudentPrintPresetId,
  type StudentPrintReportType,
} from '@/lib/studentPrintUtils';

const GRADE_PILLS = [
  { id: 'all', labelBn: 'সকল' },
  { id: '6th', labelBn: '৬ষ্ঠ' },
  { id: '7th', labelBn: '৭ম' },
  { id: '8th', labelBn: '৮ম' },
  { id: '9th', labelBn: '৯ম' },
  { id: '10th', labelBn: '১০ম' },
] as const;

export interface StudentPrintControlRailProps {
  activePreset: StudentPrintPresetId | 'custom';
  onApplyPreset: (preset: StudentPrintPresetId) => void;
  reportType: StudentPrintReportType;
  filters: StudentPrintFilters;
  onUpdateFilters: (patch: Partial<StudentPrintFilters>) => void;
  gradeCounts: Record<string, number>;
  totalStudentCount: number;
  docLang: StudentPrintLang;
  onDocLangChange: (l: StudentPrintLang) => void;
  orientation: StudentPrintOrientation;
  onOrientationChange: (o: StudentPrintOrientation) => void;
  marginPreset: StudentPrintMargin;
  onMarginChange: (m: StudentPrintMargin) => void;
  rowsPerPage: number;
  onRowsPerPageChange: (n: number) => void;
  year: string;
  onYearChange: (y: string) => void;
  activeCols: Record<StudentPrintColumnKey, boolean>;
  onToggleColumn: (key: StudentPrintColumnKey) => void;
  onCloseMobileDrawer?: () => void;
}

export function StudentPrintControlRail({
  activePreset,
  onApplyPreset,
  reportType,
  filters,
  onUpdateFilters,
  gradeCounts,
  totalStudentCount,
  docLang,
  onDocLangChange,
  orientation,
  onOrientationChange,
  marginPreset,
  onMarginChange,
  rowsPerPage,
  onRowsPerPageChange,
  year,
  onYearChange,
  activeCols,
  onToggleColumn,
  onCloseMobileDrawer,
}: StudentPrintControlRailProps) {
  const activeColCount = Object.values(activeCols).filter(Boolean).length;

  return (
    <aside className="w-full lg:w-[316px] shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
      {/* Rail Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/60">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#0B5D3B]/10 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <SlidersHorizontal size={15} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-black text-slate-900 dark:text-white truncate">
              শিক্ষার্থী রেজিস্টার প্রিন্ট স্টুডিও
            </h2>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              ৪টি প্রিসেট, কলাম, ভাষা ও এক্সেল
            </p>
          </div>
        </div>
        {onCloseMobileDrawer && (
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Rail Body */}
      <div className="p-3.5 space-y-4 text-xs overflow-y-auto max-h-[calc(100vh-140px)]">
        {/* 1. 4 Official Register Presets */}
        <div className="space-y-1.5">
          <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1">
            <LayoutList size={12} className="text-[#0B5D3B]" />
            ১. অফিশিয়াল রেজিস্টার প্রিসেট
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(STUDENT_PRINT_PRESETS) as StudentPrintPresetId[]).map((pid) => {
              const p = STUDENT_PRINT_PRESETS[pid];
              const active = activePreset === pid;
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => onApplyPreset(pid)}
                  className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-[#0B5D3B] ring-1 ring-[#0B5D3B]/30'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                  }`}
                >
                  <div
                    className={`text-[11px] font-black leading-tight ${
                      active ? 'text-[#0B5D3B] dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {p.labelBn}
                  </div>
                  <div className="text-[9px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {p.shortDescBn}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Class Pills with Live Counts */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            ২. শ্রেণি নির্বাচন
          </label>
          <div className="grid grid-cols-6 gap-1">
            {GRADE_PILLS.map((g) => {
              const active = filters.grade === g.id;
              const cnt = g.id === 'all' ? totalStudentCount : gradeCounts[g.id] || 0;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onUpdateFilters({ grade: g.id })}
                  className={`py-1.5 px-0.5 rounded-xl border text-center transition cursor-pointer ${
                    active
                      ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                  }`}
                >
                  <div className="text-[10.5px] font-black leading-tight">{g.labelBn}</div>
                  <div
                    className={`text-[9px] font-bold mt-0.5 ${
                      active ? 'text-emerald-100' : cnt > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {toBanglaDigits(cnt)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Filter Dropdowns & Search */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={filters.group}
              onChange={(e) => onUpdateFilters({ group: e.target.value })}
              aria-label="বিভাগ ফিল্টার"
              className="px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">সকল বিভাগ</option>
              <option value="সাধারণ">সাধারণ</option>
              <option value="বিজ্ঞান">বিজ্ঞান</option>
              <option value="মানবিক">মানবিক</option>
              <option value="ব্যবসায় শিক্ষা">ব্যবসায় শিক্ষা</option>
            </select>
            <select
              value={filters.gender}
              onChange={(e) => onUpdateFilters({ gender: e.target.value })}
              aria-label="লিঙ্গ ফিল্টার"
              className="px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">ছাত্র ও ছাত্রী</option>
              <option value="পুরুষ">শুধু ছাত্র</option>
              <option value="মহিলা">শুধু ছাত্রী</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={filters.religion}
              onChange={(e) => onUpdateFilters({ religion: e.target.value })}
              aria-label="ধর্ম ফিল্টার"
              className="px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">সকল ধর্ম</option>
              <option value="ইসলাম">ইসলাম</option>
              <option value="হিন্দু">হিন্দু</option>
              <option value="বৌদ্ধ">বৌদ্ধ</option>
              <option value="খ্রিস্টান">খ্রিস্টান</option>
            </select>
            <select
              value={filters.stipend}
              onChange={(e) => onUpdateFilters({ stipend: e.target.value })}
              aria-label="উপবৃত্তি ফিল্টার"
              className="px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">সকল (উপবৃত্তি)</option>
              <option value="stipend_only">শুধু উপবৃত্তিপ্রাপ্ত</option>
            </select>
          </div>

          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={filters.q}
              onChange={(e) => onUpdateFilters({ q: e.target.value })}
              placeholder="নাম, রোল, মোবাইল বা অভিভাবক..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        {/* 4. Language & Page Settings */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-3 space-y-1">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Globe size={11} className="text-indigo-500" />
                প্রিন্ট ভাষা (একক)
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onDocLangChange('bn')}
                  className={`py-1.5 rounded-lg text-[11px] font-black cursor-pointer transition ${
                    docLang === 'bn'
                      ? 'bg-[#0B5D3B] text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => onDocLangChange('en')}
                  className={`py-1.5 rounded-lg text-[11px] font-black cursor-pointer transition ${
                    docLang === 'en'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 block">
                শিক্ষাবর্ষ
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => onYearChange(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-black text-center text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onOrientationChange('portrait')}
              className={`py-1.5 rounded-lg text-[11px] font-black cursor-pointer transition ${
                orientation === 'portrait'
                  ? 'bg-amber-400 text-slate-950 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              পোর্ট্রেট (A4)
            </button>
            <button
              type="button"
              onClick={() => onOrientationChange('landscape')}
              className={`py-1.5 rounded-lg text-[11px] font-black cursor-pointer transition ${
                orientation === 'landscape'
                  ? 'bg-amber-400 text-slate-950 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              ল্যান্ডস্কেপ (A4)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={marginPreset}
              onChange={(e) => onMarginChange(e.target.value as StudentPrintMargin)}
              aria-label="পৃষ্ঠার মার্জিন"
              className="px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="normal">মার্জিন: ১২ মিমি</option>
              <option value="wide">মার্জিন: ১৮ মিমি</option>
              <option value="compact">মার্জিন: ৮ মিমি</option>
            </select>
            {reportType === 'detailed' && (
              <select
                value={rowsPerPage}
                onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                aria-label="পৃষ্ঠায় সারি সংখ্যা"
                className="px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
              >
                <option value={0}>পৃষ্ঠায়: অটো</option>
                <option value={15}>পৃষ্ঠায়: ১৫ জন</option>
                <option value={20}>পৃষ্ঠায়: ২০ জন</option>
                <option value={25}>পৃষ্ঠায়: ২৫ জন</option>
                <option value={30}>পৃষ্ঠায়: ৩০ জন</option>
              </select>
            )}
          </div>
        </div>

        {/* 5. Column Customizer (Detailed List Mode) */}
        {reportType === 'detailed' && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1">
                <Columns3 size={12} className="text-indigo-500" />
                ৩. কলাম নির্বাচন
              </label>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                {toBanglaDigits(activeColCount)}টি চালু
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {STUDENT_PRINT_COLUMNS_META.filter((c) => c.key !== 'sl').map((col) => {
                const active = Boolean(activeCols[col.key]);
                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => onToggleColumn(col.key)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      active
                        ? 'bg-[#0B5D3B] text-white border-[#0B5D3B]'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                    }`}
                  >
                    {active ? '✓ ' : ''}
                    {col.labelBn}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
