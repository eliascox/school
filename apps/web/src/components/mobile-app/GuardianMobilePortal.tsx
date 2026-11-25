'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  ExternalLink,
  FileCheck,
  GraduationCap,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { Student } from '@/services/studentService';
import { financeService, StudentFeeLedger } from '@/services/financeService';
import { paymentGatewayService, PaymentGatewayProvider } from '@/services/paymentGatewayService';
import { PaymentRecord } from '@/components/finance/financeShared';
import { Notice } from '@/services/noticeService';
import {
  RoutineSlot,
  ROUTINE_DAYS,
  ROUTINE_PERIODS,
  SubstitutionRecord,
  routineService,
} from '@/services/routineService';
import { HomeworkAssignment } from '@/services/homeworkService';
import { localDateKey } from '@/lib/dateUtils';
import { calculateGradeAndPoint, gpaToLetterGrade, resultService } from '@/services/resultService';
import InitialsAvatar from '@/components/public/InitialsAvatar';

export type GuardianAppTab = 'home' | 'attendance' | 'homework' | 'results' | 'fees' | 'notices';

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

const matchesGradeId = (rawClassId: string | undefined, targetGrade: string): boolean => {
  if (!targetGrade) return true;
  const src = String(rawClassId || '').toLowerCase();
  const normMap: Record<string, string[]> = {
    '6th': ['6th', 'class 6', 'class-6', '৬ষ্ঠ', '৬'],
    '7th': ['7th', 'class 7', 'class-7', '৭ম', '৭'],
    '8th': ['8th', 'class 8', 'class-8', '৮ম', '৮'],
    '9th': ['9th', 'class 9', 'class-9', '৯ম', '৯'],
    '10th': ['10th', 'class 10', 'class-10', '১০ম', '১০'],
  };
  const tokens = normMap[targetGrade] || [targetGrade.toLowerCase()];
  if (tokens.some((t) => src.includes(t))) return true;
  const num = targetGrade.replace(/\D/g, '');
  return num ? new RegExp(`(^|\\D)${num}(\\D|$)`).test(src) : false;
};

interface GuardianMobilePortalProps {
  schoolName: string;
  activeTab: GuardianAppTab;
  onTabChange: (tab: GuardianAppTab) => void;
  activeStudent: Student | null;
  isStaffPreview: boolean;
  notices: Notice[];
  routines: RoutineSlot[];
  todaySubstitutions: SubstitutionRecord[];
  homeworks: HomeworkAssignment[];
  onSwitchToLogin: () => void;
}

export default function GuardianMobilePortal({
  schoolName,
  activeTab,
  onTabChange,
  activeStudent,
  isStaffPreview,
  notices,
  routines,
  todaySubstitutions,
  homeworks,
  onSwitchToLogin,
}: GuardianMobilePortalProps) {
  const [selectedDay, setSelectedDay] = useState<RoutineSlot['day']>(
    () => routineService.getDayFromDate(localDateKey()) || 'Sunday'
  );
  const [feeRefreshTick, setFeeRefreshTick] = useState(0);
  const [pgProvider, setPgProvider] = useState<PaymentGatewayProvider>('bKash');
  const [pgTrxId, setPgTrxId] = useState('');
  const [pgInitiatedTrx, setPgInitiatedTrx] = useState('');
  const [pgStatusMsg, setPgStatusMsg] = useState('');
  const [pgReceipt, setPgReceipt] = useState<PaymentRecord | null>(null);
  const [pgBusy, setPgBusy] = useState(false);

  const feeLedger: StudentFeeLedger | null = useMemo(() => {
    if (!activeStudent) return null;
    void feeRefreshTick;
    try {
      return financeService.getStudentFeeLedger(
        activeStudent.id,
        activeStudent.grade,
        activeStudent.isStipend
      );
    } catch {
      return null;
    }
  }, [activeStudent, feeRefreshTick]);

  const attendanceInfo = useMemo(() => {
    if (typeof window === 'undefined' || !activeStudent) {
      return { todayStatus: 'তথ্য পাওয়া যায়নি', isPresent: true, rate: 0, totalPresent: 0, totalDays: 0 };
    }
    const todayLocal = localDateKey();
    const todayIso = new Date().toISOString().split('T')[0];
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

        if (k.startsWith(`sms_attendance_${todayLocal}`) || k.startsWith(`sms_attendance_${todayIso}`)) {
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
    } catch {
      // Ignore corrupt attendance entries
    }

    const computedRate =
      totalDays > 0
        ? Math.round((totalPresent / totalDays) * 100)
        : typeof activeStudent.attendance === 'number'
        ? activeStudent.attendance
        : 0;

    return { todayStatus, isPresent, rate: computedRate, totalPresent, totalDays };
  }, [activeStudent]);

  const examSummary = useMemo(() => {
    if (typeof window === 'undefined' || !activeStudent) {
      return { gpa: '—', grade: '—', marksList: [] as Array<{ subject: string; total: number; grade: string }> };
    }
    const marksList: Array<{ subject: string; total: number; grade: string }> = [];

    try {
      const candidateExams: string[] = [];
      const setupRaw = localStorage.getItem('sms_exam_setup');
      if (setupRaw) {
        const setup = JSON.parse(setupRaw);
        const configuredExam =
          setup?.activeExam ||
          (Array.isArray(setup?.exams) && setup.exams.length > 0
            ? setup.exams[0]?.name || setup.exams[0]
            : '');
        if (configuredExam) candidateExams.push(String(configuredExam));
      }
      for (const fallbackExam of ['বার্ষিক পরীক্ষা ২০২৬', 'অর্ধ-বার্ষিক পরীক্ষা ২০২৬']) {
        if (!candidateExams.includes(fallbackExam)) candidateExams.push(fallbackExam);
      }

      let evaluated = null;
      for (const examName of candidateExams) {
        const res = resultService.calculateStudentResult({
          examId: examName,
          student: activeStudent,
          grade: activeStudent.grade || '10th',
          branch: activeStudent.section || 'A',
          group: activeStudent.group || 'সাধারণ',
        });
        if (res && (res.enteredSubjectsCount || 0) > 0) {
          evaluated = res;
          break;
        }
      }

      if (evaluated && (evaluated.enteredSubjectsCount || 0) > 0) {
        const seenJointCodes = new Set<string>();
        for (const entry of Object.values(evaluated.subjectMarks)) {
          if (entry.isJointPass && entry.jointPairCode) {
            if (seenJointCodes.has(entry.subjectCode) || seenJointCodes.has(entry.jointPairCode)) continue;
            const pairEntry = evaluated.subjectMarks[entry.jointPairCode];
            seenJointCodes.add(entry.subjectCode);
            seenJointCodes.add(entry.jointPairCode);
            if (!entry.hasMarks && !pairEntry?.hasMarks) continue;
            marksList.push({
              subject: pairEntry ? `${entry.subjectName} + ${pairEntry.subjectName}` : entry.subjectName,
              total: entry.totalMarks + (pairEntry?.totalMarks || 0),
              grade: entry.letterGrade,
            });
          } else if (entry.hasMarks) {
            marksList.push({
              subject: entry.subjectName,
              total: entry.totalMarks,
              grade: entry.letterGrade,
            });
          }
        }

        if (evaluated.optionalSubjectMark?.hasMarks) {
          marksList.push({
            subject: `${evaluated.optionalSubjectMark.subjectName} (৪র্থ)`,
            total: evaluated.optionalSubjectMark.totalMarks,
            grade: evaluated.optionalSubjectMark.letterGrade,
          });
        }

        return {
          gpa: toBnDigit(evaluated.gpa.toFixed(2)),
          grade: evaluated.letterGrade,
          marksList,
        };
      }

      const rawMarks = localStorage.getItem('sms_exam_marks');
      if (rawMarks) {
        const parsed = JSON.parse(rawMarks);
        if (Array.isArray(parsed)) {
          let gpSum = 0;
          let gpCount = 0;
          let hasFail = false;
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

          if (gpCount > 0) {
            const legacyGpa = hasFail ? 0 : Math.min(5, gpSum / gpCount);
            return {
              gpa: toBnDigit(legacyGpa.toFixed(2)),
              grade: gpaToLetterGrade(legacyGpa, hasFail),
              marksList,
            };
          }
        }
      }
    } catch {
      // Ignore evaluation error
    }

    const importedGpa = activeStudent.gpa ? Number(activeStudent.gpa) : null;
    if (importedGpa !== null && !Number.isNaN(importedGpa)) {
      return {
        gpa: toBnDigit(importedGpa.toFixed(2)),
        grade: gpaToLetterGrade(importedGpa, importedGpa === 0),
        marksList,
      };
    }

    return { gpa: 'অপেক্ষমাণ', grade: '—', marksList };
  }, [activeStudent]);

  const effectiveGrade = activeStudent?.grade || '10th';

  const filteredHomeworks = useMemo(() => {
    return homeworks.filter((h) => {
      if (effectiveGrade && !matchesGradeId(h.grade, effectiveGrade)) return false;
      if (activeStudent?.section && h.section !== 'all' && h.section !== activeStudent.section) return false;
      return true;
    });
  }, [homeworks, effectiveGrade, activeStudent?.section]);

  const dayRoutines = useMemo(() => {
    return routines
      .filter((r) => r.day === selectedDay && matchesGradeId(r.classId, effectiveGrade))
      .sort((a, b) => a.periodNo - b.periodNo);
  }, [routines, selectedDay, effectiveGrade]);

  if (!activeStudent) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center space-y-3">
        <ShieldCheck className="w-9 h-9 text-emerald-600 dark:text-emerald-400 mx-auto" />
        <h3 className="text-sm font-black text-slate-900 dark:text-white">কোনো শিক্ষার্থী নির্বাচিত নেই</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          তথ্য দেখতে অনুগ্রহ করে লগইন পাতায় গিয়ে শ্রেণি, রোল ও অভিভাবকের মোবাইল নম্বর দিয়ে যাচাই করুন।
        </p>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer"
        >
          লগইন পাতায় যান
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Active Student Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200/90 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-500/30 shrink-0">
            <InitialsAvatar
              src={activeStudent.photo}
              name={activeStudent.name}
              className="w-full h-full"
              textClassName="text-sm"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-black text-slate-900 dark:text-white truncate">
                {activeStudent.name}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                {isStaffPreview ? 'স্টাফ প্রিভিউ' : 'ভেরিফাইড'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
              {gradeLabel(activeStudent.grade)} • রোল: {toBnDigit(activeStudent.roll)} • শাখা: {activeStudent.section || 'ক'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
          <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/50">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">উপস্থিতি</span>
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">
              {attendanceInfo.totalDays > 0 || attendanceInfo.rate > 0 ? `${toBnDigit(attendanceInfo.rate)}%` : 'তথ্য নেই'}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/50">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">সর্বশেষ জিপিএ</span>
            <span className="text-xs font-black text-blue-700 dark:text-blue-300">
              {examSummary.gpa} ({examSummary.grade})
            </span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/50">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">বকেয়া ফি</span>
            <span className="text-xs font-black text-amber-800 dark:text-amber-200">
              ৳{toBnDigit(feeLedger?.totalDue ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* TAB 1: HOME (Clean — NO Install Banner & NO Helpline Banner!) */}
      {activeTab === 'home' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => onTabChange('attendance')}
            className={`w-full p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition text-left ${
              attendanceInfo.isPresent
                ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                  attendanceInfo.isPresent ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black">আজকের ডিজিটাল হাজিরা স্ট্যাটাস</h3>
                <p className="text-[11px] font-semibold opacity-80 mt-0.5">{attendanceInfo.todayStatus}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-60" />
          </button>

          <div>
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 px-1">
              ডিজিটাল ক্যাম্পাস সেবাসমূহ
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => onTabChange('attendance')}
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
                onClick={() => onTabChange('results')}
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
                onClick={() => onTabChange('fees')}
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
                onClick={() => onTabChange('notices')}
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

              <button
                type="button"
                onClick={() => onTabChange('homework')}
                className="col-span-3 p-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/60 dark:to-violet-950/50 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-black text-slate-900 dark:text-white block">ডিজিটাল হোমওয়ার্ক ও লেকচার</span>
                    <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold">
                      সক্রিয় পাঠ: {toBnDigit(filteredHomeworks.length)}টি
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white">সর্বশেষ নোটিশ ও বিজ্ঞপ্তি</h3>
              </div>
              <button
                type="button"
                onClick={() => onTabChange('notices')}
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
                    onClick={() => onTabChange('notices')}
                    className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-800/60 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1">{n.title}</span>
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200 shrink-0">
                        {new Date(n.publishedAt).toLocaleDateString('bn-BD')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">{n.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                বর্তমানে কোনো নতুন বিজ্ঞপ্তি নেই।
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">ডিজিটাল হাজিরা প্রতিবেদন</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">আজকের স্ট্যাটাস ও সামগ্রিক উপস্থিতি</p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-black text-xs">
              {toBnDigit(attendanceInfo.rate)}% উপস্থিতি
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(4, attendanceInfo.rate))}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">মোট কার্যদিবস</span>
              <span className="text-base font-black text-slate-900 dark:text-white">{toBnDigit(attendanceInfo.totalDays)} দিন</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-800/60">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">উপস্থিত</span>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-300">{toBnDigit(attendanceInfo.totalPresent)} দিন</span>
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
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">আজ: {attendanceInfo.todayStatus}</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              {new Date().toLocaleDateString('bn-BD')}
            </span>
          </div>
        </div>
      )}

      {/* TAB 3: RESULTS */}
      {activeTab === 'results' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">একাডেমিক ফলাফল ও মার্কশিট</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeStudent.name} • রোল: {toBnDigit(activeStudent.roll || 1)}
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
                <span className="col-span-3 text-center">নম্বর</span>
                <span className="col-span-2 text-right">গ্রেড</span>
              </div>
              {examSummary.marksList.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 px-3 py-2.5 text-xs items-center">
                  <span className="col-span-7 font-bold text-slate-800 dark:text-slate-100 truncate">{item.subject}</span>
                  <span className="col-span-3 text-center font-extrabold text-slate-900 dark:text-white">{toBnDigit(item.total)}</span>
                  <span className="col-span-2 text-right font-black text-emerald-700 dark:text-emerald-300">{item.grade}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/60 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
              এখনো কোনো পরীক্ষার নম্বর প্রকাশ হয়নি।
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

      {/* TAB 4: FEES */}
      {activeTab === 'fees' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">বেতন ও ফি খতিয়ান</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">মাসিক টিউশন ও অন্যান্য ফি</p>
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
              <span className="text-xs font-black text-slate-900 dark:text-white">৳{toBnDigit(feeLedger?.totalBilled ?? 0)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">পরিশোধিত</span>
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">৳{toBnDigit(feeLedger?.totalPaid ?? 0)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60">
              <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold block">বকেয়া</span>
              <span className="text-xs font-black text-rose-700 dark:text-rose-300">৳{toBnDigit(feeLedger?.totalDue ?? 0)}</span>
            </div>
          </div>

          {feeLedger?.months && feeLedger.months.length > 0 && (
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
                    {m.status === 'paid' ? 'পরিশোধিত' : m.status === 'waived' ? 'মওকুফ' : `৳${toBnDigit(m.dueAmount)}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {(feeLedger?.totalDue ?? 0) > 0 && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">অনলাইন ফি পরিশোধ</span>
                <span className="text-[11px] font-black text-rose-600 dark:text-rose-400">
                  বকেয়া: ৳{toBnDigit(feeLedger?.totalDue ?? 0)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {(['bKash', 'Nagad', 'SSLCommerz'] as PaymentGatewayProvider[]).map((prov) => (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => setPgProvider(prov)}
                    className={`py-2 rounded-xl text-[11px] font-black border transition cursor-pointer ${
                      pgProvider === prov
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {prov}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={pgBusy}
                  onClick={async () => {
                    if (!feeLedger) return;
                    setPgBusy(true);
                    setPgStatusMsg('');
                    try {
                      const dueMonths = feeLedger.months.filter((m) => m.dueAmount > 0).map((m) => m.month);
                      const res = await paymentGatewayService.initiateCheckout({
                        provider: pgProvider,
                        student: activeStudent,
                        amount: feeLedger.totalDue,
                        monthsPaid: dueMonths,
                      });
                      if (res.success && res.transaction) {
                        setPgInitiatedTrx(res.transaction.trxId);
                        if (!pgTrxId) setPgTrxId(res.transaction.trxId);
                        setPgStatusMsg(`সেশন তৈরি হয়েছে: ${res.transaction.trxId}`);
                      } else {
                        setPgStatusMsg(res.message);
                      }
                    } finally {
                      setPgBusy(false);
                    }
                  }}
                  className="py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer"
                >
                  ১. সেশন শুরু করুন
                </button>
                <div className="flex gap-2">
                  <input
                    value={pgTrxId}
                    onChange={(e) => setPgTrxId(e.target.value)}
                    placeholder={pgInitiatedTrx || 'TrxID লিখুন'}
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    disabled={pgBusy}
                    onClick={async () => {
                      if (!feeLedger) return;
                      setPgBusy(true);
                      try {
                        const dueMonths = feeLedger.months.filter((m) => m.dueAmount > 0).map((m) => m.month);
                        const res = await paymentGatewayService.verifyAndSettlePayment({
                          provider: pgProvider,
                          student: activeStudent,
                          amount: feeLedger.totalDue,
                          trxId: pgTrxId || pgInitiatedTrx,
                          monthsPaid: dueMonths,
                          collectedBy: `মোবাইল অ্যাপ (${pgProvider})`,
                        });
                        setPgStatusMsg(res.message);
                        if (res.success && res.receipt) {
                          setPgReceipt(res.receipt);
                          setFeeRefreshTick((t) => t + 1);
                          setPgTrxId('');
                        }
                      } finally {
                        setPgBusy(false);
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer shrink-0"
                  >
                    যাচাই করুন
                  </button>
                </div>
              </div>
              {pgStatusMsg && <p className="text-[11px] font-bold text-indigo-800 dark:text-indigo-200">{pgStatusMsg}</p>}
            </div>
          )}

          {pgReceipt && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
              <div className="flex items-center justify-between font-black text-emerald-800 dark:text-emerald-200">
                <span>ডিজিটাল রসিদ নিশ্চিত!</span>
                <span className="font-mono">{pgReceipt.receiptId}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href={`/verify-certificate?type=receipt&id=${encodeURIComponent(pgReceipt.receiptId)}`}
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-[11px] font-black"
                >
                  রসিদ দেখুন
                </Link>
                <a
                  href={paymentGatewayService.buildWhatsAppShareUrl(pgReceipt, schoolName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-[11px] font-black flex items-center gap-1"
                >
                  <Share2 className="w-3 h-3" /> শেয়ার
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: HOMEWORK */}
      {activeTab === 'homework' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              ডিজিটাল হোমওয়ার্ক ({gradeLabel(effectiveGrade)})
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black">
              {toBnDigit(filteredHomeworks.length)}টি
            </span>
          </div>

          {filteredHomeworks.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6 font-bold">
              এই শ্রেণির জন্য বর্তমানে কোনো সক্রিয় হোমওয়ার্ক নেই।
            </p>
          ) : (
            <div className="space-y-2.5">
              {filteredHomeworks.map((hw) => (
                <div key={hw.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black">
                      {hw.subject}
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">জমা: {hw.dueDate}</span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">{hw.title}</h4>
                  {hw.description && <p className="text-[11px] text-slate-600 dark:text-slate-400">{hw.description}</p>}
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span>শিক্ষক: {hw.teacherName}</span>
                    {hw.attachmentUrl && (
                      <a
                        href={hw.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> {hw.attachmentName || 'ফাইল'}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: NOTICES & ROUTINE */}
      {activeTab === 'notices' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              সাপ্তাহিক ক্লাস রুটিন ({gradeLabel(effectiveGrade)})
            </h3>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {ROUTINE_DAYS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setSelectedDay(d.key)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 cursor-pointer ${
                    selectedDay === d.key
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {d.labelBn}
                </button>
              ))}
            </div>
            {dayRoutines.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">এই দিনে কোনো নির্ধারিত ক্লাস নেই।</p>
            ) : (
              <div className="space-y-2">
                {dayRoutines.map((slot) => {
                  const periodMeta = ROUTINE_PERIODS.find((p) => p.periodNo === slot.periodNo);
                  const activeSub = todaySubstitutions.find(
                    (sub) => sub.classId === slot.classId && sub.periodNo === slot.periodNo
                  );
                  return (
                    <div
                      key={slot.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">{slot.subject}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {activeSub ? `${activeSub.substituteTeacherName} (প্রক্সি)` : slot.teacherName} • কক্ষ: {slot.roomNo || 'মূল ভবন'}
                        </span>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-bold text-[10px] shrink-0">
                        {periodMeta ? `${periodMeta.startTime}-${periodMeta.endTime}` : `পি-${toBnDigit(slot.periodNo)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-600" />
              ডিজিটাল নোটিশ বোর্ড
            </h3>
            {notices.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-3">বর্তমানে কোনো নতুন বিজ্ঞপ্তি নেই।</p>
            ) : (
              <div className="space-y-2">
                {notices.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
