'use client';

import React from 'react';
import { Printer, X, Camera, Sparkles, Upload, Image as ImageIcon, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import SchoolPadWrapper from '@/components/SchoolPadWrapper';
import { SchoolSettings } from '@/services/settingsService';
import { BulkPhotoItemView, StudentRecord } from './studentTypes';

interface StudentBlankPadModalProps {
  schoolSettings: SchoolSettings;
  onClose: () => void;
}

export function StudentBlankPadModal({ schoolSettings, onClose }: StudentBlankPadModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 print:p-0 print:bg-white print:relative print:z-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 print:shadow-none print:border-none print:p-0 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 print:hidden">
          <div>
            <h3 className="font-black text-slate-950 dark:text-white text-base flex items-center gap-2">
              <Printer className="text-emerald-600 dark:text-emerald-400" size={18} />
              ফাঁকা স্কুল প্যাড প্রিন্ট প্রিভিউ (Blank School Letterhead)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              মার্জিন: উপরে {schoolSettings?.padMargins?.top ?? 0.5}&quot; | বামে {schoolSettings?.padMargins?.left ?? 0.5}&quot; | ডানে{' '}
              {schoolSettings?.padMargins?.right ?? 0.5}&quot; | নিচে {schoolSettings?.padMargins?.bottom ?? 0.5}&quot;
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={15} /> প্রিন্ট করুন (A4)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="py-2">
          <SchoolPadWrapper
            settings={schoolSettings}
            mode="blank_pad"
            title=""
            hideHeaderActions={true}
            signatures={[
              {
                title: schoolSettings?.principalName || 'মোহাম্মদ রফিকুল ইসলাম',
                designation: schoolSettings?.principalTitle || 'প্রধান শিক্ষক',
                institution: schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
                address: schoolSettings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার।',
                rightAligned: true,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

interface StudentBulkPhotoModalProps<B extends BulkPhotoItemView> {
  students: StudentRecord[];
  bulkPhotos: B[];
  bulkTargetGrade: string;
  setBulkTargetGrade: (grade: string) => void;
  isBulkDragging: boolean;
  setIsBulkDragging: (dragging: boolean) => void;
  bulkFileInputRef: React.RefObject<HTMLInputElement | null>;
  onFilesAdded: (files: FileList) => Promise<void>;
  onSaveBulkPhotos: () => void;
  onClearAll: () => void;
  onReassignStudent: (idx: number, studentId: string) => void;
  onRemoveItem: (idx: number) => void;
  onClose: () => void;
}

export function StudentBulkPhotoModal<B extends BulkPhotoItemView>({
  students,
  bulkPhotos,
  bulkTargetGrade,
  setBulkTargetGrade,
  isBulkDragging,
  setIsBulkDragging,
  bulkFileInputRef,
  onFilesAdded,
  onSaveBulkPhotos,
  onClearAll,
  onReassignStudent,
  onRemoveItem,
  onClose,
}: StudentBulkPhotoModalProps<B>) {
  const matchedCount = bulkPhotos.filter((p) => p.matchedStudentId).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                বাল্ক ছবি ড্রাগ ও ড্রপ আপলোডার (Bulk Photo Upload)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                একসাথে একাধিক শিক্ষার্থীর ছবি টেনে এনে ছেড়ে দিন, স্বয়ংক্রিয়ভাবে রোল বা আইডি অনুযায়ী মিলে যাবে
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/50 dark:bg-purple-950/20 p-3.5 rounded-2xl border border-purple-100 dark:border-purple-900/30">
            <div className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple-600 dark:text-purple-400" />
              <span>রোল নম্বর দিয়ে নির্ভুল ম্যাচ করতে শ্রেণি নির্ধারণ করুন:</span>
            </div>
            <select
              value={bulkTargetGrade}
              onChange={(e) => setBulkTargetGrade(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-black text-purple-900 dark:text-purple-200 outline-none cursor-pointer"
            >
              <option value="all">সকল শ্রেণি (All Classes)</option>
              <option value="6th">৬ষ্ঠ শ্রেণি (6th)</option>
              <option value="7th">৭ম শ্রেণি (7th)</option>
              <option value="8th">৮ম শ্রেণি (8th)</option>
              <option value="9th">৯ম শ্রেণি (9th)</option>
              <option value="10th">১০ম শ্রেণি (10th)</option>
            </select>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsBulkDragging(true);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsBulkDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsBulkDragging(false);
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsBulkDragging(false);
              if (e.dataTransfer.files) await onFilesAdded(e.dataTransfer.files);
            }}
            onClick={() => bulkFileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer select-none ${
              isBulkDragging
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/50 scale-[1.01] shadow-inner'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-purple-400 dark:hover:border-purple-700 hover:bg-purple-50/30 dark:hover:bg-purple-950/50'
            }`}
          >
            <input
              type="file"
              ref={bulkFileInputRef}
              multiple
              accept="image/*"
              onChange={(e) => {
                if (e.target.files) void onFilesAdded(e.target.files);
              }}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-sm">
                <Upload size={24} className={isBulkDragging ? 'animate-bounce text-purple-600 dark:text-purple-400' : ''} />
              </div>
              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-sm">
                  এখানে একসাথে একাধিক ছবি টেনে এনে ছেড়ে দিন (Drag &amp; Drop)
                </h4>
                <p className="text-xs text-slate-400 mt-1">অথবা কম্পিউটার থেকে ফাইল ব্রাউজ করতে এখানে ক্লিক করুন</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-900/40 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                  💡 ফাইলের নাম রোল নম্বর (যেমন: 01.jpg, 02.jpg) বা আইডি হলে অটোমেটিক ম্যাচ হবে
                </span>
                <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  ✂️ অটো ক্রপ ও অটো সাইজ: আপলোডকৃত ছবি পাসপোর্ট সাইজে (৩০০×৩৬০) ছোট হয়ে যাবে
                </span>
              </div>
            </div>
          </div>

          {bulkPhotos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
                  <ImageIcon size={14} className="text-purple-600 dark:text-purple-400" />
                  মোট ড্রপকৃত ছবি ({bulkPhotos.length} টি)
                </h5>
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                >
                  সব ক্লিয়ার করুন
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {bulkPhotos.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-2xl border flex items-center gap-3 ${
                      item.matchedStudentId
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <img
                      src={item.preview}
                      alt={item.fileName}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{item.fileName}</p>

                      {item.matchedStudentId ? (
                        <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 truncate flex items-center gap-1">
                          <CheckCircle2 size={12} className="shrink-0" />
                          <span>
                            {item.matchedStudentName} (রোল: {item.matchedRoll}, {item.matchedGrade})
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <AlertCircle size={12} className="shrink-0" />
                          <span>কোনো শিক্ষার্থী মেলেনি</span>
                        </div>
                      )}

                      <select
                        value={item.matchedStudentId || ''}
                        onChange={(e) => onReassignStudent(idx, e.target.value)}
                        className="mt-1 w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                      >
                        <option value="">{item.matchedStudentId ? 'শিক্ষার্থী পরিবর্তন করুন...' : 'শিক্ষার্থী নির্বাচন করুন...'}</option>
                        {students.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} - রোল {st.roll} ({st.grade})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                      title="মুছে ফেলুন"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            ম্যাচ হয়েছে: <strong className="text-emerald-600 dark:text-emerald-400">{matchedCount}</strong> / {bulkPhotos.length} টি ছবি
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={onSaveBulkPhotos}
              disabled={matchedCount === 0}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Save size={14} /> সব ছবি সেভ করুন ({matchedCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
