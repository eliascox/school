'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Smartphone, Download, QrCode, RefreshCw, ExternalLink,
  CheckCircle2, Users, Bell, CalendarCheck2, ShieldCheck,
  Copy, Check, Wifi, Globe, Sparkles, ArrowRight
} from 'lucide-react';
import { firebaseSyncService } from '@/services/firebaseSyncService';
import { studentService } from '@/services/studentService';
import { noticeService } from '@/services/noticeService';
import { teacherRBACService } from '@/services/teacherRBACService';

const toBnDigit = (num: number | string) => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bn[parseInt(d, 10)]);
};

export default function DashboardMobileAppHub() {
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [noticeCount, setNoticeCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Smart Host / URL for QR Code so scanning from a phone on Wi-Fi works even when PC is on localhost
  const [baseOrigin, setBaseOrigin] = useState('http://192.168.0.187:3000');
  const [qrTarget, setQrTarget] = useState<'app' | 'teacher' | 'apk'>('app');
  const [copied, setCopied] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const loadStats = () => {
    setStudentCount(studentService.getAllStudents().length);
    setTeacherCount(teacherRBACService.getTeachers().length);
    setNoticeCount(noticeService.getNotices().length);
  };

  useEffect(() => {
    loadStats();
    if (typeof window !== 'undefined') {
      const { protocol, hostname, port } = window.location;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        setBaseOrigin(`http://192.168.0.187:${port || '3000'}`);
      } else {
        setBaseOrigin(window.location.origin);
      }

      const w = window as any;
      if (w.__deferredPwaPrompt) setDeferredPrompt(w.__deferredPwaPrompt);
      const onPrompt = (e: Event) => {
        e.preventDefault();
        w.__deferredPwaPrompt = e;
        setDeferredPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', onPrompt);
      return () => window.removeEventListener('beforeinstallprompt', onPrompt);
    }
  }, []);

  const targetUrl =
    qrTarget === 'app'
      ? `${baseOrigin.replace(/\/$/, '')}/mobile-app`
      : qrTarget === 'teacher'
      ? `${baseOrigin.replace(/\/$/, '')}/dashboard/teacher-portal`
      : `${baseOrigin.replace(/\/$/, '')}/downloads/school-app.apk`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(
    targetUrl
  )}`;

  const handleSyncCloud = async () => {
    setSyncing(true);
    setSyncSuccess(false);
    try {
      await firebaseSyncService.uploadAllToCloud();
      await firebaseSyncService.pullAllFromCloud();
      loadStats();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3500);
    } catch {
    } finally {
      setSyncing(false);
    }
  };

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      window.open('/mobile-app', '_blank');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-700/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>স্মার্ট ক্যাম্পাস মোবাইল অ্যাপ ও PWA কন্ট্রোল হাব (v2.0.0)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            শিক্ষার্থী, অভিভাবক ও শিক্ষক মোবাইল অ্যাপ পোর্টাল
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/85 leading-relaxed">
            অ্যান্ড্রয়েড APK ডাউনলোড, ওয়ান-ক্লিক Web App (PWA) ইনস্টলেশন এবং ক্লাউড ডাটাবেজের সাথে রিয়েল-টাইম হাজিরা, ফলাফল, বেতন ও নোটিশ সিঙ্ক্রোনাইজেশন এখান থেকে নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/mobile-app"
            target="_blank"
            className="px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition"
          >
            <Smartphone className="w-4 h-4" />
            <span>মোবাইল অ্যাপ ওপেন করুন</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/dashboard/teacher-portal"
            className="px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-bold text-xs sm:text-sm flex items-center gap-2 transition"
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>শিক্ষক মোবাইল পোর্টাল</span>
          </Link>

          <a
            href="/downloads/school-app.apk"
            download="school-app.apk"
            className="px-4 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition"
          >
            <Download className="w-4 h-4" />
            <span>APK ডাউনলোড (v2.0)</span>
          </a>
        </div>
      </div>

      {/* Live Sync KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">অ্যাপে সিঙ্ককৃত শিক্ষার্থী</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {toBnDigit(studentCount)} জন
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">লাইভ প্রোফাইল ও ফলাফল সক্রিয়</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">শিক্ষক পোর্টাল একাউন্ট</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {toBnDigit(teacherCount)} জন
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">মোবাইল হাজিরা ও মার্ক এন্ট্রি</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">পুশ নোটিশ ও বিজ্ঞপ্তি</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {toBnDigit(noticeCount)} টি
            </span>
            <span className="text-[11px] font-semibold text-amber-600">অ্যাপ নোটিশ বোর্ডে প্রকাশিত</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ক্লাউড ও মোবাইল ডাটা সিঙ্ক</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              সংযুক্ত
            </span>
          </div>
          <button
            type="button"
            onClick={handleSyncCloud}
            disabled={syncing}
            className="mt-3 w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'ক্লাউডে সিঙ্ক হচ্ছে...' : syncSuccess ? 'সিঙ্ক সফল হয়েছে!' : 'এখনই ক্লাউড সিঙ্ক করুন'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left QR & Connection Manager (5 cols) | Right Live Interactive Phone Simulator (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Smart QR Code & APK/PWA Distribution */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  স্মার্ট QR কোড ও ওয়াইফাই অ্যাপ স্ক্যানার
                </h2>
                <p className="text-xs text-slate-500">
                  ফোনের ক্যামেরা দিয়ে স্ক্যান করে সরাসরি অ্যাপ ওপেন বা ডাউনলোড করুন
                </p>
              </div>
            </div>

            {/* Target Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100">
              <button
                type="button"
                onClick={() => setQrTarget('app')}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  qrTarget === 'app' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                📱 স্টুডেন্ট অ্যাপ
              </button>
              <button
                type="button"
                onClick={() => setQrTarget('teacher')}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  qrTarget === 'teacher' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                👨‍🏫 শিক্ষক পোর্টাল
              </button>
              <button
                type="button"
                onClick={() => setQrTarget('apk')}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  qrTarget === 'apk' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                📦 APK ফাইল
              </button>
            </div>

            {/* QR Code Display */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-emerald-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImageUrl}
                  alt="Mobile App QR Code"
                  className="w-44 h-44 object-contain rounded-lg"
                />
              </div>
              <p className="text-xs font-bold text-slate-700 text-center">
                {qrTarget === 'app'
                  ? 'স্ক্যান করলে সরাসরি শিক্ষার্থী ও অভিভাবক মোবাইল অ্যাপ চালু হবে'
                  : qrTarget === 'teacher'
                  ? 'স্ক্যান করলে সরাসরি শিক্ষক মোবাইল পোর্টাল চালু হবে'
                  : 'স্ক্যান করলে সরাসরি Android APK (school-app.apk) ডাউনলোড হবে'}
              </p>
            </div>

            {/* Server / LAN IP Configuration */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>সার্ভার / লোকাল ওয়াইফাই ঠিকানা (LAN / Cloud URL):</span>
                </span>
                <button
                  type="button"
                  onClick={() => setBaseOrigin('https://school-eta-kohl.vercel.app')}
                  className="text-[11px] text-emerald-700 hover:underline font-bold cursor-pointer"
                >
                  ক্লাউড URL সেট করুন
                </button>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={baseOrigin}
                  onChange={(e) => setBaseOrigin(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
                  placeholder="http://192.168.0.187:3000"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'কপি হয়েছে' : 'লিংক কপি'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                বর্তমান টার্গেট লিংক: <code className="text-emerald-700 font-semibold break-all">{targetUrl}</code>
              </p>
            </div>

            {/* Direct Action Buttons */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleInstallPwa}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>ওয়েব অ্যাপ ইনস্টল (PWA)</span>
              </button>

              <a
                href="/downloads/school-app.apk"
                download="school-app.apk"
                className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>APK ডাউনলোড (Android)</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Live Embedded Mobile App Preview */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-base font-black text-slate-900">
                লাইভ ইন্টারেক্টিভ মোবাইল অ্যাপ প্রিভিউ (সিমুলেটর)
              </h2>
            </div>
            <Link
              href="/mobile-app"
              target="_blank"
              className="text-xs font-extrabold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>ফুল-স্ক্রিন মোডে ওপেন করুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="w-full flex justify-center bg-slate-950 rounded-3xl p-3 sm:p-6">
            <iframe
              src="/mobile-app"
              title="Smart Campus Live Mobile App"
              className="w-full max-w-[400px] h-[720px] rounded-[32px] border-4 border-slate-800 bg-white shadow-2xl"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
