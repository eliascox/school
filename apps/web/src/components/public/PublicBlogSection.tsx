'use client';

import React, { useState } from 'react';
import { 
  Newspaper, 
  Calendar, 
  User, 
  ArrowRight, 
  X, 
  Eye, 
  Share2, 
  Clock, 
  BookOpen, 
  Sparkles 
} from 'lucide-react';

import { BlogConfig } from '@/services/landingPageService';

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

export default function PublicBlogSection({ blogConfig }: PublicBlogSectionProps = {}) {
  // Default Blog Cards
  const defaultBlogPosts: BlogPost[] = [
    {
      id: 'post-1',
      title: 'জাতীয় শিক্ষা সপ্তাহ ও বিতর্ক প্রতিযোগিতায় আমাদের বিদ্যালয়ের অনন্য গৌরব',
      author: 'Admin',
      date: '১৮ অক্টোবর ২০২৬',
      category: 'সাফল্য ও অর্জন',
      image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=700&auto=format&fit=crop',
      excerpt: 'জেলা ও বিভাগীয় পর্যায়ে অনুষ্ঠিত আন্তঃস্কুল বিতর্ক প্রতিযোগিতায় আমাদের বিতার্কিক দল চ্যাম্পিয়ন হওয়ার বিরল গৌরব অর্জন করেছে।',
      content: [
        'জেলা ও বিভাগীয় পর্যায়ে অনুষ্ঠিত আন্তঃস্কুল সৃজনশীল মেধা অন্বেষণ ও বিতর্ক প্রতিযোগিতায় বরইতলী উচ্চ বিদ্যালয়ের বিতার্কিক দল ফাইনালে বিপুল ব্যবধানে জয়লাভ করে চ্যাম্পিয়ন ট্রফি অর্জন করেছে।',
        'বিদ্যালয়ের প্রধান শিক্ষক ও পরিচালনা পর্ষদ বিজয়ী শিক্ষার্থীদের আন্তরিক অভিনন্দন জ্ঞাপন করেছেন। এই অভূতপূর্ব অর্জন আমাদের বিদ্যালয়ের সহশিক্ষা কার্যক্রমের ধারাবাহিক উৎকর্ষের প্রমাণ বহন করে।'
      ]
    },
    {
      id: 'post-2',
      title: 'ডিজিটাল বাংলাদেশ বিনির্মাণে স্মার্ট ক্লাসরুম ও নতুন শিক্ষাক্রমের ইতিবাচক প্রভাব',
      author: 'Admin',
      date: '১২ অক্টোবর ২০২৬',
      category: 'শিক্ষা ও প্রযুক্তি',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=700&auto=format&fit=crop',
      excerpt: 'শিক্ষায় আধুনিক প্রযুক্তির মেলবন্ধন ঘটিয়ে শ্রেণিকক্ষে শিক্ষার্থীদের অভিজ্ঞতাভিত্তিক ও প্রায়োগিক শিক্ষাদানে আমরা দৃঢ় প্রতিশ্রুতিবদ্ধ।',
      content: [
        'একবিংশ শতাব্দীর চ্যালেঞ্জ মোকাবেলায় মুখস্থবিদ্যার পরিবর্তে প্রায়োগিক ও দক্ষতাভিত্তিক শিক্ষা নিশ্চিত করতে আমাদের বিদ্যালয়ে আধুনিক স্মার্টবোর্ড ও মাল্টিমিডিয়া প্রজেক্টরের মাধ্যমে পাঠদান করা হচ্ছে।',
        'শিক্ষার্থীরা সরাসরি বিজ্ঞানের বিভিন্ন ল্যাব টেস্ট, সিমুলেশন এবং কোডিং ওয়ার্কশপে সক্রিয়ভাবে অংশগ্রহণ করছে, যা তাদের উদ্ভাবনী চিন্তাভাবনাকে সমৃদ্ধ করছে।'
      ]
    },
    {
      id: 'post-3',
      title: 'বার্ষিক বৃক্ষরোপণ অভিযান ও পরিবেশ সচেতনতায় শিক্ষার্থীদের সবুজ শপথ গ্রহণ',
      author: 'Admin',
      date: '০৫ অক্টোবর ২০২৬',
      category: 'পরিবেশ ও সমাজসেবা',
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=700&auto=format&fit=crop',
      excerpt: 'জলবায়ু পরিবর্তন মোকাবেলা ও ক্যাম্পাসকে সবুজায়নের অংশ হিসেবে বিদ্যালয় প্রাঙ্গণে বিভিন্ন ফলজ, বনজ ও ভেষজ গাছের চারা রোপণ করা হয়েছে।',
      content: [
        'বিদ্যালয় প্রাঙ্গণে দুই দিনব্যাপী বার্ষিক বৃক্ষরোপণ কর্মসূচি উদযাপিত হয়েছে। এতে বিদ্যালয়ের স্কাউট ও রেড ক্রিসেন্ট ইউনিটের সদস্যরা স্বতঃস্ফূর্তভাবে অংশ নিয়ে ২০০টিরও বেশি গাছের চারা রোপণ করেছে।',
        'প্রধান শিক্ষক তাঁর বক্তব্যে প্রতিটি শিক্ষার্থীকে একটি করে গাছ রোপণ ও তার সঠিক পরিচর্যা করার শপথ বাক্য পাঠ করান।'
      ]
    }
  ];

  const blogPosts: BlogPost[] = blogConfig?.posts && blogConfig.posts.length > 0
    ? blogConfig.posts.filter(p => p.visible).map(p => ({
        id: p.id,
        title: p.title,
        author: p.author || 'Admin',
        date: p.date,
        category: 'সংবাদ ও অর্জন',
        image: p.imageUrl || '/school-campus.jpg',
        excerpt: p.summary,
        content: [p.summary]
      }))
    : defaultBlogPosts;

  const sectionTitle = blogConfig?.title || 'সংবাদ ও ব্লগ';
  const sectionSubtitle = blogConfig?.subtitle || 'বিদ্যালয়ের শিক্ষা কার্যক্রম, জাতীয় দিবস উদযাপন, ক্রীড়া প্রতিযোগিতা এবং শিক্ষার্থীদের সাফল্যের হালনাগাদ তথ্যাবলী।';

  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showAllModal, setShowAllModal] = useState<boolean>(false);

  return (
    <section id="blog" className="py-16 sm:py-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ===================================================================
            সেকশন হেডার
            =================================================================== */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 text-[#0B5D3B] bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Newspaper className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>বার্তা ও প্রতিবেদন</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {sectionTitle}
          </h2>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="w-14 h-1.5 bg-[#0B5D3B] rounded-full"></span>
            <span className="w-3.5 h-1.5 bg-[#F4B400] rounded-full"></span>
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed pt-2">
            {sectionSubtitle}
          </p>
        </div>

        {/* ===================================================================
            ৩টি ব্লগ কার্ডের গ্রিড (Desktop: 3, Tablet: 2, Mobile: 1)
            =================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="group bg-[#F8FAFC] dark:bg-slate-800/80 rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* ওপরে ছবি */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-700">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* ক্যাটাগরি ব্যাজ */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0B5D3B] text-white backdrop-blur-md shadow-sm">
                      {post.category}
                    </span>
                  </div>
                </div>

                {/* পোস্ট মেটা ও শিরোনাম */}
                <div className="p-5 sm:p-6 space-y-3">
                  {/* পোস্টকারী (Admin) ও তারিখ */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-700/60 pb-3">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                      <User className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                      <span>{post.author}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#F4B400]" />
                      <span>{post.date}</span>
                    </span>
                  </div>

                  {/* বাংলা শিরোনাম (২ লাইনের বেশি হলে কাটা) */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>

                  {/* সংক্ষিপ্ত সারাংশ */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              {/* কার্ড ফুটার: "আরো দেখুন" লিংক */}
              <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
                <button
                  type="button"
                  onClick={() => setSelectedPost(post)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B5D3B] dark:text-emerald-400 hover:text-[#08492e] group/link transition-colors"
                >
                  <span>আরো দেখুন</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* ===================================================================
            নিচে "সকল ব্লগ" বাটন
            =================================================================== */}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => setShowAllModal(true)}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#0B5D3B] hover:bg-[#08492e] text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group active:scale-95 border-2 border-transparent hover:border-[#F4B400]"
          >
            <Newspaper className="w-5 h-5 text-[#F4B400]" />
            <span>সকল ব্লগ</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>

      {/* ===================================================================
          ব্লগ বিস্তারিত পপআপ মোডাল (POST DETAILS MODAL)
          =================================================================== */}
      {selectedPost && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-2 bg-gradient-to-r from-[#0B5D3B] via-[#F4B400] to-[#0B5D3B] shrink-0" />

            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              aria-label="বন্ধ করুন"
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="overflow-y-auto">
              {/* Cover Image */}
              <div className="aspect-[16/9] w-full bg-slate-900 overflow-hidden relative">
                <img src={selectedPost.image} alt={selectedPost.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-3 left-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0B5D3B] text-white shadow-md">
                    {selectedPost.category}
                  </span>
                </div>
              </div>

              {/* Content */}
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

                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                  {selectedPost.title}
                </h3>

                <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-2">
                  {selectedPost.content.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500">বরইতলী উচ্চ বিদ্যালয় বার্তা পরিষদ</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPost(null)}
                    className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          সকল ব্লগ আর্কাইভ মোডাল (ALL BLOGS MODAL)
          =================================================================== */}
      {showAllModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col p-6 sm:p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[#0B5D3B]">
                  <Newspaper className="w-5 h-5 text-[#0B5D3B]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    সকল সংবাদ ও ব্লগ আর্কাইভ
                  </h3>
                  <p className="text-xs text-slate-500">প্রতিষ্ঠানের সকল প্রকাশিত প্রতিবেদন ও আর্টিকেলের সংগ্রহশালা</p>
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

            <div className="overflow-y-auto py-4 space-y-3.5 flex-1 pr-1">
              {blogPosts.concat(blogPosts).map((post, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5 pr-3">
                    <img src={post.image} alt={post.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400">{post.date} • {post.category}</span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{post.title}</h4>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAllModal(false);
                      setSelectedPost(post);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#0B5D3B] bg-emerald-50 hover:bg-[#0B5D3B] hover:text-white transition-colors shrink-0"
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
