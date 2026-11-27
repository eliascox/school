'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  School,
  CheckCircle2,
  ArrowRight,
  Award,
  X,
  Target,
  Compass,
  MapPin,
  UserPlus,
} from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';
import { AboutConfig } from '@/services/landingPageService';
import { sanitizePublicImageUrl } from '@/lib/publicLandingUtils';
import { toBanglaDigits } from '@/lib/resultPortalUtils';

interface PublicAboutProps {
  settings: SchoolSettings | null;
  aboutConfig?: AboutConfig | null;
}

export default function PublicAbout({ settings, aboutConfig }: PublicAboutProps) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (!showDetailsModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDetailsModal(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showDetailsModal]);

  if (aboutConfig && aboutConfig.enabled === false) {
    return null;
  }

  const schoolName = settings?.schoolName?.trim() || 'বরইতলী উচ্চ বিদ্যালয়';
  const estd = toBanglaDigits(aboutConfig?.foundingYear || settings?.estdYear || '১৯৬৯');
  const address = settings?.address?.trim() || 'বরইতলী, চকরিয়া, কক্সবাজার।';
  const eiin = toBanglaDigits(aboutConfig?.eiin || settings?.eiin || '106184');
  const schoolPhoto = imgFailed
    ? '/school-campus.jpg'
    : sanitizePublicImageUrl(aboutConfig?.campusPhoto || settings?.schoolPhoto, '/school-campus.jpg');

  const title = aboutConfig?.title || 'আমাদের ঐতিহ্য, গৌরব ও পথচলা';
  const eyebrow = aboutConfig?.subtitle || 'প্রতিষ্ঠান পরিচিতি ও ইতিহাস';
  const defaultHistoryText = `কক্সবাজার জেলার চকরিয়া উপজেলার অন্তর্গত ঐতিহ্যবাহী বরইতলী ইউনিয়নের প্রাণকেন্দ্রে ${estd} খ্রিষ্টাব্দে প্রতিষ্ঠিত হয় ‘${schoolName}’। স্থানীয় শিক্ষানুরাগী, সমাজসেবক ও বিদ্যোৎসাহী ব্যক্তিবর্গের ঐকান্তিক প্রচেষ্টায় এই অঞ্চলে শিক্ষার আলো ছড়িয়ে দিতে বিদ্যালয়টির যাত্রা শুরু হয়েছিল। দীর্ঘ পাঁচ দশকেরও বেশি সময় ধরে চট্টগ্রাম শিক্ষাবোর্ডের অধীনে বিদ্যালয়টি কৃতিত্বপূর্ণ ফলাফল, নৈতিক মূল্যবোধ ও আধুনিক বিজ্ঞান-প্রযুক্তি শিক্ষার সমন্বয়ে একবিংশ শতাব্দীর যোগ্য নাগরিক তৈরিতে প্রতিশ্রুতিবদ্ধ।`;
  const historyText = aboutConfig?.historyText?.trim() || defaultHistoryText;
  const missionText =
    aboutConfig?.missionText?.trim() ||
    'আধুনিক প্রযুক্তিনির্ভর ও নৈতিক শিক্ষায় প্রতিটি শিক্ষার্থীকে সুনাগরিক ও দক্ষ মানবসম্পদ হিসেবে গড়ে তোলা।';
  const visionText =
    aboutConfig?.visionText?.trim() ||
    'দক্ষিণ চট্টগ্রামের একটি মডেল ডিজিটাল শিক্ষা প্রতিষ্ঠান হিসেবে গুণগত শিক্ষার অনন্য দৃষ্টান্ত স্থাপন করা।';

  return (
    <section
      id="about"
      className="py-12 sm:py-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 overflow-hidden relative"
    >
      <div id="recognition" className="absolute top-0 left-0" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Framed Institutional Campus Showcase */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              <div className="absolute -inset-2 sm:-inset-3 rounded-[28px] bg-gradient-to-tr from-[#0B5D3B]/20 via-emerald-400/15 to-[#F4B400]/25 blur-xs" />

              <div className="relative rounded-3xl overflow-hidden bg-slate-950 shadow-xl border-4 border-white dark:border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={schoolPhoto}
                  alt={`${schoolName} ক্যাম্পাস`}
                  onError={() => setImgFailed(true)}
                  className="w-full h-[300px] sm:h-[400px] lg:h-[440px] object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent pointer-events-none" />

                {/* Floating Institutional Crest Badge */}
                <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#0B5D3B] text-[#F4B400] flex items-center justify-center shadow-sm shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        ঐতিহ্যের গৌরবময় বিদ্যাপীঠ
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        স্থাপিত: {estd} খ্রিষ্টাব্দ
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold font-mono text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                    EIIN: {eiin}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Narrative, Mission/Vision Highlights & Interactive Detail Modal */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
              <School className="w-3.5 h-3.5 text-[#F4B400]" />
              <span>{eyebrow}</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                {title}
              </h2>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="w-14 h-1.5 bg-[#0B5D3B] rounded-full" />
                <span className="w-3.5 h-1.5 bg-[#F4B400] rounded-full" />
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-[15px] leading-relaxed text-justify whitespace-pre-line">
              {historyText}
            </p>

            {/* Mission & Vision Preview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0B5D3B] dark:text-emerald-400">
                  <Target className="w-3.5 h-3.5" />
                  <span>আমাদের লক্ষ্য (Mission)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                  {missionText}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-700 dark:text-amber-400">
                  <Compass className="w-3.5 h-3.5" />
                  <span>আমাদের রূপকল্প (Vision)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                  {visionText}
                </p>
              </div>
            </div>

            {/* Key Strengths */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
              {[
                'চট্টগ্রাম শিক্ষাবোর্ড অনুমোদিত',
                'অভিজ্ঞ ও এমপিওভুক্ত শিক্ষকমণ্ডলী',
                'আধুনিক বিজ্ঞানাগার ও আইসিটি ল্যাব',
                'সুশৃঙ্খল ও রাজনীতিমুক্ত ক্যাম্পাস',
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDetailsModal(true)}
                className="inline-flex items-center gap-2 bg-[#0B5D3B] hover:bg-[#08492e] text-white font-bold px-6 py-3 rounded-xl text-xs sm:text-sm transition shadow-md shadow-emerald-900/15 hover:-translate-y-0.5 cursor-pointer"
              >
                <span>বিস্তারিত ইতিহাস পড়ুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/admission"
                className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-950 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>ভর্তি আবেদন</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Full History, Mission & Vision Modal */}
      {showDetailsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B5D3B] via-[#F4B400] to-[#0B5D3B]" />

            <button
              type="button"
              onClick={() => setShowDetailsModal(false)}
              aria-label="বন্ধ করুন"
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pr-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold mb-2">
                <School className="w-3.5 h-3.5" />
                <span>প্রতিষ্ঠানের পূর্ণ পরিচিতি</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {schoolName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0B5D3B]" />
                  {address}
                </span>
                <span>•</span>
                <span>স্থাপিত: {estd}</span>
                <span>•</span>
                <span className="font-mono font-bold text-[#0B5D3B] dark:text-emerald-400">
                  EIIN: {eiin}
                </span>
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 leading-relaxed text-justify whitespace-pre-line">
              {historyText}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1.5">
                <h4 className="text-xs font-extrabold text-[#0B5D3B] dark:text-emerald-300 flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  <span>লক্ষ্য (Mission)</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {missionText}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-1.5">
                <h4 className="text-xs font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  <span>রূপকল্প (Vision)</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {visionText}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <Link
                href="/admission"
                onClick={() => setShowDetailsModal(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#08492e] text-white text-xs font-bold transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>অনলাইন ভর্তি আবেদন</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
