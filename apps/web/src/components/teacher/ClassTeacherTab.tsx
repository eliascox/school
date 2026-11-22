'use client';

import React, { useMemo } from 'react';
import { Award, School, Search, Trash2, UserCheck } from 'lucide-react';
import { ClassTeacherAssignment, TeacherRecord } from '@/services/teacherRBACService';
import { formatClassSectionLabelBn, toAsciiDigits, toBanglaDigits } from './teacherUtils';

interface ClassTeacherTabProps {
  teachers: TeacherRecord[];
  classTeachers: ClassTeacherAssignment[];
  ctClassId: string;
  setCtClassId: (val: string) => void;
  ctTeacherId: string;
  setCtTeacherId: (val: string) => void;
  onAssignClassTeacher: (e: React.FormEvent) => void;
  onRemoveClassTeacher: (id: string, className: string) => void;
  searchQuery?: string;
}

export default function ClassTeacherTab({
  teachers,
  classTeachers,
  ctClassId,
  setCtClassId,
  ctTeacherId,
  setCtTeacherId,
  onAssignClassTeacher,
  onRemoveClassTeacher,
  searchQuery = '',
}: ClassTeacherTabProps) {
  const filteredClassTeachers = useMemo(() => {
    const rawQ = searchQuery.trim();
    if (!rawQ) return classTeachers;
    const rawLower = rawQ.toLowerCase();
    const asciiQ = toAsciiDigits(rawQ).toLowerCase();

    return classTeachers.filter((ct) => {
      const tch = teachers.find((t) => t.id === ct.teacherId);
      const haystack = [
        ct.classId,
        formatClassSectionLabelBn(ct.classId),
        ct.teacherId,
        tch?.name || '',
        tch?.phone || '',
        tch?.designation || '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(rawLower) || toAsciiDigits(haystack).includes(asciiQ);
    });
  }, [classTeachers, teachers, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Assignment Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-4 sm:p-5 space-y-4 print:hidden">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-[#0B5D3B] dark:text-emerald-400 shrink-0">
            <School size={16} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
              শ্রেণি শিক্ষক নির্বাচন
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              প্রতিটি শ্রেণি ও শাখায় একজন মাত্র দায়িত্বপ্রাপ্ত শ্রেণি শিক্ষক নির্ধারণ করুন
            </p>
          </div>
        </div>

        <form
          onSubmit={onAssignClassTeacher}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold items-end"
        >
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1.5 text-[11px] font-bold">
              শ্রেণি ও শাখা *
            </label>
            <select
              value={ctClassId}
              onChange={(e) => setCtClassId(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer focus:border-[#0B5D3B] focus:bg-white dark:focus:bg-slate-900 transition"
            >
              <option value="6th-A">৬ষ্ঠ শ্রেণি — শাখা A</option>
              <option value="7th-A">৭ম শ্রেণি — শাখা A</option>
              <option value="8th-A">৮ম শ্রেণি — শাখা A</option>
              <option value="9th-A">৯ম শ্রেণি — শাখা A</option>
              <option value="10th-A">১০ম শ্রেণি — শাখা A</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1.5 text-[11px] font-bold">
              শ্রেণি শিক্ষক নির্বাচন *
            </label>
            <select
              value={ctTeacherId}
              onChange={(e) => setCtTeacherId(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer focus:border-[#0B5D3B] focus:bg-white dark:focus:bg-slate-900 transition"
            >
              <option value="">-- শিক্ষক সিলেক্ট করুন --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.designation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="w-full h-10 px-4 bg-[#0B5D3B] hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-[0.98]"
            >
              <UserCheck size={15} /> শ্রেণি শিক্ষক নির্ধারণ
            </button>
          </div>
        </form>
      </div>

      {/* Class Teacher List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-4 sm:p-5 space-y-4 print:border-slate-300 print:shadow-none print:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 print:border-slate-300">
          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Award size={16} className="text-[#0B5D3B] dark:text-emerald-400 print:hidden" />
            মনোনীত শ্রেণি শিক্ষক তালিকা
          </h4>
          <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg text-[11px] font-bold self-start sm:self-auto">
            মোট মনোনীত: {toBanglaDigits(filteredClassTeachers.length)} জন
          </span>
        </div>

        {classTeachers.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <School size={22} className="text-slate-400" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">
              কোনো শ্রেণি শিক্ষক নির্বাচন করা হয়নি
            </p>
            <p className="text-[11px] text-slate-400">
              ওপরের ফরম থেকে শ্রেণি ও শিক্ষক নির্বাচন করে দায়িত্ব নির্ধারণ করুন
            </p>
          </div>
        ) : filteredClassTeachers.length === 0 ? (
          <div className="py-10 text-center space-y-1.5 text-slate-400">
            <Search size={22} className="mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              &ldquo;{searchQuery}&rdquo; এর জন্য কোনো শ্রেণি শিক্ষক পাওয়া যায়নি
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredClassTeachers.map((ct) => {
              const tch = teachers.find((t) => t.id === ct.teacherId);
              const classLabelBn = formatClassSectionLabelBn(ct.classId);
              return (
                <div
                  key={ct.id}
                  className="p-4 bg-slate-50/60 dark:bg-slate-950/50 border border-slate-200/90 dark:border-slate-800 rounded-xl space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors print:bg-white print:break-inside-avoid"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
                        {classLabelBn}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{ct.classId}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-[10px] font-bold rounded-md shrink-0">
                      শ্রেণি শিক্ষক
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {tch?.name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <strong className="text-slate-900 dark:text-white font-bold text-xs block truncate">
                        {tch?.name || ct.teacherId}
                      </strong>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
                        {tch?.phone || ct.teacherId}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/70 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      শিক্ষাবর্ষ: {toBanglaDigits(ct.academicYear)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveClassTeacher(ct.id, classLabelBn)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer print:hidden"
                      title="বাতিল করুন"
                      aria-label={`${classLabelBn} শ্রেণি শিক্ষক বাতিল করুন`}
                    >
                      <Trash2 size={14} />
                    </button>
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
