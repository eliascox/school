'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  GraduationCap,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Printer,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { studentService, type Student } from '@/services/studentService';
import { settingsService, type SchoolSettings } from '@/services/settingsService';
import { triggerProfessionalPrint } from '@/lib/printPdfUtils';
import { toBanglaDigits } from '@/lib/omr/omrTemplates';
import {
  RANK_GRADE_BN_MAP,
  RANK_GRADE_EN_MAP,
  getRankGroupEn,
  normalizeRankGrade,
} from '@/lib/rankResultUtils';
import {
  DEFAULT_PRINT_COLUMNS,
  STUDENT_PRINT_COLUMNS_META,
  STUDENT_PRINT_PRESETS,
  type StudentPrintColumnKey,
  type StudentPrintFilters,
  type StudentPrintLang,
  type StudentPrintMargin,
  type StudentPrintOrientation,
  type StudentPrintPresetId,
  type StudentPrintReportType,
  buildColumnsMapForPreset,
  buildSamplePrintStudents,
  buildStudentPrintExcelRows,
  computeStudentClassSummary,
  filterAndSortPrintStudents,
  formatPrintDigits,
  formatStudentCellValue,
  getStudentPrintHeader,
  isFemaleGender,
  isMaleGender,
  paginateStudentPrintRows,
} from '@/lib/studentPrintUtils';
import { StudentPrintControlRail } from '@/components/students/StudentPrintControlRail';

function PrintPageContent() {
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [allStudentsList, setAllStudentsList] = useState<Student[]>([]);
  const [settings, setSettings] = useState<SchoolSettings>(() => settingsService.getSettings());

  // Studio States
  const [activePreset, setActivePreset] = useState<StudentPrintPresetId | 'custom'>(
    'attendance_register',
  );
  const [reportType, setReportType] = useState<StudentPrintReportType>('detailed');
  const [orientation, setOrientation] = useState<StudentPrintOrientation>('portrait');
  const [marginPreset, setMarginPreset] = useState<StudentPrintMargin>('normal');
  const [rowsPerPage, setRowsPerPage] = useState<number>(0);
  const [docLang, setDocLang] = useState<StudentPrintLang>('bn');
  const [activeCols, setActiveCols] = useState<Record<StudentPrintColumnKey, boolean>>(() =>
    buildColumnsMapForPreset('attendance_register'),
  );
  const [currentSheetPage, setCurrentSheetPage] = useState<number>(1);
  const [viewAllSheets, setViewAllSheets] = useState<boolean>(true);
  const [samplePreview, setSamplePreview] = useState<boolean>(false);

  // Split-Pane Visibility
  const [railVisible, setRailVisible] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [filters, setFilters] = useState<StudentPrintFilters>({
    grade: 'all',
    branch: 'all',
    group: 'all',
    gender: 'all',
    religion: 'all',
    stipend: 'all',
    q: '',
  });
  const [year, setYear] = useState('2026');

  // Hydrate students, settings & initial URL query params
  useEffect(() => {
    setAllStudentsList(studentService.getAllStudents());
    setSettings(settingsService.getSettings());

    const unsubStudents = studentService.subscribe(() => {
      setAllStudentsList(studentService.getAllStudents());
    });
    const unsubSettings = settingsService.subscribe((s) => {
      if (s) setSettings(s);
    });

    const tabParam = searchParams?.get('tab');
    const typeParam = searchParams?.get('type');
    if (tabParam === 'summary' || typeParam === 'summary') {
      setReportType('summary');
      setActivePreset('class_summary');
      setOrientation('portrait');
    } else if (tabParam === 'detailed' || typeParam === 'detailed') {
      setReportType('detailed');
    }

    const orientationParam = searchParams?.get('orientation');
    if (orientationParam === 'landscape' || orientationParam === 'portrait') {
      setOrientation(orientationParam);
    }

    const marginParam = searchParams?.get('margin');
    if (marginParam === 'normal' || marginParam === 'wide' || marginParam === 'compact') {
      setMarginPreset(marginParam);
    }

    const perPageParam = Number(searchParams?.get('perPage') || 0);
    if (perPageParam > 0) setRowsPerPage(perPageParam);

    const colsParam = searchParams?.get('cols');
    if (colsParam) {
      const colSet = new Set(colsParam.split(',').map((c) => c.trim()).filter(Boolean));
      if (colSet.size > 0) {
        const nextCols = { ...DEFAULT_PRINT_COLUMNS };
        (Object.keys(nextCols) as StudentPrintColumnKey[]).forEach((k) => {
          nextCols[k] = colSet.has(k);
        });
        nextCols.sl = true;
        setActiveCols(nextCols);
        setActivePreset('custom');
      }
    }

    setFilters({
      grade: searchParams?.get('grade') || 'all',
      branch: searchParams?.get('branch') || 'all',
      group: searchParams?.get('group') || 'all',
      gender: searchParams?.get('gender') || 'all',
      religion: searchParams?.get('religion') || 'all',
      stipend: searchParams?.get('stipend') || 'all',
      q: (searchParams?.get('q') || '').trim(),
    });
    setYear(searchParams?.get('year') || '2026');
    setReady(true);

    return () => {
      unsubStudents();
      unsubSettings();
    };
  }, [searchParams]);

  // Only auto-trigger print dialog if caller explicitly requested `?autoprint=1`
  useEffect(() => {
    if (ready && searchParams?.get('autoprint') === '1') {
      const timer = setTimeout(() => {
        window.print();
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [ready, searchParams]);

  // Source dataset (real students or optional sample preview when DB has 0 students)
  const sourceStudents = useMemo(() => {
    if (allStudentsList.length === 0 && samplePreview) {
      return buildSamplePrintStudents();
    }
    return allStudentsList;
  }, [allStudentsList, samplePreview]);

  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      '6th': 0,
      '7th': 0,
      '8th': 0,
      '9th': 0,
      '10th': 0,
    };
    sourceStudents.forEach((st) => {
      const g = normalizeRankGrade(st.grade || st.gradeBn);
      counts[g] = (counts[g] || 0) + 1;
    });
    return counts;
  }, [sourceStudents]);

  const filteredStudents = useMemo(
    () => filterAndSortPrintStudents(sourceStudents, filters),
    [sourceStudents, filters],
  );

  const classSummaryData = useMemo(
    () =>
      computeStudentClassSummary(sourceStudents, {
        branch: filters.branch,
        religion: filters.religion,
        stipend: filters.stipend,
      }),
    [sourceStudents, filters.branch, filters.religion, filters.stipend],
  );

  const summaryTotalBoys = classSummaryData.reduce((sum, r) => sum + r.boys, 0);
  const summaryTotalGirls = classSummaryData.reduce((sum, r) => sum + r.girls, 0);
  const summaryGrandTotal = classSummaryData.reduce((sum, r) => sum + r.total, 0);

  const paginatedDetailedSheets = useMemo(
    () => paginateStudentPrintRows(filteredStudents, orientation, rowsPerPage),
    [filteredStudents, orientation, rowsPerPage],
  );
  const totalDetailedPages = paginatedDetailedSheets.length;

  useEffect(() => {
    setCurrentSheetPage(1);
  }, [orientation, rowsPerPage, reportType, filteredStudents.length]);

  const marginConfig = useMemo(() => {
    const presets = {
      wide: { v: 18, h: 20 },
      compact: { v: 8, h: 10 },
      normal: { v: 12, h: 14 },
    } as const;
    const p = presets[marginPreset] || presets.normal;
    const pageH = orientation === 'landscape' ? 210 : 297;
    return {
      pageMargin: `${p.v}mm ${p.h}mm`,
      screenPadding: `${p.v}mm ${p.h}mm`,
      printContentHeight: `${pageH - p.v * 2 - 1}mm`,
    };
  }, [marginPreset, orientation]);

  const handleApplyPreset = (presetId: StudentPrintPresetId) => {
    const cfg = STUDENT_PRINT_PRESETS[presetId];
    setActivePreset(presetId);
    setReportType(cfg.reportType);
    setOrientation(cfg.orientation);
    if (cfg.reportType === 'detailed') {
      setActiveCols(buildColumnsMapForPreset(presetId));
    }
  };

  const handleUpdateFilters = (patch: Partial<StudentPrintFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const handleToggleColumn = (key: StudentPrintColumnKey) => {
    setActiveCols((prev) => ({ ...prev, [key]: !prev[key] }));
    setActivePreset('custom');
  };

  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    if (reportType === 'summary') {
      const summaryRows = classSummaryData.map((r, i) =>
        docLang === 'en'
          ? {
              SL: i + 1,
              Class: r.gradeEn,
              Group: r.groupEn || 'General',
              Boys: r.boys,
              Girls: r.girls,
              Total: r.total,
            }
          : {
              'ক্র.': toBanglaDigits(i + 1),
              শ্রেণি: r.gradeBn,
              বিভাগ: r.groupBn || 'সাধারণ',
              ছাত্র: toBanglaDigits(r.boys),
              ছাত্রী: toBanglaDigits(r.girls),
              মোট: toBanglaDigits(r.total),
            },
      );
      const ws = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Summary');
      XLSX.writeFile(wb, `Student_Summary_${year}.xlsx`);
      return;
    }

    if (filteredStudents.length === 0) return;
    const rows = buildStudentPrintExcelRows(filteredStudents, activeCols, docLang);
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, `Student_Register_${filters.grade}_${year}.xlsx`);
  };

  const handlePrint = () => {
    const titleLabel =
      activePreset !== 'custom'
        ? docLang === 'en'
          ? STUDENT_PRINT_PRESETS[activePreset].titleEn
          : STUDENT_PRINT_PRESETS[activePreset].titleBn
        : docLang === 'en'
        ? 'Student Register'
        : 'শিক্ষার্থী তালিকা';
    triggerProfessionalPrint([
      titleLabel,
      filters.grade === 'all' ? (docLang === 'en' ? 'All Classes' : 'সকল শ্রেণি') : filters.grade,
      year,
    ]);
  };

  const header = getStudentPrintHeader(settings, docLang);
  const yearDisplay = formatPrintDigits(year, docLang);
  const activeTitle =
    activePreset !== 'custom'
      ? docLang === 'en'
        ? STUDENT_PRINT_PRESETS[activePreset].titleEn
        : STUDENT_PRINT_PRESETS[activePreset].titleBn
      : docLang === 'en'
      ? 'STUDENT DIRECTORY & REGISTER'
      : 'শিক্ষার্থী তালিকা ও সাধারণ বিবরণী';

  const gradeScopeText =
    filters.grade === 'all'
      ? docLang === 'en'
        ? 'All Classes'
        : 'সকল শ্রেণি'
      : docLang === 'en'
      ? RANK_GRADE_EN_MAP[filters.grade] || filters.grade
      : RANK_GRADE_BN_MAP[filters.grade] || filters.grade;

  const groupScopeText =
    filters.group === 'all'
      ? docLang === 'en'
        ? 'All Groups'
        : 'সকল বিভাগ'
      : docLang === 'en'
      ? getRankGroupEn(filters.group)
      : filters.group;

  const maleCount = useMemo(
    () => filteredStudents.filter((s) => isMaleGender(s.gender)).length,
    [filteredStudents],
  );
  const femaleCount = useMemo(
    () => filteredStudents.filter((s) => isFemaleGender(s.gender)).length,
    [filteredStudents],
  );

  const visibleColumnsMeta = useMemo(
    () => STUDENT_PRINT_COLUMNS_META.filter((c) => activeCols[c.key]),
    [activeCols],
  );

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-9 w-9 border-4 border-[#0B5D3B] border-t-transparent mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            শিক্ষার্থী রেজিস্টার স্টুডিও প্রস্তুত হচ্ছে…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-full pb-12 print:p-0 print:m-0 font-sans text-slate-900 dark:text-white"
      suppressHydrationWarning
    >
      {/* PRINT & SHEET STYLES */}
      <style>{`
        @page {
          size: A4 ${orientation};
          margin: ${marginConfig.pageMargin};
        }
        .a4-print-sheet {
          width: ${orientation === 'landscape' ? '297mm' : '210mm'};
          min-height: ${orientation === 'landscape' ? '210mm' : '297mm'};
          margin: 0 auto 20px auto;
          background: #ffffff;
          color: #000000;
          padding: ${marginConfig.screenPadding};
          box-shadow: 0 8px 28px rgba(15, 23, 42, 0.1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
        }
        .official-summary-table,
        .official-detailed-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #000000;
          background: #ffffff;
        }
        .official-summary-table th,
        .official-summary-table td {
          border: 1px solid #000000;
          padding: 7px 5px;
          font-size: 10.5pt;
          color: #000000;
          text-align: center;
        }
        .official-detailed-table thead {
          display: table-header-group !important;
        }
        .official-detailed-table tr,
        .signature-avoid-break {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .official-detailed-table th {
          border: 1px solid #000000;
          padding: 5.5px 5px;
          font-size: 9pt;
          font-weight: 800;
          color: #000000;
          background: #f1f5f9 !important;
        }
        .official-detailed-table td {
          border: 1px solid #000000;
          padding: 5px 5px;
          font-size: 9pt;
          font-weight: 600;
          color: #000000;
          vertical-align: middle;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .a4-print-sheet {
            display: flex !important;
            width: 100% !important;
            min-height: ${marginConfig.printContentHeight} !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          .a4-sheet-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          .a4-print-sheet:last-child {
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
            <StudentPrintControlRail
              activePreset={activePreset}
              onApplyPreset={handleApplyPreset}
              reportType={reportType}
              filters={filters}
              onUpdateFilters={handleUpdateFilters}
              gradeCounts={gradeCounts}
              totalStudentCount={sourceStudents.length}
              docLang={docLang}
              onDocLangChange={setDocLang}
              orientation={orientation}
              onOrientationChange={setOrientation}
              marginPreset={marginPreset}
              onMarginChange={setMarginPreset}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={setRowsPerPage}
              year={year}
              onYearChange={setYear}
              activeCols={activeCols}
              onToggleColumn={handleToggleColumn}
              onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* SPLIT-PANE STUDIO */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-5 print:block">
        {/* Desktop Collapsible Left Rail */}
        {railVisible && (
          <div className="hidden lg:block sticky top-4 print:hidden">
            <StudentPrintControlRail
              activePreset={activePreset}
              onApplyPreset={handleApplyPreset}
              reportType={reportType}
              filters={filters}
              onUpdateFilters={handleUpdateFilters}
              gradeCounts={gradeCounts}
              totalStudentCount={sourceStudents.length}
              docLang={docLang}
              onDocLangChange={setDocLang}
              orientation={orientation}
              onOrientationChange={setOrientation}
              marginPreset={marginPreset}
              onMarginChange={setMarginPreset}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={setRowsPerPage}
              year={year}
              onYearChange={setYear}
              activeCols={activeCols}
              onToggleColumn={handleToggleColumn}
            />
          </div>
        )}

        {/* Right Live A4 Sheet Workspace */}
        <div className="w-full flex-1 min-w-0 max-w-full space-y-4 print:space-y-0">
          {/* Compact Top Action Bar */}
          <div className="bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2.5 print:hidden">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.history.length > 1) {
                    window.history.back();
                  } else if (typeof window !== 'undefined') {
                    window.location.href = '/dashboard/students';
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition"
              >
                <ArrowLeft size={13} /> ফিরে যান
              </button>

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
                <SlidersHorizontal size={14} /> প্রিসেট ও কলাম
              </button>

              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-[#0B5D3B] dark:text-emerald-300 text-xs font-black border border-emerald-200/70 dark:border-emerald-800/60">
                {reportType === 'summary'
                  ? `পরিসংখ্যান ছক (${toBanglaDigits(summaryGrandTotal)} জন)`
                  : `${toBanglaDigits(filteredStudents.length)} জন • ${toBanglaDigits(totalDetailedPages)} পাতা`}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {reportType === 'detailed' && totalDetailedPages > 1 && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    type="button"
                    disabled={currentSheetPage <= 1}
                    onClick={() => {
                      setViewAllSheets(false);
                      setCurrentSheetPage((p) => Math.max(1, p - 1));
                    }}
                    className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35 cursor-pointer"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="px-1 font-mono font-black text-[11px]">
                    {toBanglaDigits(currentSheetPage)} / {toBanglaDigits(totalDetailedPages)}
                  </span>
                  <button
                    type="button"
                    disabled={currentSheetPage >= totalDetailedPages}
                    onClick={() => {
                      setViewAllSheets(false);
                      setCurrentSheetPage((p) => Math.min(totalDetailedPages, p + 1));
                    }}
                    className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35 cursor-pointer"
                  >
                    <ChevronRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewAllSheets((v) => !v)}
                    className={`px-2 py-0.5 rounded-lg text-[10.5px] font-black cursor-pointer inline-flex items-center gap-1 ${
                      viewAllSheets ? 'bg-[#0B5D3B] text-white' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Layers size={11} /> {viewAllSheets ? 'সব' : '১ পাতা'}
                  </button>
                </div>
              )}

              {allStudentsList.length === 0 && (
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
                disabled={reportType === 'detailed' && filteredStudents.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black transition cursor-pointer whitespace-nowrap"
              >
                <Download size={13} /> Excel (.xlsx)
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Printer size={14} /> প্রিন্ট / PDF
              </button>
            </div>
          </div>

          {samplePreview && allStudentsList.length === 0 && (
            <div className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200 text-xs font-bold flex flex-wrap items-center justify-between gap-2 print:hidden">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-600" />
                ডাটাবেজে শিক্ষার্থী না থাকায় ৪ জন শিক্ষার্থীর নমুনা তালিকা (Sample Preview) দেখানো হচ্ছে।
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

          {/* LIVE A4 PRINT SHEETS VIEWPORT (Scrollable cleanly on narrow screens, 0 page overflow) */}
          <div className="bg-slate-200/70 dark:bg-slate-950/70 p-3 sm:p-5 rounded-3xl border border-slate-300/70 dark:border-slate-800 overflow-x-auto print:p-0 print:bg-white print:border-0 print:rounded-none print:overflow-visible">
            {/* VIEW 1: CLASS STATISTICAL SUMMARY REPORT */}
            {reportType === 'summary' && (
              <div className="a4-print-sheet">
                <div>
                  <div className="flex items-center justify-between pb-3 pt-1">
                    <div className="w-15 h-15 shrink-0 flex items-center justify-center">
                      {settings?.schoolLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={settings.schoolLogo}
                          alt="School Logo"
                          className="w-15 h-15 object-contain"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-emerald-800 text-white border-2 border-emerald-600 flex items-center justify-center">
                          <GraduationCap className="w-7 h-7 text-amber-200" />
                        </div>
                      )}
                    </div>
                    <div className="text-center flex-1 pr-14">
                      <div className="text-2xl font-black text-black font-serif leading-tight">
                        {header.schoolName}
                      </div>
                      {header.address && (
                        <p className="text-[10.5pt] font-bold text-slate-900 mt-0.5">
                          {header.address}
                        </p>
                      )}
                      {header.metaLine && (
                        <p className="text-[9pt] font-semibold text-slate-800">{header.metaLine}</p>
                      )}
                    </div>
                  </div>

                  <div className="w-full border-b-[1.5px] border-black my-2" />

                  <div className="text-center font-black text-[13pt] my-3 text-black font-serif tracking-wide">
                    {docLang === 'en'
                      ? `${activeTitle} — ${yearDisplay}`
                      : `${yearDisplay} সালের ${activeTitle}`}
                  </div>

                  <table className="official-summary-table">
                    <thead>
                      <tr>
                        <th style={{ width: '48px' }}>{docLang === 'en' ? 'SL' : 'ক্র. নং'}</th>
                        <th style={{ width: '80px' }}>{docLang === 'en' ? 'Class' : 'শ্রেণি'}</th>
                        <th style={{ width: '140px' }}>{docLang === 'en' ? 'Group' : 'বিভাগ'}</th>
                        <th style={{ width: '80px' }}>{docLang === 'en' ? 'Boys' : 'ছাত্র'}</th>
                        <th style={{ width: '80px' }}>{docLang === 'en' ? 'Girls' : 'ছাত্রী'}</th>
                        <th style={{ width: '80px' }}>{docLang === 'en' ? 'Total' : 'মোট'}</th>
                        <th>{docLang === 'en' ? 'Remarks' : 'মন্তব্য'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classSummaryData.map((row, idx) => (
                        <tr key={row.key}>
                          <td className="font-mono">{formatPrintDigits(String(idx + 1).padStart(2, '0'), docLang)}</td>
                          <td className="font-bold">{docLang === 'en' ? row.gradeEn : row.gradeBn}</td>
                          <td>{docLang === 'en' ? row.groupEn || '—' : row.groupBn || '—'}</td>
                          <td className="font-mono font-bold">{formatPrintDigits(row.boys, docLang)}</td>
                          <td className="font-mono font-bold">{formatPrintDigits(row.girls, docLang)}</td>
                          <td className="font-mono font-black">{formatPrintDigits(row.total, docLang)}</td>
                          {idx === 0 && <td rowSpan={classSummaryData.length + 1} />}
                        </tr>
                      ))}
                      <tr style={{ borderTop: '2px solid black', background: '#f8fafc' }}>
                        <td colSpan={3} className="font-black">
                          {docLang === 'en' ? 'Grand Total' : 'সর্বমোট'}
                        </td>
                        <td className="font-mono font-black">
                          {formatPrintDigits(summaryTotalBoys, docLang)}
                        </td>
                        <td className="font-mono font-black">
                          {formatPrintDigits(summaryTotalGirls, docLang)}
                        </td>
                        <td className="font-mono font-black">
                          {formatPrintDigits(summaryGrandTotal, docLang)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="signature-avoid-break pt-16 pb-3 flex justify-end text-center text-xs font-bold text-black">
                  <div className="space-y-1">
                    <div className="w-52 border-b-[1.5px] border-black mx-auto" />
                    <p className="font-black text-sm">{header.principalTitle}</p>
                    <p className="text-[9.5pt] font-bold text-slate-800">{header.schoolName}</p>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: MULTI-PAGE DETAILED STUDENT REGISTER */}
            {reportType === 'detailed' && (
              <div>
                {paginatedDetailedSheets.map((sheet) => {
                  const isFirstPage = sheet.pageNumber === 1;
                  const isLastPage = sheet.pageNumber === totalDetailedPages;
                  const hiddenOnScreen = !viewAllSheets && currentSheetPage !== sheet.pageNumber;

                  return (
                    <div
                      key={sheet.pageNumber}
                      style={hiddenOnScreen ? { display: 'none' } : undefined}
                      className={`a4-print-sheet ${!isLastPage ? 'a4-sheet-page-break' : ''}`}
                    >
                      <div>
                        {isFirstPage ? (
                          <>
                            <div className="flex items-center justify-between pb-2 pt-0.5">
                              <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                                {settings?.schoolLogo ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={settings.schoolLogo}
                                    alt="School Logo"
                                    className="w-14 h-14 object-contain"
                                  />
                                ) : (
                                  <div className="w-13 h-13 rounded-full bg-emerald-800 text-white border-2 border-emerald-600 flex items-center justify-center">
                                    <GraduationCap className="w-7 h-7 text-amber-200" />
                                  </div>
                                )}
                              </div>
                              <div className="text-center flex-1 pr-14">
                                <div className="text-xl sm:text-[20pt] font-black text-black font-serif leading-tight">
                                  {header.schoolName}
                                </div>
                                {header.address && (
                                  <p className="text-[10pt] font-bold text-slate-900 mt-0.5">
                                    {header.address}
                                  </p>
                                )}
                                {header.metaLine && (
                                  <p className="text-[8.5pt] font-semibold text-slate-800">
                                    {header.metaLine}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="w-full border-b-[1.5px] border-black my-1.5" />

                            <div className="text-center my-1.5">
                              <div className="inline-block px-5 py-1 bg-slate-950 text-white font-black text-xs tracking-wider rounded">
                                {activeTitle} — {yearDisplay}
                              </div>
                            </div>

                            <div className="grid grid-cols-3 items-center text-[9pt] font-bold text-black bg-slate-50 px-3 py-1.5 border border-black my-1.5">
                              <div className="text-left">
                                {docLang === 'en' ? 'Group' : 'বিভাগ'}:{' '}
                                <strong>{groupScopeText}</strong>
                              </div>
                              <div className="text-center">
                                <span className="font-black text-[10.5pt] border-b border-black px-2">
                                  {docLang === 'en' ? 'Class' : 'শ্রেণি'}: {gradeScopeText}
                                </span>
                              </div>
                              <div className="text-right font-mono">
                                {docLang === 'en' ? 'Date' : 'তারিখ'}:{' '}
                                {docLang === 'en'
                                  ? new Date().toLocaleDateString('en-GB')
                                  : new Date().toLocaleDateString('bn-BD')}
                              </div>
                            </div>

                            <div className="bg-slate-100 border border-slate-900 px-3 py-1 text-[8.5pt] font-bold text-black flex justify-between items-center mb-2">
                              <span>
                                {docLang === 'en' ? 'Total Students' : 'মোট শিক্ষার্থী'}:{' '}
                                <strong>{formatPrintDigits(filteredStudents.length, docLang)}</strong>
                              </span>
                              <span>
                                {docLang === 'en' ? 'Boys' : 'ছাত্র'}:{' '}
                                <strong>{formatPrintDigits(maleCount, docLang)}</strong>
                              </span>
                              <span>
                                {docLang === 'en' ? 'Girls' : 'ছাত্রী'}:{' '}
                                <strong>{formatPrintDigits(femaleCount, docLang)}</strong>
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-between border-b-[1.5px] border-black pb-2 mb-2.5 text-[9pt] font-bold text-black">
                            <div>
                              <span className="font-serif font-black text-[11pt]">
                                {header.schoolName}
                              </span>{' '}
                              — {activeTitle} ({yearDisplay})
                            </div>
                            <div>
                              {gradeScopeText} • {docLang === 'en' ? 'Page' : 'পৃষ্ঠা'}{' '}
                              <strong>
                                {formatPrintDigits(sheet.pageNumber, docLang)} /{' '}
                                {formatPrintDigits(totalDetailedPages, docLang)}
                              </strong>
                            </div>
                          </div>
                        )}

                        <table className="official-detailed-table">
                          <thead>
                            <tr>
                              {visibleColumnsMeta.map((col) => (
                                <th
                                  key={col.key}
                                  style={col.width ? { width: col.width } : undefined}
                                  className={col.align === 'left' ? 'text-left' : 'text-center'}
                                >
                                  {docLang === 'en' ? col.labelEn : col.labelBn}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sheet.rows.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={visibleColumnsMeta.length}
                                  className="p-8 text-center text-slate-500 font-bold"
                                >
                                  {docLang === 'en'
                                    ? 'No students matched the active filters.'
                                    : 'নির্বাচিত ফিল্টারে কোনো শিক্ষার্থী পাওয়া যায়নি।'}
                                </td>
                              </tr>
                            ) : (
                              sheet.rows.map(({ student: st, globalIndex }) => (
                                <tr key={st.id || globalIndex}>
                                  {visibleColumnsMeta.map((col) => (
                                    <td
                                      key={col.key}
                                      className={`${
                                        col.align === 'left' ? 'text-left' : 'text-center'
                                      } ${col.key === 'name' || col.key === 'roll' ? 'font-bold' : ''} ${
                                        ['sl', 'roll', 'id', 'mobile', 'fatherNid', 'motherNid', 'birthRegNo', 'dob'].includes(col.key)
                                          ? 'font-mono'
                                          : ''
                                      }`}
                                    >
                                      {formatStudentCellValue(st, col.key, globalIndex, docLang)}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* ATOMIC SIGNATURE FOOTER */}
                      <div className="signature-avoid-break pt-4">
                        {isLastPage ? (
                          <div className="pt-12 pb-2 flex justify-between items-end text-center text-xs font-bold text-black">
                            <div className="space-y-1">
                              <div className="w-36 border-b border-black mx-auto" />
                              <p>{header.classTeacherTitle}</p>
                            </div>
                            <div className="space-y-1">
                              <div className="w-36 border-b border-black mx-auto" />
                              <p>{header.asstHeadTitle}</p>
                            </div>
                            <div className="space-y-1">
                              <div className="w-44 border-b border-black mx-auto" />
                              <p className="font-black">{header.principalTitle}</p>
                              <p className="text-[8.5pt] text-slate-700">{header.schoolName}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-3 flex items-center justify-between text-[8.5pt] font-bold text-slate-700">
                            <span>
                              {docLang === 'en'
                                ? `Continued on page ${sheet.pageNumber + 1}...`
                                : `চলমান তালিকা — পরবর্তী পৃষ্ঠায় (${toBanglaDigits(sheet.pageNumber + 1)}) দেখুন...`}
                            </span>
                            <span>
                              {docLang === 'en' ? 'Initial: ......................' : 'অনুস্বাক্ষর: ......................'}
                            </span>
                          </div>
                        )}
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

export default function StudentPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-xs font-bold text-slate-600">রিপোর্ট লোড হচ্ছে…</p>
        </div>
      }
    >
      <PrintPageContent />
    </Suspense>
  );
}
