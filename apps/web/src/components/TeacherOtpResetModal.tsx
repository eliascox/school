'use client';

import React, { useState, useEffect } from 'react';
import {
  Key,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  X,
  Sparkles,
  Clock,
  Loader2,
  Check,
  MessageSquare,
} from 'lucide-react';
import { teacherAuthService, normalizePhoneNumber } from '@/services/teacherAuthService';
import {
  AURORA_INPUT_CLASS,
  AURORA_INPUT_PR10_CLASS,
  AURORA_PRIMARY_BTN_CLASS,
} from '@/components/auth/AuroraLoginShell';

export type OtpResetRoleMode = 'teacher' | 'admin';

interface TeacherOtpResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (loginId: string, newPass: string, role?: OtpResetRoleMode) => void;
  initialPhone?: string;
  roleMode?: OtpResetRoleMode;
  allowRoleSwitch?: boolean;
}

export default function TeacherOtpResetModal({
  isOpen,
  onClose,
  onSuccess,
  initialPhone = '',
  roleMode = 'teacher',
  allowRoleSwitch = false,
}: TeacherOtpResetModalProps) {
  const [activeMode, setActiveMode] = useState<OtpResetRoleMode>(roleMode);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // State info
  const [recipientLabel, setRecipientLabel] = useState('');
  const [maskedAdminHint, setMaskedAdminHint] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isAdminMode = activeMode === 'admin';
  const otpDigits = isAdminMode ? 6 : 4;
  const minPassLen = isAdminMode ? 6 : 4;

  // Reset modal state on open or mode change
  useEffect(() => {
    if (isOpen) {
      setActiveMode(roleMode);
      setStep(1);
      const initialDigits = normalizePhoneNumber(initialPhone);
      setPhone(initialDigits.length >= 11 ? initialDigits : '');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setSuccessMsg('');
      setDemoOtp('');
      setIsDemoMode(false);
      setTimer(60);
      setCanResend(false);
      setMaskedAdminHint(teacherAuthService.getMaskedAdminRecoveryPhone());
    }
  }, [isOpen, initialPhone, roleMode]);

  const handleSwitchMode = (next: OtpResetRoleMode) => {
    setActiveMode(next);
    setStep(1);
    setOtp('');
    setErrorMsg('');
    setSuccessMsg('');
    setDemoOtp('');
    setIsDemoMode(false);
    setMaskedAdminHint(teacherAuthService.getMaskedAdminRecoveryPhone());
  };

  // Countdown timer for resending OTP
  useEffect(() => {
    if (step !== 2 || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!isOpen) return null;

  // ─── STEP 1: SEND OTP VIA SMS GATEWAY ─────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setDemoOtp('');
    setIsDemoMode(false);
    setIsLoading(true);

    const clean = normalizePhoneNumber(phone);
    if (!clean || clean.length < 11) {
      setIsLoading(false);
      setErrorMsg('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 018XXXXXXXX)।');
      return;
    }

    try {
      if (isAdminMode) {
        const res = await teacherAuthService.sendAdminResetOTP(phone);
        setIsLoading(false);
        if (res.success) {
          setRecipientLabel('প্রধান শিক্ষক / অ্যাডমিন');
          setIsDemoMode(Boolean(res.isDemoMode));
          if (res.isDemoMode && res.demoOtp) setDemoOtp(res.demoOtp);
          setSuccessMsg(res.message);
          setStep(2);
          setTimer(60);
          setCanResend(false);
        } else {
          setErrorMsg(res.message);
        }
      } else {
        const res = await teacherAuthService.sendTeacherResetOTP(phone);
        setIsLoading(false);
        if (res.success) {
          setRecipientLabel(res.teacherName || 'শিক্ষক');
          setIsDemoMode(Boolean(res.isDemoMode));
          if (res.isDemoMode && res.otp) setDemoOtp(res.otp);
          setSuccessMsg(res.message);
          setStep(2);
          setTimer(60);
          setCanResend(false);
        } else {
          setErrorMsg(res.message);
        }
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'OTP পাঠাতে ব্যর্থ হয়েছে।');
    }
  };

  // ─── RESEND OTP ───────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (!canResend) return;
    setErrorMsg('');
    setDemoOtp('');
    setIsLoading(true);
    try {
      const res = isAdminMode
        ? await teacherAuthService.sendAdminResetOTP(phone)
        : await teacherAuthService.sendTeacherResetOTP(phone);
      setIsLoading(false);
      if (res.success) {
        setIsDemoMode(Boolean(res.isDemoMode));
        const maybeDemo = isAdminMode
          ? (res as { demoOtp?: string }).demoOtp
          : (res as { otp?: string }).otp;
        if (res.isDemoMode && maybeDemo) setDemoOtp(maybeDemo);
        setSuccessMsg('নতুন OTP কোড সফলভাবে পাঠানো হয়েছে!');
        setTimer(60);
        setCanResend(false);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'OTP পুনরায় পাঠাতে সমস্যা হয়েছে।');
    }
  };

  // ─── STEP 2: VERIFY OTP ───────────────────────────────────────────
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanCode = normalizePhoneNumber(otp);
    if (!cleanCode || cleanCode.length !== otpDigits) {
      setErrorMsg(`অনুগ্রহ করে সঠিক ${otpDigits} ডিজিটের OTP কোড লিখুন।`);
      return;
    }

    const res = isAdminMode
      ? teacherAuthService.verifyAdminResetOTP(phone, cleanCode)
      : teacherAuthService.verifyTeacherResetOTP(phone, cleanCode);

    if (res.success) {
      setSuccessMsg(res.message);
      setStep(3);
    } else {
      setErrorMsg(res.message);
    }
  };

  // ─── STEP 3: RESET PASSWORD ───────────────────────────────────────
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword.trim() || newPassword.trim().length < minPassLen) {
      setErrorMsg(`নতুন পাসওয়ার্ড কমপক্ষে ${minPassLen} অক্ষরের হতে হবে।`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('দুই পাসওয়ার্ড একই হতে হবে! পুনরায় যাচাই করুন।');
      return;
    }

    setIsLoading(true);
    setTimeout(async () => {
      try {
        if (isAdminMode) {
          const res = await teacherAuthService.resetAdminPasswordWithOTP(phone, otp, newPassword);
          setIsLoading(false);
          if (res.success) {
            setSuccessMsg(res.message);
            setTimeout(() => {
              onSuccess(res.loginId || 'admin', newPassword, 'admin');
              onClose();
            }, 1100);
          } else {
            setErrorMsg(res.message);
          }
        } else {
          const res = await teacherAuthService.resetTeacherPasswordWithOTP(phone, otp, newPassword);
          setIsLoading(false);
          if (res.success) {
            setSuccessMsg(res.message);
            setTimeout(() => {
              onSuccess(normalizePhoneNumber(phone), newPassword, 'teacher');
              onClose();
            }, 1100);
          } else {
            setErrorMsg(res.message);
          }
        }
      } catch {
        setIsLoading(false);
        setErrorMsg('পাসওয়ার্ড আপডেটে সমস্যা হয়েছে।');
      }
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="relative w-full max-w-md rounded-[26px] border border-indigo-200/80 shadow-[0_24px_64px_-16px_rgba(79,70,229,0.22)] p-6 sm:p-7 space-y-5 text-slate-900 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 75%, #F7F4FF 100%)',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          aria-label="বন্ধ করুন"
        >
          <X size={18} />
        </button>

        {/* Header Badge & Title */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4B6BFF] via-[#8B5CF6] to-[#D946EF] flex items-center justify-center text-white shadow-md shadow-violet-500/30 shrink-0">
            <Key size={22} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              {isAdminMode ? 'অ্যাডমিন পাসওয়ার্ড রিসেট (SMS OTP)' : 'শিক্ষক পাসওয়ার্ড রিসেট (SMS OTP)'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {isAdminMode
                ? 'অ্যাডমিনের নিবন্ধিত মোবাইল নম্বরে ৬ ডিজিটের SMS OTP যাচাই'
                : 'শিক্ষকের নিবন্ধিত মোবাইল নম্বরে ৪ ডিজিটের SMS OTP যাচাই'}
            </p>
          </div>
        </div>

        {/* Optional Role Switcher (used on Mobile App combined Staff tab) */}
        {allowRoleSwitch && step === 1 && (
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#EEF2FF] border border-indigo-200/70">
            <button
              type="button"
              onClick={() => handleSwitchMode('teacher')}
              className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                !isAdminMode
                  ? 'bg-gradient-to-r from-[#4B6BFF] to-[#9333EA] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👨‍🏫 সহকারী শিক্ষক
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('admin')}
              className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                isAdminMode
                  ? 'bg-gradient-to-r from-[#4B6BFF] to-[#9333EA] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👑 প্রধান শিক্ষক / অ্যাডমিন
            </button>
          </div>
        )}

        {/* Step Progression Indicators */}
        <div className="flex items-center justify-between gap-2 px-1">
          {[
            { num: 1, label: 'মোবাইল নম্বর' },
            { num: 2, label: 'SMS OTP' },
            { num: 3, label: 'নতুন পাসওয়ার্ড' },
          ].map((s) => (
            <div key={s.num} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step === s.num
                    ? 'bg-gradient-to-r from-[#4B6BFF] to-[#A855F7] text-white ring-4 ring-violet-500/15 shadow-sm'
                    : step > s.num
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                {step > s.num ? <Check size={14} /> : s.num}
              </div>
              <span
                className={`text-[10px] font-bold ${
                  step === s.num ? 'text-[#6366F1]' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Alert Notifications */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-start gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Explicit Demo Mode Notice ONLY */}
        {isDemoMode && demoOtp && step === 2 && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-amber-600 shrink-0" />
              <span>
                ডেমো OTP:{' '}
                <strong className="text-slate-950 font-mono text-sm tracking-widest">{demoOtp}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOtp(demoOtp)}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-[10px] font-black cursor-pointer transition"
            >
              বসান
            </button>
          </div>
        )}

        {/* Live SMS Gateway Delivery Indicator */}
        {!isDemoMode && step === 2 && (
          <div className="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-[11px] font-semibold flex items-center gap-2">
            <MessageSquare size={15} className="text-[#6366F1] shrink-0" />
            <span>আপনার মোবাইলের SMS ইনবক্স চেক করুন — কোডটি সরাসরি SMS গেটওয়ে দিয়ে পাঠানো হয়েছে।</span>
          </div>
        )}

        {/* ══ STEP 1: PHONE NUMBER INPUT ══ */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-700 font-bold flex items-center justify-between gap-2">
                <span>
                  {isAdminMode
                    ? 'অ্যাডমিনের নিবন্ধিত মোবাইল নম্বর'
                    : 'শিক্ষকের নিবন্ধিত মোবাইল নম্বর'}
                </span>
                {isAdminMode && maskedAdminHint && (
                  <span className="text-[10.5px] font-mono text-[#7C3AED] font-extrabold">
                    নিবন্ধিত: {maskedAdminHint}
                  </span>
                )}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#6366F1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  required
                  autoFocus
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="যেমন: 01812345671"
                  className={AURORA_INPUT_CLASS}
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isAdminMode
                  ? 'সেটিংসে সংরক্ষিত অ্যাডমিনের নিজস্ব ১১ ডিজিটের মোবাইল নম্বরে SMS গেটওয়ে দিয়ে OTP যাবে।'
                  : 'শিক্ষক তালিকায় নিবন্ধিত আপনার নিজস্ব ১১ ডিজিটের মোবাইল নম্বরে SMS OTP যাবে।'}
              </p>
            </div>

            <button type="submit" disabled={isLoading} className={AURORA_PRIMARY_BTN_CLASS}>
              {isLoading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>যাচাই ও SMS OTP পাঠানো হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>SMS-এ OTP কোড পাঠান</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ══ STEP 2: ENTER OTP ══ */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
            <div className="space-y-2 text-center">
              <p className="text-slate-600 font-medium">
                <strong className="text-slate-900">{recipientLabel}</strong> — আপনার{' '}
                <span className="font-mono text-[#6366F1] font-bold">{phone}</span> নম্বরে প্রেরিত{' '}
                {otpDigits} ডিজিটের OTP লিখুন।
              </p>

              <div className="pt-1">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={otpDigits}
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9০-৯]/g, ''))}
                  placeholder={isAdminMode ? '• • • • • •' : '• • • •'}
                  className="w-56 mx-auto text-center py-3 bg-[#F5F7FF] border-2 border-[#7C3AED]/55 rounded-2xl text-2xl font-mono font-black text-slate-900 tracking-[0.38em] focus:outline-none focus:bg-white focus:border-[#7C3AED] focus:ring-4 focus:ring-violet-500/15 transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-mono">
                <Clock size={13} className="text-slate-400" />
                <span>পুনরায় পাঠানো: {timer > 0 ? `${timer} সেকেন্ড` : 'প্রস্তুত'}</span>
              </div>

              <button
                type="button"
                disabled={!canResend || isLoading}
                onClick={handleResendOtp}
                className="text-[#7C3AED] hover:text-[#A21CAF] disabled:text-slate-400 transition flex items-center gap-1 font-bold cursor-pointer disabled:cursor-not-allowed"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                <span>পুনরায় OTP পাঠান</span>
              </button>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                নম্বর পরিবর্তন
              </button>

              <button
                type="submit"
                className="flex-[1.5] py-3 bg-gradient-to-r from-[#4B6BFF] via-[#8B5CF6] to-[#D946EF] hover:brightness-105 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>OTP যাচাই করুন</span>
                <CheckCircle2 size={16} />
              </button>
            </div>
          </form>
        )}

        {/* ══ STEP 3: SET NEW PASSWORD ══ */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 font-semibold">
              <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
              <span>OTP সফলভাবে যাচাই হয়েছে। এখন নতুন পাসওয়ার্ড সেট করুন।</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 font-bold block">
                নতুন পাসওয়ার্ড (কমপক্ষে {minPassLen} অক্ষর) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6366F1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={minPassLen}
                  autoFocus
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="নতুন শক্তিশালী পাসওয়ার্ড লিখুন"
                  className={AURORA_INPUT_PR10_CLASS}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 font-bold block">
                নতুন পাসওয়ার্ড নিশ্চিত করুন *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6366F1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={minPassLen}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                  className={AURORA_INPUT_CLASS}
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className={AURORA_PRIMARY_BTN_CLASS}>
              {isLoading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>পাসওয়ার্ড সংরক্ষণ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={17} />
                  <span>নতুন পাসওয়ার্ড সংরক্ষণ করুন</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
