'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Eye,
  FileSpreadsheet,
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
  type TableMarginPreset,
  type TableOrientation,
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
import { StudentTableCustomizerRail } from '@/components/students/StudentTableCustomizerRail';
import { StudentContinuousPrintSheet } from '@/components/students/StudentContinuousPrintSheet';

function PrintPageContent() {
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [allStudentsList, setAllStudentsList] = useState<Student[]>([]);
  const [settings, setSettings] = useState<SchoolSettings>(() => settingsService.getSettings());

  // Studio States
  const [reportType, setReportType] = useState<'detailed' | 'summary'>('detailed');
  const [activePresetId, setActivePresetId] = useState<BuiltInTablePresetId | 'summary' | 'custom'>(
    'attendance_sign',
  );
  const [orientation, setOrientation] = useState<TableOrientation>('portrait');
  const [marginPreset, setMarginPreset] = useState<TableMarginPreset>('normal');
  const [rowsPerPage, setRowsPerPage] = useState<number>(0); // 0 = Zero-Gap Continuous Native Flow
  const [docLang, setDocLang] = useState<TablePrintLang>('bn');
  const [year, setYear] = useState('2026');

  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COLUMN_ORDER);
  const [activeColumns, setActiveColumns] = useState<Record<string, boolean>>(() =>
    buildActiveColumnsMap(BUILT_IN_TABLE_PRESETS.attendance_sign.activeKeys),
  );
  const [customColumns, setCustomColumns] = useState<CustomBlankColumn[]>([]);
  const [styleConfig, setStyleConfig] = useState<StudentTableStyleConfig>(() => ({
    ...DEFAULT_TABLE_STYLE,
    rowDensity: BUILT_IN_TABLE_PRESETS.attendance_sign.rowDensity,
    signatureColWidth: BUILT_IN_TABLE_PRESETS.attendance_sign.signatureColWidth,
  }));
  const [savedTemplates, setSavedTemplates] = useState<SavedTablePrintTemplate[]>([]);

  const [railVisible, setRailVisible] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [samplePreview, setSamplePreview] = useState(false);

  const [filters, setFilters] = useState<StudentTableFilters>({
    grade: 'all',
    branch: 'all',
    group: 'all',
    gender: 'all',
    religion: 'all',
    stipend: 'all',
    q: '',
  });

  useEffect(() => {
    setAllStudentsList(studentService.getAllStudents());
    setSettings(settingsService.getSettings());
    setSavedTemplates(loadSavedTableTemplates());

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
      setActivePresetId('summary');
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
      const colList = colsParam
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      if (colList.length > 0) {
        setColumnOrder(normalizeColumnOrder([...colList, ...DEFAULT_COLUMN_ORDER], []));
        setActiveColumns(buildActiveColumnsMap(colList));
        setActivePresetId('custom');
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

  // Only auto-trigger browser print if explicitly requested via `?autoprint=1`
  useEffect(() => {
    if (ready && searchParams?.get('autoprint') === '1') {
      const timer = setTimeout(() => window.print(), 650);
      return () => clearTimeout(timer);
    }
  }, [ready, searchParams]);

  const sourceStudents = useMemo(() => {
    if (allStudentsList.length === 0 && samplePreview) {
      return buildSampleMultiPageStudents(36);
    }
    return allStudentsList as unknown as Array<Student & Record<string, unknown>>;
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

  const sectionOptions = useMemo(() => {
    const set = new Set<string>(['A', 'B', 'C']);
    sourceStudents.forEach((s) => {
      const b = String(s.branch || s.section || '').trim();
      if (b) set.add(b);
    });
    return Array.from(set).sort();
  }, [sourceStudents]);

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

  const handleApplyPreset = (presetId: BuiltInTablePresetId) => {
    const spec = BUILT_IN_TABLE_PRESETS[presetId];
    setReportType('detailed');
    setActivePresetId(presetId);
    setOrientation(spec.orientation);
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
    setSavedTemplates(
      saveCustomTableTemplate({
        name,
        orientation,
        margin: marginPreset,
        docLang,
        columnOrder,
        activeColumns,
        customColumns,
        style: styleConfig,
      }),
    );
  };

  const handleLoadTemplate = (tpl: SavedTablePrintTemplate) => {
    setReportType('detailed');
    setOrientation(tpl.orientation);
    setMarginPreset(tpl.margin);
    setDocLang(tpl.docLang);
    setCustomColumns(tpl.customColumns || []);
    setColumnOrder(normalizeColumnOrder(tpl.columnOrder, tpl.customColumns || []));
    setActiveColumns({ ...tpl.activeColumns, sl: true });
    setStyleConfig(tpl.style);
    setActivePresetId('custom');
  };

  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    if (reportType === 'summary') {
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
    XLSX.writeFile(wb, `Student_Register_${filters.grade}_${year}.xlsx`);
  };

  const handleExportCsv = () => {
    if (filteredStudents.length === 0) return;
    const content = buildOrderedStudentCsvContent(filteredStudents, orderedVisibleColumns, docLang);
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Student_Register_${filters.grade}_${year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const presetTitles =
    activePresetId !== 'custom' && activePresetId !== 'summary'
      ? BUILT_IN_TABLE_PRESETS[activePresetId]
      : BUILT_IN_TABLE_PRESETS.attendance_sign;

  const handlePrint = () => {
    triggerProfessionalPrint([
      styleConfig.customTitle.trim() ||
        (docLang === 'en' ? presetTitles.titleEn : presetTitles.titleBn),
      filters.grade === 'all' ? (docLang === 'en' ? 'All Classes' : 'সকল শ্রেণি') : filters.grade,
      year,
    ]);
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-9 w-9 border-4 border-[#0B5D3B] border-t-transparent mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            শিক্ষার্থী রেজিস্টার প্রিন্ট স্টুডিও প্রস্তুত হচ্ছে…
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
      {/* Mobile Slide-Over Customizer Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex print:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative z-10 w-[332px] max-w-[92vw] p-3 bg-slate-100 dark:bg-slate-950 h-full overflow-y-auto shadow-2xl">
            <StudentTableCustomizerRail
              reportType={reportType}
              onReportTypeChange={(t) => {
                setReportType(t);
                if (t === 'summary') setOrientation('portrait');
              }}
              activePresetId={reportType === 'summary' ? 'summary' : activePresetId}
              onApplyPreset={handleApplyPreset}
              savedTemplates={savedTemplates}
              onSaveTemplate={handleSaveTemplate}
              onLoadTemplate={handleLoadTemplate}
              onDeleteTemplate={(id) => setSavedTemplates(deleteCustomTableTemplate(id))}
              filters={filters}
              onUpdateFilters={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
              onResetFilters={() =>
                setFilters({
                  grade: 'all',
                  branch: 'all',
                  group: 'all',
                  gender: 'all',
                  religion: 'all',
                  stipend: 'all',
                  q: '',
                })
              }
              gradeCounts={gradeCounts}
              totalStudentCount={sourceStudents.length}
              sectionOptions={sectionOptions}
              orientation={orientation}
              onOrientationChange={setOrientation}
              marginPreset={marginPreset}
              onMarginChange={setMarginPreset}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={setRowsPerPage}
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
              onResetColumnOrder={() =>
                setColumnOrder(normalizeColumnOrder(DEFAULT_COLUMN_ORDER, customColumns))
              }
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
              reportType={reportType}
              onReportTypeChange={(t) => {
                setReportType(t);
                if (t === 'summary') setOrientation('portrait');
              }}
              activePresetId={reportType === 'summary' ? 'summary' : activePresetId}
              onApplyPreset={handleApplyPreset}
              savedTemplates={savedTemplates}
              onSaveTemplate={handleSaveTemplate}
              onLoadTemplate={handleLoadTemplate}
              onDeleteTemplate={(id) => setSavedTemplates(deleteCustomTableTemplate(id))}
              filters={filters}
              onUpdateFilters={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
              onResetFilters={() =>
                setFilters({
                  grade: 'all',
                  branch: 'all',
                  group: 'all',
                  gender: 'all',
                  religion: 'all',
                  stipend: 'all',
                  q: '',
                })
              }
              gradeCounts={gradeCounts}
              totalStudentCount={sourceStudents.length}
              sectionOptions={sectionOptions}
              orientation={orientation}
              onOrientationChange={setOrientation}
              marginPreset={marginPreset}
              onMarginChange={setMarginPreset}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={setRowsPerPage}
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
              onResetColumnOrder={() =>
                setColumnOrder(normalizeColumnOrder(DEFAULT_COLUMN_ORDER, customColumns))
              }
              styleConfig={styleConfig}
              onUpdateStyle={(patch) => setStyleConfig((prev) => ({ ...prev, ...patch }))}
              onUpdateSignatory={handleUpdateSignatory}
            />
          </div>
        )}

        {/* Right Live Continuous A4 Print Workspace */}
        <div className="w-full flex-1 min-w-0 max-w-full space-y-3 print:space-y-0">
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
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
              >
                <ArrowLeft size={13} /> ফিরে যান
              </button>

              <button
                type="button"
                onClick={() => setRailVisible((v) => !v)}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
              >
                {railVisible ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
                <span>{railVisible ? 'প্যানেল' : 'কাস্টমাইজ'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-black cursor-pointer"
              >
                <SlidersHorizontal size={14} /> কলাম ও স্বাক্ষর
              </button>

              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-[#0B5D3B] dark:text-emerald-300 text-xs font-black border border-emerald-200/70 dark:border-emerald-800/60">
                {toBanglaDigits(filteredStudents.length)} জন · {toBanglaDigits(orderedVisibleColumns.length)} কলাম ·{' '}
                {rowsPerPage === 0 ? 'শূন্য-ফাঁকা প্রবাহ' : `${toBanglaDigits(rowsPerPage)}/পাতা`}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {allStudentsList.length === 0 && (
                <button
                  type="button"
                  onClick={() => setSamplePreview((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition cursor-pointer ${
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
                disabled={reportType === 'detailed' && filteredStudents.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 disabled:opacity-40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black cursor-pointer whitespace-nowrap"
              >
                <Download size={13} /> Excel (.xlsx)
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredStudents.length === 0}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 disabled:opacity-40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
              >
                <FileSpreadsheet size={13} className="text-emerald-600" /> CSV
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
            <div className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200 text-xs font-bold flex flex-wrap items-center justify-between gap-2 print:hidden">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-600" />
                ডাটাবেজে শিক্ষার্থী না থাকায় ৩৬ জন শিক্ষার্থীর মাল্টি-পেজ নমুনা (Sample Preview) দেখানো হচ্ছে।
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

          {/* LIVE CONTINUOUS ZERO-GAP PRINT SHEET */}
          <div className="bg-slate-200/70 dark:bg-slate-950/70 p-3 sm:p-5 rounded-3xl border border-slate-300/70 dark:border-slate-800 overflow-x-auto print:p-0 print:bg-white print:border-0 print:rounded-none print:overflow-visible">
            <StudentContinuousPrintSheet
              reportType={reportType}
              students={filteredStudents}
              classSummaryData={classSummaryData}
              orderedColumns={orderedVisibleColumns}
              settings={settings}
              filters={filters}
              docLang={docLang}
              orientation={orientation}
              marginPreset={marginPreset}
              rowsPerPage={rowsPerPage}
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
