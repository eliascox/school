'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Crown,
  FileSpreadsheet,
  FileText,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Printer,
  SlidersHorizontal,
  X,
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
  PopulatedScopeSummary,
  RANK_GRADE_BN_MAP,
  RANK_GRADE_SHORT_BN,
  RANK_GRADE_SHORT_EN,
  RankColumnConfig,
  RankDocLang,
  RankPresetMode,
  RankSortMode,
  RankStudentBase,
  RankTieBreakerMode,
  RankTopNLimit,
  buildChampionsExcelRows,
  buildClassRankExcelRows,
  buildCriteriaForPreset,
  buildStudentRankDedupKey,
  computeSchoolChampions,
  getRankGroupEn,
  normalizeRankGrade,
  normalizeRankGroupAndSection,
  rankAndFilterClassStudents,
  summarizeAvailableScopes,
} from '@/lib/rankResultUtils';
import {
  RankGradeId,
  RankGroupBn,
  RankMainTab,
  RankPrintOrientation,
  RankPrintPaperMode,
  RankResultControlRail,
} from '@/components/exam/RankResultControlRail';
import { RankResultDocumentSheet } from '@/components/exam/RankResultDocumentSheet';
import SchoolPadWrapper from '@/components/SchoolPadWrapper';
import { showToast } from '@/components/ui/ToastProvider';

const DEFAULT_FALLBACK_EXAMS = [
  'অর্ধ-বার্ষিক পরীক্ষা ২০২৬',
  'বার্ষিক পরীক্ষা ২০২৬',
  'এসএসসি প্রাক-নির্বাচনী পরীক্ষা ২০২৬',
  'এসএসসি নির্বাচনী (টেস্ট) পরীক্ষা ২০২৬',
];

export default function FreshRankBasedResultPage() {
  const [mounted, setMounted] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<RankMainTab>('class_rank');
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>(DEFAULT_FALLBACK_EXAMS[0]);
  const [selectedGrade, setSelectedGrade] = useState<RankGradeId>('8th');
  const [selectedBranch, setSelectedBranch] = useState<string>('A');
  const [selectedGroup, setSelectedGroup] = useState<RankGroupBn>('সাধারণ');
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [studentVersion, setStudentVersion] = useState(0);

  // Fast Studio Controls (Left Control Rail)
  const [showLeftRail, setShowLeftRail] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [criteria, setCriteria] = useState<CombinedRankCriteria>(() =>
    buildCriteriaForPreset('notice_default'),
  );
  const [topN, setTopN] = useState<RankTopNLimit>('all');
  const [sortMode, setSortMode] = useState<RankSortMode>('merit');
  const [tieBreaker, setTieBreaker] = useState<RankTieBreakerMode>('gpa_first');
  const [docLang, setDocLang] = useState<RankDocLang>('bn');
  const [columns, setColumns] = useState<RankColumnConfig>({
    showMarks: true,
    showSecondaryMetric: true,
  });

  // Logical Print Controls
  const [printMode, setPrintMode] = useState<RankPrintPaperMode>('standard');
  const [printOrientation, setPrintOrientation] = useState<RankPrintOrientation>('portrait');
  const [officeCopyMode, setOfficeCopyMode] = useState<boolean>(false);
  const [split910ByGroup, setSplit910ByGroup] = useState<boolean>(false);

  // Special Consideration & Blank Pad Modal
  const [specialConsideredIds, setSpecialConsideredIds] = useState<string[]>([]);
  const [showBlankPadModal, setShowBlankPadModal] = useState<boolean>(false);
  const autoPickedScopeRef = useRef(false);

  // Boot live settings, exams & students subscriptions
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
    const unsubSettings = settingsService.subscribe((updated) => {
      setSchoolSettings(updated);
    });
    const unsubStudents = studentService.subscribe(() => {
      setStudentVersion((v) => v + 1);
    });
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'sms_school_settings') {
        setSchoolSettings(settingsService.getSettings());
      }
      if (!e.key || e.key === 'sms_students' || e.key === 'sms_uploaded_students') {
        setStudentVersion((v) => v + 1);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubExams();
      unsubSettings();
      unsubStudents();
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
    const combinedRaw = studentService.getAllStudents() as unknown as Array<Record<string, unknown>>;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, studentVersion]);

  const scopeSummary = useMemo(
    () => summarizeAvailableScopes(allCentralStudents),
    [allCentralStudents],
  );

  // Smart First-Open Scope Auto-Select: if default 8th-A is empty but another class has students, jump directly to it
  useEffect(() => {
    if (!mounted || autoPickedScopeRef.current || scopeSummary.populatedScopes.length === 0) return;
    const hasCurrent = allCentralStudents.some((st) => {
      if (st.grade !== selectedGrade) return false;
      return isClass9or10
        ? st.group === selectedGroup
        : st.section.toLowerCase() === selectedBranch.toLowerCase();
    });
    autoPickedScopeRef.current = true;
    if (!hasCurrent) {
      const first = scopeSummary.populatedScopes[0];
      setSelectedGrade(first.grade);
      setSelectedBranch(first.section);
      setSelectedGroup(first.group);
    }
  }, [mounted, allCentralStudents, scopeSummary.populatedScopes, selectedGrade, selectedBranch, selectedGroup, isClass9or10]);

  const consideredIdSet = useMemo(
    () => new Set(specialConsideredIds),
    [specialConsideredIds],
  );

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

  // Tab 1: Evaluate ONLY students in the active Class + Section/Group
  const currentClassStudents = useMemo(() => {
    const scoped = allCentralStudents.filter((st) => {
      if (st.grade !== selectedGrade) return false;
      if (isClass9or10) return st.group === selectedGroup;
      return st.section.toLowerCase() === selectedBranch.toLowerCase();
    });
    return scoped.map(evaluateRankStudent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCentralStudents, selectedExam, selectedGrade, selectedBranch, selectedGroup, isClass9or10, consideredIdSet]);

  // Tab 2: Lazily evaluate all-school students ONLY when Champions tab is active
  const championsData = useMemo(() => {
    if (activeMainTab !== 'school_champions') {
      return { schoolChampion: null, allSchoolPassed: [], buckets: [] };
    }
    const allEvaluated = allCentralStudents.map(evaluateRankStudent);
    return computeSchoolChampions(allEvaluated, split910ByGroup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMainTab, allCentralStudents, selectedExam, split910ByGroup, consideredIdSet]);

  const { displayedList, summary } = useMemo(
    () =>
      rankAndFilterClassStudents(currentClassStudents, criteria, searchQuery, {
        sortMode,
        tieBreaker,
        topN,
      }),
    [currentClassStudents, criteria, searchQuery, sortMode, tieBreaker, topN],
  );

  const handleSelectGrade = (nextGrade: RankGradeId) => {
    setSelectedGrade(nextGrade);
    if (nextGrade === '9th' || nextGrade === '10th') {
      setSelectedBranch('Science');
      setSelectedGroup('বিজ্ঞান');
    } else {
      setSelectedBranch('A');
      setSelectedGroup('সাধারণ');
    }
  };

  const handleSelectGroup = (grp: RankGroupBn) => {
    setSelectedGroup(grp);
    setSelectedBranch(
      grp === 'বিজ্ঞান' ? 'Science' : grp === 'মানবিক' ? 'Humanities' : grp === 'ব্যবসায় শিক্ষা' ? 'Commerce' : 'A',
    );
  };

  const handleSelectBranch = (branch: string) => {
    setSelectedBranch(branch);
    setSelectedGroup('সাধারণ');
  };

  const handleJumpToScope = (sc: PopulatedScopeSummary) => {
    setSelectedGrade(sc.grade);
    setSelectedBranch(sc.section);
    setSelectedGroup(sc.group);
  };

  const handleApplyPreset = (preset: Exclude<RankPresetMode, 'custom'>) => {
    setCriteria(buildCriteriaForPreset(preset));
  };

  const handleResetFilters = () => {
    setCriteria(buildCriteriaForPreset('all'));
    setTopN('all');
    setSearchQuery('');
  };

  const printableListTitle = useMemo(() => {
    const isEn = docLang === 'en';
    const gradeShort = isEn
      ? RANK_GRADE_SHORT_EN[selectedGrade] || selectedGrade
      : RANK_GRADE_SHORT_BN[selectedGrade] || selectedGrade;
    const scopeLabel = isEn
      ? isClass9or10
        ? getRankGroupEn(selectedGroup)
        : `Section ${selectedBranch}`
      : isClass9or10
        ? `${selectedGroup} বিভাগ`
        : `শাখা: ${selectedBranch}`;

    if (activeMainTab === 'school_champions') {
      if (isEn) {
        return split910ByGroup
          ? 'School Champion & Class/Group-Wise Top 3 Merit List'
          : 'Overall School Champion & Class-Wise Top 3 Merit List';
      }
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
    const onlyFail =
      !criteria.includePass &&
      (criteria.includeFail1 || criteria.includeFail2 || criteria.includeFail3 || criteria.includeFail4Plus);
    const topSuffix =
      topN !== 'all' ? (isEn ? ` · Top ${topN}` : ` · শীর্ষ ${toBanglaDigits(topN)}`) : '';

    const baseTitle = isEn
      ? onlyPass
        ? `Class Merit List (${gradeShort} — ${scopeLabel}${topSuffix})`
        : onlyFail
          ? `Unsuccessful Students List (${gradeShort} — ${scopeLabel})`
          : `Combined Result & Merit List (${gradeShort} — ${scopeLabel}${topSuffix})`
      : onlyPass
        ? `শ্রেণিভিত্তিক মেধা তালিকা (${gradeShort} শ্রেণি — ${scopeLabel}${topSuffix})`
        : onlyFail
          ? `অকৃতকার্য শিক্ষার্থীর তালিকা (${gradeShort} শ্রেণি — ${scopeLabel})`
          : `সম্মিলিত ফলাফল ও মেধা তালিকা (${gradeShort} শ্রেণি — ${scopeLabel}${topSuffix})`;

    return officeCopyMode ? `${baseTitle} ${isEn ? '[Office Copy]' : '[অফিস কপি]'}` : baseTitle;
  }, [activeMainTab, docLang, split910ByGroup, selectedGrade, selectedGroup, selectedBranch, isClass9or10, criteria, topN, officeCopyMode]);

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      if (activeMainTab === 'school_champions') {
        const rows = buildChampionsExcelRows(championsData.buckets, docLang);
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
          lang: docLang,
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

  return (
    <div className="min-h-full bg-slate-50/70 dark:bg-slate-950 print:bg-white">
      <style>{dynamicPrintCss}</style>

      {/* ─── SLIM STICKY WORKSPACE ACTION BAR (h-12, print:hidden) ─── */}
      <div className="sticky top-0 z-30 h-13 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-5 flex items-center justify-between gap-2 print:hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {/* Desktop Rail Toggle */}
          <button
            type="button"
            onClick={() => setShowLeftRail((v) => !v)}
            className="hidden lg:inline-flex h-8.5 w-8.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 items-center justify-center transition cursor-pointer shrink-0"
            title={showLeftRail ? 'বাম কন্ট্রোল প্যানেল লুকান' : 'বাম কন্ট্রোল প্যানেল দেখান'}
            aria-label={showLeftRail ? 'বাম কন্ট্রোল প্যানেল লুকান' : 'বাম কন্ট্রোল প্যানেল দেখান'}
          >
            {showLeftRail ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          {/* Mobile Filter Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="inline-flex lg:hidden h-8.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 text-xs font-bold items-center gap-1.5 cursor-pointer shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#0B5D3B]" />
            <span>ফিল্টার</span>
          </button>

          {/* Segmented Main Tabs */}
          <button
            type="button"
            onClick={() => setActiveMainTab('class_rank')}
            className={`h-8.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap inline-flex items-center gap-1.5 transition-all cursor-pointer ${
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
            className={`h-8.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMainTab === 'school_champions'
                ? 'bg-[#0B5D3B] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5 shrink-0" />
            <span>স্কুল ফার্স্ট ও শীর্ষ ৩</span>
          </button>
        </div>

        {/* Right Quick Export & Print Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleExportExcel}
            className="hidden sm:inline-flex h-8.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBlankPadModal(true)}
            className="hidden md:inline-flex h-8.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>ফাঁকা প্যাড</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="h-8.5 px-3.5 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট / PDF</span>
          </button>
        </div>
      </div>

      {/* ─── SPLIT-PANE STUDIO WORKSPACE (LEFT RAIL + RIGHT A4 SHEET) ─── */}
      <div className="p-3 sm:p-4 max-w-[1440px] mx-auto w-full overflow-x-clip print:p-0 print:max-w-none print:overflow-visible print-hide-when-modal">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-4 print:block">
          {/* Left Sticky Control Rail (Desktop) */}
          {showLeftRail && (
            <div className="hidden lg:block lg:sticky lg:top-[64px] max-h-[calc(100vh-80px)] overflow-y-auto no-scrollbar print:hidden">
              <RankResultControlRail
                activeMainTab={activeMainTab}
                examOptions={examOptions}
                selectedExam={selectedExam}
                onSelectExam={setSelectedExam}
                selectedGrade={selectedGrade}
                onSelectGrade={handleSelectGrade}
                selectedBranch={selectedBranch}
                onSelectBranch={handleSelectBranch}
                selectedGroup={selectedGroup}
                onSelectGroup={handleSelectGroup}
                gradeStudentCounts={scopeSummary.byGrade}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                criteria={criteria}
                onToggleCriteria={(k) => setCriteria((prev) => ({ ...prev, [k]: !prev[k] }))}
                onApplyPreset={handleApplyPreset}
                topN={topN}
                onTopNChange={setTopN}
                sortMode={sortMode}
                onSortModeChange={setSortMode}
                tieBreaker={tieBreaker}
                onTieBreakerChange={setTieBreaker}
                docLang={docLang}
                onDocLangChange={setDocLang}
                printMode={printMode}
                onPrintModeChange={setPrintMode}
                printOrientation={printOrientation}
                onPrintOrientationChange={setPrintOrientation}
                officeCopyMode={officeCopyMode}
                onToggleOfficeCopy={() => setOfficeCopyMode((v) => !v)}
                columns={columns}
                onToggleColumn={(k) => setColumns((prev) => ({ ...prev, [k]: !prev[k] }))}
                split910ByGroup={split910ByGroup}
                onSplit910Change={setSplit910ByGroup}
                summary={summary}
                schoolChampion={championsData.schoolChampion}
              />
            </div>
          )}

          {/* Right Live Printable A4 Merit Document Canvas */}
          <RankResultDocumentSheet
            activeMainTab={activeMainTab}
            docLang={docLang}
            printMode={printMode}
            schoolSettings={schoolSettings}
            selectedExam={selectedExam}
            selectedGrade={selectedGrade}
            selectedBranch={selectedBranch}
            selectedGroup={selectedGroup}
            isClass9or10={isClass9or10}
            officeCopyMode={officeCopyMode}
            columns={columns}
            printableListTitle={printableListTitle}
            displayedList={displayedList}
            totalClassStudents={currentClassStudents.length}
            summary={summary}
            championsData={championsData}
            populatedScopes={scopeSummary.populatedScopes}
            onJumpToScope={handleJumpToScope}
            onResetFilters={handleResetFilters}
            onToggleSpecialConsideration={handleToggleSpecialConsideration}
          />
        </div>
      </div>

      {/* ─── MOBILE SLIDE-OVER FILTER DRAWER ─── */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-slate-950/60 backdrop-blur-xs flex print:hidden">
          <div className="w-[310px] max-w-[88vw] bg-slate-50 dark:bg-slate-950 h-full overflow-y-auto p-3.5 shadow-2xl border-r border-slate-200 dark:border-slate-800">
            <RankResultControlRail
              activeMainTab={activeMainTab}
              examOptions={examOptions}
              selectedExam={selectedExam}
              onSelectExam={setSelectedExam}
              selectedGrade={selectedGrade}
              onSelectGrade={handleSelectGrade}
              selectedBranch={selectedBranch}
              onSelectBranch={handleSelectBranch}
              selectedGroup={selectedGroup}
              onSelectGroup={handleSelectGroup}
              gradeStudentCounts={scopeSummary.byGrade}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              criteria={criteria}
              onToggleCriteria={(k) => setCriteria((prev) => ({ ...prev, [k]: !prev[k] }))}
              onApplyPreset={handleApplyPreset}
              topN={topN}
              onTopNChange={setTopN}
              sortMode={sortMode}
              onSortModeChange={setSortMode}
              tieBreaker={tieBreaker}
              onTieBreakerChange={setTieBreaker}
              docLang={docLang}
              onDocLangChange={setDocLang}
              printMode={printMode}
              onPrintModeChange={setPrintMode}
              printOrientation={printOrientation}
              onPrintOrientationChange={setPrintOrientation}
              officeCopyMode={officeCopyMode}
              onToggleOfficeCopy={() => setOfficeCopyMode((v) => !v)}
              columns={columns}
              onToggleColumn={(k) => setColumns((prev) => ({ ...prev, [k]: !prev[k] }))}
              split910ByGroup={split910ByGroup}
              onSplit910Change={setSplit910ByGroup}
              summary={summary}
              schoolChampion={championsData.schoolChampion}
              onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
            />
          </div>
          <button
            type="button"
            className="flex-1"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="ওভারলে বন্ধ করুন"
          />
        </div>
      )}

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
