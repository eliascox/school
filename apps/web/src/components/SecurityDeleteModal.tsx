'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { systemResetService, SystemPurgeReport } from '@/services/systemResetService';

interface SecurityDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (report: SystemPurgeReport) => void;
  performedBy?: string;
}

export const SecurityDeleteModal: React.FC<SecurityDeleteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  performedBy = 'প্রধান শিক্ষক / অ্যাডমিন'
}) => {
  const [comment, setComment] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const isCommentValid = comment.trim().length >= 3;

  const handleQuickFill = (text: string) => {
    setComment(text);
    setErrorMsg('');
  };

  const handleExecuteDelete = () => {
    if (!isCommentValid) {
      setErrorMsg('নিরাপত্তার স্বার্থে অনুগ্রহ করে কমপক্ষে ৩ অক্ষরের একটি কমেন্ট বা কারণ লিখুন।');
      return;
    }

    setIsDeleting(true);
    setErrorMsg('');

    try {
      const report = systemResetService.purgeAllSystemData(comment.trim(), performedBy);
      setTimeout(() => {
        setIsDeleting(false);
        if (onSuccess) {
          onSuccess(report);
        }
        onClose();
      }, 400);
    } catch (e: any) {
      setIsDeleting(false);
      setErrorMsg(e?.message || 'ডেটা মোছার সময় ত্রুটি ঘটেছে!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/50 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/60 px-2.5 py-0.5 rounded-full inline-block mb-1">
                নিরাপত্তা যাচাইকরণ (Security Verification)
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                সকল স্তরের ডেমো ডাটা স্থায়ীভাবে মুছে ফেলা
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Synchronized Layers Explanation */}
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              যেসব স্তরের ডেমো ডাটা সম্পূর্ণ সিংক ও মুছে যাবে:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span><strong>শিক্ষার্থী স্তর:</strong> সকল শিক্ষার্থী, ছবি ও ভর্তি আবেদন</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span><strong>পরীক্ষা স্তর:</strong> ৬ষ্ঠ-১০ম শ্রেণির সংরক্ষিত নম্বর ও রেজাল্ট</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span><strong>ফি ও লেজার:</strong> ফি কালেকশন, রসিদ ও শিক্ষার্থী লেজার</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span><strong>ক্যাশ ও ব্যাংক:</strong> ভাউচার, বেতন ও ব্যাংক স্থিতি <strong>৳০</strong> হবে</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span><strong>উপস্থিতি:</strong> সকল ক্লাসের দৈনিক হাজিরা রেকর্ড</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span><strong>নোটিশ ও এসএমএস:</strong> নোটিশ বোর্ড ও মেসেজ লগ ইতিহাস</span>
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>সতর্কতা:</strong> এটি একটি অপরিবর্তনীয় নিরাপত্তা পদক্ষেপ। একবার মুছে ফেললে পূর্বের কোনো রেকর্ড পুনরুদ্ধার করা সম্ভব হবে না।
            </p>
          </div>

          {/* Comment Requirement Box */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                নিরাপত্তা কমেন্ট / মুছে ফেলার কারণ লিখুন:
                <span className="text-red-500 font-bold">*</span>
              </span>
              <span className={`text-[10px] font-mono ${isCommentValid ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                {comment.trim().length} / ৩+ অক্ষর
              </span>
            </label>

            <textarea
              rows={2}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="যেমন: 'সকল ডেমো মুছে ফ্রেশ স্টার্ট' অথবা 'DELETE' লিখুন..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none font-medium transition-all"
              autoFocus
            />

            {/* Quick Fill Helpers */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">দ্রুত পূরণ করতে ক্লিক করুন:</span>
              <button
                type="button"
                onClick={() => handleQuickFill('সকল ডেমো মুছে ফ্রেশ স্টার্ট')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                "সকল ডেমো মুছে ফ্রেশ স্টার্ট"
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('DELETE')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-mono font-bold transition-colors cursor-pointer"
              >
                "DELETE"
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {errorMsg}
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
          >
            বাতিল
          </button>

          <button
            type="button"
            onClick={handleExecuteDelete}
            disabled={!isCommentValid || isDeleting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all ${
              isCommentValid && !isDeleting
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 cursor-pointer active:scale-95'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
            }`}
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>সকল স্তরের ডেটা মোছা হচ্ছে...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>কমেন্ট নিশ্চিত করে স্থায়ীভাবে মুছুন</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
