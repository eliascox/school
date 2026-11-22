'use client';

import React, { useMemo, useState } from 'react';
import { BookOpen, LayoutGrid, Plus, Search, Users, X } from 'lucide-react';
import { confirmDialog } from '@/components/ui/ToastProvider';
import { getSubjectReligion } from '@/lib/religionUtils';
import { SubjectAssignment, TeacherRecord, teacherRBACService } from '@/services/teacherRBACService';
import {
  DynamicConfiguredSubject,
  formatClassSectionLabelBn,
  formatClassShortLabelBn,
  toAsciiDigits,
  toBanglaDigits,
} from './teacherUtils';

interface ReligionPanelConfig {
  key: 'islam' | 'hindu';
  subjectName: string;
  matchKeyword: string;
  title: string;
  tagLabel: string;
  accentBorder: string;
  badgeClass: string;
  classPillClass: string;
  bulkButtonClass: string;
}

const RELIGION_PANELS: ReligionPanelConfig[] = [
  {
    key: 'islam',
    subjectName: 'ইসলাম ও নৈতিক শিক্ষা',
    matchKeyword: 'ইসলাম',
    title: 'ইসলাম ও নৈতিক শিক্ষা',
    tagLabel: 'ইসলাম ধর্ম',
    accentBorder: 'border-t-2 border-t-[#0B5D3B] dark:border-t-emerald-500',
    badgeClass:
      'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70',
    classPillClass: 'bg-[#0B5D3B] text-white',
    bulkButtonClass: 'bg-[#0B5D3B] hover:bg-emerald-800 text-white',
  },
  {
    key: 'hindu',
    subjectName: 'হিন্দুধর্ম ও নৈতিক শিক্ষা',
    matchKeyword: 'হিন্দু',
    title: 'হিন্দুধর্ম ও নৈতিক শিক্ষা',
    tagLabel: 'হিন্দুধর্ম',
    accentBorder: 'border-t-2 border-t-amber-600 dark:border-t-amber-500',
    badgeClass:
      'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/70',
    classPillClass: 'bg-amber-700 text-white',
    bulkButtonClass: 'bg-amber-700 hover:bg-amber-800 text-white',
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
  searchQuery?: string;
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
  searchQuery = '',
}: TeacherAssignmentsTabProps) {
  const [bulkSelected, setBulkSelected] = useState<Record<string, string>>({});

  const selectedTeacher = useMemo(
    () => teachers.find((t) => t.id === assignTeacherId) || null,
    [teachers, assignTeacherId]
  );

  const activeTeachers = useMemo(
    () => teachers.filter((t) => t.status === 'active'),
    [teachers]
  );

  const groupedTeacherAssignments = useMemo(() => {
    const rawQ = searchQuery.trim();
    const rawLower = rawQ.toLowerCase();
    const asciiQ = toAsciiDigits(rawQ).toLowerCase();

    return teachers
      .map((teacher) => {
        const allSubs = subjectAssignments.filter((sa) => sa.teacherId === teacher.id);
        if (allSubs.length === 0) return null;

        if (!rawQ) {
          return { teacher, assignments: allSubs };
        }

        const teacherMeta = `${teacher.name} ${teacher.id} ${teacher.phone} ${toAsciiDigits(teacher.phone)} ${teacher.designation}`.toLowerCase();
        const teacherMatched =
          teacherMeta.includes(rawLower) || toAsciiDigits(teacherMeta).includes(asciiQ);

        if (teacherMatched) {
          return { teacher, assignments: allSubs };
        }

        const matchedSubs = allSubs.filter((sa) => {
          const text = `${sa.subjectId} ${sa.classId} ${formatClassSectionLabelBn(sa.classId)}`.toLowerCase();
          return text.includes(rawLower) || toAsciiDigits(text).includes(asciiQ);
        });

        return matchedSubs.length > 0 ? { teacher, assignments: matchedSubs } : null;
      })
      .filter((entry): entry is { teacher: TeacherRecord; assignments: SubjectAssignment[] } => entry !== null);
  }, [teachers, subjectAssignments, searchQuery]);

  return (
    <div className="space-y-5">
      {/* 1. সাধারণ বিষয় অ্যাসাইন ফর্ম (প্রথম প্রাধান্য — দ্রুত বিষয় বণ্টন) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-4 sm:p-5 space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-[#0B5D3B] dark:text-emerald-400 shrink-0">
              <BookOpen size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                বিষয়ভিত্তিক ক্লাস বণ্টন
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                শিক্ষক, শ্রেণি ও পাঠ্যক্রমের সক্রিয় বিষয় নির্বাচন করে দায়িত্ব নির্ধারণ করুন
              </p>
            </div>
          </div>

          {selectedTeacher && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-bold text-[#0B5D3B] dark:text-emerald-300 self-start sm:self-auto">
              <span>নির্বাচিত:</span>
              <span className="font-extrabold">{selectedTeacher.name}</span>
            </div>
          )}
        </div>

        <form
          onSubmit={onAssignSubject}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs font-bold items-end"
        >
          <div className={isClass9or10 ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <label className="block text-slate-600 dark:text-slate-400 mb-1.5 text-[11px] font-bold">
              শিক্ষক নির্বাচন *
            </label>
            <select
              value={assignTeacherId}
              onChange={(e) => setAssignTeacherId(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer focus:border-[#0B5D3B] focus:bg-white dark:focus:bg-slate-900 transition"
            >
              <option value="">-- শিক্ষক সিলেক্ট করুন --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-slate-600 dark:text-slate-400 mb-1.5 text-[11px] font-bold">
              শ্রেণি *
            </label>
            <select
              value={assignClassId}
              onChange={(e) => setAssignClassId(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer focus:border-[#0B5D3B] focus:bg-white dark:focus:bg-slate-900 transition"
            >
              <option value="6th">৬ষ্ঠ শ্রেণি</option>
              <option value="7th">৭ম শ্রেণি</option>
              <option value="8th">৮ম শ্রেণি</option>
              <option value="9th">৯ম শ্রেণি</option>
              <option value="10th">১০ম শ্রেণি</option>
            </select>
          </div>

          {isClass9or10 && (
            <div className="lg:col-span-2">
              <label className="block text-slate-600 dark:text-slate-400 mb-1.5 text-[11px] font-bold">
                বিভাগ *
              </label>
              <select
                value={assignGroup}
                onChange={(e) =>
                  setAssignGroup(e.target.value as 'all' | 'science' | 'humanities' | 'commerce')
                }
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer focus:border-[#0B5D3B] focus:bg-white dark:focus:bg-slate-900 transition"
              >
                <option value="science">বিজ্ঞান</option>
                <option value="humanities">মানবিক</option>
                <option value="commerce">ব্যবসায় শিক্ষা</option>
                <option value="all">সকল বিষয়</option>
              </select>
            </div>
          )}

          <div className={isClass9or10 ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <label className="block text-slate-600 dark:text-slate-400 mb-1.5 text-[11px] font-bold">
              বিষয় *
            </label>
            <select
              value={assignSubjectId}
              onChange={(e) => setAssignSubjectId(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer focus:border-[#0B5D3B] focus:bg-white dark:focus:bg-slate-900 transition"
            >
              {availableSubjectsList.map((sub) => (
                <option key={sub.name} value={sub.name}>
                  {sub.name} ({sub.category || 'সাধারণ'})
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <button
              type="submit"
              className="w-full h-10 px-4 bg-[#0B5D3B] hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-[0.98] whitespace-nowrap"
            >
              <Plus size={15} /> বিষয় অ্যাসাইন
            </button>
          </div>
        </form>
      </div>

      {/* 2. শিক্ষক অনুযায়ী বণ্টিত বিষয়ের তালিকা */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-4 sm:p-5 space-y-4 print:border-slate-300 print:shadow-none print:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 print:border-slate-300">
          <div className="flex items-center gap-2">
            <LayoutGrid size={16} className="text-[#0B5D3B] dark:text-emerald-400 print:hidden" />
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
              শিক্ষক অনুযায়ী বণ্টিত বিষয়ের তালিকা
            </h4>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200/80 dark:border-slate-700">
              দায়িত্বপ্রাপ্ত শিক্ষক: {toBanglaDigits(groupedTeacherAssignments.length)} জন
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 rounded-lg border border-emerald-200/80 dark:border-emerald-800/60">
              মোট বণ্টন: {toBanglaDigits(subjectAssignments.length)}টি
            </span>
          </div>
        </div>

        {subjectAssignments.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <BookOpen size={22} className="text-slate-400" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">
              এখনও কোনো বিষয়ে শিক্ষক অ্যাসাইন করা হয়নি
            </p>
            <p className="text-[11px] text-slate-400">
              ওপরের ফরম থেকে শিক্ষক ও বিষয় নির্বাচন করে অ্যাসাইন করুন
            </p>
          </div>
        ) : groupedTeacherAssignments.length === 0 ? (
          <div className="py-10 text-center space-y-1.5 text-slate-400">
            <Search size={22} className="mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              &ldquo;{searchQuery}&rdquo; এর সাথে মিলে এমন কোনো বিষয় বণ্টন পাওয়া যায়নি
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedTeacherAssignments.map(({ teacher: t, assignments: teacherSubs }) => (
              <div
                key={t.id}
                className="p-3.5 sm:p-4 bg-slate-50/60 dark:bg-slate-950/50 border border-slate-200/90 dark:border-slate-800 rounded-xl space-y-3 print:bg-white print:break-inside-avoid"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {t.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                          {t.name}
                        </strong>
                        <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {t.id}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                        {t.designation} • {t.phone}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <span className="px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-[11px] rounded-lg">
                      {toBanglaDigits(teacherSubs.length)}টি বিষয়
                    </span>
                    <button
                      type="button"
                      onClick={() => setAssignTeacherId(t.id)}
                      className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg text-[11px] font-bold transition cursor-pointer print:hidden"
                    >
                      + আরও যোগ
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {teacherSubs.map((sa) => {
                    const subRel = getSubjectReligion(sa.subjectId);
                    const relBadge =
                      subRel === 'Muslim' ? (
                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 px-1.5 py-0.2 rounded font-bold">
                          ইসলাম
                        </span>
                      ) : subRel === 'Hindu' ? (
                        <span className="text-[10px] bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 px-1.5 py-0.2 rounded font-bold">
                          হিন্দু
                        </span>
                      ) : null;

                    return (
                      <div
                        key={sa.id}
                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2 hover:border-slate-300 dark:hover:border-slate-700 transition"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[10px] font-extrabold rounded">
                              {formatClassShortLabelBn(sa.classId)}
                            </span>
                            {relBadge}
                            <span className="text-[10px] text-slate-400 font-mono">
                              {sa.academicYear}
                            </span>
                          </div>
                          <strong className="text-xs font-bold text-slate-800 dark:text-slate-100 block mt-0.5 truncate" title={sa.subjectId}>
                            {sa.subjectId}
                          </strong>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (
                              await confirmDialog({
                                title: 'বিষয় বণ্টন বাতিল',
                                message: `${t.name}-এর ${formatClassSectionLabelBn(sa.classId)} (${sa.subjectId}) বণ্টন বাতিল করতে চান?`,
                                confirmLabel: 'বাতিল করুন',
                                danger: true,
                              })
                            ) {
                              teacherRBACService.removeSubjectAssignment(sa.id);
                              refreshAllData();
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer shrink-0 print:hidden"
                          title="বণ্টন বাতিল করুন"
                          aria-label={`${sa.subjectId} বণ্টন বাতিল করুন`}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. ধর্ম বিষয় শিক্ষক বণ্টন প্যানেল (৬ষ্ঠ – ১০ম শ্রেণি — পরিচ্ছন্ন সাদা-স্লেট) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-4 sm:p-5 space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
              <Users size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                ধর্মীয় বিষয় শিক্ষক বণ্টন (৬ষ্ঠ – ১০ম শ্রেণি)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                প্রতিটি শ্রেণির জন্য আলাদা ইসলাম ও হিন্দুধর্ম শিক্ষক অথবা এক-ক্লিকে সকল শ্রেণিতে বণ্টন করুন
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {RELIGION_PANELS.map((panel) => (
            <div
              key={panel.key}
              className={`bg-slate-50/60 dark:bg-slate-950/40 rounded-xl border border-slate-200/90 dark:border-slate-800 ${panel.accentBorder} p-4 space-y-3`}
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70 dark:border-slate-800">
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {panel.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    শ্রেণিভিত্তিক আলাদা শিক্ষক নির্বাচন
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${panel.badgeClass}`}
                >
                  {panel.tagLabel}
                </span>
              </div>

              <div className="space-y-2">
                {(['6th', '7th', '8th', '9th', '10th'] as const).map((cls) => {
                  const currentAssignment = subjectAssignments.find(
                    (a) =>
                      a.classId === cls &&
                      (a.subjectId === panel.subjectName ||
                        a.subjectId.includes(panel.matchKeyword))
                  );
                  const currentTeacher = teachers.find(
                    (t) => t.id === currentAssignment?.teacherId
                  );

                  return (
                    <div
                      key={cls}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-16 py-1 ${panel.classPillClass} rounded-lg text-[11px] font-bold text-center shrink-0`}
                        >
                          {CLASS_LABEL_MAP[cls]}
                        </span>
                        {currentTeacher ? (
                          <span
                            className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate"
                            title={currentTeacher.name}
                          >
                            {currentTeacher.name}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400">
                            নির্ধারিত নেই
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={currentAssignment?.teacherId || ''}
                          onChange={(e) =>
                            onAssignReligionTeacher(cls, panel.subjectName, e.target.value)
                          }
                          aria-label={`${CLASS_LABEL_MAP[cls]} ${panel.title} শিক্ষক`}
                          className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer w-full sm:w-48 focus:border-[#0B5D3B] transition"
                        >
                          <option value="">-- শিক্ষক সিলেক্ট --</option>
                          {activeTeachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.phone})
                            </option>
                          ))}
                        </select>
                        {currentAssignment && (
                          <button
                            type="button"
                            onClick={() => onAssignReligionTeacher(cls, panel.subjectName, '')}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer shrink-0"
                            title="শিক্ষক বাতিল করুন"
                            aria-label="ধর্ম শিক্ষক বাতিল করুন"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bulk Quick Fill */}
              <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
                  সব শ্রেণিতে একই শিক্ষক:
                </span>
                <select
                  value={bulkSelected[panel.key] || ''}
                  onChange={(e) =>
                    setBulkSelected((prev) => ({ ...prev, [panel.key]: e.target.value }))
                  }
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none flex-1"
                >
                  <option value="">-- শিক্ষক সিলেক্ট --</option>
                  {activeTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.phone})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    onBulkAssignReligionTeacher(panel.subjectName, bulkSelected[panel.key] || '')
                  }
                  className={`px-3 py-1.5 ${panel.bulkButtonClass} rounded-lg text-xs font-bold shrink-0 transition cursor-pointer whitespace-nowrap`}
                >
                  এক ক্লিকে দিন
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
