'use client';

import React from 'react';
import { Calendar, RotateCcw, Sliders } from 'lucide-react';
import {
  DEFAULT_PAD_HEADER_FIELDS,
  DEFAULT_PAD_MARGINS,
  PadHeaderFieldsConfig,
  PadMargins,
} from '@/services/settingsService';

interface PadHeaderCalibrationCardProps {
  headerFields?: PadHeaderFieldsConfig;
  margins?: PadMargins;
  onChangeHeaderFields: (next: PadHeaderFieldsConfig) => void;
  onApplyPreset: (margins: PadMargins, headerFields?: PadHeaderFieldsConfig) => void;
}

export default function PadHeaderCalibrationCard({
  headerFields,
  onChangeHeaderFields,
  onApplyPreset,
}: PadHeaderCalibrationCardProps) {
  const cfg: PadHeaderFieldsConfig = {
    ...DEFAULT_PAD_HEADER_FIELDS,
    ...(headerFields || {}),
  };

  const updateField = <K extends keyof PadHeaderFieldsConfig>(
    key: K,
    val: PadHeaderFieldsConfig[K],
  ) => {
    onChangeHeaderFields({
      ...cfg,
      [key]: val,
    });
  };

  const updateNum = (key: keyof PadHeaderFieldsConfig, raw: string, min: number, max: number) => {
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) return;
    updateField(key, Math.max(min, Math.min(max, Math.round(parsed * 10) / 10)) as never);
  };

  return (
    <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200/90 dark:border-indigo-800/60 space-y-3.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
            <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />
            প্যাডের &quot;সূত্র:&quot; ও তারিখ বক্স [দিন][মাস][সাল] অ্যালাইনমেন্ট
          </h4>
          <p className="text-[10.5px] text-indigo-700/80 dark:text-indigo-300 mt-0.5">
            প্যাডের উপরের ছাপানো <strong>সূত্র:</strong> এবং ৩ ঘরের <strong>তারিখ</strong> বক্সে স্মারক নং ও তারিখ নিখুঁতভাবে বসান।
          </p>
        </div>

        <button
          type="button"
          onClick={() => onApplyPreset({ ...DEFAULT_PAD_MARGINS }, { ...DEFAULT_PAD_HEADER_FIELDS })}
          className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 rounded-xl text-[10.5px] font-black flex items-center gap-1 transition cursor-pointer shadow-2xs"
          title="ডিফল্ট সূত্র ও তারিখ বক্স ক্যালিব্রেশন রিসেট"
        >
          <RotateCcw size={12} /> আদর্শ প্যাড প্রিসেট
        </button>
      </div>

      {/* Placement Mode */}
      <div className="grid grid-cols-3 gap-1.5 bg-white/80 dark:bg-slate-900 p-1 rounded-xl border border-indigo-200/80 dark:border-slate-800">
        {[
          { id: 'pad_header_boxes' as const, label: 'প্যাডের সূত্র ও তারিখ বক্সে' },
          { id: 'inline_below' as const, label: 'বডির উপরে সাধারণ সারি' },
          { id: 'hide_ref_date' as const, label: 'লুকানো থাকবে' },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => updateField('placement', opt.id)}
            className={`py-1.5 px-2 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
              cfg.placement === opt.id
                ? 'bg-indigo-600 text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {cfg.placement === 'pad_header_boxes' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-indigo-100 dark:border-slate-800 space-y-1">
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
              সূত্র উপর থেকে (mm)
            </label>
            <input
              type="number"
              step="0.5"
              min={10}
              max={120}
              value={cfg.refTopMm}
              onChange={(e) => updateNum('refTopMm', e.target.value, 10, 120)}
              className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono font-black text-indigo-700 dark:text-indigo-300 text-xs"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-indigo-100 dark:border-slate-800 space-y-1">
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
              সূত্র বাম থেকে (mm)
            </label>
            <input
              type="number"
              step="0.5"
              min={5}
              max={120}
              value={cfg.refLeftMm}
              onChange={(e) => updateNum('refLeftMm', e.target.value, 5, 120)}
              className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono font-black text-indigo-700 dark:text-indigo-300 text-xs"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-indigo-100 dark:border-slate-800 space-y-1">
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
              তারিখ বক্স উপর (mm)
            </label>
            <input
              type="number"
              step="0.5"
              min={10}
              max={120}
              value={cfg.dateTopMm}
              onChange={(e) => updateNum('dateTopMm', e.target.value, 10, 120)}
              className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono font-black text-emerald-700 dark:text-emerald-300 text-xs"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-indigo-100 dark:border-slate-800 space-y-1">
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
              তারিখ বক্স বাম (mm)
            </label>
            <input
              type="number"
              step="0.5"
              min={80}
              max={200}
              value={cfg.dateLeftMm}
              onChange={(e) => updateNum('dateLeftMm', e.target.value, 80, 200)}
              className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono font-black text-emerald-700 dark:text-emerald-300 text-xs"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-indigo-100 dark:border-slate-800 space-y-1">
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
              দিন/মাস বক্স প্রস্থ (mm)
            </label>
            <input
              type="number"
              step="0.2"
              min={5}
              max={20}
              value={cfg.dayWidthMm}
              onChange={(e) => {
                const parsed = parseFloat(e.target.value);
                if (Number.isNaN(parsed)) return;
                const clamped = Math.max(5, Math.min(20, Math.round(parsed * 10) / 10));
                onChangeHeaderFields({
                  ...cfg,
                  dayWidthMm: clamped,
                  monthWidthMm: clamped + 0.2,
                });
              }}
              className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200 text-xs"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-indigo-100 dark:border-slate-800 space-y-1">
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
              সাল বক্স প্রস্থ (mm)
            </label>
            <input
              type="number"
              step="0.2"
              min={8}
              max={30}
              value={cfg.yearWidthMm}
              onChange={(e) => updateNum('yearWidthMm', e.target.value, 8, 30)}
              className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200 text-xs"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-indigo-100 dark:border-slate-800 space-y-1">
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
              বক্সের উচ্চতা (mm)
            </label>
            <input
              type="number"
              step="0.2"
              min={4}
              max={15}
              value={cfg.boxHeightMm}
              onChange={(e) => updateNum('boxHeightMm', e.target.value, 4, 15)}
              className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200 text-xs"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-indigo-100 dark:border-slate-800 space-y-1">
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block flex items-center gap-1">
              <Sliders size={10} /> ফন্ট (px)
            </label>
            <input
              type="number"
              step="0.5"
              min={9}
              max={18}
              value={cfg.fontSizePx}
              onChange={(e) => updateNum('fontSizePx', e.target.value, 9, 18)}
              className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}
