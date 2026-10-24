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
  Layers,
  Copy,
  Check,
  X,
  Globe,
  Wifi,
  BatteryCharging
} from 'lucide-react';
import { MobileAppConfig, DEFAULT_MOBILE_APP_CONFIG } from '@/services/landingPageService';
import { SchoolSettings } from '@/services/settingsService';
import QRCodeLib from 'qrcode';

interface PublicMobileAppSectionProps {
  appConfig?: MobileAppConfig | null;
  settings?: SchoolSettings | null;
}

export default function PublicMobileAppSection({
  appConfig,
  settings,
}: PublicMobileAppSectionProps) {
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatedQr, setGeneratedQr] = useState<string>('');

  const cfg = appConfig || DEFAULT_MOBILE_APP_CONFIG;

  if (cfg.enabled === false) {
    return null;
  }

  const schoolName = settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const apkUrl = cfg.apkDownloadUrl || '/downloads/baraitoli-school.apk';
  const playStoreUrl = cfg.playStoreUrl || 'https://play.google.com/store';
  const appStoreUrl = cfg.appStoreUrl || 'https://www.apple.com/app-store/';

  // Generate dynamic scannable QR code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fullUrl = window.location.origin + apkUrl;
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
  }, [apkUrl]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const fullUrl = window.location.origin + apkUrl;
      navigator.clipboard.writeText(fullUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
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
              <span>{cfg.eyebrow || 'স্মার্ট ডিজিটাল ক্যাম্পাস মোবাইল অ্যাপ'}</span>
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

            {/* Download Buttons Section */}
            <div className="pt-2 space-y-4">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
                
                {/* 1. Direct APK Download (Primary) */}
                <a
                  href={apkUrl}
                  download="baraitoli-school.apk"
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
                      {cfg.version} • {cfg.fileSize}
                    </span>
                  </div>
                </a>

                {/* 2. Google Play Store */}
                <a
                  href={playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white border border-slate-700 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg className="w-6 h-6 fill-current text-emerald-400" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a2.38 2.38 0 0 1-.61-.926V2.74c0-.342.103-.667.28-.934l.329.008zm11.235 11.238l2.095 2.095-11.77 6.792 9.675-8.887zm0-2.104L5.17 2.062l11.769 6.792-2.095 2.094zm1.488 1.052l2.977 1.718a1.69 1.69 0 0 1 0 2.928l-2.977 1.718-2.046-2.046 2.046-2.046z"/>
                  </svg>
                  <div className="text-left">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
                      GET IT ON
                    </span>
                    <span className="text-xs sm:text-sm font-black tracking-tight leading-none">
                      Google Play
                    </span>
                  </div>
                </a>

                {/* 3. Apple App Store */}
                <a
                  href={appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white border border-slate-700 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.07 1.72-.94 2.74 1 .08 2.03-.51 2.65-1.24z"/>
                  </svg>
                  <div className="text-left">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
                      Download on the
                    </span>
                    <span className="text-xs sm:text-sm font-black tracking-tight leading-none">
                      App Store
                    </span>
                  </div>
                </a>

                {/* 4. Installation Help Button */}
                <button
                  type="button"
                  onClick={() => setShowInstallModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 underline underline-offset-4 px-2 py-1 transition"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>ইনস্টলেশন সহায়িকা ও নিয়মাবলী</span>
                </button>
              </div>

              {/* Scannable QR Code Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 flex flex-col sm:flex-row items-center gap-4 text-left">
                <div className="p-2 bg-white rounded-xl shadow-xs border border-emerald-200 shrink-0">
                  {generatedQr ? (
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
                <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      মোবাইলে ক্যামেরা দিয়ে স্ক্যান করুন
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
                    ক্যামেরা ওপেন করে QR কোডটি স্ক্যান করলেই সরাসরি ডাউনলোড লিংকটি চালু হবে।
                  </p>
                  <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink ? 'ডাউনলোড লিংক কপি হয়েছে!' : 'ডাউনলোড লিংক কপি করুন'}</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Right / Interactive Smartphone Mockup Showcase (5 Cols on LG) */}
          <div className="lg:col-span-5 flex justify-center relative">
            
            {/* Floating Trust Badge 1 (Top Left) */}
            <div className="absolute -top-4 -left-4 sm:left-4 z-20 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 animate-pulse">
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
            <div className="w-[280px] sm:w-[310px] rounded-[48px] p-3.5 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 shadow-2xl shadow-slate-900/40 border-4 border-slate-700/60 ring-1 ring-white/10 relative">
              
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

                {/* App Screen Content */}
                <div className="p-4 space-y-3.5 bg-gradient-to-b from-emerald-800 to-slate-900 text-white">
                  
                  {/* App Header */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white/20 p-1 flex items-center justify-center font-bold text-xs">
                        🏫
                      </div>
                      <div>
                        <h5 className="text-[11px] font-black leading-tight truncate max-w-[140px]">
                          {schoolName}
                        </h5>
                        <span className="text-[9px] text-emerald-200 block">স্মার্ট অ্যাপ পোর্টাল</span>
                      </div>
                    </div>
                    <div className="relative p-1.5 rounded-lg bg-white/10">
                      <Bell className="w-3.5 h-3.5 text-white" />
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-[8px] font-black rounded-full flex items-center justify-center text-white">
                        ৩
                      </span>
                    </div>
                  </div>

                  {/* Student Profile Card */}
                  <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-emerald-400 flex items-center justify-center font-black text-slate-900 text-xs shadow-xs">
                        তা
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h6 className="text-xs font-black truncate">তানভীর আহমেদ</h6>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                            সক্রিয়
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300">১০ম শ্রেণি • রোল: ০১ • বিজ্ঞান শাখা</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
                      <span className="text-slate-300">বার্ষিক উপস্থিতি:</span>
                      <span className="font-extrabold text-emerald-300">৯৮.৫% (উপস্থিত)</span>
                    </div>
                  </div>

                </div>

                {/* Body Content in Mockup */}
                <div className="p-3.5 space-y-3 bg-slate-50 dark:bg-slate-950 flex-1 text-slate-900 dark:text-slate-100">
                  
                  {/* Quick Action 4-Grid */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 flex flex-col items-center gap-1">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-bold">হাজিরা</span>
                    </div>

                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 flex flex-col items-center gap-1">
                      <div className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center text-xs">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-bold">ফলাফল</span>
                    </div>

                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900 flex flex-col items-center gap-1">
                      <div className="w-6 h-6 rounded-lg bg-purple-500 text-white flex items-center justify-center text-xs">
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-bold">ফি প্রদান</span>
                    </div>

                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 flex flex-col items-center gap-1">
                      <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-bold">রুটিন</span>
                    </div>
                  </div>

                  {/* Today Attendance Widget */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                      <span className="text-[10px] font-black">আজকের হাজিরা: সময়মত প্রবেশ</span>
                    </div>
                    <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                      সকাল ০৯:১৫
                    </span>
                  </div>

                  {/* Latest Notice in Mockup */}
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
                    <div className="flex items-center gap-1 text-[10px] font-black text-amber-800 dark:text-amber-300">
                      <span>📢</span>
                      <span>বার্ষিক পরীক্ষার রুটিন ও আসন বিন্যাস</span>
                    </div>
                    <p className="text-[9px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">
                      সকল শ্রেণির পরীক্ষার চূড়ান্ত সংশোধিত সময়সূচি প্রকাশ করা হয়েছে।
                    </p>
                  </div>

                  {/* Mockup Bottom Navigation Bar */}
                  <div className="pt-1 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around text-slate-400 text-[9px] font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">🏠 হোম</span>
                    <span>📊 হাজিরা</span>
                    <span>📝 ফলাফল</span>
                    <span>👤 প্রোফাইল</span>
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

      {/* APK Installation Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 relative">
            
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
                  অ্যান্ড্রয়েড ফোনে APK ইনস্টল করার নিয়ম
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  নিচের ৪টি সহজ ধাপে অ্যাপটি আপনার ফোনে ইনস্টল করুন
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
                  <h5 className="font-bold text-slate-900 dark:text-white">ফাইল ডাউনলোড সম্পন্ন করুন</h5>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    ডাউনলোড সম্পন্ন হলে ব্রাউজারের নোটিফিকেশন বার অথবা ফোনের &apos;Downloads&apos; ফোল্ডার থেকে <strong>baraitoli-school.apk</strong> ফাইলে ট্যাপ করুন।
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
                    যদি &apos;Install unknown apps&apos; বা সতর্কবার্তা দেখায়, তবে <strong>Settings</strong> এ গিয়ে <strong>&apos;Allow from this source&apos;</strong> অপশনটি চালু করে দিন।
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  ৩
                </span>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">ইনস্টলেশন সম্পন্ন করুন</h5>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    <strong>Install</strong> বাটনে চাপ দিন এবং কয়েক সেকেন্ডের মধ্যে ইনস্টলেশন সফলভাবে সম্পন্ন হবে।
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  ৪
                </span>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">সহজে লগইন করুন</h5>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    অ্যাপটি ওপেন করে শিক্ষার্থী তার রোল/পিন এবং শিক্ষক তার আইডি ও পাসওয়ার্ড দিয়ে সরাসরি লগইন করতে পারবেন।
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <a
                href={apkUrl}
                download="baraitoli-school.apk"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition"
              >
                <Download className="w-4 h-4" />
                <span>সরাসরি APK ডাউনলোড করুন</span>
              </a>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm transition"
              >
                বুঝেছি, ধন্যবাদ
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
}
