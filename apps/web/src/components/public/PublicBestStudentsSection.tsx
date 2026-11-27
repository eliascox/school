'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Star, ArrowRight, X } from 'lucide-react';
import { AchieversConfig } from '@/services/landingPageService';
import { Student } from '@/services/studentService';
import InitialsAvatar from './InitialsAvatar';

interface BestStudent {
  id: string;
  name: string;
  class: string;
  roll: string;
  year: string;
  photo: string;
  badgeType: 'trophy' | 'star';
  achievement: string;
  gpa: string;
  quote: string;
}

interface PublicBestStudentsSectionProps {
  achieversConfig?: AchieversConfig | null;
  students?: Student[];
}

export default function PublicBestStudentsSection({
  achieversConfig,
  students,
}: PublicBestStudentsSectionProps = {}) {
  const [selectedStudent, setSelectedStudent] = useState<BestStudent | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    if (!selectedStudent && !showAllModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedStudent(null);
        setShowAllModal(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedStudent, showAllModal]);

  if (achieversConfig && achieversConfig.enabled === false) {
    return null;
  }

  const defaultBestStudents: BestStudent[] = [
    {
      id: 'STD-01',
      name: 'তানজিলা আক্তার',
      class: '১০ম শ্রেণি (বিজ্ঞান)',
      roll: '০১',
      year: '২০২৬',
      photo: '',
      badgeType: 'trophy',
      achievement: '১ম স্থান ও বিজ্ঞান অলিম্পিয়াড চ্যাম্পিয়ন',
      gpa: 'জিপিএ ৫.০০',
      quote: 'নিয়মিত অধ্যাবসায় ও শিক্ষকদের সঠিক দিকনির্দেশনাই পরীক্ষায় ভালো ফলাফলের মূল চাবিকাঠি।',
    },
    {
      id: 'STD-02',
      name: 'আহমেদ সাদিক',
      class: '৯ম শ্রেণি (বিজ্ঞান)',
      roll: '০১',
      year: '২০২৬',
      photo: '',
      badgeType: 'star',
      achievement: 'মেধাতালিকায় শীর্ষ ও বিতর্ক দলনেতা',
      gpa: 'জিপিএ ৫.০০',
      quote: 'পাঠ্যবইয়ের পাশাপাশি সাধারণ জ্ঞান ও সহশিক্ষা কার্যক্রমে যুক্ত থাকলে মেধা আরও শাণিত হয়।',
    },
    {
      id: 'STD-03',
      name: 'সামিয়া জাহান নিশি',
      class: '৮ম শ্রেণি',
      roll: '০১',
      year: '২০২৬',
      photo: '',
      badgeType: 'trophy',
      achievement: 'ট্যালেন্টপুল বৃত্তি ও গণিত উৎসব বিজয়ী',
      gpa: 'জিপিএ ৫.০০',
      quote: 'প্রতিদিনের পড়া প্রতিদিন শেষ করা এবং কোনো বিষয়ে দ্বিধা থাকলে শিক্ষকদের কাছে বুঝে নেওয়া জরুরি।',
    },
    {
      id: 'STD-04',
      name: 'রাকিবুল ইসলাম শাওন',
      class: '৭ম শ্রেণি',
      roll: '০১',
      year: '২০২৬',
      photo: '',
      badgeType: 'star',
      achievement: 'বার্ষিক মূল্যায়ন পরীক্ষায় ১ম স্থান',
      gpa: 'জিপিএ ৫.০০',
      quote: 'স্কুলের সুন্দর ও সুশৃঙ্খল পরিবেশ আমাকে আরও বেশি মনোযোগী হতে উৎসাহিত করে।',
    },
  ];

  const autoSyncedStudents: BestStudent[] =
    students && students.length > 0
      ? [...students]
          .filter((s) => parseFloat(s.gpa || '0') >= 4.5 || s.roll === '1' || s.roll === '01')
          .slice(0, 8)
          .map((st, i) => ({
            id: st.id,
            name: st.name,
            class: st.gradeBn || `${st.grade} শ্রেণি`,
            roll: st.roll,
            year: st.session || '২০২৬',
            photo: st.photo || '',
            badgeType: (i % 2 === 0 ? 'trophy' : 'star') as 'trophy' | 'star',
            achievement: st.gpa === '5.00' ? 'গোল্ডেন জিপিএ ৫.০০' : `মেধাবী স্থান #${st.roll}`,
            gpa: st.gpa ? `জিপিএ ${st.gpa}` : 'জিপিএ ৫.০০',
            quote: 'নিয়মিত অধ্যাবসায় ও শিক্ষকদের সঠিক দিকনির্দেশনাই পরীক্ষায় ভালো ফলাফলের মূল চাবিকাঠি।',
          }))
      : [];

  const configuredAchievers = achieversConfig?.students?.filter((s) => s.visible !== false);
  const bestStudents: BestStudent[] =
    configuredAchievers && configuredAchievers.length > 0
      ? configuredAchievers.map((st, i) => ({
          id: st.id,
          name: st.name,
          class: st.class,
          roll: st.roll,
          year: st.year,
          photo: st.photo || '',
          badgeType: (i % 2 === 0 ? 'trophy' : 'star') as 'trophy' | 'star',
          achievement: st.awardBadge || 'কৃতী শিক্ষার্থী',
          gpa: st.gpa ? (st.gpa.startsWith('জিপিএ') ? st.gpa : `জিপিএ ${st.gpa}`) : 'জিপিএ ৫.০০',
          quote: 'নিয়মিত অধ্যাবসায় ও শিক্ষকদের সঠিক দিকনির্দেশনাই পরীক্ষায় ভালো ফলাফলের মূল চাবিকাঠি।',
        }))
      : autoSyncedStudents.length > 0
      ? autoSyncedStudents
      : defaultBestStudents;

  const sectionTitle = achieversConfig?.title || 'সেরা ছাত্র/ছাত্রী';
  const sectionSubtitle =
    achieversConfig?.subtitle ||
    'বোর্ড পরীক্ষা ও মেধা অন্বেষণে শীর্ষস্থান অর্জনকারী আমাদের গর্বিত শিক্ষার্থীদের একাংশ';

  return (
    <section
      id="best-students"
      className="py-12 sm:py-16 bg-[#F8FAFC] dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-2.5 mb-9 sm:mb-12">
          <div className="inline-flex items-center gap-2 text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
            <Trophy className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>মেধা ও গৌরব</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {sectionTitle}
          </h2>

          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="w-14 h-1.5 bg-[#0B5D3B] rounded-full" />
            <span className="w-3.5 h-1.5 bg-[#F4B400] rounded-full" />
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed pt-1">
            {sectionSubtitle}
          </p>
        </div>

        {/* Top 4 Achiever Cards (Calm Modern Metallic Badge — no jittery bounce) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {bestStudents.slice(0, 4).map((student) => (
            <div
              key={student.id}
              className="group bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-400/70 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <InitialsAvatar
                      src={student.photo}
                      name={student.name}
                      className="w-24 h-24 rounded-full border-4 border-emerald-100 dark:border-emerald-900/60 group-hover:border-[#0B5D3B] shadow-md transition-all duration-300 group-hover:scale-105"
                      textClassName="text-3xl"
                    />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-[#F4B400] to-amber-500 text-slate-950 flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
                      {student.badgeType === 'trophy' ? (
                        <Trophy className="w-3.5 h-3.5" />
                      ) : (
                        <Star className="w-3.5 h-3.5 fill-slate-950" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition-colors">
                    {student.name}
                  </h3>
                  <p className="text-xs font-bold text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 inline-block px-3 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {student.class}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">রোল নং:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{student.roll}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">শিক্ষাবর্ষ:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{student.year}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">ফলাফল:</span>
                    <span className="font-extrabold text-[#0B5D3B] dark:text-emerald-400">{student.gpa}</span>
                  </div>
                </div>

                <div className="mt-3 p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-300 font-semibold text-center line-clamp-1">
                  {student.achievement}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(student)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-[#0B5D3B] hover:text-white border border-emerald-200/80 dark:border-emerald-800/60 transition-all cursor-pointer"
                >
                  <span>কৃতিত্বের বিবরণ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setShowAllModal(true)}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#0B5D3B] hover:bg-[#08492e] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-[#F4B400]" />
            <span>সকল কৃতী শিক্ষার্থী ({bestStudents.length} জন)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B5D3B] via-[#F4B400] to-[#0B5D3B]" />

            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              aria-label="বন্ধ করুন"
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <InitialsAvatar
                src={selectedStudent.photo}
                name={selectedStudent.name}
                className="w-22 h-22 rounded-full border-4 border-[#0B5D3B] shadow-md mb-3"
                textClassName="text-3xl"
              />
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {selectedStudent.name}
              </h3>
              <p className="text-xs text-[#0B5D3B] dark:text-emerald-400 font-bold mt-0.5">
                {selectedStudent.class} • রোল: {selectedStudent.roll}
              </p>
            </div>

            <div className="mt-5 space-y-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">শিক্ষাবর্ষ:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedStudent.year}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">ফলাফল:</span>
                <span className="font-extrabold text-[#0B5D3B] dark:text-emerald-400">{selectedStudent.gpa}</span>
              </div>
              <div className="flex justify-between py-1 gap-3">
                <span className="text-slate-500 shrink-0">বিশেষ অর্জন:</span>
                <span className="font-semibold text-amber-700 dark:text-amber-300 text-right">
                  {selectedStudent.achievement}
                </span>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
              “{selectedStudent.quote}”
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Achievers Modal (Deduplicated — No Duplicate Entries!) */}
      {showAllModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 flex items-center justify-center text-amber-600 border border-amber-200 dark:border-amber-800">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    সকল কৃতী ও সেরা ছাত্র/ছাত্রীদের তালিকা
                  </h3>
                  <p className="text-xs text-slate-500">মেধা তালিকায় উত্তীর্ণ গর্বিত শিক্ষার্থীবৃন্দ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                aria-label="বন্ধ করুন"
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-2.5 flex-1">
              {bestStudents.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setShowAllModal(false);
                    setSelectedStudent(s);
                  }}
                  className="w-full text-left flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <InitialsAvatar
                      src={s.photo}
                      name={s.name}
                      className="w-11 h-11 rounded-full border-2 border-[#0B5D3B] shrink-0"
                      textClassName="text-sm"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {s.name}
                      </h4>
                      <p className="text-xs text-[#0B5D3B] dark:text-emerald-400 font-bold truncate">
                        {s.class} (রোল: {s.roll})
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{s.achievement}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                    {s.gpa}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
