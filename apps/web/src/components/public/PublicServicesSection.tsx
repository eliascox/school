'use client';

import React from 'react';
import Link from 'next/link';

export default function PublicServicesSection() {
  const services = [
    {
      title: 'অনলাইন ভর্তি পোর্টাল',
      titleEn: 'Online Admission Portal',
      desc: '৬ষ্ঠ থেকে ৯ম শ্রেণিতে ভর্তির জন্য অনলাইনে আবেদন করুন। প্রয়োজনীয় তথ্য পূরণ করে নিশ্চিতকরণ রসিদ ডাউনলোড করুন।',
      iconClass: 'fa-user-plus',
      iconBg: 'from-emerald-500 to-teal-600',
      iconShadow: 'shadow-emerald-500/25',
      href: '/admission',
      ctaText: 'ভর্তির আবেদন করুন',
      badge: 'Admission Open',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
      ctaClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20',
      featured: true,
      bgClass: 'bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/10 border-emerald-200 dark:border-emerald-800/60',
    },
    {
      title: 'অনলাইন পরীক্ষার ফলাফল',
      titleEn: 'Online Examination Results',
      desc: 'শ্রেণি, রোল নম্বর দিয়ে পরীক্ষার ফলাফল, নম্বরপত্র ও ডিজিটাল ট্রান্সক্রিপ্ট দেখুন এবং ডাউনলোড করুন।',
      iconClass: 'fa-graduation-cap',
      iconBg: 'from-indigo-500 to-violet-600',
      iconShadow: 'shadow-indigo-500/25',
      href: '/result',
      ctaText: 'ফলাফল দেখুন',
      badge: 'Official Transcripts',
      badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
      ctaClass: 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/20',
      featured: true,
      bgClass: 'bg-gradient-to-br from-indigo-50 via-white to-violet-50/40 dark:from-indigo-950/20 dark:via-slate-900 dark:to-violet-950/10 border-indigo-200 dark:border-indigo-800/60',
    },
    {
      title: 'ডিজিটাল সনদ যাচাইকরণ',
      titleEn: 'Digital Certificate Verification',
      desc: 'প্রশংসাপত্র, স্কুল সনদ ও টিসি-এর সত্যতা QR কোড স্ক্যান করে তাৎক্ষণিকভাবে যাচাই করুন।',
      iconClass: 'fa-shield-check',
      iconBg: 'from-amber-500 to-orange-500',
      iconShadow: 'shadow-amber-500/25',
      href: '/verify-certificate',
      ctaText: 'QR কোড যাচাই করুন',
      badge: 'Instant QR Check',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-700',
      ctaClass: 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-sm',
      featured: false,
      bgClass: 'bg-gradient-to-br from-amber-50/60 via-white to-orange-50/30 dark:from-amber-950/10 dark:via-slate-900 dark:to-orange-950/10 border-slate-200 dark:border-slate-700',
    },
    {
      title: 'শিক্ষার্থী উপস্থিতি পোর্টাল',
      titleEn: 'Student Attendance Portal',
      desc: 'প্রতিদিনের উপস্থিতি রেকর্ড, ছুটির আবেদন এবং মাসিক উপস্থিতি শতকরা রিপোর্ট অভিভাবকদের জন্য।',
      iconClass: 'fa-calendar-check',
      iconBg: 'from-cyan-500 to-sky-600',
      iconShadow: 'shadow-cyan-500/25',
      href: '/login',
      ctaText: 'উপস্থিতি দেখুন',
      badge: 'Parent Corner',
      badgeColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700',
      ctaClass: 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-sm',
      featured: false,
      bgClass: 'bg-gradient-to-br from-cyan-50/60 via-white to-sky-50/30 dark:from-cyan-950/10 dark:via-slate-900 dark:to-sky-950/10 border-slate-200 dark:border-slate-700',
    },
    {
      title: 'টিউশন ও পেমেন্ট রেকর্ড',
      titleEn: 'Fee & Payment Records',
      desc: 'মাসিক বেতন, পরীক্ষার ফি এবং পরিশোধের ইতিহাস দেখুন। bKash, Nagad ও ব্যাংকের মাধ্যমে পরিশোধ করুন।',
      iconClass: 'fa-file-invoice-dollar',
      iconBg: 'from-rose-500 to-pink-600',
      iconShadow: 'shadow-rose-500/25',
      href: '/login',
      ctaText: 'ফি পরিশোধ করুন',
      badge: 'bKash / Nagad / Bank',
      badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-700',
      ctaClass: 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-sm',
      featured: false,
      bgClass: 'bg-gradient-to-br from-rose-50/60 via-white to-pink-50/30 dark:from-rose-950/10 dark:via-slate-900 dark:to-pink-950/10 border-slate-200 dark:border-slate-700',
    },
    {
      title: 'শিক্ষক ও স্টাফ পোর্টাল',
      titleEn: 'Faculty & Staff Portal',
      desc: 'শিক্ষকদের জন্য নম্বর এন্ট্রি, উপস্থিতি ডিজিটাল রেজিস্টার, লিভ ম্যানেজমেন্ট এবং নোটিশ ব্যবস্থাপনার সমন্বিত ড্যাশবোর্ড।',
      iconClass: 'fa-chalkboard-user',
      iconBg: 'from-purple-500 to-violet-600',
      iconShadow: 'shadow-purple-500/25',
      href: '/login',
      ctaText: 'লগইন করুন',
      badge: 'Staff Dashboard',
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-700',
      ctaClass: 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-sm',
      featured: false,
      bgClass: 'bg-gradient-to-br from-purple-50/60 via-white to-violet-50/30 dark:from-purple-950/10 dark:via-slate-900 dark:to-violet-950/10 border-slate-200 dark:border-slate-700',
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Decorative ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-300/10 dark:bg-emerald-600/5 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-indigo-300/10 dark:bg-indigo-600/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-teal-200/10 dark:bg-teal-600/5 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-5">
            <i className="fa-solid fa-bolt text-amber-500 text-[10px]" />
            <span>Digital E-Services &amp; Portals</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
            সব স্কুল সেবা এখন{' '}
            <span className="relative inline-block">
              <span className="vibrant-gradient-text">আপনার হাতের মুঠোয়</span>
            </span>
          </h2>
          <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            শিক্ষার্থী, অভিভাবক এবং শিক্ষকদের জন্য দ্রুত, নিরাপদ ও পেপারলেস স্মার্ট স্কুল ম্যানেজমেন্ট সেবা।
          </p>
        </div>

        {/* ── Services Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {services.map((srv, idx) => (
            <div
              key={idx}
              className={`group relative rounded-2xl sm:rounded-3xl border p-6 sm:p-7 flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${srv.bgClass}`}
            >
              {/* Card top row: icon + badge */}
              <div className="flex items-start justify-between gap-3 mb-5">
                {/* Gradient Icon Box */}
                <div className={`w-13 h-13 flex-shrink-0 rounded-2xl bg-gradient-to-br ${srv.iconBg} shadow-lg ${srv.iconShadow} flex items-center justify-center`}
                  style={{ width: '52px', height: '52px' }}>
                  <i className={`fa-solid ${srv.iconClass} text-white text-xl`} />
                </div>

                {/* Badge */}
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${srv.badgeColor}`}>
                  {srv.badge}
                </span>
              </div>

              {/* Titles */}
              <div className="mb-3">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                  {srv.title}
                </h3>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5 font-en tracking-wide">
                  {srv.titleEn}
                </p>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1 mb-6">
                {srv.desc}
              </p>

              {/* CTA Button */}
              <Link
                href={srv.href}
                className={`inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 ${srv.ctaClass}`}
              >
                <span>{srv.ctaText}</span>
                <i className="fa-solid fa-arrow-right text-xs group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          ))}
        </div>

        {/* ── Bottom Trust Bar ── */}
        <div className="mt-14 sm:mt-16 border-t border-slate-200 dark:border-slate-800 pt-10">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-lock text-emerald-500" />
              SSL Secured
            </span>
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-shield-halved text-indigo-500" />
              Data Privacy Protected
            </span>
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-mobile-screen text-cyan-500" />
              Mobile Friendly
            </span>
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-clock text-amber-500" />
              24 / 7 Available
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
