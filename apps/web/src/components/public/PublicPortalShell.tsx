'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  FileBadge2,
  GraduationCap,
  Home,
  LogIn,
  Menu,
  Smartphone,
  UserPlus,
  X,
} from 'lucide-react';
import {
  settingsService,
  SchoolSettings,
  getEnglishSchoolName,
  getEnglishAddress,
} from '@/services/settingsService';
import { landingPageService } from '@/services/landingPageService';
import { formatPortalNumber, PortalLang, toBanglaDigits } from '@/lib/resultPortalUtils';

export type PublicPortalKey = 'admission' | 'result' | 'verify' | 'login';

interface PublicPortalHeaderProps {
  activePortal: PublicPortalKey;
  settings?: SchoolSettings | null;
  lang?: PortalLang;
  onLangChange?: (lang: PortalLang) => void;
  maxWidthClass?: string;
}

export function PublicPortalHeader({
  activePortal,
  settings: propSettings,
  lang = 'bn',
  onLangChange,
  maxWidthClass = 'max-w-6xl',
}: PublicPortalHeaderProps) {
  const [liveSettings, setLiveSettings] = useState<SchoolSettings | null>(propSettings || null);
  const [fallbackSchoolName, setFallbackSchoolName] = useState('বরইতলী উচ্চ বিদ্যালয়');
  const [fallbackAddress, setFallbackAddress] = useState('বরইতলী, চকরিয়া, কক্সবাজার');
  const [fallbackLogo, setFallbackLogo] = useState('/logo.png');
  const [fallbackEiin, setFallbackEiin] = useState('106184');
  const [logoError, setLogoError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isBn = lang === 'bn';

  useEffect(() => {
    try {
      const currentSettings = settingsService.getSettings();
      if (currentSettings) setLiveSettings(currentSettings);
    } catch {}

    try {
      const cfg = landingPageService.getPublishedConfig();
      if (cfg?.header?.schoolName) setFallbackSchoolName(cfg.header.schoolName);
      if (cfg?.header?.topbarAddress) setFallbackAddress(cfg.header.topbarAddress);
      if (cfg?.header?.logoUrl) setFallbackLogo(cfg.header.logoUrl);
      if (cfg?.footer?.eiin) setFallbackEiin(cfg.footer.eiin);
    } catch {}

    const unsub = settingsService.subscribe((next) => {
      if (next) setLiveSettings(next);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (propSettings) setLiveSettings(propSettings);
  }, [propSettings]);

  const effectiveSettings = propSettings || liveSettings;
  const schoolLogo = effectiveSettings?.schoolLogo || fallbackLogo || '/logo.png';
  const schoolName = isBn
    ? effectiveSettings?.schoolName?.trim() || fallbackSchoolName
    : getEnglishSchoolName(effectiveSettings, fallbackSchoolName);
  const schoolAddress = isBn
    ? effectiveSettings?.address?.trim() || fallbackAddress
    : getEnglishAddress(effectiveSettings, fallbackAddress);
  const eiin = effectiveSettings?.eiin?.trim() || fallbackEiin;
  const estdYear = effectiveSettings?.estdYear?.trim() || '';

  useEffect(() => {
    setLogoError(false);
  }, [schoolLogo]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

  const navItems: Array<{
    key: PublicPortalKey | 'home' | 'mobile';
    href: string;
    labelBn: string;
    labelEn: string;
    icon: React.ReactNode;
  }> = [
    {
      key: 'home',
      href: '/',
      labelBn: 'মূল পাতা',
      labelEn: 'Home',
      icon: <Home className="w-3.5 h-3.5" />,
    },
    {
      key: 'admission',
      href: '/admission',
      labelBn: 'অনলাইন ভর্তি',
      labelEn: 'Admission',
      icon: <UserPlus className="w-3.5 h-3.5" />,
    },
    {
      key: 'result',
      href: '/result',
      labelBn: 'ফলাফল',
      labelEn: 'Results',
      icon: <Award className="w-3.5 h-3.5" />,
    },
    {
      key: 'verify',
      href: '/verify-certificate',
      labelBn: 'সনদ যাচাই',
      labelEn: 'Verify',
      icon: <FileBadge2 className="w-3.5 h-3.5" />,
    },
    {
      key: 'mobile',
      href: '/mobile-app',
      labelBn: 'মোবাইল অ্যাপ',
      labelEn: 'Mobile App',
      icon: <Smartphone className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <>
      <div className="h-1 bg-gradient-to-r from-[#064e3b] via-[#0B5D3B] to-[#F4B400] print:hidden" />
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/85 dark:border-slate-800 shadow-[0_6px_24px_-12px_rgba(15,23,42,0.12)] print:hidden">
        <div className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3`}>
          {/* Brand Crest */}
          <Link
            href="/"
            className="flex items-center gap-3 min-w-0 group"
            title={isBn ? 'মূল ওয়েবসাইটে ফিরে যান' : 'Back to School Home'}
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#0B5D3B] to-teal-600 p-0.5 shadow-md shadow-emerald-900/15 group-hover:scale-[1.03] transition-transform shrink-0">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center overflow-hidden p-1">
                {schoolLogo && !logoError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={schoolLogo}
                    alt={schoolName}
                    className="w-full h-full object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <GraduationCap className="w-5 h-5 text-[#0B5D3B] dark:text-emerald-400" />
                )}
              </div>
            </div>
            <div className="min-w-0">
              <span className="block text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition-colors leading-tight">
                {schoolName}
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                <span className="truncate max-w-[140px] sm:max-w-[230px]">{schoolAddress}</span>
                {eiin && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700 shrink-0">•</span>
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
                      EIIN: {formatPortalNumber(eiin, lang)}
                    </span>
                  </>
                )}
                {estdYear && (
                  <span className="hidden xl:inline-flex items-center gap-1 shrink-0">
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    {isBn ? 'স্থাপিত:' : 'ESTD:'} {formatPortalNumber(estdYear, lang)}
                  </span>
                )}
              </div>
            </div>
          </Link>

          {/* Desktop Center/Right Unified Portal Nav */}
          <div className="flex items-center gap-2 shrink-0">
            <nav aria-label="পাবলিক পোর্টাল নেভিগেশন" className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              {navItems.map((item) => {
                const isActive = item.key === activePortal;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#0B5D3B] text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-[#0B5D3B] dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-900'
                    }`}
                  >
                    {item.icon}
                    <span>{isBn ? item.labelBn : item.labelEn}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Optional Language Switcher */}
            {onLangChange && (
              <div
                className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700"
                role="group"
                aria-label="Language Switcher"
              >
                <button
                  type="button"
                  onClick={() => onLangChange('bn')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    isBn
                      ? 'bg-[#0B5D3B] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => onLangChange('en')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    !isBn
                      ? 'bg-[#0B5D3B] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  EN
                </button>
              </div>
            )}

            {/* Login CTA */}
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-xs transition active:scale-[0.98]"
            >
              <LogIn className="w-3.5 h-3.5 text-[#F4B400] dark:text-white" />
              <span>{isBn ? 'লগইন' : 'Login'}</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              aria-label={mobileMenuOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Opaque Pearl Sheet */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3.5 shadow-xl">
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const isActive = item.key === activePortal;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition ${
                      isActive
                        ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                    }`}
                  >
                    {item.icon}
                    <span>{isBn ? item.labelBn : item.labelEn}</span>
                  </Link>
                );
              })}
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white border border-slate-900"
              >
                <LogIn className="w-3.5 h-3.5 text-[#F4B400]" />
                <span>{isBn ? 'অ্যাডমিন / শিক্ষক লগইন' : 'Admin / Teacher Login'}</span>
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

interface PublicPortalFooterProps {
  settings?: SchoolSettings | null;
  lang?: PortalLang;
  maxWidthClass?: string;
}

export function PublicPortalFooter({
  settings,
  lang = 'bn',
  maxWidthClass = 'max-w-6xl',
}: PublicPortalFooterProps) {
  const isBn = lang === 'bn';
  const currentYear = new Date().getFullYear();
  const schoolName = isBn
    ? settings?.schoolName?.trim() || 'বরইতলী উচ্চ বিদ্যালয়'
    : getEnglishSchoolName(settings, 'Baraitali High School');
  const schoolAddress = isBn
    ? settings?.address?.trim() || 'বরইতলী, চকরিয়া, কক্সবাজার'
    : getEnglishAddress(settings, "Baraitali, Chakaria, Cox's Bazar");
  const eiin = settings?.eiin?.trim() || '106184';

  return (
    <footer className="border-t border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 py-6 mt-auto print:hidden">
      <div
        className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400`}
      >
        <div className="text-center sm:text-left space-y-0.5">
          <p className="font-extrabold text-slate-800 dark:text-slate-100">
            © {isBn ? toBanglaDigits(currentYear) : currentYear} {schoolName}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {schoolAddress}
            {eiin ? ` • EIIN: ${formatPortalNumber(eiin, lang)}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-bold">
          <Link href="/" className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition">
            {isBn ? 'মূল ওয়েবসাইট' : 'Home'}
          </Link>
          <Link href="/admission" className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition">
            {isBn ? 'অনলাইন ভর্তি' : 'Admission'}
          </Link>
          <Link href="/result" className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition">
            {isBn ? 'ফলাফল' : 'Results'}
          </Link>
          <Link href="/verify-certificate" className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition">
            {isBn ? 'সনদ যাচাই' : 'Verify Certificate'}
          </Link>
          <Link href="/mobile-app" className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition">
            {isBn ? 'মোবাইল অ্যাপ' : 'Mobile App'}
          </Link>
          <Link href="/login" className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition">
            {isBn ? 'অ্যাডমিন / শিক্ষক লগইন' : 'Staff Login'}
          </Link>
        </div>
      </div>
    </footer>
  );
}
