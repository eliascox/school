'use client';

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 📊 SCHOOLPRO — UNIFIED RESULT ANALYTICS & REPORTS STUDIO (/dashboard/exam/results)
 * ─────────────────────────────────────────────────────────────────────────────
 * 3 Semantic Workspaces × 9 Academic Reports powered by the centralized
 * NCTB grading & pass-evaluation engine (zero duplicate math).
 * ═════════════════════════════════════════════════════════════════════════════
 */

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  ClipboardList,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Layers,
  ListOrdered,
  Printer,
  SlidersHorizontal,
  Trophy,
  XCircle,
} from 'lucide-react';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import {
  buildFailList,
  buildSubjectWiseReport,
  computeCohortSnapshot,
  DEFAULT_TIE_BREAKER_RULES,
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
import { GRADE_LABELS } from '@/components/results/resultStudioShared';
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
    labelBn: 'সব শিক্ষার্থীর ট্রান্সক্রিপ্ট',
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
    labelBn: 'বিষয়ভিত্তিক ফলাফল',
    labelEn: 'Subject Analysis',
    icon: <BookOpen size={14} />,
  },
  {
    id: 'all_subjects_heatmap',
    workspace: 'analytics',
    labelBn: 'সব বিষয়ের সারসংক্ষেপ',
    labelEn: 'All Subjects Matrix',
    icon: <Award size={14} />,
  },
];

const WORKSPACES: Array<{ key: WorkspaceKey; bn: string; en: string }> = [
  { key: 'transcripts', bn: '১. শিক্ষার্থী ট্রান্সক্রিপ্ট', en: '1. Transcripts' },
  { key: 'registers', bn: '২. শ্রেণি রেজিস্টার ও মেধা', en: '2. Registers & Rank' },
  { key: 'analytics', bn: '৩. সারসংক্ষেপ ও বিষয় বিশ্লেষণ', en: '3. Summaries & Subjects' },
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

  const loadWorkspaceData = useCallback(() => {
    const s = settingsService.getSettings();
    setSettings(s);
    const savedBorder = typeof window !== 'undefined' ? window.localStorage.getItem('sms_marksheet_border_png') : null;
    setBorderImageUrl(savedBorder || s.customBorderPng || '');

    const loadedExams = examService.getExams();
    setExams(loadedExams);
    if (loadedExams.length > 0) {
      setSelectedExam((prev) =>
        loadedExams.some((ex) => ex.title === prev) ? prev : loadedExams[0].title,
      );
    }
    setStudents(studentService.getAllStudents());
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
      <div className="p-8 space-y-4">
        <div className="h-24 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-96 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12 print:p-0 print:m-0 print:space-y-0">
      {/* Studio Command Header & Filter Ribbon */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider">
                SchoolPro Analytics Engine
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {lang === 'bn' ? '৯-ইন-১ ফলাফল ও বিশ্লেষণ কেন্দ্র' : '9-in-1 Academic Reports Studio'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              {lang === 'bn' ? 'সমন্বিত ফলাফল ও পরিসংখ্যান স্টুডিও' : 'Result Analytics & Reports Studio'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next: AppLanguage = lang === 'bn' ? 'en' : 'bn';
                languageService.setLanguage(next);
                settingsService.updateSettings({ language: next });
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-black cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {lang === 'bn' ? 'English UI' : 'বাংলা UI'}
            </button>

            <button
              type="button"
              onClick={() => setHideHeader((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {hideHeader ? <Eye size={14} /> : <EyeOff size={14} />}
              {hideHeader
                ? lang === 'bn'
                  ? 'প্যাড হেডার দেখান'
                  : 'Show Header'
                : lang === 'bn'
                ? 'প্রি-প্রিন্টেড প্যাড (হেডার ছাড়া)'
                : 'Hide Header'}
            </button>

            <button
              type="button"
              onClick={() => setShowSubjectOrderModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <ListOrdered size={14} />
              {lang === 'bn' ? 'বিষয়ের ক্রম' : 'Subject Order'}
            </button>

            <button
              type="button"
              onClick={() => setShowTieModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <SlidersHorizontal size={14} />
              {lang === 'bn' ? 'মেধাক্রম নিয়ম' : 'Tie-Breakers'}
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer"
            >
              <FileSpreadsheet size={14} />
              Excel (.xlsx)
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs cursor-pointer"
            >
              <Printer size={14} />
              {lang === 'bn' ? 'প্রিন্ট / PDF' : 'Print / PDF'}
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs font-bold">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {lang === 'bn' ? '১. পরীক্ষা' : '1. Examination'}
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white cursor-pointer"
            >
              {examOptions.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {lang === 'bn' ? '২. শ্রেণি' : '2. Class'}
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => {
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
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white cursor-pointer"
            >
              {Object.entries(GRADE_LABELS).map(([key, labels]) => (
                <option key={key} value={key}>
                  {lang === 'bn' ? labels.bn : labels.en}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {isClass9or10
                ? lang === 'bn'
                  ? '৩. বিভাগ (Group)'
                  : '3. Group'
                : lang === 'bn'
                ? '৩. শাখা (Section)'
                : '3. Section'}
            </label>
            <select
              value={isClass9or10 ? effectiveGroup : selectedBranch}
              onChange={(e) => {
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
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white cursor-pointer"
            >
              {isClass9or10 ? (
                <>
                  <option value="বিজ্ঞান">{lang === 'bn' ? 'বিজ্ঞান বিভাগ' : 'Science'}</option>
                  <option value="মানবিক">{lang === 'bn' ? 'মানবিক বিভাগ' : 'Humanities'}</option>
                  <option value="ব্যবসায় শিক্ষা">{lang === 'bn' ? 'ব্যবসায় শিক্ষা' : 'Business Studies'}</option>
                </>
              ) : (
                <>
                  <option value="A">{lang === 'bn' ? 'শাখা A' : 'Section A'}</option>
                  <option value="B">{lang === 'bn' ? 'শাখা B' : 'Section B'}</option>
                  <option value="C">{lang === 'bn' ? 'শাখা C' : 'Section C'}</option>
                  <option value="all">{lang === 'bn' ? 'সকল শাখা (একত্রে)' : 'All Sections'}</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {lang === 'bn' ? '৪. পাস মূল্যায়ন নিয়ম' : '4. Pass Evaluation Mode'}
            </label>
            <select
              value={passMode}
              onChange={(e) => setPassMode(e.target.value as PassEvaluationMode)}
              className="w-full px-3 py-2 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 cursor-pointer"
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
        </div>

        {/* 3 Workspaces + Pill Sub-Views */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {WORKSPACES.map((ws) => {
              const selected = activeWorkspace === ws.key;
              return (
                <button
                  key={ws.key}
                  type="button"
                  onClick={() => switchWorkspace(ws.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    selected
                      ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {lang === 'bn' ? ws.bn : ws.en}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {ALL_VIEWS.filter((v) => v.workspace === activeWorkspace).map((view) => {
              const isCurrent = activeView === view.id;
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => switchView(view.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200 font-black'
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
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

      {/* Empty Cohort Warning Banner */}
      {snapshot.cohortStudents.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex items-center gap-3 text-xs font-bold text-amber-900 dark:text-amber-200 print:hidden">
          <AlertTriangle size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            {lang === 'bn'
              ? `${gradeLabel} (${sectionLabel})-এ এখনো কোনো নিবন্ধিত শিক্ষার্থী পাওয়া যায়নি। প্রথমে শিক্ষার্থী যোগ করুন বা শ্রেণি/শাখা পরিবর্তন করুন।`
              : `No students found in ${gradeLabel} (${sectionLabel}). Enroll students or switch cohort filters above.`}
          </span>
        </div>
      )}

      {/* Active View Renderer */}
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
