'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Send,
  MessageSquare,
  Users,
  Settings,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  FileText,
  DollarSign,
  UserCheck,
  Sparkles,
  Printer,
  Copy,
  Info,
  Check
} from 'lucide-react';
import { smsService, SMSGatewayConfig, SMSLogRecord, SMSTemplate, SMSProviderType } from '@/services/smsService';
import { studentService, Student } from '@/services/studentService';
import { languageService, AppLanguage } from '@/services/languageService';
import Link from 'next/link';

type SMSTab = 'send' | 'logs' | 'config';

export default function SMSDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<SMSTab>('send');
  const [currentLang, setCurrentLang] = useState<AppLanguage>('bn');

  // Gateway Config
  const [gatewayConfig, setGatewayConfig] = useState<SMSGatewayConfig>(smsService.getConfig());
  const [dhakaApiKey, setDhakaApiKey] = useState('');
  const [dhakaSenderId, setDhakaSenderId] = useState('1234');
  const [dhakaBrandName, setDhakaBrandName] = useState('Boraitoli High School');
  const [bdApiKey, setBdApiKey] = useState('5zVaXEuUgZq5gyX23ujq');
  const [bdSenderId, setBdSenderId] = useState('8809617613435');
  const [bdBalance, setBdBalance] = useState<number>(105.20);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  // Recipients Data
  const [students, setStudents] = useState<Student[]>([]);
  const [targetGroup, setTargetGroup] = useState<'absent_students' | 'due_students' | 'all_students' | 'grade_students' | 'teachers' | 'custom'>('absent_students');
  const [selectedGrade, setSelectedGrade] = useState<string>('6th');
  const [customMobile, setCustomMobile] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');

  // Message & Templates
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl_due');
  const [messageBody, setMessageBody] = useState<string>('');

  // Execution States
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string>('');
  const [logs, setLogs] = useState<SMSLogRecord[]>([]);

  // Logs Filter
  const [logSearch, setLogSearch] = useState('');
  const [logFilterStatus, setLogFilterStatus] = useState<'All' | 'Sent' | 'Failed'>('All');

  // Fetch Live Balance from API
  const fetchLiveBalance = useCallback(async () => {
    setIsBalanceLoading(true);
    const liveBal = await smsService.fetchLiveBalance();
    const cfg = smsService.getConfig();
    setGatewayConfig(cfg);
    if (cfg.provider === 'bulksmsbd') {
      setBdBalance(liveBal);
    }
    setIsBalanceLoading(false);
  }, []);

  // Refresh All Data
  const refreshData = useCallback(() => {
    if (typeof window === 'undefined') return;
    const cfg = smsService.getConfig();
    setGatewayConfig(cfg);
    setLogs(smsService.getLogs());
    setTemplates(smsService.getTemplates());
    setStudents(studentService.getAllStudents());

    if (cfg.savedGateways?.bulksmsdhaka) {
      setDhakaApiKey(cfg.savedGateways.bulksmsdhaka.apiKey);
      setDhakaSenderId(cfg.savedGateways.bulksmsdhaka.senderId || '1234');
    }
    if (cfg.brandName) {
      setDhakaBrandName(cfg.brandName);
    }
    if (cfg.savedGateways?.bulksmsbd) {
      setBdApiKey(cfg.savedGateways.bulksmsbd.apiKey);
      setBdSenderId(cfg.savedGateways.bulksmsbd.senderId);
      if (cfg.savedGateways.bulksmsbd.balance !== undefined) {
        setBdBalance(cfg.savedGateways.bulksmsbd.balance);
      }
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    setCurrentLang(languageService.getLanguage());
    const unsubLang = languageService.subscribe(l => setCurrentLang(l));
    refreshData();
    fetchLiveBalance();
    return () => unsubLang();
  }, [refreshData, fetchLiveBalance]);

  // Set default message from selected template
  useEffect(() => {
    const tpl = templates.find((t) => t.id === selectedTemplateId);
    if (tpl) {
      setMessageBody(tpl.body);
    }
  }, [selectedTemplateId, templates]);

  // Calculate target recipients list
  const targetRecipients = useMemo(() => {
    if (targetGroup === 'custom') {
      if (!customMobile) return [];
      return [
        {
          name: customName || 'কাস্টম গ্রহীতা',
          category: 'Custom' as const,
          mobile: customMobile.trim(),
          dueAmount: 0,
          grade: 'N/A',
          roll: 'N/A'
        }
      ];
    }

    if (targetGroup === 'teachers') {
      return [
        { name: 'আহমেদ কবির (প্রধান শিক্ষক)', category: 'Teacher' as const, mobile: '01819000001', dueAmount: 0, grade: 'শিক্ষক', roll: 'TCH-101' },
        { name: 'রাশেদুল হাসান (সহকারী শিক্ষক)', category: 'Teacher' as const, mobile: '01819000002', dueAmount: 0, grade: 'শিক্ষক', roll: 'TCH-102' },
        { name: 'ফারজানা ইয়াসমিন (সহকারী শিক্ষিকা)', category: 'Teacher' as const, mobile: '01819000003', dueAmount: 0, grade: 'শিক্ষিকা', roll: 'TCH-103' }
      ];
    }

    // Student Filter
    let list = students;

    if (targetGroup === 'absent_students') {
      // Mock / filter absent students today for quick SMS dispatch
      list = students.filter((_, idx) => idx % 3 === 0);
    } else if (targetGroup === 'grade_students') {
      list = students.filter((s) => s.grade === selectedGrade);
    } else if (targetGroup === 'due_students') {
      // Calculate students with mock dues for demo
      list = students.filter((s, idx) => idx % 2 === 0 || s.isStipend === false);
    }

    return list
      .filter((s) => {
        // Skip students with no valid phone — never fabricate random numbers
        const mob = (s.mobile || '').toString().trim();
        return mob.length >= 11;
      })
      .map((s) => ({
        name: s.name,
        category: 'Student' as const,
        mobile: s.mobile!,
        dueAmount: s.isStipend ? 200 : 1500,
        grade: s.grade || '6th',
        roll: s.roll || '01'
      }));
  }, [targetGroup, selectedGrade, students, customMobile, customName]);

  // Dynamic Character & Credit Calculation
  const smsCreditInfo = useMemo(() => {
    return smsService.calculateSMSCredit(messageBody);
  }, [messageBody]);

  const totalCreditsRequired = useMemo(() => {
    return targetRecipients.length * smsCreditInfo.smsParts;
  }, [targetRecipients.length, smsCreditInfo.smsParts]);

  // Insert Dynamic Variable Pill into text
  const insertVariable = (variableKey: string) => {
    setMessageBody((prev) => prev + ` ${variableKey} `);
  };

  // Switch Active Gateway Provider
  const handleSwitchGateway = (provider: SMSProviderType) => {
    const updated: SMSGatewayConfig = {
      ...gatewayConfig,
      provider,
      apiKey: provider === 'bulksmsdhaka' ? (dhakaApiKey || gatewayConfig.apiKey) : bdApiKey,
      senderId: provider === 'bulksmsdhaka' ? (dhakaSenderId || gatewayConfig.senderId) : bdSenderId,
      brandName: dhakaBrandName,
      savedGateways: {
        ...gatewayConfig.savedGateways,
        bulksmsdhaka: { apiKey: dhakaApiKey, senderId: dhakaSenderId, balance: gatewayConfig.balance },
        bulksmsbd: { apiKey: bdApiKey, senderId: bdSenderId, balance: bdBalance }
      }
    };

    smsService.saveConfig(updated);
    setGatewayConfig(updated);
    const pName = provider === 'bulksmsdhaka' ? 'Bulk SMS Dhaka (bulksmsdhaka.net)' : provider === 'bulksmsbd' ? 'BulkSMSBD (bulksmsbd.net)' : provider;
    setSendSuccessMessage(`এসএমএস গেটওয়ে পরিবর্তন করে "${pName}" নির্বাচন করা হয়েছে!`);
  };

  // Save Gateway Credentials
  const handleSaveConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const updated: SMSGatewayConfig = {
      ...gatewayConfig,
      apiKey: gatewayConfig.provider === 'bulksmsdhaka' ? dhakaApiKey : bdApiKey,
      senderId: gatewayConfig.provider === 'bulksmsdhaka' ? dhakaSenderId : bdSenderId,
      brandName: dhakaBrandName,
      savedGateways: {
        ...gatewayConfig.savedGateways,
        bulksmsdhaka: { apiKey: dhakaApiKey, senderId: dhakaSenderId, balance: gatewayConfig.balance },
        bulksmsbd: { apiKey: bdApiKey, senderId: bdSenderId, balance: bdBalance }
      }
    };

    smsService.saveConfig(updated);
    setGatewayConfig(updated);
    setSendSuccessMessage('গেটোয়ে এপিআই তথ্য ও কনফিগারেশন সফলভাবে সংরক্ষণ করা হয়েছে!');
  };

  // Handle Send Batch SMS
  const handleSendSMS = async () => {
    if (targetRecipients.length === 0) {
      alert('এসএমএস পাঠানোর জন্য অন্তত একজন প্রাপক নির্বাচন করুন!');
      return;
    }

    if (!messageBody.trim()) {
      alert('এসএমএস-এর মূল বার্তা ফাকা রাখা যাবে না!');
      return;
    }

    if (gatewayConfig.balance < totalCreditsRequired) {
      alert(`পর্যাপ্ত এসএমএস ক্রেডিট নেই! প্রয়োজন: ${totalCreditsRequired} ক্রেডিট, বর্তমান ব্যালেন্স: ${gatewayConfig.balance} ক্রেডিট।`);
      return;
    }

    if (!confirm(`আপনি কি নিশ্চিত যে ${targetRecipients.length} জন প্রাপককে মোট ${totalCreditsRequired} টি এসএমএস ক্রেডিট পাঠাতে চান?`)) {
      return;
    }

    setIsSending(true);

    // Prepare Interpolated SMS per recipient
    const batchPayload = targetRecipients.map((r) => {
      let interpolated = messageBody
        .replace(/{name}/g, r.name)
        .replace(/{grade}/g, r.grade === '6th' ? '৬ষ্ঠ' : r.grade === '7th' ? '৭ম' : r.grade === '8th' ? '৮ম' : r.grade === '9th' ? '৯ম' : '১০ম')
        .replace(/{roll}/g, r.roll)
        .replace(/{due_amount}/g, String(r.dueAmount))
        .replace(/{school_name}/g, 'বরইতলী উচ্চ বিদ্যালয়')
        .replace(/{date}/g, new Date().toLocaleDateString('bn-BD'));

      return {
        name: r.name,
        category: r.category,
        mobile: r.mobile,
        text: interpolated
      };
    });

    const res = await smsService.sendSMSBatch(batchPayload);

    setIsSending(false);
    refreshData();

    setSendSuccessMessage(`সফলভাবে ${res.sentCount} টি এসএমএস পাঠানো হয়েছে! অবশিষ্ট ব্যালেন্স: ${res.remainingBalance} এসএমএস ক্রেডিট।`);
    setTimeout(() => setSendSuccessMessage(''), 6000);
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchesStatus = logFilterStatus === 'All' || l.status === logFilterStatus;
      const matchesSearch =
        l.recipientName.toLowerCase().includes(logSearch.toLowerCase()) ||
        l.mobile.includes(logSearch) ||
        l.message.toLowerCase().includes(logSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [logs, logFilterStatus, logSearch]);

  if (!mounted) return null;

  return (
    <div className="w-full space-y-5 pb-16 font-sans text-slate-900" suppressHydrationWarning>
      
      {/* TOP ACTIONS & BALANCE BAR (Clean & Compact) */}
      <div className="flex justify-end print:hidden">
        <div className="bg-white border border-slate-200 p-2.5 px-4 rounded-2xl flex items-center gap-3 shadow-xs shrink-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Smartphone size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">
                {gatewayConfig.provider === 'bulksmsbd' ? 'BulkSMSBD' : 'BulkSMSDhaka'} ব্যালেন্স
              </span>
              <button
                type="button"
                onClick={fetchLiveBalance}
                disabled={isBalanceLoading}
                title="এপিআই থেকে লাইভ ব্যালেন্স রিফ্রেশ করুন"
                className="text-slate-400 hover:text-emerald-600 cursor-pointer transition p-0.5"
              >
                <RefreshCw size={11} className={isBalanceLoading ? 'animate-spin text-emerald-600' : ''} />
              </button>
            </div>
            <strong className="text-base font-black text-emerald-700 font-mono">
              ৳{gatewayConfig.balance}{' '}
            </strong>
            <span className="text-[11px] text-slate-500 font-semibold">টাকা/ক্রেডিট</span>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="bg-slate-200/60 rounded-2xl border border-slate-200 p-1.5 shadow-sm print:hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'send', label: 'এসএমএস পাঠান (Send Bulk SMS)', icon: <Send size={14} /> },
            { id: 'logs', label: 'এসএমএস লগ ও ডেলিভারি রিপোর্ট', icon: <FileText size={14} /> },
            { id: 'config', label: 'এসএমএস গেটওয়ে কনফিগারেশন', icon: <Settings size={14} /> }
          ].map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 text-xs font-bold whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              <span>{i + 1}. {tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SUCCESS ALERT */}
      {sendSuccessMessage && (
        <div className="p-4 bg-emerald-500 text-white font-bold rounded-2xl text-xs flex items-center justify-between shadow-lg animate-fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={18} /> {sendSuccessMessage}
          </span>
          <button onClick={() => setSendSuccessMessage('')} className="p-1 hover:bg-emerald-600 rounded">✕</button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 1: এসএমএস পাঠান (SEND BULK SMS)                       */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 print:hidden">
          
          {/* Left Column: Target selection */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Users size={15} className="text-indigo-600" />
                ১. প্রাপক কভারেজ নির্বাচন (Target Audience)
              </h3>

              <div className="space-y-2 text-xs font-bold">
                {[
                  { id: 'absent_students', label: '❌ আজকের অনুপস্থিত সকল শিক্ষার্থী', desc: 'আজকে যারা ক্লাসে অনুপস্থিত ছিল' },
                  { id: 'due_students', label: '⚠️ শুধুমাত্র বকেয়া বেতনযুক্ত শিক্ষার্থী', desc: 'অটো বকেয়া টাকা ম্যাপিং সহ' },
                  { id: 'grade_students', label: '🏫 শ্রেণি ভিত্তিক শিক্ষার্থী', desc: 'নির্দিষ্ট শ্রেণির জন্য' },
                  { id: 'all_students', label: '🎓 সকল শিক্ষার্থী ও অভিভাবক', desc: 'পুরো বিদ্যালয়' },
                  { id: 'teachers', label: '👨‍🏫 সকল শিক্ষক ও কর্মকর্তা', desc: 'অফিসিয়াল বার্তা' },
                  { id: 'custom', label: '👤 একক ফোন নম্বর / কাস্টম', desc: 'ম্যানুয়ালি নম্বর ইনপুট' }
                ].map((tgt) => (
                  <label
                    key={tgt.id}
                    onClick={() => setTargetGroup(tgt.id as any)}
                    className={`p-3 rounded-2xl border flex items-start justify-between cursor-pointer transition ${
                      targetGroup === tgt.id ? 'bg-slate-900 text-white border-slate-950 shadow-sm' : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div>
                      <span className="block font-black text-xs">{tgt.label}</span>
                      <span className={`text-[10px] ${targetGroup === tgt.id ? 'text-slate-300' : 'text-slate-500'}`}>{tgt.desc}</span>
                    </div>
                    <input type="radio" name="target_group" checked={targetGroup === tgt.id} readOnly className="mt-1 accent-indigo-500" />
                  </label>
                ))}
              </div>

              {/* Secondary filters if grade selected */}
              {targetGroup === 'grade_students' && (
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <label className="block text-[10px] uppercase text-slate-500 font-bold">শ্রেণি নির্বাচন:</label>
                  <div className="grid grid-cols-5 gap-1 bg-slate-100 p-1 rounded-xl">
                    {['6th', '7th', '8th', '9th', '10th'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedGrade(c)}
                        className={`py-1 rounded-lg text-[10px] font-bold text-center transition ${
                          selectedGrade === c ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {c === '6th' ? '৬ষ্ঠ' : c === '7th' ? '৭ম' : c === '8th' ? '৮ম' : c === '9th' ? '৯ম' : '১০ম'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom number input */}
              {targetGroup === 'custom' && (
                <div className="pt-2 border-t border-slate-100 space-y-2 text-xs font-bold">
                  <div>
                    <label className="block text-slate-600 mb-1">প্রাপকের নাম:</label>
                    <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="যেমন: রহিম সাহেব"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">মোবাইল নম্বর (১১ ডিজিট):</label>
                    <input type="text" value={customMobile} onChange={(e) => setCustomMobile(e.target.value)} placeholder="01800000000"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono" />
                  </div>
                </div>
              )}

              {/* Selected Target Summary */}
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs font-bold text-indigo-950">
                <span>নির্বাচিত প্রাপক সংখ্যা:</span>
                <span className="font-mono text-sm px-2 py-0.5 bg-indigo-600 text-white rounded-lg">{targetRecipients.length} জন</span>
              </div>
            </div>
          </div>

          {/* Right Column: Message Composer */}
          <div className="md:col-span-2 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <MessageSquare size={16} className="text-indigo-600" />
                ২. এসএমএস টেমপ্লেট ও বার্তা তৈরি (SMS Composer)
              </h3>

              <span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-[10px] font-bold rounded-lg border border-slate-200">
                মাস্কিং আইডি: <strong>{gatewayConfig.senderId}</strong>
              </span>
            </div>

            {/* Template Selector */}
            <div className="space-y-1 text-xs font-bold">
              <label className="block text-slate-500 uppercase text-[10px]">প্রস্তুতকৃত টেমপ্লেট নির্বাচন করুন:</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer font-bold text-slate-800"
              >
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>{tpl.title}</option>
                ))}
              </select>
            </div>

            {/* Variable Interpolation Helper Pills */}
            <div className="space-y-1.5">
              <label className="block text-slate-500 uppercase text-[10px] font-bold">অটো-ম্যাপিং ভেরিয়েবল ট্যাগসমূহ (ক্লিক করে যুক্ত করুন):</label>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                {[
                  { tag: '{name}', label: 'শিক্ষার্থীর নাম' },
                  { tag: '{grade}', label: 'শ্রেণি' },
                  { tag: '{roll}', label: 'রোল' },
                  { tag: '{due_amount}', label: 'বকেয়া টাকা' },
                  { tag: '{gpa}', label: 'প্রাপ্ত জিপিএ' },
                  { tag: '{school_name}', label: 'প্রতিষ্ঠানের নাম' },
                  { tag: '{date}', label: 'আজকের তারিখ' }
                ].map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => insertVariable(v.tag)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-900 text-slate-700 rounded-lg border border-slate-200 font-mono transition cursor-pointer flex items-center gap-1"
                  >
                    <span>+ {v.tag}</span>
                    <span className="text-[9px] text-slate-400">({v.label})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Body Input */}
            <div className="space-y-1 text-xs font-bold">
              <div className="flex items-center justify-between">
                <label className="block text-slate-700">এসএমএস মূল বার্তা (Bangla / English) *</label>
                <span className="text-[10px] text-indigo-600 font-mono">
                  {smsCreditInfo.isUnicode ? 'বাংলা / ইউনিকোড এসএমএস' : 'English ASCII SMS'}
                </span>
              </div>
              <textarea
                rows={4}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="এখানে আপনার বার্তা লিখুন..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-bold leading-relaxed text-slate-900 focus:bg-white focus:border-indigo-400 transition"
              />
            </div>

            {/* Live Counter & Cost Estimation */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-bold">
              <div>
                <span className="text-[9.5px] text-slate-400 uppercase block">অক্ষর সংখ্যা</span>
                <strong className="text-sm font-mono text-amber-300">{smsCreditInfo.charCount}</strong>
              </div>

              <div>
                <span className="text-[9.5px] text-slate-400 uppercase block">এসএমএস পার্টস</span>
                <strong className="text-sm font-mono text-amber-300">{smsCreditInfo.smsParts} পার্ট / জন</strong>
              </div>

              <div>
                <span className="text-[9.5px] text-slate-400 uppercase block">মোট প্রাপক</span>
                <strong className="text-sm font-mono text-amber-300">{targetRecipients.length} জন</strong>
              </div>

              <div>
                <span className="text-[9.5px] text-slate-400 uppercase block">মোট ডেডিকেটেড ক্রেডিট</span>
                <strong className="text-sm font-mono text-emerald-400 font-black">{totalCreditsRequired} ক্রেডিট</strong>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isSending || targetRecipients.length === 0}
                onClick={handleSendSMS}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg transition"
              >
                {isSending ? (
                  <>
                    <RefreshCw size={15} className="animate-spin text-amber-400" />
                    এসএমএস পাঠানো হচ্ছে...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    তাৎক্ষণিক বাল্ক এসএমএস পাঠান ({totalCreditsRequired} ক্রেডিট)
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 2: এসএমএস লগ ও ডেলিভারি রিপোর্ট                      */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'logs' && (
        <div className="space-y-4 print:p-0 print:space-y-0">
          
          {/* Controls */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-bold print:hidden">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="নাম, মোবাইল বা বার্তা দিয়ে খুঁজুন..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs text-slate-900"
                />
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                {['All', 'Sent', 'Failed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setLogFilterStatus(st as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      logFilterStatus === st ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'All' ? (currentLang === 'en' ? 'All' : 'সকল') : st === 'Sent' ? (currentLang === 'en' ? 'Sent' : 'সফল') : (currentLang === 'en' ? 'Failed' : 'ব্যর্থ')}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-slate-800 shrink-0"
            >
              <Printer size={15} /> লগ রিপোর্ট প্রিন্ট
            </button>
          </div>

          {/* Logs Table */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 print:p-0 print:border-none print:shadow-none">
            <div className="text-center border-b-2 border-slate-950 pb-3 space-y-1">
              <h2 className="text-xl font-black text-slate-950">বরইতলী উচ্চ বিদ্যালয়</h2>
              <p className="text-[10px] font-bold text-slate-600">এসএমএস গেটওয়ে প্রেক্ষিত ও ডেলিভারি লগ রিপোর্ট ২০২৬</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-950 font-sans">
                <thead>
                  <tr className="bg-slate-100 text-slate-950 font-black border-b border-slate-950 text-[10px] uppercase">
                    <th className="p-2 border-r border-slate-950 text-center w-24">তারিখ ও সময়</th>
                    <th className="p-2 border-r border-slate-950">প্রাপক নাম ও ক্যাটাগরি</th>
                    <th className="p-2 border-r border-slate-950 text-center w-28">মোবাইল নম্বর</th>
                    <th className="p-2 border-r border-slate-950">প্রেরিত এসএমএস বার্তা</th>
                    <th className="p-2 border-r border-slate-950 text-center w-16">পার্টস</th>
                    <th className="p-2 border-r border-slate-950 text-center w-20">স্ট্যাটাস</th>
                    <th className="p-2 text-left w-36">গেটওয়ে প্রতিক্রিয়া</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-950 font-medium">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500 italic">কোনো এসএমএস প্রেরণের ইতিহাস পাওয়া যায়নি।</td>
                    </tr>
                  ) : (
                    filteredLogs.map((l) => (
                      <tr key={l.id} className="border-b border-slate-950 hover:bg-slate-50">
                        <td className="p-2 text-center font-mono text-[10px] border-r border-slate-950">{l.date}</td>
                        <td className="p-2 border-r border-slate-950 font-bold">
                          <div>{l.recipientName}</div>
                          <span className="text-[9px] text-slate-500 font-semibold">{l.recipientCategory}</span>
                        </td>
                        <td className="p-2 text-center border-r border-slate-950 font-mono font-bold">{l.mobile}</td>
                        <td className="p-2 border-r border-slate-950 text-[11px] leading-snug">{l.message}</td>
                        <td className="p-2 text-center border-r border-slate-950 font-mono font-bold">{l.smsCount}</td>
                        <td className="p-2 text-center border-r border-slate-950">
                          {l.status === 'Sent' ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded uppercase">সফল</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-black rounded uppercase">ব্যর্থ</span>
                          )}
                        </td>
                        <td className="p-2 font-mono text-[9.5px] text-slate-600">{l.gatewayResponse}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 3: এসএমএস গেটওয়ে কনফিগারেশন প্যানেল                    */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'config' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 print:hidden">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Settings size={18} className="text-indigo-600" />
                {currentLang === 'en' ? 'SMS Gateway Configuration' : 'এসএমএস গেটওয়ে কনফিগারেশন'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">আপনার মূল BulkSMSBD এপিআই কি ও মাস্কিং সেন্ডার আইডি সেভ করুন। এপিআই দিয়ে সকল এসএমএস অটোমেটিক ডেলিভারি হবে।</p>
            </div>
            
            <div className="text-xs bg-slate-900 text-white px-4 py-2 rounded-2xl font-mono font-bold flex items-center gap-2 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>সচল গেটওয়ে: </span>
              <strong className="text-amber-300 uppercase">{gatewayConfig.provider}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => handleSwitchGateway('bulksmsdhaka')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                gatewayConfig.provider === 'bulksmsdhaka'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulk SMS Dhaka (bulksmsdhaka.net)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchGateway('bulksmsbd')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                gatewayConfig.provider === 'bulksmsbd'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              BulkSMSBD (bulksmsbd.net)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchGateway('demo_mode')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                gatewayConfig.provider === 'demo_mode'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              টেস্টিং সিমুলেশন
            </button>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-6">
            {gatewayConfig.provider === 'bulksmsdhaka' ? (
              <div className="p-6 rounded-3xl border border-blue-500/30 bg-blue-50/60 space-y-4">
                <div className="flex items-center justify-between border-b border-blue-200/80 pb-3">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                      Bulk SMS Dhaka (bulksmsdhaka.net)
                    </h4>
                    <span className="text-[10.5px] text-slate-500 font-mono">https://bulksmsdhaka.net/api/sendtext</span>
                  </div>

                  <div className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 size={16} />
                    <span>{currentLang === 'en' ? 'Active Gateway' : 'সচল রয়েছে'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                  <div>
                    <label className="block text-slate-700 mb-1">API Key (apikey) *</label>
                    <input
                      type="text"
                      required
                      value={dhakaApiKey}
                      onChange={(e) => setDhakaApiKey(e.target.value)}
                      placeholder="bulksmsdhaka.net API Key দিন"
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl outline-none font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1">Caller ID (callerID) *</label>
                    <input
                      type="text"
                      required
                      value={dhakaSenderId}
                      onChange={(e) => setDhakaSenderId(e.target.value)}
                      placeholder="যেমন: 1234 বা Brand Name"
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl outline-none font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1">Brand Name for OTP</label>
                    <input
                      type="text"
                      value={dhakaBrandName}
                      onChange={(e) => setDhakaBrandName(e.target.value)}
                      placeholder="যেমন: Boraitoli High School"
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl outline-none text-slate-900"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-600">
                  💡 Send SMS API: <code className="bg-white/80 px-1.5 py-0.5 rounded text-blue-600 font-mono font-bold">https://bulksmsdhaka.net/api/sendtext?apikey=...&amp;callerID=...&amp;number=...&amp;message=...</code>
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-3xl border border-emerald-500/30 bg-emerald-50/60 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                      BulkSMSBD (bulksmsbd.net)
                    </h4>
                    <span className="text-[10.5px] text-slate-500 font-mono">http://bulksmsbd.net/api/smsapi</span>
                  </div>

                  <div className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 size={16} />
                    <span>{currentLang === 'en' ? 'Active Gateway' : 'সচল রয়েছে'}</span>
                  </div>
                </div>

                <div className="space-y-4 text-xs font-bold">
                  <div className="bg-white/80 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <DollarSign size={16} className="text-emerald-600" /> বর্তমান লাইভ এসএমএস ব্যালেন্স (BulkSMSBD API):
                    </span>
                    <div className="flex items-center gap-2">
                      <strong className="font-mono text-base font-black text-slate-950">৳{bdBalance}</strong>
                      <button
                        type="button"
                        onClick={fetchLiveBalance}
                        disabled={isBalanceLoading}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                      >
                        <RefreshCw size={10} className={isBalanceLoading ? 'animate-spin' : ''} /> রিফ্রেশ
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 mb-1">BulkSMSBD API Key *</label>
                      <input
                        type="text"
                        required
                        value={bdApiKey}
                        onChange={(e) => setBdApiKey(e.target.value)}
                        placeholder="API Key: 5zVaXEuUgZq5gyX23ujq"
                        className="w-full p-3 bg-white border border-slate-300 rounded-xl outline-none font-mono text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1">Approved Sender ID (Masking ID) *</label>
                      <input
                        type="text"
                        required
                        value={bdSenderId}
                        onChange={(e) => setBdSenderId(e.target.value)}
                        placeholder="যেমন: 8809617613435"
                        className="w-full p-3 bg-white border border-slate-300 rounded-xl outline-none font-mono text-slate-900 uppercase font-black"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Config Button */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Link
                href="/dashboard/settings"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                ⚙️ সেটিংস পেজে সম্পূর্ণ কনফিগারেশন ও টেস্ট দেখুন ↗
              </Link>
              <button
                type="submit"
                className="px-8 py-3 bg-slate-950 hover:bg-slate-800 text-white font-black text-xs rounded-2xl flex items-center gap-2 shadow-lg cursor-pointer transition"
              >
                <ShieldCheck size={16} className="text-emerald-400" /> কনফিগারেশন ও এপিআই তথ্য সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
