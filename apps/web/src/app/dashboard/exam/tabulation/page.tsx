'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Eye,
  PanelLeftClose,
  PanelLeftOpen,
  Printer,
  SlidersHorizontal,
  Sparkles,
  ZoomIn,
} from 'lucide-react';
import { studentService, type Student } from '@/services/studentService';
import { settingsService, type SchoolSettings } from '@/services/settingsService';
import { examService } from '@/services/examService';
import { resultService } from '@/services/resultService';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import { triggerProfessionalPrint } from '@/lib/printPdfUtils';
import { toBanglaDigits } from '@/lib/omr/omrTemplates';
import { RANK_GRADE_BN_MAP } from '@/lib/rankResultUtils';
import {
  formatAdmitExamTitle,
  summarizeAdmitScopes,
} from '@/lib/admitCardStudioUtils';
import {
  DEFAULT_TABULATION_COLUMNS,
  TABULATION_PAPER_SPECS,
  type TabulationColumnOptions,
  type TabulationDocLang,
  type TabulationGradeId,
  type TabulationGroupBn,
  type TabulationPaperSize,
  type TabulationStatusFilter,
  type TabulationSubjectSpec,
  assignTabulationMeritPositions,
  buildSampleTabulationRows,
  buildTabulationExcelRows,
  buildTabulationRow,
  computeTabulationSummary,
  filterTabulationStudents,
} from '@/lib/tabulationStudioUtils';
import { TabulationControlRail } from '@/components/exam/TabulationControlRail';
import { TabulationSheetView } from '@/components/exam/TabulationSheetView';

const ZOOM_PRESETS = [75, 85, 100] as const;

export default function DynamicTabulationSheetPage() {
  const [mounted, setMounted] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [examOptions, setExamOptions] = useState<string[]>([
    'অর্ধ-বার্ষিক পরীক্ষা ২০২৬',
    'বার্ষিক পরীক্ষা ২০২৬',
  ]);
  const [selectedExam, setSelectedExam] = useState('অর্ধ-বার্ষিক পরীক্ষা ২০২৬');
  const [selectedGrade, setSelectedGrade] = useState<TabulationGradeId>('8th');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [selectedGroup, setSelectedGroup] = useState<TabulationGroupBn>('বিজ্ঞান');
  const [statusFilter, setStatusFilter] = useState<TabulationStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Print & Display Controls
  const [paperSize, setPaperSize] = useState<TabulationPaperSize>('legal');
  const [docLang, setDocLang] = useState<TabulationDocLang>('bn');
  const [columns, setColumns] = useState<TabulationColumnOptions>(DEFAULT_TABULATION_COLUMNS);
  const [zoomPercent, setZoomPercent] = useState<number>(85);
  const [samplePreview, setSamplePreview] = useState(false);

  // Split-Pane Visibility
  const [railVisible, setRailVisible] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);

    const initialStudents = studentService.getAllStudents();
    setAllStudents(initialStudents);
    setSchoolSettings(settingsService.getSettings());

    // Smart auto-select first populated class/section/group
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
        new Set(active.map((e) => e.title?.trim()).filter((t): t is string => Boolean(t))),
      );
      if (titles.length > 0) {
        setExamOptions(titles);
        setSelectedExam((prev) => (titles.includes(prev) ? prev : titles[0]));
      }
    };
    syncExams();

    const unsubStudents = studentService.subscribe(() => {
      setAllStudents(studentService.getAllStudents());
    });
    const unsubSettings = settingsService.subscribe((next) => {
      if (next) setSchoolSettings(next);
    });
    const unsubExams = examService.subscribe(() => syncExams());

    return () => {
      unsubStudents();
      unsubSettings();
      unsubExams();
    };
  }, []);

  const isClass9or10 = selectedGrade === '9th' || selectedGrade === '10th';
  const scopeSummary = useMemo(() => summarizeAdmitScopes(allStudents), [allStudents]);

  const configuredSubjects: TabulationSubjectSpec[] = useMemo(() => {
    if (!mounted) return [];
    const list = getActiveCurriculumSubjects(selectedGrade, isClass9or10 ? selectedGroup : 'সাধারণ');
    return list.map(
      (s: {
        code: string;
        name: string;
        fullMarks?: number;
        isJointPass?: boolean;
        jointPairCode?: string;
      }) => ({
        code: s.code,
        name: s.name,
        fullMarks: s.fullMarks || 100,
        isJointPass: Boolean(s.isJointPass),
        jointPairCode: s.jointPairCode,
      }),
    );
  }, [mounted, selectedGrade, selectedGroup, isClass9or10]);

  const scopedStudents = useMemo(
    () =>
      filterTabulationStudents({
        allStudents,
        grade: selectedGrade,
        section: selectedSection,
        groupBn: selectedGroup,
      }),
    [allStudents, selectedGrade, selectedSection, selectedGroup],
  );

  // Evaluate all students in scope & compute official class merit
  const evaluatedRows = useMemo(() => {
    if (!mounted) return [];
    const rawRows = scopedStudents.map((st) => {
      const branchArg = isClass9or10
        ? st.groupBn === 'বিজ্ঞান'
          ? 'Science'
          : st.groupBn === 'মানবিক'
          ? 'Humanities'
          : 'Commerce'
        : st.sectionNorm;
      const evaluated = resultService.calculateStudentResult({
        examId: selectedExam,
        student: {
          id: st.id,
          roll: st.roll,
          name: st.name,
          optionalSubject: st.optionalSubject,
          religion: st.religion,
        },
        grade: selectedGrade,
        branch: branchArg,
        group: isClass9or10 ? st.groupBn : 'সাধারণ',
      });
      return buildTabulationRow(st, evaluated, configuredSubjects);
    });
    return assignTabulationMeritPositions(rawRows);
  }, [mounted, scopedStudents, selectedExam, selectedGrade, isClass9or10, configuredSubjects]);

  // Apply Sample Preview when real class is empty
  const baseRows = useMemo(() => {
    if (samplePreview && evaluatedRows.length === 0) {
      return buildSampleTabulationRows(
        selectedGrade,
        selectedSection,
        selectedGroup,
        configuredSubjects,
      );
    }
    return evaluatedRows;
  }, [
    samplePreview,
    evaluatedRows,
    selectedGrade,
    selectedSection,
    selectedGroup,
    configuredSubjects,
  ]);

  // Filter by pass/fail status & search query
  const displayedRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return baseRows.filter((r) => {
      if (statusFilter === 'pass' && r.hasFailed) return false;
      if (statusFilter === 'fail' && !r.hasFailed) return false;
      if (
        q &&
        !r.name.toLowerCase().includes(q) &&
        !(r.nameEn || '').toLowerCase().includes(q) &&
        !r.roll.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [baseRows, statusFilter, searchQuery]);

  const summary = useMemo(() => computeTabulationSummary(displayedRows), [displayedRows]);

  const handleToggleColumn = (key: keyof TabulationColumnOptions) => {
    setColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportExcel = async () => {
    if (displayedRows.length === 0) return;
    const XLSX = await import('xlsx');
    const excelRows = buildTabulationExcelRows({
      rows: displayedRows,
      subjects: configuredSubjects,
      lang: docLang,
      columns,
    });
    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tabulation');
    const examSlug = formatAdmitExamTitle(selectedExam, 'en').replace(/[^A-Za-z0-9]+/g, '_');
    const scopeSlug = isClass9or10 ? selectedGroup : `Sec_${selectedSection}`;
    XLSX.writeFile(wb, `Tabulation_${selectedGrade}_${scopeSlug}_${examSlug}.xlsx`);
  };

  const handlePrint = () => {
    const examLabel = formatAdmitExamTitle(selectedExam, docLang);
    triggerProfessionalPrint([
      docLang === 'en' ? 'Tabulation Sheet' : 'টেবুলেশন শিট',
      examLabel,
      RANK_GRADE_BN_MAP[selectedGrade],
      isClass9or10 ? selectedGroup : `Section ${selectedSection}`,
    ]);
  };

  const paperSpec = TABULATION_PAPER_SPECS[paperSize];

  if (!mounted) {
    return (
      <div className="max-w-[98%] mx-auto py-16" suppressHydrationWarning>
        <div className="animate-pulse space-y-6">
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-full pb-12 print:p-0 print:m-0 font-sans text-slate-900 dark:text-white"
      suppressHydrationWarning
    >
      {/* DYNAMIC LANDSCAPE PRINT PAGE STYLES (A4 / Legal / A3) */}
      <style>{`
        @media print {
          @page {
            size: ${paperSpec.cssPageSize} !important;
            margin: 5mm !important;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .tabulation-zoom-wrapper {
            font-size: 100% !important;
          }
          .tabulation-print-table thead {
            display: table-header-group !important;
          }
          .tabulation-print-table tr,
          .tabulation-signature-block {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
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
            <TabulationControlRail
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
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              paperSize={paperSize}
              onPaperSizeChange={setPaperSize}
              docLang={docLang}
              onDocLangChange={setDocLang}
              columns={columns}
              onToggleColumn={handleToggleColumn}
              summary={summary}
              onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* SPLIT-PANE MASTER TABULATION STUDIO */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-5 print:block">
        {/* Desktop Collapsible Left Rail */}
        {railVisible && (
          <div className="hidden lg:block sticky top-4 print:hidden">
            <TabulationControlRail
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
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              paperSize={paperSize}
              onPaperSizeChange={setPaperSize}
              docLang={docLang}
              onDocLangChange={setDocLang}
              columns={columns}
              onToggleColumn={handleToggleColumn}
              summary={summary}
            />
          </div>
        )}

        {/* Right Wide Tabulation Canvas */}
        <div className="w-full flex-1 min-w-0 max-w-full space-y-4 print:space-y-0">
          {/* Compact Top Action Bar */}
          <div className="bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2.5 print:hidden">
            {/* Left: Rail Toggle + Scope Info */}
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <button
                type="button"
                onClick={() => setRailVisible((v) => !v)}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition"
              >
                {railVisible ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
                <span>{railVisible ? 'প্যানেল' : 'ফিল্টার'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-black cursor-pointer"
              >
                <SlidersHorizontal size={14} /> ফিল্টার ও পেইজ
              </button>

              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-[#0B5D3B] dark:text-emerald-300 text-xs font-black border border-emerald-200/70 dark:border-emerald-800/60">
                {RANK_GRADE_BN_MAP[selectedGrade]} •{' '}
                {isClass9or10 ? `${selectedGroup} বিভাগ` : `শাখা ${selectedSection}`}
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-xs font-bold border border-amber-200/70 dark:border-amber-800/60">
                {paperSpec.labelBn} • {toBanglaDigits(configuredSubjects.length)} বিষয়
              </span>
            </div>

            {/* Right: Zoom + Sample + Excel + Print */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Screen Fit-to-Page Zoom */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <ZoomIn size={13} className="text-slate-500 ml-0.5" />
                {ZOOM_PRESETS.map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZoomPercent(z)}
                    className={`px-2 py-0.5 rounded-lg text-[10.5px] font-black cursor-pointer transition ${
                      zoomPercent === z
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {z}%
                  </button>
                ))}
              </div>

              {evaluatedRows.length === 0 && (
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

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={displayedRows.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black transition cursor-pointer whitespace-nowrap"
              >
                <Download size={13} /> Excel (.xlsx)
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={displayedRows.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] disabled:bg-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Printer size={14} /> টেবুলেশন প্রিন্ট / PDF
              </button>
            </div>
          </div>

          {samplePreview && evaluatedRows.length === 0 && (
            <div className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200 text-xs font-bold flex flex-wrap items-center justify-between gap-2 print:hidden">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-600" />
                বর্তমান শ্রেণিতে শিক্ষার্থী না থাকায় ৪ জন শিক্ষার্থীর নমুনা টেবুলেশন শিট দেখানো হচ্ছে।
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

          {/* LIVE PRESS-GRADE TABULATION SHEET */}
          <TabulationSheetView
            rows={displayedRows}
            subjects={configuredSubjects}
            summary={summary}
            settings={schoolSettings}
            selectedExam={selectedExam}
            selectedGrade={selectedGrade}
            selectedSection={selectedSection}
            selectedGroup={selectedGroup}
            docLang={docLang}
            columns={columns}
            zoomPercent={zoomPercent}
            onEnableSamplePreview={() => setSamplePreview(true)}
          />
        </div>
      </div>
    </div>
  );
}
