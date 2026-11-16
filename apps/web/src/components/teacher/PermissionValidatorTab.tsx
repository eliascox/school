'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Lock,
  School,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  ClassTeacherAssignment,
  SubjectAssignment,
  TeacherRecord,
  teacherRBACService,
} from '@/services/teacherRBACService';
import { getDynamicConfiguredSubjects } from './teacherUtils';

interface PermissionValidatorTabProps {
  teachers: TeacherRecord[];
  subjectAssignments: SubjectAssignment[];
  classTeachers: ClassTeacherAssignment[];
  mounted: boolean;
}

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

  return (
    <div className="space-y-5">
      {/* Info Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-5 rounded-3xl shadow-xl border border-emerald-500/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-400/20">
            <ShieldCheck size={20} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-black">ব্যাকএন্ড ওনারশিপ অথরাইজেশন সিমুলেটর</h3>
            <p className="text-[11px] text-emerald-200/70 font-medium mt-1">
              JWT token থেকে extracted teacher_id দিয়ে ডাটাবেজ টেবিলে রিয়েল-টাইম ভ্যালিডেশন টেস্ট করুন।
              <span className="text-amber-300 font-bold block mt-0.5">⚡ Tab ২ ও Tab ৩ এ এসাইনকৃত ডাটার সাথে যাচাই হয়।</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <Users size={18} className="text-indigo-600 dark:text-indigo-400" />, label: 'মোট শিক্ষক', value: teachers.length, iconBg: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-100 dark:border-indigo-800/60' },
          { icon: <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />, label: 'বিষয় বণ্টন', value: subjectAssignments.length, iconBg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-100 dark:border-blue-800/60' },
          { icon: <School size={18} className="text-emerald-600 dark:text-emerald-400" />, label: 'শ্রেণি শিক্ষক', value: classTeachers.length, iconBg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-800/60' },
        ].map((s, i) => (
          <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl ${s.iconBg} border flex items-center justify-center shrink-0`}>
              {s.icon}
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight block leading-none">{s.value}</span>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two Test Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Test 1: Subject Mark Entry */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3 text-xs font-bold">
          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <ClipboardCheck size={16} className="text-indigo-600 dark:text-indigo-400" />
            ১. নম্বর এন্ট্রি ওনারশিপ টেস্ট
          </h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium !mt-1">Tab ২ তে এসাইনকৃত শ্রেণি ও বিষয়ের সাথে যাচাই</p>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">লগইনকৃত শিক্ষক *</label>
            <select
              value={testSubjectTeacherId}
              onChange={(e) => setTestSubjectTeacherId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="">-- শিক্ষক নির্বাচন --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.id})
                </option>
              ))}
            </select>
          </div>

          {testSubjectTeacherId && (() => {
            const myAssignments = subjectAssignments.filter((sa) => sa.teacherId === testSubjectTeacherId);
            return myAssignments.length > 0 ? (
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 rounded-xl">
                <p className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold mb-1.5">📋 এসাইনকৃত বিষয়সমূহ:</p>
                <div className="flex flex-wrap gap-1">
                  {myAssignments.map((sa) => (
                    <span key={sa.id} className="px-1.5 py-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded">
                      {sa.classId} → {sa.subjectId}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[10px] text-amber-800 dark:text-amber-200">
                ⚠️ কোনো বিষয়ে এসাইন করা হয়নি। Tab ২ থেকে এসাইন করুন।
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">শ্রেণি</label>
              <select
                value={testSubjectClassId}
                onChange={(e) => setTestSubjectClassId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold cursor-pointer"
              >
                {['6th', '7th', '8th', '9th', '10th'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">বিষয়</label>
              <select
                value={testSubjectId}
                onChange={(e) => setTestSubjectId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold cursor-pointer"
              >
                {getDynamicConfiguredSubjects(testSubjectClassId, 'all', mounted).map((sub) => (
                  <option key={sub.name} value={sub.name}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">প্রাপ্ত নম্বর</label>
              <input
                type="number"
                value={testObtainedMarks}
                onChange={(e) => setTestObtainedMarks(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">মোট নম্বর</label>
              <input
                type="number"
                value={testFullMarks}
                onChange={(e) => setTestFullMarks(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="pt-1">
            {(() => {
              if (!testSubjectTeacherId) {
                return <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-center text-[11px]">শিক্ষক নির্বাচন করুন</div>;
              }
              const isOwner = teacherRBACService.validateSubjectOwnership(testSubjectTeacherId, testSubjectClassId, testSubjectId, 2026);
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
                    <strong className="text-rose-700 dark:text-rose-300 flex items-center gap-1 text-[11px]"><Lock size={13} /> 403 FORBIDDEN</strong>
                    <p className="text-[10px]">এই শিক্ষককে {testSubjectClassId} শ্রেণিতে &ldquo;{testSubjectId}&rdquo; বিষয়ে এসাইন করা হয়নি!</p>
                  </div>
                );
              }
              if (!markVal.valid) {
                return (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-1">
                    <strong className="text-amber-700 dark:text-amber-300 flex items-center gap-1 text-[11px]"><AlertTriangle size={13} /> INVALID INPUT</strong>
                    <p className="text-[10px]">{markVal.error}</p>
                  </div>
                );
              }
              return (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-1">
                  <strong className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1 text-[11px]"><CheckCircle2 size={13} /> 200 AUTHORIZED</strong>
                  <p className="text-[10px]">ওনারশিপ ভ্যালিডেশন সফল! entered_by={testSubjectTeacherId}</p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Test 2: Attendance Ownership */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3 text-xs font-bold">
          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <GraduationCap size={16} className="text-teal-600 dark:text-teal-400" />
            ২. হাজিরা ওনারশিপ টেস্ট
          </h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium !mt-1">Tab ৩ তে নির্বাচিত শ্রেণি শিক্ষকের সাথে যাচাই</p>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">লগইনকৃত শিক্ষক *</label>
            <select
              value={testAttendTeacherId}
              onChange={(e) => setTestAttendTeacherId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="">-- শিক্ষক নির্বাচন --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
              ))}
            </select>
          </div>

          {testAttendTeacherId && (() => {
            const myClasses = classTeachers.filter((ct) => ct.teacherId === testAttendTeacherId);
            return myClasses.length > 0 ? (
              <div className="p-2.5 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/60 rounded-xl">
                <p className="text-[10px] text-teal-700 dark:text-teal-300 font-bold mb-1.5">👑 শ্রেণি শিক্ষক হিসেবে নির্বাচিত:</p>
                <div className="flex flex-wrap gap-1">
                  {myClasses.map((ct) => (
                    <span key={ct.id} className="px-2 py-0.5 bg-teal-600 text-white text-[9px] font-bold rounded">{ct.classId}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[10px] text-amber-800 dark:text-amber-200">
                ⚠️ কোনো শ্রেণির শ্রেণি শিক্ষক হিসেবে নির্বাচিত নন। Tab ৩ থেকে নির্বাচন করুন।
              </div>
            );
          })()}

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">হাজিরা গ্রহণের শ্রেণি</label>
            <select
              value={testAttendClassId}
              onChange={(e) => setTestAttendClassId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold cursor-pointer"
            >
              <option value="6th-A">৬ষ্ঠ শ্রেণি - শাখা A</option>
              <option value="7th-A">৭ম শ্রেণি - শাখা A</option>
              <option value="8th-A">৮ম শ্রেণি - শাখা A</option>
              <option value="9th-A">৯ম শ্রেণি - শাখা A</option>
              <option value="10th-A">১০ম শ্রেণি - শাখা A</option>
            </select>
          </div>

          <div className="pt-1">
            {(() => {
              if (!testAttendTeacherId) {
                return <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-center text-[11px]">শিক্ষক নির্বাচন করুন</div>;
              }
              const isClassTeacher = teacherRBACService.validateClassTeacherOwnership(testAttendTeacherId, testAttendClassId, 2026);
              if (!isClassTeacher) {
                return (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60 rounded-xl space-y-1">
                    <strong className="text-rose-700 dark:text-rose-300 flex items-center gap-1 text-[11px]"><Lock size={13} /> 403 FORBIDDEN</strong>
                    <p className="text-[10px]">শিক্ষক {testAttendTeacherId} উক্ত {testAttendClassId} শ্রেণির &ldquo;Class Teacher&rdquo; নন!</p>
                  </div>
                );
              }
              return (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-1">
                  <strong className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1 text-[11px]"><CheckCircle2 size={13} /> 200 AUTHORIZED</strong>
                  <p className="text-[10px]">শ্রেণি শিক্ষক ভ্যালিডেশন সফল! marked_by={testAttendTeacherId}</p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
