'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  UserPlus,
  GraduationCap,
  BookOpenCheck,
  CalendarCheck2,
  Award,
  TrendingUp,
  Wallet,
  MessageSquareDot,
  FileBadge,
  Globe,
  Sliders,
  CalendarRange,
  ChevronDown,
  ChevronRight,
  LogOut,
  X,
  Printer,
  Grid3X3,
  BookOpen,
  Calendar,
  CreditCard,
  SlidersHorizontal,
  Edit3,
  Layers,
  ClipboardList,
  BarChart3,
  Search,
  History,
  Receipt,
  Banknote,
  Landmark,
  RotateCcw,
  FileBarChart,
  Bell,
  Send,
  FileCheck,
  FileText,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import { languageService, AppLanguage } from '@/services/languageService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { leaveService } from '@/services/leaveService';
import { studentService } from '@/services/studentService';
import { teacherRBACService } from '@/services/teacherRBACService';

interface SubNavItem {
  label: string;
  labelBn: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number | null;
  badgeColor?: string;
  isExternal?: boolean;
}

interface MainNavItem {
  id: string;
  title: string;
  titleBn: string;
  subtitle: string;
  subtitleBn: string;
  href?: string;
  icon: React.ReactNode;
  iconColor: string;
  hoverBg: string;
  badge?: string | number | null;
  badgeColor?: string;
  liveDot?: boolean;
  subItems?: SubNavItem[];
}

interface NavSection {
  header: string;
  headerBn: string;
  items: MainNavItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function SidebarContent({ session, onClose }: { session: UserSession | null; onClose?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [currentLang, setCurrentLang] = useState<AppLanguage>('bn');
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);

  const isAdmin = session?.role === 'admin';
  const currentTab = searchParams ? searchParams.get('tab') : null;

  // Real-time metric counters
  const [studentCount, setStudentCount] = useState<number>(840);
  const [teacherCount, setTeacherCount] = useState<number>(28);
  const [pendingLeavesCount, setPendingLeavesCount] = useState<number>(0);

  useEffect(() => {
    setCurrentLang(languageService.getLanguage());
    setSchoolSettings(settingsService.getSettings());
    const unsubLang = languageService.subscribe((lang) => setCurrentLang(lang));

    const updateMetrics = () => {
      try {
        const students = studentService.getAllStudents();
        if (students && students.length > 0) {
          setStudentCount(students.length);
        }
      } catch (e) {}

      try {
        const teachers = teacherRBACService.getTeachers();
        if (teachers && teachers.length > 0) {
          setTeacherCount(teachers.length);
        }
      } catch (e) {}

      try {
        const leaves = leaveService.getLeaves();
        setPendingLeavesCount(leaves.filter((l) => l.status === 'pending').length);
      } catch (e) {}
    };

    updateMetrics();
    const unsubLeaves = leaveService.subscribe(updateMetrics);
    const unsubSettings = settingsService.subscribe((s) => setSchoolSettings(s));

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', updateMetrics);
    }

    return () => {
      unsubLang();
      unsubLeaves();
      unsubSettings();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', updateMetrics);
      }
    };
  }, []);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isItemActive = (href: string) => {
    if (href.includes('?')) {
      const [base, query] = href.split('?');
      if (pathname !== base) return false;
      const urlQuery = new URLSearchParams(query);
      const viewQuery = urlQuery.get('view');
      if (viewQuery) {
        return searchParams?.get('view') === viewQuery;
      }
      const paramTab = urlQuery.get('tab');
      if (paramTab) {
        if (base === '/dashboard/finance') {
          return (currentTab || 'student_fees') === paramTab;
        }
        if (base === '/dashboard/ssc-transcript') {
          return (currentTab || 'single_generator') === paramTab;
        }
        if (base === '/dashboard/teacher-portal') {
          return (currentTab || 'home') === paramTab;
        }
        return currentTab === paramTab;
      }
      return false;
    }
    if (href === '/dashboard/teacher') {
      return pathname === href && (!currentTab || currentTab === 'teachers');
    }
    return pathname === href && !searchParams?.get('view') && !searchParams?.get('tab');
  };

  const isGroupActive = (item: MainNavItem) => {
    if (item.href) return isItemActive(item.href);
    if (!item.subItems) return false;
    return item.subItems.some((sub) => {
      const base = sub.href.split('?')[0];
      return pathname === base;
    });
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  const handleLogout = () => {
    teacherAuthService.logout();
    window.location.href = '/login';
  };

  // ── ADMIN 3-TIER CATEGORIZED NAVIGATION (MATCHING ENTERPRISE ERP SPEC) ──
  const ADMIN_SECTIONS: NavSection[] = [
    {
      header: 'Core Overview',
      headerBn: 'মূল মেনু • Core',
      items: [
        {
          id: 'dashboard',
          title: 'Dashboard',
          titleBn: 'ড্যাশবোর্ড',
          subtitle: 'Overview & Analytics',
          subtitleBn: 'কমান্ড সেন্টার ও ওভারভিউ',
          href: '/dashboard',
          icon: <LayoutDashboard className="w-4 h-4" />,
          iconColor: 'text-indigo-400',
          hoverBg: 'group-hover:bg-indigo-500/20',
          badge: 'Live',
          badgeColor: 'bg-white/20 text-white',
        },
        {
          id: 'people',
          title: 'People',
          titleBn: 'শিক্ষার্থী ও জনবল',
          subtitle: 'Students, Staff & Faculty',
          subtitleBn: 'শিক্ষার্থী, শিক্ষক ও স্টাফ',
          icon: <Users className="w-4 h-4" />,
          iconColor: 'text-sky-400',
          hoverBg: 'group-hover:bg-sky-500/20',
          subItems: [
            {
              label: 'All Students',
              labelBn: 'সকল শিক্ষার্থী (Students)',
              href: '/dashboard/students',
              icon: <UserCheck className="w-3.5 h-3.5 text-indigo-400" />,
              badge: studentCount,
              badgeColor: 'bg-indigo-500/20 text-indigo-300',
            },
            {
              label: 'Print & Reports',
              labelBn: 'তালিকা প্রিন্ট ও রিপোর্ট',
              href: '/dashboard/students?view=print',
              icon: <Printer className="w-3.5 h-3.5 text-slate-400" />,
            },
            {
              label: 'Teachers & Staff (HR)',
              labelBn: 'শিক্ষক ব্যবস্থাপনা (HR)',
              href: '/dashboard/teacher',
              icon: <Users className="w-3.5 h-3.5 text-emerald-400" />,
              badge: teacherCount,
              badgeColor: 'bg-emerald-500/20 text-emerald-300',
            },
            {
              label: 'Leave Applications',
              labelBn: 'ছুটির আবেদনসমূহ',
              href: '/dashboard/teacher?tab=leave_applications',
              icon: <Send className="w-3.5 h-3.5 text-amber-400" />,
              badge: pendingLeavesCount > 0 ? pendingLeavesCount : null,
              badgeColor: 'bg-rose-500 text-white font-bold animate-pulse',
            },
          ],
        },
      ],
    },
    {
      header: 'Academic & Operations',
      headerBn: 'একাডেমিক • Academic',
      items: [
        {
          id: 'academic',
          title: 'Academic',
          titleBn: 'একাডেমিক ব্যবস্থাপনা',
          subtitle: 'Classes, Sections & Routine',
          subtitleBn: 'শ্রেণি, শাখা ও পাঠ্যক্রম',
          icon: <BookOpenCheck className="w-4 h-4" />,
          iconColor: 'text-violet-400',
          hoverBg: 'group-hover:bg-violet-500/20',
          subItems: [
            {
              label: 'Classes & Sections',
              labelBn: 'শ্রেণি ও শাখা সেটআপ',
              href: '/dashboard/academic/classes',
              icon: <GraduationCap className="w-3.5 h-3.5 text-violet-400" />,
            },
            {
              label: 'Section Overview',
              labelBn: 'শাখা সারসংক্ষেপ',
              href: '/dashboard/academic',
              icon: <Grid3X3 className="w-3.5 h-3.5 text-slate-400" />,
            },
            {
              label: 'Subjects & Curriculum',
              labelBn: 'বিষয় ও পাঠ্যক্রম (NCTB)',
              href: '/dashboard/academic/curriculum',
              icon: <BookOpen className="w-3.5 h-3.5 text-indigo-400" />,
            },
            {
              label: 'Academic Session',
              labelBn: 'শিক্ষাবর্ষ ও সেশন',
              href: '/dashboard/academic/session',
              icon: <Calendar className="w-3.5 h-3.5 text-emerald-400" />,
            },
          ],
        },
        {
          id: 'admissions',
          title: 'Admissions',
          titleBn: 'ভর্তি কার্যক্রম',
          subtitle: 'New Student Enrollment',
          subtitleBn: 'নতুন শিক্ষার্থী ভর্তি',
          icon: <UserPlus className="w-4 h-4" />,
          iconColor: 'text-emerald-400',
          hoverBg: 'group-hover:bg-emerald-500/20',
          badge: '+ New',
          badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
          subItems: [
            {
              label: 'New Admission',
              labelBn: 'নতুন শিক্ষার্থী ভর্তি ফরম',
              href: '/dashboard/admission',
              icon: <UserPlus className="w-3.5 h-3.5 text-emerald-400" />,
            },
            {
              label: 'Online Application (Public)',
              labelBn: 'অনলাইন আবেদন ফরম (পাবলিক)',
              href: '/admission',
              icon: <FileText className="w-3.5 h-3.5 text-sky-400" />,
              isExternal: true,
            },
          ],
        },
        {
          id: 'attendance',
          title: 'Attendance',
          titleBn: 'ডিজিটাল হাজিরা',
          subtitle: 'Live Daily Attendance',
          subtitleBn: 'দৈনিক লাইভ উপস্থিতি',
          href: '/dashboard/academic/attendance',
          icon: <CalendarCheck2 className="w-4 h-4" />,
          iconColor: 'text-amber-400',
          hoverBg: 'group-hover:bg-amber-500/20',
          liveDot: true,
        },
        {
          id: 'examination',
          title: 'Examination',
          titleBn: 'পরীক্ষা ও ফলাফল',
          subtitle: 'Exams, Marks & Results',
          subtitleBn: 'পরীক্ষা ও ফলাফল প্রসেসিং',
          icon: <Award className="w-4 h-4" />,
          iconColor: 'text-rose-400',
          hoverBg: 'group-hover:bg-rose-500/20',
          subItems: [
            {
              label: 'Exam Setup',
              labelBn: 'পরীক্ষা সেটআপ',
              href: '/dashboard/exam',
              icon: <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />,
            },
            {
              label: 'Admit Card',
              labelBn: 'প্রবেশপত্র জেনারেটর',
              href: '/dashboard/exam/admit-card',
              icon: <CreditCard className="w-3.5 h-3.5 text-amber-400" />,
            },
            {
              label: 'Marks Entry',
              labelBn: 'নম্বর এন্ট্রি',
              href: '/dashboard/exam/mark-entry',
              icon: <Edit3 className="w-3.5 h-3.5 text-indigo-400" />,
            },
            {
              label: 'Bulk Marks Entry',
              labelBn: 'বাল্ক নম্বর এন্ট্রি',
              href: '/dashboard/exam/bulk-entry',
              icon: <Layers className="w-3.5 h-3.5 text-violet-400" />,
            },
            {
              label: 'Tabulation Sheet',
              labelBn: 'মাস্টার ট্যাবুলেশন শীট',
              href: '/dashboard/exam/tabulation',
              icon: <ClipboardList className="w-3.5 h-3.5 text-teal-400" />,
            },
            {
              label: 'Merit List',
              labelBn: 'মেধাতালিকা ও র‍্যাঙ্ক',
              href: '/dashboard/exam/rank-result',
              icon: <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />,
            },
            {
              label: 'Report Card / Marksheet',
              labelBn: 'রিপোর্ট কার্ড ও মার্কশীট',
              href: '/dashboard/academic/marksheet',
              icon: <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />,
            },
            {
              label: 'Online Result (Public)',
              labelBn: 'অনলাইন ফলাফল পোর্টাল (পাবলিক)',
              href: '/result',
              icon: <Search className="w-3.5 h-3.5 text-sky-400" />,
              isExternal: true,
            },
          ],
        },
        {
          id: 'promotion',
          title: 'Promotion',
          titleBn: 'শ্রেণি উন্নয়ন',
          subtitle: 'Student Progression & Roll',
          subtitleBn: 'শ্রেণি উন্নয়ন ও মেধা রোল',
          icon: <TrendingUp className="w-4 h-4" />,
          iconColor: 'text-cyan-400',
          hoverBg: 'group-hover:bg-cyan-500/20',
          subItems: [
            {
              label: 'Class Promotion',
              labelBn: 'শ্রেণি প্রমোশন টুল',
              href: '/dashboard/academic/promotion',
              icon: <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />,
            },
            {
              label: 'Promotion History',
              labelBn: 'প্রমোশন লগ ও হিস্ট্রি',
              href: '/dashboard/academic/promotion#logs',
              icon: <History className="w-3.5 h-3.5 text-slate-400" />,
            },
          ],
        },
      ],
    },
    {
      header: 'ERP Administration & Finance',
      headerBn: 'প্রশাসন ও অর্থ • ERP',
      items: [
        {
          id: 'finance',
          title: 'Finance',
          titleBn: 'হিসাবরক্ষণ ও অর্থ',
          subtitle: 'Fee, Accounts & Payroll',
          subtitleBn: 'বেতন, ফি ও হিসাবরক্ষণ',
          icon: <Wallet className="w-4 h-4" />,
          iconColor: 'text-teal-400',
          hoverBg: 'group-hover:bg-teal-500/20',
          subItems: [
            {
              label: 'Fee Collection',
              labelBn: 'শিক্ষার্থী ফি ও বেতন আদায়',
              href: '/dashboard/finance?tab=student_fees',
              icon: <CreditCard className="w-3.5 h-3.5 text-teal-400" />,
            },
            {
              label: 'Expense Records',
              labelBn: 'ব্যয় ও খরচসমূহ',
              href: '/dashboard/finance?tab=expenses',
              icon: <Receipt className="w-3.5 h-3.5 text-rose-400" />,
            },
            {
              label: 'Staff Payroll',
              labelBn: 'শিক্ষক-কর্মচারী বেতন (Payroll)',
              href: '/dashboard/finance?tab=payroll',
              icon: <Banknote className="w-3.5 h-3.5 text-emerald-400" />,
            },
            {
              label: 'Cash & Bank Accounts',
              labelBn: 'ক্যাশ ও ব্যাংক লেজার',
              href: '/dashboard/finance?tab=cash_bank',
              icon: <Landmark className="w-3.5 h-3.5 text-indigo-400" />,
            },
            {
              label: 'Waivers & Refunds',
              labelBn: 'ফি মওকুফ ও রিফান্ড',
              href: '/dashboard/finance?tab=waivers_refunds',
              icon: <RotateCcw className="w-3.5 h-3.5 text-amber-400" />,
            },
            {
              label: 'Financial Reports & Dues',
              labelBn: 'বকেয়া ও আর্থিক রিপোর্ট',
              href: '/dashboard/finance?tab=reports',
              icon: <FileBarChart className="w-3.5 h-3.5 text-cyan-400" />,
            },
            {
              label: 'General Ledger',
              labelBn: 'খতিয়ান ও লেজার বই',
              href: '/dashboard/ledger',
              icon: <BookOpen className="w-3.5 h-3.5 text-violet-400" />,
            },
            {
              label: 'Stipend Management',
              labelBn: 'উপবৃত্তি ব্যবস্থাপনা',
              href: '/dashboard/stipend',
              icon: <Award className="w-3.5 h-3.5 text-amber-400" />,
            },
          ],
        },
        {
          id: 'communication',
          title: 'Communication',
          titleBn: 'যোগাযোগ ও নোটিশ',
          subtitle: 'SMS Broadcast & Notices',
          subtitleBn: 'এসএমএস ও নোটিশ বোর্ড',
          icon: <MessageSquareDot className="w-4 h-4" />,
          iconColor: 'text-orange-400',
          hoverBg: 'group-hover:bg-orange-500/20',
          badge: 'SMS',
          badgeColor: 'bg-orange-500/20 text-orange-300 font-bold',
          subItems: [
            {
              label: 'SMS Broadcast Hub',
              labelBn: 'এসএমএস ব্রডকাস্ট হাব',
              href: '/dashboard/sms',
              icon: <Send className="w-3.5 h-3.5 text-orange-400" />,
            },
            {
              label: 'Notice Board',
              labelBn: 'ডিজিটাল নোটিশ বোর্ড',
              href: '/dashboard/notices',
              icon: <Bell className="w-3.5 h-3.5 text-amber-400" />,
            },
          ],
        },
        {
          id: 'certificates',
          title: 'Certificates & Docs',
          titleBn: 'সনদপত্র ও ডকুমেন্টস',
          subtitle: 'Transcripts & Certificates',
          subtitleBn: 'প্রত্যয়ন, টিসি ও প্রশংসাপত্র',
          icon: <FileBadge className="w-4 h-4" />,
          iconColor: 'text-yellow-400',
          hoverBg: 'group-hover:bg-yellow-500/20',
          subItems: [
            {
              label: 'Testimonials & Transcripts',
              labelBn: 'প্রশংসাপত্র ও ট্রান্সক্রিপ্ট',
              href: '/dashboard/ssc-transcript',
              icon: <Award className="w-3.5 h-3.5 text-yellow-400" />,
            },
            {
              label: 'Certificates & Documents',
              labelBn: 'প্রত্যয়ন ও সনদপত্র তৈরি',
              href: '/dashboard/certificates',
              icon: <FileCheck className="w-3.5 h-3.5 text-emerald-400" />,
            },
          ],
        },
        {
          id: 'cms',
          title: 'Landing Page CMS',
          titleBn: 'ল্যান্ডিং পেইজ সিএমএস',
          subtitle: 'Public Website Manager',
          subtitleBn: 'স্কুল ওয়েবসাইট কন্ট্রোল',
          icon: <Globe className="w-4 h-4" />,
          iconColor: 'text-blue-400',
          hoverBg: 'group-hover:bg-blue-500/20',
          subItems: [
            {
              label: 'Landing Page Editor',
              labelBn: 'ওয়েবসাইট কন্টেন্ট এডিটর',
              href: '/dashboard/landing-page',
              icon: <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />,
            },
            {
              label: 'View Public Site',
              labelBn: 'পাবলিক ওয়েবসাইট দেখুন',
              href: '/',
              icon: <ExternalLink className="w-3.5 h-3.5 text-sky-400" />,
              isExternal: true,
            },
          ],
        },
        {
          id: 'admin',
          title: 'Administration',
          titleBn: 'সিস্টেম প্রশাসন',
          subtitle: 'Settings, Roles & Security',
          subtitleBn: 'সিস্টেম সেটিংস ও রোল',
          icon: <Sliders className="w-4 h-4" />,
          iconColor: 'text-pink-400',
          hoverBg: 'group-hover:bg-pink-500/20',
          subItems: [
            {
              label: 'School Settings',
              labelBn: 'স্কুল সাধারণ সেটিংস',
              href: '/dashboard/settings',
              icon: <Sliders className="w-3.5 h-3.5 text-pink-400" />,
            },
            {
              label: 'Managing Committee',
              labelBn: 'ম্যানেজিং কমিটি তালিকা',
              href: '/dashboard/settings?tab=committee',
              icon: <Users className="w-3.5 h-3.5 text-purple-400" />,
            },
          ],
        },
      ],
    },
  ];

  // ── TEACHER DEDICATED NAVIGATION (FOR NON-ADMIN ACCOUNTS) ──
  const TEACHER_ITEMS: MainNavItem[] = [
    {
      id: 'teacher_dashboard',
      title: 'Teacher Dashboard',
      titleBn: 'শিক্ষক ড্যাশবোর্ড',
      subtitle: 'Classes & Overview',
      subtitleBn: 'কমান্ড সেন্টার ও অ্যানালিটিক্স',
      href: '/dashboard/teacher-portal?tab=home',
      icon: <LayoutDashboard className="w-4 h-4" />,
      iconColor: 'text-indigo-400',
      hoverBg: 'group-hover:bg-indigo-500/20',
      badge: 'Live',
      badgeColor: 'bg-white/20 text-white',
    },
    {
      id: 'teacher_mark_entry',
      title: 'Exam Mark Entry',
      titleBn: 'নম্বর এন্ট্রি',
      subtitle: 'Subject Exam Marks',
      subtitleBn: 'বিষয়ভিত্তিক নম্বর প্রদান',
      href: '/dashboard/exam/mark-entry',
      icon: <Edit3 className="w-4 h-4" />,
      iconColor: 'text-rose-400',
      hoverBg: 'group-hover:bg-rose-500/20',
    },
    {
      id: 'teacher_attendance',
      title: 'Daily Attendance',
      titleBn: 'হাজিরা গ্রহণ',
      subtitle: 'Roll Call Attendance',
      subtitleBn: 'শ্রেণিভিত্তিক ডিজিটাল হাজিরা',
      href: '/dashboard/academic/attendance',
      icon: <CalendarCheck2 className="w-4 h-4" />,
      iconColor: 'text-amber-400',
      hoverBg: 'group-hover:bg-amber-500/20',
      liveDot: true,
    },
    {
      id: 'teacher_students',
      title: 'Class Students & Fees',
      titleBn: 'শিক্ষার্থী ও ফি',
      subtitle: 'Student Directory & Dues',
      subtitleBn: 'শ্রেণি শিক্ষার্থী ও বেতন',
      href: '/dashboard/teacher-portal?tab=students',
      icon: <Users className="w-4 h-4" />,
      iconColor: 'text-emerald-400',
      hoverBg: 'group-hover:bg-emerald-500/20',
    },
    {
      id: 'teacher_routine',
      title: 'Class Routine',
      titleBn: 'ক্লাস রুটিন',
      subtitle: 'Daily Class Timetable',
      subtitleBn: 'দৈনন্দিন পিরিয়ড ও সময়সূচি',
      href: '/dashboard/teacher-portal?tab=routine',
      icon: <Calendar className="w-4 h-4" />,
      iconColor: 'text-blue-400',
      hoverBg: 'group-hover:bg-blue-500/20',
    },
    {
      id: 'teacher_leaves',
      title: 'Leave Application',
      titleBn: 'ছুটির আবেদন',
      subtitle: 'Apply for Leave',
      subtitleBn: 'অনলাইন নৈমিত্তিক ছুটির আবেদন',
      href: '/dashboard/teacher-portal?tab=leaves',
      icon: <Send className="w-4 h-4" />,
      iconColor: 'text-cyan-400',
      hoverBg: 'group-hover:bg-cyan-500/20',
    },
    {
      id: 'teacher_notices',
      title: 'Notice Board',
      titleBn: 'নোটিশ বোর্ড',
      subtitle: 'School Announcements',
      subtitleBn: 'প্রাতিষ্ঠানিক জরুরি বিজ্ঞপ্তি',
      href: '/dashboard/notices',
      icon: <Bell className="w-4 h-4" />,
      iconColor: 'text-orange-400',
      hoverBg: 'group-hover:bg-orange-500/20',
    },
    {
      id: 'teacher_profile',
      title: 'Profile & Security',
      titleBn: 'প্রোফাইল ও নিরাপত্তা',
      subtitle: 'Personal Details & PIN',
      subtitleBn: 'শিক্ষক পরিচিতি ও পাসওয়ার্ড',
      href: '/dashboard/teacher-portal?tab=profile',
      icon: <UserCheck className="w-4 h-4" />,
      iconColor: 'text-purple-400',
      hoverBg: 'group-hover:bg-purple-500/20',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800/80 select-none transition-colors duration-200">
      
      {/* ── 1. BRAND HEADER WITH GRADIENT ACCENT ── */}
      <div className="h-20 px-5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        <Link
          href="/"
          onClick={handleLinkClick}
          className="flex items-center gap-3.5 hover:opacity-95 transition-opacity min-w-0 group"
          title="মূল হোমপেজে যান"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/30 shrink-0 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
              {schoolSettings?.schoolLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={schoolSettings.schoolLogo} alt="Logo" className="w-7 h-7 object-contain" />
              ) : (
                <GraduationCap className="w-6 h-6 text-indigo-400" />
              )}
            </div>
          </div>
          <div className="overflow-hidden min-w-0">
            <h1 className="font-bold text-white text-sm sm:text-base tracking-tight leading-tight truncate group-hover:text-indigo-300 transition-colors">
              {schoolSettings?.schoolName || 'Baraitali High School'}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5 truncate">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
              <span>EIIN: {schoolSettings?.eiin || '106184'} • {schoolSettings?.address ? schoolSettings.address.split(',')[1]?.trim() || 'চকরিয়া' : 'চকরিয়া'}</span>
            </p>
          </div>
        </Link>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition lg:hidden shrink-0"
            title="মেনু বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── 2. ACADEMIC YEAR QUICK SWITCHER PILL ── */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <CalendarRange className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold truncate">
                {currentLang === 'en' ? 'Session' : 'শিক্ষাবর্ষ (Session)'}
              </p>
              <p className="text-xs font-bold text-white truncate">Academic Year 2026</p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full shrink-0">
            Active
          </span>
        </div>
      </div>

      {/* ── 3. SCROLLABLE NAVIGATION MENU ITEMS ── */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        
        {isAdmin ? (
          /* ── ADMIN TIERED SECTIONS ── */
          ADMIN_SECTIONS.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {currentLang === 'en' ? section.header : section.headerBn}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const isDirect = Boolean(item.href);
                  const isDirectActive = isDirect && item.href ? isItemActive(item.href) : false;
                  const isGActive = isGroupActive(item);
                  const isExpanded = openGroups[item.id] ?? isGActive;

                  if (isDirect && item.href) {
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={handleLinkClick}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                          isDirectActive
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/35 font-bold'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isDirectActive
                                ? 'bg-white/20 text-white'
                                : `bg-slate-800 ${item.hoverBg} ${item.iconColor}`
                            }`}
                          >
                            {item.icon}
                          </span>
                          <div className="leading-tight min-w-0">
                            <span className="block font-semibold truncate text-xs sm:text-sm">
                              {currentLang === 'en' ? item.title : item.title}
                            </span>
                            <span
                              className={`text-[11px] block truncate ${
                                isDirectActive ? 'text-white/80' : 'text-slate-400'
                              }`}
                            >
                              {currentLang === 'en' ? item.subtitle : item.subtitleBn}
                            </span>
                          </div>
                        </div>

                        {item.badge && (
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                              item.badgeColor || 'bg-white/20 text-white'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {item.liveDot && (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                        )}
                      </Link>
                    );
                  }

                  // Collapsible Submenu Item
                  return (
                    <div key={item.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleGroup(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                          isGActive
                            ? 'bg-slate-800/90 text-white border border-slate-700/60 font-bold'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isGActive
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : `bg-slate-800 ${item.hoverBg} ${item.iconColor}`
                            }`}
                          >
                            {item.icon}
                          </span>
                          <div className="text-left leading-tight min-w-0">
                            <span className="block font-semibold truncate text-xs sm:text-sm">
                              {currentLang === 'en' ? item.title : item.title}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {currentLang === 'en' ? item.subtitle : item.subtitleBn}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.badge && (
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                item.badgeColor || 'bg-indigo-500/20 text-indigo-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}

                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400 transition-transform duration-200" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500 transition-transform duration-200" />
                          )}
                        </div>
                      </button>

                      {/* Submenu Children */}
                      {isExpanded && item.subItems && (
                        <div className="mt-1 ml-6 pl-4 border-l border-slate-800 space-y-1 py-0.5">
                          {item.subItems.map((sub) => {
                            const subActive = isItemActive(sub.href);
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={handleLinkClick}
                                className={`flex items-center justify-between py-2 px-3 rounded-xl text-xs transition-all group ${
                                  subActive
                                    ? 'bg-indigo-600/30 text-white font-bold border border-indigo-500/40 shadow-xs'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                }`}
                              >
                                <span className="flex items-center gap-2.5 truncate">
                                  {sub.icon}
                                  <span className="truncate">
                                    {currentLang === 'en' ? sub.label : sub.labelBn}
                                  </span>
                                </span>

                                {sub.badge !== undefined && sub.badge !== null && (
                                  <span
                                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md shrink-0 ${
                                      sub.badgeColor || 'bg-indigo-500/20 text-indigo-300'
                                    }`}
                                  >
                                    {sub.badge}
                                  </span>
                                )}

                                {sub.isExternal && (
                                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" />
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          /* ── TEACHER DEDICATED ITEMS ── */
          <div className="space-y-1">
            <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {currentLang === 'en' ? 'Teacher Portal' : 'শিক্ষক সেবা ও কার্যক্রম'}
            </p>

            <div className="space-y-1.5">
              {TEACHER_ITEMS.map((item) => {
                const active = item.href ? isItemActive(item.href) : false;
                return (
                  <Link
                    key={item.id}
                    href={item.href || '/dashboard/teacher-portal'}
                    onClick={handleLinkClick}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      active
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/35 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          active
                            ? 'bg-white/20 text-white'
                            : `bg-slate-800 ${item.hoverBg} ${item.iconColor}`
                        }`}
                      >
                        {item.icon}
                      </span>
                      <div className="leading-tight min-w-0">
                        <span className="block font-semibold truncate text-xs sm:text-sm">
                          {currentLang === 'en' ? item.title : item.title}
                        </span>
                        <span
                          className={`text-[11px] block truncate ${
                            active ? 'text-white/80' : 'text-slate-400'
                          }`}
                        >
                          {currentLang === 'en' ? item.subtitle : item.subtitleBn}
                        </span>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                          item.badgeColor || 'bg-white/20 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {item.liveDot && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* ── 4. SIDEBAR FOOTER / USER PROFILE CARD ── */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60 shrink-0">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow">
                {session?.teacherName
                  ? session.teacherName.charAt(0)
                  : isAdmin
                  ? 'AU'
                  : 'TC'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {session?.teacherName ||
                  (isAdmin
                    ? schoolSettings?.principalName || 'Admin User'
                    : 'Teacher')}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {isAdmin
                  ? 'প্রধান প্রশাসক • Super Admin'
                  : 'সহকারী শিক্ষক • Faculty'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    const handleStorage = () => {
      setSession(teacherAuthService.getSession());
    };
    handleStorage();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <>
      {/* Desktop Sidebar (w-72 matches modern high-end ERP layout) */}
      <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 h-screen sticky top-0 z-30 print:hidden">
        <React.Suspense
          fallback={
            <div className="w-72 bg-slate-900 h-screen border-r border-slate-800" />
          }
        >
          <SidebarContent session={session} />
        </React.Suspense>
      </aside>

      {/* Mobile Overlay Sidebar Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 print:hidden ${
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
        />
        {/* Drawer */}
        <aside
          className={`absolute left-0 top-0 bottom-0 w-72 shadow-2xl transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <React.Suspense
            fallback={
              <div className="w-72 bg-slate-900 h-full border-r border-slate-800" />
            }
          >
            <SidebarContent session={session} onClose={onClose} />
          </React.Suspense>
        </aside>
      </div>
    </>
  );
}
