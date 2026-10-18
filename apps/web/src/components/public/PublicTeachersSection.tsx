'use client';

import React from 'react';
import { UserCheck, BookOpen, GraduationCap, Mail } from 'lucide-react';
import { TeacherAccount } from '@/services/teacherAuthService';

interface PublicTeachersSectionProps {
  teachers: TeacherAccount[];
}

export default function PublicTeachersSection({ teachers }: PublicTeachersSectionProps) {
  // Sort teachers: Headmaster/Assistant Headmaster first, then alphabetical
  const sortedTeachers = [...teachers].sort((a, b) => {
    const isHeadA = a.designation.includes('প্রধান শিক্ষক') && !a.designation.includes('সহকারী প্রধান');
    const isHeadB = b.designation.includes('প্রধান শিক্ষক') && !b.designation.includes('সহকারী প্রধান');
    if (isHeadA) return -1;
    if (isHeadB) return 1;
    return a.name.localeCompare(b.name, 'bn');
  });

  return (
    <section id="teachers" className="py-16 sm:py-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>ESTEEMED FACULTY & STAFF</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Meet Our Dedicated Educators
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            Passionate teachers committed to student intellectual growth, academic excellence, and character development.
          </p>
        </div>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedTeachers.map((teacher) => {
            const isHead = teacher.designation.includes('প্রধান শিক্ষক') && !teacher.designation.includes('সহকারী প্রধান');
            
            return (
              <div
                key={teacher.id}
                className={`rounded-2xl p-6 border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between ${
                  isHead
                    ? 'bg-gradient-to-b from-indigo-50/60 to-white dark:from-indigo-950/30 dark:to-slate-900 border-indigo-300 dark:border-indigo-700 shadow-md ring-1 ring-indigo-400/30'
                    : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80'
                }`}
              >
                <div>
                  {/* Portrait Placeholder Avatar */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-800 to-slate-900 flex items-center justify-center text-indigo-200 shadow-md border border-indigo-700/50 shrink-0">
                      <UserCheck className="w-7 h-7 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {teacher.name}
                      </h3>
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md mt-1 ${
                        isHead 
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700' 
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}>
                        {teacher.designation}
                      </span>
                    </div>
                  </div>

                  {/* Details (Strictly Public Fields Only) */}
                  <div className="space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>Subject: <strong>{teacher.subject || 'General Studies'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Degree: {teacher.qualification || 'B.A / B.Sc / M.A'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer info: Institutional email */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{teacher.email || `${teacher.id.toLowerCase()}@baraitolihs.edu.bd`}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
