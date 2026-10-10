'use client';

import React, { useState } from 'react';
import { UserCheck, UserX, Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

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
  lang = 'bn'
}: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black shadow-xs">
            <UserCheck size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
              {lang === 'en' ? 'Live Attendance Analytics' : 'আজকের লাইভ উপস্থিতি মেট্রিক্স'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {lang === 'en' ? 'Realtime Class-wise Attendance & Absenteeism' : 'শ্রেণিভিত্তিক রিয়েল-টাইম উপস্থিতি ও অনুপস্থিতির তুলনামূলক গ্রাফ'}
            </p>
          </div>
        </div>

        {/* Overall Rate Pill */}
        <div className="flex items-center gap-3 bg-teal-50/80 dark:bg-teal-950/40 px-3.5 py-2 rounded-2xl border border-teal-200/60 dark:border-teal-800/40">
          <span className="text-[11px] font-black text-teal-900 dark:text-teal-200 uppercase tracking-wider">
            {lang === 'en' ? 'Overall Attendance' : 'গড় উপস্থিতি'}:
          </span>
          <span className="text-base font-black text-teal-600 dark:text-teal-400 font-mono">
            {overallRate}%
          </span>
        </div>
      </div>

      {/* 3 Summary Badges */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 rounded-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block truncate">
              {lang === 'en' ? 'Present Today' : 'উপস্থিত'}
            </span>
            <span className="text-sm sm:text-base font-black text-emerald-950 dark:text-emerald-100 font-mono">
              {totalPresent} <span className="text-[10px] font-normal text-emerald-700">{lang === 'en' ? '' : 'জন'}</span>
            </span>
          </div>
        </div>

        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/40 rounded-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black shrink-0">
            <UserX size={16} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-rose-800 dark:text-rose-300 font-bold block truncate">
              {lang === 'en' ? 'Absent Today' : 'অনুপস্থিত'}
            </span>
            <span className="text-sm sm:text-base font-black text-rose-950 dark:text-rose-100 font-mono">
              {totalAbsent} <span className="text-[10px] font-normal text-rose-700">{lang === 'en' ? '' : 'জন'}</span>
            </span>
          </div>
        </div>

        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 rounded-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
            <Clock size={16} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold block truncate">
              {lang === 'en' ? 'On Leave' : 'ছুটি/লিভ'}
            </span>
            <span className="text-sm sm:text-base font-black text-amber-950 dark:text-amber-100 font-mono">
              {totalLeave} <span className="text-[10px] font-normal text-amber-700">{lang === 'en' ? '' : 'জন'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Visual Comparative Bars for Classes */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
          <span>শ্রেণিভিত্তিক উপস্থিতির গ্রাফ (Class Progression)</span>
          <span>হার (%)</span>
        </div>

        <div className="space-y-3">
          {data.map((c, idx) => {
            const isHovered = hoveredIndex === idx;
            const rateWidth = Math.min(100, Math.max(0, c.rate));

            return (
              <div
                key={c.gradeKey}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`p-2.5 rounded-2xl transition-all ${
                  isHovered ? 'bg-slate-50 dark:bg-slate-800/80 shadow-xs' : ''
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800 dark:text-slate-200 font-extrabold">{c.gradeLabel}</span>
                    {c.isTaken ? (
                      <span className="text-[9.5px] px-2 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full font-bold">
                        গৃহীত
                      </span>
                    ) : (
                      <span className="text-[9.5px] px-2 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full font-semibold">
                        অপেক্ষমান
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {c.present}/{c.total}
                    </span>
                    <span className="font-mono font-black text-xs text-teal-600 dark:text-teal-400 w-12 text-right">
                      {c.rate}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5">
                  <div
                    style={{ width: `${rateWidth}%` }}
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500 shadow-xs"
                  />
                  {c.leave > 0 && (
                    <div
                      style={{ width: `${(c.leave / (c.total || 1)) * 100}%` }}
                      className="h-full bg-amber-400 rounded-full ml-0.5"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
