'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  Calendar, 
  ExternalLink, 
  FileText, 
  ArrowRight, 
  X, 
  Download, 
  Link2, 
  Globe, 
  Mail, 
  GraduationCap, 
  Laptop, 
  Clock, 
  Users, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Notice } from '@/services/noticeService';

interface PublicNoticesSectionProps {
  notices?: Notice[];
  selectedNotice?: Notice | null;
  onSelectNotice?: (n: Notice | null) => void;
}

interface NoticeItem {
  id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  isUrgent?: boolean;
}

interface ImportantLink {
  id: string;
  title: string;
  shortDesc: string;
  url: string;
  badge?: string;
}

export default function PublicNoticesSection({
  notices = [],
  selectedNotice: initialSelectedNotice,
  onSelectNotice: initialOnSelectNotice
}: PublicNoticesSectionProps) {
  // Modal state
  const [activeNoticeModal, setActiveNoticeModal] = useState<NoticeItem | null>(null);
  const [showAllNoticesModal, setShowAllNoticesModal] = useState<boolean>(false);

  // 5 Sample notices in Bengali
  const sampleNotices: NoticeItem[] = [
    {
      id: 'NTC-001',
      title: '২০২৬ সালের এসএসসি পরীক্ষার ফরম পূরণ ও ফি জমাদান সংক্রান্ত জরুরি বিজ্ঞপ্তি',
      date: '১৯ অক্টোবর ২০২৬',
      category: 'পরীক্ষা',
      isUrgent: true,
      description: 'এতদ্বারা অত্র বিদ্যালয়ের ২০২৬ সালের এসএসসি পরীক্ষার্থী ও তাদের অভিভাবকদের অবগতির জন্য জানানো যাচ্ছে যে, আগামী ২৫ অক্টোবর ২০২৬ তারিখের মধ্যে বোর্ড নির্ধারিত ফরম পূরণ ও যাবতীয় বকেয়া ফি পরিশোধ করতে হবে। নির্ধারিত সময়ের পর কোনো বিলম্ব ফি ছাড়া ফরম পূরণের সুযোগ থাকবে না। বিস্তারিত ফি বিবরণী অফিস কক্ষে পাওয়া যাবে।'
    },
    {
      id: 'NTC-002',
      title: '১ম সাময়িক পরীক্ষার সময়সূচি (রুটিন) প্রকাশ ও প্রবেশপত্র বিতরণ প্রসঙ্গে',
      date: '১৫ অক্টোবর ২০২৬',
      category: 'রুটিন',
      isUrgent: false,
      description: 'অত্র বিদ্যালয়ের ৬ষ্ঠ থেকে ১০ম শ্রেণির সকল শিক্ষার্থীদের জানানো যাচ্ছে যে, আগামী ১০ নভেম্বর ২০২৬ থেকে ১ম সাময়িক পরীক্ষা অনুষ্ঠিত হবে। পরীক্ষার পূর্ণাঙ্গ রুটিন নোটিশ বোর্ডে ও অনলাইন পোর্টালে সংযুক্ত করা হয়েছে। সকল শিক্ষার্থীকে আগামী ০৩ নভেম্বরের মধ্যে হিসাব শাখা থেকে প্রবেশপত্র (Admit Card) সংগ্রহের নির্দেশ দেওয়া হলো।'
    },
    {
      id: 'NTC-003',
      title: 'গ্রীষ্মকালীন অবকাশ ও মহান মে দিবস উপলক্ষে শ্রেণিকার্যক্রম বন্ধের নোটিশ',
      date: '১০ অক্টোবর ২০২৬',
      category: 'ছুটি',
      isUrgent: false,
      description: 'সরকারি প্রজ্ঞাপন ও বিদ্যালয় পরিচালনা পর্ষদের সিদ্ধান্ত মোতাবেক আগামী ০১ মে থেকে ১৫ মে ২০২৬ পর্যন্ত গ্রীষ্মকালীন অবকাশ উপলক্ষে বিদ্যালয়ের সকল পাঠদান কার্যক্রম বন্ধ থাকবে। তবে প্রশাসনিক ও ভর্তি সংক্রান্ত অফিস কার্যক্রম সকাল ৯:০০ টা থেকে দুপুর ১:০০ টা পর্যন্ত যথারীতি চলবে। ১৬ মে ২০২৬ থেকে নিয়মিত ক্লাস শুরু হবে।'
    },
    {
      id: 'NTC-004',
      title: 'অভিভাবক সমাবেশ ও ৬ষ্ঠ-১০ম শ্রেণির প্রগতিপত্র (রিপোর্ট কার্ড) বিতরণ',
      date: '০৫ অক্টোবর ২০২৬',
      category: 'সাধারণ',
      isUrgent: false,
      description: 'শিক্ষার্থীদের অর্ধবার্ষিক পরীক্ষার ফলাফল মূল্যায়ন ও সার্বিক আচরণ পর্যালোচনা উপলক্ষে আগামী ১২ অক্টোবর শনিবার সকাল ১০:০০ টায় বিদ্যালয় অডিটোরিয়ামে অভিভাবক সমাবেশের আয়োজন করা হয়েছে। সকল শ্রদ্ধেয় অভিভাবককে যথাসময়ে উপস্থিত হয়ে শিক্ষার্থীদের প্রগতিপত্র গ্রহণ করার জন্য বিনীত অনুরোধ করা হচ্ছে।'
    },
    {
      id: 'NTC-005',
      title: 'বার্ষিক ক্রীড়া, বিজ্ঞান মেলা ও সাংস্কৃতিক প্রতিযোগিতা ২০২৬ এর রেজিস্ট্রেশন',
      date: '২৮ সেপ্টেম্বর ২০২৬',
      category: 'সহশিক্ষা',
      isUrgent: false,
      description: 'শিক্ষার্থীদের শারীরিক ও মানসিক বিকাশের লক্ষ্যে আগামী ডিসেম্বর মাসে বার্ষিক ক্রীড়া ও বিজ্ঞান মেলা অনুষ্ঠিত হবে। যে সকল শিক্ষার্থী দৌড়, ক্রিকেট, ফুটবল, উপস্থিত বক্তৃতা, বিতর্ক ও বিজ্ঞান প্রজেক্ট প্রদর্শনীতে অংশগ্রহণ করতে ইচ্ছুক, তারা নিজ নিজ শ্রেণি শিক্ষকের নিকট আগামী ২০ অক্টোবরের মধ্যে নাম তালিকাভুক্ত করবে।'
    }
  ];

  // 8 Important Links
  const importantLinks: ImportantLink[] = [
    {
      id: 'LNK-1',
      title: 'শিক্ষা মন্ত্রণালয়',
      shortDesc: 'মাধ্যমিক ও উচ্চ শিক্ষা বিভাগ',
      url: 'https://moedu.gov.bd',
      badge: 'মন্ত্রণালয়'
    },
    {
      id: 'LNK-2',
      title: 'পরীক্ষার রেজাল্ট',
      shortDesc: 'অফিসিয়াল পাবলিক পরীক্ষা ফলাফল',
      url: 'http://www.educationboardresults.gov.bd',
      badge: 'রেজাল্ট'
    },
    {
      id: 'LNK-3',
      title: 'ব্যানবেইস (BANBEIS)',
      shortDesc: 'বাংলাদেশ শিক্ষাতথ্য ও পরিসংখ্যান ব্যুরো',
      url: 'https://banbeis.gov.bd',
      badge: 'পরিসংখ্যান'
    },
    {
      id: 'LNK-4',
      title: 'নায়েম (NAEM)',
      shortDesc: 'জাতীয় শিক্ষা ব্যবস্থাপনা একাডেমি',
      url: 'https://naem.gov.bd',
      badge: 'প্রশিক্ষণ'
    },
    {
      id: 'LNK-5',
      title: 'এনসিটিবি (NCTB)',
      shortDesc: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড',
      url: 'https://nctb.gov.bd',
      badge: 'পাঠ্যবই'
    },
    {
      id: 'LNK-6',
      title: 'শিক্ষক বাতায়ন',
      shortDesc: 'ডিজিটাল পাঠ পরিকল্পনা ও রিসোর্স',
      url: 'https://teachers.gov.bd',
      badge: 'শিক্ষক'
    },
    {
      id: 'LNK-7',
      title: 'কিশোর বাতায়ন (Konnect)',
      shortDesc: 'শিক্ষার্থীদের জ্ঞান ও প্রতিভা বিকাশ',
      url: 'https://konnect.edu.bd',
      badge: 'শিক্ষার্থী'
    },
    {
      id: 'LNK-8',
      title: 'মাউশি (DSHE)',
      shortDesc: 'মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তর',
      url: 'https://dshe.gov.bd',
      badge: 'অধিদপ্তর'
    }
  ];

  // 6 Other Quick Links Pills
  const otherQuickLinks = [
    { label: 'ওয়েব মেইল', icon: Mail, url: '#' },
    { label: 'ভর্তি আবেদন', icon: GraduationCap, url: '#/admission' },
    { label: 'ই-স্কুল পোর্টাল', icon: Laptop, url: '#/login' },
    { label: 'ক্লাস রুটিন ও সিলেবাস', icon: Clock, url: '#' },
    { label: 'প্রাক্তন শিক্ষার্থী (Alumni)', icon: Users, url: '#' },
    { label: 'মতামত ও অভিযোগ', icon: MessageSquare, url: '#contact' },
  ];

  return (
    <section id="notices" className="py-16 sm:py-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* সেকশন হেডার */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 text-[#0B5D3B] bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Bell className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>তথ্য ও যোগাযোগ কেন্দ্র</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            নোটিশ বোর্ড ও গুরুত্বপূর্ণ লিঙ্ক
          </h2>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="w-14 h-1.5 bg-[#0B5D3B] rounded-full"></span>
            <span className="w-3.5 h-1.5 bg-[#F4B400] rounded-full"></span>
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed pt-2">
            বিদ্যালয়ের সর্বশেষ দাপ্তরিক ঘোষণা, পরীক্ষার বিজ্ঞপ্তি এবং জাতীয় শিক্ষা পোর্টালের জরুরি সংযোগসমূহ।
          </p>
        </div>

        {/* দুই কলামের মূল সেকশন (বক্স দুটির সমান উচ্চতা ও নিজস্ব স্ক্রলবার) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* ===================================================================
              ১ম কলাম: #নোটিশ বোর্ড (৫টি নোটিশ লিস্ট)
              =================================================================== */}
          <div className="bg-[#F8FAFC] dark:bg-slate-800/80 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-700/80 shadow-sm flex flex-col h-[590px]">
            {/* বক্স হেডার */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0B5D3B] text-white flex items-center justify-center shadow-md">
                  <Bell className="w-5 h-5 text-[#F4B400]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>নোটিশ বোর্ড</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">সর্বশেষ দাপ্তরিক ও শিক্ষামূলক বিজ্ঞপ্তি</p>
                </div>
              </div>

              {/* লাইভ ব্যাজ */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-[#0B5D3B] dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>আপডেট</span>
              </span>
            </div>

            {/* ৫টি নোটিশের স্ক্রলেবল লিস্ট (নিজস্ব স্ক্রলবার) */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
              {sampleNotices.map((notice, idx) => (
                <div
                  key={notice.id || idx}
                  className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 hover:border-[#0B5D3B] dark:hover:border-emerald-500 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    {/* টপ মেটা: তারিখ ও ক্যাটাগরি */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-[#0B5D3B]" />
                        <span>{notice.date}</span>
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        notice.isUrgent
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-[#0B5D3B] border border-emerald-200'
                      }`}>
                        {notice.category}
                      </span>
                    </div>

                    {/* ১-২ লাইনের শিরোনাম */}
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                      {notice.title}
                    </h4>
                  </div>

                  {/* ফুটার: বিস্তারিত বাটন */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-[#F4B400]" />
                      <span>দাপ্তরিক সার্কুলার</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setActiveNoticeModal(notice)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0B5D3B] hover:text-[#08492e] dark:text-emerald-400 dark:hover:text-emerald-300 group/btn"
                    >
                      <span>বিস্তারিত</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* নিচে "সকল নোটিশ" বাটন */}
            <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setShowAllNoticesModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#0B5D3B] hover:bg-[#08492e] shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                <FileText className="w-4 h-4 text-[#F4B400]" />
                <span>সকল নোটিশ আর্কাইভ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ===================================================================
              ২য় কলাম: #গুরুত্বপূর্ণ লিঙ্ক সমূহ (৮টি লিঙ্ক কার্ড)
              =================================================================== */}
          <div className="bg-[#F8FAFC] dark:bg-slate-800/80 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-700/80 shadow-sm flex flex-col h-[590px]">
            {/* বক্স হেডার */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0B5D3B] text-white flex items-center justify-center shadow-md">
                  <Globe className="w-5 h-5 text-[#F4B400]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>গুরুত্বপূর্ণ লিঙ্ক সমূহ</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">সরকারি ও জাতীয় শিক্ষা পোর্টাল সংযোগ</p>
                </div>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                ৮টি সংযোগ
              </span>
            </div>

            {/* ৮টি লিংকের স্ক্রলেবল লিস্ট (নিজস্ব স্ক্রলবার) */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
              {importantLinks.map((link) => (
                <div
                  key={link.id}
                  className="group bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 hover:border-[#0B5D3B] dark:hover:border-emerald-500 transition-all duration-200 shadow-xs hover:shadow-md flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* লিংক আইকন */}
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-[#0B5D3B] group-hover:text-white transition-colors">
                      <Link2 className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition-colors truncate">
                          {link.title}
                        </h4>
                        {link.badge && (
                          <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                            {link.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {link.shortDesc}
                      </p>
                    </div>
                  </div>

                  {/* "ভিজিট করুন" বাটন */}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#0B5D3B] dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/60 hover:bg-[#0B5D3B] hover:text-white dark:hover:bg-[#0B5D3B] dark:hover:text-white border border-emerald-200 dark:border-emerald-800 transition-all duration-200 shrink-0 shadow-2xs"
                  >
                    <span>ভিজিট করুন</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>

            {/* ফুটার নোট */}
            <div className="pt-3.5 mt-2 border-t border-slate-200 dark:border-slate-700 text-center shrink-0">
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#F4B400]" />
                <span>সকল লিংক বহিরাগত সরকারি ও অফিশিয়াল শিক্ষা পোর্টালে উন্মুক্ত হবে</span>
              </p>
            </div>
          </div>

        </div>

        {/* ===================================================================
            আলাদা "অন্যান্য লিঙ্ক সমূহ" স্ট্রিপ (৬টি লিংক পিল)
            =================================================================== */}
        <div className="mt-12 bg-gradient-to-r from-emerald-50/80 via-slate-50 to-amber-50/50 dark:from-slate-800/90 dark:via-slate-800 dark:to-slate-800/90 rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* স্ট্রিপ লেবেল */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0B5D3B]"></span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                অন্যান্য লিঙ্ক সমূহ:
              </span>
            </div>

            {/* ৬টি লিংক পিল */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {otherQuickLinks.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <a
                    key={index}
                    href={item.url}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 hover:border-[#0B5D3B] text-slate-700 dark:text-slate-200 hover:text-[#0B5D3B] dark:hover:text-emerald-400 text-xs font-semibold shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95 group"
                  >
                    <IconComponent className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400 group-hover:text-[#F4B400] transition-colors" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>

          </div>
        </div>

      </div>

      {/* ===================================================================
          নোটিশ বিস্তারিত মোডাল (NOTICE DETAILS MODAL)
          =================================================================== */}
      {activeNoticeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveNoticeModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0B5D3B] via-[#F4B400] to-[#0B5D3B]" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveNoticeModal(null)}
              aria-label="বন্ধ করুন"
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-[#0B5D3B] dark:text-emerald-400 border border-emerald-200">
                  {activeNoticeModal.category}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>প্রকাশিত: {activeNoticeModal.date}</span>
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                {activeNoticeModal.title}
              </h3>
            </div>

            {/* Content Body */}
            <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {activeNoticeModal.description}
            </div>

            {/* Signatory / Authority */}
            <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-500">
              <span>কর্তৃপক্ষ: প্রধান শিক্ষক / নোটিশ কমিটি</span>
              <span>স্মারক নং: ব.উ.বি/নোটিশ/২০২৬</span>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => alert('পিডিএফ বিজ্ঞপ্তি ডাউনলোড করা হচ্ছে...')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-[#0B5D3B] hover:text-white text-[#0B5D3B] font-bold text-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>বিজ্ঞপ্তি ডাউনলোড (PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveNoticeModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          সকল নোটিশ তালিকা মোডাল (ALL NOTICES ARCHIVE MODAL)
          =================================================================== */}
      {showAllNoticesModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowAllNoticesModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col p-6 sm:p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[#0B5D3B]">
                  <FileText className="w-5 h-5 text-[#0B5D3B]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    সকল নোটিশ আর্কাইভ
                  </h3>
                  <p className="text-xs text-slate-500">প্রতিষ্ঠানের সর্বমোট নোটিশ ও সার্কুলার তালিকা</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllNoticesModal(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto py-4 space-y-3 pr-1 flex-1">
              {sampleNotices.map((n, idx) => (
                <div
                  key={n.id || idx}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1 pr-4">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-[#0B5D3B]" />
                      <span>{n.date}</span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-[#0B5D3B]">{n.category}</span>
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{n.title}</h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAllNoticesModal(false);
                      setActiveNoticeModal(n);
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#0B5D3B] bg-emerald-50 hover:bg-[#0B5D3B] hover:text-white transition-colors shrink-0"
                  >
                    পড়ুন
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
