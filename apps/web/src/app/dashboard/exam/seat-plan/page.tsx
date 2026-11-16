'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutGrid, Printer, Users, ShieldCheck, Building2, Plus, Trash2,
  Wand2, Scissors, ClipboardCheck, UserCheck, AlertCircle, X
} from 'lucide-react';
import { examService, ExamItem } from '@/services/examService';
import { studentService, Student } from '@/services/studentService';
import { teacherRBACService, TeacherRecord } from '@/services/teacherRBACService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import {
  examSeatPlanService,
  ExamHallRoom,
  SeatPlanEntry,
  InvigilatorDuty,
} from '@/services/examSeatPlanService';
import { localDateKey } from '@/lib/dateUtils';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';

type SeatPlanTab = 'hall_map' | 'bench_stickers' | 'top_sheet' | 'invigilators';

const GRADE_OPTIONS = [
  { value: '6th', label: '৬ষ্ঠ শ্রেণি' },
  { value: '7th', label: '৭ম শ্রেণি' },
  { value: '8th', label: '৮ম শ্রেণি' },
  { value: '9th', label: '৯ম শ্রেণি' },
  { value: '10th', label: '১০ম শ্রেণি' },
];

const GRADE_BADGE: Record<string, string> = {
  '6th': 'bg-sky-100 text-sky-800 border-sky-200',
  '7th': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  '8th': 'bg-amber-100 text-amber-800 border-amber-200',
  '9th': 'bg-purple-100 text-purple-800 border-purple-200',
  '10th': 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function ExamSeatPlanPage() {
  const [activeTab, setActiveTab] = useState<SeatPlanTab>('hall_map');
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [rooms, setRooms] = useState<ExamHallRoom[]>([]);
  const [seatPlans, setSeatPlans] = useState<SeatPlanEntry[]>([]);
  const [duties, setDuties] = useState<InvigilatorDuty[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  // Generator controls
  const [mode, setMode] = useState<'single' | 'mixed_alternate'>('mixed_alternate');
  const [primaryGrade, setPrimaryGrade] = useState<string>('6th');
  const [secondaryGrade, setSecondaryGrade] = useState<string>('8th');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  // Invigilator duty controls
  const [dutyDate, setDutyDate] = useState<string>(() => localDateKey());
  const [dutyShift, setDutyShift] = useState<'Morning' | 'Afternoon'>('Morning');
  const [teachersPerRoom, setTeachersPerRoom] = useState<number>(2);

  // Add Hall Modal
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoomNo, setNewRoomNo] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomRows, setNewRoomRows] = useState(5);
  const [newRoomCols, setNewRoomCols] = useState(2);
  const [newSeatsPerBench, setNewSeatsPerBench] = useState<1 | 2 | 3>(2);

  const loadData = useCallback(() => {
    const ex = examService.getExams();
    const rms = examSeatPlanService.getRooms();
    setExams(ex);
    if (!selectedExamId && ex.length > 0) setSelectedExamId(ex[0].id);
    setStudents(studentService.getAllStudents());
    setTeachers(teacherRBACService.getTeachers());
    setRooms(rms);
    if (selectedRoomIds.length === 0 && rms.length > 0) {
      setSelectedRoomIds(rms.map((r) => r.id));
    }
    setSeatPlans(examSeatPlanService.getSeatPlans());
    setDuties(examSeatPlanService.getInvigilatorDuties());
    setSettings(settingsService.getSettings());
  }, [selectedExamId, selectedRoomIds.length]);

  useEffect(() => {
    loadData();
    const onStorage = () => loadData();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [loadData]);

  const activeExam = useMemo(
    () => exams.find((e) => e.id === selectedExamId) || exams[0],
    [exams, selectedExamId]
  );

  const examSeats = useMemo(
    () => (activeExam ? seatPlans.filter((s) => s.examId === activeExam.id) : []),
    [seatPlans, activeExam]
  );

  const examDuties = useMemo(
    () => (activeExam ? duties.filter((d) => d.examId === activeExam.id) : []),
    [duties, activeExam]
  );

  const primaryStudents = useMemo(
    () => students.filter((s) => s.grade === primaryGrade),
    [students, primaryGrade]
  );

  const secondaryStudents = useMemo(
    () => (mode === 'mixed_alternate' ? students.filter((s) => s.grade === secondaryGrade) : []),
    [students, secondaryGrade, mode]
  );

  const totalSelectedCapacity = useMemo(() => {
    return rooms
      .filter((r) => selectedRoomIds.includes(r.id))
      .reduce((acc, r) => acc + r.rows * r.cols * r.seatsPerBench, 0);
  }, [rooms, selectedRoomIds]);

  const handleGenerate = () => {
    if (!activeExam) {
      showToast('অন্তত একটি পরীক্ষা নির্বাচন করুন।', 'error');
      return;
    }
    if (primaryStudents.length === 0 && secondaryStudents.length === 0) {
      showToast('নির্বাচিত শ্রেণিগুলোতে কোনো শিক্ষার্থী পাওয়া যায়নি।', 'warning');
      return;
    }
    const res = examSeatPlanService.generateSeatPlan({
      examId: activeExam.id,
      examTitle: activeExam.title,
      primaryStudents,
      secondaryStudents,
      roomIds: selectedRoomIds,
      mode,
    });
    showToast(res.message, res.success ? (res.unassignedCount > 0 ? 'warning' : 'success') : 'error');
    loadData();
  };

  const handleClear = async () => {
    if (!activeExam) return;
    const ok = await confirmDialog({
      title: 'আসন বিন্যাস মুছবেন?',
      message: `${activeExam.title}-এর বর্তমান সিট প্ল্যান মুছে ফেলা হবে।`,
      confirmLabel: 'হ্যাঁ, মুছুন',
      danger: true,
    });
    if (!ok) return;
    examSeatPlanService.clearExamSeatPlan(activeExam.id);
    showToast('আসন বিন্যাস মুছে ফেলা হয়েছে।', 'info');
    loadData();
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNo.trim() || !newRoomName.trim()) {
      showToast('কক্ষ নম্বর ও নাম লিখুন।', 'error');
      return;
    }
    const rm: ExamHallRoom = {
      id: `room-${Date.now()}`,
      roomNo: newRoomNo.trim(),
      roomName: newRoomName.trim(),
      rows: Math.max(1, newRoomRows),
      cols: Math.max(1, newRoomCols),
      seatsPerBench: newSeatsPerBench,
    };
    examSeatPlanService.saveRoom(rm);
    setSelectedRoomIds((prev) => [...prev, rm.id]);
    setShowRoomModal(false);
    setNewRoomNo('');
    setNewRoomName('');
    showToast('নতুন পরীক্ষা কক্ষ যোগ করা হয়েছে!', 'success');
    loadData();
  };

  const handleAutoDuty = () => {
    if (!activeExam) return;
    const res = examSeatPlanService.autoAssignInvigilators({
      examId: activeExam.id,
      examTitle: activeExam.title,
      date: dutyDate,
      shift: dutyShift,
      roomIds: selectedRoomIds,
      teachers,
      teachersPerRoom,
    });
    showToast(res.message, res.success ? 'success' : 'error');
    loadData();
  };

  const seatsByRoom = useMemo(() => {
    const grouped = new Map<string, { roomMeta?: ExamHallRoom; entries: SeatPlanEntry[] }>();
    examSeats.forEach((s) => {
      if (!grouped.has(s.roomId)) {
        grouped.set(s.roomId, {
          roomMeta: rooms.find((r) => r.id === s.roomId),
          entries: [],
        });
      }
      grouped.get(s.roomId)!.entries.push(s);
    });
    return grouped;
  }, [examSeats, rooms]);

  return (
    <div className="space-y-6 pb-12 print:pb-0">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background: #ffffff !important;
          }
          .seat-print-break {
            break-after: page;
            page-break-after: always;
          }
          .seat-avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-black mb-2">
              <LayoutGrid className="w-3.5 h-3.5" /> অ্যান্টি-চিট সিট প্ল্যান ও পরিদর্শক রোস্টার
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              পরীক্ষার আসন বিন্যাস, বেঞ্চ স্টিকার ও পরিদর্শক ডিউটি
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              একই বেঞ্চে দুই ভিন্ন শ্রেণির শিক্ষার্থী বণ্টন, ছুটি-সম্মত পরিদর্শক ডিউটি এবং প্রিন্টেবল বেঞ্চ স্টিকার
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm self-start cursor-pointer"
          >
            <Printer className="w-4 h-4" /> বর্তমান ভিউ প্রিন্ট করুন
          </button>
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1">পরীক্ষা নির্বাচন</label>
            <select
              value={activeExam?.id || ''}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1">বণ্টন পদ্ধতি</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'single' | 'mixed_alternate')}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="mixed_alternate">মিশ্র শ্রেণি (অ্যান্টি-চিট L/R)</option>
              <option value="single">একক শ্রেণি ধারাবাহিক</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1">
              প্রাথমিক শ্রেণি ({primaryStudents.length} জন)
            </label>
            <select
              value={primaryGrade}
              onChange={(e) => setPrimaryGrade(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              {GRADE_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {mode === 'mixed_alternate' && (
            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-1">
                বিকল্প / দ্বিতীয় শ্রেণি ({secondaryStudents.length} জন)
              </label>
              <select
                value={secondaryGrade}
                onChange={(e) => setSecondaryGrade(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Rooms Selection */}
        <div className="space-y-2 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300">
              পরীক্ষা কক্ষ ও আসন ধারণক্ষমতা (নির্বাচিত আসন: {totalSelectedCapacity} টি)
            </span>
            <button
              type="button"
              onClick={() => setShowRoomModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> নতুন কক্ষ যোগ
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {rooms.map((rm) => {
              const checked = selectedRoomIds.includes(rm.id);
              const cap = rm.rows * rm.cols * rm.seatsPerBench;
              return (
                <button
                  key={rm.id}
                  type="button"
                  onClick={() =>
                    setSelectedRoomIds((prev) =>
                      checked ? prev.filter((id) => id !== rm.id) : [...prev, rm.id]
                    )
                  }
                  className={`px-3 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                    checked
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-800 dark:text-indigo-200'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{rm.roomName}</span>
                  <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-[10px]">
                    {cap} আসন
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Row & View Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Wand2 className="w-4 h-4" /> সিট প্ল্যান জেনারেট করুন
            </button>
            {examSeats.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3.5 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-black flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> মুছুন
              </button>
            )}
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl overflow-x-auto">
            {(
              [
                { id: 'hall_map', label: 'ভিজ্যুয়াল হল ম্যাপ', icon: LayoutGrid },
                { id: 'bench_stickers', label: 'বেঞ্চ স্টিকার', icon: Scissors },
                { id: 'top_sheet', label: 'হাজিরা টপশিট', icon: ClipboardCheck },
                { id: 'invigilators', label: 'পরিদর্শক ডিউটি', icon: UserCheck },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PRINT HEADER */}
      <div className="hidden print:block text-center border-b-2 border-slate-800 pb-2 mb-4">
        <h2 className="text-lg font-black text-slate-900">{settings?.schoolName || 'স্মার্ট স্কুল'}</h2>
        <p className="text-xs text-slate-600">{settings?.address} • EIIN: {settings?.eiin}</p>
        <p className="text-sm font-black text-slate-900 mt-1">
          {activeExam?.title} —{' '}
          {activeTab === 'hall_map'
            ? 'কক্ষভিত্তিক আসন বিন্যাস (Seat Plan)'
            : activeTab === 'bench_stickers'
            ? 'বেঞ্চ নম্বর ও রোল স্টিকার'
            : activeTab === 'top_sheet'
            ? 'পরীক্ষার্থীদের কক্ষভিত্তিক হাজিরা টপশিট'
            : 'পরিদর্শক (Invigilator) ডিউটি রোস্টার'}
        </p>
      </div>

      {/* VIEW 1: VISUAL HALL MAP */}
      {activeTab === 'hall_map' && (
        <div className="space-y-6">
          {examSeats.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 print:hidden">
              <LayoutGrid className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-black text-slate-700 dark:text-slate-300">
                এখনো কোনো সিট প্ল্যান তৈরি করা হয়নি। উপরের &ldquo;সিট প্ল্যান জেনারেট করুন&rdquo; বাটনে ক্লিক করুন।
              </p>
            </div>
          ) : (
            Array.from(seatsByRoom.entries()).map(([roomId, group]) => {
              const benchesMap = new Map<number, SeatPlanEntry[]>();
              group.entries.forEach((e) => {
                if (!benchesMap.has(e.benchNo)) benchesMap.set(e.benchNo, []);
                benchesMap.get(e.benchNo)!.push(e);
              });
              const cols = group.roomMeta?.cols || 2;
              return (
                <div
                  key={roomId}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 seat-print-break print:border print:border-slate-300 print:rounded-lg"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {group.entries[0]?.roomName} (কক্ষ #{group.entries[0]?.roomNo})
                    </h3>
                    <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-black">
                      মোট পরীক্ষার্থী: {group.entries.length} জন
                    </span>
                  </div>

                  <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                  >
                    {Array.from(benchesMap.entries()).map(([benchNo, seats]) => (
                      <div
                        key={benchNo}
                        className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 seat-avoid-break"
                      >
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          বেঞ্চ #{benchNo}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {seats.map((s) => (
                            <div
                              key={s.id}
                              className={`p-2 rounded-xl border text-[11px] ${
                                GRADE_BADGE[s.grade] || 'bg-white border-slate-200 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between font-black">
                                <span>রোল: {s.roll}</span>
                                <span className="text-[9.5px] opacity-75">{s.seatPosition}</span>
                              </div>
                              <p className="font-bold truncate">{s.studentName}</p>
                              <p className="text-[9.5px] font-bold opacity-80">
                                {s.grade} ({s.section})
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: BENCH STICKERS */}
      {activeTab === 'bench_stickers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 print:grid-cols-3 print:gap-2">
          {Array.from(seatsByRoom.entries()).flatMap(([, group]) => {
            const benchesMap = new Map<number, SeatPlanEntry[]>();
            group.entries.forEach((e) => {
              if (!benchesMap.has(e.benchNo)) benchesMap.set(e.benchNo, []);
              benchesMap.get(e.benchNo)!.push(e);
            });
            return Array.from(benchesMap.entries()).map(([benchNo, seats]) => (
              <div
                key={`${seats[0]?.roomId}-${benchNo}`}
                className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-3 space-y-2 seat-avoid-break"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                  <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                    রুম #{seats[0]?.roomNo} • বেঞ্চ #{benchNo}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">{activeExam?.title}</span>
                </div>
                <div className="space-y-1">
                  {seats.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg"
                    >
                      <span className="font-black text-slate-900 dark:text-white">
                        [{s.seatPosition}] রোল: {s.roll} ({s.grade})
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[110px]">
                        {s.studentName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })}
        </div>
      )}

      {/* VIEW 3: ROOM ATTENDANCE TOP SHEET */}
      {activeTab === 'top_sheet' && (
        <div className="space-y-6">
          {Array.from(seatsByRoom.entries()).map(([roomId, group]) => (
            <div
              key={roomId}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 seat-print-break print:border-0"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    হাজিরা টপশিট — {group.entries[0]?.roomName} (রুম #{group.entries[0]?.roomNo})
                  </h3>
                  <p className="text-xs text-slate-500">{activeExam?.title}</p>
                </div>
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                  মোট পরীক্ষার্থী: {group.entries.length} জন
                </span>
              </div>

              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    <th className="p-2 border border-slate-300 dark:border-slate-700">বেঞ্চ</th>
                    <th className="p-2 border border-slate-300 dark:border-slate-700">রোল</th>
                    <th className="p-2 border border-slate-300 dark:border-slate-700 text-left">নাম</th>
                    <th className="p-2 border border-slate-300 dark:border-slate-700">শ্রেণি ও শাখা</th>
                    <th className="p-2 border border-slate-300 dark:border-slate-700 w-32">পরীক্ষার্থীর স্বাক্ষর</th>
                  </tr>
                </thead>
                <tbody>
                  {group.entries.map((s) => (
                    <tr key={s.id}>
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700 text-center font-bold">
                        B{s.benchNo} ({s.seatPosition})
                      </td>
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700 text-center font-black">
                        {s.roll}
                      </td>
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700 font-bold">
                        {s.studentName}
                      </td>
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700 text-center">
                        {s.grade} ({s.section})
                      </td>
                      <td className="p-1.5 border border-slate-300 dark:border-slate-700" />
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-3 gap-4 pt-6 text-xs font-bold text-slate-700 dark:text-slate-300">
                <div>উপস্থিত: _________ জন</div>
                <div>অনুপস্থিত: _________ জন</div>
                <div className="text-right">পরিদর্শকের স্বাক্ষর: _______________</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 4: INVIGILATOR DUTY ROSTER */}
      {activeTab === 'invigilators' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1">পরীক্ষার তারিখ</label>
                <input
                  type="date"
                  value={dutyDate}
                  onChange={(e) => setDutyDate(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1">শিফট</label>
                <select
                  value={dutyShift}
                  onChange={(e) => setDutyShift(e.target.value as 'Morning' | 'Afternoon')}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="Morning">সকাল (Morning)</option>
                  <option value="Afternoon">বিকাল (Afternoon)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1">প্রতি কক্ষে পরিদর্শক</label>
                <select
                  value={teachersPerRoom}
                  onChange={(e) => setTeachersPerRoom(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value={1}>১ জন</option>
                  <option value={2}>২ জন</option>
                  <option value={3}>৩ জন</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAutoDuty}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" /> ছুটি-সম্মত ডিউটি বণ্টন করুন
            </button>
          </div>

          {examDuties.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-2xl">
              কোনো পরিদর্শক ডিউটি রোস্টার তৈরি করা হয়নি।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    <th className="p-2.5 border border-slate-200 dark:border-slate-700 text-left">তারিখ ও শিফট</th>
                    <th className="p-2.5 border border-slate-200 dark:border-slate-700 text-left">পরীক্ষা কক্ষ</th>
                    <th className="p-2.5 border border-slate-200 dark:border-slate-700 text-left">দায়িত্বপ্রাপ্ত পরিদর্শকবৃন্দ</th>
                    <th className="p-2.5 border border-slate-200 dark:border-slate-700">স্বাক্ষর</th>
                  </tr>
                </thead>
                <tbody>
                  {examDuties.map((d) => (
                    <tr key={d.id}>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-bold">
                        {d.date} ({d.shift === 'Morning' ? 'সকাল' : 'বিকাল'})
                      </td>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-black">
                        {d.roomName} (কক্ষ #{d.roomNo})
                      </td>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-bold text-indigo-700 dark:text-indigo-300">
                        {d.teacherNames.join(', ')}
                      </td>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 w-36" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD ROOM */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddRoom}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white">নতুন পরীক্ষা কক্ষ যোগ</h3>
              <button
                type="button"
                onClick={() => setShowRoomModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1">কক্ষ নং</label>
                <input
                  value={newRoomNo}
                  onChange={(e) => setNewRoomNo(e.target.value)}
                  placeholder="যেমন: ২০২"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1">বেঞ্চ প্রতি আসন</label>
                <select
                  value={newSeatsPerBench}
                  onChange={(e) => setNewSeatsPerBench(Number(e.target.value) as 1 | 2 | 3)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                >
                  <option value={1}>১ জন</option>
                  <option value={2}>২ জন</option>
                  <option value={3}>৩ জন</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1">কক্ষের নাম</label>
              <input
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="যেমন: কক্ষ নং ২০২ (নতুন ভবন)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1">সারি (Rows)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newRoomRows}
                  onChange={(e) => setNewRoomRows(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1">কলাম (Cols)</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={newRoomCols}
                  onChange={(e) => setNewRoomCols(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRoomModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-black cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
