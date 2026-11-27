'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  Bell,
  BookOpen,
  Briefcase,
  CalendarCheck2,
  CreditCard,
  Edit3,
  GraduationCap,
  Home,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import MobileAppLoginView from '@/components/mobile-app/MobileAppLoginView';
import GuardianMobilePortal, { GuardianAppTab } from '@/components/mobile-app/GuardianMobilePortal';
import TeacherMobileWorkspace, { TeacherMobileTab } from '@/components/mobile-app/TeacherMobileWorkspace';
import { firebaseSyncService } from '@/services/firebaseSyncService';
import { studentService, Student } from '@/services/studentService';
import { noticeService, Notice } from '@/services/noticeService';
import { routineService, RoutineSlot, SubstitutionRecord } from '@/services/routineService';
import { homeworkService, HomeworkAssignment } from '@/services/homeworkService';
import { settingsService } from '@/services/settingsService';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import { localDateKey } from '@/lib/dateUtils';

const toBnDigit = (num: number | string) => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bn[parseInt(d, 10)]);
};

export default function PublicMobileAppPage() {
  const [hydrated, setHydrated] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [schoolName, setSchoolName] = useState('স্মার্ট স্কুল');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [schoolEiin, setSchoolEiin] = useState('');

  // Auth & Role Mode
  const [session, setSession] = useState<UserSession | null>(null);
  const [appMode, setAppMode] = useState<'teacher' | 'guardian'>('teacher');
  const [verifiedStudentId, setVerifiedStudentId] = useState<string>('');

  // Navigation Tabs
  const [teacherTab, setTeacherTab] = useState<TeacherMobileTab>('home');
  const [teacherHasUnsavedMarks, setTeacherHasUnsavedMarks] = useState(false);
  const [guardianTab, setGuardianTab] = useState<GuardianAppTab>('home');

  // Shared Live Data (loaded cleanly without re-render loops)
  const [students, setStudents] = useState<Student[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [routines, setRoutines] = useState<RoutineSlot[]>([]);
  const [todaySubstitutions, setTodaySubstitutions] = useState<SubstitutionRecord[]>([]);
  const [homeworks, setHomeworks] = useState<HomeworkAssignment[]>([]);

  // Staff preview student selector (only used if staff explicitly switches to Guardian Preview)
  const [previewGrade, setPreviewGrade] = useState<string>('10th');
  const [previewStudentId, setPreviewStudentId] = useState<string>('');

  const didInitialCloudPullRef = useRef(false);

  const loadLocalAppData = useCallback(() => {
    try {
      const s = teacherAuthService.getSession();
      setSession(s);

      const settings = settingsService.getSettings();
      if (settings?.schoolName) setSchoolName(settings.schoolName);
      if (settings?.schoolLogo) setSchoolLogo(settings.schoolLogo);
      if (settings?.eiin) setSchoolEiin(toBnDigit(settings.eiin));

      const rawSettings = localStorage.getItem('sms_school_settings');
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings);
        if (parsed.schoolNameBn || parsed.schoolName) {
          setSchoolName(parsed.schoolNameBn || parsed.schoolName);
        }
        if (parsed.schoolLogo) setSchoolLogo(parsed.schoolLogo);
        if (parsed.eiin) setSchoolEiin(toBnDigit(parsed.eiin));
      }
    } catch {
      // Ignore malformed settings storage
    }

    try {
      const savedVerified = sessionStorage.getItem('mobile_app_verified_student_id') || '';
      if (savedVerified) setVerifiedStudentId(savedVerified);
    } catch {
      // Ignore restricted sessionStorage
    }

    setStudents(studentService.getAllStudents());
    setNotices(noticeService.getNotices());
    setRoutines(routineService.getRoutines());
    setTodaySubstitutions(routineService.getSubstitutions(localDateKey()));
    setHomeworks(homeworkService.getHomeworks());
    setHydrated(true);
  }, []);

  // Fast initial paint from localStorage, then single non-blocking background cloud pull
  useEffect(() => {
    loadLocalAppData();

    if (!didInitialCloudPullRef.current) {
      didInitialCloudPullRef.current = true;
      setSyncing(true);
      firebaseSyncService
        .pullAllFromCloud()
        .then(() => loadLocalAppData())
        .catch(() => {})
        .finally(() => setSyncing(false));
    }
  }, [loadLocalAppData]);

  const handleManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await firebaseSyncService.pullAllFromCloud();
      loadLocalAppData();
    } catch {
      // Offline fallback — local data remains intact
    } finally {
      setSyncing(false);
    }
  };

  const handleStaffLoginSuccess = (nextSession: UserSession) => {
    setSession(nextSession);
    setAppMode('teacher');
    setTeacherTab('home');
    loadLocalAppData();
  };

  const handleGuardianVerifySuccess = (student: Student) => {
    setVerifiedStudentId(student.id);
    setAppMode('guardian');
    setGuardianTab('home');
    loadLocalAppData();
  };

  const handleLogout = () => {
    if (session) {
      teacherAuthService.logout();
      setSession(null);
    }
    setVerifiedStudentId('');
    setTeacherTab('home');
    setGuardianTab('home');
    setAppMode('teacher');
    try {
      sessionStorage.removeItem('mobile_app_verified_student_id');
    } catch {
      // Ignore sessionStorage error
    }
  };

  const previewClassStudents = useMemo(() => {
    if (!session || appMode !== 'guardian') return [];
    return students
      .filter((st) => !previewGrade || st.grade === previewGrade)
      .sort((a, b) => (parseInt(String(a.roll), 10) || 999) - (parseInt(String(b.roll), 10) || 999));
  }, [session, appMode, students, previewGrade]);

  const activeGuardianStudent = useMemo(() => {
    if (session && appMode === 'guardian') {
      if (previewStudentId) {
        const found = previewClassStudents.find((s) => s.id === previewStudentId);
        if (found) return found;
      }
      return previewClassStudents[0] || students[0] || null;
    }
    if (verifiedStudentId) {
      return students.find((s) => s.id === verifiedStudentId) || null;
    }
    return null;
  }, [session, appMode, previewStudentId, previewClassStudents, students, verifiedStudentId]);

  const isAuthenticated = Boolean(session || verifiedStudentId);
  const isTeacherWorkspaceActive = Boolean(session && appMode === 'teacher');

  return (
    <div className="min-h-screen bg-[#050714] flex flex-col items-center justify-start sm:py-6 sm:px-4 font-sans">
      {/* Native Mobile App Shell (Full viewport on phone, glowing cosmic device frame on desktop) */}
      <div
        className={`w-full max-w-md min-h-screen sm:min-h-[820px] sm:max-h-[900px] sm:rounded-[38px] flex flex-col overflow-hidden relative ${
          !isAuthenticated
            ? 'bg-[#070B1E] sm:border sm:border-[#8B7BFF]/45 sm:shadow-[0_28px_80px_-14px_rgba(79,70,229,0.5)]'
            : 'bg-slate-50 dark:bg-slate-950 sm:shadow-2xl sm:border-[6px] sm:border-slate-800'
        }`}
      >
        {!hydrated ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            </div>
            <p className="text-xs font-bold text-slate-500">অ্যাপ লোড হচ্ছে...</p>
          </div>
        ) : !isAuthenticated ? (
          /* ═══════════════════════════════════════════════════════════════ */
          /* LOGIN-FIRST PROFESSIONAL MOBILE SCREEN (INSTANT ZERO-LAG LOAD)  */
          /* ═══════════════════════════════════════════════════════════════ */
          <MobileAppLoginView
            schoolName={schoolName}
            schoolLogo={schoolLogo}
            schoolEiin={schoolEiin}
            onStaffLoginSuccess={handleStaffLoginSuccess}
            onGuardianVerifySuccess={handleGuardianVerifySuccess}
          />
        ) : (
          /* ═══════════════════════════════════════════════════════════════ */
          /* AUTHENTICATED WORKSPACE (TEACHER / ADMIN OR VERIFIED GUARDIAN)  */
          /* ═══════════════════════════════════════════════════════════════ */
          <>
            {/* Clean Compact App Header (NO Install Banner, NO Clutter) */}
            <header
              className={`text-white px-4 py-3 shadow-md shrink-0 transition-colors ${
                isTeacherWorkspaceActive
                  ? 'bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border-b border-indigo-500/20'
                  : 'bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Link
                    href="/"
                    className="w-8 h-8 rounded-xl bg-white/12 hover:bg-white/22 flex items-center justify-center transition shrink-0"
                    title="হোমপেজে ফিরে যান"
                  >
                    <ArrowLeft className="w-4 h-4 text-white" />
                  </Link>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h1 className="text-sm font-black tracking-tight truncate">{schoolName}</h1>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                          isTeacherWorkspaceActive
                            ? 'bg-indigo-500/25 text-indigo-200 border-indigo-400/35'
                            : 'bg-emerald-500/30 text-emerald-200 border-emerald-400/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isTeacherWorkspaceActive ? 'bg-indigo-300' : 'bg-emerald-300'
                          }`}
                        />
                        {isTeacherWorkspaceActive
                          ? session?.role === 'admin'
                            ? 'ADMIN'
                            : 'TEACHER'
                          : 'STUDENT'}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/75 truncate">
                      {isTeacherWorkspaceActive
                        ? 'শিক্ষক মোবাইল ওয়ার্কস্পেস'
                        : 'শিক্ষার্থী ও অভিভাবক পোর্টাল'}
                      {schoolEiin ? ` • EIIN: ${schoolEiin}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleManualSync}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                    title="ক্লাউড সিঙ্ক করুন"
                    aria-label="ক্লাউড সিঙ্ক"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-emerald-300' : ''}`} />
                  </button>

                  {session && (
                    <button
                      type="button"
                      onClick={() => setAppMode((prev) => (prev === 'teacher' ? 'guardian' : 'teacher'))}
                      className={`px-2.5 py-1.5 rounded-xl font-black text-[10.5px] flex items-center gap-1 transition cursor-pointer ${
                        isTeacherWorkspaceActive
                          ? 'bg-white/12 hover:bg-white/20 text-white border border-white/15'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                      }`}
                      title={isTeacherWorkspaceActive ? 'শিক্ষার্থী প্রিভিউ' : 'শিক্ষক প্যানেলে ফিরুন'}
                    >
                      {isTeacherWorkspaceActive ? (
                        <>
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>প্রিভিউ</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>শিক্ষক প্যানেল</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition cursor-pointer"
                    title="লগআউট করুন"
                    aria-label="লগআউট"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Staff Student Picker (Only when Staff explicitly views Guardian Preview) */}
              {session && !isTeacherWorkspaceActive && (
                <div className="mt-2.5 grid grid-cols-12 gap-2">
                  <select
                    value={previewGrade}
                    onChange={(e) => {
                      setPreviewGrade(e.target.value);
                      setPreviewStudentId('');
                    }}
                    aria-label="শ্রেণি নির্বাচন"
                    className="col-span-4 bg-slate-900/70 text-white text-xs font-bold rounded-xl px-2 py-1.5 border border-white/20 outline-none"
                  >
                    <option value="6th">৬ষ্ঠ শ্রেণি</option>
                    <option value="7th">৭ম শ্রেণি</option>
                    <option value="8th">৮ম শ্রেণি</option>
                    <option value="9th">৯ম শ্রেণি</option>
                    <option value="10th">১০ম শ্রেণি</option>
                  </select>
                  <select
                    value={activeGuardianStudent?.id || ''}
                    onChange={(e) => setPreviewStudentId(e.target.value)}
                    aria-label="শিক্ষার্থী নির্বাচন"
                    className="col-span-8 bg-slate-900/70 text-white text-xs font-bold rounded-xl px-2 py-1.5 border border-white/20 outline-none truncate"
                  >
                    {previewClassStudents.length > 0 ? (
                      previewClassStudents.map((st) => (
                        <option key={st.id} value={st.id}>
                          রোল {toBnDigit(st.roll)} — {st.name}
                        </option>
                      ))
                    ) : (
                      <option value="">এই শ্রেণিতে শিক্ষার্থী নেই</option>
                    )}
                  </select>
                </div>
              )}
            </header>

            {/* Scrollable App Main Body */}
            <main className="flex-1 overflow-y-auto p-3.5 space-y-4 pb-24">
              {isTeacherWorkspaceActive && session ? (
                <TeacherMobileWorkspace
                  session={session}
                  activeTab={teacherTab}
                  onTabChange={setTeacherTab}
                  routines={routines}
                  todaySubstitutions={todaySubstitutions}
                  notices={notices}
                  onDataChanged={loadLocalAppData}
                  onDirtyMarksChange={setTeacherHasUnsavedMarks}
                />
              ) : (
                <GuardianMobilePortal
                  schoolName={schoolName}
                  activeTab={guardianTab}
                  onTabChange={setGuardianTab}
                  activeStudent={activeGuardianStudent}
                  isStaffPreview={Boolean(session)}
                  notices={notices}
                  routines={routines}
                  todaySubstitutions={todaySubstitutions}
                  homeworks={homeworks}
                  onSwitchToLogin={handleLogout}
                />
              )}
            </main>

            {/* Bottom Navigation Bar */}
            {isTeacherWorkspaceActive ? (
              <nav
                aria-label="শিক্ষক মোবাইল নেভিগেশন"
                className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800 px-2 pt-1.5 pb-2.5 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] flex items-center justify-around z-20"
              >
                {(
                  [
                    { id: 'home', label: 'হোম', icon: Home, activeCls: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60' },
                    { id: 'marks', label: 'নম্বর', icon: Edit3, activeCls: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60', dot: teacherHasUnsavedMarks },
                    { id: 'attendance', label: 'হাজিরা', icon: CalendarCheck2, activeCls: 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60' },
                    { id: 'schedule', label: 'কার্যক্রম', icon: Briefcase, activeCls: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60' },
                  ] as Array<{
                    id: TeacherMobileTab;
                    label: string;
                    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
                    activeCls: string;
                    dot?: boolean;
                  }>
                ).map((item) => {
                  const Icon = item.icon;
                  const isActive = teacherTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTeacherTab(item.id)}
                      className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[68px] py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
                        isActive
                          ? `${item.activeCls} font-black`
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-semibold'
                      }`}
                    >
                      <div className="relative">
                        <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 1.9} />
                        {item.dot && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900 absolute -top-0.5 -right-1" />
                        )}
                      </div>
                      <span className="text-[10px] leading-none mt-0.5">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            ) : (
              <nav
                aria-label="শিক্ষার্থী মোবাইল নেভিগেশন"
                className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1.5 py-2 flex items-center justify-around z-20"
              >
                {(
                  [
                    { id: 'home', label: 'হোম', icon: Home },
                    { id: 'attendance', label: 'হাজিরা', icon: CalendarCheck2 },
                    { id: 'homework', label: 'পাঠ', icon: BookOpen },
                    { id: 'results', label: 'ফলাফল', icon: Award },
                    { id: 'fees', label: 'বেতন', icon: CreditCard },
                    { id: 'notices', label: 'নোটিশ', icon: Bell },
                  ] as Array<{
                    id: GuardianAppTab;
                    label: string;
                    icon: React.ComponentType<{ className?: string }>;
                  }>
                ).map((item) => {
                  const Icon = item.icon;
                  const active = guardianTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGuardianTab(item.id)}
                      className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition cursor-pointer ${
                        active ? 'text-emerald-700 dark:text-emerald-300 font-black' : 'text-slate-400 font-semibold'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px]">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
