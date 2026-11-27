'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutGrid,
  Printer,
  Users,
  Building2,
  Plus,
  Trash2,
  Wand2,
  Scissors,
  ClipboardCheck,
  UserCheck,
  AlertCircle,
  X,
  FileSpreadsheet,
  DoorOpen,
  RefreshCw,
  Search,
  ArrowLeftRight,
  SlidersHorizontal,
  CheckCircle2,
  Sparkles,
  Pencil,
} from 'lucide-react';
import { examService, ExamItem } from '@/services/examService';
import { studentService, Student } from '@/services/studentService';
import { classSectionService, ClassItem } from '@/services/classSectionService';
import { teacherRBACService, TeacherRecord } from '@/services/teacherRBACService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import {
  examSeatPlanService,
  ExamHallRoom,
  SeatPlanEntry,
  InvigilatorDuty,
  AdvancedSeatPlanResult,
} from '@/services/examSeatPlanService';
import {
  type ColumnGenderRule,
  type SeatGenderMode,
  type ClassDistributionMode,
  type SeatFillOrder,
  type NormalizedGender,
  COLUMN_GENDER_PRESETS,
  buildBatchRooms,
  buildLiveClassGroups,
  buildRoomDoorSummaries,
  calculateCapacityForecast,
  exportSeatPlanToExcel,
  filterStudentsByRollRange,
  formatGenderRuleBn,
  getRoomCapacity,
  getRoomColumnGenders,
  normalizeSeatGender,
  toAsciiDigits,
  toBanglaDigits,
} from '@/lib/seatPlanUtils';
import { SeatPlanRoomMap } from '@/components/exam/SeatPlanRoomMap';
import {
  AttendanceTopSheetPrintView,
  BenchStickersPrintView,
  DoorNoticePrintView,
  InvigilatorDutyPrintView,
} from '@/components/exam/SeatPlanPrintViews';
import {
  STICKER_DENSITY_SPECS,
  type SeatPrintLang,
  type StickerDensityId,
} from '@/lib/seatPlanPrintUtils';
import { triggerProfessionalPrint } from '@/lib/printPdfUtils';
import { localDateKey } from '@/lib/dateUtils';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';

type SeatPlanTab =
  | 'hall_map'
  | 'door_notice'
  | 'bench_stickers'
  | 'top_sheet'
  | 'invigilators';

const NEXT_COL_RULE: Record<ColumnGenderRule, ColumnGenderRule> = {
  male: 'female',
  female: 'any',
  any: 'male',
};

const COL_PILL_STYLE: Record<ColumnGenderRule, string> = {
  male: 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-200',
  female: 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200',
  any: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200',
};

export default function ExamSeatPlanPage() {
  const [activeTab, setActiveTab] = useState<SeatPlanTab>('hall_map');
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [academicClasses, setAcademicClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [rooms, setRooms] = useState<ExamHallRoom[]>([]);
  const [seatPlans, setSeatPlans] = useState<SeatPlanEntry[]>([]);
  const [duties, setDuties] = useState<InvigilatorDuty[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  // Step 1: Class/Group multi-selection & roll filter
  const [selectedClassKeys, setSelectedClassKeys] = useState<string[]>([]);
  const [hasInitializedClasses, setHasInitializedClasses] = useState(false);
  const [rollFrom, setRollFrom] = useState<string>('');
  const [rollTo, setRollTo] = useState<string>('');

  // Step 2: Quick Room Count & Bench Builder
  const [builderRoomCount, setBuilderRoomCount] = useState<number>(3);
  const [builderStartNo, setBuilderStartNo] = useState<number>(101);
  const [builderCols, setBuilderCols] = useState<number>(3);
  const [builderRows, setBuilderRows] = useState<number>(7);
  const [builderSeatsPerBench, setBuilderSeatsPerBench] = useState<1 | 2 | 3>(2);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  // Step 3: Gender, Column & Anti-Cheat Config
  const [genderMode, setGenderMode] = useState<SeatGenderMode>('column_split');
  const [globalColumnGenders, setGlobalColumnGenders] = useState<ColumnGenderRule[]>([
    'male',
    'female',
    'female',
  ]);
  const [classDistribution, setClassDistribution] =
    useState<ClassDistributionMode>('anti_cheat_bench');
  const [fillOrder, setFillOrder] = useState<SeatFillOrder>('column_first');
  const [strictGenderOverflow, setStrictGenderOverflow] = useState<boolean>(true);
  const [strictAntiCheatSinglePerBench, setStrictAntiCheatSinglePerBench] =
    useState<boolean>(false);

  // Generation telemetry & Preview workspace tools
  const [lastResult, setLastResult] = useState<AdvancedSeatPlanResult | null>(null);
  const [activeRoomFilter, setActiveRoomFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [swapMode, setSwapMode] = useState<boolean>(false);
  const [selectedSwapSeatId, setSelectedSwapSeatId] = useState<string | null>(null);

  // Print View Settings
  const [hallMapOrientation, setHallMapOrientation] = useState<'landscape' | 'portrait'>(
    'landscape'
  );
  const [doorCardsPerPage, setDoorCardsPerPage] = useState<1 | 2>(1);
  const [stickerMode, setStickerMode] = useState<'per_bench' | 'per_seat'>('per_bench');
  const [stickerCols, setStickerCols] = useState<2 | 3>(3);
  const [stickerDensity, setStickerDensity] = useState<StickerDensityId>('medium_18');
  const [printLang, setPrintLang] = useState<SeatPrintLang>('bn');

  // Invigilator controls
  const [dutyDate, setDutyDate] = useState<string>(() => localDateKey());
  const [dutyShift, setDutyShift] = useState<'Morning' | 'Afternoon'>('Morning');
  const [teachersPerRoom, setTeachersPerRoom] = useState<number>(2);

  // Add/Edit Room Modal
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [modalRoomNo, setModalRoomNo] = useState('');
  const [modalRoomName, setModalRoomName] = useState('');
  const [modalBuilding, setModalBuilding] = useState('মূল ভবন');
  const [modalCols, setModalCols] = useState(3);
  const [modalRows, setModalRows] = useState(7);
  const [modalSeatsPerBench, setModalSeatsPerBench] = useState<1 | 2 | 3>(2);
  const [modalColGenders, setModalColGenders] = useState<ColumnGenderRule[]>([
    'male',
    'female',
    'female',
  ]);
  const [modalRoomGender, setModalRoomGender] = useState<ColumnGenderRule>('any');

  const loadData = useCallback(() => {
    const activeEx = examService.getActiveExams();
    const ex = activeEx.length > 0 ? activeEx : examService.getExams();
    const rms = examSeatPlanService.getRooms();
    const allSt = studentService.getAllStudents();
    const cls = classSectionService.getClasses();

    setExams(ex);
    setSelectedExamId((prev) => (prev && ex.some((e) => e.id === prev) ? prev : ex[0]?.id || ''));
    setStudents(allSt);
    setAcademicClasses(cls);
    setTeachers(teacherRBACService.getTeachers());
    setRooms(rms);
    setSelectedRoomIds((prev) => {
      const valid = prev.filter((id) => rms.some((r) => r.id === id));
      return valid.length > 0 ? valid : rms.map((r) => r.id);
    });
    setSeatPlans(examSeatPlanService.getSeatPlans());
    setDuties(examSeatPlanService.getInvigilatorDuties());
    setSettings(settingsService.getSettings());
  }, []);

  useEffect(() => {
    loadData();
    const onStorage = () => loadData();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [loadData]);

  // Live class groups aggregated from studentService
  const liveClassGroups = useMemo(() => buildLiveClassGroups(students), [students]);

  // Auto-select all classes that currently have students on initial mount
  useEffect(() => {
    if (!hasInitializedClasses && liveClassGroups.length > 0) {
      const populated = liveClassGroups.filter((g) => g.total > 0).map((g) => g.key);
      if (populated.length > 0) {
        setSelectedClassKeys(populated);
      } else {
        setSelectedClassKeys(['6th', '8th']);
      }
      setHasInitializedClasses(true);
    }
  }, [hasInitializedClasses, liveClassGroups]);

  // Keep globalColumnGenders length aligned with builderCols
  useEffect(() => {
    setGlobalColumnGenders((prev) => {
      if (prev.length === builderCols) return prev;
      if (builderCols === 1) return [prev[0] || 'any'];
      if (builderCols === 2) return [prev[0] || 'male', prev[1] || 'female'];
      return Array.from({ length: builderCols }, (_, i) =>
        prev[i] || (i === 0 ? 'male' : 'female')
      );
    });
  }, [builderCols]);

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

  const studentGenderById = useMemo(() => {
    const map = new Map<string, NormalizedGender>();
    students.forEach((s) => map.set(s.id, normalizeSeatGender(s.gender)));
    return map;
  }, [students]);

  const roomsById = useMemo(() => {
    const map = new Map<string, ExamHallRoom>();
    rooms.forEach((r) => map.set(r.id, r));
    return map;
  }, [rooms]);

  const selectedRooms = useMemo(
    () => rooms.filter((r) => selectedRoomIds.includes(r.id)),
    [rooms, selectedRoomIds]
  );

  // Filtered students from selected class buckets + optional roll range
  const selectedStudents = useMemo(() => {
    const bucketSet = new Set(selectedClassKeys);
    const merged = liveClassGroups
      .filter((b) => bucketSet.has(b.key))
      .flatMap((b) => b.students);
    return filterStudentsByRollRange(merged, rollFrom, rollTo);
  }, [liveClassGroups, selectedClassKeys, rollFrom, rollTo]);

  // Live capacity forecast before clicking generate
  const capacityForecast = useMemo(
    () =>
      calculateCapacityForecast({
        students: selectedStudents,
        rooms: selectedRooms,
        genderMode,
        globalColumnGenders,
        strictGenderOverflow,
        templateRoom: {
          cols: builderCols,
          rows: builderRows,
          seatsPerBench: builderSeatsPerBench,
          columnGenders: globalColumnGenders,
        },
      }),
    [
      selectedStudents,
      selectedRooms,
      genderMode,
      globalColumnGenders,
      strictGenderOverflow,
      builderCols,
      builderRows,
      builderSeatsPerBench,
    ]
  );

  // Door summaries & room entries map for current exam's generated seat plan
  const allRoomSummaries = useMemo(
    () =>
      buildRoomDoorSummaries(
        examSeats,
        rooms,
        studentGenderById,
        globalColumnGenders
      ),
    [examSeats, rooms, studentGenderById, globalColumnGenders]
  );

  const visibleRoomSummaries = useMemo(() => {
    if (activeRoomFilter === 'all') return allRoomSummaries;
    return allRoomSummaries.filter((r) => r.roomId === activeRoomFilter);
  }, [allRoomSummaries, activeRoomFilter]);

  const entriesByRoom = useMemo(() => {
    const map = new Map<string, SeatPlanEntry[]>();
    examSeats.forEach((e) => {
      if (!map.has(e.roomId)) map.set(e.roomId, []);
      map.get(e.roomId)!.push(e);
    });
    return map;
  }, [examSeats]);

  const summariesByRoomId = useMemo(() => {
    const map = new Map<string, (typeof allRoomSummaries)[number]>();
    allRoomSummaries.forEach((s) => map.set(s.roomId, s));
    return map;
  }, [allRoomSummaries]);

  const seatTotals = useMemo(() => {
    let boys = 0;
    let girls = 0;
    let other = 0;
    examSeats.forEach((s) => {
      const g = s.gender || studentGenderById.get(s.studentId) || 'other';
      if (g === 'male') boys += 1;
      else if (g === 'female') girls += 1;
      else other += 1;
    });
    return { total: examSeats.length, boys, girls, other };
  }, [examSeats, studentGenderById]);

  // Quick Roll / Name Search matches
  const searchMatches = useMemo(() => {
    const q = toAsciiDigits(searchQuery).toLowerCase().trim();
    if (!q) return [];
    return examSeats.filter((s) => {
      const rollA = toAsciiDigits(s.roll).toLowerCase();
      return (
        rollA === q ||
        rollA.includes(q) ||
        (s.studentName || '').toLowerCase().includes(q)
      );
    });
  }, [examSeats, searchQuery]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const toggleClassKey = (key: string) => {
    setSelectedClassKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const applyColumnPreset = (presetId: string) => {
    const preset = COLUMN_GENDER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const targetCols = preset.recommendedCols || builderCols;
    const nextRules = preset.build(targetCols);
    if (preset.recommendedCols && preset.recommendedCols !== builderCols) {
      setBuilderCols(preset.recommendedCols);
    }
    setGlobalColumnGenders(nextRules);
    setGenderMode('column_split');

    // Sync column rules onto currently selected rooms whose column count matches
    const updatedRooms = rooms.map((r) => {
      if (!selectedRoomIds.includes(r.id)) return r;
      const rulesForRoom = preset.build(r.cols);
      return { ...r, columnGenders: rulesForRoom };
    });
    examSeatPlanService.saveRooms(updatedRooms);
    setRooms(updatedRooms);
    showToast(`সারি প্রিসেট "${preset.label}" প্রয়োগ হয়েছে।`, 'info');
  };

  const cycleGlobalColumnRule = (colIdx: number) => {
    const next = globalColumnGenders.map((rule, idx) =>
      idx === colIdx ? NEXT_COL_RULE[rule] : rule
    );
    setGlobalColumnGenders(next);
    setGenderMode('column_split');

    // Also update selected rooms' columnGenders so WYSIWYG matches
    const updatedRooms = rooms.map((r) => {
      if (!selectedRoomIds.includes(r.id)) return r;
      const roomRules = Array.from(
        { length: r.cols },
        (_, i) => next[i] || r.columnGenders?.[i] || 'any'
      );
      return { ...r, columnGenders: roomRules };
    });
    examSeatPlanService.saveRooms(updatedRooms);
    setRooms(updatedRooms);
  };

  const handleBuildBatchRooms = (customCount?: number) => {
    const count = customCount ?? builderRoomCount;
    const generated = buildBatchRooms({
      count,
      startNo: builderStartNo,
      building: 'মূল ভবন',
      cols: builderCols,
      rows: builderRows,
      seatsPerBench: builderSeatsPerBench,
      columnGenders: globalColumnGenders,
    });
    examSeatPlanService.saveRooms(generated);
    setRooms(generated);
    setSelectedRoomIds(generated.map((r) => r.id));
    setBuilderRoomCount(generated.length);
    setActiveRoomFilter('all');
    showToast(
      `${toBanglaDigits(generated.length)}টি কক্ষ (${toBanglaDigits(builderCols)} সারি × ${toBanglaDigits(builderRows)} বেঞ্চ × ${toBanglaDigits(builderSeatsPerBench)} আসন) তৈরি হয়েছে!`,
      'success'
    );
  };

  const handleSyncAcademicRooms = () => {
    const beforeLen = rooms.length;
    const synced = examSeatPlanService.syncRoomsFromAcademicClasses(academicClasses, {
      cols: builderCols,
      rows: builderRows,
      seatsPerBench: builderSeatsPerBench,
      columnGenders: globalColumnGenders,
    });
    setRooms(synced);
    setSelectedRoomIds(synced.map((r) => r.id));
    const added = Math.max(0, synced.length - beforeLen);
    showToast(
      added > 0
        ? `শ্রেণি তালিকা থেকে নতুন ${toBanglaDigits(added)}টি কক্ষ সিংক করা হয়েছে!`
        : 'শ্রেণি তালিকার সব কক্ষ ইতিমধ্যেই যুক্ত আছে।',
      added > 0 ? 'success' : 'info'
    );
  };

  const openAddRoomModal = () => {
    setEditingRoomId(null);
    const nextNum = builderStartNo + rooms.length;
    setModalRoomNo(toBanglaDigits(nextNum));
    setModalRoomName(`কক্ষ নং ${toBanglaDigits(nextNum)} (মূল ভবন)`);
    setModalBuilding('মূল ভবন');
    setModalCols(builderCols);
    setModalRows(builderRows);
    setModalSeatsPerBench(builderSeatsPerBench);
    setModalColGenders([...globalColumnGenders]);
    setModalRoomGender('any');
    setShowRoomModal(true);
  };

  const openEditRoomModal = (room: ExamHallRoom) => {
    setEditingRoomId(room.id);
    setModalRoomNo(room.roomNo);
    setModalRoomName(room.roomName);
    setModalBuilding(room.building || 'মূল ভবন');
    setModalCols(room.cols);
    setModalRows(room.rows);
    setModalSeatsPerBench(room.seatsPerBench);
    setModalColGenders(getRoomColumnGenders(room, globalColumnGenders));
    setModalRoomGender(room.roomGender || 'any');
    setShowRoomModal(true);
  };

  const handleSaveRoomModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalRoomNo.trim() || !modalRoomName.trim()) {
      showToast('কক্ষ নম্বর ও নাম লিখুন।', 'error');
      return;
    }
    const safeCols = Math.min(6, Math.max(1, modalCols));
    const safeRows = Math.min(20, Math.max(1, modalRows));
    const normalizedRules: ColumnGenderRule[] = Array.from(
      { length: safeCols },
      (_, idx) => modalColGenders[idx] || 'any'
    );

    const rm: ExamHallRoom = {
      id: editingRoomId || `room-${Date.now()}`,
      roomNo: modalRoomNo.trim(),
      roomName: modalRoomName.trim(),
      building: modalBuilding.trim() || 'মূল ভবন',
      cols: safeCols,
      rows: safeRows,
      seatsPerBench: modalSeatsPerBench,
      columnGenders: normalizedRules,
      roomGender: modalRoomGender,
    };

    const next = examSeatPlanService.saveRoom(rm);
    setRooms(next);
    if (!editingRoomId) {
      setSelectedRoomIds((prev) => (prev.includes(rm.id) ? prev : [...prev, rm.id]));
    }
    setShowRoomModal(false);
    showToast(editingRoomId ? 'কক্ষের তথ্য আপডেট হয়েছে।' : 'নতুন পরীক্ষা কক্ষ যোগ হয়েছে!', 'success');
  };

  const handleDeleteRoom = async (room: ExamHallRoom) => {
    const ok = await confirmDialog({
      title: 'কক্ষ মুছে ফেলবেন?',
      message: `${room.roomName} তালিকা থেকে মুছে ফেলা হবে।`,
      confirmLabel: 'হ্যাঁ, মুছুন',
      danger: true,
    });
    if (!ok) return;
    const next = examSeatPlanService.deleteRoom(room.id);
    setRooms(next);
    setSelectedRoomIds((prev) => prev.filter((id) => id !== room.id));
    showToast('কক্ষ মুছে ফেলা হয়েছে।', 'info');
  };

  const handleGenerate = () => {
    if (!activeExam) {
      showToast('অন্তত একটি পরীক্ষা নির্বাচন করুন।', 'error');
      return;
    }
    if (selectedStudents.length === 0) {
      showToast('অন্তত একটি শ্রেণি নির্বাচন করুন যেখানে শিক্ষার্থী আছে।', 'warning');
      return;
    }
    if (selectedRoomIds.length === 0) {
      showToast('অন্তত একটি পরীক্ষা কক্ষ নির্বাচন করুন।', 'warning');
      return;
    }

    const res = examSeatPlanService.generateAdvancedSeatPlan({
      examId: activeExam.id,
      examTitle: activeExam.title,
      students: selectedStudents,
      roomIds: selectedRoomIds,
      genderMode,
      classDistribution,
      globalColumnGenders,
      fillOrder,
      strictGenderOverflow,
      strictAntiCheatSinglePerBench,
    });

    setLastResult(res);
    setActiveRoomFilter('all');
    setSelectedSwapSeatId(null);
    showToast(
      res.message,
      res.success ? (res.unassignedCount > 0 ? 'warning' : 'success') : 'error'
    );
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
    setLastResult(null);
    setSelectedSwapSeatId(null);
    showToast('আসন বিন্যাস মুছে ফেলা হয়েছে।', 'info');
    loadData();
  };

  const handleSeatClick = (seat: SeatPlanEntry) => {
    if (!swapMode || !activeExam) return;
    if (!selectedSwapSeatId) {
      setSelectedSwapSeatId(seat.id);
      return;
    }
    if (selectedSwapSeatId === seat.id) {
      setSelectedSwapSeatId(null);
      return;
    }
    const res = examSeatPlanService.swapSeats(activeExam.id, selectedSwapSeatId, seat.id);
    setSelectedSwapSeatId(null);
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success) loadData();
  };

  const handleAutoDuty = () => {
    if (!activeExam) return;
    const targetRoomIds =
      allRoomSummaries.length > 0
        ? allRoomSummaries.map((s) => s.roomId)
        : selectedRoomIds;
    const res = examSeatPlanService.autoAssignInvigilators({
      examId: activeExam.id,
      examTitle: activeExam.title,
      date: dutyDate,
      shift: dutyShift,
      roomIds: targetRoomIds,
      teachers,
      teachersPerRoom,
    });
    showToast(res.message, res.success ? 'success' : 'error');
    loadData();
  };

  const handleExportExcel = async () => {
    if (!activeExam || examSeats.length === 0) {
      showToast('এক্সপোর্ট করার জন্য আগে সিট প্ল্যান তৈরি করুন।', 'warning');
      return;
    }
    await exportSeatPlanToExcel({
      examTitle: activeExam.title,
      schoolName: settings?.schoolName || 'স্মার্ট স্কুল',
      entries: examSeats,
      summaries: allRoomSummaries,
      studentGenderById,
    });
    showToast('Excel ফাইল ডাউনলোড শুরু হয়েছে!', 'success');
  };

  const effectivePrintOrientation =
    activeTab === 'hall_map' ? hallMapOrientation : 'portrait';

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 pb-10 print:bg-white print:pb-0">
      {/* Dynamic Print CSS (plain <style>, never <style jsx global>) */}
      <style>{`
        @media print {
          @page {
            size: A4 ${effectivePrintOrientation};
            margin: 8mm;
          }
          body {
            background: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .seat-print-break {
            break-after: page;
            page-break-after: always;
          }
          .seat-print-last {
            break-after: auto;
            page-break-after: auto;
          }
          .seat-avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* SINGLE-ROW FLUSH STICKY SUB-HEADER (h-14, print:hidden) */}
      <div className="sticky top-0 z-30 h-auto min-h-[3.5rem] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2.5 print:hidden">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="hidden md:flex items-center gap-2 pr-2.5 mr-1 border-r border-slate-200 dark:border-slate-800 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#0B5D3B] text-white flex items-center justify-center shadow-xs">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
              আসন বিন্যাস স্টুডিও
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            {(
              [
                { id: 'hall_map', label: 'সেটআপ ও হল ম্যাপ', icon: LayoutGrid },
                { id: 'door_notice', label: 'দরজার নোটিশ', icon: DoorOpen },
                { id: 'bench_stickers', label: 'বেঞ্চ স্টিকার', icon: Scissors },
                { id: 'top_sheet', label: 'হাজিরা টপশিট', icon: ClipboardCheck },
                { id: 'invigilators', label: 'পরিদর্শক ডিউটি', icon: UserCheck },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition ${
                    isActive
                      ? 'bg-[#0B5D3B] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <select
            aria-label="পরীক্ষা নির্বাচন"
            value={activeExam?.id || ''}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="max-w-[190px] sm:max-w-[230px] px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white truncate"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>

          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-black">
            <button
              type="button"
              onClick={() => setPrintLang('bn')}
              className={`px-2 py-1 rounded-lg cursor-pointer transition ${
                printLang === 'bn'
                  ? 'bg-[#0B5D3B] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => setPrintLang('en')}
              className={`px-2 py-1 rounded-lg cursor-pointer transition ${
                printLang === 'en'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              English
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={examSeats.length === 0}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-45 text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            type="button"
            onClick={() =>
              triggerProfessionalPrint([
                printLang === 'en' ? 'Seat Plan' : 'পরীক্ষার সিট প্ল্যান',
                activeExam?.title || 'Exam',
                activeTab,
              ])
            }
            className="px-3.5 py-1.5 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট / PDF</span>
          </button>
        </div>
      </div>

      {/* MAIN STUDIO WORKSPACE */}
      <div className="p-3 sm:p-5 print:p-0">
        {activeTab === 'hall_map' && (
          <div className="flex flex-col xl:flex-row gap-5 items-start print:block">
            {/* LEFT SETUP PANE (hidden on print) */}
            <div className="w-full xl:w-[410px] shrink-0 space-y-4 print:hidden">
              {/* STEP 1: LIVE CLASS & STUDENT SYNC */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-[#0B5D3B] text-white text-[10px] flex items-center justify-center">
                        ১
                      </span>
                      শ্রেণি ও শিক্ষার্থী তালিকা সিংক
                    </h2>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      লাইভ তালিকা: মোট {toBanglaDigits(students.length)} জন শিক্ষার্থী
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadData}
                    title="তালিকা রিফ্রেশ করুন"
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Class Group Toggles */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedClassKeys(
                        liveClassGroups.filter((g) => g.total > 0).map((g) => g.key)
                      )
                    }
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10.5px] font-black text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    সব শ্রেণি
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedClassKeys(['6th', '7th', '8th'])}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10.5px] font-black text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    ৬ষ্ঠ–৮ম
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedClassKeys(
                        liveClassGroups
                          .filter((g) => g.gradeKey === '9th' || g.gradeKey === '10th')
                          .map((g) => g.key)
                      )
                    }
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10.5px] font-black text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    ৯ম–১০ম
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedClassKeys([])}
                    className="px-2 py-1 rounded-lg text-[10.5px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer ml-auto"
                  >
                    বাতিল
                  </button>
                </div>

                {/* Multi-select Class Checklist */}
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {liveClassGroups.map((bucket) => {
                    const checked = selectedClassKeys.includes(bucket.key);
                    return (
                      <label
                        key={bucket.key}
                        className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border text-xs cursor-pointer transition ${
                          checked
                            ? 'bg-[#0B5D3B]/5 dark:bg-emerald-950/40 border-[#0B5D3B]/40 dark:border-emerald-700'
                            : 'bg-slate-50/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleClassKey(bucket.key)}
                            className="rounded accent-[#0B5D3B] w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className="font-black text-slate-900 dark:text-white truncate">
                            {bucket.shortBadge}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 text-[10px] font-black">
                          <span className="px-1.5 py-0.5 rounded bg-sky-100/80 dark:bg-sky-900/50 text-sky-800 dark:text-sky-200">
                            ছা: {toBanglaDigits(bucket.boys)}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-rose-100/80 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200">
                            ছাত্রী: {toBanglaDigits(bucket.girls)}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {toBanglaDigits(bucket.total)}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Optional Roll Range Filter */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">
                      রোল হতে (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      value={rollFrom}
                      onChange={(e) => setRollFrom(e.target.value)}
                      placeholder="যেমন: ১"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">
                      রোল পর্যন্ত (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      value={rollTo}
                      onChange={(e) => setRollTo(e.target.value)}
                      placeholder="যেমন: ৫০"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {capacityForecast.otherNeeded > 0 && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] font-bold text-amber-800 dark:text-amber-200">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      নির্বাচিত তালিকায় {toBanglaDigits(capacityForecast.otherNeeded)} জন শিক্ষার্থীর লিঙ্গ (ছাত্র/ছাত্রী) নির্ধারিত নেই। শিক্ষার্থী প্রোফাইলে লিঙ্গ আপডেট করলে সারিভিত্তিক বণ্টন আরও নিখুঁত হবে।
                    </span>
                  </div>
                )}
              </div>

              {/* STEP 2: ROOM COUNT & BENCH BUILDER */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-[#0B5D3B] text-white text-[10px] flex items-center justify-center">
                      ২
                    </span>
                    কক্ষ সংখ্যা, সারি ও বেঞ্চ সেটআপ
                  </h2>
                  <button
                    type="button"
                    onClick={openAddRoomModal}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10.5px] font-black text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> কক্ষ যোগ
                  </button>
                </div>

                {/* Quick Batch Generator Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">
                      কক্ষ সংখ্যা
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={builderRoomCount}
                      onChange={(e) => setBuilderRoomCount(Math.max(1, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">
                      শুরুর রুম নং
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={builderStartNo}
                      onChange={(e) => setBuilderStartNo(Math.max(1, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">
                      সারি (কলাম)
                    </label>
                    <select
                      value={builderCols}
                      onChange={(e) => setBuilderCols(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black text-slate-900 dark:text-white"
                    >
                      {[1, 2, 3, 4, 5].map((c) => (
                        <option key={c} value={c}>
                          {toBanglaDigits(c)} সারি
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">
                      প্রতি সারিতে বেঞ্চ
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={builderRows}
                      onChange={(e) => setBuilderRows(Math.max(1, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">
                      বেঞ্চ প্রতি আসন
                    </label>
                    <select
                      value={builderSeatsPerBench}
                      onChange={(e) =>
                        setBuilderSeatsPerBench(Number(e.target.value) as 1 | 2 | 3)
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black text-slate-900 dark:text-white"
                    >
                      <option value={1}>১ জন</option>
                      <option value={2}>২ জন (বাম/ডান)</option>
                      <option value={3}>৩ জন (বাম/মাঝ/ডান)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleBuildBatchRooms()}
                    className="flex-1 px-2.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 text-[11px] font-black cursor-pointer transition"
                  >
                    {toBanglaDigits(builderRoomCount)}টি কক্ষ সেট করুন
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleBuildBatchRooms(capacityForecast.recommendedRoomCount)
                    }
                    className="px-2.5 py-2 rounded-xl bg-[#0B5D3B]/10 dark:bg-emerald-950/60 hover:bg-[#0B5D3B]/20 text-[#0B5D3B] dark:text-emerald-300 border border-[#0B5D3B]/25 text-[11px] font-black flex items-center gap-1 cursor-pointer transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    অটো ({toBanglaDigits(capacityForecast.recommendedRoomCount)} কক্ষ)
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncAcademicRooms}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-black text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <Building2 className="w-3.5 h-3.5" /> শ্রেণি তালিকা থেকে কক্ষ সিংক করুন
                  </button>
                </div>

                {/* Selected Rooms List */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {rooms.map((rm) => {
                    const checked = selectedRoomIds.includes(rm.id);
                    const cap = getRoomCapacity(rm);
                    const colRules = getRoomColumnGenders(rm, globalColumnGenders);
                    return (
                      <div
                        key={rm.id}
                        className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border text-xs transition ${
                          checked
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-[#0B5D3B]/40 dark:border-emerald-800'
                            : 'bg-slate-50/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 opacity-70'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedRoomIds((prev) =>
                              checked ? prev.filter((id) => id !== rm.id) : [...prev, rm.id]
                            )
                          }
                          className="flex items-center gap-2 text-left min-w-0 flex-1 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            readOnly
                            checked={checked}
                            className="rounded accent-[#0B5D3B] w-3.5 h-3.5 pointer-events-none"
                          />
                          <div className="min-w-0">
                            <div className="font-black text-slate-900 dark:text-white truncate">
                              কক্ষ {rm.roomNo} · {toBanglaDigits(cap)} আসন
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 flex-wrap">
                              <span>
                                {toBanglaDigits(rm.cols)} সারি × {toBanglaDigits(rm.rows)} বেঞ্চ
                              </span>
                              <span>•</span>
                              <span>
                                {colRules.map((r) => (r === 'male' ? 'ছা' : r === 'female' ? 'ছী' : 'মি')).join('|')}
                              </span>
                            </div>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditRoomModal(rm)}
                            title="কক্ষ এডিট"
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoom(rm)}
                            title="কক্ষ মুছুন"
                            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: GENDER, COLUMN & ANTI-CHEAT RULES */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-2xs">
                <h2 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-[#0B5D3B] text-white text-[10px] flex items-center justify-center">
                    ৩
                  </span>
                  ছাত্র-ছাত্রী ও সারি বিন্যাস (Gender & Anti-Cheat)
                </h2>

                {/* 5 Gender Mode Selector */}
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'column_split', label: 'সারিভিত্তিক (ছাত্র/ছাত্রী)' },
                      { id: 'separate_rooms', label: 'ছাত্র-ছাত্রী আলাদা কক্ষ' },
                      { id: 'boys_only', label: 'শুধু ছাত্র (আলাদা)' },
                      { id: 'girls_only', label: 'শুধু ছাত্রী (আলাদা)' },
                      { id: 'combined', label: 'ছাত্র-ছাত্রী একসাথে (মিশ্র)' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setGenderMode(m.id)}
                      className={`px-2.5 py-2 rounded-xl border text-[11px] font-black text-left cursor-pointer transition ${
                        m.id === 'combined' ? 'col-span-2 text-center' : ''
                      } ${
                        genderMode === m.id
                          ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Column-wise Interactive Configurator */}
                {genderMode === 'column_split' && (
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                        প্রতি সারির লিঙ্গ নির্বাচন (ক্লিকে বদলান):
                      </span>
                    </div>

                    {/* Interactive Column Pills */}
                    <div
                      className="grid gap-1.5"
                      style={{
                        gridTemplateColumns: `repeat(${globalColumnGenders.length}, minmax(0, 1fr))`,
                      }}
                    >
                      {globalColumnGenders.map((rule, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => cycleGlobalColumnRule(idx)}
                          className={`px-2 py-2 rounded-xl border text-center cursor-pointer transition hover:scale-[1.02] ${COL_PILL_STYLE[rule]}`}
                        >
                          <div className="text-[10px] font-bold opacity-80">
                            সারি {toBanglaDigits(idx + 1)}
                          </div>
                          <div className="text-xs font-black mt-0.5">
                            {formatGenderRuleBn(rule)}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* 1-Click Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {COLUMN_GENDER_PRESETS.slice(0, 3).map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyColumnPreset(preset.id)}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#0B5D3B] text-[10px] font-black text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          {preset.shortLabel}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Anti-Cheat Class Distribution */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">
                      শ্রেণি বিন্যাস (Anti-Cheat)
                    </label>
                    <select
                      value={classDistribution}
                      onChange={(e) =>
                        setClassDistribution(e.target.value as ClassDistributionMode)
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="anti_cheat_bench">অ্যান্টি-চিট (ভিন্ন শ্রেণি এক বেঞ্চে)</option>
                      <option value="sequential">ধারাবাহিক শ্রেণি</option>
                      <option value="anti_cheat_alternate">রাউন্ড-রবিন মিশ্র</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">
                      রোল ভরার দিক
                    </label>
                    <select
                      value={fillOrder}
                      onChange={(e) => setFillOrder(e.target.value as SeatFillOrder)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="column_first">সারি ধরে সামনে→পেছনে</option>
                      <option value="row_first">আড়াআড়ি বেঞ্চ সারি</option>
                    </select>
                  </div>
                </div>

                {/* Extra Safety Toggles */}
                <div className="space-y-1.5 pt-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={strictAntiCheatSinglePerBench}
                      onChange={(e) => setStrictAntiCheatSinglePerBench(e.target.checked)}
                      className="rounded accent-[#0B5D3B]"
                    />
                    <span>একই শ্রেণির ২ জন এক বেঞ্চে বসবে না (কঠোর অ্যান্টি-চিট)</span>
                  </label>
                  {genderMode === 'column_split' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!strictGenderOverflow}
                        onChange={(e) => setStrictGenderOverflow(!e.target.checked)}
                        className="rounded accent-[#0B5D3B]"
                      />
                      <span>খালি আসন থাকলে অন্য লিঙ্গের বাকি শিক্ষার্থী বসাও</span>
                    </label>
                  )}
                </div>

                {/* Live Capacity Forecast Card */}
                <div
                  className={`rounded-xl p-3 border text-xs space-y-1.5 ${
                    capacityForecast.shortfallTotal > 0
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100'
                      : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                  }`}
                >
                  <div className="flex items-center justify-between font-black">
                    <span className="flex items-center gap-1.5">
                      {capacityForecast.shortfallTotal > 0 ? (
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-[#0B5D3B] dark:text-emerald-400" />
                      )}
                      লাইভ আসন পূর্বাভাস
                    </span>
                    <span>
                      {toBanglaDigits(capacityForecast.totalStudents)} জন /{' '}
                      {toBanglaDigits(capacityForecast.totalSeats)} আসন
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                    <span>
                      ছাত্র: {toBanglaDigits(capacityForecast.boysNeeded)} (আসন:{' '}
                      {toBanglaDigits(capacityForecast.maleSeats + capacityForecast.anySeats)})
                    </span>
                    <span>•</span>
                    <span>
                      ছাত্রী: {toBanglaDigits(capacityForecast.girlsNeeded)} (আসন:{' '}
                      {toBanglaDigits(capacityForecast.femaleSeats + capacityForecast.anySeats)})
                    </span>
                  </div>
                  {capacityForecast.shortfallTotal > 0 && (
                    <div className="text-[11px] font-black text-amber-800 dark:text-amber-300">
                      ঘাটতি: মোট {toBanglaDigits(capacityForecast.shortfallTotal)} জন (ছাত্র{' '}
                      {toBanglaDigits(capacityForecast.shortfallBoys)}, ছাত্রী{' '}
                      {toBanglaDigits(capacityForecast.shortfallGirls)}) — সব শিক্ষার্থীর জন্য{' '}
                      {toBanglaDigits(capacityForecast.recommendedRoomCount)}টি কক্ষ প্রয়োজন।
                    </div>
                  )}
                </div>

                {/* Primary Generate & Clear CTA */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition"
                  >
                    <Wand2 className="w-4 h-4" /> সিট প্ল্যান তৈরি করুন
                  </button>
                  {examSeats.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-black flex items-center gap-1 cursor-pointer transition"
                    >
                      <Trash2 className="w-4 h-4" /> মুছুন
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT VISUAL ROOM MAP WORKSPACE */}
            <div className="flex-1 min-w-0 w-full space-y-4">
              {/* Top KPI Strip (print:hidden) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5">
                  <div className="text-[11px] font-bold text-slate-500">মোট বণ্টিত আসন</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {toBanglaDigits(seatTotals.total)} জন
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5">
                  <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400">ছাত্র</div>
                  <div className="text-xl font-black text-sky-900 dark:text-sky-100 mt-0.5">
                    {toBanglaDigits(seatTotals.boys)} জন
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5">
                  <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400">ছাত্রী</div>
                  <div className="text-xl font-black text-rose-900 dark:text-rose-100 mt-0.5">
                    {toBanglaDigits(seatTotals.girls)} জন
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5">
                  <div className="text-[11px] font-bold text-slate-500">ব্যবহৃত কক্ষ</div>
                  <div className="text-xl font-black text-[#0B5D3B] dark:text-emerald-400 mt-0.5">
                    {toBanglaDigits(allRoomSummaries.length)} টি
                  </div>
                </div>
              </div>

              {/* Unassigned Warning Banner if last run had overflow */}
              {lastResult && lastResult.unassignedCount > 0 && (
                <div className="print:hidden bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-amber-950 dark:text-amber-100">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      আসন স্বল্পতার কারণে {toBanglaDigits(lastResult.unassignedCount)} জন শিক্ষার্থী (ছাত্র{' '}
                      {toBanglaDigits(lastResult.unassignedBoys)}, ছাত্রী{' '}
                      {toBanglaDigits(lastResult.unassignedGirls)}) বণ্টন বাকি আছে। বাম পাশের &ldquo;অটো কক্ষ&rdquo; বাটনে ক্লিক করে আবার জেনারেট করুন।
                    </span>
                  </div>
                </div>
              )}

              {/* Map Controls Bar (Room filter + Search + Swap + Print orientation) */}
              {examSeats.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-2.5 print:hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Room Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveRoomFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer transition ${
                          activeRoomFilter === 'all'
                            ? 'bg-[#0B5D3B] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        সব কক্ষ ({toBanglaDigits(allRoomSummaries.length)})
                      </button>
                      {allRoomSummaries.map((rm) => (
                        <button
                          key={rm.roomId}
                          type="button"
                          onClick={() => setActiveRoomFilter(rm.roomId)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer transition ${
                            activeRoomFilter === rm.roomId
                              ? 'bg-[#0B5D3B] text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          কক্ষ {rm.roomNo} ({toBanglaDigits(rm.totalAssigned)})
                        </button>
                      ))}
                    </div>

                    {/* Swap Mode & Print Orientation */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSwapMode((prev) => !prev);
                          setSelectedSwapSeatId(null);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 border cursor-pointer transition ${
                          swapMode
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        {swapMode ? 'অদল-বদল চালু' : 'আসন অদল-বদল'}
                      </button>

                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-black">
                        <button
                          type="button"
                          onClick={() => setHallMapOrientation('landscape')}
                          className={`px-2 py-1 rounded-md cursor-pointer ${
                            hallMapOrientation === 'landscape'
                              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                              : 'text-slate-500'
                          }`}
                        >
                          Landscape
                        </button>
                        <button
                          type="button"
                          onClick={() => setHallMapOrientation('portrait')}
                          className={`px-2 py-1 rounded-md cursor-pointer ${
                            hallMapOrientation === 'portrait'
                              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                              : 'text-slate-500'
                          }`}
                        >
                          Portrait
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Student Finder */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="রোল নম্বর বা নাম দিয়ে আসন খুঁজুন (যেমন: ১৫ বা রহিম)..."
                        className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {searchQuery.trim() && (
                      <div className="text-xs font-bold text-[#0B5D3B] dark:text-emerald-400">
                        {searchMatches.length === 0
                          ? 'কোনো আসন পাওয়া যায়নি'
                          : searchMatches
                              .slice(0, 2)
                              .map(
                                (m) =>
                                  `রোল ${toBanglaDigits(m.roll)} (${m.studentName}) → কক্ষ ${m.roomNo}, সারি ${toBanglaDigits(m.colIndex)}, বেঞ্চ #${toBanglaDigits(m.benchNo)}`
                              )
                              .join(' • ')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Empty State OR Visual Room Map */}
              {examSeats.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3 print:hidden">
                  <div className="w-14 h-14 rounded-2xl bg-[#0B5D3B]/10 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <Users className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    এখনো কোনো সিট প্ল্যান তৈরি করা হয়নি
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto">
                    বাম পাশ থেকে শ্রেণি, কক্ষ ও বেঞ্চ সংখ্যা এবং ছাত্র/ছাত্রী সারি বিন্যাস (যেমন: ১ সারিতে ছাত্র ও বাকি ২ সারিতে ছাত্রী) নির্বাচন করে{' '}
                    <span className="text-[#0B5D3B] dark:text-emerald-400 font-black">
                      &ldquo;সিট প্ল্যান তৈরি করুন&rdquo;
                    </span>{' '}
                    বাটনে ক্লিক করুন।
                  </p>
                </div>
              ) : (
                <SeatPlanRoomMap
                  summaries={visibleRoomSummaries}
                  entriesByRoom={entriesByRoom}
                  roomsById={roomsById}
                  studentGenderById={studentGenderById}
                  globalColumnGenders={globalColumnGenders}
                  settings={settings}
                  examTitle={activeExam?.title || 'পরীক্ষা'}
                  searchQuery={searchQuery}
                  swapMode={swapMode}
                  selectedSwapSeatId={selectedSwapSeatId}
                  onSeatClick={handleSeatClick}
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DOOR NOTICE SHEET */}
        {activeTab === 'door_notice' && (
          <div className="max-w-5xl mx-auto space-y-4 print:max-w-none">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveRoomFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer ${
                    activeRoomFilter === 'all'
                      ? 'bg-[#0B5D3B] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  সব কক্ষ ({toBanglaDigits(allRoomSummaries.length)})
                </button>
                {allRoomSummaries.map((rm) => (
                  <button
                    key={rm.roomId}
                    type="button"
                    onClick={() => setActiveRoomFilter(rm.roomId)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer ${
                      activeRoomFilter === rm.roomId
                        ? 'bg-[#0B5D3B] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    কক্ষ {rm.roomNo}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs font-black">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setDoorCardsPerPage(1)}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    doorCardsPerPage === 1
                      ? 'bg-[#0B5D3B] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  ১ নোটিশ / পাতা
                </button>
                <button
                  type="button"
                  onClick={() => setDoorCardsPerPage(2)}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    doorCardsPerPage === 2
                      ? 'bg-[#0B5D3B] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  ২ নোটিশ / পাতা
                </button>
              </div>
            </div>

            {visibleRoomSummaries.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-800">
                দরজার নোটিশ দেখতে প্রথমে &ldquo;সেটআপ ও হল ম্যাপ&rdquo; ট্যাব থেকে সিট প্ল্যান তৈরি করুন।
              </div>
            ) : (
              <DoorNoticePrintView
                summaries={visibleRoomSummaries}
                settings={settings}
                examTitle={activeExam?.title || 'পরীক্ষা'}
                cardsPerPage={doorCardsPerPage}
                docLang={printLang}
              />
            )}
          </div>
        )}

        {/* TAB 3: BENCH STICKERS */}
        {activeTab === 'bench_stickers' && (
          <div className="max-w-6xl mx-auto space-y-4 print:max-w-none">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveRoomFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer ${
                    activeRoomFilter === 'all'
                      ? 'bg-[#0B5D3B] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  সব কক্ষ
                </button>
                {allRoomSummaries.map((rm) => (
                  <button
                    key={rm.roomId}
                    type="button"
                    onClick={() => setActiveRoomFilter(rm.roomId)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer ${
                      activeRoomFilter === rm.roomId
                        ? 'bg-[#0B5D3B] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    কক্ষ {rm.roomNo}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setStickerMode('per_bench')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    stickerMode === 'per_bench'
                      ? 'bg-[#0B5D3B] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  প্রতি বেঞ্চে ১ স্টিকার
                </button>
                <button
                  type="button"
                  onClick={() => setStickerMode('per_seat')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    stickerMode === 'per_seat'
                      ? 'bg-[#0B5D3B] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  প্রতি শিক্ষার্থীর আলাদা স্টিকার
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                {(Object.keys(STICKER_DENSITY_SPECS) as StickerDensityId[]).map((dId) => {
                  const spec = STICKER_DENSITY_SPECS[dId];
                  const active = stickerDensity === dId;
                  return (
                    <button
                      key={dId}
                      type="button"
                      onClick={() => {
                        setStickerDensity(dId);
                        setStickerCols(3);
                      }}
                      className={`px-2 py-1 rounded-lg cursor-pointer transition ${
                        active
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {spec.labelBn}
                    </button>
                  );
                })}
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  type="button"
                  onClick={() => setStickerCols(2)}
                  className={`px-2 py-1 rounded-lg cursor-pointer ${
                    stickerCols === 2
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  ২ কলাম
                </button>
                <button
                  type="button"
                  onClick={() => setStickerCols(3)}
                  className={`px-2 py-1 rounded-lg cursor-pointer ${
                    stickerCols === 3
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  ৩ কলাম
                </button>
              </div>
            </div>

            {visibleRoomSummaries.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-800">
                বেঞ্চ স্টিকার দেখতে প্রথমে সিট প্ল্যান তৈরি করুন।
              </div>
            ) : (
              <BenchStickersPrintView
                summaries={visibleRoomSummaries}
                entriesByRoom={entriesByRoom}
                studentGenderById={studentGenderById}
                settings={settings}
                examTitle={activeExam?.title || 'পরীক্ষা'}
                stickerMode={stickerMode}
                columnsPerRow={stickerCols}
                stickerDensity={stickerDensity}
                docLang={printLang}
              />
            )}
          </div>
        )}

        {/* TAB 4: ATTENDANCE TOP SHEET */}
        {activeTab === 'top_sheet' && (
          <div className="max-w-5xl mx-auto space-y-4 print:max-w-none">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 flex flex-wrap items-center gap-1.5 print:hidden">
              <button
                type="button"
                onClick={() => setActiveRoomFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer ${
                  activeRoomFilter === 'all'
                    ? 'bg-[#0B5D3B] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                সব কক্ষ ({toBanglaDigits(allRoomSummaries.length)})
              </button>
              {allRoomSummaries.map((rm) => (
                <button
                  key={rm.roomId}
                  type="button"
                  onClick={() => setActiveRoomFilter(rm.roomId)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer ${
                    activeRoomFilter === rm.roomId
                      ? 'bg-[#0B5D3B] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  কক্ষ {rm.roomNo}
                </button>
              ))}
            </div>

            {visibleRoomSummaries.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-800">
                হাজিরা টপশিট দেখতে প্রথমে সিট প্ল্যান তৈরি করুন।
              </div>
            ) : (
              <AttendanceTopSheetPrintView
                summaries={visibleRoomSummaries}
                entriesByRoom={entriesByRoom}
                studentGenderById={studentGenderById}
                settings={settings}
                examTitle={activeExam?.title || 'পরীক্ষা'}
                docLang={printLang}
              />
            )}
          </div>
        )}

        {/* TAB 5: INVIGILATOR DUTY ROSTER */}
        {activeTab === 'invigilators' && (
          <div className="max-w-5xl mx-auto print:max-w-none">
            <InvigilatorDutyPrintView
              duties={examDuties}
              rooms={selectedRooms}
              summariesByRoomId={summariesByRoomId}
              settings={settings}
              examTitle={activeExam?.title || 'পরীক্ষা'}
              dutyDate={dutyDate}
              setDutyDate={setDutyDate}
              dutyShift={dutyShift}
              setDutyShift={setDutyShift}
              teachersPerRoom={teachersPerRoom}
              setTeachersPerRoom={setTeachersPerRoom}
              onAutoAssign={handleAutoDuty}
              docLang={printLang}
            />
          </div>
        )}
      </div>

      {/* ADD / EDIT ROOM MODAL */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <form
            onSubmit={handleSaveRoomModal}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {editingRoomId ? 'পরীক্ষা কক্ষ এডিট করুন' : 'নতুন পরীক্ষা কক্ষ যোগ করুন'}
              </h3>
              <button
                type="button"
                onClick={() => setShowRoomModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 mb-1">
                  কক্ষ নং
                </label>
                <input
                  value={modalRoomNo}
                  onChange={(e) => setModalRoomNo(e.target.value)}
                  placeholder="যেমন: ১০৪"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 mb-1">
                  ভবন / ব্লক
                </label>
                <input
                  value={modalBuilding}
                  onChange={(e) => setModalBuilding(e.target.value)}
                  placeholder="মূল ভবন"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 mb-1">
                কক্ষের নাম
              </label>
              <input
                value={modalRoomName}
                onChange={(e) => setModalRoomName(e.target.value)}
                placeholder="যেমন: কক্ষ নং ১০৪ (মূল ভবন)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 mb-1">
                  সারি (Cols)
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={modalCols}
                  onChange={(e) => {
                    const nextCols = Math.min(6, Math.max(1, Number(e.target.value)));
                    setModalCols(nextCols);
                    setModalColGenders((prev) =>
                      Array.from({ length: nextCols }, (_, i) => prev[i] || 'any')
                    );
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 mb-1">
                  বেঞ্চ / সারি
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={modalRows}
                  onChange={(e) => setModalRows(Math.min(20, Math.max(1, Number(e.target.value))))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 mb-1">
                  আসন / বেঞ্চ
                </label>
                <select
                  value={modalSeatsPerBench}
                  onChange={(e) =>
                    setModalSeatsPerBench(Number(e.target.value) as 1 | 2 | 3)
                  }
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value={1}>১ জন</option>
                  <option value={2}>২ জন</option>
                  <option value={3}>৩ জন</option>
                </select>
              </div>
            </div>

            {/* Per-column gender editor for this room */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300">
                এই কক্ষের সারিভিত্তিক ছাত্র/ছাত্রী নিয়ম (ক্লিকে বদলান):
              </label>
              <div
                className="grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${modalCols}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: modalCols }, (_, idx) => {
                  const rule = modalColGenders[idx] || 'any';
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setModalColGenders((prev) =>
                          Array.from({ length: modalCols }, (_, i) =>
                            i === idx ? NEXT_COL_RULE[prev[i] || 'any'] : prev[i] || 'any'
                          )
                        )
                      }
                      className={`px-2 py-1.5 rounded-xl border text-center text-[11px] font-black cursor-pointer ${COL_PILL_STYLE[rule]}`}
                    >
                      সারি {toBanglaDigits(idx + 1)}: {formatGenderRuleBn(rule)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 mb-1">
                আলাদা কক্ষ মোডের জন্য নির্ধারিত লিঙ্গ (ঐচ্ছিক)
              </label>
              <select
                value={modalRoomGender}
                onChange={(e) => setModalRoomGender(e.target.value as ColumnGenderRule)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="any">স্বয়ংক্রিয় (যেকোনো)</option>
                <option value="male">শুধু ছাত্রদের কক্ষ</option>
                <option value="female">শুধু ছাত্রীদের কক্ষ</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-black text-slate-500">
                মোট আসন: {toBanglaDigits(modalCols * modalRows * modalSeatsPerBench)} টি
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-xs font-black cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
