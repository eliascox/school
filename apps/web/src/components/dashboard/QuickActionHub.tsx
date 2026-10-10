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
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

interface Props {
  lang?: 'bn' | 'en';
}

export default function QuickActionHub({ lang = 'bn' }: Props) {
  const actions = [
    {
      label: lang === 'en' ? 'New Admission' : 'নতুন শিক্ষার্থী ভর্তি',
      subLabel: lang === 'en' ? 'Register Student' : 'অনলাইন ও অফলাইন ভর্তি',
      href: '/dashboard/admission',
      icon: <UserPlus className="w-5 h-5 text-white" />,
      iconBg: 'bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-md shadow-indigo-500/25',
      cardBg: 'bg-indigo-50/70 hover:bg-indigo-50/90 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 border-indigo-100 dark:border-indigo-900/40'
    },
    {
      label: lang === 'en' ? 'Take Attendance' : 'দৈনিক হাজিরা গ্রহণ',
      subLabel: lang === 'en' ? 'Mark Present/Absent' : 'শ্রেণিভিত্তিক লাইভ রোল কল',
      href: '/dashboard/academic/attendance',
      icon: <UserCheck className="w-5 h-5 text-white" />,
      iconBg: 'bg-gradient-to-tr from-teal-600 to-emerald-500 shadow-md shadow-teal-500/25',
      cardBg: 'bg-teal-50/70 hover:bg-teal-50/90 dark:bg-teal-950/40 dark:hover:bg-teal-950/60 border-teal-100 dark:border-teal-900/40'
    },
    {
      label: lang === 'en' ? 'Exam Mark Entry' : 'ফলাফল ও নম্বর এন্ট্রি',
      subLabel: lang === 'en' ? 'Input CQ/MCQ Marks' : '১ম সাময়িক ও বার্ষিক পরীক্ষা',
      href: '/dashboard/exam/mark-entry',
      icon: <FileSpreadsheet className="w-5 h-5 text-white" />,
      iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-md shadow-amber-500/25',
      cardBg: 'bg-amber-50/70 hover:bg-amber-50/90 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 border-amber-100 dark:border-amber-900/40'
    },
    {
      label: lang === 'en' ? 'Student Promotion' : 'শ্রেণি প্রমোশন প্যানেল',
      subLabel: lang === 'en' ? 'Promote Class' : 'পরবর্তী সেশনে উন্নীতকরণ',
      href: '/dashboard/academic/promotion',
      icon: <TrendingUp className="w-5 h-5 text-white" />,
      iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-md shadow-emerald-500/25',
      cardBg: 'bg-emerald-50/70 hover:bg-emerald-50/90 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900/40'
    },
    {
      label: lang === 'en' ? 'Certificates & Documents' : 'সনদ ও ডকুমেন্টস',
      subLabel: lang === 'en' ? 'Certificates Hub' : 'প্রশংসাপত্র ও প্রত্যয়ন সনদ',
      href: '/dashboard/certificates',
      icon: <Award className="w-5 h-5 text-white" />,
      iconBg: 'bg-gradient-to-tr from-purple-600 to-pink-500 shadow-md shadow-purple-500/25',
      cardBg: 'bg-purple-50/70 hover:bg-purple-50/90 dark:bg-purple-950/40 dark:hover:bg-purple-950/60 border-purple-100 dark:border-purple-900/40'
    },
    {
      label: lang === 'en' ? 'Fee Collection' : 'শিক্ষার্থী ফি আদায়',
      subLabel: lang === 'en' ? 'Student Billing' : 'রসিদ ও অ্যাকাউন্টস লেজার',
      href: '/dashboard/finance',
      icon: <CreditCard className="w-5 h-5 text-white" />,
      iconBg: 'bg-gradient-to-tr from-sky-600 to-blue-500 shadow-md shadow-sky-500/25',
      cardBg: 'bg-sky-50/70 hover:bg-sky-50/90 dark:bg-sky-950/40 dark:hover:bg-sky-950/60 border-sky-100 dark:border-sky-900/40'
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-500 flex items-center justify-center shadow-xs">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <span>{lang === 'en' ? 'Quick Actions Hub' : 'কুইক অ্যাকশন হাব (১-ক্লিক শর্টকাট)'}</span>
        </h3>
        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/40">
          {lang === 'en' ? 'Instant Access' : 'দ্রুত সেবা'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {actions.map((act, i) => (
          <Link
            key={i}
            href={act.href}
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between group cursor-pointer hover:shadow-lg hover:-translate-y-1 relative overflow-hidden ${act.cardBg}`}
          >
            <div className="flex items-center justify-between mb-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 ${act.iconBg}`}>
                {act.icon}
              </div>
              <div className="w-6 h-6 rounded-full bg-white/70 dark:bg-slate-900/70 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white flex items-center justify-center opacity-70 group-hover:opacity-100 transition-all shadow-2xs group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight size={13} />
              </div>
            </div>

            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-xs leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {act.label}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1 truncate">
                {act.subLabel}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
