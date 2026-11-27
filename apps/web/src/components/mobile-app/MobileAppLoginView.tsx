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
import {
  AURORA_EMERALD_BTN_CLASS,
  AURORA_INPUT_CLASS,
  AURORA_INPUT_PR10_CLASS,
  AURORA_PRIMARY_BTN_CLASS,
  AuroraEmblemTile,
  AuroraLoginCard,
} from '@/components/auth/AuroraLoginShell';

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

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);

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
      // Ignore storage errors
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
      const studentPhone = String(
        st.mobile || legacy.phone || legacy.guardianPhone || '',
      ).replace(/\D/g, '');
      const phoneMatch =
        studentPhone.length >= 4 &&
        (studentPhone === phoneDigits || studentPhone.endsWith(phoneDigits.slice(-4)));
      return gradeMatch && rollMatch && phoneMatch;
    });

    if (!matched) {
      setVerifyError(
        'তথ্য মেলেনি! অনুগ্রহ করে সঠিক শ্রেণি, রোল/আইডি ও নিবন্ধিত অভিভাবকের মোবাইল নম্বর দিন।',
      );
      return;
    }

    try {
      sessionStorage.setItem('mobile_app_verified_student_id', matched.id);
    } catch {
      // Ignore restriction
    }
    onGuardianVerifySuccess(matched);
  };

  return (
    <AuroraLoginCard variant="mobile-full" className="overflow-y-auto">
      {/* Top Status Navigation Row */}
      <div className="px-5 pt-5 pb-2 flex items-center justify-between shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#F5F7FF] hover:bg-indigo-50 border border-indigo-200/80 text-slate-700 text-[11px] font-bold transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#6366F1]" />
          <span>ওয়েবসাইট</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-[#7C3AED] text-[10px] font-extrabold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D946EF] animate-pulse" />
          মোবাইল অ্যাপ
        </span>
      </div>

      {/* Main Content Stack */}
      <div className="px-5 pt-4 pb-24 flex-1 flex flex-col justify-between gap-5">
        <div className="space-y-5">
          {/* Glowing Floating White Emblem + School Branding */}
          <div className="flex flex-col items-center text-center">
            <AuroraEmblemTile
              schoolLogo={schoolLogo}
              schoolName={schoolName}
              logoFailed={logoError}
              onLogoError={() => setLogoError(true)}
              badgeContent={
                roleTab === 'teacher' ? (
                  <ShieldCheck className="w-3 h-3" />
                ) : (
                  <GraduationCap className="w-3 h-3" />
                )
              }
              badgeTitle={roleTab === 'teacher' ? 'শিক্ষক / অ্যাডমিন' : 'অভিভাবক / শিক্ষার্থী'}
            />
            <h1 className="mt-4 text-xl font-extrabold tracking-tight text-slate-900 leading-snug">
              {schoolName}
            </h1>
            <p className="mt-1 text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <span>স্মার্ট ক্যাম্পাস মোবাইল পোর্টাল</span>
              {schoolEiin && (
                <>
                  <span className="opacity-50">•</span>
                  <span>EIIN: {schoolEiin}</span>
                </>
              )}
            </p>
          </div>

          {/* Clean Light-Indigo Role Switcher Pill */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#EEF2FF] border border-indigo-200/70">
            <button
              type="button"
              onClick={() => {
                setRoleTab('teacher');
                setVerifyError('');
              }}
              className={`py-2.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                roleTab === 'teacher'
                  ? 'bg-gradient-to-r from-[#4B6BFF] to-[#9333EA] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>শিক্ষক / অ্যাডমিন</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleTab('guardian');
                setLoginError('');
              }}
              className={`py-2.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                roleTab === 'guardian'
                  ? 'bg-gradient-to-r from-[#0284C7] to-[#059669] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              <span>অভিভাবক / শিক্ষার্থী</span>
            </button>
          </div>

          {roleTab === 'teacher' ? (
            <form onSubmit={handleStaffSubmit} className="space-y-3.5">
              <div className="text-center">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  অ্যাকাউন্টে লগইন করুন
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ফলাফল এন্ট্রি ও শ্রেণির দৈনিক হাজিরা পরিচালনা করুন
                </p>
              </div>

              <div className="relative">
                <User className="w-4 h-4 text-[#6366F1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="মোবাইল নম্বর অথবা শিক্ষক আইডি"
                  autoComplete="username"
                  aria-label="মোবাইল নম্বর অথবা আইডি"
                  className={AURORA_INPUT_CLASS}
                />
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-[#6366F1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড"
                  autoComplete="current-password"
                  aria-label="পাসওয়ার্ড"
                  className={AURORA_INPUT_PR10_CLASS}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="inline-flex items-center gap-2 font-medium text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-indigo-300 bg-white accent-[#7C3AED]"
                  />
                  <span>মনে রাখুন</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowOtpModal(true)}
                  className="font-bold text-[#7C3AED] hover:text-[#A21CAF] transition cursor-pointer"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <button type="submit" disabled={loginBusy} className={AURORA_PRIMARY_BTN_CLASS}>
                {loginBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>যাচাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>লগইন করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleGuardianSubmit} className="space-y-3.5">
              <div className="text-center">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  শিক্ষার্থী ও অভিভাবক যাচাইকরণ
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  হাজিরা, ফলাফল, রুটিন ও ফি খতিয়ান দেখুন
                </p>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    aria-label="শ্রেণি নির্বাচন"
                    className="w-full px-3 py-3 rounded-xl bg-[#F5F7FF] border border-indigo-200/80 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-500"
                  >
                    <option value="6th">৬ষ্ঠ শ্রেণি</option>
                    <option value="7th">৭ম শ্রেণি</option>
                    <option value="8th">৮ম শ্রেণি</option>
                    <option value="9th">৯ম শ্রেণি</option>
                    <option value="10th">১০ম শ্রেণি</option>
                  </select>
                </div>
                <div className="col-span-7">
                  <input
                    type="text"
                    required
                    value={verifyRoll}
                    onChange={(e) => setVerifyRoll(e.target.value)}
                    placeholder="রোল বা আইডি (যেমন: 01)"
                    aria-label="রোল বা শিক্ষার্থী আইডি"
                    className="w-full px-3.5 py-3 rounded-xl bg-[#F5F7FF] border border-indigo-200/80 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={verifyPhone}
                  onChange={(e) => setVerifyPhone(e.target.value)}
                  placeholder="অভিভাবকের মোবাইল (সম্পূর্ণ বা শেষ ৪ সংখ্যা)"
                  aria-label="অভিভাবকের মোবাইল নম্বর"
                  className={AURORA_INPUT_CLASS}
                />
              </div>

              {verifyError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{verifyError}</span>
                </div>
              )}

              <button type="submit" className={AURORA_EMERALD_BTN_CLASS}>
                <span>যাচাই করে প্রবেশ করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Clean White Frosted Mini Feature Strip */}
        <div className="space-y-2.5 pt-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-white/85 backdrop-blur-xs border border-indigo-100 shadow-2xs space-y-1">
              <div className="w-7 h-7 mx-auto rounded-xl bg-indigo-50 text-[#6366F1] flex items-center justify-center">
                <Edit3 className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 block leading-tight">
                দ্রুত নম্বর এন্ট্রি
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/85 backdrop-blur-xs border border-indigo-100 shadow-2xs space-y-1">
              <div className="w-7 h-7 mx-auto rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <CalendarCheck2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 block leading-tight">
                অটো-সেভ হাজিরা
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/85 backdrop-blur-xs border border-indigo-100 shadow-2xs space-y-1">
              <div className="w-7 h-7 mx-auto rounded-xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center">
                <Cloud className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 block leading-tight">
                ক্লাউড সিংক
              </span>
            </div>
          </div>

          <p className="text-center text-[10px] font-semibold text-slate-500 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-[#7C3AED]" />
            <span>সুরক্ষিত রোল-ভিত্তিক অ্যাক্সেস (RBAC) দ্বারা পরিচালিত</span>
          </p>
        </div>
      </div>

      {/* Unified White-Pearl SMS OTP Password Reset Modal */}
      {showOtpModal && (
        <TeacherOtpResetModal
          isOpen={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          initialPhone={identifier}
          roleMode="teacher"
          allowRoleSwitch={true}
          onSuccess={(loginId, newPass) => {
            setIdentifier(loginId);
            setPassword(newPass);
            setShowOtpModal(false);
          }}
        />
      )}
    </AuroraLoginCard>
  );
}
