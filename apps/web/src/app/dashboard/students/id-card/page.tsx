'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  FileDown,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Printer,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { studentService, type Student } from '@/services/studentService';
import { settingsService, type SchoolSettings } from '@/services/settingsService';
import { triggerProfessionalPrint } from '@/lib/printPdfUtils';
import { toBanglaDigits } from '@/lib/omr/omrTemplates';
import {
  BUILT_IN_ID_CARD_TEMPLATES,
  type IdCardDocLang,
  type IdCardSideMode,
  type IdCardTemplateConfig,
  createBlankCustomTemplate,
  getIdCardGradeLabel,
} from '@/lib/idCardTemplateTypes';
import {
  DEFAULT_ID_CARD_PAGE_SETTINGS,
  type IdCardPageSettings,
  type IdCardPrintScope,
  buildIdCardPrintCss,
  paginateStudentsForPrint,
  resolveTargetPageNumbers,
} from '@/lib/idCardLayoutUtils';
import {
  deleteCustomTemplate,
  estimateTemplatesByteSize,
  formatBytesReadable,
  getSavedActiveTemplateId,
  listCustomTemplates,
  parseAndValidateTemplateJson,
  saveCustomTemplate,
  serializeTemplateToJson,
  setSavedActiveTemplateId,
} from '@/lib/idCardTemplateStorage';
import { exportIdCardPageAsPng, exportIdCardPagesAsPdf } from '@/lib/idCardHighResExporter';
import { IdCardControlRail } from '@/components/students/IdCardControlRail';
import { IdCardPaginatedSheetCanvas } from '@/components/students/IdCardPaginatedSheetCanvas';
import { IdCardCustomTemplateModal } from '@/components/students/IdCardCustomTemplateModal';

const SAMPLE_PREVIEW_STUDENT: Student = {
  id: 'STU-2026-001',
  name: 'তাসনিম আহমেদ রাফি',
  nameEn: 'Tasnim Ahmed Rafi',
  roll: '01',
  grade: '9th',
  gradeBn: '৯ম শ্রেণি',
  section: 'Science',
  branch: 'Science',
  group: 'বিজ্ঞান',
  guardian: 'মোহাম্মদ আবুল কালাম',
  fatherName: 'মোহাম্মদ আবুল কালাম',
  fatherNameEn: 'Mohammad Abul Kalam',
  mobile: '01819-000000',
  bloodGroup: 'O+',
  dob: '12-03-2011',
  currentAddress: 'বরইতলী, চকরিয়া, কক্সবাজার',
};

const GRADE_ORDER = ['6th', '7th', '8th', '9th', '10th'];

export default function StudentIdCardStudioPage() {
  const [mounted, setMounted] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  // Studio UI State
  const [showLeftRail, setShowLeftRail] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [useSamplePreview, setUseSamplePreview] = useState(false);

  // Student Filters
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sessionYear, setSessionYear] = useState<string>('2026');
  const didAutoPickGradeRef = useRef(false);

  // Design & Custom Templates (Local IndexedDB only — 0 server bytes!)
  const [docLang, setDocLang] = useState<IdCardDocLang>('bn');
  const [customTemplates, setCustomTemplates] = useState<IdCardTemplateConfig[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>(BUILT_IN_ID_CARD_TEMPLATES[0].id);
  const [editingTemplate, setEditingTemplate] = useState<IdCardTemplateConfig | null>(null);

  // Page & High-Res Print Settings
  const [sideMode, setSideMode] = useState<IdCardSideMode>('both_side_by_side');
  const [pageSettings, setPageSettings] = useState<IdCardPageSettings>(DEFAULT_ID_CARD_PAGE_SETTINGS);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [printScope, setPrintScope] = useState<IdCardPrintScope>('all');
  const [pageRangeExpr, setPageRangeExpr] = useState<string>('1');

  // High-Res Ephemeral Export Progress & Toast
  const [exportProgressText, setExportProgressText] = useState<string>('');
  const [toast, setToast] = useState<{ text: string; tone: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((text: string, tone: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, tone });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  }, []);

  const refreshStudents = useCallback(() => {
    const all = studentService.getAllStudents();
    setStudents(all);
    if (!didAutoPickGradeRef.current && all.length > 0) {
      didAutoPickGradeRef.current = true;
      // Smartly select first populated class if default is 'all' with many students
      const firstPopulated = GRADE_ORDER.find((g) => all.some((s) => s.grade === g));
      if (firstPopulated) {
        setGradeFilter(firstPopulated);
      }
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    refreshStudents();
    const initialSettings = settingsService.getSettings();
    setSettings(initialSettings);
    if (initialSettings?.language === 'en') {
      setDocLang('en');
    }

    // Load locally saved custom templates (0 server storage)
    listCustomTemplates().then((saved) => {
      setCustomTemplates(saved);
      const savedId = getSavedActiveTemplateId();
      if (savedId) {
        const exists =
          BUILT_IN_ID_CARD_TEMPLATES.some((t) => t.id === savedId) ||
          saved.some((t) => t.id === savedId);
        if (exists) setActiveTemplateId(savedId);
      }
    });

    const unsubStudents = studentService.subscribe(() => refreshStudents());
    const unsubSettings = settingsService.subscribe((updated) => setSettings({ ...updated }));
    return () => {
      unsubStudents();
      unsubSettings();
    };
  }, [refreshStudents]);

  const allTemplates = useMemo(
    () => [...BUILT_IN_ID_CARD_TEMPLATES, ...customTemplates],
    [customTemplates],
  );

  const activeTemplate = useMemo(
    () => allTemplates.find((t) => t.id === activeTemplateId) || BUILT_IN_ID_CARD_TEMPLATES[0],
    [allTemplates, activeTemplateId],
  );

  const localTemplateBytes = useMemo(
    () => estimateTemplatesByteSize(customTemplates),
    [customTemplates],
  );

  // Class counts for dropdown & empty-state jump pills
  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      '6th': 0,
      '7th': 0,
      '8th': 0,
      '9th': 0,
      '10th': 0,
    };
    for (const st of students) {
      if (counts[st.grade] !== undefined) counts[st.grade] += 1;
    }
    return counts;
  }, [students]);

  const populatedGrades = useMemo(
    () =>
      GRADE_ORDER.filter((g) => (gradeCounts[g] || 0) > 0).map((g) => ({
        grade: g,
        labelBn: getIdCardGradeLabel(g, 'bn'),
        count: gradeCounts[g] || 0,
      })),
    [gradeCounts],
  );

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students
      .filter((s) => {
        if (gradeFilter !== 'all' && s.grade !== gradeFilter) return false;
        const sec = (s.section || s.branch || 'A').toLowerCase();
        const grp = (s.group || '').toLowerCase();
        if (sectionFilter !== 'all') {
          const sf = sectionFilter.toLowerCase();
          const matchSec = sec === sf;
          const matchGrp =
            (sf === 'science' && (grp.includes('বিজ্ঞান') || grp.includes('science'))) ||
            (sf === 'humanities' && (grp.includes('মানবিক') || grp.includes('humanities'))) ||
            (sf === 'commerce' && (grp.includes('ব্যবসা') || grp.includes('commerce')));
          if (!matchSec && !matchGrp) return false;
        }
        if (
          q &&
          !s.name.toLowerCase().includes(q) &&
          !(s.nameEn || '').toLowerCase().includes(q) &&
          !String(s.roll).toLowerCase().includes(q) &&
          !String(s.id).toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (parseInt(a.roll || '0', 10) || 0) - (parseInt(b.roll || '0', 10) || 0));
  }, [students, gradeFilter, sectionFilter, searchQuery]);

  const targetStudents = useMemo(() => {
    const base =
      selectedIds.size === 0
        ? filteredStudents
        : filteredStudents.filter((s) => selectedIds.has(s.id));
    if (base.length === 0 && useSamplePreview) {
      return [SAMPLE_PREVIEW_STUDENT];
    }
    return base;
  }, [filteredStudents, selectedIds, useSamplePreview]);

  // Paginated Sheets Engine
  const { metrics, pages } = useMemo(
    () => paginateStudentsForPrint(targetStudents, pageSettings, sideMode),
    [targetStudents, pageSettings, sideMode],
  );

  // Clamp currentPage when pagination shrinks
  useEffect(() => {
    if (pages.length === 0) {
      setCurrentPage(1);
    } else if (currentPage > pages.length) {
      setCurrentPage(pages.length);
    }
  }, [pages.length, currentPage]);

  const targetPrintPageNumbers = useMemo(
    () => resolveTargetPageNumbers(printScope, currentPage, pageRangeExpr, pages.length),
    [printScope, currentPage, pageRangeExpr, pages.length],
  );

  const dynamicPrintCss = useMemo(() => buildIdCardPrintCss(pageSettings), [pageSettings]);

  const handleUpdatePageSettings = useCallback((patch: Partial<IdCardPageSettings>) => {
    setPageSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSelectTemplate = useCallback((tpl: IdCardTemplateConfig) => {
    setActiveTemplateId(tpl.id);
    setSavedActiveTemplateId(tpl.id);
  }, []);

  const handleSaveCustomTemplate = async (tpl: IdCardTemplateConfig) => {
    const saved = await saveCustomTemplate(tpl);
    const updatedList = await listCustomTemplates();
    setCustomTemplates(updatedList);
    setActiveTemplateId(saved.id);
    setSavedActiveTemplateId(saved.id);
    setEditingTemplate(null);
    showToast(`কাস্টম টেম্পলেট "${saved.name}" লোকালি সংরক্ষিত হয়েছে (সার্ভার স্পেস ০ KB)।`, 'success');
  };

  const handleDeleteCustomTemplate = async (id: string) => {
    await deleteCustomTemplate(id);
    const updatedList = await listCustomTemplates();
    setCustomTemplates(updatedList);
    if (activeTemplateId === id) {
      setActiveTemplateId(BUILT_IN_ID_CARD_TEMPLATES[0].id);
      setSavedActiveTemplateId(BUILT_IN_ID_CARD_TEMPLATES[0].id);
    }
    showToast('কাস্টম টেম্পলেটটি মুছে ফেলা হয়েছে।', 'info');
  };

  const handleExportTemplateJson = (tpl: IdCardTemplateConfig) => {
    const json = serializeTemplateToJson(tpl);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ID_Card_Template_${tpl.name.replace(/[^\w\u0980-\u09FF-]+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1200);
    showToast('টেম্পলেট JSON ব্যাকআপ ডাউনলোড হয়েছে (সার্ভার স্পেস ০ KB)।', 'success');
  };

  const handleImportTemplateJsonFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseAndValidateTemplateJson(text);
      const saved = await saveCustomTemplate(parsed);
      const updatedList = await listCustomTemplates();
      setCustomTemplates(updatedList);
      setActiveTemplateId(saved.id);
      setSavedActiveTemplateId(saved.id);
      showToast(`"${saved.name}" টেম্পলেট সফলভাবে ইম্পোর্ট ও প্রয়োগ হয়েছে।`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'টেম্পলেট JSON ইম্পোর্ট ব্যর্থ হয়েছে।', 'error');
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size > 0 && selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const handleVectorPrint = () => {
    if (pages.length === 0) {
      showToast('প্রিন্ট করার জন্য কোনো কার্ড নেই।', 'info');
      return;
    }
    const gradeLabel = gradeFilter === 'all' ? 'All_Classes' : gradeFilter;
    triggerProfessionalPrint([
      'Student_ID_Cards',
      gradeLabel,
      pageSettings.pageSize.toUpperCase(),
      sessionYear,
    ]);
  };

  const handleDownloadHighResPng = async () => {
    if (!settings || pages.length === 0) return;
    const activePageObj = pages[Math.max(0, Math.min(pages.length - 1, currentPage - 1))];
    if (!activePageObj) return;
    try {
      setExportProgressText(`পেইজ ${toBanglaDigits(activePageObj.pageNumber)} (${pageSettings.dpi} DPI PNG) তৈরি হচ্ছে...`);
      const fileName = `ID_Card_Sheet_P${activePageObj.pageNumber}_${pageSettings.pageSize}_${pageSettings.dpi}DPI.png`;
      const receipt = await exportIdCardPageAsPng({
        page: activePageObj,
        metrics,
        pageSettings,
        schoolSettings: settings,
        template: activeTemplate,
        docLang,
        sessionYear,
        fileName,
      });
      showToast(
        `${receipt.dpi} DPI PNG ডাউনলোড সম্পন্ন (${formatBytesReadable(receipt.fileBytes)}) — মেমরি অটো-ক্লিয়ার, সার্ভার স্পেস ০ KB।`,
        'success',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'হাই-রেস PNG তৈরি ব্যর্থ হয়েছে।', 'error');
    } finally {
      setExportProgressText('');
    }
  };

  const handleDownloadHighResPdf = async () => {
    if (!settings || pages.length === 0) return;
    const targetSet = new Set(targetPrintPageNumbers);
    const targetPages = pages.filter((p) => targetSet.has(p.pageNumber));
    if (targetPages.length === 0) return;

    try {
      const fileName = `ID_Cards_${gradeFilter}_${pageSettings.pageSize.toUpperCase()}_${pageSettings.dpi}DPI_${new Date().toISOString().slice(0, 10)}.pdf`;
      const receipt = await exportIdCardPagesAsPdf({
        pages: targetPages,
        metrics,
        pageSettings,
        schoolSettings: settings,
        template: activeTemplate,
        docLang,
        sessionYear,
        fileName,
        onProgress: (cur, tot) => {
          setExportProgressText(
            `পেইজ ${toBanglaDigits(cur)}/${toBanglaDigits(tot)} রেন্ডার হচ্ছে (${pageSettings.dpi} DPI)...`,
          );
        },
      });
      showToast(
        `${toBanglaDigits(receipt.pageCount)} পেইজ (${receipt.dpi} DPI) PDF ডাউনলোড সম্পন্ন (${formatBytesReadable(receipt.fileBytes)}) — অস্থায়ী মেমরি ক্লিয়ার, সার্ভার স্পেস ০ KB।`,
        'success',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'হাই-রেস PDF তৈরি ব্যর্থ হয়েছে।', 'error');
    } finally {
      setExportProgressText('');
    }
  };

  if (!mounted || !settings) {
    return (
      <div className="p-10 text-center text-sm font-semibold text-slate-400">
        শিক্ষার্থী আইডি কার্ড স্টুডিও লোড হচ্ছে...
      </div>
    );
  }

  const sampleStudentForModal = targetStudents[0] || SAMPLE_PREVIEW_STUDENT;

  return (
    <div className="min-h-full bg-slate-50/70 dark:bg-slate-950 print:bg-white">
      <style>{dynamicPrintCss}</style>

      {/* ─── SLIM STICKY WORKSPACE ACTION BAR (print:hidden) ─── */}
      <div className="sticky top-0 z-30 min-h-13 py-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-5 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Desktop Left Rail Toggle */}
          <button
            type="button"
            onClick={() => setShowLeftRail((v) => !v)}
            className="hidden lg:inline-flex h-8.5 w-8.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 text-slate-600 dark:text-slate-300 items-center justify-center transition cursor-pointer shrink-0"
            title={showLeftRail ? 'বাম কন্ট্রোল প্যানেল লুকান' : 'বাম কন্ট্রোল প্যানেল দেখান'}
            aria-label={showLeftRail ? 'বাম কন্ট্রোল প্যানেল লুকান' : 'বাম কন্ট্রোল প্যানেল দেখান'}
          >
            {showLeftRail ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          {/* Mobile Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="inline-flex lg:hidden h-8.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 text-xs font-bold items-center gap-1.5 cursor-pointer shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#0B5D3B]" />
            <span>ডিজাইন ও পেইজ</span>
          </button>

          <Link
            href="/dashboard/students/"
            className="hidden sm:inline-flex h-8.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 text-slate-600 dark:text-slate-300 text-xs font-bold items-center gap-1 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>শিক্ষার্থী</span>
          </Link>

          <span className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#0B5D3B] dark:text-emerald-300 text-[11px] font-extrabold">
            <ShieldCheck className="w-3.5 h-3.5" />
            সার্ভার স্পেস ০ KB · {pageSettings.dpi} DPI
          </span>

          {students.length === 0 && (
            <button
              type="button"
              onClick={() => setUseSamplePreview((v) => !v)}
              className={`h-8.5 px-2.5 rounded-xl border text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer transition ${
                useSamplePreview
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{useSamplePreview ? 'নমুনা প্রিভিউ চালু' : 'নমুনা কার্ড দেখুন'}</span>
            </button>
          )}
        </div>

        {/* Right High-Res Export & Print Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={pages.length === 0 || Boolean(exportProgressText)}
            onClick={handleDownloadHighResPng}
            className="hidden sm:inline-flex h-8.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 disabled:opacity-45 text-slate-700 dark:text-slate-200 text-xs font-bold items-center gap-1.5 transition cursor-pointer"
            title="বর্তমান পেইজটি হাই-রেজুলেশন PNG হিসেবে ডাউনলোড করুন (সার্ভারে সেভ হবে না)"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>PNG ({pageSettings.dpi} DPI)</span>
          </button>

          <button
            type="button"
            disabled={pages.length === 0 || Boolean(exportProgressText)}
            onClick={handleDownloadHighResPdf}
            className="h-8.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            title="নির্বাচিত পেইজগুলো হাই-রেজুলেশন PDF হিসেবে ডাউনলোড করুন (ডাউনলোডের পর মেমরি অটো-ক্লিয়ার)"
          >
            {exportProgressText ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span>PDF ({pageSettings.dpi} DPI)</span>
          </button>

          <button
            type="button"
            disabled={pages.length === 0}
            onClick={handleVectorPrint}
            className="h-8.5 px-3.5 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] disabled:opacity-45 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>
              প্রিন্ট ({toBanglaDigits(targetPrintPageNumbers.length)} পেইজ)
            </span>
          </button>
        </div>
      </div>

      {/* Live Ephemeral Progress / Toast Notification Banner */}
      {(exportProgressText || toast) && (
        <div className="px-3 sm:px-5 pt-2.5 max-w-[1440px] mx-auto print:hidden">
          {exportProgressText ? (
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3.5 py-2 text-xs font-extrabold text-indigo-800 dark:text-indigo-200 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{exportProgressText}</span>
            </div>
          ) : toast ? (
            <div
              className={`rounded-xl px-3.5 py-2 text-xs font-extrabold border flex items-center gap-2 ${
                toast.tone === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : toast.tone === 'info'
                    ? 'bg-slate-100 border-slate-200 text-slate-800'
                    : 'bg-emerald-50 border-emerald-200 text-[#0B5D3B]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toast.text}</span>
            </div>
          ) : null}
        </div>
      )}

      {/* ─── SPLIT-PANE STUDIO WORKSPACE ─── */}
      <div className="p-3 sm:p-4 max-w-[1440px] mx-auto w-full overflow-x-clip print:p-0 print:max-w-none print:overflow-visible">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-4 print:block">
          {/* Desktop Left Control Rail */}
          {showLeftRail && (
            <div className="hidden lg:block lg:sticky lg:top-[64px] max-h-[calc(100vh-80px)] overflow-y-auto no-scrollbar print:hidden">
              <IdCardControlRail
                totalStudentsCount={students.length}
                filteredStudentsCount={filteredStudents.length}
                selectedCount={selectedIds.size}
                totalPages={pages.length}
                currentPage={currentPage}
                gradeCounts={gradeCounts}
                gradeFilter={gradeFilter}
                onGradeFilterChange={(g) => {
                  setGradeFilter(g);
                  setSectionFilter('all');
                  setSelectedIds(new Set());
                  setCurrentPage(1);
                }}
                sectionFilter={sectionFilter}
                onSectionFilterChange={(s) => {
                  setSectionFilter(s);
                  setSelectedIds(new Set());
                  setCurrentPage(1);
                }}
                searchQuery={searchQuery}
                onSearchChange={(q) => {
                  setSearchQuery(q);
                  setCurrentPage(1);
                }}
                onToggleSelectAll={handleToggleSelectAll}
                allFilteredSelected={
                  filteredStudents.length > 0 && selectedIds.size === filteredStudents.length
                }
                sessionYear={sessionYear}
                onSessionYearChange={setSessionYear}
                docLang={docLang}
                onDocLangChange={setDocLang}
                activeTemplate={activeTemplate}
                customTemplates={customTemplates}
                onSelectTemplate={handleSelectTemplate}
                onOpenNewTemplateModal={() =>
                  setEditingTemplate(createBlankCustomTemplate(activeTemplate))
                }
                onEditCustomTemplate={(tpl) => setEditingTemplate(tpl)}
                onDeleteCustomTemplate={handleDeleteCustomTemplate}
                onExportTemplateJson={handleExportTemplateJson}
                onImportTemplateJsonFile={handleImportTemplateJsonFile}
                localTemplateBytes={localTemplateBytes}
                sideMode={sideMode}
                onSideModeChange={(m) => {
                  setSideMode(m);
                  setCurrentPage(1);
                }}
                pageSettings={pageSettings}
                onUpdatePageSettings={handleUpdatePageSettings}
                metrics={metrics}
                printScope={printScope}
                onPrintScopeChange={setPrintScope}
                pageRangeExpr={pageRangeExpr}
                onPageRangeExprChange={setPageRangeExpr}
              />
            </div>
          )}

          {/* Right Live Paginated Sheet Preview & Print Canvas */}
          <IdCardPaginatedSheetCanvas
            pages={pages}
            currentPage={currentPage}
            onChangePage={setCurrentPage}
            targetPrintPageNumbers={targetPrintPageNumbers}
            metrics={metrics}
            pageSettings={pageSettings}
            schoolSettings={settings}
            template={activeTemplate}
            docLang={docLang}
            sessionYear={sessionYear}
            selectedIds={selectedIds}
            onToggleSelectStudent={handleToggleSelectStudent}
            populatedGrades={populatedGrades}
            onJumpToGrade={(g) => {
              setGradeFilter(g);
              setSectionFilter('all');
              setSelectedIds(new Set());
              setCurrentPage(1);
            }}
            onResetFilters={() => {
              setGradeFilter('all');
              setSectionFilter('all');
              setSearchQuery('');
              setSelectedIds(new Set());
              setCurrentPage(1);
            }}
            totalStudentsInDb={students.length}
          />
        </div>
      </div>

      {/* ─── MOBILE SLIDE-OVER CONTROL DRAWER ─── */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-slate-950/60 backdrop-blur-xs flex print:hidden">
          <div className="w-[316px] max-w-[88vw] bg-slate-50 dark:bg-slate-950 h-full overflow-y-auto p-3.5 shadow-2xl border-r border-slate-200 dark:border-slate-800">
            <IdCardControlRail
              totalStudentsCount={students.length}
              filteredStudentsCount={filteredStudents.length}
              selectedCount={selectedIds.size}
              totalPages={pages.length}
              currentPage={currentPage}
              gradeCounts={gradeCounts}
              gradeFilter={gradeFilter}
              onGradeFilterChange={(g) => {
                setGradeFilter(g);
                setSectionFilter('all');
                setSelectedIds(new Set());
                setCurrentPage(1);
              }}
              sectionFilter={sectionFilter}
              onSectionFilterChange={(s) => {
                setSectionFilter(s);
                setSelectedIds(new Set());
                setCurrentPage(1);
              }}
              searchQuery={searchQuery}
              onSearchChange={(q) => {
                setSearchQuery(q);
                setCurrentPage(1);
              }}
              onToggleSelectAll={handleToggleSelectAll}
              allFilteredSelected={
                filteredStudents.length > 0 && selectedIds.size === filteredStudents.length
              }
              sessionYear={sessionYear}
              onSessionYearChange={setSessionYear}
              docLang={docLang}
              onDocLangChange={setDocLang}
              activeTemplate={activeTemplate}
              customTemplates={customTemplates}
              onSelectTemplate={handleSelectTemplate}
              onOpenNewTemplateModal={() => {
                setMobileDrawerOpen(false);
                setEditingTemplate(createBlankCustomTemplate(activeTemplate));
              }}
              onEditCustomTemplate={(tpl) => {
                setMobileDrawerOpen(false);
                setEditingTemplate(tpl);
              }}
              onDeleteCustomTemplate={handleDeleteCustomTemplate}
              onExportTemplateJson={handleExportTemplateJson}
              onImportTemplateJsonFile={handleImportTemplateJsonFile}
              localTemplateBytes={localTemplateBytes}
              sideMode={sideMode}
              onSideModeChange={(m) => {
                setSideMode(m);
                setCurrentPage(1);
              }}
              pageSettings={pageSettings}
              onUpdatePageSettings={handleUpdatePageSettings}
              metrics={metrics}
              printScope={printScope}
              onPrintScopeChange={setPrintScope}
              pageRangeExpr={pageRangeExpr}
              onPageRangeExprChange={setPageRangeExpr}
              onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
            />
          </div>
          <button
            type="button"
            className="flex-1"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="ওভারলে বন্ধ করুন"
          />
        </div>
      )}

      {/* ─── CUSTOM TEMPLATE STUDIO MODAL ─── */}
      {editingTemplate && (
        <IdCardCustomTemplateModal
          initialTemplate={editingTemplate}
          sampleStudent={sampleStudentForModal}
          schoolSettings={settings}
          docLang={docLang}
          cardOrientation={pageSettings.cardOrientation}
          sessionYear={sessionYear}
          onSave={handleSaveCustomTemplate}
          onExportJson={handleExportTemplateJson}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
}
