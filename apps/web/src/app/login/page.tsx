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
  ArrowRight,
  HelpCircle,
  Smartphone,
  X,
  Home,
  UserPlus,
  Award,
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

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [topLogoFailed, setTopLogoFailed] = useState(false);
  const [centerLogoFailed, setCenterLogoFailed] = useState(false);

  const [activeRole, setActiveRole] = useState<'admin' | 'teacher'>('admin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

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
      <div className="min-h-screen bg-[#F6F8FF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F6F8FF] text-slate-900 relative overflow-hidden flex flex-col justify-between items-center p-4 sm:p-6">
      {/* Soft Pastel Pearl Ambient Blobs */}
      <div
        className="pointer-events-none fixed -top-32 -left-24 w-96 h-96 rounded-full bg-[#6366F1]/12 blur-[110px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-[#D946EF]/10 blur-[120px]"
        aria-hidden="true"
      />

      {/* Top Crisp White Brand Navigation */}
      <header className="relative z-10 w-full max-w-4xl flex items-center justify-between py-2 sm:py-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 hover:opacity-95 transition-opacity cursor-pointer group min-w-0"
          title="মূল হোমপেজে ফিরে যান"
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-indigo-200/80 shadow-xs flex items-center justify-center p-1 overflow-hidden shrink-0 group-hover:border-[#8B5CF6] transition-all">
            {schoolLogo && !topLogoFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={schoolLogo}
                alt={schoolName}
                className="w-full h-full object-contain"
                onError={() => setTopLogoFailed(true)}
              />
            ) : (
              <div className="w-full h-full rounded-lg bg-gradient-to-br from-[#4F6BFF] to-[#9333EA] text-white flex items-center justify-center">
                <School className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold text-slate-900 leading-tight truncate group-hover:text-[#6366F1] transition-colors">
              {schoolName}
            </h1>
            <span className="text-[11px] text-slate-500 font-medium block truncate">
              {isEn ? `Smart School Portal • EIIN: ${eiin}` : `স্মার্ট স্কুল পোর্টাল • EIIN: ${eiin}`}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-[#0B5D3B] bg-white hover:bg-emerald-50/70 border border-slate-200/90 shadow-2xs transition-all"
            title={isEn ? 'Back to Home' : 'মূল পাতায় ফিরুন'}
          >
            <Home className="w-3.5 h-3.5 text-[#0B5D3B]" />
            <span className="hidden sm:inline">{isEn ? 'Home' : 'হোম'}</span>
          </Link>

          <Link
            href="/admission"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-[#0B5D3B] bg-white hover:bg-emerald-50/70 border border-slate-200/90 shadow-2xs transition-all"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#0B5D3B]" />
            <span>{isEn ? 'Admission' : 'ভর্তি'}</span>
          </Link>

          <Link
            href="/result"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-700 bg-white hover:bg-indigo-50/70 border border-slate-200/90 shadow-2xs transition-all"
          >
            <Award className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isEn ? 'Result' : 'ফলাফল'}</span>
          </Link>

          <Link
            href="/mobile-app/"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200/80 shadow-2xs transition-all"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span className="hidden sm:inline">{isEn ? 'Mobile App' : 'মোবাইল অ্যাপ'}</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#6366F1]" />
            <span className="hidden sm:inline">{isEn ? 'Helpline' : 'হেল্পলাইন'}</span>
          </button>
        </div>
      </header>

      {/* Main Crisp White Pearl Aurora Login Card */}
      <main className="relative z-10 w-full max-w-[412px] my-auto py-4">
        <AuroraLoginCard variant="card">
          <div className="px-6 sm:px-8 pt-8 pb-20 sm:pb-24">
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

              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {activeRole === 'admin' && adminNeedsSetup
                  ? isEn
                    ? 'Admin Account Setup'
                    : 'অ্যাডমিন অ্যাকাউন্ট সেটআপ'
                  : isEn
                    ? 'Login to Continue'
                    : 'লগইন করুন'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
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

            {/* Clean Soft-Indigo Segmented Role Switcher */}
            <div className="bg-[#EEF2FF] p-1 rounded-xl flex items-center gap-1 mb-5 border border-indigo-200/70">
              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeRole === 'admin'
                    ? 'bg-gradient-to-r from-[#4B6BFF] to-[#9333EA] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
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
                    ? 'bg-gradient-to-r from-[#4B6BFF] to-[#9333EA] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>👨‍🏫</span>
                <span>{isEn ? 'Teacher' : 'সহকারী শিক্ষক'}</span>
              </button>
            </div>

            {/* Feedback Messages */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-semibold leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-semibold leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  {activeRole === 'admin'
                    ? isEn
                      ? 'Username or ID'
                      : 'ইউজারনেম বা আইডি'
                    : isEn
                      ? 'Mobile Number or Teacher ID'
                      : 'মোবাইল নম্বর বা শিক্ষক আইডি'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6366F1]">
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

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  {isEn ? 'Password' : 'পাসওয়ার্ড'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6366F1]">
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
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {isCapsLockOn && (
                  <p className="mt-1.5 text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                    <span>⚠️</span> আপনার কিবোর্ডে <strong>Caps Lock</strong> অন রয়েছে!
                  </p>
                )}
              </div>

              {activeRole === 'admin' && adminNeedsSetup && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    {isEn
                      ? 'Confirm Password (min 6 characters)'
                      : 'পাসওয়ার্ড নিশ্চিত করুন (কমপক্ষে ৬ অক্ষর)'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6366F1]">
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

              {/* Utility Row: Remember Me + Forgot Password (SMS OTP for both Admin & Teacher) */}
              <div className="flex items-center justify-between pt-1 pb-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-indigo-300 bg-white accent-[#7C3AED] cursor-pointer"
                  />
                  <span>{isEn ? 'Remember me' : 'লগইন মনে রাখুন'}</span>
                </label>

                {!(activeRole === 'admin' && adminNeedsSetup) && (
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(true)}
                    className="text-xs font-bold text-[#7C3AED] hover:text-[#A21CAF] transition cursor-pointer"
                  >
                    {isEn ? 'Forgot password?' : 'পাসওয়ার্ড ভুলে গেছেন?'}
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
        <p className="text-xs text-slate-500 font-medium">
          {isEn
            ? `© 2026 ${schoolName} • Digital School Management System`
            : `© ২০২৬ ${schoolName} • ডিজিটাল স্কুল ম্যানেজমেন্ট সিস্টেম`}
        </p>
      </footer>

      {/* Crisp White Pearl Helpline Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-indigo-200/80 relative text-slate-900">
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              aria-label="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-[#6366F1] flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">সহায়তা ও যোগাযোগ</h3>
                <p className="text-xs text-slate-500">কারিগরি ও লগইন তথ্য</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 mb-5">
              <div className="p-3 rounded-xl bg-[#F5F7FF] border border-indigo-100 flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#6366F1] shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold">হেল্পলাইন নম্বর</div>
                  <div className="font-bold text-slate-900">{phone}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F5F7FF] border border-indigo-100 flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#6366F1] shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold">ইমেইল ঠিকানা</div>
                  <div className="font-bold text-slate-900">{email}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-violet-50 text-violet-900 text-[11px] leading-relaxed border border-violet-200/70">
                💡 অ্যাডমিন ও শিক্ষক উভয়েই পাসওয়ার্ড ভুলে গেলে <strong>&quot;পাসওয়ার্ড ভুলে গেছেন?&quot;</strong> অপশন থেকে নিজ নিজ নিবন্ধিত মোবাইল নম্বরে SMS OTP দিয়ে পাসওয়ার্ড রিসেট করতে পারবেন।
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

      {/* Unified White-Pearl SMS OTP Password Reset Modal */}
      <TeacherOtpResetModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        initialPhone={identifier}
        roleMode={activeRole}
        onSuccess={(loginId, newPass, role) => {
          setIdentifier(loginId);
          setPassword(newPass);
          if (role) setActiveRole(role);
          setSuccessMessage(
            role === 'admin'
              ? 'অ্যাডমিন পাসওয়ার্ড সফলভাবে রিসেট হয়েছে! এখন প্রবেশ করুন।'
              : 'পাসওয়ার্ড সফলভাবে রিসেট হয়েছে! এখন প্রবেশ করুন।',
          );
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F8FF] flex flex-col items-center justify-center text-slate-500 gap-3">
          <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
          <span className="text-xs font-medium">লোড হচ্ছে...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
