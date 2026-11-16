'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { confirmDialog } from '@/components/ui/ToastProvider';
import {
  Users,
  UserPlus,
  Key,
  ShieldCheck,
  BookOpen,
  School,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Search,
  Phone,
  Eye,
  Pencil,
  X,
  Send,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import {
  teacherRBACService,
  TeacherRecord,
  SubjectAssignment,
  ClassTeacherAssignment,
} from '@/services/teacherRBACService';
import { leaveService, LeaveApplication } from '@/services/leaveService';
import { getDynamicConfiguredSubjects, TeacherTab } from '@/components/teacher/teacherUtils';
import TeacherAssignmentsTab from '@/components/teacher/TeacherAssignmentsTab';
import ClassTeacherTab from '@/components/teacher/ClassTeacherTab';
import PermissionValidatorTab from '@/components/teacher/PermissionValidatorTab';
import { LeaveApplicationsTab, AuditTrailTab } from '@/components/teacher/LeaveApplicationsTab';
import {
  AddTeacherModal,
  ResetPasswordModal,
  EditTeacherModal,
  ViewTeacherModal,
  EditTeacherPayload,
} from '@/components/teacher/TeacherModals';
import { LeaveReviewModal, PrintLeaveSlipModal } from '@/components/teacher/LeaveModals';

// ─── TAB CONFIG ───────────────────────────────────────────────────────
const TAB_CONFIG: { id: TeacherTab; label: string; icon: React.ReactNode }[] = [
  { id: 'teachers', label: 'শিক্ষক তালিকা', icon: <Users size={15} /> },
  { id: 'assignments', label: 'বিষয়ভিত্তিক বণ্টন', icon: <BookOpen size={15} /> },
  { id: 'class_teachers', label: 'শ্রেণি শিক্ষক', icon: <School size={15} /> },
  { id: 'permission_test', label: 'পারমিশন ভ্যালিডেটর', icon: <ShieldCheck size={15} /> },
  { id: 'leave_applications', label: 'ছুটির আবেদনসমূহ', icon: <Send size={15} /> },
  { id: 'audit_trail', label: 'অডিট ও সিকিউরিটি লগ', icon: <Clock size={15} /> },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────
function TeacherManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<TeacherTab>('teachers');

  // ─── Data States
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignment[]>([]);
  const [classTeachers, setClassTeachers] = useState<ClassTeacherAssignment[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);

  // ─── UI States
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Modal: Add Teacher
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('সহকারী শিক্ষক');
  const [dob, setDob] = useState('1990-01-01');
  const [initialPassword, setInitialPassword] = useState('');

  // ─── Modal: Password Reset
  const [resetTeacherId, setResetTeacherId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  // ─── Modal: View & Edit Teacher
  const [showViewTeacherModal, setShowViewTeacherModal] = useState(false);
  const [viewTeacherRecord, setViewTeacherRecord] = useState<TeacherRecord | null>(null);
  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
  const [editTeacherData, setEditTeacherData] = useState<EditTeacherPayload | null>(null);

  // ─── Subject Assignment Form
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignClassId, setAssignClassId] = useState('8th');
  const [assignSubjectId, setAssignSubjectId] = useState('সাধারণ গণিত');
  const [assignGroup, setAssignGroup] = useState<'all' | 'science' | 'humanities' | 'commerce'>('science');

  // ─── Class Teacher Form
  const [ctClassId, setCtClassId] = useState('8th-A');
  const [ctTeacherId, setCtTeacherId] = useState('');

  // ─── Leave Application Review & Filter States
  const [leaveFilter, setLeaveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedLeaveForReview, setSelectedLeaveForReview] = useState<LeaveApplication | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected'>('approved');
  const [reviewRemarks, setReviewRemarks] = useState('ছুটি মঞ্জুর করা হলো।');
  const [printSlipLeave, setPrintSlipLeave] = useState<LeaveApplication | null>(null);

  // ─── DATA REFRESH
  const refreshAllData = useCallback(() => {
    setTeachers(teacherRBACService.getTeachers());
    setSubjectAssignments(teacherRBACService.getSubjectAssignments());
    setClassTeachers(teacherRBACService.getClassTeachers());
    setLeaveApplications(leaveService.getLeaves());
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('sms_audit_logs');
        if (raw) setAuditLogsList(JSON.parse(raw).reverse());
      } catch {
        // Ignore corrupt audit log JSON safely
      }
    }
  }, []);

  // ─── Sync activeTab with URL search param '?tab='
  useEffect(() => {
    const tabParam = searchParams?.get('tab') as TeacherTab;
    if (
      tabParam &&
      ['teachers', 'assignments', 'class_teachers', 'permission_test', 'leave_applications', 'audit_trail'].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const pendingLeavesCount = useMemo(
    () => leaveApplications.filter((l) => l.status === 'pending').length,
    [leaveApplications]
  );
  const approvedLeavesCount = useMemo(
    () => leaveApplications.filter((l) => l.status === 'approved').length,
    [leaveApplications]
  );
  const rejectedLeavesCount = useMemo(
    () => leaveApplications.filter((l) => l.status === 'rejected').length,
    [leaveApplications]
  );
  const filteredLeaves = useMemo(
    () => (leaveFilter === 'all' ? leaveApplications : leaveApplications.filter((l) => l.status === leaveFilter)),
    [leaveApplications, leaveFilter]
  );

  // ─── ALERT
  const showAlert = useCallback((type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  }, []);

  const handleOpenReviewModal = (leave: LeaveApplication, status: 'approved' | 'rejected') => {
    setSelectedLeaveForReview(leave);
    setReviewDecision(status);
    setReviewRemarks(status === 'approved' ? 'ছুটি মঞ্জুর করা হলো।' : 'প্রশাসনিক কারণে ছুটি মঞ্জুর করা সম্ভব হলো না।');
  };

  const handleConfirmReview = () => {
    if (!selectedLeaveForReview) return;
    const res = leaveService.reviewLeave(selectedLeaveForReview.id, reviewDecision, 'প্রধান শিক্ষক', reviewRemarks);
    if (res.success) {
      showAlert('success', res.message);
      setSelectedLeaveForReview(null);
      refreshAllData();
    } else {
      showAlert('error', res.message);
    }
  };

  useEffect(() => {
    setMounted(true);
    const currSession = teacherAuthService.getSession();
    setSession(currSession);
    if (currSession && currSession.role !== 'admin') {
      router.replace('/dashboard/teacher-portal');
      return;
    }
    refreshAllData();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', refreshAllData);
      return () => window.removeEventListener('storage', refreshAllData);
    }
  }, [refreshAllData, router]);

  // ─── COMPUTED
  const isClass9or10 = assignClassId.includes('9') || assignClassId.includes('10');
  const availableSubjectsList = useMemo(
    () => getDynamicConfiguredSubjects(assignClassId, isClass9or10 ? assignGroup : 'all', mounted),
    [assignClassId, assignGroup, isClass9or10, mounted]
  );

  useEffect(() => {
    if (availableSubjectsList.length > 0) {
      setAssignSubjectId(availableSubjectsList[0].name);
    }
  }, [assignClassId, assignGroup, availableSubjectsList]);

  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teachers;
    const q = searchQuery.toLowerCase();
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.phone.includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.designation.toLowerCase().includes(q)
    );
  }, [teachers, searchQuery]);

  // ─── HANDLERS
  const handleDeleteTeacher = async (id: string, tName: string) => {
    if (
      await confirmDialog({
        title: 'শিক্ষক মুছে ফেলা',
        message: `আপনি কি নিশ্চিতভাবে '${tName}' শিক্ষকের সকল তথ্য ও পারমিশন মুছে ফেলতে চান?`,
        confirmLabel: 'মুছে ফেলুন',
        danger: true,
      })
    ) {
      const res = teacherRBACService.deleteTeacher(id);
      showAlert(res.success ? 'success' : 'error', res.message);
      refreshAllData();
    }
  };

  const handleRemoveClassTeacher = async (id: string, className: string) => {
    if (
      await confirmDialog({
        title: 'শ্রেণি শিক্ষক বাতিল',
        message: `আপনি কি '${className}' শ্রেণির শ্রেণি শিক্ষক নির্বাচন বাতিল করতে চান?`,
        confirmLabel: 'বাতিল করুন',
        danger: true,
      })
    ) {
      const res = teacherRBACService.removeClassTeacher(id);
      showAlert(res.success ? 'success' : 'error', res.message);
      refreshAllData();
    }
  };

  const handleClearAllTeachers = async () => {
    if (teachers.length === 0) return;
    if (
      await confirmDialog({
        title: 'সকল শিক্ষক মুছে ফেলা',
        message: 'আপনি কি নিশ্চিত যে সকল শিক্ষকের তালিকা ও পারমিশন মুছে ফেলতে চান? এটি অপরিবর্তনীয়!',
        confirmLabel: 'সব মুছে ফেলুন',
        danger: true,
      })
    ) {
      const res = teacherRBACService.clearAllTeachers();
      if (res.success) {
        showAlert('success', res.message);
        refreshAllData();
      } else {
        showAlert('error', res.message);
      }
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return showAlert('error', 'নাম এবং ফোন নম্বর প্রদান করুন!');
    if (initialPassword.trim().length < 6) return showAlert('error', 'কমপক্ষে ৬ অক্ষরের প্রাথমিক পাসওয়ার্ড লিখুন!');
    const res = await teacherRBACService.createTeacher({
      name: name.trim(),
      phone: phone.trim(),
      designation,
      dob,
      status: 'active',
      passwordHash: initialPassword.trim(),
    });
    if (res.success) {
      showAlert('success', res.message);
      setName('');
      setPhone('');
      setInitialPassword('');
      setShowAddTeacherModal(false);
      refreshAllData();
    } else {
      showAlert('error', res.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTeacherId || !newPassword.trim()) return;
    const res = await teacherRBACService.resetPassword(resetTeacherId, newPassword.trim());
    if (res.success) {
      showAlert('success', res.message);
      setShowResetModal(false);
      setNewPassword('');
      refreshAllData();
    } else {
      showAlert('error', res.message);
    }
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeacherData || !editTeacherData.name.trim() || !editTeacherData.phone.trim()) {
      return showAlert('error', 'নাম এবং ফোন নম্বর প্রদান করুন!');
    }
    const res = await teacherRBACService.updateTeacher(editTeacherData.id, {
      name: editTeacherData.name.trim(),
      phone: editTeacherData.phone.trim(),
      designation: editTeacherData.designation,
      dob: editTeacherData.dob,
      password: editTeacherData.password?.trim() || undefined,
      status: editTeacherData.status,
    });
    if (res.success) {
      showAlert('success', res.message);
      setShowEditTeacherModal(false);
      setEditTeacherData(null);
      refreshAllData();
    } else {
      showAlert('error', res.message);
    }
  };

  const handleAssignSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTeacherId) return showAlert('error', 'শিক্ষক নির্বাচন করুন!');
    const res = teacherRBACService.assignSubject(assignTeacherId, assignClassId, assignSubjectId, 2026);
    showAlert(res.success ? 'success' : 'error', res.message);
    refreshAllData();
  };

  const handleAssignReligionTeacher = (classId: string, subjectName: string, teacherId: string) => {
    const classLabel =
      classId === '6th' ? '৬ষ্ঠ শ্রেণি' : classId === '7th' ? '৭ম শ্রেণি' : classId === '8th' ? '৮ম শ্রেণি' : classId === '9th' ? '৯ম শ্রেণি' : '১০ম শ্রেণি';
    const existing = subjectAssignments.filter(
      (a) =>
        a.classId === classId &&
        (a.subjectId === subjectName || a.subjectId.includes(subjectName) || subjectName.includes(a.subjectId))
    );
    existing.forEach((a) => teacherRBACService.removeSubjectAssignment(a.id));

    if (!teacherId) {
      refreshAllData();
      showAlert('success', `${classLabel}তে ${subjectName} শিক্ষক বরাদ্দ বাতিল করা হয়েছে!`);
      return;
    }

    const res = teacherRBACService.assignSubject(teacherId, classId, subjectName, 2026);
    if (res.success) {
      refreshAllData();
      showAlert('success', `${classLabel}তে ${subjectName} শিক্ষক সফলভাবে নির্ধারিত হয়েছে!`);
    } else {
      showAlert('error', res.message);
    }
  };

  const handleBulkAssignReligionTeacher = (subjectName: string, teacherId: string) => {
    if (!teacherId) {
      showAlert('error', 'অনুগ্রহ করে প্রথমে একজন শিক্ষক নির্বাচন করুন!');
      return;
    }
    let count = 0;
    ['6th', '7th', '8th', '9th', '10th'].forEach((cls) => {
      const existing = subjectAssignments.filter(
        (a) =>
          a.classId === cls &&
          (a.subjectId === subjectName || a.subjectId.includes(subjectName) || subjectName.includes(a.subjectId))
      );
      existing.forEach((a) => teacherRBACService.removeSubjectAssignment(a.id));
      const res = teacherRBACService.assignSubject(teacherId, cls, subjectName, 2026);
      if (res.success) count++;
    });
    refreshAllData();
    showAlert('success', `সকল শ্রেণিতে (৬ষ্ঠ-১০ম) ${subjectName} শিক্ষক নির্ধারণ সম্পন্ন (${count}টি শ্রেণি)!`);
  };

  const handleAssignClassTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctTeacherId) return showAlert('error', 'শিক্ষক নির্বাচন করুন!');
    const res = teacherRBACService.assignClassTeacher(ctTeacherId, ctClassId, 2026);
    showAlert(res.success ? 'success' : 'error', res.message);
    refreshAllData();
  };

  // ─── LOADING STATE
  if (!mounted) {
    return (
      <div className="w-full py-16" suppressHydrationWarning>
        <div className="animate-pulse space-y-6">
          <div className="h-28 bg-gradient-to-r from-slate-200 dark:from-slate-800 via-slate-100 dark:via-slate-800 to-slate-200 dark:to-slate-800 rounded-3xl" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-11 w-40 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
          <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  // 🛑 RBAC Access Guard: Only Admin / Principal can access Teacher & Staff Management
  if (session && session.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-5 shadow-sm" suppressHydrationWarning>
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">অনুমতি নেই (Access Restricted)</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            সহকারী শিক্ষকগণ শিক্ষক ও স্টাফ ব্যবস্থাপনায় অ্যাক্সেস করতে পারবেন না। আপনি শুধুমাত্র আপনার বরাদ্দকৃত বিষয় ও অন্যান্য তথ্য দেখতে এবং নির্ধারিত বিষয়ে নম্বর এন্ট্রি করতে পারবেন।
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <Link href="/dashboard/teacher-portal" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition shadow-sm">
            আমার শিক্ষক ড্যাশবোর্ডে যান
          </Link>
          <Link href="/dashboard/exam/mark-entry" className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-black transition border border-slate-200 dark:border-slate-700">
            নম্বর এন্ট্রি প্যানেল
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 pb-16 font-sans text-slate-900 dark:text-white" suppressHydrationWarning>
      {/* TOP ACTIONS & STATS ROW (Clean & Compact) */}
      <div className="space-y-4 print:hidden">
        <div className="flex justify-end items-center gap-2">
          {teachers.length > 0 && (
            <button
              onClick={handleClearAllTeachers}
              className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-xl font-bold text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="সকল শিক্ষক রেকর্ড সম্পূর্ণ মুছে ফেলুন"
            >
              <Trash2 size={14} className="text-rose-600 dark:text-rose-400" /> সকল শিক্ষক মুছুন
            </button>
          )}
          <button
            onClick={() => setShowAddTeacherModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <UserPlus size={15} /> নতুন শিক্ষক যোগ
          </button>
        </div>

        {/* Quick Stats Bar in Clean Interactive Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'মোট শিক্ষক', value: `${teachers.length} জন`, tab: 'teachers' as TeacherTab, isAlert: false },
            { label: 'বিষয় বণ্টিত', value: `${subjectAssignments.length}টি`, tab: 'assignments' as TeacherTab, isAlert: false },
            { label: 'শ্রেণি শিক্ষক', value: `${classTeachers.length} জন`, tab: 'class_teachers' as TeacherTab, isAlert: false },
            {
              label: 'ছুটির আবেদন',
              value: pendingLeavesCount > 0 ? `${pendingLeavesCount}টি বিবেচনাধীন` : `${leaveApplications.length}টি মোট`,
              tab: 'leave_applications' as TeacherTab,
              isAlert: pendingLeavesCount > 0,
            },
          ].map((stat, i) => (
            <div
              key={i}
              onClick={() => setActiveTab(stat.tab)}
              className={`p-3.5 rounded-2xl border shadow-xs text-center cursor-pointer transition hover:scale-[1.02] active:scale-95 ${
                stat.isAlert
                  ? 'bg-gradient-to-br from-amber-50 dark:from-amber-950/50 to-orange-50 dark:to-orange-950/40 border-amber-300 dark:border-amber-800/60 ring-2 ring-amber-400/20'
                  : activeTab === stat.tab
                  ? 'bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className={`text-xl sm:text-2xl font-black leading-none block ${stat.isAlert ? 'text-amber-700 dark:text-amber-300 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                {stat.value}
              </span>
              <p className={`text-[11px] font-bold mt-1 ${stat.isAlert ? 'text-amber-800 dark:text-amber-200' : 'text-slate-500 dark:text-slate-400'}`}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── ALERT ──────────────────────────────────────────────── */}
      {alertMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all duration-300 ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60 shadow-sm shadow-emerald-100'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60 shadow-sm shadow-rose-100'
          }`}
        >
          {alertMsg.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="ml-auto p-1 hover:bg-black/5 rounded-lg cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ─── TAB NAVIGATION ─────────────────────────────────────── */}
      <div className="bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-1.5 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {TAB_CONFIG.map((tab, i) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-2 text-xs font-bold whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-800 font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/60 border-transparent'
                }`}
              >
                {tab.icon}
                <span>
                  {i + 1}. {tab.label}
                </span>
                {tab.id === 'teachers' && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-300/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                    {teachers.length}
                  </span>
                )}
                {tab.id === 'assignments' && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-300/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                    {subjectAssignments.length}
                  </span>
                )}
                {tab.id === 'class_teachers' && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-300/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                    {classTeachers.length}
                  </span>
                )}
                {tab.id === 'leave_applications' && (
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                      pendingLeavesCount > 0
                        ? 'bg-amber-500 text-white animate-pulse shadow-xs'
                        : isActive
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-300/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {pendingLeavesCount > 0 ? `${pendingLeavesCount}টি বিবেচনাধীন` : `${leaveApplications.length}`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: শিক্ষক তালিকা */}
      {activeTab === 'teachers' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Users size={18} className="text-indigo-600 dark:text-indigo-400" />
                  শিক্ষক ও ক্রেডেনশিয়াল ব্যবস্থাপনা
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Username (Phone) ও Password এন্ট্রি, এডিট ও Reset পরিচালনা
                </p>
              </div>

              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="নাম, ফোন বা আইডি খুঁজুন..."
                  className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white w-full sm:w-64 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition"
                />
              </div>
            </div>
          </div>

          {teachers.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Users size={36} className="text-slate-300" />
              </div>
              <h4 className="font-bold text-slate-600 dark:text-slate-400 text-sm">কোনো শিক্ষক নিবন্ধিত নেই</h4>
              <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
                &ldquo;নতুন শিক্ষক যোগ&rdquo; বাটনে ক্লিক করে শিক্ষকের তথ্য, ফোন নম্বর ও পাসওয়ার্ড এন্ট্রি করুন।
              </p>
              <button
                onClick={() => setShowAddTeacherModal(true)}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-indigo-700 transition inline-flex items-center gap-1.5"
              >
                <UserPlus size={14} /> শিক্ষক যোগ করুন
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="px-4 py-3">আইডি</th>
                    <th className="px-4 py-3">শিক্ষকের নাম</th>
                    <th className="px-4 py-3">ইউজারনেম (ফোন)</th>
                    <th className="px-4 py-3">পদবী</th>
                    <th className="px-4 py-3 text-center">স্ট্যাটাস</th>
                    <th className="px-4 py-3 text-center">লগইন ফ্ল্যাগ</th>
                    <th className="px-4 py-3 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/70">
                  {filteredTeachers.map((t) => (
                    <tr key={t.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/50 transition-colors group">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md text-[10px]">
                          {t.id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{t.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{t.dob}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                          <Phone size={11} className="text-slate-400" /> {t.phone}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">{t.designation}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'active'
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {t.status === 'active' ? 'অ্যাক্টিভ' : 'নিষ্ক্রিয়'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {t.mustChangePassword ? (
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 font-bold text-[10px] rounded-full">
                            পরিবর্তন প্রয়োজন
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60 font-bold text-[10px] rounded-full">
                            ভেরিফায়েড
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setViewTeacherRecord(t);
                              setShowViewTeacherModal(true);
                            }}
                            className="p-1.5 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-lg transition cursor-pointer"
                            title="প্রোফাইল দেখুন"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setEditTeacherData({
                                id: t.id,
                                name: t.name,
                                phone: t.phone,
                                designation: t.designation,
                                dob: t.dob,
                                status: t.status || 'active',
                                password: '',
                              });
                              setShowEditTeacherModal(true);
                            }}
                            className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition cursor-pointer"
                            title="এডিট করুন"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setResetTeacherId(t.id);
                              setShowResetModal(true);
                            }}
                            className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition cursor-pointer"
                            title="পাসওয়ার্ড রিসেট"
                          >
                            <Key size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteTeacher(t.id, t.name)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredTeachers.length === 0 && searchQuery && (
                <div className="p-10 text-center text-slate-400">
                  <Search size={28} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold">&ldquo;{searchQuery}&rdquo; এর জন্য কোনো শিক্ষক পাওয়া যায়নি</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <TeacherAssignmentsTab
          teachers={teachers}
          subjectAssignments={subjectAssignments}
          assignTeacherId={assignTeacherId}
          setAssignTeacherId={setAssignTeacherId}
          assignClassId={assignClassId}
          setAssignClassId={setAssignClassId}
          assignGroup={assignGroup}
          setAssignGroup={setAssignGroup}
          assignSubjectId={assignSubjectId}
          setAssignSubjectId={setAssignSubjectId}
          isClass9or10={isClass9or10}
          availableSubjectsList={availableSubjectsList}
          onAssignSubject={handleAssignSubject}
          onAssignReligionTeacher={handleAssignReligionTeacher}
          onBulkAssignReligionTeacher={handleBulkAssignReligionTeacher}
          refreshAllData={refreshAllData}
        />
      )}

      {activeTab === 'class_teachers' && (
        <ClassTeacherTab
          teachers={teachers}
          classTeachers={classTeachers}
          ctClassId={ctClassId}
          setCtClassId={setCtClassId}
          ctTeacherId={ctTeacherId}
          setCtTeacherId={setCtTeacherId}
          onAssignClassTeacher={handleAssignClassTeacher}
          onRemoveClassTeacher={handleRemoveClassTeacher}
        />
      )}

      {activeTab === 'permission_test' && (
        <PermissionValidatorTab
          teachers={teachers}
          subjectAssignments={subjectAssignments}
          classTeachers={classTeachers}
          mounted={mounted}
        />
      )}

      {activeTab === 'leave_applications' && (
        <LeaveApplicationsTab
          leaveApplications={leaveApplications}
          filteredLeaves={filteredLeaves}
          leaveFilter={leaveFilter}
          setLeaveFilter={setLeaveFilter}
          pendingLeavesCount={pendingLeavesCount}
          approvedLeavesCount={approvedLeavesCount}
          rejectedLeavesCount={rejectedLeavesCount}
          onOpenReviewModal={handleOpenReviewModal}
          onPrintSlip={(l) => setPrintSlipLeave(l)}
        />
      )}

      {activeTab === 'audit_trail' && <AuditTrailTab auditLogsList={auditLogsList} />}

      <AddTeacherModal
        isOpen={showAddTeacherModal}
        onClose={() => setShowAddTeacherModal(false)}
        name={name}
        setName={setName}
        phone={phone}
        setPhone={setPhone}
        designation={designation}
        setDesignation={setDesignation}
        dob={dob}
        setDob={setDob}
        initialPassword={initialPassword}
        setInitialPassword={setInitialPassword}
        onSubmit={handleAddTeacher}
      />

      <ResetPasswordModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        onSubmit={handleResetPassword}
      />

      <EditTeacherModal
        isOpen={showEditTeacherModal}
        data={editTeacherData}
        setData={setEditTeacherData}
        onClose={() => setShowEditTeacherModal(false)}
        onSubmit={handleEditTeacher}
      />

      <ViewTeacherModal
        isOpen={showViewTeacherModal}
        teacher={viewTeacherRecord}
        subjectAssignments={subjectAssignments}
        classTeachers={classTeachers}
        onClose={() => setShowViewTeacherModal(false)}
      />

      <LeaveReviewModal
        leave={selectedLeaveForReview}
        reviewDecision={reviewDecision}
        setReviewDecision={setReviewDecision}
        reviewRemarks={reviewRemarks}
        setReviewRemarks={setReviewRemarks}
        onClose={() => setSelectedLeaveForReview(null)}
        onConfirm={handleConfirmReview}
      />

      <PrintLeaveSlipModal leave={printSlipLeave} onClose={() => setPrintSlipLeave(null)} />
    </div>
  );
}

export default function TeacherManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full py-16" suppressHydrationWarning>
          <div className="animate-pulse space-y-6">
            <div className="h-28 bg-gradient-to-r from-slate-200 dark:from-slate-800 via-slate-100 dark:via-slate-800 to-slate-200 dark:to-slate-800 rounded-3xl" />
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-11 w-40 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              ))}
            </div>
            <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
          </div>
        </div>
      }
    >
      <TeacherManagementContent />
    </Suspense>
  );
}
