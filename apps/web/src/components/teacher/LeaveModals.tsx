'use client';

import React from 'react';
import { Check, Printer, Send, X } from 'lucide-react';
import { LeaveApplication, LEAVE_TYPE_LABELS } from '@/services/leaveService';

interface LeaveReviewModalProps {
  leave: LeaveApplication | null;
  reviewDecision: 'approved' | 'rejected';
  setReviewDecision: (d: 'approved' | 'rejected') => void;
  reviewRemarks: string;
  setReviewRemarks: (r: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function LeaveReviewModal({
  leave,
  reviewDecision,
  setReviewDecision,
  reviewRemarks,
  setReviewRemarks,
  onClose,
  onConfirm,
}: LeaveReviewModalProps) {
  if (!leave) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Send size={18} className="text-amber-600 dark:text-amber-400" />
            ছুটির আবেদন পর্যালোচনা ও সিদ্ধান্ত
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-black text-slate-900 dark:text-white text-sm">{leave.teacherName}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                {leave.designation} • ID: {leave.teacherId}
              </p>
            </div>
            <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded-lg text-xs font-black">
              {LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType}
            </span>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <span>
              মেয়াদ: <strong>{leave.startDate}</strong> হতে <strong>{leave.endDate}</strong>
            </span>
            <span className="font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
              মোট {leave.totalDays} দিন
            </span>
          </div>
          <div className="text-xs bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white block mb-0.5">আবেদনের কারণ:</strong>
            {leave.reason}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">প্রধান শিক্ষকের সিদ্ধান্ত:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setReviewDecision('approved');
                setReviewRemarks('ছুটি মঞ্জুর করা হলো।');
              }}
              className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                reviewDecision === 'approved'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
              }`}
            >
              <Check size={14} /> ✓ মঞ্জুর করুন (Approve)
            </button>
            <button
              type="button"
              onClick={() => {
                setReviewDecision('rejected');
                setReviewRemarks('প্রশাসনিক কারণে ছুটি মঞ্জুর করা সম্ভব হলো না।');
              }}
              className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                reviewDecision === 'rejected'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/40'
              }`}
            >
              <X size={14} /> ✕ বাতিল করুন (Reject)
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">কুইক মন্তব্য সিলেক্ট করুন:</label>
          <div className="flex flex-wrap gap-1.5">
            {(reviewDecision === 'approved'
              ? [
                  'ছুটি মঞ্জুর করা হলো।',
                  'পরীক্ষার পূর্বে ক্লাস সমন্বয় সাপেক্ষে মঞ্জুর।',
                  'জরুরি পারিবারিক কারণে মঞ্জুর করা হলো।',
                  'চিকিৎসা সনদের ভিত্তিতে ৩ দিনের বিশ্রাম মঞ্জুর।',
                ]
              : [
                  'প্রশাসনিক কারণে ছুটি মঞ্জুর করা সম্ভব হলো না।',
                  'একাডেমিক পরীক্ষা চলাকালীন ছুটি গ্রহণযোগ্য নয়।',
                  'একই দিনে একাধিক শিক্ষকের অনুপস্থিতি থাকায় স্থগিত।',
                ]
            ).map((remark, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setReviewRemarks(remark)}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-bold transition cursor-pointer"
              >
                {remark}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">পর্যালোচনা ও নির্দেশনা মন্তব্য:</label>
          <textarea
            value={reviewRemarks}
            onChange={(e) => setReviewRemarks(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="কোনো বিশেষ নির্দেশনা থাকলে লিখুন..."
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 text-white rounded-xl text-xs font-black shadow-sm transition cursor-pointer flex items-center gap-1.5 ${
              reviewDecision === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            <Check size={14} /> সিদ্ধান্ত সংরক্ষণ করুন
          </button>
        </div>
      </div>
    </div>
  );
}

export function PrintLeaveSlipModal({
  leave,
  onClose,
}: {
  leave: LeaveApplication | null;
  onClose: () => void;
}) {
  if (!leave) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">ছুটি মঞ্জুরিপত্র প্রিভিউ ও প্রিন্ট</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-white space-y-4 font-sans">
          <div className="text-center border-b-2 border-slate-900 pb-3 space-y-0.5">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">বরইতলী উচ্চ বিদ্যালয়</h2>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">ডাকঘর: বরইতলী, চকরিয়া, কক্সবাজার • স্থাপিত: ১৯৬৮ ইং</p>
            <div className="inline-block px-3 py-0.5 mt-1 bg-slate-900 text-white rounded-md text-[11px] font-black uppercase tracking-wider">
              শিক্ষক ছুটি মঞ্জুরিপত্র (LEAVE APPROVAL SLIP)
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-bold">
            <span>স্মারক নং: SMS/LEV/{leave.id}/2026</span>
            <span>তারিখ: {new Date(leave.reviewedAt || leave.appliedAt).toLocaleDateString('bn-BD')}</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-bold">শিক্ষকের নাম:</span>
              <strong className="text-slate-900 dark:text-white">{leave.teacherName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-bold">পদবি ও শিক্ষক আইডি:</span>
              <span className="text-slate-800 dark:text-slate-100 font-bold">
                {leave.designation} ({leave.teacherId})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-bold">ছুটির প্রকারভেদ:</span>
              <span className="font-extrabold text-indigo-900 dark:text-indigo-200">
                {LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-bold">মঞ্জুরকৃত ছুটির মেয়াদ:</span>
              <span className="font-extrabold text-emerald-800 dark:text-emerald-200">
                {leave.startDate} হতে {leave.endDate} পর্যন্ত (মোট {leave.totalDays} দিন)
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-bold">ছুটির কারণ:</span>
              <span className="text-slate-800 dark:text-slate-100 text-right max-w-xs">{leave.reason}</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-950 dark:text-emerald-200">
            <strong className="block mb-0.5">প্রধান শিক্ষকের অনুমোদন ও নির্দেশনা:</strong>
            <p className="font-semibold">{leave.remarks || 'ছুটি যথাযথ নিয়মে মঞ্জুর করা হলো।'}</p>
          </div>

          <div className="pt-10 flex justify-between items-end text-xs font-bold text-slate-800 dark:text-slate-100">
            <div className="text-center">
              <div className="w-32 border-t border-slate-400 dark:border-slate-700 pt-1">শিক্ষকের স্বাক্ষর</div>
            </div>
            <div className="text-center">
              <div className="w-36 border-t-2 border-slate-900 pt-1 font-black text-slate-900 dark:text-white">
                প্রধান শিক্ষক
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-normal">বরইতলী উচ্চ বিদ্যালয়</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            বন্ধ করুন
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm transition cursor-pointer flex items-center gap-1.5"
          >
            <Printer size={14} /> প্রিন্ট করুন (Print Slip)
          </button>
        </div>
      </div>
    </div>
  );
}
