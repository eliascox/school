'use client';

import React from 'react';
import { FileText, Printer } from 'lucide-react';

export interface SscSingleFormState {
  studentName: string;
  setStudentName: (v: string) => void;
  fatherName: string;
  setFatherName: (v: string) => void;
  motherName: string;
  setMotherName: (v: string) => void;
  village: string;
  setVillage: (v: string) => void;
  postOffice: string;
  setPostOffice: (v: string) => void;
  upazilla: string;
  setUpazilla: (v: string) => void;
  district: string;
  setDistrict: (v: string) => void;
  gender: 'Male' | 'Female' | 'Other';
  setGender: (v: 'Male' | 'Female' | 'Other') => void;
  dob: string;
  setDob: (v: string) => void;
  group: string;
  setGroup: (v: string) => void;
  boardRoll: string;
  setBoardRoll: (v: string) => void;
  boardReg: string;
  setBoardReg: (v: string) => void;
  gpa: string;
  setGpa: (v: string) => void;
  gradeLetter: string;
  setGradeLetter: (v: string) => void;
  passingYear: string;
  setPassingYear: (v: string) => void;
  refNo: string;
  setRefNo: (v: string) => void;
  issueDate: string;
  setIssueDate: (v: string) => void;
  session: string;
  setSession: (v: string) => void;
  remarks: string;
  setRemarks: (v: string) => void;
}

export interface SscSingleGeneratorTabProps {
  form: SscSingleFormState;
  onSubmit: (e: React.FormEvent) => void;
}

export default function SscSingleGeneratorTab({ form, onSubmit }: SscSingleGeneratorTabProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 print:hidden">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <h3 className="font-black text-slate-950 dark:text-white text-base flex items-center gap-2">
          <FileText size={20} className="text-indigo-600 dark:text-indigo-400" />
          একক প্রশংসাপত্র প্রস্তুতকরণ (Single English Testimonial Generator)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          সাইজ ৯.২&quot; × ৮.২&quot; ফরম্যাটে নির্দিষ্ট একজন পরীক্ষার্থীর তথ্য প্রদান করে ইংরেজি প্রশংসাপত্র প্রস্তুত করুন।
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold">
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300">শিক্ষার্থীর নাম (Name in English) *</label>
            <input
              type="text"
              required
              value={form.studentName}
              onChange={(e) => form.setStudentName(e.target.value)}
              placeholder="e.g. MOHAMMAD SHIHAB UDDIN"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-black text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300">পিতার নাম (Father&apos;s Name) *</label>
            <input
              type="text"
              required
              value={form.fatherName}
              onChange={(e) => form.setFatherName(e.target.value)}
              placeholder="e.g. Md. Ibrahim"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300">মাতার নাম (Mother&apos;s Name) *</label>
            <input
              type="text"
              required
              value={form.motherName}
              onChange={(e) => form.setMotherName(e.target.value)}
              placeholder="e.g. Begum Fatema"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300">গ্রাম (Village) *</label>
            <input
              type="text"
              required
              value={form.village}
              onChange={(e) => form.setVillage(e.target.value)}
              placeholder="e.g. Boraitoli"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300">ডাকঘর (Post Office) *</label>
            <input
              type="text"
              required
              value={form.postOffice}
              onChange={(e) => form.setPostOffice(e.target.value)}
              placeholder="e.g. Boraitoli"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300">উপজেলা (Upazilla) *</label>
            <input
              type="text"
              required
              value={form.upazilla}
              onChange={(e) => form.setUpazilla(e.target.value)}
              placeholder="e.g. Chakaria"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300">জেলা (District) *</label>
            <input
              type="text"
              required
              value={form.district}
              onChange={(e) => form.setDistrict(e.target.value)}
              placeholder="e.g. Cox's Bazar"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300">লিঙ্গ (Gender for Pronouns) *</label>
            <select
              value={form.gender}
              onChange={(e) => form.setGender(e.target.value as 'Male' | 'Female' | 'Other')}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="Male">ছাত্র / Male (son, He, his)</option>
              <option value="Female">ছাত্রী / Female (daughter, She, her)</option>
              <option value="Other">অন্যান্য / Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300">জন্ম তারিখ (Date of Birth) *</label>
            <input
              type="date"
              required
              value={form.dob}
              onChange={(e) => form.setDob(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300">বিভাগ / গ্রুপ (Group in English) *</label>
            <select
              value={form.group}
              onChange={(e) => form.setGroup(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="Science">Science (বিজ্ঞান)</option>
              <option value="Humanities">Humanities (মানবিক)</option>
              <option value="Business Studies">Business Studies (ব্যবসায় শিক্ষা)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300">বোর্ড রোল নম্বর (Board Roll) *</label>
            <input
              type="text"
              required
              value={form.boardRoll}
              onChange={(e) => form.setBoardRoll(e.target.value)}
              placeholder="102931"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono font-black text-indigo-700 dark:text-indigo-300"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300">রেজিস্ট্রেশন নম্বর (Board Reg No) *</label>
            <input
              type="text"
              required
              value={form.boardReg}
              onChange={(e) => form.setBoardReg(e.target.value)}
              placeholder="1810293819"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300">প্রাপ্ত জিপিএ (GPA Out of 5.00) *</label>
            <input
              type="text"
              required
              value={form.gpa}
              onChange={(e) => {
                const val = e.target.value;
                form.setGpa(val);
                const n = parseFloat(val);
                if (n >= 5.0) form.setGradeLetter('A+');
                else if (n >= 4.0) form.setGradeLetter('A');
                else if (n >= 3.5) form.setGradeLetter('A-');
                else if (n >= 3.0) form.setGradeLetter('B');
                else if (n >= 2.0) form.setGradeLetter('C');
                else form.setGradeLetter('D');
              }}
              placeholder="5.00"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300">লেটার গ্রেড (Letter Grade)</label>
            <input
              type="text"
              value={form.gradeLetter}
              onChange={(e) => form.setGradeLetter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-black text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300">পরীক্ষার সন (Passing Year)</label>
            <input
              type="text"
              value={form.passingYear}
              onChange={(e) => form.setPassingYear(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300">স্মারক নম্বর (Ref No)</label>
            <input
              type="text"
              value={form.refNo}
              onChange={(e) => form.setRefNo(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300">ইস্যুর তারিখ (Issue Date)</label>
            <input
              type="date"
              value={form.issueDate}
              onChange={(e) => form.setIssueDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300">সেশন (Session)</label>
            <input
              type="text"
              value={form.session}
              onChange={(e) => form.setSession(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-1.5 text-xs font-bold">
          <label className="text-slate-700 dark:text-slate-300">চারিত্রিক মন্তব্য (English Character Remarks)</label>
          <input
            type="text"
            value={form.remarks}
            onChange={(e) => form.setRemarks(e.target.value)}
            placeholder="He bears an exemplary moral character."
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-medium text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Printer size={16} />
            সনদ তৈরি ও প্রিন্ট করুন (Generate & Print Certificate)
          </button>
        </div>
      </form>
    </div>
  );
}
