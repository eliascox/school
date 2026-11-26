'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Star, UserX } from 'lucide-react';
import {
  SchoolSettings,
  getEnglishAddress,
  getEnglishPrincipalNameFromSettings,
  getEnglishPrincipalTitleFromSettings,
  getEnglishSchoolName,
} from '@/services/settingsService';
import { toAsciiDigits, toBanglaDigits } from '@/lib/omr/omrTemplates';
import {
  ChampionBucket,
  ClassRankSummaryStats,
  EvaluatedRankStudent,
  PopulatedScopeSummary,
  RANK_GRADE_BN_MAP,
  RANK_GRADE_EN_MAP,
  RankColumnConfig,
  RankDocLang,
  formatBanglaOrdinal,
  formatEnglishOrdinal,
  getRankGroupEn,
} from '@/lib/rankResultUtils';
import type { RankGradeId, RankMainTab, RankPrintPaperMode } from './RankResultControlRail';

export interface RankResultDocumentSheetProps {
  activeMainTab: RankMainTab;
  docLang: RankDocLang;
  printMode: RankPrintPaperMode;
  schoolSettings: SchoolSettings | null;
  selectedExam: string;
  selectedGrade: RankGradeId;
  selectedBranch: string;
  selectedGroup: string;
  isClass9or10: boolean;
  officeCopyMode: boolean;
  columns: RankColumnConfig;
  printableListTitle: string;
  displayedList: EvaluatedRankStudent[];
  totalClassStudents: number;
  summary: ClassRankSummaryStats;
  championsData: {
    schoolChampion: EvaluatedRankStudent | null;
    allSchoolPassed: EvaluatedRankStudent[];
    buckets: ChampionBucket[];
  };
  populatedScopes: PopulatedScopeSummary[];
  onJumpToScope: (scope: PopulatedScopeSummary) => void;
  onResetFilters: () => void;
  onToggleSpecialConsideration: (studentId: string) => void;
}

export function RankResultDocumentSheet({
  activeMainTab,
  docLang,
  printMode,
  schoolSettings,
  selectedExam,
  selectedGrade,
  selectedBranch,
  selectedGroup,
  isClass9or10,
  officeCopyMode,
  columns,
  printableListTitle,
  displayedList,
  totalClassStudents,
  summary,
  championsData,
  populatedScopes,
  onJumpToScope,
  onResetFilters,
  onToggleSpecialConsideration,
}: RankResultDocumentSheetProps) {
  const isEn = docLang === 'en';
  const fmtNum = (val: string | number) => (isEn ? toAsciiDigits(String(val)) : toBanglaDigits(val));
  const fmtOrdinal = (n: number) => (isEn ? formatEnglishOrdinal(n) : formatBanglaOrdinal(n));

  const todayDisplay = isEn
    ? new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('bn-BD');

  // Strict single-language school identity (NO mixed Bangla + English side-by-side)
  const schoolNameDisplay = isEn
    ? getEnglishSchoolName(schoolSettings, 'Educational Institution')
    : schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান';
  const schoolAddressDisplay = isEn
    ? getEnglishAddress(schoolSettings, '')
    : schoolSettings?.address || '';
  const principalNameDisplay = isEn
    ? getEnglishPrincipalNameFromSettings(schoolSettings, '')
    : schoolSettings?.principalName?.trim() || '';
  const principalTitleDisplay = isEn
    ? getEnglishPrincipalTitleFromSettings(schoolSettings, 'Headmaster')
    : schoolSettings?.principalTitle || 'প্রধান শিক্ষক';

  const gradeDisplay = isEn
    ? RANK_GRADE_EN_MAP[selectedGrade] || selectedGrade
    : RANK_GRADE_BN_MAP[selectedGrade] || selectedGrade;
  const scopeDisplay = isEn
    ? isClass9or10
      ? getRankGroupEn(selectedGroup)
      : `Section ${selectedBranch}`
    : isClass9or10
      ? `${selectedGroup} বিভাগ`
      : `শাখা: ${selectedBranch}`;

  const classColSpan =
    7 +
    (columns.showMarks ? 1 : 0) +
    (columns.showSecondaryMetric ? 1 : 0) +
    (officeCopyMode ? 1 : 0) +
    1;

  return (
    <article className="w-full flex-1 min-w-0 max-w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 print:bg-white print:text-slate-950 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-4 sm:p-6 lg:p-7 space-y-4 print:p-0 print:border-0 print:rounded-none print:shadow-none print:space-y-3">
      {/* 1. Institutional Letterhead Banner (<div>, never <header>, so globals.css print never hides it) */}
      <div
        className={`border-b-2 border-slate-900 dark:border-slate-700 print:border-slate-950 pb-3 ${
          printMode === 'preprinted_pad' ? 'print:hidden' : ''
        }`}
      >
        <div className="flex items-center justify-center gap-3.5">
          {schoolSettings?.schoolLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={schoolSettings.schoolLogo}
              alt={schoolNameDisplay}
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0"
            />
          )}
          <div className="text-center space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white print:text-slate-950 tracking-tight leading-tight">
              {schoolNameDisplay}
            </h1>
            {(schoolAddressDisplay || schoolSettings?.eiin) && (
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 print:text-slate-800">
                {[
                  schoolAddressDisplay,
                  schoolSettings?.eiin ? `EIIN: ${fmtNum(schoolSettings.eiin)}` : '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Document Title Banner & Compact Metadata Strip */}
      <div className="text-center space-y-2">
        <div>
          <span className="inline-block px-4 py-1 rounded-lg bg-[#0B5D3B] print:bg-slate-950 text-white font-extrabold text-xs sm:text-sm tracking-wide">
            {selectedExam} — {printableListTitle}
          </span>
        </div>

        {activeMainTab === 'class_rank' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 print:bg-slate-50 border border-slate-200 dark:border-slate-800 print:border-slate-800 text-[11px] text-left">
            <div>
              <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">
                {isEn ? 'Class & Section:' : 'শ্রেণি ও শাখা/বিভাগ:'}
              </span>{' '}
              <strong className="text-slate-900 dark:text-white print:text-slate-950">
                {gradeDisplay} ({scopeDisplay})
              </strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">
                {isEn ? 'Examinees / Passed:' : 'পরীক্ষার্থী ও পাস:'}
              </span>{' '}
              <strong className="text-slate-900 dark:text-white print:text-slate-950 tabular-nums">
                {fmtNum(summary.totalStudents)} / {fmtNum(summary.passedCount)} ({fmtNum(summary.passRate)}%)
              </strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">
                GPA 5.00 (A+):
              </span>{' '}
              <strong className="text-slate-900 dark:text-white print:text-slate-950 tabular-nums">
                {fmtNum(summary.aPlusCount)} · {isEn ? 'Shown:' : 'প্রদর্শিত:'} {fmtNum(summary.selectedCount)}
              </strong>
            </div>
            <div className="sm:text-right">
              <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">
                {isEn ? 'Published:' : 'প্রকাশের তারিখ:'}
              </span>{' '}
              <strong className="text-slate-900 dark:text-white print:text-slate-950">{todayDisplay}</strong>
            </div>
          </div>
        )}
      </div>

      {/* 3. PRINT-ONLY OFFICIAL SCHOOL CHAMPION HONOR BOX */}
      {activeMainTab === 'school_champions' && championsData.schoolChampion && (
        <div className="hidden print:flex items-center justify-between gap-4 px-4 py-2.5 rounded-lg border-2 border-slate-900 bg-amber-50/70 break-inside-avoid rank-print-avoid-break">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
              {isEn ? '★ Overall School Champion (School First)' : '★ সর্ব-বিদ্যালয় সেরা মেধা (স্কুল ফার্স্ট)'}
            </div>
            <div className="text-base font-extrabold text-slate-950">
              {championsData.schoolChampion.name}
            </div>
            <div className="text-xs font-semibold text-slate-800">
              {isEn ? RANK_GRADE_EN_MAP[championsData.schoolChampion.grade] : championsData.schoolChampion.gradeBn} (
              {championsData.schoolChampion.grade === '9th' || championsData.schoolChampion.grade === '10th'
                ? isEn
                  ? getRankGroupEn(championsData.schoolChampion.group)
                  : championsData.schoolChampion.group
                : isEn
                  ? `Section ${championsData.schoolChampion.section}`
                  : `শাখা ${championsData.schoolChampion.section}`}
              ) · {isEn ? 'Roll:' : 'রোল:'} {fmtNum(championsData.schoolChampion.roll)} · {isEn ? 'Marks:' : 'নম্বর:'}{' '}
              {fmtNum(championsData.schoolChampion.totalObtained)}/{fmtNum(championsData.schoolChampion.totalFull)}
            </div>
          </div>
          <div className="text-right shrink-0 border-l border-slate-400 pl-4">
            <div className="text-sm font-extrabold text-slate-950 tabular-nums">
              GPA {championsData.schoolChampion.finalGPA.toFixed(2)} ({championsData.schoolChampion.overallGrade})
            </div>
            <div className="text-xs font-bold text-slate-800 tabular-nums">
              {isEn ? 'Percentage:' : 'শতকরা হার:'} {fmtNum(championsData.schoolChampion.obtainedPercentage)}%
            </div>
          </div>
        </div>
      )}

      {/* 4. MASTER RANK TABLE */}
      {activeMainTab === 'school_champions' ? (
        <div className="overflow-x-auto print:overflow-visible">
          <table className="rank-print-table w-full text-left text-xs border-collapse border border-slate-300 dark:border-slate-700 print:border-slate-950">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200 text-slate-800 dark:text-slate-100 print:text-slate-950 font-extrabold text-[11px] border-b border-slate-300 dark:border-slate-700 print:border-slate-950">
                <th className="px-2.5 py-2 border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-36">
                  {isEn ? 'Class / Group' : 'শ্রেণি / বিভাগ'}
                </th>
                <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-20">
                  {isEn ? 'Merit Rank' : 'মেধা স্থান'}
                </th>
                <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-16">
                  {isEn ? 'Roll' : 'রোল'}
                </th>
                <th className="px-2.5 py-2 border-r border-slate-300 dark:border-slate-700 print:border-slate-950">
                  {isEn ? 'Student Name' : 'শিক্ষার্থীর নাম'}
                </th>
                <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-24">
                  {isEn ? 'Section / Group' : 'শাখা / বিভাগ'}
                </th>
                <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-24">
                  {isEn ? 'Marks' : 'প্রাপ্ত নম্বর'}
                </th>
                <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-20">
                  {isEn ? 'Percent (%)' : 'শতকরা (%)'}
                </th>
                <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-16">
                  GPA
                </th>
                <th className="px-2 py-2 text-center w-14">{isEn ? 'Grade' : 'গ্রেড'}</th>
              </tr>
            </thead>

            {championsData.buckets.map((bucket) => {
              const bucketLabel = isEn
                ? bucket.key.includes('_')
                  ? `${RANK_GRADE_EN_MAP[bucket.grade]} (${getRankGroupEn(bucket.key.split('_')[1] || '')})`
                  : RANK_GRADE_EN_MAP[bucket.grade] || bucket.grade
                : bucket.labelBn;
              return (
                <tbody
                  key={bucket.key}
                  className="border-b border-slate-300 dark:border-slate-700 print:border-slate-950 break-inside-avoid rank-print-avoid-break"
                >
                  {bucket.winners.length === 0 ? (
                    <tr>
                      <td className="px-2.5 py-2 font-extrabold border-r border-slate-300 dark:border-slate-700 print:border-slate-950 bg-slate-50/80 dark:bg-slate-900/50 print:bg-slate-50">
                        {bucketLabel}
                      </td>
                      <td
                        colSpan={8}
                        className="px-2.5 py-2 text-center text-slate-400 dark:text-slate-500 print:text-slate-600 italic text-[11px]"
                      >
                        {isEn
                          ? 'No passed students found with marks entered'
                          : 'সকল বিষয়ে উত্তীর্ণ কোনো শিক্ষার্থী পাওয়া যায়নি'}
                      </td>
                    </tr>
                  ) : (
                    bucket.winners.map((st, idx) => (
                      <tr
                        key={`${bucket.key}_${st.id}`}
                        className={`border-b border-slate-200 dark:border-slate-800 print:border-slate-400 last:border-b-0 ${
                          idx === 0 ? 'bg-amber-50/35 dark:bg-amber-950/15 print:bg-amber-50/40' : ''
                        }`}
                      >
                        {idx === 0 && (
                          <td
                            rowSpan={bucket.winners.length}
                            className="px-2.5 py-2 font-extrabold border-r border-slate-300 dark:border-slate-700 print:border-slate-950 bg-slate-50/80 dark:bg-slate-900/50 print:bg-slate-50 align-top"
                          >
                            {bucketLabel}
                          </td>
                        )}
                        <td className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 print:border-slate-400 font-extrabold">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-extrabold ${
                              idx === 0
                                ? 'bg-amber-300 text-slate-950'
                                : idx === 1
                                  ? 'bg-slate-200 dark:bg-slate-700 print:bg-slate-200 text-slate-900 dark:text-white print:text-slate-950'
                                  : 'bg-orange-100 dark:bg-orange-950/60 print:bg-orange-100 text-orange-900 dark:text-orange-200 print:text-slate-950'
                            }`}
                          >
                            {isEn ? `${formatEnglishOrdinal(idx + 1)} Merit` : `${formatBanglaOrdinal(idx + 1)} মেধা`}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center font-bold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                          {fmtNum(st.roll)}
                        </td>
                        <td className="px-2.5 py-2 font-bold border-r border-slate-200 dark:border-slate-800 print:border-slate-400 text-slate-900 dark:text-white print:text-slate-950">
                          {st.name}
                        </td>
                        <td className="px-2 py-2 text-center text-[11px] font-semibold border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                          {st.grade === '9th' || st.grade === '10th'
                            ? isEn
                              ? getRankGroupEn(st.group)
                              : st.group
                            : isEn
                              ? `Sec ${st.section}`
                              : `শাখা ${st.section}`}
                        </td>
                        <td className="px-2 py-2 text-center font-bold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                          {fmtNum(st.totalObtained)}/{fmtNum(st.totalFull)}
                        </td>
                        <td className="px-2 py-2 text-center font-bold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                          {fmtNum(st.obtainedPercentage)}%
                        </td>
                        <td className="px-2 py-2 text-center font-extrabold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400 bg-emerald-50/40 dark:bg-emerald-950/20 print:bg-slate-50">
                          {st.finalGPA.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-center font-extrabold text-[#0B5D3B] dark:text-emerald-400 print:text-slate-950">
                          {st.overallGrade}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              );
            })}
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto print:overflow-visible">
          <table className="rank-print-table w-full text-left text-xs border-collapse border border-slate-300 dark:border-slate-700 print:border-slate-950">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200 text-slate-800 dark:text-slate-100 print:text-slate-950 font-extrabold text-[11px] border-b border-slate-300 dark:border-slate-700 print:border-slate-950">
                <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-12">
                  {isEn ? 'SL' : 'ক্রম'}
                </th>
                <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-20">
                  {isEn ? 'Merit' : 'মেধা স্থান'}
                </th>
                <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-16">
                  {isEn ? 'Roll' : 'রোল'}
                </th>
                <th className="px-2.5 py-2 border-r border-slate-300 dark:border-slate-700 print:border-slate-950">
                  {isEn ? 'Student Name' : 'শিক্ষার্থীর নাম'}
                </th>
                {columns.showMarks && (
                  <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-24">
                    {isEn ? 'Marks' : 'প্রাপ্ত নম্বর'}
                  </th>
                )}
                {columns.showSecondaryMetric &&
                  (isClass9or10 ? (
                    <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-20">
                      {isEn ? 'GPA (W/O 4th)' : 'GPA (৪র্থ ছাড়া)'}
                    </th>
                  ) : (
                    <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-20">
                      {isEn ? 'Percent (%)' : 'শতকরা (%)'}
                    </th>
                  ))}
                <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-20 bg-emerald-50/70 dark:bg-emerald-950/30 print:bg-slate-200">
                  {isEn ? 'Final GPA' : 'চূড়ান্ত GPA'}
                </th>
                <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-14">
                  {isEn ? 'Grade' : 'গ্রেড'}
                </th>
                <th
                  className={`px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-32 ${
                    !officeCopyMode ? 'print:border-r-0' : ''
                  }`}
                >
                  {isEn ? 'Result / Status' : 'ফলাফল / মন্তব্য'}
                </th>
                {officeCopyMode && (
                  <th className="px-2 py-2 text-left border-r border-slate-300 dark:border-slate-700 print:border-r-0 w-44">
                    {isEn ? 'Failed Subjects' : 'অকৃতকার্য বিষয়সমূহ'}
                  </th>
                )}
                <th className="px-2 py-2 text-center w-24 print:hidden">
                  {isEn ? 'Consider' : 'বিবেচনা'}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-slate-400">
              {displayedList.length === 0 ? (
                <tr>
                  <td colSpan={classColSpan} className="p-8 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-10 h-10 mx-auto rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
                        <UserX className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                          {totalClassStudents === 0
                            ? isEn
                              ? 'No students found in this class & section yet.'
                              : 'এই শ্রেণি ও শাখায় এখনো কোনো শিক্ষার্থী পাওয়া যায়নি।'
                            : isEn
                              ? 'No students match the current filter.'
                              : 'বর্তমান ফিল্টারে কোনো শিক্ষার্থী পাওয়া যায়নি।'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {totalClassStudents === 0
                            ? isEn
                              ? 'Select a populated class below, or add students / enter exam marks.'
                              : 'নিচ থেকে শিক্ষার্থী থাকা শ্রেণি বেছে নিন অথবা শিক্ষার্থী/নম্বর যুক্ত করুন।'
                            : isEn
                              ? 'Reset filters to view all students or verify exam marks.'
                              : 'সব শিক্ষার্থী দেখতে ফিল্টার রিসেট করুন অথবা নম্বর এন্ট্রি যাচাই করুন।'}
                        </p>
                      </div>

                      {/* Shikkha-style Inline Smart Jump Chips */}
                      {totalClassStudents === 0 && populatedScopes.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 print:hidden">
                          {populatedScopes.slice(0, 6).map((sc) => (
                            <button
                              key={`${sc.grade}_${sc.section}_${sc.group}`}
                              type="button"
                              onClick={() => onJumpToScope(sc)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-[#0B5D3B] dark:text-emerald-300 text-[11px] font-bold transition cursor-pointer"
                            >
                              {isEn
                                ? `${RANK_GRADE_EN_MAP[sc.grade]} · ${
                                    sc.grade === '9th' || sc.grade === '10th'
                                      ? getRankGroupEn(sc.group)
                                      : `Section ${sc.section}`
                                  } (${sc.count})`
                                : `${sc.labelBn} (${toBanglaDigits(sc.count)})`}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 print:hidden">
                        {totalClassStudents > 0 && (
                          <button
                            type="button"
                            onClick={onResetFilters}
                            className="px-3 py-1.5 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-[11px] font-bold transition cursor-pointer"
                          >
                            {isEn ? 'Show All Students' : 'সকল শিক্ষার্থী দেখুন'}
                          </button>
                        )}
                        <Link
                          href="/dashboard/exam/mark-entry/"
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-[11px] font-bold inline-flex items-center gap-1 transition"
                        >
                          <span>{isEn ? 'Mark Entry' : 'নম্বর এন্ট্রি'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                        <Link
                          href="/dashboard/students/"
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-[11px] font-bold inline-flex items-center gap-1 transition"
                        >
                          <span>{isEn ? 'Student Directory' : 'শিক্ষার্থী তালিকা'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedList.map((st, idx) => (
                  <tr
                    key={st.id}
                    className={`transition-colors ${
                      st.hasFailed
                        ? 'bg-amber-50/35 dark:bg-amber-950/15 print:bg-slate-50/60'
                        : idx % 2 === 1
                          ? 'bg-slate-50/45 dark:bg-slate-900/40 print:bg-slate-50/35'
                          : ''
                    }`}
                  >
                    <td className="px-2 py-1.5 text-center font-bold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400 text-slate-600 dark:text-slate-300 print:text-slate-900">
                      {fmtNum(st.listOrder)}
                    </td>

                    <td className="px-2 py-1.5 text-center font-extrabold border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                      {st.meritPosition !== null ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-extrabold ${
                            st.meritPosition === 1
                              ? 'bg-amber-300 text-slate-950'
                              : st.meritPosition === 2
                                ? 'bg-slate-200 dark:bg-slate-700 print:bg-slate-200 text-slate-900 dark:text-white print:text-slate-950'
                                : st.meritPosition === 3
                                  ? 'bg-orange-100 dark:bg-orange-950/60 print:bg-orange-100 text-orange-900 dark:text-orange-200 print:text-slate-950'
                                  : 'text-[#0B5D3B] dark:text-emerald-300 print:text-slate-950'
                          }`}
                        >
                          {fmtOrdinal(st.meritPosition)}
                        </span>
                      ) : (
                        <span className="text-slate-400 print:text-slate-600">—</span>
                      )}
                    </td>

                    <td className="px-2 py-1.5 text-center font-extrabold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                      {fmtNum(st.roll)}
                    </td>

                    <td className="px-2.5 py-1.5 font-bold border-r border-slate-200 dark:border-slate-800 print:border-slate-400 text-slate-900 dark:text-white print:text-slate-950">
                      {st.name}
                    </td>

                    {columns.showMarks && (
                      <td className="px-2 py-1.5 text-center font-bold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                        {st.totalFull > 0
                          ? `${fmtNum(st.totalObtained)}/${fmtNum(st.totalFull)}`
                          : fmtNum(st.totalObtained)}
                      </td>
                    )}

                    {columns.showSecondaryMetric &&
                      (isClass9or10 ? (
                        <td className="px-2 py-1.5 text-center font-bold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                          {st.hasFailed ? '0.00' : st.gpaWithout4th.toFixed(2)}
                        </td>
                      ) : (
                        <td className="px-2 py-1.5 text-center font-bold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                          {fmtNum(st.obtainedPercentage)}%
                        </td>
                      ))}

                    <td className="px-2 py-1.5 text-center font-extrabold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400 bg-emerald-50/35 dark:bg-emerald-950/20 print:bg-slate-50 text-slate-950 dark:text-white print:text-slate-950">
                      {st.hasFailed ? '0.00' : st.finalGPA.toFixed(2)}
                    </td>

                    <td className="px-2 py-1.5 text-center font-extrabold border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                      <span
                        className={
                          st.overallGrade === 'F'
                            ? 'text-amber-700 dark:text-amber-400 print:text-slate-800'
                            : 'text-[#0B5D3B] dark:text-emerald-400 print:text-slate-950'
                        }
                      >
                        {st.overallGrade}
                      </span>
                    </td>

                    <td
                      className={`px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 print:border-slate-400 ${
                        !officeCopyMode ? 'print:border-r-0' : ''
                      }`}
                    >
                      {st.hasFailed ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-amber-900 dark:text-amber-200 print:text-slate-900 bg-amber-100/80 dark:bg-amber-950/60 print:bg-transparent border border-amber-300/80 dark:border-amber-800 print:border-slate-500">
                          {isEn ? 'Consideration' : 'বিশেষ বিবেচনা'}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-emerald-800 dark:text-emerald-300 print:text-slate-950 bg-emerald-50 dark:bg-emerald-950/50 print:bg-transparent border border-emerald-200 dark:border-emerald-800 print:border-slate-500">
                          {isEn ? 'Passed' : 'উত্তীর্ণ'}
                        </span>
                      )}
                    </td>

                    {officeCopyMode && (
                      <td className="px-2 py-1.5 text-[11px] font-medium border-r border-slate-200 dark:border-slate-800 print:border-r-0 text-rose-700 dark:text-rose-300 print:text-slate-900">
                        {st.hasFailed
                          ? st.failedSubjects.length > 0
                            ? `${fmtNum(st.failedCount)}: ${st.failedSubjects.join(', ')}`
                            : isEn
                              ? 'Incomplete marks'
                              : 'নম্বর অসম্পূর্ণ'
                          : '—'}
                      </td>
                    )}

                    <td className="px-2 py-1.5 text-center print:hidden">
                      {st.hasFailed && (
                        <button
                          type="button"
                          onClick={() => onToggleSpecialConsideration(st.id)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition inline-flex items-center justify-center gap-1 cursor-pointer border ${
                            st.isConsidered
                              ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                          }`}
                        >
                          <Star className={`w-3 h-3 ${st.isConsidered ? 'fill-slate-950' : ''}`} />
                          {st.isConsidered ? (isEn ? 'Approved' : 'অনুমোদিত') : isEn ? 'Approve' : 'অনুমোদন'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. OFFICIAL SIGNATURE & PUBLICATION FOOTER (ATOMIC break-inside-avoid!) */}
      <footer className="hidden print:block pt-10 break-inside-avoid rank-print-avoid-break">
        <div className="grid grid-cols-3 gap-8 text-center text-xs font-bold text-slate-950">
          <div>
            <div className="w-40 border-b border-slate-900 mx-auto" />
            <p className="mt-1.5">{isEn ? 'Class Teacher' : 'শ্রেণি শিক্ষকের স্বাক্ষর'}</p>
          </div>
          <div>
            <div className="w-40 border-b border-slate-900 mx-auto" />
            <p className="mt-1.5">{isEn ? 'Controller of Examinations' : 'পরীক্ষা নিয়ন্ত্রক'}</p>
          </div>
          <div>
            <div className="w-40 border-b border-slate-900 mx-auto" />
            <p className="mt-1.5 font-extrabold">
              {principalNameDisplay || principalTitleDisplay}
            </p>
            {principalNameDisplay && (
              <p className="text-[10px] font-semibold text-slate-700">{principalTitleDisplay}</p>
            )}
          </div>
        </div>
        <div className="mt-4 pt-1.5 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-600">
          <span>
            {schoolNameDisplay} · {selectedExam}
          </span>
          <span>
            {isEn ? 'Published:' : 'প্রকাশের তারিখ:'} {todayDisplay}
          </span>
        </div>
      </footer>
    </article>
  );
}
