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
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
}

// Curated high-resolution academic campus photography fallback (used only if no school photos exist)
const DEFAULT_HERO_IMAGES = [
  '/school-campus.jpg',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=2000&q=85',
  'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2000&q=85',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=2000&q=85',
  'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=2000&q=85',
];

export default function PublicHero({ settings, heroConfig }: PublicHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Collect active slides: PRIORITIZE custom slides completely over stock defaults
  const slides = useMemo<SlideItem[]>(() => {
    // 1. If custom slides are explicitly configured in heroConfig, use ONLY those!
    if (heroConfig?.slides && heroConfig.slides.length > 0) {
      const valid = heroConfig.slides.filter((s) => s && s.imageUrl && s.imageUrl.trim() !== '');
      if (valid.length > 0) {
        return valid.map((s, idx) => ({
          id: s.id || `slide-${idx}`,
          imageUrl: s.imageUrl,
          title: s.title || heroConfig.title || settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
          subtitle: s.subtitle || heroConfig.subtitle || settings?.address || 'গুণগত শিক্ষা ও সুনাগরিক গড়ার আদর্শ বিদ্যাপীঠ',
          ctaText: s.ctaText || heroConfig.primaryCta?.text || 'ভর্তি তথ্য',
          ctaLink: s.ctaLink || heroConfig.primaryCta?.href || '/admission',
        }));
      }
    }

    // 2. If a single school photo or hero bgImage is configured
    const customPhoto = heroConfig?.bgImage || settings?.schoolPhoto;
    if (customPhoto && customPhoto !== '/school-campus.jpg') {
      return [
        {
          id: 'custom-photo-single',
          imageUrl: customPhoto,
          title: heroConfig?.title || settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
          subtitle: heroConfig?.subtitle || settings?.address || 'গুণগত শিক্ষা ও সুনাগরিক গড়ার আদর্শ বিদ্যাপীঠ',
          ctaText: heroConfig?.primaryCta?.text || 'ভর্তি আবেদন',
          ctaLink: heroConfig?.primaryCta?.href || '/admission',
        },
      ];
    }

    // 3. Fallback only if no custom slides or photos exist at all
    return DEFAULT_HERO_IMAGES.map((url, i) => ({
      id: `default-${i}`,
      imageUrl: url,
      title: heroConfig?.title || settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
      subtitle: heroConfig?.subtitle || settings?.address || 'গুণগত শিক্ষা ও সুনাগরিক গড়ার আদর্শ বিদ্যাপীঠ',
      ctaText: 'ভর্তি তথ্য',
      ctaLink: '/admission',
    }));
  }, [
    heroConfig?.slides,
    heroConfig?.bgImage,
    heroConfig?.title,
    heroConfig?.subtitle,
    heroConfig?.primaryCta,
    settings?.schoolPhoto,
    settings?.schoolName,
    settings?.address,
  ]);

  // Ensure currentIndex stays within bounds when slides change
  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  // Smooth auto-advance slideshow timer (transitions every 5.5s)
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const activeSlide = slides[currentIndex] || slides[0];
  const overlayOpacity = Math.min(Math.max((heroConfig?.bgOverlayOpacity || 45) / 100, 0.2), 0.85);

  return (
    <section
      id="home"
      aria-label="Campus Hero Gallery"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="group relative w-full h-[68vh] sm:h-[76vh] lg:h-[84vh] min-h-[460px] max-h-[850px] overflow-hidden bg-slate-950 select-none flex items-center justify-center"
    >
      {/* ── Slide Images with Ken Burns Auto-Zoom & Crossfade Transition ── */}
      {slides.map((slide, index) => {
        const isActive = index === currentIndex;

        return (
          <div
            key={slide.id + index}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-1200 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* The Image Layer: smooth scale zoom from 100% to 108% over 6 seconds */}
            <div
              className={`w-full h-full bg-cover bg-center transition-transform duration-[6000ms] ease-out will-change-transform ${
                isActive ? 'scale-[1.08]' : 'scale-100'
              }`}
              style={{
                backgroundImage: `url('${slide.imageUrl}')`,
              }}
            />
          </div>
        );
      })}

      {/* ── Dynamic Dark Overlay for Readable Text & Visual Depth ── */}
      <div
        className="absolute inset-0 z-20 pointer-events-none bg-slate-950 transition-opacity duration-500"
        style={{ opacity: overlayOpacity }}
      />
      <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-slate-950 via-slate-950/30 to-black/50" />
      <div className="absolute bottom-0 left-0 right-0 h-28 z-20 pointer-events-none bg-gradient-to-t from-white dark:from-slate-950 to-transparent" />

      {/* ── Institutional Overlay Content ── */}
      <div className="relative z-30 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white space-y-4 sm:space-y-6 pt-12 sm:pt-16">
        {/* Top Eyebrow Badge */}
        {heroConfig?.badgeText && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-amber-300 text-xs sm:text-sm font-bold shadow-lg animate-fade-in">
            <Award className="w-4 h-4 text-amber-400" />
            <span>{heroConfig.badgeText}</span>
          </div>
        )}

        {/* Main School Heading */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight drop-shadow-md text-white font-sans">
          {activeSlide?.title || heroConfig?.title || settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
        </h1>

        {/* Subtitle / Location */}
        <p className="text-sm sm:text-lg text-slate-200 max-w-2xl mx-auto font-medium drop-shadow leading-relaxed">
          {activeSlide?.subtitle || heroConfig?.subtitle || settings?.address || 'গুণগত শিক্ষা ও সুনাগরিক গড়ার আদর্শ বিদ্যাপীঠ'}
        </p>

        {/* Action Buttons (CTAs) */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {heroConfig?.primaryCta?.visible !== false && (
            <Link
              href={heroConfig?.primaryCta?.href || '/admission'}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>{heroConfig?.primaryCta?.text || 'ভর্তি আবেদন করুন'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {heroConfig?.secondaryCta?.visible !== false && (
            <Link
              href={heroConfig?.secondaryCta?.href || '/result'}
              className="px-6 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/30 font-black text-xs sm:text-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>{heroConfig?.secondaryCta?.text || 'ফলাফল অনুসন্ধান'}</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Navigation Arrows (Appear on Hover) ── */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 -ml-0.5" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Slide"
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
          >
            <ChevronRight className="w-6 h-6 -mr-0.5" />
          </button>
        </>
      )}

      {/* ── Bottom Navigation Dots Indicator ── */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-lg">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`transition-all duration-300 cursor-pointer rounded-full ${
                i === currentIndex
                  ? 'w-7 sm:w-8 h-2 bg-indigo-400 shadow-sm'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
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
