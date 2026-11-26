'use client';

import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Crown,
  Eye,
  EyeOff,
  Filter,
  Globe,
  Printer,
  Search,
  SlidersHorizontal,
  Star,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { toBanglaDigits } from '@/lib/omr/omrTemplates';
import {
  ClassRankSummaryStats,
  CombinedRankCriteria,
  EvaluatedRankStudent,
  RankColumnConfig,
  RankDocLang,
  RankPresetMode,
  RankSortMode,
  RankTieBreakerMode,
  RankTopNLimit,
  detectRankPresetMode,
} from '@/lib/rankResultUtils';

export type RankMainTab = 'class_rank' | 'school_champions';
export type RankPrintPaperMode = 'standard' | 'preprinted_pad';
export type RankPrintOrientation = 'portrait' | 'landscape';
export type RankGradeId = '6th' | '7th' | '8th' | '9th' | '10th';
export type RankGroupBn = 'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা';

const GRADES_OPTIONS: Array<{ id: RankGradeId; labelBn: string }> = [
  { id: '6th', labelBn: '৬ষ্ঠ শ্রেণি' },
  { id: '7th', labelBn: '৭ম শ্রেণি' },
  { id: '8th', labelBn: '৮ম শ্রেণি' },
  { id: '9th', labelBn: '৯ম শ্রেণি' },
  { id: '10th', labelBn: '১০ম শ্রেণি' },
];

const TOP_N_OPTIONS: Array<{ value: RankTopNLimit; labelBn: string }> = [
  { value: 'all', labelBn: 'সব' },
  { value: 3, labelBn: '৩' },
  { value: 5, labelBn: '৫' },
  { value: 10, labelBn: '১০' },
  { value: 20, labelBn: '২০' },
];

export interface RankResultControlRailProps {
  activeMainTab: RankMainTab;
  examOptions: string[];
  selectedExam: string;
  onSelectExam: (exam: string) => void;
  selectedGrade: RankGradeId;
  onSelectGrade: (grade: RankGradeId) => void;
  selectedBranch: string;
  onSelectBranch: (branch: string) => void;
  selectedGroup: RankGroupBn;
  onSelectGroup: (group: RankGroupBn) => void;
  gradeStudentCounts: Record<RankGradeId, number>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  criteria: CombinedRankCriteria;
  onToggleCriteria: (key: keyof CombinedRankCriteria) => void;
  onApplyPreset: (preset: Exclude<RankPresetMode, 'custom'>) => void;
  topN: RankTopNLimit;
  onTopNChange: (n: RankTopNLimit) => void;
  sortMode: RankSortMode;
  onSortModeChange: (m: RankSortMode) => void;
  tieBreaker: RankTieBreakerMode;
  onTieBreakerChange: (t: RankTieBreakerMode) => void;
  docLang: RankDocLang;
  onDocLangChange: (l: RankDocLang) => void;
  printMode: RankPrintPaperMode;
  onPrintModeChange: (m: RankPrintPaperMode) => void;
  printOrientation: RankPrintOrientation;
  onPrintOrientationChange: (o: RankPrintOrientation) => void;
  officeCopyMode: boolean;
  onToggleOfficeCopy: () => void;
  columns: RankColumnConfig;
  onToggleColumn: (key: keyof RankColumnConfig) => void;
  split910ByGroup: boolean;
  onSplit910Change: (v: boolean) => void;
  summary: ClassRankSummaryStats;
  schoolChampion: EvaluatedRankStudent | null;
  onCloseMobileDrawer?: () => void;
}

export function RankResultControlRail({
  activeMainTab,
  examOptions,
  selectedExam,
  onSelectExam,
  selectedGrade,
  onSelectGrade,
  selectedBranch,
  onSelectBranch,
  selectedGroup,
  onSelectGroup,
  gradeStudentCounts,
  searchQuery,
  onSearchChange,
  criteria,
  onToggleCriteria,
  onApplyPreset,
  topN,
  onTopNChange,
  sortMode,
  onSortModeChange,
  tieBreaker,
  onTieBreakerChange,
  docLang,
  onDocLangChange,
  printMode,
  onPrintModeChange,
  printOrientation,
  onPrintOrientationChange,
  officeCopyMode,
  onToggleOfficeCopy,
  columns,
  onToggleColumn,
  split910ByGroup,
  onSplit910Change,
  summary,
  schoolChampion,
  onCloseMobileDrawer,
}: RankResultControlRailProps) {
  const [showCustomCriteria, setShowCustomCriteria] = useState(false);
  const isClass9or10 = selectedGrade === '9th' || selectedGrade === '10th';
  const activePreset = detectRankPresetMode(criteria);

  return (
    <aside className="w-full lg:w-[300px] xl:w-[312px] shrink-0 space-y-3 print:hidden">
      {/* Mobile Drawer Close Header */}
      {onCloseMobileDrawer && (
        <div className="flex lg:hidden items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-extrabold text-slate-900 dark:text-white inline-flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#0B5D3B]" />
            ফিল্টার ও প্রিন্ট কন্ট্রোল
          </span>
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
            aria-label="প্যানেল বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. COMPACT 2×2 LIVE STATS CARD (Replaces 5 bulky cards above the A4 sheet) */}
      {activeMainTab === 'class_rank' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 shadow-2xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800/80 px-2.5 py-2">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                <span>পরীক্ষার্থী</span>
                <Users className="w-3 h-3 text-slate-400" />
              </div>
              <p className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums leading-tight mt-0.5">
                {toBanglaDigits(summary.totalStudents)}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/60 px-2.5 py-2">
              <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                <span>উত্তীর্ণ</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-base font-extrabold text-[#0B5D3B] dark:text-emerald-300 tabular-nums leading-tight mt-0.5">
                {toBanglaDigits(summary.passedCount)}{' '}
                <span className="text-[10px] font-bold text-emerald-700/80 dark:text-emerald-400/80">
                  ({toBanglaDigits(summary.passRate)}%)
                </span>
              </p>
            </div>

            <div className="rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/50 px-2.5 py-2">
              <div className="flex items-center justify-between text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                <span>GPA 5.00</span>
                <Award className="w-3 h-3 text-amber-500" />
              </div>
              <p className="text-base font-extrabold text-amber-700 dark:text-amber-300 tabular-nums leading-tight mt-0.5">
                {toBanglaDigits(summary.aPlusCount)}
              </p>
            </div>

            <div className="rounded-xl bg-[#0B5D3B]/10 dark:bg-emerald-950/50 border border-[#0B5D3B]/25 dark:border-emerald-800/70 px-2.5 py-2">
              <div className="flex items-center justify-between text-[10px] font-semibold text-[#0B5D3B] dark:text-emerald-300">
                <span>প্রদর্শিত</span>
                <Trophy className="w-3 h-3 text-[#0B5D3B] dark:text-emerald-400" />
              </div>
              <p className="text-base font-extrabold text-[#0B5D3B] dark:text-emerald-200 tabular-nums leading-tight mt-0.5">
                {toBanglaDigits(summary.selectedCount)}{' '}
                <span className="text-[10px] font-bold">জন</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-amber-50 via-white to-emerald-50/60 dark:from-amber-950/40 dark:via-slate-900 dark:to-emerald-950/30 rounded-2xl border border-amber-200/90 dark:border-amber-800/60 p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                স্কুল ফার্স্ট · সেরা মেধা
              </p>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                {schoolChampion ? schoolChampion.name : 'এখনো নির্ধারিত হয়নি'}
              </p>
            </div>
          </div>
          {schoolChampion && (
            <div className="flex items-center justify-between text-[11px] bg-white/80 dark:bg-slate-950/60 rounded-xl px-2.5 py-1.5 border border-amber-200/70 dark:border-amber-900/50">
              <span className="font-semibold text-slate-600 dark:text-slate-300 truncate">
                {schoolChampion.gradeBn} · রোল {schoolChampion.roll}
              </span>
              <span className="font-extrabold text-[#0B5D3B] dark:text-emerald-400 tabular-nums shrink-0">
                GPA {schoolChampion.finalGPA.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2. SCOPE & QUICK SEARCH CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-2xs space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            পরীক্ষা ও শ্রেণি নির্বাচন
          </h2>
          {activeMainTab === 'class_rank' && summary.consideredCount > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[10px] font-bold">
              <Star className="w-2.5 h-2.5" />
              বিবেচনা: {toBanglaDigits(summary.consideredCount)}
            </span>
          )}
        </div>

        {/* Exam Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
            পরীক্ষা
          </label>
          <select
            aria-label="পরীক্ষা নির্বাচন"
            value={selectedExam}
            onChange={(e) => onSelectExam(e.target.value)}
            className="w-full h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0B5D3B] cursor-pointer text-xs"
          >
            {examOptions.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>

        {activeMainTab === 'class_rank' ? (
          <>
            {/* Class Selector with Live Student Counts */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                শ্রেণি
              </label>
              <select
                aria-label="শ্রেণি নির্বাচন"
                value={selectedGrade}
                onChange={(e) => onSelectGrade(e.target.value as RankGradeId)}
                className="w-full h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0B5D3B] cursor-pointer text-xs"
              >
                {GRADES_OPTIONS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.labelBn} ({toBanglaDigits(gradeStudentCounts[g.id] || 0)} জন)
                  </option>
                ))}
              </select>
            </div>

            {/* 1-Click Section / Group Segmented Pills */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                {isClass9or10 ? 'বিভাগ' : 'শাখা'}
              </label>
              {isClass9or10 ? (
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  {(
                    [
                      { id: 'বিজ্ঞান', label: 'বিজ্ঞান' },
                      { id: 'মানবিক', label: 'মানবিক' },
                      { id: 'ব্যবসায় শিক্ষা', label: 'ব্যবসায়' },
                    ] as const
                  ).map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => onSelectGroup(g.id)}
                      className={`h-7 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedGroup === g.id
                          ? 'bg-[#0B5D3B] text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  {(['A', 'B', 'C'] as const).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => onSelectBranch(sec)}
                      className={`h-7 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedBranch === sec
                          ? 'bg-[#0B5D3B] text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      শাখা {sec}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Instant Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="রোল বা শিক্ষার্থীর নাম খুঁজুন..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full h-9 pl-8 pr-8 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#0B5D3B] text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="অনুসন্ধান মুছুন"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </>
        ) : (
          /* Tab 2: Class vs Group-wise Top 3 Switch */
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
              শীর্ষ ৩ গ্রুপিং মোড
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => onSplit910Change(false)}
                className={`h-8 px-3 rounded-xl border text-[11px] font-bold text-left transition-all cursor-pointer ${
                  !split910ByGroup
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-[#0B5D3B] dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                প্রতি শ্রেণিতে সম্মিলিত শীর্ষ ৩
              </button>
              <button
                type="button"
                onClick={() => onSplit910Change(true)}
                className={`h-8 px-3 rounded-xl border text-[11px] font-bold text-left transition-all cursor-pointer ${
                  split910ByGroup
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-[#0B5D3B] dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                ৯ম–১০ম বিভাগভিত্তিক আলাদা শীর্ষ ৩
              </button>
            </div>
            <p className="text-[10.5px] text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 rounded-xl px-2.5 py-1.5 font-semibold">
              মেধা তালিকায় স্থান পেতে সকল বাধ্যতামূলক বিষয়ে পাস থাকা বাধ্যতামূলক।
            </p>
          </div>
        )}
      </div>

      {/* 3. MERIT FILTER PRESETS, TOP-N & SORTING CARD (Tab 1 Only) */}
      {activeMainTab === 'class_rank' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-2xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-[#0B5D3B]" />
              তালিকা ও র‍্যাংকিং নিয়ম
            </h2>
          </div>

          {/* 4 Quick Presets (ExamAssist Style) */}
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { id: 'pass_only', label: 'শুধু মেধা (পাস)' },
                { id: 'notice_default', label: 'পাস + ১–২ ফেল' },
                { id: 'fail_only', label: 'শুধু ফেল তালিকা' },
                { id: 'all', label: 'সকল শিক্ষার্থী' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onApplyPreset(p.id)}
                className={`h-8 px-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                  activePreset === p.id
                    ? 'bg-[#0B5D3B] border-[#0B5D3B] text-white shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Top-N Filter Pills */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                শীর্ষ সংখ্যা (Top-N)
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
              {TOP_N_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => onTopNChange(opt.value)}
                  className={`h-7 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    topN === opt.value
                      ? 'bg-white dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {opt.labelBn}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Mode (Shikkha Style: Merit vs Roll) + Tie-Breaker (ExamAssist Style) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                সাজানোর ক্রম
              </span>
              <div className="grid grid-cols-2 gap-0.5 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onSortModeChange('merit')}
                  className={`h-6.5 rounded-md text-[10.5px] font-bold cursor-pointer ${
                    sortMode === 'merit'
                      ? 'bg-white dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  মেধাক্রম
                </button>
                <button
                  type="button"
                  onClick={() => onSortModeChange('roll')}
                  className={`h-6.5 rounded-md text-[10.5px] font-bold cursor-pointer ${
                    sortMode === 'roll'
                      ? 'bg-white dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  রোল ক্রম
                </button>
              </div>
            </div>

            <div>
              <span className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                র‍্যাংকিং অগ্রাধিকার
              </span>
              <div className="grid grid-cols-2 gap-0.5 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onTieBreakerChange('gpa_first')}
                  className={`h-6.5 rounded-md text-[10.5px] font-bold cursor-pointer ${
                    tieBreaker === 'gpa_first'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  GPA আগে
                </button>
                <button
                  type="button"
                  onClick={() => onTieBreakerChange('marks_first')}
                  className={`h-6.5 rounded-md text-[10.5px] font-bold cursor-pointer ${
                    tieBreaker === 'marks_first'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  নম্বর আগে
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible Granular Fail & Consideration Filter */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCustomCriteria((v) => !v)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <span>কাস্টম ফেল ও বিবেচনা ফিল্টার</span>
              {showCustomCriteria ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {showCustomCriteria && (
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {(
                  [
                    { key: 'includePass', label: `পাস (${toBanglaDigits(summary.passedCount)})` },
                    { key: 'includeFail1', label: `১ ফেল (${toBanglaDigits(summary.fail1Count)})` },
                    { key: 'includeFail2', label: `২ ফেল (${toBanglaDigits(summary.fail2Count)})` },
                    { key: 'includeFail3', label: `৩ ফেল (${toBanglaDigits(summary.fail3Count)})` },
                    { key: 'includeFail4Plus', label: `৪+ ফেল (${toBanglaDigits(summary.fail4PlusCount)})` },
                    { key: 'includeConsidered', label: `বিবেচনা (${toBanglaDigits(summary.consideredCount)})` },
                  ] as Array<{ key: keyof CombinedRankCriteria; label: string }>
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onToggleCriteria(item.key)}
                    className={`h-7 px-2 rounded-lg border text-[10.5px] font-bold text-left truncate transition-all cursor-pointer ${
                      criteria[item.key]
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 line-through'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. PRINT, LANGUAGE & COLUMN OPTIONS CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-2xs space-y-3 text-xs">
        <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
          <Printer className="w-3 h-3 text-[#0B5D3B]" />
          ডকুমেন্ট ও প্রিন্ট সেটআপ
        </h2>

        {/* Single-Language Format Toggle (Bangla ONLY or English ONLY) */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 inline-flex items-center gap-1">
            <Globe className="w-3 h-3 text-slate-400" />
            শিটের ভাষা
          </span>
          <div className="inline-flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onDocLangChange('bn')}
              className={`h-6.5 px-2.5 rounded-md text-[11px] font-bold cursor-pointer ${
                docLang === 'bn'
                  ? 'bg-white dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => onDocLangChange('en')}
              className={`h-6.5 px-2.5 rounded-md text-[11px] font-bold cursor-pointer ${
                docLang === 'en'
                  ? 'bg-white dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Paper Mode */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onPrintModeChange('standard')}
            className={`h-7 rounded-lg text-[10.5px] font-bold cursor-pointer ${
              printMode === 'standard'
                ? 'bg-white dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            স্ট্যান্ডার্ড A4
          </button>
          <button
            type="button"
            onClick={() => onPrintModeChange('preprinted_pad')}
            className={`h-7 rounded-lg text-[10.5px] font-bold cursor-pointer ${
              printMode === 'preprinted_pad'
                ? 'bg-white dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            প্রি-প্রিন্টেড প্যাড
          </button>
        </div>

        {/* Orientation */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onPrintOrientationChange('portrait')}
            className={`h-7 rounded-lg text-[10.5px] font-bold cursor-pointer ${
              printOrientation === 'portrait'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Portrait (লম্বা)
          </button>
          <button
            type="button"
            onClick={() => onPrintOrientationChange('landscape')}
            className={`h-7 rounded-lg text-[10.5px] font-bold cursor-pointer ${
              printOrientation === 'landscape'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Landscape (আড়াআড়ি)
          </button>
        </div>

        {activeMainTab === 'class_rank' && (
          <>
            {/* Notice Board vs Office Copy */}
            <button
              type="button"
              onClick={onToggleOfficeCopy}
              className={`w-full h-8 px-2.5 rounded-xl border text-[11px] font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                officeCopyMode
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {officeCopyMode ? (
                <>
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                  <span>অফিস কপি (ফেল বিষয়সহ)</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 shrink-0" />
                  <span>নোটিশ বোর্ড (সম্মানজনক ভিউ)</span>
                </>
              )}
            </button>

            {/* Optional Column Checkboxes */}
            <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={columns.showMarks}
                  onChange={() => onToggleColumn('showMarks')}
                  className="rounded border-slate-300 text-[#0B5D3B] focus:ring-[#0B5D3B]"
                />
                <span>প্রাপ্ত নম্বর</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={columns.showSecondaryMetric}
                  onChange={() => onToggleColumn('showSecondaryMetric')}
                  className="rounded border-slate-300 text-[#0B5D3B] focus:ring-[#0B5D3B]"
                />
                <span>{isClass9or10 ? '৪র্থ ছাড়া GPA' : 'শতকরা (%)'}</span>
              </label>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
