'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Menu, 
  X, 
  LogIn, 
  UserPlus, 
  Search, 
  ChevronRight,
  Shield,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';

interface PublicNavbarProps {
  settings: SchoolSettings | null;
}

export default function PublicNavbar({ settings }: PublicNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const schoolName = settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const eiin = settings?.eiin || '106184';
  const estd = settings?.estdYear || '1969';

  // Professional Navigation structure in English
  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About Us', href: '#about' },
    { label: 'Principal', href: '#principal' },
    { label: 'Academics', href: '#academic' },
    { label: 'Faculty', href: '#teachers' },
    { label: 'Notices', href: '#notices' },
    { label: 'Facilities', href: '#facilities' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-sm border-b border-slate-200/90 dark:border-slate-800/90 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2 lg:gap-4">
          
          {/* ═════════ 1. PRESTIGIOUS SCHOOL EMBLEM & BRANDING ═════════ */}
          <Link 
            href="/" 
            onClick={(e) => {
              if (typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '')) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex items-center gap-3 group focus:outline-hidden focus:ring-2 focus:ring-indigo-500 rounded-xl p-1 transition-all shrink-0 cursor-pointer"
            title="হোমপেজে যান"
          >
            {/* Custom High-Fidelity Academic Vector Crest */}
            <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center text-white shadow-md shadow-indigo-950/20 group-hover:scale-105 transition-all overflow-hidden border-2 border-indigo-700/60 p-1.5 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Outer Golden Laurel Ring */}
                <circle cx="50" cy="50" r="46" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="4 2" />
                <path d="M50 10 L82 24 L82 58 C82 76 50 90 50 90 C50 90 18 76 18 58 L18 24 Z" fill="url(#shieldGrad)" stroke="#e0e7ff" strokeWidth="2" />
                {/* Knowledge Torch & Open Book Motif */}
                <path d="M50 32 L50 62" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                <path d="M42 42 Q50 34 58 42" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M34 54 C42 50 48 56 50 62 C52 56 58 50 66 54" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" />
                <circle cx="50" cy="28" r="4" fill="#f59e0b" />
                {/* Year 1969 Banner */}
                <rect x="28" y="70" width="44" height="12" rx="3" fill="#1e1b4b" stroke="#fbbf24" strokeWidth="1" />
                <text x="50" y="79" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="middle" letterSpacing="0.5">1969</text>
                <defs>
                  <linearGradient id="shieldGrad" x1="18" y1="24" x2="82" y2="90" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1e1b4b" />
                    <stop offset="1" stopColor="#0f172a" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* School Name */}
            <div className="flex flex-col min-w-0">
              <span className="text-lg sm:text-xl xl:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight font-serif whitespace-nowrap">
                {schoolName}
              </span>
            </div>
          </Link>

          {/* ═════════ 2. DESKTOP NAVIGATION LINKS (ENGLISH, SINGLE-LINE) ═════════ */}
          <nav className="hidden xl:flex items-center space-x-0.5 2xl:space-x-1" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-2.5 2xl:px-3 py-1.5 text-[13px] 2xl:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-all whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* ═════════ 3. MODERN ACTION BUTTON CLUSTER (NO SQUISHING) ═════════ */}
          <div className="hidden lg:flex items-center gap-2 2xl:gap-2.5 shrink-0">
            {/* Results Button */}
            <Link
              href="/result"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300/80 dark:border-slate-700 rounded-lg transition-all shadow-xs whitespace-nowrap"
              title="পরীক্ষার ফলাফল অনুসন্ধান করুন"
            >
              <Search className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Results</span>
            </Link>

            {/* Admission Button with Emerald Gradient */}
            <Link
              href="/admission"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 rounded-lg shadow-sm shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
              title="নতুন শিক্ষাবর্ষে অনলাইনে ভর্তি আবেদন করুন"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Online Admission</span>
            </Link>

            {/* Portal Login Button */}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-indigo-950 dark:bg-indigo-950 dark:hover:bg-indigo-900 active:bg-slate-950 rounded-lg shadow-sm shadow-slate-950/20 transition-all border border-indigo-700/60 whitespace-nowrap transform hover:-translate-y-0.5"
              title="অ্যাডমিন ও শিক্ষক ম্যানেজমেন্ট লগইন"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>Portal Login</span>
            </Link>
          </div>

          {/* ═════════ 4. MOBILE MENU BUTTON & QUICK LOGIN ═════════ */}
          <div className="flex xl:hidden items-center gap-1.5">
            <Link
              href="/login"
              className="px-2.5 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-indigo-950 rounded-lg flex items-center gap-1 border border-indigo-800 whitespace-nowrap"
            >
              <LogIn className="w-3 h-3 text-amber-400" />
              <span>Login</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-red-500" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ═════════ 5. RESPONSIVE MOBILE DRAWER ═════════ */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 space-y-3 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          {/* Quick Dual Action Badges */}
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Link
              href="/admission"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg shadow-sm text-center"
            >
              <UserPlus className="w-4 h-4" />
              <span>Online Admission</span>
            </Link>
            <Link
              href="/result"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm text-center"
            >
              <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Results Portal</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col space-y-0.5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors"
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            ))}
          </nav>

          {/* Full-width Portal Login */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-slate-900 hover:bg-indigo-950 rounded-lg shadow-md border border-indigo-800 transition-colors"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              <span>Portal Login (Admin & Teachers)</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
