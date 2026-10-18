'use client';

import React from 'react';
import { Target, Compass, Heart, Shield, School, CheckCircle2 } from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';

interface PublicAboutProps {
  settings: SchoolSettings | null;
}

export default function PublicAbout({ settings }: PublicAboutProps) {
  const schoolName = settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const estd = settings?.estdYear || '1969';
  const address = settings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার।';
  const eiin = settings?.eiin || '106184';

  const pillars = [
    {
      icon: <Target className="w-6 h-6 text-indigo-500" />,
      title: 'Our Mission',
      desc: 'To empower students with modern scientific knowledge, digital competence, and moral principles for an evolving global world.'
    },
    {
      icon: <Compass className="w-6 h-6 text-emerald-500" />,
      title: 'Our Vision',
      desc: 'To stand as a premier secondary institution recognized for holistic academic excellence, character building, and exemplary board results.'
    },
    {
      icon: <Heart className="w-6 h-6 text-rose-500" />,
      title: 'Core Values',
      desc: 'Fostering integrity, discipline, empathy, mutual respect, and civic consciousness as the foundation of institutional culture.'
    },
    {
      icon: <Shield className="w-6 h-6 text-amber-500" />,
      title: 'Safe Campus Environment',
      desc: 'A politics-free, peaceful, and well-secured campus equipped with clean sanitation, library, and active faculty guidance.'
    }
  ];

  return (
    <section id="about" className="py-16 sm:py-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
            <School className="w-3.5 h-3.5" />
            <span>ABOUT OUR INSTITUTION</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            A Legacy of Knowledge, Discipline & Excellence
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            Established in {estd}, <strong>{schoolName}</strong> has been illuminating generations of students across Chakaria and Cox's Bazar.
          </p>
        </div>

        {/* Story & History Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-16">
          <div className="space-y-4 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Historical Background & Heritage
            </h3>
            <p>
              কক্সবাজার জেলার চকরিয়া উপজেলার বরইতলী ইউনিয়নের প্রাণকেন্দ্রে ১৯৬৯ খ্রিষ্টাব্দে স্থানীয় বিদ্যানুরাগী ব্যক্তিত্বদের ঐকান্তিক প্রচেষ্টায় প্রতিষ্ঠিত হয় <strong>{schoolName}</strong>। প্রত্যন্ত অঞ্চলের শিক্ষার্থীদের মাঝে আধুনিক শিক্ষার আলো ছড়িয়ে দেওয়ার প্রত্যয় নিয়ে এই বিদ্যাপীঠের সূচনা হয়েছিল।
            </p>
            <p>
              For over five decades, the school has nurtured thousands of alumni who now serve in leadership roles nationally and internationally. Approved by the Board of Intermediate and Secondary Education (BISE) Chattogram, we provide specialized education across Science, Humanities, and Business Studies streams for Classes 6 to 10.
            </p>
            <ul className="space-y-2.5 pt-2">
              <li className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>EIIN: {eiin} • Board of Intermediate & Secondary Education, Chattogram</span>
              </li>
              <li className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Campus Location: {address}</span>
              </li>
              <li className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Spacious multi-story academic buildings, secured boundary, and expansive playground</span>
              </li>
            </ul>
          </div>

          {/* Pillars Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pillars.map((pillar, idx) => (
              <div
                key={idx}
                className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 hover:shadow-lg transition-all"
              >
                <div className="p-3 w-fit rounded-xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200 dark:border-slate-700 mb-4">
                  {pillar.icon}
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">{pillar.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
