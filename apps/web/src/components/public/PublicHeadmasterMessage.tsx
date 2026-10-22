'use client';

import React, { useState } from 'react';
import { ArrowRight, X, Check } from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';
import { AboutConfig } from '@/services/landingPageService';

interface PublicHeadmasterMessageProps {
  settings: SchoolSettings | null;
  aboutConfig?: AboutConfig | null;
}

export default function PublicHeadmasterMessage({ settings, aboutConfig }: PublicHeadmasterMessageProps) {
  const schoolName = settings?.schoolName || 'Baraitoli High school';

  // 1. President (সভাপতি) Data Resolution
  const committeePresident = settings?.committeeMembers?.find(m => m.role.includes('সভাপতি'));
  const presidentName = (settings as any)?.presidentName || aboutConfig?.president?.name || committeePresident?.name || 'আলহাজ্ব মোস্তফা কামাল';
  const presidentTitle = (settings as any)?.presidentTitle || aboutConfig?.president?.title || 'সভাপতি, পরিচালনা পর্ষদ';
  const presidentPhoto = (settings as any)?.presidentPhoto || aboutConfig?.president?.photo || committeePresident?.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop';
  const presidentQuote = (settings as any)?.presidentQuote || (aboutConfig?.president as any)?.quote || 'বিদ্যালয়ের অবকাঠামোগত উন্নয়ন ও মানসম্মত শিক্ষা নিশ্চিত করতে পরিচালনা পর্ষদ অভিভাবক ও শিক্ষকদের সাথে নিরলসভাবে কাজ করে যাচ্ছে।”';
  const presidentMessage = (settings as any)?.presidentMessage || aboutConfig?.president?.message || 'বিদ্যালয়ের অবকাঠামোগত উন্নয়ন ও মানসম্মত শিক্ষা নিশ্চিত করতে পরিচালনা পর্ষদ অভিভাবক ও শিক্ষকদের সাথে নিরলসভাবে কাজ করে যাচ্ছে। পরিচালনা পর্ষদ, শিক্ষক এবং অভিভাবকদের সম্মিলিত প্রচেষ্টায় আমরা প্রতিষ্ঠানটিকে একটি মডেল বিদ্যাপীঠ হিসেবে গড়ে তুলছি। আধুনিক শ্রেণিকক্ষ, বিজ্ঞানাগার ও সহশিক্ষা কার্যক্রমের সুষ্ঠু বিকাশে আমরা অঙ্গীকারবদ্ধ।';

  // 2. Headmaster (প্রধান শিক্ষক) Data Resolution
  const principalName = settings?.principalName || aboutConfig?.headmaster?.name || 'মোহাম্মদ রফিকুল ইসলাম';
  const principalTitle = settings?.principalTitle || aboutConfig?.headmaster?.title || 'প্রধান শিক্ষক';
  const principalPhoto = (settings as any)?.principalPhoto || aboutConfig?.headmaster?.photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop';
  const principalQuote = (settings as any)?.principalQuote || (aboutConfig?.headmaster as any)?.quote || '“বরইতলী উচ্চ বিদ্যালয়ের পক্ষ থেকে সবাইকে আন্তরিক শুভেচ্ছা। আমরা বিশ্বাস করি প্রতিটি শিশুর মধ্যেই অফুরন্ত ও সম্ভাবনা রয়েছে। আমাদের কাজ হলো সেই প্রতিভাকে উপযুক্ত পরিচর্যা ও মানসম্মত শিক্ষার মাধ্যমে প্রস্ফুটিত করা।”';
  const principalMessage = (settings as any)?.principalMessage || aboutConfig?.headmaster?.message || '“বরইতলী উচ্চ বিদ্যালয়ের পক্ষ থেকে সবাইকে আন্তরিক শুভেচ্ছা। আমরা বিশ্বাস করি প্রতিটি শিশুর মধ্যেই অফুরন্ত ও সম্ভাবনা রয়েছে। আমাদের কাজ হলো সেই প্রতিভাকে উপযুক্ত পরিচর্যা ও মানসম্মত শিক্ষার মাধ্যমে প্রস্ফুটিত করা।” জ্ঞান, শৃঙ্খলা ও নৈতিকতাই একটি আদর্শ শিক্ষাপ্রতিষ্ঠানের মূল চালিকাশক্তি। আধুনিক যুগে প্রযুক্তিগত উৎকর্ষ ছাড়া শিক্ষা অসম্পূর্ণ, তাই আমাদের স্মার্ট ডিজিটাল ক্লাসরুম ও আইসিটি ল্যাব শিক্ষার্থীদের একবিংশ শতাব্দীর চ্যালেঞ্জ মোকাবিলায় দক্ষ করে তুলছে।';

  // Modal State for "আরো পড়ুন"
  const [activeLeaderModal, setActiveLeaderModal] = useState<{
    name: string;
    role: string;
    roleEn: string;
    photo: string;
    fullMessage: string[];
  } | null>(null);

  // Flat 2-Leader Structure: সভাপতি ও প্রধান শিক্ষক
  const leaders = [
    {
      id: 'president',
      role: presidentTitle,
      roleEn: 'President, Managing Committee',
      name: presidentName,
      photo: presidentPhoto,
      badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
      ringClass: 'p-1 bg-amber-50/60 dark:bg-amber-950/40 border-2 border-amber-400/90 ring-2 ring-amber-400/30',
      badgeBg: 'bg-blue-600',
      quote: presidentQuote,
      fullMessage: [
        'বিসমিল্লাহির রাহমানির রাহিম। ঐতিহ্যবাহী বরইতলী উচ্চ বিদ্যালয় এই অঞ্চলের শিক্ষা, সংস্কৃতি ও মননশীলতা বিকাশে এক ঐতিহাসিক ভূমিকা পালন করে আসছে। পরিচালনা পর্ষদের সভাপতি হিসেবে এই মহান প্রতিষ্ঠানের দায়িত্ব পালন করতে পেরে আমি আনন্দিত ও গর্বিত।',
        'বিদ্যালয়ের অবকাঠামোগত উন্নয়ন ও মানসম্মত শিক্ষা নিশ্চিত করতে পরিচালনা পর্ষদ অভিভাবক ও শিক্ষকদের সাথে নিরলসভাবে কাজ করে যাচ্ছে। পরিচালনা পর্ষদ, সম্মানিত শিক্ষকমণ্ডলী ও অভিভাবকবৃন্দের যৌথ অংশগ্রহণে বিদ্যালয়ের একাডেমিক ও অবকাঠামোগত মানোন্নয়নে আমরা সর্বদা সচেষ্ট।',
        'বিদ্যালয়ের আধুনিক বিজ্ঞানাগার, সমৃদ্ধ লাইব্রেরি ও স্মার্ট ডিজিটাল ল্যাব আমাদের শিক্ষার্থীদের ভবিষ্যতের চ্যালেঞ্জ মোকাবিলায় যোগ্য করে গড়ে তুলছে। পরিচালনা পর্ষদের পক্ষ থেকে আমি সকল শিক্ষার্থী, শিক্ষক ও শুভানুধ্যায়ীদের প্রতি আন্তরিক মোবারকবাদ ও শুভেচ্ছা জানাচ্ছি।'
      ]
    },
    {
      id: 'headmaster',
      role: principalTitle,
      roleEn: 'Headmaster & Principal',
      name: principalName,
      photo: principalPhoto,
      badgeClass: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      ringClass: 'p-1 bg-teal-50/60 dark:bg-teal-950/40 border-2 border-teal-500 ring-2 ring-teal-500/30',
      badgeBg: 'bg-teal-500',
      quote: principalQuote,
      fullMessage: [
        '“বরইতলী উচ্চ বিদ্যালয়ের পক্ষ থেকে সবাইকে আন্তরিক শুভেচ্ছা। আমরা বিশ্বাস করি প্রতিটি শিশুর মধ্যেই অফুরন্ত ও সম্ভাবনা রয়েছে। আমাদের কাজ হলো সেই প্রতিভাকে উপযুক্ত পরিচর্যা ও মানসম্মত শিক্ষার মাধ্যমে প্রস্ফুটিত করা।”',
        'জ্ঞান, শৃঙ্খলা ও নৈতিকতাই একটি আদর্শ শিক্ষাপ্রতিষ্ঠানের মূল চালিকাশক্তি। বরইতলী উচ্চ বিদ্যালয় দীর্ঘ পাঁচ দশকেরও বেশি সময় ধরে এই অঞ্চলের শিক্ষার্থীদের মাঝে শিক্ষার আলো ছড়িয়ে আসছে।',
        'আমরা প্রতিটি শিক্ষার্থীকে শুধু পরীক্ষায় ভালো ফলাফলের জন্য নয়, বরং মানবিক মূল্যবোধ, সততা ও দেশপ্রেমের আদর্শে উদ্বুদ্ধ করে গড়ে তুলতে নিরলসভাবে কাজ করছি। আধুনিক যুগে প্রযুক্তিগত উৎকর্ষ ছাড়া শিক্ষা অসম্পূর্ণ, তাই আমাদের স্মার্ট মাল্টিমিডিয়া ক্লাসরুম ও আইসিটি ল্যাব শিক্ষার্থীদের একবিংশ শতাব্দীর চ্যালেঞ্জ মোকাবিলায় দক্ষ করে তুলছে।'
      ]
    }
  ];

  return (
    <section 
      id="principal" 
      className="py-14 sm:py-20 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/70 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800 relative overflow-hidden"
    >
      <div id="headmaster" className="absolute -top-24 left-0" />
      
      {/* ── Soft Ambient Background Blurs ── */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-400/5 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-400/5 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ==============================================================
            SECTION HEADER (Exact match with Reference Layout)
            ============================================================== */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          
          {/* Main Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-slate-900 dark:text-white tracking-tight">
            স্কুল নেতৃবৃন্দের বাণী
          </h2>

          {/* Clean Two-Tone Accent Line (Emerald & Gold) */}
          <div className="flex items-center justify-center gap-1.5 mt-3 mb-3.5">
            <span className="w-11 h-1.5 bg-[#065f46] rounded-full"></span>
            <span className="w-3.5 h-1.5 bg-[#f59e0b] rounded-full"></span>
          </div>

          {/* Subtitle Description */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto font-sans">
            {schoolName}-এর সার্বিক উন্নয়ন, শিক্ষার মানোন্নয়ন ও ভবিষ্যৎ পরিকল্পনা নিয়ে সভাপতি ও প্রধান শিক্ষকের দিকনির্দেশনামূলক বক্তব্য।
          </p>
        </div>

        {/* ==============================================================
            THE TWO LEADER CARDS (Matching Reference Layout Perfectly)
            ============================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {leaders.map((leader) => (
            <div
              key={leader.id}
              className="bg-white dark:bg-slate-900 border-2 border-slate-900/90 dark:border-slate-700 rounded-[28px] p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/50 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Profile Header: Circular Photo + Badge + Name */}
                <div className="flex items-center gap-4 sm:gap-6 pb-6">
                  
                  {/* Perfect Circular Avatar with Distinctive Ring */}
                  <div className="relative shrink-0">
                    <div className={`w-22 h-22 sm:w-24 sm:h-24 rounded-full ${leader.ringClass} flex items-center justify-center shadow-md`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={leader.photo}
                        alt={leader.name}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = leader.id === 'president'
                            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop'
                            : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop';
                        }}
                      />
                    </div>

                    {/* Verified Checkmark Badge at Bottom Right */}
                    <div className={`absolute bottom-0.5 right-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full ${leader.badgeBg} border-2 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-md`}>
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                    </div>
                  </div>

                  {/* Title and Name Information */}
                  <div className="min-w-0 flex-1">
                    <span className={`inline-block text-xs font-bold px-3 py-1 rounded-lg border mb-1.5 ${leader.badgeClass}`}>
                      {leader.role}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                      {leader.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {schoolName}
                    </p>
                  </div>
                </div>

                {/* Speech Quotation Body */}
                <div className="pt-2 space-y-2">
                  <div className="text-teal-600 dark:text-teal-400 text-3xl sm:text-4xl font-serif font-black leading-none select-none">
                    “
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-[15px] leading-relaxed text-justify font-normal line-clamp-4">
                    {leader.quote}
                  </p>
                </div>
              </div>

              {/* Card Footer: "আরো পড়ুন →" & English Title */}
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveLeaderModal(leader)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 group/btn transition-colors cursor-pointer"
                >
                  <span>আরো পড়ুন</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>

                <span className="text-xs text-slate-500 dark:text-slate-400 font-en font-medium">
                  {leader.roleEn}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ==============================================================
          FULL SPEECH READ-MORE MODAL
          ============================================================== */}
      {activeLeaderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Close Button */}
            <button
              onClick={() => setActiveLeaderModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <img
                src={activeLeaderModal.photo}
                alt={activeLeaderModal.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm"
              />
              <div>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide">
                  {activeLeaderModal.role}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {activeLeaderModal.name}
                </h3>
                <p className="text-xs text-slate-500">{schoolName}</p>
              </div>
            </div>

            {/* Full Speech Paragraphs */}
            <div className="space-y-3.5 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed text-justify">
              {activeLeaderModal.fullMessage.map((paragraph, idx) => (
                <p key={idx} className="indent-4">{paragraph}</p>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveLeaderModal(null)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}