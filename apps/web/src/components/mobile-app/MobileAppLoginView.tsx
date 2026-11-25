'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  Cloud,
  Edit3,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import { studentService, Student } from '@/services/studentService';
import TeacherOtpResetModal from '@/components/TeacherOtpResetModal';

interface MobileAppLoginViewProps {
  schoolName: string;
  schoolLogo?: string;
  schoolEiin?: string;
  onStaffLoginSuccess: (session: UserSession) => void;
  onGuardianVerifySuccess: (student: Student) => void;
}

export default function MobileAppLoginView({
  schoolName,
  schoolLogo,
  schoolEiin,
  onStaffLoginSuccess,
  onGuardianVerifySuccess,
}: MobileAppLoginViewProps) {
  const [roleTab, setRoleTab] = useState<'teacher' | 'guardian'>('teacher');
  const [logoError, setLogoError] = useState(false);

  // Teacher / Admin login form
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);

  // Guardian / Student verification form
  const [selectedGrade, setSelectedGrade] = useState('10th');
  const [verifyRoll, setVerifyRoll] = useState('');
  const [verifyPhone, setVerifyPhone] = useState('');
  const [verifyError, setVerifyError] = useState('');

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem('sms_mobile_remember_id') ||
        localStorage.getItem('sms_remember_identifier') ||
        '';
      if (saved) setIdentifier(saved);
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      setLoginError('অনুগ্রহ করে মোবাইল নম্বর/আইডি এবং পাসওয়ার্ড লিখুন।');
      return;
    }

    setLoginBusy(true);
    try {
      const res = await teacherAuthService.unifiedLogin(cleanId, cleanPass);
      if (!res.success) {
        setLoginError(res.message || 'লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করে আবার চেষ্টা করুন।');
        return;
      }

      try {
        if (rememberMe) {
          localStorage.setItem('sms_mobile_remember_id', cleanId);
        } else {
          localStorage.removeItem('sms_mobile_remember_id');
        }
      } catch {
        // Ignore storage quota issues
      }

      const nextSession = teacherAuthService.getSession();
      if (nextSession) {
        setPassword('');
        onStaffLoginSuccess(nextSession);
      } else {
        setLoginError('সেশন তৈরি করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    } catch {
      setLoginError('লগইন করার সময় অপ্রত্যাশিত ত্রুটি হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleGuardianSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError('');

    const cleanRoll = verifyRoll.trim().toLowerCase();
    const phoneDigits = verifyPhone.replace(/\D/g, '');
    if (!cleanRoll || phoneDigits.length < 4) {
      setVerifyError('অনুগ্রহ করে শিক্ষার্থীর রোল/আইডি এবং অভিভাবকের মোবাইলের শেষ ৪ সংখ্যা দিন।');
      return;
    }

    const students = studentService.getAllStudents();
    const matched = students.find((st) => {
      const gradeMatch = !selectedGrade || st.grade === selectedGrade;
      const rollMatch =
        String(st.roll || '').trim().toLowerCase() === cleanRoll ||
        st.id.toLowerCase() === cleanRoll;
      const legacy = st as { phone?: string; guardianPhone?: string };
      const studentPhone = String(st.mobile || legacy.phone || legacy.guardianPhone || '').replace(/\D/g, '');
      const phoneMatch =
        studentPhone.length >= 4 &&
        (studentPhone === phoneDigits || studentPhone.endsWith(phoneDigits.slice(-4)));
      return gradeMatch && rollMatch && phoneMatch;
    });

    if (!matched) {
      setVerifyError('তথ্য মেলেনি! অনুগ্রহ করে সঠিক শ্রেণি, রোল/আইডি ও নিবন্ধিত অভিভাবকের মোবাইল নম্বর দিন।');
      return;
    }

    try {
      sessionStorage.setItem('mobile_app_verified_student_id', matched.id);
    } catch {
      // Ignore sessionStorage restriction
    }
    onGuardianVerifySuccess(matched);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      {/* Top Branded Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-emerald-950 text-white px-5 pt-5 pb-14 shrink-0">
        <div className="pointer-events-none absolute -top-16 -right-12 w-48 h-48 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 w-44 h-44 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 text-[11px] font-bold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>ওয়েবসাইট</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[10px] font-extrabold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            মোবাইল অ্যাপ
          </span>
        </div>

        <div className="relative z-10 mt-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/95 dark:bg-slate-900 shadow-xl ring-4 ring-white/15 flex items-center justify-center overflow-hidden p-1.5">
            {schoolLogo && !logoError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={schoolLogo}
                alt={schoolName}
                onError={() => setLogoError(true)}
                className="w-full h-full object-contain"
              />
            ) : (
              <GraduationCap className="w-8 h-8 text-indigo-700 dark:text-indigo-400" />
            )}
          </div>
          <h1 className="mt-3 text-lg font-black tracking-tight text-white leading-snug">
            {schoolName}
          </h1>
          <p className="mt-0.5 text-[11px] font-semibold text-indigo-200/90 flex items-center gap-1.5">
            <span>স্মার্ট শিক্ষক ও ক্যাম্পাস পোর্টাল</span>
            {schoolEiin && (
              <>
                <span className="opacity-50">•</span>
                <span>EIIN: {schoolEiin}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Main Elevated Auth Card */}
      <div className="px-4 -mt-8 pb-6 flex-1 flex flex-col justify-between gap-4 relative z-20">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xl shadow-slate-900/10 border border-slate-200/90 dark:border-slate-800 space-y-4">
          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setRoleTab('teacher');
                setVerifyError('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                roleTab === 'teacher'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>শিক্ষক / অ্যাডমিন</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleTab('guardian');
                setLoginError('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                roleTab === 'guardian'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>অভিভাবক / শিক্ষার্থী</span>
            </button>
          </div>

          {roleTab === 'teacher' ? (
            <form onSubmit={handleStaffSubmit} className="space-y-3.5">
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  শিক্ষক অ্যাকাউন্টে লগইন করুন
                </h2>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  বরাদ্দকৃত বিষয়ের ফলাফল এন্ট্রি ও শ্রেণির দৈনিক হাজিরা নিন
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মোবাইল নম্বর অথবা আইডি
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="যেমন: 017XXXXXXXX বা TCH-1001"
                    autoComplete="username"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    পাসওয়ার্ড
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(true)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="আপনার পাসওয়ার্ড লিখুন"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <label className="inline-flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>ইউজার আইডি মনে রাখুন</span>
                </label>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <KeyRound className="w-3 h-3" /> সুরক্ষিত সেশন
                </span>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loginBusy}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60 text-white font-black text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
              >
                {loginBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>যাচাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>লগইন করে প্রবেশ করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleGuardianSubmit} className="space-y-3.5">
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  শিক্ষার্থী ও অভিভাবক যাচাইকরণ
                </h2>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  হাজিরা, পরীক্ষার ফলাফল, রুটিন ও ফি খতিয়ান দেখতে তথ্য দিন
                </p>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    শ্রেণি
                  </label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    aria-label="শ্রেণি নির্বাচন"
                    className="w-full px-2.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  >
                    <option value="6th">৬ষ্ঠ শ্রেণি</option>
                    <option value="7th">৭ম শ্রেণি</option>
                    <option value="8th">৮ম শ্রেণি</option>
                    <option value="9th">৯ম শ্রেণি</option>
                    <option value="10th">১০ম শ্রেণি</option>
                  </select>
                </div>
                <div className="col-span-7">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    রোল বা শিক্ষার্থী আইডি
                  </label>
                  <input
                    type="text"
                    required
                    value={verifyRoll}
                    onChange={(e) => setVerifyRoll(e.target.value)}
                    placeholder="যেমন: 01 বা ST-101"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অভিভাবকের মোবাইল নম্বর (সম্পূর্ণ বা শেষ ৪ সংখ্যা)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={verifyPhone}
                    onChange={(e) => setVerifyPhone(e.target.value)}
                    placeholder="যেমন: 017XXXXXXXX বা 4567"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {verifyError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{verifyError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
              >
                <span>যাচাই করে প্রবেশ করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Clean Minimal Feature Highlights Strip */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <div className="w-7 h-7 mx-auto rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Edit3 className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 block leading-tight">
              দ্রুত নম্বর এন্ট্রি
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <div className="w-7 h-7 mx-auto rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <CalendarCheck2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 block leading-tight">
              অটো-সেভ হাজিরা
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <div className="w-7 h-7 mx-auto rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Cloud className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 block leading-tight">
              লাইভ ক্লাউড সিংক
            </span>
          </div>
        </div>

        <p className="text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>সুরক্ষিত রোল-ভিত্তিক অ্যাক্সেস (RBAC) দ্বারা পরিচালিত</span>
        </p>
      </div>

      {/* Teacher OTP Password Reset Modal */}
      {showOtpModal && (
        <TeacherOtpResetModal
          isOpen={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          initialPhone={identifier}
          onSuccess={(phone, newPass) => {
            setIdentifier(phone);
            setPassword(newPass);
            setShowOtpModal(false);
          }}
        />
      )}
    </div>
  );
}
