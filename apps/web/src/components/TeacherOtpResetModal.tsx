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
  Check
} from 'lucide-react';
import { teacherAuthService, normalizePhoneNumber } from '@/services/teacherAuthService';

interface TeacherOtpResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (phone: string, newPass: string) => void;
  initialPhone?: string;
}

export default function TeacherOtpResetModal({
  isOpen,
  onClose,
  onSuccess,
  initialPhone = ''
}: TeacherOtpResetModalProps) {
  // Steps: 1 = Enter Phone, 2 = Verify OTP, 3 = Set New Password
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // State info
  const [teacherName, setTeacherName] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPhone(initialPhone);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setSuccessMsg('');
      setSimulatedOtp('');
      setTimer(60);
      setCanResend(false);
    }
  }, [isOpen, initialPhone]);

  // Countdown timer for resending OTP
  useEffect(() => {
    let interval: any = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  if (!isOpen) return null;

  // ─── STEP 1: SEND OTP ─────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    const clean = normalizePhoneNumber(phone);
    if (!clean || clean.length < 11) {
      setIsLoading(false);
      setErrorMsg('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 018XXXXXXXX)');
      return;
    }

    try {
      const res = await teacherAuthService.sendTeacherResetOTP(phone);
      setIsLoading(false);

      if (res.success) {
        setTeacherName(res.teacherName || 'শিক্ষক');
        if (res.otp) {
          setSimulatedOtp(res.otp);
        }
        setSuccessMsg(res.message);
        setStep(2);
        setTimer(60);
        setCanResend(false);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'OTP পাঠাতে ব্যর্থ হয়েছে।');
    }
  };

  // ─── RESEND OTP ───────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (!canResend) return;
    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await teacherAuthService.sendTeacherResetOTP(phone);
      setIsLoading(false);
      if (res.success) {
        if (res.otp) setSimulatedOtp(res.otp);
        setSuccessMsg('নতুন OTP কোড সফলভাবে পাঠানো হয়েছে!');
        setTimer(60);
        setCanResend(false);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'OTP পুনরায় পাঠাতে সমস্যা হয়েছে।');
    }
  };

  // ─── STEP 2: VERIFY OTP ───────────────────────────────────────────
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!otp || otp.trim().length !== 4) {
      setErrorMsg('অনুগ্রহ করে সঠিক ৪ ডিজিটের OTP কোড লিখুন।');
      return;
    }

    const res = teacherAuthService.verifyTeacherResetOTP(phone, otp);
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

    if (!newPassword.trim() || newPassword.length < 4) {
      setErrorMsg('নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('দুই পাসওয়ার্ড একই হতে হবে! পুনরায় যাচাই করুন।');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = teacherAuthService.resetTeacherPasswordWithOTP(phone, otp, newPassword);
      setIsLoading(false);

      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onSuccess(normalizePhoneNumber(phone), newPassword);
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.message);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900/95 border border-white/20 shadow-2xl rounded-3xl p-6 sm:p-7 space-y-5 text-slate-100">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header Badge & Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Key size={22} />
          </div>
          <div>
            <h3 className="font-black text-white text-base">শিক্ষক পাসওয়ার্ড রিসেট (OTP)</h3>
            <p className="text-xs text-indigo-300 font-medium">নিবন্ধিত মোবাইল নম্বরে OTP যাচাই করে পাসওয়ার্ড পরিবর্তন</p>
          </div>
        </div>

        {/* Step Progression Indicators */}
        <div className="flex items-center justify-between gap-2 px-1">
          {[
            { num: 1, label: 'ফোন নম্বর' },
            { num: 2, label: 'OTP কোড' },
            { num: 3, label: 'নতুন পাসওয়ার্ড' }
          ].map((s) => (
            <div key={s.num} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step === s.num
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20 shadow-md'
                    : step > s.num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {step > s.num ? <Check size={14} /> : s.num}
              </div>
              <span className={`text-[10px] font-bold ${step === s.num ? 'text-indigo-300' : 'text-slate-500'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Alert Notifications */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-200 rounded-2xl text-xs font-bold flex items-start gap-2 animate-in fade-in duration-150">
            <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-2xl text-xs font-bold flex items-start gap-2 animate-in fade-in duration-150">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Instant OTP Notification Banner (Ensures 100% testability even without live SMS gateway) */}
        {simulatedOtp && step >= 2 && (
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 text-amber-200 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <span>
                এসএমএস ওটিপি: <strong className="text-white font-mono text-sm tracking-widest">{simulatedOtp}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOtp(simulatedOtp)}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-black cursor-pointer shadow-xs transition"
            >
              স্বয়ংক্রিয় বসান
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* STEP 1: PHONE NUMBER INPUT                                         */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4 text-xs font-bold">
            <div className="space-y-1.5">
              <label className="text-slate-300 flex items-center gap-1.5">
                <Phone size={14} className="text-indigo-400" />
                আপনার নিবন্ধিত মোবাইল নম্বর (ইউজার আইডি)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="যেমন: 01812345671"
                  className="w-full pl-3.5 pr-4 py-3 bg-slate-950/80 border border-white/20 rounded-2xl text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 transition shadow-inner"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                স্কুল ডাটাবেজে সংরক্ষিত ১১ ডিজিটের মোবাইল নম্বরটি লিখুন।
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>যাচাই ও OTP পাঠানো হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>OTP কোড পাঠান</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* STEP 2: ENTER OTP                                                  */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs font-bold">
            <div className="space-y-1.5 text-center">
              <p className="text-slate-300 font-medium">
                <strong className="text-white">{teacherName}</strong>, আপনার মোবাইল <span className="font-mono text-indigo-300 font-bold">{phone}</span> নম্বরে ৪ ডিজিটের একটি OTP পাঠানো হয়েছে।
              </p>

              <div className="pt-2">
                <input
                  type="text"
                  maxLength={4}
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • •"
                  className="w-48 mx-auto text-center py-3 bg-slate-950/80 border-2 border-indigo-500/60 rounded-2xl text-2xl font-mono font-black text-white tracking-[0.5em] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/30 transition shadow-inner"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                <Clock size={13} className="text-slate-500" />
                <span>মেয়াদ: {timer > 0 ? `${timer} সেকেন্ড` : 'শেষ'}</span>
              </div>

              <button
                type="button"
                disabled={!canResend || isLoading}
                onClick={handleResendOtp}
                className="text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                <span>পুনরায় OTP পাঠান</span>
              </button>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black rounded-2xl transition cursor-pointer"
              >
                নম্বর পরিবর্তন
              </button>

              <button
                type="submit"
                className="flex-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>OTP যাচাই করুন</span>
                <CheckCircle2 size={16} />
              </button>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* STEP 3: SET NEW PASSWORD                                           */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs font-bold">
            <div className="p-3 bg-indigo-950/60 border border-indigo-800/60 rounded-2xl flex items-center gap-2 text-indigo-200">
              <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
              <span>OTP সফলভাবে যাচাই হয়েছে। আপনার অ্যাকাউন্টের জন্য নতুন পাসওয়ার্ড দিন।</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 flex items-center gap-1.5">
                <Lock size={14} className="text-indigo-400" />
                নতুন পাসওয়ার্ড (কমপক্ষে ৪ অক্ষর) *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="নতুন পাসওয়ার্ড লিখুন"
                  className="w-full pl-3.5 pr-11 py-3 bg-slate-950/80 border border-white/20 rounded-2xl text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 transition shadow-inner"
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
              <label className="text-slate-300 flex items-center gap-1.5">
                <Lock size={14} className="text-indigo-400" />
                নতুন পাসওয়ার্ড নিশ্চিত করুন *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                className="w-full px-3.5 py-3 bg-slate-950/80 border border-white/20 rounded-2xl text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 transition shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 border border-emerald-400/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>পাসওয়ার্ড সংরক্ষণ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>পাসওয়ার্ড সংরক্ষণ ও লগইন করুন</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
