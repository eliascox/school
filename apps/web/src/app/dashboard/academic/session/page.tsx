'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  Lock,
  Unlock,
  Pencil,
  Trash2,
  Users,
  Archive,
  X,
  Check,
  Search,
  Printer,
  AlertCircle,
  BookOpen,
  ChevronDown,
  FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';
import { studentService, Student } from '@/services/studentService';
import { settingsService } from '@/services/settingsService';
import { classSectionService } from '@/services/classSectionService';
import { auditTrailService } from '@/services/auditTrailService';
import { triggerProfessionalPrint } from '@/lib/printPdfUtils';
import {
  ACADEMIC_SESSIONS_STORAGE_KEY,
  AcademicSession,
  canDeleteSession,
  computeSessionProgress,
  computeSessionStatusCounts,
  countStudentsForSession,
  DEFAULT_ACADEMIC_SESSIONS,
  filterAcademicSessions,
  formatSessionDateRangeBn,
  normalizeLoadedSessions,
  SessionAdmissionStatus,
  SessionLifecycleStatus,
  SessionStatusFilter,
  suggestNextSessionDraft,
  toBanglaDigits,
  validateSessionInput,
} from '@/lib/academicSessionUtils';

const STATUS_TABS: Array<{
  id: SessionStatusFilter;
  label: string;
}> = [
  { id: 'all', label: 'সকল' },
  { id: 'Active', label: 'সক্রিয়' },
  { id: 'Upcoming', label: 'আসন্ন' },
  { id: 'Archived', label: 'আর্কাইভ' },
];

export default function SessionManagementPage() {
  const [mounted, setMounted] = useState(false);
  const [sessions, setSessions] = useState<AcademicSession[]>(DEFAULT_ACADEMIC_SESSIONS);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [activeClassesCount, setActiveClassesCount] = useState<number>(5);
  const [activeSectionsCount, setActiveSectionsCount] = useState<number>(5);

  // Filter, Search & Menus
  const [statusFilter, setStatusFilter] = useState<SessionStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [newSession, setNewSession] = useState({
    nameBn: '২০২৮ শিক্ষাবর্ষ',
    year: 2028,
    startDate: '2028-01-01',
    endDate: '2028-12-31',
    admissionStatus: 'Upcoming' as SessionAdmissionStatus,
    remarks: '',
  });
  const [hasCustomAddName, setHasCustomAddName] = useState(false);

  const [editSessionModal, setEditSessionModal] = useState<AcademicSession | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Load from localStorage, studentService & classSectionService
  const refreshData = useCallback(() => {
    setAllStudents(studentService.getAllStudents());
    const classes = classSectionService.getClasses();
    setActiveClassesCount(classes.length || 5);
    const totalSections = classes.reduce((sum, cls) => sum + (cls.sections?.length || 1), 0);
    setActiveSectionsCount(totalSections || classes.length || 5);

    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(ACADEMIC_SESSIONS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const normalized = normalizeLoadedSessions(parsed);
        setSessions(normalized);
        return;
      } catch {
        // Fallback to default normalized sessions below
      }
    }
    const defaults = normalizeLoadedSessions(DEFAULT_ACADEMIC_SESSIONS);
    setSessions(defaults);
    try {
      localStorage.setItem(ACADEMIC_SESSIONS_STORAGE_KEY, JSON.stringify(defaults));
    } catch {
      // Ignore storage write errors
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    refreshData();

    const unsubscribe = studentService.subscribe(refreshData);
    const unsubClasses = classSectionService.subscribe(refreshData);
    const onStorage = () => refreshData();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage);
    }
    return () => {
      unsubscribe();
      unsubClasses();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorage);
      }
    };
  }, [refreshData]);

  // Close Export dropdown on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    const handleOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showExportMenu]);

  // Escape key closes active modal or dropdown
  useEffect(() => {
    if (!isAddModalOpen && !editSessionModal && !showExportMenu) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddModalOpen(false);
        setAddFormError(null);
        setEditSessionModal(null);
        setEditFormError(null);
        setShowExportMenu(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAddModalOpen, editSessionModal, showExportMenu]);

  // Save Sessions safely to localStorage
  const saveSessions = useCallback((updated: AcademicSession[]) => {
    const normalized = normalizeLoadedSessions(updated);
    setSessions(normalized);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ACADEMIC_SESSIONS_STORAGE_KEY, JSON.stringify(normalized));
      } catch {
        showToast('লোকাল স্টোরেজে সেশন সংরক্ষণ করা যায়নি।', 'error');
      }
    }
  }, []);

  // Derived data
  const activeSession = useMemo(
    () => sessions.find((s) => s.isCurrent) || sessions[0] || DEFAULT_ACADEMIC_SESSIONS[0],
    [sessions]
  );

  const statusCounts = useMemo(() => computeSessionStatusCounts(sessions), [sessions]);

  const filteredSessions = useMemo(
    () => filterAcademicSessions(sessions, { statusFilter, query: searchQuery }),
    [sessions, statusFilter, searchQuery]
  );

  const sessionStudentCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      map.set(s.id, countStudentsForSession(allStudents, s));
    }
    return map;
  }, [sessions, allStudents]);

  const activeSessionStudentCount = sessionStudentCounts.get(activeSession.id) ?? 0;

  const activeSessionDateRange = useMemo(
    () => formatSessionDateRangeBn(activeSession.startDate, activeSession.endDate),
    [activeSession.startDate, activeSession.endDate]
  );

  const activeSessionProgress = useMemo(
    () => computeSessionProgress(activeSession.startDate, activeSession.endDate),
    [activeSession.startDate, activeSession.endDate]
  );

  const schoolSettings = useMemo(
    () => (mounted ? settingsService.getSettings() : null),
    [mounted]
  );

  // Handlers
  const openAddModal = () => {
    const draft = suggestNextSessionDraft(sessions);
    setNewSession(draft);
    setHasCustomAddName(false);
    setAddFormError(null);
    setIsAddModalOpen(true);
  };

  const handleAddYearChange = (nextYearRaw: string) => {
    const parsedYear = Number(nextYearRaw);
    setNewSession((prev) => {
      const validYear = Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100;
      return {
        ...prev,
        year: parsedYear,
        ...(validYear
          ? {
              startDate: `${parsedYear}-01-01`,
              endDate: `${parsedYear}-12-31`,
              ...(!hasCustomAddName ? { nameBn: `${toBanglaDigits(parsedYear)} শিক্ষাবর্ষ` } : {}),
            }
          : {}),
      };
    });
    setAddFormError(null);
  };

  const handleSetActiveSession = async (target: AcademicSession) => {
    if (target.isCurrent) return;
    const confirmed = await confirmDialog({
      title: 'সক্রিয় শিক্ষাবর্ষ পরিবর্তন',
      message: `আপনি কি "${target.nameBn}" (${toBanglaDigits(target.year)}) কে বর্তমান সক্রিয় শিক্ষাবর্ষ হিসেবে নির্ধারণ করতে চান? বর্তমান সক্রিয় সেশনটি আর্কাইভ হিসেবে সংরক্ষিত হবে।`,
      confirmLabel: 'সক্রিয় করুন',
    });
    if (!confirmed) return;

    const updated = sessions.map((s) => {
      if (s.id === target.id) {
        return {
          ...s,
          isCurrent: true,
          status: 'Active' as SessionLifecycleStatus,
          totalStudents: sessionStudentCounts.get(s.id) ?? s.totalStudents,
        };
      }
      if (s.isCurrent || s.status === 'Active') {
        return {
          ...s,
          isCurrent: false,
          status: 'Archived' as SessionLifecycleStatus,
          totalStudents: sessionStudentCounts.get(s.id) ?? s.totalStudents,
        };
      }
      return s;
    });

    saveSessions(updated);
    auditTrailService.addLog({
      action: 'SESSION_ACTIVATED',
      category: 'Academic',
      details: `সক্রিয় শিক্ষাবর্ষ পরিবর্তন: "${target.nameBn}" (${target.year}) সক্রিয় করা হয়েছে।`,
      performedBy: 'অ্যাডমিন',
      status: 'Success',
    });
    showToast(`"${target.nameBn}" এখন বর্তমান সক্রিয় শিক্ষাবর্ষ।`, 'success');
  };

  const handleToggleAdmission = (id: string) => {
    const target = sessions.find((s) => s.id === id);
    if (!target) return;

    const nextStatus: SessionAdmissionStatus =
      target.admissionStatus === 'Open' ? 'Closed' : 'Open';
    const updated = sessions.map((s) =>
      s.id === id ? { ...s, admissionStatus: nextStatus } : s
    );
    saveSessions(updated);
    auditTrailService.addLog({
      action: 'SESSION_ADMISSION_TOGGLED',
      category: 'Academic',
      details: `${target.nameBn}-এর ভর্তি অবস্থা "${nextStatus === 'Open' ? 'খোলা' : 'বন্ধ'}" করা হয়েছে।`,
      performedBy: 'অ্যাডমিন',
      status: 'Success',
    });
    showToast(
      `${target.nameBn}: ভর্তি ${nextStatus === 'Open' ? 'চালু করা হয়েছে' : 'বন্ধ করা হয়েছে'}।`,
      'success'
    );
  };

  const handleAddSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateSessionInput(newSession, sessions);
    if (!validation.valid) {
      setAddFormError(validation.error || 'সঠিক তথ্য প্রদান করুন।');
      showToast(validation.error || 'সঠিক তথ্য প্রদান করুন।', 'warning');
      return;
    }

    const yearNum = Number(newSession.year);
    const created: AcademicSession = {
      id: `ses-${yearNum}`,
      name: `Academic Session ${yearNum}`,
      nameBn: newSession.nameBn.trim(),
      year: yearNum,
      startDate: newSession.startDate,
      endDate: newSession.endDate,
      isCurrent: false,
      admissionStatus: newSession.admissionStatus,
      totalStudents: 0,
      totalClasses: activeClassesCount,
      status: yearNum < activeSession.year ? 'Archived' : 'Upcoming',
      remarks: newSession.remarks.trim() || `${toBanglaDigits(yearNum)} শিক্ষাবর্ষ`,
    };

    saveSessions([...sessions, created]);
    auditTrailService.addLog({
      action: 'SESSION_CREATED',
      category: 'Academic',
      details: `নতুন শিক্ষাবর্ষ "${created.nameBn}" (${created.startDate} হতে ${created.endDate}) সংযোজন করা হয়েছে।`,
      performedBy: 'অ্যাডমিন',
      status: 'Success',
    });

    setIsAddModalOpen(false);
    setAddFormError(null);
    showToast('নতুন শিক্ষাবর্ষ সফলভাবে সংযোজন করা হয়েছে।', 'success');
  };

  const handleUpdateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSessionModal) return;

    const validation = validateSessionInput(editSessionModal, sessions, editSessionModal.id);
    if (!validation.valid) {
      setEditFormError(validation.error || 'সঠিক তথ্য প্রদান করুন।');
      showToast(validation.error || 'সঠিক তথ্য প্রদান করুন।', 'warning');
      return;
    }

    const yearNum = Number(editSessionModal.year);
    const sanitized: AcademicSession = {
      ...editSessionModal,
      name: `Academic Session ${yearNum}`,
      nameBn: editSessionModal.nameBn.trim(),
      year: yearNum,
      status: editSessionModal.isCurrent ? 'Active' : editSessionModal.status,
      remarks: (editSessionModal.remarks || '').trim(),
    };

    const updated = sessions.map((s) => (s.id === sanitized.id ? sanitized : s));
    saveSessions(updated);
    auditTrailService.addLog({
      action: 'SESSION_UPDATED',
      category: 'Academic',
      details: `শিক্ষাবর্ষ "${sanitized.nameBn}" (${sanitized.startDate} — ${sanitized.endDate}) হালনাগাদ করা হয়েছে।`,
      performedBy: 'অ্যাডমিন',
      status: 'Success',
    });

    setEditSessionModal(null);
    setEditFormError(null);
    showToast('শিক্ষাবর্ষের তথ্য সফলভাবে আপডেট হয়েছে।', 'success');
  };

  const handleDeleteSession = async (session: AcademicSession) => {
    const guard = canDeleteSession(sessions, session.id);
    if (!guard.allowed) {
      showToast(guard.reason || 'এই শিক্ষাবর্ষটি মুছে ফেলা যাবে না।', 'warning');
      return;
    }

    const confirmed = await confirmDialog({
      title: 'শিক্ষাবর্ষ মুছে ফেলা',
      message: `আপনি কি নিশ্চিত যে "${session.nameBn}" (${toBanglaDigits(session.year)}) শিক্ষাবর্ষটি স্থায়ীভাবে মুছে ফেলতে চান?`,
      confirmLabel: 'মুছে ফেলুন',
      danger: true,
    });
    if (!confirmed) return;

    const updated = sessions.filter((s) => s.id !== session.id);
    saveSessions(updated);
    auditTrailService.addLog({
      action: 'SESSION_DELETED',
      category: 'Academic',
      details: `শিক্ষাবর্ষ "${session.nameBn}" (${session.year}) মুছে ফেলা হয়েছে।`,
      performedBy: 'অ্যাডমিন',
      status: 'Success',
    });
    showToast(`"${session.nameBn}" মুছে ফেলা হয়েছে।`, 'success');
  };

  const handlePrint = () => {
    setShowExportMenu(false);
    const schoolName = schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান';
    triggerProfessionalPrint([schoolName, 'শিক্ষাবর্ষ ও সেশন তালিকা', String(activeSession.year)]);
  };

  const handleExportExcel = () => {
    setShowExportMenu(false);
    if (filteredSessions.length === 0) {
      showToast('এক্সপোর্ট করার মতো কোনো সেশন পাওয়া যায়নি।', 'warning');
      return;
    }
    const rows = filteredSessions.map((session, idx) => {
      const range = formatSessionDateRangeBn(session.startDate, session.endDate);
      const studentCount = sessionStudentCounts.get(session.id) ?? 0;
      const statusLabel = session.isCurrent
        ? 'সক্রিয়'
        : session.status === 'Upcoming'
        ? 'আসন্ন'
        : 'আর্কাইভ';
      const admLabel =
        session.admissionStatus === 'Open'
          ? 'খোলা'
          : session.admissionStatus === 'Upcoming'
          ? 'প্রস্তুতি'
          : 'বন্ধ';
      return {
        ক্রমিক: idx + 1,
        শিক্ষাবর্ষ: session.nameBn,
        সাল: session.year,
        'শুরুর তারিখ': session.startDate,
        'শেষের তারিখ': session.endDate,
        মেয়াদ: range.durationLabelBn || '',
        'শিক্ষার্থী সংখ্যা': studentCount,
        'ভর্তি অবস্থা': admLabel,
        স্ট্যাটাস: statusLabel,
        মন্তব্য: session.remarks || '',
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AcademicSessions');
    XLSX.writeFile(workbook, `Academic_Sessions_${activeSession.year}.xlsx`);
    showToast(`${toBanglaDigits(filteredSessions.length)}টি শিক্ষাবর্ষের এক্সেল ডাউনলোড হয়েছে।`, 'success');
  };

  const getTabCount = (id: SessionStatusFilter) => {
    if (id === 'all') return statusCounts.all;
    if (id === 'Active') return statusCounts.active;
    if (id === 'Upcoming') return statusCounts.upcoming;
    return statusCounts.archived;
  };

  const renderStatusBadge = (session: AcademicSession) => {
    if (session.isCurrent || session.status === 'Active') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/70 text-[11px] font-bold">
          <CheckCircle2 size={11} /> সক্রিয়
        </span>
      );
    }
    if (session.status === 'Upcoming') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/90 dark:border-amber-800/70 text-[11px] font-bold">
          <Clock size={11} /> আসন্ন
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
        <Archive size={11} /> আর্কাইভ
      </span>
    );
  };

  const renderAdmissionToggle = (session: AcademicSession) => {
    const isOpen = session.admissionStatus === 'Open';
    const isUpcoming = session.admissionStatus === 'Upcoming';
    return (
      <button
        type="button"
        onClick={() => handleToggleAdmission(session.id)}
        title={isOpen ? 'ক্লিক করে ভর্তি বন্ধ করুন' : 'ক্লিক করে ভর্তি চালু করুন'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
          isOpen
            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#0B5D3B] dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
            : isUpcoming
            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/50'
        }`}
      >
        {isOpen ? <Unlock size={11} /> : <Lock size={11} />}
        <span>{isOpen ? 'ভর্তি খোলা' : isUpcoming ? 'ভর্তি প্রস্তুতি' : 'ভর্তি বন্ধ'}</span>
      </button>
    );
  };

  if (!mounted) {
    return (
      <div className="w-full" suppressHydrationWarning>
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="animate-pulse flex items-center justify-between gap-3">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
            <div className="h-9 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          <div className="animate-pulse h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
          <div className="animate-pulse h-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-14 font-sans text-slate-900 dark:text-slate-100" suppressHydrationWarning>
      {/* SWC-safe plain <style> for A4 Portrait print */}
      <style>{'@media print { @page { size: A4 portrait; margin: 12mm; } }'}</style>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 📌 SINGLE-ROW FLUSH STICKY EXECUTIVE SUB-HEADER                   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)] dark:shadow-none print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full">
            {STATUS_TABS.map((tab) => {
              const isActive = statusFilter === tab.id;
              const count = getTabCount(tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`h-9 px-3 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold whitespace-nowrap shrink-0 border ${
                    isActive
                      ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-2xs'
                      : 'bg-transparent text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold leading-none ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {toBanglaDigits(count)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Search + Print/Export Dropdown + New Session */}
          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="সাল, সেশন বা মন্তব্য খুঁজুন..."
                aria-label="সেশন অনুসন্ধান"
                className="h-9 pl-8 pr-8 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 w-full sm:w-52 lg:w-60 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  aria-label="অনুসন্ধান মুছুন"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="h-9 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                title="প্রিন্ট ও এক্সেল এক্সপোর্ট"
              >
                <Printer size={14} />
                <span className="hidden md:inline">প্রিন্ট ও এক্সপোর্ট</span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-50">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition"
                  >
                    <Printer size={14} className="text-slate-500" />
                    <span>তালিকা প্রিন্ট (A4)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition"
                  >
                    <FileSpreadsheet size={14} className="text-[#0B5D3B] dark:text-emerald-400" />
                    <span>এক্সেল এক্সপোর্ট (.xlsx)</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="h-9 px-3.5 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-[0.98] whitespace-nowrap shrink-0"
            >
              <Plus size={14} />
              <span>+ নতুন সেশন</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 📄 MAIN WORKSPACE CONTENT                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-4 print:max-w-none print:px-0 print:pt-0">
        {/* ─── ACTIVE SESSION EXECUTIVE OVERVIEW STRIP ─── */}
        <section
          aria-label="বর্তমান সক্রিয় শিক্ষাবর্ষ"
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 border-l-4 border-l-[#0B5D3B] dark:border-l-emerald-500 p-4 sm:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] print:hidden"
        >
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            {/* Left: Title, Date Range & Live Calendar Progress */}
            <div className="space-y-2.5 min-w-0 flex-1 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/70 text-[11px] font-extrabold">
                  <CheckCircle2 size={12} /> বর্তমান সক্রিয় শিক্ষাবর্ষ
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <Calendar size={12} className="text-slate-400" />
                  {activeSessionDateRange.rangeLabelBn}
                  {activeSessionDateRange.durationLabelBn
                    ? ` (${activeSessionDateRange.durationLabelBn})`
                    : ''}
                </span>
              </div>

              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {activeSession.nameBn}
                </h1>
                {activeSession.remarks && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-relaxed">
                    {activeSession.remarks}
                  </p>
                )}
              </div>

              {/* Real Calendar Progress Bar */}
              <div className="max-w-md space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-500 dark:text-slate-400">শিক্ষাবর্ষের অগ্রগতি</span>
                  <span className="text-[#0B5D3B] dark:text-emerald-400">
                    {activeSessionProgress.labelBn}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0B5D3B] dark:bg-emerald-500 transition-all duration-500"
                    style={{ width: `${activeSessionProgress.percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Live Institutional Counters & Single-Click Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2 pr-3.5 border-r border-slate-200 dark:border-slate-800">
                  <Users size={15} className="text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white block leading-none">
                      {toBanglaDigits(activeSessionStudentCount)} জন
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      মোট শিক্ষার্থী
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={15} className="text-slate-500 dark:text-slate-400 shrink-0" />
                  <div>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white block leading-none">
                      {toBanglaDigits(activeClassesCount)} শ্রেণি • {toBanglaDigits(activeSectionsCount)} শাখা
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      সক্রিয় কাঠামো
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleAdmission(activeSession.id)}
                className={`h-10 px-3.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                  activeSession.admissionStatus === 'Open'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#0B5D3B] dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/70 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                }`}
                title="ভর্তি পোর্টাল চালু বা বন্ধ করুন"
              >
                {activeSession.admissionStatus === 'Open' ? (
                  <>
                    <Unlock size={13} /> ভর্তি খোলা
                  </>
                ) : (
                  <>
                    <Lock size={13} /> ভর্তি বন্ধ
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditFormError(null);
                  setEditSessionModal({ ...activeSession });
                }}
                className="h-10 w-10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center transition cursor-pointer"
                title="সক্রিয় সেশন এডিট করুন"
                aria-label="সক্রিয় সেশন এডিট করুন"
              >
                <Pencil size={14} />
              </button>

              <Link
                href="/dashboard/academic/promotion"
                className="h-10 px-4 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>শ্রেণি উত্তীর্ণকরণ</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── UNIFIED EXECUTIVE SESSION TABLE (DESKTOP) & CARDS (MOBILE) ─── */}
        <div className="print:hidden">
          {filteredSessions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-12 text-center space-y-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <Search size={24} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                নির্বাচিত ফিল্টার বা অনুসন্ধানের সাথে মিলে এমন কোনো শিক্ষাবর্ষ পাওয়া যায়নি।
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                ফিল্টার রিসেট করুন
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Executive Table */}
              <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 font-extrabold text-[11px] border-b border-slate-200/90 dark:border-slate-800">
                        <th className="px-4 py-3">শিক্ষাবর্ষ ও বিবরণ</th>
                        <th className="px-4 py-3">কার্যকাল ও অগ্রগতি</th>
                        <th className="px-4 py-3 text-center">শিক্ষার্থী</th>
                        <th className="px-4 py-3 text-center">অবস্থা</th>
                        <th className="px-4 py-3 text-center">ভর্তি পোর্টাল</th>
                        <th className="px-4 py-3 text-right">দ্রুত অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {filteredSessions.map((session) => {
                        const range = formatSessionDateRangeBn(session.startDate, session.endDate);
                        const progress = computeSessionProgress(session.startDate, session.endDate);
                        const studentCount = sessionStudentCounts.get(session.id) ?? 0;
                        const deleteGuard = canDeleteSession(sessions, session.id);

                        return (
                          <tr
                            key={session.id}
                            className={`transition-colors ${
                              session.isCurrent
                                ? 'bg-emerald-50/35 dark:bg-emerald-950/15 hover:bg-emerald-50/55 dark:hover:bg-emerald-950/25'
                                : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="px-4 py-3.5 align-top">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                                  {session.nameBn}
                                </span>
                                <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  {session.year}
                                </span>
                              </div>
                              {session.remarks && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-1 max-w-md">
                                  {session.remarks}
                                </p>
                              )}
                            </td>

                            <td className="px-4 py-3.5 align-top">
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {range.rangeLabelBn}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {range.durationLabelBn && (
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                    {range.durationLabelBn}
                                  </span>
                                )}
                                <span className="text-[10px] font-semibold text-slate-400">•</span>
                                <span
                                  className={`text-[10px] font-bold ${
                                    session.isCurrent
                                      ? 'text-[#0B5D3B] dark:text-emerald-400'
                                      : 'text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  {progress.labelBn}
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-3.5 align-top text-center">
                              <span className="font-extrabold text-slate-900 dark:text-white">
                                {toBanglaDigits(studentCount)} জন
                              </span>
                            </td>

                            <td className="px-4 py-3.5 align-top text-center">
                              {renderStatusBadge(session)}
                            </td>

                            <td className="px-4 py-3.5 align-top text-center">
                              {renderAdmissionToggle(session)}
                            </td>

                            <td className="px-4 py-3.5 align-top text-right">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                {!session.isCurrent && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetActiveSession(session)}
                                    className="px-2.5 py-1 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                  >
                                    <Check size={12} /> সক্রিয় করুন
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditFormError(null);
                                    setEditSessionModal({ ...session });
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-[#0B5D3B] dark:text-slate-400 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition cursor-pointer"
                                  title="সেশন এডিট করুন"
                                  aria-label={`${session.nameBn} এডিট`}
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  disabled={!deleteGuard.allowed}
                                  onClick={() => handleDeleteSession(session)}
                                  className={`p-1.5 rounded-lg transition ${
                                    deleteGuard.allowed
                                      ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer'
                                      : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                  }`}
                                  title={deleteGuard.allowed ? 'মুছে ফেলুন' : deleteGuard.reason}
                                  aria-label={`${session.nameBn} ডিলিট`}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Responsive Cards */}
              <div className="md:hidden space-y-3">
                {filteredSessions.map((session) => {
                  const range = formatSessionDateRangeBn(session.startDate, session.endDate);
                  const progress = computeSessionProgress(session.startDate, session.endDate);
                  const studentCount = sessionStudentCounts.get(session.id) ?? 0;
                  const deleteGuard = canDeleteSession(sessions, session.id);

                  return (
                    <article
                      key={session.id}
                      className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 space-y-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] ${
                        session.isCurrent
                          ? 'border-emerald-300 dark:border-emerald-700/80'
                          : 'border-slate-200/90 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {session.nameBn}
                            </h3>
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {session.year}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            {range.rangeLabelBn}
                          </p>
                        </div>
                        {renderStatusBadge(session)}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          শিক্ষার্থী: {toBanglaDigits(studentCount)} জন
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {progress.labelBn}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {!session.isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleSetActiveSession(session)}
                            className="flex-1 h-8 px-3 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-lg font-bold text-xs inline-flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check size={12} /> সক্রিয় করুন
                          </button>
                        )}
                        {renderAdmissionToggle(session)}
                        <button
                          type="button"
                          onClick={() => {
                            setEditFormError(null);
                            setEditSessionModal({ ...session });
                          }}
                          className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer"
                          title="এডিট"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={!deleteGuard.allowed}
                          onClick={() => handleDeleteSession(session)}
                          className={`p-2 rounded-lg ${
                            deleteGuard.allowed
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 cursor-pointer'
                              : 'bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                          }`}
                          title={deleteGuard.allowed ? 'মুছে ফেলুন' : deleteGuard.reason}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 🖨️ PRINT-ONLY INSTITUTIONAL A4 PORTRAIT SESSION DIRECTORY         */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="hidden print:block text-slate-900 bg-white">
          <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {schoolSettings?.schoolLogo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={schoolSettings.schoolLogo}
                  alt="প্রতিষ্ঠানের লোগো"
                  className="w-12 h-12 object-contain shrink-0"
                />
              )}
              <div>
                <h1 className="text-lg font-black text-slate-900">
                  {schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান'}
                </h1>
                <p className="text-xs font-medium text-slate-700">
                  {schoolSettings?.address || ''}
                  {schoolSettings?.eiin ? ` • EIIN: ${schoolSettings.eiin}` : ''}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-extrabold text-slate-900">
                একাডেমিক সেশন ও শিক্ষাবর্ষ তালিকা
              </div>
              <p className="text-[11px] text-slate-600">
                প্রিন্ট তারিখ: {new Date().toLocaleDateString('bn-BD')} • মোট:{' '}
                {toBanglaDigits(filteredSessions.length)}টি সেশন
              </p>
            </div>
          </div>

          <div className="mb-4 p-3 border border-slate-300 rounded-lg bg-slate-50 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-600">বর্তমান সক্রিয় শিক্ষাবর্ষ: </span>
              <strong className="text-slate-900">{activeSession.nameBn}</strong>
              <span className="text-slate-700"> ({activeSessionDateRange.rangeLabelBn})</span>
            </div>
            <div className="font-bold text-slate-800">
              শিক্ষার্থী: {toBanglaDigits(activeSessionStudentCount)} জন • ভর্তি:{' '}
              {activeSession.admissionStatus === 'Open' ? 'খোলা' : 'বন্ধ'}
            </div>
          </div>

          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900">
                <th className="border border-slate-300 px-2.5 py-2 text-center w-10">ক্রম</th>
                <th className="border border-slate-300 px-2.5 py-2 text-left">শিক্ষাবর্ষ</th>
                <th className="border border-slate-300 px-2.5 py-2 text-left">প্রকৃত মেয়াদ</th>
                <th className="border border-slate-300 px-2.5 py-2 text-center">শিক্ষার্থী</th>
                <th className="border border-slate-300 px-2.5 py-2 text-center">ভর্তি</th>
                <th className="border border-slate-300 px-2.5 py-2 text-center">অবস্থা</th>
                <th className="border border-slate-300 px-2.5 py-2 text-left">মন্তব্য</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session, idx) => {
                const range = formatSessionDateRangeBn(session.startDate, session.endDate);
                const studentCount = sessionStudentCounts.get(session.id) ?? 0;
                const statusLabel = session.isCurrent
                  ? 'সক্রিয়'
                  : session.status === 'Upcoming'
                  ? 'আসন্ন'
                  : 'আর্কাইভ';
                const admLabel =
                  session.admissionStatus === 'Open'
                    ? 'খোলা'
                    : session.admissionStatus === 'Upcoming'
                    ? 'প্রস্তুতি'
                    : 'বন্ধ';

                return (
                  <tr key={session.id}>
                    <td className="border border-slate-300 px-2.5 py-2 text-center font-bold">
                      {toBanglaDigits(idx + 1)}
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2 font-bold text-slate-900">
                      {session.nameBn}
                      <span className="block text-[10px] font-mono text-slate-600">
                        {session.year}
                      </span>
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2">
                      <div>{range.rangeLabelBn}</div>
                      {range.durationLabelBn && (
                        <span className="text-[10px] text-slate-600">
                          মেয়াদ: {range.durationLabelBn}
                        </span>
                      )}
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2 text-center font-bold">
                      {toBanglaDigits(studentCount)} জন
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2 text-center">{admLabel}</td>
                    <td className="border border-slate-300 px-2.5 py-2 text-center font-bold">
                      {statusLabel}
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2 text-[11px] text-slate-700">
                      {session.remarks || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-14 pt-6 flex items-end justify-between text-xs font-bold text-slate-800">
            <div className="text-center">
              <div className="w-36 border-t border-slate-500 pt-1">অফিস সহকারী</div>
            </div>
            <div className="text-center">
              <div className="w-44 border-t border-slate-900 pt-1">
                {schoolSettings?.principalTitle || 'প্রধান শিক্ষক'}
              </div>
              <div className="text-[10px] font-normal text-slate-600">
                {schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ➕ MODAL: ADD NEW ACADEMIC SESSION                                 */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 print:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddModalOpen(false);
              setAddFormError(null);
            }
          }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  নতুন শিক্ষাবর্ষ সংযোজন
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  প্রকৃত শুরু ও শেষের তারিখসহ নতুন শিক্ষাবর্ষ তৈরি করুন
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setAddFormError(null);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="বন্ধ করুন"
              >
                <X size={16} />
              </button>
            </div>

            {addFormError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span>{addFormError}</span>
              </div>
            )}

            <form
              onSubmit={handleAddSessionSubmit}
              className="space-y-3.5 text-xs font-semibold text-slate-800 dark:text-slate-100"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  সেশনের নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  required
                  value={newSession.nameBn}
                  onChange={(e) => {
                    setHasCustomAddName(true);
                    setNewSession({ ...newSession, nameBn: e.target.value });
                    setAddFormError(null);
                  }}
                  placeholder="যেমন: ২০২৮ শিক্ষাবর্ষ"
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    শিক্ষাবর্ষ (সাল) *
                  </label>
                  <input
                    type="number"
                    required
                    min={2000}
                    max={2100}
                    value={newSession.year}
                    onChange={(e) => handleAddYearChange(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold font-mono text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ভর্তি অবস্থা
                  </label>
                  <select
                    value={newSession.admissionStatus}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        admissionStatus: e.target.value as SessionAdmissionStatus,
                      })
                    }
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] cursor-pointer transition"
                  >
                    <option value="Open">ভর্তি খোলা (Open)</option>
                    <option value="Upcoming">ভর্তি প্রস্তুতি (Upcoming)</option>
                    <option value="Closed">ভর্তি বন্ধ (Closed)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    শুরুর তারিখ *
                  </label>
                  <input
                    type="date"
                    required
                    value={newSession.startDate}
                    onChange={(e) => {
                      setNewSession({ ...newSession, startDate: e.target.value });
                      setAddFormError(null);
                    }}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold font-mono text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    শেষের তারিখ *
                  </label>
                  <input
                    type="date"
                    required
                    min={newSession.startDate || undefined}
                    value={newSession.endDate}
                    onChange={(e) => {
                      setNewSession({ ...newSession, endDate: e.target.value });
                      setAddFormError(null);
                    }}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold font-mono text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মন্তব্য / বিবরণ
                </label>
                <input
                  type="text"
                  value={newSession.remarks}
                  onChange={(e) => setNewSession({ ...newSession, remarks: e.target.value })}
                  placeholder="যেমন: আগামী শিক্ষাবর্ষের আগাম সেশন পরিকল্পনা"
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setAddFormError(null);
                  }}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-xs cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0B5D3B] hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  সেশন সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ✏️ MODAL: EDIT SESSION                                            */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {editSessionModal && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 print:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditSessionModal(null);
              setEditFormError(null);
            }
          }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  সেশন তথ্য এডিট করুন
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  শিক্ষাবর্ষের নাম, মেয়াদ, ভর্তি অবস্থা ও মন্তব্য হালনাগাদ করুন
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditSessionModal(null);
                  setEditFormError(null);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="বন্ধ করুন"
              >
                <X size={16} />
              </button>
            </div>

            {editFormError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span>{editFormError}</span>
              </div>
            )}

            <form
              onSubmit={handleUpdateSession}
              className="space-y-3.5 text-xs font-semibold text-slate-800 dark:text-slate-100"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  সেশনের নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  required
                  value={editSessionModal.nameBn}
                  onChange={(e) => {
                    setEditSessionModal({ ...editSessionModal, nameBn: e.target.value });
                    setEditFormError(null);
                  }}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    শিক্ষাবর্ষ (সাল) *
                  </label>
                  <input
                    type="number"
                    required
                    min={2000}
                    max={2100}
                    value={editSessionModal.year}
                    onChange={(e) => {
                      setEditSessionModal({ ...editSessionModal, year: Number(e.target.value) });
                      setEditFormError(null);
                    }}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold font-mono text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ভর্তি অবস্থা
                  </label>
                  <select
                    value={editSessionModal.admissionStatus}
                    onChange={(e) =>
                      setEditSessionModal({
                        ...editSessionModal,
                        admissionStatus: e.target.value as SessionAdmissionStatus,
                      })
                    }
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] cursor-pointer transition"
                  >
                    <option value="Open">ভর্তি খোলা (Open)</option>
                    <option value="Upcoming">ভর্তি প্রস্তুতি (Upcoming)</option>
                    <option value="Closed">ভর্তি বন্ধ (Closed)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    শুরুর তারিখ *
                  </label>
                  <input
                    type="date"
                    required
                    value={editSessionModal.startDate}
                    onChange={(e) => {
                      setEditSessionModal({ ...editSessionModal, startDate: e.target.value });
                      setEditFormError(null);
                    }}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold font-mono text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    শেষের তারিখ *
                  </label>
                  <input
                    type="date"
                    required
                    min={editSessionModal.startDate || undefined}
                    value={editSessionModal.endDate}
                    onChange={(e) => {
                      setEditSessionModal({ ...editSessionModal, endDate: e.target.value });
                      setEditFormError(null);
                    }}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold font-mono text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] transition"
                  />
                </div>
              </div>

              {!editSessionModal.isCurrent && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    সেশন স্ট্যাটাস
                  </label>
                  <select
                    value={editSessionModal.status}
                    onChange={(e) =>
                      setEditSessionModal({
                        ...editSessionModal,
                        status: e.target.value as SessionLifecycleStatus,
                      })
                    }
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] cursor-pointer transition"
                  >
                    <option value="Upcoming">আসন্ন (Upcoming)</option>
                    <option value="Archived">আর্কাইভ (Archived)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মন্তব্য / বিবরণ
                </label>
                <input
                  type="text"
                  value={editSessionModal.remarks || ''}
                  onChange={(e) =>
                    setEditSessionModal({ ...editSessionModal, remarks: e.target.value })
                  }
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditSessionModal(null);
                    setEditFormError(null);
                  }}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-xs cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0B5D3B] hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
