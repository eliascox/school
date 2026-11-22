'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  Camera,
  Printer,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Award,
  FileCheck,
  Upload,
  FileSpreadsheet,
  LayoutGrid,
  Table as TableIcon,
  Phone,
  Copy,
  Check,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { AppLanguage } from '@/services/languageService';
import { settingsService } from '@/services/settingsService';
import {
  StudentRecord,
  toBanglaNumeral,
  isFemaleGender,
  isMaleGender,
  matchStudentReligion,
  normalizeGradeKey,
  formatGradeLabel,
  formatSectionLabel,
} from './studentTypes';

export type SortStrategy = 'roll_asc' | 'name_asc' | 'roll_desc' | 'name_desc';

interface StudentDirectoryTableProps<T extends StudentRecord> {
  currentLang: AppLanguage;
  allStudents: T[];
  totalStudents: number;
  filteredStudents: T[];
  paginatedStudents: T[];
  availableSections: string[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  gradeFilter: string;
  setGradeFilter: (v: string) => void;
  branchFilter: string;
  setBranchFilter: (v: string) => void;
  genderFilter: string;
  setGenderFilter: (v: string) => void;
  groupFilter: string;
  setGroupFilter: (v: string) => void;
  religionFilter: string;
  setReligionFilter: (v: string) => void;
  stipendFilter: string;
  setStipendFilter: (v: string) => void;
  photoFilter: string;
  setPhotoFilter: (v: string) => void;
  sortStrategy?: SortStrategy;
  setSortStrategy?: (v: SortStrategy) => void;
  selectedStudentIds: string[];
  setSelectedStudentIds: React.Dispatch<React.SetStateAction<string[]>>;
  dragOverStudentId: string | null;
  setDragOverStudentId: (id: string | null) => void;
  handleStudentPhotoUpload: (studentId: string, file: File) => Promise<void>;
  triggerSinglePhotoSelect: (studentId: string) => void;
  onOpenBulkPhotoModal: () => void;
  onSwitchToPrintList: () => void;
  onExportExcel: (onlySelected?: boolean) => void;
  onBulkDelete: () => void;
  onResetAllFilters: () => void;
  onViewStudent: (student: T) => void;
  onPrintStudentForm: (student: T) => void;
  onEditStudent: (student: T) => void;
  onDeleteStudent: (studentId: string) => void;
}

const GRADE_OPTIONS = [
  { key: 'all', labelBn: 'সকল শ্রেণি', labelEn: 'All Classes' },
  { key: '6th', labelBn: '৬ষ্ঠ শ্রেণি', labelEn: 'Class 6' },
  { key: '7th', labelBn: '৭ম শ্রেণি', labelEn: 'Class 7' },
  { key: '8th', labelBn: '৮ম শ্রেণি', labelEn: 'Class 8' },
  { key: '9th', labelBn: '৯ম শ্রেণি', labelEn: 'Class 9' },
  { key: '10th', labelBn: '১০ম শ্রেণি', labelEn: 'Class 10' },
] as const;

function getGroupBadgeClass(group?: string): string {
  const g = (group || '').toLowerCase();
  if (g.includes('বিজ্ঞান') || g.includes('science')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60';
  }
  if (g.includes('মানবিক') || g.includes('humanities') || g.includes('arts')) {
    return 'bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800/60';
  }
  if (g.includes('ব্যবসায়') || g.includes('ব্যবসায়') || g.includes('commerce') || g.includes('business')) {
    return 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60';
  }
  return 'bg-slate-100 text-slate-600 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
}

function getReligionBadgeClass(religion?: string): string {
  const r = (religion || '').toLowerCase();
  if (r.includes('হিন্দু') || r.includes('hindu') || r.includes('সনাতন')) {
    return 'bg-orange-50 text-orange-700 border-orange-200/80 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800/60';
  }
  if (r.includes('বৌদ্ধ') || r.includes('buddhist')) {
    return 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60';
  }
  if (r.includes('খ্রিস্ট') || r.includes('খ্রিষ্ট') || r.includes('christian')) {
    return 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60';
  }
  if (r.includes('ইসলাম') || r.includes('muslim') || r.includes('islam')) {
    return 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800/60';
  }
  return 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
}

export function StudentDirectoryTable<T extends StudentRecord>({
  currentLang,
  allStudents,
  totalStudents,
  filteredStudents,
  paginatedStudents,
  availableSections,
  searchQuery,
  setSearchQuery,
  gradeFilter,
  setGradeFilter,
  branchFilter,
  setBranchFilter,
  genderFilter,
  setGenderFilter,
  groupFilter,
  setGroupFilter,
  religionFilter,
  setReligionFilter,
  stipendFilter,
  setStipendFilter,
  photoFilter,
  setPhotoFilter,
  selectedStudentIds,
  setSelectedStudentIds,
  dragOverStudentId,
  setDragOverStudentId,
  handleStudentPhotoUpload,
  triggerSinglePhotoSelect,
  onOpenBulkPhotoModal,
  onSwitchToPrintList,
  onExportExcel,
  onBulkDelete,
  onResetAllFilters,
  onViewStudent,
  onPrintStudentForm,
  onEditStudent,
  onDeleteStudent,
}: StudentDirectoryTableProps<T>) {
  const [openCertMenuId, setOpenCertMenuId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const moreFiltersRef = useRef<HTMLDivElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreFiltersOpen && !actionsMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreFiltersRef.current && !moreFiltersRef.current.contains(e.target as Node)) {
        setMoreFiltersOpen(false);
      }
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setActionsMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMoreFiltersOpen(false);
        setActionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreFiltersOpen, actionsMenuOpen]);

  // Per-class student counts across all registered students
  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allStudents.length,
      '6th': 0,
      '7th': 0,
      '8th': 0,
      '9th': 0,
      '10th': 0,
    };
    for (const st of allStudents) {
      const k = normalizeGradeKey(st.grade);
      if (k in counts) counts[k] += 1;
    }
    return counts;
  }, [allStudents]);

  // Compact footer stats for the displayed cohort
  const liveStats = useMemo(() => {
    let boys = 0;
    let girls = 0;
    let muslim = 0;
    let hindu = 0;
    let stipend = 0;

    for (const st of filteredStudents) {
      if (isFemaleGender(st.gender)) girls += 1;
      else if (isMaleGender(st.gender)) boys += 1;

      if (matchStudentReligion(st.religion, 'ইসলাম')) muslim += 1;
      else if (matchStudentReligion(st.religion, 'হিন্দু')) hindu += 1;

      if (st.isStipend || st.stipendStatus === 'Active') stipend += 1;
    }

    return { total: filteredStudents.length, boys, girls, muslim, hindu, stipend };
  }, [filteredStudents]);

  const totalMissingPhotoAll = useMemo(
    () => allStudents.filter((s) => !s.photo || s.photo.trim().length === 0).length,
    [allStudents],
  );

  const popoverFilterCount =
    (branchFilter !== 'all' ? 1 : 0) +
    (groupFilter !== 'all' ? 1 : 0) +
    (genderFilter !== 'all' ? 1 : 0) +
    (religionFilter !== 'all' ? 1 : 0) +
    (stipendFilter !== 'all' ? 1 : 0) +
    (photoFilter !== 'all' ? 1 : 0);

  // Active filter chips for quick visibility and 1-click dismissal
  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onClear: () => void }> = [];
    if (searchQuery.trim()) {
      chips.push({
        key: 'search',
        label: `${currentLang === 'en' ? 'Search' : 'সার্চ'}: "${searchQuery.trim()}"`,
        onClear: () => setSearchQuery(''),
      });
    }
    if (gradeFilter !== 'all') {
      chips.push({
        key: 'grade',
        label: `${currentLang === 'en' ? 'Class' : 'শ্রেণি'}: ${formatGradeLabel(gradeFilter, currentLang)}`,
        onClear: () => setGradeFilter('all'),
      });
    }
    if (branchFilter !== 'all') {
      chips.push({
        key: 'branch',
        label: `${currentLang === 'en' ? 'Section' : 'শাখা'}: ${formatSectionLabel(branchFilter, currentLang)}`,
        onClear: () => setBranchFilter('all'),
      });
    }
    if (groupFilter !== 'all') {
      chips.push({
        key: 'group',
        label: `${currentLang === 'en' ? 'Group' : 'বিভাগ'}: ${groupFilter}`,
        onClear: () => setGroupFilter('all'),
      });
    }
    if (genderFilter !== 'all') {
      chips.push({
        key: 'gender',
        label: `${currentLang === 'en' ? 'Gender' : 'লিঙ্গ'}: ${
          genderFilter === 'male'
            ? currentLang === 'en'
              ? 'Boys'
              : 'ছাত্র'
            : currentLang === 'en'
              ? 'Girls'
              : 'ছাত্রী'
        }`,
        onClear: () => setGenderFilter('all'),
      });
    }
    if (religionFilter !== 'all') {
      chips.push({
        key: 'religion',
        label: `${currentLang === 'en' ? 'Religion' : 'ধর্ম'}: ${religionFilter}`,
        onClear: () => setReligionFilter('all'),
      });
    }
    if (stipendFilter !== 'all') {
      chips.push({
        key: 'stipend',
        label:
          stipendFilter === 'stipend'
            ? currentLang === 'en'
              ? 'Stipend Only'
              : 'উপবৃত্তিপ্রাপ্ত'
            : currentLang === 'en'
              ? 'Non-Stipend'
              : 'উপবৃত্তি ব্যতীত',
        onClear: () => setStipendFilter('all'),
      });
    }
    if (photoFilter !== 'all') {
      chips.push({
        key: 'photo',
        label:
          photoFilter === 'has_photo'
            ? currentLang === 'en'
              ? 'Photo Uploaded'
              : 'ছবি আছে'
            : currentLang === 'en'
              ? 'Missing Photo'
              : 'ছবি বাকি',
        onClear: () => setPhotoFilter('all'),
      });
    }
    return chips;
  }, [
    searchQuery,
    gradeFilter,
    branchFilter,
    groupFilter,
    genderFilter,
    religionFilter,
    stipendFilter,
    photoFilter,
    currentLang,
    setSearchQuery,
    setGradeFilter,
    setBranchFilter,
    setGroupFilter,
    setGenderFilter,
    setReligionFilter,
    setStipendFilter,
    setPhotoFilter,
  ]);

  const handleCopyPhone = (studentId: string, phone: string) => {
    if (!phone || typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(phone)
      .then(() => {
        setCopiedPhoneId(studentId);
        setTimeout(() => setCopiedPhoneId((prev) => (prev === studentId ? null : prev)), 1500);
      })
      .catch(() => {});
  };

  const allVisibleSelected =
    filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length;

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedStudentIds(filteredStudents.map((s) => s.id));
    else setSelectedStudentIds([]);
  };

  const toggleSelectOne = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const renderCertificateDropdown = (st: T) => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpenCertMenuId((prev) => (prev === st.id ? null : st.id))}
        className={`p-1.5 rounded-lg transition cursor-pointer ${
          openCertMenuId === st.id
            ? 'bg-indigo-600 text-white'
            : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
        }`}
        title="এক-ক্লিক প্রত্যয়ন বা প্রশংসাপত্র তৈরি করুন"
      >
        <Award size={15} />
      </button>
      {openCertMenuId === st.id && (
        <div
          onMouseLeave={() => setOpenCertMenuId(null)}
          className="absolute right-0 top-8 z-30 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-1.5 text-left space-y-0.5"
        >
          <div className="px-2.5 py-1 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
            সরাসরি সনদ ইস্যু
          </div>
          <Link
            href={`/dashboard/certificates?action=create&studentId=${st.id}&type=current_student`}
            className="block px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700"
          >
            অধ্যয়নরত প্রত্যয়ন পত্র
          </Link>
          <Link
            href={`/dashboard/certificates?action=create&studentId=${st.id}&type=character_certificate`}
            className="block px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-700"
          >
            চারিত্রিক সনদ পত্র
          </Link>
          <Link
            href={`/dashboard/certificates?action=create&studentId=${st.id}&type=transfer_certificate`}
            className="block px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700"
          >
            ছাড়পত্র / টিসি (TC)
          </Link>
          <Link
            href={`/dashboard/certificates?action=create&studentId=${st.id}&type=ssc_testimonial`}
            className="block px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100"
          >
            প্রশংসাপত্র (স্টুডিও)
          </Link>
          <Link
            href={`/dashboard/ssc-transcript?studentId=${st.id}`}
            className="block px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50"
          >
            SSC অফিসিয়াল প্রশংসাপত্র
          </Link>
        </div>
      )}
    </div>
  );

  const renderEmptyStateInner = () => (
    <div className="py-12 px-6 text-center space-y-4">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center">
        {totalStudents === 0 ? <Sparkles size={22} /> : <Search size={22} />}
      </div>

      {totalStudents === 0 ? (
        <>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              {currentLang === 'en'
                ? 'No Students Enrolled Yet'
                : 'এখনো কোনো শিক্ষার্থী নিবন্ধিত হয়নি'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {currentLang === 'en'
                ? 'Add students individually via the Admission Form or import an entire class roster from Excel / CSV.'
                : 'নতুন ভর্তি ফরম দিয়ে একক শিক্ষার্থী যুক্ত করুন অথবা এক্সেল / CSV বাল্ক ইম্পোর্টের মাধ্যমে এক ক্লিকে পুরো শ্রেণির শিক্ষার্থী তালিকা আপলোড করুন।'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <Link
              href="/dashboard/admission"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-2xs transition"
            >
              <Plus size={14} /> {currentLang === 'en' ? 'New Admission' : 'নতুন শিক্ষার্থী ভর্তি'}
            </Link>
            <Link
              href="/dashboard/students/bulk-import"
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-black inline-flex items-center gap-1.5 shadow-2xs transition"
            >
              <Upload size={14} className="text-emerald-600 dark:text-emerald-400" />{' '}
              {currentLang === 'en' ? 'Excel Bulk Import' : 'এক্সেল বাল্ক ইম্পোর্ট'}
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              {currentLang === 'en'
                ? 'No Matching Students Found'
                : 'নির্বাচিত ফিল্টারে কোনো শিক্ষার্থী পাওয়া যায়নি'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentLang === 'en'
                ? `Total ${totalStudents} students registered. Reset filters to view all.`
                : `ডিরেক্টরিতে মোট ${toBanglaNumeral(totalStudents)} জন শিক্ষার্থী রয়েছে। সবাইকে দেখতে ফিল্টার রিসেট করুন।`}
            </p>
          </div>
          <button
            type="button"
            onClick={onResetAllFilters}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:opacity-90 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer transition"
          >
            <X size={14} /> {currentLang === 'en' ? 'Reset All Filters' : 'সব ফিল্টার রিসেট করুন'}
          </button>
        </>
      )}
    </div>
  );

  const renderFooterSummary = (modeLabel: string) => (
    <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
        <span>
          মোট:{' '}
          <strong className="text-slate-900 dark:text-white font-mono">
            {toBanglaNumeral(totalStudents)}
          </strong>{' '}
          জন ({modeLabel}:{' '}
          <strong className="text-indigo-600 dark:text-indigo-400 font-mono">
            {toBanglaNumeral(liveStats.total)}
          </strong>
          )
        </span>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
        <span className="text-[11px] font-mono">
          ছাত্র <strong className="text-indigo-600 dark:text-indigo-400">{toBanglaNumeral(liveStats.boys)}</strong> · ছাত্রী{' '}
          <strong className="text-rose-500">{toBanglaNumeral(liveStats.girls)}</strong> · ইসলাম{' '}
          <strong className="text-teal-600 dark:text-teal-400">{toBanglaNumeral(liveStats.muslim)}</strong> · হিন্দু{' '}
          <strong className="text-orange-600 dark:text-orange-400">{toBanglaNumeral(liveStats.hindu)}</strong> · উপবৃত্তি{' '}
          <strong className="text-amber-600 dark:text-amber-400">{toBanglaNumeral(liveStats.stipend)}</strong>
        </span>
      </div>
      <span className="text-[11px] text-slate-400 shrink-0">
        {settingsService.getSettings().schoolName || 'প্রতিষ্ঠান'} ডিজিটাল ডিরেক্টরি
      </span>
    </div>
  );

  return (
    <div className="min-w-0">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FLUSH STICKY SINGLE-ROW SUB-HEADER (~56px, 0px GAP UNDER HEADER)    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)] dark:shadow-none print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 min-h-[56px] py-2 flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: 1 Class Dropdown + Search + 1 Unified Filter Popover */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* 1. Unified Class Select Dropdown with Counts */}
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              aria-label={currentLang === 'en' ? 'Select Class' : 'শ্রেণি নির্বাচন'}
              className="h-9 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-800 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] cursor-pointer transition shrink-0"
            >
              {GRADE_OPTIONS.map((opt) => {
                const count = gradeCounts[opt.key] ?? 0;
                const countLabel = currentLang === 'en' ? count : toBanglaNumeral(count);
                return (
                  <option
                    key={opt.key}
                    value={opt.key}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {currentLang === 'en' ? opt.labelEn : opt.labelBn} ({countLabel})
                  </option>
                );
              })}
            </select>

            {/* 2. Search Input */}
            <div className="relative w-full sm:w-64 lg:w-72 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  currentLang === 'en'
                    ? 'Search by name, roll, ID or mobile...'
                    : 'নাম, রোল, আইডি বা মোবাইল খুঁজুন...'
                }
                className="w-full h-9 pl-8.5 pr-7 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] text-slate-900 dark:text-white placeholder:text-slate-400 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* 3. Unified "ফিল্টার ▾" Popover Button */}
            <div className="relative" ref={moreFiltersRef}>
              <button
                type="button"
                onClick={() => setMoreFiltersOpen((prev) => !prev)}
                className={`h-9 px-3 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                  moreFiltersOpen || popoverFilterCount > 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-[#0B5D3B] dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <SlidersHorizontal size={13} />
                <span>{currentLang === 'en' ? 'Filter' : 'ফিল্টার'}</span>
                {popoverFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-[#0B5D3B] text-white text-[10px] font-mono font-extrabold leading-none">
                    {currentLang === 'en' ? popoverFilterCount : toBanglaNumeral(popoverFilterCount)}
                  </span>
                )}
                <ChevronDown
                  size={12}
                  className={`transition-transform ${moreFiltersOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {moreFiltersOpen && (
                <div className="absolute left-0 top-11 z-40 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {currentLang === 'en' ? 'Filter Students' : 'শিক্ষার্থী ফিল্টার'}
                    </span>
                    {popoverFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setBranchFilter('all');
                          setGroupFilter('all');
                          setGenderFilter('all');
                          setReligionFilter('all');
                          setStipendFilter('all');
                          setPhotoFilter('all');
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        সব ক্লিয়ার করুন
                      </button>
                    )}
                  </div>

                  {/* Section & Group Selects */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                        {currentLang === 'en' ? 'Section' : 'শাখা'}
                      </label>
                      <select
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                        className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#0B5D3B] cursor-pointer"
                      >
                        <option value="all">{currentLang === 'en' ? 'All Sections' : 'সকল শাখা'}</option>
                        {availableSections.map((sec) => (
                          <option key={sec} value={sec}>
                            {formatSectionLabel(sec, currentLang)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                        {currentLang === 'en' ? 'Group' : 'বিভাগ'}
                      </label>
                      <select
                        value={groupFilter}
                        onChange={(e) => setGroupFilter(e.target.value)}
                        className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#0B5D3B] cursor-pointer"
                      >
                        <option value="all">{currentLang === 'en' ? 'All Groups' : 'সকল বিভাগ'}</option>
                        <option value="সাধারণ">সাধারণ</option>
                        <option value="ব্যবসায়">ব্যবসায় শিক্ষা</option>
                        <option value="মানবিক">মানবিক</option>
                        <option value="বিজ্ঞান">বিজ্ঞান</option>
                      </select>
                    </div>
                  </div>

                  {/* Gender Pills */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                      {currentLang === 'en' ? 'Gender' : 'লিঙ্গ'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { val: 'all', label: currentLang === 'en' ? 'All' : 'সকল' },
                        { val: 'male', label: currentLang === 'en' ? 'Boys' : 'ছাত্র' },
                        { val: 'female', label: currentLang === 'en' ? 'Girls' : 'ছাত্রী' },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setGenderFilter(opt.val)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                            genderFilter === opt.val
                              ? 'bg-[#0B5D3B] text-white border-[#0B5D3B]'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Religion Pills */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                      {currentLang === 'en' ? 'Religion' : 'ধর্ম'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { val: 'all', label: 'সকল' },
                        { val: 'ইসলাম', label: 'ইসলাম' },
                        { val: 'হিন্দু', label: 'হিন্দু' },
                        { val: 'বৌদ্ধ', label: 'বৌদ্ধ' },
                        { val: 'খ্রিস্টান', label: 'খ্রিস্টান' },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setReligionFilter(opt.val)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                            religionFilter === opt.val
                              ? 'bg-[#0B5D3B] text-white border-[#0B5D3B]'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stipend Pills */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                      {currentLang === 'en' ? 'Stipend Status' : 'উপবৃত্তি স্ট্যাটাস'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { val: 'all', label: 'সকল' },
                        { val: 'stipend', label: 'উপবৃত্তিপ্রাপ্ত' },
                        { val: 'non_stipend', label: 'সাধারণ শিক্ষার্থী' },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setStipendFilter(opt.val)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                            stipendFilter === opt.val
                              ? 'bg-[#0B5D3B] text-white border-[#0B5D3B]'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Photo Pills */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                      {currentLang === 'en' ? 'Photo Status' : 'ছবির অবস্থা'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { val: 'all', label: 'সকল' },
                        { val: 'has_photo', label: 'ছবি আছে' },
                        { val: 'missing_photo', label: 'ছবি বাকি' },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setPhotoFilter(opt.val)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                            photoFilter === opt.val
                              ? 'bg-[#0B5D3B] text-white border-[#0B5D3B]'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: ONLY 3 Clean Controls (Icon View Switch, "আরও / প্রিন্ট ▾" Dropdown, "+ নতুন ভর্তি") */}
          <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
            {/* 1. Compact Icon View Switch (Table / Cards) */}
            <div className="inline-flex items-center h-9 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title={currentLang === 'en' ? 'Table View' : 'টেবিল ভিউ'}
                aria-label={currentLang === 'en' ? 'Table View' : 'টেবিল ভিউ'}
                className={`h-8 w-8 rounded-lg inline-flex items-center justify-center transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <TableIcon size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title={currentLang === 'en' ? 'Card View' : 'কার্ড ভিউ'}
                aria-label={currentLang === 'en' ? 'Card View' : 'কার্ড ভিউ'}
                className={`h-8 w-8 rounded-lg inline-flex items-center justify-center transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <LayoutGrid size={14} />
              </button>
            </div>

            {/* 2. Single "আরও / প্রিন্ট ▾" Dropdown Menu */}
            <div className="relative" ref={actionsMenuRef}>
              <button
                type="button"
                onClick={() => setActionsMenuOpen((prev) => !prev)}
                className="h-9 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              >
                <Printer size={13} className="text-[#0B5D3B] dark:text-emerald-400" />
                <span>{currentLang === 'en' ? 'More / Print' : 'আরও / প্রিন্ট'}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform ${actionsMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {actionsMenuOpen && (
                <div className="absolute right-0 top-11 z-40 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-1.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setActionsMenuOpen(false);
                      onSwitchToPrintList();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Printer size={14} className="text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
                    <span>{currentLang === 'en' ? 'Print List / PDF' : 'তালিকা প্রিন্ট'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={filteredStudents.length === 0}
                    onClick={() => {
                      setActionsMenuOpen(false);
                      onExportExcel(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 text-slate-800 dark:text-slate-100 flex items-center gap-2.5 cursor-pointer"
                  >
                    <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{currentLang === 'en' ? 'Excel Export' : 'এক্সেল এক্সপোর্ট'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionsMenuOpen(false);
                      onOpenBulkPhotoModal();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Camera size={14} className="text-slate-600 dark:text-slate-300 shrink-0" />
                      <span>{currentLang === 'en' ? 'Bulk Photo Upload' : 'বাল্ক ছবি আপলোড'}</span>
                    </span>
                    {totalMissingPhotoAll > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-mono font-extrabold leading-none">
                        {currentLang === 'en' ? totalMissingPhotoAll : toBanglaNumeral(totalMissingPhotoAll)}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* 3. Primary Button: "+ নতুন ভর্তি" */}
            <Link
              href="/dashboard/admission"
              className="h-9 px-3.5 rounded-xl bg-[#0B5D3B] hover:bg-emerald-800 text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition active:scale-[0.98] whitespace-nowrap shrink-0"
              title="নতুন শিক্ষার্থী ভর্তি ফরম"
            >
              <Plus size={14} />
              <span>{currentLang === 'en' ? '+ New Admission' : '+ নতুন ভর্তি'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CLEAN WORKSPACE BODY (NO CLUTTERED KPI CARDS)                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-3.5">
        {/* Active Filter Chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-bold mr-1">
              {currentLang === 'en' ? 'Filters:' : 'সক্রিয় ফিল্টার:'}
            </span>
            {activeFilterChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 font-bold"
              >
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onClear}
                  className="hover:text-rose-600 cursor-pointer"
                  aria-label={`Remove ${chip.label}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={onResetAllFilters}
              className="px-2 py-0.5 rounded-full text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
            >
              {currentLang === 'en' ? 'Clear all' : 'সব মুছুন'}
            </button>
          </div>
        )}

        {/* Contextual Bulk Selection Action Bar */}
        {selectedStudentIds.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white px-4 py-2.5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs font-black">
              <span className="px-2.5 py-0.5 bg-white/20 rounded-full font-mono">
                {toBanglaNumeral(selectedStudentIds.length)} জন নির্বাচিত
              </span>
              <span className="hidden md:inline text-indigo-100 font-semibold">
                নির্বাচিত শিক্ষার্থীদের জন্য ব্যাচ সনদ, এক্সেল বা বাল্ক অ্যাকশন নিন
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/dashboard/certificates?action=batch&type=current_student&studentIds=${encodeURIComponent(selectedStudentIds.join(','))}`}
                className="px-3 py-1.5 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl text-xs font-black transition inline-flex items-center gap-1.5 shadow-xs"
              >
                <FileCheck size={13} /> ব্যাচ প্রত্যয়নপত্র
              </Link>
              <Link
                href={`/dashboard/certificates?action=batch&type=ssc_testimonial&studentIds=${encodeURIComponent(selectedStudentIds.join(','))}`}
                className="px-3 py-1.5 bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-xl text-xs font-black transition inline-flex items-center gap-1.5 shadow-xs"
              >
                <Award size={13} /> ব্যাচ প্রশংসাপত্র
              </Link>
              <button
                type="button"
                onClick={() => onExportExcel(true)}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet size={13} /> নির্বাচিত এক্সেল
              </button>
              <button
                type="button"
                onClick={onBulkDelete}
                className="px-3 py-1.5 bg-rose-500/90 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 size={13} /> অপসারণ
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudentIds([])}
                className="px-2.5 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                বাতিল
              </button>
            </div>
          </div>
        )}

        {viewMode === 'table' ? (
          /* ═══════════════════════════════════════════════════════════════ */
          /* EXECUTIVE DIRECTORY TABLE VIEW (ALWAYS STRUCTURED)              */
          /* ═══════════════════════════════════════════════════════════════ */
          <div
            id="student-directory-table-top"
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-slate-950/80 text-slate-600 dark:text-slate-300 font-black text-[11px] border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 cursor-pointer"
                        aria-label="Select all visible students"
                      />
                    </th>
                    <th className="py-3 px-3.5 min-w-[230px]">
                      {currentLang === 'en' ? 'Student & Photo' : 'শিক্ষার্থী ও ছবি'}
                      <span className="text-[10px] text-indigo-500 font-bold ml-1.5 hidden sm:inline">
                        ({currentLang === 'en' ? 'drag photo' : 'ছবি ড্রপ'})
                      </span>
                    </th>
                    <th className="py-3 px-3">{currentLang === 'en' ? 'ID & Roll' : 'আইডি ও রোল'}</th>
                    <th className="py-3 px-3">{currentLang === 'en' ? 'Class & Section' : 'শ্রেণি ও শাখা'}</th>
                    <th className="py-3 px-3">{currentLang === 'en' ? 'Group & Gender' : 'বিভাগ ও লিঙ্গ'}</th>
                    <th className="py-3 px-3">{currentLang === 'en' ? 'Religion & Stipend' : 'ধর্ম ও উপবৃত্তি'}</th>
                    <th className="py-3 px-3 min-w-[175px]">{currentLang === 'en' ? 'Guardian & Mobile' : 'অভিভাবক ও মোবাইল'}</th>
                    <th className="py-3 px-3 text-center">{currentLang === 'en' ? 'Status' : 'স্ট্যাটাস'}</th>
                    <th className="py-3 px-3.5 text-center">{currentLang === 'en' ? 'Actions' : 'কার্যক্রম'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-100 font-medium text-xs">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9}>{renderEmptyStateInner()}</td>
                    </tr>
                  ) : (
                    paginatedStudents.map((st) => {
                      const isSelected = selectedStudentIds.includes(st.id);
                      const female = isFemaleGender(st.gender);
                      const hasPhoto = Boolean(st.photo && st.photo.trim().length > 0);
                      const isStipend = Boolean(st.isStipend || st.stipendStatus === 'Active');

                      return (
                        <tr
                          key={st.id}
                          className={`hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition group ${
                            isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/40' : ''
                          }`}
                        >
                          <td className="py-3 px-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(st.id)}
                              className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 cursor-pointer"
                              aria-label={`Select ${st.name}`}
                            />
                          </td>

                          {/* Student Name + Drag & Drop Avatar */}
                          <td
                            className={`py-3 px-3.5 transition-colors ${
                              dragOverStudentId === st.id
                                ? 'bg-indigo-50/90 dark:bg-indigo-950/60 ring-2 ring-indigo-500/50 rounded-xl'
                                : ''
                            }`}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragOverStudentId(st.id);
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragOverStudentId(st.id);
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragOverStudentId(null);
                            }}
                            onDrop={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragOverStudentId(null);
                              const file = e.dataTransfer.files?.[0];
                              if (file) await handleStudentPhotoUpload(st.id, file);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                onClick={() => triggerSinglePhotoSelect(st.id)}
                                title="ছবি ড্রাগ করে এখানে ছেড়ে দিন অথবা ক্লিক করে ছবি আপলোড করুন"
                                className={`relative w-10 h-10 rounded-full cursor-pointer transition-all duration-200 group/avatar shrink-0 select-none ${
                                  dragOverStudentId === st.id
                                    ? 'ring-4 ring-indigo-500 ring-offset-2 scale-110 shadow-lg bg-indigo-100'
                                    : 'hover:ring-2 hover:ring-indigo-400 hover:scale-105'
                                }`}
                              >
                                <div className="w-full h-full rounded-full overflow-hidden bg-indigo-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-indigo-700 dark:text-indigo-300 text-sm">
                                  {hasPhoto ? (
                                    <img src={st.photo} alt={st.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{st.name.charAt(0)}</span>
                                  )}
                                </div>
                                {!hasPhoto && (
                                  <span
                                    className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white dark:border-slate-900 flex items-center justify-center"
                                    title="ছবি আপলোড বাকি"
                                  >
                                    <Camera size={8} className="text-slate-950" />
                                  </span>
                                )}
                                <div
                                  className={`absolute inset-0 rounded-full flex items-center justify-center transition-all ${
                                    dragOverStudentId === st.id
                                      ? 'opacity-100 bg-indigo-600/85 text-white'
                                      : 'opacity-0 group-hover/avatar:opacity-100 bg-black/50 text-white'
                                  }`}
                                >
                                  <Camera
                                    size={14}
                                    className={dragOverStudentId === st.id ? 'animate-bounce text-amber-300' : 'text-white'}
                                  />
                                </div>
                                {dragOverStudentId === st.id && (
                                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg z-30 pointer-events-none">
                                    ছবি ড্রপ করুন
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => onViewStudent(st)}
                                  className="font-extrabold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 block text-xs leading-snug text-left truncate max-w-[200px] cursor-pointer transition"
                                >
                                  {st.name}
                                </button>
                                {st.nameEn && st.nameEn !== st.name ? (
                                  <span className="text-[10.5px] text-slate-400 font-medium block truncate max-w-[200px]">
                                    {st.nameEn}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-semibold block">
                                    {st.bloodGroup ? `রক্ত: ${st.bloodGroup}` : st.group || 'সাধারণ'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* ID & Roll */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-black text-[11px]">
                                {currentLang === 'en' ? `Roll ${st.roll || '01'}` : `রোল ${toBanglaNumeral(st.roll || '01')}`}
                              </span>
                              <span className="font-mono text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                                {st.id}
                              </span>
                            </div>
                          </td>

                          {/* Class & Section */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                              {formatGradeLabel(st.grade, currentLang)}
                            </div>
                            <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                              {formatSectionLabel(st.branch || st.section, currentLang)}
                            </span>
                          </td>

                          {/* Group & Gender */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex flex-col gap-1 items-start">
                              <span
                                className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold ${getGroupBadgeClass(st.group)}`}
                              >
                                {st.group || 'সাধারণ'}
                              </span>
                              <span
                                className={`text-[10.5px] font-bold inline-flex items-center gap-1 ${
                                  female ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${female ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                                {female
                                  ? currentLang === 'en'
                                    ? 'Female'
                                    : 'ছাত্রী'
                                  : currentLang === 'en'
                                    ? 'Male'
                                    : 'ছাত্র'}
                              </span>
                            </div>
                          </td>

                          {/* Religion & Stipend */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex flex-col gap-1 items-start">
                              <span
                                className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold ${getReligionBadgeClass(st.religion)}`}
                              >
                                {st.religion || (currentLang === 'en' ? 'Not set' : 'উল্লেখ নেই')}
                              </span>
                              {isStipend && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 text-[10px] font-black">
                                  <Award size={10} /> {currentLang === 'en' ? 'Stipend' : 'উপবৃত্তি'}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Guardian & Mobile */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate max-w-[170px]">
                              {st.guardian || st.fatherName || '—'}
                            </div>
                            {st.mobile ? (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <a
                                  href={`tel:${st.mobile}`}
                                  className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                                >
                                  <Phone size={10} /> {st.mobile}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopyPhone(st.id, st.mobile || '')}
                                  className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                                  title="নম্বর কপি করুন"
                                >
                                  {copiedPhoneId === st.id ? (
                                    <Check size={11} className="text-emerald-500" />
                                  ) : (
                                    <Copy size={11} />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10.5px] text-slate-400">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {currentLang === 'en' ? 'Active' : 'সক্রিয়'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1 relative">
                              <button
                                type="button"
                                onClick={() => onViewStudent(st)}
                                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition cursor-pointer"
                                title="প্রোফাইল দেখুন"
                              >
                                <Eye size={15} />
                              </button>
                              {renderCertificateDropdown(st)}
                              <button
                                type="button"
                                onClick={() => onPrintStudentForm(st)}
                                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition cursor-pointer"
                                title="ভর্তি ফরম প্রিন্ট"
                              >
                                <Printer size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onEditStudent(st)}
                                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition cursor-pointer"
                                title="এডিট"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteStudent(st.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                                title="অপসারণ"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {renderFooterSummary('প্রদর্শিত')}
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════ */
          /* MODERN RESPONSIVE STUDENT PHOTO CARD GRID VIEW                  */
          /* ═══════════════════════════════════════════════════════════════ */
          <div className="space-y-4">
            {paginatedStudents.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
                {renderEmptyStateInner()}
                {renderFooterSummary('কার্ড ভিউ')}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedStudents.map((st) => {
                    const isSelected = selectedStudentIds.includes(st.id);
                    const female = isFemaleGender(st.gender);
                    const hasPhoto = Boolean(st.photo && st.photo.trim().length > 0);
                    const isStipend = Boolean(st.isStipend || st.stipendStatus === 'Active');

                    return (
                      <div
                        key={st.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverStudentId(st.id);
                        }}
                        onDragLeave={() => setDragOverStudentId(null)}
                        onDrop={async (e) => {
                          e.preventDefault();
                          setDragOverStudentId(null);
                          const file = e.dataTransfer.files?.[0];
                          if (file) await handleStudentPhotoUpload(st.id, file);
                        }}
                        className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between gap-3.5 ${
                          dragOverStudentId === st.id
                            ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/40'
                            : isSelected
                              ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/30'
                              : 'border-slate-200/90 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              onClick={() => triggerSinglePhotoSelect(st.id)}
                              title="ছবি ড্রপ বা ক্লিক করে আপলোড করুন"
                              className="relative w-12 h-12 rounded-2xl overflow-hidden bg-indigo-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-indigo-700 dark:text-indigo-300 text-base shrink-0 cursor-pointer group/cardphoto"
                            >
                              {hasPhoto ? (
                                <img src={st.photo} alt={st.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{st.name.charAt(0)}</span>
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/cardphoto:opacity-100 flex items-center justify-center text-white transition">
                                <Camera size={15} />
                              </div>
                            </div>

                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => onViewStudent(st)}
                                className="font-black text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-xs sm:text-sm leading-snug text-left truncate block w-full cursor-pointer"
                              >
                                {st.name}
                              </button>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10.5px] font-mono text-slate-500 dark:text-slate-400">
                                <span className="font-black text-slate-800 dark:text-slate-200">
                                  রোল {toBanglaNumeral(st.roll || '01')}
                                </span>
                                <span>•</span>
                                <span className="truncate">{st.id}</span>
                              </div>
                            </div>
                          </div>

                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(st.id)}
                            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-0.5 shrink-0"
                            aria-label={`Select ${st.name}`}
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-extrabold">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                            {formatGradeLabel(st.grade, currentLang)} • {formatSectionLabel(st.branch || st.section, currentLang)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md border ${getGroupBadgeClass(st.group)}`}>
                            {st.group || 'সাধারণ'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md ${
                              female
                                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300'
                                : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300'
                            }`}
                          >
                            {female ? 'ছাত্রী' : 'ছাত্র'}
                          </span>
                          {st.religion && (
                            <span className={`px-2 py-0.5 rounded-md border ${getReligionBadgeClass(st.religion)}`}>
                              {st.religion}
                            </span>
                          )}
                          {isStipend && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 inline-flex items-center gap-0.5">
                              <Award size={10} /> উপবৃত্তি
                            </span>
                          )}
                        </div>

                        <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 font-bold">অভিভাবক:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              {st.guardian || st.fatherName || '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 font-bold">মোবাইল:</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {st.mobile || '—'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => onViewStudent(st)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-[11px] font-black inline-flex items-center gap-1 cursor-pointer transition"
                          >
                            <Eye size={12} /> প্রোফাইল
                          </button>

                          <div className="flex items-center gap-0.5">
                            {renderCertificateDropdown(st)}
                            <button
                              type="button"
                              onClick={() => onPrintStudentForm(st)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition cursor-pointer"
                              title="ভর্তি ফরম প্রিন্ট"
                            >
                              <Printer size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditStudent(st)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition cursor-pointer"
                              title="এডিট"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteStudent(st.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                              title="অপসারণ"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
                  {renderFooterSummary('কার্ড ভিউ')}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
