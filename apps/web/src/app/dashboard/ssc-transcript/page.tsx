'use client';

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 🎓 SCHOOLPRO SSC BULK TESTIMONIAL GENERATOR (ENGLISH)
 * ─────────────────────────────────────────────────────────────────────────────
 * এসএসসি পরীক্ষার্থীদের বাল্ক প্রশংসাপত্র জেনারেটর (Official English Testimonials)
 * 
 * Exact Specifications:
 * - Certificate Dimensions: Width: 9.2 inches (9.2in), Height: 8.2 inches (8.2in)
 * - Safe 4-side margins (0.65" default, customizable) so uploaded PNG borders fit perfectly
 * - 100% Official English Testimonial certificate text
 * - Gender-aware pronouns (daughter/son, She/He, her/his)
 * - Spelled out Date of Birth (e.g. Fourteenth May Two Thousand and Nine)
 * - 1-Click "সকল পরীক্ষার্থীর বাল্ক প্রশংসাপত্র প্রস্তুত ও প্রিন্ট"
 * - Instant PNG border upload & 3-slot border manager
 * - Batch continuous A4/9.2x8.2 print with clean page breaks
 * ═════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Award,
  FileText,
  Printer,
  Search,
  Users,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Check,
  X,
  Download,
  Upload,
  Sparkles,
  RefreshCw,
  Clock,
  FileCheck,
  GraduationCap,
  ShieldCheck,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  BookOpen,
  Filter,
  Layers,
  ArrowRight,
  ImageIcon,
  Plus,
  Maximize2,
  Minimize2,
  Settings2,
  RotateCcw,
  FileSpreadsheet,
  Globe,
  Send,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import { certificateService, CertificateRecord } from '@/services/certificateService';
import { studentService, Student } from '@/services/studentService';
import { settingsService, SchoolSettings, CustomPngBorder, DEFAULT_PAD_MARGINS } from '@/services/settingsService';
import { languageService, AppLanguage } from '@/services/languageService';

type MainTab = 'single_generator' | 'bulk_generator' | 'batch_print' | 'register' | 'settings' | 'border_manager';

export interface SSCTestimonialRecord {
  id: string;
  studentId: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  village?: string;
  postOffice?: string;
  upazilla?: string;
  district?: string;
  dob: string;
  dobWords?: string;
  gender: 'Male' | 'Female' | 'Other';
  schoolName: string;
  schoolNameEn: string;
  schoolAddress: string;
  schoolAddressEn: string;
  eiin: string;
  boardName: string;
  centerName: string;
  group: string; // Science | Humanities | Business Studies
  boardRoll: string;
  boardReg: string;
  session: string;
  passingYear: string;
  gpa: string;
  gradeLetter: string;
  issueDate: string;
  refNo: string;
  characterRemarks?: string;
}

// ─── EXACT 9.2in x 8.2in SIZE & MARGIN LAYOUT CONFIG ────────────────────────
export interface PrintLayoutConfig {
  fontScale: number;          // 85 to 115 (%)
  topMargin: number;          // inches, default 0.65
  leftMargin: number;         // inches, default 0.85 (balanced safe margin)
  rightMargin: number;        // inches, default 0.85 (balanced safe margin)
  bottomMargin: number;       // inches, default 0.65
  lineHeight: 'tight' | 'normal' | 'relaxed';
  signatureGap: number;       // px, e.g. 15
  borderOpacity: number;      // 0.5 to 1.0
  borderInset: number;        // mm, e.g. 0 to 5
  customPhone?: string;       // mobile number in header
  titleStyle?: 'cinzel' | 'playfair' | 'classic'; // stylish font option
}

const DEFAULT_LAYOUT_CONFIG: PrintLayoutConfig = {
  fontScale: 100,
  topMargin: 0.5,
  leftMargin: 0.5,
  rightMargin: 0.5,
  bottomMargin: 0.5,
  lineHeight: 'normal',
  signatureGap: 18,
  borderOpacity: 1.0,
  borderInset: 0,
  customPhone: '',
  titleStyle: 'cinzel'
};

// ─── PRINCIPAL NAME & TITLE TRANSLATION HELPER (FROM ADMIN SETTINGS) ────────
export function getEnglishPrincipalName(name?: string): string {
  if (!name || !name.trim()) return 'MOHAMMAD RAFIQUL ISLAM';
  const trimmed = name.trim();
  // If already contains English letters, use it in uppercase
  if (/[a-zA-Z]/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  // Bengali name mapping
  const bengaliMap: Record<string, string> = {
    'মোহাম্মদ রফিকুল ইসলাম': 'MOHAMMAD RAFIQUL ISLAM',
    'মো: রফিকুল ইসলাম': 'MD. RAFIQUL ISLAM',
    'মোঃ রফিকুল ইসলাম': 'MD. RAFIQUL ISLAM',
    'মোহাম্মদ নুরুল ইসলাম': 'MOHAMMAD NURUL ISLAM',
    'মোঃ নুরুল ইসলাম': 'MD. NURUL ISLAM',
    'মোহাম্মদ আবুল কালাম': 'MOHAMMAD ABUL KALAM',
    'মোঃ আবুল কালাম': 'MD. ABUL KALAM',
    'আব্দুর রহমান': 'ABDUR RAHMAN',
    'মো: আব্দুর রহমান': 'MD. ABDUR RAHMAN'
  };
  if (bengaliMap[trimmed]) return bengaliMap[trimmed];
  
  let converted = trimmed
    .replace(/মোহাম্মদ/g, 'MOHAMMAD')
    .replace(/মোঃ/g, 'MD.')
    .replace(/মো:/g, 'MD.')
    .replace(/মাওলানা/g, 'MAULANA')
    .replace(/ড./g, 'DR.')
    .replace(/ডক্টর/g, 'DR.')
    .replace(/রফিকুল/g, 'RAFIQUL')
    .replace(/ইসলাম/g, 'ISLAM')
    .replace(/আহমেদ/g, 'AHMED')
    .replace(/হোসেন/g, 'HOSSAIN')
    .replace(/রহমান/g, 'RAHMAN')
    .replace(/উদ্দিন/g, 'UDDIN')
    .replace(/চৌধুরী/g, 'CHOWDHURY')
    .replace(/খান/g, 'KHAN')
    .replace(/হক/g, 'HAQUE')
    .replace(/আলী/g, 'ALI')
    .replace(/কালাম/g, 'KALAM')
    .replace(/হাসান/g, 'HASAN');

  return /[a-zA-Z]/.test(converted) ? converted : trimmed;
}

export function cleanFatherName(name?: string): string {
  if (!name || !name.trim()) return 'Md. Guardian';
  return name.trim().replace(/^Mr\.?\s+/i, '');
}

export function cleanMotherName(name?: string): string {
  if (!name || !name.trim()) return 'Fatema Begum';
  return name.trim().replace(/^Mrs\.?\s+/i, '');
}

export function getEnglishPrincipalTitle(title?: string): string {
  if (!title || !title.trim()) return 'Headmaster';
  const t = title.trim();
  if (t.includes('প্রধান শিক্ষক') || t.toLowerCase().includes('headmaster')) return 'Headmaster';
  if (t.includes('অধ্যক্ষ') || t.toLowerCase().includes('principal')) return 'Principal';
  if (t.includes('ভারপ্রাপ্ত') || t.toLowerCase().includes('acting')) return 'Acting Headmaster';
  return t;
}

// ─── SMART GENDER DETECTION HELPER ──────────────────────────────────────────
export function detectGender(genderRaw?: string, name?: string): 'Male' | 'Female' | 'Other' {
  if (genderRaw) {
    const g = genderRaw.trim().toLowerCase();
    if (g === 'female' || g === 'মহিলা' || g === 'ছাত্রী' || g === 'f') return 'Female';
    if (g === 'male' || g === 'পুরুষ' || g === 'ছাত্র' || g === 'm') return 'Male';
  }
  if (name) {
    const n = name.trim().toLowerCase();
    if (
      n.includes('আক্তার') || n.includes('খাতুন') || n.includes('বেগম') ||
      n.includes('শ্রাবন্তী') || n.includes('ফাতিমা') || n.includes('ফাতেমা') ||
      n.includes('জান্নাত') || n.includes('নুসরাত') || n.includes('মারিয়া') ||
      n.includes('মিতা') || n.includes('অনিকা') || n.includes('তানজিলা') ||
      n.includes('রোকসানা') || n.includes('আয়েশা') || n.includes('সুলতানা') ||
      n.includes('রুবিনা') || n.includes('শারমিন') || n.includes('সানজিদা') ||
      n.includes('akter') || n.includes('khatun') || n.includes('begum') ||
      n.includes('shrabanti') || n.includes('fatema') || n.includes('jannat') ||
      n.includes('anika') || n.includes('sultana') || n.includes('ayesha') ||
      n.includes('sarmin') || n.includes('nusrat') || n.includes('maria')
    ) {
      return 'Female';
    }
  }
  return 'Male';
}

// ─── ENGLISH HELPER UTILITIES ────────────────────────────────────────────────

export function translateGroupToEnglish(grp?: string): string {
  if (!grp) return 'Science';
  const g = grp.toLowerCase();
  if (g.includes('বিজ্ঞান') || g.includes('sci')) return 'Science';
  if (g.includes('মানবিক') || g.includes('hum') || g.includes('art')) return 'Humanities';
  if (g.includes('ব্যবসায়') || g.includes('ব্যবসা') || g.includes('com') || g.includes('bus')) return 'Business Studies';
  return grp;
}

export function translateBoardToEnglish(board?: string): string {
  if (!board) return 'Board of Intermediate and Secondary Education, Chattogram';
  const b = board.toLowerCase();
  if (b.includes('চট্টগ্রাম') || b.includes('chattogram') || b.includes('chittagong')) {
    return 'Board of Intermediate and Secondary Education, Chattogram';
  }
  if (b.includes('ঢাকা') || b.includes('dhaka')) {
    return 'Board of Intermediate and Secondary Education, Dhaka';
  }
  if (b.includes('রাজশাহী') || b.includes('rajshahi')) {
    return 'Board of Intermediate and Secondary Education, Rajshahi';
  }
  if (b.includes('কুমিল্লা') || b.includes('comilla') || b.includes('cumilla')) {
    return 'Board of Intermediate and Secondary Education, Cumilla';
  }
  if (b.includes('যশোর') || b.includes('jessore') || b.includes('jashore')) {
    return 'Board of Intermediate and Secondary Education, Jashore';
  }
  if (b.includes('বরিশাল') || b.includes('barisal') || b.includes('barishal')) {
    return 'Board of Intermediate and Secondary Education, Barishal';
  }
  if (b.includes('সিলেট') || b.includes('sylhet')) {
    return 'Board of Intermediate and Secondary Education, Sylhet';
  }
  if (b.includes('দিনাজপুর') || b.includes('dinajpur')) {
    return 'Board of Intermediate and Secondary Education, Dinajpur';
  }
  if (b.includes('ময়মনসিংহ') || b.includes('mymensingh')) {
    return 'Board of Intermediate and Secondary Education, Mymensingh';
  }
  if (b.includes('মাদ্রাসা') || b.includes('madrasah')) {
    return 'Bangladesh Madrasah Education Board, Dhaka';
  }
  if (b.includes('কারিগরি') || b.includes('technical')) {
    return 'Bangladesh Technical Education Board, Dhaka';
  }
  return board;
}

export function getEnglishSchoolName(nameBn?: string): string {
  if (!nameBn) return 'BORAITOLI HIGH SCHOOL';
  if (nameBn.includes('বরইতলী')) return 'BORAITOLI HIGH SCHOOL';
  return nameBn;
}

export function getEnglishSchoolAddress(addrBn?: string): string {
  if (!addrBn) return 'Boraitoli, Chakaria, Cox\'s Bazar';
  if (addrBn.includes('বরইতলী')) return 'Boraitoli, Chakaria, Cox\'s Bazar';
  return addrBn;
}

export function formatDobInWords(dobStr?: string): string {
  if (!dobStr) return '';
  try {
    const parts = dobStr.includes('-') ? dobStr.split('-') : dobStr.split('/');
    let year = 2009, month = 5, day = 14;
    if (parts[0].length === 4) {
      year = parseInt(parts[0]);
      month = parseInt(parts[1]);
      day = parseInt(parts[2]);
    } else {
      day = parseInt(parts[0]);
      month = parseInt(parts[1]);
      year = parseInt(parts[2]);
    }
    const days = [
      '', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
      'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth',
      'Nineteenth', 'Twentieth', 'Twenty-First', 'Twenty-Second', 'Twenty-Third', 'Twenty-Fourth', 'Twenty-Fifth',
      'Twenty-Sixth', 'Twenty-Seventh', 'Twenty-Eighth', 'Twenty-Ninth', 'Thirtieth', 'Thirty-First'
    ];
    const months = [
      '', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayWord = days[day] || `${day}th`;
    const monthWord = months[month] || '';
    
    let yearWord = `${year}`;
    if (year >= 2000 && year < 2100) {
      const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
      const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      const rem = year - 2000;
      if (rem === 0) yearWord = 'Two Thousand';
      else if (rem < 10) yearWord = `Two Thousand ${units[rem]}`;
      else if (rem < 20) yearWord = `Two Thousand ${teens[rem - 10]}`;
      else {
        const t = Math.floor(rem / 10);
        const u = rem % 10;
        yearWord = `Two Thousand ${tens[t]}${u > 0 ? '-' + units[u] : ''}`;
      }
    }
    return `${dayWord} ${monthWord} ${yearWord}`.trim();
  } catch (e) {
    return '';
  }
}

function SSCTestimonialsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const [mounted, setMounted] = useState(false);
  const [currentLang, setCurrentLang] = useState<AppLanguage>('bn');
  const [activeTab, setActiveTab] = useState<MainTab>('single_generator');

  // Synchronize activeTab with URL ?tab= query parameter
  useEffect(() => {
    if (tabParam) {
      if (tabParam === 'settings' || tabParam === 'border_manager') {
        setActiveTab('settings');
      } else if (['single_generator', 'bulk_generator', 'batch_print', 'register'].includes(tabParam)) {
        setActiveTab(tabParam as MainTab);
      }
    }
  }, [tabParam]);

  const handleTabChange = (newTab: MainTab) => {
    setActiveTab(newTab);
    router.push(`/dashboard/ssc-transcript?tab=${newTab}`, { scroll: false });
  };
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(settingsService.getSettings());

  // ─── SIZE & LAYOUT CONTROLS ────────────────────────────────────────────────
  const [layoutConfig, setLayoutConfig] = useState<PrintLayoutConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sms_ssc_layout_config_v2');
      if (saved) {
        try { 
          const parsed = JSON.parse(saved);
          if (parsed.topMargin === 0.65 || parsed.leftMargin === 0.85) {
            return {
              ...DEFAULT_LAYOUT_CONFIG,
              ...parsed,
              topMargin: 0.5,
              leftMargin: 0.5,
              rightMargin: 0.5,
              bottomMargin: 0.5
            };
          }
          return { ...DEFAULT_LAYOUT_CONFIG, ...parsed }; 
        } catch (e) {}
      }
    }
    return DEFAULT_LAYOUT_CONFIG;
  });

  const [showLayoutDrawer, setShowLayoutDrawer] = useState(false);

  const updateLayoutConfig = (newConfig: Partial<PrintLayoutConfig>) => {
    setLayoutConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      if (typeof window !== 'undefined') {
        localStorage.setItem('sms_ssc_layout_config_v2', JSON.stringify(updated));
      }
      return updated;
    });
  };

  // ─── PNG BORDER SLOTS (Min 3 Borders) ──────────────────────────────────────
  const [customBorders, setCustomBorders] = useState<CustomPngBorder[]>([]);
  const [selectedBorderId, setSelectedBorderId] = useState<string>('none');
  const [directBorderUrl, setDirectBorderUrl] = useState<string>('');

  // Students & Testimonials State
  const [students, setStudents] = useState<Student[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [passingYearFilter, setPassingYearFilter] = useState('2026');
  const [groupFilter, setGroupFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Single Form State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [singleStudentName, setSingleStudentName] = useState('');
  const [singleFatherName, setSingleFatherName] = useState('');
  const [singleMotherName, setSingleMotherName] = useState('');
  const [singleVillage, setSingleVillage] = useState('Boraitoli');
  const [singlePostOffice, setSinglePostOffice] = useState('Boraitoli');
  const [singleUpazilla, setSingleUpazilla] = useState('Chakaria');
  const [singleDistrict, setSingleDistrict] = useState("Cox's Bazar");
  const [singleDob, setSingleDob] = useState('2009-05-14');
  const [singleGender, setSingleGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [singleGroup, setSingleGroup] = useState('Science');
  const [singleBoardRoll, setSingleBoardRoll] = useState('102931');
  const [singleBoardReg, setSingleBoardReg] = useState('1810293819');
  const [singleSession, setSingleSession] = useState('2024-2025');
  const [singlePassingYear, setSinglePassingYear] = useState('2026');
  const [singleGpa, setSingleGpa] = useState('5.00');
  const [singleGradeLetter, setSingleGradeLetter] = useState('A+');
  const [singleRefNo, setSingleRefNo] = useState('');
  const [singleIssueDate, setSingleIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [singleRemarks, setSingleRemarks] = useState('He bears an exemplary moral character.');

  // Active Preview / Print Modals
  const [previewTestimonial, setPreviewTestimonial] = useState<SSCTestimonialRecord | null>(null);
  const [batchPrintList, setBatchPrintList] = useState<SSCTestimonialRecord[]>([]);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});
  const loadData = useCallback(() => {
    if (typeof window === 'undefined') return;
    const allStudents = studentService.getAllStudents();
    setStudents(allStudents);
    const certs = certificateService.getCertificates();
    setCertificates(certs);
    const settings = settingsService.getSettings();
    setSchoolSettings(settings);

    let borders: CustomPngBorder[] = settings.customBorders || [];
    if (borders.length === 0) {
      if (settings.customBorderPng) {
        borders = [{ id: 'border-1', name: 'বর্ডার ১ (কাস্টম ফ্রেম)', url: settings.customBorderPng }];
      } else {
        borders = [];
      }
    }
    setCustomBorders(borders);
    const initialBorderId = settings.selectedBorderId || (borders.length > 0 ? borders[0].id : 'none');
    setSelectedBorderId(initialBorderId);
    if (settings.customBorderPng) {
      setDirectBorderUrl(settings.customBorderPng);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    setCurrentLang(languageService.getLanguage());
    const unsubLang = languageService.subscribe(l => setCurrentLang(l));
    loadData();

    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    setSingleRefNo(`BHS/SSC-TEST/${year}/${rand}`);

    // Sync latest principal name and phone from Admin Settings automatically
    const handleSyncSettings = () => {
      setSchoolSettings(settingsService.getSettings());
    };
    window.addEventListener('focus', handleSyncSettings);
    window.addEventListener('storage', handleSyncSettings);

    return () => {
      unsubLang();
      window.removeEventListener('focus', handleSyncSettings);
      window.removeEventListener('storage', handleSyncSettings);
    };
  }, [loadData]);

  // Candidates list: Class 10 / SSC examinees
  const sscCandidates = useMemo(() => {
    return students.filter((s) => {
      const is10 = s.grade === '10th' || s.grade === 'SSC' || s.grade === '10';
      const grpEn = translateGroupToEnglish(s.group);
      const matchGroup = groupFilter === 'all' || s.group === groupFilter || grpEn === groupFilter;
      const matchSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.roll.includes(searchQuery);
      return is10 && matchGroup && matchSearch;
    });
  }, [students, groupFilter, searchQuery]);

  // Generate Ultra High-DPI QR Code for Testimonial verification
  const generateQRCode = useCallback(async (record: SSCTestimonialRecord) => {
    try {
      const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/ssc-testimonial?ref=${encodeURIComponent(
        record.refNo
      )}&roll=${record.boardRoll}&reg=${record.boardReg}&year=${record.passingYear}`;
      const url = await QRCode.toDataURL(verifyUrl, {
        width: 240,
        margin: 1,
        scale: 4,
        color: { dark: '#0f172a', light: '#ffffff' }
      });
      setQrCodeDataUrls((prev) => ({ ...prev, [record.id]: url }));
      return url;
    } catch (e) {
      return '';
    }
  }, []);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // ─── PNG BORDER MANAGEMENT ────────────────────────────────────────────────
  const handleSelectBorder = (borderId: string) => {
    setSelectedBorderId(borderId);
    if (borderId === 'none') {
      setDirectBorderUrl('');
    } else {
      const found = customBorders.find((b) => b.id === borderId);
      if (found) setDirectBorderUrl(found.url);
    }
    settingsService.updateSettings({ selectedBorderId: borderId });
    setSchoolSettings(settingsService.getSettings());
    showAlert('success', borderId === 'none' ? 'বর্ডার ছাড়া প্লেইন ফ্রেম নির্বাচিত হয়েছে!' : 'পিএনজি বর্ডার ফ্রেম সক্রিয় করা হয়েছে!');
  };

  const handleDirectBorderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png') && !file.type.includes('image')) {
      return showAlert('error', 'অনুগ্রহ করে পিএনজি (PNG) ফরম্যাটের ট্রান্সপারেন্ট বর্ডার ফাইল নির্বাচন করুন!');
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      if (base64) {
        setDirectBorderUrl(base64);
        const newBorderObj: CustomPngBorder = {
          id: `border-custom-${Date.now()}`,
          name: `বর্ডার (${file.name.replace(/\.[^/.]+$/, '').substring(0, 15)})`,
          url: base64
        };
        const updated = [newBorderObj, ...customBorders.slice(0, 2)];
        setCustomBorders(updated);
        setSelectedBorderId(newBorderObj.id);
        settingsService.updateSettings({ customBorderPng: base64, customBorders: updated, selectedBorderId: newBorderObj.id });
        setSchoolSettings(settingsService.getSettings());
        showAlert('success', 'নতুন পিএনজি বর্ডার সফলভাবে যুক্ত হয়েছে!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClearBorder = () => {
    setDirectBorderUrl('');
    setSelectedBorderId('none');
    settingsService.updateSettings({ customBorderPng: '', selectedBorderId: 'none' });
    setSchoolSettings(settingsService.getSettings());
    showAlert('success', 'পিএনজি বর্ডার সরানো হয়েছে!');
  };

  const handleUploadBorderSlot = (slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png') && !file.type.includes('image')) {
      return showAlert('error', 'অনুগ্রহ করে পিএনজি (PNG) ফরম্যাটের ট্রান্সপারেন্ট বর্ডার ফাইল নির্বাচন করুন!');
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      if (base64) {
        const updated = [...customBorders];
        const newBorderObj: CustomPngBorder = {
          id: `border-slot-${slotIndex + 1}-${Date.now()}`,
          name: `বর্ডার ${slotIndex + 1} (${file.name.replace(/\.[^/.]+$/, '').substring(0, 15)})`,
          url: base64
        };

        if (slotIndex < updated.length) {
          updated[slotIndex] = newBorderObj;
        } else {
          updated.push(newBorderObj);
        }

        setCustomBorders(updated);
        setSelectedBorderId(newBorderObj.id);
        setDirectBorderUrl(base64);
        settingsService.updateSettings({ customBorders: updated, selectedBorderId: newBorderObj.id, customBorderPng: base64 });
        setSchoolSettings(settingsService.getSettings());
        showAlert('success', `স্লট ${slotIndex + 1} এ নতুন পিএনজি বর্ডার সফলভাবে সংরক্ষিত হয়েছে!`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeleteBorder = (borderId: string) => {
    const updated = customBorders.filter((b) => b.id !== borderId);
    setCustomBorders(updated);
    const newSelected = selectedBorderId === borderId ? (updated.length > 0 ? updated[0].id : 'none') : selectedBorderId;
    setSelectedBorderId(newSelected);
    if (newSelected === 'none') {
      setDirectBorderUrl('');
    } else {
      const f = updated.find(b => b.id === newSelected);
      if (f) setDirectBorderUrl(f.url);
    }
    settingsService.updateSettings({ customBorders: updated, selectedBorderId: newSelected });
    setSchoolSettings(settingsService.getSettings());
    showAlert('success', 'পিএনজি বর্ডার মুছে ফেলা হয়েছে!');
  };

  // Select Student for Single Form
  const handleSelectStudentForSingle = (s: Student) => {
    setSelectedStudent(s);
    setSingleStudentName(s.name || '');
    setSingleFatherName(s.fatherName || 'Md. Ibrahim');
    setSingleMotherName(s.motherName || 'Fatema Begum');
    setSingleVillage((s as any).village || 'Boraitoli');
    setSinglePostOffice((s as any).postOffice || 'Boraitoli');
    setSingleUpazilla((s as any).upazilla || (s as any).upazila || 'Chakaria');
    setSingleDistrict((s as any).district || "Cox's Bazar");
    setSingleDob(s.dob || '2009-05-14');
    setSingleGender((s.gender as any) || 'Male');
    setSingleGroup(translateGroupToEnglish(s.group));
    const pseudoBoardRoll = (102000 + parseInt(s.roll || '1')).toString();
    const pseudoRegNo = `1810293${s.roll?.padStart(3, '0') || '001'}`;
    setSingleBoardRoll(pseudoBoardRoll);
    setSingleBoardReg(pseudoRegNo);
    handleTabChange('single_generator');
  };

  // Convert Student to SSCTestimonialRecord helper (English)
  const createTestimonialRecordFromStudent = (
    s: Student,
    rollOffset = 0,
    customGpa = '5.00',
    customBoardRoll?: string
  ): SSCTestimonialRecord => {
    const englishGroup = translateGroupToEnglish(s.group);
    const boardRollVal = customBoardRoll || (102900 + parseInt(s.roll || '1') + rollOffset).toString();
    const boardRegVal = `1810293${(parseInt(s.roll || '1') + rollOffset).toString().padStart(3, '0')}`;
    const id = `TESTIMONIAL-SSC-${passingYearFilter}-${s.id || Math.random().toString(36).substring(7)}`;
    const studentGender: 'Male' | 'Female' | 'Other' = detectGender(s.gender as any, s.name);
    const dobStr = s.dob || '2009-05-14';

    return {
      id,
      studentId: s.id,
      studentName: s.name,
      fatherName: s.fatherName || 'Md. Rafiqul Islam',
      motherName: s.motherName || 'Fatema Begum',
      village: (s as any).village || 'Boraitoli',
      postOffice: (s as any).postOffice || 'Boraitoli',
      upazilla: (s as any).upazilla || (s as any).upazila || 'Chakaria',
      district: (s as any).district || "Cox's Bazar",
      dob: dobStr,
      dobWords: formatDobInWords(dobStr),
      gender: studentGender,
      schoolName: schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
      schoolNameEn: getEnglishSchoolName(schoolSettings.schoolName),
      schoolAddress: schoolSettings.address || 'বরইতলী, চকরিয়া, কক্সবাজার।',
      schoolAddressEn: getEnglishSchoolAddress(schoolSettings.address),
      eiin: schoolSettings.eiin || '106184',
      boardName: translateBoardToEnglish(currentLang === 'en' ? 'Board of Intermediate and Secondary Education, Chattogram' : 'চট্টগ্রাম মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড'),
      centerName: 'Chakaria-1',
      group: englishGroup,
      boardRoll: boardRollVal,
      boardReg: boardRegVal,
      session: '2024-2025',
      passingYear: passingYearFilter,
      gpa: customGpa,
      gradeLetter: parseFloat(customGpa) >= 5.0 ? 'A+' : parseFloat(customGpa) >= 4.0 ? 'A' : 'A-',
      issueDate: new Date().toISOString().split('T')[0],
      refNo: `BHS/SSC/${passingYearFilter}/${(100 + rollOffset).toString()}`,
      characterRemarks: studentGender === 'Female' ? 'She bears an exemplary moral character.' : 'He bears an exemplary moral character.'
    };
  };

  // ─── STEP 1-A: DOWNLOAD EXCEL SAMPLE TEMPLATE (.XLSX) ──────────────────────
  const handleDownloadExcelTemplate = () => {
    try {
      const candidateList = sscCandidates;

      const excelData = candidateList.map((s, idx) => {
        const pseudoBoardRoll = (102900 + parseInt(s.roll || `${idx + 1}`)).toString();
        const pseudoRegNo = `1810293${(s.roll || `${idx + 1}`).toString().padStart(3, '0')}`;
        const gender = s.gender === 'Female' ? 'Female' : 'Male';
        const grpEn = translateGroupToEnglish(s.group);

        return {
          'Student_ID': s.id || `std-${idx + 1}`,
          'Class_Roll': s.roll || `${idx + 1}`,
          'Student_Name': s.name || '',
          'Father_Name': s.fatherName || 'Md. Guardian',
          'Mother_Name': s.motherName || 'Fatema Begum',
          'Gender': gender,
          'Group': grpEn,
          'Session': '2024-2025',
          'Board_Reg_No': pseudoRegNo,
          'Board_Roll': pseudoBoardRoll,
          'GPA': '5.00',
          'Letter_Grade': 'A+',
          'Passing_Year': passingYearFilter || '2026',
          'Date_of_Birth': s.dob || '2009-05-14',
          'Character_Remarks': gender === 'Female' ? 'She bears an exemplary moral character.' : 'He bears an exemplary moral character.',
          'Village': 'Boraitoli',
          'Post_Office': 'Boraitoli',
          'Upazilla': 'Chakaria',
          'District': "Cox's Bazar"
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);

      worksheet['!cols'] = [
        { wch: 14 }, // Student_ID
        { wch: 10 }, // Class_Roll
        { wch: 28 }, // Student_Name
        { wch: 24 }, // Father_Name
        { wch: 24 }, // Mother_Name
        { wch: 12 }, // Gender
        { wch: 16 }, // Group
        { wch: 12 }, // Session
        { wch: 18 }, // Board_Reg_No
        { wch: 14 }, // Board_Roll
        { wch: 10 }, // GPA
        { wch: 12 }, // Letter_Grade
        { wch: 14 }, // Passing_Year
        { wch: 16 }, // Date_of_Birth
        { wch: 42 }, // Character_Remarks
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'SSC_Candidates');
      XLSX.writeFile(workbook, `SSC_Testimonial_Students_Template_${passingYearFilter || '2026'}.xlsx`);
      showAlert('success', `১০ম শ্রেণির ${candidateList.length} জন শিক্ষার্থীর তথ্য ছক এক্সেল (.xlsx) নমুনা ফাইল ডাউনলোড হয়েছে!`);
    } catch (err: any) {
      console.error('Error generating Excel file:', err);
      showAlert('error', 'এক্সেল ফাইল তৈরিতে সমস্যা হয়েছে। সিএসভি টেমপ্লেটটি ব্যবহার করতে পারেন।');
    }
  };

  // ─── STEP 1-B: DOWNLOAD SSC CANDIDATE CSV TEMPLATE (ENGLISH FORMAT) ──────────
  const handleDownloadSSCCandidateCSV = () => {
    if (sscCandidates.length === 0) {
      return showAlert('error', '১০ম শ্রেণির কোনো পরীক্ষার্থী পাওয়া যায়নি!');
    }

    const headers = [
      'student_id',
      'class_roll',
      'student_name',
      'father_name',
      'mother_name',
      'gender',
      'group',
      'session',
      'board_reg',
      'board_roll',
      'gpa',
      'grade_letter',
      'passing_year',
      'date_of_birth',
      'character_remarks'
    ];

    const rows = sscCandidates.map((s) => {
      const pseudoBoardRoll = (102000 + parseInt(s.roll || '1')).toString();
      const pseudoRegNo = `1810293${s.roll?.padStart(3, '0') || '001'}`;
      const gender = s.gender || 'Male';
      const grpEn = translateGroupToEnglish(s.group);

      return [
        s.id,
        s.roll,
        `"${s.name}"`,
        `"${s.fatherName || 'Md. Ibrahim'}"`,
        `"${s.motherName || 'Fatema Begum'}"`,
        gender,
        grpEn,
        '2024-2025',
        pseudoRegNo,
        pseudoBoardRoll,
        '5.00',
        'A+',
        passingYearFilter,
        s.dob || '2009-05-14',
        `"${gender === 'Female' ? 'She bears a good moral character.' : 'He bears a good moral character.'}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SSC_Candidates_English_Testimonial_Template_${passingYearFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert('success', `১০ম শ্রেণির ${sscCandidates.length} জন পরীক্ষার্থীর সিএসভি টেমপ্লেট ডাউনলোড হয়েছে!`);
  };

  // ─── STEP 2: BULK EXCEL / CSV UPLOAD & GENERATE ALL (ENGLISH TESTIMONIALS) ─
  const handleBulkFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkProcessing(true);

    try {
      let dataRows: any[][] = [];

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        if (rawRows.length <= 1) {
          throw new Error('এক্সেল ফাইলে কোনো শিক্ষার্থীর ডাটা পাওয়া যায়নি!');
        }
        dataRows = rawRows.slice(1).filter((r) => r.some((c) => c !== null && c !== undefined && c.toString().trim().length > 0));
      } else {
        const text = await file.text();
        if (!text) throw new Error('ফাইলটি সম্পূর্ণ খালি!');
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          throw new Error('CSV ফাইলে কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি!');
        }
        dataRows = lines.slice(1).map((line) => line.split(',').map((c) => c.replace(/^"|"$/g, '').trim()));
      }

      if (dataRows.length === 0) {
        throw new Error('ফাইলে কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি!');
      }

      const newTestimonials: SSCTestimonialRecord[] = [];
      const certBatchRecords: (Omit<CertificateRecord, 'id' | 'createdDate'> & { id?: string })[] = [];

      dataRows.forEach((cols, idx) => {
        if (cols.length >= 3) {
          const studentId = cols[0]?.toString().trim() || `std-${idx + 1}`;
          const roll = cols[1]?.toString().trim() || `${idx + 1}`;
          const name = cols[2]?.toString().trim() || `Student ${idx + 1}`;
          const father = cols[3]?.toString().trim() || 'Md. Guardian';
          const mother = cols[4]?.toString().trim() || 'Fatema Begum';
          const genderRaw = cols[5]?.toString().trim().toLowerCase() || 'male';
          const genderVal: 'Male' | 'Female' | 'Other' = (genderRaw === 'female' || genderRaw === 'মহিলা' || genderRaw === 'ছাত্রী') ? 'Female' : 'Male';
          const grp = translateGroupToEnglish(cols[6]?.toString().trim() || 'Science');
          const sess = cols[7]?.toString().trim() || '2024-2025';
          const bReg = cols[8]?.toString().trim() || `181029300${idx + 1}`;
          const bRoll = cols[9]?.toString().trim() || `${102900 + idx + 1}`;
          const gpaVal = cols[10]?.toString().trim() || '5.00';
          const gradeLet = cols[11]?.toString().trim() || (parseFloat(gpaVal) >= 5.0 ? 'A+' : 'A');
          const yearVal = cols[12]?.toString().trim() || passingYearFilter;
          const dobVal = cols[13]?.toString().trim() || '2009-05-14';
          const remarks = cols[14]?.toString().trim() || (genderVal === 'Female' ? 'She bears an exemplary moral character.' : 'He bears an exemplary moral character.');
          const village = cols[15]?.toString().trim() || 'Boraitoli';
          const postOffice = cols[16]?.toString().trim() || 'Boraitoli';
          const upazilla = cols[17]?.toString().trim() || 'Chakaria';
          const district = cols[18]?.toString().trim() || "Cox's Bazar";

          const rec: SSCTestimonialRecord = {
            id: `TESTIMONIAL-SSC-${yearVal}-${idx + 1}`,
            studentId,
            studentName: name,
            fatherName: father,
            motherName: mother,
            village,
            postOffice,
            upazilla,
            district,
            dob: dobVal,
            dobWords: formatDobInWords(dobVal),
            gender: genderVal,
            schoolName: schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
            schoolNameEn: getEnglishSchoolName(schoolSettings.schoolName),
            schoolAddress: schoolSettings.address || 'বরইতলী, চকরিয়া, কক্সবাজার।',
            schoolAddressEn: getEnglishSchoolAddress(schoolSettings.address),
            eiin: schoolSettings.eiin || '106184',
            boardName: 'Board of Intermediate and Secondary Education, Chattogram',
            centerName: 'Chakaria-1',
            group: grp,
            boardRoll: bRoll,
            boardReg: bReg,
            session: sess,
            passingYear: yearVal,
            gpa: gpaVal,
            gradeLetter: gradeLet,
            issueDate: new Date().toISOString().split('T')[0],
            refNo: `BHS/SSC/${yearVal}/${101 + idx}`,
            characterRemarks: remarks
          };
          newTestimonials.push(rec);

          certBatchRecords.push({
            type: 'ssc_testimonial',
            issueDate: new Date().toISOString().split('T')[0],
            refNo: rec.refNo,
            studentId,
            studentName: name,
            fatherName: father,
            motherName: mother,
            village,
            postOffice,
            upazila: upazilla,
            district,
            dob: dobVal,
            grade: '10th',
            roll,
            section: 'A',
            group: grp,
            boardRoll: bRoll,
            boardReg: bReg,
            session: sess,
            passingYear: yearVal,
            gpa: gpaVal,
            characterRemarks: remarks,
            isAlumni: true,
            padType: 'digital_server'
          });
        }
      });

      if (certBatchRecords.length > 0) {
        certificateService.saveBatchCertificates(certBatchRecords);
        setCertificates(certificateService.getCertificates());
      }

      for (const t of newTestimonials) {
        generateQRCode(t);
      }

      setBatchPrintList(newTestimonials);
      setBulkProcessing(false);
      showAlert('success', `অভিনন্দন! মোট ${newTestimonials.length} জন শিক্ষার্থীর ইংরেজি প্রশংসাপত্র (Testimonial) সফলভাবে তৈরি হয়েছে!`);
      handleTabChange('batch_print');
    } catch (err: any) {
      setBulkProcessing(false);
      showAlert('error', err.message || 'ফাইল প্রসেস করতে সমস্যা হয়েছে!');
    } finally {
      e.target.value = '';
    }
  };

  // Single Generate & Preview
  const handleGenerateSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleStudentName.trim() || !singleBoardRoll.trim()) {
      return showAlert('error', 'শিক্ষার্থীর নাম ও বোর্ড রোল পূরণ করা আবশ্যক!');
    }

    const record: SSCTestimonialRecord = {
      id: `TESTIMONIAL-SINGLE-${Date.now()}`,
      studentId: selectedStudent?.id || 'manual',
      studentName: singleStudentName,
      fatherName: singleFatherName,
      motherName: singleMotherName,
      village: singleVillage.trim() || 'Boraitoli',
      postOffice: singlePostOffice.trim() || 'Boraitoli',
      upazilla: singleUpazilla.trim() || 'Chakaria',
      district: singleDistrict.trim() || "Cox's Bazar",
      dob: singleDob,
      dobWords: formatDobInWords(singleDob),
      gender: singleGender,
      schoolName: schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
      schoolNameEn: getEnglishSchoolName(schoolSettings.schoolName),
      schoolAddress: schoolSettings.address || 'বরইতলী, চকরিয়া, কক্সবাজার।',
      schoolAddressEn: getEnglishSchoolAddress(schoolSettings.address),
      eiin: schoolSettings.eiin || '106184',
      boardName: 'Board of Intermediate and Secondary Education, Chattogram',
      centerName: 'Chakaria-1',
      group: translateGroupToEnglish(singleGroup),
      boardRoll: singleBoardRoll,
      boardReg: singleBoardReg,
      session: singleSession,
      passingYear: singlePassingYear,
      gpa: singleGpa,
      gradeLetter: singleGradeLetter,
      issueDate: singleIssueDate,
      refNo: singleRefNo,
      characterRemarks: singleRemarks
    };

    certificateService.saveCertificate({
      type: 'ssc_testimonial',
      issueDate: singleIssueDate,
      refNo: singleRefNo,
      studentId: record.studentId,
      studentName: singleStudentName,
      fatherName: singleFatherName,
      motherName: singleMotherName,
      village: singleVillage.trim() || 'Boraitoli',
      postOffice: singlePostOffice.trim() || 'Boraitoli',
      upazila: singleUpazilla.trim() || 'Chakaria',
      district: singleDistrict.trim() || "Cox's Bazar",
      dob: singleDob,
      grade: '10th',
      roll: selectedStudent?.roll || '01',
      section: 'A',
      group: record.group,
      boardRoll: singleBoardRoll,
      boardReg: singleBoardReg,
      session: singleSession,
      passingYear: singlePassingYear,
      gpa: singleGpa,
      characterRemarks: singleRemarks,
      isAlumni: true,
      padType: 'digital_server'
    });

    setCertificates(certificateService.getCertificates());
    generateQRCode(record);
    setPreviewTestimonial(record);
    showAlert('success', 'ইংরেজি প্রশংসাপত্র (Testimonial) সফলভাবে প্রস্তুত হয়েছে!');
  };

  // Quick Open Single Preview from Candidates Table
  const handleQuickPreviewCandidate = (s: Student, idx: number) => {
    const rec = createTestimonialRecordFromStudent(s, idx);
    generateQRCode(rec);
    setPreviewTestimonial(rec);
  };

  // 1-Click Print Single Certificate from Table or List
  const handlePrintSingleCertificate = (s: Student, idx: number) => {
    const rec = createTestimonialRecordFromStudent(s, idx);
    generateQRCode(rec);
    setPreviewTestimonial(rec);
    showAlert('success', `${s.name}-এর প্রশংসাপত্র প্রিন্টের জন্য প্রস্তুত!`);
  };
  // 1-Click Prepare All Candidates for Batch Print
  const handlePrepareAllCandidatesForBatch = () => {
    if (sscCandidates.length === 0) {
      return showAlert('error', '১০ম শ্রেণির কোনো পরীক্ষার্থী পাওয়া যায়নি!');
    }
    const all = sscCandidates.map((s, idx) => createTestimonialRecordFromStudent(s, idx));
    all.forEach((rec) => generateQRCode(rec));
    setBatchPrintList(all);
    handleTabChange('batch_print');
    showAlert('success', `${all.length} জন পরীক্ষার্থীর ইংরেজি প্রশংসাপত্র (Testimonials) প্রিন্টের জন্য প্রস্তুত!`);
  };

  const activeBorderUrl = useMemo(() => {
    if (directBorderUrl) return directBorderUrl;
    if (selectedBorderId === 'none') return null;
    const found = customBorders.find((b) => b.id === selectedBorderId);
    return found ? found.url : null;
  }, [directBorderUrl, customBorders, selectedBorderId]);

  if (!mounted) return null;

  return (
    <div className="space-y-6 print:p-0 print:m-0 print:space-y-0 text-slate-900">
      
      {/* ─── STYLISH FONT IMPORTS & PRINT CSS FOR EXACT 9.2in x 8.2in ─── */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Cinzel+Decorative:wght@700;900&display=swap');

        @media print {
          @page {
            size: 9.2in 8.2in !important;
            margin: 0mm !important;
          }
          html, body {
            margin: 0mm !important;
            padding: 0mm !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .testimonial-sheet-wrapper {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .testimonial-sheet {
            width: 9.2in !important;
            min-height: 8.2in !important;
            height: 8.2in !important;
            max-height: 8.2in !important;
            overflow: hidden !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            border: none !important;
            position: relative !important;
            background: #ffffff !important;
          }
          .testimonial-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .print-quality-boost {
            image-rendering: -webkit-optimize-contrast !important;
            image-rendering: high-quality !important;
            text-rendering: optimizeLegibility !important;
          }
        }
      `}</style>

      {/* ─── TOAST NOTIFICATION ────────────────────────────────────────── */}
      {alertMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold transition-all animate-bounce print:hidden ${
            alertMsg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {alertMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* ─── UNIFIED SINGLE-LINE HEADER BAR (একক লাইনে সকল মেন্যু ও একশন) ─── */}
      <div className="bg-white px-3.5 py-2.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap xl:flex-nowrap items-center justify-between gap-2.5 print:hidden">
        
        {/* Left: Branding & Size Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-xs">
            <Award size={18} />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs sm:text-sm font-black text-slate-950 whitespace-nowrap">
              এসএসসি প্রশংসাপত্র
            </h2>
            <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-200/80 text-indigo-700 rounded-md text-[10px] font-mono font-black whitespace-nowrap">
              ৯.২&quot; × ৮.২&quot;
            </span>
          </div>
        </div>

        {/* Center: The 5 Navigation Tabs in 1 Line */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar shrink-0">

          <button
            type="button"
            onClick={() => handleTabChange('single_generator')}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'single_generator'
                ? 'bg-slate-950 text-white shadow-xs ring-1 ring-indigo-400/50'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            <FileText size={13} className={activeTab === 'single_generator' ? 'text-indigo-400' : 'text-slate-400'} />
            প্রশংসা পত্র তৈরি
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('bulk_generator')}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'bulk_generator'
                ? 'bg-slate-950 text-white shadow-xs ring-1 ring-amber-400/50'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            <Award size={13} className={activeTab === 'bulk_generator' ? 'text-amber-400' : 'text-slate-400'} />
            বাল্ক
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('batch_print')}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'batch_print'
                ? 'bg-slate-950 text-white shadow-xs ring-1 ring-emerald-400/50'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            <Layers size={13} className={activeTab === 'batch_print' ? 'text-emerald-400' : 'text-slate-400'} />
            ব্যাচ প্রিন্ট প্রিভিউ ({batchPrintList.length} জন)
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('register')}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'register'
                ? 'bg-slate-950 text-white shadow-xs ring-1 ring-sky-400/50'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            <BookOpen size={13} className={activeTab === 'register' ? 'text-sky-400' : 'text-slate-400'} />
            প্রদানকৃত
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('settings')}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'settings' || activeTab === 'border_manager'
                ? 'bg-slate-950 text-white shadow-xs ring-1 ring-purple-400/50'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            <SlidersHorizontal size={13} className={activeTab === 'settings' || activeTab === 'border_manager' ? 'text-purple-400' : 'text-slate-400'} />
            সেটিংস (পিএনজি বর্ডার, সাইজ ও মার্জিন)
          </button>
        </div>

        {/* Right: Unified Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Direct PNG Border Upload */}
          <label className="relative cursor-pointer">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleDirectBorderUpload}
            />
            <span className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition border ${
              activeBorderUrl
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}>
              <Upload size={12} />
              {activeBorderUrl ? '✓ বর্ডার সেট' : 'বর্ডার আপলোড'}
            </span>
          </label>

          {activeBorderUrl && (
            <button
              type="button"
              onClick={handleClearBorder}
              title="বর্ডার সরান"
              className="px-2 py-1.5 rounded-xl font-bold text-xs border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer"
            >
              ✕
            </button>
          )}

          {/* Size & Margin Drawer Trigger */}
          <button
            type="button"
            onClick={() => setShowLayoutDrawer(!showLayoutDrawer)}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-xs ${
              showLayoutDrawer
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 font-black'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
            title="সাইজ ও মার্জিন কন্ট্রোল প্যানেল খুলুন"
          >
            <SlidersHorizontal size={12} />
            <span>সাইজ ও মার্জিন</span>
          </button>

          {/* Contextual Action Button */}
          {activeTab === 'settings' || activeTab === 'border_manager' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  updateLayoutConfig(DEFAULT_LAYOUT_CONFIG);
                  showAlert('success', 'ডিফল্ট সাইজ ও মার্জিনে রিসেট করা হয়েছে!');
                }}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                title="ডিফল্ট মাপ ও মার্জিনে রিসেট করুন"
              >
                <RotateCcw size={12} /> রিসেট
              </button>
              <button
                type="button"
                onClick={() => {
                  const sampleRec: SSCTestimonialRecord = {
                    id: 'sample-preview',
                    studentId: 'SAMPLE-01',
                    studentName: 'MOHAMMAD SHIHAB UDDIN',
                    fatherName: 'MD. IBRAHIM',
                    motherName: 'BEGUM FATEMA',
                    village: 'Boraitoli',
                    postOffice: 'Boraitoli',
                    upazilla: 'Chakaria',
                    district: "Cox's Bazar",
                    gender: 'Male',
                    dob: '2009-05-14',
                    dobWords: 'Fourteenth May Two Thousand and Nine',
                    schoolName: schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
                    schoolNameEn: getEnglishSchoolName(schoolSettings.schoolName),
                    schoolAddress: schoolSettings.address || 'বরইতলী, চকরিয়া, কক্সবাজার।',
                    schoolAddressEn: getEnglishSchoolAddress(schoolSettings.address),
                    eiin: schoolSettings.eiin || '106184',
                    centerName: 'Chakaria-1',
                    group: 'Science',
                    boardRoll: '102931',
                    boardReg: '1810293819',
                    session: '2024-2025',
                    passingYear: '2026',
                    boardName: 'Board of Intermediate and Secondary Education, Chattogram',
                    gpa: '5.00',
                    gradeLetter: 'A+',
                    issueDate: new Date().toISOString().split('T')[0],
                    refNo: 'BHS/SSC-TEST/2026/SAMPLE',
                    characterRemarks: 'He bears an exemplary moral character.'
                  };
                  generateQRCode(sampleRec);
                  setPreviewTestimonial(sampleRec);
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Eye size={12} /> নমুনা টেস্ট
              </button>
            </>
          ) : activeTab === 'batch_print' ? (
            <button
              type="button"
              onClick={() => window.print()}
              disabled={batchPrintList.length === 0}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Printer size={12} /> প্রিন্ট ({batchPrintList.length})
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePrepareAllCandidatesForBatch}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Printer size={12} /> বাল্ক প্রিন্ট ({sscCandidates.length})
            </button>
          )}
        </div>

      </div>

      {/* ─── INTERACTIVE SIZE & MARGIN ADJUSTMENT DRAWER ────────────────── */}
      {showLayoutDrawer && (
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 space-y-6 print:hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Settings2 size={18} className="text-amber-400" />
              <h3 className="font-black text-sm text-white">
                প্রশংসাপত্র সাইজ (৯.২&quot; × ৮.২&quot;), মার্জিন ও পিএনজি বর্ডার কন্ট্রোল
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setLayoutConfig(DEFAULT_LAYOUT_CONFIG);
                  localStorage.removeItem('sms_ssc_layout_config_v2');
                  showAlert('success', 'মার্জিন ও সাইজ ডিফল্ট মানে (০.৫ ইঞ্চি) রিসেট করা হয়েছে!');
                }}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={13} /> রিসেট (০.৫&quot;)
              </button>
              <button
                type="button"
                onClick={() => setShowLayoutDrawer(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
            
            {/* 1. Font Size Scaling */}
            <div className="space-y-2 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-300">ইংরেজি লেখার ফন্ট সাইজ:</span>
                <span className="font-mono text-amber-400 font-black">{layoutConfig.fontScale}%</span>
              </div>
              <input
                type="range"
                min="85"
                max="115"
                step="5"
                value={layoutConfig.fontScale}
                onChange={(e) => updateLayoutConfig({ fontScale: parseInt(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>85% (কমপ্যাক্ট)</span>
                <span>100%</span>
                <span>115% (লার্জ)</span>
              </div>
            </div>

            {/* 2. Top & Bottom Margin for Border */}
            <div className="space-y-2 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-300">টপ মার্জিন (বর্ডার সেফটি):</span>
                <span className="font-mono text-indigo-400 font-black">{layoutConfig.topMargin}&quot;</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.5"
                step="0.05"
                value={layoutConfig.topMargin}
                onChange={(e) => updateLayoutConfig({ topMargin: parseFloat(e.target.value) })}
                className="w-full accent-indigo-400 cursor-pointer"
              />
              <div className="flex justify-between items-center font-bold pt-1">
                <span className="text-slate-300">বটম মার্জিন:</span>
                <span className="font-mono text-indigo-400 font-black">{layoutConfig.bottomMargin}&quot;</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.5"
                step="0.05"
                value={layoutConfig.bottomMargin}
                onChange={(e) => updateLayoutConfig({ bottomMargin: parseFloat(e.target.value) })}
                className="w-full accent-indigo-400 cursor-pointer"
              />
            </div>

            {/* 3. Left & Right Margin for Border */}
            <div className="space-y-2 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-300">বাম মার্জিন:</span>
                <span className="font-mono text-emerald-400 font-black">{layoutConfig.leftMargin}&quot;</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.5"
                step="0.05"
                value={layoutConfig.leftMargin}
                onChange={(e) => updateLayoutConfig({ leftMargin: parseFloat(e.target.value) })}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between items-center font-bold pt-1">
                <span className="text-slate-300">ডান মার্জিন:</span>
                <span className="font-mono text-emerald-400 font-black">{layoutConfig.rightMargin}&quot;</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.5"
                step="0.05"
                value={layoutConfig.rightMargin}
                onChange={(e) => updateLayoutConfig({ rightMargin: parseFloat(e.target.value) })}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* 4. Line Spacing & Signature Gap */}
            <div className="space-y-2.5 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
              <span className="text-slate-300 font-bold block">প্যারাগ্রাফ লাইন স্পেসিং:</span>
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl">
                {(['tight', 'normal', 'relaxed'] as const).map((lh) => (
                  <button
                    key={lh}
                    type="button"
                    onClick={() => updateLayoutConfig({ lineHeight: lh })}
                    className={`py-1 rounded-lg text-[10px] font-black transition cursor-pointer capitalize ${
                      layoutConfig.lineHeight === lh ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    {lh === 'tight' ? 'টাইট' : lh === 'normal' ? 'স্বাভাবিক' : 'খোলামেলা'}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center font-bold pt-1">
                <span className="text-slate-300 text-[11px]">স্বাক্ষর স্পেস:</span>
                <span className="font-mono text-sky-400 font-bold">{layoutConfig.signatureGap}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                step="2"
                value={layoutConfig.signatureGap}
                onChange={(e) => updateLayoutConfig({ signatureGap: parseInt(e.target.value) })}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

          </div>

          {/* 5. Extra Settings: Mobile Number & Stylish Font Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-xs">
            <div className="space-y-1.5 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
              <span className="text-slate-300 font-bold block">স্কুলের মোবাইল নম্বর (Header Mobile No):</span>
              <input
                type="text"
                placeholder="e.g. 01819-640163"
                value={layoutConfig.customPhone !== undefined ? layoutConfig.customPhone : (schoolSettings?.phone || '01819-640163')}
                onChange={(e) => updateLayoutConfig({ customPhone: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-black text-amber-400 outline-none"
              />
              <p className="text-[10px] text-slate-400">প্রশংসাপত্রের হেডারে ঠিকানা ও EIIN-এর পাশে প্রদর্শিত হবে।</p>
            </div>

            <div className="space-y-1.5 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
              <span className="text-slate-300 font-bold block">TESTIMONIAL টাইটেল ফন্ট স্টাইল:</span>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1.5 rounded-xl">
                {(['cinzel', 'playfair', 'classic'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => updateLayoutConfig({ titleStyle: style })}
                    className={`py-2 rounded-lg text-[10px] font-black transition cursor-pointer capitalize ${
                      (layoutConfig.titleStyle || 'cinzel') === style ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {style === 'cinzel' ? 'Cinzel রাজকীয়' : style === 'playfair' ? 'Playfair মার্জিত' : 'ক্লাসিক সেরিফ'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">বোল্ড ও স্টাইলিস্ট সার্টিফিকেশন টাইটেল প্রদর্শিত হবে।</p>
            </div>
          </div>

          {/* PNG Border Selection inside Drawer */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-amber-400" />
              <span className="font-bold text-slate-300">সক্রিয় পিএনজি বর্ডার:</span>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectBorder('none')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    !activeBorderUrl
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  কোনো বর্ডার নয়
                </button>

                {customBorders.map((b, idx) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectBorder(b.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      selectedBorderId === b.id
                        ? 'bg-indigo-600 text-white font-black ring-2 ring-indigo-400'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Check size={12} className={selectedBorderId === b.id ? 'opacity-100' : 'opacity-0'} />
                    {b.name || `বর্ডার ${idx + 1}`}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleTabChange('settings')}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} /> ৩টি স্লট ফ্রেম ম্যানেজ করুন
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: BULK TESTIMONIAL GENERATOR                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'bulk_generator' && (
        <div className="space-y-6 print:hidden">
          
          {/* Top Filter & CSV Action Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-950 text-base flex items-center gap-2">
                  <Award size={20} className="text-amber-500" />
                  এসএসসি পরীক্ষার্থীদের বাল্ক প্রশংসাপত্র জেনারেটর (Official English Testimonials)
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  নির্ধারিত সাইজ ৯.২&quot; × ৮.২&quot; এবং চারপাশের নিরাপদ মার্জিন অনুযায়ী ইংরেজি প্রশংসাপত্র প্রস্তুত ও বাল্ক প্রিন্ট।
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500">পরীক্ষার সন:</span>
                  <input
                    type="text"
                    value={passingYearFilter}
                    onChange={(e) => setPassingYearFilter(e.target.value)}
                    className="w-24 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-xs text-center"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500">বিভাগ/গ্রুপ:</span>
                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    <option value="all">সকল বিভাগ (All Groups)</option>
                    <option value="Science">বিজ্ঞান (Science)</option>
                    <option value="Humanities">মানবিক (Humanities)</option>
                    <option value="Business Studies">ব্যবসায় শিক্ষা (Business Studies)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2-Step Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div className="p-5 bg-emerald-50/70 border border-emerald-200/80 rounded-3xl space-y-3 text-xs font-bold">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-950 uppercase text-[10px] block font-black tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet size={15} className="text-emerald-700" />
                    ধাপ ১: শিক্ষার্থীর তথ্য ছক এক্সেল নমুনা ফাইল ডাউনলোড
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md text-[10px] font-mono font-bold">
                    Excel .xlsx
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed font-medium">
                  ১০ম শ্রেণির শিক্ষার্থীদের তথ্যসহ (নাম, পিতা-মাতা, সেশন, জন্মতারিখ) এক্সেল ফাইল নামিয়ে বোর্ড রোল ও জিপিএ পূরণ করুন।
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadExcelTemplate}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl cursor-pointer shadow-md transition flex items-center justify-center gap-2 text-xs active:scale-95"
                    title="Microsoft Excel ফরম্যাটে নমুনা ফাইল ডাউনলোড করুন"
                  >
                    <FileSpreadsheet size={16} /> এক্সেল নমুনা ফাইল (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSSCCandidateCSV}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl cursor-pointer shadow-md transition flex items-center justify-center gap-2 text-xs active:scale-95"
                    title="CSV ফরম্যাটে নমুনা ফাইল ডাউনলোড করুন"
                  >
                    <Download size={15} /> CSV নমুনা ফাইল (.csv)
                  </button>
                </div>
              </div>

              <div className="p-5 bg-indigo-50/60 border border-indigo-200/80 rounded-3xl space-y-3 text-xs font-bold">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-950 uppercase text-[10px] block font-black tracking-wider flex items-center gap-1.5">
                    <Upload size={15} className="text-indigo-700" />
                    ধাপ ২: পূরণকৃত Excel / CSV আপলোড ও বাল্ক জেনারেট
                  </span>
                  <span className="px-2 py-0.5 bg-indigo-200 text-indigo-900 rounded-md text-[10px] font-mono font-bold">
                    .xlsx / .csv
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed font-medium">
                  বোর্ড রোল ও জিপিএ পূরণকৃত Excel (.xlsx) অথবা CSV ফাইল আপলোড করুন। সাথে সাথে সবার প্রশংসাপত্র তৈরি হয়ে যাবে।
                </p>
                <label className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl cursor-pointer shadow-md transition flex items-center justify-center gap-2 text-xs active:scale-95 mt-1">
                  <Upload size={16} /> {bulkProcessing ? 'প্রসেসিং হচ্ছে...' : 'পূরণকৃত Excel / CSV ফাইল আপলোড করুন'}
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleBulkFileUpload}
                    disabled={bulkProcessing}
                    className="sr-only"
                  />
                </label>
              </div>

            </div>
          </div>

          {/* Candidates List with Direct 1-Click Actions */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Users size={16} className="text-indigo-600" />
                  ১০ম শ্রেণি / এসএসসি পরীক্ষার্থীদের তালিকা ({sscCandidates.length} জন)
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  নিচের যেকোনো পরীক্ষার্থীর জন্য একক প্রশংসাপত্র প্রিভিউ করুন অথবা সবার জন্য একসাথে বাল্ক প্রিন্ট চাপুন।
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="নাম বা ক্লাস রোল দিয়ে খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="১০ম শ্রেণির শিক্ষার্থীদের তথ্যসহ এক্সেল ফাইল নামান"
                >
                  <FileSpreadsheet size={15} /> এক্সেল ছক ডাউনলোড
                </button>

                <button
                  type="button"
                  onClick={handlePrepareAllCandidatesForBatch}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer size={15} /> সবার সনদ বাল্ক প্রিন্ট ({sscCandidates.length} জন)
                </button>
              </div>
            </div>

            {/* Candidate Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse text-xs font-medium">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-black border-b border-slate-200">
                    <th className="p-3">রোল</th>
                    <th className="p-3">শিক্ষার্থীর নাম</th>
                    <th className="p-3">পিতার নাম</th>
                    <th className="p-3">মাতার নাম</th>
                    <th className="p-3">বিভাগ (Group)</th>
                    <th className="p-3">জন্ম তারিখ</th>
                    <th className="p-3 text-right">একশন ও প্রিন্ট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                  {sscCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        কোনো পরীক্ষার্থী পাওয়া যায়নি
                      </td>
                    </tr>
                  ) : (
                    sscCandidates.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-mono font-black text-indigo-700">{s.roll}</td>
                        <td className="p-3 font-black text-slate-950">{s.name}</td>
                        <td className="p-3 text-slate-600">{s.fatherName || '—'}</td>
                        <td className="p-3 text-slate-600">{s.motherName || '—'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[11px] font-bold">
                            {translateGroupToEnglish(s.group)}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600">{s.dob || '—'}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handlePrintSingleCertificate(s, idx)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                              title="এই শিক্ষার্থীর প্রশংসাপত্র প্রিন্ট করুন"
                            >
                              <Printer size={13} /> সনদটি প্রিন্ট
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickPreviewCandidate(s, idx)}
                              className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="প্রিভিউ দেখুন"
                            >
                              <Eye size={13} /> প্রিভিউ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectStudentForSingle(s)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                              title="তথ্য পরিবর্তন করুন"
                            >
                              এডিট
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: SINGLE TESTIMONIAL GENERATOR                                */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'single_generator' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 print:hidden">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-black text-slate-950 text-base flex items-center gap-2">
              <FileText size={20} className="text-indigo-600" />
              একক প্রশংসাপত্র প্রস্তুতকরণ (Single English Testimonial Generator)
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              সাইজ ৯.২&quot; × ৮.২&quot; ফরম্যাটে নির্দিষ্ট একজন পরীক্ষার্থীর তথ্য প্রদান করে ইংরেজি প্রশংসাপত্র প্রস্তুত করুন।
            </p>
          </div>

          <form onSubmit={handleGenerateSingle} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold">
              
              <div className="space-y-1.5">
                <label className="text-slate-700">শিক্ষার্থীর নাম (Name in English) *</label>
                <input
                  type="text"
                  required
                  value={singleStudentName}
                  onChange={(e) => setSingleStudentName(e.target.value)}
                  placeholder="e.g. MOHAMMAD SHIHAB UDDIN"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700">পিতার নাম (Father&apos;s Name) *</label>
                <input
                  type="text"
                  required
                  value={singleFatherName}
                  onChange={(e) => setSingleFatherName(e.target.value)}
                  placeholder="e.g. Md. Ibrahim"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700">মাতার নাম (Mother&apos;s Name) *</label>
                <input
                  type="text"
                  required
                  value={singleMotherName}
                  onChange={(e) => setSingleMotherName(e.target.value)}
                  placeholder="e.g. Begum Fatema"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700">গ্রাম (Village) *</label>
                <input
                  type="text"
                  required
                  value={singleVillage}
                  onChange={(e) => setSingleVillage(e.target.value)}
                  placeholder="e.g. Boraitoli"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700">ডাকঘর (Post Office) *</label>
                <input
                  type="text"
                  required
                  value={singlePostOffice}
                  onChange={(e) => setSinglePostOffice(e.target.value)}
                  placeholder="e.g. Boraitoli"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700">উপজেলা (Upazilla) *</label>
                <input
                  type="text"
                  required
                  value={singleUpazilla}
                  onChange={(e) => setSingleUpazilla(e.target.value)}
                  placeholder="e.g. Chakaria"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700">জেলা (District) *</label>
                <input
                  type="text"
                  required
                  value={singleDistrict}
                  onChange={(e) => setSingleDistrict(e.target.value)}
                  placeholder="e.g. Cox's Bazar"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700">লিঙ্গ (Gender for Pronouns) *</label>
                <select
                  value={singleGender}
                  onChange={(e) => setSingleGender(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900 cursor-pointer"
                >
                  <option value="Male">ছাত্র / Male (son, He, his)</option>
                  <option value="Female">ছাত্রী / Female (daughter, She, her)</option>
                  <option value="Other">অন্যান্য / Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700">জন্ম তারিখ (Date of Birth) *</label>
                <input
                  type="date"
                  required
                  value={singleDob}
                  onChange={(e) => setSingleDob(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700">বিভাগ / গ্রুপ (Group in English) *</label>
                <select
                  value={singleGroup}
                  onChange={(e) => setSingleGroup(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900 cursor-pointer"
                >
                  <option value="Science">Science (বিজ্ঞান)</option>
                  <option value="Humanities">Humanities (মানবিক)</option>
                  <option value="Business Studies">Business Studies (ব্যবসায় শিক্ষা)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700">বোর্ড রোল নম্বর (Board Roll) *</label>
                <input
                  type="text"
                  required
                  value={singleBoardRoll}
                  onChange={(e) => setSingleBoardRoll(e.target.value)}
                  placeholder="102931"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono font-black text-indigo-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700">রেজিস্ট্রেশন নম্বর (Board Reg No) *</label>
                <input
                  type="text"
                  required
                  value={singleBoardReg}
                  onChange={(e) => setSingleBoardReg(e.target.value)}
                  placeholder="1810293819"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700">প্রাপ্ত জিপিএ (GPA Out of 5.00) *</label>
                <input
                  type="text"
                  required
                  value={singleGpa}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSingleGpa(val);
                    const n = parseFloat(val);
                    if (n >= 5.0) setSingleGradeLetter('A+');
                    else if (n >= 4.0) setSingleGradeLetter('A');
                    else if (n >= 3.5) setSingleGradeLetter('A-');
                    else if (n >= 3.0) setSingleGradeLetter('B');
                    else if (n >= 2.0) setSingleGradeLetter('C');
                    else setSingleGradeLetter('D');
                  }}
                  placeholder="5.00"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono font-black text-emerald-700 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700">লেটার গ্রেড (Letter Grade)</label>
                <input
                  type="text"
                  value={singleGradeLetter}
                  onChange={(e) => setSingleGradeLetter(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700">পরীক্ষার সন (Passing Year)</label>
                <input
                  type="text"
                  value={singlePassingYear}
                  onChange={(e) => setSinglePassingYear(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700">স্মারক নম্বর (Ref No)</label>
                <input
                  type="text"
                  value={singleRefNo}
                  onChange={(e) => setSingleRefNo(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700">ইস্যুর তারিখ (Issue Date)</label>
                <input
                  type="date"
                  value={singleIssueDate}
                  onChange={(e) => setSingleIssueDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700">সেশন (Session)</label>
                <input
                  type="text"
                  value={singleSession}
                  onChange={(e) => setSingleSession(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900"
                />
              </div>

            </div>

            <div className="space-y-1.5 text-xs font-bold">
              <label className="text-slate-700">চারিত্রিক মন্তব্য (English Character Remarks)</label>
              <input
                type="text"
                value={singleRemarks}
                onChange={(e) => setSingleRemarks(e.target.value)}
                placeholder="He bears an exemplary moral character."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Printer size={16} />
                সনদ তৈরি ও প্রিন্ট করুন (Generate & Print Certificate)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: BATCH PRINT PREVIEW (সকলের ৯.২" × ৮.২" ধারাবাহিক প্রিন্ট)    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'batch_print' && (
        <div className={`space-y-6 ${previewTestimonial ? 'print:hidden' : ''}`}>
          
          {/* Top Control Bar (Hidden on print) */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-bold print:hidden">
            <div>
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-emerald-600" />
                <h3 className="font-black text-slate-950 text-base">
                  ব্যাচ প্রিন্ট প্রিভিউ ({batchPrintList.length} জন পরীক্ষার্থী)
                </h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-bold text-[10px]">
                  9.2&quot; × 8.2&quot; A4/Custom
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                প্রতিটি প্রশংসাপত্র সুনির্দিষ্ট ৯.২ ইঞ্চি প্রস্থ ও ৮.২ ইঞ্চি উচ্চতায় আলাদা পৃষ্ঠায় প্রিন্ট হবে।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLayoutDrawer(!showLayoutDrawer)}
                className="px-3.5 py-2 bg-amber-50 text-amber-950 border border-amber-300 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <SlidersHorizontal size={14} className="text-amber-700" /> সাইজ/মার্জিন টিউন
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Printer size={16} /> এখনই বাল্ক প্রিন্ট করুন ({batchPrintList.length} জনের সনদ)
              </button>
            </div>
          </div>

          {/* Printable Batch Sheets Container */}
          {batchPrintList.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/80 shadow-sm print:hidden">
              <Layers size={32} className="mx-auto text-slate-300 mb-2" />
              <h4 className="font-black text-slate-700">কোনো পরীক্ষার্থীর প্রশংসাপত্র তৈরি হয়নি</h4>
              <p className="text-xs text-slate-400 mt-1">
                &quot;বাল্ক প্রশংসাপত্র জেনারেটর&quot; ট্যাব থেকে CSV আপলোড করুন অথবা &quot;সবার প্রশংসাপত্র তৈরি ও প্রিন্ট&quot; বাটনে ক্লিক করুন।
              </p>
            </div>
          ) : (
            <div className="testimonial-sheet-wrapper space-y-8 print:space-y-0">
              {batchPrintList.map((rec, idx) => (
                <div key={rec.id || idx} className="print:break-after-page print:page-break-after-always">
                  {/* On-screen control bar above each sheet */}
                  <div className="flex items-center justify-between max-w-[9.2in] mx-auto mb-2 px-4 py-2 bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-sm print:hidden">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 font-black flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-black text-white">{rec.studentName}</span>
                      <span className="text-slate-400 font-mono text-[11px]">| রোল: {rec.boardRoll || '—'}</span>
                      <span className="text-emerald-400 text-[11px]">| GPA {rec.gpa} ({rec.gradeLetter})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewTestimonial(rec);
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="শুধুমাত্র এই সনদটি আলাদাভাবে প্রিন্ট করুন"
                      >
                        <Printer size={13} /> সনদটি প্রিন্ট
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBatchPrintList(prev => prev.filter((_, i) => i !== idx));
                          showAlert('success', `${rec.studentName}-কে বাল্ক প্রিন্ট তালিকা থেকে বাদ দেওয়া হয়েছে`);
                        }}
                        className="p-1.5 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 rounded-xl text-xs transition cursor-pointer"
                        title="বাল্ক তালিকা থেকে বাদ দিন"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-200/80 p-4 sm:p-8 rounded-3xl flex justify-center overflow-x-auto print:p-0 print:bg-transparent print:rounded-none print:shadow-none print:w-full print:block">
                    <SSCTestimonialSheetCard
                      record={rec}
                      schoolSettings={schoolSettings}
                      layoutConfig={layoutConfig}
                      borderImageUrl={activeBorderUrl || ''}
                      qrCodeUrl={qrCodeDataUrls[rec.id]}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

            {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: SETTINGS (পিএনজি বর্ডার, সাইজ ও মার্জিন)                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {(activeTab === 'settings' || activeTab === 'border_manager') && (
        <div className="space-y-8 print:hidden">
          


          {/* Section 1: PNG Border Slots Manager */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <ImageIcon size={18} className="text-purple-600" />
                  ১. পিএনজি বর্ডার ফ্রেম ম্যানেজার (PNG Border Slots)
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  প্রশংসাপত্রের চারপাশের জন্য (৯.২&quot; × ৮.২&quot;) স্বচ্ছ ট্রান্সপারেন্ট পিএনজি বর্ডার আপলোড করুন। যেকোনো সময় সক্রিয় বা বাদ দিতে পারেন।
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectBorder('none')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    !activeBorderUrl
                      ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  কোনো বর্ডার নয় (No Border)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((slotIdx) => {
                const border = customBorders[slotIdx];
                const isSelected = border && selectedBorderId === border.id;

                return (
                  <div
                    key={slotIdx}
                    className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-300'
                        : border
                        ? 'border-slate-200 bg-white hover:border-slate-300'
                        : 'border-dashed border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wider">
                          স্লট {slotIdx + 1}
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-black flex items-center gap-1">
                            <Check size={12} /> সক্রিয় ফ্রেম
                          </span>
                        )}
                      </div>

                      <div className="h-52 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden relative group">
                        {border ? (
                          <>
                            <img
                              src={border.url}
                              alt={border.name}
                              className="w-full h-full object-contain p-2"
                            />
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSelectBorder(border.id)}
                                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-black rounded-xl cursor-pointer shadow hover:bg-indigo-700"
                              >
                                সক্রিয় করুন
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBorder(border.id)}
                                className="p-1.5 bg-rose-600 text-white rounded-xl cursor-pointer hover:bg-rose-700"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-4 text-slate-400">
                            <ImageIcon size={36} className="mx-auto mb-1 opacity-50" />
                            <p className="text-[11px] font-bold">স্লট {slotIdx + 1} খালি রয়েছে</p>
                            <p className="text-[9px] text-slate-400">PNG ফ্রেম আপলোড করুন</p>
                          </div>
                        )}
                      </div>

                      {border && (
                        <p className="text-xs font-black text-slate-900 truncate text-center">
                          {border.name}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 mt-2 border-t border-slate-100">
                      <label className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-xs">
                        <Upload size={14} /> {border ? `বর্ডার ${slotIdx + 1} পরিবর্তন করুন` : `বর্ডার ${slotIdx + 1} আপলোড`}
                        <input
                          type="file"
                          accept="image/png"
                          onChange={(e) => handleUploadBorderSlot(slotIdx, e)}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Border Opacity Controls */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="font-black text-slate-800">বর্ডার অপাসিটি (Border Opacity):</span>
                <p className="text-[11px] text-slate-500">বর্ডার হালকা বা ১০০% গাঢ় করার জন্য স্লাইডার ব্যবহার করুন।</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.4"
                  max="1.0"
                  step="0.05"
                  value={layoutConfig.borderOpacity ?? 1.0}
                  onChange={(e) => updateLayoutConfig({ borderOpacity: parseFloat(e.target.value) })}
                  className="w-36 sm:w-48 accent-indigo-600 cursor-pointer"
                />
                <span className="font-mono font-black text-indigo-700 text-xs w-10">
                  {Math.round((layoutConfig.borderOpacity ?? 1.0) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Certificate Dimensions & 4-Side Safe Margins */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-emerald-600" />
                  ২. প্রশংসাপত্র সাইজ ও ৪ দিকের মার্জিন টিউন (Size & Safe Margins)
                </h4>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl font-mono font-black text-xs">
                  নির্ধারিত সাইজ: ৯.২&quot; (প্রস্থ) × ৮.২&quot; (উচ্চতা)
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                বর্ডারের ভেতরে লেখা যেন পুরোপুরি সুরক্ষিত থাকে, সেজন্য ৪ দিকের মার্জিন প্রয়োজন অনুযায়ী নিখুঁত করুন।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
              
              {/* Top Margin */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-700">টপ মার্জিন (Top):</span>
                  <span className="font-mono text-indigo-600 font-black">{layoutConfig.topMargin}&quot;</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.5"
                  step="0.05"
                  value={layoutConfig.topMargin}
                  onChange={(e) => updateLayoutConfig({ topMargin: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">হেডারের উপরের খালি জায়গা</p>
              </div>

              {/* Bottom Margin */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-700">বটম মার্জিন (Bottom):</span>
                  <span className="font-mono text-indigo-600 font-black">{layoutConfig.bottomMargin}&quot;</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.5"
                  step="0.05"
                  value={layoutConfig.bottomMargin}
                  onChange={(e) => updateLayoutConfig({ bottomMargin: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">স্বাক্ষরের নিচের খালি জায়গা</p>
              </div>

              {/* Left Margin */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-700">বাম মার্জিন (Left):</span>
                  <span className="font-mono text-emerald-600 font-black">{layoutConfig.leftMargin}&quot;</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.5"
                  step="0.05"
                  value={layoutConfig.leftMargin}
                  onChange={(e) => updateLayoutConfig({ leftMargin: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">বাম পাশের বর্ডার সেফটি</p>
              </div>

              {/* Right Margin */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-700">ডান মার্জিন (Right):</span>
                  <span className="font-mono text-emerald-600 font-black">{layoutConfig.rightMargin}&quot;</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.5"
                  step="0.05"
                  value={layoutConfig.rightMargin}
                  onChange={(e) => updateLayoutConfig({ rightMargin: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">ডান পাশের বর্ডার সেফটি</p>
              </div>

            </div>

            {/* Font Scaling & Line Spacing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
              
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-700">ইংরেজি লেখার ফন্ট স্কেল:</span>
                  <span className="font-mono text-amber-600 font-black">{layoutConfig.fontScale}%</span>
                </div>
                <input
                  type="range"
                  min="85"
                  max="115"
                  step="5"
                  value={layoutConfig.fontScale}
                  onChange={(e) => updateLayoutConfig({ fontScale: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>85% (কমপ্যাক্ট)</span>
                  <span>100%</span>
                  <span>115% (লার্জ)</span>
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-slate-700 font-bold block">প্যারাগ্রাফ লাইন স্পেসিং:</span>
                <div className="grid grid-cols-3 gap-1 bg-slate-200/80 p-1 rounded-xl">
                  {(['tight', 'normal', 'relaxed'] as const).map((lh) => (
                    <button
                      key={lh}
                      type="button"
                      onClick={() => updateLayoutConfig({ lineHeight: lh })}
                      className={`py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer capitalize ${
                        layoutConfig.lineHeight === lh ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {lh === 'tight' ? 'টাইট' : lh === 'normal' ? 'স্বাভাবিক' : 'খোলামেলা'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">লাইনের মধ্যবর্তী দূরত্ব</p>
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-700">স্বাক্ষর ব্লকের ফাঁকা স্পেস:</span>
                  <span className="font-mono text-sky-600 font-black">{layoutConfig.signatureGap}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  step="2"
                  value={layoutConfig.signatureGap}
                  onChange={(e) => updateLayoutConfig({ signatureGap: parseInt(e.target.value) })}
                  className="w-full accent-sky-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">স্বাক্ষরের উপরের দূরত্ব</p>
              </div>

            </div>
          </div>

          {/* Section 3: Typography & Mobile Number Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
              <span className="text-slate-900 font-black text-sm block flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                TESTIMONIAL টাইটেল ফন্ট স্টাইল:
              </span>
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                {(['cinzel', 'playfair', 'classic'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => updateLayoutConfig({ titleStyle: style })}
                    className={`py-2.5 rounded-xl text-xs font-black transition cursor-pointer capitalize ${
                      (layoutConfig.titleStyle || 'cinzel') === style ? 'bg-slate-900 text-white shadow-md ring-2 ring-amber-400' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {style === 'cinzel' ? 'Cinzel রাজকীয়' : style === 'playfair' ? 'Playfair মার্জিত' : 'ক্লাসিক সেরিফ'}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">প্রশংসাপত্রের প্রধান শিরোনামটি রাজকীয় ফন্টে বোল্ড থাকবে।</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
              <span className="text-slate-900 font-black text-sm block flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                হেডারে স্কুলের মোবাইল নম্বর (Header Mobile No):
              </span>
              <input
                type="text"
                placeholder="e.g. 01819-000000"
                value={layoutConfig.customPhone !== undefined && layoutConfig.customPhone !== '' ? layoutConfig.customPhone : (schoolSettings?.phone || '01819-000000')}
                onChange={(e) => updateLayoutConfig({ customPhone: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-indigo-700 outline-none"
              />
              <p className="text-[11px] text-slate-500">EIIN ও Established লাইনের ঠিক নিচে Mobile লাইনে প্রদর্শিত হবে।</p>
            </div>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: REGISTER & ARCHIVE (প্রদানকৃত প্রশংসাপত্র রেজিস্টার)        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'register' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-slate-950 text-base flex items-center gap-2">
                <BookOpen size={20} className="text-sky-600" />
                প্রদানকৃত প্রশংসাপত্র রেজিস্টার ও রেকর্ডস ({certificates.filter(c => c.type === 'ssc_testimonial').length} টি)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                পূর্বে ইস্যুকৃত এসএসসি প্রশংসাপত্রের ইতিহাস, যাচাই ও পুনরায় প্রিন্ট সুবিধা।
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse text-xs font-medium">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-black border-b border-slate-200">
                  <th className="p-3">স্মারক নম্বর</th>
                  <th className="p-3">শিক্ষার্থীর নাম</th>
                  <th className="p-3">বোর্ড রোল</th>
                  <th className="p-3">রেজিস্ট্রেশন</th>
                  <th className="p-3">সন / সেশন</th>
                  <th className="p-3">জিপিএ</th>
                  <th className="p-3">ইস্যুর তারিখ</th>
                  <th className="p-3 text-right">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                {certificates.filter(c => c.type === 'ssc_testimonial').length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      কোনো প্রশংসাপত্র ইস্যুর রেকর্ড নেই
                    </td>
                  </tr>
                ) : (
                  certificates
                    .filter(c => c.type === 'ssc_testimonial')
                    .map((cert) => (
                      <tr key={cert.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-mono font-black text-indigo-700">{cert.refNo}</td>
                        <td className="p-3 font-black text-slate-950">{cert.studentName}</td>
                        <td className="p-3 font-mono">{cert.boardRoll || '—'}</td>
                        <td className="p-3 font-mono">{cert.boardReg || '—'}</td>
                        <td className="p-3">{cert.passingYear} ({cert.session})</td>
                        <td className="p-3 font-mono font-black text-emerald-700">{cert.gpa || '—'}</td>
                        <td className="p-3 text-slate-600">{cert.issueDate}</td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const rec: SSCTestimonialRecord = {
                                id: cert.id,
                                studentId: cert.studentId,
                                studentName: cert.studentName,
                                fatherName: cert.fatherName || '',
                                motherName: cert.motherName || '',
                                village: cert.village || 'Boraitoli',
                                postOffice: cert.postOffice || 'Boraitoli',
                                upazilla: cert.upazila || 'Chakaria',
                                district: cert.district || "Cox's Bazar",
                                gender: 'Male',
                                dob: cert.dob || '2009-01-01',
                                dobWords: formatDobInWords(cert.dob || '2009-01-01'),
                                schoolName: schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
                                schoolNameEn: getEnglishSchoolName(schoolSettings.schoolName),
                                schoolAddress: schoolSettings.address || 'বরইতলী, চকরিয়া, কক্সবাজার।',
                                schoolAddressEn: getEnglishSchoolAddress(schoolSettings.address),
                                eiin: schoolSettings.eiin || '106184',
                                centerName: 'Chakaria-1',
                                group: translateGroupToEnglish(cert.group || 'Science'),
                                boardRoll: cert.boardRoll || '—',
                                boardReg: cert.boardReg || '—',
                                session: cert.session || '2024-2025',
                                passingYear: cert.passingYear || '2026',
                                boardName: 'Board of Intermediate and Secondary Education, Chattogram',
                                gpa: cert.gpa || '5.00',
                                gradeLetter: 'A+',
                                issueDate: cert.issueDate,
                                refNo: cert.refNo,
                                characterRemarks: cert.characterRemarks || 'He bears an exemplary moral character.'
                              };
                              generateQRCode(rec);
                              setPreviewTestimonial(rec);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer ml-auto"
                            title="পুনরায় এই সনদটি প্রিন্ট করুন"
                          >
                            <Printer size={12} /> সনদটি প্রিন্ট
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SINGLE TESTIMONIAL PREVIEW MODAL                                   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {previewTestimonial && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 space-y-4 max-h-[95vh] overflow-y-auto print:max-w-none print:p-0 print:h-auto print:overflow-visible print:border-none print:shadow-none">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <Award size={20} className="text-amber-500" />
                <h3 className="font-black text-slate-950 text-sm">
                  অফিশিয়াল প্রশংসাপত্র প্রিভিউ (৯.২&quot; × ৮.২&quot;) • {previewTestimonial.studentName}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer size={16} /> সনদটি প্রিন্ট করুন (Print Certificate)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTestimonial(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Preview Sheet */}
            <div className="flex justify-center p-2 sm:p-6 bg-slate-100 rounded-2xl overflow-x-auto print:bg-white print:p-0">
              <SSCTestimonialSheetCard
                record={previewTestimonial}
                schoolSettings={schoolSettings}
                layoutConfig={layoutConfig}
                borderImageUrl={activeBorderUrl || ''}
                qrCodeUrl={qrCodeDataUrls[previewTestimonial.id]}
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 🖨️ EXACT 9.2in x 8.2in PRINTABLE TESTIMONIAL SHEET COMPONENT
// ═════════════════════════════════════════════════════════════════
function SSCTestimonialSheetCard({
  record,
  schoolSettings,
  layoutConfig,
  borderImageUrl = '',
  qrCodeUrl = ''
}: {
  record: SSCTestimonialRecord;
  schoolSettings: SchoolSettings;
  layoutConfig: PrintLayoutConfig;
  borderImageUrl?: string;
  qrCodeUrl?: string;
}) {
  const schoolNameEn = record.schoolNameEn || 'BORAITOLI HIGH SCHOOL';
  const schoolAddressEn = record.schoolAddressEn || "Boraitoli, Chakaria, Cox's Bazar";
  const schoolPhone = (layoutConfig.customPhone !== undefined && layoutConfig.customPhone !== '') 
    ? layoutConfig.customPhone 
    : (schoolSettings?.phone || '01819-640163');
  
  // Smart gender detection
  const detectedGen = detectGender(record.gender, record.studentName);
  const isFemale = detectedGen === 'Female';

  // Title font selection
  const titleFontFamily = 
    layoutConfig.titleStyle === 'playfair' 
      ? "'Playfair Display', Georgia, serif"
      : layoutConfig.titleStyle === 'classic'
      ? "'Times New Roman', Times, serif"
      : "'Cinzel', 'Cinzel Decorative', 'Playfair Display', Georgia, serif";

  return (
    <div
      className="testimonial-sheet bg-white shadow-xl mx-auto text-slate-950 font-sans relative print:shadow-none print:m-0"
      style={{
        width: '9.2in',
        height: '8.2in',
        minHeight: '8.2in',
        maxHeight: '8.2in',
        position: 'relative',
        background: '#ffffff',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* ── PNG BORDER OVERLAY (Spans exact 9.2in x 8.2in outer sheet) ── */}
      {borderImageUrl ? (
        <img
          src={borderImageUrl}
          alt="Certificate Border"
          className="absolute inset-0 pointer-events-none select-none z-10"
          style={{
            width: '9.2in',
            height: '8.2in',
            objectFit: 'fill',
            padding: `${layoutConfig.borderInset || 0}mm`,
            opacity: layoutConfig.borderOpacity || 1.0
          }}
        />
      ) : (
        /* Double certificate border if no custom PNG uploaded */
        <div 
          className="absolute inset-[0.22in] border-2 border-double border-slate-900 pointer-events-none z-10"
        />
      )}

      {/* ── INNER SAFE MARGIN CONTAINER (Safe padding so text NEVER touches border) ── */}
      <div 
        className="w-full h-full flex flex-col justify-between relative z-20"
        style={{
          paddingTop: `${layoutConfig.topMargin || 0.5}in`,
          paddingBottom: `${layoutConfig.bottomMargin || 0.5}in`,
          paddingLeft: `${layoutConfig.leftMargin || 0.5}in`,
          paddingRight: `${layoutConfig.rightMargin || 0.5}in`,
          boxSizing: 'border-box'
        }}
      >
        <div>
          {/* 1. INSTITUTIONAL HEADER (With School Name, Address & Mobile Number) */}
          <div className="text-center flex flex-col items-center justify-center space-y-1">
            <div className="flex items-center justify-center gap-3.5">
              {schoolSettings?.schoolLogo ? (
                <img src={schoolSettings.schoolLogo} alt="Logo" className="w-14 h-14 object-contain shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-slate-950 flex flex-col items-center justify-center">
                  <span className="text-amber-600 text-xs font-black">★</span>
                  <span className="text-[9.5px] font-black tracking-tighter">BHS</span>
                </div>
              )}
              <div className="text-center">
                <h1 className="text-2xl sm:text-[27px] font-black text-slate-950 tracking-[0.03em] font-serif uppercase leading-none mb-1">
                  {schoolNameEn}
                </h1>
                <p className="text-[12px] font-semibold text-slate-800 tracking-wide">
                  {schoolAddressEn}
                </p>
              </div>
            </div>
            
            {/* Line 1: EIIN, Established (exact user specification) */}
            <p className="text-[11.5px] font-bold text-slate-800 font-mono tracking-wider mt-0.5">
              EIIN: {record.eiin}, Established: {schoolSettings?.estdYear || '1969'}
            </p>

            {/* Line 2: Mobile Number (from Admin Settings) */}
            <p className="text-[11.5px] font-black text-slate-950 font-mono tracking-wider">
              Mobile: {schoolSettings?.phone || '01819-000000'}
            </p>
          </div>

          {/* FULL WIDTH HORIZONTAL DIVIDING LINE */}
          <div className="w-full border-b-2 border-slate-950 my-1.5" />

          {/* 2. REF NO & DATE BAR */}
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-800 px-2 mb-1.5 font-mono">
            <div>
              <span className="font-sans font-bold text-slate-600">Ref. No: </span>
              <span className="font-mono font-black text-slate-950">{record.refNo}</span>
            </div>
            <div>
              <span className="font-sans font-bold text-slate-600">Date: </span>
              <span className="font-mono font-bold text-slate-950">{record.issueDate}</span>
            </div>
          </div>

          {/* 3. STYLISH BOLD TESTIMONIAL TITLE */}
          <div className="text-center my-2 sm:my-2.5">
            <div className="inline-flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-3">
                <span className="text-amber-800 text-sm font-serif select-none">❖</span>
                <h2 
                  className="text-2xl sm:text-[27px] font-black text-slate-950 uppercase tracking-[0.24em] select-none"
                  style={{
                    fontFamily: titleFontFamily,
                    fontWeight: 900,
                    letterSpacing: '0.24em',
                    lineHeight: 1.1
                  }}
                >
                  TESTIMONIAL
                </h2>
                <span className="text-amber-800 text-sm font-serif select-none">❖</span>
              </div>
              
              {/* Stylish Ornamental Flourish Line */}
              <div className="flex items-center justify-center gap-1.5 w-full mt-1">
                <div className="h-[2px] w-12 bg-slate-950 rounded-full" />
                <div className="h-[1px] w-20 bg-slate-600" />
                <div className="w-2 h-2 rotate-45 bg-amber-800 shrink-0" />
                <div className="h-[1px] w-20 bg-slate-600" />
                <div className="h-[2px] w-12 bg-slate-950 rounded-full" />
              </div>
            </div>

            <div className="mt-1">
              <span className="text-[10px] sm:text-[11px] font-black text-slate-700 tracking-[0.16em] uppercase font-sans">
                SECONDARY SCHOOL CERTIFICATE (SSC) EXAMINATION — {record.passingYear}
              </span>
            </div>
          </div>

          {/* 4. OFFICIAL TESTIMONIAL PARAGRAPH TEXT (Exact Official Template) */}
          <div 
            className="font-serif text-slate-950 text-justify px-3 sm:px-6 space-y-3.5 print-quality-boost"
            style={{
              fontSize: `${(13.2 * layoutConfig.fontScale) / 100}px`,
              lineHeight: layoutConfig.lineHeight === 'tight' ? 1.75 : layoutConfig.lineHeight === 'relaxed' ? 2.3 : 2.05,
              wordSpacing: '0.04em'
            }}
          >
            <p className="leading-relaxed">
              This is to certify that <strong className="font-serif font-black text-slate-950 tracking-wide uppercase border-b border-slate-900 pb-[1px]">{record.studentName}</strong>, {isFemale ? 'daughter' : 'son'} of Mr. <strong className="font-serif font-bold text-slate-900">{cleanFatherName(record.fatherName)}</strong> and Mrs. <strong className="font-serif font-bold text-slate-900">{cleanMotherName(record.motherName)}</strong>, Village: <strong className="font-serif font-bold text-slate-900">{record.village || 'Boraitoli'}</strong>, Post Office: <strong className="font-serif font-bold text-slate-900">{record.postOffice || 'Boraitoli'}</strong>, Upazilla: <strong className="font-serif font-bold text-slate-900">{record.upazilla || (record as any).upazila || 'Chakaria'}</strong>, District: <strong className="font-serif font-bold text-slate-900">{record.district || "Cox's Bazar"}</strong>, was a student of this school bearing Roll No. <strong className="font-mono font-bold text-slate-950">{record.boardRoll}</strong>, Registration No. <strong className="font-mono font-bold text-slate-950">{record.boardReg}</strong>, Session <strong className="font-mono font-bold text-slate-950">{record.session}</strong>, Group <strong className="font-serif font-bold uppercase text-slate-950">{record.group}</strong>.
            </p>

            <p className="leading-relaxed">
              {isFemale ? 'She' : 'He'} has duly passed the S.S.C. Examination held in the year <strong className="font-mono font-bold text-slate-950">{record.passingYear}</strong> and secured a GPA of <strong className="font-mono font-black text-slate-950">{record.gpa}</strong> out of 5.00, under the {record.boardName || 'Board of Intermediate and Secondary Education, Chattogram'}.
            </p>

            <p className="leading-relaxed">
              During {isFemale ? 'her' : 'his'} stay in this institution, {isFemale ? 'her' : 'his'} moral character and conduct were good. There is no information of {isFemale ? 'her' : 'his'} being involved in any activity subversive to the interest of the state or against school discipline.
            </p>

            <p className="leading-relaxed">
              We wish {isFemale ? 'her' : 'him'} success in life.
            </p>
          </div>
        </div>

        {/* 5. FOOTER SIGNATURES & QR VERIFICATION (No Prepared by, Flow Principal Signature) */}
        <div 
          className="pt-3 flex items-end justify-between text-xs font-bold text-slate-950 px-4"
          style={{ marginTop: `${layoutConfig.signatureGap || 18}px` }}
        >
          {qrCodeUrl ? (
            <div className="flex flex-col items-center text-center">
              <img src={qrCodeUrl} alt="QR Seal" className="w-12 h-12" />
              <span className="text-[8px] font-mono font-black text-slate-700 mt-0.5 tracking-wider">QR VERIFIED</span>
            </div>
          ) : (
            <div />
          )}

          <div className="text-center">
            <div className="w-56 border-t-2 border-slate-950 pt-1.5">
              <p className="font-black text-slate-950 text-xs uppercase font-serif tracking-wide">
                {getEnglishPrincipalName(schoolSettings?.principalName)}
              </p>
              <p className="text-[11px] font-bold text-slate-800">
                {getEnglishPrincipalTitle(schoolSettings?.principalTitle)}
              </p>
              <p className="text-[10px] text-slate-600 font-serif tracking-wide">{schoolNameEn}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 🌐 NEXT.JS SUSPENSE WRAPPER FOR SAFE STATIC PRERENDERING
// ═════════════════════════════════════════════════════════════════
export default function SSCTestimonialsPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-slate-500 font-bold text-sm">প্রশংসাপত্র সিস্টেম লোড হচ্ছে...</div>}>
      <SSCTestimonialsContent />
    </React.Suspense>
  );
}
