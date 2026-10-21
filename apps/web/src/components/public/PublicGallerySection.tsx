'use client';

import React, { useState } from 'react';
import { 
  Camera, 
  Play, 
  Image as ImageIcon, 
  Video, 
  ArrowRight, 
  X, 
  ExternalLink, 
  Eye, 
  ZoomIn, 
  Calendar 
} from 'lucide-react';

interface GalleryMediaItem {
  id: number;
  type: 'image' | 'video';
  title: string;
  category: string;
  thumbnail: string;
  date: string;
  videoUrl?: string;
  caption: string;
}

export default function PublicGallerySection() {
  // 3 Gallery Items (Images and Video)
  const galleryItems: GalleryMediaItem[] = [
    {
      id: 1,
      type: 'image',
      title: 'স্মার্ট মাল্টিমিডিয়া ক্লাসরুমে আনন্দময় পাঠদান',
      category: 'অ্যাকাডেমিক',
      thumbnail: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop',
      date: '১২ অক্টোবর ২০২৬',
      caption: 'শিক্ষার্থীদের ডিজিটাল কনটেন্ট ও ইন্টারেক্টিভ স্মার্টবোর্ডের মাধ্যমে পাঠদান কার্যক্রম।'
    },
    {
      id: 2,
      type: 'video',
      title: 'বার্ষিক ক্রীড়া ও সাংস্কৃতিক প্রতিযোগিতা ২০২৬',
      category: 'ভিডিও হাইলাইটস',
      thumbnail: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop',
      date: '০৫ অক্টোবর ২০২৬',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      caption: 'বিদ্যালয়ের বার্ষিক ক্রীড়া প্রতিযোগিতা ও মনোজ্ঞ সাংস্কৃতিক অনুষ্ঠানের সেরা মুহূর্তসমূহ।'
    },
    {
      id: 3,
      type: 'image',
      title: 'বিজ্ঞান মেলা ও শিক্ষার্থীদের রোবটিক্স প্রজেক্ট প্রদর্শনী',
      category: 'বিজ্ঞান ও প্রযুক্তি',
      thumbnail: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=800&auto=format&fit=crop',
      date: '২৮ সেপ্টেম্বর ২০২৬',
      caption: 'শেখ রাসেল ডিজিটাল ল্যাবে খুদে বিজ্ঞানীদের উদ্ভাবনী রোবটিক্স এবং বিজ্ঞান প্রজেক্ট প্রদর্শনী।'
    }
  ];

  // Lightbox Modal State
  const [activeMedia, setActiveMedia] = useState<GalleryMediaItem | null>(null);
  const [showAllModal, setShowAllModal] = useState<boolean>(false);

  return (
    <section id="gallery" className="py-10 sm:py-14 bg-[#F5F7FA] dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ===================================================================
            সেকশন হেডার
            =================================================================== */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 text-[#0B5D3B] bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Camera className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>ক্যাম্পাস লাইফ ও স্মৃতি</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            ছবি এবং ভিডিও গ্যালারী
          </h2>

          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="w-14 h-1.5 bg-[#0B5D3B] rounded-full"></span>
            <span className="w-3.5 h-1.5 bg-[#F4B400] rounded-full"></span>
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed pt-1">
            বিদ্যালয়ের প্রাণবন্ত পাঠদান, ক্রীড়া ও সাংস্কৃতিক উৎসব এবং বিজ্ঞান প্রদর্শনীর স্মরণীয় মুহূর্তসমূহ।
          </p>
        </div>

        {/* ===================================================================
            ৩টি ছবির গ্রিড (Desktop: 3, Tablet: 2, Mobile: 1)
            =================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {galleryItems.map((item) => {
            const isVideo = item.type === 'video';

            return (
              <div
                key={item.id}
                onClick={() => setActiveMedia(item)}
                className="group relative rounded-2xl overflow-hidden bg-slate-900 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer aspect-[4/3] flex flex-col justify-end"
              >
                {/* Background Image with Zoom on Hover */}
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  loading="lazy"
                />

                {/* Gradient Overlays: Top badge gradient and bottom caption gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/30 group-hover:from-[#0B5D3B]/95 group-hover:via-[#0B5D3B]/50 transition-colors duration-300" />

                {/* Top Category Badge */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-slate-900 backdrop-blur-md shadow-sm">
                    {isVideo ? (
                      <>
                        <Video className="w-3.5 h-3.5 text-rose-600" />
                        <span>ভিডিও</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3.5 h-3.5 text-[#0B5D3B]" />
                        <span>ছবি</span>
                      </>
                    )}
                  </span>
                  <span className="text-[11px] font-semibold text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                    {item.category}
                  </span>
                </div>

                {/* Center Video Play Icon (If Video) */}
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-16 h-16 rounded-full bg-[#F4B400]/40 animate-ping" />
                      <div className="w-16 h-16 rounded-full bg-[#F4B400] text-slate-900 flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover:scale-115">
                        <Play className="w-7 h-7 fill-slate-900 ml-1" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Center Zoom Icon (If Image) */}
                {!isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-white/90 text-[#0B5D3B] flex items-center justify-center shadow-lg transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <ZoomIn className="w-6 h-6" />
                    </div>
                  </div>
                )}

                {/* Bottom Caption Container with Smooth Slide-up */}
                <div className="relative z-10 p-5 transform transition-transform duration-300">
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-200 transition-colors leading-snug drop-shadow-sm">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-200 mt-1.5 opacity-90 line-clamp-2 leading-relaxed">
                    {item.caption}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-white/15">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#F4B400]" />
                      <span>{item.date}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-[#F4B400] group-hover:translate-x-1 transition-transform">
                      <span>{isVideo ? 'ভিডিও দেখুন' : 'বড় করে দেখুন'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ===================================================================
            নিচে "আরো দেখুন" বাটন
            =================================================================== */}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => setShowAllModal(true)}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#0B5D3B] hover:bg-[#08492e] text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group active:scale-95 border-2 border-transparent hover:border-[#F4B400]"
          >
            <Camera className="w-5 h-5 text-[#F4B400]" />
            <span>আরো দেখুন</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>

      {/* ===================================================================
          লাইটবক্স / মোডাল (LIGHTBOX MODAL)
          =================================================================== */}
      {activeMedia && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveMedia(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent */}
            <div className="h-2 bg-gradient-to-r from-[#0B5D3B] via-[#F4B400] to-[#0B5D3B]" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveMedia(null)}
              aria-label="বন্ধ করুন"
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Media Content */}
            <div className="relative bg-black flex items-center justify-center max-h-[60vh] overflow-hidden">
              {activeMedia.type === 'video' ? (
                <div className="w-full aspect-video">
                  <iframe
                    src={`${activeMedia.videoUrl}?autoplay=1`}
                    title={activeMedia.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <img
                  src={activeMedia.thumbnail}
                  alt={activeMedia.title}
                  className="w-full h-auto max-h-[58vh] object-contain"
                />
              )}
            </div>

            {/* Media Details */}
            <div className="p-6 sm:p-7 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-[#0B5D3B] dark:text-emerald-400 border border-emerald-200">
                  {activeMedia.category}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{activeMedia.date}</span>
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {activeMedia.title}
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                {activeMedia.caption}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          পূর্ণাঙ্গ গ্যালারী মোডাল (FULL GALLERY MODAL)
          =================================================================== */}
      {showAllModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col p-6 sm:p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[#0B5D3B]">
                  <Camera className="w-5 h-5 text-[#0B5D3B]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    সকল ছবি ও ভিডিও অ্যালবাম
                  </h3>
                  <p className="text-xs text-slate-500">প্রতিষ্ঠানের সকল স্মরণীয় মুহূর্ত ও ইভেন্ট সংগ্রহশালা</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1">
              {galleryItems.concat(galleryItems).map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setShowAllModal(false);
                    setActiveMedia(item);
                  }}
                  className="rounded-xl overflow-hidden relative aspect-video cursor-pointer group shadow-xs hover:shadow-md"
                >
                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center p-2 text-center">
                    <span className="text-xs font-bold text-white line-clamp-2">{item.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
