'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, RefreshCw, Save, Settings, Sparkles, X } from 'lucide-react';
import StudentBulkImportPanel from '@/components/StudentBulkImportPanel';
import { AcademicSettingsTab, SmsGatewaySettingsTab } from '@/components/settings/AcademicAndSmsTabs';
import { CommitteeSettingsTab } from '@/components/settings/CommitteeSettingsTab';
import { DataSettingsTab, SettingsSidebarPreview, SystemSettingsTab } from '@/components/settings/DataAndSystemTabs';
import { FacilitiesSettingsTab } from '@/components/settings/FacilitiesSettingsTab';
import { IdentitySettingsTab } from '@/components/settings/IdentitySettingsTab';
import { PadSettingsTab } from '@/components/settings/PadSettingsTab';
import { AppearanceSettingsTab, SecuritySettingsTab } from '@/components/settings/SecurityAndAppearanceTabs';
import { SETTINGS_TABS, SettingsTab } from '@/components/settings/settingsShared';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';
import { landingPageService } from '@/services/landingPageService';
import { AppLanguage, languageService } from '@/services/languageService';
import { SchoolSettings, settingsService } from '@/services/settingsService';
import { studentService } from '@/services/studentService';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';

export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('identity');
  const [formData, setFormData] = useState<SchoolSettings>(() => settingsService.getSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Admin Credentials
  const [adminPhoneInput, setAdminPhoneInput] = useState('admin');
  const [adminPassInput, setAdminPassInput] = useState('');

  // Academic & Language Config
  const [currentSession, setCurrentSession] = useState('২০২৬');
  const [examNames, setExamNames] = useState(['অর্ধ-বার্ষিক পরীক্ষা', 'বার্ষিক পরীক্ষা']);
  const [currentLang, setCurrentLang] = useState<AppLanguage>('bn');

  // Sync activeTab with URL query parameter (e.g. ?tab=bulk-student)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as SettingsTab | null;
      if (tab === 'bulk-student') {
        router.replace('/dashboard/students/bulk-import');
        return;
      }
      if (tab && SETTINGS_TABS.some((t) => t.id === tab)) {
        setActiveTab(tab);
      }
    }
  }, [router]);

  useEffect(() => {
    const currSession = teacherAuthService.getSession();
    setSession(currSession);
    if (currSession && currSession.role !== 'admin') {
      router.replace('/dashboard/teacher-portal');
    }
  }, [router]);

  useEffect(() => {
    setCurrentLang(languageService.getLanguage());
    const unsubLang = languageService.subscribe((l) => setCurrentLang(l));
    return () => unsubLang();
  }, []);

  useEffect(() => {
    setMounted(true);
    const unsub = settingsService.subscribe((s) => setFormData(s));

    if (typeof window !== 'undefined') {
      const storedPhone = localStorage.getItem('sms_admin_phone');
      if (storedPhone) setAdminPhoneInput(storedPhone);

      const storedPass = localStorage.getItem('sms_admin_password');
      if (storedPass) {
        // Never pre-fill existing admin password or hash into input fields
        setAdminPassInput('');
      }

      const storedAcademic = localStorage.getItem('sms_academic_session');
      if (storedAcademic) {
        setCurrentSession(storedAcademic);
      } else {
        const legacy = localStorage.getItem('sms_current_session');
        if (legacy && !legacy.startsWith('{')) {
          setCurrentSession(legacy);
        }
      }

      const storedExams = localStorage.getItem('sms_exam_names');
      if (storedExams) {
        try {
          const parsed = JSON.parse(storedExams);
          if (Array.isArray(parsed)) setExamNames(parsed);
        } catch {
          // Ignore malformed legacy storage
        }
      }
    }

    return () => unsub();
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Settings className="w-7 h-7 text-white animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse">সেটিংস লোড হচ্ছে...</p>
      </div>
    );
  }

  // RBAC Access Guard
  if (session && session.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">অনুমতি নেই</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">শুধুমাত্র প্রধান প্রশাসক এই পাতায় প্রবেশ করতে পারবেন।</p>
        <Link href="/dashboard/teacher-portal" className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs">
          শিক্ষক ড্যাশবোর্ডে ফিরুন
        </Link>
      </div>
    );
  }

  const handleChange = <K extends keyof SchoolSettings>(field: K, value: SchoolSettings[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGlobalLanguageChange = (l: AppLanguage) => {
    setCurrentLang(l);
    languageService.setLanguage(l);
    settingsService.updateSettings({ language: l });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    settingsService.updateSettings(formData);

    try {
      landingPageService.syncWithSchoolSettings(formData, true);
      if (formData.schoolLogo) {
        landingPageService.updateLogo(formData.schoolLogo, 'অ্যাডমিন', true);
      }
    } catch (err) {
      console.warn('Failed to sync settings with landing page service', err);
    }

    try {
      const { firebaseSyncService } = await import('@/services/firebaseSyncService');
      await firebaseSyncService.syncSettingsToCloud(formData);
    } catch (err) {
      console.warn('[SettingsSubmit] Cloud settings sync error:', err);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('sms_admin_phone', adminPhoneInput.trim());
      if (adminPassInput.trim() && !adminPassInput.trim().startsWith('pbkdf2:')) {
        await teacherAuthService.setAdminPassword(adminPassInput.trim(), adminPhoneInput.trim());
      }
      localStorage.setItem('sms_academic_session', currentSession);
      localStorage.setItem('sms_exam_names', JSON.stringify(examNames));
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleResetDefaults = async () => {
    if (
      await confirmDialog({
        title: 'ডিফল্ট সেটিংস রিসেট',
        message: 'আপনি কি নিশ্চিত যে সকল সেটিংস ডিফল্ট মানে রিসেট করতে চান?',
        confirmLabel: 'রিসেট করুন',
        danger: true,
      })
    ) {
      const defaults: SchoolSettings = {
        schoolName: '',
        schoolLogo: '',
        address: '',
        eiin: '',
        estdYear: '1969',
        principalName: '',
        principalTitle: 'প্রধান শিক্ষক',
        classTeacherTitle: 'শ্রেণি শিক্ষকের স্বাক্ষর',
        guardianTitle: 'অভিভাবকের স্বাক্ষর',
        showWatermark: true,
        watermarkText: '',
        watermarkOpacity: 0.03,
        phone: '',
        email: '',
        website: '',
        showClassSelection: true,
        showSectionSelection: true,
        showRollInput: true,
      };
      settingsService.updateSettings(defaults);
      setFormData(defaults);
      setAdminPhoneInput('admin');
      setAdminPassInput('');
      setSavedSuccess(true);
      showToast('সকল সেটিংস ডিফল্ট মানে রিসেট করা হয়েছে।', 'success');
      setTimeout(() => setSavedSuccess(false), 4000);
    }
  };

  const totalStudents = typeof window !== 'undefined' ? studentService.getAllStudents().length : 0;

  return (
    <div className="w-full space-y-6 font-sans">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden print:hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-4 right-4 opacity-[0.04]">
            <Settings className="w-48 h-48" />
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-bold border border-indigo-500/30 uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> সিস্টেম সেটিংস ও কনফিগারেশন
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">প্রতিষ্ঠানের পরিচিতি ও সেটিংস</h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl leading-relaxed">
              এখান থেকে প্রতিষ্ঠানের সকল তথ্য, নিরাপত্তা, ডিজাইন, একাডেমিক কনফিগারেশন ও ডাটা ম্যানেজমেন্ট নিয়ন্ত্রণ করুন।
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/5 hover:bg-white/10 dark:hover:bg-slate-800 text-slate-300 text-[11px] font-bold rounded-xl border border-white/10 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> রিসেট
            </button>
            <button
              onClick={() => handleSubmit()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:shadow-indigo-500/40"
            >
              <Save className="w-3.5 h-3.5" /> পরিবর্তন সংরক্ষণ
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 p-4 rounded-xl shadow-sm text-xs font-bold animate-fade-in print:hidden">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <span className="font-black">সফলভাবে সংরক্ষিত!</span>
            <span className="font-medium text-emerald-700 dark:text-emerald-300 ml-1">
              মার্কশিট ও প্রিন্ট পেজে নতুন তথ্যসমূহ হালনাগাদ করা হয়েছে।
            </span>
          </div>
          <button onClick={() => setSavedSuccess(false)} className="ml-auto p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors">
            <X className="w-3.5 h-3.5 text-emerald-500" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-1.5 overflow-x-auto print:hidden">
        <div className="flex gap-1 min-w-max">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? `${tab.bgColor} ${tab.color} ${tab.borderColor} border shadow-sm`
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.labelBn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Section */}
      {activeTab === 'pad' ? (
        <PadSettingsTab formData={formData} handleChange={handleChange} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
          <div className="xl:col-span-8 2xl:col-span-9 space-y-6">
            {activeTab === 'identity' && <IdentitySettingsTab formData={formData} handleChange={handleChange} />}
            {activeTab === 'committee' && <CommitteeSettingsTab formData={formData} setFormData={setFormData} />}
            {activeTab === 'facilities' && <FacilitiesSettingsTab />}
            {activeTab === 'bulk-student' && <StudentBulkImportPanel />}
            {activeTab === 'security' && (
              <SecuritySettingsTab
                adminPhoneInput={adminPhoneInput}
                setAdminPhoneInput={setAdminPhoneInput}
                adminPassInput={adminPassInput}
                setAdminPassInput={setAdminPassInput}
              />
            )}
            {activeTab === 'appearance' && <AppearanceSettingsTab formData={formData} handleChange={handleChange} />}
            {activeTab === 'academic' && (
              <AcademicSettingsTab
                formData={formData}
                setFormData={setFormData}
                currentSession={currentSession}
                setCurrentSession={setCurrentSession}
                examNames={examNames}
                setExamNames={setExamNames}
                currentLang={currentLang}
              />
            )}
            {activeTab === 'sms' && <SmsGatewaySettingsTab />}
            {activeTab === 'data' && (
              <DataSettingsTab
                sessionRole={session?.role}
                sessionTeacherName={session?.teacherName}
                setFormData={setFormData}
              />
            )}
            {activeTab === 'system' && (
              <SystemSettingsTab
                formData={formData}
                currentLang={currentLang}
                onLanguageChange={handleGlobalLanguageChange}
                totalStudents={totalStudents}
              />
            )}
          </div>

          <SettingsSidebarPreview
            formData={formData}
            examNames={examNames}
            currentSession={currentSession}
            totalStudents={totalStudents}
            onSave={() => handleSubmit()}
          />
        </div>
      )}
    </div>
  );
}
