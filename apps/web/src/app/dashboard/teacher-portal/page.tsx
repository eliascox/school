'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Home, BookOpen, UserCheck, User, LogOut, Bell,
  ChevronRight, CheckCircle2, AlertCircle, Clock,
  BookMarked, GraduationCap, ClipboardList, Star,
  BarChart2, Shield, ArrowRight, Pencil, Phone,
  RefreshCw, TrendingUp, Award, Calendar, Users,
  DollarSign, FileText, Send, Eye, X, Check,
  Lock, ChevronDown, Sparkles, MapPin, Heart,
  AlertTriangle, Filter, Search, Edit3, School,
  Smartphone, Monitor, Laptop, CheckSquare, ChevronLeft,
  Camera, Trash2
} from 'lucide-react';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import { teacherRBACService, TeacherRecord, SubjectAssignment, ClassTeacherAssignment } from '@/services/teacherRBACService';
import { studentService, Student } from '@/services/studentService';
import { compressImage } from '@/lib/imageUtils';
import { financeService, StudentFeeLedger } from '@/services/financeService';
import { noticeService, Notice } from '@/services/noticeService';
import { leaveService, LeaveApplication, LeaveType, LEAVE_TYPE_LABELS } from '@/services/leaveService';
import { routineService, RoutineSlot, ROUTINE_DAYS, ROUTINE_PERIODS } from '@/services/routineService';
import { auditTrailService } from '@/services/auditTrailService';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const gradeLabel = (g: string) => {
  const m: Record<string, string> = {
    '6th': '৬ষ্ঠ শ্রেণি', '7th': '৭ম শ্রেণি', '8th': '৮ম শ্রেণি',
    '9th': '৯ম শ্রেণি', '10th': '১০ম শ্রেণি'
  };
  return m[g] || g;
};

const branchLabel = (b: string) => {
  const m: Record<string, string> = {
    'A': 'ক শাখা', 'B': 'খ শাখা', 'C': 'গ শাখা',
    'Science': 'বিজ্ঞান', 'Humanities': 'মানবিক', 'Commerce': 'ব্যবসায়'
  };
  return m[b] || b;
};

const toBnDigit = (num: number | string) => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bn[parseInt(d, 10)]);
};

type NavTab = 'home' | 'marks' | 'attendance' | 'students' | 'routine' | 'leaves' | 'notices' | 'profile';

export default function TeacherPortalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam && ['home', 'marks', 'attendance', 'students', 'routine', 'leaves', 'notices', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam as NavTab);
    }
  }, [searchParams]);
  const [session, setSession] = useState<UserSession | null>(null);
  const [teacher, setTeacher] = useState<TeacherRecord | null>(null);
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [classTeachers, setClassTeachers] = useState<ClassTeacherAssignment[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [routines, setRoutines] = useState<RoutineSlot[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // Today's Attendance stats for Class Teacher (ছাত্র, ছাত্রী, মোট, অনুপস্থিত, এনরোল্ড)
  const [todayAttendance, setTodayAttendance] = useState<{
    hasRollCall: boolean;
    boys: number;
    girls: number;
    total: number;
    totalEnrolled: number;
    absent: number;
    rate: number;
  } | null>(null);

  // Class Teacher: Students & Fees
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentLedgers, setStudentLedgers] = useState<Record<string, StudentFeeLedger>>({});
  
  // Student Edit Modal (Class Teacher only)
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    guardian: '',
    fatherName: '',
    motherName: '',
    mobile: '',
    dob: '',
    gender: '',
    religion: '',
    bloodGroup: '',
    currentAddress: '',
    permanentAddress: '',
    photo: '',
    remarks: ''
  });

  // Leave Application Form
  const [leaveType, setLeaveType] = useState<LeaveType>('casual');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  // Routine View
  const [selectedRoutineDay, setSelectedRoutineDay] = useState<RoutineSlot['day']>('Saturday');
  const [routineViewMode, setRoutineViewMode] = useState<'my' | 'full'>('my');

  // UI Alerts
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const showAlert = useCallback((type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  }, []);

  // ─── Data Loader ───────────────────────────────────────────────────────────
  const loadAllPortalData = useCallback(() => {
    const s = teacherAuthService.getSession();
    if (!s || s.role !== 'teacher') {
      router.push('/login');
      return;
    }
    setSession(s);

    const teachers = teacherRBACService.getTeachers();
    const me = teachers.find(t =>
      t.id === s.teacherId || t.name === s.teacherName || t.phone === s.teacherId
    );
    setTeacher(me || null);

    const myId = me?.id || s.teacherId || s.teacherName || '';

    // Assignments
    const allAssignments = teacherRBACService.getSubjectAssignments();
    const myAssignments = allAssignments.filter(a =>
      a.teacherId === myId || a.teacherId === s.teacherId || a.teacherId === s.teacherName
    );
    setAssignments(myAssignments);

    // Class Teachers
    const allCT = teacherRBACService.getClassTeachers();
    const myCT = allCT.filter(ct =>
      ct.teacherId === myId || ct.teacherId === s.teacherId || ct.teacherId === s.teacherName
    );
    setClassTeachers(myCT);

    // Load Class Students & Fee Ledgers if Class Teacher
    let resolvedClassStudents: Student[] = [];
    if (myCT.length > 0) {
      const allStudents = studentService.getAllStudents();
      resolvedClassStudents = allStudents.filter(st => {
        return myCT.some(ct => {
          const parts = ct.classId.split('-');
          const ctGrade = (parts[0] || '').toLowerCase();
          const ctBranch = (parts[1] || '').toLowerCase();
          const stGrade = (st.grade || '').toLowerCase();
          const stSection = (st.section || st.branch || '').toLowerCase();
          const stGroup = (st.group || '').toLowerCase();

          const gradeMatch = stGrade.includes(ctGrade) || ctGrade.includes(stGrade);
          const branchMatch = !ctBranch || stSection.includes(ctBranch) || stGroup.includes(ctBranch);
          return gradeMatch && branchMatch;
        });
      });
      setClassStudents(resolvedClassStudents);

      // Load fee ledgers
      const ledgers: Record<string, StudentFeeLedger> = {};
      resolvedClassStudents.forEach(st => {
        ledgers[st.id] = financeService.getStudentFeeLedger(st.id, st.grade, st.isStipend);
      });
      setStudentLedgers(ledgers);
    } else {
      setClassStudents([]);
      setStudentLedgers({});
    }

    // Notices
    setNotices(noticeService.getNotices());

    // Leaves
    setLeaves(leaveService.getTeacherLeaves(myId));

    // Routines
    setRoutines(routineService.getRoutines());

    // Audit logs for this teacher
    if (typeof window !== 'undefined') {
      try {
        const rawLogs = localStorage.getItem('sms_audit_logs');
        if (rawLogs) {
          const parsed = JSON.parse(rawLogs);
          const myLogs = parsed.filter((l: any) => 
            l.performedBy === myId || 
            l.performedBy === s.teacherName || 
            (me && l.performedBy === me.name)
          );
          setAuditLogs(myLogs.slice(-10).reverse());
        }
      } catch (e) {}

      const ls = localStorage.getItem('sms_last_mark_save');
      if (ls) setLastSaved(ls);

      // ─── Calculate Today's Attendance for Card 1 (ছাত্র, ছাত্রী, মোট) ───
      try {
        const today = new Date().toISOString().split('T')[0];
        const allStudents = studentService.getAllStudents();

        // 1. First priority: Check assigned class teacher class(es)
        let foundRecords: any[] | null = null;
        if (myCT.length > 0) {
          for (const ct of myCT) {
            const key = `sms_attendance_${today}_${ct.classId}`;
            const stored = localStorage.getItem(key);
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  foundRecords = parsed;
                  break;
                }
              } catch (e) {}
            }
          }
        }

        // 2. Second priority: Check assigned subjects classes
        if (!foundRecords && myAssignments.length > 0) {
          for (const a of myAssignments) {
            const prefix = `sms_attendance_${today}_${a.classId}`;
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k && k.startsWith(prefix)) {
                const stored = localStorage.getItem(k);
                if (stored) {
                  try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      foundRecords = parsed;
                      break;
                    }
                  } catch (e) {}
                }
              }
            }
            if (foundRecords) break;
          }
        }

        // 3. Fallback: check any class attendance taken today in school
        if (!foundRecords) {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(`sms_attendance_${today}_`)) {
              const stored = localStorage.getItem(k);
              if (stored) {
                try {
                  const parsed = JSON.parse(stored);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    foundRecords = parsed;
                    break;
                  }
                } catch (e) {}
              }
            }
          }
        }

        if (foundRecords && foundRecords.length > 0) {
          let boys = 0;
          let girls = 0;
          let present = 0;
          let absent = 0;

          foundRecords.forEach((rec: any) => {
            if (rec.status === 'Present') {
              present++;
              const matched = allStudents.find(
                s => s.id === rec.id || (s.roll === rec.roll && (s.grade === rec.grade || !s.grade))
              );
              const g = (matched?.gender || rec.gender || '').toLowerCase();
              const isGirl =
                g.includes('নারী') ||
                g.includes('মহিলা') ||
                g.includes('মেয়ে') ||
                g.includes('ছাত্রী') ||
                g === 'female' ||
                g === 'girl';

              if (isGirl) {
                girls++;
              } else {
                boys++;
              }
            } else if (rec.status === 'Absent' || rec.status === 'Leave') {
              absent++;
            }
          });

          const totalEnrolled = Math.max(foundRecords.length, resolvedClassStudents.length > 0 ? resolvedClassStudents.length : foundRecords.length);
          const effectiveAbsent = absent > 0 ? absent : Math.max(0, totalEnrolled - present);
          const rate = totalEnrolled > 0 ? Math.round((present / totalEnrolled) * 100) : 0;

          setTodayAttendance({
            hasRollCall: true,
            boys,
            girls,
            total: present,
            totalEnrolled,
            absent: effectiveAbsent,
            rate
          });
        } else {
          // রোল কল এখনও হয়নি - তবে মোট শিক্ষার্থীর সংখ্যা সেট রাখা হচ্ছে
          const assignedGradeKeys = Array.from(new Set(myAssignments.map(a => a.classId)));
          const assignedStudents = allStudents.filter(st => {
            const stGrade = (st.grade || '').toLowerCase();
            return assignedGradeKeys.some(cid => {
              const g = cid.split('-')[0].toLowerCase();
              return stGrade.includes(g) || g.includes(stGrade);
            });
          });
          const totalEnrolled = resolvedClassStudents.length > 0 
            ? resolvedClassStudents.length 
            : (assignedStudents.length > 0 ? assignedStudents.length : allStudents.length);

          setTodayAttendance({
            hasRollCall: false,
            boys: 0,
            girls: 0,
            total: 0,
            totalEnrolled,
            absent: 0,
            rate: 0
          });
        }
      } catch (err) {
        console.error('Attendance calculation error:', err);
        setTodayAttendance(null);
      }
    }
  }, [router]);

  useEffect(() => {
    setMounted(true);
    loadAllPortalData();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', loadAllPortalData);
      return () => window.removeEventListener('storage', loadAllPortalData);
    }
  }, [loadAllPortalData]);

  const handleLogout = useCallback(() => {
    teacherAuthService.setSession({ role: 'admin' });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sms_current_session');
    }
    router.push('/login');
  }, [router]);

  // Group assignments by grade
  const assignmentsByGrade = useMemo(() => {
    const map: Record<string, SubjectAssignment[]> = {};
    assignments.forEach(a => {
      if (!map[a.classId]) map[a.classId] = [];
      map[a.classId].push(a);
    });
    return map;
  }, [assignments]);

  const sortedGradeKeys = useMemo(() => {
    const gradeOrder = ['6th', '7th', '8th', '9th', '10th'];
    const keys = Object.keys(assignmentsByGrade);
    return keys.sort((a, b) => {
      const idxA = gradeOrder.indexOf(a);
      const idxB = gradeOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [assignmentsByGrade]);

  // Filtered Class Students
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return classStudents;
    const q = studentSearch.toLowerCase().trim();
    return classStudents.filter(st =>
      st.name.toLowerCase().includes(q) ||
      st.roll.includes(q) ||
      (st.mobile && st.mobile.includes(q))
    );
  }, [classStudents, studentSearch]);

  // Filtered Routine Slots
  const currentDayRoutines = useMemo(() => {
    const teacherId = teacher?.id || session?.teacherId || '';
    const dayRoutines = routines.filter(r => r.day === selectedRoutineDay);
    if (routineViewMode === 'my') {
      return dayRoutines.filter(r => 
        (r.teacherId && r.teacherId === teacherId) ||
        (r.teacherName && (r.teacherName === teacher?.name || r.teacherName === session?.teacherName))
      );
    }
    return dayRoutines;
  }, [routines, selectedRoutineDay, routineViewMode, teacher, session]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenEditStudent = (st: Student) => {
    setEditStudent(st);
    setEditForm({
      name: st.name || '',
      guardian: st.guardian || '',
      fatherName: st.fatherName || '',
      motherName: st.motherName || '',
      mobile: st.mobile || '',
      dob: st.dob || '',
      gender: st.gender || 'Male',
      religion: st.religion || 'ইসলাম',
      bloodGroup: st.bloodGroup || '',
      currentAddress: st.currentAddress || '',
      permanentAddress: st.permanentAddress || '',
      photo: st.photo || '',
      remarks: st.remarks || ''
    });
  };

  const handleSaveStudentBasicInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    if (!editForm.name.trim()) {
      return showAlert('error', 'শিক্ষার্থীর নাম অবশ্যই দিতে হবে!');
    }

    const res = studentService.updateStudentBasicInfo(
      editStudent.id,
      editForm,
      teacher?.name || session?.teacherName || 'শ্রেণি শিক্ষক'
    );

    if (res.success) {
      showAlert('success', res.message);
      setEditStudent(null);
      loadAllPortalData();
    } else {
      showAlert('error', res.message);
    }
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd) {
      return showAlert('error', 'ছুটির শুরুর ও শেষের তারিখ নির্বাচন করুন!');
    }
    if (!leaveReason.trim() || leaveReason.trim().length < 5) {
      return showAlert('error', 'ছুটির কারণ কমপক্ষে ৫ অক্ষরে বিস্তারিত লিখুন!');
    }

    const sDate = new Date(leaveStart);
    const eDate = new Date(leaveEnd);
    const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    setLeaveSubmitting(true);
    const res = leaveService.submitLeave({
      teacherId: teacher?.id || session?.teacherId || 'TCH-101',
      teacherName: teacher?.name || session?.teacherName || 'সহকারী শিক্ষক',
      designation: teacher?.designation || 'সহকারী শিক্ষক',
      leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      totalDays,
      reason: leaveReason.trim()
    });
    setLeaveSubmitting(false);

    if (res.success) {
      showAlert('success', res.message);
      setLeaveReason('');
      setLeaveStart('');
      setLeaveEnd('');
      loadAllPortalData();
    } else {
      showAlert('error', res.message);
    }
  };

  const handleCancelLeave = (leaveId: string) => {
    if (confirm('আপনি কি নিশ্চিতভাবে এই ছুটির আবেদনটি প্রত্যাহার করতে চান?')) {
      const myId = teacher?.id || session?.teacherId || '';
      const res = leaveService.cancelLeave(leaveId, myId);
      if (res.success) {
        showAlert('success', res.message);
        loadAllPortalData();
      } else {
        showAlert('error', res.message);
      }
    }
  };

  if (!mounted) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="text-slate-700 dark:text-slate-300 font-bold animate-pulse">লোড হচ্ছে...</div>
    </div>
  );

  if (!session || session.role !== 'teacher') return null;

  const teacherName = teacher?.name || session.teacherName || 'শিক্ষক';
  const teacherId = teacher?.id || session.teacherId || '';
  const designation = teacher?.designation || 'সহকারী শিক্ষক';
  const isClassTeacher = classTeachers.length > 0;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-24 md:pb-12 text-slate-900 dark:text-slate-100">

      {/* ─── FLOATING ALERT ─────────────────────────────────────────── */}
      {alertMsg && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-bold animate-bounce ${
          alertMsg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {alertMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* ─── MAIN CONTENT CONTAINER ─────────────────────────────────── */}
      <div className="w-full space-y-6">

        {/* Back to Dashboard Button when on Sub-Tabs */}
        {activeTab !== 'home' && (
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-black transition cursor-pointer shadow-2xs group"
          >
            <ChevronLeft size={16} className="text-indigo-600 group-hover:-translate-x-0.5 transition-transform" />
            ড্যাশবোর্ডে ফিরুন
          </button>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 1: HOME (DASHBOARD — EXACT IMAGE 2 SERVICE CARDS)
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* 🌟 TEACHER WELCOME & QUICK STATS HERO BANNER */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-indigo-900/60 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 p-0.5 shadow-lg shrink-0">
                    <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-xl sm:text-2xl text-indigo-300">
                      {teacherName.charAt(0) || 'শ'}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        স্বাগতম, {teacherName}!
                      </h1>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        সক্রিয় শিক্ষক
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 mt-1 text-xs text-indigo-200/80 flex-wrap font-medium">
                      <span>{designation}</span>
                      <span>•</span>
                      <span>আইডি: {toBnDigit(teacherId)}</span>
                      <span>•</span>
                      <span className="text-indigo-300 font-bold">
                        {isClassTeacher 
                          ? `শ্রেণি শিক্ষক: ${classTeachers.map(ct => gradeLabel(ct.classId)).join(', ')}`
                          : 'বিষয়ভিত্তিক শিক্ষক'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hero Quick Stat Pills */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3 bg-white/5 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-white/10 shrink-0">
                  <div className="text-center px-2">
                    <span className="text-[10px] text-indigo-200 block font-bold">বরাদ্দকৃত বিষয়</span>
                    <span className="text-base sm:text-lg font-black text-white font-mono">{toBnDigit(assignments.length)}টি</span>
                  </div>
                  <div className="text-center px-2 border-x border-white/10">
                    <span className="text-[10px] text-teal-300 block font-bold">আজকের উপস্থিতি</span>
                    <span className="text-base sm:text-lg font-black text-teal-300 font-mono">
                      {todayAttendance?.hasRollCall ? `${toBnDigit(todayAttendance.rate)}%` : 'বাকি'}
                    </span>
                  </div>
                  <div className="text-center px-2">
                    <span className="text-[10px] text-amber-300 block font-bold">আজকের ক্লাস</span>
                    <span className="text-base sm:text-lg font-black text-amber-300 font-mono">{toBnDigit(currentDayRoutines.length)}টি</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <h2 className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100">
                শিক্ষক সেবা ও দ্রুত কার্যক্রম
              </h2>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                সকল সেবা (৮টি)
              </span>
            </div>

            {/* 🌟 7-CARD PROFESSIONAL SERVICE GRID (MATCHING IMAGE 2) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">

              {/* Card 1: হাজিরা গ্রহণ */}
              <button
                type="button"
                onClick={() => setActiveTab('attendance')}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90 dark:border-slate-800 text-left hover:border-teal-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group min-h-[165px]"
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="w-13 h-13 bg-gradient-to-tr from-teal-500 to-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/25 group-hover:scale-110 group-hover:rotate-2 transition-transform shrink-0">
                    <UserCheck size={26} />
                  </div>

                  {/* 📍 লাল দাগ দেওয়া স্থানে আজকের উপস্থিতি (ছাত্র, ছাত্রী, মোট) - রোল কল না হলে দেখাবে না */}
                  {todayAttendance && todayAttendance.hasRollCall && (
                    <div className="flex flex-col items-end justify-center text-right text-[11px] font-bold leading-tight space-y-1 bg-teal-50/80 dark:bg-teal-950/50 border border-teal-200/80 dark:border-teal-800/60 px-2.5 py-1.5 rounded-xl shadow-2xs">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <span className="text-[10px] text-slate-400 font-medium">ছাত্র:</span>
                        <span className="font-black text-teal-700 dark:text-teal-300 font-mono">{toBnDigit(todayAttendance.boys)} জন</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <span className="text-[10px] text-slate-400 font-medium">ছাত্রী:</span>
                        <span className="font-black text-rose-600 dark:text-rose-400 font-mono">{toBnDigit(todayAttendance.girls)} জন</span>
                      </div>
                      <div className="flex items-center gap-1.5 pt-0.5 border-t border-teal-200 dark:border-teal-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">মোট:</span>
                        <span className="font-black text-slate-900 dark:text-slate-100 font-mono">{toBnDigit(todayAttendance.total)} জন</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <p className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-tight">হাজিরা গ্রহণ</p>
                  <p className="text-xs text-slate-400 font-bold mt-1">দৈনিক রোল কল</p>
                </div>
              </button>

              {/* Card 2: নম্বর এন্ট্রি */}
              <Link
                href="/dashboard/exam/mark-entry"
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90 dark:border-slate-800 text-left hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group min-h-[165px]"
              >
                <div className="w-13 h-13 bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 group-hover:rotate-2 transition-transform">
                  <Pencil size={26} />
                </div>
                <div className="mt-5">
                  <p className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-tight">নম্বর এন্ট্রি</p>
                  <p className="text-xs text-slate-400 font-bold mt-1">{assignments.length}টি বিষয় বরাদ্দ</p>
                </div>
              </Link>

              {/* Card 3: ক্লাস রুটিন */}
              <button
                type="button"
                onClick={() => setActiveTab('routine')}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90 dark:border-slate-800 text-left hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group min-h-[165px]"
              >
                <div className="w-13 h-13 bg-gradient-to-tr from-blue-500 to-cyan-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 group-hover:rotate-2 transition-transform">
                  <Calendar size={26} />
                </div>
                <div className="mt-5">
                  <p className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-tight">ক্লাস রুটিন</p>
                  <p className="text-xs text-slate-400 font-bold mt-1">সাপ্তাহিক শিডিউল</p>
                </div>
              </button>

              {/* Card 4: ছুটির আবেদন */}
              <button
                type="button"
                onClick={() => setActiveTab('leaves')}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90 dark:border-slate-800 text-left hover:border-amber-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group min-h-[165px]"
              >
                <div className="w-13 h-13 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-110 group-hover:rotate-2 transition-transform">
                  <Send size={26} />
                </div>
                <div className="mt-5">
                  <p className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-tight">ছুটির আবেদন</p>
                  <p className="text-xs text-slate-400 font-bold mt-1">আবেদন ও ট্র্যাকিং</p>
                </div>
              </button>

              {/* Card 5: শিক্ষার্থী ও ফি */}
              <button
                type="button"
                onClick={() => setActiveTab('students')}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90 dark:border-slate-800 text-left hover:border-emerald-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group min-h-[165px]"
              >
                <div className="w-13 h-13 bg-gradient-to-tr from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 group-hover:rotate-2 transition-transform">
                  <Users size={26} />
                </div>
                <div className="mt-5">
                  <p className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-tight">শিক্ষার্থী ও ফি</p>
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    {isClassTeacher ? `${classStudents.length} জন শিক্ষার্থী` : 'শ্রেণি শিক্ষক'}
                  </p>
                </div>
              </button>

              {/* Card 6: নোটিশ বোর্ড */}
              <button
                type="button"
                onClick={() => setActiveTab('notices')}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90 dark:border-slate-800 text-left hover:border-rose-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group min-h-[165px]"
              >
                <div className="w-13 h-13 bg-gradient-to-tr from-rose-500 to-pink-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/25 group-hover:scale-110 group-hover:rotate-2 transition-transform">
                  <Bell size={26} />
                </div>
                <div className="mt-5">
                  <p className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-tight">নোটিশ বোর্ড</p>
                  <p className="text-xs text-slate-400 font-bold mt-1">{notices.length}টি নোটিশ</p>
                </div>
              </button>

              {/* Card 7: প্রোফাইল ও অডিট */}
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90 dark:border-slate-800 text-left hover:border-purple-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group min-h-[165px]"
              >
                <div className="w-13 h-13 bg-gradient-to-tr from-purple-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 group-hover:rotate-2 transition-transform">
                  <User size={26} />
                </div>
                <div className="mt-5">
                  <p className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-tight">প্রোফাইল ও অডিট</p>
                  <p className="text-xs text-slate-400 font-bold mt-1">অ্যাকাউন্ট ও লগ</p>
                </div>
              </button>

              {/* Card 8: শিক্ষার্থী উপস্থিতি ও অনুপস্থিতি রিপোর্ট (মোট শিক্ষার্থী, উপস্থিত, অনুপস্থিত) */}
              <button
                type="button"
                onClick={() => setActiveTab('attendance')}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90 dark:border-slate-800 text-left hover:border-cyan-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group min-h-[165px]"
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="w-13 h-13 bg-gradient-to-tr from-cyan-500 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-110 group-hover:rotate-2 transition-transform shrink-0">
                    <BarChart2 size={26} />
                  </div>

                  {todayAttendance?.hasRollCall ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                      হার: {toBnDigit(todayAttendance.rate)}%
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      রোল কল বাকি
                    </span>
                  )}
                </div>

                {/* 📊 ৩-কলাম হাজিরা পরিসংখ্যান গ্রিড (মোট, উপস্থিত, অনুপস্থিত) */}
                <div className="grid grid-cols-3 gap-1 py-1.5 px-2 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-100 dark:border-slate-800/90 text-center my-2">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">
                      মোট
                    </span>
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 font-mono">
                      {toBnDigit(todayAttendance?.totalEnrolled || classStudents.length || 0)}
                    </span>
                  </div>
                  <div className="border-x border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                      উপস্থিত
                    </span>
                    <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {todayAttendance?.hasRollCall ? toBnDigit(todayAttendance.total) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block">
                      অনুপস্থিত
                    </span>
                    <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                      {todayAttendance?.hasRollCall ? toBnDigit(todayAttendance.absent) : '—'}
                    </span>
                  </div>
                </div>

                <div className="mt-1">
                  <p className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-tight">
                    উপস্থিতি সারসংক্ষেপ
                  </p>
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    {todayAttendance?.hasRollCall 
                      ? `${toBnDigit(todayAttendance.total)} জন উপস্থিত (${toBnDigit(todayAttendance.rate)}%)`
                      : 'দৈনিক হাজিরা ও অনুপস্থিতি হিসাব'}
                  </p>
                </div>
              </button>

            </div>

            {/* ─── CLASS-WISE ASSIGNED SUBJECTS TABLE (শ্রেণিভিত্তিক বরাদ্দকৃত বিষয়ের টেবল) ─── */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90 dark:border-slate-800 space-y-5">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                        আমার বরাদ্দকৃত বিষয়সমূহ (শ্রেণিভিত্তিক তালিকা)
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                        মোট {assignments.length}টি বিষয়
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      নিচের তালিকায় আপনার দায়িত্বপ্রাপ্ত শ্রেণি ও বিষয়সমূহ প্রদর্শিত হচ্ছে। যেকোনো বিষয়ে সরাসরি নম্বর এন্ট্রি করতে বিষয়টিতে ক্লিক করুন।
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/exam/mark-entry"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition shadow-xs shrink-0 self-start sm:self-auto active:scale-95"
                >
                  <Pencil size={14} />
                  <span>নম্বর এন্ট্রি প্যানেল</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              {/* Table Content */}
              {assignments.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/60 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
                    <AlertCircle size={26} />
                  </div>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-200">এখনও কোনো বিষয় বরাদ্দ করা হয়নি</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    প্রধান শিক্ষক বা অ্যাডমিন প্যানেল থেকে আপনার আইডিতে শ্রেণিভিত্তিক বিষয় বণ্টন করা হলে এখানে টেবল আকারে প্রদর্শিত হবে।
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse border border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-900">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-black">
                        <th className="py-3 px-4 border border-slate-400 dark:border-slate-600 w-44 text-slate-900 dark:text-slate-100">
                          শ্রেণি
                        </th>
                        <th className="py-3 px-4 border border-slate-400 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                          বরাদ্দকৃত বিষয়সমূহ
                        </th>
                        <th className="py-3 px-4 border border-slate-400 dark:border-slate-600 text-center w-28 text-slate-900 dark:text-slate-100">
                          মোট বিষয়
                        </th>
                        <th className="py-3 px-4 border border-slate-400 dark:border-slate-600 text-center w-36 text-slate-900 dark:text-slate-100">
                          অ্যাকশন
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-0">
                      {sortedGradeKeys.map((gradeKey, idx) => {
                        const gradeAssignments = assignmentsByGrade[gradeKey] || [];
                        return (
                          <tr
                            key={gradeKey}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            {/* শ্রেণি */}
                            <td className="py-3 px-4 border border-slate-400 dark:border-slate-600 align-middle">
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                                  {idx + 1}
                                </span>
                                <div>
                                  <span className="font-black text-slate-900 dark:text-slate-100 text-sm block">
                                    {gradeLabel(gradeKey)}
                                  </span>
                                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                                    শিক্ষাবর্ষ: ২০২৬
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* বরাদ্দকৃত বিষয়সমূহ */}
                            <td className="py-3 px-4 border border-slate-400 dark:border-slate-600 align-middle">
                              <div className="flex flex-wrap items-center gap-2">
                                {gradeAssignments.map(a => (
                                  <Link
                                    key={a.id}
                                    href={`/dashboard/exam/mark-entry?grade=${a.classId}&subject=${encodeURIComponent(a.subjectId)}`}
                                    title={`${gradeLabel(a.classId)} - ${a.subjectId} নম্বর এন্ট্রি`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition border border-slate-300 dark:border-slate-600 hover:border-indigo-600 group"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:bg-white transition-colors shrink-0" />
                                    <span>{a.subjectId}</span>
                                    <Edit3 size={12} className="opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
                                  </Link>
                                ))}
                              </div>
                            </td>

                            {/* মোট বিষয় */}
                            <td className="py-3 px-4 border border-slate-400 dark:border-slate-600 text-center align-middle">
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-2.5 py-1 inline-block">
                                {gradeAssignments.length < 10 ? `০${gradeAssignments.length}` : gradeAssignments.length}টি
                              </span>
                            </td>

                            {/* অ্যাকশন */}
                            <td className="py-3 px-4 border border-slate-400 dark:border-slate-600 text-center align-middle">
                              <Link
                                href={`/dashboard/exam/mark-entry?grade=${gradeKey}${gradeAssignments.length > 0 ? `&subject=${encodeURIComponent(gradeAssignments[0].subjectId)}` : ''}`}
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition border border-indigo-700 active:scale-95"
                              >
                                <Edit3 size={13} />
                                <span>নম্বর দিন</span>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-slate-100">
                        <td className="py-3 px-4 border border-slate-400 dark:border-slate-600">
                          সর্বমোট
                        </td>
                        <td className="py-3 px-4 border border-slate-400 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold">
                          {sortedGradeKeys.length}টি শ্রেণিতে ক্লাস বণ্টন
                        </td>
                        <td className="py-3 px-4 border border-slate-400 dark:border-slate-600 text-center">
                          <span className="px-2.5 py-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-black font-mono inline-block">
                            {assignments.length < 10 ? `০${assignments.length}` : assignments.length}টি বিষয়
                          </span>
                        </td>
                        <td className="py-3 px-4 border border-slate-400 dark:border-slate-600 text-center font-bold text-emerald-700 dark:text-emerald-400">
                          সক্রিয়
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 2: MARKS ENTRY (SCOPED)
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'marks' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="font-black text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <Pencil size={20} className="text-indigo-600" />
                নম্বর এন্ট্রি — অনুমোদিত বিষয়সমূহ
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Deny-by-Default নীতিতে আপনি শুধুমাত্র আপনার বরাদ্দকৃত বিষয়ে নম্বর প্রদান ও পরিবর্তন করতে পারবেন।
              </p>
            </div>

            {assignments.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto text-amber-500 mb-2" size={36} />
                <p className="text-xs text-slate-500 font-bold">কোনো বিষয় বরাদ্দ নেই!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.map(a => (
                  <Link
                    key={a.id}
                    href={`/dashboard/exam/mark-entry?grade=${a.classId}&subject=${encodeURIComponent(a.subjectId)}`}
                    className="p-5 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 rounded-3xl transition flex flex-col justify-between space-y-4 group shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-2xl flex items-center justify-center">
                        <BookMarked size={22} />
                      </div>
                      <span className="text-[11px] font-black px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700">
                        {gradeLabel(a.classId)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-slate-100 text-base group-hover:text-indigo-600 transition">{a.subjectId}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">ক্লিক করে শিক্ষার্থীদের নম্বর প্রদান করুন</p>
                    </div>
                    <div className="flex items-center gap-1 text-indigo-600 font-black text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span>নম্বর দিন</span>
                      <ChevronRight size={15} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 3: ATTENDANCE
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'attendance' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <h2 className="font-black text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <UserCheck size={20} className="text-teal-600" />
                দৈনিক হাজিরা ব্যবস্থাপনা
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                শ্রেণি শিক্ষক তার বরাদ্দকৃত শ্রেণির পূর্ণাঙ্গ হাজিরা এবং সহকারী শিক্ষক পিরিয়ডভিত্তিক হাজিরা নিতে পারবেন।
              </p>
            </div>

            {isClassTeacher ? (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-teal-800 dark:text-teal-300 uppercase tracking-wider">আমার শ্রেণি শিক্ষক প্যানেল (Full Access):</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classTeachers.map(ct => {
                    const parts = ct.classId.split('-');
                    const g = parts[0] || '';
                    const b = parts[1] || '';
                    return (
                      <div key={ct.id} className="p-6 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-3xl flex flex-col justify-between space-y-4 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center">
                            <Users size={22} />
                          </div>
                          <span className="text-xs font-black px-3 py-1 bg-teal-200/60 dark:bg-teal-900 text-teal-900 dark:text-teal-100 rounded-full">
                            শ্রেণি শিক্ষক
                          </span>
                        </div>
                        <div>
                          <h4 className="font-black text-lg text-slate-900 dark:text-slate-100">{gradeLabel(g)} — {branchLabel(b)}</h4>
                          <p className="text-xs text-teal-800 dark:text-teal-200 mt-1">{classStudents.length} জন শিক্ষার্থীর দৈনিক উপস্থিতি ও অনুপস্থিতি রেকর্ড করুন</p>
                        </div>
                        <Link
                          href={`/dashboard/academic/attendance?grade=${g}&branch=${b}`}
                          className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-black text-center transition flex items-center justify-center gap-2 shadow-xs"
                        >
                          <UserCheck size={16} />
                          হাজিরা শিট খুলুন
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
                <Shield size={32} className="mx-auto text-amber-500" />
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">সহকারী শিক্ষক উপস্থিতি মোড</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  আপনাকে কোনো শ্রেণির প্রধান শ্রেণি শিক্ষক হিসেবে নিযুক্ত করা হয়নি। আপনি আপনার ক্লাসের সময়সূচি অনুযায়ী হাজিরা শিট পরিদর্শন করতে পারেন।
                </p>
                <Link
                  href="/dashboard/academic/attendance"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black"
                >
                  সাধারণ হাজিরা প্যানেল
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 4: CLASS STUDENTS & FEE STATUS (CLASS TEACHER ONLY)
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'students' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
            {!isClassTeacher ? (
              <div className="text-center py-12 space-y-2">
                <Lock className="mx-auto text-slate-400 mb-2" size={36} />
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">অনুমতি নেই</h3>
                <p className="text-xs text-slate-500">শিক্ষার্থী প্রোফাইল এডিট ও ফি তথ্য শুধুমাত্র নির্ধারিত শ্রেণি শিক্ষকদের জন্য উন্মুক্ত।</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="font-black text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                      <Users size={20} className="text-teal-600" />
                      আমার শ্রেণির শিক্ষার্থী তালিকা ও ফি স্ট্যাটাস
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">মৌলিক তথ্য এডিট ও ফি সংক্রান্ত তথ্য (View-only)</p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="নাম বা রোল দিয়ে খুঁজুন..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Table for Desktop / Cards for Mobile */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-black">
                        <th className="py-3 px-4">রোল</th>
                        <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                        <th className="py-3 px-4">পিতা / অভিভাবক</th>
                        <th className="py-3 px-4">মোবাইল</th>
                        <th className="py-3 px-4">ফি স্ট্যাটাস (View-only)</th>
                        <th className="py-3 px-4 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredStudents.map(st => {
                        const ledger = studentLedgers[st.id];
                        const totalDue = ledger ? ledger.totalDue : 0;
                        const totalPaid = ledger ? ledger.totalPaid : 0;

                        return (
                          <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3.5 px-4 font-black text-slate-900 dark:text-slate-100">{st.roll}</td>
                            <td className="py-3.5 px-4">
                              <p className="font-extrabold text-slate-900 dark:text-slate-100">{st.name}</p>
                              <p className="text-[10px] text-slate-400">{st.religion || 'ইসলাম'} • {st.bloodGroup || '—'}</p>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">{st.fatherName || st.guardian || '—'}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">{st.mobile || '—'}</td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-emerald-600">পরিশোধ: ৳{totalPaid}</span>
                                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                                  totalDue === 0 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                                }`}>
                                  {totalDue === 0 ? 'পরিশোধিত' : `বকেয়া: ৳${totalDue}`}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenEditStudent(st)}
                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black transition cursor-pointer"
                              >
                                <Edit3 size={13} className="inline mr-1" />
                                এডিট
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 5: ROUTINE
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'routine' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="font-black text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  <Calendar size={20} className="text-blue-600" />
                  সাপ্তাহিক ক্লাস রুটিন ও সময়সূচি
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">শনিবার হতে বৃহস্পতিবার পর্যন্ত ক্লাস শিডিউল</p>
              </div>

              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setRoutineViewMode('my')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    routineViewMode === 'my' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  আমার ক্লাস শিডিউল
                </button>
                <button
                  type="button"
                  onClick={() => setRoutineViewMode('full')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    routineViewMode === 'full' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  সম্পূর্ণ স্কুল মাস্টার রুটিন
                </button>
              </div>
            </div>

            {/* Day Selector */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {ROUTINE_DAYS.map(d => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setSelectedRoutineDay(d.key)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black shrink-0 transition cursor-pointer ${
                    selectedRoutineDay === d.key ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {d.labelBn}
                </button>
              ))}
            </div>

            {/* Slots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentDayRoutines.length === 0 ? (
                <div className="col-span-full text-center py-12 text-xs text-slate-400 font-bold">
                  উক্ত দিনে কোনো নির্ধারিত ক্লাস শিডিউল নেই।
                </div>
              ) : (
                currentDayRoutines.map(r => (
                  <div key={r.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-2xl flex flex-col items-center justify-center font-black">
                        <span className="text-[9px] text-blue-600">পিরিয়ড</span>
                        <span className="text-base leading-none">{r.periodNo}</span>
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-slate-100 text-sm">{r.subject}</p>
                        <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                          {gradeLabel(r.grade)} ({branchLabel(r.branch)}) • রুম: {r.roomNo}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-black px-3 py-1 bg-blue-50 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200 rounded-full">
                      {r.teacherName}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 6: LEAVE APPLICATIONS
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'leaves' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left: Submit Application Form */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <h2 className="font-black text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  <Send size={18} className="text-amber-600" />
                  ছুটির আবেদন করুন (প্রধান শিক্ষক বরাবর)
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  নৈমিত্তিক বা চিকিৎসা ছুটির আবেদন দাখিল করুন।
                </p>
              </div>

              <form onSubmit={handleSubmitLeave} className="space-y-3.5 text-xs font-bold">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">ছুটির ধরন</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:outline-none focus:border-amber-500"
                  >
                    {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1">শুরুর তারিখ</label>
                    <input
                      type="date"
                      value={leaveStart}
                      onChange={(e) => setLeaveStart(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1">শেষের তারিখ</label>
                    <input
                      type="date"
                      value={leaveEnd}
                      onChange={(e) => setLeaveEnd(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">ছুটির সুনির্দিষ্ট কারণ</label>
                  <textarea
                    rows={4}
                    placeholder="ছুটির কারণ বিস্তারিত উল্লেখ করুন..."
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={leaveSubmitting}
                  className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Send size={15} />
                  {leaveSubmitting ? 'সাবমিট হচ্ছে...' : 'প্রধান শিক্ষক বরাবর আবেদন প্রেরণ'}
                </button>
              </form>
            </div>

            {/* Right: Applications History */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">আমার ছুটির আবেদন হিস্ট্রি</h3>

              {leaves.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 font-bold">
                  এখনও কোনো ছুটির আবেদন করা হয়নি।
                </div>
              ) : (
                <div className="space-y-3">
                  {leaves.map(l => (
                    <div key={l.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-2.5 hover:border-amber-200 transition">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900 dark:text-slate-100 text-sm">{LEAVE_TYPE_LABELS[l.leaveType]}</span>
                        <span className={`text-xs font-black px-3 py-1 rounded-full ${
                          l.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' :
                          l.status === 'rejected' ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}>
                          {l.status === 'approved' ? '✓ মঞ্জুরকৃত' : l.status === 'rejected' ? '✕ বাতিলকৃত' : '⏳ বিবেচনাধীন (Pending)'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{l.reason}</p>

                      <div className="flex items-center justify-between text-xs text-slate-400 font-bold pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span>তারিখ: {l.startDate} হতে {l.endDate} ({l.totalDays} দিন)</span>
                        {l.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleCancelLeave(l.id)}
                            className="text-rose-600 hover:underline font-black cursor-pointer"
                          >
                            আবেদন প্রত্যাহার
                          </button>
                        )}
                      </div>

                      {l.remarks && (
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                          পর্যালোচনা মন্তব্য ({l.reviewedBy}): {l.remarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 7: NOTICES
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'notices' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <h2 className="font-black text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <Bell size={20} className="text-rose-600" />
                প্রতিষ্ঠানিক নোটিশ বোর্ড (View-only)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">বিদ্যালয় প্রশাসন ও প্রধান শিক্ষক কর্তৃক প্রকাশিত সকল জরুরি বিজ্ঞপ্তি</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notices.map(n => (
                <div key={n.id} className="border border-slate-200 dark:border-slate-700 rounded-3xl p-5 space-y-3 hover:border-indigo-300 transition flex flex-col justify-between shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm leading-snug">{n.title}</h3>
                      {n.priority === 'urgent' && (
                        <span className="text-[10px] font-black px-2.5 py-0.5 bg-rose-100 text-rose-700 rounded-full shrink-0">
                          জরুরি
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{n.content}</p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>প্রকাশক: {n.publisherName}</span>
                    <span>{new Date(n.publishedAt).toLocaleDateString('bn-BD')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 8: PROFILE & AUDIT LOG
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Profile & Permissions Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-700 to-indigo-950 p-6 text-white text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center font-black text-3xl mx-auto mb-3">
                    {teacherName.charAt(0)}
                  </div>
                  <h2 className="font-black text-xl">{teacherName}</h2>
                  <p className="text-xs text-indigo-200">{designation}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-white/15 rounded-full text-xs font-mono font-bold">
                    ID: {teacherId}
                  </span>
                </div>

                <div className="p-6 space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-medium">ইউজারনেম / ফোন</span>
                    <span className="font-black text-slate-900 dark:text-slate-100">{teacher?.phone || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-medium">রোল ও পদবি</span>
                    <span className="font-black text-slate-900 dark:text-slate-100">{designation}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-medium">শ্রেণি শিক্ষক পদবী</span>
                    <span className="font-black text-teal-600">
                      {isClassTeacher ? classTeachers.map(c => c.classId).join(', ') : 'নির্ধারিত নয়'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-400 font-medium">বরাদ্দকৃত বিষয়</span>
                    <span className="font-black text-indigo-600">{assignments.length}টি বিষয়</span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-3xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <LogOut size={16} />
                লগআউট করুন
              </button>
            </div>

            {/* Audit Logs Table */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <Clock size={18} className="text-slate-500" />
                আমার সাম্প্রতিক অ্যাকশন লগ (Audit Trail)
              </h3>

              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 font-bold">
                  কোনো সাম্প্রতিক অ্যাকশন লগ নেই।
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditLogs.map((log, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black font-mono text-[11px] text-slate-800 dark:text-slate-200">{log.action}</span>
                          <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">{log.category}</span>
                        </div>
                        <p className="text-slate-500 text-xs font-medium mt-0.5">{log.details}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString('bn-BD')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ─── MODAL: EDIT STUDENT BASIC INFO (CLASS TEACHER ONLY) ────── */}
      {editStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">শিক্ষার্থী মৌলিক তথ্য এডিট</h3>
                <p className="text-xs text-slate-400 font-bold">রোল: {editStudent.roll} • শ্রেণি: {editStudent.grade}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditStudent(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveStudentBasicInfo} className="space-y-3 text-xs font-bold">
              
              {/* Photo Box */}
              <div className="flex items-center gap-4 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-16 h-20 rounded-xl bg-white dark:bg-slate-700 border-2 border-indigo-500/30 overflow-hidden flex flex-col items-center justify-center text-center shadow-xs shrink-0">
                  {editForm.photo ? (
                    <img src={editForm.photo} alt={editForm.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-1">
                      <User size={22} className="text-slate-400 mb-0.5" />
                      <span className="text-[8px] font-bold">ছবি নেই</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 block">
                    শিক্ষার্থীর পাসপোর্ট ছবি
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold cursor-pointer transition flex items-center gap-1">
                      <Camera size={13} />
                      {editForm.photo ? 'নতুন ছবি আপলোড' : 'ছবি আপলোড করুন'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              alert('ছবির সাইজ সর্বোচ্চ ৫MB হতে পারবে।');
                              return;
                            }
                            const compressed = await compressImage(file);
                            setEditForm((prev) => ({ ...prev, photo: compressed }));
                          }
                        }}
                      />
                    </label>
                    {editForm.photo && (
                      <button
                        type="button"
                        onClick={() => setEditForm((prev) => ({ ...prev, photo: '' }))}
                        className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl text-[11px] font-bold transition flex items-center gap-1"
                      >
                        <Trash2 size={12} /> মুছে ফেলুন
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">শিক্ষার্থীর পূর্ণ নাম</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">পিতার নাম</label>
                  <input
                    type="text"
                    value={editForm.fatherName}
                    onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">মাতার নাম</label>
                  <input
                    type="text"
                    value={editForm.motherName}
                    onChange={(e) => setEditForm({ ...editForm, motherName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">অভিভাবকের নাম</label>
                  <input
                    type="text"
                    value={editForm.guardian}
                    onChange={(e) => setEditForm({ ...editForm, guardian: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">যোগাযোগ মোবাইল</label>
                  <input
                    type="text"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">ধর্ম</label>
                  <select
                    value={editForm.religion}
                    onChange={(e) => setEditForm({ ...editForm, religion: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="ইসলাম">ইসলাম</option>
                    <option value="হিন্দু">হিন্দু</option>
                    <option value="বৌদ্ধ">বৌদ্ধ</option>
                    <option value="খ্রিস্টান">খ্রিস্টান</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">রক্তের গ্রুপ</label>
                  <input
                    type="text"
                    placeholder="A+, B+, etc."
                    value={editForm.bloodGroup}
                    onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">জন্ম তারিখ</label>
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">বর্তমান ঠিকানা</label>
                <input
                  type="text"
                  value={editForm.currentAddress}
                  onChange={(e) => setEditForm({ ...editForm, currentAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold"
                />
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 font-bold">
                ⚠️ দ্রষ্টব্য: শ্রেণি শিক্ষকের শুধুমাত্র মৌলিক তথ্য এডিটের অনুমতি রয়েছে। রোল নম্বর, রেজাল্ট হিস্ট্রি ও ফি পরিবর্তনের অধিকার সংরক্ষিত।
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditStudent(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MOBILE-ONLY FLOATING BOTTOM BAR (HIDDEN ON DESKTOP) ─────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl z-40 md:hidden">
        <div className="grid grid-cols-4 gap-0 py-1.5 max-w-md mx-auto">
          {[
            { id: 'home', icon: Home, label: 'হোম' },
            { id: 'marks', icon: Pencil, label: 'নম্বর' },
            { id: 'attendance', icon: UserCheck, label: 'হাজিরা' },
            { id: 'leaves', icon: Send, label: 'ছুটি' },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as NavTab)}
                className={`flex flex-col items-center justify-center py-2 gap-1 transition cursor-pointer ${
                  active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`w-8 h-8 rounded-2xl flex items-center justify-center transition ${active ? 'bg-indigo-100 dark:bg-indigo-950' : ''}`}>
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span className={`text-[10px] font-bold ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>{tab.label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
