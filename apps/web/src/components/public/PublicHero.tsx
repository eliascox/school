'use client';

import React from 'react';
import Link from 'next/link';
import { 
  UserPlus, 
  Search, 
  ArrowRight, 
  GraduationCap, 
  Sparkles,
  CheckCircle2
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
    <section id="home" className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-white py-16 sm:py-24 lg:py-28 border-b border-slate-800">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Top English Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide backdrop-blur-xs uppercase">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>ESTD. {estd} • GOVT. APPROVED SECONDARY SCHOOL • EIIN: {eiin}</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              মানসম্মত শিক্ষা ও নৈতিকতায়{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-400 to-indigo-300">
                উজ্জ্বল ভবিষ্যৎ গড়ার প্রত্যয়
              </span>
            </h1>

            {/* School Introduction Paragraph */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
              Welcome to <strong className="text-white font-semibold">{schoolName}</strong> official digital portal. 
              Fostering academic excellence, moral integrity, digital literacy, and holistic co-curricular development for secondary school students in Bangladesh.
            </p>

            {/* Call to Actions (in English) */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <Link
                href="/admission"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Online Admission</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/result"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-600/60 shadow-lg shadow-indigo-950/30 transition-all transform hover:-translate-y-0.5"
              >
                <Search className="w-4 h-4 text-amber-400" />
                <span>Results Portal</span>
              </Link>

              <a
                href="#notices"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all"
              >
                <span>Notice Board</span>
              </a>
            </div>

            {/* Quick Feature Badges */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>EIIN: {eiin} (BISE Chattogram)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Science, Humanities & Business</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300 col-span-2 sm:col-span-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Modern Digital Computer Lab</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Card / School Identity Showcase */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="relative rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/95 p-6 sm:p-8 border border-slate-700 shadow-2xl backdrop-blur-md">
                {/* School Emblem / Card Header */}
                <div className="flex items-center gap-4 pb-6 border-b border-slate-700/80">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-700 to-slate-900 flex items-center justify-center text-amber-400 border border-indigo-500/50 shadow-inner">
                    <GraduationCap className="w-9 h-9" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white leading-snug">{schoolName}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{address}</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] font-semibold rounded-md">
                      Recognized Secondary School
                    </span>
                  </div>
                </div>

                {/* 4 Pillars of Excellence */}
                <div className="grid grid-cols-2 gap-3 py-6">
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 hover:bg-slate-800 transition-colors">
                    <div className="text-amber-400 font-bold text-xl">100%</div>
                    <div className="text-xs text-slate-300 font-medium mt-1">Certified Faculty</div>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 hover:bg-slate-800 transition-colors">
                    <div className="text-emerald-400 font-bold text-xl">Digital</div>
                    <div className="text-xs text-slate-300 font-medium mt-1">Smart Classrooms</div>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 hover:bg-slate-800 transition-colors">
                    <div className="text-indigo-400 font-bold text-xl">Library</div>
                    <div className="text-xs text-slate-300 font-medium mt-1">Enriched Books</div>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 hover:bg-slate-800 transition-colors">
                    <div className="text-cyan-400 font-bold text-xl">Scouting</div>
                    <div className="text-xs text-slate-300 font-medium mt-1">Active Co-curricular</div>
                  </div>
                </div>

                {/* Direct Portal Access Box */}
                <div className="bg-indigo-950/70 border border-indigo-800/60 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Student & Guardian Portal</div>
                    <div className="text-xs text-slate-400">Attendance, fees, and evaluations</div>
                  </div>
                  <Link
                    href="/login"
                    className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                  >
                    Enter Portal
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
