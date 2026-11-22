'use client';

import React from 'react';
import { Award, BookOpen, Check, FileText, ImageIcon, Printer, SlidersHorizontal, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { CustomPngBorder, SchoolSettings } from '@/services/settingsService';
import { CertificateRecord } from '@/services/certificateService';
import {
  buildRecordFromCertificate,
  PrintLayoutConfig,
  SSCTestimonialRecord,
} from './sscTranscriptUtils';
import SSCTestimonialSheetCard from './SSCTestimonialSheetCard';

export interface SscSettingsTabProps {
  customBorders: CustomPngBorder[];
  selectedBorderId: string;
  activeBorderUrl: string | null;
  layoutConfig: PrintLayoutConfig;
  schoolSettings: SchoolSettings;
  onSelectBorder: (borderId: string) => void;
  onDeleteBorder: (borderId: string) => void;
  onUploadBorderSlot: (slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateLayoutConfig: (cfg: Partial<PrintLayoutConfig>) => void;
}

export function SscSettingsTab({
  customBorders,
  selectedBorderId,
  activeBorderUrl,
  layoutConfig,
  schoolSettings,
  onSelectBorder,
  onDeleteBorder,
  onUploadBorderSlot,
  onUpdateLayoutConfig,
}: SscSettingsTabProps) {
  return (
    <div className="space-y-8 print:hidden">
      {/* 1. PNG Border Slots Manager */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <ImageIcon size={18} className="text-purple-600 dark:text-purple-400" />
              ১. পিএনজি বর্ডার ফ্রেম ম্যানেজার (PNG Border Slots)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              প্রশংসাপত্রের চারপাশের জন্য (৯.২&quot; × ৮.২&quot;) স্বচ্ছ ট্রান্সপারেন্ট পিএনজি বর্ডার আপলোড করুন। যেকোনো সময় সক্রিয় বা বাদ দিতে পারেন।
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectBorder('none')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              !activeBorderUrl
                ? 'bg-amber-500 text-slate-950 dark:text-white font-black ring-2 ring-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            কোনো বর্ডার নয় (No Border)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map((slotIdx) => {
            const border = customBorders[slotIdx];
            const isSelected = border && selectedBorderId === border.id;

            return (
              <div
                key={slotIdx}
                className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/50 shadow-md ring-2 ring-indigo-300'
                    : border
                      ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wider">
                      স্লট {slotIdx + 1}
                    </span>
                    {isSelected && (
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-black flex items-center gap-1">
                        <Check size={12} /> সক্রিয় ফ্রেম
                      </span>
                    )}
                  </div>

                  <div className="h-52 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden relative group">
                    {border ? (
                      <>
                        <img src={border.url} alt={border.name} className="w-full h-full object-contain p-2" />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectBorder(border.id)}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-black rounded-xl cursor-pointer shadow hover:bg-indigo-700"
                          >
                            সক্রিয় করুন
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteBorder(border.id)}
                            className="p-1.5 bg-rose-600 text-white rounded-xl cursor-pointer hover:bg-rose-700"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4 text-slate-400">
                        <ImageIcon size={36} className="mx-auto mb-1 opacity-50" />
                        <p className="text-[11px] font-bold">স্লট {slotIdx + 1} খালি রয়েছে</p>
                        <p className="text-[9px] text-slate-400">PNG ফ্রেম আপলোড করুন</p>
                      </div>
                    )}
                  </div>

                  {border && (
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate text-center">
                      {border.name}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-xs">
                    <Upload size={14} /> {border ? `বর্ডার ${slotIdx + 1} পরিবর্তন করুন` : `বর্ডার ${slotIdx + 1} আপলোড`}
                    <input
                      type="file"
                      accept="image/png"
                      onChange={(e) => onUploadBorderSlot(slotIdx, e)}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-0.5">
            <span className="font-black text-slate-800 dark:text-slate-100">বর্ডার অপাসিটি (Border Opacity):</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              বর্ডার হালকা বা ১০০% গাঢ় করার জন্য স্লাইডার ব্যবহার করুন।
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.4"
              max="1.0"
              step="0.05"
              value={layoutConfig.borderOpacity ?? 1.0}
              onChange={(e) => onUpdateLayoutConfig({ borderOpacity: parseFloat(e.target.value) })}
              className="w-36 sm:w-48 accent-indigo-600 cursor-pointer"
            />
            <span className="font-mono font-black text-indigo-700 dark:text-indigo-300 text-xs w-10">
              {Math.round((layoutConfig.borderOpacity ?? 1.0) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Margins & Safe Spacing */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-emerald-600 dark:text-emerald-400" />
              ২. প্রশংসাপত্র সাইজ ও ৪ দিকের মার্জিন টিউন (Size & Safe Margins)
            </h4>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 rounded-xl font-mono font-black text-xs">
              নির্ধারিত সাইজ: ৯.২&quot; (প্রস্থ) × ৮.২&quot; (উচ্চতা)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            বর্ডারের ভেতরে লেখা যেন পুরোপুরি সুরক্ষিত থাকে, সেজন্য ৪ দিকের মার্জিন প্রয়োজন অনুযায়ী নিখুঁত করুন।
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          {[
            { label: 'টপ মার্জিন (Top):', key: 'topMargin' as const, hint: 'হেডারের উপরের খালি জায়গা', color: 'text-indigo-600 dark:text-indigo-400', accent: 'accent-indigo-600' },
            { label: 'বটম মার্জিন (Bottom):', key: 'bottomMargin' as const, hint: 'স্বাক্ষরের নিচের খালি জায়গা', color: 'text-indigo-600 dark:text-indigo-400', accent: 'accent-indigo-600' },
            { label: 'বাম মার্জিন (Left):', key: 'leftMargin' as const, hint: 'বাম পাশের বর্ডার সেফটি', color: 'text-emerald-600 dark:text-emerald-400', accent: 'accent-emerald-600' },
            { label: 'ডান মার্জিন (Right):', key: 'rightMargin' as const, hint: 'ডান পাশের বর্ডার সেফটি', color: 'text-emerald-600 dark:text-emerald-400', accent: 'accent-emerald-600' },
          ].map((m) => (
            <div key={m.key} className="space-y-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-700 dark:text-slate-300">{m.label}</span>
                <span className={`font-mono font-black ${m.color}`}>{layoutConfig[m.key]}&quot;</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.5"
                step="0.05"
                value={layoutConfig[m.key]}
                onChange={(e) => onUpdateLayoutConfig({ [m.key]: parseFloat(e.target.value) })}
                className={`w-full cursor-pointer ${m.accent}`}
              />
              <p className="text-[10px] text-slate-400">{m.hint}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
          <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center font-bold">
              <span className="text-slate-700 dark:text-slate-300">ইংরেজি লেখার ফন্ট স্কেল:</span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-black">{layoutConfig.fontScale}%</span>
            </div>
            <input
              type="range"
              min="75"
              max="175"
              step="5"
              value={layoutConfig.fontScale}
              onChange={(e) => onUpdateLayoutConfig({ fontScale: parseInt(e.target.value, 10) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex items-center justify-between gap-1 pt-1">
              {[90, 100, 115, 130, 150].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onUpdateLayoutConfig({ fontScale: preset })}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                    layoutConfig.fontScale === preset
                      ? 'bg-amber-500 text-slate-950 dark:text-white font-black'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-700 dark:text-slate-300 font-bold block">প্যারাগ্রাফ লাইন স্পেসিং:</span>
            <div className="grid grid-cols-3 gap-1 bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-xl">
              {(['tight', 'normal', 'relaxed'] as const).map((lh) => (
                <button
                  key={lh}
                  type="button"
                  onClick={() => onUpdateLayoutConfig({ lineHeight: lh })}
                  className={`py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer capitalize ${
                    layoutConfig.lineHeight === lh
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lh === 'tight' ? 'টাইট' : lh === 'normal' ? 'স্বাভাবিক' : 'খোলামেলা'}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">লাইনের মধ্যবর্তী দূরত্ব</p>
          </div>

          <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center font-bold">
              <span className="text-slate-700 dark:text-slate-300">স্বাক্ষর ব্লকের ফাঁকা স্পেস:</span>
              <span className="font-mono text-sky-600 dark:text-sky-400 font-black">{layoutConfig.signatureGap}px</span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              step="2"
              value={layoutConfig.signatureGap}
              onChange={(e) => onUpdateLayoutConfig({ signatureGap: parseInt(e.target.value, 10) })}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">স্বাক্ষরের উপরের দূরত্ব</p>
          </div>
        </div>
      </div>

      {/* 3. Typography & Mobile Number */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <span className="text-slate-900 dark:text-white font-black text-sm flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            TESTIMONIAL টাইটেল ও নামের ফন্ট স্টাইল:
          </span>
          <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            {(['cinzel', 'playfair', 'classic'] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => onUpdateLayoutConfig({ titleStyle: style })}
                className={`py-2.5 rounded-xl text-xs font-black transition cursor-pointer capitalize ${
                  (layoutConfig.titleStyle || 'cinzel') === style
                    ? 'bg-slate-900 text-white shadow-md ring-2 ring-amber-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {style === 'cinzel' ? 'Cinzel রাজকীয়' : style === 'playfair' ? 'Playfair মার্জিত' : 'ক্লাসিক সেরিফ'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            {(['cursive', 'serif_italic', 'classic_bold'] as const).map((nf) => (
              <button
                key={nf}
                type="button"
                onClick={() => onUpdateLayoutConfig({ nameFontStyle: nf })}
                className={`py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  (layoutConfig.nameFontStyle || 'cursive') === nf
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {nf === 'cursive' ? 'কার্সিভ স্ক্রিপ্ট' : nf === 'serif_italic' ? 'ইতালিক সেরিফ' : 'বোল্ড ক্লাসিক'}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">শিক্ষার্থী ও পিতা-মাতার নাম স্টাইলিস্ট কার্সিভ স্ক্রিপ্ট ফন্টে প্রদর্শিত হবে।</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <span className="text-slate-900 dark:text-white font-black text-sm flex items-center gap-2">
            <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
            হেডারে স্কুলের মোবাইল নম্বর (Header Mobile No):
          </span>
          <input
            type="text"
            placeholder="e.g. 01819-000000"
            value={
              layoutConfig.customPhone !== undefined && layoutConfig.customPhone !== ''
                ? layoutConfig.customPhone
                : schoolSettings?.phone || '01819-000000'
            }
            onChange={(e) => onUpdateLayoutConfig({ customPhone: e.target.value })}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-black text-indigo-700 dark:text-indigo-300 outline-none"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            EIIN ও Established লাইনের ঠিক নিচে Mobile লাইনে প্রদর্শিত হবে।
          </p>
        </div>
      </div>
    </div>
  );
}

export interface SscRegisterTabProps {
  certificates: CertificateRecord[];
  schoolSettings: SchoolSettings;
  onReprintCertificate: (record: SSCTestimonialRecord) => void;
}

export function SscRegisterTab({ certificates, schoolSettings, onReprintCertificate }: SscRegisterTabProps) {
  const sscCerts = certificates.filter((c) => c.type === 'ssc_testimonial');

  return (
    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 print:hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="font-black text-slate-950 dark:text-white text-base flex items-center gap-2">
            <BookOpen size={20} className="text-sky-600 dark:text-sky-400" />
            প্রদানকৃত প্রশংসাপত্র রেজিস্টার ও রেকর্ডস ({sscCerts.length} টি)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            পূর্বে ইস্যুকৃত এসএসসি প্রশংসাপত্রের ইতিহাস, যাচাই ও পুনরায় প্রিন্ট সুবিধা।
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-left border-collapse text-xs font-medium">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-800">
              <th className="p-3">স্মারক নম্বর</th>
              <th className="p-3">শিক্ষার্থীর নাম</th>
              <th className="p-3">বোর্ড রোল</th>
              <th className="p-3">রেজিস্ট্রেশন</th>
              <th className="p-3">সন / সেশন</th>
              <th className="p-3">জিপিএ</th>
              <th className="p-3">ইস্যুর তারিখ</th>
              <th className="p-3 text-right">একশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-800 dark:text-slate-100">
            {sscCerts.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  কোনো প্রশংসাপত্র ইস্যুর রেকর্ড নেই
                </td>
              </tr>
            ) : (
              sscCerts.map((cert) => (
                <tr key={cert.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800 transition">
                  <td className="p-3 font-mono font-black text-indigo-700 dark:text-indigo-300">{cert.refNo}</td>
                  <td className="p-3 font-black text-slate-950 dark:text-white">{cert.studentName}</td>
                  <td className="p-3 font-mono">{cert.boardRoll || '—'}</td>
                  <td className="p-3 font-mono">{cert.boardReg || '—'}</td>
                  <td className="p-3">
                    {cert.passingYear} ({cert.session})
                  </td>
                  <td className="p-3 font-mono font-black text-emerald-700 dark:text-emerald-300">
                    {cert.gpa || '—'}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{cert.issueDate}</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => onReprintCertificate(buildRecordFromCertificate(cert, schoolSettings))}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer ml-auto"
                      title="পুনরায় এই সনদটি প্রিন্ট করুন"
                    >
                      <Printer size={12} /> সনদটি প্রিন্ট
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface SscPreviewModalProps {
  record: SSCTestimonialRecord | null;
  schoolSettings: SchoolSettings;
  layoutConfig: PrintLayoutConfig;
  activeBorderUrl: string | null;
  qrCodeUrl?: string;
  onUpdateLayoutConfig: (cfg: Partial<PrintLayoutConfig>) => void;
  onDirectBorderUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
}

export function SscPreviewModal({
  record,
  schoolSettings,
  layoutConfig,
  activeBorderUrl,
  qrCodeUrl,
  onUpdateLayoutConfig,
  onDirectBorderUpload,
  onClose,
}: SscPreviewModalProps) {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full p-6 space-y-4 max-h-[95vh] overflow-y-auto print:max-w-none print:p-0 print:h-auto print:overflow-visible print:border-none print:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <Award size={20} className="text-amber-500" />
            <h3 className="font-black text-slate-950 dark:text-white text-sm">
              অফিশিয়াল প্রশংসাপত্র প্রিভিউ (৯.২&quot; × ৮.২&quot;) • {record.studentName}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-400 mr-1">ফন্ট সাইজ:</span>
              <button
                type="button"
                onClick={() => onUpdateLayoutConfig({ fontScale: Math.max(75, layoutConfig.fontScale - 5) })}
                className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-black flex items-center justify-center border border-slate-300 dark:border-slate-700 cursor-pointer"
                title="ফন্ট ছোট করুন"
              >
                −
              </button>
              <span className="font-mono font-black text-indigo-700 dark:text-indigo-300 px-1.5 min-w-[44px] text-center">
                {layoutConfig.fontScale}%
              </span>
              <button
                type="button"
                onClick={() => onUpdateLayoutConfig({ fontScale: Math.min(175, layoutConfig.fontScale + 5) })}
                className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-black flex items-center justify-center border border-slate-300 dark:border-slate-700 cursor-pointer"
                title="ফন্ট বড় করুন"
              >
                +
              </button>
            </div>

            <label className="relative cursor-pointer">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={onDirectBorderUpload}
              />
              <span className="px-3 py-2 rounded-xl font-bold text-xs bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800/60 flex items-center gap-1.5 transition">
                <Upload size={13} />
                {activeBorderUrl ? 'বর্ডার পরিবর্তন' : 'বর্ডার যোগ করুন'}
              </span>
            </label>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Printer size={16} /> সনদটি প্রিন্ট করুন (Print Certificate)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex justify-center p-2 sm:p-6 bg-slate-100 dark:bg-slate-800/60 rounded-2xl overflow-x-auto print:bg-white print:p-0">
          <SSCTestimonialSheetCard
            record={record}
            schoolSettings={schoolSettings}
            layoutConfig={layoutConfig}
            borderImageUrl={activeBorderUrl || ''}
            qrCodeUrl={qrCodeUrl}
          />
        </div>
      </div>
    </div>
  );
}
