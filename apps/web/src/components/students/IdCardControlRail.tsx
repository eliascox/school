'use client';

import React, { useRef, useState } from 'react';
import {
  CheckSquare,
  Download,
  Globe,
  HardDrive,
  Layers,
  LayoutGrid,
  Palette,
  Pencil,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { toBanglaDigits } from '@/lib/omr/omrTemplates';
import {
  BUILT_IN_ID_CARD_TEMPLATES,
  type IdCardDocLang,
  type IdCardOrientation,
  type IdCardSideMode,
  type IdCardTemplateConfig,
} from '@/lib/idCardTemplateTypes';
import {
  type IdCardPageSettings,
  type IdCardPageSizeId,
  type IdCardPrintScope,
  type IdCardResolutionDpi,
  PAGE_SIZE_PRESETS,
  type SheetGridMetrics,
} from '@/lib/idCardLayoutUtils';
import { formatBytesReadable } from '@/lib/idCardTemplateStorage';

export type RailSectionTab = 'students' | 'design' | 'page';

export interface IdCardControlRailProps {
  // Counts & KPIs
  totalStudentsCount: number;
  filteredStudentsCount: number;
  selectedCount: number;
  totalPages: number;
  currentPage: number;
  gradeCounts: Record<string, number>;
  // Student Filters
  gradeFilter: string;
  onGradeFilterChange: (g: string) => void;
  sectionFilter: string;
  onSectionFilterChange: (s: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleSelectAll: () => void;
  allFilteredSelected: boolean;
  sessionYear: string;
  onSessionYearChange: (y: string) => void;
  // Templates & Language
  docLang: IdCardDocLang;
  onDocLangChange: (l: IdCardDocLang) => void;
  activeTemplate: IdCardTemplateConfig;
  customTemplates: IdCardTemplateConfig[];
  onSelectTemplate: (tpl: IdCardTemplateConfig) => void;
  onOpenNewTemplateModal: () => void;
  onEditCustomTemplate: (tpl: IdCardTemplateConfig) => void;
  onDeleteCustomTemplate: (id: string) => void;
  onExportTemplateJson: (tpl: IdCardTemplateConfig) => void;
  onImportTemplateJsonFile: (file: File) => void;
  localTemplateBytes: number;
  // Page & Print Settings
  sideMode: IdCardSideMode;
  onSideModeChange: (m: IdCardSideMode) => void;
  pageSettings: IdCardPageSettings;
  onUpdatePageSettings: (patch: Partial<IdCardPageSettings>) => void;
  metrics: SheetGridMetrics;
  printScope: IdCardPrintScope;
  onPrintScopeChange: (s: IdCardPrintScope) => void;
  pageRangeExpr: string;
  onPageRangeExprChange: (expr: string) => void;
  // Optional Mobile Drawer Close
  onCloseMobileDrawer?: () => void;
}

const SECTION_PILLS_68 = [
  { id: 'all', label: 'সব' },
  { id: 'A', label: 'শাখা A' },
  { id: 'B', label: 'শাখা B' },
  { id: 'C', label: 'শাখা C' },
];

const SECTION_PILLS_910 = [
  { id: 'all', label: 'সব' },
  { id: 'Science', label: 'বিজ্ঞান' },
  { id: 'Humanities', label: 'মানবিক' },
  { id: 'Commerce', label: 'ব্যবসায়' },
];

export function IdCardControlRail({
  totalStudentsCount,
  filteredStudentsCount,
  selectedCount,
  totalPages,
  currentPage,
  gradeCounts,
  gradeFilter,
  onGradeFilterChange,
  sectionFilter,
  onSectionFilterChange,
  searchQuery,
  onSearchChange,
  onToggleSelectAll,
  allFilteredSelected,
  sessionYear,
  onSessionYearChange,
  docLang,
  onDocLangChange,
  activeTemplate,
  customTemplates,
  onSelectTemplate,
  onOpenNewTemplateModal,
  onEditCustomTemplate,
  onDeleteCustomTemplate,
  onExportTemplateJson,
  onImportTemplateJsonFile,
  localTemplateBytes,
  sideMode,
  onSideModeChange,
  pageSettings,
  onUpdatePageSettings,
  metrics,
  printScope,
  onPrintScopeChange,
  pageRangeExpr,
  onPageRangeExprChange,
  onCloseMobileDrawer,
}: IdCardControlRailProps) {
  const [activeTab, setActiveTab] = useState<RailSectionTab>('design');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const is9or10 = gradeFilter === '9th' || gradeFilter === '10th';
  const sectionPills =
    gradeFilter === 'all'
      ? [
          { id: 'all', label: 'সব' },
          { id: 'A', label: 'A' },
          { id: 'B', label: 'B' },
          { id: 'Science', label: 'বিজ্ঞান' },
          { id: 'Humanities', label: 'মানবিক' },
          { id: 'Commerce', label: 'ব্যবসায়' },
        ]
      : is9or10
        ? SECTION_PILLS_910
        : SECTION_PILLS_68;

  const targetCount = selectedCount > 0 ? selectedCount : filteredStudentsCount;

  return (
    <aside className="w-full lg:w-[316px] shrink-0 space-y-3 print:hidden">
      {/* Mobile Drawer Header */}
      {onCloseMobileDrawer && (
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 lg:hidden">
          <span className="text-xs font-extrabold text-slate-800 dark:text-white">
            আইডি কার্ড ডিজাইন ও পেইজ কন্ট্রোল
          </span>
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
            aria-label="প্যানেল বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Compact 2x2 Live Studio KPI Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-2.5 shadow-2xs">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 px-2.5 py-2">
            <p className="text-[10px] font-bold text-slate-500">টার্গেট শিক্ষার্থী</p>
            <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
              {toBanglaDigits(targetCount)} জন
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 px-2.5 py-2">
            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              মোট প্রিন্ট পেইজ
            </p>
            <p className="text-sm font-black text-[#0B5D3B] dark:text-emerald-300 tabular-nums">
              {toBanglaDigits(totalPages)} পেইজ
            </p>
          </div>
          <div className="rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/60 px-2.5 py-2">
            <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
              কার্ড / পেইজ
            </p>
            <p className="text-xs font-black text-indigo-900 dark:text-indigo-200 tabular-nums">
              {toBanglaDigits(metrics.cols)}×{toBanglaDigits(metrics.rows)} (
              {toBanglaDigits(metrics.slotsPerPage)}টি)
            </p>
          </div>
          <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60 px-2.5 py-2">
            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
              আউটপুট মান
            </p>
            <p className="text-xs font-black text-amber-900 dark:text-amber-200 tabular-nums">
              {pageSettings.dpi} DPI · 0 KB সার্ভার
            </p>
          </div>
        </div>
      </div>

      {/* 2. Segmented 3-Tab Studio Rail Switcher */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-1.5 shadow-2xs grid grid-cols-3 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`py-2 px-2 rounded-xl text-[11px] font-extrabold inline-flex items-center justify-center gap-1 transition cursor-pointer ${
            activeTab === 'students'
              ? 'bg-[#0B5D3B] text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span>শিক্ষার্থী</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('design')}
          className={`py-2 px-2 rounded-xl text-[11px] font-extrabold inline-flex items-center justify-center gap-1 transition cursor-pointer ${
            activeTab === 'design'
              ? 'bg-[#0B5D3B] text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Palette className="w-3.5 h-3.5 shrink-0" />
          <span>ডিজাইন</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('page')}
          className={`py-2 px-2 rounded-xl text-[11px] font-extrabold inline-flex items-center justify-center gap-1 transition cursor-pointer ${
            activeTab === 'page'
              ? 'bg-[#0B5D3B] text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5 shrink-0" />
          <span>পেইজ ও DPI</span>
        </button>
      </div>

      {/* 3. TAB A — STUDENT SCOPE & SELECTION */}
      {activeTab === 'students' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 space-y-3 shadow-2xs">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-300 mb-1">
              শ্রেণি নির্বাচন
            </label>
            <select
              value={gradeFilter}
              onChange={(e) => onGradeFilterChange(e.target.value)}
              className="w-full h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="all">সকল শ্রেণি ({toBanglaDigits(totalStudentsCount)} জন)</option>
              <option value="6th">৬ষ্ঠ শ্রেণি ({toBanglaDigits(gradeCounts['6th'] || 0)} জন)</option>
              <option value="7th">৭ম শ্রেণি ({toBanglaDigits(gradeCounts['7th'] || 0)} জন)</option>
              <option value="8th">৮ম শ্রেণি ({toBanglaDigits(gradeCounts['8th'] || 0)} জন)</option>
              <option value="9th">৯ম শ্রেণি ({toBanglaDigits(gradeCounts['9th'] || 0)} জন)</option>
              <option value="10th">১০ম শ্রেণি ({toBanglaDigits(gradeCounts['10th'] || 0)} জন)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
              {is9or10 ? 'বিভাগ (১-ক্লিক)' : 'শাখা / বিভাগ (১-ক্লিক)'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {sectionPills.map((pill) => {
                const active = sectionFilter.toLowerCase() === pill.id.toLowerCase();
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => onSectionFilterChange(pill.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                      active
                        ? 'bg-[#0B5D3B] text-white shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="নাম, রোল বা আইডি খুঁজুন..."
              className="w-full h-9 pl-8 pr-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 mb-1">
                শিক্ষাবর্ষ / সেশন
              </label>
              <input
                type="text"
                value={sessionYear}
                onChange={(e) => onSessionYearChange(e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={onToggleSelectAll}
                className="w-full h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {allFilteredSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[#0B5D3B]" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                <span>
                  {selectedCount > 0
                    ? `নির্বাচিত (${toBanglaDigits(selectedCount)})`
                    : `সব সিলেক্ট`}
                </span>
              </button>
            </div>
          </div>

          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950/70 rounded-xl p-2 border border-slate-200/70 dark:border-slate-800">
            টিপস: ডান পাশের শিট থেকে যেকোনো কার্ডে ক্লিক করলে শুধু ওই নির্দিষ্ট শিক্ষার্থীদের জন্য প্রিন্ট/PDF তৈরি হবে।
          </p>
        </div>
      )}

      {/* 4. TAB B — MODERN DESIGN TEMPLATES & CUSTOM LIBRARY */}
      {activeTab === 'design' && (
        <div className="space-y-3">
          {/* Card Language Toggle (Strict Single-Language) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 shadow-2xs flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#0B5D3B]" />
              কার্ডের ভাষা
            </span>
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-950 p-0.5 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onDocLangChange('bn')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                  docLang === 'bn'
                    ? 'bg-[#0B5D3B] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => onDocLangChange('en')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                  docLang === 'en'
                    ? 'bg-[#0B5D3B] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Built-in 6 Modern Templates */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                মডার্ন ডিজাইন টেম্পলেট (৬টি)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {BUILT_IN_ID_CARD_TEMPLATES.map((tpl) => {
                const isActive = activeTemplate.id === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => onSelectTemplate(tpl)}
                    className={`text-left rounded-xl p-2 border transition cursor-pointer ${
                      isActive
                        ? 'border-[#0B5D3B] ring-2 ring-emerald-500/25 bg-emerald-50/40 dark:bg-emerald-950/25'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-950/40'
                    }`}
                  >
                    <div
                      className="h-5 rounded-md mb-1.5 relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${tpl.primaryColor}, ${tpl.secondaryColor})`,
                      }}
                    >
                      <span
                        className="absolute bottom-0 inset-x-0 h-1"
                        style={{ backgroundColor: tpl.accentColor }}
                      />
                    </div>
                    <p className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2">
                      {tpl.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Saved Custom Design Templates Library (0 Server Bytes!) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                কাস্টম টেম্পলেট ({toBanglaDigits(customTemplates.length)})
              </span>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                title="আগে সেভ করা .json টেম্পলেট ফাইল লোড করুন"
              >
                <Upload className="w-3 h-3" /> JSON ইম্পোর্ট
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onImportTemplateJsonFile(f);
                  e.target.value = '';
                }}
              />
            </div>

            <button
              type="button"
              onClick={onOpenNewTemplateModal}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold inline-flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন কাস্টম টেম্পলেট তৈরি / আপলোড</span>
            </button>

            {customTemplates.length === 0 ? (
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 text-center py-2 leading-relaxed">
                নিজের স্কুলের রঙ, ফ্রেম বা Canva/Photoshop ব্যাকগ্রাউন্ড দিয়ে কাস্টম টেম্পলেট সেভ করে রাখুন।
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                {customTemplates.map((tpl) => {
                  const isActive = activeTemplate.id === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      className={`rounded-xl p-2 border flex items-center justify-between gap-2 transition ${
                        isActive
                          ? 'border-[#0B5D3B] bg-emerald-50/50 dark:bg-emerald-950/30'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectTemplate(tpl)}
                        className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <span
                          className="w-5 h-5 rounded-md shrink-0 border border-white shadow-2xs"
                          style={{
                            background: `linear-gradient(135deg, ${tpl.primaryColor}, ${tpl.accentColor})`,
                          }}
                        />
                        <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 truncate">
                          {tpl.name}
                        </span>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditCustomTemplate(tpl)}
                          className="p-1 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                          title="এডিট করুন"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onExportTemplateJson(tpl)}
                          className="p-1 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 cursor-pointer"
                          title="JSON ব্যাকআপ ডাউনলোড"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCustomTemplate(tpl.id)}
                          className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB C — PAGE SETTINGS, GRID, DUPLEX & HIGH-RES DPI */}
      {activeTab === 'page' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 space-y-3 shadow-2xs">
          {/* Page Size Selector */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-200 mb-1">
              পেইজ সাইজ (পেপার ফরমেট)
            </label>
            <select
              value={pageSettings.pageSize}
              onChange={(e) =>
                onUpdatePageSettings({ pageSize: e.target.value as IdCardPageSizeId })
              }
              className="w-full h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              {(Object.keys(PAGE_SIZE_PRESETS) as IdCardPageSizeId[]).map((key) => (
                <option key={key} value={key}>
                  {PAGE_SIZE_PRESETS[key].labelBn}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              {PAGE_SIZE_PRESETS[pageSettings.pageSize].noteBn}
            </p>
          </div>

          {/* Custom Page Dimensions (mm) */}
          {pageSettings.pageSize === 'custom' && (
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  প্রস্থ (mm)
                </label>
                <input
                  type="number"
                  min={60}
                  max={600}
                  step={1}
                  value={pageSettings.customPageWidthMm}
                  onChange={(e) =>
                    onUpdatePageSettings({ customPageWidthMm: Number(e.target.value) || 210 })
                  }
                  className="w-full h-8 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  উচ্চতা (mm)
                </label>
                <input
                  type="number"
                  min={60}
                  max={800}
                  step={1}
                  value={pageSettings.customPageHeightMm}
                  onChange={(e) =>
                    onUpdatePageSettings({ customPageHeightMm: Number(e.target.value) || 297 })
                  }
                  className="w-full h-8 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>
            </div>
          )}

          {/* Page & Card Orientations */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 mb-1">
                পেইজ ওরিয়েন্টেশন
              </label>
              <div className="grid grid-cols-2 rounded-xl bg-slate-100 dark:bg-slate-950 p-0.5 border border-slate-200 dark:border-slate-800">
                {(['portrait', 'landscape'] as IdCardOrientation[]).map((ori) => (
                  <button
                    key={ori}
                    type="button"
                    disabled={pageSettings.pageSize === 'cr80_pvc'}
                    onClick={() => onUpdatePageSettings({ pageOrientation: ori })}
                    className={`py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer disabled:opacity-40 ${
                      pageSettings.pageOrientation === ori
                        ? 'bg-white dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    {ori === 'portrait' ? 'লম্বা' : 'আড়াআড়ি'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 mb-1">
                কার্ডের ধরন
              </label>
              <div className="grid grid-cols-2 rounded-xl bg-slate-100 dark:bg-slate-950 p-0.5 border border-slate-200 dark:border-slate-800">
                {(['portrait', 'landscape'] as IdCardOrientation[]).map((ori) => (
                  <button
                    key={ori}
                    type="button"
                    onClick={() => onUpdatePageSettings({ cardOrientation: ori })}
                    className={`py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                      pageSettings.cardOrientation === ori
                        ? 'bg-white dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    {ori === 'portrait' ? 'লম্বা' : 'আড়াআড়ি'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Side / Duplex Printing Mode */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-200 mb-1">
              পৃষ্ঠা ও ডুপ্লেক্স মোড
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: 'both_side_by_side', label: 'সামনে+পেছনে পাশাপাশি' },
                  { id: 'front', label: 'শুধু সামনের দিক' },
                  { id: 'back', label: 'শুধু পেছনের দিক' },
                  { id: 'duplex_mirrored', label: 'ডুপ্লেক্স ব্যাক-মিরর' },
                ] as Array<{ id: IdCardSideMode; label: string }>
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSideModeChange(m.id)}
                  className={`px-2 py-1.5 rounded-xl text-[10.5px] font-bold border transition cursor-pointer ${
                    sideMode === m.id
                      ? 'bg-[#0B5D3B] text-white border-[#0B5D3B]'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {sideMode === 'duplex_mirrored' && (
              <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-1">
                পেইজ ১ সামনে ও পেইজ ২ হরাইজন্টাল মিররড পেছনে — উভয় পাশ প্রিন্টে নিখুঁত অ্যালাইনমেন্ট!
              </p>
            )}
          </div>

          {/* Margins & Gaps (hidden for direct CR80 PVC) */}
          {pageSettings.pageSize !== 'cr80_pvc' && (
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-extrabold text-slate-600 dark:text-slate-300">
                  পেইজ মার্জিন (mm)
                </span>
                <div className="flex gap-1">
                  {[5, 8, 12].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() =>
                        onUpdatePageSettings({
                          marginTopMm: m,
                          marginRightMm: m,
                          marginBottomMm: m,
                          marginLeftMm: m,
                        })
                      }
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9.5px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                    >
                      {m}mm
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    { key: 'marginTopMm', label: 'উপর' },
                    { key: 'marginRightMm', label: 'ডান' },
                    { key: 'marginBottomMm', label: 'নিচ' },
                    { key: 'marginLeftMm', label: 'বাম' },
                  ] as const
                ).map((item) => (
                  <div key={item.key}>
                    <label className="block text-[9.5px] text-slate-500 text-center">
                      {item.label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={40}
                      step={0.5}
                      value={pageSettings[item.key]}
                      onChange={(e) =>
                        onUpdatePageSettings({ [item.key]: Math.max(0, Number(e.target.value)) })
                      }
                      className="w-full h-7 px-1 text-center rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block text-[9.5px] text-slate-500">গ্যাপ X (mm)</label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    step={0.5}
                    value={pageSettings.gapXMm}
                    onChange={(e) =>
                      onUpdatePageSettings({ gapXMm: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-full h-7 px-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] text-slate-500">গ্যাপ Y (mm)</label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    step={0.5}
                    value={pageSettings.gapYMm}
                    onChange={(e) =>
                      onUpdatePageSettings({ gapYMm: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-full h-7 px-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] text-slate-500">স্কেল (%)</label>
                  <input
                    type="number"
                    min={90}
                    max={110}
                    step={1}
                    value={pageSettings.printScalePercent}
                    onChange={(e) =>
                      onUpdatePageSettings({
                        printScalePercent: Math.max(90, Math.min(110, Number(e.target.value) || 100)),
                      })
                    }
                    className="w-full h-7 px-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold"
                  />
                </div>
              </div>

              {/* Grid Auto-fit vs Manual */}
              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pageSettings.autoGrid}
                    onChange={(e) => onUpdatePageSettings({ autoGrid: e.target.checked })}
                    className="rounded accent-[#0B5D3B]"
                  />
                  <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                  অটো গ্রিড ({toBanglaDigits(metrics.cols)}×{toBanglaDigits(metrics.rows)})
                </label>

                <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pageSettings.showCropMarks}
                    onChange={(e) => onUpdatePageSettings({ showCropMarks: e.target.checked })}
                    className="rounded accent-[#0B5D3B]"
                  />
                  ক্রপ মার্ক
                </label>
              </div>

              {!pageSettings.autoGrid && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500">
                      কলাম (সর্বোচ্চ {metrics.maxCols})
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={metrics.maxCols}
                      value={pageSettings.manualCols}
                      onChange={(e) =>
                        onUpdatePageSettings({ manualCols: Math.max(1, Number(e.target.value) || 1) })
                      }
                      className="w-full h-8 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">
                      সারি (সর্বোচ্চ {metrics.maxRows})
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={metrics.maxRows}
                      value={pageSettings.manualRows}
                      onChange={(e) =>
                        onUpdatePageSettings({ manualRows: Math.max(1, Number(e.target.value) || 1) })
                      }
                      className="w-full h-8 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resolution (DPI) & Print Scope */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
                আউটপুট রেজুলেশন
              </span>
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-950 p-0.5 border border-slate-200 dark:border-slate-800">
                {([300, 600] as IdCardResolutionDpi[]).map((dpiVal) => (
                  <button
                    key={dpiVal}
                    type="button"
                    onClick={() => onUpdatePageSettings({ dpi: dpiVal })}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold transition cursor-pointer ${
                      pageSettings.dpi === dpiVal
                        ? 'bg-[#0B5D3B] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {dpiVal} DPI
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-extrabold text-slate-600 dark:text-slate-300 mb-1">
                প্রিন্ট / PDF পেইজ রেঞ্জ
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { id: 'all', label: 'সব পেইজ' },
                    { id: 'current', label: `পেইজ ${toBanglaDigits(currentPage)}` },
                    { id: 'range', label: 'কাস্টম রেঞ্জ' },
                  ] as Array<{ id: IdCardPrintScope; label: string }>
                ).map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => onPrintScopeChange(sc.id)}
                    className={`py-1.5 px-1.5 rounded-xl text-[10px] font-extrabold border transition cursor-pointer ${
                      printScope === sc.id
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
              {printScope === 'range' && (
                <input
                  type="text"
                  value={pageRangeExpr}
                  onChange={(e) => onPageRangeExprChange(e.target.value)}
                  placeholder="যেমন: 1-3, 5"
                  className="w-full h-8 mt-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Zero Server Storage Transparency Badge */}
      <div className="rounded-2xl bg-emerald-50/75 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#0B5D3B] dark:text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>জিরো সার্ভার স্পেস (Auto-Clean)</span>
        </div>
        <p className="text-[10px] text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
          সব হাই-রেজুলেশন PDF/PNG সরাসরি আপনার ব্রাউজারে জেনারেট হয়ে ডাউনলোড শেষে তাৎক্ষণিক মেমরি পরিষ্কার হয়ে যায় — সার্ভারে <strong>০ বাইট</strong> স্পেস নেয়।
        </p>
        <div className="pt-1 flex items-center justify-between text-[10px] font-bold text-emerald-800/80 dark:text-emerald-300/80 border-t border-emerald-200/60 dark:border-emerald-800/60">
          <span className="inline-flex items-center gap-1">
            <HardDrive className="w-3 h-3" /> লোকাল টেম্পলেট:
          </span>
          <span>{formatBytesReadable(localTemplateBytes)}</span>
        </div>
      </div>
    </aside>
  );
}
