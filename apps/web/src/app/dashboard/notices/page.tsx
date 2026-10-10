'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  PlusCircle, 
  Search, 
  Pin, 
  Calendar, 
  UserCheck, 
  AlertTriangle, 
  FileText, 
  Printer, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Share2, 
  Users, 
  ShieldCheck, 
  Award, 
  Info,
  Filter,
  X,
  Send,
  Eye,
  FileCheck,
  Sparkles,
  Layers,
  Building2,
  GraduationCap,
  Copy,
  SlidersHorizontal,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Palette,
  RotateCcw,
  Check,
  MoveVertical,
  MoveHorizontal,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
  CheckSquare,
  Square,
  Clock,
  Sparkle,
  RefreshCw,
  FilePlus,
  BookOpen,
  DollarSign,
  HelpCircle,
  Coins,
  Plus,
  Minus,
  ArrowRight
} from 'lucide-react';
import { noticeService, Notice } from '@/services/noticeService';
import { settingsService, SchoolSettings, DEFAULT_PAD_MARGINS } from '@/services/settingsService';
import SchoolPadWrapper from '@/components/SchoolPadWrapper';
import { financeService, GRADES_LIST } from '@/services/financeService';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import Link from 'next/link';

export interface ClassFeeItem {
  className: string;
  examFee: string;
  monthlyFee?: string;
}

export default function NoticesPage() {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(settingsService.getSettings());
  const [notices, setNotices] = useState<Notice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedTarget, setSelectedTarget] = useState<string>('all');

  const isAdmin = session?.role === 'admin';

  // Main Page View State ('list' = notice table register, 'compose' = in-page dual-pane studio, 'preview' = full screen A4 print sheet)
  const [activeView, setActiveView] = useState<'list' | 'compose' | 'preview'>('list');
  const [listLayout, setListLayout] = useState<'table' | 'cards'>('table'); // Default to Table List View
  const [selectedNoticeForPrint, setSelectedNoticeForPrint] = useState<Notice | null>(null);

  // Bulk Selection State
  const [selectedNoticeIds, setSelectedNoticeIds] = useState<string[]>([]);

  // Quick View Modal State
  const [viewingNoticeModal, setViewingNoticeModal] = useState<Notice | null>(null);
  const [showBlankPadModal, setShowBlankPadModal] = useState<boolean>(false);

  // Editing state
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Print Settings State (Exact user requirements)
  const [printMode, setPrintMode] = useState<'full' | 'pad'>('full'); // 'full' = with 4-line header & logo; 'pad' = 3-inch top margin for physical letterhead
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [previewZoom, setPreviewZoom] = useState<number>(100); // Zoom in % for screen preview
  const [contentFontSize, setContentFontSize] = useState<number>(14); // Notice body font size in px (Default: 14px standard)

  // 🎨 Color Controller States (School Name Color & 2 Header Line Colors)
  const [schoolNameColor, setSchoolNameColor] = useState<string>('#0f172a');
  const [topLineColor, setTopLineColor] = useState<string>('#dc2626'); // 1st line: Vivid Red
  const [bottomLineColor, setBottomLineColor] = useState<string>('#1d4ed8'); // 2nd line: Royal Blue
  const [showColorController, setShowColorController] = useState<boolean>(false);

  // 🎯 Logo Position Offset (Horizontal Left Position)
  const [logoLeftOffset, setLogoLeftOffset] = useState<number>(60); // Default at the red marked position (60px from page edge)

  // ✍️ Signature Position Controller (Vertical Position / Spacing)
  const [signatureTopGap, setSignatureTopGap] = useState<number>(32); // in px (range: 0px to 180px)

  // Form States (Headmaster Notice Creation)
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Notice['category']>('exam');
  const [targetAudience, setTargetAudience] = useState<Notice['targetAudience']>('all');
  const [priority, setPriority] = useState<Notice['priority']>('urgent');
  const [publisherName, setPublisherName] = useState(schoolSettings.principalName || 'মোহাম্মদ রফিকুল ইসলাম');
  const [publisherRole, setPublisherRole] = useState(schoolSettings.principalTitle || 'প্রধান শিক্ষক');
  const [refNo, setRefNo] = useState('');
  const [publishedDate, setPublishedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isPinned, setIsPinned] = useState(false);
  const [autoSyncTitle, setAutoSyncTitle] = useState(true);
  const [selectedFeeSector, setSelectedFeeSector] = useState<'exam' | 'registration' | 'farewell' | 'tuition'>('exam');

  // 💰 Class-Wise Fee State (Sourced directly from Finance Section Settings)
  const [classFees, setClassFees] = useState<ClassFeeItem[]>([
    { className: '৬ষ্ঠ শ্রেণি', examFee: '৩০০' },
    { className: '৭ম শ্রেণি', examFee: '৩৫০' },
    { className: '৮ম শ্রেণি', examFee: '৪০০' },
    { className: '৯ম শ্রেণি', examFee: '৫০০' },
    { className: '১০ম শ্রেণি', examFee: '৬০০' }
  ]);

  // Load fees dynamically from Finance Section
  const loadFeesForSector = (sector: 'exam' | 'registration' | 'farewell' | 'tuition') => {
    setSelectedFeeSector(sector);
    const financeItems = financeService.getClassFeesByType(sector);
    const mapped = financeItems.map(item => ({
      className: item.className,
      examFee: String(item.amount)
    }));
    setClassFees(mapped);
    saveClassFeesToStorage(mapped);
    return mapped;
  };

  // Color Swatch Presets
  const nameColorPresets = [
    { name: 'কালো', value: '#0f172a' },
    { name: 'সবুজ', value: '#006a4e' },
    { name: 'মেরুন', value: '#991b1b' },
    { name: 'নেভি ব্লু', value: '#0a2558' },
    { name: 'রয়্যাল ব্লু', value: '#1d4ed8' },
    { name: 'পার্পল', value: '#581c87' }
  ];

  const lineColorPresets = [
    { name: 'উজ্জ্বল লাল', value: '#dc2626' },
    { name: 'মেরুন', value: '#991b1b' },
    { name: 'রয়্যাল ব্লু', value: '#1d4ed8' },
    { name: 'নেভি ব্লু', value: '#0a2558' },
    { name: 'গাঢ় সবুজ', value: '#006a4e' },
    { name: 'কালো', value: '#0f172a' }
  ];

  // Helper to generate formatted class fees text
  const generateClassFeeString = (fees: ClassFeeItem[]) => {
    return fees.map(f => `• ${f.className}: ${f.examFee}/- টাকা`).join('\n');
  };

  // ═════════════════════════════════════════════════════════════════
  // 📚 REAL-LIFE BANGLADESHI SCHOOL NOTICE TEMPLATES & PRESETS
  // ═════════════════════════════════════════════════════════════════
  const noticeTemplates = [
    {
      id: 'exam_fees_combined',
      name: '📝 💰 পরীক্ষা ও শ্রেণি ভিত্তিক ফি',
      category: 'exam' as Notice['category'],
      priority: 'urgent' as Notice['priority'],
      targetAudience: 'all' as Notice['targetAudience'],
      feeSector: 'exam' as const,
      title: 'অর্ধ-বার্ষিক পরীক্ষা, শ্রেণি ভিত্তিক পরীক্ষার ফি ও বকেয়া বেতন পরিশোধ সংক্রান্ত বিজ্ঞপ্তি',
      getContent: (fees: ClassFeeItem[]) => `এতদ্দ্বারা ৬ষ্ঠ হতে ১০ম শ্রেণির সকল শিক্ষার্থী ও সম্মানিত অভিভাবকদের অবগতির জন্য জানানো যাচ্ছে যে, আগামী ২৫ এপ্রিল ২০২৬ তারিখ হতে অর্ধবার্ষিক পরীক্ষা অনুষ্ঠিত হবে। 

পরীক্ষায় অংশগ্রহণের জন্য শ্রেণি ভিত্তিক নির্ধারিত পরীক্ষার ফি ও যাবতীয় বকেয়া বেতন পরিশোধের তালিকা নিম্নরূপ:
${generateClassFeeString(fees)}

পরীক্ষা সংক্রান্ত প্রয়োজনীয় নির্দেশনাবলী:
১. আগামী ১০ এপ্রিল ২০২৬ তারিখের মধ্যে চলতি শিক্ষাবর্ষের সকল বকেয়া বেতন ও উপরোক্ত নির্ধারিত পরীক্ষার ফি বিদ্যালয়ের হিসাব শাখায় জমা প্রদান করতে হবে।
২. ফি পরিশোধের রসিদ প্রদর্শনপূর্বক শ্রেণি শিক্ষকের নিকট হতে পরীক্ষার প্রবেশপত্র (Admit Card) সংগ্রহ করতে হবে।
৩. প্রবেশপত্র ব্যতীত কোনো শিক্ষার্থীকে পরীক্ষার হলে প্রবেশের অনুমতি দেওয়া হবে না।
৪. প্রতিদিন পরীক্ষা শুরুর অন্তত ১৫ মিনিট পূর্বে নিজ নিজ নির্ধারিত আসনে উপস্থিত থাকতে হবে।
৫. পরীক্ষার হলে কোনো প্রকার ডিজিটাল ডিভাইস বা অসদুপায় অবলম্বন সম্পূর্ণ নিষিদ্ধ।`
    },
    {
      id: 'registration_fees',
      name: '📋 💳 রেজিস্ট্রেশন / ফরম পূরণ ও ফি',
      category: 'academic' as Notice['category'],
      priority: 'important' as Notice['priority'],
      targetAudience: 'students' as Notice['targetAudience'],
      feeSector: 'registration' as const,
      title: 'এসএসসি / বার্ষিক পরীক্ষার অনলাইন রেজিস্ট্রেশন ও ফি প্রদান সংক্রান্ত বিজ্ঞপ্তি',
      getContent: (fees: ClassFeeItem[]) => `এতদ্দ্বারা সংশ্লিষ্ট সকল শিক্ষার্থী ও সম্মানিত অভিভাবকদের অবগতির জন্য জানানো যাচ্ছে যে, ২০২৬ শিক্ষাবর্ষের রেজিস্ট্রেশন ও ফরম পূরণ কার্যক্রম আগামী ১৫ সেপ্টেম্বর হতে ৩০ সেপ্টেম্বর পর্যন্ত চলবে।

শ্রেণি ভিত্তিক রেজিস্ট্রেশন ফি এর বিবরণ:
${generateClassFeeString(fees)}

প্রয়োজনীয় নির্দেশনাবলী:
১. নির্ধারিত সময়ের মধ্যে ফরম পূরণের যাবতীয় ফি হিসাব শাখায় জমা দিয়ে রেজিস্ট্রেশন নিশ্চিত করতে হবে।
২. বিলম্ব ফি এড়ানোর জন্য ৩০ সেপ্টেম্বরের পূর্বেই ফরম পূরণের কাজ সম্পন্ন করার অনুরোধ করা হলো।
৩. ফরম পূরণের জন্য পাসপোর্ট সাইজের ছবি ও প্রয়োজনীয় সনদপত্রের ফটোকপি জমা দিতে হবে।
৪. নির্ধারিত তারিখের পর অতিরিক্ত বিলম্ব ফি ছাড়া ফরম পূরণ গ্রহণ করা সম্ভব হবে না।`
    },
    {
      id: 'farewell_fees',
      name: '🎓 🎁 বিদায় অনুষ্ঠান ও ফি সংক্রান্ত',
      category: 'events' as Notice['category'],
      priority: 'important' as Notice['priority'],
      targetAudience: 'all' as Notice['targetAudience'],
      feeSector: 'farewell' as const,
      title: 'এসএসসি পরীক্ষার্থীদের বিদায় সংবর্ধনা ও ফি প্রদান সংক্রান্ত বিজ্ঞপ্তি',
      getContent: (fees: ClassFeeItem[]) => `এতদ্দ্বারা বিদ্যালয়ের সকল শিক্ষার্থী ও সম্মানিত অভিভাবকদের অবগতির জন্য জানানো যাচ্ছে যে, ২০২৬ সালের এসএসসি পরীক্ষার্থীদের বিদায় সংবর্ধনা ও দোয়া মাহফিল আগামী ... তারিখে অনুষ্ঠিত হবে।

উক্ত মহতী অনুষ্ঠানের সার্বিক আয়োজন ও বিদায়ী উপহার বাবদ শ্রেণি ভিত্তিক নির্ধারিত ফি নিম্নরূপ:
${generateClassFeeString(fees)}

প্রয়োজনীয় নির্দেশনাবলী:
১. আগামী ... তারিখের মধ্যে শ্রেণি শিক্ষকের নিকট অনুষ্ঠান ফি জমা প্রদান করার জন্য অনুরোধ করা হলো।
২. বিদায় অনুষ্ঠানে সকল শিক্ষার্থীকে যথাসময়ে নির্দিষ্ট প্রাতিষ্ঠানিক পোশাকে উপস্থিত থাকতে হবে।`
    },
    {
      id: 'holiday_general',
      name: '🌴 ছুটির নোটিশ (পূজা/ঈদ/গ্রীষ্ম)',
      category: 'holiday' as Notice['category'],
      priority: 'important' as Notice['priority'],
      targetAudience: 'all' as Notice['targetAudience'],
      title: 'দূর্গাপূজা উপলক্ষে বিদ্যালয় বন্ধ সংক্রান্ত বিজ্ঞপ্তি',
      getContent: () => `এতদ্দ্বারা বিদ্যালয়ের সকল সম্মানিত শিক্ষক, কর্মচারী, অভিভাবক ও শিক্ষার্থীদের অবগতির জন্য জানানো যাচ্ছে যে, দূর্গাপূজা উপলক্ষে আগামী ১০ অক্টোবর হতে ২০ অক্টোবর ২০২৬ পর্যন্ত বিদ্যালয়ের সকল একাডেমিক ও প্রশাসনিক কার্যক্রম বন্ধ থাকবে।

আগামী ২১ অক্টোবর ২০২৬ তারিখ শনিবার হতে যথারীতি বিদ্যালয়ের নিয়মিত শ্রেণি কার্যক্রম চালু হবে। 

সকলকে শারদীয় দূর্গাপূজার আন্তরিক শুভেচ্ছা ও অভিনন্দন।`
    },
    {
      id: 'parent_meeting',
      name: '👨‍👩‍👧‍👦 অভিভাবক সমাবেশ ও রেজাল্ট',
      category: 'events' as Notice['category'],
      priority: 'normal' as Notice['priority'],
      targetAudience: 'parents' as Notice['targetAudience'],
      title: 'শিক্ষক-অভিভাবক মতবিনিময় সভা ও মূল্যায়ন ফলাফল প্রকাশ সংক্রান্ত বিজ্ঞপ্তি',
      getContent: () => `সম্মানিত অভিভাবকবৃন্দের সদয় অবগতির জন্য জানানো যাচ্ছে যে, শিক্ষার্থীদের অর্ধবার্ষিক মূল্যায়নের অগ্রগতি ও পড়ালেখার মানোন্নয়ন বিষয়ে এক মতবিনিময় সভা আগামী শনিবার সকাল ১০:০০ ঘটিকায় বিদ্যালয় মিলনায়তনে অনুষ্ঠিত হবে। 

উক্ত সভায় আপনার সন্তানের মূল্যায়ন রিপোর্ট ও প্রগ্রেস কার্ড প্রদান করা হবে। সকল অভিভাবককে যথাসময়ে উপস্থিত থাকার জন্য বিনীত অনুরোধ করা হলো।`
    },
    {
      id: 'emergency_weather',
      name: '🚨 জরুরি পাঠদান স্থগিত',
      category: 'emergency' as Notice['category'],
      priority: 'urgent' as Notice['priority'],
      targetAudience: 'all' as Notice['targetAudience'],
      title: 'প্রাকৃতিক দুর্যোগ / আবহাওয়ার কারণে পাঠদান স্থগিত সংক্রান্ত জরুরি বিজ্ঞপ্তি',
      getContent: () => `উপকূলীয় অঞ্চলে বৈরী আবহাওয়া ও সরকারি নির্দেশনার প্রেক্ষিতে শিক্ষার্থীদের সার্বিক নিরাপত্তা বিবেচনায় আগামী দুই দিন বিদ্যালয়ের প্রত্যক্ষ পাঠদান কার্যক্রম স্থগিত ঘোষণা করা হলো। 

পরিস্থিতি স্বাভাবিক হলে পরবর্তী নির্দেশনার মাধ্যমে বিদ্যালয় খোলার তারিখ জানানো হবে। শিক্ষার্থীদের নিরাপদে ঘরে অবস্থানের পরামর্শ দেওয়া হচ্ছে।`
    }
  ];

  // Helper to extract clean subject from title (removes "সংক্রান্ত বিজ্ঞপ্তি" for natural flow)
  const extractSubjectCore = (rawTitle: string) => {
    let clean = rawTitle.trim();
    clean = clean.replace(/^(বিজ্ঞপ্তি\s*[-:/|]\s*)/i, '');
    clean = clean.replace(/(সংক্রান্ত\s*বিজ্ঞপ্তি|সংক্রান্ত\s*নোটিশ|এর\s*বিজ্ঞপ্তি)$/i, '').trim();
    return clean || rawTitle;
  };

  // 🤖 SMART AUTO-SYNC TITLE TO BODY DESCRIPTION
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);

    if (autoSyncTitle && newTitle.trim()) {
      const coreSubject = extractSubjectCore(newTitle);
      
      // If content is empty or standard template opening, dynamically rewrite opening
      if (!content.trim() || content.includes('এতদ্দ্বারা') || content.includes('উপলক্ষে')) {
        const feeBlock = (newTitle.includes('পরীক্ষা') || newTitle.includes('বেতন') || newTitle.includes('ফি') || category === 'exam')
          ? `\n\nশ্রেণি ভিত্তিক পরীক্ষার ফি এর নির্ধারিত তালিকা:\n${generateClassFeeString(classFees)}\n`
          : '';

        if (category === 'holiday' || newTitle.includes('ছুটি') || newTitle.includes('বন্ধ') || newTitle.includes('পূজা') || newTitle.includes('ঈদ')) {
          setContent(`এতদ্দ্বারা বিদ্যালয়ের সকল সম্মানিত শিক্ষক, কর্মচারী, অভিভাবক ও শিক্ষার্থীদের অবগতির জন্য জানানো যাচ্ছে যে, ${coreSubject} উপলক্ষে আগামী ... তারিখ হতে ... তারিখ পর্যন্ত বিদ্যালয়ের সকল একাডেমিক ও প্রশাসনিক কার্যক্রম বন্ধ থাকবে।\n\nছুটি শেষে পরবর্তী কার্যদিবসে যথারীতি বিদ্যালয়ের নিয়মিত শ্রেণি কার্যক্রম চালু হবে।`);
        } else if (category === 'exam' || newTitle.includes('পরীক্ষা') || newTitle.includes('বেতন') || newTitle.includes('ফি')) {
          setContent(`এতদ্দ্বারা সকল শিক্ষার্থী ও সম্মানিত অভিভাবকদের অবগতির জন্য জানানো যাচ্ছে যে, ${coreSubject} আগামী ... তারিখ হতে শুরু হবে।${feeBlock}\n১. আগামী ... তারিখের মধ্যে সকল বকেয়া বেতন ও উপরোক্ত পরীক্ষার ফি পরিশোধ করে প্রবেশপত্র সংগ্রহ করতে হবে।\n২. প্রবেশপত্র ব্যতীত পরীক্ষায় অংশগ্রহণ করা যাবে না।\n৩. পরীক্ষা শুরুর ১৫ মিনিট পূর্বে নিজ নিজ আসনে উপস্থিত থাকতে হবে।`);
        } else {
          setContent(`এতদ্দ্বারা বিদ্যালয়ের সকল সম্মানিত শিক্ষক, কর্মচারী, অভিভাবক ও শিক্ষার্থীদের অবগতির জন্য জানানো যাচ্ছে যে, ${coreSubject} সংক্রান্ত প্রয়োজনীয় কার্যক্রম আগামী ... তারিখ হতে গ্রহণ করা হবে।\n\nসংশ্লিষ্ট সকলকে নির্ধারিত নিয়ম ও সময়সূচি অনুযায়ী কার্যক্রম সম্পন্ন করার জন্য অনুরোধ করা হলো।`);
        }
      }
    }
  };

  // Handle updating fee for a class
  const handleUpdateClassFee = (index: number, fee: string) => {
    const updated = [...classFees];
    updated[index].examFee = fee;
    setClassFees(updated);
    saveClassFeesToStorage(updated);
  };

  // Handle adding a new class row
  const handleAddClassFeeRow = () => {
    const updated = [...classFees, { className: 'নতুন শ্রেণি', examFee: '৪০০' }];
    setClassFees(updated);
    saveClassFeesToStorage(updated);
  };

  // Handle removing a class row
  const handleRemoveClassFeeRow = (index: number) => {
    if (classFees.length <= 1) return;
    const updated = classFees.filter((_, idx) => idx !== index);
    setClassFees(updated);
    saveClassFeesToStorage(updated);
  };

  // Insert Class Fees Breakdown into notice content
  const handleInsertClassFees = () => {
    const feeText = `\n\nশ্রেণি ভিত্তিক পরীক্ষার ফি ও নির্ধারিত হারের বিবরণ:\n${generateClassFeeString(classFees)}`;
    setContent(prev => prev.trim() + feeText);
    showAlert('success', 'শ্রেণি ভিত্তিক পরীক্ষার ফি তালিকা নোটিশে সফলভাবে যোগ করা হয়েছে!');
  };

  // Quick Snippet Inserters
  const handleInsertSnippet = (snippetType: string) => {
    const core = extractSubjectCore(title) || 'উক্ত কার্যক্রম';
    let textToInsert = '';

    switch (snippetType) {
      case 'class_fees':
        textToInsert = `\n\nশ্রেণি ভিত্তিক পরীক্ষার ফি তালিকা:\n${generateClassFeeString(classFees)}`;
        break;
      case 'exam_rules':
        textToInsert = `\n\nপরীক্ষা সংক্রান্ত জরুরি নির্দেশনাবলী:\n১. পরীক্ষা শুরুর অন্তত ১৫ মিনিট পূর্বে নির্ধারিত আসনে উপস্থিত হতে হবে।\n২. পরীক্ষার হলে প্রবেশপত্র (Admit Card) সাথে রাখা বাধ্যতামূলক।\n৩. কোনো প্রকার অসদুপায় বা ডিজিটাল ডিভাইস আনা সম্পূর্ণ নিষিদ্ধ।`;
        break;
      case 'fee_due_rules':
        textToInsert = `\n\nফি পরিশোধ ও প্রবেশপত্র সংক্রান্ত:\n• আগামী ১০ তারিখের মধ্যে চলতি শিক্ষাবর্ষের সকল বকেয়া বেতন ও ফি হিসাব শাখায় জমা দিতে হবে।\n• ফি পরিশোধের মূল রসিদ প্রদর্শন করে শ্রেণি শিক্ষকের নিকট হতে প্রবেশপত্র গ্রহণ করতে হবে।`;
        break;
      case 'registration_rules':
        textToInsert = `\n\nরেজিস্ট্রেশন ও ফরম পূরণ শর্তাবলী:\n১. নির্ধারিত সময়ের মধ্যে ফরম পূরণের যাবতীয় ফি হিসাব শাখায় জমা দিতে হবে।\n২. পাসপোর্ট সাইজের ২ কপি ছবি ও পূর্ববর্তী পরীক্ষার মূল নম্বরপত্র জমা দিতে হবে।\n৩. বিলম্ব ফি এড়ানোর জন্য শেষ তারিখের পূর্বেই কার্যক্রম সম্পন্ন করতে হবে।`;
        break;
      case 'holiday_dates':
        textToInsert = `\n\nছুটি ও খোলার তারিখ:\n• আগামী ১০ তারিখ হতে ২০ তারিখ পর্যন্ত শ্রেণি পাঠদান বন্ধ থাকবে।\n• আগামী ২১ তারিখ শনিবার হতে যথারীতি বিদ্যালয় খোলা থাকবে।`;
        break;
      case 'standard_preamble':
        textToInsert = `এতদ্দ্বারা বিদ্যালয়ের সকল সম্মানিত শিক্ষক, কর্মচারী, অভিভাবক ও শিক্ষার্থীদের অবগতির জন্য জানানো যাচ্ছে যে, ${core} সংক্রান্ত সিদ্ধান্ত গৃহীত হয়েছে।`;
        setContent(textToInsert + (content ? '\n\n' + content : ''));
        return;
    }

    setContent(prev => prev.trim() + textToInsert);
    showAlert('success', 'পয়েন্ট সফলভাবে নোটিশের বর্ণনায় যোগ করা হয়েছে!');
  };

  const loadNotices = () => {
    setNotices(noticeService.getNotices());
  };

  useEffect(() => {
    setMounted(true);
    const s = teacherAuthService.getSession();
    setSession(s);
    setSchoolSettings(settingsService.getSettings());
    loadNotices();

    // Load saved color & position preferences
    try {
      const savedColors = localStorage.getItem('sms_notice_header_colors');
      if (savedColors) {
        const parsed = JSON.parse(savedColors);
        if (parsed.schoolNameColor) setSchoolNameColor(parsed.schoolNameColor);
        if (parsed.topLineColor) setTopLineColor(parsed.topLineColor);
        else if (parsed.lineColor) setTopLineColor(parsed.lineColor);
        if (parsed.bottomLineColor) setBottomLineColor(parsed.bottomLineColor);
        else if (parsed.lineColor) setBottomLineColor(parsed.lineColor);
      }
      const savedGap = localStorage.getItem('sms_notice_signature_gap');
      if (savedGap) {
        setSignatureTopGap(Number(savedGap));
      }
      const savedLogoOffset = localStorage.getItem('sms_notice_logo_offset');
      if (savedLogoOffset) {
        setLogoLeftOffset(Number(savedLogoOffset));
      }
      const savedFontSize = localStorage.getItem('sms_notice_font_size');
      if (savedFontSize) {
        setContentFontSize(Number(savedFontSize));
      }
    } catch (e) {}

    // Load initial fees from centralized finance service
    try {
      const financeItems = financeService.getClassFeesByType(selectedFeeSector);
      if (financeItems && financeItems.length > 0) {
        setClassFees(financeItems.map(f => ({ className: f.className, examFee: String(f.amount) })));
      }
    } catch (e) {}

    const unsubSettings = settingsService.subscribe((s) => setSchoolSettings(s));
    const unsubNotices = noticeService.subscribe(loadNotices);
    const unsubFinance = financeService.subscribe(() => {
      const updated = financeService.getClassFeesByType(selectedFeeSector);
      if (updated && updated.length > 0) {
        setClassFees(updated.map(f => ({ className: f.className, examFee: String(f.amount) })));
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', loadNotices);
    }

    return () => {
      unsubSettings();
      unsubNotices();
      unsubFinance();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', loadNotices);
      }
    };
  }, [selectedFeeSector]);

  const updateFontSize = (size: number) => {
    setContentFontSize(size);
    try {
      localStorage.setItem('sms_notice_font_size', String(size));
    } catch (e) {}
  };

  const saveColorsToStorage = (newNameColor: string, newTopColor: string, newBottomColor: string) => {
    setSchoolNameColor(newNameColor);
    setTopLineColor(newTopColor);
    setBottomLineColor(newBottomColor);
    try {
      localStorage.setItem('sms_notice_header_colors', JSON.stringify({
        schoolNameColor: newNameColor,
        topLineColor: newTopColor,
        bottomLineColor: newBottomColor
      }));
    } catch (e) {}
  };

  const updateLogoOffset = (offset: number) => {
    const clamped = Math.max(0, Math.min(160, offset));
    setLogoLeftOffset(clamped);
    try {
      localStorage.setItem('sms_notice_logo_offset', String(clamped));
    } catch (e) {}
  };

  const updateSignatureGap = (gap: number) => {
    const clamped = Math.max(0, Math.min(180, gap));
    setSignatureTopGap(clamped);
    try {
      localStorage.setItem('sms_notice_signature_gap', String(clamped));
    } catch (e) {}
  };

  const saveClassFeesToStorage = (newFees: ClassFeeItem[]) => {
    setClassFees(newFees);
    try {
      localStorage.setItem('sms_notice_class_fees', JSON.stringify(newFees));
    } catch (e) {}
  };

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // Switch to In-Page Composer (NO POPUP)
  const handleOpenCreateComposer = (noticeToEdit?: Notice) => {
    if (!isAdmin) {
      showAlert('error', 'সহকারী শিক্ষকরা নোটিশ তৈরি বা সম্পাদনা করতে পারবেন না। এটি শুধুমাত্র প্রধান শিক্ষক ও অ্যাডমিনের জন্য সংরক্ষিত।');
      return;
    }

    const currentPrincipal = schoolSettings.principalName || 'মোহাম্মদ রফিকুল ইসলাম';
    const currentRole = schoolSettings.principalTitle || 'প্রধান শিক্ষক';

    if (noticeToEdit) {
      setEditingNotice(noticeToEdit);
      setTitle(noticeToEdit.title);
      setContent(noticeToEdit.content);
      setCategory(noticeToEdit.category);
      setTargetAudience(noticeToEdit.targetAudience);
      setPriority(noticeToEdit.priority);
      setPublisherName(noticeToEdit.publisherName || currentPrincipal);
      setPublisherRole(noticeToEdit.publisherRole || currentRole);
      setRefNo(noticeToEdit.refNo || '');
      setPublishedDate(noticeToEdit.publishedAt ? noticeToEdit.publishedAt.split('T')[0] : new Date().toISOString().split('T')[0]);
      setIsPinned(noticeToEdit.isPinned);
      setAutoSyncTitle(false);
    } else {
      setEditingNotice(null);
      setTitle('অর্ধ-বার্ষিক পরীক্ষা, শ্রেণি ভিত্তিক পরীক্ষার ফি ও বকেয়া বেতন পরিশোধ সংক্রান্ত বিজ্ঞপ্তি');
      setContent(`এতদ্দ্বারা ৬ষ্ঠ হতে ১০ম শ্রেণির সকল শিক্ষার্থী ও সম্মানিত অভিভাবকদের অবগতির জন্য জানানো যাচ্ছে যে, আগামী ২৫ এপ্রিল ২০২৬ তারিখ হতে অর্ধবার্ষিক পরীক্ষা অনুষ্ঠিত হবে। 

পরীক্ষায় অংশগ্রহণের জন্য শ্রেণি ভিত্তিক নির্ধারিত পরীক্ষার ফি ও যাবতীয় বকেয়া বেতন পরিশোধের তালিকা নিম্নরূপ:
${generateClassFeeString(classFees)}

পরীক্ষা সংক্রান্ত প্রয়োজনীয় নির্দেশনাবলী:
১. আগামী ১০ এপ্রিল ২০২৬ তারিখের মধ্যে চলতি শিক্ষাবর্ষের সকল বকেয়া বেতন ও উপরোক্ত নির্ধারিত পরীক্ষার ফি বিদ্যালয়ের হিসাব শাখায় জমা প্রদান করতে হবে।
২. ফি পরিশোধের রসিদ প্রদর্শনপূর্বক শ্রেণি শিক্ষকের নিকট হতে পরীক্ষার প্রবেশপত্র (Admit Card) সংগ্রহ করতে হবে।
৩. প্রবেশপত্র ব্যতীত কোনো শিক্ষার্থীকে পরীক্ষার হলে প্রবেশের অনুমতি দেওয়া হবে না।
৪. প্রতিদিন পরীক্ষা শুরুর অন্তত ১৫ মিনিট পূর্বে নিজ নিজ নির্ধারিত আসনে উপস্থিত থাকতে হবে।`);
      setCategory('exam');
      setTargetAudience('all');
      setPriority('urgent');
      setPublisherName(currentPrincipal);
      setPublisherRole(currentRole);
      const year = new Date().getFullYear();
      const rand = Math.floor(100 + Math.random() * 900);
      setRefNo(`বউবি/নোটিশ/${year}/${rand}`);
      setPublishedDate(new Date().toISOString().split('T')[0]);
      setIsPinned(false);
      setAutoSyncTitle(true);
    }
    setActiveView('compose');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleApplyTemplate = (tmpl: typeof noticeTemplates[0]) => {
    let activeFees = classFees;
    if ((tmpl as any).feeSector) {
      activeFees = loadFeesForSector((tmpl as any).feeSector);
    }
    setTitle(tmpl.title);
    setContent((tmpl as any).getContent ? (tmpl as any).getContent(activeFees) : '');
    setCategory(tmpl.category);
    setPriority(tmpl.priority);
    setTargetAudience(tmpl.targetAudience);
    showAlert('success', `'${tmpl.name}' টেমপ্লেট সফলভাবে লোড হয়েছে!`);
  };

  const handleSubmitNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showAlert('error', 'সহকারী শিক্ষকদের নোটিশ প্রকাশের অনুমতি নেই।');
      return;
    }
    if (!title.trim() || !content.trim()) {
      return showAlert('error', 'নোটিশের শিরোনাম ও বিস্তারিত বিবরণ প্রদান করুন!');
    }

    const currentPrincipal = schoolSettings.principalName || 'মোহাম্মদ রফিকুল ইসলাম';
    const currentRole = schoolSettings.principalTitle || 'প্রধান শিক্ষক';

    const res = noticeService.saveNotice({
      id: editingNotice?.id,
      title: title.trim(),
      content: content.trim(),
      category,
      targetAudience,
      priority,
      publisherName: publisherName.trim() || currentPrincipal,
      publisherRole: publisherRole.trim() || currentRole,
      refNo: refNo.trim(),
      publishedAt: publishedDate,
      isPinned
    });

    if (res.success) {
      showAlert('success', res.message);
      loadNotices();
      if (selectedNoticeForPrint?.id === editingNotice?.id) {
        setSelectedNoticeForPrint(res.notice || null);
      }
      if (viewingNoticeModal?.id === editingNotice?.id) {
        setViewingNoticeModal(res.notice || null);
      }
      setActiveView('list');
    } else {
      showAlert('error', res.message);
    }
  };

  const handleTogglePin = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin) {
      showAlert('error', 'সহকারী শিক্ষকদের নোটিশ পিন বা পরিবর্তন করার অনুমতি নেই।');
      return;
    }
    const res = noticeService.togglePin(id);
    if (res.success) {
      showAlert('success', res.message);
      loadNotices();
    }
  };

  const handleDeleteNotice = (id: string, noticeTitle: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin) {
      showAlert('error', 'সহকারী শিক্ষকদের নোটিশ মুছে ফেলার অনুমতি নেই। এটি শুধুমাত্র প্রধান শিক্ষক/অ্যাডমিনের জন্য সংরক্ষিত।');
      return;
    }
    if (confirm(`আপনি কি নিশ্চিতভাবে '${noticeTitle}' নোটিশটি মুছে ফেলতে চান?`)) {
      const res = noticeService.deleteNotice(id);
      if (res.success) {
        showAlert('success', res.message);
        loadNotices();
        if (selectedNoticeForPrint?.id === id) {
          setActiveView('list');
          setSelectedNoticeForPrint(null);
        }
        if (viewingNoticeModal?.id === id) {
          setViewingNoticeModal(null);
        }
      }
    }
  };

  const handleClearAllNotices = () => {
    if (!isAdmin) {
      showAlert('error', 'সহকারী শিক্ষকদের নোটিশ মুছে ফেলার অনুমতি নেই।');
      return;
    }
    if (confirm('আপনি কি নিশ্চিতভাবে সকল নোটিশ স্থায়ীভাবে মুছে ফেলতে চান?')) {
      const res = noticeService.clearAllNotices();
      if (res.success) {
        showAlert('success', res.message);
        loadNotices();
        setActiveView('list');
        setSelectedNoticeForPrint(null);
        setViewingNoticeModal(null);
        setSelectedNoticeIds([]);
      }
    }
  };

  const handleOpenPrintPreview = (notice: Notice) => {
    if (!isAdmin) {
      handleOpenQuickView(notice);
      return;
    }
    setSelectedNoticeForPrint(notice);
    setActiveView('preview');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenQuickView = (notice: Notice) => {
    setViewingNoticeModal(notice);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyNoticeText = () => {
    const activeNotice = selectedNoticeForPrint || {
      title,
      content,
      refNo,
      publishedAt: publishedDate,
      publisherName,
      publisherRole
    };

    const text = `${schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}\n${schoolSettings.address || 'বরইতলী, চকরিয়া, কক্সবাজার।'}\nEIIN: ${schoolSettings.eiin || '106184'} , স্থাপিত: ${schoolSettings.estdYear || '1969'} খ্রি .\nমোবাইল নম্বর: ${schoolSettings.phone || '01819-000000'}\n\nস্মারক নং: ${activeNotice.refNo || ''}   তারিখ: ${formatDate(activeNotice.publishedAt)}\n\nবিজ্ঞপ্তি / নোটিশ\n\n${activeNotice.content}\n\n${activeNotice.publisherName || schoolSettings.principalName || 'মোহাম্মদ রফিকুল ইসলাম'}\n${activeNotice.publisherRole || schoolSettings.principalTitle || 'প্রধান শিক্ষক'}\n${schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}`;
    navigator.clipboard.writeText(text);
    showAlert('success', 'নোটিশের পূর্ণাঙ্গ টেক্সট ক্লিপবোর্ডে কপি করা হয়েছে!');
  };

  // Bulk Selection Handlers
  const handleSelectAll = () => {
    if (selectedNoticeIds.length === filteredNotices.length) {
      setSelectedNoticeIds([]);
    } else {
      setSelectedNoticeIds(filteredNotices.map(n => n.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedNoticeIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (!isAdmin) {
      showAlert('error', 'সহকারী শিক্ষকদের নোটিশ মুছে ফেলার অনুমতি নেই।');
      return;
    }
    if (!selectedNoticeIds.length) return;
    if (confirm(`আপনি কি নির্বাচিত ${selectedNoticeIds.length} টি নোটিশ মুছে ফেলতে চান?`)) {
      selectedNoticeIds.forEach(id => noticeService.deleteNotice(id));
      setSelectedNoticeIds([]);
      loadNotices();
      showAlert('success', 'নির্বাচিত নোটিশগুলো সফলভাবে মুছে ফেলা হয়েছে!');
    }
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: notices.length,
      exam: 0,
      holiday: 0,
      academic: 0,
      events: 0,
      emergency: 0
    };
    notices.forEach(n => {
      if (counts[n.category] !== undefined) {
        counts[n.category]++;
      }
    });
    return counts;
  }, [notices]);

  // Filter Notices
  const filteredNotices = notices.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (n.refNo && n.refNo.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || n.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || n.priority === selectedPriority;
    const matchesTarget = selectedTarget === 'all' || n.targetAudience === selectedTarget;

    return matchesSearch && matchesCategory && matchesPriority && matchesTarget;
  });

  const getCategoryBadge = (cat: Notice['category']) => {
    switch (cat) {
      case 'exam':
        return <span className="px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-300/80 rounded-md text-[11px] font-black inline-flex items-center gap-1 shadow-2xs">📝 পরীক্ষা</span>;
      case 'emergency':
        return <span className="px-2.5 py-0.5 bg-rose-50 text-rose-900 border border-rose-300/80 rounded-md text-[11px] font-black inline-flex items-center gap-1 shadow-2xs">🚨 জরুরি</span>;
      case 'holiday':
        return <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-950 border border-emerald-300/80 rounded-md text-[11px] font-black inline-flex items-center gap-1 shadow-2xs">🌴 ছুটি</span>;
      case 'academic':
        return <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-950 border border-indigo-300/80 rounded-md text-[11px] font-black inline-flex items-center gap-1 shadow-2xs">📚 একাডেমিক</span>;
      case 'events':
        return <span className="px-2.5 py-0.5 bg-purple-50 text-purple-950 border border-purple-300/80 rounded-md text-[11px] font-black inline-flex items-center gap-1 shadow-2xs">🎉 অনুষ্ঠান</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 rounded-md text-[11px] font-black inline-flex items-center gap-1 shadow-2xs">📢 সাধারণ</span>;
    }
  };

  const getTargetAudienceBadge = (aud: Notice['targetAudience']) => {
    switch (aud) {
      case 'teachers':
        return <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[10px] font-extrabold">👨‍🏫 শিক্ষকবৃন্দ</span>;
      case 'parents':
        return <span className="px-2 py-0.5 bg-pink-50 text-pink-800 border border-pink-200 rounded text-[10px] font-extrabold">👨‍👩‍👧‍👦 অভিভাবক</span>;
      case 'students':
        return <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded text-[10px] font-extrabold">🎓 শিক্ষার্থী</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold">🌐 সকলে</span>;
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 font-sans text-slate-900">
      
      {/* ─── NATIVE PRINT CSS FOR ACCURATE A4 & ZERO BORDER ─── */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide all dashboard UI, header, sidebar, controls */
          header, aside, nav, .print-hidden-zone, .print\\:hidden {
            display: none !important;
          }
          .notice-print-standalone-sheet {
            display: block !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 auto !important;
            padding-left: 1in !important;
            padding-right: 0.6in !important;
            padding-bottom: 0.5in !important;
            padding-top: ${printMode === 'pad' ? '3in' : '0.6in'} !important;
            box-sizing: border-box !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Loading state */}
      {!mounted && (
        <div className="p-12 text-center font-bold text-slate-400">
          নোটিশ বোর্ড লোড হচ্ছে...
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 1. MAIN LIST VIEW (TABLE REGISTER & HERO METRICS)               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mounted && activeView === 'list' && (
        <>
          {/* TOP ACTIONS & STATS ROW (Clean & Compact) */}
          <div className="space-y-4 print:hidden">
            <div className="flex flex-wrap items-center justify-end gap-2.5">
              {!isAdmin && (
                <span className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs">
                  <Eye size={15} /> শিক্ষক ভিউ-অনলি মোড (শুধু নোটিশ দেখার অনুমতি)
                </span>
              )}

              {isAdmin && notices.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllNotices}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Trash2 size={14} /> সকল নোটিশ মুছুন
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowBlankPadModal(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Printer size={15} /> ফাঁকা স্কুল প্যাড প্রিন্ট
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenCreateComposer()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <PlusCircle size={15} /> নতুন নোটিশ তৈরি করুন
                </button>
              )}
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
                  <span>মোট প্রকাশিত নোটিশ</span>
                  <FileText size={14} className="text-indigo-600" />
                </div>
                <strong className="text-2xl font-black text-slate-900 block mt-1">{notices.length} <span className="text-xs font-bold text-slate-500 font-normal">টি</span></strong>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-amber-200 shadow-xs">
                <div className="flex items-center justify-between text-amber-700 text-[11px] font-bold">
                  <span>পিনকৃত গুরুত্বপূর্ণ</span>
                  <Pin size={14} className="text-amber-500 fill-amber-500" />
                </div>
                <strong className="text-2xl font-black text-amber-900 block mt-1">
                  {notices.filter(n => n.isPinned).length} <span className="text-xs font-bold text-amber-700 font-normal">টি</span>
                </strong>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-rose-200 shadow-xs">
                <div className="flex items-center justify-between text-rose-700 text-[11px] font-bold">
                  <span>জরুরি নির্দেশিকা</span>
                  <AlertTriangle size={14} className="text-rose-500" />
                </div>
                <strong className="text-2xl font-black text-rose-900 block mt-1">
                  {notices.filter(n => n.priority === 'urgent').length} <span className="text-xs font-bold text-rose-700 font-normal">টি</span>
                </strong>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-emerald-200 shadow-xs">
                <div className="flex items-center justify-between text-emerald-700 text-[11px] font-bold">
                  <span>জারিকারক কর্মকর্তা</span>
                  <Award size={14} className="text-emerald-600" />
                </div>
                <strong className="text-xs font-black text-emerald-950 truncate block mt-2">
                  {schoolSettings.principalName || 'মোহাম্মদ রফিকুল ইসলাম'}
                </strong>
                <span className="text-[10px] text-emerald-700 font-medium block">
                  {schoolSettings.principalTitle || 'প্রধান শিক্ষক'}
                </span>
              </div>
            </div>
          </div>

          {/* ALERT NOTIFICATION */}
          {alertMsg && (
            <div className={`p-4 rounded-2xl font-bold text-xs flex items-center justify-between border shadow-sm print:hidden animate-in fade-in ${
              alertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                {alertMsg.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-rose-600" />}
                <span>{alertMsg.text}</span>
              </div>
              <button onClick={() => setAlertMsg(null)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>
          )}

          {/* SEARCH, CATEGORY TABS & MULTI-FILTER BAR */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm print:hidden space-y-3.5">
            
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              
              <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="নোটিশের শিরোনাম, স্মারক নম্বর বা বিবরণ দিয়ে তাৎক্ষণিক খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">সকল অগ্রাধিকার</option>
                  <option value="urgent">🚨 শুধু জরুরি</option>
                  <option value="important">⭐ গুরুত্বপূর্ণ</option>
                  <option value="normal">সাধারণ</option>
                </select>

                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">সকল প্রাপক</option>
                  <option value="students">🎓 শিক্ষার্থী</option>
                  <option value="teachers">👨‍🏫 শিক্ষকবৃন্দ</option>
                  <option value="parents">👨‍👩‍👧‍👦 অভিভাবক</option>
                </select>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setListLayout('table')}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      listLayout === 'table' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="তালিকা ভিউ (Table View)"
                  >
                    <List size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setListLayout('cards')}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      listLayout === 'cards' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="কার্ড ভিউ (Card View)"
                  >
                    <LayoutGrid size={16} />
                  </button>
                </div>
              </div>

            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
              {[
                { key: 'all', label: 'সকল নোটিশ', count: categoryCounts.all },
                { key: 'exam', label: 'পরীক্ষা', count: categoryCounts.exam },
                { key: 'holiday', label: 'ছুটি', count: categoryCounts.holiday },
                { key: 'academic', label: 'একাডেমিক', count: categoryCounts.academic },
                { key: 'events', label: 'অনুষ্ঠান / সভা', count: categoryCounts.events },
                { key: 'emergency', label: 'জরুরি', count: categoryCounts.emergency },
              ].map(c => (
                <button
                  key={c.key}
                  onClick={() => setSelectedCategory(c.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === c.key 
                      ? 'bg-slate-900 text-white shadow-sm font-black' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>{c.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    selectedCategory === c.key ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {c.count}
                  </span>
                </button>
              ))}
            </div>

          </div>

          {/* PUBLISHED NOTICES TABLE LIST */}
          {listLayout === 'table' ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:hidden space-y-0">
              
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      প্রকাশিত নোটিশ রেজিস্টার
                    </h3>
                    <span className="text-[11px] font-bold text-slate-500">
                      মোট {filteredNotices.length} টি নোটিশ প্রদর্শিত হচ্ছে
                    </span>
                  </div>
                </div>

                {selectedNoticeIds.length > 0 && (
                  <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-2xl border border-indigo-200 animate-in fade-in">
                    <span className="text-xs font-black text-indigo-900">
                      {selectedNoticeIds.length} টি নির্বাচিত
                    </span>
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} /> ডিলিট করুন
                    </button>
                  </div>
                )}
              </div>

              {filteredNotices.length === 0 ? (
                <div className="p-16 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
                    📢
                  </div>
                  <h4 className="text-base font-bold text-slate-700">কোনো নোটিশ পাওয়া যায়নি</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    আপনার নির্বাচিত ফিল্টার বা সার্চে কোনো নোটিশ মেলেনি। নতুন নোটিশ তৈরি করতে ওপরের বাটনে ক্লিক করুন।
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-800 border-collapse">
                    
                    <thead className="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[11px] border-b border-slate-200 select-none">
                      <tr>
                        <th className="py-3.5 px-4 w-12 text-center">
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={handleSelectAll}
                              className="text-slate-500 hover:text-indigo-600 cursor-pointer"
                              title="সকল সিলেক্ট করুন"
                            >
                              {selectedNoticeIds.length === filteredNotices.length && filteredNotices.length > 0 ? (
                                <CheckSquare size={16} className="text-indigo-600" />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-400 font-black">#</span>
                          )}
                        </th>
                        <th className="py-3.5 px-4 w-44 whitespace-nowrap">স্মারক ও তারিখ</th>
                        <th className="py-3.5 px-6 min-w-[320px]">নোটিশের বিষয় ও সারসংক্ষেপ</th>
                        <th className="py-3.5 px-5 w-44 whitespace-nowrap">জারিকারক</th>
                        <th className={`py-3.5 px-6 text-right whitespace-nowrap ${isAdmin ? 'w-72' : 'w-36'}`}>
                          {isAdmin ? 'অ্যাকশন বাটনসমূহ' : 'অ্যাকশন'}
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredNotices.map((notice, idx) => {
                        const isSelected = selectedNoticeIds.includes(notice.id);

                        return (
                          <tr 
                            key={notice.id} 
                            className={`group transition-colors duration-150 ${
                              isSelected 
                                ? 'bg-indigo-50/50' 
                                : notice.isPinned 
                                  ? 'bg-amber-50/30 hover:bg-amber-50/60' 
                                  : idx % 2 === 0 
                                    ? 'bg-white hover:bg-slate-50/80' 
                                    : 'bg-slate-50/30 hover:bg-slate-50/80'
                            }`}
                          >
                            
                            <td className="py-4 px-4 text-center align-middle">
                              <div className="flex items-center justify-center gap-1.5">
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSelectRow(notice.id)}
                                    className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                                  >
                                    {isSelected ? (
                                      <CheckSquare size={16} className="text-indigo-600" />
                                    ) : (
                                      <Square size={16} />
                                    )}
                                  </button>
                                )}

                                <span className="font-mono font-bold text-slate-400 text-xs">
                                  {idx + 1}
                                </span>

                                {notice.isPinned && (
                                  <span title="পিনকৃত গুরুত্বপূর্ণ নোটিশ">
                                    <Pin size={13} className="fill-amber-500 text-amber-500" />
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-4 align-middle whitespace-nowrap">
                              <div className="space-y-1">
                                <span className="font-mono font-extrabold text-[11px] text-indigo-900 bg-indigo-50/80 border border-indigo-200/80 px-2 py-0.5 rounded-md inline-block">
                                  {notice.refNo || 'বউবি/নোটিশ/২০২৬'}
                                </span>
                                <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                                  <Calendar size={12} className="text-slate-400" />
                                  <span>{formatDate(notice.publishedAt)}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-6 align-middle">
                              <div className="space-y-1.5">
                                
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {getCategoryBadge(notice.category)}
                                  {getTargetAudienceBadge(notice.targetAudience)}
                                  
                                  {notice.priority === 'urgent' && (
                                    <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-black animate-pulse">
                                      জরুরি
                                    </span>
                                  )}
                                </div>

                                <h4 
                                  onClick={() => handleOpenQuickView(notice)}
                                  className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug cursor-pointer"
                                >
                                  {notice.title}
                                </h4>

                                <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed font-normal">
                                  {notice.content}
                                </p>

                              </div>
                            </td>

                            <td className="py-4 px-5 align-middle whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                                  ম
                                </div>
                                <div className="leading-tight">
                                  <strong className="text-xs font-black text-slate-900 block truncate max-w-[130px]">
                                    {notice.publisherName || schoolSettings.principalName || 'মোহাম্মদ রফিকুল ইসলাম'}
                                  </strong>
                                  <span className="text-[10px] text-indigo-700 font-bold">
                                    {notice.publisherRole || 'প্রধান শিক্ষক'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-6 align-middle text-right whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                
                                <button
                                  type="button"
                                  onClick={() => handleOpenQuickView(notice)}
                                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-indigo-200 hover:border-indigo-600 cursor-pointer shadow-2xs active:scale-95"
                                  title="নোটিশটি বিস্তারিত দেখুন ও পড়ুন"
                                >
                                  <Eye size={14} /> বিস্তারিত পড়ুন
                                </button>

                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPrintPreview(notice)}
                                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1 border border-emerald-200 hover:border-emerald-600 cursor-pointer shadow-2xs active:scale-95"
                                    title="অফিসিয়াল A4 প্যাডে প্রিন্ট বা PDF সংরক্ষণ"
                                  >
                                    <Printer size={14} /> প্রিন্ট
                                  </button>
                                )}

                                {isAdmin && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCreateComposer(notice)}
                                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-400 text-amber-900 hover:text-slate-950 rounded-xl text-xs font-extrabold transition flex items-center gap-1 border border-amber-200 hover:border-amber-400 cursor-pointer shadow-2xs active:scale-95"
                                      title="নোটিশ সম্পাদনা করুন (ইন-পেইজ স্টুডিও)"
                                    >
                                      <Edit3 size={14} /> এডিট
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteNotice(notice.id, notice.title, e)}
                                      className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl text-xs font-bold transition flex items-center border border-rose-200 hover:border-rose-600 cursor-pointer shadow-2xs active:scale-95"
                                      title="নোটিশ মুছে ফেলুন"
                                    >
                                      <Trash2 size={15} />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => handleTogglePin(notice.id, e)}
                                      className={`p-1.5 rounded-xl text-xs font-bold transition flex items-center border cursor-pointer shadow-2xs active:scale-95 ${
                                        notice.isPinned 
                                          ? 'bg-amber-400 text-slate-950 border-amber-500 hover:bg-amber-500' 
                                          : 'bg-slate-50 hover:bg-slate-200 text-slate-500 border-slate-200'
                                      }`}
                                      title={notice.isPinned ? 'আনপিন করুন' : 'শীর্ষে পিন করুন'}
                                    >
                                      <Pin size={15} className={notice.isPinned ? 'fill-slate-950' : ''} />
                                    </button>
                                  </>
                                )}

                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>

                  </table>
                </div>
              )}

            </div>
          ) : (
            <div className="space-y-6 print:hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredNotices.map(notice => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    isAdmin={isAdmin}
                    onPin={handleTogglePin}
                    onPrint={() => handleOpenPrintPreview(notice)}
                    onView={() => handleOpenQuickView(notice)}
                    onEdit={() => handleOpenCreateComposer(notice)}
                    onDelete={handleDeleteNotice}
                    getCategoryBadge={getCategoryBadge}
                    getTargetAudienceBadge={getTargetAudienceBadge}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}

        </>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 2. 🏛️ IN-PAGE NOTICE COMPOSER & LIVE DUAL-PANE STUDIO (NO POPUP)   */}
      {/* বাম পাশে এডিটর ফর্ম + ডান পাশে রিয়েল-টাইম লাইভ প্যাড প্রিভিউ    */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {mounted && activeView === 'compose' && (
        <div className="space-y-6 print:hidden animate-in fade-in">
          
          {/* Top Control Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveView('list')}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs transition cursor-pointer"
              >
                <ArrowLeft size={16} /> নোটিশ তালিকায় ফিরুন
              </button>
              
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  {editingNotice ? 'নোটিশ সম্পাদনা স্টুডিও' : 'নতুন প্রাতিষ্ঠানিক নোটিশ ড্রাফটার'}
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">বাম পাশে লিখুন — ডান পাশে রিয়েল-টাইম অফিসিয়াল প্যাডে সরাসরি লাইভ রূপ দেখুন</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowColorController(!showColorController)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition border cursor-pointer ${
                  showColorController 
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' 
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                }`}
              >
                <Palette size={15} /> প্যাড স্টাইল
              </button>

              <button
                type="button"
                onClick={handleSubmitNotice}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Send size={15} /> {editingNotice ? 'আপডেট ও সেভ করুন' : 'অফিশিয়াল প্রকাশ করুন'}
              </button>
            </div>

          </div>

          {/* Color controller dropdown banner if active */}
          {showColorController && (
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border border-indigo-200 rounded-3xl animate-in fade-in space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <span className="text-xs font-black text-indigo-950 flex items-center gap-2">
                  <Palette size={15} className="text-indigo-600" /> প্যাডের কালার, ২-লাইন কালার, লোগো ও স্বাক্ষর পজিশন
                </span>
                <button
                  type="button"
                  onClick={() => setShowColorController(false)}
                  className="w-6 h-6 rounded-full bg-white hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* 1. School Name Color */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-xs font-black">
                    <span>স্কুলের নাম কালার</span>
                    <span className="text-[10px] font-mono text-slate-500">{schoolNameColor}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={schoolNameColor}
                      onChange={(e) => saveColorsToStorage(e.target.value, topLineColor, bottomLineColor)}
                      className="w-7 h-7 rounded cursor-pointer border p-0.5"
                    />
                    <input
                      type="text"
                      value={schoolNameColor}
                      onChange={(e) => saveColorsToStorage(e.target.value, topLineColor, bottomLineColor)}
                      className="w-full px-2 py-1 text-[11px] font-mono font-bold bg-slate-50 border rounded"
                    />
                  </div>
                </div>

                {/* 2. Top Line (3px) */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-xs font-black">
                    <span>১ম লাইন কালার (৩px)</span>
                    <span className="text-[10px] font-mono text-slate-500">{topLineColor}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={topLineColor}
                      onChange={(e) => saveColorsToStorage(schoolNameColor, e.target.value, bottomLineColor)}
                      className="w-7 h-7 rounded cursor-pointer border p-0.5"
                    />
                    <input
                      type="text"
                      value={topLineColor}
                      onChange={(e) => saveColorsToStorage(schoolNameColor, e.target.value, bottomLineColor)}
                      className="w-full px-2 py-1 text-[11px] font-mono font-bold bg-slate-50 border rounded"
                    />
                  </div>
                </div>

                {/* 3. Bottom Line (1px) */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-xs font-black">
                    <span>২য় লাইন কালার (১px)</span>
                    <span className="text-[10px] font-mono text-slate-500">{bottomLineColor}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={bottomLineColor}
                      onChange={(e) => saveColorsToStorage(schoolNameColor, topLineColor, e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border p-0.5"
                    />
                    <input
                      type="text"
                      value={bottomLineColor}
                      onChange={(e) => saveColorsToStorage(schoolNameColor, topLineColor, e.target.value)}
                      className="w-full px-2 py-1 text-[11px] font-mono font-bold bg-slate-50 border rounded"
                    />
                  </div>
                </div>

                {/* 4. Logo Left Offset */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-xs font-black">
                    <span>লোগোর অবস্থান</span>
                    <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1 rounded">{logoLeftOffset}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="150" 
                    step="5"
                    value={logoLeftOffset} 
                    onChange={(e) => updateLogoOffset(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── DUAL-PANE STUDIO: LEFT FORM + RIGHT LIVE PREVIEW ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 👈 বাম পাশ: সম্পূর্ণ নোটিশ ড্রাফট ফর্ম ও শ্রেণি ফি প্যানেল        */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-6 space-y-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm">
              
              {/* 1. Quick Ready-Made Templates Bar */}
              <div className="bg-gradient-to-r from-amber-50/90 via-indigo-50/50 to-amber-50/90 border border-amber-200/80 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-800 uppercase flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-600" /> প্রাতিষ্ঠানিক স্ট্যান্ডার্ড টেমপ্লেট নির্বাচন করুন:
                  </span>
                  <span className="text-[10px] text-indigo-700 font-bold bg-white px-2 py-0.5 rounded-md border border-indigo-100">
                    ১-ক্লিকে লোড ও অটো-সিঙ্ক
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {noticeTemplates.map(tmpl => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-2.5 py-1.5 bg-white hover:bg-amber-100 text-slate-900 border border-amber-300/80 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. 💰 শ্রেণি ভিত্তিক ফি ম্যাট্রিক্স (অর্থ আদায় সেকশন হতে লাইভ সিঙ্ক) */}
              <div className="bg-slate-50 border border-indigo-200/80 p-4 rounded-2xl space-y-3.5 shadow-2xs">
                
                {/* Header with Title, Live Badge & Link to Finance Settings */}
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-indigo-100/70 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      <Coins size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                        অর্থ আদায় সেকশন হতে শ্রেণি ভিত্তিক ফি
                        <span className="px-2 py-0.2 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md text-[9px] font-bold">
                          🟢 লাইভ সিঙ্ক
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">নিচের ফি সরাসরি অর্থ আদায় (Finance) মডিউল থেকে আসছে</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/dashboard/finance"
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                      title="অর্থ আদায় সেকশনে ফি কনফিগার করুন"
                    >
                      <SlidersHorizontal size={12} /> অর্থ আদায় সেটিংস
                    </Link>
                  </div>
                </div>

                {/* Sector Switcher Tabs */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase mr-1">খাত নির্বাচন:</span>
                  {[
                    { id: 'exam', label: '📝 পরীক্ষার ফি' },
                    { id: 'registration', label: '📋 রেজিস্ট্রেশন ফি' },
                    { id: 'farewell', label: '🎓 বিদায় অনুষ্ঠান ফি' },
                    { id: 'tuition', label: '💵 মাসিক বেতন' }
                  ].map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => loadFeesForSector(sec.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        selectedFeeSector === sec.id
                          ? 'bg-indigo-600 text-white font-black shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>

                {/* Class Fee Items Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
                  {classFees.map((feeItem, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-1 relative group">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span className="font-extrabold text-slate-900">{feeItem.className}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={feeItem.examFee}
                          onChange={(e) => handleUpdateClassFee(idx, e.target.value)}
                          placeholder="ফি"
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black font-mono text-indigo-950 text-right outline-none focus:border-indigo-500 focus:bg-white"
                        />
                        <span className="text-[10px] font-bold text-slate-500">৳</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 1-Click Insert Button */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-500">
                    বর্তমান খাত: <strong className="text-slate-900">{selectedFeeSector === 'exam' ? 'পরীক্ষার ফি' : selectedFeeSector === 'registration' ? 'রেজিস্ট্রেশন ফি' : selectedFeeSector === 'farewell' ? 'বিদায় অনুষ্ঠান ফি' : 'মাসিক বেতন'}</strong>
                  </span>
                  
                  <button
                    type="button"
                    onClick={handleInsertClassFees}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                  >
                    <Sparkle size={13} /> নোটিশে এই ফি তালিকা যোগ করুন
                  </button>
                </div>

              </div>

              {/* 3. Main Form Inputs */}
              <form onSubmit={handleSubmitNotice} className="space-y-4 text-xs font-medium text-slate-700">
                
                {/* Title & Auto-Sync Switch */}
                <div className="space-y-1.5 bg-indigo-50/30 p-3.5 rounded-2xl border border-indigo-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <span>নোটিশের শিরোনাম / বিষয়</span>
                      <span className="text-rose-500">*</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoSyncTitle}
                        onChange={(e) => setAutoSyncTitle(e.target.checked)}
                        className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer"
                      />
                      <span>🔄 বিষয়ে যা লিখবেন তা স্বয়ংক্রিয় বর্ণনায় সিঙ্ক হবে</span>
                    </label>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="যেমন: অর্ধবার্ষিক পরীক্ষা, শ্রেণি ভিত্তিক পরীক্ষার ফি ও বকেয়া বেতন পরিশোধ সংক্রান্ত বিজ্ঞপ্তি"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-black text-sm text-slate-950 outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>

                {/* Category, Priority & Target Audience */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">ক্যাটাগরি</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="exam">📝 পরীক্ষা সংক্রান্ত (Exam)</option>
                      <option value="holiday">🌴 ছুটি সংক্রান্ত (Holiday)</option>
                      <option value="academic">📚 একাডেমিক / রেজিস্ট্রেশন</option>
                      <option value="events">🎉 সভা / অনুষ্ঠান</option>
                      <option value="emergency">🚨 জরুরি বিজ্ঞপ্তি</option>
                      <option value="general">📢 সাধারণ নোটিশ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">অগ্রাধিকার</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="urgent">🚨 জরুরি (Urgent)</option>
                      <option value="important">⭐ গুরুত্বপূর্ণ (Important)</option>
                      <option value="normal">সাধারণ (Normal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">উদ্দিষ্ট প্রাপক</label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="all">🌐 সকলের জন্য (All)</option>
                      <option value="students">🎓 শিক্ষার্থীগণ</option>
                      <option value="parents">👨‍👩‍👧‍👦 অভিভাবকবৃন্দ</option>
                      <option value="teachers">👨‍🏫 সম্মানিত শিক্ষকবৃন্দ</option>
                    </select>
                  </div>
                </div>

                {/* Ref No & Publish Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">স্মারক নম্বর (Ref No)</label>
                    <input
                      type="text"
                      placeholder="বউবি/নোটিশ/২০২৬/১০৪"
                      value={refNo}
                      onChange={(e) => setRefNo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">প্রকাশের তারিখ</label>
                    <input
                      type="date"
                      value={publishedDate}
                      onChange={(e) => setPublishedDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Detailed Content & Smart Snippet Toolbar */}
                <div className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="text-xs font-bold text-slate-900">
                      নোটিশের বিস্তারিত বিবরণ ও নির্দেশনাবলী <span className="text-rose-500">*</span>
                    </label>

                    {/* Point Inserters */}
                    {/* Point Inserters */}
                    <div className="flex items-center gap-1 flex-wrap text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          const fees = loadFeesForSector('exam');
                          setContent(prev => prev.trim() + `\n\nশ্রেণি ভিত্তিক পরীক্ষার ফি তালিকা:\n${generateClassFeeString(fees)}`);
                          showAlert('success', 'পরীক্ষার ফি তালিকা সফলভাবে যোগ করা হয়েছে!');
                        }}
                        className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded font-black cursor-pointer shadow-2xs"
                        title="শ্রেণি ভিত্তিক পরীক্ষার ফি তালিকা যোগ করুন"
                      >
                        + পরীক্ষার ফি
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const fees = loadFeesForSector('registration');
                          setContent(prev => prev.trim() + `\n\nশ্রেণি ভিত্তিক রেজিস্ট্রেশন ফি বিবরণ:\n${generateClassFeeString(fees)}`);
                          showAlert('success', 'রেজিস্ট্রেশন ফি তালিকা সফলভাবে যোগ করা হয়েছে!');
                        }}
                        className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded font-black cursor-pointer shadow-2xs"
                        title="রেজিস্ট্রেশন ফি তালিকা যোগ করুন"
                      >
                        + রেজিস্ট্রেশন ফি
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const fees = loadFeesForSector('farewell');
                          setContent(prev => prev.trim() + `\n\nশ্রেণি ভিত্তিক বিদায় অনুষ্ঠান ফি তালিকা:\n${generateClassFeeString(fees)}`);
                          showAlert('success', 'বিদায় অনুষ্ঠান ফি তালিকা সফলভাবে যোগ করা হয়েছে!');
                        }}
                        className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded font-black cursor-pointer shadow-2xs"
                        title="বিদায় অনুষ্ঠান ফি তালিকা যোগ করুন"
                      >
                        + বিদায় ফি
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const fees = loadFeesForSector('tuition');
                          setContent(prev => prev.trim() + `\n\nশ্রেণি ভিত্তিক মাসিক বেতন তালিকা:\n${generateClassFeeString(fees)}`);
                          showAlert('success', 'মাসিক বেতন তালিকা সফলভাবে যোগ করা হয়েছে!');
                        }}
                        className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded font-black cursor-pointer shadow-2xs"
                        title="মাসিক বেতন তালিকা যোগ করুন"
                      >
                        + মাসিক বেতন
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertSnippet('fee_due_rules')}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded cursor-pointer"
                        title="বকেয়া বেতন ও ফি পরিশোধের নিয়ম যোগ করুন"
                      >
                        + ফি ও এডমিট শর্ত
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertSnippet('exam_rules')}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded cursor-pointer"
                        title="পরীক্ষার হলের নির্দেশনাবলী যোগ করুন"
                      >
                        + পরীক্ষার নিয়ম
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertSnippet('holiday_dates')}
                        className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded cursor-pointer"
                        title="ছুটি ও খোলার তারিখ"
                      >
                        + ছুটি
                      </button>
                    </div>
                  </div>

                  <textarea
                    required
                    rows={10}
                    placeholder="নোটিশের পূর্ণাঙ্গ প্রাতিষ্ঠানিক বিবরণ লিখুন..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-normal text-slate-900 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-sans"
                  />
                </div>

                {/* Publisher / Signatory Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">জারিকারকের নাম</label>
                    <input
                      type="text"
                      value={publisherName}
                      onChange={(e) => setPublisherName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">পদবী</label>
                    <input
                      type="text"
                      value={publisherRole}
                      onChange={(e) => setPublisherRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Pin to Top Checkbox */}
                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-900">
                    📌 নোটিশ বোর্ডের শীর্ষে পিন করে রাখুন (Pin to Top)
                  </span>
                </label>

                {/* Bottom Submit Toolbar */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveView('list')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <Send size={15} /> {editingNotice ? 'আপডেট ও সংরক্ষণ করুন' : 'অফিশিয়াল নোটিশ প্রকাশ করুন'}
                  </button>
                </div>

              </form>

            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 👉 ডান পাশ: রিয়েল-টাইম লাইভ প্যাড ক্যানভাস প্রিভিউ               */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-6 space-y-3 sticky top-4">
              
              {/* Studio Canvas Header */}
              <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-black text-slate-900">রিয়েল-টাইম A4 প্যাড লাইভ ভিউ</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyNoticeText}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={13} /> কপি
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNoticeForPrint({
                        id: 'TEMP_PREVIEW',
                        title,
                        content,
                        category,
                        targetAudience,
                        priority,
                        publisherName,
                        publisherRole,
                        refNo,
                        publishedAt: publishedDate,
                        isPinned
                      });
                      setActiveView('preview');
                    }}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Printer size={14} /> পূর্ণাঙ্গ প্রিন্ট ভিউ
                  </button>
                </div>
              </div>

              {/* Scaled Mini-Pad Preview */}
              <div className="bg-slate-200/80 p-3 sm:p-5 rounded-3xl overflow-hidden border border-slate-300 flex justify-center shadow-inner">
                <div className="bg-white text-slate-950 relative shadow-xl rounded-sm p-6 sm:p-8 w-full max-w-[540px] min-h-[640px] space-y-3 text-xs">
                  
                  {/* Background Watermark */}
                  {showWatermark && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                      <img 
                        src={schoolSettings.schoolLogo || '/logo.png'} 
                        alt="Watermark" 
                        className="w-48 h-48 object-contain grayscale opacity-5"
                      />
                    </div>
                  )}

                  <div className="relative z-10 space-y-3">
                    
                    {/* Header */}
                    <div className="relative pb-1">
                      <div 
                        className="absolute top-0 flex items-start"
                        style={{ left: `${Math.max(0, logoLeftOffset - 25)}px` }}
                      >
                        <img 
                          src={schoolSettings.schoolLogo || '/logo.png'} 
                          alt="Logo" 
                          className="w-14 h-14 object-contain"
                        />
                      </div>

                      <div className="w-full text-center">
                        <h1 
                          className="text-lg font-black font-serif tracking-tight leading-tight"
                          style={{ color: schoolNameColor }}
                        >
                          {schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                        </h1>
                        <p className="text-[10px] font-bold text-slate-800 mt-0.5">
                          {schoolSettings.address || 'বরইতলী, চকরিয়া, কক্সবাজার।'}
                        </p>
                        <p className="text-[9px] font-bold text-slate-600 font-mono">
                          EIIN: {schoolSettings.eiin || '106184'} , স্থাপিত: {schoolSettings.estdYear || '1969'} খ্রি .
                        </p>
                        <p className="text-[9px] font-bold text-slate-600 font-mono">
                          মোবাইল: {schoolSettings.phone || '01819-000000'}
                        </p>
                      </div>

                      {/* 2 Lines */}
                      <div className="mt-2 -mx-6 sm:-mx-8 flex flex-col gap-[2px]">
                        <div className="w-full h-[2.5px]" style={{ backgroundColor: topLineColor }}></div>
                        <div className="w-full h-[1px]" style={{ backgroundColor: bottomLineColor }}></div>
                      </div>
                    </div>

                    {/* Ref & Date */}
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-900 pt-0 pb-0.5">
                      <div>
                        <span>স্মারক নং: </span>
                        <span className="font-mono">{refNo || 'বউবি/নোটিশ'}</span>
                      </div>
                      <div>
                        <span>তারিখ: </span>
                        <span className="font-mono">{formatDate(publishedDate)}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="text-center pt-2 pb-1">
                      <h3 className="text-xs font-bold text-slate-950 underline underline-offset-4 tracking-wider">
                        বিজ্ঞপ্তি / নোটিশ
                      </h3>
                    </div>

                    {/* Content */}
                    <div 
                      className="text-slate-950 leading-relaxed text-justify whitespace-pre-line font-normal bg-slate-50/50 p-3 rounded-lg border border-slate-100"
                      style={{ fontSize: `${Math.max(11, contentFontSize - 2)}px` }}
                    >
                      {content || '(বাম পাশে নোটিশের বিবরণ টাইপ করুন...)'}
                    </div>

                    {/* Footer Signature */}
                    <div 
                      className="flex justify-between items-end text-slate-900"
                      style={{ paddingTop: `${Math.min(30, signatureTopGap / 2)}px` }}
                    >
                      <div className="text-[8px] text-slate-600 space-y-0.5">
                        <p className="font-bold underline">অনুলিপি:</p>
                        <p>১. নোটিশ বোর্ড</p>
                        <p>২. শিক্ষক মিলনায়তন</p>
                        <p>৩. অফিস নথি</p>
                      </div>

                      <div className="text-center space-y-0.5 min-w-[140px]">
                        <div className="w-28 border-b border-slate-900 mx-auto mb-0.5"></div>
                        <p className="font-black text-[10px] text-slate-950">{publisherName}</p>
                        <p className="text-[9px] font-bold text-slate-700">{publisherRole}</p>
                        <p className="text-[8px] font-semibold text-slate-600">{schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}</p>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 3. 🖨️ DEDICATED FULL-SCREEN A4 PRINT SHEET VIEW                  */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {mounted && activeView === 'preview' && selectedNoticeForPrint && (
        <div className="space-y-6">
          
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm print:hidden space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveView('list')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs transition cursor-pointer"
                >
                  <ArrowLeft size={16} /> নোটিশ তালিকায় ফিরুন
                </button>

                <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPrintMode('full')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      printMode === 'full' 
                        ? 'bg-white text-indigo-950 shadow-sm font-black' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏫 ফুল হেডারসহ প্রিন্ট
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintMode('pad')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      printMode === 'pad' 
                        ? 'bg-white text-emerald-950 shadow-sm font-black' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="বিদ্যালয়ের নিজস্ব প্রিন্টেড প্যাডের জন্য উপরে ৩ ইঞ্চি ফাঁকা রাখবে"
                  >
                    📄 প্যাডে প্রিন্ট (উপরে ৩" ফাঁকা)
                  </button>
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                  <span className="px-2 text-slate-500 font-bold text-[11px]">ফন্ট সাইজ:</span>
                  {[12, 13, 14, 15, 16].map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => updateFontSize(size)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        contentFontSize === size 
                          ? 'bg-white text-indigo-950 font-black shadow-xs' 
                          : 'text-slate-600 hover:text-slate-950'
                      }`}
                      title={size === 14 ? 'স্ট্যান্ডার্ড ফন্ট সাইজ (১৪px)' : `${size}px`}
                    >
                      {size}px{size === 14 ? ' ★' : ''}
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showWatermark}
                    onChange={(e) => setShowWatermark(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                  <span>জলছাপ (Watermark)</span>
                </label>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyNoticeText}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs transition border border-slate-200 cursor-pointer"
                >
                  <Copy size={15} /> টেক্সট কপি
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenCreateComposer(selectedNoticeForPrint)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl font-black text-xs transition border border-indigo-200 cursor-pointer"
                >
                  <Edit3 size={15} /> এডিট
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-xl transition transform active:scale-95 cursor-pointer"
                >
                  <Printer size={16} /> A4 প্রিন্ট / PDF সংরক্ষণ
                </button>
              </div>

            </div>
          </div>

          {/* Centered A4 Canvas */}
          <div className="bg-slate-200/80 p-4 sm:p-8 rounded-3xl flex justify-center overflow-x-auto print:p-0 print:bg-transparent print:rounded-none print:shadow-none print:w-full print:block">
            <div 
              style={{
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-in-out'
              }}
              className="print:transform-none print:w-full"
            >
              <SchoolPadWrapper
                settings={schoolSettings}
                mode={printMode === 'pad' ? 'preprinted' : 'full_pad'}
                refNo={selectedNoticeForPrint.refNo ? `স্মারক নং: ${selectedNoticeForPrint.refNo}` : undefined}
                date={formatDate(selectedNoticeForPrint.publishedAt)}
                title="বিজ্ঞপ্তি / নোটিশ"
                hideHeaderActions={true}
                signatures={[
                  {
                    title: selectedNoticeForPrint.publisherName || schoolSettings.principalName || 'মোহাম্মদ রফিকুল ইসলাম',
                    subtitle: `${selectedNoticeForPrint.publisherRole || schoolSettings.principalTitle || 'প্রধান শিক্ষক'}, ${schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}`,
                    rightAligned: true
                  }
                ]}
              >
                <div className="space-y-4">
                  {/* Notice Subject / Headline */}
                  <h3 className="text-base sm:text-lg font-black text-slate-950 text-center font-serif leading-snug">
                    {selectedNoticeForPrint.title}
                  </h3>

                  {/* Notice Body */}
                  <div 
                    className="text-slate-950 text-justify whitespace-pre-line leading-relaxed font-normal py-2"
                    style={{ fontSize: `${contentFontSize}px`, lineHeight: 1.85 }}
                  >
                    {selectedNoticeForPrint.content}
                  </div>

                  {/* Onulipi / Copy to */}
                  <div className="pt-4 text-[10.5px] text-slate-700 space-y-0.5 font-normal">
                    <p className="font-bold text-slate-900 underline">অনুলিপি (সদয় অবগতির জন্য প্রেরিত হলো):</p>
                    <p>১. নোটিশ বোর্ড / প্রাতিষ্ঠানিক ডিজিটাল পোর্টাল</p>
                    <p>২. শিক্ষক মিলনায়তন ও সংশ্লিষ্ট বিভাগ</p>
                    <p>৩. অফিস সংরক্ষণ নথি</p>
                  </div>
                </div>
              </SchoolPadWrapper>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 4. 👁️ QUICK VIEW MODAL (নোটিশ ভিউ পপআপ)                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {viewingNoticeModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 animate-in fade-in my-8 max-h-[90vh] overflow-y-auto border border-slate-100">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                  <Eye size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{viewingNoticeModal.refNo || 'বউবি/নোটিশ'}</span>
                    {getCategoryBadge(viewingNoticeModal.category)}
                    {getTargetAudienceBadge(viewingNoticeModal.targetAudience)}
                  </div>
                  <h3 className="text-base font-black text-slate-950 mt-0.5">নোটিশ প্রিভিউ ও বিবরণ</h3>
                </div>
              </div>

              <button
                onClick={() => setViewingNoticeModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 border-b border-slate-200 pb-2">
                <span>স্মারক: <strong className="text-slate-900 font-mono">{viewingNoticeModal.refNo || 'N/A'}</strong></span>
                <span>প্রকাশ: <strong className="text-slate-900">{formatDate(viewingNoticeModal.publishedAt)}</strong></span>
              </div>

              <div>
                <h4 className="text-base font-black text-slate-900 leading-snug">
                  {viewingNoticeModal.title}
                </h4>
              </div>

              <div className="text-[14px] text-slate-900 leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                {viewingNoticeModal.content}
              </div>

              <div className="flex justify-between items-end pt-2 text-xs">
                <div className="text-slate-500 text-[11px]">
                  <span>উদ্দিষ্ট প্রাপক: </span>
                  <strong className="text-slate-800">{getTargetAudienceBadge(viewingNoticeModal.targetAudience)}</strong>
                </div>
                <div className="text-right">
                  <strong className="text-xs font-black text-slate-950 block">{viewingNoticeModal.publisherName || schoolSettings.principalName}</strong>
                  <span className="text-[11px] text-indigo-700 font-bold">{viewingNoticeModal.publisherRole || 'প্রধান শিক্ষক'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingNoticeModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    const n = viewingNoticeModal;
                    setViewingNoticeModal(null);
                    handleOpenCreateComposer(n);
                  }}
                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 size={14} /> এডিট করুন
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    const n = viewingNoticeModal;
                    setViewingNoticeModal(null);
                    handleOpenPrintPreview(n);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={15} /> A4 প্যাডে প্রিন্ট করুন
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 🖨️ BLANK SCHOOL PAD MODAL */}
      {showBlankPadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 print:p-0 print:bg-white print:relative print:z-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-0 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <div>
                <h3 className="font-black text-slate-950 text-base flex items-center gap-2">
                  <Printer className="text-emerald-600" size={18} />
                  ফাঁকা স্কুল প্যাড প্রিন্ট প্রিভিউ (Blank School Letterhead)
                </h3>
                <p className="text-xs text-slate-500">
                  মার্জিন: উপরে {schoolSettings?.padMargins?.top ?? 0.5}&quot; | বামে {schoolSettings?.padMargins?.left ?? 0.5}&quot; | ডানে {schoolSettings?.padMargins?.right ?? 0.5}&quot; | নিচে {schoolSettings?.padMargins?.bottom ?? 0.5}&quot;
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={15} /> প্রিন্ট করুন (A4)
                </button>
                <button
                  type="button"
                  onClick={() => setShowBlankPadModal(false)}
                  className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="py-2">
              <SchoolPadWrapper
                settings={schoolSettings}
                mode="blank_pad"
                title=""
                hideHeaderActions={true}
                signatures={[
                  { title: 'প্রধান শিক্ষক', subtitle: schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়', rightAligned: true }
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// NOTICE CARD SUB-COMPONENT (FOR CARD VIEW)
// ═══════════════════════════════════════════
interface NoticeCardProps {
  notice: Notice;
  isAdmin?: boolean;
  onPin: (id: string, e?: React.MouseEvent) => void;
  onPrint: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: (id: string, title: string, e?: React.MouseEvent) => void;
  getCategoryBadge: (cat: Notice['category']) => React.ReactNode;
  getTargetAudienceBadge: (aud: Notice['targetAudience']) => React.ReactNode;
  formatDate: (iso: string) => string;
}

function NoticeCard({
  notice,
  isAdmin,
  onPin,
  onPrint,
  onView,
  onEdit,
  onDelete,
  getCategoryBadge,
  getTargetAudienceBadge,
  formatDate
}: NoticeCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-white rounded-3xl border transition-all duration-200 shadow-sm hover:shadow-md p-5 sm:p-6 space-y-4 print:hidden ${
      notice.isPinned ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/10' : 'border-slate-200'
    }`}>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {notice.isPinned && (
            <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 rounded-full font-black text-[10px] uppercase flex items-center gap-1 shadow-sm">
              <Pin size={12} className="fill-slate-950" /> Pinned Notice
            </span>
          )}
          {getCategoryBadge(notice.category)}
          {getTargetAudienceBadge(notice.targetAudience)}

          {notice.priority === 'urgent' && (
            <span className="px-2 py-0.5 bg-rose-600 text-white rounded-md text-[10px] font-black animate-pulse flex items-center gap-1">
              🚨 জরুরি
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 font-bold">
          {notice.refNo && <span className="hidden sm:inline bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{notice.refNo}</span>}
          <span className="flex items-center gap-1"><Calendar size={13} /> {formatDate(notice.publishedAt)}</span>
        </div>
      </div>

      <div>
        <h3 
          onClick={onView}
          className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug hover:text-indigo-600 transition cursor-pointer"
        >
          {notice.title}
        </h3>
      </div>

      <div className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-line bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
        {expanded ? notice.content : (
          notice.content.length > 220 ? `${notice.content.substring(0, 220)}...` : notice.content
        )}
        {notice.content.length > 220 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-indigo-600 hover:text-indigo-800 font-bold ml-2 underline inline-block cursor-pointer"
          >
            {expanded ? 'সংক্ষিপ্ত করুন' : 'আরও পড়ুন...'}
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
        
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-black text-xs shadow">
            ম
          </div>
          <div>
            <strong className="font-extrabold text-slate-900 block leading-tight">{notice.publisherName}</strong>
            <span className="text-[10px] text-indigo-600 font-bold">{notice.publisherRole}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
          <button
            onClick={onView}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="নোটিশটি বিস্তারিত দেখুন"
          >
            <Eye size={13} /> বিস্তারিত ভিউ
          </button>

          {isAdmin && (
            <button
              onClick={onPrint}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
              title="অফিসিয়াল ই-প্যাডে দেখুন ও প্রিন্ট করুন"
            >
              <Printer size={13} /> প্রিন্ট
            </button>
          )}

          {isAdmin && (
            <>
              <button
                onClick={onEdit}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                title="এডিট করুন"
              >
                <Edit3 size={14} />
              </button>

              <button
                onClick={(e) => onDelete(notice.id, notice.title, e)}
                className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl font-bold transition cursor-pointer"
                title="মুছে ফেলুন"
              >
                <Trash2 size={14} />
              </button>

              <button
                onClick={(e) => onPin(notice.id, e)}
                className={`p-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ${
                  notice.isPinned ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={notice.isPinned ? 'আনপিন করুন' : 'পিন করুন'}
              >
                <Pin size={14} className={notice.isPinned ? 'fill-amber-900' : ''} />
              </button>
            </>
          )}
        </div>

      </div>

    </div>
  );
}
