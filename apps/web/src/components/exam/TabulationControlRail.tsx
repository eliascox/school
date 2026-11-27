'use client';

import React from 'react';
import {
  FileSpreadsheet,
  Globe,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { toBanglaDigits } from '@/lib/omr/omrTemplates';
import {
  TABULATION_PAPER_SPECS,
  type TabulationColumnOptions,
  type TabulationDocLang,
  type TabulationGradeId,
  type TabulationGroupBn,
  type TabulationPaperSize,
  type TabulationStatusFilter,
  type TabulationSummaryStats,
} from '@/lib/tabulationStudioUtils';

const GRADE_OPTIONS: Array<{ id: TabulationGradeId; labelBn: string }> = [
  { id: '6th', labelBn: '৬ষ্ঠ' },
  { id: '7th', labelBn: '৭ম' },
  { id: '8th', labelBn: '৮ম' },
  { id: '9th', labelBn: '৯ম' },
  { id: '10th', labelBn: '১০ম' },
];

const GROUP_OPTIONS: Array<{ id: TabulationGroupBn; labelBn: string }> = [
  { id: 'বিজ্ঞান', labelBn: 'বিজ্ঞান' },
  { id: 'মানবিক', labelBn: 'মানবিক' },
  { id: 'ব্যবসায় শিক্ষা', labelBn: 'ব্যবসায় শিক্ষা' },
];

const SECTION_OPTIONS = ['A', 'B', 'C'] as const;

export interface TabulationControlRailProps {
  examOptions: string[];
  selectedExam: string;
  onSelectExam: (exam: string) => void;
  selectedGrade: TabulationGradeId;
  onSelectGrade: (grade: TabulationGradeId) => void;
  selectedSection: string;
  onSelectSection: (sec: string) => void;
  selectedGroup: TabulationGroupBn;
  onSelectGroup: (grp: TabulationGroupBn) => void;
  gradeCounts: Record<TabulationGradeId, number>;
  statusFilter: TabulationStatusFilter;
  onStatusFilterChange: (s: TabulationStatusFilter) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  paperSize: TabulationPaperSize;
  onPaperSizeChange: (p: TabulationPaperSize) => void;
  docLang: TabulationDocLang;
  onDocLangChange: (l: TabulationDocLang) => void;
  columns: TabulationColumnOptions;
  onToggleColumn: (key: keyof TabulationColumnOptions) => void;
  summary: TabulationSummaryStats;
  onCloseMobileDrawer?: () => void;
}

export function TabulationControlRail({
  examOptions,
  selectedExam,
  onSelectExam,
  selectedGrade,
  onSelectGrade,
  selectedSection,
  onSelectSection,
  selectedGroup,
  onSelectGroup,
  gradeCounts,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
  paperSize,
  onPaperSizeChange,
  docLang,
  onDocLangChange,
  columns,
  onToggleColumn,
  summary,
  onCloseMobileDrawer,
}: TabulationControlRailProps) {
  const isClass9or10 = selectedGrade === '9th' || selectedGrade === '10th';

  return (
    <aside className="w-full lg:w-[316px] shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/60">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#0B5D3B]/10 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <SlidersHorizontal size={15} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-black text-slate-900 dark:text-white truncate">
              টেবুলেশন শিট স্টুডিও
            </h2>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              পেইজ সাইজ, কলাম, ভাষা ও এক্সপোর্ট
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

      {/* Body */}
      <div className="p-3.5 space-y-4 text-xs overflow-y-auto max-h-[calc(100vh-140px)]">
        {/* 1. Exam */}
        <div className="space-y-1.5">
          <label className="block text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            ১. পরীক্ষা নির্বাচন
          </label>
          <select
            value={selectedExam}
            onChange={(e) => onSelectExam(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
          >
            {examOptions.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Class Pills */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">
              ২. শ্রেণি নির্বাচন
            </label>
            <span className="text-[10px] font-bold text-slate-400">লাইভ সংখ্যা</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {GRADE_OPTIONS.map((g) => {
              const active = selectedGrade === g.id;
              const cnt = gradeCounts[g.id] || 0;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onSelectGrade(g.id)}
                  className={`py-1.5 px-1 rounded-xl border text-center transition cursor-pointer ${
                    active
                      ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                  }`}
                >
                  <div className="text-[11px] font-black leading-tight">{g.labelBn}</div>
                  <div
                    className={`text-[9.5px] font-bold mt-0.5 ${
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

        {/* 3. Section or Group */}
        <div className="space-y-1.5">
          <label className="block text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            {isClass9or10 ? '৩. বিভাগ / গ্রুপ' : '৩. শাখা'}
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {isClass9or10
              ? GROUP_OPTIONS.map((grp) => {
                  const active = selectedGroup === grp.id;
                  return (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => onSelectGroup(grp.id)}
                      className={`py-2 px-1.5 rounded-xl border text-[11px] font-black transition cursor-pointer truncate ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                      }`}
                    >
                      {grp.labelBn}
                    </button>
                  );
                })
              : SECTION_OPTIONS.map((sec) => {
                  const active = selectedSection === sec;
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => onSelectSection(sec)}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-black transition cursor-pointer ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                      }`}
                    >
                      শাখা {sec}
                    </button>
                  );
                })}
          </div>
        </div>

        {/* 4. Status Filter & Search */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
            {[
              { id: 'all' as const, label: 'সকল' },
              { id: 'pass' as const, label: 'কৃতকার্য' },
              { id: 'fail' as const, label: 'অকৃতকার্য' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onStatusFilterChange(tab.id)}
                className={`py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer ${
                  statusFilter === tab.id
                    ? tab.id === 'fail'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-[#0B5D3B] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="রোল বা নাম লিখুন..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        {/* 5. Paper Size (A4 / Legal / A3 Landscape) */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1">
            <FileSpreadsheet size={12} className="text-amber-600" />
            ৪. প্রিন্ট পেইজ সাইজ (Landscape)
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.keys(TABULATION_PAPER_SPECS) as TabulationPaperSize[]).map((pId) => {
              const spec = TABULATION_PAPER_SPECS[pId];
              const active = paperSize === pId;
              return (
                <button
                  key={pId}
                  type="button"
                  onClick={() => onPaperSizeChange(pId)}
                  className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                    active
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-950 dark:text-amber-200 ring-1 ring-amber-400/40'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                  }`}
                >
                  <div className="text-[11px] font-black uppercase">{pId}</div>
                  <div className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    {spec.dimensionsText.split(' ')[0]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. Strict Single-Language Toggle */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <Globe size={12} className="text-indigo-500" />
            ৫. প্রিন্ট ভাষা (একক ভাষা)
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

        {/* 7. Column Visibility Toggles */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            ৬. কলাম ও ডিসপ্লে অপশন
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'showBreakdown' as const, label: 'CQ / MCQ বিস্তারিত' },
              { key: 'show4thSubject' as const, label: '৪র্থ বিষয় ছাড়া GPA' },
              { key: 'showMerit' as const, label: 'মেধাক্রম (Merit)' },
              { key: 'showGradePoint' as const, label: 'বিষয়ভিত্তিক GP' },
              { key: 'compactRows' as const, label: 'কমপ্যাক্ট রো' },
            ].map((item) => {
              const active = columns[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onToggleColumn(item.key)}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                    active
                      ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                  }`}
                >
                  {active ? '✓ ' : ''}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 8. Live Mini KPI Summary */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-[10px] font-bold text-slate-500">পরীক্ষার্থী</div>
            <div className="text-base font-black text-slate-900 dark:text-white font-mono">
              {toBanglaDigits(summary.total)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-center">
            <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">পাস হার</div>
            <div className="text-base font-black text-emerald-800 dark:text-emerald-200 font-mono">
              {toBanglaDigits(summary.passRate.toFixed(1))}%
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-center">
            <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">জিপিএ ৫.০০</div>
            <div className="text-base font-black text-indigo-800 dark:text-indigo-200 font-mono">
              {toBanglaDigits(summary.aPlus)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 text-center">
            <div className="text-[10px] font-bold text-rose-700 dark:text-rose-300">অকৃতকার্য</div>
            <div className="text-base font-black text-rose-800 dark:text-rose-200 font-mono">
              {toBanglaDigits(summary.failed)}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
