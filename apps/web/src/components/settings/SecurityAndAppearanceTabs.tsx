'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  GraduationCap,
  Image as ImageIcon,
  Info,
  Key,
  LayoutGrid,
  Lock,
  Moon,
  Palette,
  Save,
  Search,
  Shield,
  Smartphone,
  Sun,
  Trash2,
} from 'lucide-react';
import { SchoolSettings, settingsService } from '@/services/settingsService';
import { TeacherAccount, teacherAuthService } from '@/services/teacherAuthService';
import { themeService } from '@/services/themeService';
import { validateAndSanitizeImage } from '@/lib/securityUtils';
import { showToast } from '@/components/ui/ToastProvider';
import { SettingsCard } from './settingsShared';

interface SecuritySettingsTabProps {
  adminPhoneInput: string;
  setAdminPhoneInput: React.Dispatch<React.SetStateAction<string>>;
  adminRecoveryPhoneInput?: string;
  setAdminRecoveryPhoneInput?: React.Dispatch<React.SetStateAction<string>>;
  adminPassInput: string;
  setAdminPassInput: React.Dispatch<React.SetStateAction<string>>;
}

export function SecuritySettingsTab({
  adminPhoneInput,
  setAdminPhoneInput,
  adminRecoveryPhoneInput = '',
  setAdminRecoveryPhoneInput,
  adminPassInput,
  setAdminPassInput,
}: SecuritySettingsTabProps) {
  const [showPasswordAdmin, setShowPasswordAdmin] = useState(false);
  const [teachersList, setTeachersList] = useState<TeacherAccount[]>([]);
  const [teacherPasswords, setTeacherPasswords] = useState<Record<string, string>>({});
  const [showTeacherPasswords, setShowTeacherPasswords] = useState<Record<string, boolean>>({});
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [teacherSavedAlert, setTeacherSavedAlert] = useState<string | null>(null);

  const loadTeachers = useCallback(() => {
    if (typeof window !== 'undefined') {
      const all = teacherAuthService.getAllTeachers();
      setTeachersList(all);
      const passMap: Record<string, string> = {};
      all.forEach((t) => {
        passMap[t.id] = '';
      });
      setTeacherPasswords(passMap);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const handleSaveTeacherPassword = (tId: string, tName: string) => {
    const newPass = teacherPasswords[tId]?.trim();
    if (!newPass) return;
    teacherAuthService.setTeacherPassword(tId, newPass);
    setTeacherSavedAlert(`শিক্ষক "${tName}"-এর পাসওয়ার্ড সফলভাবে সংরক্ষণ করা হয়েছে!`);
    setTimeout(() => setTeacherSavedAlert(null), 3000);
  };

  return (
    <div className="space-y-5">
      <SettingsCard
        id="section-admin-password"
        title="অ্যাডমিন লগইন সিকিউরিটি"
        subtitle="প্রধান শিক্ষক / অ্যাডমিন লগইনের জন্য ইউজার আইডি ও পাসওয়ার্ড সেট করুন"
        icon={<Shield className="w-4.5 h-4.5" />}
        iconBg="bg-rose-50 dark:bg-rose-950/60"
        iconColor="text-rose-600 dark:text-rose-400"
      >
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-3 text-xs">
          <AlertTriangle className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-black text-amber-900 dark:text-amber-200">নিরাপত্তা সতর্কতা:</span>
            <span className="text-amber-800 dark:text-amber-200 ml-1">
              ডিফল্ট পাসওয়ার্ড পরিবর্তন করুন। শক্তিশালী পাসওয়ার্ড (৮+ অক্ষর, সংখ্যা ও চিহ্ন মিশ্রিত) ব্যবহার করুন।
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              অ্যাডমিন ইউজার আইডি / ফোন
            </label>
            <input
              type="text"
              value={adminPhoneInput}
              onChange={(e) => setAdminPhoneInput(e.target.value)}
              placeholder="যেমন: admin অথবা 018XXXXXXXX"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              অ্যাডমিন পাসওয়ার্ড
            </label>
            <div className="relative">
              <input
                type={showPasswordAdmin ? 'text' : 'password'}
                value={adminPassInput}
                onChange={(e) => setAdminPassInput(e.target.value)}
                placeholder="পরিবর্তন করতে নতুন পাসওয়ার্ড লিখুন"
                className="w-full px-4 py-2.5 pr-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPasswordAdmin(!showPasswordAdmin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPasswordAdmin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Dedicated Admin SMS OTP Recovery Phone */}
        {setAdminRecoveryPhoneInput && (
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/35 border border-indigo-200/80 dark:border-indigo-800/50 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                অ্যাডমিন OTP রিকভারি মোবাইল নম্বর (SMS গেটওয়ে)
              </label>
              <Link
                href="/dashboard/settings/?tab=sms"
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300 hover:underline inline-flex items-center gap-1"
              >
                <span>SMS গেটওয়ে সেটআপ</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <input
              type="tel"
              value={adminRecoveryPhoneInput}
              onChange={(e) => setAdminRecoveryPhoneInput(e.target.value)}
              placeholder="অ্যাডমিনের ১১ ডিজিটের মোবাইল নম্বর (যেমন: 018XXXXXXXX)"
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            />
            <p className="text-[11px] text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed">
              অ্যাডমিন পাসওয়ার্ড ভুলে গেলে লগইন পেইজ থেকে <strong>শুধুমাত্র এই নম্বরে</strong> SMS গেটওয়ের মাধ্যমে ৬ ডিজিটের OTP যাবে। শিক্ষকগণ তাঁদের নিজস্ব নিবন্ধিত মোবাইল নম্বরে OTP পাবেন।
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-400">
            <Shield className="w-3.5 h-3.5" /> পাসওয়ার্ড শক্তি:
            <span
              className={`font-black ${
                adminPassInput.length >= 12
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : adminPassInput.length >= 8
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {adminPassInput.length >= 12
                ? '🟢 খুবই শক্তিশালী'
                : adminPassInput.length >= 8
                  ? '🟡 মাঝারি'
                  : '🔴 দুর্বল'}
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                adminPassInput.length >= 12
                  ? 'bg-emerald-500 w-full'
                  : adminPassInput.length >= 8
                    ? 'bg-amber-500 w-2/3'
                    : adminPassInput.length >= 4
                      ? 'bg-rose-400 w-1/3'
                      : 'bg-rose-300 w-[10%]'
              }`}
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
          <div className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">বর্তমান লগইন তথ্য</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold">ইউজার আইডি</span>
              <span className="font-mono font-black text-slate-900 dark:text-white">{adminPhoneInput || 'admin'}</span>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold">পাসওয়ার্ড</span>
              <span className="font-mono font-black text-slate-900 dark:text-white">
                {adminPassInput ? (showPasswordAdmin ? adminPassInput : '••••••••') : 'সুরক্ষিত (অপরিবর্তিত)'}
              </span>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Teacher Passwords & User ID Management */}
      <SettingsCard
        id="section-teacher-passwords"
        title="শিক্ষকদের ইউজার আইডি ও পাসওয়ার্ড ব্যবস্থাপনা"
        subtitle="শিক্ষকের ইউজার আইডি হবে তার ফোন নম্বর এবং অ্যাডমিন এখান থেকে পাসওয়ার্ড সেট ও নিয়ন্ত্রণ করবেন"
        icon={<Key className="w-4.5 h-4.5" />}
        iconBg="bg-indigo-50 dark:bg-indigo-950/60"
        iconColor="text-indigo-600 dark:text-indigo-400"
      >
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl flex items-start gap-3 text-xs">
          <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-black text-indigo-950 dark:text-indigo-200 text-sm">শিক্ষক লগইন ও পাসওয়ার্ড নিয়মাবলী:</span>
            <p className="text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
              প্রতিটি শিক্ষকের <strong>ইউজার আইডি হলো তার ১১ ডিজিটের মোবাইল নম্বর</strong>। প্রধান শিক্ষক বা অ্যাডমিন হিসেবে আপনি এখান থেকে যেকোনো শিক্ষকের পাসওয়ার্ড সরাসরি দেখতে ও নতুন পাসওয়ার্ড সেট করতে পারেন। শিক্ষক পাসওয়ার্ড ভুলে গেলে লগইন পেজ থেকে <strong>OTP-এর মাধ্যমে নিজেই রিসেট</strong> করতে পারবেন।
            </p>
          </div>
        </div>

        {teacherSavedAlert && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{teacherSavedAlert}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              মোট শিক্ষক: <strong className="font-mono text-indigo-600 dark:text-indigo-400 text-sm">{teachersList.length}</strong> জন
            </span>
            <Link
              href="/dashboard/teacher"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 ml-2"
            >
              <span>শিক্ষক ব্যবস্থাপনা পেজে যান</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="নাম বা ফোন নম্বর খুঁজুন..."
              value={teacherSearchQuery}
              onChange={(e) => setTeacherSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs font-medium">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">শিক্ষকের নাম ও পদবি</th>
                <th className="p-3">লগইন ইউজার আইডি (ফোন)</th>
                <th className="p-3">অ্যাডমিন নির্ধারিত পাসওয়ার্ড</th>
                <th className="p-3 text-right">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-800 dark:text-slate-100">
              {teachersList
                .filter(
                  (t) =>
                    !teacherSearchQuery ||
                    t.name?.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
                    (t.phone && t.phone.includes(teacherSearchQuery)) ||
                    (t.mobile && t.mobile.includes(teacherSearchQuery))
                )
                .map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800 transition">
                    <td className="p-3">
                      <div className="font-black text-slate-900 dark:text-white text-sm">{t.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {t.designation} • {t.subject}
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-indigo-700 dark:text-indigo-300">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Smartphone size={14} className="text-indigo-500" />
                        <span>{t.phone || t.mobile || '—'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">লগইন ইউজার আইডি</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 max-w-xs">
                        <div className="relative flex-1">
                          <input
                            type={showTeacherPasswords[t.id] ? 'text' : 'password'}
                            value={teacherPasswords[t.id] ?? ''}
                            onChange={(e) => setTeacherPasswords({ ...teacherPasswords, [t.id]: e.target.value })}
                            placeholder="নতুন পাসওয়ার্ড লিখুন"
                            className="w-full px-3 py-1.5 pr-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowTeacherPasswords({
                                ...showTeacherPasswords,
                                [t.id]: !showTeacherPasswords[t.id],
                              })
                            }
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            {showTeacherPasswords[t.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSaveTeacherPassword(t.id, t.name)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs ml-auto active:scale-95"
                      >
                        <Save size={13} /> পাসওয়ার্ড সেট করুন
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </SettingsCard>
    </div>
  );
}

interface AppearanceSettingsTabProps {
  formData: SchoolSettings;
  handleChange: <K extends keyof SchoolSettings>(field: K, value: SchoolSettings[K]) => void;
  onImmediateSynced?: (partial: Partial<SchoolSettings>) => void;
}

export function AppearanceSettingsTab({
  formData,
  handleChange,
  onImmediateSynced,
}: AppearanceSettingsTabProps) {
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await validateAndSanitizeImage(file, {
        maxSizeMB: 2,
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.9,
        preserveTransparency: true,
      });
      if (result.valid && result.sanitizedDataUrl) {
        handleChange('schoolLogo', result.sanitizedDataUrl);
        settingsService.updateSettings({ schoolLogo: result.sanitizedDataUrl });
        onImmediateSynced?.({ schoolLogo: result.sanitizedDataUrl });
        showToast('প্রতিষ্ঠানের লোগো সফলভাবে আপলোড ও সংরক্ষিত হয়েছে।', 'success');
        try {
          const { firebaseSyncService } = await import('@/services/firebaseSyncService');
          await firebaseSyncService.syncSettingsToCloud({ schoolLogo: result.sanitizedDataUrl });
        } catch (err) {
          console.warn('[LogoUpload] Cloud auto-sync deferred:', err);
        }
      } else {
        showToast(result.error || 'লোগো ফাইলটি সঠিক নয়।', 'error');
      }
    }
  };

  return (
    <div className="space-y-5">
      <SettingsCard
        id="section-theme"
        title="ওয়েবসাইট থিম মোড (Light & Night Mode)"
        subtitle="সম্পূর্ণ ওয়েব অ্যাপ্লিকেশন লাইট বা নাইট মোডে পরিবর্তন করুন"
        icon={<Sun className="w-4.5 h-4.5" />}
        iconBg="bg-indigo-50 dark:bg-indigo-950/60"
        iconColor="text-indigo-600 dark:text-indigo-400"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => {
              themeService.setTheme('light');
              handleChange('theme', 'light');
              settingsService.updateSettings({ theme: 'light' });
              onImmediateSynced?.({ theme: 'light' });
            }}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
              formData.theme === 'light' || (!formData.theme && themeService.getTheme() === 'light')
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 shadow-sm ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-center text-amber-500">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">লাইট মোড</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">উজ্জ্বল ও পরিষ্কার অফিস কালার থিম</p>
              </div>
            </div>
            {(formData.theme === 'light' || (!formData.theme && themeService.getTheme() === 'light')) && (
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                ✓
              </span>
            )}
          </div>

          <div
            onClick={() => {
              themeService.setTheme('dark');
              handleChange('theme', 'dark');
              settingsService.updateSettings({ theme: 'dark' });
              onImmediateSynced?.({ theme: 'dark' });
            }}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
              formData.theme === 'dark' || themeService.getTheme() === 'dark'
                ? 'border-indigo-600 bg-slate-900 text-white shadow-sm ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 shadow-xs flex items-center justify-center text-indigo-400">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-sm font-black ${formData.theme === 'dark' || themeService.getTheme() === 'dark' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  নাইট মোড
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">চোখের আরামদায়ক আধুনিক ডার্ক মোড</p>
              </div>
            </div>
            {(formData.theme === 'dark' || themeService.getTheme() === 'dark') && (
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                ✓
              </span>
            )}
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        id="section-logo"
        title="প্রতিষ্ঠানের লোগো আপলোড"
        subtitle="মার্কশিট, সনদপত্র ও ওয়েবসাইটের ব্র্যান্ড লোগো সেট করুন"
        icon={<ImageIcon className="w-4.5 h-4.5" />}
        iconBg="bg-amber-50 dark:bg-amber-950/60"
        iconColor="text-amber-600 dark:text-amber-400"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-950 dark:text-white shrink-0 overflow-hidden shadow-inner">
            {formData.schoolLogo ? (
              <img src={formData.schoolLogo} alt="School Logo" className="w-full h-full object-contain p-1.5" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 p-2 text-center">
                <GraduationCap className="w-7 h-7 text-indigo-600 dark:text-indigo-400 mb-0.5" />
                <span className="text-[8.5px] font-extrabold tracking-tight">লোগো দিন</span>
              </div>
            )}
          </div>

          <div className="space-y-2 flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              PNG/JPG/SVG ফরম্যাট, সর্বোচ্চ 2MB সাইজ। আপলোড করলে এটি স্বয়ংক্রিয়ভাবে লোকাল স্টোরেজ, ইনডেক্সডডিবি এবং ল্যান্ডিং পেইজে সিঙ্ক ও স্থায়ী থাকবে।
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {formData.schoolLogo && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = formData.schoolLogo;
                      a.download = 'logo.png';
                      a.click();
                    }}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> লোগো ডাউনলোড করুন (logo.png)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('schoolLogo', '')}
                    className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> লোগো মুছে ফেলুন
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        id="section-watermark"
        title="জলছাপ / ওয়াটারমার্ক সেটিং"
        subtitle="মার্কশিটের পেছনে হালকা ওয়াটারমার্ক কাস্টমাইজ করুন"
        icon={<Palette className="w-4.5 h-4.5" />}
        iconBg="bg-amber-50 dark:bg-amber-950/60"
        iconColor="text-amber-600 dark:text-amber-400"
      >
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">ব্যাকগ্রাউন্ড জলছাপ</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">প্রিন্ট নম্বরপত্রে হালকা ওয়াটারমার্ক দেখাবে</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showWatermark}
              onChange={(e) => handleChange('showWatermark', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {formData.showWatermark && (
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300">জলছাপের দৃশ্যমানতা / ঘনত্ব:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono font-black text-sm">{Math.round(formData.watermarkOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.15"
              step="0.01"
              value={formData.watermarkOpacity}
              onChange={(e) => handleChange('watermarkOpacity', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span>১% (একদম হালকা)</span>
              <span className="text-indigo-500 font-bold">ডিফল্ট ৩%</span>
              <span>১৫% (গাঢ়)</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5 text-slate-400" /> প্রিন্ট লেআউট অপশন
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'শ্রেণি সিলেক্টর দেখাবে', field: 'showClassSelection' as const },
              { label: 'শাখা সিলেক্টর দেখাবে', field: 'showSectionSelection' as const },
              { label: 'রোল ইনপুট দেখাবে', field: 'showRollInput' as const },
            ].map((opt) => (
              <label key={opt.field} className="flex items-center gap-2.5 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(formData[opt.field])}
                  onChange={(e) => handleChange(opt.field, e.target.checked)}
                  className="w-4 h-4 text-indigo-600 dark:text-indigo-400 border-slate-300 dark:border-slate-700 rounded focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
