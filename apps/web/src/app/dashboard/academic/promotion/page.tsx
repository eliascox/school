'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Users,
  CheckSquare,
  Square,
  History,
  ShieldCheck,
  Award,
  CheckCheck,
  Search,
  X,
  Lock,
  AlertTriangle,
  ListOrdered,
  SlidersHorizontal,
} from 'lucide-react';
import { studentService } from '@/services/studentService';
import { examService, ExamItem } from '@/services/examService';
import { alumniService } from '@/services/alumniService';
import { auditTrailService } from '@/services/auditTrailService';
import { generateStudentMarksheetData } from '@/components/OfficialMarksheetSheet';
import { toBanglaDigits } from '@/lib/resultPortalUtils';
import {
  PROMOTION_STEPS,
  getPromotionStep,
  computePromotionCounts,
  computeNewRollPreviewMap,
  filterPromotionStudents,
  PromotionGradeKey,
  PromotionRollMode,
  PromotionStatusFilter,
  StudentPromotionItem,
} from '@/lib/promotionUtils';

interface PromotionLog {
  id: string;
  timestamp: string;
  fromGrade: string;
  fromGradeKey?: string;
  toGrade: string;
  count: number;
  session: string;
  group?: string;
  rollMode?: PromotionRollMode;
  promotedIds?: string[];
}

const DEFAULT_EXAM_OPTIONS = [
  'বার্ষিক পরীক্ষা ২০২৬',
  'অর্ধ-বার্ষিক পরীক্ষা ২০২৬',
  'এসএসসি প্রাক-নির্বাচনী ২০২৬',
  '১ম টিউটোরিয়াল পরীক্ষা ২০২৬',
];

export default function StudentPromotionPage() {
  const [mounted, setMounted] = useState(false);
  const [fromGrade, setFromGrade] = useState<PromotionGradeKey>('6th');
  const [targetSession, setTargetSession] = useState<string>('২০২৭');
  const [targetGroup, setTargetGroup] = useState<string>('বিজ্ঞান');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [selectedExam, setSelectedExam] = useState<string>('বার্ষিক পরীক্ষা ২০২৬');
  const [availableExams, setAvailableExams] = useState<ExamItem[]>([]);

  // Inline table filters & roll policy
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<PromotionStatusFilter>('all');
  const [rollMode, setRollMode] = useState<PromotionRollMode>('keep');

  // Data & confirmation modal state
  const [students, setStudents] = useState<StudentPromotionItem[]>([]);
  const [promotionLogs, setPromotionLogs] = useState<PromotionLog[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentStep = getPromotionStep(fromGrade);
  const toGrade = currentStep.toLabelBn;
  const targetGradeKey = currentStep.toKey;

  const loadStudents = useCallback((grade: PromotionGradeKey, examName: string) => {
    const rawStudents = studentService.getStudentsByFilter(grade);

    // Load promotion history to prevent double-promotion
    let promotionHistory: PromotionLog[] = [];
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sms_promotion_history');
        if (saved) promotionHistory = JSON.parse(saved);
      } catch {
        promotionHistory = [];
      }
    }

    const gradeBnShort =
      grade === '6th' ? '৬ষ্ঠ' : grade === '7th' ? '৭ম' : grade === '8th' ? '৮ম' : grade === '9th' ? '৯ম' : '১০ম';

    const mapped: StudentPromotionItem[] = rawStudents.map((st, idx) => {
      const alreadyPromoted = promotionHistory.some(
        (log) => log.promotedIds && log.promotedIds.includes(st.id) && log.fromGradeKey === grade
      );

      const studentProfile = {
        id: st.id,
        roll: st.roll || String(idx + 1).padStart(2, '0'),
        name: st.name,
        grade: st.grade || grade,
        gradeBn: gradeBnShort,
        section: st.section || st.branch || 'A',
        group: st.group || 'সাধারণ',
        fatherName: st.fatherName || '',
        motherName: st.motherName || '',
        session: st.session || '২০২৬',
        optionalSubject: st.optionalSubject || '',
      };

      const result = generateStudentMarksheetData(studentProfile, {
        selectedExam: examName,
        selectedGrade: st.grade || grade,
        selectedBranch: st.section || st.branch || 'A',
      });

      const hasMarks = Boolean(
        result && result.subjects && result.subjects.some((s: { hasEnteredMarks?: boolean }) => s.hasEnteredMarks)
      );

      let gpa = '';
      let letterGrade = '';
      let status: 'Pass' | 'Fail' | 'Pending' = 'Pending';
      let failedCount = 0;
      let totalObtained = 0;

      if (hasMarks && result) {
        totalObtained = result.totalObtained || 0;
        failedCount = result.hasFailed
          ? result.subjects.filter((s: { letterGrade?: string }) => s.letterGrade === 'F').length || 1
          : 0;

        if (result.hasFailed) {
          status = 'Fail';
          gpa = result.finalGPA > 0 ? result.finalGPA.toFixed(2) : '0.00';
          letterGrade = 'F';
        } else {
          status = 'Pass';
          gpa = result.finalGPA.toFixed(2);
          letterGrade = result.overallGrade || 'A';
        }
      } else if (st.gpa && !Number.isNaN(parseFloat(st.gpa)) && parseFloat(st.gpa) > 0) {
        const pGpa = parseFloat(st.gpa);
        gpa = pGpa.toFixed(2);
        status = pGpa >= 1.0 ? 'Pass' : 'Fail';
        letterGrade =
          pGpa >= 5.0
            ? 'A+'
            : pGpa >= 4.0
            ? 'A'
            : pGpa >= 3.5
            ? 'A-'
            : pGpa >= 3.0
            ? 'B'
            : pGpa >= 2.0
            ? 'C'
            : pGpa >= 1.0
            ? 'D'
            : 'F';
      } else {
        gpa = '--';
        status = 'Pending';
        letterGrade = '-';
      }

      // Default selection: Passed or Pending students selected (never auto-select Failed or alreadyPromoted)
      const selected = !alreadyPromoted && status !== 'Fail';

      return {
        id: st.id,
        roll: st.roll || String(idx + 1).padStart(2, '0'),
        name: st.name,
        grade: st.grade || grade,
        section: st.section || st.branch || 'A',
        group: st.group || 'সাধারণ',
        gpa,
        letterGrade,
        status,
        hasMarks,
        failedCount,
        totalObtained,
        selected,
        alreadyPromoted,
      };
    });

    setStudents(mapped);
  }, []);

  const loadLogs = useCallback(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sms_promotion_history');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setPromotionLogs(parsed);
        } catch {
          setPromotionLogs([]);
        }
      }
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    setAvailableExams(examService.getExams());
    loadStudents('6th', 'বার্ষিক পরীক্ষা ২০২৬');
    loadLogs();
  }, [loadStudents, loadLogs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = () => {
      loadStudents(fromGrade, selectedExam);
      loadLogs();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [fromGrade, selectedExam, loadStudents, loadLogs]);

  // Close confirmation modal on Escape key
  useEffect(() => {
    if (!showConfirmModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowConfirmModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showConfirmModal]);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 6000);
  };

  const handleGradeChange = (grade: PromotionGradeKey) => {
    setFromGrade(grade);
    setGroupFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    loadStudents(grade, selectedExam);
  };

  const handleExamChange = (newExam: string) => {
    setSelectedExam(newExam);
    loadStudents(fromGrade, newExam);
  };

  // Apply group filter first (for Class 9/10) so counts reflect current working group scope
  const groupScopedStudents = useMemo(
    () =>
      filterPromotionStudents(students, {
        groupFilter: fromGrade === '9th' || fromGrade === '10th' ? groupFilter : 'all',
      }),
    [students, fromGrade, groupFilter]
  );

  const visibleStudents = useMemo(
    () =>
      filterPromotionStudents(groupScopedStudents, {
        statusFilter,
        query: searchQuery,
      }),
    [groupScopedStudents, statusFilter, searchQuery]
  );

  const counts = useMemo(() => computePromotionCounts(groupScopedStudents), [groupScopedStudents]);

  const newRollPreviewMap = useMemo(
    () => computeNewRollPreviewMap(groupScopedStudents, rollMode, targetGradeKey),
    [groupScopedStudents, rollMode, targetGradeKey]
  );

  const visibleIdsSet = useMemo(() => new Set(visibleStudents.map((s) => s.id)), [visibleStudents]);

  const handleToggleSelectAllVisible = (checked: boolean) => {
    setStudents((prev) =>
      prev.map((s) =>
        !s.alreadyPromoted && visibleIdsSet.has(s.id) ? { ...s, selected: checked } : s
      )
    );
  };

  const handleSelectPassedOnly = () => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.alreadyPromoted || !visibleIdsSet.has(s.id)) return s;
        return { ...s, selected: s.status === 'Pass' };
      })
    );
  };

  const handleToggleStudent = (id: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id && !s.alreadyPromoted ? { ...s, selected: !s.selected } : s))
    );
  };

  const selectedPromotableStudents = useMemo(
    () => groupScopedStudents.filter((s) => s.selected && !s.alreadyPromoted),
    [groupScopedStudents]
  );

  const handleOpenConfirmation = () => {
    if (selectedPromotableStudents.length === 0) {
      showAlert('error', 'অনুগ্রহ করে অন্তত একজন শিক্ষার্থী নির্বাচন করুন!');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmExecutePromotion = () => {
    const selectedIds = selectedPromotableStudents.map((s) => s.id);
    if (selectedIds.length === 0) {
      setShowConfirmModal(false);
      return showAlert('error', 'অনুগ্রহ করে অন্তত একজন শিক্ষার্থী নির্বাচন করুন!');
    }

    const graduatingStudents =
      targetGradeKey === 'Alumni'
        ? studentService.getAllStudents().filter((s) => selectedIds.includes(s.id))
        : [];

    const groupOverride = targetGradeKey === '9th' ? targetGroup : undefined;
    const rollOverrides =
      rollMode === 'merit' && targetGradeKey !== 'Alumni' ? newRollPreviewMap : undefined;

    const res = studentService.promoteStudents(
      selectedIds,
      targetGradeKey,
      targetSession,
      groupOverride,
      rollOverrides
    );

    setShowConfirmModal(false);

    if (res.success) {
      let archivedCount = 0;
      if (targetGradeKey === 'Alumni' && graduatingStudents.length > 0) {
        archivedCount = alumniService.archiveGraduatingStudents(
          graduatingStudents,
          targetSession,
          `এসএসসি ব্যাচ ${targetSession}`
        );
      }

      const newLog: PromotionLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString('bn-BD'),
        fromGrade: currentStep.fromShortBn,
        fromGradeKey: fromGrade,
        toGrade,
        count: res.count,
        session: targetSession,
        group: groupOverride,
        rollMode,
        promotedIds: selectedIds,
      };

      const updatedLogs = [newLog, ...promotionLogs];
      setPromotionLogs(updatedLogs);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sms_promotion_history', JSON.stringify(updatedLogs));
      }

      auditTrailService.addLog({
        action: 'STUDENTS_PROMOTED',
        category: 'Academic',
        details: `${currentStep.fromLabelBn} ➔ ${toGrade} (সেশন ${targetSession}): ${res.count} জন শিক্ষার্থী প্রমোশন সম্পন্ন (${rollMode === 'merit' ? 'মেধাক্রম রোল' : 'পূর্বের রোল বহাল'})।`,
        performedBy: 'অ্যাডমিন',
        status: 'Success',
      });

      showAlert(
        'success',
        archivedCount > 0
          ? `${res.message} (${toBanglaDigits(archivedCount)} জন অ্যালুমনাই পোর্টালে সংরক্ষিত হয়েছে)`
          : res.message
      );
      loadStudents(fromGrade, selectedExam);
    } else {
      showAlert('error', res.message);
    }
  };

  if (!mounted) {
    return (
      <div className="p-10 text-center text-sm font-bold text-slate-400">
        প্রমোশন মডিউল লোড হচ্ছে...
      </div>
    );
  }

  const promotableVisible = visibleStudents.filter((s) => !s.alreadyPromoted);
  const allVisibleSelected =
    promotableVisible.length > 0 && promotableVisible.every((s) => s.selected);
  const isSourceUpperSecondary = fromGrade === '9th' || fromGrade === '10th';

  return (
    <div className="w-full pb-12 font-sans text-slate-900 dark:text-slate-100">
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 📌 FLUSH STICKY SINGLE-LINE CONTROL BAR (0px GAP UNDER HEADER)    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)] dark:shadow-none print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Left & Center: Session + Current -> Next Class + Group + Exam + Search in One Clean Line */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* 1. Target Session */}
            <div className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">সেশন:</span>
              <input
                type="text"
                value={targetSession}
                onChange={(e) => setTargetSession(e.target.value)}
                aria-label="পরবর্তী সেশন"
                className="w-12 bg-transparent text-xs font-extrabold font-mono text-slate-900 dark:text-white text-center outline-none focus:text-[#0B5D3B]"
              />
            </div>

            {/* 2. Current Class -> Target Class Pair */}
            <div className="inline-flex items-center gap-1.5 h-9 px-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
              <GraduationCap size={14} className="text-[#0B5D3B] dark:text-emerald-400 ml-1 shrink-0" />
              <select
                value={fromGrade}
                onChange={(e) => handleGradeChange(e.target.value as PromotionGradeKey)}
                aria-label="বর্তমান শ্রেণি"
                className="bg-transparent text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer pr-1"
              >
                {PROMOTION_STEPS.map((step) => (
                  <option
                    key={step.fromKey}
                    value={step.fromKey}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {step.fromLabelBn}
                  </option>
                ))}
              </select>
              <ArrowRight size={13} className="text-slate-400 shrink-0" />
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-xs font-extrabold whitespace-nowrap">
                {currentStep.toShortBn}
              </span>
            </div>

            {/* 3. Contextual Group Control (Target Group for 8th->9th, Filter Group for 9th/10th) */}
            {targetGradeKey === '9th' ? (
              <div className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shrink-0">
                <span className="text-[11px] font-bold text-[#0B5D3B] dark:text-emerald-300">
                  ৯ম বিভাগ:
                </span>
                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  aria-label="৯ম শ্রেণির টার্গেট বিভাগ"
                  className="bg-transparent text-xs font-extrabold text-emerald-950 dark:text-emerald-200 outline-none cursor-pointer"
                >
                  <option value="বিজ্ঞান" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    বিজ্ঞান
                  </option>
                  <option value="মানবিক" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    মানবিক
                  </option>
                  <option value="ব্যবসায় শিক্ষা" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    ব্যবসায় শিক্ষা
                  </option>
                </select>
              </div>
            ) : isSourceUpperSecondary ? (
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                aria-label="বিভাগ ফিল্টার"
                className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer shrink-0"
              >
                <option value="all">সকল বিভাগ</option>
                <option value="বিজ্ঞান">বিজ্ঞান</option>
                <option value="মানবিক">মানবিক</option>
                <option value="ব্যবসায় শিক্ষা">ব্যবসায় শিক্ষা</option>
              </select>
            ) : (
              <span className="hidden xl:inline-flex items-center h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                বিভাগ: সাধারণ
              </span>
            )}

            {/* 4. Evaluation Exam Selector */}
            <div className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 max-w-[230px]">
              <Award size={13} className="text-slate-500 dark:text-slate-400 shrink-0" />
              <select
                value={selectedExam}
                onChange={(e) => handleExamChange(e.target.value)}
                aria-label="মূল্যায়ন পরীক্ষা"
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer truncate w-full"
              >
                {DEFAULT_EXAM_OPTIONS.map((title) => (
                  <option
                    key={title}
                    value={title}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {title}
                  </option>
                ))}
                {availableExams
                  .filter((e) => !DEFAULT_EXAM_OPTIONS.includes(e.title))
                  .map((ex) => (
                    <option
                      key={ex.id}
                      value={ex.title}
                      className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      {ex.title}
                    </option>
                  ))}
              </select>
            </div>

            {/* 5. Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="নাম, রোল বা আইডি খুঁজুন..."
                className="w-full h-9 pl-8 pr-7 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] focus:ring-2 focus:ring-emerald-600/15 outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                  aria-label="সার্চ মুছুন"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Right: Compact History Anchor */}
          <div className="flex items-center gap-1.5 shrink-0">
            {promotionLogs.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  document.getElementById('promotion-logs')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="h-9 px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <History size={13} className="text-slate-500" />
                <span className="hidden sm:inline">ইতিহাস</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-black">
                  {toBanglaDigits(promotionLogs.length)}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 📋 MAIN PROMOTION WORKSPACE                                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-5">
        {/* Feedback Alert Banner */}
        {alertMsg && (
          <div
            className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between gap-3 border ${
              alertMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {alertMsg.type === 'success' ? (
                <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>{alertMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlertMsg(null)}
              className="p-1 opacity-70 hover:opacity-100 cursor-pointer"
              aria-label="বার্তা বন্ধ করুন"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ─── MAIN STUDENT SELECTION TABLE CARD ─── */}
        <div
          id="promotion-table-section"
          className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden"
        >
          {/* LIGHTWEIGHT INLINE COUNTER & SELECTION STRIP (No bulky KPI cards!) */}
          <div className="px-4 sm:px-5 py-3 bg-slate-50/75 dark:bg-slate-950/50 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            {/* Left: Clickable Inline Counters */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>মোট</span>
                <span className="font-mono font-black">{toBanglaDigits(counts.total)}</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'Pass' ? 'all' : 'Pass')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  statusFilter === 'Pass'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70 hover:bg-emerald-50/70'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    statusFilter === 'Pass' ? 'bg-white' : 'bg-emerald-500'
                  }`}
                />
                <span>উত্তীর্ণ</span>
                <span className="font-mono font-black">{toBanglaDigits(counts.passed)}</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'Fail' ? 'all' : 'Fail')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  statusFilter === 'Fail'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white dark:bg-slate-900 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/70 hover:bg-rose-50/70'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    statusFilter === 'Fail' ? 'bg-white' : 'bg-rose-500'
                  }`}
                />
                <span>অকৃতকার্য</span>
                <span className="font-mono font-black">{toBanglaDigits(counts.failed)}</span>
              </button>

              {counts.pending > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === 'Pending' ? 'all' : 'Pending')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    statusFilter === 'Pending'
                      ? 'bg-slate-700 text-white border-slate-700'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      statusFilter === 'Pending' ? 'bg-white' : 'bg-slate-400'
                    }`}
                  />
                  <span>ফলাফল নেই</span>
                  <span className="font-mono font-black">{toBanglaDigits(counts.pending)}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'selected' ? 'all' : 'selected')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  statusFilter === 'selected'
                    ? 'bg-[#0B5D3B] text-white border-[#0B5D3B]'
                    : 'bg-emerald-50/80 dark:bg-emerald-950/50 text-[#0B5D3B] dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100/70'
                }`}
              >
                <CheckCircle2 size={12} />
                <span>নির্বাচিত</span>
                <span className="font-mono font-black">{toBanglaDigits(counts.selected)}</span>
              </button>
            </div>

            {/* Right: Roll Policy Switcher + Compact Bulk Selection Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {targetGradeKey !== 'Alumni' && (
                <div
                  className="inline-flex items-center p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold"
                  role="group"
                  aria-label="নতুন রোল নির্ধারণ নীতি"
                >
                  <button
                    type="button"
                    onClick={() => setRollMode('keep')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer inline-flex items-center gap-1 ${
                      rollMode === 'keep'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <SlidersHorizontal size={11} />
                    <span>পূর্বের রোল</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRollMode('merit')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer inline-flex items-center gap-1 ${
                      rollMode === 'merit'
                        ? 'bg-[#0B5D3B] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ListOrdered size={11} />
                    <span>মেধাক্রম রোল</span>
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectPassedOnly}
                  className="h-7 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-extrabold inline-flex items-center gap-1 transition cursor-pointer"
                  title="শুধুমাত্র উত্তীর্ণ শিক্ষার্থীদের নির্বাচন করুন"
                >
                  <CheckCheck size={13} />
                  <span>শুধু উত্তীর্ণ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleSelectAllVisible(true)}
                  className="h-7 px-2.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                >
                  <CheckSquare size={12} />
                  <span>সব বাছাই</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleSelectAllVisible(false)}
                  className="h-7 px-2.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                >
                  <Square size={12} />
                  <span>বাতিল</span>
                </button>
              </div>
            </div>
          </div>

          {/* TABLE BODY OR EMPTY STATE */}
          {students.length === 0 ? (
            <div className="py-16 px-6 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Users size={24} />
              </div>
              <p className="text-sm font-extrabold text-slate-800 dark:text-white">
                {currentStep.fromLabelBn}-এ কোনো শিক্ষার্থী নিবন্ধিত নেই
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                অন্য শ্রেণি নির্বাচন করুন অথবা শিক্ষার্থী ভর্তি / বাল্ক ইম্পোর্ট থেকে শিক্ষার্থী যোগ করুন।
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <Link
                  href="/dashboard/admission"
                  className="px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-emerald-800 text-white text-xs font-bold transition"
                >
                  নতুন শিক্ষার্থী ভর্তি
                </Link>
                <Link
                  href="/dashboard/students/bulk-import"
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                >
                  বাল্ক ইম্পোর্ট
                </Link>
              </div>
            </div>
          ) : visibleStudents.length === 0 ? (
            <div className="py-12 px-6 text-center space-y-2">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                সক্রিয় ফিল্টার বা সার্চের সাথে কোনো শিক্ষার্থী মেলেনি
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setGroupFilter('all');
                  setSearchQuery('');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                ফিল্টার রিসেট করুন
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-[13px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold text-xs border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4 w-11 text-center">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        disabled={promotableVisible.length === 0}
                        onChange={(e) => handleToggleSelectAllVisible(e.target.checked)}
                        aria-label="সকল প্রদর্শিত শিক্ষার্থী নির্বাচন করুন"
                        className="w-4 h-4 rounded accent-[#0B5D3B] cursor-pointer disabled:opacity-40"
                      />
                    </th>
                    <th className="py-3 px-3 w-20 text-center">বর্তমান রোল</th>
                    <th className="py-3 px-4">শিক্ষার্থীর নাম ও আইডি</th>
                    <th className="py-3 px-4">শাখা ও বিভাগ</th>
                    <th className="py-3 px-4 text-center">মূল্যায়ন ও জিপিএ</th>
                    <th className="py-3 px-4 text-center">নতুন রোল প্রিভিউ</th>
                    <th className="py-3 px-4 text-center">প্রমোশন সিদ্ধান্ত</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {visibleStudents.map((st) => {
                    const previewRoll = newRollPreviewMap[st.id];
                    const cleanCurrentRoll = String(st.roll || '').padStart(2, '0');
                    const isRollChanged = Boolean(previewRoll && previewRoll !== cleanCurrentRoll);

                    return (
                      <tr
                        key={st.id}
                        className={`transition-colors ${
                          st.alreadyPromoted
                            ? 'bg-slate-50/70 dark:bg-slate-950/40 opacity-75'
                            : st.selected
                            ? 'bg-emerald-50/35 dark:bg-emerald-950/20 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/35'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={st.selected && !st.alreadyPromoted}
                            disabled={st.alreadyPromoted}
                            onChange={() => handleToggleStudent(st.id)}
                            aria-label={`${st.name} নির্বাচন`}
                            className="w-4 h-4 rounded accent-[#0B5D3B] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                          />
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-extrabold text-slate-800 dark:text-slate-100">
                          {toBanglaDigits(cleanCurrentRoll)}
                        </td>

                        <td className="py-3 px-4">
                          <button
                            type="button"
                            disabled={st.alreadyPromoted}
                            onClick={() => handleToggleStudent(st.id)}
                            className="text-left group disabled:cursor-default cursor-pointer"
                          >
                            <p className="font-bold text-slate-900 dark:text-white group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition-colors">
                              {st.name}
                            </p>
                            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {st.id}
                            </p>
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            শাখা {st.section}
                          </span>
                          <span className="text-slate-400 mx-1.5">•</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {targetGradeKey === '9th' && st.selected && !st.alreadyPromoted ? (
                              <>
                                {st.group} ➔{' '}
                                <strong className="text-[#0B5D3B] dark:text-emerald-400">
                                  {targetGroup}
                                </strong>
                              </>
                            ) : (
                              st.group
                            )}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {st.status === 'Pass' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                              <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                              <span className="font-mono">GPA {toBanglaDigits(st.gpa)}</span>
                              {st.letterGrade && <span>({st.letterGrade})</span>}
                            </span>
                          ) : st.status === 'Fail' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold">
                              <AlertCircle size={12} className="text-rose-600 dark:text-rose-400" />
                              <span>
                                অকৃতকার্য{st.failedCount ? ` (${toBanglaDigits(st.failedCount)} বিষয়)` : ''}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                              ফলাফল এন্ট্রি নেই
                            </span>
                          )}
                        </td>

                        {/* New Roll Preview Column */}
                        <td className="py-3 px-4 text-center">
                          {st.alreadyPromoted ? (
                            <span className="text-xs font-semibold text-slate-400">—</span>
                          ) : !st.selected ? (
                            <span className="text-xs font-semibold text-slate-400">
                              রোল {toBanglaDigits(cleanCurrentRoll)} (অপরিবর্তিত)
                            </span>
                          ) : targetGradeKey === 'Alumni' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px] font-bold">
                              অ্যালুমনাই আর্কাইভ
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-extrabold border ${
                                isRollChanged
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <span className="text-slate-400 font-semibold">
                                {toBanglaDigits(cleanCurrentRoll)}
                              </span>
                              <ArrowRight size={11} className="text-emerald-600" />
                              <span>{toBanglaDigits(previewRoll || cleanCurrentRoll)}</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {st.alreadyPromoted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                              <Lock size={11} />
                              <span>ইতোমধ্যে প্রমোশন সম্পন্ন</span>
                            </span>
                          ) : st.selected ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B5D3B] text-white text-[11px] font-bold">
                              <CheckCircle2 size={12} />
                              <span>{currentStep.toShortBn}-এ উন্নীত</span>
                            </span>
                          ) : st.status === 'Fail' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold">
                              একই শ্রেণিতে বহাল
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                              অনির্বাচিত (বহাল)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* CALM INSTITUTIONAL BOTTOM EXECUTION BAR */}
          {students.length > 0 && (
            <div className="px-5 py-4 bg-slate-50/90 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-100">
                  <span>
                    নির্বাচিত:{' '}
                    <strong className="text-[#0B5D3B] dark:text-emerald-400 font-black">
                      {toBanglaDigits(counts.selected)} জন
                    </strong>{' '}
                    / মোট {toBanglaDigits(counts.total)} জন
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-600 dark:text-slate-300">
                    {currentStep.fromLabelBn} ➔ {currentStep.toShortBn} (সেশন {targetSession})
                  </span>
                  {targetGradeKey === '9th' && (
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px]">
                      বিভাগ: {targetGroup}
                    </span>
                  )}
                </div>

                {counts.selectedFailed > 0 ? (
                  <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="shrink-0" />
                    <span>
                      সতর্কতা: নির্বাচিত তালিকায় {toBanglaDigits(counts.selectedFailed)} জন অকৃতকার্য
                      শিক্ষার্থী রয়েছে। কনফার্ম করার আগে পুনরায় যাচাই করুন।
                    </span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {targetGradeKey === 'Alumni'
                      ? 'প্রমোশন নিশ্চিত করলে নির্বাচিত ১০ম শ্রেণির শিক্ষার্থীরা অ্যালুমনাই আর্কাইভে সংরক্ষিত হবে।'
                      : rollMode === 'merit'
                      ? 'মেধাক্রম (GPA → মোট নম্বর → পূর্বের রোল) অনুযায়ী নতুন ক্রমিক রোল বরাদ্দ হবে।'
                      : 'নির্বাচিত শিক্ষার্থীদের পূর্বের রোল নম্বর অপরিবর্তিত রেখে পরবর্তী শ্রেণিতে উন্নীত করা হবে।'}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleOpenConfirmation}
                disabled={counts.selected === 0}
                className="h-10 px-5 rounded-xl bg-[#0B5D3B] hover:bg-emerald-800 disabled:opacity-45 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm shadow-sm inline-flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer shrink-0"
              >
                <ShieldCheck size={16} />
                <span>
                  প্রমোশন পর্যালোচনা ও নিশ্চিত করুন ({toBanglaDigits(counts.selected)} জন)
                </span>
              </button>
            </div>
          )}
        </div>

        {/* ─── PROMOTION HISTORY LOGS ─── */}
        {promotionLogs.length > 0 && (
          <section
            id="promotion-logs"
            className="scroll-mt-24 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden"
          >
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <History size={15} className="text-[#0B5D3B] dark:text-emerald-400" />
                <span>পূর্ববর্তী প্রমোশন ইতিহাস ({toBanglaDigits(promotionLogs.length)})</span>
              </h3>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {promotionLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {log.fromGrade} শ্রেণি ➔ {log.toGrade}
                    </span>
                    {log.group && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                        বিভাগ: {log.group}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 font-bold text-[11px]">
                      {toBanglaDigits(log.count)} জন উন্নীত
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>সেশন: {log.session}</span>
                    <span>•</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 🛡️ ERROR-PROOF PROMOTION CONFIRMATION MODAL                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowConfirmModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="promotion-confirm-title"
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3
                    id="promotion-confirm-title"
                    className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white"
                  >
                    চূড়ান্ত প্রমোশন নিশ্চিতকরণ
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    সংরক্ষণের আগে শ্রেণি, সেশন ও রোল পরিবর্তন যাচাই করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="বন্ধ করুন"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Summary Key-Value Grid */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-500 block">শ্রেণি রূপান্তর</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                    {currentStep.fromLabelBn} ➔ {currentStep.toShortBn}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">পরবর্তী সেশন</span>
                  <span className="font-mono font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                    {targetSession}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">মোট নির্বাচিত শিক্ষার্থী</span>
                  <span className="font-extrabold text-[#0B5D3B] dark:text-emerald-400 mt-0.5 block">
                    {toBanglaDigits(selectedPromotableStudents.length)} জন (উত্তীর্ণ{' '}
                    {toBanglaDigits(counts.selectedPassed)}
                    {counts.selectedPending > 0
                      ? `, ফলাফল নেই ${toBanglaDigits(counts.selectedPending)}`
                      : ''}
                    {counts.selectedFailed > 0
                      ? `, অকৃতকার্য ${toBanglaDigits(counts.selectedFailed)}`
                      : ''}
                    )
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">রোল ও বিভাগ নীতি</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {targetGradeKey === 'Alumni'
                      ? 'অ্যালুমনাই আর্কাইভ'
                      : rollMode === 'merit'
                      ? 'মেধাক্রম নতুন রোল'
                      : 'পূর্বের রোল বহাল'}
                    {targetGradeKey === '9th' ? ` • ${targetGroup}` : ''}
                  </span>
                </div>
              </div>

              {/* Warning if Failed Students Included */}
              {counts.selectedFailed > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="font-semibold leading-relaxed">
                    আপনি <strong>{toBanglaDigits(counts.selectedFailed)} জন অকৃতকার্য</strong> শিক্ষার্থীকে
                    বিশেষ বিবেচনায় প্রমোশনের জন্য নির্বাচন করেছেন। নিশ্চিত হলেই এগিয়ে যান।
                  </p>
                </div>
              )}

              {/* Sample New Roll Preview List (First 5 Selected) */}
              {targetGradeKey !== 'Alumni' && selectedPromotableStudents.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                    রোল পরিবর্তনের নমুনা (প্রথম {toBanglaDigits(Math.min(5, selectedPromotableStudents.length))} জন):
                  </span>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    {selectedPromotableStudents.slice(0, 5).map((st) => {
                      const prevR = String(st.roll || '').padStart(2, '0');
                      const nextR = newRollPreviewMap[st.id] || prevR;
                      return (
                        <div
                          key={st.id}
                          className="px-3.5 py-2 flex items-center justify-between bg-white dark:bg-slate-900"
                        >
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate pr-3">
                            {st.name}
                          </span>
                          <span className="font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0 inline-flex items-center gap-1.5">
                            <span>রোল {toBanglaDigits(prevR)}</span>
                            <ArrowRight size={11} className="text-emerald-600" />
                            <span className="text-[#0B5D3B] dark:text-emerald-400 font-black">
                              {toBanglaDigits(nextR)}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="h-9 px-4 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleConfirmExecutePromotion}
                className="h-9 px-5 rounded-xl bg-[#0B5D3B] hover:bg-emerald-800 text-white text-xs font-extrabold shadow-sm inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>হ্যাঁ, প্রমোশন নিশ্চিত করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
