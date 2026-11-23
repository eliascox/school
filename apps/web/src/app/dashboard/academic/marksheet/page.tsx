'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Printer,
  Search,
  CheckCircle2,
  XCircle,
  UserX,
  Upload,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Layers,
  FileText,
  Palette,
  QrCode,
  Droplets,
  CheckSquare,
  Square,
  X,
  Sparkles,
} from 'lucide-react';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { examService, ExamItem } from '@/services/examService';
import {
  MarksheetSheetCard,
  MARKSHEET_A4_PRINT_STYLES,
  generateStudentMarksheetData,
  getStudentsForClassSectionGroup,
} from '@/components/OfficialMarksheetSheet';
import { toBanglaDigits } from '@/lib/omr/omrTemplates';
import {
  MARKSHEET_BORDER_PRESETS,
  MarksheetBatchFilterMode,
  MarksheetBorderPreset,
  MarksheetStatusFilter,
  evaluateClassMarksheetsWithMerit,
  filterMarksheetBatchStudents,
  filterMarksheetDirectory,
  formatMeritPositionBn,
  resolveBranchForGradeAndGroup,
} from '@/lib/marksheetStudioUtils';
import { showToast } from '@/components/ui/ToastProvider';

type StudioTab = 'single' | 'batch';

const GRADES_LIST: Array<{ id: '6th' | '7th' | '8th' | '9th' | '10th'; shortBn: string; labelBn: string }> = [
  { id: '6th', shortBn: '৬ষ্ঠ', labelBn: '৬ষ্ঠ শ্রেণি' },
  { id: '7th', shortBn: '৭ম', labelBn: '৭ম শ্রেণি' },
  { id: '8th', shortBn: '৮ম', labelBn: '৮ম শ্রেণি' },
  { id: '9th', shortBn: '৯ম', labelBn: '৯ম শ্রেণি' },
  { id: '10th', shortBn: '১০ম', labelBn: '১০ম শ্রেণি' },
];

const SECTIONS_6_8 = ['A', 'B', 'C'];
const GROUPS_9_10: Array<{ groupBn: 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা'; branch: string; shortBn: string }> = [
  { groupBn: 'বিজ্ঞান', branch: 'Science', shortBn: 'বিজ্ঞান' },
  { groupBn: 'মানবিক', branch: 'Humanities', shortBn: 'মানবিক' },
  { groupBn: 'ব্যবসায় শিক্ষা', branch: 'Commerce', shortBn: 'ব্যবসায়' },
];

const FALLBACK_EXAMS = [
  'অর্ধ-বার্ষিক পরীক্ষা ২০২৬',
  'বার্ষিক পরীক্ষা ২০২৬',
  'এসএসসি প্রাক-নির্বাচনী পরীক্ষা ২০২৬',
  'এসএসসি নির্বাচনী (টেস্ট) পরীক্ষা ২০২৬',
];

const BORDER_PRESET_KEY = 'sms_marksheet_border_preset';
const WATERMARK_TOGGLE_KEY = 'sms_marksheet_show_watermark';
const QR_TOGGLE_KEY = 'sms_marksheet_show_qr';

export default function AcademicMarksheetPage() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [exams, setExams] = useState<ExamItem[]>([]);

  // Studio Tab & Design Drawer
  const [activeTab, setActiveTab] = useState<StudioTab>('single');
  const [showDesignDrawer, setShowDesignDrawer] = useState(false);

  // Scope Filters (Class 9–10 Group <-> Branch strictly auto-synced!)
  const [selectedExam, setSelectedExam] = useState<string>(FALLBACK_EXAMS[0]);
  const [selectedGrade, setSelectedGrade] = useState<'6th' | '7th' | '8th' | '9th' | '10th'>('8th');
  const [selectedBranch, setSelectedBranch] = useState<string>('A');
  const [selectedGroup, setSelectedGroup] = useState<string>('সাধারণ');

  // Directory Search, Status Filter, Active Student & Checkbox Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MarksheetStatusFilter>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [checkedStudentIds, setCheckedStudentIds] = useState<string[]>([]);

  // Selective Batch Print Controls
  const [batchFilterMode, setBatchFilterMode] = useState<MarksheetBatchFilterMode>('all');
  const [rollRangeFrom, setRollRangeFrom] = useState<string>('1');
  const [rollRangeTo, setRollRangeTo] = useState<string>('20');

  // Border Preset, Custom PNG Border, Watermark & QR Toggles
  const [borderPreset, setBorderPreset] = useState<MarksheetBorderPreset>('emerald_gold');
  const [borderImageUrl, setBorderImageUrl] = useState<string>('');
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [showQrCode, setShowQrCode] = useState<boolean>(true);

  const borderFileInputRef = useRef<HTMLInputElement | null>(null);

  // Boot live settings, exams & persisted design preferences
  useEffect(() => {
    setMounted(true);
    const initialSettings = settingsService.getSettings();
    setSettings(initialSettings);

    const activeExams = examService.getActiveExams();
    setExams(activeExams);
    if (activeExams.length > 0) {
      setSelectedExam(activeExams[0].title);
    }

    if (typeof window !== 'undefined') {
      const savedPng = localStorage.getItem('sms_marksheet_border_png');
      const cleared = localStorage.getItem('sms_marksheet_border_cleared');
      if (savedPng) {
        setBorderImageUrl(savedPng);
      } else if (!cleared && initialSettings?.customBorderPng) {
        setBorderImageUrl(initialSettings.customBorderPng);
      }

      const savedPreset = localStorage.getItem(BORDER_PRESET_KEY) as MarksheetBorderPreset | null;
      if (
        savedPreset &&
        ['classic_double', 'emerald_gold', 'royal_navy', 'minimal', 'custom_png'].includes(savedPreset)
      ) {
        setBorderPreset(savedPreset);
      } else if (savedPng || (!cleared && initialSettings?.customBorderPng)) {
        setBorderPreset('custom_png');
      }

      const savedWm = localStorage.getItem(WATERMARK_TOGGLE_KEY);
      if (savedWm !== null) {
        setShowWatermark(savedWm === 'true');
      } else {
        setShowWatermark(initialSettings?.showWatermark !== false);
      }

      const savedQr = localStorage.getItem(QR_TOGGLE_KEY);
      if (savedQr !== null) {
        setShowQrCode(savedQr === 'true');
      }
    }

    const unsubSettings = settingsService.subscribe((s) => setSettings(s));
    const unsubExams = examService.subscribe((updated) =>
      setExams(updated.filter((ex) => ex.isActive !== false)),
    );
    return () => {
      unsubSettings();
      unsubExams();
    };
  }, []);

  const examOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const ex of exams) {
      if (ex.title && !seen.has(ex.title)) {
        seen.add(ex.title);
        list.push(ex.title);
      }
    }
    for (const title of FALLBACK_EXAMS) {
      if (!seen.has(title)) {
        seen.add(title);
        list.push(title);
      }
    }
    return list;
  }, [exams]);

  const isClass9or10 = selectedGrade === '9th' || selectedGrade === '10th';
  const gradeLabelBn =
    GRADES_LIST.find((g) => g.id === selectedGrade)?.labelBn || selectedGrade;

  const { normalizedBranch, normalizedGroupBn } = useMemo(
    () => resolveBranchForGradeAndGroup(selectedGrade, selectedBranch, selectedGroup),
    [selectedGrade, selectedBranch, selectedGroup],
  );

  // Switch Grade with automatic Group <-> Branch alignment
  const handleSelectGrade = (nextGrade: '6th' | '7th' | '8th' | '9th' | '10th') => {
    setSelectedGrade(nextGrade);
    if (nextGrade === '9th' || nextGrade === '10th') {
      const aligned = resolveBranchForGradeAndGroup(nextGrade, selectedBranch, selectedGroup);
      setSelectedBranch(aligned.normalizedBranch);
      setSelectedGroup(aligned.normalizedGroupBn);
    } else {
      setSelectedBranch(['A', 'B', 'C'].includes(selectedBranch) ? selectedBranch : 'A');
      setSelectedGroup('সাধারণ');
    }
    setCheckedStudentIds([]);
    setSelectedStudentId('');
  };

  // Load class/section/group students & evaluate marksheets + TRUE merit positions
  const evaluatedClassList = useMemo(() => {
    if (!mounted) return [];
    const students = getStudentsForClassSectionGroup(
      selectedGrade,
      normalizedBranch,
      normalizedGroupBn,
    );
    return evaluateClassMarksheetsWithMerit(
      students,
      (student) =>
        generateStudentMarksheetData(student, {
          selectedExam,
          selectedGrade,
          selectedBranch: normalizedBranch,
        }),
      {
        selectedExam,
        selectedGrade,
        selectedBranch: normalizedBranch,
      },
    );
  }, [mounted, selectedExam, selectedGrade, normalizedBranch, normalizedGroupBn]);

  // Directory filtered list (search + pass/fail filter, preserving true meritPosition!)
  const directoryList = useMemo(
    () =>
      filterMarksheetDirectory(evaluatedClassList, {
        searchQuery,
        statusFilter,
      }),
    [evaluatedClassList, searchQuery, statusFilter],
  );

  // Keep active single student valid when class/filter changes
  const activeItem = useMemo(() => {
    if (directoryList.length === 0) return evaluatedClassList[0] || null;
    return (
      directoryList.find((it) => it.student.id === selectedStudentId) ||
      directoryList[0]
    );
  }, [directoryList, evaluatedClassList, selectedStudentId]);

  const activeIndexInDirectory = useMemo(() => {
    if (!activeItem) return -1;
    return directoryList.findIndex((it) => it.student.id === activeItem.student.id);
  }, [directoryList, activeItem]);

  // Selective Batch Print List
  const batchPrintList = useMemo(
    () =>
      filterMarksheetBatchStudents(evaluatedClassList, {
        mode: batchFilterMode,
        selectedIds: checkedStudentIds,
        rollFrom: rollRangeFrom,
        rollTo: rollRangeTo,
      }),
    [evaluatedClassList, batchFilterMode, checkedStudentIds, rollRangeFrom, rollRangeTo],
  );

  // Class summary telemetry
  const classStats = useMemo(() => {
    const total = evaluatedClassList.length;
    const passed = evaluatedClassList.filter((it) => !it.hasFailed).length;
    const failed = total - passed;
    const aPlus = evaluatedClassList.filter((it) => it.overallGrade === 'A+').length;
    return { total, passed, failed, aPlus };
  }, [evaluatedClassList]);

  // Selection helpers
  const toggleCheckStudent = (id: string) => {
    setCheckedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const allDirectoryChecked =
    directoryList.length > 0 &&
    directoryList.every((it) => checkedStudentIds.includes(it.student.id));

  const handleToggleSelectAllDirectory = () => {
    if (allDirectoryChecked) {
      const dirSet = new Set(directoryList.map((it) => it.student.id));
      setCheckedStudentIds((prev) => prev.filter((id) => !dirSet.has(id)));
    } else {
      setCheckedStudentIds((prev) =>
        Array.from(new Set([...prev, ...directoryList.map((it) => it.student.id)])),
      );
    }
  };

  const handlePrevStudent = () => {
    if (directoryList.length <= 1) return;
    const nextIdx =
      activeIndexInDirectory <= 0 ? directoryList.length - 1 : activeIndexInDirectory - 1;
    setSelectedStudentId(directoryList[nextIdx].student.id);
  };

  const handleNextStudent = () => {
    if (directoryList.length <= 1) return;
    const nextIdx =
      activeIndexInDirectory < 0 || activeIndexInDirectory >= directoryList.length - 1
        ? 0
        : activeIndexInDirectory + 1;
    setSelectedStudentId(directoryList[nextIdx].student.id);
  };

  // Design persistence handlers
  const handleSelectBorderPreset = (preset: MarksheetBorderPreset) => {
    setBorderPreset(preset);
    if (typeof window !== 'undefined') {
      localStorage.setItem(BORDER_PRESET_KEY, preset);
    }
  };

  const handleBorderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      if (url) {
        setBorderImageUrl(url);
        setBorderPreset('custom_png');
        localStorage.setItem('sms_marksheet_border_png', url);
        localStorage.setItem(BORDER_PRESET_KEY, 'custom_png');
        localStorage.removeItem('sms_marksheet_border_cleared');
        showToast('কাস্টম PNG বর্ডার সংরক্ষিত হয়েছে।', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBorderClear = () => {
    setBorderImageUrl('');
    setBorderPreset('emerald_gold');
    localStorage.removeItem('sms_marksheet_border_png');
    localStorage.setItem('sms_marksheet_border_cleared', 'true');
    localStorage.setItem(BORDER_PRESET_KEY, 'emerald_gold');
    showToast('কাস্টম PNG বর্ডার সরানো হয়েছে।', 'info');
  };

  const handleToggleWatermark = () => {
    setShowWatermark((prev) => {
      const next = !prev;
      localStorage.setItem(WATERMARK_TOGGLE_KEY, String(next));
      return next;
    });
  };

  const handleToggleQr = () => {
    setShowQrCode((prev) => {
      const next = !prev;
      localStorage.setItem(QR_TOGGLE_KEY, String(next));
      return next;
    });
  };

  // Clean Single & Batch Print Triggers
  const handleSinglePrint = () => {
    if (!activeItem) {
      showToast('প্রিন্ট করার জন্য কোনো শিক্ষার্থী নির্বাচিত নেই।', 'error');
      return;
    }
    if (activeTab !== 'single') {
      setActiveTab('single');
      setTimeout(() => window.print(), 140);
    } else {
      window.print();
    }
  };

  const handleBatchPrint = () => {
    if (batchPrintList.length === 0) {
      showToast(
        batchFilterMode === 'selected'
          ? 'ব্যাচ প্রিন্টের জন্য বাম তালিকা থেকে অন্তত ১ জন শিক্ষার্থী চেকবক্সে টিক দিন।'
          : 'বর্তমান ব্যাচ ফিল্টারে কোনো শিক্ষার্থী পাওয়া যায়নি।',
        'error',
      );
      return;
    }
    if (activeTab !== 'batch') {
      setActiveTab('batch');
      setTimeout(() => window.print(), 180);
    } else {
      window.print();
    }
  };

  if (!mounted) {
    return (
      <div className="p-10 text-center text-sm font-semibold text-slate-400">
        অফিশিয়াল মার্কশিট স্টুডিও লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50/70 dark:bg-slate-950 print:bg-white">
      {/* ─── SINGLE-ROW FLUSH STICKY SUB-HEADER (h-14, print:hidden) ─── */}
      <div className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-5 flex items-center justify-between gap-2 print:hidden">
        {/* Left: Single Marksheet vs Batch Print Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`h-9 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'single'
                ? 'bg-[#0B5D3B] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>একক মার্কশিট</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`h-9 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'batch'
                ? 'bg-[#0B5D3B] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>ব্যাচ প্রিন্ট</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'batch'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-300'
              }`}
            >
              {toBanglaDigits(batchPrintList.length)}
            </span>
          </button>
        </div>

        {/* Right: Border Setup, Single Print & Batch Print */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowDesignDrawer((v) => !v)}
            className={`h-9 px-3 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              showDesignDrawer
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-[#0B5D3B] text-[#0B5D3B] dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">বর্ডার সেটআপ</span>
          </button>

          <button
            type="button"
            disabled={!activeItem}
            onClick={handleSinglePrint}
            className="hidden md:inline-flex h-9 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-300 text-xs font-bold items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>একক প্রিন্ট</span>
          </button>

          <button
            type="button"
            disabled={batchPrintList.length === 0}
            onClick={handleBatchPrint}
            className="h-9 px-3.5 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>
              ব্যাচ প্রিন্ট ({toBanglaDigits(batchPrintList.length)})
            </span>
          </button>
        </div>
      </div>

      {/* ─── MAIN WORKSPACE BODY ─── */}
      <div className="p-3 sm:p-5 max-w-[1460px] mx-auto space-y-4 print:p-0 print:max-w-none print:space-y-0">
        {/* ══ COLLAPSIBLE BORDER & DESIGN STUDIO PANEL (print:hidden) ══ */}
        {showDesignDrawer && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3 print:hidden">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0B5D3B] dark:text-emerald-400" />
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  মার্কশিট বর্ডার ফ্রেম, ওয়াটারমার্ক ও QR ভেরিফিকেশন সেটআপ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDesignDrawer(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {MARKSHEET_BORDER_PRESETS.map((preset) => {
                const active = borderPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectBorderPreset(preset.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'border-[#0B5D3B] bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-[#0B5D3B]'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-white shadow-2xs"
                        style={{ backgroundColor: preset.accentHex }}
                      />
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {preset.labelBn}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      {preset.descBn}
                    </p>
                  </button>
                );
              })}

              {/* Custom PNG Border Upload Tile */}
              <div
                className={`p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 ${
                  borderPreset === 'custom_png' && borderImageUrl
                    ? 'border-[#0B5D3B] bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-[#0B5D3B]'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50'
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white">কাস্টম PNG বর্ডার</div>
                <input
                  ref={borderFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleBorderUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => borderFileInputRef.current?.click()}
                    className="flex-1 h-7 px-2 rounded-lg bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-[10px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" /> {borderImageUrl ? 'বদলান' : 'আপলোড'}
                  </button>
                  {borderImageUrl && (
                    <button
                      type="button"
                      onClick={handleBorderClear}
                      title="PNG বর্ডার সরান"
                      className="h-7 px-2 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-[10px] font-bold cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Watermark & QR Toggles */}
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col justify-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleWatermark}
                  className={`h-7 px-2.5 rounded-lg text-[11px] font-bold inline-flex items-center justify-between border transition-colors cursor-pointer ${
                    showWatermark
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-[#0B5D3B] dark:text-emerald-300'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <Droplets className="w-3 h-3" /> ওয়াটারমার্ক
                  </span>
                  <span>{showWatermark ? 'চালু' : 'বন্ধ'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleQr}
                  className={`h-7 px-2.5 rounded-lg text-[11px] font-bold inline-flex items-center justify-between border transition-colors cursor-pointer ${
                    showQrCode
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-[#0B5D3B] dark:text-emerald-300'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <QrCode className="w-3 h-3" /> QR যাচাই
                  </span>
                  <span>{showQrCode ? 'চালু' : 'বন্ধ'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ 2-PANE STUDIO WORKSPACE (LEFT DIRECTORY + RIGHT LIVE A4 PREVIEW / BATCH) ══ */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start print:block">
          {/* ─── LEFT PANE (xl:col-span-4, print:hidden): SEARCHABLE STUDENT DIRECTORY ─── */}
          <aside className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden flex flex-col print:hidden">
            {/* Exam, Class & Auto-Synced Group/Section Controls */}
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
              {/* Live Exam Select */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  পরীক্ষা নির্বাচন
                </label>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0B5D3B] cursor-pointer"
                >
                  {examOptions.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Pills (6th–10th) */}
              <div className="grid grid-cols-5 gap-1 bg-slate-100/90 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
                {GRADES_LIST.map((g) => {
                  const active = selectedGrade === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleSelectGrade(g.id)}
                      className={`h-7 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-[#0B5D3B] text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {g.shortBn}
                    </button>
                  );
                })}
              </div>

              {/* Auto-Synced Group (9th–10th) OR Section (6th–8th) Pills */}
              <div className="grid grid-cols-3 gap-1">
                {isClass9or10
                  ? GROUPS_9_10.map((grp) => {
                      const active = normalizedGroupBn === grp.groupBn;
                      return (
                        <button
                          key={grp.groupBn}
                          type="button"
                          onClick={() => {
                            setSelectedGroup(grp.groupBn);
                            setSelectedBranch(grp.branch);
                            setCheckedStudentIds([]);
                            setSelectedStudentId('');
                          }}
                          className={`h-7 px-2 rounded-lg text-[11px] font-bold border transition-all truncate cursor-pointer ${
                            active
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-[#0B5D3B] text-[#0B5D3B] dark:text-emerald-300'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          {grp.shortBn}
                        </button>
                      );
                    })
                  : SECTIONS_6_8.map((sec) => {
                      const active = normalizedBranch === sec;
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            setSelectedBranch(sec);
                            setSelectedGroup('সাধারণ');
                            setCheckedStudentIds([]);
                            setSelectedStudentId('');
                          }}
                          className={`h-7 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            active
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-[#0B5D3B] text-[#0B5D3B] dark:text-emerald-300'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          শাখা {sec}
                        </button>
                      );
                    })}
              </div>

              {/* Compact Telemetry Strip */}
              <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold">
                <div className="py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 block">মোট</span>
                  <span className="text-xs text-slate-800 dark:text-white">{toBanglaDigits(classStats.total)}</span>
                </div>
                <div className="py-1 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50">
                  <span className="text-emerald-700 dark:text-emerald-400 block">পাস</span>
                  <span className="text-xs text-[#0B5D3B] dark:text-emerald-300">{toBanglaDigits(classStats.passed)}</span>
                </div>
                <div className="py-1 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50">
                  <span className="text-rose-600 dark:text-rose-400 block">ফেল</span>
                  <span className="text-xs text-rose-700 dark:text-rose-300">{toBanglaDigits(classStats.failed)}</span>
                </div>
                <div className="py-1 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50">
                  <span className="text-amber-700 dark:text-amber-400 block">A+</span>
                  <span className="text-xs text-amber-800 dark:text-amber-300">{toBanglaDigits(classStats.aPlus)}</span>
                </div>
              </div>

              {/* Search & Status Filter */}
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="রোল (০১/1) বা নাম..."
                    className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#0B5D3B]"
                  />
                </div>
                <div className="inline-flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
                  {(
                    [
                      { id: 'all', label: 'সকল' },
                      { id: 'passed', label: 'পাস' },
                      { id: 'failed', label: 'ফেল' },
                    ] as Array<{ id: MarksheetStatusFilter; label: string }>
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStatusFilter(f.id)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                        statusFilter === f.id
                          ? 'bg-white dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-300 shadow-2xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkbox Select-All Bar */}
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <button
                  type="button"
                  onClick={handleToggleSelectAllDirectory}
                  disabled={directoryList.length === 0}
                  className="inline-flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300 hover:text-[#0B5D3B] dark:hover:text-emerald-300 disabled:opacity-40 cursor-pointer"
                >
                  {allDirectoryChecked ? (
                    <CheckSquare className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{allDirectoryChecked ? 'সব আনচেক' : 'সব নির্বাচন'}</span>
                </button>
                <span className="font-bold text-[#0B5D3B] dark:text-emerald-400">
                  নির্বাচিত: {toBanglaDigits(checkedStudentIds.length)} জন
                </span>
              </div>
            </div>

            {/* Scrollable Student List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[540px] overflow-y-auto">
              {directoryList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  {evaluatedClassList.length === 0
                    ? `${gradeLabelBn}-এ কোনো শিক্ষার্থী পাওয়া যায়নি।`
                    : 'এই ফিল্টারে কোনো শিক্ষার্থী পাওয়া যায়নি।'}
                </div>
              ) : (
                directoryList.map((item) => {
                  const isSelected = activeItem?.student.id === item.student.id;
                  const isChecked = checkedStudentIds.includes(item.student.id);
                  return (
                    <div
                      key={item.student.id}
                      onClick={() => {
                        setSelectedStudentId(item.student.id);
                        if (activeTab === 'batch' && batchFilterMode === 'selected') {
                          toggleCheckStudent(item.student.id);
                        }
                      }}
                      className={`px-3 py-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors border-l-3 ${
                        isSelected
                          ? 'border-l-[#0B5D3B] bg-emerald-50/55 dark:bg-emerald-950/30'
                          : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCheckStudent(item.student.id);
                          }}
                          aria-label={`${item.student.name} নির্বাচন করুন`}
                          className="p-0.5 text-slate-400 hover:text-[#0B5D3B] shrink-0 cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#0B5D3B] dark:text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 tabular-nums shrink-0">
                          {item.student.roll}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-xs font-bold truncate ${
                              isSelected
                                ? 'text-[#0B5D3B] dark:text-emerald-300'
                                : 'text-slate-800 dark:text-slate-100'
                            }`}
                          >
                            {item.student.name}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            নম্বর: {toBanglaDigits(item.totalObtained)}/{toBanglaDigits(item.totalFull)}
                            {item.meritPosition ? ` · মেধা: ${formatMeritPositionBn(item.meritPosition)}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="text-[11px] font-extrabold tabular-nums text-slate-800 dark:text-slate-100">
                          GPA {item.hasFailed ? '0.00' : item.finalGPA.toFixed(2)}
                        </span>
                        {item.hasFailed ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300">
                            <XCircle className="w-2.5 h-2.5" /> ফেল
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            <CheckCircle2 className="w-2.5 h-2.5" /> {item.overallGrade}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Prev / Next Footer */}
            <div className="p-2.5 bg-slate-50/90 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
              <button
                type="button"
                disabled={directoryList.length <= 1}
                onClick={handlePrevStudent}
                className="flex-1 h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 font-bold text-slate-700 dark:text-slate-200 inline-flex items-center justify-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> পূর্ববর্তী
              </button>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                {directoryList.length > 0
                  ? `${toBanglaDigits(Math.max(1, activeIndexInDirectory + 1))} / ${toBanglaDigits(directoryList.length)}`
                  : '০ / ০'}
              </span>
              <button
                type="button"
                disabled={directoryList.length <= 1}
                onClick={handleNextStudent}
                className="flex-1 h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 font-bold text-slate-700 dark:text-slate-200 inline-flex items-center justify-center gap-1 cursor-pointer"
              >
                পরবর্তী <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </aside>

          {/* ─── RIGHT PANE (xl:col-span-8): LIVE A4 PREVIEW OR SELECTIVE BATCH PRINT ─── */}
          <section className="xl:col-span-8 space-y-3.5 print:space-y-0">
            {evaluatedClassList.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-2xs print:hidden">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center">
                  <UserX className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {gradeLabelBn} ({isClass9or10 ? normalizedGroupBn : `শাখা ${normalizedBranch}`})-এ কোনো শিক্ষার্থী নেই
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    মার্কশিট প্রস্তুত ও প্রিন্ট করতে প্রথমে এই শ্রেণিতে শিক্ষার্থী যুক্ত করুন অথবা অন্য শ্রেণি/বিভাগ নির্বাচন করুন।
                  </p>
                </div>
                <div className="pt-1 flex justify-center gap-2.5">
                  <Link
                    href="/dashboard/students"
                    className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#0B5D3B] hover:bg-[#094a2f] text-white rounded-xl font-bold text-xs shadow-2xs transition"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> শিক্ষার্থী তালিকায় যান
                  </Link>
                  <Link
                    href="/dashboard/students/bulk-import"
                    className="inline-flex items-center gap-1.5 h-9 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition"
                  >
                    <Upload className="w-3.5 h-3.5" /> বাল্ক ইমপোর্ট
                  </Link>
                </div>
              </div>
            ) : activeTab === 'single' ? (
              /* ══ SINGLE MARKSHEET LIVE PREVIEW MODE ══ */
              <div className="space-y-3 print:space-y-0">
                {/* Preview Ribbon (print:hidden) */}
                {activeItem && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs print:hidden">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-xs font-extrabold text-[#0B5D3B] dark:text-emerald-300 tabular-nums shrink-0">
                        রোল {activeItem.student.roll}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {activeItem.student.name}
                      </span>
                      {activeItem.meritPosition && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 shrink-0">
                          মেধা: {formatMeritPositionBn(activeItem.meritPosition)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={directoryList.length <= 1}
                        onClick={handlePrevStudent}
                        title="পূর্ববর্তী শিক্ষার্থী"
                        className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={directoryList.length <= 1}
                        onClick={handleNextStudent}
                        title="পরবর্তী শিক্ষার্থী"
                        className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleSinglePrint}
                        className="h-8 px-3 rounded-lg bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" /> এই মার্কশিট প্রিন্ট (১ পাতা A4)
                      </button>
                    </div>
                  </div>
                )}

                {/* Live A4 Marksheet Card */}
                {activeItem && (
                  <div className="marksheet-preview-shell overflow-x-auto pb-2 print:overflow-visible print:pb-0">
                    <MarksheetSheetCard
                      student={activeItem.student}
                      settings={settings}
                      examName={selectedExam}
                      data={activeItem.marksheetData}
                      meritPosition={activeItem.meritPosition}
                      totalClassStudents={activeItem.totalClassStudents}
                      borderImageUrl={borderImageUrl}
                      borderPreset={borderPreset}
                      showWatermark={showWatermark}
                      showQrCode={showQrCode}
                      includePrintStyles={false}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* ══ SELECTIVE BATCH PRINT STUDIO MODE ══ */
              <div className="space-y-4 print:space-y-0">
                {/* Selective Batch Print Control Bar (print:hidden) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3 print:hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        সিলেক্টিভ ব্যাচ প্রিন্ট সেটআপ (প্রতি শিক্ষার্থীর জন্য ১টি পূর্ণ A4 পাতা)
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        প্রয়োজন অনুযায়ী শুধু নির্বাচিত, শুধু পাসকৃত, রোল রেঞ্জ অথবা সম্পূর্ণ শ্রেণি একসাথে প্রিন্ট বা PDF করুন।
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={batchPrintList.length === 0}
                      onClick={handleBatchPrint}
                      className="h-9 px-4 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      ব্যাচ প্রিন্ট ({toBanglaDigits(batchPrintList.length)} পাতা A4)
                    </button>
                  </div>

                  {/* 4 Selective Batch Modes */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {(
                      [
                        {
                          id: 'selected',
                          label: 'নির্বাচিত শিক্ষার্থী',
                          sub: `${toBanglaDigits(checkedStudentIds.length)} জন চেক করা`,
                        },
                        {
                          id: 'passed_only',
                          label: 'শুধু পাসকৃত',
                          sub: `${toBanglaDigits(classStats.passed)} জন উত্তীর্ণ`,
                        },
                        {
                          id: 'roll_range',
                          label: 'রোল রেঞ্জ',
                          sub: `রোল ${rollRangeFrom || '১'} – ${rollRangeTo || '২০'}`,
                        },
                        {
                          id: 'all',
                          label: 'সম্পূর্ণ শ্রেণি',
                          sub: `মোট ${toBanglaDigits(classStats.total)} জন`,
                        },
                      ] as Array<{ id: MarksheetBatchFilterMode; label: string; sub: string }>
                    ).map((m) => {
                      const active = batchFilterMode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setBatchFilterMode(m.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            active
                              ? 'border-[#0B5D3B] bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-[#0B5D3B]'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300'
                          }`}
                        >
                          <div className="font-extrabold text-slate-900 dark:text-white">{m.label}</div>
                          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                            {m.sub}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Inline Roll Range Inputs (shown when 'roll_range' selected) */}
                  {batchFilterMode === 'roll_range' && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <span className="font-bold text-slate-600 dark:text-slate-300">রোল সীমা:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={rollRangeFrom}
                        onChange={(e) => setRollRangeFrom(e.target.value)}
                        placeholder="১"
                        className="w-20 h-8 px-2.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-extrabold text-slate-900 dark:text-white focus:outline-none focus:border-[#0B5D3B]"
                      />
                      <span className="text-slate-400 font-bold">থেকে</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={rollRangeTo}
                        onChange={(e) => setRollRangeTo(e.target.value)}
                        placeholder="২০"
                        className="w-20 h-8 px-2.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-extrabold text-slate-900 dark:text-white focus:outline-none focus:border-[#0B5D3B]"
                      />
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        মিল পাওয়া গেছে: {toBanglaDigits(batchPrintList.length)} জন (বাংলা/ইংরেজি রোল সাপোর্টেড)
                      </span>
                    </div>
                  )}
                </div>

                {/* Batch Preview / Printable Container (Strictly 1 A4 page per student!) */}
                {batchPrintList.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-xs font-bold text-slate-500 dark:text-slate-400 print:hidden">
                    {batchFilterMode === 'selected'
                      ? 'বাম পাশের তালিকা থেকে চেকবক্সে টিক দিয়ে শিক্ষার্থী নির্বাচন করুন।'
                      : 'এই ব্যাচ ফিল্টারে কোনো শিক্ষার্থী পাওয়া যায়নি।'}
                  </div>
                ) : (
                  <div className="marksheet-bulk-container marksheet-preview-shell space-y-6 overflow-x-auto print:overflow-visible print:space-y-0 print:m-0 print:p-0 print:block">
                    {batchPrintList.map((item) => (
                      <MarksheetSheetCard
                        key={item.student.id}
                        student={item.student}
                        settings={settings}
                        examName={selectedExam}
                        data={item.marksheetData}
                        meritPosition={item.meritPosition}
                        totalClassStudents={item.totalClassStudents}
                        borderImageUrl={borderImageUrl}
                        borderPreset={borderPreset}
                        showWatermark={showWatermark}
                        showQrCode={showQrCode}
                        includePrintStyles={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* 🖨️ SINGLE CANONICAL A4 PRINT STYLESHEET (EXACT 1-PAGE PER STUDENT, ZERO BLANK TRAILING PAGE) */}
      <style>{MARKSHEET_A4_PRINT_STYLES}</style>
    </div>
  );
}
