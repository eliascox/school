'use client';

import React from 'react';
import Link from 'next/link';
import { UserCheck, UserX, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

export interface ClassAttendanceData {
  gradeKey: string;
  gradeLabel: string;
  total: number;
  present: number;
  absent: number;
  leave: number;
  rate: number;
  isTaken: boolean;
}

interface Props {
  data: ClassAttendanceData[];
  overallRate: number;
  grandTotal: number;
  totalPresent: number;
  totalAbsent: number;
  totalLeave: number;
  lang?: 'bn' | 'en';
}

export default function AttendanceTrendChart({
  data,
  overallRate,
  grandTotal,
  totalPresent,
  totalAbsent,
  totalLeave,
  lang = 'bn',
}: Props) {
  const takenCount = data.filter((c) => c.isTaken).length;

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50 flex items-center justify-center shrink-0">
            <UserCheck size={18} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base tracking-tight">
              {lang === 'en' ? 'Class-wise Live Attendance' : 'শ্রেণিভিত্তিক লাইভ উপস্থিতি'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {lang === 'en'
                ? `${takenCount}/${data.length} classes submitted today`
                : `আজ ${takenCount}/${data.length}টি শ্রেণির রোল কল সম্পন্ন হয়েছে`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-black font-mono border ${
              overallRate >= 80
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60'
                : overallRate >= 50
                ? 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60'
                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {lang === 'en' ? 'Rate' : 'গড় হার'}: {overallRate}%
          </span>
        </div>
      </div>

      {/* 3 Clean Inline Metric Tiles */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div className="min-w-0">
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold block truncate">
              {lang === 'en' ? 'Present' : 'উপস্থিত'}
            </span>
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono">
              {totalPresent}
              <span className="text-[10px] font-sans font-semibold text-slate-400 ml-1">
                / {grandTotal}
              </span>
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <UserX size={16} />
          </div>
          <div className="min-w-0">
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold block truncate">
              {lang === 'en' ? 'Absent' : 'অনুপস্থিত'}
            </span>
            <span className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400 font-mono">
              {totalAbsent}
              <span className="text-[10px] font-sans font-semibold text-slate-400 ml-1">
                {lang === 'en' ? '' : 'জন'}
              </span>
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock size={16} />
          </div>
          <div className="min-w-0">
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold block truncate">
              {lang === 'en' ? 'On Leave' : 'ছুটিতে'}
            </span>
            <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400 font-mono">
              {totalLeave}
              <span className="text-[10px] font-sans font-semibold text-slate-400 ml-1">
                {lang === 'en' ? '' : 'জন'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Class Progress Rows */}
      <div className="space-y-2.5">
        {data.map((c) => {
          const rateWidth = Math.min(100, Math.max(0, c.rate));
          const leaveWidth = c.total > 0 ? Math.min(100 - rateWidth, (c.leave / c.total) * 100) : 0;

          return (
            <div
              key={c.gradeKey}
              className="group p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 text-xs mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 truncate">
                    {c.gradeLabel}
                  </span>
                  {c.isTaken ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50 text-[10px] font-bold shrink-0">
                      {lang === 'en' ? 'Done' : 'সম্পন্ন'}
                    </span>
                  ) : (
                    <Link
                      href={`/dashboard/academic/attendance?grade=${c.gradeKey}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200/70 dark:border-amber-800/50 text-[10px] font-bold shrink-0 transition"
                    >
                      <span>{lang === 'en' ? 'Take Roll' : 'হাজিরা নিন'}</span>
                      <ArrowRight size={10} />
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {c.present}/{c.total}
                  </span>
                  <span
                    className={`font-black text-xs w-11 text-right ${
                      c.isTaken
                        ? c.rate >= 80
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : c.rate >= 50
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {c.isTaken ? `${c.rate}%` : '—'}
                  </span>
                </div>
              </div>

              <div className="w-full h-2 bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${rateWidth}%` }}
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                />
                {leaveWidth > 0 && (
                  <div
                    style={{ width: `${leaveWidth}%` }}
                    className="h-full bg-amber-400 transition-all duration-500"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
