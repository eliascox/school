'use client';

import React, { useState } from 'react';
import { School, Layers, BarChart3, AlignLeft } from 'lucide-react';

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
  const [chartType, setChartType] = useState<'columns' | 'bars'>('columns');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxEnrollment = Math.max(...enrollments.map((e) => e.total), 1);
  const maxGenderVal = Math.max(
    1,
    ...enrollments.map((e) => Math.max(e.male, e.female)),
  );
  const yAxisMax = Math.max(4, Math.ceil(maxGenderVal / 4) * 4);

  // SVG grouped column chart dimensions
  const svgW = 440;
  const svgH = 210;
  const padL = 34;
  const padR = 12;
  const padT = 18;
  const padB = 34;
  const innerW = svgW - padL - padR;
  const innerH = svgH - padT - padB;
  const stepX = innerW / Math.max(1, enrollments.length);
  const colW = Math.min(18, stepX * 0.28);

  const yPos = (val: number) => padT + innerH - (val / yAxisMax) * innerH;
  const activeItem = hoveredIdx !== null ? enrollments[hoveredIdx] : null;

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center shrink-0">
            <School size={18} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-sm tracking-tight">
              {lang === 'en' ? 'Class Strength & Streams' : 'শ্রেণিভিত্তিক শিক্ষার্থী ও বিভাগ বিন্যাস'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {lang === 'en'
                ? 'Class 6–10 Boys vs Girls & 9th–10th streams'
                : '৬ষ্ঠ–১০ম শ্রেণির ছাত্র-ছাত্রী অনুপাত ও ৯ম–১০ম বিভাগ'}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setChartType('columns')}
            className={`px-2 py-1 rounded-lg inline-flex items-center gap-1 transition cursor-pointer ${
              chartType === 'columns'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-black'
                : 'text-slate-500'
            }`}
            title={lang === 'en' ? 'Grouped Column Chart' : 'কলাম চার্ট'}
          >
            <BarChart3 size={12} />
            <span>{lang === 'en' ? 'Columns' : 'কলাম'}</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('bars')}
            className={`px-2 py-1 rounded-lg inline-flex items-center gap-1 transition cursor-pointer ${
              chartType === 'bars'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-black'
                : 'text-slate-500'
            }`}
            title={lang === 'en' ? 'Stacked Ratio Bars' : 'অনুপাত বার'}
          >
            <AlignLeft size={12} />
            <span>{lang === 'en' ? 'Ratio' : 'বার'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Left Class Strength Chart | Right 9-10 Group Shares */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left 7 Cols */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span>
              {activeItem ? (
                <span className="text-slate-800 dark:text-slate-200">
                  {activeItem.gradeLabel}: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{activeItem.male}</strong> {lang === 'en' ? 'Boys' : 'ছাত্র'} •{' '}
                  <strong className="font-mono text-rose-500">{activeItem.female}</strong> {lang === 'en' ? 'Girls' : 'ছাত্রী'} (মোট{' '}
                  <strong className="font-mono">{activeItem.total}</strong>)
                </span>
              ) : (
                <span>{lang === 'en' ? 'Class Comparison' : 'শ্রেণি তুলনা (ছাত্র বনাম ছাত্রী)'}</span>
              )}
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                {lang === 'en' ? 'Boys' : 'ছাত্র'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {lang === 'en' ? 'Girls' : 'ছাত্রী'}
              </span>
            </div>
          </div>

          {chartType === 'columns' ? (
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-52 overflow-visible select-none"
              role="img"
              aria-label={lang === 'en' ? 'Class enrollment grouped column chart' : 'শ্রেণিভিত্তিক ছাত্র-ছাত্রী কলাম চার্ট'}
            >
              <defs>
                <linearGradient id="boysGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="girlsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#fb7185" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const val = Math.round(yAxisMax * ratio);
                const y = yPos(val);
                return (
                  <g key={ratio}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={svgW - padR}
                      y2={y}
                      stroke="currentColor"
                      className={
                        ratio === 0
                          ? 'text-slate-200 dark:text-slate-700'
                          : 'text-slate-100 dark:text-slate-800'
                      }
                      strokeDasharray={ratio === 0 ? undefined : '4 4'}
                      strokeWidth={1}
                    />
                    <text
                      x={padL - 7}
                      y={y + 3.5}
                      textAnchor="end"
                      className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono font-bold"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {enrollments.map((item, idx) => {
                const cx = padL + stepX * idx + stepX / 2;
                const maleH = item.male > 0 ? Math.max(4, padT + innerH - yPos(item.male)) : 2;
                const femaleH = item.female > 0 ? Math.max(4, padT + innerH - yPos(item.female)) : 2;
                const isHover = hoveredIdx === idx;
                const shortLabel = item.gradeLabel.replace(' শ্রেণি', '').replace('Class ', 'C');

                return (
                  <g
                    key={item.gradeKey}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <rect
                      x={cx - stepX * 0.42}
                      y={padT}
                      width={stepX * 0.84}
                      height={innerH}
                      rx={10}
                      className={`transition-opacity ${
                        isHover ? 'fill-slate-100/90 dark:fill-slate-800/60 opacity-100' : 'opacity-0'
                      }`}
                    />
                    {/* Boys Column */}
                    <rect
                      x={cx - colW - 2}
                      y={padT + innerH - maleH}
                      width={colW}
                      height={maleH}
                      rx={5}
                      fill="url(#boysGrad)"
                      opacity={hoveredIdx === null || isHover ? 1 : 0.6}
                      className="transition-all duration-500"
                    />
                    {/* Girls Column */}
                    <rect
                      x={cx + 2}
                      y={padT + innerH - femaleH}
                      width={colW}
                      height={femaleH}
                      rx={5}
                      fill="url(#girlsGrad)"
                      opacity={hoveredIdx === null || isHover ? 1 : 0.6}
                      className="transition-all duration-500"
                    />

                    {/* Total Pill Above Pair */}
                    <text
                      x={cx}
                      y={Math.min(padT + innerH - maleH, padT + innerH - femaleH) - 6}
                      textAnchor="middle"
                      className={`text-[10.5px] font-mono font-black ${
                        isHover
                          ? 'fill-indigo-600 dark:fill-indigo-400'
                          : 'fill-slate-600 dark:fill-slate-300'
                      }`}
                    >
                      {item.total}
                    </text>

                    {/* X-Axis Grade */}
                    <text
                      x={cx}
                      y={svgH - 10}
                      textAnchor="middle"
                      className={`text-[11px] font-extrabold ${
                        isHover
                          ? 'fill-slate-900 dark:fill-white'
                          : 'fill-slate-500 dark:fill-slate-400'
                      }`}
                    >
                      {shortLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="space-y-3 py-1">
              {enrollments.map((item) => {
                const maleWidth = (item.male / maxEnrollment) * 100;
                const femaleWidth = (item.female / maxEnrollment) * 100;
                const unspecifiedWidth = Math.max(
                  0,
                  ((item.total - item.male - item.female) / maxEnrollment) * 100,
                );

                return (
                  <div key={item.gradeKey} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {item.gradeLabel}
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-slate-400">
                          {item.male}M / {item.female}F
                        </span>
                        <span className="font-black text-slate-900 dark:text-white">
                          {item.total} {lang === 'en' ? '' : 'জন'}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      {maleWidth > 0 && (
                        <div
                          style={{ width: `${maleWidth}%` }}
                          className="h-full bg-indigo-600 transition-all duration-500"
                          title={`ছাত্র: ${item.male} জন`}
                        />
                      )}
                      {femaleWidth > 0 && (
                        <div
                          style={{ width: `${femaleWidth}%` }}
                          className="h-full bg-rose-500 transition-all duration-500"
                          title={`ছাত্রী: ${item.female} জন`}
                        />
                      )}
                      {unspecifiedWidth > 0 && (
                        <div
                          style={{ width: `${unspecifiedWidth}%` }}
                          className="h-full bg-slate-400 transition-all duration-500"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 5 Cols: 9th & 10th Group Streams */}
        <div className="lg:col-span-5 bg-slate-50/70 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Layers size={14} className="text-indigo-600 dark:text-indigo-400" />
              {lang === 'en' ? '9th & 10th Streams' : '৯ম ও ১০ম বিভাগ বণ্টন'}
            </span>
          </div>

          <div className="space-y-3">
            {groupStats.map((grp, idx) => {
              const denom = grp.total || 1;
              const sciPct = grp.total > 0 ? Math.round((grp.scienceTotal / denom) * 100) : 0;
              const humPct = grp.total > 0 ? Math.round((grp.humanitiesTotal / denom) * 100) : 0;
              const comPct = grp.total > 0 ? Math.max(0, 100 - sciPct - humPct) : 0;

              return (
                <div
                  key={idx}
                  className="space-y-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 dark:text-white">
                    <span>{grp.gradeLabel}</span>
                    <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-black">
                      {grp.total} {lang === 'en' ? 'Students' : 'জন'}
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    {sciPct > 0 && (
                      <div
                        style={{ width: `${sciPct}%` }}
                        className="h-full bg-emerald-500"
                        title={`বিজ্ঞান: ${grp.scienceTotal} জন (${sciPct}%)`}
                      />
                    )}
                    {humPct > 0 && (
                      <div
                        style={{ width: `${humPct}%` }}
                        className="h-full bg-indigo-500"
                        title={`মানবিক: ${grp.humanitiesTotal} জন (${humPct}%)`}
                      />
                    )}
                    {comPct > 0 && (
                      <div
                        style={{ width: `${comPct}%` }}
                        className="h-full bg-amber-500"
                        title={`ব্যবসায় শিক্ষা: ${grp.commerceTotal} জন (${comPct}%)`}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[10px] font-bold pt-0.5">
                    <span className="text-emerald-700 dark:text-emerald-400">
                      বিজ্ঞান: <strong className="font-mono">{grp.scienceTotal}</strong>
                    </span>
                    <span className="text-indigo-700 dark:text-indigo-400 text-center">
                      মানবিক: <strong className="font-mono">{grp.humanitiesTotal}</strong>
                    </span>
                    <span className="text-amber-700 dark:text-amber-400 text-right">
                      ব্যবসায়: <strong className="font-mono">{grp.commerceTotal}</strong>
                    </span>
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
