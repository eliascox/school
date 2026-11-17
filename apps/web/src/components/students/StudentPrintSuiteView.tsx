'use client';

import React, { useMemo } from 'react';
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
  Heart,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
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

      const matchBranch = printBranchFilter === 'all' || (st.branch && st.branch.toLowerCase() === printBranchFilter.toLowerCase());
      const matchGroup = printGroupFilter === 'all' || (st.group && st.group.includes(printGroupFilter));
      const matchReligion = matchStudentReligion(st.religion, printReligionFilter);
      const matchGender =
        printGenderFilter === 'all' ||
        (printGenderFilter === 'পুরুষ' ? isMaleGender(st.gender) : isFemaleGender(st.gender));
      const matchStipend = printStipendFilter === 'all' || (printStipendFilter === 'stipend_only' && Boolean(st.isStipend));
      const matchSearch = studentMatchesSearch(st, printSearchQuery);

      return Boolean(matchGrade && matchBranch && matchGroup && matchReligion && matchGender && matchStipend && matchSearch);
    });

    const normalized = raw.map((st) => ({
      ...st,
      section: st.section || st.branch || 'A',
    }));
    return sortStudentsGroupAndRoll(normalized, sortStrategy as RollSortStrategy) as StudentRecord[];
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
  const printMaleCount = printableFilteredStudents.filter((s) => isMaleGender(s.gender)).length;
  const printFemaleCount = printableFilteredStudents.filter((s) => isFemaleGender(s.gender)).length;
  const printMuslimCount = printableFilteredStudents.filter(
    (s) => s.religion && (s.religion.includes('ইসলাম') || s.religion.includes('Muslim'))
  ).length;
  const printHinduCount = printableFilteredStudents.filter(
    (s) => s.religion && (s.religion.includes('হিন্দু') || s.religion.includes('Hindu') || s.religion.includes('সনাতন'))
  ).length;
  const printStipendCount = printableFilteredStudents.filter((s) => Boolean(s.isStipend)).length;

  const paginatedPrintSheets = useMemo(
    () => buildPaginatedPrintSheets(printableFilteredStudents, printOrientation, printRowsPerPage),
    [printableFilteredStudents, printOrientation, printRowsPerPage]
  );

  const totalPrintSheets = paginatedPrintSheets.length;
  const safePrintPreviewPage = Math.min(printPreviewPage, totalPrintSheets);

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

  return (
    <div className="space-y-6">
      {/* Top Action & Controls Ribbon */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3.5 overflow-x-auto no-scrollbar">
          {/* Left: Back Button & Mode Segmented Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onBackToList}
              className="h-9 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              title="শিক্ষার্থী তালিকায় ফিরে যান"
            >
              <ArrowLeft size={14} className="text-slate-600 dark:text-slate-400" /> তালিকায় ফিরুন
            </button>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="h-9 flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/90 dark:border-slate-800">
              <button
                onClick={() => {
                  setPrintReportTab('detailed');
                  setPrintOrientation('landscape');
                }}
                className={`h-7 flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  printReportTab === 'detailed'
                    ? 'bg-white dark:bg-slate-900 text-indigo-950 dark:text-indigo-200 shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                বিস্তারিত তালিকা
              </button>
              <button
                onClick={() => {
                  setPrintReportTab('summary');
                  setPrintOrientation('portrait');
                }}
                className={`h-7 flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  printReportTab === 'summary'
                    ? 'bg-white dark:bg-slate-900 text-emerald-950 dark:text-emerald-200 shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                সামারি রিপোর্ট
              </button>
            </div>
          </div>

          {/* Right: Print Settings & Export Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {printReportTab === 'detailed' && (
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className={`h-9 flex items-center gap-1.5 px-3 rounded-xl font-extrabold text-xs transition border cursor-pointer whitespace-nowrap ${
                  showColumnSelector
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-indigo-50/80 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60'
                }`}
                title="প্রিন্ট কলাম নির্বাচন করুন"
              >
                <SlidersHorizontal size={13} />
                কলাম ({toBanglaNumeral(Object.values(selectedColumns).filter(Boolean).length)})
              </button>
            )}

            <div className="h-9 flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/90 dark:border-slate-800">
              <button
                onClick={() => setPrintOrientation('portrait')}
                className={`h-7 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  printOrientation === 'portrait'
                    ? 'bg-white dark:bg-slate-900 text-indigo-950 dark:text-indigo-200 shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                📄 পোর্ট্রেট
              </button>
              <button
                onClick={() => setPrintOrientation('landscape')}
                className={`h-7 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  printOrientation === 'landscape'
                    ? 'bg-white dark:bg-slate-900 text-indigo-950 dark:text-indigo-200 shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                📜 ল্যান্ডস্কেপ
              </button>
            </div>

            <div className="h-9 flex items-center gap-1 bg-slate-50 dark:bg-slate-950 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs whitespace-nowrap">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">মার্জিন:</span>
              <select
                value={printMargin}
                onChange={(e) => setPrintMargin(e.target.value as 'normal' | 'wide' | 'compact')}
                className="bg-transparent text-slate-900 dark:text-white font-extrabold text-xs outline-none cursor-pointer"
              >
                <option value="normal">১২ মিমি (স্ট্যান্ডার্ড)</option>
                <option value="wide">১৮ মিমি (প্রশস্ত)</option>
                <option value="compact">৮ মিমি (কমপ্যাক্ট)</option>
              </select>
            </div>

            {printReportTab === 'detailed' && (
              <div className="h-9 flex items-center gap-1 bg-slate-50 dark:bg-slate-950 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs whitespace-nowrap">
                <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">পৃষ্ঠায়:</span>
                <select
                  value={printRowsPerPage}
                  onChange={(e) => setPrintRowsPerPage(Number(e.target.value))}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold text-xs outline-none cursor-pointer"
                >
                  <option value={0}>অটো ({printOrientation === 'portrait' ? '২৪–২৮' : '১৫–১৮'} জন)</option>
                  <option value={15}>১৫ জন</option>
                  <option value={20}>২০ জন</option>
                  <option value={25}>২৫ জন</option>
                  <option value={30}>৩০ জন</option>
                </select>
              </div>
            )}

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

            <button
              onClick={() =>
                printReportTab === 'summary'
                  ? exportClassSummaryCsv(classSummaryData, summaryTotalBoys, summaryTotalGirls, summaryGrandTotal)
                  : exportPrintableStudentsCsv(printableFilteredStudents, selectedColumns, printGradeFilter)
              }
              className="h-9 flex items-center gap-1.5 px-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl font-extrabold text-xs transition border border-slate-200 dark:border-slate-800 cursor-pointer whitespace-nowrap"
              title="এক্সেল / CSV এক্সপোর্ট"
            >
              <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" /> CSV
            </button>

            <button
              type="button"
              onClick={onOpenBlankPad}
              className="h-9 flex items-center gap-1.5 px-3 bg-emerald-50/80 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 rounded-xl font-extrabold text-xs transition border border-emerald-200 dark:border-emerald-800/60 cursor-pointer whitespace-nowrap"
              title="ফাঁকা স্কুল প্যাড প্রিন্ট"
            >
              <Printer size={14} className="shrink-0" /> স্কুল প্যাড
            </button>

            <button
              onClick={() => {
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
                params.set('year', new Date().getFullYear().toString());
                window.open(`/dashboard/students/print?${params.toString()}`, '_blank');
              }}
              className="h-9 flex items-center gap-1.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md transition transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Printer size={14} className="shrink-0" /> প্রিন্ট / PDF সংরক্ষণ
            </button>
          </div>
        </div>

        {/* Custom Column Selector Panel */}
        {showColumnSelector && (
          <div className="bg-slate-50 dark:bg-slate-950 p-4 sm:p-5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/60 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
                  {currentLang === 'en' ? 'Select Print Columns' : 'প্রিন্ট কলাম নির্বাচন'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">যে যে কলামগুলো তালিকায় ও প্রিন্টে রাখতে চান সেগুলো টিক চিহ্ন দিন</p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">প্রিসেট:</span>
                {(
                  [
                    { id: 'basic', label: 'বেসিক তালিকা' },
                    { id: 'contact', label: 'যোগাযোগ ও অভিভাবক' },
                    { id: 'official', label: 'অফিশিয়াল রেজিস্টার' },
                    { id: 'all', label: 'সব কলাম অন' },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setColumnPreset(preset.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer ${
                      preset.id === 'all'
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/60 font-black'
                        : 'bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-800 font-bold'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs">
              {STUDENT_PRINT_COLUMNS.map((col) => (
                <label
                  key={col.key}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border transition cursor-pointer ${
                    selectedColumns[col.key]
                      ? 'bg-white dark:bg-slate-900 border-indigo-400 text-indigo-950 dark:text-indigo-200 font-bold shadow-xs'
                      : 'bg-slate-100/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(selectedColumns[col.key])}
                    onChange={() => toggleColumn(col.key)}
                    disabled={col.required}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                  <span className="text-[11px] truncate">{currentLang === 'en' ? col.labelEn : col.labelBn}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Multi-Dimensional Filters Bar */}
        {printReportTab === 'detailed' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                <GraduationCap size={12} className="text-indigo-600 dark:text-indigo-400" /> শ্রেণি (Class)
              </label>
              <select
                value={printGradeFilter}
                onChange={(e) => setPrintGradeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">{currentLang === 'en' ? 'All Classes' : 'সকল শ্রেণি'}</option>
                <option value="6th">৬ষ্ঠ শ্রেণি (Class 6)</option>
                <option value="7th">৭ম শ্রেণি (Class 7)</option>
                <option value="8th">৮ম শ্রেণি (Class 8)</option>
                <option value="9th">৯ম শ্রেণি (Class 9)</option>
                <option value="10th">১০ম শ্রেণি (Class 10)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Building2 size={12} className="text-indigo-600 dark:text-indigo-400" /> শাখা (Section)
              </label>
              <select
                value={printBranchFilter}
                onChange={(e) => setPrintBranchFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">{currentLang === 'en' ? 'All Sections' : 'সকল শাখা'}</option>
                <option value="A">শাখা A</option>
                <option value="B">শাখা B</option>
                <option value="C">শাখা C</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Layers size={12} className="text-indigo-600 dark:text-indigo-400" /> বিভাগ / গ্রুপ
              </label>
              <select
                value={printGroupFilter}
                onChange={(e) => setPrintGroupFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">{currentLang === 'en' ? 'All Groups' : 'সকল বিভাগ'}</option>
                <option value="সাধারণ">{currentLang === 'en' ? 'General' : 'সাধারণ'}</option>
                <option value="বিজ্ঞান">{currentLang === 'en' ? 'Science' : 'বিজ্ঞান'}</option>
                <option value="মানবিক">{currentLang === 'en' ? 'Humanities' : 'মানবিক'}</option>
                <option value="ব্যবসায় শিক্ষা">{currentLang === 'en' ? 'Business Studies' : 'ব্যবসায় শিক্ষা'}</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Heart size={12} className="text-indigo-600 dark:text-indigo-400" /> ধর্ম ভিত্তিক (Religion)
              </label>
              <select
                value={printReligionFilter}
                onChange={(e) => setPrintReligionFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">{currentLang === 'en' ? 'All Religions' : 'সকল ধর্ম'}</option>
                <option value="ইসলাম">{currentLang === 'en' ? 'Islam' : 'ইসলাম ধর্ম'}</option>
                <option value="হিন্দু">{currentLang === 'en' ? 'Hinduism' : 'হিন্দু ধর্ম'}</option>
                <option value="বৌদ্ধ">{currentLang === 'en' ? 'Buddhism' : 'বৌদ্ধ ধর্ম'}</option>
                <option value="খ্রিস্টান">{currentLang === 'en' ? 'Christianity' : 'খ্রিস্ট ধর্ম'}</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                <User size={12} className="text-indigo-600 dark:text-indigo-400" /> লিঙ্গ ভিত্তিক (Gender)
              </label>
              <select
                value={printGenderFilter}
                onChange={(e) => setPrintGenderFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">{currentLang === 'en' ? 'All Students' : 'সকল শিক্ষার্থী'}</option>
                <option value="পুরুষ">{currentLang === 'en' ? 'Boys / Male' : 'ছাত্র / পুরুষ'}</option>
                <option value="মহিলা">{currentLang === 'en' ? 'Girls / Female' : 'ছাত্রী / মহিলা'}</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Search size={12} className="text-indigo-600 dark:text-indigo-400" /> তাৎক্ষণিক খুঁজুন
              </label>
              <input
                type="text"
                value={printSearchQuery}
                onChange={(e) => setPrintSearchQuery(e.target.value)}
                placeholder="নাম, রোল, মোবাইল..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Interactive Summary Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 print:hidden">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-950 text-white p-4 rounded-2xl border border-indigo-800 shadow-sm">
          <span className="text-[10px] font-bold text-indigo-300 block uppercase">মোট শিক্ষার্থী</span>
          <div className="text-2xl font-black text-white mt-1">
            {printTotalCount} <span className="text-xs font-normal">জন</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">ছাত্র (Boys)</span>
          <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
            {printMaleCount}
            <span className="text-[11px] font-bold text-slate-400 ml-1.5">
              ({printTotalCount > 0 ? ((printMaleCount / printTotalCount) * 100).toFixed(1) : 0}%)
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">ছাত্রী (Girls)</span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {printFemaleCount}
            <span className="text-[11px] font-bold text-slate-400 ml-1.5">
              ({printTotalCount > 0 ? ((printFemaleCount / printTotalCount) * 100).toFixed(1) : 0}%)
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">মুসলিম শিক্ষার্থী</span>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            {printMuslimCount} <span className="text-xs font-normal text-slate-400">জন</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block uppercase">হিন্দু শিক্ষার্থী</span>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
            {printHinduCount} <span className="text-xs font-normal text-slate-400">জন</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block uppercase">অন্যান্য / উপবৃত্তি</span>
          <div className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">
            {printStipendCount} <span className="text-xs font-normal text-slate-400">জন</span>
          </div>
        </div>
      </div>

      {/* Print CSS Injection */}
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

      {/* Multi-Page Navigation Bar */}
      {printReportTab === 'detailed' && (
        <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-md flex items-center justify-between flex-wrap gap-3 print:hidden">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <span className="px-3 py-1 rounded-xl bg-slate-800 text-amber-300 border border-slate-700">
              A4 {printOrientation === 'landscape' ? 'ল্যান্ডস্কেপ' : 'পোর্ট্রেট'} | মোট পৃষ্ঠা: {toBanglaNumeral(totalPrintSheets)} টি
            </span>
            <span className="text-slate-300 hidden md:inline">
              • মার্জিন:{' '}
              {printMargin === 'wide' ? 'প্রশস্ত (১৮ মিমি)' : printMargin === 'compact' ? 'কমপ্যাক্ট (৮ মিমি)' : 'স্ট্যান্ডার্ড (১২ মিমি)'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {totalPrintSheets > 1 && (
              <button
                type="button"
                onClick={() => setShowAllPrintSheets(!showAllPrintSheets)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border transition cursor-pointer ${
                  !showAllPrintSheets
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <Layers size={14} />
                {showAllPrintSheets ? 'এক পৃষ্ঠা করে দেখুন' : 'সব পৃষ্ঠা একসাথে দেখুন'}
              </button>
            )}

            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => goToPrintSheet(safePrintPreviewPage - 1)}
                disabled={safePrintPreviewPage <= 1}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 disabled:opacity-40 text-white font-bold flex items-center gap-1 transition cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft size={13} /> পূর্ববর্তী পৃষ্ঠা
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPrintSheets }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goToPrintSheet(p)}
                    className={`w-7 h-7 rounded-lg font-extrabold text-xs transition cursor-pointer ${
                      safePrintPreviewPage === p
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {toBanglaNumeral(p)}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => goToPrintSheet(safePrintPreviewPage + 1)}
                disabled={safePrintPreviewPage >= totalPrintSheets}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 disabled:opacity-40 text-white font-bold flex items-center gap-1 transition cursor-pointer disabled:cursor-not-allowed"
              >
                পরবর্তী পৃষ্ঠা <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary or Detailed Print Sheets */}
      {printReportTab === 'summary' ? (
        <div
          style={inPageSheetStyle}
          className="inpage-print-sheet bg-white text-slate-900 font-sans mx-auto rounded-2xl shadow-md box-border relative overflow-hidden flex flex-col justify-between transition-all"
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none z-0">
            <div className="text-center transform -rotate-12">
              <h2 className="text-7xl font-black uppercase text-slate-900 tracking-widest">
                {schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
              </h2>
              <p className="text-3xl font-black text-slate-900 mt-2">OFFICIAL STUDENT DIRECTORY</p>
            </div>
          </div>

          <div className="relative z-10 space-y-3">
            <div className="border-b-2 border-slate-900 pb-3">
              <div className="flex items-center justify-between gap-4">
                <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                  {schoolSettings?.schoolLogo ? (
                    <img src={schoolSettings.schoolLogo} alt="School Logo" className="w-16 h-16 object-contain" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-emerald-800 text-white border-2 border-emerald-600 shadow-xs flex flex-col items-center justify-center">
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

            <div className="overflow-x-auto my-3">
              <div className="text-center font-bold text-base sm:text-lg my-3 text-slate-950 font-serif">
                ২০২৬ সালের শিক্ষার্থী সংখ্যা
              </div>

              <table className="print-table w-full text-center text-xs border-collapse border border-black shadow-xs bg-white">
                <thead>
                  <tr className="bg-white text-black font-bold text-xs uppercase border border-black">
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
                            <td className="p-2 text-center border border-black font-mono font-bold">{toBanglaNumeral(row.data.boys)}</td>
                            <td className="p-2 text-center border border-black font-mono font-bold">{toBanglaNumeral(row.data.girls)}</td>
                            <td className="p-2 text-center border border-black font-mono font-bold">{toBanglaNumeral(row.data.total)}</td>
                            {row.first && (
                              <td rowSpan={10} className="p-2 text-center border border-black align-middle text-xs text-slate-500 font-normal"></td>
                            )}
                          </tr>
                        ))}

                        {[
                          { sl: '০৪', grade: '৯ম', groups: [{ label: 'বিজ্ঞান', data: r9Sci }, { label: 'মানবিক', data: r9Hum }, { label: 'ব্যবসায় শিক্ষা', data: r9Bs }] },
                          { sl: '০৫', grade: '১০ম', groups: [{ label: 'বিজ্ঞান', data: r10Sci }, { label: 'মানবিক', data: r10Hum }, { label: 'ব্যবসায় শিক্ষা', data: r10Bs }] },
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
                              <td className="p-2 text-center border border-black font-mono font-bold">{toBanglaNumeral(grp.data.boys)}</td>
                              <td className="p-2 text-center border border-black font-mono font-bold">{toBanglaNumeral(grp.data.girls)}</td>
                              <td className="p-2 text-center border border-black font-mono font-bold">{toBanglaNumeral(grp.data.total)}</td>
                            </tr>
                          ))
                        )}

                        <tr className="font-bold border-2 border-black">
                          <td colSpan={3} className="p-2 text-center border border-black font-bold">
                            মোট
                          </td>
                          <td className="p-2 text-center border border-black font-mono font-bold">{toBanglaNumeral(summaryTotalBoys)}</td>
                          <td className="p-2 text-center border border-black font-mono font-bold">{toBanglaNumeral(summaryTotalGirls)}</td>
                          <td className="p-2 text-center border border-black font-mono font-bold">{toBanglaNumeral(summaryGrandTotal)}</td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            <div className="signature-avoid-break pt-14 pb-2 flex justify-end text-center text-xs font-bold text-slate-900">
              <div className="space-y-1">
                <div className="w-48 border-b border-slate-900 mx-auto"></div>
                <p className="font-extrabold text-slate-950">প্রধান শিক্ষক</p>
                <p className="text-[10px] text-slate-600 font-bold">
                  {schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান'}{schoolSettings?.address ? `, ${schoolSettings.address}` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 print:space-y-0">
          {paginatedPrintSheets.map((sheet) => {
            const isFirstPage = sheet.pageNumber === 1;
            const isLastPage = sheet.pageNumber === totalPrintSheets;
            const hiddenOnScreen = !showAllPrintSheets && safePrintPreviewPage !== sheet.pageNumber;

            return (
              <div
                key={sheet.pageNumber}
                id={`inpage-print-sheet-${sheet.pageNumber}`}
                style={hiddenOnScreen ? { ...inPageSheetStyle, display: 'none' } : inPageSheetStyle}
                className={`inpage-print-sheet ${!isLastPage ? 'inpage-sheet-break' : ''} bg-white text-slate-900 font-sans mx-auto rounded-2xl shadow-md box-border relative overflow-hidden flex flex-col justify-between transition-all`}
              >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none z-0">
                  <div className="text-center transform -rotate-12">
                    <h2 className="text-7xl font-black uppercase text-slate-900 tracking-widest">
                      {schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                    </h2>
                    <p className="text-3xl font-black text-slate-900 mt-2">OFFICIAL STUDENT DIRECTORY</p>
                  </div>
                </div>

                <div className="relative z-10 space-y-3">
                  <div className="print:hidden flex items-center justify-between pb-2 border-b border-dashed border-slate-200 text-[11px] font-bold text-slate-400">
                    <span>
                      📄 পৃষ্ঠা {toBanglaNumeral(sheet.pageNumber)} / {toBanglaNumeral(totalPrintSheets)} (
                      {printOrientation === 'landscape' ? 'ল্যান্ডস্কেপ' : 'পোর্ট্রেট'})
                    </span>
                    <span>
                      ক্রম:{' '}
                      {sheet.rows.length > 0
                        ? `${toBanglaNumeral(sheet.rows[0].globalIndex)} – ${toBanglaNumeral(sheet.rows[sheet.rows.length - 1].globalIndex)}`
                        : '০'}{' '}
                      (মোট {toBanglaNumeral(printTotalCount)} জন)
                    </span>
                  </div>

                  {isFirstPage ? (
                    <div className="border-b-2 border-slate-900 pb-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                          {schoolSettings?.schoolLogo ? (
                            <img src={schoolSettings.schoolLogo} alt="School Logo" className="w-16 h-16 object-contain" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-emerald-800 text-white border-2 border-emerald-600 shadow-xs flex flex-col items-center justify-center">
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

                      <div className="text-center mt-2">
                        <div className="inline-block px-6 py-1 bg-[#0a2558] text-white font-black text-xs uppercase tracking-wider rounded-md border border-amber-400 shadow-xs">
                          শিক্ষার্থী তালিকা ও সাধারণ বিবরণী - ২০২৬
                        </div>
                      </div>

                      <div className="grid grid-cols-3 items-center text-[10.5px] font-bold text-slate-700 mt-2 px-3 py-1.5 bg-slate-50 rounded border border-slate-300">
                        <div className="text-left flex items-center gap-1.5">
                          <span>শাখা:</span>
                          <span className="text-indigo-950 font-black">{printBranchFilter === 'all' ? 'সকল শাখা' : printBranchFilter}</span>
                          <span className="text-slate-400">|</span>
                          <span>বিভাগ:</span>
                          <span className="text-indigo-950 font-black">{printGroupFilter === 'all' ? 'সকল বিভাগ' : printGroupFilter}</span>
                        </div>
                        <div className="text-center">
                          <span className="font-black text-xs sm:text-[13px] text-indigo-950 tracking-wide font-serif border-b-2 border-indigo-950 pb-0.5 px-2.5">
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
                          তারিখ: <span className="font-mono text-slate-900 font-bold">{new Date().toLocaleDateString('bn-BD')}</span>
                        </div>
                      </div>

                      <div className="bg-slate-100/90 border border-slate-800 px-3 py-1 text-[10px] font-bold text-slate-900 flex justify-between items-center rounded-sm mt-2">
                        <span>
                          মোট শিক্ষার্থী: <strong className="text-indigo-900">{toBanglaNumeral(printTotalCount)} জন</strong>
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
                        <span>শিক্ষার্থী তালিকা — ২০২৬ (পূর্ববর্তী পৃষ্ঠার পর)</span>
                      </div>
                      <div>
                        পৃষ্ঠা: <strong>{toBanglaNumeral(sheet.pageNumber)} / {toBanglaNumeral(totalPrintSheets)}</strong>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="print-table w-full text-left text-[11px] border-collapse border border-slate-800">
                      <thead>
                        <tr className="bg-[#0a2558] text-white font-extrabold text-[10px] uppercase border border-slate-800">
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
                          {selectedColumns.optionalSubject && <th className="p-1.5 text-center border border-slate-700">৪র্থ/ঐচ্ছিক বিষয়</th>}
                          {selectedColumns.birthRegNo && <th className="p-1.5 text-center border border-slate-700">জন্ম নিবন্ধন নম্বর</th>}
                          {selectedColumns.dob && <th className="p-1.5 text-center border border-slate-700">জন্ম তারিখ</th>}
                          {selectedColumns.bloodGroup && <th className="p-1.5 text-center font-bold text-rose-700 border border-slate-700">রক্তের গ্রুপ</th>}
                          {selectedColumns.address && <th className="p-1.5 border border-slate-700">ঠিকানা</th>}
                          {selectedColumns.stipend && <th className="p-1.5 text-center border border-slate-700">উপবৃত্তি</th>}
                          {selectedColumns.remarks && <th className="p-1.5 text-center w-24 border border-slate-700">মন্তব্য / স্বাক্ষর</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 text-slate-900 font-semibold">
                        {sheet.rows.map(({ student: st, globalIndex }, idx) => (
                          <tr key={st.id || globalIndex} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
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
                              <td className="p-1.5 text-center font-mono text-[9px] text-slate-700 border border-slate-400">{st.id}</td>
                            )}
                            {selectedColumns.name && (
                              <td className="p-1.5 font-bold text-slate-950 border border-slate-400 whitespace-nowrap">{st.name}</td>
                            )}
                            {selectedColumns.gender && (
                              <td className="p-1.5 text-center text-[10px] border border-slate-400">{st.gender || 'পুরুষ'}</td>
                            )}
                            {selectedColumns.religion && (
                              <td className="p-1.5 text-center text-[10px] border border-slate-400">{st.religion || 'ইসলাম'}</td>
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
                              <td className="p-1.5 border border-slate-400 whitespace-nowrap text-slate-800 text-[10px]">{st.guardian}</td>
                            )}
                            {selectedColumns.fatherNid && (
                              <td className="p-1.5 text-center font-mono text-[9px] border border-slate-400">{st.fatherNid || '-'}</td>
                            )}
                            {selectedColumns.motherName && (
                              <td className="p-1.5 border border-slate-400 whitespace-nowrap text-[10px]">{st.motherName || '-'}</td>
                            )}
                            {selectedColumns.motherNid && (
                              <td className="p-1.5 text-center font-mono text-[9px] border border-slate-400">{st.motherNid || '-'}</td>
                            )}
                            {selectedColumns.mobile && (
                              <td className="p-1.5 text-center font-mono text-[10px] border border-slate-400 text-slate-800">{st.mobile}</td>
                            )}
                            {selectedColumns.optionalSubject && (
                              <td className="p-1.5 text-center text-[10px] border border-slate-400">{st.optionalSubject || '-'}</td>
                            )}
                            {selectedColumns.birthRegNo && (
                              <td className="p-1.5 text-center font-mono text-[9px] border border-slate-400">{st.birthRegNo || '-'}</td>
                            )}
                            {selectedColumns.dob && (
                              <td className="p-1.5 text-center font-mono text-[9px] border border-slate-400">{st.dob || '-'}</td>
                            )}
                            {selectedColumns.bloodGroup && (
                              <td className="p-1.5 text-center font-bold text-rose-700 text-[10px] border border-slate-400">
                                {st.bloodGroup || 'B+'}
                              </td>
                            )}
                            {selectedColumns.address && (
                              <td className="p-1.5 border border-slate-400 text-[9px] truncate max-w-xs">{st.currentAddress || '-'}</td>
                            )}
                            {selectedColumns.stipend && (
                              <td className="p-1.5 text-center text-[9px] font-bold border border-slate-400">
                                {st.isStipend ? 'উপবৃত্তি' : '-'}
                              </td>
                            )}
                            {selectedColumns.remarks && <td className="p-1.5 border border-slate-400 text-center"></td>}
                          </tr>
                        ))}

                        {sheet.rows.length === 0 && (
                          <tr>
                            <td colSpan={20} className="p-8 text-center text-slate-400 font-bold text-xs border border-slate-300">
                              নির্বাচিত ফিল্টারের ভিত্তিতে কোনো শিক্ষার্থী পাওয়া যায়নি।
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="signature-avoid-break">
                    {isLastPage ? (
                      <div className="pt-12 pb-2 flex justify-between items-end text-center text-xs font-bold text-slate-900">
                        <div className="space-y-1">
                          <div className="w-40 border-b border-slate-900 mx-auto"></div>
                          <p>শ্রেণি শিক্ষকের স্বাক্ষর</p>
                          <p className="text-[9px] text-slate-500 font-normal">তারিখ: ....................</p>
                        </div>
                        <div className="space-y-1">
                          <div className="w-40 border-b border-slate-900 mx-auto"></div>
                          <p>সহকারী প্রধান শিক্ষক</p>
                          <p className="text-[9px] text-slate-500 font-normal">তারিখ: ....................</p>
                        </div>
                        <div className="space-y-1">
                          <div className="w-48 border-b border-slate-900 mx-auto"></div>
                          <p className="font-extrabold text-slate-950">প্রধান শিক্ষক</p>
                          <p className="text-[9px] text-slate-600 font-bold">
                            {schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান'}{schoolSettings?.address ? `, ${schoolSettings.address}` : ''}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-4 flex items-center justify-between text-[10px] font-bold text-slate-600">
                        <span>চলমান তালিকা — পরবর্তী পৃষ্ঠায় ({toBanglaNumeral(sheet.pageNumber + 1)} নং পৃষ্ঠায়) দেখুন...</span>
                        <span>অনুস্বাক্ষর: ..............................</span>
                      </div>
                    )}

                    {totalPrintSheets > 1 && (
                      <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                        <span>{schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান'} — অফিশিয়াল শিক্ষার্থী ডিরেক্টরি</span>
                        <span>
                          পৃষ্ঠা: <strong>{toBanglaNumeral(sheet.pageNumber)}</strong> / <strong>{toBanglaNumeral(totalPrintSheets)}</strong>
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
  );
}
