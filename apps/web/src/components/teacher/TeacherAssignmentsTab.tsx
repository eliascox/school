'use client';

import React, { useState } from 'react';
import { BookOpen, LayoutGrid, Save, X } from 'lucide-react';
import { confirmDialog } from '@/components/ui/ToastProvider';
import { getSubjectReligion } from '@/lib/religionUtils';
import { SubjectAssignment, TeacherRecord, teacherRBACService } from '@/services/teacherRBACService';
import { DynamicConfiguredSubject } from './teacherUtils';

interface ReligionPanelConfig {
  key: 'islam' | 'hindu';
  subjectName: string;
  matchKeyword: string;
  emoji: string;
  title: string;
  wrapperBorder: string;
  headerBorder: string;
  titleColor: string;
  subtitleColor: string;
  badgeBg: string;
  rowBg: string;
  classPillBg: string;
  teacherChipBg: string;
  selectBorder: string;
  bulkBg: string;
  bulkTitleColor: string;
  bulkButtonBg: string;
}

const RELIGION_PANELS: ReligionPanelConfig[] = [
  {
    key: 'islam',
    subjectName: 'ইসলাম ও নৈতিক শিক্ষা',
    matchKeyword: 'ইসলাম',
    emoji: '☪️',
    title: 'ইসলাম ও নৈতিক শিক্ষা',
    wrapperBorder: 'border-emerald-200 dark:border-emerald-800/60',
    headerBorder: 'border-emerald-100 dark:border-emerald-800/60',
    titleColor: 'text-emerald-950 dark:text-emerald-200',
    subtitleColor: 'text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60',
    rowBg: 'bg-emerald-50/40 dark:bg-emerald-950/50 hover:bg-emerald-50/80 border-emerald-100 dark:border-emerald-800/60',
    classPillBg: 'bg-emerald-700',
    teacherChipBg: 'text-emerald-900 dark:text-emerald-200 bg-emerald-100/90 dark:bg-emerald-900/40',
    selectBorder: 'border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400 dark:hover:border-emerald-700 focus:border-emerald-600',
    bulkBg: 'border-emerald-100 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/50',
    bulkTitleColor: 'text-emerald-900 dark:text-emerald-200',
    bulkButtonBg: 'bg-emerald-700 hover:bg-emerald-800',
  },
  {
    key: 'hindu',
    subjectName: 'হিন্দুধর্ম ও নৈতিক শিক্ষা',
    matchKeyword: 'হিন্দু',
    emoji: '🕉️',
    title: 'হিন্দুধর্ম ও নৈতিক শিক্ষা',
    wrapperBorder: 'border-amber-200 dark:border-amber-800/60',
    headerBorder: 'border-amber-100 dark:border-amber-800/60',
    titleColor: 'text-amber-950 dark:text-amber-200',
    subtitleColor: 'text-amber-700 dark:text-amber-300',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800/60',
    rowBg: 'bg-amber-50/40 dark:bg-amber-950/50 hover:bg-amber-50/80 border-amber-100 dark:border-amber-800/60',
    classPillBg: 'bg-amber-700',
    teacherChipBg: 'text-amber-900 dark:text-amber-200 bg-amber-100/90 dark:bg-amber-900/40',
    selectBorder: 'border-amber-200 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-700 focus:border-amber-600',
    bulkBg: 'border-amber-100 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/50',
    bulkTitleColor: 'text-amber-900 dark:text-amber-200',
    bulkButtonBg: 'bg-amber-700 hover:bg-amber-800',
  },
];

const CLASS_LABEL_MAP: Record<string, string> = {
  '6th': '৬ষ্ঠ শ্রেণি',
  '7th': '৭ম শ্রেণি',
  '8th': '৮ম শ্রেণি',
  '9th': '৯ম শ্রেণি',
  '10th': '১০ম শ্রেণি',
};

interface TeacherAssignmentsTabProps {
  teachers: TeacherRecord[];
  subjectAssignments: SubjectAssignment[];
  assignTeacherId: string;
  setAssignTeacherId: (val: string) => void;
  assignClassId: string;
  setAssignClassId: (val: string) => void;
  assignGroup: 'all' | 'science' | 'humanities' | 'commerce';
  setAssignGroup: (val: 'all' | 'science' | 'humanities' | 'commerce') => void;
  assignSubjectId: string;
  setAssignSubjectId: (val: string) => void;
  isClass9or10: boolean;
  availableSubjectsList: DynamicConfiguredSubject[];
  onAssignSubject: (e: React.FormEvent) => void;
  onAssignReligionTeacher: (classId: string, subjectName: string, teacherId: string) => void;
  onBulkAssignReligionTeacher: (subjectName: string, teacherId: string) => void;
  refreshAllData: () => void;
}

export default function TeacherAssignmentsTab({
  teachers,
  subjectAssignments,
  assignTeacherId,
  setAssignTeacherId,
  assignClassId,
  setAssignClassId,
  assignGroup,
  setAssignGroup,
  assignSubjectId,
  setAssignSubjectId,
  isClass9or10,
  availableSubjectsList,
  onAssignSubject,
  onAssignReligionTeacher,
  onBulkAssignReligionTeacher,
  refreshAllData,
}: TeacherAssignmentsTabProps) {
  const [bulkSelected, setBulkSelected] = useState<Record<string, string>>({});

  return (
    <div className="space-y-5">
      {/* ── ধর্ম বিষয় বণ্টন প্যানেল (৬ষ্ঠ-১০ম প্রতি শ্রেণিতে আলাদা শিক্ষক সুবিধা) ── */}
      <div className="bg-gradient-to-br from-amber-50/60 dark:from-amber-950/50 to-orange-50/40 dark:to-orange-950/40 rounded-3xl border border-amber-200/90 dark:border-amber-800/60 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/70 dark:border-amber-800/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="font-black text-amber-950 dark:text-amber-200 text-base">
                ধর্ম বিষয় শিক্ষক বণ্টন প্যানেল (৬ষ্ঠ - ১০ম শ্রেণি)
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-200 font-medium mt-0.5">
                ৬ষ্ঠ থেকে ১০ম শ্রেণির ধর্ম বিষয় একজন শিক্ষককে না দিয়ে বিভিন্ন শিক্ষককে আলাদাভাবে বণ্টন করার পূর্ণ সুবিধা
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {RELIGION_PANELS.map((panel) => (
            <div
              key={panel.key}
              className={`bg-white dark:bg-slate-900 rounded-2xl border ${panel.wrapperBorder} shadow-sm p-4 sm:p-5 space-y-4`}
            >
              <div className={`flex items-center justify-between border-b ${panel.headerBorder} pb-3`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{panel.emoji}</span>
                  <div>
                    <h4 className={`font-black ${panel.titleColor} text-sm`}>{panel.title}</h4>
                    <p className={`text-[11px] ${panel.subtitleColor} font-bold`}>শ্রেণিভিত্তিক আলাদা শিক্ষক নির্বাচন</p>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${panel.badgeBg}`}>
                  আবশ্যিক বিষয়
                </span>
              </div>

              {/* Class-wise Rows */}
              <div className="space-y-2.5">
                {(['6th', '7th', '8th', '9th', '10th'] as const).map((cls) => {
                  const currentAssignment = subjectAssignments.find(
                    (a) =>
                      a.classId === cls &&
                      (a.subjectId === panel.subjectName || a.subjectId.includes(panel.matchKeyword))
                  );
                  const currentTeacher = teachers.find((t) => t.id === currentAssignment?.teacherId);

                  return (
                    <div
                      key={cls}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 ${panel.rowBg} rounded-xl border transition`}
                    >
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`w-20 px-2 py-1 ${panel.classPillBg} text-white rounded-lg text-xs font-black text-center shadow-xs`}>
                          {CLASS_LABEL_MAP[cls]}
                        </span>
                        {currentTeacher ? (
                          <span
                            className={`text-[11px] font-bold ${panel.teacherChipBg} px-2 py-0.5 rounded-md truncate max-w-[130px]`}
                            title={currentTeacher.name}
                          >
                            ✓ {currentTeacher.name}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 italic">নির্ধারিত নেই</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-1 sm:justify-end">
                        <select
                          value={currentAssignment?.teacherId || ''}
                          onChange={(e) => onAssignReligionTeacher(cls, panel.subjectName, e.target.value)}
                          className={`px-2.5 py-1.5 bg-white dark:bg-slate-900 border ${panel.selectBorder} rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer w-full sm:w-52 transition`}
                        >
                          <option value="">-- শিক্ষক সিলেক্ট করুন --</option>
                          {teachers
                            .filter((t) => t.status === 'active')
                            .map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({t.phone})
                              </option>
                            ))}
                        </select>
                        {currentAssignment && (
                          <button
                            type="button"
                            onClick={() => onAssignReligionTeacher(cls, panel.subjectName, '')}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer shrink-0"
                            title="শিক্ষক বাতিল করুন"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bulk Quick Fill */}
              <div className={`pt-3 border-t flex flex-col sm:flex-row items-center gap-2 ${panel.bulkBg} p-3 rounded-xl`}>
                <span className={`text-[11px] font-extrabold ${panel.bulkTitleColor} shrink-0`}>
                  ⚡ সব শ্রেণিতে একই শিক্ষক:
                </span>
                <select
                  value={bulkSelected[panel.key] || ''}
                  onChange={(e) => setBulkSelected((prev) => ({ ...prev, [panel.key]: e.target.value }))}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none flex-1 w-full sm:w-auto"
                >
                  <option value="">-- শিক্ষক সিলেক্ট --</option>
                  {teachers
                    .filter((t) => t.status === 'active')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.phone})
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => onBulkAssignReligionTeacher(panel.subjectName, bulkSelected[panel.key] || '')}
                  className={`px-3 py-1.5 ${panel.bulkButtonBg} text-white rounded-xl text-xs font-black shrink-0 transition cursor-pointer shadow-xs whitespace-nowrap`}
                >
                  এক ক্লিকে দিন
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assignment Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <BookOpen size={18} className="text-violet-600 dark:text-violet-400" />
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">বিষয়ভিত্তিক ক্লাস বণ্টন (সকল বিষয়)</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">শ্রেণিভিত্তিক বিষয়সমূহ থেকে শিক্ষক নির্বাচন করে এসাইন করুন</p>
          </div>
        </div>

        <form onSubmit={onAssignSubject} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs font-bold">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1.5 text-[11px]">শিক্ষক নির্বাচন *</label>
              <select
                value={assignTeacherId}
                onChange={(e) => setAssignTeacherId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer focus:border-indigo-500 transition"
              >
                <option value="">-- শিক্ষক সিলেক্ট --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1.5 text-[11px]">শ্রেণি (Class) *</label>
              <select
                value={assignClassId}
                onChange={(e) => setAssignClassId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="6th">৬ষ্ঠ শ্রেণি (6th)</option>
                <option value="7th">৭ম শ্রেণি (7th)</option>
                <option value="8th">৮ম শ্রেণি (8th)</option>
                <option value="9th">৯ম শ্রেণি (9th)</option>
                <option value="10th">১০ম শ্রেণি (10th)</option>
              </select>
            </div>
            {isClass9or10 && (
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1.5 text-[11px]">বিভাগ (Group) *</label>
                <select
                  value={assignGroup}
                  onChange={(e) => setAssignGroup(e.target.value as 'all' | 'science' | 'humanities' | 'commerce')}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="science">🧪 বিজ্ঞান</option>
                  <option value="humanities">📖 মানবিক</option>
                  <option value="commerce">📊 ব্যবসায় শিক্ষা</option>
                  <option value="all">🌐 সকল বিষয়</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1.5 text-[11px]">বিষয় (Subject) *</label>
              <select
                value={assignSubjectId}
                onChange={(e) => setAssignSubjectId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                {availableSubjectsList.map((sub) => {
                  const subRel = getSubjectReligion(sub.name);
                  const relIcon =
                    subRel === 'Muslim' ? '☪️ ' : subRel === 'Hindu' ? '🕉️ ' : subRel === 'Christian' ? '✝️ ' : subRel === 'Buddhist' ? '☸️ ' : '';
                  return (
                    <option key={sub.name} value={sub.name}>
                      {relIcon}
                      {sub.name} ({sub.category || 'সাধারণ'})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition active:scale-95"
            >
              <Save size={14} /> বিষয় এসাইন করুন
            </button>
          </div>
        </form>
      </div>

      {/* Teacher-Wise Subject List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <LayoutGrid size={16} className="text-violet-600 dark:text-violet-400" />
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">শিক্ষক অনুযায়ী বন্টিত বিষয়ের তালিকা</h4>
          </div>
          <span className="px-3 py-1 bg-violet-50 dark:bg-violet-950/50 text-violet-800 dark:text-violet-200 rounded-xl font-bold text-[11px] border border-violet-200 dark:border-violet-800/60">
            মোট বণ্টন: <strong>{subjectAssignments.length}টি</strong>
          </span>
        </div>

        {subjectAssignments.length === 0 ? (
          <div className="p-14 text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center">
              <BookOpen size={28} className="text-violet-300" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">কোনো বিষয়ে শিক্ষক এসাইন করা হয়নি</p>
            <p className="text-[11px] text-slate-400">ওপরের ফরম থেকে শিক্ষক ও বিষয় নির্বাচন করে এসাইন করুন</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teachers.map((t) => {
              const teacherSubs = subjectAssignments.filter((sa) => sa.teacherId === t.id);
              if (teacherSubs.length === 0) return null;
              return (
                <div
                  key={t.id}
                  className="p-4 bg-slate-50/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 hover:border-violet-200 dark:hover:border-violet-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white font-black text-sm flex items-center justify-center shadow">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="font-black text-slate-900 dark:text-white text-sm">{t.name}</strong>
                          <span className="text-[10px] font-mono font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/50 px-2 py-0.5 rounded-lg border border-violet-200 dark:border-violet-800/60">
                            {t.id}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {t.designation} • {t.phone}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-extrabold text-[11px] rounded-xl shrink-0 self-start sm:self-auto">
                      {teacherSubs.length}টি বিষয় দায়িত্বপ্রাপ্ত
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {teacherSubs.map((sa) => {
                      const subRel = getSubjectReligion(sa.subjectId);
                      const relBadge =
                        subRel === 'Muslim' ? (
                          <span className="ml-1 text-[8px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-1 rounded font-bold">
                            ☪️ ইসলাম
                          </span>
                        ) : subRel === 'Hindu' ? (
                          <span className="ml-1 text-[8px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1 rounded font-bold">
                            🕉️ হিন্দু
                          </span>
                        ) : null;
                      return (
                        <div
                          key={sa.id}
                          className={`p-2.5 bg-white dark:bg-slate-900 border rounded-xl flex items-center justify-between group hover:shadow-sm transition ${
                            subRel === 'Muslim'
                              ? 'border-emerald-200 dark:border-emerald-800/60'
                              : subRel === 'Hindu'
                              ? 'border-amber-200 dark:border-amber-800/60'
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[9px] font-bold rounded">{sa.classId}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{sa.academicYear}</span>
                            </div>
                            <div className="flex items-center flex-wrap mt-0.5">
                              <strong className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{sa.subjectId}</strong>
                              {relBadge}
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              if (
                                await confirmDialog({
                                  title: 'বিষয় বণ্টন বাতিল',
                                  message: `${t.name}-এর ${sa.classId} (${sa.subjectId}) বণ্টন বাতিল করতে চান?`,
                                  confirmLabel: 'বাতিল করুন',
                                  danger: true,
                                })
                              ) {
                                teacherRBACService.removeSubjectAssignment(sa.id);
                                refreshAllData();
                              }
                            }}
                            className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer opacity-0 group-hover:opacity-100"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
