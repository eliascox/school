'use client';

import React from 'react';
import Link from 'next/link';
import { 
  UserPlus, 
  Search, 
  ArrowRight, 
  GraduationCap, 
  Sparkles,
  CheckCircle2,
  Award,
  BookOpen,
  Calendar,
  ShieldCheck,
  Building,
  Users,
  Compass,
  FileCheck,
  Bell
} from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';

interface PublicHeroProps {
  settings: SchoolSettings | null;
}

export default function PublicHero({ settings }: PublicHeroProps) {
  const schoolName = settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const address = settings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার।';
  const eiin = settings?.eiin || '106184';
  const estd = settings?.estdYear || '1969';

  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-[#070b1d] to-slate-950 text-white py-14 sm:py-20 lg:py-24 border-b border-slate-800">
      {/* ── Background Atmospheric Lighting & Grid Pattern ── */}
      <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
      <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-indigo-600/15 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* ═══════════════ LEFT COLUMN: VISION & CTAS ═══════════════ */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Top Academic Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-950/90 to-slate-900/90 border border-indigo-700/60 text-indigo-300 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider backdrop-blur-md shadow-xs uppercase">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>ESTD. {estd} • GOVT. APPROVED SECONDARY SCHOOL • EIIN: {eiin}</span>
            </div>

            {/* Main Headline with High-Impact Gradient Typography */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl 2xl:text-6xl font-black tracking-tight text-white leading-[1.2] font-serif">
              মানসম্মত শিক্ষা ও আধুনিক মূল্যবোধে{' '}
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-300 to-indigo-200">
                উজ্জ্বল ভবিষ্যৎ গড়ার প্রত্যয়
              </span>
            </h1>

            {/* Sub-headline Paragraph */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
              Welcome to <strong className="text-white font-semibold">{schoolName}</strong> official digital portal. 
              চকরিয়া, কক্সবাজারের একটি স্বনামধন্য মাধ্যমিক শিক্ষাপ্রতিষ্ঠান। অভিজ্ঞ শিক্ষকমণ্ডলী, ডিজিটাল ক্লাসরুম ও সমৃদ্ধ বিজ্ঞানাগারের সমন্বয়ে ভবিষ্যৎ নেতৃত্ব গড়ে তোলাই আমাদের লক্ষ্য।
            </p>

            {/* ── Call To Action Buttons (High Contrast & Differentiated) ── */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              {/* Primary: Online Admission with Glowing Emerald Sheen */}
              <Link
                href="/admission"
                className="group relative inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-900/40 hover:shadow-emerald-700/50 transition-all transform hover:-translate-y-0.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Online Admission</span>
                <span className="hidden sm:inline-block text-[11px] bg-emerald-950/70 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Open 2026
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Secondary: Results Portal with Search Icon */}
              <Link
                href="/result"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm text-white bg-slate-900/90 hover:bg-indigo-950/90 border border-indigo-700/70 shadow-md shadow-indigo-950/30 hover:shadow-indigo-900/50 transition-all transform hover:-translate-y-0.5"
              >
                <Search className="w-4 h-4 text-amber-400" />
                <span>Results Portal</span>
              </Link>

              {/* Tertiary: Notice Board */}
              <a
                href="#notices"
                className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl font-bold text-sm text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/80 transition-all"
              >
                <Bell className="w-4 h-4 text-cyan-400" />
                <span>Notice Board</span>
              </a>
            </div>

            {/* ── 4 Trust & Accreditation Highlights ── */}
            <div className="pt-6 border-t border-slate-800/90 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">EIIN: {eiin} (Chattogram Board)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">Science, Humanities & Business</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">Modern ICT & Multimedia Lab</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">Active Scouting & Co-curricular</span>
              </div>
            </div>
          </div>

          {/* ═══════════════ RIGHT COLUMN: MULTI-LAYER INTERACTIVE SHOWCASE ═══════════════ */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              
              {/* Outer Decorative Gradient Glow */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-emerald-500/20 to-amber-500/20 blur-xl opacity-70"></div>

              {/* Main Showcase Container */}
              <div className="relative rounded-3xl bg-slate-900/90 border border-slate-700/80 p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-5">
                
                {/* 1. Header Banner & Campus Identity */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-slate-900 flex items-center justify-center text-amber-400 border border-indigo-500/40 shadow-inner shrink-0">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white leading-snug">{schoolName}</h2>
                      <p className="text-xs text-slate-400">{address}</p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-1 rounded-full whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Live Portal</span>
                  </span>
                </div>

                {/* 2. Visual Campus Art Card with Floating Glass Chips */}
                <div className="relative h-44 sm:h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border border-indigo-900/60 p-4 flex flex-col justify-between">
                  {/* Background Campus Illustration Art */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <svg className="w-full h-full object-cover" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="400" height="200" fill="#0f172a" />
                      {/* Stylized School Building */}
                      <path d="M40 180 L40 90 L100 60 L160 90 L160 180 Z" fill="#1e293b" stroke="#6366f1" strokeWidth="2" />
                      <path d="M160 180 L160 80 L320 80 L320 180 Z" fill="#0f172a" stroke="#6366f1" strokeWidth="2" />
                      <path d="M210 180 L210 120 L270 120 L270 180 Z" fill="#312e81" stroke="#fbbf24" strokeWidth="2" />
                      {/* Flag Pole */}
                      <line x1="240" y1="120" x2="240" y2="40" stroke="#e2e8f0" strokeWidth="2" />
                      <polygon points="240,40 265,50 240,60" fill="#dc2626" />
                      {/* Trees & Grounds */}
                      <circle cx="340" cy="150" r="25" fill="#065f46" opacity="0.6" />
                      <circle cx="370" cy="160" r="20" fill="#047857" opacity="0.6" />
                      <line x1="0" y1="180" x2="400" y2="180" stroke="#475569" strokeWidth="3" />
                    </svg>
                  </div>

                  {/* Top Floating Badge */}
                  <div className="relative z-10 flex justify-between items-start">
                    <div className="bg-slate-950/85 backdrop-blur-md border border-slate-700/80 px-3 py-1 rounded-lg text-xs font-bold text-amber-300 shadow-sm flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>৫৫ বছরের গৌরবময় শিক্ষাজীবন (১৯৬৯ - ২০২৬)</span>
                    </div>
                  </div>

                  {/* Bottom Floating Stats Strip */}
                  <div className="relative z-10 flex flex-wrap gap-2">
                    <div className="bg-indigo-950/90 backdrop-blur-md border border-indigo-700/80 px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-200 flex items-center gap-1 shadow-sm">
                      <Building className="w-3 h-3 text-indigo-400" />
                      <span>মডেল একাডেমি ক্যাম্পাস</span>
                    </div>
                    <div className="bg-emerald-950/90 backdrop-blur-md border border-emerald-700/80 px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-200 flex items-center gap-1 shadow-sm">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>১০০% পাসের সাফল্য</span>
                    </div>
                  </div>
                </div>

                {/* 3. Four Modern Interactive Digital Tiles (Instant Access) */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Results Tile */}
                  <Link
                    href="/result"
                    className="group bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 hover:border-amber-500/50 rounded-xl p-3 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                        <Award className="w-4 h-4" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">অনলাইন ফলাফল</div>
                      <div className="text-[10px] text-slate-400">পরীক্ষার মার্কশিট ও জিপিএ</div>
                    </div>
                  </Link>

                  {/* Admission Tile */}
                  <Link
                    href="/admission"
                    className="group bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 hover:border-emerald-500/50 rounded-xl p-3 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">ভর্তি আবেদন</div>
                      <div className="text-[10px] text-slate-400">অনলাইনে সহজ ভর্তি ফরম</div>
                    </div>
                  </Link>

                  {/* Academic Stream Tile */}
                  <a
                    href="#academic"
                    className="group bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 hover:border-indigo-500/50 rounded-xl p-3 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">একাডেমিক বিভাগ</div>
                      <div className="text-[10px] text-slate-400">বিজ্ঞান, মানবিক ও বাণিজ্য</div>
                    </div>
                  </a>

                  {/* Certificate Verification Tile */}
                  <Link
                    href="/verify-certificate"
                    className="group bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 hover:border-cyan-500/50 rounded-xl p-3 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">সনদপত্র যাচাই</div>
                      <div className="text-[10px] text-slate-400">ডিজিটাল কিউআর ভেরিফিকেশন</div>
                    </div>
                  </Link>
                </div>

                {/* 4. Executive Portal Login Strip */}
                <div className="bg-gradient-to-r from-indigo-950/90 to-slate-900 border border-indigo-800/60 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-900/80 border border-indigo-700 flex items-center justify-center text-amber-400 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">ম্যানেজমেন্ট পোর্টাল</div>
                      <div className="text-[11px] text-slate-400">শিক্ষক ও অ্যাডমিনদের অফিসিয়াল ড্যাশবোর্ড</div>
                    </div>
                  </div>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all whitespace-nowrap"
                  >
                    <span>লগইন করুন</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
