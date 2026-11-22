import { normalizePath } from '@/lib/routeAccess';

export type NavIconKey =
  | 'dashboard'
  | 'analytics'
  | 'wallet'
  | 'attendance'
  | 'users'
  | 'userCheck'
  | 'userPlus'
  | 'fileSpreadsheet'
  | 'trendingUp'
  | 'graduationCap'
  | 'send'
  | 'smartphone'
  | 'bookOpenCheck'
  | 'grid'
  | 'bookOpen'
  | 'calendar'
  | 'award'
  | 'slidersHorizontal'
  | 'edit'
  | 'layers'
  | 'fileBarChart'
  | 'clipboardList'
  | 'barChart'
  | 'search'
  | 'printer'
  | 'creditCard'
  | 'badgeCheck'
  | 'fileCheck'
  | 'fileBadge'
  | 'receipt'
  | 'banknote'
  | 'landmark'
  | 'rotateCcw'
  | 'messageSquare'
  | 'bell'
  | 'library'
  | 'bus'
  | 'globe'
  | 'sliders'
  | 'externalLink'
  | 'fileText'
  | 'scanLine';

export type NavBadgeKey = 'students' | 'teachers' | 'pendingLeaves';

export interface SubNavItemConfig {
  id: string;
  label: string;
  labelBn: string;
  href: string;
  icon: NavIconKey;
  iconColor?: string;
  keywords: string;
  badge?: string;
  badgeBn?: string;
  badgeKey?: NavBadgeKey;
  badgeColor?: string;
  isExternal?: boolean;
}

export interface MainNavItemConfig {
  id: string;
  title: string;
  titleBn: string;
  href?: string;
  icon: NavIconKey;
  iconColor: string;
  keywords: string;
  accent?: 'primary' | 'emerald' | 'amber' | 'default';
  badge?: string;
  badgeBn?: string;
  badgeKey?: NavBadgeKey;
  badgeColor?: string;
  liveDot?: boolean;
  subItems?: SubNavItemConfig[];
}

export interface NavSectionConfig {
  id: string;
  header: string;
  headerBn: string;
  items: MainNavItemConfig[];
}

export interface MobileBottomTabConfig {
  id: string;
  label: string;
  labelBn: string;
  href?: string;
  icon: NavIconKey;
  action?: 'openMenu';
}

export const ADMIN_NAV_SECTIONS: NavSectionConfig[] = [
  {
    id: 'overview',
    header: 'Overview',
    headerBn: 'মূল ওভারভিউ',
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        titleBn: 'ড্যাশবোর্ড',
        href: '/dashboard',
        icon: 'dashboard',
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        keywords:
          'dashboard home overview command center analytics heatmap banbeis emis excel export report charts ড্যাশবোর্ড হোম মূল পাতা অ্যানালিটিক্স হিটম্যাপ এক্সপোর্ট চার্ট',
      },
      {
        id: 'attendance',
        title: 'Daily Attendance',
        titleBn: 'ডিজিটাল হাজিরা',
        href: '/dashboard/academic/attendance',
        icon: 'attendance',
        iconColor: 'text-amber-600 dark:text-amber-400',
        liveDot: true,
        keywords: 'attendance qr biometric zkteco roll call present absent হাজিরা উপস্থিতি অনুপস্থিতি',
      },
    ],
  },
  {
    id: 'academic',
    header: 'Academic',
    headerBn: 'একাডেমিক',
    items: [
      {
        id: 'students',
        title: 'Students',
        titleBn: 'শিক্ষার্থী ব্যবস্থাপনা',
        icon: 'users',
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        badgeKey: 'students',
        badgeColor:
          'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/30',
        keywords: 'students admission enrollment promotion alumni bulk upload শিক্ষার্থী ভর্তি প্রোমোশন',
        subItems: [
          {
            id: 'students_all',
            label: 'All Students',
            labelBn: 'সকল শিক্ষার্থী তালিকা',
            href: '/dashboard/students',
            icon: 'userCheck',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            badgeKey: 'students',
            keywords: 'student list directory profile শিক্ষার্থী তালিকা',
          },
          {
            id: 'students_admission',
            label: 'New Admission',
            labelBn: 'নতুন ভর্তি ফরম',
            href: '/dashboard/admission',
            icon: 'userPlus',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            keywords: 'admission enroll new student ভর্তি নতুন শিক্ষার্থী',
          },
          {
            id: 'students_bulk',
            label: 'Bulk Import (Excel)',
            labelBn: 'বাল্ক আপলোড (Excel)',
            href: '/dashboard/students/bulk-import',
            icon: 'fileSpreadsheet',
            iconColor: 'text-violet-600 dark:text-violet-400',
            keywords: 'bulk import upload excel xlsx csv বাল্ক শিক্ষার্থী আপলোড',
          },
          {
            id: 'students_promotion',
            label: 'Class Promotion',
            labelBn: 'শ্রেণি উন্নয়ন (Promotion)',
            href: '/dashboard/academic/promotion',
            icon: 'trendingUp',
            iconColor: 'text-cyan-600 dark:text-cyan-400',
            keywords: 'promotion pass out next class roll শ্রেণি উন্নয়ন প্রমোশন',
          },
          {
            id: 'students_alumni',
            label: 'Alumni Archive',
            labelBn: 'প্রাক্তন শিক্ষার্থী (Alumni)',
            href: '/dashboard/alumni',
            icon: 'graduationCap',
            iconColor: 'text-violet-600 dark:text-violet-400',
            keywords: 'alumni passed out graduate ex student প্রাক্তন শিক্ষার্থী অ্যালুমনাই',
          },
          {
            id: 'students_online_admission',
            label: 'Online Admission Form',
            labelBn: 'অনলাইন ভর্তি ফরম (পাবলিক)',
            href: '/admission',
            icon: 'fileText',
            iconColor: 'text-sky-600 dark:text-sky-400',
            isExternal: true,
            keywords: 'online public admission application form অনলাইন ভর্তি আবেদন',
          },
        ],
      },
      {
        id: 'teachers',
        title: 'Teachers & Staff',
        titleBn: 'শিক্ষক ও স্টাফ',
        icon: 'userCheck',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        badgeKey: 'pendingLeaves',
        badgeColor: 'bg-rose-500 text-white font-bold',
        keywords: 'teachers staff hr faculty leave application portal শিক্ষক কর্মচারী ছুটি',
        subItems: [
          {
            id: 'teachers_list',
            label: 'Teachers & Staff (HR)',
            labelBn: 'শিক্ষক ও স্টাফ তালিকা',
            href: '/dashboard/teacher',
            icon: 'users',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            badgeKey: 'teachers',
            badgeColor:
              'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30',
            keywords: 'teachers staff hr faculty directory rbac শিক্ষক স্টাফ তালিকা',
          },
          {
            id: 'teachers_leaves',
            label: 'Leave Applications',
            labelBn: 'ছুটির আবেদনসমূহ',
            href: '/dashboard/leaves',
            icon: 'send',
            iconColor: 'text-amber-600 dark:text-amber-400',
            badgeKey: 'pendingLeaves',
            badgeColor: 'bg-rose-500 text-white font-bold',
            keywords: 'leave approval application slip ছুটি ছুটির আবেদন',
          },
          {
            id: 'teachers_portal',
            label: 'Teacher Mobile Portal',
            labelBn: 'শিক্ষক মোবাইল পোর্টাল',
            href: '/dashboard/teacher-portal',
            icon: 'smartphone',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            keywords: 'teacher portal mobile view শিক্ষক মোবাইল পোর্টাল',
          },
        ],
      },
      {
        id: 'academic_ops',
        title: 'Classes & Routine',
        titleBn: 'একাডেমিক ও রুটিন',
        icon: 'bookOpenCheck',
        iconColor: 'text-violet-600 dark:text-violet-400',
        keywords: 'classes sections subjects curriculum nctb routine proxy session শ্রেণি শাখা বিষয় রুটিন সেশন',
        subItems: [
          {
            id: 'academic_classes',
            label: 'Classes & Sections',
            labelBn: 'শ্রেণি ও শাখা সেটআপ',
            href: '/dashboard/academic/classes',
            icon: 'graduationCap',
            iconColor: 'text-violet-600 dark:text-violet-400',
            keywords: 'class section branch shift overview academic summary শ্রেণি শাখা সেটআপ শাখা সারসংক্ষেপ',
          },
          {
            id: 'academic_curriculum',
            label: 'Subjects & Curriculum',
            labelBn: 'বিষয় ও পাঠ্যক্রম (NCTB)',
            href: '/dashboard/academic/curriculum',
            icon: 'bookOpen',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            keywords: 'subject curriculum nctb marks distribution cq mcq practical বিষয় পাঠ্যক্রম',
          },
          {
            id: 'academic_routine',
            label: 'Class Routine & Proxy',
            labelBn: 'ক্লাস রুটিন ও প্রক্সি',
            href: '/dashboard/routine',
            icon: 'calendar',
            iconColor: 'text-sky-600 dark:text-sky-400',
            keywords: 'routine timetable period substitution proxy রুটিন পিরিয়ড প্রক্সি',
          },
          {
            id: 'academic_session',
            label: 'Academic Session',
            labelBn: 'শিক্ষাবর্ষ ও সেশন',
            href: '/dashboard/academic/session',
            icon: 'calendar',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            keywords: 'academic year session calendar শিক্ষাবর্ষ সেশন',
          },
        ],
      },
    ],
  },
  {
    id: 'examination',
    header: 'Examination & Print',
    headerBn: 'পরীক্ষা ও প্রিন্ট',
    items: [
      {
        id: 'exam_result',
        title: 'Exam & Result',
        titleBn: 'পরীক্ষা ও ফলাফল',
        icon: 'award',
        iconColor: 'text-rose-600 dark:text-rose-400',
        keywords: 'exam result mark entry tabulation merit rank marksheet gpa পরীক্ষা নম্বর ফলাফল ট্যাবুলেশন মার্কশিট',
        subItems: [
          {
            id: 'exam_setup',
            label: 'Exam Setup',
            labelBn: 'পরীক্ষা সেটআপ',
            href: '/dashboard/exam',
            icon: 'slidersHorizontal',
            iconColor: 'text-rose-600 dark:text-rose-400',
            keywords: 'exam setup schedule lock পরীক্ষা সেটআপ',
          },
          {
            id: 'exam_mark_entry',
            label: 'Marks Entry',
            labelBn: 'নম্বর এন্ট্রি',
            href: '/dashboard/exam/mark-entry',
            icon: 'edit',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            keywords: 'mark entry input cq mcq practical নম্বর এন্ট্রি',
          },
          {
            id: 'exam_bulk_entry',
            label: 'Bulk Marks Entry',
            labelBn: 'বাল্ক নম্বর এন্ট্রি',
            href: '/dashboard/exam/bulk-entry',
            icon: 'layers',
            iconColor: 'text-violet-600 dark:text-violet-400',
            keywords: 'bulk marks spreadsheet excel entry বাল্ক নম্বর',
          },
          {
            id: 'exam_omr_scanner',
            label: 'OMR Studio & Scanner',
            labelBn: 'OMR স্টুডিও ও স্ক্যানার',
            href: '/dashboard/exam/omr',
            icon: 'scanLine',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            badge: 'OMR',
            badgeBn: 'OMR',
            badgeColor:
              'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30',
            keywords: 'omr scanner mcq sheet bubble camera pdf উত্তরপত্র ওএমআর স্ক্যানার বহুনির্বাচনি',
          },
          {
            id: 'exam_results_studio',
            label: 'Result Analytics Studio',
            labelBn: 'সমন্বিত ফলাফল স্টুডিও',
            href: '/dashboard/exam/results',
            icon: 'fileBarChart',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            badge: '9-in-1',
            badgeBn: '৯-ইন-১',
            badgeColor:
              'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30',
            keywords: 'result studio analytics transcript summary fail list ফলাফল স্টুডিও',
          },
          {
            id: 'exam_tabulation',
            label: 'Tabulation Sheet',
            labelBn: 'মাস্টার ট্যাবুলেশন শীট',
            href: '/dashboard/exam/tabulation',
            icon: 'clipboardList',
            iconColor: 'text-teal-600 dark:text-teal-400',
            keywords: 'tabulation sheet landscape print ট্যাবুলেশন শীট',
          },
          {
            id: 'exam_rank',
            label: 'Merit List & Rank',
            labelBn: 'মেধাতালিকা ও র‍্যাঙ্ক',
            href: '/dashboard/exam/rank-result',
            icon: 'barChart',
            iconColor: 'text-cyan-600 dark:text-cyan-400',
            keywords: 'merit list position rank topper মেধাতালিকা র‍্যাঙ্ক',
          },
          {
            id: 'exam_marksheet',
            label: 'Marksheet / Report Card',
            labelBn: 'রিপোর্ট কার্ড ও মার্কশীট',
            href: '/dashboard/academic/marksheet',
            icon: 'graduationCap',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            keywords: 'marksheet report card transcript print মার্কশীট রিপোর্ট কার্ড',
          },
          {
            id: 'exam_public_result',
            label: 'Online Result Portal',
            labelBn: 'অনলাইন ফলাফল পোর্টাল',
            href: '/result',
            icon: 'search',
            iconColor: 'text-sky-600 dark:text-sky-400',
            isExternal: true,
            keywords: 'online public result lookup portal অনলাইন ফলাফল',
          },
        ],
      },
      {
        id: 'print_docs',
        title: 'Print, Plan & Docs',
        titleBn: 'প্রিন্ট, প্ল্যান ও সনদ',
        icon: 'printer',
        iconColor: 'text-amber-600 dark:text-amber-400',
        keywords: 'print admit card seat plan id card pvc certificate testimonial tc প্রবেশপত্র সিট প্ল্যান আইডি কার্ড সনদ প্রত্যয়ন প্রশংসাপত্র',
        subItems: [
          {
            id: 'print_admit_card',
            label: 'Admit Card',
            labelBn: 'প্রবেশপত্র (Admit Card)',
            href: '/dashboard/exam/admit-card',
            icon: 'creditCard',
            iconColor: 'text-amber-600 dark:text-amber-400',
            keywords: 'admit card exam hall pass প্রবেশপত্র',
          },
          {
            id: 'print_seat_plan',
            label: 'Seat Plan & Duty',
            labelBn: 'সিট প্ল্যান ও কক্ষ ডিউটি',
            href: '/dashboard/exam/seat-plan',
            icon: 'clipboardList',
            iconColor: 'text-sky-600 dark:text-sky-400',
            keywords: 'seat plan room invigilator duty label সিট প্ল্যান কক্ষ ডিউটি',
          },
          {
            id: 'print_id_card',
            label: 'PVC ID Cards (CR80)',
            labelBn: 'স্মার্ট আইডি কার্ড (PVC)',
            href: '/dashboard/students/id-card',
            icon: 'badgeCheck',
            iconColor: 'text-cyan-600 dark:text-cyan-400',
            keywords: 'id card pvc cr80 qr student badge আইডি কার্ড',
          },
          {
            id: 'print_student_list',
            label: 'Student Print Lists',
            labelBn: 'শিক্ষার্থী তালিকা প্রিন্ট',
            href: '/dashboard/students?view=print',
            icon: 'printer',
            iconColor: 'text-slate-500 dark:text-slate-400',
            keywords: 'student print register sheet report তালিকা প্রিন্ট',
          },
          {
            id: 'print_certificates',
            label: 'Certificate Studio',
            labelBn: 'প্রত্যয়ন ও সনদ স্টুডিও',
            href: '/dashboard/certificates',
            icon: 'fileCheck',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            keywords: 'certificate tc character transfer recommendation প্রত্যয়ন সনদ টিসি',
          },
          {
            id: 'print_ssc_testimonial',
            label: 'SSC Testimonials',
            labelBn: 'এসএসসি প্রশংসাপত্র',
            href: '/dashboard/ssc-transcript',
            icon: 'fileBadge',
            iconColor: 'text-amber-600 dark:text-amber-400',
            keywords: 'ssc testimonial board transcript প্রশংসাপত্র ট্রান্সক্রিপ্ট',
          },
        ],
      },
    ],
  },
  {
    id: 'operations',
    header: 'Finance & Operations',
    headerBn: 'অর্থ ও পরিচালনা',
    items: [
      {
        id: 'finance',
        title: 'Finance & Accounts',
        titleBn: 'ফি ও হিসাবরক্ষণ',
        icon: 'wallet',
        iconColor: 'text-teal-600 dark:text-teal-400',
        keywords: 'finance fee accounts expense payroll salary cash bank waiver refund ledger stipend অর্থ ফি বেতন ব্যয় পেরোল লেজার উপবৃত্তি',
        subItems: [
          {
            id: 'fin_fees',
            label: 'Fee Collection',
            labelBn: 'ফি ও বেতন আদায়',
            href: '/dashboard/finance?tab=student_fees',
            icon: 'creditCard',
            iconColor: 'text-teal-600 dark:text-teal-400',
            keywords: 'fee collection tuition invoice receipt ফি আদায় বেতন',
          },
          {
            id: 'fin_expenses',
            label: 'Expense Records',
            labelBn: 'ব্যয় ও খরচসমূহ',
            href: '/dashboard/finance?tab=expenses',
            icon: 'receipt',
            iconColor: 'text-rose-600 dark:text-rose-400',
            keywords: 'expense voucher cost spending ব্যয় খরচ',
          },
          {
            id: 'fin_payroll',
            label: 'Staff Payroll',
            labelBn: 'শিক্ষক-কর্মচারী বেতন',
            href: '/dashboard/finance?tab=payroll',
            icon: 'banknote',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            keywords: 'payroll salary sheet payslip বেতন পেরোল',
          },
          {
            id: 'fin_cash_bank',
            label: 'Cash & Bank Accounts',
            labelBn: 'ক্যাশ ও ব্যাংক হিসাব',
            href: '/dashboard/finance?tab=cash_bank',
            icon: 'landmark',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            keywords: 'cash bank balance account ক্যাশ ব্যাংক',
          },
          {
            id: 'fin_waivers',
            label: 'Waivers & Refunds',
            labelBn: 'ফি মওকুফ ও রিফান্ড',
            href: '/dashboard/finance?tab=waivers_refunds',
            icon: 'rotateCcw',
            iconColor: 'text-amber-600 dark:text-amber-400',
            keywords: 'waiver discount scholarship refund মওকুফ ছাড় রিফান্ড',
          },
          {
            id: 'fin_reports',
            label: 'Financial Reports & Dues',
            labelBn: 'বকেয়া ও আর্থিক রিপোর্ট',
            href: '/dashboard/finance?tab=reports',
            icon: 'fileBarChart',
            iconColor: 'text-cyan-600 dark:text-cyan-400',
            keywords: 'dues report collection summary financial বকেয়া আর্থিক রিপোর্ট',
          },
          {
            id: 'fin_ledger',
            label: 'General Ledger',
            labelBn: 'খতিয়ান ও লেজার বই',
            href: '/dashboard/ledger',
            icon: 'bookOpen',
            iconColor: 'text-violet-600 dark:text-violet-400',
            keywords: 'general ledger journal accounting খতিয়ান লেজার',
          },
          {
            id: 'fin_stipend',
            label: 'Stipend Management',
            labelBn: 'উপবৃত্তি ব্যবস্থাপনা',
            href: '/dashboard/stipend',
            icon: 'award',
            iconColor: 'text-amber-600 dark:text-amber-400',
            keywords: 'stipend scholarship grant banbeis উপবৃত্তি',
          },
        ],
      },
      {
        id: 'communication',
        title: 'Communication',
        titleBn: 'যোগাযোগ ও নোটিশ',
        icon: 'messageSquare',
        iconColor: 'text-orange-600 dark:text-orange-400',
        badge: 'SMS',
        badgeBn: 'SMS',
        badgeColor:
          'bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30',
        keywords: 'sms bulk message notice board announcement এসএমএস নোটিশ বিজ্ঞপ্তি',
        subItems: [
          {
            id: 'comm_sms',
            label: 'SMS Broadcast Hub',
            labelBn: 'এসএমএস ব্রডকাস্ট হাব',
            href: '/dashboard/sms',
            icon: 'send',
            iconColor: 'text-orange-600 dark:text-orange-400',
            keywords: 'sms gateway broadcast message log এসএমএস',
          },
          {
            id: 'comm_notices',
            label: 'Notice Board',
            labelBn: 'ডিজিটাল নোটিশ বোর্ড',
            href: '/dashboard/notices',
            icon: 'bell',
            iconColor: 'text-amber-600 dark:text-amber-400',
            keywords: 'notice board circular announcement নোটিশ বোর্ড বিজ্ঞপ্তি',
          },
        ],
      },
      {
        id: 'library',
        title: 'Digital Library',
        titleBn: 'ডিজিটাল লাইব্রেরি',
        href: '/dashboard/library',
        icon: 'library',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        keywords: 'library books issue return fine লাইব্রেরি বই ইস্যু ফেরত',
      },
    ],
  },
  {
    id: 'system',
    header: 'Portal & System',
    headerBn: 'পোর্টাল ও সিস্টেম',
    items: [
      {
        id: 'web_app',
        title: 'Website & Mobile App',
        titleBn: 'ওয়েবসাইট ও মোবাইল অ্যাপ',
        icon: 'globe',
        iconColor: 'text-blue-600 dark:text-blue-400',
        keywords: 'website cms landing page mobile app pwa apk qr ওয়েবসাইট মোবাইল অ্যাপ',
        subItems: [
          {
            id: 'web_cms',
            label: 'Website CMS Editor',
            labelBn: 'ওয়েবসাইট CMS এডিটর',
            href: '/dashboard/landing-page',
            icon: 'slidersHorizontal',
            iconColor: 'text-blue-600 dark:text-blue-400',
            keywords: 'landing page cms website editor hero gallery ওয়েবসাইট এডিটর',
          },
          {
            id: 'web_mobile_hub',
            label: 'Mobile App & QR Hub',
            labelBn: 'মোবাইল অ্যাপ ও QR হাব',
            href: '/dashboard/mobile-app',
            icon: 'smartphone',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            badge: 'v2.0',
            badgeBn: 'v2.0',
            badgeColor:
              'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30',
            keywords: 'mobile app apk pwa qr simulator মোবাইল অ্যাপ কিউআর',
          },
          {
            id: 'web_public_app',
            label: 'Open Mobile App',
            labelBn: 'পাবলিক মোবাইল অ্যাপ',
            href: '/mobile-app',
            icon: 'smartphone',
            iconColor: 'text-teal-600 dark:text-teal-400',
            isExternal: true,
            keywords: 'public mobile app guardian student পোর্টাল অ্যাপ',
          },
          {
            id: 'web_public_site',
            label: 'View Public Website',
            labelBn: 'পাবলিক ওয়েবসাইট দেখুন',
            href: '/',
            icon: 'externalLink',
            iconColor: 'text-sky-600 dark:text-sky-400',
            isExternal: true,
            keywords: 'public website home page পাবলিক ওয়েবসাইট',
          },
        ],
      },
      {
        id: 'settings',
        title: 'Settings',
        titleBn: 'প্রতিষ্ঠান সেটিংস',
        icon: 'sliders',
        iconColor: 'text-slate-600 dark:text-slate-400',
        keywords: 'settings school config backup cloud committee security সেটিংস কমিটি ব্যাকআপ',
        subItems: [
          {
            id: 'settings_general',
            label: 'School Settings',
            labelBn: 'সাধারণ ও ক্লাউড সেটিংস',
            href: '/dashboard/settings',
            icon: 'sliders',
            iconColor: 'text-pink-600 dark:text-pink-400',
            keywords: 'school settings logo eiin backup cloud সেটিংস লোগো',
          },
          {
            id: 'settings_committee',
            label: 'Managing Committee',
            labelBn: 'ম্যানেজিং কমিটি',
            href: '/dashboard/settings?tab=committee',
            icon: 'users',
            iconColor: 'text-purple-600 dark:text-purple-400',
            keywords: 'managing committee governing body members ম্যানেজিং কমিটি',
          },
        ],
      },
    ],
  },
];

export const TEACHER_NAV_SECTIONS: NavSectionConfig[] = [
  {
    id: 'teacher_main',
    header: 'Overview',
    headerBn: 'মূল প্যানেল',
    items: [
      {
        id: 'teacher_dashboard',
        title: 'Teacher Dashboard',
        titleBn: 'শিক্ষক ড্যাশবোর্ড',
        href: '/dashboard/teacher-portal?tab=home',
        icon: 'dashboard',
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        keywords: 'teacher dashboard home overview শিক্ষক ড্যাশবোর্ড',
      },
      {
        id: 'teacher_attendance',
        title: 'Daily Attendance',
        titleBn: 'দৈনিক হাজিরা',
        href: '/dashboard/academic/attendance',
        icon: 'attendance',
        iconColor: 'text-amber-600 dark:text-amber-400',
        liveDot: true,
        keywords: 'attendance roll call present absent হাজিরা উপস্থিতি',
      },
    ],
  },
  {
    id: 'teacher_academic',
    header: 'Academic & Exam',
    headerBn: 'একাডেমিক ও পরীক্ষা',
    items: [
      {
        id: 'teacher_mark_entry',
        title: 'Exam Mark Entry',
        titleBn: 'নম্বর এন্ট্রি',
        href: '/dashboard/exam/mark-entry',
        icon: 'edit',
        iconColor: 'text-rose-600 dark:text-rose-400',
        keywords: 'mark entry exam subject score নম্বর এন্ট্রি',
      },
      {
        id: 'teacher_omr_scanner',
        title: 'OMR Scanner',
        titleBn: 'OMR স্ক্যানার',
        href: '/dashboard/exam/omr',
        icon: 'scanLine',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        keywords: 'omr scanner mcq sheet bubble camera pdf ওএমআর স্ক্যানার',
      },
      {
        id: 'teacher_routine',
        title: 'Class Routine & Proxy',
        titleBn: 'ক্লাস রুটিন ও প্রক্সি',
        href: '/dashboard/routine',
        icon: 'calendar',
        iconColor: 'text-sky-600 dark:text-sky-400',
        keywords: 'routine period timetable proxy রুটিন পিরিয়ড',
      },
      {
        id: 'teacher_seat_plan',
        title: 'Exam Seat Plan',
        titleBn: 'পরীক্ষার সিট প্ল্যান',
        href: '/dashboard/exam/seat-plan',
        icon: 'clipboardList',
        iconColor: 'text-cyan-600 dark:text-cyan-400',
        keywords: 'seat plan exam hall duty সিট প্ল্যান',
      },
    ],
  },
  {
    id: 'teacher_more',
    header: 'More',
    headerBn: 'অন্যান্য সেবা',
    items: [
      {
        id: 'teacher_students',
        title: 'Class Students & Fees',
        titleBn: 'শিক্ষার্থী ও ফি',
        href: '/dashboard/teacher-portal?tab=students',
        icon: 'users',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        keywords: 'students class fees dues শিক্ষার্থী ফি',
      },
      {
        id: 'teacher_leaves',
        title: 'Leave Application',
        titleBn: 'ছুটির আবেদন',
        href: '/dashboard/teacher-portal?tab=leaves',
        icon: 'send',
        iconColor: 'text-teal-600 dark:text-teal-400',
        keywords: 'leave application request ছুটি আবেদন',
      },
      {
        id: 'teacher_notices',
        title: 'Notice Board',
        titleBn: 'নোটিশ বোর্ড',
        href: '/dashboard/notices',
        icon: 'bell',
        iconColor: 'text-orange-600 dark:text-orange-400',
        keywords: 'notices announcements নোটিশ বোর্ড',
      },
      {
        id: 'teacher_profile',
        title: 'Profile & Security',
        titleBn: 'প্রোফাইল ও নিরাপত্তা',
        href: '/dashboard/teacher-portal?tab=profile',
        icon: 'userCheck',
        iconColor: 'text-purple-600 dark:text-purple-400',
        keywords: 'profile password pin security প্রোফাইল পাসওয়ার্ড',
      },
    ],
  },
];

export const ADMIN_MOBILE_BOTTOM_TABS: MobileBottomTabConfig[] = [
  { id: 'mb_home', label: 'Home', labelBn: 'হোম', href: '/dashboard', icon: 'dashboard' },
  { id: 'mb_students', label: 'Students', labelBn: 'শিক্ষার্থী', href: '/dashboard/students', icon: 'users' },
  { id: 'mb_attendance', label: 'Attendance', labelBn: 'হাজিরা', href: '/dashboard/academic/attendance', icon: 'attendance' },
  { id: 'mb_results', label: 'Results', labelBn: 'ফলাফল', href: '/dashboard/exam/results', icon: 'award' },
  { id: 'mb_menu', label: 'Menu', labelBn: 'মেনু', icon: 'grid', action: 'openMenu' },
];

export const TEACHER_MOBILE_BOTTOM_TABS: MobileBottomTabConfig[] = [
  { id: 'tmb_home', label: 'Home', labelBn: 'হোম', href: '/dashboard/teacher-portal?tab=home', icon: 'dashboard' },
  { id: 'tmb_attendance', label: 'Attendance', labelBn: 'হাজিরা', href: '/dashboard/academic/attendance', icon: 'attendance' },
  { id: 'tmb_marks', label: 'Marks', labelBn: 'নম্বর', href: '/dashboard/exam/mark-entry', icon: 'edit' },
  { id: 'tmb_routine', label: 'Routine', labelBn: 'রুটিন', href: '/dashboard/routine', icon: 'calendar' },
  { id: 'tmb_menu', label: 'Menu', labelBn: 'মেনু', icon: 'grid', action: 'openMenu' },
];

export interface QueryLookup {
  get: (key: string) => string | null;
}

export function isNavHrefActive(
  href: string,
  pathname: string | null | undefined,
  searchParams?: QueryLookup | null,
): boolean {
  const normalizedCurrent = normalizePath(pathname);
  const currentTab = searchParams?.get('tab') || null;
  const currentView = searchParams?.get('view') || null;

  if (href.includes('?')) {
    const [rawBase, query] = href.split('?');
    const base = normalizePath(rawBase);
    if (normalizedCurrent !== base) return false;
    const urlQuery = new URLSearchParams(query);
    const viewQuery = urlQuery.get('view');
    if (viewQuery) {
      return currentView === viewQuery;
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

  const normalizedHref = normalizePath(href);
  if (normalizedHref === '/dashboard/academic/classes') {
    return (
      (normalizedCurrent === '/dashboard/academic/classes' ||
        normalizedCurrent === '/dashboard/academic') &&
      !currentView &&
      !currentTab
    );
  }
  if (normalizedHref === '/dashboard/teacher') {
    return normalizedCurrent === normalizedHref && (!currentTab || currentTab === 'teachers');
  }
  if (normalizedHref === '/dashboard/settings') {
    return normalizedCurrent === normalizedHref && (!currentTab || currentTab === 'general');
  }
  return normalizedCurrent === normalizedHref && !currentView && !currentTab;
}

export function isNavGroupActive(
  item: MainNavItemConfig,
  pathname: string | null | undefined,
  searchParams?: QueryLookup | null,
): boolean {
  if (item.href) return isNavHrefActive(item.href, pathname, searchParams);
  if (!item.subItems) return false;
  return item.subItems.some((sub) => isNavHrefActive(sub.href, pathname, searchParams));
}

export function filterNavSections(
  sections: NavSectionConfig[],
  rawQuery: string,
): NavSectionConfig[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return sections;

  const matchesText = (...parts: Array<string | undefined>) =>
    parts.some((p) => p && p.toLowerCase().includes(q));

  const filtered: NavSectionConfig[] = [];
  for (const section of sections) {
    const matchedItems: MainNavItemConfig[] = [];
    for (const item of section.items) {
      const parentMatched = matchesText(item.title, item.titleBn, item.keywords, item.href);
      if (item.subItems && item.subItems.length > 0) {
        const matchedSubs = item.subItems.filter((sub) =>
          matchesText(sub.label, sub.labelBn, sub.keywords, sub.href),
        );
        if (matchedSubs.length > 0) {
          matchedItems.push({ ...item, subItems: matchedSubs });
        } else if (parentMatched) {
          matchedItems.push(item);
        }
      } else if (parentMatched) {
        matchedItems.push(item);
      }
    }
    if (matchedItems.length > 0) {
      filtered.push({ ...section, items: matchedItems });
    }
  }
  return filtered;
}
