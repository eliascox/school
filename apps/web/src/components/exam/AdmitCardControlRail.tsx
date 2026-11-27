'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  LayoutGrid,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { toBanglaDigits } from '@/lib/omr/omrTemplates';
import {
  ADMIT_LAYOUT_PRESETS,
  type AdmitCardDesignOptions,
  type AdmitCardLayoutId,
  type AdmitCardStudent,
  type AdmitDocLang,
  type AdmitGradeId,
  type AdmitGroupBn,
  type AdmitScheduleEntry,
} from '@/lib/admitCardStudioUtils';

const GRADE_OPTIONS: Array<{ id: AdmitGradeId; labelBn: string }> = [
  { id: '6th', labelBn: '৬ষ্ঠ' },
  { id: '7th', labelBn: '৭ম' },
  { id: '8th', labelBn: '৮ম' },
  { id: '9th', labelBn: '৯ম' },
  { id: '10th', labelBn: '১০ম' },
];

const GROUP_OPTIONS: Array<{ id: AdmitGroupBn; labelBn: string }> = [
  { id: 'বিজ্ঞান', labelBn: 'বিজ্ঞান' },
  { id: 'মানবিক', labelBn: 'মানবিক' },
  { id: 'ব্যবসায় শিক্ষা', labelBn: 'ব্যবসায় শিক্ষা' },
];

const SECTION_OPTIONS = ['A', 'B', 'C'] as const;

export interface AdmitCardControlRailProps {
  examOptions: string[];
  selectedExam: string;
  onSelectExam: (exam: string) => void;
  selectedGrade: AdmitGradeId;
  onSelectGrade: (grade: AdmitGradeId) => void;
  selectedSection: string;
  onSelectSection: (section: string) => void;
  selectedGroup: AdmitGroupBn;
  onSelectGroup: (group: AdmitGroupBn) => void;
  gradeCounts: Record<AdmitGradeId, number>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  layoutId: AdmitCardLayoutId;
  onLayoutChange: (id: AdmitCardLayoutId) => void;
  docLang: AdmitDocLang;
  onDocLangChange: (lang: AdmitDocLang) => void;
  design: AdmitCardDesignOptions;
  onUpdateDesign: (patch: Partial<AdmitCardDesignOptions>) => void;
  studentsInScope: AdmitCardStudent[];
  selectionMode: 'all' | 'specific';
  onSelectionModeChange: (mode: 'all' | 'specific') => void;
  selectedStudentIds: Set<string>;
  onToggleStudentId: (id: string) => void;
  onSelectAllStudents: () => void;
  onClearSelectedStudents: () => void;
  schedule: AdmitScheduleEntry[];
  onChangeSchedule: (next: AdmitScheduleEntry[]) => void;
  onResetSchedule: () => void;
  onCloseMobileDrawer?: () => void;
}

export function AdmitCardControlRail({
  examOptions,
  selectedExam,
  onSelectExam,
  selectedGrade,
  onSelectGrade,
  selectedSection,
  onSelectSection,
  selectedGroup,
  onSelectGroup,
  gradeCounts,
  searchQuery,
  onSearchChange,
  layoutId,
  onLayoutChange,
  docLang,
  onDocLangChange,
  design,
  onUpdateDesign,
  studentsInScope,
  selectionMode,
  onSelectionModeChange,
  selectedStudentIds,
  onToggleStudentId,
  onSelectAllStudents,
  onClearSelectedStudents,
  schedule,
  onChangeSchedule,
  onResetSchedule,
  onCloseMobileDrawer,
}: AdmitCardControlRailProps) {
  const [routineOpen, setRoutineOpen] = useState(false);
  const isClass9or10 = selectedGrade === '9th' || selectedGrade === '10th';
  const currentLayoutMeta = ADMIT_LAYOUT_PRESETS[layoutId];

  const handleScheduleField = (
    idx: number,
    field: keyof AdmitScheduleEntry,
    value: string,
  ) => {
    const next = schedule.map((row, i) => (i === idx ? { ...row, [field]: value } : row));
    onChangeSchedule(next);
  };

  const handleAddScheduleRow = () => {
    const nextRow: AdmitScheduleEntry = {
      id: `sched-custom-${Date.now()}`,
      subjectCode: String(101 + schedule.length),
      subjectNameBn: 'নতুন বিষয়',
      subjectNameEn: 'New Subject',
      examDate: '25/11/2026',
      examTime: '10:00 AM',
    };
    onChangeSchedule([...schedule, nextRow]);
  };

  const handleRemoveScheduleRow = (idx: number) => {
    onChangeSchedule(schedule.filter((_, i) => i !== idx));
  };

  return (
    <aside className="w-full lg:w-[316px] shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
      {/* Rail Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/60">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#0B5D3B]/10 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <SlidersHorizontal size={15} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-black text-slate-900 dark:text-white truncate">
              প্রবেশপত্র কন্ট্রোল স্টুডিও
            </h2>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              ফিল্টার, লেআউট, রুটিন ও প্রিন্ট অপশন
            </p>
          </div>
        </div>
        {onCloseMobileDrawer && (
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="কন্ট্রোল প্যানেল বন্ধ করুন"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Rail Body */}
      <div className="p-3.5 space-y-4 text-xs overflow-y-auto max-h-[calc(100vh-140px)]">
        {/* 1. Exam Selector */}
        <div className="space-y-1.5">
          <label className="block text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            ১. পরীক্ষা নির্বাচন
          </label>
          <select
            value={selectedExam}
            onChange={(e) => onSelectExam(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-[#0B5D3B] cursor-pointer"
          >
            {examOptions.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Class Pills with Live Counts */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">
              ২. শ্রেণি নির্বাচন
            </label>
            <span className="text-[10px] font-bold text-slate-400">লাইভ সংখ্যা</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {GRADE_OPTIONS.map((g) => {
              const active = selectedGrade === g.id;
              const cnt = gradeCounts[g.id] || 0;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onSelectGrade(g.id)}
                  className={`py-1.5 px-1 rounded-xl border text-center transition cursor-pointer ${
                    active
                      ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                  }`}
                >
                  <div className="text-[11px] font-black leading-tight">{g.labelBn}</div>
                  <div
                    className={`text-[9.5px] font-bold mt-0.5 ${
                      active ? 'text-emerald-100' : cnt > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {toBanglaDigits(cnt)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Section (6-8) or Group (9-10) */}
        <div className="space-y-1.5">
          <label className="block text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            {isClass9or10 ? '৩. বিভাগ / গ্রুপ' : '৩. শাখা'}
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {isClass9or10
              ? GROUP_OPTIONS.map((grp) => {
                  const active = selectedGroup === grp.id;
                  return (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => onSelectGroup(grp.id)}
                      className={`py-2 px-1.5 rounded-xl border text-[11px] font-black transition cursor-pointer truncate ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                      }`}
                    >
                      {grp.labelBn}
                    </button>
                  );
                })
              : SECTION_OPTIONS.map((sec) => {
                  const active = selectedSection === sec;
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => onSelectSection(sec)}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-black transition cursor-pointer ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                      }`}
                    >
                      শাখা {sec}
                    </button>
                  );
                })}
          </div>
        </div>

        {/* 4. Search & Student Selection Scope */}
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="নাম বা রোল নম্বর খুঁজুন..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[10.5px] font-black text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Users size={12} className="text-indigo-500" />
              পরীক্ষার্থী ({toBanglaDigits(studentsInScope.length)})
            </span>
            <div className="inline-flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onSelectionModeChange('all')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-black cursor-pointer transition ${
                  selectionMode === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                সবাই
              </button>
              <button
                type="button"
                onClick={() => onSelectionModeChange('specific')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-black cursor-pointer transition ${
                  selectionMode === 'specific'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                নির্দিষ্ট
              </button>
            </div>
          </div>

          {selectionMode === 'specific' && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-2 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-indigo-600 dark:text-indigo-400">
                  নির্বাচিত: {toBanglaDigits(selectedStudentIds.size)} জন
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onSelectAllStudents}
                    className="text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    সব দিন
                  </button>
                  <button
                    type="button"
                    onClick={onClearSelectedStudents}
                    className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    মুছুন
                  </button>
                </div>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {studentsInScope.length === 0 ? (
                  <p className="text-[10.5px] text-slate-400 text-center py-2">কোনো শিক্ষার্থী নেই</p>
                ) : (
                  studentsInScope.map((st) => {
                    const checked = selectedStudentIds.has(st.id);
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => onToggleStudentId(st.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition cursor-pointer border ${
                          checked
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-100'
                            : 'bg-white dark:bg-slate-900 border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                            checked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {checked && <Check size={10} />}
                        </span>
                        <span className="font-mono font-black text-[10.5px] text-indigo-600 dark:text-indigo-400 w-7 shrink-0">
                          #{st.roll}
                        </span>
                        <span className="truncate font-bold text-[11px]">{st.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* 5. 4-Preset Page Layout Grid */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1">
            <LayoutGrid size={12} className="text-[#0B5D3B]" />
            ৪. পেইজ লেআউট (৪টি প্রিসেট)
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(ADMIT_LAYOUT_PRESETS) as AdmitCardLayoutId[]).map((id) => {
              const preset = ADMIT_LAYOUT_PRESETS[id];
              const active = layoutId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onLayoutChange(id)}
                  className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-[#0B5D3B] ring-1 ring-[#0B5D3B]/30'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                  }`}
                >
                  <div
                    className={`text-[11px] font-black leading-tight ${
                      active ? 'text-[#0B5D3B] dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {preset.labelBn}
                  </div>
                  <div className="text-[9.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {preset.shortDescBn}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. Strict Single-Language Toggle + Session Year */}
        <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="col-span-3 space-y-1">
            <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Globe size={11} className="text-indigo-500" />
              প্রিন্ট ভাষা (একক)
            </label>
            <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onDocLangChange('bn')}
                className={`py-1.5 rounded-lg text-[11px] font-black cursor-pointer transition ${
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
                className={`py-1.5 rounded-lg text-[11px] font-black cursor-pointer transition ${
                  docLang === 'en'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
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
              value={design.sessionYear}
              onChange={(e) => onUpdateDesign({ sessionYear: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-black text-center text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        {/* 7. Print & Visual Toggles */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            ৫. কার্ড ও প্রিন্ট অপশন
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              {
                key: 'showRoutine' as const,
                label: 'রুটিন টেবিল',
                disabled: !currentLayoutMeta.supportsRoutine,
              },
              { key: 'showBorder' as const, label: 'ডিজাইন বর্ডার', disabled: false },
              { key: 'showCutGuide' as const, label: 'কাটিং গাইড', disabled: layoutId === 'single_full_a4' },
              { key: 'showWatermark' as const, label: 'জলছাপ', disabled: false },
              { key: 'showQr' as const, label: 'QR কোড', disabled: false },
              { key: 'showInstructions' as const, label: 'নির্দেশাবলী', disabled: layoutId === 'compact_four_per_a4' },
              { key: 'inkSaver' as const, label: 'সাদা-কালো (Ink Saver)', disabled: false },
            ].map((item) => {
              const active = Boolean(design[item.key]) && !item.disabled;
              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => onUpdateDesign({ [item.key]: !design[item.key] })}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition ${
                    item.disabled
                      ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                      : active
                      ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] cursor-pointer shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-400 cursor-pointer'
                  }`}
                >
                  {active ? '✓ ' : ''}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 8. Collapsible Exam Routine Editor */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setRoutineOpen((o) => !o)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-[11px] text-slate-800 dark:text-slate-200 cursor-pointer hover:border-indigo-400 transition"
          >
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="text-indigo-500" />
              পরীক্ষার রুটিন এডিট ({toBanglaDigits(schedule.length)} বিষয়)
            </span>
            {routineOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {routineOpen && (
            <div className="mt-2 space-y-2 p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleAddScheduleRow}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-black cursor-pointer hover:bg-indigo-700"
                >
                  <Plus size={11} /> সারি যোগ
                </button>
                <button
                  type="button"
                  onClick={onResetSchedule}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700"
                >
                  <RotateCcw size={10} /> কারিকুলাম রিসেট
                </button>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                {schedule.map((row, idx) => (
                  <div
                    key={row.id}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1"
                  >
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={docLang === 'en' ? row.subjectNameEn : row.subjectNameBn}
                        onChange={(e) =>
                          handleScheduleField(
                            idx,
                            docLang === 'en' ? 'subjectNameEn' : 'subjectNameBn',
                            e.target.value,
                          )
                        }
                        className="flex-1 min-w-0 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-[10.5px] font-bold text-slate-900 dark:text-white"
                        placeholder="বিষয়ের নাম"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveScheduleRow(idx)}
                        className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded cursor-pointer"
                        aria-label="সারি মুছুন"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="text"
                        value={row.examDate}
                        onChange={(e) => handleScheduleField(idx, 'examDate', e.target.value)}
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300"
                        placeholder="DD/MM/YYYY"
                      />
                      <input
                        type="text"
                        value={row.examTime}
                        onChange={(e) => handleScheduleField(idx, 'examTime', e.target.value)}
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300"
                        placeholder="10:00 AM"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
