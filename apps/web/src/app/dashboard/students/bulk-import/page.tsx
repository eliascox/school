'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Printer,
  ChevronRight,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import StudentBulkImportPanel from '@/components/StudentBulkImportPanel';

export default function BulkStudentImportPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  const handleImportSuccess = () => {
    setActiveStep(3);
    setTimeout(() => {
      router.push('/dashboard/students');
    }, 2200);
  };

  return (
    <div className="pb-10 print:pb-0">
      {/* ─── FLUSH STICKY EXECUTIVE SUB-HEADER (0px GAP UNDER HEADER) ─── */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)] dark:shadow-none print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back + Breadcrumb */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/dashboard/students"
              className="h-8 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold inline-flex items-center gap-1.5 transition shrink-0"
            >
              <ArrowLeft size={13} />
              <span>শিক্ষার্থী তালিকা</span>
            </Link>

            <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <ChevronRight size={13} />
              <span className="text-slate-800 dark:text-slate-100 font-extrabold inline-flex items-center gap-1.5">
                <FileSpreadsheet size={14} className="text-indigo-600 dark:text-indigo-400" />
                বাল্ক শিক্ষার্থী ইম্পোর্ট (Excel / CSV)
              </span>
            </div>
          </div>

          {/* Center: Clean 3-Step Workflow Indicator */}
          <div className="hidden xl:flex items-center gap-2 text-[11px] font-extrabold">
            {[
              { step: 1, label: '১. শ্রেণি ও টেমপ্লেট', icon: FileSpreadsheet },
              { step: 2, label: '২. ফাইল আপলোড ও প্রিভিউ', icon: Upload },
              { step: 3, label: '৩. ডাটাবেজে সংরক্ষণ', icon: CheckCircle2 },
            ].map((item, idx) => {
              const Icon = item.icon;
              const reached = activeStep >= item.step;
              return (
                <React.Fragment key={item.step}>
                  {idx > 0 && <div className="w-5 h-px bg-slate-200 dark:bg-slate-700" />}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                      reached
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200/70 dark:border-slate-700/70'
                    }`}
                  >
                    <Icon size={12} />
                    <span>{item.label}</span>
                  </span>
                </React.Fragment>
              );
            })}
          </div>

          {/* Right: Quick Navigation Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/dashboard/students"
              className="h-8 px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition"
            >
              <Users size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>সকল শিক্ষার্থী</span>
            </Link>
            <Link
              href="/dashboard/students?view=print"
              className="h-8 px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition"
            >
              <Printer size={13} className="text-teal-600 dark:text-teal-400" />
              <span>তালিকা প্রিন্ট</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── MAIN WORKSPACE BODY ─── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        <StudentBulkImportPanel
          onSuccess={handleImportSuccess}
          onParsedChange={(count) => setActiveStep(count > 0 ? 2 : 1)}
          compactMode={false}
        />
      </div>
    </div>
  );
}
