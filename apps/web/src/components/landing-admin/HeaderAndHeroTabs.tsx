'use client';

import React, { useState, useRef } from 'react';
import {
  Award,
  School,
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
  Sparkles,
  Camera,
  MoveUp,
  MoveDown,
} from 'lucide-react';
import { HeroConfig, NavMenuItem } from '@/services/landingPageService';
import { settingsService } from '@/services/settingsService';
import { ActiveTab, BaseLandingTabProps } from './landingAdminShared';

interface LandingHeaderTabProps extends BaseLandingTabProps {
  logoFileInputRef: React.RefObject<HTMLInputElement | null>;
  setMediaCategoryFilter: (cat: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export function LandingHeaderTab({
  config,
  handleUpdateConfig,
  logoFileInputRef,
  setMediaCategoryFilter,
  setActiveTab,
}: LandingHeaderTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">হেডার ও ব্র্যান্ডিং সেটিংস</h2>

        {/* Image Dimension Guidelines Banner for Header */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm font-black text-sm">
              📐
            </div>
            <div>
              <h4 className="text-xs font-black text-blue-900 dark:text-blue-200">
                ছবি সাইজ ও ডাইমেনশন নির্দেশিকা — হেডার ও লোগো
              </h4>
              <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5">
                <span className="font-bold">• অফিসিয়াল লোগো ডাইমেনশন:</span> ৩০০ × ৩০০ px (১:১ স্কয়ার বা ব্যাকগ্রাউন্ড ট্রান্সপারেন্ট PNG/SVG), সর্বোচ্চ ২০-৪০ KB।
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 text-[10px] font-black shrink-0 border border-blue-300 dark:border-blue-700">
            ১:১ স্কয়ার (PNG/SVG)
          </span>
        </div>

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
            <span className="text-[11px] text-slate-400 mt-1 block">
              এটি হেডারের লোগোর পাশে এবং ব্রাউজার ট্যাবে প্রদর্শিত হবে।
            </span>
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

          {/* School Logo Section with Live Preview & Direct Upload */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                বিদ্যালয়ের অফিসিয়াল লোগো
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={config.header.showLogo}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      header: { ...config.header, showLogo: e.target.checked },
                    })
                  }
                  className="w-3.5 h-3.5 text-indigo-600 rounded"
                />
                <span>হেডারে লোগো দেখান</span>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 p-1.5 shadow-sm flex items-center justify-center shrink-0 group">
                {config.header.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={config.header.logoUrl}
                    alt="School Logo"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <School className="w-8 h-8 text-slate-400" />
                )}
              </div>

              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>ডিভাইস থেকে লোগো আপলোড করুন</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaCategoryFilter('logo');
                      setActiveTab('media');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>মিডিয়া লাইব্রেরি থেকে বাছুন</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.header.logoUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleUpdateConfig({
                        ...config,
                        header: { ...config.header, logoUrl: val },
                        seo: { ...config.seo, favicon: val || config.seo?.favicon },
                      });
                      try {
                        settingsService.updateSettings({ schoolLogo: val });
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="অথবা লোগোর সরাসরি URL পেস্ট করুন (/logo.png বা ডাটা URL)"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  * এই লোগোটি স্বয়ংক্রিয়ভাবে ওয়েবসাইটের হেডার, ব্রাউজার ফেভিকন এবং সকল রিপোর্ট ও প্রত্যয়নপত্রে ব্যবহৃত হবে।
                </p>
              </div>
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
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                স্টিকি হেডার (স্ক্রল করলেও উপরে আটকে থাকবে)
              </span>
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
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                টপ নোটিশ স্ক্রলার (জরুরি ঘোষণা বার) প্রদর্শন করুন
              </span>
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
  );
}

interface LandingHeroTabProps extends BaseLandingTabProps {
  handleAddHeroSlide: (fileOrUrl: File | string, title?: string, subtitle?: string) => Promise<void>;
  handleDeleteHeroSlide: (slideId: string) => void;
  handleMoveHeroSlide: (index: number, direction: 'up' | 'down') => void;
  handleReplaceHeroSlideImage: (slideId: string, file: File) => Promise<void>;
  handleClearDemoHeroSlides: () => Promise<void>;
}

export function LandingHeroTab({
  config,
  handleUpdateConfig,
  handleAddHeroSlide,
  handleDeleteHeroSlide,
  handleMoveHeroSlide,
  handleReplaceHeroSlideImage,
  handleClearDemoHeroSlides,
}: LandingHeroTabProps) {
  const [slideUrlInput, setSlideUrlInput] = useState<string>('');
  const [replacingSlideId, setReplacingSlideId] = useState<string | null>(null);
  const heroSlideFileInputRef = useRef<HTMLInputElement>(null);
  const replaceSlideFileInputRef = useRef<HTMLInputElement>(null);

  return (
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

        {/* Image Dimension Guidelines Banner for Hero */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm font-black text-sm">
              📐
            </div>
            <div>
              <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                ছবি সাইজ ও ডাইমেনশন নির্দেশিকা — ব্যানার ও হিরো স্লাইডার
              </h4>
              <p className="text-[11px] text-indigo-800 dark:text-indigo-300 mt-0.5">
                <span className="font-bold">• ব্যানার ও স্লাইড ডাইমেনশন:</span> ১২০০ × ৬৭৫ px অথবা ১০০০ × ৫৬০ px (১৬:৯ ওয়াইডস্ক্রিন অনুপাত), সর্বোচ্চ ৩৫-৫০ KB (স্বয়ংক্রিয় কম্প্রেসড)।
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[10px] font-black shrink-0 border border-indigo-300 dark:border-indigo-800">
            ১৬:৯ ল্যান্ডস্কেপ
          </span>
        </div>

        {/* 1. CAMPUS BANNER & TRANSITION SLIDES */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-900 border-2 border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  হোমপেজ ব্যানার ও ট্রানজিশন স্লাইডার ছবিসমূহ
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                  {(config.hero.slides || []).length} টি স্লাইড সক্রিয়
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                হোমপেজের মূল ব্যানারে যে ছবিগুলো স্বয়ংক্রিয়ভাবে ট্রানজিশন (পরিবর্তন) হয় সেগুলো এখান থেকে সহজে আপলোড, পরিবর্তন, সাজানো বা মুছে ফেলা যাবে।
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => heroSlideFileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ব্যানার ছবি যোগ করুন</span>
              </button>
              <input
                type="file"
                ref={heroSlideFileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleAddHeroSlide(file);
                    e.target.value = '';
                  }
                }}
                accept="image/*"
                className="hidden"
              />
              <input
                type="file"
                ref={replaceSlideFileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && replacingSlideId) {
                    handleReplaceHeroSlideImage(replacingSlideId, file);
                    setReplacingSlideId(null);
                    e.target.value = '';
                  }
                }}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Slider Settings Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={config.hero.enableSlider !== false}
                onChange={(e) =>
                  handleUpdateConfig({
                    ...config,
                    hero: { ...config.hero, enableSlider: e.target.checked },
                  })
                }
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span>স্বয়ংক্রিয় স্লাইডার চালু রাখুন</span>
            </label>

            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span>ছবির ওপর ডার্ক ওভারলে:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black">
                  {config.hero.bgOverlayOpacity ?? 45}%
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="80"
                step="5"
                value={config.hero.bgOverlayOpacity ?? 45}
                onChange={(e) =>
                  handleUpdateConfig({
                    ...config,
                    hero: { ...config.hero, bgOverlayOpacity: parseInt(e.target.value) || 45 },
                  })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleClearDemoHeroSlides}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>সকল ডেমো স্টক স্লাইড মুছে ফেলুন</span>
              </button>
            </div>
          </div>

          {/* URL Quick Add Option */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={slideUrlInput}
              onChange={(e) => setSlideUrlInput(e.target.value)}
              placeholder="অথবা সরাসরি কোনো ছবির অনলাইন লিঙ্ক পেস্ট করুন..."
              className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium outline-none focus:border-indigo-500 w-full"
            />
            <button
              type="button"
              disabled={!slideUrlInput.trim()}
              onClick={() => {
                if (slideUrlInput.trim()) {
                  handleAddHeroSlide(slideUrlInput.trim());
                  setSlideUrlInput('');
                }
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 transition cursor-pointer shrink-0 w-full sm:w-auto"
            >
              লিঙ্ক থেকে স্লাইড যোগ করুন
            </button>
          </div>

          {/* Active Slides Cards Grid */}
          <div className="space-y-3">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
              বর্তমান স্লাইড তালিকা (ট্রানজিশনের ক্রম অনুযায়ী প্রদর্শিত হবে):
            </span>

            {!config.hero.slides || config.hero.slides.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-3">
                <ImageIcon className="w-10 h-10 text-indigo-400 mx-auto" />
                <div>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                    এখনো কোনো কাস্টম স্লাইড যোগ করা হয়নি
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    আপনার প্রতিষ্ঠানের ক্যাম্পাস, ভবন, অ্যাসেম্বলি বা অনুষ্ঠানের ছবি আপলোড করতে ওপরের &quot;নতুন ব্যানার ছবি যোগ করুন&quot; বাটনে ক্লিক করুন।
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {config.hero.slides.map((slide, idx) => (
                  <div
                    key={slide.id || idx}
                    className="group relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                  >
                    {/* Slide Preview Image */}
                    <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slide.imageUrl}
                        alt={slide.title || `Slide ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-black border border-white/20">
                        স্লাইড #{idx + 1}
                      </div>
                      <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setReplacingSlideId(slide.id);
                            replaceSlideFileInputRef.current?.click();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/90 backdrop-blur-md text-white text-[10.5px] font-bold border border-white/20 flex items-center gap-1 transition cursor-pointer"
                          title="ছবি পরিবর্তন করুন"
                        >
                          <Camera className="w-3 h-3 text-amber-400" />
                          <span>ছবি পরিবর্তন</span>
                        </button>
                      </div>
                    </div>

                    {/* Slide Details */}
                    <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={slide.title || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = (config.hero.slides || []).map((s, i) =>
                              i === idx ? { ...s, title: val } : s
                            );
                            handleUpdateConfig({
                              ...config,
                              hero: { ...config.hero, slides: updated },
                            });
                          }}
                          placeholder="স্লাইড শিরোনাম"
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold bg-slate-50 dark:bg-slate-900 focus:bg-white outline-none"
                        />
                        <input
                          type="text"
                          value={slide.subtitle || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = (config.hero.slides || []).map((s, i) =>
                              i === idx ? { ...s, subtitle: val } : s
                            );
                            handleUpdateConfig({
                              ...config,
                              hero: { ...config.hero, slides: updated },
                            });
                          }}
                          placeholder="উপশিরোনাম / বিবরণী..."
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-medium bg-slate-50 dark:bg-slate-900 focus:bg-white outline-none"
                        />
                      </div>

                      {/* Reorder and Delete Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveHeroSlide(idx, 'up')}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer text-slate-600 dark:text-slate-300"
                            title="আগে নিন"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === config.hero.slides.length - 1}
                            onClick={() => handleMoveHeroSlide(idx, 'down')}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer text-slate-600 dark:text-slate-300"
                            title="পরে নিন"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteHeroSlide(slide.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition"
                          title="স্লাইড মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
              প্রধান শিরোনাম
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

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
              হিরো ব্যাকগ্রাউন্ডের ধরন
            </label>
            <select
              value={config.hero.bgType}
              onChange={(e) =>
                handleUpdateConfig({
                  ...config,
                  hero: { ...config.hero, bgType: e.target.value as HeroConfig['bgType'] },
                })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="gradient">আধুনিক ডার্ক গ্রেডিয়েন্ট</option>
              <option value="image">ক্যাম্পাস ব্যাকগ্রাউন্ড ছবি</option>
              <option value="solid">এক রঙের ব্যাকগ্রাউন্ড</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">সংক্ষিপ্ত বিবরণ</label>
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
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">অ্যাকশন বাটনসমূহ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary CTA */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase">প্রধান বাটন</span>
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
                <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase">দ্বিতীয় বাটন</span>
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
  );
}
