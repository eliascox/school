'use client';

import React, { useState } from 'react';
import { Download, Image as ImageIcon, Palette, Save, Sparkles, Trash2, Upload, X } from 'lucide-react';
import type { Student } from '@/services/studentService';
import type { SchoolSettings } from '@/services/settingsService';
import {
  type IdCardBuiltInStyle,
  type IdCardDocLang,
  type IdCardHeaderStyle,
  type IdCardOrientation,
  type IdCardPhotoShape,
  type IdCardTemplateConfig,
} from '@/lib/idCardTemplateTypes';
import { compressTemplateImageFile, formatBytesReadable } from '@/lib/idCardTemplateStorage';
import { StudentIdCardPreview } from './StudentIdCardPreview';

export interface IdCardCustomTemplateModalProps {
  initialTemplate: IdCardTemplateConfig;
  sampleStudent: Student;
  schoolSettings: SchoolSettings;
  docLang: IdCardDocLang;
  cardOrientation: IdCardOrientation;
  sessionYear: string;
  onSave: (template: IdCardTemplateConfig) => Promise<void>;
  onExportJson: (template: IdCardTemplateConfig) => void;
  onClose: () => void;
}

const CURATED_SWATCHES = [
  { name: 'এমারেল্ড', primary: '#0B5D3B', secondary: '#0F766E', accent: '#F59E0B' },
  { name: 'রয়্যাল নেভি', primary: '#1E3A8A', secondary: '#2563EB', accent: '#38BDF8' },
  { name: 'ক্রিমসন বোর্ড', primary: '#881337', secondary: '#BE123C', accent: '#D97706' },
  { name: 'পার্‌পল স্টুডিও', primary: '#4C1D95', secondary: '#7C3AED', accent: '#FBBF24' },
  { name: 'মিডনাইট গোল্ড', primary: '#0F172A', secondary: '#1E293B', accent: '#EAB308' },
  { name: 'টিল অ্যাকোয়া', primary: '#115E59', secondary: '#0D9488', accent: '#FACC15' },
];

export function IdCardCustomTemplateModal({
  initialTemplate,
  sampleStudent,
  schoolSettings,
  docLang,
  cardOrientation,
  sessionYear,
  onSave,
  onExportJson,
  onClose,
}: IdCardCustomTemplateModalProps) {
  const [draft, setDraft] = useState<IdCardTemplateConfig>({ ...initialTemplate, isBuiltIn: false });
  const [previewOri, setPreviewOri] = useState<IdCardOrientation>(cardOrientation);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const patch = (next: Partial<IdCardTemplateConfig>) => {
    setDraft((prev) => ({ ...prev, ...next }));
  };

  const handleImageUpload = async (
    file: File,
    field: 'customFrontBgDataUrl' | 'customBackBgDataUrl' | 'principalSignatureDataUrl',
  ) => {
    try {
      setUploadStatus('ছবি অপ্টিমাইজ করা হচ্ছে...');
      const isSig = field === 'principalSignatureDataUrl';
      const result = await compressTemplateImageFile(file, {
        maxWidth: isSig ? 480 : 1050,
        maxHeight: isSig ? 200 : 1050,
        quality: 0.88,
        preserveAlpha: isSig,
      });
      patch({
        [field]: result.dataUrl,
        ...(field === 'customFrontBgDataUrl' ? { baseStyle: 'custom_artwork' as IdCardBuiltInStyle } : {}),
      });
      setUploadStatus(
        `অপ্টিমাইজ সম্পন্ন (${result.width}×${result.height}px · ${formatBytesReadable(result.byteSize)} · লোকাল সংরক্ষিত)`,
      );
    } catch (err) {
      setUploadStatus(err instanceof Error ? err.message : 'ছবি প্রসেস করা যায়নি।');
    }
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      await onSave({
        ...draft,
        name: draft.name.trim() || 'আমার কাস্টম আইডি টেম্পলেট',
        isBuiltIn: false,
        updatedAt: Date.now(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 print:hidden">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Palette className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                কাস্টম আইডি কার্ড ডিজাইন টেম্পলেট স্টুডিও
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                পছন্দমতো রঙ, লেআউট, ফিল্ড ও নিজস্ব ব্যাকগ্রাউন্ড ফ্রেম সেভ করুন (সার্ভার স্পেস ০ KB)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Split Body: Left Controls + Right Live Front/Back Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Left Controls */}
          <div className="lg:col-span-6 p-4 sm:p-5 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-200 mb-1">
                টেম্পলেটের নাম
              </label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="যেমন: ৯ম-১০ম বিজ্ঞান স্পেশাল কার্ড ২০২৬"
                className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            {/* Quick Palette Swatches */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-200 mb-1.5">
                দ্রুত কালার থিম ও কাস্টম রঙ
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {CURATED_SWATCHES.map((sw) => (
                  <button
                    key={sw.name}
                    type="button"
                    onClick={() =>
                      patch({
                        primaryColor: sw.primary,
                        secondaryColor: sw.secondary,
                        accentColor: sw.accent,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[10px] font-bold hover:border-slate-400 cursor-pointer"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: sw.primary }}
                    />
                    <span>{sw.name}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: 'primaryColor', label: 'প্রাইমারি' },
                    { key: 'secondaryColor', label: 'সেকেন্ডারি' },
                    { key: 'accentColor', label: 'অ্যাক্সেন্ট' },
                  ] as const
                ).map((c) => (
                  <label
                    key={c.key}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer"
                  >
                    <input
                      type="color"
                      value={draft[c.key]}
                      onChange={(e) => patch({ [c.key]: e.target.value })}
                      className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
                    />
                    <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
                      {c.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Header Style & Photo Frame */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-200 mb-1">
                  হেডার স্টাইল
                </label>
                <select
                  value={draft.headerStyle}
                  onChange={(e) => patch({ headerStyle: e.target.value as IdCardHeaderStyle })}
                  className="w-full h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                >
                  <option value="wave">কার্ভড ওয়েভ (Modern Wave)</option>
                  <option value="angled">অ্যাঙ্গেল্ড রিবন (Geometric)</option>
                  <option value="classic">ক্লাসিক ব্যানার (Board)</option>
                  <option value="minimal">মিনিমাল টপ বার (Ink-Saver)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-200 mb-1">
                  ছবির ফ্রেম
                </label>
                <select
                  value={draft.photoShape}
                  onChange={(e) => patch({ photoShape: e.target.value as IdCardPhotoShape })}
                  className="w-full h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                >
                  <option value="circle">গোল (Circle Halo)</option>
                  <option value="rounded">রাউন্ডেড বক্স (Modern)</option>
                  <option value="square">পাসপোর্ট বক্স (Classic)</option>
                </select>
              </div>
            </div>

            {/* Custom Artwork Uploads (Front / Back / Principal Signature) */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  নিজস্ব ব্যাকগ্রাউন্ড ফ্রেম / স্বাক্ষর আপলোড (ঐচ্ছিক)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(
                  [
                    { field: 'customFrontBgDataUrl', label: 'সামনের ব্যাকগ্রাউন্ড' },
                    { field: 'customBackBgDataUrl', label: 'পেছনের ব্যাকগ্রাউন্ড' },
                    { field: 'principalSignatureDataUrl', label: 'প্রধান শিক্ষকের স্বাক্ষর' },
                  ] as const
                ).map((item) => {
                  const hasImg = Boolean(draft[item.field]);
                  return (
                    <div
                      key={item.field}
                      className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-center space-y-1.5"
                    >
                      <p className="text-[10px] font-extrabold text-slate-700 dark:text-slate-200">
                        {item.label}
                      </p>
                      <div className="flex items-center justify-center gap-1">
                        <label className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer hover:bg-indigo-100">
                          <Upload className="w-3 h-3" />
                          <span>{hasImg ? 'পরিবর্তন' : 'আপলোড'}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleImageUpload(f, item.field);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        {hasImg && (
                          <button
                            type="button"
                            onClick={() => patch({ [item.field]: undefined })}
                            className="p-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                            title="মুছুন"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {(draft.customFrontBgDataUrl || draft.customBackBgDataUrl) && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 shrink-0">
                    ব্যাকগ্রাউন্ড স্বচ্ছতা:
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={0.7}
                    step={0.05}
                    value={draft.artworkOverlayOpacity ?? 0.14}
                    onChange={(e) => patch({ artworkOverlayOpacity: Number(e.target.value) })}
                    className="flex-1 accent-[#0B5D3B]"
                  />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 w-9 text-right">
                    {Math.round((draft.artworkOverlayOpacity ?? 0.14) * 100)}%
                  </span>
                </div>
              )}

              {uploadStatus && (
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  {uploadStatus}
                </p>
              )}
            </div>

            {/* Toggleable Fields */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-200 mb-1.5">
                কার্ডে যে তথ্যগুলো দেখাবে
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                {(
                  [
                    { key: 'showQrCode', label: 'ভেক্টর QR' },
                    { key: 'showWatermark', label: 'জলছাপ লোগো' },
                    { key: 'showBloodGroup', label: 'রক্তের গ্রুপ' },
                    { key: 'showGuardian', label: 'অভিভাবক' },
                    { key: 'showEmergencyPhone', label: 'জরুরি ফোন' },
                    { key: 'showDob', label: 'জন্ম তারিখ' },
                    { key: 'showAddress', label: 'ঠিকানা' },
                    { key: 'showValidity', label: 'মেয়াদ লাইন' },
                  ] as const
                ).map((f) => (
                  <label
                    key={f.key}
                    className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(draft[f.key])}
                      onChange={(e) => patch({ [f.key]: e.target.checked })}
                      className="rounded accent-[#0B5D3B]"
                    />
                    <span>{f.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Validity & Back Notice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  মেয়াদ টেক্সট (বাংলা)
                </label>
                <input
                  type="text"
                  value={draft.validityTextBn}
                  onChange={(e) => patch({ validityTextBn: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Validity Text (English)
                </label>
                <input
                  type="text"
                  value={draft.validityTextEn}
                  onChange={(e) => patch({ validityTextEn: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                পেছনের দিকের নির্দেশনা ({docLang === 'en' ? 'English' : 'বাংলা'})
              </label>
              <textarea
                rows={2}
                value={docLang === 'en' ? draft.backNoticeEn : draft.backNoticeBn}
                onChange={(e) =>
                  patch(docLang === 'en' ? { backNoticeEn: e.target.value } : { backNoticeBn: e.target.value })
                }
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Right Live Interactive Preview */}
          <div className="lg:col-span-6 p-5 bg-slate-100/80 dark:bg-slate-950/70 flex flex-col items-center justify-center gap-4">
            <div className="flex items-center justify-between w-full max-w-md">
              <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                লাইভ ফ্রন্ট ও ব্যাক প্রিভিউ ({docLang === 'en' ? 'English' : 'বাংলা'})
              </span>
              <div className="inline-flex rounded-xl bg-white dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-800">
                {(['portrait', 'landscape'] as IdCardOrientation[]).map((ori) => (
                  <button
                    key={ori}
                    type="button"
                    onClick={() => setPreviewOri(ori)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer ${
                      previewOri === ori
                        ? 'bg-[#0B5D3B] text-white'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {ori === 'portrait' ? 'লম্বা' : 'আড়াআড়ি'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto max-w-full flex justify-center">
              <StudentIdCardPreview
                student={sampleStudent}
                settings={schoolSettings}
                orientation={previewOri}
                sideMode="both_side_by_side"
                template={draft}
                docLang={docLang}
                sessionYear={sessionYear}
                showCropMarks={true}
              />
            </div>

            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 text-center max-w-sm">
              এই কাস্টম টেম্পলেটটি লোকাল স্টোরেজে সংরক্ষিত থাকবে এবং চাইলে `.json` ফাইল হিসেবে ব্যাকআপ বা অন্য কম্পিউটারে ব্যবহার করতে পারবেন।
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-slate-50/70 dark:bg-slate-950/60">
          <button
            type="button"
            onClick={() => onExportJson(draft)}
            className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-extrabold inline-flex items-center gap-1.5 hover:bg-slate-100 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>JSON ব্যাকআপ</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveClick}
              className="h-9 px-4 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] disabled:opacity-60 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'টেম্পলেট সংরক্ষণ ও প্রয়োগ করুন'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
