'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, X, Camera, Printer, Plus, Eye, Pencil, Trash2, CreditCard, Award, FileCheck } from 'lucide-react';
import { AppLanguage } from '@/services/languageService';
import { settingsService } from '@/services/settingsService';
import { StudentRecord, toBanglaNumeral, isFemaleGender } from './studentTypes';

interface StudentDirectoryTableProps<T extends StudentRecord> {
  currentLang: AppLanguage;
  totalStudents: number;
  filteredStudents: T[];
  paginatedStudents: T[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  gradeFilter: string;
  setGradeFilter: (v: string) => void;
  branchFilter: string;
  setBranchFilter: (v: string) => void;
  genderFilter: string;
  setGenderFilter: (v: string) => void;
  groupFilter: string;
  setGroupFilter: (v: string) => void;
  sortStrategy: 'roll_asc' | 'name_asc' | 'roll_desc' | 'name_desc';
  setSortStrategy: (v: 'roll_asc' | 'name_asc' | 'roll_desc' | 'name_desc') => void;
  selectedStudentIds: string[];
  setSelectedStudentIds: React.Dispatch<React.SetStateAction<string[]>>;
  dragOverStudentId: string | null;
  setDragOverStudentId: (id: string | null) => void;
  handleStudentPhotoUpload: (studentId: string, file: File) => Promise<void>;
  triggerSinglePhotoSelect: (studentId: string) => void;
  onOpenBulkPhotoModal: () => void;
  onSwitchToPrintList: () => void;
  onViewStudent: (student: T) => void;
  onPrintStudentForm: (student: T) => void;
  onEditStudent: (student: T) => void;
  onDeleteStudent: (studentId: string) => void;
}

export function StudentDirectoryTable<T extends StudentRecord>({
  currentLang,
  totalStudents,
  filteredStudents,
  paginatedStudents,
  searchQuery,
  setSearchQuery,
  gradeFilter,
  setGradeFilter,
  branchFilter,
  setBranchFilter,
  genderFilter,
  setGenderFilter,
  groupFilter,
  setGroupFilter,
  sortStrategy,
  setSortStrategy,
  selectedStudentIds,
  setSelectedStudentIds,
  dragOverStudentId,
  setDragOverStudentId,
  handleStudentPhotoUpload,
  triggerSinglePhotoSelect,
  onOpenBulkPhotoModal,
  onSwitchToPrintList,
  onViewStudent,
  onPrintStudentForm,
  onEditStudent,
  onDeleteStudent,
}: StudentDirectoryTableProps<T>) {
  const [openCertMenuId, setOpenCertMenuId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Top Compact Filter & Action Bar */}
      <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2.5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-44 sm:w-52 lg:w-56 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={currentLang === 'en' ? 'Search students...' : 'শিক্ষার্থী খুঁজুন...'}
              className="w-full h-9 pl-8 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
            />
          </div>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="h-9 px-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 cursor-pointer transition shrink-0"
          >
            <option value="all">{currentLang === 'en' ? 'All Classes' : 'সকল শ্রেণি'}</option>
            <option value="6th">৬ষ্ঠ (Class 6)</option>
            <option value="7th">৭ম (Class 7)</option>
            <option value="8th">৮ম (Class 8)</option>
            <option value="9th">৯ম (Class 9)</option>
            <option value="10th">১০ম (Class 10)</option>
          </select>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="h-9 px-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 cursor-pointer transition shrink-0"
          >
            <option value="all">{currentLang === 'en' ? 'All Sections' : 'সকল শাখা'}</option>
            <option value="A">শাখা A</option>
            <option value="B">শাখা B</option>
            <option value="C">শাখা C</option>
          </select>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="h-9 px-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 cursor-pointer transition shrink-0"
          >
            <option value="all">{currentLang === 'en' ? 'All Genders' : 'সকল লিঙ্গ'}</option>
            <option value="male">{currentLang === 'en' ? 'Male' : 'ছাত্র'}</option>
            <option value="female">{currentLang === 'en' ? 'Female' : 'ছাত্রী'}</option>
          </select>

          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="h-9 px-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 cursor-pointer transition shrink-0"
          >
            <option value="all">{currentLang === 'en' ? 'All Groups' : 'সকল বিভাগ'}</option>
            <option value="সাধারণ">সাধারণ</option>
            <option value="বিজ্ঞান">বিজ্ঞান</option>
            <option value="মানবিক">মানবিক</option>
            <option value="ব্যবসায়">ব্যবসায় শিক্ষা</option>
          </select>

          <select
            value={sortStrategy}
            onChange={(e) => setSortStrategy(e.target.value as 'roll_asc' | 'name_asc' | 'roll_desc' | 'name_desc')}
            className="h-9 px-2.5 bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 cursor-pointer transition shrink-0"
            title="গ্রুপ ও রোল অনুযায়ী সাজানোর ক্রম"
          >
            <option value="roll_asc">রোল: ছোট→বড় (১, ২, ৩...)</option>
            <option value="name_asc">নাম: A–Z</option>
            <option value="roll_desc">রোল: বড়→ছোট</option>
            <option value="name_desc">নাম: Z–A</option>
          </select>

          {(searchQuery || gradeFilter !== 'all' || branchFilter !== 'all' || genderFilter !== 'all' || groupFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setGradeFilter('all');
                setBranchFilter('all');
                setGenderFilter('all');
                setGroupFilter('all');
              }}
              className="h-9 px-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 border border-rose-100 dark:border-rose-800/60"
              title="ফিল্টার রিসেট করুন"
            >
              <X size={13} /> রিসেট
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenBulkPhotoModal}
            className="h-9 px-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
            title="একসাথে একাধিক শিক্ষার্থীর ছবি ড্রাগ ও ড্রপ করে আপলোড করুন"
          >
            <Camera size={14} className="shrink-0" /> বাল্ক ছবি ড্রপ
          </button>

          <Link
            href="/dashboard/students/id-card"
            className="h-9 px-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
            title="CR80 PVC স্মার্ট আইডি কার্ড প্রিন্ট"
          >
            <CreditCard size={14} className="shrink-0" /> আইডি কার্ড
          </Link>

          <button
            onClick={onSwitchToPrintList}
            className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
            title="শিক্ষার্থী তালিকা ও রিপোর্ট প্রিন্ট"
          >
            <Printer size={14} className="shrink-0" /> শিক্ষার্থী তালিকা প্রিন্ট
          </button>

          <Link
            href="/dashboard/admission"
            className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
            title="নতুন শিক্ষার্থী ভর্তি ফরম"
          >
            <Plus size={14} className="shrink-0" /> নতুন ভর্তি
          </Link>
        </div>
      </div>

      {/* Bulk Selection Certificate & Testimonial Action Bar */}
      {selectedStudentIds.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 text-white px-4 py-2.5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 text-xs font-black">
            <span className="px-2.5 py-0.5 bg-white/20 rounded-full font-mono">
              {toBanglaNumeral(selectedStudentIds.length)} জন নির্বাচিত
            </span>
            <span className="hidden sm:inline text-indigo-100 font-semibold">
              এক ক্লিকে সবার জন্য আলাদা সনদ বা প্রশংসাপত্র প্রস্তুত করুন
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/dashboard/certificates?action=batch&type=current_student&studentIds=${encodeURIComponent(selectedStudentIds.join(','))}`}
              className="px-3 py-1.5 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs"
            >
              <FileCheck size={14} /> ব্যাচ প্রত্যয়নপত্র
            </Link>
            <Link
              href={`/dashboard/certificates?action=batch&type=ssc_testimonial&studentIds=${encodeURIComponent(selectedStudentIds.join(','))}`}
              className="px-3 py-1.5 bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs"
            >
              <Award size={14} /> ব্যাচ প্রশংসাপত্র (Testimonial)
            </Link>
            <button
              type="button"
              onClick={() => setSelectedStudentIds([])}
              className="px-2.5 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              বাতিল
            </button>
          </div>
        </div>
      )}

      {/* Main Directory Table */}
      <div id="student-directory-table-top" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedStudentIds(filteredStudents.map((s) => s.id));
                      else setSelectedStudentIds([]);
                    }}
                    className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="p-3.5">
                  STUDENT <span className="text-[9px] text-indigo-500 font-bold ml-1 lowercase hidden sm:inline">(drag & drop photo)</span>
                </th>
                <th className="p-3.5">STUDENT ID</th>
                <th className="p-3.5">CLASS &amp; SECTION</th>
                <th className="p-3.5">ROLL</th>
                <th className="p-3.5">GENDER</th>
                <th className="p-3.5">GUARDIAN</th>
                <th className="p-3.5">PHONE</th>
                <th className="p-3.5 text-center">STATUS</th>
                <th className="p-3.5 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-100 font-medium text-xs">
              {paginatedStudents.map((st) => {
                const isSelected = selectedStudentIds.includes(st.id);
                return (
                  <tr
                    key={st.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800 transition group ${
                      isSelected ? 'bg-indigo-50/30 dark:bg-indigo-950/50' : ''
                    }`}
                  >
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedStudentIds((prev) =>
                            prev.includes(st.id) ? prev.filter((id) => id !== st.id) : [...prev, st.id]
                          );
                        }}
                        className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    <td
                      className={`p-3.5 transition-colors ${
                        dragOverStudentId === st.id ? 'bg-indigo-50/90 dark:bg-indigo-950/50 ring-2 ring-indigo-500/50 rounded-xl' : ''
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverStudentId(st.id);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverStudentId(st.id);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverStudentId(null);
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverStudentId(null);
                        const file = e.dataTransfer.files?.[0];
                        if (file) await handleStudentPhotoUpload(st.id, file);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => triggerSinglePhotoSelect(st.id)}
                          title="ছবি ড্রাগ করে এখানে ছেড়ে দিন অথবা ক্লিক করে ছবি পরিবর্তন করুন"
                          className={`relative w-9 h-9 rounded-full cursor-pointer transition-all duration-200 group/avatar shrink-0 select-none ${
                            dragOverStudentId === st.id
                              ? 'ring-4 ring-indigo-500 ring-offset-2 scale-110 shadow-lg bg-indigo-100 dark:bg-indigo-900/40'
                              : 'hover:ring-2 hover:ring-indigo-400 hover:scale-105'
                          }`}
                        >
                          <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-black text-indigo-700 dark:text-indigo-300 text-xs">
                            {st.photo ? <img src={st.photo} alt={st.name} className="w-full h-full object-cover" /> : <span>{st.name.charAt(0)}</span>}
                          </div>

                          <div
                            className={`absolute inset-0 rounded-full flex items-center justify-center transition-all ${
                              dragOverStudentId === st.id
                                ? 'opacity-100 bg-indigo-600/85 text-white'
                                : 'opacity-0 group-hover/avatar:opacity-100 bg-black/50 text-white'
                            }`}
                          >
                            <Camera size={14} className={dragOverStudentId === st.id ? 'animate-bounce text-amber-300' : 'text-white'} />
                          </div>

                          {dragOverStudentId === st.id && (
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg z-30 pointer-events-none animate-in fade-in">
                              ছবি ড্রপ করুন
                            </div>
                          )}
                        </div>

                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white block text-xs leading-tight">{st.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{st.group || 'সাধারণ'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">{st.id}</td>
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-100 text-xs">
                      {st.grade} ({st.branch || 'A'})
                    </td>
                    <td className="p-3.5 font-mono font-black text-slate-900 dark:text-white text-xs">{st.roll || '০১'}</td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300 text-xs">
                      {isFemaleGender(st.gender) ? 'Female' : 'Male'}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-100 text-xs">{st.guardian || 'অভিভাবক'}</td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400 text-xs">{st.mobile || '০১৮১২-০০০১০৯'}</td>

                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1 relative">
                        <button
                          onClick={() => onViewStudent(st)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition cursor-pointer"
                          title="প্রোফাইল দেখুন"
                        >
                          <Eye size={15} />
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenCertMenuId((prev) => (prev === st.id ? null : st.id))}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              openCertMenuId === st.id
                                ? 'bg-indigo-600 text-white'
                                : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                            }`}
                            title="এক-ক্লিক প্রত্যয়ন বা প্রশংসাপত্র তৈরি করুন"
                          >
                            <Award size={15} />
                          </button>
                          {openCertMenuId === st.id && (
                            <div
                              onMouseLeave={() => setOpenCertMenuId(null)}
                              className="absolute right-0 top-8 z-30 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-1.5 text-left space-y-0.5"
                            >
                              <div className="px-2.5 py-1 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                                সরাসরি সনদ ইস্যু
                              </div>
                              <Link
                                href={`/dashboard/certificates?action=create&studentId=${st.id}&type=current_student`}
                                className="block px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700"
                              >
                                অধ্যয়নরত প্রত্যয়ন পত্র
                              </Link>
                              <Link
                                href={`/dashboard/certificates?action=create&studentId=${st.id}&type=character_certificate`}
                                className="block px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-700"
                              >
                                চারিত্রিক সনদ পত্র
                              </Link>
                              <Link
                                href={`/dashboard/certificates?action=create&studentId=${st.id}&type=transfer_certificate`}
                                className="block px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700"
                              >
                                ছাড়পত্র / টিসি (TC)
                              </Link>
                              <Link
                                href={`/dashboard/certificates?action=create&studentId=${st.id}&type=ssc_testimonial`}
                                className="block px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100"
                              >
                                প্রশংসাপত্র (স্টুডিও)
                              </Link>
                              <Link
                                href={`/dashboard/ssc-transcript?studentId=${st.id}`}
                                className="block px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                              >
                                SSC অফিসিয়াল প্রশংসাপত্র
                              </Link>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => onPrintStudentForm(st)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition cursor-pointer"
                          title="ভর্তি ফরম প্রিন্ট"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          onClick={() => onEditStudent(st)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition cursor-pointer"
                          title="এডিট"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => onDeleteStudent(st.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                          title="অপসারণ"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400 font-bold text-xs">
                    কোনো শিক্ষার্থী পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-semibold">
          <span>
            মোট রেজিস্টার্ড শিক্ষার্থী: <strong>{toBanglaNumeral(totalStudents)}</strong> জন (তালিকায় প্রদর্শিত:{' '}
            <strong>{toBanglaNumeral(filteredStudents.length)}</strong> জন)
          </span>
          <span>{settingsService.getSettings().schoolName || 'প্রতিষ্ঠান'} ডিজিটাল ডিরেক্টরি</span>
        </div>
      </div>
    </div>
  );
}
