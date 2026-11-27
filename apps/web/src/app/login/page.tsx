'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LogIn,
  Eye,
  EyeOff,
  Lock,
  User,
  School,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Smartphone,
  X,
} from 'lucide-react';
import { teacherAuthService } from '@/services/teacherAuthService';
import {
  settingsService,
  SchoolSettings,
  getEnglishSchoolName,
} from '@/services/settingsService';
import TeacherOtpResetModal from '@/components/TeacherOtpResetModal';
import {
  AURORA_INPUT_CLASS,
  AURORA_INPUT_PR10_CLASS,
  AURORA_PRIMARY_BTN_CLASS,
  AuroraEmblemTile,
  AuroraLoginCard,
} from '@/components/auth/AuroraLoginShell';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // School Settings
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [topLogoFailed, setTopLogoFailed] = useState(false);
  const [centerLogoFailed, setCenterLogoFailed] = useState(false);

  // Active Role Tab ('admin' | 'teacher')
  const [activeRole, setActiveRole] = useState<'admin' | 'teacher'>('admin');

  // Form Fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  // Modals
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [adminNeedsSetup, setAdminNeedsSetup] = useState(false);
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');

  useEffect(() => {
    setMounted(true);
    const settings = settingsService.getSettings();
    setSchoolSettings(settings);
    const adminInitialized = teacherAuthService.isAdminInitialized();
    setAdminNeedsSetup(!adminInitialized);

    // Subscribe to settings changes for dynamic live sync
    const unsubscribe = settingsService.subscribe((updated) => {
      setSchoolSettings(updated);
    });

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sms_school_settings') {
        setSchoolSettings(settingsService.getSettings());
      }
      if (e.key === 'sms_admin_password') {
        setAdminNeedsSetup(!teacherAuthService.isAdminInitialized());
      }
    };
    window.addEventListener('storage', handleStorage);

    const roleParam = searchParams.get('role');
    if (roleParam === 'teacher') {
      setActiveRole('teacher');
    } else {
      setActiveRole('admin');
    }

    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('sms_remember_identifier');
      if (savedUser) {
        setIdentifier(savedUser);
      } else if (!adminInitialized) {
        setIdentifier('admin');
      }
    }

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, [searchParams]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(e.getModifierState('CapsLock'));
  };

  const handleRoleChange = (role: 'admin' | 'teacher') => {
    setActiveRole(role);
    setErrorMessage('');
    setSuccessMessage('');
    setPassword('');
    setSetupConfirmPassword('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    const adminId = (identifier || 'admin').trim();

    if (rememberMe) {
      localStorage.setItem('sms_remember_identifier', adminId);
    } else {
      localStorage.removeItem('sms_remember_identifier');
    }

    setTimeout(async () => {
      try {
        if (activeRole === 'admin' && adminNeedsSetup) {
          if (password !== setupConfirmPassword) {
            setErrorMessage('দুটি পাসওয়ার্ড মেলেনি! অনুগ্রহ করে একই পাসওয়ার্ড লিখুন।');
            setIsLoading(false);
            return;
          }
          const setupRes = await teacherAuthService.initializeAdminPassword(password, adminId);
          if (!setupRes.success) {
            setErrorMessage(setupRes.message);
            setIsLoading(false);
            return;
          }
          setAdminNeedsSetup(false);
          const loginRes = await teacherAuthService.unifiedLogin(adminId, password);
          if (loginRes.success) {
            setSuccessMessage('অ্যাডমিন পাসওয়ার্ড সেটআপ ও লগইন সফল হয়েছে!');
            setTimeout(() => router.push('/dashboard'), 600);
          } else {
            setSuccessMessage(setupRes.message);
            setIsLoading(false);
          }
          return;
        }

        const res = await teacherAuthService.unifiedLogin(identifier, password);
        if (res.success) {
          setSuccessMessage(res.message);
          setTimeout(() => {
            if (res.role === 'teacher') {
              router.push('/dashboard/teacher-portal');
            } else {
              router.push('/dashboard');
            }
          }, 600);
        } else {
          if (res.requiresSetup) {
            setAdminNeedsSetup(true);
            setActiveRole('admin');
          }
          setErrorMessage(res.message || 'ভুল ইউজারনেম অথবা পাসওয়ার্ড!');
          setIsLoading(false);
        }
      } catch {
        setErrorMessage('লগইন প্রক্রিয়ায় ত্রুটি হয়েছে। পুনরায় চেষ্টা করুন।');
        setIsLoading(false);
      }
    }, 400);
  };

  const isEn = schoolSettings?.language === 'en';
  const schoolName = isEn
    ? getEnglishSchoolName(schoolSettings, 'Smart School Portal')
    : schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const eiin = schoolSettings?.eiin || '106184';
  const phone = schoolSettings?.phone || '০১৭১১-XXXXXX';
  const email = schoolSettings?.email || 'info@school.edu.bd';
  const schoolLogo = schoolSettings?.schoolLogo || '';

  useEffect(() => {
    setTopLogoFailed(false);
    setCenterLogoFailed(false);
  }, [schoolLogo]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#050714] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#050714] text-white relative overflow-hidden flex flex-col justify-between items-center p-4 sm:p-6">
      {/* Ambient Cosmic Backlight Orbs */}
      <div
        className="pointer-events-none fixed -top-32 -left-24 w-96 h-96 rounded-full bg-[#4F46E5]/20 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-[#C026D3]/18 blur-[130px]"
        aria-hidden="true"
      />

      {/* Top Brand Navigation */}
      <header className="relative z-10 w-full max-w-4xl flex items-center justify-between py-2 sm:py-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 hover:opacity-95 transition-opacity cursor-pointer group min-w-0"
          title="মূল হোমপেজে ফিরে যান"
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-indigo-400/25 shadow-sm flex items-center justify-center p-1 overflow-hidden shrink-0 group-hover:border-[#A855F7]/60 transition-all">
            {schoolLogo && !topLogoFailed ? (
              <div className="w-full h-full rounded-lg bg-white p-0.5 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={schoolLogo}
                  alt={schoolName}
                  className="w-full h-full object-contain"
                  onError={() => setTopLogoFailed(true)}
                />
              </div>
            ) : (
              <div className="w-full h-full rounded-lg bg-gradient-to-br from-[#4F6BFF] to-[#9333EA] text-white flex items-center justify-center">
                <School className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold text-white leading-tight truncate group-hover:text-[#C4B5FD] transition-colors">
              {schoolName}
            </h1>
            <span className="text-[11px] text-slate-400 font-medium block truncate">
              {isEn ? `Smart School Portal • EIIN: ${eiin}` : `স্মার্ট স্কুল পোর্টাল • EIIN: ${eiin}`}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/mobile-app/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-200 bg-white/[0.06] hover:bg-white/[0.12] border border-indigo-400/20 transition-all"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="hidden sm:inline">{isEn ? 'Mobile App' : 'মোবাইল অ্যাপ'}</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-indigo-400/15 transition-all cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span className="hidden sm:inline">{isEn ? 'Helpline' : 'হেল্পলাইন'}</span>
          </button>
        </div>
      </header>

      {/* Main Cosmic Aurora Glass Login Card */}
      <main className="relative z-10 w-full max-w-[412px] my-auto py-4">
        <AuroraLoginCard variant="card">
          <div className="px-6 sm:px-8 pt-8 pb-20 sm:pb-24">
            {/* Floating Luminous Glass Emblem + Title */}
            <div className="text-center mb-6">
              <div className="mb-4 flex justify-center">
                <AuroraEmblemTile
                  schoolLogo={schoolLogo}
                  schoolName={schoolName}
                  logoFailed={centerLogoFailed}
                  onLogoError={() => setCenterLogoFailed(true)}
                  badgeContent={activeRole === 'admin' ? '👑' : '👨‍🏫'}
                  badgeTitle={activeRole === 'admin' ? 'অ্যাডমিন পোর্টাল' : 'শিক্ষক পোর্টাল'}
                />
              </div>

              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                {activeRole === 'admin' && adminNeedsSetup
                  ? isEn
                    ? 'Admin Account Setup'
                    : 'অ্যাডমিন অ্যাকাউন্ট সেটআপ'
                  : isEn
                    ? 'Login to Continue'
                    : 'লগইন করুন'}
              </h2>
              <p className="text-xs text-slate-300/80 mt-1 font-medium">
                {activeRole === 'admin'
                  ? adminNeedsSetup
                    ? isEn
                      ? 'Set your secure administrator password for first-time access'
                      : 'প্রথমবার নিরাপত্তার জন্য আপনার নিজস্ব অ্যাডমিন পাসওয়ার্ড সেট করুন'
                    : isEn
                      ? 'Principal & Central Administration Portal'
                      : 'প্রধান শিক্ষক ও সেন্ট্রাল অ্যাডমিন কন্ট্রোল'
                  : isEn
                    ? 'Assistant Teacher Marks & Class Portal'
                    : 'সহকারী শিক্ষকদের নম্বর এন্ট্রি ও পোর্টাল'}
              </p>
            </div>

            {/* Translucent Segmented Role Switcher */}
            <div className="bg-[#080D22]/85 p-1 rounded-xl flex items-center gap-1 mb-5 border border-indigo-400/20">
              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeRole === 'admin'
                    ? 'bg-gradient-to-r from-[#4B6BFF]/90 to-[#9333EA]/90 text-white shadow-sm'
                    : 'text-slate-300/80 hover:text-white'
                }`}
              >
                <span>👑</span>
                <span>{isEn ? 'Admin' : 'অ্যাডমিন'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('teacher')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeRole === 'teacher'
                    ? 'bg-gradient-to-r from-[#4B6BFF]/90 to-[#9333EA]/90 text-white shadow-sm'
                    : 'text-slate-300/80 hover:text-white'
                }`}
              >
                <span>👨‍🏫</span>
                <span>{isEn ? 'Teacher' : 'সহকারী শিক্ষক'}</span>
              </button>
            </div>

            {/* Feedback Messages */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-400/35 text-rose-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-emerald-200 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="font-medium leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Identifier Input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300/90 mb-1.5">
                  {activeRole === 'admin'
                    ? isEn
                      ? 'Username or ID'
                      : 'ইউজারনেম বা আইডি'
                    : isEn
                      ? 'Mobile Number or Teacher ID'
                      : 'মোবাইল নম্বর বা শিক্ষক আইডি'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A78BFA]">
                    {activeRole === 'admin' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Phone className="w-4 h-4" />
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      activeRole === 'admin'
                        ? isEn
                          ? 'e.g. admin'
                          : 'যেমন: admin'
                        : isEn
                          ? 'e.g. 01812345671'
                          : 'যেমন: 01812345671'
                    }
                    className={AURORA_INPUT_CLASS}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300/90 mb-1.5">
                  {isEn ? 'Password' : 'পাসওয়ার্ড'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A78BFA]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyDown}
                    placeholder="••••••••"
                    className={AURORA_INPUT_PR10_CLASS}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {isCapsLockOn && (
                  <p className="mt-1.5 text-[11px] text-amber-300 font-medium flex items-center gap-1">
                    <span>⚠️</span> আপনার কিবোর্ডে <strong>Caps Lock</strong> অন রয়েছে!
                  </p>
                )}
              </div>

              {/* Confirm Password Input for First-Time Admin Setup */}
              {activeRole === 'admin' && adminNeedsSetup && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300/90 mb-1.5">
                    {isEn
                      ? 'Confirm Password (min 6 characters)'
                      : 'পাসওয়ার্ড নিশ্চিত করুন (কমপক্ষে ৬ অক্ষর)'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A78BFA]">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={setupConfirmPassword}
                      onChange={(e) => setSetupConfirmPassword(e.target.value)}
                      placeholder={isEn ? 'Re-enter new password' : 'পুনরায় নতুন পাসওয়ার্ড লিখুন'}
                      className={AURORA_INPUT_CLASS}
                    />
                  </div>
                </div>
              )}

              {/* Utility Row: Remember Me + Forgot Password / Helpline */}
              <div className="flex items-center justify-between pt-1 pb-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-indigo-400/40 bg-[#0B122B] accent-[#8B5CF6] cursor-pointer"
                  />
                  <span>{isEn ? 'Remember me' : 'লগইন মনে রাখুন'}</span>
                </label>

                {activeRole === 'teacher' ? (
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(true)}
                    className="text-xs font-semibold text-[#D875FF] hover:text-[#F0ABFC] transition cursor-pointer"
                  >
                    {isEn ? 'Forgot password?' : 'পাসওয়ার্ড ভুলে গেছেন?'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-xs font-semibold text-[#D875FF] hover:text-[#F0ABFC] transition inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Need help?' : 'সাহায্য প্রয়োজন?'}</span>
                  </button>
                )}
              </div>

              {/* Signature Luminous Gradient Login CTA */}
              <button type="submit" disabled={isLoading} className={AURORA_PRIMARY_BTN_CLASS}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isEn ? 'Verifying...' : 'যাচাই করা হচ্ছে...'}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>
                      {activeRole === 'admin'
                        ? adminNeedsSetup
                          ? isEn
                            ? 'Setup & Sign In'
                            : 'পাসওয়ার্ড সেটআপ ও প্রবেশ করুন'
                          : isEn
                            ? 'Login to Admin Dashboard'
                            : 'অ্যাডমিন ড্যাশবোর্ডে প্রবেশ'
                        : isEn
                          ? 'Login to Teacher Portal'
                          : 'শিক্ষক পোর্টালে প্রবেশ'}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </AuroraLoginCard>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 w-full max-w-4xl py-3 text-center">
        <p className="text-xs text-slate-400/80 font-medium">
          {isEn
            ? `© 2026 ${schoolName} • Digital School Management System`
            : `© ২০২৬ ${schoolName} • ডিজিটাল স্কুল ম্যানেজমেন্ট সিস্টেম`}
        </p>
      </footer>

      {/* Matching Dark-Glass Helpline Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-[#02040D]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D112E] rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-[#7C6FFF]/35 relative text-white">
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              aria-label="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-[#C084FC] flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">সহায়তা ও যোগাযোগ</h3>
                <p className="text-xs text-slate-400">কারিগরি ও লগইন তথ্য</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 mb-5">
              <div className="p-3 rounded-xl bg-[#070B1E] border border-indigo-400/20 flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#A78BFA] shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">হেল্পলাইন নম্বর</div>
                  <div className="font-semibold text-white">{phone}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#070B1E] border border-indigo-400/20 flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#A78BFA] shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">ইমেইল ঠিকানা</div>
                  <div className="font-semibold text-white">{email}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-violet-500/15 text-violet-200 text-[11px] leading-relaxed border border-violet-400/25">
                💡 শিক্ষকরা পাসওয়ার্ড ভুলে গেলে <strong>&quot;পাসওয়ার্ড ভুলে গেছেন?&quot;</strong> অপশন থেকে সরাসরি ওটিপির মাধ্যমে পাসওয়ার্ড রিসেট করতে পারেন।
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className={AURORA_PRIMARY_BTN_CLASS}
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* Teacher OTP Reset Modal */}
      <TeacherOtpResetModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        initialPhone={identifier}
        onSuccess={(p, newPass) => {
          setIdentifier(p);
          setPassword(newPass);
          setActiveRole('teacher');
          setSuccessMessage('পাসওয়ার্ড সফলভাবে রিসেট হয়েছে! এখন প্রবেশ করুন।');
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050714] flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin" />
          <span className="text-xs font-medium">লোড হচ্ছে...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
