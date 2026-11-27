'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  Play,
  Image as ImageIcon,
  Video,
  ArrowRight,
  X,
  ZoomIn,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { GalleryConfig, GalleryMediaItem } from '@/services/landingPageService';
import {
  filterGalleryItems,
  getGalleryCategories,
  sanitizePublicImageUrl,
} from '@/lib/publicLandingUtils';

interface PublicGallerySectionProps {
  galleryConfig?: GalleryConfig | null;
}

const DEFAULT_GALLERY_ITEMS: GalleryMediaItem[] = [
  {
    id: 'gal-1',
    type: 'image',
    title: 'স্মার্ট মাল্টিমিডিয়া ক্লাসরুমে আনন্দময় পাঠদান',
    category: 'অ্যাকাডেমিক',
    thumbnail:
      'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop',
    date: '১২ অক্টোবর ২০২৬',
    caption: 'শিক্ষার্থীদের ডিজিটাল কনটেন্ট ও ইন্টারেক্টিভ স্মার্টবোর্ডের মাধ্যমে পাঠদান কার্যক্রম।',
    visible: true,
  },
  {
    id: 'gal-2',
    type: 'image',
    title: 'বার্ষিক ক্রীড়া ও সাংস্কৃতিক প্রতিযোগিতা ২০২৬',
    category: 'ক্রীড়া ও সহশিক্ষা',
    thumbnail:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop',
    date: '০৫ অক্টোবর ২০২৬',
    caption: 'বিদ্যালয়ের বার্ষিক ক্রীড়া প্রতিযোগিতা ও মনোজ্ঞ সাংস্কৃতিক অনুষ্ঠানের সেরা মুহূর্তসমূহ।',
    visible: true,
  },
  {
    id: 'gal-3',
    type: 'image',
    title: 'বিজ্ঞান মেলা ও শিক্ষার্থীদের রোবটিক্স প্রজেক্ট প্রদর্শনী',
    category: 'বিজ্ঞান ও প্রযুক্তি',
    thumbnail:
      'https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=800&auto=format&fit=crop',
    date: '২৮ সেপ্টেম্বর ২০২৬',
    caption: 'শেখ রাসেল ডিজিটাল ল্যাবে খুদে বিজ্ঞানীদের উদ্ভাবনী রোবটিক্স এবং বিজ্ঞান প্রজেক্ট প্রদর্শনী।',
    visible: true,
  },
];

export default function PublicGallerySection({
  galleryConfig,
}: PublicGallerySectionProps = {}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('সকল');
  const [showAllModal, setShowAllModal] = useState(false);
  const [failedImgs, setFailedImgs] = useState<Record<string, boolean>>({});

  const configuredItems = galleryConfig?.items?.filter((item) => item.visible !== false);
  const allItems = useMemo(() => {
    const base =
      configuredItems && configuredItems.length > 0 ? configuredItems : DEFAULT_GALLERY_ITEMS;
    return base.map((item) => ({
      ...item,
      thumbnail: sanitizePublicImageUrl(item.thumbnail, '/school-campus.jpg'),
    }));
  }, [configuredItems]);

  const categories = useMemo(() => getGalleryCategories(allItems), [allItems]);
  const filteredItems = useMemo(
    () => filterGalleryItems(allItems, activeCategory),
    [allItems, activeCategory]
  );

  const activeMedia = activeIndex !== null ? filteredItems[activeIndex] || null : null;

  useEffect(() => {
    if (activeIndex === null && !showAllModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveIndex(null);
        setShowAllModal(false);
      } else if (activeIndex !== null && filteredItems.length > 1) {
        if (e.key === 'ArrowRight') {
          setActiveIndex((prev) =>
            prev === null ? null : (prev + 1) % filteredItems.length
          );
        } else if (e.key === 'ArrowLeft') {
          setActiveIndex((prev) =>
            prev === null
              ? null
              : (prev - 1 + filteredItems.length) % filteredItems.length
          );
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [activeIndex, showAllModal, filteredItems.length]);

  if (galleryConfig && galleryConfig.enabled === false) {
    return null;
  }

  const sectionEyebrow = galleryConfig?.eyebrow || 'ক্যাম্পাস লাইফ ও স্মৃতি';
  const sectionTitle = galleryConfig?.title || 'ছবি এবং ভিডিও গ্যালারি';
  const sectionSubtitle =
    galleryConfig?.subtitle ||
    'বিদ্যালয়ের প্রাণবন্ত পাঠদান, ক্রীড়া ও সাংস্কৃতিক উৎসব এবং বিজ্ঞান প্রদর্শনীর স্মরণীয় মুহূর্তসমূহ।';

  const resolveThumb = (item: GalleryMediaItem) =>
    failedImgs[item.id] ? '/school-campus.jpg' : item.thumbnail;

  return (
    <section
      id="gallery"
      className="py-12 sm:py-16 bg-[#F8FAFC] dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-2.5 mb-7 sm:mb-9">
          <div className="inline-flex items-center gap-2 text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
            <Camera className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>{sectionEyebrow}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {sectionTitle}
          </h2>

          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="w-14 h-1.5 bg-[#0B5D3B] rounded-full" />
            <span className="w-3.5 h-1.5 bg-[#F4B400] rounded-full" />
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed pt-1">
            {sectionSubtitle}
          </p>
        </div>

        {/* Category Filter Tabs */}
        {categories.length > 2 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  setActiveIndex(null);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                  activeCategory === cat
                    ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
          {filteredItems.slice(0, 6).map((item, idx) => {
            const isVideo = item.type === 'video';
            return (
              <div
                key={item.id}
                onClick={() => setActiveIndex(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveIndex(idx);
                  }
                }}
                className="group relative rounded-3xl overflow-hidden bg-slate-900 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer aspect-[4/3] flex flex-col justify-end"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveThumb(item)}
                  alt={item.title}
                  onError={() => setFailedImgs((prev) => ({ ...prev, [item.id]: true }))}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-black/25 group-hover:from-[#0B5D3B]/92 transition-colors duration-300" />

                <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-slate-900 shadow-xs">
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
                  <span className="text-[11px] font-semibold text-white bg-black/45 backdrop-blur-md px-2.5 py-1 rounded-full">
                    {item.category}
                  </span>
                </div>

                {isVideo ? (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="w-14 h-14 rounded-full bg-[#F4B400] text-slate-950 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="w-11 h-11 rounded-full bg-white/95 text-[#0B5D3B] flex items-center justify-center shadow-lg">
                      <ZoomIn className="w-5 h-5" />
                    </div>
                  </div>
                )}

                <div className="relative z-10 p-5">
                  <h3 className="text-base font-bold text-white group-hover:text-amber-200 transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-200/90 mt-1 line-clamp-2 leading-relaxed">
                    {item.caption}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-white/15">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#F4B400]" />
                      <span>{item.date}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-[#F4B400]">
                      <span>{isVideo ? 'ভিডিও দেখুন' : 'বড় করে দেখুন'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setShowAllModal(true)}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#0B5D3B] hover:bg-[#08492e] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4 text-[#F4B400]" />
            <span>সকল ছবি ও ভিডিও অ্যালবাম</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Keyboard-Navigable Lightbox Modal */}
      {activeMedia && activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-gradient-to-r from-[#0B5D3B] via-[#F4B400] to-[#0B5D3B]" />

            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              aria-label="বন্ধ করুন"
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/55 text-white hover:bg-black/80 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative bg-slate-950 flex items-center justify-center max-h-[60vh] overflow-hidden">
              {activeMedia.type === 'video' && activeMedia.videoUrl ? (
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
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveThumb(activeMedia)}
                  alt={activeMedia.title}
                  onError={() => setFailedImgs((prev) => ({ ...prev, [activeMedia.id]: true }))}
                  className="w-full h-auto max-h-[58vh] object-contain"
                />
              )}

              {filteredItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIndex(
                        (activeIndex - 1 + filteredItems.length) % filteredItems.length
                      )
                    }
                    aria-label="পূর্ববর্তী ছবি"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-[#0B5D3B] text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIndex((activeIndex + 1) % filteredItems.length)}
                    aria-label="পরবর্তী ছবি"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-[#0B5D3B] text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            <div className="p-5 sm:p-6 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {activeMedia.category}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{activeMedia.date}</span>
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {activeIndex + 1} / {filteredItems.length}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                {activeMedia.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeMedia.caption}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Full Album Modal */}
      {showAllModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                সকল ছবি ও ভিডিও অ্যালবাম
              </h3>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                aria-label="বন্ধ করুন"
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1">
              {allItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory('সকল');
                    const foundIdx = allItems.findIndex((i) => i.id === item.id);
                    setShowAllModal(false);
                    setActiveIndex(foundIdx >= 0 ? foundIdx : 0);
                  }}
                  className="rounded-2xl overflow-hidden relative aspect-video cursor-pointer group shadow-xs hover:shadow-md text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveThumb(item)}
                    alt={item.title}
                    onError={() => setFailedImgs((prev) => ({ ...prev, [item.id]: true }))}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-3">
                    <span className="text-xs font-bold text-white line-clamp-2">{item.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
