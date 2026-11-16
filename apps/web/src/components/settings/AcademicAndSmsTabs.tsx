'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  MessageSquare,
  Radio,
  RefreshCw,
  Save,
  Send,
  Shield,
  Smartphone,
  UserPlus,
  X,
  Zap,
} from 'lucide-react';
import { AppLanguage } from '@/services/languageService';
import { SchoolSettings, settingsService } from '@/services/settingsService';
import { SMSGatewayConfig, SMSProviderType, smsService } from '@/services/smsService';
import { paymentGatewayService, PaymentGatewayConfig } from '@/services/paymentGatewayService';
import { FormInput, SettingsCard } from './settingsShared';

interface AcademicSettingsTabProps {
  formData: SchoolSettings;
  setFormData: React.Dispatch<React.SetStateAction<SchoolSettings>>;
  currentSession: string;
  setCurrentSession: React.Dispatch<React.SetStateAction<string>>;
  examNames: string[];
  setExamNames: React.Dispatch<React.SetStateAction<string[]>>;
  currentLang: AppLanguage;
}

export function AcademicSettingsTab({
  formData,
  setFormData,
  currentSession,
  setCurrentSession,
  examNames,
  setExamNames,
  currentLang,
}: AcademicSettingsTabProps) {
  return (
    <>
      <SettingsCard
        title="একাডেমিক সেশন ও পরীক্ষা কনফিগারেশন"
        subtitle="বর্তমান শিক্ষা বর্ষ, পরীক্ষার ধরন ও একাডেমিক সেটিংস"
        icon={<CalendarDays className="w-5 h-5" />}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="বর্তমান সেশন / শিক্ষা বর্ষ"
            value={currentSession}
            onChange={setCurrentSession}
            placeholder="যেমন: ২০২৬"
            mono
            icon={<CalendarDays className="w-3.5 h-3.5" />}
          />
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" /> শ্রেণি পরিসর
            </label>
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300">
              ৬ষ্ঠ — ১০ম শ্রেণি (Class 6th – 10th)
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400">মাধ্যমিক স্তরের সকল শ্রেণি সাপোর্টেড</p>
          </div>
        </div>

        {/* Exam Names Configuration */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" /> পরীক্ষার নামসমূহ
          </div>
          <div className="space-y-2">
            {(Array.isArray(examNames) ? examNames : []).map((name, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-black flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const updated = [...examNames];
                    updated[idx] = e.target.value;
                    setExamNames(updated);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
                {examNames.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setExamNames(examNames.filter((_, i) => i !== idx))}
                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setExamNames([...examNames, ''])}
              className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-1 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" /> নতুন পরীক্ষা যোগ করুন
            </button>
          </div>
        </div>

        {/* Grading System Info */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2">
          <div className="text-[11px] font-black text-emerald-800 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" /> গ্রেডিং সিস্টেম (NCTB)
          </div>
          <div className="grid grid-cols-5 gap-1.5 text-[10px] font-bold">
            {[
              { grade: 'A+', range: '৮০-১০০', gpa: '৫.০০', color: 'bg-emerald-600' },
              { grade: 'A', range: '৭০-৭৯', gpa: '৪.০০', color: 'bg-blue-600' },
              { grade: 'A-', range: '৬০-৬৯', gpa: '৩.৫০', color: 'bg-indigo-600' },
              { grade: 'B', range: '৫০-৫৯', gpa: '৩.০০', color: 'bg-amber-600' },
              { grade: 'F', range: '০-৩২', gpa: '০.০০', color: 'bg-rose-600' },
            ].map((g) => (
              <div key={g.grade} className="text-center p-2 bg-white dark:bg-slate-900 rounded-lg border border-emerald-100 dark:border-emerald-800/60">
                <div className={`inline-block px-2 py-0.5 ${g.color} text-white rounded-md text-[9px] font-black mb-1`}>{g.grade}</div>
                <div className="text-slate-600 dark:text-slate-400">{g.range}</div>
                <div className="text-emerald-700 dark:text-emerald-300 font-mono">{g.gpa}</div>
              </div>
            ))}
          </div>
        </div>
      </SettingsCard>

      {/* Online Admission Form Portal Toggle */}
      <SettingsCard
        title={currentLang === 'en' ? 'Online Admission Form Control' : 'অনলাইন ভর্তি আবেদন পোর্টাল নিয়ন্ত্রণ'}
        subtitle={
          currentLang === 'en'
            ? 'Turn online admission form ON or OFF for public applicants'
            : 'সর্বসাধারণ ও অভিভাবকদের জন্য অনলাইন ভর্তি আবেদন ফরম চালু বা বন্ধ রাখুন'
        }
        icon={<UserPlus className="w-5 h-5" />}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        badge={
          <span
            className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
              formData.onlineAdmissionEnabled !== false
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/60'
                : 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800/60'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${formData.onlineAdmissionEnabled !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
            {formData.onlineAdmissionEnabled !== false
              ? currentLang === 'en'
                ? 'Portal Active (ON)'
                : 'পোর্টাল চালু'
              : currentLang === 'en'
                ? 'Portal Closed (OFF)'
                : 'পোর্টাল বন্ধ'}
          </span>
        }
      >
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                {currentLang === 'en' ? 'Public Online Admission Form Status' : 'অনলাইন ভর্তি ফরম স্ট্যাটাস'}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl leading-relaxed">
                {formData.onlineAdmissionEnabled !== false
                  ? currentLang === 'en'
                    ? 'Online admission is OPEN. Applicants can submit admission forms directly at /admission.'
                    : 'অনলাইন ভর্তি আবেদন বর্তমানে চালু আছে। যেকোনো অভিভাবক বা শিক্ষার্থী সরাসরি অনলাইনে ভর্তি ফরম পূরণ করতে পারবেন।'
                  : currentLang === 'en'
                    ? 'Online admission is CLOSED. Visiting /admission will show a closed notice with school contact info.'
                    : 'অনলাইন ভর্তি আবেদন বর্তমানে বন্ধ রয়েছে। /admission পেজে গেলে আবেদন স্থগিতের নোটিশ প্রদর্শিত হবে।'}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const updated = {
                    ...formData,
                    onlineAdmissionEnabled: formData.onlineAdmissionEnabled === false ? true : false,
                  };
                  setFormData(updated);
                  settingsService.updateSettings({ onlineAdmissionEnabled: updated.onlineAdmissionEnabled });
                }}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                  formData.onlineAdmissionEnabled !== false ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-slate-900 transition-transform shadow-md ${
                    formData.onlineAdmissionEnabled !== false ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-bold">
              {currentLang === 'en' ? 'Public Form URL:' : 'পাবলিক ফরম লিংক:'}{' '}
              <Link href="/admission" target="_blank" className="text-indigo-600 dark:text-indigo-400 font-mono font-bold hover:underline">
                /admission ↗
              </Link>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {formData.onlineAdmissionEnabled !== false ? '✅ নতুন আবেদন গ্রহণ চলছে' : '⛔ আবেদন গ্রহণ বন্ধ'}
            </span>
          </div>
        </div>
      </SettingsCard>
    </>
  );
}

export function SmsGatewaySettingsTab() {
  const [smsConfig, setSmsConfig] = useState<SMSGatewayConfig>(() => smsService.getConfig());
  const [pgConfig, setPgConfig] = useState<PaymentGatewayConfig>(() => paymentGatewayService.getConfig());
  const [pgSavedAlert, setPgSavedAlert] = useState(false);
  const [showSmsApiKey, setShowSmsApiKey] = useState(false);
  const [smsSaveAlert, setSmsSaveAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [testSmsMobile, setTestSmsMobile] = useState('');
  const [testSmsMessage, setTestSmsMessage] = useState('বরইতলী উচ্চ বিদ্যালয়: এসএমএস গেটওয়ে সফলভাবে যুক্ত হয়েছে।');
  const [testSmsMode, setTestSmsMode] = useState<'text' | 'otp'>('text');
  const [isSendingSmsTest, setIsSendingSmsTest] = useState(false);
  const [smsTestResult, setSmsTestResult] = useState<{ success: boolean; message: string; response?: string } | null>(null);

  useEffect(() => {
    setSmsConfig(smsService.getConfig());
  }, []);

  const handleSaveSmsConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      smsService.saveConfig(smsConfig);
      setSmsSaveAlert({
        type: 'success',
        message: 'এসএমএস গেটওয়ে কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে!',
      });
      setTimeout(() => setSmsSaveAlert(null), 5000);
    } catch (err: any) {
      setSmsSaveAlert({
        type: 'error',
        message: `সংরক্ষণে ত্রুটি: ${err?.message || 'অজানা ত্রুটি'}`,
      });
    }
  };

  const handleSendTestSms = async () => {
    const cleanDigits = testSmsMobile.replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 11) {
      setSmsTestResult({
        success: false,
        message: 'অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 018XXXXXXXX)।',
      });
      return;
    }

    setIsSendingSmsTest(true);
    setSmsTestResult(null);

    try {
      if (testSmsMode === 'otp') {
        const res = await smsService.sendTestOTP(cleanDigits, smsConfig);
        setSmsTestResult({
          success: res.success,
          message: res.message,
          response: res.gatewayResponse,
        });
      } else {
        const res = await smsService.sendTestSMS(cleanDigits, testSmsMessage, smsConfig);
        setSmsTestResult({
          success: res.success,
          message: res.message,
          response: res.gatewayResponse,
        });
      }
    } catch (err: any) {
      setSmsTestResult({
        success: false,
        message: `ব্যর্থতা: ${err?.message || 'গেটওয়ে সংযোগ ত্রুটি'}`,
      });
    } finally {
      setIsSendingSmsTest(false);
    }
  };

  return (
    <>
      {smsSaveAlert && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-sm animate-in fade-in ${
            smsSaveAlert.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 text-rose-950 border-rose-300 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {smsSaveAlert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{smsSaveAlert.message}</span>
          </div>
          <button onClick={() => setSmsSaveAlert(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-black cursor-pointer ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Main SMS Gateway Configuration */}
      <SettingsCard
        title="এসএমএস গেটওয়ে কনফিগারেশন"
        subtitle="bulksmsdhaka.net ও অন্যান্য গেটওয়ে ব্যবহার করে স্বয়ংক্রিয় নোটিশ, বকেয়া ফি এবং ওটিপি পাঠান"
        icon={<MessageSquare className="w-5 h-5" />}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        badge={
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-black">
            <Smartphone className="w-3.5 h-3.5" />
            <span>
              {smsConfig.provider === 'bulksmsdhaka'
                ? 'Bulk SMS Dhaka (সক্রিয়)'
                : smsConfig.provider === 'bulksmsbd'
                  ? 'BulkSMSBD'
                  : smsConfig.provider === 'greenweb'
                    ? 'Greenweb BD'
                    : smsConfig.provider === 'custom_api'
                      ? 'কাস্টম API'
                      : 'টেস্টিং মোড'}
            </span>
          </div>
        }
      >
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            গেটওয়ে প্রোভাইডার নির্বাচন করুন
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'bulksmsdhaka' as SMSProviderType, name: 'Bulk SMS Dhaka', domain: 'bulksmsdhaka.net', tag: 'প্রস্তাবিত ও ডিফল্ট', recommended: true },
              { id: 'bulksmsbd' as SMSProviderType, name: 'BulkSMSBD', domain: 'bulksmsbd.net', tag: 'বিকল্প গেটওয়ে', recommended: false },
              { id: 'demo_mode' as SMSProviderType, name: 'টেস্টিং সিমুলেশন', domain: 'ব্যালেন্স কাটা হবে না', tag: 'টেস্টিং মোড', recommended: false },
            ].map((p) => {
              const isSelected = smsConfig.provider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    const updated: SMSGatewayConfig = { ...smsConfig, provider: p.id };
                    if (p.id === 'bulksmsdhaka' && smsConfig.savedGateways?.bulksmsdhaka) {
                      updated.apiKey = smsConfig.savedGateways.bulksmsdhaka.apiKey;
                      updated.senderId = smsConfig.savedGateways.bulksmsdhaka.senderId || '1234';
                    } else if (p.id === 'bulksmsbd' && smsConfig.savedGateways?.bulksmsbd) {
                      updated.apiKey = smsConfig.savedGateways.bulksmsbd.apiKey;
                      updated.senderId = smsConfig.savedGateways.bulksmsbd.senderId || '';
                    }
                    setSmsConfig(updated);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/50 shadow-xs ring-2 ring-blue-100'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white">{p.name}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">{p.domain}</p>
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 rounded-md text-[9px] font-bold ${
                      p.recommended ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {p.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  এপিআই কি <span className="text-rose-500">*</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowSmsApiKey(!showSmsApiKey)}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold flex items-center gap-1"
                >
                  {showSmsApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showSmsApiKey ? 'লুকান' : 'দেখুন'}
                </button>
              </label>
              <input
                type={showSmsApiKey ? 'text' : 'password'}
                value={smsConfig.apiKey}
                onChange={(e) => {
                  const val = e.target.value;
                  setSmsConfig((prev) => ({
                    ...prev,
                    apiKey: val,
                    savedGateways: {
                      ...prev.savedGateways,
                      [prev.provider]: {
                        ...(prev.savedGateways?.[prev.provider] || { senderId: prev.senderId }),
                        apiKey: val,
                      },
                    },
                  }));
                }}
                placeholder="আপনার bulksmsdhaka.net একাউন্টের API Key দিন"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                {smsConfig.provider === 'bulksmsdhaka'
                  ? 'bulksmsdhaka.net ড্যাশবোর্ডের API Settings থেকে প্রাপ্ত API Key'
                  : 'এসএমএস গেটওয়ে থেকে প্রাপ্ত Secret / API Key'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                কলার আইডি / সেন্ডার আইডি <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={smsConfig.senderId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSmsConfig((prev) => ({
                    ...prev,
                    senderId: val,
                    savedGateways: {
                      ...prev.savedGateways,
                      [prev.provider]: {
                        ...(prev.savedGateways?.[prev.provider] || { apiKey: prev.apiKey }),
                        senderId: val,
                      },
                    },
                  }));
                }}
                placeholder="যেমন: 1234 (নন-মাস্কিং) অথবা BoraitoliHS (মাস্কিং)"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                নন-মাস্কিং এর ক্ষেত্রে <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400 font-bold">1234</code> এবং মাস্কিং এর ক্ষেত্রে অনুমোদিত ব্র্যান্ড নাম দিন।
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                ওটিপি ব্র্যান্ডের নাম
              </label>
              <input
                type="text"
                value={smsConfig.brandName || ''}
                onChange={(e) => setSmsConfig((prev) => ({ ...prev, brandName: e.target.value }))}
                placeholder="যেমন: Boraitoli High School"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                ওটিপি বার্তা তৈরির সময় <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400 font-bold">Your {'{Brand Name}'} OTP is XXXX</code> ফরম্যাটে যাবে।
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                বর্তমান ব্যালেন্স / ক্রেডিট
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={smsConfig.balance}
                  onChange={(e) => setSmsConfig((prev) => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
                <span className="absolute right-3.5 top-2.5 text-[11px] font-bold text-slate-400">টাকা / ক্রেডিট</span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                প্রতিটি সফল এসএমএস প্রেরণে এই ব্যালেন্স থেকে স্বয়ংক্রিয়ভাবে ক্রেডিট সমন্বয় হয়।
              </p>
            </div>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              সংরক্ষণ করলে ড্যাশবোর্ডের সকল এসএমএস মডিউলে এই গেটওয়ে কার্যকর হবে।
            </div>
            <button
              type="button"
              onClick={handleSaveSmsConfig}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              এসএমএস গেটওয়ে সংরক্ষণ করুন
            </button>
          </div>
        </div>
      </SettingsCard>

      {/* API Documentation Reference Box */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-6 rounded-2xl border border-slate-700 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-2 text-sky-400 font-black text-xs sm:text-sm">
            <FileText className="w-4 h-4" />
            bulksmsdhaka.net এপিআই স্পেসিফিকেশন ও ব্যবহারের নির্দেশিকা
          </div>
          <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-[10px] font-bold font-mono">
            API v1.0
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> 1. Send SMS API (সাধারণ বার্তা)
            </div>
            <p className="text-[11px] text-slate-300">GET / POST মেথডে যেকোনো বার্তা পাঠাতে এই URL ব্যবহার হয়:</p>
            <div className="p-2.5 bg-black/40 rounded-lg font-mono text-[10.5px] text-emerald-300 break-all border border-emerald-500/20 select-all">
              https://bulksmsdhaka.net/api/sendtext?apikey=xxxxxx&amp;callerID=1234&amp;number=019XXXXXXXX&amp;message=abcd
            </div>
          </div>

          <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2">
            <div className="font-bold text-sky-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> 2. Send OTP API (ওটিপি বার্তা)
            </div>
            <p className="text-[11px] text-slate-300">ওটিপি কোড পাঠানোর জন্য নির্দিষ্ট URL ও ফরম্যাট:</p>
            <div className="p-2.5 bg-black/40 rounded-lg font-mono text-[10.5px] text-sky-300 break-all border border-sky-500/20 select-all">
              https://bulksmsdhaka.net/api/otpsend?apikey=xxxxxx&amp;callerID=1234&amp;number=019XXXXXXXX&amp;message=OTP
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-200 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 font-bold block mb-0.5">⚠️ ওটিপি সতর্কবার্তা ও শর্ত:</strong>
            OTP পাঠানোর জন্য অবশ্যই <span className="font-mono bg-amber-400/20 px-1 py-0.2 rounded font-bold text-amber-100">Your {'{Brand/Company Name}'} OTP is XXXX</span> ফরম্যাট মেনে পাঠাতে হবে।
            নোট: OTP টির এসএমএস কনটেন্ট অবশ্যই <strong>৭০ ক্যারেক্টারের মধ্যে</strong> থাকতে হবে, অন্যথায় OTP সেন্ড হবে না এবং একাউন্ট থেকে ব্যালেন্স কেটে নেওয়া হতে পারে।
          </div>
        </div>

        <div className="overflow-x-auto pt-1">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 font-bold">
                <th className="py-1.5 px-2">Parameter Name</th>
                <th className="py-1.5 px-2">Meaning / Value</th>
                <th className="py-1.5 px-2">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium text-slate-300">
              <tr>
                <td className="py-1.5 px-2 font-mono text-blue-300">apikey</td>
                <td className="py-1.5 px-2">API Key</td>
                <td className="py-1.5 px-2 text-slate-400">আপনার bulksmsdhaka.net একাউন্টের API Key</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-mono text-blue-300">callerID</td>
                <td className="py-1.5 px-2">Caller ID</td>
                <td className="py-1.5 px-2 text-slate-400">নন-মাস্কিং 1234 এবং মাস্কিং এর জন্য অনুমোদিত Brand Name</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-mono text-blue-300">number</td>
                <td className="py-1.5 px-2">Recipient Number</td>
                <td className="py-1.5 px-2 text-slate-400">যেমন: 017XXXXXXXX, 018XXXXXXXX, 019XXXXXXXX...</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-mono text-blue-300">message</td>
                <td className="py-1.5 px-2">SMS body</td>
                <td className="py-1.5 px-2 text-slate-400">এসএমএস বার্তা (সিস্টেম কর্তৃক স্বয়ংক্রিয় URL Encoding সম্পন্ন হয়)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Live Test Console */}
      <SettingsCard
        title="লাইভ টেস্ট কনসোল"
        subtitle="আপনার গেটওয়ে সক্রিয় কিনা এবং বার্তা পৌঁছাচ্ছে কিনা তা এখনই যাচাই করুন"
        icon={<Radio className="w-5 h-5" />}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setTestSmsMode('text')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                testSmsMode === 'text'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              সাধারণ টেক্সট এসএমএস টেস্ট
            </button>
            <button
              type="button"
              onClick={() => setTestSmsMode('otp')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                testSmsMode === 'otp'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              ওটিপি টেস্ট
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                টেস্ট মোবাইল নম্বর <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={testSmsMobile}
                onChange={(e) => setTestSmsMobile(e.target.value)}
                placeholder="যেমন: 018XXXXXXXX"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">যে মোবাইল নম্বরে টেস্ট এসএমএস পাঠাতে চান</p>
            </div>

            {testSmsMode === 'text' ? (
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700 dark:text-slate-300">টেস্ট বার্তা</label>
                  <span className="text-[10.5px] font-mono text-slate-500 dark:text-slate-400">
                    {testSmsMessage.length} অক্ষর | {smsService.calculateSMSCredit(testSmsMessage).smsParts} ক্রেডিট
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={testSmsMessage}
                  onChange={(e) => setTestSmsMessage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all resize-none"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">স্বয়ংক্রিয় ওটিপি ফরম্যাট প্রিভিউ</label>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 space-y-1">
                  <div className="text-emerald-700 dark:text-emerald-300 font-bold">
                    Your {smsConfig.brandName || 'Boraitoli HS'} OTP is [৪-ডিজিট কোড]
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span>মোট দৈর্ঘ্য: ~{24 + (smsConfig.brandName || 'Boraitoli HS').length} ক্যারেক্টার</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">✅ ৭০ ক্যারেক্টারের মধ্যে নিরাপদ</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              type="button"
              disabled={isSendingSmsTest}
              onClick={handleSendTestSms}
              className={`px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer ${
                isSendingSmsTest ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isSendingSmsTest ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  পাঠানো হচ্ছে...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  {testSmsMode === 'otp' ? 'টেস্ট OTP পাঠান' : 'টেস্ট এসএমএস পাঠান'}
                </>
              )}
            </button>

            <Link
              href="/dashboard/sms"
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              এসএমএস ব্রডকাস্ট প্যানেল খুলুন
            </Link>
          </div>

          {smsTestResult && (
            <div
              className={`p-4 rounded-xl text-xs space-y-1.5 border animate-in fade-in ${
                smsTestResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800/60 text-rose-950 dark:text-rose-200'
              }`}
            >
              <div className="font-bold flex items-center gap-2">
                {smsTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                )}
                <span>{smsTestResult.message}</span>
              </div>
              {smsTestResult.response && (
                <div className="text-[11px] font-mono bg-black/5 p-2 rounded-lg break-all text-slate-700 dark:text-slate-300">
                  <strong>গেটওয়ে রেসপন্স:</strong> {smsTestResult.response}
                </div>
              )}
            </div>
          )}
        </div>
      </SettingsCard>

      {/* Online Payment Gateway Settings (bKash / Nagad / SSLCommerz) */}
      <SettingsCard
        title="অনলাইন পেমেন্ট গেটওয়ে (bKash / Nagad / SSLCommerz)"
        subtitle="অভিভাবক মোবাইল অ্যাপ ও ফি কালেকশনের জন্য গেটওয়ে মার্চেন্ট ও স্যান্ডবক্স কনফিগারেশন"
        icon={<Zap className="w-5 h-5" />}
        iconBg="bg-indigo-50"
        iconColor="text-indigo-600"
      >
        <div className="space-y-4">
          {pgSavedAlert && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> অনলাইন পেমেন্ট গেটওয়ে সেটিংস সংরক্ষিত হয়েছে!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-white cursor-pointer">
                <span>bKash পেমেন্ট সক্রিয়</span>
                <input
                  type="checkbox"
                  checked={pgConfig.bKashEnabled}
                  onChange={(e) => setPgConfig({ ...pgConfig, bKashEnabled: e.target.checked })}
                />
              </label>
              <FormInput
                label="bKash মার্চেন্ট / এজেন্ট নম্বর"
                value={pgConfig.bKashMerchantNo}
                onChange={(val) => setPgConfig({ ...pgConfig, bKashMerchantNo: val })}
                placeholder="01XXXXXXXXX"
                mono
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-white cursor-pointer">
                <span>Nagad পেমেন্ট সক্রিয়</span>
                <input
                  type="checkbox"
                  checked={pgConfig.nagadEnabled}
                  onChange={(e) => setPgConfig({ ...pgConfig, nagadEnabled: e.target.checked })}
                />
              </label>
              <FormInput
                label="Nagad মার্চেন্ট নম্বর"
                value={pgConfig.nagadMerchantNo}
                onChange={(val) => setPgConfig({ ...pgConfig, nagadMerchantNo: val })}
                placeholder="01XXXXXXXXX"
                mono
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pgConfig.sslEnabled}
                  onChange={(e) => setPgConfig({ ...pgConfig, sslEnabled: e.target.checked })}
                />
                SSLCommerz গেটওয়ে সক্রিয় রাখুন
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pgConfig.sandboxMode}
                  onChange={(e) => setPgConfig({ ...pgConfig, sandboxMode: e.target.checked })}
                />
                Sandbox / টেস্ট মোড চালু
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                paymentGatewayService.saveConfig(pgConfig);
                setPgSavedAlert(true);
                setTimeout(() => setPgSavedAlert(false), 3500);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> গেটওয়ে সেটিংস সেভ করুন
            </button>
          </div>
        </div>
      </SettingsCard>
    </>
  );
}
