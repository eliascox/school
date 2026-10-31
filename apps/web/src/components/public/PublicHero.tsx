'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Camera, ArrowRight, Award } from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';
import { HeroConfig } from '@/services/landingPageService';

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

// 🏛️ Curated vibrant academic campus photography fallback collection
const CURATED_DEFAULT_SLIDES: SlideItem[] = [
  {
    id: 'slide-1',
    imageUrl: '/school-campus.jpg',
    title: 'বরইতলী উচ্চ বিদ্যালয়',
    subtitle: 'ঐতিহ্যের ৫৫ বছর | জ্ঞান, প্রজ্ঞা ও মূল্যবোধের অনন্য বিদ্যাপীঠ',
    badge: '🏛️ স্থাপিত ১৯৬৯ | ঐতিহ্যের ৫৫ বছর',
    ctaText: 'ভর্তি আবেদন করুন',
    ctaLink: '/admission',
  },
  {
    id: 'slide-2',
    imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2000&q=85',
    title: 'নান্দনিক ক্যাম্পাস ও আধুনিক বিদ্যাপীঠ',
    subtitle: 'মনোরম প্রাকৃতিক ও কোলাহলমুক্ত পরিবেশে শিক্ষার্থীদের সৃষ্টিশীল মেধা বিকাশ',
    badge: '🌿 সবুজ ও পরিচ্ছন্ন ক্যাম্পাস',
    ctaText: 'ক্যাম্পাস পরিচিতি',
    ctaLink: '#about',
  },
  {
    id: 'slide-3',
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=2000&q=85',
    title: 'শেখ রাসেল ডিজিটাল ল্যাব ও বিজ্ঞানাগার',
    subtitle: 'হাতে-কলমে আধুনিক বিজ্ঞান শিক্ষা ও ডিজিটাল তথ্যপ্রযুক্তির সমন্বিত প্রশিক্ষণ',
    badge: '🔬 বিজ্ঞান ও তথ্যপ্রযুক্তি ল্যাব',
    ctaText: 'সুবিধাসমূহ দেখুন',
    ctaLink: '#facilities',
  },
  {
    id: 'slide-4',
    imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=2000&q=85',
    title: 'ক্রীড়া, বিতর্ক ও সুস্থ সাংস্কৃতিক চর্চা',
    subtitle: 'পড়াশোনার পাশাপাশি শারীরিক ও মানসিক উৎকর্ষ সাধনে সক্রিয় সহশিক্ষা কার্যক্রম',
    badge: '🏆 সহশিক্ষা ও খেলাধুলা',
    ctaText: 'ফলাফল অনুসন্ধান',
    ctaLink: '/result',
  },
  {
    id: 'slide-5',
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=2000&q=85',
    title: 'সমৃদ্ধ লাইব্রেরি ও নিরবচ্ছিন্ন পাঠচর্চা',
    subtitle: '৫০০০+ মূল্যবান বই, গবেষণা সাময়িকী ও নিয়মিত জাতীয় দৈনিক পত্রিকা সমৃদ্ধ পাঠাগার',
    badge: '📚 ৫০০০+ বইয়ের সংগ্রহ',
    ctaText: 'অনলাইন ভর্তি',
    ctaLink: '/admission',
  },
];

export default function PublicHero({ settings, heroConfig }: PublicHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // 1. Resolve Active Slides
  const slides = useMemo<SlideItem[]>(() => {
    // A. If custom slides exist in heroConfig
    if (heroConfig?.slides && heroConfig.slides.length > 0) {
      const valid = heroConfig.slides.filter((s) => s && s.imageUrl && s.imageUrl.trim() !== '');

      // Multi-slide custom collection
      if (valid.length > 1) {
        return valid.map((s, idx) => ({
          id: s.id || `slide-${idx}`,
          imageUrl: s.imageUrl,
          title: s.title || heroConfig.title || settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
          subtitle: s.subtitle || heroConfig.subtitle || settings?.address || 'গুণগত শিক্ষা ও সুনাগরিক গড়ার আদর্শ বিদ্যাপীঠ',
          badge: heroConfig.badgeText || '🏛️ ঐতিহ্যের ৫৫ বছর',
          ctaText: s.ctaText || heroConfig.primaryCta?.text || 'ভর্তি আবেদন করুন',
          ctaLink: s.ctaLink || heroConfig.primaryCta?.href || '/admission',
        }));
      }

      // Single custom slide
      if (valid.length === 1) {
        const single = valid[0];
        if (single.imageUrl !== '/school-campus.jpg') {
          if (heroConfig.enableSlider === false) {
            return [{
              id: single.id || 'custom-1',
              imageUrl: single.imageUrl,
              title: single.title || heroConfig.title || settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
              subtitle: single.subtitle || heroConfig.subtitle || settings?.address || 'গুণগত শিক্ষা ও সুনাগরিক গড়ার আদর্শ বিদ্যাপীঠ',
              badge: heroConfig.badgeText || '🏛️ ঐতিহ্যের ৫৫ বছর',
              ctaText: single.ctaText || heroConfig.primaryCta?.text || 'ভর্তি আবেদন করুন',
              ctaLink: single.ctaLink || heroConfig.primaryCta?.href || '/admission',
            }];
          }
          // Combine user's uploaded campus photo with curated views for dynamic slideshow
          return [
            {
              id: single.id || 'custom-1',
              imageUrl: single.imageUrl,
              title: single.title || heroConfig.title || settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
              subtitle: single.subtitle || heroConfig.subtitle || settings?.address || 'গুণগত শিক্ষা ও সুনাগরিক গড়ার আদর্শ বিদ্যাপীঠ',
              badge: heroConfig.badgeText || '🏛️ ঐতিহ্যের ৫৫ বছর',
              ctaText: single.ctaText || heroConfig.primaryCta?.text || 'ভর্তি আবেদন করুন',
              ctaLink: single.ctaLink || heroConfig.primaryCta?.href || '/admission',
            },
            ...CURATED_DEFAULT_SLIDES.slice(1),
          ];
        }
      }
    }

    // B. If a custom single school photo exists
    const customPhoto = heroConfig?.bgImage || settings?.schoolPhoto;
    if (customPhoto && customPhoto !== '/school-campus.jpg') {
      if (heroConfig?.enableSlider === false) {
        return [{
          id: 'custom-photo-single',
          imageUrl: customPhoto,
          title: heroConfig?.title || settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
          subtitle: heroConfig?.subtitle || settings?.address || 'গুণগত শিক্ষা ও সুনাগরিক গড়ার আদর্শ বিদ্যাপীঠ',
          badge: heroConfig?.badgeText || '🏛️ ঐতিহ্যের ৫৫ বছর',
          ctaText: heroConfig?.primaryCta?.text || 'ভর্তি আবেদন করুন',
          ctaLink: heroConfig?.primaryCta?.href || '/admission',
        }];
      }
      return [
        {
          id: 'custom-photo-single',
          imageUrl: customPhoto,
          title: heroConfig?.title || settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
          subtitle: heroConfig?.subtitle || settings?.address || 'গুণগত শিক্ষা ও সুনাগরিক গড়ার আদর্শ বিদ্যাপীঠ',
          badge: heroConfig?.badgeText || '🏛️ ঐতিহ্যের ৫৫ বছর',
          ctaText: heroConfig?.primaryCta?.text || 'ভর্তি আবেদন করুন',
          ctaLink: heroConfig?.primaryCta?.href || '/admission',
        },
        ...CURATED_DEFAULT_SLIDES.slice(1),
      ];
    }

    // C. Curated high-res default slides
    return CURATED_DEFAULT_SLIDES.map((s, i) => ({
      ...s,
      title: i === 0 && (heroConfig?.title || settings?.schoolName) ? (heroConfig?.title || settings?.schoolName!) : s.title,
      subtitle: i === 0 && (heroConfig?.subtitle || settings?.address) ? (heroConfig?.subtitle || settings?.address!) : s.subtitle,
      badge: heroConfig?.badgeText || s.badge,
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

  // Keep currentIndex valid
  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
      setPreviousIndex(null);
    }
  }, [slides.length, currentIndex]);

  const goToSlide = (newIndex: number) => {
    if (newIndex === currentIndex || newIndex < 0 || newIndex >= slides.length) return;
    setPreviousIndex(currentIndex);
    setCurrentIndex(newIndex);
  };

  const handlePrev = () => {
    goToSlide(currentIndex === 0 ? slides.length - 1 : currentIndex - 1);
  };

  const handleNext = () => {
    goToSlide((currentIndex + 1) % slides.length);
  };

  // 5.5-second auto slideshow transition
  useEffect(() => {
    if (slides.length <= 1 || isPaused || heroConfig?.enableSlider === false) return;

    const timer = setInterval(() => {
      setPreviousIndex(currentIndex);
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [slides.length, isPaused, heroConfig?.enableSlider, currentIndex]);

  const activeSlide = slides[currentIndex] || slides[0];

  // Calculate gentle, non-darkening overlay opacity (max 35% to prevent dull gloomy visuals)
  const effectiveOverlayOpacity = Math.min(
    Math.max((heroConfig?.bgOverlayOpacity ?? 25) / 100, 0.1),
    0.35
  );

  return (
    <section
      id="home"
      aria-label="Campus Hero Gallery"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="group relative w-full h-[70vh] sm:h-[78vh] lg:h-[86vh] min-h-[480px] max-h-[860px] overflow-hidden bg-slate-900 select-none flex items-center justify-center"
    >
      {/* ── Slide Images with Ken Burns Auto-Zoom & Seamless Crossfade ── */}
      {slides.map((slide, index) => {
        const isCurrent = index === currentIndex;
        const isPrevious = index === previousIndex;

        return (
          <div
            key={slide.id + '-' + index}
            aria-hidden={!isCurrent}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isCurrent
                ? 'opacity-100 z-10'
                : isPrevious
                ? 'opacity-100 z-[5]'
                : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* The Image Layer: Ken Burns smooth slow zoom from 100% to 106% over 7 seconds */}
            <div
              className={`w-full h-full bg-cover bg-center transition-transform duration-[7000ms] ease-out will-change-transform ${
                isCurrent ? 'scale-[1.06]' : 'scale-100'
              }`}
              style={{
                backgroundImage: `url('${slide.imageUrl}')`,
              }}
            />
          </div>
        );
      })}

      {/* ── Subtle Photographic Vignette & Clean Contrast (Bright & Vibrant) ── */}
      {/* 1. Soft overall tint for image pop without darkening trees/sky */}
      <div
        className="absolute inset-0 z-20 pointer-events-none bg-slate-950 transition-opacity duration-500"
        style={{ opacity: effectiveOverlayOpacity }}
      />
      {/* 2. Gentle cinematic gradient: subtle dark top for header, transparent center, soft ground fade */}
      <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-slate-950/70 via-transparent to-black/30" />
      {/* 3. Soft seamless blend to the next section */}
      <div className="absolute bottom-0 left-0 right-0 h-16 z-20 pointer-events-none bg-gradient-to-t from-slate-900/40 to-transparent" />

      {/* ── Institutional Overlay Content ── */}
      <div className="relative z-30 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white space-y-4 sm:space-y-6 pt-8 sm:pt-12">
        {/* Sleek Frosted Glassmorphism Card for Crystal-Clear Text & Luxury Feel */}
        <div
          key={`hero-card-${currentIndex}`}
          className="relative overflow-hidden p-6 sm:p-10 rounded-3xl backdrop-blur-[3px] bg-slate-950/25 border border-white/15 shadow-2xl space-y-4 sm:space-y-6"
        >
          {/* Eyebrow Badge */}
          {(activeSlide?.badge || heroConfig?.badgeText) && (
            <div className="animate-hero-text-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/25 backdrop-blur-md border border-indigo-400/30 text-amber-300 text-xs sm:text-sm font-bold shadow-lg">
              <Award className="w-4 h-4 text-amber-400 shrink-0 animate-float-slow" />
              <span>{activeSlide?.badge || heroConfig?.badgeText}</span>
            </div>
          )}

          {/* Main School Heading */}
          <h1 className="animate-hero-text-2 text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)] text-white font-sans leading-tight">
            {activeSlide?.title || heroConfig?.title || settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
          </h1>

          {/* Subtitle / Location */}
          <p className="animate-hero-text-3 text-sm sm:text-lg text-slate-100 max-w-2xl mx-auto font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] leading-relaxed">
            {activeSlide?.subtitle || heroConfig?.subtitle || settings?.address || 'গুণগত শিক্ষা ও সুনাগরিক গড়ার আদর্শ বিদ্যাপীঠ'}
          </p>

          {/* Action Buttons (CTAs) */}
          <div className="animate-hero-text-4 flex flex-wrap items-center justify-center gap-3 pt-2">
            {heroConfig?.primaryCta?.visible !== false && (
              <Link
                href={activeSlide?.ctaLink || heroConfig?.primaryCta?.href || '/admission'}
                className="group/btn px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2"
              >
                <span>{activeSlide?.ctaText || heroConfig?.primaryCta?.text || 'ভর্তি আবেদন করুন'}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </Link>
            )}

            {heroConfig?.secondaryCta?.visible !== false && (
              <Link
                href={heroConfig?.secondaryCta?.href || '/result'}
                className="px-6 py-3.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30 font-black text-xs sm:text-sm shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2"
              >
                <span>{heroConfig?.secondaryCta?.text || 'ফলাফল অনুসন্ধান'}</span>
              </Link>
            )}
          </div>

          {/* Smooth Auto-Slide Progress Bar at bottom of Glass Card */}
          {slides.length > 1 && !isPaused && heroConfig?.enableSlider !== false && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-indigo-400 animate-hero-timer" />
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation Arrows (Appear on Hover) ── */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="পূর্ববর্তী স্লাইড"
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 -ml-0.5" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="পরবর্তী স্লাইড"
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
          >
            <ChevronRight className="w-6 h-6 -mr-0.5" />
          </button>
        </>
      )}

      {/* ── Bottom Navigation Dots Indicator ── */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-xl">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToSlide(i)}
              aria-label={`স্লাইড ${i + 1}`}
              className={`transition-all duration-300 cursor-pointer rounded-full ${
                i === currentIndex
                  ? 'w-8 h-2.5 bg-gradient-to-r from-amber-400 to-amber-300 shadow-md shadow-amber-500/50'
                  : 'w-2.5 h-2.5 bg-white/45 hover:bg-white/80'
              }`}
            />
          ))}
          <span className="text-[11px] font-mono font-bold text-white/90 ml-1">
            {String(currentIndex + 1).padStart(2, '0')}/{String(slides.length).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* ── Admin Floating Quick Shortcut to Edit Slides ── */}
      <div className="absolute bottom-6 right-4 sm:right-6 z-30">
        <Link
          href="/dashboard/landing-page?tab=hero"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-indigo-600 text-[11px] font-bold text-slate-200 hover:text-white backdrop-blur-md transition-all shadow-lg border border-white/15"
          title="ব্যানার ও ট্রানজিশন স্লাইড পরিবর্তন করুন"
        >
          <Camera className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">স্লাইডার ছবি পরিবর্তন</span>
        </Link>
      </div>
    </section>
  );
}
