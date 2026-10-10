'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  UserCheck, 
  Cpu, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight, 
  ArrowLeft,
  Server,
  Lock,
  ExternalLink
} from 'lucide-react';
import { clientLicenseService, ClientRegistrationState, HardwareInfo } from '@/services/clientLicenseService';
import { DIVISIONS, DISTRICTS_MAP } from '@/constants/locations';

export default function RegisterSchoolPage() {
  const router = useRouter();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null);
  const [state, setState] = useState<ClientRegistrationState | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    schoolName: '',
    eiinNumber: '',
    division: 'চট্টগ্রাম',
    district: 'কক্সবাজার',
    upazila: 'চকরিয়া',
    address: '',
    contactPhone: '',
    contactEmail: '',
    principalName: '',
    principalPhone: '',
    authorizedPerson: 'প্রধান শিক্ষক',
    studentCountEstimate: 500,
    teacherCountEstimate: 25,
  });

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [pollCount, setPollCount] = useState<number>(0);

  // Load Initial Hardware & Registration State
  useEffect(() => {
    async function loadInitial() {
      const hw = await clientLicenseService.getHardwareInfo();
      setHardwareInfo(hw);

      const regState = clientLicenseService.getRegistrationState();
      setState(regState);

      if (regState.isRegistered) {
        if (regState.status === 'APPROVED' && !regState.isLocked) {
          router.push('/login');
        } else {
          // Jump directly to pending/approval waiting screen
          setStep(4);
        }
      }
    }
    loadInitial();
  }, [router]);

  // Background Auto-Polling when on Step 4 (Waiting for Super Admin Approval)
  useEffect(() => {
    let timer: any = null;
    if (step === 4 && state?.schoolCode && state.status === 'PENDING') {
      timer = setInterval(async () => {
        setPollCount((prev) => prev + 1);
        const check = await clientLicenseService.checkRegistrationStatus(state.schoolCode);
        if (check.isApproved) {
          const updated = clientLicenseService.getRegistrationState();
          setState(updated);
        }
      }, 6000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, state]);

  // Handle Form Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('Count') ? parseInt(value, 10) || 0 : value,
    }));
  };

  // Submit Registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (!formData.schoolName.trim() || !formData.contactPhone.trim() || !formData.principalName.trim()) {
        setErrorMsg('অনুগ্রহ করে সকল তারকাচিহ্নিত (*) আবশ্যিক তথ্য সঠিকভাবে পূরণ করুন।');
        setLoading(false);
        return;
      }

      const res = await clientLicenseService.submitSchoolRegistration(formData);
      if (res.success) {
        const updated = clientLicenseService.getRegistrationState();
        setState(updated);
        setStep(4);
      } else {
        setErrorMsg('রেজিস্ট্রেশন জমা দিতে ব্যর্থ হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করুন।');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'অপ্রত্যাশিত সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // Manual Re-check Status Button
  const handleManualCheck = async () => {
    if (!state?.schoolCode) return;
    setCheckingStatus(true);
    try {
      const res = await clientLicenseService.checkRegistrationStatus(state.schoolCode);
      const updated = clientLicenseService.getRegistrationState();
      setState(updated);
      if (res.isApproved) {
        alert('অভিনন্দন! আপনার স্কুল সফলভাবে অনুমোদিত হয়েছে।');
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-slate-100 flex flex-col justify-between p-4 md:p-8">
      {/* Top Branding Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4 border-b border-slate-700/60">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              SchoolPro <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">Enterprise Setup</span>
            </h1>
            <p className="text-xs text-slate-400">অফলাইন-ফার্স্ট ডিজিটাল স্কুল ম্যানেজমেন্ট সফটওয়্যার</p>
          </div>
        </div>

        {hardwareInfo && (
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-emerald-400 font-semibold">{hardwareInfo.fingerprint}</span>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-3xl w-full mx-auto my-8 bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-6 md:p-10">
        
        {/* Step Progress Indicators */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-slate-700 -z-0" />
            {[
              { num: 1, label: 'প্রাতিষ্ঠানিক তথ্য' },
              { num: 2, label: 'যোগাযোগ ও কর্তৃপক্ষ' },
              { num: 3, label: 'ডিভাইস যাচাইকরণ' },
              { num: 4, label: 'অনুমোদন স্ট্যাটাস' }
            ].map((s) => (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step === s.num 
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/30 shadow-lg shadow-indigo-600/40' 
                      : step > s.num 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                </div>
                <span className={`text-[11px] mt-1.5 hidden md:block ${step === s.num ? 'text-indigo-400 font-medium' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Institutional Information */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-1">ধাপ ১: প্রতিষ্ঠানের মৌলিক তথ্য</h2>
            <p className="text-sm text-slate-400 mb-6">বিদ্যালয়ের নাম, ঠিকানা ও এলাকা নির্বাচন করুন।</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  প্রতিষ্ঠানের পূর্ণ নাম <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  placeholder="যেমন: বরইতলী উচ্চ বিদ্যালয়"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">EIIN নম্বর (যদি থাকে)</label>
                  <input
                    type="text"
                    name="eiinNumber"
                    value={formData.eiinNumber}
                    onChange={handleChange}
                    placeholder="যেমন: 106184"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">বিভাগ</label>
                  <select
                    name="division"
                    value={formData.division}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {DIVISIONS.map((div: string) => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">জেলা</label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {(DISTRICTS_MAP[formData.division] || ['কক্সবাজার']).map((dist: string) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">উপজেলা / থানা</label>
                  <input
                    type="text"
                    name="upazila"
                    value={formData.upazila}
                    onChange={handleChange}
                    placeholder="যেমন: চকরিয়া"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">বিস্তারিত ঠিকানা</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  placeholder="ডাকঘর, ইউনিয়ন, রোড ইত্যাদি..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.schoolName.trim()) {
                      setErrorMsg('প্রতিষ্ঠানের নাম প্রদান করা আবশ্যক।');
                      return;
                    }
                    setErrorMsg('');
                    setStep(2);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center space-x-2 transition-all shadow-lg shadow-indigo-600/30"
                >
                  <span>পরবর্তী ধাপ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Contacts & Authority */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-1">ধাপ ২: যোগাযোগ ও দায়িত্বপ্রাপ্ত ব্যক্তি</h2>
            <p className="text-sm text-slate-400 mb-6">প্রধান শিক্ষক এবং প্রতিষ্ঠানের দাপ্তরিক ফোন ও ইমেইল প্রদান করুন।</p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    প্রতিষ্ঠানের অফিসিয়াল ফোন <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">ইমেইল ঠিকানা</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="school@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    প্রধান শিক্ষক / অধ্যক্ষের নাম <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="principalName"
                    value={formData.principalName}
                    onChange={handleChange}
                    placeholder="যেমন: মোহাম্মদ রফিকুল ইসলাম"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">প্রধান শিক্ষকের ব্যক্তিগত ফোন</label>
                  <input
                    type="tel"
                    name="principalPhone"
                    value={formData.principalPhone}
                    onChange={handleChange}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">আনুমানিক শিক্ষার্থী সংখ্যা</label>
                  <input
                    type="number"
                    name="studentCountEstimate"
                    value={formData.studentCountEstimate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">মোট শিক্ষক সংখ্যা</label>
                  <input
                    type="number"
                    name="teacherCountEstimate"
                    value={formData.teacherCountEstimate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium flex items-center space-x-2 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>পূর্ববর্তী</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!formData.contactPhone.trim() || !formData.principalName.trim()) {
                      setErrorMsg('ফোন নম্বর এবং প্রধান শিক্ষকের নাম দেওয়া আবশ্যক।');
                      return;
                    }
                    setErrorMsg('');
                    setStep(3);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center space-x-2 transition-all shadow-lg shadow-indigo-600/30"
                >
                  <span>হার্ডওয়্যার যাচাই</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Hardware Verification & Final Submission */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-1">ধাপ ৩: উইন্ডোজ হার্ডওয়্যার ডিভাইস যাচাইকরণ</h2>
            <p className="text-sm text-slate-400 mb-6">
              লাইসেন্স সুরক্ষার স্বার্থে এই পিসির অনন্য SHA-256 হার্ডওয়্যার ফিঙ্গারপ্রিন্ট স্বয়ংক্রিয়ভাবে সংযুক্ত হচ্ছে।
            </p>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-4 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">হার্ডওয়্যার আইডেন্টিফায়ার</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {hardwareInfo?.platform || 'Windows 11 / 10 x64'} • {hardwareInfo?.deviceName}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ডিভাইস লক সমর্থিত
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-indigo-300 break-all flex items-center justify-between">
                <span>{hardwareInfo?.fingerprint || 'HW-CALCULATING...'}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400 ml-2 flex-shrink-0" />
              </div>

              <div className="text-xs text-slate-400 leading-relaxed space-y-1">
                <p>• এই ফিঙ্গারপ্রিন্টটি মাদারবোর্ড UUID, CPU প্রসেসর আইডি ও নেটওয়ার্ক ইন্টারফেস দিয়ে সুরক্ষিতভাবে তৈরি হয়েছে।</p>
                <p>• অনুমোদন সম্পন্ন হলে এই ডিভাইসের বাইরে অন্য কম্পিউটারে লাইসেন্সটি চালানো যাবে না।</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center space-x-3 mb-6">
              <Clock className="w-5 h-5 flex-shrink-0 text-amber-400" />
              <span>
                সাবমিট করার পর তথ্য কেন্দ্রীয় অনলাইন সার্ভারে জমা হবে। কেন্দ্রীয় সুপার অ্যাডমিন অনুমোদন দিলে সফটওয়্যার স্বয়ংক্রিয়ভাবে চালু হবে।
              </span>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium flex items-center space-x-2 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>পূর্ববর্তী</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center space-x-2 transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>জমা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>রেজিস্ট্রেশন চূড়ান্ত জমা দিন</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Live Status Console / Waiting for Super Admin Approval */}
        {step === 4 && (
          <div className="text-center py-4">
            {state?.status === 'APPROVED' && !state.isLocked ? (
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">প্রতিষ্ঠানটি সফলভাবে অনুমোদিত হয়েছে!</h2>
                  <p className="text-slate-300 text-sm max-w-md mx-auto">
                    সেন্ট্রাল সুপার অ্যাডমিন আপনার প্রতিষ্ঠানের সফটওয়্যার লাইসেন্স অনুমোদন করেছেন। ডিজিটাল ক্রিপ্টোগ্রাফিক কি সফলভাবে সিঙ্ক হয়েছে।
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 text-left max-w-md mx-auto space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">স্কুল কোড:</span>
                    <span className="font-mono text-indigo-400 font-bold">{state.schoolCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">লাইসেন্স প্ল্যান:</span>
                    <span className="text-emerald-400 font-semibold">{state.plan || 'Standard Edition'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">মেয়াদের তারিখ:</span>
                    <span className="text-slate-200">
                      {state.validUntil ? new Date(state.validUntil).toLocaleDateString('bn-BD') : '১ বছর'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-xl shadow-indigo-600/40 transition-all flex items-center space-x-2 mx-auto"
                >
                  <span>সফটওয়্যারে প্রবেশ করুন</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ) : state?.status === 'SUSPENDED' || state?.isLocked ? (
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-xl shadow-rose-500/20">
                  <Lock className="w-8 h-8" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">প্রতিষ্ঠানটি সাময়িকভাবে স্থগিত করা হয়েছে</h2>
                  <p className="text-rose-300 text-sm max-w-md mx-auto">
                    {state.lockoutReason || 'কেন্দ্রীয় সুপার অ্যাডমিন কর্তৃক প্রতিষ্ঠানটির একাউন্ট ও লাইসেন্স সাময়িকভাবে স্থগিত রাখা হয়েছে।'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 text-left max-w-md mx-auto space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">স্কুল কোড:</span>
                    <span className="font-mono text-rose-400 font-bold">{state?.schoolCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">লকড হওয়ার সময়:</span>
                    <span className="text-slate-200">{new Date().toLocaleString('bn-BD')}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={checkingStatus}
                  className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center space-x-2 mx-auto transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
                  <span>স্ট্যাটাস রি-চেক করুন</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pulsing Clock Icon */}
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
                  <div className="relative w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-xl shadow-amber-500/20">
                    <Clock className="w-8 h-8 animate-pulse" />
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">অনুমোদনের অপেক্ষায় রয়েছে...</h2>
                  <p className="text-slate-300 text-sm max-w-md mx-auto">
                    আপনার স্কুলের রেজিস্ট্রেশন সফলভাবে সেন্ট্রাল সার্ভারে সংরক্ষিত হয়েছে। সুপার অ্যাডমিন অনুমোদন করা মাত্র সফটওয়্যারটি স্বয়ংক্রিয়ভাবে সচল হবে।
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700 text-left max-w-md mx-auto space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800">
                    <span className="text-slate-400">প্রতিষ্ঠান:</span>
                    <span className="text-white font-semibold">{state?.schoolName || formData.schoolName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800">
                    <span className="text-slate-400">স্কুল ট্র্যাকিং কোড:</span>
                    <span className="font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {state?.schoolCode}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800">
                    <span className="text-slate-400">বর্তমান স্ট্যাটাস:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      PENDING APPROVAL
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ব্যাকগ্রাউন্ড পোলিং:</span>
                    <span className="text-slate-400 flex items-center gap-1 font-mono">
                      <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
                      চেক সম্পন্ন: {pollCount} বার
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleManualCheck}
                    disabled={checkingStatus}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center space-x-2 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingStatus ? 'animate-spin' : ''}`} />
                    <span>সার্ভার স্ট্যাটাস রি-চেক</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('আপনি কি পূর্ববর্তী তথ্যে ফিরে যেতে চান?')) {
                        setStep(1);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all"
                  >
                    তথ্য সংশোধন
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="max-w-4xl w-full mx-auto text-center py-4 text-xs text-slate-500">
        SchoolPro Security Engine v1.0 • Ed25519 Cryptographic Licensing & Hardware Fingerprinting
      </footer>
    </div>
  );
}
