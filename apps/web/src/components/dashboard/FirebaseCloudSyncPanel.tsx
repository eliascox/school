'use client';

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Database,
  ShieldCheck,
  Server,
  Zap,
  HardDrive
} from 'lucide-react';
import { firebaseSyncService, CloudSyncProgress, CloudSyncStatus } from '@/services/firebaseSyncService';
import { studentService } from '@/services/studentService';

export default function FirebaseCloudSyncPanel() {
  const [status, setStatus] = useState<CloudSyncStatus>(firebaseSyncService.getStatus());
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<CloudSyncProgress | null>(null);

  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState<CloudSyncProgress | null>(null);

  const [localStudentCount, setLocalStudentCount] = useState<number>(0);

  useEffect(() => {
    setLocalStudentCount(studentService.getAllStudents().length);
    setStatus(firebaseSyncService.getStatus());
  }, []);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await firebaseSyncService.testConnection();
      setTestResult(res);
      setStatus(firebaseSyncService.getStatus());
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || 'সংযোগ পরীক্ষা ব্যর্থ হয়েছে।'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleUploadAll = async () => {
    if (!window.confirm(`আপনি কি লোকাল ডিভাইসের সকল ডাটা (${localStudentCount} জন শিক্ষার্থী ও সেটিংস) গুগল ক্লাউড ফায়ারবেসে আপলোড করতে চান?`)) {
      return;
    }

    setIsUploading(true);
    setUploadProgress({
      step: 'শুরু হচ্ছে...',
      current: 0,
      total: 100,
      percent: 0,
      status: 'syncing'
    });

    try {
      await firebaseSyncService.uploadAllToCloud((p) => {
        setUploadProgress(p);
      });
      setStatus(firebaseSyncService.getStatus());
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePullAll = async () => {
    if (!window.confirm('আপনি কি গুগল ক্লাউড থেকে সর্বশেষ ডাটা ডাউনলোড করে এই ডিভাইসে প্রতিস্থাপন করতে চান?')) {
      return;
    }

    setIsPulling(true);
    setPullProgress({
      step: 'ক্লাউড অনুসন্ধান করা হচ্ছে...',
      current: 0,
      total: 100,
      percent: 0,
      status: 'syncing'
    });

    try {
      const res = await firebaseSyncService.pullAllFromCloud((p) => {
        setPullProgress(p);
      });
      setLocalStudentCount(res.studentCount);
      setStatus(firebaseSyncService.getStatus());
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsPulling(false);
    }
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'এখনও সিঙ্ক করা হয়নি';
    try {
      return new Date(isoString).toLocaleString('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-sky-200 dark:border-sky-900/60 p-6 sm:p-7 shadow-sm space-y-6">
      
      {/* Header with Cloud Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
            <Cloud className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Google Firebase ক্লাউড ডাটাবেজ
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                সক্রিয়
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              প্রজেক্ট: <strong className="font-mono text-sky-600 dark:text-sky-400">{status.projectId}</strong> • ক্লাউড ফায়ারস্টোর লাইভ সিঙ্ক
            </p>
          </div>
        </div>

        {/* Test Connection Button */}
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={testingConnection}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin text-sky-600' : ''}`} />
          <span>{testingConnection ? 'সংযোগ পরীক্ষা হচ্ছে...' : 'সংযোগ পরীক্ষা করুন'}</span>
        </button>
      </div>

      {/* Test Result Toast */}
      {testResult && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 border animate-in fade-in ${
          testResult.success
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
        }`}>
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Info Tiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <Server className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>ক্লাউড প্রজেক্ট আইডি</span>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm font-mono font-black text-slate-900 dark:text-white truncate">
            {status.projectId}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>লোকাল ডিভাইসে শিক্ষার্থী</span>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm font-black text-slate-900 dark:text-white">
            {localStudentCount} জন
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>ইন্টারনেট স্ট্যাটাস</span>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
            <span className={`w-2 h-2 rounded-full ${status.isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {status.isOnline ? 'অনলাইন (সিঙ্ক প্রস্তুত)' : 'অফলাইন'}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>সর্বশেষ ক্লাউড সিঙ্ক</span>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            {formatDate(status.lastSyncTime)}
          </p>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        
        {/* Card 1: Upload to Cloud */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-sky-50/50 to-white dark:from-sky-950/20 dark:to-slate-900 border border-sky-200 dark:border-sky-900 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-extrabold text-sm">
              <CloudUpload className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <span>লোকাল ডাটা ক্লাউডে আপলোড করুন</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              আপনার কম্পিউটার বা মোবাইলে থাকা শিক্ষার্থী, প্রতিষ্ঠান সেটিংস ও ক্লাস ডাটা এক ক্লিকে গুগল ক্লাউড ফায়ারবেসে পাঠিয়ে দিন। এরপর অন্য যেকোনো ডিভাইস থেকে এটি পাওয়া যাবে।
            </p>
          </div>

          {/* Upload Progress Bar */}
          {uploadProgress && (
            <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800 text-xs">
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200">
                <span>{uploadProgress.step}</span>
                <span>{uploadProgress.percent}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleUploadAll}
            disabled={isUploading || isPulling}
            className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>ক্লাউডে পাঠানো হচ্ছে...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4" />
                <span>ক্লাউডে সম্পূর্ণ ডাটা ব্যাকআপ করুন</span>
              </>
            )}
          </button>
        </div>

        {/* Card 2: Pull from Cloud */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900 border border-indigo-200 dark:border-indigo-900 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-extrabold text-sm">
              <CloudDownload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>ক্লাউড থেকে ডাটা পুনরুদ্ধার / সিঙ্ক করুন</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              নতুন ল্যাপটপ, ফোন বা অন্য কোনো ব্রাউজার খুললে গুগল ফায়ারবেস ক্লাউড থেকে সর্বশেষ ডাটা নামিয়ে এনে এই ডিভাইসে তাৎক্ষণিক সক্রিয় করুন।
            </p>
          </div>

          {/* Pull Progress Bar */}
          {pullProgress && (
            <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-xs">
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200">
                <span>{pullProgress.step}</span>
                <span>{pullProgress.percent}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${pullProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handlePullAll}
            disabled={isUploading || isPulling}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
          >
            {isPulling ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>ক্লাউড থেকে নামানো হচ্ছে...</span>
              </>
            ) : (
              <>
                <CloudDownload className="w-4 h-4" />
                <span>ক্লাউড থেকে ডাটা সিঙ্ক করুন</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
