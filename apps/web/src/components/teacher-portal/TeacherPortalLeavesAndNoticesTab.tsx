'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Calendar,
  ExternalLink,
  Pin,
  Printer,
  Search,
  Send,
  X,
} from 'lucide-react';
import {
  leaveService,
  LEAVE_TYPE_LABELS,
  type LeaveApplication,
  type LeaveType,
} from '@/services/leaveService';
import type { Notice } from '@/services/noticeService';
import { settingsService } from '@/services/settingsService';
import { triggerProfessionalPrint } from '@/lib/printPdfUtils';
import { confirmDialog } from '@/components/ui/ToastProvider';
import { toBnDigit } from './teacherPortalUtils';

// ─── 1. LEAVE APPLICATIONS TAB ───────────────────────────────────────────────

interface TeacherPortalLeavesTabProps {
  leaves: LeaveApplication[];
  teacherId: string;
  teacherName: string;
  designation: string;
  onRefreshData: () => void;
  onPrintLeaveSlip: (leave: LeaveApplication) => void;
  showAlert: (type: 'success' | 'error', text: string) => void;
}

export function TeacherPortalLeavesTab({
  leaves,
  teacherId,
  teacherName,
  designation,
  onRefreshData,
  onPrintLeaveSlip,
  showAlert,
}: TeacherPortalLeavesTabProps) {
  const [leaveType, setLeaveType] = useState<LeaveType>('casual');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('all');

  const computedDays = useMemo(() => {
    if (!leaveStart || !leaveEnd) return 0;
    const sDate = new Date(leaveStart);
    const eDate = new Date(leaveEnd);
    if (Number.isNaN(sDate.getTime()) || Number.isNaN(eDate.getTime())) return 0;
    const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [leaveStart, leaveEnd]);

  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    for (const l of leaves) {
      if (l.status === 'pending') pending++;
      else if (l.status === 'approved') approved++;
      else if (l.status === 'rejected') rejected++;
    }
    return { all: leaves.length, pending, approved, rejected };
  }, [leaves]);

  const filteredLeaves = useMemo(
    () =>
      statusFilter === 'all'
        ? leaves
        : leaves.filter((l) => l.status === statusFilter),
    [leaves, statusFilter]
  );

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd) {
      showAlert('error', 'ছুটির শুরুর ও শেষের তারিখ নির্বাচন করুন!');
      return;
    }
    if (new Date(leaveEnd) < new Date(leaveStart)) {
      showAlert('error', 'শেষের তারিখ শুরুর তারিখের আগে হতে পারবে না!');
      return;
    }
    if (!leaveReason.trim() || leaveReason.trim().length < 5) {
      showAlert('error', 'ছুটির কারণ কমপক্ষে ৫ অক্ষরে বিস্তারিত লিখুন!');
      return;
    }

    const totalDays = computedDays || 1;
    setLeaveSubmitting(true);
    const res = leaveService.submitLeave({
      teacherId: teacherId || 'TCH-101',
      teacherName: teacherName || 'সহকারী শিক্ষক',
      designation: designation || 'সহকারী শিক্ষক',
      leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      totalDays,
      reason: leaveReason.trim(),
    });
    setLeaveSubmitting(false);

    if (res.success) {
      showAlert('success', res.message);
      setLeaveReason('');
      setLeaveStart('');
      setLeaveEnd('');
      onRefreshData();
    } else {
      showAlert('error', res.message);
    }
  };

  const handleCancelLeave = async (leaveId: string) => {
    const ok = await confirmDialog({
      title: 'ছুটির আবেদন প্রত্যাহার',
      message: 'আপনি কি নিশ্চিতভাবে এই ছুটির আবেদনটি প্রত্যাহার করতে চান?',
      confirmLabel: 'প্রত্যাহার করুন',
      danger: true,
    });
    if (!ok) return;

    const res = leaveService.cancelLeave(leaveId, teacherId);
    if (res.success) {
      showAlert('success', res.message);
      onRefreshData();
    } else {
      showAlert('error', res.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left: Submit Leave Application Form */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Send size={15} />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-sm">
              ছুটির আবেদন (প্রধান শিক্ষক বরাবর)
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              নৈমিত্তিক, চিকিৎসা বা জরুরি ছুটির আবেদন দাখিল করুন
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitLeave} className="space-y-3.5 text-xs font-bold">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">
              ছুটির ধরন
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
            >
              {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">
                শুরুর তারিখ *
              </label>
              <input
                type="date"
                value={leaveStart}
                onChange={(e) => {
                  setLeaveStart(e.target.value);
                  if (!leaveEnd) setLeaveEnd(e.target.value);
                }}
                required
                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">
                শেষের তারিখ *
              </label>
              <input
                type="date"
                value={leaveEnd}
                min={leaveStart || undefined}
                onChange={(e) => setLeaveEnd(e.target.value)}
                required
                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
              />
            </div>
          </div>

          {computedDays > 0 && (
            <div className="px-3 py-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-bold text-[#0B5D3B] dark:text-emerald-300 flex items-center justify-between">
              <span>নির্বাচিত ছুটির মেয়াদ</span>
              <span className="font-mono font-extrabold">
                মোট {toBnDigit(computedDays)} দিন
              </span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">
              ছুটির সুনির্দিষ্ট কারণ *
            </label>
            <textarea
              rows={4}
              placeholder="ছুটির কারণ বিস্তারিত উল্লেখ করুন..."
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
            />
          </div>

          <button
            type="submit"
            disabled={leaveSubmitting}
            className="w-full h-10 bg-[#0B5D3B] hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Send size={14} />
            <span>
              {leaveSubmitting
                ? 'সাবমিট হচ্ছে...'
                : 'প্রধান শিক্ষক বরাবর আবেদন প্রেরণ'}
            </span>
          </button>
        </form>
      </div>

      {/* Right: Leave Applications History & Print Slip */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
              আমার ছুটির আবেদন হিস্ট্রি
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              আবেদনের স্ট্যাটাস যাচাই, প্রত্যাহার এবং মঞ্জুরিপত্র প্রিন্ট করুন
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/70 self-start sm:self-auto">
            {(
              [
                { id: 'all', label: 'সকল', count: counts.all },
                { id: 'pending', label: 'বিবেচনাধীন', count: counts.pending },
                { id: 'approved', label: 'মঞ্জুর', count: counts.approved },
                { id: 'rejected', label: 'বাতিল', count: counts.rejected },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{f.label}</span>
                <span className="font-mono text-[10px] opacity-80">
                  ({toBnDigit(f.count)})
                </span>
              </button>
            ))}
          </div>
        </div>

        {filteredLeaves.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-bold rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800">
            {leaves.length === 0
              ? 'এখনও কোনো ছুটির আবেদন করা হয়নি।'
              : 'নির্বাচিত স্ট্যাটাসে কোনো ছুটির আবেদন নেই।'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeaves.map((l) => (
              <div
                key={l.id}
                className="border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 space-y-2.5 bg-slate-50/40 dark:bg-slate-950/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType}
                    </span>
                    <span className="ml-2 text-[10px] font-mono text-slate-400">
                      #{l.id}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                      l.status === 'approved'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                        : l.status === 'rejected'
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                    }`}
                  >
                    {l.status === 'approved'
                      ? 'মঞ্জুরকৃত'
                      : l.status === 'rejected'
                      ? 'বাতিলকৃত'
                      : 'বিবেচনাধীন'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-800">
                  {l.reason}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold pt-2 border-t border-slate-200/70 dark:border-slate-800">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar
                      size={13}
                      className="text-[#0B5D3B] dark:text-emerald-400 shrink-0"
                    />
                    <span>
                      {l.startDate} হতে {l.endDate} (মোট {toBnDigit(l.totalDays)} দিন)
                    </span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onPrintLeaveSlip(l)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] font-bold transition cursor-pointer"
                    >
                      <Printer size={12} />
                      <span>
                        {l.status === 'approved'
                          ? 'মঞ্জুরিপত্র প্রিন্ট'
                          : 'স্লিপ প্রিন্ট'}
                      </span>
                    </button>

                    {l.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleCancelLeave(l.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 text-[11px] font-bold transition cursor-pointer"
                      >
                        প্রত্যাহার
                      </button>
                    )}
                  </div>
                </div>

                {l.remarks && (
                  <div
                    className={`p-2.5 rounded-lg text-xs font-semibold border ${
                      l.status === 'approved'
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 border-emerald-200/80 dark:border-emerald-800/60'
                        : 'bg-rose-50/60 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 border-rose-200/80 dark:border-rose-800/60'
                    }`}
                  >
                    পর্যালোচনা মন্তব্য ({l.reviewedBy || 'প্রধান শিক্ষক'}): {l.remarks}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 2. TEACHER LEAVE SLIP PRINT MODAL ───────────────────────────────────────

export function TeacherLeaveSlipModal({
  leave,
  onClose,
}: {
  leave: LeaveApplication | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!leave) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [leave, onClose]);

  if (!leave) return null;

  const schoolSettings = settingsService.getSettings();
  const schoolName = schoolSettings.schoolName || 'শিক্ষা প্রতিষ্ঠান';
  const schoolAddress = schoolSettings.address || '';
  const estdYear = schoolSettings.estdYear || '';
  const principalTitle = schoolSettings.principalTitle || 'প্রধান শিক্ষক';

  const isApproved = leave.status === 'approved';
  const isRejected = leave.status === 'rejected';
  const slipTitle = isApproved
    ? 'শিক্ষক ছুটি মঞ্জুরিপত্র (LEAVE APPROVAL SLIP)'
    : isRejected
    ? 'ছুটির আবেদন সিদ্ধান্তপত্র (LEAVE DECISION SLIP)'
    : 'শিক্ষক ছুটির আবেদনপত্র (LEAVE APPLICATION SLIP)';

  const handlePrint = () => {
    triggerProfessionalPrint([schoolName, 'Leave_Slip', leave.id]);
  };

  return (
    <div className="print-modal-active fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 print:static print:bg-white print:p-0">
      {/* Plain <style> tag (SWC safe — never <style jsx global>) */}
      <style>{'@media print { @page { size: A4 portrait; margin: 12mm; } }'}</style>

      <div className="bg-white dark:bg-slate-900 print:bg-white print:text-black rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl print:shadow-none print:max-w-none space-y-5 border border-slate-200 dark:border-slate-800 print:border-0">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <Printer size={16} className="text-[#0B5D3B] dark:text-emerald-400" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
              ছুটির স্লিপ প্রিভিউ ও প্রিন্ট
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X size={16} />
          </button>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 print:border-slate-900 rounded-xl p-6 bg-white dark:bg-slate-900 print:bg-white text-slate-900 dark:text-white print:text-black space-y-4 font-sans">
          <div className="text-center border-b-2 border-slate-900 pb-3 space-y-0.5">
            <h2 className="text-lg font-black text-slate-900 dark:text-white print:text-black">
              {schoolName}
            </h2>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 print:text-slate-800">
              {schoolAddress}
              {schoolAddress && estdYear ? ' • ' : ''}
              {estdYear ? `স্থাপিত: ${estdYear} ইং` : ''}
            </p>
            <div className="inline-block px-3 py-0.5 mt-1.5 bg-slate-900 text-white rounded-md text-[11px] font-extrabold tracking-wide">
              {slipTitle}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 print:text-slate-800 font-bold">
            <span>স্মারক নং: SMS/LEV/{leave.id}/2026</span>
            <span>
              তারিখ:{' '}
              {new Date(leave.reviewedAt || leave.appliedAt).toLocaleDateString(
                'bn-BD'
              )}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 print:bg-white border border-slate-200 dark:border-slate-800 print:border-slate-300 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400 print:text-slate-700 font-bold">
                শিক্ষকের নাম:
              </span>
              <strong className="text-slate-900 dark:text-white print:text-black text-right">
                {leave.teacherName}
              </strong>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400 print:text-slate-700 font-bold">
                পদবি ও শিক্ষক আইডি:
              </span>
              <span className="text-slate-800 dark:text-slate-100 print:text-black font-bold text-right">
                {leave.designation} ({leave.teacherId})
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400 print:text-slate-700 font-bold">
                ছুটির প্রকারভেদ:
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white print:text-black text-right">
                {LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400 print:text-slate-700 font-bold">
                ছুটির মেয়াদ:
              </span>
              <span className="font-extrabold text-[#0B5D3B] dark:text-emerald-300 print:text-black text-right">
                {leave.startDate} হতে {leave.endDate} পর্যন্ত (মোট{' '}
                {toBnDigit(leave.totalDays)} দিন)
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400 print:text-slate-700 font-bold">
                আবেদনের অবস্থান:
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white print:text-black">
                {isApproved
                  ? 'মঞ্জুরকৃত'
                  : isRejected
                  ? 'বাতিলকৃত'
                  : 'প্রধান শিক্ষকের অনুমোদনের অপেক্ষায়'}
              </span>
            </div>
            <div className="flex justify-between gap-3 border-t border-slate-200 dark:border-slate-800 print:border-slate-300 pt-2">
              <span className="text-slate-500 dark:text-slate-400 print:text-slate-700 font-bold shrink-0">
                ছুটির কারণ:
              </span>
              <span className="text-slate-800 dark:text-slate-100 print:text-black text-right">
                {leave.reason}
              </span>
            </div>
          </div>

          {(leave.remarks || isApproved) && (
            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/50 print:bg-slate-50 border border-emerald-200 dark:border-emerald-800/60 print:border-slate-300 rounded-xl text-xs text-emerald-950 dark:text-emerald-200 print:text-black">
              <strong className="block mb-0.5">
                {principalTitle}-এর মন্তব্য ও নির্দেশনা:
              </strong>
              <p className="font-semibold">
                {leave.remarks || 'ছুটি যথাযথ নিয়মে মঞ্জুর করা হলো।'}
              </p>
            </div>
          )}

          <div className="pt-10 flex justify-between items-end text-xs font-bold text-slate-800 dark:text-slate-100 print:text-black">
            <div className="text-center">
              <div className="w-32 border-t border-slate-400 dark:border-slate-700 print:border-slate-900 pt-1">
                শিক্ষকের স্বাক্ষর
              </div>
            </div>
            <div className="text-center">
              <div className="w-36 border-t-2 border-slate-900 pt-1 font-black text-slate-900 dark:text-white print:text-black">
                {principalTitle}
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 print:text-slate-700 font-normal">
                  {schoolName}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            বন্ধ করুন
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="h-9 px-4 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
          >
            <Printer size={14} />
            <span>প্রিন্ট / PDF সংরক্ষণ</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 3. NOTICES TAB (VIEW-ONLY) ──────────────────────────────────────────────

interface TeacherPortalNoticesTabProps {
  notices: Notice[];
}

export function TeacherPortalNoticesTab({
  notices,
}: TeacherPortalNoticesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [noticeFilter, setNoticeFilter] = useState<'all' | 'urgent' | 'pinned'>(
    'all'
  );

  const sortedAndFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...notices]
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return (
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
      })
      .filter((n) => {
        if (noticeFilter === 'urgent' && n.priority !== 'urgent') return false;
        if (noticeFilter === 'pinned' && !n.isPinned) return false;
        if (!q) return true;
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.publisherName.toLowerCase().includes(q)
        );
      });
  }, [notices, searchQuery, noticeFilter]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-4 sm:p-5 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Bell size={15} />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
              প্রতিষ্ঠানিক নোটিশ বোর্ড (View-only)
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              বিদ্যালয় প্রশাসন ও প্রধান শিক্ষক কর্তৃক প্রকাশিত সকল জরুরি বিজ্ঞপ্তি
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="নোটিশ খুঁজুন..."
              className="h-9 pl-8 pr-7 w-full sm:w-52 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="অনুসন্ধান মুছুন"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="inline-flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
            {(
              [
                { id: 'all', label: 'সকল' },
                { id: 'urgent', label: 'জরুরি' },
                { id: 'pinned', label: 'পিনকৃত' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setNoticeFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  noticeFilter === f.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {sortedAndFiltered.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 font-bold rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800">
          কোনো প্রকাশিত নোটিশ পাওয়া যায়নি।
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedAndFiltered.map((n) => (
            <div
              key={n.id}
              className="border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 bg-slate-50/40 dark:bg-slate-950/30 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug">
                    {n.title}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    {n.isPinned && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                        <Pin size={10} />
                        পিন
                      </span>
                    )}
                    {n.priority === 'urgent' && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 rounded-md">
                        জরুরি
                      </span>
                    )}
                    {n.priority === 'important' && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 rounded-md">
                        গুরুত্বপূর্ণ
                      </span>
                    )}
                  </div>
                </div>

                {n.refNo && (
                  <p className="text-[10px] font-mono font-semibold text-slate-400">
                    {n.refNo}
                  </p>
                )}

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                  {n.content}
                </p>

                {n.attachmentUrl && (
                  <a
                    href={n.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0B5D3B] dark:text-emerald-400 hover:underline pt-1"
                  >
                    <ExternalLink size={12} />
                    <span>সংযুক্ত বিজ্ঞপ্তি দেখুন</span>
                  </a>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold pt-2.5 border-t border-slate-200/70 dark:border-slate-800">
                <span>প্রকাশক: {n.publisherName}</span>
                <span>
                  {new Date(n.publishedAt).toLocaleDateString('bn-BD')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
