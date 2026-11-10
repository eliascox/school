'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Download,
  QrCode,
  CheckCircle2,
  Bell,
  FileText,
  CreditCard,
  Calendar,
  Sparkles,
  ShieldCheck,
  Star,
  ExternalLink,
  ChevronRight,
  Info,
  Copy,
  Check,
  X,
  Wifi,
  BatteryCharging,
  Award
} from 'lucide-react';
import { MobileAppConfig, DEFAULT_MOBILE_APP_CONFIG } from '@/services/landingPageService';
import { SchoolSettings } from '@/services/settingsService';
import { studentService } from '@/services/studentService';
import { noticeService } from '@/services/noticeService';
import QRCodeLib from 'qrcode';

interface PublicMobileAppSectionProps {
  appConfig?: MobileAppConfig | null;
  settings?: SchoolSettings | null;
}

const toBnDigit = (num: number | string) => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bn[parseInt(d, 10)]);
};

export default function PublicMobileAppSection({
  appConfig,
  settings,
}: PublicMobileAppSectionProps) {
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatedQr, setGeneratedQr] = useState<string>('');
  const [qrMode, setQrMode] = useState<'webapp' | 'apk'>('webapp');
  const [mockupTab, setMockupTab] = useState<'home' | 'attendance' | 'results' | 'routine'>('home');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [sampleStudent, setSampleStudent] = useState<{
    name: string;
    roll: string;
    grade: string;
    section: string;
    gpa: string;
  }>({
    name: 'শিক্ষার্থী প্রোফাইল',
    roll: '০১',
    grade: '১০ম শ্রেণি',
    section: 'বিজ্ঞান শাখা',
    gpa: '৫.০০',
  });
  const [latestNoticeTitle, setLatestNoticeTitle] = useState(
    '২০২৬ শিক্ষাবর্ষের ক্লাস ও পরীক্ষার সময়সূচি প্রকাশিত হয়েছে'
  );

  const cfg = appConfig || DEFAULT_MOBILE_APP_CONFIG;
  const schoolName = settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const apkUrl = cfg.apkDownloadUrl || '/downloads/school-app.apk';

  const getScannableBaseOrigin = () => {
    if (typeof window === 'undefined') return '';
    const { hostname, port } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://192.168.0.187:${port || '3000'}`;
    }
    return window.location.origin;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load live student & notice sample for the interactive phone preview
    try {
      const allStudents = studentService.getAllStudents();
      if (allStudents.length > 0) {
        const st = allStudents[0];
        const gMap: Record<string, string> = {
          '6th': '৬ষ্ঠ শ্রেণি',
          '7th': '৭ম শ্রেণি',
          '8th': '৮ম শ্রেণি',
          '9th': '৯ম শ্রেণি',
          '10th': '১০ম শ্রেণি',
        };
        setSampleStudent({
          name: st.name,
          roll: toBnDigit(st.roll || 1),
          grade: gMap[st.grade] || st.grade || '১০ম শ্রেণি',
          section: st.group && st.group !== 'None' ? st.group : `শাখা ${st.section || 'ক'}`,
          gpa: st.gpa ? toBnDigit(st.gpa) : '৫.০০',
        });
      }
      const allNotices = noticeService.getNotices();
      if (allNotices.length > 0 && allNotices[0].title) {
        setLatestNoticeTitle(allNotices[0].title);
      }
    } catch {}

    // Listen for native PWA install prompt
    const w = window as any;
    if (w.__deferredPwaPrompt) setDeferredPrompt(w.__deferredPwaPrompt);
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      w.__deferredPwaPrompt = e;
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  // Generate dynamic scannable QR code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = getScannableBaseOrigin();
      const targetPath = qrMode === 'webapp' ? '/mobile-app' : apkUrl;
      const fullUrl = origin + targetPath;
      QRCodeLib.toDataURL(fullUrl, {
        width: 220,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setGeneratedQr(url))
        .catch(() => {});
    }
  }, [apkUrl, qrMode]);

  if (cfg.enabled === false) {
    return null;
  }

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const origin = getScannableBaseOrigin();
      const targetPath = qrMode === 'webapp' ? '/mobile-app' : apkUrl;
      const fullUrl = origin + targetPath;
      navigator.clipboard.writeText(fullUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    }
  };

  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  };

  const getFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'Bell':
        return <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'FileText':
        return <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'CreditCard':
        return <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'Calendar':
        return <Calendar className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'Smartphone':
      default:
        return <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <section
      id="mobile-app"
      className="relative py-14 sm:py-20 bg-gradient-to-b from-slate-50 via-white to-slate-100/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors overflow-hidden"
    >
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[650px] h-96 sm:h-[400px] bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left / Info Column (7 Cols on LG) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
            
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-black border border-emerald-300/80 dark:border-emerald-700/80 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{cfg.eyebrow || 'স্মার্ট ডিজিটাল ক্যাম্পাস মোবাইল অ্যাপ (v2.0)'}</span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {cfg.title || `${schoolName}-এর অফিসিয়াল মোবাইল অ্যাপ ডাউনলোড করুন`}
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {cfg.subtitle ||
                  'শিক্ষার্থী, অভিভাবক ও শিক্ষকদের জন্য স্মার্ট হাজিরা, পরীক্ষার ফলাফল, নোটিফিকেশন ও ফি পরিশোধের সমন্বিত প্ল্যাটফর্ম।'}
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto lg:mx-0">
                {cfg.description}
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {(cfg.features || DEFAULT_MOBILE_APP_CONFIG.features).map((feat) => (
                <div
                  key={feat.id}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/80 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-700 transition"
                >
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                    {getFeatureIcon(feat.icon)}
                  </div>
                  <div className="text-left min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {feat.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Download & Launch Buttons Section */}
            <div className="pt-2 space-y-4">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
                
                {/* 1. Direct APK Download (Primary) */}
                <a
                  href={apkUrl}
                  download="school-app.apk"
                  onClick={() => setShowInstallModal(true)}
                  className="group relative inline-flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] border border-emerald-400/30"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5 text-white animate-bounce" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-100 block">
                      সরাসরি ডাউনলোড (Android APK)
                    </span>
                    <span className="text-sm sm:text-base font-extrabold tracking-tight">
                      APK ডাউনলোড করুন
                    </span>
                    <span className="text-[10px] text-emerald-200 block font-normal">
                      ভার্সন ২.০.০ • অফলাইন ও ক্লাউড সিঙ্ক
                    </span>
                  </div>
                </a>

                {/* 2. Open Live Mobile App directly in browser (Android & iOS) */}
                <Link
                  href="/mobile-app"
                  className="inline-flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white border border-slate-700 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] uppercase tracking-wider text-emerald-400 block font-bold">
                      ANDROID ও IPHONE
                    </span>
                    <span className="text-xs sm:text-sm font-black tracking-tight leading-none">
                      মোবাইল অ্যাপ ওপেন করুন
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      ইনস্টল ছাড়াই সরাসরি চালু
                    </span>
                  </div>
                </Link>

                {/* 3. 1-Click PWA Web App Install */}
                <button
                  type="button"
                  onClick={handlePwaInstall}
                  className="inline-flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block font-bold">
                      ১-ক্লিক ওয়েব অ্যাপ (PWA)
                    </span>
                    <span className="text-xs sm:text-sm font-black tracking-tight leading-none">
                      ফোনে ইনস্টল করুন
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      হোম স্ক্রিনে যুক্ত করুন
                    </span>
                  </div>
                </button>

                {/* 4. Installation Help Button */}
                <button
                  type="button"
                  onClick={() => setShowInstallModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 underline underline-offset-4 px-2 py-1 transition cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>ইনস্টলেশন সহায়িকা ও নিয়মাবলী</span>
                </button>
              </div>

              {/* Scannable QR Code Card with Mode Toggle */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 flex flex-col sm:flex-row items-center gap-4 text-left">
                <div className="p-2 bg-white rounded-xl shadow-xs border border-emerald-200 shrink-0">
                  {generatedQr ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={generatedQr}
                      alt="School App QR Code"
                      className="w-20 h-20 rounded-md object-contain"
                    />
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center bg-slate-100 rounded-md text-slate-400">
                      <QrCode className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <div className="flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                        মোবাইলে ক্যামেরা দিয়ে স্ক্যান করুন
                      </span>
                    </div>
                    <div className="inline-flex rounded-lg bg-white dark:bg-slate-800 p-0.5 border border-emerald-200 dark:border-slate-700 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setQrMode('webapp')}
                        className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                          qrMode === 'webapp'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        লাইভ অ্যাপ
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrMode('apk')}
                        className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                          qrMode === 'apk'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        APK ডাউনলোড
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
                    {qrMode === 'webapp'
                      ? 'ক্যামেরা দিয়ে স্ক্যান করলেই আপনার ফোনে সরাসরি স্মার্ট ক্যাম্পাস মোবাইল অ্যাপ চালু হবে।'
                      : 'ক্যামেরা দিয়ে স্ক্যান করলেই সরাসরি অফিশিয়াল Android APK ফাইলটি ডাউনলোড শুরু হবে।'}
                  </p>
                  <div className="pt-0.5 flex items-center justify-center sm:justify-start gap-3">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink ? 'লিংক কপি হয়েছে!' : 'অ্যাপ লিংক কপি করুন'}</span>
                    </button>
                    <Link
                      href="/mobile-app"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <span>ফুল-স্ক্রিন অ্যাপ দেখুন</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Right / Interactive Smartphone Mockup Showcase (5 Cols on LG) */}
          <div className="lg:col-span-5 flex justify-center relative">
            
            {/* Floating Trust Badge 1 (Top Left) */}
            <div className="absolute -top-4 -left-4 sm:left-4 z-20 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div className="text-left">
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  {cfg.rating || '৪.৯'}/৫ রেটিং
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {cfg.downloadCount || '১,২০০+'} শিক্ষার্থী ও অভিভাবক
                </span>
              </div>
            </div>

            {/* Floating Instant Alert Badge 2 (Bottom Right) */}
            <div className="absolute -bottom-4 -right-4 sm:right-4 z-20 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                <Bell className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-left">
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  তাৎক্ষণিক পুশ অ্যালার্ট
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  হাজিরা ও পরীক্ষার নোটিফিকেশন
                </span>
              </div>
            </div>

            {/* Realistic Smartphone Frame */}
            <div className="w-[290px] sm:w-[320px] rounded-[48px] p-3.5 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 shadow-2xl shadow-slate-900/40 border-4 border-slate-700/60 ring-1 ring-white/10 relative">
              
              {/* Phone Speaker & Camera Notch (Dynamic Island) */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full flex items-center justify-between px-3 z-30 shadow-inner">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-blue-500/40"></div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500/60 animate-ping"></div>
              </div>

              {/* Inner Smartphone Screen */}
              <div className="w-full rounded-[38px] bg-slate-100 dark:bg-slate-900 overflow-hidden border border-slate-800 text-slate-900 dark:text-white flex flex-col font-sans select-none">
                
                {/* Status Bar */}
                <div className="h-9 bg-slate-900 text-white flex items-center justify-between px-6 text-[10px] font-semibold pt-1">
                  <span>০৯:৪১</span>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Wifi className="w-3 h-3" />
                    <span>5G</span>
                    <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>

                {/* App Screen Header */}
                <div className="p-4 space-y-3 bg-gradient-to-b from-emerald-800 to-slate-900 text-white">
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white/20 p-1 flex items-center justify-center font-bold text-xs">
                        🏫
                      </div>
                      <div>
                        <h5 className="text-[11px] font-black leading-tight truncate max-w-[150px]">
                          {schoolName}
                        </h5>
                        <span className="text-[9px] text-emerald-200 block">স্মার্ট অ্যাপ পোর্টাল • LIVE</span>
                      </div>
                    </div>
                    <Link
                      href="/mobile-app"
                      className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[9px] transition"
                    >
                      ওপেন ↗
                    </Link>
                  </div>

                  {/* Student Profile Card */}
                  <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-emerald-400 flex items-center justify-center font-black text-slate-900 text-xs shadow-xs">
                        {sampleStudent.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h6 className="text-xs font-black truncate">{sampleStudent.name}</h6>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                            সক্রিয়
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 truncate">
                          {sampleStudent.grade} • রোল: {sampleStudent.roll} • {sampleStudent.section}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
                      <span className="text-slate-300">জিপিএ: {sampleStudent.gpa}</span>
                      <span className="font-extrabold text-emerald-300">উপস্থিতি: ৯৮%</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Body Content in Mockup */}
                <div className="p-3.5 space-y-3 bg-slate-50 dark:bg-slate-950 flex-1 text-slate-900 dark:text-slate-100">
                  
                  {/* Interactive Quick Action 4-Grid */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <button
                      type="button"
                      onClick={() => setMockupTab('attendance')}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                        mockupTab === 'attendance'
                          ? 'bg-emerald-100 border-emerald-400 dark:bg-emerald-900/60'
                          : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-bold">হাজিরা</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMockupTab('results')}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                        mockupTab === 'results'
                          ? 'bg-blue-100 border-blue-400 dark:bg-blue-900/60'
                          : 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center text-xs">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-bold">ফলাফল</span>
                    </button>

                    <Link
                      href="/mobile-app"
                      className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900 flex flex-col items-center gap-1 hover:border-purple-400 transition"
                    >
                      <div className="w-6 h-6 rounded-lg bg-purple-500 text-white flex items-center justify-center text-xs">
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-bold">ফি খতিয়ান</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setMockupTab('routine')}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                        mockupTab === 'routine'
                          ? 'bg-amber-100 border-amber-400 dark:bg-amber-900/60'
                          : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-bold">রুটিন</span>
                    </button>
                  </div>

                  {/* Dynamic Widget Based on Selected Mockup Tab */}
                  {mockupTab === 'home' && (
                    <>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                          <span className="text-[10px] font-black">আজকের হাজিরা: উপস্থিত</span>
                        </div>
                        <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                          ভেরিফাইড
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
                        <div className="flex items-center gap-1 text-[10px] font-black text-amber-800 dark:text-amber-300">
                          <span>📢</span>
                          <span className="truncate">{latestNoticeTitle}</span>
                        </div>
                        <p className="text-[9px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">
                          বিস্তারিত নোটিশ ও রুটিন দেখতে অ্যাপ ওপেন করুন।
                        </p>
                      </div>
                    </>
                  )}

                  {mockupTab === 'attendance' && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-black text-emerald-900 dark:text-emerald-200">
                        <span>📊 মাসিক হাজিরা সারাংশ</span>
                        <span>৯৮.৫% উপস্থিত</span>
                      </div>
                      <p className="text-[9px] text-emerald-800 dark:text-emerald-300">
                        মোট কার্যদিবস: ২৬ দিন • উপস্থিত: ২৫ দিন • অনুপস্থিত: ১ দিন
                      </p>
                    </div>
                  )}

                  {mockupTab === 'results' && (
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-black text-blue-900 dark:text-blue-200">
                        <span>🏆 সর্বশেষ পরীক্ষার ফলাফল</span>
                        <span>জিপিএ {sampleStudent.gpa} (A+)</span>
                      </div>
                      <p className="text-[9px] text-blue-800 dark:text-blue-300">
                        সকল বিষয়ে কৃতকার্য • পূর্ণাঙ্গ মার্কশিট ডাউনলোড করতে ক্লিক করুন।
                      </p>
                    </div>
                  )}

                  {mockupTab === 'routine' && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-black text-amber-900 dark:text-amber-200">
                        <span>📖 আজকের ক্লাস রুটিন</span>
                        <span>সকাল ১০:০০ - ০৪:০০</span>
                      </div>
                      <p className="text-[9px] text-amber-800 dark:text-amber-300">
                        ১ম পিরিয়ড: বাংলা • ২য় পিরিয়ড: ইংরেজি • ৩য় পিরিয়ড: গণিত
                      </p>
                    </div>
                  )}

                  {/* Mockup Bottom Navigation Bar */}
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around text-slate-400 text-[9px] font-bold">
                    <button
                      type="button"
                      onClick={() => setMockupTab('home')}
                      className={`cursor-pointer ${mockupTab === 'home' ? 'text-emerald-600 dark:text-emerald-400 font-black' : ''}`}
                    >
                      🏠 হোম
                    </button>
                    <button
                      type="button"
                      onClick={() => setMockupTab('attendance')}
                      className={`cursor-pointer ${mockupTab === 'attendance' ? 'text-emerald-600 dark:text-emerald-400 font-black' : ''}`}
                    >
                      📊 হাজিরা
                    </button>
                    <button
                      type="button"
                      onClick={() => setMockupTab('results')}
                      className={`cursor-pointer ${mockupTab === 'results' ? 'text-emerald-600 dark:text-emerald-400 font-black' : ''}`}
                    >
                      📝 ফলাফল
                    </button>
                    <Link href="/mobile-app" className="text-indigo-600 dark:text-indigo-400 font-black">
                      🚀 পূর্ণ অ্যাপ
                    </Link>
                  </div>

                </div>

                {/* Home Indicator Bar */}
                <div className="h-5 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                  <div className="w-24 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </div>

      {/* APK & PWA Installation Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 relative">
            
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Download className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  মোবাইলে অ্যাপ ইনস্টল ও ব্যবহারের নিয়ম
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Android APK অথবা সরাসরি ওয়েব অ্যাপ (PWA) হিসেবে ব্যবহার করুন
                </p>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  ১
                </span>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">ফাইল ডাউনলোড ও ওপেন করুন</h5>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    ডাউনলোড সম্পন্ন হলে ব্রাউজারের নোটিফিকেশন বার অথবা ফোনের &apos;Downloads&apos; ফোল্ডার থেকে <strong>school-app.apk</strong> ফাইলে ট্যাপ করুন।
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  ২
                </span>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">সিকিউরিটি পারমিশন এলাউ করুন</h5>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    যদি &apos;Install unknown apps&apos; দেখায়, তবে <strong>Settings → Allow from this source</strong> চালু করে <strong>Install</strong> বাটনে চাপ দিন।
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  ৩
                </span>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">ইনস্টল ছাড়াই সরাসরি ওয়েব অ্যাপ (Android ও iPhone)</h5>
                  <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">
                    যেকোনো ফোনে APK ছাড়াই সরাসরি <strong>&quot;মোবাইল অ্যাপ ওপেন করুন&quot;</strong> বাটনে ক্লিক করে সব সেবা ব্যবহার করতে পারবেন।
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
              <Link
                href="/mobile-app"
                onClick={() => setShowInstallModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>মোবাইল অ্যাপ ওপেন করুন</span>
              </Link>
              <a
                href={apkUrl}
                download="school-app.apk"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition"
              >
                <Download className="w-4 h-4" />
                <span>APK ডাউনলোড করুন</span>
              </a>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
}
