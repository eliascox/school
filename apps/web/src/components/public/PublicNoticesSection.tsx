'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Calendar,
  ExternalLink,
  FileText,
  ArrowRight,
  X,
  Printer,
  Link2,
  Globe,
  GraduationCap,
  Laptop,
  MessageSquare,
  AlertCircle,
  Search,
  Award,
  FileBadge2,
  Smartphone,
} from 'lucide-react';
import { PublicNoticeViewItem } from '@/lib/publicLandingUtils';

interface PublicNoticesSectionProps {
  notices: PublicNoticeViewItem[];
  selectedNotice?: PublicNoticeViewItem | null;
  onSelectNotice?: (n: PublicNoticeViewItem | null) => void;
  schoolName?: string;
}

interface ImportantLink {
  id: string;
  title: string;
  shortDesc: string;
  url: string;
  badge?: string;
}

const IMPORTANT_GOV_LINKS: ImportantLink[] = [
  {
    id: 'LNK-1',
    title: 'শিক্ষা মন্ত্রণালয়',
    shortDesc: 'মাধ্যমিক ও উচ্চ শিক্ষা বিভাগ',
    url: 'https://moedu.gov.bd',
    badge: 'মন্ত্রণালয়',
  },
  {
    id: 'LNK-2',
    title: 'বোর্ড পরীক্ষার রেজাল্ট',
    shortDesc: 'অফিশিয়াল পাবলিক পরীক্ষা ফলাফল',
    url: 'http://www.educationboardresults.gov.bd',
    badge: 'রেজাল্ট',
  },
  {
    id: 'LNK-3',
    title: 'ব্যানবেইস (BANBEIS)',
    shortDesc: 'বাংলাদেশ শিক্ষাতথ্য ও পরিসংখ্যান ব্যুরো',
    url: 'https://banbeis.gov.bd',
    badge: 'পরিসংখ্যান',
  },
  {
    id: 'LNK-4',
    title: 'মাউশি (DSHE)',
    shortDesc: 'মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তর',
    url: 'https://dshe.gov.bd',
    badge: 'অধিদপ্তর',
  },
  {
    id: 'LNK-5',
    title: 'এনসিটিবি (NCTB)',
    shortDesc: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড',
    url: 'https://nctb.gov.bd',
    badge: 'পাঠ্যবই',
  },
  {
    id: 'LNK-6',
    title: 'শিক্ষক বাতায়ন',
    shortDesc: 'ডিজিটাল পাঠ পরিকল্পনা ও রিসোর্স',
    url: 'https://teachers.gov.bd',
    badge: 'শিক্ষক',
  },
  {
    id: 'LNK-7',
    title: 'কিশোর বাতায়ন (Konnect)',
    shortDesc: 'শিক্ষার্থীদের জ্ঞান ও প্রতিভা বিকাশ',
    url: 'https://konnect.edu.bd',
    badge: 'শিক্ষার্থী',
  },
  {
    id: 'LNK-8',
    title: 'নায়েম (NAEM)',
    shortDesc: 'জাতীয় শিক্ষা ব্যবস্থাপনা একাডেমি',
    url: 'https://naem.gov.bd',
    badge: 'প্রশিক্ষণ',
  },
];

const OTHER_QUICK_LINKS = [
  { label: 'অনলাইন ভর্তি আবেদন', icon: GraduationCap, href: '/admission' },
  { label: 'পরীক্ষার ফলাফল', icon: Award, href: '/result' },
  { label: 'সনদ ও রসিদ যাচাই', icon: FileBadge2, href: '/verify-certificate' },
  { label: 'মোবাইল অ্যাপ পোর্টাল', icon: Smartphone, href: '/mobile-app' },
  { label: 'অ্যাডমিন / শিক্ষক লগইন', icon: Laptop, href: '/login' },
  { label: 'মতামত ও যোগাযোগ', icon: MessageSquare, href: '#contact' },
];

export default function PublicNoticesSection({
  notices,
  selectedNotice,
  onSelectNotice,
  schoolName = 'বরইতলী উচ্চ বিদ্যালয়',
}: PublicNoticesSectionProps) {
  const [activeNoticeModal, setActiveNoticeModal] = useState<PublicNoticeViewItem | null>(null);
  const [showAllNoticesModal, setShowAllNoticesModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('সকল');
  const [archiveQuery, setArchiveQuery] = useState<string>('');

  // Sync external ticker click -> open notice detail modal cleanly!
  useEffect(() => {
    if (selectedNotice) {
      setActiveNoticeModal(selectedNotice);
    }
  }, [selectedNotice]);

  // Escape key closes open modal
  useEffect(() => {
    if (!activeNoticeModal && !showAllNoticesModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveNoticeModal(null);
        setShowAllNoticesModal(false);
        onSelectNotice?.(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [activeNoticeModal, showAllNoticesModal, onSelectNotice]);

  const closeDetailModal = () => {
    setActiveNoticeModal(null);
    onSelectNotice?.(null);
  };

  const categories = useMemo(() => {
    const unique = Array.from(new Set(notices.map((n) => n.category).filter(Boolean)));
    return ['সকল', ...unique];
  }, [notices]);

  const filteredNotices = useMemo(() => {
    if (activeCategory === 'সকল') return notices;
    return notices.filter((n) => n.category === activeCategory);
  }, [notices, activeCategory]);

  const archiveFiltered = useMemo(() => {
    const q = archiveQuery.trim().toLowerCase();
    if (!q) return notices;
    return notices.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q)
    );
  }, [notices, archiveQuery]);

  const handlePrintNotice = (notice: PublicNoticeViewItem) => {
    if (typeof window === 'undefined') return;
    const printWin = window.open('', '_blank', 'width=820,height=920');
    if (!printWin) {
      window.print();
      return;
    }
    const safeTitle = notice.title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeDesc = notice.description.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
    const safeSchool = schoolName.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    printWin.document.write(`<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle} — ${safeSchool}</title>
  <style>
    @page { size: A4 portrait; margin: 18mm; }
    body { font-family: 'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; line-height: 1.75; }
    .header { text-align: center; border-bottom: 2.5px solid #0B5D3B; padding-bottom: 14px; margin-bottom: 22px; }
    .school { font-size: 24px; font-weight: 800; color: #0B5D3B; margin: 0; }
    .sub { font-size: 13px; color: #475569; margin: 4px 0 0; }
    .meta { display: flex; justify-content: space-between; font-size: 13px; color: #334155; margin-bottom: 22px; font-weight: 600; }
    .badge { display: inline-block; padding: 3px 12px; border: 1.5px solid #0B5D3B; border-radius: 999px; font-size: 13px; font-weight: 700; color: #0B5D3B; margin-bottom: 14px; }
    h1 { font-size: 19px; margin: 0 0 16px; color: #0f172a; }
    .body { font-size: 15px; text-align: justify; background: #f8fafc; padding: 18px 20px; border-radius: 10px; border: 1px solid #e2e8f0; }
    .sig { margin-top: 64px; display: flex; justify-content: flex-end; }
    .sig-box { text-align: center; border-top: 1.5px solid #334155; padding-top: 6px; min-width: 190px; font-size: 13px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="header">
    <p class="school">${safeSchool}</p>
    <p class="sub">অফিশিয়াল দাপ্তরিক বিজ্ঞপ্তি / নোটিশ</p>
  </div>
  <div class="meta">
    <span>স্মারক নং: ${notice.refNo || 'ব.উ.বি/নোটিশ/২০২৬'}</span>
    <span>প্রকাশের তারিখ: ${notice.date}</span>
  </div>
  <div style="text-align:center"><span class="badge">বিজ্ঞপ্তি (${notice.category})</span></div>
  <h1>${safeTitle}</h1>
  <div class="body">${safeDesc}</div>
  <div class="sig">
    <div class="sig-box">প্রধান শিক্ষক / কর্তৃপক্ষ<br/>${safeSchool}</div>
  </div>
  <script>window.onload = function(){ window.print(); };</script>
</body>
</html>`);
    printWin.document.close();
  };

  return (
    <section
      id="notices"
      className="py-12 sm:py-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
            <Bell className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>তথ্য ও বিজ্ঞপ্তি কেন্দ্র</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            নোটিশ বোর্ড ও গুরুত্বপূর্ণ লিঙ্ক
          </h2>

          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="w-14 h-1.5 bg-[#0B5D3B] rounded-full" />
            <span className="w-3.5 h-1.5 bg-[#F4B400] rounded-full" />
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed pt-1">
            বিদ্যালয়ের সর্বশেষ দাপ্তরিক ঘোষণা, পরীক্ষার বিজ্ঞপ্তি এবং জাতীয় শিক্ষা পোর্টালের জরুরি সংযোগসমূহ।
          </p>
        </div>

        {/* Two Equal-Height Executive Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* Column 1: Interactive Notice Board */}
          <div className="bg-[#F8FAFC] dark:bg-slate-800/75 rounded-3xl p-5 sm:p-7 border border-slate-200/90 dark:border-slate-700/80 shadow-sm flex flex-col min-h-[540px] lg:h-[610px]">
            <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-200 dark:border-slate-700 shrink-0 gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#0B5D3B] text-white flex items-center justify-center shadow-sm shrink-0">
                  <Bell className="w-5 h-5 text-[#F4B400]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white truncate">
                    ডিজিটাল নোটিশ বোর্ড
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    সর্বশেষ দাপ্তরিক ও শিক্ষামূলক বিজ্ঞপ্তি
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-[#0B5D3B] dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>লাইভ</span>
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 no-scrollbar shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                    activeCategory === cat
                      ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Scrollable Notice Cards */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
              {filteredNotices.map((notice, idx) => (
                <div
                  key={notice.id || idx}
                  className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 hover:border-[#0B5D3B] dark:hover:border-emerald-500 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
                        <span>{notice.date}</span>
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          notice.isUrgent
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                            : 'bg-emerald-50 text-[#0B5D3B] border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                        }`}
                      >
                        {notice.category}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                      {notice.title}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-[#F4B400]" />
                      <span>দাপ্তরিক সার্কুলার</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setActiveNoticeModal(notice)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0B5D3B] hover:text-[#08492e] dark:text-emerald-400 dark:hover:text-emerald-300 group/btn cursor-pointer"
                    >
                      <span>বিস্তারিত পড়ুন</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setShowAllNoticesModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#0B5D3B] hover:bg-[#08492e] shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#F4B400]" />
                <span>সকল নোটিশ আর্কাইভ দেখুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Column 2: Important National Links (Mobile-Wrap Friendly) */}
          <div className="bg-[#F8FAFC] dark:bg-slate-800/75 rounded-3xl p-5 sm:p-7 border border-slate-200/90 dark:border-slate-700/80 shadow-sm flex flex-col min-h-[540px] lg:h-[610px]">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-700 shrink-0 gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#0B5D3B] text-white flex items-center justify-center shadow-sm shrink-0">
                  <Globe className="w-5 h-5 text-[#F4B400]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white truncate">
                    গুরুত্বপূর্ণ লিঙ্ক সমূহ
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    সরকারি ও জাতীয় শিক্ষা পোর্টাল সংযোগ
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shrink-0">
                ৮টি পোর্টাল
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
              {IMPORTANT_GOV_LINKS.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 hover:border-[#0B5D3B] dark:hover:border-emerald-500 transition-all duration-200 shadow-2xs hover:shadow-md flex items-center justify-between gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-[#0B5D3B] group-hover:text-white transition-colors">
                      <Link2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition-colors leading-snug">
                          {link.title}
                        </h4>
                        {link.badge && (
                          <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                            {link.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {link.shortDesc}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-[#0B5D3B] dark:text-emerald-400 bg-emerald-50/90 dark:bg-emerald-950/60 group-hover:bg-[#0B5D3B] group-hover:text-white border border-emerald-200 dark:border-emerald-800 transition-all shrink-0">
                    <span className="hidden sm:inline">ভিজিট</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </a>
              ))}
            </div>

            <div className="pt-3.5 mt-2 border-t border-slate-200 dark:border-slate-700 text-center shrink-0">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#F4B400] shrink-0" />
                <span>সকল সংযোগ অফিশিয়াল সরকারি শিক্ষা পোর্টালে নতুন ট্যাবে খুলবে</span>
              </p>
            </div>
          </div>
        </div>

        {/* Fixed Quick Links Strip (All Valid Real Routes) */}
        <div className="mt-10 bg-gradient-to-r from-emerald-50/80 via-white to-amber-50/60 dark:from-slate-800/90 dark:via-slate-800 dark:to-slate-800/90 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0B5D3B]" />
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                দ্রুত পোর্টাল শর্টকাট:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {OTHER_QUICK_LINKS.map((item) => {
                const IconComponent = item.icon;
                const isAnchor = item.href.startsWith('#');
                const cls =
                  'inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 hover:border-[#0B5D3B] text-slate-700 dark:text-slate-200 hover:text-[#0B5D3B] dark:hover:text-emerald-400 text-xs font-bold shadow-2xs hover:shadow-sm hover:-translate-y-0.5 transition-all group';
                return isAnchor ? (
                  <a key={item.label} href={item.href} className={cls}>
                    <IconComponent className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400 group-hover:text-[#F4B400] transition-colors" />
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <Link key={item.label} href={item.href} className={cls}>
                    <IconComponent className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400 group-hover:text-[#F4B400] transition-colors" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Notice Details Modal */}
      {activeNoticeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={closeDetailModal}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B5D3B] via-[#F4B400] to-[#0B5D3B]" />

            <button
              type="button"
              onClick={closeDetailModal}
              aria-label="বন্ধ করুন"
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mt-1 space-y-2.5 pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {activeNoticeModal.category}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0B5D3B]" />
                  <span>প্রকাশিত: {activeNoticeModal.date}</span>
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
                {activeNoticeModal.title}
              </h3>
            </div>

            <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line max-h-[45vh] overflow-y-auto">
              {activeNoticeModal.description}
            </div>

            <div className="mt-4 pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>কর্তৃপক্ষ: প্রধান শিক্ষক / নোটিশ কমিটি</span>
              <span>স্মারক: {activeNoticeModal.refNo || 'ব.উ.বি/নোটিশ/২০২৬'}</span>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handlePrintNotice(activeNoticeModal)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B5D3B] hover:bg-[#08492e] text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>বিজ্ঞপ্তি প্রিন্ট / PDF</span>
              </button>

              <button
                type="button"
                onClick={closeDetailModal}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Notices Archive Modal with Search */}
      {showAllNoticesModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAllNoticesModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col p-5 sm:p-7 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-[#0B5D3B] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    সকল নোটিশ আর্কাইভ
                  </h3>
                  <p className="text-xs text-slate-500">প্রতিষ্ঠানের প্রকাশিত সকল নোটিশ ও সার্কুলার</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllNoticesModal(false)}
                aria-label="বন্ধ করুন"
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 pb-2 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={archiveQuery}
                  onChange={(e) => setArchiveQuery(e.target.value)}
                  placeholder="নোটিশের শিরোনাম বা বিষয় লিখে খুঁজুন..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#0B5D3B]"
                />
              </div>
            </div>

            <div className="overflow-y-auto py-3 space-y-2.5 pr-1 flex-1">
              {archiveFiltered.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  আপনার অনুসন্ধানের সাথে মিলে এমন কোনো নোটিশ পাওয়া যায়নি।
                </div>
              ) : (
                archiveFiltered.map((n, idx) => (
                  <div
                    key={n.id || idx}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 hover:border-emerald-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[#0B5D3B]" />
                        <span>{n.date}</span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-[#0B5D3B] dark:text-emerald-400 font-bold">{n.category}</span>
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                        {n.title}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowAllNoticesModal(false);
                        setActiveNoticeModal(n);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-[#0B5D3B] hover:text-white transition-colors shrink-0 cursor-pointer"
                    >
                      পড়ুন
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
