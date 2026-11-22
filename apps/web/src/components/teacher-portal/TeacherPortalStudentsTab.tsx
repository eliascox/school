'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  Edit3,
  Lock,
  Phone,
  Search,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { studentService, type Student } from '@/services/studentService';
import type { StudentFeeLedger } from '@/services/financeService';
import type { ClassTeacherAssignment } from '@/services/teacherRBACService';
import { autoCropAndCompressStudentPhoto } from '@/lib/imageUtils';
import { showToast } from '@/components/ui/ToastProvider';
import {
  formatClassIdBn,
  gradeLabel,
  StudentBasicEditForm,
  toAsciiDigit,
  toBnDigit,
} from './teacherPortalUtils';

interface TeacherPortalStudentsTabProps {
  isClassTeacher: boolean;
  classTeachers: ClassTeacherAssignment[];
  classStudents: Student[];
  studentLedgers: Record<string, StudentFeeLedger>;
  teacherName: string;
  onRefreshData: () => void;
  showAlert: (type: 'success' | 'error', text: string) => void;
}

const EMPTY_FORM: StudentBasicEditForm = {
  name: '',
  guardian: '',
  fatherName: '',
  motherName: '',
  mobile: '',
  dob: '',
  gender: 'পুরুষ',
  religion: 'ইসলাম',
  bloodGroup: '',
  currentAddress: '',
  permanentAddress: '',
  photo: '',
  remarks: '',
};

export default function TeacherPortalStudentsTab({
  isClassTeacher,
  classTeachers,
  classStudents,
  studentLedgers,
  teacherName,
  onRefreshData,
  showAlert,
}: TeacherPortalStudentsTabProps) {
  const [studentSearch, setStudentSearch] = useState('');
  const [feeFilter, setFeeFilter] = useState<'all' | 'due' | 'paid'>('all');
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<StudentBasicEditForm>(EMPTY_FORM);

  // Close modal safely on Escape key
  useEffect(() => {
    if (!editStudent) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditStudent(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editStudent]);

  const feeCounts = useMemo(() => {
    let paid = 0;
    let due = 0;
    for (const st of classStudents) {
      const ledger = studentLedgers[st.id];
      const totalDue = ledger ? ledger.totalDue : 0;
      if (totalDue === 0) paid++;
      else due++;
    }
    return { all: classStudents.length, paid, due };
  }, [classStudents, studentLedgers]);

  const filteredStudents = useMemo(() => {
    const rawQ = studentSearch.trim();
    const lowerQ = rawQ.toLowerCase();
    const asciiQ = toAsciiDigit(rawQ).toLowerCase();

    return classStudents.filter((st) => {
      const ledger = studentLedgers[st.id];
      const totalDue = ledger ? ledger.totalDue : 0;

      if (feeFilter === 'due' && totalDue === 0) return false;
      if (feeFilter === 'paid' && totalDue > 0) return false;

      if (!rawQ) return true;

      const haystack = [
        st.name,
        st.roll,
        st.mobile || '',
        st.fatherName || '',
        st.guardian || '',
      ]
        .join(' ')
        .toLowerCase();

      return (
        haystack.includes(lowerQ) || toAsciiDigit(haystack).includes(asciiQ)
      );
    });
  }, [classStudents, studentLedgers, studentSearch, feeFilter]);

  const handleOpenEditStudent = (st: Student) => {
    if (!isClassTeacher) return; // Strict RBAC guard
    setEditStudent(st);
    setEditForm({
      name: st.name || '',
      guardian: st.guardian || '',
      fatherName: st.fatherName || '',
      motherName: st.motherName || '',
      mobile: st.mobile || '',
      dob: st.dob || '',
      gender: st.gender || 'পুরুষ',
      religion: st.religion || 'ইসলাম',
      bloodGroup: st.bloodGroup || '',
      currentAddress: st.currentAddress || '',
      permanentAddress: st.permanentAddress || '',
      photo: st.photo || '',
      remarks: st.remarks || '',
    });
  };

  const handleSaveStudentBasicInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isClassTeacher || !editStudent) return;
    if (!editForm.name.trim()) {
      showAlert('error', 'শিক্ষার্থীর নাম অবশ্যই দিতে হবে!');
      return;
    }

    const res = studentService.updateStudentBasicInfo(
      editStudent.id,
      editForm,
      teacherName || 'শ্রেণি শিক্ষক'
    );

    if (res.success) {
      showAlert('success', res.message);
      setEditStudent(null);
      onRefreshData();
    } else {
      showAlert('error', res.message);
    }
  };

  // Strict RBAC Gate: Class Teacher Only
  if (!isClassTeacher) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-10 text-center space-y-2.5">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto">
          <Lock size={22} />
        </div>
        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
          অনুমতি সীমাবদ্ধ (শ্রেণি শিক্ষক প্যানেল)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          শিক্ষার্থী প্রোফাইল এডিট ও ফি তথ্য শুধুমাত্র নির্ধারিত শ্রেণি শিক্ষকদের জন্য উন্মুক্ত। আপনাকে কোনো শ্রেণির শ্রেণি শিক্ষক হিসেবে নিযুক্ত করা হলে এখানে আপনার শ্রেণির শিক্ষার্থীরা প্রদর্শিত হবে।
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
        {/* Top Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 space-y-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Users size={15} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    আমার শ্রেণির শিক্ষার্থী তালিকা ও ফি স্ট্যাটাস
                  </h2>
                  {classTeachers.map((ct) => (
                    <span
                      key={ct.id}
                      className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60"
                    >
                      {formatClassIdBn(ct.classId)}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  মৌলিক তথ্য এডিট (শ্রেণি শিক্ষক) ও ফি তথ্য (View-only)
                </p>
              </div>
            </div>

            <div className="relative w-full md:w-72">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={14}
              />
              <input
                type="text"
                placeholder="নাম, রোল বা মোবাইল খুঁজুন..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B]"
              />
              {studentSearch && (
                <button
                  type="button"
                  onClick={() => setStudentSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="অনুসন্ধান মুছুন"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Inline Counter & Fee Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'সকল শিক্ষার্থী', count: feeCounts.all },
                { id: 'paid', label: 'ফি পরিশোধিত', count: feeCounts.paid },
                { id: 'due', label: 'বকেয়া রয়েছে', count: feeCounts.due },
              ] as const
            ).map((pill) => {
              const active = feeFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setFeeFilter(pill.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span>{pill.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold font-mono ${
                      active
                        ? 'bg-[#0B5D3B] text-white'
                        : pill.id === 'due' && pill.count > 0
                        ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {toBnDigit(pill.count)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users size={24} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              কোনো শিক্ষার্থী পাওয়া যায়নি।
            </p>
            {(studentSearch || feeFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setStudentSearch('');
                  setFeeFilter('all');
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                ফিল্টার রিসেট করুন
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-slate-950/70 border-b border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-extrabold text-[11px]">
                    <th className="py-3 px-4 w-20">রোল</th>
                    <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                    <th className="py-3 px-4">পিতা / অভিভাবক</th>
                    <th className="py-3 px-4">মোবাইল</th>
                    <th className="py-3 px-4">ফি স্ট্যাটাস (View-only)</th>
                    <th className="py-3 px-4 text-right w-28">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredStudents.map((st) => {
                    const ledger = studentLedgers[st.id];
                    const totalDue = ledger ? ledger.totalDue : 0;
                    const totalPaid = ledger ? ledger.totalPaid : 0;

                    return (
                      <tr
                        key={st.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-3 px-4 font-black font-mono text-slate-900 dark:text-white">
                          {toBnDigit(st.roll)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {st.photo ? (
                              <img
                                src={st.photo}
                                alt={st.name}
                                className="w-8 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                                <User size={14} />
                              </div>
                            )}
                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white">
                                {st.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {st.religion || 'ইসলাম'} • {st.bloodGroup || '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-semibold">
                          {st.fatherName || st.guardian || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                          {st.mobile || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold text-[#0B5D3B] dark:text-emerald-400 font-mono">
                              পরিশোধ: ৳{toBnDigit(totalPaid)}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                                totalDue === 0
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                              }`}
                            >
                              {totalDue === 0
                                ? 'পরিশোধিত'
                                : `বকেয়া: ৳${toBnDigit(totalDue)}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEditStudent(st)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-[#0B5D3B] dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            <Edit3 size={12} />
                            <span>এডিট</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch-Friendly Card List */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((st) => {
                const ledger = studentLedgers[st.id];
                const totalDue = ledger ? ledger.totalDue : 0;
                const totalPaid = ledger ? ledger.totalPaid : 0;

                return (
                  <div key={st.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {st.photo ? (
                          <img
                            src={st.photo}
                            alt={st.name}
                            className="w-10 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                            <User size={16} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-black text-slate-700 dark:text-slate-300">
                              রোল {toBnDigit(st.roll)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {st.religion || 'ইসলাম'} • {st.bloodGroup || '—'}
                            </span>
                          </div>
                          <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                            {st.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            পিতা/অভিভাবক: {st.fatherName || st.guardian || '—'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenEditStudent(st)}
                        className="h-8 px-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Edit3 size={12} />
                        <span>এডিট</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      {st.mobile ? (
                        <a
                          href={`tel:${st.mobile}`}
                          className="inline-flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300"
                        >
                          <Phone size={12} className="text-[#0B5D3B] dark:text-emerald-400" />
                          <span>{st.mobile}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">মোবাইল নেই</span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-[#0B5D3B] dark:text-emerald-400 font-mono">
                          ৳{toBnDigit(totalPaid)}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                            totalDue === 0
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                          }`}
                        >
                          {totalDue === 0
                            ? 'পরিশোধিত'
                            : `বকেয়া ৳${toBnDigit(totalDue)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ─── MODAL: EDIT STUDENT BASIC INFO (CLASS TEACHER ONLY) ─── */}
      {editStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  শিক্ষার্থী মৌলিক তথ্য এডিট
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  রোল: {toBnDigit(editStudent.roll)} • শ্রেণি:{' '}
                  {gradeLabel(editStudent.grade)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditStudent(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                aria-label="বন্ধ করুন"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleSaveStudentBasicInfo}
              className="space-y-3 text-xs font-bold"
            >
              {/* Photo Upload Box (Auto-Crop & Compress Preserved) */}
              <div className="flex items-center gap-4 p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="w-16 h-20 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col items-center justify-center text-center shrink-0">
                  {editForm.photo ? (
                    <img
                      src={editForm.photo}
                      alt={editForm.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-1">
                      <User size={20} className="mb-0.5" />
                      <span className="text-[9px] font-bold">ছবি নেই</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                    শিক্ষার্থীর পাসপোর্ট ছবি (স্বয়ংক্রিয় ক্রপ ও কমপ্রেস)
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="px-3 py-1.5 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold cursor-pointer transition inline-flex items-center gap-1.5">
                      <Camera size={13} />
                      <span>
                        {editForm.photo ? 'নতুন ছবি আপলোড' : 'ছবি আপলোড করুন'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              showToast(
                                'ছবির সাইজ সর্বোচ্চ ৫MB হতে পারবে।',
                                'warning'
                              );
                              return;
                            }
                            const compressed =
                              await autoCropAndCompressStudentPhoto(
                                file,
                                300,
                                360,
                                0.85
                              );
                            setEditForm((prev) => ({
                              ...prev,
                              photo: compressed,
                            }));
                          }
                        }}
                      />
                    </label>
                    {editForm.photo && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditForm((prev) => ({ ...prev, photo: '' }))
                        }
                        className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={12} />
                        <span>মুছে ফেলুন</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  শিক্ষার্থীর পূর্ণ নাম *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                  className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    পিতার নাম
                  </label>
                  <input
                    type="text"
                    value={editForm.fatherName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, fatherName: e.target.value })
                    }
                    className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    মাতার নাম
                  </label>
                  <input
                    type="text"
                    value={editForm.motherName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, motherName: e.target.value })
                    }
                    className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    অভিভাবকের নাম
                  </label>
                  <input
                    type="text"
                    value={editForm.guardian}
                    onChange={(e) =>
                      setEditForm({ ...editForm, guardian: e.target.value })
                    }
                    className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    যোগাযোগ মোবাইল
                  </label>
                  <input
                    type="text"
                    value={editForm.mobile}
                    onChange={(e) =>
                      setEditForm({ ...editForm, mobile: e.target.value })
                    }
                    className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    লিঙ্গ
                  </label>
                  <select
                    value={editForm.gender}
                    onChange={(e) =>
                      setEditForm({ ...editForm, gender: e.target.value })
                    }
                    className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
                  >
                    <option value="পুরুষ">পুরুষ</option>
                    <option value="নারী">নারী</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    ধর্ম
                  </label>
                  <select
                    value={editForm.religion}
                    onChange={(e) =>
                      setEditForm({ ...editForm, religion: e.target.value })
                    }
                    className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
                  >
                    <option value="ইসলাম">ইসলাম</option>
                    <option value="হিন্দু">হিন্দু</option>
                    <option value="বৌদ্ধ">বৌদ্ধ</option>
                    <option value="খ্রিস্টান">খ্রিস্টান</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    রক্তের গ্রুপ
                  </label>
                  <input
                    type="text"
                    placeholder="A+, B+"
                    value={editForm.bloodGroup}
                    onChange={(e) =>
                      setEditForm({ ...editForm, bloodGroup: e.target.value })
                    }
                    className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    জন্ম তারিখ
                  </label>
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={(e) =>
                      setEditForm({ ...editForm, dob: e.target.value })
                    }
                    className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    বর্তমান ঠিকানা
                  </label>
                  <input
                    type="text"
                    value={editForm.currentAddress}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        currentAddress: e.target.value,
                      })
                    }
                    className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    স্থায়ী ঠিকানা
                  </label>
                  <input
                    type="text"
                    value={editForm.permanentAddress}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        permanentAddress: e.target.value,
                      })
                    }
                    className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  শ্রেণি শিক্ষকের মন্তব্য (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={editForm.remarks}
                  onChange={(e) =>
                    setEditForm({ ...editForm, remarks: e.target.value })
                  }
                  placeholder="শিক্ষার্থী সংক্রান্ত সংক্ষিপ্ত নোট..."
                  className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
                />
              </div>

              <div className="bg-amber-50/80 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/70 text-[11px] text-amber-900 dark:text-amber-300 font-semibold leading-relaxed">
                দ্রষ্টব্য: শ্রেণি শিক্ষকের শুধুমাত্র মৌলিক তথ্য এডিটের অনুমতি রয়েছে। রোল নম্বর, রেজাল্ট হিস্ট্রি ও ফি পরিবর্তনের অধিকার সংরক্ষিত।
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditStudent(null)}
                  className="flex-1 h-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold cursor-pointer transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer transition shadow-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
