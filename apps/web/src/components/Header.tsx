'use client';

import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  ShieldCheck, 
  User as UserIcon, 
  Menu, 
  X, 
  Globe,
  LayoutDashboard,
  UserPlus,
  Users,
  BookOpen,
  Calendar,
  Layers,
  CheckSquare,
  FileSpreadsheet,
  FileCheck,
  Award,
  CreditCard,
  GraduationCap,
  MessageSquare,
  BadgeCheck,
  Settings,
  FileText,
  Printer,
  Sun,
  Moon,
  LogOut,
  Cloud,
  CloudOff,
  RefreshCw,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import { languageService, AppLanguage } from '@/services/languageService';
import { settingsService } from '@/services/settingsService';
import { themeService, AppTheme } from '@/services/themeService';
import { syncQueueService, SyncStatus } from '@/services/syncQueueService';
import { leaveService } from '@/services/leaveService';

interface HeaderProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

interface PageInfo {
  title: string;
  icon: React.ReactNode;
}

const getPageInfo = (pathname: string, searchParams: any, lang: AppLanguage): PageInfo => {
  const currentTab = searchParams ? searchParams.get('tab') : null;
  const currentView = searchParams ? searchParams.get('view') : null;

  // 1. Exact Dashboard Home
  if (pathname === '/dashboard') {
    return {
      title: lang === 'en' ? 'Dashboard' : 'ড্যাশবোর্ড',
      icon: <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
    };
  }

  // 2. Student Admission
  if (pathname.includes('/admission')) {
    return {
      title: lang === 'en' ? 'Student Admission' : 'শিক্ষার্থী ভর্তি',
      icon: <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
    };
  }

  // 3. Students & Print List
  if (pathname.includes('/students')) {
    if (currentView === 'print') {
      return {
        title: lang === 'en' ? 'Student Print & Reports' : 'তালিকা প্রিন্ট ও রিপোর্ট',
        icon: <Printer className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
      };
    }
    return {
      title: lang === 'en' ? 'Student List' : 'শিক্ষার্থী তালিকা',
      icon: <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
    };
  }

  // 4. Stipend
  if (pathname.includes('/stipend')) {
    return {
      title: lang === 'en' ? 'Stipend & Grants' : 'উপবৃত্তি ও অনুদান',
      icon: <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
    };
  }

  // 5. Academic Submodules
  if (pathname.includes('/academic/curriculum')) {
    return {
      title: lang === 'en' ? 'Curriculum & Subjects' : 'পাঠ্যক্রম ও বিষয়',
      icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
    };
  }
  if (pathname.includes('/academic/promotion')) {
    return {
      title: lang === 'en' ? 'Student Promotion' : 'শ্রেণি উন্নীতকরণ',
      icon: <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
    };
  }
  if (pathname.includes('/academic/session')) {
    return {
      title: lang === 'en' ? 'Session & Academic Year' : 'সেশন ও শিক্ষাবর্ষ',
      icon: <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
    };
  }
  if (pathname.includes('/academic/classes')) {
    return {
      title: lang === 'en' ? 'Classes & Subjects' : 'শ্রেণি ও বিষয়',
      icon: <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
    };
  }
  if (pathname.includes('/academic/attendance')) {
    return {
      title: lang === 'en' ? 'Daily Attendance' : 'দৈনিক হাজিরা',
      icon: <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
    };
  }
  if (pathname.includes('/academic/marksheet')) {
    return {
      title: lang === 'en' ? 'Marksheet & Gradesheet' : 'মার্কশীট ও গ্রেডশিট',
      icon: <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
    };
  }
  if (pathname === '/dashboard/academic' || pathname.includes('/academic/grades')) {
    return {
      title: lang === 'en' ? 'Manage Section' : 'শাখা ব্যবস্থাপনা',
      icon: <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
    };
  }

  // 6. Examination Submodules
  if (pathname.includes('/exam/mark-entry')) {
    return {
      title: lang === 'en' ? 'Mark Entry' : 'নম্বর এন্ট্রি',
      icon: <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
    };
  }
  if (pathname.includes('/exam/bulk-entry')) {
    return {
      title: lang === 'en' ? 'Bulk Result Entry' : 'বাল্ক ফলাফল এন্ট্রি',
      icon: <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
    };
  }
  if (pathname.includes('/exam/admit-card')) {
    return {
      title: lang === 'en' ? 'Exam Admit Card' : 'প্রবেশপত্র',
      icon: <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
    };
  }
  if (pathname.includes('/ssc-transcript')) {
    return {
      title: lang === 'en' ? 'SSC Testimonials' : 'এসএসসি প্রশংসাপত্র',
      icon: <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
    };
  }
  if (pathname.includes('/exam/tabulation')) {
    return {
      title: lang === 'en' ? 'Tabulation Sheet' : 'ট্যাবুলেশন শীট',
      icon: <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
    };
  }
  if (pathname.includes('/exam/rank-result')) {
    return {
      title: lang === 'en' ? 'Merit List & Result' : 'মেধা তালিকা ও ফলাফল',
      icon: <Award className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
    };
  }
  if (pathname === '/dashboard/exam' || pathname.includes('/exam/setup') || pathname.includes('/exam')) {
    return {
      title: lang === 'en' ? 'Exam Setup' : 'পরীক্ষা সেটআপ',
      icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
    };
  }

  // 7. Finance & Accounts
  if (pathname.includes('/finance')) {
    let title = lang === 'en' ? 'Student Fee Collection' : 'শিক্ষার্থী ফি আদায়';
    if (currentTab === 'payroll' || currentTab === 'salary') title = lang === 'en' ? 'Teacher & Staff Payroll' : 'শিক্ষক ও স্টাফ বেতন';
    if (currentTab === 'expenses') title = lang === 'en' ? 'Daily Expenses' : 'দৈনন্দিন ব্যয়';
    if (currentTab === 'cash_bank' || currentTab === 'accounts') title = lang === 'en' ? 'Cash & Bank Accounts' : 'ক্যাশ ও ব্যাংক হিসাব';
    if (currentTab === 'waivers_refunds' || currentTab === 'waiver') title = lang === 'en' ? 'Waivers & Refunds' : 'মওকুফ ও ছাড়';
    if (currentTab === 'reports') title = lang === 'en' ? 'Financial Reports' : 'আর্থিক বিবরণী ও রিপোর্ট';
    return {
      title,
      icon: <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
    };
  }

  // 8. Standalone Modules
  if (pathname.includes('/certificates')) {
    return {
      title: lang === 'en' ? 'Attestation Certificates' : 'প্রত্যয়ন পত্র',
      icon: <FileCheck className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
    };
  }
  if (pathname.includes('/sms')) {
    return {
      title: lang === 'en' ? 'SMS Broadcast Panel' : 'এসএমএস প্যানেল',
      icon: <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-sky-500" />
    };
  }
  if (pathname.includes('/teacher-portal')) {
    return {
      title: lang === 'en' ? 'Teacher Portal' : 'শিক্ষক পোর্টাল ও ড্যাশবোর্ড',
      icon: <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
    };
  }
  if (pathname.includes('/teacher')) {
    if (currentTab === 'leave_applications') {
      return {
        title: lang === 'en' ? 'Teacher Leave Review' : 'ছুটির আবেদনসমূহ (প্রধান শিক্ষক)',
        icon: <Send className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
      };
    }
    return {
      title: lang === 'en' ? 'Teacher & Staff Management' : 'শিক্ষক ও স্টাফ ব্যবস্থাপনা',
      icon: <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
    };
  }
  if (pathname.includes('/ledger')) {
    return {
      title: lang === 'en' ? 'General Ledger' : 'খতিয়ান ও লেজারবুক',
      icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
    };
  }
  if (pathname.includes('/notices')) {
    return {
      title: lang === 'en' ? 'Notice Board' : 'নোটিশ বোর্ড',
      icon: <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
    };
  }
  if (pathname.includes('/settings')) {
    return {
      title: lang === 'en' ? 'System Settings' : 'সিস্টেম সেটিংস',
      icon: <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
    };
  }
  if (pathname.includes('/hr')) {
    return {
      title: lang === 'en' ? 'HR & Staff' : 'এইচআর ও কর্মকর্তা',
      icon: <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
    };
  }
  if (pathname.includes('/mobile-app')) {
    return {
      title: lang === 'en' ? 'Mobile App & QR' : 'মোবাইল অ্যাপ ও কিউআর',
      icon: <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
    };
  }

  return {
    title: lang === 'en' ? 'Dashboard' : 'ড্যাশবোর্ড',
    icon: <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
  };
};

export default function Header({ onMenuToggle, isSidebarOpen }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLang, setCurrentLang] = useState<AppLanguage>('bn');
  const [currentTheme, setCurrentTheme] = useState<AppTheme>('light');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    pendingCount: 0,
    isSyncing: false
  });
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);

  useEffect(() => {
    const updateLeaves = () => {
      try {
        const leaves = leaveService.getLeaves();
        setPendingLeavesCount(leaves.filter(l => l.status === 'pending').length);
      } catch (e) {}
    };
    updateLeaves();
    const unsubLeaves = leaveService.subscribe(updateLeaves);
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', updateLeaves);
    }
    return () => {
      unsubLeaves();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', updateLeaves);
      }
    };
  }, []);

  useEffect(() => {
    setSyncStatus(syncQueueService.getSyncStatus());
    const handleSyncChange = (e: any) => {
      setSyncStatus(e.detail);
    };
    window.addEventListener('sms:sync-status-changed', handleSyncChange);
    return () => {
      window.removeEventListener('sms:sync-status-changed', handleSyncChange);
    };
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      const activeSession = teacherAuthService.getSession();
      if (!activeSession) {
        router.push('/login');
      } else {
        setSession(activeSession);
      }
      setIsLoading(false);
    };

    handleStorage();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [router]);

  useEffect(() => {
    setCurrentLang(languageService.getLanguage());
    const unsubLang = languageService.subscribe((lang) => setCurrentLang(lang));
    
    setCurrentTheme(themeService.getTheme());
    const unsubTheme = themeService.subscribe((theme) => setCurrentTheme(theme));

    return () => {
      unsubLang();
      unsubTheme();
    };
  }, []);

  const handleLanguageChange = (lang: AppLanguage) => {
    languageService.setLanguage(lang);
    settingsService.updateSettings({ language: lang });
  };

  const handleToggleTheme = () => {
    const newTheme = themeService.toggleTheme();
    setCurrentTheme(newTheme);
    settingsService.updateSettings({ theme: newTheme });
  };

  if (isLoading)
    return (
      <header className="h-14 lg:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center sticky top-0 z-40 shadow-sm print:hidden">
        <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </header>
    );
  if (!session) return null;

  const pageInfo = getPageInfo(pathname, searchParams, currentLang);

  return (
    <header className="h-14 lg:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs transition-colors duration-200 print:hidden">
      {/* Left: Hamburger (mobile) + Active Menu / Page Title with Icon */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Dynamic Active Menu Icon & Title */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center shrink-0 shadow-2xs">
            {pageInfo.icon}
          </div>
          <h1 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {pageInfo.title}
          </h1>
        </div>
      </div>

      {/* Center / Right-Middle: Date & Active Status Pill (as circled in user image) */}
      <div className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
        <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span className="font-extrabold">
          {currentLang === 'en' 
            ? new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
            : new Date().toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <span className="text-slate-300 dark:text-slate-600 font-normal">•</span>
        <span className="flex items-center gap-1.5 text-[11px] font-black text-emerald-600 dark:text-emerald-400 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {session.role === 'teacher' 
            ? (currentLang === 'en' ? 'Teacher Dashboard Active' : 'শিক্ষক ড্যাশবোর্ড সক্রিয়') 
            : (currentLang === 'en' ? 'System Active' : 'সিস্টেম সক্রিয়')}
        </span>
      </div>

      {/* Right: Theme Toggle + Language Switcher + Notifications + User */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* 🖨️ BLANK ADMISSION FORM PRINT BUTTON (When on Admission Page) */}
        {pathname.includes('/admission') && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open_blank_admission_modal'))}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition shadow-sm cursor-pointer active:scale-95 shrink-0"
            title={currentLang === 'en' ? 'Print Blank Form' : 'অফিশিয়াল ব্ল্যাঙ্ক ফরম প্রিন্ট'}
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{currentLang === 'en' ? 'Blank Form Print' : 'ব্ল্যাঙ্ক ফরম প্রিন্ট'}</span>
          </button>
        )}

        {/* ✉️ TEACHER LEAVE APPLICATIONS ALERT BADGE (FOR PRINCIPAL/ADMIN) */}
        {session.role === 'admin' && pendingLeavesCount > 0 && (
          <Link
            href="/dashboard/teacher?tab=leave_applications"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 rounded-xl text-xs font-black transition shadow-xs cursor-pointer active:scale-95 animate-pulse shrink-0"
            title={currentLang === 'en' ? `${pendingLeavesCount} Pending Leave Applications` : `${pendingLeavesCount}টি ছুটির আবেদন বিবেচনাধীন`}
          >
            <Send className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[11px] font-black">
              {currentLang === 'en' ? `Leaves (${pendingLeavesCount})` : `ছুটি (${pendingLeavesCount})`}
            </span>
          </Link>
        )}

        {/* 🔄 Two-Way Central Sync Status Badge */}
        <button
          type="button"
          onClick={() => syncQueueService.syncAll()}
          disabled={syncStatus.isSyncing}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 ${
            !syncStatus.isOnline
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
              : syncStatus.pendingCount > 0
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
          }`}
          title={
            !syncStatus.isOnline
              ? `অফলাইন মোড: ${syncStatus.pendingCount}টি পরিবর্তন অফলাইনে সংরক্ষিত`
              : syncStatus.isSyncing
              ? 'সেন্ট্রাল সার্ভারে সিঙ্ক হচ্ছে...'
              : 'সেন্ট্রাল সার্ভারের সাথে ডেটা সিঙ্ক সচল (ক্লিক করে এখনই সিঙ্ক করুন)'
          }
        >
          {syncStatus.isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
          ) : !syncStatus.isOnline ? (
            <CloudOff className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <Cloud className="w-3.5 h-3.5 text-emerald-500" />
          )}
          <span className="hidden md:inline text-[11px]">
            {syncStatus.isSyncing
              ? 'সিঙ্ক হচ্ছে...'
              : !syncStatus.isOnline
              ? `অফলাইন (${syncStatus.pendingCount})`
              : syncStatus.pendingCount > 0
              ? `পেন্ডিং (${syncStatus.pendingCount})`
              : 'সিঙ্ক সচল'}
          </span>
        </button>

        {/* ☀️ / 🌙 THEME TOGGLE BUTTON (LIGHT / NIGHT MODE) */}
        <button
          type="button"
          onClick={handleToggleTheme}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
            currentTheme === 'dark'
              ? 'bg-slate-800/90 border-slate-700 text-amber-400 hover:bg-slate-700 shadow-sm'
              : 'bg-slate-100 border-slate-200 text-indigo-600 hover:bg-slate-200/80 shadow-inner'
          }`}
          title={
            currentTheme === 'dark'
              ? (currentLang === 'en' ? 'Switch to Light Mode' : 'লাইট মোড চালু করুন')
              : (currentLang === 'en' ? 'Switch to Dark Mode' : 'নাইট মোড চালু করুন')
          }
          aria-label="Toggle theme mode"
        >
          {currentTheme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span className="hidden sm:inline text-[11px] text-amber-300 font-bold">
                {currentLang === 'en' ? 'Light' : 'লাইট মোড'}
              </span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline text-[11px] text-indigo-700 font-bold">
                {currentLang === 'en' ? 'Dark' : 'নাইট মোড'}
              </span>
            </>
          )}
        </button>

        {/* 🌐 ADMIN LANGUAGE CONTROL SWITCHER */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
          <div className="flex items-center gap-1 px-1.5 text-slate-500 dark:text-slate-400 hidden xs:flex">
            <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <button
            type="button"
            onClick={() => handleLanguageChange('bn')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              currentLang === 'bn'
                ? 'bg-indigo-600 text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700'
            }`}
            title="বাংলা ভাষায় পরিবর্তন করুন"
          >
            বাংলা
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              currentLang === 'en'
                ? 'bg-indigo-600 text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700'
            }`}
            title="Switch to English"
          >
            EN
          </button>
        </div>

        {/* Notification Bell */}
        <button 
          onClick={() => router.push('/dashboard/notices')}
          className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={currentLang === 'bn' ? 'নোটিফিকেশন বোর্ড' : 'Notification Board'}
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
        </button>

        <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* User Profile */}
        <div className="flex items-center gap-2 lg:gap-3">
          <div
            className={`w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center font-bold text-xs lg:text-sm shrink-0 ${
              session.role === 'admin'
                ? 'bg-indigo-100 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                : 'bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {session.role === 'admin' ? 'AD' : (session.teacherName?.charAt(0).toUpperCase() || 'T')}
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                {session.role === 'admin' ? (currentLang === 'bn' ? 'অ্যাডমিন ইউজার' : 'Admin User') : session.teacherName}
              </span>
              {session.role === 'admin' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              ) : (
                <UserIcon className="w-4 h-4 text-blue-500" />
              )}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight font-medium">
              {session.role === 'admin' 
                ? (currentLang === 'bn' ? 'প্রধান প্রশাসক' : 'Administrator') 
                : (currentLang === 'bn' ? 'শিক্ষক' : 'Teacher')}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              teacherAuthService.logout();
              router.push('/login');
            }}
            className="p-1.5 ml-1 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title={currentLang === 'bn' ? 'লগআউট' : 'Sign Out'}
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
