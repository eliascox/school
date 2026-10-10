/**
 * Global Language & Localization Service for School Management System
 * Enables Admin & Users to dynamically control site-wide translation between Bangla (বাংলা) and English (EN).
 */

export type AppLanguage = 'bn' | 'en';

export interface TranslationDictionary {
  // Navigation & Menu
  dashboard: string;
  academic: string;
  students: string;
  studentList: string;
  studentPrint: string;
  admission: string;
  stipend: string;
  curriculum: string;
  promotion: string;
  manageSection: string;
  session: string;
  classes: string;
  examination: string;
  examSetup: string;
  markEntry: string;
  bulkEntry: string;
  admitCard: string;
  marksheet: string;
  tabulation: string;
  rankResult: string;
  finance: string;
  studentFees: string;
  payroll: string;
  expenses: string;
  cashBank: string;
  waiversRefunds: string;
  financialReports: string;
  dailyAttendance: string;
  certificates: string;
  smsPanel: string;
  teacherMgmt: string;
  ledgerMaster: string;
  notices: string;
  settings: string;
  logout: string;
  management: string;

  // Header & Controls
  searchPlaceholder: string;
  adminUser: string;
  teacher: string;
  adminPanel: string;
  notifications: string;
  switchLanguage: string;
  languageControl: string;
  onlineAdmission: string;

  // Common UI Actions & Badges
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  confirm: string;
  print: string;
  search: string;
  filter: string;
  reset: string;
  submit: string;
  close: string;
  back: string;
  next: string;
  upload: string;
  download: string;
  status: string;
  action: string;
  details: string;
  success: string;
  error: string;
  active: string;
  inactive: string;
  all: string;
  total: string;
  amount: string;
  date: string;
  roll: string;
  name: string;
  grade: string;
  section: string;
  mobile: string;
  phone: string;
  email: string;
  address: string;
  gender: string;
  religion: string;
  bloodGroup: string;
}

export const TRANSLATIONS: Record<AppLanguage, TranslationDictionary> = {
  bn: {
    dashboard: 'ড্যাশবোর্ড',
    academic: 'একাডেমিক',
    students: 'শিক্ষার্থী',
    studentList: 'শিক্ষার্থী তালিকা',
    studentPrint: 'তালিকা প্রিন্ট ও রিপোর্ট',
    admission: 'শিক্ষার্থী ভর্তি ফরম',
    stipend: 'উপবৃত্তি ও মওকুফ',
    curriculum: 'পাঠ্যক্রম ও নম্বর',
    promotion: 'শ্রেণি উন্নীতকরণ',
    manageSection: 'শাখা ব্যবস্থাপনা',
    session: 'সেশন ও শিক্ষাবর্ষ',
    classes: 'শ্রেণি ও বিষয়',
    examination: 'পরীক্ষা ও মূল্যায়ন',
    examSetup: 'পরীক্ষা সেটআপ',
    markEntry: 'নম্বর এন্ট্রি',
    bulkEntry: 'বাল্ক ফলাফল এন্ট্রি',
    admitCard: 'প্রবেশপত্র (Admit Card)',
    marksheet: 'মার্কশীট ও গ্রেডশিট',
    tabulation: 'ট্যাবুলেশন শীট',
    rankResult: 'মেধা তালিকা ও ফলাফল',
    finance: 'ফাইন্যান্স ও হিসাব',
    studentFees: 'শিক্ষার্থী ফি আদায়',
    payroll: 'শিক্ষক ও স্টাফ বেতন',
    expenses: 'দৈনন্দিন ব্যয়',
    cashBank: 'ক্যাশ ও ব্যাংক হিসাব',
    waiversRefunds: 'মওকুফ ও রিফান্ড',
    financialReports: 'আর্থিক বিবরণী ও রিপোর্ট',
    dailyAttendance: 'দৈনিক ডিজিটাল হাজিরা',
    certificates: 'প্রত্যয়ন পত্র',
    smsPanel: 'এসএমএস ব্রডকাস্ট',
    teacherMgmt: 'শিক্ষক ও স্টাফ তালিকা',
    ledgerMaster: 'খতিয়ান ও লেজারবুক',
    notices: 'নোটিশ বোর্ড',
    settings: 'সিস্টেম সেটিংস',
    logout: 'লগআউট',
    management: 'ব্যবস্থাপনা ও প্রশাসন',

    searchPlaceholder: 'শিক্ষার্থী, শিক্ষক, শ্রেণি বা রোল খুঁজুন...',
    adminUser: 'প্রধান অ্যাডমিন',
    teacher: 'সহকারী শিক্ষক',
    adminPanel: 'অ্যাডমিন প্যানেল',
    notifications: 'নোটিফিকেশন',
    switchLanguage: 'ভাষা পরিবর্তন (বাংলা / EN)',
    languageControl: 'ভাষা নিয়ন্ত্রণ (Language Control)',
    onlineAdmission: 'অনলাইন আবেদন',

    save: 'সংরক্ষণ করুন',
    cancel: 'বাতিল',
    edit: 'সম্পাদনা',
    delete: 'মুছে ফেলুন',
    confirm: 'নিশ্চিত করুন',
    print: 'প্রিন্ট করুন',
    search: 'অনুসন্ধান',
    filter: 'ফিল্টার',
    reset: 'রিসেট',
    submit: 'সাবমিট করুন',
    close: 'বন্ধ করুন',
    back: 'ফিরে যান',
    next: 'পরবর্তী',
    upload: 'আপলোড',
    download: 'ডাউনলোড',
    status: 'অবস্থা',
    action: 'অ্যাকশন',
    details: 'বিস্তারিত',
    success: 'সফল হয়েছে',
    error: 'ত্রুটি',
    active: 'সক্রিয়',
    inactive: 'নিষ্ক্রিয়',
    all: 'সকল',
    total: 'মোট',
    amount: 'পরিমাণ',
    date: 'তারিখ',
    roll: 'রোল নম্বর',
    name: 'নাম',
    grade: 'শ্রেণি',
    section: 'শাখা',
    mobile: 'মোবাইল নম্বর',
    phone: 'ফোন',
    email: 'ইমেইল',
    address: 'ঠিকানা',
    gender: 'লিঙ্গ',
    religion: 'ধর্ম',
    bloodGroup: 'রক্তের গ্রুপ'
  },
  en: {
    dashboard: 'Dashboard',
    academic: 'Academic',
    students: 'Students',
    studentList: 'Student List',
    studentPrint: 'Print & Reports',
    admission: 'Student Admission',
    stipend: 'Stipend & Waivers',
    curriculum: 'Curriculum & Marks',
    promotion: 'Class Promotion',
    manageSection: 'Section Management',
    session: 'Academic Session',
    classes: 'Classes & Subjects',
    examination: 'Examinations',
    examSetup: 'Exam Setup',
    markEntry: 'Mark Entry',
    bulkEntry: 'Bulk Result Entry',
    admitCard: 'Admit Card',
    marksheet: 'Marksheet & Transcripts',
    tabulation: 'Tabulation Sheet',
    rankResult: 'Merit List & Results',
    finance: 'Finance & Accounts',
    studentFees: 'Student Fees',
    payroll: 'Teacher & Staff Payroll',
    expenses: 'Daily Expenses',
    cashBank: 'Cash & Bank Books',
    waiversRefunds: 'Waivers & Refunds',
    financialReports: 'Financial Statements',
    dailyAttendance: 'Daily Attendance',
    certificates: 'Attestation Certificates',
    smsPanel: 'SMS Broadcast',
    teacherMgmt: 'Teacher Management',
    ledgerMaster: 'General Ledger',
    notices: 'Notice Board',
    settings: 'System Settings',
    logout: 'Logout',
    management: 'Administration',

    searchPlaceholder: 'Search student, teacher, class or roll...',
    adminUser: 'Chief Administrator',
    teacher: 'Assistant Teacher',
    adminPanel: 'Admin Panel',
    notifications: 'Notifications',
    switchLanguage: 'Language Switcher (BN / EN)',
    languageControl: 'Language & Translation Control',
    onlineAdmission: 'Online Admission',

    save: 'Save Changes',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    print: 'Print',
    search: 'Search',
    filter: 'Filter',
    reset: 'Reset',
    submit: 'Submit Form',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    upload: 'Upload',
    download: 'Download',
    status: 'Status',
    action: 'Action',
    details: 'Details',
    success: 'Success',
    error: 'Error',
    active: 'Active',
    inactive: 'Inactive',
    all: 'All',
    total: 'Total',
    amount: 'Amount',
    date: 'Date',
    roll: 'Roll No',
    name: 'Name',
    grade: 'Class',
    section: 'Section',
    mobile: 'Mobile Number',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    gender: 'Gender',
    religion: 'Religion',
    bloodGroup: 'Blood Group'
  }
};

const STORAGE_KEY = 'sms_app_language';

class LanguageService {
  private currentLanguage: AppLanguage = 'bn';
  private listeners: ((lang: AppLanguage) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'en' || stored === 'bn') {
          this.currentLanguage = stored;
        }
      } catch (e) {}
    }
  }

  public getLanguage(): AppLanguage {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'en' || stored === 'bn') {
          this.currentLanguage = stored;
        }
      } catch (e) {}
    }
    return this.currentLanguage;
  }

  public setLanguage(lang: AppLanguage): void {
    this.currentLanguage = lang;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
        window.dispatchEvent(new Event('languageChange'));
      } catch (e) {}
    }
    this.notify();
  }

  public toggleLanguage(): AppLanguage {
    const nextLang = this.currentLanguage === 'bn' ? 'en' : 'bn';
    this.setLanguage(nextLang);
    return nextLang;
  }

  public t(key: keyof TranslationDictionary, fallback?: string): string {
    const dict = TRANSLATIONS[this.currentLanguage] || TRANSLATIONS.bn;
    return dict[key] || fallback || key;
  }

  public subscribe(listener: (lang: AppLanguage) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentLanguage);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.currentLanguage));
  }
}

export const languageService = new LanguageService();
