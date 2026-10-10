'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Layers, 
  UserPlus, 
  FileSpreadsheet, 
  ArrowRight,
  TrendingUp,
  School,
  Building2,
  Award,
  UserCheck,
  UserX,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Sparkles,
  PieChart,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import Link from 'next/link';
import { studentService, Student } from '@/services/studentService';
import { settingsService } from '@/services/settingsService';
import { classSectionService } from '@/services/classSectionService';
import { getStudentReligion } from '@/lib/religionUtils';
import { localDateKey } from '@/lib/dateUtils';
import { languageService, AppLanguage } from '@/services/languageService';

import AttendanceTrendChart from '@/components/dashboard/AttendanceTrendChart';
import DemographicsDonutChart from '@/components/dashboard/DemographicsDonutChart';
import ClassEnrollmentChart from '@/components/dashboard/ClassEnrollmentChart';
import QuickActionHub from '@/components/dashboard/QuickActionHub';

interface ClassDemographicRow {
  gradeKey: string;
  gradeLabel: string;
  male: number;
  female: number;
  muslim: number;
  hindu: number;
  total: number;
}

interface GroupStreamRow {
  gradeKey: string;
  gradeLabel: string;
  scienceMale: number;
  scienceFemale: number;
  scienceTotal: number;
  humanitiesMale: number;
  humanitiesFemale: number;
  humanitiesTotal: number;
  commerceMale: number;
  commerceFemale: number;
  commerceTotal: number;
  total: number;
}

interface ClassAttendanceSummary {
  gradeKey: string;
  gradeLabel: string;
  total: number;
  present: number;
  absent: number;
  leave: number;
  rate: number;
  isTaken: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<any>(null);
  const [currentLang, setCurrentLang] = useState<AppLanguage>('bn');
  const [analyticsView, setAnalyticsView] = useState<'charts' | 'table'>('charts');
  const [attendanceView, setAttendanceView] = useState<'visual' | 'table'>('visual');

  useEffect(() => {
    setMounted(true);
    setSchoolSettings(settingsService.getSettings());
    setCurrentLang(languageService.getLanguage());

    // 🛡️ Auth Guard — redirect unauthenticated users to login
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sms_current_session');
      if (!stored) {
        router.replace('/login');
        return;
      }
      try {
        const sess = JSON.parse(stored);
        if (!sess || !sess.role) {
          router.replace('/login');
          return;
        }
        // 🛡️ Teacher Session → Redirect to Teacher Portal
        if (sess?.role === 'teacher') {
          router.replace('/dashboard/teacher-portal');
          return;
        }
      } catch (e) {
        router.replace('/login');
        return;
      }
    }

    const loadData = () => {
      setStudents(studentService.getAllStudents());
    };

    loadData();

    const unsubscribeStudents = studentService.subscribe(loadData);
    const unsubscribeSettings = settingsService.subscribe((s) => setSchoolSettings(s));
    const unsubscribeLang = languageService.subscribe((l) => setCurrentLang(l));

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', loadData);
    }

    return () => {
      unsubscribeStudents();
      unsubscribeSettings();
      unsubscribeLang();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', loadData);
      }
    };
  }, [router]);

  // Helper gender & religion bucket check functions (BUG-004 & BUG-005 fixes)
  const getGenderBucket = (s: Student): 'male' | 'female' | 'unspecified' => {
    const gen = (s.gender || '').toString().toLowerCase().trim();
    if (gen.includes('female') || gen === 'f' || gen.includes('নারী') || gen.includes('মহিলা') || gen.includes('ছাত্রী') || gen.includes('মেয়ে') || gen.includes('মেয়ে')) {
      return 'female';
    }
    if (gen.includes('male') || gen === 'm' || gen.includes('পুরুষ') || gen.includes('ছাত্র') || gen.includes('ছেলে')) {
      return 'male';
    }
    return 'unspecified';
  };

  const checkIsFemale = (s: Student): boolean => {
    return getGenderBucket(s) === 'female';
  };

  const getReligionBucket = (s: Student): 'muslim' | 'hindu' | 'buddhist' | 'christian' | 'other' | 'unspecified' => {
    const rel = (s.religion || (s as any).religionBn || '').toString().toLowerCase().trim();
    if (rel.includes('islam') || rel.includes('ইসলাম') || rel.includes('muslim') || rel.includes('মুসলিম')) return 'muslim';
    if (rel.includes('hindu') || rel.includes('হিন্দু') || rel.includes('sanatan') || rel.includes('সনাতন')) return 'hindu';
    if (rel.includes('buddhist') || rel.includes('বৌদ্ধ')) return 'buddhist';
    if (rel.includes('christian') || rel.includes('খ্রিস্টান')) return 'christian';
    if (rel.includes('other') || rel.includes('অন্যান্য')) return 'other';
    if (!rel) return 'unspecified';
    return 'other';
  };

  const checkIsHindu = (s: Student): boolean => {
    return getReligionBucket(s) === 'hindu';
  };

  // 1. Calculate Demographics for Class 6 to Class 10
  const classOrder = [
    { key: '6th', label: '৬ষ্ঠ শ্রেণি (Class 6)' },
    { key: '7th', label: '৭ম শ্রেণি (Class 7)' },
    { key: '8th', label: '৮ম শ্রেণি (Class 8)' },
    { key: '9th', label: '৯ম শ্রেণি (Class 9)' },
    { key: '10th', label: '১০ম শ্রেণি (Class 10)' }
  ];

  const demographics: ClassDemographicRow[] = classOrder.map(c => {
    const classStudents = students.filter(s => {
      const g = s.grade || s.gradeBn || '';
      return g === c.key || g.includes(c.key) ||
        (c.key === '6th' && (g.includes('6') || g.includes('৬'))) ||
        (c.key === '7th' && (g.includes('7') || g.includes('৭'))) ||
        (c.key === '8th' && (g.includes('8') || g.includes('৮'))) ||
        (c.key === '9th' && (g.includes('9') || g.includes('৯'))) ||
        (c.key === '10th' && (g.includes('10') || g.includes('১০')));
    });

    let male = 0, female = 0, muslim = 0, hindu = 0;

    classStudents.forEach(s => {
      const gBucket = getGenderBucket(s);
      if (gBucket === 'female') {
        female++;
      } else if (gBucket === 'male') {
        male++;
      }

      const rBucket = getReligionBucket(s);
      if (rBucket === 'hindu') {
        hindu++;
      } else if (rBucket === 'muslim') {
        muslim++;
      }
    });

    return {
      gradeKey: c.key,
      gradeLabel: c.label,
      male,
      female,
      muslim,
      hindu,
      total: classStudents.length
    };
  });

  const grandTotalStudents = students.length;
  // Calculate consistently across all students (BUG-006 fix)
  const grandTotalMale = students.filter(s => getGenderBucket(s) === 'male').length;
  const grandTotalFemale = students.filter(s => getGenderBucket(s) === 'female').length;
  const grandTotalMuslim = students.filter(s => getReligionBucket(s) === 'muslim').length;
  const grandTotalHindu = students.filter(s => getReligionBucket(s) === 'hindu').length;
  const grandTotalStipend = students.filter(s => s.isStipend).length;

  // 2. Calculate Group Stream Analytics for Class 9 & 10
  const groupOrder = [
    { key: '9th', label: '৯ম শ্রেণি' },
    { key: '10th', label: '১০ম শ্রেণি' }
  ];

  const groupStats: GroupStreamRow[] = groupOrder.map(gItem => {
    const gStudents = students.filter(s => {
      const g = s.grade || s.gradeBn || '';
      return g === gItem.key || g.includes(gItem.key) ||
        (gItem.key === '9th' && (g.includes('9') || g.includes('৯'))) ||
        (gItem.key === '10th' && (g.includes('10') || g.includes('১০')));
    });

    let scienceMale = 0, scienceFemale = 0;
    let humanitiesMale = 0, humanitiesFemale = 0;
    let commerceMale = 0, commerceFemale = 0;

    gStudents.forEach(s => {
      const grp = (s.group || '').toLowerCase();
      const isFemale = checkIsFemale(s);

      if (grp.includes('science') || grp.includes('বিজ্ঞান')) {
        if (isFemale) scienceFemale++; else scienceMale++;
      } else if (grp.includes('humanities') || grp.includes('মানবিক') || grp.includes('arts')) {
        if (isFemale) humanitiesFemale++; else humanitiesMale++;
      } else if (grp.includes('commerce') || grp.includes('ব্যবসায়') || grp.includes('ব্যবসায়') || grp.includes('business')) {
        if (isFemale) commerceFemale++; else commerceMale++;
      } else {
        if (isFemale) scienceFemale++; else scienceMale++;
      }
    });

    const scienceTotal = scienceMale + scienceFemale;
    const humanitiesTotal = humanitiesMale + humanitiesFemale;
    const commerceTotal = commerceMale + commerceFemale;
    const total = scienceTotal + humanitiesTotal + commerceTotal;

    return {
      gradeKey: gItem.key,
      gradeLabel: gItem.label,
      scienceMale,
      scienceFemale,
      scienceTotal,
      humanitiesMale,
      humanitiesFemale,
      humanitiesTotal,
      commerceMale,
      commerceFemale,
      commerceTotal,
      total
    };
  });

  const totalScienceMale = groupStats.reduce((acc, c) => acc + c.scienceMale, 0);
  const totalScienceFemale = groupStats.reduce((acc, c) => acc + c.scienceFemale, 0);
  const totalScienceAll = groupStats.reduce((acc, c) => acc + c.scienceTotal, 0);

  const totalHumanitiesMale = groupStats.reduce((acc, c) => acc + c.humanitiesMale, 0);
  const totalHumanitiesFemale = groupStats.reduce((acc, c) => acc + c.humanitiesFemale, 0);
  const totalHumanitiesAll = groupStats.reduce((acc, c) => acc + c.humanitiesTotal, 0);

  const totalCommerceMale = groupStats.reduce((acc, c) => acc + c.commerceMale, 0);
  const totalCommerceFemale = groupStats.reduce((acc, c) => acc + c.commerceFemale, 0);
  const totalCommerceAll = groupStats.reduce((acc, c) => acc + c.commerceTotal, 0);

  const totalDepartmentStudents = totalScienceAll + totalHumanitiesAll + totalCommerceAll;

  // 3. Calculate Today's Live Class-wise Attendance (BUG-002 & BUG-003 fixes)
  const todayStr = localDateKey();

  const classAttendanceList: ClassAttendanceSummary[] = classOrder.map(c => {
    const classStudents = students.filter(s => {
      const g = s.grade || s.gradeBn || '';
      return g === c.key || g.includes(c.key) ||
        (c.key === '6th' && (g.includes('6') || g.includes('৬'))) ||
        (c.key === '7th' && (g.includes('7') || g.includes('৭'))) ||
        (c.key === '8th' && (g.includes('8') || g.includes('৮'))) ||
        (c.key === '9th' && (g.includes('9') || g.includes('৯'))) ||
        (c.key === '10th' && (g.includes('10') || g.includes('১০')));
    });

    const total = classStudents.length;
    let present = 0, absent = 0, leave = 0;
    let isTaken = false;

    if (typeof window !== 'undefined') {
      const sections = classSectionService.getSectionsForGrade(c.key);
      const branchKeys = new Set<string>(['A', 'B', 'C', 'all']);
      sections.forEach(s => {
        if (s.name) {
          branchKeys.add(s.name);
          const clean = s.name.replace(/[^a-zA-Z0-9]/g, '');
          if (clean) branchKeys.add(clean);
          if (s.name.includes('A')) branchKeys.add('A');
          if (s.name.includes('B')) branchKeys.add('B');
          if (s.name.includes('C')) branchKeys.add('C');
          if (s.name.includes('D')) branchKeys.add('D');
        }
      });
      if (c.key === '9th' || c.key === '10th') {
        branchKeys.add('Science');
        branchKeys.add('Humanities');
        branchKeys.add('Commerce');
        branchKeys.add('বিজ্ঞান');
        branchKeys.add('মানবিক');
        branchKeys.add('ব্যবসায়');
      }

      const checkedKeys = new Set<string>();
      const processRecordList = (parsed: any[]) => {
        if (Array.isArray(parsed) && parsed.length > 0) {
          isTaken = true;
          parsed.forEach((st: any) => {
            if (st.status === 'Present') present++;
            else if (st.status === 'Absent') absent++;
            else if (st.status === 'Leave') leave++;
          });
        }
      };

      branchKeys.forEach(b => {
        const storageKey = `sms_attendance_${todayStr}_${c.key}-${b}`;
        if (!checkedKeys.has(storageKey)) {
          checkedKeys.add(storageKey);
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            try { processRecordList(JSON.parse(saved)); } catch (e) {}
          }
        }
      });

      const singleKey = `sms_attendance_${todayStr}_${c.key}`;
      if (!checkedKeys.has(singleKey)) {
        checkedKeys.add(singleKey);
        const savedSingle = localStorage.getItem(singleKey);
        if (savedSingle) {
          try { processRecordList(JSON.parse(savedSingle)); } catch (e) {}
        }
      }

      // Scan all matching keys for this grade on today's date
      try {
        const prefix = `sms_attendance_${todayStr}_${c.key}`;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k === prefix || k.startsWith(`${prefix}-`) || k.startsWith(`${prefix}_`))) {
            if (!checkedKeys.has(k)) {
              checkedKeys.add(k);
              const val = localStorage.getItem(k);
              if (val) {
                try { processRecordList(JSON.parse(val)); } catch (e) {}
              }
            }
          }
        }
      } catch (e) {}
    }

    // STRICT REALTIME: If attendance is NOT submitted for today, present/absent/leave = 0
    if (!isTaken) {
      present = 0;
      absent = 0;
      leave = 0;
    }

    const rate = (isTaken && total > 0) ? parseFloat(((present / total) * 100).toFixed(1)) : 0;

    return {
      gradeKey: c.key,
      gradeLabel: c.label,
      total,
      present,
      absent,
      leave,
      rate,
      isTaken
    };
  });

  const grandTotalAttStudents = classAttendanceList.reduce((acc, c) => acc + c.total, 0);
  const grandTotalPresent = classAttendanceList.reduce((acc, c) => acc + c.present, 0);
  const grandTotalAbsent = classAttendanceList.reduce((acc, c) => acc + c.absent, 0);
  const grandTotalLeave = classAttendanceList.reduce((acc, c) => acc + c.leave, 0);
  const overallAttRate = grandTotalAttStudents > 0 
    ? parseFloat(((grandTotalPresent / grandTotalAttStudents) * 100).toFixed(1)) 
    : 0;

  const schoolName = schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const eiin = schoolSettings?.eiin || '১০৬২৮৮';

  if (!mounted) {
    return <div className="p-8 text-center text-slate-400 font-bold">{currentLang === 'en' ? 'Loading...' : 'লোড হচ্ছে...'}</div>;
  }

  return (
    <div className="space-y-7 pb-12 font-sans">
      
      {/* 💡 Empty State Banner (Displayed when database has no student records) */}
      {grandTotalStudents === 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-indigo-50/80 dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                {currentLang === 'en' ? 'No Student Records in System' : 'এখনও কোনো শিক্ষার্থীর তথ্য যুক্ত করা হয়নি'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
                {currentLang === 'en'
                  ? 'Start by enrolling students individually or upload full student lists in bulk via Excel/CSV.'
                  : 'নতুন শিক্ষার্থী ভর্তি করুন অথবা এক্সেল/সিএসভি তালিকার মাধ্যমে বাল্ক শিক্ষার্থী যুক্ত করুন।'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
            <Link
              href="/dashboard/admission"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
            >
              <UserPlus size={14} />
              <span>{currentLang === 'en' ? 'New Admission' : 'শিক্ষার্থী ভর্তি'}</span>
            </Link>
            <Link
              href="/dashboard/students"
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
            >
              <FileSpreadsheet size={14} className="text-emerald-500" />
              <span>{currentLang === 'en' ? 'Student List & Import' : 'শিক্ষার্থী তালিকা ও ইম্পোর্ট'}</span>
            </Link>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 🚀 1. KPI METRIC CARDS WITH GLASSMORPHISM & GRADIENTS           */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        
        {/* Card 1: Total Students */}
        <div className="bg-gradient-to-br from-indigo-500/10 via-white to-indigo-500/5 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-950/20 p-4 sm:p-5 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-indigo-500/20 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {currentLang === 'en' ? 'Total Students' : 'মোট শিক্ষার্থী'}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-110 transition-all">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">{grandTotalStudents}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold ml-1">{currentLang === 'en' ? 'Total' : 'জন'}</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-indigo-100/70 dark:border-indigo-900/40 flex items-center justify-between text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 relative z-10">
            <span className="flex items-center gap-1">
              <TrendingUp size={12} /> {currentLang === 'en' ? 'Class 6 - 10' : '৬ষ্ঠ - ১০ম শ্রেণি'}
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-indigo-100/80 dark:bg-indigo-900/60 text-[9.5px]">সক্রিয়</span>
          </div>
        </div>

        {/* Card 2: Male Students */}
        <div className="bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 dark:from-blue-950/40 dark:via-slate-900 dark:to-blue-950/20 p-4 sm:p-5 rounded-3xl border border-blue-100 dark:border-blue-900/50 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {currentLang === 'en' ? '👨‍🎓 Boys' : '👨‍🎓 ছাত্র'}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-110 transition-all">
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">{grandTotalMale}</span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-bold ml-1">{currentLang === 'en' ? 'Boys' : 'জন'}</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-blue-100/70 dark:border-blue-900/40 flex items-center justify-between text-[10.5px] font-bold text-slate-500 dark:text-slate-400 relative z-10">
            <span>{currentLang === 'en' ? 'Ratio:' : 'অনুপাত:'}</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-black text-[10px]">
              {grandTotalStudents > 0 ? ((grandTotalMale / grandTotalStudents) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* Card 3: Female Students */}
        <div className="bg-gradient-to-br from-rose-500/10 via-white to-rose-500/5 dark:from-rose-950/40 dark:via-slate-900 dark:to-rose-950/20 p-4 sm:p-5 rounded-3xl border border-rose-100 dark:border-rose-900/50 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-rose-500/20 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              {currentLang === 'en' ? '👩‍🎓 Girls' : '👩‍🎓 ছাত্রী'}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25 group-hover:scale-110 transition-all">
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">{grandTotalFemale}</span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-bold ml-1">{currentLang === 'en' ? 'Girls' : 'জন'}</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-rose-100/70 dark:border-rose-900/40 flex items-center justify-between text-[10.5px] font-bold text-slate-500 dark:text-slate-400 relative z-10">
            <span>{currentLang === 'en' ? 'Ratio:' : 'অনুপাত:'}</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 font-black text-[10px]">
              {grandTotalStudents > 0 ? ((grandTotalFemale / grandTotalStudents) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* Card 4: Muslim Students */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/20 p-4 sm:p-5 rounded-3xl border border-emerald-100 dark:border-emerald-900/50 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {currentLang === 'en' ? '☪️ Muslim' : '☪️ মুসলিম'}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-110 transition-all">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">{grandTotalMuslim}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold ml-1">{currentLang === 'en' ? '' : 'জন'}</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-emerald-100/70 dark:border-emerald-900/40 flex items-center justify-between text-[10.5px] font-bold text-slate-500 dark:text-slate-400 relative z-10">
            <span>{currentLang === 'en' ? 'Share:' : 'অংশ:'}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-black text-[10px]">
              {grandTotalStudents > 0 ? ((grandTotalMuslim / grandTotalStudents) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* Card 5: Hindu Students */}
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/20 p-4 sm:p-5 rounded-3xl border border-amber-100 dark:border-amber-900/50 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {currentLang === 'en' ? '🛕 Hindu' : '🛕 হিন্দু'}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25 group-hover:scale-110 transition-all">
              <Award size={18} />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">{grandTotalHindu}</span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-bold ml-1">{currentLang === 'en' ? '' : 'জন'}</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-amber-100/70 dark:border-amber-900/40 flex items-center justify-between text-[10.5px] font-bold text-slate-500 dark:text-slate-400 relative z-10">
            <span>{currentLang === 'en' ? 'Share:' : 'অংশ:'}</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-black text-[10px]">
              {grandTotalStudents > 0 ? ((grandTotalHindu / grandTotalStudents) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ⚡ 2. QUICK ACTION HUB (১-ক্লিক দ্রুত সেবা হাব)                  */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <QuickActionHub lang={currentLang} />

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 📊 3. TODAY'S ATTENDANCE PANEL (VISUAL CHART + DETAILED TABLE)    */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        {/* Toggle Switch Bar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-teal-600 dark:text-teal-400" />
            <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              {currentLang === 'en' ? "Today's Live Attendance Dashboard" : 'আজকের লাইভ উপস্থিতি প্যানেল'}
            </span>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setAttendanceView('visual')}
              className={`px-3 py-1 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                attendanceView === 'visual'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 size={14} />
              <span>{currentLang === 'en' ? 'Visual Chart' : 'ভিজ্যুয়াল গ্রাফ'}</span>
            </button>

            <button
              type="button"
              onClick={() => setAttendanceView('table')}
              className={`px-3 py-1 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                attendanceView === 'table'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TableIcon size={14} />
              <span>{currentLang === 'en' ? 'Detailed Table' : 'শ্রেণিভিত্তিক টেবিল'}</span>
            </button>
          </div>
        </div>

        {/* View 1: Visual Interactive Chart */}
        {attendanceView === 'visual' ? (
          <AttendanceTrendChart
            data={classAttendanceList}
            overallRate={overallAttRate}
            grandTotal={grandTotalAttStudents}
            totalPresent={grandTotalPresent}
            totalAbsent={grandTotalAbsent}
            totalLeave={grandTotalLeave}
            lang={currentLang}
          />
        ) : (
          /* View 2: Detailed Table View */
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 flex items-center justify-center font-bold shrink-0">
                  <UserCheck size={18} />
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {currentLang === 'en' ? "Today's Attendance Detailed Breakdown" : "আজকের শিক্ষার্থী উপস্থিতি লাইভ তালিকা"}
                  </h2>
                  <span className="px-2.5 py-0.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-extrabold text-[10px] uppercase tracking-wider rounded-full border border-teal-200 dark:border-teal-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                    {currentLang === 'en' ? 'Live' : 'লাইভ আপডেট'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <Calendar size={13} className="text-slate-400" />
                <span>
                  {new Date().toLocaleDateString(currentLang === 'en' ? 'en-US' : 'bn-BD', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left Side: Summary Card */}
              <div className="lg:col-span-4 bg-gradient-to-b from-slate-50/90 via-slate-50/50 to-white dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-900/90 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between space-y-5 shadow-xs">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3.5">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/40 shadow-2xs">
                        <TrendingUp size={15} />
                      </div>
                      {currentLang === 'en' ? 'Attendance Summary' : 'আজকের হাজিরা সামারি'}
                    </span>
                    <span className={`text-[11px] font-black px-3 py-1 rounded-full border shadow-2xs font-mono ${
                      overallAttRate >= 80 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60'
                        : overallAttRate >= 50
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60'
                    }`}>
                      {overallAttRate}% {currentLang === 'en' ? 'Rate' : 'উপস্থিত'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span>{currentLang === 'en' ? 'Overall Rate' : 'গড় উপস্থিতি হার'}</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white">{overallAttRate}%</span>
                    </div>
                    <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 h-2.5 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          overallAttRate >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : overallAttRate >= 50 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-rose-500 to-rose-600'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, overallAttRate))}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {/* Total Students */}
                    <div className="p-3 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        <Users size={12} className="text-slate-400" />
                        <span>{currentLang === 'en' ? 'Total' : 'মোট শিক্ষার্থী'}</span>
                      </div>
                      <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-1">
                        {grandTotalAttStudents} <span className="text-[11px] font-normal text-slate-400">জন</span>
                      </div>
                    </div>

                    {/* Present Students */}
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs hover:border-emerald-300 transition-colors">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                        <UserCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                        <span>{currentLang === 'en' ? 'Present' : 'উপস্থিত'}</span>
                      </div>
                      <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1">
                        {grandTotalPresent} <span className="text-[11px] font-normal text-emerald-600/70">জন</span>
                      </div>
                    </div>

                    {/* Absent Students */}
                    <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200/80 dark:border-rose-800/60 shadow-2xs hover:border-rose-300 transition-colors">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide">
                        <UserX size={12} className="text-rose-600 dark:text-rose-400" />
                        <span>{currentLang === 'en' ? 'Absent' : 'অনুপস্থিত'}</span>
                      </div>
                      <div className="text-lg font-black text-rose-700 dark:text-rose-300 font-mono mt-1">
                        {grandTotalAbsent} <span className="text-[11px] font-normal text-rose-600/70">জন</span>
                      </div>
                    </div>

                    {/* On Leave Students */}
                    <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-800/60 shadow-2xs hover:border-amber-300 transition-colors">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                        <Clock size={12} className="text-amber-600 dark:text-amber-400" />
                        <span>{currentLang === 'en' ? 'On Leave' : 'ছুটিতে'}</span>
                      </div>
                      <div className="text-lg font-black text-amber-700 dark:text-amber-300 font-mono mt-1">
                        {grandTotalLeave} <span className="text-[11px] font-normal text-amber-600/70">জন</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/60 rounded-xl text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center justify-between shadow-2xs">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>{currentLang === 'en' ? 'Live Progress' : 'হাজিরা অগ্রগতি'}</span>
                  </span>
                  <span className="font-mono text-xs font-black text-teal-800 dark:text-teal-200 bg-white/70 dark:bg-teal-900/50 px-2 py-0.5 rounded-lg border border-teal-200/50 dark:border-teal-800/50">
                    {classAttendanceList.filter(c => c.isTaken).length}/{classAttendanceList.length} শ্রেণি সম্পন্ন
                  </span>
                </div>
              </div>

              {/* Right Side: Professional Enterprise Table */}
              <div className="lg:col-span-8 overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10.5px] tracking-wider">
                        <th className="py-3.5 px-4 font-black text-slate-700 dark:text-slate-200">
                          {currentLang === 'en' ? 'Class' : 'শ্রেণি ও বিবরণ'}
                        </th>
                        <th className="py-3.5 px-3 text-center font-extrabold text-slate-600 dark:text-slate-300">
                          {currentLang === 'en' ? 'Total' : 'মোট শিক্ষার্থী'}
                        </th>
                        <th className="py-3.5 px-3 text-center font-extrabold text-emerald-700 dark:text-emerald-400">
                          <span className="inline-flex items-center gap-1.5 justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {currentLang === 'en' ? 'Present' : 'উপস্থিত'}
                          </span>
                        </th>
                        <th className="py-3.5 px-3 text-center font-extrabold text-rose-700 dark:text-rose-400">
                          <span className="inline-flex items-center gap-1.5 justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            {currentLang === 'en' ? 'Absent' : 'অনুপস্থিত'}
                          </span>
                        </th>
                        <th className="py-3.5 px-3 text-center font-extrabold text-slate-600 dark:text-slate-300">
                          {currentLang === 'en' ? 'Attendance Rate' : 'উপস্থিতির হার'}
                        </th>
                        <th className="py-3.5 px-4 text-right font-extrabold text-slate-600 dark:text-slate-300">
                          {currentLang === 'en' ? 'Action' : 'কার্যক্রম'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-semibold text-xs">
                      {classAttendanceList.map((row, idx) => {
                        const gradeDigits = row.gradeKey.replace(/\D/g, '') || String(idx + 6);
                        return (
                          <tr 
                            key={row.gradeKey} 
                            className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors group"
                          >
                            {/* Class Info */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs font-mono shrink-0 transition-transform group-hover:scale-105 ${
                                  row.isTaken 
                                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60 shadow-2xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                }`}>
                                  {gradeDigits}
                                </div>
                                <div>
                                  <span className="font-black text-slate-900 dark:text-white text-sm block leading-tight">
                                    {row.gradeLabel}
                                  </span>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 block">
                                    {row.isTaken ? 'আজকের রোল কল সম্পন্ন' : 'রোল কল এখনও বাকি'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Total Students */}
                            <td className="py-3.5 px-3 text-center font-black text-slate-800 dark:text-slate-200 font-mono text-sm">
                              {row.total} <span className="text-[11px] text-slate-400 font-normal">জন</span>
                            </td>

                            {/* Present Count */}
                            <td className="py-3.5 px-3 text-center">
                              {row.isTaken ? (
                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-black text-xs border border-emerald-200/70 dark:border-emerald-800/50 font-mono">
                                  {row.present} জন
                                </span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600 font-mono font-bold text-xs">—</span>
                              )}
                            </td>

                            {/* Absent Count */}
                            <td className="py-3.5 px-3 text-center">
                              {row.isTaken ? (
                                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-xl font-black text-xs font-mono ${
                                  row.absent > 0
                                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/50'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                }`}>
                                  {row.absent} জন
                                </span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600 font-mono font-bold text-xs">—</span>
                              )}
                            </td>

                            {/* Rate with Progress Indicator */}
                            <td className="py-3.5 px-3 text-center">
                              {row.isTaken ? (
                                <div className="inline-flex flex-col items-center gap-1 w-24">
                                  <span className={`text-xs font-black font-mono ${
                                    row.rate >= 80 
                                      ? 'text-emerald-600 dark:text-emerald-400' 
                                      : row.rate >= 50 
                                      ? 'text-amber-600 dark:text-amber-400' 
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}>
                                    {row.rate}%
                                  </span>
                                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-300 ${
                                        row.rate >= 80 ? 'bg-emerald-500' : row.rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${Math.min(100, Math.max(0, row.rate))}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10.5px] font-extrabold whitespace-nowrap shadow-2xs">
                                  <Clock size={11} className="text-amber-500" />
                                  বাকি আছে
                                </span>
                              )}
                            </td>

                            {/* Action Button */}
                            <td className="py-3.5 px-4 text-right">
                              <Link
                                href={`/dashboard/academic/attendance?grade=${row.gradeKey}`}
                                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                                  row.isTaken
                                    ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shadow-2xs'
                                    : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-sm shadow-teal-500/20 hover:shadow-md hover:-translate-y-0.5'
                                }`}
                              >
                                <span>{row.isTaken ? 'তথ্য' : 'হাজিরা নিন'}</span>
                                {row.isTaken ? <ArrowUpRight size={13} className="text-slate-400" /> : <ArrowRight size={13} />}
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                    {/* Total Summary Footer */}
                    <tfoot className="bg-slate-50/90 dark:bg-slate-800/90 border-t-2 border-slate-200 dark:border-slate-700 text-xs font-black">
                      <tr>
                        <td className="py-3.5 px-4 font-black uppercase text-slate-900 dark:text-white">
                          সর্বমোট (Grand Total)
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-900 dark:text-white font-mono text-sm">
                          {grandTotalAttStudents} <span className="text-[11px] text-slate-400 font-normal">জন</span>
                        </td>
                        <td className="py-3.5 px-3 text-center text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                          {grandTotalPresent} <span className="text-[11px] text-slate-400 font-normal">জন</span>
                        </td>
                        <td className="py-3.5 px-3 text-center text-rose-700 dark:text-rose-400 font-mono text-sm">
                          {grandTotalAbsent} <span className="text-[11px] text-slate-400 font-normal">জন</span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-600 text-white font-black text-xs font-mono shadow-xs">
                            {overallAttRate}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] border border-emerald-200/60 dark:border-emerald-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            সক্রিয় সেশন
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 📈 4. STUDENT DEMOGRAPHICS & STREAM DISTRIBUTION ANALYTICS       */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        {/* Toggle Switch Bar for Demographics & Stream */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <PieChart size={18} className="text-indigo-600 dark:text-indigo-400" />
            <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              {currentLang === 'en' ? 'Student Enrollment & Demographics Hub' : 'শিক্ষার্থী ডেমোগ্রাফিক্স ও বিভাগীয় বিশ্লেষণ'}
            </span>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setAnalyticsView('charts')}
              className={`px-3 py-1 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                analyticsView === 'charts'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <PieChart size={14} />
              <span>{currentLang === 'en' ? 'Interactive Charts' : 'ইন্টারেক্টিভ চার্ট'}</span>
            </button>

            <button
              type="button"
              onClick={() => setAnalyticsView('table')}
              className={`px-3 py-1 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                analyticsView === 'table'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TableIcon size={14} />
              <span>{currentLang === 'en' ? 'Detailed Tables' : 'সম্পূর্ণ ডেটা টেবিল'}</span>
            </button>
          </div>
        </div>

        {/* View 1: High-end Visual Charts */}
        {analyticsView === 'charts' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <DemographicsDonutChart
                maleCount={grandTotalMale}
                femaleCount={grandTotalFemale}
                muslimCount={grandTotalMuslim}
                hinduCount={grandTotalHindu}
                totalStudents={grandTotalStudents}
                lang={currentLang}
              />
            </div>
            <div className="lg:col-span-7">
              <ClassEnrollmentChart
                enrollments={demographics.map(d => ({
                  gradeKey: d.gradeKey,
                  gradeLabel: d.gradeLabel,
                  male: d.male,
                  female: d.female,
                  total: d.total
                }))}
                groupStats={groupStats.map(g => ({
                  gradeLabel: g.gradeLabel,
                  scienceTotal: g.scienceTotal,
                  humanitiesTotal: g.humanitiesTotal,
                  commerceTotal: g.commerceTotal,
                  total: g.total
                }))}
                lang={currentLang}
              />
            </div>
          </div>
        ) : (
          /* View 2: Detailed Data Tables */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Panel 1: শ্রেণি ভিত্তিক শিক্ষার্থী ডেমোগ্রাফিক্স (Class 6 - 10) [7 Columns] */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm shadow-2xs">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base">শ্রেণি ভিত্তিক শিক্ষার্থী সংখ্যা (Class Demographics)</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">ছাত্র, ছাত্রী, মুসলিম ও হিন্দু শিক্ষার্থী পরিসংখ্যান (৬ষ্ঠ - ১০ম)</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black text-xs rounded-full border border-indigo-200/80 dark:border-indigo-800 shadow-2xs font-mono">
                  মোট: {grandTotalStudents} জন
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10.5px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <th className="py-3.5 px-4 font-black text-slate-700 dark:text-slate-200">শ্রেণি</th>
                        <th className="py-3.5 px-3 text-center text-blue-700 dark:text-blue-400">
                          <span className="inline-flex items-center gap-1.5 justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            ছাত্র (Male)
                          </span>
                        </th>
                        <th className="py-3.5 px-3 text-center text-rose-700 dark:text-rose-400">
                          <span className="inline-flex items-center gap-1.5 justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            ছাত্রী (Female)
                          </span>
                        </th>
                        <th className="py-3.5 px-3 text-center text-emerald-700 dark:text-emerald-400">
                          <span className="inline-flex items-center gap-1.5 justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            মুসলিম
                          </span>
                        </th>
                        <th className="py-3.5 px-3 text-center text-amber-700 dark:text-amber-400">
                          <span className="inline-flex items-center gap-1.5 justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            হিন্দু
                          </span>
                        </th>
                        <th className="py-3.5 px-4 text-right font-black text-slate-700 dark:text-slate-200">মোট শিক্ষার্থী</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-semibold text-xs">
                      {demographics.map((row, idx) => {
                        const gradeDigits = row.gradeKey.replace(/\D/g, '') || String(idx + 6);
                        return (
                          <tr key={row.gradeKey} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors group">
                            <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-[11px] font-mono flex items-center justify-center border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform">
                                  {gradeDigits}
                                </div>
                                <span>{row.gradeLabel}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs border border-blue-200/60 dark:border-blue-800/40">
                                {row.male} জন
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-mono font-bold text-xs border border-rose-200/60 dark:border-rose-800/40">
                                {row.female} জন
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs border border-emerald-200/60 dark:border-emerald-800/40">
                                {row.muslim} জন
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-mono font-bold text-xs border border-amber-200/60 dark:border-amber-800/40">
                                {row.hindu} জন
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white font-mono text-sm">
                              {row.total} <span className="text-[11px] text-slate-400 font-normal">জন</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50/90 dark:bg-slate-800/90 font-black text-slate-900 dark:text-white text-xs border-t-2 border-slate-200 dark:border-slate-700">
                      <tr>
                        <td className="py-3.5 px-4 font-black uppercase">সর্বমোট (Grand Total)</td>
                        <td className="py-3.5 px-3 text-center text-blue-800 dark:text-blue-300 font-black font-mono">{grandTotalMale} জন</td>
                        <td className="py-3.5 px-3 text-center text-rose-800 dark:text-rose-300 font-black font-mono">{grandTotalFemale} জন</td>
                        <td className="py-3.5 px-3 text-center text-emerald-800 dark:text-emerald-300 font-black font-mono">{grandTotalMuslim} জন</td>
                        <td className="py-3.5 px-3 text-center text-amber-800 dark:text-amber-300 font-black font-mono">{grandTotalHindu} জন</td>
                        <td className="py-3.5 px-4 text-right text-indigo-700 dark:text-indigo-300 font-black text-sm font-mono">{grandTotalStudents} জন</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Panel 2: ৯-১০ম শ্রেণির বিভাগ প্যানেল (Clean Simple Table Panel) [5 Columns] */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm shadow-2xs">
                      <GraduationCap size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">৯ম ও ১০ম শ্রেণি (বিভাগ প্যানেল)</h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা গ্রুপ পরিসংখ্যান</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-black text-[11px] rounded-full border border-amber-200/80 dark:border-amber-800 shadow-2xs font-mono">
                    মোট: {totalDepartmentStudents} জন
                  </span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/90 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10.5px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                          <th className="py-3.5 px-4 font-black text-slate-700 dark:text-slate-200">শ্রেণি</th>
                          <th className="py-3.5 px-3 text-center text-violet-700 dark:text-violet-400">
                            <span className="inline-flex items-center gap-1.5 justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                              বিজ্ঞান
                            </span>
                          </th>
                          <th className="py-3.5 px-3 text-center text-rose-700 dark:text-rose-400">
                            <span className="inline-flex items-center gap-1.5 justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              মানবিক
                            </span>
                          </th>
                          <th className="py-3.5 px-3 text-center text-amber-700 dark:text-amber-400">
                            <span className="inline-flex items-center gap-1.5 justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              ব্যবসায় শিক্ষা
                            </span>
                          </th>
                          <th className="py-3.5 px-4 text-right font-black text-slate-700 dark:text-slate-200">মোট</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-semibold text-xs">
                        {groupStats.map((row, idx) => {
                          const gradeDigits = row.gradeKey.replace(/\D/g, '') || String(idx + 9);
                          return (
                            <tr key={row.gradeKey} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors group">
                              <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-[11px] font-mono flex items-center justify-center border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform">
                                    {gradeDigits}
                                  </div>
                                  <span>{row.gradeLabel}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-mono font-bold text-xs border border-violet-200/60 dark:border-violet-800/40">
                                  {row.scienceTotal} জন
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-mono font-bold text-xs border border-rose-200/60 dark:border-rose-800/40">
                                  {row.humanitiesTotal} জন
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-mono font-bold text-xs border border-amber-200/60 dark:border-amber-800/40">
                                  {row.commerceTotal} জন
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-black text-indigo-700 dark:text-indigo-300 font-mono text-sm">
                                {row.total} <span className="text-[11px] text-slate-400 font-normal">জন</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-50/90 dark:bg-slate-800/90 font-black text-slate-900 dark:text-white text-xs border-t-2 border-slate-200 dark:border-slate-700">
                        <tr>
                          <td className="py-3.5 px-4 font-black uppercase">সর্বমোট</td>
                          <td className="py-3.5 px-3 text-center text-violet-900 dark:text-violet-300 font-black font-mono">{totalScienceAll} জন</td>
                          <td className="py-3.5 px-3 text-center text-rose-900 dark:text-rose-300 font-black font-mono">{totalHumanitiesAll} জন</td>
                          <td className="py-3.5 px-3 text-center text-amber-900 dark:text-amber-300 font-black font-mono">{totalCommerceAll} জন</td>
                          <td className="py-3.5 px-4 text-right text-indigo-700 dark:text-indigo-300 font-black text-sm font-mono">{totalDepartmentStudents} জন</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-slate-400" />
                  সেশন: ২০২৬ শিক্ষাবর্ষ
                </span>
                <span className="text-indigo-700 dark:text-indigo-400 font-black font-mono">মোট বিভাগীয়: {totalDepartmentStudents} জন</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 🧭 5. BOTTOM NAVIGATION QUICK TILES                             */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        <Link
          href="/dashboard/students"
          className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 hover:shadow-lg transition-all group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-110 group-hover:rotate-2 transition-transform">
            <Users size={22} />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">শিক্ষার্থী ডিরেক্টরি</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">শিক্ষার্থী তথ্য ব্যবস্থাপনা ও নতুন এন্ট্রি</p>
          </div>
        </Link>

        <Link
          href="/dashboard/academic/curriculum"
          className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-violet-400 hover:shadow-lg transition-all group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-500 text-white flex items-center justify-center shadow-md shadow-violet-500/25 group-hover:scale-110 group-hover:rotate-2 transition-transform">
            <BookOpen size={22} />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">পাঠ্যক্রম ও নম্বর বণ্টন</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">৬ষ্ঠ-১০ম শ্রেণি বিষয় ও নম্বর কাস্টমাইজ</p>
          </div>
        </Link>

        <Link
          href="/dashboard/academic/marksheet"
          className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-teal-400 hover:shadow-lg transition-all group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/25 group-hover:scale-110 group-hover:rotate-2 transition-transform">
            <Layers size={22} />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">মার্কশিট জেনারেটর</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">NCTB যৌথ পাস নম্বরপত্র ও রেজাল্ট প্রিন্ট</p>
          </div>
        </Link>

        <Link
          href="/dashboard/exam/tabulation"
          className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 hover:shadow-lg transition-all group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25 group-hover:scale-110 group-hover:rotate-2 transition-transform">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">টেবুলেশন শিট</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">বার্ষিক ও সাময়িক পরীক্ষার পূর্ণাঙ্গ টেবুলেশন</p>
          </div>
        </Link>
      </div>

    </div>
  );
}
