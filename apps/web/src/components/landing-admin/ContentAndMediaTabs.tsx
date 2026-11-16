'use client';

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  School,
  LayoutTemplate,
  Camera,
  GraduationCap,
  Layers,
  Award,
  Check,
  Play,
} from 'lucide-react';
import {
  landingPageService,
  LandingPageConfig,
  BlogPostItem,
  FAQItem,
  MediaItem,
} from '@/services/landingPageService';
import { compressImage } from '@/lib/imageUtils';
import { confirmDialog } from '@/components/ui/ToastProvider';
import { ActiveTab, BaseLandingTabProps, ShowToastFn } from './landingAdminShared';

interface LandingBlogTabProps extends BaseLandingTabProps {
  showToast: ShowToastFn;
  setMediaCategoryFilter: (cat: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export function LandingBlogTab({
  config,
  handleUpdateConfig,
  showToast,
  setMediaCategoryFilter,
  setActiveTab,
}: LandingBlogTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">সংবাদ ও ব্লগ পোস্টসমূহ</h2>
            <p className="text-xs text-slate-500">
              ছবি, পোস্টকারী (Admin), তারিখ, বাংলা শিরোনাম ও সারাংশ সংবলিত পোস্টসমূহ।
            </p>
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

        {/* Image Dimension Guidelines Banner for Blog */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm font-black text-sm">
              📐
            </div>
            <div>
              <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                ছবি সাইজ ও ডাইমেনশন নির্দেশিকা — সংবাদ ও ব্লগ সেকশন
              </h4>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                <span className="font-bold">• সংবাদ ব্যানার/ফিচার ছবি:</span> ৮০০ × ৫০০ px (১৬:১০ অনুপাত) অথবা ৮০০ × ৪৫০ px (১৬:৯ ল্যান্ডস্কেপ), সর্বোচ্চ ৩০-৪৫ KB (স্বয়ংক্রিয় কম্প্রেসড)।
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-[10px] font-black shrink-0 border border-emerald-300 dark:border-emerald-700">
            ১৬:১০ বা ১৬:৯ ল্যান্ডস্কেপ
          </span>
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

              {/* Blog Post Image Uploader & Preview */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:w-36 h-24 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.imageUrl || '/school-campus.jpg'}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    ৮০০ × ৫০০ px
                  </span>
                </div>

                <div className="flex-1 w-full space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>ডিভাইস থেকে ছবি আপলোড</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImage(file, 800, 500, 0.68);
                              const updated = [...config.blog.posts];
                              updated[idx] = { ...updated[idx], imageUrl: compressed };
                              handleUpdateConfig({ ...config, blog: { ...config.blog, posts: updated } });
                              showToast('সংবাদের ছবি সফলভাবে পরিবর্তন হয়েছে', 'success');
                            } catch {
                              showToast('ছবি আপলোড করতে ব্যর্থ হয়েছে', 'error');
                            }
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaCategoryFilter('banner');
                        setActiveTab('media');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>মিডিয়া</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="অনলাইন ছবি লিঙ্ক (URL)"
                      value={post.imageUrl || ''}
                      onChange={(e) => {
                        const updated = [...config.blog.posts];
                        updated[idx] = { ...updated[idx], imageUrl: e.target.value };
                        handleUpdateConfig({ ...config, blog: { ...config.blog, posts: updated } });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>
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
  );
}

export function LandingFaqTab({ config, handleUpdateConfig }: BaseLandingTabProps) {
  return (
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
  );
}

interface LandingMediaTabProps {
  config: LandingPageConfig;
  mediaList: MediaItem[];
  setMediaList: (items: MediaItem[]) => void;
  mediaCategoryFilter: string;
  setMediaCategoryFilter: (cat: string) => void;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  logoFileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFilesBatch: (fileList: FileList | File[], overrideCat?: string) => Promise<void>;
  handleSetAsSchoolLogo: (item: MediaItem) => void;
  handleSetAsHeroBanner: (item: MediaItem) => void;
  handleAddToHeroSlider: (item: MediaItem) => void;
  handleRemoveFromHeroSlider: (imageUrl: string) => void;
  handleAddToGallery: (item: MediaItem) => void;
  handleAddToAchievers: (item: MediaItem) => void;
  handleChangeCategory: (item: MediaItem, newCategory: MediaItem['category']) => void;
  showToast: ShowToastFn;
}

export function LandingMediaTab({
  config,
  mediaList,
  setMediaList,
  mediaCategoryFilter,
  setMediaCategoryFilter,
  isUploading,
  fileInputRef,
  logoFileInputRef,
  handleFilesBatch,
  handleSetAsSchoolLogo,
  handleSetAsHeroBanner,
  handleAddToHeroSlider,
  handleRemoveFromHeroSlider,
  handleAddToGallery,
  handleAddToAchievers,
  handleChangeCategory,
  showToast,
}: LandingMediaTabProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const filteredMedia = mediaList.filter((m) => mediaCategoryFilter === 'all' || m.category === mediaCategoryFilter);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">ছবি ও মিডিয়া লাইব্রেরি</h2>
            <p className="text-xs text-slate-500">
              ওয়েবসাইটের লোগো, ব্যানার ও বিভিন্ন সেকশনের ছবি আপলোড ও পরিচালনা করুন।
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>
                {mediaCategoryFilter === 'banner'
                  ? 'নতুন ব্যানার আপলোড করুন'
                  : mediaCategoryFilter === 'gallery'
                  ? 'গ্যালারি ছবি আপলোড করুন'
                  : mediaCategoryFilter === 'student'
                  ? 'শিক্ষার্থীর ছবি আপলোড করুন'
                  : mediaCategoryFilter === 'logo'
                  ? 'লোগো আপলোড করুন'
                  : 'নতুন ছবি আপলোড করুন'}
              </span>
            </button>
          </div>
        </div>

        {/* Master Image Dimension Guidelines Grid */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-900 border-2 border-indigo-200 dark:border-indigo-900/50 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
              📐
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                সকল সেকশনের ছবি সাইজ ও ডাইমেনশন নির্দেশিকা (Master Image Dimension Guide)
              </h3>
              <p className="text-[11px] text-slate-500">
                ওয়েবসাইটের বিভিন্ন সেকশনে সুন্দর ও দ্রুত লোডিংয়ের জন্য নিচে উল্লেখিত স্ট্যান্ডার্ড সাইজের ছবি ব্যবহারের পরামর্শ দেওয়া হচ্ছে:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 block uppercase">হেডার লোগো</span>
              <div className="text-xs font-black text-slate-800 dark:text-slate-200">৩০০ × ৩০০ px</div>
              <div className="text-[10px] text-slate-500 font-medium">১:১ স্কয়ার (PNG/SVG)</div>
              <span className="inline-block text-[9px] font-bold text-slate-400">২০-৪০ KB</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 block uppercase">
                হিরো ব্যানার
              </span>
              <div className="text-xs font-black text-slate-800 dark:text-slate-200">১২০০ × ৬৭৫ px</div>
              <div className="text-[10px] text-slate-500 font-medium">১৬:৯ ওয়াইডস্ক্রিন</div>
              <span className="inline-block text-[9px] font-bold text-slate-400">৩৫-৫০ KB</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 block uppercase">
                ক্যাম্পাস ফটো
              </span>
              <div className="text-xs font-black text-slate-800 dark:text-slate-200">১০০০ × ৬৫০ px</div>
              <div className="text-[10px] text-slate-500 font-medium">১৬:১০ বা ৪:৩</div>
              <span className="inline-block text-[9px] font-bold text-slate-400">৩৫-৫০ KB</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 block uppercase">
                ফটো গ্যালারি
              </span>
              <div className="text-xs font-black text-slate-800 dark:text-slate-200">৮০০ × ৬০০ px</div>
              <div className="text-[10px] text-slate-500 font-medium">৪:৩ বা ১৬:৯</div>
              <span className="inline-block text-[9px] font-bold text-slate-400">২৫-৪০ KB</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 block uppercase">
                সংবাদ ও ব্লগ
              </span>
              <div className="text-xs font-black text-slate-800 dark:text-slate-200">৮০০ × ৫০০ px</div>
              <div className="text-[10px] text-slate-500 font-medium">১৬:১০ ল্যান্ডস্কেপ</div>
              <span className="inline-block text-[9px] font-bold text-slate-400">৩০-৪৫ KB</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 block uppercase">
                ব্যক্তিগত প্রতিকৃতি
              </span>
              <div className="text-xs font-black text-slate-800 dark:text-slate-200">৩০০ × ৩৮০ px</div>
              <div className="text-[10px] text-slate-500 font-medium">৩:৪ পোর্ট্রেট</div>
              <span className="inline-block text-[9px] font-bold text-slate-400">১৫-২৫ KB</span>
            </div>
          </div>
        </div>

        {/* Dynamic Category Context Banner */}
        {mediaCategoryFilter === 'logo' && (
          <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 dark:from-slate-850 dark:via-indigo-950/40 dark:to-slate-850 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-700 p-1 shadow-md flex items-center justify-center shrink-0">
                {config.header.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={config.header.logoUrl}
                    alt="Current Logo"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <School className="w-7 h-7 text-indigo-500" />
                )}
                <span
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow"
                  title="সক্রিয় লোগো"
                >
                  ✓
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">বিদ্যালয়ের সক্রিয় লোগো</h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    লাইভ সংযুক্ত
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  এই লোগোটি পাবলিক ওয়েবসাইটের হেডার, ব্রাউজার ফেভিকন এবং সকল একাডেমিক নথিতে প্রদর্শিত হয়।
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => logoFileInputRef.current?.click()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>ডিভাইস থেকে নতুন লোগো দিন</span>
              </button>
            </div>
          </div>
        )}

        {mediaCategoryFilter === 'banner' && (
          <div className="bg-gradient-to-r from-amber-50 via-indigo-50 to-sky-50 dark:from-slate-850 dark:via-amber-950/20 dark:to-slate-850 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-14 rounded-xl bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-700 p-0.5 shadow-md overflow-hidden shrink-0">
                {config.hero.bgImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={config.hero.bgImage}
                    alt="Hero Banner"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-amber-100 dark:bg-amber-950 text-amber-600">
                    <LayoutTemplate className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    🖼️ হোমপেজ ব্যানার ও স্লাইডার ছবি
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    {config.hero.slides?.length || 0} টি স্লাইড সক্রিয়
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  এখানে ছবি আপলোড করে এক ক্লিকে মূল হোমপেজ ব্যাকগ্রাউন্ড ব্যানার অথবা স্লাইডারে যুক্ত করতে পারবেন।
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>নতুন ব্যানার আপলোড করুন</span>
              </button>
            </div>
          </div>
        )}

        {mediaCategoryFilter === 'gallery' && (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-slate-850 dark:via-emerald-950/20 dark:to-slate-850 border border-emerald-200/80 dark:border-emerald-900/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                <Camera className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">📸 ক্যাম্পাস ফটো গ্যালারি</h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    {config.gallery?.items?.length || 0} টি ছবি ওয়েবসাইটে লাইভ
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  এখানে যেকোনো ছবি আপলোড করলে তা স্বয়ংক্রিয়ভাবে মূল ওয়েবসাইটের গ্যালারি সেকশনে দৃশ্যমান হবে।
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>গ্যালারির ছবি আপলোড করুন</span>
              </button>
            </div>
          </div>
        )}

        {mediaCategoryFilter === 'student' && (
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-850 dark:via-blue-950/20 dark:to-slate-850 border border-blue-200/80 dark:border-blue-900/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    🎓 শিক্ষার্থী ও কৃতি ছাত্র/ছাত্রীদের ছবি
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                    {config.achievers?.students?.length || 0} জন সেরা শিক্ষার্থী
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  শিক্ষার্থীদের ছবি আপলোড করে এক ক্লিকে &quot;সেরা ছাত্র/ছাত্রী&quot; তালিকায় যুক্ত করুন।
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>শিক্ষার্থীর ছবি আপলোড করুন</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter by category with counts */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'সকল ছবি', icon: Layers },
            { key: 'logo', label: 'লোগো', icon: Award },
            { key: 'banner', label: 'ব্যানার', icon: LayoutTemplate },
            { key: 'student', label: 'শিক্ষার্থী', icon: GraduationCap },
            { key: 'gallery', label: 'গ্যালারি', icon: Camera },
            { key: 'other', label: 'অন্যান্য', icon: ImageIcon },
          ].map((c) => {
            const count = c.key === 'all' ? mediaList.length : mediaList.filter((m) => m.category === c.key).length;
            const IconComponent = c.icon;
            const isActive = mediaCategoryFilter === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setMediaCategoryFilter(c.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span>{c.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Media Content Area */}
        {filteredMedia.length === 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files) handleFilesBatch(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-14 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-400 hover:bg-indigo-50/30'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition shadow-inner">
              {isUploading ? (
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Upload className="w-8 h-8" />
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                {mediaCategoryFilter === 'banner'
                  ? 'ব্যানার ক্যাটাগরিতে কোনো ছবি নেই — এখনই আপলোড করুন'
                  : mediaCategoryFilter === 'gallery'
                  ? 'গ্যালারি ক্যাটাগরিতে কোনো ছবি নেই — এখনই ছবি যোগ করুন'
                  : mediaCategoryFilter === 'student'
                  ? 'শিক্ষার্থী ক্যাটাগরিতে কোনো ছবি নেই — ছবি আপলোড করুন'
                  : mediaCategoryFilter === 'logo'
                  ? 'লোগো ক্যাটাগরিতে কোনো ছবি নেই — লোগো আপলোড করুন'
                  : 'এই ক্যাটাগরিতে কোনো ছবি নেই — এখনই ছবি আপলোড করুন'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                কম্পিউটার বা মোবাইল থেকে ছবি ড্র্যাগ করে এনে এখানে ছেড়ে দিন অথবা ব্রাউজ করুন। (একাধিক ছবি একসাথে নির্বাচন করতে পারবেন)
              </p>
            </div>
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer pointer-events-none"
            >
              <Upload className="w-4 h-4" />
              <span>ছবি নির্বাচন করুন</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {/* First Card: Quick Add More */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group relative rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 bg-indigo-50/40 dark:bg-slate-800/40 hover:bg-indigo-50/80 p-4 flex flex-col items-center justify-center text-center cursor-pointer transition min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition mb-2">
                <Plus className="w-6 h-6" />
              </div>
              <p className="text-xs font-black text-indigo-700 dark:text-indigo-300">আরও ছবি যোগ করুন</p>
              <span className="text-[10px] text-slate-500 mt-0.5">ড্র্যাগ বা ক্লিক করুন</span>
            </div>

            {filteredMedia.map((item) => {
              const isCurrentLogo = item.url === config.header.logoUrl;
              const isHeroBg = item.url === config.hero.bgImage;
              const isInGallery = (config.gallery?.items || []).some((g) => g.thumbnail === item.url);
              const isInSlider = (config.hero.slides || []).some((s) => s.imageUrl === item.url);
              const sliderIndex = (config.hero.slides || []).findIndex((s) => s.imageUrl === item.url);

              return (
                <div
                  key={item.id}
                  className={`group relative rounded-2xl border transition overflow-hidden bg-slate-50 dark:bg-slate-800 p-2 space-y-2 flex flex-col justify-between ${
                    isCurrentLogo
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                      : isHeroBg
                      ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                      : isInSlider
                      ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="w-full aspect-square rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.altText}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isCurrentLogo && (
                        <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow flex items-center gap-1 z-10">
                          <Check className="w-2.5 h-2.5" />
                          <span>প্রধান লোগো</span>
                        </div>
                      )}
                      {isHeroBg && (
                        <div className="absolute top-1.5 right-1.5 bg-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow flex items-center gap-1 z-10">
                          <Check className="w-2.5 h-2.5" />
                          <span>ব্যানার ব্যাকগ্রাউন্ড</span>
                        </div>
                      )}
                      {isInSlider && !isCurrentLogo && (
                        <div className="absolute top-1.5 left-1.5 bg-sky-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow flex items-center gap-1 z-10">
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>স্লাইডার #{sliderIndex + 1}</span>
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-medium px-1.5 py-0.5 rounded capitalize">
                        {item.category}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                      <span className="text-[10px] text-slate-400 block">{(item.size / 1024).toFixed(0)} KB</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-700">
                    {isCurrentLogo ? (
                      <div className="w-full py-1 text-center rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>সক্রিয় লোগো</span>
                      </div>
                    ) : item.category === 'logo' || mediaCategoryFilter === 'logo' ? (
                      <button
                        type="button"
                        onClick={() => handleSetAsSchoolLogo(item)}
                        className="w-full py-1 text-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <Award className="w-3 h-3" />
                        <span>লোগো হিসেবে সেট করুন</span>
                      </button>
                    ) : null}

                    {(item.category === 'banner' || mediaCategoryFilter === 'banner') && (
                      <div className="space-y-1">
                        {!isHeroBg && (
                          <button
                            type="button"
                            onClick={() => handleSetAsHeroBanner(item)}
                            className="w-full py-1 text-center rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                          >
                            <LayoutTemplate className="w-3 h-3" />
                            <span>হোমপেজ ব্যানার করুন</span>
                          </button>
                        )}
                        {isInSlider ? (
                          <div className="flex items-center gap-1">
                            <div className="flex-1 py-1 px-1.5 text-center rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-[10px] font-black flex items-center justify-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>স্লাইডারে সক্রিয় (#{sliderIndex + 1})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromHeroSlider(item.url)}
                              className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 transition cursor-pointer"
                              title="স্লাইডার থেকে বাদ দিন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToHeroSlider(item)}
                            className="w-full py-1 text-center rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                            <span>স্লাইডারে যোগ করুন</span>
                          </button>
                        )}
                      </div>
                    )}

                    {(item.category === 'gallery' || mediaCategoryFilter === 'gallery') &&
                      (isInGallery ? (
                        <div className="w-full py-1 text-center rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>গ্যালারিতে লাইভ</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToGallery(item)}
                          className="w-full py-1 text-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          <span>গ্যালারিতে যুক্ত করুন</span>
                        </button>
                      ))}

                    {(item.category === 'student' || mediaCategoryFilter === 'student') && (
                      <button
                        type="button"
                        onClick={() => handleAddToAchievers(item)}
                        className="w-full py-1 text-center rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <GraduationCap className="w-3 h-3" />
                        <span>সেরা ছাত্র/ছাত্রী করুন</span>
                      </button>
                    )}

                    {/* Category changer & copy & delete */}
                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                      <select
                        value={item.category}
                        onChange={(e) => handleChangeCategory(item, e.target.value as MediaItem['category'])}
                        className="text-[9px] bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1 py-0.5 text-slate-700 dark:text-slate-300 cursor-pointer"
                        title="ক্যাটাগরি পরিবর্তন করুন"
                      >
                        <option value="logo">লোগো</option>
                        <option value="banner">ব্যানার</option>
                        <option value="student">শিক্ষার্থী</option>
                        <option value="gallery">গ্যালারি</option>
                        <option value="other">অন্যান্য</option>
                      </select>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(item.url);
                            showToast('ছবির লিংক কপি করা হয়েছে', 'info');
                          }}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          title="URL কপি"
                        >
                          URL
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (
                              await confirmDialog({
                                title: 'ছবি মুছে ফেলুন',
                                message: `আপনি কি "${item.name}" মুছে ফেলতে চান?`,
                                confirmLabel: 'মুছে ফেলুন',
                                danger: true,
                              })
                            ) {
                              landingPageService.deleteMediaItem(item.id);
                              setMediaList(landingPageService.getMediaList());
                              showToast('ছবি মুছে ফেলা হয়েছে', 'info');
                            }
                          }}
                          className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                          title="মুছুন"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
