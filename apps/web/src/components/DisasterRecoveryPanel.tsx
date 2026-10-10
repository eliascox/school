'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  Eye,
  EyeOff,
  HardDrive,
  FileCheck,
  Check,
  X,
  History,
  ShieldCheck,
  FileArchive,
  AlertCircle
} from 'lucide-react';
import { backupService, BackupMetadata, BackupRecordCounts } from '@/services/backupService';

export default function DisasterRecoveryPanel() {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [customPassword, setCustomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Restore Modal State
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<BackupMetadata | null>(null);
  const [restorePassword, setRestorePassword] = useState('');
  const [showRestorePassword, setShowRestorePassword] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Verification Modal State
  const [verificationResult, setVerificationResult] = useState<{
    fileName: string;
    isValid: boolean;
    error?: string;
    recordCounts?: BackupRecordCounts;
  } | null>(null);

  const fetchBackups = async () => {
    try {
      const list = await backupService.listBackups();
      setBackups(list);
    } catch (err) {
      console.error('Failed to load backup list', err);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setLoading(true);
    setActionAlert(null);
    try {
      const res = await backupService.createBackup(customPassword);
      if (res.success) {
        setActionAlert({
          type: 'success',
          message: `এনক্রিপ্টেড ব্যাকআপ সফলভাবে তৈরি হয়েছে (${res.fileName})! মোট শিক্ষার্থী: ${res.recordCounts?.students || 0}, ফি রেকর্ড: ${res.recordCounts?.feeCollections || 0}`,
        });
        setCustomPassword('');
        fetchBackups();
      } else {
        setActionAlert({
          type: 'error',
          message: res.error || 'ব্যাকআপ তৈরি ব্যর্থ হয়েছে।',
        });
      }
    } catch (err: any) {
      setActionAlert({
        type: 'error',
        message: `ত্রুটি: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBackup = async (b: BackupMetadata) => {
    setVerificationResult(null);
    try {
      const res = await backupService.verifyBackup(b.filePath, b.isPasswordProtected ? prompt('এই ব্যাকআপ ফাইলের পাসওয়ার্ড দিন:') || '' : undefined);
      setVerificationResult({
        fileName: b.fileName,
        isValid: res.isValid,
        error: res.error,
        recordCounts: res.recordCounts,
      });
    } catch (err: any) {
      setVerificationResult({
        fileName: b.fileName,
        isValid: false,
        error: err.message,
      });
    }
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackupForRestore) return;
    setRestoring(true);
    setRestoreError(null);

    try {
      const res = await backupService.restoreBackup(selectedBackupForRestore.filePath, restorePassword);
      if (res.success) {
        alert('ডেটাবেস সফলভাবে রিস্টোর হয়েছে! সিস্টেম এখন রিলোড হবে।');
        window.location.reload();
      } else {
        setRestoreError(res.error || 'রিস্টোর ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      setRestoreError(`ত্রুটি: ${err.message}`);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Architecture Status Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                AES-256-GCM ক্রিপ্টোগ্রাফিক সুরক্ষা
              </span>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                ২৪ ঘণ্টা অটো-ব্যাকআপ ওয়াচডগ
              </span>
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              লোকাল এনক্রিপ্টেড ব্যাকআপ ও দুর্যোগ রিকভারি ইঞ্জিন
            </h3>
            <p className="text-xs text-indigo-200/80 max-w-2xl leading-relaxed">
              সফটওয়্যারটি স্বয়ংক্রিয়ভাবে প্রতি ২৪ ঘণ্টায় লোকাল SQLite ডেটাবেস, শিক্ষার্থীর তালিকা, ফি ট্রানজ্যাকশন, পরীক্ষার নম্বর এবং সেন্ট্রাল এন্টাইটেলমেন্ট টোকেনের একটি মিলিশেকেন্ড-অখণ্ড ব্যাকআপ সংরক্ষণ করে।
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchBackups}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              title="তালিকা রিফ্রেশ"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Global Action Alert */}
      {actionAlert && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-sm animate-in fade-in ${
          actionAlert.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
        }`}>
          <div className="flex items-center gap-2.5">
            {actionAlert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{actionAlert.message}</span>
          </div>
          <button onClick={() => setActionAlert(null)} className="text-slate-400 hover:text-white cursor-pointer ml-3">✕</button>
        </div>
      )}

      {/* 2. Manual Backup Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">তাত্ক্ষণিক সম্পূর্ণ সিস্টেম ব্যাকআপ তৈরি</h4>
              <p className="text-[11px] text-slate-400">লোকাল ডেটাবেস এবং ব্রাউজার মেমোরির একটি এনক্রিপ্টেড .spbackup আর্কাইভ সংরক্ষণ করুন</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>কাস্টম এনক্রিপশন পাসওয়ার্ড (ঐচ্ছিক):</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                placeholder="ডিফল্ট মেশিন-কি ব্যবহার করতে ফাঁকা রাখুন, নতুবা পাসওয়ার্ড দিন"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              * পাসওয়ার্ড দিলে পরবর্তীতে রিস্টোরের সময় অবশ্যই এই পাসওয়ার্ডটি প্রদান করতে হবে।
            </p>
          </div>

          <div>
            <button
              onClick={handleCreateBackup}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <Download className={`w-4 h-4 ${loading ? 'animate-bounce' : ''}`} />
              <span>{loading ? 'ব্যাকআপ তৈরি হচ্ছে...' : 'এখনই ব্যাকআপ তৈরি করুন'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Local Backups History Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">সংরক্ষিত ব্যাকআপ তালিকা (Local Vault)</h4>
              <p className="text-[11px] text-slate-400">সর্বশেষ ৭টি স্বয়ংক্রিয় ও ম্যানুয়াল ব্যাকআপের নিরাপদ সংগ্রহশালা</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            মোট: {backups.length} টি
          </span>
        </div>

        {backups.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            কোনো সংরক্ষিত ব্যাকআপ ফাইল পাওয়া যায়নি। উপরে 'এখনই ব্যাকআপ তৈরি করুন' বাটনে ক্লিক করে প্রথম ব্যাকআপ তৈরি করুন।
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <th className="p-3">ফাইলের নাম</th>
                  <th className="p-3">তৈরির সময়</th>
                  <th className="p-3">ধরন</th>
                  <th className="p-3">সাইজ</th>
                  <th className="p-3">রেকর্ডস</th>
                  <th className="p-3 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {backups.map((b, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono text-[11px] text-indigo-300">
                      <div className="flex items-center gap-1.5">
                        <FileArchive className="w-4 h-4 text-slate-500" />
                        <span className="truncate max-w-xs">{b.fileName}</span>
                        {b.isPasswordProtected && (
                          <span title="পাসওয়ার্ড সুরক্ষিত">
                            <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {new Date(b.createdAt).toLocaleString('bn-BD')}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        b.isAutomated
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {b.isAutomated ? 'অটোমেটিক' : 'ম্যানুয়াল'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400">
                      {(b.sizeBytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      ছাত্র: <strong className="text-white">{b.recordCounts?.students || 0}</strong>, ফি: <strong className="text-white">{b.recordCounts?.feeCollections || 0}</strong>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleVerifyBackup(b)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition cursor-pointer"
                        >
                          যাচাই
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBackupForRestore(b);
                            setRestorePassword('');
                            setRestoreError(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition cursor-pointer"
                        >
                          রিস্টোর
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Integrity Verification Result Modal */}
      {verificationResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-400" />
                অখণ্ডতা যাচাইকরণ ফলাফল
              </h4>
              <button onClick={() => setVerificationResult(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 truncate">
                {verificationResult.fileName}
              </div>

              {verificationResult.isValid ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>ব্যাকআপ ফাইলটি ১০০% সম্পূর্ণ ও অক্ষত!</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80">
                    AES-256-GCM ডিজিটাল অথেনটিকেশন ট্যাগ এবং SHA-256 চেকসাম সফলভাবে যাচাই হয়েছে।
                  </p>
                  {verificationResult.recordCounts && (
                    <div className="pt-2 border-t border-emerald-500/20 grid grid-cols-2 gap-2 text-[11px]">
                      <div>শিক্ষার্থী সংখ্যা: <strong>{verificationResult.recordCounts.students}</strong></div>
                      <div>ফি ট্রানজ্যাকশন: <strong>{verificationResult.recordCounts.feeCollections}</strong></div>
                      <div>পরীক্ষার নম্বর: <strong>{verificationResult.recordCounts.examMarks}</strong></div>
                      <div>সিঙ্ক কিউ রেকর্ড: <strong>{verificationResult.recordCounts.syncMutations || 0}</strong></div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <span>যাচাইকরণ ব্যর্থ হয়েছে!</span>
                  </div>
                  <p className="text-[11px] text-rose-200/80">
                    {verificationResult.error || 'পাসওয়ার্ড সঠিক নয় অথবা ফাইলটির কোনো অংশ ক্ষতিগ্রস্ত হয়েছে।'}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setVerificationResult(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Safe Disaster Recovery Modal */}
      {selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <AlertCircle className="w-5 h-5" />
                <h4 className="text-base text-white">জরুরি দুর্যোগ রিকভারি ও ডেটাবেস রিস্টোর</h4>
              </div>
              <button onClick={() => setSelectedBackupForRestore(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                আপনি <strong>{selectedBackupForRestore.fileName}</strong> ব্যাকআপ থেকে সমস্ত তথ্য রিস্টোর করতে যাচ্ছেন।
              </p>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">ব্যাকআপের সময়:</span>
                  <span className="font-mono text-white">{new Date(selectedBackupForRestore.createdAt).toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">অন্তর্ভুক্ত শিক্ষার্থী:</span>
                  <span className="font-mono text-indigo-400 font-bold">{selectedBackupForRestore.recordCounts?.students || 0} জন</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ফি রেকর্ড:</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedBackupForRestore.recordCounts?.feeCollections || 0} টি</span>
                </div>
              </div>

              {selectedBackupForRestore.isPasswordProtected && (
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>ব্যাকআপের পাসওয়ার্ড দিন:</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRestorePassword ? 'text' : 'password'}
                      value={restorePassword}
                      onChange={(e) => setRestorePassword(e.target.value)}
                      placeholder="পাসওয়ার্ড লিখুন..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRestorePassword(!showRestorePassword)}
                      className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300"
                    >
                      {showRestorePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 leading-relaxed text-[11px]">
                <strong>সুরক্ষা প্রতিশ্রুতি:</strong> রিস্টোর প্রক্রিয়া শুরু করার ঠিক পূর্ব মুহূর্তে আপনার বর্তমান সিস্টেমের একটি স্বয়ংক্রিয় সেফটি স্ন্যাপশট (Pre-Restore Safety Snapshot) তৈরি হবে, যাতে কোনো অপ্রত্যাশিত পরিস্থিতিতেও আপনার ডেটা সম্পূর্ণ নিরাপদ থাকে।
              </div>

              {restoreError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
                  {restoreError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={restoring}
                onClick={() => setSelectedBackupForRestore(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                disabled={restoring}
                onClick={handleConfirmRestore}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${restoring ? 'animate-spin' : ''}`} />
                <span>{restoring ? 'রিস্টোর সম্পন্ন হচ্ছে...' : 'নিশ্চিত রিস্টোর করুন'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
