'use client';

import React from 'react';
import { Layers, Printer, SlidersHorizontal, Trash2 } from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';
import { PrintLayoutConfig, SSCTestimonialRecord } from './sscTranscriptUtils';
import SSCTestimonialSheetCard from './SSCTestimonialSheetCard';

export interface SscBatchPrintTabProps {
  batchPrintList: SSCTestimonialRecord[];
  schoolSettings: SchoolSettings;
  layoutConfig: PrintLayoutConfig;
  activeBorderUrl: string | null;
  qrCodeDataUrls: Record<string, string>;
  hasActiveSinglePreview: boolean;
  onToggleLayoutDrawer: () => void;
  onPreviewSingle: (rec: SSCTestimonialRecord) => void;
  onRemoveFromBatch: (index: number, studentName: string) => void;
  onPrint: () => void;
}

export default function SscBatchPrintTab({
  batchPrintList,
  schoolSettings,
  layoutConfig,
  activeBorderUrl,
  qrCodeDataUrls,
  hasActiveSinglePreview,
  onToggleLayoutDrawer,
  onPreviewSingle,
  onRemoveFromBatch,
  onPrint,
}: SscBatchPrintTabProps) {
  return (
    <div className={`space-y-6 ${hasActiveSinglePreview ? 'print:hidden' : ''}`}>
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-bold print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-black text-slate-950 dark:text-white text-base">
              ব্যাচ প্রিন্ট প্রিভিউ ({batchPrintList.length} জন পরীক্ষার্থী)
            </h3>
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 rounded font-mono font-bold text-[10px]">
              9.2&quot; × 8.2&quot; A4/Custom
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            প্রতিটি প্রশংসাপত্র সুনির্দিষ্ট ৯.২ ইঞ্চি প্রস্থ ও ৮.২ ইঞ্চি উচ্চতায় আলাদা পৃষ্ঠায় প্রিন্ট হবে।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onToggleLayoutDrawer}
            className="px-3.5 py-2 bg-amber-50 dark:bg-amber-950/50 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800/60 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <SlidersHorizontal size={14} className="text-amber-700 dark:text-amber-300" /> সাইজ/মার্জিন টিউন
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Printer size={16} /> এখনই বাল্ক প্রিন্ট করুন ({batchPrintList.length} জনের সনদ)
          </button>
        </div>
      </div>

      {batchPrintList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm print:hidden">
          <Layers size={32} className="mx-auto text-slate-300 mb-2" />
          <h4 className="font-black text-slate-700 dark:text-slate-300">কোনো পরীক্ষার্থীর প্রশংসাপত্র তৈরি হয়নি</h4>
          <p className="text-xs text-slate-400 mt-1">
            &quot;বাল্ক প্রশংসাপত্র জেনারেটর&quot; ট্যাব থেকে CSV আপলোড করুন অথবা &quot;সবার প্রশংসাপত্র তৈরি ও প্রিন্ট&quot; বাটনে ক্লিক করুন।
          </p>
        </div>
      ) : (
        <div className="testimonial-sheet-wrapper space-y-8 print:space-y-0">
          {batchPrintList.map((rec, idx) => (
            <div key={rec.id || idx} className="print:break-after-page print:page-break-after-always">
              <div className="flex items-center justify-between max-w-[9.2in] mx-auto mb-2 px-4 py-2 bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-sm print:hidden">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 font-black flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-black text-white">{rec.studentName}</span>
                  <span className="text-slate-400 font-mono text-[11px]">| রোল: {rec.boardRoll || '—'}</span>
                  <span className="text-emerald-400 text-[11px]">
                    | GPA {rec.gpa} ({rec.gradeLetter})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onPreviewSingle(rec)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="শুধুমাত্র এই সনদটি আলাদাভাবে প্রিন্ট করুন"
                  >
                    <Printer size={13} /> সনদটি প্রিন্ট
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveFromBatch(idx, rec.studentName)}
                    className="p-1.5 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 rounded-xl text-xs transition cursor-pointer"
                    title="বাল্ক তালিকা থেকে বাদ দিন"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="bg-slate-200/80 dark:bg-slate-800/80 p-4 sm:p-8 rounded-3xl flex justify-center overflow-x-auto print:p-0 print:bg-transparent print:rounded-none print:shadow-none print:w-full print:block">
                <SSCTestimonialSheetCard
                  record={rec}
                  schoolSettings={schoolSettings}
                  layoutConfig={layoutConfig}
                  borderImageUrl={activeBorderUrl || ''}
                  qrCodeUrl={qrCodeDataUrls[rec.id]}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
