'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  UserCheck, 
  UserX, 
  Printer, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Search, 
  Filter, 
  PhoneCall, 
  Building2, 
  Save, 
  Check, 
  X, 
  Smartphone,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { studentService, Student } from '@/services/studentService';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import { teacherRBACService, ClassTeacherAssignment } from '@/services/teacherRBACService';
import { auditTrailService } from '@/services/auditTrailService';
import { attendanceService, StudentAttendanceRecord } from '@/services/attendanceService';

type AttendanceTab = 'register' | 'absentee_panel' | 'reports';

export default function AttendancePage() {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [myClassTeacherAssignments, setMyClassTeacherAssignments] = useState<ClassTeacherAssignment[]>([]);

  const [activeTab, setActiveTab] = useState<AttendanceTab>('register');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedGrade, setSelectedGrade] = useState<string>('6th');
  const [selectedBranch, setSelectedBranch] = useState<string>('A');
  const [students, setStudents] = useState<StudentAttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Print Settings States (now inline inside tab)
  const [printScope, setPrintScope] = useState<'single' | 'all'>('single');
  const [printReportType, setPrintReportType] = useState<'all' | 'present' | 'absent'>('absent');
  
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<boolean>(false);

  // RBAC Session & Class Teacher Resolution
  useEffect(() => {
    const s = teacherAuthService.getSession();
    setSession(s || { role: 'admin' });
    if (s?.role === 'teacher') {
      const teacherId = s.teacherId || s.teacherName || '';
      const ctAssignments = teacherRBACService.getTeacherClassTeacherAssignments(teacherId);
      setMyClassTeacherAssignments(ctAssignments);
      if (ctAssignments.length > 0) {
        const firstCt = ctAssignments[0];
        // e.g. "8th-A" or "9th-Science"
        const parts = firstCt.classId.split('-');
        if (parts[0]) setSelectedGrade(parts[0]);
        if (parts[1]) setSelectedBranch(parts[1]);
      }
    }
  }, []);

  const classKey = `${selectedGrade}-${selectedBranch}`;
  const isClass9or10 = selectedGrade === '9th' || selectedGrade === '10th';

  const isTeacherRole = session?.role === 'teacher';
  const isCurrentClassTeacher = isTeacherRole
    ? myClassTeacherAssignments.some(ct => ct.classId === classKey || ct.classId === `${selectedGrade}-${selectedBranch}`)
    : true;

  useEffect(() => {
    if (isTeacherRole && printScope !== 'single') {
      setPrintScope('single');
    }
  }, [isTeacherRole, printScope]);

  useEffect(() => {
    if (selectedGrade === '9th' || selectedGrade === '10th') {
      if (selectedBranch === 'A' || !['Science', 'Humanities', 'Commerce'].includes(selectedBranch)) {
        setSelectedBranch('Science');
      }
    } else {
      if (['Science', 'Humanities', 'Commerce'].includes(selectedBranch)) {
        setSelectedBranch('A');
      }
    }
  }, [selectedGrade]);

  const branchNameBn = useMemo(() => {
    if (isClass9or10) {
      if (selectedBranch === 'Science' || selectedBranch === 'A' || selectedBranch === 'বিজ্ঞান') return 'বিজ্ঞান বিভাগ';
      if (selectedBranch === 'Humanities' || selectedBranch === 'B' || selectedBranch === 'মানবিক') return 'মানবিক বিভাগ';
      if (selectedBranch === 'Commerce' || selectedBranch === 'C' || selectedBranch === 'ব্যবসায়') return 'ব্যবসায় শিক্ষা বিভাগ';
      return selectedBranch;
    }
    if (selectedBranch === 'A') return 'A শাখা (ক)';
    if (selectedBranch === 'B') return 'B শাখা (খ)';
    if (selectedBranch === 'C') return 'C শাখা (গ)';
    return `${selectedBranch} শাখা`;
  }, [selectedBranch, isClass9or10]);

  // ─── DATA LOADING ───────────────────────────────────────────────────
  const loadAttendanceStudents = useCallback(() => {
    if (typeof window === 'undefined') return;
    const records = attendanceService.getAttendance(selectedDate, selectedGrade, selectedBranch);
    setStudents(records);
    setSaveSuccessMsg(false);
  }, [selectedGrade, selectedBranch, selectedDate]);

  useEffect(() => {
    setMounted(true);
    loadAttendanceStudents();
  }, [loadAttendanceStudents]);

  // Save current class attendance
  const saveAttendance = (updatedList: StudentAttendanceRecord[]) => {
    setStudents(updatedList);
    attendanceService.saveAttendance({
      date: selectedDate,
      grade: selectedGrade,
      branch: selectedBranch,
      records: updatedList,
      performedBy: session?.teacherName || (session?.role === 'admin' ? 'অ্যাডমিন' : 'শিক্ষক')
    });
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // Toggle status for a student
  const handleStatusChange = (id: string, newStatus: 'Present' | 'Absent' | 'Leave') => {
    const updated = students.map(st => st.id === id ? { ...st, status: newStatus, reason: newStatus === 'Present' ? '' : st.reason } : st);
    saveAttendance(updated);
  };

  // Update reason comment
  const handleReasonChange = (id: string, reasonText: string) => {
    const updated = students.map(st => st.id === id ? { ...st, reason: reasonText } : st);
    saveAttendance(updated);
  };

  // Mark all students present or absent
  const handleMarkAll = (status: 'Present' | 'Absent') => {
    const updated = students.map(st => ({ ...st, status, reason: '' }));
    saveAttendance(updated);
  };

  const formatBranchName = useCallback((grade: string, branch: string) => {
    const is9or10 = grade === '9th' || grade === '10th' || grade.includes('9') || grade.includes('10') || grade.includes('৯') || grade.includes('১০');
    if (is9or10) {
      if (branch === 'Science' || branch === 'A' || branch === 'বিজ্ঞান') return 'বিজ্ঞান বিভাগ';
      if (branch === 'Humanities' || branch === 'B' || branch === 'মানবিক') return 'মানবিক বিভাগ';
      if (branch === 'Commerce' || branch === 'C' || branch === 'ব্যবসায়') return 'ব্যবসায় শিক্ষা বিভাগ';
      return branch.includes('বিভাগ') ? branch : `${branch} বিভাগ`;
    } else {
      if (branch === 'A' || branch === 'Section A') return 'A শাখা (ক)';
      if (branch === 'B' || branch === 'Section B') return 'B শাখা (খ)';
      if (branch === 'C' || branch === 'Section C') return 'C শাখা (গ)';
      return branch.includes('শাখা') ? branch : `${branch} শাখা`;
    }
  }, []);

  // ─── CENTRAL ABSENTEE PANEL GATHERING ──────────────────────────────
  const centralAbsenteeList = useMemo(() => {
    return attendanceService.getAllAbsenteesForDate(selectedDate);
  }, [selectedDate, students]);

  // Main marked list search filter
  const filteredStudents = useMemo(() => {
    return students.filter(st => 
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      st.roll.includes(searchQuery) ||
      st.mobile.includes(searchQuery)
    );
  }, [students, searchQuery]);

  const presentCount = students.filter(s => s.status === 'Present').length;
  const absentCount = students.filter(s => s.status === 'Absent').length;
  const leaveCount = students.filter(s => s.status === 'Leave').length;
  const totalCount = students.length;

  const currentClassAbsentees = students.filter(s => s.status === 'Absent' || s.status === 'Leave');

  const gradeNameBn = selectedGrade === '6th' ? '৬ষ্ঠ শ্রেণি' : selectedGrade === '7th' ? '৭ম শ্রেণি' : selectedGrade === '8th' ? '৮ম শ্রেণি' : selectedGrade === '9th' ? '৯ম শ্রেণি' : '১০ম শ্রেণি';

  // Printable students logic helper inside inline preview
  const printableList = useMemo(() => {
    // 🛡️ Teachers are strictly restricted to their assigned class report only
    if (isTeacherRole || printScope === 'single') {
      if (printReportType === 'absent') {
        return students.filter(s => s.status === 'Absent' || s.status === 'Leave');
      } else if (printReportType === 'present') {
        return students.filter(s => s.status === 'Present');
      } else {
        return students;
      }
    }

    // 1. All Classes Report (Admin Only)
    if (printScope === 'all') {
      if (printReportType === 'absent') {
        return centralAbsenteeList.filter(s => s.status === 'Absent' || s.status === 'Leave');
      } else if (printReportType === 'present') {
        const list: StudentAttendanceRecord[] = [];
        const allStudents = studentService.getAllStudents();
        allStudents.forEach((s) => {
          const isAbsent = centralAbsenteeList.some(abs => abs.id === s.id);
          if (!isAbsent) {
            list.push({
              id: s.id,
              roll: s.roll,
              name: s.name,
              grade: s.grade,
              branch: s.group || s.section || 'A',
              guardian: s.guardian || s.fatherName || 'অভিভাবক',
              mobile: s.mobile || '01800000000',
              status: 'Present'
            });
          }
        });
        return list;
      } else {
        return studentService.getAllStudents().map(s => ({
          id: s.id,
          roll: s.roll,
          name: s.name,
          grade: s.grade,
          branch: s.group || s.section || 'A',
          guardian: s.guardian || s.fatherName || 'অভিভাবক',
          mobile: s.mobile || '01800000000',
          status: centralAbsenteeList.find(abs => abs.id === s.id)?.status || 'Present',
          reason: centralAbsenteeList.find(abs => abs.id === s.id)?.reason
        }));
      }
    }

    return students;
  }, [isTeacherRole, printScope, printReportType, students, centralAbsenteeList]);

  if (!mounted) return null;

  return (
    <div className="w-full space-y-5 pb-16 font-sans text-slate-900" suppressHydrationWarning>
      
      {/* TOP ACTIONS & STATS ROW (Clean & Compact) */}
      <div className="space-y-4 print:hidden">
        <div className="flex justify-end">
          <button
            onClick={() => setActiveTab('reports')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer size={15} />
            হাজিরা স্লিপ ও রিপোর্ট প্রিন্ট
          </button>
        </div>

        {/* Dynamic Mini counters in clean white cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
            <span className="text-xl font-black text-slate-900 font-mono leading-none block">{totalCount} জন</span>
            <p className="text-[10px] font-bold text-slate-500 mt-1">শ্রেণির মোট শিক্ষার্থী</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 shadow-xs text-center">
            <span className="text-xl font-black text-emerald-700 font-mono leading-none block">{presentCount} জন</span>
            <p className="text-[10px] font-bold text-emerald-600 mt-1">আজকের উপস্থিত (Present)</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-rose-200 shadow-xs text-center">
            <span className="text-xl font-black text-rose-700 font-mono leading-none block">{absentCount + leaveCount} জন</span>
            <p className="text-[10px] font-bold text-rose-600 mt-1">অনুপস্থিত ও ছুটি</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-indigo-200 shadow-xs text-center">
            <span className="text-xl font-black text-indigo-700 font-mono leading-none block">{centralAbsenteeList.length} জন</span>
            <p className="text-[10px] font-bold text-indigo-600 mt-1">সর্বমোট অনুপস্থিত</p>
          </div>
        </div>
      </div>

      {/* ─── TAB NAVIGATION ─────────────────────────────────────── */}
      <div className="bg-slate-200/60 rounded-2xl border border-slate-200 p-1.5 shadow-sm print:hidden flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('register')}
            className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 text-xs font-bold ${
              activeTab === 'register' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck size={15} />
            <span>১. হাজিরা গ্রহণ করুন (Mark Attendance)</span>
          </button>
          
          <button
            onClick={() => setActiveTab('absentee_panel')}
            className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 text-xs font-bold ${
              activeTab === 'absentee_panel' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserX size={15} />
            <span>২. অনুপস্থিত কেন্দ্রীয় প্যানেল (Absentee Board)</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 text-xs font-bold ${
              activeTab === 'reports' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer size={15} />
            <span>৩. হাজিরা রিপোর্ট ও প্রিন্ট (Attendance Report)</span>
          </button>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 text-xs font-bold print:hidden">
          <div className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
            <CalendarIcon size={13} className="text-slate-400" />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-none outline-none font-mono" />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 1: হাজিরা গ্রহণ রেজিস্টার                             */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'register' && (
        <div className="space-y-4">

          {/* 🛡️ CLASS TEACHER STATUS BANNER FOR LOGGED-IN TEACHERS */}
          {isTeacherRole && (
            <div className={`p-4 rounded-3xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs print:hidden ${
              isCurrentClassTeacher
                ? 'bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200 text-teal-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                  isCurrentClassTeacher ? 'bg-teal-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  <UserCheck size={18} />
                </div>
                <div>
                  <strong className="text-xs font-black block">
                    {isCurrentClassTeacher
                      ? `👑 আপনি ${gradeNameBn} (${branchNameBn})-এর দায়িত্বপ্রাপ্ত শ্রেণি শিক্ষক (Class Teacher)`
                      : myClassTeacherAssignments.length > 0
                      ? `ℹ️ আপনি ${myClassTeacherAssignments[0].classId}-এর শ্রেণি শিক্ষক হিসেবে দায়িত্বপ্রাপ্ত।`
                      : `ℹ️ আপনি কোনো শ্রেণির শ্রেণি শিক্ষক হিসেবে নিযুক্ত নন।`}
                  </strong>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {isCurrentClassTeacher
                      ? 'শিক্ষার্থীদের উপস্থিতি/অনুপস্থিতি নির্ধারণ করে লাইভ অটো-সেভ করুন।'
                      : 'শ্রেণি শিক্ষকগণ তাদের নির্ধারিত শ্রেণির শিক্ষার্থীদের উপস্থিতি গ্রহণের দায়িত্বে থাকেন।'}
                  </p>
                </div>
              </div>

              {myClassTeacherAssignments.length > 0 && !isCurrentClassTeacher && (
                <button
                  type="button"
                  onClick={() => {
                    const firstCt = myClassTeacherAssignments[0];
                    const parts = firstCt.classId.split('-');
                    if (parts[0]) setSelectedGrade(parts[0]);
                    if (parts[1]) setSelectedBranch(parts[1]);
                  }}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-[11px] rounded-xl shadow-xs transition shrink-0 cursor-pointer"
                >
                  আপনার নির্ধারিত শ্রেণিতে যান →
                </button>
              )}
            </div>
          )}
          
          {/* Selection controls */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold print:hidden">
            <div>
              <label className="block text-slate-500 mb-1">শ্রেণি নির্বাচন (Grade)</label>
              <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer">
                <option value="6th">৬ষ্ঠ শ্রেণি (Class 6)</option>
                <option value="7th">৭ম শ্রেণি (Class 7)</option>
                <option value="8th">৮ম শ্রেণি (Class 8)</option>
                <option value="9th">৯ম শ্রেণি (Class 9)</option>
                <option value="10th">১০ম শ্রেণি (Class 10)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-slate-500 mb-1">
                {isClass9or10 ? 'বিভাগ / সেকশন (Department / Group)' : 'শাখা / সেকশন (Section)'}
              </label>
              <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer font-extrabold text-slate-900">
                {isClass9or10 ? (
                  <>
                    <option value="Science">🧪 বিজ্ঞান বিভাগ (Science Group)</option>
                    <option value="Humanities">📚 মানবিক বিভাগ (Humanities Group)</option>
                    <option value="Commerce">💼 ব্যবসায় শিক্ষা বিভাগ (Commerce Group)</option>
                  </>
                ) : (
                  <>
                    <option value="A">Section A (ক শাখা)</option>
                    <option value="B">Section B (খ শাখা)</option>
                    <option value="C">Section C (গ শাখা)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Main mark attendance sheet */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {gradeNameBn} ({branchNameBn}) - হাজিরা শীট
                </h3>
                <p className="text-xs text-slate-400">তারিখ: {selectedDate}</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button type="button" onClick={() => handleMarkAll('Present')} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold text-[11px] transition">
                  ✓ সকলকে উপস্থিত দেখান
                </button>
                <button type="button" onClick={() => handleMarkAll('Absent')} className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-bold text-[11px] transition">
                  ✗ সকলকে অনুপস্থিত দেখান
                </button>
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                উপস্থিতি রেকর্ড সফলভাবে সংরক্ষণ করা হয়েছে!
              </div>
            )}

            {/* Students checklist */}
            <div className="space-y-2">
              {filteredStudents.length === 0 ? (
                <p className="p-8 text-center text-slate-400 font-bold text-xs">কোনো শিক্ষার্থী পাওয়া যায়নি।</p>
              ) : (
                filteredStudents.map((st) => (
                  <div key={st.id} className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    st.status === 'Present' ? 'border-emerald-200 bg-emerald-50/10' :
                    st.status === 'Absent' ? 'border-rose-200 bg-rose-50/10' : 'border-amber-200 bg-amber-50/10'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-mono font-black text-xs flex items-center justify-center">
                        {st.roll}
                      </div>
                      <div>
                        <strong className="font-extrabold text-slate-900 block">{st.name}</strong>
                        <span className="text-[10px] text-slate-500 font-semibold">পিতা/অভিভাবক: {st.guardian} | {st.mobile}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button type="button" onClick={() => handleStatusChange(st.id, 'Present')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                          st.status === 'Present' ? 'bg-emerald-600 text-white shadow-sm font-black' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}>
                        উপস্থিত
                      </button>
                      <button type="button" onClick={() => handleStatusChange(st.id, 'Absent')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                          st.status === 'Absent' ? 'bg-rose-600 text-white shadow-sm font-black' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}>
                        অনুপস্থিত
                      </button>
                      <button type="button" onClick={() => handleStatusChange(st.id, 'Leave')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                          st.status === 'Leave' ? 'bg-amber-500 text-slate-950 shadow-sm font-black' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}>
                        ছুটি
                      </button>
                    </div>

                    {(st.status === 'Absent' || st.status === 'Leave') && (
                      <div className="w-full sm:w-auto flex items-center gap-1 border-t sm:border-t-0 pt-2 sm:pt-0">
                        <span className="text-[9px] text-slate-500 font-bold uppercase shrink-0">কারণ:</span>
                        <input type="text" value={st.reason || ''} onChange={(e) => handleReasonChange(st.id, e.target.value)}
                          placeholder="অনুপস্থিতির কারণ..." className="w-full sm:w-36 p-1 bg-white border border-slate-200 rounded text-[10px]" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 2: অনুপস্থিত কেন্দ্রীয় প্যানেল                          */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'absentee_panel' && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <UserX size={16} className="text-rose-600" />
                অনুপস্থিত ও ছুটিপ্রাপ্ত শিক্ষার্থীদের কেন্দ্রীয় প্যানেল
              </h3>
              <p className="text-xs text-slate-500">বিদ্যালয়ের সকল ক্লাসের আজকের ({selectedDate}) অনুপস্থিতির তালিকা।</p>
            </div>
            
            <button
              onClick={() => {
                setPrintScope(isTeacherRole ? 'single' : 'all');
                setPrintReportType('absent');
                setActiveTab('reports');
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
            >
              <Printer size={13} /> {isTeacherRole ? `${gradeNameBn} অনুপস্থিত তালিকা প্রিন্ট` : 'সম্পূর্ণ অনুপস্থিত তালিকা প্রিন্ট সেটিংস'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-extrabold border-b border-slate-200 uppercase text-[9.5px]">
                  <th className="p-2.5">শ্রেণি ও শাখা</th>
                  <th className="p-2.5">রোল</th>
                  <th className="p-2.5">শিক্ষার্থীর নাম</th>
                  <th className="p-2.5">অভিভাবক ও মোবাইল</th>
                  <th className="p-2.5 text-center">স্ট্যাটাস</th>
                  <th className="p-2.5">কারণ / মন্তব্য</th>
                  <th className="p-2.5 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {centralAbsenteeList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">আজকে কোনো শিক্ষার্থী অনুপস্থিত নেই!</td>
                  </tr>
                ) : (
                  centralAbsenteeList.map((st) => {
                    const gradeName = st.grade === '6th' ? '৬ষ্ঠ শ্রেণি' : st.grade === '7th' ? '৭ম শ্রেণি' : st.grade === '8th' ? '৮ম শ্রেণি' : st.grade === '9th' ? '৯ম শ্রেণি' : '১০ম শ্রেণি';
                    return (
                      <tr key={st.id} className="hover:bg-slate-50 transition text-[11px]">
                        <td className="p-2.5 font-bold text-slate-900">{gradeName} ({formatBranchName(st.grade, st.branch)})</td>
                        <td className="p-2.5 font-mono font-bold text-indigo-700">#{st.roll}</td>
                        <td className="p-2.5 font-black text-slate-900">{st.name}</td>
                        <td className="p-2.5">
                          <span className="font-semibold block">{st.guardian}</span>
                          <span className="font-mono text-[9px] text-slate-400">{st.mobile}</span>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            st.status === 'Absent' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {st.status === 'Absent' ? 'অনুপস্থিত' : 'ছুটি'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 italic">{st.reason || 'উল্লেখ নেই'}</td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => alert(`${st.guardian} (${st.mobile}) নম্বরে অনুপস্থিত নোটিশ পাঠানো হয়েছে!`)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-lg transition cursor-pointer"
                          >
                            SMS পাঠান
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 3: হাজিরা রিপোর্ট ও প্রিন্ট (INLINE INTEGRATED PAGE)    */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Report configuration card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs font-bold print:hidden">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
              <Filter size={15} className="text-indigo-600" />
              রিপোর্ট প্রিন্ট সেটিংস
            </h3>

            {/* Scope selection */}
            <div className="space-y-1.5">
              <label className="block text-slate-500">রিপোর্ট পরিসর (Scope)</label>
              {!isTeacherRole ? (
                <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1 rounded-xl">
                  <button type="button" onClick={() => setPrintScope('single')}
                    className={`py-1.5 rounded-lg text-center transition cursor-pointer ${
                      printScope === 'single' ? 'bg-slate-900 text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}>
                    শুধু {gradeNameBn}
                  </button>
                  <button type="button" onClick={() => setPrintScope('all')}
                    className={`py-1.5 rounded-lg text-center transition cursor-pointer ${
                      printScope === 'all' ? 'bg-slate-900 text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}>
                    সকল শ্রেণির হাজিরা
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="font-black text-indigo-950 dark:text-indigo-200 text-xs block">
                      শুধু {gradeNameBn} ({branchNameBn})
                    </span>
                    <span className="text-[10.5px] text-indigo-600 dark:text-indigo-400 font-medium">
                      🔒 শ্রেণি শিক্ষক: শুধুমাত্র আপনার বরাদ্দকৃত শ্রেণির হাজিরা রিপোর্ট অনুমোদিত
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg shrink-0">
                    শ্রেণি শিক্ষক
                  </span>
                </div>
              )}
            </div>

            {/* Report type selector */}
            <div className="space-y-1.5">
              <label className="block text-slate-500">তালিকার ধরণ (List Type)</label>
              <select value={printReportType} onChange={(e) => setPrintReportType(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer">
                <option value="absent">অনুপস্থিত ও ছুটিপ্রাপ্ত তালিকা (Absent List)</option>
                <option value="present">উপস্থিত তালিকা (Present List)</option>
                <option value="all">সম্পূর্ণ হাজিরা বিবরণী শীট (Complete Sheet)</option>
              </select>
            </div>

            {/* Print trigger button */}
            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-97"
            >
              <Printer size={15} /> হাজিরা রিপোর্ট প্রিন্ট করুন (Print Now)
            </button>
          </div>

          {/* Inline Report Preview sheet */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* White paper card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md text-slate-950 font-serif space-y-5 print:p-0 print:border-none print:shadow-none">
              
              {/* Document Header */}
              <div className="text-center border-b-2 border-slate-950 pb-3 space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="w-7 h-7 text-slate-900" />
                  <h2 className="text-2xl font-black tracking-tight text-slate-950 font-sans">
                    বরইতলী উচ্চ বিদ্যালয়
                  </h2>
                </div>
                <p className="text-[10px] font-bold text-slate-600 font-sans">চকরিয়া, কক্সবাজার | EIIN: ১০৮২৩৪ | স্থাপিত: ১৯৬৫</p>
                
                <div className="pt-2">
                  <span className="inline-block px-4 py-1 bg-slate-950 text-white font-black text-[9px] rounded uppercase tracking-wider font-sans">
                    {printReportType === 'absent' ? 'অনুপস্থিত শিক্ষার্থীদের তথ্য রিপোর্ট (ABSENT LIST)' : 
                     printReportType === 'present' ? 'উপস্থিত শিক্ষার্থীদের তালিকা রিপোর্ট (PRESENT LIST)' : 
                     'দৈনিক সম্পূর্ণ হাজিরা শীট খতিয়ান (COMPLETE ATTENDANCE SHEET)'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 pt-3 px-1 font-sans">
                  <span>শ্রেণি পরিসর: {(!isTeacherRole && printScope === 'all') ? 'সকল শ্রেণি (৬ষ্ঠ - ১০ম)' : `${gradeNameBn} (${branchNameBn})`}</span>
                  <span>তারিখ: {selectedDate}</span>
                  <span>মোট ডাটা সংখ্যা: {printableList.length} জন</span>
                </div>
              </div>

              {/* Document Table */}
              <div className="overflow-hidden border border-slate-950 rounded-lg">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-50 text-slate-950 font-black border-b border-slate-950 text-[10px] uppercase">
                      <th className="p-2 border-r border-slate-950 w-28">শ্রেণি ও বিভাগ</th>
                      <th className="p-2 text-center border-r border-slate-950 w-12">রোল</th>
                      <th className="p-2 border-r border-slate-950">শিক্ষার্থীর নাম</th>
                      <th className="p-2 border-r border-slate-950">পিতা (অভিভাবক)</th>
                      <th className="p-2 border-r border-slate-950 w-24">মোবাইল</th>
                      <th className="p-2 border-r border-slate-950 text-center w-16">স্ট্যাটাস</th>
                      {printReportType === 'all' && <th className="p-2">মন্তব্য / কারণ</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-950 text-slate-950 font-medium">
                    {printableList.length === 0 ? (
                      <tr>
                        <td colSpan={printReportType === 'all' ? 7 : 6} className="p-4 text-center text-slate-500 font-bold italic">
                          কোনো শিক্ষার্থীর ডাটা রেকর্ড পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      printableList.map((st) => {
                        const gradeName = st.grade === '6th' ? '৬ষ্ঠ' : st.grade === '7th' ? '৭ম' : st.grade === '8th' ? '৮ম' : st.grade === '9th' ? '৯ম' : '১০ম';
                        const branchName = formatBranchName(st.grade, st.branch);
                        return (
                          <tr key={st.id} className="border-b border-slate-950">
                            <td className="p-2 font-bold border-r border-slate-950 text-[11px]">
                              {gradeName} শ্রেণি ({branchName})
                            </td>
                            <td className="p-2 text-center font-black font-mono border-r border-slate-950 text-[11px]">
                              {st.roll}
                            </td>
                            <td className="p-2 font-bold border-r border-slate-950">
                              {st.name}
                            </td>
                            <td className="p-2 border-r border-slate-950">{st.guardian}</td>
                            <td className="p-2 font-mono font-bold border-r border-slate-950 text-[11px]">{st.mobile}</td>
                            <td className="p-2 text-center border-r border-slate-950 font-bold text-[10px]">
                              <span className={st.status === 'Present' ? 'text-emerald-700' : st.status === 'Absent' ? 'text-rose-700' : 'text-amber-600'}>
                                {st.status === 'Present' ? 'উপস্থিত' : st.status === 'Absent' ? 'অনুপস্থিত' : 'ছুটি'}
                              </span>
                            </td>
                            {printReportType === 'all' && (
                              <td className="p-2 italic text-slate-600 text-[10px]">
                                {st.reason || '-'}
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-8 flex justify-between items-end text-center text-xs font-bold text-slate-950 font-sans">
                <div className="space-y-1">
                  <div className="w-36 border-b border-slate-950 mx-auto"></div>
                  <p>শ্রেণি শিক্ষক / প্রস্তুতকারক</p>
                </div>
                <div className="space-y-1">
                  <div className="w-36 border-b border-slate-950 mx-auto"></div>
                  <p className="font-black">প্রধান শিক্ষক</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
