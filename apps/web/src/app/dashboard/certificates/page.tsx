'use client';

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 📜 SCHOOLPRO — CENTRALIZED CERTIFICATES & OFFICIAL DOCUMENTS MANAGEMENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Complete, enterprise-grade certificate lifecycle module:
 * - 11+ Certificate Types (Study, Character, TC, Testimonial, Merit, Appreciation, etc.)
 * - Synchronized with Student Database (No duplicate entry)
 * - Dynamic Template Manager with dynamic {{variables}}
 * - Unique Certificate Number & Real Verification QR Code (/verify-certificate)
 * - Full Status Lifecycle (Valid vs Cancelled with reasons)
 * - Audit Trail & History
 * - Multi-layout Print Engine (Institutional Pad & Royal Border)
 * ═════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  FileText,
  Printer,
  PlusCircle,
  Search,
  Users,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Check,
  X,
  FileCheck,
  UserCheck,
  GraduationCap,
  ShieldCheck,
  ChevronRight,
  Eye,
  CalendarDays,
  BookOpen,
  Filter,
  Sparkles,
  QrCode as QrIcon,
  Ban,
  Clock,
  Settings2,
  Copy,
  Download,
  ExternalLink,
  History,
  Layers,
  ChevronDown
} from 'lucide-react';
import {
  certificateService,
  CertificateRecord,
  CertificateType,
  CertificateTemplate,
  CertificateStatus,
  CertificateLayoutStyle
} from '@/services/certificateService';
import { studentService, Student } from '@/services/studentService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import OfficialCertificateDoc from '@/components/OfficialCertificateDoc';

type MainTab = 'register' | 'create' | 'templates' | 'audit';

// ─── 6 OFFICIAL TESTIMONIAL & CERTIFICATE TYPES ──────────────────────────────
const ALL_CERT_TYPES: {
  id: CertificateType;
  title: string;
  desc: string;
  icon: any;
  defaultLayout: CertificateLayoutStyle;
  color: string;
  bgColor: string;
}[] = [
  {
    id: 'current_student',
    title: 'অধ্যয়নরত প্রত্যয়ন পত্র',
    desc: 'বর্তমান ও নিয়মিত অধ্যয়নরত শিক্ষার্থীর পরিচয় ও প্রত্যয়ন',
    icon: FileText,
    defaultLayout: 'pad',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50'
  },
  {
    id: 'character_certificate',
    title: 'চারিত্রিক সনদ পত্র',
    desc: 'নৈতিক চরিত্র, আচরণ ও স্বভাব সম্পর্কিত প্রত্যয়ন',
    icon: Award,
    defaultLayout: 'pad',
    color: 'text-sky-700',
    bgColor: 'bg-sky-50'
  },
  {
    id: 'transfer_certificate',
    title: 'ছাড়পত্র / টিসি (TC)',
    desc: 'বিদ্যালয় ছাড়পত্র ও ট্রান্সফার প্রত্যয়ন সনদ',
    icon: ShieldCheck,
    defaultLayout: 'pad',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50'
  },
  {
    id: 'school_leaving',
    title: 'বিদ্যালয় ত্যাগের সনদ',
    desc: 'অধ্যয়ন সমাপ্তিপূর্বক প্রতিষ্ঠান ত্যাগের প্রত্যয়ন',
    icon: BookOpen,
    defaultLayout: 'pad',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'student_verification',
    title: 'শিক্ষার্থী তথ্য যাচাইকরণ প্রত্যয়ন',
    desc: 'পাসপোর্ট, ব্যাংক বা সরকারি কাজে প্রাতিষ্ঠানিক তথ্য যাচাই',
    icon: UserCheck,
    defaultLayout: 'pad',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50'
  },
  {
    id: 'custom_certificate',
    title: 'বিশেষ প্রাতিষ্ঠানিক প্রত্যয়ন',
    desc: 'বিদ্যালয় কর্তৃপক্ষের যেকোনো বিশেষ উদ্দেশ্যের প্রত্যয়ন পত্র',
    icon: FileCheck,
    defaultLayout: 'pad',
    color: 'text-slate-700',
    bgColor: 'bg-slate-50'
  }
];

export default function CertificatesPage() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>('register');
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(settingsService.getSettings());
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Core Data
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);

  // ── Form State (Create / Edit) ──
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [certType, setCertType] = useState<CertificateType>('current_student');
  const [layoutStyle, setLayoutStyle] = useState<CertificateLayoutStyle>('pad');
  const [refNo, setRefNo] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [achievementTitle, setAchievementTitle] = useState<string>('');
  const [characterRemarks, setCharacterRemarks] = useState<string>(
    'অত্র বিদ্যালয়ে অধ্যয়নকালে তাহার নৈতিক চরিত্র, শৃঙ্খলা ও আচার-আচরণ প্রশংসনীয় ছিল।'
  );
  const [customBody, setCustomBody] = useState<string>('');
  const [isAlumni, setIsAlumni] = useState<boolean>(false);

  // Manual Overrides
  const [studentName, setStudentName] = useState('');
  const [studentNameEn, setStudentNameEn] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [village, setVillage] = useState('বরইতলী');
  const [postOffice, setPostOffice] = useState('বরইতলী');
  const [upazila, setUpazila] = useState('চকরিয়া');
  const [district, setDistrict] = useState('কক্সবাজার');
  const [dob, setDob] = useState('2010-05-15');
  const [grade, setGrade] = useState('10th');
  const [roll, setRoll] = useState('01');
  const [section, setSection] = useState('A');
  const [group, setGroup] = useState('বিজ্ঞান');
  const [session, setSession] = useState('২০২৬');
  const [boardRoll, setBoardRoll] = useState('');
  const [boardReg, setBoardReg] = useState('');
  const [passingYear, setPassingYear] = useState('2026');
  const [gpa, setGpa] = useState('5.00');

  // Search & Filter in Register Tab
  const [studentSearch, setStudentSearch] = useState('');
  const [listSearch, setListSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals & Popups
  const [showPrintModal, setShowPrintModal] = useState<CertificateRecord | null>(null);
  const [printLayoutOverride, setPrintLayoutOverride] = useState<CertificateLayoutStyle | null>(null);
  const [padPrintMode, setPadPrintMode] = useState<'full_pad' | 'preprinted' | 'blank_pad'>('full_pad');
  const [cancelModalCert, setCancelModalCert] = useState<CertificateRecord | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState<string>('');
  const [auditModalCert, setAuditModalCert] = useState<CertificateRecord | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Template Manager Editing State
  const [selectedTemplateToEdit, setSelectedTemplateToEdit] = useState<CertificateTemplate | null>(null);

  const loadData = useCallback(() => {
    if (typeof window === 'undefined') return;
    setCertificates(certificateService.getCertificates());
    const allSt = studentService.getAllStudents();
    setStudents(allSt);
    setSchoolSettings(settingsService.getSettings());
    setTemplates(certificateService.getTemplates());
    setCurrentUser(teacherAuthService.getSession());
  }, []);

  useEffect(() => {
    setMounted(true);
    loadData();

    // Check URL params e.g. ?action=create&studentId=xxx
    const action = searchParams.get('action');
    const studentIdParam = searchParams.get('studentId');

    if (action === 'create' || studentIdParam) {
      setActiveTab('create');
    }

    // Default ref number
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    setRefNo(`ব.উ.বি/সনদ/${year}/${rand}`);
  }, [loadData, searchParams]);

  // When students load or studentIdParam changes, select student
  useEffect(() => {
    const studentIdParam = searchParams.get('studentId');
    if (studentIdParam && students.length > 0) {
      const match = students.find((s) => s.id === studentIdParam);
      if (match) {
        setSelectedStudent(match);
      }
    }
  }, [students, searchParams]);

  // Auto-populate when student selected
  useEffect(() => {
    if (!selectedStudent) return;
    setStudentName(selectedStudent.name || '');
    setStudentNameEn((selectedStudent as any).nameEn || '');
    setFatherName(selectedStudent.fatherName || selectedStudent.guardian || '');
    setMotherName(selectedStudent.motherName || '');
    setGrade(selectedStudent.grade || '10th');
    setRoll(selectedStudent.roll || '01');
    setSection(selectedStudent.section || (selectedStudent as any).branch || 'A');
    setGroup(selectedStudent.group || 'বিজ্ঞান');
    setDob(selectedStudent.dob || '2010-05-15');
    setVillage(selectedStudent.currentAddress ? selectedStudent.currentAddress.split(',')[0]?.trim() : 'বরইতলী');
    setSession(selectedStudent.session || '২০২৬');
  }, [selectedStudent]);

  // When Cert Type Changes, update default layout style & template body
  useEffect(() => {
    const typeConfig = ALL_CERT_TYPES.find((t) => t.id === certType);
    if (typeConfig) {
      setLayoutStyle(typeConfig.defaultLayout);
    }
    const tmpl = certificateService.getTemplateForType(certType);
    if (tmpl) {
      setCustomTitle(tmpl.title);
      // Generate interpolated preview
      const interpolated = certificateService.interpolateTemplate(tmpl.bodyTemplate, {
        student_name: studentName || 'শিক্ষার্থীর নাম',
        student_id: selectedStudent?.id || 'ID-XXXX',
        roll_no: roll,
        class: grade,
        section,
        group,
        session,
        father_name: fatherName || 'পিতার নাম',
        mother_name: motherName || 'মাতার নাম',
        date_of_birth: dob,
        village,
        post_office: postOffice,
        upazila,
        district,
        school_name: schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
        gpa,
        board_roll: boardRoll,
        board_reg: boardReg,
        passing_year: passingYear,
        achievement: achievementTitle || 'বিশেষ কৃতিত্ব',
        remarks: characterRemarks
      });
      setCustomBody(interpolated);
    }

    if (certType === 'ssc_testimonial' || certType === 'transfer_certificate' || certType === 'school_leaving') {
      setIsAlumni(true);
    } else {
      setIsAlumni(false);
    }
  }, [
    certType,
    studentName,
    fatherName,
    motherName,
    grade,
    roll,
    section,
    group,
    session,
    dob,
    village,
    postOffice,
    upazila,
    district,
    schoolSettings.schoolName,
    gpa,
    boardRoll,
    boardReg,
    passingYear,
    achievementTitle,
    characterRemarks,
    selectedStudent?.id
  ]);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // Filtered Students for Selection
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.roll?.includes(q) ||
        s.id?.toLowerCase().includes(q) ||
        s.grade?.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  // Filtered Register Table
  const filteredCerts = useMemo(() => {
    return certificates.filter((c) => {
      const matchType = filterType === 'all' || c.type === filterType;
      const matchClass = filterClass === 'all' || c.grade === filterClass;
      const matchStatus = filterStatus === 'all' || c.status === filterStatus;

      const q = listSearch.toLowerCase();
      const matchSearch =
        !q ||
        c.studentName?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q) ||
        c.refNo?.toLowerCase().includes(q) ||
        c.roll?.includes(q) ||
        c.studentId?.toLowerCase().includes(q);

      return matchType && matchClass && matchStatus && matchSearch;
    });
  }, [certificates, filterType, filterClass, filterStatus, listSearch]);

  // Save / Generate Certificate Handler
  const handleSaveCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      return showAlert('error', 'অনুগ্রহ করে শিক্ষার্থীর নাম প্রদান করুন!');
    }

    const creatorName =
      currentUser?.role === 'admin'
        ? 'প্রধান শিক্ষক / অ্যাডমিন'
        : currentUser?.teacherName
        ? `${currentUser.teacherName} (শিক্ষক)`
        : 'প্রধান শিক্ষক / অ্যাডমিন';

    const payload = {
      type: certType,
      title: customTitle.trim() || undefined,
      refNo: refNo.trim() || `ব.উ.বি/সনদ/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
      issueDate,
      layoutStyle,
      status: 'valid' as CertificateStatus,

      studentId: selectedStudent?.id || `STU-${Date.now().toString().slice(-5)}`,
      studentName: studentName.trim(),
      studentNameEn: studentNameEn.trim() || undefined,
      fatherName: fatherName.trim(),
      motherName: motherName.trim(),
      roll,
      grade,
      section,
      group,
      session,
      dob,
      village: village.trim(),
      postOffice: postOffice.trim(),
      upazila: upazila.trim(),
      district: district.trim(),

      boardRoll: boardRoll.trim() || undefined,
      boardReg: boardReg.trim() || undefined,
      passingYear: passingYear.trim() || undefined,
      gpa: gpa.trim() || undefined,
      isAlumni,

      achievementTitle: achievementTitle.trim() || undefined,
      characterRemarks: characterRemarks.trim() || undefined,
      customBody: customBody.trim(),
      createdBy: creatorName
    };

    const saved = certificateService.saveCertificate(payload);
    loadData();
    setShowPrintModal(saved);
    setPrintLayoutOverride(saved.layoutStyle || 'pad');
    showAlert('success', `সনদপত্রটি (${saved.id}) সফলভাবে প্রস্তুত ও সংরক্ষিত হয়েছে!`);
  };

  // Cancel Certificate Action
  const handleConfirmCancel = () => {
    if (!cancelModalCert) return;
    if (!cancelReasonInput.trim()) {
      return showAlert('error', 'সনদপত্র বাতিলের কারণ উল্লেখ করা বাধ্যতামূলক!');
    }

    const canceller =
      currentUser?.role === 'admin'
        ? 'প্রধান শিক্ষক (অ্যাডমিন)'
        : currentUser?.teacherName || 'কর্তৃপক্ষ';

    certificateService.cancelCertificate(cancelModalCert.id, cancelReasonInput.trim(), canceller);
    loadData();
    setCancelModalCert(null);
    setCancelReasonInput('');
    showAlert('success', `সনদপত্র (${cancelModalCert.id}) সফলভাবে বাতিল করা হয়েছে।`);
  };

  // Delete Action
  const handleDeleteCert = (id: string) => {
    if (confirm('আপনি কি নিশ্চিতভাবে এই সনদপত্র রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?')) {
      certificateService.deleteCertificate(id);
      loadData();
      showAlert('success', 'সনদ রেকর্ডটি মুছে ফেলা হয়েছে!');
    }
  };

  if (!mounted) return null;

  // ── Computed Statistics ──
  const totalCerts = certificates.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthPrefix = todayStr.slice(0, 7);
  const issuedToday = certificates.filter((c) => c.issueDate === todayStr).length;
  const issuedThisMonth = certificates.filter((c) => c.issueDate?.startsWith(thisMonthPrefix)).length;
  const validCerts = certificates.filter((c) => c.status === 'valid').length;
  const cancelledCerts = certificates.filter((c) => c.status === 'cancelled').length;

  return (
    <div className="w-full space-y-6 pb-24 font-sans text-slate-800" suppressHydrationWarning>
      
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 1. TOP METRIC DASHBOARD                                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 print:hidden">
        {/* Card 1: Total */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">মোট প্রত্যয়ন</p>
              <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{totalCerts}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">সর্বমোট ইস্যুকৃত প্রত্যয়ন</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileCheck size={20} />
            </div>
          </div>
        </div>

        {/* Card 2: Today */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">আজকে ইস্যু</p>
              <p className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">{issuedToday}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">আজকে প্রস্তুতকৃত</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarDays size={20} />
            </div>
          </div>
        </div>

        {/* Card 3: This Month */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">চলতি মাস</p>
              <p className="text-2xl font-black text-sky-600 mt-1 tabular-nums">{issuedThisMonth}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">এই মাসে প্রস্তুতকৃত</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <FileText size={20} />
            </div>
          </div>
        </div>

        {/* Card 4: Valid */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">সক্রিয় প্রত্যয়ন</p>
              <p className="text-2xl font-black text-teal-600 mt-1 tabular-nums">{validCerts}</p>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">বৈধ ও সক্রিয়</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>

        {/* Card 5: Cancelled */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">বাতিলকৃত প্রত্যয়ন</p>
              <p className="text-2xl font-black text-rose-600 mt-1 tabular-nums">{cancelledCerts}</p>
              <p className="text-[10px] text-rose-500 font-medium mt-0.5">কার্যকারিতাহীন</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Ban size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 2. TAB NAVIGATION BAR                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-1.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 print:hidden">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'register', label: 'প্রত্যয়ন রেজিস্টার ও তালিকা', icon: BookOpen },
            { id: 'create', label: 'নতুন প্রত্যয়ন প্রস্তুত', icon: PlusCircle },
            { id: 'templates', label: 'টেমপ্লেট ব্যবস্থাপনা', icon: Settings2 },
            { id: 'audit', label: 'অডিট লগ ও হিস্ট্রি', icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as MainTab)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-amber-400' : ''} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab !== 'create' && (
          <button
            onClick={() => setActiveTab('create')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <PlusCircle size={15} /> নতুন প্রত্যয়ন তৈরি
          </button>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ALERT NOTIFICATION                                                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {alertMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 print:hidden animate-in fade-in slide-in-from-top-1 ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMsg.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: সনদ রেজিস্টার ও তালিকা (REGISTER & FILTER)                  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'register' && (
        <div className="space-y-4 print:hidden">
          
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="নাম, সনদ নং, আইডি বা রোল দিয়ে খুঁজুন..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white transition"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                >
                  <option value="all">সনদের ধরন: সকল ধরন</option>
                  {ALL_CERT_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Filter */}
              <div>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                >
                  <option value="all">শ্রেণি: সকল শ্রেণি</option>
                  <option value="6th">৬ষ্ঠ শ্রেণি (6th)</option>
                  <option value="7th">৭ম শ্রেণি (7th)</option>
                  <option value="8th">৮ম শ্রেণি (8th)</option>
                  <option value="9th">৯ম শ্রেণি (9th)</option>
                  <option value="10th">১০ম শ্রেণি (10th)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                >
                  <option value="all">অবস্থা: সকল অবস্থা</option>
                  <option value="valid">শুধুমাত্র সক্রিয় ও বৈধ</option>
                  <option value="cancelled">শুধুমাত্র বাতিলকৃত</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <span>মোট ফিল্টারকৃত সনদ: <strong className="text-slate-900 font-mono">{filteredCerts.length}</strong> টি</span>
              {(listSearch || filterType !== 'all' || filterClass !== 'all' || filterStatus !== 'all') && (
                <button
                  onClick={() => {
                    setListSearch('');
                    setFilterType('all');
                    setFilterClass('all');
                    setFilterStatus('all');
                  }}
                  className="text-indigo-600 hover:underline font-bold cursor-pointer"
                >
                  ফিল্টার রিসেট করুন
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-3.5">ক্রমিক</th>
                    <th className="px-4 py-3.5">সনদ নম্বর ও স্মারক</th>
                    <th className="px-4 py-3.5">শিক্ষার্থীর তথ্য</th>
                    <th className="px-4 py-3.5">প্রত্যয়নের ধরন</th>
                    <th className="px-4 py-3.5">ইস্যুর তারিখ</th>
                    <th className="px-4 py-3.5">অবস্থা</th>
                    <th className="px-4 py-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCerts.map((c, idx) => {
                    const typeConfig = ALL_CERT_TYPES.find((t) => t.id === c.type);
                    const isValid = c.status === 'valid';

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-indigo-700 block">{c.id}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{c.refNo || '—'}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900">{c.studentName}</p>
                          <p className="text-[10px] text-slate-500">
                            রোল: {c.roll} | শ্রেণি: {c.grade} ({c.section}) | আইডি: {c.studentId}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 ${
                            typeConfig?.bgColor || 'bg-slate-100'
                          } ${typeConfig?.color || 'text-slate-700'}`}>
                            {typeConfig?.title || c.type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600">{c.issueDate}</td>
                        <td className="px-4 py-3.5">
                          {isValid ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-max">
                              <CheckCircle2 size={11} /> বৈধ
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 w-max" title={c.cancellationReason}>
                              <Ban size={11} /> বাতিলকৃত
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View / Print */}
                            <button
                              onClick={() => {
                                setShowPrintModal(c);
                                setPrintLayoutOverride(c.layoutStyle || 'pad');
                              }}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 transition shadow-sm cursor-pointer"
                              title="প্রিন্ট প্রিভিউ ও ডাউনলোড"
                            >
                              <Printer size={12} /> প্রিন্ট
                            </button>

                            {/* Public Verify Link */}
                            <Link
                              href={`/verify-certificate?id=${c.id}`}
                              target="_blank"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="অনলাইন যাচাইকরণ লিংক"
                            >
                              <QrIcon size={14} />
                            </Link>

                            {/* Audit Trail Modal */}
                            <button
                              onClick={() => setAuditModalCert(c)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title="অডিট ট্রেইল ও ইতিহাস"
                            >
                              <History size={14} />
                            </button>

                            {/* Cancel Certificate */}
                            {isValid && (
                              <button
                                onClick={() => {
                                  setCancelModalCert(c);
                                  setCancelReasonInput('');
                                }}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                title="সনদটি বাতিল করুন"
                              >
                                <Ban size={14} />
                              </button>
                            )}

                            {/* Delete (Admin only) */}
                            <button
                              onClick={() => handleDeleteCert(c.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredCerts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400 space-y-2">
                        <FileText size={32} className="mx-auto text-slate-300" />
                        <p className="font-semibold text-xs text-slate-500">কোনো সনদপত্র পাওয়া যায়নি</p>
                        <p className="text-[11px] text-slate-400">নতুন সনদপত্র তৈরি করতে &quot;নতুন প্রত্যয়ন প্রস্তুত&quot; ট্যাবে যান।</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: নতুন প্রত্যয়ন প্রস্তুত (CREATE CERTIFICATE)                  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'create' && (
        <form onSubmit={handleSaveCertificate} className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
          
          {/* ── LEFT PANEL: Type & Student Selection (4 Cols) ──────────── */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Step 1: Certificate Type Selector */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">১</span>
                  প্রত্যয়নের ধরন নির্বাচন করুন
                </span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">11 Types</span>
              </div>

              <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
                {ALL_CERT_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = certType === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setCertType(t.id)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-amber-400 text-slate-950 font-black' : `${t.bgColor} ${t.color}`
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{t.title}</p>
                        <p className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {t.desc}
                        </p>
                      </div>
                      {isSelected && <CheckCircle2 size={16} className="text-amber-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Student Database Selector */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">২</span>
                  ডাটাবেস থেকে শিক্ষার্থী নির্বাচন
                </span>
                <span className="text-[10px] font-bold text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded-md">
                  {students.length} জন শিক্ষার্থী
                </span>
              </div>

              <div className="p-3 space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="নাম, রোল, শ্রেণি বা আইডি দিয়ে খুঁজুন..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                <div className="space-y-1 max-h-[220px] overflow-y-auto">
                  {filteredStudents.map((s) => {
                    const isSelected = selectedStudent?.id === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedStudent(s)}
                        className={`p-2 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div>
                          <p className="font-bold">{s.name}</p>
                          <p className={`text-[10px] ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                            রোল: {s.roll} | শ্রেণি: {s.grade} ({s.section || (s as any).branch || 'A'}) | আইডি: {s.id}
                          </p>
                        </div>
                        {isSelected && <Check size={14} className="text-white shrink-0" />}
                      </div>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <p className="text-center py-4 text-xs text-slate-400">কোনো শিক্ষার্থী পাওয়া যায়নি</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pad Format Info */}
            <div className="bg-indigo-50/70 rounded-2xl border border-indigo-200/80 p-4 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>
              <div className="text-xs">
                <p className="font-bold text-indigo-950">অফিশিয়াল স্কুল লেটারহেড প্যাড</p>
                <p className="text-[11px] text-indigo-700 mt-0.5">সকল প্রত্যয়ন পত্র স্কুলের প্রাতিষ্ঠানিক লেটারহেড প্যাডে মুদ্রিত হবে।</p>
              </div>
            </div>

          </div>

          {/* ── RIGHT PANEL: Auto-Populated Form & Live Text (8 Cols) ───── */}
          <div className="lg:col-span-8 space-y-4">
            
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-600" />
                    শিক্ষার্থী তথ্য ও প্রত্যয়ন বিবরণী
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ডাটাবেস থেকে স্বয়ংক্রিয়ভাবে যুক্ত হয়েছে। প্রয়োজনে যেকোনো তথ্য ম্যানুয়ালি সম্পাদন করা যাবে।
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAlumni}
                      onChange={(e) => setIsAlumni(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>সাবেক শিক্ষার্থী (Ex-Student)</span>
                  </label>
                </div>
              </div>

              {/* Grid 1: Basic Identifiers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">স্মারক নম্বর (Ref No)</label>
                  <input
                    type="text"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">ইস্যুর তারিখ</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">সনদের শিরোনাম</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="যেমন: অধ্যয়নরত প্রত্যয়ন পত্র"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                  />
                </div>
              </div>

              {/* Grid 2: Student & Parents */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">শিক্ষার্থীর নাম (বাংলায়) *</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">শিক্ষার্থীর নাম (English)</label>
                  <input
                    type="text"
                    value={studentNameEn}
                    onChange={(e) => setStudentNameEn(e.target.value)}
                    placeholder="e.g. MOHAMMAD SAIF"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-serif focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">জন্ম তারিখ</label>
                  <input
                    type="text"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">পিতার নাম *</label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">মাতার নাম *</label>
                  <input
                    type="text"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">শিক্ষাবর্ষ / সেশন</label>
                  <input
                    type="text"
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                  />
                </div>
              </div>

              {/* Grid 3: Class, Section, Roll */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">শ্রেণি</label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">শাখা (Section)</label>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">রোল নম্বর</label>
                  <input
                    type="text"
                    value={roll}
                    onChange={(e) => setRoll(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">গ্রুপ / বিভাগ</label>
                  <input
                    type="text"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                  />
                </div>
              </div>

              {/* Grid 4: Address Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">গ্রাম</label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">ডাকঘর</label>
                  <input
                    type="text"
                    value={postOffice}
                    onChange={(e) => setPostOffice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">উপজেলা</label>
                  <input
                    type="text"
                    value={upazila}
                    onChange={(e) => setUpazila(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">জেলা</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>
              </div>

              {/* Editable Body Text */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  সনদপত্রের মূল বিবরণী (Dynamic Certificate Body)
                </label>
                <textarea
                  rows={6}
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-serif leading-relaxed text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer size={15} /> প্রস্তুত ও প্রিন্ট প্রিভিউ দেখুন
                </button>
              </div>

            </div>

          </div>

        </form>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: টেমপ্লেট ব্যবস্থাপনা (TEMPLATE MANAGEMENT)                   */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'templates' && (
        <div className="space-y-4 print:hidden">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Settings2 size={16} className="text-indigo-600" />
                সনদপত্র টেমপ্লেট ব্যবস্থাপনা
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                প্রত্যেকটি সনদের জন্য ডিফল্ট বয়ান ও ডায়নামিক ভ্যারিয়েবল কাস্টমাইজ করুন।
              </p>
            </div>

            <button
              onClick={() => {
                if (confirm('আপনি কি সকল টেমপ্লেট সিস্টেম ডিফল্টে রিসেট করতে চান?')) {
                  const resetList = certificateService.resetTemplates();
                  setTemplates(resetList);
                  showAlert('success', 'সকল টেমপ্লেট সফলভাবে রিসেট করা হয়েছে!');
                }
              }}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer self-start sm:self-auto"
            >
              ডিফল্ট রিসেট
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 flex flex-col justify-between hover:border-indigo-300 transition">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-full">
                      {tmpl.type}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {tmpl.layoutStyle === 'royal_border' ? 'Royal Border' : 'Pad'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">{tmpl.name}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-4 font-serif bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {tmpl.bodyTemplate}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedTemplateToEdit(tmpl)}
                  className="w-full py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  টেমপ্লেট সম্পাদন করুন
                </button>
              </div>
            ))}
          </div>

          {/* Edit Template Modal */}
          {selectedTemplateToEdit && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    টেমপ্লেট এডিটর: {selectedTemplateToEdit.name}
                  </h3>
                  <button onClick={() => setSelectedTemplateToEdit(null)} className="p-1 text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">টেমপ্লেটের নাম</label>
                    <input
                      type="text"
                      value={selectedTemplateToEdit.name}
                      onChange={(e) =>
                        setSelectedTemplateToEdit({ ...selectedTemplateToEdit, name: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ডিফল্ট লেআউট</label>
                    <select
                      value={selectedTemplateToEdit.layoutStyle}
                      onChange={(e) =>
                        setSelectedTemplateToEdit({
                          ...selectedTemplateToEdit,
                          layoutStyle: e.target.value as CertificateLayoutStyle
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="pad">স্কুল লেটারহেড প্যাড (Institutional Pad)</option>
                      <option value="royal_border">রয়্যাল সনদ বর্ডার (Royal Certificate Border)</option>
                    </select>
                  </div>

                  {/* Variables Helper Pills */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">ক্লিক করে ভ্যারিয়েবল যুক্ত করুন:</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        '{{student_name}}',
                        '{{father_name}}',
                        '{{mother_name}}',
                        '{{class}}',
                        '{{roll_no}}',
                        '{{section}}',
                        '{{group}}',
                        '{{session}}',
                        '{{date_of_birth}}',
                        '{{village}}',
                        '{{achievement}}',
                        '{{board_roll}}',
                        '{{board_reg}}',
                        '{{gpa}}'
                      ].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            setSelectedTemplateToEdit({
                              ...selectedTemplateToEdit,
                              bodyTemplate: selectedTemplateToEdit.bodyTemplate + ' ' + v
                            });
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 rounded-md font-mono text-[10px] transition cursor-pointer"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">টেমপ্লেট টেক্সট বডি</label>
                    <textarea
                      rows={8}
                      value={selectedTemplateToEdit.bodyTemplate}
                      onChange={(e) =>
                        setSelectedTemplateToEdit({ ...selectedTemplateToEdit, bodyTemplate: e.target.value })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-serif text-xs leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedTemplateToEdit(null)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    onClick={() => {
                      certificateService.saveTemplate(selectedTemplateToEdit);
                      setTemplates(certificateService.getTemplates());
                      setSelectedTemplateToEdit(null);
                      showAlert('success', 'টেমপ্লেট সফলভাবে সংরক্ষিত হয়েছে!');
                    }}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                  >
                    সংরক্ষণ করুন
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: অডিট লগ ও হিস্ট্রি (AUDIT TRAIL)                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 print:hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <History size={16} className="text-indigo-600" />
                সনদপত্র কার্যক্রম অডিট ট্রেইল ও লগ
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                প্রত্যেকটি সনদপত্র তৈরি, সম্পাদন, প্রিন্ট ও বাতিলের নির্ভরযোগ্য লগ হিস্ট্রি
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {certificates.flatMap((c) =>
              (c.auditTrail || []).map((audit, aIdx) => ({
                certId: c.id,
                studentName: c.studentName,
                certType: c.type,
                ...audit,
                uniqueKey: `${c.id}-${aIdx}-${audit.timestamp}`
              }))
            )
              .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
              .slice(0, 50)
              .map((item) => (
                <div
                  key={item.uniqueKey}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start justify-between gap-4 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        item.action === 'CREATED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : item.action === 'CANCELLED'
                          ? 'bg-rose-100 text-rose-700'
                          : item.action === 'PRINTED'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {item.action === 'CREATED' ? (
                        <Check size={16} />
                      ) : item.action === 'CANCELLED' ? (
                        <Ban size={16} />
                      ) : item.action === 'PRINTED' ? (
                        <Printer size={16} />
                      ) : (
                        <History size={16} />
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">
                        {item.note || item.action} — <span className="font-mono text-indigo-600">{item.certId}</span> ({item.studentName})
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        সম্পাদনকারী: <strong className="text-slate-700">{item.performedBy}</strong>
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {item.timestamp}
                  </span>
                </div>
              ))}

            {certificates.length === 0 && (
              <p className="text-center py-8 text-xs text-slate-400">কোনো অডিট লগ পাওয়া যায়নি।</p>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PRINT / PREVIEW MODAL                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto print:p-0 print:bg-white print:relative print:z-auto print:block">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[96vh] overflow-y-auto print:overflow-visible print:shadow-none print:max-w-none print:rounded-none">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-20 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Printer size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    প্রত্যয়ন পত্র প্রিন্ট ও ভিউয়ার
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {showPrintModal.studentName} — সনদ নং: <span className="font-mono text-indigo-600">{showPrintModal.id}</span>
                  </p>
                </div>
              </div>

              {/* Pad Mode Toggle & Print Action */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPadPrintMode('full_pad')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      padPrintMode === 'full_pad' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="ডিজিটাল স্কুল লেটারহেড প্যাড (সম্পূর্ণ হেডার সহ)"
                  >
                    <FileText size={13} /> ডিজিটাল লেটারহেড প্যাড
                  </button>
                  <button
                    type="button"
                    onClick={() => setPadPrintMode('preprinted')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      padPrintMode === 'preprinted' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="স্কুলের ছাপা প্যাডের জন্য (হেডার ফাঁকা রেখে প্রিন্ট)"
                  >
                    <Sparkles size={13} /> ছাপা প্যাড
                  </button>
                </div>

                <button
                  onClick={() => {
                    certificateService.logPrintAction(showPrintModal.id, currentUser?.teacherName || 'অ্যাডমিন');
                    window.print();
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition"
                >
                  <Printer size={14} /> প্রিন্ট (A4)
                </button>

                <button
                  onClick={() => setShowPrintModal(null)}
                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Document Render Area */}
            <div className="bg-slate-100/70 p-4 sm:p-6 flex justify-center overflow-x-auto print:p-0 print:bg-transparent">
              <OfficialCertificateDoc
                cert={showPrintModal}
                settings={schoolSettings}
                overrideStyle={printLayoutOverride || showPrintModal.layoutStyle}
                mode={padPrintMode}
                onModeChange={setPadPrintMode}
              />
            </div>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* CANCEL CERTIFICATE MODAL                                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {cancelModalCert && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                <Ban size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">সনদপত্র বাতিলকরণ</h3>
                <p className="text-[11px] text-slate-400">সনদ নম্বর: {cancelModalCert.id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              আপনি কি নিশ্চিতভাবে <strong className="text-slate-900">{cancelModalCert.studentName}</strong> এর এই সনদপত্রটি বাতিল করতে চান? বাতিলকৃত সনদ অনলাইনে যাচাই করলে বাতিল হিসেবে প্রদর্শিত হবে।
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                বাতিলকরণের কারণ *
              </label>
              <textarea
                rows={3}
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="যেমন: ভুল রোল প্রদান করায় বা পুনঃইস্যুর কারণে বাতিল করা হলো..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setCancelModalCert(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                ফিরে যান
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                হ্যাঁ, বাতিল নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* AUDIT TRAIL MODAL                                                   */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {auditModalCert && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">সনদ অডিট ট্রেইল ও টাইমলাইন</h3>
                  <p className="text-[11px] text-slate-400">সনদ নং: {auditModalCert.id}</p>
                </div>
              </div>
              <button onClick={() => setAuditModalCert(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {(auditModalCert.auditTrail || []).map((audit, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{audit.action}</span>
                    <span className="text-[10px] font-mono text-slate-400">{audit.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{audit.note}</p>
                  <p className="text-[10px] text-slate-400">সম্পাদনকারী: {audit.performedBy}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setAuditModalCert(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
