'use client';

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Users, 
  CheckSquare, 
  Square, 
  Sparkles, 
  School,
  History,
  ShieldCheck,
  Award,
  Filter,
  CheckCheck
} from 'lucide-react';
import { studentService, Student } from '@/services/studentService';
import { examService, ExamItem } from '@/services/examService';
import { generateStudentMarksheetData } from '@/components/OfficialMarksheetSheet';

interface StudentPromotionItem {
  id: string;
  roll: string;
  name: string;
  grade: string;
  section: string;
  group: string;
  gpa: string;
  letterGrade?: string;
  status: 'Pass' | 'Fail' | 'Pending';
  hasMarks: boolean;
  failedCount?: number;
  totalObtained?: number;
  selected: boolean;
  alreadyPromoted?: boolean;
}

interface PromotionLog {
  id: string;
  timestamp: string;
  fromGrade: string;
  fromGradeKey?: string;
  toGrade: string;
  count: number;
  session: string;
  promotedIds?: string[];
}

export default function StudentPromotionPage() {
  const [mounted, setMounted] = useState(false);
  const [fromGrade, setFromGrade] = useState<'6th' | '7th' | '8th' | '9th' | '10th'>('6th');
  const [toGrade, setToGrade] = useState<string>('৭ম শ্রেণি (7th)');
  const [targetGradeKey, setTargetGradeKey] = useState<string>('7th');
  const [targetSession, setTargetSession] = useState<string>('২০২৭');
  const [targetGroup, setTargetGroup] = useState<string>('বিজ্ঞান');
  const [selectedExam, setSelectedExam] = useState<string>('বার্ষিক পরীক্ষা ২০২৬');
  const [availableExams, setAvailableExams] = useState<ExamItem[]>([]);

  const [students, setStudents] = useState<StudentPromotionItem[]>([]);
  const [promotionLogs, setPromotionLogs] = useState<PromotionLog[]>([]);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadStudents = (grade: string, examName: string = selectedExam) => {
    const rawStudents = studentService.getStudentsByFilter(grade);
    
    // Load promotion history to prevent double-promotion
    let promotionHistory: PromotionLog[] = [];
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sms_promotion_history');
        if (saved) promotionHistory = JSON.parse(saved);
      } catch (e) {}
    }
    
    const mapped: StudentPromotionItem[] = rawStudents.map((st, idx) => {
      // Check if already promoted from this grade in current target session
      const alreadyPromoted = promotionHistory.some(
        (log) => log.promotedIds && log.promotedIds.includes(st.id) && log.fromGradeKey === grade
      );

      // Evaluate true marksheet & GPA for the student in the selected exam
      const studentProfile = {
        id: st.id,
        roll: st.roll || String(idx + 1).padStart(2, '0'),
        name: st.name,
        grade: st.grade || grade,
        gradeBn: grade === '6th' ? '৬ষ্ঠ' : grade === '7th' ? '৭ম' : grade === '8th' ? '৮ম' : grade === '9th' ? '৯ম' : '১০ম',
        section: st.section || st.branch || 'A',
        group: st.group || 'সাধারণ',
        fatherName: st.fatherName || '',
        motherName: st.motherName || '',
        session: st.session || '২০২৬',
        optionalSubject: st.optionalSubject || ''
      };

      const result = generateStudentMarksheetData(studentProfile, {
        selectedExam: examName,
        selectedGrade: st.grade || grade,
        selectedBranch: st.section || st.branch || 'A'
      });

      const hasMarks = Boolean(result && result.subjects && result.subjects.some((s: any) => s.hasEnteredMarks));
      
      let gpa = '';
      let letterGrade = '';
      let status: 'Pass' | 'Fail' | 'Pending' = 'Pending';
      let failedCount = 0;
      let totalObtained = 0;

      if (hasMarks && result) {
        totalObtained = result.totalObtained || 0;
        failedCount = result.hasFailed ? (result.subjects.filter((s: any) => s.letterGrade === 'F').length || 1) : 0;
        
        if (result.hasFailed) {
          status = 'Fail';
          gpa = result.finalGPA > 0 ? result.finalGPA.toFixed(2) : '0.00';
          letterGrade = 'F';
        } else {
          status = 'Pass';
          gpa = result.finalGPA.toFixed(2);
          letterGrade = result.overallGrade || 'A';
        }
      } else if (st.gpa && !isNaN(parseFloat(st.gpa)) && parseFloat(st.gpa) > 0) {
        // Fallback to student profile GPA only if explicitly entered
        const pGpa = parseFloat(st.gpa);
        gpa = pGpa.toFixed(2);
        status = pGpa >= 1.0 ? 'Pass' : 'Fail';
        letterGrade = pGpa >= 5.0 ? 'A+' : pGpa >= 4.0 ? 'A' : pGpa >= 3.5 ? 'A-' : pGpa >= 3.0 ? 'B' : pGpa >= 2.0 ? 'C' : pGpa >= 1.0 ? 'D' : 'F';
      } else {
        // No exam marks entered and no profile GPA
        gpa = '--';
        status = 'Pending';
        letterGrade = '-';
      }

      // Default selection:
      // If student Passed: selected = true (unless already promoted)
      // If student Failed: selected = false (do not auto-promote failed students)
      // If Pending (no marks entered yet): selected = true (so teachers can still promote if digital marksheet isn't used)
      const selected = !alreadyPromoted && status !== 'Fail';

      return {
        id: st.id,
        roll: st.roll || String(idx + 1).padStart(2, '0'),
        name: st.name,
        grade: st.grade || grade,
        section: st.section || st.branch || 'A',
        group: st.group || 'সাধারণ',
        gpa,
        letterGrade,
        status,
        hasMarks,
        failedCount,
        totalObtained,
        selected,
        alreadyPromoted,
      };
    });
    setStudents(mapped);
  };

  const loadLogs = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sms_promotion_history');
      if (saved) {
        try { setPromotionLogs(JSON.parse(saved)); } catch (e) {}
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    const exams = examService.getExams();
    setAvailableExams(exams);
    loadStudents('6th', selectedExam);
    loadLogs();

    const handleStorage = () => {
      loadStudents(fromGrade, selectedExam);
      loadLogs();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, []);

  const handleExamChange = (newExam: string) => {
    setSelectedExam(newExam);
    loadStudents(fromGrade, newExam);
  };

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 5000);
  };

  const handleGradeStepChange = (grade: '6th' | '7th' | '8th' | '9th' | '10th') => {
    setFromGrade(grade);
    if (grade === '6th') {
      setToGrade('৭ম শ্রেণি (7th)');
      setTargetGradeKey('7th');
    } else if (grade === '7th') {
      setToGrade('৮ম শ্রেণি (8th)');
      setTargetGradeKey('8th');
    } else if (grade === '8th') {
      setToGrade('৯ম শ্রেণি (9th)');
      setTargetGradeKey('9th');
    } else if (grade === '9th') {
      setToGrade('১০ম শ্রেণি (10th)');
      setTargetGradeKey('10th');
    } else if (grade === '10th') {
      setToGrade('এসএসসি পাস আউট (Alumni)');
      setTargetGradeKey('Alumni');
    }
    loadStudents(grade, selectedExam);
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setStudents(prev => prev.map(s => s.alreadyPromoted ? s : { ...s, selected: checked }));
  };

  const handleToggleSelectPassed = () => {
    setStudents(prev => prev.map(s => {
      if (s.alreadyPromoted) return s;
      return { ...s, selected: s.status === 'Pass' };
    }));
  };

  const handleToggleStudent = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  const handleExecutePromotion = () => {
    const selectedIds = students.filter(s => s.selected && !s.alreadyPromoted).map(s => s.id);

    if (selectedIds.length === 0) {
      return showAlert('error', 'অনুগ্রহ করে অন্তত একজন শিক্ষার্থী নির্বাচন করুন!');
    }

    const groupOverride = targetGradeKey === '9th' ? targetGroup : undefined;
    const res = studentService.promoteStudents(selectedIds, targetGradeKey, targetSession, groupOverride);

    if (res.success) {
      // Add log
      const newLog: PromotionLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString('bn-BD'),
        fromGrade: fromGrade === '6th' ? '৬ষ্ঠ' : fromGrade === '7th' ? '৭ম' : fromGrade === '8th' ? '৮ম' : fromGrade === '9th' ? '৯ম' : '১০ম',
        fromGradeKey: fromGrade,
        toGrade,
        count: res.count,
        session: targetSession,
        promotedIds: selectedIds,
      };

      const updatedLogs = [newLog, ...promotionLogs];
      setPromotionLogs(updatedLogs);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sms_promotion_history', JSON.stringify(updatedLogs));
      }

      showAlert('success', res.message);
      loadStudents(fromGrade);
    } else {
      showAlert('error', res.message);
    }
  };

  if (!mounted) return <div className="p-8 text-center font-bold text-slate-400">প্রমোশন মডিউল লোড হচ্ছে...</div>;

  const selectedCount = students.filter(s => s.selected).length;

  return (
    <div className="w-full space-y-6 pb-12 font-sans text-slate-900">
      


      {/* ALERT MESSAGES */}
      {alertMsg && (
        <div className={`p-4 rounded-2xl text-xs font-black flex items-center gap-2 animate-in fade-in ${
          alertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-950 border border-emerald-300' : 'bg-rose-50 text-rose-950 border border-rose-300'
        }`}>
          {alertMsg.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-rose-600" />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* STEP 1: CLASS PROMOTION SELECTOR TABS       */}
      {/* ═══════════════════════════════════════════ */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <GraduationCap className="text-indigo-600" size={20} />
              ১. প্রমোশন শ্রেণি সিলেক্ট করুন
            </h2>
            <p className="text-xs text-slate-500 font-semibold">কোন শ্রেণি থেকে কোন শ্রেণিতে প্রমোশন দিবেন তা নির্ধারণ করুন</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              <Award size={14} className="text-amber-700" />
              <span className="text-amber-950 font-extrabold">মূল্যায়ন পরীক্ষা:</span>
              <select
                value={selectedExam}
                onChange={(e) => handleExamChange(e.target.value)}
                className="px-2 py-0.5 bg-white border border-amber-300 rounded font-bold text-amber-950 text-xs cursor-pointer outline-none"
              >
                <option value="বার্ষিক পরীক্ষা ২০২৬">বার্ষিক পরীক্ষা ২০২৬ (Annual Exam)</option>
                <option value="অর্ধ-বার্ষিক পরীক্ষা ২০২৬">অর্ধ-বার্ষিক পরীক্ষা ২০২৬</option>
                <option value="এসএসসি প্রাক-নির্বাচনী ২০২৬">এসএসসি প্রাক-নির্বাচনী ২০২৬</option>
                <option value="১ম টিউটোরিয়াল পরীক্ষা ২০২৬">১ম টিউটোরিয়াল পরীক্ষা ২০২৬</option>
                {availableExams
                  .filter(e => !['বার্ষিক পরীক্ষা ২০২৬', 'অর্ধ-বার্ষিক পরীক্ষা ২০২৬', 'এসএসসি প্রাক-নির্বাচনী ২০২৬', '১ম টিউটোরিয়াল পরীক্ষা ২০২৬'].includes(e.title))
                  .map(ex => (
                    <option key={ex.id} value={ex.title}>{ex.title}</option>
                  ))
                }
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold bg-indigo-50 px-3.5 py-1.5 rounded-xl border border-indigo-200">
              <span className="text-indigo-950 font-extrabold">পরবর্তী সেশন:</span>
              <input
                type="text"
                value={targetSession}
                onChange={(e) => setTargetSession(e.target.value)}
                className="w-16 px-2 py-0.5 bg-white border border-indigo-300 rounded text-center font-mono font-black text-indigo-900"
              />
            </div>
          </div>
        </div>

        {/* Step Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-black">
          {[
            { key: '6th', from: '৬ষ্ঠ শ্রেণি', to: '৭ম শ্রেণি' },
            { key: '7th', from: '৭ম শ্রেণি', to: '৮ম শ্রেণি' },
            { key: '8th', from: '৮ম শ্রেণি', to: '৯ম শ্রেণি' },
            { key: '9th', from: '৯ম শ্রেণি', to: '১০ম শ্রেণি' },
            { key: '10th', from: '১০ম শ্রেণি', to: 'এসএসসি পাস (Alumni)' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => handleGradeStepChange(item.key as any)}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                fromGrade === item.key
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-indigo-500'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-[10px] text-amber-400 uppercase font-extrabold">{item.from}</span>
              <div className="flex items-center gap-1 font-extrabold text-xs">
                <span>{item.to}</span>
                <ArrowRight size={12} className={fromGrade === item.key ? 'text-amber-400' : 'text-slate-400'} />
              </div>
            </button>
          ))}
        </div>

        {/* Additional Group selection if target grade is 9th */}
        {targetGradeKey === '9th' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in">
            <span className="text-amber-950 flex items-center gap-1.5">
              <Sparkles size={16} className="text-amber-600" />
              ৯ম শ্রেণিতে প্রমোশনপ্রাপ্ত শিক্ষার্থীদের বিভাগ (Group) সিলেক্ট করুন:
            </span>
            <select
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
              className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl outline-none font-bold text-amber-950 cursor-pointer"
            >
              <option value="বিজ্ঞান">🧪 বিজ্ঞান (Science)</option>
              <option value="মানবিক">📖 মানবিক (Humanities)</option>
              <option value="ব্যবসায় শিক্ষা">📊 ব্যবসায় শিক্ষা (Commerce)</option>
            </select>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* STEP 2: STUDENTS PROMOTION LIST & SELECTION */}
      {/* ═══════════════════════════════════════════ */}
      <div id="promotion-table-section" className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Users className="text-indigo-600" size={18} />
              ২. প্রমোশনযোগ্য শিক্ষার্থীদের তালিকা ({students.length} জন)
            </h3>
            <p className="text-xs text-slate-500 font-semibold flex items-center gap-2 flex-wrap mt-0.5">
              <span>বর্তমানে: <strong className="text-indigo-700">{fromGrade === '6th' ? '৬ষ্ঠ' : fromGrade === '7th' ? '৭ম' : fromGrade === '8th' ? '৮ম' : fromGrade === '9th' ? '৯ম' : '১০ম'} শ্রেণি</strong> ➔ প্রমোশন টার্গেট: <strong className="text-emerald-700">{toGrade}</strong></span>
              <span className="text-slate-300">|</span>
              <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">মূল্যায়ন: {selectedExam}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleToggleSelectPassed}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="শুধুমাত্র যারা উত্তীর্ণ হয়েছে তাদের সিলেক্ট করুন"
            >
              <CheckCheck size={14} className="text-emerald-600" /> উত্তীর্ণদের সিলেক্ট করুন
            </button>

            <button
              onClick={() => handleToggleSelectAll(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <CheckSquare size={14} /> সকলকে সিলেক্ট করুন
            </button>

            <button
              onClick={() => handleToggleSelectAll(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Square size={14} /> আনসিলেক্ট করুন
            </button>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 space-y-2">
            <Users size={36} className="mx-auto text-slate-400" />
            <p className="font-bold text-xs">এই শ্রেণিতে কোনো শিক্ষার্থী নিবন্ধিত নেই।</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-black uppercase text-[10.5px] border-b border-slate-200">
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={students.length > 0 && students.every(s => s.selected)}
                        onChange={(e) => handleToggleSelectAll(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3 w-16 text-center">রোল</th>
                    <th className="p-3">শিক্ষার্থীর নাম</th>
                    <th className="p-3">আইডি</th>
                    <th className="p-3">বর্তমান শ্রেণি ও শাখা</th>
                    <th className="p-3 text-center">জিপিএ / স্ট্যাটাস</th>
                    <th className="p-3 text-center">প্রমোশন সিদ্ধান্ত</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {students.map((st) => (
                    <tr key={st.id} className={`hover:bg-slate-50 transition ${st.alreadyPromoted ? 'bg-amber-50/30 opacity-80' : st.selected ? 'bg-indigo-50/20' : ''}`}>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={st.selected}
                          disabled={st.alreadyPromoted}
                          onChange={() => !st.alreadyPromoted && handleToggleStudent(st.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </td>
                      <td className="p-3 text-center font-mono font-black text-slate-900">{st.roll}</td>
                      <td className="p-3 font-black text-slate-900">{st.name}</td>
                      <td className="p-3 font-mono font-bold text-indigo-700 text-[11px]">{st.id}</td>
                      <td className="p-3 text-slate-700 font-bold">
                        {st.grade} ({st.section})
                      </td>
                      <td className="p-3 text-center">
                        {st.status === 'Pass' ? (
                          <span className="px-2.5 py-1 font-mono font-black text-[11px] rounded-full border bg-emerald-50 text-emerald-800 border-emerald-300 inline-flex items-center gap-1 shadow-xs">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            GPA: {st.gpa} ({st.letterGrade ? `${st.letterGrade} - ` : ''}উত্তীর্ণ)
                          </span>
                        ) : st.status === 'Fail' ? (
                          <span className="px-2.5 py-1 font-mono font-black text-[11px] rounded-full border bg-rose-50 text-rose-800 border-rose-300 inline-flex items-center gap-1 shadow-xs">
                            <AlertCircle size={12} className="text-rose-600" />
                            GPA: {st.gpa} (অনুত্তীর্ণ {st.failedCount ? `- ${st.failedCount} বিষয়ে` : ''})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 font-mono font-bold text-[11px] rounded-full border bg-slate-100 text-slate-600 border-slate-300 inline-flex items-center gap-1">
                            ফলাফল এন্ট্রি নেই (N/A)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {st.alreadyPromoted ? (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-black text-[10.5px] rounded-xl inline-flex items-center gap-1 border border-amber-300">
                            <AlertCircle size={13} /> ইতোমধ্যে প্রমোশন হয়েছে
                          </span>
                        ) : st.selected ? (
                          <span className="px-2.5 py-1 bg-emerald-600 text-white font-black text-[10.5px] rounded-xl inline-flex items-center gap-1 shadow-sm">
                            <CheckCircle2 size={13} /> {toGrade} এ প্রমোশন হবে
                          </span>
                        ) : st.status === 'Fail' ? (
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-black text-[10.5px] rounded-xl inline-flex items-center gap-1 border border-rose-200">
                            <AlertCircle size={13} /> অনুত্তীর্ণ — একই ক্লাসে বহাল
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-200 text-slate-600 font-bold text-[10.5px] rounded-xl inline-flex items-center gap-1">
                            একই ক্লাসে থাকবে (Hold)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Execution Bar */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg border border-indigo-500/20">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-indigo-200">
                  নির্বাচন করা হয়েছে: <strong className="text-amber-300 font-black text-sm">{selectedCount} জন</strong> / মোট {students.length} জন
                </p>
                <p className="text-[11px] text-slate-300 font-medium">
                  প্রমোশন কনফার্ম করলে শিক্ষার্থীদের শ্রেণি আপডেট হয়ে <strong className="text-emerald-300">{toGrade}</strong> (সেশন {targetSession}) হয়ে যাবে।
                </p>
              </div>

              <button
                onClick={handleExecutePromotion}
                disabled={selectedCount === 0}
                className="px-6 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Award size={16} />
                <span>{selectedCount} জন শিক্ষার্থীকে এক ক্লিকে প্রমোশন দিন</span>
              </button>
            </div>
          </>
        )}

      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* STEP 3: PROMOTION HISTORY LOGS              */}
      {/* ═══════════════════════════════════════════ */}
      {promotionLogs.length > 0 && (
        <div id="logs" className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 scroll-mt-6">
          <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <History size={15} className="text-indigo-600" />
            পূর্ববর্তী প্রমোশন হিস্টোরি ও লগ (Promotion Logs)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs font-bold">
            {promotionLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 hover:border-indigo-300 transition">
                <div className="flex justify-between items-center text-slate-500 text-[10px] font-mono">
                  <span>📅 {log.timestamp}</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 font-bold rounded">সেশন: {log.session}</span>
                </div>
                <div className="text-slate-900 font-black pt-1">
                  {log.fromGrade} ➔ {log.toGrade}
                </div>
                <div className="text-emerald-700 text-[11px] font-black">
                  মোট প্রমোশন প্রাপ্ত: {log.count} জন
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
