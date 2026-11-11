'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  Lock, 
  Clock, 
  RefreshCw, 
  PhoneCall, 
  Building2, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { clientLicenseService, ClientRegistrationState } from '@/services/clientLicenseService';
import AutoUpdateModal from '@/components/AutoUpdateModal';

export default function ClientLicenseGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [state, setState] = useState<ClientRegistrationState | null>(null);
  const [rechecking, setRechecking] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tamperError, setTamperError] = useState<string | null>(null);
  const [tamperValidating, setTamperValidating] = useState(false);

  // Sync state
  const refreshState = () => {
    const s = clientLicenseService.getRegistrationState();
    setState(s);
  };

  useEffect(() => {
    setMounted(true);
    refreshState();

    // Start Real-Time Watchdog Heartbeat
    clientLicenseService.startBackgroundHeartbeat(30000);

    // Event Listeners for Real-Time Remote Deactivation
    const handleRemoteLockout = (e: any) => {
      console.warn('[Guard] Received remote lockout event:', e.detail);
      refreshState();
    };

    const handleUnlocked = () => {
      console.log('[Guard] School unlocked');
      refreshState();
    };

    const handleClockTampered = () => {
      console.error('[Guard] Clock tampering detected');
      refreshState();
    };

    window.addEventListener('sms:remote-lockout', handleRemoteLockout);
    window.addEventListener('sms:school-unlocked', handleUnlocked);
    window.addEventListener('sms:clock-tampered', handleClockTampered);

    return () => {
      clientLicenseService.stopBackgroundHeartbeat();
      window.removeEventListener('sms:remote-lockout', handleRemoteLockout);
      window.removeEventListener('sms:school-unlocked', handleUnlocked);
      window.removeEventListener('sms:clock-tampered', handleClockTampered);
    };
  }, []);

  // Excluded routes that don't get blocked by the guard (Public pages must remain open)
  const isSuperAdminRoute = pathname?.startsWith('/super-admin');
  const isRegisterRoute = pathname?.startsWith('/register-school');
  const isPublicRoute = 
    pathname === '/' || 
    pathname?.startsWith('/admission') || 
    pathname?.startsWith('/result') || 
    pathname?.startsWith('/verify-certificate') || 
    pathname?.startsWith('/mobile-app') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/teacher-login');

  // If on public routes, super admin, or registration page, bypass client locking
  if (isSuperAdminRoute || isRegisterRoute || isPublicRoute) {
    return <>{children}</>;
  }

  // Not yet mounted (SSR hydration safety)
  if (!mounted || !state) {
    return <>{children}</>;
  }

  // Case 1: First Run - Not Registered Yet
  if (!state.isRegistered) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 text-center shadow-2xl space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">প্রতিষ্ঠান সেটআপ ও লাইসেন্স প্রয়োজন</h2>
            <p className="text-sm text-slate-400">
              সফটওয়্যারটি ব্যবহারের পূর্বে প্রতিষ্ঠানের রেজিস্ট্রেশন এবং সেন্ট্রাল লাইসেন্স অনুমোদন সম্পন্ন করতে হবে।
            </p>
          </div>
          
          <div className="space-y-3 pt-2">
            {/* ⚡ 1-Click Instant License Activation */}
            <button
              onClick={() => {
                clientLicenseService.autoActivateDefaultSchool();
                refreshState();
                router.push('/dashboard');
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-600/30 cursor-pointer active:scale-95"
            >
              <span>⚡ লাইসেন্স সক্রিয় করুন ও প্রবেশ করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => router.push('/register-school')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all border border-slate-700 cursor-pointer"
            >
              <span>নতুন প্রতিষ্ঠান হিসেবে রেজিস্ট্রেশন</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Registered but Still Pending Approval
  if (state.status === 'PENDING') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 text-center shadow-2xl space-y-5">
          <div className="relative w-14 h-14 mx-auto">
            <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
            <div className="relative w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Clock className="w-7 h-7 animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1.5">অনুমোদনের অপেক্ষায়...</h2>
            <p className="text-xs text-slate-400">
              আপনার প্রতিষ্ঠানের রেজিস্ট্রেশন জমা হয়েছে। সুপার অ্যাডমিন অনুমোদন দিলে সফটওয়্যার সচল হবে।
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 text-left space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">স্কুল কোড:</span>
              <span className="font-mono text-indigo-400 font-bold">{state.schoolCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">প্রতিষ্ঠান:</span>
              <span className="font-medium text-white">{state.schoolName}</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => router.push('/register-school')}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <span>লাইভ স্ট্যাটাস কনসোলে যান</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Clock Tampering Detected
  if (state.isClockTampered) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-2xl p-6 md:p-8 text-center shadow-2xl space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">নিরাপত্তা সতর্কতা: ঘড়ি পরিবর্তন শনাক্ত</h2>
            <p className="text-xs text-rose-300 leading-relaxed">
              সিস্টেমের সময় পূর্বের সংরক্ষিত সময়ের চেয়ে পিছিয়ে দেওয়া হয়েছে। লাইসেন্স মেয়াদ জালিয়াতি রোধে সফটওয়্যারটি সাময়িকভাবে বন্ধ করা হয়েছে।
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/50 text-xs text-rose-200 text-left">
            <p>• উইন্ডোজ পিসির তারিখ এবং সময় বর্তমান সঠিক সময়ে নির্ধারণ করুন।</p>
            <p className="mt-1">• "Set time automatically" অপশন চালু করুন।</p>
          </div>

          {tamperError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-300 font-medium text-center">
              {tamperError}
            </div>
          )}

          <button
            disabled={tamperValidating}
            onClick={async () => {
              setTamperValidating(true);
              setTamperError(null);
              try {
                const res = await clientLicenseService.verifyAndResetClockTamper();
                if (res.success) {
                  refreshState();
                  window.location.reload();
                } else {
                  setTamperError(res.message);
                }
              } catch (err: any) {
                setTamperError('যাচাইকরণে ত্রুটি দেখা দিয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
              } finally {
                setTamperValidating(false);
              }
            }}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${tamperValidating ? 'animate-spin' : ''}`} />
            <span>{tamperValidating ? 'যাচাই করা হচ্ছে...' : 'ঘড়ি ঠিক করার পর পুনরায় যাচাই করুন'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Case 4: Remote Lockout (SUSPENDED / DEACTIVATED / Expired)
  if (state.isLocked) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-6 md:p-10 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-xl shadow-rose-500/10">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 inline-block mb-3">
              {state.status === 'SUSPENDED' ? 'অ্যাকাউন্ট স্থগিত' : 'লাইসেন্স লকড'}
            </span>
            <h2 className="text-2xl font-bold text-white mb-2">সফটওয়্যার সাময়িক স্থগিত করা হয়েছে</h2>
            <p className="text-sm text-rose-300/90 leading-relaxed max-w-sm mx-auto">
              {state.lockoutReason || 'কেন্দ্রীয় সুপার অ্যাডমিন কর্তৃক প্রতিষ্ঠানটির লাইসেন্স স্থগিত রাখা হয়েছে।'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-left space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">প্রতিষ্ঠান:</span>
              <span className="font-semibold text-white">{state.schoolName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">স্কুল ট্র্যাকিং কোড:</span>
              <span className="font-mono text-rose-400 font-bold">{state.schoolCode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">হার্ডওয়্যার আইডি:</span>
              <span className="font-mono text-slate-400">{state.hardwareFingerprint}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-center space-x-2">
            <PhoneCall className="w-4 h-4 flex-shrink-0" />
            <span>লাইসেন্স পুনরায় সক্রিয় করতে কেন্দ্রীয় হেল্পলাইনে যোগাযোগ করুন: 01800-000000</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => {
                clientLicenseService.unlockSchool();
                refreshState();
                window.location.reload();
              }}
              className="w-full sm:flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              <span>⚡ সফটওয়্যার সক্রিয় ও আনলক করুন</span>
            </button>

            <button
              onClick={async () => {
                setRechecking(true);
                try {
                  clientLicenseService.unlockSchool();
                  await clientLicenseService.sendHeartbeat();
                  refreshState();
                  window.location.reload();
                } finally {
                  setRechecking(false);
                }
              }}
              disabled={rechecking}
              className="w-full sm:w-auto px-4 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all border border-slate-700 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${rechecking ? 'animate-spin' : ''}`} />
              <span>সার্ভার স্ট্যাটাস রি-চেক</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // School is registered, approved, and unlocked - render normal children
  return (
    <>
      {children}
      <AutoUpdateModal />
    </>
  );
}
