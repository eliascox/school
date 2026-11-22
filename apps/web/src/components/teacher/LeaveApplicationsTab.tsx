'use client';

import React, { useMemo } from 'react';
import { Calendar, Check, CheckCircle2, Clock, Printer, Search, Send } from 'lucide-react';
import { LeaveApplication, LEAVE_TYPE_LABELS } from '@/services/leaveService';
import { toAsciiDigits, toBanglaDigits } from './teacherUtils';

interface LeaveApplicationsTabProps {
  leaveApplications: LeaveApplication[];
  filteredLeaves: LeaveApplication[];
  leaveFilter: 'all' | 'pending' | 'approved' | 'rejected';
  setLeaveFilter: (f: 'all' | 'pending' | 'approved' | 'rejected') => void;
  pendingLeavesCount: number;
  approvedLeavesCount: number;
  rejectedLeavesCount: number;
  onOpenReviewModal: (leave: LeaveApplication, status: 'approved' | 'rejected') => void;
  onPrintSlip: (leave: LeaveApplication) => void;
  searchQuery?: string;
}

export function LeaveApplicationsTab({
  leaveApplications,
  filteredLeaves,
  leaveFilter,
  setLeaveFilter,
  pendingLeavesCount,
  approvedLeavesCount,
  rejectedLeavesCount,
  onOpenReviewModal,
  onPrintSlip,
  searchQuery = '',
}: LeaveApplicationsTabProps) {
  const visibleLeaves = useMemo(() => {
    const rawQ = searchQuery.trim();
    if (!rawQ) return filteredLeaves;
    const rawLower = rawQ.toLowerCase();
    const asciiQ = toAsciiDigits(rawQ).toLowerCase();

    return filteredLeaves.filter((l) => {
      const haystack = [
        l.teacherName,
        l.teacherId,
        l.designation,
        l.reason,
        LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(rawLower) || toAsciiDigits(haystack).includes(asciiQ);
    });
  }, [filteredLeaves, searchQuery]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden p-4 sm:p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-[#0B5D3B] dark:text-emerald-400 shrink-0">
            <Send size={15} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
              শিক্ষকদের ছুটির আবেদনসমূহ
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              নৈমিত্তিক ও চিকিৎসা ছুটির আবেদন পর্যালোচনা, অনুমোদন ও মঞ্জুরিপত্র প্রিন্ট
            </p>
          </div>
        </div>

        {/* Clean Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 self-start md:self-auto bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/70 print:hidden">
          {[
            { id: 'all' as const, label: 'সকল', count: leaveApplications.length },
            { id: 'pending' as const, label: 'বিবেচনাধীন', count: pendingLeavesCount },
            { id: 'approved' as const, label: 'মঞ্জুরকৃত', count: approvedLeavesCount },
            { id: 'rejected' as const, label: 'বাতিলকৃত', count: rejectedLeavesCount },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setLeaveFilter(f.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                leaveFilter === f.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                  f.id === 'pending' && f.count > 0
                    ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {toBanglaDigits(f.count)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {visibleLeaves.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            {searchQuery.trim() ? (
              <Search size={22} className="text-slate-400" />
            ) : (
              <Send size={22} className="text-slate-400" />
            )}
          </div>
          {leaveApplications.length === 0 ? (
            <div>
              <p className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                কোনো ছুটির আবেদন নেই
              </p>
              <p className="text-xs text-slate-400 font-medium mt-1 max-w-xs mx-auto">
                শিক্ষকরা ছুটির আবেদন জমা দিলে এখানে তালিকা প্রদর্শিত হবে।
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                কোনো ম্যাচিং ছুটির আবেদন পাওয়া যায়নি
              </p>
              <p className="text-xs text-slate-400 font-medium mt-1">
                অন্য ফিল্টার নির্বাচন করুন অথবা সার্চ পরিবর্তন করুন।
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleLeaves.map((l) => (
            <div
              key={l.id}
              className="border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition bg-slate-50/30 dark:bg-slate-950/30 print:bg-white print:break-inside-avoid"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {l.teacherName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {l.teacherName}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        ({l.designation})
                      </span>
                      <span className="text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                        {l.teacherId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs font-bold text-[#0B5D3B] dark:text-emerald-400">
                        {LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        • আবেদন: {new Date(l.appliedAt).toLocaleDateString('bn-BD')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                      l.status === 'approved'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#0B5D3B] dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                        : l.status === 'rejected'
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                        : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                    }`}
                  >
                    {l.status === 'approved'
                      ? 'মঞ্জুরকৃত'
                      : l.status === 'rejected'
                      ? 'বাতিলকৃত'
                      : 'বিবেচনাধীন'}
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium border border-slate-200/70 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                  ছুটির কারণ ও বিবরণ:
                </span>
                {l.reason}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 font-bold pt-2 border-t border-slate-200/70 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
                  <span>
                    মেয়াদ: <strong>{l.startDate}</strong> হতে <strong>{l.endDate}</strong> (মোট{' '}
                    <strong>{toBanglaDigits(l.totalDays)}</strong> দিন)
                  </span>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  {l.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenReviewModal(l, 'rejected')}
                        className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        বাতিল করুন
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenReviewModal(l, 'approved')}
                        className="px-3.5 py-1.5 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1"
                      >
                        <Check size={13} /> পর্যালোচনা ও মঞ্জুর
                      </button>
                    </>
                  ) : (
                    <>
                      {l.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => onPrintSlip(l)}
                          className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Printer size={13} /> ছুটি মঞ্জুরিপত্র প্রিন্ট
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          onOpenReviewModal(l, l.status === 'approved' ? 'rejected' : 'approved')
                        }
                        className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-[11px] font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        পুনর্বিবেচনা
                      </button>
                    </>
                  )}
                </div>
              </div>

              {l.remarks && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold border ${
                    l.status === 'approved'
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 border-emerald-200/80 dark:border-emerald-800/60'
                      : 'bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 border-rose-200/80 dark:border-rose-800/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">
                    <CheckCircle2
                      size={13}
                      className={
                        l.status === 'approved'
                          ? 'text-[#0B5D3B] dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }
                    />
                    <span>সিদ্ধান্ত ({l.reviewedBy || 'প্রধান শিক্ষক'}):</span>
                    {l.reviewedAt && (
                      <span>{new Date(l.reviewedAt).toLocaleDateString('bn-BD')}</span>
                    )}
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{l.remarks}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AuditLogEntry {
  action?: string;
  category?: string;
  performedBy?: string;
  details?: string;
  timestamp?: string | number;
}

export function AuditTrailTab({
  auditLogsList,
  searchQuery = '',
}: {
  auditLogsList: AuditLogEntry[];
  searchQuery?: string;
}) {
  const visibleLogs = useMemo(() => {
    const rawQ = searchQuery.trim();
    if (!rawQ) return auditLogsList;
    const rawLower = rawQ.toLowerCase();
    const asciiQ = toAsciiDigits(rawQ).toLowerCase();

    return auditLogsList.filter((log) => {
      const haystack = [log.action, log.category, log.performedBy, log.details]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(rawLower) || toAsciiDigits(haystack).includes(asciiQ);
    });
  }, [auditLogsList, searchQuery]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
            <Clock size={15} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
              সিস্টেম অডিট ট্রেইল ও সিকিউরিটি লগ
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              উপস্থিতি, নম্বর এন্ট্রি, প্রোফাইল এডিট, ছুটি ও পারমিশন পরিবর্তনের হিস্ট্রি
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold self-start sm:self-auto">
          মোট রেকর্ড: {toBanglaDigits(visibleLogs.length)}টি
        </span>
      </div>

      {visibleLogs.length === 0 ? (
        <div className="text-center py-12 text-xs text-slate-400 font-bold">
          {auditLogsList.length === 0
            ? 'বর্তমানে কোনো অডিট লগ নেই।'
            : `"${searchQuery}" এর জন্য কোনো অডিট লগ পাওয়া যায়নি।`}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {visibleLogs.map((log, idx) => (
            <div
              key={idx}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded font-mono">
                    {log.action}
                  </span>
                  <span className="text-[10px] font-bold text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 px-2 py-0.5 rounded-md">
                    {log.category}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    সম্পাদনকারী:{' '}
                    <strong className="text-slate-700 dark:text-slate-200">
                      {log.performedBy}
                    </strong>
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium text-xs leading-relaxed">
                  {log.details}
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="text-[11px] text-slate-400 font-medium font-mono block">
                  {log.timestamp
                    ? `${new Date(log.timestamp).toLocaleDateString('bn-BD')} ${new Date(
                        log.timestamp
                      ).toLocaleTimeString('bn-BD')}`
                    : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
