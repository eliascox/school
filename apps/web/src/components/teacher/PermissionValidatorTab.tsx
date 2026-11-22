'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import {
  ClassTeacherAssignment,
  SubjectAssignment,
  TeacherRecord,
  teacherRBACService,
} from '@/services/teacherRBACService';
import {
  formatClassSectionLabelBn,
  formatClassShortLabelBn,
  getDynamicConfiguredSubjects,
} from './teacherUtils';

interface PermissionValidatorTabProps {
  teachers: TeacherRecord[];
  subjectAssignments: SubjectAssignment[];
  classTeachers: ClassTeacherAssignment[];
  mounted: boolean;
}

const CLASS_OPTIONS = [
  { id: '6th', label: '৬ষ্ঠ শ্রেণি' },
  { id: '7th', label: '৭ম শ্রেণি' },
  { id: '8th', label: '৮ম শ্রেণি' },
  { id: '9th', label: '৯ম শ্রেণি' },
  { id: '10th', label: '১০ম শ্রেণি' },
];

export default function PermissionValidatorTab({
  teachers,
  subjectAssignments,
  classTeachers,
  mounted,
}: PermissionValidatorTabProps) {
  const [testSubjectTeacherId, setTestSubjectTeacherId] = useState('');
  const [testSubjectClassId, setTestSubjectClassId] = useState('8th');
  const [testSubjectId, setTestSubjectId] = useState('সাধারণ গণিত');
  const [testObtainedMarks, setTestObtainedMarks] = useState(85);
  const [testFullMarks, setTestFullMarks] = useState(100);

  const [testAttendTeacherId, setTestAttendTeacherId] = useState('');
  const [testAttendClassId, setTestAttendClassId] = useState('8th-A');

  const availableSubjects = getDynamicConfiguredSubjects(testSubjectClassId, 'all', mounted);

  return (
    <div className="space-y-4">
      {/* Compact Institutional Context Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-[#0B5D3B] dark:text-emerald-400 shrink-0">
            <ShieldCheck size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              RBAC ওনারশিপ পারমিশন ভ্যালিডেটর
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              বরাদ্দকৃত বিষয় ও শ্রেণি-শিক্ষক তথ্যের বিপরীতে রিয়েল-টাইম নম্বর এন্ট্রি ও হাজিরা অনুমতি যাচাই করুন
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg self-start sm:self-auto shrink-0">
          সেশন: ২০২৬ • লাইভ RBAC যাচাই
        </span>
      </div>

      {/* Two-Column Verification Workbench */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Test 1: Subject Mark Entry Ownership */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-4 sm:p-5 space-y-3.5 text-xs font-bold">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <ClipboardCheck size={16} className="text-[#0B5D3B] dark:text-emerald-400" />
              ১. নম্বর এন্ট্রি ওনারশিপ টেস্ট
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              বিষয় অ্যাসাইন ট্যাবে বরাদ্দকৃত শ্রেণি ও বিষয়ের সাথে অনুমতি যাচাই
            </p>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
              লগইনকৃত শিক্ষক *
            </label>
            <select
              value={testSubjectTeacherId}
              onChange={(e) => setTestSubjectTeacherId(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer focus:border-[#0B5D3B] focus:bg-white dark:focus:bg-slate-900 transition"
            >
              <option value="">-- শিক্ষক নির্বাচন করুন --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.id})
                </option>
              ))}
            </select>
          </div>

          {testSubjectTeacherId && (() => {
            const myAssignments = subjectAssignments.filter(
              (sa) => sa.teacherId === testSubjectTeacherId
            );
            return myAssignments.length > 0 ? (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1.5">
                  বরাদ্দকৃত বিষয়সমূহ:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {myAssignments.map((sa) => (
                    <span
                      key={sa.id}
                      className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-[10px] font-bold rounded-md"
                    >
                      {formatClassShortLabelBn(sa.classId)} • {sa.subjectId}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-200 font-medium">
                এই শিক্ষকের কোনো বিষয় বরাদ্দ নেই। &ldquo;বিষয় অ্যাসাইন&rdquo; ট্যাব থেকে বিষয় যুক্ত করুন।
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                শ্রেণি
              </label>
              <select
                value={testSubjectClassId}
                onChange={(e) => {
                  const nextClass = e.target.value;
                  setTestSubjectClassId(nextClass);
                  const subs = getDynamicConfiguredSubjects(nextClass, 'all', mounted);
                  if (subs.length > 0 && !subs.some((s) => s.name === testSubjectId)) {
                    setTestSubjectId(subs[0].name);
                  }
                }}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white cursor-pointer focus:border-[#0B5D3B]"
              >
                {CLASS_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                বিষয়
              </label>
              <select
                value={testSubjectId}
                onChange={(e) => setTestSubjectId(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white cursor-pointer focus:border-[#0B5D3B]"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub.name} value={sub.name}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                প্রাপ্ত নম্বর
              </label>
              <input
                type="number"
                value={testObtainedMarks}
                onChange={(e) => setTestObtainedMarks(Number(e.target.value))}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                পূর্ণমান
              </label>
              <input
                type="number"
                value={testFullMarks}
                onChange={(e) => setTestFullMarks(Number(e.target.value))}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
              />
            </div>
          </div>

          <div className="pt-1">
            {(() => {
              if (!testSubjectTeacherId) {
                return (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-center text-[11px] font-semibold">
                    ফলাফল দেখতে একজন শিক্ষক নির্বাচন করুন
                  </div>
                );
              }
              const isOwner = teacherRBACService.validateSubjectOwnership(
                testSubjectTeacherId,
                testSubjectClassId,
                testSubjectId,
                2026
              );
              const markVal = teacherRBACService.validateMarkPayload({
                studentId: 'ST-001',
                classId: testSubjectClassId,
                subjectId: testSubjectId,
                examId: 'EX-1',
                obtainedMarks: testObtainedMarks,
                fullMarks: testFullMarks,
                academicYear: 2026,
                enteredBy: testSubjectTeacherId,
              });
              if (!isOwner) {
                return (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60 rounded-xl space-y-1">
                    <strong className="text-rose-700 dark:text-rose-300 flex items-center gap-1.5 text-xs">
                      <Lock size={14} /> 403 FORBIDDEN
                    </strong>
                    <p className="text-[11px] font-medium">
                      এই শিক্ষককে {formatClassSectionLabelBn(testSubjectClassId)}-তে &ldquo;
                      {testSubjectId}&rdquo; বিষয়ে অ্যাসাইন করা হয়নি।
                    </p>
                  </div>
                );
              }
              if (!markVal.valid) {
                return (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-1">
                    <strong className="text-amber-700 dark:text-amber-300 flex items-center gap-1.5 text-xs">
                      <AlertTriangle size={14} /> INVALID INPUT
                    </strong>
                    <p className="text-[11px] font-medium">{markVal.error}</p>
                  </div>
                );
              }
              return (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-1">
                  <strong className="text-[#0B5D3B] dark:text-emerald-300 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 size={14} /> 200 AUTHORIZED
                  </strong>
                  <p className="text-[11px] font-medium">
                    ওনারশিপ ভ্যালিডেশন সফল।{' '}
                    <span className="font-mono">entered_by={testSubjectTeacherId}</span>
                  </p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Test 2: Attendance Ownership */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-4 sm:p-5 space-y-3.5 text-xs font-bold">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <GraduationCap size={16} className="text-[#0B5D3B] dark:text-emerald-400" />
              ২. হাজিরা ওনারশিপ টেস্ট
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              শ্রেণি শিক্ষক ট্যাবে মনোনীত দায়িত্বের সাথে দৈনিক হাজিরা গ্রহণের অনুমতি যাচাই
            </p>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
              লগইনকৃত শিক্ষক *
            </label>
            <select
              value={testAttendTeacherId}
              onChange={(e) => setTestAttendTeacherId(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer focus:border-[#0B5D3B] focus:bg-white dark:focus:bg-slate-900 transition"
            >
              <option value="">-- শিক্ষক নির্বাচন করুন --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.id})
                </option>
              ))}
            </select>
          </div>

          {testAttendTeacherId && (() => {
            const myClasses = classTeachers.filter((ct) => ct.teacherId === testAttendTeacherId);
            return myClasses.length > 0 ? (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1.5">
                  শ্রেণি শিক্ষক হিসেবে মনোনীত:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {myClasses.map((ct) => (
                    <span
                      key={ct.id}
                      className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-[10px] font-bold rounded-md"
                    >
                      {formatClassSectionLabelBn(ct.classId)}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-200 font-medium">
                এই শিক্ষক কোনো শ্রেণির শ্রেণি শিক্ষক নন। &ldquo;শ্রেণি শিক্ষক&rdquo; ট্যাব থেকে মনোনয়ন দিন।
              </div>
            );
          })()}

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
              হাজিরা গ্রহণের শ্রেণি ও শাখা
            </label>
            <select
              value={testAttendClassId}
              onChange={(e) => setTestAttendClassId(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white cursor-pointer focus:border-[#0B5D3B]"
            >
              <option value="6th-A">৬ষ্ঠ শ্রেণি — শাখা A</option>
              <option value="7th-A">৭ম শ্রেণি — শাখা A</option>
              <option value="8th-A">৮ম শ্রেণি — শাখা A</option>
              <option value="9th-A">৯ম শ্রেণি — শাখা A</option>
              <option value="10th-A">১০ম শ্রেণি — শাখা A</option>
            </select>
          </div>

          <div className="pt-1">
            {(() => {
              if (!testAttendTeacherId) {
                return (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-center text-[11px] font-semibold">
                    ফলাফল দেখতে একজন শিক্ষক নির্বাচন করুন
                  </div>
                );
              }
              const isClassTeacher = teacherRBACService.validateClassTeacherOwnership(
                testAttendTeacherId,
                testAttendClassId,
                2026
              );
              if (!isClassTeacher) {
                return (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60 rounded-xl space-y-1">
                    <strong className="text-rose-700 dark:text-rose-300 flex items-center gap-1.5 text-xs">
                      <Lock size={14} /> 403 FORBIDDEN
                    </strong>
                    <p className="text-[11px] font-medium">
                      শিক্ষক <span className="font-mono">{testAttendTeacherId}</span> —{' '}
                      {formatClassSectionLabelBn(testAttendClassId)}-এর শ্রেণি শিক্ষক নন।
                    </p>
                  </div>
                );
              }
              return (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-1">
                  <strong className="text-[#0B5D3B] dark:text-emerald-300 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 size={14} /> 200 AUTHORIZED
                  </strong>
                  <p className="text-[11px] font-medium">
                    শ্রেণি শিক্ষক ভ্যালিডেশন সফল।{' '}
                    <span className="font-mono">marked_by={testAttendTeacherId}</span>
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
