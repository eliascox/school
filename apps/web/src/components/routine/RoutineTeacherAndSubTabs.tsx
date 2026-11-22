'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Printer,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import {
  RoutineDayConfig,
  RoutinePeriod,
  RoutineSlot,
  routineService,
  SubstitutionRecord,
} from '@/services/routineService';
import type { TeacherRecord } from '@/services/teacherRBACService';
import { showToast } from '@/components/ui/ToastProvider';
import { ClassOption, formatClassIdBn, toBanglaDigits } from './routineHelpers';

// ─── TEACHER-WISE WEEKLY SCHEDULE TAB ────────────────────────────────────────
interface RoutineTeacherViewTabProps {
  teachers: TeacherRecord[];
  selectedTeacherId: string;
  setSelectedTeacherId: (id: string) => void;
  days: RoutineDayConfig[];
  periods: RoutinePeriod[];
  routines: RoutineSlot[];
  classOptions: ClassOption[];
  onPrintCurrentTeacher: () => void;
  onPrintAllTeachers: () => void;
}

export function RoutineTeacherViewTab({
  teachers,
  selectedTeacherId,
  setSelectedTeacherId,
  days,
  periods,
  routines,
  classOptions,
  onPrintCurrentTeacher,
  onPrintAllTeachers,
}: RoutineTeacherViewTabProps) {
  const [teacherSearch, setTeacherSearch] = useState('');

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) =>
      `${t.name} ${t.designation} ${t.phone} ${t.id}`.toLowerCase().includes(q)
    );
  }, [teachers, teacherSearch]);

  const selectedTeacherObj = useMemo(
    () => teachers.find((t) => t.id === selectedTeacherId) || teachers[0] || null,
    [teachers, selectedTeacherId]
  );

  const teacherSlots = useMemo(() => {
    if (!selectedTeacherObj) return [];
    const byId = routines.filter(
      (r) =>
        (r.teacherId && r.teacherId.trim().toLowerCase() === selectedTeacherObj.id.trim().toLowerCase()) ||
        r.teacherName.trim().toLowerCase() === selectedTeacherObj.name.trim().toLowerCase()
    );
    return byId;
  }, [selectedTeacherObj, routines]);

  const slotMap = useMemo(() => {
    const m = new Map<string, RoutineSlot[]>();
    for (const s of teacherSlots) {
      const key = `${s.day}|${s.periodNo}`;
      const list = m.get(key) || [];
      list.push(s);
      m.set(key, list);
    }
    return m;
  }, [teacherSlots]);

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          <div className="relative w-full sm:w-52">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              placeholder="শিক্ষক খুঁজুন..."
              className="w-full h-9 pl-8 pr-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
            />
          </div>

          <select
            value={selectedTeacherObj?.id || ''}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            aria-label="শিক্ষক নির্বাচন"
            className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B] min-w-[220px]"
          >
            {filteredTeachers.length === 0 ? (
              <option value="">কোনো শিক্ষক পাওয়া যায়নি</option>
            ) : (
              filteredTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.designation})
                </option>
              ))
            )}
          </select>

          {selectedTeacherObj && (
            <span className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-bold">
              সাপ্তাহিক মোট ক্লাস: {toBanglaDigits(teacherSlots.length)} পিরিয়ড
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={!selectedTeacherObj}
            onClick={onPrintCurrentTeacher}
            className="h-9 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
          >
            <Printer size={13} /> এই শিক্ষকের প্রিন্ট
          </button>
          <button
            type="button"
            disabled={teachers.length === 0}
            onClick={onPrintAllTeachers}
            className="h-9 px-3.5 rounded-xl bg-[#0B5D3B] hover:bg-emerald-800 disabled:opacity-40 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
          >
            <Users size={13} /> সকল শিক্ষকের প্রিন্ট
          </button>
        </div>
      </div>

      {!selectedTeacherObj ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-12 text-center text-xs font-bold text-slate-400">
          কোনো সক্রিয় শিক্ষক পাওয়া যায়নি।
        </div>
      ) : (
        <>
          {/* Desktop Weekly Matrix */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {selectedTeacherObj.name} — সাপ্তাহিক ব্যক্তিগত রুটিন
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {selectedTeacherObj.designation} • {selectedTeacherObj.phone}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs min-w-[860px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/70 text-slate-700 dark:text-slate-200">
                    <th className="p-2.5 border-b border-r border-slate-200 dark:border-slate-800 font-extrabold text-left w-28">
                      বার / সময়
                    </th>
                    {periods.map((p) => (
                      <th
                        key={p.periodNo}
                        className={`p-2 border-b border-r last:border-r-0 border-slate-200 dark:border-slate-800 text-center ${
                          p.isBreak
                            ? 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 w-24'
                            : ''
                        }`}
                      >
                        <div className="font-extrabold text-[11px]">{p.periodName}</div>
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {p.startTime} – {p.endTime}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {days.map((day) => (
                    <tr key={day.key}>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-extrabold text-slate-900 dark:text-white bg-slate-50/60 dark:bg-slate-950/40">
                        {day.labelBn}
                      </td>
                      {periods.map((p) => {
                        if (p.isBreak) {
                          return (
                            <td
                              key={p.periodNo}
                              className="p-2 border-r last:border-r-0 border-slate-200 dark:border-slate-800 bg-amber-50/40 dark:bg-amber-950/20 text-center text-[10px] font-bold text-amber-700 dark:text-amber-400"
                            >
                              {p.periodName}
                            </td>
                          );
                        }
                        const cellSlots = slotMap.get(`${day.key}|${p.periodNo}`) || [];
                        return (
                          <td
                            key={p.periodNo}
                            className={`p-2 border-r last:border-r-0 border-slate-200 dark:border-slate-800 align-top ${
                              cellSlots.length > 1
                                ? 'bg-rose-50/80 dark:bg-rose-950/40'
                                : cellSlots.length === 1
                                ? 'bg-emerald-50/35 dark:bg-emerald-950/20'
                                : ''
                            }`}
                          >
                            {cellSlots.length === 0 ? (
                              <span className="block text-center text-[10px] text-slate-300 dark:text-slate-700 py-2">
                                ফ্রি
                              </span>
                            ) : (
                              <div className="space-y-1.5">
                                {cellSlots.map((s) => (
                                  <div key={s.id} className="space-y-0.5">
                                    <p className="font-extrabold text-slate-900 dark:text-white leading-tight text-[11.5px]">
                                      {s.subject}
                                    </p>
                                    <p className="text-[10.5px] font-bold text-[#0B5D3B] dark:text-emerald-300">
                                      {formatClassIdBn(s.classId, classOptions)}
                                    </p>
                                    <span className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 block">
                                      রুম: {s.roomNo}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Day-wise Cards */}
          <div className="md:hidden grid grid-cols-1 gap-3">
            {days.map((day) => {
              const slots = teacherSlots
                .filter((s) => s.day === day.key)
                .sort((a, b) => a.periodNo - b.periodNo);
              return (
                <div
                  key={day.key}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {day.labelBn}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {toBanglaDigits(slots.length)}টি ক্লাস
                    </span>
                  </div>
                  {slots.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">কোনো ক্লাস নেই</p>
                  ) : (
                    <div className="space-y-2">
                      {slots.map((s) => {
                        const pMeta = periods.find((p) => p.periodNo === s.periodNo);
                        return (
                          <div
                            key={s.id}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2"
                          >
                            <div>
                              <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                                {s.subject}
                              </p>
                              <p className="text-[11px] text-slate-500 font-semibold">
                                {formatClassIdBn(s.classId, classOptions)} • রুম {s.roomNo}
                              </p>
                            </div>
                            <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 text-[10px] font-bold shrink-0">
                              {pMeta?.periodName || `পিরিয়ড ${toBanglaDigits(s.periodNo)}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── SUBSTITUTION / PROXY MANAGER TAB ────────────────────────────────────────
interface RoutineSubstitutionTabProps {
  subDate: string;
  setSubDate: (date: string) => void;
  days: RoutineDayConfig[];
  periods: RoutinePeriod[];
  routines: RoutineSlot[];
  substitutions: SubstitutionRecord[];
  classOptions: ClassOption[];
  onDataUpdated: () => void;
  onPrintSubstitution: () => void;
}

export function RoutineSubstitutionTab({
  subDate,
  setSubDate,
  days,
  periods,
  routines,
  substitutions,
  classOptions,
  onDataUpdated,
  onPrintSubstitution,
}: RoutineSubstitutionTabProps) {
  const [proxyPickerSlot, setProxyPickerSlot] = useState<{
    slot: RoutineSlot;
    absentReason?: string;
  } | null>(null);

  const subDay = useMemo(() => routineService.getDayFromDate(subDate), [subDate]);
  const leavesOnSubDate = useMemo(
    () => routineService.getTeachersOnLeaveForDate(subDate),
    [subDate]
  );
  const daySubstitutions = useMemo(
    () => substitutions.filter((s) => s.date === subDate),
    [substitutions, subDate]
  );

  const affectedLeaveSlots = useMemo(() => {
    if (!subDay) return [];
    const norm = (v?: string) => (v || '').trim().toLowerCase();
    const dayRoutines = routines.filter((r) => r.day === subDay);
    return dayRoutines.filter((slot) =>
      leavesOnSubDate.some(
        (l) =>
          (slot.teacherId && norm(l.teacherId) === norm(slot.teacherId)) ||
          norm(l.teacherName) === norm(slot.teacherName)
      )
    );
  }, [routines, subDay, leavesOnSubDate]);

  const proxyCandidates = useMemo(() => {
    if (!proxyPickerSlot) return [];
    return routineService.suggestSubstituteTeachers(
      subDate,
      proxyPickerSlot.slot.periodNo,
      proxyPickerSlot.slot.teacherId || proxyPickerSlot.slot.teacherName
    );
  }, [proxyPickerSlot, subDate]);

  const handleAutoAssignProxies = () => {
    const res = routineService.autoAssignSubstitutesForDate(subDate);
    showToast(res.message, res.assignedCount > 0 ? 'success' : 'info');
    onDataUpdated();
  };

  const handleAssignManualProxy = (candidate: { teacherId: string; teacherName: string }) => {
    if (!proxyPickerSlot || !subDay) return;
    const { slot, absentReason } = proxyPickerSlot;
    const res = routineService.assignSubstitute({
      date: subDate,
      day: subDay,
      periodNo: slot.periodNo,
      classId: slot.classId,
      subject: slot.subject,
      absentTeacherId: slot.teacherId,
      absentTeacherName: slot.teacherName,
      substituteTeacherId: candidate.teacherId,
      substituteTeacherName: candidate.teacherName,
      roomNo: slot.roomNo,
      reason: absentReason || 'ব্যক্তিগত / প্রশাসনিক প্রক্সি',
    });
    showToast(res.message, res.success ? 'success' : 'error');
    setProxyPickerSlot(null);
    onDataUpdated();
  };

  const subDayLabel = subDay
    ? days.find((d) => d.key === subDay)?.labelBn || subDay
    : 'সাপ্তাহিক ছুটি';

  return (
    <div className="space-y-4">
      {/* Control Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">তারিখ:</label>
            <input
              type="date"
              value={subDate}
              onChange={(e) => setSubDate(e.target.value)}
              className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-slate-900 dark:text-slate-100 outline-none focus:border-[#0B5D3B]"
            />
          </div>
          <span className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
            বার: {subDayLabel}
          </span>
          <span className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-xs font-bold text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
            ছুটিতে শিক্ষক: {toBanglaDigits(leavesOnSubDate.length)} জন
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onPrintSubstitution}
            className="h-9 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
          >
            <Printer size={13} /> প্রক্সি তালিকা প্রিন্ট
          </button>
          <button
            type="button"
            onClick={handleAutoAssignProxies}
            disabled={!subDay || leavesOnSubDate.length === 0}
            className="h-9 px-3.5 rounded-xl bg-[#0B5D3B] hover:bg-emerald-800 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
          >
            <Wand2 size={14} /> স্বয়ংক্রিয় প্রক্সি বণ্টন
          </button>
        </div>
      </div>

      {/* Two-Column Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Affected Classes due to Approved Leave */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-600 dark:text-amber-400" />
            অনুপস্থিত শিক্ষকের নির্ধারিত পিরিয়ড ({toBanglaDigits(affectedLeaveSlots.length)})
          </h3>

          {affectedLeaveSlots.length === 0 ? (
            <div className="p-8 text-center text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/70 dark:border-slate-800">
              নির্বাচিত তারিখে অনুমোদিত ছুটিতে থাকা শিক্ষকের কোনো ক্লাস বাকি নেই।
            </div>
          ) : (
            <div className="space-y-2.5">
              {affectedLeaveSlots.map((slot) => {
                const existingSub = daySubstitutions.find(
                  (s) => s.classId === slot.classId && s.periodNo === slot.periodNo
                );
                const pMeta = periods.find((p) => p.periodNo === slot.periodNo);
                return (
                  <div
                    key={slot.id}
                    className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {formatClassIdBn(slot.classId, classOptions)} • {slot.subject} (
                        {pMeta?.periodName || `পিরিয়ড ${toBanglaDigits(slot.periodNo)}`})
                      </p>
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                        অনুপস্থিত: {slot.teacherName} • রুম: {slot.roomNo}
                      </p>
                      {existingSub && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-[10px] font-bold">
                          <CheckCircle2 size={11} /> প্রক্সি: {existingSub.substituteTeacherName}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setProxyPickerSlot({ slot, absentReason: 'অনুমোদিত ছুটি' })}
                      className="px-3 py-1.5 rounded-lg bg-[#0B5D3B] hover:bg-emerald-800 text-white text-[11px] font-bold shrink-0 cursor-pointer transition"
                    >
                      {existingSub ? 'পরিবর্তন' : 'প্রক্সি দিন'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Proxy Roster Table */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck size={16} className="text-[#0B5D3B] dark:text-emerald-400" />
            নির্ধারিত প্রক্সি / বিকল্প তালিকা ({toBanglaDigits(daySubstitutions.length)})
          </h3>

          {daySubstitutions.length === 0 ? (
            <div className="p-8 text-center text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/70 dark:border-slate-800">
              এখনো কোনো প্রক্সি শিক্ষক নির্ধারিত হয়নি।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/70 text-slate-700 dark:text-slate-200">
                    <th className="p-2 border border-slate-200 dark:border-slate-800 text-left">
                      শ্রেণি ও পিরিয়ড
                    </th>
                    <th className="p-2 border border-slate-200 dark:border-slate-800 text-left">
                      মূল শিক্ষক
                    </th>
                    <th className="p-2 border border-slate-200 dark:border-slate-800 text-left">
                      বিকল্প শিক্ষক
                    </th>
                    <th className="p-2 border border-slate-200 dark:border-slate-800 text-center">
                      মুছুন
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {daySubstitutions.map((s) => {
                    const pMeta = periods.find((p) => p.periodNo === s.periodNo);
                    return (
                      <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="p-2 border border-slate-200 dark:border-slate-800">
                          <p className="font-extrabold text-slate-900 dark:text-white">
                            {formatClassIdBn(s.classId, classOptions)} •{' '}
                            {pMeta?.periodName || `P${s.periodNo}`}
                          </p>
                          <p className="text-[10.5px] text-slate-500">
                            {s.subject} (রুম {s.roomNo || '—'})
                          </p>
                        </td>
                        <td className="p-2 border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 font-bold">
                          {s.absentTeacherName}
                        </td>
                        <td className="p-2 border border-slate-200 dark:border-slate-800 font-extrabold text-[#0B5D3B] dark:text-emerald-300">
                          {s.substituteTeacherName}
                        </td>
                        <td className="p-2 border border-slate-200 dark:border-slate-800 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              routineService.removeSubstitute(s.id);
                              onDataUpdated();
                              showToast('প্রক্সি দায়িত্ব বাতিল করা হয়েছে।', 'info');
                            }}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="বাতিল করুন"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Manual Proxy Picker Modal */}
      {proxyPickerSlot && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setProxyPickerSlot(null);
          }}
        >
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  বিকল্প (প্রক্সি) শিক্ষক বাছাই
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatClassIdBn(proxyPickerSlot.slot.classId, classOptions)} •{' '}
                  {proxyPickerSlot.slot.subject} (পিরিয়ড{' '}
                  {toBanglaDigits(proxyPickerSlot.slot.periodNo)})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProxyPickerSlot(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {proxyCandidates.map((c) => (
                <div
                  key={c.teacherId}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {c.teacherName}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10.5px]">
                      <span className="text-slate-500">{c.designation}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        আজকের ক্লাস: {toBanglaDigits(c.periodsAssignedOnDay)}
                      </span>
                      {c.isFreeAtPeriod ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 font-bold">
                          ফাঁকা আছেন
                        </span>
                      ) : c.isOnLeave ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold">
                          ছুটিতে
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                          অন্য ক্লাসে ব্যস্ত
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAssignManualProxy(c)}
                    disabled={c.isOnLeave}
                    className="px-3 py-1.5 rounded-lg bg-[#0B5D3B] hover:bg-emerald-800 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                  >
                    নির্বাচন করুন
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
