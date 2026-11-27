'use client';

import React, { useEffect, useState } from 'react';
import { Newspaper, Calendar, User, ArrowRight, X } from 'lucide-react';
import { BlogConfig } from '@/services/landingPageService';
import { sanitizePublicImageUrl } from '@/lib/publicLandingUtils';

interface BlogPost {
  id: string;
  title: string;
  author: string;
  date: string;
  category: string;
  image: string;
  excerpt: string;
  content: string[];
}

interface PublicBlogSectionProps {
  blogConfig?: BlogConfig | null;
}

const DEFAULT_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    title: 'জাতীয় শিক্ষা সপ্তাহ ও বিতর্ক প্রতিযোগিতায় আমাদের বিদ্যালয়ের অনন্য গৌরব',
    author: 'প্রশাসন',
    date: '১৮ অক্টোবর ২০২৬',
    category: 'সাফল্য ও অর্জন',
    image: '/school-campus.jpg',
    excerpt:
      'জেলা ও বিভাগীয় পর্যায়ে অনুষ্ঠিত আন্তঃস্কুল বিতর্ক প্রতিযোগিতায় আমাদের বিতার্কিক দল চ্যাম্পিয়ন হওয়ার বিরল গৌরব অর্জন করেছে।',
    content: [
      'জেলা ও বিভাগীয় পর্যায়ে অনুষ্ঠিত আন্তঃস্কুল সৃজনশীল মেধা অন্বেষণ ও বিতর্ক প্রতিযোগিতায় আমাদের বিদ্যালয়ের বিতার্কিক দল ফাইনালে বিপুল ব্যবধানে জয়লাভ করে চ্যাম্পিয়ন ট্রফি অর্জন করেছে।',
      'বিদ্যালয়ের প্রধান শিক্ষক ও পরিচালনা পর্ষদ বিজয়ী শিক্ষার্থীদের আন্তরিক অভিনন্দন জ্ঞাপন করেছেন। এই অর্জন আমাদের বিদ্যালয়ের সহশিক্ষা কার্যক্রমের ধারাবাহিক উৎকর্ষের প্রমাণ বহন করে।',
    ],
  },
  {
    id: 'post-2',
    title: 'স্মার্ট ক্লাসরুম ও নতুন শিক্ষাক্রমের ইতিবাচক প্রভাব',
    author: 'একাডেমিক ডেস্ক',
    date: '১২ অক্টোবর ২০২৬',
    category: 'শিক্ষা ও প্রযুক্তি',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=700&auto=format&fit=crop',
    excerpt:
      'শিক্ষায় আধুনিক প্রযুক্তির মেলবন্ধন ঘটিয়ে শ্রেণিকক্ষে শিক্ষার্থীদের অভিজ্ঞতাভিত্তিক ও প্রায়োগিক শিক্ষাদানে আমরা দৃঢ় প্রতিশ্রুতিবদ্ধ।',
    content: [
      'একবিংশ শতাব্দীর চ্যালেঞ্জ মোকাবেলায় মুখস্থবিদ্যার পরিবর্তে প্রায়োগিক ও দক্ষতাভিত্তিক শিক্ষা নিশ্চিত করতে আমাদের বিদ্যালয়ে আধুনিক স্মার্টবোর্ড ও মাল্টিমিডিয়া প্রজেক্টরের মাধ্যমে পাঠদান করা হচ্ছে।',
      'শিক্ষার্থীরা সরাসরি বিজ্ঞানের বিভিন্ন ল্যাব টেস্ট, সিমুলেশন এবং কোডিং ওয়ার্কশপে সক্রিয়ভাবে অংশগ্রহণ করছে, যা তাদের উদ্ভাবনী চিন্তাভাবনাকে সমৃদ্ধ করছে।',
    ],
  },
  {
    id: 'post-3',
    title: 'বার্ষিক বৃক্ষরোপণ অভিযান ও সবুজ ক্যাম্পাস শপথ গ্রহণ',
    author: 'স্কাউট ইউনিট',
    date: '০৫ অক্টোবর ২০২৬',
    category: 'পরিবেশ ও সমাজসেবা',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=700&auto=format&fit=crop',
    excerpt:
      'জলবায়ু পরিবর্তন মোকাবেলা ও ক্যাম্পাসকে সবুজায়নের অংশ হিসেবে বিদ্যালয় প্রাঙ্গণে বিভিন্ন ফলজ, বনজ ও ভেষজ গাছের চারা রোপণ করা হয়েছে।',
    content: [
      'বিদ্যালয় প্রাঙ্গণে দুই দিনব্যাপী বার্ষিক বৃক্ষরোপণ কর্মসূচি উদযাপিত হয়েছে। এতে বিদ্যালয়ের স্কাউট ও রেড ক্রিসেন্ট ইউনিটের সদস্যরা স্বতঃস্ফূর্তভাবে অংশ নিয়ে ২০০টিরও বেশি গাছের চারা রোপণ করেছে।',
      'প্রধান শিক্ষক তাঁর বক্তব্যে প্রতিটি শিক্ষার্থীকে একটি করে গাছ রোপণ ও তার সঠিক পরিচর্যা করার আহ্বান জানান।',
    ],
  },
];

export default function PublicBlogSection({ blogConfig }: PublicBlogSectionProps = {}) {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);
  const [failedImgs, setFailedImgs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!selectedPost && !showAllModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPost(null);
        setShowAllModal(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedPost, showAllModal]);

  if (blogConfig && blogConfig.enabled === false) {
    return null;
  }

  const configuredPosts = (blogConfig?.posts || []).filter((p) => p && p.visible !== false);
  const blogPosts: BlogPost[] =
    configuredPosts.length > 0
      ? configuredPosts.map((p, idx) => ({
          id: p.id || `blog-${idx}`,
          title: p.title,
          author: p.author === 'Admin' ? 'প্রশাসন' : p.author || 'প্রশাসন',
          date: p.date || 'সাম্প্রতিক',
          category: 'সংবাদ ও অর্জন',
          image: sanitizePublicImageUrl(p.imageUrl, '/school-campus.jpg'),
          excerpt: p.summary || '',
          content: (p.summary || '')
            .split(/\n+/)
            .map((s) => s.trim())
            .filter(Boolean),
        }))
      : DEFAULT_BLOG_POSTS;

  const sectionTitle = blogConfig?.title || 'সংবাদ ও ব্লগ';
  const sectionSubtitle =
    blogConfig?.subtitle ||
    'বিদ্যালয়ের শিক্ষা কার্যক্রম, জাতীয় দিবস উদযাপন, ক্রীড়া প্রতিযোগিতা এবং শিক্ষার্থীদের সাফল্যের হালনাগাদ তথ্যাবলি।';

  const getImgSrc = (post: BlogPost) =>
    failedImgs[post.id] ? '/school-campus.jpg' : sanitizePublicImageUrl(post.image, '/school-campus.jpg');

  return (
    <section
      id="blog"
      className="py-12 sm:py-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-2.5 mb-9 sm:mb-12">
          <div className="inline-flex items-center gap-2 text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
            <Newspaper className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>বার্তা ও প্রতিবেদন</span>
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

        {/* 3-Column Editorial News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {blogPosts.slice(0, 6).map((post) => (
            <article
              key={post.id}
              className="group bg-[#F8FAFC] dark:bg-slate-800/80 rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-700/80 hover:border-emerald-400/70 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-200 dark:bg-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getImgSrc(post)}
                    alt={post.title}
                    onError={() => setFailedImgs((prev) => ({ ...prev, [post.id]: true }))}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#0B5D3B] text-white shadow-sm">
                      {post.category}
                    </span>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-700/60 pb-2.5">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                      <User className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                      <span>{post.author}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#F4B400]" />
                      <span>{post.date}</span>
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
                <button
                  type="button"
                  onClick={() => setSelectedPost(post)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B5D3B] dark:text-emerald-400 hover:text-[#08492e] group/link transition-colors cursor-pointer"
                >
                  <span>বিস্তারিত পড়ুন</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setShowAllModal(true)}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#0B5D3B] hover:bg-[#08492e] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <Newspaper className="w-4 h-4 text-[#F4B400]" />
            <span>সকল সংবাদ ও ব্লগ ({blogPosts.length}টি)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Post Details Modal */}
      {selectedPost && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-gradient-to-r from-[#0B5D3B] via-[#F4B400] to-[#0B5D3B] shrink-0" />

            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              aria-label="বন্ধ করুন"
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/55 text-white hover:bg-black/80 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="overflow-y-auto">
              <div className="aspect-[16/9] w-full bg-slate-900 overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImgSrc(selectedPost)}
                  alt={selectedPost.title}
                  onError={() => setFailedImgs((prev) => ({ ...prev, [selectedPost.id]: true }))}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0B5D3B] text-white shadow-md">
                    {selectedPost.category}
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-4 text-xs text-slate-500 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <User className="w-4 h-4 text-[#0B5D3B]" />
                    <span>পোস্টকারী: {selectedPost.author}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#F4B400]" />
                    <span>{selectedPost.date}</span>
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
                  {selectedPost.title}
                </h3>

                <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                  {(selectedPost.content.length > 0 ? selectedPost.content : [selectedPost.excerpt]).map(
                    (p, idx) => (
                      <p key={idx}>{p}</p>
                    )
                  )}
                </div>

                <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedPost(null)}
                    className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Blogs Archive Modal (Deduplicated — No Duplicate Entries!) */}
      {showAllModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-[#0B5D3B] border border-emerald-200 dark:border-emerald-800">
                  <Newspaper className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    সকল সংবাদ ও ব্লগ আর্কাইভ
                  </h3>
                  <p className="text-xs text-slate-500">প্রকাশিত সকল প্রতিবেদন ও সংবাদ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                aria-label="বন্ধ করুন"
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-3 flex-1 pr-1">
              {blogPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImgSrc(post)}
                      alt={post.title}
                      onError={() => setFailedImgs((prev) => ({ ...prev, [post.id]: true }))}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-100"
                    />
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-slate-400 block">
                        {post.date} • {post.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {post.title}
                      </h4>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAllModal(false);
                      setSelectedPost(post);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#0B5D3B] bg-emerald-50 hover:bg-[#0B5D3B] hover:text-white transition shrink-0 cursor-pointer"
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
