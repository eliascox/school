'use client';

import React from 'react';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
  Building2,
} from 'lucide-react';
import {
  ServiceCard,
  FacilityItem,
  DEFAULT_ACADEMIC_CONFIG,
} from '@/services/landingPageService';
import { compressImage } from '@/lib/imageUtils';
import { ActiveTab, BaseLandingTabProps, ShowToastFn } from './landingAdminShared';

interface LandingAboutTabProps extends BaseLandingTabProps {
  showToast: ShowToastFn;
  setMediaCategoryFilter: (cat: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

const DEFAULT_PRESIDENT = {
  name: 'আলহাজ্ব মোস্তফা কামাল',
  title: 'সভাপতি, ম্যানেজিং কমিটি',
  photo: '',
  message: '',
  visible: true,
};

export function LandingAboutTab({
  config,
  handleUpdateConfig,
  showToast,
  setMediaCategoryFilter,
  setActiveTab,
}: LandingAboutTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              প্রতিষ্ঠান পরিচিতি, ক্যাম্পাস ছবি ও দিকনির্দেশনামূলক বাণী
            </h2>
            <p className="text-xs text-slate-500">
              হোমপেজের মূল পরিচিতি, ক্যাম্পাস ফটো, প্রতিষ্ঠা সাল, EIIN ও পরিচালনা পর্ষদের বাণী পরিচালনা করুন।
            </p>
          </div>
        </div>

        {/* Image Dimension Guidelines Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm font-black text-sm">
              📐
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-900 dark:text-amber-200">
                ছবি সাইজ ও ডাইমেনশন নির্দেশিকা — পরিচিতি সেকশন
              </h4>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                <span className="font-bold">• ক্যাম্পাস ছবি:</span> ১০০০ × ৬৫০ px (১৬:১০ বা ৪:৩ ল্যান্ডস্কেপ), সর্বোচ্চ ৩৫-৫০ KB (স্বয়ংক্রিয় অপ্টিমাইজড)।
                <span className="mx-1.5 opacity-40">|</span>
                <span className="font-bold">• সভাপতি / প্রধান শিক্ষক প্রতিকৃতি:</span> ৩০০ × ৩৮০ px (৩:৪ অনুপাত বা ১:১ পাসপোর্ট সাইজ), সর্বোচ্চ ২০-৩০ KB।
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-black shrink-0 border border-amber-300 dark:border-amber-700">
            স্বয়ংক্রিয় কম্প্রেসড ও অপ্টিমাইজড
          </span>
        </div>

        {/* Campus Photo Upload & Preview Card */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                বিদ্যালয় ক্যাম্পাসের মূল ছবি (Campus Feature Photo)
              </h3>
              <p className="text-[11px] text-slate-500">
                হোমপেজের &ldquo;প্রতিষ্ঠান পরিচিতি ও ইতিহাস&rdquo; সেকশনে এই ক্যাম্পাস ছবিটি আকর্ষণীয়ভাবে প্রদর্শিত হবে।
              </p>
            </div>
            <span className="text-[11px] font-bold text-slate-400">সাইজ: ১০০০ × ৬৫০ px</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
            <div className="relative w-full sm:w-64 h-36 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-900 shrink-0 group shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.about.campusPhoto || '/school-campus.jpg'}
                alt="Campus"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                বর্তমান ক্যাম্পাস ছবি
              </div>
            </div>

            <div className="flex-1 w-full space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>ডিভাইস থেকে ক্যাম্পাস ছবি আপলোড</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const compressed = await compressImage(file, 1000, 650, 0.68);
                          handleUpdateConfig({
                            ...config,
                            about: { ...config.about, campusPhoto: compressed },
                          });
                          showToast('ক্যাম্পাসের ছবি সফলভাবে আপলোড হয়েছে', 'success');
                        } catch {
                          showToast('ছবি আপলোড করতে সমস্যা হয়েছে', 'error');
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
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>মিডিয়া লাইব্রেরি</span>
                </button>

                {config.about.campusPhoto && config.about.campusPhoto !== '/school-campus.jpg' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateConfig({
                        ...config,
                        about: { ...config.about, campusPhoto: '/school-campus.jpg' },
                      });
                      showToast('ডিফল্ট ক্যাম্পাস ছবি রিসেট করা হয়েছে', 'info');
                    }}
                    className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 text-xs font-bold transition cursor-pointer"
                  >
                    রিসেট
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  অথবা সরাসরি অনলাইন ছবির লিঙ্ক (URL)
                </label>
                <input
                  type="text"
                  placeholder="https://... অথবা /school-campus.jpg"
                  value={config.about.campusPhoto || ''}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      about: { ...config.about, campusPhoto: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Texts & Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
              আইব্রো সাব-শিরোনাম (সেকশন ট্যাগ)
            </label>
            <input
              type="text"
              value={config.about.subtitle || 'প্রতিষ্ঠান পরিচিতি ও ইতিহাস'}
              onChange={(e) =>
                handleUpdateConfig({
                  ...config,
                  about: { ...config.about, subtitle: e.target.value },
                })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
              placeholder="যেমন: প্রতিষ্ঠান পরিচিতি ও ইতিহাস"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
              পরিচিতি সেকশনের মূল শিরোনাম
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
              placeholder="যেমন: আমাদের ঐতিহ্য, গৌরব ও পথচলা"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
              প্রতিষ্ঠা সাল
            </label>
            <input
              type="text"
              value={config.about.foundingYear || '১৯৬৯'}
              onChange={(e) =>
                handleUpdateConfig({
                  ...config,
                  about: { ...config.about, foundingYear: e.target.value },
                })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
              placeholder="যেমন: ১৯৬৯"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">EIIN নম্বর</label>
            <input
              type="text"
              value={config.about.eiin || '106184'}
              onChange={(e) =>
                handleUpdateConfig({
                  ...config,
                  about: { ...config.about, eiin: e.target.value },
                })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
              placeholder="যেমন: 106184"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
            প্রতিষ্ঠানের ইতিহাস ও ঐতিহ্য বিস্তারিত বিবরণ
          </label>
          <textarea
            rows={5}
            value={config.about.historyText}
            onChange={(e) =>
              handleUpdateConfig({
                ...config,
                about: { ...config.about, historyText: e.target.value },
              })
            }
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none leading-relaxed"
            placeholder="বিদ্যালয়ের গৌরবময় ইতিহাস বিস্তারিত লিখুন..."
          />
        </div>

        {/* President's Speech */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              সভাপতি (ম্যানেজিং কমিটি) মহোদয়ের বাণী
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">সভাপতির ছবি</label>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0 border-2 border-amber-400">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    config.about.president?.photo ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop'
                  }
                  alt="President"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>ডিভাইস থেকে ছবি আপলোড</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (re) => {
                          const currentPres = config.about.president || DEFAULT_PRESIDENT;
                          handleUpdateConfig({
                            ...config,
                            about: {
                              ...config.about,
                              president: { ...currentPres, photo: re.target?.result as string },
                            },
                          });
                          showToast('সভাপতির ছবি আপলোড হয়েছে', 'success');
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                <input
                  type="text"
                  placeholder="অথবা অনলাইন ছবির লিঙ্ক"
                  value={config.about.president?.photo || ''}
                  onChange={(e) => {
                    const currentPres = config.about.president || DEFAULT_PRESIDENT;
                    handleUpdateConfig({
                      ...config,
                      about: {
                        ...config.about,
                        president: { ...currentPres, photo: e.target.value },
                      },
                    });
                  }}
                  className="w-full px-3 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">সভাপতির নাম</label>
              <input
                type="text"
                value={config.about.president?.name || 'আলহাজ্ব মোস্তফা কামাল'}
                onChange={(e) => {
                  const currentPres = config.about.president || DEFAULT_PRESIDENT;
                  handleUpdateConfig({
                    ...config,
                    about: {
                      ...config.about,
                      president: { ...currentPres, name: e.target.value },
                    },
                  });
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">পদবি</label>
              <input
                type="text"
                value={config.about.president?.title || 'সভাপতি, ম্যানেজিং কমিটি'}
                onChange={(e) => {
                  const currentPres = config.about.president || DEFAULT_PRESIDENT;
                  handleUpdateConfig({
                    ...config,
                    about: {
                      ...config.about,
                      president: { ...currentPres, title: e.target.value },
                    },
                  });
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              সভাপতির দিকনির্দেশনামূলক বাণী
            </label>
            <textarea
              rows={3}
              value={config.about.president?.message || ''}
              placeholder="শিক্ষার আলো ছড়িয়ে দিতে এবং মানবিক গুণাবলিসম্পন্ন ভবিষ্যৎ প্রজন্ম গড়ে তুলতে বরইতলী উচ্চ বিদ্যালয় বদ্ধপরিকর..."
              onChange={(e) => {
                const currentPres = config.about.president || DEFAULT_PRESIDENT;
                handleUpdateConfig({
                  ...config,
                  about: {
                    ...config.about,
                    president: { ...currentPres, message: e.target.value },
                  },
                });
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none"
            />
          </div>
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

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">প্রধান শিক্ষকের ছবি</label>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0 border-2 border-teal-500">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    config.about.headmaster.photo ||
                    'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop'
                  }
                  alt="Headmaster"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 hover:bg-teal-100 text-xs font-bold cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>ডিভাইস থেকে ছবি আপলোড</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (re) => {
                          handleUpdateConfig({
                            ...config,
                            about: {
                              ...config.about,
                              headmaster: { ...config.about.headmaster, photo: re.target?.result as string },
                            },
                          });
                          showToast('প্রধান শিক্ষকের ছবি আপলোড হয়েছে', 'success');
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                <input
                  type="text"
                  placeholder="অথবা অনলাইন ছবির লিঙ্ক"
                  value={config.about.headmaster.photo || ''}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      about: {
                        ...config.about,
                        headmaster: { ...config.about.headmaster, photo: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
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
  );
}

export function LandingFeaturesTab({ config, handleUpdateConfig }: BaseLandingTabProps) {
  return (
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
                  <label className="block text-[11px] font-bold text-slate-500 mb-0.5">ওয়েব লিংক</label>
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
            <h2 className="text-lg font-black text-slate-900 dark:text-white">ক্যাম্পাস সুবিধাসমূহ সেটিংস</h2>
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
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">আইব্রো ট্যাগ</label>
            <input
              type="text"
              value={config.facilities?.eyebrow || ''}
              onChange={(e) =>
                handleUpdateConfig({
                  ...config,
                  facilities: { ...config.facilities, eyebrow: e.target.value },
                })
              }
              placeholder="যেমন: ক্যাম্পাস অবকাঠামো ও সুবিধাসমূহ"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">সেকশন শিরোনাম</label>
            <input
              type="text"
              value={config.facilities?.title || ''}
              onChange={(e) =>
                handleUpdateConfig({
                  ...config,
                  facilities: { ...config.facilities, title: e.target.value },
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
                  facilities: { ...config.facilities, subtitle: e.target.value },
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
  );
}

export function LandingStatsTab({ config, handleUpdateConfig }: BaseLandingTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              ছাত্র/ছাত্রীদের পরিসংখ্যান ও কাউন্টার সেটিংস
            </h2>
            <p className="text-xs text-slate-500">
              শ্রেণিভিত্তিক ছাত্র-ছাত্রীদের সংখ্যা ও লাইভ কাউন্টার অ্যানিমেশন পরিবর্তন করুন।
            </p>
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
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">গড় পাসের হার</label>
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
  );
}

export function LandingAcademicTab({ config, handleUpdateConfig }: BaseLandingTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              একাডেমিক কার্যক্রম ও শাখা বিভাগ সেটিংস
            </h2>
            <p className="text-xs text-slate-500">
              ৬ষ্ঠ-১০ম শ্রেণিভিত্তিক শিক্ষা কার্যক্রম এবং বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা শাখার বিবরণ পরিবর্তন করুন।
            </p>
          </div>
        </div>

        {/* General Academic Headers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
              টপ পিল ব্যাজ
            </label>
            <input
              type="text"
              value={config.academic?.eyebrow || DEFAULT_ACADEMIC_CONFIG.eyebrow}
              onChange={(e) => {
                const current = config.academic || DEFAULT_ACADEMIC_CONFIG;
                handleUpdateConfig({
                  ...config,
                  academic: { ...current, eyebrow: e.target.value },
                });
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
              placeholder="একাডেমিক কার্যক্রম ও পাঠ্যক্রম"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
              সেকশন শিরোনাম
            </label>
            <input
              type="text"
              value={config.academic?.title || DEFAULT_ACADEMIC_CONFIG.title}
              onChange={(e) => {
                const current = config.academic || DEFAULT_ACADEMIC_CONFIG;
                handleUpdateConfig({
                  ...config,
                  academic: { ...current, title: e.target.value },
                });
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
              placeholder="শ্রেণিভিত্তিক শিক্ষা কার্যক্রম ও শাখা বিভাগ"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
              উপ-শিরোনাম / বিবরণ
            </label>
            <input
              type="text"
              value={config.academic?.subtitle || DEFAULT_ACADEMIC_CONFIG.subtitle}
              onChange={(e) => {
                const current = config.academic || DEFAULT_ACADEMIC_CONFIG;
                handleUpdateConfig({
                  ...config,
                  academic: { ...current, subtitle: e.target.value },
                });
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none"
              placeholder="এনসিটিবি ও চট্টগ্রাম শিক্ষা বোর্ড অনুমোদিত..."
            />
          </div>
        </div>

        {/* Academic Programs (3 Levels) */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">
            শ্রেণিভিত্তিক শিক্ষা স্তর (৩টি পর্যায়)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(config.academic?.programs || DEFAULT_ACADEMIC_CONFIG.programs).map((prog, pIdx) => (
              <div
                key={prog.id || pIdx}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">শ্রেণির স্তর নাম</span>
                  <input
                    type="text"
                    value={prog.grade}
                    onChange={(e) => {
                      const current = config.academic || DEFAULT_ACADEMIC_CONFIG;
                      const updated = [...current.programs];
                      updated[pIdx] = { ...updated[pIdx], grade: e.target.value };
                      handleUpdateConfig({ ...config, academic: { ...current, programs: updated } });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">মূল লক্ষ্য / ফোকাস</span>
                  <textarea
                    rows={2}
                    value={prog.focus}
                    onChange={(e) => {
                      const current = config.academic || DEFAULT_ACADEMIC_CONFIG;
                      const updated = [...current.programs];
                      updated[pIdx] = { ...updated[pIdx], focus: e.target.value };
                      handleUpdateConfig({ ...config, academic: { ...current, programs: updated } });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Specialized Streams (Science, Humanities, Business) */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">৯ম ও ১০ম শ্রেণির ৩টি শাখা বিভাগ</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(config.academic?.streams || DEFAULT_ACADEMIC_CONFIG.streams).map((stream, sIdx) => (
              <div
                key={stream.id || sIdx}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">বিভাগের নাম</span>
                  <input
                    type="text"
                    value={stream.name}
                    onChange={(e) => {
                      const current = config.academic || DEFAULT_ACADEMIC_CONFIG;
                      const updated = [...current.streams];
                      updated[sIdx] = { ...updated[sIdx], name: e.target.value };
                      handleUpdateConfig({ ...config, academic: { ...current, streams: updated } });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">পাঠ্য বিষয়সমূহ</span>
                  <input
                    type="text"
                    value={stream.subjects}
                    onChange={(e) => {
                      const current = config.academic || DEFAULT_ACADEMIC_CONFIG;
                      const updated = [...current.streams];
                      updated[sIdx] = { ...updated[sIdx], subjects: e.target.value };
                      handleUpdateConfig({ ...config, academic: { ...current, streams: updated } });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">বিবরণ</span>
                  <textarea
                    rows={3}
                    value={stream.desc}
                    onChange={(e) => {
                      const current = config.academic || DEFAULT_ACADEMIC_CONFIG;
                      const updated = [...current.streams];
                      updated[sIdx] = { ...updated[sIdx], desc: e.target.value };
                      handleUpdateConfig({ ...config, academic: { ...current, streams: updated } });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
