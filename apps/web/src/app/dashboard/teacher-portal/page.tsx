'use client';

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  Home,
  Lock,
  LogOut,
  Pencil,
  Send,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  teacherAuthService,
  type UserSession,
} from '@/services/teacherAuthService';
import {
  teacherRBACService,
  type ClassTeacherAssignment,
  type SubjectAssignment,
  type TeacherRecord,
} from '@/services/teacherRBACService';
import { studentService, type Student } from '@/services/studentService';
import {
  financeService,
  type StudentFeeLedger,
} from '@/services/financeService';
import { noticeService, type Notice } from '@/services/noticeService';
import { leaveService, type LeaveApplication } from '@/services/leaveService';
import {
  routineService,
  type RoutineSlot,
  type SubstitutionRecord,
} from '@/services/routineService';
import {
  homeworkService,
  type HomeworkAssignment,
} from '@/services/homeworkService';
import { localDateKey } from '@/lib/dateUtils';
import {
  computeTodayAttendanceSummary,
  getTodayRoutineDay,
  isTeacherRoutineSlot,
  isTeacherSubstitution,
  isValidPortalTab,
  resolveClassTeacherStudents,
  sortGradeKeys,
  type TeacherAuditLog,
  type TeacherPortalTab,
  toBnDigit,
  type TodayAttendanceSummary,
} from '@/components/teacher-portal/teacherPortalUtils';
import TeacherPortalHomeTab from '@/components/teacher-portal/TeacherPortalHomeTab';
import {
  TeacherPortalAttendanceTab,
  TeacherPortalHomeworkTab,
  TeacherPortalMarksTab,
  TeacherPortalRoutineTab,
} from '@/components/teacher-portal/TeacherPortalAcademicsTabs';
import TeacherPortalStudentsTab from '@/components/teacher-portal/TeacherPortalStudentsTab';
import {
  TeacherLeaveSlipModal,
  TeacherPortalLeavesTab,
  TeacherPortalNoticesTab,
} from '@/components/teacher-portal/TeacherPortalLeavesAndNoticesTab';
import TeacherPortalProfileTab from '@/components/teacher-portal/TeacherPortalProfileTab';

const PORTAL_NAV_TABS: Array<{
  id: TeacherPortalTab;
  label: string;
  mobileLabel?: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'home',
    label: 'হোম / আজকের সারসংক্ষেপ',
    mobileLabel: 'হোম',
    icon: <Home size={14} />,
  },
  {
    id: 'routine',
    label: 'আজকের রুটিন',
    icon: <Calendar size={14} />,
  },
  {
    id: 'attendance',
    label: 'হাজিরা',
    icon: <UserCheck size={14} />,
  },
  {
    id: 'marks',
    label: 'নম্বর এন্ট্রি',
    icon: <Pencil size={14} />,
  },
  {
    id: 'students',
    label: 'আমার শ্রেণি',
    icon: <Users size={14} />,
  },
  {
    id: 'homework',
    label: 'হোমওয়ার্ক',
    icon: <BookOpen size={14} />,
  },
  {
    id: 'leaves',
    label: 'ছুটির আবেদন',
    icon: <Send size={14} />,
  },
  {
    id: 'notices',
    label: 'নোটিশ',
    icon: <Bell size={14} />,
  },
  {
    id: 'profile',
    label: 'প্রোফাইল',
    icon: <User size={14} />,
  },
];

function TeacherPortalSkeleton() {
  return (
    <div className="w-full" suppressHydrationWarning>
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-[1600px] mx-auto animate-pulse flex items-center justify-between gap-3">
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0"
              />
            ))}
          </div>
          <div className="h-9 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0 hidden sm:block" />
        </div>
      </div>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="animate-pulse h-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
        <div className="animate-pulse h-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
      </div>
    </div>
  );
}

function TeacherPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const urlTabParam = searchParams?.get('tab') ?? null;
  const [optimisticTab, setOptimisticTab] = useState<{
    forUrl: string | null;
    tab: TeacherPortalTab;
  } | null>(null);

  const activeTab: TeacherPortalTab =
    optimisticTab && optimisticTab.forUrl === urlTabParam
      ? optimisticTab.tab
      : isValidPortalTab(urlTabParam)
      ? urlTabParam
      : 'home';

  // Session & RBAC scoped data
  const [session, setSession] = useState<UserSession | null>(null);
  const [teacher, setTeacher] = useState<TeacherRecord | null>(null);
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [classTeachers, setClassTeachers] = useState<ClassTeacherAssignment[]>([]);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [studentLedgers, setStudentLedgers] = useState<
    Record<string, StudentFeeLedger>
  >({});
  const [notices, setNotices] = useState<Notice[]>([]);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [routines, setRoutines] = useState<RoutineSlot[]>([]);
  const [todaySubstitutions, setTodaySubstitutions] = useState<
    SubstitutionRecord[]
  >([]);
  const [homeworks, setHomeworks] = useState<HomeworkAssignment[]>([]);
  const [auditLogs, setAuditLogs] = useState<TeacherAuditLog[]>([]);
  const [todayAttendance, setTodayAttendance] =
    useState<TodayAttendanceSummary | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Routine tab UI state (defaults to today's routine weekday)
  const todayRoutineDay = useMemo(() => getTodayRoutineDay(), []);
  const [selectedRoutineDay, setSelectedRoutineDay] =
    useState<RoutineSlot['day']>(todayRoutineDay);
  const [routineViewMode, setRoutineViewMode] = useState<'my' | 'full'>('my');

  // Print Leave Slip Modal & Alert Banner
  const [printSlipLeave, setPrintSlipLeave] =
    useState<LeaveApplication | null>(null);
  const [alertMsg, setAlertMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showAlert = useCallback((type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4500);
  }, []);

  const handleSwitchTab = (nextTab: TeacherPortalTab) => {
    setOptimisticTab({ forUrl: urlTabParam, tab: nextTab });
    router.replace(`/dashboard/teacher-portal?tab=${nextTab}`, {
      scroll: false,
    });
  };

  // ─── Data Loader (Strict RBAC Scoping Preserved) ──────────────────────────
  const loadAllPortalData = useCallback(() => {
    const s = teacherAuthService.getSession();
    if (!s || (s.role !== 'teacher' && s.role !== 'admin')) {
      router.push('/login');
      return;
    }
    setSession(s);

    const teachers = teacherRBACService.getTeachers();
    const me =
      teachers.find(
        (t) =>
          t.id === s.teacherId ||
          t.name === s.teacherName ||
          t.phone === s.teacherId
      ) || (s.role === 'admin' ? teachers[0] : undefined);
    setTeacher(me || null);

    const myId = me?.id || s.teacherId || s.teacherName || '';

    // 1. Scoped Subject Assignments (RBAC)
    const allAssignments = teacherRBACService.getSubjectAssignments();
    const myAssignments =
      s.role === 'admin'
        ? allAssignments
        : allAssignments.filter(
            (a) =>
              a.teacherId === myId ||
              a.teacherId === s.teacherId ||
              a.teacherId === s.teacherName
          );
    setAssignments(myAssignments);

    // 2. Scoped Class Teacher Assignments (RBAC)
    const allCT = teacherRBACService.getClassTeachers();
    const myCT =
      s.role === 'admin'
        ? allCT
        : allCT.filter(
            (ct) =>
              ct.teacherId === myId ||
              ct.teacherId === s.teacherId ||
              ct.teacherId === s.teacherName
          );
    setClassTeachers(myCT);

    // 3. Class Students & View-only Fee Ledgers (Class Teacher Only)
    const allStudents = studentService.getAllStudents();
    const resolvedClassStudents = resolveClassTeacherStudents(myCT, allStudents);
    setClassStudents(resolvedClassStudents);

    if (resolvedClassStudents.length > 0) {
      const ledgers: Record<string, StudentFeeLedger> = {};
      resolvedClassStudents.forEach((st) => {
        ledgers[st.id] = financeService.getStudentFeeLedger(
          st.id,
          st.grade,
          st.isStipend
        );
      });
      setStudentLedgers(ledgers);
    } else {
      setStudentLedgers({});
    }

    // 4. Notices, Leaves, Routines, Today's Substitutions, Homeworks
    setNotices(noticeService.getNotices());
    setLeaves(leaveService.getTeacherLeaves(myId));
    setRoutines(routineService.getRoutines());
    setTodaySubstitutions(routineService.getSubstitutions(localDateKey()));
    setHomeworks(homeworkService.getHomeworks({ includeArchived: true }));

    // 5. Audit logs, last mark save & today's attendance summary
    if (typeof window !== 'undefined') {
      try {
        const rawLogs = localStorage.getItem('sms_audit_logs');
        if (rawLogs) {
          const parsed = JSON.parse(rawLogs);
          if (Array.isArray(parsed)) {
            const myLogs = parsed.filter(
              (l: TeacherAuditLog) =>
                l.performedBy === myId ||
                l.performedBy === s.teacherName ||
                (me && l.performedBy === me.name)
            );
            setAuditLogs(myLogs.slice(-20).reverse());
          }
        }
      } catch {
        // Ignore corrupt audit log JSON safely
      }

      const ls = localStorage.getItem('sms_last_mark_save');
      setLastSaved(ls || null);

      setTodayAttendance(
        computeTodayAttendanceSummary(
          myCT,
          myAssignments,
          resolvedClassStudents,
          allStudents
        )
      );
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setMounted(true);
      loadAllPortalData();
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', loadAllPortalData);
      return () => {
        cancelled = true;
        window.removeEventListener('storage', loadAllPortalData);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [loadAllPortalData]);

  const handleLogout = useCallback(() => {
    teacherAuthService.logout();
    router.push('/login');
  }, [router]);

  const handleRefreshHomeworks = useCallback(() => {
    setHomeworks(homeworkService.getHomeworks({ includeArchived: true }));
  }, []);

  // Derived teacher metadata
  const teacherName = teacher?.name || session?.teacherName || 'শিক্ষক';
  const teacherId = teacher?.id || session?.teacherId || '';
  const designation = teacher?.designation || 'সহকারী শিক্ষক';
  const isClassTeacher = classTeachers.length > 0;
  const teacherNames = useMemo(
    () => [teacher?.name || '', session?.teacherName || ''].filter(Boolean),
    [teacher?.name, session?.teacherName]
  );

  // Group assignments by grade
  const assignmentsByGrade = useMemo(() => {
    const map: Record<string, SubjectAssignment[]> = {};
    assignments.forEach((a) => {
      if (!map[a.classId]) map[a.classId] = [];
      map[a.classId].push(a);
    });
    return map;
  }, [assignments]);

  const sortedGradeKeys = useMemo(
    () => sortGradeKeys(Object.keys(assignmentsByGrade)),
    [assignmentsByGrade]
  );

  // Today's personal routine slots & proxy substitutions
  const todayMyRoutines = useMemo(
    () =>
      routines.filter(
        (r) =>
          r.day === todayRoutineDay &&
          isTeacherRoutineSlot(r, teacherId, teacherNames)
      ),
    [routines, todayRoutineDay, teacherId, teacherNames]
  );

  const myTodaySubstitutions = useMemo(
    () =>
      todaySubstitutions.filter((sub) =>
        isTeacherSubstitution(sub, teacherId, teacherNames)
      ),
    [todaySubstitutions, teacherId, teacherNames]
  );

  // Lightweight nav tab badge counts
  const activeHomeworkCount = useMemo(
    () => homeworks.filter((h) => h.status === 'active').length,
    [homeworks]
  );
  const pendingLeavesCount = useMemo(
    () => leaves.filter((l) => l.status === 'pending').length,
    [leaves]
  );
  const urgentNoticesCount = useMemo(
    () => notices.filter((n) => n.priority === 'urgent').length,
    [notices]
  );

  if (!mounted) {
    return <TeacherPortalSkeleton />;
  }

  if (!session || (session.role !== 'teacher' && session.role !== 'admin')) {
    return null;
  }

  return (
    <div
      className="w-full pb-12 font-sans text-slate-900 dark:text-slate-100"
      suppressHydrationWarning
    >
      {/* Main workspace hidden cleanly whenever Leave Slip Print Modal is active */}
      <div
        className={
          printSlipLeave
            ? 'print-hide-when-modal print:hidden'
            : 'print-hide-when-modal'
        }
      >
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* FLUSH STICKY EXECUTIVE TEACHER NAVIGATION BAR                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)] dark:shadow-none print:hidden">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
            {/* Horizontally Scrollable Daily Workflow Tabs */}
            <div
              role="tablist"
              aria-label="শিক্ষক পোর্টাল নেভিগেশন"
              className="flex items-center gap-1 overflow-x-auto tab-scroll flex-1 min-w-0"
            >
              {PORTAL_NAV_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                let badgeText: string | null = null;
                let badgeTone: 'neutral' | 'amber' | 'rose' | 'emerald' =
                  'neutral';

                if (tab.id === 'routine') {
                  const totalToday =
                    todayMyRoutines.length + myTodaySubstitutions.length;
                  if (totalToday > 0) {
                    badgeText = toBnDigit(totalToday);
                    badgeTone =
                      myTodaySubstitutions.length > 0 ? 'amber' : 'neutral';
                  }
                } else if (tab.id === 'marks' && assignments.length > 0) {
                  badgeText = toBnDigit(assignments.length);
                } else if (tab.id === 'students' && isClassTeacher) {
                  badgeText = toBnDigit(classStudents.length);
                } else if (tab.id === 'homework' && activeHomeworkCount > 0) {
                  badgeText = toBnDigit(activeHomeworkCount);
                } else if (tab.id === 'leaves' && pendingLeavesCount > 0) {
                  badgeText = toBnDigit(pendingLeavesCount);
                  badgeTone = 'amber';
                } else if (tab.id === 'notices' && notices.length > 0) {
                  badgeText = toBnDigit(notices.length);
                  badgeTone = urgentNoticesCount > 0 ? 'rose' : 'neutral';
                } else if (
                  tab.id === 'attendance' &&
                  todayAttendance?.hasRollCall
                ) {
                  badgeText = `${toBnDigit(todayAttendance.rate)}%`;
                  badgeTone = 'emerald';
                }

                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleSwitchTab(tab.id)}
                    className={`h-9 px-3 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold whitespace-nowrap shrink-0 border ${
                      isActive
                        ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-2xs'
                        : 'bg-transparent text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    {tab.mobileLabel ? (
                      <>
                        <span className="sm:hidden">{tab.mobileLabel}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                      </>
                    ) : (
                      <span>{tab.label}</span>
                    )}

                    {tab.id === 'students' && !isClassTeacher && (
                      <Lock
                        size={11}
                        className={isActive ? 'text-white/80' : 'text-slate-400'}
                      />
                    )}

                    {badgeText !== null && (
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold leading-none font-mono ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : badgeTone === 'amber'
                            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
                            : badgeTone === 'rose'
                            ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
                            : badgeTone === 'emerald'
                            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-[#0B5D3B] dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {badgeText}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right: Compact Teacher Identity Chip & Quick Logout */}
            <div className="flex items-center gap-2 shrink-0 pl-2 border-l border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleSwitchTab('profile')}
                className="hidden md:flex items-center gap-2 h-9 pl-1.5 pr-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer text-left"
                title="প্রোফাইল ও নিরাপত্তা দেখুন"
              >
                {teacher?.photoUrl ? (
                  <img
                    src={teacher.photoUrl}
                    alt={teacherName}
                    className="w-6 h-6 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <span className="w-6 h-6 rounded-lg bg-[#0B5D3B] text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">
                    {teacherName.charAt(0) || 'শ'}
                  </span>
                )}
                <div className="leading-tight max-w-[130px]">
                  <p className="text-[11px] font-extrabold text-slate-900 dark:text-white truncate">
                    {teacherName}
                  </p>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                    {designation}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                title="লগআউট করুন"
                aria-label="লগআউট করুন"
                className="h-9 px-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <LogOut size={14} />
                <span className="hidden xl:inline">লগআউট</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MAIN WORKSPACE CONTAINER                                          */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-4">
          {/* Calm Inline Feedback Alert (No bouncy gimmicks) */}
          {alertMsg && (
            <div
              role="status"
              className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 border print:hidden ${
                alertMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800/60'
              }`}
            >
              {alertMsg.type === 'success' ? (
                <CheckCircle2
                  size={16}
                  className="text-[#0B5D3B] dark:text-emerald-400 shrink-0"
                />
              ) : (
                <AlertTriangle
                  size={16}
                  className="text-rose-600 dark:text-rose-400 shrink-0"
                />
              )}
              <span>{alertMsg.text}</span>
              <button
                type="button"
                onClick={() => setAlertMsg(null)}
                className="ml-auto p-1 hover:bg-black/5 rounded-lg cursor-pointer"
                aria-label="বার্তা বন্ধ করুন"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* TAB 1: HOME / TODAY'S OVERVIEW */}
          {activeTab === 'home' && (
            <TeacherPortalHomeTab
              teacher={teacher}
              teacherName={teacherName}
              teacherId={teacherId}
              designation={designation}
              isClassTeacher={isClassTeacher}
              classTeachers={classTeachers}
              assignments={assignments}
              assignmentsByGrade={assignmentsByGrade}
              sortedGradeKeys={sortedGradeKeys}
              classStudentsCount={classStudents.length}
              todayAttendance={todayAttendance}
              todayRoutineDay={todayRoutineDay}
              todayMyRoutines={todayMyRoutines}
              myTodaySubstitutions={myTodaySubstitutions}
              homeworks={homeworks}
              leaves={leaves}
              notices={notices}
              lastSaved={lastSaved}
              onSwitchTab={handleSwitchTab}
            />
          )}

          {/* TAB 2: ROUTINE & TODAY'S SUBSTITUTIONS */}
          {activeTab === 'routine' && (
            <TeacherPortalRoutineTab
              routines={routines}
              todayRoutineDay={todayRoutineDay}
              selectedRoutineDay={selectedRoutineDay}
              setSelectedRoutineDay={setSelectedRoutineDay}
              routineViewMode={routineViewMode}
              setRoutineViewMode={setRoutineViewMode}
              teacherId={teacherId}
              teacherNames={teacherNames}
              myTodaySubstitutions={myTodaySubstitutions}
            />
          )}

          {/* TAB 3: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <TeacherPortalAttendanceTab
              isClassTeacher={isClassTeacher}
              classTeachers={classTeachers}
              classStudentsCount={classStudents.length}
              todayAttendance={todayAttendance}
            />
          )}

          {/* TAB 4: MARKS ENTRY (RBAC SCOPED) */}
          {activeTab === 'marks' && (
            <TeacherPortalMarksTab assignments={assignments} />
          )}

          {/* TAB 5: MY CLASS STUDENTS & FEE STATUS (CLASS TEACHER ONLY) */}
          {activeTab === 'students' && (
            <TeacherPortalStudentsTab
              isClassTeacher={isClassTeacher}
              classTeachers={classTeachers}
              classStudents={classStudents}
              studentLedgers={studentLedgers}
              teacherName={teacherName}
              onRefreshData={loadAllPortalData}
              showAlert={showAlert}
            />
          )}

          {/* TAB 6: HOMEWORK */}
          {activeTab === 'homework' && (
            <TeacherPortalHomeworkTab
              homeworks={homeworks}
              assignments={assignments}
              teacherId={teacherId}
              teacherName={teacherName}
              isAdmin={session.role === 'admin'}
              onRefreshHomeworks={handleRefreshHomeworks}
              showAlert={showAlert}
            />
          )}

          {/* TAB 7: LEAVE APPLICATIONS */}
          {activeTab === 'leaves' && (
            <TeacherPortalLeavesTab
              leaves={leaves}
              teacherId={teacherId}
              teacherName={teacherName}
              designation={designation}
              onRefreshData={loadAllPortalData}
              onPrintLeaveSlip={(leave) => setPrintSlipLeave(leave)}
              showAlert={showAlert}
            />
          )}

          {/* TAB 8: NOTICES (VIEW-ONLY) */}
          {activeTab === 'notices' && (
            <TeacherPortalNoticesTab notices={notices} />
          )}

          {/* TAB 9: PROFILE, PASSWORD CHANGE & AUDIT TRAIL */}
          {activeTab === 'profile' && (
            <TeacherPortalProfileTab
              session={session}
              teacher={teacher}
              teacherName={teacherName}
              teacherId={teacherId}
              designation={designation}
              isClassTeacher={isClassTeacher}
              classTeachers={classTeachers}
              assignments={assignments}
              auditLogs={auditLogs}
              onRefreshData={loadAllPortalData}
              onLogout={handleLogout}
              showAlert={showAlert}
            />
          )}
        </div>
      </div>

      {/* PRINTABLE LEAVE SLIP MODAL (Isolated cleanly via .print-modal-active) */}
      <TeacherLeaveSlipModal
        leave={printSlipLeave}
        onClose={() => setPrintSlipLeave(null)}
      />
    </div>
  );
}

export default function TeacherPortalPage() {
  return (
    <Suspense fallback={<TeacherPortalSkeleton />}>
      <TeacherPortalContent />
    </Suspense>
  );
}
