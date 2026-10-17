'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Search, 
  ShieldCheck, 
  Power, 
  AlertCircle,
  X,
  Building2,
  Users,
  Pencil,
  Trash2,
  Globe,
  Lock,
  Radio
} from 'lucide-react';
import Link from 'next/link';

import { studentService } from '@/services/studentService';
import { examService, ExamItem } from '@/services/examService';

export default function ExamPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [totalStudentsCount, setTotalStudentsCount] = useState<number>(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Edit Exam Modal State
  const [editExamModal, setEditExamModal] = useState<ExamItem | null>(null);
  const [editExamForm, setEditExamForm] = useState({
    title: '',
    date: '',
    status: 'আসন্ন (Upcoming)',
    isActive: true,
    isPublished: false
  });

  // New Exam Form State
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [newExamStudents, setNewExamStudents] = useState<number>(0);
  const [newExamPublish, setNewExamPublish] = useState(false);

  // Load real student count & saved exams from examService
  useEffect(() => {
    const realCount = studentService.getAllStudents().length;
    setTotalStudentsCount(realCount);
    setNewExamStudents(realCount);

    const loadExams = () => {
      const allExams = examService.getExams();
      const updatedWithLiveCount = allExams.map(ex => ({
        ...ex,
        totalStudents: (ex.totalStudents === 585 || ex.totalStudents === 132 || realCount === 0) ? realCount : (ex.totalStudents ?? realCount)
      }));
      setExams(updatedWithLiveCount);
    };

    loadExams();
    const unsub = examService.subscribe(loadExams);
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Toggle Active / Inactive Status
  const handleToggleActive = (id: string) => {
    const target = exams.find(e => e.id === id);
    if (!target) return;
    const nextState = examService.toggleExamActive(id);
    showToast(`"${target.title}" পরীক্ষাটি ${nextState ? 'সচল (Active)' : 'বন্ধ (Inactive)'} করা হয়েছে!`);
  };

  // Toggle Result Publication Status (ফলাফল পাবলিশ বাটন)
  const handleTogglePublish = (id: string) => {
    const target = exams.find(e => e.id === id);
    if (!target) return;
    const nextState = examService.toggleResultPublished(id);
    showToast(
      nextState
        ? `"${target.title}" পরীক্ষার ফলাফল সফলভাবে পাবলিশ করা হয়েছে! শিক্ষার্থীরা এখন অনলাইনে দেখতে পাবে।`
        : `"${target.title}" পরীক্ষার ফলাফল অপ্রকাশিত করা হয়েছে! শিক্ষার্থীরা এখন আর দেখতে পাবে না।`
    );
  };

  // Handle Add New Exam Submit
  const handleAddExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim()) return;

    examService.addExam({
      title: newExamTitle.trim(),
      date: newExamDate.trim() || 'তারিখ নির্ধারিত নয়',
      status: 'নতুন (New)',
      totalStudents: Number(newExamStudents),
      isActive: true,
      isPublished: newExamPublish
    });

    setIsAddModalOpen(false);
    setNewExamTitle('');
    setNewExamDate('');
    setNewExamPublish(false);
    showToast(
      newExamPublish 
        ? 'নতুন পরীক্ষা তৈরি ও ফলাফল অবিলম্বে পাবলিশ করা হয়েছে!' 
        : 'নতুন পরীক্ষা সফলভাবে তৈরি করা হয়েছে (ফলাফল ডিফল্টভাবে অপ্রকাশিত)!'
    );
  };

  // Open Edit Exam Modal
  const handleOpenEdit = (ex: ExamItem) => {
    setEditExamModal(ex);
    setEditExamForm({
      title: ex.title,
      date: ex.date,
      status: ex.status,
      isActive: ex.isActive,
      isPublished: Boolean(ex.isPublished)
    });
  };

  // Handle Edit Exam Submit
  const handleEditExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editExamModal || !editExamForm.title.trim()) return;

    examService.updateExam(editExamModal.id, {
      title: editExamForm.title.trim(),
      date: editExamForm.date.trim() || 'তারিখ নির্ধারিত নয়',
      status: editExamForm.status,
      isActive: editExamForm.isActive,
      isPublished: editExamForm.isPublished,
      publishedAt: editExamForm.isPublished ? (editExamModal.publishedAt || new Date().toISOString()) : undefined
    });

    setEditExamModal(null);
    showToast('পরীক্ষার তথ্য সফলভাবে হালনাগাদ করা হয়েছে!');
  };

  // Delete Exam
  const handleDeleteExam = (id: string, title: string) => {
    if (confirm(`আপনি কি নিশ্চিত যে "${title}" পরীক্ষাটি মুছে ফেলতে চান?`)) {
      examService.deleteExam(id);
      showToast(`"${title}" পরীক্ষাটি মুছে ফেলা হয়েছে!`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* TOP ACTIONS (Clean & Compact) */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">পরীক্ষা ব্যবস্থাপনা (Exam Management)</h2>
          <p className="text-xs text-slate-500 font-medium">পরীক্ষা তৈরি, সচল রাখা এবং শিক্ষার্থীদের জন্য অনলাইন ফলাফল পাবলিশ নিয়ন্ত্রণ</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-xs transition flex items-center gap-1.5 shrink-0 transform active:scale-95 cursor-pointer"
        >
          <Plus size={15} /> নতুন পরীক্ষা যোগ করুন
        </button>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* 📊 SUMMARY OVERVIEW STATS (Headmaster/Admin View) */}
      {/* ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <BookOpen size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">মোট পরীক্ষা</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{exams.length} টি</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">সচল পরীক্ষা</div>
            <div className="text-lg font-black text-blue-600 dark:text-blue-400">{exams.filter(e => e.isActive).length} টি</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Globe size={18} className="animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">ফলাফল প্রকাশিত (Live)</div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{exams.filter(e => e.isPublished).length} টি</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Lock size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">ফলাফল অপ্রকাশিত</div>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400">{exams.filter(e => !e.isPublished).length} টি</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* EXAM CARDS GRID WITH PUBLISH & ACTIVE CONTROLS */}
      {/* ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {exams.map(ex => (
          <div 
            key={ex.id} 
            className={`bg-white dark:bg-slate-900 p-5 rounded-3xl border transition-all duration-200 space-y-4 flex flex-col justify-between relative overflow-hidden ${
              ex.isActive 
                ? (ex.isPublished 
                    ? 'border-emerald-300 dark:border-emerald-800 shadow-sm hover:shadow-md border-t-4 border-t-emerald-500' 
                    : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md border-t-4 border-t-indigo-500')
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 border-t-4 border-t-rose-400 opacity-75'
            }`}
          >
            <div className="space-y-3.5">
              {/* Header Badges: Status & Actions */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] rounded-full border border-slate-200 dark:border-slate-700">
                  {ex.status}
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Edit Exam Button */}
                  <button
                    onClick={() => handleOpenEdit(ex)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/40 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition cursor-pointer"
                    title="পরীক্ষা তথ্য এডিট করুন"
                  >
                    <Pencil size={13} />
                  </button>

                  {/* Delete Exam Button */}
                  <button
                    onClick={() => handleDeleteExam(ex.id, ex.title)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-900/40 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition cursor-pointer"
                    title="পরীক্ষাটি মুছে ফেলুন"
                  >
                    <Trash2 size={13} />
                  </button>

                  {/* 🔘 ACTIVE / INACTIVE TOGGLE SWITCH BUTTON */}
                  <button
                    onClick={() => handleToggleActive(ex.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-black transition-all flex items-center gap-1.5 border shadow-xs cursor-pointer ${
                      ex.isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700 hover:bg-rose-100'
                    }`}
                    title={ex.isActive ? 'পরীক্ষাটি বন্ধ করতে ক্লিক করুন' : 'পরীক্ষাটি সচল করতে ক্লিক করুন'}
                  >
                    <span className={`w-2 h-2 rounded-full ${ex.isActive ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`}></span>
                    <span>{ex.isActive ? 'সচল' : 'বন্ধ'}</span>
                  </button>
                </div>
              </div>

              {/* Title & Date */}
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm leading-snug">{ex.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium mt-1">
                  <Calendar size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" /> {ex.date}
                </p>
              </div>

              {/* 📢 DEDICATED RESULT PUBLICATION CONTROL (ফলাফল পাবলিশ বাটন) */}
              <div className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                ex.isPublished 
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' 
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    ex.isPublished 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {ex.isPublished ? <Globe size={16} /> : <Lock size={16} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">অনলাইন ফলাফল:</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        ex.isPublished
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                      }`}>
                        {ex.isPublished ? '● প্রকাশিত (Live)' : '🔒 অপ্রকাশিত'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                      {ex.isPublished ? 'শিক্ষার্থীরা অনলাইনে ফলাফল দেখতে পাচ্ছে' : 'অনলাইনে ফলাফল দেখা বন্ধ রয়েছে'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTogglePublish(ex.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95 ${
                    ex.isPublished
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  title={ex.isPublished ? 'ক্লিক করে ফলাফল অপ্রকাশিত করুন' : 'ক্লিক করে ফলাফল অনলাইনে পাবলিশ করুন'}
                >
                  {ex.isPublished ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span>ফলাফল প্রকাশিত</span>
                    </>
                  ) : (
                    <>
                      <Radio size={13} />
                      <span>ফলাফল পাবলিশ</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px] flex items-center gap-1">
                <Users size={13} className="text-indigo-600 dark:text-indigo-400" /> {ex.totalStudents !== undefined ? ex.totalStudents : totalStudentsCount} জন
              </span>

              {ex.isActive ? (
                <div className="flex items-center gap-1.5">
                  <Link 
                    href="/dashboard/exam/mark-entry" 
                    className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl font-extrabold text-[11px] transition"
                  >
                    বিষয়ভিত্তিক ➔
                  </Link>
                  <Link 
                    href="/dashboard/exam/bulk-entry" 
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-[11px] shadow-sm transition flex items-center gap-1"
                  >
                    📊 বাল্ক এন্ট্রি ➔
                  </Link>
                </div>
              ) : (
                <span className="text-rose-500 font-bold text-[11px] bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
                  পরীক্ষা বন্ধ রয়েছে
                </span>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ➕ MODAL: ADD NEW EXAM                                            */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">নতুন পরীক্ষা যোগ করুন</h3>
                  <p className="text-[11px] text-slate-400 font-semibold">পরীক্ষার নাম ও সময়সূচী সেটআপ</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddExamSubmit} className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1">পরীক্ষার শিরোনাম (Exam Title) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ১ম টিউটোরিয়াল পরীক্ষা ২০২৬"
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1">পরীক্ষার তারিখ (Exam Schedule)</label>
                <input
                  type="text"
                  placeholder="যেমন: ১০ মার্চ ২০২৬ - ২০ মার্চ ২০২৬"
                  value={newExamDate}
                  onChange={(e) => setNewExamDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1">পরীক্ষার্থী সংখ্যা</label>
                <input
                  type="number"
                  value={newExamStudents}
                  onChange={(e) => setNewExamStudents(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono text-slate-900 dark:text-white font-bold"
                />
              </div>

              {/* Publication Option */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="newExamPublish"
                  checked={newExamPublish}
                  onChange={(e) => setNewExamPublish(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="newExamPublish" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  📢 ফলাফল সাথে সাথে পাবলিশ করুন (অনলাইনে উন্মুক্ত)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg transition cursor-pointer"
                >
                  পরীক্ষা তৈরি করুন
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ✏️ MODAL: EDIT EXAM                                              */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {editExamModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">পরীক্ষা তথ্য সম্পাদনা করুন</h3>
                  <p className="text-[11px] text-slate-400 font-semibold">{editExamModal.title}</p>
                </div>
              </div>
              <button onClick={() => setEditExamModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditExamSubmit} className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1">পরীক্ষার শিরোনাম (Exam Title) *</label>
                <input
                  type="text"
                  required
                  value={editExamForm.title}
                  onChange={(e) => setEditExamForm({ ...editExamForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1">পরীক্ষার তারিখ (Exam Schedule)</label>
                <input
                  type="text"
                  value={editExamForm.date}
                  onChange={(e) => setEditExamForm({ ...editExamForm, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1">স্ট্যাটাস</label>
                <select
                  value={editExamForm.status}
                  onChange={(e) => setEditExamForm({ ...editExamForm, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold cursor-pointer"
                >
                  <option value="সম্পন্ন (Completed)">সম্পন্ন (Completed)</option>
                  <option value="চলমান (Ongoing)">চলমান (Ongoing)</option>
                  <option value="আসন্ন (Upcoming)">আসন্ন (Upcoming)</option>
                  <option value="প্রস্তুতিাধীন (Draft)">প্রস্তুতিাধীন (Draft)</option>
                  <option value="নতুন (New)">নতুন (New)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editExamForm.isActive}
                  onChange={(e) => setEditExamForm({ ...editExamForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="editIsActive" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  পরীক্ষাটি সচল (Active) রাখুন (মার্ক এন্ট্রিতে দৃশ্যমান)
                </label>
              </div>

              {/* Publication Option */}
              <div className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                editExamForm.isPublished 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' 
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
              }`}>
                <input
                  type="checkbox"
                  id="editIsPublished"
                  checked={editExamForm.isPublished}
                  onChange={(e) => setEditExamForm({ ...editExamForm, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="editIsPublished" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5">
                  <span>📢 ফলাফল পাবলিশ করুন (শিক্ষার্থীরা অনলাইনে রেজাল্ট দেখতে পাবে)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditExamModal(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg transition cursor-pointer"
                >
                  তথ্য সংরক্ষণ করুন
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
