'use client';

import React from 'react';
import {
  Palette,
  Layout,
  Eye,
  EyeOff,
  Scissors,
  Image as ImageIcon,
  QrCode,
  UserCheck,
  Sliders,
} from 'lucide-react';
import {
  CERTIFICATE_BORDER_PRESETS,
  CERTIFICATE_COLOR_THEMES,
} from './certificateThemes';

export interface StudioDesignState {
  orientation: 'portrait' | 'landscape';
  themeColor: string;
  titleVariant: 'ribbon' | 'underline' | 'minimal';
  borderPreset: string;
  showHeader: boolean;
  showPhotoBox: boolean;
  showOfficeStub: boolean;
  showCornerBands: boolean;
  showQrCode: boolean;
  showSecondarySigner: boolean;
  secondarySignerTitle: string;
  fontSize: number;
}

interface CertificateDesignControlsProps {
  design: StudioDesignState;
  setDesign: React.Dispatch<React.SetStateAction<StudioDesignState>>;
  onOpenPadSettings?: () => void;
}

export default function CertificateDesignControls({
  design,
  setDesign,
  onOpenPadSettings,
}: CertificateDesignControlsProps) {
  const update = <K extends keyof StudioDesignState>(key: K, val: StudioDesignState[K]) =>
    setDesign((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-4 text-xs">
      {/* Paper Orientation & Header Show/Hide */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Layout size={12} /> কাগজের আকার (A4)
          </label>
          <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {[
              { id: 'portrait', label: 'খাড়া (Portrait)' },
              { id: 'landscape', label: 'আড়াআড়ি' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => update('orientation', item.id as 'portrait' | 'landscape')}
                className={`py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  design.orientation === item.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            {design.showHeader ? <Eye size={12} /> : <EyeOff size={12} />} প্যাড / হেডার মোড
          </label>
          <button
            type="button"
            onClick={() => update('showHeader', !design.showHeader)}
            className={`w-full py-2 px-3 rounded-xl font-bold text-[11px] border transition flex items-center justify-center gap-1.5 cursor-pointer ${
              design.showHeader
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
            }`}
          >
            {design.showHeader ? (
              <>
                <Eye size={13} /> ডিজিটাল হেডার চালু
              </>
            ) : (
              <>
                <EyeOff size={13} /> হেডার লুকানো (ছাপা প্যাড)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Color Theme Palette + Custom Hex */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Palette size={12} /> রঙের থিম ও কাস্টম HEX
          </label>
          <span className="font-mono text-[10px] text-slate-400">{design.themeColor}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {CERTIFICATE_COLOR_THEMES.map((theme) => {
            const active = design.themeColor.toLowerCase() === theme.primary.toLowerCase();
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => update('themeColor', theme.primary)}
                title={theme.nameBn}
                className={`w-7 h-7 rounded-full border-2 transition cursor-pointer ${
                  active ? 'scale-110 ring-2 ring-indigo-500 ring-offset-2 border-white' : 'border-slate-200 dark:border-slate-700'
                }`}
                style={{ backgroundColor: theme.primary }}
              />
            );
          })}

          <label
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 cursor-pointer text-[10px] font-bold text-slate-600 dark:text-slate-300"
            title="কাস্টম রঙ বাছাই করুন"
          >
            <input
              type="color"
              value={design.themeColor}
              onChange={(e) => update('themeColor', e.target.value)}
              className="w-4 h-4 rounded border-0 p-0 bg-transparent cursor-pointer"
            />
            কাস্টম
          </label>
        </div>
      </div>

      {/* Title Style */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">শিরোনাম স্টাইল</label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'ribbon', label: 'রিবন ব্যাজ' },
            { id: 'underline', label: 'আন্ডারলাইন' },
            { id: 'minimal', label: 'সাধারণ' },
          ].map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => update('titleVariant', v.id as 'ribbon' | 'underline' | 'minimal')}
              className={`py-1.5 px-2 rounded-xl border font-bold text-[11px] transition cursor-pointer ${
                design.titleVariant === v.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Border Frame Selector (12 presets) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">বর্ডার ফ্রেম (১২টি ডিজাইন)</label>
          {onOpenPadSettings && (
            <button
              type="button"
              onClick={onOpenPadSettings}
              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sliders size={11} /> প্যাড / কাস্টম ফ্রেম
            </button>
          )}
        </div>
        <select
          value={design.borderPreset}
          onChange={(e) => update('borderPreset', e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
        >
          {CERTIFICATE_BORDER_PRESETS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nameBn}
            </option>
          ))}
        </select>
      </div>

      {/* Feature Toggles Grid */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {[
          { key: 'showOfficeStub' as const, label: 'অফিস কপি স্টাব', icon: Scissors },
          { key: 'showPhotoBox' as const, label: '৩৫×৪৫ মিমি ছবি বক্স', icon: ImageIcon },
          { key: 'showCornerBands' as const, label: 'কর্নার রিবন ব্যান্ড', icon: Palette },
          { key: 'showQrCode' as const, label: 'QR যাচাই কোড', icon: QrCode },
          { key: 'showSecondarySigner' as const, label: '২য় স্বাক্ষর (শিক্ষক)', icon: UserCheck },
        ].map((item) => {
          const Icon = item.icon;
          const checked = Boolean(design[item.key]);
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => update(item.key, !checked)}
              className={`px-2.5 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                checked
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon size={13} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {design.showSecondarySigner && (
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            ২য় স্বাক্ষরকারীর পদবি
          </label>
          <input
            type="text"
            value={design.secondarySignerTitle}
            onChange={(e) => update('secondarySignerTitle', e.target.value)}
            placeholder="যেমন: শ্রেণি শিক্ষক / সহকারী প্রধান শিক্ষক"
            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
          />
        </div>
      )}

      {/* Font Size Slider */}
      <div className="space-y-1 pt-1">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
          <span>ফন্টের আকার</span>
          <span className="font-mono text-indigo-600 dark:text-indigo-400">{design.fontSize}px</span>
        </div>
        <input
          type="range"
          min={12}
          max={20}
          step={1}
          value={design.fontSize}
          onChange={(e) => update('fontSize', Number(e.target.value))}
          className="w-full accent-indigo-600 cursor-pointer"
        />
      </div>
    </div>
  );
}
