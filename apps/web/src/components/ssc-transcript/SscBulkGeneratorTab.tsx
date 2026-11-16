'use client';

import React from 'react';
import { Award, Download, Eye, FileSpreadsheet, Printer, Search, Upload, Users } from 'lucide-react';
import { Student } from '@/services/studentService';
import { translateGroupToEnglish } from './sscTranscriptUtils';

export interface SscBulkGeneratorTabProps {
  sscCandidates: Student[];
  passingYearFilter: string;
  setPassingYearFilter: (val: string) => void;
  groupFilter: string;
  setGroupFilter: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  bulkProcessing: boolean;
  onDownloadExcelTemplate: () => void;
  onDownloadCsvTemplate: () => void;
  onBulkFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPrepareAllForBatch: () => void;
  onPrintSingleCandidate: (s: Student, idx: number) => void;
  onQuickPreviewCandidate: (s: Student, idx: number) => void;
  onEditStudentForSingle: (s: Student) => void;
}

export default function SscBulkGeneratorTab({
  sscCandidates,
  passingYearFilter,
  setPassingYearFilter,
  groupFilter,
  setGroupFilter,
  searchQuery,
  setSearchQuery,
  bulkProcessing,
  onDownloadExcelTemplate,
  onDownloadCsvTemplate,
  onBulkFileUpload,
  onPrepareAllForBatch,
  onPrintSingleCandidate,
  onQuickPreviewCandidate,
  onEditStudentForSingle,
}: SscBulkGeneratorTabProps) {
  return (
    <div className="space-y-6 print:hidden">
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-black text-slate-950 dark:text-white text-base flex items-center gap-2">
              <Award size={20} className="text-amber-500" />
              এসএসসি পরীক্ষার্থীদের বাল্ক প্রশংসাপত্র জেনারেটর (Official English Testimonials)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              নির্ধারিত সাইজ ৯.২&quot; × ৮.২&quot; এবং চারপাশের নিরাপদ মার্জিন অনুযায়ী ইংরেজি প্রশংসাপত্র প্রস্তুত ও বাল্ক প্রিন্ট।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">পরীক্ষার সন:</span>
              <input
                type="text"
                value={passingYearFilter}
                onChange={(e) => setPassingYearFilter(e.target.value)}
                className="w-24 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-xs text-center"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">বিভাগ/গ্রুপ:</span>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                <option value="all">সকল বিভাগ (All Groups)</option>
                <option value="Science">বিজ্ঞান (Science)</option>
                <option value="Humanities">মানবিক (Humanities)</option>
                <option value="Business Studies">ব্যবসায় শিক্ষা (Business Studies)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="p-5 bg-emerald-50/70 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 rounded-3xl space-y-3 text-xs font-bold">
            <div className="flex items-center justify-between">
              <span className="text-emerald-950 dark:text-emerald-200 uppercase text-[10px] font-black tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet size={15} className="text-emerald-700 dark:text-emerald-300" />
                ধাপ ১: শিক্ষার্থীর তথ্য ছক এক্সেল নমুনা ফাইল ডাউনলোড
              </span>
              <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 dark:text-emerald-200 rounded-md text-[10px] font-mono font-bold">
                Excel .xlsx
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-medium">
              ১০ম শ্রেণির শিক্ষার্থীদের তথ্যসহ (নাম, পিতা-মাতা, সেশন, জন্মতারিখ) এক্সেল ফাইল নামিয়ে বোর্ড রোল ও জিপিএ পূরণ করুন।
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={onDownloadExcelTemplate}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl cursor-pointer shadow-md transition flex items-center justify-center gap-2 text-xs active:scale-95"
                title="Microsoft Excel ফরম্যাটে নমুনা ফাইল ডাউনলোড করুন"
              >
                <FileSpreadsheet size={16} /> এক্সেল নমুনা ফাইল (.xlsx)
              </button>
              <button
                type="button"
                onClick={onDownloadCsvTemplate}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 dark:text-white font-black rounded-2xl cursor-pointer shadow-md transition flex items-center justify-center gap-2 text-xs active:scale-95"
                title="CSV ফরম্যাটে নমুনা ফাইল ডাউনলোড করুন"
              >
                <Download size={15} /> CSV নমুনা ফাইল (.csv)
              </button>
            </div>
          </div>

          <div className="p-5 bg-indigo-50/60 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/60 rounded-3xl space-y-3 text-xs font-bold">
            <div className="flex items-center justify-between">
              <span className="text-indigo-950 dark:text-indigo-200 uppercase text-[10px] font-black tracking-wider flex items-center gap-1.5">
                <Upload size={15} className="text-indigo-700 dark:text-indigo-300" />
                ধাপ ২: পূরণকৃত Excel / CSV আপলোড ও বাল্ক জেনারেট
              </span>
              <span className="px-2 py-0.5 bg-indigo-200 text-indigo-900 dark:text-indigo-200 rounded-md text-[10px] font-mono font-bold">
                .xlsx / .csv
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-medium">
              বোর্ড রোল ও জিপিএ পূরণকৃত Excel (.xlsx) অথবা CSV ফাইল আপলোড করুন। সাথে সাথে সবার প্রশংসাপত্র তৈরি হয়ে যাবে।
            </p>
            <label className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl cursor-pointer shadow-md transition flex items-center justify-center gap-2 text-xs active:scale-95 mt-1">
              <Upload size={16} /> {bulkProcessing ? 'প্রসেসিং হচ্ছে...' : 'পূরণকৃত Excel / CSV ফাইল আপলোড করুন'}
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={onBulkFileUpload}
                disabled={bulkProcessing}
                className="sr-only"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
              ১০ম শ্রেণি / এসএসসি পরীক্ষার্থীদের তালিকা ({sscCandidates.length} জন)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              নিচের যেকোনো পরীক্ষার্থীর জন্য একক প্রশংসাপত্র প্রিভিউ করুন অথবা সবার জন্য একসাথে বাল্ক প্রিন্ট চাপুন।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="নাম বা ক্লাস রোল দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none"
              />
            </div>

            <button
              type="button"
              onClick={onDownloadExcelTemplate}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="১০ম শ্রেণির শিক্ষার্থীদের তথ্যসহ এক্সেল ফাইল নামান"
            >
              <FileSpreadsheet size={15} /> এক্সেল ছক ডাউনলোড
            </button>

            <button
              type="button"
              onClick={onPrepareAllForBatch}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Printer size={15} /> সবার সনদ বাল্ক প্রিন্ট ({sscCandidates.length} জন)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs font-medium">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">রোল</th>
                <th className="p-3">শিক্ষার্থীর নাম</th>
                <th className="p-3">পিতার নাম</th>
                <th className="p-3">মাতার নাম</th>
                <th className="p-3">বিভাগ (Group)</th>
                <th className="p-3">জন্ম তারিখ</th>
                <th className="p-3 text-right">একশন ও প্রিন্ট</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-800 dark:text-slate-100">
              {sscCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    কোনো পরীক্ষার্থী পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                sscCandidates.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800 transition">
                    <td className="p-3 font-mono font-black text-indigo-700 dark:text-indigo-300">{s.roll}</td>
                    <td className="p-3 font-black text-slate-950 dark:text-white">{s.name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{s.fatherName || '—'}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{s.motherName || '—'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-md text-[11px] font-bold">
                        {translateGroupToEnglish(s.group)}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{s.dob || '—'}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onPrintSingleCandidate(s, idx)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          title="এই শিক্ষার্থীর প্রশংসাপত্র প্রিন্ট করুন"
                        >
                          <Printer size={13} /> সনদটি প্রিন্ট
                        </button>
                        <button
                          type="button"
                          onClick={() => onQuickPreviewCandidate(s, idx)}
                          className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="প্রিভিউ দেখুন"
                        >
                          <Eye size={13} /> প্রিভিউ
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditStudentForSingle(s)}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                          title="তথ্য পরিবর্তন করুন"
                        >
                          এডিট
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
