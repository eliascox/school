'use client';

import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Award,
  BookOpen,
  Users,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  totalStudents: number;
  totalGirls: number;
  totalStipend: number;
  activeLoansCount: number;
  alumniCount: number;
  onDownloadBANBEIS: () => void;
  onDownloadEMIS: () => void;
  onDownloadStipend: () => void;
  onPrintReport: () => void;
  variant?: 'compact' | 'expanded';
  lang?: 'bn' | 'en';
}

export default function ExecutiveExportBar({
  totalStudents,
  totalGirls,
  totalStipend,
  activeLoansCount,
  alumniCount,
  onDownloadBANBEIS,
  onDownloadEMIS,
  onDownloadStipend,
  onPrintReport,
  variant = 'compact',
  lang = 'bn',
}: Props) {
  const campusMetrics = [
    {
      label: lang === 'en' ? 'Stipend Beneficiaries' : 'উপবৃত্তি সুবিধাভোগী',
      val: `${totalStipend} ${lang === 'en' ? '' : 'জন'}`,
      icon: Award,
      tone: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    },
    {
      label: lang === 'en' ? 'Active Library Loans' : 'চলমান লাইব্রেরি ইস্যু',
      val: `${activeLoansCount}${lang === 'en' ? '' : 'টি'}`,
      icon: BookOpen,
      tone: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',
    },
    {
      label: lang === 'en' ? 'Female Students' : 'মোট ছাত্রী সংখ্যা',
      val: `${totalGirls} ${lang === 'en' ? '' : 'জন'}`,
      icon: Users,
      tone: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
    },
    {
      label: lang === 'en' ? 'Alumni Archive' : 'অ্যালুমনাই আর্কাইভ',
      val: `${alumniCount} ${lang === 'en' ? '' : 'জন'}`,
      icon: GraduationCap,
      tone: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    },
  ];

  if (variant === 'compact') {
    return (
      <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 text-white p-5 shadow-sm border border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0">
            <FileSpreadsheet size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black tracking-tight flex items-center gap-2 flex-wrap">
              <span>
                {lang === 'en'
                  ? 'Government & Education Board 1-Click Excel Export Hub'
                  : 'সরকারি ও শিক্ষা বোর্ড ১-ক্লিক এক্সেল (.xlsx) এক্সপোর্ট হাব'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-emerald-300 text-[10px] font-bold">
                {totalStudents} {lang === 'en' ? 'Records Ready' : 'জন প্রস্তুত'}
              </span>
            </h2>
            <p className="text-xs text-slate-300/85 mt-0.5">
              {lang === 'en'
                ? 'Ready-to-upload official workbooks for BANBEIS, EMIS & HSP Stipend portals.'
                : 'ব্যানবেইস (BANBEIS), ইএমআইএস (EMIS) এবং উপবৃত্তি (HSP) পোর্টালের জন্য তাৎক্ষণিক এক্সেল ওয়ার্কবুক।'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={onDownloadBANBEIS}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-xs"
          >
            <Download size={14} /> BANBEIS (.xlsx)
          </button>
          <button
            type="button"
            onClick={onDownloadEMIS}
            className="px-3.5 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-xs"
          >
            <Download size={14} /> EMIS (.xlsx)
          </button>
          <button
            type="button"
            onClick={onDownloadStipend}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-xs"
          >
            <Download size={14} /> {lang === 'en' ? 'Stipend (.xlsx)' : 'উপবৃত্তি (.xlsx)'}
          </button>
          <button
            type="button"
            onClick={onPrintReport}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition"
            title={lang === 'en' ? 'Print Executive Report' : 'প্রাতিষ্ঠানিক রিপোর্ট প্রিন্ট করুন'}
          >
            <Printer size={14} />
            <span className="hidden sm:inline">{lang === 'en' ? 'Print' : 'প্রিন্ট'}</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {/* 4 Campus Operations KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {campusMetrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.tone}`}>
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">
                  {m.label}
                </span>
                <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                  {m.val}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3 Detailed Government Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        {/* BANBEIS */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 p-5 shadow-2xs flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-black">
                BANBEIS ফরম্যাট
              </span>
              <ShieldCheck size={18} className="text-emerald-500" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {lang === 'en' ? 'BANBEIS Institutional Survey (.xlsx)' : 'ব্যানবেইস বার্ষিক জরিপ ওয়ার্কবুক'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {lang === 'en'
                ? `Class-wise enrollment, gender split (${totalGirls} girls), religion & EIIN summary ready for BANBEIS upload.`
                : `মোট ${totalStudents} জন শিক্ষার্থী (ছাত্রী ${totalGirls} জন), শ্রেণি-বিভাগ, ধর্ম ও EIIN সারাংশসহ ব্যানবেইস ফরম্যাট।`}
            </p>
          </div>
          <button
            type="button"
            onClick={onDownloadBANBEIS}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
          >
            <Download size={14} /> BANBEIS এক্সেল ডাউনলোড (.xlsx)
          </button>
        </div>

        {/* EMIS */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-200/80 dark:border-sky-900/60 p-5 shadow-2xs flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[11px] font-black">
                EMIS পোর্টাল
              </span>
              <FileSpreadsheet size={18} className="text-sky-500" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {lang === 'en' ? 'EMIS Student Profile Sheet (.xlsx)' : 'ইএমআইএস শিক্ষার্থী প্রোফাইল শিট'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {lang === 'en'
                ? 'Complete student master roster including guardian info, roll, class, section, group & birth registration fields.'
                : 'রোল, শ্রেণি, শাখা, বিভাগ, অভিভাবক ও জন্ম নিবন্ধন তথ্যসহ মাউশি EMIS পোর্টালের জন্য পূর্ণাঙ্গ এক্সেল।'}
            </p>
          </div>
          <button
            type="button"
            onClick={onDownloadEMIS}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
          >
            <Download size={14} /> EMIS এক্সেল ডাউনলোড (.xlsx)
          </button>
        </div>

        {/* Stipend */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 p-5 shadow-2xs flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-black">
                HSP / উপবৃত্তি বোর্ড
              </span>
              <Award size={18} className="text-amber-500" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {lang === 'en' ? 'Stipend Eligibility Workbook (.xlsx)' : 'উপবৃত্তি (HSP) যোগ্যতা তালিকা'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {lang === 'en'
                ? `${totalStipend} stipend-tagged students evaluated against 75% attendance & 45% exam benchmarks.`
                : `উপবৃত্তিভুক্ত ${totalStipend} জন শিক্ষার্থীর ৭৫% উপস্থিতি ও ৪৫% পরীক্ষার নম্বর মানদণ্ডসহ প্রস্তুতকৃত শিট।`}
            </p>
          </div>
          <button
            type="button"
            onClick={onDownloadStipend}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
          >
            <Download size={14} /> উপবৃত্তি এক্সেল ডাউনলোড (.xlsx)
          </button>
        </div>
      </div>
    </div>
  );
}
