'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Edit3,
  Eye,
  FileText,
  LayoutGrid,
  List,
  Pin,
  PlusCircle,
  Printer,
  Search,
  Square,
  Trash2,
} from 'lucide-react';
import { confirmDialog } from '@/components/ui/ToastProvider';
import { noticeService, Notice } from '@/services/noticeService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { financeService } from '@/services/financeService';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import {
  ClassFeeItem,
  extractSubjectCore,
  FeeSector,
  formatNoticeDate,
  generateClassFeeString,
  getCategoryBadge,
  getTargetAudienceBadge,
  NoticeCard,
  NoticeTemplate,
} from '@/components/notices/noticeHelpers';
import NoticeComposerStudio from '@/components/notices/NoticeComposerStudio';
import NoticePrintSheetView from '@/components/notices/NoticePrintSheetView';
import { BlankPadModal, NoticeQuickViewModal } from '@/components/notices/NoticeModals';

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

  const [activeView, setActiveView] = useState<'list' | 'compose' | 'preview'>('list');
  const [listLayout, setListLayout] = useState<'table' | 'cards'>('table');
  const [selectedNoticeForPrint, setSelectedNoticeForPrint] = useState<Notice | null>(null);
  const [selectedNoticeIds, setSelectedNoticeIds] = useState<string[]>([]);
  const [viewingNoticeModal, setViewingNoticeModal] = useState<Notice | null>(null);
  const [showBlankPadModal, setShowBlankPadModal] = useState<boolean>(false);

  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Print Settings State
  const [printMode, setPrintMode] = useState<'full' | 'pad'>('full');
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [previewZoom] = useState<number>(100);
  const [contentFontSize, setContentFontSize] = useState<number>(14);

  // Pad Style Preferences
  const [schoolNameColor, setSchoolNameColor] = useState<string>('#0f172a');
  const [topLineColor, setTopLineColor] = useState<string>('#dc2626');
  const [bottomLineColor, setBottomLineColor] = useState<string>('#1d4ed8');
  const [logoLeftOffset, setLogoLeftOffset] = useState<number>(60);
  const [signatureTopGap, setSignatureTopGap] = useState<number>(32);

  // Form States
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
  const [selectedFeeSector, setSelectedFeeSector] = useState<FeeSector>('exam');

  const [classFees, setClassFees] = useState<ClassFeeItem[]>([
    { className: '৬ষ্ঠ শ্রেণি', examFee: '৩০০' },
    { className: '৭ম শ্রেণি', examFee: '৩৫০' },
    { className: '৮ম শ্রেণি', examFee: '৪০০' },
    { className: '৯ম শ্রেণি', examFee: '৫০০' },
    { className: '১০ম শ্রেণি', examFee: '৬০০' },
  ]);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const saveClassFeesToStorage = (newFees: ClassFeeItem[]) => {
    setClassFees(newFees);
    try {
      localStorage.setItem('sms_notice_class_fees', JSON.stringify(newFees));
    } catch {}
  };

  const loadFeesForSector = (sector: FeeSector): ClassFeeItem[] => {
    setSelectedFeeSector(sector);
    const financeItems = financeService.getClassFeesByType(sector);
    const mapped = financeItems.map((item) => ({
      className: item.className,
      examFee: String(item.amount),
    }));
    setClassFees(mapped);
    saveClassFeesToStorage(mapped);
    return mapped;
  };

  const loadNotices = () => {
    setNotices(noticeService.getNotices());
  };

  useEffect(() => {
    setMounted(true);
    setSession(teacherAuthService.getSession());
    setSchoolSettings(settingsService.getSettings());
    loadNotices();

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
      if (savedGap) setSignatureTopGap(Number(savedGap));
      const savedLogoOffset = localStorage.getItem('sms_notice_logo_offset');
      if (savedLogoOffset) setLogoLeftOffset(Number(savedLogoOffset));
      const savedFontSize = localStorage.getItem('sms_notice_font_size');
      if (savedFontSize) setContentFontSize(Number(savedFontSize));
    } catch {}

    try {
      const financeItems = financeService.getClassFeesByType(selectedFeeSector);
      if (financeItems && financeItems.length > 0) {
        setClassFees(financeItems.map((f) => ({ className: f.className, examFee: String(f.amount) })));
      }
    } catch {}

    const unsubSettings = settingsService.subscribe((s) => setSchoolSettings(s));
    const unsubNotices = noticeService.subscribe(loadNotices);
    const unsubFinance = financeService.subscribe(() => {
      const updated = financeService.getClassFeesByType(selectedFeeSector);
      if (updated && updated.length > 0) {
        setClassFees(updated.map((f) => ({ className: f.className, examFee: String(f.amount) })));
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
    } catch {}
  };

  const saveColorsToStorage = (newNameColor: string, newTopColor: string, newBottomColor: string) => {
    setSchoolNameColor(newNameColor);
    setTopLineColor(newTopColor);
    setBottomLineColor(newBottomColor);
    try {
      localStorage.setItem(
        'sms_notice_header_colors',
        JSON.stringify({
          schoolNameColor: newNameColor,
          topLineColor: newTopColor,
          bottomLineColor: newBottomColor,
        })
      );
    } catch {}
  };

  const updateLogoOffset = (offset: number) => {
    const clamped = Math.max(0, Math.min(160, offset));
    setLogoLeftOffset(clamped);
    try {
      localStorage.setItem('sms_notice_logo_offset', String(clamped));
    } catch {}
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!autoSyncTitle || !newTitle.trim()) return;

    const coreSubject = extractSubjectCore(newTitle);
    if (!content.trim() || content.includes('এতদ্দ্বারা') || content.includes('উপলক্ষে')) {
      const feeBlock =
        newTitle.includes('পরীক্ষা') || newTitle.includes('বেতন') || newTitle.includes('ফি') || category === 'exam'
          ? `\n\nশ্রেণি ভিত্তিক পরীক্ষার ফি এর নির্ধারিত তালিকা:\n${generateClassFeeString(classFees)}\n`
          : '';

      if (category === 'holiday' || newTitle.includes('ছুটি') || newTitle.includes('বন্ধ') || newTitle.includes('পূজা') || newTitle.includes('ঈদ')) {
        setContent(
          `এতদ্দ্বারা বিদ্যালয়ের সকল সম্মানিত শিক্ষক, কর্মচারী, অভিভাবক ও শিক্ষার্থীদের অবগতির জন্য জানানো যাচ্ছে যে, ${coreSubject} উপলক্ষে আগামী ... তারিখ হতে ... তারিখ পর্যন্ত বিদ্যালয়ের সকল একাডেমিক ও প্রশাসনিক কার্যক্রম বন্ধ থাকবে।\n\nছুটি শেষে পরবর্তী কার্যদিবসে যথারীতি বিদ্যালয়ের নিয়মিত শ্রেণি কার্যক্রম চালু হবে।`
        );
      } else if (category === 'exam' || newTitle.includes('পরীক্ষা') || newTitle.includes('বেতন') || newTitle.includes('ফি')) {
        setContent(
          `এতদ্দ্বারা সকল শিক্ষার্থী ও সম্মানিত অভিভাবকদের অবগতির জন্য জানানো যাচ্ছে যে, ${coreSubject} আগামী ... তারিখ হতে শুরু হবে।${feeBlock}\n১. আগামী ... তারিখের মধ্যে সকল বকেয়া বেতন ও উপরোক্ত পরীক্ষার ফি পরিশোধ করে প্রবেশপত্র সংগ্রহ করতে হবে।\n২. প্রবেশপত্র ব্যতীত পরীক্ষায় অংশগ্রহণ করা যাবে না।\n৩. পরীক্ষা শুরুর ১৫ মিনিট পূর্বে নিজ নিজ আসনে উপস্থিত থাকতে হবে।`
        );
      } else {
        setContent(
          `এতদ্দ্বারা বিদ্যালয়ের সকল সম্মানিত শিক্ষক, কর্মচারী, অভিভাবক ও শিক্ষার্থীদের অবগতির জন্য জানানো যাচ্ছে যে, ${coreSubject} সংক্রান্ত প্রয়োজনীয় কার্যক্রম আগামী ... তারিখ হতে গ্রহণ করা হবে।\n\nসংশ্লিষ্ট সকলকে নির্ধারিত নিয়ম ও সময়সূচি অনুযায়ী কার্যক্রম সম্পন্ন করার জন্য অনুরোধ করা হলো।`
        );
      }
    }
  };

  const handleUpdateClassFee = (index: number, fee: string) => {
    const updated = [...classFees];
    updated[index].examFee = fee;
    saveClassFeesToStorage(updated);
  };

  const handleInsertClassFees = () => {
    const feeText = `\n\nশ্রেণি ভিত্তিক পরীক্ষার ফি ও নির্ধারিত হারের বিবরণ:\n${generateClassFeeString(classFees)}`;
    setContent((prev) => prev.trim() + feeText);
    showAlert('success', 'শ্রেণি ভিত্তিক পরীক্ষার ফি তালিকা নোটিশে সফলভাবে যোগ করা হয়েছে!');
  };

  const handleInsertSnippet = (snippetType: string) => {
    const core = extractSubjectCore(title) || 'উক্ত কার্যক্রম';
    if (snippetType === 'standard_preamble') {
      const preamble = `এতদ্দ্বারা বিদ্যালয়ের সকল সম্মানিত শিক্ষক, কর্মচারী, অভিভাবক ও শিক্ষার্থীদের অবগতির জন্য জানানো যাচ্ছে যে, ${core} সংক্রান্ত সিদ্ধান্ত গৃহীত হয়েছে।`;
      setContent(preamble + (content ? '\n\n' + content : ''));
      return;
    }

    const snippets: Record<string, string> = {
      class_fees: `\n\nশ্রেণি ভিত্তিক পরীক্ষার ফি তালিকা:\n${generateClassFeeString(classFees)}`,
      exam_rules:
        `\n\nপরীক্ষা সংক্রান্ত জরুরি নির্দেশনাবলী:\n১. পরীক্ষা শুরুর অন্তত ১৫ মিনিট পূর্বে নির্ধারিত আসনে উপস্থিত হতে হবে।\n২. পরীক্ষার হলে প্রবেশপত্র (Admit Card) সাথে রাখা বাধ্যতামূলক।\n৩. কোনো প্রকার অসদুপায় বা ডিজিটাল ডিভাইস আনা সম্পূর্ণ নিষিদ্ধ।`,
      fee_due_rules:
        `\n\nফি পরিশোধ ও প্রবেশপত্র সংক্রান্ত:\n• আগামী ১০ তারিখের মধ্যে চলতি শিক্ষাবর্ষের সকল বকেয়া বেতন ও ফি হিসাব শাখায় জমা দিতে হবে।\n• ফি পরিশোধের মূল রসিদ প্রদর্শন করে শ্রেণি শিক্ষকের নিকট হতে প্রবেশপত্র গ্রহণ করতে হবে।`,
      registration_rules:
        `\n\nরেজিস্ট্রেশন ও ফরম পূরণ শর্তাবলী:\n১. নির্ধারিত সময়ের মধ্যে ফরম পূরণের যাবতীয় ফি হিসাব শাখায় জমা দিতে হবে।\n২. পাসপোর্ট সাইজের ২ কপি ছবি ও পূর্ববর্তী পরীক্ষার মূল নম্বরপত্র জমা দিতে হবে।\n৩. বিলম্ব ফি এড়ানোর জন্য শেষ তারিখের পূর্বেই কার্যক্রম সম্পন্ন করতে হবে।`,
      holiday_dates:
        `\n\nছুটি ও খোলার তারিখ:\n• আগামী ১০ তারিখ হতে ২০ তারিখ পর্যন্ত শ্রেণি পাঠদান বন্ধ থাকবে।\n• আগামী ২১ তারিখ শনিবার হতে যথারীতি বিদ্যালয় খোলা থাকবে।`,
    };

    const textToInsert = snippets[snippetType] || '';
    if (textToInsert) {
      setContent((prev) => prev.trim() + textToInsert);
      showAlert('success', 'পয়েন্ট সফলভাবে নোটিশের বর্ণনায় যোগ করা হয়েছে!');
    }
  };

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
      setContent(
        `এতদ্দ্বারা ৬ষ্ঠ হতে ১০ম শ্রেণির সকল শিক্ষার্থী ও সম্মানিত অভিভাবকদের অবগতির জন্য জানানো যাচ্ছে যে, আগামী ২৫ এপ্রিল ২০২৬ তারিখ হতে অর্ধবার্ষিক পরীক্ষা অনুষ্ঠিত হবে। \n\nপরীক্ষায় অংশগ্রহণের জন্য শ্রেণি ভিত্তিক নির্ধারিত পরীক্ষার ফি ও যাবতীয় বকেয়া বেতন পরিশোধের তালিকা নিম্নরূপ:\n${generateClassFeeString(classFees)}\n\nপরীক্ষা সংক্রান্ত প্রয়োজনীয় নির্দেশনাবলী:\n১. আগামী ১০ এপ্রিল ২০২৬ তারিখের মধ্যে চলতি শিক্ষাবর্ষের সকল বকেয়া বেতন ও উপরোক্ত নির্ধারিত পরীক্ষার ফি বিদ্যালয়ের হিসাব শাখায় জমা প্রদান করতে হবে।\n২. ফি পরিশোধের রসিদ প্রদর্শনপূর্বক শ্রেণি শিক্ষকের নিকট হতে পরীক্ষার প্রবেশপত্র (Admit Card) সংগ্রহ করতে হবে।\n৩. প্রবেশপত্র ব্যতীত কোনো শিক্ষার্থীকে পরীক্ষার হলে প্রবেশের অনুমতি দেওয়া হবে না।\n৪. প্রতিদিন পরীক্ষা শুরুর অন্তত ১৫ মিনিট পূর্বে নিজ নিজ নির্ধারিত আসনে উপস্থিত থাকতে হবে।`
      );
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

  const handleApplyTemplate = (tmpl: NoticeTemplate) => {
    let activeFees = classFees;
    if (tmpl.feeSector) {
      activeFees = loadFeesForSector(tmpl.feeSector);
    }
    setTitle(tmpl.title);
    setContent(tmpl.getContent(activeFees));
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
      showAlert('error', 'নোটিশের শিরোনাম ও বিস্তারিত বিবরণ প্রদান করুন!');
      return;
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
      isPinned,
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

  const handleDeleteNotice = async (id: string, noticeTitle: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin) {
      showAlert('error', 'সহকারী শিক্ষকদের নোটিশ মুছে ফেলার অনুমতি নেই। এটি শুধুমাত্র প্রধান শিক্ষক/অ্যাডমিনের জন্য সংরক্ষিত।');
      return;
    }
    if (
      await confirmDialog({
        title: 'নোটিশ মুছে ফেলা',
        message: `আপনি কি নিশ্চিতভাবে '${noticeTitle}' নোটিশটি মুছে ফেলতে চান?`,
        confirmLabel: 'মুছে ফেলুন',
        danger: true,
      })
    ) {
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

  const handleClearAllNotices = async () => {
    if (!isAdmin) {
      showAlert('error', 'সহকারী শিক্ষকদের নোটিশ মুছে ফেলার অনুমতি নেই।');
      return;
    }
    if (
      await confirmDialog({
        title: 'সকল নোটিশ মুছে ফেলা',
        message: 'আপনি কি নিশ্চিতভাবে সকল নোটিশ স্থায়ীভাবে মুছে ফেলতে চান?',
        confirmLabel: 'সব মুছে ফেলুন',
        danger: true,
      })
    ) {
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
      setViewingNoticeModal(notice);
      return;
    }
    setSelectedNoticeForPrint(notice);
    setActiveView('preview');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCopyNoticeText = () => {
    const activeNotice = selectedNoticeForPrint || {
      title,
      content,
      refNo,
      publishedAt: publishedDate,
      publisherName,
      publisherRole,
    };

    const text = `${schoolSettings.schoolName || 'শিক্ষা প্রতিষ্ঠান'}\n${schoolSettings.address || ''}\nEIIN: ${schoolSettings.eiin || '—'}${schoolSettings.estdYear ? ` , স্থাপিত: ${schoolSettings.estdYear} খ্রি.` : ''}\nমোবাইল নম্বর: ${schoolSettings.phone || '—'}\n\nস্মারক নং: ${activeNotice.refNo || ''}   তারিখ: ${formatNoticeDate(activeNotice.publishedAt)}\n\nবিজ্ঞপ্তি / নোটিশ\n\n${activeNotice.content}\n\n${activeNotice.publisherName || schoolSettings.principalName || '—'}\n${activeNotice.publisherRole || schoolSettings.principalTitle || 'প্রধান শিক্ষক'}\n${schoolSettings.schoolName || 'শিক্ষা প্রতিষ্ঠান'}`;
    navigator.clipboard.writeText(text);
    showAlert('success', 'নোটিশের পূর্ণাঙ্গ টেক্সট ক্লিপবোর্ডে কপি করা হয়েছে!');
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: notices.length,
      exam: 0,
      holiday: 0,
      academic: 0,
      events: 0,
      emergency: 0,
    };
    notices.forEach((n) => {
      if (counts[n.category] !== undefined) counts[n.category]++;
    });
    return counts;
  }, [notices]);

  const filteredNotices = notices.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.refNo && n.refNo.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || n.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || n.priority === selectedPriority;
    const matchesTarget = selectedTarget === 'all' || n.targetAudience === selectedTarget;
    return matchesSearch && matchesCategory && matchesPriority && matchesTarget;
  });

  const handleSelectAll = () => {
    if (selectedNoticeIds.length === filteredNotices.length) {
      setSelectedNoticeIds([]);
    } else {
      setSelectedNoticeIds(filteredNotices.map((n) => n.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedNoticeIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleBulkDelete = async () => {
    if (!isAdmin) {
      showAlert('error', 'সহকারী শিক্ষকদের নোটিশ মুছে ফেলার অনুমতি নেই।');
      return;
    }
    if (!selectedNoticeIds.length) return;
    if (
      await confirmDialog({
        title: 'নির্বাচিত নোটিশ মুছে ফেলা',
        message: `আপনি কি নির্বাচিত ${selectedNoticeIds.length} টি নোটিশ মুছে ফেলতে চান?`,
        confirmLabel: 'মুছে ফেলুন',
        danger: true,
      })
    ) {
      selectedNoticeIds.forEach((id) => noticeService.deleteNotice(id));
      setSelectedNoticeIds([]);
      loadNotices();
      showAlert('success', 'নির্বাচিত নোটিশগুলো সফলভাবে মুছে ফেলা হয়েছে!');
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 font-sans text-slate-900 dark:text-white">
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

      {!mounted && (
        <div className="p-12 text-center font-bold text-slate-400">নোটিশ বোর্ড লোড হচ্ছে...</div>
      )}

      {/* 1. MAIN LIST VIEW */}
      {mounted && activeView === 'list' && (
        <>
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
                  className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Trash2 size={14} /> সকল নোটিশ মুছুন
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowBlankPadModal(true)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                  <span>মোট প্রকাশিত নোটিশ</span>
                  <FileText size={14} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <strong className="text-2xl font-black text-slate-900 dark:text-white block mt-1">
                  {notices.length} <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-normal">টি</span>
                </strong>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800/60 shadow-xs">
                <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                  <span>পিনকৃত গুরুত্বপূর্ণ</span>
                  <Pin size={14} className="text-amber-500 fill-amber-500" />
                </div>
                <strong className="text-2xl font-black text-amber-900 dark:text-amber-200 block mt-1">
                  {notices.filter((n) => n.isPinned).length}{' '}
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300 font-normal">টি</span>
                </strong>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-800/60 shadow-xs">
                <div className="flex items-center justify-between text-rose-700 dark:text-rose-300 text-[11px] font-bold">
                  <span>জরুরি নির্দেশিকা</span>
                  <AlertTriangle size={14} className="text-rose-500" />
                </div>
                <strong className="text-2xl font-black text-rose-900 dark:text-rose-200 block mt-1">
                  {notices.filter((n) => n.priority === 'urgent').length}{' '}
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-300 font-normal">টি</span>
                </strong>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                  <span>জারিকারক কর্মকর্তা</span>
                  <Award size={14} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <strong className="text-xs font-black text-emerald-950 dark:text-emerald-200 truncate block mt-2">
                  {schoolSettings.principalName || 'মোহাম্মদ রফিকুল ইসলাম'}
                </strong>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium block">
                  {schoolSettings.principalTitle || 'প্রধান শিক্ষক'}
                </span>
              </div>
            </div>
          </div>

          {alertMsg && (
            <div
              className={`p-4 rounded-2xl font-bold text-xs flex items-center justify-between border shadow-sm print:hidden animate-in fade-in ${
                alertMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                {alertMsg.type === 'success' ? (
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400" />
                )}
                <span>{alertMsg.text}</span>
              </div>
              <button onClick={() => setAlertMsg(null)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">
                ✕
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden space-y-3.5">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="নোটিশের শিরোনাম, স্মারক নম্বর বা বিবরণ দিয়ে তাৎক্ষণিক খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition"
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
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">সকল অগ্রাধিকার</option>
                  <option value="urgent">🚨 শুধু জরুরি</option>
                  <option value="important">⭐ গুরুত্বপূর্ণ</option>
                  <option value="normal">সাধারণ</option>
                </select>

                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">সকল প্রাপক</option>
                  <option value="students">🎓 শিক্ষার্থী</option>
                  <option value="teachers">👨‍🏫 শিক্ষকবৃন্দ</option>
                  <option value="parents">👨‍👩‍👧‍👦 অভিভাবক</option>
                </select>

                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setListLayout('table')}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      listLayout === 'table'
                        ? 'bg-white dark:bg-slate-900 text-indigo-900 dark:text-indigo-200 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                    title="তালিকা ভিউ (Table View)"
                  >
                    <List size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setListLayout('cards')}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      listLayout === 'cards'
                        ? 'bg-white dark:bg-slate-900 text-indigo-900 dark:text-indigo-200 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                    title="কার্ড ভিউ (Card View)"
                  >
                    <LayoutGrid size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100 dark:border-slate-800">
              {[
                { key: 'all', label: 'সকল নোটিশ', count: categoryCounts.all },
                { key: 'exam', label: 'পরীক্ষা', count: categoryCounts.exam },
                { key: 'holiday', label: 'ছুটি', count: categoryCounts.holiday },
                { key: 'academic', label: 'একাডেমিক', count: categoryCounts.academic },
                { key: 'events', label: 'অনুষ্ঠান / সভা', count: categoryCounts.events },
                { key: 'emergency', label: 'জরুরি', count: categoryCounts.emergency },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => setSelectedCategory(c.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === c.key
                      ? 'bg-slate-900 text-white shadow-sm font-black'
                      : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span>{c.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      selectedCategory === c.key
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {c.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Table or Card View */}
          {listLayout === 'table' ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:hidden space-y-0">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">প্রকাশিত নোটিশ রেজিস্টার</h3>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      মোট {filteredNotices.length} টি নোটিশ প্রদর্শিত হচ্ছে
                    </span>
                  </div>
                </div>

                {selectedNoticeIds.length > 0 && (
                  <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 animate-in fade-in">
                    <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">
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
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
                    📢
                  </div>
                  <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">কোনো নোটিশ পাওয়া যায়নি</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    আপনার নির্বাচিত ফিল্টার বা সার্চে কোনো নোটিশ মেলেনি। নতুন নোটিশ তৈরি করতে ওপরের বাটনে ক্লিক করুন।
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-800 dark:text-slate-100 border-collapse">
                    <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[11px] border-b border-slate-200 dark:border-slate-800 select-none">
                      <tr>
                        <th className="py-3.5 px-4 w-12 text-center">
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={handleSelectAll}
                              className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 cursor-pointer"
                              title="সকল সিলেক্ট করুন"
                            >
                              {selectedNoticeIds.length === filteredNotices.length && filteredNotices.length > 0 ? (
                                <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
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

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredNotices.map((notice, idx) => {
                        const isSelected = selectedNoticeIds.includes(notice.id);

                        return (
                          <tr
                            key={notice.id}
                            className={`group transition-colors duration-150 ${
                              isSelected
                                ? 'bg-indigo-50/50 dark:bg-indigo-950/50'
                                : notice.isPinned
                                  ? 'bg-amber-50/30 dark:bg-amber-950/50 hover:bg-amber-50/60 dark:hover:bg-amber-950/50'
                                  : idx % 2 === 0
                                    ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800'
                                    : 'bg-slate-50/30 hover:bg-slate-50/80 dark:hover:bg-slate-800'
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
                                      <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
                                    ) : (
                                      <Square size={16} />
                                    )}
                                  </button>
                                )}

                                <span className="font-mono font-bold text-slate-400 text-xs">{idx + 1}</span>

                                {notice.isPinned && (
                                  <span title="পিনকৃত গুরুত্বপূর্ণ নোটিশ">
                                    <Pin size={13} className="fill-amber-500 text-amber-500" />
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-4 align-middle whitespace-nowrap">
                              <div className="space-y-1">
                                <span className="font-mono font-extrabold text-[11px] text-indigo-900 dark:text-indigo-200 bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/60 px-2 py-0.5 rounded-md inline-block">
                                  {notice.refNo || 'বউবি/নোটিশ/২০২৬'}
                                </span>
                                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <Calendar size={12} className="text-slate-400" />
                                  <span>{formatNoticeDate(notice.publishedAt)}</span>
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
                                  onClick={() => setViewingNoticeModal(notice)}
                                  className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors leading-snug cursor-pointer"
                                >
                                  {notice.title}
                                </h4>

                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed font-normal">
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
                                  <strong className="text-xs font-black text-slate-900 dark:text-white block truncate max-w-[130px]">
                                    {notice.publisherName || schoolSettings.principalName || 'মোহাম্মদ রফিকুল ইসলাম'}
                                  </strong>
                                  <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold">
                                    {notice.publisherRole || 'প্রধান শিক্ষক'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-6 align-middle text-right whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setViewingNoticeModal(notice)}
                                  className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800/60 hover:border-indigo-600 cursor-pointer shadow-2xs active:scale-95"
                                  title="নোটিশটি বিস্তারিত দেখুন ও পড়ুন"
                                >
                                  <Eye size={14} /> বিস্তারিত পড়ুন
                                </button>

                                {isAdmin && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPrintPreview(notice)}
                                      className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-600 cursor-pointer shadow-2xs active:scale-95"
                                      title="অফিসিয়াল A4 প্যাডে প্রিন্ট বা PDF সংরক্ষণ"
                                    >
                                      <Printer size={14} /> প্রিন্ট
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenCreateComposer(notice)}
                                      className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-400 text-amber-900 dark:text-amber-200 hover:text-slate-950 dark:hover:text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1 border border-amber-200 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-700 cursor-pointer shadow-2xs active:scale-95"
                                      title="নোটিশ সম্পাদনা করুন (ইন-পেইজ স্টুডিও)"
                                    >
                                      <Edit3 size={14} /> এডিট
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteNotice(notice.id, notice.title, e)}
                                      className="p-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center border border-rose-200 dark:border-rose-800/60 hover:border-rose-600 cursor-pointer shadow-2xs active:scale-95"
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
                                          : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
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
                {filteredNotices.map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    isAdmin={isAdmin}
                    onPin={handleTogglePin}
                    onPrint={() => handleOpenPrintPreview(notice)}
                    onView={() => setViewingNoticeModal(notice)}
                    onEdit={() => handleOpenCreateComposer(notice)}
                    onDelete={handleDeleteNotice}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 2. IN-PAGE NOTICE COMPOSER STUDIO */}
      {mounted && activeView === 'compose' && (
        <NoticeComposerStudio
          editingNotice={editingNotice}
          schoolSettings={schoolSettings}
          title={title}
          content={content}
          setContent={setContent}
          category={category}
          setCategory={setCategory}
          priority={priority}
          setPriority={setPriority}
          targetAudience={targetAudience}
          setTargetAudience={setTargetAudience}
          publisherName={publisherName}
          setPublisherName={setPublisherName}
          publisherRole={publisherRole}
          setPublisherRole={setPublisherRole}
          refNo={refNo}
          setRefNo={setRefNo}
          publishedDate={publishedDate}
          setPublishedDate={setPublishedDate}
          isPinned={isPinned}
          setIsPinned={setIsPinned}
          autoSyncTitle={autoSyncTitle}
          setAutoSyncTitle={setAutoSyncTitle}
          selectedFeeSector={selectedFeeSector}
          classFees={classFees}
          showWatermark={showWatermark}
          contentFontSize={contentFontSize}
          schoolNameColor={schoolNameColor}
          topLineColor={topLineColor}
          bottomLineColor={bottomLineColor}
          logoLeftOffset={logoLeftOffset}
          signatureTopGap={signatureTopGap}
          onBackToList={() => setActiveView('list')}
          onSaveColors={saveColorsToStorage}
          onUpdateLogoOffset={updateLogoOffset}
          onLoadFeesForSector={loadFeesForSector}
          onUpdateClassFee={handleUpdateClassFee}
          onInsertClassFees={handleInsertClassFees}
          onApplyTemplate={handleApplyTemplate}
          onTitleChange={handleTitleChange}
          onInsertSnippet={handleInsertSnippet}
          onSubmitNotice={handleSubmitNotice}
          onCopyNoticeText={handleCopyNoticeText}
          onOpenPrintView={() => {
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
              isPinned,
            });
            setActiveView('preview');
          }}
          onShowAlert={showAlert}
        />
      )}

      {/* 3. DEDICATED FULL-SCREEN A4 PRINT SHEET VIEW */}
      {mounted && activeView === 'preview' && selectedNoticeForPrint && (
        <NoticePrintSheetView
          notice={selectedNoticeForPrint}
          schoolSettings={schoolSettings}
          printMode={printMode}
          setPrintMode={setPrintMode}
          contentFontSize={contentFontSize}
          onUpdateFontSize={updateFontSize}
          showWatermark={showWatermark}
          setShowWatermark={setShowWatermark}
          previewZoom={previewZoom}
          onBackToList={() => setActiveView('list')}
          onCopyNoticeText={handleCopyNoticeText}
          onEditNotice={handleOpenCreateComposer}
          onPrint={() => window.print()}
        />
      )}

      {/* 4. QUICK VIEW & BLANK PAD MODALS */}
      <NoticeQuickViewModal
        notice={viewingNoticeModal}
        schoolSettings={schoolSettings}
        isAdmin={isAdmin}
        onClose={() => setViewingNoticeModal(null)}
        onEdit={handleOpenCreateComposer}
        onPrint={handleOpenPrintPreview}
      />

      <BlankPadModal
        open={showBlankPadModal}
        schoolSettings={schoolSettings}
        onClose={() => setShowBlankPadModal(false)}
      />
    </div>
  );
}
