'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { HeaderConfig } from '@/services/landingPageService';

interface PublicNavbarProps {
  settings?: SchoolSettings | null;
  headerConfig?: HeaderConfig | null;
  isOverHero?: boolean;
}

type NavKey = 'home' | 'about' | 'academics' | 'notices' | 'gallery' | 'contact';

const PRIMARY_LINKS: { key: NavKey; label: string; href: string }[] = [
  { key: 'home', label: 'প্রচ্ছদ', href: '#home' },
  { key: 'about', label: 'পরিচিতি', href: '#about' },
];

const SECONDARY_LINKS: { key: NavKey; label: string; href: string }[] = [
  { key: 'notices', label: 'নোটিশ', href: '#notices' },
  { key: 'gallery', label: 'গ্যালারি', href: '#gallery' },
  { key: 'contact', label: 'যোগাযোগ', href: '#contact' },
];

const ACADEMIC_ITEMS = [
  { href: '#headmaster', label: 'নেতৃবৃন্দের বাণী', hint: 'সভাপতি ও প্রধান শিক্ষক', icon: 'fa-user-tie', tone: 'indigo' },
  { href: '#faculty', label: 'শিক্ষকমণ্ডলী', hint: 'অভিজ্ঞ ও নিবেদিতপ্রাণ শিক্ষকবৃন্দ', icon: 'fa-chalkboard-user', tone: 'purple' },
  { href: '#academic', label: 'শ্রেণি ও বিভাগ', hint: 'বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা', icon: 'fa-layer-group', tone: 'emerald' },
  { href: '#student-info', label: 'শিক্ষার্থী পরিসংখ্যান', hint: 'শ্রেণিভিত্তিক শিক্ষার্থী সংখ্যা', icon: 'fa-chart-pie', tone: 'sky' },
  { href: '#best-students', label: 'কৃতী শিক্ষার্থী', hint: 'মেধাবী ও সফল শিক্ষার্থীবৃন্দ', icon: 'fa-trophy', tone: 'amber' },
  { href: '#facilities', label: 'সুযোগ-সুবিধা', hint: 'ল্যাব, লাইব্রেরি ও খেলার মাঠ', icon: 'fa-laptop-code', tone: 'teal' },
  { href: '#smc', label: 'পরিচালনা পর্ষদ', hint: 'ম্যানেজিং কমিটির সদস্যবৃন্দ', icon: 'fa-users-gear', tone: 'rose' },
] as const;

const TONE_CLASSES: Record<string, string> = {
  indigo: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-400',
  purple: 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-400',
  emerald: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
  sky: 'bg-sky-500/15 border-sky-500/30 text-sky-700 dark:text-sky-400',
  amber: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400',
  teal: 'bg-teal-500/15 border-teal-500/30 text-teal-700 dark:text-teal-400',
  rose: 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-400',
};

// Which nav item should be highlighted while a given section is on screen
const SECTION_TO_NAV: Record<string, NavKey> = {
  home: 'home',
  services: 'home',
  about: 'about',
  principal: 'academics',
  stats: 'academics',
  academic: 'academics',
  teachers: 'academics',
  committee: 'academics',
  'best-students': 'academics',
  facilities: 'academics',
  notices: 'notices',
  gallery: 'gallery',
  blog: 'gallery',
  contact: 'contact',
  faq: 'contact',
};

export default function PublicNavbar({ settings, headerConfig, isOverHero = true }: PublicNavbarProps) {
  const [activeSettings, setActiveSettings] = useState<SchoolSettings | null>(settings || null);
  const [logoError, setLogoError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [academicsOpen, setAcademicsOpen] = useState(false);
  const [mobileAcademicsOpen, setMobileAcademicsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState<NavKey>('home');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync settings dynamically from settingsService (Settings is primary source of truth)
  useEffect(() => {
    try {
      const stored = settingsService.getSettings();
      if (stored) setActiveSettings(stored);
    } catch (e) {}

    const unsub = settingsService.subscribe((s) => {
      if (s) {
        setActiveSettings((prev) => {
          if (prev && prev.schoolName === s.schoolName && prev.schoolLogo === s.schoolLogo && prev.eiin === s.eiin) {
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

  const schoolLogo = activeSettings?.schoolLogo || settings?.schoolLogo || headerConfig?.logoUrl || '';
  const schoolName = activeSettings?.schoolName || headerConfig?.schoolName || settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const schoolSlogan = headerConfig?.schoolSlogan || '';

  useEffect(() => {
    setLogoError(false);
  }, [schoolLogo]);

  // Close dropdown on outside click & on Escape
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

  // Compact "scrolled" navbar state (rAF throttled)
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

  // Scroll-spy: highlight the menu item of the section currently in view
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    let observer: IntersectionObserver | null = null;

    // Sections mount progressively; attach after first paint
    const timer = window.setTimeout(() => {
      const targets = Object.keys(SECTION_TO_NAV)
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => !!el);

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const key = SECTION_TO_NAV[entry.target.id];
              if (key) setActiveNav(key);
            }
          });
        },
        { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
      );
      targets.forEach((el) => observer!.observe(el));
    }, 400);

    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, []);

  const handleHomeClick = (e: React.MouseEvent) => {
    if (typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '')) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.location.hash) history.replaceState(null, '', ' ');
    }
    setMobileMenuOpen(false);
  };

  const linkClass = (key: NavKey) =>
    `relative px-3 py-2 rounded-xl transition-colors duration-200 ${
      activeNav === key
        ? 'text-[#0B5D3B] dark:text-emerald-400 bg-emerald-600/10 font-bold'
        : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
    }`;

  const LogoMark = ({ size = 'w-11 h-11' }: { size?: string }) => (
    <div className={`${size} rounded-xl bg-gradient-to-tr from-[#0B5D3B] to-teal-500 p-0.5 shadow-lg shadow-emerald-700/20 group-hover:scale-105 transition-transform duration-300 shrink-0`}>
      <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center overflow-hidden p-1">
        {schoolLogo && !logoError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={schoolLogo} alt={schoolName} className="w-full h-full object-contain" onError={() => setLogoError(true)} />
        ) : (
          <i className="fa-solid fa-graduation-cap text-emerald-600 text-lg"></i>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`sticky top-3 sm:top-4 z-50 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pointer-events-none transition-all duration-300 ${
        isOverHero ? '-mb-20 sm:-mb-24' : 'mb-4'
      }`}
    >
      <nav
        aria-label="প্রধান নেভিগেশন"
        className={`glass-nav rounded-2xl px-4 sm:px-6 flex items-center justify-between gap-4 pointer-events-auto transition-all duration-300 ease-out ${
          isScrolled ? 'py-2 sm:py-2.5 shadow-xl shadow-slate-900/10' : 'py-2.5 sm:py-3.5'
        }`}
      >
        {/* School Logo & Title */}
        <Link href="/#home" onClick={handleHomeClick} className="flex items-center gap-3 group shrink-0 min-w-0">
          <LogoMark />
          <div className="min-w-0 leading-tight">
            <span className="block font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white truncate">
              {schoolName}
            </span>
            {schoolSlogan && (
              <span className="hidden sm:block text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {schoolSlogan}
              </span>
            )}
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden xl:flex items-center gap-1 text-sm font-semibold">
          {PRIMARY_LINKS.map((l) =>
            l.key === 'home' ? (
              <a key={l.key} href={l.href} onClick={handleHomeClick} className={linkClass(l.key)} aria-current={activeNav === l.key ? 'page' : undefined}>
                {l.label}
              </a>
            ) : (
              <a key={l.key} href={l.href} className={linkClass(l.key)} aria-current={activeNav === l.key ? 'true' : undefined}>
                {l.label}
              </a>
            )
          )}

          {/* Academics Dropdown */}
          <div className="relative group" ref={dropdownRef}>
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={academicsOpen}
              onClick={(e) => {
                e.stopPropagation();
                setAcademicsOpen(!academicsOpen);
              }}
              className={`${linkClass('academics')} inline-flex items-center gap-1.5`}
            >
              <span>একাডেমিক</span>
              <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-300 ${academicsOpen ? 'rotate-180' : 'group-hover:rotate-180'}`}></i>
            </button>

            <div
              className={`glass-dropdown absolute left-1/2 -translate-x-1/2 mt-3 w-72 rounded-2xl p-2 z-50 transition-all duration-200 ease-out ${
                academicsOpen
                  ? 'visible opacity-100 translate-y-0'
                  : 'invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0'
              }`}
            >
              <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-[#0B5D3B] dark:text-emerald-400 border-b border-slate-200 dark:border-slate-700 mb-1 flex items-center justify-between">
                <span>একাডেমিক ও প্রশাসন</span>
                <i className="fa-solid fa-building-columns text-xs"></i>
              </div>
              {ACADEMIC_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setAcademicsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-emerald-600/10 hover:text-emerald-900 dark:hover:text-emerald-300 transition-colors group/item"
                >
                  <span className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform ${TONE_CLASSES[item.tone]}`}>
                    <i className={`fa-solid ${item.icon} text-xs`}></i>
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold leading-snug">{item.label}</span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate">{item.hint}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          {SECONDARY_LINKS.map((l) => (
            <a key={l.key} href={l.href} className={linkClass(l.key)} aria-current={activeNav === l.key ? 'true' : undefined}>
              {l.label}
            </a>
          ))}
        </div>

        {/* Right Action Buttons */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Link
            href="/result"
            className="px-3.5 py-2 rounded-xl bg-white/70 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <i className="fa-solid fa-magnifying-glass text-[#0B5D3B] dark:text-emerald-400"></i> ফলাফল
          </Link>
          <Link
            href="/admission"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0B5D3B] to-emerald-600 hover:from-emerald-700 hover:to-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-700/25 flex items-center gap-1.5 transition-all hover:-translate-y-px"
          >
            <i className="fa-solid fa-user-plus"></i> অনলাইন ভর্তি
          </Link>
          <Link
            href="/login"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-800 text-xs font-bold text-[#F4B400] flex items-center gap-1.5 transition-colors"
          >
            <i className="fa-solid fa-right-to-bracket"></i> লগইন
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="xl:hidden p-2.5 rounded-xl bg-white/70 dark:bg-slate-800 hover:bg-white text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          aria-label={mobileMenuOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
          aria-expanded={mobileMenuOpen}
        >
          <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-lg w-5 text-center`}></i>
        </button>
      </nav>

      {/* Mobile Drawer Navigation */}
      <div
        className={`xl:hidden grid transition-all duration-300 ease-out pointer-events-auto ${
          mobileMenuOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden">
          <div className="glass-dropdown rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3 max-h-[75vh] overflow-y-auto">
            {/* Mobile School Brand Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
              <LogoMark size="w-10 h-10" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{schoolName}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {activeSettings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার'}
                </p>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
              <Link
                href="/admission"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#0B5D3B] to-emerald-600 text-xs font-bold text-white text-center flex items-center justify-center gap-1.5"
              >
                <i className="fa-solid fa-user-plus"></i> অনলাইন ভর্তি
              </Link>
              <Link
                href="/result"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 text-center flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
              >
                <i className="fa-solid fa-magnifying-glass text-[#0B5D3B]"></i> ফলাফল
              </Link>
            </div>

            {/* Links */}
            <div className="space-y-1 text-sm font-semibold">
              {PRIMARY_LINKS.map((l) => (
                <a
                  key={l.key}
                  href={l.href}
                  onClick={l.key === 'home' ? handleHomeClick : () => setMobileMenuOpen(false)}
                  className={`block ${linkClass(l.key)}`}
                >
                  {l.label}
                </a>
              ))}

              <div>
                <button
                  type="button"
                  onClick={() => setMobileAcademicsOpen(!mobileAcademicsOpen)}
                  aria-expanded={mobileAcademicsOpen}
                  className={`w-full flex items-center justify-between text-left ${linkClass('academics')}`}
                >
                  <span>একাডেমিক</span>
                  <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-300 ${mobileAcademicsOpen ? 'rotate-180' : ''}`}></i>
                </button>
                <div className={`grid transition-all duration-300 ease-out ${mobileAcademicsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="pl-3 pr-2 py-1 my-1 space-y-0.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      {ACADEMIC_ITEMS.map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition-colors"
                        >
                          <i className={`fa-solid ${item.icon} w-4 text-center text-[#0B5D3B] dark:text-emerald-400`}></i>
                          {item.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {SECONDARY_LINKS.map((l) => (
                <a key={l.key} href={l.href} onClick={() => setMobileMenuOpen(false)} className={`block ${linkClass(l.key)}`}>
                  {l.label}
                </a>
              ))}
            </div>

            {/* Portal Button */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-[#F4B400] font-bold text-xs flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-right-to-bracket"></i> শিক্ষক / অ্যাডমিন লগইন
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
