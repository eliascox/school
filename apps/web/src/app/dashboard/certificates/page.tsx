'use client';

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 📜 SCHOOLPRO — MINIMALIST UPLOADED-PAD CERTIFICATES WORKSPACE
 * ─────────────────────────────────────────────────────────────────────────────
 * Clean, uncluttered 1-bar workspace:
 * - Single top toolbar: 3 Tabs (সনদ তৈরি | ব্যাচ প্রিন্ট | রেজিস্টার)
 *   + Pad Mode toggle (নিজস্ব প্যাড | ছাপা প্যাড) + Pad Settings modal trigger
 * - ZERO digital frame bloat, ZERO redundant stacked header bars
 * ═════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { confirmDialog } from '@/components/ui/ToastProvider';
import {
  FileText,
  Printer,
  PlusCircle,
  Search,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  BookOpen,
  QrCode as QrIcon,
  Ban,
  History,
  Layers,
  Sliders,
  Download,
  Edit3,
} from 'lucide-react';
import {
  certificateService,
  CertificateRecord,
  CertificateType,
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

type MainTab = 'create' | 'batch' | 'register' | 'pad-settings';
type PadCanvasChoice = 'uploaded_pad' | 'preprinted_pad';

function CertificatesPageContent() {
  const searchParams = useSearchParams();
  const modalSheetRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>('create');
  const [padCanvasMode, setPadCanvasMode] = useState<PadCanvasChoice>('uploaded_pad');
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(() =>
    settingsService.getSettings(),
  );
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Core Data
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [alumniList, setAlumniList] = useState<AlumniRecord[]>([]);

  // Deep-link / Edit State
  const [studioStudentId, setStudioStudentId] = useState<string | undefined>(undefined);
  const [studioAlumniId, setStudioAlumniId] = useState<string | undefined>(undefined);
  const [studioCertType, setStudioCertType] = useState<CertificateType | undefined>(undefined);
  const [editingCert, setEditingCert] = useState<CertificateRecord | null>(null);
  const [batchStudentIds, setBatchStudentIds] = useState<string[]>([]);
  const [batchCertType, setBatchCertType] = useState<CertificateType>('current_student');

  // Register Filters
  const [listSearch, setListSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals
  const [showPrintModal, setShowPrintModal] = useState<CertificateRecord | null>(null);
  const [modalPadMode, setModalPadMode] = useState<PadCanvasChoice>('uploaded_pad');
  const [cancelModalCert, setCancelModalCert] = useState<CertificateRecord | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState<string>('');
  const [auditModalCert, setAuditModalCert] = useState<CertificateRecord | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  const loadData = useCallback(() => {
    if (typeof window === 'undefined') return;
    setCertificates(certificateService.getCertificates());
    setStudents(studentService.getAllStudents());
    setAlumniList(alumniService.getAlumni());
    setSchoolSettings(settingsService.getSettings());
    setCurrentUser(teacherAuthService.getSession());
  }, []);

  useEffect(() => {
    const unsubscribe = settingsService.subscribe((updated) => {
      setSchoolSettings(updated);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setMounted(true);
    loadData();

    const action = searchParams.get('action');
    const tabParam = searchParams.get('tab');
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
        setModalPadMode(found.canvasMode === 'preprinted_pad' ? 'preprinted_pad' : 'uploaded_pad');
      }
      setActiveTab('register');
    } else if (tabParam === 'register') {
      setActiveTab('register');
    } else if (tabParam === 'pad-settings') {
      setActiveTab('pad-settings');
    } else if (action === 'create' || studentIdParam || alumniIdParam) {
      setStudioStudentId(studentIdParam || undefined);
      setStudioAlumniId(alumniIdParam || undefined);
      setEditingCert(null);
      setActiveTab('create');
    }
  }, [loadData, searchParams]);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 3800);
  };

  const registerClassOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => s.grade && set.add(s.grade));
    certificates.forEach((c) => c.grade && set.add(c.grade));
    return Array.from(set);
  }, [students, certificates]);

  const filteredCerts = useMemo(() => {
    return certificates.filter((c) => {
      const matchType = filterType === 'all' || c.type === filterType;
      const matchClass = filterClass === 'all' || c.grade === filterClass;
      const matchStatus = filterStatus === 'all' || c.status === filterStatus;
      const q = listSearch.toLowerCase();
      const matchSearch =
        !q ||
        c.studentName?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q) ||
        c.refNo?.toLowerCase().includes(q) ||
        c.roll?.includes(q);
      return matchType && matchClass && matchStatus && matchSearch;
    });
  }, [certificates, filterType, filterClass, filterStatus, listSearch]);

  const creatorLabel =
    currentUser?.role === 'admin'
      ? 'প্রধান শিক্ষক / অ্যাডমিন'
      : currentUser?.teacherName
      ? `${currentUser.teacherName} (শিক্ষক)`
      : 'প্রধান শিক্ষক / অ্যাডমিন';

  const handleConfirmCancel = () => {
    if (!cancelModalCert) return;
    if (!cancelReasonInput.trim()) {
      return showAlert('error', 'সনদ বাতিলের কারণ উল্লেখ করুন!');
    }
    const canceller =
      currentUser?.role === 'admin'
        ? 'প্রধান শিক্ষক (অ্যাডমিন)'
        : currentUser?.teacherName || 'কর্তৃপক্ষ';
    certificateService.cancelCertificate(cancelModalCert.id, cancelReasonInput.trim(), canceller);
    loadData();
    setCancelModalCert(null);
    setCancelReasonInput('');
    showAlert('success', `সনদ (${cancelModalCert.id}) বাতিল করা হয়েছে।`);
  };

  const handleDeleteCert = async (id: string) => {
    if (
      await confirmDialog({
        title: 'সনদ মুছে ফেলা',
        message: 'আপনি কি নিশ্চিতভাবে এই সনদ রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?',
        confirmLabel: 'মুছে ফেলুন',
        danger: true,
      })
    ) {
      certificateService.deleteCertificate(id);
      loadData();
      showAlert('success', 'সনদ রেকর্ডটি মুছে ফেলা হয়েছে!');
    }
  };

  if (!mounted) return null;

  const hasUploadedPad = Boolean(schoolSettings.uploadedPadTemplateUrl?.trim());

  return (
    <div
      className="w-full space-y-4 pb-20 font-sans text-slate-800 dark:text-slate-100"
      suppressHydrationWarning
    >
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SINGLE CLEAN TOP BAR (4 Inline Tabs + Pad Mode Toggle)              */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 px-2.5 py-2 shadow-xs flex flex-wrap items-center justify-between gap-2 print:hidden">
        {/* Left: 4 Focused Inline Workspace Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'create' as const, label: 'সনদ তৈরি', icon: PlusCircle },
            { id: 'batch' as const, label: 'ব্যাচ প্রিন্ট', icon: Layers },
            { id: 'register' as const, label: `রেজিস্টার (${certificates.length})`, icon: BookOpen },
            { id: 'pad-settings' as const, label: hasUploadedPad ? 'প্যাড ও মার্জিন' : 'প্যাড আপলোড', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === 'create' && activeTab !== 'create') {
                    setEditingCert(null);
                  }
                  setActiveTab(tab.id);
                }}
                className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon size={14} className={active ? 'text-amber-400' : ''} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Clean Pad Mode (Uploaded Pad | Pre-printed Pad) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setPadCanvasMode('uploaded_pad')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                padCanvasMode === 'uploaded_pad'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="আপলোডকৃত স্কুল প্যাডের ওপর প্রিন্ট হবে"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  hasUploadedPad ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              নিজস্ব প্যাড
            </button>
            <button
              type="button"
              onClick={() => setPadCanvasMode('preprinted_pad')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                padCanvasMode === 'preprinted_pad'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="প্রিন্টারে আগে থেকেই ছাপা প্যাড থাকলে শুধু লেখা প্রিন্ট হবে"
            >
              ছাপা প্যাড
            </button>
          </div>
        </div>
      </div>

      {/* Toast Alert Banner */}
      {alertMsg && (
        <div
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 print:hidden ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMsg.type === 'success' ? (
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle size={15} className="text-rose-600 shrink-0" />
            )}
            <span>{alertMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertMsg(null)}
            className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* TAB 1: MINIMALIST UPLOADED-PAD STUDIO */}
      {activeTab === 'create' && (
        <CertificateStudioWorkspace
          students={students}
          alumniList={alumniList}
          schoolSettings={schoolSettings}
          padCanvasMode={padCanvasMode}
          createdByName={creatorLabel}
          initialStudentId={studioStudentId}
          initialAlumniId={studioAlumniId}
          initialType={studioCertType}
          editingCert={editingCert}
          onSaved={() => loadData()}
          onOpenPadSettings={() => setActiveTab('pad-settings')}
          onStudentUpdated={() => loadData()}
          onNotify={(type, text) => showAlert(type, text)}
        />
      )}

      {/* TAB 2: PAD-ONLY BATCH STUDIO */}
      {activeTab === 'batch' && (
        <BatchCertificateStudio
          students={students}
          initialSelectedIds={batchStudentIds}
          initialCertType={batchCertType}
          schoolSettings={schoolSettings}
          padCanvasMode={padCanvasMode}
          createdByName={creatorLabel}
          onBatchSaved={() => loadData()}
          onOpenPadSettings={() => setActiveTab('pad-settings')}
          onNotify={(type, text) => showAlert(type, text)}
        />
      )}

      {/* TAB 4: INLINE PAD UPLOAD & MARGIN CALIBRATION (NO POPUP MODAL) */}
      {activeTab === 'pad-settings' && (
        <div className="print:hidden">
          <PadSettingsPanel
            isModal={false}
            previewMode={padCanvasMode}
            initialSettings={schoolSettings}
            onSaved={(updated) => setSchoolSettings(updated)}
          />
        </div>
      )}

      {/* TAB 3: ISSUED CERTIFICATES REGISTER */}
      {activeTab === 'register' && (
        <div className="space-y-3 print:hidden">
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="relative">
              <input
                type="text"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="নাম, সনদ নং বা রোল..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
              />
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
            >
              <option value="all">সকল ধরন</option>
              {ALL_CERTIFICATE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titleBn}
                </option>
              ))}
            </select>

            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
            >
              <option value="all">সকল শ্রেণি</option>
              {registerClassOptions.map((g) => (
                <option key={g} value={g}>
                  শ্রেণি: {g}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
            >
              <option value="all">সকল অবস্থা</option>
              <option value="valid">বৈধ</option>
              <option value="cancelled">বাতিলকৃত</option>
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-[10.5px]">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">সনদ ও স্মারক</th>
                    <th className="px-4 py-3">শিক্ষার্থী / প্রাপক</th>
                    <th className="px-4 py-3">ধরন</th>
                    <th className="px-4 py-3">তারিখ</th>
                    <th className="px-4 py-3">অবস্থা</th>
                    <th className="px-4 py-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCerts.map((c, idx) => {
                    const isValid = c.status === 'valid';
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 block">
                            {c.id}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {c.refNo || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 dark:text-white">{c.studentName}</p>
                          <p className="text-[10px] text-slate-500">
                            {c.grade ? `শ্রেণি: ${c.grade}` : 'কাস্টম'}
                            {c.roll ? ` • রোল: ${c.roll}` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                          {c.title || c.type}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500">{c.issueDate}</td>
                        <td className="px-4 py-3">
                          {isValid ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200">
                              বৈধ
                            </span>
                          ) : (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200"
                              title={c.cancellationReason}
                            >
                              বাতিল
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setShowPrintModal(c);
                                setModalPadMode(
                                  c.canvasMode === 'preprinted_pad'
                                    ? 'preprinted_pad'
                                    : 'uploaded_pad',
                                );
                              }}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[10.5px] flex items-center gap-1 cursor-pointer"
                            >
                              <Printer size={12} /> প্রিন্ট
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCert(c);
                                setActiveTab('create');
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg cursor-pointer"
                              title="সম্পাদনা"
                            >
                              <Edit3 size={14} />
                            </button>
                            <Link
                              href={`/verify-certificate?id=${c.id}`}
                              target="_blank"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg"
                              title="অনলাইন যাচাই"
                            >
                              <QrIcon size={14} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setAuditModalCert(c)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg cursor-pointer"
                              title="হিস্ট্রি"
                            >
                              <History size={14} />
                            </button>
                            {isValid && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCancelModalCert(c);
                                  setCancelReasonInput('');
                                }}
                                className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg cursor-pointer"
                                title="বাতিল"
                              >
                                <Ban size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteCert(c.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                              title="মুছুন"
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
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                        <FileText size={28} className="mx-auto mb-1.5 text-slate-300" />
                        <p className="text-xs font-bold">কোনো সনদ রেকর্ড নেই</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PRINT / PREVIEW MODAL (Pad-Only, Isolated via .print-modal-active) */}
      {showPrintModal && (
        <div className="print-modal-active fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto print:p-0 print:bg-white print:relative print:z-auto print:block">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[96vh] overflow-y-auto print:overflow-visible print:shadow-none print:max-w-none print:rounded-none">
            <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-20 print:hidden">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {showPrintModal.studentName} — {showPrintModal.title || showPrintModal.type}
                </h3>
                <p className="text-[11px] font-mono text-slate-400">{showPrintModal.id}</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setModalPadMode('uploaded_pad')}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                      modalPadMode === 'uploaded_pad'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    নিজস্ব প্যাড
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalPadMode('preprinted_pad')}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                      modalPadMode === 'preprinted_pad'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    ছাপা প্যাড
                  </button>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!modalSheetRef.current || !showPrintModal) return;
                    const res = await exportElementToPng(
                      modalSheetRef.current,
                      `${showPrintModal.id}.png`,
                    );
                    if (res.ok) showAlert('success', 'PNG ডাউনলোড হয়েছে!');
                    else showAlert('error', 'PNG ডাউনলোডে সমস্যা — প্রিন্ট ব্যবহার করুন।');
                  }}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Download size={13} /> PNG
                </button>

                <button
                  type="button"
                  onClick={() => {
                    certificateService.logPrintAction(
                      showPrintModal.id,
                      currentUser?.teacherName || 'অ্যাডমিন',
                    );
                    window.print();
                  }}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={13} /> প্রিন্ট (A4)
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="bg-slate-100/70 p-4 flex justify-center overflow-x-auto print:p-0 print:bg-transparent">
              <OfficialCertificateDoc
                sheetRef={modalSheetRef}
                cert={showPrintModal}
                settings={schoolSettings}
                canvasMode={modalPadMode}
                onOpenSettings={() => {
                  setShowPrintModal(null);
                  setActiveTab('pad-settings');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancelModalCert && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-black text-rose-600 flex items-center gap-2">
              <Ban size={18} /> সনদ বাতিলকরণ ({cancelModalCert.id})
            </h3>
            <textarea
              rows={3}
              value={cancelReasonInput}
              onChange={(e) => setCancelReasonInput(e.target.value)}
              placeholder="বাতিলকরণের কারণ লিখুন..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModalCert(null)}
                className="px-4 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                ফিরে যান
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-black cursor-pointer"
              >
                বাতিল নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT TRAIL MODAL */}
      {auditModalCert && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 space-y-3 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="text-sm font-black">হিস্ট্রি — {auditModalCert.id}</h3>
              <button
                type="button"
                onClick={() => setAuditModalCert(null)}
                className="p-1 text-slate-400 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(auditModalCert.auditTrail || []).map((audit, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="flex justify-between font-bold">
                    <span>{audit.action}</span>
                    <span className="text-[10px] font-mono text-slate-400">{audit.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{audit.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CertificatesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 font-bold">প্রত্যয়ন স্টুডিও লোড হচ্ছে...</div>
      }
    >
      <CertificatesPageContent />
    </Suspense>
  );
}
