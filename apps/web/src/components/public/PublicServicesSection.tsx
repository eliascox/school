'use client';

import React from 'react';
import Link from 'next/link';
import { 
  UserPlus, 
  GraduationCap, 
  ShieldCheck, 
  CalendarCheck, 
  CreditCard, 
  Users, 
  ArrowRight,
  Sparkles,
  Award,
  QrCode,
  CheckCircle2,
  Receipt,
  UserCheck
} from 'lucide-react';

export default function PublicServicesSection() {
  const services = [
    {
      title: 'অনলাইন ভর্তি পোর্টাল',
      titleEn: 'Online Admission Portal',
      desc: '৬ষ্ঠ থেকে ৯ম শ্রেণিতে ভর্তির জন্য অনলাইনে আবেদন করুন। প্রয়োজনীয় তথ্য পূরণ করে নিশ্চিতকরণ রসিদ ডাউনলোড করুন।',
      href: '/admission',
      ctaText: 'ভর্তির আবেদন করুন',
      badge: 'Admission Open',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      ctaClass: 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25',
      cardBg: 'bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/30 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900',
      cardBorder: 'border-emerald-200/90 hover:border-emerald-400 dark:border-emerald-800/70',
      glowColor: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      iconRing: 'from-emerald-300 via-teal-200 to-emerald-500',
      iconGradient: 'from-emerald-500 via-emerald-600 to-teal-700',
      iconShadow: 'shadow-emerald-500/35',
      icon: <UserPlus className="w-7 h-7 text-white drop-shadow-md" strokeWidth={2.2} />,
      microBadgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
      microBadgeIcon: <Sparkles className="w-2.5 h-2.5" />
    },
    {
      title: 'অনলাইন পরীক্ষার ফলাফল',
      titleEn: 'Online Examination Results',
      desc: 'শ্রেণি, রোল নম্বর দিয়ে পরীক্ষার ফলাফল, নম্বরপত্র ও ডিজিটাল ট্রান্সক্রিপ্ট দেখুন এবং ডাউনলোড করুন।',
      href: '/result',
      ctaText: 'ফলাফল দেখুন',
      badge: 'Official Transcripts',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
      ctaClass: 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25',
      cardBg: 'bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/30 dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900',
      cardBorder: 'border-indigo-200/90 hover:border-indigo-400 dark:border-indigo-800/70',
      glowColor: 'bg-gradient-to-r from-indigo-500 to-violet-500',
      iconRing: 'from-indigo-300 via-violet-200 to-purple-500',
      iconGradient: 'from-indigo-600 via-indigo-700 to-violet-700',
      iconShadow: 'shadow-indigo-500/35',
      icon: <GraduationCap className="w-7 h-7 text-white drop-shadow-md" strokeWidth={2.2} />,
      microBadgeBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300',
      microBadgeIcon: <Award className="w-2.5 h-2.5" />
    },
    {
      title: 'ডিজিটাল সনদ যাচাইকরণ',
      titleEn: 'Digital Certificate Verification',
      desc: 'প্রশংসাপত্র, স্কুল সনদ ও টিসি-এর সত্যতা QR কোড স্ক্যান করে তাৎক্ষণিকভাবে যাচাই করুন।',
      href: '/verify-certificate',
      ctaText: 'QR কোড যাচাই করুন',
      badge: 'Instant QR Check',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      ctaClass: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25',
      cardBg: 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/30 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900',
      cardBorder: 'border-amber-200/90 hover:border-amber-400 dark:border-amber-800/70',
      glowColor: 'bg-gradient-to-r from-amber-500 to-orange-400',
      iconRing: 'from-amber-300 via-orange-200 to-amber-500',
      iconGradient: 'from-amber-500 via-orange-500 to-amber-600',
      iconShadow: 'shadow-amber-500/35',
      icon: <ShieldCheck className="w-7 h-7 text-white drop-shadow-md" strokeWidth={2.2} />,
      microBadgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      microBadgeIcon: <QrCode className="w-2.5 h-2.5" />
    },
    {
      title: 'শিক্ষার্থী উপস্থিতি পোর্টাল',
      titleEn: 'Student Attendance Portal',
      desc: 'প্রতিদিনের উপস্থিতি রেকর্ড, ছুটির আবেদন এবং মাসিক উপস্থিতি শতকরা রিপোর্ট অভিভাবকদের জন্য।',
      href: '/login',
      ctaText: 'উপস্থিতি দেখুন',
      badge: 'Parent Corner',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
      ctaClass: 'bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-sky-500 text-white shadow-lg shadow-cyan-600/25',
      cardBg: 'bg-gradient-to-br from-cyan-50/70 via-white to-sky-50/30 dark:from-cyan-950/20 dark:via-slate-900 dark:to-slate-900',
      cardBorder: 'border-cyan-200/90 hover:border-cyan-400 dark:border-cyan-800/70',
      glowColor: 'bg-gradient-to-r from-cyan-500 to-sky-400',
      iconRing: 'from-cyan-300 via-sky-200 to-blue-500',
      iconGradient: 'from-cyan-500 via-sky-600 to-blue-600',
      iconShadow: 'shadow-cyan-500/35',
      icon: <CalendarCheck className="w-7 h-7 text-white drop-shadow-md" strokeWidth={2.2} />,
      microBadgeBg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
      microBadgeIcon: <CheckCircle2 className="w-2.5 h-2.5" />
    },
    {
      title: 'টিউশন ও পেমেন্ট রেকর্ড',
      titleEn: 'Fee & Payment Records',
      desc: 'মাসিক বেতন, পরীক্ষার ফি এবং পরিশোধের ইতিহাস দেখুন। bKash, Nagad ও ব্যাংকের মাধ্যমে পরিশোধ করুন।',
      href: '/login',
      ctaText: 'ফি পরিশোধ করুন',
      badge: 'bKash / Nagad / Bank',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
      ctaClass: 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg shadow-rose-600/25',
      cardBg: 'bg-gradient-to-br from-rose-50/70 via-white to-pink-50/30 dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900',
      cardBorder: 'border-rose-200/90 hover:border-rose-400 dark:border-rose-800/70',
      glowColor: 'bg-gradient-to-r from-rose-500 to-pink-500',
      iconRing: 'from-rose-300 via-pink-200 to-rose-500',
      iconGradient: 'from-rose-500 via-pink-600 to-rose-700',
      iconShadow: 'shadow-rose-500/35',
      icon: <CreditCard className="w-7 h-7 text-white drop-shadow-md" strokeWidth={2.2} />,
      microBadgeBg: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
      microBadgeIcon: <Receipt className="w-2.5 h-2.5" />
    },
    {
      title: 'শিক্ষক ও স্টাফ পোর্টাল',
      titleEn: 'Faculty & Staff Portal',
      desc: 'শিক্ষকদের জন্য নম্বর এন্ট্রি, উপস্থিতি ডিজিটাল রেজিস্টার, লিভ ম্যানেজমেন্ট এবং নোটিশ ব্যবস্থাপনার সমন্বিত ড্যাশবোর্ড।',
      href: '/login',
      ctaText: 'লগইন করুন',
      badge: 'Staff Dashboard',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
      ctaClass: 'bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg shadow-purple-600/25',
      cardBg: 'bg-gradient-to-br from-purple-50/70 via-white to-violet-50/30 dark:from-purple-950/20 dark:via-slate-900 dark:to-slate-900',
      cardBorder: 'border-purple-200/90 hover:border-purple-400 dark:border-purple-800/70',
      glowColor: 'bg-gradient-to-r from-purple-500 to-violet-500',
      iconRing: 'from-purple-300 via-violet-200 to-fuchsia-500',
      iconGradient: 'from-purple-600 via-violet-600 to-purple-800',
      iconShadow: 'shadow-purple-500/35',
      icon: <Users className="w-7 h-7 text-white drop-shadow-md" strokeWidth={2.2} />,
      microBadgeBg: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      microBadgeIcon: <UserCheck className="w-2.5 h-2.5" />
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Decorative ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-400/10 dark:bg-emerald-600/5 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-indigo-400/10 dark:bg-indigo-600/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-teal-400/10 dark:bg-teal-600/5 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Digital E-Services &amp; Portals</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
            সব স্কুল সেবা এখন{' '}
            <span className="relative inline-block">
              <span className="vibrant-gradient-text">আপনার হাতের মুঠোয়</span>
            </span>
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            শিক্ষার্থী, অভিভাবক এবং শিক্ষকদের জন্য দ্রুত, নিরাপদ ও পেপারলেস স্মার্ট স্কুল ম্যানেজমেন্ট সেবা।
          </p>
        </div>

        {/* ── Services Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {services.map((srv, idx) => (
            <div
              key={idx}
              className={`group relative rounded-3xl border p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 ${srv.cardBg} ${srv.cardBorder}`}
            >
              {/* Card top row: 3D Neo-Glassmorphic Icon + Badge */}
              <div className="flex items-start justify-between gap-3 mb-6">
                
                {/* 3D Neo-Glassmorphic Icon Emblem */}
                <div className="relative shrink-0 group/icon">
                  {/* Layer 1: Ambient Colored Blur Glow Halo */}
                  <div 
                    className={`absolute -inset-1 rounded-2xl ${srv.glowColor} opacity-40 group-hover:opacity-85 blur-md transition-all duration-300 group-hover:blur-lg`} 
                  />

                  {/* Layer 2: Outer Metallic / Neon Ring Frame */}
                  <div className={`relative w-15 h-15 sm:w-16 sm:h-16 rounded-2xl p-[1.5px] bg-gradient-to-br ${srv.iconRing} shadow-lg ${srv.iconShadow} transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-0.5`}>
                    
                    {/* Layer 3: Inner High-Gloss Solid Gradient Surface */}
                    <div className={`w-full h-full rounded-[14px] bg-gradient-to-br ${srv.iconGradient} flex items-center justify-center relative overflow-hidden`}>
                      
                      {/* Glossy Light Reflection Sheen on Top Edge */}
                      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                      <div className="absolute -top-4 -right-4 w-10 h-10 bg-white/20 rounded-full blur-[2px] pointer-events-none" />

                      {/* Main Vector Icon */}
                      <div className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                        {srv.icon}
                      </div>

                      {/* Floating Micro-Badge on bottom right corner */}
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${srv.microBadgeBg} border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-md transform transition-transform duration-300 group-hover:scale-115`}>
                        {srv.microBadgeIcon}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Pill Badge */}
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border shadow-xs whitespace-nowrap ${srv.badgeColor}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                  <span>{srv.badge}</span>
                </span>
              </div>

              {/* Titles */}
              <div className="mb-3">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
                  {srv.title}
                </h3>
                <p className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 font-en uppercase tracking-wider">
                  {srv.titleEn}
                </p>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1 mb-6">
                {srv.desc}
              </p>

              {/* CTA Button */}
              <Link
                href={srv.href}
                className={`inline-flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 group/btn ${srv.ctaClass}`}
              >
                <span>{srv.ctaText}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
              </Link>
            </div>
          ))}
        </div>

        {/* ── Bottom Trust Bar ── */}
        <div className="mt-16 sm:mt-20 border-t border-slate-200 dark:border-slate-800 pt-10">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              SSL Secured
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Data Privacy Protected
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              Mobile Friendly
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              24 / 7 Available
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
