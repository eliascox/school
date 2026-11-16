'use client';

import React from 'react';
import {
  ArrowLeft,
  Pencil,
  User,
  Check,
  Camera,
  Trash2,
  GraduationCap,
  Award,
  Users,
  Building2,
  Save,
} from 'lucide-react';
import { autoCropAndCompressStudentPhoto } from '@/lib/imageUtils';
import { AppLanguage } from '@/services/languageService';
import { StudentRecord } from './studentTypes';

interface StudentEditFormViewProps<T extends StudentRecord> {
  editFormData: T;
  setEditFormData: React.Dispatch<React.SetStateAction<T | null>>;
  currentLang: AppLanguage;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  showToast: (text: string, type?: 'success' | 'error') => void;
}

export function StudentEditFormView<T extends StudentRecord>({
  editFormData,
  setEditFormData,
  currentLang,
  onCancel,
  onSubmit,
  showToast,
}: StudentEditFormViewProps<T>) {
  return (
    <div className="space-y-6">
      {/* Executive Top Navigation Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl font-black text-xs transition cursor-pointer"
        >
          <ArrowLeft size={16} /> বাতিল ও প্রোফাইলে ফিরে যান
        </button>
        <div className="flex items-center gap-2 text-xs font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/60">
          <Pencil size={15} /> শিক্ষার্থী তথ্য সম্পাদনা মোড
        </div>
      </div>

      {/* Edit Form Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">শিক্ষার্থী তথ্য সম্পাদনা (Edit Student Profile)</h2>
          <p className="text-xs text-slate-400 font-semibold">শিক্ষার্থীর প্রয়োজনীয় ব্যক্তিগত, একাডেমিক ও পিতা-মাতার বিবরণ পরিবর্তন করুন</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Student Photo Preview & Upload Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-2xl text-white flex flex-col sm:flex-row items-center gap-5 shadow-sm border border-indigo-900/50">
            <div className="relative group shrink-0">
              <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-2xl bg-white/10 border-2 border-indigo-400/40 overflow-hidden flex flex-col items-center justify-center text-center shadow-lg relative">
                {editFormData.photo ? (
                  <img src={editFormData.photo} alt={editFormData.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300 p-2">
                    <User size={36} className="text-indigo-300 mb-1" />
                    <span className="text-[10px] font-extrabold text-indigo-200">কোনো ছবি নেই</span>
                  </div>
                )}
              </div>
              {editFormData.photo && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md">
                  <Check size={12} />
                </span>
              )}
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div>
                <h4 className="text-sm font-black text-white flex items-center justify-center sm:justify-start gap-2">
                  শিক্ষার্থীর পাসপোর্ট ছবি (Student Photo)
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-400/30">
                    পাসপোর্ট সাইজ
                  </span>
                </h4>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  ছবি আপলোড করলে স্বয়ংক্রিয়ভাবে পাসপোর্ট সাইজে অপ্টিমাইজড ও ডাটাবেজে সংরক্ষিত হবে।
                </p>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap pt-1">
                <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-1.5">
                  <Camera size={15} />
                  {editFormData.photo ? 'নতুন ছবি পরিবর্তন / আপলোড' : 'ছবি আপলোড করুন'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          showToast('ছবির সাইজ সর্বোচ্চ ৫MB হতে পারবে।', 'error');
                          return;
                        }
                        const compressed = await autoCropAndCompressStudentPhoto(file, 300, 360, 0.85);
                        setEditFormData((prev) => (prev ? { ...prev, photo: compressed } : null));
                      }
                    }}
                  />
                </label>

                {editFormData.photo && (
                  <button
                    type="button"
                    onClick={() => setEditFormData((prev) => (prev ? { ...prev, photo: '' } : null))}
                    className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={14} /> ছবি অপসারণ
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 1: Personal Details */}
          <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <User size={15} /> ১. শিক্ষার্থীর ব্যক্তিগত তথ্য
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-bold">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">শিক্ষার্থীর পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">জন্ম তারিখ (DOB)</label>
                <input
                  type="date"
                  value={editFormData.dob || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">লিঙ্গ (Gender)</label>
                <select
                  value={editFormData.gender || 'পুরুষ'}
                  onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="পুরুষ">{currentLang === 'en' ? 'Male' : 'পুরুষ'}</option>
                  <option value="নারী">{currentLang === 'en' ? 'Female' : 'নারী'}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">ধর্ম (Religion)</label>
                <select
                  value={editFormData.religion || 'ইসলাম'}
                  onChange={(e) => setEditFormData({ ...editFormData, religion: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="ইসলাম">{currentLang === 'en' ? 'Islam' : 'ইসলাম'}</option>
                  <option value="হিন্দু">{currentLang === 'en' ? 'Hinduism' : 'হিন্দু'}</option>
                  <option value="খ্রিস্টান">{currentLang === 'en' ? 'Christianity' : 'খ্রিস্টান'}</option>
                  <option value="বৌদ্ধ">{currentLang === 'en' ? 'Buddhism' : 'বৌদ্ধ'}</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">১৭ ডিজিটের ডিজিটাল জন্ম নিবন্ধন নম্বর</label>
                <input
                  type="text"
                  value={editFormData.birthRegNo || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, birthRegNo: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic Details */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/50 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/60 space-y-4">
            <h3 className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-2 border-b border-indigo-200/60 dark:border-indigo-800/60 pb-2">
              <GraduationCap size={15} /> ২. একাডেমিক তথ্য
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">শ্রেণি রোল *</label>
                <input
                  type="text"
                  required
                  value={editFormData.roll}
                  onChange={(e) => setEditFormData({ ...editFormData, roll: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">শ্রেণি (Grade) *</label>
                <select
                  value={editFormData.grade}
                  onChange={(e) => setEditFormData({ ...editFormData, grade: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="6th">৬ষ্ঠ শ্রেণি (Class 6)</option>
                  <option value="7th">৭ম শ্রেণি (Class 7)</option>
                  <option value="8th">৮ম শ্রেণি (Class 8)</option>
                  <option value="9th">৯ম শ্রেণি (Class 9)</option>
                  <option value="10th">১০ম শ্রেণি (Class 10)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">
                  {editFormData.grade === '9th' || editFormData.grade === '10th'
                    ? currentLang === 'en'
                      ? 'Group'
                      : 'বিভাগ'
                    : currentLang === 'en'
                      ? 'Section'
                      : 'শাখা'}
                </label>
                <select
                  value={editFormData.branch}
                  onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">বিভাগ / গ্রুপ</label>
                <select
                  value={editFormData.group}
                  onChange={(e) => setEditFormData({ ...editFormData, group: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="সাধারণ">{currentLang === 'en' ? 'General' : 'সাধারণ'}</option>
                  <option value="বিজ্ঞান">{currentLang === 'en' ? 'Science' : 'বিজ্ঞান'}</option>
                  <option value="মানবিক">{currentLang === 'en' ? 'Humanities' : 'মানবিক'}</option>
                  <option value="ব্যবসায় শিক্ষা">{currentLang === 'en' ? 'Business Studies' : 'ব্যবসায় শিক্ষা'}</option>
                </select>
              </div>

              {['9th', '10th'].includes(editFormData.grade) && (
                <>
                  <div>
                    <label className="block text-[10px] text-indigo-700 dark:text-indigo-300 uppercase mb-1">
                      বোর্ড রেজিস্ট্রেশন নম্বর (৯ম-১০ম)
                    </label>
                    <input
                      type="text"
                      placeholder="১০ ডিজিটের নম্বর..."
                      value={editFormData.registrationNo || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, registrationNo: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-800/60 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-teal-700 dark:text-teal-300 uppercase mb-1">এসএসসি রোল (SSC Roll)</label>
                    <input
                      type="text"
                      placeholder="৬ ডিজিটের এসএসসি রোল..."
                      value={editFormData.sscRoll || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, sscRoll: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-800/60 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-2">
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">ঐচ্ছিক বিষয়</label>
                <select
                  value={editFormData.optionalSubject}
                  onChange={(e) => setEditFormData({ ...editFormData, optionalSubject: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="কৃষি শিক্ষা">কৃষি শিক্ষা</option>
                  <option value="উচ্চতর গণিত">উচ্চতর গণিত</option>
                  <option value="কম্পিউটার শিক্ষা">কম্পিউটার শিক্ষা</option>
                  <option value="গার্হস্থ্য বিজ্ঞান">গার্হস্থ্য বিজ্ঞান</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">GPA / গ্রেড পয়েন্ট</label>
                <input
                  type="text"
                  value={editFormData.gpa || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, gpa: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 dark:text-white"
                />
              </div>

              {/* Stipend Beneficiary Selection Field */}
              <div className="sm:col-span-4 bg-amber-50/80 dark:bg-amber-950/50 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="editIsStipend"
                    checked={Boolean(editFormData.isStipend)}
                    onChange={(e) => setEditFormData({ ...editFormData, isStipend: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer shrink-0"
                  />
                  <label htmlFor="editIsStipend" className="text-xs font-black text-amber-950 dark:text-amber-200 cursor-pointer flex items-center gap-1.5">
                    <Award size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    {currentLang === 'en'
                      ? 'Mark as Stipend Beneficiary (100% Free Tuition)'
                      : 'উপবৃত্তি প্রাপ্ত শিক্ষার্থী হিসেবে চিহ্নিত করুন (১০০% ফ্রি বেতন)'}
                  </label>
                </div>

                {Boolean(editFormData.isStipend) && (
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-[10px] font-black text-amber-800 dark:text-amber-200 uppercase">ক্যাটাগরি:</label>
                    <select
                      value={editFormData.stipendCategory || 'সাধারণ উপবৃত্তি'}
                      onChange={(e) => setEditFormData({ ...editFormData, stipendCategory: e.target.value })}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/60 rounded-xl font-bold text-xs text-amber-900 dark:text-amber-200 outline-none"
                    >
                      <option value="সাধারণ উপবৃত্তি">সাধারণ উপবৃত্তি</option>
                      <option value="মেধাভিত্তিক উপবৃত্তি">মেধাভিত্তিক উপবৃত্তি</option>
                      <option value="বিশেষ সহায়তা">বিশেষ সহায়তা</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Parents & Contact */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/50 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 space-y-4">
            <h3 className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-200/60 dark:border-emerald-800/60 pb-2">
              <Users size={15} /> ৩. পিতা-মাতা ও অভিভাবক বিবরণী
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-bold">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">পিতার নাম *</label>
                <input
                  type="text"
                  required
                  value={editFormData.guardian || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, guardian: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">পিতার NID</label>
                <input
                  type="text"
                  value={editFormData.fatherNid || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, fatherNid: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">মাতার নাম</label>
                <input
                  type="text"
                  value={editFormData.motherName || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, motherName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">মোবাইল নম্বর *</label>
                <input
                  type="tel"
                  required
                  value={editFormData.mobile || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Address */}
          <div className="bg-amber-50/50 dark:bg-amber-950/50 p-5 rounded-2xl border border-amber-100 dark:border-amber-800/60 space-y-4">
            <h3 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-2 border-b border-amber-200/60 dark:border-amber-800/60 pb-2">
              <Building2 size={15} /> ৪. ঠিকানা
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">বর্তমান ঠিকানা</label>
                <input
                  type="text"
                  value={editFormData.currentAddress || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, currentAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">স্থায়ী ঠিকানা</label>
                <input
                  type="text"
                  value={editFormData.permanentAddress || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, permanentAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Form Footer Action */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Save size={16} /> পরিবর্তনসমূহ সেভ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
