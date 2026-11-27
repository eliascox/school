'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  Printer,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UserCheck,
} from 'lucide-react';
import { studentService, type Student } from '@/services/studentService';
import { settingsService, type SchoolSettings } from '@/services/settingsService';
import { examService } from '@/services/examService';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import { autoCropAndCompressStudentPhoto } from '@/lib/imageUtils';
import { triggerProfessionalPrint } from '@/lib/printPdfUtils';
import { toBanglaDigits } from '@/lib/omr/omrTemplates';
import {
  ADMIT_LAYOUT_PRESETS,
  DEFAULT_ADMIT_DESIGN_OPTIONS,
  type AdmitCardDesignOptions,
  type AdmitCardLayoutId,
  type AdmitDocLang,
  type AdmitGradeId,
  type AdmitGroupBn,
  type AdmitScheduleEntry,
  buildDefaultExamSchedule,
  buildSampleAdmitStudents,
  filterAndNormalizeAdmitStudents,
  formatAdmitExamTitle,
  formatAdmitGradeLabel,
  formatAdmitSectionOrGroup,
  loadExamSchedule,
  paginateAdmitStudents,
  saveExamSchedule,
  summarizeAdmitScopes,
} from '@/lib/admitCardStudioUtils';
import { AdmitCardControlRail } from '@/components/exam/AdmitCardControlRail';
import { AdmitCardSheetCanvas } from '@/components/exam/AdmitCardSheetCanvas';

export default function ProfessionalAdmitCardPage() {
  const [mounted, setMounted] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(() =>
    settingsService.getSettings(),
  );
  const [examOptions, setExamOptions] = useState<string[]>([
    'অর্ধ-বার্ষিক পরীক্ষা ২০২৬',
    'বার্ষিক পরীক্ষা ২০২৬',
  ]);
  const [selectedExam, setSelectedExam] = useState('অর্ধ-বার্ষিক পরীক্ষা ২০২৬');
  const [selectedGrade, setSelectedGrade] = useState<AdmitGradeId>('6th');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [selectedGroup, setSelectedGroup] = useState<AdmitGroupBn>('বিজ্ঞান');
  const [searchQuery, setSearchQuery] = useState('');

  // Studio Controls
  const [layoutId, setLayoutId] = useState<AdmitCardLayoutId>('a5_two_per_a4');
  const [docLang, setDocLang] = useState<AdmitDocLang>('bn');
  const [design, setDesign] = useState<AdmitCardDesignOptions>(DEFAULT_ADMIT_DESIGN_OPTIONS);
  const [selectionMode, setSelectionMode] = useState<'all' | 'specific'>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [samplePreview, setSamplePreview] = useState(false);

  // Pagination & Rail Visibility
  const [currentPage, setCurrentPage] = useState(1);
  const [viewAllPages, setViewAllPages] = useState(true);
  const [railVisible, setRailVisible] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Drag & Drop Photo Cache
  const [photoMap, setPhotoMap] = useState<Record<string, string>>({});
  const [draggingStudentId, setDraggingStudentId] = useState<string | null>(null);

  // Exam Routine Schedule
  const [schedule, setSchedule] = useState<AdmitScheduleEntry[]>([]);

  const syncPhotosFromStorage = useCallback((studentsSnapshot?: Student[]) => {
    if (typeof window === 'undefined') return;
    const map: Record<string, string> = {};
    const list = studentsSnapshot ?? studentService.getAllStudents();

    list.forEach((s) => {
      if (s.photo) {
        map[s.id] = s.photo;
        if (s.roll) {
          map[s.roll] = s.photo;
          const g = (s.grade || s.gradeBn || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (g) map[`${g}_${s.roll}`] = s.photo;
        }
      }
    });

    const savedPhotos = localStorage.getItem('sms_student_photos');
    if (savedPhotos) {
      try {
        const parsed = JSON.parse(savedPhotos) as Record<string, string>;
        Object.assign(map, parsed);
      } catch {
        // ignore invalid photo cache
      }
    }
    setPhotoMap(map);
  }, []);

  // Mount & Subscriptions
  useEffect(() => {
    setMounted(true);

    const initialStudents = studentService.getAllStudents();
    setAllStudents(initialStudents);
    syncPhotosFromStorage(initialStudents);

    // Auto-select first populated class/section/group so users see real students immediately
    const { populatedScopes } = summarizeAdmitScopes(initialStudents);
    if (populatedScopes.length > 0) {
      const first = populatedScopes[0];
      setSelectedGrade(first.grade);
      if (first.grade === '9th' || first.grade === '10th') {
        setSelectedGroup(first.group === 'সাধারণ' ? 'বিজ্ঞান' : first.group);
      } else {
        setSelectedSection(first.section || 'A');
      }
    }

    const syncExams = () => {
      const active = examService.getActiveExams();
      const titles = Array.from(
        new Set(
          active
            .map((e) => e.title?.trim())
            .filter((t): t is string => Boolean(t)),
        ),
      );
      if (titles.length > 0) {
        setExamOptions(titles);
        setSelectedExam((prev) => (titles.includes(prev) ? prev : titles[0]));
      }
    };
    syncExams();

    const unsubStudents = studentService.subscribe(() => {
      const next = studentService.getAllStudents();
      setAllStudents(next);
      syncPhotosFromStorage(next);
    });
    const unsubSettings = settingsService.subscribe((next) => {
      if (next) setSchoolSettings(next);
    });
    const unsubExams = examService.subscribe(() => syncExams());
    const onStorage = () => syncPhotosFromStorage();
    window.addEventListener('storage', onStorage);

    return () => {
      unsubStudents();
      unsubSettings();
      unsubExams();
      window.removeEventListener('storage', onStorage);
    };
  }, [syncPhotosFromStorage]);

  // Load Exam Routine whenever exam / grade / group changes
  const curriculumSubjects = useMemo(() => {
    if (!mounted) return [];
    const is9or10 = selectedGrade === '9th' || selectedGrade === '10th';
    return getActiveCurriculumSubjects(selectedGrade, is9or10 ? selectedGroup : 'সাধারণ').map(
      (s: { code: string; name: string }) => ({
        code: s.code,
        name: s.name,
      }),
    );
  }, [mounted, selectedGrade, selectedGroup]);

  useEffect(() => {
    if (!mounted) return;
    setSchedule(loadExamSchedule(selectedExam, selectedGrade, selectedGroup, curriculumSubjects));
  }, [mounted, selectedExam, selectedGrade, selectedGroup, curriculumSubjects]);

  const handleScheduleChange = (next: AdmitScheduleEntry[]) => {
    setSchedule(next);
    saveExamSchedule(selectedExam, selectedGrade, selectedGroup, next);
  };

  const handleResetSchedule = () => {
    const fresh = buildDefaultExamSchedule(curriculumSubjects);
    setSchedule(fresh);
    saveExamSchedule(selectedExam, selectedGrade, selectedGroup, fresh);
  };

  // Scope counts across all classes
  const scopeSummary = useMemo(() => summarizeAdmitScopes(allStudents), [allStudents]);

  // Normalized students for current class + section/group
  const scopedStudents = useMemo(
    () =>
      filterAndNormalizeAdmitStudents({
        allStudents,
        grade: selectedGrade,
        section: selectedSection,
        groupBn: selectedGroup,
        photoMap,
        sessionYear: design.sessionYear,
      }),
    [allStudents, selectedGrade, selectedSection, selectedGroup, photoMap, design.sessionYear],
  );

  // Search filter
  const searchedStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return scopedStudents;
    return scopedStudents.filter(
      (st) =>
        st.name.toLowerCase().includes(q) ||
        (st.nameEn || '').toLowerCase().includes(q) ||
        st.roll.toLowerCase().includes(q) ||
        st.regNo.toLowerCase().includes(q),
    );
  }, [scopedStudents, searchQuery]);

  // Apply All vs Specific selection + optional Sample Preview
  const activeStudents = useMemo(() => {
    if (samplePreview && searchedStudents.length === 0) {
      return buildSampleAdmitStudents(
        selectedGrade,
        selectedSection,
        selectedGroup,
        design.sessionYear,
      );
    }
    if (selectionMode === 'specific') {
      return searchedStudents.filter((st) => selectedStudentIds.has(st.id));
    }
    return searchedStudents;
  }, [
    samplePreview,
    searchedStudents,
    selectionMode,
    selectedStudentIds,
    selectedGrade,
    selectedSection,
    selectedGroup,
    design.sessionYear,
  ]);

  // Paginated A4 pages
  const pages = useMemo(
    () => paginateAdmitStudents(activeStudents, layoutId),
    [activeStudents, layoutId],
  );

  // Reset current page when count or layout changes
  useEffect(() => {
    setCurrentPage(1);
  }, [layoutId, selectedGrade, selectedSection, selectedGroup, pages.length]);

  const handleLayoutChange = (nextId: AdmitCardLayoutId) => {
    setLayoutId(nextId);
    if (nextId === 'single_full_a4') {
      setDesign((prev) => ({ ...prev, showRoutine: true }));
    } else if (nextId === 'compact_four_per_a4') {
      setDesign((prev) => ({ ...prev, showRoutine: false }));
    }
  };

  const handleUpdateDesign = (patch: Partial<AdmitCardDesignOptions>) => {
    setDesign((prev) => ({ ...prev, ...patch }));
  };

  const handleToggleStudentId = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Drag & Drop or File Selector Photo Upload (bidirectionally synced with Student Directory)
  const handlePhotoUpload = async (studentId: string, file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const compressed = await autoCropAndCompressStudentPhoto(file, 300, 360, 0.85);
      if (!compressed) return;

      studentService.saveStudentPhoto(studentId, compressed);
      const allSt = studentService.getAllStudents();
      const target = allSt.find((s) => s.id === studentId || s.roll === studentId);
      if (target) {
        studentService.updateStudent({ ...target, photo: compressed });
      }

      setPhotoMap((prev) => {
        const updated = { ...prev, [studentId]: compressed };
        if (target) {
          if (target.id) updated[target.id] = compressed;
          if (target.roll) {
            updated[target.roll] = compressed;
            const g = (target.grade || target.gradeBn || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (g) updated[`${g}_${target.roll}`] = compressed;
          }
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('sms_student_photos', JSON.stringify(updated));
          window.dispatchEvent(new Event('storage'));
        }
        return updated;
      });
    } catch (err) {
      console.error('Error uploading/linking student photo:', err);
    }
  };

  const handlePrint = () => {
    const examLabel = formatAdmitExamTitle(selectedExam, docLang);
    const gradeLabel = formatAdmitGradeLabel(selectedGrade, docLang);
    const secLabel = formatAdmitSectionOrGroup(selectedGrade, selectedSection, selectedGroup, docLang);
    triggerProfessionalPrint([
      docLang === 'en' ? 'Admit Cards' : 'প্রবেশপত্র',
      examLabel,
      gradeLabel,
      secLabel,
    ]);
  };

  const layoutMeta = ADMIT_LAYOUT_PRESETS[layoutId];

  if (!mounted) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-bold">
        প্রবেশপত্র স্টুডিও লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-full pb-12 print:p-0 print:m-0 font-sans text-slate-900 dark:text-white"
      suppressHydrationWarning
    >
      {/* Dynamic Print Page Orientation Rules */}
      <style>{`
        @media print {
          @page {
            size: A4 ${layoutMeta.orientation} !important;
            margin: 0mm !important;
          }
          html, body {
            margin: 0mm !important;
            padding: 0mm !important;
            height: auto !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .admit-a4-sheet {
            display: block !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
          .admit-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          .admit-a4-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>

      {/* Mobile Slide-Over Control Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex print:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative z-10 w-[320px] max-w-[90vw] p-3 bg-slate-100 dark:bg-slate-950 h-full overflow-y-auto shadow-2xl">
            <AdmitCardControlRail
              examOptions={examOptions}
              selectedExam={selectedExam}
              onSelectExam={setSelectedExam}
              selectedGrade={selectedGrade}
              onSelectGrade={setSelectedGrade}
              selectedSection={selectedSection}
              onSelectSection={setSelectedSection}
              selectedGroup={selectedGroup}
              onSelectGroup={setSelectedGroup}
              gradeCounts={scopeSummary.byGrade}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              layoutId={layoutId}
              onLayoutChange={handleLayoutChange}
              docLang={docLang}
              onDocLangChange={setDocLang}
              design={design}
              onUpdateDesign={handleUpdateDesign}
              studentsInScope={searchedStudents}
              selectionMode={selectionMode}
              onSelectionModeChange={(m) => {
                setSelectionMode(m);
                if (m === 'specific' && selectedStudentIds.size === 0) {
                  setSelectedStudentIds(new Set(searchedStudents.slice(0, 4).map((s) => s.id)));
                }
              }}
              selectedStudentIds={selectedStudentIds}
              onToggleStudentId={handleToggleStudentId}
              onSelectAllStudents={() =>
                setSelectedStudentIds(new Set(searchedStudents.map((s) => s.id)))
              }
              onClearSelectedStudents={() => setSelectedStudentIds(new Set())}
              schedule={schedule}
              onChangeSchedule={handleScheduleChange}
              onResetSchedule={handleResetSchedule}
              onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* SPLIT-PANE STUDIO LAYOUT (Left Control Rail + Right Live A4 Sheet Canvas) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-5 print:block">
        {/* Desktop Collapsible Left Rail */}
        {railVisible && (
          <div className="hidden lg:block sticky top-4 print:hidden">
            <AdmitCardControlRail
              examOptions={examOptions}
              selectedExam={selectedExam}
              onSelectExam={setSelectedExam}
              selectedGrade={selectedGrade}
              onSelectGrade={setSelectedGrade}
              selectedSection={selectedSection}
              onSelectSection={setSelectedSection}
              selectedGroup={selectedGroup}
              onSelectGroup={setSelectedGroup}
              gradeCounts={scopeSummary.byGrade}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              layoutId={layoutId}
              onLayoutChange={handleLayoutChange}
              docLang={docLang}
              onDocLangChange={setDocLang}
              design={design}
              onUpdateDesign={handleUpdateDesign}
              studentsInScope={searchedStudents}
              selectionMode={selectionMode}
              onSelectionModeChange={(m) => {
                setSelectionMode(m);
                if (m === 'specific' && selectedStudentIds.size === 0) {
                  setSelectedStudentIds(new Set(searchedStudents.slice(0, 4).map((s) => s.id)));
                }
              }}
              selectedStudentIds={selectedStudentIds}
              onToggleStudentId={handleToggleStudentId}
              onSelectAllStudents={() =>
                setSelectedStudentIds(new Set(searchedStudents.map((s) => s.id)))
              }
              onClearSelectedStudents={() => setSelectedStudentIds(new Set())}
              schedule={schedule}
              onChangeSchedule={handleScheduleChange}
              onResetSchedule={handleResetSchedule}
            />
          </div>
        )}

        {/* Right Live Sheet Workspace */}
        <div className="w-full flex-1 min-w-0 max-w-full space-y-4 print:space-y-0">
          {/* Compact Top Action Bar */}
          <div className="bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2.5 print:hidden">
            {/* Left: Rail Toggle + Scope Summary */}
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <button
                type="button"
                onClick={() => setRailVisible((v) => !v)}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition"
                title={railVisible ? 'প্যানেল লুকান' : 'প্যানেল দেখান'}
              >
                {railVisible ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
                <span>{railVisible ? 'প্যানেল' : 'ফিল্টার'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-black cursor-pointer"
              >
                <SlidersHorizontal size={14} /> ফিল্টার ও লেআউট
              </button>

              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-[#0B5D3B] dark:text-emerald-300 font-black border border-emerald-200/70 dark:border-emerald-800/60">
                  {formatAdmitGradeLabel(selectedGrade, 'bn')} •{' '}
                  {formatAdmitSectionOrGroup(selectedGrade, selectedSection, selectedGroup, 'bn')}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold">
                  {toBanglaDigits(activeStudents.length)}টি কার্ড • {toBanglaDigits(pages.length)} পাতা ({layoutMeta.labelBn})
                </span>
              </div>
            </div>

            {/* Right: Pager + Sample Preview + Seat Plan Link + Print Button */}
            <div className="flex items-center gap-2 flex-wrap">
              {pages.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => {
                      setViewAllPages(false);
                      setCurrentPage((p) => Math.max(1, p - 1));
                    }}
                    className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                    aria-label="পূর্ববর্তী পৃষ্ঠা"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-1.5 font-mono font-black text-[11px] text-slate-800 dark:text-slate-100">
                    পেইজ {toBanglaDigits(currentPage)} / {toBanglaDigits(pages.length)}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= pages.length}
                    onClick={() => {
                      setViewAllPages(false);
                      setCurrentPage((p) => Math.min(pages.length, p + 1));
                    }}
                    className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                    aria-label="পরবর্তী পৃষ্ঠা"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewAllPages((v) => !v)}
                    className={`px-2 py-0.5 rounded-lg text-[10.5px] font-black cursor-pointer transition inline-flex items-center gap-1 ${
                      viewAllPages
                        ? 'bg-[#0B5D3B] text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    <Layers size={11} />
                    {viewAllPages ? 'সব পাতা' : '১ পাতা'}
                  </button>
                </div>
              )}

              {searchedStudents.length === 0 && (
                <button
                  type="button"
                  onClick={() => setSamplePreview((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition cursor-pointer ${
                    samplePreview
                      ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-400'
                  }`}
                >
                  <Eye size={13} /> {samplePreview ? 'নমুনা চালু আছে' : 'নমুনা প্রিভিউ'}
                </button>
              )}

              <Link
                href="/dashboard/exam/seat-plan"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition whitespace-nowrap"
              >
                <LayoutGrid size={13} /> সিট প্ল্যান
              </Link>

              <button
                type="button"
                onClick={handlePrint}
                disabled={activeStudents.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] disabled:bg-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Printer size={14} /> প্রবেশপত্র প্রিন্ট / PDF
              </button>
            </div>
          </div>

          {/* Sample Preview Notice */}
          {samplePreview && searchedStudents.length === 0 && (
            <div className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200 text-xs font-bold flex flex-wrap items-center justify-between gap-2 print:hidden">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-600" />
                বর্তমান শ্রেণিতে শিক্ষার্থী না থাকায় ২টি নমুনা প্রবেশপত্র (Sample Preview) দেখানো হচ্ছে। এটি ডাটাবেজে সংরক্ষিত হবে না।
              </span>
              <button
                type="button"
                onClick={() => setSamplePreview(false)}
                className="underline font-black cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          )}

          {/* Live Print Sheets Canvas */}
          <div className="bg-slate-100/80 dark:bg-slate-950/60 p-3 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 print:p-0 print:bg-transparent print:border-0 print:rounded-none overflow-x-auto">
            {pages.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200 dark:border-slate-800 space-y-3 print:hidden">
                <UserCheck className="w-11 h-11 text-slate-300 dark:text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                    নির্বাচিত শ্রেণি বা ফিল্টারে কোনো শিক্ষার্থী পাওয়া যায়নি
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    বাম পাশ থেকে অন্য শ্রেণি/বিভাগ নির্বাচন করুন, অথবা ডিজাইন দেখতে নমুনা প্রিভিউ চালু করুন।
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSamplePreview(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-xs font-black cursor-pointer transition"
                  >
                    <Eye size={14} /> নমুনা প্রবেশপত্র দেখুন
                  </button>
                  <Link
                    href="/dashboard/students/bulk-import"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                  >
                    <Upload size={14} /> শিক্ষার্থী আপলোড করুন
                  </Link>
                </div>
              </div>
            ) : (
              <AdmitCardSheetCanvas
                pages={pages}
                viewAllPages={viewAllPages}
                currentPage={currentPage}
                settings={schoolSettings}
                selectedExam={selectedExam}
                docLang={docLang}
                layoutId={layoutId}
                design={design}
                schedule={schedule}
                photoMap={photoMap}
                draggingStudentId={draggingStudentId}
                onDragStudentChange={setDraggingStudentId}
                onUploadPhoto={handlePhotoUpload}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
