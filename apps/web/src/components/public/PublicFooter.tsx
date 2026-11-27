'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  School,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Clock,
  ExternalLink,
  ShieldCheck,
  UserPlus,
  Award,
  FileBadge2,
  Smartphone,
  LogIn,
} from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';
import { ContactConfig, FooterConfig } from '@/services/landingPageService';
import { resolvePublicContactInfo, resolvePublicHref } from '@/lib/publicLandingUtils';
import { normalizeRollDigits } from '@/lib/resultPortalUtils';

interface PublicFooterProps {
  settings?: SchoolSettings | null;
  footerConfig?: FooterConfig | null;
  contactConfig?: ContactConfig | null;
  lastUpdatedAt?: unknown;
}

function formatBengaliDateTime(raw?: unknown): string {
  try {
    let dateObj: Date | null = null;
    const anyRaw = raw as { toDate?: () => Date; seconds?: number } | string | undefined;
    if (anyRaw && typeof anyRaw === 'object' && typeof anyRaw.toDate === 'function') {
      dateObj = anyRaw.toDate();
    } else if (anyRaw && typeof anyRaw === 'object' && typeof anyRaw.seconds === 'number') {
      dateObj = new Date(anyRaw.seconds * 1000);
    } else if (typeof anyRaw === 'string' && anyRaw.trim()) {
      const parsed = new Date(anyRaw);
      if (!Number.isNaN(parsed.getTime()) && parsed.getFullYear() >= 2025) {
        dateObj = parsed;
      }
    }
    if (!dateObj || Number.isNaN(dateObj.getTime())) {
      dateObj = new Date();
    }
    const dateStr = dateObj.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = dateObj.toLocaleTimeString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateStr}, ${timeStr}`;
  } catch {
    return '';
  }
}

export default function PublicFooter({
  settings,
  footerConfig,
  contactConfig,
  lastUpdatedAt,
}: PublicFooterProps) {
  const [lastUpdatedDisplay, setLastUpdatedDisplay] = useState<string>('');
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLastUpdatedDisplay(
      formatBengaliDateTime(lastUpdatedAt || (settings as { updatedAt?: unknown })?.updatedAt)
    );
  }, [lastUpdatedAt, settings]);

  const info = resolvePublicContactInfo(settings, contactConfig, footerConfig);
  const schoolLogo = settings?.schoolLogo || '/logo.png';

  const cleanTelHref = (raw: string) => {
    const digits = normalizeRollDigits(raw).replace(/[^\d+]/g, '');
    return digits ? `tel:${digits}` : undefined;
  };

  const whatsappDigits = normalizeRollDigits(info.phone1).replace(/\D/g, '');
  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits.startsWith('88') ? whatsappDigits : `88${whatsappDigits}`}`
    : '';

  const defaultCol1 = [
    { id: 'p-1', label: 'শিক্ষা মন্ত্রণালয় (MoEDU)', href: 'https://moedu.gov.bd', isExternal: true },
    { id: 'p-2', label: 'মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তর (DSHE)', href: 'https://dshe.gov.bd', isExternal: true },
    { id: 'p-3', label: 'ব্যানবেইস (BANBEIS)', href: 'https://banbeis.gov.bd', isExternal: true },
    { id: 'p-4', label: 'এনসিটিবি (NCTB)', href: 'https://nctb.gov.bd', isExternal: true },
    { id: 'p-5', label: 'শিক্ষক বাতায়ন (PDS)', href: 'https://teachers.gov.bd', isExternal: true },
    { id: 'p-6', label: 'বোর্ড পরীক্ষার ফলাফল', href: 'http://www.educationboardresults.gov.bd', isExternal: true },
  ];

  const col1Links =
    footerConfig?.col1Links && footerConfig.col1Links.length > 0
      ? footerConfig.col1Links
      : defaultCol1;

  const col2Links = [
    { id: 'q-1', label: 'প্রতিষ্ঠান পরিচিতি ও ইতিহাস', href: '/#about' },
    { id: 'q-2', label: 'নোটিশ বোর্ড ও প্রজ্ঞাপন', href: '/#notices' },
    { id: 'q-3', label: 'সম্মানিত শিক্ষকমণ্ডলী', href: '/#teachers' },
    { id: 'q-4', label: 'শ্রেণি ও একাডেমিক বিভাগ', href: '/#academic' },
    { id: 'q-5', label: 'ছবি ও ভিডিও গ্যালারি', href: '/#gallery' },
    { id: 'q-6', label: 'যোগাযোগ ও অনুসন্ধান', href: '/#contact' },
  ];

  return (
    <footer className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 relative transition-colors print:hidden">
      {/* Top Emerald-Gold Institutional Trim */}
      <div className="h-1 bg-gradient-to-r from-[#0B5D3B] via-[#F4B400] to-[#0B5D3B]" />

      {/* Direct Public Portal Action Strip */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0B5D3B] dark:text-emerald-400" />
            <span>তাৎক্ষণিক ডিজিটাল পোর্টাল অ্যাক্সেস:</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admission"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-[#0B5D3B] text-[#0B5D3B] hover:text-white dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>অনলাইন ভর্তি</span>
            </Link>
            <Link
              href="/result"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition"
            >
              <Award className="w-3.5 h-3.5" />
              <span>পরীক্ষার ফলাফল</span>
            </Link>
            <Link
              href="/verify-certificate"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold transition"
            >
              <FileBadge2 className="w-3.5 h-3.5" />
              <span>সনদ যাচাই</span>
            </Link>
            <Link
              href="/mobile-app"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold transition"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>মোবাইল অ্যাপ</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#F4B400] text-xs font-bold transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>অ্যাডমিন / শিক্ষক লগইন</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4-Column Executive Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Column 1: Institutional Identity & Codes */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 p-1.5 flex items-center justify-center shadow-xs shrink-0">
                {schoolLogo && !logoError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={schoolLogo}
                    alt={info.schoolName}
                    className="w-full h-full object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <School className="w-5 h-5 text-[#0B5D3B] dark:text-emerald-400" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug truncate">
                  {info.schoolName}
                </h4>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  {info.address}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-800 space-y-2 text-xs shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">EIIN নম্বর:</span>
                <span className="font-extrabold text-[#0B5D3B] dark:text-emerald-400 font-mono">
                  {info.eiin}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">স্কুল কোড:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {info.schoolCode}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">রেজিস্ট্রেশন নং:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {info.regNo}
                </span>
              </div>
            </div>

            {/* Social Links (only valid links rendered) */}
            {(info.socialLinks.facebook || info.socialLinks.youtube || info.socialLinks.linkedin || whatsappUrl) && (
              <div className="pt-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-2">
                  আমাদের সাথে যুক্ত থাকুন:
                </span>
                <div className="flex items-center gap-2">
                  {info.socialLinks.facebook && (
                    <a
                      href={info.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#0B5D3B] text-slate-700 dark:text-slate-200 hover:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all hover:scale-105 shadow-2xs"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                  )}
                  {info.socialLinks.youtube && (
                    <a
                      href={info.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="YouTube"
                      className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-600 text-slate-700 dark:text-slate-200 hover:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all hover:scale-105 shadow-2xs"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </a>
                  )}
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="WhatsApp"
                      className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-600 text-slate-700 dark:text-slate-200 hover:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all hover:scale-105 shadow-2xs"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Important Site Navigation */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0B5D3B]" />
              <span>{footerConfig?.col2Title || 'গুরুত্বপূর্ণ লিঙ্ক'}</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              {col2Links.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition-all flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:translate-x-0.5 font-medium"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-[#F4B400] shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: National Education Portals */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F4B400]" />
              <span>{footerConfig?.col1Title || 'সরকারি ও শিক্ষা পোর্টাল'}</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              {col1Links.slice(0, 7).map((link) => {
                const safeHref = resolvePublicHref(link.href, '/');
                const isExt = link.isExternal || safeHref.startsWith('http');
                return (
                  <li key={link.id}>
                    {isExt ? (
                      <a
                        href={safeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition-all flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:translate-x-0.5 font-medium"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-[#0B5D3B] shrink-0" />
                        <span className="truncate">{link.label}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                      </a>
                    ) : (
                      <Link
                        href={safeHref}
                        className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition-all flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:translate-x-0.5 font-medium"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-[#0B5D3B] shrink-0" />
                        <span>{link.label}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 4: Official Contact Details (100% synced with Contact Section) */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0B5D3B]" />
              <span>{footerConfig?.col3Title || 'যোগাযোগ ও অফিস'}</span>
            </h4>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#F4B400] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{info.address}</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
                  <a
                    href={cleanTelHref(info.phone1)}
                    className="hover:text-slate-950 dark:hover:text-white transition-colors font-semibold"
                  >
                    {info.phone1}
                  </a>
                </div>
                {info.phone2 && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
                    <a
                      href={cleanTelHref(info.phone2)}
                      className="hover:text-slate-950 dark:hover:text-white transition-colors font-semibold"
                    >
                      {info.phone2}
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#F4B400] shrink-0" />
                  <a
                    href={`mailto:${info.email1}`}
                    className="hover:text-slate-950 dark:hover:text-white transition-colors truncate"
                  >
                    {info.email1}
                  </a>
                </div>
                {info.email2 && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#F4B400] shrink-0" />
                    <a
                      href={`mailto:${info.email2}`}
                      className="hover:text-slate-950 dark:hover:text-white transition-colors truncate"
                    >
                      {info.email2}
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{info.officeHours}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar — generous bottom-right clearance on mobile so Back-to-Top FAB never overlaps text */}
      <div className="bg-slate-100/90 dark:bg-slate-900/90 border-t border-slate-200/90 dark:border-slate-800 py-5 pb-20 sm:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 sm:pr-16">
          <div className="text-center sm:text-left space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">{info.copyrightText}</p>
            {lastUpdatedDisplay && (
              <p className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span>
                  সর্বশেষ আপডেট:{' '}
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">
                    {lastUpdatedDisplay}
                  </span>
                </span>
              </p>
            )}
          </div>

          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            SchoolPro ডিজিটাল স্কুল ম্যানেজমেন্ট সিস্টেম দ্বারা পরিচালিত
          </span>
        </div>
      </div>
    </footer>
  );
}
