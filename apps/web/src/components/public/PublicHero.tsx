'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';
import { HeroConfig } from '@/services/landingPageService';

interface PublicHeroProps {
  settings?: SchoolSettings | null;
  heroConfig?: HeroConfig | null;
}

// Curated high-resolution academic campus photography
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

  // Collect all available unique images (settings photo, hero slides, and defaults)
  const images = useMemo(() => {
    const list: string[] = [];

    // 1. Primary custom school photo
    if (settings?.schoolPhoto) {
      list.push(settings.schoolPhoto);
    }
    if (heroConfig?.bgImage && !list.includes(heroConfig.bgImage)) {
      list.push(heroConfig.bgImage);
    }

    // 2. Custom slides if configured
    if (heroConfig?.slides && heroConfig.slides.length > 0) {
      heroConfig.slides.forEach((s) => {
        if (s.imageUrl && !list.includes(s.imageUrl)) {
          list.push(s.imageUrl);
        }
      });
    }

    // 3. Fallback curated campus photos
    DEFAULT_HERO_IMAGES.forEach((url) => {
      if (!list.includes(url)) {
        list.push(url);
      }
    });

    return list.slice(0, 6);
  }, [settings?.schoolPhoto, heroConfig?.bgImage, heroConfig?.slides]);

  // Smooth auto-advance slideshow timer (transitions every 5.5s)
  useEffect(() => {
    if (images.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [images.length, isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <section
      id="home"
      aria-label="Campus Hero Gallery"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="group relative w-full h-[65vh] sm:h-[75vh] lg:h-[82vh] min-h-[440px] max-h-[820px] overflow-hidden bg-slate-900 select-none"
    >
      {/* ── Slide Images with Ken Burns Auto-Zoom & Crossfade Transition ── */}
      {images.map((imgUrl, index) => {
        const isActive = index === currentIndex;

        return (
          <div
            key={imgUrl + index}
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
                backgroundImage: `url('${imgUrl}')`,
              }}
            />
          </div>
        );
      })}

      {/* ── Soft Vignette Gradient Overlays for Visual Depth ── */}
      <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-black/30" />
      <div className="absolute bottom-0 left-0 right-0 h-24 z-20 pointer-events-none bg-gradient-to-t from-white/90 dark:from-slate-950/90 to-transparent" />

      {/* ── Navigation Arrows (Appear on Hover) ── */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/25 hover:bg-black/50 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 -ml-0.5" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Slide"
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/25 hover:bg-black/50 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
          >
            <ChevronRight className="w-6 h-6 -mr-0.5" />
          </button>
        </>
      )}

      {/* ── Minimalist Bottom Navigation Dots Indicator ── */}
      {images.length > 1 && (
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/20 shadow-lg">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`transition-all duration-300 cursor-pointer rounded-full ${
                i === currentIndex
                  ? 'w-7 sm:w-8 h-2 bg-white shadow-sm'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}