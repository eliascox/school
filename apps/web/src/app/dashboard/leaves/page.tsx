'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  Printer,
  Search,
  Send,
  ShieldAlert,
  X,
} from 'lucide-react';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import { leaveService, LeaveApplication } from '@/services/leaveService';
import { settingsService } from '@/services/settingsService';
import { triggerProfessionalPrint } from '@/lib/printPdfUtils';
import { toBanglaDigits } from '@/components/teacher/teacherUtils';
import { LeaveApplicationsTab } from '@/components/teacher/LeaveApplicationsTab';
import { LeaveReviewModal, PrintLeaveSlipModal } from '@/components/teacher/LeaveModals';

export default function LeaveApplicationsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [leaveFilter, setLeaveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [selectedLeaveForReview, setSelectedLeaveForReview] = useState<LeaveApplication | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected'>('approved');
  const [reviewRemarks, setReviewRemarks] = useState('ছুটি মঞ্জুর করা হলো।');
  const [printSlipLeave, setPrintSlipLeave] = useState<LeaveApplication | null>(null);

  const refreshLeaves = useCallback(() => {
    setLeaveApplications(leaveService.getLeaves());
  }, []);

  useEffect(() => {
    setMounted(true);
    const currSession = teacherAuthService.getSession();
    setSession(currSession);
    if (currSession && currSession.role !== 'admin') {
      router.replace('/dashboard/teacher-portal?tab=leaves');
      return;
    }
    refreshLeaves();
    const unsub = leaveService.subscribe(refreshLeaves);
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', refreshLeaves);
      return () => {
        unsub();
        window.removeEventListener('storage', refreshLeaves);
      };
    }
    return unsub;
  }, [refreshLeaves, router]);

  const showAlert = useCallback((type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  }, []);

  const pendingLeavesCount = useMemo(
    () => leaveApplications.filter((l) => l.status === 'pending').length,
    [leaveApplications]
  );
  const approvedLeavesCount = useMemo(
    () => leaveApplications.filter((l) => l.status === 'approved').length,
    [leaveApplications]
  );
  const rejectedLeavesCount = useMemo(
    () => leaveApplications.filter((l) => l.status === 'rejected').length,
    [leaveApplications]
  );
  const filteredLeaves = useMemo(
    () => (leaveFilter === 'all' ? leaveApplications : leaveApplications.filter((l) => l.status === leaveFilter)),
    [leaveApplications, leaveFilter]
  );

  const schoolSettings = useMemo(() => (mounted ? settingsService.getSettings() : null), [mounted]);

  const handleOpenReviewModal = (leave: LeaveApplication, status: 'approved' | 'rejected') => {
    setSelectedLeaveForReview(leave);
    setReviewDecision(status);
    setReviewRemarks(
      status === 'approved' ? 'ছুটি মঞ্জুর করা হলো।' : 'প্রশাসনিক কারণে ছুটি মঞ্জুর করা সম্ভব হলো না।'
    );
  };

  const handleConfirmReview = () => {
    if (!selectedLeaveForReview) return;
    const res = leaveService.reviewLeave(selectedLeaveForReview.id, reviewDecision, 'প্রধান শিক্ষক', reviewRemarks);
    if (res.success) {
      showAlert('success', res.message);
      setSelectedLeaveForReview(null);
      refreshLeaves();
    } else {
      showAlert('error', res.message);
    }
  };

  const handlePrintList = () => {
    const schoolName = schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান';
    triggerProfessionalPrint([schoolName, 'শিক্ষকদের ছুটির আবেদন তালিকা', '২০২৬']);
  };

  if (!mounted) {
    return (
      <div className="w-full" suppressHydrationWarning>
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3">
          <div className="animate-pulse h-9 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse h-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (session && session.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto my-12 px-4" suppressHydrationWarning>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-5 shadow-xs">
          <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200/80 dark:border-rose-800/60 flex items-center justify-center mx-auto">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">অনুমতি নেই (Access Restricted)</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            শুধুমাত্র প্রতিষ্ঠান প্রধান/অ্যাডমিন ছুটির আবেদন পর্যালোচনা ও অনুমোদন করতে পারবেন।
          </p>
          <Link
            href="/dashboard/teacher-portal?tab=leaves"
            className="inline-flex px-4 py-2.5 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition"
          >
            আমার ছুটির আবেদন প্যানেল
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-14 font-sans text-slate-900 dark:text-slate-100" suppressHydrationWarning>
      {!printSlipLeave && (
        <style>{'@media print { @page { size: A4 landscape; margin: 10mm; } }'}</style>
      )}

      <div className={printSlipLeave ? 'print-hide-when-modal print:hidden' : 'print-hide-when-modal'}>
        {/* Flush Sticky Single-Row Sub-Header */}
        <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)] dark:shadow-none print:hidden">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-[#0B5D3B] dark:text-emerald-400 shrink-0">
                <Send size={15} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  ছুটির আবেদনসমূহ
                </span>
                {pendingLeavesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-[11px] font-extrabold">
                    {toBanglaDigits(pendingLeavesCount)} বিবেচনাধীন
                  </span>
                )}
              </div>
            </div>

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
                  placeholder="শিক্ষকের নাম, আইডি বা কারণ খুঁজুন..."
                  aria-label="ছুটির আবেদন অনুসন্ধান"
                  className="h-9 pl-8 pr-8 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 w-full sm:w-64 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] transition"
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

              <button
                type="button"
                onClick={handlePrintList}
                className="h-9 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Printer size={14} />
                <span className="hidden sm:inline">প্রিন্ট</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-4 print:max-w-none print:px-0 print:pt-0">
          {alertMsg && (
            <div
              className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 border print:hidden ${
                alertMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800/60'
              }`}
            >
              {alertMsg.type === 'success' ? (
                <CheckCircle2 size={16} className="text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>{alertMsg.text}</span>
              <button
                type="button"
                onClick={() => setAlertMsg(null)}
                className="ml-auto p-1 hover:bg-black/5 rounded-lg cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <LeaveApplicationsTab
            leaveApplications={leaveApplications}
            filteredLeaves={filteredLeaves}
            leaveFilter={leaveFilter}
            setLeaveFilter={setLeaveFilter}
            pendingLeavesCount={pendingLeavesCount}
            approvedLeavesCount={approvedLeavesCount}
            rejectedLeavesCount={rejectedLeavesCount}
            onOpenReviewModal={handleOpenReviewModal}
            onPrintSlip={(l) => setPrintSlipLeave(l)}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      <LeaveReviewModal
        leave={selectedLeaveForReview}
        reviewDecision={reviewDecision}
        setReviewDecision={setReviewDecision}
        reviewRemarks={reviewRemarks}
        setReviewRemarks={setReviewRemarks}
        onClose={() => setSelectedLeaveForReview(null)}
        onConfirm={handleConfirmReview}
      />

      <PrintLeaveSlipModal leave={printSlipLeave} onClose={() => setPrintSlipLeave(null)} />
    </div>
  );
}
