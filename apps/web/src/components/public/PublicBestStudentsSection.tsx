'use client';

import React, { useState } from 'react';
import { 
  Trophy, 
  Star, 
  Award, 
  ArrowRight, 
  X, 
  GraduationCap, 
  Calendar, 
  CheckCircle2, 
  BookOpen 
} from 'lucide-react';

import { AchieversConfig } from '@/services/landingPageService';
import { Student } from '@/services/studentService';

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

export default function PublicBestStudentsSection({ achieversConfig, students }: PublicBestStudentsSectionProps = {}) {
  if (achieversConfig && achieversConfig.enabled === false) {
    return null;
  }

  // 4 Best Students matching user requirements
  const defaultBestStudents: BestStudent[] = [
    {
      id: 'STD-01',
      name: 'তানজিলা আক্তার',
      class: '১০ম শ্রেণি (বিজ্ঞান)',
      roll: '০১',
      year: '২০২৬',
      photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop',
      badgeType: 'trophy',
      achievement: '১ম স্থান ও বিজ্ঞান অলিম্পিয়াড চ্যাম্পিয়ন',
      gpa: 'জিপিএ ৫.০০',
      quote: 'নিয়মিত অধ্যাবসায় ও শিক্ষকদের সঠিক দিকনির্দেশনাই পরীক্ষায় ভালো ফলাফলের মূল চাবিকাঠি।'
    },
    {
      id: 'STD-02',
      name: 'আহমেদ সাদিক',
      class: '৯ম শ্রেণি (বিজ্ঞান)',
      roll: '০১',
      year: '২০২৬',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
      badgeType: 'star',
      achievement: 'মেধাতালিকায় শীর্ষ ও বিতর্ক দলনেতা',
      gpa: 'জিপিএ ৫.০০',
      quote: 'পাঠ্যবইয়ের পাশাপাশি সাধারণ জ্ঞান ও সহশিক্ষা কার্যক্রমে যুক্ত থাকলে মেধা আরও শাণিত হয়।'
    },
    {
      id: 'STD-03',
      name: 'সামিয়া জাহান নিশি',
      class: '৮ম শ্রেণি',
      roll: '০১',
      year: '২০২৬',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
      badgeType: 'trophy',
      achievement: 'ট্যালেন্টপুল বৃত্তি ও গণিত উৎসব বিজয়ী',
      gpa: 'জিপিএ ৫.০০',
      quote: 'প্রতিদিনের পড়া প্রতিদিন শেষ করা এবং কোনো বিষয়ে দ্বিধা থাকলে শিক্ষকদের কাছে বুঝে নেওয়া জরুরি।'
    },
    {
      id: 'STD-04',
      name: 'রাকিবুল ইসলাম শাওন',
      class: '৭ম শ্রেণি',
      roll: '০১',
      year: '২০২৬',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
      badgeType: 'star',
      achievement: 'বার্ষিক মূল্যায়ন পরীক্ষায় ১ম স্থান',
      gpa: 'জিপিএ ৫.০০',
      quote: 'স্কুলের সুন্দর ও সুশৃঙ্খল পরিবেশ আমাকে আরও বেশি মনোযোগী হতে উৎসাহিত করে।'
    }
  ];

  // Auto-sync best students from live student database if available
  const autoSyncedStudents: BestStudent[] = (students && students.length > 0)
    ? [...students]
        .filter(s => parseFloat(s.gpa || '0') >= 4.5 || s.roll === '1' || s.roll === '01')
        .slice(0, 4)
        .map((st, i) => ({
          id: st.id,
          name: st.name,
          class: st.gradeBn || `${st.grade} শ্রেণি`,
          roll: st.roll,
          year: st.session || '২০২৬',
          photo: st.photo || (i % 2 === 0 ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop'),
          badgeType: (i === 0 ? 'trophy' : 'star') as 'trophy' | 'star',
          achievement: st.gpa === '5.00' ? '🏆 গোল্ডেন জিপিএ ৫.০০' : `মেধাবী স্থান #${st.roll}`,
          gpa: st.gpa ? `জিপিএ ${st.gpa}` : 'জিপিএ ৫.০০',
          quote: 'নিয়মিত অধ্যাবসায় ও শিক্ষকদের সঠিক দিকনির্দেশনাই পরীক্ষায় ভালো ফলাফলের মূল চাবিকাঠি।'
        }))
    : [];

  const configuredAchievers = achieversConfig?.students?.filter(s => s.visible !== false);
  const bestStudents: BestStudent[] = (configuredAchievers && configuredAchievers.length > 0)
    ? configuredAchievers.map((st, i) => ({
        id: st.id,
        name: st.name,
        class: st.class,
        roll: st.roll,
        year: st.year,
        photo: st.photo || (i % 2 === 0 ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop'),
        badgeType: (i % 2 === 0 ? 'trophy' : 'star') as 'trophy' | 'star',
        achievement: st.awardBadge || 'কৃতী শিক্ষার্থী',
        gpa: st.gpa ? (st.gpa.startsWith('জিপিএ') ? st.gpa : `জিপিএ ${st.gpa}`) : 'জিপিএ ৫.০০',
        quote: 'নিয়মিত অধ্যাবসায় ও শিক্ষকদের সঠিক দিকনির্দেশনাই পরীক্ষায় ভালো ফলাফলের মূল চাবিকাঠি।'
      }))
    : (autoSyncedStudents.length > 0 ? autoSyncedStudents : defaultBestStudents);

  const sectionTitle = achieversConfig?.title || 'সেরা ছাত্র/ছাত্রী';
  const sectionSubtitle = achieversConfig?.subtitle || 'বোর্ড পরীক্ষা ও মেধা অন্বেষণে শীর্ষস্থান অর্জনকারী আমাদের গর্বিত শিক্ষার্থীদের একাংশ';

  const [selectedStudent, setSelectedStudent] = useState<BestStudent | null>(null);
  const [showAllModal, setShowAllModal] = useState<boolean>(false);

  return (
    <section id="best-students" className="py-10 sm:py-14 bg-[#F5F7FA] dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ===================================================================
            সেকশন হেডার
            =================================================================== */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 text-[#0B5D3B] bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>মেধা ও গৌরব</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {sectionTitle}
          </h2>

          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="w-14 h-1.5 bg-[#0B5D3B] rounded-full"></span>
            <span className="w-3.5 h-1.5 bg-[#F4B400] rounded-full"></span>
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed pt-1">
            {sectionSubtitle}
          </p>
        </div>

        {/* ===================================================================
            ৪টি কার্ডের গ্রিড (Desktop: 4, Tablet: 2, Mobile: 1)
            =================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {bestStudents.map((student) => (
            <div
              key={student.id}
              className="group bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* গোল ছবি ও ট্রফি/স্টার ব্যাজ */}
                <div className="flex justify-center mb-5">
                  <div className="relative">
                    {/* গোল ছবি */}
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#0B5D3B]/20 group-hover:border-[#0B5D3B] shadow-md transition-colors duration-300 p-0.5 bg-white">
                      <img
                        src={student.photo}
                        alt={student.name}
                        className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>

                    {/* ছবির ওপর ট্রফি/স্টার ব্যাজ */}
                    <div className="absolute top-0 right-0 w-8 h-8 rounded-full bg-[#F4B400] text-slate-900 flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800 animate-bounce">
                      {student.badgeType === 'trophy' ? (
                        <Trophy className="w-4 h-4 fill-slate-900 text-slate-900" />
                      ) : (
                        <Star className="w-4 h-4 fill-slate-900 text-slate-900" />
                      )}
                    </div>
                  </div>
                </div>

                {/* নাম ও ক্লাস */}
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition-colors">
                    {student.name}
                  </h3>
                  
                  <p className="text-xs font-semibold text-[#0B5D3B] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 inline-block px-3 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {student.class}
                  </p>
                </div>

                {/* রোল নং, সাল ও জিপিএ */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-700/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">রোল নং:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{student.roll}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">শিক্ষাবর্ষ (সাল):</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{student.year}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">ফলাফল:</span>
                    <span className="font-bold text-[#0B5D3B] dark:text-emerald-400">{student.gpa}</span>
                  </div>
                </div>

                {/* অর্জন ট্যাগ */}
                <div className="mt-3.5 p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-300 font-medium text-center line-clamp-1">
                  ★ {student.achievement}
                </div>
              </div>

              {/* কার্ড ফুটার বাটন */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(student)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-[#0B5D3B] bg-emerald-50 hover:bg-[#0B5D3B] hover:text-white transition-all duration-200 shadow-2xs"
                >
                  <span>কৃতিত্বের বিবরণ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ===================================================================
            নিচে "আরো দেখুন" বাটন
            =================================================================== */}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => setShowAllModal(true)}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#0B5D3B] hover:bg-[#08492e] text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group active:scale-95 border-2 border-transparent hover:border-[#F4B400]"
          >
            <Trophy className="w-5 h-5 text-[#F4B400]" />
            <span>আরো দেখুন</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>

      {/* ===================================================================
          শিক্ষার্থীর কৃতিত্ব মোডাল (STUDENT PROFILE MODAL)
          =================================================================== */}
      {selectedStudent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0B5D3B] via-[#F4B400] to-[#0B5D3B]" />

            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              aria-label="বন্ধ করুন"
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="relative mb-3">
                <img
                  src={selectedStudent.photo}
                  alt={selectedStudent.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#0B5D3B] shadow-md"
                />
                <div className="absolute top-0 right-0 w-7 h-7 rounded-full bg-[#F4B400] flex items-center justify-center shadow-md">
                  <Trophy className="w-3.5 h-3.5 text-slate-900" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {selectedStudent.name}
              </h3>
              <p className="text-xs text-[#0B5D3B] dark:text-emerald-400 font-semibold mt-0.5">
                {selectedStudent.class} • রোল: {selectedStudent.roll}
              </p>
            </div>

            <div className="mt-5 space-y-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">শিক্ষাবর্ষ:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedStudent.year} খ্রিঃ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">ফলাফল:</span>
                <span className="font-bold text-[#0B5D3B] dark:text-emerald-400">{selectedStudent.gpa}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">বিশেষ অর্জন:</span>
                <span className="font-semibold text-amber-700 dark:text-amber-300">{selectedStudent.achievement}</span>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
              &ldquo;{selectedStudent.quote}&rdquo;
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          সকল সেরা শিক্ষার্থীদের মেধা তালিকা মোডাল (ALL ACHIEVERS MODAL)
          =================================================================== */}
      {showAllModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 sm:p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    সকল কৃতী ও সেরা ছাত্র/ছাত্রীদের তালিকা
                  </h3>
                  <p className="text-xs text-slate-500">বার্ষিক পরীক্ষা ও মেধা তালিকায় উত্তীর্ণ শিক্ষার্থীদের তালিকা</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-3 flex-1">
              {bestStudents.concat(bestStudents).map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img src={s.photo} alt={s.name} className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{s.name}</h4>
                      <p className="text-xs text-[#0B5D3B] dark:text-emerald-400 font-semibold">{s.class} (রোল: {s.roll})</p>
                      <p className="text-[11px] text-slate-500">{s.achievement}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800">
                    {s.gpa}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
