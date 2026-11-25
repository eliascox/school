'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Cloud,
  LayoutGrid,
  List,
  Loader2,
  Lock,
  RefreshCw,
  Search,
} from 'lucide-react';
import { UserSession } from '@/services/teacherAuthService';
import { SubjectAssignment, teacherRBACService } from '@/services/teacherRBACService';
import { evaluateSubjectGradeAndPass } from '@/services/resultService';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import {
  GroupKey,
  MarkInputField,
  MobileMarkRow,
  SubjectMarksLimits,
  getAvailableExamNames,
  getNextMarkInputKey,
  groupKeyToBranch,
  loadMobileMarkRows,
  resolveSubjectMarksConfig,
  saveTeacherSubjectMarks,
} from '@/lib/teacherMobileUtils';

const toBnDigit = (num: number | string) => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bn[parseInt(d, 10)]);
};

const gradeLabel = (g: string) => {
  const m: Record<string, string> = {
    '6th': '৬ষ্ঠ শ্রেণি',
    '7th': '৭ম শ্রেণি',
    '8th': '৮ম শ্রেণি',
    '9th': '৯ম শ্রেণি',
    '10th': '১০ম শ্রেণি',
  };
  return m[g] || g;
};

const branchLabel = (b: string) => {
  const m: Record<string, string> = {
    A: 'ক শাখা',
    B: 'খ শাখা',
    C: 'গ শাখা',
    Science: 'বিজ্ঞান',
    Humanities: 'মানবিক',
    Commerce: 'ব্যবসায়',
  };
  return m[b] || b;
};

interface RapidMarkRowItemProps {
  row: MobileMarkRow;
  limits: SubjectMarksLimits;
  viewMode: 'table' | 'cards';
  onChangeMark: (studentId: string, field: MarkInputField, rawValue: string) => void;
  onEnterKey: (studentId: string, field: MarkInputField) => void;
  onInputBlur: () => void;
  registerInputRef: (key: string, el: HTMLInputElement | null) => void;
}

const RapidMarkRowItem = memo(function RapidMarkRowItem({
  row,
  limits,
  viewMode,
  onChangeMark,
  onEnterKey,
  onInputBlur,
  registerInputRef,
}: RapidMarkRowItemProps) {
  const gradeInfo = useMemo(
    () =>
      evaluateSubjectGradeAndPass(
        { cq: row.written, mcq: row.mcq, practical: row.practical, total: row.total },
        {
          fullMarks: limits.fullMarks,
          cq: limits.writtenMax,
          mcq: limits.mcqMax,
          practical: limits.practicalMax,
          ca: 0,
          passMarks: Math.floor(limits.fullMarks * 0.33),
          passRules: 'পৃথক পাস',
        }
      ),
    [row.written, row.mcq, row.practical, row.total, limits]
  );

  const hasEntered = row.total > 0;
  const isPass = gradeInfo.isPassed;

  const handleKeyDown = (field: MarkInputField) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnterKey(row.id, field);
    }
  };

  if (viewMode === 'table') {
    return (
      <div
        className={`flex items-center gap-1.5 px-2.5 py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-b-0 transition-colors ${
          hasEntered
            ? isPass
              ? 'bg-emerald-50/25 dark:bg-emerald-950/10'
              : 'bg-rose-50/35 dark:bg-rose-950/15'
            : 'bg-white dark:bg-slate-900'
        }`}
      >
        {/* Roll + Name */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span
            className={`w-6 h-6 rounded-lg font-mono font-black text-[10.5px] flex items-center justify-center shrink-0 ${
              hasEntered
                ? isPass
                  ? 'bg-indigo-600 text-white'
                  : 'bg-rose-600 text-white'
                : 'bg-slate-800 dark:bg-slate-700 text-white'
            }`}
          >
            {row.roll}
          </span>
          <span className="text-[11.5px] font-bold text-slate-900 dark:text-slate-100 truncate">
            {row.name}
          </span>
        </div>

        {/* Written Input */}
        <input
          ref={(el) => registerInputRef(`${row.id}:written`, el)}
          type="number"
          inputMode="numeric"
          enterKeyHint="next"
          min={0}
          max={limits.writtenMax}
          value={row.written === 0 ? '' : row.written}
          placeholder="—"
          aria-label={`রোল ${row.roll} লিখিত নম্বর`}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => onChangeMark(row.id, 'written', e.target.value)}
          onKeyDown={handleKeyDown('written')}
          onBlur={onInputBlur}
          className="w-12 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-center text-xs font-black text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shrink-0"
        />

        {/* MCQ Input */}
        {limits.hasMcq && (
          <input
            ref={(el) => registerInputRef(`${row.id}:mcq`, el)}
            type="number"
            inputMode="numeric"
            enterKeyHint="next"
            min={0}
            max={limits.mcqMax}
            value={row.mcq === 0 ? '' : row.mcq}
            placeholder="—"
            aria-label={`রোল ${row.roll} MCQ নম্বর`}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => onChangeMark(row.id, 'mcq', e.target.value)}
            onKeyDown={handleKeyDown('mcq')}
            onBlur={onInputBlur}
            className="w-11 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-center text-xs font-black text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shrink-0"
          />
        )}

        {/* Practical Input */}
        {limits.hasPractical && (
          <input
            ref={(el) => registerInputRef(`${row.id}:practical`, el)}
            type="number"
            inputMode="numeric"
            enterKeyHint="next"
            min={0}
            max={limits.practicalMax}
            value={row.practical === 0 ? '' : row.practical}
            placeholder="—"
            aria-label={`রোল ${row.roll} ব্যবহারিক নম্বর`}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => onChangeMark(row.id, 'practical', e.target.value)}
            onKeyDown={handleKeyDown('practical')}
            onBlur={onInputBlur}
            className="w-11 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-center text-xs font-black text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shrink-0"
          />
        )}

        {/* Live Total & Grade */}
        <div className="w-12 text-right shrink-0 leading-tight">
          <span className="text-[11.5px] font-black font-mono text-slate-900 dark:text-white block">
            {hasEntered ? toBnDigit(row.total) : '—'}
          </span>
          {hasEntered && (
            <span
              className={`text-[9.5px] font-black ${
                isPass ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {gradeInfo.letterGrade}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Detailed Card Mode
  const accentBorder = !hasEntered
    ? 'border-l-slate-300 dark:border-l-slate-700'
    : isPass
    ? 'border-l-emerald-500'
    : 'border-l-rose-500';

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/90 dark:border-slate-800 border-l-4 ${accentBorder} shadow-2xs space-y-2.5`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`w-8 h-8 rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 ${
              hasEntered
                ? isPass
                  ? 'bg-indigo-600 text-white'
                  : 'bg-rose-600 text-white'
                : 'bg-slate-900 dark:bg-slate-800 text-white'
            }`}
          >
            {row.roll}
          </span>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{row.name}</h4>
            <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
              মোট: <strong className="text-slate-800 dark:text-slate-200">{toBnDigit(row.total)}</strong> /{' '}
              {toBnDigit(limits.fullMarks)}
            </span>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-lg text-[10.5px] font-black shrink-0 ${
            !hasEntered
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              : isPass
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
          }`}
        >
          {hasEntered ? gradeInfo.letterGrade : 'বাকি'}
        </span>
      </div>

      <div
        className={`grid gap-2 ${
          limits.hasMcq && limits.hasPractical
            ? 'grid-cols-3'
            : limits.hasMcq || limits.hasPractical
            ? 'grid-cols-2'
            : 'grid-cols-1'
        }`}
      >
        <div>
          <label className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
            লিখিত ({toBnDigit(limits.writtenMax)})
          </label>
          <input
            ref={(el) => registerInputRef(`${row.id}:written`, el)}
            type="number"
            inputMode="numeric"
            enterKeyHint="next"
            min={0}
            max={limits.writtenMax}
            value={row.written === 0 ? '' : row.written}
            placeholder="0"
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => onChangeMark(row.id, 'written', e.target.value)}
            onKeyDown={handleKeyDown('written')}
            onBlur={onInputBlur}
            className="w-full h-11 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-base font-black text-slate-900 dark:text-white text-center outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {limits.hasMcq && (
          <div>
            <label className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              MCQ ({toBnDigit(limits.mcqMax)})
            </label>
            <input
              ref={(el) => registerInputRef(`${row.id}:mcq`, el)}
              type="number"
              inputMode="numeric"
              enterKeyHint="next"
              min={0}
              max={limits.mcqMax}
              value={row.mcq === 0 ? '' : row.mcq}
              placeholder="0"
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => onChangeMark(row.id, 'mcq', e.target.value)}
              onKeyDown={handleKeyDown('mcq')}
              onBlur={onInputBlur}
              className="w-full h-11 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-base font-black text-slate-900 dark:text-white text-center outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        )}

        {limits.hasPractical && (
          <div>
            <label className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              ব্যবহারিক ({toBnDigit(limits.practicalMax)})
            </label>
            <input
              ref={(el) => registerInputRef(`${row.id}:practical`, el)}
              type="number"
              inputMode="numeric"
              enterKeyHint="next"
              min={0}
              max={limits.practicalMax}
              value={row.practical === 0 ? '' : row.practical}
              placeholder="0"
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => onChangeMark(row.id, 'practical', e.target.value)}
              onKeyDown={handleKeyDown('practical')}
              onBlur={onInputBlur}
              className="w-full h-11 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-base font-black text-slate-900 dark:text-white text-center outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        )}
      </div>
    </div>
  );
});

interface RapidMarksEntryPanelProps {
  session: UserSession;
  isAdmin: boolean;
  teacherIdentifier: string;
  myAssignedSubjects: SubjectAssignment[];
  isClassTeacher: boolean;
  markGrade: string;
  setMarkGrade: (g: string) => void;
  markBranch: string;
  setMarkBranch: (b: string) => void;
  markGroup: GroupKey;
  setMarkGroup: (g: GroupKey) => void;
  markSubject: string;
  setMarkSubject: (s: string) => void;
  onGoToAttendance: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function RapidMarksEntryPanel({
  session,
  isAdmin,
  teacherIdentifier,
  myAssignedSubjects,
  isClassTeacher,
  markGrade,
  setMarkGrade,
  markBranch,
  setMarkBranch,
  markGroup,
  setMarkGroup,
  markSubject,
  setMarkSubject,
  onGoToAttendance,
  onDirtyChange,
}: RapidMarksEntryPanelProps) {
  const examOptions = useMemo(() => getAvailableExamNames(), []);
  const [selectedExam, setSelectedExam] = useState<string>(() => examOptions[0] || 'অর্ধ-বার্ষিক পরীক্ষা ২০২৬');
  const [markRows, setMarkRows] = useState<MobileMarkRow[]>([]);
  const [markSearch, setMarkSearch] = useState('');
  const [markFilter, setMarkFilter] = useState<'all' | 'pending' | 'fail'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Auto-save state
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [clampNotice, setClampNotice] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const latestRowsRef = useRef<MobileMarkRow[]>([]);
  const dirtyRef = useRef<boolean>(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clampTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contextRef = useRef({ exam: selectedExam, grade: markGrade, branch: markBranch, group: markGroup, subject: markSubject });

  const isMarkClass9or10 = markGrade === '9th' || markGrade === '10th';

  const adminSubjectsForGrade = useMemo(() => {
    if (!isAdmin) return [];
    const list = getActiveCurriculumSubjects(markGrade, markGroup);
    const pool = new Set<string>();
    list.forEach((s) => {
      if (s.name.includes('ধর্ম') || s.code.startsWith('REL-') || ['111', '112', '113', '114'].includes(String(s.code))) {
        pool.add('ইসলাম ও নৈতিক শিক্ষা');
        pool.add('হিন্দুধর্ম ও নৈতিক শিক্ষা');
      }
      pool.add(s.name);
    });
    return Array.from(pool);
  }, [isAdmin, markGrade, markGroup]);

  useEffect(() => {
    if (isAdmin && adminSubjectsForGrade.length > 0 && !adminSubjectsForGrade.includes(markSubject)) {
      setMarkSubject(adminSubjectsForGrade[0]);
    }
  }, [isAdmin, adminSubjectsForGrade, markSubject, setMarkSubject]);

  useEffect(() => {
    if (isMarkClass9or10) {
      setMarkBranch(groupKeyToBranch(markGroup));
    } else if (!['A', 'B', 'C'].includes(markBranch)) {
      setMarkBranch('A');
    }
  }, [isMarkClass9or10, markGroup, markBranch, setMarkBranch]);

  const markLimits = useMemo(
    () => resolveSubjectMarksConfig(markSubject || 'বাংলা ১ম পত্র', markGrade, markGroup),
    [markSubject, markGrade, markGroup]
  );

  // Flush any pending auto-save cleanly using latest refs
  const flushSave = useCallback(
    (mode: 'auto' | 'manual' = 'auto') => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      const ctx = contextRef.current;
      if (!ctx.subject || latestRowsRef.current.length === 0) return;
      if (mode === 'auto' && !dirtyRef.current) return;

      const res = saveTeacherSubjectMarks({
        session,
        exam: ctx.exam,
        grade: ctx.grade,
        branch: ctx.branch,
        group: ctx.group,
        subject: ctx.subject,
        rows: latestRowsRef.current,
        mode,
      });

      if (res.success) {
        dirtyRef.current = false;
        onDirtyChange?.(false);
        setAutoSaveState('saved');
        setLastSavedTime(res.savedTimeBn || '');
        setErrorMsg('');
      } else {
        setAutoSaveState('error');
        setErrorMsg(res.message);
      }
    },
    [session, onDirtyChange]
  );

  // Flush before switching context, on visibilitychange, and on unmount
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && dirtyRef.current) {
        flushSave('auto');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (dirtyRef.current) {
        flushSave('auto');
      }
    };
  }, [flushSave]);

  // Load rows when exam/grade/branch/group/subject changes (flushing old dirty edits first!)
  useEffect(() => {
    if (dirtyRef.current) {
      flushSave('auto');
    }
    contextRef.current = {
      exam: selectedExam,
      grade: markGrade,
      branch: markBranch,
      group: markGroup,
      subject: markSubject,
    };

    if (!markSubject) {
      setMarkRows([]);
      latestRowsRef.current = [];
      return;
    }
    if (!isAdmin && !teacherRBACService.validateSubjectOwnership(teacherIdentifier, markGrade, markSubject)) {
      setMarkRows([]);
      latestRowsRef.current = [];
      return;
    }

    const { rows } = loadMobileMarkRows({
      exam: selectedExam,
      grade: markGrade,
      branch: markBranch,
      group: markGroup,
      subject: markSubject,
    });
    setMarkRows(rows);
    latestRowsRef.current = rows;
    dirtyRef.current = false;
    onDirtyChange?.(false);
    setAutoSaveState('idle');
    setErrorMsg('');
  }, [isAdmin, teacherIdentifier, selectedExam, markGrade, markBranch, markGroup, markSubject, flushSave, onDirtyChange]);

  const registerInputRef = useCallback((key: string, el: HTMLInputElement | null) => {
    if (el) inputRefs.current.set(key, el);
    else inputRefs.current.delete(key);
  }, []);

  const handleMarkInputChange = useCallback(
    (studentId: string, field: MarkInputField, rawValue: string) => {
      const cleaned = rawValue.replace(/\D/g, '');
      const parsed = cleaned === '' ? 0 : parseInt(cleaned, 10) || 0;
      const maxAllowed =
        field === 'written'
          ? markLimits.writtenMax
          : field === 'mcq'
          ? markLimits.mcqMax
          : markLimits.practicalMax;

      if (parsed > maxAllowed) {
        setClampNotice(`সর্বোচ্চ ${toBnDigit(maxAllowed)} নির্ধারিত — অটো সমন্বয় হয়েছে`);
        if (clampTimerRef.current) clearTimeout(clampTimerRef.current);
        clampTimerRef.current = setTimeout(() => setClampNotice(''), 2200);
      }

      setMarkRows((prev) => {
        const next = prev.map((row) => {
          if (row.id !== studentId) return row;
          const written = field === 'written' ? Math.min(markLimits.writtenMax, Math.max(0, parsed)) : row.written;
          const mcq = markLimits.hasMcq
            ? field === 'mcq'
              ? Math.min(markLimits.mcqMax, Math.max(0, parsed))
              : row.mcq
            : 0;
          const practical = markLimits.hasPractical
            ? field === 'practical'
              ? Math.min(markLimits.practicalMax, Math.max(0, parsed))
              : row.practical
            : 0;
          return { ...row, written, mcq, practical, total: written + mcq + practical };
        });
        latestRowsRef.current = next;
        return next;
      });

      dirtyRef.current = true;
      onDirtyChange?.(true);
      setAutoSaveState('saving');

      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        flushSave('auto');
      }, 600);
    },
    [markLimits, flushSave, onDirtyChange]
  );

  const handleInputBlur = useCallback(() => {
    if (dirtyRef.current) {
      flushSave('auto');
    }
  }, [flushSave]);

  const markStats = useMemo(() => {
    let entered = 0;
    let passed = 0;
    let failed = 0;
    for (const row of markRows) {
      if (row.total > 0) {
        entered++;
        const info = evaluateSubjectGradeAndPass(
          { cq: row.written, mcq: row.mcq, practical: row.practical, total: row.total },
          {
            fullMarks: markLimits.fullMarks,
            cq: markLimits.writtenMax,
            mcq: markLimits.mcqMax,
            practical: markLimits.practicalMax,
            ca: 0,
            passMarks: Math.floor(markLimits.fullMarks * 0.33),
            passRules: 'পৃথক পাস',
          }
        );
        if (info.isPassed) passed++;
        else failed++;
      }
    }
    const total = markRows.length;
    const pending = total - entered;
    const pct = total > 0 ? Math.round((entered / total) * 100) : 0;
    return { total, entered, pending, passed, failed, pct };
  }, [markRows, markLimits]);

  const filteredRows = useMemo(() => {
    const q = markSearch.trim().toLowerCase();
    return markRows.filter((row) => {
      if (markFilter === 'pending' && row.total > 0) return false;
      if (markFilter === 'fail') {
        if (row.total === 0) return false;
        const info = evaluateSubjectGradeAndPass(
          { cq: row.written, mcq: row.mcq, practical: row.practical, total: row.total },
          {
            fullMarks: markLimits.fullMarks,
            cq: markLimits.writtenMax,
            mcq: markLimits.mcqMax,
            practical: markLimits.practicalMax,
            ca: 0,
            passMarks: Math.floor(markLimits.fullMarks * 0.33),
            passRules: 'পৃথক পাস',
          }
        );
        if (info.isPassed) return false;
      }
      if (!q) return true;
      return row.name.toLowerCase().includes(q) || String(row.roll).toLowerCase().includes(q);
    });
  }, [markRows, markSearch, markFilter, markLimits]);

  const visibleRowIds = useMemo(() => filteredRows.map((r) => r.id), [filteredRows]);

  const handleEnterKey = useCallback(
    (studentId: string, field: MarkInputField) => {
      const nextKey = getNextMarkInputKey(visibleRowIds, studentId, field, markLimits);
      if (nextKey) {
        const target = inputRefs.current.get(nextKey);
        if (target) {
          target.focus();
          target.select();
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      // End of list -> flush save immediately
      flushSave('auto');
    },
    [visibleRowIds, markLimits, flushSave]
  );

  if (!isAdmin && myAssignedSubjects.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-amber-200 dark:border-amber-800/60 text-center space-y-3 shadow-2xs">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-black text-slate-900 dark:text-white">কোনো বিষয় বরাদ্দ নেই</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          আপনার অ্যাকাউন্টে এখনো কোনো শ্রেণির বিষয় এসাইন করা হয়নি। অ্যাডমিন প্যানেল থেকে বিষয় বরাদ্দ দিলে এখানে নম্বর এন্ট্রি করতে পারবেন।
        </p>
        {isClassTeacher && (
          <button
            type="button"
            onClick={onGoToAttendance}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black cursor-pointer shadow-sm"
          >
            দৈনিক হাজিরা নিতে যান →
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Compact Sticky Auto-Save Status Bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          {autoSaveState === 'saving' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin shrink-0" />
              <span className="text-[11px] font-black text-amber-700 dark:text-amber-300 truncate">
                অটো-সেভ হচ্ছে...
              </span>
            </>
          ) : autoSaveState === 'saved' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 truncate">
                অটো-সেভড ✓ {lastSavedTime ? `(${lastSavedTime})` : ''}
              </span>
            </>
          ) : autoSaveState === 'error' ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="text-[11px] font-black text-rose-600 truncate">সেভ ব্যর্থ</span>
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 truncate">
                অটো-সেভ চালু ✓
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Rapid Table vs Card Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="দ্রুত টেবিল মোড"
              className={`p-1 rounded-md transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="বিস্তারিত কার্ড মোড"
              className={`p-1 rounded-md transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => flushSave('manual')}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] font-black flex items-center gap-1 cursor-pointer transition"
          >
            <RefreshCw className="w-3 h-3" />
            <span>সিঙ্ক</span>
          </button>
        </div>
      </div>

      {/* Exam + Assigned Subject + Section Configuration Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-6">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">পরীক্ষা</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              aria-label="পরীক্ষা নির্বাচন"
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11.5px] font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            >
              {examOptions.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </div>

          {!isAdmin ? (
            <div className="col-span-6">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                বরাদ্দ বিষয় ({toBnDigit(myAssignedSubjects.length)})
              </label>
              <select
                value={`${markGrade}|||${markSubject}`}
                onChange={(e) => {
                  const [g, sub] = e.target.value.split('|||');
                  if (g) setMarkGrade(g);
                  if (sub) setMarkSubject(sub);
                }}
                aria-label="বরাদ্দকৃত শ্রেণি ও বিষয়"
                className="w-full px-2.5 py-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11.5px] font-black text-indigo-950 dark:text-indigo-200 outline-none focus:border-indigo-500"
              >
                {myAssignedSubjects.map((sa) => (
                  <option key={sa.id} value={`${sa.classId}|||${sa.subjectId}`}>
                    {gradeLabel(sa.classId)} — {sa.subjectId}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="col-span-6">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">শ্রেণি</label>
              <select
                value={markGrade}
                onChange={(e) => setMarkGrade(e.target.value)}
                aria-label="শ্রেণি নির্বাচন"
                className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11.5px] font-bold text-slate-900 dark:text-white"
              >
                <option value="6th">৬ষ্ঠ শ্রেণি</option>
                <option value="7th">৭ম শ্রেণি</option>
                <option value="8th">৮ম শ্রেণি</option>
                <option value="9th">৯ম শ্রেণি</option>
                <option value="10th">১০ম শ্রেণি</option>
              </select>
            </div>
          )}
        </div>

        {isAdmin && (
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">বিষয়</label>
            <select
              value={markSubject}
              onChange={(e) => setMarkSubject(e.target.value)}
              aria-label="বিষয় নির্বাচন"
              className="w-full px-2.5 py-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-black text-indigo-950 dark:text-indigo-200"
            >
              {adminSubjectsForGrade.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Branch / Group Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
          {isMarkClass9or10
            ? (
                [
                  { k: 'science', label: 'বিজ্ঞান' },
                  { k: 'humanities', label: 'মানবিক' },
                  { k: 'commerce', label: 'ব্যবসায়' },
                ] as const
              ).map((gp) => (
                <button
                  key={gp.k}
                  type="button"
                  onClick={() => setMarkGroup(gp.k)}
                  className={`py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer ${
                    markGroup === gp.k
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {gp.label}
                </button>
              ))
            : (['A', 'B', 'C'] as const).map((br) => (
                <button
                  key={br}
                  type="button"
                  onClick={() => setMarkBranch(br)}
                  className={`py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer ${
                    markBranch === br
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {branchLabel(br)}
                </button>
              ))}
        </div>

        {/* Compact Marks Structure + Progress */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5 flex-wrap">
            <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>লিখিত {toBnDigit(markLimits.writtenMax)}</span>
            {markLimits.hasMcq && <span>• MCQ {toBnDigit(markLimits.mcqMax)}</span>}
            {markLimits.hasPractical && <span>• ব্যব {toBnDigit(markLimits.practicalMax)}</span>}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[10px] font-black shrink-0">
            পূর্ণমান {toBnDigit(markLimits.fullMarks)}
          </span>
        </div>
      </div>

      {/* Clamping or Error Alerts */}
      {clampNotice && (
        <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] font-black text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{clampNotice}</span>
        </div>
      )}
      {errorMsg && (
        <div className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-[11px] font-black text-rose-700 dark:text-rose-200 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Progress, Filters & Search */}
      {markRows.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-black text-slate-800 dark:text-slate-200">
              এন্ট্রি: {toBnDigit(markStats.entered)}/{toBnDigit(markStats.total)} জন ({toBnDigit(markStats.pct)}%)
            </span>
            <div className="flex items-center gap-1.5 text-[10px] font-black">
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                পাস {toBnDigit(markStats.passed)}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                ফেল {toBnDigit(markStats.failed)}
              </span>
            </div>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${markStats.pct}%` }}
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'all', label: `সবাই (${toBnDigit(markStats.total)})` },
                { id: 'pending', label: `বাকি (${toBnDigit(markStats.pending)})` },
                { id: 'fail', label: `ফেল (${toBnDigit(markStats.failed)})` },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setMarkFilter(f.id)}
                className={`flex-1 py-1.5 rounded-xl text-[10.5px] font-black transition cursor-pointer ${
                  markFilter === f.id
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={markSearch}
              onChange={(e) => setMarkSearch(e.target.value)}
              placeholder="রোল বা নাম খুঁজুন... (Enter চাপে পরের ঘরে যাবে)"
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Marks List: Rapid Table (Default) OR Card View */}
      {filteredRows.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center space-y-1">
          <p className="text-xs font-black text-slate-700 dark:text-slate-300">কোনো শিক্ষার্থী পাওয়া যায়নি</p>
          <p className="text-[11px] text-slate-400">অন্য শাখা/বিভাগ বা ফিল্টার পরিবর্তন করে দেখুন।</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300">
            <span className="flex-1">রোল ও শিক্ষার্থী</span>
            <span className="w-12 text-center shrink-0">লিখিত</span>
            {markLimits.hasMcq && <span className="w-11 text-center shrink-0">MCQ</span>}
            {markLimits.hasPractical && <span className="w-11 text-center shrink-0">ব্যব.</span>}
            <span className="w-12 text-right shrink-0">মোট</span>
          </div>
          <div>
            {filteredRows.map((row) => (
              <RapidMarkRowItem
                key={row.id}
                row={row}
                limits={markLimits}
                viewMode="table"
                onChangeMark={handleMarkInputChange}
                onEnterKey={handleEnterKey}
                onInputBlur={handleInputBlur}
                registerInputRef={registerInputRef}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredRows.map((row) => (
            <RapidMarkRowItem
              key={row.id}
              row={row}
              limits={markLimits}
              viewMode="cards"
              onChangeMark={handleMarkInputChange}
              onEnterKey={handleEnterKey}
              onInputBlur={handleInputBlur}
              registerInputRef={registerInputRef}
            />
          ))}
        </div>
      )}
    </div>
  );
}
