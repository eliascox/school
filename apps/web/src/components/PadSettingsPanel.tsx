'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Eye,
  FileText,
  Grid,
  Minus,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Sliders,
  Trash2,
  Type,
  Upload,
  X,
} from 'lucide-react';
import {
  DEFAULT_PAD_HEADER_FIELDS,
  DEFAULT_PAD_MARGINS,
  PadHeaderFieldsConfig,
  PadMargins,
  SchoolSettings,
  settingsService,
} from '@/services/settingsService';
import { CertificateRecord, CertificateType } from '@/services/certificateService';
import { buildDefaultRefNo, composeCertificateBody, getDefaultCertificateTitle } from '@/lib/certificateEngine';
import { processPadUpload, ProcessedPadResult } from '@/lib/padPdfRenderer';
import OfficialCertificateDoc from '@/components/OfficialCertificateDoc';
import { confirmDialog } from '@/components/ui/ToastProvider';

interface PadSettingsPanelProps {
  initialSettings?: SchoolSettings;
  onSaved?: (updated: SchoolSettings) => void;
  onClose?: () => void;
  isModal?: boolean;
  previewMode?: 'uploaded_pad' | 'preprinted_pad';
  compactLayout?: boolean;
}

type InspectorTab = 'upload' | 'margins' | 'header_boxes';

const SAMPLE_CERT_TYPES: Array<{ id: CertificateType; label: string }> = [
  { id: 'current_student', label: 'প্রত্যয়ন' },
  { id: 'character_certificate', label: 'চারিত্রিক' },
  { id: 'transfer_certificate', label: 'ছাড়পত্র' },
];

export default function PadSettingsPanel({
  initialSettings,
  onSaved,
  onClose,
  isModal = false,
  previewMode,
  compactLayout = false,
}: PadSettingsPanelProps) {
  const [settings, setSettings] = useState<SchoolSettings>(() =>
    initialSettings || settingsService.getSettings(),
  );
  const [activeTab, setActiveTab] = useState<InspectorTab>(() =>
    (initialSettings || settingsService.getSettings()).uploadedPadTemplateUrl
      ? 'margins'
      : 'upload',
  );
  const [sampleType, setSampleType] = useState<CertificateType>('current_student');
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(compactLayout ? 0.46 : 0.54);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processStatus, setProcessStatus] = useState<string>('');
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    } else {
      setSettings(settingsService.getSettings());
    }
  }, [initialSettings]);

  const currentMargins: PadMargins = {
    ...DEFAULT_PAD_MARGINS,
    ...(settings.padMargins || {}),
  };
  const headerFields: PadHeaderFieldsConfig = {
    ...DEFAULT_PAD_HEADER_FIELDS,
    ...(settings.padHeaderFields || {}),
  };
  const activeMode = previewMode
    ? previewMode === 'preprinted_pad'
      ? 'preprinted'
      : 'uploaded'
    : settings.activePadMode || (settings.uploadedPadTemplateUrl ? 'uploaded' : 'preprinted');
  const hasUploadedPad = Boolean(settings.uploadedPadTemplateUrl?.trim());

  const processSelectedFile = async (file: File) => {
    setIsProcessing(true);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setProcessStatus(
      isPdf ? 'PDF ফাইল হাই-রেজল্যুশন A4 প্যাডে কনভার্ট হচ্ছে...' : 'প্যাড ছবি অপ্টিমাইজ করা হচ্ছে...',
    );

    try {
      const result: ProcessedPadResult = await processPadUpload(file);
      if (result.error || !result.dataUrl) {
        setAlertMsg({ type: 'error', text: result.error || 'ফাইল প্রসেস করতে ব্যর্থ হয়েছে।' });
        return;
      }

      const updated: SchoolSettings = {
        ...settings,
        uploadedPadTemplateUrl: result.dataUrl,
        uploadedPadType: result.padType,
        uploadedPadFileName: result.fileName,
        uploadedPadFileSize: result.fileSize,
        uploadedPadUpdatedAt: Date.now(),
        activePadMode: 'uploaded',
        padMargins: {
          ...DEFAULT_PAD_MARGINS,
          ...(settings.padMargins || {}),
        },
        padHeaderFields: {
          ...DEFAULT_PAD_HEADER_FIELDS,
          ...(settings.padHeaderFields || {}),
        },
      };

      setSettings(updated);
      settingsService.updateSettings(updated);
      onSaved?.(updated);
      setAlertMsg({
        type: 'success',
        text: `✓ "${result.fileName}" সফলভাবে প্রাতিষ্ঠানিক প্যাড হিসেবে যুক্ত হয়েছে!`,
      });
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err?.message || 'আপলোড করতে সমস্যা হয়েছে।' });
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processSelectedFile(file);
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processSelectedFile(file);
  };

  const handleRemovePad = async () => {
    if (
      !(await confirmDialog({
        title: 'প্যাড মুছে ফেলা',
        message: 'আপনি কি আপলোডকৃত প্যাডটি স্থায়ীভাবে মুছে ফেলতে চান?',
        confirmLabel: 'মুছে ফেলুন',
        danger: true,
      }))
    ) {
      return;
    }
    const updated: SchoolSettings = {
      ...settings,
      uploadedPadTemplateUrl: '',
      uploadedPadFileName: '',
      uploadedPadFileSize: 0,
      uploadedPadUpdatedAt: Date.now(),
      activePadMode: 'preprinted',
    };
    setSettings(updated);
    settingsService.updateSettings(updated);
    onSaved?.(updated);
    setAlertMsg({ type: 'success', text: 'আপলোডকৃত প্যাড মুছে ফেলা হয়েছে।' });
  };

  const updateMargin = (key: keyof PadMargins, value: number) => {
    const clamped = Math.max(0.25, Math.min(4.5, Math.round(value * 100) / 100));
    setSettings((prev) => ({
      ...prev,
      padMargins: {
        ...DEFAULT_PAD_MARGINS,
        ...(prev.padMargins || {}),
        [key]: clamped,
      },
    }));
  };

  const updateHeaderField = <K extends keyof PadHeaderFieldsConfig>(
    key: K,
    val: PadHeaderFieldsConfig[K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      padHeaderFields: {
        ...DEFAULT_PAD_HEADER_FIELDS,
        ...(prev.padHeaderFields || {}),
        [key]: val,
      },
    }));
  };

  const stepHeaderNum = (
    key: keyof PadHeaderFieldsConfig,
    delta: number,
    min: number,
    max: number,
  ) => {
    const cur = Number(headerFields[key] ?? 0);
    const next = Math.max(min, Math.min(max, Math.round((cur + delta) * 10) / 10));
    updateHeaderField(key, next as never);
  };

  const handleResetDefaults = () => {
    setSettings((prev) => ({
      ...prev,
      padMargins: { ...DEFAULT_PAD_MARGINS },
      padHeaderFields: { ...DEFAULT_PAD_HEADER_FIELDS },
      padFontSize: 14,
      padLineHeight: 2.1,
      padSignatureGap: 2.5,
    }));
    setAlertMsg({ type: 'success', text: 'মার্জিন ও সূত্র/তারিখ বক্স আদর্শ ডিফল্টে রিসেট করা হয়েছে। সংরক্ষণ করুন।' });
  };

  const handleSave = () => {
    settingsService.updateSettings(settings);
    onSaved?.(settings);
    setSavedSuccess(true);
    setAlertMsg({ type: 'success', text: 'প্যাড ও মার্জিন সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' });
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Sample certificate using the EXACT same OfficialCertificateDoc engine for 100% WYSIWYG parity
  const sampleCert: CertificateRecord = useMemo(() => {
    const todayIso = new Date().toISOString().split('T')[0];
    const sampleDraft = {
      sourceKind: 'manual' as const,
      studentId: 'STD-001',
      studentName: 'মোঃ তানভীর হাসান',
      studentNameEn: 'Md. Tanvir Hasan',
      fatherName: 'মোঃ আবদুল মান্নান',
      fatherNameEn: 'Md. Abdul Mannan',
      motherName: 'খালেদা বেগম',
      motherNameEn: 'Khaleda Begum',
      gender: 'male' as const,
      roll: '০১',
      grade: '১০ম',
      section: 'A',
      group: 'বিজ্ঞান',
      session: String(new Date().getFullYear()),
      dob: '2010-05-15',
      birthRegNo: '',
      photoUrl: '',
      village: 'মডেলপাড়া',
      postOffice: 'সদর',
      upazila: 'সদর',
      district: 'বাংলাদেশ',
      boardRoll: '',
      boardReg: '',
      passingYear: String(new Date().getFullYear()),
      gpa: '',
      gradeLetter: '',
      gpaScale: '5.00',
      examType: 'SSC',
      boardName: '',
      studyPeriod: '',
      currentlyStudying: sampleType !== 'transfer_certificate',
    };

    return {
      id: 'SAMPLE-PREVIEW',
      verificationCode: 'VERIFY-DEMO',
      type: sampleType,
      title: getDefaultCertificateTitle(sampleType, 'bn'),
      refNo: buildDefaultRefNo(settings),
      issueDate: todayIso,
      status: 'valid',
      canvasMode: activeMode === 'preprinted' ? 'preprinted_pad' : 'uploaded_pad',
      layoutStyle: 'pad',
      studentId: sampleDraft.studentId,
      studentName: sampleDraft.studentName,
      fatherName: sampleDraft.fatherName,
      motherName: sampleDraft.motherName,
      roll: sampleDraft.roll,
      grade: sampleDraft.grade,
      section: sampleDraft.section,
      group: sampleDraft.group,
      session: sampleDraft.session,
      dob: sampleDraft.dob,
      gender: sampleDraft.gender,
      village: sampleDraft.village,
      postOffice: sampleDraft.postOffice,
      upazila: sampleDraft.upazila,
      district: sampleDraft.district,
      customBody: composeCertificateBody({
        type: sampleType,
        language: 'bn',
        draft: sampleDraft,
        schoolSettings: settings,
        selectedTraits: ['meritorious', 'regular', 'disciplined'],
        purposeId: 'general',
      }),
      language: 'bn',
      orientation: 'portrait',
      titleVariant: 'boxed',
      borderPreset: 'no_border_pad',
      showHeader: false,
      showQrCode: true,
      fontSize: settings.padFontSize || 14.5,
      createdDate: todayIso,
    };
  }, [sampleType, settings, activeMode]);

  // Alignment Guide Coordinates (A4 210 x 297 mm)
  const dayLeftMm = headerFields.dateLeftMm;
  const monthLeftMm = dayLeftMm + headerFields.dayWidthMm + headerFields.boxGapMm;
  const yearLeftMm = monthLeftMm + headerFields.monthWidthMm + headerFields.boxGapMm;

  return (
    <div
      className={`pad-settings-container flex flex-col bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden ${
        isModal
          ? 'rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-6xl w-full h-[90vh] max-h-[820px]'
          : 'rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs w-full lg:h-[calc(100vh-175px)] min-h-[680px]'
      }`}
    >
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 1. COMPACT EXECUTIVE TOP BAR (Single Clean Row)                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sliders size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
              প্যাড ও মার্জিন ক্যালিব্রেশন
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {hasUploadedPad
                ? `সক্রিয় প্যাড: ${settings.uploadedPadFileName || 'অফিশিয়াল প্যাড'}`
                : 'আপনার প্রতিষ্ঠানের PDF বা ছবির প্যাড আপলোড ও মার্জিন সেট করুন'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Show internal mode toggle only when opened standalone/modal (inline tab uses page top bar) */}
          {!previewMode && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setSettings((p) => ({ ...p, activePadMode: 'uploaded' }))}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeMode === 'uploaded'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Upload size={12} /> নিজস্ব প্যাড
              </button>
              <button
                type="button"
                onClick={() => setSettings((p) => ({ ...p, activePadMode: 'preprinted' }))}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeMode === 'preprinted'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Printer size={12} /> ছাপা প্যাড
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
            title="আদর্শ ডিফল্ট মার্জিন ও বক্স পজিশন রিসেট"
          >
            <RotateCcw size={13} /> রিসেট
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            {savedSuccess ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {savedSuccess ? 'সংরক্ষিত!' : 'সংরক্ষণ করুন'}
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="বন্ধ করুন"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Inline Alert Bar */}
      {alertMsg && (
        <div
          className={`px-4 py-2 text-xs font-bold flex items-center justify-between gap-2 border-b shrink-0 ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMsg.type === 'success' ? (
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle size={14} className="text-rose-600 shrink-0" />
            )}
            <span>{alertMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertMsg(null)}
            className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 2. SPLIT-PANE DESIGNER BODY (Left Inspector | Right Live A4 Stage)  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* ─── LEFT INSPECTOR (5 Cols, Independent Scroll) ─── */}
        <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col min-h-0 bg-white dark:bg-slate-900">
          {/* 3 Clean Inspector Tabs */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-1 bg-slate-50/70 dark:bg-slate-950/50 shrink-0">
            {[
              { id: 'upload' as const, label: compactLayout ? 'প্যাড ফাইল' : 'প্যাড ফাইল', shortLabel: 'প্যাড', icon: Upload },
              { id: 'margins' as const, label: compactLayout ? 'মার্জিন' : 'মার্জিন ও ফন্ট', shortLabel: 'মার্জিন', icon: Sliders },
              { id: 'header_boxes' as const, label: compactLayout ? 'সূত্র/তারিখ' : 'সূত্র ও তারিখ', shortLabel: 'সূত্র/তারিখ', icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer ${
                    active
                      ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={12} className={active ? 'text-amber-300 shrink-0' : 'shrink-0'} />
                  <span className="truncate">{compactLayout ? tab.shortLabel : tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scrollable Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* ═════ TAB 1: UPLOAD & ACTIVE PAD ═════ */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                {/* Drag & Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/60 hover:border-indigo-400'
                  }`}
                >
                  {isProcessing ? (
                    <div className="py-4 space-y-2">
                      <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin mx-auto" />
                      <p className="font-bold text-indigo-900 dark:text-indigo-200">
                        {processStatus}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                        <Upload size={20} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white">
                          {hasUploadedPad ? 'নতুন প্যাড দিয়ে পরিবর্তন করুন' : 'প্রতিষ্ঠানের প্যাড আপলোড করুন'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          A4 সাইজের <strong>PDF</strong>, <strong>PNG</strong> বা <strong>JPG</strong> ফাইল ড্র্যাগ বা সিলেক্ট করুন
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition">
                        <Upload size={14} /> ফাইল নির্বাচন করুন
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleFileInputChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Active Uploaded Pad Card */}
                {hasUploadedPad && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={settings.uploadedPadTemplateUrl}
                        alt="Pad thumbnail"
                        className="w-11 h-14 object-cover rounded-lg border border-emerald-300 bg-white shrink-0 shadow-2xs"
                      />
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase">
                          <CheckCircle2 size={11} /> প্যাড সক্রিয় (
                          {settings.uploadedPadType === 'pdf' ? 'PDF' : 'ছবি'})
                        </span>
                        <p className="font-black text-slate-900 dark:text-white truncate mt-0.5">
                          {settings.uploadedPadFileName || 'স্কুল লেটারহেড প্যাড'}
                        </p>
                        {settings.uploadedPadFileSize ? (
                          <p className="text-[10.5px] text-slate-500 font-mono">
                            {Math.round(settings.uploadedPadFileSize / 1024)} KB
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemovePad}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 text-rose-600 border border-rose-200 dark:border-rose-800 cursor-pointer shrink-0 transition"
                      title="প্যাড মুছে ফেলুন"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                {/* Institutional Ref Prefix */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <label className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText size={13} className="text-indigo-600" />
                    ডিফল্ট স্মারক / সূত্র প্রিফিক্স
                  </label>
                  <input
                    type="text"
                    value={settings.padRefPrefix || ''}
                    onChange={(e) => setSettings({ ...settings, padRefPrefix: e.target.value })}
                    placeholder="যেমন: ব.উ.বি বা MHS"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-xs"
                  />
                  <p className="text-[10.5px] text-slate-500">
                    নমুনা স্মারক:{' '}
                    <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                      {sampleCert.refNo}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* ═════ TAB 2: MARGINS & TYPOGRAPHY ═════ */}
            {activeTab === 'margins' && (
              <div className="space-y-4">
                {/* 3 Quick Presets */}
                <div className="space-y-1.5">
                  <span className="text-[10.5px] font-bold text-slate-500">কুইক মার্জিন প্রিসেট</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      {
                        label: 'আদর্শ (২.৪")',
                        margins: { ...DEFAULT_PAD_MARGINS },
                      },
                      {
                        label: 'ছোট হেডার (২.০")',
                        margins: { top: 2.0, bottom: 0.8, left: 0.65, right: 0.65 },
                      },
                      {
                        label: 'বড় হেডার (৩.০")',
                        margins: { top: 3.0, bottom: 1.0, left: 0.8, right: 0.8 },
                      },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setSettings((p) => ({ ...p, padMargins: preset.margins }))}
                        className="py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-200 font-bold text-[11px] transition cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4 Margins Grid (Clean Compact Cards with +/- Nudge & Live mm) */}
                <div className="space-y-1.5">
                  <span className="text-[10.5px] font-bold text-slate-500">চারপাশের মার্জিন (ইঞ্চি · মিমি)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(
                      [
                        { key: 'top' as const, label: 'উপর', min: 0.5, max: 4.5 },
                        { key: 'bottom' as const, label: 'নিচ', min: 0.4, max: 3.0 },
                        { key: 'left' as const, label: 'বাম', min: 0.3, max: 2.2 },
                        { key: 'right' as const, label: 'ডান', min: 0.3, max: 2.2 },
                      ]
                    ).map((m) => {
                      const val = currentMargins[m.key];
                      return (
                        <div
                          key={m.key}
                          className="min-w-0 overflow-hidden p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-1 min-w-0">
                            <span className="font-black text-[11px] text-slate-800 dark:text-slate-100 whitespace-nowrap shrink-0">
                              {m.label}
                            </span>
                            <span className="font-mono font-bold text-[10px] text-indigo-700 dark:text-indigo-300 whitespace-nowrap truncate">
                              {val.toFixed(2)}&quot; · {Math.round(val * 25.4)}mm
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => updateMargin(m.key, val - 0.05)}
                              className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer shrink-0"
                            >
                              <Minus size={11} />
                            </button>
                            <input
                              type="range"
                              min={m.min}
                              max={m.max}
                              step={0.05}
                              value={val}
                              onChange={(e) => updateMargin(m.key, parseFloat(e.target.value))}
                              className="flex-1 min-w-0 w-full accent-indigo-600 cursor-pointer"
                            />
                            <button
                              type="button"
                              onClick={() => updateMargin(m.key, val + 0.05)}
                              className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer shrink-0"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Typography & Signature Spacing */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 space-y-3">
                  <span className="font-black text-[11px] text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Type size={13} className="text-indigo-600" /> লেখা ও স্বাক্ষর স্পেসিং
                  </span>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-600 dark:text-slate-400">ফন্ট সাইজ</span>
                      <span className="font-mono text-indigo-700 dark:text-indigo-300">
                        {settings.padFontSize || 14} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={18}
                      step={0.5}
                      value={settings.padFontSize || 14}
                      onChange={(e) =>
                        setSettings({ ...settings, padFontSize: parseFloat(e.target.value) })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-600 dark:text-slate-400">লাইন ব্যবধান</span>
                      <span className="font-mono text-indigo-700 dark:text-indigo-300">
                        {(settings.padLineHeight || 2.1).toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1.6}
                      max={2.6}
                      step={0.1}
                      value={settings.padLineHeight || 2.1}
                      onChange={(e) =>
                        setSettings({ ...settings, padLineHeight: parseFloat(e.target.value) })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-600 dark:text-slate-400">
                        স্বাক্ষরের অটো দূরত্ব
                      </span>
                      <span className="font-mono text-indigo-700 dark:text-indigo-300">
                        {(settings.padSignatureGap ?? 2.5).toFixed(2)} rem
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1.0}
                      max={5.0}
                      step={0.25}
                      value={settings.padSignatureGap ?? 2.5}
                      onChange={(e) =>
                        setSettings({ ...settings, padSignatureGap: parseFloat(e.target.value) })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ═════ TAB 3: HEADER REF & DATE BOXES PRECISION ALIGNMENT ═════ */}
            {activeTab === 'header_boxes' && (
              <div className="space-y-3.5">
                {/* Placement Switch */}
                <div className="space-y-1.5">
                  <span className="text-[10.5px] font-bold text-slate-500">
                    স্মারক (সূত্র) ও তারিখের অবস্থান
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    {[
                      { id: 'pad_header_boxes' as const, label: 'প্যাডের বক্সে' },
                      { id: 'inline_below' as const, label: 'বডির উপরে' },
                      { id: 'hide_ref_date' as const, label: 'লুকানো' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateHeaderField('placement', opt.id)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-black transition cursor-pointer ${
                          headerFields.placement === opt.id
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {headerFields.placement === 'pad_header_boxes' && (
                  <>
                    {/* 1. Ref (সূত্র:) Position Card */}
                    <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2.5">
                      <span className="font-black text-[11.5px] text-indigo-950 dark:text-indigo-200 block">
                        সূত্র / স্মারক অবস্থান (mm)
                      </span>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { key: 'refTopMm' as const, label: 'উপর থেকে', min: 10, max: 120 },
                          { key: 'refLeftMm' as const, label: 'বাম থেকে', min: 5, max: 120 },
                        ].map((f) => (
                          <div key={f.key} className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                              {f.label}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => stepHeaderNum(f.key, -0.5, f.min, f.max)}
                                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center hover:bg-indigo-100 cursor-pointer"
                              >
                                <Minus size={11} />
                              </button>
                              <input
                                type="number"
                                step="0.5"
                                value={headerFields[f.key]}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value);
                                  if (!Number.isNaN(v)) updateHeaderField(f.key, v);
                                }}
                                className="w-full px-2 py-1 text-center rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 font-mono font-black text-indigo-700 dark:text-indigo-300"
                              />
                              <button
                                type="button"
                                onClick={() => stepHeaderNum(f.key, 0.5, f.min, f.max)}
                                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center hover:bg-indigo-100 cursor-pointer"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2. Date Boxes [দিন][মাস][সাল] Position & Size Card */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2.5">
                      <span className="font-black text-[11.5px] text-emerald-950 dark:text-emerald-200 block">
                        তারিখ বক্স [দিন][মাস][সাল] অ্যালাইনমেন্ট (mm)
                      </span>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { key: 'dateTopMm' as const, label: 'উপর থেকে', step: 0.5, min: 10, max: 120 },
                          { key: 'dateLeftMm' as const, label: 'বাম থেকে', step: 0.5, min: 80, max: 200 },
                          { key: 'dayWidthMm' as const, label: 'দিন/মাস প্রস্থ', step: 0.2, min: 5, max: 20 },
                          { key: 'yearWidthMm' as const, label: 'সাল প্রস্থ', step: 0.2, min: 8, max: 30 },
                          { key: 'boxHeightMm' as const, label: 'বক্স উচ্চতা', step: 0.2, min: 4, max: 15 },
                          { key: 'fontSizePx' as const, label: 'বক্স ফন্ট (px)', step: 0.5, min: 9, max: 18 },
                        ].map((f) => (
                          <div key={f.key} className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                              {f.label}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (f.key === 'dayWidthMm') {
                                    const next = Math.max(
                                      f.min,
                                      Math.round((headerFields.dayWidthMm - f.step) * 10) / 10,
                                    );
                                    setSettings((prev) => ({
                                      ...prev,
                                      padHeaderFields: {
                                        ...headerFields,
                                        dayWidthMm: next,
                                        monthWidthMm: +(next + 0.2).toFixed(1),
                                      },
                                    }));
                                  } else {
                                    stepHeaderNum(f.key, -f.step, f.min, f.max);
                                  }
                                }}
                                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center hover:bg-emerald-100 cursor-pointer"
                              >
                                <Minus size={11} />
                              </button>
                              <input
                                type="number"
                                step={f.step}
                                value={headerFields[f.key]}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value);
                                  if (Number.isNaN(v)) return;
                                  if (f.key === 'dayWidthMm') {
                                    setSettings((prev) => ({
                                      ...prev,
                                      padHeaderFields: {
                                        ...headerFields,
                                        dayWidthMm: v,
                                        monthWidthMm: +(v + 0.2).toFixed(1),
                                      },
                                    }));
                                  } else {
                                    updateHeaderField(f.key, v);
                                  }
                                }}
                                className="w-full px-2 py-1 text-center rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 font-mono font-black text-emerald-700 dark:text-emerald-300"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (f.key === 'dayWidthMm') {
                                    const next = Math.min(
                                      f.max,
                                      Math.round((headerFields.dayWidthMm + f.step) * 10) / 10,
                                    );
                                    setSettings((prev) => ({
                                      ...prev,
                                      padHeaderFields: {
                                        ...headerFields,
                                        dayWidthMm: next,
                                        monthWidthMm: +(next + 0.2).toFixed(1),
                                      },
                                    }));
                                  } else {
                                    stepHeaderNum(f.key, f.step, f.min, f.max);
                                  }
                                }}
                                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center hover:bg-emerald-100 cursor-pointer"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT LIVE A4 CALIBRATION CANVAS (7 Cols, Fixed Viewport) ─── */}
        <div className="lg:col-span-7 flex flex-col min-h-0 bg-slate-100/90 dark:bg-slate-950">
          {/* Canvas Control Bar */}
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-2 shrink-0 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-700 dark:text-slate-200 flex items-center gap-1">
                <Eye size={13} className="text-indigo-600" /> A4 লাইভ প্রিভিউ
              </span>
              <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 font-bold">
                {SAMPLE_CERT_TYPES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSampleType(s.id)}
                    className={`px-2 py-0.5 rounded-md cursor-pointer transition ${
                      sampleType === s.id
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGuides((v) => !v)}
                className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 cursor-pointer transition ${
                  showGuides
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <Grid size={12} /> গাইডলাইন
              </button>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.42, +(z - 0.06).toFixed(2)))}
                  className="p-0.5 hover:bg-white dark:hover:bg-slate-800 rounded cursor-pointer"
                >
                  <Minus size={11} />
                </button>
                <span className="w-8 text-center">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(0.85, +(z + 0.06).toFixed(2)))}
                  className="p-0.5 hover:bg-white dark:hover:bg-slate-800 rounded cursor-pointer"
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          </div>

          {/* Centered Scrollable A4 Stage */}
          <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
            <div
              style={{
                width: `${Math.round(794 * zoom)}px`,
                height: `${Math.round(1122 * zoom)}px`,
                flexShrink: 0,
              }}
            >
              <div
                className="relative origin-top-left"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  width: '210mm',
                  height: '297mm',
                }}
              >
                <OfficialCertificateDoc
                  cert={sampleCert}
                  settings={settings}
                  canvasMode={activeMode === 'preprinted' ? 'preprinted_pad' : 'uploaded_pad'}
                  hideHeaderActions={true}
                />

                {/* Interactive Alignment Guides Overlay (Margins + Ref/Date Boxes) */}
                {showGuides && (
                  <div
                    className="absolute inset-0 pointer-events-none select-none"
                    style={{ zIndex: 30 }}
                    aria-hidden="true"
                  >
                    {/* Safe Text Margin Rectangle */}
                    <div
                      style={{
                        position: 'absolute',
                        top: `${currentMargins.top}in`,
                        bottom: `${currentMargins.bottom}in`,
                        left: `${currentMargins.left}in`,
                        right: `${currentMargins.right}in`,
                        border: '1.5px dashed rgba(79, 70, 229, 0.55)',
                        backgroundColor: 'rgba(79, 70, 229, 0.02)',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: '-18px',
                          left: '0',
                          fontSize: '10px',
                          fontWeight: 800,
                          color: '#4338ca',
                          backgroundColor: 'rgba(238, 242, 255, 0.92)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        লেখার নিরাপদ সীমানা ({currentMargins.top}&quot; / {currentMargins.left}&quot; / {currentMargins.right}&quot; / {currentMargins.bottom}&quot;)
                      </span>
                    </div>

                    {/* Ref & Date Box Alignment Outlines */}
                    {headerFields.placement === 'pad_header_boxes' && (
                      <>
                        <div
                          style={{
                            position: 'absolute',
                            top: `${((headerFields.refTopMm / 297) * 100).toFixed(4)}%`,
                            left: `${((headerFields.refLeftMm / 210) * 100).toFixed(4)}%`,
                            width: '28%',
                            height: `${((headerFields.boxHeightMm / 297) * 100).toFixed(4)}%`,
                            border: '1.5px dashed rgba(79, 70, 229, 0.85)',
                            backgroundColor: 'rgba(79, 70, 229, 0.08)',
                            borderRadius: '3px',
                          }}
                        />
                        {[
                          { leftMm: dayLeftMm, widthMm: headerFields.dayWidthMm },
                          { leftMm: monthLeftMm, widthMm: headerFields.monthWidthMm },
                          { leftMm: yearLeftMm, widthMm: headerFields.yearWidthMm },
                        ].map((b, i) => (
                          <div
                            key={i}
                            style={{
                              position: 'absolute',
                              top: `${((headerFields.dateTopMm / 297) * 100).toFixed(4)}%`,
                              left: `${((b.leftMm / 210) * 100).toFixed(4)}%`,
                              width: `${((b.widthMm / 210) * 100).toFixed(4)}%`,
                              height: `${((headerFields.boxHeightMm / 297) * 100).toFixed(4)}%`,
                              border: '1.5px dashed rgba(5, 150, 105, 0.9)',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              borderRadius: '2px',
                            }}
                          />
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
