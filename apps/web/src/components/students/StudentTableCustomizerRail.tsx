'use client';

import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  BookmarkPlus,
  Columns3,
  Globe,
  GripVertical,
  LayoutList,
  PenLine,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { toBanglaDigits } from '@/lib/omr/omrTemplates';
import {
  BUILT_IN_TABLE_PRESETS,
  STANDARD_TABLE_COLUMNS,
  type BuiltInTablePresetId,
  type ColumnWidthPreset,
  type CustomBlankColumn,
  type SavedTablePrintTemplate,
  type SignatorySlot,
  type StudentTableFilters,
  type StudentTableStyleConfig,
  type TableFontSize,
  type TableHeaderTheme,
  type TableMarginPreset,
  type TableOrientation,
  type TablePrintLang,
  type TableRowDensity,
  normalizeColumnOrder,
} from '@/lib/studentTablePrintEngine';

const GRADE_PILLS = [
  { id: 'all', labelBn: 'সকল' },
  { id: '6th', labelBn: '৬ষ্ঠ' },
  { id: '7th', labelBn: '৭ম' },
  { id: '8th', labelBn: '৮ম' },
  { id: '9th', labelBn: '৯ম' },
  { id: '10th', labelBn: '১০ম' },
] as const;

type RailTab = 'columns' | 'filters' | 'style';

export interface StudentTableCustomizerRailProps {
  reportType: 'detailed' | 'summary';
  onReportTypeChange: (t: 'detailed' | 'summary') => void;
  activePresetId: BuiltInTablePresetId | 'summary' | 'custom';
  onApplyPreset: (id: BuiltInTablePresetId) => void;
  savedTemplates: SavedTablePrintTemplate[];
  onSaveTemplate: (name: string) => void;
  onLoadTemplate: (tpl: SavedTablePrintTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  filters: StudentTableFilters;
  onUpdateFilters: (patch: Partial<StudentTableFilters>) => void;
  onResetFilters: () => void;
  gradeCounts: Record<string, number>;
  totalStudentCount: number;
  sectionOptions: string[];
  orientation: TableOrientation;
  onOrientationChange: (o: TableOrientation) => void;
  marginPreset: TableMarginPreset;
  onMarginChange: (m: TableMarginPreset) => void;
  rowsPerPage: number;
  onRowsPerPageChange: (n: number) => void;
  docLang: TablePrintLang;
  onDocLangChange: (l: TablePrintLang) => void;
  year: string;
  onYearChange: (y: string) => void;
  columnOrder: string[];
  activeColumns: Record<string, boolean>;
  customColumns: CustomBlankColumn[];
  onToggleColumn: (key: string) => void;
  onMoveColumn: (key: string, delta: -1 | 1) => void;
  onDragReorderColumn: (fromKey: string, toKey: string) => void;
  onAddCustomColumn: (labelBn: string, labelEn: string, width: ColumnWidthPreset) => void;
  onRemoveCustomColumn: (id: string) => void;
  onResetColumnOrder: () => void;
  styleConfig: StudentTableStyleConfig;
  onUpdateStyle: (patch: Partial<StudentTableStyleConfig>) => void;
  onUpdateSignatory: (id: string, patch: Partial<SignatorySlot>) => void;
  onCloseMobileDrawer?: () => void;
}

export function StudentTableCustomizerRail({
  reportType,
  onReportTypeChange,
  activePresetId,
  onApplyPreset,
  savedTemplates,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
  filters,
  onUpdateFilters,
  onResetFilters,
  gradeCounts,
  totalStudentCount,
  sectionOptions,
  orientation,
  onOrientationChange,
  marginPreset,
  onMarginChange,
  rowsPerPage,
  onRowsPerPageChange,
  docLang,
  onDocLangChange,
  year,
  onYearChange,
  columnOrder,
  activeColumns,
  customColumns,
  onToggleColumn,
  onMoveColumn,
  onDragReorderColumn,
  onAddCustomColumn,
  onRemoveCustomColumn,
  onResetColumnOrder,
  styleConfig,
  onUpdateStyle,
  onUpdateSignatory,
  onCloseMobileDrawer,
}: StudentTableCustomizerRailProps) {
  const [railTab, setRailTab] = useState<RailTab>('columns');
  const [newColBn, setNewColBn] = useState('');
  const [newColWidth, setNewColWidth] = useState<ColumnWidthPreset>('medium');
  const [newTplName, setNewTplName] = useState('');
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  const normalizedOrder = normalizeColumnOrder(columnOrder, customColumns);
  const stdMap = new Map(STANDARD_TABLE_COLUMNS.map((c) => [c.key as string, c]));
  const customMap = new Map(customColumns.map((c) => [c.id, c]));

  const activeCount = normalizedOrder.filter((k) => activeColumns[k]).length;

  const handleAddColSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColBn.trim()) return;
    onAddCustomColumn(newColBn.trim(), newColBn.trim(), newColWidth);
    setNewColBn('');
  };

  const handleSaveTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplName.trim()) return;
    onSaveTemplate(newTplName.trim());
    setNewTplName('');
  };

  return (
    <aside className="w-full lg:w-[328px] shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/70">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#0B5D3B]/10 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <SlidersHorizontal size={15} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-black text-slate-900 dark:text-white truncate">
              প্রিন্ট ও টেবল কাস্টমাইজ স্টুডিও
            </h2>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              কলাম অর্ডার, স্বাক্ষরের ঘর ও জিরো-গ্যাপ প্রিন্ট
            </p>
          </div>
        </div>
        {onCloseMobileDrawer && (
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 3 Clean Studio Mode Sub-Tabs inside Left Rail */}
      <div className="px-3 pt-2.5 pb-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
          {[
            { id: 'columns' as const, label: 'কলাম ও স্বাক্ষর', icon: Columns3 },
            { id: 'filters' as const, label: 'ফিল্টার', icon: LayoutList },
            { id: 'style' as const, label: 'পেইজ ও স্টাইল', icon: PenLine },
          ].map((t) => {
            const Icon = t.icon;
            const active = railTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setRailTab(t.id)}
                className={`py-1.5 px-1 rounded-lg text-[10.5px] font-black inline-flex items-center justify-center gap-1 transition cursor-pointer ${
                  active
                    ? 'bg-[#0B5D3B] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon size={12} />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="p-3.5 space-y-4 text-xs overflow-y-auto max-h-[calc(100vh-185px)]">
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: COLUMNS ORDER, CUSTOM BLANK COLUMNS & SIGNATURE BOXES      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {railTab === 'columns' && (
          <>
            {/* Quick Presets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase">
                  ১. অফিশিয়াল রেডি প্রিসেট
                </span>
                <button
                  type="button"
                  onClick={() => onReportTypeChange(reportType === 'summary' ? 'detailed' : 'summary')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black inline-flex items-center gap-1 cursor-pointer border transition ${
                    reportType === 'summary'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                  }`}
                >
                  <BarChart3 size={10} /> শ্রেণি পরিসংখ্যান
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(BUILT_IN_TABLE_PRESETS) as BuiltInTablePresetId[]).map((pid) => {
                  const p = BUILT_IN_TABLE_PRESETS[pid];
                  const active = reportType === 'detailed' && activePresetId === pid;
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => onApplyPreset(pid)}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                        active
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-[#0B5D3B] ring-1 ring-[#0B5D3B]/30'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                      }`}
                    >
                      <div
                        className={`text-[10.5px] font-black leading-tight ${
                          active ? 'text-[#0B5D3B] dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {p.labelBn}
                      </div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {p.shortDescBn}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {reportType === 'detailed' && (
              <>
                {/* Dedicated Quick Signature Box Control */}
                <div className="p-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                      <PenLine size={13} /> টেবিলে স্বাক্ষরের ঘর
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleColumn('signature')}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black transition cursor-pointer ${
                        activeColumns.signature
                          ? 'bg-teal-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {activeColumns.signature ? '✓ চালু আছে' : 'চালু করুন'}
                    </button>
                  </div>

                  {activeColumns.signature && (
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <span className="block text-[9.5px] font-bold text-teal-800 dark:text-teal-300 mb-0.5">
                          স্বাক্ষর ঘরের প্রস্থ
                        </span>
                        <div className="grid grid-cols-3 gap-0.5 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-teal-200 dark:border-teal-800">
                          {(
                            [
                              { id: 'narrow' as const, label: 'ছোট' },
                              { id: 'medium' as const, label: 'মাঝারি' },
                              { id: 'wide' as const, label: 'বড়' },
                            ] as const
                          ).map((w) => (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => onUpdateStyle({ signatureColWidth: w.id })}
                              className={`py-1 rounded text-[9.5px] font-black cursor-pointer ${
                                styleConfig.signatureColWidth === w.id
                                  ? 'bg-teal-600 text-white'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {w.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="block text-[9.5px] font-bold text-teal-800 dark:text-teal-300 mb-0.5">
                          সারির উচ্চতা
                        </span>
                        <div className="grid grid-cols-3 gap-0.5 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-teal-200 dark:border-teal-800">
                          {(
                            [
                              { id: 'compact' as const, label: 'ছোট' },
                              { id: 'standard' as const, label: 'নর্মাল' },
                              { id: 'sign_tall' as const, label: 'উঁচু' },
                            ] as const
                          ).map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => onUpdateStyle({ rowDensity: d.id })}
                              className={`py-1 rounded text-[9.5px] font-black cursor-pointer ${
                                styleConfig.rowDensity === d.id
                                  ? 'bg-teal-600 text-white'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add Custom Blank Column */}
                <form
                  onSubmit={handleAddColSubmit}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5"
                >
                  <label className="block text-[10.5px] font-black text-slate-700 dark:text-slate-200">
                    + নতুন কাস্টম ফাঁকা কলাম যোগ করুন
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newColBn}
                      onChange={(e) => setNewColBn(e.target.value)}
                      placeholder="যেমন: বই গ্রহণ / রসিদ নং..."
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
                    />
                    <select
                      value={newColWidth}
                      onChange={(e) => setNewColWidth(e.target.value as ColumnWidthPreset)}
                      aria-label="কাস্টম কলামের প্রস্থ"
                      className="px-1.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-200"
                    >
                      <option value="narrow">ছোট</option>
                      <option value="medium">মাঝারি</option>
                      <option value="wide">বড়</option>
                    </select>
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 rounded-lg bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-[11px] font-black inline-flex items-center gap-0.5 cursor-pointer shrink-0"
                    >
                      <Plus size={12} /> যোগ
                    </button>
                  </div>
                </form>

                {/* Reorderable Columns Studio (Drag & Drop + Up/Down Arrows) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-black text-slate-700 dark:text-slate-200">
                      ২. কলাম বাছাই ও আগে-পরে সাজান ({toBanglaDigits(activeCount)} চালু)
                    </span>
                    <button
                      type="button"
                      onClick={onResetColumnOrder}
                      className="text-[10px] font-bold text-slate-500 hover:text-rose-600 inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <RotateCcw size={10} /> রিসেট
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    কলাম টেনে (Drag) অথবা ↑ ↓ বাটনে ক্লিক করে আগে-পরে সাজান।
                  </p>

                  <div className="space-y-1 max-h-64 overflow-y-auto pr-0.5">
                    {normalizedOrder.map((key) => {
                      const std = stdMap.get(key);
                      const custom = customMap.get(key);
                      if (!std && !custom) return null;
                      const label = std ? std.labelBn : custom!.labelBn;
                      const checked = Boolean(activeColumns[key]);
                      const isRequired = Boolean(std?.required);
                      const isCustom = Boolean(custom);

                      return (
                        <div
                          key={key}
                          draggable
                          onDragStart={() => setDraggingKey(key)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggingKey && draggingKey !== key) {
                              onDragReorderColumn(draggingKey, key);
                            }
                            setDraggingKey(null);
                          }}
                          onDragEnd={() => setDraggingKey(null)}
                          className={`flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-xl border transition ${
                            draggingKey === key
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 opacity-75'
                              : checked
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-800/70'
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 opacity-70'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <GripVertical
                              size={12}
                              className="text-slate-400 cursor-grab shrink-0"
                            />
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={isRequired}
                              onChange={() => onToggleColumn(key)}
                              className="w-3.5 h-3.5 accent-[#0B5D3B] rounded cursor-pointer disabled:cursor-not-allowed shrink-0"
                            />
                            <span
                              className={`text-[11px] truncate ${
                                checked
                                  ? 'font-bold text-slate-900 dark:text-white'
                                  : 'font-medium text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {label}
                            </span>
                            {key === 'signature' && (
                              <span className="px-1.5 py-0.2 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 text-[9px] font-black shrink-0">
                                স্বাক্ষর
                              </span>
                            )}
                            {isCustom && (
                              <span className="px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 text-[9px] font-black shrink-0">
                                কাস্টম
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => onMoveColumn(key, -1)}
                              title="আগে নিন (বামে)"
                              aria-label={`${label} আগে নিন`}
                              className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0B5D3B] text-slate-600 dark:text-slate-300 inline-flex items-center justify-center cursor-pointer"
                            >
                              <ArrowUp size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onMoveColumn(key, 1)}
                              title="পরে নিন (ডানে)"
                              aria-label={`${label} পরে নিন`}
                              className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0B5D3B] text-slate-600 dark:text-slate-300 inline-flex items-center justify-center cursor-pointer"
                            >
                              <ArrowDown size={11} />
                            </button>
                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => onRemoveCustomColumn(key)}
                                title="মুছুন"
                                className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:bg-rose-100 inline-flex items-center justify-center cursor-pointer ml-0.5"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save / Load Custom Table Template */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <form onSubmit={handleSaveTemplateSubmit} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newTplName}
                      onChange={(e) => setNewTplName(e.target.value)}
                      placeholder="টেমপ্লেটের নাম লিখে সেভ করুন..."
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-900 dark:text-white outline-none"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] font-black inline-flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <BookmarkPlus size={12} /> সেভ
                    </button>
                  </form>

                  {savedTemplates.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {savedTemplates.map((tpl) => (
                        <div
                          key={tpl.id}
                          className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-[10.5px] font-bold text-indigo-900 dark:text-indigo-200"
                        >
                          <button
                            type="button"
                            onClick={() => onLoadTemplate(tpl)}
                            className="hover:underline cursor-pointer"
                          >
                            {tpl.name}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTemplate(tpl.id)}
                            className="p-0.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded cursor-pointer"
                            aria-label="টেমপ্লেট মুছুন"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: FILTERS                                                    */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {railTab === 'filters' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase">
                শ্রেণি ও শিক্ষার্থী ফিল্টার
              </span>
              <button
                type="button"
                onClick={onResetFilters}
                className="text-[10.5px] font-bold text-rose-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={11} /> রিসেট
              </button>
            </div>

            {/* Grade Pills with Live Counts */}
            <div className="grid grid-cols-6 gap-1">
              {GRADE_PILLS.map((g) => {
                const active = filters.grade === g.id;
                const cnt = g.id === 'all' ? totalStudentCount : gradeCounts[g.id] || 0;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onUpdateFilters({ grade: g.id })}
                    className={`py-1.5 px-0.5 rounded-xl border text-center transition cursor-pointer ${
                      active
                        ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                    }`}
                  >
                    <div className="text-[10.5px] font-black leading-tight">{g.labelBn}</div>
                    <div
                      className={`text-[9px] font-bold mt-0.5 ${
                        active ? 'text-emerald-100' : cnt > 0 ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {toBanglaDigits(cnt)}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={filters.q}
                onChange={(e) => onUpdateFilters({ q: e.target.value })}
                placeholder="নাম, রোল, আইডি বা মোবাইল..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">শাখা</label>
                <select
                  value={filters.branch}
                  onChange={(e) => onUpdateFilters({ branch: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-800 dark:text-white cursor-pointer"
                >
                  <option value="all">সকল শাখা</option>
                  {sectionOptions.map((sec) => (
                    <option key={sec} value={sec}>
                      শাখা {sec}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">বিভাগ</label>
                <select
                  value={filters.group}
                  onChange={(e) => onUpdateFilters({ group: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-800 dark:text-white cursor-pointer"
                >
                  <option value="all">সকল বিভাগ</option>
                  <option value="সাধারণ">সাধারণ</option>
                  <option value="বিজ্ঞান">বিজ্ঞান</option>
                  <option value="মানবিক">মানবিক</option>
                  <option value="ব্যবসায় শিক্ষা">ব্যবসায় শিক্ষা</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">লিঙ্গ</label>
                <select
                  value={filters.gender}
                  onChange={(e) => onUpdateFilters({ gender: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-800 dark:text-white cursor-pointer"
                >
                  <option value="all">ছাত্র ও ছাত্রী</option>
                  <option value="পুরুষ">শুধু ছাত্র</option>
                  <option value="মহিলা">শুধু ছাত্রী</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">ধর্ম</label>
                <select
                  value={filters.religion}
                  onChange={(e) => onUpdateFilters({ religion: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-800 dark:text-white cursor-pointer"
                >
                  <option value="all">সকল ধর্ম</option>
                  <option value="ইসলাম">ইসলাম</option>
                  <option value="হিন্দু">হিন্দু</option>
                  <option value="বৌদ্ধ">বৌদ্ধ</option>
                  <option value="খ্রিস্টান">খ্রিস্টান</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">উপবৃত্তি</label>
                <select
                  value={filters.stipend}
                  onChange={(e) => onUpdateFilters({ stipend: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-800 dark:text-white cursor-pointer"
                >
                  <option value="all">সকল শিক্ষার্থী</option>
                  <option value="stipend_only">শুধু উপবৃত্তিপ্রাপ্ত</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: PAGE SETUP, TABLE THEME & BOTTOM SIGNATORIES               */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {railTab === 'style' && (
          <div className="space-y-3.5">
            {/* Language & Year */}
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-3 space-y-1">
                <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Globe size={11} className="text-indigo-500" />
                  প্রিন্ট ভাষা (একক)
                </label>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onDocLangChange('bn')}
                    className={`py-1.5 rounded-lg text-[11px] font-black cursor-pointer ${
                      docLang === 'bn' ? 'bg-[#0B5D3B] text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    বাংলা
                  </button>
                  <button
                    type="button"
                    onClick={() => onDocLangChange('en')}
                    className={`py-1.5 rounded-lg text-[11px] font-black cursor-pointer ${
                      docLang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 block">
                  শিক্ষাবর্ষ
                </label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => onYearChange(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono font-black text-center text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Orientation & Margin & Flow Mode */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onOrientationChange('portrait')}
                className={`py-1.5 rounded-lg text-[11px] font-black cursor-pointer ${
                  orientation === 'portrait' ? 'bg-amber-400 text-slate-950' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                পোর্ট্রেট (A4)
              </button>
              <button
                type="button"
                onClick={() => onOrientationChange('landscape')}
                className={`py-1.5 rounded-lg text-[11px] font-black cursor-pointer ${
                  orientation === 'landscape' ? 'bg-amber-400 text-slate-950' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                ল্যান্ডস্কেপ (A4)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">পৃষ্ঠার মার্জিন</label>
                <select
                  value={marginPreset}
                  onChange={(e) => onMarginChange(e.target.value as TableMarginPreset)}
                  className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-800 dark:text-white cursor-pointer"
                >
                  <option value="compact">কমপ্যাক্ট (৮ মিমি)</option>
                  <option value="normal">স্ট্যান্ডার্ড (১১ মিমি)</option>
                  <option value="wide">প্রশস্ত (১৬ মিমি)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">প্রিন্ট প্রবাহ</label>
                <select
                  value={rowsPerPage}
                  onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-[11px] font-black text-[#0B5D3B] dark:text-emerald-300 cursor-pointer"
                >
                  <option value={0}>অটো (শূন্য ফাঁকা প্রবাহ)</option>
                  <option value={15}>প্রতি পাতায় ১৫ জন</option>
                  <option value={20}>প্রতি পাতায় ২০ জন</option>
                  <option value={25}>প্রতি পাতায় ২৫ জন</option>
                  <option value={30}>প্রতি পাতায় ৩০ জন</option>
                </select>
              </div>
            </div>

            {/* Custom Title & Subtitle */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-[10px] font-black text-slate-600 dark:text-slate-300">
                কাস্টম শিরোনাম ও উপ-শিরোনাম
              </label>
              <input
                type="text"
                value={styleConfig.customTitle}
                onChange={(e) => onUpdateStyle({ customTitle: e.target.value })}
                placeholder="যেমন: ৯ম শ্রেণি — বই বিতরণ ও স্বাক্ষর তালিকা"
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-900 dark:text-white"
              />
              <input
                type="text"
                value={styleConfig.customSubtitle}
                onChange={(e) => onUpdateStyle({ customSubtitle: e.target.value })}
                placeholder="ঐচ্ছিক উপ-শিরোনাম (যেমন: কক্ষ নং ১০১)"
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300"
              />
            </div>

            {/* Header Theme, Font & Density */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">হেডার থিম</label>
                <select
                  value={styleConfig.headerTheme}
                  onChange={(e) => onUpdateStyle({ headerTheme: e.target.value as TableHeaderTheme })}
                  className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-800 dark:text-white"
                >
                  <option value="classic_bw">সাদা-কালো ক্লাসিক</option>
                  <option value="dark_navy">গাঢ় নেভি</option>
                  <option value="emerald">অফিশিয়াল সবুজ</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">ফন্ট সাইজ</label>
                <select
                  value={styleConfig.fontSize}
                  onChange={(e) => onUpdateStyle({ fontSize: e.target.value as TableFontSize })}
                  className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-800 dark:text-white"
                >
                  <option value="sm">ছোট (৯px)</option>
                  <option value="md">মাঝারি (১০.৫px)</option>
                  <option value="lg">বড় (১২px)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'zebraStripes' as const, label: 'জেব্রা স্ট্রাইপ' },
                { key: 'showStatsStrip' as const, label: 'পরিসংখ্যান বার' },
                { key: 'showWatermark' as const, label: 'জলছাপ' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onUpdateStyle({ [opt.key]: !styleConfig[opt.key] })}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border cursor-pointer ${
                    styleConfig[opt.key]
                      ? 'bg-[#0B5D3B] text-white border-[#0B5D3B]'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {styleConfig[opt.key] ? '✓ ' : ''}
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Bottom Official Signatories Customizer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-black text-slate-700 dark:text-slate-200">
                  পৃষ্ঠার নিচের স্বাক্ষর ঘরসমূহ
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateStyle({ showBottomSignatures: !styleConfig.showBottomSignatures })
                  }
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black cursor-pointer ${
                    styleConfig.showBottomSignatures
                      ? 'bg-[#0B5D3B] text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  {styleConfig.showBottomSignatures ? 'চালু' : 'বন্ধ'}
                </button>
              </div>

              {styleConfig.showBottomSignatures && (
                <div className="space-y-1.5">
                  {styleConfig.signatories.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={slot.enabled}
                          onChange={(e) => onUpdateSignatory(slot.id, { enabled: e.target.checked })}
                          className="w-3.5 h-3.5 accent-[#0B5D3B] rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={docLang === 'en' ? slot.labelEn : slot.labelBn}
                          onChange={(e) =>
                            onUpdateSignatory(
                              slot.id,
                              docLang === 'en'
                                ? { labelEn: e.target.value }
                                : { labelBn: e.target.value },
                            )
                          }
                          className="flex-1 min-w-0 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10.5px] font-bold text-slate-800 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSignatory(slot.id, { showDateLine: !slot.showDateLine })
                          }
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer border ${
                            slot.showDateLine
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400'
                          }`}
                        >
                          তারিখ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
