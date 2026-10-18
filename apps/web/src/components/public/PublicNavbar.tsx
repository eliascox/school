'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  School, 
  Menu, 
  X, 
  LogIn, 
  UserPlus, 
  Search, 
  ChevronRight,
  Globe
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
  const logo = settings?.schoolLogo || '/logo.png';

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About Us', href: '#about' },
    { label: 'Principal', href: '#principal' },
    { label: 'Faculty', href: '#teachers' },
    { label: 'Academics', href: '#academic' },
    { label: 'Notices', href: '#notices' },
    { label: 'Facilities', href: '#facilities' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs border-b border-slate-200 dark:border-slate-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & School Branding */}
          <Link href="/" className="flex items-center gap-3.5 group focus:outline-hidden focus:ring-2 focus:ring-indigo-500 rounded-lg p-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 flex items-center justify-center text-white shadow-md shadow-indigo-950/20 group-hover:scale-105 transition-transform overflow-hidden border border-indigo-700/50">
              {logo && logo !== '/logo.png' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={schoolName} className="w-full h-full object-contain p-1" />
              ) : (
                <School className="w-7 h-7 text-amber-400" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                {schoolName}
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">EIIN: {eiin}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span>Estd. {estd}</span>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400 font-semibold">BISE Chattogram</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links in English */}
          <nav className="hidden xl:flex items-center space-x-1" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-md transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs in English: Results, Admission, Portal */}
          <div className="hidden lg:flex items-center gap-2.5">
            <Link
              href="/result"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-all shadow-xs"
            >
              <Search className="w-3.5 h-3.5 text-indigo-500" />
              <span>Results</span>
            </Link>

            <Link
              href="/admission"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm shadow-emerald-600/30 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Admission</span>
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-950 hover:bg-indigo-900 active:bg-slate-900 rounded-lg shadow-sm shadow-indigo-950/30 transition-all border border-indigo-700/60"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>Portal Login</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-950 rounded-md sm:hidden flex items-center gap-1 border border-indigo-800"
            >
              <LogIn className="w-3 h-3 text-amber-400" />
              <span>Login</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-4 duration-200">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Link
              href="/admission"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold text-white bg-emerald-600 rounded-lg shadow-sm text-center"
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

          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            ))}
          </nav>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-indigo-950 hover:bg-indigo-900 rounded-lg shadow-md border border-indigo-800"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              <span>Portal Login (Admin / Teacher / Guardian)</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
