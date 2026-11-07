'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileSpreadsheet, 
  ArrowLeft, 
  Users, 
  Printer, 
  Sparkles,
  ChevronRight,
  Home
} from 'lucide-react';
import StudentBulkImportPanel from '@/components/StudentBulkImportPanel';

export default function BulkStudentImportPage() {
  const router = useRouter();

  const handleImportSuccess = (count: number) => {
    // Optionally redirect after a brief delay or let user view results
    setTimeout(() => {
      router.push('/dashboard/students');
    }, 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* ─── BREADCRUMBS & TOP NAVIGATION ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-wrap">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <Home size={14} /> ড্যাশবোর্ড
          </Link>
          <ChevronRight size={14} className="text-slate-400" />
          <Link 
            href="/dashboard/students" 
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            শিক্ষার্থী ব্যবস্থাপনা
          </Link>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">
            বাল্ক শিক্ষার্থী আপলোড
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/students"
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition"
          >
            <ArrowLeft size={14} /> শিক্ষার্থী তালিকায় ফিরুন
          </Link>
          <Link
            href="/dashboard/students/print"
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl text-xs font-bold transition border border-emerald-200 dark:border-emerald-800"
          >
            <Printer size={14} /> তালিকা প্রিন্ট
          </Link>
        </div>
      </div>

      {/* ─── PAGE HERO BANNER ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-950 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-violet-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/20 text-violet-300 text-xs font-bold rounded-full border border-violet-500/30">
              <Sparkles size={13} className="text-amber-300" />
              <span>স্মার্ট এক্সেল প্রসেসিং ও গ্রুপ-ভিত্তিক রোল বিন্যাস ইঞ্জিন</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <FileSpreadsheet className="text-violet-400 w-8 h-8 shrink-0" />
              বাল্ক শিক্ষার্থী তথ্য আপলোড
            </h1>
            <p className="text-sm text-violet-200/90 leading-relaxed font-medium">
              এক্সেল বা সিএসভি ফাইল আপলোড করে এক ক্লিকে শত শত শিক্ষার্থীর তথ্য সিস্টেমে অন্তর্ভুক্ত করুন। 
              বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা বিভাগের জন্য স্বয়ংক্রিয় গ্রুপভিত্তিক রোল ও ডুপ্লিকেট চেকিং সম্পন্ন হবে।
            </p>
          </div>

          <div className="flex md:flex-col items-center gap-3 shrink-0">
            <Link
              href="/dashboard/students"
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-100 rounded-2xl text-xs font-black shadow-lg transition active:scale-95"
            >
              <Users size={15} className="text-indigo-600" />
              সকল শিক্ষার্থী দেখুন
            </Link>
          </div>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ─── MAIN BULK IMPORT ENGINE PANEL ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
        <StudentBulkImportPanel onSuccess={handleImportSuccess} compactMode={false} />
      </div>

    </div>
  );
}
