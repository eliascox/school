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
  Sparkles,
  HelpCircle,
  X
} from 'lucide-react';
import { teacherAuthService } from '@/services/teacherAuthService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import TeacherOtpResetModal from '@/components/TeacherOtpResetModal';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  
  // School Settings
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);

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

  useEffect(() => {
    setMounted(true);
    const settings = settingsService.getSettings();
    setSchoolSettings(settings);

    // Read initial role from query params if specified (e.g. /login?role=teacher)
    const roleParam = searchParams.get('role');
    if (roleParam === 'teacher') {
      setActiveRole('teacher');
    } else {
      setActiveRole('admin');
    }

    // Load saved remembered username if any
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('sms_remember_identifier');
      if (savedUser) {
        setIdentifier(savedUser);
      }
    }
  }, [searchParams]);

  // Handle Caps Lock Warning
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(e.getModifierState('CapsLock'));
  };

  // Quick Switch Roles
  const handleRoleChange = (role: 'admin' | 'teacher') => {
    setActiveRole(role);
    setErrorMessage('');
    setSuccessMessage('');
    setPassword('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    if (rememberMe) {
      localStorage.setItem('sms_remember_identifier', identifier.trim());
    } else {
      localStorage.removeItem('sms_remember_identifier');
    }

    setTimeout(async () => {
      try {
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
          setErrorMessage(res.message || 'ভুল ইউজারনেম অথবা পাসওয়ার্ড!');
          setIsLoading(false);
        }
      } catch (err: any) {
        setErrorMessage('লগইন প্রক্রিয়ায় ত্রুটি হয়েছে। পুনরায় চেষ্টা করুন।');
        setIsLoading(false);
      }
    }, 400);
  };

  const schoolName = schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const eiin = schoolSettings?.eiin || '104321';
  const phone = schoolSettings?.phone || '০১৭১১-XXXXXX';
  const email = schoolSettings?.email || 'info@school.edu.bd';

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50/80 relative flex flex-col justify-between items-center p-4 sm:p-6 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
      
      {/* Top Bar / Minimal Navigation */}
      <header className="w-full max-w-4xl flex items-center justify-between py-2 sm:py-4">
        <Link 
          href="/" 
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer group"
          title="মূল হোমপেজে ফিরে যান"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{schoolName}</h1>
            <span className="text-[11px] text-slate-500 font-medium">স্মার্ট স্কুল পোর্টাল • EIIN: {eiin}</span>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">হেল্পলাইন</span>
        </button>
      </header>

      {/* Main Login Card - Clean, Focused, Modern SaaS Style */}
      <main className="w-full max-w-[400px] my-auto">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-200/80 p-6 sm:p-8 transition-all">
          
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-3 shadow-xs">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">লগইন করুন</h2>
            <p className="text-xs text-slate-500 mt-1">
              {activeRole === 'admin' 
                ? 'প্রধান শিক্ষক ও সেন্ট্রাল অ্যাডমিন কন্ট্রোল' 
                : 'সহকারী শিক্ষকদের নম্বর এন্ট্রি ও পোর্টাল'}
            </p>
          </div>

          {/* Clean Segmented Tab Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 mb-5 border border-slate-200/60">
            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeRole === 'admin'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>👑</span>
              <span>অ্যাডমিন</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('teacher')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeRole === 'teacher'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>👨‍🏫</span>
              <span>সহকারী শিক্ষক</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span className="font-medium leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Identifier Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {activeRole === 'admin' ? 'ইউজারনেম বা আইডি' : 'মোবাইল নম্বর বা শিক্ষক আইডি'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {activeRole === 'admin' ? <User className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={activeRole === 'admin' ? 'যেমন: admin' : 'যেমন: 01812345671'}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">পাসওয়ার্ড</label>
                {activeRole === 'teacher' && (
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(true)}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Caps Lock Alert */}
              {isCapsLockOn && (
                <p className="mt-1 text-[11px] text-amber-600 font-medium flex items-center gap-1">
                  <span>⚠️</span> আপনার কিবোর্ডে <strong>Caps Lock</strong> অন রয়েছে!
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>লগইন মনে রাখুন</span>
              </label>

              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                নিরাপদ
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>যাচাই করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{activeRole === 'admin' ? 'অ্যাডমিন ড্যাশবোর্ডে প্রবেশ' : 'শিক্ষক পোর্টালে প্রবেশ'}</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </>
              )}
            </button>
          </form>

        </div>
      </main>

      {/* Clean Bottom Footer */}
      <footer className="w-full max-w-4xl py-3 text-center">
        <p className="text-xs text-slate-400 font-medium">
          © ২০২৬ {schoolName} • ডিজিটাল স্কুল ম্যানেজমেন্ট সিস্টেম
        </p>
      </footer>

      {/* Minimal Helpline Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">সহায়তা ও যোগাযোগ</h3>
                <p className="text-xs text-slate-500">কারিগরি ও লগইন তথ্য</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 mb-5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">হেল্পলাইন নম্বর</div>
                  <div className="font-semibold text-slate-800">{phone}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">ইমেইল ঠিকানা</div>
                  <div className="font-semibold text-slate-800">{email}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-50/60 text-indigo-800 text-[11px] leading-relaxed">
                💡 শিক্ষকরা পাসওয়ার্ড ভুলে গেলে <strong>"পাসওয়ার্ড ভুলে গেছেন?"</strong> অপশন থেকে সরাসরি ওটিপির মাধ্যমে পাসওয়ার্ড রিসেট করতে পারেন।
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer"
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
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-xs font-medium">লোড হচ্ছে...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
