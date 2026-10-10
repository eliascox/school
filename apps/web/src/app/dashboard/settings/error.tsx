'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function SettingsErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[SETTINGS PAGE ERROR BOUNDARY CAUGHT]:', error);
  }, [error]);

  const handleClearCacheAndReset = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('sms_exam_names');
        // If current session had corrupted year string, reset it
        const sess = localStorage.getItem('sms_current_session');
        if (sess && !sess.startsWith('{')) {
          localStorage.removeItem('sms_current_session');
        }
        window.location.reload();
      } catch (e) {
        window.location.reload();
      }
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-rose-200 dark:border-rose-900/60 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center shadow-md">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            সেটিংস পেজ লোড হতে সমস্যা হয়েছে
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            ব্রাউজার ক্যাশ বা কোনো পূর্ববর্তী তথ্যের সাংঘর্ষিকতার কারণে পৃষ্ঠাটি লোড করা সম্ভব হয়নি। নিচের বাটন চেপে পুনরায় চেষ্টা করুন।
          </p>
          {error?.message && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-left border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ত্রুটির বিবরণ:</span>
              <code className="text-xs font-mono text-rose-600 dark:text-rose-400 break-all">{error.message}</code>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-4 h-4" /> পুনরায় চেষ্টা করুন
          </button>
          <button
            type="button"
            onClick={handleClearCacheAndReset}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            ক্যাশ রিসেট ও রিলোড
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <Home className="w-3.5 h-3.5" /> ড্যাশবোর্ড হোমে ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  );
}
