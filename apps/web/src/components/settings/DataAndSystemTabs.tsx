'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  Database,
  Download,
  Globe,
  GraduationCap,
  HardDrive,
  Info,
  Printer,
  RefreshCw,
  Save,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  Users,
  Zap,
} from 'lucide-react';
import DisasterRecoveryPanel from '@/components/DisasterRecoveryPanel';
import { SecurityDeleteModal } from '@/components/SecurityDeleteModal';
import StudentBulkImportPanel from '@/components/StudentBulkImportPanel';
import FirebaseCloudSyncPanel from '@/components/dashboard/FirebaseCloudSyncPanel';
import { backupService, BackupValidationResult } from '@/services/backupService';
import { AppLanguage } from '@/services/languageService';
import { SchoolSettings, settingsService } from '@/services/settingsService';
import { SystemPurgeReport } from '@/services/systemResetService';
import { showToast } from '@/components/ui/ToastProvider';
import { SettingsCard } from './settingsShared';

interface DataSettingsTabProps {
  sessionRole?: string;
  sessionTeacherName?: string;
  setFormData: React.Dispatch<React.SetStateAction<SchoolSettings>>;
}

export function DataSettingsTab({
  sessionRole,
  sessionTeacherName,
  setFormData,
}: DataSettingsTabProps) {
  const [backupStats, setBackupStats] = useState<ReturnType<typeof backupService.getDatabaseStats> | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupAlert, setBackupAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [restoreValidation, setRestoreValidation] = useState<BackupValidationResult | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [showSecurityDeleteModal, setShowSecurityDeleteModal] = useState(false);

  const refreshBackupStats = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        setBackupStats(backupService.getDatabaseStats());
      } catch (e) {
        console.error('Failed to get database stats:', e);
      }
    }
  }, []);

  useEffect(() => {
    refreshBackupStats();
  }, [refreshBackupStats]);

  const handleDownloadFullBackup = () => {
    setIsBackingUp(true);
    try {
      const userName = sessionTeacherName || (sessionRole === 'admin' ? 'প্রধান শিক্ষক' : 'অ্যাডমিন');
      const res = backupService.downloadBackupFile(userName);
      if (res.success) {
        setBackupAlert({
          type: 'success',
          message: `সম্পূর্ণ ডেটাবেস JSON ব্যাকআপ সফলভাবে ডাউনলোড হয়েছে! ফাইল: ${res.filename} (${res.sizeKb} KB)`,
        });
        refreshBackupStats();
      } else {
        setBackupAlert({
          type: 'error',
          message: 'ব্যাকআপ তৈরিতে সমস্যা হয়েছে। ব্রাউজারের অনুমতি পরীক্ষা করুন।',
        });
      }
    } catch (e: any) {
      setBackupAlert({
        type: 'error',
        message: `ব্যাকআপ ত্রুটি: ${e?.message || 'অজানা সমস্যা'}`,
      });
    } finally {
      setIsBackingUp(false);
      setTimeout(() => setBackupAlert(null), 8000);
    }
  };

  const handleJSONFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = backupService.validateBackupFile(content);
      setRestoreValidation(validation);
      if (validation.valid) {
        setRestoreConfirmOpen(true);
      } else {
        setBackupAlert({
          type: 'error',
          message: validation.message,
        });
      }
    };
    reader.onerror = () => {
      setBackupAlert({
        type: 'error',
        message: 'ফাইলটি পড়তে সমস্যা হয়েছে।',
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExecuteRestore = () => {
    if (!restoreValidation || !restoreValidation.data) return;

    setIsRestoring(true);
    try {
      const userName = sessionTeacherName || (sessionRole === 'admin' ? 'প্রধান শিক্ষক' : 'অ্যাডমিন');
      const result = backupService.restoreDatabase(restoreValidation.data, userName);
      if (result.success) {
        setBackupAlert({ type: 'success', message: result.message });
        setRestoreConfirmOpen(false);
        setRestoreValidation(null);
        refreshBackupStats();
        setFormData(settingsService.getSettings());
        setTimeout(() => {
          window.location.reload();
        }, 1800);
      } else {
        setBackupAlert({ type: 'error', message: result.message });
      }
    } catch (e: any) {
      setBackupAlert({
        type: 'error',
        message: `রিস্টোর ত্রুটি: ${e?.message || 'অজানা ত্রুটি'}`,
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSecurityPurgeSuccess = (report: SystemPurgeReport) => {
    const msg = `সকল স্তরের ডেমো ডাটা সফলভাবে মুছে সম্পূর্ণ ফ্রেশ ডেটাবেস প্রস্তুত করা হয়েছে! (কমেন্ট: "${report.comment}")`;
    setBackupAlert({ type: 'success', message: msg });
    showToast(msg, 'success');
    refreshBackupStats();
  };

  return (
    <>
      {backupAlert && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-sm animate-in fade-in ${
            backupAlert.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 text-rose-950 border-rose-300 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {backupAlert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{backupAlert.message}</span>
          </div>
          <button onClick={() => setBackupAlert(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-black cursor-pointer ml-4">
            ✕
          </button>
        </div>
      )}

      <FirebaseCloudSyncPanel />
      <DisasterRecoveryPanel />
      <StudentBulkImportPanel />

      {/* Database Clean Reset Management */}
      <SettingsCard
        title="ডেটাবেস রিসেট ও ফ্রেশ স্টার্ট"
        subtitle="সমস্ত রেকর্ড মুছে প্রতিষ্ঠানকে সম্পূর্ণ ফ্রেশ ও খালি অবস্থায় শুরু করুন"
        icon={<Trash2 className="w-5 h-5" />}
        iconBg="bg-rose-50 dark:bg-rose-950/50"
        iconColor="text-rose-600 dark:text-rose-400"
        borderColor="border-rose-200 dark:border-rose-800"
      >
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          সিস্টেমটিকে সম্পূর্ণ ফ্রেশ অবস্থায় শুরু করতে এবং নতুনভাবে প্রতিষ্ঠানের আসল তথ্য ইনপুট দেওয়ার জন্য নিচের বাটনটি ব্যবহার করুন।
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowSecurityDeleteModal(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> সমস্ত ডেটা মুছে ফ্রেশ স্টার্ট করুন
          </button>
        </div>
      </SettingsCard>

      {/* Complete Database JSON Backup */}
      <SettingsCard
        title="সম্পূর্ণ ডেটাবেস JSON ব্যাকআপ"
        subtitle="প্রতিষ্ঠানের সকল শিক্ষার্থী, শিক্ষক, ফলাফল, উপস্থিতি, হিসাব ও সেটিংস এক ক্লিকে অফলাইনে সুরক্ষিত রাখুন"
        icon={<Database className="w-5 h-5" />}
        iconBg="bg-indigo-50 dark:bg-indigo-950/70"
        iconColor="text-indigo-600 dark:text-indigo-400"
        borderColor="border-indigo-200 dark:border-indigo-800"
        badge={
          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-[11px] font-black flex items-center gap-1 shadow-2xs">
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> ১০০% সুরক্ষিত JSON ফরম্যাট
          </span>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs">
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold block">মোট শিক্ষার্থী</span>
            <strong className="text-sm font-black text-slate-900 dark:text-slate-100 font-mono">
              {backupStats ? backupStats.studentsCount : 0} জন
            </strong>
          </div>
          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs">
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold block">শিক্ষক ও স্টাফ</span>
            <strong className="text-sm font-black text-indigo-700 dark:text-indigo-300 font-mono">
              {backupStats ? backupStats.teachersCount : 0} জন
            </strong>
          </div>
          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs">
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold block">নম্বর এন্ট্রি</span>
            <strong className="text-sm font-black text-emerald-700 dark:text-emerald-300 font-mono">
              {backupStats ? backupStats.markEntriesCount : 0} টি
            </strong>
          </div>
          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs">
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold block">হাজিরা দিন</span>
            <strong className="text-sm font-black text-teal-700 dark:text-teal-300 font-mono">
              {backupStats ? backupStats.attendanceDaysCount : 0} দিন
            </strong>
          </div>
          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs">
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold block">নোটিশ</span>
            <strong className="text-sm font-black text-rose-700 dark:text-rose-300 font-mono">
              {backupStats ? backupStats.noticesCount : 0} টি
            </strong>
          </div>
          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs">
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold block">ডেটাবেস সাইজ</span>
            <strong className="text-sm font-black text-purple-700 dark:text-purple-300 font-mono">
              {backupStats ? `${backupStats.totalSizeKb} KB` : '...'}
            </strong>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-md border border-indigo-700/60">
          <div className="space-y-1.5 max-w-xl">
            <h4 className="text-base font-black flex items-center gap-2">
              <Download className="w-5 h-5 text-sky-400" />
              এক ক্লিকে সম্পূর্ণ ডেটাবেস JSON ফাইল ডাউনলোড
            </h4>
            <p className="text-xs text-indigo-200 leading-relaxed font-normal">
              প্রতিষ্ঠানের সকল সাধারণ তথ্য, ছাত্র-ছাত্রী তালিকা, ২০২৬ শিক্ষাবর্ষের বিষয়ভিত্তিক ফলাফল ও মার্কশিট, দৈনিক হাজিরা, শিক্ষক বণ্টন ও নোটিশসমূহ একটি একক JSON ফাইলে ডাউনলোড হবে।
            </p>
            {backupStats?.lastBackup && (
              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-emerald-300 font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>সর্বশেষ ব্যাকআপ: {backupStats.lastBackup.dateBangla} ({backupStats.lastBackup.sizeKb} KB)</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleDownloadFullBackup}
            disabled={isBackingUp}
            className="w-full md:w-auto px-6 py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 dark:text-white rounded-xl font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
            <span>{isBackingUp ? 'ব্যাকআপ তৈরি হচ্ছে...' : 'সম্পূর্ণ ডেটাবেস JSON ডাউনলোড'}</span>
          </button>
        </div>

        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>গুরুত্বপূর্ণ সুরক্ষা পরামর্শ:</strong> নতুন পরীক্ষা শুরু, বার্ষিক ফলাফল প্রস্তুত কিংবা ব্রাউজার হিস্ট্রি বা উইন্ডোজ সেটআপ দেওয়ার পূর্বে অবশ্যই এই JSON ব্যাকআপ ফাইলটি ডাউনলোড করে একটি নিরাপদ পেনড্রাইভ বা গুগল ড্রাইভে সংরক্ষণ করুন।
          </div>
        </div>
      </SettingsCard>

      {/* Restore Database from JSON Backup */}
      <SettingsCard
        title="JSON ব্যাকআপ থেকে ডেটাবেস রিস্টোর"
        subtitle="পূর্বে ডাউনলোড করা যেকোনো JSON ব্যাকআপ ফাইল নির্বাচন করে সমস্ত ডেটা নিমিষে ফিরিয়ে আনুন"
        icon={<RefreshCw className="w-5 h-5" />}
        iconBg="bg-teal-50 dark:bg-teal-950/70"
        iconColor="text-teal-600 dark:text-teal-400"
        borderColor="border-teal-200 dark:border-teal-800"
      >
        <div className="p-6 border-2 border-dashed border-teal-300/80 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-950/20 rounded-2xl text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 flex items-center justify-center">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow-lg cursor-pointer transition-all active:scale-95">
              <Upload className="w-4 h-4" /> JSON ব্যাকআপ ফাইল নির্বাচন করুন
              <input type="file" accept=".json,application/json" onChange={handleJSONFileSelect} className="hidden" />
            </label>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-2">
              শুধুমাত্র .json ফরম্যাটের বৈধ ব্যাকআপ ফাইল নির্বাচন করুন
            </p>
          </div>
        </div>

        {restoreConfirmOpen && restoreValidation && restoreValidation.preview && (
          <div className="p-5 bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-2xl space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">
                  ব্যাকআপ ফাইল বিশ্লেষণ সম্পন্ন — রিস্টোর অনুমোদন দিন
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRestoreConfirmOpen(false);
                  setRestoreValidation(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 font-bold block text-[10px]">প্রতিষ্ঠানের নাম</span>
                <strong className="text-slate-900 dark:text-slate-100 block truncate">{restoreValidation.preview.schoolName}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 font-bold block text-[10px]">ব্যাকআপের সময়</span>
                <strong className="text-slate-900 dark:text-slate-100 block text-[11px]">{restoreValidation.preview.exportDateBangla}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 font-bold block text-[10px]">অন্তর্ভুক্ত শিক্ষার্থী</span>
                <strong className="text-indigo-600 dark:text-indigo-400 block font-mono">{restoreValidation.preview.studentsCount} জন</strong>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 font-bold block text-[10px]">ডেটা টেবিল কি</span>
                <strong className="text-emerald-600 dark:text-emerald-400 block font-mono">{restoreValidation.preview.totalKeys} টি কি</strong>
              </div>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong>সতর্কতা:</strong> রিস্টোর নিশ্চিত করলে বর্তমান ব্রাউজারের সকল তথ্য এই ব্যাকআপ ফাইলের তথ্য দ্বারা সফলভাবে হালনাগাদ হবে।
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRestoreConfirmOpen(false);
                  setRestoreValidation(null);
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isRestoring ? 'রিস্টোর সম্পন্ন হচ্ছে...' : 'নিশ্চিত করুন ও সম্পূর্ণ রিস্টোর করুন'}</span>
              </button>
            </div>
          </div>
        )}
      </SettingsCard>

      <SecurityDeleteModal
        isOpen={showSecurityDeleteModal}
        onClose={() => setShowSecurityDeleteModal(false)}
        onSuccess={handleSecurityPurgeSuccess}
        performedBy={sessionTeacherName || (sessionRole === 'admin' ? 'প্রধান শিক্ষক' : 'অ্যাডমিন')}
      />
    </>
  );
}

interface SystemSettingsTabProps {
  formData: SchoolSettings;
  currentLang: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  totalStudents: number;
}

export function SystemSettingsTab({
  formData,
  currentLang,
  onLanguageChange,
  totalStudents,
}: SystemSettingsTabProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyEIIN = () => {
    navigator.clipboard.writeText(formData.eiin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <SettingsCard
        title={currentLang === 'en' ? 'Language & Translation Control' : 'ভাষা ও আন্তর্জাতিকীকরণ নিয়ন্ত্রণ'}
        subtitle={
          currentLang === 'en'
            ? 'Set the default system language for dashboard, forms and reports'
            : 'সম্পূর্ণ সাইটের ডিফল্ট ভাষা নির্ধারণ ও পরিবর্তন করুন'
        }
        icon={<Globe className="w-5 h-5" />}
        iconBg="bg-indigo-50"
        iconColor="text-indigo-600"
      >
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                {currentLang === 'en' ? 'Active System Language' : 'সক্রিয় সিস্টেম ভাষা'}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {currentLang === 'en'
                  ? 'Controls navigation menu, headers, form labels, and dashboard summaries'
                  : 'মেন্যু, হেডার, ফিল্ড লেবেল ও রিপোর্টসমূহ নির্বাচিত ভাষায় প্রদর্শিত হবে'}
              </p>
            </div>
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm shrink-0">
              <button
                type="button"
                onClick={() => onLanguageChange('bn')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  currentLang === 'bn'
                    ? 'bg-indigo-600 text-white shadow-md font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🇧🇩 বাংলা
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  currentLang === 'en'
                    ? 'bg-indigo-600 text-white shadow-md font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title={currentLang === 'en' ? 'System Information & Diagnostics' : 'সিস্টেম তথ্য ও স্ট্যাটাস'}
        subtitle={
          currentLang === 'en'
            ? 'Software version, statistics & diagnostics'
            : 'সফটওয়্যার সংস্করণ, পরিসংখ্যান ও ডায়াগনোস্টিকস'
        }
        icon={<Cpu className="w-5 h-5" />}
        iconBg="bg-sky-50"
        iconColor="text-sky-600"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'সফটওয়্যার সংস্করণ', value: 'v2.0.0', icon: <Zap className="w-4 h-4" />, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50' },
            { label: 'মোট শিক্ষার্থী', value: `${totalStudents} জন`, icon: <Users className="w-4 h-4" />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50' },
            { label: 'ডাটা স্টোরেজ', value: 'LocalStorage', icon: <HardDrive className="w-4 h-4" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50' },
            { label: 'ফ্রেমওয়ার্ক', value: 'Next.js 16', icon: <Cpu className="w-4 h-4" />, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50' },
          ].map((stat, idx) => (
            <div key={idx} className={`p-4 ${stat.bg} rounded-xl border border-opacity-30 space-y-2`}>
              <div className={stat.color}>{stat.icon}</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</div>
              <div className="text-sm font-black text-slate-900 dark:text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> সিস্টেম মডিউলসমূহ
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              'ড্যাশবোর্ড', 'শিক্ষার্থী তালিকা', 'ভর্তি ফর্ম', 'পরীক্ষা ও নম্বর',
              'ফিনান্স ও ফি', 'নোটিশ বোর্ড', 'উপবৃত্তি', 'শিক্ষক প্যানেল',
              'একাডেমিক', 'সেটিংস', 'মোবাইল অ্যাপ', 'এইচআর',
            ].map((mod, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                {mod}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <div className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">প্রতিষ্ঠানের সংক্ষিপ্ত তথ্য</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">প্রতিষ্ঠান</span>
              <span className="font-black text-slate-900 dark:text-white text-sm">{formData.schoolName}</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">EIIN</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-slate-900 dark:text-white text-sm">{formData.eiin}</span>
                <button onClick={handleCopyEIIN} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">স্থাপিত</span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-sm">{formData.estdYear} খ্রি.</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-r from-indigo-50 dark:from-indigo-950/50 to-purple-50 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-1">
          <div className="text-[11px] font-black text-indigo-800 dark:text-indigo-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> ডেভেলপমেন্ট ও টেকনোলজি
          </div>
          <p className="text-[10.5px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
            স্কুল ম্যানেজমেন্ট সিস্টেম v2.0 — Next.js 16, React 19, Tailwind CSS ও LocalStorage ভিত্তিক। সকল মডিউল সম্পূর্ণ বাংলায় ডিজাইন করা হয়েছে এবং প্রিন্টের জন্য অপ্টিমাইজড।
          </p>
        </div>
      </SettingsCard>
    </>
  );
}

interface SettingsSidebarPreviewProps {
  formData: SchoolSettings;
  examNames: string[];
  currentSession: string;
  totalStudents: number;
  onSave: () => void;
}

export function SettingsSidebarPreview({
  formData,
  examNames,
  currentSession,
  totalStudents,
  onSave,
}: SettingsSidebarPreviewProps) {
  return (
    <div className="xl:col-span-4 2xl:col-span-3 space-y-6">
      <div className="sticky top-6 space-y-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest">
              <Printer className="w-3.5 h-3.5" /> লাইভ মার্কশিট প্রিভিউ
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-md text-[9px] font-bold border border-emerald-100 dark:border-emerald-800/60 animate-pulse">
              ● LIVE
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 border border-slate-300 dark:border-slate-700 rounded-none relative overflow-hidden font-sans text-slate-950 dark:text-white">
            {formData.showWatermark && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                style={{ opacity: formData.watermarkOpacity * 2.5 }}
              >
                {formData.schoolLogo ? (
                  <img src={formData.schoolLogo} alt="Watermark" className="w-[140px] h-[140px] object-contain grayscale" />
                ) : (
                  <div className="w-[120px] h-[120px] flex flex-col items-center justify-center text-slate-400">
                    <GraduationCap className="w-14 h-14 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">{formData.estdYear}</span>
                  </div>
                )}
              </div>
            )}

            <div className="relative z-10 space-y-1 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-9 h-9 flex flex-col items-center justify-center text-slate-950 dark:text-white overflow-hidden shrink-0">
                  {formData.schoolLogo ? (
                    <img src={formData.schoolLogo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-8 h-8 rounded-full border border-slate-950 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
                      <GraduationCap className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    </div>
                  )}
                </div>
                <h3 className="text-[13px] font-black text-slate-950 dark:text-white leading-tight">
                  {formData.schoolName || 'প্রতিষ্ঠানের নাম'}
                </h3>
              </div>

              <p className="text-[9px] font-bold text-slate-800 dark:text-slate-100">{formData.address || 'প্রতিষ্ঠানের ঠিকানা'}</p>
              <p className="text-[8px] font-bold text-slate-700 dark:text-slate-300 font-mono">
                স্থাপিত: {formData.estdYear || '1969'} খ্রি. । EIIN: {formData.eiin || '106184'}
              </p>

              <div className="w-full border-b border-slate-950 my-1"></div>

              <div className="text-center space-y-0.5 pt-0.5">
                <div className="text-[9px] font-black uppercase text-slate-950 dark:text-white">একাডেমিক ট্রান্সক্রিপ্ট / নম্বরপত্র</div>
                <span className="inline-block px-3 py-0.5 bg-slate-950 text-white font-black text-[8px] uppercase tracking-wider">
                  {(Array.isArray(examNames) && examNames[0]) || 'অর্ধ-বার্ষিক পরীক্ষা'} {currentSession}
                </span>
              </div>
            </div>

            <div className="pt-6 flex justify-between text-[8px] font-bold border-t border-slate-300 dark:border-slate-700 mt-4 relative z-10">
              <div>
                <div className="w-14 border-b border-slate-950 mb-0.5"></div>
                <span>{formData.classTeacherTitle}</span>
              </div>
              <div className="text-right">
                <div className="w-14 border-b border-slate-950 mb-0.5 ml-auto"></div>
                <span className="font-black">{formData.principalTitle}</span>
                {formData.principalName && (
                  <div className="text-[7px] font-normal text-slate-600 dark:text-slate-400">({formData.principalName})</div>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/60 rounded-xl text-[11px] font-medium text-indigo-900/90 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-indigo-900 dark:text-indigo-200 text-[10px]">
              <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> অটোমেটিক সিঙ্ক:
            </div>
            <p className="leading-relaxed">
              সংরক্ষিত তথ্য মার্কশিট, ট্যাবুলেশন ও অন্যান্য প্রিন্ট মডিউলে রিয়েল-টাইমে আপডেট হয়।
            </p>
          </div>

          <button
            type="button"
            onClick={onSave}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> সেটিংস সংরক্ষণ করুন
          </button>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-4 rounded-2xl border border-slate-800 text-white space-y-3">
          <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> দ্রুত পরিসংখ্যান
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">মোট শিক্ষার্থী</span>
              <span className="font-black text-white">{totalStudents}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">EIIN</span>
              <span className="font-mono font-black text-indigo-300">{formData.eiin}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">সেশন</span>
              <span className="font-black text-emerald-400">{currentSession}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">ওয়াটারমার্ক</span>
              <span className={`font-black ${formData.showWatermark ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formData.showWatermark ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
