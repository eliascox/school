'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  FileText,
  BarChart3,
  FileSpreadsheet,
  Printer,
  GraduationCap,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  RectangleVertical,
  RectangleHorizontal,
  ScrollText,
  Minus,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  ExternalLink,
  SlidersHorizontal,
  Columns3,
} from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';
import { sortStudentsGroupAndRoll, RollSortStrategy } from '@/services/studentBulkImportEngine';
import { AppLanguage } from '@/services/languageService';
import {
  STUDENT_PRINT_COLUMNS,
  StudentRecord,
  toBanglaNumeral,
  formatGradeLabel,
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
  availableSections?: string[];
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
  setPrintStipendFilter?: (v: string) => void;
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

const A4_PORTRAIT_PX = 794; // 210mm @ 96dpi
const A4_LANDSCAPE_PX = 1123; // 297mm @ 96dpi

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

function cleanColumnLabel(raw: string): string {
  return raw.replace(/^[০-৯0-9]+\.\s*/, '').trim();
}

/**
 * Scales an authentic A4 sheet smoothly to fit the preview pane width
 * while keeping exact proportional height (zero clipped rows, zero dead whitespace)
 * and resetting to native 100% scale on @media print.
 */
function ScaledA4Sheet({
  naturalWidthPx,
  scale,
  hiddenOnScreen,
  sheetId,
  children,
}: {
  naturalWidthPx: number;
  scale: number;
  hiddenOnScreen?: boolean;
  sheetId?: string;
  children: React.ReactNode;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [naturalHeight, setNaturalHeight] = useState<number>(0);

  useEffect(() => {
    const el = innerRef.current;
    if (!el || hiddenOnScreen) return;
    const measure = () => {
      const h = el.offsetHeight;
      if (h > 0) setNaturalHeight(h);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scale, hiddenOnScreen, naturalWidthPx]);

  if (hiddenOnScreen) {
    return (
      <div id={sheetId} className="scaled-sheet-outer hidden print:block">
        <div className="scaled-sheet-inner">{children}</div>
      </div>
    );
  }

  return (
    <div
      id={sheetId}
      className="scaled-sheet-outer mx-auto scroll-mt-20 print:mx-0"
      style={{
        width: `${Math.round(naturalWidthPx * scale)}px`,
        height: naturalHeight > 0 ? `${Math.ceil(naturalHeight * scale)}px` : 'auto',
      }}
    >
      <div
        ref={innerRef}
        className="scaled-sheet-inner origin-top-left"
        style={{
          width: `${naturalWidthPx}px`,
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function StudentPrintSuiteView({
  students,
  schoolSettings,
  currentLang,
  sortStrategy,
  availableSections,
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
  setPrintStipendFilter,
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

  const [showControlsPanel, setShowControlsPanel] = useState(true);
  const [manualScale, setManualScale] = useState<number | null>(null); // null = Auto-fit
  const [canvasWidth, setCanvasWidth] = useState<number>(920);
  const canvasTrayRef = useRef<HTMLDivElement>(null);

  // Institutional settings with clean neutral fallbacks (no single-school hardcoding)
  const schoolName = schoolSettings?.schoolName?.trim() || 'শিক্ষা প্রতিষ্ঠান';
  const schoolAddress = schoolSettings?.address?.trim() || '';
  const schoolEiin = schoolSettings?.eiin?.trim() || '';
  const schoolEstd = schoolSettings?.estdYear?.trim() || '';

  // Measure right preview tray so Landscape & Portrait sheets auto-fit cleanly without clipping
  useEffect(() => {
    const el = canvasTrayRef.current;
    if (!el) return;
    const updateWidth = () => {
      const style = window.getComputedStyle(el);
      const padX = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
      const usable = Math.max(320, el.clientWidth - padX);
      setCanvasWidth(usable);
    };
    updateWidth();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showControlsPanel]);

  const naturalSheetWidthPx = printOrientation === 'landscape' ? A4_LANDSCAPE_PX : A4_PORTRAIT_PX;
  const naturalSheetMinHeightPx = printOrientation === 'landscape' ? A4_PORTRAIT_PX : A4_LANDSCAPE_PX;

  const autoFitScale = useMemo(() => {
    const ratio = canvasWidth / naturalSheetWidthPx;
    return Math.max(0.42, Math.min(1, Number(ratio.toFixed(3))));
  }, [canvasWidth, naturalSheetWidthPx]);

  const effectiveScale = manualScale !== null ? manualScale : autoFitScale;

  // Dynamic section options (honors configured/student sections, defaults to A/B/C)
  const sectionOptions = useMemo(() => {
    const set = new Set<string>(['A', 'B', 'C']);
    (availableSections || []).forEach((sec) => {
      const clean = (sec || '').trim();
      if (clean) set.add(clean);
    });
    students.forEach((st) => {
      const clean = (st.branch || st.section || '').trim();
      if (clean) set.add(clean);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [availableSections, students]);

  // Dynamic grade options (standard 6th–10th + any custom grades found in data)
  const gradeOptions = useMemo(() => {
    const standard = [
      { value: '6th', labelBn: '৬ষ্ঠ শ্রেণি', labelEn: 'Class 6' },
      { value: '7th', labelBn: '৭ম শ্রেণি', labelEn: 'Class 7' },
      { value: '8th', labelBn: '৮ম শ্রেণি', labelEn: 'Class 8' },
      { value: '9th', labelBn: '৯ম শ্রেণি', labelEn: 'Class 9' },
      { value: '10th', labelBn: '১০ম শ্রেণি', labelEn: 'Class 10' },
    ];
    const extras = new Set<string>();
    students.forEach((st) => {
      const g = (st.grade || '').trim();
      if (!g) return;
      const gl = g.toLowerCase();
      const isStd =
        gl.includes('6') || gl.includes('৬') ||
        gl.includes('7') || gl.includes('৭') ||
        gl.includes('8') || gl.includes('৮') ||
        gl.includes('9') || gl.includes('৯') ||
        gl.includes('10') || gl.includes('১০');
      if (!isStd) extras.add(g);
    });
    return [
      ...standard,
      ...Array.from(extras).map((g) => ({ value: g, labelBn: g, labelEn: g })),
    ];
  }, [students]);

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
        ((st.branch || st.section || '').toLowerCase() === printBranchFilter.toLowerCase());
      const matchGroup = printGroupFilter === 'all' || Boolean(st.group && st.group.includes(printGroupFilter));
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

  const activeFilterCount = useMemo(() => {
    if (printReportTab === 'summary') {
      return [
        printBranchFilter !== 'all',
        printReligionFilter !== 'all',
        printStipendFilter !== 'all',
      ].filter(Boolean).length;
    }
    return [
      printGradeFilter !== 'all',
      printBranchFilter !== 'all',
      printGroupFilter !== 'all',
      printReligionFilter !== 'all',
      printGenderFilter !== 'all',
      printStipendFilter !== 'all',
      printSearchQuery.trim().length > 0,
    ].filter(Boolean).length;
  }, [
    printReportTab,
    printGradeFilter,
    printBranchFilter,
    printGroupFilter,
    printReligionFilter,
    printGenderFilter,
    printStipendFilter,
    printSearchQuery,
  ]);

  const handleResetFilters = () => {
    if (printReportTab === 'detailed') {
      setPrintGradeFilter('all');
      setPrintBranchFilter('all');
      setPrintGroupFilter('all');
      setPrintReligionFilter('all');
      setPrintGenderFilter('all');
      setPrintStipendFilter?.('all');
      setPrintSearchQuery('');
    } else {
      setPrintBranchFilter('all');
      setPrintReligionFilter('all');
      setPrintStipendFilter?.('all');
    }
  };

  const handleDirectPrint = () => {
    window.print();
  };

  const handleOpenStandalonePrintTab = () => {
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
    if (printStipendFilter !== 'all') params.set('stipend', printStipendFilter);
    if (printSearchQuery.trim()) params.set('q', printSearchQuery.trim());
    params.set('year', String(currentYear));
    const opened = window.open(`/dashboard/students/print?${params.toString()}`, '_blank');
    if (!opened) {
      window.print();
    }
  };

  const handleExportCsv = () => {
    if (printReportTab === 'summary') {
      exportClassSummaryCsv(classSummaryData, summaryTotalBoys, summaryTotalGirls, summaryGrandTotal);
    } else {
      exportPrintableStudentsCsv(printableFilteredStudents, selectedColumns, printGradeFilter);
    }
  };

  const sheetSurfaceStyle: React.CSSProperties = {
    padding: inPageSheetStyle.padding || printPageMarginCss,
    width: '100%',
    minHeight: `${naturalSheetMinHeightPx}px`,
  };

  const selectClass = (active: boolean) =>
    `w-full h-8 px-2 rounded-lg border text-[11.5px] font-bold outline-none transition cursor-pointer ${
      active
        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-[#0B5D3B]/50 dark:border-emerald-700 text-[#0B5D3B] dark:text-emerald-200'
        : 'bg-slate-50/80 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 focus:border-[#0B5D3B]'
    }`;

  const gradeBannerLabel =
    printGradeFilter === 'all' ? 'সকল শ্রেণি' : formatGradeLabel(printGradeFilter, 'bn');

  const metaLineText = [
    schoolEiin ? `EIIN: ${schoolEiin}` : '',
    schoolEstd ? `স্থাপিত: ${schoolEstd} খ্রি.` : '',
  ]
    .filter(Boolean)
    .join('  •  ');

  return (
    <div className="min-w-0 p-3 sm:p-4 lg:p-5 max-w-[1680px] mx-auto space-y-3.5 font-sans text-slate-900 dark:text-slate-100 print:p-0 print:max-w-none print:space-y-0 print:block">
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
          .scaled-sheet-outer {
            display: block !important;
            width: auto !important;
            height: auto !important;
            margin: 0 !important;
          }
          .scaled-sheet-inner {
            width: 100% !important;
            transform: none !important;
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
      {/* 1. SINGLE COMPACT STUDIO BAR (ZERO STACKED HEADER BARS)             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs px-3 py-2 flex flex-wrap items-center justify-between gap-2 print:hidden">
        {/* Left: Back + Mode Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onBackToList}
            className="h-8.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            title={isEn ? 'Back to Student Directory' : 'শিক্ষার্থী তালিকায় ফিরে যান'}
          >
            <ArrowLeft size={14} className="text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="hidden sm:inline">{isEn ? 'Back' : 'তালিকায় ফিরুন'}</span>
          </button>

          <div className="h-8.5 inline-flex items-center bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setPrintReportTab('detailed')}
              className={`h-7 px-3 rounded-lg text-xs font-black inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                printReportTab === 'detailed'
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText size={13} className={printReportTab === 'detailed' ? 'text-amber-300' : ''} />
              <span>{isEn ? 'Detailed List' : 'বিস্তারিত তালিকা'}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  printReportTab === 'detailed'
                    ? 'bg-white/15 text-white'
                    : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {toBanglaNumeral(printTotalCount)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPrintReportTab('summary');
                setPrintOrientation('portrait');
              }}
              className={`h-7 px-3 rounded-lg text-xs font-black inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                printReportTab === 'summary'
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 size={13} className={printReportTab === 'summary' ? 'text-amber-300' : ''} />
              <span>{isEn ? 'Class Summary' : 'শ্রেণি সারসংক্ষেপ'}</span>
            </button>
          </div>
        </div>

        {/* Right: Inline Pagination + Zoom + Panel Toggle + Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Compact Inline Page Stepper (only when multi-page Detailed List) */}
          {printReportTab === 'detailed' && totalPrintSheets > 1 && (
            <div className="h-8.5 inline-flex items-center gap-0.5 bg-slate-100/90 dark:bg-slate-950 px-1 rounded-xl border border-slate-200/80 dark:border-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => goToPrintSheet(safePrintPreviewPage - 1)}
                disabled={safePrintPreviewPage <= 1}
                className="w-6.5 h-6.5 rounded-lg inline-flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-35 transition cursor-pointer disabled:cursor-not-allowed"
                title={isEn ? 'Previous Page' : 'পূর্ববর্তী পৃষ্ঠা'}
              >
                <ChevronLeft size={13} />
              </button>
              <span className="px-1.5 font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {toBanglaNumeral(safePrintPreviewPage)} / {toBanglaNumeral(totalPrintSheets)}
              </span>
              <button
                type="button"
                onClick={() => goToPrintSheet(safePrintPreviewPage + 1)}
                disabled={safePrintPreviewPage >= totalPrintSheets}
                className="w-6.5 h-6.5 rounded-lg inline-flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-35 transition cursor-pointer disabled:cursor-not-allowed"
                title={isEn ? 'Next Page' : 'পরবর্তী পৃষ্ঠা'}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          {/* Compact Preview Zoom Stepper */}
          <div className="h-8.5 hidden sm:inline-flex items-center gap-0.5 bg-slate-100/90 dark:bg-slate-950 px-1 rounded-xl border border-slate-200/80 dark:border-slate-800 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setManualScale(Math.max(0.45, Number((effectiveScale - 0.1).toFixed(2))))}
              className="w-6.5 h-6.5 rounded-lg inline-flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
              title={isEn ? 'Zoom out' : 'ছোট করে দেখুন'}
            >
              <Minus size={12} />
            </button>
            <button
              type="button"
              onClick={() => setManualScale(null)}
              className={`px-1.5 h-6.5 rounded-lg text-[10.5px] transition cursor-pointer ${
                manualScale === null
                  ? 'text-[#0B5D3B] dark:text-emerald-400 font-extrabold'
                  : 'hover:bg-white dark:hover:bg-slate-800'
              }`}
              title={isEn ? 'Reset to Auto-Fit' : 'অটো-ফিট সাইজে ফিরুন'}
            >
              {manualScale === null ? `ফিট (${Math.round(effectiveScale * 100)}%)` : `${Math.round(effectiveScale * 100)}%`}
            </button>
            <button
              type="button"
              onClick={() => setManualScale(Math.min(1.15, Number((effectiveScale + 0.1).toFixed(2))))}
              className="w-6.5 h-6.5 rounded-lg inline-flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
              title={isEn ? 'Zoom in' : 'বড় করে দেখুন'}
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Toggle Left Controls Rail */}
          <button
            type="button"
            onClick={() => setShowControlsPanel((v) => !v)}
            aria-pressed={showControlsPanel}
            className={`h-8.5 px-2.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              showControlsPanel
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70'
                : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-[#0B5D3B] dark:text-emerald-300'
            }`}
            title={showControlsPanel ? 'সেটিংস প্যানেল লুকান' : 'সেটিংস প্যানেল দেখান'}
          >
            {showControlsPanel ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
            <span className="hidden md:inline">{showControlsPanel ? (isEn ? 'Hide Panel' : 'প্যানেল লুকান') : (isEn ? 'Settings' : 'ফিল্টার ও সেটিংস')}</span>
            {!showControlsPanel && activeFilterCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#0B5D3B] text-white text-[10px] font-mono">
                {toBanglaNumeral(activeFilterCount)}
              </span>
            )}
          </button>

          {/* CSV Export */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="h-8.5 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            title={isEn ? 'Export CSV / Excel' : 'CSV / এক্সেল ডাউনলোড'}
          >
            <FileSpreadsheet size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>CSV</span>
          </button>

          {/* Blank Pad */}
          <button
            type="button"
            onClick={onOpenBlankPad}
            className="h-8.5 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            title={isEn ? 'Open Blank School Pad' : 'প্রতিষ্ঠানের ব্ল্যাংক প্যাড তৈরি করুন'}
          >
            <ScrollText size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="hidden sm:inline">{isEn ? 'Blank Pad' : 'ব্ল্যাংক প্যাড'}</span>
          </button>

          {/* Standalone Fullscreen Print Page (New Tab) */}
          <button
            type="button"
            onClick={handleOpenStandalonePrintTab}
            className="h-8.5 w-8.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-flex items-center justify-center transition cursor-pointer"
            title={isEn ? 'Open Dedicated Print Tab' : 'আলাদা ট্যাবে প্রিন্ট পেজ খুলুন'}
          >
            <ExternalLink size={13} />
          </button>

          {/* Primary Instant Print / PDF CTA */}
          <button
            type="button"
            onClick={handleDirectPrint}
            className="h-8.5 px-4 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] active:scale-[0.98] text-white text-xs font-black shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
          >
            <Printer size={14} className="shrink-0" />
            <span>{isEn ? 'Print / PDF' : 'প্রিন্ট / PDF'}</span>
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 2. TWO-COLUMN PRINT STUDIO (LEFT CONTROLS + RIGHT LIVE A4 PAPER)    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col xl:flex-row items-start gap-4 print:block">
        {/* LEFT COLLAPSIBLE CONTROLS PANEL (Filters, Page Setup, Columns, Stats) */}
        {showControlsPanel && (
          <div className="w-full xl:w-[304px] shrink-0 xl:sticky xl:top-4 print:hidden">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800 text-xs overflow-hidden">
              {/* SECTION A: FILTERS */}
              <div className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-black text-[11.5px] text-slate-800 dark:text-slate-100">
                    <SlidersHorizontal size={13} className="text-[#0B5D3B] dark:text-emerald-400" />
                    <span>{isEn ? 'Filter Students' : 'শিক্ষার্থী ফিল্টার'}</span>
                    {activeFilterCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#0B5D3B] dark:text-emerald-300 font-mono text-[10px]">
                        {toBanglaNumeral(activeFilterCount)}
                      </span>
                    )}
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={11} />
                      <span>{isEn ? 'Reset' : 'রিসেট'}</span>
                    </button>
                  )}
                </div>

                {printReportTab === 'detailed' ? (
                  <>
                    {/* Search Input */}
                    <div className="relative">
                      <Search
                        size={13}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="text"
                        value={printSearchQuery}
                        onChange={(e) => setPrintSearchQuery(e.target.value)}
                        placeholder={isEn ? 'Name, roll, ID, mobile...' : 'নাম, রোল, আইডি বা মোবাইল...'}
                        className="w-full h-8 pl-8 pr-7 rounded-lg bg-slate-50/80 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11.5px] font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#0B5D3B] transition"
                      />
                      {printSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setPrintSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          aria-label={isEn ? 'Clear search' : 'অনুসন্ধান মুছুন'}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* 2-Column Clean Filter Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          {isEn ? 'Class' : 'শ্রেণি'}
                        </label>
                        <select
                          value={printGradeFilter}
                          onChange={(e) => setPrintGradeFilter(e.target.value)}
                          className={selectClass(printGradeFilter !== 'all')}
                        >
                          <option value="all">{isEn ? 'All Classes' : 'সকল শ্রেণি'}</option>
                          {gradeOptions.map((g) => (
                            <option key={g.value} value={g.value}>
                              {isEn ? g.labelEn : g.labelBn}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          {isEn ? 'Section' : 'শাখা'}
                        </label>
                        <select
                          value={printBranchFilter}
                          onChange={(e) => setPrintBranchFilter(e.target.value)}
                          className={selectClass(printBranchFilter !== 'all')}
                        >
                          <option value="all">{isEn ? 'All Sections' : 'সকল শাখা'}</option>
                          {sectionOptions.map((sec) => (
                            <option key={sec} value={sec}>
                              {isEn ? `Sec ${sec}` : `শাখা ${sec}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          {isEn ? 'Group' : 'বিভাগ'}
                        </label>
                        <select
                          value={printGroupFilter}
                          onChange={(e) => setPrintGroupFilter(e.target.value)}
                          className={selectClass(printGroupFilter !== 'all')}
                        >
                          <option value="all">{isEn ? 'All Groups' : 'সকল বিভাগ'}</option>
                          <option value="সাধারণ">সাধারণ</option>
                          <option value="বিজ্ঞান">বিজ্ঞান</option>
                          <option value="মানবিক">মানবিক</option>
                          <option value="ব্যবসায়">ব্যবসায় শিক্ষা</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          {isEn ? 'Gender' : 'লিঙ্গ'}
                        </label>
                        <select
                          value={printGenderFilter}
                          onChange={(e) => setPrintGenderFilter(e.target.value)}
                          className={selectClass(printGenderFilter !== 'all')}
                        >
                          <option value="all">{isEn ? 'All' : 'ছাত্র ও ছাত্রী'}</option>
                          <option value="পুরুষ">শুধু ছাত্র</option>
                          <option value="মহিলা">শুধু ছাত্রী</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          {isEn ? 'Religion' : 'ধর্ম'}
                        </label>
                        <select
                          value={printReligionFilter}
                          onChange={(e) => setPrintReligionFilter(e.target.value)}
                          className={selectClass(printReligionFilter !== 'all')}
                        >
                          <option value="all">{isEn ? 'All' : 'সকল ধর্ম'}</option>
                          <option value="ইসলাম">ইসলাম</option>
                          <option value="হিন্দু">হিন্দু</option>
                          <option value="বৌদ্ধ">বৌদ্ধ</option>
                          <option value="খ্রিস্টান">খ্রিস্টান</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          {isEn ? 'Stipend' : 'উপবৃত্তি'}
                        </label>
                        <select
                          value={printStipendFilter}
                          onChange={(e) => setPrintStipendFilter?.(e.target.value)}
                          disabled={!setPrintStipendFilter}
                          className={selectClass(printStipendFilter !== 'all')}
                        >
                          <option value="all">{isEn ? 'All' : 'সকল'}</option>
                          <option value="stipend_only">{isEn ? 'Stipend Only' : 'শুধু উপবৃত্তি'}</option>
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                        {isEn ? 'Section' : 'শাখা'}
                      </label>
                      <select
                        value={printBranchFilter}
                        onChange={(e) => setPrintBranchFilter(e.target.value)}
                        className={selectClass(printBranchFilter !== 'all')}
                      >
                        <option value="all">{isEn ? 'All Sections' : 'সকল শাখা'}</option>
                        {sectionOptions.map((sec) => (
                          <option key={sec} value={sec}>
                            {isEn ? `Sec ${sec}` : `শাখা ${sec}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                        {isEn ? 'Religion' : 'ধর্ম'}
                      </label>
                      <select
                        value={printReligionFilter}
                        onChange={(e) => setPrintReligionFilter(e.target.value)}
                        className={selectClass(printReligionFilter !== 'all')}
                      >
                        <option value="all">{isEn ? 'All' : 'সকল ধর্ম'}</option>
                        <option value="ইসলাম">ইসলাম</option>
                        <option value="হিন্দু">হিন্দু</option>
                        <option value="বৌদ্ধ">বৌদ্ধ</option>
                        <option value="খ্রিস্টান">খ্রিস্টান</option>
                      </select>
                    </div>

                    {setPrintStipendFilter && (
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          {isEn ? 'Stipend Filter' : 'উপবৃত্তি ফিল্টার'}
                        </label>
                        <select
                          value={printStipendFilter}
                          onChange={(e) => setPrintStipendFilter(e.target.value)}
                          className={selectClass(printStipendFilter !== 'all')}
                        >
                          <option value="all">{isEn ? 'All Students' : 'সকল শিক্ষার্থী'}</option>
                          <option value="stipend_only">{isEn ? 'Stipend Only' : 'শুধু উপবৃত্তিপ্রাপ্ত'}</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION B: PAGE & PRINT SETUP */}
              <div className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-[11.5px] text-slate-800 dark:text-slate-100">
                    {isEn ? 'Page Setup (A4)' : 'পৃষ্ঠা ও প্রিন্ট সেটআপ'}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400">A4</span>
                </div>

                {/* Orientation Segmented Toggle */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPrintOrientation('portrait')}
                    className={`h-7.5 rounded-lg text-[11px] font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      printOrientation === 'portrait'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <RectangleVertical size={13} className={printOrientation === 'portrait' ? 'text-[#0B5D3B] dark:text-emerald-400' : ''} />
                    <span>{isEn ? 'Portrait' : 'পোর্ট্রেট'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintOrientation('landscape')}
                    className={`h-7.5 rounded-lg text-[11px] font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      printOrientation === 'landscape'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <RectangleHorizontal size={13} className={printOrientation === 'landscape' ? 'text-[#0B5D3B] dark:text-emerald-400' : ''} />
                    <span>{isEn ? 'Landscape' : 'ল্যান্ডস্কেপ'}</span>
                  </button>
                </div>

                {/* Margin 3-Way Segmented Control */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    {isEn ? 'Page Margin' : 'পৃষ্ঠার মার্জিন'}
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    {(
                      [
                        { id: 'compact' as const, labelBn: 'কম (৮)', labelEn: '8mm' },
                        { id: 'normal' as const, labelBn: 'মাঝারি (১২)', labelEn: '12mm' },
                        { id: 'wide' as const, labelBn: 'বেশি (১৮)', labelEn: '18mm' },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPrintMargin(m.id)}
                        className={`h-7 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                          printMargin === m.id
                            ? 'bg-white dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {isEn ? m.labelEn : m.labelBn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rows per Page & View Mode (Detailed mode only) */}
                {printReportTab === 'detailed' && (
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div className={totalPrintSheets <= 1 ? 'col-span-2' : ''}>
                      <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                        {isEn ? 'Rows / Page' : 'প্রতি পৃষ্ঠায়'}
                      </label>
                      <select
                        value={printRowsPerPage}
                        onChange={(e) => setPrintRowsPerPage(Number(e.target.value))}
                        className={selectClass(printRowsPerPage > 0)}
                      >
                        <option value={0}>
                          অটো ({printOrientation === 'portrait' ? '২৪–২৮' : '১৫–১৮'} জন)
                        </option>
                        <option value={15}>১৫ জন</option>
                        <option value={20}>২০ জন</option>
                        <option value={25}>২৫ জন</option>
                        <option value={30}>৩০ জন</option>
                      </select>
                    </div>

                    {totalPrintSheets > 1 && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          {isEn ? 'Preview' : 'প্রিভিউ মোড'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowAllPrintSheets(!showAllPrintSheets)}
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950 hover:border-[#0B5D3B]/50 text-[11px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Layers size={12} className="text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
                          <span className="truncate">
                            {showAllPrintSheets
                              ? isEn
                                ? 'All Pages'
                                : 'সব পাতা'
                              : isEn
                                ? 'Single Page'
                                : '১ পাতা করে'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION C: COLUMN CHOOSER (Detailed Mode Only — Inline, Never a Top Drawer) */}
              {printReportTab === 'detailed' && (
                <div className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-black text-[11.5px] text-slate-800 dark:text-slate-100">
                      <Columns3 size={13} className="text-[#0B5D3B] dark:text-emerald-400" />
                      <span>{isEn ? 'Print Columns' : 'প্রিন্ট কলাম'}</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                        {toBanglaNumeral(activeColumnCount)}/{toBanglaNumeral(STUDENT_PRINT_COLUMNS.length)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowColumnSelector(!showColumnSelector)}
                      aria-expanded={showColumnSelector}
                      className="text-[11px] font-bold text-[#0B5D3B] dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{showColumnSelector ? (isEn ? 'Hide' : 'সংকুচিত') : isEn ? 'Customize' : 'বাছাই'}</span>
                      {showColumnSelector ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>

                  {/* Quick 1-Click Presets */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { id: 'basic' as const, labelBn: 'বেসিক তালিকা', labelEn: 'Basic' },
                        { id: 'contact' as const, labelBn: 'যোগাযোগ', labelEn: 'Contact' },
                        { id: 'official' as const, labelBn: 'অফিশিয়াল', labelEn: 'Official' },
                        { id: 'all' as const, labelBn: 'সব কলাম', labelEn: 'All' },
                      ] as const
                    ).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setColumnPreset(preset.id)}
                        className="h-7 px-2 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:border-[#0B5D3B]/40 hover:text-[#0B5D3B] dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 transition cursor-pointer truncate"
                      >
                        {isEn ? preset.labelEn : preset.labelBn}
                      </button>
                    ))}
                  </div>

                  {/* Expandable Compact Checklist */}
                  {showColumnSelector && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1 max-h-56 overflow-y-auto pr-0.5">
                      {STUDENT_PRINT_COLUMNS.map((col) => {
                        const checked = Boolean(selectedColumns[col.key]);
                        const label = cleanColumnLabel(isEn ? col.labelEn : col.labelBn);
                        return (
                          <label
                            key={col.key}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[11px] transition ${
                              col.required ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                            } ${
                              checked
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-[#0B5D3B]/40 dark:border-emerald-800 text-slate-900 dark:text-white font-bold'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleColumn(col.key)}
                              disabled={col.required}
                              className="w-3.5 h-3.5 accent-[#0B5D3B] rounded shrink-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <span className="truncate" title={label}>
                              {label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION D: COMPACT LIVE COUNTS FOOTER */}
              <div className="p-3 bg-slate-50/70 dark:bg-slate-950/60">
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 py-1.5 px-1">
                    <div className="text-[9.5px] font-bold text-slate-400">{isEn ? 'Total' : 'মোট'}</div>
                    <div className="text-xs font-black font-mono text-[#0B5D3B] dark:text-emerald-400">
                      {toBanglaNumeral(printReportTab === 'summary' ? summaryGrandTotal : printTotalCount)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 py-1.5 px-1">
                    <div className="text-[9.5px] font-bold text-slate-400">{isEn ? 'Boys' : 'ছাত্র'}</div>
                    <div className="text-xs font-black font-mono text-slate-800 dark:text-slate-100">
                      {toBanglaNumeral(printReportTab === 'summary' ? summaryTotalBoys : printMaleCount)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 py-1.5 px-1">
                    <div className="text-[9.5px] font-bold text-slate-400">{isEn ? 'Girls' : 'ছাত্রী'}</div>
                    <div className="text-xs font-black font-mono text-slate-800 dark:text-slate-100">
                      {toBanglaNumeral(printReportTab === 'summary' ? summaryTotalGirls : printFemaleCount)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 py-1.5 px-1">
                    <div className="text-[9.5px] font-bold text-slate-400">
                      {printReportTab === 'summary' ? (isEn ? 'Pages' : 'পৃষ্ঠা') : isEn ? 'Stipend' : 'উপবৃত্তি'}
                    </div>
                    <div className="text-xs font-black font-mono text-slate-800 dark:text-slate-100">
                      {toBanglaNumeral(printReportTab === 'summary' ? 1 : printStipendCount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* RIGHT LIVE A4 PAPER PREVIEW CANVAS (DIRECTLY VISIBLE, ZERO BARS)  */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 min-w-0 w-full space-y-3 print:space-y-0 print:w-full">
          <div
            ref={canvasTrayRef}
            className="bg-slate-200/55 dark:bg-slate-900/60 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 sm:p-5 overflow-x-auto print:bg-white print:border-0 print:p-0 print:rounded-none print:overflow-visible"
          >
            {printReportTab === 'summary' ? (
              <ScaledA4Sheet
                naturalWidthPx={naturalSheetWidthPx}
                scale={effectiveScale}
                sheetId="inpage-print-sheet-summary"
              >
                <div
                  style={sheetSurfaceStyle}
                  className="inpage-print-sheet bg-white text-slate-900 font-sans rounded-[3px] border border-slate-300/90 shadow-[0_12px_30px_-12px_rgba(15,23,42,0.22)] box-border relative overflow-hidden flex flex-col justify-between print:border-none print:rounded-none print:shadow-none"
                >
                  {/* Institutional Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.028] select-none z-0">
                    <div className="text-center transform -rotate-12">
                      <h2 className="text-7xl font-black uppercase text-slate-900 tracking-widest">
                        {schoolName}
                      </h2>
                      <p className="text-3xl font-black text-slate-900 mt-2">OFFICIAL STUDENT DIRECTORY</p>
                    </div>
                  </div>

                  <div className="relative z-10 space-y-3">
                    {/* Official Letterhead */}
                    <div className="border-b-2 border-slate-900 pb-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                          {schoolSettings?.schoolLogo ? (
                            <img src={schoolSettings.schoolLogo} alt="School Logo" className="w-16 h-16 object-contain" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-[#0B5D3B] text-white border-2 border-emerald-700 flex items-center justify-center">
                              <GraduationCap className="w-8 h-8 text-amber-200" />
                            </div>
                          )}
                        </div>

                        <div className="text-center flex-1 pr-16">
                          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-serif">
                            {schoolName}
                          </h1>
                          {schoolAddress && (
                            <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{schoolAddress}</p>
                          )}
                          {metaLineText && (
                            <p className="text-[11px] sm:text-xs font-semibold text-slate-600 mt-0.5">{metaLineText}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Class Summary Table */}
                    <div className="my-3">
                      <div className="text-center font-bold text-base sm:text-lg my-3 text-slate-950 font-serif">
                        {currentYearBn} সালের শ্রেণিভিত্তিক শিক্ষার্থী সংখ্যা
                        {(printBranchFilter !== 'all' || printReligionFilter !== 'all' || printStipendFilter !== 'all') && (
                          <span className="block text-[11px] font-sans font-semibold text-slate-600 mt-0.5">
                            {[
                              printBranchFilter !== 'all' ? `শাখা: ${printBranchFilter}` : '',
                              printReligionFilter !== 'all' ? `ধর্ম: ${printReligionFilter}` : '',
                              printStipendFilter === 'stipend_only' ? 'শুধু উপবৃত্তিপ্রাপ্ত' : '',
                            ]
                              .filter(Boolean)
                              .join(' · ')}
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
                  </div>

                  {/* Signature Block */}
                  <div className="signature-avoid-break pt-14 pb-2 flex justify-end text-center text-xs font-bold text-slate-900 relative z-10">
                    <div className="space-y-1">
                      <div className="w-48 border-b border-slate-900 mx-auto" />
                      <p className="font-extrabold text-slate-950">প্রধান শিক্ষক</p>
                      <p className="text-[10px] text-slate-600 font-bold">
                        {schoolName}
                        {schoolAddress ? `, ${schoolAddress}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </ScaledA4Sheet>
            ) : (
              <div className="space-y-5 print:space-y-0">
                {paginatedPrintSheets.map((sheet) => {
                  const isFirstPage = sheet.pageNumber === 1;
                  const isLastPage = sheet.pageNumber === totalPrintSheets;
                  const hiddenOnScreen = !showAllPrintSheets && safePrintPreviewPage !== sheet.pageNumber;

                  return (
                    <ScaledA4Sheet
                      key={sheet.pageNumber}
                      sheetId={`inpage-print-sheet-${sheet.pageNumber}`}
                      naturalWidthPx={naturalSheetWidthPx}
                      scale={effectiveScale}
                      hiddenOnScreen={hiddenOnScreen}
                    >
                      <div
                        style={sheetSurfaceStyle}
                        className={`inpage-print-sheet ${!isLastPage ? 'inpage-sheet-break' : ''} bg-white text-slate-900 font-sans rounded-[3px] border border-slate-300/90 shadow-[0_12px_30px_-12px_rgba(15,23,42,0.22)] box-border relative overflow-hidden flex flex-col justify-between print:border-none print:rounded-none print:shadow-none`}
                      >
                        {/* Institutional Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.028] select-none z-0">
                          <div className="text-center transform -rotate-12">
                            <h2 className="text-7xl font-black uppercase text-slate-900 tracking-widest">
                              {schoolName}
                            </h2>
                            <p className="text-3xl font-black text-slate-900 mt-2">OFFICIAL STUDENT DIRECTORY</p>
                          </div>
                        </div>

                        <div className="relative z-10 space-y-3">
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
                                    <div className="w-16 h-16 rounded-full bg-[#0B5D3B] text-white border-2 border-emerald-700 flex items-center justify-center">
                                      <GraduationCap className="w-8 h-8 text-amber-200" />
                                    </div>
                                  )}
                                </div>

                                <div className="text-center flex-1 pr-16">
                                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-serif">
                                    {schoolName}
                                  </h1>
                                  {schoolAddress && (
                                    <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                                      {schoolAddress}
                                    </p>
                                  )}
                                  {metaLineText && (
                                    <p className="text-[11px] sm:text-xs font-semibold text-slate-600 mt-0.5">
                                      {metaLineText}
                                    </p>
                                  )}
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
                                    শ্রেণি: {gradeBannerLabel}
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
                                  {schoolName}
                                </span>
                                <span className="text-slate-400">|</span>
                                <span>শিক্ষার্থী তালিকা — {currentYearBn} ({gradeBannerLabel})</span>
                              </div>
                              <div>
                                পৃষ্ঠা:{' '}
                                <strong>
                                  {toBanglaNumeral(sheet.pageNumber)} / {toBanglaNumeral(totalPrintSheets)}
                                </strong>
                              </div>
                            </div>
                          )}

                          <div>
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
                                        {st.grade} ({st.branch || st.section || 'A'})
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
                                        {st.bloodGroup || '-'}
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
                        </div>

                        {/* Official Signature & Running Page Footer */}
                        <div className="signature-avoid-break relative z-10">
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
                                  {schoolName}
                                  {schoolAddress ? `, ${schoolAddress}` : ''}
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
                              <span>{schoolName} — অফিশিয়াল শিক্ষার্থী ডিরেক্টরি</span>
                              <span>
                                পৃষ্ঠা: <strong>{toBanglaNumeral(sheet.pageNumber)}</strong> /{' '}
                                <strong>{toBanglaNumeral(totalPrintSheets)}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </ScaledA4Sheet>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quiet Bottom Pagination Strip (ONLY when multi-page Detailed List — below paper, never a top bar) */}
          {printReportTab === 'detailed' && totalPrintSheets > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-1 print:hidden">
              <button
                type="button"
                onClick={() => goToPrintSheet(safePrintPreviewPage - 1)}
                disabled={safePrintPreviewPage <= 1}
                className="h-8 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 transition cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft size={13} />
                <span>{isEn ? 'Prev' : 'পূর্ববর্তী'}</span>
              </button>

              <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
                {paginationTokens.map((token, idx) =>
                  token === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="px-1.5 text-slate-400 text-xs select-none">
                      …
                    </span>
                  ) : (
                    <button
                      key={token}
                      type="button"
                      onClick={() => goToPrintSheet(token)}
                      aria-current={safePrintPreviewPage === token ? 'page' : undefined}
                      className={`min-w-7 h-6.5 px-1.5 rounded-lg font-mono font-bold text-xs transition cursor-pointer ${
                        safePrintPreviewPage === token
                          ? 'bg-[#0B5D3B] text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {toBanglaNumeral(token)}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => goToPrintSheet(safePrintPreviewPage + 1)}
                disabled={safePrintPreviewPage >= totalPrintSheets}
                className="h-8 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 transition cursor-pointer disabled:cursor-not-allowed"
              >
                <span>{isEn ? 'Next' : 'পরবর্তী'}</span>
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
