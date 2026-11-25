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
  Type,
  AlignJustify,
} from 'lucide-react';
import {
  CERTIFICATE_BORDER_PRESETS,
  CERTIFICATE_COLOR_THEMES,
} from './certificateThemes';
import type { CertificateCanvasMode } from '@/services/certificateService';
import { DEFAULT_PAD_MARGINS, SchoolSettings, settingsService } from '@/services/settingsService';

export interface StudioDesignState {
  canvasMode: CertificateCanvasMode;
  orientation: 'portrait' | 'landscape';
  themeColor: string;
  titleVariant: 'boxed' | 'underline' | 'ribbon' | 'minimal';
  hideTitle: boolean;
  borderPreset: string;
  showHeader: boolean;
  showPhotoBox: boolean;
  showOfficeStub: boolean;
  showCornerBands: boolean;
  showQrCode: boolean;
  showSecondarySigner: boolean;
  secondarySignerTitle: string;
  secondarySignerName: string;
  fontSize: number;
  cursiveNames: boolean;
}

interface CertificateDesignControlsProps {
  design: StudioDesignState;
  setDesign: React.Dispatch<React.SetStateAction<StudioDesignState>>;
  schoolSettings: SchoolSettings;
  onSettingsQuickChange?: (updated: SchoolSettings) => void;
  onOpenPadSettings?: () => void;
}

export default function CertificateDesignControls({
  design,
  setDesign,
  schoolSettings,
  onSettingsQuickChange,
  onOpenPadSettings,
}: CertificateDesignControlsProps) {
  const update = <K extends keyof StudioDesignState>(key: K, val: StudioDesignState[K]) =>
    setDesign((prev) => ({ ...prev, [key]: val }));

  const isPadCanvas =
    design.canvasMode === 'uploaded_pad' || design.canvasMode === 'preprinted_pad';
  const currentMargins = {
    ...DEFAULT_PAD_MARGINS,
    ...(schoolSettings.padMargins || {}),
  };

  const quickUpdatePadSetting = (patch: Partial<SchoolSettings>) => {
    settingsService.updateSettings(patch);
    const refreshed = settingsService.getSettings();
    onSettingsQuickChange?.(refreshed);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Quick Pad Calibration Controls (shown directly when in Uploaded / Pre-printed Pad mode) */}
      {isPadCanvas && (
        <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
              <Sliders size={13} className="text-indigo-600 dark:text-indigo-400" />
              প্যাড মার্জিন ও স্পেসিং কুইক টিউন
            </span>
            {onOpenPadSettings && (
              <button
                type="button"
                onClick={onOpenPadSettings}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-black text-[10.5px] hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition cursor-pointer"
              >
                সূত্র ও তারিখ বক্স ক্যালিব্রেট →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span>উপরে মার্জিন (হেডার গ্যাপ)</span>
                <span className="font-mono text-indigo-700 dark:text-indigo-300">
                  {currentMargins.top.toFixed(2)}&quot;
                </span>
              </div>
              <input
                type="range"
                min={0.8}
                max={4.0}
                step={0.05}
                value={currentMargins.top}
                onChange={(e) =>
                  quickUpdatePadSetting({
                    padMargins: { ...currentMargins, top: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <AlignJustify size={11} /> লাইন ব্যবধান
                </span>
                <span className="font-mono text-indigo-700 dark:text-indigo-300">
                  {(schoolSettings.padLineHeight || 2.05).toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={1.6}
                max={2.6}
                step={0.1}
                value={schoolSettings.padLineHeight || 2.05}
                onChange={(e) =>
                  quickUpdatePadSetting({ padLineHeight: parseFloat(e.target.value) })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span>প্রধান শিক্ষকের স্বাক্ষরের দূরত্ব</span>
              <span className="font-mono text-indigo-700 dark:text-indigo-300">
                {(schoolSettings.padSignatureGap ?? 2.5).toFixed(2)} rem
              </span>
            </div>
            <input
              type="range"
              min={1.0}
              max={5.5}
              step={0.25}
              value={schoolSettings.padSignatureGap ?? 2.5}
              onChange={(e) =>
                quickUpdatePadSetting({ padSignatureGap: parseFloat(e.target.value) })
              }
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Title Style + Hide Title Toggle */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
            শিরোনাম স্টাইল
          </label>
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={design.hideTitle}
              onChange={(e) => update('hideTitle', e.target.checked)}
              className="rounded text-indigo-600 cursor-pointer"
            />
            শিরোনাম লুকান
          </label>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'boxed', label: 'বক্সড' },
            { id: 'underline', label: 'আন্ডারলাইন' },
            { id: 'ribbon', label: 'রিবন' },
            { id: 'minimal', label: 'সাধারণ' },
          ].map((v) => (
            <button
              key={v.id}
              type="button"
              disabled={design.hideTitle}
              onClick={() =>
                update('titleVariant', v.id as StudioDesignState['titleVariant'])
              }
              className={`py-1.5 px-2 rounded-xl border font-bold text-[11px] transition cursor-pointer disabled:opacity-40 ${
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

      {/* Digital Frame Only Options (Hidden in Pad Mode to keep workspace super clean) */}
      {!isPadCanvas && (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Layout size={12} /> কাগজের আকার (A4)
              </label>
              <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                {[
                  { id: 'portrait', label: 'খাড়া' },
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
                {design.showHeader ? <Eye size={12} /> : <EyeOff size={12} />} ডিজিটাল হেডার
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
                {design.showHeader ? 'হেডার দৃশ্যমান' : 'হেডার লুকানো'}
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
                      active
                        ? 'scale-110 ring-2 ring-indigo-500 ring-offset-2 border-white'
                        : 'border-slate-200 dark:border-slate-700'
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

          {/* Border Frame Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
              বর্ডার ফ্রেম ডিজাইন
            </label>
            <select
              value={design.borderPreset}
              onChange={(e) => update('borderPreset', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              {CERTIFICATE_BORDER_PRESETS.filter((b) => b.id !== 'no_border_pad').map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nameBn}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Feature Toggles Grid */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {[
          { key: 'showQrCode' as const, label: 'QR যাচাই কোড', icon: QrCode, padSupported: true },
          { key: 'showPhotoBox' as const, label: '৩৫×৪৫ মিমি ছবি বক্স', icon: ImageIcon, padSupported: true },
          { key: 'showSecondarySigner' as const, label: '২য় স্বাক্ষরকারী', icon: UserCheck, padSupported: true },
          { key: 'cursiveNames' as const, label: 'কার্সিভ নাম (English)', icon: Type, padSupported: true },
          { key: 'showOfficeStub' as const, label: 'অফিস কপি স্টাব', icon: Scissors, padSupported: false },
          { key: 'showCornerBands' as const, label: 'কর্নার রিবন ব্যান্ড', icon: Palette, padSupported: false },
        ]
          .filter((item) => (!isPadCanvas ? true : item.padSupported))
          .map((item) => {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              ২য় স্বাক্ষরকারীর নাম (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={design.secondarySignerName}
              onChange={(e) => update('secondarySignerName', e.target.value)}
              placeholder="শিক্ষকের নাম"
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
            />
          </div>
        </div>
      )}

      {/* Font Size Slider */}
      <div className="space-y-1 pt-1">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
          <span>মূল লেখার ফন্ট সাইজ</span>
          <span className="font-mono text-indigo-600 dark:text-indigo-400">{design.fontSize}px</span>
        </div>
        <input
          type="range"
          min={12}
          max={22}
          step={0.5}
          value={design.fontSize}
          onChange={(e) => update('fontSize', Number(e.target.value))}
          className="w-full accent-indigo-600 cursor-pointer"
        />
      </div>
    </div>
  );
}
