'use client';

import React from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  CheckCircle2, 
  FlaskConical, 
  Landmark, 
  TrendingUp, 
  GraduationCap, 
  Sparkles, 
  ArrowRight,
  Atom,
  Award,
  Layers,
  Compass,
  Laptop
} from 'lucide-react';
import { AcademicConfig, DEFAULT_ACADEMIC_CONFIG } from '@/services/landingPageService';

interface PublicAcademicSectionProps {
  academicConfig?: AcademicConfig | null;
}

export default function PublicAcademicSection({ academicConfig }: PublicAcademicSectionProps) {
  const cfg = academicConfig || DEFAULT_ACADEMIC_CONFIG;

  // Visual style tokens for the 3 Academic Stage Cards
  const stageStyles = [
    {
      topBar: 'from-emerald-500 via-teal-500 to-cyan-500',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      checkColor: 'text-emerald-500',
      hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-600',
      glow: 'group-hover:shadow-emerald-500/10',
      icon: <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      topBar: 'from-amber-500 via-orange-500 to-yellow-500',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      checkColor: 'text-amber-500',
      hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-600',
      glow: 'group-hover:shadow-amber-500/10',
      icon: <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
    },
    {
      topBar: 'from-indigo-500 via-purple-500 to-pink-500',
      badgeBg: 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300',
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
      checkColor: 'text-indigo-500',
      hoverBorder: 'hover:border-indigo-400 dark:hover:border-indigo-600',
      glow: 'group-hover:shadow-indigo-500/10',
      icon: <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    }
  ];

  // Visual style tokens for the 3 Streams (Science, Humanities, Business Studies)
  const streamStyles = [
    {
      ring: 'from-emerald-400 to-teal-500',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
      cardBorder: 'hover:border-emerald-400 dark:hover:border-emerald-500',
      cardGlow: 'hover:shadow-emerald-500/10',
      icon: <FlaskConical className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.2} />,
      highlights: ['আধুনিক মাল্টিমিডিয়া বিজ্ঞান ল্যাব', 'বোর্ড স্ট্যান্ডার্ড ব্যবহারিক পরীক্ষণ']
    },
    {
      ring: 'from-amber-400 to-orange-500',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
      cardBorder: 'hover:border-amber-400 dark:hover:border-amber-500',
      cardGlow: 'hover:shadow-amber-500/10',
      icon: <Landmark className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={2.2} />,
      highlights: ['বিতর্ক ও সামাজিক নেতৃত্ব বিকাশ', 'ঐতিহাসিক ও সাংস্কৃতিক গবেষণা']
    },
    {
      ring: 'from-indigo-400 to-violet-500',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800',
      cardBorder: 'hover:border-indigo-400 dark:hover:border-indigo-500',
      cardGlow: 'hover:shadow-indigo-500/10',
      icon: <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" strokeWidth={2.2} />,
      highlights: ['বাস্তবমুখী হিসাবরক্ষণ প্রশিক্ষণ', 'উদ্যোক্তা গঠনমূলক কেস-স্টাডি']
    }
  ];

  return (
    <section 
      id="academic" 
      className="py-10 sm:py-14 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900/60 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800 relative overflow-hidden"
    >
      {/* Decorative Subtle Background Grids */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ==============================================================
            SECTION HEADER (Bangla Modern Layout)
            ============================================================== */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          
          {/* Eyebrow Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{cfg.eyebrow || 'একাডেমিক কার্যক্রম ও পাঠ্যক্রম'}</span>
          </div>

          {/* Main Headline */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            শ্রেণিভিত্তিক শিক্ষা কার্যক্রম ও <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 dark:from-emerald-400 dark:via-teal-300 dark:to-indigo-400 bg-clip-text text-transparent">শাখা বিভাগ</span>
          </h2>

          {/* Subtitle Description */}
          <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            {cfg.subtitle || 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB) এবং মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড (BISE) চট্টগ্রাম অনুমোদিত শিক্ষাক্রম অনুসরণে পরিচালিত।'}
          </p>
        </div>

        {/* ==============================================================
            TOP GRID: 3 ACADEMIC STAGE CARDS (৬ষ্ঠ-৭ম, ৮ম, ৯ম-১০ম)
            ============================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 sm:mb-14">
          {cfg.programs.map((prog, idx) => {
            const style = stageStyles[idx % stageStyles.length];
            return (
              <div
                key={prog.id || idx}
                className={`group relative bg-white dark:bg-slate-900/90 rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden ${style.hoverBorder} ${style.glow}`}
              >
                {/* Top Accent Gradient Line */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${style.topBar}`} />

                <div>
                  {/* Stage Pill Badge */}
                  <div className="flex items-center justify-between mb-4 pt-1">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border shadow-xs ${style.badgeBg}`}>
                      {prog.grade}
                    </span>
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-110 ${style.iconBg}`}>
                      {style.icon}
                    </div>
                  </div>

                  {/* Core Focus Headline */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {prog.focus}
                  </h3>

                  {/* Feature Checklist */}
                  <ul className="space-y-2.5 mt-2">
                    {prog.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        <CheckCircle2 className={`w-4 h-4 ${style.checkColor} shrink-0 mt-0.5`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Status / Sub-tag */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="font-en text-slate-500 dark:text-slate-400">{prog.gradeEn || 'National Curriculum Track'}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    এনসিটিবি অনুমোদিত
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ==============================================================
            BOTTOM CONTAINER: 9TH & 10TH GRADE SPECIALIZED STREAMS
            ============================================================== */}
        <div className="bg-gradient-to-br from-white via-slate-50/80 to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 rounded-3xl p-6 sm:p-10 border border-slate-200/90 dark:border-slate-800 shadow-xl relative overflow-hidden">
          
          {/* Background Glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          
          {/* Header inside container */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Layers className="w-3 h-3" />
              <span>শাখা বিভাগ পরিচিতি</span>
            </div>

            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
              {cfg.departmentsTitle || '৯ম ও ১০ম শ্রেণির বিশেষায়িত বিভাগসমূহ (এসএসসি পর্যায়)'}
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              শিক্ষার্থীদের মেধা, আগ্রহ ও ভবিষ্যৎ ক্যারিয়ার গঠনের লক্ষ্যে অভিজ্ঞ শিক্ষকমণ্ডলী দ্বারা পরিচালিত তিনটি সমৃদ্ধ একাডেমিক শাখা
            </p>
          </div>

          {/* 3 Department Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cfg.streams.map((stream, idx) => {
              const sStyle = streamStyles[idx % streamStyles.length];
              return (
                <div 
                  key={stream.id || idx} 
                  className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between ${sStyle.cardBorder} ${sStyle.cardGlow}`}
                >
                  <div>
                    {/* Header: Icon & Category Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-110 ${sStyle.iconBg}`}>
                        {sStyle.icon}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${sStyle.badge}`}>
                        {stream.badge || 'এসএসসি শাখা'}
                      </span>
                    </div>

                    {/* Department Title */}
                    <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {stream.name}
                    </h4>

                    {/* Subjects Pill */}
                    <div className="mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">পাঠ্য বিষয়সমূহ</span>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug">
                        {stream.subjects}
                      </p>
                    </div>

                    {/* Detailed Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      {stream.desc}
                    </p>
                  </div>

                  {/* Key Highlights Checklist */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                    {sStyle.highlights.map((h, hIdx) => (
                      <div key={hIdx} className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Guidance Action Strip */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  ভর্তি ও শাখা নির্বাচন সংক্রান্ত দিকনির্দেশনা
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  ৯ম শ্রেণিতে বিজ্ঞান, মানবিক বা ব্যবসায় শিক্ষা শাখা বাছাইয়ের বিস্তারিত তথ্যের জন্য যোগাযোগ করুন
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/admission"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-102"
              >
                <span>ভর্তি আবেদন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/result"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all"
              >
                <span>ফলাফল যাচাই</span>
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
