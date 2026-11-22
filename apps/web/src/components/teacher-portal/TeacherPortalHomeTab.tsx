'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardList,
  Clock,
  Edit3,
  KeyRound,
  Pencil,
  Send,
  Smartphone,
  UserCheck,
  Users,
} from 'lucide-react';
import type {
  ClassTeacherAssignment,
  SubjectAssignment,
  TeacherRecord,
} from '@/services/teacherRBACService';
import type { RoutineSlot, SubstitutionRecord } from '@/services/routineService';
import type { HomeworkAssignment } from '@/services/homeworkService';
import type { LeaveApplication } from '@/services/leaveService';
import type { Notice } from '@/services/noticeService';
import {
  branchLabel,
  formatClassIdBn,
  getPeriodTimeRange,
  getRoutineDayLabelBn,
  gradeLabel,
  TeacherPortalTab,
  toBnDigit,
  TodayAttendanceSummary,
} from './teacherPortalUtils';

interface TeacherPortalHomeTabProps {
  teacher: TeacherRecord | null;
  teacherName: string;
  teacherId: string;
  designation: string;
  isClassTeacher: boolean;
  classTeachers: ClassTeacherAssignment[];
  assignments: SubjectAssignment[];
  assignmentsByGrade: Record<string, SubjectAssignment[]>;
  sortedGradeKeys: string[];
  classStudentsCount: number;
  todayAttendance: TodayAttendanceSummary | null;
  todayRoutineDay: RoutineSlot['day'];
  todayMyRoutines: RoutineSlot[];
  myTodaySubstitutions: SubstitutionRecord[];
  homeworks: HomeworkAssignment[];
  leaves: LeaveApplication[];
  notices: Notice[];
  lastSaved: string | null;
  onSwitchTab: (tab: TeacherPortalTab) => void;
}

export default function TeacherPortalHomeTab({
  teacher,
  teacherName,
  teacherId,
  designation,
  isClassTeacher,
  classTeachers,
  assignments,
  assignmentsByGrade,
  sortedGradeKeys,
  classStudentsCount,
  todayAttendance,
  todayRoutineDay,
  todayMyRoutines,
  myTodaySubstitutions,
  homeworks,
  leaves,
  notices,
  lastSaved,
  onSwitchTab,
}: TeacherPortalHomeTabProps) {
  const activeHomeworkCount = homeworks.filter((h) => h.status === 'active').length;
  const pendingLeavesCount = leaves.filter((l) => l.status === 'pending').length;
  const urgentNoticesCount = notices.filter((n) => n.priority === 'urgent').length;

  const recentNotices = [...notices]
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, 3);

  const primaryClassTeacher = classTeachers[0];
  const primaryCtParts = primaryClassTeacher
    ? primaryClassTeacher.classId.split('-')
    : [];
  const primaryAttendanceHref =
    primaryCtParts.length >= 1 && primaryCtParts[0]
      ? `/dashboard/academic/attendance?grade=${primaryCtParts[0]}${
          primaryCtParts[1] ? `&branch=${primaryCtParts[1]}` : ''
        }`
      : '/dashboard/academic/attendance';

  return (
    <div className="space-y-5">
      {/* Gentle Password Change Reminder (only when mustChangePassword is active) */}
      {teacher?.mustChangePassword && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
              <KeyRound size={15} />
            </div>
            <div className="text-xs">
              <p className="font-extrabold text-amber-950 dark:text-amber-200">
                নিরাপত্তার জন্য প্রাথমিক পাসওয়ার্ড পরিবর্তন করুন
              </p>
              <p className="text-amber-800/90 dark:text-amber-300/90 font-medium mt-0.5">
                প্রোফাইল ও নিরাপত্তা ট্যাব থেকে আপনার ব্যক্তিগত নতুন পাসওয়ার্ড সেট করুন।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSwitchTab('profile')}
            className="h-9 px-3.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0 self-start sm:self-auto"
          >
            পাসওয়ার্ড পরিবর্তন করুন
          </button>
        </div>
      )}

      {/* Calm Institutional Daily Summary Strip (No heavy dark banner or bloated KPI boxes) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] px-4 sm:px-5 py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          {teacher?.photoUrl ? (
            <img
              src={teacher.photoUrl}
              alt={teacherName}
              className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/70 text-[#0B5D3B] dark:text-emerald-300 font-black text-base flex items-center justify-center shrink-0">
              {teacherName.charAt(0) || 'শ'}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                স্বাগতম, {teacherName}
              </h1>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                সক্রিয় শিক্ষক
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {designation}
              </span>
              <span>•</span>
              <span className="font-mono">আইডি: {toBnDigit(teacherId)}</span>
              <span>•</span>
              <span className="font-bold text-[#0B5D3B] dark:text-emerald-400">
                {isClassTeacher
                  ? `শ্রেণি শিক্ষক: ${classTeachers
                      .map((ct) => formatClassIdBn(ct.classId))
                      .join(', ')}`
                  : 'বিষয়ভিত্তিক শিক্ষক'}
              </span>
              {lastSaved && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline text-[11px] text-slate-400">
                    সর্বশেষ নম্বর সংরক্ষণ: {lastSaved}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Lightweight Inline Daily Counters + Mobile App Shortcut */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onSwitchTab('routine')}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            <Calendar size={14} className="text-[#0B5D3B] dark:text-emerald-400" />
            <span>আজকের ক্লাস</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-extrabold text-[11px] text-slate-900 dark:text-white">
              {toBnDigit(todayMyRoutines.length)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchTab('attendance')}
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
              todayAttendance?.hasRollCall
                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/70 text-[#0B5D3B] dark:text-emerald-300'
                : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/70 text-amber-800 dark:text-amber-300'
            }`}
          >
            <UserCheck size={14} />
            <span>হাজিরা</span>
            <span className="font-mono font-extrabold text-[11px]">
              {todayAttendance?.hasRollCall
                ? `${toBnDigit(todayAttendance.rate)}%`
                : 'বাকি'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchTab('marks')}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            <BookOpen size={14} className="text-slate-500 dark:text-slate-400" />
            <span>বিষয়</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-extrabold text-[11px] text-slate-900 dark:text-white">
              {toBnDigit(assignments.length)}
            </span>
          </button>

          <Link
            href="/mobile-app"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
          >
            <Smartphone size={14} className="text-[#0B5D3B] dark:text-emerald-400" />
            <span>মোবাইল অ্যাপ</span>
          </Link>
        </div>
      </div>

      {/* Main Two-Column Daily Workflow Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (7 cols): Today's Schedule + Assigned Subjects Table */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Today's Schedule & Proxy Snapshot */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Calendar size={15} />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    আজকের ক্লাস রুটিন ({getRoutineDayLabelBn(todayRoutineDay)})
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    আপনার নির্ধারিত পিরিয়ড ও বিকল্প (প্রক্সি) দায়িত্ব
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSwitchTab('routine')}
                className="text-xs font-bold text-[#0B5D3B] dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>পূর্ণ রুটিন</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              {myTodaySubstitutions.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 space-y-2">
                  <p className="text-xs font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    আজকের নির্ধারিত প্রক্সি ক্লাস ({toBnDigit(myTodaySubstitutions.length)}টি)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {myTodaySubstitutions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/60 text-xs"
                      >
                        <p className="font-extrabold text-slate-900 dark:text-white">
                          পিরিয়ড {toBnDigit(sub.periodNo)} • {sub.subject}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          {formatClassIdBn(sub.classId)} • মূল শিক্ষক: {sub.absentTeacherName}
                          {sub.roomNo ? ` • রুম: ${sub.roomNo}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {todayMyRoutines.length === 0 ? (
                <div className="py-7 px-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1.5">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    আজ ({getRoutineDayLabelBn(todayRoutineDay)}) আপনার কোনো নির্ধারিত ক্লাস স্লট নেই।
                  </p>
                  <button
                    type="button"
                    onClick={() => onSwitchTab('routine')}
                    className="text-[11px] font-bold text-[#0B5D3B] dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    অন্যান্য দিনের সাপ্তাহিক রুটিন দেখুন →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {todayMyRoutines
                    .slice()
                    .sort((a, b) => a.periodNo - b.periodNo)
                    .map((slot) => {
                      const timeRange = getPeriodTimeRange(slot.periodNo);
                      return (
                        <div
                          key={slot.id}
                          className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3"
                        >
                          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-[#0B5D3B] dark:text-emerald-300 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold leading-none">পিরিয়ড</span>
                            <span className="text-sm font-black font-mono leading-tight mt-0.5">
                              {toBnDigit(slot.periodNo)}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                              {slot.subject}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate mt-0.5">
                              {gradeLabel(slot.grade)} ({branchLabel(slot.branch)}) • রুম:{' '}
                              {slot.roomNo || '—'}
                            </p>
                            {timeRange && (
                              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                <Clock size={10} />
                                {timeRange}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* 2. Class-Wise Assigned Subjects Table (Preserved with Executive Styling + Mobile Cards) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <BookOpen size={15} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      আমার বরাদ্দকৃত বিষয়সমূহ (শ্রেণিভিত্তিক)
                    </h2>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      মোট {toBnDigit(assignments.length)}টি
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    যেকোনো বিষয়ে সরাসরি নম্বর এন্ট্রি করতে বিষয়টিতে ক্লিক করুন
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/exam/mark-entry"
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0 self-start sm:self-auto"
              >
                <Pencil size={13} />
                <span>নম্বর এন্ট্রি প্যানেল</span>
              </Link>
            </div>

            {assignments.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/70 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <AlertCircle size={20} />
                </div>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  এখনও কোনো বিষয় বরাদ্দ করা হয়নি
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  প্রধান শিক্ষক বা অ্যাডমিন প্যানেল থেকে আপনার আইডিতে শ্রেণিভিত্তিক বিষয় বণ্টন করা হলে এখানে প্রদর্শিত হবে।
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Executive Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 font-extrabold text-[11px] border-b border-slate-200/90 dark:border-slate-800">
                        <th className="py-2.5 px-4 w-36">শ্রেণি</th>
                        <th className="py-2.5 px-4">বরাদ্দকৃত বিষয়সমূহ</th>
                        <th className="py-2.5 px-4 text-center w-20">সংখ্যা</th>
                        <th className="py-2.5 px-4 text-right w-28">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {sortedGradeKeys.map((gradeKey) => {
                        const gradeAssignments = assignmentsByGrade[gradeKey] || [];
                        return (
                          <tr
                            key={gradeKey}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-3 px-4 align-middle">
                              <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                                {gradeLabel(gradeKey)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                শিক্ষাবর্ষ: ২০২৬
                              </span>
                            </td>
                            <td className="py-3 px-4 align-middle">
                              <div className="flex flex-wrap gap-1.5">
                                {gradeAssignments.map((a) => (
                                  <Link
                                    key={a.id}
                                    href={`/dashboard/exam/mark-entry?grade=${a.classId}&subject=${encodeURIComponent(
                                      a.subjectId
                                    )}`}
                                    title={`${gradeLabel(a.classId)} — ${a.subjectId} নম্বর এন্ট্রি`}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-[#0B5D3B] hover:text-white dark:hover:bg-[#0B5D3B] text-slate-800 dark:text-slate-200 text-[11px] font-bold transition border border-slate-200 dark:border-slate-700 hover:border-[#0B5D3B] group"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:bg-white shrink-0" />
                                    <span>{a.subjectId}</span>
                                    <Edit3
                                      size={11}
                                      className="opacity-50 group-hover:opacity-100 shrink-0"
                                    />
                                  </Link>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center align-middle">
                              <span className="font-mono font-extrabold text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {toBnDigit(gradeAssignments.length)}টি
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right align-middle">
                              <Link
                                href={`/dashboard/exam/mark-entry?grade=${gradeKey}${
                                  gradeAssignments.length > 0
                                    ? `&subject=${encodeURIComponent(gradeAssignments[0].subjectId)}`
                                    : ''
                                }`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-[#0B5D3B] text-[#0B5D3B] dark:text-emerald-300 hover:text-white border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] font-bold transition"
                              >
                                <Edit3 size={12} />
                                <span>নম্বর দিন</span>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Touch-Friendly Stacked Subject Cards */}
                <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {sortedGradeKeys.map((gradeKey) => {
                    const gradeAssignments = assignmentsByGrade[gradeKey] || [];
                    return (
                      <div key={gradeKey} className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {gradeLabel(gradeKey)}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            {toBnDigit(gradeAssignments.length)}টি বিষয়
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {gradeAssignments.map((a) => (
                            <Link
                              key={a.id}
                              href={`/dashboard/exam/mark-entry?grade=${a.classId}&subject=${encodeURIComponent(
                                a.subjectId
                              )}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 active:bg-emerald-50"
                            >
                              <span>{a.subjectId}</span>
                              <Edit3 size={11} className="text-[#0B5D3B] dark:text-emerald-400" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Today's Attendance + Quick Actions + Recent Notices */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Today's Roll Call & Gender Breakdown Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <UserCheck size={15} />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    আজকের হাজিরা সারসংক্ষেপ
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {isClassTeacher
                      ? formatClassIdBn(primaryClassTeacher.classId)
                      : 'দৈনিক উপস্থিতি ও রোল কল'}
                  </p>
                </div>
              </div>

              {todayAttendance?.hasRollCall ? (
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                  হার: {toBnDigit(todayAttendance.rate)}%
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shrink-0">
                  রোল কল বাকি
                </span>
              )}
            </div>

            {/* Clean 3-column summary strip (Total / Present / Absent) + Boys/Girls detail */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                  মোট শিক্ষার্থী
                </span>
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                  {toBnDigit(todayAttendance?.totalEnrolled || classStudentsCount || 0)}
                </span>
              </div>
              <div className="border-x border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-[#0B5D3B] dark:text-emerald-400 block">
                  উপস্থিত
                </span>
                <span className="text-sm font-black font-mono text-[#0B5D3B] dark:text-emerald-400">
                  {todayAttendance?.hasRollCall ? toBnDigit(todayAttendance.total) : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block">
                  অনুপস্থিত
                </span>
                <span className="text-sm font-black font-mono text-rose-600 dark:text-rose-400">
                  {todayAttendance?.hasRollCall ? toBnDigit(todayAttendance.absent) : '—'}
                </span>
              </div>
            </div>

            {todayAttendance?.hasRollCall && (
              <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50">
                <span className="text-slate-600 dark:text-slate-300 font-semibold">
                  উপস্থিত ছাত্র:{' '}
                  <strong className="font-mono text-slate-900 dark:text-white">
                    {toBnDigit(todayAttendance.boys)} জন
                  </strong>
                </span>
                <span className="text-slate-600 dark:text-slate-300 font-semibold">
                  উপস্থিত ছাত্রী:{' '}
                  <strong className="font-mono text-slate-900 dark:text-white">
                    {toBnDigit(todayAttendance.girls)} জন
                  </strong>
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Link
                href={primaryAttendanceHref}
                className="flex-1 h-9 px-3.5 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <UserCheck size={14} />
                <span>{isClassTeacher ? 'হাজিরা শিট খুলুন' : 'হাজিরা প্যানেল'}</span>
              </Link>
              <button
                type="button"
                onClick={() => onSwitchTab('attendance')}
                className="h-9 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                বিস্তারিত
              </button>
            </div>
          </div>

          {/* 2. Calm Quick Daily Workflow Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-4 sm:p-5 space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              দ্রুত শিক্ষক কার্যক্রম
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onSwitchTab('students')}
                className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 text-left transition cursor-pointer space-y-1.5"
              >
                <Users size={16} className="text-[#0B5D3B] dark:text-emerald-400" />
                <div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                    আমার শ্রেণি ও ফি
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {isClassTeacher
                      ? `${toBnDigit(classStudentsCount)} জন শিক্ষার্থী`
                      : 'শ্রেণি শিক্ষক প্যানেল'}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSwitchTab('homework')}
                className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 text-left transition cursor-pointer space-y-1.5"
              >
                <BookOpen size={16} className="text-[#0B5D3B] dark:text-emerald-400" />
                <div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                    ডিজিটাল হোমওয়ার্ক
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {toBnDigit(activeHomeworkCount)}টি সক্রিয় পাঠ
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSwitchTab('leaves')}
                className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 text-left transition cursor-pointer space-y-1.5"
              >
                <Send size={16} className="text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                    ছুটির আবেদন
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {pendingLeavesCount > 0
                      ? `${toBnDigit(pendingLeavesCount)}টি বিবেচনাধীন`
                      : 'আবেদন ও স্লিপ প্রিন্ট'}
                  </p>
                </div>
              </button>

              <Link
                href="/dashboard/exam/seat-plan"
                className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 text-left transition space-y-1.5"
              >
                <ClipboardList size={16} className="text-slate-600 dark:text-slate-300" />
                <div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                    পরীক্ষার সিট প্ল্যান
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    কক্ষ ও আসন বিন্যাস
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* 3. Latest Institutional Notices Preview */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-[#0B5D3B] dark:text-emerald-400" />
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  সাম্প্রতিক নোটিশ
                </h2>
                {urgentNoticesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60">
                    {toBnDigit(urgentNoticesCount)}টি জরুরি
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onSwitchTab('notices')}
                className="text-xs font-bold text-[#0B5D3B] dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              >
                <span>সব দেখুন</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {recentNotices.length === 0 ? (
              <div className="p-6 text-center text-xs font-medium text-slate-400">
                কোনো প্রকাশিত নোটিশ নেই।
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentNotices.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => onSwitchTab('notices')}
                    className="w-full text-left px-4 sm:px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1">
                        {n.title}
                      </p>
                      {n.priority === 'urgent' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
                          জরুরি
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {n.content}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      {n.publisherName} • {new Date(n.publishedAt).toLocaleDateString('bn-BD')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
