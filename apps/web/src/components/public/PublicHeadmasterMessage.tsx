'use client';

import React, { useState } from 'react';
import { Quote, ArrowRight, X, Award, CheckCircle2, UserCheck, ShieldCheck } from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';
import { AboutConfig } from '@/services/landingPageService';

interface PublicHeadmasterMessageProps {
  settings: SchoolSettings | null;
  aboutConfig?: AboutConfig | null;
}

export default function PublicHeadmasterMessage({ settings, aboutConfig }: PublicHeadmasterMessageProps) {
  const schoolName = settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';

  // 1. President (সভাপতি) Data Resolution
  const committeePresident = settings?.committeeMembers?.find(m => m.role.includes('সভাপতি'));
  const presidentName = (settings as any)?.presidentName || aboutConfig?.president?.name || committeePresident?.name || 'আলহাজ্ব মোস্তফা কামাল';
  const presidentTitle = (settings as any)?.presidentTitle || aboutConfig?.president?.title || 'সভাপতি, পরিচালনা পর্ষদ';
  const presidentPhoto = (settings as any)?.presidentPhoto || aboutConfig?.president?.photo || committeePresident?.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop';
  const presidentMessage = (settings as any)?.presidentMessage || aboutConfig?.president?.message || committeePresident?.bio || 'শিক্ষার আলো ছড়িয়ে দিতে এবং মানবিক গুণাবলিসম্পন্ন ভবিষ্যৎ প্রজন্ম গড়ে তুলতে বরইতলী উচ্চ বিদ্যালয় বদ্ধপরিকর। পরিচালনা পর্ষদ, শিক্ষক এবং অভিভাবকদের সম্মিলিত প্রচেষ্টায় আমরা প্রতিষ্ঠানটিকে একটি মডেল বিদ্যাপীঠ হিসেবে গড়ে তুলছি। আধুনিক শ্রেণিকক্ষ, বিজ্ঞানাগার ও সহশিক্ষা কার্যক্রমের সুষ্ঠু বিকাশে আমরা নিরলস কাজ করছি।';

  // 2. Headmaster (প্রধান শিক্ষক) Data Resolution
  const principalName = settings?.principalName || aboutConfig?.headmaster?.name || 'মোহাম্মদ রফিকুল ইসলাম';
  const principalTitle = settings?.principalTitle || aboutConfig?.headmaster?.title || 'প্রধান শিক্ষক (অধ্যক্ষ)';
  const principalPhoto = (settings as any)?.principalPhoto || aboutConfig?.headmaster?.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop';
  const principalMessage = (settings as any)?.principalMessage || aboutConfig?.headmaster?.message || 'জ্ঞান, শৃঙ্খলা ও নৈতিকতাই একটি আদর্শ শিক্ষাপ্রতিষ্ঠানের মূল চালিকাশক্তি। বরইতলী উচ্চ বিদ্যালয় দীর্ঘ পাঁচ দশকেরও বেশি সময় ধরে শিক্ষার আলো ছড়িয়ে আসছে। আমরা প্রতিটি শিক্ষার্থীকে শুধু পরীক্ষায় ভালো ফলাফলের জন্য নয়, বরং মানবিক মূল্যবোধ ও দেশপ্রেমের আদর্শে উদ্বুদ্ধ করে গড়ে তুলতে প্রতিশ্রুতিবদ্ধ।';

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
      badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
      iconBadge: <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />,
      summary: presidentMessage,
      fullMessage: [
        'বিসমিল্লাহির রাহমানির রাহিম। ঐতিহ্যবাহী বরইতলী উচ্চ বিদ্যালয় এই অঞ্চলের শিক্ষা, সংস্কৃতি ও মননশীলতা বিকাশে এক ঐতিহাসিক ভূমিকা পালন করে আসছে। পরিচালনা পর্ষদের সভাপতি হিসেবে এই মহান প্রতিষ্ঠানের দায়িত্ব পালন করতে পেরে আমি আনন্দিত ও গর্বিত।',
        'একটি মানসম্মত শিক্ষাপ্রতিষ্ঠান শুধু পাঠ্যবইয়ের পড়াশোনায় সীমাবদ্ধ থাকে না; বরং শিক্ষার্থীদের নৈতিক মূল্যবোধ, শৃঙ্খলা ও সামাজিক দায়বদ্ধতা অর্জনে পথপ্রদর্শক হিসেবে কাজ করে। আমরা পরিচালনা পর্ষদ, সম্মানিত শিক্ষকমণ্ডলী ও অভিভাবকবৃন্দের যৌথ অংশগ্রহণে বিদ্যালয়ের একাডেমিক ও অবকাঠামোগত মানোন্নয়নে সর্বদা সচেষ্ট রয়েছি।',
        'বিদ্যালয়ের আধুনিক বিজ্ঞানাগার, সমৃদ্ধ লাইব্রেরি ও স্মার্ট ডিজিটাল ল্যাব আমাদের শিক্ষার্থীদের ভবিষ্যতের চ্যালেঞ্জ মোকাবিলায় যোগ্য করে গড়ে তুলছে। পরিচালনা পর্ষদের পক্ষ থেকে আমি সকল শিক্ষার্থী, শিক্ষক ও শুভানুধ্যায়ীদের প্রতি আন্তরিক মোবারকবাদ ও শুভেচ্ছা জানাচ্ছি।'
      ]
    },
    {
      id: 'headmaster',
      role: principalTitle,
      roleEn: 'Headmaster & Principal',
      name: principalName,
      photo: principalPhoto,
      badgeColor: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      iconBadge: <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
      summary: principalMessage,
      fullMessage: [
        'জ্ঞান, শৃঙ্খলা ও নৈতিকতাই একটি আদর্শ শিক্ষাপ্রতিষ্ঠানের মূল চালিকাশক্তি। বরইতলী উচ্চ বিদ্যালয় দীর্ঘ পাঁচ দশকেরও বেশি সময় ধরে এই অঞ্চলের শিক্ষার্থীদের মাঝে শিক্ষার আলো ছড়িয়ে আসছে।',
        'আমরা প্রতিটি শিক্ষার্থীকে শুধু পরীক্ষায় ভালো ফলাফলের জন্য নয়, বরং মানবিক মূল্যবোধ, সততা ও দেশপ্রেমের আদর্শে উদ্বুদ্ধ করে গড়ে তুলতে নিরলসভাবে কাজ করছি। আধুনিক যুগে প্রযুক্তিগত উৎকর্ষ ছাড়া শিক্ষা অসম্পূর্ণ, তাই আমাদের স্মার্ট মাল্টিমিডিয়া ক্লাসরুম ও আইসিটি ল্যাব শিক্ষার্থীদের একবিংশ শতাব্দীর চ্যালেঞ্জ মোকাবিলায় দক্ষ করে তুলছে।',
        'অভিভাবক ও শিক্ষকদের সম্মিলিত সহযোগিতায় আমাদের প্রিয় প্রতিষ্ঠানটি উত্তরোত্তর সাফল্যের শিখরে আরোহণ করবে—এই বিশ্বাস আমাদের রয়েছে। সকল শিক্ষার্থী, শিক্ষক ও শুভানুধ্যায়ীদের প্রতি রইল আমার আন্তরিক শুভকামনা ও দোয়া।'
      ]
    }
  ];

  return (
    <section id="principal" className="py-10 sm:py-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 relative">
      <div id="headmaster" className="absolute -top-24 left-0" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ==============================================================
            SECTION HEADER: Clean, Professional & Flat
            ============================================================== */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-3">
            <Quote className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>দিকনির্দেশনা ও অনুপ্রেরণা</span>
          </div>

          {/* Main Title */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            স্কুল নেতৃবৃন্দের বাণী
          </h2>

          {/* Clean Flat Accent Line */}
          <div className="flex items-center justify-center gap-1.5 mt-2.5 mb-3">
            <span className="w-12 h-1 bg-[#0B5D3B] rounded-full"></span>
            <span className="w-3 h-1 bg-[#F4B400] rounded-full"></span>
          </div>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            {schoolName}-এর সার্বিক উন্নয়ন, শিক্ষার মানোন্নয়ন ও ভবিষ্যৎ পরিকল্পনা নিয়ে সভাপতি ও প্রধান শিক্ষক মহোদয়ের দিকনির্দেশনামূলক বক্তব্য।
          </p>
        </div>

        {/* ==============================================================
            FLAT TWO-COLUMN LEADER CARDS: সভাপতি ও প্রধান শিক্ষক
            ============================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {leaders.map((leader) => (
            <div
              key={leader.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between group"
            >
              <div>
                {/* Profile Header: Avatar + Designation + Name */}
                <div className="flex items-center gap-4 sm:gap-5 pb-5 border-b border-slate-100 dark:border-slate-800">
                  {/* Clean Flat Avatar */}
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={leader.photo}
                      alt={leader.name}
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                      onError={(e) => {
                        // Fallback image if custom photo fails
                        (e.target as HTMLImageElement).src = leader.id === 'president'
                          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop'
                          : 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop';
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
                      {leader.iconBadge}
                    </div>
                  </div>

                  {/* Title and Name */}
                  <div className="min-w-0 flex-1">
                    <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border mb-1.5 ${leader.badgeColor}`}>
                      {leader.role}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight truncate">
                      {leader.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {schoolName}
                    </p>
                  </div>
                </div>

                {/* Speech Quotation Body */}
                <div className="pt-5 space-y-2">
                  <Quote className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-current opacity-60" />
                  <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-[15px] leading-relaxed text-justify font-normal line-clamp-5">
                    "{leader.summary}"
                  </p>
                </div>
              </div>

              {/* Card Footer: "আরো পড়ুন" and English Designation */}
              <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveLeaderModal(leader)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 group/btn transition-colors focus:outline-hidden"
                >
                  <span>আরো পড়ুন</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>

                <span className="text-[11px] text-slate-400 font-en font-medium hidden sm:inline">
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
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <img
                src={activeLeaderModal.photo}
                alt={activeLeaderModal.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
              />
              <div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
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
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
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
