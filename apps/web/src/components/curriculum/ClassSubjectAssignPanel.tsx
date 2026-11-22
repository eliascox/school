'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Book,
  BookOpen,
  Check,
  CheckSquare,
  Copy,
  Edit3,
  Layers,
  Link2,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { SubjectCurriculumItem } from '@/services/curriculumService';
import {
  ALL_MASTER_SUBJECTS,
  MasterPassRule,
  MasterSubjectEntry,
  assignMasterSubjectsToGrades,
  formatPassMarksBreakdown,
  pairCombinedSubjectsBidirectionally,
  toNumMark,
} from '@/data/masterSubjectCatalog';
import SubjectLibraryPickerModal from './SubjectLibraryPickerModal';
import { confirmDialog } from '@/components/ui/ToastProvider';

export type GradeKey = '6th' | '7th' | '8th' | '9th' | '10th';

const GRADES: Array<{ key: GradeKey; numBn: string; labelBn: string; shortBn: string }> = [
  { key: '6th', numBn: '৬', labelBn: '৬ষ্ঠ শ্রেণি', shortBn: '৬ষ্ঠ' },
  { key: '7th', numBn: '৭', labelBn: '৭ম শ্রেণি', shortBn: '৭ম' },
  { key: '8th', numBn: '৮', labelBn: '৮ম শ্রেণি', shortBn: '৮ম' },
  { key: '9th', numBn: '৯', labelBn: '৯ম শ্রেণি', shortBn: '৯ম' },
  { key: '10th', numBn: '১০', labelBn: '১০ম শ্রেণি', shortBn: '১০ম' },
];

export type SectionBucketKey =
  | 'general'
  | 'science'
  | 'humanities'
  | 'commerce'
  | 'religion'
  | 'fourth'
  | 'ca';

const BUCKET_META: Record<
  SectionBucketKey,
  { titleBn: string; shortBn: string; badgeCls: string; dotCls: string }
> = {
  general: {
    titleBn: 'সাধারণ ও আবশ্যিক',
    shortBn: 'সাধারণ',
    badgeCls:
      'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60',
    dotCls: 'bg-indigo-500',
  },
  science: {
    titleBn: 'বিজ্ঞান বিভাগ',
    shortBn: 'বিজ্ঞান',
    badgeCls:
      'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
    dotCls: 'bg-emerald-500',
  },
  humanities: {
    titleBn: 'মানবিক বিভাগ',
    shortBn: 'মানবিক',
    badgeCls:
      'bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800/60',
    dotCls: 'bg-violet-500',
  },
  commerce: {
    titleBn: 'ব্যবসায় শিক্ষা',
    shortBn: 'ব্যবসায়',
    badgeCls:
      'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
    dotCls: 'bg-amber-500',
  },
  religion: {
    titleBn: 'ধর্ম ও নৈতিক শিক্ষা',
    shortBn: 'ধর্মীয়',
    badgeCls:
      'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/60',
    dotCls: 'bg-teal-500',
  },
  fourth: {
    titleBn: '৪র্থ ও ঐচ্ছিক বিষয়',
    shortBn: '৪র্থ বিষয়',
    badgeCls:
      'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/60',
    dotCls: 'bg-sky-500',
  },
  ca: {
    titleBn: 'CA (অগণনাযোগ্য)',
    shortBn: 'CA',
    badgeCls:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dotCls: 'bg-slate-400',
  },
};

export function classifyBucket(item: SubjectCurriculumItem): SectionBucketKey {
  if (item.isUncountableCA) return 'ca';
  if (
    item.subjectType === 'religion' ||
    item.code.toUpperCase().includes('REL') ||
    ['ইসলাম', 'হিন্দু', 'বৌদ্ধ', 'খ্রিষ্ট', 'খ্রিস্ট', 'ধর্ম ও নৈতিক', 'islam', 'hindu', 'buddhist', 'christian', 'religion'].some((k) =>
      item.name.toLowerCase().includes(k),
    )
  ) {
    return 'religion';
  }
  if (item.category === '৪র্থ বিষয়' || item.category === 'ঐচ্ছিক') return 'fourth';
  const grp = (item.group || '').toLowerCase();
  if (grp.includes('বিজ্ঞান') || grp.includes('science')) return 'science';
  if (
    grp.includes('ব্যবসায়') ||
    grp.includes('ব্যবসায়') ||
    grp.includes('commerce') ||
    grp.includes('business')
  ) {
    return 'commerce';
  }
  if (grp.includes('মানবিক') || grp.includes('humanities')) return 'humanities';
  return 'general';
}

function applyBucketPatch(bucket: SectionBucketKey): Partial<SubjectCurriculumItem> {
  switch (bucket) {
    case 'science':
      return {
        group: 'বিজ্ঞান',
        subjectType: 'group',
        category: 'আবশ্যিক',
        isUncountableCA: false,
      };
    case 'humanities':
      return {
        group: 'মানবিক',
        subjectType: 'group',
        category: 'আবশ্যিক',
        isUncountableCA: false,
      };
    case 'commerce':
      return {
        group: 'ব্যবসায় শিক্ষা',
        subjectType: 'group',
        category: 'আবশ্যিক',
        isUncountableCA: false,
      };
    case 'religion':
      return {
        group: 'সাধারণ',
        subjectType: 'religion',
        category: 'আবশ্যিক',
        isUncountableCA: false,
      };
    case 'fourth':
      return {
        group: 'সাধারণ',
        subjectType: 'group',
        category: '৪র্থ বিষয়',
        isUncountableCA: false,
      };
    case 'ca':
      return {
        group: 'সাধারণ',
        subjectType: 'general',
        category: 'ঐচ্ছিক',
        isUncountableCA: true,
      };
    default:
      return {
        group: 'সাধারণ',
        subjectType: 'general',
        category: 'আবশ্যিক',
        isUncountableCA: false,
      };
  }
}

function inferPassRuleMode(item: SubjectCurriculumItem): MasterPassRule {
  if (item.passRuleMode) return item.passRuleMode;
  const rules = (item.passRules || '').toLowerCase();
  if (rules.includes('মোট পাস') || rules.includes('total')) return 'total';
  if (toNumMark(item.mcq) > 0 || toNumMark(item.practical) > 0 || toNumMark(item.ca) > 0) {
    return 'part';
  }
  return 'total';
}

export interface ClassSubjectAssignPanelProps {
  curriculumList: SubjectCurriculumItem[];
  activeTab: 'assign' | 'nctb-books';
  nctbBooksCount: number;
  onChangeTab: (tab: 'assign' | 'nctb-books') => void;
  onSaveCurriculum: (updated: SubjectCurriculumItem[]) => void;
  onResetToNctb: () => void;
  onNotify: (type: 'success' | 'error', msg: string) => void;
  topBanner?: React.ReactNode;
}

export default function ClassSubjectAssignPanel({
  curriculumList,
  activeTab,
  nctbBooksCount,
  onChangeTab,
  onSaveCurriculum,
  onResetToNctb,
  onNotify,
  topBanner,
}: ClassSubjectAssignPanelProps) {
  const [selectedGrade, setSelectedGrade] = useState<GradeKey>('6th');
  const [bucketFilter, setBucketFilter] = useState<'all' | SectionBucketKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [nameLang, setNameLang] = useState<'bn' | 'en'>('bn');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Local working draft synced with storage
  const [draftList, setDraftList] = useState<SubjectCurriculumItem[]>(curriculumList);
  useEffect(() => {
    setDraftList(curriculumList);
    setIsDirty(false);
  }, [curriculumList]);

  // Modals
  const [pickerOpen, setPickerOpen] = useState(false);
  const [quickCustomOpen, setQuickCustomOpen] = useState(false);
  const [copyTargetGrade, setCopyTargetGrade] = useState<GradeKey>('7th');
  const [editingItem, setEditingItem] = useState<SubjectCurriculumItem | null>(null);

  // Quick Custom Subject Form
  const [customForm, setCustomForm] = useState({
    code: '',
    nameBn: '',
    nameEn: '',
    bucket: 'general' as SectionBucketKey,
    cq: 70,
    mcq: 30,
    practical: 0,
    ca: 0,
    passRuleMode: 'part' as MasterPassRule,
  });

  // Per-class summary stats for sub-header class tabs
  const gradeSummaries = useMemo(() => {
    return GRADES.map((g) => {
      const items = draftList.filter((i) => i.grade === g.key);
      const totalMarks = items.reduce((sum, i) => sum + (Number(i.fullMarks) || 0), 0);
      return {
        ...g,
        count: items.length,
        totalMarks,
      };
    });
  }, [draftList]);

  const currentClassSubjects = useMemo(
    () => draftList.filter((i) => i.grade === selectedGrade),
    [draftList, selectedGrade],
  );

  const bucketCounts = useMemo(() => {
    const map: Record<SectionBucketKey, number> = {
      general: 0,
      science: 0,
      humanities: 0,
      commerce: 0,
      religion: 0,
      fourth: 0,
      ca: 0,
    };
    currentClassSubjects.forEach((i) => {
      map[classifyBucket(i)] += 1;
    });
    return map;
  }, [currentClassSubjects]);

  const filteredClassSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const bucketOrder: Record<SectionBucketKey, number> = {
      general: 1,
      science: 2,
      humanities: 3,
      commerce: 4,
      religion: 5,
      fourth: 6,
      ca: 7,
    };
    return currentClassSubjects
      .filter((item) => {
        if (bucketFilter !== 'all' && classifyBucket(item) !== bucketFilter) return false;
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          (item.nameBn || '').toLowerCase().includes(q) ||
          (item.nameEn || '').toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const diff = bucketOrder[classifyBucket(a)] - bucketOrder[classifyBucket(b)];
        if (diff !== 0) return diff;
        return a.code.localeCompare(b.code);
      });
  }, [currentClassSubjects, bucketFilter, searchQuery]);

  // Auto-persist helper so edits are immediately active and never lost
  const commitListUpdate = (next: SubjectCurriculumItem[], markDirty = false) => {
    setDraftList(next);
    onSaveCurriculum(next);
    setIsDirty(markDirty);
  };

  // Inline mark / pass rule / bucket update
  const updateRowFields = (id: string, patch: Partial<SubjectCurriculumItem>) => {
    const next = draftList.map((item) => {
      if (item.id !== id) return item;
      const merged = { ...item, ...patch };
      const mode = inferPassRuleMode(merged);
      const passInfo = formatPassMarksBreakdown({
        cq: merged.cq,
        mcq: merged.mcq,
        practical: merged.practical,
        ca: merged.ca,
        passRuleMode: mode,
      });
      return {
        ...merged,
        fullMarks: passInfo.totalMarks,
        passMarks: passInfo.totalPass,
        passRuleMode: mode,
        passRules:
          mode === 'part'
            ? `${passInfo.summaryText} (পৃথক পাস)`
            : `মোট ${passInfo.totalPass}/${passInfo.totalMarks} (মোট পাস)`,
      };
    });
    commitListUpdate(next, false);
  };

  const handlePairCombined = (sourceId: string, targetCode: string) => {
    const next = pairCombinedSubjectsBidirectionally(
      draftList,
      selectedGrade,
      sourceId,
      targetCode,
    );
    commitListUpdate(next, false);
  };

  const handleRemoveSingle = async (item: SubjectCurriculumItem) => {
    if (
      await confirmDialog({
        title: 'বিষয় অপসারণ',
        message: `"${item.name}" বিষয়টিকে ${GRADES.find((g) => g.key === selectedGrade)?.labelBn} থেকে সরিয়ে ফেলতে চান?`,
        confirmLabel: 'সরান',
        danger: true,
      })
    ) {
      const next = draftList.filter((i) => i.id !== item.id);
      commitListUpdate(next, false);
      setSelectedRowIds((prev) => prev.filter((id) => id !== item.id));
      onNotify('success', `"${item.name}" বিষয়টি অপসারণ করা হয়েছে।`);
    }
  };

  const handleBulkRemove = async () => {
    if (selectedRowIds.length === 0) return;
    if (
      await confirmDialog({
        title: 'নির্বাচিত বিষয় অপসারণ',
        message: `নির্বাচিত ${selectedRowIds.length}টি বিষয় এই শ্রেণি থেকে সরিয়ে ফেলতে চান?`,
        confirmLabel: 'সব সরান',
        danger: true,
      })
    ) {
      const next = draftList.filter((i) => !selectedRowIds.includes(i.id));
      commitListUpdate(next, false);
      setSelectedRowIds([]);
      onNotify('success', 'নির্বাচিত বিষয়সমূহ অপসারণ করা হয়েছে।');
    }
  };

  const handleAssignFromLibrary = (
    entries: MasterSubjectEntry[],
    targetGrades: GradeKey[],
    lang: 'bn' | 'en',
  ) => {
    const { updated, addedCount } = assignMasterSubjectsToGrades(
      draftList,
      entries,
      targetGrades,
      lang,
    );
    commitListUpdate(updated, false);
    onNotify(
      'success',
      addedCount > 0
        ? `${addedCount}টি বিষয় সফলভাবে অ্যাসাইন ও সংরক্ষণ করা হয়েছে!`
        : 'নির্বাচিত বিষয়গুলো ইতিমধ্যেই উক্ত শ্রেণিতে যুক্ত আছে।',
    );
  };

  const handleQuickAddCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customForm.code.trim() || !customForm.nameBn.trim()) {
      onNotify('error', 'অনুগ্রহ করে বিষয়ের কোড ও নাম লিখুন!');
      return;
    }
    const passInfo = formatPassMarksBreakdown({
      cq: customForm.cq,
      mcq: customForm.mcq,
      practical: customForm.practical,
      ca: customForm.ca,
      passRuleMode: customForm.passRuleMode,
    });
    const bucketPatch = applyBucketPatch(customForm.bucket);
    const newItem: SubjectCurriculumItem = {
      id: `curr-${selectedGrade}-${customForm.code.trim()}-${Date.now()}`,
      code: customForm.code.trim(),
      name:
        nameLang === 'en' && customForm.nameEn.trim()
          ? customForm.nameEn.trim()
          : customForm.nameBn.trim(),
      nameBn: customForm.nameBn.trim(),
      nameEn: customForm.nameEn.trim() || customForm.nameBn.trim(),
      grade: selectedGrade,
      group: bucketPatch.group || 'সাধারণ',
      subjectType: bucketPatch.subjectType || 'general',
      category: bucketPatch.category || 'আবশ্যিক',
      isUncountableCA: Boolean(bucketPatch.isUncountableCA),
      cq: customForm.cq,
      mcq: customForm.mcq,
      practical: customForm.practical,
      ca: customForm.ca,
      fullMarks: passInfo.totalMarks,
      passMarks: passInfo.totalPass,
      passRuleMode: customForm.passRuleMode,
      passRules:
        customForm.passRuleMode === 'part'
          ? `${passInfo.summaryText} (পৃথক পাস)`
          : `মোট ${passInfo.totalPass}/${passInfo.totalMarks} (মোট পাস)`,
      isJointPass: false,
    };

    const next = [...draftList, newItem];
    commitListUpdate(next, false);
    setQuickCustomOpen(false);
    setCustomForm({
      code: '',
      nameBn: '',
      nameEn: '',
      bucket: 'general',
      cq: 70,
      mcq: 30,
      practical: 0,
      ca: 0,
      passRuleMode: 'part',
    });
    onNotify('success', `নতুন বিষয় "${newItem.name}" সফলভাবে যুক্ত হয়েছে!`);
  };

  const handleCopyToAnotherGrade = async () => {
    if (copyTargetGrade === selectedGrade) {
      onNotify('error', 'একই শ্রেণিতে কপি করা যাবে না — অন্য একটি টার্গেট শ্রেণি বেছে নিন।');
      return;
    }
    const sourceLabel = GRADES.find((g) => g.key === selectedGrade)?.labelBn;
    const targetLabel = GRADES.find((g) => g.key === copyTargetGrade)?.labelBn;
    if (
      await confirmDialog({
        title: 'অন্য শ্রেণিতে কপি',
        message: `${sourceLabel}-এর সব ${currentClassSubjects.length}টি বিষয় ${targetLabel}-এ কপি করতে চান? (টার্গেট শ্রেণির বর্তমান তালিকা প্রতিস্থাপিত হবে)`,
        confirmLabel: 'কপি করুন',
      })
    ) {
      const others = draftList.filter((i) => i.grade !== copyTargetGrade);
      const cloned = currentClassSubjects.map((item, idx) => ({
        ...item,
        id: `curr-${copyTargetGrade}-${item.code}-${Date.now()}-${idx}`,
        grade: copyTargetGrade,
      }));
      const next = [...others, ...cloned];
      commitListUpdate(next, false);
      onNotify('success', `${sourceLabel}-এর বিষয়গুলো ${targetLabel}-এ সফলভাবে কপি হয়েছে!`);
    }
  };

  const handleSwitchNameLang = (lang: 'bn' | 'en') => {
    setNameLang(lang);
    const next = draftList.map((item) => {
      if (lang === 'en' && item.nameEn) return { ...item, name: item.nameEn };
      if (lang === 'bn' && item.nameBn) return { ...item, name: item.nameBn };
      const matched = ALL_MASTER_SUBJECTS.find(
        (m) =>
          m.code === item.code ||
          m.nameBn === item.name ||
          m.nameEn.toLowerCase() === item.name.toLowerCase(),
      );
      if (matched) {
        return {
          ...item,
          name: lang === 'en' ? matched.nameEn : matched.nameBn,
          nameBn: matched.nameBn,
          nameEn: matched.nameEn,
        };
      }
      return item;
    });
    commitListUpdate(next, false);
  };

  const handleSaveAll = () => {
    onSaveCurriculum(draftList);
    setIsDirty(false);
    onNotify(
      'success',
      `${GRADES.find((g) => g.key === selectedGrade)?.labelBn}-এর বিষয় অ্যাসাইন ও নম্বর বণ্টন সংরক্ষিত হয়েছে!`,
    );
  };

  const activeGradeMeta = GRADES.find((g) => g.key === selectedGrade)!;
  const activeClassTotalMarks = currentClassSubjects.reduce(
    (sum, i) => sum + (Number(i.fullMarks) || 0),
    0,
  );
  const activeClassPairedCount = currentClassSubjects.filter((i) =>
    Boolean(i.combinedWithCode),
  ).length;
  const allVisibleSelected =
    filteredClassSubjects.length > 0 &&
    filteredClassSubjects.every((i) => selectedRowIds.includes(i.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleSet = new Set(filteredClassSubjects.map((i) => i.id));
      setSelectedRowIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      const merged = new Set([...selectedRowIds, ...filteredClassSubjects.map((i) => i.id)]);
      setSelectedRowIds(Array.from(merged));
    }
  };

  return (
    <div className="min-w-0">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DOCKED STICKY SUB-HEADER MENU BAR (সরাসরি গ্লোবাল হেডারের নিচে)     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-[0_4px_14px_-6px_rgba(15,23,42,0.08)] dark:shadow-none print:hidden">
        {/* TIER 1: Mode Switcher + 5 Class Selector Tabs + Primary Actions */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Mode Switcher + Class Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Switcher */}
            <div className="inline-flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => onChangeTab('assign')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap inline-flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'assign'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers size={13} /> বিষয় ও নম্বর বণ্টন
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('nctb-books')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap inline-flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'nctb-books'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Book size={13} /> NCTB বই ({nctbBooksCount})
              </button>
            </div>

            {activeTab === 'assign' && (
              <>
                <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block shrink-0" />

                {/* 5 Class Selector Tabs with Live Counts */}
                <div className="flex flex-wrap items-center gap-1">
                  {gradeSummaries.map((gs) => {
                    const active = selectedGrade === gs.key;
                    return (
                      <button
                        key={gs.key}
                        type="button"
                        onClick={() => {
                          setSelectedGrade(gs.key);
                          setBucketFilter('all');
                          setSelectedRowIds([]);
                          const nextCopy = GRADES.find((g) => g.key !== gs.key)?.key || '7th';
                          setCopyTargetGrade(nextCopy);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap inline-flex items-center gap-1.5 transition cursor-pointer shrink-0 border ${
                          active
                            ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-500 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800'
                        }`}
                      >
                        <span>{gs.labelBn}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black leading-none ${
                            active
                              ? 'bg-emerald-400 text-slate-950'
                              : 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200/80 dark:border-slate-700'
                          }`}
                        >
                          {gs.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Right: Action Controls OR NCTB Catalog Context Pill */}
          {activeTab === 'assign' ? (
            <div className="flex flex-wrap items-center gap-1.5 justify-end">
              {/* Primary Library Assign Button */}
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black whitespace-nowrap shrink-0 shadow-2xs inline-flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <Plus size={14} /> লাইব্রেরি থেকে অ্যাসাইন (২৫৯+)
              </button>

              {/* Quick Custom Subject Button */}
              <button
                type="button"
                onClick={() => setQuickCustomOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black whitespace-nowrap shrink-0 border border-slate-200/80 dark:border-slate-700 inline-flex items-center gap-1 cursor-pointer transition"
                title="সরাসরি নতুন কাস্টম বিষয় যুক্ত করুন"
              >
                <Plus size={13} /> কাস্টম বিষয়
              </button>

              {/* Compact Copy-to-Class Control */}
              <div className="inline-flex items-center bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 p-0.5 shrink-0">
                <select
                  value={copyTargetGrade}
                  onChange={(e) => setCopyTargetGrade(e.target.value as GradeKey)}
                  className="px-2 py-1 bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                  title="যে শ্রেণিতে কপি করতে চান"
                >
                  {GRADES.filter((g) => g.key !== selectedGrade).map((g) => (
                    <option key={g.key} value={g.key}>
                      কপি ➔ {g.shortBn}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleCopyToAnotherGrade}
                  className="px-2 py-1 rounded-lg bg-slate-900 dark:bg-indigo-600 hover:opacity-90 text-white text-[11px] font-black whitespace-nowrap inline-flex items-center gap-1 cursor-pointer"
                  title={`${activeGradeMeta.labelBn}-এর সব বিষয় নির্বাচিত শ্রেণিতে কপি করুন`}
                >
                  <Copy size={11} /> কপি
                </button>
              </div>

              {/* Bangla / English Subject Name Switcher */}
              <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-[11px] font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => handleSwitchNameLang('bn')}
                  className={`px-2 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${
                    nameLang === 'bn'
                      ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs font-black'
                      : 'text-slate-500'
                  }`}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchNameLang('en')}
                  className={`px-2 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${
                    nameLang === 'en'
                      ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs font-black'
                      : 'text-slate-500'
                  }`}
                >
                  EN
                </button>
              </div>

              {/* Save Confirmation Button */}
              <button
                type="button"
                onClick={handleSaveAll}
                className={`px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black whitespace-nowrap shrink-0 inline-flex items-center gap-1 cursor-pointer transition shadow-2xs ${
                  isDirty ? 'ring-2 ring-emerald-500/35' : ''
                }`}
                title="সকল পরিবর্তন সংরক্ষণ নিশ্চিত করুন"
              >
                <Save size={13} /> {isDirty ? 'সংরক্ষণ*' : 'সংরক্ষণ'}
              </button>

              {/* Reset Button */}
              <button
                type="button"
                onClick={onResetToNctb}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-slate-600 dark:text-slate-300 hover:text-amber-700 border border-slate-200/80 dark:border-slate-700 cursor-pointer transition shrink-0"
                title="NCTB ২০২৬ ডিফল্ট রিসেট"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          ) : (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs font-bold">
              <Book size={13} />
              <span>জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB) অনুমোদিত পাঠ্যবই ({nctbBooksCount}টি)</span>
            </div>
          )}
        </div>

        {/* TIER 2: Department Filter Pills + Live Class Stats + Search & Bulk Actions */}
        {activeTab === 'assign' && (
          <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col lg:flex-row lg:items-center justify-between gap-2">
              {/* Left: Department / Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setBucketFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black whitespace-nowrap cursor-pointer transition ${
                    bucketFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  সকল বিষয় ({currentClassSubjects.length})
                </button>

                {(Object.keys(BUCKET_META) as SectionBucketKey[]).map((key) => {
                  const count = bucketCounts[key];
                  if (count === 0 && bucketFilter !== key) return null;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setBucketFilter(key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold whitespace-nowrap cursor-pointer transition inline-flex items-center gap-1.5 ${
                        bucketFilter === key
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          bucketFilter === key ? 'bg-white' : BUCKET_META[key].dotCls
                        }`}
                      />
                      <span>
                        {BUCKET_META[key].shortBn} ({count})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right: Live Class Metrics + Bulk Remove + Search Input */}
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    মোট পূর্ণমান:{' '}
                    <strong className="font-mono font-black text-slate-900 dark:text-white">
                      {activeClassTotalMarks}
                    </strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    যুগ্ম পত্র:{' '}
                    <strong className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                      {activeClassPairedCount}টি
                    </strong>
                  </span>
                </div>

                {selectedRowIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkRemove}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black whitespace-nowrap inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Trash2 size={12} /> নির্বাচিত সরান ({selectedRowIds.length})
                  </button>
                )}

                <div className="relative w-full sm:w-56">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="বিষয় বা কোড খুঁজুন..."
                    className="w-full pl-8 pr-6 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold outline-none focus:border-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Banner inside main padded container (never displaces docked header) */}
      {topBanner && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          {topBanner}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FULL-WIDTH HIGH-DENSITY INLINE SUBJECT MANAGEMENT TABLE            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'assign' && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5">
          {filteredClassSubjects.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-10 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <BookOpen size={22} />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {activeGradeMeta.labelBn}-এ কোনো বিষয় পাওয়া যায়নি
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                সাব-হেডার বারের <strong>“লাইব্রেরি থেকে অ্যাসাইন (২৫৯+)”</strong> বাটনে ক্লিক করে ১০টি
                লাইব্রেরি থেকে এক ক্লিকে বিষয় যোগ করুন অথবা কাস্টম বিষয় তৈরি করুন।
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus size={14} /> লাইব্রেরি থেকে বিষয় অ্যাসাইন করুন
                </button>
                <button
                  type="button"
                  onClick={() => setQuickCustomOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> কাস্টম বিষয়
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 dark:bg-slate-950 text-slate-600 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-800 text-[11px]">
                      <th className="p-2.5 pl-3.5 w-9 text-center">
                        <button
                          type="button"
                          onClick={toggleSelectAllVisible}
                          className="text-slate-400 hover:text-indigo-600 cursor-pointer flex items-center justify-center mx-auto"
                          title="সব নির্বাচন / বাতিল"
                        >
                          {allVisibleSelected ? (
                            <CheckSquare
                              size={15}
                              className="text-indigo-600 dark:text-indigo-400"
                            />
                          ) : (
                            <Square size={15} />
                          )}
                        </button>
                      </th>
                      <th className="p-2.5 w-20">কোড</th>
                      <th className="p-2.5 min-w-[200px]">বিষয়ের নাম</th>
                      <th className="p-2.5 w-36">বিভাগ / ধরন</th>
                      <th className="p-2.5 w-16 text-center">CQ</th>
                      <th className="p-2.5 w-16 text-center">MCQ</th>
                      <th className="p-2.5 w-16 text-center">ব্যবহারিক</th>
                      <th className="p-2.5 w-16 text-center">CA</th>
                      <th className="p-2.5 min-w-[140px] text-center">পূর্ণমান ও পাস (৩৩%)</th>
                      <th className="p-2.5 w-32 text-center">পাস নীতি</th>
                      <th className="p-2.5 min-w-[165px]">যুগ্ম পত্র (Combined)</th>
                      <th className="p-2.5 pr-3.5 w-20 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/90 font-medium text-slate-800 dark:text-slate-200">
                    {filteredClassSubjects.map((item) => {
                      const bucketKey = classifyBucket(item);
                      const bucketMeta = BUCKET_META[bucketKey];
                      const mode = inferPassRuleMode(item);
                      const passInfo = formatPassMarksBreakdown({
                        cq: item.cq,
                        mcq: item.mcq,
                        practical: item.practical,
                        ca: item.ca,
                        passRuleMode: mode,
                      });
                      const isRowSelected = selectedRowIds.includes(item.id);
                      const pairOptions = currentClassSubjects.filter((s) => s.id !== item.id);

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors hover:bg-indigo-50/25 dark:hover:bg-indigo-950/20 ${
                            isRowSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/35' : ''
                          }`}
                        >
                          {/* 1. Checkbox */}
                          <td className="p-2.5 pl-3.5 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedRowIds((prev) =>
                                  prev.includes(item.id)
                                    ? prev.filter((x) => x !== item.id)
                                    : [...prev, item.id],
                                )
                              }
                              className="text-slate-400 hover:text-indigo-600 cursor-pointer flex items-center justify-center mx-auto"
                            >
                              {isRowSelected ? (
                                <CheckSquare
                                  size={15}
                                  className="text-indigo-600 dark:text-indigo-400"
                                />
                              ) : (
                                <Square size={15} />
                              )}
                            </button>
                          </td>

                          {/* 2. Code */}
                          <td className="p-2.5">
                            <span className="inline-block px-2 py-1 rounded-lg bg-slate-900 dark:bg-slate-800 text-white font-mono font-black text-[11px]">
                              {item.code}
                            </span>
                          </td>

                          {/* 3. Subject Name & Bilingual Subtitle */}
                          <td className="p-2.5">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-[13px]">
                                  {item.name}
                                </span>
                                {item.combinedWithCode && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 text-[9.5px] font-black">
                                    <Link2 size={9} /> যুগ্ম: {item.combinedWithCode}
                                  </span>
                                )}
                                {bucketKey === 'religion' && (
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[9.5px] font-black ${
                                      item.code === '112' || item.name.includes('হিন্দু')
                                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60'
                                        : item.code === '113' || item.name.includes('বৌদ্ধ')
                                        ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200/80 dark:border-violet-800/60'
                                        : item.code === '114' || item.name.includes('খ্রিষ্ট') || item.name.includes('খ্রিস্ট')
                                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60'
                                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60'
                                    }`}
                                  >
                                    {item.code === '112' || item.name.includes('হিন্দু')
                                      ? 'হিন্দু শিক্ষার্থী'
                                      : item.code === '113' || item.name.includes('বৌদ্ধ')
                                      ? 'বৌদ্ধ শিক্ষার্থী'
                                      : item.code === '114' || item.name.includes('খ্রিষ্ট') || item.name.includes('খ্রিস্ট')
                                      ? 'খ্রিষ্টান শিক্ষার্থী'
                                      : 'মুসলিম শিক্ষার্থী'}
                                  </span>
                                )}
                                {item.isUncountableCA && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9.5px] font-black">
                                    CA
                                  </span>
                                )}
                              </div>
                              {nameLang === 'bn' && item.nameEn && item.nameEn !== item.name && (
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {item.nameEn}
                                </span>
                              )}
                              {nameLang === 'en' && item.nameBn && item.nameBn !== item.name && (
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {item.nameBn}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 4. 1-Click Inline Department / Category Dropdown */}
                          <td className="p-2.5">
                            <select
                              value={bucketKey}
                              onChange={(e) =>
                                updateRowFields(
                                  item.id,
                                  applyBucketPatch(e.target.value as SectionBucketKey),
                                )
                              }
                              className={`w-full px-2 py-1 rounded-lg text-[10.5px] font-black border outline-none cursor-pointer ${bucketMeta.badgeCls}`}
                            >
                              <option value="general">সাধারণ / আবশ্যিক</option>
                              <option value="science">বিজ্ঞান বিভাগ</option>
                              <option value="humanities">মানবিক বিভাগ</option>
                              <option value="commerce">ব্যবসায় শিক্ষা</option>
                              <option value="religion">ধর্ম ও নৈতিক</option>
                              <option value="fourth">৪র্থ ও ঐচ্ছিক বিষয়</option>
                              <option value="ca">CA (অগণনাযোগ্য)</option>
                            </select>
                          </td>

                          {/* 5. CQ Input */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={200}
                              value={toNumMark(item.cq)}
                              onChange={(e) =>
                                updateRowFields(item.id, {
                                  cq: Math.max(0, parseInt(e.target.value || '0', 10) || 0),
                                })
                              }
                              className="w-14 px-1.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-mono font-black text-center text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>

                          {/* 6. MCQ Input */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={200}
                              value={toNumMark(item.mcq)}
                              onChange={(e) =>
                                updateRowFields(item.id, {
                                  mcq: Math.max(0, parseInt(e.target.value || '0', 10) || 0),
                                })
                              }
                              className="w-14 px-1.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-mono font-black text-center text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>

                          {/* 7. Practical Input */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={200}
                              value={toNumMark(item.practical)}
                              onChange={(e) =>
                                updateRowFields(item.id, {
                                  practical: Math.max(0, parseInt(e.target.value || '0', 10) || 0),
                                })
                              }
                              className="w-14 px-1.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-mono font-black text-center text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>

                          {/* 8. CA Input */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={200}
                              value={toNumMark(item.ca)}
                              onChange={(e) =>
                                updateRowFields(item.id, {
                                  ca: Math.max(0, parseInt(e.target.value || '0', 10) || 0),
                                })
                              }
                              className="w-14 px-1.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-mono font-black text-center text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>

                          {/* 9. Full Marks & 33% Pass Summary */}
                          <td className="p-2.5 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                                পূর্ণমান {passInfo.totalMarks}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50 text-[10px] font-bold whitespace-nowrap">
                                {passInfo.summaryText}
                              </span>
                            </div>
                          </td>

                          {/* 10. Pass Policy Segmented Toggle */}
                          <td className="p-2.5 text-center">
                            <div className="inline-grid grid-cols-2 gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                              <button
                                type="button"
                                onClick={() => updateRowFields(item.id, { passRuleMode: 'part' })}
                                className={`px-2 py-1 rounded-md text-[10px] font-black transition cursor-pointer ${
                                  mode === 'part'
                                    ? 'bg-indigo-600 text-white shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                }`}
                                title="সৃজনশীল, MCQ ও ব্যবহারিকে আলাদাভাবে ৩৩% পাস"
                              >
                                পৃথক
                              </button>
                              <button
                                type="button"
                                onClick={() => updateRowFields(item.id, { passRuleMode: 'total' })}
                                className={`px-2 py-1 rounded-md text-[10px] font-black transition cursor-pointer ${
                                  mode === 'total'
                                    ? 'bg-indigo-600 text-white shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                }`}
                                title="সব অংশ মিলিয়ে মোট ৩৩% পাস"
                              >
                                মোট
                              </button>
                            </div>
                          </td>

                          {/* 11. Combined With Bidirectional Selector */}
                          <td className="p-2.5">
                            <select
                              value={item.combinedWithCode || ''}
                              onChange={(e) => handlePairCombined(item.id, e.target.value)}
                              className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
                            >
                              <option value="">— একক পত্র —</option>
                              {pairOptions.map((opt) => (
                                <option key={opt.id} value={opt.code}>
                                  {opt.code} · {opt.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* 12. Actions */}
                          <td className="p-2.5 pr-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingItem(item)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 hover:text-indigo-700 cursor-pointer transition"
                                title="বিষয়ের নাম, কোড ও CA সেটিংস সম্পাদনা"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveSingle(item)}
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white cursor-pointer transition"
                                title="শ্রেণি থেকে সরান"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Compact Bottom Helper Bar */}
              <div className="px-4 py-2.5 bg-slate-50/90 dark:bg-slate-950/70 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>
                    <strong>পৃথক পাস:</strong> CQ, MCQ ও ব্যবহারিক প্রতিটি অংশে আলাদা ৩৩%।{' '}
                    <strong>যুগ্ম পত্র:</strong> ১ম ও ২য় পত্র সংযুক্ত করলে একত্রে গড় গ্রেড হিসাব হয়।{' '}
                    <strong>ধর্মীয় বিষয়:</strong> ইসলাম (১১১) ও হিন্দুধর্ম (১১২) শিক্ষার্থীর ধর্ম অনুযায়ী মার্কশিট ও নম্বর এন্ট্রিতে স্বয়ংক্রিয়ভাবে ফিল্টার হয়।
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-400">
                  প্রদর্শিত: {filteredClassSubjects.length} / {currentClassSubjects.length}টি বিষয়
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 10-LIBRARY SUBJECT PICKER MODAL ── */}
      <SubjectLibraryPickerModal
        open={pickerOpen}
        initialGrade={selectedGrade}
        existingCurriculum={draftList}
        nameLang={nameLang}
        onChangeNameLang={setNameLang}
        onAssignSelected={handleAssignFromLibrary}
        onClose={() => setPickerOpen(false)}
      />

      {/* ── QUICK ADD CUSTOM SUBJECT MODAL ── */}
      {quickCustomOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black">কাস্টম বিষয় যোগ করুন</h3>
                <p className="text-[11px] text-indigo-200">
                  {activeGradeMeta.labelBn}-এ সরাসরি নতুন বিষয় সংযোজন
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickCustomOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleQuickAddCustomSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-12 gap-2.5">
                <div className="col-span-4">
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    বিষয় কোড *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: 101"
                    value={customForm.code}
                    onChange={(e) => setCustomForm({ ...customForm, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono font-black outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-8">
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    বিভাগ / ধরন
                  </label>
                  <select
                    value={customForm.bucket}
                    onChange={(e) =>
                      setCustomForm({
                        ...customForm,
                        bucket: e.target.value as SectionBucketKey,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                  >
                    <option value="general">সাধারণ ও আবশ্যিক</option>
                    <option value="science">বিজ্ঞান বিভাগ</option>
                    <option value="humanities">মানবিক বিভাগ</option>
                    <option value="commerce">ব্যবসায় শিক্ষা</option>
                    <option value="religion">ধর্ম ও নৈতিক শিক্ষা</option>
                    <option value="fourth">৪র্থ ও ঐচ্ছিক বিষয়</option>
                    <option value="ca">CA (অগণনাযোগ্য)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  বিষয়ের নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বাংলা ১ম পত্র"
                  value={customForm.nameBn}
                  onChange={(e) => setCustomForm({ ...customForm, nameBn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  বিষয়ের নাম (English - ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bangla 1st Paper"
                  value={customForm.nameEn}
                  onChange={(e) => setCustomForm({ ...customForm, nameEn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-semibold outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'CQ', key: 'cq' as const, val: customForm.cq },
                  { label: 'MCQ', key: 'mcq' as const, val: customForm.mcq },
                  { label: 'ব্যবহারিক', key: 'practical' as const, val: customForm.practical },
                  { label: 'CA', key: 'ca' as const, val: customForm.ca },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      {f.label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={200}
                      value={f.val}
                      onChange={(e) =>
                        setCustomForm({
                          ...customForm,
                          [f.key]: Math.max(0, parseInt(e.target.value || '0', 10) || 0),
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono font-black text-center"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuickCustomOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> বিষয় যুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SUBJECT DETAIL & CA SETTINGS MODAL ── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black">বিষয় ও CA সেটিংস সম্পাদনা</h3>
                <p className="text-[10.5px] text-indigo-200">
                  কোড {editingItem.code} • {activeGradeMeta.labelBn}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-12 gap-2.5">
                <div className="col-span-4">
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    বিষয় কোড
                  </label>
                  <input
                    type="text"
                    value={editingItem.code}
                    onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono font-black"
                  />
                </div>
                <div className="col-span-8">
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    বিষয়ের নাম
                  </label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    ধরণ (Type)
                  </label>
                  <select
                    value={editingItem.subjectType || 'general'}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        subjectType: e.target.value as 'general' | 'group' | 'religion',
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="general">সাধারণ (সকল)</option>
                    <option value="group">বিভাগীয়</option>
                    <option value="religion">ধর্মীয়</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    বিভাগ (Group)
                  </label>
                  <select
                    value={editingItem.group}
                    onChange={(e) => setEditingItem({ ...editingItem, group: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="সাধারণ">সাধারণ (সকল)</option>
                    <option value="বিজ্ঞান">বিজ্ঞান</option>
                    <option value="মানবিক">মানবিক</option>
                    <option value="ব্যবসায় শিক্ষা">ব্যবসায় শিক্ষা</option>
                    <option value="মানবিক ও ব্যবসায় শিক্ষা">মানবিক ও ব্যবসায়</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    ক্যাটাগরি
                  </label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="আবশ্যিক">আবশ্যিক</option>
                    <option value="৪র্থ বিষয়">৪র্থ বিষয়</option>
                    <option value="ঐচ্ছিক">ঐচ্ছিক</option>
                  </select>
                </div>
              </div>

              {/* CA / Uncountable Subject Switch */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editingItem.isUncountableCA)}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, isUncountableCA: e.target.checked })
                  }
                  className="w-4 h-4 accent-indigo-600 rounded mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="font-black text-slate-900 dark:text-white block">
                    এটি একটি ধারাবাহিক মূল্যায়ন (CA / অগণনাযোগ্য) বিষয়
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    মার্কশিটে আলাদা গ্রেড হিসেবে প্রদর্শিত হবে, কিন্তু মোট নম্বর, GPA বা মেধাক্রমে গণনা হবে না।
                  </span>
                </div>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateRowFields(editingItem.id, editingItem);
                    setEditingItem(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} /> প্রয়োগ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
