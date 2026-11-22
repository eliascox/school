'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserPlus,
  UserCheck,
  FileSpreadsheet,
  Award,
  CreditCard,
  TrendingUp,
  Layers,
  Send,
  ArrowUpRight,
  Zap,
} from 'lucide-react';

interface Props {
  lang?: 'bn' | 'en';
  pendingLeavesCount?: number;
}

export default function QuickActionHub({ lang = 'bn', pendingLeavesCount = 0 }: Props) {
  const actions = [
    {
      label: lang === 'en' ? 'New Admission' : 'নতুন ভর্তি',
      subLabel: lang === 'en' ? 'Enroll student' : 'শিক্ষার্থী নিবন্ধন',
      href: '/dashboard/admission',
      icon: UserPlus,
      iconTone: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
    },
    {
      label: lang === 'en' ? 'Attendance' : 'দৈনিক হাজিরা',
      subLabel: lang === 'en' ? 'Class roll call' : 'লাইভ রোল কল',
      href: '/dashboard/academic/attendance',
      icon: UserCheck,
      iconTone: 'bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400',
    },
    {
      label: lang === 'en' ? 'Mark Entry' : 'নম্বর এন্ট্রি',
      subLabel: lang === 'en' ? 'Exam scores' : 'পরীক্ষার নম্বর',
      href: '/dashboard/exam/mark-entry',
      icon: FileSpreadsheet,
      iconTone: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    },
    {
      label: lang === 'en' ? 'Fee Collection' : 'ফি আদায়',
      subLabel: lang === 'en' ? 'Receipts & dues' : 'রসিদ ও হিসাব',
      href: '/dashboard/finance',
      icon: CreditCard,
      iconTone: 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400',
    },
    {
      label: lang === 'en' ? 'Marksheets' : 'মার্কশিট প্রিন্ট',
      subLabel: lang === 'en' ? 'NCTB results' : 'ফলাফল ও জিপিএ',
      href: '/dashboard/academic/marksheet',
      icon: Layers,
      iconTone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    },
    {
      label: lang === 'en' ? 'Certificates' : 'সনদ ও প্রশংসা',
      subLabel: lang === 'en' ? 'Official docs' : 'টেস্টিমোনিয়াল',
      href: '/dashboard/certificates',
      icon: Award,
      iconTone: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
    },
    {
      label: lang === 'en' ? 'Promotion' : 'শ্রেণি প্রমোশন',
      subLabel: lang === 'en' ? 'Next session' : 'উন্নীতকরণ',
      href: '/dashboard/academic/promotion',
      icon: TrendingUp,
      iconTone: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400',
    },
    {
      label: lang === 'en' ? 'Leave Review' : 'ছুটির আবেদন',
      subLabel: lang === 'en' ? 'Teacher requests' : 'অনুমোদন প্যানেল',
      href: '/dashboard/leaves',
      icon: Send,
      iconTone: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
      badge: pendingLeavesCount > 0 ? pendingLeavesCount : undefined,
    },
  ];

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Zap size={15} />
          </div>
          <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
            {lang === 'en' ? 'Quick Actions' : 'দ্রুত কার্যক্রম (Quick Actions)'}
          </h2>
        </div>
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
          {lang === 'en' ? '1-Click Shortcuts' : '১-ক্লিক মডিউল শর্টকাট'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.href}
              href={act.href}
              className="group relative flex flex-col justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 hover:bg-white dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${act.iconTone}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {act.badge !== undefined ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black font-mono leading-none">
                    {act.badge}
                  </span>
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate transition-colors">
                  {act.label}
                </p>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  {act.subLabel}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
