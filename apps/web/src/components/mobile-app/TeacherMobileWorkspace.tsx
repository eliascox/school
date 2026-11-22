'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Award,
  Bell,
  BookOpen,
  Calendar,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Edit3,
  ExternalLink,
  FileText,
  GraduationCap,
  Lock,
  Phone,
  Pin,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { UserSession } from '@/services/teacherAuthService';
import {
  teacherRBACService,
  SubjectAssignment,
  ClassTeacherAssignment,
  TeacherRecord,
} from '@/services/teacherRBACService';
import { attendanceService, StudentAttendanceRecord } from '@/services/attendanceService';
import { evaluateSubjectGradeAndPass } from '@/services/resultService';
import { Notice } from '@/services/noticeService';
import {
  RoutineSlot,
  ROUTINE_DAYS,
  ROUTINE_PERIODS,
  SubstitutionRecord,
  routineService,
} from '@/services/routineService';
import { localDateKey } from '@/lib/dateUtils';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import InitialsAvatar from '@/components/public/InitialsAvatar';
import {
  GroupKey,
  MobileMarkRow,
  STANDARD_EXAMS,
  groupKeyToBranch,
  loadMobileMarkRows,
  parseClassTeacherClassId,
  resolveSubjectMarksConfig,
  saveClassTeacherDailyAttendance,
  saveTeacherSubjectMarks,
} from '@/lib/teacherMobileUtils';

export type TeacherMobileTab = 'home' | 'marks' | 'attendance' | 'schedule';

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
    A: 'ক শাখা (A)',
    B: 'খ শাখা (B)',
    C: 'গ শাখা (C)',
    Science: 'বিজ্ঞান বিভাগ',
    Humanities: 'মানবিক বিভাগ',
    Commerce: 'ব্যবসায় শিক্ষা',
  };
  return m[b] || b;
};

const getGreetingBn = () => {
  const hr = new Date().getHours();
  if (hr < 12) return 'শুভ সকাল';
  if (hr < 16) return 'শুভ দুপুর';
  if (hr < 19) return 'শুভ বিকাল';
  return 'শুভ সন্ধ্যা';
};

const formatTodayBn = () => {
  try {
    return new Date().toLocaleDateString('bn-BD', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return localDateKey();
  }
};

const QUICK_ABSENT_REASONS = ['অসুস্থতা', 'পারিবারিক কাজ', 'ছুটির আবেদন', 'বিনা নোটিশে'] as const;

interface TeacherMobileWorkspaceProps {
  session: UserSession;
  activeTab: TeacherMobileTab;
  onTabChange: (tab: TeacherMobileTab) => void;
  routines: RoutineSlot[];
  todaySubstitutions: SubstitutionRecord[];
  notices: Notice[];
  onDataChanged?: () => void;
  onDirtyMarksChange?: (dirty: boolean) => void;
}

export default function TeacherMobileWorkspace({
  session,
  activeTab,
  onTabChange,
  routines,
  todaySubstitutions,
  notices,
  onDataChanged,
  onDirtyMarksChange,
}: TeacherMobileWorkspaceProps) {
  const isAdmin = session.role === 'admin';
  const teacherIdentifier = session.teacherId || session.teacherName || '';

  const [teacherProfile, setTeacherProfile] = useState<TeacherRecord | null>(null);
  const [myAssignedSubjects, setMyAssignedSubjects] = useState<SubjectAssignment[]>([]);
  const [myClassTeachers, setMyClassTeachers] = useState<ClassTeacherAssignment[]>([]);

  // ── Marks Entry State ──
  const [selectedExam, setSelectedExam] = useState<string>(STANDARD_EXAMS[0]);
  const [markGrade, setMarkGrade] = useState<string>('6th');
  const [markBranch, setMarkBranch] = useState<string>('A');
  const [markGroup, setMarkGroup] = useState<GroupKey>('science');
  const [markSubject, setMarkSubject] = useState<string>('');
  const [markRows, setMarkRows] = useState<MobileMarkRow[]>([]);
  const [markSearch, setMarkSearch] = useState<string>('');
  const [markFilter, setMarkFilter] = useState<'all' | 'pending' | 'fail'>('all');
  const [markDirty, setMarkDirty] = useState<boolean>(false);
  const [markFeedback, setMarkFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Attendance State ──
  const [attDate, setAttDate] = useState<string>(() => localDateKey());
  const [attGrade, setAttGrade] = useState<string>('6th');
  const [attBranch, setAttBranch] = useState<string>('A');
  const [attRecords, setAttRecords] = useState<StudentAttendanceRecord[]>([]);
  const [attSearch, setAttSearch] = useState<string>('');
  const [attStatusFilter, setAttStatusFilter] = useState<'all' | 'Present' | 'Absent' | 'Leave'>('all');
  const [attFeedback, setAttFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Routine Day ──
  const todayRoutineDay = useMemo<RoutineSlot['day']>(() => {
    return routineService.getDayFromDate(localDateKey()) || 'Sunday';
  }, []);
  const [selectedDay, setSelectedDay] = useState<RoutineSlot['day']>(todayRoutineDay);

  // Notify parent when dirty marks status changes
  useEffect(() => {
    onDirtyMarksChange?.(markDirty);
  }, [markDirty, onDirtyMarksChange]);

  // Load teacher RBAC profile & assignments
  useEffect(() => {
    const allTeachers = teacherRBACService.getTeachers();
    const me =
      allTeachers.find(
        (t) =>
          t.id === session.teacherId ||
          t.phone === session.teacherId ||
          (session.teacherName && t.name === session.teacherName),
      ) || null;
    setTeacherProfile(me);

    const assignedSubs = isAdmin
      ? teacherRBACService.getSubjectAssignments()
      : teacherRBACService.getTeacherAssignedSubjects(teacherIdentifier);
    setMyAssignedSubjects(assignedSubs);

    const ctList = isAdmin
      ? teacherRBACService.getClassTeachers()
      : teacherRBACService.getTeacherClassTeacherAssignments(teacherIdentifier);
    setMyClassTeachers(ctList);

    if (!isAdmin && assignedSubs.length > 0) {
      const first = assignedSubs[0];
      setMarkGrade(first.classId);
      setMarkSubject(first.subjectId);
      if (first.classId === '9th' || first.classId === '10th') {
        setMarkGroup('science');
        setMarkBranch('Science');
      } else {
        setMarkBranch('A');
      }
    } else if (isAdmin) {
      const defaultSubs = getActiveCurriculumSubjects('6th', 'science');
      setMarkGrade('6th');
      setMarkBranch('A');
      setMarkSubject(defaultSubs[0]?.name || 'বাংলা ১ম পত্র');
    }

    if (ctList.length > 0) {
      const parsed = parseClassTeacherClassId(ctList[0].classId);
      setAttGrade(parsed.grade);
      setAttBranch(parsed.branch);
    }
  }, [isAdmin, session.teacherId, session.teacherName, teacherIdentifier]);

  const isClassTeacher = isAdmin || myClassTeachers.length > 0;
  const isMarkClass9or10 = markGrade === '9th' || markGrade === '10th';
  const isAttClass9or10 = attGrade === '9th' || attGrade === '10th';

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
  }, [isAdmin, adminSubjectsForGrade, markSubject]);

  useEffect(() => {
    if (isMarkClass9or10) {
      setMarkBranch(groupKeyToBranch(markGroup));
    } else if (!['A', 'B', 'C'].includes(markBranch)) {
      setMarkBranch('A');
    }
  }, [isMarkClass9or10, markGroup, markBranch]);

  const markLimits = useMemo(
    () => resolveSubjectMarksConfig(markSubject || 'বাংলা ১ম পত্র', markGrade, markGroup),
    [markSubject, markGrade, markGroup],
  );

  // Load mark rows whenever selection changes
  useEffect(() => {
    if (!markSubject) {
      setMarkRows([]);
      return;
    }
    if (!isAdmin && !teacherRBACService.validateSubjectOwnership(teacherIdentifier, markGrade, markSubject)) {
      setMarkRows([]);
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
    setMarkDirty(false);
    setMarkFeedback(null);
  }, [isAdmin, teacherIdentifier, selectedExam, markGrade, markBranch, markGroup, markSubject]);

  // Load attendance records whenever class/date changes
  const reloadAttendance = useCallback(() => {
    const classKey = `${attGrade}-${attBranch}`;
    if (!isAdmin && !teacherRBACService.canTakeClassAttendance(teacherIdentifier, classKey)) {
      setAttRecords([]);
      return;
    }
    const records = attendanceService.getAttendance(attDate, attGrade, attBranch);
    setAttRecords(records);
  }, [isAdmin, teacherIdentifier, attDate, attGrade, attBranch]);

  useEffect(() => {
    reloadAttendance();
  }, [reloadAttendance]);

  // Handlers: Marks Entry
  const handleSelectAssignedPair = (assignment: SubjectAssignment) => {
    setMarkGrade(assignment.classId);
    setMarkSubject(assignment.subjectId);
    if (assignment.classId === '9th' || assignment.classId === '10th') {
      setMarkGroup('science');
      setMarkBranch('Science');
    } else {
      setMarkBranch('A');
    }
    onTabChange('marks');
  };

  const handleMarkInputChange = (
    studentId: string,
    field: 'written' | 'mcq' | 'practical',
    rawValue: string,
  ) => {
    const parsed = rawValue === '' ? 0 : parseInt(rawValue.replace(/\D/g, ''), 10) || 0;
    setMarkRows((prev) =>
      prev.map((row) => {
        if (row.id !== studentId) return row;
        const written =
          field === 'written' ? Math.min(markLimits.writtenMax, Math.max(0, parsed)) : row.written;
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
        return {
          ...row,
          written,
          mcq,
          practical,
          total: written + mcq + practical,
        };
      }),
    );
    setMarkDirty(true);
  };

  const handleSaveMarks = () => {
    const res = saveTeacherSubjectMarks({
      session,
      exam: selectedExam,
      grade: markGrade,
      branch: markBranch,
      group: markGroup,
      subject: markSubject,
      rows: markRows,
    });
    if (res.success) {
      setMarkRows(res.normalizedRows);
      setMarkDirty(false);
      setMarkFeedback({ type: 'success', text: res.message });
      onDataChanged?.();
      setTimeout(() => setMarkFeedback(null), 3500);
    } else {
      setMarkFeedback({ type: 'error', text: res.message });
    }
  };

  // Handlers: Attendance
  const persistAttendance = (nextRecords: StudentAttendanceRecord[]) => {
    const res = saveClassTeacherDailyAttendance({
      session,
      date: attDate,
      grade: attGrade,
      branch: attBranch,
      records: nextRecords,
    });
    if (res.success) {
      setAttRecords(nextRecords);
      setAttFeedback({ type: 'success', text: res.message });
      onDataChanged?.();
      setTimeout(() => setAttFeedback(null), 2600);
    } else {
      setAttFeedback({ type: 'error', text: res.message });
    }
  };

  const handleAttStatus = (studentId: string, status: 'Present' | 'Absent' | 'Leave') => {
    const next = attRecords.map((st) =>
      st.id === studentId ? { ...st, status, reason: status === 'Present' ? '' : st.reason } : st,
    );
    persistAttendance(next);
  };

  const handleAttReason = (studentId: string, reason: string) => {
    const next = attRecords.map((st) => (st.id === studentId ? { ...st, reason } : st));
    persistAttendance(next);
  };

  const handleMarkAllAtt = (status: 'Present' | 'Absent') => {
    const next = attRecords.map((st) => ({ ...st, status, reason: '' }));
    persistAttendance(next);
  };

  // Evaluate each mark row once for analytics + filtering
  const evaluatedMarkRows = useMemo(() => {
    return markRows.map((row) => {
      const gradeInfo = evaluateSubjectGradeAndPass(
        {
          cq: row.written,
          mcq: row.mcq,
          practical: row.practical,
          total: row.total,
        },
        {
          fullMarks: markLimits.fullMarks,
          cq: markLimits.writtenMax,
          mcq: markLimits.mcqMax,
          practical: markLimits.practicalMax,
          ca: 0,
          passMarks: Math.floor(markLimits.fullMarks * 0.33),
          passRules: 'পৃথক পাস',
        },
      );
      return { row, gradeInfo };
    });
  }, [markRows, markLimits]);

  const markStats = useMemo(() => {
    const total = evaluatedMarkRows.length;
    const entered = evaluatedMarkRows.filter((e) => e.row.total > 0).length;
    const pending = total - entered;
    const passed = evaluatedMarkRows.filter((e) => e.row.total > 0 && e.gradeInfo.isPassed).length;
    const failed = evaluatedMarkRows.filter((e) => e.row.total > 0 && !e.gradeInfo.isPassed).length;
    const pct = total > 0 ? Math.round((entered / total) * 100) : 0;
    return { total, entered, pending, passed, failed, pct };
  }, [evaluatedMarkRows]);

  const filteredMarkRows = useMemo(() => {
    const q = markSearch.trim().toLowerCase();
    return evaluatedMarkRows.filter(({ row, gradeInfo }) => {
      if (markFilter === 'pending' && row.total > 0) return false;
      if (markFilter === 'fail' && (row.total === 0 || gradeInfo.isPassed)) return false;
      if (!q) return true;
      return row.name.toLowerCase().includes(q) || String(row.roll).toLowerCase().includes(q);
    });
  }, [evaluatedMarkRows, markSearch, markFilter]);

  const filteredAttRecords = useMemo(() => {
    const q = attSearch.trim().toLowerCase();
    return attRecords.filter((r) => {
      if (attStatusFilter !== 'all' && r.status !== attStatusFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        String(r.roll).toLowerCase().includes(q) ||
        String(r.mobile || '').includes(q)
      );
    });
  }, [attRecords, attSearch, attStatusFilter]);

  const attStats = useMemo(() => {
    const present = attRecords.filter((r) => r.status === 'Present').length;
    const absent = attRecords.filter((r) => r.status === 'Absent').length;
    const leave = attRecords.filter((r) => r.status === 'Leave').length;
    const total = attRecords.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, leave, rate };
  }, [attRecords]);

  // Filter routines belonging to this teacher
  const filterTeacherRoutines = useCallback(
    (dayKey: RoutineSlot['day']) => {
      const ids = teacherRBACService
        .resolveTeacherIdentifiers(teacherIdentifier)
        .map((s) => s.toLowerCase().trim());
      return routines
        .filter((r) => r.day === dayKey)
        .filter((r) => {
          if (isAdmin) return true;
          const rName = (r.teacherName || '').toLowerCase().trim();
          const rId = (r.teacherId || '').toLowerCase().trim();
          return ids.some(
            (id) =>
              (rId && rId === id) ||
              (rName && (rName === id || rName.includes(id) || id.includes(rName))),
          );
        })
        .sort((a, b) => a.periodNo - b.periodNo);
    },
    [routines, isAdmin, teacherIdentifier],
  );

  const myTodayRoutines = useMemo(
    () => filterTeacherRoutines(todayRoutineDay),
    [filterTeacherRoutines, todayRoutineDay],
  );
  const myDayRoutines = useMemo(
    () => filterTeacherRoutines(selectedDay),
    [filterTeacherRoutines, selectedDay],
  );

  const sortedNotices = useMemo(() => {
    return [...notices].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [notices]);

  const displayName =
    teacherProfile?.name || session.teacherName || (isAdmin ? 'প্রধান শিক্ষক / অ্যাডমিন' : 'শিক্ষক');
  const displayDesignation =
    teacherProfile?.designation || (isAdmin ? 'প্রশাসনিক প্যানেল' : 'সহকারী শিক্ষক');
  const greeting = useMemo(() => getGreetingBn(), []);
  const todayBn = useMemo(() => formatTodayBn(), []);

  const primaryClassTeacherLabel = useMemo(() => {
    if (isAdmin) return 'সকল শ্রেণি';
    if (myClassTeachers.length === 0) return 'নেই';
    const parsed = parseClassTeacherClassId(myClassTeachers[0].classId);
    return `${gradeLabel(parsed.grade)} (${branchLabel(parsed.branch).split(' ')[0]})`;
  }, [isAdmin, myClassTeachers]);

  return (
    <div className="space-y-4">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* COMPACT CONTEXT SUB-HEADER ON SUB-TABS (MAXIMIZES WORKING VIEWPORT) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab !== 'home' && (
        <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 rounded-2xl px-3 py-2.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => onTabChange('home')}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 transition cursor-pointer"
              aria-label="হোমে ফিরুন"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h2 className="text-xs font-black text-slate-900 dark:text-white truncate">
                {activeTab === 'marks'
                  ? 'বিষয়ভিত্তিক নম্বর এন্ট্রি'
                  : activeTab === 'attendance'
                  ? 'দৈনিক হাজিরা কনসোল'
                  : 'ক্লাস রুটিন ও নোটিশ বোর্ড'}
              </h2>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                {displayName} • {displayDesignation}
              </p>
            </div>
          </div>

          {activeTab === 'marks' && (
            <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 text-[10px] font-black shrink-0">
              {isAdmin ? 'অ্যাডমিন' : '🔒 আপনার বিষয়'}
            </span>
          )}
          {activeTab === 'attendance' && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-black shrink-0 ${
                isClassTeacher
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200/80 dark:border-teal-800'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800'
              }`}
            >
              {isClassTeacher ? <Crown className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {isAdmin ? 'অ্যাডমিন' : isClassTeacher ? 'শ্রেণি শিক্ষক' : 'সংরক্ষিত'}
            </span>
          )}
          {activeTab === 'schedule' && (
            <span className="px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800 text-[10px] font-black shrink-0">
              {toBnDigit(myDayRoutines.length)} পিরিয়ড
            </span>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: EXECUTIVE TEACHER HOME DASHBOARD                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'home' && (
        <div className="space-y-4">
          {/* 🌟 Executive Teacher Profile Hero Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-4 shadow-xl border border-indigo-500/25">
            <div className="pointer-events-none absolute -top-14 -right-14 w-44 h-44 rounded-full bg-indigo-500/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 w-40 h-40 rounded-full bg-teal-400/15 blur-2xl" />

            <div className="relative z-10 space-y-3.5">
              {/* Top Greeting & Date Row */}
              <div className="flex items-center justify-between gap-2 text-[10.5px]">
                <span className="inline-flex items-center gap-1.5 text-indigo-200 font-bold">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  {greeting} • {todayBn}
                </span>
                <Link
                  href={isAdmin ? '/dashboard' : '/dashboard/teacher-portal'}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[10px] font-extrabold transition shrink-0"
                >
                  <span>পূর্ণ পোর্টাল</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>

              {/* Teacher Avatar + Identity */}
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-13 h-13 rounded-2xl overflow-hidden ring-2 ring-indigo-400/50 shadow-lg bg-slate-800">
                    <InitialsAvatar
                      src={teacherProfile?.photoUrl}
                      name={displayName}
                      className="w-full h-full"
                      textClassName="text-base"
                    />
                  </div>
                  <span
                    className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950 absolute -bottom-0.5 -right-0.5"
                    title="সক্রিয়"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-400/20 border border-indigo-400/35 text-indigo-100 text-[9.5px] font-black">
                      {isAdmin ? 'অ্যাডমিন প্যানেল' : 'শিক্ষক পোর্টাল'}
                    </span>
                    {isClassTeacher && !isAdmin && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-200 text-[9.5px] font-black">
                        <Crown className="w-2.5 h-2.5" />
                        শ্রেণি শিক্ষক
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-black tracking-tight mt-1 truncate text-white">
                    {displayName}
                  </h2>
                  <p className="text-[11px] text-slate-300 truncate font-medium">
                    {displayDesignation}
                    {teacherProfile?.id ? ` • ${teacherProfile.id}` : ''}
                    {teacherProfile?.phone ? ` • ${teacherProfile.phone}` : ''}
                  </p>
                </div>
              </div>

              {/* 3-Column Glass KPI Strip */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onTabChange('schedule')}
                  className="rounded-2xl bg-white/8 hover:bg-white/12 border border-white/10 px-2.5 py-2 text-left transition cursor-pointer"
                >
                  <span className="text-[9.5px] text-sky-200 font-bold block">আজকের ক্লাস</span>
                  <span className="text-sm font-black text-white font-mono mt-0.5 block">
                    {toBnDigit(myTodayRoutines.length)}টি
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('marks')}
                  className="rounded-2xl bg-white/8 hover:bg-white/12 border border-white/10 px-2.5 py-2 text-left transition cursor-pointer"
                >
                  <span className="text-[9.5px] text-indigo-200 font-bold block">বরাদ্দ বিষয়</span>
                  <span className="text-sm font-black text-white font-mono mt-0.5 block">
                    {isAdmin ? 'সকল' : `${toBnDigit(myAssignedSubjects.length)}টি`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('attendance')}
                  className="rounded-2xl bg-white/8 hover:bg-white/12 border border-white/10 px-2.5 py-2 text-left transition cursor-pointer"
                >
                  <span className="text-[9.5px] text-emerald-200 font-bold block">আজকের হাজিরা</span>
                  <span className="text-sm font-black text-emerald-300 font-mono mt-0.5 block">
                    {isClassTeacher
                      ? attStats.total > 0
                        ? `${toBnDigit(attStats.rate)}%`
                        : 'বাকি'
                      : 'সংরক্ষিত'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ⏱ Today's Schedule Spotlight */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  আজকের ক্লাস শিডিউল
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedDay(todayRoutineDay);
                  onTabChange('schedule');
                }}
                className="text-[10.5px] font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>পূর্ণ রুটিন</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {myTodayRoutines.length === 0 ? (
              <div className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-between">
                <span>আজ আপনার কোনো নির্ধারিত পিরিয়ড নেই।</span>
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 font-bold">
                  মুক্ত দিন
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {myTodayRoutines.slice(0, 2).map((slot) => {
                  const periodMeta = ROUTINE_PERIODS.find((p) => p.periodNo === slot.periodNo);
                  const activeSub = todaySubstitutions.find(
                    (s) => s.classId === slot.classId && s.periodNo === slot.periodNo,
                  );
                  return (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-sky-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                          {toBnDigit(slot.periodNo)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {slot.subject}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                            {slot.classId} • কক্ষ: {slot.roomNo || 'মূল ভবন'}
                            {activeSub ? ` • প্রক্সি: ${activeSub.substituteTeacherName}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800 text-[10px] font-mono font-black shrink-0">
                        {periodMeta ? periodMeta.startTime : `পি-${toBnDigit(slot.periodNo)}`}
                      </span>
                    </div>
                  );
                })}
                {myTodayRoutines.length > 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDay(todayRoutineDay);
                      onTabChange('schedule');
                    }}
                    className="w-full py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/70 text-[10.5px] font-black text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    + আরও {toBnDigit(myTodayRoutines.length - 2)}টি পিরিয়ড দেখুন
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 🎛 2x2 Modern Quick Action Bento Grid */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onTabChange('marks')}
              className="group relative overflow-hidden p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 text-left shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  <Edit3 className="w-5 h-5" />
                </div>
                {markDirty ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[9px] font-black">
                    অসংরক্ষিত
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">নম্বর এন্ট্রি</h3>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {isAdmin
                    ? 'সকল শ্রেণি ও বিষয়'
                    : myAssignedSubjects.length > 0
                    ? `${toBnDigit(myAssignedSubjects.length)}টি বরাদ্দকৃত বিষয়`
                    : 'বিষয় বরাদ্দ নেই'}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('attendance')}
              className={`group relative overflow-hidden p-4 rounded-2xl border text-left shadow-2xs transition-all cursor-pointer space-y-2.5 ${
                isClassTeacher
                  ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-md'
                  : 'bg-slate-100/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                    isClassTeacher
                      ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isClassTeacher ? <UserCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                {isClassTeacher ? (
                  <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[9px] font-black">
                    {attStats.total > 0 ? `${toBnDigit(attStats.present)}/${toBnDigit(attStats.total)}` : 'শ্রেণি'}
                  </span>
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">দৈনিক হাজিরা</h3>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
                  {isClassTeacher ? primaryClassTeacherLabel : 'শুধু শ্রেণি শিক্ষক'}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('schedule')}
              className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-500 text-left shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[9px] font-black">
                  {toBnDigit(sortedNotices.length)} নোটিশ
                </span>
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">রুটিন ও নোটিশ</h3>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  সাপ্তাহিক পিরিয়ড ও বিজ্ঞপ্তি
                </p>
              </div>
            </button>

            <Link
              href={isAdmin ? '/dashboard' : '/dashboard/teacher-portal?tab=leaves'}
              className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 text-left shadow-2xs hover:shadow-md transition-all space-y-2.5 block"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  <Send className="w-5 h-5" />
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 transition-colors" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  {isAdmin ? 'অ্যাডমিন ড্যাশবোর্ড' : 'ছুটি ও হোমওয়ার্ক'}
                </h3>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {isAdmin ? 'সম্পূর্ণ স্কুল কন্ট্রোল' : 'আবেদন ও পাঠ ব্যবস্থাপনা'}
                </p>
              </div>
            </Link>
          </div>

          {/* 👑 Class Teacher Live Attendance Spotlight */}
          {!isAdmin && myClassTeachers.length > 0 && (
            <div className="bg-gradient-to-br from-teal-50 via-emerald-50/70 to-white dark:from-teal-950/50 dark:via-slate-900 dark:to-slate-900 rounded-2xl p-4 border border-teal-200/90 dark:border-teal-800/60 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-teal-950 dark:text-teal-200">
                  <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                    <Crown className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black">শ্রেণি শিক্ষক দায়িত্ব</h3>
                    <p className="text-[10px] font-semibold text-teal-700 dark:text-teal-300">
                      আজকের উপস্থিতি ও রোল-কল অবস্থা
                    </p>
                  </div>
                </div>
                {attStats.total > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-teal-600 text-white text-[10.5px] font-black font-mono">
                    {toBnDigit(attStats.rate)}%
                  </span>
                )}
              </div>

              {attStats.total > 0 && (
                <div className="space-y-1.5">
                  <div className="w-full h-2 rounded-full bg-teal-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${attStats.rate}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    <span className="text-emerald-700 dark:text-emerald-300">
                      উপস্থিত: {toBnDigit(attStats.present)} জন
                    </span>
                    <span className="text-rose-600 dark:text-rose-400">
                      অনুপস্থিত: {toBnDigit(attStats.absent)} জন
                    </span>
                    <span className="text-amber-600 dark:text-amber-400">
                      ছুটি: {toBnDigit(attStats.leave)} জন
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {myClassTeachers.map((ct) => {
                  const parsed = parseClassTeacherClassId(ct.classId);
                  return (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => {
                        setAttGrade(parsed.grade);
                        setAttBranch(parsed.branch);
                        onTabChange('attendance');
                      }}
                      className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-200/80 dark:border-teal-800 hover:border-teal-400 flex items-center justify-between gap-2 transition cursor-pointer text-left shadow-2xs"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-black text-slate-900 dark:text-white block truncate">
                          {gradeLabel(parsed.grade)} — {branchLabel(parsed.branch)}
                        </span>
                        <span className="text-[10px] text-teal-700 dark:text-teal-300 font-semibold">
                          এক ট্যাপে দৈনিক রোল কল আপডেট করুন
                        </span>
                      </div>
                      <span className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-[10.5px] flex items-center gap-1 shrink-0">
                        <span>হাজিরা নিন</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 📚 Assigned Subjects Quick List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">
                    আমার বরাদ্দকৃত বিষয়সমূহ
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-400">
                    যেকোনো বিষয়ে ট্যাপ করে নম্বর দিন
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-300">
                {toBnDigit(myAssignedSubjects.length)}টি
              </span>
            </div>

            {myAssignedSubjects.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                আপনার অ্যাকাউন্টে এখনো কোনো বিষয় বরাদ্দ করা হয়নি। অ্যাডমিন প্যানেল থেকে বিষয় বরাদ্দ দিলে এখানে দেখতে পাবেন।
              </div>
            ) : (
              <div className="space-y-2">
                {myAssignedSubjects.map((sa, idx) => {
                  const accentColors = [
                    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300',
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
                    'bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300',
                    'bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300',
                  ];
                  const badgeCls = accentColors[idx % accentColors.length];
                  return (
                    <button
                      key={sa.id}
                      type="button"
                      onClick={() => handleSelectAssignedPair(sa)}
                      className="group w-full p-3 rounded-xl bg-slate-50/90 dark:bg-slate-950 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 flex items-center justify-between gap-2.5 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${badgeCls}`}
                        >
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-black text-slate-900 dark:text-white block truncate">
                            {sa.subjectId}
                          </span>
                          <span className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                            {gradeLabel(sa.classId)} • শিক্ষাবর্ষ {toBnDigit(sa.academicYear)}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1.5 rounded-xl bg-indigo-600 group-hover:bg-indigo-700 text-white font-black text-[10px] flex items-center gap-0.5 shrink-0 shadow-2xs">
                        <span>নম্বর</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 🔔 Latest School Notice Preview */}
          {sortedNotices.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">
                    সর্বশেষ নোটিশ
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onTabChange('schedule')}
                  className="text-[10.5px] font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>সব নোটিশ</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {sortedNotices[0].title}
                  </h4>
                  <span className="text-[9.5px] font-bold text-amber-700 dark:text-amber-300 shrink-0">
                    {new Date(sortedNotices[0].publishedAt).toLocaleDateString('bn-BD')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {sortedNotices[0].content}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: PRO ASSIGNED SUBJECT MARK ENTRY STUDIO                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'marks' && (
        <div className="space-y-3">
          {!isAdmin && myAssignedSubjects.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-amber-200 dark:border-amber-800/60 text-center space-y-3 shadow-2xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                কোনো বিষয় বরাদ্দ নেই
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                আপনার অ্যাকাউন্টে এখনো কোনো শ্রেণির বিষয় এসাইন করা হয়নি। শুধুমাত্র বরাদ্দকৃত বিষয়ের নম্বর এন্ট্রি করা যাবে।
              </p>
              {isClassTeacher && (
                <button
                  type="button"
                  onClick={() => onTabChange('attendance')}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black cursor-pointer shadow-sm"
                >
                  দৈনিক হাজিরা নিতে যান →
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Compact Selection & Configuration Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                {/* Exam Selector */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    পরীক্ষা নির্বাচন
                  </label>
                  <select
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                    aria-label="পরীক্ষা নির্বাচন"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
                  >
                    {STANDARD_EXAMS.map((ex) => (
                      <option key={ex} value={ex}>
                        {ex}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assigned Subject Picker (Teacher) OR Grade+Subject Picker (Admin) */}
                {!isAdmin ? (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      বরাদ্দকৃত শ্রেণি ও বিষয় ({toBnDigit(myAssignedSubjects.length)}টি)
                    </label>
                    <select
                      value={`${markGrade}|||${markSubject}`}
                      onChange={(e) => {
                        const [g, sub] = e.target.value.split('|||');
                        if (g) setMarkGrade(g);
                        if (sub) setMarkSubject(sub);
                      }}
                      aria-label="বরাদ্দকৃত শ্রেণি ও বিষয়"
                      className="w-full px-3 py-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-black text-indigo-950 dark:text-indigo-200 outline-none focus:border-indigo-500"
                    >
                      {myAssignedSubjects.map((sa) => (
                        <option key={sa.id} value={`${sa.classId}|||${sa.subjectId}`}>
                          {gradeLabel(sa.classId)} — {sa.subjectId}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">শ্রেণি</label>
                      <select
                        value={markGrade}
                        onChange={(e) => setMarkGrade(e.target.value)}
                        aria-label="শ্রেণি নির্বাচন"
                        className="w-full px-2.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                      >
                        <option value="6th">৬ষ্ঠ শ্রেণি</option>
                        <option value="7th">৭ম শ্রেণি</option>
                        <option value="8th">৮ম শ্রেণি</option>
                        <option value="9th">৯ম শ্রেণি</option>
                        <option value="10th">১০ম শ্রেণি</option>
                      </select>
                    </div>
                    <div className="col-span-7">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">বিষয়</label>
                      <select
                        value={markSubject}
                        onChange={(e) => setMarkSubject(e.target.value)}
                        aria-label="বিষয় নির্বাচন"
                        className="w-full px-2.5 py-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-black text-indigo-950 dark:text-indigo-200"
                      >
                        {adminSubjectsForGrade.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Branch / Group Segmented Control */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
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
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          {branchLabel(br)}
                        </button>
                      ))}
                </div>

                {/* Marks Structure Ribbon */}
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-50/80 to-slate-50 dark:from-indigo-950/40 dark:to-slate-950 border border-indigo-100 dark:border-indigo-900/50 text-[10.5px] font-bold text-slate-600 dark:text-slate-300">
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

              {/* Live Marks Progress & Quick Filter Card */}
              {markRows.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-black text-slate-800 dark:text-slate-200">
                      এন্ট্রি অগ্রগতি: {toBnDigit(markStats.entered)}/{toBnDigit(markStats.total)} জন
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

                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${markStats.pct}%` }}
                    />
                  </div>

                  {/* Quick Filter Chips + Search */}
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
                      placeholder="রোল বা শিক্ষার্থীর নাম খুঁজুন..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Save Feedback Banner */}
              {markFeedback && (
                <div
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border shadow-xs ${
                    markFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {markFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{markFeedback.text}</span>
                </div>
              )}

              {/* Student Mark Input Cards */}
              {filteredMarkRows.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center space-y-1.5">
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-black">
                    কোনো শিক্ষার্থী পাওয়া যায়নি
                  </p>
                  <p className="text-[11px] text-slate-400">
                    ফিল্টার পরিবর্তন করে অথবা অন্য শাখা/বিভাগ নির্বাচন করে দেখুন।
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredMarkRows.map(({ row, gradeInfo }) => {
                    const isPass = gradeInfo.isPassed;
                    const hasEntered = row.total > 0;
                    const accentBorder = !hasEntered
                      ? 'border-l-slate-300 dark:border-l-slate-700'
                      : isPass
                      ? 'border-l-emerald-500'
                      : 'border-l-rose-500';

                    return (
                      <div
                        key={row.id}
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
                              <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                                {row.name}
                              </h4>
                              <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                                মোট: <strong className="text-slate-800 dark:text-slate-200">{toBnDigit(row.total)}</strong> /{' '}
                                {toBnDigit(markLimits.fullMarks)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {hasEntered && (
                              <span
                                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black ${
                                  isPass
                                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200'
                                    : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                                }`}
                              >
                                {gradeInfo.letterGrade}
                              </span>
                            )}
                            {!hasEntered && (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400">
                                বাকি
                              </span>
                            )}
                          </div>
                        </div>

                        <div
                          className={`grid gap-2 ${
                            markLimits.hasMcq && markLimits.hasPractical
                              ? 'grid-cols-3'
                              : markLimits.hasMcq || markLimits.hasPractical
                              ? 'grid-cols-2'
                              : 'grid-cols-1'
                          }`}
                        >
                          <div>
                            <label className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                              লিখিত (সর্বোচ্চ {toBnDigit(markLimits.writtenMax)})
                            </label>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={markLimits.writtenMax}
                              value={row.written === 0 ? '' : row.written}
                              placeholder="0"
                              onChange={(e) => handleMarkInputChange(row.id, 'written', e.target.value)}
                              className={`w-full h-11 px-2.5 rounded-xl border text-base font-black text-slate-900 dark:text-white text-center outline-none transition ${
                                row.written > 0
                                  ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700'
                                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700'
                              } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`}
                            />
                          </div>

                          {markLimits.hasMcq && (
                            <div>
                              <label className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                MCQ (সর্বোচ্চ {toBnDigit(markLimits.mcqMax)})
                              </label>
                              <input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                max={markLimits.mcqMax}
                                value={row.mcq === 0 ? '' : row.mcq}
                                placeholder="0"
                                onChange={(e) => handleMarkInputChange(row.id, 'mcq', e.target.value)}
                                className={`w-full h-11 px-2.5 rounded-xl border text-base font-black text-slate-900 dark:text-white text-center outline-none transition ${
                                  row.mcq > 0
                                    ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700'
                                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700'
                                } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`}
                              />
                            </div>
                          )}

                          {markLimits.hasPractical && (
                            <div>
                              <label className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                ব্যবহারিক (সর্বোচ্চ {toBnDigit(markLimits.practicalMax)})
                              </label>
                              <input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                max={markLimits.practicalMax}
                                value={row.practical === 0 ? '' : row.practical}
                                placeholder="0"
                                onChange={(e) => handleMarkInputChange(row.id, 'practical', e.target.value)}
                                className={`w-full h-11 px-2.5 rounded-xl border text-base font-black text-slate-900 dark:text-white text-center outline-none transition ${
                                  row.practical > 0
                                    ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700'
                                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700'
                                } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Floating Glassmorphic Save Marks Dock */}
                  <div className="sticky bottom-2 pt-2 z-10">
                    <div className="p-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xl">
                      <button
                        type="button"
                        onClick={handleSaveMarks}
                        className={`w-full py-3 rounded-xl font-black text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer ${
                          markDirty
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                        }`}
                      >
                        <Save className="w-4 h-4" />
                        <span>
                          {markDirty
                            ? `পরিবর্তিত নম্বর সংরক্ষণ ও সিঙ্ক করুন (${toBnDigit(markRows.length)} জন)`
                            : `নম্বর সংরক্ষণ ও ক্লাউড সিঙ্ক করুন (${toBnDigit(markRows.length)} জন)`}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: PRO CLASS TEACHER ATTENDANCE CONSOLE                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'attendance' && (
        <div className="space-y-3">
          {!isClassTeacher ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-amber-200/90 dark:border-amber-800/60 text-center space-y-3.5 shadow-2xs">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/60 dark:to-orange-950/40 text-amber-600 dark:text-amber-300 flex items-center justify-center shadow-inner border border-amber-200/60 dark:border-amber-800/50">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  শুধুমাত্র শ্রেণি শিক্ষকের জন্য অনুমোদিত
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  আপনাকে বর্তমানে কোনো শ্রেণির <strong>শ্রেণি শিক্ষক (Class Teacher)</strong> হিসেবে নিযুক্ত করা হয়নি। শুধুমাত্র নির্ধারিত শ্রেণি শিক্ষক তাঁর নিজ শ্রেণির দৈনিক হাজিরা গ্রহণ করতে পারবেন।
                </p>
              </div>
              <button
                type="button"
                onClick={() => onTabChange('marks')}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer shadow-sm"
              >
                বরাদ্দকৃত বিষয়ের নম্বর এন্ট্রিতে যান →
              </button>
            </div>
          ) : (
            <>
              {/* Class, Date & Live Percentage Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-teal-200/90 dark:border-teal-800/60 shadow-2xs space-y-3">
                <div className="grid grid-cols-12 gap-2">
                  {!isAdmin ? (
                    <div className="col-span-7">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        আপনার নির্ধারিত শ্রেণি
                      </label>
                      <select
                        value={`${attGrade}-${attBranch}`}
                        onChange={(e) => {
                          const parsed = parseClassTeacherClassId(e.target.value);
                          setAttGrade(parsed.grade);
                          setAttBranch(parsed.branch);
                        }}
                        aria-label="শ্রেণি শিক্ষক শ্রেণি"
                        className="w-full px-2.5 py-2.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs font-black text-teal-950 dark:text-teal-200 outline-none"
                      >
                        {myClassTeachers.map((ct) => {
                          const parsed = parseClassTeacherClassId(ct.classId);
                          return (
                            <option key={ct.id} value={`${parsed.grade}-${parsed.branch}`}>
                              {gradeLabel(parsed.grade)} — {branchLabel(parsed.branch)}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="col-span-4">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">শ্রেণি</label>
                        <select
                          value={attGrade}
                          onChange={(e) => {
                            const g = e.target.value;
                            setAttGrade(g);
                            setAttBranch(g === '9th' || g === '10th' ? 'Science' : 'A');
                          }}
                          className="w-full px-2 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                        >
                          <option value="6th">৬ষ্ঠ</option>
                          <option value="7th">৭ম</option>
                          <option value="8th">৮ম</option>
                          <option value="9th">৯ম</option>
                          <option value="10th">১০ম</option>
                        </select>
                      </div>
                      <div className="col-span-3">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">শাখা</label>
                        <select
                          value={attBranch}
                          onChange={(e) => setAttBranch(e.target.value)}
                          className="w-full px-2 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                        >
                          {isAttClass9or10 ? (
                            <>
                              <option value="Science">বিজ্ঞান</option>
                              <option value="Humanities">মানবিক</option>
                              <option value="Commerce">ব্যবসায়</option>
                            </>
                          ) : (
                            <>
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                            </>
                          )}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="col-span-5">
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">তারিখ</label>
                    <input
                      type="date"
                      value={attDate}
                      onChange={(e) => setAttDate(e.target.value)}
                      className="w-full px-2 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Animated Attendance Rate Bar */}
                {attStats.total > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-black text-slate-700 dark:text-slate-300">
                        উপস্থিতির হার
                      </span>
                      <span className="font-mono font-black text-teal-700 dark:text-teal-300">
                        {toBnDigit(attStats.rate)}% ({toBnDigit(attStats.present)}/{toBnDigit(attStats.total)})
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${(attStats.present / attStats.total) * 100}%` }}
                      />
                      <div
                        className="h-full bg-amber-400 transition-all duration-300"
                        style={{ width: `${(attStats.leave / attStats.total) * 100}%` }}
                      />
                      <div
                        className="h-full bg-rose-500 transition-all duration-300"
                        style={{ width: `${(attStats.absent / attStats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Interactive Filterable KPI Tiles */}
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {(
                    [
                      {
                        key: 'all',
                        label: 'মোট',
                        val: attStats.total,
                        base: 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white',
                        active: 'ring-2 ring-slate-900 dark:ring-white',
                      },
                      {
                        key: 'Present',
                        label: 'উপস্থিত',
                        val: attStats.present,
                        base: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300',
                        active: 'ring-2 ring-emerald-500',
                      },
                      {
                        key: 'Absent',
                        label: 'অনুপস্থিত',
                        val: attStats.absent,
                        base: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300',
                        active: 'ring-2 ring-rose-500',
                      },
                      {
                        key: 'Leave',
                        label: 'ছুটি',
                        val: attStats.leave,
                        base: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300',
                        active: 'ring-2 ring-amber-500',
                      },
                    ] as const
                  ).map((tile) => (
                    <button
                      key={tile.key}
                      type="button"
                      onClick={() => setAttStatusFilter(tile.key)}
                      className={`p-2 rounded-xl border transition cursor-pointer ${tile.base} ${
                        attStatusFilter === tile.key ? tile.active : ''
                      }`}
                    >
                      <span className="text-sm font-black block font-mono leading-tight">
                        {toBnDigit(tile.val)}
                      </span>
                      <span className="text-[9.5px] font-bold opacity-80">{tile.label}</span>
                    </button>
                  ))}
                </div>

                {/* Quick Mark-All + Search */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarkAllAtt('Present')}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black cursor-pointer flex items-center justify-center gap-1 shadow-2xs transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>সবাই উপস্থিত</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAllAtt('Absent')}
                    className="flex-1 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-black cursor-pointer flex items-center justify-center gap-1 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>সবাই অনুপস্থিত</span>
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={attSearch}
                    onChange={(e) => setAttSearch(e.target.value)}
                    placeholder="রোল, নাম বা অভিভাবকের নম্বর খুঁজুন..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {attFeedback && (
                <div
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border shadow-xs ${
                    attFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {attFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{attFeedback.text}</span>
                </div>
              )}

              {/* Attendance Roll-Call List */}
              {filteredAttRecords.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 font-bold">
                  {attRecords.length === 0
                    ? 'এই শ্রেণিতে কোনো শিক্ষার্থী নিবন্ধিত নেই।'
                    : 'নির্বাচিত ফিল্টারে কোনো শিক্ষার্থী নেই।'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredAttRecords.map((st) => {
                    const rollBg =
                      st.status === 'Present'
                        ? 'bg-emerald-600 text-white'
                        : st.status === 'Absent'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-500 text-slate-950';
                    const cardTone =
                      st.status === 'Present'
                        ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 border-l-emerald-500'
                        : st.status === 'Absent'
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/90 dark:border-rose-800/60 border-l-rose-500'
                        : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/90 dark:border-amber-800/60 border-l-amber-500';

                    return (
                      <div
                        key={st.id}
                        className={`p-3 rounded-2xl border border-l-4 transition shadow-2xs space-y-2.5 ${cardTone}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-8 h-8 rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 ${rollBg}`}
                            >
                              {st.roll}
                            </span>
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                                {st.name}
                              </h4>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">
                                {st.guardian}
                                {st.mobile ? ` • ${st.mobile}` : ''}
                              </p>
                            </div>
                          </div>

                          {st.mobile && (
                            <a
                              href={`tel:${st.mobile}`}
                              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-600 dark:text-slate-300 hover:text-emerald-700 flex items-center justify-center shrink-0 transition"
                              title="অভিভাবককে কল করুন"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAttStatus(st.id, 'Present')}
                            className={`py-2 rounded-xl text-[11px] font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                              st.status === 'Present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>উপস্থিত</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAttStatus(st.id, 'Absent')}
                            className={`py-2 rounded-xl text-[11px] font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                              st.status === 'Absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>অনুপস্থিত</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAttStatus(st.id, 'Leave')}
                            className={`py-2 rounded-xl text-[11px] font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                              st.status === 'Leave'
                                ? 'bg-amber-500 text-slate-950 shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>ছুটি</span>
                          </button>
                        </div>

                        {(st.status === 'Absent' || st.status === 'Leave') && (
                          <div className="space-y-1.5 pt-0.5">
                            <div className="flex items-center gap-1 flex-wrap">
                              {QUICK_ABSENT_REASONS.map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => handleAttReason(st.id, preset)}
                                  className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition cursor-pointer ${
                                    st.reason === preset
                                      ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              value={st.reason || ''}
                              onChange={(e) => handleAttReason(st.id, e.target.value)}
                              placeholder="অন্য কোনো কারণ লিখুন..."
                              className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[11px] font-medium outline-none focus:border-teal-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: ROUTINE TIMELINE, NOTICES & FULL PORTAL HUB                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {/* Weekly Routine Timeline */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  আমার সাপ্তাহিক ক্লাস রুটিন
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {toBnDigit(myDayRoutines.length)}টি ক্লাস
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {ROUTINE_DAYS.map((d) => {
                const isToday = d.key === todayRoutineDay;
                const isSelected = selectedDay === d.key;
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setSelectedDay(d.key)}
                    className={`relative px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 cursor-pointer transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span>{d.labelBn}</span>
                    {isToday && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full inline-block ml-1 align-middle ${
                          isSelected ? 'bg-amber-300' : 'bg-emerald-500'
                        }`}
                        title="আজ"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {myDayRoutines.length === 0 ? (
              <div className="py-5 text-center space-y-1 rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500">
                  এই দিনে আপনার কোনো নির্ধারিত পিরিয়ড নেই
                </p>
                <p className="text-[10.5px] text-slate-400">অন্য দিন নির্বাচন করে রুটিন দেখুন।</p>
              </div>
            ) : (
              <div className="relative space-y-2.5 pl-4 before:content-[''] before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-100 dark:before:bg-indigo-900/60">
                {myDayRoutines.map((slot) => {
                  const periodMeta = ROUTINE_PERIODS.find((p) => p.periodNo === slot.periodNo);
                  const activeSub = todaySubstitutions.find(
                    (s) => s.classId === slot.classId && s.periodNo === slot.periodNo,
                  );
                  return (
                    <div key={slot.id} className="relative">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-50 dark:ring-slate-900 absolute -left-[15.5px] top-3.5" />
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {slot.subject}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9.5px] font-black">
                              {slot.classId}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                            কক্ষ: {slot.roomNo || 'মূল ভবন'}
                            {activeSub && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                                প্রক্সি: {activeSub.substituteTeacherName}
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-lg bg-indigo-100/80 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 text-[10px] font-mono font-black shrink-0">
                          {periodMeta
                            ? `${periodMeta.startTime}-${periodMeta.endTime}`
                            : `পিরিয়ড ${toBnDigit(slot.periodNo)}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Priority-Badged School Notice Board */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  প্রতিষ্ঠানের নোটিশ বোর্ড
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {toBnDigit(sortedNotices.length)}টি
              </span>
            </div>

            {sortedNotices.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">কোনো নতুন নোটিশ নেই।</p>
            ) : (
              <div className="space-y-2">
                {sortedNotices.slice(0, 6).map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border space-y-1.5 ${
                      n.priority === 'urgent'
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-800/50'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        {n.isPinned && <Pin className="w-3 h-3 text-indigo-600 shrink-0" />}
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">
                          {n.title}
                        </h4>
                        {n.priority === 'urgent' && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black">
                            জরুরি
                          </span>
                        )}
                        {n.priority === 'important' && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black">
                            গুরুত্বপূর্ণ
                          </span>
                        )}
                      </div>
                      <span className="text-[9.5px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                        {new Date(n.publishedAt).toLocaleDateString('bn-BD')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Full Teacher Portal Quick Modules Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-black text-slate-900 dark:text-white">
                পূর্ণ শিক্ষক পোর্টাল মডিউলসমূহ
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  href: isAdmin ? '/dashboard/leaves' : '/dashboard/teacher-portal?tab=leaves',
                  label: 'ছুটির আবেদন',
                  icon: Send,
                  tone: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
                },
                {
                  href: isAdmin ? '/dashboard/routine' : '/dashboard/teacher-portal?tab=homework',
                  label: isAdmin ? 'ক্লাস রুটিন' : 'ডিজিটাল হোমওয়ার্ক',
                  icon: FileText,
                  tone: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40',
                },
                {
                  href: isAdmin ? '/dashboard/students' : '/dashboard/teacher-portal?tab=students',
                  label: 'শিক্ষার্থী ও ফি',
                  icon: Users,
                  tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
                },
                {
                  href: isAdmin ? '/dashboard/settings' : '/dashboard/teacher-portal?tab=profile',
                  label: 'প্রোফাইল ও লগ',
                  icon: User,
                  tone: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 transition"
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.tone}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 leading-tight">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
