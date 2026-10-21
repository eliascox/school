'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  LayoutTemplate,
  Globe,
  Eye,
  Save,
  RotateCcw,
  Upload,
  Trash2,
  Plus,
  MoveUp,
  MoveDown,
  Copy,
  Check,
  AlertCircle,
  Palette,
  FileText,
  HelpCircle,
  Smartphone,
  Tablet,
  Monitor,
  History,
  ShieldCheck,
  Sparkles,
  Search,
  Bell,
  Users,
  Award,
  BookOpen,
  School,
  GraduationCap,
  Building2,
  Image as ImageIcon,
  Mail,
  Phone,
  ExternalLink,
  ChevronRight,
  Layers,
  Settings,
  X,
  Share2
} from 'lucide-react';
import {
  landingPageService,
  LandingPageConfig,
  SectionItem,
  NavMenuItem,
  HeroSlide,
  ClassStatItem,
  ServiceCard,
  AchieverStudent,
  BlogPostItem,
  FAQItem,
  FacilityItem,
  FooterColumnLink,
  MediaItem,
  VersionSnapshot,
  AuditLogEntry,
  DEFAULT_LANDING_CONFIG
} from '@/services/landingPageService';
import { teacherAuthService } from '@/services/teacherAuthService';

type ActiveTab =
  | 'overview'
  | 'sections'
  | 'header'
  | 'hero'
  | 'about'
  | 'features'
  | 'stats'
  | 'achievers'
  | 'blog'
  | 'faq'
  | 'media'
  | 'theme'
  | 'footer'
  | 'seo'
  | 'history';

export default function LandingPageManagementDashboard() {
  const [config, setConfig] = useState<LandingPageConfig>(DEFAULT_LANDING_CONFIG);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [publishSummary, setPublishSummary] = useState<string>('ওয়েবসাইট আপডেট ও কনটেন্ট প্রকাশ');
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Media Library state
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Versions state
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Section Manager template picker
  const [showAddSectionModal, setShowAddSectionModal] = useState<boolean>(false);

  // Load data on mount
  useEffect(() => {
    const draft = landingPageService.getDraftConfig();
    setConfig(draft);
    setHasChanges(landingPageService.hasDraftChanges());
    setMediaList(landingPageService.getMediaList());
    setVersions(landingPageService.getVersions());
    setAuditLogs(landingPageService.getAuditLogs());

    const unsubDraft = landingPageService.subscribeDraft((newDraft) => {
      setConfig(newDraft);
      setHasChanges(landingPageService.hasDraftChanges());
    });

    return () => {
      unsubDraft();
    };
  }, []);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Helper to update draft state & service
  const handleUpdateConfig = (newConfig: LandingPageConfig) => {
    setConfig(newConfig);
    landingPageService.saveDraftConfig(newConfig, 'অ্যাডমিন');
    setHasChanges(true);
  };

  // Save Draft Action
  const handleSaveDraft = () => {
    const success = landingPageService.saveDraftConfig(config, 'অ্যাডমিন');
    if (success) {
      setHasChanges(landingPageService.hasDraftChanges());
      showToast('খসড়া সফলভাবে সংরক্ষণ করা হয়েছে', 'success');
    } else {
      showToast('খসড়া সংরক্ষণে ত্রুটি দেখা দিয়েছে', 'error');
    }
  };

  // Publish to Live Action
  const handlePublishLive = () => {
    setIsPublishing(true);
    try {
      const success = landingPageService.publish('অ্যাডমিন', publishSummary || 'ওয়েবসাইট কনটেন্ট আপডেট');
      if (success) {
        setShowPublishModal(false);
        setHasChanges(false);
        setVersions(landingPageService.getVersions());
        setAuditLogs(landingPageService.getAuditLogs());
        showToast('🎉 সফলভাবে মূল ওয়েবসাইটে লাইভ প্রকাশ করা হয়েছে!', 'success');
      } else {
        showToast('প্রকাশ করতে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন', 'error');
      }
    } finally {
      setIsPublishing(false);
    }
  };

  // Discard Draft Action
  const handleDiscardDraft = () => {
    if (confirm('আপনি কি নিশ্চিত যে অপ্রকাশিত খসড়া পরিবর্তন বাতিল করে পূর্বের প্রকাশিত অবস্থায় ফিরে যেতে চান?')) {
      landingPageService.discardDraft();
      const published = landingPageService.getPublishedConfig();
      setConfig(published);
      setHasChanges(false);
      showToast('অপ্রকাশিত খসড়া বাতিল করা হয়েছে', 'info');
    }
  };

  // Restore Version Action
  const handleRestoreVersion = (ver: VersionSnapshot) => {
    if (confirm(`আপনি কি সংস্করণ ${ver.version} (${ver.summary}) রিস্টোর করতে চান? এটি আপনার বর্তমান খসড়া প্রতিস্থাপন করবে।`)) {
      const ok = landingPageService.restoreVersion(ver.id, 'অ্যাডমিন');
      if (ok) {
        setConfig(landingPageService.getDraftConfig());
        setHasChanges(true);
        showToast(`সংস্করণ ${ver.version} সফলভাবে রিস্টোর হয়েছে। পরিবর্তনটি খসড়ায় সংরক্ষিত আছে, লাইভ করতে প্রকাশ করুন।`, 'success');
      }
    }
  };

  // Section Reordering
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...config.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // update orders
    newSections.forEach((s, idx) => {
      s.order = idx + 1;
    });

    handleUpdateConfig({ ...config, sections: newSections });
    showToast('সেকশনের ক্রম পরিবর্তন করা হয়েছে', 'info');
  };

  // Section Toggle Visibility
  const handleToggleSection = (sectionId: string, current: boolean) => {
    const newSections = config.sections.map(s => (s.id === sectionId ? { ...s, enabled: !current } : s));
    handleUpdateConfig({ ...config, sections: newSections });
    showToast(`সেকশন ${!current ? 'দৃশ্যমান (Show)' : 'লুকানো (Hide)'} করা হয়েছে`, 'info');
  };

  // Duplicate Section
  const handleDuplicateSection = (sec: SectionItem) => {
    landingPageService.duplicateSection(sec.id, 'অ্যাডমিন');
    const updated = landingPageService.getDraftConfig();
    setConfig(updated);
    setHasChanges(true);
    showToast(`"${sec.nameBn}" ডুপ্লিকেট করা হয়েছে`, 'success');
  };

  // Delete Section
  const handleDeleteSection = (sec: SectionItem) => {
    if (confirm(`আপনি কি "${sec.nameBn}" সেকশনটি মুছে ফেলতে চান?`)) {
      landingPageService.deleteSection(sec.id, 'অ্যাডমিন');
      const updated = landingPageService.getDraftConfig();
      setConfig(updated);
      setHasChanges(true);
      showToast(`সেকশন মুছে ফেলা হয়েছে`, 'info');
    }
  };

  // Media Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 2 * 1024 * 1024) {
      alert('ছবির আকার সর্বোচ্চ ২ মেগাবাইট (2MB) হতে হবে। অনুগ্রহ করে ছোট আকারের ছবি নির্বাচন করুন।');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const newItem = landingPageService.addMediaItem({
        name: file.name,
        url: result,
        size: file.size,
        type: file.type,
        altText: file.name.replace(/\.[^/.]+$/, ''),
        category: 'banner',
      });
      setMediaList(landingPageService.getMediaList());
      showToast(`"${file.name}" সফলভাবে মিডিয়া লাইব্রেরিতে যুক্ত হয়েছে`, 'success');
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 pb-20 text-slate-800 dark:text-slate-100">
      {/* ─── TOAST NOTIFICATION ─── */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-bold transition-all transform animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : toastMessage.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-indigo-600 text-white border-indigo-500'
          }`}
        >
          {toastMessage.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ─── TOP ACTION & HEADER BAR ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-indigo-600/25 shrink-0">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  ল্যান্ডিং পেইজ ম্যানেজমেন্ট সিস্টেম
                </h1>
                {hasChanges ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    অপ্রকাশিত খসড়া পরিবর্তন রয়েছে
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    সব পরিবর্তন লাইভ (V{config.version})
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                কোনো কোডিং ছাড়াই বিদ্যালয়ের মূল ওয়েবসাইট ও ল্যান্ডিং পেইজের প্রতিটি অংশ সম্পূর্ণ পরিবর্তন ও নিয়ন্ত্রণ করুন।
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
            <button
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs sm:text-sm font-bold transition"
              title="নতুন ব্যবহারকারী নির্দেশিকা ও সহায়তা"
            >
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>সহায়িকা</span>
            </button>

            <button
              onClick={() => setShowPreviewModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs sm:text-sm font-bold transition shadow-xs"
              title="ওয়েবসাইটের লাইভ প্রিভিউ দেখুন"
            >
              <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>লাইভ প্রিভিউ</span>
            </button>

            {hasChanges && (
              <button
                onClick={handleDiscardDraft}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs sm:text-sm font-bold transition"
                title="অপ্রকাশিত পরিবর্তন বাতিল করুন"
              >
                <RotateCcw className="w-4 h-4 text-rose-500" />
                <span>বাতিল</span>
              </button>
            )}

            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 text-xs sm:text-sm font-bold transition shadow-xs"
              title="খসড়া সংরক্ষণ করুন"
            >
              <Save className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span>খসড়া সেভ</span>
            </button>

            <button
              onClick={() => setShowPublishModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800 text-xs sm:text-sm font-black transition shadow-md shadow-emerald-600/30"
              title="মূল ওয়েবসাইটে লাইভ প্রকাশ করুন"
            >
              <Sparkles className="w-4 h-4 text-yellow-200" />
              <span>প্রকাশ করুন (Live)</span>
            </button>
          </div>
        </div>

        {/* ─── 13 MODULE TABS ─── */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-1.5 min-w-max">
            {[
              { id: 'overview', label: 'ওভারভিউ', icon: <Layers className="w-4 h-4" /> },
              { id: 'sections', label: 'সেকশন ম্যানেজার', icon: <LayoutTemplate className="w-4 h-4" /> },
              { id: 'header', label: 'হেডার ও নেভিগেশন', icon: <Globe className="w-4 h-4" /> },
              { id: 'hero', label: 'হিরো ও ব্যানার', icon: <Sparkles className="w-4 h-4" /> },
              { id: 'about', label: 'পরিচিতি ও বাণী', icon: <School className="w-4 h-4" /> },
              { id: 'features', label: 'ফিচার ও সুবিধাসমূহ', icon: <Building2 className="w-4 h-4" /> },
              { id: 'stats', label: 'পরিসংখ্যান', icon: <Award className="w-4 h-4" /> },
              { id: 'achievers', label: 'সেরা ছাত্র/ছাত্রী', icon: <GraduationCap className="w-4 h-4" /> },
              { id: 'blog', label: 'সংবাদ ও ব্লগ', icon: <FileText className="w-4 h-4" /> },
              { id: 'faq', label: 'প্রশ্নোত্তর (FAQ)', icon: <HelpCircle className="w-4 h-4" /> },
              { id: 'media', label: 'ছবি ও মিডিয়া', icon: <ImageIcon className="w-4 h-4" /> },
              { id: 'theme', label: 'রং, ফন্ট ও থিম', icon: <Palette className="w-4 h-4" /> },
              { id: 'footer', label: 'যোগাযোগ ও ফুটার', icon: <Mail className="w-4 h-4" /> },
              { id: 'seo', label: 'SEO ও সোশ্যাল', icon: <Share2 className="w-4 h-4" /> },
              { id: 'history', label: 'সংস্করণ ইতিহাস', icon: <History className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 1: OVERVIEW (ওভারভিউ)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">লাইভ স্ট্যাটাস</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">সংস্করণ {config.version}</span>
                <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                  <ShieldCheck className="w-6 h-6" />
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">সর্বশেষ আপডেট: {new Date(config.lastUpdatedAt).toLocaleDateString('bn-BD')}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">সক্রিয় সেকশন</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {config.sections.filter(s => s.enabled).length} / {config.sections.length}
                </span>
                <span className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                  <Layers className="w-6 h-6" />
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">ল্যান্ডিং পেজে দৃশ্যমান রয়েছে</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">মিডিয়া ফাইলসমূহ</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{mediaList.length} টি ফাইল</span>
                <span className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
                  <ImageIcon className="w-6 h-6" />
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">লোগো, ব্যানার ও ফটো গ্যালারি</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">প্রকাশের ইতিহাস</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{versions.length} টি স্ন্যাপশট</span>
                <span className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                  <History className="w-6 h-6" />
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">যেকোনো সময় আগের সংস্করণে ফেরা যাবে</p>
            </div>
          </div>

          {/* Quick Shortcuts & Section Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">সেকশনসমূহের বর্তমান স্ট্যাটাস</h3>
                <button
                  onClick={() => setActiveTab('sections')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  সেকশন ম্যানেজার খুলুন <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {config.sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{sec.nameBn}</span>
                        <span className="text-xs text-slate-400 block">{sec.description}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          sec.enabled
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {sec.enabled ? 'দৃশ্যমান' : 'লুকানো'}
                      </span>
                      <button
                        onClick={() => handleToggleSection(sec.id, sec.enabled)}
                        className="text-xs font-bold px-3 py-1 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 transition"
                      >
                        {sec.enabled ? 'হাইড করুন' : 'শো করুন'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Guide */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-indigo-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-white/10 text-yellow-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base">সহজ ৩-ধাপে পরিবর্তন</h3>
                </div>
                <ul className="text-xs space-y-2.5 text-indigo-100 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">১</span>
                    <span>যেকোনো ট্যাবে গিয়ে টেক্সট, ছবি বা ডিজাইন পরিবর্তন করুন।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">২</span>
                    <span><strong>"লাইভ প্রিভিউ"</strong> বাটনে ক্লিক করে মোবাইল বা কম্পিউটারে কেমন দেখাবে তা পরীক্ষা করুন।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">৩</span>
                    <span>সব ঠিক থাকলে <strong>"প্রকাশ করুন"</strong> বাটনে ক্লিক করলেই এক ক্লিকে মূল ওয়েবসাইট আপডেট হয়ে যাবে!</span>
                  </li>
                </ul>

                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-indigo-200">লাইভ ওয়েবসাইট সরাসরি দেখুন:</span>
                  <Link
                    href="/"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-indigo-900 font-extrabold text-xs hover:bg-indigo-50 transition"
                  >
                    <span>ভিজিট সাইট</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Institution Summary Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">প্রতিষ্ঠান পরিচিতি সংক্ষেপ</h4>
                <div className="text-sm">
                  <p className="font-extrabold text-slate-900 dark:text-white">{config.header.schoolName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{config.header.topbarAddress}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>EIIN:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{config.footer.eiin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>স্কুল কোড:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{config.footer.schoolCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ফোন:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{config.header.topbarPhone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 2: SECTION MANAGER (সেকশন ম্যানেজার)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'sections' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">সেকশন ম্যানেজার ও ক্রম পরিবর্তন</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  ল্যান্ডিং পেজের সেকশনগুলোকে ড্র্যাগ/আপ-ডাউন করে সাজান, প্রদর্শন বা গোপন করুন এবং নতুন সেকশন যোগ করুন।
                </p>
              </div>
              <button
                onClick={() => setShowAddSectionModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন সেকশন যোগ করুন</span>
              </button>
            </div>

            <div className="space-y-3">
              {config.sections.map((sec, index) => (
                <div
                  key={sec.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    sec.enabled
                      ? 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-900/60 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Order Badge */}
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-sm shrink-0 border border-slate-200 dark:border-slate-700">
                      {sec.order}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {sec.nameBn}
                        </span>
                        {sec.type === 'custom' && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            কাস্টম
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{sec.description}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* Move Up */}
                    <button
                      onClick={() => handleMoveSection(index, 'up')}
                      disabled={index === 0}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition text-slate-600 dark:text-slate-300"
                      title="উপরে নিন"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => handleMoveSection(index, 'down')}
                      disabled={index === config.sections.length - 1}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition text-slate-600 dark:text-slate-300"
                      title="নিচে নিন"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={() => handleDuplicateSection(sec)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300"
                      title="ডুপ্লিকেট করুন"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Show/Hide Toggle */}
                    <button
                      onClick={() => handleToggleSection(sec.id, sec.enabled)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition border ${
                        sec.enabled
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {sec.enabled ? 'দৃশ্যমান' : 'লুকানো'}
                    </button>

                    {/* Delete for custom or hide */}
                    <button
                      onClick={() => handleDeleteSection(sec)}
                      className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 3: HEADER & NAVIGATION (হেডার ও নেভিগেশন)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'header' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">হেডার ও ব্র্যান্ডিং সেটিংস</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* School Name */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  বিদ্যালয়ের পূর্ণ নাম (বাংলা)
                </label>
                <input
                  type="text"
                  value={config.header.schoolName}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      header: { ...config.header, schoolName: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="যেমন: বরইতলী উচ্চ বিদ্যালয়"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">এটি হেডারের লোগোর পাশে এবং ব্রাউজার ট্যাবে প্রদর্শিত হবে।</span>
              </div>

              {/* Slogan */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  বিদ্যালয়ের মূল বাণী বা স্লোগান
                </label>
                <input
                  type="text"
                  value={config.header.schoolSlogan}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      header: { ...config.header, schoolSlogan: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="যেমন: জ্ঞানে ও আলোয় আলোকিত ভবিষ্যৎ"
                />
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  বিদ্যালয়ের লোগো URL বা মিডিয়া লিংক
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.header.logoUrl}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        header: { ...config.header, logoUrl: e.target.value },
                      })
                    }
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="/logo.png বা ডাটা URL"
                  />
                  <button
                    onClick={() => setActiveTab('media')}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>লাইব্রেরি</span>
                  </button>
                </div>
              </div>

              {/* Sticky Navbar & Notice Ticker Toggle */}
              <div className="flex flex-col justify-center space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.header.sticky}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        header: { ...config.header, sticky: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">স্টিকি হেডার (স্ক্রল করলেও উপরে আটকে থাকবে)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.header.showNoticeTicker}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        header: { ...config.header, showNoticeTicker: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">টপ নোটিশ স্ক্রলার (জরুরি ঘোষণা বার) প্রদর্শন করুন</span>
                </label>
              </div>
            </div>

            {/* Topbar Contact Info */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">টপ কন্টাক্ট বার ইনফরমেশন</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">হেল্পলাইন ফোন নম্বর</label>
                  <input
                    type="text"
                    value={config.header.topbarPhone}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        header: { ...config.header, topbarPhone: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">অফিসিয়াল ইমেইল</label>
                  <input
                    type="text"
                    value={config.header.topbarEmail}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        header: { ...config.header, topbarEmail: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">সংক্ষিপ্ত ঠিকানা</label>
                  <input
                    type="text"
                    value={config.header.topbarAddress}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        header: { ...config.header, topbarAddress: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Navigation Menu Links Editor */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">নেভিগেশন মেনু আইটেমসমূহ</h3>
                  <p className="text-xs text-slate-500">মেনুর লেখা, লিংক ও বাটনের ধরন পরিবর্তন করুন।</p>
                </div>
                <button
                  onClick={() => {
                    const newLink: NavMenuItem = {
                      id: `nav-${Date.now()}`,
                      label: 'নতুন মেনু',
                      href: '#',
                      visible: true,
                      order: config.header.navLinks.length + 1,
                    };
                    handleUpdateConfig({
                      ...config,
                      header: {
                        ...config.header,
                        navLinks: [...config.header.navLinks, newLink],
                      },
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>মেনু যোগ করুন</span>
                </button>
              </div>

              <div className="space-y-2">
                {config.header.navLinks.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                  >
                    <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>

                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => {
                        const updated = [...config.header.navLinks];
                        updated[idx].label = e.target.value;
                        handleUpdateConfig({ ...config, header: { ...config.header, navLinks: updated } });
                      }}
                      className="w-full sm:w-40 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                      placeholder="মেনু নাম"
                    />

                    <input
                      type="text"
                      value={item.href}
                      onChange={(e) => {
                        const updated = [...config.header.navLinks];
                        updated[idx].href = e.target.value;
                        handleUpdateConfig({ ...config, header: { ...config.header, navLinks: updated } });
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono outline-none"
                      placeholder="লিংক বা #id"
                    />

                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={item.isButton || false}
                        onChange={(e) => {
                          const updated = [...config.header.navLinks];
                          updated[idx].isButton = e.target.checked;
                          handleUpdateConfig({ ...config, header: { ...config.header, navLinks: updated } });
                        }}
                      />
                      <span>বাটন স্টাইল</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={item.visible}
                        onChange={(e) => {
                          const updated = [...config.header.navLinks];
                          updated[idx].visible = e.target.checked;
                          handleUpdateConfig({ ...config, header: { ...config.header, navLinks: updated } });
                        }}
                      />
                      <span>দৃশ্যমান</span>
                    </label>

                    <button
                      onClick={() => {
                        const updated = config.header.navLinks.filter((_, i) => i !== idx);
                        handleUpdateConfig({ ...config, header: { ...config.header, navLinks: updated } });
                      }}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
                      title="মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 4: HERO & BANNERS (হিরো ও ব্যানার)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'hero' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">হিরো সেকশন ও প্রধান ব্যানার</h2>
                <p className="text-xs text-slate-500">হোমপেজের মূল আকর্ষণীয় অংশ, হেডলাইন, ব্যানার ছবি ও অ্যাকশন বাটন।</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.hero.enabled}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      hero: { ...config.hero, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-xs font-black">হিরো সেকশন সক্রিয় রাখুন</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Badge Text */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  শীর্ষ ব্যাজ বা স্ট্যাটাস টেক্সট
                </label>
                <input
                  type="text"
                  value={config.hero.badgeText}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      hero: { ...config.hero, badgeText: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="যেমন: 🏛️ ঐতিহ্যের ৫৫ বছর | স্থাপিত ১৯৬৯"
                />
              </div>

              {/* Main Title */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  প্রধান শিরোনাম (Main Heading)
                </label>
                <input
                  type="text"
                  value={config.hero.title}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      hero: { ...config.hero, title: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="যেমন: বরইতলী উচ্চ বিদ্যালয়"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  উপ-শিরোনাম বা অবস্থান
                </label>
                <input
                  type="text"
                  value={config.hero.subtitle}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      hero: { ...config.hero, subtitle: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="যেমন: 📍 Baritali, Chakaria, Cox's Bazar."
                />
              </div>

              {/* Background Type */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  হিরো ব্যাকগ্রাউন্ডের ধরন
                </label>
                <select
                  value={config.hero.bgType}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      hero: { ...config.hero, bgType: e.target.value as any },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="gradient">আধুনিক ডার্ক গ্রেডিয়েন্ট (Gradient)</option>
                  <option value="image">ক্যাম্পাস ব্যাকগ্রাউন্ড ছবি (Image Overlay)</option>
                  <option value="solid">এক রঙের ব্যাকগ্রাউন্ড (Solid Color)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                সংক্ষিপ্ত বিবরণ (Description)
              </label>
              <textarea
                rows={3}
                value={config.hero.description}
                onChange={(e) =>
                  handleUpdateConfig({
                    ...config,
                    hero: { ...config.hero, description: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="বিদ্যালয়ের বৈশিষ্ট্য ও মিশন সম্পর্কিত ২-৩ লাইনের বিবরণ"
              />
            </div>

            {/* CTA Buttons */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">কল-টু-অ্যাকশন (CTA) বাটনসমূহ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Primary CTA */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase">প্রধান বাটন (Primary CTA)</span>
                    <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.hero.primaryCta.visible}
                        onChange={(e) =>
                          handleUpdateConfig({
                            ...config,
                            hero: {
                              ...config.hero,
                              primaryCta: { ...config.hero.primaryCta, visible: e.target.checked },
                            },
                          })
                        }
                      />
                      <span>সক্রিয়</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">বাটনের লেখা</label>
                    <input
                      type="text"
                      value={config.hero.primaryCta.text}
                      onChange={(e) =>
                        handleUpdateConfig({
                          ...config,
                          hero: {
                            ...config.hero,
                            primaryCta: { ...config.hero.primaryCta, text: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">টার্গেট লিংক</label>
                    <input
                      type="text"
                      value={config.hero.primaryCta.href}
                      onChange={(e) =>
                        handleUpdateConfig({
                          ...config,
                          hero: {
                            ...config.hero,
                            primaryCta: { ...config.hero.primaryCta, href: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Secondary CTA */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase">দ্বিতীয় বাটন (Secondary CTA)</span>
                    <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.hero.secondaryCta.visible}
                        onChange={(e) =>
                          handleUpdateConfig({
                            ...config,
                            hero: {
                              ...config.hero,
                              secondaryCta: { ...config.hero.secondaryCta, visible: e.target.checked },
                            },
                          })
                        }
                      />
                      <span>সক্রিয়</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">বাটনের লেখা</label>
                    <input
                      type="text"
                      value={config.hero.secondaryCta.text}
                      onChange={(e) =>
                        handleUpdateConfig({
                          ...config,
                          hero: {
                            ...config.hero,
                            secondaryCta: { ...config.hero.secondaryCta, text: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">টার্গেট লিংক</label>
                    <input
                      type="text"
                      value={config.hero.secondaryCta.href}
                      onChange={(e) =>
                        handleUpdateConfig({
                          ...config,
                          hero: {
                            ...config.hero,
                            secondaryCta: { ...config.hero.secondaryCta, href: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 5: ABOUT & LEADERSHIP (পরিচিতি ও বাণী)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">প্রতিষ্ঠান পরিচিতি ও দিকনির্দেশনামূলক বাণী</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  পরিচিতি সেকশনের শিরোনাম
                </label>
                <input
                  type="text"
                  value={config.about.title}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      about: { ...config.about, title: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  প্রতিষ্ঠা সাল ও ইতিহাস সারসংক্ষেপ
                </label>
                <input
                  type="text"
                  value={config.about.foundingYear}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      about: { ...config.about, foundingYear: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                প্রতিষ্ঠানের সংক্ষিপ্ত ইতিহাস (History)
              </label>
              <textarea
                rows={4}
                value={config.about.historyText}
                onChange={(e) =>
                  handleUpdateConfig({
                    ...config,
                    about: { ...config.about, historyText: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none"
              />
            </div>

            {/* Principal's Speech */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">প্রধান শিক্ষকের বাণী</h3>
                <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.about.headmaster.visible}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        about: {
                          ...config.about,
                          headmaster: { ...config.about.headmaster, visible: e.target.checked },
                        },
                      })
                    }
                  />
                  <span>প্রদর্শন করুন</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">প্রধান শিক্ষকের নাম</label>
                  <input
                    type="text"
                    value={config.about.headmaster.name}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        about: {
                          ...config.about,
                          headmaster: { ...config.about.headmaster, name: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">পদবি</label>
                  <input
                    type="text"
                    value={config.about.headmaster.title}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        about: {
                          ...config.about,
                          headmaster: { ...config.about.headmaster, title: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">দিকনির্দেশনামূলক বাণী</label>
                <textarea
                  rows={4}
                  value={config.about.headmaster.message}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      about: {
                        ...config.about,
                        headmaster: { ...config.about.headmaster, message: e.target.value },
                      },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 6: FEATURES & SERVICES (ফিচার ও সেবা)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'features' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">অনলাইন সেবা কার্ডসমূহ</h2>
                <p className="text-xs text-slate-500">শিক্ষার্থী ও অভিভাবকদের দ্রুত সেবা প্রদান সংক্রান্ত পোর্টাল কার্ড।</p>
              </div>
              <button
                onClick={() => {
                  const newCard: ServiceCard = {
                    id: `srv-${Date.now()}`,
                    title: 'নতুন অনলাইন সেবা',
                    description: 'এই সেবার সংক্ষিপ্ত বিবরণ এখানে লিখুন।',
                    icon: 'FileText',
                    link: '#',
                    badge: 'নতুন',
                    badgeColor: 'blue',
                    visible: true,
                  };
                  handleUpdateConfig({
                    ...config,
                    services: {
                      ...config.services,
                      cards: [...config.services.cards, newCard],
                    },
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>সেবা কার্ড যোগ করুন</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.services.cards.map((card, idx) => (
                <div
                  key={card.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={card.visible}
                          onChange={(e) => {
                            const updated = [...config.services.cards];
                            updated[idx].visible = e.target.checked;
                            handleUpdateConfig({ ...config, services: { ...config.services, cards: updated } });
                          }}
                        />
                        <span>সক্রিয়</span>
                      </label>
                      <button
                        onClick={() => {
                          const updated = config.services.cards.filter((_, i) => i !== idx);
                          handleUpdateConfig({ ...config, services: { ...config.services, cards: updated } });
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">সেবার শিরোনাম</label>
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => {
                        const updated = [...config.services.cards];
                        updated[idx].title = e.target.value;
                        handleUpdateConfig({ ...config, services: { ...config.services, cards: updated } });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">বিবরণ</label>
                    <textarea
                      rows={2}
                      value={card.description}
                      onChange={(e) => {
                        const updated = [...config.services.cards];
                        updated[idx].description = e.target.value;
                        handleUpdateConfig({ ...config, services: { ...config.services, cards: updated } });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">লিংক (URL)</label>
                      <input
                        type="text"
                        value={card.link}
                        onChange={(e) => {
                          const updated = [...config.services.cards];
                          updated[idx].link = e.target.value;
                          handleUpdateConfig({ ...config, services: { ...config.services, cards: updated } });
                        }}
                        className="w-full px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">ব্যাজ টেক্সট</label>
                      <input
                        type="text"
                        value={card.badge || ''}
                        onChange={(e) => {
                          const updated = [...config.services.cards];
                          updated[idx].badge = e.target.value;
                          handleUpdateConfig({ ...config, services: { ...config.services, cards: updated } });
                        }}
                        className="w-full px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Campus Facilities Management Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold mb-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>ক্যাম্পাস অবকাঠামো ও সুবিধাসমূহ</span>
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  ক্যাম্পাস সুবিধাসমূহ সেটিংস (Facilities)
                </h2>
                <p className="text-xs text-slate-500">
                  আইসিটি ল্যাব, বিজ্ঞানাগার, লাইব্রেরি, খেলার মাঠ ও স্যানিটেশন সংক্রান্ত তথ্যাদি সম্পাদনা করুন।
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.facilities?.enabled !== false}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        facilities: {
                          ...config.facilities,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">সেকশন চালু রাখুন</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    const newFacility: FacilityItem = {
                      id: `fac-${Date.now()}`,
                      title: 'নতুন ক্যাম্পাস সুবিধা',
                      titleEn: 'New Campus Facility',
                      description: 'এই সুবিধার সংক্ষিপ্ত বর্ণনা এখানে লিখুন।',
                      icon: 'Monitor',
                      badge: 'নতুন সুবিধা',
                      color: 'indigo',
                      visible: true,
                    };
                    const currentItems = config.facilities?.items || [];
                    handleUpdateConfig({
                      ...config,
                      facilities: {
                        ...config.facilities,
                        items: [...currentItems, newFacility],
                      },
                    });
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>সুবিধা যোগ করুন</span>
                </button>
              </div>
            </div>

            {/* Section Header Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  আইব্রো ট্যাগ (Badge)
                </label>
                <input
                  type="text"
                  value={config.facilities?.eyebrow || ''}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      facilities: {
                        ...config.facilities,
                        eyebrow: e.target.value,
                      },
                    })
                  }
                  placeholder="যেমন: ক্যাম্পাস অবকাঠামো ও সুবিধাসমূহ"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  সেকশন শিরোনাম
                </label>
                <input
                  type="text"
                  value={config.facilities?.title || ''}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      facilities: {
                        ...config.facilities,
                        title: e.target.value,
                      },
                    })
                  }
                  placeholder="যেমন: শিক্ষার্থীদের সার্বিক বিকাশে আধুনিক সুযোগ-সুবিধা"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  উপ-শিরোনাম / বিবরণী
                </label>
                <input
                  type="text"
                  value={config.facilities?.subtitle || ''}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      facilities: {
                        ...config.facilities,
                        subtitle: e.target.value,
                      },
                    })
                  }
                  placeholder="সুপরিকল্পিত ও মনোরম ক্যাম্পাস পরিবেশ..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>
            </div>

            {/* Facility Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(config.facilities?.items || []).map((fac, fIdx) => (
                <div
                  key={fac.id || fIdx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center">
                      {fIdx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fac.visible !== false}
                          onChange={(e) => {
                            const updated = [...(config.facilities?.items || [])];
                            updated[fIdx].visible = e.target.checked;
                            handleUpdateConfig({
                              ...config,
                              facilities: { ...config.facilities, items: updated },
                            });
                          }}
                        />
                        <span>সক্রিয়</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (config.facilities?.items || []).filter((_, i) => i !== fIdx);
                          handleUpdateConfig({
                            ...config,
                            facilities: { ...config.facilities, items: updated },
                          });
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">বাংলা নাম</label>
                      <input
                        type="text"
                        value={fac.title}
                        onChange={(e) => {
                          const updated = [...(config.facilities?.items || [])];
                          updated[fIdx].title = e.target.value;
                          handleUpdateConfig({
                            ...config,
                            facilities: { ...config.facilities, items: updated },
                          });
                        }}
                        className="w-full px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">ইংরেজি নাম</label>
                      <input
                        type="text"
                        value={fac.titleEn || ''}
                        onChange={(e) => {
                          const updated = [...(config.facilities?.items || [])];
                          updated[fIdx].titleEn = e.target.value;
                          handleUpdateConfig({
                            ...config,
                            facilities: { ...config.facilities, items: updated },
                          });
                        }}
                        className="w-full px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium font-en"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-0.5">বিবরণ</label>
                    <textarea
                      rows={2}
                      value={fac.description}
                      onChange={(e) => {
                        const updated = [...(config.facilities?.items || [])];
                        updated[fIdx].description = e.target.value;
                        handleUpdateConfig({
                          ...config,
                          facilities: { ...config.facilities, items: updated },
                        });
                      }}
                      className="w-full px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">আইকন</label>
                      <select
                        value={fac.icon || 'Monitor'}
                        onChange={(e) => {
                          const updated = [...(config.facilities?.items || [])];
                          updated[fIdx].icon = e.target.value;
                          handleUpdateConfig({
                            ...config,
                            facilities: { ...config.facilities, items: updated },
                          });
                        }}
                        className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold"
                      >
                        <option value="Monitor">Monitor (ল্যাব)</option>
                        <option value="FlaskConical">Flask (বিজ্ঞানাগার)</option>
                        <option value="BookOpen">Book (লাইব্রেরি)</option>
                        <option value="Trophy">Trophy (মাঠ)</option>
                        <option value="Compass">Compass (স্কাউট)</option>
                        <option value="Droplet">Droplet (পানি)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">কালার</label>
                      <select
                        value={fac.color || 'indigo'}
                        onChange={(e) => {
                          const updated = [...(config.facilities?.items || [])];
                          updated[fIdx].color = e.target.value;
                          handleUpdateConfig({
                            ...config,
                            facilities: { ...config.facilities, items: updated },
                          });
                        }}
                        className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold"
                      >
                        <option value="indigo">Indigo</option>
                        <option value="emerald">Emerald</option>
                        <option value="amber">Amber</option>
                        <option value="rose">Rose</option>
                        <option value="cyan">Cyan</option>
                        <option value="blue">Blue</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">ব্যাজ</label>
                      <input
                        type="text"
                        value={fac.badge || ''}
                        onChange={(e) => {
                          const updated = [...(config.facilities?.items || [])];
                          updated[fIdx].badge = e.target.value;
                          handleUpdateConfig({
                            ...config,
                            facilities: { ...config.facilities, items: updated },
                          });
                        }}
                        className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 7: STATISTICS (পরিসংখ্যান)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">ছাত্র/ছাত্রীদের পরিসংখ্যান ও কাউন্টার সেটিংস</h2>
                <p className="text-xs text-slate-500">শ্রেণিভিত্তিক ছাত্র-ছাত্রীদের সংখ্যা ও লাইভ কাউন্টার অ্যানিমেশন পরিবর্তন করুন।</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.stats.animatedCounter}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      stats: { ...config.stats, animatedCounter: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-xs font-black">কাউন্টার অ্যানিমেশন (০ থেকে কাউন্ট হওয়া)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  সেকশন শিরোনাম
                </label>
                <input
                  type="text"
                  value={config.stats.title}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      stats: { ...config.stats, title: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  placeholder="যেমন: পরিসংখ্যানে বরইতলী উচ্চ বিদ্যালয়"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  উপ-শিরোনাম / বিবরণ
                </label>
                <input
                  type="text"
                  value={config.stats.subtitle || ''}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      stats: { ...config.stats, subtitle: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none"
                  placeholder="ঐতিহ্যবাহী বিদ্যাপীঠের গৌরবময় অগ্রযাত্রার খতিয়ান"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  মোট শিক্ষক ও কর্মচারী সংখ্যা
                </label>
                <input
                  type="number"
                  value={config.stats.totalTeachersOverride || 25}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      stats: { ...config.stats, totalTeachersOverride: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  placeholder="যেমন: ২৫"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  গড় পাসের হার
                </label>
                <input
                  type="text"
                  value={config.stats.passingRate}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      stats: { ...config.stats, passingRate: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  placeholder="যেমন: ১০০% বা ৯৮.৫%"
                />
              </div>
            </div>

            {/* Class-wise Counters Grid */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">শ্রেণিভিত্তিক শিক্ষার্থী সংখ্যা</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {config.stats.classStats.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-center"
                  >
                    <input
                      type="text"
                      value={item.className}
                      onChange={(e) => {
                        const updated = [...config.stats.classStats];
                        updated[idx].className = e.target.value;
                        handleUpdateConfig({ ...config, stats: { ...config.stats, classStats: updated } });
                      }}
                      className="w-full text-center px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black"
                    />
                    <div>
                      <span className="text-[10px] text-slate-400 block">ছাত্র/ছাত্রী সংখ্যা</span>
                      <input
                        type="number"
                        value={item.count}
                        onChange={(e) => {
                          const updated = [...config.stats.classStats];
                          updated[idx].count = parseInt(e.target.value) || 0;
                          handleUpdateConfig({ ...config, stats: { ...config.stats, classStats: updated } });
                        }}
                        className="w-full text-center px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-lg font-black text-indigo-600 dark:text-indigo-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 8: BEST STUDENTS / ACHIEVERS (সেরা ছাত্র/ছাত্রী)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'achievers' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">সেরা ছাত্র/ছাত্রী (কৃতী শিক্ষার্থী)</h2>
                <p className="text-xs text-slate-500">গোল ছবি, নাম, শ্রেণি, রোল ও ট্রফি ব্যাজ সংবলিত ৪টি বা ততোধিক কৃতী কার্ড।</p>
              </div>
              <button
                onClick={() => {
                  const newStudent: AchieverStudent = {
                    id: `ach-${Date.now()}`,
                    name: 'নতুন কৃতি শিক্ষার্থী',
                    class: 'দশম শ্রেণি',
                    roll: '০১',
                    year: '২০২৬',
                    gpa: '৫.০০',
                    photo: '',
                    awardBadge: '🏆 গোল্ডেন জিপিএ-৫',
                    visible: true,
                  };
                  handleUpdateConfig({
                    ...config,
                    achievers: {
                      ...config.achievers,
                      students: [...config.achievers.students, newStudent],
                    },
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>শিক্ষার্থী যোগ করুন</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {config.achievers.students.map((st, idx) => (
                <div
                  key={st.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                      #{idx + 1} কৃতী
                    </span>
                    <button
                      onClick={() => {
                        const updated = config.achievers.students.filter((_, i) => i !== idx);
                        handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                      }}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-0.5">শিক্ষার্থীর নাম</label>
                    <input
                      type="text"
                      value={st.name}
                      onChange={(e) => {
                        const updated = [...config.achievers.students];
                        updated[idx].name = e.target.value;
                        handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                      }}
                      className="w-full px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">শ্রেণি</label>
                      <input
                        type="text"
                        value={st.class}
                        onChange={(e) => {
                          const updated = [...config.achievers.students];
                          updated[idx].class = e.target.value;
                          handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                        }}
                        className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">রোল নং</label>
                      <input
                        type="text"
                        value={st.roll}
                        onChange={(e) => {
                          const updated = [...config.achievers.students];
                          updated[idx].roll = e.target.value;
                          handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                        }}
                        className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-0.5">ট্রফি / সম্মাননা ব্যাজ</label>
                    <input
                      type="text"
                      value={st.awardBadge}
                      onChange={(e) => {
                        const updated = [...config.achievers.students];
                        updated[idx].awardBadge = e.target.value;
                        handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                      }}
                      className="w-full px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-amber-600 dark:text-amber-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 9: BLOG & NEWS (সংবাদ ও ব্লগ)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'blog' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">সংবাদ ও ব্লগ পোস্টসমূহ</h2>
                <p className="text-xs text-slate-500">ছবি, পোস্টকারী (Admin), তারিখ, বাংলা শিরোনাম ও সারাংশ সংবলিত পোস্টসমূহ।</p>
              </div>
              <button
                onClick={() => {
                  const newPost: BlogPostItem = {
                    id: `post-${Date.now()}`,
                    title: 'নতুন সংবাদ প্রতিবেদন শিরোনাম',
                    date: '২১ অক্টোবর ২০২৬',
                    author: 'Admin',
                    summary: 'সংবাদের সারসংক্ষেপ এখানে লিখুন...',
                    imageUrl: '/school-campus.jpg',
                    link: '#',
                    visible: true,
                  };
                  handleUpdateConfig({
                    ...config,
                    blog: {
                      ...config.blog,
                      posts: [...config.blog.posts, newPost],
                    },
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>পোস্ট যোগ করুন</span>
              </button>
            </div>

            <div className="space-y-4">
              {config.blog.posts.map((post, idx) => (
                <div
                  key={post.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">পোস্ট #{idx + 1}</span>
                    <button
                      onClick={() => {
                        const updated = config.blog.posts.filter((_, i) => i !== idx);
                        handleUpdateConfig({ ...config, blog: { ...config.blog, posts: updated } });
                      }}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">বাংলা শিরোনাম</label>
                      <input
                        type="text"
                        value={post.title}
                        onChange={(e) => {
                          const updated = [...config.blog.posts];
                          updated[idx].title = e.target.value;
                          handleUpdateConfig({ ...config, blog: { ...config.blog, posts: updated } });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">প্রকাশের তারিখ</label>
                      <input
                        type="text"
                        value={post.date}
                        onChange={(e) => {
                          const updated = [...config.blog.posts];
                          updated[idx].date = e.target.value;
                          handleUpdateConfig({ ...config, blog: { ...config.blog, posts: updated } });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-0.5">সংক্ষিপ্ত সারাংশ (২-৩ লাইন)</label>
                    <textarea
                      rows={2}
                      value={post.summary}
                      onChange={(e) => {
                        const updated = [...config.blog.posts];
                        updated[idx].summary = e.target.value;
                        handleUpdateConfig({ ...config, blog: { ...config.blog, posts: updated } });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 10: FAQ (প্রশ্নোত্তর)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">সাধারণ প্রশ্নোত্তর (FAQ)</h2>
                <p className="text-xs text-slate-500">ভর্তি, ফি ও স্কুল সম্পর্কিত সচরাচর জিজ্ঞাসিত প্রশ্ন ও উত্তর।</p>
              </div>
              <button
                onClick={() => {
                  const newFaq: FAQItem = {
                    id: `faq-${Date.now()}`,
                    question: 'নতুন প্রশ্ন লিখুন?',
                    answer: 'প্রশ্নের উত্তর এখানে লিখুন।',
                    visible: true,
                  };
                  handleUpdateConfig({
                    ...config,
                    faq: {
                      ...config.faq,
                      items: [...config.faq.items, newFaq],
                    },
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>প্রশ্ন যোগ করুন</span>
              </button>
            </div>

            <div className="space-y-3">
              {config.faq.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">প্রশ্ন #{idx + 1}</span>
                    <button
                      onClick={() => {
                        const updated = config.faq.items.filter((_, i) => i !== idx);
                        handleUpdateConfig({ ...config, faq: { ...config.faq, items: updated } });
                      }}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => {
                        const updated = [...config.faq.items];
                        updated[idx].question = e.target.value;
                        handleUpdateConfig({ ...config, faq: { ...config.faq, items: updated } });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                      placeholder="প্রশ্ন"
                    />
                  </div>
                  <div>
                    <textarea
                      rows={2}
                      value={item.answer}
                      onChange={(e) => {
                        const updated = [...config.faq.items];
                        updated[idx].answer = e.target.value;
                        handleUpdateConfig({ ...config, faq: { ...config.faq, items: updated } });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                      placeholder="উত্তর"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 11: MEDIA LIBRARY (ছবি ও মিডিয়া লাইব্রেরি)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">ছবি ও মিডিয়া লাইব্রেরি</h2>
                <p className="text-xs text-slate-500">ওয়েবসাইটের লোগো, ব্যানার ও বিভিন্ন সেকশনের ছবি আপলোড ও পরিচালনা করুন।</p>
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>নতুন ছবি আপলোড করুন</span>
                </button>
              </div>
            </div>

            {/* Filter by category */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {['all', 'logo', 'banner', 'student', 'gallery', 'other'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setMediaCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize ${
                    mediaCategoryFilter === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {cat === 'all' ? 'সকল ছবি' : cat}
                </button>
              ))}
            </div>

            {/* Media Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {mediaList
                .filter(m => mediaCategoryFilter === 'all' || m.category === mediaCategoryFilter)
                .map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 p-2 space-y-2"
                  >
                    <div className="w-full aspect-square rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.altText}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                      <span className="text-[10px] text-slate-400 block">{(item.size / 1024).toFixed(0)} KB</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(item.url);
                          showToast('ছবির লিংক কপি করা হয়েছে', 'info');
                        }}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        URL কপি
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`আপনি কি "${item.name}" মুছে ফেলতে চান?`)) {
                            landingPageService.deleteMediaItem(item.id);
                            setMediaList(landingPageService.getMediaList());
                            showToast('ছবি মুছে ফেলা হয়েছে', 'info');
                          }
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1"
                        title="মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 12: THEME & TOKENS (রং, ফন্ট ও থিম)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">রং, ফন্ট ও ভিজ্যুয়াল ডিজাইন টোকেন</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Primary Color */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  প্রাইমারি কালার (Primary Brand Color)
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.theme.primaryColor}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        theme: { ...config.theme, primaryColor: e.target.value },
                      })
                    }
                    className="w-12 h-10 p-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.theme.primaryColor}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        theme: { ...config.theme, primaryColor: e.target.value },
                      })
                    }
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono outline-none"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  সেকেন্ডারি কালার (Secondary Accent)
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.theme.secondaryColor}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        theme: { ...config.theme, secondaryColor: e.target.value },
                      })
                    }
                    className="w-12 h-10 p-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.theme.secondaryColor}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        theme: { ...config.theme, secondaryColor: e.target.value },
                      })
                    }
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono outline-none"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  অ্যাকসেন্ট হাইলাইট কালার
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.theme.accentColor}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        theme: { ...config.theme, accentColor: e.target.value },
                      })
                    }
                    className="w-12 h-10 p-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.theme.accentColor}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        theme: { ...config.theme, accentColor: e.target.value },
                      })
                    }
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              {/* Font Family */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  বাংলা ফন্ট ফ্যামিলি (Font Family)
                </label>
                <select
                  value={config.theme.fontFamily}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      theme: { ...config.theme, fontFamily: e.target.value as any },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                >
                  <option value="SolaimanLipi">SolaimanLipi (ডিফল্ট ক্লাসিক বাংলা)</option>
                  <option value="Hind Siliguri">Hind Siliguri (আধুনিক ও পরিচ্ছন্ন)</option>
                  <option value="Noto Sans Bengali">Noto Sans Bengali (Google Standard)</option>
                  <option value="Inter">Inter (ইন্টারন্যাশনাল)</option>
                </select>
              </div>

              {/* Border Radius */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  কার্ড ও বাটনের বর্ডার রেডিয়াস (গোলত্ব)
                </label>
                <select
                  value={config.theme.borderRadius}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      theme: { ...config.theme, borderRadius: e.target.value as any },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                >
                  <option value="none">সোজা কোণা (Sharp 0px)</option>
                  <option value="md">মাঝারি গোল (Medium 8px)</option>
                  <option value="lg">সুন্দর গোল (Large 12px)</option>
                  <option value="xl">অতিরিক্ত গোল (Extra Rounded 16px)</option>
                  <option value="full">সম্পূর্ণ পিল বা ক্যাপসুল (Full Pill)</option>
                </select>
              </div>

              {/* Dark Mode */}
              <div className="flex flex-col justify-center">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                  ডার্ক মোড সমর্থন
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.theme.darkMode}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        theme: { ...config.theme, darkMode: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm font-bold">ব্যবহারকারী চাইলে ডার্ক মোড অন করতে পারবে</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 13: CONTACT & FOOTER (যোগাযোগ ও ফুটার)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'footer' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">৪-কলাম প্রাতিষ্ঠানিক ফুটার ও যোগাযোগ সেটিংস</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Address */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  বিদ্যালয়ের সম্পূর্ণ ডাক ঠিকানা
                </label>
                <textarea
                  rows={2}
                  value={config.footer.address}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      footer: { ...config.footer, address: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none"
                />
              </div>

              {/* Copyright Text */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  কপিরাইট বার টেক্সট
                </label>
                <input
                  type="text"
                  value={config.footer.copyrightText}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      footer: { ...config.footer, copyrightText: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                />
              </div>
            </div>

            {/* Phones & Emails */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ফোন নম্বর ১</label>
                <input
                  type="text"
                  value={config.footer.phone1}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      footer: { ...config.footer, phone1: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ফোন নম্বর ২</label>
                <input
                  type="text"
                  value={config.footer.phone2}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      footer: { ...config.footer, phone2: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ইমেইল ১</label>
                <input
                  type="text"
                  value={config.footer.email1}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      footer: { ...config.footer, email1: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ইমেইল ২</label>
                <input
                  type="text"
                  value={config.footer.email2}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      footer: { ...config.footer, email2: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
            </div>

            {/* Column 4: Institutional Codes & Social Links */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">কলাম ৪: প্রাতিষ্ঠানিক কোড ও সোশ্যাল আইকন</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">EIIN নম্বর</label>
                  <input
                    type="text"
                    value={config.footer.eiin}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        footer: { ...config.footer, eiin: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">স্কুল কোড</label>
                  <input
                    type="text"
                    value={config.footer.schoolCode}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        footer: { ...config.footer, schoolCode: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">ফেসবুক পেজ লিংক</label>
                  <input
                    type="text"
                    value={config.footer.socialLinks.facebook}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        footer: {
                          ...config.footer,
                          socialLinks: { ...config.footer.socialLinks, facebook: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 14: SEO & SOCIAL SHARING (SEO ও সোশ্যাল মিডিয়া)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'seo' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">সার্চ ইঞ্জিন অপটিমাইজেশন (SEO) ও সোশ্যাল শেয়ার</h2>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                মেটা টাইটেল (Meta Title)
              </label>
              <input
                type="text"
                value={config.seo.metaTitle}
                onChange={(e) =>
                  handleUpdateConfig({
                    ...config,
                    seo: { ...config.seo, metaTitle: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                মেটা ডেসক্রিপশন (Meta Description)
              </label>
              <textarea
                rows={3}
                value={config.seo.metaDescription}
                onChange={(e) =>
                  handleUpdateConfig({
                    ...config,
                    seo: { ...config.seo, metaDescription: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                কীওয়ার্ডসমূহ (Keywords, কমা দিয়ে আলাদা করুন)
              </label>
              <input
                type="text"
                value={config.seo.metaKeywords}
                onChange={(e) =>
                  handleUpdateConfig({
                    ...config,
                    seo: { ...config.seo, metaKeywords: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 15: VERSION HISTORY & RESTORE (সংস্করণ ইতিহাস ও রিস্টোর)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">পূর্ববর্তী সংস্করণ ও অডিট ইতিহাস</h2>
            <p className="text-xs text-slate-500">যেকোনো ভুল সংশোধনের জন্য পূর্বের প্রকাশিত সংস্করণে এক ক্লিকে ফিরে যান।</p>

            <div className="space-y-3">
              {versions.map((ver) => (
                <div
                  key={ver.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-sm shrink-0">
                      V{ver.version}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">{ver.summary}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span>প্রকাশক: {ver.author}</span>
                        <span>•</span>
                        <span>{new Date(ver.timestamp).toLocaleString('bn-BD')}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRestoreVersion(ver)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white text-xs font-black transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>এই সংস্করণ রিস্টোর করুন</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── PUBLISH MODAL ─── */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">লাইভ প্রকাশ নিশ্চিতকরণ</h3>
              </div>
              <button onClick={() => setShowPublishModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              আপনার খসড়ায় করা সমস্ত পরিবর্তন <strong>লাইভ হোমপেজে</strong> প্রকাশিত হবে এবং একটি নতুন ভার্সন স্ন্যাপশট তৈরি হবে।
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">পরিবর্তনের সংক্ষিপ্ত বিবরণ (নোট)</label>
              <input
                type="text"
                value={publishSummary}
                onChange={(e) => setPublishSummary(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                placeholder="যেমন: ভর্তি নোটিশ ও হিরো টাইটেল আপডেট"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                বাতিল
              </button>
              <button
                onClick={handlePublishLive}
                disabled={isPublishing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-md shadow-emerald-600/30 flex items-center gap-2"
              >
                {isPublishing ? 'প্রকাশ হচ্ছে...' : 'হ্যাঁ, লাইভ প্রকাশ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── LIVE PREVIEW MODAL ─── */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-sm animate-in fade-in">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-white shrink-0">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-indigo-400" />
              <span className="font-extrabold text-sm">লাইভ ইন্টারেক্টিভ প্রিভিউ</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                খসড়া ভিউ
              </span>
            </div>

            {/* Viewport switcher */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setPreviewViewport('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  previewViewport === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>ডেস্কটপ (1280px)</span>
              </button>
              <button
                onClick={() => setPreviewViewport('tablet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  previewViewport === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>ট্যাবলেট (768px)</span>
              </button>
              <button
                onClick={() => setPreviewViewport('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  previewViewport === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>মোবাইল (375px)</span>
              </button>
            </div>

            <button
              onClick={() => setShowPreviewModal(false)}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preview Container */}
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
            <div
              className={`h-full bg-white dark:bg-slate-950 rounded-2xl shadow-2xl overflow-y-auto transition-all duration-300 border border-slate-700 ${
                previewViewport === 'desktop'
                  ? 'w-full max-w-[1280px]'
                  : previewViewport === 'tablet'
                  ? 'w-[768px]'
                  : 'w-[375px]'
              }`}
            >
              <iframe
                src="/"
                title="Live Preview"
                className="w-full h-full min-h-[800px] border-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── HELP & GUIDED TOUR MODAL ─── */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">নতুন ব্যবহারকারী নির্দেশিকা</h3>
              </div>
              <button onClick={() => setShowHelpModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
              <p>
                <strong>১. সেকশন সাজানো:</strong> “সেকশন ম্যানেজার” ট্যাবে গিয়ে যেকোনো সেকশন উপরে বা নিচে সরাতে পারেন অথবা বন্ধ/চালু করতে পারেন।
              </p>
              <p>
                <strong>২. ছবি আপলোড:</strong> “ছবি ও মিডিয়া” ট্যাবে গিয়ে যেকোনো ব্যানার বা ছবি আপলোড করুন এবং স্বয়ংক্রিয় URL কপি করে নিন।
              </p>
              <p>
                <strong>৩. খসড়া ও প্রকাশ:</strong> আপনি যখনই কোনো পরিবর্তন করবেন, তা নিরাপদ খসড়ায় সংরক্ষিত থাকবে। “লাইভ প্রিভিউ” দেখে সন্তুষ্ট হলে “প্রকাশ করুন” বাটনে চাপুন।
              </p>
              <p>
                <strong>৪. আগের অবস্থায় ফিরে যাওয়া:</strong> কোনো ভুল হলে “সংস্করণ ইতিহাস” থেকে পূর্বের যেকোনো তারিখের সংস্করণ এক ক্লিকে রিস্টোর করা যায়।
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-black text-xs hover:bg-indigo-700 transition"
              >
                বুঝেছি, ধন্যবাদ!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
