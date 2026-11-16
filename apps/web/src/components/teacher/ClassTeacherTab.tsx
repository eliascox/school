'use client';

import React from 'react';
import { Award, School, Trash2, UserCheck } from 'lucide-react';
import { ClassTeacherAssignment, TeacherRecord } from '@/services/teacherRBACService';

interface ClassTeacherTabProps {
  teachers: TeacherRecord[];
  classTeachers: ClassTeacherAssignment[];
  ctClassId: string;
  setCtClassId: (val: string) => void;
  ctTeacherId: string;
  setCtTeacherId: (val: string) => void;
  onAssignClassTeacher: (e: React.FormEvent) => void;
  onRemoveClassTeacher: (id: string, className: string) => void;
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
}: ClassTeacherTabProps) {
  return (
    <div className="space-y-5">
      {/* Assignment Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <School size={18} className="text-teal-600 dark:text-teal-400" />
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">শ্রেণি শিক্ষক নির্বাচন</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">প্রতিটি শ্রেণিতে একজন মাত্র শ্রেণি শিক্ষক (UNIQUE constraint)</p>
          </div>
        </div>

        <form
          onSubmit={onAssignClassTeacher}
          className="p-4 bg-teal-50/50 dark:bg-teal-950/50 rounded-2xl border border-teal-100 dark:border-teal-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold"
        >
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1.5 text-[11px]">শ্রেণি ও শাখা *</label>
            <select
              value={ctClassId}
              onChange={(e) => setCtClassId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="6th-A">৬ষ্ঠ শ্রেণি - শাখা A</option>
              <option value="7th-A">৭ম শ্রেণি - শাখা A</option>
              <option value="8th-A">৮ম শ্রেণি - শাখা A</option>
              <option value="9th-A">৯ম শ্রেণি - শাখা A</option>
              <option value="10th-A">১০ম শ্রেণি - শাখা A</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1.5 text-[11px]">শ্রেণি শিক্ষক নির্বাচন *</label>
            <select
              value={ctTeacherId}
              onChange={(e) => setCtTeacherId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="">-- শিক্ষক সিলেক্ট --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.designation})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
            >
              <UserCheck size={14} /> শ্রেণি শিক্ষক নির্ধারণ
            </button>
          </div>
        </form>
      </div>

      {/* Class Teacher Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
          <Award size={14} className="text-indigo-600 dark:text-indigo-400" />
          মনোনীত শ্রেণি শিক্ষক তালিকা
        </h4>

        {classTeachers.length === 0 ? (
          <div className="p-14 text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
              <School size={28} className="text-indigo-300" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">কোনো শ্রেণি শিক্ষক নির্বাচন করা হয়নি</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {classTeachers.map((ct) => {
              const tch = teachers.find((t) => t.id === ct.teacherId);
              return (
                <div
                  key={ct.id}
                  className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-slate-900 dark:text-white">{ct.classId}</span>
                    <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-bold rounded-full">
                      শ্রেণি শিক্ষক
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-sm">
                      {tch?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <strong className="text-slate-900 dark:text-white font-bold text-xs block">{tch?.name || ct.teacherId}</strong>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{tch?.phone || ''}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">শিক্ষাবর্ষ: {ct.academicYear}</span>
                    <button
                      onClick={() => onRemoveClassTeacher(ct.id, ct.classId)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                      title="বাতিল করুন"
                    >
                      <Trash2 size={13} />
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
