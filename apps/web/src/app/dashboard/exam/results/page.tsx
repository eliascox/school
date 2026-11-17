'use client';

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 📊 SCHOOLPRO — UNIFIED RESULT ANALYTICS & REPORTS STUDIO (/dashboard/exam/results)
 * ─────────────────────────────────────────────────────────────────────────────
 * Compact executive header + single-card segmented 3×3 workspace dock +
 * auto-selected populated cohort + smart zero-duplication stage canvas.
 * ═════════════════════════════════════════════════════════════════════════════
 */

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Award,
  BarChart3,
  BookOpen,
  ChevronDown,
  ClipboardList,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Languages,
  Layers,
  ListOrdered,
  Printer,
  Settings2,
  SlidersHorizontal,
  Trophy,
  Upload,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import {
  buildFailList,
  buildSubjectWiseReport,
  computeCohortSnapshot,
  DEFAULT_TIE_BREAKER_RULES,
  filterStudentsForCohort,
  getPopulatedCohorts,
  loadSubjectOrder,
  loadTieBreakerRules,
  saveSubjectOrder,
  saveTieBreakerRules,
  TieBreakerRule,
} from '@/lib/resultAnalyticsEngine';
import { downloadResultWorkbook, ResultReportViewKey } from '@/lib/resultExcelExport';
import { examService, ExamItem } from '@/services/examService';
import { AppLanguage, languageService } from '@/services/languageService';
import { PassEvaluationMode } from '@/services/resultService';
import { SchoolSettings, settingsService } from '@/services/settingsService';
import { Student, studentService } from '@/services/studentService';
import { showToast } from '@/components/ui/ToastProvider';
import { SubjectOrderModal, TieBreakerOrderModal } from '@/components/results/ResultConfigModals';
import { fmtNum, GRADE_LABELS, toBnDigits } from '@/components/results/resultStudioShared';
import {
  AllSubjectsHeatmapView,
  ClassSectionSummaryView,
  SubjectWiseAnalysisView,
} from '@/components/results/SummaryAndSubjectAnalyticsViews';
import {
  FailAnalysisView,
  FullResultRegisterView,
  MeritListView,
  TabulationMatrixView,
} from '@/components/results/TabulationAndRegisterViews';
import { TranscriptWorkspace } from '@/components/results/TranscriptWorkspace';

type WorkspaceKey = 'transcripts' | 'registers' | 'analytics';

interface ViewMeta {
  id: ResultReportViewKey;
  workspace: WorkspaceKey;
  labelBn: string;
  labelEn: string;
  icon: React.ReactNode;
}

const ALL_VIEWS: ViewMeta[] = [
  {
    id: 'single_transcript',
    workspace: 'transcripts',
    labelBn: 'একক ট্রান্সক্রিপ্ট',
    labelEn: 'Single Transcript',
    icon: <GraduationCap size={14} />,
  },
  {
    id: 'batch_transcript',
    workspace: 'transcripts',
    labelBn: 'বাল্ক ট্রান্সক্রিপ্ট',
    labelEn: 'Batch Transcripts',
    icon: <Layers size={14} />,
  },
  {
    id: 'tabulation',
    workspace: 'registers',
    labelBn: 'টেবুলেশন শিট',
    labelEn: 'Tabulation Sheet',
    icon: <ClipboardList size={14} />,
  },
  {
    id: 'merit_list',
    workspace: 'registers',
    labelBn: 'মেধাতালিকা',
    labelEn: 'Merit List',
    icon: <Trophy size={14} />,
  },
  {
    id: 'fail_list',
    workspace: 'registers',
    labelBn: 'ফেল বিশ্লেষণ',
    labelEn: 'Fail Analysis',
    icon: <XCircle size={14} />,
  },
  {
    id: 'full_register',
    workspace: 'registers',
    labelBn: 'পূর্ণ রেজিস্টার',
    labelEn: 'Full Register',
    icon: <FileText size={14} />,
  },
  {
    id: 'class_summary',
    workspace: 'analytics',
    labelBn: 'শ্রেণি সারসংক্ষেপ',
    labelEn: 'Class Summary',
    icon: <BarChart3 size={14} />,
  },
  {
    id: 'subject_wise',
    workspace: 'analytics',
    labelBn: 'বিষয়ভিত্তিক',
    labelEn: 'Subject Wise',
    icon: <BookOpen size={14} />,
  },
  {
    id: 'all_subjects_heatmap',
    workspace: 'analytics',
    labelBn: 'সব বিষয়ের হিটম্যাপ',
    labelEn: 'All Subjects Matrix',
    icon: <Award size={14} />,
  },
];

const WORKSPACES: Array<{ key: WorkspaceKey; bn: string; en: string }> = [
  { key: 'transcripts', bn: 'শিক্ষার্থী', en: 'Transcripts' },
  { key: 'registers', bn: 'শ্রেণি ও মেধা', en: 'Registers' },
  { key: 'analytics', bn: 'পরিসংখ্যান ও বিষয়', en: 'Analytics' },
];

const DEFAULT_EXAM_OPTIONS = [
  'অর্ধ-বার্ষিক পরীক্ষা ২০২৬',
  'বার্ষিক পরীক্ষা ২০২৬',
  '১ম সাময়িক পরীক্ষা ২০২৬',
  'এসএসসি প্রাক-নির্বাচনী পরীক্ষা ২০২৬',
  'এসএসসি নির্বাচনী (টেস্ট) পরীক্ষা ২০২৬',
];

function ResultStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialViewParam = searchParams?.get('view') as ResultReportViewKey | null;
  const initialView: ResultReportViewKey = ALL_VIEWS.some((v) => v.id === initialViewParam)
    ? (initialViewParam as ResultReportViewKey)
    : 'class_summary';

  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<AppLanguage>('bn');
  const [activeView, setActiveView] = useState<ResultReportViewKey>(initialView);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedExam, setSelectedExam] = useState<string>('অর্ধ-বার্ষিক পরীক্ষা ২০২৬');
  const [selectedGrade, setSelectedGrade] = useState<string>('8th');
  const [selectedBranch, setSelectedBranch] = useState<string>('A');
  const [selectedGroup, setSelectedGroup] = useState<string>('সাধারণ');
  const [passMode, setPassMode] = useState<PassEvaluationMode>('curriculum');
  const [hideHeader, setHideHeader] = useState(false);
  const [showHighestStats, setShowHighestStats] = useState(true);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('');
  const [minFailCount, setMinFailCount] = useState<number>(1);
  const [borderImageUrl, setBorderImageUrl] = useState<string>('');

  const [tieBreakers, setTieBreakers] = useState<TieBreakerRule[]>(DEFAULT_TIE_BREAKER_RULES);
  const [subjectOrderCodes, setSubjectOrderCodes] = useState<string[]>([]);
  const [showTieModal, setShowTieModal] = useState(false);
  const [showSubjectOrderModal, setShowSubjectOrderModal] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);

  const userPickedCohortRef = useRef(false);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);

  const loadWorkspaceData = useCallback(() => {
    const s = settingsService.getSettings();
    setSettings(s);
    const savedBorder =
      typeof window !== 'undefined' ? window.localStorage.getItem('sms_marksheet_border_png') : null;
    setBorderImageUrl(savedBorder || s.customBorderPng || '');

    const loadedExams = examService.getExams();
    setExams(loadedExams);
    if (loadedExams.length > 0) {
      setSelectedExam((prev) =>
        loadedExams.some((ex) => ex.title === prev) ? prev : loadedExams[0].title,
      );
    }

    const loadedStudents = studentService.getAllStudents();
    setStudents(loadedStudents);

    // Smart auto-selection: avoid landing on empty class if populated cohorts exist
    if (!userPickedCohortRef.current && loadedStudents.length > 0) {
      const { cohorts } = getPopulatedCohorts(loadedStudents);
      if (cohorts.length > 0) {
        const first = cohorts[0];
        setSelectedGrade(first.grade);
        setSelectedBranch(first.branch);
        setSelectedGroup(first.group);
      }
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    setLang(languageService.getLanguage());
    setTieBreakers(loadTieBreakerRules());
    loadWorkspaceData();

    const unsubLang = languageService.subscribe((next) => setLang(next));
    const unsubSettings = settingsService.subscribe((s) => setSettings(s));
    const onStorage = () => loadWorkspaceData();
    window.addEventListener('storage', onStorage);
    return () => {
      unsubLang();
      unsubSettings();
      window.removeEventListener('storage', onStorage);
    };
  }, [loadWorkspaceData]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setSettingsMenuOpen(false);
      }
    };
    if (settingsMenuOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [settingsMenuOpen]);

  useEffect(() => {
    const paramView = searchParams?.get('view') as ResultReportViewKey | null;
    if (paramView && ALL_VIEWS.some((v) => v.id === paramView)) {
      setActiveView(paramView);
    }
  }, [searchParams]);

  const effectiveGroup =
    selectedGrade === '9th' || selectedGrade === '10th'
      ? selectedGroup === 'সাধারণ'
        ? 'বিজ্ঞান'
        : selectedGroup
      : 'সাধারণ';

  useEffect(() => {
    setSubjectOrderCodes(loadSubjectOrder(selectedGrade, effectiveGroup));
  }, [selectedGrade, effectiveGroup]);

  const populatedMeta = useMemo(() => getPopulatedCohorts(students), [students]);

  const sectionOrGroupCounts = useMemo(() => {
    const isUpper = selectedGrade === '9th' || selectedGrade === '10th';
    if (isUpper) {
      return {
        বিজ্ঞান: filterStudentsForCohort(students, selectedGrade, 'all', 'বিজ্ঞান').length,
        মানবিক: filterStudentsForCohort(students, selectedGrade, 'all', 'মানবিক').length,
        'ব্যবসায় শিক্ষা': filterStudentsForCohort(students, selectedGrade, 'all', 'ব্যবসায় শিক্ষা').length,
      } as Record<string, number>;
    }
    return {
      A: filterStudentsForCohort(students, selectedGrade, 'A', 'সাধারণ').length,
      B: filterStudentsForCohort(students, selectedGrade, 'B', 'সাধারণ').length,
      C: filterStudentsForCohort(students, selectedGrade, 'C', 'সাধারণ').length,
      all: filterStudentsForCohort(students, selectedGrade, 'all', 'সাধারণ').length,
    } as Record<string, number>;
  }, [students, selectedGrade]);

  const defaultSubjects = useMemo(
    () => getActiveCurriculumSubjects(selectedGrade, effectiveGroup),
    [selectedGrade, effectiveGroup],
  );

  const snapshot = useMemo(
    () =>
      computeCohortSnapshot({
        examId: selectedExam,
        grade: selectedGrade,
        branch: selectedBranch,
        group: effectiveGroup,
        allStudents: students,
        passMode,
        tieBreakerRules: tieBreakers,
        subjectOrderCodes,
      }),
    [
      selectedExam,
      selectedGrade,
      selectedBranch,
      effectiveGroup,
      students,
      passMode,
      tieBreakers,
      subjectOrderCodes,
    ],
  );

  const activeSubject = useMemo(() => {
    if (snapshot.subjects.length === 0) return null;
    return (
      snapshot.subjects.find((s) => String(s.code) === String(selectedSubjectCode)) ||
      snapshot.subjects[0]
    );
  }, [snapshot.subjects, selectedSubjectCode]);

  const subjectWiseReport = useMemo(() => {
    if (!activeSubject) return null;
    return buildSubjectWiseReport({
      examId: selectedExam,
      grade: selectedGrade,
      branch: selectedBranch === 'all' ? 'A' : selectedBranch,
      group: effectiveGroup,
      subject: activeSubject,
      students: snapshot.cohortStudents,
      passMode,
    });
  }, [
    activeSubject,
    selectedExam,
    selectedGrade,
    selectedBranch,
    effectiveGroup,
    snapshot.cohortStudents,
    passMode,
  ]);

  const failEntries = useMemo(
    () => buildFailList(snapshot.rankedResults, minFailCount),
    [snapshot.rankedResults, minFailCount],
  );

  const switchView = (nextView: ResultReportViewKey) => {
    setActiveView(nextView);
    router.replace(`/dashboard/exam/results?view=${nextView}`, { scroll: false });
  };

  const activeWorkspace: WorkspaceKey =
    ALL_VIEWS.find((v) => v.id === activeView)?.workspace || 'analytics';

  const switchWorkspace = (ws: WorkspaceKey) => {
    const first = ALL_VIEWS.find((v) => v.workspace === ws);
    if (first) switchView(first.id);
  };

  const isClass9or10 = selectedGrade === '9th' || selectedGrade === '10th';
  const gradeLabel = GRADE_LABELS[selectedGrade]?.[lang] || selectedGrade;
  const sectionLabel = isClass9or10
    ? effectiveGroup
    : selectedBranch === 'all'
    ? lang === 'bn'
      ? 'সকল শাখা'
      : 'All Sections'
    : `${lang === 'bn' ? 'শাখা' : 'Section'} ${selectedBranch}`;

  const examOptions = useMemo(() => {
    const titles = new Set<string>(exams.map((e) => e.title));
    for (const def of DEFAULT_EXAM_OPTIONS) titles.add(def);
    return Array.from(titles);
  }, [exams]);

  const handleExportExcel = () => {
    downloadResultWorkbook({
      view: activeView,
      examTitle: selectedExam,
      gradeLabel,
      sectionLabel,
      settings,
      subjects: snapshot.subjects,
      rankedResults: snapshot.rankedResults,
      failEntries,
      classSummaryRows: snapshot.classSummaryRows,
      subjectWiseReport,
      allSubjectsSummary: snapshot.allSubjectsSummary,
    });
    showToast(
      lang === 'bn' ? 'Excel (.xlsx) রিপোর্ট ডাউনলোড শুরু হয়েছে।' : 'Excel (.xlsx) report exported.',
      'success',
    );
  };

  if (!mounted) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="h-72 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12 print:p-0 print:m-0 print:space-y-0">
      {/* 1. COMPACT EXECUTIVE TOP HEADER (Single Print Trigger + Settings Popover) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <BarChart3 size={20} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {lang === 'bn' ? 'ফলাফল ও পরিসংখ্যান স্টুডিও' : 'Result Analytics Studio'}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  snapshot.cohortStudents.length > 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {gradeLabel} • {sectionLabel} ({fmtNum(snapshot.cohortStudents.length, lang)}{' '}
                {lang === 'bn' ? 'জন' : 'Students'})
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedExam} •{' '}
              {passMode === 'curriculum'
                ? lang === 'bn'
                  ? 'স্মার্ট পাঠ্যক্রম পাস নিয়ম'
                  : 'Curriculum Pass Rules'
                : passMode === 'part_by_part'
                ? lang === 'bn'
                  ? 'অংশভিত্তিক ৩৩% কঠোর পাস'
                  : 'Part-by-Part 33% Strict'
                : lang === 'bn'
                ? 'সর্বমোট ৩৩% পাস'
                : 'Total 33% Cumulative'}
            </p>
          </div>
        </div>

        {/* Clean 3-Button Action Group */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative" ref={settingsMenuRef}>
            <button
              type="button"
              onClick={() => setSettingsMenuOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs cursor-pointer"
            >
              <Settings2 size={14} className="text-indigo-600 dark:text-indigo-400" />
              {lang === 'bn' ? 'সেটিংস ও অপশন' : 'Preferences'}
              <ChevronDown size={13} className={`transition-transform ${settingsMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {settingsMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3.5 space-y-3 z-50">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'পাস মূল্যায়ন নিয়ম' : 'Pass Evaluation Rule'}
                  </div>
                  <select
                    value={passMode}
                    onChange={(e) => setPassMode(e.target.value as PassEvaluationMode)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="curriculum">
                      {lang === 'bn' ? 'পাঠ্যক্রম অনুযায়ী (স্মার্ট)' : 'Curriculum Default'}
                    </option>
                    <option value="total">
                      {lang === 'bn' ? 'সর্বমোট ৩৩% পাস (সম্মিলিত)' : 'Total 33% Cumulative'}
                    </option>
                    <option value="part_by_part">
                      {lang === 'bn' ? 'CQ/MCQ/PR আলাদা ৩৩% পাস' : 'Part-by-Part 33% Strict'}
                    </option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const next: AppLanguage = lang === 'bn' ? 'en' : 'bn';
                      languageService.setLanguage(next);
                      settingsService.updateSettings({ language: next });
                      setSettingsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Languages size={14} className="text-emerald-600" />
                      {lang === 'bn' ? 'ইন্টারফেস ভাষা' : 'UI Language'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px]">
                      {lang === 'bn' ? 'বাংলা → EN' : 'EN → বাংলা'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHideHeader((v) => !v)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2">
                      {hideHeader ? <Eye size={14} className="text-indigo-500" /> : <EyeOff size={14} className="text-slate-500" />}
                      {lang === 'bn' ? 'প্রিন্ট প্যাড হেডার' : 'Print Header'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px]">
                      {hideHeader ? (lang === 'bn' ? 'লুকানো' : 'Hidden') : (lang === 'bn' ? 'দৃশ্যমান' : 'Visible')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSettingsMenuOpen(false);
                      setShowSubjectOrderModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <ListOrdered size={14} className="text-violet-500" />
                    {lang === 'bn' ? 'বিষয়ের কলাম ক্রম সাজান' : 'Customize Subject Order'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSettingsMenuOpen(false);
                      setShowTieModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <SlidersHorizontal size={14} className="text-amber-500" />
                    {lang === 'bn' ? 'মেধাক্রম টাই-ব্রেকার নিয়ম' : 'Tie-Breaker Ranking Rules'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={snapshot.cohortStudents.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 text-white text-xs font-bold shadow-2xs cursor-pointer disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={14} />
            Excel
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            disabled={snapshot.cohortStudents.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 text-white text-xs font-bold shadow-2xs cursor-pointer disabled:cursor-not-allowed"
          >
            <Printer size={14} />
            {lang === 'bn' ? 'প্রিন্ট / PDF' : 'Print / PDF'}
          </button>
        </div>
      </div>

      {/* 2. SLEEK TWO-PART CONTROL DOCK (Inline Cohort Selectors + Single-Row Report Nav) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden print:hidden">
        {/* Top Row: Compact Cohort Context */}
        <div className="p-3 sm:px-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 w-12">
              {lang === 'bn' ? 'পরীক্ষা:' : 'Exam:'}
            </span>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {examOptions.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 w-10">
              {lang === 'bn' ? 'শ্রেণি:' : 'Class:'}
            </span>
            <select
              value={selectedGrade}
              onChange={(e) => {
                userPickedCohortRef.current = true;
                const nextGrade = e.target.value;
                setSelectedGrade(nextGrade);
                setSelectedSubjectCode('');
                if (nextGrade === '9th' || nextGrade === '10th') {
                  setSelectedGroup('বিজ্ঞান');
                  setSelectedBranch('Science');
                } else {
                  setSelectedGroup('সাধারণ');
                  setSelectedBranch('A');
                }
              }}
              className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(GRADE_LABELS).map(([key, labels]) => {
                const count = populatedMeta.gradeCounts[key] || 0;
                return (
                  <option key={key} value={key}>
                    {lang === 'bn' ? labels.bn : labels.en} ({fmtNum(count, lang)}{' '}
                    {lang === 'bn' ? 'জন' : ''})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 w-14">
              {isClass9or10 ? (lang === 'bn' ? 'বিভাগ:' : 'Group:') : lang === 'bn' ? 'শাখা:' : 'Section:'}
            </span>
            <select
              value={isClass9or10 ? effectiveGroup : selectedBranch}
              onChange={(e) => {
                userPickedCohortRef.current = true;
                const val = e.target.value;
                if (isClass9or10) {
                  setSelectedGroup(val);
                  setSelectedBranch(
                    val === 'বিজ্ঞান'
                      ? 'Science'
                      : val === 'মানবিক'
                      ? 'Humanities'
                      : 'Commerce',
                  );
                } else {
                  setSelectedBranch(val);
                  setSelectedGroup('সাধারণ');
                }
              }}
              className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {isClass9or10 ? (
                <>
                  <option value="বিজ্ঞান">
                    {lang === 'bn' ? 'বিজ্ঞান বিভাগ' : 'Science'} ({fmtNum(sectionOrGroupCounts['বিজ্ঞান'] || 0, lang)})
                  </option>
                  <option value="মানবিক">
                    {lang === 'bn' ? 'মানবিক বিভাগ' : 'Humanities'} ({fmtNum(sectionOrGroupCounts['মানবিক'] || 0, lang)})
                  </option>
                  <option value="ব্যবসায় শিক্ষা">
                    {lang === 'bn' ? 'ব্যবসায় শিক্ষা' : 'Business Studies'} ({fmtNum(sectionOrGroupCounts['ব্যবসায় শিক্ষা'] || 0, lang)})
                  </option>
                </>
              ) : (
                <>
                  <option value="A">
                    {lang === 'bn' ? 'শাখা A' : 'Section A'} ({fmtNum(sectionOrGroupCounts.A || 0, lang)})
                  </option>
                  <option value="B">
                    {lang === 'bn' ? 'শাখা B' : 'Section B'} ({fmtNum(sectionOrGroupCounts.B || 0, lang)})
                  </option>
                  <option value="C">
                    {lang === 'bn' ? 'শাখা C' : 'Section C'} ({fmtNum(sectionOrGroupCounts.C || 0, lang)})
                  </option>
                  <option value="all">
                    {lang === 'bn' ? 'সকল শাখা' : 'All Sections'} ({fmtNum(sectionOrGroupCounts.all || 0, lang)})
                  </option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Bottom Row: Single-Line Segmented 3-Workspace + Active Report Pills */}
        <div className="px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {WORKSPACES.map((ws) => {
              const selected = activeWorkspace === ws.key;
              return (
                <button
                  key={ws.key}
                  type="button"
                  onClick={() => switchWorkspace(ws.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selected
                      ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? ws.bn : ws.en}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {ALL_VIEWS.filter((v) => v.workspace === activeWorkspace).map((view) => {
              const isCurrent = activeView === view.id;
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => switchView(view.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-300'
                  }`}
                >
                  {view.icon}
                  {lang === 'bn' ? view.labelBn : view.labelEn}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. UNIFIED REPORT STAGE OR SINGLE FOCUSED EMPTY STATE */}
      {snapshot.cohortStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xs print:hidden">
          <div className="max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users size={26} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'bn'
                  ? `${gradeLabel} (${sectionLabel})-এ এখনো কোনো শিক্ষার্থী নেই`
                  : `No students enrolled in ${gradeLabel} (${sectionLabel})`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {populatedMeta.cohorts.length > 0
                  ? lang === 'bn'
                    ? 'নিচের যে শ্রেণিতে শিক্ষার্থী রয়েছে সেখানে এক ক্লিকে যান অথবা এই শ্রেণিতে শিক্ষার্থী যোগ করুন।'
                    : 'Jump directly to a populated cohort below, or add students to this cohort.'
                  : lang === 'bn'
                  ? 'ফলাফল, টেবুলেশন ও পরিসংখ্যান দেখতে প্রথমে শিক্ষার্থী তালিকা বা বাল্ক ইমপোর্ট থেকে শিক্ষার্থী যুক্ত করুন।'
                  : 'Add students manually or via bulk import to unlock transcripts, tabulation, and subject analytics.'}
              </p>
            </div>

            {populatedMeta.cohorts.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  {lang === 'bn' ? 'শিক্ষার্থী থাকা শ্রেণিসমূহ' : 'Available Populated Cohorts'}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {populatedMeta.cohorts.map((c) => {
                    const gTxt = GRADE_LABELS[c.grade]?.[lang] || c.grade;
                    const secTxt = c.grade === '9th' || c.grade === '10th' ? c.group : `${lang === 'bn' ? 'শাখা' : 'Sec'} ${c.branch}`;
                    return (
                      <button
                        key={`${c.grade}_${c.branch}_${c.group}`}
                        type="button"
                        onClick={() => {
                          userPickedCohortRef.current = true;
                          setSelectedGrade(c.grade);
                          setSelectedBranch(c.branch);
                          setSelectedGroup(c.group);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-200 text-xs font-bold transition cursor-pointer"
                      >
                        {gTxt} • {secTxt} ({fmtNum(c.count, lang)})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/dashboard/students"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
              >
                <UserPlus size={14} />
                {lang === 'bn' ? 'শিক্ষার্থী যোগ করুন' : 'Add Students'}
              </Link>
              <Link
                href="/dashboard/students/bulk-import"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold"
              >
                <Upload size={14} />
                {lang === 'bn' ? 'বাল্ক আপলোড (Excel/CSV)' : 'Bulk Upload'}
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          {(activeView === 'single_transcript' || activeView === 'batch_transcript') && (
            <TranscriptWorkspace
              mode={activeView}
              examTitle={selectedExam}
              grade={selectedGrade}
              branch={selectedBranch === 'all' ? 'A' : selectedBranch}
              group={effectiveGroup}
              lang={lang}
              students={snapshot.cohortStudents}
              rankedResults={snapshot.rankedResults}
              subjectHighestMap={snapshot.subjectHighestMap}
              settings={settings}
              borderImageUrl={borderImageUrl}
              showHighestStats={showHighestStats}
              onToggleHighestStats={setShowHighestStats}
            />
          )}

          {activeView === 'tabulation' && (
            <TabulationMatrixView
              examTitle={selectedExam}
              gradeLabel={gradeLabel}
              sectionLabel={sectionLabel}
              lang={lang}
              settings={settings}
              subjects={snapshot.subjects}
              rankedResults={snapshot.rankedResults}
              hideHeader={hideHeader}
            />
          )}

          {activeView === 'merit_list' && (
            <MeritListView
              examTitle={selectedExam}
              gradeLabel={gradeLabel}
              sectionLabel={sectionLabel}
              lang={lang}
              settings={settings}
              rankedResults={snapshot.rankedResults}
              tieBreakers={tieBreakers}
              hideHeader={hideHeader}
              onOpenTieBreakers={() => setShowTieModal(true)}
            />
          )}

          {activeView === 'fail_list' && (
            <FailAnalysisView
              examTitle={selectedExam}
              gradeLabel={gradeLabel}
              sectionLabel={sectionLabel}
              lang={lang}
              settings={settings}
              rankedResults={snapshot.rankedResults}
              hideHeader={hideHeader}
              minFailCount={minFailCount}
              onChangeMinFailCount={setMinFailCount}
            />
          )}

          {activeView === 'full_register' && (
            <FullResultRegisterView
              examTitle={selectedExam}
              gradeLabel={gradeLabel}
              sectionLabel={sectionLabel}
              lang={lang}
              settings={settings}
              rankedResults={snapshot.rankedResults}
              tieBreakers={tieBreakers}
              hideHeader={hideHeader}
              onOpenTieBreakers={() => setShowTieModal(true)}
            />
          )}

          {activeView === 'class_summary' && (
            <ClassSectionSummaryView
              examTitle={selectedExam}
              gradeLabel={gradeLabel}
              sectionLabel={sectionLabel}
              lang={lang}
              settings={settings}
              rows={snapshot.classSummaryRows}
              hideHeader={hideHeader}
            />
          )}

          {activeView === 'subject_wise' && (
            <SubjectWiseAnalysisView
              examTitle={selectedExam}
              gradeLabel={gradeLabel}
              sectionLabel={sectionLabel}
              lang={lang}
              settings={settings}
              subjects={snapshot.subjects}
              selectedSubjectCode={activeSubject ? String(activeSubject.code) : ''}
              onSelectSubjectCode={setSelectedSubjectCode}
              report={subjectWiseReport}
              hideHeader={hideHeader}
            />
          )}

          {activeView === 'all_subjects_heatmap' && (
            <AllSubjectsHeatmapView
              examTitle={selectedExam}
              gradeLabel={gradeLabel}
              sectionLabel={sectionLabel}
              lang={lang}
              settings={settings}
              summary={snapshot.allSubjectsSummary}
              hideHeader={hideHeader}
              onInspectSubject={(code) => {
                setSelectedSubjectCode(String(code));
                switchView('subject_wise');
              }}
            />
          )}
        </>
      )}

      {/* Configuration Modals */}
      <TieBreakerOrderModal
        key={`tie_${showTieModal}`}
        isOpen={showTieModal}
        initialRules={tieBreakers}
        lang={lang}
        onSave={(next) => {
          setTieBreakers(next);
          saveTieBreakerRules(next);
          showToast(
            lang === 'bn' ? 'মেধাক্রম ও টাই-ব্রেকার নিয়ম সংরক্ষিত হয়েছে।' : 'Tie-breaker priority updated.',
            'success',
          );
        }}
        onClose={() => setShowTieModal(false)}
      />

      <SubjectOrderModal
        key={`sub_${selectedGrade}_${effectiveGroup}_${showSubjectOrderModal}`}
        isOpen={showSubjectOrderModal}
        subjects={snapshot.subjects}
        defaultSubjects={defaultSubjects}
        lang={lang}
        onSave={(codes) => {
          setSubjectOrderCodes(codes);
          saveSubjectOrder(selectedGrade, effectiveGroup, codes);
          showToast(
            lang === 'bn' ? 'বিষয়ের কলাম ক্রম সংরক্ষিত হয়েছে।' : 'Subject order updated.',
            'success',
          );
        }}
        onClose={() => setShowSubjectOrderModal(false)}
      />
    </div>
  );
}

export default function ResultAnalyticsStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm font-bold text-slate-400">
          ফলাফল স্টুডিও লোড হচ্ছে...
        </div>
      }
    >
      <ResultStudioContent />
    </Suspense>
  );
}
