'use client';

import React, { useState } from 'react';
import { CalendarCheck2, TrendingUp } from 'lucide-react';

export interface MonthlyClassAttendanceItem {
  gradeKey: string;
  gradeLabel: string;
  total: number;
  boys: number;
  girls: number;
  stipend: number;
  attendanceRate: number;
  todayRate?: number;
}

interface Props {
  data: MonthlyClassAttendanceItem[];
  lang?: 'bn' | 'en';
}

export default function MonthlyAttendanceChart({ data, lang = 'bn' }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mode, setMode] = useState<'monthly' | 'today'>('monthly');

  const values = data.map((d) =>
    mode === 'monthly' ? d.attendanceRate : (d.todayRate ?? d.attendanceRate),
  );
  const avgRate =
    values.length > 0 ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : 0;

  // SVG coordinate space
  const chartW = 520;
  const chartH = 210;
  const padL = 38;
  const padR = 16;
  const padT = 18;
  const padB = 34;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const colCount = Math.max(1, data.length);
  const stepX = innerW / colCount;
  const barW = Math.min(44, stepX * 0.46);

  const yForPct = (pct: number) => padT + innerH - (Math.min(100, Math.max(0, pct)) / 100) * innerH;

  // Smooth SVG polyline / area points across bar centers
  const points = data.map((_, i) => {
    const cx = padL + stepX * i + stepX / 2;
    const cy = yForPct(values[i] || 0);
    return { x: cx, y: cy, pct: values[i] || 0 };
  });

  const linePath = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const activeItem = hoveredIdx !== null ? data[hoveredIdx] : null;
  const activePct = hoveredIdx !== null ? values[hoveredIdx] : null;

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shrink-0">
            <CalendarCheck2 size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-slate-900 dark:text-white text-sm tracking-tight truncate">
              {lang === 'en'
                ? 'Class Attendance Performance (%)'
                : 'শ্রেণিভিত্তিক গড় উপস্থিতি চার্ট (%)'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              {mode === 'monthly'
                ? lang === 'en'
                  ? 'Current month rolling attendance average'
                  : 'চলতি মাসের সর্বশেষ রোল কল সেশনের গড় হার'
                : lang === 'en'
                  ? "Today's live attendance percentage by class"
                  : 'আজকের লাইভ রোল কল উপস্থিতির শতকরা হার'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setMode('monthly')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                mode === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {lang === 'en' ? 'Monthly' : 'মাসিক'}
            </button>
            <button
              type="button"
              onClick={() => setMode('today')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                mode === 'today'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-2xs font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {lang === 'en' ? 'Today' : 'আজকের'}
            </button>
          </div>

          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-black inline-flex items-center gap-1">
            <TrendingUp size={12} /> {avgRate}%
          </span>
        </div>
      </div>

      {/* Interactive SVG Column + Trend Overlay */}
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full h-52 sm:h-56 overflow-visible select-none"
          role="img"
          aria-label={lang === 'en' ? 'Class attendance bar chart' : 'শ্রেণিভিত্তিক উপস্থিতির বার চার্ট'}
        >
          <defs>
            <linearGradient id="attBarEmerald" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.78" />
            </linearGradient>
            <linearGradient id="attBarAmber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.78" />
            </linearGradient>
            <linearGradient id="attBarSlate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* Horizontal Reference Grid Lines */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = yForPct(tick);
            return (
              <g key={tick}>
                <line
                  x1={padL}
                  y1={y}
                  x2={chartW - padR}
                  y2={y}
                  stroke="currentColor"
                  className={
                    tick === 0
                      ? 'text-slate-200 dark:text-slate-700'
                      : 'text-slate-100 dark:text-slate-800'
                  }
                  strokeDasharray={tick === 0 ? undefined : '4 4'}
                  strokeWidth={1}
                />
                <text
                  x={padL - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono font-bold"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* 80% Excellence Benchmark Line */}
          <line
            x1={padL}
            y1={yForPct(80)}
            x2={chartW - padR}
            y2={yForPct(80)}
            stroke="#10b981"
            strokeOpacity={0.35}
            strokeDasharray="3 3"
            strokeWidth={1.2}
          />

          {/* Bars */}
          {data.map((item, idx) => {
            const pct = values[idx] || 0;
            const cx = padL + stepX * idx + stepX / 2;
            const barTop = yForPct(pct);
            const barH = Math.max(pct > 0 ? 6 : 3, padT + innerH - barTop);
            const isHover = hoveredIdx === idx;
            const fillUrl =
              pct >= 80
                ? 'url(#attBarEmerald)'
                : pct >= 50
                  ? 'url(#attBarAmber)'
                  : 'url(#attBarSlate)';

            return (
              <g
                key={item.gradeKey}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Hover Column Backdrop */}
                <rect
                  x={cx - stepX * 0.42}
                  y={padT}
                  width={stepX * 0.84}
                  height={innerH}
                  rx={10}
                  className={`transition-opacity duration-150 ${
                    isHover
                      ? 'fill-slate-100/90 dark:fill-slate-800/60 opacity-100'
                      : 'opacity-0'
                  }`}
                />

                {/* Track */}
                <rect
                  x={cx - barW / 2}
                  y={padT}
                  width={barW}
                  height={innerH}
                  rx={8}
                  className="fill-slate-100/80 dark:fill-slate-800/50"
                />

                {/* Filled Bar */}
                <rect
                  x={cx - barW / 2}
                  y={padT + innerH - barH}
                  width={barW}
                  height={barH}
                  rx={8}
                  fill={fillUrl}
                  className="transition-all duration-500"
                  opacity={hoveredIdx === null || isHover ? 1 : 0.6}
                />

                {/* Percentage Label */}
                <text
                  x={cx}
                  y={Math.max(padT - 4, padT + innerH - barH - 6)}
                  textAnchor="middle"
                  className={`text-[11px] font-mono font-black transition-colors ${
                    isHover
                      ? 'fill-indigo-600 dark:fill-indigo-400'
                      : 'fill-slate-700 dark:fill-slate-200'
                  }`}
                >
                  {pct}%
                </text>

                {/* X-Axis Grade Label */}
                <text
                  x={cx}
                  y={chartH - 10}
                  textAnchor="middle"
                  className={`text-[11px] font-extrabold ${
                    isHover
                      ? 'fill-slate-900 dark:fill-white'
                      : 'fill-slate-500 dark:fill-slate-400'
                  }`}
                >
                  {item.gradeLabel}
                </text>
              </g>
            );
          })}

          {/* Smooth Trend Connector Line & Dots */}
          {points.length > 1 && values.some((v) => v > 0) && (
            <g className="pointer-events-none">
              <path
                d={linePath}
                fill="none"
                stroke="#0f172a"
                strokeOpacity={0.18}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="dark:stroke-white/25"
              />
              {points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r={hoveredIdx === idx ? 4.5 : 3}
                  className="fill-white dark:fill-slate-900 stroke-emerald-600 dark:stroke-emerald-400 transition-all"
                  strokeWidth={2}
                />
              ))}
            </g>
          )}
        </svg>
      </div>

      {/* Footer Legend / Live Hover Insight */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
        {activeItem ? (
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black">
              {activeItem.gradeLabel}
            </span>
            <span>
              {lang === 'en' ? 'Rate' : 'উপস্থিতি'}: <strong className="font-mono">{activePct}%</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>
              {lang === 'en' ? 'Students' : 'শিক্ষার্থী'}:{' '}
              <strong className="font-mono">{activeItem.total}</strong> ({activeItem.boys}M /{' '}
              {activeItem.girls}F)
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              {lang === 'en' ? '≥80% Optimal' : '≥৮০% উত্তম'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              {lang === 'en' ? '50–79% Moderate' : '৫০–৭৯% মধ্যম'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400" />
              {lang === 'en' ? '<50% Needs Focus' : '<৫০% মনোযোগ প্রয়োজন'}
            </span>
          </div>
        )}
        <span className="text-[10.5px] text-slate-400">
          {lang === 'en' ? 'Target: 80%+' : 'লক্ষ্যমাত্রা: ৮০%+'}
        </span>
      </div>
    </div>
  );
}
