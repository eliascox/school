'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  FileText,
  Printer,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import SchoolPadWrapper from '@/components/SchoolPadWrapper';
import {
  DEFAULT_PAD_HEADER_FIELDS,
  DEFAULT_PAD_MARGINS,
  PadHeaderFieldsConfig,
  SchoolSettings,
} from '@/services/settingsService';
import { processPadUpload } from '@/lib/padPdfRenderer';
import { showToast } from '@/components/ui/ToastProvider';
import { SettingsCard } from './settingsShared';
import PadHeaderCalibrationCard from './PadHeaderCalibrationCard';

interface PadSettingsTabProps {
  formData: SchoolSettings;
  handleChange: <K extends keyof SchoolSettings>(field: K, value: SchoolSettings[K]) => void;
}

export function PadSettingsTab({ formData, handleChange }: PadSettingsTabProps) {
  const [padPreviewMode, setPadPreviewMode] = useState<'full_pad' | 'preprinted' | 'blank_pad'>('full_pad');

  const handlePadFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const result = await processPadUpload(file);
        if (result.dataUrl) {
          handleChange('uploadedPadTemplateUrl', result.dataUrl);
          handleChange('uploadedPadType', result.padType);
          handleChange('uploadedPadFileName', result.fileName);
          handleChange('uploadedPadFileSize', result.fileSize);
          handleChange('activePadMode', 'uploaded');
        } else if (result.error) {
          showToast(result.error, 'error');
        }
      } catch (err: any) {
        console.error('Failed to process pad file', err);
        showToast('প্যাড ফাইল প্রসেস করতে ব্যর্থ হয়েছে: ' + (err?.message || ''), 'error');
      }
    }
  };

  return (
    <div className="space-y-6 w-full print:space-y-0 print:m-0 print:p-0">
      {/* Top Information Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl shadow-sm border border-indigo-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <h3 className="text-base font-black flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            অফিশিয়াল স্কুল প্যাড ম্যানেজমেন্ট
          </h3>
          <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
            আপনার প্রতিষ্ঠানের প্রেস-প্রিন্টেড বা ডিজিটাল প্যাড (PDF / ইমেজ) এখানে আপলোড করুন। নোটিশ, ছাড়পত্র, প্রশংসাপত্র, প্রত্যয়ন ও ফলাফল বিবরণী স্বয়ংক্রিয়ভাবে এই প্যাডের ভেতর নির্ধারিত মার্জিনে প্রিন্ট হবে।
          </p>
        </div>
        <div className="shrink-0">
          {formData.uploadedPadTemplateUrl ? (
            <span className="px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs">
              <CheckCircle2 size={14} className="text-emerald-400" />
              কাস্টম প্যাড সক্রিয়
            </span>
          ) : (
            <span className="px-3.5 py-1.5 bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5">
              ছাপা প্যাড মোড
            </span>
          )}
        </div>
      </div>

      {/* Main Full-Width Grid: Upload & Margins on Left (5 Cols), Live A4 Letterhead on Right (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full print:block print:p-0 print:m-0">

        {/* ─── LEFT COLUMN: PAD UPLOAD & MARGINS (5 Cols) ─── */}
        <div className="lg:col-span-5 space-y-5 print:hidden">

          {/* 1. PDF / IMAGE PAD UPLOAD CARD */}
          <SettingsCard
            title="১. অফিশিয়াল প্যাড আপলোড (PDF বা ছবি)"
            subtitle="আপনার প্রতিষ্ঠানের তৈরি করা A4 সাইজের PDF, PNG বা JPG লেটারহেড আপলোড করুন"
            icon={<Upload className="w-5 h-5" />}
            iconBg="bg-indigo-50" iconColor="text-indigo-600"
          >
            <div className="space-y-4">
              {formData.uploadedPadTemplateUrl ? (
                <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-xs font-black text-emerald-950 dark:text-emerald-200">কাস্টম প্যাড লোড হয়েছে</span>
                    </div>
                    <span className="px-2 py-0.5 bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-200 text-[10px] font-black rounded-md border border-emerald-300 dark:border-emerald-800/60 uppercase">
                      {formData.uploadedPadType === 'pdf' ? 'PDF ফাইল' : 'ইমেজ ফাইল'}
                    </span>
                  </div>

                  {/* Thumbnail / Status View */}
                  <div className="h-28 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/60 overflow-hidden flex items-center justify-center p-2 shadow-inner relative group">
                    {formData.uploadedPadTemplateUrl ? (
                      <img src={formData.uploadedPadTemplateUrl} alt="Pad Thumbnail" className="h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-600 dark:text-slate-400 space-y-1">
                        <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">কোন প্যাড সংযুক্ত নেই</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <label className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95">
                      <Upload size={14} />
                      নতুন প্যাড রিপ্লেস করুন
                      <input
                        type="file"
                        accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handlePadFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleChange('uploadedPadTemplateUrl', '')}
                      className="py-2 px-3 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      title="প্যাড মুছে ডিফল্ট করুন"
                    >
                      <Trash2 size={14} />
                      মুছুন
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 hover:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/50 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/50 p-6 rounded-2xl text-center transition-all cursor-pointer block relative group">
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handlePadFileUpload}
                      className="hidden"
                    />
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <Upload size={22} />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        প্যাড ফাইল নির্বাচন করুন
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        PDF, PNG, JPG বা WebP ফরম্যাট সমর্থিত
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </SettingsCard>

          {/* 2. MARGINS CONTROL CARD */}
          <SettingsCard
            title="২. মার্জিন ও লেখার অবস্থান নিয়ন্ত্রণ (ইঞ্চি)"
            subtitle="প্যাডের হেডারের নিচে যেখানে নোটিশ বা প্রত্যয়নের লেখা শুরু হবে তা নির্ধারণ করুন"
            icon={<Sliders className="w-5 h-5" />}
            iconBg="bg-sky-50" iconColor="text-sky-600"
          >
            <div className="space-y-4">
              {/* Top Margin */}
              <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-100">
                  <span>উপরে মার্জিন</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.2"
                      max="4.0"
                      step="0.05"
                      value={formData.padMargins?.top ?? DEFAULT_PAD_MARGINS.top}
                      onChange={(e) => handleChange('padMargins', { ...(formData.padMargins || DEFAULT_PAD_MARGINS), top: parseFloat(e.target.value) || DEFAULT_PAD_MARGINS.top })}
                      className="w-14 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-black text-indigo-700 dark:text-indigo-300 text-right text-xs"
                    />
                    <span className="text-slate-600 dark:text-slate-400 font-mono text-xs">&quot;</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="4.0"
                  step="0.05"
                  value={formData.padMargins?.top ?? DEFAULT_PAD_MARGINS.top}
                  onChange={(e) => handleChange('padMargins', { ...(formData.padMargins || DEFAULT_PAD_MARGINS), top: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400">প্যাডের হেডার ও সূত্র লাইনের নিচে যেখানে লেখা শুরু হবে (ডিফল্ট ২.৪ ইঞ্চি)।</p>
              </div>

              {/* Left Margin */}
              <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-100">
                  <span>বামে মার্জিন</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.2"
                      max="2.5"
                      step="0.05"
                      value={formData.padMargins?.left ?? DEFAULT_PAD_MARGINS.left}
                      onChange={(e) => handleChange('padMargins', { ...(formData.padMargins || DEFAULT_PAD_MARGINS), left: parseFloat(e.target.value) || DEFAULT_PAD_MARGINS.left })}
                      className="w-14 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-black text-indigo-700 dark:text-indigo-300 text-right text-xs"
                    />
                    <span className="text-slate-600 dark:text-slate-400 font-mono text-xs">&quot;</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.05"
                  value={formData.padMargins?.left ?? DEFAULT_PAD_MARGINS.left}
                  onChange={(e) => handleChange('padMargins', { ...(formData.padMargins || DEFAULT_PAD_MARGINS), left: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400">বামে মার্জিন (ডিফল্ট ০.৭৫ ইঞ্চি)।</p>
              </div>

              {/* Right Margin */}
              <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-100">
                  <span>ডানে মার্জিন</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.2"
                      max="2.0"
                      step="0.05"
                      value={formData.padMargins?.right ?? DEFAULT_PAD_MARGINS.right}
                      onChange={(e) => handleChange('padMargins', { ...(formData.padMargins || DEFAULT_PAD_MARGINS), right: parseFloat(e.target.value) || DEFAULT_PAD_MARGINS.right })}
                      className="w-14 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-black text-indigo-700 dark:text-indigo-300 text-right text-xs"
                    />
                    <span className="text-slate-600 dark:text-slate-400 font-mono text-xs">&quot;</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.05"
                  value={formData.padMargins?.right ?? DEFAULT_PAD_MARGINS.right}
                  onChange={(e) => handleChange('padMargins', { ...(formData.padMargins || DEFAULT_PAD_MARGINS), right: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Bottom Margin */}
              <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-100">
                  <span>নিচে মার্জিন</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.2"
                      max="2.0"
                      step="0.05"
                      value={formData.padMargins?.bottom ?? DEFAULT_PAD_MARGINS.bottom}
                      onChange={(e) => handleChange('padMargins', { ...(formData.padMargins || DEFAULT_PAD_MARGINS), bottom: parseFloat(e.target.value) || DEFAULT_PAD_MARGINS.bottom })}
                      className="w-14 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-black text-indigo-700 dark:text-indigo-300 text-right text-xs"
                    />
                    <span className="text-slate-600 dark:text-slate-400 font-mono text-xs">&quot;</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.05"
                  value={formData.padMargins?.bottom ?? DEFAULT_PAD_MARGINS.bottom}
                  onChange={(e) => handleChange('padMargins', { ...(formData.padMargins || DEFAULT_PAD_MARGINS), bottom: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Presets */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block">কুইক মার্জিন প্রিসেট:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('padMargins', { ...DEFAULT_PAD_MARGINS });
                      handleChange('padHeaderFields', { ...DEFAULT_PAD_HEADER_FIELDS });
                    }}
                    className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-[11px] font-bold transition text-left cursor-pointer"
                  >
                    ★ প্রাতিষ্ঠানিক প্যাড (Top: ২.৪&quot;, সূত্র ও তারিখ বক্সসহ)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('padMargins', { top: 3.0, left: 0.8, right: 0.8, bottom: 1.0 })}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold transition text-left cursor-pointer"
                  >
                    ★ বড় হেডার প্যাড (Top: ৩.০&quot;)
                  </button>
                </div>

                <PadHeaderCalibrationCard
                  headerFields={formData.padHeaderFields}
                  margins={formData.padMargins}
                  onChangeHeaderFields={(nextFields: PadHeaderFieldsConfig) =>
                    handleChange('padHeaderFields', nextFields)
                  }
                  onApplyPreset={(presetMargins, presetFields) => {
                    handleChange('padMargins', presetMargins);
                    if (presetFields) handleChange('padHeaderFields', presetFields);
                  }}
                />
              </div>
            </div>
          </SettingsCard>

          {/* 3. INTEGRATED MODULES LIST */}
          <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl space-y-2.5">
            <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              যেসব নথিতে এই প্যাড স্বয়ংক্রিয়ভাবে ব্যবহৃত হবে:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <Link href="/dashboard/notices" className="p-2 bg-white dark:bg-slate-900 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/60 rounded-xl transition flex items-center gap-1.5">
                📄 নোটিশ বোর্ড
              </Link>
              <Link href="/dashboard/certificates" className="p-2 bg-white dark:bg-slate-900 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/60 rounded-xl transition flex items-center gap-1.5">
                📜 ছাড়পত্র / টিসি
              </Link>
              <Link href="/dashboard/certificates" className="p-2 bg-white dark:bg-slate-900 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/60 rounded-xl transition flex items-center gap-1.5">
                🎓 প্রশংসাপত্র ও প্রত্যয়ন
              </Link>
              <Link href="/dashboard/certificates" className="p-2 bg-white dark:bg-slate-900 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/60 rounded-xl transition flex items-center gap-1.5">
                🛡️ চারিত্রিক সনদ
              </Link>
              <Link href="/dashboard/students?tab=summary" className="p-2 bg-white dark:bg-slate-900 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/60 rounded-xl transition flex items-center gap-1.5">
                📊 শিক্ষার্থী পরিসংখ্যান
              </Link>
              <Link href="/dashboard/exam/rank-result" className="p-2 bg-white dark:bg-slate-900 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/60 rounded-xl transition flex items-center gap-1.5">
                🏆 মেধা তালিকা ও র্যাঙ্ক
              </Link>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: LIVE REAL-TIME A4 PAD PREVIEW (7 Cols) ─── */}
        <div className="lg:col-span-7 space-y-3 print:space-y-0 print:p-0 print:m-0 print:w-full print:block">
          {/* Preview Toolbar */}
          <div className="bg-slate-900 text-white p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-sky-400">লাইভ প্যাড প্রিভিউ</span>

              <div className="flex items-center bg-slate-800 p-0.5 rounded-xl text-xs font-bold border border-slate-700">
                <button
                  type="button"
                  onClick={() => setPadPreviewMode('full_pad')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    padPreviewMode === 'full_pad' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                  title="আপলোড করা প্যাড ব্যাকগ্রাউন্ড দৃশ্যমান থাকবে"
                >
                  ডিজিটাল প্যাড
                </button>
                <button
                  type="button"
                  onClick={() => setPadPreviewMode('preprinted')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    padPreviewMode === 'preprinted' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                  title="প্রেসের ছাপানো কাগজের জন্য ব্যাকগ্রাউন্ড হাইড হবে"
                >
                  প্রি-প্রিন্টেড প্যাড
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 dark:text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Printer size={15} /> টেস্ট প্রিন্ট করুন
            </button>
          </div>

          {/* Live A4 Interactive Sheet */}
          <div className="bg-slate-200/80 dark:bg-slate-800/80 p-4 sm:p-6 rounded-3xl border border-slate-300 dark:border-slate-700 overflow-x-auto flex justify-center shadow-inner print:bg-transparent print:p-0 print:m-0 print:border-none print:shadow-none print:w-full print:block">
            <SchoolPadWrapper
              settings={formData}
              mode={padPreviewMode}
              title="প্রাতিষ্ঠানিক নোটিশ / প্রত্যয়ন নমুনা"
              refNo="BHS/SSC-TEST/2026/364"
              date={new Date().toISOString().split('T')[0]}
              hideHeaderActions={true}
              signatures={[
                {
                  title: formData.principalName || 'মোহাম্মদ রফিকুল ইসলাম',
                  designation: formData.principalTitle || 'প্রধান শিক্ষক',
                  institution: formData.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
                  address: formData.address || 'বরইতলী, চকরিয়া, কক্সবাজার।',
                  rightAligned: true,
                },
              ]}
            >
              <div className="space-y-3 text-xs leading-relaxed text-slate-800 font-medium">
                <p>
                  এতদ্বারা বরইতলী উচ্চ বিদ্যালয়ের সকল শিক্ষক-শিক্ষিকা, অভিভাবক ও সংশ্লিষ্ট সকলের অবগতির জন্য জানানো যাচ্ছে যে, অত্র বিদ্যালয়ের আপলোডকৃত অফিশিয়াল স্কুল প্যাড ম্যানেজমেন্ট সিস্টেমটি সক্রিয় রয়েছে।
                </p>
                <p>
                  বিদ্যালয়ের প্রাতিষ্ঠানিক সকল নোটিশ, শিক্ষার্থীদের চারিত্রিক সনদপত্র, ছাড়পত্র, প্রশংসাপত্র, অধ্যয়নরত প্রত্যয়ন পত্র, শ্রেণিভিত্তিক পরিসংখ্যান রিপোর্ট এবং পরীক্ষার ফলাফল বিবরণী অত্র নির্ধারিত মার্জিন ও প্যাডে মুদ্রিত হবে।
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono">
                  ★ বর্তমান মার্জিন: উপরে <strong>{formData.padMargins?.top ?? 0.5}&quot;</strong> | বামে <strong>{formData.padMargins?.left ?? 0.5}&quot;</strong> | ডানে <strong>{formData.padMargins?.right ?? 0.5}&quot;</strong> | নিচে <strong>{formData.padMargins?.bottom ?? 0.5}&quot;</strong>
                </div>
              </div>
            </SchoolPadWrapper>
          </div>
        </div>

      </div>
    </div>
  );
}
