'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Printer,
  Pencil,
  CheckCircle2,
  User,
  Award,
  Plus,
  GraduationCap,
  Users,
  Building2,
  AlertCircle,
  ShieldCheck,
  FileText,
  X,
} from 'lucide-react';
import { CertificateRecord, certificateService } from '@/services/certificateService';
import { settingsService } from '@/services/settingsService';
import OfficialCertificateDoc from '@/components/OfficialCertificateDoc';
import { StudentRecord } from './studentTypes';

interface StudentProfileViewProps {
  selectedStudent: StudentRecord;
  studentProfileTab: 'details' | 'certificates';
  setStudentProfileTab: (tab: 'details' | 'certificates') => void;
  studentCertificates: CertificateRecord[];
  selectedCertForPrint: CertificateRecord | null;
  setSelectedCertForPrint: (cert: CertificateRecord | null) => void;
  qrCodeUrl: string;
  onBackToList: () => void;
  onPrintForm: () => void;
  onEditStudent: () => void;
}

export function StudentProfileView({
  selectedStudent,
  studentProfileTab,
  setStudentProfileTab,
  studentCertificates,
  selectedCertForPrint,
  setSelectedCertForPrint,
  qrCodeUrl,
  onBackToList,
  onPrintForm,
  onEditStudent,
}: StudentProfileViewProps) {
  return (
    <div className="space-y-6">
      {/* Executive Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={onBackToList}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl font-black text-xs transition cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft size={16} /> শিক্ষার্থী তালিকায় ফিরে যান
        </button>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onPrintForm}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition cursor-pointer"
          >
            <Printer size={15} /> অফিশিয়াল ভর্তি ফরম ও রসিদ
          </button>
          <button
            onClick={onEditStudent}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs shadow-md transition cursor-pointer"
          >
            <Pencil size={15} /> তথ্য সম্পাদনা করুন
          </button>
        </div>
      </div>

      {/* Profile Main Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-6">
        {/* Banner Header */}
        <div className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-950 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            <div className="w-28 h-28 rounded-3xl bg-white/15 backdrop-blur-md border-4 border-white/20 flex items-center justify-center font-black text-white text-3xl shrink-0 overflow-hidden shadow-2xl">
              {selectedStudent.photo ? (
                <img src={selectedStudent.photo} alt="Student Photo" className="w-full h-full object-cover" />
              ) : (
                selectedStudent.name.charAt(0)
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className="px-3 py-0.5 bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <CheckCircle2 size={12} /> সক্রিয় শিক্ষার্থী
                </span>
                <span className="px-3 py-0.5 bg-white/10 text-white font-bold text-[10px] rounded-full border border-white/20">
                  সেশন: ২০২৬
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{selectedStudent.name}</h2>

              <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-indigo-200 font-semibold flex-wrap">
                <span>
                  আইডি: <strong className="font-mono text-amber-300">{selectedStudent.id}</strong>
                </span>
                <span>
                  রোল: <strong className="font-mono text-white">{selectedStudent.roll}</strong>
                </span>
                <span>
                  শ্রেণি: <strong className="text-white">{selectedStudent.grade} ({selectedStudent.branch})</strong>
                </span>
                <span>
                  বিভাগ: <strong className="text-amber-300">{selectedStudent.group}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Section Tabs */}
        <div className="px-6 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setStudentProfileTab('details')}
              className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                studentProfileTab === 'details'
                  ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 shadow-xs rounded-t-xl'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <User size={15} /> ১. ব্যক্তিগত ও একাডেমিক তথ্য
            </button>
            <button
              onClick={() => setStudentProfileTab('certificates')}
              className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                studentProfileTab === 'certificates'
                  ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 shadow-xs rounded-t-xl'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Award size={15} /> ২. সনদ ও অফিশিয়াল ডকুমেন্টস
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 font-mono">
                {studentCertificates.length}
              </span>
            </button>
          </div>

          {studentProfileTab === 'certificates' && (
            <Link
              href={`/dashboard/certificates?action=create&studentId=${selectedStudent.id}`}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0 self-start sm:self-auto mb-2 sm:mb-0"
            >
              <Plus size={14} /> নতুন সনদ ইস্যু করুন
            </Link>
          )}
        </div>

        {/* Tab 1: Personal, Academic, Parents, Address */}
        {studentProfileTab === 'details' ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <User size={16} className="text-indigo-600 dark:text-indigo-400" /> ১. শিক্ষার্থীর ব্যক্তিগত তথ্য (Personal Details)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">পূর্ণ নাম</span>
                  <span className="text-slate-900 dark:text-white">{selectedStudent.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">জন্ম তারিখ</span>
                  <span className="text-slate-900 dark:text-white">{selectedStudent.dob || '২০১০-০৫-১৫'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">লিঙ্গ (Gender)</span>
                  <span className="text-indigo-700 dark:text-indigo-300">{selectedStudent.gender || 'পুরুষ'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">ধর্ম (Religion)</span>
                  <span className="text-slate-900 dark:text-white">{selectedStudent.religion || 'ইসলাম'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">ডিজিটাল জন্ম নিবন্ধন (17 Digits)</span>
                  <span className="text-indigo-900 dark:text-indigo-200 font-mono">{selectedStudent.birthRegNo || '20101234567890123'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">রক্তের গ্রুপ</span>
                  <span className="text-rose-600 dark:text-rose-400 font-black">{selectedStudent.bloodGroup || 'অজানা (Not set)'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">জাতীয়তা</span>
                  <span className="text-slate-900 dark:text-white">বাংলাদেশী</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50/50 dark:bg-indigo-950/50 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/60 space-y-4">
              <h3 className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-2 border-b border-indigo-200/60 dark:border-indigo-800/60 pb-2">
                <GraduationCap size={16} className="text-indigo-600 dark:text-indigo-400" /> ২. একাডেমিক ও পারফরম্যান্স (Academic & Performance)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">শ্রেণি</span>
                  <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs">{selectedStudent.grade}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">শাখা (Section)</span>
                  <span className="text-slate-900 dark:text-white">{selectedStudent.branch || 'A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">বিভাগ/গ্রুপ</span>
                  <span className="text-emerald-700 dark:text-emerald-300">{selectedStudent.group || 'সাধারণ'}</span>
                </div>
                {['9th', '10th'].includes(selectedStudent.grade) && (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">বোর্ড রেজিস্ট্রেশন নম্বর</span>
                      <span className="px-2.5 py-1 bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200 rounded-lg text-xs font-mono font-bold inline-block">
                        {selectedStudent.registrationNo || 'দেওয়া হয়নি'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">এসএসসি রোল (SSC Roll)</span>
                      <span className="px-2.5 py-1 bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 rounded-lg text-xs font-mono font-bold inline-block">
                        {selectedStudent.sscRoll || 'দেওয়া হয়নি'}
                      </span>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">ঐচ্ছিক বিষয়</span>
                  <span className="text-slate-900 dark:text-white">{selectedStudent.optionalSubject || 'প্রযোজ্য নয়'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">সর্বশেষ জিপিএ (GPA)</span>
                  <span
                    className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs ${
                      selectedStudent.gpa === 'N/A' || !selectedStudent.gpa
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                        : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60'
                    }`}
                  >
                    {selectedStudent.gpa || 'N/A'}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">উপস্থিতির হার</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${selectedStudent.attendance ?? 0}%` }}></div>
                    </div>
                    <span className="text-emerald-700 dark:text-emerald-300 font-mono">{selectedStudent.attendance ?? 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50/50 dark:bg-emerald-950/50 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 space-y-3">
                <h3 className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-200/60 dark:border-emerald-800/60 pb-2">
                  <Users size={16} className="text-emerald-600 dark:text-emerald-400" /> ৩. পিতা-মাতা ও অভিভাবক
                </h3>
                <div className="space-y-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">পিতার নাম</span>
                    <span>{selectedStudent.guardian}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">পিতার NID</span>
                    <span className="font-mono text-indigo-900 dark:text-indigo-200">{selectedStudent.fatherNid || '19801234567890101'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">মাতার নাম</span>
                    <span>{selectedStudent.motherName || 'ফাতেমা বেগম'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">মোবাইল নম্বর</span>
                    <span className="font-mono text-emerald-800 dark:text-emerald-200">{selectedStudent.mobile}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50/50 dark:bg-amber-950/50 p-5 rounded-2xl border border-amber-100 dark:border-amber-800/60 space-y-3">
                <h3 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-2 border-b border-amber-200/60 dark:border-amber-800/60 pb-2">
                  <Building2 size={16} className="text-amber-600 dark:text-amber-400" /> ৪. ঠিকানা ও তথ্য ভেরিফিকেশন
                </h3>
                <div className="space-y-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">বর্তমান ঠিকানা</span>
                    <span>{selectedStudent.currentAddress || 'বরইতলী, চকরিয়া'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">স্থায়ী ঠিকানা</span>
                    <span>{selectedStudent.permanentAddress || selectedStudent.currentAddress || 'বরইতলী, চকরিয়া'}</span>
                  </div>
                  <div className="pt-2 flex items-center gap-3 border-t border-amber-200/60 dark:border-amber-800/60">
                    {qrCodeUrl && (
                      <img src={qrCodeUrl} alt="QR Verification" className="w-14 h-14 p-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/60 rounded-lg" />
                    )}
                    <div className="text-[10px]">
                      <span className="text-slate-500 dark:text-slate-400 block">ডিজিটাল ভেরিফিকেশন কোড</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white">{selectedStudent.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Award size={18} className="text-indigo-600 dark:text-indigo-400" />
                  শিক্ষার্থীর প্রত্যয়ন ও সনদপত্র হিস্ট্রি (Certificate Records)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedStudent.name} (রোল: {selectedStudent.roll}) এর নামে প্রস্তুতকৃত সকল সনদ ও দাপ্তরিক প্রত্যয়ন
                </p>
              </div>

              <Link
                href={`/dashboard/certificates?action=create&studentId=${selectedStudent.id}`}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
              >
                <Plus size={14} /> নতুন সনদ তৈরি করুন
              </Link>
            </div>

            {studentCertificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentCertificates.map((cert) => {
                  const isValid = cert.status === 'valid';
                  return (
                    <div
                      key={cert.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3.5 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800/60">
                            {cert.id}
                          </span>
                          <h4 className="font-black text-slate-900 dark:text-white text-sm mt-1.5">{cert.title || cert.type}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">স্মারক: {cert.refNo || '—'}</p>
                        </div>

                        {isValid ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/60 flex items-center gap-1">
                            <CheckCircle2 size={11} /> বৈধ
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800/60 flex items-center gap-1">
                            <AlertCircle size={11} /> বাতিলকৃত
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                        <p>
                          <strong>ইস্যুর তারিখ:</strong> <span className="font-mono">{cert.issueDate}</span>
                        </p>
                        <p>
                          <strong>প্রস্তুতকারক:</strong> {cert.createdBy || 'প্রধান শিক্ষক'}
                        </p>
                        {cert.achievementTitle && (
                          <p className="text-amber-800 dark:text-amber-200 font-semibold">
                            <strong>স্বীকৃতি:</strong> {cert.achievementTitle}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Link
                          href={`/verify-certificate?id=${cert.id}`}
                          target="_blank"
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1"
                        >
                          <ShieldCheck size={14} /> অনলাইন যাচাই
                        </Link>

                        <button
                          onClick={() => setSelectedCertForPrint(cert)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Printer size={13} /> ভিউ ও প্রিন্ট
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <FileText size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 dark:text-white text-sm">কোনো সনদপত্র ইস্যু করা হয়নি</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    {selectedStudent.name} এর জন্য এখনো কোনো প্রত্যয়ন পত্র বা সনদ তৈরি করা হয়নি।
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href={`/dashboard/certificates?action=create&studentId=${selectedStudent.id}`}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition inline-flex items-center gap-2"
                  >
                    <Plus size={14} /> এই শিক্ষার্থীর জন্য প্রথম প্রত্যয়ন প্রস্তুত করুন
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Certificate Print Preview Modal */}
        {selectedCertForPrint && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto print:p-0 print:bg-white print:relative print:z-auto print:block">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[96vh] overflow-y-auto print:overflow-visible print:shadow-none print:max-w-none print:rounded-none">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-20 print:hidden">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">প্রত্যয়ন পত্র প্রিন্ট প্রিভিউ</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">সনদ নং: {selectedCertForPrint.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      certificateService.logPrintAction(selectedCertForPrint.id);
                      window.print();
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition"
                  >
                    <Printer size={14} /> প্রিন্ট (A4)
                  </button>
                  <button
                    onClick={() => setSelectedCertForPrint(null)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="bg-slate-100/70 p-4 sm:p-6 flex justify-center overflow-x-auto print:p-0 print:bg-transparent">
                <OfficialCertificateDoc
                  cert={selectedCertForPrint}
                  settings={settingsService.getSettings()}
                  overrideStyle={selectedCertForPrint.layoutStyle}
                  mode="full_pad"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
