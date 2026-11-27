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
  Layers,
} from 'lucide-react';
import { StatsConfig } from '@/services/landingPageService';
import { Student } from '@/services/studentService';
import { SchoolSettings } from '@/services/settingsService';
import { toBanglaDigits } from '@/lib/resultPortalUtils';

interface PublicStatsProps {
  totalStudents?: number;
  totalTeachers?: number;
  estdYear?: string;
  statsConfig?: StatsConfig | null;
  students?: Student[];
  schoolName?: string;
  settings?: SchoolSettings | null;
  schoolCode?: string;
}

export default function PublicStats({
  totalStudents,
  totalTeachers,
  estdYear,
  statsConfig,
  students,
  schoolName = 'বরইতলী উচ্চ বিদ্যালয়',
  settings,
  schoolCode = '৩২০১',
}: PublicStatsProps = {}) {
  const isDisabled = Boolean(statsConfig && statsConfig.enabled === false);

  const [activeTab, setActiveTab] = useState<'overview' | 'classes'>('overview');
  const [animatedCounts, setAnimatedCounts] = useState<Record<string, number> | null>(null);

  const sectionRef = useRef<HTMLDivElement>(null);
  const hasStartedAnimRef = useRef(false);

  const realCount10 = students
    ? students.filter(
        (s) =>
          (s.grade && s.grade.includes('10')) ||
          (s.gradeBn && s.gradeBn.includes('১০')) ||
          (s.grade && s.grade.toLowerCase().includes('ten'))
      ).length
    : 0;
  const realCount9 = students
    ? students.filter(
        (s) =>
          (s.grade && s.grade.includes('9')) ||
          (s.gradeBn && s.gradeBn.includes('৯')) ||
          (s.grade && s.grade.toLowerCase().includes('nine'))
      ).length
    : 0;
  const realCount8 = students
    ? students.filter(
        (s) =>
          (s.grade && s.grade.includes('8')) ||
          (s.gradeBn && s.gradeBn.includes('৮')) ||
          (s.grade && s.grade.toLowerCase().includes('eight'))
      ).length
    : 0;
  const realCount7 = students
    ? students.filter(
        (s) =>
          (s.grade && s.grade.includes('7')) ||
          (s.gradeBn && s.gradeBn.includes('৭')) ||
          (s.grade && s.grade.toLowerCase().includes('seven'))
      ).length
    : 0;
  const realCount6 = students
    ? students.filter(
        (s) =>
          (s.grade && s.grade.includes('6')) ||
          (s.gradeBn && s.gradeBn.includes('৬')) ||
          (s.grade && s.grade.toLowerCase().includes('six'))
      ).length
    : 0;

  const count10 =
    realCount10 > 0
      ? realCount10
      : statsConfig?.classStats?.find(
          (s) => s.id === 'stat-10' || s.className.includes('দশম') || s.className.includes('১০')
        )?.count ?? 120;
  const count9 =
    realCount9 > 0
      ? realCount9
      : statsConfig?.classStats?.find(
          (s) => s.id === 'stat-9' || s.className.includes('নবম') || s.className.includes('৯')
        )?.count ?? 95;
  const count8 =
    realCount8 > 0
      ? realCount8
      : statsConfig?.classStats?.find(
          (s) => s.id === 'stat-8' || s.className.includes('অষ্টম') || s.className.includes('৮')
        )?.count ?? 80;
  const count7 =
    realCount7 > 0
      ? realCount7
      : statsConfig?.classStats?.find(
          (s) => s.id === 'stat-7' || s.className.includes('সপ্তম') || s.className.includes('৭')
        )?.count ?? 160;
  const count6 =
    realCount6 > 0
      ? realCount6
      : statsConfig?.classStats?.find(
          (s) => s.id === 'stat-6' || s.className.includes('ষষ্ঠ') || s.className.includes('৬')
        )?.count ?? 110;

  const targetEstd = parseInt(String(estdYear || settings?.estdYear || '1969').replace(/\D/g, ''), 10) || 1969;
  const targetTeachers =
    totalTeachers && totalTeachers > 0
      ? totalTeachers
      : statsConfig?.totalTeachersOverride || 25;
  const targetStudents =
    totalStudents && totalStudents > 0
      ? totalStudents
      : statsConfig?.totalStudentsOverride || count10 + count9 + count8 + count7 + count6 || 565;
  const passRateClean =
    parseInt((statsConfig?.passingRate || '100').replace(/[^0-9]/g, ''), 10) || 100;

  const targetsRef = useRef({
    estd: targetEstd,
    teachers: targetTeachers,
    students: targetStudents,
    passRate: passRateClean,
    ten: count10,
    nine: count9,
    eight: count8,
    seven: count7,
    six: count6,
  });

  // Keep ref synced inside effect (satisfies react-hooks/refs rule)
  useEffect(() => {
    targetsRef.current = {
      estd: targetEstd,
      teachers: targetTeachers,
      students: targetStudents,
      passRate: passRateClean,
      ten: count10,
      nine: count9,
      eight: count8,
      seven: count7,
      six: count6,
    };
    if (hasStartedAnimRef.current) {
      setAnimatedCounts({ ...targetsRef.current });
    }
  }, [targetEstd, targetTeachers, targetStudents, passRateClean, count10, count9, count8, count7, count6]);

  // Safe IntersectionObserver animation using ref (never cancels rAF on first frame!)
  useEffect(() => {
    if (isDisabled || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAnimatedCounts({ ...targetsRef.current });
      return;
    }

    let rafId = 0;

    const runAnimation = () => {
      if (hasStartedAnimRef.current) return;
      hasStartedAnimRef.current = true;

      const duration = 1200;
      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const t = targetsRef.current;

        setAnimatedCounts({
          estd: Math.round(t.estd * ease),
          teachers: Math.round(t.teachers * ease),
          students: Math.round(t.students * ease),
          passRate: Math.round(t.passRate * ease),
          ten: Math.round(t.ten * ease),
          nine: Math.round(t.nine * ease),
          eight: Math.round(t.eight * ease),
          seven: Math.round(t.seven * ease),
          six: Math.round(t.six * ease),
        });

        if (progress < 1) {
          rafId = window.requestAnimationFrame(tick);
        }
      };

      rafId = window.requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          runAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [isDisabled]);

  if (isDisabled) return null;

  const displayEstd = animatedCounts ? animatedCounts.estd : targetEstd;
  const displayTeachers = animatedCounts ? animatedCounts.teachers : targetTeachers;
  const displayStudents = animatedCounts ? animatedCounts.students : targetStudents;
  const displayPassRate = animatedCounts ? animatedCounts.passRate : passRateClean;
  const studentTeacherRatio = Math.max(1, Math.round(targetStudents / Math.max(1, targetTeachers)));
  const eiinDisplay = toBanglaDigits(settings?.eiin?.trim() || '106184');

  const milestoneData = [
    {
      id: 'founded',
      number: toBanglaDigits(displayEstd),
      suffix: '',
      label: 'স্থাপিত (Founded)',
      subtitle: 'ঐতিহ্যের ৫৫+ বছরের গৌরবময় ইতিহাস',
      icon: <Landmark className="w-6 h-6 text-[#0B5D3B] dark:text-emerald-400" />,
    },
    {
      id: 'teachers',
      number: toBanglaDigits(displayTeachers),
      suffix: '+',
      label: 'শিক্ষক ও কর্মচারী',
      subtitle: 'উচ্চশিক্ষিত ও প্রশিক্ষণপ্রাপ্ত শিক্ষক পরিষদ',
      icon: <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
    },
    {
      id: 'students',
      number: toBanglaDigits(displayStudents),
      suffix: '+',
      label: 'নিয়মিত শিক্ষার্থী',
      subtitle: '৬ষ্ঠ থেকে ১০ম শ্রেণিতে সক্রিয় শিক্ষার্থী',
      icon: <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
    },
    {
      id: 'passingRate',
      number: toBanglaDigits(displayPassRate),
      suffix: '%',
      label: 'এসএসসি পাশের হার',
      subtitle: 'পাবলিক পরীক্ষায় ধারাবাহিক সাফল্য',
      icon: <Trophy className="w-6 h-6 text-amber-500 dark:text-amber-400" />,
    },
  ];

  const classData = [
    {
      id: 'ten',
      name: 'দশম শ্রেণি',
      enClass: 'Class 10',
      count: animatedCounts ? animatedCounts.ten : count10,
      icon: <GraduationCap className="w-5 h-5 text-[#0B5D3B] dark:text-emerald-400" />,
      subtitle: 'এসএসসি পরীক্ষার্থী ব্যাচ',
    },
    {
      id: 'nine',
      name: 'নবম শ্রেণি',
      enClass: 'Class 9',
      count: animatedCounts ? animatedCounts.nine : count9,
      icon: <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      subtitle: 'বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা',
    },
    {
      id: 'eight',
      name: 'অষ্টম শ্রেণি',
      enClass: 'Class 8',
      count: animatedCounts ? animatedCounts.eight : count8,
      icon: <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      subtitle: 'জুনিয়র সেকেন্ডারি স্তর',
    },
    {
      id: 'seven',
      name: 'সপ্তম শ্রেণি',
      enClass: 'Class 7',
      count: animatedCounts ? animatedCounts.seven : count7,
      icon: <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
      subtitle: 'জাতীয় শিক্ষাক্রম স্তর',
    },
    {
      id: 'six',
      name: 'ষষ্ঠ শ্রেণি',
      enClass: 'Class 6',
      count: animatedCounts ? animatedCounts.six : count6,
      icon: <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      subtitle: 'মাধ্যমিক প্রবেশ স্তর',
    },
  ];

  return (
    <section
      id="student-stats"
      ref={sectionRef}
      className="py-12 sm:py-16 text-slate-900 dark:text-white relative overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-white to-emerald-50/35 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800"
    >
      <div id="student-info" className="absolute top-0 left-0" />
      <div id="stats" className="absolute top-0 left-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header & Interactive Tab Switcher */}
        <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-xs font-bold text-[#0B5D3B] dark:text-emerald-300">
            <BarChart3 className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>এক নজরে পরিসংখ্যান</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            পরিসংখ্যানে <span className="vibrant-gradient-text">{schoolName}</span>
          </h2>

          <div className="pt-2">
            <div
              role="tablist"
              aria-label="পরিসংখ্যান ভিউ"
              className="inline-flex items-center p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xs"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#0B5D3B] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#0B5D3B] dark:hover:text-emerald-300'
                }`}
              >
                <Landmark className="w-4 h-4" />
                <span>এক নজরে মূল অর্জন</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'classes'}
                onClick={() => setActiveTab('classes')}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'classes'
                    ? 'bg-[#0B5D3B] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#0B5D3B] dark:hover:text-emerald-300'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>শ্রেণিভিত্তিক শিক্ষার্থী</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mode 1: Overview Cards */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in">
            {milestoneData.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-400/70 transition-all duration-300 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.08)] hover:shadow-[0_18px_40px_-16px_rgba(11,93,59,0.16)] hover:-translate-y-1 flex flex-col items-center text-center"
              >
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 dark:bg-slate-800 border border-emerald-200/80 dark:border-slate-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>

                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline justify-center font-mono">
                  <span>{item.number}</span>
                  {item.suffix && (
                    <span className="text-xl sm:text-2xl font-extrabold text-[#0B5D3B] dark:text-emerald-400 ml-0.5">
                      {item.suffix}
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-2.5">
                  {item.label}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {item.subtitle}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Mode 2: Class-wise Cards */}
        {activeTab === 'classes' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 animate-fade-in">
            {classData.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-400/70 transition-all duration-300 shadow-xs hover:shadow-lg hover:-translate-y-1 flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-slate-800 border border-emerald-200/80 dark:border-slate-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>

                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline justify-center font-mono">
                  <span>{toBanglaDigits(item.count)}</span>
                  <span className="text-base font-bold text-[#0B5D3B] dark:text-emerald-400 ml-0.5">+</span>
                </div>

                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-2">
                  {item.name}
                </h4>
                <span className="text-[10px] font-bold text-[#0B5D3B] dark:text-emerald-400 tracking-wider uppercase mt-0.5">
                  {item.enClass}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                  {item.subtitle}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Dynamic Summary Pill Strip */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
            <span>
              মোট শিক্ষার্থী:{' '}
              <strong className="text-[#0B5D3B] dark:text-emerald-400 font-black">
                {toBanglaDigits(targetStudents)}
              </strong>{' '}
              জন
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 shadow-2xs">
            <BarChart3 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>
              শিক্ষক-শিক্ষার্থী অনুপাত:{' '}
              <strong className="text-slate-900 dark:text-white">
                ১:{toBanglaDigits(studentTeacherRatio)}
              </strong>
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 shadow-2xs">
            <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              স্কুল কোড: <strong className="text-slate-900 dark:text-white">{toBanglaDigits(schoolCode)}</strong> | EIIN:{' '}
              <strong className="text-slate-900 dark:text-white">{eiinDisplay}</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
