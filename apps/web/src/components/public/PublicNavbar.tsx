'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Award,
  BarChart3,
  Building2,
  ChevronDown,
  FileBadge2,
  GraduationCap,
  Laptop,
  Layers,
  LogIn,
  Menu,
  Search,
  ShieldCheck,
  Smartphone,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { HeaderConfig } from '@/services/landingPageService';
import {
  PUBLIC_ACADEMIC_ITEMS,
  PUBLIC_PRIMARY_LINKS,
  PUBLIC_SECONDARY_LINKS,
  PUBLIC_SECTION_TO_NAV,
  PublicAcademicMenuItem,
  PublicNavKey,
  resolvePublicHref,
} from '@/lib/publicLandingUtils';

interface PublicNavbarProps {
  settings?: SchoolSettings | null;
  headerConfig?: HeaderConfig | null;
  isOverHero?: boolean;
}

const TONE_CLASSES: Record<PublicAcademicMenuItem['tone'], string> = {
  indigo: 'bg-indigo-50 border-indigo-200/80 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300',
  violet: 'bg-violet-50 border-violet-200/80 text-violet-700 dark:bg-violet-950/60 dark:border-violet-800 dark:text-violet-300',
  emerald: 'bg-emerald-50 border-emerald-200/80 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300',
  sky: 'bg-sky-50 border-sky-200/80 text-sky-700 dark:bg-sky-950/60 dark:border-sky-800 dark:text-sky-300',
  amber: 'bg-amber-50 border-amber-200/80 text-amber-700 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300',
  teal: 'bg-teal-50 border-teal-200/80 text-teal-700 dark:bg-teal-950/60 dark:border-teal-800 dark:text-teal-300',
  rose: 'bg-rose-50 border-rose-200/80 text-rose-700 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300',
};

function renderAcademicIcon(key: PublicAcademicMenuItem['iconKey'], className = 'w-4 h-4') {
  switch (key) {
    case 'user-tie':
      return <UserCheck className={className} />;
    case 'teachers':
      return <Users className={className} />;
    case 'layers':
      return <Layers className={className} />;
    case 'stats':
      return <BarChart3 className={className} />;
    case 'trophy':
      return <Trophy className={className} />;
    case 'facilities':
      return <Laptop className={className} />;
    case 'committee':
      return <ShieldCheck className={className} />;
    default:
      return <Building2 className={className} />;
  }
}

interface PublicLogoMarkProps {
  schoolLogo?: string | null;
  logoError: boolean;
  onLogoError: () => void;
  schoolName: string;
  size?: string;
}

function PublicLogoMark({
  schoolLogo,
  logoError,
  onLogoError,
  schoolName,
  size = 'w-10 h-10 sm:w-11 sm:h-11',
}: PublicLogoMarkProps) {
  return (
    <div
      className={`${size} rounded-xl bg-gradient-to-tr from-[#0B5D3B] to-teal-500 p-0.5 shadow-md shadow-emerald-900/15 group-hover:scale-105 transition-transform duration-300 shrink-0`}
    >
      <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center overflow-hidden p-1">
        {schoolLogo && !logoError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={schoolLogo}
            alt={schoolName}
            className="w-full h-full object-contain"
            onError={onLogoError}
          />
        ) : (
          <GraduationCap className="w-5 h-5 text-[#0B5D3B] dark:text-emerald-400" />
        )}
      </div>
    </div>
  );
}

export default function PublicNavbar({
  settings,
  headerConfig,
  isOverHero = true,
}: PublicNavbarProps) {
  const pathname = usePathname() || '/';
  const isHomePage = pathname === '/' || pathname === '' || pathname === '/index.html';

  const [activeSettings, setActiveSettings] = useState<SchoolSettings | null>(settings || null);
  const [logoError, setLogoError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [academicsOpen, setAcademicsOpen] = useState(false);
  const [mobileAcademicsOpen, setMobileAcademicsOpen] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState<PublicNavKey>('home');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = settingsService.getSettings();
      if (stored) setActiveSettings(stored);
    } catch {}

    const unsub = settingsService.subscribe((s) => {
      if (s) {
        setActiveSettings((prev) => {
          if (
            prev &&
            prev.schoolName === s.schoolName &&
            prev.schoolLogo === s.schoolLogo &&
            prev.eiin === s.eiin
          ) {
            return prev;
          }
          return s;
        });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (settings) setActiveSettings(settings);
  }, [settings]);

  const schoolLogo =
    activeSettings?.schoolLogo || settings?.schoolLogo || headerConfig?.logoUrl || '/logo.png';
  const schoolName =
    activeSettings?.schoolName?.trim() ||
    headerConfig?.schoolName?.trim() ||
    settings?.schoolName?.trim() ||
    'বরইতলী উচ্চ বিদ্যালয়';
  const schoolSlogan = headerConfig?.schoolSlogan?.trim() || 'জ্ঞানে ও আলোয় আলোকিত ভবিষ্যৎ';

  useEffect(() => {
    setLogoError(false);
  }, [schoolLogo]);

  // Outside click & Escape handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAcademicsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAcademicsOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  // Prevent background scroll when mobile menu sheet is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileMenuOpen]);

  // Scrolled state
  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      setIsScrolled(window.scrollY > 24);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-spy on homepage
  useEffect(() => {
    if (!isHomePage || typeof IntersectionObserver === 'undefined') return;
    let observer: IntersectionObserver | null = null;

    const timer = window.setTimeout(() => {
      const targets = Object.keys(PUBLIC_SECTION_TO_NAV)
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => Boolean(el));

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const key = PUBLIC_SECTION_TO_NAV[entry.target.id];
              if (key) setActiveNav(key);
            }
          });
        },
        { rootMargin: '-32% 0px -58% 0px', threshold: 0 }
      );
      targets.forEach((el) => observer!.observe(el));
    }, 350);

    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [isHomePage]);

  const handleAnchorClick = (e: React.MouseEvent, rawHref: string, navKey?: PublicNavKey) => {
    if (!isHomePage) {
      setAcademicsOpen(false);
      setMobileMenuOpen(false);
      return;
    }

    if (rawHref === '#home' || rawHref === '#') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname);
      }
      setActiveNav('home');
      setAcademicsOpen(false);
      setMobileMenuOpen(false);
      return;
    }

    if (rawHref.startsWith('#')) {
      const targetId = rawHref.slice(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        e.preventDefault();
        // Force immediate reveal on any scroll-reveal ancestor so target is never faded
        const revealWrap = targetEl.closest('.scroll-reveal-wrapper') as HTMLElement | null;
        if (revealWrap) {
          revealWrap.setAttribute('data-revealed', 'true');
          revealWrap.setAttribute('data-reveal-done', 'true');
        }
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', rawHref);
        if (navKey) setActiveNav(navKey);
      }
    }

    setAcademicsOpen(false);
    setMobileMenuOpen(false);
  };

  const linkClass = (key: PublicNavKey) =>
    `relative px-3 py-2 rounded-xl transition-all duration-200 whitespace-nowrap ${
      isHomePage && activeNav === key
        ? 'text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 font-bold ring-1 ring-emerald-200/80 dark:ring-emerald-800/70'
        : 'text-slate-700 dark:text-slate-200 hover:text-[#0B5D3B] dark:hover:text-emerald-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 font-semibold'
    }`;

  return (
    <>
      {!isOverHero && <div className="h-20 sm:h-24 shrink-0 print:hidden" aria-hidden="true" />}

      {/* Mobile Dimmed Backdrop (prevents Hero overlap / bleed-through) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[55] bg-slate-950/50 backdrop-blur-xs xl:hidden"
          aria-hidden="true"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="fixed top-2.5 sm:top-3.5 left-0 right-0 z-[60] max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pointer-events-none transition-all duration-300 print:hidden">
        <nav
          aria-label="প্রধান নেভিগেশন"
          className={`animate-navbar-enter rounded-2xl px-3.5 sm:px-5 flex items-center justify-between gap-3 pointer-events-auto transition-all duration-300 ease-out border ${
            isScrolled
              ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200/90 dark:border-slate-800 py-2 sm:py-2.5 shadow-[0_18px_40px_-14px_rgba(15,23,42,0.18)]'
              : 'bg-white/90 dark:bg-slate-900/88 backdrop-blur-xl border-white/80 dark:border-slate-800/90 py-2.5 sm:py-3 shadow-[0_14px_34px_-12px_rgba(15,23,42,0.14)]'
          }`}
        >
          {/* School Logo & Title */}
          <Link
            href={resolvePublicHref('#home', pathname)}
            onClick={(e) => handleAnchorClick(e, '#home', 'home')}
            className="flex items-center gap-2.5 sm:gap-3 group shrink-0 min-w-0 max-w-[68vw] sm:max-w-none"
          >
            <PublicLogoMark
              schoolLogo={schoolLogo}
              logoError={logoError}
              onLogoError={() => setLogoError(true)}
              schoolName={schoolName}
            />
            <div className="min-w-0 leading-tight">
              <span className="block font-extrabold text-sm sm:text-base lg:text-[17px] tracking-tight text-slate-900 dark:text-white truncate">
                {schoolName}
              </span>
              {schoolSlogan && (
                <span className="hidden sm:block text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[230px]">
                  {schoolSlogan}
                </span>
              )}
            </div>
          </Link>

          {/* Desktop Navigation Menu */}
          <div className="hidden xl:flex items-center gap-1 text-[13px]">
            {PUBLIC_PRIMARY_LINKS.map((l) => (
              <a
                key={l.key}
                href={resolvePublicHref(l.href, pathname)}
                onClick={(e) => handleAnchorClick(e, l.href, l.key)}
                className={linkClass(l.key)}
                aria-current={isHomePage && activeNav === l.key ? 'page' : undefined}
              >
                {l.label}
              </a>
            ))}

            {/* Academics Rich Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={academicsOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  setAcademicsOpen((prev) => !prev);
                }}
                className={`${linkClass('academics')} inline-flex items-center gap-1.5 cursor-pointer`}
              >
                <span>একাডেমিক</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    academicsOpen ? 'rotate-180 text-[#0B5D3B]' : ''
                  }`}
                />
              </button>

              {academicsOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-[340px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/90 p-2.5 z-[70] shadow-[0_24px_60px_-14px_rgba(15,23,42,0.22)] animate-fade-in">
                  <div className="px-3 py-2 text-[11px] font-extrabold tracking-wide text-[#0B5D3B] dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 mb-1.5 flex items-center justify-between">
                    <span>একাডেমিক ও প্রতিষ্ঠান পরিচিতি</span>
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    {PUBLIC_ACADEMIC_ITEMS.map((item) => (
                      <a
                        key={item.href}
                        href={resolvePublicHref(item.href, pathname)}
                        onClick={(e) => handleAnchorClick(e, item.href, 'academics')}
                        className="flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-emerald-50/90 dark:hover:bg-emerald-950/40 hover:text-[#0B5D3B] dark:hover:text-emerald-300 transition-colors group/item"
                      >
                        <span
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 group-hover/item:scale-105 transition-transform ${TONE_CLASSES[item.tone]}`}
                        >
                          {renderAcademicIcon(item.iconKey)}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-bold leading-snug">
                            {item.label}
                          </span>
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate">
                            {item.hint}
                          </span>
                        </span>
                      </a>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-1.5">
                    <Link
                      href="/verify-certificate"
                      onClick={() => setAcademicsOpen(false)}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 text-xs font-bold hover:bg-amber-100/80 transition"
                    >
                      <FileBadge2 className="w-3.5 h-3.5" />
                      <span>সনদ যাচাই</span>
                    </Link>
                    <Link
                      href="/mobile-app"
                      onClick={() => setAcademicsOpen(false)}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60 text-xs font-bold hover:bg-sky-100/80 transition"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>মোবাইল অ্যাপ</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {PUBLIC_SECONDARY_LINKS.map((l) => (
              <a
                key={l.key}
                href={resolvePublicHref(l.href, pathname)}
                onClick={(e) => handleAnchorClick(e, l.href, l.key)}
                className={linkClass(l.key)}
                aria-current={isHomePage && activeNav === l.key ? 'true' : undefined}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Link
              href="/result"
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
              <span>ফলাফল</span>
            </Link>
            <Link
              href="/verify-certificate"
              className="hidden lg:inline-flex px-3 py-2 rounded-xl bg-slate-50 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 items-center gap-1.5 transition-colors"
            >
              <FileBadge2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>সনদ যাচাই</span>
            </Link>
            <Link
              href="/admission"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0B5D3B] to-teal-600 hover:from-[#08492e] hover:to-teal-500 text-xs font-bold text-white shadow-md shadow-emerald-900/20 flex items-center gap-1.5 transition-all hover:-translate-y-px"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>অনলাইন ভর্তি</span>
            </Link>
            <Link
              href="/login"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-800 text-xs font-bold text-[#F4B400] flex items-center gap-1.5 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>লগইন</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="xl:hidden p-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
            aria-label={mobileMenuOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {/* Solid Opaque Mobile Drawer Navigation (Zero Bleed-Through) */}
        {mobileMenuOpen && (
          <div className="xl:hidden mt-2 pointer-events-auto animate-fade-in">
            <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-3.5 max-h-[78vh] overflow-y-auto">
              {/* Mobile School Brand Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <PublicLogoMark
                  schoolLogo={schoolLogo}
                  logoError={logoError}
                  onLogoError={() => setLogoError(true)}
                  schoolName={schoolName}
                  size="w-10 h-10"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                    {schoolName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {activeSettings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার'}
                  </p>
                </div>
              </div>

              {/* Primary Portal Action Tiles */}
              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Link
                  href="/admission"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#0B5D3B] to-teal-600 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>অনলাইন ভর্তি</span>
                </Link>
                <Link
                  href="/result"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-xs font-bold text-[#0B5D3B] dark:text-emerald-300 flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-800"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>ফলাফল দেখুন</span>
                </Link>
                <Link
                  href="/verify-certificate"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center justify-center gap-1.5 border border-amber-200/80 dark:border-amber-800/60"
                >
                  <FileBadge2 className="w-3.5 h-3.5" />
                  <span>সনদ যাচাই</span>
                </Link>
                <Link
                  href="/mobile-app"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-xs font-bold text-sky-800 dark:text-sky-300 flex items-center justify-center gap-1.5 border border-sky-200/80 dark:border-sky-800/60"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>মোবাইল অ্যাপ</span>
                </Link>
              </div>

              {/* Section Anchor Links */}
              <div className="space-y-1 text-sm">
                {PUBLIC_PRIMARY_LINKS.map((l) => (
                  <a
                    key={l.key}
                    href={resolvePublicHref(l.href, pathname)}
                    onClick={(e) => handleAnchorClick(e, l.href, l.key)}
                    className={`block ${linkClass(l.key)}`}
                  >
                    {l.label}
                  </a>
                ))}

                {/* Reliable Mobile Academics Accordion */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-slate-50/70 dark:bg-slate-800/40">
                  <button
                    type="button"
                    onClick={() => setMobileAcademicsOpen((prev) => !prev)}
                    aria-expanded={mobileAcademicsOpen}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left text-sm font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
                  >
                    <span>একাডেমিক ও প্রশাসন</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#0B5D3B] dark:text-emerald-400 transition-transform duration-200 ${
                        mobileAcademicsOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {mobileAcademicsOpen && (
                    <div className="px-2 pb-2 pt-0.5 space-y-0.5 border-t border-slate-200/70 dark:border-slate-700/70 bg-white dark:bg-slate-900/70">
                      {PUBLIC_ACADEMIC_ITEMS.map((item) => (
                        <a
                          key={item.href}
                          href={resolvePublicHref(item.href, pathname)}
                          onClick={(e) => handleAnchorClick(e, item.href, 'academics')}
                          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-[#0B5D3B] dark:hover:text-emerald-300 transition-colors"
                        >
                          <span
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${TONE_CLASSES[item.tone]}`}
                          >
                            {renderAcademicIcon(item.iconKey, 'w-3.5 h-3.5')}
                          </span>
                          <span>{item.label}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {PUBLIC_SECONDARY_LINKS.map((l) => (
                  <a
                    key={l.key}
                    href={resolvePublicHref(l.href, pathname)}
                    onClick={(e) => handleAnchorClick(e, l.href, l.key)}
                    className={`block ${linkClass(l.key)}`}
                  >
                    {l.label}
                  </a>
                ))}
              </div>

              {/* Login Portal Action */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#F4B400] font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>অ্যাডমিন লগইন</span>
                </Link>
                <Link
                  href="/login?role=teacher"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>শিক্ষক লগইন</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
