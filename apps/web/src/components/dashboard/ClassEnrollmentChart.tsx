'use client';

import React from 'react';
import { School, Layers, Award } from 'lucide-react';

interface ClassEnrollmentItem {
  gradeKey: string;
  gradeLabel: string;
  male: number;
  female: number;
  total: number;
}

interface GroupItem {
  gradeLabel: string;
  scienceTotal: number;
  humanitiesTotal: number;
  commerceTotal: number;
  total: number;
}

interface Props {
  enrollments: ClassEnrollmentItem[];
  groupStats: GroupItem[];
  lang?: 'bn' | 'en';
}

export default function ClassEnrollmentChart({ enrollments, groupStats, lang = 'bn' }: Props) {
  const maxEnrollment = Math.max(...enrollments.map(e => e.total), 1);

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black shadow-xs">
            <School size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
              {lang === 'en' ? 'Class-wise Enrollment & Stream Distribution' : 'শ্রেণিভিত্তিক এনরোলমেন্ট ও বিভাগ বিন্যাস'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {lang === 'en' ? 'Class 6 - 10 Strength & Science/Arts/Commerce Shares' : '৬ষ্ঠ থেকে ১০ম শ্রেণির শক্তি ও বিভাগভিত্তিক শিক্ষার্থী বিন্যাস'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Left Class Strength Bars | Right 9-10 Group Shares */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols: Class Strength Vertical Bars */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>শ্রেণি (Class)</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-indigo-600 font-black"><span className="w-2 h-2 rounded-full bg-indigo-600" /> ছাত্র</span>
              <span className="flex items-center gap-1 text-rose-600 font-black"><span className="w-2 h-2 rounded-full bg-rose-500" /> ছাত্রী</span>
            </div>
          </div>

          <div className="space-y-3">
            {enrollments.map((item) => {
              const totalPct = (item.total / maxEnrollment) * 100;
              const malePct = item.total > 0 ? (item.male / item.total) * 100 : 50;
              const femalePct = 100 - malePct;

              return (
                <div key={item.gradeKey} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    <span>{item.gradeLabel}</span>
                    <span className="font-mono text-slate-900 dark:text-white">{item.total} জন</span>
                  </div>

                  {/* Dual Bar */}
                  <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5 shadow-inner">
                    <div
                      style={{ width: `${(item.male / (maxEnrollment || 1)) * 100}%` }}
                      className="h-full bg-indigo-600 rounded-l-full transition-all duration-500"
                      title={`ছাত্র: ${item.male} জন`}
                    />
                    <div
                      style={{ width: `${(item.female / (maxEnrollment || 1)) * 100}%` }}
                      className="h-full bg-rose-500 rounded-r-full transition-all duration-500"
                      title={`ছাত্রী: ${item.female} জন`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: 9th & 10th Group Streams */}
        <div className="lg:col-span-5 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Layers size={14} className="text-indigo-600" /> ৯ম ও ১০ম বিভাগ বণ্টন
            </span>
            <span className="text-[10px] font-bold text-slate-400">বিজ্ঞান / মানবিক / ব্যবসায়</span>
          </div>

          <div className="space-y-4">
            {groupStats.map((grp, idx) => {
              const total = grp.total || 1;
              const sciPct = Math.round((grp.scienceTotal / total) * 100);
              const humPct = Math.round((grp.humanitiesTotal / total) * 100);
              const comPct = 100 - (sciPct + humPct);

              return (
                <div key={idx} className="space-y-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 dark:text-white">
                    <span>{grp.gradeLabel}</span>
                    <span className="text-[11px] font-mono text-indigo-600 font-black">মোট {grp.total} জন</span>
                  </div>

                  {/* Multi-color Stream Bar */}
                  <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                    <div style={{ width: `${sciPct}%` }} className="h-full bg-emerald-500" title={`বিজ্ঞান: ${grp.scienceTotal} জন (${sciPct}%)`} />
                    <div style={{ width: `${humPct}%` }} className="h-full bg-indigo-500" title={`মানবিক: ${grp.humanitiesTotal} জন (${humPct}%)`} />
                    <div style={{ width: `${comPct}%` }} className="h-full bg-amber-500" title={`ব্যবসায় শিক্ষা: ${grp.commerceTotal} জন`} />
                  </div>

                  {/* Legend Counts */}
                  <div className="grid grid-cols-3 gap-1 text-[10px] font-bold text-center pt-1">
                    <span className="text-emerald-700 dark:text-emerald-300">বিজ্ঞান: {grp.scienceTotal}</span>
                    <span className="text-indigo-700 dark:text-indigo-300">মানবিক: {grp.humanitiesTotal}</span>
                    <span className="text-amber-700 dark:text-amber-300">ব্যবসায়: {grp.commerceTotal}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
