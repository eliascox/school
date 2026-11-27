'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Award,
  UserPlus,
  Search,
  FileBadge2,
  Smartphone,
} from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';
import { HeroConfig } from '@/services/landingPageService';
import { sanitizePublicImageUrl } from '@/lib/publicLandingUtils';

interface PublicHeroProps {
  settings?: SchoolSettings | null;
  heroConfig?: HeroConfig | null;
}

interface SlideItem {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
}

const CURATED_DEFAULT_SLIDES: SlideItem[] = [
  {
    id: 'slide-1',
    imageUrl: '/school-campus.jpg',
    title: 'বরইতলী উচ্চ বিদ্যালয়',
    subtitle: 'ঐতিহ্যের ৫৫ বছর | জ্ঞান, প্রজ্ঞা ও নৈতিক মূল্যবোধের আদর্শ বিদ্যাপীঠ',
    badge: 'স্থাপিত ১৯৬৯ • ঐতিহ্যের ৫৫+ বছর',
    ctaText: 'ভর্তি আবেদন করুন',
    ctaLink: '/admission',
  },
  {
    id: 'slide-2',
    imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1800&q=80',
    title: 'নান্দনিক ক্যাম্পাস ও আধুনিক বিদ্যাপীঠ',
    subtitle: 'মনোরম ও কোলাহলমুক্ত পরিবেশে শিক্ষার্থীদের সৃজনশীল মেধা ও নেতৃত্বের বিকাশ',
    badge: 'সবুজ ও সুশৃঙ্খল ক্যাম্পাস',
    ctaText: 'প্রতিষ্ঠান পরিচিতি',
    ctaLink: '#about',
  },
  {
    id: 'slide-3',
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1800&q=80',
    title: 'শেখ রাসেল ডিজিটাল ল্যাব ও বিজ্ঞানাগার',
    subtitle: 'হাতে-কলমে আধুনিক বিজ্ঞান শিক্ষা ও ডিজিটাল তথ্যপ্রযুক্তির সমন্বিত প্রশিক্ষণ',
    badge: 'বিজ্ঞান ও আইসিটি ল্যাব',
    ctaText: 'সুবিধাসমূহ দেখুন',
    ctaLink: '#facilities',
  },
  {
    id: 'slide-4',
    imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1800&q=80',
    title: 'ক্রীড়া, বিতর্ক ও সুস্থ সাংস্কৃতিক চর্চা',
    subtitle: 'পাঠ্যক্রমের পাশাপাশি শারীরিক ও মানসিক উৎকর্ষ সাধনে সক্রিয় সহশিক্ষা কার্যক্রম',
    badge: 'সহশিক্ষা ও ক্রীড়া উৎকর্ষ',
    ctaText: 'ফলাফল অনুসন্ধান',
    ctaLink: '/result',
  },
];

export default function PublicHero({ settings, heroConfig }: PublicHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const slides = useMemo<SlideItem[]>(() => {
    const defaultTitle = heroConfig?.title || settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
    const defaultSubtitle =
      heroConfig?.subtitle || settings?.address || 'গুণগত শিক্ষা ও সুনাগরিক গড়ার আদর্শ বিদ্যাপীঠ';
    const defaultBadge = heroConfig?.badgeText || 'স্থাপিত ১৯৬৯ • ঐতিহ্যের ৫৫+ বছর';

    if (heroConfig?.slides && heroConfig.slides.length > 0) {
      const valid = heroConfig.slides.filter((s) => s && s.imageUrl && s.imageUrl.trim() !== '');
      if (valid.length > 1) {
        return valid.map((s, idx) => ({
          id: s.id || `slide-${idx}`,
          imageUrl: sanitizePublicImageUrl(s.imageUrl, '/school-campus.jpg'),
          title: s.title || defaultTitle,
          subtitle: s.subtitle || defaultSubtitle,
          badge: defaultBadge,
          ctaText: s.ctaText || heroConfig.primaryCta?.text || 'ভর্তি আবেদন করুন',
          ctaLink: s.ctaLink || heroConfig.primaryCta?.href || '/admission',
        }));
      }

      if (valid.length === 1) {
        const single = valid[0];
        const safeImg = sanitizePublicImageUrl(single.imageUrl, '/school-campus.jpg');
        if (safeImg !== '/school-campus.jpg') {
          const firstSlide: SlideItem = {
            id: single.id || 'custom-1',
            imageUrl: safeImg,
            title: single.title || defaultTitle,
            subtitle: single.subtitle || defaultSubtitle,
            badge: defaultBadge,
            ctaText: single.ctaText || heroConfig.primaryCta?.text || 'ভর্তি আবেদন করুন',
            ctaLink: single.ctaLink || heroConfig.primaryCta?.href || '/admission',
          };
          if (heroConfig.enableSlider === false) return [firstSlide];
          return [firstSlide, ...CURATED_DEFAULT_SLIDES.slice(1)];
        }
      }
    }

    const customPhoto = sanitizePublicImageUrl(heroConfig?.bgImage || settings?.schoolPhoto, '');
    if (customPhoto && customPhoto !== '/school-campus.jpg') {
      const customFirst: SlideItem = {
        id: 'custom-photo-single',
        imageUrl: customPhoto,
        title: defaultTitle,
        subtitle: defaultSubtitle,
        badge: defaultBadge,
        ctaText: heroConfig?.primaryCta?.text || 'ভর্তি আবেদন করুন',
        ctaLink: heroConfig?.primaryCta?.href || '/admission',
      };
      if (heroConfig?.enableSlider === false) return [customFirst];
      return [customFirst, ...CURATED_DEFAULT_SLIDES.slice(1)];
    }

    return CURATED_DEFAULT_SLIDES.map((s, i) => ({
      ...s,
      title: i === 0 ? defaultTitle : s.title,
      subtitle: i === 0 ? defaultSubtitle : s.subtitle,
      badge: i === 0 ? defaultBadge : s.badge,
    }));
  }, [
    heroConfig?.slides,
    heroConfig?.bgImage,
    heroConfig?.title,
    heroConfig?.subtitle,
    heroConfig?.badgeText,
    heroConfig?.primaryCta,
    heroConfig?.enableSlider,
    settings?.schoolPhoto,
    settings?.schoolName,
    settings?.address,
  ]);

  useEffect(() => {
    if (slides.length > 0 && currentIndex >= slides.length) {
      setCurrentIndex(0);
      setPreviousIndex(null);
    }
  }, [slides.length, currentIndex]);

  const goToSlide = (newIndex: number) => {
    if (newIndex === currentIndex || newIndex < 0 || newIndex >= slides.length) return;
    setPreviousIndex(currentIndex);
    setCurrentIndex(newIndex);
  };

  const handlePrev = () => goToSlide(currentIndex === 0 ? slides.length - 1 : currentIndex - 1);
  const handleNext = () => goToSlide((currentIndex + 1) % slides.length);

  useEffect(() => {
    if (slides.length <= 1 || isPaused || heroConfig?.enableSlider === false) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        setPreviousIndex(prev);
        return (prev + 1) % slides.length;
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length, isPaused, heroConfig?.enableSlider]);

  const activeSlide = slides[currentIndex] || slides[0];
  const effectiveOverlayOpacity = Math.min(
    Math.max((heroConfig?.bgOverlayOpacity ?? 28) / 100, 0.18),
    0.42
  );

  return (
    <section
      id="home"
      aria-label="ক্যাম্পাস হিরো গ্যালারি"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="group relative w-full min-h-[540px] sm:min-h-[600px] lg:min-h-[660px] max-h-[780px] overflow-hidden bg-slate-900 select-none flex items-center justify-center pt-24 pb-16 sm:pt-28 sm:pb-20"
    >
      {/* Crossfade Photographic Slides with Guaranteed Fallback */}
      {slides.map((slide, index) => {
        const isCurrent = index === currentIndex;
        const isPrevious = index === previousIndex;
        const resolvedImg = failedImages[slide.id] ? '/school-campus.jpg' : slide.imageUrl;

        return (
          <div
            key={`${slide.id}-${index}`}
            aria-hidden={!isCurrent}
            className={`absolute inset-0 transition-opacity duration-[1100ms] ease-out ${
              isCurrent
                ? 'opacity-100 z-10'
                : isPrevious
                ? 'opacity-100 z-[5]'
                : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolvedImg}
              alt={slide.title}
              onError={() => {
                if (!failedImages[slide.id]) {
                  setFailedImages((prev) => ({ ...prev, [slide.id]: true }));
                }
              }}
              className={`w-full h-full object-cover transition-transform duration-[7200ms] ease-out will-change-transform ${
                isCurrent ? 'scale-[1.05]' : 'scale-100'
              }`}
            />
          </div>
        );
      })}

      {/* Editorial Atmospheric Gradient Layers (Vibrant Emerald-Slate Contrast) */}
      <div
        className="absolute inset-0 z-20 pointer-events-none bg-slate-950 transition-opacity duration-500"
        style={{ opacity: effectiveOverlayOpacity }}
      />
      <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-b from-slate-950/60 via-emerald-950/20 to-slate-950/80" />

      {/* Center Editorial Content */}
      <div className="relative z-30 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white w-full">
        <div className="relative overflow-hidden p-6 sm:p-10 lg:p-11 rounded-[28px] backdrop-blur-md bg-slate-950/42 border border-white/18 shadow-[0_28px_70px_-18px_rgba(0,0,0,0.55)]">
          <div key={`hero-slide-content-${currentIndex}`} className="space-y-4 sm:space-y-5">
            {/* Institutional Eyebrow Pill */}
            {(activeSlide?.badge || heroConfig?.badgeText) && (
              <div className="animate-hero-text-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-300/35 text-amber-300 text-xs sm:text-[13px] font-bold shadow-sm">
                <Award className="w-4 h-4 text-[#F4B400] shrink-0" />
                <span>{activeSlide?.badge || heroConfig?.badgeText}</span>
              </div>
            )}

            {/* Main Display Title */}
            <h1 className="animate-hero-text-2 text-3xl sm:text-5xl lg:text-[54px] font-black tracking-tight text-white leading-[1.15] drop-shadow-[0_4px_16px_rgba(0,0,0,0.45)]">
              {activeSlide?.title || heroConfig?.title || settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
            </h1>

            {/* Subtitle */}
            <p className="animate-hero-text-3 text-sm sm:text-base lg:text-lg text-slate-100/95 max-w-2xl mx-auto font-medium leading-relaxed">
              {activeSlide?.subtitle ||
                heroConfig?.subtitle ||
                settings?.address ||
                'গুণগত শিক্ষা ও সুনাগরিক গড়ার আদর্শ বিদ্যাপীঠ'}
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="animate-hero-text-4 flex flex-wrap items-center justify-center gap-3 pt-1">
              {heroConfig?.primaryCta?.visible !== false && (
                <Link
                  href={activeSlide?.ctaLink || heroConfig?.primaryCta?.href || '/admission'}
                  className="group/btn px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#0B5D3B] via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-950/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center gap-2 border border-emerald-400/30"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{activeSlide?.ctaText || heroConfig?.primaryCta?.text || 'ভর্তি আবেদন করুন'}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                </Link>
              )}

              {heroConfig?.secondaryCta?.visible !== false && (
                <Link
                  href={heroConfig?.secondaryCta?.href || '/result'}
                  className="px-6 py-3.5 rounded-2xl bg-white/16 hover:bg-white/25 text-white backdrop-blur-md border border-white/30 font-extrabold text-xs sm:text-sm shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center gap-2"
                >
                  <Search className="w-4 h-4 text-[#F4B400]" />
                  <span>{heroConfig?.secondaryCta?.text || 'ফলাফল অনুসন্ধান'}</span>
                </Link>
              )}
            </div>

            {/* Integrated Public Quick-Portal Strip */}
            <div className="pt-3 border-t border-white/15 flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-xs font-bold">
              <Link
                href="/admission"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-emerald-100 border border-white/15 transition"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-300" />
                <span>অনলাইন ভর্তি</span>
              </Link>
              <Link
                href="/result"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-emerald-100 border border-white/15 transition"
              >
                <Award className="w-3.5 h-3.5 text-[#F4B400]" />
                <span>পরীক্ষার ফলাফল</span>
              </Link>
              <Link
                href="/verify-certificate"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-emerald-100 border border-white/15 transition"
              >
                <FileBadge2 className="w-3.5 h-3.5 text-amber-300" />
                <span>সনদ যাচাই</span>
              </Link>
              <Link
                href="/mobile-app"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-emerald-100 border border-white/15 transition"
              >
                <Smartphone className="w-3.5 h-3.5 text-sky-300" />
                <span>মোবাইল অ্যাপ</span>
              </Link>
            </div>
          </div>

          {/* Smooth Auto-Slide Timer Bar */}
          {slides.length > 1 && !isPaused && heroConfig?.enableSlider !== false && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
              <div
                key={`hero-timer-${currentIndex}`}
                className="h-full w-full bg-gradient-to-r from-[#F4B400] via-emerald-400 to-teal-300 animate-hero-timer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Desktop Slider Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="পূর্ববর্তী স্লাইড"
            className="hidden sm:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-slate-950/40 hover:bg-[#0B5D3B] text-white backdrop-blur-md border border-white/20 items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 cursor-pointer shadow-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="পরবর্তী স্লাইড"
            className="hidden sm:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-slate-950/40 hover:bg-[#0B5D3B] text-white backdrop-blur-md border border-white/20 items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 cursor-pointer shadow-xl"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Slide Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/50 backdrop-blur-md border border-white/20 shadow-lg">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToSlide(i)}
              aria-label={`স্লাইড ${i + 1}`}
              className={`transition-all duration-300 cursor-pointer rounded-full ${
                i === currentIndex
                  ? 'w-7 h-2 bg-gradient-to-r from-[#F4B400] to-emerald-400'
                  : 'w-2 h-2 bg-white/45 hover:bg-white/80'
              }`}
            />
          ))}
          <span className="text-[11px] font-mono font-bold text-white/90 ml-1">
            {String(currentIndex + 1).padStart(2, '0')}/{String(slides.length).padStart(2, '0')}
          </span>
        </div>
      )}
    </section>
  );
}
