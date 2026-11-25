'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Settings, X } from 'lucide-react';
import { AcademicSettingsTab, SmsGatewaySettingsTab } from '@/components/settings/AcademicAndSmsTabs';
import { CommitteeSettingsTab } from '@/components/settings/CommitteeSettingsTab';
import {
  DataSettingsTab,
  SettingsSidebarPreview,
  SystemSettingsTab,
} from '@/components/settings/DataAndSystemTabs';
import { FacilitiesSettingsTab } from '@/components/settings/FacilitiesSettingsTab';
import { IdentitySettingsTab } from '@/components/settings/IdentitySettingsTab';
import { PadSettingsTab } from '@/components/settings/PadSettingsTab';
import {
  AppearanceSettingsTab,
  SecuritySettingsTab,
} from '@/components/settings/SecurityAndAppearanceTabs';
import { SETTINGS_TABS, SettingsTab } from '@/components/settings/settingsShared';
import {
  SettingsSlimHeader,
  SettingsVerticalSidebar,
  SetupCompletionBar,
  UnsavedChangesBar,
} from '@/components/settings/SettingsWorkspaceChrome';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';
import {
  computeSettingsChecklist,
  hasUnsavedSettingsDiff,
  SettingsDirtySnapshot,
  SettingsNavItemId,
  TABS_WITH_MARKSHEET_PREVIEW,
} from '@/lib/settingsWorkspaceUtils';
import { syncUrlQueryParams, URL_QUERY_CHANGED_EVENT } from '@/lib/urlTabSync';
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
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Admin Credentials
  const [adminPhoneInput, setAdminPhoneInput] = useState('admin');
  const [adminPassInput, setAdminPassInput] = useState('');

  // Academic & Language Config
  const [currentSession, setCurrentSession] = useState('২০২৬');
  const [examNames, setExamNames] = useState(['অর্ধ-বার্ষিক পরীক্ষা', 'বার্ষিক পরীক্ষা']);
  const [currentLang, setCurrentLang] = useState<AppLanguage>('bn');

  // Saved Baseline Snapshot for Floating Unsaved Changes Bar
  const [baselineSnapshot, setBaselineSnapshot] = useState<SettingsDirtySnapshot | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);

  // Sync activeTab with URL query parameter (supports 0ms Sidebar clicks & deep-links)
  useEffect(() => {
    const syncSettingsTab = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as SettingsTab | null;
      if (tab === 'bulk-student') {
        router.replace('/dashboard/students/bulk-import/');
        return;
      }
      if (tab && SETTINGS_TABS.some((t) => t.id === tab)) {
        setActiveTab(tab);
      } else if (!tab) {
        setActiveTab('identity');
      }
    };
    syncSettingsTab();
    window.addEventListener(URL_QUERY_CHANGED_EVENT, syncSettingsTab);
    window.addEventListener('popstate', syncSettingsTab);
    return () => {
      window.removeEventListener(URL_QUERY_CHANGED_EVENT, syncSettingsTab);
      window.removeEventListener('popstate', syncSettingsTab);
    };
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

    const initialSettings = settingsService.getSettings();
    setFormData(initialSettings);

    let loadedPhone = 'admin';
    let loadedSession = '২০২৬';
    let loadedExams = ['অর্ধ-বার্ষিক পরীক্ষা', 'বার্ষিক পরীক্ষা'];

    if (typeof window !== 'undefined') {
      const storedPhone = localStorage.getItem('sms_admin_phone');
      if (storedPhone) loadedPhone = storedPhone;

      const storedPass = localStorage.getItem('sms_admin_password');
      if (storedPass) {
        // Never pre-fill existing admin password or hash into input fields
        setAdminPassInput('');
      }

      const storedAcademic = localStorage.getItem('sms_academic_session');
      if (storedAcademic) {
        loadedSession = storedAcademic;
      } else {
        const legacy = localStorage.getItem('sms_current_session');
        if (legacy && !legacy.startsWith('{')) {
          loadedSession = legacy;
        }
      }

      const storedExams = localStorage.getItem('sms_exam_names');
      if (storedExams) {
        try {
          const parsed = JSON.parse(storedExams);
          if (Array.isArray(parsed)) loadedExams = parsed;
        } catch {
          // Ignore malformed legacy storage
        }
      }
    }

    setAdminPhoneInput(loadedPhone);
    setCurrentSession(loadedSession);
    setExamNames(loadedExams);

    setBaselineSnapshot({
      formData: initialSettings,
      adminPhoneInput: loadedPhone,
      adminPassInput: '',
      currentSession: loadedSession,
      examNames: [...loadedExams],
    });

    const unsub = settingsService.subscribe((savedSettings) => {
      setFormData(savedSettings);
      setBaselineSnapshot((prev) => (prev ? { ...prev, formData: savedSettings } : prev));
    });

    return () => {
      unsub();
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const checklist = useMemo(() => computeSettingsChecklist(formData), [formData]);

  const missingTabs = useMemo(() => {
    const set = new Set<SettingsNavItemId>();
    checklist.missingItems.forEach((item) => set.add(item.tab));
    return set;
  }, [checklist]);

  const isDirty = useMemo(
    () =>
      hasUnsavedSettingsDiff(
        {
          formData,
          adminPhoneInput,
          adminPassInput,
          currentSession,
          examNames,
        },
        baselineSnapshot,
      ),
    [formData, adminPhoneInput, adminPassInput, currentSession, examNames, baselineSnapshot],
  );

  const handleSelectTab = useCallback((nextTab: SettingsNavItemId) => {
    setActiveTab(nextTab);
    syncUrlQueryParams(
      '/dashboard/settings',
      { tab: nextTab === 'identity' ? null : nextTab },
      { push: true },
    );
  }, []);

  const handleNavigateTarget = useCallback(
    (tab: SettingsNavItemId, anchorId?: string) => {
      handleSelectTab(tab);
      if (!anchorId || typeof window === 'undefined') return;

      window.setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add(
          'ring-2',
          'ring-indigo-500',
          'ring-offset-2',
          'dark:ring-offset-slate-950',
          'rounded-2xl',
        );
        const focusable = el.querySelector<HTMLElement>('input, textarea, select, button');
        if (focusable && (focusable.tagName === 'INPUT' || focusable.tagName === 'TEXTAREA')) {
          focusable.focus({ preventScroll: true });
        }
        if (highlightTimeoutRef.current) {
          window.clearTimeout(highlightTimeoutRef.current);
        }
        highlightTimeoutRef.current = window.setTimeout(() => {
          el.classList.remove(
            'ring-2',
            'ring-indigo-500',
            'ring-offset-2',
            'dark:ring-offset-slate-950',
            'rounded-2xl',
          );
        }, 2200);
      }, 90);
    },
    [handleSelectTab],
  );

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 p-8">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-indigo-600 flex items-center justify-center">
          <Settings className="w-6 h-6 text-white animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">সেটিংস লোড হচ্ছে...</p>
      </div>
    );
  }

  // RBAC Access Guard
  if (session && session.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">অনুমতি নেই</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          শুধুমাত্র প্রধান প্রশাসক এই পাতায় প্রবেশ করতে পারবেন।
        </p>
        <Link
          href="/dashboard/teacher-portal"
          className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs"
        >
          শিক্ষক ড্যাশবোর্ডে ফিরুন
        </Link>
      </div>
    );
  }

  const handleChange = <K extends keyof SchoolSettings>(field: K, value: SchoolSettings[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImmediateSynced = (partial: Partial<SchoolSettings>) => {
    setBaselineSnapshot((prev) =>
      prev ? { ...prev, formData: { ...prev.formData, ...partial } } : prev,
    );
  };

  const handlePadSaved = (updated: SchoolSettings) => {
    setFormData(updated);
    setBaselineSnapshot((prev) => (prev ? { ...prev, formData: updated } : prev));
  };

  const handleGlobalLanguageChange = (l: AppLanguage) => {
    setCurrentLang(l);
    languageService.setLanguage(l);
    settingsService.updateSettings({ language: l });
    setFormData((prev) => ({ ...prev, language: l }));
    handleImmediateSynced({ language: l });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
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

      const persisted = settingsService.getSettings();
      setFormData(persisted);
      setAdminPassInput('');
      setBaselineSnapshot({
        formData: persisted,
        adminPhoneInput: adminPhoneInput.trim(),
        adminPassInput: '',
        currentSession: currentSession.trim(),
        examNames: [...examNames],
      });

      setSavedSuccess(true);
      showToast('সকল পরিবর্তন সফলভাবে সংরক্ষিত হয়েছে।', 'success');
      window.setTimeout(() => setSavedSuccess(false), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!baselineSnapshot) return;
    setFormData(baselineSnapshot.formData);
    setAdminPhoneInput(baselineSnapshot.adminPhoneInput);
    setAdminPassInput('');
    setCurrentSession(baselineSnapshot.currentSession);
    setExamNames([...baselineSnapshot.examNames]);
    showToast('অসংরক্ষিত পরিবর্তন বাতিল করা হয়েছে।', 'info');
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
      const persisted = settingsService.getSettings();
      setFormData(persisted);
      setAdminPhoneInput('admin');
      setAdminPassInput('');
      setBaselineSnapshot({
        formData: persisted,
        adminPhoneInput: 'admin',
        adminPassInput: '',
        currentSession,
        examNames: [...examNames],
      });
      setSavedSuccess(true);
      showToast('সকল সেটিংস ডিফল্ট মানে রিসেট করা হয়েছে।', 'success');
      window.setTimeout(() => setSavedSuccess(false), 4000);
    }
  };

  const totalStudents = typeof window !== 'undefined' ? studentService.getAllStudents().length : 0;
  const showMarksheetPreview = TABS_WITH_MARKSHEET_PREVIEW.has(activeTab);

  return (
    <div className={`w-full space-y-4 font-sans ${isDirty ? 'pb-24' : 'pb-6'}`}>
      {/* 1. Slim SaaS Header Bar (Title + Quick Search + Save CTA) */}
      <SettingsSlimHeader
        isDirty={isDirty}
        isSaving={isSaving}
        savedSuccess={savedSuccess}
        onSave={() => handleSubmit()}
        onNavigateTarget={handleNavigateTarget}
      />

      {/* 2. Setup Completion Checklist Bar (Auto-hides at 5/5) */}
      <SetupCompletionBar checklist={checklist} onJump={handleNavigateTarget} />

      {/* 3. Subtle Save Confirmation Strip */}
      {savedSuccess && (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 px-4 py-3 rounded-2xl text-xs font-bold print:hidden">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong className="font-black">সফলভাবে সংরক্ষিত!</strong> মার্কশিট, সনদ ও প্রিন্ট মডিউলে নতুন তথ্য হালনাগাদ হয়েছে।
          </span>
          <button
            type="button"
            onClick={() => setSavedSuccess(false)}
            className="ml-auto p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors cursor-pointer"
            aria-label="বার্তা বন্ধ করুন"
          >
            <X className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </button>
        </div>
      )}

      {/* 4. Main SaaS Split Workspace: Categorized Left Vertical Sidebar + Right Content */}
      <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
        <SettingsVerticalSidebar
          activeTab={activeTab}
          missingTabs={missingTabs}
          onSelectTab={handleSelectTab}
        />

        <main className="flex-1 min-w-0 w-full">
          {showMarksheetPreview ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start w-full">
              <div className="xl:col-span-8 space-y-5 min-w-0">
                {activeTab === 'identity' && (
                  <IdentitySettingsTab formData={formData} handleChange={handleChange} />
                )}
                {activeTab === 'appearance' && (
                  <AppearanceSettingsTab
                    formData={formData}
                    handleChange={handleChange}
                    onImmediateSynced={handleImmediateSynced}
                  />
                )}
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
              </div>

              <SettingsSidebarPreview
                formData={formData}
                examNames={examNames}
                currentSession={currentSession}
                totalStudents={totalStudents}
              />
            </div>
          ) : (
            <div className="w-full space-y-5 min-w-0">
              {activeTab === 'pad' && (
                <PadSettingsTab formData={formData} onPadSaved={handlePadSaved} />
              )}
              {activeTab === 'committee' && (
                <CommitteeSettingsTab formData={formData} setFormData={setFormData} />
              )}
              {activeTab === 'facilities' && <FacilitiesSettingsTab />}
              {activeTab === 'sms' && <SmsGatewaySettingsTab />}
              {activeTab === 'security' && (
                <SecuritySettingsTab
                  adminPhoneInput={adminPhoneInput}
                  setAdminPhoneInput={setAdminPhoneInput}
                  adminPassInput={adminPassInput}
                  setAdminPassInput={setAdminPassInput}
                />
              )}
              {activeTab === 'data' && (
                <DataSettingsTab
                  sessionRole={session?.role}
                  sessionTeacherName={session?.teacherName}
                  setFormData={setFormData}
                  onRestored={handlePadSaved}
                />
              )}
              {activeTab === 'system' && (
                <SystemSettingsTab
                  formData={formData}
                  currentLang={currentLang}
                  onLanguageChange={handleGlobalLanguageChange}
                  totalStudents={totalStudents}
                  onResetDefaults={handleResetDefaults}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* 5. Smart Floating Unsaved Changes Bar */}
      <UnsavedChangesBar
        visible={isDirty}
        isSaving={isSaving}
        onDiscard={handleDiscard}
        onSave={() => handleSubmit()}
      />
    </div>
  );
}
