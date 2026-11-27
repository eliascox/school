'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  PanelLeftClose,
  PanelLeftOpen,
  Printer,
  ScrollText,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import type { SchoolSettings } from '@/services/settingsService';
import type { AppLanguage } from '@/services/languageService';
import type { Student } from '@/services/studentService';
import { triggerProfessionalPrint } from '@/lib/printPdfUtils';
import { toBanglaDigits } from '@/lib/omr/omrTemplates';
import { normalizeRankGrade } from '@/lib/rankResultUtils';
import { computeStudentClassSummary } from '@/lib/studentPrintUtils';
import {
  BUILT_IN_TABLE_PRESETS,
  DEFAULT_COLUMN_ORDER,
  DEFAULT_TABLE_STYLE,
  type BuiltInTablePresetId,
  type ColumnWidthPreset,
  type CustomBlankColumn,
  type SavedTablePrintTemplate,
  type SignatorySlot,
  type StudentTableFilters,
  type StudentTableStyleConfig,
  type TablePrintLang,
  buildActiveColumnsMap,
  buildOrderedStudentCsvContent,
  buildOrderedStudentExcelRows,
  buildSampleMultiPageStudents,
  createCustomBlankColumn,
  deleteCustomTableTemplate,
  filterAndSortTableStudents,
  loadSavedTableTemplates,
  moveColumnByDelta,
  normalizeColumnOrder,
  reorderColumnOrder,
  resolveVisibleOrderedColumns,
  saveCustomTableTemplate,
} from '@/lib/studentTablePrintEngine';
import { StudentTableCustomizerRail } from './StudentTableCustomizerRail';
import { StudentContinuousPrintSheet } from './StudentContinuousPrintSheet';
import { type StudentRecord } from './studentTypes';

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

export function StudentPrintSuiteView({
  students,
  schoolSettings,
  currentLang,
  availableSections,
  printReportTab,
  setPrintReportTab,
  printOrientation,
  setPrintOrientation,
  printMargin,
  setPrintMargin,
  printRowsPerPage,
  setPrintRowsPerPage,
  selectedColumns,
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
  onOpenBlankPad,
  onBackToList,
}: StudentPrintSuiteViewProps) {
  const [docLang, setDocLang] = useState<TablePrintLang>(currentLang === 'en' ? 'en' : 'bn');
  const [year, setYear] = useState<string>(() => String(new Date().getFullYear()));
  const [activePresetId, setActivePresetId] = useState<BuiltInTablePresetId | 'summary' | 'custom'>(
    'basic_list',
  );
  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COLUMN_ORDER);
  const [activeColumns, setActiveColumns] = useState<Record<string, boolean>>(() => ({
    ...selectedColumns,
    sl: true,
    signature: true,
  }));
  const [customColumns, setCustomColumns] = useState<CustomBlankColumn[]>([]);
  const [styleConfig, setStyleConfig] = useState<StudentTableStyleConfig>(DEFAULT_TABLE_STYLE);
  const [savedTemplates, setSavedTemplates] = useState<SavedTablePrintTemplate[]>([]);

  const [railVisible, setRailVisible] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [samplePreview, setSamplePreview] = useState(false);

  useEffect(() => {
    setSavedTemplates(loadSavedTableTemplates());
  }, []);

  // Ensure default rowsPerPage is 0 (Zero-Gap Continuous Flow) on entry
  useEffect(() => {
    if (printRowsPerPage !== 0) {
      setPrintRowsPerPage(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filters: StudentTableFilters = useMemo(
    () => ({
      grade: printGradeFilter,
      branch: printBranchFilter,
      group: printGroupFilter,
      gender: printGenderFilter,
      religion: printReligionFilter,
      stipend: printStipendFilter,
      q: printSearchQuery,
    }),
    [
      printGradeFilter,
      printBranchFilter,
      printGroupFilter,
      printGenderFilter,
      printReligionFilter,
      printStipendFilter,
      printSearchQuery,
    ],
  );

  const sourceStudents = useMemo(() => {
    if (students.length === 0 && samplePreview) {
      return buildSampleMultiPageStudents(36);
    }
    return students as unknown as Array<Student & Record<string, unknown>>;
  }, [students, samplePreview]);

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

  const sectionOptions = useMemo(() => {
    const set = new Set<string>(['A', 'B', 'C']);
    (availableSections || []).forEach((s) => s.trim() && set.add(s.trim()));
    sourceStudents.forEach((s) => {
      const b = String(s.branch || s.section || '').trim();
      if (b) set.add(b);
    });
    return Array.from(set).sort();
  }, [availableSections, sourceStudents]);

  const filteredStudents = useMemo(
    () => filterAndSortTableStudents(sourceStudents, filters),
    [sourceStudents, filters],
  );

  const classSummaryData = useMemo(
    () =>
      computeStudentClassSummary(sourceStudents as Student[], {
        branch: filters.branch,
        religion: filters.religion,
        stipend: filters.stipend,
      }),
    [sourceStudents, filters.branch, filters.religion, filters.stipend],
  );

  const orderedVisibleColumns = useMemo(
    () =>
      resolveVisibleOrderedColumns({
        columnOrder,
        activeColumns,
        customColumns,
        signatureColWidth: styleConfig.signatureColWidth,
      }),
    [columnOrder, activeColumns, customColumns, styleConfig.signatureColWidth],
  );

  const handleUpdateFilters = (patch: Partial<StudentTableFilters>) => {
    if (patch.grade !== undefined) setPrintGradeFilter(patch.grade);
    if (patch.branch !== undefined) setPrintBranchFilter(patch.branch);
    if (patch.group !== undefined) setPrintGroupFilter(patch.group);
    if (patch.gender !== undefined) setPrintGenderFilter(patch.gender);
    if (patch.religion !== undefined) setPrintReligionFilter(patch.religion);
    if (patch.stipend !== undefined) setPrintStipendFilter?.(patch.stipend);
    if (patch.q !== undefined) setPrintSearchQuery(patch.q);
  };

  const handleResetFilters = () => {
    setPrintGradeFilter('all');
    setPrintBranchFilter('all');
    setPrintGroupFilter('all');
    setPrintGenderFilter('all');
    setPrintReligionFilter('all');
    setPrintStipendFilter?.('all');
    setPrintSearchQuery('');
  };

  const handleApplyPreset = (presetId: BuiltInTablePresetId) => {
    const spec = BUILT_IN_TABLE_PRESETS[presetId];
    setPrintReportTab('detailed');
    setActivePresetId(presetId);
    setPrintOrientation(spec.orientation);
    const nextCustom = spec.customColumns ? [...spec.customColumns] : [];
    setCustomColumns(nextCustom);
    setColumnOrder(normalizeColumnOrder(spec.columnOrder, nextCustom));
    setActiveColumns(buildActiveColumnsMap(spec.activeKeys));
    setStyleConfig((prev) => ({
      ...prev,
      rowDensity: spec.rowDensity,
      signatureColWidth: spec.signatureColWidth,
    }));
  };

  const handleToggleColumn = (key: string) => {
    if (key === 'sl') return;
    setActiveColumns((prev) => ({ ...prev, [key]: !prev[key] }));
    setActivePresetId('custom');
  };

  const handleMoveColumn = (key: string, delta: -1 | 1) => {
    setColumnOrder((prev) =>
      moveColumnByDelta(
        normalizeColumnOrder(prev, customColumns),
        key,
        delta,
        activeColumns[key] ? activeColumns : undefined,
      ),
    );
    setActivePresetId('custom');
  };

  const handleDragReorderColumn = (fromKey: string, toKey: string) => {
    setColumnOrder((prev) =>
      reorderColumnOrder(normalizeColumnOrder(prev, customColumns), fromKey, toKey),
    );
    setActivePresetId('custom');
  };

  const handleAddCustomColumn = (labelBn: string, labelEn: string, width: ColumnWidthPreset) => {
    const created = createCustomBlankColumn({ labelBn, labelEn, width });
    setCustomColumns((prev) => [...prev, created]);
    setColumnOrder((prev) => {
      const sigIdx = prev.indexOf('signature');
      if (sigIdx >= 0) {
        const next = [...prev];
        next.splice(sigIdx, 0, created.id);
        return next;
      }
      return [...prev, created.id];
    });
    setActiveColumns((prev) => ({ ...prev, [created.id]: true }));
    setActivePresetId('custom');
  };

  const handleRemoveCustomColumn = (id: string) => {
    setCustomColumns((prev) => prev.filter((c) => c.id !== id));
    setColumnOrder((prev) => prev.filter((k) => k !== id));
    setActiveColumns((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleUpdateSignatory = (id: string, patch: Partial<SignatorySlot>) => {
    setStyleConfig((prev) => ({
      ...prev,
      signatories: prev.signatories.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const handleSaveTemplate = (name: string) => {
    const updated = saveCustomTableTemplate({
      name,
      orientation: printOrientation,
      margin: printMargin,
      docLang,
      columnOrder,
      activeColumns,
      customColumns,
      style: styleConfig,
    });
    setSavedTemplates(updated);
  };

  const handleLoadTemplate = (tpl: SavedTablePrintTemplate) => {
    setPrintReportTab('detailed');
    setPrintOrientation(tpl.orientation);
    setPrintMargin(tpl.margin);
    setDocLang(tpl.docLang);
    setCustomColumns(tpl.customColumns || []);
    setColumnOrder(normalizeColumnOrder(tpl.columnOrder, tpl.customColumns || []));
    setActiveColumns({ ...tpl.activeColumns, sl: true });
    setStyleConfig(tpl.style);
    setActivePresetId('custom');
  };

  const handleDeleteTemplate = (id: string) => {
    setSavedTemplates(deleteCustomTableTemplate(id));
  };

  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    if (printReportTab === 'summary') {
      const rows = classSummaryData.map((r, i) => ({
        SL: i + 1,
        Class: docLang === 'en' ? r.gradeEn : r.gradeBn,
        Group: docLang === 'en' ? r.groupEn || 'General' : r.groupBn || 'সাধারণ',
        Boys: r.boys,
        Girls: r.girls,
        Total: r.total,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Summary');
      XLSX.writeFile(wb, `Student_Summary_${year}.xlsx`);
      return;
    }
    if (filteredStudents.length === 0) return;
    const rows = buildOrderedStudentExcelRows(filteredStudents, orderedVisibleColumns, docLang);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Students');
    XLSX.writeFile(wb, `Student_List_${filters.grade}_${year}.xlsx`);
  };

  const handleExportCsv = () => {
    if (filteredStudents.length === 0) return;
    const content = buildOrderedStudentCsvContent(filteredStudents, orderedVisibleColumns, docLang);
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Student_List_${filters.grade}_${year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenStandalonePrintTab = () => {
    const params = new URLSearchParams();
    params.set('tab', printReportTab);
    params.set('orientation', printOrientation);
    params.set('margin', printMargin);
    if (printRowsPerPage > 0) params.set('perPage', String(printRowsPerPage));
    const orderedKeys = orderedVisibleColumns
      .filter((c) => !c.isCustom)
      .map((c) => c.key)
      .join(',');
    if (orderedKeys) params.set('cols', orderedKeys);
    if (filters.grade !== 'all') params.set('grade', filters.grade);
    if (filters.branch !== 'all') params.set('branch', filters.branch);
    if (filters.group !== 'all') params.set('group', filters.group);
    if (filters.gender !== 'all') params.set('gender', filters.gender);
    if (filters.religion !== 'all') params.set('religion', filters.religion);
    if (filters.stipend !== 'all') params.set('stipend', filters.stipend);
    if (filters.q.trim()) params.set('q', filters.q.trim());
    params.set('year', year);
    window.open(`/dashboard/students/print?${params.toString()}`, '_blank');
  };

  const presetTitles =
    activePresetId !== 'custom' && activePresetId !== 'summary'
      ? BUILT_IN_TABLE_PRESETS[activePresetId]
      : BUILT_IN_TABLE_PRESETS.basic_list;

  const handlePrint = () => {
    triggerProfessionalPrint([
      styleConfig.customTitle.trim() ||
        (docLang === 'en' ? presetTitles.titleEn : presetTitles.titleBn),
      filters.grade === 'all' ? (docLang === 'en' ? 'All Classes' : 'সকল শ্রেণি') : filters.grade,
      year,
    ]);
  };

  return (
    <div className="min-w-0 p-3 sm:p-4 lg:p-5 max-w-[1680px] mx-auto font-sans text-slate-900 dark:text-slate-100 print:p-0 print:max-w-none">
      {/* Mobile Slide-Over Customizer Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex print:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative z-10 w-[332px] max-w-[92vw] p-3 bg-slate-100 dark:bg-slate-950 h-full overflow-y-auto shadow-2xl">
            <StudentTableCustomizerRail
              reportType={printReportTab}
              onReportTypeChange={(t) => {
                setPrintReportTab(t);
                if (t === 'summary') setPrintOrientation('portrait');
              }}
              activePresetId={printReportTab === 'summary' ? 'summary' : activePresetId}
              onApplyPreset={handleApplyPreset}
              savedTemplates={savedTemplates}
              onSaveTemplate={handleSaveTemplate}
              onLoadTemplate={handleLoadTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              filters={filters}
              onUpdateFilters={handleUpdateFilters}
              onResetFilters={handleResetFilters}
              gradeCounts={gradeCounts}
              totalStudentCount={sourceStudents.length}
              sectionOptions={sectionOptions}
              orientation={printOrientation}
              onOrientationChange={setPrintOrientation}
              marginPreset={printMargin}
              onMarginChange={setPrintMargin}
              rowsPerPage={printRowsPerPage}
              onRowsPerPageChange={setPrintRowsPerPage}
              docLang={docLang}
              onDocLangChange={setDocLang}
              year={year}
              onYearChange={setYear}
              columnOrder={columnOrder}
              activeColumns={activeColumns}
              customColumns={customColumns}
              onToggleColumn={handleToggleColumn}
              onMoveColumn={handleMoveColumn}
              onDragReorderColumn={handleDragReorderColumn}
              onAddCustomColumn={handleAddCustomColumn}
              onRemoveCustomColumn={handleRemoveCustomColumn}
              onResetColumnOrder={() => {
                setColumnOrder(normalizeColumnOrder(DEFAULT_COLUMN_ORDER, customColumns));
              }}
              styleConfig={styleConfig}
              onUpdateStyle={(patch) => setStyleConfig((prev) => ({ ...prev, ...patch }))}
              onUpdateSignatory={handleUpdateSignatory}
              onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* SPLIT-PANE PRINT STUDIO */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-4 print:block">
        {railVisible && (
          <div className="hidden lg:block sticky top-4 print:hidden">
            <StudentTableCustomizerRail
              reportType={printReportTab}
              onReportTypeChange={(t) => {
                setPrintReportTab(t);
                if (t === 'summary') setPrintOrientation('portrait');
              }}
              activePresetId={printReportTab === 'summary' ? 'summary' : activePresetId}
              onApplyPreset={handleApplyPreset}
              savedTemplates={savedTemplates}
              onSaveTemplate={handleSaveTemplate}
              onLoadTemplate={handleLoadTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              filters={filters}
              onUpdateFilters={handleUpdateFilters}
              onResetFilters={handleResetFilters}
              gradeCounts={gradeCounts}
              totalStudentCount={sourceStudents.length}
              sectionOptions={sectionOptions}
              orientation={printOrientation}
              onOrientationChange={setPrintOrientation}
              marginPreset={printMargin}
              onMarginChange={setPrintMargin}
              rowsPerPage={printRowsPerPage}
              onRowsPerPageChange={setPrintRowsPerPage}
              docLang={docLang}
              onDocLangChange={setDocLang}
              year={year}
              onYearChange={setYear}
              columnOrder={columnOrder}
              activeColumns={activeColumns}
              customColumns={customColumns}
              onToggleColumn={handleToggleColumn}
              onMoveColumn={handleMoveColumn}
              onDragReorderColumn={handleDragReorderColumn}
              onAddCustomColumn={handleAddCustomColumn}
              onRemoveCustomColumn={handleRemoveCustomColumn}
              onResetColumnOrder={() => {
                setColumnOrder(normalizeColumnOrder(DEFAULT_COLUMN_ORDER, customColumns));
              }}
              styleConfig={styleConfig}
              onUpdateStyle={(patch) => setStyleConfig((prev) => ({ ...prev, ...patch }))}
              onUpdateSignatory={handleUpdateSignatory}
            />
          </div>
        )}

        {/* Right Live Continuous Print Canvas */}
        <div className="w-full flex-1 min-w-0 max-w-full space-y-3 print:space-y-0">
          {/* Compact Top Action Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs px-3 py-2 flex flex-wrap items-center justify-between gap-2 print:hidden">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onBackToList}
                className="h-8.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} /> তালিকায় ফিরুন
              </button>

              <button
                type="button"
                onClick={() => setRailVisible((v) => !v)}
                className="hidden lg:inline-flex items-center gap-1.5 h-8.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
              >
                {railVisible ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
                <span>{railVisible ? 'প্যানেল' : 'কাস্টমাইজ'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 h-8.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-black cursor-pointer"
              >
                <SlidersHorizontal size={14} /> কলাম ও স্বাক্ষর
              </button>

              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-[#0B5D3B] dark:text-emerald-300 text-xs font-black border border-emerald-200/70 dark:border-emerald-800/60">
                {toBanglaDigits(filteredStudents.length)} জন · {toBanglaDigits(orderedVisibleColumns.length)} কলাম ·{' '}
                {printRowsPerPage === 0 ? 'শূন্য-ফাঁকা প্রবাহ' : `${toBanglaDigits(printRowsPerPage)}/পাতা`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {students.length === 0 && (
                <button
                  type="button"
                  onClick={() => setSamplePreview((v) => !v)}
                  className={`h-8.5 px-3 rounded-xl text-xs font-black border inline-flex items-center gap-1.5 cursor-pointer transition ${
                    samplePreview
                      ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 text-amber-900 dark:text-amber-200'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-400'
                  }`}
                >
                  <Eye size={13} /> {samplePreview ? '৩৬ নমুনা চালু' : 'নমুনা প্রিভিউ (৩৬ জন)'}
                </button>
              )}

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={printReportTab === 'detailed' && filteredStudents.length === 0}
                className="h-8.5 px-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Download size={13} /> Excel
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredStudents.length === 0}
                className="h-8.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <FileSpreadsheet size={13} className="text-emerald-600" /> CSV
              </button>

              <button
                type="button"
                onClick={onOpenBlankPad}
                className="h-8.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <ScrollText size={13} className="text-indigo-500" />
                <span className="hidden sm:inline">ব্ল্যাংক প্যাড</span>
              </button>

              <button
                type="button"
                onClick={handleOpenStandalonePrintTab}
                title="আলাদা ট্যাবে খুলুন"
                className="h-8.5 w-8.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-flex items-center justify-center cursor-pointer"
              >
                <ExternalLink size={13} />
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="h-8.5 px-4 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-xs font-black shadow-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Printer size={14} /> প্রিন্ট / PDF
              </button>
            </div>
          </div>

          {samplePreview && students.length === 0 && (
            <div className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center justify-between gap-2 print:hidden">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-600" />
                ৩৬ জন নমুনা শিক্ষার্থী দিয়ে শূন্য-ফাঁকা মাল্টি-পেজ প্রিন্ট প্রিভিউ দেখানো হচ্ছে।
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

          {/* LIVE CONTINUOUS A4 PRINT SHEET */}
          <div className="bg-slate-200/70 dark:bg-slate-950/70 p-3 sm:p-5 rounded-3xl border border-slate-300/70 dark:border-slate-800 overflow-x-auto print:p-0 print:bg-white print:border-0 print:rounded-none print:overflow-visible">
            <StudentContinuousPrintSheet
              reportType={printReportTab}
              students={filteredStudents}
              classSummaryData={classSummaryData}
              orderedColumns={orderedVisibleColumns}
              settings={schoolSettings}
              filters={filters}
              docLang={docLang}
              orientation={printOrientation}
              marginPreset={printMargin}
              rowsPerPage={printRowsPerPage}
              styleConfig={styleConfig}
              defaultTitleBn={presetTitles.titleBn}
              defaultTitleEn={presetTitles.titleEn}
              year={year}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
