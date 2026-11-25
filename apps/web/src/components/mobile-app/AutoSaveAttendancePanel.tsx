'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Cloud,
  LayoutGrid,
  List,
  Loader2,
  Lock,
  MessageSquare,
  Phone,
  Search,
  X,
} from 'lucide-react';
import { UserSession } from '@/services/teacherAuthService';
import { ClassTeacherAssignment, teacherRBACService } from '@/services/teacherRBACService';
import { attendanceService, StudentAttendanceRecord } from '@/services/attendanceService';
import { smsService } from '@/services/smsService';
import { localDateKey } from '@/lib/dateUtils';
import {
  parseClassTeacherClassId,
  saveClassTeacherDailyAttendance,
} from '@/lib/teacherMobileUtils';

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

const branchLabel = (b: string) => {
  const m: Record<string, string> = {
    A: 'ক শাখা (A)',
    B: 'খ শাখা (B)',
    C: 'গ শাখা (C)',
    Science: 'বিজ্ঞান',
    Humanities: 'মানবিক',
    Commerce: 'ব্যবসায়',
  };
  return m[b] || b;
};

const QUICK_ABSENT_REASONS = ['অসুস্থতা', 'পারিবারিক কাজ', 'ছুটির আবেদন', 'বিনা নোটিশে'] as const;

interface FastAttRowProps {
  st: StudentAttendanceRecord;
  viewMode: 'compact' | 'detailed';
  onStatus: (studentId: string, status: 'Present' | 'Absent' | 'Leave') => void;
  onReason: (studentId: string, reason: string) => void;
}

const FastAttRow = memo(function FastAttRow({ st, viewMode, onStatus, onReason }: FastAttRowProps) {
  const rollBg =
    st.status === 'Present'
      ? 'bg-emerald-600 text-white'
      : st.status === 'Absent'
      ? 'bg-rose-600 text-white'
      : 'bg-amber-500 text-slate-950';

  if (viewMode === 'compact') {
    return (
      <div
        className={`px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-b-0 space-y-1.5 transition-colors ${
          st.status === 'Absent'
            ? 'bg-rose-50/45 dark:bg-rose-950/20'
            : st.status === 'Leave'
            ? 'bg-amber-50/45 dark:bg-amber-950/20'
            : 'bg-white dark:bg-slate-900'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className={`w-7 h-7 rounded-lg font-mono font-black text-[11px] flex items-center justify-center shrink-0 ${rollBg}`}>
              {st.roll}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate">{st.name}</p>
              {st.reason && (st.status === 'Absent' || st.status === 'Leave') && (
                <p className="text-[9.5px] font-bold text-rose-600 dark:text-rose-400 truncate">{st.reason}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onStatus(st.id, 'Present')}
              aria-label={`${st.name} উপস্থিত`}
              className={`w-9 h-8 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center justify-center ${
                st.status === 'Present'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              উ
            </button>
            <button
              type="button"
              onClick={() => onStatus(st.id, 'Absent')}
              aria-label={`${st.name} অনুপস্থিত`}
              className={`w-9 h-8 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center justify-center ${
                st.status === 'Absent'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              অ
            </button>
            <button
              type="button"
              onClick={() => onStatus(st.id, 'Leave')}
              aria-label={`${st.name} ছুটি`}
              className={`w-9 h-8 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center justify-center ${
                st.status === 'Leave'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              ছু
            </button>
          </div>
        </div>

        {(st.status === 'Absent' || st.status === 'Leave') && (
          <div className="flex items-center gap-1 flex-wrap pl-9">
            {QUICK_ABSENT_REASONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onReason(st.id, preset)}
                className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold transition cursor-pointer ${
                  st.reason === preset
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Detailed Card Mode
  const cardTone =
    st.status === 'Present'
      ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 border-l-emerald-500'
      : st.status === 'Absent'
      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/90 dark:border-rose-800/60 border-l-rose-500'
      : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/90 dark:border-amber-800/60 border-l-amber-500';

  return (
    <div className={`p-3 rounded-2xl border border-l-4 transition shadow-2xs space-y-2.5 ${cardTone}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-8 h-8 rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 ${rollBg}`}>
            {st.roll}
          </span>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{st.name}</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">
              {st.guardian}
              {st.mobile ? ` • ${st.mobile}` : ''}
            </p>
          </div>
        </div>
        {st.mobile && (
          <a
            href={`tel:${st.mobile}`}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0"
            title="অভিভাবককে কল করুন"
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => onStatus(st.id, 'Present')}
          className={`py-2 rounded-xl text-[11px] font-black transition cursor-pointer flex items-center justify-center gap-1 ${
            st.status === 'Present'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          <span>উপস্থিত</span>
        </button>
        <button
          type="button"
          onClick={() => onStatus(st.id, 'Absent')}
          className={`py-2 rounded-xl text-[11px] font-black transition cursor-pointer flex items-center justify-center gap-1 ${
            st.status === 'Absent'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <X className="w-3.5 h-3.5" />
          <span>অনুপস্থিত</span>
        </button>
        <button
          type="button"
          onClick={() => onStatus(st.id, 'Leave')}
          className={`py-2 rounded-xl text-[11px] font-black transition cursor-pointer flex items-center justify-center gap-1 ${
            st.status === 'Leave'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>ছুটি</span>
        </button>
      </div>

      {(st.status === 'Absent' || st.status === 'Leave') && (
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center gap-1 flex-wrap">
            {QUICK_ABSENT_REASONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onReason(st.id, preset)}
                className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition cursor-pointer ${
                  st.reason === preset
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={st.reason || ''}
            onChange={(e) => onReason(st.id, e.target.value)}
            placeholder="অন্য কোনো কারণ লিখুন..."
            className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[11px] font-medium outline-none focus:border-teal-500"
          />
        </div>
      )}
    </div>
  );
});

interface AutoSaveAttendancePanelProps {
  session: UserSession;
  isAdmin: boolean;
  teacherIdentifier: string;
  myClassTeachers: ClassTeacherAssignment[];
  attGrade: string;
  setAttGrade: (g: string) => void;
  attBranch: string;
  setAttBranch: (b: string) => void;
  onGoToMarks: () => void;
  onStatsChange?: (stats: { total: number; present: number; absent: number; leave: number; rate: number }) => void;
}

export default function AutoSaveAttendancePanel({
  session,
  isAdmin,
  teacherIdentifier,
  myClassTeachers,
  attGrade,
  setAttGrade,
  attBranch,
  setAttBranch,
  onGoToMarks,
  onStatsChange,
}: AutoSaveAttendancePanelProps) {
  const [attDate, setAttDate] = useState<string>(() => localDateKey());
  const [attRecords, setAttRecords] = useState<StudentAttendanceRecord[]>([]);
  const [attSearch, setAttSearch] = useState('');
  const [attStatusFilter, setAttStatusFilter] = useState<'all' | 'Present' | 'Absent' | 'Leave'>('all');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');

  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [smsBanner, setSmsBanner] = useState<string>('');

  const isClassTeacher = isAdmin || myClassTeachers.length > 0;
  const isAttClass9or10 = attGrade === '9th' || attGrade === '10th';

  const latestRecordsRef = useRef<StudentAttendanceRecord[]>([]);
  const cloudSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCloudSyncRef = useRef<boolean>(false);
  const contextRef = useRef({ date: attDate, grade: attGrade, branch: attBranch });

  const flushCloudSync = useCallback(() => {
    if (cloudSyncTimerRef.current) {
      clearTimeout(cloudSyncTimerRef.current);
      cloudSyncTimerRef.current = null;
    }
    if (!pendingCloudSyncRef.current || latestRecordsRef.current.length === 0) return;

    const ctx = contextRef.current;
    const res = saveClassTeacherDailyAttendance({
      session,
      date: ctx.date,
      grade: ctx.grade,
      branch: ctx.branch,
      records: latestRecordsRef.current,
      mode: 'auto',
      skipCloudSync: false,
    });
    pendingCloudSyncRef.current = false;

    if (res.success) {
      setAutoSaveState('saved');
      setLastSavedTime(res.savedTimeBn || '');
      setErrorMsg('');
    } else {
      setAutoSaveState('error');
      setErrorMsg(res.message);
    }
  }, [session]);

  // Flush cloud sync on unmount or visibilitychange
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden' && pendingCloudSyncRef.current) {
        flushCloudSync();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (pendingCloudSyncRef.current) flushCloudSync();
    };
  }, [flushCloudSync]);

  // Load attendance for current class & date
  useEffect(() => {
    if (pendingCloudSyncRef.current) flushCloudSync();
    contextRef.current = { date: attDate, grade: attGrade, branch: attBranch };

    const classKey = `${attGrade}-${attBranch}`;
    if (!isAdmin && !teacherRBACService.canTakeClassAttendance(teacherIdentifier, classKey)) {
      setAttRecords([]);
      latestRecordsRef.current = [];
      return;
    }
    const records = attendanceService.getAttendance(attDate, attGrade, attBranch);
    setAttRecords(records);
    latestRecordsRef.current = records;
    setAutoSaveState('idle');
    setErrorMsg('');
    setSmsBanner('');
  }, [isAdmin, teacherIdentifier, attDate, attGrade, attBranch, flushCloudSync]);

  const attStats = useMemo(() => {
    const present = attRecords.filter((r) => r.status === 'Present').length;
    const absent = attRecords.filter((r) => r.status === 'Absent').length;
    const leave = attRecords.filter((r) => r.status === 'Leave').length;
    const total = attRecords.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, leave, rate };
  }, [attRecords]);

  useEffect(() => {
    onStatsChange?.(attStats);
  }, [attStats, onStatsChange]);

  // Instant 0ms local auto-save + 800ms debounced cloud sync
  const persistInstantAutoSave = useCallback(
    (nextRecords: StudentAttendanceRecord[], delayMs = 800) => {
      latestRecordsRef.current = nextRecords;
      setAttRecords(nextRecords);

      const ctx = contextRef.current;
      const localRes = saveClassTeacherDailyAttendance({
        session,
        date: ctx.date,
        grade: ctx.grade,
        branch: ctx.branch,
        records: nextRecords,
        mode: 'auto',
        skipCloudSync: true,
      });

      if (!localRes.success) {
        setAutoSaveState('error');
        setErrorMsg(localRes.message);
        return;
      }

      setErrorMsg('');
      setAutoSaveState('syncing');
      setLastSavedTime(localRes.savedTimeBn || '');
      pendingCloudSyncRef.current = true;

      if (cloudSyncTimerRef.current) clearTimeout(cloudSyncTimerRef.current);
      cloudSyncTimerRef.current = setTimeout(() => {
        flushCloudSync();
      }, delayMs);
    },
    [session, flushCloudSync]
  );

  const handleAttStatus = useCallback(
    (studentId: string, status: 'Present' | 'Absent' | 'Leave') => {
      const next = latestRecordsRef.current.map((st) =>
        st.id === studentId ? { ...st, status, reason: status === 'Present' ? '' : st.reason } : st
      );
      persistInstantAutoSave(next, 800);
    },
    [persistInstantAutoSave]
  );

  const handleAttReason = useCallback(
    (studentId: string, reason: string) => {
      const next = latestRecordsRef.current.map((st) => (st.id === studentId ? { ...st, reason } : st));
      persistInstantAutoSave(next, 600);
    },
    [persistInstantAutoSave]
  );

  const handleMarkAll = useCallback(
    (status: 'Present' | 'Absent') => {
      const next = latestRecordsRef.current.map((st) => ({ ...st, status, reason: '' }));
      persistInstantAutoSave(next, 400);
    },
    [persistInstantAutoSave]
  );

  const handleSendAbsentSms = () => {
    const absentees = attRecords.filter((r) => r.status === 'Absent' && r.mobile && r.mobile.length >= 11);
    if (absentees.length === 0) {
      setSmsBanner('অনুপস্থিত শিক্ষার্থীদের কোনো বৈধ অভিভাবক মোবাইল নম্বর পাওয়া যায়নি।');
      setTimeout(() => setSmsBanner(''), 3000);
      return;
    }
    let sent = 0;
    absentees.forEach((st) => {
      try {
        smsService.sendSMS({
          recipient: st.mobile,
          message: `প্রিয় অভিভাবক, আপনার সন্তান ${st.name} (${gradeLabel(attGrade)}, রোল ${st.roll}) আজ (${attDate}) বিদ্যালয়ে অনুপস্থিত রয়েছে।`,
          type: 'attendance_alert',
          targetAudience: 'individual',
          recipientName: st.name,
          studentId: st.id,
          class: attGrade,
          roll: String(st.roll),
        });
        sent++;
      } catch {
        // Skip failed item
      }
    });
    setSmsBanner(`${toBnDigit(sent)} জন অনুপস্থিত শিক্ষার্থীর অভিভাবককে SMS অ্যালার্ট পাঠানো হয়েছে।`);
    setTimeout(() => setSmsBanner(''), 4000);
  };

  const filteredAttRecords = useMemo(() => {
    const q = attSearch.trim().toLowerCase();
    return attRecords.filter((r) => {
      if (attStatusFilter !== 'all' && r.status !== attStatusFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        String(r.roll).toLowerCase().includes(q) ||
        String(r.mobile || '').includes(q)
      );
    });
  }, [attRecords, attSearch, attStatusFilter]);

  if (!isClassTeacher) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-amber-200/90 dark:border-amber-800/60 text-center space-y-3.5 shadow-2xs">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/60 dark:to-orange-950/40 text-amber-600 dark:text-amber-300 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/50">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            শুধুমাত্র শ্রেণি শিক্ষকের জন্য অনুমোদিত
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            আপনাকে বর্তমানে কোনো শ্রেণির <strong>শ্রেণি শিক্ষক (Class Teacher)</strong> হিসেবে নিযুক্ত করা হয়নি। শুধুমাত্র নির্ধারিত শ্রেণি শিক্ষক নিজ শ্রেণির দৈনিক হাজিরা নিতে পারবেন।
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToMarks}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer shadow-sm"
        >
          বরাদ্দকৃত বিষয়ের নম্বর এন্ট্রিতে যান →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sticky Instant Auto-Save Status Bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          {autoSaveState === 'syncing' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-teal-500 animate-spin shrink-0" />
              <span className="text-[11px] font-black text-teal-700 dark:text-teal-300 truncate">
                অটো-সেভ ও সিঙ্ক হচ্ছে...
              </span>
            </>
          ) : autoSaveState === 'saved' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 truncate">
                অটো-সেভড ✓ {lastSavedTime ? `(${lastSavedTime})` : ''}
              </span>
            </>
          ) : autoSaveState === 'error' ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="text-[11px] font-black text-rose-600 truncate">অনুমতি/সেভ ত্রুটি</span>
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 truncate">
                ১-ট্যাপ অটো-সেভ চালু ✓
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('compact')}
              title="দ্রুত ১-সারি রোল-কল"
              className={`p-1 rounded-md transition cursor-pointer ${
                viewMode === 'compact'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('detailed')}
              title="বিস্তারিত কার্ড ভিউ"
              className={`p-1 rounded-md transition cursor-pointer ${
                viewMode === 'detailed'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[10.5px] font-black font-mono">
            {toBnDigit(attStats.rate)}%
          </span>
        </div>
      </div>

      {/* Date & Assigned Class Picker */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">তারিখ</label>
            <input
              type="date"
              value={attDate}
              onChange={(e) => setAttDate(e.target.value)}
              aria-label="হাজিরার তারিখ"
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11.5px] font-bold text-slate-900 dark:text-white outline-none focus:border-teal-500"
            />
          </div>

          {!isAdmin ? (
            <div className="col-span-7">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                আমার শ্রেণি ({toBnDigit(myClassTeachers.length)}টি)
              </label>
              <select
                value={`${attGrade}-${attBranch}`}
                onChange={(e) => {
                  const parsed = parseClassTeacherClassId(e.target.value);
                  setAttGrade(parsed.grade);
                  setAttBranch(parsed.branch);
                }}
                aria-label="দায়িত্বপ্রাপ্ত শ্রেণি"
                className="w-full px-2.5 py-2 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-[11.5px] font-black text-teal-950 dark:text-teal-200 outline-none focus:border-teal-500"
              >
                {myClassTeachers.map((ct) => {
                  const p = parseClassTeacherClassId(ct.classId);
                  return (
                    <option key={ct.id} value={`${p.grade}-${p.branch}`}>
                      {gradeLabel(p.grade)} — {branchLabel(p.branch)}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <div className="col-span-7 grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">শ্রেণি</label>
                <select
                  value={attGrade}
                  onChange={(e) => {
                    const g = e.target.value;
                    setAttGrade(g);
                    setAttBranch(g === '9th' || g === '10th' ? 'Science' : 'A');
                  }}
                  aria-label="শ্রেণি"
                  className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11.5px] font-bold"
                >
                  <option value="6th">৬ষ্ঠ</option>
                  <option value="7th">৭ম</option>
                  <option value="8th">৮ম</option>
                  <option value="9th">৯ম</option>
                  <option value="10th">১০ম</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">শাখা/বিভাগ</label>
                <select
                  value={attBranch}
                  onChange={(e) => setAttBranch(e.target.value)}
                  aria-label="শাখা"
                  className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11.5px] font-bold"
                >
                  {isAttClass9or10 ? (
                    <>
                      <option value="Science">বিজ্ঞান</option>
                      <option value="Humanities">মানবিক</option>
                      <option value="Commerce">ব্যবসায়</option>
                    </>
                  ) : (
                    <>
                      <option value="A">ক শাখা</option>
                      <option value="B">খ শাখা</option>
                      <option value="C">গ শাখা</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Stacked Progress Bar */}
        {attStats.total > 0 && (
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(attStats.present / attStats.total) * 100}%` }} />
            <div className="h-full bg-amber-400 transition-all" style={{ width: `${(attStats.leave / attStats.total) * 100}%` }} />
            <div className="h-full bg-rose-500 transition-all" style={{ width: `${(attStats.absent / attStats.total) * 100}%` }} />
          </div>
        )}

        {/* Filterable KPI Tiles */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          {(
            [
              { key: 'all', label: 'মোট', val: attStats.total, base: 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white', active: 'ring-2 ring-slate-900 dark:ring-white' },
              { key: 'Present', label: 'উপস্থিত', val: attStats.present, base: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300', active: 'ring-2 ring-emerald-500' },
              { key: 'Absent', label: 'অনুপস্থিত', val: attStats.absent, base: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300', active: 'ring-2 ring-rose-500' },
              { key: 'Leave', label: 'ছুটি', val: attStats.leave, base: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300', active: 'ring-2 ring-amber-500' },
            ] as const
          ).map((tile) => (
            <button
              key={tile.key}
              type="button"
              onClick={() => setAttStatusFilter(tile.key)}
              className={`p-2 rounded-xl border transition cursor-pointer ${tile.base} ${
                attStatusFilter === tile.key ? tile.active : ''
              }`}
            >
              <span className="text-sm font-black block font-mono leading-tight">{toBnDigit(tile.val)}</span>
              <span className="text-[9.5px] font-bold opacity-80">{tile.label}</span>
            </button>
          ))}
        </div>

        {/* 1-Tap Bulk Actions + Search */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleMarkAll('Present')}
            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black cursor-pointer flex items-center justify-center gap-1 shadow-2xs transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>সবাই উপস্থিত</span>
          </button>
          <button
            type="button"
            onClick={() => handleMarkAll('Absent')}
            className="flex-1 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-black cursor-pointer flex items-center justify-center gap-1 transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>সবাই অনুপস্থিত</span>
          </button>
        </div>

        {attStats.absent > 0 && (
          <button
            type="button"
            onClick={handleSendAbsentSms}
            className="w-full py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-black flex items-center justify-center gap-1.5 cursor-pointer transition"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>অনুপস্থিতদের অভিভাবকে SMS অ্যালার্ট ({toBnDigit(attStats.absent)} জন)</span>
          </button>
        )}

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={attSearch}
            onChange={(e) => setAttSearch(e.target.value)}
            placeholder="রোল বা নাম খুঁজুন..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {smsBanner && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{smsBanner}</span>
        </div>
      )}

      {/* Roll-Call List */}
      {filteredAttRecords.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 font-bold">
          {attRecords.length === 0 ? 'এই শ্রেণিতে কোনো শিক্ষার্থী নিবন্ধিত নেই।' : 'নির্বাচিত ফিল্টারে কোনো শিক্ষার্থী নেই।'}
        </div>
      ) : viewMode === 'compact' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300">
            <span>রোল ও শিক্ষার্থী</span>
            <span>উ (উপস্থিত) · অ (অনুপস্থিত) · ছু (ছুটি)</span>
          </div>
          <div>
            {filteredAttRecords.map((st) => (
              <FastAttRow
                key={st.id}
                st={st}
                viewMode="compact"
                onStatus={handleAttStatus}
                onReason={handleAttReason}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredAttRecords.map((st) => (
            <FastAttRow
              key={st.id}
              st={st}
              viewMode="detailed"
              onStatus={handleAttStatus}
              onReason={handleAttReason}
            />
          ))}
        </div>
      )}
    </div>
  );
}
