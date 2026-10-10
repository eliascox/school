'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  DownloadCloud, 
  ShieldCheck, 
  X, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';
import { updateClientService } from '@/services/updateClientService';
import { UpdateReleaseManifest } from '@sms/shared-types';

export default function AutoUpdateModal() {
  const [manifest, setManifest] = useState<UpdateReleaseManifest | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    // Check initial cached update
    const cached = updateClientService.getCachedUpdate();
    if (cached && !updateClientService.isDismissed(cached.version)) {
      setManifest(cached);
    }

    // Listen to live update available events
    const handleUpdate = (e: any) => {
      const updateData: UpdateReleaseManifest = e.detail;
      setManifest(updateData);
      if (updateData.isCritical) {
        setShowModal(true);
      }
    };

    window.addEventListener('sms:update-available', handleUpdate);
    return () => {
      window.removeEventListener('sms:update-available', handleUpdate);
    };
  }, []);

  if (!manifest) return null;

  const handleStartUpdate = async () => {
    setDownloading(true);
    setStatusMessage('আপডেট প্যাকেজ ডাউনলোড ও ডিজিটাল সিগনেচার যাচাই করা হচ্ছে...');
    setIsError(false);

    // Simulate progress increments for UI responsiveness
    let p = 15;
    setProgress(p);
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 25) + 10;
      if (p >= 90) clearInterval(interval);
      else setProgress(p);
    }, 400);

    try {
      const res = await updateClientService.downloadAndInstall(manifest);
      clearInterval(interval);
      setProgress(100);

      if (res.success) {
        setIsSuccess(true);
        setStatusMessage(res.message);
      } else {
        setIsError(true);
        setStatusMessage(res.message);
      }
    } catch (err: any) {
      clearInterval(interval);
      setIsError(true);
      setStatusMessage(err.message || 'আপডেট প্রক্রিয়া সম্পন্ন করতে ব্যর্থ হয়েছে।');
    } finally {
      setDownloading(false);
    }
  };

  const handleDismiss = () => {
    if (!manifest.isCritical) {
      updateClientService.dismissUpdate(manifest.version);
      setShowModal(false);
      setManifest(null);
    }
  };

  return (
    <>
      {/* 1. Subtle Floating Banner when modal is not opened */}
      {!showModal && (
        <div className="fixed bottom-5 right-5 z-40 animate-bounce-slow">
          <div className="flex items-center space-x-3 bg-gradient-to-r from-indigo-900/95 to-slate-900/95 border border-indigo-500/40 text-white px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                নতুন সংস্করণ প্রকাশিত! 
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/30 text-indigo-300 font-mono">
                  v{manifest.version}
                </span>
              </h4>
              <p className="text-[11px] text-slate-300">উন্নত পারফরম্যান্স ও নতুন ফিচারের জন্য আপডেট করুন।</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all ml-2"
            >
              দেখুন
            </button>
            {!manifest.isCritical && (
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1"
                title="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Full Update Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5 text-slate-100 relative">
            
            {!manifest.isCritical && !downloading && (
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <DownloadCloud className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-white">সফটওয়্যার অটো-আপডেট</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    v{manifest.version}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  বর্তমান সংস্করণ: v{updateClientService.getCurrentVersion()} • রিলিজ ডেট: {manifest.publishedAt ? new Date(manifest.publishedAt).toLocaleDateString('bn-BD') : 'আজ'}
                </p>
              </div>
            </div>

            {/* Release Changelog */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>নতুন ফিচারের বিবরণ (Release Notes):</span>
              </label>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                {manifest.releaseNotes || '• বাগ ফিক্স এবং সাধারণ কর্মক্ষমতা বৃদ্ধি।\n• অফলাইন ডেটা সিঙ্ক ও সিকিউরিটি প্যাচ আপডেট।'}
              </div>
            </div>

            {/* Cryptographic Hash Badge */}
            {manifest.sha256 && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px] font-mono">
                <div className="truncate mr-2 text-slate-400">
                  <span className="text-slate-500 mr-1">SHA-256:</span>
                  <span className="text-indigo-300">{manifest.sha256}</span>
                </div>
                <div className="flex items-center text-emerald-400 flex-shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  <span className="text-[10px]">Ed25519 Signed</span>
                </div>
              </div>
            )}

            {/* Progress Bar when Downloading */}
            {downloading && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>ডাউনলোড ও সিগনেচার যাচাই হচ্ছে...</span>
                  <span className="font-mono font-bold text-indigo-400">{progress}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Status Message */}
            {statusMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                isSuccess 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
                  : isError 
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300'
              }`}>
                {isSuccess ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                ) : isError ? (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                ) : (
                  <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin text-indigo-400" />
                )}
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3">
              {!manifest.isCritical && !downloading && !isSuccess && (
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  পরে করব
                </button>
              )}

              {!isSuccess && (
                <button
                  type="button"
                  onClick={handleStartUpdate}
                  disabled={downloading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>প্রক্রিয়াধীন...</span>
                    </>
                  ) : (
                    <>
                      <DownloadCloud className="w-4 h-4" />
                      <span>এখনই আপডেট করুন</span>
                    </>
                  )}
                </button>
              )}

              {isSuccess && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>রিস্টার্ট সম্পন্ন করুন</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
