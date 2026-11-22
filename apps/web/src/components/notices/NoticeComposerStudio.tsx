'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Coins,
  Copy,
  Palette,
  Printer,
  Send,
  SlidersHorizontal,
  Sparkle,
  Sparkles,
} from 'lucide-react';
import { Notice } from '@/services/noticeService';
import { SchoolSettings } from '@/services/settingsService';
import {
  ClassFeeItem,
  FeeSector,
  formatNoticeDate,
  generateClassFeeString,
  NOTICE_FEE_SECTORS,
  NOTICE_TEMPLATES,
  NoticeTemplate,
} from './noticeHelpers';

export interface NoticeComposerStudioProps {
  editingNotice: Notice | null;
  schoolSettings: SchoolSettings;
  title: string;
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  category: Notice['category'];
  setCategory: (v: Notice['category']) => void;
  priority: Notice['priority'];
  setPriority: (v: Notice['priority']) => void;
  targetAudience: Notice['targetAudience'];
  setTargetAudience: (v: Notice['targetAudience']) => void;
  publisherName: string;
  setPublisherName: (v: string) => void;
  publisherRole: string;
  setPublisherRole: (v: string) => void;
  refNo: string;
  setRefNo: (v: string) => void;
  publishedDate: string;
  setPublishedDate: (v: string) => void;
  isPinned: boolean;
  setIsPinned: (v: boolean) => void;
  autoSyncTitle: boolean;
  setAutoSyncTitle: (v: boolean) => void;
  selectedFeeSector: FeeSector;
  classFees: ClassFeeItem[];
  showWatermark: boolean;
  contentFontSize: number;
  schoolNameColor: string;
  topLineColor: string;
  bottomLineColor: string;
  logoLeftOffset: number;
  signatureTopGap: number;
  onBackToList: () => void;
  onSaveColors: (nameColor: string, topColor: string, bottomColor: string) => void;
  onUpdateLogoOffset: (offset: number) => void;
  onLoadFeesForSector: (sector: FeeSector) => ClassFeeItem[];
  onUpdateClassFee: (index: number, fee: string) => void;
  onInsertClassFees: () => void;
  onApplyTemplate: (tmpl: NoticeTemplate) => void;
  onTitleChange: (newTitle: string) => void;
  onInsertSnippet: (snippetType: string) => void;
  onSubmitNotice: (e: React.FormEvent) => void;
  onCopyNoticeText: () => void;
  onOpenPrintView: () => void;
  onShowAlert: (type: 'success' | 'error', text: string) => void;
}

export default function NoticeComposerStudio({
  editingNotice,
  schoolSettings,
  title,
  content,
  setContent,
  category,
  setCategory,
  priority,
  setPriority,
  targetAudience,
  setTargetAudience,
  publisherName,
  setPublisherName,
  publisherRole,
  setPublisherRole,
  refNo,
  setRefNo,
  publishedDate,
  setPublishedDate,
  isPinned,
  setIsPinned,
  autoSyncTitle,
  setAutoSyncTitle,
  selectedFeeSector,
  classFees,
  showWatermark,
  contentFontSize,
  schoolNameColor,
  topLineColor,
  bottomLineColor,
  logoLeftOffset,
  signatureTopGap,
  onBackToList,
  onSaveColors,
  onUpdateLogoOffset,
  onLoadFeesForSector,
  onUpdateClassFee,
  onInsertClassFees,
  onApplyTemplate,
  onTitleChange,
  onInsertSnippet,
  onSubmitNotice,
  onCopyNoticeText,
  onOpenPrintView,
  onShowAlert,
}: NoticeComposerStudioProps) {
  const [showColorController, setShowColorController] = useState(false);

  const handleInsertFeeSectorText = (sector: FeeSector, heading: string, alertText: string) => {
    const fees = onLoadFeesForSector(sector);
    setContent((prev) => `${prev.trim()}\n\n${heading}:\n${generateClassFeeString(fees)}`);
    onShowAlert('success', alertText);
  };

  const activeSectorLabel =
    NOTICE_FEE_SECTORS.find((s) => s.id === selectedFeeSector)?.shortLabel || 'পরীক্ষার ফি';

  return (
    <div className="space-y-6 print:hidden animate-in fade-in">
      {/* Top Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToList}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl font-black text-xs transition cursor-pointer"
          >
            <ArrowLeft size={16} /> নোটিশ তালিকায় ফিরুন
          </button>

          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              {editingNotice ? 'নোটিশ সম্পাদনা স্টুডিও' : 'নতুন প্রাতিষ্ঠানিক নোটিশ ড্রাফটার'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              বাম পাশে লিখুন — ডান পাশে রিয়েল-টাইম অফিসিয়াল প্যাডে সরাসরি লাইভ রূপ দেখুন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowColorController(!showColorController)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition border cursor-pointer ${
              showColorController
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                : 'bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60'
            }`}
          >
            <Palette size={15} /> প্যাড স্টাইল
          </button>

          <button
            type="button"
            onClick={onSubmitNotice}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Send size={15} /> {editingNotice ? 'আপডেট ও সেভ করুন' : 'অফিশিয়াল প্রকাশ করুন'}
          </button>
        </div>
      </div>

      {/* Color & Logo Position Controller */}
      {showColorController && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 dark:from-slate-900 via-indigo-50/40 dark:via-indigo-950/30 to-slate-50 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800/60 rounded-3xl animate-in fade-in space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-800/60 pb-2">
            <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
              <Palette size={15} className="text-indigo-600 dark:text-indigo-400" /> প্যাডের কালার, ২-লাইন কালার, লোগো ও স্বাক্ষর পজিশন
            </span>
            <button
              type="button"
              onClick={() => setShowColorController(false)}
              className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              {
                label: 'স্কুলের নাম কালার',
                value: schoolNameColor,
                onChange: (val: string) => onSaveColors(val, topLineColor, bottomLineColor),
              },
              {
                label: '১ম লাইন কালার (৩px)',
                value: topLineColor,
                onChange: (val: string) => onSaveColors(schoolNameColor, val, bottomLineColor),
              },
              {
                label: '২য় লাইন কালার (১px)',
                value: bottomLineColor,
                onChange: (val: string) => onSaveColors(schoolNameColor, topLineColor, val),
              },
            ].map((picker) => (
              <div
                key={picker.label}
                className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5"
              >
                <div className="flex justify-between text-xs font-black">
                  <span>{picker.label}</span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{picker.value}</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={picker.value}
                    onChange={(e) => picker.onChange(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border p-0.5"
                  />
                  <input
                    type="text"
                    value={picker.value}
                    onChange={(e) => picker.onChange(e.target.value)}
                    className="w-full px-2 py-1 text-[11px] font-mono font-bold bg-slate-50 dark:bg-slate-950 border rounded"
                  />
                </div>
              </div>
            ))}

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between text-xs font-black">
                <span>লোগোর অবস্থান</span>
                <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-1 rounded">
                  {logoLeftOffset}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                step="5"
                value={logoLeftOffset}
                onChange={(e) => onUpdateLogoOffset(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Dual-Pane Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Form */}
        <div className="lg:col-span-6 space-y-5 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {/* Quick Ready-Made Templates */}
          <div className="bg-gradient-to-r from-amber-50/90 dark:from-amber-950/50 via-indigo-50/50 dark:via-indigo-950/30 to-amber-50/90 dark:to-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 uppercase flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-600 dark:text-amber-400" /> প্রাতিষ্ঠানিক স্ট্যান্ডার্ড টেমপ্লেট নির্বাচন করুন:
              </span>
              <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800/60">
                ১-ক্লিকে লোড ও অটো-সিঙ্ক
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {NOTICE_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => onApplyTemplate(tmpl)}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-slate-900 dark:text-white border border-amber-300/80 dark:border-amber-800/60 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Class-wise Fee Matrix */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-indigo-200/80 dark:border-indigo-800/60 p-4 rounded-2xl space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-indigo-100/70 dark:border-indigo-800/60 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <Coins size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    অর্থ আদায় সেকশন হতে শ্রেণি ভিত্তিক ফি
                    <span className="px-2 py-0.2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/60 rounded-md text-[9px] font-bold">
                      🟢 লাইভ সিঙ্ক
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    নিচের ফি সরাসরি অর্থ আদায় (Finance) মডিউল থেকে আসছে
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/finance"
                className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                title="অর্থ আদায় সেকশনে ফি কনফিগার করুন"
              >
                <SlidersHorizontal size={12} /> অর্থ আদায় সেটিংস
              </Link>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mr-1">খাত নির্বাচন:</span>
              {NOTICE_FEE_SECTORS.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => onLoadFeesForSector(sec.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    selectedFeeSector === sec.id
                      ? 'bg-indigo-600 text-white font-black shadow-xs'
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
              {classFees.map((feeItem, idx) => (
                <div
                  key={`${feeItem.className}-${idx}`}
                  className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1 relative group"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <span className="font-extrabold text-slate-900 dark:text-white">{feeItem.className}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={feeItem.examFee}
                      onChange={(e) => onUpdateClassFee(idx, e.target.value)}
                      placeholder="ফি"
                      className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-black font-mono text-indigo-950 dark:text-indigo-200 text-right outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                    />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">৳</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                বর্তমান খাত: <strong className="text-slate-900 dark:text-white">{activeSectorLabel}</strong>
              </span>

              <button
                type="button"
                onClick={onInsertClassFees}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              >
                <Sparkle size={13} /> নোটিশে এই ফি তালিকা যোগ করুন
              </button>
            </div>
          </div>

          {/* Main Form Inputs */}
          <form onSubmit={onSubmitNotice} className="space-y-4 text-xs font-medium text-slate-700 dark:text-slate-300">
            <div className="space-y-1.5 bg-indigo-50/30 dark:bg-indigo-950/50 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-800/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                  <span>নোটিশের শিরোনাম / বিষয়</span>
                  <span className="text-rose-500">*</span>
                </label>

                <label className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoSyncTitle}
                    onChange={(e) => setAutoSyncTitle(e.target.checked)}
                    className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer"
                  />
                  <span>🔄 বিষয়ে যা লিখবেন তা স্বয়ংক্রিয় বর্ণনায় সিঙ্ক হবে</span>
                </label>
              </div>

              <input
                type="text"
                required
                placeholder="যেমন: অর্ধবার্ষিক পরীক্ষা, শ্রেণি ভিত্তিক পরীক্ষার ফি ও বকেয়া বেতন পরিশোধ সংক্রান্ত বিজ্ঞপ্তি"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-black text-sm text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">ক্যাটাগরি</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Notice['category'])}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="exam">পরীক্ষা সংক্রান্ত (Exam)</option>
                  <option value="holiday">ছুটি সংক্রান্ত (Holiday)</option>
                  <option value="academic">একাডেমিক / রেজিস্ট্রেশন</option>
                  <option value="events">সভা / অনুষ্ঠান</option>
                  <option value="emergency">জরুরি বিজ্ঞপ্তি</option>
                  <option value="general">সাধারণ নোটিশ</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">অগ্রাধিকার</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Notice['priority'])}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="urgent">জরুরি (Urgent)</option>
                  <option value="important">গুরুত্বপূর্ণ (Important)</option>
                  <option value="normal">সাধারণ (Normal)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">উদ্দিষ্ট প্রাপক</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as Notice['targetAudience'])}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">সকলের জন্য (All)</option>
                  <option value="students">শিক্ষার্থীগণ</option>
                  <option value="parents">অভিভাবকবৃন্দ</option>
                  <option value="teachers">সম্মানিত শিক্ষকবৃন্দ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">স্মারক নম্বর (Ref No)</label>
                <input
                  type="text"
                  placeholder="বউবি/নোটিশ/২০২৬/১০৪"
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">প্রকাশের তারিখ</label>
                <input
                  type="date"
                  value={publishedDate}
                  onChange={(e) => setPublishedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Content & Smart Snippets */}
            <div className="space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  নোটিশের বিস্তারিত বিবরণ ও নির্দেশনাবলী <span className="text-rose-500">*</span>
                </label>

                <div className="flex items-center gap-1 flex-wrap text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() =>
                      handleInsertFeeSectorText(
                        'exam',
                        'শ্রেণি ভিত্তিক পরীক্ষার ফি তালিকা',
                        'পরীক্ষার ফি তালিকা সফলভাবে যোগ করা হয়েছে!'
                      )
                    }
                    className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800/60 rounded font-black cursor-pointer shadow-2xs"
                    title="শ্রেণি ভিত্তিক পরীক্ষার ফি তালিকা যোগ করুন"
                  >
                    + পরীক্ষার ফি
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleInsertFeeSectorText(
                        'registration',
                        'শ্রেণি ভিত্তিক রেজিস্ট্রেশন ফি বিবরণ',
                        'রেজিস্ট্রেশন ফি তালিকা সফলভাবে যোগ করা হয়েছে!'
                      )
                    }
                    className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/60 rounded font-black cursor-pointer shadow-2xs"
                    title="রেজিস্ট্রেশন ফি তালিকা যোগ করুন"
                  >
                    + রেজিস্ট্রেশন ফি
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleInsertFeeSectorText(
                        'farewell',
                        'শ্রেণি ভিত্তিক বিদায় অনুষ্ঠান ফি তালিকা',
                        'বিদায় অনুষ্ঠান ফি তালিকা সফলভাবে যোগ করা হয়েছে!'
                      )
                    }
                    className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800/60 rounded font-black cursor-pointer shadow-2xs"
                    title="বিদায় অনুষ্ঠান ফি তালিকা যোগ করুন"
                  >
                    + বিদায় ফি
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleInsertFeeSectorText(
                        'tuition',
                        'শ্রেণি ভিত্তিক মাসিক বেতন তালিকা',
                        'মাসিক বেতন তালিকা সফলভাবে যোগ করা হয়েছে!'
                      )
                    }
                    className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60 rounded font-black cursor-pointer shadow-2xs"
                    title="মাসিক বেতন তালিকা যোগ করুন"
                  >
                    + মাসিক বেতন
                  </button>
                  <button
                    type="button"
                    onClick={() => onInsertSnippet('fee_due_rules')}
                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded cursor-pointer"
                    title="বকেয়া বেতন ও ফি পরিশোধের নিয়ম যোগ করুন"
                  >
                    + ফি ও এডমিট শর্ত
                  </button>
                  <button
                    type="button"
                    onClick={() => onInsertSnippet('exam_rules')}
                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded cursor-pointer"
                    title="পরীক্ষার হলের নির্দেশনাবলী যোগ করুন"
                  >
                    + পরীক্ষার নিয়ম
                  </button>
                  <button
                    type="button"
                    onClick={() => onInsertSnippet('holiday_dates')}
                    className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60 rounded cursor-pointer"
                    title="ছুটি ও খোলার তারিখ"
                  >
                    + ছুটি
                  </button>
                </div>
              </div>

              <textarea
                required
                rows={10}
                placeholder="নোটিশের পূর্ণাঙ্গ প্রাতিষ্ঠানিক বিবরণ লিখুন..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-normal text-slate-900 dark:text-white text-sm leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">জারিকারকের নাম</label>
                <input
                  type="text"
                  value={publisherName}
                  onChange={(e) => setPublisherName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">পদবী</label>
                <input
                  type="text"
                  value={publisherRole}
                  onChange={(e) => setPublisherRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                📌 নোটিশ বোর্ডের শীর্ষে পিন করে রাখুন (Pin to Top)
              </span>
            </label>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onBackToList}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Send size={15} /> {editingNotice ? 'আপডেট ও সংরক্ষণ করুন' : 'অফিশিয়াল নোটিশ প্রকাশ করুন'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Live Pad Preview */}
        <div className="lg:col-span-6 space-y-3 sticky top-4">
          <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black text-slate-900 dark:text-white">রিয়েল-টাইম A4 প্যাড লাইভ ভিউ</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCopyNoticeText}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer"
              >
                <Copy size={13} /> কপি
              </button>

              <button
                type="button"
                onClick={onOpenPrintView}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Printer size={14} /> পূর্ণাঙ্গ প্রিন্ট ভিউ
              </button>
            </div>
          </div>

          <div className="bg-slate-200/80 dark:bg-slate-800/80 p-3 sm:p-5 rounded-3xl overflow-hidden border border-slate-300 dark:border-slate-700 flex justify-center shadow-inner">
            <div className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white relative shadow-xl rounded-sm p-6 sm:p-8 w-full max-w-[540px] min-h-[640px] space-y-3 text-xs">
              {showWatermark && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                  <img
                    src={schoolSettings.schoolLogo || '/logo.png'}
                    alt="Watermark"
                    className="w-48 h-48 object-contain grayscale opacity-5"
                  />
                </div>
              )}

              <div className="relative z-10 space-y-3">
                <div className="relative pb-1">
                  <div
                    className="absolute top-0 flex items-start"
                    style={{ left: `${Math.max(0, logoLeftOffset - 25)}px` }}
                  >
                    <img
                      src={schoolSettings.schoolLogo || '/logo.png'}
                      alt="Logo"
                      className="w-14 h-14 object-contain"
                    />
                  </div>

                  <div className="w-full text-center">
                    <h1
                      className="text-lg font-black font-serif tracking-tight leading-tight"
                      style={{ color: schoolNameColor }}
                    >
                      {schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                    </h1>
                    <p className="text-[10px] font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {schoolSettings.address || 'বরইতলী, চকরিয়া, কক্সবাজার।'}
                    </p>
                    <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400 font-mono">
                      EIIN: {schoolSettings.eiin || '106184'} , স্থাপিত: {schoolSettings.estdYear || '1969'} খ্রি .
                    </p>
                    <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400 font-mono">
                      মোবাইল: {schoolSettings.phone || '01819-000000'}
                    </p>
                  </div>

                  <div className="mt-2 -mx-6 sm:-mx-8 flex flex-col gap-[2px]">
                    <div className="w-full h-[2.5px]" style={{ backgroundColor: topLineColor }} />
                    <div className="w-full h-[1px]" style={{ backgroundColor: bottomLineColor }} />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold text-slate-900 dark:text-white pt-0 pb-0.5">
                  <div>
                    <span>স্মারক নং: </span>
                    <span className="font-mono">{refNo || 'বউবি/নোটিশ'}</span>
                  </div>
                  <div>
                    <span>তারিখ: </span>
                    <span className="font-mono">{formatNoticeDate(publishedDate)}</span>
                  </div>
                </div>

                <div className="text-center pt-2 pb-1">
                  <h3 className="text-xs font-bold text-slate-950 dark:text-white underline underline-offset-4 tracking-wider">
                    বিজ্ঞপ্তি / নোটিশ
                  </h3>
                </div>

                <div
                  className="text-slate-950 dark:text-white leading-relaxed text-justify whitespace-pre-line font-normal bg-slate-50/50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800"
                  style={{ fontSize: `${Math.max(11, contentFontSize - 2)}px` }}
                >
                  {content || '(বাম পাশে নোটিশের বিবরণ টাইপ করুন...)'}
                </div>

                <div
                  className="flex justify-between items-end text-slate-900 dark:text-white"
                  style={{ paddingTop: `${Math.min(30, signatureTopGap / 2)}px` }}
                >
                  <div className="text-[8px] text-slate-600 dark:text-slate-400 space-y-0.5">
                    <p className="font-bold underline">অনুলিপি:</p>
                    <p>১. নোটিশ বোর্ড</p>
                    <p>২. শিক্ষক মিলনায়তন</p>
                    <p>৩. অফিস নথি</p>
                  </div>

                  <div className="text-center space-y-0.5 min-w-[140px]">
                    <div className="w-28 border-b border-slate-900 dark:border-slate-400 mx-auto mb-0.5" />
                    <p className="font-black text-[10px] text-slate-950 dark:text-white">{publisherName}</p>
                    <p className="text-[9px] font-bold text-slate-700 dark:text-slate-300">{publisherRole}</p>
                    <p className="text-[8px] font-semibold text-slate-600 dark:text-slate-400">
                      {schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
