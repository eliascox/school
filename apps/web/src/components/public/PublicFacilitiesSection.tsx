'use client';

import React from 'react';
import { 
  Monitor, 
  FlaskConical, 
  BookOpen, 
  Trophy, 
  Compass, 
  Droplet,
  Sparkles
} from 'lucide-react';

export default function PublicFacilitiesSection() {
  const facilities = [
    {
      title: 'Sheikh Russel Digital Lab',
      desc: 'High-speed internet and modern computer systems where students master ICT, digital literacy, and programming basics.',
      icon: <Monitor className="w-6 h-6 text-indigo-500" />
    },
    {
      title: 'Science Laboratories',
      desc: 'Fully equipped hands-on experimental laboratories for Physics, Chemistry, and Biology practical education.',
      icon: <FlaskConical className="w-6 h-6 text-emerald-500" />
    },
    {
      title: 'Central Library & Reading Room',
      desc: 'Thousands of reference books, literature, encyclopedias, and newspapers fostering lifelong reading habits.',
      icon: <BookOpen className="w-6 h-6 text-amber-500" />
    },
    {
      title: 'Expansive Sports Ground',
      desc: 'Full-sized outdoor playground for football, cricket, and athletics tournaments in a peaceful natural setting.',
      icon: <Trophy className="w-6 h-6 text-rose-500" />
    },
    {
      title: 'Scouting & Co-Curricular',
      desc: 'Active Scouts and Girls Guide troops building leadership, social discipline, and national service mindsets.',
      icon: <Compass className="w-6 h-6 text-cyan-500" />
    },
    {
      title: 'Purified Water & Hygiene',
      desc: 'Modern deep-filter drinking water stations and dedicated hygienic sanitation blocks for boys and girls.',
      icon: <Droplet className="w-6 h-6 text-blue-500" />
    }
  ];

  return (
    <section id="facilities" className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CAMPUS INFRASTRUCTURE & AMENITIES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Modern Facilities for Holistic Growth
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            Thoughtfully planned campus infrastructure ensuring healthy, engaging, and innovative academic experiences.
          </p>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((fac, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
            >
              <div className="p-3 w-fit rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-4">
                {fac.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{fac.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{fac.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
