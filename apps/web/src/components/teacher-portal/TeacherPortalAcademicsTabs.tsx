'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Archive,
  BookMarked,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  ExternalLink,
  Pencil,
  RotateCcw,
  Shield,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import type {
  ClassTeacherAssignment,
  SubjectAssignment,
} from '@/services/teacherRBACService';
import {
  ROUTINE_DAYS,
  type RoutineSlot,
  type SubstitutionRecord,
} from '@/services/routineService';
import { homeworkService, type HomeworkAssignment } from '@/services/homeworkService';
import { localDateKey } from '@/lib/dateUtils';
import { confirmDialog } from '@/components/ui/ToastProvider';
import {
  branchLabel,
  formatClassIdBn,
  getPeriodTimeRange,
  gradeLabel,
  isTeacherRoutineSlot,
  toBnDigit,
  TodayAttendanceSummary,
} from './teacherPortalUtils';

// ─── 1. ROUTINE TAB ──────────────────────────────────────────────────────────

interface TeacherPortalRoutineTabProps {
  routines: RoutineSlot[];
  todayRoutineDay: RoutineSlot['day'];
  selectedRoutineDay: RoutineSlot['day'];
  setSelectedRoutineDay: (day: RoutineSlot['day']) => void;
  routineViewMode: 'my' | 'full';
  setRoutineViewMode: (mode: 'my' | 'full') => void;
  teacherId: string;
  teacherNames: string[];
  myTodaySubstitutions: SubstitutionRecord[];
}

export function TeacherPortalRoutineTab({
  routines,
  todayRoutineDay,
  selectedRoutineDay,
  setSelectedRoutineDay,
  routineViewMode,
  setRoutineViewMode,
  teacherId,
  teacherNames,
  myTodaySubstitutions,
}: TeacherPortalRoutineTabProps) {
  const currentDayRoutines = useMemo(() => {
    const dayRoutines = routines
      .filter((r) => r.day === selectedRoutineDay)
      .slice()
      .sort((a, b) => a.periodNo - b.periodNo);

    if (routineViewMode === 'my') {
      return dayRoutines.filter((r) =>
        isTeacherRoutineSlot(r, teacherId, teacherNames)
      );
    }
    return dayRoutines;
  }, [routines, selectedRoutineDay, routineViewMode, teacherId, teacherNames]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-4 sm:p-5 space-y-5">
      {/* Header & View Mode Switch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Calendar size={15} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              সাপ্তাহিক ক্লাস রুটিন ও সময়সূচি
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              শনিবার হতে বৃহস্পতিবার পর্যন্ত নির্ধারিত পিরিয়ড ও প্রক্সি ক্লাস
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="inline-flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
            <button
              type="button"
              onClick={() => setRoutineViewMode('my')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                routineViewMode === 'my'
                  ? 'bg-white dark:bg-slate-900 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              আমার ক্লাস শিডিউল
            </button>
            <button
              type="button"
              onClick={() => setRoutineViewMode('full')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                routineViewMode === 'full'
                  ? 'bg-white dark:bg-slate-900 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              সম্পূর্ণ স্কুল রুটিন
            </button>
          </div>

          <Link
            href="/dashboard/routine"
            className="h-9 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 transition"
          >
            <span>পূর্ণ প্যানেল</span>
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* Horizontal Day Selector */}
      <div className="flex gap-1.5 overflow-x-auto tab-scroll pb-1">
        {ROUTINE_DAYS.map((d) => {
          const isSelected = selectedRoutineDay === d.key;
          const isToday = todayRoutineDay === d.key;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setSelectedRoutineDay(d.key)}
              className={`h-9 px-4 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer border flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{d.labelBn}</span>
              {isToday && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-100 dark:bg-emerald-900/60 text-[#0B5D3B] dark:text-emerald-300'
                  }`}
                >
                  আজ
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Today's Proxy / Substitution Duties Assigned to Logged-in Teacher */}
      {myTodaySubstitutions.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 space-y-2.5">
          <p className="text-xs font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
            <AlertCircle size={15} />
            আজ আপনার জন্য নির্ধারিত প্রক্সি (বিকল্প) ক্লাস ({toBnDigit(myTodaySubstitutions.length)}টি):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {myTodaySubstitutions.map((sub) => (
              <div
                key={sub.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/90 dark:border-amber-800/60 text-xs space-y-0.5"
              >
                <p className="font-extrabold text-slate-900 dark:text-white">
                  {formatClassIdBn(sub.classId)} • {sub.subject} (পিরিয়ড {toBnDigit(sub.periodNo)})
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  মূল শিক্ষক: {sub.absentTeacherName} • রুম: {sub.roomNo || '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slots Grid */}
      {currentDayRoutines.length === 0 ? (
        <div className="py-12 px-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1.5">
          <Calendar size={22} className="mx-auto text-slate-400" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            উক্ত দিনে কোনো নির্ধারিত ক্লাস শিডিউল নেই।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {currentDayRoutines.map((r) => {
            const isMine = isTeacherRoutineSlot(r, teacherId, teacherNames);
            const timeRange = getPeriodTimeRange(r.periodNo);
            return (
              <div
                key={r.id}
                className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                  isMine && routineViewMode === 'full'
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/70'
                    : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-[#0B5D3B] dark:text-emerald-300 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold leading-none">পিরিয়ড</span>
                    <span className="text-sm font-black font-mono leading-tight mt-0.5">
                      {toBnDigit(r.periodNo)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                      {r.subject}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 truncate">
                      {gradeLabel(r.grade)} ({branchLabel(r.branch)}) • রুম: {r.roomNo || '—'}
                    </p>
                    {timeRange && (
                      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <Clock size={10} />
                        {timeRange}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border shrink-0 max-w-[120px] truncate ${
                    isMine
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {r.teacherName}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── 2. ATTENDANCE TAB ───────────────────────────────────────────────────────

interface TeacherPortalAttendanceTabProps {
  isClassTeacher: boolean;
  classTeachers: ClassTeacherAssignment[];
  classStudentsCount: number;
  todayAttendance: TodayAttendanceSummary | null;
}

export function TeacherPortalAttendanceTab({
  isClassTeacher,
  classTeachers,
  classStudentsCount,
  todayAttendance,
}: TeacherPortalAttendanceTabProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-4 sm:p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck size={15} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              দৈনিক হাজিরা ব্যবস্থাপনা
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              শ্রেণি শিক্ষক বরাদ্দকৃত শ্রেণির পূর্ণাঙ্গ হাজিরা এবং সহকারী শিক্ষক পিরিয়ডভিত্তিক হাজিরা নিতে পারবেন
            </p>
          </div>
        </div>

        {/* Inline Roll Call Status Pill */}
        {todayAttendance && (
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {todayAttendance.hasRollCall ? (
              <>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                  উপস্থিত: {toBnDigit(todayAttendance.total)} জন ({toBnDigit(todayAttendance.rate)}%)
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  ছাত্র {toBnDigit(todayAttendance.boys)} • ছাত্রী {toBnDigit(todayAttendance.girls)}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60">
                  অনুপস্থিত: {toBnDigit(todayAttendance.absent)}
                </span>
              </>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                আজকের রোল কল এখনও সম্পন্ন হয়নি
              </span>
            )}
          </div>
        )}
      </div>

      {isClassTeacher ? (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-[#0B5D3B] dark:text-emerald-400">
            আমার শ্রেণি শিক্ষক প্যানেল (পূর্ণাঙ্গ অ্যাক্সেস)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classTeachers.map((ct) => {
              const parts = ct.classId.split('-');
              const g = parts[0] || '';
              const b = parts[1] || '';
              return (
                <div
                  key={ct.id}
                  className="p-5 bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/90 dark:border-slate-800 rounded-2xl flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-[#0B5D3B] dark:text-emerald-300 rounded-xl flex items-center justify-center">
                      <Users size={18} />
                    </div>
                    <span className="text-[11px] font-extrabold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg">
                      মনোনীত শ্রেণি শিক্ষক
                    </span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {formatClassIdBn(ct.classId)}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                      {toBnDigit(classStudentsCount)} জন শিক্ষার্থীর দৈনিক উপস্থিতি, অনুপস্থিতি ও ছুটি রেকর্ড করুন
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/academic/attendance?grade=${g}${b ? `&branch=${b}` : ''}`}
                    className="w-full h-10 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold text-center transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    <UserCheck size={15} />
                    <span>হাজিরা শিট খুলুন</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 bg-slate-50/70 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Shield size={22} />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
            সহকারী শিক্ষক উপস্থিতি মোড
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            আপনাকে কোনো শ্রেণির প্রধান শ্রেণি শিক্ষক হিসেবে নিযুক্ত করা হয়নি। আপনি আপনার ক্লাসের সময়সূচি অনুযায়ী হাজিরা শিট পরিদর্শন করতে পারেন।
          </p>
          <Link
            href="/dashboard/academic/attendance"
            className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <UserCheck size={14} />
            <span>সাধারণ হাজিরা প্যানেল</span>
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── 3. MARKS ENTRY TAB (RBAC SCOPED) ────────────────────────────────────────

interface TeacherPortalMarksTabProps {
  assignments: SubjectAssignment[];
}

export function TeacherPortalMarksTab({ assignments }: TeacherPortalMarksTabProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-4 sm:p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Pencil size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                নম্বর এন্ট্রি — অনুমোদিত বিষয়সমূহ
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                {toBnDigit(assignments.length)}টি বিষয়
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Deny-by-Default নীতিতে আপনি শুধুমাত্র আপনার বরাদ্দকৃত বিষয়ে নম্বর প্রদান ও পরিবর্তন করতে পারবেন।
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/exam/mark-entry"
          className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto shrink-0"
        >
          <Pencil size={13} />
          <span>সম্পূর্ণ মার্ক এন্ট্রি</span>
        </Link>
      </div>

      {assignments.length === 0 ? (
        <div className="py-12 px-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
          <AlertCircle className="mx-auto text-amber-600 dark:text-amber-400" size={28} />
          <p className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
            কোনো বিষয় বরাদ্দ নেই!
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            অ্যাডমিন প্যানেল থেকে বিষয় বণ্টন সম্পন্ন হলে এখানে নম্বর এন্ট্রি কার্ডসমূহ সক্রিয় হবে।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {assignments.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/exam/mark-entry?grade=${a.classId}&subject=${encodeURIComponent(
                a.subjectId
              )}`}
              className="p-4 bg-slate-50/60 dark:bg-slate-950/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 rounded-2xl transition flex flex-col justify-between space-y-3.5 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#0B5D3B] dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                  <BookMarked size={18} />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700">
                  {gradeLabel(a.classId)}
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition">
                  {a.subjectId}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  ক্লিক করে শিক্ষার্থীদের প্রাপ্ত নম্বর প্রদান করুন
                </p>
              </div>
              <div className="flex items-center justify-between text-[#0B5D3B] dark:text-emerald-400 font-extrabold text-xs pt-2.5 border-t border-slate-200/70 dark:border-slate-800">
                <span>নম্বর দিন</span>
                <ChevronRight size={15} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 4. HOMEWORK TAB ─────────────────────────────────────────────────────────

interface TeacherPortalHomeworkTabProps {
  homeworks: HomeworkAssignment[];
  assignments: SubjectAssignment[];
  teacherId: string;
  teacherName: string;
  isAdmin: boolean;
  onRefreshHomeworks: () => void;
  showAlert: (type: 'success' | 'error', text: string) => void;
}

export function TeacherPortalHomeworkTab({
  homeworks,
  assignments,
  teacherId,
  teacherName,
  isAdmin,
  onRefreshHomeworks,
  showAlert,
}: TeacherPortalHomeworkTabProps) {
  const [hwGrade, setHwGrade] = useState(
    assignments[0]?.classId?.split('-')[0] || '10th'
  );
  const [hwSection, setHwSection] = useState('all');
  const [hwSubject, setHwSubject] = useState(assignments[0]?.subjectId || '');
  const [hwTitle, setHwTitle] = useState('');
  const [hwDueDate, setHwDueDate] = useState(() => localDateKey());
  const [hwDesc, setHwDesc] = useState('');
  const [hwLink, setHwLink] = useState('');
  const [listFilter, setListFilter] = useState<'all' | 'mine' | 'active' | 'archived'>('all');

  const quickSubjects = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ grade: string; subject: string }> = [];
    for (const a of assignments) {
      const baseGrade = a.classId.split('-')[0] || a.classId;
      const key = `${baseGrade}__${a.subjectId}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ grade: baseGrade, subject: a.subjectId });
      }
    }
    return list;
  }, [assignments]);

  const isOwnHomework = (hw: HomeworkAssignment) =>
    isAdmin ||
    (Boolean(teacherId) && hw.teacherId === teacherId) ||
    hw.teacherName === teacherName ||
    !hw.teacherId;

  const visibleHomeworks = useMemo(() => {
    return homeworks.filter((hw) => {
      if (listFilter === 'mine') {
        return (
          (Boolean(teacherId) && hw.teacherId === teacherId) ||
          hw.teacherName === teacherName
        );
      }
      if (listFilter === 'active') return hw.status === 'active';
      if (listFilter === 'archived') return hw.status === 'archived';
      return true;
    });
  }, [homeworks, listFilter, teacherId, teacherName]);

  const handleSubmitHomework = (e: React.FormEvent) => {
    e.preventDefault();
    const res = homeworkService.createHomework({
      title: hwTitle.trim(),
      description: hwDesc.trim(),
      grade: hwGrade,
      section: hwSection,
      subject: hwSubject.trim(),
      teacherId: teacherId || undefined,
      teacherName: teacherName || 'বিষয় শিক্ষক',
      dueDate: hwDueDate || localDateKey(),
      attachmentUrl: hwLink.trim() || undefined,
      attachmentName: hwLink.trim() ? 'সংযুক্ত লেকচার শিট' : undefined,
    });
    if (!res.success) {
      showAlert('error', res.message);
      return;
    }
    showAlert('success', res.message);
    setHwTitle('');
    setHwDesc('');
    setHwLink('');
    onRefreshHomeworks();
  };

  const handleDeleteHomework = async (hw: HomeworkAssignment) => {
    const ok = await confirmDialog({
      title: 'হোমওয়ার্ক মুছুন',
      message: `"${hw.title}" মুছে ফেলবেন?`,
      confirmLabel: 'মুছে ফেলুন',
      danger: true,
    });
    if (!ok) return;
    homeworkService.deleteHomework(hw.id);
    showAlert('success', 'হোমওয়ার্ক সফলভাবে মুছে ফেলা হয়েছে।');
    onRefreshHomeworks();
  };

  const handleToggleArchive = (hw: HomeworkAssignment) => {
    homeworkService.toggleArchive(hw.id);
    showAlert(
      'success',
      hw.status === 'active'
        ? 'হোমওয়ার্ক আর্কাইভ করা হয়েছে।'
        : 'হোমওয়ার্ক পুনরায় সক্রিয় করা হয়েছে।'
    );
    onRefreshHomeworks();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left: Composer Form */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center shrink-0">
              <BookOpen size={15} />
            </div>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-sm">
              নতুন হোমওয়ার্ক ও পাঠ্য প্রকাশ
            </h2>
          </div>
        </div>

        {/* Quick-Fill Assigned Subject Chips */}
        {quickSubjects.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              দ্রুত নির্বাচন (আপনার বরাদ্দকৃত বিষয়):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickSubjects.slice(0, 8).map((item) => {
                const active = hwGrade === item.grade && hwSubject === item.subject;
                return (
                  <button
                    key={`${item.grade}-${item.subject}`}
                    type="button"
                    onClick={() => {
                      setHwGrade(item.grade);
                      setHwSubject(item.subject);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                      active
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {gradeLabel(item.grade)} • {item.subject}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitHomework} className="space-y-3 text-xs font-bold">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">
                শ্রেণি
              </label>
              <select
                value={hwGrade}
                onChange={(e) => setHwGrade(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
              >
                {['6th', '7th', '8th', '9th', '10th'].map((g) => (
                  <option key={g} value={g}>
                    {gradeLabel(g)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">
                শাখা
              </label>
              <select
                value={hwSection}
                onChange={(e) => setHwSection(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
              >
                <option value="all">সকল শাখা</option>
                <option value="A">ক শাখা (A)</option>
                <option value="B">খ শাখা (B)</option>
                <option value="C">গ শাখা (C)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">
                বিষয় *
              </label>
              <input
                type="text"
                value={hwSubject}
                onChange={(e) => setHwSubject(e.target.value)}
                placeholder="যেমন: গণিত"
                required
                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">
                জমার শেষ তারিখ *
              </label>
              <input
                type="date"
                value={hwDueDate}
                onChange={(e) => setHwDueDate(e.target.value)}
                required
                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 mb-1">
              শিরোনাম *
            </label>
            <input
              type="text"
              value={hwTitle}
              onChange={(e) => setHwTitle(e.target.value)}
              placeholder="বাড়ির কাজের শিরোনাম লিখুন"
              required
              className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 mb-1">
              নির্দেশনা
            </label>
            <textarea
              rows={3}
              value={hwDesc}
              onChange={(e) => setHwDesc(e.target.value)}
              placeholder="শিক্ষার্থীদের জন্য নির্দেশনা..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 mb-1">
              পিডিএফ / ড্রাইভ লিংক (ঐচ্ছিক)
            </label>
            <input
              type="url"
              value={hwLink}
              onChange={(e) => setHwLink(e.target.value)}
              placeholder="https://..."
              className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
            />
          </div>

          <button
            type="submit"
            className="w-full h-10 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
          >
            হোমওয়ার্ক প্রকাশ করুন
          </button>
        </form>
      </div>

      {/* Right: Published Homeworks List */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
              প্রকাশিত হোমওয়ার্ক তালিকা ({toBnDigit(visibleHomeworks.length)})
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              শিক্ষার্থীদের জমা ও লেকচার শিট ব্যবস্থাপনা
            </p>
          </div>
        </div>

        {/* Inline Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'সকল' },
              { id: 'mine', label: 'আমার প্রকাশিত' },
              { id: 'active', label: 'সক্রিয়' },
              { id: 'archived', label: 'আর্কাইভ' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setListFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                listFilter === tab.id
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {visibleHomeworks.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-bold rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800">
            এই তালিকায় কোনো হোমওয়ার্ক পাওয়া যায়নি।
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
            {visibleHomeworks.map((hw) => {
              const canManage = isOwnHomework(hw);
              return (
                <div
                  key={hw.id}
                  className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                        {gradeLabel(hw.grade)}
                        {hw.section && hw.section !== 'all'
                          ? ` (${branchLabel(hw.section)})`
                          : ''}{' '}
                        • {hw.subject}
                      </span>
                      {hw.status === 'archived' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          আর্কাইভকৃত
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
                      জমা: {hw.dueDate}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {hw.title}
                    </p>
                    {hw.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {hw.description}
                      </p>
                    )}
                  </div>

                  {hw.attachmentUrl && (
                    <a
                      href={hw.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0B5D3B] dark:text-emerald-400 hover:underline"
                    >
                      <ExternalLink size={12} />
                      <span>{hw.attachmentName || 'সংযুক্ত ফাইল দেখুন'}</span>
                    </a>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>
                      শিক্ষক: {hw.teacherName} • জমা:{' '}
                      {toBnDigit(hw.submittedStudentIds.length)} জন
                    </span>

                    {canManage && (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleArchive(hw)}
                          className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-[#0B5D3B] dark:hover:text-emerald-400 cursor-pointer"
                        >
                          {hw.status === 'active' ? (
                            <>
                              <Archive size={12} />
                              <span>আর্কাইভ</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw size={12} />
                              <span>সক্রিয়</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHomework(hw)}
                          className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>মুছুন</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
