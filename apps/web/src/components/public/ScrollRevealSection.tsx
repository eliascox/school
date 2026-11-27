'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export type RevealVariant = 'fade-up' | 'fade-scale' | 'slide-left' | 'slide-right' | 'blur-up';

interface ScrollRevealSectionProps {
  children: React.ReactNode;
  variant?: RevealVariant;
  delayMs?: number;
  className?: string;
  sectionKey?: string;
}

function tagSectionChildrenForMotion(root: HTMLElement) {
  const headerContainers = root.querySelectorAll('.text-center.max-w-3xl, .text-center.max-w-4xl');
  headerContainers.forEach((hdr) => {
    Array.from(hdr.children).forEach((child, idx) => {
      const htmlChild = child as HTMLElement;
      if (!htmlChild.hasAttribute('data-reveal-header-item')) {
        htmlChild.setAttribute('data-reveal-header-item', 'true');
        htmlChild.style.setProperty('--header-index', String(Math.min(idx, 4)));
      }
    });
  });

  const grids = root.querySelectorAll('.grid');
  grids.forEach((grid) => {
    Array.from(grid.children).forEach((child, idx) => {
      const htmlChild = child as HTMLElement;
      if (!htmlChild.hasAttribute('data-stagger-child')) {
        htmlChild.setAttribute('data-stagger-child', 'true');
        htmlChild.style.setProperty('--stagger-index', String(Math.min(idx, 8)));
      }
    });
  });
}

/**
 * Progressive scroll-reveal wrapper that NEVER leaves below-the-fold sections stuck
 * blank on initial load, fast scrolling, or anchor-hash jumps.
 */
export function ScrollRevealSection({
  children,
  variant = 'fade-up',
  delayMs = 0,
  className = '',
  sectionKey,
}: ScrollRevealSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Start visible by default for SSR & instant paint, then smoothly enhance below-fold sections
  const [isVisible, setIsVisible] = useState(true);
  const [isDone, setIsDone] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof window === 'undefined') return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      setIsDone(true);
      return;
    }

    const rect = el.getBoundingClientRect();
    const isNearViewport = rect.top < window.innerHeight + 180;

    // Never hide sections already in or close to the initial viewport
    if (isNearViewport || window.location.hash) {
      setIsVisible(true);
      setIsDone(true);
      return;
    }

    tagSectionChildrenForMotion(el);
    setIsVisible(false);
    setIsDone(false);

    const revealNow = () => {
      setIsVisible(true);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight + 140) {
            revealNow();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.01,
        rootMargin: '160px 0px 140px 0px',
      }
    );

    observer.observe(el);

    // Reveal immediately on hash change so anchor jumps never land on a hidden wrapper
    const onHashChange = () => {
      revealNow();
      setIsDone(true);
    };
    window.addEventListener('hashchange', onHashChange);

    // Safety fallback timer so no section can ever remain stuck invisible
    const safetyScrollCheck = () => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight + 220) {
        revealNow();
        window.removeEventListener('scroll', safetyScrollCheck);
      }
    };
    window.addEventListener('scroll', safetyScrollCheck, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('scroll', safetyScrollCheck);
    };
  }, [sectionKey]);

  useEffect(() => {
    if (!isVisible || isDone) return;
    const timer = window.setTimeout(() => {
      setIsDone(true);
    }, 700 + delayMs);
    return () => window.clearTimeout(timer);
  }, [isVisible, isDone, delayMs]);

  return (
    <div
      ref={containerRef}
      data-reveal-section={variant}
      data-revealed={isVisible ? 'true' : 'false'}
      data-reveal-done={isDone ? 'true' : 'false'}
      style={{ transitionDelay: delayMs && !isDone ? `${delayMs}ms` : undefined }}
      className={`scroll-reveal-wrapper ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Global Landing Page Smooth Scroll Progress Bar + Single Floating Back-to-Top Orb
 */
export function LandingScrollFeatures() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    let ticking = false;
    let lastPct = -1;
    let lastShow: boolean | null = null;

    const update = () => {
      ticking = false;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(Math.max((scrollTop / docHeight) * 100, 0), 100) : 0;
      const roundedPct = Math.round(pct * 10) / 10;
      if (roundedPct !== lastPct) {
        lastPct = roundedPct;
        setScrollProgress(roundedPct);
      }
      const show = scrollTop > 420;
      if (show !== lastShow) {
        lastShow = show;
        setShowBackToTop(show);
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const radius = 19;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <>
      {/* Top Smooth Scroll Progress Bar */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 h-1 z-[100] pointer-events-none bg-transparent print:hidden"
      >
        <div
          className="h-full origin-left bg-gradient-to-r from-[#0B5D3B] via-emerald-500 to-[#F4B400] shadow-[0_0_8px_rgba(11,93,59,0.5)] transition-transform duration-150 ease-out will-change-transform"
          style={{ transform: `scaleX(${scrollProgress / 100})` }}
        />
      </div>

      {/* Single Floating Back-to-Top Button with SVG Progress Ring */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="পেজের উপরে যান"
        title="পেজের উপরে যান"
        className={`group fixed bottom-5 right-4 sm:bottom-7 sm:right-7 z-40 w-11 h-11 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg shadow-emerald-950/15 border border-emerald-200/90 dark:border-emerald-800/70 flex items-center justify-center text-[#0B5D3B] dark:text-emerald-400 hover:bg-[#0B5D3B] hover:text-white dark:hover:bg-emerald-500 dark:hover:text-slate-950 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer print:hidden ${
          showBackToTop
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 44 44">
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            className="opacity-15"
          />
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-150 ease-out"
          />
        </svg>
        <ArrowUp className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:-translate-y-0.5" />
      </button>
    </>
  );
}
