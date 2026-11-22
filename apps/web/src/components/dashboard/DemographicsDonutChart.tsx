'use client';

import React from 'react';
import { Users, BookOpen } from 'lucide-react';

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
  lang = 'bn',
}: Props) {
  const genderTotal = maleCount + femaleCount;
  const malePercent = genderTotal > 0 ? Math.round((maleCount / genderTotal) * 100) : 0;
  const femalePercent = genderTotal > 0 ? 100 - malePercent : 0;

  const religionTotal = muslimCount + hinduCount;
  const muslimPercent = religionTotal > 0 ? Math.round((muslimCount / religionTotal) * 100) : 0;
  const hinduPercent = religionTotal > 0 ? 100 - muslimPercent : 0;

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const maleStroke = (malePercent / 100) * circumference;
  const femaleStroke = (femalePercent / 100) * circumference;

  const muslimStroke = (muslimPercent / 100) * circumference;
  const hinduStroke = (hinduPercent / 100) * circumference;

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-sm tracking-tight">
              {lang === 'en' ? 'Student Demographics' : 'শিক্ষার্থী বৈচিত্র্য ও অনুপাত'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {lang === 'en' ? 'Gender & religion distribution' : 'ছাত্র-ছাত্রী ও ধর্মীয় বিন্যাস'}
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-black text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
          {totalStudents} {lang === 'en' ? 'Total' : 'জন'}
        </span>
      </div>

      {/* 2 Clean Donut Visuals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Donut 1: Gender */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users size={12} className="text-indigo-500" />
            {lang === 'en' ? 'Gender Ratio' : 'ছাত্র বনাম ছাত্রী'}
          </span>

          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              {maleStroke > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-indigo-600 transition-all duration-700"
                  strokeWidth="10"
                  strokeDasharray={`${maleStroke} ${circumference}`}
                  fill="transparent"
                />
              )}
              {femaleStroke > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-rose-500 transition-all duration-700"
                  strokeWidth="10"
                  strokeDasharray={`${femaleStroke} ${circumference}`}
                  strokeDashoffset={`-${maleStroke}`}
                  fill="transparent"
                />
              )}
            </svg>
            <div className="absolute flex flex-col items-center text-center select-none">
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono leading-none">
                {malePercent}%
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'en' ? 'Boys' : 'ছাত্র'}
              </span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 mt-3.5 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 text-[11px] font-bold">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
              <span className="truncate">
                {lang === 'en' ? 'Boys' : 'ছাত্র'}: <strong className="font-mono">{maleCount}</strong>
              </span>
            </div>
            <div className="flex items-center justify-end gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span className="truncate">
                {lang === 'en' ? 'Girls' : 'ছাত্রী'}: <strong className="font-mono">{femaleCount}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Donut 2: Religion */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <BookOpen size={12} className="text-emerald-500" />
            {lang === 'en' ? 'Religion Share' : 'ধর্মীয় বিন্যাস'}
          </span>

          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              {muslimStroke > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-emerald-600 transition-all duration-700"
                  strokeWidth="10"
                  strokeDasharray={`${muslimStroke} ${circumference}`}
                  fill="transparent"
                />
              )}
              {hinduStroke > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-amber-500 transition-all duration-700"
                  strokeWidth="10"
                  strokeDasharray={`${hinduStroke} ${circumference}`}
                  strokeDashoffset={`-${muslimStroke}`}
                  fill="transparent"
                />
              )}
            </svg>
            <div className="absolute flex flex-col items-center text-center select-none">
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono leading-none">
                {muslimPercent}%
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'en' ? 'Muslim' : 'মুসলিম'}
              </span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 mt-3.5 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 text-[11px] font-bold">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              <span className="truncate">
                {lang === 'en' ? 'Muslim' : 'মুসলিম'}: <strong className="font-mono">{muslimCount}</strong>
              </span>
            </div>
            <div className="flex items-center justify-end gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span className="truncate">
                {lang === 'en' ? 'Hindu' : 'হিন্দু'}: <strong className="font-mono">{hinduCount}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
