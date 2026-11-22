'use client';

import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  CheckSquare,
  Layers,
  Link2,
  Plus,
  Search,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import {
  ALL_MASTER_SUBJECTS,
  MASTER_SUBJECT_LIBRARIES,
  MasterLibraryId,
  MasterSubjectEntry,
  MasterSubjectType,
} from '@/data/masterSubjectCatalog';
import { SubjectCurriculumItem } from '@/services/curriculumService';

type GradeKey = '6th' | '7th' | '8th' | '9th' | '10th';

const GRADE_OPTIONS: Array<{ key: GradeKey; labelBn: string; shortBn: string }> = [
  { key: '6th', labelBn: '৬ষ্ঠ শ্রেণি', shortBn: '৬ষ্ঠ' },
  { key: '7th', labelBn: '৭ম শ্রেণি', shortBn: '৭ম' },
  { key: '8th', labelBn: '৮ম শ্রেণি', shortBn: '৮ম' },
  { key: '9th', labelBn: '৯ম শ্রেণি', shortBn: '৯ম' },
  { key: '10th', labelBn: '১০ম শ্রেণি', shortBn: '১০ম' },
];

export interface SubjectLibraryPickerModalProps {
  open: boolean;
  initialGrade: GradeKey;
  existingCurriculum: SubjectCurriculumItem[];
  nameLang: 'bn' | 'en';
  onChangeNameLang: (lang: 'bn' | 'en') => void;
  onAssignSelected: (
    entries: MasterSubjectEntry[],
    targetGrades: GradeKey[],
    nameLang: 'bn' | 'en',
  ) => void;
  onClose: () => void;
}

export default function SubjectLibraryPickerModal({
  open,
  initialGrade,
  existingCurriculum,
  nameLang,
  onChangeNameLang,
  onAssignSelected,
  onClose,
}: SubjectLibraryPickerModalProps) {
  const [activeLibrary, setActiveLibrary] = useState<MasterLibraryId | 'all'>('school.secondary');
  const [targetGrades, setTargetGrades] = useState<GradeKey[]>([initialGrade]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'general' | 'group' | 'religion' | 'fourth'>('all');

  // Inline custom subject creator state
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customNameBn, setCustomNameBn] = useState('');
  const [customNameEn, setCustomNameEn] = useState('');
  const [customCode, setCustomCode] = useState('160');
  const [customType, setCustomType] = useState<MasterSubjectType>('general');
  const [customStream, setCustomStream] = useState('');
  const [customCq, setCustomCq] = useState(70);
  const [customMcq, setCustomMcq] = useState(30);
  const [customPr, setCustomPr] = useState(0);

  // Sync initial grade whenever modal opens
  React.useEffect(() => {
    if (open) {
      setTargetGrades([initialGrade]);
      setSelectedIds([]);
      setSearchQuery('');
      setTypeFilter('all');
      setShowCustomForm(false);
    }
  }, [open, initialGrade]);

  const activeLibrarySubjects = useMemo(() => {
    if (activeLibrary === 'all') return ALL_MASTER_SUBJECTS;
    const found = MASTER_SUBJECT_LIBRARIES.find((l) => l.id === activeLibrary);
    return found ? found.subjects : [];
  }, [activeLibrary]);

  const filteredSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeLibrarySubjects.filter((s) => {
      if (typeFilter === 'general' && s.type !== 'general') return false;
      if (typeFilter === 'group' && s.type !== 'group') return false;
      if (typeFilter === 'religion' && s.type !== 'religion') return false;
      if (typeFilter === 'fourth' && !(s.streamTag || '').toLowerCase().includes('4th')) return false;
      if (!q) return true;
      return (
        s.code.toLowerCase().includes(q) ||
        s.nameBn.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        (s.streamTag || '').toLowerCase().includes(q)
      );
    });
  }, [activeLibrarySubjects, searchQuery, typeFilter]);

  // Check if subject is already assigned across ALL selected targetGrades
  const isAlreadyAssignedEverywhere = (entry: MasterSubjectEntry) => {
    if (targetGrades.length === 0) return false;
    return targetGrades.every((g) =>
      existingCurriculum.some(
        (cur) =>
          cur.grade === g &&
          (cur.code.trim().toLowerCase() === entry.code.trim().toLowerCase() ||
            cur.name.trim().toLowerCase() === entry.nameBn.trim().toLowerCase() ||
            cur.name.trim().toLowerCase() === entry.nameEn.trim().toLowerCase()),
      ),
    );
  };

  if (!open) return null;

  const toggleGrade = (g: GradeKey) => {
    setTargetGrades((prev) =>
      prev.includes(g) ? (prev.length > 1 ? prev.filter((x) => x !== g) : prev) : [...prev, g],
    );
  };

  const toggleSubject = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAllVisible = () => {
    const selectableIds = filteredSubjects
      .filter((s) => !isAlreadyAssignedEverywhere(s))
      .map((s) => s.id);
    const allSelected =
      selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !selectableIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...selectableIds])));
    }
  };

  const handleConfirmAssign = () => {
    const selectedEntries = ALL_MASTER_SUBJECTS.filter((s) => selectedIds.includes(s.id));
    if (selectedEntries.length === 0 || targetGrades.length === 0) return;
    onAssignSelected(selectedEntries, targetGrades, nameLang);
    onClose();
  };

  const handleCreateCustomAndAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNameBn.trim() && !customNameEn.trim()) return;
    const cleanBn = customNameBn.trim() || customNameEn.trim();
    const cleanEn = customNameEn.trim() || customNameBn.trim();
    const entry: MasterSubjectEntry = {
      id: `custom::${customCode.trim() || Date.now()}`,
      libraryId: 'school.secondary',
      code: customCode.trim() || String(Math.floor(200 + Math.random() * 700)),
      nameBn: cleanBn,
      nameEn: cleanEn,
      cq: Math.max(0, Number(customCq) || 0),
      mcq: Math.max(0, Number(customMcq) || 0),
      practical: Math.max(0, Number(customPr) || 0),
      type: customType,
      passRule: Number(customMcq) > 0 || Number(customPr) > 0 ? 'part' : 'total',
      streamTag: customStream || undefined,
    };
    onAssignSelected([entry], targetGrades, nameLang);
    setCustomNameBn('');
    setCustomNameEn('');
    setShowCustomForm(false);
    onClose();
  };

  const selectedEntriesCount = selectedIds.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:hidden">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-6xl w-full h-[90vh] max-h-[860px] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Executive Modal Masthead */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/25 border border-indigo-400/35 text-indigo-200 flex items-center justify-center shrink-0">
              <Layers size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-white truncate">
                  বিষয় লাইব্রেরি ও শ্রেণিভিত্তিক অ্যাসাইন স্টুডিও
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/30 text-emerald-200 text-[10px] font-black">
                  ১০ লাইব্রেরি • ২৫৯ বিষয়
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                মাধ্যমিক, প্রাথমিক, কলেজ (HSC), মাদ্রাসা (দাখিল/আলিম/ইবতেদায়ী/হিফজ) ও কেজি — এক ক্লিকে শ্রেণিতে যুক্ত করুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Bangla / English Name Toggle */}
            <div className="flex items-center bg-white/10 p-0.5 rounded-xl border border-white/15 text-[11px] font-black">
              <button
                type="button"
                onClick={() => onChangeNameLang('bn')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  nameLang === 'bn' ? 'bg-white text-slate-900' : 'text-slate-200 hover:text-white'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => onChangeNameLang('en')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  nameLang === 'en' ? 'bg-white text-slate-900' : 'text-slate-200 hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition"
              aria-label="বন্ধ করুন"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Split-Pane Body */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Library Rail */}
          <aside className="lg:w-72 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-3 overflow-x-auto lg:overflow-y-auto shrink-0">
            <p className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 px-2 pb-2 hidden lg:block">
              বিষয় লাইব্রেরি (১০টি)
            </p>
            <div className="flex lg:flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setActiveLibrary('all')}
                className={`px-3 py-2.5 rounded-xl text-left transition cursor-pointer shrink-0 lg:shrink flex items-center justify-between gap-2 ${
                  activeLibrary === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="min-w-0">
                  <span className="text-xs font-black block truncate">সকল লাইব্রেরি একত্রে</span>
                  <span
                    className={`text-[10px] font-semibold hidden lg:block truncate ${
                      activeLibrary === 'all' ? 'text-indigo-100' : 'text-slate-400'
                    }`}
                  >
                    একসাথে সব বিষয় খুঁজুন
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-black shrink-0 ${
                    activeLibrary === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {ALL_MASTER_SUBJECTS.length}
                </span>
              </button>

              {MASTER_SUBJECT_LIBRARIES.map((lib) => {
                const isActive = activeLibrary === lib.id;
                return (
                  <button
                    key={lib.id}
                    type="button"
                    onClick={() => setActiveLibrary(lib.id)}
                    className={`px-3 py-2.5 rounded-xl text-left transition cursor-pointer shrink-0 lg:shrink flex items-center justify-between gap-2 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-extrabold block truncate">{lib.titleBn}</span>
                      <span
                        className={`text-[10px] hidden lg:block truncate ${
                          isActive ? 'text-indigo-100' : 'text-slate-400'
                        }`}
                      >
                        {lib.titleEn}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-black shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {lib.subjects.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Subject Picker Workspace */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Step 1: Target Classes + Search + Filters */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shrink-0">
              {/* Multi-Class Target Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 mr-1">
                    ১. কোন শ্রেণিতে অ্যাসাইন হবে:
                  </span>
                  {GRADE_OPTIONS.map((g) => {
                    const active = targetGrades.includes(g.key);
                    return (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => toggleGrade(g.key)}
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold transition inline-flex items-center gap-1.5 cursor-pointer border ${
                          active
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                        }`}
                      >
                        {active ? <Check size={12} /> : <span className="w-3 h-3 rounded border border-slate-300 dark:border-slate-600" />}
                        <span>{g.labelBn}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setShowCustomForm((v) => !v)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1 transition cursor-pointer border ${
                    showCustomForm
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900'
                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
                  }`}
                >
                  <Plus size={13} /> তালিকায় নেই? নতুন বিষয় তৈরি
                </button>
              </div>

              {/* Inline Custom Subject Quick Creator */}
              {showCustomForm && (
                <form
                  onSubmit={handleCreateCustomAndAssign}
                  className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/60 space-y-2.5"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    <input
                      type="text"
                      value={customNameBn}
                      onChange={(e) => setCustomNameBn(e.target.value)}
                      placeholder="বাংলা নাম *"
                      required
                      className="col-span-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={customNameEn}
                      onChange={(e) => setCustomNameEn(e.target.value)}
                      placeholder="English Name"
                      className="col-span-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value)}
                      placeholder="কোড (যেমন 160)"
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold outline-none focus:border-indigo-500"
                    />
                    <select
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value as MasterSubjectType)}
                      className="px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                    >
                      <option value="general">সাধারণ (General)</option>
                      <option value="group">বিভাগীয় (Group)</option>
                      <option value="religion">ধর্মীয় (Religion)</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={customStream}
                        onChange={(e) => setCustomStream(e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold"
                      >
                        <option value="">সাধারণ (সকল বিভাগ)</option>
                        <option value="Science">বিজ্ঞান</option>
                        <option value="Humanities">মানবিক</option>
                        <option value="Business Studies">ব্যবসায় শিক্ষা</option>
                        <option value="4th subject">৪র্থ বিষয়</option>
                      </select>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        CQ
                        <input
                          type="number"
                          min={0}
                          max={200}
                          value={customCq}
                          onChange={(e) => setCustomCq(Number(e.target.value))}
                          className="w-14 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center font-mono font-bold"
                        />
                      </label>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        MCQ
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={customMcq}
                          onChange={(e) => setCustomMcq(Number(e.target.value))}
                          className="w-14 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center font-mono font-bold"
                        />
                      </label>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        ব্যব
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={customPr}
                          onChange={(e) => setCustomPr(Number(e.target.value))}
                          className="w-14 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center font-mono font-bold"
                        />
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer"
                    >
                      তৈরি ও অ্যাসাইন করুন
                    </button>
                  </div>
                </form>
              )}

              {/* Search + Type Filter Pills */}
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="বাংলা / English নাম, বিষয় কোড (যেমন 101, 136, Physics) বা বিভাগ দিয়ে খুঁজুন..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold outline-none focus:border-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                  {(
                    [
                      { k: 'all', label: 'সব' },
                      { k: 'general', label: 'সাধারণ' },
                      { k: 'group', label: 'বিভাগীয়' },
                      { k: 'religion', label: 'ধর্মীয়' },
                      { k: 'fourth', label: '৪র্থ বিষয়' },
                    ] as const
                  ).map((tf) => (
                    <button
                      key={tf.k}
                      type="button"
                      onClick={() => setTypeFilter(tf.k)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        typeFilter === tf.k
                          ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleSelectAllVisible}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 text-[11px] font-extrabold hover:bg-indigo-100 transition cursor-pointer ml-1"
                  >
                    সব সিলেক্ট
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable 2-Column Subject Grid */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-950/30">
              {filteredSubjects.length === 0 ? (
                <div className="py-14 text-center space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">কোনো বিষয় পাওয়া যায়নি</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {filteredSubjects.map((sub) => {
                    const alreadyAssigned = isAlreadyAssignedEverywhere(sub);
                    const isChecked = selectedIds.includes(sub.id);
                    const fullMarks = sub.cq + sub.mcq + sub.practical;

                    return (
                      <button
                        key={sub.id}
                        type="button"
                        disabled={alreadyAssigned}
                        onClick={() => toggleSubject(sub.id)}
                        className={`p-3 rounded-2xl border text-left transition flex items-start justify-between gap-2.5 ${
                          alreadyAssigned
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/40 opacity-75 cursor-default'
                            : isChecked
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-500 ring-1 ring-indigo-500/20 cursor-pointer shadow-2xs'
                              : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="mt-0.5 shrink-0">
                            {alreadyAssigned ? (
                              <CheckSquare size={16} className="text-emerald-600" />
                            ) : isChecked ? (
                              <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <Square size={16} className="text-slate-300 dark:text-slate-600" />
                            )}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.2 rounded-md bg-slate-900 dark:bg-slate-800 text-white font-mono font-black text-[10px]">
                                {sub.code}
                              </span>
                              <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                                {nameLang === 'en' ? sub.nameEn : sub.nameBn}
                              </span>
                            </div>
                            <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                              {nameLang === 'en' ? sub.nameBn : sub.nameEn}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap text-[9.5px] font-bold">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                                {sub.cq > 0 ? `CQ ${sub.cq}` : ''}
                                {sub.mcq > 0 ? `${sub.cq > 0 ? ' · ' : ''}MCQ ${sub.mcq}` : ''}
                                {sub.practical > 0 ? `${sub.cq > 0 || sub.mcq > 0 ? ' · ' : ''}ব্যব ${sub.practical}` : ''} = {fullMarks}
                              </span>
                              {sub.type === 'religion' && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                  ধর্মীয়
                                </span>
                              )}
                              {sub.streamTag && (
                                <span className="px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
                                  {sub.streamTag}
                                </span>
                              )}
                              {sub.combinedWithCode && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                                  <Link2 size={9} /> যুগ্ম {sub.combinedWithCode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {alreadyAssigned && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-[9.5px] font-black shrink-0">
                            যুক্ত আছে
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Modal Footer */}
        <div className="px-5 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span>
              নির্বাচিত: <strong className="text-indigo-700 dark:text-indigo-300 font-mono">{selectedEntriesCount}টি</strong> বিষয় • শ্রেণি:{' '}
              <strong className="text-slate-900 dark:text-white">
                {targetGrades.map((g) => GRADE_OPTIONS.find((o) => o.key === g)?.shortBn).join(', ')}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition"
            >
              বাতিল
            </button>
            <button
              type="button"
              disabled={selectedEntriesCount === 0}
              onClick={handleConfirmAssign}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black shadow-sm transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <Check size={14} /> নির্বাচিত বিষয় অ্যাসাইন করুন ({selectedEntriesCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
