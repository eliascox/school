'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Home, CalendarCheck2, Award, CreditCard, Bell, Calendar,
  Search, Download, Smartphone, CheckCircle2, AlertCircle,
  UserCheck, GraduationCap, Phone, ArrowLeft, RefreshCw,
  ShieldCheck, ExternalLink, ChevronRight, Sparkles, Wifi,
  BookOpen, Clock, FileCheck, LogIn, Share2
} from 'lucide-react';
import { firebaseSyncService } from '@/services/firebaseSyncService';
import { studentService, Student } from '@/services/studentService';
import { financeService, StudentFeeLedger } from '@/services/financeService';
import { noticeService, Notice } from '@/services/noticeService';
import { routineService, RoutineSlot, ROUTINE_DAYS, ROUTINE_PERIODS } from '@/services/routineService';
import { landingPageService } from '@/services/landingPageService';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import InitialsAvatar from '@/components/public/InitialsAvatar';

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

const DAY_BN: Record<string, string> = {
  Saturday: 'শনিবার',
  Sunday: 'রবিবার',
  Monday: 'সোমবার',
  Tuesday: 'মঙ্গলবার',
  Wednesday: 'বুধবার',
  Thursday: 'বৃহস্পতিবার',
};

type AppTab = 'home' | 'attendance' | 'results' | 'fees' | 'notices';

export default function PublicMobileAppPage() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [syncing, setSyncing] = useState(false);
  const [schoolName, setSchoolName] = useState('বরইতলী উচ্চ বিদ্যালয়');
  const [schoolEiin, setSchoolEiin] = useState('১০৬১৮৪');
  const [schoolPhone, setSchoolPhone] = useState('01819-000000');

  const [students, setStudents] = useState<Student[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [routines, setRoutines] = useState<RoutineSlot[]>([]);
  const [session, setSession] = useState<UserSession | null>(null);

  // Student Selector State
  const [selectedGrade, setSelectedGrade] = useState<string>('10th');
  const [rollSearch, setRollSearch] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<RoutineSlot['day']>('Sunday');

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallSheet, setShowInstallSheet] = useState(false);

  const loadLiveAppData = useCallback(() => {
    try {
      const s = teacherAuthService.getSession();
      setSession(s);

      const cfg = landingPageService.getPublishedConfig();
      if (cfg?.contact?.phone1) setSchoolPhone(cfg.contact.phone1);

      const rawSettings = localStorage.getItem('sms_school_settings');
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings);
        if (parsed.schoolNameBn || parsed.schoolName) {
          setSchoolName(parsed.schoolNameBn || parsed.schoolName);
        }
        if (parsed.eiin) setSchoolEiin(toBnDigit(parsed.eiin));
        if (parsed.phone) setSchoolPhone(parsed.phone);
      }
    } catch {}

    const allStudents = studentService.getAllStudents();
    setStudents(allStudents);

    const allNotices = noticeService.getNotices();
    setNotices(allNotices);

    const allRoutines = routineService.getRoutines();
    setRoutines(allRoutines);

    if (allStudents.length > 0 && !selectedStudentId) {
      const preferred = allStudents.find((st) => st.grade === selectedGrade) || allStudents[0];
      if (preferred) {
        setSelectedGrade(preferred.grade || '10th');
        setSelectedStudentId(preferred.id);
      }
    }
  }, [selectedGrade, selectedStudentId]);

  useEffect(() => {
    loadLiveAppData();

    // Hydrate from Cloud Firestore for real-time accuracy on phones
    setSyncing(true);
    firebaseSyncService
      .pullAllFromCloud()
      .then(() => {
        loadLiveAppData();
      })
      .catch(() => {})
      .finally(() => setSyncing(false));

    // Listen for PWA beforeinstallprompt
    const w = window as any;
    if (w.__deferredPwaPrompt) {
      setDeferredPrompt(w.__deferredPwaPrompt);
    }
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      w.__deferredPwaPrompt = e;
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [loadLiveAppData]);

  // Filtered students for current class & roll search
  const classStudents = useMemo(() => {
    return students
      .filter((st) => !selectedGrade || st.grade === selectedGrade)
      .filter((st) => {
        if (!rollSearch.trim()) return true;
        const q = rollSearch.trim().toLowerCase();
        return (
          String(st.roll || '').toLowerCase().includes(q) ||
          (st.name || '').toLowerCase().includes(q) ||
          (st.id || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (parseInt(String(a.roll), 10) || 999) - (parseInt(String(b.roll), 10) || 999));
  }, [students, selectedGrade, rollSearch]);

  const activeStudent = useMemo(() => {
    if (selectedStudentId) {
      const found = students.find((s) => s.id === selectedStudentId);
      if (found) return found;
    }
    return classStudents[0] || students[0] || null;
  }, [students, classStudents, selectedStudentId]);

  // Active Student Fee Ledger
  const feeLedger: StudentFeeLedger | null = useMemo(() => {
    if (!activeStudent) return null;
    try {
      return financeService.getStudentFeeLedger(
        activeStudent.id,
        activeStudent.grade,
        activeStudent.isStipend
      );
    } catch {
      return null;
    }
  }, [activeStudent]);

  // Active Student Today's Attendance Status
  const attendanceInfo = useMemo(() => {
    if (typeof window === 'undefined' || !activeStudent) {
      return { todayStatus: 'উপস্থিত', isPresent: true, rate: 96, totalPresent: 24, totalDays: 25 };
    }
    const today = new Date().toISOString().split('T')[0];
    let todayStatus = 'উপস্থিত (সময়মত)';
    let isPresent = true;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(`sms_attendance_${today}`)) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              const rec = arr.find(
                (r: any) =>
                  r.studentId === activeStudent.id ||
                  (String(r.roll) === String(activeStudent.roll) && r.grade === activeStudent.grade)
              );
              if (rec) {
                if (rec.status === 'absent' || rec.status === 'A') {
                  todayStatus = 'অনুপস্থিত';
                  isPresent = false;
                } else if (rec.status === 'late' || rec.status === 'L') {
                  todayStatus = 'বিলম্বে উপস্থিত';
                  isPresent = true;
                } else {
                  todayStatus = 'উপস্থিত (ভেরিফাইড)';
                  isPresent = true;
                }
              }
            }
          }
        }
      }
    } catch {}

    const numericAttendance =
      typeof activeStudent.attendance === 'number'
        ? activeStudent.attendance
        : parseInt(String(activeStudent.attendance || '96'), 10) || 96;

    return {
      todayStatus,
      isPresent,
      rate: numericAttendance,
      totalPresent: Math.round((numericAttendance / 100) * 26),
      totalDays: 26,
    };
  }, [activeStudent]);

  // Active Student Exam Marks / GPA
  const examSummary = useMemo(() => {
    if (typeof window === 'undefined' || !activeStudent) {
      return { gpa: '৫.০০', grade: 'A+', marksList: [] as Array<{ subject: string; total: number; grade: string }> };
    }
    const marksList: Array<{ subject: string; total: number; grade: string }> = [];
    try {
      const rawMarks = localStorage.getItem('sms_exam_marks');
      if (rawMarks) {
        const parsed = JSON.parse(rawMarks);
        if (Array.isArray(parsed)) {
          parsed
            .filter(
              (m: any) =>
                m.studentId === activeStudent.id ||
                (String(m.roll) === String(activeStudent.roll) && m.className === activeStudent.grade)
            )
            .forEach((m: any) => {
              const total = (Number(m.written) || 0) + (Number(m.mcq) || 0) + (Number(m.practical) || 0);
              const letter =
                total >= 80 ? 'A+' : total >= 70 ? 'A' : total >= 60 ? 'A-' : total >= 50 ? 'B' : total >= 40 ? 'C' : total >= 33 ? 'D' : 'F';
              marksList.push({
                subject: m.subjectName || m.subject || 'বিষয়',
                total,
                grade: letter,
              });
            });
        }
      }
    } catch {}

    const gpaVal = activeStudent.gpa ? toBnDigit(activeStudent.gpa) : '৫.০০';
    return {
      gpa: gpaVal,
      grade: Number(activeStudent.gpa || 5) >= 5 ? 'A+' : 'A',
      marksList,
    };
  }, [activeStudent]);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstallSheet(true);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await firebaseSyncService.pullAllFromCloud();
      loadLiveAppData();
    } catch {
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start sm:py-6 sm:px-4 font-sans">
      {/* Smartphone Container (Full width on mobile, realistic frame on desktop) */}
      <div className="w-full max-w-md min-h-screen sm:min-h-[840px] sm:max-h-[900px] bg-slate-50 sm:rounded-[40px] sm:shadow-2xl sm:border-[6px] sm:border-slate-800 flex flex-col overflow-hidden relative">
        
        {/* Top App Status & Action Header */}
        <header className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white px-4 pt-4 pb-4 shadow-md shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Link
                href="/"
                className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition shrink-0"
                title="হোমপেজে ফিরে যান"
              >
                <ArrowLeft className="w-4 h-4 text-white" />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-base font-black tracking-tight truncate">
                    {schoolName}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/90 truncate">
                  স্মার্ট ক্যাম্পাস মোবাইল অ্যাপ • EIIN: {schoolEiin}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleManualSync}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="ক্লাউড সিঙ্ক করুন"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-emerald-300' : ''}`} />
              </button>

              {session ? (
                <Link
                  href={session.role === 'admin' ? '/dashboard' : '/dashboard/teacher-portal'}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-xs transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{session.role === 'admin' ? 'ড্যাশবোর্ড' : 'শিক্ষক পোর্টাল'}</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-[11px] flex items-center gap-1 border border-white/20 transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>লগইন</span>
                </Link>
              )}
            </div>
          </div>

          {/* Install Banner (PWA + APK) */}
          {!isInstalled && (
            <div className="mt-3 p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/30 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4 text-emerald-200" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-white truncate">
                    ফোনে অ্যাপটি ইনস্টল করুন
                  </p>
                  <p className="text-[10px] text-emerald-200 truncate">
                    Android APK অথবা 1-Click Web App
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleInstallPwa}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[11px] transition cursor-pointer"
                >
                  ইনস্টল
                </button>
                <a
                  href="/downloads/school-app.apk"
                  download="school-app.apk"
                  className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] flex items-center gap-1 transition"
                >
                  <Download className="w-3 h-3" />
                  <span>APK</span>
                </a>
              </div>
            </div>
          )}

          {/* Student Class & Roll Selector Bar */}
          <div className="mt-3 grid grid-cols-12 gap-2">
            <select
              value={selectedGrade}
              onChange={(e) => {
                const newGrade = e.target.value;
                setSelectedGrade(newGrade);
                const firstInGrade = students.find((s) => s.grade === newGrade);
                if (firstInGrade) setSelectedStudentId(firstInGrade.id);
              }}
              aria-label="শ্রেণি নির্বাচন"
              className="col-span-4 bg-slate-900/70 text-white text-xs font-bold rounded-xl px-2.5 py-2 border border-white/20 focus:outline-none focus:border-emerald-400"
            >
              <option value="6th">৬ষ্ঠ শ্রেণি</option>
              <option value="7th">৭ম শ্রেণি</option>
              <option value="8th">৮ম শ্রেণি</option>
              <option value="9th">৯ম শ্রেণি</option>
              <option value="10th">১০ম শ্রেণি</option>
            </select>

            <select
              value={activeStudent?.id || ''}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              aria-label="শিক্ষার্থী নির্বাচন"
              className="col-span-8 bg-slate-900/70 text-white text-xs font-bold rounded-xl px-2.5 py-2 border border-white/20 focus:outline-none focus:border-emerald-400 truncate"
            >
              {classStudents.length > 0 ? (
                classStudents.map((st) => (
                  <option key={st.id} value={st.id}>
                    রোল {toBnDigit(st.roll)} — {st.name} ({st.section || st.group || 'ক'})
                  </option>
                ))
              ) : (
                <option value="">এই শ্রেণিতে শিক্ষার্থী পাওয়া যায়নি</option>
              )}
            </select>
          </div>
        </header>

        {/* Scrollable Main App Body */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          
          {/* Active Student Profile Card (Always visible on top) */}
          {activeStudent ? (
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/90 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-13 h-13 rounded-2xl overflow-hidden border-2 border-emerald-500/30 shrink-0">
                  <InitialsAvatar
                    src={activeStudent.photo}
                    name={activeStudent.name}
                    className="w-full h-full"
                    textClassName="text-base"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm sm:text-base font-black text-slate-900 truncate">
                      {activeStudent.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                      সক্রিয়
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    {gradeLabel(activeStudent.grade)} • রোল: {toBnDigit(activeStudent.roll)} • শাখা: {activeStudent.section || 'ক'}
                    {activeStudent.group && activeStudent.group !== 'None' ? ` (${activeStudent.group})` : ''}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    আইডি: {activeStudent.id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="p-2 rounded-xl bg-emerald-50/70">
                  <span className="text-[10px] font-semibold text-slate-500 block">উপস্থিতি</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-700">
                    {toBnDigit(attendanceInfo.rate)}%
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-blue-50/70">
                  <span className="text-[10px] font-semibold text-slate-500 block">সর্বশেষ জিপিএ</span>
                  <span className="text-xs sm:text-sm font-black text-blue-700">
                    {examSummary.gpa} ({examSummary.grade})
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50/70">
                  <span className="text-[10px] font-semibold text-slate-500 block">বকেয়া ফি</span>
                  <span className="text-xs sm:text-sm font-black text-amber-800">
                    ৳{toBnDigit(feeLedger?.totalDue ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 text-center border border-slate-200">
              <p className="text-xs font-bold text-slate-500">
                শিক্ষার্থী লোড হচ্ছে বা নির্বাচিত শ্রেণিতে কোনো শিক্ষার্থী নেই।
              </p>
            </div>
          )}

          {/* ── TAB 1: HOME ── */}
          {activeTab === 'home' && (
            <div className="space-y-4">
              {/* Live Attendance Pill */}
              <div
                onClick={() => setActiveTab('attendance')}
                className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  attendanceInfo.isPresent
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold ${
                      attendanceInfo.isPresent ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  >
                    <CalendarCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black">আজকের ডিজিটাল হাজিরা স্ট্যাটাস</h3>
                    <p className="text-[11px] font-semibold opacity-80 mt-0.5">
                      {attendanceInfo.todayStatus}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </div>

              {/* 6-Card Quick Navigation Grid */}
              <div>
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5 px-1">
                  ডিজিটাল ক্যাম্পাস সেবাসমূহ
                </h3>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('attendance')}
                    className="p-3 rounded-2xl bg-white hover:bg-emerald-50 border border-slate-200/90 shadow-2xs flex flex-col items-center text-center gap-1.5 transition cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CalendarCheck2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">হাজিরা রিপোর্ট</span>
                    <span className="text-[10px] text-slate-500">দৈনিক উপস্থিতি</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('results')}
                    className="p-3 rounded-2xl bg-white hover:bg-blue-50 border border-slate-200/90 shadow-2xs flex flex-col items-center text-center gap-1.5 transition cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">পরীক্ষার ফলাফল</span>
                    <span className="text-[10px] text-slate-500">মার্কশিট ও গ্রেড</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('fees')}
                    className="p-3 rounded-2xl bg-white hover:bg-purple-50 border border-slate-200/90 shadow-2xs flex flex-col items-center text-center gap-1.5 transition cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">বেতন ও ফি</span>
                    <span className="text-[10px] text-slate-500">খতিয়ান ও রশিদ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('notices')}
                    className="p-3 rounded-2xl bg-white hover:bg-amber-50 border border-slate-200/90 shadow-2xs flex flex-col items-center text-center gap-1.5 transition cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">ক্লাস রুটিন</span>
                    <span className="text-[10px] text-slate-500">পিরিয়ড সময়সূচি</span>
                  </button>

                  <Link
                    href="/admission"
                    className="p-3 rounded-2xl bg-white hover:bg-teal-50 border border-slate-200/90 shadow-2xs flex flex-col items-center text-center gap-1.5 transition"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">অনলাইন ভর্তি</span>
                    <span className="text-[10px] text-slate-500">নতুন আবেদন</span>
                  </Link>

                  <Link
                    href="/verify-certificate"
                    className="p-3 rounded-2xl bg-white hover:bg-indigo-50 border border-slate-200/90 shadow-2xs flex flex-col items-center text-center gap-1.5 transition"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">সনদ যাচাই</span>
                    <span className="text-[10px] text-slate-500">প্রত্যয়ন ভেরিফাই</span>
                  </Link>
                </div>
              </div>

              {/* Latest Notices Preview */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-black text-slate-900">সর্বশেষ নোটিশ ও বিজ্ঞপ্তি</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('notices')}
                    className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    সব দেখুন
                  </button>
                </div>

                {notices.length > 0 ? (
                  <div className="space-y-2">
                    {notices.slice(0, 2).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => setActiveTab('notices')}
                        className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-slate-900 line-clamp-1">
                            {n.title}
                          </span>
                          <span className="text-[10px] font-bold text-amber-800 shrink-0">
                            {new Date(n.publishedAt).toLocaleDateString('bn-BD')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">
                          {n.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-500">
                    ২০২৬ শিক্ষাবর্ষের নিয়মিত ক্লাস ও একাডেমিক কার্যক্রম যথানিয়মে চলমান রয়েছে।
                  </div>
                )}
              </div>

              {/* Direct School Contact Card */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
                    জরুরি হেল্পডেস্ক ও অফিস
                  </span>
                  <h4 className="text-xs sm:text-sm font-extrabold mt-0.5">
                    বিদ্যালয় অফিস চলাকালীন সরাসরি কল করুন
                  </h4>
                </div>
                <a
                  href={`tel:${schoolPhone}`}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shrink-0 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>কল করুন</span>
                </a>
              </div>
            </div>
          )}

          {/* ── TAB 2: ATTENDANCE ── */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">ডিজিটাল হাজিরা প্রতিবেদন</h3>
                    <p className="text-xs text-slate-500">আজকের স্ট্যাটাস ও মাসিক উপস্থিতির হার</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs">
                    {toBnDigit(attendanceInfo.rate)}% উপস্থিতি
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, attendanceInfo.rate))}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-500 block">মোট কার্যদিবস</span>
                    <span className="text-base font-black text-slate-900">
                      {toBnDigit(attendanceInfo.totalDays)} দিন
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/70">
                    <span className="text-[10px] font-bold text-emerald-700 block">মোট উপস্থিত</span>
                    <span className="text-base font-black text-emerald-700">
                      {toBnDigit(attendanceInfo.totalPresent)} দিন
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/70">
                    <span className="text-[10px] font-bold text-rose-700 block">অনুপস্থিত</span>
                    <span className="text-base font-black text-rose-700">
                      {toBnDigit(Math.max(0, attendanceInfo.totalDays - attendanceInfo.totalPresent))} দিন
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-950">
                      আজকের স্ট্যাটাস: {attendanceInfo.todayStatus}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700">
                    {new Date().toLocaleDateString('bn-BD')}
                  </span>
                </div>
              </div>

              {session && (
                <Link
                  href="/dashboard/academic/attendance"
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <CalendarCheck2 className="w-4 h-4" />
                  <span>শ্রেণির রোল-কল হাজিরা গ্রহণ করুন (শিক্ষক/অ্যাডমিন)</span>
                </Link>
              )}
            </div>
          )}

          {/* ── TAB 3: RESULTS ── */}
          {activeTab === 'results' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">একাডেমিক ফলাফল ও মার্কশিট</h3>
                    <p className="text-xs text-slate-500">
                      {activeStudent?.name} • রোল: {toBnDigit(activeStudent?.roll || 1)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 block">জিপিএ</span>
                    <span className="text-base font-black text-blue-700">
                      {examSummary.gpa} ({examSummary.grade})
                    </span>
                  </div>
                </div>

                {examSummary.marksList.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-12 bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-700">
                      <span className="col-span-7">বিষয়</span>
                      <span className="col-span-3 text-center">প্রাপ্ত নম্বর</span>
                      <span className="col-span-2 text-right">গ্রেড</span>
                    </div>
                    {examSummary.marksList.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 px-3 py-2.5 text-xs items-center">
                        <span className="col-span-7 font-bold text-slate-800 truncate">{item.subject}</span>
                        <span className="col-span-3 text-center font-extrabold text-slate-900">
                          {toBnDigit(item.total)}
                        </span>
                        <span className="col-span-2 text-right font-black text-emerald-700">
                          {item.grade}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/70 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-700">
                      বিস্তারিত বিষয়ভিত্তিক মার্কশিট ও গ্রেডশিট প্রিন্ট করতে অনলাইন রেজাল্ট পোর্টালে যান।
                    </p>
                  </div>
                )}

                <Link
                  href="/result"
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Award className="w-4 h-4" />
                  <span>পূর্ণাঙ্গ মার্কশিট দেখুন ও ডাউনলোড করুন</span>
                </Link>
              </div>
            </div>
          )}

          {/* ── TAB 4: FEES & LEDGER ── */}
          {activeTab === 'fees' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">বেতন ও ফি খতিয়ান (২০২৬)</h3>
                    <p className="text-xs text-slate-500">মাসিক টিউশন ও অন্যান্য ফি বিবরণী</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                      (feeLedger?.totalDue ?? 0) === 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {(feeLedger?.totalDue ?? 0) === 0 ? 'পরিশোধিত' : `বকেয়া ৳${toBnDigit(feeLedger?.totalDue ?? 0)}`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">মোট ধার্য</span>
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      ৳{toBnDigit(feeLedger?.totalBilled ?? 0)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 font-bold block">পরিশোধিত</span>
                    <span className="text-xs sm:text-sm font-black text-emerald-700">
                      ৳{toBnDigit(feeLedger?.totalPaid ?? 0)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-[10px] text-rose-700 font-bold block">বর্তমান বকেয়া</span>
                    <span className="text-xs sm:text-sm font-black text-rose-700">
                      ৳{toBnDigit(feeLedger?.totalDue ?? 0)}
                    </span>
                  </div>
                </div>

                {/* Monthly Tuition Grid */}
                {feeLedger?.months && feeLedger.months.length > 0 && (
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-700 mb-2">মাসভিত্তিক বেতন স্ট্যাটাস</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {feeLedger.months.map((m) => (
                        <div
                          key={m.monthIndex}
                          className={`p-2 rounded-xl border text-center ${
                            m.status === 'paid' || m.status === 'waived'
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                              : m.status === 'partial'
                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="text-[11px] font-black block">{m.month}</span>
                          <span className="text-[10px] font-bold opacity-80">
                            {m.status === 'paid'
                              ? '✅ পরিশোধিত'
                              : m.status === 'waived'
                              ? 'মওকুফ'
                              : `৳${toBnDigit(m.dueAmount)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 5: NOTICES & ROUTINE ── */}
          {activeTab === 'notices' && (
            <div className="space-y-4">
              {/* Class Routine Card */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-black text-slate-900">
                      দৈনিক ক্লাস রুটিন ({gradeLabel(selectedGrade)})
                    </h3>
                  </div>
                </div>

                {/* Day Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {ROUTINE_DAYS.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setSelectedDay(d.key)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                        selectedDay === d.key
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d.labelBn || DAY_BN[d.key] || d.key}
                    </button>
                  ))}
                </div>

                {routines.filter(
                  (r) =>
                    r.day === selectedDay &&
                    (!selectedGrade || r.classId.toLowerCase().includes(selectedGrade.toLowerCase()))
                ).length > 0 ? (
                  <div className="space-y-2">
                    {routines
                      .filter(
                        (r) =>
                          r.day === selectedDay &&
                          (!selectedGrade || r.classId.toLowerCase().includes(selectedGrade.toLowerCase()))
                      )
                      .map((slot) => {
                        const periodMeta = ROUTINE_PERIODS.find((p) => p.periodNo === slot.periodNo);
                        return (
                          <div
                            key={slot.id}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                          >
                            <div>
                              <span className="text-xs font-black text-slate-900 block">
                                {slot.subject}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                শিক্ষক: {slot.teacherName} • কক্ষ: {slot.roomNo || 'মূল ভবন'}
                              </span>
                            </div>
                            <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              {periodMeta ? `${periodMeta.startTime} - ${periodMeta.endTime}` : `পিরিয়ড ${toBnDigit(slot.periodNo)}`}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-500 text-center">
                    সকাল ১০:০০ হতে বিকাল ০৪:০০ পর্যন্ত নির্ধারিত রুটিন অনুযায়ী ক্লাস চলবে।
                  </div>
                )}
              </div>

              {/* Notice Board List */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-black text-slate-900">ডিজিটাল নোটিশ বোর্ড</h3>
                </div>

                {notices.length > 0 ? (
                  <div className="space-y-2.5">
                    {notices.map((n) => (
                      <div key={n.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-black text-slate-900">{n.title}</h4>
                          <span className="text-[10px] font-bold text-emerald-700 shrink-0">
                            {new Date(n.publishedAt).toLocaleDateString('bn-BD')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{n.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    বর্তমানে কোনো নতুন বিজ্ঞপ্তি নেই।
                  </p>
                )}
              </div>
            </div>
          )}

        </main>

        {/* Bottom App Navigation Bar */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 flex items-center justify-around z-20">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'home' ? 'text-emerald-700 font-black' : 'text-slate-400 font-semibold'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">হোম</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'attendance' ? 'text-emerald-700 font-black' : 'text-slate-400 font-semibold'
            }`}
          >
            <CalendarCheck2 className="w-5 h-5" />
            <span className="text-[10px]">হাজিরা</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'results' ? 'text-emerald-700 font-black' : 'text-slate-400 font-semibold'
            }`}
          >
            <Award className="w-5 h-5" />
            <span className="text-[10px]">ফলাফল</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fees')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'fees' ? 'text-emerald-700 font-black' : 'text-slate-400 font-semibold'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px]">বেতন ও ফি</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notices')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'notices' ? 'text-emerald-700 font-black' : 'text-slate-400 font-semibold'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className="text-[10px]">নোটিশ</span>
          </button>
        </nav>

        {/* Install Guide Bottom Sheet */}
        {showInstallSheet && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">
                  মোবাইলে অ্যাপ ইনস্টল করার নিয়ম
                </h3>
                <button
                  type="button"
                  onClick={() => setShowInstallSheet(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  বন্ধ করুন ✕
                </button>
              </div>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <p className="font-black text-emerald-950">১. সরাসরি Android APK ইনস্টল:</p>
                  <p className="mt-1">
                    নিচের <strong>APK ডাউনলোড করুন</strong> বাটনে ট্যাপ করে <code>school-app.apk</code> ফাইলটি ওপেন করে Install করুন।
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="font-black text-slate-900">২. iPhone / Chrome ব্রাউজার (Add to Home Screen):</p>
                  <p className="mt-1">
                    ব্রাউজারের মেনু (⋮ অথবা Share আইকন) থেকে <strong>&quot;Add to Home Screen&quot;</strong> বা <strong>&quot;Install App&quot;</strong> সিলেক্ট করুন।
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="/downloads/school-app.apk"
                  download="school-app.apk"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs text-center flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Android APK ডাউনলোড করুন</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowInstallSheet(false)}
                  className="px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  ঠিক আছে
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
