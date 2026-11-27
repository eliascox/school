'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserPlus,
  GraduationCap,
  ShieldCheck,
  Users,
  ArrowRight,
  Sparkles,
  Smartphone,
  LayoutDashboard,
  Search,
  FileCheck,
} from 'lucide-react';
import type { ServicesConfig } from '@/services/landingPageService';
import { PublicServiceViewCard, resolvePublicServices } from '@/lib/publicLandingUtils';

interface PublicServicesSectionProps {
  servicesConfig?: ServicesConfig | null;
}

const ACCENT_STYLES: Record<
  PublicServiceViewCard['accent'],
  {
    badge: string;
    iconBox: string;
    cta: string;
    cardHover: string;
    topLine: string;
  }
> = {
  emerald: {
    badge: 'bg-emerald-50 text-[#0B5D3B] border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    iconBox: 'from-[#0B5D3B] to-teal-600 shadow-emerald-700/25',
    cta: 'bg-[#0B5D3B] hover:bg-[#08492e] text-white shadow-emerald-900/15',
    cardHover: 'hover:border-emerald-400/80 dark:hover:border-emerald-600',
    topLine: 'from-[#0B5D3B] via-emerald-500 to-teal-400',
  },
  indigo: {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    iconBox: 'from-indigo-600 to-violet-600 shadow-indigo-600/25',
    cta: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-900/15',
    cardHover: 'hover:border-indigo-400/80 dark:hover:border-indigo-600',
    topLine: 'from-indigo-600 via-violet-500 to-indigo-400',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    iconBox: 'from-amber-500 to-orange-500 shadow-amber-500/25',
    cta: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/15',
    cardHover: 'hover:border-amber-400/80 dark:hover:border-amber-600',
    topLine: 'from-amber-500 via-orange-400 to-amber-400',
  },
  violet: {
    badge: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
    iconBox: 'from-violet-600 to-purple-700 shadow-violet-600/25',
    cta: 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-900/15',
    cardHover: 'hover:border-violet-400/80 dark:hover:border-violet-600',
    topLine: 'from-violet-600 via-purple-500 to-fuchsia-400',
  },
  sky: {
    badge: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    iconBox: 'from-sky-600 to-cyan-600 shadow-sky-600/25',
    cta: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-900/15',
    cardHover: 'hover:border-sky-400/80 dark:hover:border-sky-600',
    topLine: 'from-sky-500 via-cyan-500 to-teal-400',
  },
  teal: {
    badge: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    iconBox: 'from-slate-800 to-slate-900 shadow-slate-900/25',
    cta: 'bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white shadow-slate-900/15',
    cardHover: 'hover:border-teal-400/80 dark:hover:border-teal-600',
    topLine: 'from-slate-800 via-teal-600 to-emerald-500',
  },
};

function renderServiceIcon(iconKey: string) {
  const cls = 'w-6 h-6 text-white';
  switch (iconKey) {
    case 'UserPlus':
      return <UserPlus className={cls} />;
    case 'GraduationCap':
      return <GraduationCap className={cls} />;
    case 'Search':
      return <Search className={cls} />;
    case 'ShieldCheck':
      return <ShieldCheck className={cls} />;
    case 'FileCheck':
      return <FileCheck className={cls} />;
    case 'Users':
      return <Users className={cls} />;
    case 'Smartphone':
      return <Smartphone className={cls} />;
    case 'LayoutDashboard':
      return <LayoutDashboard className={cls} />;
    default:
      return <Sparkles className={cls} />;
  }
}

export default function PublicServicesSection({ servicesConfig }: PublicServicesSectionProps = {}) {
  if (servicesConfig && servicesConfig.enabled === false) {
    return null;
  }

  const cards = resolvePublicServices(servicesConfig);
  const title = servicesConfig?.title?.trim() || 'অনলাইন সেবা ও স্মার্ট পোর্টালসমূহ';
  const subtitle =
    servicesConfig?.subtitle?.trim() ||
    'শিক্ষার্থী, অভিভাবক, শিক্ষক ও প্রশাসনের জন্য একক ক্লিকে দ্রুত, নিরাপদ ও পেপারলেস ডিজিটাল স্কুল সেবা।';

  return (
    <section
      id="services"
      className="relative py-12 sm:py-16 overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-white to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-9 sm:mb-12 space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#0B5D3B] dark:text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>ডিজিটাল ই-সার্ভিস হাব</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
            {title}
          </h2>
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="w-14 h-1.5 bg-[#0B5D3B] rounded-full" />
            <span className="w-3.5 h-1.5 bg-[#F4B400] rounded-full" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto pt-1">
            {subtitle}
          </p>
        </div>

        {/* Executive Pearl Bento Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {cards.map((srv) => {
            const st = ACCENT_STYLES[srv.accent] || ACCENT_STYLES.emerald;
            return (
              <div
                key={srv.id}
                className={`group relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-[0_6px_24px_-12px_rgba(15,23,42,0.08)] hover:shadow-[0_22px_45px_-16px_rgba(15,23,42,0.14)] overflow-hidden ${st.cardHover}`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${st.topLine} opacity-80`} />

                <div>
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div
                      className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${st.iconBox} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105`}
                    >
                      {renderServiceIcon(srv.iconKey)}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${st.badge}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                      <span>{srv.badge}</span>
                    </span>
                  </div>

                  <div className="mb-2.5">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition-colors">
                      {srv.title}
                    </h3>
                    {srv.subtitleEn && (
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5 font-en">
                        {srv.subtitleEn}
                      </p>
                    )}
                  </div>

                  <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    {srv.description}
                  </p>
                </div>

                <Link
                  href={srv.href}
                  className={`inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-[0.98] shadow-sm group/btn ${st.cta}`}
                >
                  <span>{srv.ctaText}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Institutional Trust Footer Bar */}
        <div className="mt-9 pt-5 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-slate-500 dark:text-slate-400 text-xs font-semibold">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            ক্লাউড-সুরক্ষিত ডেটা
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            তাৎক্ষণিক SMS ও QR যাচাই
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            মোবাইল ও ডেস্কটপ বান্ধব
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            ২৪/৭ অনলাইন সেবা
          </span>
        </div>
      </div>
    </section>
  );
}
