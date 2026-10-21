'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { 
  UserPlus, 
  Search, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Bell, 
  Camera,
  MapPin,
  Award,
  Building2,
  LogIn
} from 'lucide-react';
import { SchoolSettings, settingsService } from '@/services/settingsService';

interface PublicHeroProps {
  settings: SchoolSettings | null;
}

export default function PublicHero({ settings }: PublicHeroProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const schoolName = settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const address = settings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার।';
  const eiin = settings?.eiin || '106184';
  const estd = settings?.estdYear || '1969';
  const schoolPhoto = settings?.schoolPhoto || '/school-campus.jpg';

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result) {
        settingsService.updateSettings({ schoolPhoto: result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-[#070b1d] to-slate-950 text-white py-12 sm:py-16 lg:py-20 border-b border-slate-800">
      {/* Background Atmospheric Glows */}
      <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
      <div className="absolute top-10 left-1/4 w-[500px] h-[300px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="absolute top-20 right-1/4 w-[500px] h-[300px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-7">
        
        {/* ═══════════ 1. TOP ACADEMIC EYEBROW BADGE ═══════════ */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-950/90 to-slate-900/90 border border-indigo-700/60 text-indigo-300 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider backdrop-blur-md shadow-xs uppercase">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>ESTD. {estd} • GOVT. APPROVED SECONDARY SCHOOL • EIIN: {eiin} • BISE CHATTOGRAM</span>
        </div>

        {/* ═══════════ 2. BOLD & LARGE SCHOOL NAME ═══════════ */}
        <div className="space-y-2">
          <Link
            href="/"
            onClick={(e) => {
              if (typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '')) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="inline-block group/title cursor-pointer focus:outline-hidden"
            title="হোমপেজে যান"
          >
            {/* Main Large School Name */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-tight font-serif drop-shadow-lg group-hover/title:text-indigo-200 transition-colors">
              {schoolName}
            </h1>
          </Link>

          {/* Subtitle Location */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-3xl mx-auto font-medium pt-1">
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>{address}</span>
            </span>
          </p>
        </div>

        {/* ═══════════ 3. BIG SCHOOL PICTURE (বড় স্কুলের ছবি) ═══════════ */}
        <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden border-2 border-indigo-900/60 shadow-2xl group bg-slate-900">
          {/* Campus Picture */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={schoolPhoto} 
            alt={schoolName}
            className="w-full h-[280px] sm:h-[400px] lg:h-[480px] object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Dark Gradient Vignette Overlay for Crisp Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-transparent pointer-events-none"></div>

          {/* Top-Left Floating Tag: Campus Title */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-lg">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>মডেল একাডেমি ক্যাম্পাস • বরইতলী উচ্চ বিদ্যালয়</span>
          </div>

          {/* Top-Right Floating Tag: Legacy Badge */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-300 shadow-lg">
            <Award className="w-4 h-4 text-amber-400" />
            <span>৫৫ বছরের গৌরবময় শিক্ষাজীবন (১৯৬৯ - ২০২৬)</span>
          </div>

          {/* Bottom-Left Tag: Status */}
          <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 bg-slate-950/85 backdrop-blur-md border border-emerald-800/80 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-300 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>আধুনিক ক্লাসরুম, কম্পিউটার ল্যাব ও সুবিশাল খেলার মাঠ</span>
          </div>

          {/* Bottom-Right: Change Photo Button (Quick Upload for School Authority) */}
          <div className="absolute bottom-4 right-4 z-10">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-indigo-900/90 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white backdrop-blur-md transition-all shadow-md group/btn"
              title="স্কুলের নিজস্ব নতুন ছবি আপলোড করুন"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400 group-hover/btn:scale-110 transition-transform" />
              <span>ছবি পরিবর্তন করুন</span>
            </button>
          </div>
        </div>

        {/* ═══════════ 4. HIGH-CONVERTING CALL TO ACTION BUTTONS ═══════════ */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
          {/* Online Admission */}
          <Link
            href="/admission"
            className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-900/40 hover:shadow-emerald-700/50 transition-all transform hover:-translate-y-0.5"
          >
            <UserPlus className="w-5 h-5" />
            <span>Online Admission</span>
            <span className="text-[11px] bg-emerald-950/70 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              Open 2026
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Results Portal */}
          <Link
            href="/result"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-slate-900/90 hover:bg-indigo-950/90 border border-indigo-700/70 shadow-lg shadow-indigo-950/30 hover:shadow-indigo-900/50 transition-all transform hover:-translate-y-0.5"
          >
            <Search className="w-5 h-5 text-amber-400" />
            <span>Results Portal</span>
          </Link>

          {/* Notice Board */}
          <a
            href="#notices"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/80 transition-all"
          >
            <Bell className="w-5 h-5 text-cyan-400" />
            <span>Notice Board</span>
          </a>

          {/* Management Login */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm sm:text-base text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/80 transition-all"
          >
            <LogIn className="w-4 h-4 text-amber-400" />
            <span>Portal Login</span>
          </Link>
        </div>

        {/* ═══════════ 5. TRUST PILLARS ROW ═══════════ */}
        <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto text-left">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">EIIN: {eiin} (চট্টগ্রাম শিক্ষাবোর্ড)</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">আধুনিক কম্পিউটার ও আইসিটি ল্যাব</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">স্কাউটিং, রেডক্রিসেন্ট ও খেলাধুলা</span>
          </div>
        </div>

      </div>
    </section>
  );
}
