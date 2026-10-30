'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import {
  Users,
  UserPlus,
  Key,
  ShieldCheck,
  Lock,
  BookOpen,
  School,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Save,
  Search,
  UserCheck,
  Phone,
  Eye,
  EyeOff,
  Pencil,
  X,
  Calendar,
  Briefcase,
  ClipboardCheck,
  Filter,
  Award,
  Hash,
  Sparkles,
  LayoutGrid,
  ChevronDown,
  GraduationCap,
  Send,
  Clock,
  Check,
  FileText,
  ShieldAlert,
  Printer
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import { teacherRBACService, TeacherRecord, SubjectAssignment, ClassTeacherAssignment } from '@/services/teacherRBACService';
import { leaveService, LeaveApplication, LEAVE_TYPE_LABELS } from '@/services/leaveService';
import { auditTrailService } from '@/services/auditTrailService';
import { getSubjectReligion } from '@/lib/religionUtils';

// ─── DYNAMIC SUBJECTS HELPER ──────────────────────────────────────────
const getDynamicConfiguredSubjects = (gradeStr: string, group: string = 'all', isMounted: boolean = false) => {
  // Convert Bengali digits to ASCII before parsing (৬→6, ৭→7, ৮→8, ৯→9, ১০→10)
  const toBnAscii = (s: string) => s.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
  const normalized = toBnAscii(gradeStr);
  const gradeNum = parseInt(normalized.replace(/\D/g, '')) || 8;
  let classSubjects: any[] = [];

  if (isMounted && typeof window !== 'undefined') {
    const savedClasses = localStorage.getItem('sms_academic_classes');
    if (savedClasses) {
      try {
        const parsedClasses = JSON.parse(savedClasses);
        const targetClass = parsedClasses.find((c: any) => c.name.includes(gradeNum.toString()) || c.name.includes(gradeStr));
        if (targetClass && targetClass.subjects && targetClass.subjects.length > 0) {
          classSubjects = targetClass.subjects;
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  if (classSubjects.length === 0) {
    if (gradeNum >= 9) {
      classSubjects = [
        { code: 'BAN-101', name: 'বাংলা ১ম পত্র', category: 'আবশ্যিক' },
        { code: 'BAN-102', name: 'বাংলা ২য় পত্র', category: 'আবশ্যিক' },
        { code: 'ENG-107', name: 'ইংরেজি ১ম পত্র', category: 'আবশ্যিক' },
        { code: 'ENG-108', name: 'ইংরেজি ২য় পত্র', category: 'আবশ্যিক' },
        { code: 'MAT-109', name: 'সাধারণ গণিত', category: 'আবশ্যিক' },
        { code: 'ICT-154', name: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)', category: 'আবশ্যিক' },
        { code: 'REL-111', name: 'ইসলাম ও নৈতিক শিক্ষা', category: 'আবশ্যিক' },
        { code: 'REL-112', name: 'হিন্দুধর্ম ও নৈতিক শিক্ষা', category: 'আবশ্যিক' },
        { code: 'PHY-136', name: 'পদার্থবিজ্ঞান', category: 'বিজ্ঞান' },
        { code: 'CHE-137', name: 'রসায়ন', category: 'বিজ্ঞান' },
        { code: 'BIO-138', name: 'জীববিজ্ঞান', category: 'বিজ্ঞান' },
        { code: 'HMT-126', name: 'উচ্চতর গণিত', category: 'বিজ্ঞান' },
        { code: 'BGS-150', name: 'বাংলাদেশ ও বিশ্বপরিচয়', category: 'বিজ্ঞান' },
        { code: 'HIS-153', name: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', category: 'মানবিক' },
        { code: 'GEO-110', name: 'ভূগোল ও পরিবেশ', category: 'মানবিক' },
        { code: 'CIV-140', name: 'পৌরনীতি ও নাগরিকতা', category: 'মানবিক' },
        { code: 'ECO-141', name: 'অর্থনীতি', category: 'মানবিক' },
        { code: 'SCI-127', name: 'সাধারণ বিজ্ঞান', category: 'মানবিক' },
        { code: 'ACC-146', name: 'হিসাববিজ্ঞান', category: 'ব্যবসায় শিক্ষা' },
        { code: 'BUS-147', name: 'ব্যবসায় উদ্যোগ', category: 'ব্যবসায় শিক্ষা' },
        { code: 'FIN-152', name: 'ফিন্যান্স ও ব্যাংকিং', category: 'ব্যবসায় শিক্ষা' }
      ];
    } else {
      classSubjects = [
        { code: 'BAN-101', name: 'বাংলা ১ম পত্র', category: 'সাধারণ' },
        { code: 'BAN-102', name: 'বাংলা ২য় পত্র', category: 'সাধারণ' },
        { code: 'ENG-107', name: 'ইংরেজি ১ম পত্র', category: 'সাধারণ' },
        { code: 'ENG-108', name: 'ইংরেজি ২য় পত্র', category: 'সাধারণ' },
        { code: 'MAT-109', name: 'সাধারণ গণিত', category: 'সাধারণ' },
        { code: 'SCI-113', name: 'বিজ্ঞান', category: 'সাধারণ' },
        { code: 'ICT-154', name: 'ডিজিটাল প্রযুক্তি', category: 'সাধারণ' },
        { code: 'BGS-150', name: 'ইতিহাস ও সামাজিক বিজ্ঞান', category: 'সাধারণ' },
        { code: 'REL-111', name: 'ইসলাম ও নৈতিক শিক্ষা', category: 'সাধারণ' },
        { code: 'REL-112', name: 'হিন্দুধর্ম ও নৈতিক শিক্ষা', category: 'সাধারণ' },
        { code: 'AGR-139', name: 'কৃষি শিক্ষা', category: 'সাধারণ' },
        { code: 'HMS-140', name: 'গার্হস্থ্য বিজ্ঞান', category: 'সাধারণ' }
      ];
    }
  }

  if (gradeNum >= 9 && group !== 'all') {
    const groupNameBn = group === 'science' ? 'বিজ্ঞান' : group === 'humanities' ? 'মানবিক' : 'ব্যবসায় শিক্ষা';
    classSubjects = classSubjects.filter(s => {
      if (!s.category || s.category === 'আবশ্যিক' || s.category === 'সাধারণ') return true;
      return s.category.includes(groupNameBn) || groupNameBn.includes(s.category);
    });
  }

  return classSubjects;
};

// ─── TAB CONFIG ───────────────────────────────────────────────────────
type TeacherTab = 'teachers' | 'assignments' | 'class_teachers' | 'permission_test' | 'leave_applications' | 'audit_trail';

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
  const [photoUrl, setPhotoUrl] = useState('');
  const [initialPassword, setInitialPassword] = useState('123456');
  const [showInitialPwd, setShowInitialPwd] = useState(false);

  // ─── Modal: Password Reset
  const [resetTeacherId, setResetTeacherId] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showResetPwd, setShowResetPwd] = useState(false);

  // ─── Modal: View Teacher
  const [showViewTeacherModal, setShowViewTeacherModal] = useState(false);
  const [viewTeacherRecord, setViewTeacherRecord] = useState<TeacherRecord | null>(null);

  // ─── Modal: Edit Teacher
  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
  const [editTeacherData, setEditTeacherData] = useState<{
    id: string; name: string; phone: string; designation: string;
    dob: string; password?: string; status: 'active' | 'inactive';
  } | null>(null);
  const [showEditPwd, setShowEditPwd] = useState(false);

  // ─── Subject Assignment Form
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignClassId, setAssignClassId] = useState('8th');
  const [assignSubjectId, setAssignSubjectId] = useState('সাধারণ গণিত');
  const [assignGroup, setAssignGroup] = useState<'all' | 'science' | 'humanities' | 'commerce'>('science');

  // ─── Class Teacher Form
  const [ctClassId, setCtClassId] = useState('8th-A');
  const [ctTeacherId, setCtTeacherId] = useState('');

  // ─── Permission Test - SEPARATE states for each test (BUG FIX)
  const [testSubjectTeacherId, setTestSubjectTeacherId] = useState('');
  const [testSubjectClassId, setTestSubjectClassId] = useState('8th');
  const [testSubjectId, setTestSubjectId] = useState('সাধারণ গণিত');
  const [testObtainedMarks, setTestObtainedMarks] = useState(85);
  const [testFullMarks, setTestFullMarks] = useState(100);

  const [testAttendTeacherId, setTestAttendTeacherId] = useState('');
  const [testAttendClassId, setTestAttendClassId] = useState('8th-A');

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
      } catch (e) {}
    }
  }, []);

  // ─── Sync activeTab with URL search param '?tab='
  useEffect(() => {
    const tabParam = searchParams?.get('tab') as TeacherTab;
    if (tabParam && ['teachers', 'assignments', 'class_teachers', 'permission_test', 'leave_applications', 'audit_trail'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const pendingLeavesCount = useMemo(() => {
    return leaveApplications.filter(l => l.status === 'pending').length;
  }, [leaveApplications]);

  const approvedLeavesCount = useMemo(() => {
    return leaveApplications.filter(l => l.status === 'approved').length;
  }, [leaveApplications]);

  const rejectedLeavesCount = useMemo(() => {
    return leaveApplications.filter(l => l.status === 'rejected').length;
  }, [leaveApplications]);

  const filteredLeaves = useMemo(() => {
    if (leaveFilter === 'all') return leaveApplications;
    return leaveApplications.filter(l => l.status === leaveFilter);
  }, [leaveApplications, leaveFilter]);

  const handleOpenReviewModal = (leave: LeaveApplication, status: 'approved' | 'rejected') => {
    setSelectedLeaveForReview(leave);
    setReviewDecision(status);
    setReviewRemarks(status === 'approved' ? 'ছুটি মঞ্জুর করা হলো।' : 'প্রশাসনিক কারণে ছুটি মঞ্জুর করা সম্ভব হলো না।');
  };

  const handleConfirmReview = () => {
    if (!selectedLeaveForReview) return;
    const res = leaveService.reviewLeave(
      selectedLeaveForReview.id, 
      reviewDecision, 
      'প্রধান শিক্ষক', 
      reviewRemarks
    );
    if (res.success) {
      showAlert('success', res.message);
      setSelectedLeaveForReview(null);
      refreshAllData();
    } else {
      showAlert('error', res.message);
    }
  };

  const handleReviewLeave = (leaveId: string, status: 'approved' | 'rejected') => {
    const target = leaveApplications.find(l => l.id === leaveId);
    if (target) {
      handleOpenReviewModal(target, status);
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
    return teachers.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.phone.includes(q) ||
      t.id.toLowerCase().includes(q) ||
      t.designation.toLowerCase().includes(q)
    );
  }, [teachers, searchQuery]);

  // ─── ALERT
  const showAlert = useCallback((type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  }, []);

  // ─── HANDLERS
  const handleDeleteTeacher = (id: string, tName: string) => {
    if (confirm(`আপনি কি নিশ্চিতভাবে '${tName}' শিক্ষকের সকল তথ্য ও পারমিশন মুছে ফেলতে চান?`)) {
      const res = teacherRBACService.deleteTeacher(id);
      res.success ? showAlert('success', res.message) : showAlert('error', res.message);
      refreshAllData();
    }
  };

  const handleRemoveClassTeacher = (id: string, className: string) => {
    if (confirm(`আপনি কি '${className}' শ্রেণির শ্রেণি শিক্ষক নির্বাচন বাতিল করতে চান?`)) {
      const res = teacherRBACService.removeClassTeacher(id);
      res.success ? showAlert('success', res.message) : showAlert('error', res.message);
      refreshAllData();
    }
  };

  const handleClearAllTeachers = () => {
    if (teachers.length === 0) return;
    if (confirm('আপনি কি নিশ্চিত যে সকল শিক্ষকের তালিকা ও পারমিশন মুছে ফেলতে চান? এটি অপরিবর্তনীয়!')) {
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
    const res = await teacherRBACService.createTeacher({
      name: name.trim(), phone: phone.trim(), designation, dob,
      photoUrl: photoUrl.trim() || undefined, status: 'active',
      passwordHash: initialPassword.trim() || '123456'
    });
    if (res.success) {
      showAlert('success', res.message);
      setName(''); setPhone(''); setShowAddTeacherModal(false);
      refreshAllData();
    } else { showAlert('error', res.message); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTeacherId || !newPassword.trim()) return;
    const res = await teacherRBACService.resetPassword(resetTeacherId, newPassword.trim());
    if (res.success) {
      showAlert('success', res.message);
      setShowResetModal(false); setNewPassword('123456');
      refreshAllData();
    } else { showAlert('error', res.message); }
  };

  const handleEditTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeacherData || !editTeacherData.name.trim() || !editTeacherData.phone.trim()) {
      return showAlert('error', 'নাম এবং ফোন নম্বর প্রদান করুন!');
    }
    const res = teacherRBACService.updateTeacher(editTeacherData.id, {
      name: editTeacherData.name.trim(), phone: editTeacherData.phone.trim(),
      designation: editTeacherData.designation, dob: editTeacherData.dob,
      password: editTeacherData.password?.trim() || undefined, status: editTeacherData.status
    });
    if (res.success) {
      showAlert('success', res.message);
      setShowEditTeacherModal(false); setEditTeacherData(null);
      refreshAllData();
    } else { showAlert('error', res.message); }
  };

  const handleAssignSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTeacherId) return showAlert('error', 'শিক্ষক নির্বাচন করুন!');
    const res = teacherRBACService.assignSubject(assignTeacherId, assignClassId, assignSubjectId, 2026);
    res.success ? showAlert('success', res.message) : showAlert('error', res.message);
    refreshAllData();
  };

  const handleAssignReligionTeacher = (classId: string, subjectName: string, teacherId: string) => {
    const classLabel = classId === '6th' ? '৬ষ্ঠ শ্রেণি' : classId === '7th' ? '৭ম শ্রেণি' : classId === '8th' ? '৮ম শ্রেণি' : classId === '9th' ? '৯ম শ্রেণি' : '১০ম শ্রেণি';
    if (!teacherId) {
      const existing = subjectAssignments.filter(a => 
        a.classId === classId && 
        (a.subjectId === subjectName || a.subjectId.includes(subjectName) || subjectName.includes(a.subjectId))
      );
      existing.forEach(a => teacherRBACService.removeSubjectAssignment(a.id));
      refreshAllData();
      showAlert('success', `${classLabel}তে ${subjectName} শিক্ষক বরাদ্দ বাতিল করা হয়েছে!`);
      return;
    }

    const existing = subjectAssignments.filter(a => 
      a.classId === classId && 
      (a.subjectId === subjectName || a.subjectId.includes(subjectName) || subjectName.includes(a.subjectId))
    );
    existing.forEach(a => teacherRBACService.removeSubjectAssignment(a.id));

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
    ['6th', '7th', '8th', '9th', '10th'].forEach(cls => {
      const existing = subjectAssignments.filter(a => 
        a.classId === cls && 
        (a.subjectId === subjectName || a.subjectId.includes(subjectName) || subjectName.includes(a.subjectId))
      );
      existing.forEach(a => teacherRBACService.removeSubjectAssignment(a.id));
      const res = teacherRBACService.assignSubject(teacherId, cls, subjectName, 2026);
      if (res.success) count++;
    });
    refreshAllData();
    showAlert('success', `সকল শ্রেণিতে (৬ষ্ঠ-১০ম) ${subjectName} শিক্ষক নির্ধারণ সম্পন্ন (${count}টি শ্রেণি)!`);
  };

  // ─── 9-10 Common/আবশ্যিক Subject Quick Assign Handler
  const handleAssignCommonSubject = (classId: string, subjectName: string, teacherId: string) => {
    const classLabel = classId === '9th' ? '৯ম শ্রেণি' : '১০ম শ্রেণি';
    if (!teacherId) {
      const existing = subjectAssignments.filter(a =>
        a.classId === classId && a.subjectId === subjectName
      );
      existing.forEach(a => teacherRBACService.removeSubjectAssignment(a.id));
      refreshAllData();
      showAlert('success', `${classLabel}তে "${subjectName}" শিক্ষক বরাদ্দ বাতিল করা হয়েছে!`);
      return;
    }
    // Remove existing for this class+subject, then assign new
    const existing = subjectAssignments.filter(a =>
      a.classId === classId && a.subjectId === subjectName
    );
    existing.forEach(a => teacherRBACService.removeSubjectAssignment(a.id));
    const res = teacherRBACService.assignSubject(teacherId, classId, subjectName, 2026);
    if (res.success) {
      refreshAllData();
      showAlert('success', `${classLabel}তে "${subjectName}" শিক্ষক সফলভাবে নির্ধারিত হয়েছে!`);
    } else {
      showAlert('error', res.message);
    }
  };

  const handleBulkAssignCommonSubjects = (teacherId: string, subjectName: string) => {
    if (!teacherId) {
      showAlert('error', 'অনুগ্রহ করে প্রথমে একজন শিক্ষক নির্বাচন করুন!');
      return;
    }
    let count = 0;
    ['9th', '10th'].forEach(cls => {
      const existing = subjectAssignments.filter(a =>
        a.classId === cls && a.subjectId === subjectName
      );
      existing.forEach(a => teacherRBACService.removeSubjectAssignment(a.id));
      const res = teacherRBACService.assignSubject(teacherId, cls, subjectName, 2026);
      if (res.success) count++;
    });
    refreshAllData();
    showAlert('success', `৯ম ও ১০ম উভয় শ্রেণিতে "${subjectName}" শিক্ষক নির্ধারিত হয়েছে (${count}টি শ্রেণি)!`);
  };

  const handleAssignClassTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctTeacherId) return showAlert('error', 'শিক্ষক নির্বাচন করুন!');
    const res = teacherRBACService.assignClassTeacher(ctTeacherId, ctClassId, 2026);
    res.success ? showAlert('success', res.message) : showAlert('error', res.message);
    refreshAllData();
  };

  // ─── LOADING STATE
  if (!mounted) return (
    <div className="w-full py-16" suppressHydrationWarning>
      <div className="animate-pulse space-y-6">
        <div className="h-28 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-3xl" />
        <div className="flex gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-11 w-40 bg-slate-200 rounded-2xl" />)}
        </div>
        <div className="h-96 bg-slate-100 rounded-3xl" />
      </div>
    </div>
  );

  // 🛑 RBAC Access Guard: Only Admin / Principal can access Teacher & Staff Management
  if (session && session.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-5 shadow-sm" suppressHydrationWarning>
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/70 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">অনুমতি নেই (Access Restricted)</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            সহকারী শিক্ষকগণ শিক্ষক ও স্টাফ ব্যবস্থাপনায় অ্যাক্সেস করতে পারবেন না। আপনি শুধুমাত্র আপনার বরাদ্দকৃত বিষয় ও অন্যান্য তথ্য দেখতে এবং নির্ধারিত বিষয়ে নম্বর এন্ট্রি করতে পারবেন।
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <Link
            href="/dashboard/teacher-portal"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition shadow-sm"
          >
            আমার শিক্ষক ড্যাশবোর্ডে যান
          </Link>
          <Link
            href="/dashboard/exam/mark-entry"
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-black transition border border-slate-200 dark:border-slate-700"
          >
            নম্বর এন্ট্রি প্যানেল
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 pb-16 font-sans text-slate-900" suppressHydrationWarning>

      {/* TOP ACTIONS & STATS ROW (Clean & Compact) */}
      <div className="space-y-4 print:hidden">
        <div className="flex justify-end items-center gap-2">
          {teachers.length > 0 && (
            <button
              onClick={handleClearAllTeachers}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="সকল শিক্ষক রেকর্ড সম্পূর্ণ মুছে ফেলুন"
            >
              <Trash2 size={14} className="text-rose-600" /> সকল শিক্ষক মুছুন
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
              isAlert: pendingLeavesCount > 0 
            },
          ].map((stat, i) => (
            <div
              key={i}
              onClick={() => setActiveTab(stat.tab)}
              className={`p-3.5 rounded-2xl border shadow-xs text-center cursor-pointer transition hover:scale-[1.02] active:scale-95 ${
                stat.isAlert
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 ring-2 ring-amber-400/20'
                  : activeTab === stat.tab
                  ? 'bg-slate-50 border-slate-300'
                  : 'bg-white border-slate-200'
              }`}
            >
              <span className={`text-xl sm:text-2xl font-black leading-none block ${stat.isAlert ? 'text-amber-700 animate-pulse' : 'text-slate-900'}`}>
                {stat.value}
              </span>
              <p className={`text-[11px] font-bold mt-1 ${stat.isAlert ? 'text-amber-800' : 'text-slate-500'}`}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── ALERT ──────────────────────────────────────────────── */}
      {alertMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all duration-300 ${
          alertMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-sm shadow-emerald-100'
            : 'bg-rose-50 text-rose-900 border border-rose-200 shadow-sm shadow-rose-100'
        }`}>
          {alertMsg.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <AlertTriangle size={18} className="text-rose-600 shrink-0" />}
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="ml-auto p-1 hover:bg-black/5 rounded-lg cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {/* ─── TAB NAVIGATION ─────────────────────────────────────── */}
      <div className="bg-slate-200/60 rounded-2xl border border-slate-200 p-1.5 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {TAB_CONFIG.map((tab, i) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-2 text-xs font-bold whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border-transparent'
                }`}
              >
                {tab.icon}
                <span>{i + 1}. {tab.label}</span>
                {tab.id === 'teachers' && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-300/80 text-slate-700'}`}>
                    {teachers.length}
                  </span>
                )}
                {tab.id === 'assignments' && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-300/80 text-slate-700'}`}>
                    {subjectAssignments.length}
                  </span>
                )}
                {tab.id === 'class_teachers' && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-300/80 text-slate-700'}`}>
                    {classTeachers.length}
                  </span>
                )}
                {tab.id === 'leave_applications' && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                    pendingLeavesCount > 0 
                      ? 'bg-amber-500 text-white animate-pulse shadow-xs' 
                      : isActive ? 'bg-slate-900 text-white' : 'bg-slate-300/80 text-slate-700'
                  }`}>
                    {pendingLeavesCount > 0 ? `${pendingLeavesCount}টি বিবেচনাধীন` : `${leaveApplications.length}`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 1: শিক্ষক তালিকা                                     */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'teachers' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Users size={18} className="text-indigo-600" />
                  শিক্ষক ও ক্রেডেনশিয়াল ব্যবস্থাপনা
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Username (Phone) ও Password এন্ট্রি, এডিট ও Reset পরিচালনা</p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="নাম, ফোন বা আইডি খুঁজুন..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 w-full sm:w-64 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition"
                />
              </div>
            </div>
          </div>

          {/* Table or Empty State */}
          {teachers.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-100 flex items-center justify-center">
                <Users size={36} className="text-slate-300" />
              </div>
              <h4 className="font-bold text-slate-600 text-sm">কোনো শিক্ষক নিবন্ধিত নেই</h4>
              <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
                &ldquo;নতুন শিক্ষক যোগ&rdquo; বাটনে ক্লিক করে শিক্ষকের তথ্য, ফোন নম্বর ও পাসওয়ার্ড এন্ট্রি করুন।
              </p>
              <button onClick={() => setShowAddTeacherModal(true)} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-indigo-700 transition inline-flex items-center gap-1.5">
                <UserPlus size={14} /> শিক্ষক যোগ করুন
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <th className="px-4 py-3">আইডি</th>
                    <th className="px-4 py-3">শিক্ষকের নাম</th>
                    <th className="px-4 py-3">ইউজারনেম (ফোন)</th>
                    <th className="px-4 py-3">পদবী</th>
                    <th className="px-4 py-3 text-center">স্ট্যাটাস</th>
                    <th className="px-4 py-3 text-center">লগইন ফ্ল্যাগ</th>
                    <th className="px-4 py-3 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTeachers.map((t) => (
                    <tr key={t.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-[10px]">{t.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{t.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{t.dob}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                          <Phone size={11} className="text-slate-400" /> {t.phone}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{t.designation}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {t.status === 'active' ? 'অ্যাক্টিভ' : 'নিষ্ক্রিয়'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {t.mustChangePassword ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px] rounded-full">
                            পরিবর্তন প্রয়োজন
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] rounded-full">
                            ভেরিফায়েড
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setViewTeacherRecord(t); setShowViewTeacherModal(true); }}
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer" title="প্রোফাইল দেখুন">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => {
                            setEditTeacherData({ id: t.id, name: t.name, phone: t.phone, designation: t.designation, dob: t.dob, status: t.status || 'active', password: t.passwordHash || '' });
                            setShowEditTeacherModal(true);
                          }}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer" title="এডিট করুন">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => { setResetTeacherId(t.id); setShowResetModal(true); }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer" title="পাসওয়ার্ড রিসেট">
                            <Key size={14} />
                          </button>
                          <button onClick={() => handleDeleteTeacher(t.id, t.name)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer" title="মুছে ফেলুন">
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

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 2: বিষয়ভিত্তিক বণ্টন                                 */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'assignments' && (
        <div className="space-y-5">

          {/* ── ধর্ম বিষয় বণ্টন প্যানেল (৬ষ্ঠ-১০ম প্রতি শ্রেণিতে আলাদা শিক্ষক সুবিধা) ── */}
          <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/40 rounded-3xl border border-amber-200/90 shadow-xs p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/70 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-black text-amber-950 text-base">ধর্ম বিষয় শিক্ষক বণ্টন প্যানেল (৬ষ্ঠ - ১০ম শ্রেণি)</h3>
                  <p className="text-xs text-amber-800 font-medium mt-0.5">
                    ৬ষ্ঠ থেকে ১০ম শ্রেণির ধর্ম বিষয় একজন শিক্ষককে না দিয়ে বিভিন্ন শিক্ষককে আলাদাভাবে বণ্টন করার পূর্ণ সুবিধা
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* ☪️ ISLAM & MORAL EDUCATION */}
              <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">☪️</span>
                    <div>
                      <h4 className="font-black text-emerald-950 text-sm">ইসলাম ও নৈতিক শিক্ষা</h4>
                      <p className="text-[11px] text-emerald-700 font-bold">শ্রেণিভিত্তিক আলাদা শিক্ষক নির্বাচন</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    আবশ্যিক বিষয়
                  </span>
                </div>

                {/* Class-wise Rows */}
                <div className="space-y-2.5">
                  {['6th', '7th', '8th', '9th', '10th'].map(cls => {
                    const currentAssignment = subjectAssignments.find(a => 
                      a.classId === cls && 
                      (a.subjectId === 'ইসলাম ও নৈতিক শিক্ষা' || a.subjectId.includes('ইসলাম'))
                    );
                    const currentTeacher = teachers.find(t => t.id === currentAssignment?.teacherId);

                    return (
                      <div key={cls} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-xl border border-emerald-100 transition">
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="w-20 px-2 py-1 bg-emerald-700 text-white rounded-lg text-xs font-black text-center shadow-xs">
                            {cls === '6th' ? '৬ষ্ঠ শ্রেণি' : cls === '7th' ? '৭ম শ্রেণি' : cls === '8th' ? '৮ম শ্রেণি' : cls === '9th' ? '৯ম শ্রেণি' : '১০ম শ্রেণি'}
                          </span>
                          {currentTeacher ? (
                            <span className="text-[11px] font-bold text-emerald-900 bg-emerald-100/90 px-2 py-0.5 rounded-md truncate max-w-[130px]" title={currentTeacher.name}>
                              ✓ {currentTeacher.name}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 italic">নির্ধারিত নেই</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-1 sm:justify-end">
                          <select
                            value={currentAssignment?.teacherId || ''}
                            onChange={(e) => handleAssignReligionTeacher(cls, 'ইসলাম ও নৈতিক শিক্ষা', e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-emerald-200 hover:border-emerald-400 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-900 outline-none cursor-pointer w-full sm:w-52 transition"
                          >
                            <option value="">-- শিক্ষক সিলেক্ট করুন --</option>
                            {teachers.filter(t => t.status === 'active').map(t => (
                              <option key={t.id} value={t.id}>{t.name} ({t.phone})</option>
                            ))}
                          </select>
                          {currentAssignment && (
                            <button
                              type="button"
                              onClick={() => handleAssignReligionTeacher(cls, 'ইসলাম ও নৈতিক শিক্ষা', '')}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                              title="শিক্ষক বাতিল করুন"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bulk Quick Fill */}
                <div className="pt-3 border-t border-emerald-100 flex flex-col sm:flex-row items-center gap-2 bg-emerald-50/60 p-3 rounded-xl">
                  <span className="text-[11px] font-extrabold text-emerald-900 shrink-0">⚡ সব শ্রেণিতে একই শিক্ষক:</span>
                  <select
                    id="bulk-islam-teacher"
                    className="px-2.5 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-900 outline-none flex-1 w-full sm:w-auto"
                  >
                    <option value="">-- শিক্ষক সিলেক্ট --</option>
                    {teachers.filter(t => t.status === 'active').map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.phone})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('bulk-islam-teacher') as HTMLSelectElement;
                      handleBulkAssignReligionTeacher('ইসলাম ও নৈতিক শিক্ষা', el?.value || '');
                    }}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shrink-0 transition cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    এক ক্লিকে দিন
                  </button>
                </div>
              </div>

              {/* 🕉️ HINDU RELIGION */}
              <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🕉️</span>
                    <div>
                      <h4 className="font-black text-amber-950 text-sm">হিন্দুধর্ম ও নৈতিক শিক্ষা</h4>
                      <p className="text-[11px] text-amber-700 font-bold">শ্রেণিভিত্তিক আলাদা শিক্ষক নির্বাচন</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    আবশ্যিক বিষয়
                  </span>
                </div>

                {/* Class-wise Rows */}
                <div className="space-y-2.5">
                  {['6th', '7th', '8th', '9th', '10th'].map(cls => {
                    const currentAssignment = subjectAssignments.find(a => 
                      a.classId === cls && 
                      (a.subjectId === 'হিন্দুধর্ম ও নৈতিক শিক্ষা' || a.subjectId.includes('হিন্দু'))
                    );
                    const currentTeacher = teachers.find(t => t.id === currentAssignment?.teacherId);

                    return (
                      <div key={cls} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-amber-50/40 hover:bg-amber-50/80 rounded-xl border border-amber-100 transition">
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="w-20 px-2 py-1 bg-amber-700 text-white rounded-lg text-xs font-black text-center shadow-xs">
                            {cls === '6th' ? '৬ষ্ঠ শ্রেণি' : cls === '7th' ? '৭ম শ্রেণি' : cls === '8th' ? '৮ম শ্রেণি' : cls === '9th' ? '৯ম শ্রেণি' : '১০ম শ্রেণি'}
                          </span>
                          {currentTeacher ? (
                            <span className="text-[11px] font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md truncate max-w-[130px]" title={currentTeacher.name}>
                              ✓ {currentTeacher.name}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 italic">নির্ধারিত নেই</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-1 sm:justify-end">
                          <select
                            value={currentAssignment?.teacherId || ''}
                            onChange={(e) => handleAssignReligionTeacher(cls, 'হিন্দুধর্ম ও নৈতিক শিক্ষা', e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-amber-200 hover:border-amber-400 focus:border-amber-600 rounded-xl text-xs font-bold text-slate-900 outline-none cursor-pointer w-full sm:w-52 transition"
                          >
                            <option value="">-- শিক্ষক সিলেক্ট করুন --</option>
                            {teachers.filter(t => t.status === 'active').map(t => (
                              <option key={t.id} value={t.id}>{t.name} ({t.phone})</option>
                            ))}
                          </select>
                          {currentAssignment && (
                            <button
                              type="button"
                              onClick={() => handleAssignReligionTeacher(cls, 'হিন্দুধর্ম ও নৈতিক শিক্ষা', '')}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                              title="শিক্ষক বাতিল করুন"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bulk Quick Fill */}
                <div className="pt-3 border-t border-amber-100 flex flex-col sm:flex-row items-center gap-2 bg-amber-50/60 p-3 rounded-xl">
                  <span className="text-[11px] font-extrabold text-amber-900 shrink-0">⚡ সব শ্রেণিতে একই শিক্ষক:</span>
                  <select
                    id="bulk-hindu-teacher"
                    className="px-2.5 py-1.5 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-900 outline-none flex-1 w-full sm:w-auto"
                  >
                    <option value="">-- শিক্ষক সিলেক্ট --</option>
                    {teachers.filter(t => t.status === 'active').map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.phone})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('bulk-hindu-teacher') as HTMLSelectElement;
                      handleBulkAssignReligionTeacher('হিন্দুধর্ম ও নৈতিক শিক্ষা', el?.value || '');
                    }}
                    className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-black shrink-0 transition cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    এক ক্লিকে দিন
                  </button>
                </div>
              </div>

            </div>
          </div>


          {/* Assignment Form */}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BookOpen size={18} className="text-violet-600" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">বিষয়ভিত্তিক ক্লাস বণ্টন (সকল বিষয়)</h3>
                <p className="text-[11px] text-slate-500 font-medium">শ্রেণিভিত্তিক বিষয়সমূহ থেকে শিক্ষক নির্বাচন করে এসাইন করুন</p>
              </div>
            </div>

            <form onSubmit={handleAssignSubject} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-xs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1.5 text-[11px]">শিক্ষক নির্বাচন *</label>
                  <select value={assignTeacherId} onChange={(e) => setAssignTeacherId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 cursor-pointer focus:border-indigo-500 transition">
                    <option value="">-- শিক্ষক সিলেক্ট --</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.phone})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1.5 text-[11px]">শ্রেণি (Class) *</label>
                  <select value={assignClassId} onChange={(e) => setAssignClassId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 cursor-pointer">
                    <option value="6th">৬ষ্ঠ শ্রেণি (6th)</option>
                    <option value="7th">৭ম শ্রেণি (7th)</option>
                    <option value="8th">৮ম শ্রেণি (8th)</option>
                    <option value="9th">৯ম শ্রেণি (9th)</option>
                    <option value="10th">১০ম শ্রেণি (10th)</option>
                  </select>
                </div>
                {isClass9or10 && (
                  <div>
                    <label className="block text-slate-700 mb-1.5 text-[11px]">বিভাগ (Group) *</label>
                    <select value={assignGroup} onChange={(e: any) => setAssignGroup(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 cursor-pointer">
                      <option value="science">🧪 বিজ্ঞান</option>
                      <option value="humanities">📖 মানবিক</option>
                      <option value="commerce">📊 ব্যবসায় শিক্ষা</option>
                      <option value="all">🌐 সকল বিষয়</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-slate-700 mb-1.5 text-[11px]">বিষয় (Subject) *</label>
                  <select value={assignSubjectId} onChange={(e) => setAssignSubjectId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 cursor-pointer">
                    {availableSubjectsList.map(sub => {
                      const subRel = getSubjectReligion(sub.name);
                      const relIcon = subRel === 'Muslim' ? '☪️ ' : subRel === 'Hindu' ? '🕉️ ' : subRel === 'Christian' ? '✝️ ' : subRel === 'Buddhist' ? '☸️ ' : '';
                      return (
                        <option key={sub.name} value={sub.name}>
                          {relIcon}{sub.name} ({sub.category || 'সাধারণ'})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition active:scale-95">
                  <Save size={14} /> বিষয় এসাইন করুন
                </button>
              </div>
            </form>
          </div>

          {/* Teacher-Wise Subject List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <LayoutGrid size={16} className="text-violet-600" />
                <h4 className="font-extrabold text-slate-900 text-sm">শিক্ষক অনুযায়ী বন্টিত বিষয়ের তালিকা</h4>
              </div>
              <span className="px-3 py-1 bg-violet-50 text-violet-800 rounded-xl font-bold text-[11px] border border-violet-200">
                মোট বণ্টন: <strong>{subjectAssignments.length}টি</strong>
              </span>
            </div>

            {subjectAssignments.length === 0 ? (
              <div className="p-14 text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-50 flex items-center justify-center"><BookOpen size={28} className="text-violet-300" /></div>
                <p className="text-xs text-slate-500 font-bold">কোনো বিষয়ে শিক্ষক এসাইন করা হয়নি</p>
                <p className="text-[11px] text-slate-400">ওপরের ফরম থেকে শিক্ষক ও বিষয় নির্বাচন করে এসাইন করুন</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teachers.map((t) => {
                  const teacherSubs = subjectAssignments.filter(sa => sa.teacherId === t.id);
                  if (teacherSubs.length === 0) return null;
                  return (
                    <div key={t.id} className="p-4 bg-slate-50/60 border border-slate-200 rounded-2xl space-y-3 hover:border-violet-200 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white font-black text-sm flex items-center justify-center shadow">{t.name.charAt(0)}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="font-black text-slate-900 text-sm">{t.name}</strong>
                              <span className="text-[10px] font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-200">{t.id}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">{t.designation} • {t.phone}</span>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold text-[11px] rounded-xl shrink-0 self-start sm:self-auto">
                          {teacherSubs.length}টি বিষয় দায়িত্বপ্রাপ্ত
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {teacherSubs.map((sa) => {
                          const subRel = getSubjectReligion(sa.subjectId);
                          const relBadge = subRel === 'Muslim'
                            ? <span className="ml-1 text-[8px] bg-emerald-100 text-emerald-700 px-1 rounded font-bold">☪️ ইসলাম</span>
                            : subRel === 'Hindu'
                            ? <span className="ml-1 text-[8px] bg-amber-100 text-amber-700 px-1 rounded font-bold">🕉️ হিন্দু</span>
                            : null;
                          return (
                          <div key={sa.id} className={`p-2.5 bg-white border rounded-xl flex items-center justify-between group hover:shadow-sm transition ${
                            subRel === 'Muslim' ? 'border-emerald-200' : subRel === 'Hindu' ? 'border-amber-200' : 'border-slate-200'
                          }`}>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[9px] font-bold rounded">{sa.classId}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{sa.academicYear}</span>
                              </div>
                              <div className="flex items-center flex-wrap mt-0.5">
                                <strong className="text-[11px] font-bold text-slate-800">{sa.subjectId}</strong>
                                {relBadge}
                              </div>
                            </div>
                            <button onClick={() => {
                              if (confirm(`${t.name}-এর ${sa.classId} (${sa.subjectId}) বণ্টন বাতিল?`)) {
                                teacherRBACService.removeSubjectAssignment(sa.id); refreshAllData();
                              }
                            }} className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer opacity-0 group-hover:opacity-100">
                              <X size={13} />
                            </button>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 3: শ্রেণি শিক্ষক                                     */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'class_teachers' && (
        <div className="space-y-5">
          {/* Assignment Form */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <School size={18} className="text-teal-600" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">শ্রেণি শিক্ষক নির্বাচন</h3>
                <p className="text-[11px] text-slate-500 font-medium">প্রতিটি শ্রেণিতে একজন মাত্র শ্রেণি শিক্ষক (UNIQUE constraint)</p>
              </div>
            </div>

            <form onSubmit={handleAssignClassTeacher} className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1.5 text-[11px]">শ্রেণি ও শাখা *</label>
                <select value={ctClassId} onChange={(e) => setCtClassId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 cursor-pointer">
                  <option value="6th-A">৬ষ্ঠ শ্রেণি - শাখা A</option>
                  <option value="7th-A">৭ম শ্রেণি - শাখা A</option>
                  <option value="8th-A">৮ম শ্রেণি - শাখা A</option>
                  <option value="9th-A">৯ম শ্রেণি - শাখা A</option>
                  <option value="10th-A">১০ম শ্রেণি - শাখা A</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 mb-1.5 text-[11px]">শ্রেণি শিক্ষক নির্বাচন *</label>
                <select value={ctTeacherId} onChange={(e) => setCtTeacherId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 cursor-pointer">
                  <option value="">-- শিক্ষক সিলেক্ট --</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.designation})</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95">
                  <UserCheck size={14} /> শ্রেণি শিক্ষক নির্ধারণ
                </button>
              </div>
            </form>
          </div>

          {/* Class Teacher Cards */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Award size={14} className="text-indigo-600" />
              মনোনীত শ্রেণি শিক্ষক তালিকা
            </h4>

            {classTeachers.length === 0 ? (
              <div className="p-14 text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center"><School size={28} className="text-indigo-300" /></div>
                <p className="text-xs text-slate-500 font-bold">কোনো শ্রেণি শিক্ষক নির্বাচন করা হয়নি</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {classTeachers.map((ct) => {
                  const tch = teachers.find(t => t.id === ct.teacherId);
                  return (
                    <div key={ct.id} className="p-4 bg-white border border-slate-200/80 rounded-2xl space-y-3 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-black text-slate-900">{ct.classId}</span>
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full">শ্রেণি শিক্ষক</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-sm">
                          {tch?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <strong className="text-slate-900 font-bold text-xs block">{tch?.name || ct.teacherId}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">{tch?.phone || ''}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-500 font-medium">শিক্ষাবর্ষ: {ct.academicYear}</span>
                        <button onClick={() => handleRemoveClassTeacher(ct.id, ct.classId)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer" title="বাতিল করুন">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 4: পারমিশন ভ্যালিডেটর                                 */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'permission_test' && (
        <div className="space-y-5">
          {/* Info Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-5 rounded-3xl shadow-xl border border-emerald-500/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-400/20">
                <ShieldCheck size={20} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-black">ব্যাকএন্ড ওনারশিপ অথরাইজেশন সিমুলেটর</h3>
                <p className="text-[11px] text-emerald-200/70 font-medium mt-1">
                  JWT token থেকে extracted teacher_id দিয়ে ডাটাবেজ টেবিলে রিয়েল-টাইম ভ্যালিডেশন টেস্ট করুন।
                  <span className="text-amber-300 font-bold block mt-0.5">⚡ Tab ২ ও Tab ৩ এ এসাইনকৃত ডাটার সাথে যাচাই হয়।</span>
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Users size={18} className="text-indigo-600" />, label: 'মোট শিক্ষক', value: teachers.length, iconBg: 'bg-indigo-50 border-indigo-100' },
              { icon: <BookOpen size={18} className="text-blue-600" />, label: 'বিষয় বণ্টন', value: subjectAssignments.length, iconBg: 'bg-blue-50 border-blue-100' },
              { icon: <School size={18} className="text-emerald-600" />, label: 'শ্রেণি শিক্ষক', value: classTeachers.length, iconBg: 'bg-emerald-50 border-emerald-100' },
            ].map((s, i) => (
              <div key={i} className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-xl ${s.iconBg} border flex items-center justify-center shrink-0`}>
                  {s.icon}
                </div>
                <div>
                  <span className="text-2xl font-black text-slate-900 tracking-tight block leading-none">{s.value}</span>
                  <p className="text-xs font-semibold text-slate-500 mt-1">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Two Test Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Test 1: Subject Mark Entry */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3 text-xs font-bold">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                <ClipboardCheck size={16} className="text-indigo-600" />
                ১. নম্বর এন্ট্রি ওনারশিপ টেস্ট
              </h4>
              <p className="text-[10px] text-slate-500 font-medium !mt-1">Tab ২ তে এসাইনকৃত শ্রেণি ও বিষয়ের সাথে যাচাই</p>

              <div>
                <label className="block text-slate-600 mb-1">লগইনকৃত শিক্ষক *</label>
                <select value={testSubjectTeacherId} onChange={(e) => setTestSubjectTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 cursor-pointer">
                  <option value="">-- শিক্ষক নির্বাচন --</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.id})</option>)}
                </select>
              </div>

              {/* Show assigned subjects */}
              {testSubjectTeacherId && (() => {
                const myAssignments = subjectAssignments.filter(sa => sa.teacherId === testSubjectTeacherId);
                return myAssignments.length > 0 ? (
                  <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <p className="text-[10px] text-indigo-700 font-bold mb-1.5">📋 এসাইনকৃত বিষয়সমূহ:</p>
                    <div className="flex flex-wrap gap-1">
                      {myAssignments.map(sa => (
                        <span key={sa.id} className="px-1.5 py-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded">{sa.classId} → {sa.subjectId}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-800">
                    ⚠️ কোনো বিষয়ে এসাইন করা হয়নি। Tab ২ থেকে এসাইন করুন।
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">শ্রেণি</label>
                  <select value={testSubjectClassId} onChange={(e) => setTestSubjectClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold cursor-pointer">
                    {['6th','7th','8th','9th','10th'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">বিষয়</label>
                  <select value={testSubjectId} onChange={(e) => setTestSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold cursor-pointer">
                    {getDynamicConfiguredSubjects(testSubjectClassId, 'all', mounted).map(sub => (
                      <option key={sub.name} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">প্রাপ্ত নম্বর</label>
                  <input type="number" value={testObtainedMarks} onChange={(e) => setTestObtainedMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold" />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">মোট নম্বর</label>
                  <input type="number" value={testFullMarks} onChange={(e) => setTestFullMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold" />
                </div>
              </div>

              {/* Result */}
              <div className="pt-1">
                {(() => {
                  if (!testSubjectTeacherId) return <div className="p-3 bg-slate-100 text-slate-500 rounded-xl text-center text-[11px]">শিক্ষক নির্বাচন করুন</div>;
                  const isOwner = teacherRBACService.validateSubjectOwnership(testSubjectTeacherId, testSubjectClassId, testSubjectId, 2026);
                  const markVal = teacherRBACService.validateMarkPayload({
                    studentId: 'ST-001', classId: testSubjectClassId, subjectId: testSubjectId, examId: 'EX-1',
                    obtainedMarks: testObtainedMarks, fullMarks: testFullMarks, academicYear: 2026, enteredBy: testSubjectTeacherId
                  });
                  if (!isOwner) return (
                    <div className="p-3 bg-rose-50 text-rose-900 border border-rose-200 rounded-xl space-y-1">
                      <strong className="text-rose-700 flex items-center gap-1 text-[11px]"><Lock size={13} /> 403 FORBIDDEN</strong>
                      <p className="text-[10px]">এই শিক্ষককে {testSubjectClassId} শ্রেণিতে &ldquo;{testSubjectId}&rdquo; বিষয়ে এসাইন করা হয়নি!</p>
                    </div>
                  );
                  if (!markVal.valid) return (
                    <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl space-y-1">
                      <strong className="text-amber-700 flex items-center gap-1 text-[11px]"><AlertTriangle size={13} /> INVALID INPUT</strong>
                      <p className="text-[10px]">{markVal.error}</p>
                    </div>
                  );
                  return (
                    <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl space-y-1">
                      <strong className="text-emerald-700 flex items-center gap-1 text-[11px]"><CheckCircle2 size={13} /> 200 AUTHORIZED</strong>
                      <p className="text-[10px]">ওনারশিপ ভ্যালিডেশন সফল! entered_by={testSubjectTeacherId}</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Test 2: Attendance Ownership */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3 text-xs font-bold">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                <GraduationCap size={16} className="text-teal-600" />
                ২. হাজিরা ওনারশিপ টেস্ট
              </h4>
              <p className="text-[10px] text-slate-500 font-medium !mt-1">Tab ৩ তে নির্বাচিত শ্রেণি শিক্ষকের সাথে যাচাই</p>

              <div>
                <label className="block text-slate-600 mb-1">লগইনকৃত শিক্ষক *</label>
                <select value={testAttendTeacherId} onChange={(e) => setTestAttendTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 cursor-pointer">
                  <option value="">-- শিক্ষক নির্বাচন --</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.id})</option>)}
                </select>
              </div>

              {/* Show class teacher assignments for selected teacher */}
              {testAttendTeacherId && (() => {
                const myClasses = classTeachers.filter(ct => ct.teacherId === testAttendTeacherId);
                return myClasses.length > 0 ? (
                  <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl">
                    <p className="text-[10px] text-teal-700 font-bold mb-1.5">👑 শ্রেণি শিক্ষক হিসেবে নির্বাচিত:</p>
                    <div className="flex flex-wrap gap-1">
                      {myClasses.map(ct => (
                        <span key={ct.id} className="px-2 py-0.5 bg-teal-600 text-white text-[9px] font-bold rounded">{ct.classId}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-800">
                    ⚠️ কোনো শ্রেণির শ্রেণি শিক্ষক হিসেবে নির্বাচিত নন। Tab ৩ থেকে নির্বাচন করুন।
                  </div>
                );
              })()}

              <div>
                <label className="block text-slate-600 mb-1">হাজিরা গ্রহণের শ্রেণি</label>
                <select value={testAttendClassId} onChange={(e) => setTestAttendClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold cursor-pointer">
                  <option value="6th-A">৬ষ্ঠ শ্রেণি - শাখা A</option>
                  <option value="7th-A">৭ম শ্রেণি - শাখা A</option>
                  <option value="8th-A">৮ম শ্রেণি - শাখা A</option>
                  <option value="9th-A">৯ম শ্রেণি - শাখা A</option>
                  <option value="10th-A">১০ম শ্রেণি - শাখা A</option>
                </select>
              </div>

              {/* Result */}
              <div className="pt-1">
                {(() => {
                  if (!testAttendTeacherId) return <div className="p-3 bg-slate-100 text-slate-500 rounded-xl text-center text-[11px]">শিক্ষক নির্বাচন করুন</div>;
                  const isClassTeacher = teacherRBACService.validateClassTeacherOwnership(testAttendTeacherId, testAttendClassId, 2026);
                  if (!isClassTeacher) return (
                    <div className="p-3 bg-rose-50 text-rose-900 border border-rose-200 rounded-xl space-y-1">
                      <strong className="text-rose-700 flex items-center gap-1 text-[11px]"><Lock size={13} /> 403 FORBIDDEN</strong>
                      <p className="text-[10px]">শিক্ষক {testAttendTeacherId} উক্ত {testAttendClassId} শ্রেণির &ldquo;Class Teacher&rdquo; নন!</p>
                    </div>
                  );
                  return (
                    <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl space-y-1">
                      <strong className="text-emerald-700 flex items-center gap-1 text-[11px]"><CheckCircle2 size={13} /> 200 AUTHORIZED</strong>
                      <p className="text-[10px]">শ্রেণি শিক্ষক ভ্যালিডেশন সফল! marked_by={testAttendTeacherId}</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 5: ছুটির আবেদনসমূহ (LEAVE APPLICATIONS REVIEW)       */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'leave_applications' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-5 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Send size={18} className="text-amber-600" />
                শিক্ষকদের ছুটির আবেদনসমূহ (প্রধান শিক্ষক পর্যালোচনা ও অনুমোদন)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                সহকারী ও শ্রেণি শিক্ষকদের দাখিলকৃত নৈমিত্তিক ও চিকিৎসা ছুটির আবেদন পর্যালোচনা, সিদ্ধান্ত ও প্রত্যয়ন
              </p>
            </div>
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto bg-slate-100 p-1 rounded-2xl">
              {[
                { id: 'all' as const, label: 'সব আবেদন', count: leaveApplications.length, color: 'text-slate-700' },
                { id: 'pending' as const, label: 'বিবেচনাধীন', count: pendingLeavesCount, color: 'text-amber-700' },
                { id: 'approved' as const, label: 'মঞ্জুরকৃত', count: approvedLeavesCount, color: 'text-emerald-700' },
                { id: 'rejected' as const, label: 'বাতিলকৃত', count: rejectedLeavesCount, color: 'text-rose-700' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setLeaveFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    leaveFilter === f.id
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    f.id === 'pending' && f.count > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {filteredLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-100 flex items-center justify-center shadow-sm">
                <Send size={36} className="text-amber-400 stroke-1" />
              </div>
              {leaveApplications.length === 0 ? (
                <>
                  <div>
                    <p className="text-base font-black text-slate-700">কোনো ছুটির আবেদন নেই</p>
                    <p className="text-xs text-slate-400 font-medium mt-1 max-w-xs mx-auto">
                      শিক্ষকরা ছুটির আবেদন জমা দিলে এখানে তালিকা প্রদর্শিত হবে।
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-xs text-slate-500 font-medium max-w-sm">
                    💡 শিক্ষক তালিকা থেকে যেকোনো শিক্ষকের প্রোফাইলে গিয়ে ছুটির আবেদন করা যাবে।
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-base font-black text-slate-700">এই ফিল্টারে কোনো আবেদন নেই</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      অন্য ফিল্টার নির্বাচন করুন অথবা &quot;সব আবেদন&quot; দেখুন।
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLeaves.map(l => (
                <div key={l.id} className="border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 hover:border-amber-300 transition shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                        {l.teacherName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{l.teacherName}</span>
                          <span className="text-[11px] font-bold text-slate-500">({l.designation})</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{l.teacherId}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs font-bold text-amber-800">{LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType}</p>
                          <span className="text-[10px] text-slate-400">• আবেদন: {new Date(l.appliedAt).toLocaleDateString('bn-BD')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className={`text-[11px] font-black px-3 py-1 rounded-full ${
                        l.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        l.status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 
                        'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                      }`}>
                        {l.status === 'approved' ? '✓ মঞ্জুরকৃত' : l.status === 'rejected' ? '✕ বাতিলকৃত' : '⏳ বিবেচনাধীন (Pending)'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl text-xs text-slate-700 font-medium border border-slate-100">
                    <span className="font-bold text-slate-900 block mb-1">ছুটির কারণ ও বিবরণ:</span>
                    {l.reason}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 font-bold pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-indigo-600 shrink-0" />
                      <span>ছুটির মেয়াদ: <strong>{l.startDate}</strong> হতে <strong>{l.endDate}</strong> পর্যন্ত (মোট <strong>{l.totalDays}</strong> দিন)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {l.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(l, 'rejected')}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black transition cursor-pointer active:scale-95"
                          >
                            ✕ বিবেচনা বাতিল
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(l, 'approved')}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer flex items-center gap-1 active:scale-95"
                          >
                            <Check size={13} />
                            ✓ পর্যালোচনা ও মঞ্জুর
                          </button>
                        </>
                      ) : (
                        <>
                          {l.status === 'approved' && (
                            <button
                              type="button"
                              onClick={() => setPrintSlipLeave(l)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                            >
                              <Printer size={13} />
                              ছুটি মঞ্জুরিপত্র প্রিন্ট
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(l, l.status === 'approved' ? 'rejected' : 'approved')}
                            className="px-2.5 py-1.5 text-slate-400 hover:text-slate-700 text-[11px] font-bold rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          >
                            পুনর্বিবেচনা
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {l.remarks && (
                    <div className={`p-3 rounded-xl text-xs font-bold border ${
                      l.status === 'approved' 
                        ? 'bg-emerald-50/80 text-emerald-950 border-emerald-200' 
                        : 'bg-rose-50/80 text-rose-950 border-rose-200'
                    }`}>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold mb-0.5">
                        <CheckCircle2 size={13} className={l.status === 'approved' ? 'text-emerald-600' : 'text-rose-600'} />
                        <span>সিদ্ধান্ত প্রদানকারী ({l.reviewedBy || 'প্রধান শিক্ষক'}):</span>
                        {l.reviewedAt && <span>{new Date(l.reviewedAt).toLocaleDateString('bn-BD')}</span>}
                      </div>
                      <p className="font-semibold text-slate-800">{l.remarks}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 6: অডিট ট্রেইল ও সিকিউরিটি লগ (AUDIT TRAIL LOGS)       */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'audit_trail' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Clock size={18} className="text-indigo-600" />
                সিস্টেম অডিট ট্রেইল ও সিকিউরিটি লগ
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                উপস্থিতি, নম্বর এন্ট্রি, প্রোফাইল এডিট, ছুটি ও পারমিশন পরিবর্তনের পূর্ণাঙ্গ লগ হিস্ট্রি
              </p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-800 rounded-xl text-xs font-black self-start sm:self-auto">
              মোট রেকর্ড: {auditLogsList.length}টি
            </span>
          </div>

          {auditLogsList.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 font-bold">
              বর্তমানে কোনো অডিট লগ নেই।
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {auditLogsList.map((log, idx) => (
                <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-xs px-2 py-0.5 bg-slate-100 rounded-md font-mono">
                        {log.action}
                      </span>
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {log.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        সম্পাদনকারী: <strong className="text-slate-700">{log.performedBy}</strong>
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-[11px]">{log.details}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-bold block">
                      {new Date(log.timestamp).toLocaleDateString('bn-BD')} {new Date(log.timestamp).toLocaleTimeString('bn-BD')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL 1: নতুন শিক্ষক যোগ                                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddTeacherModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center"><UserPlus size={16} className="text-indigo-600" /></div>
                নতুন শিক্ষক এন্ট্রি
              </h3>
              <button onClick={() => setShowAddTeacherModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer"><X size={16} className="text-slate-400" /></button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">শিক্ষকের নাম *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: মোঃ আব্দুর রহিম"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition" />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">ফোন নম্বর (ইউজারনেম) *</label>
                <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="যেমন: 01812345671"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1">পদবী</label>
                  <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900" />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">জন্ম তারিখ</label>
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 mb-1">প্রাথমিক পাসওয়ার্ড</label>
                <div className="relative">
                  <input type={showInitialPwd ? 'text' : 'password'} value={initialPassword} onChange={(e) => setInitialPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 font-mono pr-10" />
                  <button type="button" onClick={() => setShowInitialPwd(!showInitialPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    {showInitialPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <span className="text-[10px] text-amber-600 font-medium block mt-1">⚠️ প্রথম লগইনে পাসওয়ার্ড পরিবর্তন বাধ্যতামূলক হবে</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowAddTeacherModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer hover:bg-slate-200 transition">বাতিল</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow cursor-pointer transition active:scale-95">সংরক্ষণ করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL 2: পাসওয়ার্ড রিসেট                                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowResetModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center"><Key size={16} className="text-indigo-600" /></div>
                পাসওয়ার্ড রিসেট
              </h3>
              <button onClick={() => setShowResetModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer"><X size={16} className="text-slate-400" /></button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">নতুন পাসওয়ার্ড *</label>
                <div className="relative">
                  <input type={showResetPwd ? 'text' : 'password'} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="নতুন পাসওয়ার্ড"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 font-mono pr-10" />
                  <button type="button" onClick={() => setShowResetPwd(!showResetPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    {showResetPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px]">
                ⚠️ রিসেট করলে <code className="bg-amber-100 px-1 rounded">must_change_password</code> ফ্ল্যাগ পুনরায় সক্রিয় হবে।
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowResetModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer">বাতিল</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow cursor-pointer transition">পাসওয়ার্ড আপডেট</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL 3: শিক্ষকের তথ্য এডিট                               */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showEditTeacherModal && editTeacherData && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditTeacherModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center"><Pencil size={16} className="text-amber-600" /></div>
                শিক্ষকের তথ্য এডিট
              </h3>
              <button onClick={() => setShowEditTeacherModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer"><X size={16} className="text-slate-400" /></button>
            </div>

            <form onSubmit={handleEditTeacher} className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-slate-500 mb-1">আইডি</label>
                <input type="text" disabled value={editTeacherData.id}
                  className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-400 font-mono" />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">শিক্ষকের নাম *</label>
                <input type="text" required value={editTeacherData.name} onChange={(e) => setEditTeacherData({ ...editTeacherData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-300 transition" />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">ফোন নম্বর (লগইন আইডি) *</label>
                <input type="text" required value={editTeacherData.phone} onChange={(e) => setEditTeacherData({ ...editTeacherData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 font-mono focus:ring-2 focus:ring-amber-500/30 transition" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1">পদবী</label>
                  <input type="text" value={editTeacherData.designation} onChange={(e) => setEditTeacherData({ ...editTeacherData, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900" />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">জন্ম তারিখ</label>
                  <input type="date" value={editTeacherData.dob} onChange={(e) => setEditTeacherData({ ...editTeacherData, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 mb-1">পাসওয়ার্ড</label>
                <div className="relative">
                  <input type={showEditPwd ? 'text' : 'password'} value={editTeacherData.password || ''} onChange={(e) => setEditTeacherData({ ...editTeacherData, password: e.target.value })}
                    placeholder="পরিবর্তন করতে নতুন পাসওয়ার্ড লিখুন"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 font-mono pr-10" />
                  <button type="button" onClick={() => setShowEditPwd(!showEditPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    {showEditPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowEditTeacherModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer">বাতিল</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow cursor-pointer transition active:scale-95">আপডেট করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL 4: শিক্ষকের প্রোফাইল ভিউ                            */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showViewTeacherModal && viewTeacherRecord && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowViewTeacherModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center"><Eye size={16} className="text-sky-600" /></div>
                শিক্ষকের প্রোফাইল
              </h3>
              <button onClick={() => setShowViewTeacherModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer"><X size={16} className="text-slate-400" /></button>
            </div>

            {/* Profile Header */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 text-white rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white/20">
                {viewTeacherRecord.name.charAt(0)}
              </div>
              <div className="space-y-0.5">
                <h4 className="font-black text-lg">{viewTeacherRecord.name}</h4>
                <p className="text-xs text-amber-300 font-extrabold">{viewTeacherRecord.designation}</p>
                <span className="text-[11px] font-mono text-indigo-200 block">{viewTeacherRecord.id}</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">ইউজার আইডি (ফোন)</span>
                <strong className="text-indigo-900 font-mono text-sm flex items-center gap-1 mt-0.5"><Phone size={12} /> {viewTeacherRecord.phone}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">লগইন পাসওয়ার্ড</span>
                <strong className="text-slate-800 font-mono text-xs flex items-center gap-1 mt-0.5"><Key size={12} /> {viewTeacherRecord.passwordHash || '123456'}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">জন্ম তারিখ</span>
                <strong className="text-slate-800 font-bold text-xs flex items-center gap-1 mt-0.5"><Calendar size={12} /> {viewTeacherRecord.dob}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">স্ট্যাটাস</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                  viewTeacherRecord.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${viewTeacherRecord.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {viewTeacherRecord.status === 'active' ? 'অ্যাক্টিভ' : 'নিষ্ক্রিয়'}
                </span>
              </div>
            </div>

            {/* Subjects & Classes */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={13} className="text-indigo-600" /> বন্টিত শ্রেণি ও বিষয়:
              </h5>
              {(() => {
                const subs = subjectAssignments.filter(sa => sa.teacherId === viewTeacherRecord.id);
                const classTch = classTeachers.filter(ct => ct.teacherId === viewTeacherRecord.id);
                return (
                  <div className="space-y-2 text-xs">
                    {classTch.length > 0 && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 font-bold">
                        👑 শ্রেণি শিক্ষক: <strong>{classTch.map(c => c.classId).join(', ')}</strong>
                      </div>
                    )}
                    {subs.length === 0 ? (
                      <p className="text-slate-400 text-xs italic">কোনো বিষয় এসাইন করা হয়নি।</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {subs.map(s => (
                          <span key={s.id} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-900 font-bold text-[11px] rounded-lg">
                            {s.classId} → {s.subjectId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button type="button" onClick={() => setShowViewTeacherModal(false)}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-slate-800 transition">
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: LEAVE APPLICATION REVIEW (PRINCIPAL) ────────────────── */}
      {selectedLeaveForReview && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Send size={18} className="text-amber-600" />
                ছুটির আবেদন পর্যালোচনা ও সিদ্ধান্ত
              </h3>
              <button 
                type="button" 
                onClick={() => setSelectedLeaveForReview(null)} 
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Applicant Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{selectedLeaveForReview.teacherName}</h4>
                  <p className="text-xs text-slate-500 font-bold">{selectedLeaveForReview.designation} • ID: {selectedLeaveForReview.teacherId}</p>
                </div>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-black">
                  {LEAVE_TYPE_LABELS[selectedLeaveForReview.leaveType] || selectedLeaveForReview.leaveType}
                </span>
              </div>
              <div className="text-xs text-slate-600 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                <span>মেয়াদ: <strong>{selectedLeaveForReview.startDate}</strong> হতে <strong>{selectedLeaveForReview.endDate}</strong></span>
                <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">মোট {selectedLeaveForReview.totalDays} দিন</span>
              </div>
              <div className="text-xs bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700">
                <strong className="text-slate-900 block mb-0.5">আবেদনের কারণ:</strong>
                {selectedLeaveForReview.reason}
              </div>
            </div>

            {/* Decision Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 block">প্রধান শিক্ষকের সিদ্ধান্ত:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReviewDecision('approved');
                    setReviewRemarks('ছুটি মঞ্জুর করা হলো।');
                  }}
                  className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                    reviewDecision === 'approved'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <Check size={14} /> ✓ মঞ্জুর করুন (Approve)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReviewDecision('rejected');
                    setReviewRemarks('প্রশাসনিক কারণে ছুটি মঞ্জুর করা সম্ভব হলো না।');
                  }}
                  className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                    reviewDecision === 'rejected'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <X size={14} /> ✕ বাতিল করুন (Reject)
                </button>
              </div>
            </div>

            {/* Quick Remarks Chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">কুইক মন্তব্য সিলেক্ট করুন:</label>
              <div className="flex flex-wrap gap-1.5">
                {(reviewDecision === 'approved' ? [
                  'ছুটি মঞ্জুর করা হলো।',
                  'পরীক্ষার পূর্বে ক্লাস সমন্বয় সাপেক্ষে মঞ্জুর।',
                  'জরুরি পারিবারিক কারণে মঞ্জুর করা হলো।',
                  'চিকিৎসা সনদের ভিত্তিতে ৩ দিনের বিশ্রাম মঞ্জুর।'
                ] : [
                  'প্রশাসনিক কারণে ছুটি মঞ্জুর করা সম্ভব হলো না।',
                  'একাডেমিক পরীক্ষা চলাকালীন ছুটি গ্রহণযোগ্য নয়।',
                  'একই দিনে একাধিক শিক্ষকের অনুপস্থিতি থাকায় স্থগিত।'
                ]).map((remark, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReviewRemarks(remark)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                  >
                    {remark}
                  </button>
                ))}
              </div>
            </div>

            {/* Remarks Textarea */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">পর্যালোচনা ও নির্দেশনা মন্তব্য:</label>
              <textarea
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="কোনো বিশেষ নির্দেশনা থাকলে লিখুন..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLeaveForReview(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                className={`px-5 py-2 text-white rounded-xl text-xs font-black shadow-sm transition cursor-pointer flex items-center gap-1.5 ${
                  reviewDecision === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <Check size={14} />
                সিদ্ধান্ত সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: PRINT OFFICIAL LEAVE SLIP ───────────────────────────── */}
      {printSlipLeave && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Dialog Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">ছুটি মঞ্জুরিপত্র প্রিভিউ ও প্রিন্ট</h3>
              </div>
              <button
                type="button"
                onClick={() => setPrintSlipLeave(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Printable Letterhead Area */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-white text-slate-900 space-y-4 font-sans">
              <div className="text-center border-b-2 border-slate-900 pb-3 space-y-0.5">
                <h2 className="text-lg font-black text-slate-900">বরইতলী উচ্চ বিদ্যালয়</h2>
                <p className="text-[11px] font-bold text-slate-600">ডাকঘর: বরইতলী, চকরিয়া, কক্সবাজার • স্থাপিত: ১৯৬৮ ইং</p>
                <div className="inline-block px-3 py-0.5 mt-1 bg-slate-900 text-white rounded-md text-[11px] font-black uppercase tracking-wider">
                  শিক্ষক ছুটি মঞ্জুরিপত্র (LEAVE APPROVAL SLIP)
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                <span>স্মারক নং: SMS/LEV/{printSlipLeave.id}/2026</span>
                <span>তারিখ: {new Date(printSlipLeave.reviewedAt || printSlipLeave.appliedAt).toLocaleDateString('bn-BD')}</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">শিক্ষকের নাম:</span>
                  <strong className="text-slate-900">{printSlipLeave.teacherName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">পদবি ও শিক্ষক আইডি:</span>
                  <span className="text-slate-800 font-bold">{printSlipLeave.designation} ({printSlipLeave.teacherId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">ছুটির প্রকারভেদ:</span>
                  <span className="font-extrabold text-indigo-900">{LEAVE_TYPE_LABELS[printSlipLeave.leaveType] || printSlipLeave.leaveType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">মঞ্জুরকৃত ছুটির মেয়াদ:</span>
                  <span className="font-extrabold text-emerald-800">{printSlipLeave.startDate} হতে {printSlipLeave.endDate} পর্যন্ত (মোট {printSlipLeave.totalDays} দিন)</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5">
                  <span className="text-slate-500 font-bold">ছুটির কারণ:</span>
                  <span className="text-slate-800 text-right max-w-xs">{printSlipLeave.reason}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950">
                <strong className="block mb-0.5">প্রধান শিক্ষকের অনুমোদন ও নির্দেশনা:</strong>
                <p className="font-semibold">{printSlipLeave.remarks || 'ছুটি যথাযথ নিয়মে মঞ্জুর করা হলো।'}</p>
              </div>

              <div className="pt-10 flex justify-between items-end text-xs font-bold text-slate-800">
                <div className="text-center">
                  <div className="w-32 border-t border-slate-400 pt-1">শিক্ষকের স্বাক্ষর</div>
                </div>
                <div className="text-center">
                  <div className="w-36 border-t-2 border-slate-900 pt-1 font-black text-slate-900">
                    প্রধান শিক্ষক
                    <span className="block text-[10px] text-slate-500 font-normal">বরইতলী উচ্চ বিদ্যালয়</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dialog Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={() => setPrintSlipLeave(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm transition cursor-pointer flex items-center gap-1.5"
              >
                <Printer size={14} />
                প্রিন্ট করুন (Print Slip)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function TeacherManagementPage() {
  return (
    <Suspense fallback={
      <div className="w-full py-16" suppressHydrationWarning>
        <div className="animate-pulse space-y-6">
          <div className="h-28 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-3xl" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-11 w-40 bg-slate-200 rounded-2xl" />)}
          </div>
          <div className="h-96 bg-slate-100 rounded-3xl" />
        </div>
      </div>
    }>
      <TeacherManagementContent />
    </Suspense>
  );
}
