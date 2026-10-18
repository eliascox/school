'use client';

import React from 'react';
import { BookOpen, CheckCircle2 } from 'lucide-react';

export default function PublicAcademicSection() {
  const academicPrograms = [
    {
      grade: 'Class 6 & 7 (Foundation Stage)',
      focus: 'Competency-based experiential learning as per National Curriculum guidelines',
      features: ['Creative skill development', 'Introductory ICT & General Science', 'Moral ethics and physical fitness']
    },
    {
      grade: 'Class 8 (Junior Secondary)',
      focus: 'Strengthening analytical foundations in preparation for stream selection',
      features: ['Special care in Mathematics & English', 'Applied computer literacy', 'Continuous formative evaluation']
    },
    {
      grade: 'Class 9 & 10 (Secondary SSC Track)',
      focus: 'Specialized academic streams across Science, Humanities, and Business Studies',
      features: ['Hands-on science laboratories', 'Targeted SSC board exam preparation', 'Rigorous model tests & feedback']
    }
  ];

  const streams = [
    {
      name: 'Science Department (বিজ্ঞান বিভাগ)',
      desc: 'Physics, Chemistry, Biology, Higher Mathematics, and ICT with state-of-the-art laboratory experimentation.'
    },
    {
      name: 'Humanities Department (মানবিক বিভাগ)',
      desc: 'History, Civics, Geography, Economics, and Social Sciences cultivating deep civic and humanitarian values.'
    },
    {
      name: 'Business Studies (ব্যবসায় শিক্ষা বিভাগ)',
      desc: 'Accounting, Finance, Business Entrepreneurship, and Marketing preparing students for commercial leadership.'
    }
  ];

  return (
    <section id="academic" className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
            <BookOpen className="w-3.5 h-3.5" />
            <span>ACADEMIC EXCELLENCE & CURRICULUM</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Academic Programs & Stream Divisions
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            Curriculum authorized by the National Curriculum and Textbook Board (NCTB) and Board of Intermediate and Secondary Education (BISE) Chattogram.
          </p>
        </div>

        {/* Classes Level Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {academicPrograms.map((prog, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold mb-3">
                  {prog.grade}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                  {prog.focus}
                </h3>
                <ul className="space-y-2 mt-4">
                  {prog.features.map((f, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* High School Streams (Science/Arts/Commerce) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-md">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            Specialized Departments for Classes 9 & 10 (SSC Level)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {streams.map((stream, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                <div className="font-bold text-slate-900 dark:text-white text-base mb-2">{stream.name}</div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{stream.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
