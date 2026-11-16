'use client';

import React from 'react';
import { Calendar, Check, CheckCircle2, Clock, Printer, Send } from 'lucide-react';
import { LeaveApplication, LEAVE_TYPE_LABELS } from '@/services/leaveService';

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
}: LeaveApplicationsTabProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5 sm:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Send size={18} className="text-amber-600 dark:text-amber-400" />
            শিক্ষকদের ছুটির আবেদনসমূহ (প্রধান শিক্ষক পর্যালোচনা ও অনুমোদন)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            সহকারী ও শ্রেণি শিক্ষকদের দাখিলকৃত নৈমিত্তিক ও চিকিৎসা ছুটির আবেদন পর্যালোচনা, সিদ্ধান্ত ও প্রত্যয়ন
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          {[
            { id: 'all' as const, label: 'সব আবেদন', count: leaveApplications.length },
            { id: 'pending' as const, label: 'বিবেচনাধীন', count: pendingLeavesCount },
            { id: 'approved' as const, label: 'মঞ্জুরকৃত', count: approvedLeavesCount },
            { id: 'rejected' as const, label: 'বাতিলকৃত', count: rejectedLeavesCount },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setLeaveFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                leaveFilter === f.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  f.id === 'pending' && f.count > 0
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filteredLeaves.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-100 dark:border-amber-800/60 flex items-center justify-center shadow-sm">
            <Send size={36} className="text-amber-400 stroke-1" />
          </div>
          {leaveApplications.length === 0 ? (
            <>
              <div>
                <p className="text-base font-black text-slate-700 dark:text-slate-300">কোনো ছুটির আবেদন নেই</p>
                <p className="text-xs text-slate-400 font-medium mt-1 max-w-xs mx-auto">
                  শিক্ষকরা ছুটির আবেদন জমা দিলে এখানে তালিকা প্রদর্শিত হবে।
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-xs text-slate-500 dark:text-slate-400 font-medium max-w-sm">
                💡 শিক্ষক তালিকা থেকে যেকোনো শিক্ষকের প্রোফাইলে গিয়ে ছুটির আবেদন করা যাবে।
              </div>
            </>
          ) : (
            <div>
              <p className="text-base font-black text-slate-700 dark:text-slate-300">এই ফিল্টারে কোনো আবেদন নেই</p>
              <p className="text-xs text-slate-400 font-medium mt-1">
                অন্য ফিল্টার নির্বাচন করুন অথবা &quot;সব আবেদন&quot; দেখুন।
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeaves.map((l) => (
            <div
              key={l.id}
              className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 hover:border-amber-300 dark:hover:border-amber-700 transition shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                    {l.teacherName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-white text-sm">{l.teacherName}</span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">({l.designation})</span>
                      <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                        {l.teacherId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
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
                    className={`text-[11px] font-black px-3 py-1 rounded-full ${
                      l.status === 'approved'
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60'
                        : l.status === 'rejected'
                        ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60'
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 animate-pulse'
                    }`}
                  >
                    {l.status === 'approved' ? '✓ মঞ্জুরকৃত' : l.status === 'rejected' ? '✕ বাতিলকৃত' : '⏳ বিবেচনাধীন (Pending)'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium border border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">ছুটির কারণ ও বিবরণ:</span>
                {l.reason}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 font-bold pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>
                    ছুটির মেয়াদ: <strong>{l.startDate}</strong> হতে <strong>{l.endDate}</strong> পর্যন্ত (মোট{' '}
                    <strong>{l.totalDays}</strong> দিন)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {l.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenReviewModal(l, 'rejected')}
                        className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-black transition cursor-pointer active:scale-95"
                      >
                        ✕ বিবেচনা বাতিল
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenReviewModal(l, 'approved')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <Check size={13} /> ✓ পর্যালোচনা ও মঞ্জুর
                      </button>
                    </>
                  ) : (
                    <>
                      {l.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => onPrintSlip(l)}
                          className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                        >
                          <Printer size={13} /> ছুটি মঞ্জুরিপত্র প্রিন্ট
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenReviewModal(l, l.status === 'approved' ? 'rejected' : 'approved')}
                        className="px-2.5 py-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[11px] font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
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
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-rose-50/80 dark:bg-rose-950/50 text-rose-950 dark:text-rose-200 border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">
                    <CheckCircle2
                      size={13}
                      className={
                        l.status === 'approved'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }
                    />
                    <span>সিদ্ধান্ত প্রদানকারী ({l.reviewedBy || 'প্রধান শিক্ষক'}):</span>
                    {l.reviewedAt && <span>{new Date(l.reviewedAt).toLocaleDateString('bn-BD')}</span>}
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

export function AuditTrailTab({ auditLogsList }: { auditLogsList: any[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Clock size={18} className="text-indigo-600 dark:text-indigo-400" />
            সিস্টেম অডিট ট্রেইল ও সিকিউরিটি লগ
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            উপস্থিতি, নম্বর এন্ট্রি, প্রোফাইল এডিট, ছুটি ও পারমিশন পরিবর্তনের পূর্ণাঙ্গ লগ হিস্ট্রি
          </p>
        </div>
        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-200 rounded-xl text-xs font-black self-start sm:self-auto">
          মোট রেকর্ড: {auditLogsList.length}টি
        </span>
      </div>

      {auditLogsList.length === 0 ? (
        <div className="text-center py-12 text-xs text-slate-400 font-bold">বর্তমানে কোনো অডিট লগ নেই।</div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {auditLogsList.map((log, idx) => (
            <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 dark:text-white text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md font-mono">
                    {log.action}
                  </span>
                  <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">
                    {log.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    সম্পাদনকারী: <strong className="text-slate-700 dark:text-slate-300">{log.performedBy}</strong>
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium text-[11px]">{log.details}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 font-bold block">
                  {new Date(log.timestamp).toLocaleDateString('bn-BD')} {new Date(log.timestamp).toLocaleTimeString('bn-BD')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
