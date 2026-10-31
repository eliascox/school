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

/**
 * Wraps any landing page section with smooth scroll-triggered entrance animations
 * AND automatically staggers internal grid cards/items for a rich, fluid experience.
 */
export function ScrollRevealSection({
  children,
  variant = 'fade-up',
  delayMs = 0,
  className = '',
  sectionKey,
}: ScrollRevealSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Respect prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    // Tag direct children of grids inside this section for staggered cascade animation
    const grids = el.querySelectorAll('.grid');
    grids.forEach((grid) => {
      Array.from(grid.children).forEach((child, idx) => {
        const htmlChild = child as HTMLElement;
        htmlChild.setAttribute('data-stagger-child', 'true');
        htmlChild.style.setProperty('--stagger-index', String(Math.min(idx, 10)));
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -45px 0px',
      }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [sectionKey]);

  return (
    <div
      ref={containerRef}
      data-reveal-section={variant}
      data-revealed={isVisible ? 'true' : 'false'}
      style={{ transitionDelay: delayMs ? `${delayMs}ms` : undefined }}
      className={`scroll-reveal-wrapper ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Global Landing Page Smooth Scroll Progress Bar + Floating Back-to-Top Button with SVG Progress Ring
 */
export function LandingScrollFeatures() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(Math.max((scrollTop / docHeight) * 100, 0), 100) : 0;
      setScrollProgress(pct);
      setShowBackToTop(scrollTop > 380);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // SVG circle parameters
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <>
      {/* 1. Top Smooth Scroll Reading Progress Bar */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 h-1 z-[100] pointer-events-none bg-transparent print:hidden"
      >
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 shadow-[0_0_12px_rgba(16,185,129,0.75)] transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. Floating Back-to-Top Button with Circular Progress Ring */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="পেজের উপরে যান"
        title="পেজের উপরে যান (Back to Top)"
        className={`fixed bottom-6 right-5 sm:bottom-8 sm:right-8 z-50 w-12 h-12 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xl shadow-emerald-950/15 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-slate-950 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer print:hidden ${
          showBackToTop
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 48 48">
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="opacity-15"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-150 ease-out"
          />
        </svg>
        <ArrowUp className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:-translate-y-0.5" />
      </button>
    </>
  );
}
