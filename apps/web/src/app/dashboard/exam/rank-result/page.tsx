'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Printer,
  Search,
  CheckCircle2,
  UserX,
  Star,
  AlertCircle,
  Layers,
  Crown,
  X,
  FileSpreadsheet,
  Eye,
  EyeOff,
  FileText,
  Trophy,
  Award,
  Users,
} from 'lucide-react';
import { studentService } from '@/services/studentService';
import { examService, ExamItem } from '@/services/examService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { getStudentReligion } from '@/lib/religionUtils';
import { resultService } from '@/services/resultService';
import { toBanglaDigits } from '@/lib/omr/omrTemplates';
import {
  CombinedRankCriteria,
  EvaluatedRankStudent,
  RANK_GRADE_BN_MAP,
  RANK_GRADE_SHORT_BN,
  RankStudentBase,
  buildChampionsExcelRows,
  buildClassRankExcelRows,
  buildStudentRankDedupKey,
  computeSchoolChampions,
  formatBanglaOrdinal,
  normalizeRankGrade,
  normalizeRankGroupAndSection,
  rankAndFilterClassStudents,
} from '@/lib/rankResultUtils';
import SchoolPadWrapper from '@/components/SchoolPadWrapper';
import { showToast } from '@/components/ui/ToastProvider';

type MainTab = 'class_rank' | 'school_champions';
type PrintPaperMode = 'standard' | 'preprinted_pad';
type PrintOrientation = 'portrait' | 'landscape';

const GRADES_OPTIONS: Array<{ id: '6th' | '7th' | '8th' | '9th' | '10th'; labelBn: string }> = [
  { id: '6th', labelBn: '৬ষ্ঠ শ্রেণি' },
  { id: '7th', labelBn: '৭ম শ্রেণি' },
  { id: '8th', labelBn: '৮ম শ্রেণি' },
  { id: '9th', labelBn: '৯ম শ্রেণি' },
  { id: '10th', labelBn: '১০ম শ্রেণি' },
];

const DEFAULT_FALLBACK_EXAMS = [
  'অর্ধ-বার্ষিক পরীক্ষা ২০২৬',
  'বার্ষিক পরীক্ষা ২০২৬',
  'এসএসসি প্রাক-নির্বাচনী পরীক্ষা ২০২৬',
  'এসএসসি নির্বাচনী (টেস্ট) পরীক্ষা ২০২৬',
];

export default function FreshRankBasedResultPage() {
  const [mounted, setMounted] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('class_rank');
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>(DEFAULT_FALLBACK_EXAMS[0]);
  const [selectedGrade, setSelectedGrade] = useState<'6th' | '7th' | '8th' | '9th' | '10th'>('8th');
  const [selectedBranch, setSelectedBranch] = useState<string>('A');
  const [selectedGroup, setSelectedGroup] = useState<'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা'>('সাধারণ');
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);

  // Criteria toggles (Default: Pass + 1 & 2 subject fail + special consideration)
  const [criteria, setCriteria] = useState<CombinedRankCriteria>({
    includePass: true,
    includeFail1: true,
    includeFail2: true,
    includeFail3: false,
    includeFail4Plus: false,
    includeConsidered: true,
  });

  // Logical Print Controls
  const [printMode, setPrintMode] = useState<PrintPaperMode>('standard');
  const [printOrientation, setPrintOrientation] = useState<PrintOrientation>('portrait');
  const [officeCopyMode, setOfficeCopyMode] = useState<boolean>(false);
  const [split910ByGroup, setSplit910ByGroup] = useState<boolean>(false);

  // Special Consideration Persistence
  const [specialConsideredIds, setSpecialConsideredIds] = useState<string[]>([]);
  const [showBlankPadModal, setShowBlankPadModal] = useState<boolean>(false);

  // Boot live settings & exams
  useEffect(() => {
    setMounted(true);
    setSchoolSettings(settingsService.getSettings());
    const activeExams = examService.getActiveExams();
    setExams(activeExams);
    if (activeExams.length > 0) {
      setSelectedExam(activeExams[0].title);
    }

    const unsubExams = examService.subscribe((updated) => {
      setExams(updated.filter((ex) => ex.isActive !== false));
    });
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'sms_school_settings') {
        setSchoolSettings(settingsService.getSettings());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubExams();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const examOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const ex of exams) {
      if (ex.title && !seen.has(ex.title)) {
        seen.add(ex.title);
        list.push(ex.title);
      }
    }
    for (const title of DEFAULT_FALLBACK_EXAMS) {
      if (!seen.has(title)) {
        seen.add(title);
        list.push(title);
      }
    }
    return list;
  }, [exams]);

  const isClass9or10 = selectedGrade === '9th' || selectedGrade === '10th';
  const considerationStorageKey = `sms_special_considered_${selectedExam}_${selectedGrade}_${selectedBranch}_${selectedGroup}`;

  // Load Special Considered IDs for current scope
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(considerationStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSpecialConsideredIds(Array.isArray(parsed) ? parsed : []);
      } catch {
        setSpecialConsideredIds([]);
      }
    } else {
      setSpecialConsideredIds([]);
    }
  }, [considerationStorageKey]);

  const handleToggleSpecialConsideration = (studentId: string) => {
    const updated = specialConsideredIds.includes(studentId)
      ? specialConsideredIds.filter((id) => id !== studentId)
      : [...specialConsideredIds, studentId];
    setSpecialConsideredIds(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(considerationStorageKey, JSON.stringify(updated));
    }
  };

  // Load & cleanly deduplicate all students across classes, sections & 9–10 groups
  const allCentralStudents: RankStudentBase[] = useMemo(() => {
    if (!mounted) return [];
    let combinedRaw: Array<Record<string, unknown>> = [];
    if (typeof window !== 'undefined') {
      try {
        const storedUploaded = localStorage.getItem('sms_uploaded_students');
        const storedStudents = localStorage.getItem('sms_students');
        if (storedUploaded) combinedRaw = [...combinedRaw, ...JSON.parse(storedUploaded)];
        if (storedStudents) combinedRaw = [...combinedRaw, ...JSON.parse(storedStudents)];
      } catch {
        // fallback below
      }
    }
    if (combinedRaw.length === 0) {
      combinedRaw = studentService.getAllStudents() as unknown as Array<Record<string, unknown>>;
    }

    const uniqueMap = new Map<string, RankStudentBase>();
    combinedRaw.forEach((st, idx) => {
      const normalizedGrade = normalizeRankGrade(st.grade ?? st.gradeBn ?? '6th');
      const { groupBn, sectionNorm } = normalizeRankGroupAndSection(
        normalizedGrade,
        st.section ?? st.branch,
        st.group,
      );
      const roll = String(st.roll ?? String(idx + 1).padStart(2, '0')).trim();
      const dedupKey = buildStudentRankDedupKey(normalizedGrade, sectionNorm, groupBn, roll);

      if (!uniqueMap.has(dedupKey)) {
        const is9or10 = normalizedGrade === '9th' || normalizedGrade === '10th';
        uniqueMap.set(dedupKey, {
          id: String(st.id || `st_${dedupKey}`),
          roll,
          name: String(st.name || 'অজানা শিক্ষার্থী'),
          grade: normalizedGrade,
          gradeBn: RANK_GRADE_BN_MAP[normalizedGrade],
          section: sectionNorm,
          group: groupBn,
          optionalSubject: String(
            st.optionalSubject ||
              (is9or10 && groupBn === 'বিজ্ঞান' ? 'উচ্চতর গণিত' : 'কৃষি শিক্ষা'),
          ),
          religion: getStudentReligion(st as { religion?: string; name?: string }),
        });
      }
    });

    return Array.from(uniqueMap.values());
  }, [mounted]);

  const consideredIdSet = useMemo(
    () => new Set(specialConsideredIds),
    [specialConsideredIds],
  );

  // Evaluate a single student via centralized resultService
  const evaluateRankStudent = (student: RankStudentBase): EvaluatedRankStudent => {
    const evaluated = resultService.calculateStudentResult({
      examId: selectedExam,
      student,
      grade: student.grade,
      branch: student.section,
      group: student.group,
    });
    const isConsidered = consideredIdSet.has(student.id);

    if (!evaluated) {
      return {
        ...student,
        totalObtained: 0,
        totalFull: 0,
        obtainedPercentage: 0,
        gpaWithout4th: 0,
        bonusGP: 0,
        finalGPA: 0,
        overallGrade: 'F',
        hasFailed: true,
        failedCount: 0,
        failedSubjects: [],
        isConsidered,
        meritPosition: null,
        listOrder: 0,
        schoolPosition: null,
        classPosition: null,
        badge: 'বিশেষ বিবেচনা',
      };
    }

    const totalFull = evaluated.totalFullMarks;
    const totalObtained = evaluated.totalObtainedMarks;
    const obtainedPercentage =
      evaluated.obtainedPercentage ??
      (totalFull > 0 ? Number(((totalObtained / totalFull) * 100).toFixed(2)) : 0);

    return {
      ...student,
      totalObtained,
      totalFull,
      obtainedPercentage,
      gpaWithout4th: evaluated.gpaWithout4th,
      bonusGP: evaluated.bonusGP,
      finalGPA: evaluated.gpa,
      overallGrade: evaluated.letterGrade,
      hasFailed: !evaluated.isPassed,
      failedCount: evaluated.failedCount,
      failedSubjects: evaluated.failedSubjects,
      hasIncompleteMarks: evaluated.hasIncompleteMarks,
      isConsidered,
      meritPosition: null,
      listOrder: 0,
      schoolPosition: null,
      classPosition: null,
      badge: '',
    };
  };

  // Tab 1: Evaluate ONLY students in the active Class + Section/Group (10× faster on open!)
  const currentClassStudents = useMemo(() => {
    const scoped = allCentralStudents.filter((st) => {
      if (st.grade !== selectedGrade) return false;
      if (isClass9or10) {
        return st.group === selectedGroup;
      }
      return st.section.toLowerCase() === selectedBranch.toLowerCase();
    });
    return scoped.map(evaluateRankStudent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCentralStudents, selectedExam, selectedGrade, selectedBranch, selectedGroup, isClass9or10, consideredIdSet]);

  // Tab 2: Lazily evaluate all-school students ONLY when the Champions tab is active
  const championsData = useMemo(() => {
    if (activeMainTab !== 'school_champions') {
      return { schoolChampion: null, allSchoolPassed: [], buckets: [] };
    }
    const allEvaluated = allCentralStudents.map(evaluateRankStudent);
    return computeSchoolChampions(allEvaluated, split910ByGroup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMainTab, allCentralStudents, selectedExam, split910ByGroup, consideredIdSet]);

  const { displayedList, summary } = useMemo(
    () => rankAndFilterClassStudents(currentClassStudents, criteria, searchQuery),
    [currentClassStudents, criteria, searchQuery],
  );

  const toggleCriteria = (key: keyof CombinedRankCriteria) => {
    setCriteria((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyCriteriaPreset = (preset: 'pass_only' | 'notice_default' | 'all') => {
    if (preset === 'pass_only') {
      setCriteria({
        includePass: true,
        includeFail1: false,
        includeFail2: false,
        includeFail3: false,
        includeFail4Plus: false,
        includeConsidered: false,
      });
    } else if (preset === 'notice_default') {
      setCriteria({
        includePass: true,
        includeFail1: true,
        includeFail2: true,
        includeFail3: false,
        includeFail4Plus: false,
        includeConsidered: true,
      });
    } else {
      setCriteria({
        includePass: true,
        includeFail1: true,
        includeFail2: true,
        includeFail3: true,
        includeFail4Plus: true,
        includeConsidered: true,
      });
    }
  };

  const scopeDisplayBn = isClass9or10 ? `${selectedGroup} বিভাগ` : `শাখা: ${selectedBranch}`;

  const printableListTitle = useMemo(() => {
    const gradeShort = RANK_GRADE_SHORT_BN[selectedGrade] || selectedGrade;
    if (activeMainTab === 'school_champions') {
      return split910ByGroup
        ? 'সর্ব-বিদ্যালয় সেরা মেধা ও শ্রেণি/বিভাগভিত্তিক শীর্ষ ৩ মেধা তালিকা'
        : 'সর্ব-বিদ্যালয় সেরা মেধা (স্কুল ফার্স্ট) ও শ্রেণিভিত্তিক শীর্ষ ৩ মেধা তালিকা';
    }
    const onlyPass =
      criteria.includePass &&
      !criteria.includeFail1 &&
      !criteria.includeFail2 &&
      !criteria.includeFail3 &&
      !criteria.includeFail4Plus &&
      !criteria.includeConsidered;

    const baseTitle = onlyPass
      ? `শ্রেণিভিত্তিক মেধা তালিকা (${gradeShort} শ্রেণি — ${scopeDisplayBn} · সকল বিষয়ে উত্তীর্ণ)`
      : `সম্মিলিত ফলাফল ও মেধা তালিকা (${gradeShort} শ্রেণি — ${scopeDisplayBn})`;

    return officeCopyMode ? `${baseTitle} [অফিস কপি]` : baseTitle;
  }, [activeMainTab, split910ByGroup, selectedGrade, scopeDisplayBn, criteria, officeCopyMode]);

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      if (activeMainTab === 'school_champions') {
        const rows = buildChampionsExcelRows(championsData.buckets);
        if (rows.length === 0) {
          showToast('এক্সপোর্ট করার মতো কোনো উত্তীর্ণ মেধাবী শিক্ষার্থী পাওয়া যায়নি।', 'info');
          return;
        }
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'School_Top3');
        XLSX.writeFile(wb, `School_Champions_${new Date().toISOString().slice(0, 10)}.xlsx`);
        showToast('স্কুল ফার্স্ট ও শীর্ষ ৩ মেধা তালিকা Excel ফাইলে ডাউনলোড হয়েছে।', 'success');
      } else {
        const rows = buildClassRankExcelRows(displayedList, {
          isClass9or10,
          officeCopyMode,
        });
        if (rows.length === 0) {
          showToast('বর্তমান ফিল্টারে এক্সপোর্ট করার মতো কোনো শিক্ষার্থী নেই।', 'info');
          return;
        }
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'MeritList');
        XLSX.writeFile(
          wb,
          `Merit_List_${selectedGrade}_${selectedBranch}_${new Date().toISOString().slice(0, 10)}.xlsx`,
        );
        showToast(`${toBanglaDigits(rows.length)} জন শিক্ষার্থীর মেধা তালিকা Excel-এ ডাউনলোড হয়েছে।`, 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Excel এক্সপোর্ট ব্যর্থ হয়েছে।', 'error');
    }
  };

  // Dynamic, single-source @page rule (NEVER doubled with inline padding on print!)
  const dynamicPrintCss = useMemo(() => {
    const sharedPrintRules = `
      .rank-print-avoid-break {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      .rank-print-table thead {
        display: table-header-group !important;
      }
      .rank-print-table tr {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    `;
    if (showBlankPadModal) {
      return `
        @media print {
          @page { size: A4 portrait; margin: 0; }
        }
      `;
    }
    if (printMode === 'preprinted_pad') {
      const m = schoolSettings?.padMargins;
      const top = Number(m?.top ?? 1.5);
      const right = Number(m?.right ?? 0.5);
      const bottom = Number(m?.bottom ?? 0.65);
      const left = Number(m?.left ?? 0.5);
      return `
        @media print {
          @page {
            size: A4 ${printOrientation};
            margin: ${top}in ${right}in ${bottom}in ${left}in;
          }
          ${sharedPrintRules}
        }
      `;
    }
    return `
      @media print {
        @page {
          size: A4 ${printOrientation};
          margin: 10mm 11mm 12mm 11mm;
        }
        ${sharedPrintRules}
      }
    `;
  }, [showBlankPadModal, printMode, printOrientation, schoolSettings?.padMargins]);

  if (!mounted) {
    return (
      <div className="p-10 text-center text-sm font-semibold text-slate-400">
        মেধা ও ফলাফল তালিকা লোড হচ্ছে...
      </div>
    );
  }

  const todayBn = new Date().toLocaleDateString('bn-BD');

  return (
    <div className="min-h-full bg-slate-50/70 dark:bg-slate-950 print:bg-white">
      <style>{dynamicPrintCss}</style>

      {/* ─── SINGLE-ROW FLUSH STICKY SUB-HEADER (h-14, print:hidden) ─── */}
      <div className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-5 flex items-center justify-between gap-2 print:hidden">
        {/* Left: Segmented Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveMainTab('class_rank')}
            className={`h-9 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMainTab === 'class_rank'
                ? 'bg-[#0B5D3B] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>শ্রেণিভিত্তিক মেধা তালিকা</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('school_champions')}
            className={`h-9 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMainTab === 'school_champions'
                ? 'bg-[#0B5D3B] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5 shrink-0" />
            <span>স্কুল ফার্স্ট ও শীর্ষ ৩</span>
          </button>
        </div>

        {/* Right: Quick Export & Print Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportExcel}
            className="hidden sm:inline-flex h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBlankPadModal(true)}
            className="hidden md:inline-flex h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>ফাঁকা প্যাড</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="h-9 px-3.5 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট / PDF</span>
          </button>
        </div>
      </div>

      {/* ─── MAIN WORKSPACE BODY ─── */}
      <div className="p-3 sm:p-5 max-w-[1380px] mx-auto space-y-4 print:p-0 print:max-w-none print:space-y-0 print-hide-when-modal">
        {/* ══ SCREEN-ONLY CONTROL & PRINT CONFIGURATION CONSOLE ══ */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3.5 print:hidden">
          {activeMainTab === 'class_rank' ? (
            <>
              {/* Row 1: Exam, Class, Section/Group, Search */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    পরীক্ষা নির্বাচন
                  </label>
                  <select
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0B5D3B] cursor-pointer"
                  >
                    {examOptions.map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    শ্রেণি
                  </label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => {
                      const nextGrade = e.target.value as '6th' | '7th' | '8th' | '9th' | '10th';
                      setSelectedGrade(nextGrade);
                      if (nextGrade === '9th' || nextGrade === '10th') {
                        setSelectedBranch('Science');
                        setSelectedGroup('বিজ্ঞান');
                      } else {
                        setSelectedBranch('A');
                        setSelectedGroup('সাধারণ');
                      }
                    }}
                    className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0B5D3B] cursor-pointer"
                  >
                    {GRADES_OPTIONS.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.labelBn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    {isClass9or10 ? 'বিভাগ' : 'শাখা'}
                  </label>
                  <select
                    value={isClass9or10 ? selectedGroup : selectedBranch}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (isClass9or10) {
                        const grp = val as 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা';
                        setSelectedGroup(grp);
                        setSelectedBranch(
                          grp === 'বিজ্ঞান'
                            ? 'Science'
                            : grp === 'মানবিক'
                              ? 'Humanities'
                              : 'Commerce',
                        );
                      } else {
                        setSelectedBranch(val);
                        setSelectedGroup('সাধারণ');
                      }
                    }}
                    className="w-full h-9 px-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 font-bold text-[#0B5D3B] dark:text-emerald-300 focus:outline-none focus:border-[#0B5D3B] cursor-pointer"
                  >
                    {isClass9or10 ? (
                      <>
                        <option value="বিজ্ঞান">বিজ্ঞান বিভাগ</option>
                        <option value="মানবিক">মানবিক বিভাগ</option>
                        <option value="ব্যবসায় শিক্ষা">ব্যবসায় শিক্ষা বিভাগ</option>
                      </>
                    ) : (
                      <>
                        <option value="A">শাখা: A (ক)</option>
                        <option value="B">শাখা: B (খ)</option>
                        <option value="C">শাখা: C (গ)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    শিক্ষার্থী অনুসন্ধান
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="রোল বা নাম লিখুন..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-9 pl-8 pr-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#0B5D3B]"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Logical Merit Filter Chips + Quick Presets */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-0.5">
                    তালিকা অন্তর্ভুক্তি:
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleCriteria('includePass')}
                    className={`h-7 px-2.5 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer ${
                      criteria.includePass
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 line-through'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    পাস ({toBanglaDigits(summary.passedCount)})
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCriteria('includeFail1')}
                    className={`h-7 px-2.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                      criteria.includeFail1
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 line-through'
                    }`}
                  >
                    ১ বিষয়ে ফেল ({toBanglaDigits(summary.fail1Count)})
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCriteria('includeFail2')}
                    className={`h-7 px-2.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                      criteria.includeFail2
                        ? 'bg-orange-50 dark:bg-orange-950/50 border-orange-300 dark:border-orange-800 text-orange-900 dark:text-orange-200'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 line-through'
                    }`}
                  >
                    ২ বিষয়ে ফেল ({toBanglaDigits(summary.fail2Count)})
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCriteria('includeFail3')}
                    className={`h-7 px-2.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                      criteria.includeFail3
                        ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    ৩ বিষয় ({toBanglaDigits(summary.fail3Count)})
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCriteria('includeFail4Plus')}
                    className={`h-7 px-2.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                      criteria.includeFail4Plus
                        ? 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    ৪+ বিষয় ({toBanglaDigits(summary.fail4PlusCount)})
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCriteria('includeConsidered')}
                    className={`h-7 px-2.5 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer ${
                      criteria.includeConsidered
                        ? 'bg-violet-50 dark:bg-violet-950/50 border-violet-300 dark:border-violet-800 text-violet-900 dark:text-violet-200'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    <Star className="w-3 h-3" />
                    বিবেচনাপ্রাপ্ত ({toBanglaDigits(summary.consideredCount)})
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => applyCriteriaPreset('pass_only')}
                    className="px-2 py-1 rounded-md font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                  >
                    শুধু পাস
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCriteriaPreset('notice_default')}
                    className="px-2 py-1 rounded-md font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                  >
                    পাস + ১–২ ফেল
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCriteriaPreset('all')}
                    className="px-2 py-1 rounded-md font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                  >
                    সকল
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Tab 2 Exam & Grouping Controls */
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 dark:text-slate-400">পরীক্ষা:</span>
                  <select
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                    className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0B5D3B] cursor-pointer"
                  >
                    {examOptions.map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="inline-flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSplit910ByGroup(false)}
                    className={`h-8 px-3 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      !split910ByGroup
                        ? 'bg-white dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    শ্রেণিভিত্তিক শীর্ষ ৩
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplit910ByGroup(true)}
                    className={`h-8 px-3 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      split910ByGroup
                        ? 'bg-white dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    ৯ম–১০ম বিভাগভিত্তিক শীর্ষ ৩
                  </button>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>মেধা তালিকায় স্থান পেতে সকল বিষয়ে পাস বাধ্যতামূলক</span>
              </div>
            </div>
          )}

          {/* Row 3: Logical Print Layout Settings Bar (Shared across both tabs) */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                <Printer className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                প্রিন্ট সেটআপ:
              </span>

              {/* Standard A4 vs Pre-Printed School Pad */}
              <div className="inline-flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPrintMode('standard')}
                  className={`h-7 px-2.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                    printMode === 'standard'
                      ? 'bg-white dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  স্ট্যান্ডার্ড A4 (হেডারসহ)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintMode('preprinted_pad')}
                  className={`h-7 px-2.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                    printMode === 'preprinted_pad'
                      ? 'bg-white dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  প্রি-প্রিন্টেড প্যাড (ফাঁকা টপ)
                </button>
              </div>

              {/* Orientation */}
              <div className="inline-flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPrintOrientation('portrait')}
                  className={`h-7 px-2.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                    printOrientation === 'portrait'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setPrintOrientation('landscape')}
                  className={`h-7 px-2.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                    printOrientation === 'landscape'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Landscape
                </button>
              </div>
            </div>

            {/* Public Notice Board vs Internal Office Copy Toggle (Tab 1) */}
            {activeMainTab === 'class_rank' && (
              <button
                type="button"
                onClick={() => setOfficeCopyMode((v) => !v)}
                className={`h-7 px-2.5 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  officeCopyMode
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                {officeCopyMode ? (
                  <>
                    <Eye className="w-3.5 h-3.5" /> অফিস কপি (অকৃতকার্য বিষয় দৃশ্যমান)
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" /> নোটিশ বোর্ড মোড (সম্মানজনক ভিউ)
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ══ SCREEN-ONLY KPI SUMMARY STRIP (TAB 1) ══ */}
        {activeMainTab === 'class_rank' && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 print:hidden">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">মোট পরীক্ষার্থী</p>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {toBanglaDigits(summary.totalStudents)}
                </p>
              </div>
              <Users className="w-4 h-4 text-slate-400" />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">সকল বিষয়ে পাস</p>
                <p className="text-lg font-extrabold text-[#0B5D3B] dark:text-emerald-400 tabular-nums">
                  {toBanglaDigits(summary.passedCount)}{' '}
                  <span className="text-xs font-bold text-slate-400">({toBanglaDigits(summary.passRate)}%)</span>
                </p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">GPA 5.00 (A+)</p>
                <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                  {toBanglaDigits(summary.aPlusCount)}
                </p>
              </div>
              <Award className="w-4 h-4 text-amber-500" />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">বিশেষ বিবেচনা</p>
                <p className="text-lg font-extrabold text-violet-700 dark:text-violet-400 tabular-nums">
                  {toBanglaDigits(summary.consideredCount)}
                </p>
              </div>
              <Star className="w-4 h-4 text-violet-500" />
            </div>

            <div className="col-span-2 sm:col-span-1 bg-emerald-50/70 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-800/70 rounded-2xl px-3.5 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">তালিকায় প্রদর্শিত</p>
                <p className="text-lg font-extrabold text-[#0B5D3B] dark:text-emerald-300 tabular-nums">
                  {toBanglaDigits(summary.selectedCount)} জন
                </p>
              </div>
              <Trophy className="w-4 h-4 text-[#0B5D3B] dark:text-emerald-400" />
            </div>
          </div>
        )}

        {/* ══ SCREEN-ONLY SCHOOL CHAMPION SPOTLIGHT (TAB 2 — STRICTLY print:hidden) ══ */}
        {activeMainTab === 'school_champions' && (
          <div className="print:hidden">
            {championsData.schoolChampion ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-emerald-50/60 dark:from-amber-950/40 dark:via-slate-900 dark:to-emerald-950/30 border border-amber-200 dark:border-amber-800/60 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs shrink-0">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-200 bg-amber-200/80 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                      স্কুল ফার্স্ট · সর্ব-বিদ্যালয় সেরা মেধা
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {championsData.schoolChampion.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                      {championsData.schoolChampion.gradeBn} (
                      {championsData.schoolChampion.grade === '9th' ||
                      championsData.schoolChampion.grade === '10th'
                        ? championsData.schoolChampion.group
                        : `শাখা ${championsData.schoolChampion.section}`}
                      ) · রোল: <strong>{championsData.schoolChampion.roll}</strong> · প্রাপ্ত নম্বর:{' '}
                      <strong>
                        {championsData.schoolChampion.totalObtained}/{championsData.schoolChampion.totalFull}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-amber-200 dark:border-amber-800/60 shrink-0">
                  <div className="text-base font-extrabold text-[#0B5D3B] dark:text-emerald-400 tabular-nums">
                    GPA {championsData.schoolChampion.finalGPA.toFixed(2)} ({championsData.schoolChampion.overallGrade})
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                    শতকরা হার: {championsData.schoolChampion.obtainedPercentage}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  এই পরীক্ষায় সকল বিষয়ে উত্তীর্ণ কোনো শিক্ষার্থীর নম্বর এখনো এন্ট্রি হয়নি।
                </span>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* 🖨️ OFFICIAL PRINTABLE NOTICE BOARD / MERIT DOCUMENT SHEET             */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <article className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 print:bg-white print:text-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-7 space-y-4 print:p-0 print:border-0 print:rounded-none print:shadow-none print:space-y-3">
          {/* 1. Institutional Letterhead Banner (NOTE: intentionally <div>, not <header>, because globals.css hides <header> on @media print!) */}
          <div
            className={`border-b-2 border-slate-900 dark:border-slate-700 print:border-slate-950 pb-3 ${
              printMode === 'preprinted_pad' ? 'print:hidden' : ''
            }`}
          >
            <div className="flex items-center justify-center gap-3.5">
              {schoolSettings?.schoolLogo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={schoolSettings.schoolLogo}
                  alt="School Logo"
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0"
                />
              )}
              <div className="text-center space-y-0.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white print:text-slate-950 tracking-tight leading-tight">
                  {schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান'}
                </h1>
                {(schoolSettings?.address || schoolSettings?.eiin) && (
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 print:text-slate-800">
                    {[
                      schoolSettings?.address,
                      schoolSettings?.eiin ? `EIIN: ${schoolSettings.eiin}` : '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Document Title Banner & Compact Print Metadata Strip (Always visible on both Standard & Pre-Printed Pad!) */}
          <div className="text-center space-y-2">
            <div>
              <span className="inline-block px-4 py-1 rounded-lg bg-[#0B5D3B] print:bg-slate-950 text-white font-extrabold text-xs sm:text-sm tracking-wide">
                {selectedExam} — {printableListTitle}
              </span>
            </div>

            {activeMainTab === 'class_rank' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 print:bg-slate-50 border border-slate-200 dark:border-slate-800 print:border-slate-800 text-[11px] text-left">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">শ্রেণি ও শাখা/বিভাগ:</span>{' '}
                  <strong className="text-slate-900 dark:text-white print:text-slate-950">
                    {RANK_GRADE_BN_MAP[selectedGrade]} ({scopeDisplayBn})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">পরীক্ষার্থী ও পাস:</span>{' '}
                  <strong className="text-slate-900 dark:text-white print:text-slate-950 tabular-nums">
                    {toBanglaDigits(summary.totalStudents)} / {toBanglaDigits(summary.passedCount)} ({toBanglaDigits(summary.passRate)}%)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">GPA 5.00 (A+):</span>{' '}
                  <strong className="text-slate-900 dark:text-white print:text-slate-950 tabular-nums">
                    {toBanglaDigits(summary.aPlusCount)} জন · নির্বাচিত: {toBanglaDigits(summary.selectedCount)} জন
                  </strong>
                </div>
                <div className="sm:text-right">
                  <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">প্রকাশের তারিখ:</span>{' '}
                  <strong className="text-slate-900 dark:text-white print:text-slate-950">{todayBn}</strong>
                </div>
              </div>
            )}
          </div>

          {/* 3. PRINT-ONLY OFFICIAL SCHOOL CHAMPION HONOR BOX (Inside document below header — logically positioned!) */}
          {activeMainTab === 'school_champions' && championsData.schoolChampion && (
            <div className="hidden print:flex items-center justify-between gap-4 px-4 py-2.5 rounded-lg border-2 border-slate-900 bg-amber-50/70 break-inside-avoid rank-print-avoid-break">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  ★ সর্ব-বিদ্যালয় সেরা মেধা (স্কুল ফার্স্ট)
                </div>
                <div className="text-base font-extrabold text-slate-950">
                  {championsData.schoolChampion.name}
                </div>
                <div className="text-xs font-semibold text-slate-800">
                  {championsData.schoolChampion.gradeBn} (
                  {championsData.schoolChampion.grade === '9th' ||
                  championsData.schoolChampion.grade === '10th'
                    ? championsData.schoolChampion.group
                    : `শাখা ${championsData.schoolChampion.section}`}
                  ) · রোল: {championsData.schoolChampion.roll} · প্রাপ্ত নম্বর:{' '}
                  {championsData.schoolChampion.totalObtained}/{championsData.schoolChampion.totalFull}
                </div>
              </div>
              <div className="text-right shrink-0 border-l border-slate-400 pl-4">
                <div className="text-sm font-extrabold text-slate-950 tabular-nums">
                  GPA {championsData.schoolChampion.finalGPA.toFixed(2)} ({championsData.schoolChampion.overallGrade})
                </div>
                <div className="text-xs font-bold text-slate-800 tabular-nums">
                  শতকরা হার: {championsData.schoolChampion.obtainedPercentage}%
                </div>
              </div>
            </div>
          )}

          {/* 4. MASTER RANK TABLE */}
          {activeMainTab === 'school_champions' ? (
            /* ─── TAB 2 TABLE: ATOMIC CLASS/GROUP TOP 3 BUCKETS (ZERO SPLIT ROWSPAN ON PRINT!) ─── */
            <div className="overflow-x-auto print:overflow-visible">
              <table className="rank-print-table w-full text-left text-xs border-collapse border border-slate-300 dark:border-slate-700 print:border-slate-950">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200 text-slate-800 dark:text-slate-100 print:text-slate-950 font-extrabold text-[11px] border-b border-slate-300 dark:border-slate-700 print:border-slate-950">
                    <th className="px-2.5 py-2 border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-36">
                      শ্রেণি / বিভাগ
                    </th>
                    <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-20">
                      মেধা স্থান
                    </th>
                    <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-16">
                      রোল
                    </th>
                    <th className="px-2.5 py-2 border-r border-slate-300 dark:border-slate-700 print:border-slate-950">
                      শিক্ষার্থীর নাম
                    </th>
                    <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-24">
                      শাখা / বিভাগ
                    </th>
                    <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-24">
                      প্রাপ্ত নম্বর
                    </th>
                    <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-20">
                      শতকরা (%)
                    </th>
                    <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-16">
                      GPA
                    </th>
                    <th className="px-2 py-2 text-center w-14">গ্রেড</th>
                  </tr>
                </thead>

                {championsData.buckets.map((bucket) => (
                  <tbody
                    key={bucket.key}
                    className="border-b border-slate-300 dark:border-slate-700 print:border-slate-950 break-inside-avoid rank-print-avoid-break"
                  >
                    {bucket.winners.length === 0 ? (
                      <tr>
                        <td className="px-2.5 py-2 font-extrabold border-r border-slate-300 dark:border-slate-700 print:border-slate-950 bg-slate-50/80 dark:bg-slate-900/50 print:bg-slate-50">
                          {bucket.labelBn}
                        </td>
                        <td
                          colSpan={8}
                          className="px-2.5 py-2 text-center text-slate-400 dark:text-slate-500 print:text-slate-600 italic text-[11px]"
                        >
                          সকল বিষয়ে উত্তীর্ণ কোনো শিক্ষার্থী পাওয়া যায়নি
                        </td>
                      </tr>
                    ) : (
                      bucket.winners.map((st, idx) => (
                        <tr
                          key={`${bucket.key}_${st.id}`}
                          className={`border-b border-slate-200 dark:border-slate-800 print:border-slate-400 last:border-b-0 ${
                            idx === 0 ? 'bg-amber-50/35 dark:bg-amber-950/15 print:bg-amber-50/40' : ''
                          }`}
                        >
                          {idx === 0 && (
                            <td
                              rowSpan={bucket.winners.length}
                              className="px-2.5 py-2 font-extrabold border-r border-slate-300 dark:border-slate-700 print:border-slate-950 bg-slate-50/80 dark:bg-slate-900/50 print:bg-slate-50 align-top"
                            >
                              {bucket.labelBn}
                            </td>
                          )}
                          <td className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 print:border-slate-400 font-extrabold">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-extrabold ${
                                idx === 0
                                  ? 'bg-amber-300 text-slate-950'
                                  : idx === 1
                                    ? 'bg-slate-200 dark:bg-slate-700 print:bg-slate-200 text-slate-900 dark:text-white print:text-slate-950'
                                    : 'bg-orange-100 dark:bg-orange-950/60 print:bg-orange-100 text-orange-900 dark:text-orange-200 print:text-slate-950'
                              }`}
                            >
                              {idx === 0 ? '১ম মেধা' : idx === 1 ? '২য় মেধা' : '৩য় মেধা'}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center font-bold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                            {st.roll}
                          </td>
                          <td className="px-2.5 py-2 font-bold border-r border-slate-200 dark:border-slate-800 print:border-slate-400 text-slate-900 dark:text-white print:text-slate-950">
                            {st.name}
                          </td>
                          <td className="px-2 py-2 text-center text-[11px] font-semibold border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                            {st.grade === '9th' || st.grade === '10th' ? st.group : `শাখা ${st.section}`}
                          </td>
                          <td className="px-2 py-2 text-center font-bold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                            {st.totalObtained}/{st.totalFull}
                          </td>
                          <td className="px-2 py-2 text-center font-bold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                            {st.obtainedPercentage}%
                          </td>
                          <td className="px-2 py-2 text-center font-extrabold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400 bg-emerald-50/40 dark:bg-emerald-950/20 print:bg-slate-50">
                            {st.finalGPA.toFixed(2)}
                          </td>
                          <td className="px-2 py-2 text-center font-extrabold text-[#0B5D3B] dark:text-emerald-400 print:text-slate-950">
                            {st.overallGrade}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                ))}
              </table>
            </div>
          ) : (
            /* ─── TAB 1 TABLE: CLASS MERIT & PROMOTION LIST ─── */
            <div className="overflow-x-auto print:overflow-visible">
              <table className="rank-print-table w-full text-left text-xs border-collapse border border-slate-300 dark:border-slate-700 print:border-slate-950">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200 text-slate-800 dark:text-slate-100 print:text-slate-950 font-extrabold text-[11px] border-b border-slate-300 dark:border-slate-700 print:border-slate-950">
                    <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-12">
                      ক্রম
                    </th>
                    <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-20">
                      মেধা স্থান
                    </th>
                    <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-16">
                      রোল
                    </th>
                    <th className="px-2.5 py-2 border-r border-slate-300 dark:border-slate-700 print:border-slate-950">
                      শিক্ষার্থীর নাম
                    </th>
                    <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-24">
                      প্রাপ্ত নম্বর
                    </th>
                    {isClass9or10 ? (
                      <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-20">
                        GPA (৪র্থ ছাড়া)
                      </th>
                    ) : (
                      <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-20">
                        শতকরা (%)
                      </th>
                    )}
                    <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-20 bg-emerald-50/70 dark:bg-emerald-950/30 print:bg-slate-200">
                      চূড়ান্ত GPA
                    </th>
                    <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-14">
                      গ্রেড
                    </th>
                    <th
                      className={`px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-slate-950 w-32 ${
                        !officeCopyMode ? 'print:border-r-0' : ''
                      }`}
                    >
                      ফলাফল / মন্তব্য
                    </th>
                    {officeCopyMode && (
                      <th className="px-2 py-2 text-left border-r border-slate-300 dark:border-slate-700 print:border-r-0 w-44">
                        অকৃতকার্য বিষয়সমূহ
                      </th>
                    )}
                    <th className="px-2 py-2 text-center w-24 print:hidden">বিবেচনা</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-slate-400">
                  {displayedList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={officeCopyMode ? 11 : 10}
                        className="p-10 text-center space-y-2"
                      >
                        <div className="w-10 h-10 mx-auto rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
                          <UserX className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          বর্তমান ফিল্টারে কোনো শিক্ষার্থী পাওয়া যায়নি।
                        </p>
                      </td>
                    </tr>
                  ) : (
                    displayedList.map((st, idx) => (
                      <tr
                        key={st.id}
                        className={`transition-colors ${
                          st.hasFailed
                            ? 'bg-amber-50/35 dark:bg-amber-950/15 print:bg-slate-50/60'
                            : idx % 2 === 1
                              ? 'bg-slate-50/45 dark:bg-slate-900/40 print:bg-slate-50/35'
                              : ''
                        }`}
                      >
                        <td className="px-2 py-1.5 text-center font-bold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400 text-slate-600 dark:text-slate-300 print:text-slate-900">
                          {toBanglaDigits(st.listOrder)}
                        </td>

                        <td className="px-2 py-1.5 text-center font-extrabold border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                          {st.meritPosition !== null ? (
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-extrabold ${
                                st.meritPosition === 1
                                  ? 'bg-amber-300 text-slate-950'
                                  : st.meritPosition === 2
                                    ? 'bg-slate-200 dark:bg-slate-700 print:bg-slate-200 text-slate-900 dark:text-white print:text-slate-950'
                                    : st.meritPosition === 3
                                      ? 'bg-orange-100 dark:bg-orange-950/60 print:bg-orange-100 text-orange-900 dark:text-orange-200 print:text-slate-950'
                                      : 'text-[#0B5D3B] dark:text-emerald-300 print:text-slate-950'
                              }`}
                            >
                              {formatBanglaOrdinal(st.meritPosition)}
                            </span>
                          ) : (
                            <span className="text-slate-400 print:text-slate-600">—</span>
                          )}
                        </td>

                        <td className="px-2 py-1.5 text-center font-extrabold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                          {st.roll}
                        </td>

                        <td className="px-2.5 py-1.5 font-bold border-r border-slate-200 dark:border-slate-800 print:border-slate-400 text-slate-900 dark:text-white print:text-slate-950">
                          {st.name}
                        </td>

                        <td className="px-2 py-1.5 text-center font-bold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                          {st.totalFull > 0 ? `${st.totalObtained}/${st.totalFull}` : st.totalObtained}
                        </td>

                        {isClass9or10 ? (
                          <td className="px-2 py-1.5 text-center font-bold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                            {st.hasFailed ? '0.00' : st.gpaWithout4th.toFixed(2)}
                          </td>
                        ) : (
                          <td className="px-2 py-1.5 text-center font-bold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                            {st.obtainedPercentage}%
                          </td>
                        )}

                        <td className="px-2 py-1.5 text-center font-extrabold tabular-nums border-r border-slate-200 dark:border-slate-800 print:border-slate-400 bg-emerald-50/35 dark:bg-emerald-950/20 print:bg-slate-50 text-slate-950 dark:text-white print:text-slate-950">
                          {st.hasFailed ? '0.00' : st.finalGPA.toFixed(2)}
                        </td>

                        <td className="px-2 py-1.5 text-center font-extrabold border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                          <span
                            className={
                              st.overallGrade === 'F'
                                ? 'text-amber-700 dark:text-amber-400 print:text-slate-800'
                                : 'text-[#0B5D3B] dark:text-emerald-400 print:text-slate-950'
                            }
                          >
                            {st.overallGrade}
                          </span>
                        </td>

                        <td
                          className={`px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 print:border-slate-400 ${
                            !officeCopyMode ? 'print:border-r-0' : ''
                          }`}
                        >
                          {st.hasFailed ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-amber-900 dark:text-amber-200 print:text-slate-900 bg-amber-100/80 dark:bg-amber-950/60 print:bg-transparent border border-amber-300/80 dark:border-amber-800 print:border-slate-500">
                              বিশেষ বিবেচনা
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-emerald-800 dark:text-emerald-300 print:text-slate-950 bg-emerald-50 dark:bg-emerald-950/50 print:bg-transparent border border-emerald-200 dark:border-emerald-800 print:border-slate-500">
                              উত্তীর্ণ
                            </span>
                          )}
                        </td>

                        {officeCopyMode && (
                          <td className="px-2 py-1.5 text-[11px] font-medium border-r border-slate-200 dark:border-slate-800 print:border-r-0 text-rose-700 dark:text-rose-300 print:text-slate-900">
                            {st.hasFailed
                              ? st.failedSubjects.length > 0
                                ? `${toBanglaDigits(st.failedCount)}টি: ${st.failedSubjects.join(', ')}`
                                : 'নম্বর অসম্পূর্ণ'
                              : '—'}
                          </td>
                        )}

                        <td className="px-2 py-1.5 text-center print:hidden">
                          {st.hasFailed && (
                            <button
                              type="button"
                              onClick={() => handleToggleSpecialConsideration(st.id)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition inline-flex items-center justify-center gap-1 cursor-pointer border ${
                                st.isConsidered
                                  ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                              }`}
                            >
                              <Star className={`w-3 h-3 ${st.isConsidered ? 'fill-slate-950' : ''}`} />
                              {st.isConsidered ? 'অনুমোদিত' : 'অনুমোদন'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 5. OFFICIAL SIGNATURE & PUBLICATION FOOTER (ATOMIC break-inside-avoid!) */}
          <footer className="hidden print:block pt-10 break-inside-avoid rank-print-avoid-break">
            <div className="grid grid-cols-3 gap-8 text-center text-xs font-bold text-slate-950">
              <div>
                <div className="w-40 border-b border-slate-900 mx-auto" />
                <p className="mt-1.5">শ্রেণি শিক্ষকের স্বাক্ষর</p>
              </div>
              <div>
                <div className="w-40 border-b border-slate-900 mx-auto" />
                <p className="mt-1.5">পরীক্ষা নিয়ন্ত্রক</p>
              </div>
              <div>
                <div className="w-40 border-b border-slate-900 mx-auto" />
                <p className="mt-1.5 font-extrabold">
                  {schoolSettings?.principalName || schoolSettings?.principalTitle || 'প্রধান শিক্ষক'}
                </p>
                {schoolSettings?.principalName && (
                  <p className="text-[10px] font-semibold text-slate-700">
                    {schoolSettings?.principalTitle || 'প্রধান শিক্ষক'}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 pt-1.5 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-600">
              <span>{schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান'} · {selectedExam}</span>
              <span>প্রকাশের তারিখ: {todayBn}</span>
            </div>
          </footer>
        </article>
      </div>

      {/* ─── BLANK SCHOOL PAD MODAL (ISOLATED VIA .print-modal-active!) ─── */}
      {showBlankPadModal && (
        <div className="print-modal-active fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 print:shadow-none print:border-none print:p-0 print:rounded-none max-h-[95vh] overflow-y-auto print:max-h-none print:overflow-visible">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 print:hidden">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Printer className="text-[#0B5D3B] dark:text-emerald-400 w-4 h-4" />
                ফাঁকা স্কুল প্যাড প্রিন্ট প্রিভিউ
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-9 px-4 bg-[#0B5D3B] hover:bg-[#094a2f] text-white font-bold text-xs rounded-xl shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> প্রিন্ট করুন (A4)
                </button>
                <button
                  type="button"
                  onClick={() => setShowBlankPadModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="py-1 print:py-0">
              <SchoolPadWrapper
                settings={schoolSettings || undefined}
                mode="blank_pad"
                title=""
                hideHeaderActions={true}
                signatures={[
                  {
                    title: schoolSettings?.principalName || 'প্রধান শিক্ষক',
                    designation: schoolSettings?.principalTitle || 'প্রধান শিক্ষক',
                    institution: schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান',
                    address: schoolSettings?.address || '',
                    rightAligned: true,
                  },
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
