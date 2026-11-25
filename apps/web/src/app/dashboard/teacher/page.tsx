'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
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
  Clock,
  ShieldAlert,
  Printer,
  Plus,
  Award,
  Copy,
  Check,
  ChevronDown,
  FileSpreadsheet,
  SlidersHorizontal,
  MoreHorizontal,
  GraduationCap,
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
import { routineService, RoutineSlot } from '@/services/routineService';
import { settingsService } from '@/services/settingsService';
import { triggerProfessionalPrint } from '@/lib/printPdfUtils';
import {
  computeTeacherDirectoryCounts,
  filterTeacherDirectory,
  formatClassShortLabelBn,
  getDynamicConfiguredSubjects,
  sortTeachersExecutive,
  TeacherDirectoryFilter,
  TeacherTab,
  toBanglaDigits,
} from '@/components/teacher/teacherUtils';
import TeacherAssignmentsTab from '@/components/teacher/TeacherAssignmentsTab';
import ClassTeacherTab from '@/components/teacher/ClassTeacherTab';
import PermissionValidatorTab from '@/components/teacher/PermissionValidatorTab';
import {
  AddTeacherModal,
  AddTeacherPayload,
  ResetPasswordModal,
  EditTeacherModal,
  ViewTeacherModal,
  EditTeacherPayload,
} from '@/components/teacher/TeacherModals';

// ─── FOCUSED TEACHER MANAGEMENT TABS (ZERO CROSS-MENU LINKS) ──────────
type CoreTeacherTab = Exclude<TeacherTab, 'leave_applications' | 'audit_trail'>;

const TAB_CONFIG: {
  id: CoreTeacherTab;
  label: string;
  printTitle: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'teachers',
    label: 'শিক্ষক তালিকা',
    printTitle: 'শিক্ষক ও দায়িত্ব তালিকা',
    icon: <Users size={14} />,
  },
  {
    id: 'assignments',
    label: 'বিষয় অ্যাসাইন',
    printTitle: 'বিষয়ভিত্তিক শিক্ষক বণ্টন তালিকা',
    icon: <BookOpen size={14} />,
  },
  {
    id: 'class_teachers',
    label: 'শ্রেণি শিক্ষক',
    printTitle: 'মনোনীত শ্রেণি শিক্ষক তালিকা',
    icon: <School size={14} />,
  },
  {
    id: 'permission_test',
    label: 'পারমিশন টেস্ট',
    printTitle: 'RBAC পারমিশন ভ্যালিডেশন',
    icon: <ShieldCheck size={14} />,
  },
];

const INITIAL_ADD_FORM: AddTeacherPayload = {
  name: '',
  phone: '',
  designation: 'সহকারী শিক্ষক',
  dob: '1990-01-01',
  initialPassword: '',
  qualification: '',
  indexNo: '',
  joiningDate: '',
  email: '',
  bloodGroup: '',
  subjectSpecialty: '',
  photoUrl: '',
};

function TeacherManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<CoreTeacherTab>('teachers');

  // ─── Data States
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignment[]>([]);
  const [classTeachers, setClassTeachers] = useState<ClassTeacherAssignment[]>([]);
  const [routineSlots, setRoutineSlots] = useState<RoutineSlot[]>([]);

  // ─── UI States
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [directoryFilter, setDirectoryFilter] = useState<TeacherDirectoryFilter>('all');
  const [designationFilter, setDesignationFilter] = useState<string>('all');
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // ─── Modal: Add Teacher
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [addForm, setAddForm] = useState<AddTeacherPayload>(INITIAL_ADD_FORM);

  // ─── Modal: Password Reset
  const [resetTeacherRecord, setResetTeacherRecord] = useState<TeacherRecord | null>(null);
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

  // ─── DATA REFRESH
  const refreshAllData = useCallback(() => {
    setTeachers(teacherRBACService.getTeachers());
    setSubjectAssignments(teacherRBACService.getSubjectAssignments());
    setClassTeachers(teacherRBACService.getClassTeachers());
    setRoutineSlots(routineService.getRoutines());
  }, []);

  // ─── Close dropdowns on outside click
  useEffect(() => {
    if (!showMoreMenu && !showFilterMenu) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setShowMoreMenu(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(target)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMoreMenu, showFilterMenu]);

  // ─── Sync activeTab with URL '?tab=' (redirect legacy leave_applications bookmark cleanly)
  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam === 'leave_applications') {
      router.replace('/dashboard/leaves');
      return;
    }
    if (
      tabParam &&
      (['teachers', 'assignments', 'class_teachers', 'permission_test'] as string[]).includes(tabParam)
    ) {
      setActiveTab(tabParam as CoreTeacherTab);
    }
  }, [searchParams, router]);

  // ─── ALERT
  const showAlert = useCallback((type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  }, []);

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

  const sortedTeachers = useMemo(() => sortTeachersExecutive(teachers), [teachers]);

  const directoryCounts = useMemo(
    () => computeTeacherDirectoryCounts(sortedTeachers, classTeachers),
    [sortedTeachers, classTeachers]
  );

  const uniqueDesignations = useMemo(() => {
    const set = new Set<string>();
    for (const t of sortedTeachers) {
      if (t.designation?.trim()) set.add(t.designation.trim());
    }
    return Array.from(set);
  }, [sortedTeachers]);

  const filteredTeachers = useMemo(
    () =>
      filterTeacherDirectory(sortedTeachers, subjectAssignments, classTeachers, {
        query: searchQuery,
        filter: directoryFilter,
        designation: designationFilter,
      }),
    [sortedTeachers, subjectAssignments, classTeachers, searchQuery, directoryFilter, designationFilter]
  );

  // Lookup maps for O(1) rendering
  const teacherSubjectsMap = useMemo(() => {
    const map = new Map<string, SubjectAssignment[]>();
    for (const sa of subjectAssignments) {
      const list = map.get(sa.teacherId) || [];
      list.push(sa);
      map.set(sa.teacherId, list);
    }
    return map;
  }, [subjectAssignments]);

  const teacherClassesMap = useMemo(() => {
    const map = new Map<string, ClassTeacherAssignment[]>();
    for (const ct of classTeachers) {
      const list = map.get(ct.teacherId) || [];
      list.push(ct);
      map.set(ct.teacherId, list);
    }
    return map;
  }, [classTeachers]);

  const teacherRoutineCountMap = useMemo(() => {
    const byId = new Map<string, number>();
    const byName = new Map<string, number>();
    for (const slot of routineSlots) {
      if (slot.teacherId) {
        byId.set(slot.teacherId, (byId.get(slot.teacherId) || 0) + 1);
      } else if (slot.teacherName) {
        const key = slot.teacherName.trim().toLowerCase();
        byName.set(key, (byName.get(key) || 0) + 1);
      }
    }
    const result = new Map<string, number>();
    for (const t of teachers) {
      const count = byId.get(t.id) || byName.get(t.name.trim().toLowerCase()) || 0;
      result.set(t.id, count);
    }
    return result;
  }, [routineSlots, teachers]);

  const schoolSettings = useMemo(
    () => (mounted ? settingsService.getSettings() : null),
    [mounted]
  );

  const currentTabConfig = useMemo(
    () => TAB_CONFIG.find((t) => t.id === activeTab) || TAB_CONFIG[0],
    [activeTab]
  );

  // ─── HANDLERS
  const openEditModalFor = (t: TeacherRecord) => {
    setEditTeacherData({
      id: t.id,
      name: t.name,
      phone: t.phone,
      designation: t.designation,
      dob: t.dob,
      status: t.status || 'active',
      qualification: t.qualification || '',
      indexNo: t.indexNo || '',
      joiningDate: t.joiningDate || '',
      email: t.email || '',
      bloodGroup: t.bloodGroup || '',
      subjectSpecialty: t.subjectSpecialty || '',
      photoUrl: t.photoUrl || '',
      password: '',
    });
    setShowEditTeacherModal(true);
  };

  const openResetModalFor = (t: TeacherRecord) => {
    setResetTeacherRecord(t);
    setNewPassword('');
    setShowResetModal(true);
  };

  const handleQuickAssignSubject = (teacherId: string) => {
    setAssignTeacherId(teacherId);
    setActiveTab('assignments');
  };

  const handleCopyPhone = async (teacher: TeacherRecord) => {
    try {
      await navigator.clipboard.writeText(teacher.phone);
      setCopiedPhoneId(teacher.id);
      setTimeout(() => setCopiedPhoneId((prev) => (prev === teacher.id ? null : prev)), 1500);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleToggleTeacherStatus = async (t: TeacherRecord) => {
    const nextStatus: 'active' | 'inactive' = t.status === 'active' ? 'inactive' : 'active';
    const res = await teacherRBACService.updateTeacher(t.id, { status: nextStatus });
    if (res.success) {
      showAlert(
        'success',
        `'${t.name}' এর স্ট্যাটাস '${nextStatus === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}' করা হয়েছে।`
      );
      refreshAllData();
    } else {
      showAlert('error', res.message);
    }
  };

  const handlePrintDirectory = () => {
    setShowMoreMenu(false);
    const schoolName = schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান';
    triggerProfessionalPrint([schoolName, currentTabConfig.printTitle, '২০২৬']);
  };

  const handleExportExcel = async () => {
    setShowMoreMenu(false);
    if (filteredTeachers.length === 0) {
      showAlert('error', 'এক্সপোর্ট করার মতো কোনো শিক্ষক তালিকা পাওয়া যায়নি।');
      return;
    }

    const XLSX = await import('xlsx');
    const rows = filteredTeachers.map((t, index) => {
      const tSubs = teacherSubjectsMap.get(t.id) || [];
      const tCTs = teacherClassesMap.get(t.id) || [];
      const weeklyPeriods = teacherRoutineCountMap.get(t.id) || 0;
      return {
        ক্রমিক: index + 1,
        আইডি: t.id,
        'শিক্ষকের নাম': t.name,
        পদবী: t.designation,
        'ইনডেক্স / এমপিও': t.indexNo || '',
        'শিক্ষাগত যোগ্যতা': t.qualification || '',
        'মূল বিষয়': t.subjectSpecialty || '',
        'মোবাইল (লগইন আইডি)': t.phone,
        ইমেইল: t.email || '',
        'যোগদানের তারিখ': t.joiningDate || '',
        'জন্ম তারিখ': t.dob || '',
        'রক্তের গ্রুপ': t.bloodGroup || '',
        'শ্রেণি শিক্ষক': tCTs.map((c) => formatClassShortLabelBn(c.classId)).join(', '),
        'বরাদ্দকৃত বিষয়সমূহ': tSubs
          .map((sa) => `${formatClassShortLabelBn(sa.classId)} (${sa.subjectId})`)
          .join(', '),
        'সাপ্তাহিক পিরিয়ড': weeklyPeriods,
        স্ট্যাটাস: t.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Teachers');
    const dateStamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Teachers_Directory_${dateStamp}.xlsx`);
    showAlert('success', `${toBanglaDigits(filteredTeachers.length)} জন শিক্ষকের এক্সেল ফাইল ডাউনলোড হয়েছে।`);
  };

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
        message: `আপনি কি '${className}'-এর শ্রেণি শিক্ষক নির্বাচন বাতিল করতে চান?`,
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
    setShowMoreMenu(false);
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
    if (!addForm.name.trim() || !addForm.phone.trim()) {
      return showAlert('error', 'নাম এবং ফোন নম্বর প্রদান করুন!');
    }
    if (addForm.initialPassword.trim().length < 6) {
      return showAlert('error', 'কমপক্ষে ৬ অক্ষরের প্রাথমিক পাসওয়ার্ড লিখুন!');
    }
    const res = await teacherRBACService.createTeacher({
      name: addForm.name.trim(),
      phone: addForm.phone.trim(),
      designation: addForm.designation.trim() || 'সহকারী শিক্ষক',
      dob: addForm.dob,
      status: 'active',
      passwordHash: addForm.initialPassword.trim(),
      qualification: addForm.qualification.trim() || undefined,
      indexNo: addForm.indexNo.trim() || undefined,
      joiningDate: addForm.joiningDate || undefined,
      email: addForm.email.trim() || undefined,
      bloodGroup: addForm.bloodGroup || undefined,
      subjectSpecialty: addForm.subjectSpecialty.trim() || undefined,
      photoUrl: addForm.photoUrl || undefined,
    });
    if (res.success) {
      showAlert('success', res.message);
      setAddForm(INITIAL_ADD_FORM);
      setShowAddTeacherModal(false);
      refreshAllData();
    } else {
      showAlert('error', res.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTeacherRecord || !newPassword.trim()) return;
    if (newPassword.trim().length < 6) {
      return showAlert('error', 'কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড লিখুন!');
    }
    const res = await teacherRBACService.resetPassword(resetTeacherRecord.id, newPassword.trim());
    if (res.success) {
      showAlert('success', res.message);
      setShowResetModal(false);
      setResetTeacherRecord(null);
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
    if (editTeacherData.password && editTeacherData.password.trim().length > 0 && editTeacherData.password.trim().length < 6) {
      return showAlert('error', 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে!');
    }
    const res = await teacherRBACService.updateTeacher(editTeacherData.id, {
      name: editTeacherData.name.trim(),
      phone: editTeacherData.phone.trim(),
      designation: editTeacherData.designation.trim() || 'সহকারী শিক্ষক',
      dob: editTeacherData.dob,
      password: editTeacherData.password?.trim() || undefined,
      status: editTeacherData.status,
      qualification: editTeacherData.qualification?.trim() || undefined,
      indexNo: editTeacherData.indexNo?.trim() || undefined,
      joiningDate: editTeacherData.joiningDate || undefined,
      email: editTeacherData.email?.trim() || undefined,
      bloodGroup: editTeacherData.bloodGroup || undefined,
      subjectSpecialty: editTeacherData.subjectSpecialty?.trim() || undefined,
      photoUrl: editTeacherData.photoUrl || undefined,
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
      classId === '6th'
        ? '৬ষ্ঠ শ্রেণি'
        : classId === '7th'
        ? '৭ম শ্রেণি'
        : classId === '8th'
        ? '৮ম শ্রেণি'
        : classId === '9th'
        ? '৯ম শ্রেণি'
        : '১০ম শ্রেণি';
    const existing = subjectAssignments.filter(
      (a) =>
        a.classId === classId &&
        (a.subjectId === subjectName || a.subjectId.includes(subjectName) || subjectName.includes(a.subjectId))
    );
    existing.forEach((a) => teacherRBACService.removeSubjectAssignment(a.id));

    if (!teacherId) {
      refreshAllData();
      showAlert('success', `${classLabel}তে ${subjectName} শিক্ষক বরাদ্দ বাতিল করা হয়েছে!`);
      return;
    }

    const res = teacherRBACService.assignSubject(teacherId, classId, subjectName, 2026);
    if (res.success) {
      refreshAllData();
      showAlert('success', `${classLabel}তে ${subjectName} শিক্ষক সফলভাবে নির্ধারিত হয়েছে!`);
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
    showAlert('success', `সকল শ্রেণিতে (৬ষ্ঠ-১০ম) ${subjectName} শিক্ষক নির্ধারণ সম্পন্ন (${toBanglaDigits(count)}টি শ্রেণি)!`);
  };

  const handleAssignClassTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctTeacherId) return showAlert('error', 'শিক্ষক নির্বাচন করুন!');
    const res = teacherRBACService.assignClassTeacher(ctTeacherId, ctClassId, 2026);
    showAlert(res.success ? 'success' : 'error', res.message);
    refreshAllData();
  };

  const activeFilterCount =
    (directoryFilter !== 'all' ? 1 : 0) + (designationFilter !== 'all' ? 1 : 0);

  // ─── LOADING STATE
  if (!mounted) {
    return (
      <div className="w-full" suppressHydrationWarning>
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="animate-pulse flex items-center justify-between gap-3">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
            <div className="h-9 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse h-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  // 🛑 RBAC Access Guard: Only Admin / Principal can access Teacher & Staff Management
  if (session && session.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto my-12 px-4" suppressHydrationWarning>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-5 shadow-xs">
          <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200/80 dark:border-rose-800/60 flex items-center justify-center mx-auto">
            <ShieldAlert size={28} />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              অনুমতি নেই (Access Restricted)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              সহকারী শিক্ষকগণ শিক্ষক ও স্টাফ ব্যবস্থাপনায় অ্যাক্সেস করতে পারবেন না। আপনি শুধুমাত্র আপনার বরাদ্দকৃত বিষয় দেখতে এবং নির্ধারিত বিষয়ে নম্বর এন্ট্রি করতে পারবেন।
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <Link
              href="/dashboard/teacher-portal"
              className="px-4 py-2.5 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              আমার শিক্ষক ড্যাশবোর্ডে যান
            </Link>
            <Link
              href="/dashboard/exam/mark-entry"
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition border border-slate-200 dark:border-slate-700"
            >
              নম্বর এন্ট্রি প্যানেল
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-14 font-sans text-slate-900 dark:text-slate-100" suppressHydrationWarning>
      {/* Safe plain <style> for A4 landscape directory print */}
      <style>{'@media print { @page { size: A4 landscape; margin: 10mm; } }'}</style>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 📌 FLUSH STICKY SINGLE-ROW EXECUTIVE SUB-HEADER                   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)] dark:shadow-none print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: 4 Focused Teacher & RBAC Tabs ONLY */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5 sm:pb-0">
            {TAB_CONFIG.map((tab) => {
              const isActive = activeTab === tab.id;
              let badgeText: string | null = null;
              if (tab.id === 'teachers') badgeText = toBanglaDigits(teachers.length);
              else if (tab.id === 'assignments') badgeText = toBanglaDigits(subjectAssignments.length);
              else if (tab.id === 'class_teachers') badgeText = toBanglaDigits(classTeachers.length);

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`h-9 px-3 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold whitespace-nowrap shrink-0 border ${
                    isActive
                      ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-2xs'
                      : 'bg-transparent text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {badgeText !== null && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold leading-none ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {badgeText}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Unified Search + Compact More/Print Menu + Primary CTA */}
          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            {/* Unified Search */}
            <div className="relative flex-1 sm:flex-initial">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="নাম, ফোন, আইডি বা বিষয়..."
                aria-label="শিক্ষক বা বিষয় অনুসন্ধান"
                className="h-9 pl-8 pr-8 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 w-full sm:w-48 lg:w-56 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  aria-label="অনুসন্ধান মুছুন"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Compact Filter Popover (Teachers Tab Only — Keeps Toolbar Strictly Single-Row) */}
            {activeTab === 'teachers' && teachers.length > 0 && (
              <div className="relative" ref={filterMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowFilterMenu((prev) => !prev);
                    setShowMoreMenu(false);
                  }}
                  className={`h-9 px-3 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                    activeFilterCount > 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                  title="স্ট্যাটাস ও পদবী ফিল্টার"
                >
                  <SlidersHorizontal size={13} />
                  <span className="hidden md:inline">ফিল্টার</span>
                  {activeFilterCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-[#0B5D3B] text-white text-[10px] font-extrabold leading-none">
                      {toBanglaDigits(activeFilterCount)}
                    </span>
                  )}
                  <ChevronDown size={13} className="text-slate-400" />
                </button>

                {showFilterMenu && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 space-y-3 z-50">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
                        শিক্ষক ফিল্টার
                      </span>
                      {activeFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setDirectoryFilter('all');
                            setDesignationFilter('all');
                          }}
                          className="text-[11px] font-bold text-[#0B5D3B] dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          রিসেট
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      {(
                        [
                          { id: 'all', label: 'সকল শিক্ষক', count: directoryCounts.all },
                          { id: 'active', label: 'সক্রিয়', count: directoryCounts.active },
                          { id: 'inactive', label: 'নিষ্ক্রিয়', count: directoryCounts.inactive },
                          { id: 'class_teacher', label: 'শ্রেণি শিক্ষক', count: directoryCounts.classTeacher },
                          {
                            id: 'must_change_password',
                            label: 'পাসওয়ার্ড বাকি',
                            count: directoryCounts.mustChangePassword,
                          },
                        ] as Array<{ id: TeacherDirectoryFilter; label: string; count: number }>
                      ).map((opt) => {
                        const selected = directoryFilter === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setDirectoryFilter(opt.id)}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                              selected
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span>{opt.label}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                selected
                                  ? 'bg-[#0B5D3B] text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {toBanglaDigits(opt.count)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {uniqueDesignations.length > 1 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
                          পদবী অনুযায়ী
                        </label>
                        <select
                          value={designationFilter}
                          onChange={(e) => setDesignationFilter(e.target.value)}
                          aria-label="পদবী অনুযায়ী ফিল্টার"
                          className="w-full h-8 px-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#0B5D3B] cursor-pointer"
                        >
                          <option value="all">সকল পদবী</option>
                          {uniqueDesignations.map((des) => (
                            <option key={des} value={des}>
                              {des}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Compact More Actions Dropdown (Print / Excel / Bulk Clear) */}
            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu((prev) => !prev);
                  setShowFilterMenu(false);
                }}
                className="h-9 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                title="প্রিন্ট, এক্সেল এক্সপোর্ট ও অতিরিক্ত অপশন"
              >
                <MoreHorizontal size={14} className="sm:hidden" />
                <Printer size={14} className="hidden sm:inline" />
                <span className="hidden md:inline">প্রিন্ট ও এক্সপোর্ট</span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-50">
                  {activeTab !== 'permission_test' && (
                    <button
                      type="button"
                      onClick={handlePrintDirectory}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition"
                    >
                      <Printer size={14} className="text-slate-500" />
                      <span>তালিকা প্রিন্ট (A4)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition"
                  >
                    <FileSpreadsheet size={14} className="text-[#0B5D3B] dark:text-emerald-400" />
                    <span>এক্সেল এক্সপোর্ট (.xlsx)</span>
                  </button>

                  {teachers.length > 0 && (
                    <>
                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                      <button
                        type="button"
                        onClick={handleClearAllTeachers}
                        className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer transition"
                      >
                        <Trash2 size={14} />
                        <span>সব শিক্ষক মুছুন</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAddTeacherModal(true)}
              className="h-9 px-3.5 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-[0.98] shrink-0 whitespace-nowrap"
            >
              <UserPlus size={14} />
              <span>+ নতুন শিক্ষক</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 📄 MAIN WORKSPACE CONTENT                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-4 print:max-w-none print:px-0 print:pt-0">
        {/* Print-Only Institutional Letterhead */}
        <div className="hidden print:flex items-center justify-between gap-4 border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-3">
            {schoolSettings?.schoolLogo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={schoolSettings.schoolLogo}
                alt="প্রতিষ্ঠানের লোগো"
                className="w-12 h-12 object-contain shrink-0"
              />
            )}
            <div>
              <h1 className="text-lg font-black text-slate-900">
                {schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান'}
              </h1>
              <p className="text-xs font-medium text-slate-600">
                {schoolSettings?.address || ''}
                {schoolSettings?.eiin ? ` • EIIN: ${schoolSettings.eiin}` : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-extrabold text-slate-900">
              {currentTabConfig.printTitle}
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              প্রিন্ট তারিখ: {new Date().toLocaleDateString('bn-BD')}
              {activeTab === 'teachers'
                ? ` • মোট প্রদর্শিত: ${toBanglaDigits(filteredTeachers.length)} জন`
                : ''}
            </p>
          </div>
        </div>

        {/* Inline Notification Alert */}
        {alertMsg && (
          <div
            className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 border print:hidden ${
              alertMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800/60'
            }`}
          >
            {alertMsg.type === 'success' ? (
              <CheckCircle2 size={16} className="text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{alertMsg.text}</span>
            <button
              type="button"
              onClick={() => setAlertMsg(null)}
              className="ml-auto p-1 hover:bg-black/5 rounded-lg cursor-pointer"
              aria-label="বার্তা বন্ধ করুন"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* TAB 1: শিক্ষক তালিকা */}
        {activeTab === 'teachers' && (
          <div className="space-y-3">
            {teachers.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-14 text-center space-y-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Users size={26} className="text-slate-400" />
                </div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                  কোনো শিক্ষক নিবন্ধিত নেই
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">
                  &ldquo;+ নতুন শিক্ষক&rdquo; বাটনে ক্লিক করে শিক্ষকের নাম, পদবী, মোবাইল নম্বর ও প্রাথমিক পাসওয়ার্ড যুক্ত করুন।
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(true)}
                  className="px-4 py-2.5 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer transition inline-flex items-center gap-1.5"
                >
                  <UserPlus size={14} /> নতুন শিক্ষক যোগ করুন
                </button>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-12 text-center space-y-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <Search size={24} className="mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {searchQuery.trim()
                    ? `"${searchQuery}" এবং নির্বাচিত ফিল্টারে কোনো শিক্ষক পাওয়া যায়নি`
                    : 'নির্বাচিত ফিল্টারে কোনো শিক্ষক পাওয়া যায়নি'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDirectoryFilter('all');
                    setDesignationFilter('all');
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  ফিল্টার রিসেট করুন
                </button>
              </div>
            ) : (
              <>
                {/* Desktop & Print Executive Table */}
                <div className="hidden md:block print:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden print:rounded-none print:border-slate-300 print:shadow-none">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/90 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 font-extrabold text-[11px] border-b border-slate-200/90 dark:border-slate-800 print:bg-slate-100 print:text-slate-900">
                          <th className="px-4 py-3">শিক্ষক ও প্রোফাইল</th>
                          <th className="px-4 py-3">পদবী ও শ্রেণি দায়িত্ব</th>
                          <th className="px-4 py-3">বরাদ্দকৃত বিষয় ও ক্লাস লোড</th>
                          <th className="px-4 py-3">মোবাইল (লগইন) ও স্ট্যাটাস</th>
                          <th className="px-4 py-3 text-right print:hidden">দ্রুত অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 print:divide-slate-200">
                        {filteredTeachers.map((t) => {
                          const tSubs = teacherSubjectsMap.get(t.id) || [];
                          const tCTs = teacherClassesMap.get(t.id) || [];
                          const weeklyPeriods = teacherRoutineCountMap.get(t.id) || 0;
                          const previewSubs = tSubs.slice(0, 3);
                          const remainingSubs = tSubs.length - previewSubs.length;

                          return (
                            <tr
                              key={t.id}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              {/* 1. Teacher Identity */}
                              <td className="px-4 py-3 align-top">
                                <div className="flex items-start gap-2.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setViewTeacherRecord(t);
                                      setShowViewTeacherModal(true);
                                    }}
                                    className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 border border-slate-200/60 dark:border-slate-700 cursor-pointer print:hidden"
                                    title="প্রোফাইল দেখুন"
                                  >
                                    {t.photoUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={t.photoUrl}
                                        alt={t.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span>{t.name.charAt(0)}</span>
                                    )}
                                  </button>
                                  <div className="min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setViewTeacherRecord(t);
                                        setShowViewTeacherModal(true);
                                      }}
                                      className="font-extrabold text-slate-900 dark:text-white hover:text-[#0B5D3B] dark:hover:text-emerald-400 text-xs block leading-snug text-left cursor-pointer transition"
                                    >
                                      {t.name}
                                    </button>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                      <span className="font-mono font-bold text-[10px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                        {t.id}
                                      </span>
                                      {t.indexNo && (
                                        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                          ইনডেক্স: {t.indexNo}
                                        </span>
                                      )}
                                    </div>
                                    {t.qualification && (
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 inline-flex items-center gap-1">
                                        <GraduationCap size={10} className="shrink-0 print:hidden" />
                                        {t.qualification}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* 2. Designation & Class Teacher Role */}
                              <td className="px-4 py-3 align-top">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                                  {t.designation}
                                </span>
                                {t.subjectSpecialty && (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                                    {t.subjectSpecialty}
                                  </span>
                                )}
                                {tCTs.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {tCTs.map((ct) => (
                                      <span
                                        key={ct.id}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-[10px] font-bold"
                                      >
                                        <Award size={10} className="shrink-0 print:hidden" />
                                        শ্রেণি শিক্ষক: {formatClassShortLabelBn(ct.classId)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>

                              {/* 3. Assigned Subjects & Weekly Workload */}
                              <td className="px-4 py-3 align-top max-w-xs">
                                {tSubs.length === 0 ? (
                                  <span className="text-[11px] text-slate-400 font-medium block">
                                    কোনো বিষয় বরাদ্দ নেই
                                  </span>
                                ) : (
                                  <>
                                    <div className="flex flex-wrap gap-1 print:hidden">
                                      {previewSubs.map((sa) => (
                                        <span
                                          key={sa.id}
                                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-[10px] font-bold"
                                        >
                                          {formatClassShortLabelBn(sa.classId)} • {sa.subjectId}
                                        </span>
                                      ))}
                                      {remainingSubs > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => handleQuickAssignSubject(t.id)}
                                          className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-[10px] font-extrabold cursor-pointer hover:bg-emerald-100 transition"
                                          title="সব বিষয় দেখতে ও সম্পাদনা করতে ক্লিক করুন"
                                        >
                                          +{toBanglaDigits(remainingSubs)} আরও
                                        </button>
                                      )}
                                    </div>
                                    <div className="hidden print:block text-[10px] text-slate-800 leading-relaxed">
                                      {tSubs
                                        .map((sa) => `${formatClassShortLabelBn(sa.classId)} (${sa.subjectId})`)
                                        .join(', ')}
                                    </div>
                                  </>
                                )}

                                {weeklyPeriods > 0 && (
                                  <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                    <Clock size={10} className="text-[#0B5D3B] dark:text-emerald-400 print:hidden" />
                                    রুটিন লোড: সাপ্তাহিক {toBanglaDigits(weeklyPeriods)} পিরিয়ড
                                  </span>
                                )}
                              </td>

                              {/* 4. Username (Phone) + Account & Login Status */}
                              <td className="px-4 py-3 align-top">
                                <div className="inline-flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 text-xs">
                                    <Phone size={11} className="text-slate-400 shrink-0 print:hidden" />
                                    {t.phone}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPhone(t)}
                                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition cursor-pointer print:hidden"
                                    title="নম্বর কপি করুন"
                                    aria-label={`${t.name} ফোন নম্বর কপি করুন`}
                                  >
                                    {copiedPhoneId === t.id ? (
                                      <Check size={11} className="text-[#0B5D3B]" />
                                    ) : (
                                      <Copy size={11} />
                                    )}
                                  </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleTeacherStatus(t)}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer transition ${
                                      t.status === 'active'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#0B5D3B] dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                                    }`}
                                    title="ক্লিক করে সক্রিয়/নিষ্ক্রিয় পরিবর্তন করুন"
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        t.status === 'active' ? 'bg-emerald-600' : 'bg-slate-400'
                                      }`}
                                    />
                                    {t.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                                  </button>

                                  {t.mustChangePassword ? (
                                    <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 font-bold text-[10px] rounded-md">
                                      পাসওয়ার্ড বাকি
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 font-bold text-[10px] rounded-md">
                                      ভেরিফায়েড
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* 5. Quick Actions */}
                              <td className="px-4 py-3 align-top text-right print:hidden">
                                <div className="inline-flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleQuickAssignSubject(t.id)}
                                    className="px-2 py-1 text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer whitespace-nowrap mr-0.5"
                                    title="এই শিক্ষককে বিষয় অ্যাসাইন করুন"
                                  >
                                    <Plus size={12} /> বিষয়
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setViewTeacherRecord(t);
                                      setShowViewTeacherModal(true);
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                    title="প্রোফাইল দেখুন"
                                    aria-label={`${t.name} প্রোফাইল দেখুন`}
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditModalFor(t)}
                                    className="p-1.5 text-slate-500 hover:text-[#0B5D3B] dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition cursor-pointer"
                                    title="এডিট করুন"
                                    aria-label={`${t.name} এডিট করুন`}
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openResetModalFor(t)}
                                    className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                    title="পাসওয়ার্ড রিসেট"
                                    aria-label={`${t.name} পাসওয়ার্ড রিসেট`}
                                  >
                                    <Key size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTeacher(t.id, t.name)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                                    title="মুছে ফেলুন"
                                    aria-label={`${t.name} মুছে ফেলুন`}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Responsive Mobile Card View */}
                <div className="md:hidden space-y-3 print:hidden">
                  {filteredTeachers.map((t) => {
                    const tSubs = teacherSubjectsMap.get(t.id) || [];
                    const tCTs = teacherClassesMap.get(t.id) || [];
                    const weeklyPeriods = teacherRoutineCountMap.get(t.id) || 0;
                    const previewSubs = tSubs.slice(0, 4);
                    const remainingSubs = tSubs.length - previewSubs.length;

                    return (
                      <div
                        key={t.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 flex flex-col justify-between gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 border border-slate-200/60 dark:border-slate-700">
                                {t.photoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={t.photoUrl} alt={t.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{t.name.charAt(0)}</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                                  {t.name}
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                                  {t.designation} • <span className="font-mono">{t.id}</span>
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleTeacherStatus(t)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 cursor-pointer ${
                                t.status === 'active'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#0B5D3B] dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {t.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                            </button>
                          </div>

                          {(t.qualification || t.indexNo) && (
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {t.qualification && (
                                <span className="inline-flex items-center gap-1">
                                  <GraduationCap size={11} /> {t.qualification}
                                </span>
                              )}
                              {t.indexNo && <span className="font-mono">ইনডেক্স: {t.indexNo}</span>}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1">
                              <Phone size={11} className="text-slate-400" /> {t.phone}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyPhone(t)}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer"
                              title="নম্বর কপি করুন"
                            >
                              {copiedPhoneId === t.id ? (
                                <Check size={11} className="text-[#0B5D3B]" />
                              ) : (
                                <Copy size={11} />
                              )}
                            </button>
                            {t.mustChangePassword ? (
                              <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 font-bold text-[10px] rounded-md">
                                পাসওয়ার্ড বাকি
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] rounded-md">
                                ভেরিফায়েড
                              </span>
                            )}
                            {weeklyPeriods > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                <Clock size={10} className="text-[#0B5D3B] dark:text-emerald-400" />
                                {toBanglaDigits(weeklyPeriods)} পিরিয়ড/সপ্তাহ
                              </span>
                            )}
                          </div>

                          {tCTs.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {tCTs.map((ct) => (
                                <span
                                  key={ct.id}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-[10px] font-bold"
                                >
                                  <Award size={10} /> শ্রেণি শিক্ষক: {formatClassShortLabelBn(ct.classId)}
                                </span>
                              ))}
                            </div>
                          )}

                          {tSubs.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                              {previewSubs.map((sa) => (
                                <span
                                  key={sa.id}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-bold"
                                >
                                  {formatClassShortLabelBn(sa.classId)} • {sa.subjectId}
                                </span>
                              ))}
                              {remainingSubs > 0 && (
                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 text-[10px] font-bold">
                                  +{toBanglaDigits(remainingSubs)} আরও
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleQuickAssignSubject(t.id)}
                            className="flex-1 min-w-[84px] py-1.5 px-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Plus size={12} /> বিষয়
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setViewTeacherRecord(t);
                              setShowViewTeacherModal(true);
                            }}
                            className="py-1.5 px-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={12} /> দেখুন
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModalFor(t)}
                            className="py-1.5 px-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Pencil size={12} /> এডিট
                          </button>
                          <button
                            type="button"
                            onClick={() => openResetModalFor(t)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer"
                            title="পাসওয়ার্ড রিসেট"
                          >
                            <Key size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeacher(t.id, t.name)}
                            className="p-1.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <TeacherAssignmentsTab
            teachers={sortedTeachers}
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
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'class_teachers' && (
          <ClassTeacherTab
            teachers={sortedTeachers}
            classTeachers={classTeachers}
            ctClassId={ctClassId}
            setCtClassId={setCtClassId}
            ctTeacherId={ctTeacherId}
            setCtTeacherId={setCtTeacherId}
            onAssignClassTeacher={handleAssignClassTeacher}
            onRemoveClassTeacher={handleRemoveClassTeacher}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'permission_test' && (
          <PermissionValidatorTab
            teachers={sortedTeachers}
            subjectAssignments={subjectAssignments}
            classTeachers={classTeachers}
            mounted={mounted}
          />
        )}

        {/* Print-Only Institutional Signature Footer */}
        <div className="hidden print:flex items-end justify-between pt-12 mt-8 text-xs text-slate-800">
          <div className="text-center w-48">
            <div className="border-t border-slate-700 pt-1.5 font-bold">প্রস্তুতকারীর স্বাক্ষর</div>
          </div>
          <div className="text-center w-56">
            <div className="border-t border-slate-700 pt-1.5 font-bold">
              প্রধান শিক্ষক / অধ্যক্ষ
              <span className="block text-[10px] font-medium text-slate-600">
                {schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── EXECUTIVE MODALS ──────────────────────────────────────────── */}
      <AddTeacherModal
        isOpen={showAddTeacherModal}
        onClose={() => setShowAddTeacherModal(false)}
        form={addForm}
        setForm={setAddForm}
        onSubmit={handleAddTeacher}
      />

      <ResetPasswordModal
        isOpen={showResetModal}
        teacher={resetTeacherRecord}
        onClose={() => {
          setShowResetModal(false);
          setResetTeacherRecord(null);
        }}
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
        weeklyPeriodCount={
          viewTeacherRecord ? teacherRoutineCountMap.get(viewTeacherRecord.id) || 0 : 0
        }
        onClose={() => setShowViewTeacherModal(false)}
        onEdit={openEditModalFor}
        onAssignSubject={handleQuickAssignSubject}
        onResetPassword={openResetModalFor}
      />
    </div>
  );
}

export default function TeacherManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full" suppressHydrationWarning>
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-2.5">
            <div className="animate-pulse flex items-center justify-between gap-3">
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                ))}
              </div>
              <div className="h-9 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          </div>
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="animate-pulse h-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
          </div>
        </div>
      }
    >
      <TeacherManagementContent />
    </Suspense>
  );
}
