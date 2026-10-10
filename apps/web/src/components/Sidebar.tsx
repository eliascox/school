'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  History,
  GraduationCap,
  Users,
  UserPlus,
  Grid3X3,
  Calendar,
  School,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  UserCheck,
  FileText,
  Edit3,
  Award,
  BookOpen,
  X,
  DollarSign,
  BarChart3,
  ClipboardList,
  MessageSquare,
  Printer,
  Layers,
  SlidersHorizontal,
  Banknote,
  Receipt,
  Landmark,
  RotateCcw,
  FileBarChart,
  FileCheck,
  Send,
  Search
} from 'lucide-react';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import { languageService, AppLanguage } from '@/services/languageService';
import { settingsService, SchoolSettings } from '@/services/settingsService';

interface NavItem {
  label: string;
  labelBn: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

interface NavGroup {
  title: string;
  titleBn: string;
  icon: React.ReactNode;
  items: NavItem[];
  adminOnly?: boolean;
}

/*
 * Admin navigation — restructured to the target information architecture
 * (see docs/audit/02_CURRENT_TO_NEW_MENU_MAPPING.md).
 *
 * IMPORTANT: every href below is an EXISTING route. No URL was changed, so old
 * bookmarks keep working. Target items marked "NEW FEATURE REQUIRED" in the
 * mapping doc (Guardians, Academic Calendar, Student Documents, Reports hub,
 * Users, Roles & Permissions, Audit Log viewer, Help & Support) are intentionally
 * NOT listed until those pages actually exist — no placeholder pages.
 */
const DASHBOARD_LINK: NavItem = {
  label: 'Dashboard',
  labelBn: 'ড্যাশবোর্ড',
  href: '/dashboard',
  icon: <LayoutDashboard className="w-5 h-5" />,
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'People',
    titleBn: 'শিক্ষার্থী ও জনবল',
    icon: <Users className="w-5 h-5" />,
    items: [
      { label: 'Students', labelBn: 'শিক্ষার্থী তালিকা', href: '/dashboard/students', icon: <Users className="w-4 h-4" /> },
      { label: 'Student Print & Reports', labelBn: 'তালিকা প্রিন্ট ও রিপোর্ট', href: '/dashboard/students?view=print', icon: <Printer className="w-4 h-4" /> },
      { label: 'Teachers & Staff', labelBn: 'শিক্ষক ও স্টাফ', href: '/dashboard/teacher', icon: <UserCheck className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Academic',
    titleBn: 'একাডেমিক',
    icon: <GraduationCap className="w-5 h-5" />,
    items: [
      { label: 'Classes & Sections', labelBn: 'শ্রেণি ও শাখা', href: '/dashboard/academic/classes', icon: <School className="w-4 h-4" /> },
      { label: 'Section Overview', labelBn: 'শাখা সারসংক্ষেপ', href: '/dashboard/academic', icon: <Grid3X3 className="w-4 h-4" /> },
      { label: 'Subjects', labelBn: 'বিষয় ও পাঠ্যক্রম', href: '/dashboard/academic/curriculum', icon: <BookOpen className="w-4 h-4" /> },
      { label: 'Academic Session', labelBn: 'শিক্ষাবর্ষ ও সেশন', href: '/dashboard/academic/session', icon: <Calendar className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Admissions',
    titleBn: 'ভর্তি',
    icon: <UserPlus className="w-5 h-5" />,
    items: [
      { label: 'New Admission', labelBn: 'নতুন ভর্তি', href: '/dashboard/admission', icon: <UserPlus className="w-4 h-4" /> },
      { label: 'Online Application (Public)', labelBn: 'অনলাইন আবেদন ফর্ম (পাবলিক)', href: '/admission', icon: <FileText className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Attendance',
    titleBn: 'হাজিরা',
    icon: <ClipboardList className="w-5 h-5" />,
    items: [
      { label: 'Daily Attendance', labelBn: 'দৈনিক হাজিরা', href: '/dashboard/academic/attendance', icon: <UserCheck className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Examination',
    titleBn: 'পরীক্ষা',
    icon: <FileText className="w-5 h-5" />,
    items: [
      { label: 'Exam Setup', labelBn: 'পরীক্ষা সেটআপ', href: '/dashboard/exam', icon: <SlidersHorizontal className="w-4 h-4" /> },
      { label: 'Admit Card', labelBn: 'প্রবেশপত্র', href: '/dashboard/exam/admit-card', icon: <CreditCard className="w-4 h-4" /> },
      { label: 'Marks Entry', labelBn: 'নম্বর এন্ট্রি', href: '/dashboard/exam/mark-entry', icon: <Edit3 className="w-4 h-4" /> },
      { label: 'Bulk Marks Entry', labelBn: 'বাল্ক নম্বর এন্ট্রি', href: '/dashboard/exam/bulk-entry', icon: <Layers className="w-4 h-4" /> },
      { label: 'Tabulation Sheet', labelBn: 'ট্যাবুলেশন শীট', href: '/dashboard/exam/tabulation', icon: <ClipboardList className="w-4 h-4" /> },
      { label: 'Merit List', labelBn: 'মেধা তালিকা', href: '/dashboard/exam/rank-result', icon: <BarChart3 className="w-4 h-4" /> },
      { label: 'Report Card', labelBn: 'রিপোর্ট কার্ড / মার্কশীট', href: '/dashboard/academic/marksheet', icon: <GraduationCap className="w-4 h-4" /> },
      { label: 'Online Result (Public)', labelBn: 'অনলাইন ফলাফল (পাবলিক)', href: '/result', icon: <Search className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Promotion',
    titleBn: 'প্রমোশন',
    icon: <TrendingUp className="w-5 h-5" />,
    items: [
      { label: 'Class Promotion', labelBn: 'শ্রেণি প্রমোশন', href: '/dashboard/academic/promotion', icon: <TrendingUp className="w-4 h-4" /> },
      { label: 'Promotion History', labelBn: 'প্রমোশন হিস্ট্রি', href: '/dashboard/academic/promotion#logs', icon: <History className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Finance',
    titleBn: 'ফাইন্যান্স',
    icon: <DollarSign className="w-5 h-5" />,
    items: [
      { label: 'Fee Collection', labelBn: 'ফি আদায়', href: '/dashboard/finance?tab=student_fees', icon: <CreditCard className="w-4 h-4" /> },
      { label: 'Expenses', labelBn: 'ব্যয়', href: '/dashboard/finance?tab=expenses', icon: <Receipt className="w-4 h-4" /> },
      { label: 'Payroll', labelBn: 'শিক্ষক ও স্টাফ বেতন', href: '/dashboard/finance?tab=payroll', icon: <Banknote className="w-4 h-4" /> },
      { label: 'Cash & Bank', labelBn: 'ক্যাশ ও ব্যাংক', href: '/dashboard/finance?tab=cash_bank', icon: <Landmark className="w-4 h-4" /> },
      { label: 'Waivers & Refunds', labelBn: 'মওকুফ ও ফেরত', href: '/dashboard/finance?tab=waivers_refunds', icon: <RotateCcw className="w-4 h-4" /> },
      { label: 'Dues & Financial Reports', labelBn: 'বকেয়া ও আর্থিক রিপোর্ট', href: '/dashboard/finance?tab=reports', icon: <FileBarChart className="w-4 h-4" /> },
      { label: 'General Ledger', labelBn: 'খতিয়ান / লেজার', href: '/dashboard/ledger', icon: <BookOpen className="w-4 h-4" /> },
      { label: 'Stipend', labelBn: 'উপবৃত্তি', href: '/dashboard/stipend', icon: <Award className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Communication',
    titleBn: 'যোগাযোগ',
    icon: <MessageSquare className="w-5 h-5" />,
    items: [
      { label: 'SMS', labelBn: 'এসএমএস', href: '/dashboard/sms', icon: <Send className="w-4 h-4" /> },
      { label: 'Notice Board', labelBn: 'নোটিশ বোর্ড', href: '/dashboard/notices', icon: <Bell className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Certificates & Documents',
    titleBn: 'সনদপত্র ও ডকুমেন্টস',
    icon: <Award className="w-5 h-5" />,
    items: [
      { label: 'Testimonials', labelBn: 'প্রশংসাপত্র', href: '/dashboard/ssc-transcript', icon: <Award className="w-4 h-4" /> },
      { label: 'Certificates & Documents', labelBn: 'সনদ ও ডকুমেন্টস', href: '/dashboard/certificates', icon: <FileCheck className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Administration',
    titleBn: 'প্রশাসন',
    icon: <Settings className="w-5 h-5" />,
    items: [
      { label: 'School Settings', labelBn: 'স্কুল সেটিংস', href: '/dashboard/settings', icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

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

  useEffect(() => {
    setCurrentLang(languageService.getLanguage());
    setSchoolSettings(settingsService.getSettings());
    const unsub = languageService.subscribe((lang) => setCurrentLang(lang));
    return () => unsub();
  }, []);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isActive = (href: string) => {
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
        return currentTab === paramTab;
      }
      return false;
    }
    return pathname === href && !searchParams?.get('view');
  };

  const isGroupActive = (group: NavGroup) =>
    group.items.some((item) => {
      const base = item.href.split('?')[0];
      return pathname === base;
    });

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white border-r border-slate-200 dark:border-slate-800/80 select-none transition-colors duration-200">
      {/* Brand */}
      <div className="flex items-center justify-between gap-3 px-4 py-5 border-b border-slate-100 dark:border-slate-800/80">
        <Link 
          href={!isAdmin ? "/dashboard/teacher-portal?tab=home" : "/dashboard"}
          onClick={handleLinkClick}
          className="flex items-center gap-3 hover:opacity-90 transition-opacity min-w-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center font-black text-sm text-white shadow-md shadow-indigo-500/20 shrink-0">
            {schoolSettings?.schoolName ? schoolSettings.schoolName.charAt(0) : 'ব'}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-extrabold text-xs sm:text-sm tracking-tight leading-tight text-slate-900 dark:text-white truncate">
              {schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
            </h1>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block truncate">
              {!isAdmin ? 'শিক্ষক ম্যানেজমেন্ট পোর্টাল' : (currentLang === 'en' ? 'Digital School SMS' : 'ডিজিটাল ম্যানেজমেন্ট')}
            </span>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">

        {!isAdmin ? (
          /* ─── TEACHER DEDICATED SIDEBAR NAVIGATION ─── */
          <div className="space-y-1.5">
            <Link
              href="/dashboard/teacher-portal?tab=home"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-black transition mb-2 group ${
                pathname === '/dashboard/teacher-portal' && (!currentTab || currentTab === 'home')
                  ? 'bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25'
                  : 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/80 border border-indigo-100 dark:border-indigo-900/50'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                pathname === '/dashboard/teacher-portal' && (!currentTab || currentTab === 'home')
                  ? 'bg-white/20 text-white'
                  : 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
              }`}>
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <span className="truncate">{currentLang === 'en' ? 'Teacher Dashboard' : 'শিক্ষক ড্যাশবোর্ড'}</span>
            </Link>

            <div className="pt-2 pb-1 px-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">শিক্ষক সেবা ও কার্যক্রম</span>
            </div>

            <Link
              href="/dashboard/exam/mark-entry"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-2xl text-xs font-bold transition group ${
                pathname === '/dashboard/exam/mark-entry'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black border border-indigo-200 dark:border-indigo-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <Edit3 className="w-4 h-4" />
              </div>
              <span className="truncate">{currentLang === 'en' ? 'Mark Entry' : 'নম্বর এন্ট্রি'}</span>
            </Link>

            <Link
              href="/dashboard/academic/attendance"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-2xl text-xs font-bold transition group ${
                pathname === '/dashboard/academic/attendance'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-black border border-teal-200 dark:border-teal-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="truncate">{currentLang === 'en' ? 'Daily Attendance' : 'হাজিরা গ্রহণ'}</span>
            </Link>

            <Link
              href="/dashboard/teacher-portal?tab=students"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-2xl text-xs font-bold transition group ${
                pathname === '/dashboard/teacher-portal' && currentTab === 'students'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black border border-emerald-200 dark:border-emerald-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <Users className="w-4 h-4" />
              </div>
              <span className="truncate">{currentLang === 'en' ? 'Class Students & Fees' : 'শিক্ষার্থী ও ফি (শ্রেণি শিক্ষক)'}</span>
            </Link>

            <Link
              href="/dashboard/teacher-portal?tab=routine"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-2xl text-xs font-bold transition group ${
                pathname === '/dashboard/teacher-portal' && currentTab === 'routine'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black border border-blue-200 dark:border-blue-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="truncate">{currentLang === 'en' ? 'Class Routine' : 'ক্লাস রুটিন'}</span>
            </Link>

            <Link
              href="/dashboard/teacher-portal?tab=leaves"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-2xl text-xs font-bold transition group ${
                pathname === '/dashboard/teacher-portal' && currentTab === 'leaves'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-black border border-amber-200 dark:border-amber-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <Send className="w-4 h-4" />
              </div>
              <span className="truncate">{currentLang === 'en' ? 'Leave Application' : 'ছুটির আবেদন'}</span>
            </Link>

            <div className="pt-2 pb-1 px-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">প্রতিষ্ঠানিক নোটিশ ও প্রোফাইল</span>
            </div>

            <Link
              href="/dashboard/notices"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-2xl text-xs font-bold transition group ${
                pathname === '/dashboard/notices'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-black border border-rose-200 dark:border-rose-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <Bell className="w-4 h-4" />
              </div>
              <span className="truncate">{currentLang === 'en' ? 'Notice Board' : 'নোটিশ বোর্ড'}</span>
            </Link>

            <Link
              href="/dashboard/teacher-portal?tab=profile"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-2xl text-xs font-bold transition group ${
                pathname === '/dashboard/teacher-portal' && currentTab === 'profile'
                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-black border border-purple-200 dark:border-purple-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="truncate">{currentLang === 'en' ? 'Profile & Audit' : 'প্রোফাইল ও অডিট'}</span>
            </Link>
          </div>
        ) : (
          /* ─── ADMIN NAVIGATION GROUPS ─── */
          <div className="space-y-1">
            <Link
              href={DASHBOARD_LINK.href}
              onClick={handleLinkClick}
              className={`flex items-center gap-2.5 px-2.5 py-2 mb-1 rounded-2xl text-xs sm:text-sm font-bold transition-all group ${
                isActive(DASHBOARD_LINK.href)
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-black'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isActive(DASHBOARD_LINK.href)
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950/60 dark:group-hover:text-indigo-300'
              }`}>
                {DASHBOARD_LINK.icon}
              </div>
              <span className="font-extrabold truncate">{currentLang === 'en' ? DASHBOARD_LINK.label : DASHBOARD_LINK.labelBn}</span>
            </Link>

            {NAV_GROUPS.map((group) => {
              const groupItems = group.items;
              if (!groupItems.length) return null;

              const isGActive = isGroupActive(group);
              const isExpanded = openGroups[group.title] ?? isGActive;

              return (
                <div key={group.title} className="space-y-0.5">
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className={`flex items-center justify-between w-full px-2.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all group cursor-pointer ${
                      isGActive
                        ? 'bg-slate-100/90 dark:bg-slate-800/80 text-indigo-700 dark:text-indigo-300 font-black'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        isGActive
                          ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/25'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950/60 dark:group-hover:text-indigo-300'
                      }`}>
                        {group.icon}
                      </div>
                      <span className="font-extrabold">{currentLang === 'en' ? group.title : group.titleBn}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="ml-3 pl-3 border-l-2 border-slate-200/80 dark:border-slate-800 space-y-0.5 py-1">
                      {groupItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleLinkClick}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all group ${
                            isActive(item.href)
                              ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/25 font-black'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            isActive(item.href)
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-100/80 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950/60 dark:group-hover:text-indigo-300'
                          }`}>
                            {item.icon}
                          </div>
                          <span className="truncate">{currentLang === 'en' ? item.label : item.labelBn}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </nav>
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
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 h-screen sticky top-0 z-30 print:hidden">
        <React.Suspense fallback={<div className="w-64 bg-white dark:bg-slate-950 h-screen border-r border-slate-200 dark:border-slate-800" />}>
          <SidebarContent session={session} />
        </React.Suspense>
      </aside>

      {/* Mobile Overlay Sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 print:hidden ${
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
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
          <React.Suspense fallback={<div className="w-72 bg-white dark:bg-slate-950 h-full border-r border-slate-200 dark:border-slate-800" />}>
            <SidebarContent session={session} onClose={onClose} />
          </React.Suspense>
        </aside>
      </div>
    </>
  );
}
