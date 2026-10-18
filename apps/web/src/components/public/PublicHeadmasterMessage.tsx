'use client';

import React from 'react';
import { UserCheck, Award, Quote, CheckCircle } from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';

interface PublicHeadmasterMessageProps {
  settings: SchoolSettings | null;
}

export default function PublicHeadmasterMessage({ settings }: PublicHeadmasterMessageProps) {
  const principalName = settings?.principalName || 'মোহাম্মদ রফিকুল ইসলাম';
  const principalTitle = settings?.principalTitle || 'প্রধান শিক্ষক (Headmaster)';
  const schoolName = settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';

  return (
    <section id="principal" className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Portrait & Title Card */}
            <div className="lg:col-span-4 text-center">
              <div className="relative inline-block mx-auto">
                <div className="w-48 h-56 sm:w-56 sm:h-64 rounded-2xl bg-gradient-to-b from-indigo-950 to-slate-900 p-1.5 shadow-xl border border-indigo-700/50">
                  <div className="w-full h-full rounded-xl bg-slate-800 flex flex-col items-center justify-center text-white relative overflow-hidden">
                    <UserCheck className="w-24 h-24 text-indigo-300 mb-2 opacity-80" />
                    <span className="text-xs text-indigo-200 font-semibold px-3 py-1 bg-indigo-950/80 rounded-full border border-indigo-700/50">
                      Headmaster & Administrator
                    </span>
                  </div>
                </div>
                {/* Decorative Badge */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 px-4 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 whitespace-nowrap">
                  <Award className="w-3.5 h-3.5" />
                  <span>Executive Leadership</span>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{principalName}</h3>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">{principalTitle}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{schoolName}</p>
              </div>
            </div>

            {/* Right Column: Headmaster's Speech */}
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                <Quote className="w-3.5 h-3.5" />
                <span>PRINCIPAL'S MESSAGE</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                "Nurturing Enlightened Minds & Moral Leadership"
              </h2>

              <div className="space-y-4 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                <p>
                  বিসমিল্লাহির রাহমানির রাহিম। ঐতিহ্যবাহী <strong>{schoolName}</strong>-এর সকল শিক্ষার্থী, সম্মানিত অভিভাবক ও শুভানুধ্যায়ীদের জানাই আন্তরিক শুভেচ্ছা ও অভিনন্দন।
                </p>
                <p>
                  To thrive in the 21st century, education must combine academic rigor with ethical integrity, technological competence, and civic responsibility. Our institution is dedicated to unlocking the unique potential of each student through modern pedagogy, well-equipped ICT labs, and vibrant co-curricular programs.
                </p>
                <p>
                  Our digital school management platform represents our commitment to transparency, academic excellence, and seamless communication between educators and families. Together, we continue to uphold our proud legacy of academic achievement.
                </p>
              </div>

              {/* Core Commitments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Rigorous Classroom Teaching & Mentorship</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Digital Assessment & Automated Results</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Character Building & Moral Discipline</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Continuous Digital Guardian Engagement</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
