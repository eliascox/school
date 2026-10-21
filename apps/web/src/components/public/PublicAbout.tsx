'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { School, CheckCircle2, ArrowRight, Award, Calendar, BookOpen } from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';

interface PublicAboutProps {
  settings: SchoolSettings | null;
}

export default function PublicAbout({ settings }: PublicAboutProps) {
  const schoolName = settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const estd = settings?.estdYear || '1969';
  const address = settings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার।';
  const eiin = settings?.eiin || '106184';
  const schoolPhoto = settings?.schoolPhoto || '/school-campus.jpg';

  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            imageRef.current?.classList.remove('opacity-0', '-translate-x-12');
            imageRef.current?.classList.add('opacity-100', 'translate-x-0');

            textRef.current?.classList.remove('opacity-0', 'translate-x-12');
            textRef.current?.classList.add('opacity-100', 'translate-x-0');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="about" 
      ref={sectionRef}
      className="py-10 sm:py-14 bg-[#F5F7FA] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-hidden relative"
    >
      <div id="recognition" className="absolute -top-24 left-0" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Two Column Layout: Mobile (Image on Top, Text Below), Desktop (Side-by-Side) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ═══════════ LEFT COLUMN: LARGE IMAGE WITH OFFSET COLORED BORDER ═══════════ */}
          <div 
            ref={imageRef}
            className="lg:col-span-6 relative transition-all duration-1000 ease-out opacity-0 -translate-x-12"
          >
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              
              {/* Offset Decorative Colored Border & Shape (পেছনে সামান্য অফসেট রঙিন বর্ডার) */}
              <div className="absolute -inset-2 sm:-inset-4 rounded-3xl bg-gradient-to-tr from-[#0B5D3B] to-[#F4B400] opacity-90 -rotate-2 transform transition-transform group-hover:rotate-0"></div>
              <div className="absolute -inset-1 sm:-inset-2 rounded-3xl bg-[#0B5D3B] opacity-80 rotate-1"></div>

              {/* Main Image Container */}
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 shadow-2xl border-4 border-white dark:border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={schoolPhoto} 
                  alt={`${schoolName} ক্যাম্পাস`} 
                  className="w-full h-[320px] sm:h-[420px] lg:h-[460px] object-cover hover:scale-105 transition-transform duration-700"
                />
                
                {/* Soft Gradient Overlay for Tag Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none"></div>

                {/* Floating Experience Badge */}
                <div className="absolute bottom-5 left-5 right-5 z-10 flex items-center justify-between gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 sm:p-4 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#0B5D3B] text-[#F4B400] flex items-center justify-center font-black shadow-md shrink-0">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">ঐতিহ্যের ৫৫ বছর</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">স্থাপিত: {estd} খ্রিষ্টাব্দ</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#0B5D3B] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full whitespace-nowrap">
                    EIIN: {eiin}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* ═══════════ RIGHT COLUMN: HEADING, HISTORY TEXT & BUTTON ═══════════ */}
          <div 
            ref={textRef}
            className="lg:col-span-6 space-y-6 transition-all duration-1000 ease-out opacity-0 translate-x-12"
          >
            {/* Top Eyebrow Tag */}
            <div className="inline-flex items-center gap-2 text-[#0B5D3B] bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs font-bold uppercase tracking-wider">
              <School className="w-3.5 h-3.5" />
              <span>প্রতিষ্ঠান পরিচিতি ও ইতিহাস</span>
            </div>

            {/* Section Heading with Custom Underline */}
            <div>
              <h2 className="text-2xl sm:text-4xl lg:text-4xl font-extrabold text-slate-900 dark:text-white font-serif leading-tight">
                আমাদের ঐতিহ্য, গৌরব ও পথচলা
              </h2>
              {/* Dual-colored Underline */}
              <div className="flex items-center gap-1.5 mt-3">
                <span className="w-16 h-1.5 bg-[#0B5D3B] rounded-full"></span>
                <span className="w-4 h-1.5 bg-[#F4B400] rounded-full"></span>
              </div>
            </div>

            {/* ৫-৬ লাইনের সাবলীল ইতিহাস বর্ণনা */}
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed text-justify">
              কক্সবাজার জেলার চকরিয়া উপজেলার অন্তর্গত ঐতিহ্যবাহী বরইতলী ইউনিয়নের প্রাণকেন্দ্রে ১৯৬৯ খ্রিষ্টাব্দে প্রতিষ্ঠিত হয় ‘<strong>{schoolName}</strong>’। তৎকালীন স্থানীয় শিক্ষানুরাগী, সমাজসেবক ও বিদ্যোৎসাহী ব্যক্তিবর্গের ঐকান্তিক প্রচেষ্টা ও ত্যাগের বিনিময়ে এই অঞ্চলে শিক্ষার আলো ছড়িয়ে দিতে বিদ্যালয়টির যাত্রা শুরু হয়েছিল। প্রতিষ্ঠালগ্ন থেকেই অত্র অঞ্চলের শিক্ষার্থীদের মানবিক গুণাবলি, শৃঙ্খলাবোধ এবং আধুনিক জ্ঞান-বিজ্ঞানে সমৃদ্ধ করে গড়ে তোলাই ছিল মূল ব্রত। দীর্ঘ পাঁচ দশকেরও বেশি সময় ধরে চট্টগ্রাম শিক্ষাবোর্ডের অধীনে বিদ্যালয়টি শতভাগ মেধা ও কৃতিত্বপূর্ণ ফলাফলের ধারাবাহিকতা অক্ষুণ্ণ রেখেছে। বর্তমান ডিজিটাল যুগে যুগোপযোগী বিজ্ঞান ও কম্পিউটার শিক্ষার সমন্বয়ে বিদ্যালয়টি আগামীর একবিংশ শতাব্দীর যোগ্য নাগরিক তৈরিতে অবিচল ও প্রতিশ্রুতিবদ্ধ।
            </p>

            {/* Key Features Bullet List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0B5D3B] shrink-0" />
                <span>চট্টগ্রাম শিক্ষাবোর্ড অনুমোদিত</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0B5D3B] shrink-0" />
                <span>অভিজ্ঞ ও এমপিওভুক্ত শিক্ষকমণ্ডলী</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0B5D3B] shrink-0" />
                <span>আধুনিক বিজ্ঞানাগার ও আইসিটি ল্যাব</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0B5D3B] shrink-0" />
                <span>সুশৃঙ্খল ও রাজনীতিমুক্ত ক্যাম্পাস</span>
              </div>
            </div>

            {/* Action Button: বিস্তারিত পড়ুন */}
            <div className="pt-2">
              <Link
                href="#school-info"
                className="inline-flex items-center gap-2 bg-[#0B5D3B] hover:bg-[#073B25] text-white font-bold px-7 py-3.5 rounded-full text-sm sm:text-base transition duration-300 shadow-md shadow-emerald-900/20 transform hover:-translate-y-0.5"
              >
                <span>বিস্তারিত পড়ুন</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
