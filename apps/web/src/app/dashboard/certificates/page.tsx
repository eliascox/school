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

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { confirmDialog } from '@/components/ui/ToastProvider';
import {
  Award,
  FileText,
  Printer,
  PlusCircle,
  Search,
  Trash2,
  Check,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  UserCheck,
  ShieldCheck,
  CalendarDays,
  BookOpen,
  Sparkles,
  QrCode as QrIcon,
  Ban,
  Settings2,
  History,
  Layers,
  Sliders,
  Download,
  Edit3,
  GraduationCap,
} from 'lucide-react';
import {
  certificateService,
  CertificateRecord,
  CertificateType,
  CertificateTemplate,
  CertificateLayoutStyle,
} from '@/services/certificateService';
import { studentService, Student } from '@/services/studentService';
import { alumniService, AlumniRecord } from '@/services/alumniService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import OfficialCertificateDoc from '@/components/OfficialCertificateDoc';
import PadSettingsPanel from '@/components/PadSettingsPanel';
import CertificateStudioWorkspace from '@/components/certificates/CertificateStudioWorkspace';
import BatchCertificateStudio from '@/components/certificates/BatchCertificateStudio';
import { ALL_CERTIFICATE_TYPES } from '@/components/certificates/certificateThemes';
import { exportElementToPng } from '@/lib/certificatePngExport';

type MainTab = 'register' | 'create' | 'batch' | 'pad-settings' | 'templates' | 'audit';

const CERT_ICON_MAP: Record<CertificateType, any> = {
  current_student: FileText,
  ssc_testimonial: GraduationCap,
  character_certificate: Award,
  transfer_certificate: ShieldCheck,
  student_verification: UserCheck,
  merit_certificate: Sparkles,
  appreciation: Award,
  participation: Layers,
  activity_certificate: FileCheck,
  custom_certificate: FileCheck,
};

const ALL_CERT_TYPES = ALL_CERTIFICATE_TYPES.map((t) => ({
  id: t.id,
  title: t.titleBn,
  desc: t.descBn,
  icon: CERT_ICON_MAP[t.id] || FileCheck,
  defaultLayout: t.defaultLayout,
  color: 'text-indigo-700 dark:text-indigo-300',
  bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
}));

export default function CertificatesPage() {
  const searchParams = useSearchParams();
  const modalSheetRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>('register');
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(settingsService.getSettings());
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Core Data
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [alumniList, setAlumniList] = useState<AlumniRecord[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);

  // Studio & Batch Sync Context (URL deep-link or Register Edit)
  const [studioStudentId, setStudioStudentId] = useState<string | undefined>(undefined);
  const [studioAlumniId, setStudioAlumniId] = useState<string | undefined>(undefined);
  const [studioCertType, setStudioCertType] = useState<CertificateType | undefined>(undefined);
  const [editingCert, setEditingCert] = useState<CertificateRecord | null>(null);
  const [batchStudentIds, setBatchStudentIds] = useState<string[]>([]);
  const [batchCertType, setBatchCertType] = useState<CertificateType>('current_student');

  // Search & Filter in Register Tab
  const [listSearch, setListSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals & Popups
  const [showPrintModal, setShowPrintModal] = useState<CertificateRecord | null>(null);
  const [showPadSettingsModal, setShowPadSettingsModal] = useState(false);
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
    setStudents(studentService.getAllStudents());
    setAlumniList(alumniService.getAlumni());
    setSchoolSettings(settingsService.getSettings());
    setTemplates(certificateService.getTemplates());
    setCurrentUser(teacherAuthService.getSession());
  }, []);

  useEffect(() => {
    setMounted(true);
    loadData();

    const action = searchParams.get('action');
    const studentIdParam = searchParams.get('studentId');
    const alumniIdParam = searchParams.get('alumniId');
    const studentIdsParam = searchParams.get('studentIds');
    const typeParam = searchParams.get('type') as CertificateType | null;
    const certIdParam = searchParams.get('certId');

    if (typeParam) {
      setStudioCertType(typeParam);
      setBatchCertType(typeParam);
    }

    if (action === 'batch' || studentIdsParam) {
      const ids = (studentIdsParam || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      setBatchStudentIds(ids);
      setActiveTab('batch');
    } else if (action === 'viewCert' && certIdParam) {
      const found = certificateService.getCertificateById(certIdParam);
      if (found) {
        setShowPrintModal(found);
        setPrintLayoutOverride(found.layoutStyle || 'pad');
      }
      setActiveTab('register');
    } else if (action === 'create' || studentIdParam || alumniIdParam) {
      setStudioStudentId(studentIdParam || undefined);
      setStudioAlumniId(alumniIdParam || undefined);
      setEditingCert(null);
      setActiveTab('create');
    }
  }, [loadData, searchParams]);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

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

  const creatorLabel =
    currentUser?.role === 'admin'
      ? 'প্রধান শিক্ষক / অ্যাডমিন'
      : currentUser?.teacherName
      ? `${currentUser.teacherName} (শিক্ষক)`
      : 'প্রধান শিক্ষক / অ্যাডমিন';

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
  const handleDeleteCert = async (id: string) => {
    if (await confirmDialog({ title: 'সনদপত্র মুছে ফেলা', message: 'আপনি কি নিশ্চিতভাবে এই সনদপত্র রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?', confirmLabel: 'মুছে ফেলুন', danger: true })) {
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
    <div className="w-full space-y-6 pb-24 font-sans text-slate-800 dark:text-slate-100" suppressHydrationWarning>
      
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 1. TOP METRIC DASHBOARD                                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 print:hidden">
        {/* Card 1: Total */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">মোট প্রত্যয়ন</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">{totalCerts}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">সর্বমোট ইস্যুকৃত প্রত্যয়ন</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileCheck size={20} />
            </div>
          </div>
        </div>

        {/* Card 2: Today */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">আজকে ইস্যু</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">{issuedToday}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">আজকে প্রস্তুতকৃত</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CalendarDays size={20} />
            </div>
          </div>
        </div>

        {/* Card 3: This Month */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">চলতি মাস</p>
              <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1 tabular-nums">{issuedThisMonth}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">এই মাসে প্রস্তুতকৃত</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <FileText size={20} />
            </div>
          </div>
        </div>

        {/* Card 4: Valid */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">সক্রিয় প্রত্যয়ন</p>
              <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1 tabular-nums">{validCerts}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">বৈধ ও সক্রিয়</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>

        {/* Card 5: Cancelled */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">বাতিলকৃত প্রত্যয়ন</p>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 tabular-nums">{cancelledCerts}</p>
              <p className="text-[10px] text-rose-500 font-medium mt-0.5">কার্যকারিতাহীন</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Ban size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 2. TAB NAVIGATION BAR                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-1.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 print:hidden">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'register', label: 'প্রত্যয়ন রেজিস্টার ও তালিকা', icon: BookOpen },
            { id: 'create', label: 'সনদ ও প্রশংসাপত্র স্টুডিও', icon: PlusCircle },
            { id: 'batch', label: 'ব্যাচ সনদ জেনারেটর', icon: Layers },
            { id: 'pad-settings', label: 'লেটারহেড প্যাড ও মার্জিন', icon: Sliders },
            { id: 'templates', label: 'টেমপ্লেট ব্যবস্থাপনা', icon: Settings2 },
            { id: 'audit', label: 'অডিট লগ ও হিস্ট্রি', icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'create' && activeTab !== 'create') {
                    setEditingCert(null);
                  }
                  setActiveTab(tab.id as MainTab);
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
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
            onClick={() => {
              setEditingCert(null);
              setStudioStudentId(undefined);
              setStudioAlumniId(undefined);
              setActiveTab('create');
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <PlusCircle size={15} /> সনদ / প্রশংসাপত্র স্টুডিও
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
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMsg.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
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
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="নাম, সনদ নং, আইডি বা রোল দিয়ে খুঁজুন..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white dark:focus:bg-slate-900 transition"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white dark:focus:bg-slate-900"
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
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white dark:focus:bg-slate-900"
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
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white dark:focus:bg-slate-900"
                >
                  <option value="all">অবস্থা: সকল অবস্থা</option>
                  <option value="valid">শুধুমাত্র সক্রিয় ও বৈধ</option>
                  <option value="cancelled">শুধুমাত্র বাতিলকৃত</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>মোট ফিল্টারকৃত সনদ: <strong className="text-slate-900 dark:text-white font-mono">{filteredCerts.length}</strong> টি</span>
              {(listSearch || filterType !== 'all' || filterClass !== 'all' || filterStatus !== 'all') && (
                <button
                  onClick={() => {
                    setListSearch('');
                    setFilterType('all');
                    setFilterClass('all');
                    setFilterStatus('all');
                  }}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                >
                  ফিল্টার রিসেট করুন
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-3.5">ক্রমিক</th>
                    <th className="px-4 py-3.5">সনদ নম্বর ও স্মারক</th>
                    <th className="px-4 py-3.5">শিক্ষার্থীর তথ্য</th>
                    <th className="px-4 py-3.5">প্রত্যয়নের ধরন</th>
                    <th className="px-4 py-3.5">ইস্যুর তারিখ</th>
                    <th className="px-4 py-3.5">অবস্থা</th>
                    <th className="px-4 py-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCerts.map((c, idx) => {
                    const typeConfig = ALL_CERT_TYPES.find((t) => t.id === c.type);
                    const isValid = c.status === 'valid';

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 block">{c.id}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{c.refNo || '—'}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900 dark:text-white">{c.studentName}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            রোল: {c.roll} | শ্রেণি: {c.grade} ({c.section}) | আইডি: {c.studentId}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 ${
                            typeConfig?.bgColor || 'bg-slate-100 dark:bg-slate-800'
                          } ${typeConfig?.color || 'text-slate-700 dark:text-slate-300'}`}>
                            {typeConfig?.title || c.type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400">{c.issueDate}</td>
                        <td className="px-4 py-3.5">
                          {isValid ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/60 flex items-center gap-1 w-max">
                              <CheckCircle2 size={11} /> বৈধ
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800/60 flex items-center gap-1 w-max" title={c.cancellationReason}>
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

                            {/* Re-open in Studio for Editing */}
                            <button
                              onClick={() => {
                                setEditingCert(c);
                                setActiveTab('create');
                              }}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition cursor-pointer"
                              title="স্টুডিওতে সম্পাদনা করুন"
                            >
                              <Edit3 size={14} />
                            </button>

                            {/* Public Verify Link */}
                            <Link
                              href={`/verify-certificate?id=${c.id}`}
                              target="_blank"
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition"
                              title="অনলাইন যাচাইকরণ লিংক"
                            >
                              <QrIcon size={14} />
                            </Link>

                            {/* Audit Trail Modal */}
                            <button
                              onClick={() => setAuditModalCert(c)}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition cursor-pointer"
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
                                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition cursor-pointer"
                                title="সনদটি বাতিল করুন"
                              >
                                <Ban size={14} />
                              </button>
                            )}

                            {/* Delete (Admin only) */}
                            <button
                              onClick={() => handleDeleteCert(c.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
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
                        <p className="font-semibold text-xs text-slate-500 dark:text-slate-400">কোনো সনদপত্র পাওয়া যায়নি</p>
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
      {/* TAB 2: সনদ ও প্রশংসাপত্র লাইভ স্টুডিও (UNIFIED SPLIT STUDIO)      */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'create' && (
        <CertificateStudioWorkspace
          students={students}
          alumniList={alumniList}
          schoolSettings={schoolSettings}
          createdByName={creatorLabel}
          initialStudentId={studioStudentId}
          initialAlumniId={studioAlumniId}
          initialType={studioCertType}
          editingCert={editingCert}
          onSaved={() => loadData()}
          onOpenPadSettings={() => setShowPadSettingsModal(true)}
          onStudentUpdated={() => loadData()}
          onNotify={(type, text) => showAlert(type, text)}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2B: ব্যাচ সনদ ও প্রশংসাপত্র জেনারেটর                           */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'batch' && (
        <BatchCertificateStudio
          students={students}
          initialSelectedIds={batchStudentIds}
          initialCertType={batchCertType}
          schoolSettings={schoolSettings}
          createdByName={creatorLabel}
          onBatchSaved={() => loadData()}
          onNotify={(type, text) => showAlert(type, text)}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: প্রাতিষ্ঠানিক লেটারহেড প্যাড ও মার্জিন কন্ট্রোল প্যানেল         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pad-settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm print:hidden">
          <PadSettingsPanel
            initialSettings={schoolSettings}
            onSaved={(updated) => setSchoolSettings(updated)}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: টেমপ্লেট ব্যবস্থাপনা (TEMPLATE MANAGEMENT)                   */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'templates' && (
        <div className="space-y-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Settings2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                সনদপত্র টেমপ্লেট ব্যবস্থাপনা
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                প্রত্যেকটি সনদের জন্য ডিফল্ট বয়ান ও ডায়নামিক ভ্যারিয়েবল কাস্টমাইজ করুন।
              </p>
            </div>

            <button
              onClick={async () => {
                if (await confirmDialog({ title: 'টেমপ্লেট রিসেট', message: 'আপনি কি সকল টেমপ্লেট সিস্টেম ডিফল্টে রিসেট করতে চান?', confirmLabel: 'রিসেট করুন', danger: true })) {
                  const resetList = certificateService.resetTemplates();
                  setTemplates(resetList);
                  showAlert('success', 'সকল টেমপ্লেট সফলভাবে রিসেট করা হয়েছে!');
                }
              }}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer self-start sm:self-auto"
            >
              ডিফল্ট রিসেট
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] rounded-full">
                      {tmpl.type}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {tmpl.layoutStyle === 'royal_border' ? 'Royal Border' : 'Pad'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">{tmpl.name}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-4 font-serif bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    {tmpl.bodyTemplate}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedTemplateToEdit(tmpl)}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  টেমপ্লেট সম্পাদন করুন
                </button>
              </div>
            ))}
          </div>

          {/* Edit Template Modal */}
          {selectedTemplateToEdit && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    টেমপ্লেট এডিটর: {selectedTemplateToEdit.name}
                  </h3>
                  <button onClick={() => setSelectedTemplateToEdit(null)} className="p-1 text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">টেমপ্লেটের নাম</label>
                    <input
                      type="text"
                      value={selectedTemplateToEdit.name}
                      onChange={(e) =>
                        setSelectedTemplateToEdit({ ...selectedTemplateToEdit, name: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">ডিফল্ট লেআউট</label>
                    <select
                      value={selectedTemplateToEdit.layoutStyle}
                      onChange={(e) =>
                        setSelectedTemplateToEdit({
                          ...selectedTemplateToEdit,
                          layoutStyle: e.target.value as CertificateLayoutStyle
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
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
                        '{{gpa}}',
                        '{{son_daughter}}',
                        '{{He_She}}',
                        '{{his_her}}',
                        '{{student_noun_bn}}',
                        '{{traits_line}}',
                        '{{purpose_line}}',
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
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-800 dark:hover:text-indigo-300 rounded-md font-mono text-[10px] transition cursor-pointer"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">টেমপ্লেট টেক্সট বডি</label>
                    <textarea
                      rows={8}
                      value={selectedTemplateToEdit.bodyTemplate}
                      onChange={(e) =>
                        setSelectedTemplateToEdit({ ...selectedTemplateToEdit, bodyTemplate: e.target.value })
                      }
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-serif text-xs leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setSelectedTemplateToEdit(null)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4 print:hidden">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <History size={16} className="text-indigo-600 dark:text-indigo-400" />
                সনদপত্র কার্যক্রম অডিট ট্রেইল ও লগ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-start justify-between gap-4 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        item.action === 'CREATED'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                          : item.action === 'CANCELLED'
                          ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                          : item.action === 'PRINTED'
                          ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                          : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
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
                      <p className="font-bold text-slate-900 dark:text-white">
                        {item.note || item.action} — <span className="font-mono text-indigo-600 dark:text-indigo-400">{item.certId}</span> ({item.studentName})
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        সম্পাদনকারী: <strong className="text-slate-700 dark:text-slate-300">{item.performedBy}</strong>
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[96vh] overflow-y-auto print:overflow-visible print:shadow-none print:max-w-none print:rounded-none">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-20 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Printer size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    প্রত্যয়ন পত্র প্রিন্ট ও ভিউয়ার
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {showPrintModal.studentName} — সনদ নং: <span className="font-mono text-indigo-600 dark:text-indigo-400">{showPrintModal.id}</span>
                  </p>
                </div>
              </div>

              {/* Pad Mode Toggle & Print Action */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPadPrintMode('full_pad')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      padPrintMode === 'full_pad' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="আপলোডকৃত প্রাতিষ্ঠানিক লেটারহেড প্যাড ব্যাকগ্রাউন্ডে থাকবে"
                  >
                    <FileText size={13} /> আপলোডকৃত প্যাড
                  </button>
                  <button
                    type="button"
                    onClick={() => setPadPrintMode('preprinted')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      padPrintMode === 'preprinted' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="স্কুলের ছাপা প্যাডের জন্য (হেডার ফাঁকা রেখে প্রিন্ট)"
                  >
                    <Sparkles size={13} /> ছাপা প্যাড
                  </button>
                </div>

                {/* Pad Settings Button */}
                <button
                  type="button"
                  onClick={() => setShowPadSettingsModal(true)}
                  className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="প্যাড আপলোড ও মার্জিন সেটিংস প্যানেল"
                >
                  <Sliders size={13} /> প্যাড সেটিংস
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!modalSheetRef.current || !showPrintModal) return;
                    const res = await exportElementToPng(modalSheetRef.current, `${showPrintModal.id}.png`);
                    if (res.ok) showAlert('success', 'PNG ছবি ডাউনলোড হয়েছে!');
                    else showAlert('error', 'PNG ডাউনলোডে সমস্যা হয়েছে — প্রিন্ট / PDF ব্যবহার করুন।');
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                >
                  <Download size={14} /> PNG ছবি
                </button>

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
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Document Render Area */}
            <div className="bg-slate-100/70 p-4 sm:p-6 flex justify-center overflow-x-auto print:p-0 print:bg-transparent">
              <OfficialCertificateDoc
                sheetRef={modalSheetRef}
                cert={showPrintModal}
                settings={schoolSettings}
                overrideStyle={printLayoutOverride || showPrintModal.layoutStyle}
                mode={padPrintMode}
                onModeChange={setPadPrintMode}
                onOpenSettings={() => setShowPadSettingsModal(true)}
              />
            </div>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PAD SETTINGS & MARGINS MODAL                                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {showPadSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-3 sm:p-5 overflow-y-auto print:hidden">
          <PadSettingsPanel
            isModal={true}
            initialSettings={schoolSettings}
            onSaved={(updated) => setSchoolSettings(updated)}
            onClose={() => setShowPadSettingsModal(false)}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* CANCEL CERTIFICATE MODAL                                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {cancelModalCert && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center">
                <Ban size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">সনদপত্র বাতিলকরণ</h3>
                <p className="text-[11px] text-slate-400">সনদ নম্বর: {cancelModalCert.id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              আপনি কি নিশ্চিতভাবে <strong className="text-slate-900 dark:text-white">{cancelModalCert.studentName}</strong> এর এই সনদপত্রটি বাতিল করতে চান? বাতিলকৃত সনদ অনলাইনে যাচাই করলে বাতিল হিসেবে প্রদর্শিত হবে।
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                বাতিলকরণের কারণ *
              </label>
              <textarea
                rows={3}
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="যেমন: ভুল রোল প্রদান করায় বা পুনঃইস্যুর কারণে বাতিল করা হলো..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setCancelModalCert(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">সনদ অডিট ট্রেইল ও টাইমলাইন</h3>
                  <p className="text-[11px] text-slate-400">সনদ নং: {auditModalCert.id}</p>
                </div>
              </div>
              <button onClick={() => setAuditModalCert(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {(auditModalCert.auditTrail || []).map((audit, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{audit.action}</span>
                    <span className="text-[10px] font-mono text-slate-400">{audit.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">{audit.note}</p>
                  <p className="text-[10px] text-slate-400">সম্পাদনকারী: {audit.performedBy}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
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
