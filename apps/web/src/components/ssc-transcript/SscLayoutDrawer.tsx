'use client';

import React from 'react';
import { Check, ImageIcon, Plus, RotateCcw, Settings2, X } from 'lucide-react';
import { CustomPngBorder, SchoolSettings } from '@/services/settingsService';
import { MainTab, PrintLayoutConfig } from './sscTranscriptUtils';

export interface SscLayoutDrawerProps {
  layoutConfig: PrintLayoutConfig;
  schoolSettings: SchoolSettings;
  customBorders: CustomPngBorder[];
  selectedBorderId: string;
  activeBorderUrl: string | null;
  onUpdateLayoutConfig: (newConfig: Partial<PrintLayoutConfig>) => void;
  onResetLayoutConfig: () => void;
  onSelectBorder: (borderId: string) => void;
  onOpenSettingsTab: (tab: MainTab) => void;
  onClose: () => void;
}

export default function SscLayoutDrawer({
  layoutConfig,
  schoolSettings,
  customBorders,
  selectedBorderId,
  activeBorderUrl,
  onUpdateLayoutConfig,
  onResetLayoutConfig,
  onSelectBorder,
  onOpenSettingsTab,
  onClose,
}: SscLayoutDrawerProps) {
  return (
    <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 space-y-6 print:hidden animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Settings2 size={18} className="text-amber-400" />
          <h3 className="font-black text-sm text-white">
            প্রশংসাপত্র সাইজ (৯.২&quot; × ৮.২&quot;), মার্জিন ও পিএনজি বর্ডার কন্ট্রোল
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onResetLayoutConfig}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={13} /> রিসেট (০.৫&quot;)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
        <div className="space-y-2 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
          <div className="flex justify-between items-center font-bold">
            <span className="text-slate-300">ইংরেজি লেখার ফন্ট সাইজ:</span>
            <span className="font-mono text-amber-400 font-black">{layoutConfig.fontScale}%</span>
          </div>
          <input
            type="range"
            min="75"
            max="175"
            step="5"
            value={layoutConfig.fontScale}
            onChange={(e) => onUpdateLayoutConfig({ fontScale: parseInt(e.target.value, 10) })}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <div className="flex items-center justify-between gap-1 pt-1">
            {[90, 100, 115, 130, 150].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onUpdateLayoutConfig({ fontScale: preset })}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                  layoutConfig.fontScale === preset
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
          <div className="flex justify-between items-center font-bold">
            <span className="text-slate-300">টপ মার্জিন (বর্ডার সেফটি):</span>
            <span className="font-mono text-indigo-400 font-black">{layoutConfig.topMargin}&quot;</span>
          </div>
          <input
            type="range"
            min="0.3"
            max="1.5"
            step="0.05"
            value={layoutConfig.topMargin}
            onChange={(e) => onUpdateLayoutConfig({ topMargin: parseFloat(e.target.value) })}
            className="w-full accent-indigo-400 cursor-pointer"
          />
          <div className="flex justify-between items-center font-bold pt-1">
            <span className="text-slate-300">বটম মার্জিন:</span>
            <span className="font-mono text-indigo-400 font-black">{layoutConfig.bottomMargin}&quot;</span>
          </div>
          <input
            type="range"
            min="0.3"
            max="1.5"
            step="0.05"
            value={layoutConfig.bottomMargin}
            onChange={(e) => onUpdateLayoutConfig({ bottomMargin: parseFloat(e.target.value) })}
            className="w-full accent-indigo-400 cursor-pointer"
          />
        </div>

        <div className="space-y-2 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
          <div className="flex justify-between items-center font-bold">
            <span className="text-slate-300">বাম মার্জিন:</span>
            <span className="font-mono text-emerald-400 font-black">{layoutConfig.leftMargin}&quot;</span>
          </div>
          <input
            type="range"
            min="0.3"
            max="1.5"
            step="0.05"
            value={layoutConfig.leftMargin}
            onChange={(e) => onUpdateLayoutConfig({ leftMargin: parseFloat(e.target.value) })}
            className="w-full accent-emerald-400 cursor-pointer"
          />
          <div className="flex justify-between items-center font-bold pt-1">
            <span className="text-slate-300">ডান মার্জিন:</span>
            <span className="font-mono text-emerald-400 font-black">{layoutConfig.rightMargin}&quot;</span>
          </div>
          <input
            type="range"
            min="0.3"
            max="1.5"
            step="0.05"
            value={layoutConfig.rightMargin}
            onChange={(e) => onUpdateLayoutConfig({ rightMargin: parseFloat(e.target.value) })}
            className="w-full accent-emerald-400 cursor-pointer"
          />
        </div>

        <div className="space-y-2.5 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
          <span className="text-slate-300 font-bold block">প্যারাগ্রাফ লাইন স্পেসিং:</span>
          <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl">
            {(['tight', 'normal', 'relaxed'] as const).map((lh) => (
              <button
                key={lh}
                type="button"
                onClick={() => onUpdateLayoutConfig({ lineHeight: lh })}
                className={`py-1 rounded-lg text-[10px] font-black transition cursor-pointer capitalize ${
                  layoutConfig.lineHeight === lh ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                {lh === 'tight' ? 'টাইট' : lh === 'normal' ? 'স্বাভাবিক' : 'খোলামেলা'}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center font-bold pt-1">
            <span className="text-slate-300 text-[11px]">স্বাক্ষর স্পেস:</span>
            <span className="font-mono text-sky-400 font-bold">{layoutConfig.signatureGap}px</span>
          </div>
          <input
            type="range"
            min="10"
            max="40"
            step="2"
            value={layoutConfig.signatureGap}
            onChange={(e) => onUpdateLayoutConfig({ signatureGap: parseInt(e.target.value, 10) })}
            className="w-full accent-sky-400 cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-xs">
        <div className="space-y-1.5 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
          <span className="text-slate-300 font-bold block">স্কুলের মোবাইল নম্বর (Header Mobile No):</span>
          <input
            type="text"
            placeholder="e.g. 01819-640163"
            value={
              layoutConfig.customPhone !== undefined
                ? layoutConfig.customPhone
                : schoolSettings?.phone || '01819-640163'
            }
            onChange={(e) => onUpdateLayoutConfig({ customPhone: e.target.value })}
            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-black text-amber-400 outline-none"
          />
          <p className="text-[10px] text-slate-400">প্রশংসাপত্রের হেডারে ঠিকানা ও EIIN-এর পাশে প্রদর্শিত হবে।</p>
        </div>

        <div className="space-y-1.5 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
          <span className="text-slate-300 font-bold block">TESTIMONIAL টাইটেল ও নামের ফন্ট স্টাইল:</span>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1.5 rounded-xl">
            {(['cinzel', 'playfair', 'classic'] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => onUpdateLayoutConfig({ titleStyle: style })}
                className={`py-2 rounded-lg text-[10px] font-black transition cursor-pointer capitalize ${
                  (layoutConfig.titleStyle || 'cinzel') === style
                    ? 'bg-amber-500 text-slate-950 dark:text-white shadow-md ring-2 ring-amber-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {style === 'cinzel' ? 'Cinzel রাজকীয়' : style === 'playfair' ? 'Playfair মার্জিত' : 'ক্লাসিক সেরিফ'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1.5 rounded-xl mt-2">
            {(['cursive', 'serif_italic', 'classic_bold'] as const).map((nf) => (
              <button
                key={nf}
                type="button"
                onClick={() => onUpdateLayoutConfig({ nameFontStyle: nf })}
                className={`py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                  (layoutConfig.nameFontStyle || 'cursive') === nf
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {nf === 'cursive' ? 'কার্সিভ স্ক্রিপ্ট' : nf === 'serif_italic' ? 'ইতালিক সেরিফ' : 'বোল্ড ক্লাসিক'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ImageIcon size={16} className="text-amber-400" />
          <span className="font-bold text-slate-300">সক্রিয় পিএনজি বর্ডার:</span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectBorder('none')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                !activeBorderUrl
                  ? 'bg-amber-500 text-slate-950 dark:text-white font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              কোনো বর্ডার নয়
            </button>

            {customBorders.map((b, idx) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelectBorder(b.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedBorderId === b.id
                    ? 'bg-indigo-600 text-white font-black ring-2 ring-indigo-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Check size={12} className={selectedBorderId === b.id ? 'opacity-100' : 'opacity-0'} />
                {b.name || `বর্ডার ${idx + 1}`}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenSettingsTab('settings')}
          className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
        >
          <Plus size={14} /> ৩টি স্লট ফ্রেম ম্যানেজ করুন
        </button>
      </div>
    </div>
  );
}
