'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  BarChart3,
  LayoutGrid,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { ExamItem } from '@/services/examService';

export interface SubjectHeatmapCell {
  gradeKey: string;
  gradeLabel: string;
  subjectName: string;
  assessedCount: number;
  passCount: number;
  failCount: number;
  passRate: number;
  avgMarks: number;
}

interface Props {
  rows: SubjectHeatmapCell[];
  exams: ExamItem[];
  selectedExam: string;
  onChangeExam: (examTitle: string) => void;
  selectedGrade: string;
  onChangeGrade: (grade: string) => void;
  lang?: 'bn' | 'en';
}

const GRADE_OPTIONS = [
  { key: '6th', labelBn: '৬ষ্ঠ শ্রেণি', labelEn: 'Class 6' },
  { key: '7th', labelBn: '৭ম শ্রেণি', labelEn: 'Class 7' },
  { key: '8th', labelBn: '৮ম শ্রেণি', labelEn: 'Class 8' },
  { key: '9th', labelBn: '৯ম শ্রেণি', labelEn: 'Class 9' },
  { key: '10th', labelBn: '১০ম শ্রেণি', labelEn: 'Class 10' },
];

export default function SubjectPerformanceHeatmap({
  rows,
  exams,
  selectedExam,
  onChangeExam,
  selectedGrade,
  onChangeGrade,
  lang = 'bn',
}: Props) {
  const [displayMode, setDisplayMode] = useState<'chart' | 'heatmap'>('chart');

  const summary = useMemo(() => {
    if (rows.length === 0) {
      return { avgPassRate: 0, avgScore: 0, strongCount: 0, riskCount: 0 };
    }
    const avgPassRate = Math.round(rows.reduce((s, r) => s + r.passRate, 0) / rows.length);
    const avgScore = Math.round(rows.reduce((s, r) => s + r.avgMarks, 0) / rows.length);
    const strongCount = rows.filter((r) => r.passRate >= 80).length;
    const riskCount = rows.filter((r) => r.passRate < 60).length;
    return { avgPassRate, avgScore, strongCount, riskCount };
  }, [rows]);

  const sortedForChart = useMemo(
    () => [...rows].sort((a, b) => b.passRate - a.passRate || b.avgMarks - a.avgMarks),
    [rows],
  );

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
      {/* Header + Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shrink-0">
            <TrendingUp size={19} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
              {lang === 'en'
                ? 'Subject Performance Analytics & Pass/Fail Heatmap'
                : 'বিষয়ভিত্তিক ফলাফল চার্ট ও পাস/ফেল হিটম্যাপ'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {lang === 'en'
                ? 'Pass percentage & mean score per subject (Green ≥80%, Amber 60–79%, Red <60%)'
                : 'পরীক্ষা ও শ্রেণি অনুযায়ী প্রতিটি বিষয়ের গড় নম্বর এবং পাসের হার (সবুজ ≥৮০%, হলুদ ৬০–৭৯%, লাল <৬০%)'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          {/* Chart vs Heatmap Toggle */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setDisplayMode('chart')}
              className={`px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer ${
                displayMode === 'chart'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 size={13} />
              <span>{lang === 'en' ? 'Bar Chart' : 'বার চার্ট'}</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('heatmap')}
              className={`px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer ${
                displayMode === 'heatmap'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid size={13} />
              <span>{lang === 'en' ? 'Heatmap' : 'হিটম্যাপ'}</span>
            </button>
          </div>

          <select
            value={selectedExam}
            onChange={(e) => onChangeExam(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:border-indigo-500 cursor-pointer"
          >
            {exams.length === 0 ? (
              <option value={selectedExam}>{selectedExam}</option>
            ) : (
              exams.map((ex) => (
                <option key={ex.id} value={ex.title}>
                  {ex.title}
                </option>
              ))
            )}
          </select>

          <select
            value={selectedGrade}
            onChange={(e) => onChangeGrade(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">{lang === 'en' ? 'All Classes' : 'সকল শ্রেণি'}</option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g.key} value={g.key}>
                {lang === 'en' ? g.labelEn : g.labelBn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Summary Pills */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">
                {lang === 'en' ? 'Avg Pass Rate' : 'গড় পাসের হার'}
              </span>
              <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
                {summary.avgPassRate}%
              </span>
            </div>
            <TrendingUp size={18} className="text-indigo-500/70" />
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">
                {lang === 'en' ? 'Mean Score' : 'গড় প্রাপ্ত নম্বর'}
              </span>
              <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                {summary.avgScore}
              </span>
            </div>
            <BookOpen size={18} className="text-sky-500/70" />
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">
                {lang === 'en' ? 'Strong (≥80%)' : 'উত্তম বিষয় (≥৮০%)'}
              </span>
              <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300">
                {summary.strongCount}
              </span>
            </div>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>

          <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 block">
                {lang === 'en' ? 'Needs Focus (<60%)' : 'দুর্বল বিষয় (<৬০%)'}
              </span>
              <span className="text-lg font-black font-mono text-rose-700 dark:text-rose-300">
                {summary.riskCount}
              </span>
            </div>
            <AlertTriangle size={18} className="text-rose-500" />
          </div>
        </div>
      )}

      {/* Body */}
      {rows.length === 0 ? (
        <div className="py-10 px-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-11 h-11 mx-auto rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center">
            <BarChart3 size={20} />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
              {lang === 'en'
                ? 'No marks recorded for this examination yet'
                : 'নির্বাচিত পরীক্ষার জন্য এখনো কোনো নম্বর এন্ট্রি পাওয়া যায়নি'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {lang === 'en'
                ? 'Once teachers submit subject scores, interactive pass-rate bar charts and subject heatmaps will populate automatically.'
                : 'শিক্ষকরা পরীক্ষার নম্বর এন্ট্রি সম্পন্ন করলেই এখানে বিষয়ভিত্তিক বার চার্ট ও পাস-ফেল হিটম্যাপ স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।'}
            </p>
          </div>
          <Link
            href="/dashboard/exam/mark-entry"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition no-print"
          >
            <span>{lang === 'en' ? 'Go to Mark Entry' : 'নম্বর এন্ট্রি প্যানেলে যান'}</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>
      ) : displayMode === 'chart' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {sortedForChart.map((cell) => {
            const barTone =
              cell.passRate >= 80
                ? 'from-emerald-500 to-teal-500'
                : cell.passRate >= 60
                  ? 'from-amber-400 to-orange-500'
                  : 'from-rose-500 to-red-600';
            const badgeTone =
              cell.passRate >= 80
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60'
                : cell.passRate >= 60
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60'
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60';

            return (
              <div
                key={`${cell.gradeKey}-${cell.subjectName}`}
                className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">
                      {cell.gradeLabel} শ্রেণি
                    </span>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {cell.subjectName}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-[10.5px] font-mono font-bold text-slate-600 dark:text-slate-300">
                      {lang === 'en' ? 'Avg' : 'গড়'}: {cell.avgMarks}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-black ${badgeTone}`}
                    >
                      {cell.passRate}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barTone} transition-all duration-500`}
                    style={{ width: `${Math.max(4, Math.min(100, cell.passRate))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                  <span>
                    {lang === 'en' ? 'Passed' : 'উত্তীর্ণ'}:{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                      {cell.passCount}
                    </strong>{' '}
                    • {lang === 'en' ? 'Failed' : 'অকৃতকার্য'}:{' '}
                    <strong className="text-rose-600 dark:text-rose-400 font-mono">
                      {cell.failCount}
                    </strong>
                  </span>
                  <span className="font-mono">
                    {lang === 'en' ? 'Assessed' : 'পরীক্ষার্থী'}: {cell.assessedCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {rows.map((cell) => {
            const toneClass =
              cell.passRate >= 80
                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40'
                : cell.passRate >= 60
                  ? 'border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40'
                  : 'border-rose-200 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/40';
            const badgeClass =
              cell.passRate >= 80
                ? 'bg-emerald-600 text-white'
                : cell.passRate >= 60
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-rose-600 text-white';

            return (
              <div
                key={`${cell.gradeKey}-${cell.subjectName}`}
                className={`p-3.5 rounded-2xl border space-y-2 ${toneClass}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">
                      {cell.gradeLabel} শ্রেণি
                    </span>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white leading-snug truncate">
                      {cell.subjectName}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${badgeClass}`}
                  >
                    {cell.passRate}% {lang === 'en' ? 'Pass' : 'পাস'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <span>
                    {lang === 'en' ? 'Pass' : 'উত্তীর্ণ'}: {cell.passCount} •{' '}
                    {lang === 'en' ? 'Fail' : 'অকৃতকার্য'}: {cell.failCount}
                  </span>
                  <span>
                    {lang === 'en' ? 'Avg' : 'গড়'}: {cell.avgMarks}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
