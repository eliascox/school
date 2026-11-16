'use client';

import React, { useState } from 'react';
import { KeyRound, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { clientLicenseService } from '@/services/clientLicenseService';

interface LicenseKeyActivationBoxProps {
  onActivated: () => void;
  onRegister: () => void;
}

/**
 * Interactive License Key & School Code activation form for unregistered clients.
 * Replaces one-click bypass with verified key validation against Central API / approved registry.
 */
export default function LicenseKeyActivationBox({
  onActivated,
  onRegister
}: LicenseKeyActivationBoxProps) {
  const [schoolCode, setSchoolCode] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      const res = await clientLicenseService.activateByLicenseKey(licenseKey, schoolCode);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onActivated();
        }, 400);
      } else {
        setErrorMsg(res.message);
        setIsSubmitting(false);
      }
    } catch {
      setErrorMsg('লাইসেন্স যাচাইকরণে ত্রুটি হয়েছে। আবার চেষ্টা করুন।');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 pt-2">
      <form onSubmit={handleActivate} className="space-y-2.5 text-left">
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            প্রতিষ্ঠান কোড (ঐচ্ছিক, যেমন: SCH-106184)
          </label>
          <input
            type="text"
            value={schoolCode}
            onChange={(e) => setSchoolCode(e.target.value)}
            placeholder="SCH-106184"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 uppercase font-mono"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            অনুমোদিত লাইসেন্স কী (License Key) *
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="SCH-XXXX-XXXX-XXXX"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 uppercase font-mono"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !licenseKey.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-[0.99]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>যাচাই করা হচ্ছে...</span>
            </>
          ) : (
            <>
              <span>লাইসেন্স কী দিয়ে সক্রিয় করুন</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <button
        type="button"
        onClick={onRegister}
        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all border border-slate-700 cursor-pointer"
      >
        <span>নতুন প্রতিষ্ঠান হিসেবে রেজিস্ট্রেশন করুন</span>
      </button>
    </div>
  );
}
