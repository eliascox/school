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
  Building2,
  Layers,
  ArrowRight
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

  // 4 Grand Milestone Cards (Image 2 Layout)
  const milestoneData = [
    {
      id: 'founded',
      number: toBn(counts.estd || targetEstd),
      suffix: '',
      label: 'স্থাপিত (Founded)',
      subtitle: 'ঐতিহ্যের ৫৫+ বছরের গৌরবময় ইতিহাস',
      icon: <Landmark className="w-7 h-7 text-[#F4B400]" />
    },
    {
      id: 'teachers',
      number: toBn(counts.teachers || targetTeachers),
      suffix: '+',
      label: 'শিক্ষক ও কর্মচারী',
      subtitle: 'উচ্চশিক্ষিত ও প্রশিক্ষণপ্রাপ্ত শিক্ষক পরিষদ',
      icon: <Users className="w-7 h-7 text-[#F4B400]" />
    },
    {
      id: 'students',
      number: toBn(counts.students || targetStudents),
      suffix: '+',
      label: 'নিয়মিত শিক্ষার্থী',
      subtitle: '৬ষ্ঠ থেকে ১০ম শ্রেণিতে সক্রিয় শিক্ষার্থী',
      icon: <BookOpen className="w-7 h-7 text-[#F4B400]" />
    },
    {
      id: 'passingRate',
      number: toBn(counts.passRate || passRateClean),
      suffix: '%',
      label: 'এসএসসি পাশের হার',
      subtitle: 'পাবলিক পরীক্ষায় ধারাবাহিক শতভাগ সাফল্য',
      icon: <Trophy className="w-7 h-7 text-[#F4B400]" />
    }
  ];

  // 5 Class-wise Cards (Image 1 Layout with upgraded modern glassmorphic look)
  const classData = [
    {
      id: 'ten',
      name: 'দশম শ্রেণি',
      enClass: 'Class 10',
      count: counts.ten || count10,
      icon: <GraduationCap className="w-6 h-6 text-[#F4B400]" />,
      subtitle: 'এসএসসি পরীক্ষার্থী ব্যাচ'
    },
    {
      id: 'nine',
      name: 'নবম শ্রেণি',
      enClass: 'Class 9',
      count: counts.nine || count9,
      icon: <BookOpen className="w-6 h-6 text-[#F4B400]" />,
      subtitle: 'বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা'
    },
    {
      id: 'eight',
      name: 'অষ্টম শ্রেণি',
      enClass: 'Class 8',
      count: counts.eight || count8,
      icon: <Award className="w-6 h-6 text-[#F4B400]" />,
      subtitle: 'জুনিয়র সেকেন্ডারি স্তর'
    },
    {
      id: 'seven',
      name: 'সপ্তম শ্রেণি',
      enClass: 'Class 7',
      count: counts.seven || count7,
      icon: <Sparkles className="w-6 h-6 text-[#F4B400]" />,
      subtitle: 'নতুন জাতীয় শিক্ষাক্রম ২০২৩-২৪'
    },
    {
      id: 'six',
      name: 'ষষ্ঠ শ্রেণি',
      enClass: 'Class 6',
      count: counts.six || count6,
      icon: <Users className="w-6 h-6 text-[#F4B400]" />,
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
      className="py-10 sm:py-14 text-white relative overflow-hidden border-y border-emerald-700/50 shadow-2xl"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(8, 28, 54, 0.94) 0%, rgba(6, 44, 34, 0.88) 50%, rgba(8, 28, 54, 0.96) 100%), url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=2000&q=85')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundAttachment: 'scroll'
      }}
    >
      <div id="student-info" className="absolute -top-24 left-0" />
      <div id="stats" className="absolute -top-24 left-0" />
      
      {/* Subtle Background Glow Orbs */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F4B400_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none" />
      <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full bg-[#F4B400]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -right-28 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ==============================================================
            HEADER COMPONENT (Directly matching Image 2 reference layout)
            ============================================================== */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          
          {/* Eyebrow Pill Badge: AT A GLANCE */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#F4B400]/50 bg-white/5 backdrop-blur-md shadow-sm mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F4B400] animate-ping" />
            <span className="text-xs font-en font-bold uppercase tracking-widest text-[#F4B400]">
              AT A GLANCE
            </span>
          </div>

          {/* Main Headline: School in Numbers */}
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md">
            পরিসংখ্যানে {schoolName}
          </h2>
          
          {/* English Sub-title */}
          <p className="text-xs sm:text-sm font-en font-semibold text-emerald-200/90 tracking-wide mt-1">
            Baraitali High School in Numbers
          </p>

          {/* Golden Horizontal Accent Bar (Exact replica of Image 2's gold underline) */}
          <div className="w-20 sm:w-24 h-1 bg-[#F4B400] mx-auto rounded-full mt-3.5 mb-4 shadow-sm" />

          {/* Subtitle Description */}
          <p className="text-xs sm:text-sm text-slate-200/90 max-w-xl mx-auto leading-relaxed">
            {statsConfig?.subtitle || 'ঐতিহ্যবাহী বিদ্যাপীঠের গৌরবময় অগ্রযাত্রা, শ্রেণিকক্ষ ও সামগ্রিক অর্জনের সুবিন্যস্ত খতিয়ান'}
          </p>

          {/* Dual Experience Interactive View Switcher Tabs */}
          <div className="mt-6 inline-flex items-center p-1 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-[#F4B400] to-amber-500 text-slate-950 shadow-md scale-102'
                  : 'text-white hover:text-[#F4B400] hover:bg-white/5'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>এক নজরে মূল অর্জন</span>
            </button>
            <button
              onClick={() => setActiveTab('classes')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                activeTab === 'classes'
                  ? 'bg-gradient-to-r from-[#F4B400] to-amber-500 text-slate-950 shadow-md scale-102'
                  : 'text-white hover:text-[#F4B400] hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>শ্রেণিভিত্তিক শিক্ষার্থী</span>
            </button>
          </div>
        </div>

        {/* ==============================================================
            MODE 1: 4 GRAND MILESTONE CARDS (IMAGE 2 EXACT STRUCTURE)
            ============================================================== */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 animate-fadeIn">
            {milestoneData.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white/10 hover:bg-white/15 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-white/20 hover:border-[#F4B400]/60 transition-all duration-300 shadow-xl hover:-translate-y-2 flex flex-col items-center text-center overflow-hidden"
              >
                {/* Glow Ring Highlight on Hover */}
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#F4B400]/15 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />

                {/* Circular Icon Badge at top (Image 2 style) */}
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-5 shadow-inner group-hover:scale-110 group-hover:bg-[#F4B400]/20 group-hover:border-[#F4B400]/40 transition-all duration-300">
                  {item.icon}
                </div>

                {/* Counter Number */}
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight flex items-baseline justify-center">
                  <span>{item.number}</span>
                  {item.suffix && (
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#F4B400] ml-1">
                      {item.suffix}
                    </span>
                  )}
                </div>

                {/* Primary Title Label */}
                <h3 className="text-base sm:text-lg font-bold text-white mt-3 group-hover:text-[#F4B400] transition-colors">
                  {item.label}
                </h3>

                {/* Subtitle / Description */}
                <p className="text-xs text-slate-300/80 mt-1.5 leading-relaxed font-sans">
                  {item.subtitle}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ==============================================================
            MODE 2: 5 CLASS-WISE CARDS (IMAGE 1 DATA IN MODERN GLASS UI)
            ============================================================== */}
        {activeTab === 'classes' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 animate-fadeIn">
            {classData.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white/10 hover:bg-white/15 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:border-[#F4B400]/60 transition-all duration-300 shadow-lg hover:-translate-y-1.5 flex flex-col items-center text-center"
              >
                {/* Top Circular Icon Badge */}
                <div className="w-13 h-13 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-3 shadow-inner group-hover:scale-110 group-hover:bg-[#F4B400]/20 transition-all duration-300">
                  {item.icon}
                </div>

                {/* Counter Number */}
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-baseline justify-center">
                  <span>{toBn(item.count)}</span>
                  <span className="text-lg sm:text-xl font-bold text-[#F4B400] ml-1">+</span>
                </div>

                {/* Class Name */}
                <h4 className="text-sm sm:text-base font-bold text-emerald-100 mt-2">
                  {item.name}
                </h4>

                {/* English Tag */}
                <span className="text-[10px] font-en font-semibold text-[#F4B400] tracking-wider uppercase mt-0.5">
                  {item.enClass}
                </span>

                {/* Description Subtitle */}
                <p className="text-[11px] text-slate-300/70 mt-1 line-clamp-1">
                  {item.subtitle}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ==============================================================
            BOTTOM AGGREGATION PILL & RECOGNITION BADGE
            ============================================================== */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <div className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold text-white shadow-md">
            <CheckCircle2 className="w-4 h-4 text-[#F4B400]" />
            <span>মোট শিক্ষার্থী: <strong className="text-[#F4B400] font-bold text-base">{toBn(targetStudents)}</strong> জন (ছাত্র ও ছাত্রী)</span>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/15 text-xs text-slate-300">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>শিক্ষক-শিক্ষার্থী অনুপাত: <strong>১:২৩</strong></span>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/15 text-xs text-slate-300">
            <Award className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>চট্টগ্রাম শিক্ষা বোর্ড কোড: <strong>৪১৫২</strong> | EIIN: <strong>১০৬১৮৪</strong></span>
          </div>
        </div>

      </div>
    </section>
  );
}
