'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  Sparkles,
  X,
  Eye,
  Monitor,
  Tablet,
  Smartphone,
  HelpCircle,
} from 'lucide-react';
import { ThemeConfig, VersionSnapshot } from '@/services/landingPageService';
import { BaseLandingTabProps } from './landingAdminShared';

export function LandingThemeTab({ config, handleUpdateConfig }: BaseLandingTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">রং, ফন্ট ও ভিজ্যুয়াল ডিজাইন টোকেন</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Primary Color */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
              প্রধান ব্র্যান্ড কালার
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
              সেকেন্ডারি কালার
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
              বাংলা ফন্ট ফ্যামিলি
            </label>
            <select
              value={config.theme.fontFamily}
              onChange={(e) =>
                handleUpdateConfig({
                  ...config,
                  theme: { ...config.theme, fontFamily: e.target.value as ThemeConfig['fontFamily'] },
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
                  theme: { ...config.theme, borderRadius: e.target.value as ThemeConfig['borderRadius'] },
                })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
            >
              <option value="none">সোজা কোণা (Sharp 0px)</option>
              <option value="md">মাঝারি গোল (Medium 8px)</option>
              <option value="lg">সুন্দর গোল (Large 12px)</option>
              <option value="xl">অতিরিক্ত গোল (Extra Rounded 16px)</option>
              <option value="full">সম্পূর্ণ পিল বা ক্যাপসুল</option>
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
  );
}

export function LandingFooterTab({ config, handleUpdateConfig }: BaseLandingTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          ৪-কলাম প্রাতিষ্ঠানিক ফুটার ও যোগাযোগ সেটিংস
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">
            কলাম ৪: প্রাতিষ্ঠানিক কোড ও সোশ্যাল আইকন
          </h3>
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
  );
}

export function LandingSeoTab({ config, handleUpdateConfig }: BaseLandingTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">সার্চ ইঞ্জিন অপটিমাইজেশন ও সোশ্যাল শেয়ার</h2>

        <div>
          <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">মেটা টাইটেল</label>
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
          <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">মেটা ডেসক্রিপশন</label>
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
  );
}

interface LandingHistoryTabProps {
  versions: VersionSnapshot[];
  handleRestoreVersion: (ver: VersionSnapshot) => Promise<void>;
}

export function LandingHistoryTab({ versions, handleRestoreVersion }: LandingHistoryTabProps) {
  return (
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
  );
}

interface LandingAdminModalsProps {
  showPublishModal: boolean;
  setShowPublishModal: (v: boolean) => void;
  publishSummary: string;
  setPublishSummary: (v: string) => void;
  handlePublishLive: () => void;
  isPublishing: boolean;
  showPreviewModal: boolean;
  setShowPreviewModal: (v: boolean) => void;
  showHelpModal: boolean;
  setShowHelpModal: (v: boolean) => void;
}

export function LandingAdminModals({
  showPublishModal,
  setShowPublishModal,
  publishSummary,
  setPublishSummary,
  handlePublishLive,
  isPublishing,
  showPreviewModal,
  setShowPreviewModal,
  showHelpModal,
  setShowHelpModal,
}: LandingAdminModalsProps) {
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  return (
    <>
      {/* PUBLISH MODAL */}
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

      {/* LIVE PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-sm animate-in fade-in">
          <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-white shrink-0">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-indigo-400" />
              <span className="font-extrabold text-sm">লাইভ ইন্টারেক্টিভ প্রিভিউ</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                খসড়া ভিউ
              </span>
            </div>

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
              <iframe src="/" title="Live Preview" className="w-full h-full min-h-[800px] border-none" />
            </div>
          </div>
        </div>
      )}

      {/* HELP & GUIDED TOUR MODAL */}
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
    </>
  );
}
