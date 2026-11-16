'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  Compass,
  Droplet,
  ExternalLink,
  Eye,
  EyeOff,
  FlaskConical,
  Laptop,
  Microscope,
  Monitor,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  Sliders,
  Trash2,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { FacilitiesConfig, FacilityItem, landingPageService } from '@/services/landingPageService';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';
import { SettingsCard } from './settingsShared';

function FacilityIcon({ name }: { name?: string }) {
  switch (name) {
    case 'Monitor':
      return <Monitor className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    case 'FlaskConical':
      return <FlaskConical className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    case 'BookOpen':
      return <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    case 'Trophy':
      return <Trophy className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
    case 'Compass':
      return <Compass className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />;
    case 'Droplet':
      return <Droplet className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    case 'Microscope':
      return <Microscope className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    case 'Laptop':
      return <Laptop className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    case 'Users':
      return <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />;
    case 'Award':
      return <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    case 'ShieldCheck':
      return <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    default:
      return <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
  }
}

export function FacilitiesSettingsTab() {
  const [facilitiesConfig, setFacilitiesConfig] = useState<FacilitiesConfig>(() =>
    landingPageService.getFacilitiesConfig()
  );
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<FacilityItem | null>(null);
  const [facilityAlert, setFacilityAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [facilitySearchQuery, setFacilitySearchQuery] = useState('');
  const [facilityForm, setFacilityForm] = useState<Partial<FacilityItem>>({
    title: '',
    titleEn: '',
    description: '',
    icon: 'Monitor',
    badge: '',
    color: 'indigo',
    visible: true,
  });

  useEffect(() => {
    const unsub = landingPageService.subscribePublished((cfg) => {
      if (cfg.facilities) {
        setFacilitiesConfig(cfg.facilities);
      }
    });
    return () => unsub();
  }, []);

  const handleOpenAddFacility = () => {
    setEditingFacility(null);
    setFacilityForm({
      title: '',
      titleEn: '',
      description: '',
      icon: 'Monitor',
      badge: '',
      color: 'indigo',
      visible: true,
    });
    setIsFacilityModalOpen(true);
  };

  const handleOpenEditFacility = (item: FacilityItem) => {
    setEditingFacility(item);
    setFacilityForm({ ...item });
    setIsFacilityModalOpen(true);
  };

  const handleSaveFacilityItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!facilityForm.title?.trim()) {
      showToast('অনুগ্রহ করে সুবিধার বাংলা শিরোনাম লিখুন!', 'warning');
      return;
    }
    if (!facilityForm.description?.trim()) {
      showToast('অনুগ্রহ করে সুবিধার সংক্ষিপ্ত বিবরণী লিখুন!', 'warning');
      return;
    }

    const currentItems = facilitiesConfig.items || [];
    let updatedItems: FacilityItem[];

    if (editingFacility) {
      updatedItems = currentItems.map((item) =>
        item.id === editingFacility.id
          ? {
              ...item,
              title: facilityForm.title!.trim(),
              titleEn: facilityForm.titleEn?.trim() || '',
              description: facilityForm.description!.trim(),
              icon: facilityForm.icon || 'Building2',
              badge: facilityForm.badge?.trim() || '',
              color: facilityForm.color || 'indigo',
              visible: facilityForm.visible !== false,
            }
          : item
      );
    } else {
      const newFacility: FacilityItem = {
        id: `fac-${Date.now()}`,
        title: facilityForm.title!.trim(),
        titleEn: facilityForm.titleEn?.trim() || '',
        description: facilityForm.description!.trim(),
        icon: facilityForm.icon || 'Building2',
        badge: facilityForm.badge?.trim() || '',
        color: facilityForm.color || 'indigo',
        visible: facilityForm.visible !== false,
      };
      updatedItems = [...currentItems, newFacility];
    }

    const newConfig: FacilitiesConfig = { ...facilitiesConfig, items: updatedItems };
    setFacilitiesConfig(newConfig);
    landingPageService.updateFacilities(newConfig, 'প্রধান শিক্ষক / অ্যাডমিন', true);
    setIsFacilityModalOpen(false);
    setFacilityAlert({
      type: 'success',
      message: editingFacility
        ? 'সুবিধার তথ্য সফলভাবে হালনাগাদ ও ওয়েবসাইটে লাইভ করা হয়েছে!'
        : 'নতুন সুবিধা সফলভাবে যুক্ত ও ওয়েবসাইটে লাইভ করা হয়েছে!',
    });
    setTimeout(() => setFacilityAlert(null), 4000);
  };

  const handleDeleteFacility = async (facilityId: string) => {
    const facility = facilitiesConfig.items.find((f) => f.id === facilityId);
    if (!facility) return;
    if (
      await confirmDialog({
        title: 'সুবিধা মুছে ফেলুন',
        message: `আপনি কি নিশ্চিত যে "${facility.title}" সুবিধাটি মুছে ফেলতে চান?`,
        confirmLabel: 'মুছে ফেলুন',
        danger: true,
      })
    ) {
      const updatedItems = facilitiesConfig.items.filter((f) => f.id !== facilityId);
      const newConfig: FacilitiesConfig = { ...facilitiesConfig, items: updatedItems };
      setFacilitiesConfig(newConfig);
      landingPageService.updateFacilities(newConfig, 'প্রধান শিক্ষক / অ্যাডমিন', true);
      setFacilityAlert({
        type: 'success',
        message: 'সুবিধাটি সফলভাবে মুছে ফেলা হয়েছে এবং ওয়েবসাইটে আপডেট হয়েছে।',
      });
      setTimeout(() => setFacilityAlert(null), 3000);
    }
  };

  const handleToggleFacilityVisibility = (facilityId: string) => {
    const updatedItems = facilitiesConfig.items.map((f) =>
      f.id === facilityId ? { ...f, visible: !f.visible } : f
    );
    const newConfig: FacilitiesConfig = { ...facilitiesConfig, items: updatedItems };
    setFacilitiesConfig(newConfig);
    landingPageService.updateFacilities(newConfig, 'প্রধান শিক্ষক / অ্যাডমিন', true);
  };

  const handleMoveFacility = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= facilitiesConfig.items.length) return;
    const items = [...facilitiesConfig.items];
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;
    const newConfig: FacilitiesConfig = { ...facilitiesConfig, items };
    setFacilitiesConfig(newConfig);
    landingPageService.updateFacilities(newConfig, 'প্রধান শিক্ষক / অ্যাডমিন', true);
  };

  const handleToggleFacilitySection = () => {
    const newConfig: FacilitiesConfig = {
      ...facilitiesConfig,
      enabled: !facilitiesConfig.enabled,
    };
    setFacilitiesConfig(newConfig);
    landingPageService.updateFacilities(newConfig, 'প্রধান শিক্ষক / অ্যাডমিন', true);
    setFacilityAlert({
      type: 'success',
      message: newConfig.enabled
        ? 'ক্যাম্পাস সুবিধাসমূহ সেকশন মূল ওয়েবসাইটে সক্রিয় করা হয়েছে।'
        : 'ক্যাম্পাস সুবিধাসমূহ সেকশন মূল ওয়েবসাইটে নিষ্ক্রিয় (লুকায়িত) করা হয়েছে।',
    });
    setTimeout(() => setFacilityAlert(null), 3500);
  };

  const handleSaveFacilityHeader = (eyebrow: string, title: string, subtitle: string) => {
    const newConfig: FacilitiesConfig = { ...facilitiesConfig, eyebrow, title, subtitle };
    setFacilitiesConfig(newConfig);
    landingPageService.updateFacilities(newConfig, 'প্রধান শিক্ষক / অ্যাডমিন', true);
    setFacilityAlert({
      type: 'success',
      message: 'সেকশনের শিরোনাম ও বিবরণী সফলভাবে সংরক্ষিত ও লাইভ হয়েছে!',
    });
    setTimeout(() => setFacilityAlert(null), 3500);
  };

  const handleResetFacilities = async () => {
    if (
      await confirmDialog({
        title: 'ক্যাম্পাস সুবিধা পুনরুদ্ধার',
        message: 'আপনি কি ক্যাম্পাস সুবিধাসমূহ ডিফল্ট ৬টি সুবিধার তালিকায় পুনরুদ্ধার করতে চান? এতে বর্তমান কাস্টমাইজেশন মুছে যাবে।',
        confirmLabel: 'পুনরুদ্ধার করুন',
        danger: true,
      })
    ) {
      const defaultCfg = landingPageService.getFacilitiesConfig();
      setFacilitiesConfig(defaultCfg);
      landingPageService.updateFacilities(defaultCfg, 'প্রধান শিক্ষক / অ্যাডমিন', true);
      setFacilityAlert({
        type: 'success',
        message: 'ক্যাম্পাস সুবিধাসমূহ সফলভাবে ডিফল্ট মানে রিসেট করা হয়েছে।',
      });
      setTimeout(() => setFacilityAlert(null), 4000);
    }
  };

  return (
    <>
      {/* Header Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-teal-700/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-400/30">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>ক্যাম্পাস অবকাঠামো ও সুবিধাসমূহ</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              ক্যাম্পাস সুযোগ-সুবিধা ব্যবস্থাপনা
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed">
              আইসিটি ডিজিটাল ল্যাব, বিজ্ঞানাগার, লাইব্রেরি, খেলার মাঠ, স্কাউটিং ও স্যানিটেশনের মতো সুবিধাসমূহ নিয়ন্ত্রণ করুন। এখানে সংরক্ষিত তথ্য মূল ওয়েবসাইটের <strong>&quot;ক্যাম্পাস সুবিধাসমূহ&quot;</strong> সেকশনে তাৎক্ষণিক প্রদর্শিত হবে।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenAddFacility}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 dark:text-white font-black text-xs shadow-md shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন সুবিধা যোগ করুন</span>
            </button>

            <button
              type="button"
              onClick={handleResetFacilities}
              title="ডিফল্ট ৬টি ক্যাম্পাস সুবিধা রিস্টোর করুন"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 dark:hover:bg-slate-800 text-white font-bold text-xs border border-white/20 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-teal-300" />
              <span className="hidden sm:inline">ডিফল্ট রিস্টোর</span>
            </button>

            <Link
              href="/#facilities"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs border border-teal-600/30 transition-all"
            >
              <span>ওয়েবসাইটে দেখুন</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Alert Feedback Toast */}
      {facilityAlert && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in duration-200 border ${
            facilityAlert.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {facilityAlert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{facilityAlert.message}</span>
          </div>
          <button type="button" onClick={() => setFacilityAlert(null)} className="p-1 hover:bg-black/5 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Section Header Configuration Card */}
      <SettingsCard
        title="সেকশনের শিরোনাম ও প্রদর্শন নিয়ন্ত্রণ"
        subtitle="মূল ওয়েবসাইটে এই সেকশনটির শিরোনাম, উপ-শিরোনাম ও দৃশ্যমানতা নিয়ন্ত্রণ করুন"
        icon={<Sliders className="w-5 h-5" />}
        iconBg="bg-teal-50"
        iconColor="text-teal-600"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">হোমপেজে সেকশন প্রদর্শন</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                সুইচটি বন্ধ রাখলে মূল পাবলিক ওয়েবসাইটে এই সম্পূর্ণ সেকশনটি লুকায়িত থাকবে।
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleFacilitySection}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                facilitiesConfig.enabled ? 'bg-teal-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-slate-900 shadow ring-0 transition duration-200 ease-in-out ${
                  facilitiesConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">আইব্রো ট্যাগ</label>
              <input
                type="text"
                value={facilitiesConfig.eyebrow || ''}
                onChange={(e) => setFacilitiesConfig((prev) => ({ ...prev, eyebrow: e.target.value }))}
                placeholder="যেমন: ক্যাম্পাস অবকাঠামো ও সুবিধাসমূহ"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 outline-none transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">সেকশনের প্রধান শিরোনাম</label>
              <input
                type="text"
                value={facilitiesConfig.title || ''}
                onChange={(e) => setFacilitiesConfig((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="যেমন: শিক্ষার্থীদের সার্বিক বিকাশে আধুনিক সুযোগ-সুবিধা"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 outline-none transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">সেকশনের সাবটাইটেল / বিবরণী</label>
              <textarea
                rows={2}
                value={facilitiesConfig.subtitle || ''}
                onChange={(e) => setFacilitiesConfig((prev) => ({ ...prev, subtitle: e.target.value }))}
                placeholder="সুপরিকল্পিত ও মনোরম ক্যাম্পাস পরিবেশ..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 outline-none transition resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() =>
                handleSaveFacilityHeader(
                  facilitiesConfig.eyebrow || '',
                  facilitiesConfig.title || '',
                  facilitiesConfig.subtitle || ''
                )
              }
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>সেকশন হেডার সংরক্ষণ করুন</span>
            </button>
          </div>
        </div>
      </SettingsCard>

      {/* Facilities List & Search Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-sm">
            {facilitiesConfig.items?.length || 0}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">সুবিধাসমূহের তালিকা ও ক্রম</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              সক্রিয়: {facilitiesConfig.items?.filter((f) => f.visible !== false).length || 0}টি | নিষ্ক্রিয়: {facilitiesConfig.items?.filter((f) => f.visible === false).length || 0}টি
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={facilitySearchQuery}
              onChange={(e) => setFacilitySearchQuery(e.target.value)}
              placeholder="সুবিধা খুঁজুন..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 transition w-44"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenAddFacility}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(facilitiesConfig.items || [])
          .filter((f) =>
            facilitySearchQuery
              ? f.title.toLowerCase().includes(facilitySearchQuery.toLowerCase()) ||
                (f.titleEn && f.titleEn.toLowerCase().includes(facilitySearchQuery.toLowerCase())) ||
                f.description.toLowerCase().includes(facilitySearchQuery.toLowerCase())
              : true
          )
          .map((fac, idx) => (
            <div
              key={fac.id || idx}
              className={`p-5 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between ${
                fac.visible !== false
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md'
                  : 'bg-slate-50/80 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-lg shrink-0">
                      <FacilityIcon name={fac.icon} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{fac.title}</h4>
                        {fac.visible === false && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                            লুকায়িত
                          </span>
                        )}
                      </div>
                      {fac.titleEn && <p className="text-[11px] text-slate-400 font-en font-medium">{fac.titleEn}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveFacility(idx, 'up')}
                      disabled={idx === 0}
                      title="উপরে নিন"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveFacility(idx, 'down')}
                      disabled={idx === (facilitiesConfig.items?.length || 0) - 1}
                      title="নিচে নিন"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleFacilityVisibility(fac.id)}
                      title={fac.visible !== false ? 'হাইড করুন' : 'দৃশ্যমান করুন'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition"
                    >
                      {fac.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditFacility(fac)}
                      title="সম্পাদনা করুন"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFacility(fac.id)}
                      title="মুছে ফেলুন"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">{fac.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono">ID: {fac.id}</span>
                {fac.badge && (
                  <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 font-bold">
                    {fac.badge}
                  </span>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Facility Add/Edit Modal */}
      {isFacilityModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsFacilityModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-50 dark:from-teal-950/50 via-emerald-50 dark:via-emerald-950/30 to-white dark:to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {editingFacility ? 'ক্যাম্পাস সুবিধা সম্পাদনা' : 'নতুন ক্যাম্পাস সুবিধা যোগ'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                    সুবিধার শিরোনাম, বিবরণী, আইকন ও কালার থিম নির্ধারণ করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFacilityModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFacilityItem} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    সুবিধার বাংলা শিরোনাম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={facilityForm.title || ''}
                    onChange={(e) => setFacilityForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="যেমন: শেখ রাসেল ডিজিটাল ল্যাব"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">ইংরেজি নাম</label>
                  <input
                    type="text"
                    value={facilityForm.titleEn || ''}
                    onChange={(e) => setFacilityForm((prev) => ({ ...prev, titleEn: e.target.value }))}
                    placeholder="যেমন: Sheikh Russel Digital Lab"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 outline-none transition font-en"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">হাইলাইট ব্যাজ / ট্যাগ</label>
                  <input
                    type="text"
                    value={facilityForm.badge || ''}
                    onChange={(e) => setFacilityForm((prev) => ({ ...prev, badge: e.target.value }))}
                    placeholder="যেমন: আইসিটি ও কোডিং"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">আইকন প্রতীক</label>
                  <select
                    value={facilityForm.icon || 'Monitor'}
                    onChange={(e) => setFacilityForm((prev) => ({ ...prev, icon: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 outline-none transition cursor-pointer"
                  >
                    <option value="Monitor">🖥️ কম্পিউটার / ডিজিটাল ল্যাব</option>
                    <option value="FlaskConical">🧪 বিজ্ঞানাগার / ল্যাবরেটরি</option>
                    <option value="BookOpen">📖 লাইব্রেরি / পাঠাগার</option>
                    <option value="Trophy">🏆 খেলার মাঠ / ক্রীড়া ট্রফি</option>
                    <option value="Compass">🧭 স্কাউটিং / সহশিক্ষা</option>
                    <option value="Droplet">💧 বিশুদ্ধ পানি ও স্যানিটেশন</option>
                    <option value="Microscope">🔬 মাইক্রোস্কোপ / জীববিজ্ঞান</option>
                    <option value="Laptop">💻 ল্যাপটপ ও আইসিটি</option>
                    <option value="Users">👥 ক্লাব ও সংগঠন</option>
                    <option value="Award">🏅 পুরস্কার ও মেধা অন্বেষণ</option>
                    <option value="ShieldCheck">🛡️ নিরাপত্তা ও সুরক্ষা</option>
                    <option value="Building2">🏫 ক্যাম্পাস ভবন ও অবকাঠামো</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">কালার থিম</label>
                  <select
                    value={facilityForm.color || 'indigo'}
                    onChange={(e) => setFacilityForm((prev) => ({ ...prev, color: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 outline-none transition cursor-pointer"
                  >
                    <option value="indigo">ইন্ডিগো ব্লু</option>
                    <option value="emerald">পান্না সবুজ</option>
                    <option value="amber">সোনালি হলুদ</option>
                    <option value="rose">গোলাপি লাল</option>
                    <option value="cyan">সায়ান নীল</option>
                    <option value="blue">গাঢ় নীল</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    বিস্তারিত বিবরণী <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={facilityForm.description || ''}
                    onChange={(e) => setFacilityForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="সুবিধাটির প্রধান বৈশিষ্ট্য ও সুযোগ-সুবিধা সম্পর্কে ২-৩ লাইনে লিখুন..."
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 outline-none transition resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <input
                      type="checkbox"
                      checked={facilityForm.visible !== false}
                      onChange={(e) => setFacilityForm((prev) => ({ ...prev, visible: e.target.checked }))}
                      className="w-4 h-4 text-teal-600 dark:text-teal-400 rounded"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      এই সুবিধাটি মূল পাবলিক ওয়েবসাইটে সক্রিয় ও দৃশ্যমান রাখুন
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFacilityModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md shadow-teal-600/20 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingFacility ? 'তথ্য হালনাগাদ করুন' : 'সুবিধা সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
