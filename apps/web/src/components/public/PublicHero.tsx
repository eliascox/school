'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { SchoolSettings, settingsService } from '@/services/settingsService';
import { HeroConfig } from '@/services/landingPageService';

interface PublicHeroProps {
  settings?: SchoolSettings | null;
  heroConfig?: HeroConfig | null;
}

export default function PublicHero({ settings, heroConfig }: PublicHeroProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const schoolName = heroConfig?.title || settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const address = heroConfig?.subtitle || settings?.address || 'চকরিয়া, কক্সবাজার';
  const estd = settings?.estdYear || '1969';
  const eiin = settings?.eiin || '106184';
  const customBg = heroConfig?.bgImage || settings?.schoolPhoto || '/school-campus.jpg';

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
    <section 
      id="home" 
      className="hero-bg relative min-h-[90vh] sm:min-h-[96vh] flex flex-col justify-center text-slate-900 dark:text-slate-100 overflow-visible pt-28 sm:pt-36 pb-16 sm:pb-24"
      style={{
        backgroundImage: `linear-gradient(180deg, var(--hero-gradient-top, rgba(248, 250, 252, 0.08)) 0%, var(--hero-gradient-mid, rgba(248, 250, 252, 0.03)) 40%, var(--hero-gradient-lower, rgba(248, 250, 252, 0.2)) 80%, var(--hero-gradient-bottom, rgba(248, 250, 252, 0.55)) 100%), url('${customBg}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center'
      }}
    >
      {/* Hero Center Content Area */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col items-center justify-center relative z-10 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Top Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600/10 dark:bg-emerald-950/70 border border-emerald-600/30 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-en font-bold uppercase tracking-wider mb-6 shadow-sm backdrop-blur-md">
            <i className="fa-solid fa-award text-amber-600 dark:text-amber-400"></i> 
            <span>ESTD: {estd} • GOVT. APPROVED SECONDARY SCHOOL • EIIN: {eiin} • BISE CHATTOGRAM</span>
          </div>

          {/* Grand Headline with Vibrant Gradient Text */}
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm leading-tight">
            জ্ঞান, শৃঙ্খলা ও নৈতিকতায় আলোকিত <span className="vibrant-gradient-text">আদর্শ বিদ্যাপীঠ</span>
          </h1>

          {/* Glassy Subtitle Description Box */}
          <p className="mt-6 text-base sm:text-lg text-slate-700 dark:text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed bg-white/70 dark:bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60">
            {address} এর ঐতিহ্যবাহী {schoolName}-এ আধুনিক বিজ্ঞান, আইসিটি ল্যাব এবং সহশিক্ষা কার্যক্রমের সমন্বয়ে গড়ে উঠছে আগামী দিনের যোগ্য নাগরিক।
          </p>

          {/* Quick Action CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/admission"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-sm font-en font-bold text-white shadow-xl shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
              <i className="fa-solid fa-user-plus text-base"></i>
              <span>Online Admission</span>
              <span className="text-[10px] bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                Open 2026
              </span>
            </Link>

            <Link
              href="/result"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-sm font-en font-bold text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 shadow-md backdrop-blur-md transition-all transform hover:-translate-y-0.5"
            >
              <i className="fa-solid fa-magnifying-glass text-emerald-600"></i>
              <span>Results Portal</span>
            </Link>

            <a
              href="#facilities"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-sm font-en font-semibold text-white shadow-md border border-slate-800 transition-all transform hover:-translate-y-0.5"
            >
              <i className="fa-solid fa-laptop-code text-teal-400"></i>
              <span>Campus Facilities</span>
            </a>
          </div>
        </div>
      </div>

      {/* Floating Bottom Admin Quick Photo Upload Control */}
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-[11px] font-semibold text-slate-200 hover:text-white backdrop-blur-md transition-all shadow-md border border-slate-700/80"
          title="হিরো সেকশনের ব্যাকগ্রাউন্ড ছবি পরিবর্তন করুন"
        >
          <i className="fa-solid fa-camera text-amber-400"></i>
          <span>ক্যাম্পাস ছবি পরিবর্তন</span>
        </button>
      </div>
    </section>
  );
}
