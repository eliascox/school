'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  CalendarClock,
  ChevronDown,
  Grid2x2,
  Plus,
  Printer,
  Settings2,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  routineService,
  RoutineDayConfig,
  RoutineDayKey,
  RoutinePeriod,
  RoutineSlot,
  SubstitutionRecord,
} from '@/services/routineService';
import { classSectionService, ClassItem } from '@/services/classSectionService';
import {
  SubjectAssignment,
  TeacherRecord,
  teacherRBACService,
} from '@/services/teacherRBACService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { localDateKey } from '@/lib/dateUtils';
import { triggerProfessionalPrint } from '@/lib/printPdfUtils';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';
import {
  buildClassOptions,
  ClassOption,
  RoutinePrintMode,
  RoutineTabId,
  toBanglaDigits,
} from '@/components/routine/routineHelpers';
import SlotEditorModal, { EditingSlotContext } from '@/components/routine/SlotEditorModal';
import MasterRoutineGridTab from '@/components/routine/MasterRoutineGridTab';
import RoutineSetupTab from '@/components/routine/RoutineSetupTab';
import {
  RoutineSubstitutionTab,
  RoutineTeacherViewTab,
} from '@/components/routine/RoutineTeacherAndSubTabs';
import RoutinePrintViews from '@/components/routine/RoutinePrintViews';

const TAB_ITEMS: Array<{ id: RoutineTabId; label: string; icon: React.ReactNode }> = [
  { id: 'class_grid', label: 'শ্রেণিভিত্তিক', icon: <CalendarClock size={14} /> },
  { id: 'master_grid', label: 'সকল ক্লাস (মাস্টার)', icon: <Grid2x2 size={14} /> },
  { id: 'teacher_view', label: 'শিক্ষকভিত্তিক', icon: <Users size={14} /> },
  { id: 'substitution', label: 'প্রক্সি ও বদলি', icon: <UserCheck size={14} /> },
  { id: 'setup', label: 'পিরিয়ড ও বার সেটআপ', icon: <Settings2 size={14} /> },
];

export default function ClassRoutineManagerPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<RoutineTabId>('class_grid');

  // Core data states
  const [routines, setRoutines] = useState<RoutineSlot[]>([]);
  const [periods, setPeriods] = useState<RoutinePeriod[]>([]);
  const [days, setDays] = useState<RoutineDayConfig[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignment[]>([]);
  const [substitutions, setSubstitutions] = useState<SubstitutionRecord[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  // Selection states
  const [selectedClassId, setSelectedClassId] = useState<string>('6th-A');
  const [selectedMasterDay, setSelectedMasterDay] = useState<RoutineDayKey>('Sunday');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [subDate, setSubDate] = useState<string>(() => localDateKey());

  // Swap & Editor Modal
  const [swapMode, setSwapMode] = useState<boolean>(false);
  const [swapSourceSlot, setSwapSourceSlot] = useState<RoutineSlot | null>(null);
  const [editingSlot, setEditingSlot] = useState<EditingSlotContext | null>(null);

  // Print Mode & Dropdown
  const [printMode, setPrintMode] = useState<RoutinePrintMode>('current_class');
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const printMenuRef = useRef<HTMLDivElement | null>(null);

  const loadData = useCallback(() => {
    const loadedRoutines = routineService.getRoutines();
    const loadedPeriods = routineService.getPeriods();
    const loadedDays = routineService.getDays();
    const cls = classSectionService.getClasses();
    const tchs = teacherRBACService.getTeachers().filter((t) => t.status === 'active');
    const subAssigns = teacherRBACService.getSubjectAssignments();
    const subs = routineService.getSubstitutions();

    setRoutines(loadedRoutines);
    setPeriods(loadedPeriods);
    setDays(loadedDays);
    setClasses(cls);
    setTeachers(tchs);
    setSubjectAssignments(subAssigns);
    setSubstitutions(subs);
    setSettings(settingsService.getSettings());

    setSelectedTeacherId((prev) => {
      if (prev && tchs.some((t) => t.id === prev)) return prev;
      return tchs[0]?.id || '';
    });

    setSelectedMasterDay((prev) => {
      if (loadedDays.some((d) => d.key === prev)) return prev;
      const todayKey = routineService.getDayFromDate(localDateKey());
      if (todayKey && loadedDays.some((d) => d.key === todayKey)) return todayKey;
      return loadedDays[0]?.key || 'Sunday';
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    loadData();
    const onStorage = () => loadData();
    const unsubClasses = classSectionService.subscribe(loadData);
    window.addEventListener('storage', onStorage);
    return () => {
      unsubClasses();
      window.removeEventListener('storage', onStorage);
    };
  }, [loadData]);

  // Close print menu on outside click or Escape
  useEffect(() => {
    if (!printMenuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setPrintMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPrintMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [printMenuOpen]);

  const classOptions: ClassOption[] = useMemo(
    () => buildClassOptions(classes, routines),
    [classes, routines]
  );

  const activeClassOpt = useMemo(
    () => classOptions.find((o) => o.classId === selectedClassId) || classOptions[0],
    [classOptions, selectedClassId]
  );

  const selectedTeacherObj = useMemo(
    () => teachers.find((t) => t.id === selectedTeacherId) || teachers[0],
    [teachers, selectedTeacherId]
  );

  const conflictMap = useMemo(
    () => routineService.findSlotConflictIds(routines),
    [routines]
  );

  const classGridMap = useMemo(() => {
    const m = new Map<string, RoutineSlot>();
    const targetId = activeClassOpt?.classId || selectedClassId;
    routines
      .filter((r) => r.classId === targetId)
      .forEach((r) => m.set(`${r.day}|${r.periodNo}`, r));
    return m;
  }, [routines, activeClassOpt, selectedClassId]);

  const classSlotCounts = useMemo(() => {
    const nonBreakPeriods = periods.filter((p) => !p.isBreak).length;
    const totalPossible = nonBreakPeriods * days.length;
    let filled = 0;
    for (const d of days) {
      for (const p of periods) {
        if (!p.isBreak && classGridMap.has(`${d.key}|${p.periodNo}`)) {
          filled++;
        }
      }
    }
    return { filled, totalPossible };
  }, [periods, days, classGridMap]);

  // Pending proxy badge for sub-header
  const pendingProxyCount = useMemo(() => {
    const subDay = routineService.getDayFromDate(subDate);
    if (!subDay) return 0;
    const leaves = routineService.getTeachersOnLeaveForDate(subDate);
    if (leaves.length === 0) return 0;
    const norm = (v?: string) => (v || '').trim().toLowerCase();
    const affected = routines.filter(
      (slot) =>
        slot.day === subDay &&
        leaves.some(
          (l) =>
            (slot.teacherId && norm(l.teacherId) === norm(slot.teacherId)) ||
            norm(l.teacherName) === norm(slot.teacherName)
        )
    );
    const daySubs = substitutions.filter((s) => s.date === subDate);
    const uncovered = affected.filter(
      (slot) => !daySubs.some((s) => s.classId === slot.classId && s.periodNo === slot.periodNo)
    );
    return uncovered.length;
  }, [subDate, routines, substitutions]);

  const daySubstitutions = useMemo(
    () => substitutions.filter((s) => s.date === subDate),
    [substitutions, subDate]
  );

  // Trigger Print with clean mode & PDF filename
  const runPrintMode = useCallback(
    (mode: RoutinePrintMode) => {
      setPrintMode(mode);
      setPrintMenuOpen(false);
      const schoolName = settings?.schoolName || 'শিক্ষা প্রতিষ্ঠান';
      const masterDayBn =
        days.find((d) => d.key === selectedMasterDay)?.labelBn || selectedMasterDay;

      const titleMap: Record<RoutinePrintMode, Array<string | undefined>> = {
        current_class: [schoolName, 'ক্লাস রুটিন', activeClassOpt?.label || selectedClassId],
        all_classes: [schoolName, 'সকল শ্রেণির ক্লাস রুটিন'],
        current_teacher: [schoolName, 'শিক্ষক রুটিন', selectedTeacherObj?.name],
        all_teachers: [schoolName, 'সকল শিক্ষকের ব্যক্তিগত রুটিন'],
        master_day: [schoolName, 'মাস্টার ক্লাস রুটিন', masterDayBn],
        master_week: [schoolName, 'সাপ্তাহিক মাস্টার ক্লাস রুটিন'],
        substitution: [schoolName, 'দৈনিক প্রক্সি ও বিকল্প তালিকা', subDate],
      };

      setTimeout(() => {
        triggerProfessionalPrint(titleMap[mode]);
      }, 60);
    },
    [settings, days, selectedMasterDay, activeClassOpt, selectedClassId, selectedTeacherObj, subDate]
  );

  const handleDefaultTabPrint = () => {
    if (activeTab === 'master_grid') return runPrintMode('master_day');
    if (activeTab === 'teacher_view') return runPrintMode('current_teacher');
    if (activeTab === 'substitution') return runPrintMode('substitution');
    return runPrintMode('current_class');
  };

  // Class Grid Cell Click (Swap or Edit)
  const handleClassCellClick = (
    day: RoutineDayKey,
    dayBn: string,
    periodNo: number,
    existing?: RoutineSlot
  ) => {
    if (!activeClassOpt) return;

    if (swapMode) {
      if (!swapSourceSlot) {
        if (!existing) {
          showToast('সোয়াপ শুরু করতে প্রথমে একটি নির্ধারিত ক্লাস স্লটে ক্লিক করুন।', 'info');
          return;
        }
        setSwapSourceSlot(existing);
        showToast('প্রথম স্লট নির্বাচিত। এবার দ্বিতীয় স্লটে ক্লিক করুন।', 'info');
        return;
      }
      if (!existing) {
        showToast('সোয়াপ করতে দুটি পূর্ণ স্লট নির্বাচন করুন।', 'warning');
        setSwapSourceSlot(null);
        return;
      }
      const res = routineService.swapRoutineSlots(swapSourceSlot.id, existing.id);
      showToast(res.message, res.success ? 'success' : 'error');
      setSwapSourceSlot(null);
      if (res.success) {
        setSwapMode(false);
        loadData();
      }
      return;
    }

    setEditingSlot({
      classOption: activeClassOpt,
      day,
      dayBn,
      periodNo,
      existing,
    });
  };

  const handleSaveSlot = (slot: RoutineSlot) => {
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

  if (!mounted) {
    return (
      <div className="w-full" suppressHydrationWarning>
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3">
          <div className="animate-pulse flex items-center justify-between gap-3">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
            <div className="h-9 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse h-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-14 font-sans text-slate-900 dark:text-slate-100 print:pb-0" suppressHydrationWarning>
      {/* SWC-safe plain <style> for A4 Landscape print (NEVER <style jsx global>) */}
      <style>{'@media print { @page { size: A4 landscape; margin: 9mm; } }'}</style>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 📌 FLUSH STICKY EXECUTIVE SUB-HEADER (0px GAP UNDER MAIN HEADER)  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)] dark:shadow-none print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: 5 Routine Workspace Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5 sm:pb-0">
            {TAB_ITEMS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`h-9 px-3 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold whitespace-nowrap shrink-0 border ${
                    isActive
                      ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-2xs'
                      : 'bg-transparent text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.id === 'master_grid' && conflictMap.size > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold leading-none ${
                        isActive
                          ? 'bg-rose-500 text-white'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {toBanglaDigits(conflictMap.size)}
                    </span>
                  )}
                  {tab.id === 'substitution' && pendingProxyCount > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold leading-none ${
                        isActive
                          ? 'bg-amber-400 text-slate-900'
                          : 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {toBanglaDigits(pendingProxyCount)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Unified Print / PDF Dropdown & Quick Action */}
          <div className="flex items-center gap-2 sm:ml-auto" ref={printMenuRef}>
            <div className="relative inline-flex items-center">
              <button
                type="button"
                onClick={handleDefaultTabPrint}
                className="h-9 px-3.5 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-l-xl font-bold text-xs shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="বর্তমান ভিউ A4 Landscape প্রিন্ট / PDF সংরক্ষণ"
              >
                <Printer size={14} />
                <span>প্রিন্ট / PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintMenuOpen((prev) => !prev)}
                aria-label="প্রিন্ট অপশন মেনু"
                className="h-9 px-2 bg-[#094c30] hover:bg-emerald-900 text-white rounded-r-xl border-l border-emerald-700/60 transition inline-flex items-center justify-center cursor-pointer"
              >
                <ChevronDown size={14} />
              </button>

              {printMenuOpen && (
                <div className="absolute right-0 top-11 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 z-50 text-xs font-bold">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    শ্রেণিভিত্তিক প্রিন্ট (A4 Landscape)
                  </div>
                  <button
                    type="button"
                    onClick={() => runPrintMode('current_class')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between cursor-pointer"
                  >
                    <span>নির্বাচিত শ্রেণি</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                      {activeClassOpt?.shortLabel}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => runPrintMode('all_classes')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between cursor-pointer"
                  >
                    <span>সকল শ্রেণির রুটিন (এক ক্লিকে)</span>
                    <span className="text-[10px] text-[#0B5D3B] dark:text-emerald-400">
                      {toBanglaDigits(classOptions.length)} পৃষ্ঠা
                    </span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    মাস্টার রুটিন প্রিন্ট
                  </div>
                  <button
                    type="button"
                    onClick={() => runPrintMode('master_day')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer"
                  >
                    মাস্টার রুটিন — এক শিট ({days.find((d) => d.key === selectedMasterDay)?.labelBn})
                  </button>
                  <button
                    type="button"
                    onClick={() => runPrintMode('master_week')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer"
                  >
                    মাস্টার রুটিন — পুরো সপ্তাহ ({toBanglaDigits(days.length)} পৃষ্ঠা)
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    শিক্ষক প্রতি ও প্রক্সি প্রিন্ট
                  </div>
                  <button
                    type="button"
                    disabled={!selectedTeacherObj}
                    onClick={() => runPrintMode('current_teacher')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 text-slate-800 dark:text-slate-100 cursor-pointer"
                  >
                    নির্বাচিত শিক্ষকের রুটিন
                  </button>
                  <button
                    type="button"
                    disabled={teachers.length === 0}
                    onClick={() => runPrintMode('all_teachers')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 text-slate-800 dark:text-slate-100 flex items-center justify-between cursor-pointer"
                  >
                    <span>সকল শিক্ষকের ব্যক্তিগত রুটিন</span>
                    <span className="text-[10px] text-[#0B5D3B] dark:text-emerald-400">
                      {toBanglaDigits(teachers.length)} জন
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => runPrintMode('substitution')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer"
                  >
                    দৈনিক প্রক্সি তালিকা ({subDate})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 📄 MAIN SCREEN WORKSPACE (print:hidden)                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-4 print:hidden">
        {/* TAB 1: শ্রেণিভিত্তিক রুটিন */}
        {activeTab === 'class_grid' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
            {/* Compact Toolbar inside Class Grid Card */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <label className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
                  শ্রেণি ও শাখা:
                </label>
                <select
                  value={activeClassOpt?.classId || selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    setSwapSourceSlot(null);
                  }}
                  className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-[#0B5D3B]"
                >
                  {classOptions.map((opt) => (
                    <option key={opt.classId} value={opt.classId}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                  নির্ধারিত: {toBanglaDigits(classSlotCounts.filled)} /{' '}
                  {toBanglaDigits(classSlotCounts.totalPossible)} পিরিয়ড
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSwapMode((prev) => !prev);
                    setSwapSourceSlot(null);
                  }}
                  className={`h-9 px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border transition cursor-pointer ${
                    swapMode
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ArrowLeftRight size={13} />
                  {swapMode
                    ? swapSourceSlot
                      ? 'দ্বিতীয় স্লটে ক্লিক করুন...'
                      : 'সোয়াপ চালু (প্রথম স্লট নিন)'
                    : 'পিরিয়ড সোয়াপ'}
                </button>

                <button
                  type="button"
                  onClick={() => runPrintMode('all_classes')}
                  className="h-9 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Printer size={13} /> সকল শ্রেণি প্রিন্ট
                </button>
              </div>
            </div>

            {/* Weekly Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/70 text-slate-700 dark:text-slate-200">
                    <th className="p-2.5 border-b border-r border-slate-200 dark:border-slate-800 font-extrabold w-28 text-left">
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
                    <tr
                      key={day.key}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20"
                    >
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
                        const slot = classGridMap.get(`${day.key}|${p.periodNo}`);
                        const isSwapSelected = swapSourceSlot?.id === slot?.id && !!slot;
                        const hasConflict = slot ? conflictMap.has(slot.id) : false;

                        return (
                          <td
                            key={p.periodNo}
                            onClick={() => handleClassCellClick(day.key, day.labelBn, p.periodNo, slot)}
                            className={`p-2 border-r last:border-r-0 border-slate-200 dark:border-slate-800 align-top cursor-pointer transition min-w-[115px] ${
                              isSwapSelected
                                ? 'bg-amber-100 dark:bg-amber-900/40 ring-2 ring-inset ring-amber-500'
                                : hasConflict
                                ? 'bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100/70'
                                : slot
                                ? 'bg-emerald-50/25 dark:bg-emerald-950/15 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            {slot ? (
                              <div className="space-y-0.5">
                                <div className="flex items-start justify-between gap-1">
                                  <p className="font-extrabold text-slate-900 dark:text-white leading-tight text-[11.5px]">
                                    {slot.subject}
                                  </p>
                                  {hasConflict && (
                                    <span className="px-1 py-0.2 rounded bg-rose-600 text-white text-[9px] font-extrabold shrink-0 inline-flex items-center gap-0.5">
                                      <AlertTriangle size={9} /> কনফ্লিক্ট
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10.5px] font-bold text-[#0B5D3B] dark:text-emerald-300 truncate">
                                  {slot.teacherName}
                                </p>
                                <span className="inline-block px-1.5 py-0.2 rounded bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[9.5px] font-semibold text-slate-600 dark:text-slate-300">
                                  রুম: {slot.roomNo}
                                </span>
                              </div>
                            ) : (
                              <div className="h-12 flex items-center justify-center text-slate-300 dark:text-slate-700 hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition">
                                <Plus size={15} />
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

        {/* TAB 2: সকল ক্লাস (মাস্টার রুটিন) */}
        {activeTab === 'master_grid' && (
          <MasterRoutineGridTab
            days={days}
            periods={periods}
            classOptions={classOptions}
            routines={routines}
            conflictMap={conflictMap}
            selectedMasterDay={selectedMasterDay}
            setSelectedMasterDay={setSelectedMasterDay}
            onEditCell={(ctx) => setEditingSlot(ctx)}
            onPrintMasterDay={() => runPrintMode('master_day')}
            onPrintMasterWeek={() => runPrintMode('master_week')}
          />
        )}

        {/* TAB 3: শিক্ষকভিত্তিক রুটিন */}
        {activeTab === 'teacher_view' && (
          <RoutineTeacherViewTab
            teachers={teachers}
            selectedTeacherId={selectedTeacherId}
            setSelectedTeacherId={setSelectedTeacherId}
            days={days}
            periods={periods}
            routines={routines}
            classOptions={classOptions}
            onPrintCurrentTeacher={() => runPrintMode('current_teacher')}
            onPrintAllTeachers={() => runPrintMode('all_teachers')}
          />
        )}

        {/* TAB 4: প্রক্সি ও বদলি */}
        {activeTab === 'substitution' && (
          <RoutineSubstitutionTab
            subDate={subDate}
            setSubDate={setSubDate}
            days={days}
            periods={periods}
            routines={routines}
            substitutions={substitutions}
            classOptions={classOptions}
            onDataUpdated={loadData}
            onPrintSubstitution={() => runPrintMode('substitution')}
          />
        )}

        {/* TAB 5: পিরিয়ড ও বার সেটআপ */}
        {activeTab === 'setup' && (
          <RoutineSetupTab periods={periods} days={days} onConfigUpdated={loadData} />
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 🖨️ DEDICATED MULTI-MODE A4 LANDSCAPE PRINT TEMPLATES              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <RoutinePrintViews
        printMode={printMode}
        settings={settings}
        days={days}
        periods={periods}
        routines={routines}
        classOptions={classOptions}
        activeClassOpt={activeClassOpt}
        teachers={teachers}
        selectedTeacherObj={selectedTeacherObj}
        selectedMasterDay={selectedMasterDay}
        subDate={subDate}
        daySubstitutions={daySubstitutions}
      />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ✏️ SHARED SLOT EDITOR MODAL (TEACHER FILTER + CONFLICT WARNING)   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <SlotEditorModal
        editingSlot={editingSlot}
        periods={periods}
        routines={routines}
        teachers={teachers}
        subjectAssignments={subjectAssignments}
        classOptions={classOptions}
        onClose={() => setEditingSlot(null)}
        onSave={handleSaveSlot}
        onDelete={handleDeleteSlot}
      />
    </div>
  );
}
