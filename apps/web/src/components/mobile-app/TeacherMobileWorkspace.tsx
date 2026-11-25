'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Edit3,
  ExternalLink,
  GraduationCap,
  Lock,
  Send,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { UserSession } from '@/services/teacherAuthService';
import {
  teacherRBACService,
  SubjectAssignment,
  ClassTeacherAssignment,
  TeacherRecord,
} from '@/services/teacherRBACService';
import { attendanceService } from '@/services/attendanceService';
import { Notice } from '@/services/noticeService';
import {
  RoutineSlot,
  ROUTINE_PERIODS,
  SubstitutionRecord,
  routineService,
} from '@/services/routineService';
import { localDateKey } from '@/lib/dateUtils';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import InitialsAvatar from '@/components/public/InitialsAvatar';
import { GroupKey, parseClassTeacherClassId } from '@/lib/teacherMobileUtils';
import RapidMarksEntryPanel from './RapidMarksEntryPanel';
import AutoSaveAttendancePanel from './AutoSaveAttendancePanel';
import TeacherToolsPanel, { TeacherToolSubTab } from './TeacherToolsPanel';

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
    A: 'ক শাখা',
    B: 'খ শাখা',
    C: 'গ শাখা',
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

  // Shared marks context (allows 1-tap jump from Home's Assigned Subjects list)
  const [markGrade, setMarkGrade] = useState<string>('6th');
  const [markBranch, setMarkBranch] = useState<string>('A');
  const [markGroup, setMarkGroup] = useState<GroupKey>('science');
  const [markSubject, setMarkSubject] = useState<string>('');
  const [markDirty, setMarkDirty] = useState<boolean>(false);

  // Shared attendance context (allows 1-tap jump from Home's Class Teacher card)
  const [attGrade, setAttGrade] = useState<string>('6th');
  const [attBranch, setAttBranch] = useState<string>('A');
  const [attStats, setAttStats] = useState({ total: 0, present: 0, absent: 0, leave: 0, rate: 0 });

  // Tools sub-tab deep jump from Home
  const [toolSubTab, setToolSubTab] = useState<TeacherToolSubTab>('routine');

  // Load RBAC profile & assignments once per session change
  useEffect(() => {
    const allTeachers = teacherRBACService.getTeachers();
    const me =
      allTeachers.find(
        (t) =>
          t.id === session.teacherId ||
          t.phone === session.teacherId ||
          (session.teacherName && t.name === session.teacherName)
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
      const recs = attendanceService.getAttendance(localDateKey(), parsed.grade, parsed.branch);
      const present = recs.filter((r) => r.status === 'Present').length;
      const absent = recs.filter((r) => r.status === 'Absent').length;
      const leave = recs.filter((r) => r.status === 'Leave').length;
      const total = recs.length;
      setAttStats({ total, present, absent, leave, rate: total > 0 ? Math.round((present / total) * 100) : 0 });
    }
  }, [isAdmin, session.teacherId, session.teacherName, teacherIdentifier]);

  const handleDirtyChange = useCallback(
    (dirty: boolean) => {
      setMarkDirty(dirty);
      onDirtyMarksChange?.(dirty);
    },
    [onDirtyMarksChange]
  );

  const isClassTeacher = isAdmin || myClassTeachers.length > 0;
  const todayRoutineDay = useMemo<RoutineSlot['day']>(() => {
    return routineService.getDayFromDate(localDateKey()) || 'Sunday';
  }, []);

  const myTodayRoutines = useMemo(() => {
    const ids = teacherRBACService
      .resolveTeacherIdentifiers(teacherIdentifier)
      .map((s) => s.toLowerCase().trim());
    return routines
      .filter((r) => r.day === todayRoutineDay)
      .filter((r) => {
        if (isAdmin) return true;
        const rName = (r.teacherName || '').toLowerCase().trim();
        const rId = (r.teacherId || '').toLowerCase().trim();
        return ids.some(
          (id) => (rId && rId === id) || (rName && (rName === id || rName.includes(id) || id.includes(rName)))
        );
      })
      .sort((a, b) => a.periodNo - b.periodNo);
  }, [routines, todayRoutineDay, isAdmin, teacherIdentifier]);

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
    if (myClassTeachers.length === 0) return 'শুধু শ্রেণি শিক্ষক';
    const parsed = parseClassTeacherClassId(myClassTeachers[0].classId);
    return `${gradeLabel(parsed.grade)} (${branchLabel(parsed.branch).split(' ')[0]})`;
  }, [isAdmin, myClassTeachers]);

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

  return (
    <div className="space-y-3.5">
      {/* Compact Context Sub-Header on Sub-Tabs */}
      {activeTab !== 'home' && (
        <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 rounded-2xl px-3 py-2 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => onTabChange('home')}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 transition cursor-pointer"
              aria-label="হোমে ফিরুন"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h2 className="text-xs font-black text-slate-900 dark:text-white truncate">
                {activeTab === 'marks'
                  ? 'দ্রুত ফলাফল ও নম্বর এন্ট্রি'
                  : activeTab === 'attendance'
                  ? 'অটো-সেভ দৈনিক হাজিরা'
                  : 'দৈনন্দিন শিক্ষক কার্যক্রম'}
              </h2>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                {displayName} • {displayDesignation}
              </p>
            </div>
          </div>

          {activeTab === 'marks' && (
            <span className="px-2 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 text-[10px] font-black shrink-0">
              {isAdmin ? 'অ্যাডমিন' : 'বরাদ্দ বিষয়'}
            </span>
          )}
          {activeTab === 'attendance' && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl border text-[10px] font-black shrink-0 ${
                isClassTeacher
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200/80 dark:border-teal-800'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800'
              }`}
            >
              {isClassTeacher ? <Crown className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {isAdmin ? 'অ্যাডমিন' : isClassTeacher ? 'শ্রেণি শিক্ষক' : 'সংরক্ষিত'}
            </span>
          )}
        </div>
      )}

      {/* TAB 1: TEACHER HOME DASHBOARD */}
      {activeTab === 'home' && (
        <div className="space-y-3.5">
          {/* Executive Teacher Profile Hero Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-4 shadow-lg border border-indigo-500/25">
            <div className="pointer-events-none absolute -top-14 -right-14 w-40 h-40 rounded-full bg-indigo-500/20 blur-2xl" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between gap-2 text-[10.5px]">
                <span className="inline-flex items-center gap-1.5 text-indigo-200 font-bold">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  {greeting} • {todayBn}
                </span>
                <Link
                  href={isAdmin ? '/dashboard' : '/dashboard/teacher-portal'}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[10px] font-extrabold transition shrink-0"
                >
                  <span>ওয়েব পোর্টাল</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-indigo-400/50 bg-slate-800">
                    <InitialsAvatar
                      src={teacherProfile?.photoUrl}
                      name={displayName}
                      className="w-full h-full"
                      textClassName="text-sm"
                    />
                  </div>
                  <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 absolute -bottom-0.5 -right-0.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-400/20 border border-indigo-400/35 text-indigo-100 text-[9.5px] font-black">
                      {isAdmin ? 'অ্যাডমিন প্যানেল' : 'শিক্ষক প্যানেল'}
                    </span>
                    {isClassTeacher && !isAdmin && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-200 text-[9.5px] font-black">
                        <Crown className="w-2.5 h-2.5" />
                        শ্রেণি শিক্ষক
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-black tracking-tight mt-0.5 truncate text-white">{displayName}</h2>
                  <p className="text-[11px] text-slate-300 truncate font-medium">
                    {displayDesignation}
                    {teacherProfile?.phone ? ` • ${teacherProfile.phone}` : ''}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setToolSubTab('routine');
                    onTabChange('schedule');
                  }}
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
                    {isClassTeacher ? (attStats.total > 0 ? `${toBnDigit(attStats.rate)}%` : 'শুরু') : 'লকড'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 2x2 Quick Action Bento Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onTabChange('marks')}
              className="group p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 text-left shadow-2xs transition cursor-pointer space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-sm">
                  <Edit3 className="w-4 h-4" />
                </div>
                {markDirty ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black">
                    সিঙ্কিং
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">দ্রুত নম্বর এন্ট্রি</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  অটো-সেভ • {isAdmin ? 'সকল বিষয়' : `${toBnDigit(myAssignedSubjects.length)}টি বিষয়`}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('attendance')}
              className={`group p-3.5 rounded-2xl border text-left shadow-2xs transition cursor-pointer space-y-2 ${
                isClassTeacher
                  ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-teal-400'
                  : 'bg-slate-100/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isClassTeacher
                      ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {isClassTeacher ? <UserCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
                {isClassTeacher ? (
                  <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[9px] font-black">
                    অটো-সেভ
                  </span>
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">দৈনিক হাজিরা</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {primaryClassTeacherLabel}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setToolSubTab('homework');
                onTabChange('schedule');
              }}
              className="group p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-violet-400 text-left shadow-2xs transition cursor-pointer space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-sm">
                  <BookOpen className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">হোমওয়ার্ক ও পাঠ</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  সরাসরি পাঠ প্রকাশ করুন
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setToolSubTab('leave');
                onTabChange('schedule');
              }}
              className="group p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 text-left shadow-2xs transition cursor-pointer space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-sm">
                  <Send className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">ছুটির আবেদন</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  আবেদন ও স্ট্যাটাস দেখুন
                </p>
              </div>
            </button>
          </div>

          {/* Class Teacher Spotlight */}
          {!isAdmin && myClassTeachers.length > 0 && (
            <div className="bg-gradient-to-br from-teal-50 via-emerald-50/60 to-white dark:from-teal-950/50 dark:via-slate-900 dark:to-slate-900 rounded-2xl p-3.5 border border-teal-200/90 dark:border-teal-800/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-teal-950 dark:text-teal-200 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-teal-600" />
                  শ্রেণি শিক্ষক রোল-কল
                </span>
                {attStats.total > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-black font-mono">
                    উপস্থিত {toBnDigit(attStats.present)}/{toBnDigit(attStats.total)}
                  </span>
                )}
              </div>
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
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200/80 dark:border-teal-800 flex items-center justify-between gap-2 cursor-pointer text-left"
                  >
                    <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {gradeLabel(parsed.grade)} — {branchLabel(parsed.branch)}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-teal-600 text-white text-[10.5px] font-black shrink-0">
                      হাজিরা নিন →
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Assigned Subjects Quick Launch */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                বরাদ্দকৃত বিষয় (১-ট্যাপ নম্বর এন্ট্রি)
              </h3>
              <span className="text-[10px] font-black text-slate-500">{toBnDigit(myAssignedSubjects.length)}টি</span>
            </div>

            {myAssignedSubjects.length === 0 ? (
              <p className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200/80 dark:border-amber-800/50">
                এখনো কোনো বিষয় বরাদ্দ করা হয়নি।
              </p>
            ) : (
              <div className="space-y-1.5">
                {myAssignedSubjects.map((sa) => (
                  <button
                    key={sa.id}
                    type="button"
                    onClick={() => handleSelectAssignedPair(sa)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 transition cursor-pointer text-left"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-black text-slate-900 dark:text-white block truncate">
                        {sa.subjectId}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {gradeLabel(sa.classId)} • {toBnDigit(sa.academicYear)}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-black shrink-0">
                      নম্বর দিন →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Today's Classes Preview */}
          {myTodayRoutines.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  আজকের ক্লাস শিডিউল
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setToolSubTab('routine');
                    onTabChange('schedule');
                  }}
                  className="text-[10.5px] font-black text-indigo-600 dark:text-indigo-400 cursor-pointer"
                >
                  পূর্ণ রুটিন →
                </button>
              </div>
              {myTodayRoutines.slice(0, 2).map((slot) => {
                const periodMeta = ROUTINE_PERIODS.find((p) => p.periodNo === slot.periodNo);
                return (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">{slot.subject}</p>
                      <p className="text-[10px] text-slate-500">{slot.classId} • কক্ষ: {slot.roomNo || 'মূল ভবন'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-black shrink-0">
                      {periodMeta ? periodMeta.startTime : `পি-${toBnDigit(slot.periodNo)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Latest Notice Preview */}
          {sortedNotices.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setToolSubTab('notices');
                onTabChange('schedule');
              }}
              className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs text-left space-y-1 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10.5px] font-black text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5" /> সর্বশেষ নোটিশ
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {new Date(sortedNotices[0].publishedAt).toLocaleDateString('bn-BD')}
                </span>
              </div>
              <p className="text-xs font-black text-slate-900 dark:text-white truncate">{sortedNotices[0].title}</p>
            </button>
          )}
        </div>
      )}

      {/* TAB 2: RAPID AUTO-SAVE MARKS ENTRY */}
      {activeTab === 'marks' && (
        <RapidMarksEntryPanel
          session={session}
          isAdmin={isAdmin}
          teacherIdentifier={teacherIdentifier}
          myAssignedSubjects={myAssignedSubjects}
          isClassTeacher={isClassTeacher}
          markGrade={markGrade}
          setMarkGrade={setMarkGrade}
          markBranch={markBranch}
          setMarkBranch={setMarkBranch}
          markGroup={markGroup}
          setMarkGroup={setMarkGroup}
          markSubject={markSubject}
          setMarkSubject={setMarkSubject}
          onGoToAttendance={() => onTabChange('attendance')}
          onDirtyChange={handleDirtyChange}
        />
      )}

      {/* TAB 3: INSTANT AUTO-SAVE ATTENDANCE */}
      {activeTab === 'attendance' && (
        <AutoSaveAttendancePanel
          session={session}
          isAdmin={isAdmin}
          teacherIdentifier={teacherIdentifier}
          myClassTeachers={myClassTeachers}
          attGrade={attGrade}
          setAttGrade={setAttGrade}
          attBranch={attBranch}
          setAttBranch={setAttBranch}
          onGoToMarks={() => onTabChange('marks')}
          onStatsChange={setAttStats}
        />
      )}

      {/* TAB 4: IN-APP TEACHER TOOLS (ROUTINE, HOMEWORK, LEAVE, NOTICES, PASSWORD) */}
      {activeTab === 'schedule' && (
        <TeacherToolsPanel
          session={session}
          isAdmin={isAdmin}
          teacherProfile={teacherProfile}
          teacherIdentifier={teacherIdentifier}
          myAssignedSubjects={myAssignedSubjects}
          routines={routines}
          todaySubstitutions={todaySubstitutions}
          notices={notices}
          initialSubTab={toolSubTab}
          onDataChanged={onDataChanged}
        />
      )}
    </div>
  );
}
