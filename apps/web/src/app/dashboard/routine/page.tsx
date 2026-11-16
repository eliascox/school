'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CalendarClock, Users, ArrowLeftRight, Plus, Trash2, Printer,
  AlertTriangle, CheckCircle2, Sparkles, UserCheck, BookOpen,
  Clock, RefreshCw, X, Wand2, ShieldAlert
} from 'lucide-react';
import {
  routineService,
  RoutineSlot,
  ROUTINE_DAYS,
  ROUTINE_PERIODS,
  SubstitutionRecord,
} from '@/services/routineService';
import { classSectionService, ClassItem } from '@/services/classSectionService';
import { teacherRBACService, TeacherRecord } from '@/services/teacherRBACService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import { localDateKey } from '@/lib/dateUtils';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';

interface ClassOption {
  classId: string;
  grade: string;
  branch: string;
  label: string;
}

const GRADE_NUM_MAP: Record<number, string> = {
  6: '6th',
  7: '7th',
  8: '8th',
  9: '9th',
  10: '10th',
};

const normalizeBranch = (secName: string) => {
  const s = secName.trim();
  if (/section\s*a|ক\s*শাখা/i.test(s) || s === 'A') return 'A';
  if (/section\s*b|খ\s*শাখা/i.test(s) || s === 'B') return 'B';
  if (/section\s*c|গ\s*শাখা/i.test(s) || s === 'C') return 'C';
  if (/science|বিজ্ঞান/i.test(s)) return 'Science';
  if (/humanities|মানবিক/i.test(s)) return 'Humanities';
  if (/commerce|ব্যবসায়|ব্যবসায়/i.test(s)) return 'Commerce';
  return s;
};

const branchToGroup = (branch: string) => {
  if (/science|বিজ্ঞান/i.test(branch)) return 'বিজ্ঞান';
  if (/commerce|ব্যবসায়|ব্যবসায়/i.test(branch)) return 'ব্যবসায় শিক্ষা';
  if (/humanities|মানবিক/i.test(branch)) return 'মানবিক';
  return 'সাধারণ';
};

export default function ClassRoutineManagerPage() {
  const [activeTab, setActiveTab] = useState<'grid' | 'substitution' | 'teacher_view'>('grid');
  const [routines, setRoutines] = useState<RoutineSlot[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [substitutions, setSubstitutions] = useState<SubstitutionRecord[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  const [selectedClassId, setSelectedClassId] = useState<string>('6th-A');
  const [swapMode, setSwapMode] = useState<boolean>(false);
  const [swapSourceSlot, setSwapSourceSlot] = useState<RoutineSlot | null>(null);

  // Add/Edit Modal
  const [editingSlot, setEditingSlot] = useState<{
    day: RoutineSlot['day'];
    dayBn: string;
    periodNo: number;
    existing?: RoutineSlot;
  } | null>(null);
  const [formSubject, setFormSubject] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formRoomNo, setFormRoomNo] = useState('');

  // Substitution Tab
  const [subDate, setSubDate] = useState<string>(() => localDateKey());
  const [proxyPickerSlot, setProxyPickerSlot] = useState<{
    slot: RoutineSlot;
    absentReason?: string;
  } | null>(null);

  // Teacher-wise View
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

  const loadData = useCallback(() => {
    const r = routineService.getRoutines();
    const cls = classSectionService.getClasses();
    const tchs = teacherRBACService.getTeachers().filter((t) => t.status === 'active');
    const subs = routineService.getSubstitutions();
    setRoutines(r);
    setClasses(cls);
    setTeachers(tchs);
    setSubstitutions(subs);
    setSettings(settingsService.getSettings());
    if (!selectedTeacherId && tchs.length > 0) {
      setSelectedTeacherId(tchs[0].id);
    }
  }, [selectedTeacherId]);

  useEffect(() => {
    loadData();
    const onStorage = () => loadData();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [loadData]);

  const classOptions: ClassOption[] = useMemo(() => {
    const map = new Map<string, ClassOption>();
    classes.forEach((c) => {
      const grade = GRADE_NUM_MAP[c.gradeNumber] || `${c.gradeNumber}th`;
      if (c.sections && c.sections.length > 0) {
        c.sections.forEach((sec) => {
          const branch = normalizeBranch(sec.name);
          const classId = `${grade}-${branch}`;
          if (!map.has(classId)) {
            map.set(classId, {
              classId,
              grade,
              branch,
              label: `${c.nameBn || c.name} — ${sec.name}`,
            });
          }
        });
      } else {
        const classId = `${grade}-A`;
        map.set(classId, { classId, grade, branch: 'A', label: `${c.nameBn || c.name} (ক শাখা)` });
      }
    });
    routines.forEach((slot) => {
      if (!map.has(slot.classId)) {
        map.set(slot.classId, {
          classId: slot.classId,
          grade: slot.grade,
          branch: slot.branch,
          label: `${slot.grade} (${slot.branch})`,
        });
      }
    });
    return Array.from(map.values());
  }, [classes, routines]);

  const activeClassOpt = useMemo(
    () => classOptions.find((o) => o.classId === selectedClassId) || classOptions[0],
    [classOptions, selectedClassId]
  );

  const curriculumSubjects = useMemo(() => {
    if (!activeClassOpt) return [];
    return getActiveCurriculumSubjects(activeClassOpt.grade, branchToGroup(activeClassOpt.branch));
  }, [activeClassOpt]);

  const classGridMap = useMemo(() => {
    const m = new Map<string, RoutineSlot>();
    routines
      .filter((r) => r.classId === (activeClassOpt?.classId || selectedClassId))
      .forEach((r) => m.set(`${r.day}|${r.periodNo}`, r));
    return m;
  }, [routines, activeClassOpt, selectedClassId]);

  const liveConflict = useMemo(() => {
    if (!editingSlot || !activeClassOpt || !formTeacherId || !formSubject.trim()) return null;
    const tObj = teachers.find((t) => t.id === formTeacherId);
    if (!tObj) return null;
    const candidate: RoutineSlot = {
      id: editingSlot.existing?.id || `ROT-${activeClassOpt.classId}-${editingSlot.day}-P${editingSlot.periodNo}`,
      classId: activeClassOpt.classId,
      grade: activeClassOpt.grade,
      branch: activeClassOpt.branch,
      day: editingSlot.day,
      dayBn: editingSlot.dayBn,
      periodNo: editingSlot.periodNo,
      subject: formSubject.trim(),
      teacherId: tObj.id,
      teacherName: tObj.name,
      roomNo: formRoomNo.trim() || '101',
    };
    return routineService.detectConflict(candidate, routines);
  }, [editingSlot, activeClassOpt, formTeacherId, formSubject, formRoomNo, teachers, routines]);

  const openCellEditor = (day: RoutineSlot['day'], dayBn: string, periodNo: number, existing?: RoutineSlot) => {
    if (swapMode) {
      if (!swapSourceSlot) {
        if (!existing) {
          showToast('সোয়াপ শুরু করার জন্য প্রথমে একটি নির্ধারিত ক্লাস স্লট ক্লিক করুন।', 'info');
          return;
        }
        setSwapSourceSlot(existing);
        showToast('প্রথম স্লট নির্বাচিত! এবার দ্বিতীয় স্লটে ক্লিক করুন।', 'info');
        return;
      }
      if (!existing) {
        showToast('সোয়াপ করতে দুটি পূর্ণ স্লট নির্বাচন করুন অথবা খালি স্লটে সরাসরি নতুন রুটিন দিন।', 'warning');
        setSwapSourceSlot(null);
        return;
      }
      const res = routineService.swapRoutineSlots(swapSourceSlot.id, existing.id);
      if (res.success) {
        showToast(res.message, 'success');
        setSwapSourceSlot(null);
        setSwapMode(false);
        loadData();
      } else {
        showToast(res.message, 'error');
        setSwapSourceSlot(null);
      }
      return;
    }

    setEditingSlot({ day, dayBn, periodNo, existing });
    setFormSubject(existing?.subject || (curriculumSubjects[0]?.name ?? ''));
    setFormTeacherId(existing?.teacherId || (teachers[0]?.id ?? ''));
    setFormRoomNo(existing?.roomNo || '১০১');
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot || !activeClassOpt) return;
    if (!formSubject.trim()) {
      showToast('বিষয়ের নাম লিখুন বা নির্বাচন করুন।', 'error');
      return;
    }
    const tObj = teachers.find((t) => t.id === formTeacherId);
    if (!tObj) {
      showToast('একজন সক্রিয় শিক্ষক নির্বাচন করুন।', 'error');
      return;
    }
    const slot: RoutineSlot = {
      id: editingSlot.existing?.id || `ROT-${activeClassOpt.classId}-${editingSlot.day}-P${editingSlot.periodNo}`,
      classId: activeClassOpt.classId,
      grade: activeClassOpt.grade,
      branch: activeClassOpt.branch,
      day: editingSlot.day,
      dayBn: editingSlot.dayBn,
      periodNo: editingSlot.periodNo,
      subject: formSubject.trim(),
      teacherId: tObj.id,
      teacherName: tObj.name,
      roomNo: formRoomNo.trim() || '১০১',
    };
    const res = routineService.saveRoutine(slot);
    if (!res.success) {
      showToast(res.message, 'error');
      return;
    }
    showToast(res.message, 'success');
    setEditingSlot(null);
    loadData();
  };

  const handleDeleteSlot = async (slotId: string) => {
    const ok = await confirmDialog({
      title: 'রুটিন স্লট মুছে ফেলবেন?',
      message: 'এই পিরিয়ডের নির্ধারিত ক্লাস রুটিনটি মুছে ফেলা হবে।',
      confirmLabel: 'হ্যাঁ, মুছে ফেলুন',
      danger: true,
    });
    if (!ok) return;
    const res = routineService.deleteRoutineSlot(slotId);
    showToast(res.message, res.success ? 'success' : 'error');
    setEditingSlot(null);
    loadData();
  };

  // Substitution metrics for subDate
  const subDay = useMemo(() => routineService.getDayFromDate(subDate), [subDate]);
  const leavesOnSubDate = useMemo(() => routineService.getTeachersOnLeaveForDate(subDate), [subDate]);
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
    loadData();
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
    loadData();
  };

  const selectedTeacherObj = useMemo(
    () => teachers.find((t) => t.id === selectedTeacherId) || teachers[0],
    [teachers, selectedTeacherId]
  );

  const selectedTeacherSlots = useMemo(() => {
    if (!selectedTeacherObj) return [];
    return routineService.getTeacherRoutine(selectedTeacherObj.id).length > 0
      ? routineService.getTeacherRoutine(selectedTeacherObj.id)
      : routineService.getTeacherRoutine(selectedTeacherObj.name);
  }, [selectedTeacherObj, routines]);

  return (
    <div className="space-y-6 pb-12 print:pb-0">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            background: #ffffff !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-black mb-2">
            <CalendarClock className="w-3.5 h-3.5" /> মাস্টার ক্লাস রুটিন ও প্রক্সি ইঞ্জিন
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            ক্লাস রুটিন ও শিক্ষক প্রতিস্থাপন ব্যবস্থাপনা
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            কনফ্লিক্ট-মুক্ত সাপ্তাহিক রুটিন, পিরিয়ড সোয়াপ এবং ছুটির দিনে স্বয়ংক্রিয় বিকল্প শিক্ষক বণ্টন
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('grid')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              মাস্টার রুটিন গ্রিড
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('substitution')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'substitution'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              প্রক্সি ও প্রতিস্থাপন
              {affectedLeaveSlots.length > daySubstitutions.length && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px]">
                  {affectedLeaveSlots.length - daySubstitutions.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('teacher_view')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === 'teacher_view'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              শিক্ষকভিত্তিক রুটিন
            </button>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" /> ল্যান্ডস্কেপ প্রিন্ট
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center border-b-2 border-slate-800 pb-2 mb-3">
        <h2 className="text-lg font-black text-slate-900">{settings?.schoolName || 'স্মার্ট স্কুল'}</h2>
        <p className="text-xs text-slate-600">{settings?.address} • EIIN: {settings?.eiin}</p>
        <p className="text-sm font-black text-slate-900 mt-1">
          {activeTab === 'grid' && `সাপ্তাহিক ক্লাস রুটিন — ${activeClassOpt?.label || selectedClassId}`}
          {activeTab === 'substitution' && `দৈনিক প্রক্সি ও বিকল্প শিক্ষক তালিকা — তারিখ: ${subDate}`}
          {activeTab === 'teacher_view' && `ব্যক্তিগত ক্লাস রুটিন — ${selectedTeacherObj?.name || ''}`}
        </p>
      </div>

      {/* TAB 1: MASTER ROUTINE GRID */}
      {activeTab === 'grid' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 print:border-0 print:p-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-black text-slate-600 dark:text-slate-300">শ্রেণি ও শাখা:</label>
              <select
                value={activeClassOpt?.classId || selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSwapSourceSlot(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
              >
                {classOptions.map((opt) => (
                  <option key={opt.classId} value={opt.classId}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSwapMode((prev) => !prev);
                  setSwapSourceSlot(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 border transition cursor-pointer ${
                  swapMode
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-800 dark:text-amber-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                {swapMode
                  ? swapSourceSlot
                    ? 'দ্বিতীয় স্লটে ক্লিক করুন...'
                    : 'সোয়াপ চালু (প্রথম স্লট নিন)'
                  : 'পিরিয়ড সোয়াপ করুন'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs min-w-[900px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100">
                  <th className="p-2.5 border border-slate-200 dark:border-slate-700 font-black w-28 text-left">
                    বার / সময়
                  </th>
                  {ROUTINE_PERIODS.map((p) => (
                    <th
                      key={p.periodNo}
                      className={`p-2 border border-slate-200 dark:border-slate-700 text-center ${
                        p.isBreak
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 w-24'
                          : ''
                      }`}
                    >
                      <div className="font-black">{p.periodName}</div>
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {p.startTime} - {p.endTime}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROUTINE_DAYS.map((day) => (
                  <tr key={day.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-black text-slate-900 dark:text-slate-100 bg-slate-50/70 dark:bg-slate-900">
                      {day.labelBn}
                    </td>
                    {ROUTINE_PERIODS.map((p) => {
                      if (p.isBreak) {
                        return (
                          <td
                            key={p.periodNo}
                            className="p-2 border border-slate-200 dark:border-slate-700 bg-amber-50/60 dark:bg-amber-950/20 text-center text-[10px] font-black text-amber-700 dark:text-amber-400"
                          >
                            টিফিন
                          </td>
                        );
                      }
                      const slot = classGridMap.get(`${day.key}|${p.periodNo}`);
                      const isSwapSelected = swapSourceSlot?.id === slot?.id && !!slot;
                      return (
                        <td
                          key={p.periodNo}
                          onClick={() => openCellEditor(day.key, day.labelBn, p.periodNo, slot)}
                          className={`p-2 border border-slate-200 dark:border-slate-700 align-top cursor-pointer transition min-w-[110px] ${
                            isSwapSelected
                              ? 'bg-amber-100 dark:bg-amber-900/40 ring-2 ring-amber-500'
                              : slot
                              ? 'bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                              : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          {slot ? (
                            <div className="space-y-1">
                              <p className="font-black text-slate-900 dark:text-white leading-tight">
                                {slot.subject}
                              </p>
                              <p className="text-[10.5px] font-bold text-indigo-700 dark:text-indigo-300 truncate">
                                {slot.teacherName}
                              </p>
                              <span className="inline-block px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[9.5px] font-bold text-slate-600 dark:text-slate-300">
                                রুম: {slot.roomNo}
                              </span>
                            </div>
                          ) : (
                            <div className="h-12 flex items-center justify-center text-slate-300 dark:text-slate-600 print:hidden">
                              <Plus className="w-4 h-4" />
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
      )}

      {/* TAB 2: SUBSTITUTION / PROXY MANAGER */}
      {activeTab === 'substitution' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1">
                  তারিখ নির্বাচন করুন
                </label>
                <input
                  type="date"
                  value={subDate}
                  onChange={(e) => setSubDate(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
                বার: {subDay ? ROUTINE_DAYS.find((d) => d.key === subDay)?.labelBn : 'শুক্রবার (সাপ্তাহিক ছুটি)'}
              </div>
              <div className="px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-xs font-bold text-amber-800 dark:text-amber-300">
                ছুটিতে শিক্ষক: {leavesOnSubDate.length} জন
              </div>
            </div>

            <button
              type="button"
              onClick={handleAutoAssignProxies}
              disabled={!subDay || leavesOnSubDate.length === 0}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <Wand2 className="w-4 h-4" /> স্বয়ংক্রিয় প্রক্সি বণ্টন
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Affected Classes due to Approved Leave */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 print:hidden">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                অনুপস্থিত শিক্ষকের নির্ধারিত পিরিয়ড ({affectedLeaveSlots.length})
              </h3>
              {affectedLeaveSlots.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                  নির্বাচিত তারিখে অনুমোদিত ছুটিতে থাকা শিক্ষকের কোনো ক্লাস বাকি নেই।
                </div>
              ) : (
                <div className="space-y-2.5">
                  {affectedLeaveSlots.map((slot) => {
                    const existingSub = daySubstitutions.find(
                      (s) => s.classId === slot.classId && s.periodNo === slot.periodNo
                    );
                    const pMeta = ROUTINE_PERIODS.find((p) => p.periodNo === slot.periodNo);
                    return (
                      <div
                        key={slot.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">
                            {slot.classId} • {slot.subject} ({pMeta?.periodName || `পিরিয়ড ${slot.periodNo}`})
                          </p>
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                            অনুপস্থিত: {slot.teacherName} • রুম: {slot.roomNo}
                          </p>
                          {existingSub && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                              <CheckCircle2 className="w-3 h-3" /> প্রক্সি: {existingSub.substituteTeacherName}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setProxyPickerSlot({ slot, absentReason: 'অনুমোদিত ছুটি' })}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black shrink-0 cursor-pointer"
                        >
                          {existingSub ? 'পরিবর্তন' : 'প্রক্সি দিন'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active Proxy Roster Table (Printable) */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  নির্ধারিত প্রক্সি / বিকল্প তালিকা ({daySubstitutions.length})
                </h3>
              </div>

              {daySubstitutions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                  এখনো কোনো প্রক্সি শিক্ষক নির্ধারিত হয়নি। চাইলে বাম পাশের ক্লাস অথবা মাস্টার গ্রিড থেকে প্রক্সি নির্ধারণ করুন।
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                        <th className="p-2 border border-slate-200 dark:border-slate-700 text-left">পিরিয়ড/শ্রেণি</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-700 text-left">মূল শিক্ষক</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-700 text-left">বিকল্প শিক্ষক</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-700 text-center print:hidden">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daySubstitutions.map((s) => (
                        <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="p-2 border border-slate-200 dark:border-slate-700">
                            <p className="font-black text-slate-900 dark:text-white">{s.classId} • P{s.periodNo}</p>
                            <p className="text-[10.5px] text-slate-500">{s.subject} (রুম {s.roomNo || '—'})</p>
                          </td>
                          <td className="p-2 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 font-bold">
                            {s.absentTeacherName}
                          </td>
                          <td className="p-2 border border-slate-200 dark:border-slate-700 font-black text-emerald-700 dark:text-emerald-300">
                            {s.substituteTeacherName}
                          </td>
                          <td className="p-2 border border-slate-200 dark:border-slate-700 text-center print:hidden">
                            <button
                              type="button"
                              onClick={() => {
                                routineService.removeSubstitute(s.id);
                                loadData();
                                showToast('প্রক্সি দায়িত্ব বাতিল করা হয়েছে।', 'info');
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="বাতিল করুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEACHER-WISE SCHEDULE */}
      {activeTab === 'teacher_view' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2">
              <label className="text-xs font-black text-slate-600 dark:text-slate-300">শিক্ষক নির্বাচন:</label>
              <select
                value={selectedTeacherObj?.id || ''}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.designation})
                  </option>
                ))}
              </select>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-black">
              সাপ্তাহিক মোট ক্লাস লোড: {selectedTeacherSlots.length}টি পিরিয়ড
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ROUTINE_DAYS.map((day) => {
              const slots = selectedTeacherSlots
                .filter((s) => s.day === day.key)
                .sort((a, b) => a.periodNo - b.periodNo);
              return (
                <div
                  key={day.key}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <span className="text-xs font-black text-slate-900 dark:text-white">{day.labelBn}</span>
                    <span className="text-[10px] font-bold text-slate-500">{slots.length} ক্লাস</span>
                  </div>
                  {slots.length === 0 ? (
                    <p className="text-[11px] text-slate-400 py-3 text-center">কোনো ক্লাস নেই</p>
                  ) : (
                    slots.map((s) => {
                      const pMeta = ROUTINE_PERIODS.find((p) => p.periodNo === s.periodNo);
                      return (
                        <div
                          key={s.id}
                          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white">{s.subject}</p>
                            <p className="text-[10.5px] text-slate-500 font-bold">
                              {s.classId} • রুম {s.roomNo}
                            </p>
                          </div>
                          <span className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black">
                            {pMeta?.periodName || `P${s.periodNo}`}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT ROUTINE SLOT */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveSlot}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  পিরিয়ড নির্ধারণ / সম্পাদনা
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeClassOpt?.label} • {editingSlot.dayBn} •{' '}
                  {ROUTINE_PERIODS.find((p) => p.periodNo === editingSlot.periodNo)?.periodName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {liveConflict && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{liveConflict.message}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                বিষয় (Subject)
              </label>
              <input
                list="routine-curriculum-subjects"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                placeholder="যেমন: গণিত বা ইংরেজি ১ম পত্র"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
              <datalist id="routine-curriculum-subjects">
                {curriculumSubjects.map((sub) => (
                  <option key={sub.code} value={sub.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                নির্ধারিত শিক্ষক
              </label>
              <select
                value={formTeacherId}
                onChange={(e) => setFormTeacherId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.designation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                কক্ষ নম্বর (Room No)
              </label>
              <input
                value={formRoomNo}
                onChange={(e) => setFormRoomNo(e.target.value)}
                placeholder="যেমন: ২০১"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              {editingSlot.existing ? (
                <button
                  type="button"
                  onClick={() => handleDeleteSlot(editingSlot.existing!.id)}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-black flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> মুছুন
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={!!liveConflict}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-black cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: MANUAL PROXY PICKER */}
      {proxyPickerSlot && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">বিকল্প (প্রক্সি) শিক্ষক বাছাই</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {proxyPickerSlot.slot.classId} • {proxyPickerSlot.slot.subject} (পিরিয়ড{' '}
                  {proxyPickerSlot.slot.periodNo})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProxyPickerSlot(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {proxyCandidates.map((c) => (
                <div
                  key={c.teacherId}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">{c.teacherName}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10.5px]">
                      <span className="text-slate-500">{c.designation}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        আজকের ক্লাস: {c.periodsAssignedOnDay}
                      </span>
                      {c.isFreeAtPeriod ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black">
                          ফাঁকা আছেন
                        </span>
                      ) : c.isOnLeave ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-black">
                          ছুটিতে
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-black">
                          অন্য ক্লাসে ব্যস্ত
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAssignManualProxy(c)}
                    disabled={c.isOnLeave}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-black cursor-pointer"
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
