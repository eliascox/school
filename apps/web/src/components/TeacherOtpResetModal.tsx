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
    <div className="fixed inset-0 z-50 bg-[#02040D]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="relative w-full max-w-md rounded-[26px] border border-[#8B7BFF]/40 shadow-[0_28px_80px_-14px_rgba(79,70,229,0.55)] p-6 sm:p-7 space-y-5 text-white overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #1B1A60 0%, #0E1233 35%, #070B1E 100%)',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          aria-label="বন্ধ করুন"
        >
          <X size={18} />
        </button>

        {/* Header Badge & Title */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4B6BFF] via-[#8F5BFF] to-[#E64DF7] flex items-center justify-center text-white shadow-lg shadow-violet-600/35 shrink-0">
            <Key size={22} />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">
              {isAdminMode ? 'অ্যাডমিন পাসওয়ার্ড রিসেট (SMS OTP)' : 'শিক্ষক পাসওয়ার্ড রিসেট (SMS OTP)'}
            </h3>
            <p className="text-[11px] text-indigo-200/80 font-medium">
              {isAdminMode
                ? 'অ্যাডমিনের নিবন্ধিত মোবাইল নম্বরে ৬ ডিজিটের SMS OTP যাচাই'
                : 'শিক্ষকের নিবন্ধিত মোবাইল নম্বরে ৪ ডিজিটের SMS OTP যাচাই'}
            </p>
          </div>
        </div>

        {/* Optional Role Switcher (used on Mobile App combined Staff tab) */}
        {allowRoleSwitch && step === 1 && (
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#080D22]/85 border border-indigo-400/20">
            <button
              type="button"
              onClick={() => handleSwitchMode('teacher')}
              className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                !isAdminMode
                  ? 'bg-gradient-to-r from-[#4B6BFF] to-[#9333EA] text-white'
                  : 'text-slate-300 hover:text-white'
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
                  : 'text-slate-300 hover:text-white'
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
                    ? 'bg-gradient-to-r from-[#4B6BFF] to-[#C084FC] text-white ring-4 ring-violet-500/25 shadow-md'
                    : step > s.num
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#0B122B] text-slate-400 border border-indigo-400/25'
                }`}
              >
                {step > s.num ? <Check size={14} /> : s.num}
              </div>
              <span
                className={`text-[10px] font-bold ${
                  step === s.num ? 'text-[#C4B5FD]' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Alert Notifications */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/15 border border-rose-400/35 text-rose-200 rounded-xl text-xs font-semibold flex items-start gap-2">
            <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-400/35 text-emerald-200 rounded-xl text-xs font-semibold flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Explicit Demo Mode Notice ONLY (NEVER shown when live SMS Gateway is active!) */}
        {isDemoMode && demoOtp && step === 2 && (
          <div className="p-3 bg-amber-500/15 border border-amber-400/35 text-amber-200 rounded-xl text-xs font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-amber-400 shrink-0" />
              <span>
                ডেমো OTP:{' '}
                <strong className="text-white font-mono text-sm tracking-widest">{demoOtp}</strong>
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
          <div className="p-2.5 bg-indigo-500/15 border border-indigo-400/30 text-indigo-200 rounded-xl text-[11px] font-medium flex items-center gap-2">
            <MessageSquare size={15} className="text-[#C084FC] shrink-0" />
            <span>আপনার মোবাইলের SMS ইনবক্স চেক করুন — কোডটি সরাসরি SMS গেটওয়ে দিয়ে পাঠানো হয়েছে।</span>
          </div>
        )}

        {/* ══ STEP 1: PHONE NUMBER INPUT ══ */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-200 font-semibold flex items-center justify-between gap-2">
                <span>
                  {isAdminMode
                    ? 'অ্যাডমিনের নিবন্ধিত মোবাইল নম্বর'
                    : 'শিক্ষকের নিবন্ধিত মোবাইল নম্বর'}
                </span>
                {isAdminMode && maskedAdminHint && (
                  <span className="text-[10.5px] font-mono text-[#D875FF] font-bold">
                    নিবন্ধিত: {maskedAdminHint}
                  </span>
                )}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#A78BFA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
              <p className="text-[11px] text-slate-400 leading-relaxed">
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
              <p className="text-slate-300 font-medium">
                <strong className="text-white">{recipientLabel}</strong> — আপনার{' '}
                <span className="font-mono text-[#C4B5FD] font-bold">{phone}</span> নম্বরে প্রেরিত{' '}
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
                  className="w-56 mx-auto text-center py-3 bg-[#080E26] border-2 border-[#8B5CF6]/70 rounded-2xl text-2xl font-mono font-black text-white tracking-[0.38em] focus:outline-none focus:border-[#E879F9] focus:ring-4 focus:ring-violet-500/25 transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                <Clock size={13} className="text-slate-500" />
                <span>পুনরায় পাঠানো: {timer > 0 ? `${timer} সেকেন্ড` : 'প্রস্তুত'}</span>
              </div>

              <button
                type="button"
                disabled={!canResend || isLoading}
                onClick={handleResendOtp}
                className="text-[#D875FF] hover:text-[#F0ABFC] disabled:text-slate-600 transition flex items-center gap-1 font-bold cursor-pointer disabled:cursor-not-allowed"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                <span>পুনরায় OTP পাঠান</span>
              </button>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-white/[0.08] hover:bg-white/[0.14] border border-indigo-400/20 text-slate-200 font-bold rounded-xl transition cursor-pointer"
              >
                নম্বর পরিবর্তন
              </button>

              <button
                type="submit"
                className="flex-[1.5] py-3 bg-gradient-to-r from-[#4B6BFF] via-[#8F5BFF] to-[#E64DF7] hover:brightness-110 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
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
            <div className="p-3 bg-emerald-500/15 border border-emerald-400/30 rounded-xl flex items-center gap-2 text-emerald-200 font-medium">
              <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
              <span>OTP সফলভাবে যাচাই হয়েছে। এখন নতুন পাসওয়ার্ড সেট করুন।</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-200 font-semibold block">
                নতুন পাসওয়ার্ড (কমপক্ষে {minPassLen} অক্ষর) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A78BFA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-200 font-semibold block">
                নতুন পাসওয়ার্ড নিশ্চিত করুন *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A78BFA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
