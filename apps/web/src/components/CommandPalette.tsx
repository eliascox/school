'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Award,
  BadgeCheck,
  BarChart3,
  BookOpen,
  CalendarCheck2,
  ClipboardList,
  CreditCard,
  ExternalLink,
  FileBadge,
  FileSpreadsheet,
  FileText,
  Globe,
  GraduationCap,
  Landmark,
  Languages,
  Layers,
  LayoutDashboard,
  MessageSquareDot,
  Moon,
  Printer,
  Receipt,
  Search,
  Settings,
  Sliders,
  Smartphone,
  Sparkles,
  Sun,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { canAccessDashboardRoute } from '@/lib/routeAccess';
import {
  areSessionsEqual,
  notifyNavigationPending,
  toCanonicalRouteHref,
  trySameRouteQueryNavigation,
} from '@/lib/urlTabSync';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import { languageService, AppLanguage } from '@/services/languageService';
import { themeService, AppTheme } from '@/services/themeService';
import { settingsService } from '@/services/settingsService';
import { studentService } from '@/services/studentService';
import { teacherRBACService } from '@/services/teacherRBACService';

interface CommandItem {
  id: string;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  subtitleEn: string;
  category: 'action' | 'page' | 'student' | 'teacher';
  keywords: string;
  href?: string;
  shortcut?: string;
  publicRoute?: boolean;
  icon: React.ReactNode;
  onSelect?: () => void;
}

export const OPEN_COMMAND_PALETTE_EVENT = 'sms:open-command-palette';

export function openCommandPalette() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT));
  }
}

export default function CommandPalette() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [session, setSession] = useState<UserSession | null>(null);
  const [lang, setLang] = useState<AppLanguage>('bn');
  const [theme, setTheme] = useState<AppTheme>('light');

  // Sync live user session, theme & language
  useEffect(() => {
    const refreshContext = () => {
      const nextSession = teacherAuthService.getSession();
      setSession((prev) => (areSessionsEqual(prev, nextSession) ? prev : nextSession));
      setLang((prev) => {
        const next = languageService.getLanguage();
        return prev === next ? prev : next;
      });
      setTheme((prev) => {
        const next = themeService.getTheme();
        return prev === next ? prev : next;
      });
    };
    refreshContext();

    const unsubLang = languageService.subscribe((next) => setLang(next));
    const unsubTheme = themeService.subscribe((next) => setTheme(next));
    window.addEventListener('storage', refreshContext);

    return () => {
      unsubLang();
      unsubTheme();
      window.removeEventListener('storage', refreshContext);
    };
  }, []);

  // Global keyboard shortcut (Ctrl+K / Cmd+K) + custom header trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, handleCustomOpen);
    };
  }, []);

  // Auto-focus search box & reset query when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setSession(teacherAuthService.getSession());
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  const staticCommands: CommandItem[] = useMemo(() => {
    const isAdmin = session?.role === 'admin';
    const nextLang: AppLanguage = lang === 'bn' ? 'en' : 'bn';

    const items: CommandItem[] = [
      // ── Quick Actions ─────────────────────────────────────────────
      {
        id: 'act-toggle-theme',
        titleBn: theme === 'dark' ? 'লাইট মোড চালু করুন' : 'নাইট / ডার্ক মোড চালু করুন',
        titleEn: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        subtitleBn: 'থিম ইনস্ট্যান্ট পরিবর্তন করুন',
        subtitleEn: 'Toggle Light / Dark theme',
        category: 'action',
        keywords: 'theme dark light mode night থিম ডার্ক লাইট',
        shortcut: 'Theme',
        publicRoute: true,
        icon: theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />,
        onSelect: () => {
          const next = themeService.toggleTheme();
          setTheme(next);
          settingsService.updateSettings({ theme: next });
        },
      },
      {
        id: 'act-toggle-lang',
        titleBn: lang === 'bn' ? 'English ভাষায় পরিবর্তন করুন' : 'বাংলা ভাষায় পরিবর্তন করুন',
        titleEn: lang === 'bn' ? 'Switch UI Language to English' : 'Switch UI Language to Bangla',
        subtitleBn: 'ইন্টারফেস ভাষা পরিবর্তন',
        subtitleEn: 'Toggle Bangla / English interface',
        category: 'action',
        keywords: 'language bangla english translate ভাষা বাংলা ইংরেজি',
        shortcut: nextLang.toUpperCase(),
        publicRoute: true,
        icon: <Languages className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        onSelect: () => {
          languageService.setLanguage(nextLang);
          settingsService.updateSettings({ language: nextLang });
        },
      },
      {
        id: 'act-new-admission',
        titleBn: 'নতুন শিক্ষার্থী ভর্তি করুন',
        titleEn: 'New Student Admission',
        subtitleBn: 'নতুন শিক্ষার্থী ভর্তি ফরম খুলুন',
        subtitleEn: 'Open New Admission Form',
        category: 'action',
        keywords: 'admission new student enroll ভর্তি নতুন শিক্ষার্থী',
        href: '/dashboard/admission',
        icon: <UserPlus className="w-4 h-4 text-indigo-500" />,
      },
      {
        id: 'act-collect-fee',
        titleBn: 'শিক্ষার্থী ফি ও বেতন আদায়',
        titleEn: 'Collect Student Fee / Receipt',
        subtitleBn: 'ফি রসিদ তৈরি ও বকেয়া দেখুন',
        subtitleEn: 'Fee collection and receipt',
        category: 'action',
        keywords: 'fee payment receipt collect dues বেতন ফি রসিদ বকেয়া',
        href: '/dashboard/finance?tab=student_fees',
        icon: <Receipt className="w-4 h-4 text-emerald-500" />,
      },
      {
        id: 'act-mark-entry',
        titleBn: 'পরীক্ষার নম্বর এন্ট্রি',
        titleEn: 'Enter Exam Marks',
        subtitleBn: 'বিষয়ভিত্তিক নম্বর প্রদান',
        subtitleEn: 'Subject mark entry',
        category: 'action',
        keywords: 'mark entry result exam নম্বর এন্ট্রি পরীক্ষা',
        href: '/dashboard/exam/mark-entry',
        icon: <ClipboardList className="w-4 h-4 text-amber-500" />,
      },
      {
        id: 'act-attendance',
        titleBn: 'দৈনিক ডিজিটাল হাজিরা',
        titleEn: 'Daily Attendance',
        subtitleBn: 'শ্রেণিভিত্তিক উপস্থিতি গ্রহণ',
        subtitleEn: 'Take student attendance',
        category: 'action',
        keywords: 'attendance present absent হাজিরা উপস্থিতি',
        href: '/dashboard/academic/attendance',
        icon: <CalendarCheck2 className="w-4 h-4 text-sky-500" />,
      },

      // ── Pages & Modules ───────────────────────────────────────────
      {
        id: 'pg-dashboard',
        titleBn: 'ড্যাশবোর্ড ওভারভিউ',
        titleEn: 'Dashboard Overview',
        subtitleBn: 'প্রাতিষ্ঠানিক কমান্ড সেন্টার ও পরিসংখ্যান',
        subtitleEn: 'Analytics & Summary',
        category: 'page',
        keywords: 'dashboard home overview analytics ড্যাশবোর্ড',
        href: '/dashboard',
        icon: <LayoutDashboard className="w-4 h-4 text-indigo-500" />,
      },
      {
        id: 'pg-teacher-portal',
        titleBn: 'শিক্ষক পোর্টাল (Teacher Portal)',
        titleEn: 'Teacher Dashboard Portal',
        subtitleBn: 'শিক্ষকের ক্লাস, রুটিন ও ছুটির আবেদন',
        subtitleEn: 'Teacher workspace, routine & leaves',
        category: 'page',
        keywords: 'teacher portal home routine leave শিক্ষক পোর্টাল',
        href: '/dashboard/teacher-portal',
        icon: <GraduationCap className="w-4 h-4 text-emerald-500" />,
      },
      {
        id: 'pg-students',
        titleBn: 'সকল শিক্ষার্থী তালিকা',
        titleEn: 'All Students Directory',
        subtitleBn: 'শিক্ষার্থী খুঁজুন, সম্পাদনা ও প্রিন্ট করুন',
        subtitleEn: 'Manage & search student records',
        category: 'page',
        keywords: 'students directory list profile শিক্ষার্থী তালিকা',
        href: '/dashboard/students',
        icon: <Users className="w-4 h-4 text-blue-500" />,
      },
      {
        id: 'pg-students-bulk',
        titleBn: 'বাল্ক শিক্ষার্থী আপলোড (CSV / Excel)',
        titleEn: 'Bulk Student Import',
        subtitleBn: 'এক্সেল বা সিএসভি থেকে শিক্ষার্থী আপলোড',
        subtitleEn: 'Upload CSV student sheets',
        category: 'page',
        keywords: 'bulk import upload csv excel বাল্ক আপলোড',
        href: '/dashboard/students/bulk-import',
        icon: <FileSpreadsheet className="w-4 h-4 text-teal-500" />,
      },
      {
        id: 'pg-teachers',
        titleBn: 'শিক্ষক ও স্টাফ ব্যবস্থাপনা (HR)',
        titleEn: 'Teachers & Staff Management',
        subtitleBn: 'শিক্ষক নিয়োগ, অ্যাসাইনমেন্ট ও ছুটির অনুমোদন',
        subtitleEn: 'Manage teachers & leaves',
        category: 'page',
        keywords: 'teacher staff hr assignment leave শিক্ষক স্টাফ',
        href: '/dashboard/teacher',
        icon: <UserCheck className="w-4 h-4 text-violet-500" />,
      },
      {
        id: 'pg-academic-classes',
        titleBn: 'শ্রেণি ও শাখা সেটআপ',
        titleEn: 'Classes & Sections Setup',
        subtitleBn: 'শ্রেণি, শাখা ও সিট কনফিগারেশন',
        subtitleEn: 'Configure classes and sections',
        category: 'page',
        keywords: 'classes sections academic শ্রেণি শাখা',
        href: '/dashboard/academic/classes',
        icon: <Layers className="w-4 h-4 text-indigo-500" />,
      },
      {
        id: 'pg-academic-curriculum',
        titleBn: 'বিষয় ও পাঠ্যক্রম (NCTB)',
        titleEn: 'Subjects & Curriculum',
        subtitleBn: 'বিষয়বস্তু, মানবন্টন ও যৌথ পাশ নিয়ম',
        subtitleEn: 'Curriculum & subject setup',
        category: 'page',
        keywords: 'curriculum subject nctb বিষয় পাঠ্যক্রম',
        href: '/dashboard/academic/curriculum',
        icon: <BookOpen className="w-4 h-4 text-cyan-500" />,
      },
      {
        id: 'pg-exam-setup',
        titleBn: 'পরীক্ষা সেটআপ ও রুটিন',
        titleEn: 'Exam Setup',
        subtitleBn: 'পরীক্ষা তৈরি ও সময়সূচি পরিচালনা',
        subtitleEn: 'Configure exams and schedules',
        category: 'page',
        keywords: 'exam setup routine পরীক্ষা সেটআপ',
        href: '/dashboard/exam',
        icon: <Award className="w-4 h-4 text-amber-500" />,
      },
      {
        id: 'pg-admit-card',
        titleBn: 'প্রবেশপত্র (Admit Card) প্রিন্ট',
        titleEn: 'Admit Card Generator',
        subtitleBn: '২-আপ A4 প্রবেশপত্র প্রিন্ট',
        subtitleEn: 'Print A4 student admit cards',
        category: 'page',
        keywords: 'admit card print exam প্রবেশপত্র প্রিন্ট',
        href: '/dashboard/exam/admit-card',
        icon: <Printer className="w-4 h-4 text-rose-500" />,
      },
      {
        id: 'pg-bulk-entry',
        titleBn: 'বাল্ক নম্বর এন্ট্রি',
        titleEn: 'Bulk Marks Entry',
        subtitleBn: 'সকল শিক্ষার্থীর নম্বর একসাথে প্রদান',
        subtitleEn: 'Fast grid marks entry',
        category: 'page',
        keywords: 'bulk marks entry বাল্ক নম্বর',
        href: '/dashboard/exam/bulk-entry',
        icon: <FileSpreadsheet className="w-4 h-4 text-orange-500" />,
      },
      {
        id: 'pg-result-studio',
        titleBn: 'সমন্বিত ফলাফল ও পরিসংখ্যান স্টুডিও (৯ রিপোর্ট)',
        titleEn: 'Result Analytics & Reports Studio',
        subtitleBn: 'ট্রান্সক্রিপ্ট, টেবুলেশন, মেধা, ফেল, শ্রেণি ও বিষয় সারসংক্ষেপ',
        subtitleEn: 'Unified 9-mode exam results & Excel export studio',
        category: 'page',
        keywords: 'results studio analytics fail summary subject excel ফলাফল স্টুডিও ফেল তালিকা সারসংক্ষেপ',
        href: '/dashboard/exam/results',
        icon: <BarChart3 className="w-4 h-4 text-indigo-600" />,
      },
      {
        id: 'pg-result-fail-list',
        titleBn: 'ফেল তালিকা ও ঘাটতি বিশ্লেষণ',
        titleEn: 'Failed Students Analysis',
        subtitleBn: 'বিষয়ভিত্তিক অকৃতকার্য তালিকা ও ন্যূনতম ফেল ফিল্টার',
        subtitleEn: 'Filter failed students by threshold and deficit marks',
        category: 'page',
        keywords: 'fail list failed deficit ফেল তালিকা অকৃতকার্য',
        href: '/dashboard/exam/results?view=fail_list',
        icon: <ClipboardList className="w-4 h-4 text-rose-500" />,
      },
      {
        id: 'pg-result-class-summary',
        titleBn: 'শ্রেণি ও সব বিষয়ের সারসংক্ষেপ',
        titleEn: 'Class & All-Subjects Summary',
        subtitleBn: 'পাসের হার, গড় জিপিএ ও A+..F হিটম্যাপ ম্যাট্রিক্স',
        subtitleEn: 'Pass percentage matrix and subject comparison',
        category: 'page',
        keywords: 'class summary subject heatmap সারসংক্ষেপ বিষয়ভিত্তিক',
        href: '/dashboard/exam/results?view=all_subjects_heatmap',
        icon: <BookOpen className="w-4 h-4 text-emerald-500" />,
      },
      {
        id: 'pg-tabulation',
        titleBn: 'মাস্টার ট্যাবুলেশন শীট',
        titleEn: 'Tabulation Sheet',
        subtitleBn: 'শ্রেণিভিত্তিক সম্পূর্ণ ফলাফল ও প্রিন্ট',
        subtitleEn: 'Class master tabulation result sheet',
        category: 'page',
        keywords: 'tabulation sheet result merit ট্যাবুলেশন',
        href: '/dashboard/exam/tabulation',
        icon: <BarChart3 className="w-4 h-4 text-emerald-500" />,
      },
      {
        id: 'pg-rank-result',
        titleBn: 'মেধাতালিকা ও র‍্যাঙ্ক (Merit List)',
        titleEn: 'Merit List & Ranking',
        subtitleBn: 'জিপিএ ও মেধাক্রম অনুযায়ী র‍্যাঙ্কিং',
        subtitleEn: 'Student rankings & merit',
        category: 'page',
        keywords: 'merit list rank gpa result মেধাতালিকা',
        href: '/dashboard/exam/rank-result',
        icon: <TrendingUp className="w-4 h-4 text-indigo-500" />,
      },
      {
        id: 'pg-marksheet',
        titleBn: 'অফিশিয়াল মার্কশীট প্রিন্ট (বাল্ক ও একক)',
        titleEn: 'Official Marksheet / Report Card',
        subtitleBn: 'A4 ট্রান্সক্রিপ্ট ও প্রিন্ট প্রিভিউ',
        subtitleEn: 'Printable academic report cards',
        category: 'page',
        keywords: 'marksheet report card transcript print মার্কশীট',
        href: '/dashboard/academic/marksheet',
        icon: <FileText className="w-4 h-4 text-purple-500" />,
      },
      {
        id: 'pg-promotion',
        titleBn: 'শ্রেণি উন্নয়ন (Promotion)',
        titleEn: 'Class Promotion Tool',
        subtitleBn: 'পরবর্তী শ্রেণিতে উত্তীর্ণ ও নতুন রোল',
        subtitleEn: 'Promote students to next grade',
        category: 'page',
        keywords: 'promotion promote roll next class প্রমোশন',
        href: '/dashboard/academic/promotion',
        icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      },
      {
        id: 'pg-finance-expenses',
        titleBn: 'ব্যয় ও খরচসমূহ (Expenses)',
        titleEn: 'Expense Records',
        subtitleBn: 'দৈনন্দিন প্রাতিষ্ঠানিক খরচের হিসাব',
        subtitleEn: 'Manage school expenses',
        category: 'page',
        keywords: 'finance expense cost হিসাব খরচ',
        href: '/dashboard/finance?tab=expenses',
        icon: <Wallet className="w-4 h-4 text-rose-500" />,
      },
      {
        id: 'pg-finance-payroll',
        titleBn: 'শিক্ষক-কর্মচারী বেতন (Payroll)',
        titleEn: 'Staff Payroll',
        subtitleBn: 'মাসিক বেতন শীট ও পেমেন্ট',
        subtitleEn: 'Teacher & staff salaries',
        category: 'page',
        keywords: 'payroll salary staff teacher বেতন',
        href: '/dashboard/finance?tab=payroll',
        icon: <CreditCard className="w-4 h-4 text-indigo-500" />,
      },
      {
        id: 'pg-finance-bank',
        titleBn: 'ক্যাশ ও ব্যাংক লেজার',
        titleEn: 'Cash & Bank Accounts',
        subtitleBn: 'ব্যাংক ব্যালেন্স, জমা ও উত্তোলন',
        subtitleEn: 'Manage cash and bank accounts',
        category: 'page',
        keywords: 'cash bank balance account ব্যাংক ক্যাশ',
        href: '/dashboard/finance?tab=cash_bank',
        icon: <Landmark className="w-4 h-4 text-emerald-500" />,
      },
      {
        id: 'pg-ledger',
        titleBn: 'জেনারেল লেজার ও খতিয়ান',
        titleEn: 'General Ledger',
        subtitleBn: 'সকল আয়-ব্যয়ের লেজার ও ক্যাশবুক',
        subtitleEn: 'Accounting ledger & reports',
        category: 'page',
        keywords: 'ledger accounting cashbook খতিয়ান লেজার',
        href: '/dashboard/ledger',
        icon: <FileText className="w-4 h-4 text-teal-500" />,
      },
      {
        id: 'pg-stipend',
        titleBn: 'উপবৃত্তি ব্যবস্থাপনা ও প্রিন্ট',
        titleEn: 'Stipend Management',
        subtitleBn: 'উপবৃত্তি সুবিধাভোগী ও প্রিন্ট তালিকা',
        subtitleEn: 'Manage stipend beneficiaries',
        category: 'page',
        keywords: 'stipend scholarship print উপবৃত্তি',
        href: '/dashboard/stipend',
        icon: <Award className="w-4 h-4 text-amber-500" />,
      },
      {
        id: 'pg-sms',
        titleBn: 'এসএমএস ব্রডকাস্ট হাব',
        titleEn: 'SMS Broadcast Hub',
        subtitleBn: 'অভিভাবক ও শিক্ষকদের বাল্ক এসএমএস',
        subtitleEn: 'Send bulk SMS notifications',
        category: 'page',
        keywords: 'sms message gateway broadcast এসএমএস মেসেজ',
        href: '/dashboard/sms',
        icon: <MessageSquareDot className="w-4 h-4 text-sky-500" />,
      },
      {
        id: 'pg-notices',
        titleBn: 'ডিজিটাল নোটিশ বোর্ড',
        titleEn: 'Digital Notice Board',
        subtitleBn: 'প্রাতিষ্ঠানিক নোটিশ প্রকাশ ও ব্যবস্থাপনা',
        subtitleEn: 'Publish & read school notices',
        category: 'page',
        keywords: 'notice board announcement নোটিশ',
        href: '/dashboard/notices',
        icon: <ClipboardList className="w-4 h-4 text-indigo-500" />,
      },
      {
        id: 'pg-ssc-transcript',
        titleBn: 'প্রশংসাপত্র ও এসএসসি ট্রান্সক্রিপ্ট',
        titleEn: 'Testimonials & SSC Transcripts',
        subtitleBn: 'প্রশংসাপত্র ও একাডেমিক ট্রান্সক্রিপ্ট প্রিন্ট',
        subtitleEn: 'Generate testimonials & transcripts',
        category: 'page',
        keywords: 'testimonial ssc transcript প্রশংসাপত্র ট্রান্সক্রিপ্ট',
        href: '/dashboard/ssc-transcript',
        icon: <FileBadge className="w-4 h-4 text-emerald-500" />,
      },
      {
        id: 'pg-certificates',
        titleBn: 'প্রত্যয়ন পত্র ও টিসি ব্যবস্থাপনা',
        titleEn: 'Certificates & TC Documents',
        subtitleBn: 'টিসি, প্রত্যয়ন পত্র ও ভেরিফিকেশন কোড',
        subtitleEn: 'Issue & manage certificates',
        category: 'page',
        keywords: 'certificate tc character transfer প্রত্যয়ন টিসি সনদ',
        href: '/dashboard/certificates',
        icon: <BadgeCheck className="w-4 h-4 text-amber-500" />,
      },
      {
        id: 'pg-landing-cms',
        titleBn: 'ল্যান্ডিং পেইজ সিএমএস (ওয়েবসাইট)',
        titleEn: 'Landing Page CMS Editor',
        subtitleBn: 'পাবলিক ওয়েবসাইটের কনটেন্ট ও গ্যালারি সম্পাদনা',
        subtitleEn: 'Edit public website content',
        category: 'page',
        keywords: 'landing cms website editor ওয়েবসাইট সিএমএস',
        href: '/dashboard/landing-page',
        icon: <Globe className="w-4 h-4 text-blue-500" />,
      },
      {
        id: 'pg-mobile-hub',
        titleBn: 'মোবাইল অ্যাপ ও APK ডাউনলোড হাব',
        titleEn: 'Mobile App & APK Hub',
        subtitleBn: 'অ্যান্ড্রয়েড APK ডাউনলোড ও PWA সেটিংস',
        subtitleEn: 'Android APK & mobile app hub',
        category: 'page',
        keywords: 'mobile apk android pwa app মোবাইল অ্যাপ',
        href: '/dashboard/mobile-app',
        icon: <Smartphone className="w-4 h-4 text-emerald-500" />,
      },
      {
        id: 'pg-settings',
        titleBn: 'স্কুল সাধারণ সেটিংস ও ব্যাকআপ',
        titleEn: 'School Settings & Backup',
        subtitleBn: 'প্রতিষ্ঠানের তথ্য, লাইসেন্স, ক্লাউড সিঙ্ক ও সিকিউরিটি',
        subtitleEn: 'System configuration & backups',
        category: 'page',
        keywords: 'settings config backup password license সেটিংস ব্যাকআপ',
        href: '/dashboard/settings',
        icon: <Settings className="w-4 h-4 text-slate-500" />,
      },
      {
        id: 'pg-routine',
        titleBn: 'ক্লাস রুটিন ও প্রক্সি ম্যানেজার',
        titleEn: 'Class Routine & Substitution Manager',
        subtitleBn: 'সাপ্তাহিক মাস্টার রুটিন, সোয়াপ ও প্রক্সি শিক্ষক নিয়োগ',
        subtitleEn: 'Weekly timetable & proxy teacher replacement',
        category: 'page',
        keywords: 'routine timetable proxy substitution রুটিন প্রক্সি শিক্ষক',
        href: '/dashboard/routine',
        icon: <CalendarCheck2 className="w-4 h-4 text-sky-500" />,
      },
      {
        id: 'pg-seat-plan',
        titleBn: 'পরীক্ষার সিট প্ল্যান ও কক্ষ ডিউটি',
        titleEn: 'Exam Seat Plan & Invigilator Duty',
        subtitleBn: 'হল ম্যাপ, বেঞ্চ স্টিকার ও পরিদর্শক রোস্টার',
        subtitleEn: 'Hall seating map, bench stickers & invigilators',
        category: 'page',
        keywords: 'seat plan bench sticker invigilator exam সিট প্ল্যান পরীক্ষা',
        href: '/dashboard/exam/seat-plan',
        icon: <ClipboardList className="w-4 h-4 text-rose-500" />,
      },
      {
        id: 'pg-student-id-card',
        titleBn: 'শিক্ষার্থী স্মার্ট আইডি কার্ড (CR80)',
        titleEn: 'Student PVC ID Card Generator',
        subtitleBn: 'QR কোডযুক্ত ফ্রন্ট-ব্যাক আইডি কার্ড বাল্ক প্রিন্ট',
        subtitleEn: 'Bulk CR80 student ID cards with QR',
        category: 'page',
        keywords: 'id card pvc cr80 qr student আইডি কার্ড প্রিন্ট',
        href: '/dashboard/students/id-card',
        icon: <BadgeCheck className="w-4 h-4 text-cyan-500" />,
      },
      {
        id: 'pg-library',
        titleBn: 'ডিজিটাল লাইব্রেরি ও বই ইস্যু',
        titleEn: 'Digital Library & Loans',
        subtitleBn: 'বই ক্যাটালগ, ইস্যু/ফেরত ও বিলম্ব জরিমানা সমন্বয়',
        subtitleEn: 'Book catalog, borrow loans & overdue fines',
        category: 'page',
        keywords: 'library book loan return fine লাইব্রেরি বই জরিমানা',
        href: '/dashboard/library',
        icon: <BookOpen className="w-4 h-4 text-emerald-500" />,
      },
      {
        id: 'pg-analytics',
        titleBn: 'অ্যাডভান্সড অ্যানালিটিক্স ও BANBEIS / EMIS এক্সপোর্ট',
        titleEn: 'Analytics Heatmap & BANBEIS / EMIS Export',
        subtitleBn: 'বিষয়ভিত্তিক পাস/ফেল হিটম্যাপ ও সরকারি এক্সেল',
        subtitleEn: 'Performance heatmaps & board XLSX reports',
        category: 'page',
        keywords: 'analytics heatmap banbeis emis excel report অ্যানালিটিক্স হিটম্যাপ ব্যানবেইস',
        href: '/dashboard?tab=analytics',
        icon: <BarChart3 className="w-4 h-4 text-sky-600" />,
      },
      {
        id: 'pg-alumni',
        titleBn: 'প্রাক্তন শিক্ষার্থী (Alumni) আর্কাইভ',
        titleEn: 'Alumni Directory & Archive',
        subtitleBn: 'পাস-আউট শিক্ষার্থীদের ব্যাচ ও ক্যারিয়ার ডিরেক্টরি',
        subtitleEn: 'Graduated batch records & career tracker',
        category: 'page',
        keywords: 'alumni archive batch graduate প্রাক্তন অ্যালুমনাই',
        href: '/dashboard/alumni',
        icon: <GraduationCap className="w-4 h-4 text-violet-500" />,
      },

      // ── Public Portals ────────────────────────────────────────────
      {
        id: 'pub-home',
        titleBn: 'পাবলিক স্কুল ওয়েবসাইট দেখুন',
        titleEn: 'View Public School Website',
        subtitleBn: 'হোমপেইজ খুলুন',
        subtitleEn: 'Open public website',
        category: 'page',
        keywords: 'public home website homepage ওয়েবসাইট',
        href: '/',
        publicRoute: true,
        icon: <ExternalLink className="w-4 h-4 text-indigo-500" />,
      },
      {
        id: 'pub-verify-cert',
        titleBn: 'সনদ যাচাইকরণ পোর্টাল (Verify Certificate)',
        titleEn: 'Certificate Verification Portal',
        subtitleBn: 'পাবলিক সনদ নম্বর যাচাই',
        subtitleEn: 'Verify issued certificate IDs',
        category: 'page',
        keywords: 'verify certificate portal সনদ যাচাই',
        href: '/verify-certificate',
        publicRoute: true,
        icon: <BadgeCheck className="w-4 h-4 text-emerald-500" />,
      },
      {
        id: 'pub-result',
        titleBn: 'পাবলিক অনলাইন ফলাফল পোর্টাল',
        titleEn: 'Public Online Result Portal',
        subtitleBn: 'রোল দিয়ে অনলাইন মার্কশীট দেখুন',
        subtitleEn: 'Online public result lookup',
        category: 'page',
        keywords: 'public result online marksheet ফলাফল পোর্টাল',
        href: '/result',
        publicRoute: true,
        icon: <Sliders className="w-4 h-4 text-amber-500" />,
      },
    ];

    return items.filter((item) => {
      if (item.publicRoute || !item.href) return true;
      if (!isAdmin && item.href === '/dashboard') return false;
      return canAccessDashboardRoute(session?.role, item.href);
    });
  }, [session?.role, lang, theme]);

  // Dynamic student & teacher matches when user types
  const dynamicCommands: CommandItem[] = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || !isOpen) return [];

    const matches: CommandItem[] = [];
    const isAdmin = session?.role === 'admin';

    try {
      const students = studentService.getAllStudents();
      const matchedStudents = students
        .filter((s) => {
          const haystack = `${s.name || ''} ${s.roll || ''} ${s.grade || ''} ${s.gradeBn || ''} ${s.mobile || ''} ${s.fatherName || ''}`.toLowerCase();
          return haystack.includes(trimmed);
        })
        .slice(0, 6);

      for (const st of matchedStudents) {
        matches.push({
          id: `st-${st.id || st.roll}`,
          titleBn: `${st.name} (রোল: ${st.roll})`,
          titleEn: `${st.name} (Roll: ${st.roll})`,
          subtitleBn: `শ্রেণি: ${st.gradeBn || st.grade} | শাখা: ${st.section || '-'} | বিভাগ: ${st.group || 'সাধারণ'}`,
          subtitleEn: `Class: ${st.grade} | Sec: ${st.section || '-'}`,
          category: 'student',
          keywords: `${st.name} ${st.roll} ${st.grade}`,
          href: isAdmin ? `/dashboard/students?search=${encodeURIComponent(st.roll || st.name)}` : '/dashboard/teacher-portal?tab=students',
          icon: <Users className="w-4 h-4 text-blue-500" />,
        });
      }
    } catch {
      // Ignore storage read errors safely
    }

    if (isAdmin) {
      try {
        const teachers = teacherRBACService.getTeachers();
        const matchedTeachers = teachers
          .filter((t) => `${t.name || ''} ${t.phone || ''} ${t.designation || ''}`.toLowerCase().includes(trimmed))
          .slice(0, 4);

        for (const t of matchedTeachers) {
          matches.push({
            id: `tch-${t.id}`,
            titleBn: `${t.name} (${t.designation || 'শিক্ষক'})`,
            titleEn: `${t.name} (${t.designation || 'Teacher'})`,
            subtitleBn: `মোবাইল: ${t.phone || '-'}`,
            subtitleEn: `Phone: ${t.phone || '-'}`,
            category: 'teacher',
            keywords: `${t.name} ${t.phone} ${t.designation}`,
            href: '/dashboard/teacher',
            icon: <UserCheck className="w-4 h-4 text-violet-500" />,
          });
        }
      } catch {
        // Ignore storage read errors safely
      }
    }

    return matches;
  }, [query, isOpen, session?.role]);

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      // Show compact curated defaults before searching
      return staticCommands.slice(0, 12);
    }

    const staticMatches = staticCommands.filter((item) => {
      const haystack = `${item.titleBn} ${item.titleEn} ${item.subtitleBn} ${item.subtitleEn} ${item.keywords} ${item.href || ''}`.toLowerCase();
      return haystack.includes(trimmed);
    });

    return [...dynamicCommands, ...staticMatches].slice(0, 18);
  }, [query, staticCommands, dynamicCommands]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, filteredItems.length]);

  const executeItem = (item: CommandItem) => {
    setIsOpen(false);
    if (item.onSelect) {
      item.onSelect();
      return;
    }
    if (item.href) {
      if (trySameRouteQueryNavigation(item.href, typeof window !== 'undefined' ? window.location.pathname : null)) {
        return;
      }
      const canonical = toCanonicalRouteHref(item.href);
      notifyNavigationPending(canonical);
      router.push(canonical);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredItems[selectedIndex];
      if (target) executeItem(target);
    }
  };

  if (!isOpen) return null;

  const categoryLabels: Record<CommandItem['category'], string> = {
    student: lang === 'en' ? 'Student' : 'শিক্ষার্থী',
    teacher: lang === 'en' ? 'Teacher' : 'শিক্ষক',
    action: lang === 'en' ? 'Action' : 'দ্রুত অ্যাকশন',
    page: lang === 'en' ? 'Page' : 'পেজ',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="গ্লোবাল কমান্ড প্যালেট"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-indigo-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={
              lang === 'en'
                ? 'Search pages, actions, student roll/name, or teachers...'
                : 'যেকোনো পেজ, দ্রুত অ্যাকশন, শিক্ষার্থীর নাম/রোল বা শিক্ষক খুঁজুন...'
            }
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-2 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[56vh] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                {lang === 'en' ? 'No matching results found' : `"${query}" এর জন্য কোনো ফলাফল পাওয়া যায়নি`}
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => executeItem(item)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-700/70'
                      : 'border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {lang === 'en' ? item.titleEn : item.titleBn}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {lang === 'en' ? item.subtitleEn : item.subtitleBn}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 ${
                      item.category === 'action'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : item.category === 'student'
                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                        : item.category === 'teacher'
                        ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.shortcut || categoryLabels[item.category]}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Keyboard Help Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-[10px]">
                ↑↓
              </kbd>{' '}
              {lang === 'en' ? 'Navigate' : 'নির্বাচন'}
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-[10px]">
                Enter
              </kbd>{' '}
              {lang === 'en' ? 'Open' : 'খুলুন'}
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-[10px]">
                Esc
              </kbd>{' '}
              {lang === 'en' ? 'Close' : 'বন্ধ'}
            </span>
          </div>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            Ctrl + K / ⌘K
          </span>
        </div>
      </div>
    </div>
  );
}
