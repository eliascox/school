'use client';

import React, { useState } from 'react';
import { Users, Sparkles, Heart } from 'lucide-react';

interface Props {
  maleCount: number;
  femaleCount: number;
  muslimCount: number;
  hinduCount: number;
  totalStudents: number;
  lang?: 'bn' | 'en';
}

export default function DemographicsDonutChart({
  maleCount,
  femaleCount,
  muslimCount,
  hinduCount,
  totalStudents,
  lang = 'bn'
}: Props) {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  const malePercent = totalStudents > 0 ? Math.round((maleCount / totalStudents) * 100) : 50;
  const femalePercent = 100 - malePercent;

  const muslimPercent = totalStudents > 0 ? Math.round((muslimCount / totalStudents) * 100) : 90;
  const hinduPercent = 100 - muslimPercent;

  // SVG circular circumference calculation for r=38 -> ~238.76
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76
  const maleStroke = (malePercent / 100) * circumference;
  const femaleStroke = circumference - maleStroke;

  const muslimStroke = (muslimPercent / 100) * circumference;
  const hinduStroke = circumference - muslimStroke;

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black shadow-xs">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
              {lang === 'en' ? 'Student Demographics & Diversity' : 'শিক্ষার্থী বৈচিত্র্য ও পরিসংখ্যান'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {lang === 'en' ? 'Gender Ratio & Religion Breakdown' : 'ছাত্র-ছাত্রী অনুপাত ও ধর্মীয় বিন্যাস'}
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-200/60 dark:border-indigo-800/40">
          মোট {totalStudents} জন
        </span>
      </div>

      {/* 2 Donut Visuals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        
        {/* DONUT 1: GENDER RATIO */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
            👨‍🎓 ছাত্র বনাম 👩‍🎓 ছাত্রী অনুপাত
          </span>

          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Male Segment (Indigo) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-indigo-600 transition-all duration-700 ease-out"
                strokeWidth="11"
                strokeDasharray={`${maleStroke} ${circumference}`}
                strokeLinecap="round"
                fill="transparent"
              />
              {/* Female Segment (Rose) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-rose-500 transition-all duration-700 ease-out"
                strokeWidth="11"
                strokeDasharray={`${femaleStroke} ${circumference}`}
                strokeDashoffset={`-${maleStroke}`}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Center Label */}
            <div className="absolute flex flex-col items-center text-center select-none">
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono leading-none">
                {malePercent}%
              </span>
              <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                ছাত্র অনুপাত
              </span>
            </div>
          </div>

          {/* Legends */}
          <div className="flex items-center gap-4 mt-3 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
              <span>ছাত্র: {maleCount} ({malePercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span>ছাত্রী: {femaleCount} ({femalePercent}%)</span>
            </div>
          </div>
        </div>

        {/* DONUT 2: RELIGION BREAKDOWN */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
            ☪️ মুসলিম বনাম 🛕 হিন্দু ধর্মাবলম্বী
          </span>

          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Muslim Segment (Emerald) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-emerald-600 transition-all duration-700 ease-out"
                strokeWidth="11"
                strokeDasharray={`${muslimStroke} ${circumference}`}
                strokeLinecap="round"
                fill="transparent"
              />
              {/* Hindu Segment (Amber) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-amber-500 transition-all duration-700 ease-out"
                strokeWidth="11"
                strokeDasharray={`${hinduStroke} ${circumference}`}
                strokeDashoffset={`-${muslimStroke}`}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Center Label */}
            <div className="absolute flex flex-col items-center text-center select-none">
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono leading-none">
                {muslimPercent}%
              </span>
              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                মুসলিম অনুপাত
              </span>
            </div>
          </div>

          {/* Legends */}
          <div className="flex items-center gap-4 mt-3 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
              <span>মুসলিম: {muslimCount} ({muslimPercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span>হিন্দু: {hinduCount} ({hinduPercent}%)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
