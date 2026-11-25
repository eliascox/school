'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  KeyRound,
  Pin,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import { SubjectAssignment, TeacherRecord } from '@/services/teacherRBACService';
import { Notice } from '@/services/noticeService';
import {
  RoutineSlot,
  ROUTINE_DAYS,
  ROUTINE_PERIODS,
  SubstitutionRecord,
  routineService,
} from '@/services/routineService';
import { homeworkService, HomeworkAssignment } from '@/services/homeworkService';
import { leaveService, LeaveApplication, LEAVE_TYPE_LABELS, LeaveType } from '@/services/leaveService';
import { localDateKey } from '@/lib/dateUtils';

export type TeacherToolSubTab = 'routine' | 'homework' | 'leave' | 'notices';

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

interface TeacherToolsPanelProps {
  session: UserSession;
  isAdmin: boolean;
  teacherProfile: TeacherRecord | null;
  teacherIdentifier: string;
  myAssignedSubjects: SubjectAssignment[];
  routines: RoutineSlot[];
  todaySubstitutions: SubstitutionRecord[];
  notices: Notice[];
  initialSubTab?: TeacherToolSubTab;
  onDataChanged?: () => void;
}

export default function TeacherToolsPanel({
  session,
  isAdmin,
  teacherProfile,
  teacherIdentifier,
  myAssignedSubjects,
  routines,
  todaySubstitutions,
  notices,
  initialSubTab = 'routine',
  onDataChanged,
}: TeacherToolsPanelProps) {
  const [subTab, setSubTab] = useState<TeacherToolSubTab>(initialSubTab);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  // Routine Day
  const todayRoutineDay = useMemo<RoutineSlot['day']>(() => {
    return routineService.getDayFromDate(localDateKey()) || 'Sunday';
  }, []);
  const [selectedDay, setSelectedDay] = useState<RoutineSlot['day']>(todayRoutineDay);

  // Homework state
  const [myHomeworks, setMyHomeworks] = useState<HomeworkAssignment[]>([]);
  const [hwGrade, setHwGrade] = useState<string>(() => myAssignedSubjects[0]?.classId || '8th');
  const [hwSection, setHwSection] = useState<string>('all');
  const [hwSubject, setHwSubject] = useState<string>(() => myAssignedSubjects[0]?.subjectId || 'সাধারণ গণিত');
  const [hwTitle, setHwTitle] = useState('');
  const [hwDesc, setHwDesc] = useState('');
  const [hwDueDate, setHwDueDate] = useState(() => localDateKey());
  const [hwFeedback, setHwFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Leave state
  const [myLeaves, setMyLeaves] = useState<LeaveApplication[]>([]);
  const [leaveType, setLeaveType] = useState<LeaveType>('casual');
  const [leaveStart, setLeaveStart] = useState(() => localDateKey());
  const [leaveEnd, setLeaveEnd] = useState(() => localDateKey());
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveFeedback, setLeaveFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Change state
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passFeedback, setPassFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passBusy, setPassBusy] = useState(false);

  const displayName =
    teacherProfile?.name || session.teacherName || (isAdmin ? 'প্রধান শিক্ষক / অ্যাডমিন' : 'শিক্ষক');
  const displayDesignation =
    teacherProfile?.designation || (isAdmin ? 'প্রশাসনিক প্যানেল' : 'সহকারী শিক্ষক');

  const refreshToolsData = () => {
    const allHw = homeworkService.getHomeworks();
    setMyHomeworks(
      isAdmin
        ? allHw
        : allHw.filter(
            (h) =>
              h.teacherId === session.teacherId ||
              h.teacherName === displayName
          )
    );
    const leaves = isAdmin
      ? leaveService.getLeaves()
      : leaveService.getTeacherLeaves(teacherIdentifier || displayName);
    setMyLeaves(leaves);
  };

  useEffect(() => {
    refreshToolsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, session.teacherId, teacherIdentifier, displayName]);

  useEffect(() => {
    if (!isAdmin && myAssignedSubjects.length > 0) {
      setHwGrade(myAssignedSubjects[0].classId);
      setHwSubject(myAssignedSubjects[0].subjectId);
    }
  }, [isAdmin, myAssignedSubjects]);

  const myDayRoutines = useMemo(() => {
    const matchLower = [teacherIdentifier, displayName, teacherProfile?.id || '', teacherProfile?.phone || '']
      .map((s) => s.toLowerCase().trim())
      .filter(Boolean);
    return routines
      .filter((r) => r.day === selectedDay)
      .filter((r) => {
        if (isAdmin) return true;
        const rName = (r.teacherName || '').toLowerCase().trim();
        const rId = (r.teacherId || '').toLowerCase().trim();
        return matchLower.some(
          (id) => (rId && rId === id) || (rName && (rName === id || rName.includes(id) || id.includes(rName)))
        );
      })
      .sort((a, b) => a.periodNo - b.periodNo);
  }, [routines, selectedDay, isAdmin, teacherIdentifier, displayName, teacherProfile]);

  const sortedNotices = useMemo(() => {
    return [...notices].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [notices]);

  const computedLeaveDays = useMemo(() => {
    const s = new Date(leaveStart);
    const e = new Date(leaveEnd);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 1;
    return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [leaveStart, leaveEnd]);

  const handlePublishHomework = (e: React.FormEvent) => {
    e.preventDefault();
    const res = homeworkService.createHomework({
      title: hwTitle.trim(),
      description: hwDesc.trim(),
      grade: hwGrade,
      section: hwSection,
      subject: hwSubject.trim(),
      teacherId: session.teacherId || teacherProfile?.id,
      teacherName: displayName,
      dueDate: hwDueDate,
    });
    if (res.success) {
      setHwTitle('');
      setHwDesc('');
      setHwFeedback({ type: 'success', text: res.message });
      refreshToolsData();
      onDataChanged?.();
      setTimeout(() => setHwFeedback(null), 3500);
    } else {
      setHwFeedback({ type: 'error', text: res.message });
    }
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const res = leaveService.submitLeave({
      teacherId: session.teacherId || teacherProfile?.id || 'TCH-SELF',
      teacherName: displayName,
      designation: displayDesignation,
      leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      totalDays: computedLeaveDays,
      reason: leaveReason.trim(),
    });
    if (res.success) {
      setLeaveReason('');
      setLeaveFeedback({ type: 'success', text: res.message });
      refreshToolsData();
      setTimeout(() => setLeaveFeedback(null), 3500);
    } else {
      setLeaveFeedback({ type: 'error', text: res.message });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassFeedback(null);
    if (newPass.trim().length < 6) {
      setPassFeedback({ type: 'error', text: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' });
      return;
    }
    if (newPass.trim() !== confirmPass.trim()) {
      setPassFeedback({ type: 'error', text: 'পাসওয়ার্ড দুটি মেলেনি!' });
      return;
    }
    setPassBusy(true);
    try {
      if (isAdmin) {
        await teacherAuthService.setAdminPassword(newPass.trim());
        setPassFeedback({ type: 'success', text: 'অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!' });
      } else if (session.teacherId || teacherProfile?.id) {
        const res = await teacherAuthService.setTeacherPassword(
          session.teacherId || teacherProfile!.id,
          newPass.trim()
        );
        setPassFeedback({ type: res.success ? 'success' : 'error', text: res.message });
      }
      setNewPass('');
      setConfirmPass('');
    } finally {
      setPassBusy(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* 4-Pill Sub-Navigation */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        {(
          [
            { id: 'routine', label: 'রুটিন', icon: Calendar },
            { id: 'homework', label: 'হোমওয়ার্ক', icon: BookOpen },
            { id: 'leave', label: 'ছুটি', icon: Send },
            { id: 'notices', label: 'নোটিশ', icon: Bell },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`py-2 px-1.5 rounded-xl text-[10.5px] font-black flex flex-col items-center gap-0.5 transition cursor-pointer ${
                active
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: ROUTINE */}
      {subTab === 'routine' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-600" />
              সাপ্তাহিক ক্লাস রুটিন
            </h3>
            <span className="text-[10px] font-bold text-slate-400">{toBnDigit(myDayRoutines.length)}টি ক্লাস</span>
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
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {d.labelBn}
                  {isToday && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full inline-block ml-1 align-middle ${
                        isSelected ? 'bg-amber-300' : 'bg-emerald-500'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {myDayRoutines.length === 0 ? (
            <div className="py-6 text-center rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-500">এই দিনে আপনার কোনো নির্ধারিত ক্লাস নেই</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myDayRoutines.map((slot) => {
                const periodMeta = ROUTINE_PERIODS.find((p) => p.periodNo === slot.periodNo);
                const activeSub = todaySubstitutions.find(
                  (s) => s.classId === slot.classId && s.periodNo === slot.periodNo
                );
                return (
                  <div
                    key={slot.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">{slot.subject}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9.5px] font-black">
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
                      {periodMeta ? `${periodMeta.startTime}-${periodMeta.endTime}` : `পি-${toBnDigit(slot.periodNo)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: IN-APP HOMEWORK PUBLISHER */}
      {subTab === 'homework' && (
        <div className="space-y-3">
          <form
            onSubmit={handlePublishHomework}
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3"
          >
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-600" />
              নতুন হোমওয়ার্ক ও পাঠ প্রকাশ করুন
            </h3>

            {!isAdmin && myAssignedSubjects.length > 0 ? (
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">বরাদ্দকৃত শ্রেণি ও বিষয়</label>
                <select
                  value={`${hwGrade}|||${hwSubject}`}
                  onChange={(e) => {
                    const [g, s] = e.target.value.split('|||');
                    if (g) setHwGrade(g);
                    if (s) setHwSubject(s);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-black text-indigo-950 dark:text-indigo-200"
                >
                  {myAssignedSubjects.map((sa) => (
                    <option key={sa.id} value={`${sa.classId}|||${sa.subjectId}`}>
                      {gradeLabel(sa.classId)} — {sa.subjectId}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">শ্রেণি</label>
                  <select
                    value={hwGrade}
                    onChange={(e) => setHwGrade(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  >
                    <option value="6th">৬ষ্ঠ শ্রেণি</option>
                    <option value="7th">৭ম শ্রেণি</option>
                    <option value="8th">৮ম শ্রেণি</option>
                    <option value="9th">৯ম শ্রেণি</option>
                    <option value="10th">১০ম শ্রেণি</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">বিষয়</label>
                  <input
                    type="text"
                    required
                    value={hwSubject}
                    onChange={(e) => setHwSubject(e.target.value)}
                    placeholder="বিষয়ের নাম"
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">শাখা</label>
                <select
                  value={hwSection}
                  onChange={(e) => setHwSection(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                >
                  <option value="all">সকল শাখা</option>
                  <option value="A">ক শাখা (A)</option>
                  <option value="B">খ শাখা (B)</option>
                  <option value="C">গ শাখা (C)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">জমার শেষ তারিখ</label>
                <input
                  type="date"
                  required
                  value={hwDueDate}
                  onChange={(e) => setHwDueDate(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                />
              </div>
            </div>

            <input
              type="text"
              required
              value={hwTitle}
              onChange={(e) => setHwTitle(e.target.value)}
              placeholder="হোমওয়ার্কের শিরোনাম (যেমন: অনুশীলনী ৩.১ সমাধান)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold outline-none focus:border-indigo-500"
            />
            <textarea
              rows={2}
              value={hwDesc}
              onChange={(e) => setHwDesc(e.target.value)}
              placeholder="বিস্তারিত নির্দেশনা (ঐচ্ছিক)..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs outline-none focus:border-indigo-500"
            />

            {hwFeedback && (
              <div
                className={`p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 ${
                  hwFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                }`}
              >
                {hwFeedback.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{hwFeedback.text}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer shadow-xs"
            >
              হোমওয়ার্ক প্রকাশ করুন
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
            <h4 className="text-xs font-black text-slate-900 dark:text-white">
              প্রকাশিত হোমওয়ার্ক ({toBnDigit(myHomeworks.length)}টি)
            </h4>
            {myHomeworks.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-3">এখনো কোনো হোমওয়ার্ক প্রকাশ করা হয়নি।</p>
            ) : (
              myHomeworks.slice(0, 6).map((hw) => (
                <div
                  key={hw.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                      {gradeLabel(hw.grade)} • {hw.subject}
                    </span>
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">{hw.title}</p>
                    <span className="text-[10px] text-slate-500">জমার তারিখ: {hw.dueDate}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      homeworkService.toggleArchive(hw.id);
                      refreshToolsData();
                      onDataChanged?.();
                    }}
                    title="আর্কাইভ করুন"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: IN-APP LEAVE APPLICATION */}
      {subTab === 'leave' && (
        <div className="space-y-3">
          <form
            onSubmit={handleSubmitLeave}
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3"
          >
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Send className="w-4 h-4 text-amber-600" />
              ছুটির আবেদন জমা দিন
            </h3>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">ছুটির ধরন</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
              >
                {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map((k) => (
                  <option key={k} value={k}>
                    {LEAVE_TYPE_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">শুরুর তারিখ</label>
                <input
                  type="date"
                  required
                  value={leaveStart}
                  onChange={(e) => {
                    setLeaveStart(e.target.value);
                    if (e.target.value > leaveEnd) setLeaveEnd(e.target.value);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  শেষ তারিখ ({toBnDigit(computedLeaveDays)} দিন)
                </label>
                <input
                  type="date"
                  required
                  min={leaveStart}
                  value={leaveEnd}
                  onChange={(e) => setLeaveEnd(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                />
              </div>
            </div>

            <textarea
              rows={2}
              required
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="ছুটির সুনির্দিষ্ট কারণ লিখুন (কমপক্ষে ৫ অক্ষর)..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs outline-none focus:border-amber-500"
            />

            {leaveFeedback && (
              <div
                className={`p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 ${
                  leaveFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                }`}
              >
                {leaveFeedback.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{leaveFeedback.text}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black cursor-pointer shadow-xs"
            >
              আবেদন জমা দিন ({toBnDigit(computedLeaveDays)} দিন)
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
            <h4 className="text-xs font-black text-slate-900 dark:text-white">
              আমার ছুটির আবেদনসমূহ ({toBnDigit(myLeaves.length)}টি)
            </h4>
            {myLeaves.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-3">কোনো ছুটির আবেদন পাওয়া যায়নি।</p>
            ) : (
              myLeaves.slice(0, 6).map((lv) => (
                <div
                  key={lv.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {LEAVE_TYPE_LABELS[lv.leaveType] || lv.leaveType}
                    </p>
                    <p className="text-[10.5px] text-slate-500">
                      {lv.startDate} → {lv.endDate} ({toBnDigit(lv.totalDays)} দিন)
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0 ${
                      lv.status === 'approved'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : lv.status === 'rejected'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {lv.status === 'approved' ? 'অনুমোদিত' : lv.status === 'rejected' ? 'প্রত্যাখ্যাত' : 'অপেক্ষমাণ'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: NOTICES & PASSWORD CHANGE */}
      {subTab === 'notices' && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-600" />
              প্রতিষ্ঠানের নোটিশ বোর্ড ({toBnDigit(sortedNotices.length)}টি)
            </h3>
            {sortedNotices.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-3">কোনো নতুন নোটিশ নেই।</p>
            ) : (
              sortedNotices.slice(0, 6).map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border space-y-1 ${
                    n.priority === 'urgent'
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1 flex-wrap min-w-0">
                      {n.isPinned && <Pin className="w-3 h-3 text-indigo-600 shrink-0" />}
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">{n.title}</h4>
                    </div>
                    <span className="text-[9.5px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                      {new Date(n.publishedAt).toLocaleDateString('bn-BD')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{n.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Password Security Card */}
          <form
            onSubmit={handleChangePassword}
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5"
          >
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              পাসওয়ার্ড পরিবর্তন করুন
            </h3>
            <input
              type="password"
              required
              minLength={6}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
            />
            <input
              type="password"
              required
              minLength={6}
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="পুনরায় নতুন পাসওয়ার্ড লিখুন"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
            />
            {passFeedback && (
              <p
                className={`text-[11px] font-bold ${
                  passFeedback.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                }`}
              >
                {passFeedback.text}
              </p>
            )}
            <button
              type="submit"
              disabled={passBusy}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 text-white text-xs font-black cursor-pointer disabled:opacity-60"
            >
              {passBusy ? 'আপডেট হচ্ছে...' : 'পাসওয়ার্ড আপডেট করুন'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
