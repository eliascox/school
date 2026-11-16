'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Printer,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { DynamicClassSubject } from '@/lib/curriculumUtils';
import {
  AllSubjectsSummaryAggregate,
  ClassSectionSummaryRow,
  createEmptyGradeDistribution,
  GRADE_BUCKETS,
  incrementGradeBucket,
  SubjectWiseReport,
} from '@/lib/resultAnalyticsEngine';
import { AppLanguage } from '@/services/languageService';
import { SchoolSettings } from '@/services/settingsService';
import {
  fmtNum,
  GRADE_LABELS,
  GradeDistributionBarChart,
  PrintInstitutionalHeader,
  PrintSignatureStrip,
  toBnDigits,
} from './resultStudioShared';

export function ClassSectionSummaryView({
  examTitle,
  gradeLabel,
  sectionLabel,
  lang,
  settings,
  rows,
  hideHeader,
}: {
  examTitle: string;
  gradeLabel: string;
  sectionLabel: string;
  lang: AppLanguage;
  settings: Partial<SchoolSettings> | null;
  rows: ClassSectionSummaryRow[];
  hideHeader: boolean;
}) {
  const aggregate = useMemo(() => {
    const dist = createEmptyGradeDistribution();
    let total = 0;
    let appeared = 0;
    let pending = 0;
    let passed = 0;
    let failed = 0;
    let passedGpaWeighted = 0;

    for (const r of rows) {
      total += r.totalStudents;
      appeared += r.appearedCount;
      pending += r.pendingCount;
      passed += r.passedCount;
      failed += r.failedCount;
      passedGpaWeighted += r.avgPassedGpa * r.passedCount;
      for (const b of GRADE_BUCKETS) {
        dist[b] += r.gradeDistribution[b] || 0;
      }
    }

    const denom = appeared > 0 ? appeared : total;
    return {
      total,
      appeared,
      pending,
      passed,
      failed,
      passRate: denom > 0 ? Number(((passed / denom) * 100).toFixed(1)) : 0,
      avgPassedGpa: passed > 0 ? Number((passedGpaWeighted / passed).toFixed(2)) : 0,
      dist,
    };
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer shadow-xs"
        >
          <Printer size={13} />
          {lang === 'bn' ? 'সারসংক্ষেপ প্রিন্ট' : 'Print Summary'}
        </button>
      </div>

      {/* Bento KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 print:border-slate-300">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'মোট শিক্ষার্থী' : 'Total Cohort'}
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white print:text-slate-950">
            {fmtNum(aggregate.total, lang)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'bn'
              ? `মূল্যায়িত: ${toBnDigits(aggregate.appeared)} | বাকি: ${toBnDigits(aggregate.pending)}`
              : `Appeared: ${aggregate.appeared} | Pending: ${aggregate.pending}`}
          </div>
        </div>

        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 print:bg-white print:border-slate-300">
          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            {lang === 'bn' ? 'উত্তীর্ণ ও পাসের হার' : 'Passed & Pass Rate'}
          </div>
          <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300 print:text-slate-950">
            {fmtNum(aggregate.passed, lang)} ({fmtNum(aggregate.passRate, lang)}%)
          </div>
        </div>

        <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-4 print:bg-white print:border-slate-300">
          <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
            {lang === 'bn' ? 'অকৃতকার্য সংখ্যা' : 'Failed Count'}
          </div>
          <div className="text-2xl font-black font-mono text-rose-700 dark:text-rose-300 print:text-slate-950">
            {fmtNum(aggregate.failed, lang)}
          </div>
        </div>

        <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-4 print:bg-white print:border-slate-300">
          <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
            {lang === 'bn' ? 'উত্তীর্ণ গড় GPA' : 'Mean Passed GPA'}
          </div>
          <div className="text-2xl font-black font-mono text-indigo-700 dark:text-indigo-300 print:text-slate-950">
            {fmtNum(aggregate.avgPassedGpa.toFixed(2), lang)}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 print:bg-white print:text-slate-950 print:border-none print:shadow-none print:p-0 overflow-x-auto">
        <PrintInstitutionalHeader
          settings={settings}
          reportTitle={lang === 'bn' ? 'শ্রেণি ও শাখাভিত্তিক ফলাফল সারসংক্ষেপ' : 'CLASS & SECTION SUMMARY REPORT'}
          subtitle={`${examTitle} • ${gradeLabel} • ${sectionLabel}`}
          hideHeader={hideHeader}
          lang={lang}
        />

        <GradeDistributionBarChart distribution={aggregate.dist} lang={lang} />

        <table className="w-full text-xs border-collapse border border-slate-200 dark:border-slate-700 print:border-slate-900">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200 font-black text-slate-900 dark:text-white print:text-slate-950">
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-left">
                {lang === 'bn' ? 'শ্রেণি' : 'Class'}
              </th>
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'শাখা' : 'Section'}
              </th>
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'মোট' : 'Total'}
              </th>
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'উপস্থিত' : 'Appeared'}
              </th>
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'বাকি' : 'Pending'}
              </th>
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'পাস' : 'Pass'}
              </th>
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'ফেল' : 'Fail'}
              </th>
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'পাস %' : 'Pass %'}
              </th>
              <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'গড় GPA' : 'Avg GPA'}
              </th>
              {GRADE_BUCKETS.map((b) => (
                <th
                  key={b}
                  className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center w-10"
                >
                  {b}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={16} className="p-8 text-center font-bold text-slate-500 dark:text-slate-400">
                  {lang === 'bn' ? 'কোনো শ্রেণির সারসংক্ষেপ পাওয়া যায়নি।' : 'No class summary data available.'}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const gLabel = GRADE_LABELS[row.grade]?.[lang] || row.grade;
                return (
                  <tr
                    key={`${row.grade}_${row.section}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100 print:text-slate-950"
                  >
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 font-bold">
                      {gLabel}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-bold">
                      {row.section}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono">
                      {fmtNum(row.totalStudents, lang)}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono">
                      {fmtNum(row.appearedCount, lang)}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono text-amber-600 dark:text-amber-400">
                      {fmtNum(row.pendingCount, lang)}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {fmtNum(row.passedCount, lang)}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono font-bold text-rose-700 dark:text-rose-400">
                      {fmtNum(row.failedCount, lang)}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono font-black">
                      {fmtNum(row.passRate, lang)}%
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono font-black text-indigo-700 dark:text-indigo-300">
                      {fmtNum(row.avgPassedGpa.toFixed(2), lang)}
                    </td>
                    {GRADE_BUCKETS.map((b) => (
                      <td
                        key={b}
                        className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono"
                      >
                        {fmtNum(row.gradeDistribution[b], lang)}
                      </td>
                    ))}
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

export function SubjectWiseAnalysisView({
  examTitle,
  gradeLabel,
  sectionLabel,
  lang,
  settings,
  subjects,
  selectedSubjectCode,
  onSelectSubjectCode,
  report,
  hideHeader,
}: {
  examTitle: string;
  gradeLabel: string;
  sectionLabel: string;
  lang: AppLanguage;
  settings: Partial<SchoolSettings> | null;
  subjects: DynamicClassSubject[];
  selectedSubjectCode: string;
  onSelectSubjectCode: (code: string) => void;
  report: SubjectWiseReport | null;
  hideHeader: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pass' | 'fail' | 'pending'>('all');

  const filteredRows = useMemo(() => {
    if (!report) return [];
    if (statusFilter === 'all') return report.rows;
    return report.rows.filter((r) => r.status === statusFilter);
  }, [report, statusFilter]);

  const showCq = Number(report?.subject.cq) > 0 || filteredRows.some((r) => r.cq > 0);
  const showMcq = Number(report?.subject.mcq) > 0 || filteredRows.some((r) => r.mcq > 0);
  const showPr = Number(report?.subject.practical) > 0 || filteredRows.some((r) => r.practical > 0);
  const showCa = Number(report?.subject.ca) > 0 || filteredRows.some((r) => r.ca > 0);

  return (
    <div className="space-y-4">
      {/* Subject Selector Ribbon */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <BookOpen size={14} className="text-indigo-500" />
            {lang === 'bn' ? 'বিষয় নির্বাচন:' : 'Subject:'}
          </span>
          <select
            value={String(selectedSubjectCode)}
            onChange={(e) => onSelectSubjectCode(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black cursor-pointer min-w-[210px]"
          >
            {subjects.map((sub, idx) => (
              <option key={`${String(sub.code)}_${idx}`} value={String(sub.code)}>
                {sub.name} ({String(sub.code)}) — {sub.fullMarks}
              </option>
            ))}
          </select>

          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px]">
            {(
              [
                { id: 'all', bn: 'সবাই', en: 'All' },
                { id: 'pass', bn: 'পাস', en: 'Passed' },
                { id: 'fail', bn: 'ফেল', en: 'Failed' },
                { id: 'pending', bn: 'বাকি', en: 'Pending' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStatusFilter(opt.id)}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition ${
                  statusFilter === opt.id
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {lang === 'bn' ? opt.bn : opt.en}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer"
        >
          <Printer size={13} />
          {lang === 'bn' ? 'প্রিন্ট' : 'Print'}
        </button>
      </div>

      {!report ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center text-xs font-bold text-slate-500">
          {lang === 'bn' ? 'বিষয় নির্বাচন করুন।' : 'Select a subject to view analytics.'}
        </div>
      ) : (
        <>
          {/* 6 Bento KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              { label: lang === 'bn' ? 'মোট শিক্ষার্থী' : 'Students', val: fmtNum(report.totalStudents, lang), tone: 'slate' },
              { label: lang === 'bn' ? 'অংশগ্রহণ' : 'Appeared', val: fmtNum(report.appearedCount, lang), tone: 'sky' },
              {
                label: lang === 'bn' ? 'উত্তীর্ণ' : 'Passed',
                val: `${fmtNum(report.passedCount, lang)} (${fmtNum(report.passRate, lang)}%)`,
                tone: 'emerald',
              },
              { label: lang === 'bn' ? 'অকৃতকার্য' : 'Failed', val: fmtNum(report.failedCount, lang), tone: 'rose' },
              { label: lang === 'bn' ? 'গড় নম্বর' : 'Average', val: fmtNum(report.avgMarks, lang), tone: 'indigo' },
              {
                label: lang === 'bn' ? 'সর্বোচ্চ / সর্বনিম্ন' : 'High / Low',
                val: `${fmtNum(report.highestMarks, lang)} / ${fmtNum(report.lowestMarks, lang)}`,
                tone: 'amber',
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 print:border-slate-300"
              >
                <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">{kpi.label}</div>
                <div className="text-base font-black font-mono text-slate-900 dark:text-white print:text-slate-950 mt-0.5">
                  {kpi.val}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 print:bg-white print:text-slate-950 print:border-none print:shadow-none print:p-0 overflow-x-auto">
            <PrintInstitutionalHeader
              settings={settings}
              reportTitle={
                lang === 'bn'
                  ? `বিষয়ভিত্তিক ফলাফল: ${report.subject.name}`
                  : `SUBJECT REPORT: ${report.subject.name}`
              }
              subtitle={`${examTitle} • ${gradeLabel} • ${sectionLabel} • ${
                lang === 'bn'
                  ? `পূর্ণমান ${toBnDigits(report.subject.fullMarks)} (কোড: ${report.subject.code})`
                  : `Full Marks ${report.subject.fullMarks} (Code: ${report.subject.code})`
              }`}
              hideHeader={hideHeader}
              lang={lang}
            />

            <GradeDistributionBarChart distribution={report.gradeDistribution} lang={lang} />

            <table className="w-full text-xs border-collapse border border-slate-200 dark:border-slate-700 print:border-slate-900">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200 font-black text-slate-900 dark:text-white print:text-slate-950">
                  <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 w-10 text-center">SL</th>
                  <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 w-16 text-center">
                    {lang === 'bn' ? 'রোল' : 'Roll'}
                  </th>
                  <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-left">
                    {lang === 'bn' ? 'শিক্ষার্থীর নাম' : 'Student Name'}
                  </th>
                  {showCq && (
                    <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                      CQ
                    </th>
                  )}
                  {showMcq && (
                    <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                      MCQ
                    </th>
                  )}
                  {showPr && (
                    <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                      PR
                    </th>
                  )}
                  {showCa && (
                    <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                      CA
                    </th>
                  )}
                  <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                    {lang === 'bn' ? 'মোট' : 'Total'}
                  </th>
                  <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                    {lang === 'bn' ? 'গ্রেড' : 'Grade'}
                  </th>
                  <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                    GP
                  </th>
                  <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                    {lang === 'bn' ? 'অবস্থা' : 'Status'}
                  </th>
                  <th className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-left">
                    {lang === 'bn' ? 'মন্তব্য / অংশ ঘাটতি' : 'Remarks'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr
                    key={row.studentId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100 print:text-slate-950"
                  >
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono">
                      {fmtNum(idx + 1, lang)}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono font-bold">
                      {row.roll}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 font-bold">
                      {row.studentName}
                    </td>
                    {showCq && (
                      <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono">
                        {row.status === 'pending' ? '-' : fmtNum(row.cq, lang)}
                      </td>
                    )}
                    {showMcq && (
                      <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono">
                        {row.status === 'pending' ? '-' : fmtNum(row.mcq, lang)}
                      </td>
                    )}
                    {showPr && (
                      <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono">
                        {row.status === 'pending' ? '-' : fmtNum(row.practical, lang)}
                      </td>
                    )}
                    {showCa && (
                      <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono">
                        {row.status === 'pending' ? '-' : fmtNum(row.ca, lang)}
                      </td>
                    )}
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono font-black">
                      {row.status === 'pending' ? '-' : fmtNum(row.totalMarks, lang)}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-black">
                      {row.letterGrade}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono">
                      {row.status === 'pending' ? '-' : fmtNum(row.gradePoint.toFixed(2), lang)}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                      {row.status === 'pass' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                          {lang === 'bn' ? 'পাস' : 'PASS'}
                        </span>
                      )}
                      {row.status === 'fail' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                          {lang === 'bn' ? 'ফেল' : 'FAIL'}
                        </span>
                      )}
                      {row.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                          {lang === 'bn' ? 'বাকি' : 'PENDING'}
                        </span>
                      )}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-[11px] text-slate-600 dark:text-slate-300">
                      {row.failedComponents.length > 0
                        ? row.failedComponents.join(', ')
                        : row.deficit > 0
                        ? lang === 'bn'
                          ? `ঘাটতি ${toBnDigits(row.deficit)}`
                          : `Need ${row.deficit} more`
                        : row.status === 'pass'
                        ? lang === 'bn'
                          ? 'উত্তীর্ণ'
                          : 'Satisfactory'
                        : lang === 'bn'
                        ? 'নম্বর এন্ট্রি বাকি'
                        : 'Awaiting marks'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <PrintSignatureStrip lang={lang} />
          </div>
        </>
      )}
    </div>
  );
}

export function AllSubjectsHeatmapView({
  examTitle,
  gradeLabel,
  sectionLabel,
  lang,
  settings,
  summary,
  hideHeader,
  onInspectSubject,
}: {
  examTitle: string;
  gradeLabel: string;
  sectionLabel: string;
  lang: AppLanguage;
  settings: Partial<SchoolSettings> | null;
  summary: AllSubjectsSummaryAggregate;
  hideHeader: boolean;
  onInspectSubject: (subjectCode: string) => void;
}) {
  const tierStyles = {
    strong: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
    moderate: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-700',
    critical: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-700',
  };

  const overallGradeDist = useMemo(() => {
    const dist = createEmptyGradeDistribution();
    for (const row of summary.rows) {
      for (const b of GRADE_BUCKETS) {
        dist[b] += row.gradeDistribution[b] || 0;
      }
    }
    return dist;
  }, [summary]);

  return (
    <div className="space-y-4">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm;
          }
        }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {lang === 'bn' ? 'পাস ≥ ৮০%' : 'Pass >= 80%'}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {lang === 'bn' ? '৫০% – ৭৯%' : '50% - 79%'}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {lang === 'bn' ? 'পাস < ৫০%' : 'Pass < 50%'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer"
        >
          <Printer size={13} />
          {lang === 'bn' ? 'সব বিষয় প্রিন্ট' : 'Print Matrix'}
        </button>
      </div>

      {/* 4 Bento KPIs + Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 print:border-slate-300">
          <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'মোট শিক্ষার্থী / বিষয়' : 'Students / Subjects'}
          </div>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white print:text-slate-950">
            {fmtNum(summary.totalStudents, lang)} / {fmtNum(summary.totalSubjects, lang)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 print:border-slate-300">
          <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'গড় নম্বর ইনপুট কভারেজ' : 'Avg Entry Coverage'}
          </div>
          <div className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 print:text-slate-950">
            {fmtNum(summary.avgAttendanceRate, lang)}%
          </div>
        </div>
        <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3.5 print:bg-white print:border-slate-300">
          <div className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
            <TrendingUp size={12} />
            {lang === 'bn' ? 'সর্বোচ্চ পাসের বিষয়' : 'Top Performing Subject'}
          </div>
          <div className="text-sm font-black text-emerald-800 dark:text-emerald-200 print:text-slate-950 truncate mt-0.5">
            {summary.strongestSubject
              ? `${summary.strongestSubject.subject.name} (${fmtNum(summary.strongestSubject.passRate, lang)}%)`
              : '-'}
          </div>
        </div>
        <div className="bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-3.5 print:bg-white print:border-slate-300">
          <div className="text-[10px] font-extrabold text-rose-700 dark:text-rose-300 flex items-center gap-1">
            <TrendingDown size={12} />
            {lang === 'bn' ? 'বিশেষ নজরদারি প্রয়োজন' : 'Needs Attention'}
          </div>
          <div className="text-sm font-black text-rose-800 dark:text-rose-200 print:text-slate-950 truncate mt-0.5">
            {summary.weakestSubject
              ? `${summary.weakestSubject.subject.name} (${fmtNum(summary.weakestSubject.passRate, lang)}%)`
              : `${fmtNum(summary.avgPassRate, lang)}% Avg`}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 print:bg-white print:text-slate-950 print:border-none print:shadow-none print:p-0 overflow-x-auto">
        <PrintInstitutionalHeader
          settings={settings}
          reportTitle={lang === 'bn' ? 'সকল বিষয়ের তুলনামূলক সারসংক্ষেপ' : 'ALL SUBJECTS PERFORMANCE MATRIX'}
          subtitle={`${examTitle} • ${gradeLabel} • ${sectionLabel}`}
          hideHeader={hideHeader}
          lang={lang}
        />

        <GradeDistributionBarChart distribution={overallGradeDist} lang={lang} />

        <table className="w-full text-[11px] border-collapse border border-slate-200 dark:border-slate-700 print:border-slate-900">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200 font-black text-slate-900 dark:text-white print:text-slate-950">
              <th className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 w-8 text-center">SL</th>
              <th className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-left min-w-[140px]">
                {lang === 'bn' ? 'বিষয়ের নাম' : 'Subject'}
              </th>
              <th className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'কোড' : 'Code'}
              </th>
              <th className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'ধরণ' : 'Type'}
              </th>
              <th className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'পূর্ণমান' : 'Full'}
              </th>
              <th className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'উপস্থিত' : 'Pres'}
              </th>
              <th className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'বাকি' : 'Pend'}
              </th>
              <th className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center min-w-[92px]">
                {lang === 'bn' ? 'পাস %' : 'Pass %'}
              </th>
              <th className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'গড়' : 'Avg'}
              </th>
              <th className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'সর্বোচ্চ' : 'High'}
              </th>
              <th className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                {lang === 'bn' ? 'সর্বনিম্ন' : 'Low'}
              </th>
              {GRADE_BUCKETS.map((b) => (
                <th
                  key={b}
                  className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center w-8"
                >
                  {b}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.rows.map((row, idx) => (
              <tr
                key={`${String(row.subject.code)}_${idx}`}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100 print:text-slate-950"
              >
                <td className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono">
                  {fmtNum(idx + 1, lang)}
                </td>
                <td className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 font-bold">
                  <button
                    type="button"
                    onClick={() => onInspectSubject(String(row.subject.code))}
                    className="text-left hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer print:no-underline"
                    title={lang === 'bn' ? 'বিষয়ভিত্তিক বিস্তারিত দেখুন' : 'Drill down into subject'}
                  >
                    {row.subject.name}
                  </button>
                </td>
                <td className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono text-[10px]">
                  {String(row.subject.code)}
                </td>
                <td className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center text-[10px]">
                  {row.subject.category || 'আবশ্যিক'}
                </td>
                <td className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono">
                  {fmtNum(row.subject.fullMarks, lang)}
                </td>
                <td className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono font-bold">
                  {fmtNum(row.presentCount, lang)}
                </td>
                <td className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono text-amber-600 dark:text-amber-400">
                  {fmtNum(row.pendingCount, lang)}
                </td>
                <td className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center">
                  {row.presentCount === 0 ? (
                    <span className="text-slate-400 font-mono">0%</span>
                  ) : (
                    <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-black font-mono ${tierStyles[row.tier]}`}>
                      {fmtNum(row.passRate, lang)}%
                    </span>
                  )}
                </td>
                <td className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono">
                  {fmtNum(row.avgMarks, lang)}
                </td>
                <td className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {fmtNum(row.highestMarks, lang)}
                </td>
                <td className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono text-rose-700 dark:text-rose-400">
                  {fmtNum(row.lowestMarks, lang)}
                </td>
                {GRADE_BUCKETS.map((b) => (
                  <td
                    key={b}
                    className="p-1.5 border border-slate-200 dark:border-slate-700 print:border-slate-900 text-center font-mono"
                  >
                    {fmtNum(row.gradeDistribution[b], lang)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <PrintSignatureStrip lang={lang} />
      </div>
    </div>
  );
}
