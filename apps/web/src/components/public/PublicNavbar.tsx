'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { SchoolSettings } from '@/services/settingsService';
import { HeaderConfig } from '@/services/landingPageService';

interface PublicNavbarProps {
  settings?: SchoolSettings | null;
  headerConfig?: HeaderConfig | null;
  isOverHero?: boolean;
}

export default function PublicNavbar({ settings, headerConfig, isOverHero = true }: PublicNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [academicsOpen, setAcademicsOpen] = useState(false);
  const [mobileAcademicsOpen, setMobileAcademicsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const schoolName = headerConfig?.schoolName || settings?.schoolName || 'Baraitali High School';

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAcademicsOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className={`sticky top-3 sm:top-4 z-50 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pointer-events-none transition-all duration-300 ${isOverHero ? '-mb-20 sm:-mb-24' : 'mb-4'}`}>
      <nav className="glass-nav rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-4 transition-all duration-300 pointer-events-auto">
        {/* School Logo & Clean Title */}
        <Link 
          href="#home" 
          onClick={(e) => {
            if (typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '')) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex items-center gap-3 group shrink-0"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-lg shadow-emerald-600/20 group-hover:scale-105 transition">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center overflow-hidden">
              {settings?.schoolLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.schoolLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <i className="fa-solid fa-graduation-cap text-emerald-400 text-lg"></i>
              )}
            </div>
          </div>
          <span className="font-en font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            {schoolName}
          </span>
        </Link>

        {/* Desktop Menu Links (Cleaned: Principal, Faculty, Facilities inside Academics dropdown) */}
        <div className="hidden xl:flex items-center gap-1.5 text-sm font-en font-medium text-slate-700 dark:text-slate-200">
          <a
            href="#home"
            className="px-3 py-2 rounded-xl bg-emerald-600/10 border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 font-semibold transition hover:bg-emerald-600/20"
          >
            Home
          </a>
          <a
            href="#about"
            className="px-3 py-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
          >
            About Us
          </a>

          {/* Academics Dropdown Menu containing Recognition, SMC, Head Master, Student Information, Faculty, Facilities */}
          <div className="relative group" ref={dropdownRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAcademicsOpen(!academicsOpen);
              }}
              className="px-3 py-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400"
            >
              <span>Academics</span>
              <i
                className={`fa-solid fa-chevron-down text-[11px] transition-transform duration-300 ${
                  academicsOpen ? 'rotate-180' : 'group-hover:rotate-180'
                }`}
              ></i>
            </button>

            {/* Glassy Dropdown Panel */}
            <div
              className={`glass-dropdown absolute left-0 mt-3 w-64 rounded-2xl p-2 z-50 transition-all duration-300 ${
                academicsOpen
                  ? 'visible opacity-100 translate-y-0'
                  : 'invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0'
              }`}
            >
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-700 mb-1 flex items-center justify-between">
                <span>Academic Wing</span>
                <i className="fa-solid fa-layer-group text-xs"></i>
              </div>
              <a
                href="#recognition"
                onClick={() => setAcademicsOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-emerald-600/10 hover:text-emerald-900 dark:hover:text-emerald-300 transition group/item"
              >
                <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center group-hover/item:scale-110 transition">
                  <i className="fa-solid fa-certificate text-xs"></i>
                </span>
                <div>
                  <div className="font-semibold leading-none">Recognition</div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">বোর্ড স্বীকৃতি ও অনুমোদন</span>
                </div>
              </a>
              <a
                href="#smc"
                onClick={() => setAcademicsOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-emerald-600/10 hover:text-emerald-900 dark:hover:text-emerald-300 transition group/item"
              >
                <span className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center justify-center group-hover/item:scale-110 transition">
                  <i className="fa-solid fa-users-gear text-xs"></i>
                </span>
                <div>
                  <div className="font-semibold leading-none">SMC</div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">বিদ্যালয় পরিচালনা পর্ষদ</span>
                </div>
              </a>
              <a
                href="#headmaster"
                onClick={() => setAcademicsOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-emerald-600/10 hover:text-emerald-900 dark:hover:text-emerald-300 transition group/item"
              >
                <span className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-400 flex items-center justify-center group-hover/item:scale-110 transition">
                  <i className="fa-solid fa-user-tie text-xs"></i>
                </span>
                <div>
                  <div className="font-semibold leading-none">Head Master</div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">প্রধান শিক্ষকের বাণী</span>
                </div>
              </a>
              <a
                href="#student-info"
                onClick={() => setAcademicsOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-emerald-600/10 hover:text-emerald-900 dark:hover:text-emerald-300 transition group/item"
              >
                <span className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-700 dark:text-sky-400 flex items-center justify-center group-hover/item:scale-110 transition">
                  <i className="fa-solid fa-chart-pie text-xs"></i>
                </span>
                <div>
                  <div className="font-semibold leading-none">Student Information</div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">শিক্ষার্থীদের পরিসংখ্যান</span>
                </div>
              </a>
              <a
                href="#faculty"
                onClick={() => setAcademicsOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-emerald-600/10 hover:text-emerald-900 dark:hover:text-emerald-300 transition group/item"
              >
                <span className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-400 flex items-center justify-center group-hover/item:scale-110 transition">
                  <i className="fa-solid fa-chalkboard-user text-xs"></i>
                </span>
                <div>
                  <div className="font-semibold leading-none">Faculty</div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">শ্রদ্ধেয় শিক্ষকমণ্ডলী</span>
                </div>
              </a>
              <a
                href="#facilities"
                onClick={() => setAcademicsOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-emerald-600/10 hover:text-emerald-900 dark:hover:text-emerald-300 transition group/item"
              >
                <span className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-400 flex items-center justify-center group-hover/item:scale-110 transition">
                  <i className="fa-solid fa-laptop-code text-xs"></i>
                </span>
                <div>
                  <div className="font-semibold leading-none">Facilities</div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">আধুনিক সুযোগ-সুবিধা</span>
                </div>
              </a>
            </div>
          </div>

          <a
            href="#notices"
            className="px-3 py-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
          >
            Notices
          </a>
          <a
            href="#gallery"
            className="px-3 py-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
          >
            Gallery
          </a>
          <a
            href="#contact"
            className="px-3 py-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
          >
            Contact
          </a>
        </div>

        {/* Right Action Buttons */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Link
            href="/result"
            className="px-3.5 py-2 rounded-xl bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-en font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition"
          >
            <i className="fa-solid fa-magnifying-glass text-emerald-600"></i> Results
          </Link>
          <Link
            href="/admission"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-en font-bold text-white shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition"
          >
            <i className="fa-solid fa-user-plus"></i> Online Admission
          </Link>
          <Link
            href="/login"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-800 text-xs font-en font-semibold text-amber-400 flex items-center gap-1.5 transition"
          >
            <i className="fa-solid fa-right-to-bracket text-amber-400"></i> Portal
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="xl:hidden p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
          aria-label="Toggle Navigation Menu"
        >
          <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-lg`}></i>
        </button>
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden glass-dropdown rounded-2xl mt-2 p-4 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 space-y-3 pointer-events-auto">
          {/* Action buttons on mobile */}
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
            <Link
              href="/admission"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-bold text-white text-center flex items-center justify-center gap-1.5"
            >
              <i className="fa-solid fa-user-plus"></i> Admission
            </Link>
            <Link
              href="/result"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 text-center flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
            >
              <i className="fa-solid fa-magnifying-glass text-emerald-600"></i> Results
            </Link>
          </div>

          {/* Links */}
          <div className="space-y-1 font-en text-sm font-semibold text-slate-700 dark:text-slate-200">
            <a
              href="#home"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Home
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              About Us
            </a>

            {/* Mobile Academics Dropdown */}
            <div>
              <button
                type="button"
                onClick={() => setMobileAcademicsOpen(!mobileAcademicsOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-semibold"
              >
                <span>Academics</span>
                <i className={`fa-solid fa-chevron-down text-xs transition-transform ${mobileAcademicsOpen ? 'rotate-180' : ''}`}></i>
              </button>
              {mobileAcademicsOpen && (
                <div className="pl-4 pr-2 py-1 space-y-1 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl my-1 border border-slate-200/60 dark:border-slate-700/60">
                  <a
                    href="#recognition"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-2 text-xs text-slate-600 dark:text-slate-300 hover:text-emerald-600"
                  >
                    <i className="fa-solid fa-certificate text-emerald-600 w-4"></i> Recognition
                  </a>
                  <a
                    href="#smc"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-2 text-xs text-slate-600 dark:text-slate-300 hover:text-amber-600"
                  >
                    <i className="fa-solid fa-users-gear text-amber-600 w-4"></i> SMC (পরিচালনা পর্ষদ)
                  </a>
                  <a
                    href="#headmaster"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-2 text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600"
                  >
                    <i className="fa-solid fa-user-tie text-indigo-600 w-4"></i> Head Master
                  </a>
                  <a
                    href="#student-info"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-2 text-xs text-slate-600 dark:text-slate-300 hover:text-sky-600"
                  >
                    <i className="fa-solid fa-chart-pie text-sky-600 w-4"></i> Student Information
                  </a>
                  <a
                    href="#faculty"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-2 text-xs text-slate-600 dark:text-slate-300 hover:text-purple-600"
                  >
                    <i className="fa-solid fa-chalkboard-user text-purple-600 w-4"></i> Faculty
                  </a>
                  <a
                    href="#facilities"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-2 text-xs text-slate-600 dark:text-slate-300 hover:text-teal-600"
                  >
                    <i className="fa-solid fa-laptop-code text-teal-600 w-4"></i> Facilities
                  </a>
                </div>
              )}
            </div>

            <a
              href="#notices"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Notices
            </a>
            <a
              href="#gallery"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Gallery
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Contact
            </a>
          </div>

          {/* Portal Button */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-right-to-bracket text-amber-400"></i> Portal Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
