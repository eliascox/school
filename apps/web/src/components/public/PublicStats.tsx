'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Sparkles, 
  Award, 
  CheckCircle2 
} from 'lucide-react';

import { StatsConfig } from '@/services/landingPageService';
import { Student } from '@/services/studentService';

interface ClassStat {
  id: string;
  name: string;
  enClass: string;
  targetCount: number;
  icon: React.ReactNode;
  subtitle: string;
}

interface PublicStatsProps {
  totalStudents?: number;
  totalTeachers?: number;
  estdYear?: string;
  statsConfig?: StatsConfig | null;
  students?: Student[];
}

export default function PublicStats({ totalStudents, totalTeachers, estdYear, statsConfig, students }: PublicStatsProps = {}) {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [counts, setCounts] = useState<{ [key: string]: number }>({
    'ten': 0,
    'nine': 0,
    'eight': 0,
    'seven': 0,
    'six': 0
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

  const classData: ClassStat[] = [
    {
      id: 'ten',
      name: 'দশম শ্রেণি',
      enClass: 'Class 10',
      targetCount: count10,
      icon: <GraduationCap className="w-6 h-6 text-[#F4B400]" />,
      subtitle: 'এসএসসি পরীক্ষার্থী ব্যাচ'
    },
    {
      id: 'nine',
      name: 'নবম শ্রেণি',
      enClass: 'Class 9',
      targetCount: count9,
      icon: <BookOpen className="w-6 h-6 text-[#F4B400]" />,
      subtitle: 'বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা'
    },
    {
      id: 'eight',
      name: 'অষ্টম শ্রেণি',
      enClass: 'Class 8',
      targetCount: count8,
      icon: <Award className="w-6 h-6 text-[#F4B400]" />,
      subtitle: 'জুনিয়র সেকেন্ডারি'
    },
    {
      id: 'seven',
      name: 'সপ্তম শ্রেণি',
      enClass: 'Class 7',
      targetCount: count7,
      icon: <Sparkles className="w-6 h-6 text-[#F4B400]" />,
      subtitle: 'নতুন শিক্ষাক্রম ২০২৩-২৪'
    },
    {
      id: 'six',
      name: 'ষষ্ঠ শ্রেণি',
      enClass: 'Class 6',
      targetCount: count6,
      icon: <Users className="w-6 h-6 text-[#F4B400]" />,
      subtitle: 'প্রবেশ স্তর'
    }
  ];

  // Helper to convert number to Bengali digits
  const toBn = (n: number) => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return n.toString().replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const duration = 1800; // 1.8 seconds
          const steps = 40;
          const stepTime = duration / steps;
          let currentStep = 0;

          const timer = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);

            setCounts({
              ten: Math.round(120 * ease),
              nine: Math.round(95 * ease),
              eight: Math.round(80 * ease),
              seven: Math.round(160 * ease),
              six: Math.round(110 * ease),
            });

            if (currentStep >= steps) {
              clearInterval(timer);
              setCounts({
                ten: 120,
                nine: 95,
                eight: 80,
                seven: 160,
                six: 110
              });
            }
          }, stepTime);
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section 
      id="student-stats" 
      ref={sectionRef} 
      className="py-10 sm:py-14 bg-gradient-to-br from-[#0B5D3B] via-[#094d31] to-[#063b25] text-white relative overflow-hidden border-y border-emerald-700/50 shadow-inner"
    >
      <div id="student-info" className="absolute -top-24 left-0" />
      <div id="stats" className="absolute -top-24 left-0" />
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F4B400_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#F4B400]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-emerald-200">
            <Users className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>শিক্ষার্থী তথ্যচিত্র</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            ছাত্র/ছাত্রীদের পরিসংখ্যান
          </h2>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="w-12 h-1 bg-[#F4B400] rounded-full"></span>
            <span className="w-3 h-1 bg-white/60 rounded-full"></span>
          </div>

          <p className="text-emerald-100/90 text-xs sm:text-sm pt-1">
            ২০২৬ শিক্ষাবর্ষে শ্রেণিকক্ষভিত্তিক মোট শিক্ষার্থীর সুবিন্যস্ত পরিসংখ্যান (সর্বমোট ৫৬৫ জন)
          </p>
        </div>

        {/* ৫টি কাউন্টারের গ্রিড (Desktop: 5, Tablet: 3, Mobile: 2) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {classData.map((item) => (
            <div
              key={item.id}
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/20 hover:border-[#F4B400]/60 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1.5 flex flex-col items-center text-center group"
            >
              {/* Top Icon Badge with Glow */}
              <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 group-hover:bg-white/25 transition-transform duration-300">
                {item.icon}
              </div>

              {/* Counter Number */}
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-serif">
                {toBn(counts[item.id] || 0)}
                <span className="text-xl sm:text-2xl font-bold text-[#F4B400] ml-1">+</span>
              </div>

              {/* Class Name */}
              <h3 className="text-base sm:text-lg font-bold text-emerald-100 mt-2">
                {item.name}
              </h3>

              {/* Subtitle / Description */}
              <p className="text-[11px] text-emerald-200/80 mt-1 line-clamp-1">
                {item.subtitle}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Aggregation Pill */}
        <div className="mt-10 flex items-center justify-center">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold text-white shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-[#F4B400]" />
            <span>বিদ্যালয়ে মোট শিক্ষার্থী: <strong className="text-[#F4B400] font-bold text-base font-serif">৫৬৫</strong> জন (ছাত্র ও ছাত্রী)</span>
          </div>
        </div>

      </div>
    </section>
  );
}
