'use client';

import React from 'react';
import Link from 'next/link';
import { 
  UserPlus, 
  Search, 
  ArrowRight, 
  Sparkles,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';

interface PublicHeroProps {
  settings: SchoolSettings | null;
}

export default function PublicHero({ settings }: PublicHeroProps) {
  const schoolName = settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const eiin = settings?.eiin || '106184';
  const estd = settings?.estdYear || '1969';

  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-[#070b1d] to-slate-950 text-white py-16 sm:py-24 lg:py-28 border-b border-slate-800">
      {/* ── Background Atmospheric Lighting & Grid Pattern ── */}
      <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[750px] h-[400px] bg-indigo-600/15 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute top-10 left-10 w-80 h-80 bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-500/10 blur-[130px] rounded-full pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-7">
        
        {/* Top Academic Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-950/90 to-slate-900/90 border border-indigo-700/60 text-indigo-300 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider backdrop-blur-md shadow-xs uppercase">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>ESTD. {estd} • GOVT. APPROVED SECONDARY SCHOOL • EIIN: {eiin}</span>
        </div>

        {/* Main Headline with High-Impact Gradient Typography */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.2] font-serif max-w-4xl mx-auto">
          মানসম্মত শিক্ষা ও আধুনিক মূল্যবোধে{' '}
          <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-300 to-indigo-200">
            উজ্জ্বল ভবিষ্যৎ গড়ার প্রত্যয়
          </span>
        </h1>

        {/* Sub-headline Paragraph */}
        <p className="text-base sm:text-lg lg:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto font-normal">
          Welcome to <strong className="text-white font-semibold">{schoolName}</strong> official digital portal. 
          চকরিয়া, কক্সবাজারের একটি স্বনামধন্য মাধ্যমিক শিক্ষাপ্রতিষ্ঠান। অভিজ্ঞ শিক্ষকমণ্ডলী, ডিজিটাল ক্লাসরুম ও সমৃদ্ধ বিজ্ঞানাগারের সমন্বয়ে ভবিষ্যৎ নেতৃত্ব গড়ে তোলাই আমাদের লক্ষ্য।
        </p>

        {/* ── Call To Action Buttons (Centered, Balanced & Prominent) ── */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-3">
          {/* Primary: Online Admission */}
          <Link
            href="/admission"
            className="group relative inline-flex items-center gap-2.5 px-7 py-4 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-900/40 hover:shadow-emerald-700/50 transition-all transform hover:-translate-y-0.5"
          >
            <UserPlus className="w-5 h-5" />
            <span>Online Admission</span>
            <span className="text-[11px] bg-emerald-950/70 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              Open 2026
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Secondary: Results Portal */}
          <Link
            href="/result"
            className="inline-flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-sm sm:text-base text-white bg-slate-900/90 hover:bg-indigo-950/90 border border-indigo-700/70 shadow-lg shadow-indigo-950/30 hover:shadow-indigo-900/50 transition-all transform hover:-translate-y-0.5"
          >
            <Search className="w-5 h-5 text-amber-400" />
            <span>Results Portal</span>
          </Link>

          {/* Tertiary: Notice Board */}
          <a
            href="#notices"
            className="inline-flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-sm sm:text-base text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/80 transition-all"
          >
            <Bell className="w-5 h-5 text-cyan-400" />
            <span>Notice Board</span>
          </a>
        </div>

        {/* ── 4 Feature Trust Badges (Centered Grid) ── */}
        <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-3.5 max-w-4xl mx-auto text-left">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">EIIN: {eiin} (চট্টগ্রাম বোর্ড)</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">বিজ্ঞান, মানবিক ও বাণিজ্য</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">আধুনিক কম্পিউটার ও আইসিটি ল্যাব</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">স্কাউটিং ও সহশিক্ষা কার্যক্রম</span>
          </div>
        </div>

      </div>
    </section>
  );
}
