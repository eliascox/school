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
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import { getUniversalStudentMark } from '@/lib/markStorageUtils';
import { calculateGradeAndPoint } from '@/services/resultService';
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
  const [schoolName, setSchoolName] = useState('স্মার্ট স্কুল');
  const [schoolEiin, setSchoolEiin] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');

  const [students, setStudents] = useState<Student[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [routines, setRoutines] = useState<RoutineSlot[]>([]);
  const [session, setSession] = useState<UserSession | null>(null);

  // Student Selector (Staff Only) & Guardian Privacy Verification State
  const [selectedGrade, setSelectedGrade] = useState<string>('10th');
  const [rollSearch, setRollSearch] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [verifiedStudentId, setVerifiedStudentId] = useState<string>('');
  const [verifyRollInput, setVerifyRollInput] = useState<string>('');
  const [verifyPhoneInput, setVerifyPhoneInput] = useState<string>('');
  const [verifyError, setVerifyError] = useState<string>('');
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

    try {
      const savedVerified = sessionStorage.getItem('mobile_app_verified_student_id') || '';
      if (savedVerified) setVerifiedStudentId(savedVerified);
    } catch {}

    const activeStaffSession = teacherAuthService.getSession();
    if (activeStaffSession && allStudents.length > 0 && !selectedStudentId) {
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

  const isStaffSession = Boolean(session);

  const handleVerifyStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoll = verifyRollInput.trim().toLowerCase();
    const phoneDigits = verifyPhoneInput.replace(/\D/g, '');
    if (!cleanRoll || phoneDigits.length < 4) {
      setVerifyError('অনুগ্রহ করে শিক্ষার্থীর রোল/আইডি এবং অভিভাবকের মোবাইল নম্বরের শেষ ৪টি সংখ্যা লিখুন।');
      return;
    }

    const matched = students.find((st) => {
      const gradeMatch = !selectedGrade || st.grade === selectedGrade;
      const rollMatch = String(st.roll || '').trim().toLowerCase() === cleanRoll || st.id.toLowerCase() === cleanRoll;
      const legacy = st as { phone?: string; guardianPhone?: string };
      const studentPhone = String(st.mobile || legacy.phone || legacy.guardianPhone || '').replace(/\D/g, '');
      const phoneMatch =
        studentPhone.length >= 4 &&
        (studentPhone === phoneDigits || studentPhone.endsWith(phoneDigits.slice(-4)));
      return gradeMatch && rollMatch && phoneMatch;
    });

    if (!matched) {
      setVerifyError('তথ্য মেলেনি! অনুগ্রহ করে সঠিক শ্রেণি, রোল/আইডি এবং নিবন্ধিত অভিভাবকের মোবাইল নম্বর দিন।');
      return;
    }

    setVerifyError('');
    setVerifiedStudentId(matched.id);
    try {
      sessionStorage.setItem('mobile_app_verified_student_id', matched.id);
    } catch {}
  };

  const handleClearVerifiedStudent = () => {
    setVerifiedStudentId('');
    setVerifyRollInput('');
    setVerifyPhoneInput('');
    setVerifyError('');
    try {
      sessionStorage.removeItem('mobile_app_verified_student_id');
    } catch {}
  };

  const activeStudent = useMemo(() => {
    if (isStaffSession) {
      if (selectedStudentId) {
        const found = students.find((s) => s.id === selectedStudentId);
        if (found) return found;
      }
      return classStudents[0] || students[0] || null;
    }
    if (verifiedStudentId) {
      return students.find((s) => s.id === verifiedStudentId) || null;
    }
    return null;
  }, [isStaffSession, verifiedStudentId, students, classStudents, selectedStudentId]);

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

  // Active Student Real Attendance Status computed from sms_attendance_* logs
  const attendanceInfo = useMemo(() => {
    if (typeof window === 'undefined' || !activeStudent) {
      return { todayStatus: 'তথ্য লক করা', isPresent: true, rate: 0, totalPresent: 0, totalDays: 0 };
    }
    const today = new Date().toISOString().split('T')[0];
    let todayStatus = 'আজকের হাজিরা এখনো নেওয়া হয়নি';
    let isPresent = true;
    let totalDays = 0;
    let totalPresent = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith('sms_attendance_')) continue;
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) continue;

        const rec = arr.find(
          (r: any) =>
            r.studentId === activeStudent.id ||
            r.id === activeStudent.id ||
            (String(r.roll) === String(activeStudent.roll) && (!r.grade || r.grade === activeStudent.grade))
        );
        if (!rec) continue;

        totalDays += 1;
        const stNorm = String(rec.status || '').toLowerCase();
        const isPresentRec = stNorm === 'present' || stNorm === 'p' || stNorm === 'late' || stNorm === 'l';
        if (isPresentRec) totalPresent += 1;

        if (k.startsWith(`sms_attendance_${today}`)) {
          if (stNorm === 'absent' || stNorm === 'a') {
            todayStatus = 'অনুপস্থিত';
            isPresent = false;
          } else if (stNorm === 'leave') {
            todayStatus = 'ছুটিপ্রাপ্ত';
            isPresent = false;
          } else if (stNorm === 'late' || stNorm === 'l') {
            todayStatus = 'বিলম্বে উপস্থিত';
            isPresent = true;
          } else {
            todayStatus = 'উপস্থিত (ভেরিফাইড)';
            isPresent = true;
          }
        }
      }
    } catch {}

    const computedRate =
      totalDays > 0
        ? Math.round((totalPresent / totalDays) * 100)
        : typeof activeStudent.attendance === 'number'
        ? activeStudent.attendance
        : 0;

    return {
      todayStatus,
      isPresent,
      rate: computedRate,
      totalPresent,
      totalDays,
    };
  }, [activeStudent]);

  // Active Student Exam Marks / GPA computed from canonical sms_marks_* keys via markStorageUtils
  const examSummary = useMemo(() => {
    if (typeof window === 'undefined' || !activeStudent) {
      return { gpa: '—', grade: '—', marksList: [] as Array<{ subject: string; total: number; grade: string }> };
    }
    const marksList: Array<{ subject: string; total: number; grade: string }> = [];
    let gpSum = 0;
    let gpCount = 0;
    let hasFail = false;

    try {
      // Determine target exam name from sms_exam_setup or latest recorded sms_marks_* key
      let targetExam = 'বার্ষিক পরীক্ষা ২০২৬';
      const setupRaw = localStorage.getItem('sms_exam_setup');
      if (setupRaw) {
        const setup = JSON.parse(setupRaw);
        if (setup?.activeExam) targetExam = setup.activeExam;
        else if (Array.isArray(setup?.exams) && setup.exams.length > 0) {
          targetExam = setup.exams[0]?.name || setup.exams[0] || targetExam;
        }
      }

      const subjects = getActiveCurriculumSubjects(
        activeStudent.grade,
        activeStudent.group || 'সাধারণ',
        activeStudent.optionalSubject
      );

      for (const subj of subjects) {
        const retrieved = getUniversalStudentMark({
          exam: targetExam,
          grade: activeStudent.grade,
          branch: activeStudent.section || 'A',
          group: activeStudent.group,
          subjectCodeOrName: subj.code || subj.name,
          studentRoll: String(activeStudent.roll),
          studentId: activeStudent.id,
          studentName: activeStudent.name,
          religion: (activeStudent.religion as any) || 'Muslim',
        });

        if (retrieved.hasMarks) {
          const gp = calculateGradeAndPoint(retrieved.total, subj.fullMarks || 100);
          marksList.push({
            subject: subj.name,
            total: retrieved.total,
            grade: gp.letterGrade,
          });
          if (gp.letterGrade === 'F' && subj.category !== 'ঐচ্ছিক') hasFail = true;
          gpSum += gp.gradePoint;
          gpCount += 1;
        }
      }

      // Fallback to legacy sms_exam_marks only if canonical store returned no records
      if (marksList.length === 0) {
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
                const gp = calculateGradeAndPoint(total, 100);
                marksList.push({
                  subject: m.subjectName || m.subject || 'বিষয়',
                  total,
                  grade: gp.letterGrade,
                });
                if (gp.letterGrade === 'F') hasFail = true;
                gpSum += gp.gradePoint;
                gpCount += 1;
              });
          }
        }
      }
    } catch {}

    const computedGpaNum =
      gpCount > 0 ? (hasFail ? 0 : Math.min(5, gpSum / gpCount)) : activeStudent.gpa ? Number(activeStudent.gpa) : null;
    const gpaVal = computedGpaNum !== null && !Number.isNaN(computedGpaNum) ? toBnDigit(computedGpaNum.toFixed(2)) : 'অপেক্ষমাণ';
    const overallGrade =
      computedGpaNum === null || Number.isNaN(computedGpaNum)
        ? '—'
        : hasFail || computedGpaNum === 0
        ? 'F'
        : computedGpaNum >= 5
        ? 'A+'
        : computedGpaNum >= 4
        ? 'A'
        : computedGpaNum >= 3.5
        ? 'A-'
        : computedGpaNum >= 3
        ? 'B'
        : computedGpaNum >= 2
        ? 'C'
        : 'D';

    return {
      gpa: gpaVal,
      grade: overallGrade,
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
      <div className="w-full max-w-md min-h-screen sm:min-h-[840px] sm:max-h-[900px] bg-slate-50 dark:bg-slate-950 sm:rounded-[40px] sm:shadow-2xl sm:border-[6px] sm:border-slate-800 flex flex-col overflow-hidden relative">
        
        {/* Top App Status & Action Header */}
        <header className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white px-4 pt-4 pb-4 shadow-md shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Link
                href="/"
                className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 dark:hover:bg-slate-800 flex items-center justify-center transition shrink-0"
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
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 dark:hover:bg-slate-800 text-white transition cursor-pointer"
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
                  className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 dark:hover:bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1 border border-white/20 transition"
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
                  className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 dark:hover:bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1 transition"
                >
                  <Download className="w-3 h-3" />
                  <span>APK</span>
                </a>
              </div>
            </div>
          )}

          {/* Student Class & Roll Selector Bar (Staff Only) or Parent Verification Bar */}
          {isStaffSession ? (
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
          ) : activeStudent ? (
            <div className="mt-3 flex items-center justify-between gap-2 bg-slate-900/60 border border-white/15 rounded-xl px-3 py-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate font-bold text-white">
                  ভেরিফাইড: {activeStudent.name} (রোল {toBnDigit(activeStudent.roll)})
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearVerifiedStudent}
                className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 dark:hover:bg-slate-800 text-white font-bold text-[11px] shrink-0 cursor-pointer"
              >
                পরিবর্তন করুন
              </button>
            </div>
          ) : null}
        </header>

        {/* Scrollable Main App Body */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          
          {/* Active Student Profile Card OR Parent Privacy Gate */}
          {activeStudent ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200/90 dark:border-slate-800 space-y-3">
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
                    <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                      {activeStudent.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                      {isStaffSession ? 'স্টাফ প্রিভিউ' : 'ভেরিফাইড'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                    {gradeLabel(activeStudent.grade)} • রোল: {toBnDigit(activeStudent.roll)} • শাখা: {activeStudent.section || 'ক'}
                    {activeStudent.group && activeStudent.group !== 'None' ? ` (${activeStudent.group})` : ''}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    আইডি: {activeStudent.id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/50">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">উপস্থিতি</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-300">
                    {attendanceInfo.totalDays > 0 || attendanceInfo.rate > 0 ? `${toBnDigit(attendanceInfo.rate)}%` : 'তথ্য নেই'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/50">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">সর্বশেষ জিপিএ</span>
                  <span className="text-xs sm:text-sm font-black text-blue-700 dark:text-blue-300">
                    {examSummary.gpa} ({examSummary.grade})
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/50">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">বকেয়া ফি</span>
                  <span className="text-xs sm:text-sm font-black text-amber-800 dark:text-amber-200">
                    ৳{toBnDigit(feeLedger?.totalDue ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleVerifyStudent}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-emerald-200 dark:border-emerald-800/60 space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    শিক্ষার্থী ও অভিভাবক তথ্য ভেরিফিকেশন
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    হাজিরা, ফলাফল ও ফি খতিয়ান দেখতে রোল ও অভিভাবকের মোবাইলের শেষ ৪ সংখ্যা দিন
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  aria-label="শ্রেণি নির্বাচন"
                  className="col-span-4 px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                >
                  <option value="6th">৬ষ্ঠ শ্রেণি</option>
                  <option value="7th">৭ম শ্রেণি</option>
                  <option value="8th">৮ম শ্রেণি</option>
                  <option value="9th">৯ম শ্রেণি</option>
                  <option value="10th">১০ম শ্রেণি</option>
                </select>
                <input
                  type="text"
                  value={verifyRollInput}
                  onChange={(e) => setVerifyRollInput(e.target.value)}
                  placeholder="রোল বা আইডি"
                  aria-label="শিক্ষার্থীর রোল বা আইডি"
                  className="col-span-3 px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
                <input
                  type="tel"
                  value={verifyPhoneInput}
                  onChange={(e) => setVerifyPhoneInput(e.target.value)}
                  placeholder="মোবাইল (শেষ ৪ সংখ্যা)"
                  aria-label="অভিভাবকের মোবাইল নম্বর"
                  className="col-span-5 px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              {verifyError && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 rounded-xl px-3 py-2">
                  {verifyError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition cursor-pointer shadow-xs"
              >
                যাচাই করে শিক্ষার্থীর তথ্য দেখুন
              </button>
            </form>
          )}

          {/* ── TAB 1: HOME ── */}
          {activeTab === 'home' && (
            <div className="space-y-4">
              {/* Live Attendance Pill */}
              <div
                onClick={() => setActiveTab('attendance')}
                className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  attendanceInfo.isPresent
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-200'
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
                <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 px-1">
                  ডিজিটাল ক্যাম্পাস সেবাসমূহ
                </h3>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('attendance')}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col items-center text-center gap-1.5 transition cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                      <CalendarCheck2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">হাজিরা রিপোর্ট</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">দৈনিক উপস্থিতি</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('results')}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col items-center text-center gap-1.5 transition cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">পরীক্ষার ফলাফল</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">মার্কশিট ও গ্রেড</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('fees')}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/50 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col items-center text-center gap-1.5 transition cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">বেতন ও ফি</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">খতিয়ান ও রশিদ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('notices')}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/50 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col items-center text-center gap-1.5 transition cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">ক্লাস রুটিন</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">পিরিয়ড সময়সূচি</span>
                  </button>

                  <Link
                    href="/admission"
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-teal-950/50 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col items-center text-center gap-1.5 transition"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">অনলাইন ভর্তি</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">নতুন আবেদন</span>
                  </Link>

                  <Link
                    href="/verify-certificate"
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col items-center text-center gap-1.5 transition"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">সনদ যাচাই</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">প্রত্যয়ন ভেরিফাই</span>
                  </Link>
                </div>
              </div>

              {/* Latest Notices Preview */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">সর্বশেষ নোটিশ ও বিজ্ঞপ্তি</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('notices')}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
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
                        className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-800/60 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1">
                            {n.title}
                          </span>
                          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200 shrink-0">
                            {new Date(n.publishedAt).toLocaleDateString('bn-BD')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                          {n.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
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
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 dark:text-white font-black text-xs flex items-center gap-1.5 shrink-0 transition"
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
              {!activeStudent ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">ভেরিফিকেশন প্রয়োজন</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">হাজিরার বিস্তারিত দেখতে অনুগ্রহ করে উপরে শিক্ষার্থীর শ্রেণি, রোল এবং অভিভাবকের মোবাইল নম্বর দিয়ে যাচাই করুন।</p>
                </div>
              ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">ডিজিটাল হাজিরা প্রতিবেদন</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">আজকের স্ট্যাটাস ও মাসিক উপস্থিতির হার</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-black text-xs">
                    {toBnDigit(attendanceInfo.rate)}% উপস্থিতি
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, attendanceInfo.rate))}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">মোট কার্যদিবস</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {toBnDigit(attendanceInfo.totalDays)} দিন
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-800/60">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">মোট উপস্থিত</span>
                    <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
                      {toBnDigit(attendanceInfo.totalPresent)} দিন
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/70 dark:border-rose-800/60">
                    <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 block">অনুপস্থিত</span>
                    <span className="text-base font-black text-rose-700 dark:text-rose-300">
                      {toBnDigit(Math.max(0, attendanceInfo.totalDays - attendanceInfo.totalPresent))} দিন
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                      আজকের স্ট্যাটাস: {attendanceInfo.todayStatus}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    {new Date().toLocaleDateString('bn-BD')}
                  </span>
                </div>
              </div>
              )}

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
              {!activeStudent ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <Award className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">ভেরিফিকেশন প্রয়োজন</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">পরীক্ষার নম্বরপত্র দেখতে উপরে শিক্ষার্থীর শ্রেণি, রোল ও অভিভাবকের মোবাইল নম্বর দিয়ে যাচাই করুন।</p>
                </div>
              ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">একাডেমিক ফলাফল ও মার্কশিট</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeStudent?.name} • রোল: {toBnDigit(activeStudent?.roll || 1)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 block">জিপিএ</span>
                    <span className="text-base font-black text-blue-700 dark:text-blue-300">
                      {examSummary.gpa} ({examSummary.grade})
                    </span>
                  </div>
                </div>

                {examSummary.marksList.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-12 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-[11px] font-black text-slate-700 dark:text-slate-300">
                      <span className="col-span-7">বিষয়</span>
                      <span className="col-span-3 text-center">প্রাপ্ত নম্বর</span>
                      <span className="col-span-2 text-right">গ্রেড</span>
                    </div>
                    {examSummary.marksList.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 px-3 py-2.5 text-xs items-center">
                        <span className="col-span-7 font-bold text-slate-800 dark:text-slate-100 truncate">{item.subject}</span>
                        <span className="col-span-3 text-center font-extrabold text-slate-900 dark:text-white">
                          {toBnDigit(item.total)}
                        </span>
                        <span className="col-span-2 text-right font-black text-emerald-700 dark:text-emerald-300">
                          {item.grade}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/60 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
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
              )}
            </div>
          )}

          {/* ── TAB 4: FEES & LEDGER ── */}
          {activeTab === 'fees' && (
            <div className="space-y-4">
              {!activeStudent ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <CreditCard className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">ভেরিফিকেশন প্রয়োজন</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">বেতন ও বকেয়া ফি খতিয়ান ব্যক্তিগত তথ্য — দেখতে উপরে রোল ও অভিভাবকের মোবাইল নম্বর দিয়ে যাচাই করুন।</p>
                </div>
              ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">বেতন ও ফি খতিয়ান (২০২৬)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">মাসিক টিউশন ও অন্যান্য ফি বিবরণী</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                      (feeLedger?.totalDue ?? 0) === 0
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200'
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
                    }`}
                  >
                    {(feeLedger?.totalDue ?? 0) === 0 ? 'পরিশোধিত' : `বকেয়া ৳${toBnDigit(feeLedger?.totalDue ?? 0)}`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">মোট ধার্য</span>
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      ৳{toBnDigit(feeLedger?.totalBilled ?? 0)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">পরিশোধিত</span>
                    <span className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-300">
                      ৳{toBnDigit(feeLedger?.totalPaid ?? 0)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60">
                    <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold block">বর্তমান বকেয়া</span>
                    <span className="text-xs sm:text-sm font-black text-rose-700 dark:text-rose-300">
                      ৳{toBnDigit(feeLedger?.totalDue ?? 0)}
                    </span>
                  </div>
                </div>

                {/* Monthly Tuition Grid */}
                {feeLedger?.months && feeLedger.months.length > 0 && (
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-2">মাসভিত্তিক বেতন স্ট্যাটাস</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {feeLedger.months.map((m) => (
                        <div
                          key={m.monthIndex}
                          className={`p-2 rounded-xl border text-center ${
                            m.status === 'paid' || m.status === 'waived'
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                              : m.status === 'partial'
                              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
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
              )}
            </div>
          )}

          {/* ── TAB 5: NOTICES & ROUTINE ── */}
          {activeTab === 'notices' && (
            <div className="space-y-4">
              {/* Class Routine Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
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
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
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
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                          >
                            <div>
                              <span className="text-xs font-black text-slate-900 dark:text-white block">
                                {slot.subject}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                শিক্ষক: {slot.teacherName} • কক্ষ: {slot.roomNo || 'মূল ভবন'}
                              </span>
                            </div>
                            <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-bold text-[10px]">
                              {periodMeta ? `${periodMeta.startTime} - ${periodMeta.endTime}` : `পিরিয়ড ${toBnDigit(slot.periodNo)}`}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-500 dark:text-slate-400 text-center">
                    সকাল ১০:০০ হতে বিকাল ০৪:০০ পর্যন্ত নির্ধারিত রুটিন অনুযায়ী ক্লাস চলবে।
                  </div>
                )}
              </div>

              {/* Notice Board List */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">ডিজিটাল নোটিশ বোর্ড</h3>
                </div>

                {notices.length > 0 ? (
                  <div className="space-y-2.5">
                    {notices.map((n) => (
                      <div key={n.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">{n.title}</h4>
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                            {new Date(n.publishedAt).toLocaleDateString('bn-BD')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{n.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
                    বর্তমানে কোনো নতুন বিজ্ঞপ্তি নেই।
                  </p>
                )}
              </div>
            </div>
          )}

        </main>

        {/* Bottom App Navigation Bar */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-2 flex items-center justify-around z-20">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'home' ? 'text-emerald-700 dark:text-emerald-300 font-black' : 'text-slate-400 font-semibold'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">হোম</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'attendance' ? 'text-emerald-700 dark:text-emerald-300 font-black' : 'text-slate-400 font-semibold'
            }`}
          >
            <CalendarCheck2 className="w-5 h-5" />
            <span className="text-[10px]">হাজিরা</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'results' ? 'text-emerald-700 dark:text-emerald-300 font-black' : 'text-slate-400 font-semibold'
            }`}
          >
            <Award className="w-5 h-5" />
            <span className="text-[10px]">ফলাফল</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fees')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'fees' ? 'text-emerald-700 dark:text-emerald-300 font-black' : 'text-slate-400 font-semibold'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px]">বেতন ও ফি</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notices')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'notices' ? 'text-emerald-700 dark:text-emerald-300 font-black' : 'text-slate-400 font-semibold'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className="text-[10px]">নোটিশ</span>
          </button>
        </nav>

        {/* Install Guide Bottom Sheet */}
        {showInstallSheet && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  মোবাইলে অ্যাপ ইনস্টল করার নিয়ম
                </h3>
                <button
                  type="button"
                  onClick={() => setShowInstallSheet(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  বন্ধ করুন ✕
                </button>
              </div>
              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60">
                  <p className="font-black text-emerald-950 dark:text-emerald-200">১. সরাসরি Android APK ইনস্টল:</p>
                  <p className="mt-1">
                    নিচের <strong>APK ডাউনলোড করুন</strong> বাটনে ট্যাপ করে <code>school-app.apk</code> ফাইলটি ওপেন করে Install করুন।
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <p className="font-black text-slate-900 dark:text-white">২. iPhone / Chrome ব্রাউজার (Add to Home Screen):</p>
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
                  className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
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
