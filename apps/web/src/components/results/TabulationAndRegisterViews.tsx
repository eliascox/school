'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  Trophy,
  XCircle,
} from 'lucide-react';
import { DynamicClassSubject } from '@/lib/curriculumUtils';
import {
  buildFailList,
  RankedStudentResult,
  TieBreakerRule,
} from '@/lib/resultAnalyticsEngine';
import { AppLanguage } from '@/services/languageService';
import { SchoolSettings } from '@/services/settingsService';
import {
  fmtNum,
  PrintInstitutionalHeader,
  PrintSignatureStrip,
  shortTabulationSubject,
  toBnDigits,
} from './resultStudioShared';

function resolveMark(res: RankedStudentResult, sub: DynamicClassSubject) {
  return (
    res.subjectMarks[sub.code] ||
    (res.optionalSubjectMark &&
    (res.optionalSubjectMark.subjectCode === sub.code ||
      sub.name.includes(res.optionalSubjectMark.subjectName))
      ? res.optionalSubjectMark
      : undefined) ||
    Object.values(res.subjectMarks).find(
      (m) => m.subjectCode === sub.code || m.subjectName === sub.name,
    )
  );
}

export function TabulationMatrixView({
  examTitle,
  gradeLabel,
  sectionLabel,
  lang,
  settings,
  subjects,
  rankedResults,
  hideHeader,
}: {
  examTitle: string;
  gradeLabel: string;
  sectionLabel: string;
  lang: AppLanguage;
  settings: Partial<SchoolSettings> | null;
  subjects: DynamicClassSubject[];
  rankedResults: RankedStudentResult[];
  hideHeader: boolean;
}) {
  const [showCq, setShowCq] = useState(false);
  const [showMcq, setShowMcq] = useState(false);
  const [showPractical, setShowPractical] = useState(false);
  const [showPfBadge, setShowPfBadge] = useState(true);
  const [showOptional, setShowOptional] = useState(true);
  const [showMerit, setShowMerit] = useState(true);
  const [paperSize, setPaperSize] = useState<'a4' | 'legal' | 'a3'>('a4');
  const [zoomPct, setZoomPct] = useState<'fit' | '100' | '90' | '80' | '70' | '60'>('fit');
  const [search, setSearch] = useState('');

  const displayedSubjects = useMemo(
    () => (showOptional ? subjects : subjects.filter((s) => s.category !== '৪র্থ বিষয়')),
    [subjects, showOptional],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rankedResults;
    return rankedResults.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        String(r.studentRoll).toLowerCase().includes(q),
    );
  }, [rankedResults, search]);

  const zoomScale =
    zoomPct === 'fit' ? 1 : Number(zoomPct) / 100;

  return (
    <div className="space-y-4">
      <style jsx global>{`
        @media print {
          @page {
            size: ${paperSize} landscape;
            margin: 5mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Interactive Tabulation Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            {[
              { label: 'CQ', state: showCq, toggle: setShowCq },
              { label: 'MCQ', state: showMcq, toggle: setShowMcq },
              { label: 'PR', state: showPractical, toggle: setShowPractical },
              { label: 'P/F ব্যাজ', state: showPfBadge, toggle: setShowPfBadge },
              { label: lang === 'bn' ? '৪র্থ বিষয়' : 'Optional', state: showOptional, toggle: setShowOptional },
              { label: lang === 'bn' ? 'মেধাক্রম' : 'Merit', state: showMerit, toggle: setShowMerit },
            ].map((item) => (
              <label
                key={item.label}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] cursor-pointer transition ${
                  item.state
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.state}
                  onChange={(e) => item.toggle(e.target.checked)}
                  className="accent-indigo-600 cursor-pointer"
                />
                {item.label}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'bn' ? 'রোল বা নাম...' : 'Roll or name...'}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none w-36"
              />
            </div>

            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as 'a4' | 'legal' | 'a3')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="a4">A4 Landscape</option>
              <option value="legal">Legal Landscape</option>
              <option value="a3">A3 Landscape</option>
            </select>

            <select
              value={zoomPct}
              onChange={(e) => setZoomPct(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="fit">{lang === 'bn' ? 'অটো ফিট (Fit)' : 'Fit Width'}</option>
              <option value="100">100%</option>
              <option value="90">90%</option>
              <option value="80">80%</option>
              <option value="70">70%</option>
              <option value="60">60%</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printable Tabulation Sheet Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs print:bg-white print:text-slate-950 print:border-none print:shadow-none print:p-0 overflow-x-auto">
        <div
          style={zoomScale !== 1 ? { transform: `scale(${zoomScale})`, transformOrigin: 'top left', width: `${(100 / zoomScale).toFixed(1)}%` } : undefined}
        >
          <PrintInstitutionalHeader
            settings={settings}
            reportTitle={lang === 'bn' ? 'সমন্বিত ফলাফল টেবুলেশন রেজিস্টার' : 'MASTER TABULATION REGISTER'}
            subtitle={`${examTitle} • ${gradeLabel} • ${sectionLabel}`}
            hideHeader={hideHeader}
            lang={lang}
          />

          <table className="w-full text-[11px] border-collapse border border-slate-300 dark:border-slate-700 print:border-slate-900">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200 text-slate-900 dark:text-slate-100 print:text-slate-950 font-black">
                <th className="p-1.5 border border-slate-300 dark:border-slate-700 print:border-slate-900 text-center w-12">
                  {lang === 'bn' ? 'রোল' : 'Roll'}
                </th>
                <th className="p-1.5 border border-slate-300 dark:border-slate-700 print:border-slate-900 text-left min-w-[130px]">
                  {lang === 'bn' ? 'শিক্ষার্থীর নাম' : 'Student Name'}
                </th>
                {displayedSubjects.map((sub) => (
                  <th
                    key={sub.code}
                    className={`p-1.5 border border-slate-300 dark:border-slate-700 print:border-slate-900 text-center min-w-[68px] ${
                      sub.category === '৪র্থ বিষয়' ? 'bg-amber-50/70 dark:bg-amber-950/30 print:bg-amber-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 font-black leading-tight">
                      <span>{lang === 'bn' ? shortTabulationSubject(sub.name) : sub.name}</span>
                      {sub.isJointPass && (
                        <span
                          className="w-2 h-2 rounded-full bg-violet-500 inline-block shrink-0"
                          title="যৌথ পাস বিষয় (Combined Paper)"
                        />
                      )}
                    </div>
                    <div className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
                      ({fmtNum(sub.fullMarks, lang)}){sub.category === '৪র্থ বিষয়' ? ' ★' : ''}
                    </div>
                  </th>
                ))}
                <th className="p-1.5 border border-slate-300 dark:border-slate-700 print:border-slate-900 text-center w-16">
                  {lang === 'bn' ? 'মোট' : 'Total'}
                </th>
                <th className="p-1.5 border border-slate-300 dark:border-slate-700 print:border-slate-900 text-center w-14 bg-indigo-50 dark:bg-indigo-950/40 print:bg-indigo-50">
                  GPA
                </th>
                <th className="p-1.5 border border-slate-300 dark:border-slate-700 print:border-slate-900 text-center w-12">
                  {lang === 'bn' ? 'গ্রেড' : 'Grade'}
                </th>
                {showMerit && (
                  <th className="p-1.5 border border-slate-300 dark:border-slate-700 print:border-slate-900 text-center w-14">
                    {lang === 'bn' ? 'মেধা' : 'Merit'}
                  </th>
                )}
                <th className="p-1.5 border border-slate-300 dark:border-slate-700 print:border-slate-900 text-center w-16">
                  {lang === 'bn' ? 'অবস্থা' : 'Status'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={displayedSubjects.length + (showMerit ? 7 : 6)}
                    className="p-8 text-center text-xs font-bold text-slate-500 dark:text-slate-400"
                  >
                    {lang === 'bn' ? 'কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি।' : 'No student records found.'}
                  </td>
                </tr>
              ) : (
                filteredRows.map((res) => (
                  <tr
                    key={res.studentId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100 print:text-slate-950"
                  >
                    <td className="p-1.5 border border-slate-300 dark:border-slate-700 print:border-slate-900 text-center font-mono font-black">
                      {res.studentRoll}
                    </td>
                    <td className="p-1.5 border border-slate-300 dark:border-slate-700 print:border-slate-900 font-bold">
                      {res.studentName}
                    </td>

                    {displayedSubjects.map((sub) => {
                      const entry = resolveMark(res, sub);
                      if (!entry) {
                        return (
                          <td
                            key={sub.code}
                            className="p-1.5 border border-slate-300 dark:border-slate-700 print:border-slate-900 text-center text-slate-400 font-mono"
                          >
                            -
                          </td>
                        );
                      }
                      const subParts: string[] = [];
                      if (showCq) subParts.push(`C:${entry.cq ?? 0}`);
                      if (showMcq) subParts.push(`M:${entry.mcq ?? 0}`);
                      if (showPractical) subParts.push(`P:${entry.practical ?? 0}`);

                      return (
                        <td
                          key={sub.code}
                          className={`p-1.5 border border-slate-300 dark:border-slate-700 print:border-slate-900 text-center font-mono ${
                            sub.category === '৪র্থ বিষয়' ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          <div className={entry.letterGrade === 'F' ? 'text-rose-600 dark:text-rose-400 font-black' : 'font-bold'}>
                            {entry.hasMarks === false ? (
                              <span className="text-amber-600 dark:text-amber-400 text-[10px]">
                                {lang === 'bn' ? 'বাকি' : 'Pend'}
                              </span>
                            ) : (
                              <>
                                {fmtNum(entry.totalMarks, lang)}{' '}
                                <span className="text-[10px]">({entry.letterGrade})</span>
                              </>
                            )}
                          </div>
                          {subParts.length > 0 && (
                            <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">
                              {subParts.join(' ')}
                            </div>
                          )}
                          {showPfBadge && entry.hasMarks !== false && (
                            <div className="text-[9px] font-black">
                              <span className={entry.isPassed === false ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}>
                                {entry.isPassed === false ? 'FAIL' : 'PASS'}
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}

                    <td className="p-1.5 border border-slate-300 dark:border-slate-700 print:border-slate-900 text-center font-mono font-black">
                      {fmtNum(res.totalObtainedMarks, lang)}
                    </td>
                    <td className="p-1.5 border border-slate-300 dark:border-slate-700 print:border-slate-900 text-center font-mono font-black bg-indigo-50/40 dark:bg-indigo-950/30">
                      {fmtNum((res.isPassed ? res.gpa : 0).toFixed(2), lang)}
                    </td>
                    <td className="p-1.5 border border-slate-300 dark:border-slate-700 print:border-slate-900 text-center font-black">
                      {res.letterGrade}
                    </td>
                    {showMerit && (
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700 print:border-slate-900 text-center font-mono font-bold">
                        {res.isPassed ? fmtNum(res.meritPosition, lang) : '-'}
                      </td>
                    )}
                    <td className="p-1.5 border border-slate-300 dark:border-slate-700 print:border-slate-900 text-center">
                      {res.isPassed ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black">
                          {lang === 'bn' ? 'পাস' : 'PASS'}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-black">
                          {lang === 'bn' ? `ফেল (${toBnDigits(res.failedCount)})` : `FAIL (${res.failedCount})`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="mt-2 flex flex-wrap items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 print:text-slate-700">
            <span>
              ● {lang === 'bn' ? 'বেগুনি ডট = যুগ্ম পত্র (Combined Paper) • ★ = ৪র্থ/ঐচ্ছিক বিষয় (GP > ২.০০ বোনাস)' : 'Purple dot = Combined Paper • ★ = Optional 4th Subject'}
            </span>
            <span>
              {lang === 'bn'
                ? `মোট: ${toBnDigits(filteredRows.length)} | পাস: ${toBnDigits(filteredRows.filter((r) => r.isPassed).length)}`
                : `Total: ${filteredRows.length} | Passed: ${filteredRows.filter((r) => r.isPassed).length}`}
            </span>
          </div>

          <PrintSignatureStrip lang={lang} />
        </div>
      </div>
    </div>
  );
}

export function MeritListView({
  examTitle,
  gradeLabel,
  sectionLabel,
  lang,
  settings,
  rankedResults,
  tieBreakers,
  hideHeader,
  onOpenTieBreakers,
}: {
  examTitle: string;
  gradeLabel: string;
  sectionLabel: string;
  lang: AppLanguage;
  settings: Partial<SchoolSettings> | null;
  rankedResults: RankedStudentResult[];
  tieBreakers: TieBreakerRule[];
  hideHeader: boolean;
  onOpenTieBreakers: () => void;
}) {
  const [topNInput, setTopNInput] = useState('');
  const [includeFailedBelow, setIncludeFailedBelow] = useState(false);

  const visibleList = useMemo(() => {
    const base = includeFailedBelow ? rankedResults : rankedResults.filter((r) => r.isPassed);
    const limit = parseInt(topNInput.trim(), 10);
    if (!Number.isNaN(limit) && limit > 0) {
      return base.slice(0, limit);
    }
    return base;
  }, [rankedResults, includeFailedBelow, topNInput]);

  const activeRuleSummary = tieBreakers
    .filter((r) => r.enabled)
    .map((r) => (lang === 'bn' ? r.labelBn : r.labelEn))
    .join(' → ');

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400">
              {lang === 'bn' ? 'শীর্ষ সংখ্যা (Top N):' : 'Top N:'}
            </span>
            <input
              type="number"
              min={1}
              value={topNInput}
              onChange={(e) => setTopNInput(e.target.value)}
              placeholder={lang === 'bn' ? 'সব' : 'All'}
              className="w-20 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={includeFailedBelow}
              onChange={(e) => setIncludeFailedBelow(e.target.checked)}
              className="accent-indigo-600 cursor-pointer"
            />
            {lang === 'bn' ? 'অকৃতকার্যদের নিচে দেখাও' : 'Include Failed Below'}
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenTieBreakers}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <SlidersHorizontal size={13} />
            {lang === 'bn' ? 'র‍্যাংকিং নিয়ম' : 'Rank Order'}
          </button>
        </div>
      </div>

      {/* Bento Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 print:border-slate-300">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'মোট পরীক্ষার্থী' : 'Total Cohort'}
          </div>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white print:text-slate-950">
            {fmtNum(rankedResults.length, lang)}
          </div>
        </div>
        <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3.5 print:bg-white print:border-slate-300">
          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            {lang === 'bn' ? 'সকল বিষয়ে উত্তীর্ণ' : 'Total Passed'}
          </div>
          <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300 print:text-slate-950">
            {fmtNum(rankedResults.filter((r) => r.isPassed).length, lang)}
          </div>
        </div>
        <div className="bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-3.5 print:bg-white print:border-slate-300">
          <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
            {lang === 'bn' ? 'অকৃতকার্য' : 'Total Failed'}
          </div>
          <div className="text-xl font-black font-mono text-rose-700 dark:text-rose-300 print:text-slate-950">
            {fmtNum(rankedResults.filter((r) => !r.isPassed).length, lang)}
          </div>
        </div>
      </div>

      {/* Printable Merit Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs print:bg-white print:text-slate-950 print:border-none print:shadow-none print:p-0 overflow-x-auto">
        <PrintInstitutionalHeader
          settings={settings}
          reportTitle={lang === 'bn' ? 'অফিশিয়াল মেধাতালিকা' : 'OFFICIAL MERIT LIST'}
          subtitle={`${examTitle} • ${gradeLabel} • ${sectionLabel}`}
          hideHeader={hideHeader}
          lang={lang}
        />

        <div className="mb-3 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-600 dark:text-slate-300 print:bg-slate-100 print:text-slate-900">
          {lang === 'bn' ? 'ক্রম নির্ধারণ সূত্র:' : 'Tie-Breaking Order:'} {activeRuleSummary}
        </div>

        <table className="w-full text-xs border-collapse border border-slate-200 dark:border-slate-700 print:border-slate-900">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200 font-black text-slate-900 dark:text-white print:text-slate-950">
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center w-20">
                {lang === 'bn' ? 'মেধাস্থান' : 'Merit'}
              </th>
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center w-16">
                {lang === 'bn' ? 'রোল' : 'Roll'}
              </th>
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-left">
                {lang === 'bn' ? 'শিক্ষার্থীর নাম' : 'Student Name'}
              </th>
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'শাখা' : 'Sec'}
              </th>
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'মোট নম্বর (%)' : 'Total Marks (%)'}
              </th>
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                GPA
              </th>
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'গ্রেড' : 'Grade'}
              </th>
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'ফলাফল' : 'Result'}
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleList.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400 font-bold">
                  {lang === 'bn' ? 'মেধাতালিকায় প্রদর্শনের মতো উত্তীর্ণ শিক্ষার্থী পাওয়া যায়নি।' : 'No passed students in merit list.'}
                </td>
              </tr>
            ) : (
              visibleList.map((res, idx) => {
                const pos = idx + 1;
                return (
                  <tr key={res.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100 print:text-slate-950">
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-black">
                      {res.isPassed ? (
                        <span className="inline-flex items-center gap-1">
                          {pos === 1 && <Trophy size={14} className="text-amber-500" />}
                          {pos === 2 && <Award size={14} className="text-slate-400" />}
                          {pos === 3 && <Award size={14} className="text-amber-700" />}
                          {fmtNum(pos, lang)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono font-bold">
                      {res.studentRoll}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 font-bold">
                      {res.studentName}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                      {res.branch}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono font-bold">
                      {fmtNum(res.totalObtainedMarks, lang)} ({fmtNum(res.obtainedPercentage ?? 0, lang)}%)
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono font-black text-indigo-700 dark:text-indigo-300 print:text-slate-950">
                      {fmtNum((res.isPassed ? res.gpa : 0).toFixed(2), lang)}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-black">
                      {res.letterGrade}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                      {res.isPassed ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                          {lang === 'bn' ? 'উত্তীর্ণ' : 'PASSED'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                          {lang === 'bn' ? `ফেল (${toBnDigits(res.failedCount)})` : `FAILED (${res.failedCount})`}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <PrintSignatureStrip lang={lang} />
      </div>
    </div>
  );
}

export function FailAnalysisView({
  examTitle,
  gradeLabel,
  sectionLabel,
  lang,
  settings,
  rankedResults,
  hideHeader,
  minFailCount,
  onChangeMinFailCount,
}: {
  examTitle: string;
  gradeLabel: string;
  sectionLabel: string;
  lang: AppLanguage;
  settings: Partial<SchoolSettings> | null;
  rankedResults: RankedStudentResult[];
  hideHeader: boolean;
  minFailCount: number;
  onChangeMinFailCount: (n: number) => void;
}) {
  const failEntries = useMemo(
    () => buildFailList(rankedResults, minFailCount),
    [rankedResults, minFailCount],
  );

  const singleSubFail = rankedResults.filter((r) => r.failedCount === 1).length;
  const multiSubFail = rankedResults.filter((r) => r.failedCount >= 2).length;

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
          <label className="text-slate-600 dark:text-slate-300">
            {lang === 'bn' ? 'ন্যূনতম ফেল বিষয় ফিল্টার:' : 'Failed in at least:'}
          </label>
          <select
            value={minFailCount}
            onChange={(e) => onChangeMinFailCount(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 font-black cursor-pointer"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {lang === 'bn' ? `${toBnDigits(n)} বা ততোধিক বিষয়` : `${n}+ subject(s)`}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
              {lang === 'bn' ? `১ বিষয়ে ফেল: ${toBnDigits(singleSubFail)}` : `1 Subject: ${singleSubFail}`}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
              {lang === 'bn' ? `একাধিক বিষয়: ${toBnDigits(multiSubFail)}` : `2+ Subjects: ${multiSubFail}`}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs print:bg-white print:text-slate-950 print:border-none print:shadow-none print:p-0 overflow-x-auto">
        <PrintInstitutionalHeader
          settings={settings}
          reportTitle={lang === 'bn' ? 'অকৃতকার্য শিক্ষার্থী বিশ্লেষণ তালিকা' : 'FAILED STUDENTS ANALYSIS'}
          subtitle={`${examTitle} • ${gradeLabel} • ${sectionLabel}`}
          hideHeader={hideHeader}
          lang={lang}
        />

        {failEntries.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
            <h4 className="text-sm font-black text-slate-900 dark:text-white print:text-slate-950">
              {lang === 'bn'
                ? 'এই ফিল্টার অনুযায়ী কোনো অকৃতকার্য শিক্ষার্থী নেই!'
                : 'No failed students matched this filter!'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'bn'
                ? 'শতভাগ উত্তীর্ণ অথবা ন্যূনতম ফেল বিষয়ের ফিল্টার শর্তে কেউ পড়েনি।'
                : 'All evaluated students cleared the selected threshold.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-xs border-collapse border border-slate-200 dark:border-slate-700 print:border-slate-900">
            <thead>
              <tr className="bg-rose-50 dark:bg-rose-950/50 print:bg-slate-200 font-black text-slate-900 dark:text-white print:text-slate-950">
                <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 w-10 text-center">#</th>
                <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 w-16 text-center">
                  {lang === 'bn' ? 'রোল' : 'Roll'}
                </th>
                <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-left">
                  {lang === 'bn' ? 'শিক্ষার্থীর নাম' : 'Student Name'}
                </th>
                <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 w-20 text-center">
                  {lang === 'bn' ? 'ফেল সংখ্যা' : 'Failed'}
                </th>
                <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-left">
                  {lang === 'bn' ? 'অকৃতকার্য বিষয় ও ঘাটতি বিবরণ' : 'Failed Subjects & Deficit'}
                </th>
                <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 w-24 text-center">
                  {lang === 'bn' ? 'মোট নম্বর' : 'Total Marks'}
                </th>
              </tr>
            </thead>
            <tbody>
              {failEntries.map((entry, idx) => (
                <tr key={entry.result.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100 print:text-slate-950">
                  <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono">
                    {fmtNum(idx + 1, lang)}
                  </td>
                  <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono font-black">
                    {entry.result.studentRoll}
                  </td>
                  <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 font-bold">
                    {entry.result.studentName}
                  </td>
                  <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[11px]">
                      {fmtNum(entry.result.failedCount, lang)}
                    </span>
                  </td>
                  <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900">
                    <div className="flex flex-wrap gap-1.5">
                      {entry.failedDetails.map((d) => (
                        <span
                          key={d.subjectCode}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-[11px] font-bold text-rose-800 dark:text-rose-200 print:bg-white print:text-slate-900"
                        >
                          <XCircle size={11} className="shrink-0" />
                          <span>
                            {d.subjectName}: {fmtNum(d.obtained, lang)}/{fmtNum(d.minPassMarks, lang)}
                            {d.isPending
                              ? lang === 'bn'
                                ? ' (বাকি)'
                                : ' (Pending)'
                              : d.failedComponents.length > 0
                              ? ` [${d.failedComponents.join(', ')}]`
                              : d.deficit > 0
                              ? lang === 'bn'
                                ? ` (-${toBnDigits(d.deficit)})`
                                : ` (-${d.deficit})`
                              : ''}
                          </span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono font-bold">
                    {fmtNum(entry.result.totalObtainedMarks, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <PrintSignatureStrip lang={lang} />
      </div>
    </div>
  );
}

export function FullResultRegisterView({
  examTitle,
  gradeLabel,
  sectionLabel,
  lang,
  settings,
  rankedResults,
  tieBreakers,
  hideHeader,
  onOpenTieBreakers,
}: {
  examTitle: string;
  gradeLabel: string;
  sectionLabel: string;
  lang: AppLanguage;
  settings: Partial<SchoolSettings> | null;
  rankedResults: RankedStudentResult[];
  tieBreakers: TieBreakerRule[];
  hideHeader: boolean;
  onOpenTieBreakers: () => void;
}) {
  const [cols, setCols] = useState({
    totalMarks: true,
    gpa: true,
    gpaWithout4th: false,
    grade: true,
    failCount: true,
    failedSubjects: true,
    merit: true,
    status: true,
  });

  const toggleCol = (key: keyof typeof cols) => {
    setCols((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeOrderText = tieBreakers
    .filter((r) => r.enabled)
    .map((r) => (lang === 'bn' ? r.labelBn : r.labelEn))
    .join(' → ');

  return (
    <div className="space-y-4">
      {/* Column Customizer & Order Button */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
          {[
            { key: 'totalMarks' as const, label: lang === 'bn' ? 'মোট নম্বর' : 'Total Marks' },
            { key: 'gpa' as const, label: 'GPA' },
            { key: 'gpaWithout4th' as const, label: lang === 'bn' ? '৪র্থ ছাড়া GPA' : 'GPA (No 4th)' },
            { key: 'grade' as const, label: lang === 'bn' ? 'গ্রেড' : 'Grade' },
            { key: 'failCount' as const, label: lang === 'bn' ? 'ফেল সংখ্যা' : 'Fail Count' },
            { key: 'failedSubjects' as const, label: lang === 'bn' ? 'অকৃতকার্য বিষয়' : 'Failed Subjects' },
            { key: 'merit' as const, label: lang === 'bn' ? 'মেধাক্রম' : 'Merit' },
            { key: 'status' as const, label: lang === 'bn' ? 'ফলাফল' : 'Result' },
          ].map((c) => (
            <label
              key={c.key}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border cursor-pointer transition ${
                cols[c.key]
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <input
                type="checkbox"
                checked={cols[c.key]}
                onChange={() => toggleCol(c.key)}
                className="accent-indigo-600 cursor-pointer"
              />
              {c.label}
            </label>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenTieBreakers}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-black cursor-pointer"
          >
            <SlidersHorizontal size={13} />
            {lang === 'bn' ? 'টাই-ব্রেকার ক্রম' : 'Result Order'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs print:bg-white print:text-slate-950 print:border-none print:shadow-none print:p-0 overflow-x-auto">
        <PrintInstitutionalHeader
          settings={settings}
          reportTitle={lang === 'bn' ? 'পূর্ণ ফলাফল রেজিস্টার' : 'FULL RESULT REGISTER'}
          subtitle={`${examTitle} • ${gradeLabel} • ${sectionLabel}`}
          hideHeader={hideHeader}
          lang={lang}
        />

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 print:text-slate-800">
          <span>
            {lang === 'bn' ? 'ক্রম:' : 'Order:'} {activeOrderText}
          </span>
          <span>
            {lang === 'bn' ? `মোট শিক্ষার্থী: ${toBnDigits(rankedResults.length)}` : `Total: ${rankedResults.length}`}
          </span>
        </div>

        <table className="w-full text-xs border-collapse border border-slate-200 dark:border-slate-700 print:border-slate-900">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200 font-black text-slate-900 dark:text-white print:text-slate-950">
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 w-10 text-center">SL</th>
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 w-16 text-center">
                {lang === 'bn' ? 'রোল' : 'Roll'}
              </th>
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-left">
                {lang === 'bn' ? 'নাম' : 'Student Name'}
              </th>
              {cols.totalMarks && (
                <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                  {lang === 'bn' ? 'মোট নম্বর' : 'Total Marks'}
                </th>
              )}
              {cols.gpaWithout4th && (
                <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                  {lang === 'bn' ? 'GPA (৪র্থ ছাড়া)' : 'GPA (No 4th)'}
                </th>
              )}
              {cols.gpa && (
                <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                  GPA
                </th>
              )}
              {cols.grade && (
                <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                  {lang === 'bn' ? 'গ্রেড' : 'Grade'}
                </th>
              )}
              {cols.failCount && (
                <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                  {lang === 'bn' ? 'ফেল' : 'Fails'}
                </th>
              )}
              {cols.failedSubjects && (
                <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-left">
                  {lang === 'bn' ? 'অকৃতকার্য বিষয়সমূহ' : 'Failed Subjects'}
                </th>
              )}
              {cols.merit && (
                <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                  {lang === 'bn' ? 'মেধা' : 'Merit'}
                </th>
              )}
              {cols.status && (
                <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                  {lang === 'bn' ? 'অবস্থা' : 'Result'}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rankedResults.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-slate-500 dark:text-slate-400 font-bold">
                  <AlertCircle size={20} className="mx-auto mb-1 text-slate-400" />
                  {lang === 'bn' ? 'কোনো শিক্ষার্থীর ফলাফল পাওয়া যায়নি।' : 'No result records available.'}
                </td>
              </tr>
            ) : (
              rankedResults.map((res, idx) => (
                <tr key={res.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100 print:text-slate-950">
                  <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono">
                    {fmtNum(idx + 1, lang)}
                  </td>
                  <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono font-bold">
                    {res.studentRoll}
                  </td>
                  <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 font-bold">
                    {res.studentName}
                  </td>
                  {cols.totalMarks && (
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono font-bold">
                      {fmtNum(res.totalObtainedMarks, lang)}
                    </td>
                  )}
                  {cols.gpaWithout4th && (
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono">
                      {fmtNum(res.gpaWithout4th.toFixed(2), lang)}
                    </td>
                  )}
                  {cols.gpa && (
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono font-black text-indigo-700 dark:text-indigo-300 print:text-slate-950">
                      {fmtNum((res.isPassed ? res.gpa : 0).toFixed(2), lang)}
                    </td>
                  )}
                  {cols.grade && (
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-black">
                      {res.letterGrade}
                    </td>
                  )}
                  {cols.failCount && (
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono">
                      {fmtNum(res.failedCount, lang)}
                    </td>
                  )}
                  {cols.failedSubjects && (
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-[11px] text-rose-700 dark:text-rose-300 print:text-slate-900">
                      {res.failedSubjects.length > 0 ? res.failedSubjects.join(', ') : '-'}
                    </td>
                  )}
                  {cols.merit && (
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono font-bold">
                      {res.isPassed ? fmtNum(res.meritPosition, lang) : '-'}
                    </td>
                  )}
                  {cols.status && (
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                      {res.isPassed ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                          {lang === 'bn' ? 'উত্তীর্ণ' : 'PASSED'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                          {lang === 'bn' ? 'অকৃতকার্য' : 'FAILED'}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        <PrintSignatureStrip lang={lang} />
      </div>
    </div>
  );
}
