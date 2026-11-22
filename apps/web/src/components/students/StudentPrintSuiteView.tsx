'use client';

import React, { useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  FileText,
  BarChart3,
  SlidersHorizontal,
  FileSpreadsheet,
  Printer,
  CheckSquare,
  GraduationCap,
  Building2,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  RotateCcw,
  RectangleVertical,
  RectangleHorizontal,
  ScrollText,
} from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';
import { sortStudentsGroupAndRoll, RollSortStrategy } from '@/services/studentBulkImportEngine';
import { AppLanguage } from '@/services/languageService';
import {
  STUDENT_PRINT_COLUMNS,
  StudentRecord,
  toBanglaNumeral,
  matchStudentReligion,
  isMaleGender,
  isFemaleGender,
  buildClassSummaryRows,
  buildPaginatedPrintSheets,
  exportPrintableStudentsCsv,
  exportClassSummaryCsv,
} from './studentTypes';

interface StudentPrintSuiteViewProps {
  students: StudentRecord[];
  schoolSettings: SchoolSettings;
  currentLang: AppLanguage;
  sortStrategy: string;
  studentMatchesSearch: (st: Partial<StudentRecord>, query: string) => boolean;
  printReportTab: 'detailed' | 'summary';
  setPrintReportTab: (tab: 'detailed' | 'summary') => void;
  printOrientation: 'portrait' | 'landscape';
  setPrintOrientation: (orientation: 'portrait' | 'landscape') => void;
  printMargin: 'normal' | 'wide' | 'compact';
  setPrintMargin: (margin: 'normal' | 'wide' | 'compact') => void;
  printRowsPerPage: number;
  setPrintRowsPerPage: (count: number) => void;
  showColumnSelector: boolean;
  setShowColumnSelector: (show: boolean) => void;
  selectedColumns: Record<string, boolean>;
  toggleColumn: (key: string) => void;
  setColumnPreset: (preset: 'basic' | 'contact' | 'official' | 'all') => void;
  printGradeFilter: string;
  setPrintGradeFilter: (v: string) => void;
  printBranchFilter: string;
  setPrintBranchFilter: (v: string) => void;
  printGroupFilter: string;
  setPrintGroupFilter: (v: string) => void;
  printReligionFilter: string;
  setPrintReligionFilter: (v: string) => void;
  printGenderFilter: string;
  setPrintGenderFilter: (v: string) => void;
  printStipendFilter: string;
  printSearchQuery: string;
  setPrintSearchQuery: (v: string) => void;
  printPreviewPage: number;
  setPrintPreviewPage: (page: number) => void;
  showAllPrintSheets: boolean;
  setShowAllPrintSheets: (show: boolean) => void;
  printPageMarginCss: string;
  printContentHeightCss: string;
  inPageSheetStyle: React.CSSProperties;
  onOpenBlankPad: () => void;
  onBackToList: () => void;
}

function buildPagePaginationTokens(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const tokens: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) tokens.push('ellipsis');
  for (let p = start; p <= end; p += 1) {
    tokens.push(p);
  }
  if (end < total - 1) tokens.push('ellipsis');
  tokens.push(total);
  return tokens;
}

export function StudentPrintSuiteView({
  students,
  schoolSettings,
  currentLang,
  sortStrategy,
  studentMatchesSearch,
  printReportTab,
  setPrintReportTab,
  printOrientation,
  setPrintOrientation,
  printMargin,
  setPrintMargin,
  printRowsPerPage,
  setPrintRowsPerPage,
  showColumnSelector,
  setShowColumnSelector,
  selectedColumns,
  toggleColumn,
  setColumnPreset,
  printGradeFilter,
  setPrintGradeFilter,
  printBranchFilter,
  setPrintBranchFilter,
  printGroupFilter,
  setPrintGroupFilter,
  printReligionFilter,
  setPrintReligionFilter,
  printGenderFilter,
  setPrintGenderFilter,
  printStipendFilter,
  printSearchQuery,
  setPrintSearchQuery,
  printPreviewPage,
  setPrintPreviewPage,
  showAllPrintSheets,
  setShowAllPrintSheets,
  printPageMarginCss,
  printContentHeightCss,
  inPageSheetStyle,
  onOpenBlankPad,
  onBackToList,
}: StudentPrintSuiteViewProps) {
  const isEn = currentLang === 'en';
  const currentYear = new Date().getFullYear();
  const currentYearBn = toBanglaNumeral(currentYear);

  // Close column selector drawer on Escape key
  useEffect(() => {
    if (!showColumnSelector) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowColumnSelector(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showColumnSelector, setShowColumnSelector]);

  const printableFilteredStudents = useMemo(() => {
    const raw = students.filter((st) => {
      const matchGrade =
        printGradeFilter === 'all' ||
        st.grade.toLowerCase() === printGradeFilter.toLowerCase() ||
        (printGradeFilter === '6th' && (st.grade.includes('6') || st.grade.includes('৬'))) ||
        (printGradeFilter === '7th' && (st.grade.includes('7') || st.grade.includes('৭'))) ||
        (printGradeFilter === '8th' && (st.grade.includes('8') || st.grade.includes('৮'))) ||
        (printGradeFilter === '9th' && (st.grade.includes('9') || st.grade.includes('৯'))) ||
        (printGradeFilter === '10th' && (st.grade.includes('10') || st.grade.includes('১০')));

      const matchBranch =
        printBranchFilter === 'all' ||
        (st.branch && st.branch.toLowerCase() === printBranchFilter.toLowerCase());
      const matchGroup = printGroupFilter === 'all' || (st.group && st.group.includes(printGroupFilter));
      const matchReligion = matchStudentReligion(st.religion, printReligionFilter);
      const matchGender =
        printGenderFilter === 'all' ||
        (printGenderFilter === 'পুরুষ' ? isMaleGender(st.gender) : isFemaleGender(st.gender));
      const matchStipend =
        printStipendFilter === 'all' || (printStipendFilter === 'stipend_only' && Boolean(st.isStipend));
      const matchSearch = studentMatchesSearch(st, printSearchQuery);

      return Boolean(
        matchGrade && matchBranch && matchGroup && matchReligion && matchGender && matchStipend && matchSearch
      );
    });

    const normalized = raw.map((st) => ({
      ...st,
      section: st.section || st.branch || 'A',
    }));
    return sortStudentsGroupAndRoll(normalized, 'roll_asc' as RollSortStrategy) as StudentRecord[];
  }, [
    students,
    printGradeFilter,
    printBranchFilter,
    printGroupFilter,
    printReligionFilter,
    printGenderFilter,
    printStipendFilter,
    printSearchQuery,
    sortStrategy,
    studentMatchesSearch,
  ]);

  const printTotalCount = printableFilteredStudents.length;
  const printMaleCount = useMemo(
    () => printableFilteredStudents.filter((s) => isMaleGender(s.gender)).length,
    [printableFilteredStudents]
  );
  const printFemaleCount = useMemo(
    () => printableFilteredStudents.filter((s) => isFemaleGender(s.gender)).length,
    [printableFilteredStudents]
  );
  const printMuslimCount = useMemo(
    () =>
      printableFilteredStudents.filter(
        (s) => s.religion && (s.religion.includes('ইসলাম') || s.religion.includes('Muslim'))
      ).length,
    [printableFilteredStudents]
  );
  const printHinduCount = useMemo(
    () =>
      printableFilteredStudents.filter(
        (s) =>
          s.religion &&
          (s.religion.includes('হিন্দু') || s.religion.includes('Hindu') || s.religion.includes('সনাতন'))
      ).length,
    [printableFilteredStudents]
  );
  const printStipendCount = useMemo(
    () => printableFilteredStudents.filter((s) => Boolean(s.isStipend)).length,
    [printableFilteredStudents]
  );

  const paginatedPrintSheets = useMemo(
    () => buildPaginatedPrintSheets(printableFilteredStudents, printOrientation, printRowsPerPage),
    [printableFilteredStudents, printOrientation, printRowsPerPage]
  );

  const totalPrintSheets = paginatedPrintSheets.length;
  const safePrintPreviewPage = Math.max(1, Math.min(printPreviewPage, totalPrintSheets));

  const paginationTokens = useMemo(
    () => buildPagePaginationTokens(safePrintPreviewPage, totalPrintSheets),
    [safePrintPreviewPage, totalPrintSheets]
  );

  const activeColumnCount = useMemo(
    () => Object.values(selectedColumns).filter(Boolean).length,
    [selectedColumns]
  );

  const goToPrintSheet = (pageNum: number) => {
    const nextP = Math.max(1, Math.min(totalPrintSheets, pageNum));
    setPrintPreviewPage(nextP);
    if (showAllPrintSheets && typeof document !== 'undefined') {
      const sheetEl = document.getElementById(`inpage-print-sheet-${nextP}`);
      if (sheetEl) sheetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const classSummaryData = useMemo(
    () => buildClassSummaryRows(students, printBranchFilter, printReligionFilter, printStipendFilter),
    [students, printBranchFilter, printReligionFilter, printStipendFilter]
  );

  const summaryTotalBoys = classSummaryData.reduce((sum, r) => sum + r.boys, 0);
  const summaryTotalGirls = classSummaryData.reduce((sum, r) => sum + r.girls, 0);
  const summaryGrandTotal = classSummaryData.reduce((sum, r) => sum + r.total, 0);

  const hasDetailedFilters =
    printGradeFilter !== 'all' ||
    printBranchFilter !== 'all' ||
    printGroupFilter !== 'all' ||
    printReligionFilter !== 'all' ||
    printGenderFilter !== 'all' ||
    printSearchQuery.trim().length > 0;

  const hasSummaryFilters = printBranchFilter !== 'all' || printReligionFilter !== 'all';
  const hasActiveFilters = printReportTab === 'detailed' ? hasDetailedFilters : hasSummaryFilters;

  const handleResetFilters = () => {
    if (printReportTab === 'detailed') {
      setPrintGradeFilter('all');
      setPrintBranchFilter('all');
      setPrintGroupFilter('all');
      setPrintReligionFilter('all');
      setPrintGenderFilter('all');
      setPrintSearchQuery('');
    } else {
      setPrintBranchFilter('all');
      setPrintReligionFilter('all');
    }
  };

  const handleOpenPrintOrPdf = () => {
    const params = new URLSearchParams();
    params.set('tab', printReportTab === 'summary' ? 'summary' : 'detailed');
    params.set('orientation', printOrientation);
    params.set('margin', printMargin);
    if (printRowsPerPage > 0) params.set('perPage', String(printRowsPerPage));
    const activeColKeys = Object.entries(selectedColumns)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(',');
    if (activeColKeys) params.set('cols', activeColKeys);
    if (printGradeFilter !== 'all') params.set('grade', printGradeFilter);
    if (printBranchFilter !== 'all') params.set('branch', printBranchFilter);
    if (printGroupFilter !== 'all') params.set('group', printGroupFilter);
    if (printReligionFilter !== 'all') params.set('religion', printReligionFilter);
    if (printGenderFilter !== 'all') params.set('gender', printGenderFilter);
    if (printSearchQuery.trim()) params.set('q', printSearchQuery.trim());
    params.set('year', String(currentYear));
    const opened = window.open(`/dashboard/students/print?${params.toString()}`, '_blank');
    if (!opened) {
      window.print();
    }
  };

  const marginSummaryLabel =
    printMargin === 'wide'
      ? isEn
        ? 'Wide (18mm)'
        : 'প্রশস্ত (১৮ মিমি)'
      : printMargin === 'compact'
        ? isEn
          ? 'Compact (8mm)'
          : 'কমপ্যাক্ট (৮ মিমি)'
        : isEn
          ? 'Standard (12mm)'
          : 'স্ট্যান্ডার্ড (১২ মিমি)';

  const filterSelectClass = (isActive: boolean) =>
    `h-8.5 px-2.5 rounded-xl border text-xs font-bold outline-none transition cursor-pointer ${
      isActive
        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-[#0B5D3B]/50 dark:border-emerald-700 text-[#0B5D3B] dark:text-emerald-200'
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#0B5D3B]'
    }`;

  const optionClass = 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white';

  const currentSheetMeta = paginatedPrintSheets[safePrintPreviewPage - 1];

  return (
    <div className="min-w-0 font-sans text-slate-900 dark:text-slate-100 print:block">
      {/* Dynamic A4 @page & Print CSS Injection (plain <style>, never styled-jsx) */}
      <style>{`
        @page {
          size: A4 ${printOrientation};
          margin: ${printPageMarginCss};
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .inpage-print-sheet {
            display: flex !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: ${printContentHeightCss} !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          .inpage-sheet-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }
          .print-table tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: auto !important;
          }
          .print-table thead {
            display: table-header-group !important;
          }
          .print-table th, .print-table td {
            border: 1px solid #1e293b !important;
          }
          .signature-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 📌 FLUSH STICKY PRINT STUDIO TOOLBAR (0px GAP UNDER MAIN HEADER)    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)] dark:shadow-none print:hidden">
        {/* ROW 1: Primary Studio Controls */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Back to List + Report Mode Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onBackToList}
              className="h-9 px-3 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              title="শিক্ষার্থী তালিকায় ফিরে যান"
            >
              <ArrowLeft size={14} className="text-slate-500 dark:text-slate-400 shrink-0" />
              <span>{isEn ? 'Back to List' : 'তালিকায় ফিরুন'}</span>
            </button>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            <div
              role="tablist"
              aria-label={isEn ? 'Report Mode' : 'রিপোর্টের ধরন'}
              className="h-9 inline-flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80"
            >
              <button
                type="button"
                role="tab"
                aria-selected={printReportTab === 'detailed'}
                onClick={() => {
                  setPrintReportTab('detailed');
                  setPrintOrientation('landscape');
                }}
                className={`h-7 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  printReportTab === 'detailed'
                    ? 'bg-[#0B5D3B] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText size={13} className="shrink-0" />
                <span>{isEn ? 'Detailed List' : 'বিস্তারিত তালিকা'}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={printReportTab === 'summary'}
                onClick={() => {
                  setPrintReportTab('summary');
                  setPrintOrientation('portrait');
                }}
                className={`h-7 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  printReportTab === 'summary'
                    ? 'bg-[#0B5D3B] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 size={13} className="shrink-0" />
                <span>{isEn ? 'Class Summary' : 'শ্রেণিভিত্তিক সারসংক্ষেপ'}</span>
              </button>
            </div>
          </div>

          {/* Right: Compact Page Setup + Exports + Primary Print/PDF */}
          <div className="flex flex-wrap items-center gap-1.5 justify-end">
            {/* Orientation Segmented Toggle */}
            <div
              role="group"
              aria-label={isEn ? 'Page Orientation' : 'পৃষ্ঠার দিকনির্দেশনা'}
              className="h-9 inline-flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80"
            >
              <button
                type="button"
                onClick={() => setPrintOrientation('portrait')}
                aria-pressed={printOrientation === 'portrait'}
                className={`h-7 px-2.5 rounded-lg text-xs inline-flex items-center gap-1 transition cursor-pointer whitespace-nowrap ${
                  printOrientation === 'portrait'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold'
                }`}
                title={isEn ? 'A4 Portrait' : 'A4 পোর্ট্রেট'}
              >
                <RectangleVertical size={13} className="shrink-0" />
                <span>{isEn ? 'Portrait' : 'পোর্ট্রেট'}</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintOrientation('landscape')}
                aria-pressed={printOrientation === 'landscape'}
                className={`h-7 px-2.5 rounded-lg text-xs inline-flex items-center gap-1 transition cursor-pointer whitespace-nowrap ${
                  printOrientation === 'landscape'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold'
                }`}
                title={isEn ? 'A4 Landscape' : 'A4 ল্যান্ডস্কেপ'}
              >
                <RectangleHorizontal size={13} className="shrink-0" />
                <span>{isEn ? 'Landscape' : 'ল্যান্ডস্কেপ'}</span>
              </button>
            </div>

            {/* Margin Selector */}
            <div className="h-9 inline-flex items-center gap-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs whitespace-nowrap">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {isEn ? 'Margin:' : 'মার্জিন:'}
              </span>
              <select
                aria-label={isEn ? 'Print Margin' : 'প্রিন্ট মার্জিন'}
                value={printMargin}
                onChange={(e) => setPrintMargin(e.target.value as 'normal' | 'wide' | 'compact')}
                className="bg-transparent text-slate-800 dark:text-slate-100 font-bold text-xs outline-none cursor-pointer"
              >
                <option value="normal" className={optionClass}>
                  {isEn ? '12mm (Standard)' : '১২ মিমি (স্ট্যান্ডার্ড)'}
                </option>
                <option value="wide" className={optionClass}>
                  {isEn ? '18mm (Wide)' : '১৮ মিমি (প্রশস্ত)'}
                </option>
                <option value="compact" className={optionClass}>
                  {isEn ? '8mm (Compact)' : '৮ মিমি (কমপ্যাক্ট)'}
                </option>
              </select>
            </div>

            {/* Rows-per-page Selector (Detailed mode) */}
            {printReportTab === 'detailed' && (
              <div className="h-9 inline-flex items-center gap-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs whitespace-nowrap">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {isEn ? 'Rows:' : 'পৃষ্ঠায়:'}
                </span>
                <select
                  aria-label={isEn ? 'Rows per page' : 'প্রতি পৃষ্ঠায় শিক্ষার্থী সংখ্যা'}
                  value={printRowsPerPage}
                  onChange={(e) => setPrintRowsPerPage(Number(e.target.value))}
                  className="bg-transparent text-slate-800 dark:text-slate-100 font-bold text-xs outline-none cursor-pointer"
                >
                  <option value={0} className={optionClass}>
                    {isEn
                      ? `Auto (${printOrientation === 'portrait' ? '24–28' : '15–18'})`
                      : `অটো (${printOrientation === 'portrait' ? '২৪–২৮' : '১৫–১৮'} জন)`}
                  </option>
                  <option value={15} className={optionClass}>
                    {isEn ? '15 rows' : '১৫ জন'}
                  </option>
                  <option value={20} className={optionClass}>
                    {isEn ? '20 rows' : '২০ জন'}
                  </option>
                  <option value={25} className={optionClass}>
                    {isEn ? '25 rows' : '২৫ জন'}
                  </option>
                  <option value={30} className={optionClass}>
                    {isEn ? '30 rows' : '৩০ জন'}
                  </option>
                </select>
              </div>
            )}

            {/* Column Selector Drawer Toggle (Detailed mode) */}
            {printReportTab === 'detailed' && (
              <button
                type="button"
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                aria-expanded={showColumnSelector}
                className={`h-9 px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border transition cursor-pointer whitespace-nowrap ${
                  showColumnSelector
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border-[#0B5D3B]/40 dark:border-emerald-700'
                    : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
                title="প্রিন্ট কলাম নির্বাচন করুন"
              >
                <SlidersHorizontal size={13} className="shrink-0" />
                <span>{isEn ? 'Columns' : 'কলাম'}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold leading-none ${
                    showColumnSelector
                      ? 'bg-[#0B5D3B] text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200'
                  }`}
                >
                  {isEn ? activeColumnCount : toBanglaNumeral(activeColumnCount)}
                </span>
                <ChevronDown
                  size={13}
                  className={`shrink-0 transition-transform duration-150 ${showColumnSelector ? 'rotate-180' : ''}`}
                />
              </button>
            )}

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 hidden md:block" />

            {/* CSV Export */}
            <button
              type="button"
              onClick={() =>
                printReportTab === 'summary'
                  ? exportClassSummaryCsv(classSummaryData, summaryTotalBoys, summaryTotalGirls, summaryGrandTotal)
                  : exportPrintableStudentsCsv(printableFilteredStudents, selectedColumns, printGradeFilter)
              }
              className="h-9 px-3 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              title="এক্সেল / CSV এক্সপোর্ট"
            >
              <FileSpreadsheet size={14} className="text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
              <span>CSV</span>
            </button>

            {/* Blank Pad Trigger */}
            <button
              type="button"
              onClick={onOpenBlankPad}
              className="h-9 px-3 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-[#0B5D3B] dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-800 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              title="ফাঁকা স্কুল প্যাড প্রিন্ট"
            >
              <ScrollText size={14} className="text-slate-500 dark:text-slate-400 shrink-0" />
              <span>{isEn ? 'Blank Pad' : 'ব্ল্যাংক প্যাড'}</span>
            </button>

            {/* Primary Emerald Print / PDF Action */}
            <button
              type="button"
              onClick={handleOpenPrintOrPdf}
              className="h-9 px-4 rounded-xl bg-[#0B5D3B] hover:bg-emerald-800 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer whitespace-nowrap"
            >
              <Printer size={14} className="shrink-0" />
              <span>{isEn ? 'Print / PDF' : 'প্রিন্ট / PDF'}</span>
            </button>
          </div>
        </div>

        {/* ROW 2: Tidy Single-Line Filter Strip + Quiet Inline Result Count */}
        <div className="border-t border-slate-100 dark:border-slate-800/90 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-2">
            {printReportTab === 'detailed' ? (
              <>
                {/* Class Filter */}
                <div className="inline-flex items-center gap-1.5">
                  <GraduationCap size={13} className="text-slate-400 hidden sm:block shrink-0" />
                  <select
                    aria-label={isEn ? 'Class Filter' : 'শ্রেণি ফিল্টার'}
                    value={printGradeFilter}
                    onChange={(e) => setPrintGradeFilter(e.target.value)}
                    className={filterSelectClass(printGradeFilter !== 'all')}
                  >
                    <option value="all" className={optionClass}>
                      {isEn ? 'All Classes' : 'সকল শ্রেণি'}
                    </option>
                    <option value="6th" className={optionClass}>
                      {isEn ? 'Class 6' : '৬ষ্ঠ শ্রেণি'}
                    </option>
                    <option value="7th" className={optionClass}>
                      {isEn ? 'Class 7' : '৭ম শ্রেণি'}
                    </option>
                    <option value="8th" className={optionClass}>
                      {isEn ? 'Class 8' : '৮ম শ্রেণি'}
                    </option>
                    <option value="9th" className={optionClass}>
                      {isEn ? 'Class 9' : '৯ম শ্রেণি'}
                    </option>
                    <option value="10th" className={optionClass}>
                      {isEn ? 'Class 10' : '১০ম শ্রেণি'}
                    </option>
                  </select>
                </div>

                {/* Section / Branch Filter */}
                <div className="inline-flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-400 hidden xl:block shrink-0" />
                  <select
                    aria-label={isEn ? 'Section Filter' : 'শাখা ফিল্টার'}
                    value={printBranchFilter}
                    onChange={(e) => setPrintBranchFilter(e.target.value)}
                    className={filterSelectClass(printBranchFilter !== 'all')}
                  >
                    <option value="all" className={optionClass}>
                      {isEn ? 'All Sections' : 'সকল শাখা'}
                    </option>
                    <option value="A" className={optionClass}>
                      {isEn ? 'Section A' : 'শাখা A'}
                    </option>
                    <option value="B" className={optionClass}>
                      {isEn ? 'Section B' : 'শাখা B'}
                    </option>
                    <option value="C" className={optionClass}>
                      {isEn ? 'Section C' : 'শাখা C'}
                    </option>
                  </select>
                </div>

                {/* Group Filter */}
                <select
                  aria-label={isEn ? 'Group Filter' : 'বিভাগ ফিল্টার'}
                  value={printGroupFilter}
                  onChange={(e) => setPrintGroupFilter(e.target.value)}
                  className={filterSelectClass(printGroupFilter !== 'all')}
                >
                  <option value="all" className={optionClass}>
                    {isEn ? 'All Groups' : 'সকল বিভাগ'}
                  </option>
                  <option value="সাধারণ" className={optionClass}>
                    {isEn ? 'General' : 'সাধারণ'}
                  </option>
                  <option value="বিজ্ঞান" className={optionClass}>
                    {isEn ? 'Science' : 'বিজ্ঞান'}
                  </option>
                  <option value="মানবিক" className={optionClass}>
                    {isEn ? 'Humanities' : 'মানবিক'}
                  </option>
                  <option value="ব্যবসায় শিক্ষা" className={optionClass}>
                    {isEn ? 'Business Studies' : 'ব্যবসায় শিক্ষা'}
                  </option>
                </select>

                {/* Religion Filter */}
                <select
                  aria-label={isEn ? 'Religion Filter' : 'ধর্ম ফিল্টার'}
                  value={printReligionFilter}
                  onChange={(e) => setPrintReligionFilter(e.target.value)}
                  className={filterSelectClass(printReligionFilter !== 'all')}
                >
                  <option value="all" className={optionClass}>
                    {isEn ? 'All Religions' : 'সকল ধর্ম'}
                  </option>
                  <option value="ইসলাম" className={optionClass}>
                    {isEn ? 'Islam' : 'ইসলাম'}
                  </option>
                  <option value="হিন্দু" className={optionClass}>
                    {isEn ? 'Hinduism' : 'হিন্দু'}
                  </option>
                  <option value="বৌদ্ধ" className={optionClass}>
                    {isEn ? 'Buddhism' : 'বৌদ্ধ'}
                  </option>
                  <option value="খ্রিস্টান" className={optionClass}>
                    {isEn ? 'Christianity' : 'খ্রিস্টান'}
                  </option>
                </select>

                {/* Gender Filter */}
                <select
                  aria-label={isEn ? 'Gender Filter' : 'লিঙ্গ ফিল্টার'}
                  value={printGenderFilter}
                  onChange={(e) => setPrintGenderFilter(e.target.value)}
                  className={filterSelectClass(printGenderFilter !== 'all')}
                >
                  <option value="all" className={optionClass}>
                    {isEn ? 'All Genders' : 'সকল লিঙ্গ'}
                  </option>
                  <option value="পুরুষ" className={optionClass}>
                    {isEn ? 'Boys / Male' : 'ছাত্র / পুরুষ'}
                  </option>
                  <option value="মহিলা" className={optionClass}>
                    {isEn ? 'Girls / Female' : 'ছাত্রী / মহিলা'}
                  </option>
                </select>

                {/* Search Input */}
                <div className="relative flex-1 min-w-[170px] max-w-[260px]">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={printSearchQuery}
                    onChange={(e) => setPrintSearchQuery(e.target.value)}
                    placeholder={isEn ? 'Search name, roll, mobile...' : 'নাম, রোল, মোবাইল খুঁজুন...'}
                    aria-label={isEn ? 'Search students' : 'শিক্ষার্থী অনুসন্ধান'}
                    className="w-full h-8.5 pl-8 pr-7 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#0B5D3B] focus:ring-2 focus:ring-emerald-600/15 transition"
                  />
                  {printSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setPrintSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      aria-label={isEn ? 'Clear search' : 'সার্চ মুছুন'}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Quiet Inline Result Count & Reset Cue */}
                <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
                  <div className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
                    <span>
                      {isEn ? 'Total:' : 'মোট'}{' '}
                      <strong className="font-mono font-extrabold text-slate-900 dark:text-white">
                        {isEn ? printTotalCount : toBanglaNumeral(printTotalCount)}
                      </strong>{' '}
                      {isEn ? '' : 'জন'}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700 hidden md:inline">·</span>
                    <span className="hidden md:inline text-[11px] text-slate-500 dark:text-slate-400">
                      {isEn ? 'Boys' : 'ছাত্র'}{' '}
                      <strong className="font-mono text-slate-700 dark:text-slate-200">
                        {isEn ? printMaleCount : toBanglaNumeral(printMaleCount)}
                      </strong>
                      {' · '}
                      {isEn ? 'Girls' : 'ছাত্রী'}{' '}
                      <strong className="font-mono text-slate-700 dark:text-slate-200">
                        {isEn ? printFemaleCount : toBanglaNumeral(printFemaleCount)}
                      </strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700 hidden 2xl:inline">·</span>
                    <span className="hidden 2xl:inline text-[11px] text-slate-500 dark:text-slate-400">
                      {isEn ? 'Muslim' : 'মুসলিম'}{' '}
                      <strong className="font-mono text-slate-700 dark:text-slate-200">
                        {isEn ? printMuslimCount : toBanglaNumeral(printMuslimCount)}
                      </strong>
                      {' · '}
                      {isEn ? 'Hindu' : 'হিন্দু'}{' '}
                      <strong className="font-mono text-slate-700 dark:text-slate-200">
                        {isEn ? printHinduCount : toBanglaNumeral(printHinduCount)}
                      </strong>
                      {printStipendCount > 0 && (
                        <>
                          {' · '}
                          {isEn ? 'Stipend' : 'উপবৃত্তি'}{' '}
                          <strong className="font-mono text-[#0B5D3B] dark:text-emerald-400">
                            {isEn ? printStipendCount : toBanglaNumeral(printStipendCount)}
                          </strong>
                        </>
                      )}
                    </span>
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="h-7 px-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <RotateCcw size={11} />
                      <span>{isEn ? 'Reset' : 'রিসেট'}</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Summary Mode Compact Filter Strip (Branch + Religion) */}
                <div className="inline-flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-400 shrink-0" />
                  <select
                    aria-label={isEn ? 'Section Filter' : 'শাখা ফিল্টার'}
                    value={printBranchFilter}
                    onChange={(e) => setPrintBranchFilter(e.target.value)}
                    className={filterSelectClass(printBranchFilter !== 'all')}
                  >
                    <option value="all" className={optionClass}>
                      {isEn ? 'All Sections' : 'সকল শাখা'}
                    </option>
                    <option value="A" className={optionClass}>
                      {isEn ? 'Section A' : 'শাখা A'}
                    </option>
                    <option value="B" className={optionClass}>
                      {isEn ? 'Section B' : 'শাখা B'}
                    </option>
                    <option value="C" className={optionClass}>
                      {isEn ? 'Section C' : 'শাখা C'}
                    </option>
                  </select>
                </div>

                <select
                  aria-label={isEn ? 'Religion Filter' : 'ধর্ম ফিল্টার'}
                  value={printReligionFilter}
                  onChange={(e) => setPrintReligionFilter(e.target.value)}
                  className={filterSelectClass(printReligionFilter !== 'all')}
                >
                  <option value="all" className={optionClass}>
                    {isEn ? 'All Religions' : 'সকল ধর্ম'}
                  </option>
                  <option value="ইসলাম" className={optionClass}>
                    {isEn ? 'Islam' : 'ইসলাম'}
                  </option>
                  <option value="হিন্দু" className={optionClass}>
                    {isEn ? 'Hinduism' : 'হিন্দু'}
                  </option>
                  <option value="বৌদ্ধ" className={optionClass}>
                    {isEn ? 'Buddhism' : 'বৌদ্ধ'}
                  </option>
                  <option value="খ্রিস্টান" className={optionClass}>
                    {isEn ? 'Christianity' : 'খ্রিস্টান'}
                  </option>
                </select>

                <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
                  <div className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
                    <span>
                      {isEn ? 'Grand Total:' : 'সর্বমোট'}{' '}
                      <strong className="font-mono font-extrabold text-slate-900 dark:text-white">
                        {isEn ? summaryGrandTotal : toBanglaNumeral(summaryGrandTotal)}
                      </strong>{' '}
                      {isEn ? '' : 'জন'}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isEn ? 'Boys' : 'ছাত্র'}{' '}
                      <strong className="font-mono text-slate-700 dark:text-slate-200">
                        {isEn ? summaryTotalBoys : toBanglaNumeral(summaryTotalBoys)}
                      </strong>
                      {' · '}
                      {isEn ? 'Girls' : 'ছাত্রী'}{' '}
                      <strong className="font-mono text-slate-700 dark:text-slate-200">
                        {isEn ? summaryTotalGirls : toBanglaNumeral(summaryTotalGirls)}
                      </strong>
                    </span>
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="h-7 px-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <RotateCcw size={11} />
                      <span>{isEn ? 'Reset' : 'রিসেট'}</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* COLLAPSIBLE COLUMN SELECTOR DRAWER (Detailed mode) */}
        {printReportTab === 'detailed' && showColumnSelector && (
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-950/95">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <CheckSquare size={15} className="text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {isEn ? 'Select Print Columns' : 'প্রিন্ট কলাম নির্বাচন'}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                    — {isEn ? 'Toggle columns included in print & CSV' : 'প্রিন্ট ও CSV-এ রাখার কলামগুলো বাছাই করুন'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 mr-0.5">
                    {isEn ? 'Presets:' : 'প্রিসেট:'}
                  </span>
                  {(
                    [
                      { id: 'basic', labelBn: 'বেসিক তালিকা', labelEn: 'Basic' },
                      { id: 'contact', labelBn: 'যোগাযোগ ও অভিভাবক', labelEn: 'Contact' },
                      { id: 'official', labelBn: 'অফিশিয়াল রেজিস্টার', labelEn: 'Official Register' },
                      { id: 'all', labelBn: 'সব কলাম অন', labelEn: 'All Columns' },
                    ] as const
                  ).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setColumnPreset(preset.id)}
                      className={`h-7 px-2.5 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                        preset.id === 'all'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-[#0B5D3B] dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isEn ? preset.labelEn : preset.labelBn}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setShowColumnSelector(false)}
                    className="h-7 w-7 ml-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 inline-flex items-center justify-center transition cursor-pointer"
                    aria-label={isEn ? 'Close column selector' : 'কলাম প্যানেল বন্ধ করুন'}
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {STUDENT_PRINT_COLUMNS.map((col) => {
                  const checked = Boolean(selectedColumns[col.key]);
                  return (
                    <label
                      key={col.key}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs transition ${
                        col.required ? 'cursor-not-allowed opacity-85' : 'cursor-pointer'
                      } ${
                        checked
                          ? 'bg-white dark:bg-slate-900 border-[#0B5D3B]/50 dark:border-emerald-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                          : 'bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleColumn(col.key)}
                        disabled={col.required}
                        className="w-3.5 h-3.5 accent-[#0B5D3B] rounded cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="text-[11px] truncate">{isEn ? col.labelEn : col.labelBn}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 📄 AUTHENTIC PAPER-LIKE A4 PREVIEW CANVAS & PAGE NAVIGATION         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-100/90 dark:bg-slate-950/90 min-h-[calc(100vh-148px)] py-6 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0 print:min-h-0">
        <div className="max-w-[1600px] mx-auto space-y-5 print:max-w-none print:space-y-0">
          {/* Calm Accessible Page Navigation Bar */}
          {printReportTab === 'detailed' ? (
            <div
              role="navigation"
              aria-label={isEn ? 'Print sheet pagination' : 'প্রিন্ট পৃষ্ঠা নেভিগেশন'}
              className="max-w-[297mm] mx-auto bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden"
            >
              {/* Left: Paper Setup Metadata */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold border border-slate-200/70 dark:border-slate-700">
                  {printOrientation === 'landscape' ? (
                    <RectangleHorizontal size={13} className="text-[#0B5D3B] dark:text-emerald-400" />
                  ) : (
                    <RectangleVertical size={13} className="text-[#0B5D3B] dark:text-emerald-400" />
                  )}
                  <span>
                    A4 {printOrientation === 'landscape' ? (isEn ? 'Landscape' : 'ল্যান্ডস্কেপ') : isEn ? 'Portrait' : 'পোর্ট্রেট'}
                  </span>
                </span>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                <span className="hidden sm:inline font-medium text-slate-500 dark:text-slate-400">
                  {isEn ? 'Margin:' : 'মার্জিন:'} <strong className="text-slate-700 dark:text-slate-200">{marginSummaryLabel}</strong>
                </span>
                {currentSheetMeta && currentSheetMeta.rows.length > 0 && !showAllPrintSheets && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700 hidden md:inline">•</span>
                    <span className="hidden md:inline font-medium text-slate-500 dark:text-slate-400">
                      {isEn ? 'Serial:' : 'ক্রম:'}{' '}
                      <strong className="font-mono text-slate-700 dark:text-slate-200">
                        {toBanglaNumeral(currentSheetMeta.rows[0].globalIndex)}–
                        {toBanglaNumeral(currentSheetMeta.rows[currentSheetMeta.rows.length - 1].globalIndex)}
                      </strong>
                    </span>
                  </>
                )}
              </div>

              {/* Right: All-Pages Toggle + Prev / Page X of Y / Next */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {totalPrintSheets > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowAllPrintSheets(!showAllPrintSheets)}
                    aria-pressed={showAllPrintSheets}
                    className={`h-8 px-3 rounded-xl font-bold border inline-flex items-center gap-1.5 transition cursor-pointer ${
                      showAllPrintSheets
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Layers size={13} />
                    <span>
                      {showAllPrintSheets
                        ? isEn
                          ? 'Single Page View'
                          : 'এক পৃষ্ঠা করে দেখুন'
                        : isEn
                          ? 'View All Pages'
                          : 'সব পৃষ্ঠা একসাথে দেখুন'}
                    </span>
                  </button>
                )}

                <div className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => goToPrintSheet(safePrintPreviewPage - 1)}
                    disabled={safePrintPreviewPage <= 1}
                    className="h-7 px-2.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 font-bold inline-flex items-center gap-1 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={13} />
                    <span>{isEn ? 'Previous' : 'পূর্ববর্তী'}</span>
                  </button>

                  {/* Accessible Page X / Y Indicator */}
                  <span
                    aria-live="polite"
                    className="px-2.5 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 font-mono whitespace-nowrap"
                  >
                    {isEn ? 'Page' : 'পৃষ্ঠা'} {toBanglaNumeral(safePrintPreviewPage)} / {toBanglaNumeral(totalPrintSheets)}
                  </span>

                  {/* Quick-Jump Numbered Page Pills (when multi-page) */}
                  {totalPrintSheets > 1 && (
                    <div className="hidden sm:flex items-center gap-0.5 pr-1">
                      {paginationTokens.map((token, idx) =>
                        token === 'ellipsis' ? (
                          <span key={`e-${idx}`} className="px-1 text-slate-400 select-none">
                            …
                          </span>
                        ) : (
                          <button
                            key={token}
                            type="button"
                            onClick={() => goToPrintSheet(token)}
                            aria-current={safePrintPreviewPage === token ? 'page' : undefined}
                            className={`min-w-6.5 h-6.5 px-1.5 rounded-md font-mono font-bold text-[11px] transition cursor-pointer ${
                              safePrintPreviewPage === token
                                ? 'bg-[#0B5D3B] text-white shadow-2xs'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                            }`}
                          >
                            {toBanglaNumeral(token)}
                          </button>
                        )
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => goToPrintSheet(safePrintPreviewPage + 1)}
                    disabled={safePrintPreviewPage >= totalPrintSheets}
                    className="h-7 px-2.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 font-bold inline-flex items-center gap-1 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span>{isEn ? 'Next' : 'পরবর্তী'}</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-[210mm] mx-auto bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl px-4 py-2 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300 print:hidden">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold border border-slate-200/70 dark:border-slate-700">
                  {printOrientation === 'landscape' ? (
                    <RectangleHorizontal size={13} className="text-[#0B5D3B] dark:text-emerald-400" />
                  ) : (
                    <RectangleVertical size={13} className="text-[#0B5D3B] dark:text-emerald-400" />
                  )}
                  <span>
                    A4 {printOrientation === 'landscape' ? (isEn ? 'Landscape' : 'ল্যান্ডস্কেপ') : isEn ? 'Portrait' : 'পোর্ট্রেট'}
                  </span>
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  {isEn ? 'Margin:' : 'মার্জিন:'} <strong className="text-slate-700 dark:text-slate-200">{marginSummaryLabel}</strong>
                </span>
              </div>
              <span className="font-mono font-bold text-slate-500 dark:text-slate-400">
                {isEn ? 'Page 1 / 1' : 'পৃষ্ঠা ১ / ১'}
              </span>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* PAPER SHEETS VIEWPORT (Always crisp white paper with dark ink)  */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div className="overflow-x-auto pb-6 print:overflow-visible print:pb-0">
            {printReportTab === 'summary' ? (
              <div
                style={inPageSheetStyle}
                className="inpage-print-sheet bg-white text-slate-900 font-sans mx-auto rounded-sm border border-slate-300/90 dark:border-slate-700 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)] dark:shadow-[0_16px_42px_-12px_rgba(0,0,0,0.65)] box-border relative overflow-hidden flex flex-col justify-between transition-all print:border-none print:rounded-none print:shadow-none"
              >
                {/* Institutional Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.028] select-none z-0">
                  <div className="text-center transform -rotate-12">
                    <h2 className="text-7xl font-black uppercase text-slate-900 tracking-widest">
                      {schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                    </h2>
                    <p className="text-3xl font-black text-slate-900 mt-2">OFFICIAL STUDENT DIRECTORY</p>
                  </div>
                </div>

                <div className="relative z-10 space-y-3">
                  {/* School Letterhead */}
                  <div className="border-b-2 border-slate-900 pb-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                        {schoolSettings?.schoolLogo ? (
                          <img src={schoolSettings.schoolLogo} alt="School Logo" className="w-16 h-16 object-contain" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-[#0B5D3B] text-white border-2 border-emerald-700 flex flex-col items-center justify-center">
                            <GraduationCap className="w-8 h-8 text-amber-200" />
                          </div>
                        )}
                      </div>

                      <div className="text-center flex-1 pr-16">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-serif">
                          {schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                        </h1>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                          {schoolSettings?.address || 'বরইতলী , চকরিয়া , কক্সবাজার।'}
                        </p>
                        <p className="text-[11px] sm:text-xs font-semibold text-slate-600 mt-0.5">
                          EIIN: {schoolSettings?.eiin || '106184'} , স্থাপিত: {schoolSettings?.estdYear || '১৯৬৯'} খ্রি .
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Table */}
                  <div className="overflow-x-auto my-3">
                    <div className="text-center font-bold text-base sm:text-lg my-3 text-slate-950 font-serif">
                      {currentYearBn} সালের শিক্ষার্থী সংখ্যা
                      {(printBranchFilter !== 'all' || printReligionFilter !== 'all') && (
                        <span className="block text-[11px] font-sans font-semibold text-slate-600 mt-0.5">
                          {printBranchFilter !== 'all' ? `শাখা: ${printBranchFilter}` : ''}
                          {printBranchFilter !== 'all' && printReligionFilter !== 'all' ? ' · ' : ''}
                          {printReligionFilter !== 'all' ? `ধর্ম: ${printReligionFilter}` : ''}
                        </span>
                      )}
                    </div>

                    <table className="print-table w-full text-center text-xs border-collapse border border-black bg-white">
                      <thead>
                        <tr className="bg-slate-50 text-black font-bold text-xs uppercase border border-black">
                          <th className="p-2 w-16 border border-black text-center font-bold">ক্র: নং:</th>
                          <th className="p-2 w-20 border border-black text-center font-bold">শ্রেণি</th>
                          <th className="p-2 w-36 border border-black text-center font-bold">বিভাগ</th>
                          <th className="p-2 w-24 border border-black text-center font-bold">ছাত্র</th>
                          <th className="p-2 w-24 border border-black text-center font-bold">ছাত্রী</th>
                          <th className="p-2 w-24 border border-black text-center font-bold">মোট</th>
                          <th className="p-2 w-36 border border-black text-center font-bold">মন্তব্য</th>
                        </tr>
                      </thead>
                      <tbody className="text-black font-semibold text-xs">
                        {(() => {
                          const r6 = classSummaryData[0] || { boys: 0, girls: 0, total: 0 };
                          const r7 = classSummaryData[1] || { boys: 0, girls: 0, total: 0 };
                          const r8 = classSummaryData[2] || { boys: 0, girls: 0, total: 0 };
                          const r9Sci = classSummaryData[3] || { boys: 0, girls: 0, total: 0 };
                          const r9Hum = classSummaryData[4] || { boys: 0, girls: 0, total: 0 };
                          const r9Bs = classSummaryData[5] || { boys: 0, girls: 0, total: 0 };
                          const r10Sci = classSummaryData[6] || { boys: 0, girls: 0, total: 0 };
                          const r10Hum = classSummaryData[7] || { boys: 0, girls: 0, total: 0 };
                          const r10Bs = classSummaryData[8] || { boys: 0, girls: 0, total: 0 };

                          return (
                            <>
                              {[
                                { sl: '০১', grade: '৬ষ্ঠ', group: '', data: r6, first: true },
                                { sl: '০২', grade: '৭ম', group: '', data: r7 },
                                { sl: '০৩', grade: '৮ম', group: '', data: r8 },
                              ].map((row) => (
                                <tr key={row.sl}>
                                  <td className="p-2 text-center border border-black font-mono">{row.sl}</td>
                                  <td className="p-2 text-center border border-black font-bold">{row.grade}</td>
                                  <td className="p-2 text-center border border-black">{row.group}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">
                                    {toBanglaNumeral(row.data.boys)}
                                  </td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">
                                    {toBanglaNumeral(row.data.girls)}
                                  </td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">
                                    {toBanglaNumeral(row.data.total)}
                                  </td>
                                  {row.first && (
                                    <td
                                      rowSpan={10}
                                      className="p-2 text-center border border-black align-middle text-xs text-slate-500 font-normal"
                                    />
                                  )}
                                </tr>
                              ))}

                              {[
                                {
                                  sl: '০৪',
                                  grade: '৯ম',
                                  groups: [
                                    { label: 'বিজ্ঞান', data: r9Sci },
                                    { label: 'মানবিক', data: r9Hum },
                                    { label: 'ব্যবসায় শিক্ষা', data: r9Bs },
                                  ],
                                },
                                {
                                  sl: '০৫',
                                  grade: '১০ম',
                                  groups: [
                                    { label: 'বিজ্ঞান', data: r10Sci },
                                    { label: 'মানবিক', data: r10Hum },
                                    { label: 'ব্যবসায় শিক্ষা', data: r10Bs },
                                  ],
                                },
                              ].map((sec) =>
                                sec.groups.map((grp, idx) => (
                                  <tr key={`${sec.sl}-${grp.label}`}>
                                    {idx === 0 && (
                                      <>
                                        <td rowSpan={3} className="p-2 text-center border border-black font-mono align-middle">
                                          {sec.sl}
                                        </td>
                                        <td rowSpan={3} className="p-2 text-center border border-black font-bold align-middle">
                                          {sec.grade}
                                        </td>
                                      </>
                                    )}
                                    <td className="p-2 text-center border border-black">{grp.label}</td>
                                    <td className="p-2 text-center border border-black font-mono font-bold">
                                      {toBanglaNumeral(grp.data.boys)}
                                    </td>
                                    <td className="p-2 text-center border border-black font-mono font-bold">
                                      {toBanglaNumeral(grp.data.girls)}
                                    </td>
                                    <td className="p-2 text-center border border-black font-mono font-bold">
                                      {toBanglaNumeral(grp.data.total)}
                                    </td>
                                  </tr>
                                ))
                              )}

                              <tr className="bg-slate-50 font-bold border-2 border-black">
                                <td colSpan={3} className="p-2 text-center border border-black font-bold">
                                  মোট
                                </td>
                                <td className="p-2 text-center border border-black font-mono font-bold">
                                  {toBanglaNumeral(summaryTotalBoys)}
                                </td>
                                <td className="p-2 text-center border border-black font-mono font-bold">
                                  {toBanglaNumeral(summaryTotalGirls)}
                                </td>
                                <td className="p-2 text-center border border-black font-mono font-bold">
                                  {toBanglaNumeral(summaryGrandTotal)}
                                </td>
                              </tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Signature Block */}
                  <div className="signature-avoid-break pt-14 pb-2 flex justify-end text-center text-xs font-bold text-slate-900">
                    <div className="space-y-1">
                      <div className="w-48 border-b border-slate-900 mx-auto" />
                      <p className="font-extrabold text-slate-950">প্রধান শিক্ষক</p>
                      <p className="text-[10px] text-slate-600 font-bold">
                        {schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান'}
                        {schoolSettings?.address ? `, ${schoolSettings.address}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-7 print:space-y-0">
                {paginatedPrintSheets.map((sheet) => {
                  const isFirstPage = sheet.pageNumber === 1;
                  const isLastPage = sheet.pageNumber === totalPrintSheets;
                  const hiddenOnScreen = !showAllPrintSheets && safePrintPreviewPage !== sheet.pageNumber;

                  return (
                    <div
                      key={sheet.pageNumber}
                      id={`inpage-print-sheet-${sheet.pageNumber}`}
                      style={hiddenOnScreen ? { ...inPageSheetStyle, display: 'none' } : inPageSheetStyle}
                      className={`inpage-print-sheet ${!isLastPage ? 'inpage-sheet-break' : ''} scroll-mt-36 bg-white text-slate-900 font-sans mx-auto rounded-sm border border-slate-300/90 dark:border-slate-700 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)] dark:shadow-[0_16px_42px_-12px_rgba(0,0,0,0.65)] box-border relative overflow-hidden flex flex-col justify-between transition-all print:border-none print:rounded-none print:shadow-none`}
                    >
                      {/* Institutional Watermark */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.028] select-none z-0">
                        <div className="text-center transform -rotate-12">
                          <h2 className="text-7xl font-black uppercase text-slate-900 tracking-widest">
                            {schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                          </h2>
                          <p className="text-3xl font-black text-slate-900 mt-2">OFFICIAL STUDENT DIRECTORY</p>
                        </div>
                      </div>

                      <div className="relative z-10 space-y-3">
                        {/* Subtle On-Screen Sheet Strip (hidden on print) */}
                        <div className="print:hidden flex items-center justify-between pb-2 border-b border-dashed border-slate-200 text-[11px] font-semibold text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <FileText size={12} className="text-slate-400" />
                            <span>
                              পৃষ্ঠা {toBanglaNumeral(sheet.pageNumber)} / {toBanglaNumeral(totalPrintSheets)} ·{' '}
                              {printOrientation === 'landscape' ? 'ল্যান্ডস্কেপ' : 'পোর্ট্রেট'}
                            </span>
                          </span>
                          <span className="font-mono">
                            ক্রম:{' '}
                            {sheet.rows.length > 0
                              ? `${toBanglaNumeral(sheet.rows[0].globalIndex)} – ${toBanglaNumeral(
                                  sheet.rows[sheet.rows.length - 1].globalIndex
                                )}`
                              : '০'}{' '}
                            (মোট {toBanglaNumeral(printTotalCount)} জন)
                          </span>
                        </div>

                        {isFirstPage ? (
                          <div className="border-b-2 border-slate-900 pb-3">
                            <div className="flex items-center justify-between gap-4">
                              <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                                {schoolSettings?.schoolLogo ? (
                                  <img
                                    src={schoolSettings.schoolLogo}
                                    alt="School Logo"
                                    className="w-16 h-16 object-contain"
                                  />
                                ) : (
                                  <div className="w-16 h-16 rounded-full bg-[#0B5D3B] text-white border-2 border-emerald-700 flex flex-col items-center justify-center">
                                    <GraduationCap className="w-8 h-8 text-amber-200" />
                                  </div>
                                )}
                              </div>

                              <div className="text-center flex-1 pr-16">
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-serif">
                                  {schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                                </h1>
                                <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                                  {schoolSettings?.address || 'বরইতলী , চকরিয়া , কক্সবাজার।'}
                                </p>
                                <p className="text-[11px] sm:text-xs font-semibold text-slate-600 mt-0.5">
                                  EIIN: {schoolSettings?.eiin || '106184'} , স্থাপিত:{' '}
                                  {schoolSettings?.estdYear || '১৯৬৯'} খ্রি .
                                </p>
                              </div>
                            </div>

                            <div className="text-center mt-2">
                              <div className="inline-block px-5 py-1 bg-[#0B5D3B] text-white font-black text-xs uppercase tracking-wider rounded border border-emerald-900">
                                শিক্ষার্থী তালিকা ও সাধারণ বিবরণী - {currentYearBn}
                              </div>
                            </div>

                            <div className="grid grid-cols-3 items-center text-[10.5px] font-bold text-slate-700 mt-2 px-3 py-1.5 bg-slate-50 rounded border border-slate-300">
                              <div className="text-left flex items-center gap-1.5">
                                <span>শাখা:</span>
                                <span className="text-slate-950 font-black">
                                  {printBranchFilter === 'all' ? 'সকল শাখা' : printBranchFilter}
                                </span>
                                <span className="text-slate-400">|</span>
                                <span>বিভাগ:</span>
                                <span className="text-slate-950 font-black">
                                  {printGroupFilter === 'all' ? 'সকল বিভাগ' : printGroupFilter}
                                </span>
                              </div>
                              <div className="text-center">
                                <span className="font-black text-xs sm:text-[13px] text-slate-950 tracking-wide font-serif border-b-2 border-slate-900 pb-0.5 px-2.5">
                                  শ্রেণি:{' '}
                                  {printGradeFilter === 'all'
                                    ? 'সকল শ্রেণি'
                                    : `${
                                        printGradeFilter === '6th'
                                          ? '৬ষ্ঠ'
                                          : printGradeFilter === '7th'
                                            ? '৭ম'
                                            : printGradeFilter === '8th'
                                              ? '৮ম'
                                              : printGradeFilter === '9th'
                                                ? '৯ম'
                                                : '১০ম'
                                      } শ্রেণি`}
                                </span>
                              </div>
                              <div className="text-right">
                                তারিখ:{' '}
                                <span className="font-mono text-slate-900 font-bold">
                                  {new Date().toLocaleDateString('bn-BD')}
                                </span>
                              </div>
                            </div>

                            <div className="bg-slate-100/90 border border-slate-800 px-3 py-1 text-[10px] font-bold text-slate-900 flex flex-wrap justify-between items-center gap-x-3 gap-y-0.5 rounded-sm mt-2">
                              <span>
                                মোট শিক্ষার্থী: <strong className="text-[#0B5D3B]">{toBanglaNumeral(printTotalCount)} জন</strong>
                              </span>
                              <span>
                                ছাত্র: <strong>{toBanglaNumeral(printMaleCount)} জন</strong> (
                                {printTotalCount > 0 ? ((printMaleCount / printTotalCount) * 100).toFixed(0) : 0}%)
                              </span>
                              <span>
                                ছাত্রী: <strong>{toBanglaNumeral(printFemaleCount)} জন</strong> (
                                {printTotalCount > 0 ? ((printFemaleCount / printTotalCount) * 100).toFixed(0) : 0}%)
                              </span>
                              <span>
                                মুসলিম: <strong>{toBanglaNumeral(printMuslimCount)} জন</strong>
                              </span>
                              <span>
                                হিন্দু: <strong>{toBanglaNumeral(printHinduCount)} জন</strong>
                              </span>
                              {printStipendCount > 0 && (
                                <span>
                                  উপবৃত্তি: <strong>{toBanglaNumeral(printStipendCount)} জন</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 text-xs font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="font-serif font-black text-sm text-slate-950">
                                {schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                              </span>
                              <span className="text-slate-400">|</span>
                              <span>শিক্ষার্থী তালিকা — {currentYearBn} (পূর্ববর্তী পৃষ্ঠার পর)</span>
                            </div>
                            <div>
                              পৃষ্ঠা:{' '}
                              <strong>
                                {toBanglaNumeral(sheet.pageNumber)} / {toBanglaNumeral(totalPrintSheets)}
                              </strong>
                            </div>
                          </div>
                        )}

                        <div className="overflow-x-auto">
                          <table className="print-table w-full text-left text-[11px] border-collapse border border-slate-800">
                            <thead>
                              <tr className="bg-slate-900 text-white font-extrabold text-[10px] uppercase border border-slate-800">
                                {selectedColumns.sl && <th className="p-1.5 text-center w-8 border border-slate-700">ক্র.</th>}
                                {selectedColumns.roll && <th className="p-1.5 text-center w-12 border border-slate-700">রোল</th>}
                                {selectedColumns.id && <th className="p-1.5 text-center border border-slate-700">আইডি</th>}
                                {selectedColumns.name && <th className="p-1.5 border border-slate-700">শিক্ষার্থীর নাম</th>}
                                {selectedColumns.gender && <th className="p-1.5 text-center border border-slate-700">লিঙ্গ</th>}
                                {selectedColumns.religion && <th className="p-1.5 text-center border border-slate-700">ধর্ম</th>}
                                {selectedColumns.grade && <th className="p-1.5 text-center border border-slate-700">শ্রেণি ও শাখা</th>}
                                {selectedColumns.group && <th className="p-1.5 text-center border border-slate-700">বিভাগ/গ্রুপ</th>}
                                {selectedColumns.guardian && <th className="p-1.5 border border-slate-700">পিতার নাম / অভিভাবক</th>}
                                {selectedColumns.fatherNid && <th className="p-1.5 text-center border border-slate-700">পিতার NID</th>}
                                {selectedColumns.motherName && <th className="p-1.5 border border-slate-700">মাতার নাম</th>}
                                {selectedColumns.motherNid && <th className="p-1.5 text-center border border-slate-700">মাতার NID</th>}
                                {selectedColumns.mobile && <th className="p-1.5 text-center border border-slate-700">মোবাইল নম্বর</th>}
                                {selectedColumns.optionalSubject && (
                                  <th className="p-1.5 text-center border border-slate-700">৪র্থ/ঐচ্ছিক বিষয়</th>
                                )}
                                {selectedColumns.birthRegNo && (
                                  <th className="p-1.5 text-center border border-slate-700">জন্ম নিবন্ধন নম্বর</th>
                                )}
                                {selectedColumns.dob && <th className="p-1.5 text-center border border-slate-700">জন্ম তারিখ</th>}
                                {selectedColumns.bloodGroup && (
                                  <th className="p-1.5 text-center border border-slate-700">রক্তের গ্রুপ</th>
                                )}
                                {selectedColumns.address && <th className="p-1.5 border border-slate-700">ঠিকানা</th>}
                                {selectedColumns.stipend && <th className="p-1.5 text-center border border-slate-700">উপবৃত্তি</th>}
                                {selectedColumns.remarks && (
                                  <th className="p-1.5 text-center w-24 border border-slate-700">মন্তব্য / স্বাক্ষর</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-300 text-slate-900 font-semibold">
                              {sheet.rows.map(({ student: st, globalIndex }, idx) => (
                                <tr key={st.id || globalIndex} className={idx % 2 === 1 ? 'bg-slate-50/90' : 'bg-white'}>
                                  {selectedColumns.sl && (
                                    <td className="p-1.5 text-center font-mono font-bold border border-slate-400 text-[10px]">
                                      {toBanglaNumeral(globalIndex)}
                                    </td>
                                  )}
                                  {selectedColumns.roll && (
                                    <td className="p-1.5 text-center font-mono font-black text-slate-950 border border-slate-400">
                                      {toBanglaNumeral(st.roll)}
                                    </td>
                                  )}
                                  {selectedColumns.id && (
                                    <td className="p-1.5 text-center font-mono text-[9px] text-slate-700 border border-slate-400">
                                      {st.id}
                                    </td>
                                  )}
                                  {selectedColumns.name && (
                                    <td className="p-1.5 font-bold text-slate-950 border border-slate-400 whitespace-nowrap">
                                      {st.name}
                                    </td>
                                  )}
                                  {selectedColumns.gender && (
                                    <td className="p-1.5 text-center text-[10px] border border-slate-400">
                                      {st.gender || 'পুরুষ'}
                                    </td>
                                  )}
                                  {selectedColumns.religion && (
                                    <td className="p-1.5 text-center text-[10px] border border-slate-400">
                                      {st.religion || 'ইসলাম'}
                                    </td>
                                  )}
                                  {selectedColumns.grade && (
                                    <td className="p-1.5 text-center text-[10px] font-bold border border-slate-400">
                                      {st.grade} ({st.branch})
                                    </td>
                                  )}
                                  {selectedColumns.group && (
                                    <td className="p-1.5 text-center text-[10px] border border-slate-400">{st.group}</td>
                                  )}
                                  {selectedColumns.guardian && (
                                    <td className="p-1.5 border border-slate-400 whitespace-nowrap text-slate-800 text-[10px]">
                                      {st.guardian}
                                    </td>
                                  )}
                                  {selectedColumns.fatherNid && (
                                    <td className="p-1.5 text-center font-mono text-[9px] border border-slate-400">
                                      {st.fatherNid || '-'}
                                    </td>
                                  )}
                                  {selectedColumns.motherName && (
                                    <td className="p-1.5 border border-slate-400 whitespace-nowrap text-[10px]">
                                      {st.motherName || '-'}
                                    </td>
                                  )}
                                  {selectedColumns.motherNid && (
                                    <td className="p-1.5 text-center font-mono text-[9px] border border-slate-400">
                                      {st.motherNid || '-'}
                                    </td>
                                  )}
                                  {selectedColumns.mobile && (
                                    <td className="p-1.5 text-center font-mono text-[10px] border border-slate-400 text-slate-800">
                                      {st.mobile}
                                    </td>
                                  )}
                                  {selectedColumns.optionalSubject && (
                                    <td className="p-1.5 text-center text-[10px] border border-slate-400">
                                      {st.optionalSubject || '-'}
                                    </td>
                                  )}
                                  {selectedColumns.birthRegNo && (
                                    <td className="p-1.5 text-center font-mono text-[9px] border border-slate-400">
                                      {st.birthRegNo || '-'}
                                    </td>
                                  )}
                                  {selectedColumns.dob && (
                                    <td className="p-1.5 text-center font-mono text-[9px] border border-slate-400">
                                      {st.dob || '-'}
                                    </td>
                                  )}
                                  {selectedColumns.bloodGroup && (
                                    <td className="p-1.5 text-center font-bold text-rose-700 text-[10px] border border-slate-400">
                                      {st.bloodGroup || 'B+'}
                                    </td>
                                  )}
                                  {selectedColumns.address && (
                                    <td className="p-1.5 border border-slate-400 text-[9px] truncate max-w-xs">
                                      {st.currentAddress || '-'}
                                    </td>
                                  )}
                                  {selectedColumns.stipend && (
                                    <td className="p-1.5 text-center text-[9px] font-bold border border-slate-400">
                                      {st.isStipend ? 'উপবৃত্তি' : '-'}
                                    </td>
                                  )}
                                  {selectedColumns.remarks && <td className="p-1.5 border border-slate-400 text-center" />}
                                </tr>
                              ))}

                              {sheet.rows.length === 0 && (
                                <tr>
                                  <td
                                    colSpan={Math.max(1, activeColumnCount)}
                                    className="p-8 text-center text-slate-400 font-bold text-xs border border-slate-300"
                                  >
                                    নির্বাচিত ফিল্টারের ভিত্তিতে কোনো শিক্ষার্থী পাওয়া যায়নি।
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Official Signature & Running Page Footer */}
                        <div className="signature-avoid-break">
                          {isLastPage ? (
                            <div className="pt-12 pb-2 flex justify-between items-end text-center text-xs font-bold text-slate-900">
                              <div className="space-y-1">
                                <div className="w-40 border-b border-slate-900 mx-auto" />
                                <p>শ্রেণি শিক্ষকের স্বাক্ষর</p>
                                <p className="text-[9px] text-slate-500 font-normal">তারিখ: ....................</p>
                              </div>
                              <div className="space-y-1">
                                <div className="w-40 border-b border-slate-900 mx-auto" />
                                <p>সহকারী প্রধান শিক্ষক</p>
                                <p className="text-[9px] text-slate-500 font-normal">তারিখ: ....................</p>
                              </div>
                              <div className="space-y-1">
                                <div className="w-48 border-b border-slate-900 mx-auto" />
                                <p className="font-extrabold text-slate-950">প্রধান শিক্ষক</p>
                                <p className="text-[9px] text-slate-600 font-bold">
                                  {schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান'}
                                  {schoolSettings?.address ? `, ${schoolSettings.address}` : ''}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-4 flex items-center justify-between text-[10px] font-bold text-slate-600">
                              <span>
                                চলমান তালিকা — পরবর্তী পৃষ্ঠায় ({toBanglaNumeral(sheet.pageNumber + 1)} নং পৃষ্ঠায়) দেখুন...
                              </span>
                              <span>অনুস্বাক্ষর: ..............................</span>
                            </div>
                          )}

                          {totalPrintSheets > 1 && (
                            <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                              <span>{schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান'} — অফিশিয়াল শিক্ষার্থী ডিরেক্টরি</span>
                              <span>
                                পৃষ্ঠা: <strong>{toBanglaNumeral(sheet.pageNumber)}</strong> /{' '}
                                <strong>{toBanglaNumeral(totalPrintSheets)}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
