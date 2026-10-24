'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Sparkles, 
  Award, 
  CheckCircle2,
  Landmark,
  Trophy,
  BarChart3,
  Layers
} from 'lucide-react';

import { StatsConfig } from '@/services/landingPageService';
import { Student } from '@/services/studentService';

interface PublicStatsProps {
  totalStudents?: number;
  totalTeachers?: number;
  estdYear?: string;
  statsConfig?: StatsConfig | null;
  students?: Student[];
  schoolName?: string;
}

export default function PublicStats({ 
  totalStudents, 
  totalTeachers, 
  estdYear, 
  statsConfig, 
  students,
  schoolName = 'বরইতলী উচ্চ বিদ্যালয়'
}: PublicStatsProps = {}) {
  if (statsConfig && statsConfig.enabled === false) {
    return null;
  }

  const [activeTab, setActiveTab] = useState<'overview' | 'classes'>('overview');
  const [hasAnimated, setHasAnimated] = useState(false);

  // Animated counters state
  const [counts, setCounts] = useState<{ [key: string]: number }>({
    estd: 0,
    teachers: 0,
    students: 0,
    passRate: 0,
    ten: 0,
    nine: 0,
    eight: 0,
    seven: 0,
    six: 0
  });

  const sectionRef = useRef<HTMLDivElement>(null);

  // Auto-sync real student counts if available in the database
  const realCount10 = students ? students.filter(s => (s.grade && s.grade.includes('10')) || (s.gradeBn && s.gradeBn.includes('১০')) || (s.grade && s.grade.toLowerCase().includes('ten'))).length : 0;
  const realCount9 = students ? students.filter(s => (s.grade && s.grade.includes('9')) || (s.gradeBn && s.gradeBn.includes('৯')) || (s.grade && s.grade.toLowerCase().includes('nine'))).length : 0;
  const realCount8 = students ? students.filter(s => (s.grade && s.grade.includes('8')) || (s.gradeBn && s.gradeBn.includes('৮')) || (s.grade && s.grade.toLowerCase().includes('eight'))).length : 0;
  const realCount7 = students ? students.filter(s => (s.grade && s.grade.includes('7')) || (s.gradeBn && s.gradeBn.includes('৭')) || (s.grade && s.grade.toLowerCase().includes('seven'))).length : 0;
  const realCount6 = students ? students.filter(s => (s.grade && s.grade.includes('6')) || (s.gradeBn && s.gradeBn.includes('৬')) || (s.grade && s.grade.toLowerCase().includes('six'))).length : 0;

  const count10 = realCount10 > 0 ? realCount10 : (statsConfig?.classStats?.find(s => s.id === 'stat-10' || s.className.includes('টেন') || s.className.includes('১০'))?.count ?? 120);
  const count9 = realCount9 > 0 ? realCount9 : (statsConfig?.classStats?.find(s => s.id === 'stat-9' || s.className.includes('নাইন') || s.className.includes('৯'))?.count ?? 95);
  const count8 = realCount8 > 0 ? realCount8 : (statsConfig?.classStats?.find(s => s.id === 'stat-8' || s.className.includes('এইট') || s.className.includes('৮'))?.count ?? 80);
  const count7 = realCount7 > 0 ? realCount7 : (statsConfig?.classStats?.find(s => s.id === 'stat-7' || s.className.includes('সেভেন') || s.className.includes('৭'))?.count ?? 160);
  const count6 = realCount6 > 0 ? realCount6 : (statsConfig?.classStats?.find(s => s.id === 'stat-6' || s.className.includes('সিক্স') || s.className.includes('৬'))?.count ?? 110);

  // Targets
  const targetEstd = parseInt(estdYear || '1969', 10) || 1969;
  const targetTeachers = totalTeachers && totalTeachers > 0 ? totalTeachers : (statsConfig?.totalTeachersOverride || 25);
  const targetStudents = totalStudents && totalStudents > 0 ? totalStudents : (statsConfig?.totalStudentsOverride || (count10 + count9 + count8 + count7 + count6) || 565);
  const passRateClean = parseInt(statsConfig?.passingRate?.replace(/[^0-9]/g, '') || '100', 10) || 100;

  // Helper to convert number to Bengali digits
  const toBn = (n: number | string) => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return n.toString().replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
  };

  // 4 Grand Milestone Cards (With Vibrant Modern Glassmorphism)
  const milestoneData = [
    {
      id: 'founded',
      number: toBn(counts.estd || targetEstd),
      suffix: '',
      label: 'স্থাপিত (Founded)',
      subtitle: 'ঐতিহ্যের ৫৫+ বছরের গৌরবময় ইতিহাস',
      icon: <Landmark className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'teachers',
      number: toBn(counts.teachers || targetTeachers),
      suffix: '+',
      label: 'শিক্ষক ও কর্মচারী',
      subtitle: 'উচ্চশিক্ষিত ও প্রশিক্ষণপ্রাপ্ত শিক্ষক পরিষদ',
      icon: <Users className="w-7 h-7 text-teal-600 dark:text-teal-400" />
    },
    {
      id: 'students',
      number: toBn(counts.students || targetStudents),
      suffix: '+',
      label: 'নিয়মিত শিক্ষার্থী',
      subtitle: '৬ষ্ঠ থেকে ১০ম শ্রেণিতে সক্রিয় শিক্ষার্থী',
      icon: <BookOpen className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
    },
    {
      id: 'passingRate',
      number: toBn(counts.passRate || passRateClean),
      suffix: '%',
      label: 'এসএসসি পাশের হার',
      subtitle: 'পাবলিক পরীক্ষায় ধারাবাহিক শতভাগ সাফল্য',
      icon: <Trophy className="w-7 h-7 text-amber-500 dark:text-amber-400" />
    }
  ];

  // 5 Class-wise Cards
  const classData = [
    {
      id: 'ten',
      name: 'দশম শ্রেণি',
      enClass: 'Class 10',
      count: counts.ten || count10,
      icon: <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      subtitle: 'এসএসসি পরীক্ষার্থী ব্যাচ'
    },
    {
      id: 'nine',
      name: 'নবম শ্রেণি',
      enClass: 'Class 9',
      count: counts.nine || count9,
      icon: <BookOpen className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
      subtitle: 'বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা'
    },
    {
      id: 'eight',
      name: 'অষ্টম শ্রেণি',
      enClass: 'Class 8',
      count: counts.eight || count8,
      icon: <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      subtitle: 'জুনিয়র সেকেন্ডারি স্তর'
    },
    {
      id: 'seven',
      name: 'সপ্তম শ্রেণি',
      enClass: 'Class 7',
      count: counts.seven || count7,
      icon: <Sparkles className="w-6 h-6 text-amber-500 dark:text-amber-400" />,
      subtitle: 'নতুন জাতীয় শিক্ষাক্রম'
    },
    {
      id: 'six',
      name: 'ষষ্ঠ শ্রেণি',
      enClass: 'Class 6',
      count: counts.six || count6,
      icon: <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      subtitle: 'প্রাথমিক উত্তীর্ণ প্রবেশ স্তর'
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const duration = 2000; // 2 seconds
          const steps = 45;
          const stepTime = duration / steps;
          let currentStep = 0;

          const timer = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);

            setCounts({
              estd: Math.round(targetEstd * ease),
              teachers: Math.round(targetTeachers * ease),
              students: Math.round(targetStudents * ease),
              passRate: Math.round(passRateClean * ease),
              ten: Math.round(count10 * ease),
              nine: Math.round(count9 * ease),
              eight: Math.round(count8 * ease),
              seven: Math.round(count7 * ease),
              six: Math.round(count6 * ease),
            });

            if (currentStep >= steps) {
              clearInterval(timer);
              setCounts({
                estd: targetEstd,
                teachers: targetTeachers,
                students: targetStudents,
                passRate: passRateClean,
                ten: count10,
                nine: count9,
                eight: count8,
                seven: count7,
                six: count6
              });
            }
          }, stepTime);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated, targetEstd, targetTeachers, targetStudents, passRateClean, count10, count9, count8, count7, count6]);

  return (
    <section 
      id="student-stats" 
      ref={sectionRef} 
      className="py-12 sm:py-16 text-slate-900 dark:text-white relative overflow-hidden bg-gradient-to-b from-white via-slate-50/70 to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-y border-slate-200/80 dark:border-slate-800"
    >
      <div id="student-info" className="absolute -top-24 left-0" />
      <div id="stats" className="absolute -top-24 left-0" />
      
      {/* ── Soft Ambient Background Glow Highlights ── */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-10 w-[450px] h-[450px] bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-30" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ==============================================================
            HEADER COMPONENT (Clean & Focused)
            ============================================================== */}
        <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-10 space-y-3">
          
          {/* Eyebrow Pill Badge: AT A GLANCE */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              AT A GLANCE • এক নজরে
            </span>
          </div>

          {/* Main Headline */}
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            পরিসংখ্যানে <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 dark:from-emerald-400 dark:via-teal-300 dark:to-indigo-400 bg-clip-text text-transparent">{schoolName}</span>
          </h2>

          {/* Dual Experience Interactive View Switcher Tabs */}
          <div className="pt-2">
            <div className="inline-flex items-center p-1.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700 shadow-md shadow-slate-200/50 dark:shadow-black/30">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 hover:bg-slate-100/70 dark:hover:bg-slate-700/50'
                }`}
              >
                <Landmark className="w-4 h-4" />
                <span>এক নজরে মূল অর্জন</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('classes')}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
                  activeTab === 'classes'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 hover:bg-slate-100/70 dark:hover:bg-slate-700/50'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>শ্রেণিভিত্তিক শিক্ষার্থী</span>
              </button>
            </div>
          </div>
        </div>

        {/* ==============================================================
            MODE 1: 4 GRAND MILESTONE CARDS (White Frosted Glass Effect)
            ============================================================== */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 animate-fadeIn">
            {milestoneData.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white/85 dark:bg-slate-900/85 hover:bg-white dark:hover:bg-slate-900 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-300 shadow-xl shadow-slate-200/50 dark:shadow-black/40 hover:shadow-2xl hover:shadow-emerald-600/10 hover:-translate-y-1.5 flex flex-col items-center text-center overflow-hidden ring-1 ring-slate-900/5"
              >
                {/* Soft Highlight Glow on Top Corner */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />

                {/* Circular Icon Badge at top */}
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-800/80 border border-emerald-200/80 dark:border-slate-700 flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 group-hover:shadow-md group-hover:border-emerald-500/40 transition-all duration-300">
                  {item.icon}
                </div>

                {/* Counter Number */}
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline justify-center font-mono">
                  <span>{item.number}</span>
                  {item.suffix && (
                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 ml-1">
                      {item.suffix}
                    </span>
                  )}
                </div>

                {/* Primary Title Label */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-3 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  {item.label}
                </h3>

                {/* Subtitle / Description */}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-sans">
                  {item.subtitle}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ==============================================================
            MODE 2: 5 CLASS-WISE CARDS (White Frosted Glass Effect)
            ============================================================== */}
        {activeTab === 'classes' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 animate-fadeIn">
            {classData.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white/85 dark:bg-slate-900/85 hover:bg-white dark:hover:bg-slate-900 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/50 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 flex flex-col items-center text-center ring-1 ring-slate-900/5"
              >
                {/* Top Icon Badge */}
                <div className="w-13 h-13 rounded-2xl bg-emerald-50 dark:bg-slate-800 border border-emerald-200/80 dark:border-slate-700 flex items-center justify-center mb-3 shadow-2xs group-hover:scale-110 group-hover:border-emerald-500/40 transition-all duration-300">
                  {item.icon}
                </div>

                {/* Counter Number */}
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline justify-center font-mono">
                  <span>{toBn(item.count)}</span>
                  <span className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 ml-1">+</span>
                </div>

                {/* Class Name */}
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-2">
                  {item.name}
                </h4>

                {/* English Tag */}
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase mt-0.5">
                  {item.enClass}
                </span>

                {/* Description Subtitle */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                  {item.subtitle}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ==============================================================
            BOTTOM AGGREGATION PILL & RECOGNITION BADGE (White Glass)
            ============================================================== */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <div className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>মোট শিক্ষার্থী: <strong className="text-emerald-700 dark:text-emerald-400 font-bold text-base">{toBn(targetStudents)}</strong> জন (ছাত্র ও ছাত্রী)</span>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 shadow-2xs">
            <BarChart3 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>শিক্ষক-শিক্ষার্থী অনুপাত: <strong>১:২৩</strong></span>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 shadow-2xs">
            <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>চট্টগ্রাম শিক্ষা বোর্ড কোড: <strong>৪১৫২</strong> | EIIN: <strong>১০৬১৮৪</strong></span>
          </div>
        </div>

      </div>
    </section>
  );
}