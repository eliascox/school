'use client';

import React, { useState } from 'react';
import { Quote, ArrowRight, X, Award, CheckCircle2 } from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';

interface PublicHeadmasterMessageProps {
  settings: SchoolSettings | null;
}

export default function PublicHeadmasterMessage({ settings }: PublicHeadmasterMessageProps) {
  const principalName = settings?.principalName || 'মোহাম্মদ রফিকুল ইসলাম';
  const principalTitle = settings?.principalTitle || 'প্রধান শিক্ষক (অধ্যক্ষ)';
  const schoolName = settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';

  // Modal State for "আরো পড়ুন"
  const [activeLeaderModal, setActiveLeaderModal] = useState<{
    name: string;
    role: string;
    photo: string;
    fullMessage: string[];
  } | null>(null);

  const leaders = [
    {
      role: 'প্রধান শিক্ষক / অধ্যক্ষ',
      roleEn: 'Headmaster & Principal',
      name: principalName,
      photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop',
      summary: 'জ্ঞান, শৃঙ্খলা ও নৈতিকতাই একটি আদর্শ শিক্ষাপ্রতিষ্ঠানের মূল চালিকাশক্তি। বরইতলী উচ্চ বিদ্যালয় দীর্ঘ পাঁচ দশকেরও বেশি সময় ধরে এই অঞ্চলের শিক্ষার্থীদের মাঝে শিক্ষার আলো ছড়িয়ে আসছে। আমরা প্রতিটি শিক্ষার্থীকে শুধু পরীক্ষায় ভালো ফলাফলের জন্য নয়, বরং মানবিক মূল্যবোধ ও দেশপ্রেমের আদর্শে উদ্বুদ্ধ করে গড়ে তুলতে প্রতিশ্রুতিবদ্ধ। তথ্যপ্রযুক্তির এই যুগে আধুনিক বিজ্ঞান ও কম্পিউটার শিক্ষার পাশাপাশি শিক্ষার্থীদের চরিত্র গঠনে আমাদের শিক্ষক ও অভিভাবকমণ্ডলী একযোগে কাজ করে যাচ্ছেন। আলোকিত মানুষ হয়ে তোমরা দেশ ও জাতির মুখ উজ্জ্বল করবে—এটাই আমাদের একান্ত প্রত্যাশা।',
      fullMessage: [
        'জ্ঞান, শৃঙ্খলা ও নৈতিকতাই একটি আদর্শ শিক্ষাপ্রতিষ্ঠানের মূল চালিকাশক্তি। বরইতলী উচ্চ বিদ্যালয় দীর্ঘ পাঁচ দশকেরও বেশি সময় ধরে এই অঞ্চলের শিক্ষার্থীদের মাঝে শিক্ষার আলো ছড়িয়ে আসছে।',
        'আমরা প্রতিটি শিক্ষার্থীকে শুধু পরীক্ষায় ভালো ফলাফলের জন্য নয়, বরং মানবিক মূল্যবোধ, সততা ও দেশপ্রেমের আদর্শে উদ্বুদ্ধ করে গড়ে তুলতে নিরলসভাবে কাজ করছি। আধুনিক যুগে প্রযুক্তিগত উৎকর্ষ ছাড়া শিক্ষা অসম্পূর্ণ, তাই আমাদের স্মার্ট মাল্টিমিডিয়া ক্লাসরুম ও আইসিটি ল্যাব শিক্ষার্থীদের একবিংশ শতাব্দীর চ্যালেঞ্জ মোকাবিলায় দক্ষ করে তুলছে।',
        'অভিভাবক ও শিক্ষকদের সম্মিলিত সহযোগিতায় আমাদের প্রিয় প্রতিষ্ঠানটি উত্তরোত্তর সাফল্যের শিখরে আরোহণ করবে—এই বিশ্বাস আমাদের রয়েছে। সকল শিক্ষার্থী, শিক্ষক ও শুভানুধ্যায়ীদের প্রতি রইল আমার আন্তরিক শুভকামনা ও দোয়া।'
      ]
    },
    {
      role: 'সহকারী প্রধান শিক্ষক / উপাধ্যক্ষ',
      roleEn: 'Assistant Headmaster / Vice Principal',
      name: 'জনাব আবু তাহের চৌধুরী',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
      summary: 'একটি সুশৃঙ্খল ও গতিশীল শিক্ষাঙ্গনই পারে কোমলমতি শিক্ষার্থীদের সুপ্ত প্রতিভার পরিপূর্ণ বিকাশ ঘটাতে। বরইতলী উচ্চ বিদ্যালয়ে আমরা পাঠ্যক্রমভিত্তিক পড়াশোনার পাশাপাশি বিতর্ক, বিজ্ঞানচর্চা, স্কাউটিং ও খেলাধুলার মতো সহশিক্ষা কার্যক্রমে সমান গুরুত্ব প্রদান করি। শিক্ষার প্রধান উদ্দেশ্য হলো শিক্ষার্থীর মনোজগতে সত্য ও সুন্দরের বীজ বপন করা। আমাদের নিবেদিতপ্রাণ শিক্ষকবৃন্দ পরম যত্ন ও নিষ্ঠার সাথে শিক্ষার্থীদের পাঠদান পরিচালনা করছেন। অভিভাবকবৃন্দের নিয়মিত তদারকি ও সচেতনতা আমাদের কার্যক্রমকে আরও সফল করবে বলে আমি দৃঢ়ভাবে বিশ্বাস করি।',
      fullMessage: [
        'একটি সুশৃঙ্খল ও গতিশীল শিক্ষাঙ্গনই পারে কোমলমতি শিক্ষার্থীদের সুপ্ত প্রতিভার পরিপূর্ণ বিকাশ ঘটাতে। বরইতলী উচ্চ বিদ্যালয়ে আমরা প্রতিটি শিক্ষার্থীর পাঠোন্নতি নিবিড়ভাবে পর্যবেক্ষণ করি।',
        'পাঠ্যক্রমভিত্তিক পড়াশোনার পাশাপাশি বিতর্ক, বিজ্ঞানমেলা, খেলাধুলা ও সাংস্কৃতিক কর্মকাণ্ডে শিক্ষার্থীদের অংশগ্রহণ তাদের নেতৃত্বগুণ ও আত্মবিশ্বাস বাড়িয়ে তোলে। আমরা বিশ্বাস করি, মুখস্থবিদ্যা নয় বরং সৃজনশীল চিন্তাশক্তিই শিক্ষার প্রকৃত উদ্দেশ্য।',
        'বিদ্যালয়ের সকল নিয়মনীতি মেনে সুনাগরিক হিসেবে নিজেদের গড়ে তোলাই হোক আমাদের শিক্ষার্থীদের একমাত্র লক্ষ্য। বিদ্যালয়ের ধারাবাহিক সাফল্যে সকলের আন্তরিক সহযোগিতা কামনা করছি।'
      ]
    }
  ];

  return (
    <section id="principal" className="py-16 sm:py-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Dual-colored Underline */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 text-[#0B5D3B] bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Quote className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>দিকনির্দেশনা ও অনুপ্রেরণা</span>
          </div>
          
          <div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif leading-tight">
              স্কুল পরিচালকদের বাণী
            </h2>
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <span className="w-16 h-1.5 bg-[#0B5D3B] rounded-full"></span>
              <span className="w-4 h-1.5 bg-[#F4B400] rounded-full"></span>
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            {schoolName}-এর সার্বিক উন্নয়ন, শিক্ষার মানোন্নয়ন ও ভবিষ্যৎ পরিকল্পনা নিয়ে আমাদের সম্মানিত শিক্ষানেতৃবৃন্দের বক্তব্য।
          </p>
        </div>

        {/* ── দুটি কার্ড পাশাপাশি (মোবাইলে উপর-নিচে): অধ্যক্ষ ও উপাধ্যক্ষ ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {leaders.map((leader, index) => (
            <div
              key={index}
              className="relative bg-emerald-50/40 dark:bg-slate-800/60 border-l-[6px] border-[#0B5D3B] rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-t border-r border-b border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between group overflow-hidden"
            >
              {/* বড় কোটেশন আইকন ওয়াটারমার্ক (Watermark Quote Icon) */}
              <div className="absolute top-4 right-4 text-[#0B5D3B]/10 dark:text-emerald-400/10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                <Quote className="w-20 h-20 sm:w-24 sm:h-24 fill-current" />
              </div>

              <div className="relative z-10 space-y-5">
                {/* প্রোফাইল হেডার: গোলাকার ছবি + পদবি ও নাম */}
                <div className="flex items-center gap-4 sm:gap-5">
                  {/* গোলাকার প্রোফাইল ছবি */}
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={leader.photo}
                      alt={leader.name}
                      className="w-18 h-18 sm:w-22 sm:h-22 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-md ring-2 ring-[#0B5D3B]/30"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0B5D3B] text-white flex items-center justify-center border-2 border-white shadow-xs">
                      <Award className="w-3.5 h-3.5 text-[#F4B400]" />
                    </div>
                  </div>

                  {/* পদবি ও নাম */}
                  <div>
                    <span className="inline-block text-[11px] sm:text-xs font-bold text-[#0B5D3B] dark:text-emerald-400 uppercase tracking-wider bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-2xs mb-1">
                      {leader.role}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold font-serif text-slate-900 dark:text-white leading-snug">
                      {leader.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {schoolName}
                    </p>
                  </div>
                </div>

                {/* ৫-৬ লাইনের বাণী */}
                <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-[15px] leading-relaxed text-justify italic font-normal">
                  "{leader.summary}"
                </p>
              </div>

              {/* কার্ডের নিচে "আরো পড়ুন" লিংক */}
              <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-slate-700/60 relative z-10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveLeaderModal(leader)}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0B5D3B] dark:text-emerald-400 hover:text-[#073B25] group/btn transition-colors focus:outline-hidden"
                >
                  <span>আরো পড়ুন</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>

                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  {leader.roleEn}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ── বিস্তারিত বাণীর রিড-মোর পপআপ মোডাল (Read More Modal) ── */}
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
                className="w-16 h-16 rounded-full object-cover border-2 border-[#0B5D3B] shadow-md"
              />
              <div>
                <span className="text-xs font-bold text-[#0B5D3B] dark:text-emerald-400 uppercase tracking-wide">
                  {activeLeaderModal.role}
                </span>
                <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
                  {activeLeaderModal.name}
                </h3>
                <p className="text-xs text-slate-500">{schoolName}</p>
              </div>
            </div>

            {/* Full Speech Paragraphs */}
            <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed text-justify">
              {activeLeaderModal.fullMessage.map((p, i) => (
                <p key={i} className="indent-4">{p}</p>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveLeaderModal(null)}
                className="px-5 py-2 bg-[#0B5D3B] hover:bg-[#073B25] text-white font-bold text-xs rounded-xl shadow transition-colors"
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
