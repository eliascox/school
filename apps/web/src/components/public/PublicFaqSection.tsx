'use client';

import React, { useState } from 'react';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';
import { FAQConfig } from '@/services/landingPageService';
import { toBanglaDigits } from '@/lib/resultPortalUtils';

interface PublicFaqSectionProps {
  faqConfig?: FAQConfig | null;
}

const DEFAULT_FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'কীভাবে অনলাইনে ভর্তির আবেদন করা যাবে?',
    answer:
      'আমাদের ওয়েবসাইটের "অনলাইন ভর্তি" পোর্টালে গিয়ে শিক্ষার্থীর তথ্য ও ছবি দিয়ে সহজেই আবেদন সম্পন্ন করা যায়। আবেদন জমা দেওয়ার সাথে সাথে নিশ্চিতকরণ SMS এবং প্রিন্টযোগ্য A4 স্লিপ পাওয়া যাবে।',
    visible: true,
  },
  {
    id: 'faq-2',
    question: 'বিদ্যালয়ের পাঠদানের সময়সূচি কী?',
    answer:
      'বিদ্যালয়ের একাডেমিক কার্যক্রম রবিবার থেকে বৃহস্পতিবার সকাল ৯:০০ টা থেকে বিকাল ৪:০০ টা পর্যন্ত পরিচালিত হয়।',
    visible: true,
  },
  {
    id: 'faq-3',
    question: '৯ম ও ১০ম শ্রেণিতে কোন কোন বিভাগ চালু আছে?',
    answer:
      'নবম ও দশম শ্রেণিতে বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা — তিনটি বিভাগেই অভিজ্ঞ শিক্ষকদের দ্বারা নিয়মিত পাঠদান ও ব্যবহারিক ক্লাস পরিচালিত হয়।',
    visible: true,
  },
  {
    id: 'faq-4',
    question: 'অনলাইনে পরীক্ষার ফলাফল ও সনদ যাচাই কীভাবে করব?',
    answer:
      'ওয়েবসাইটের "ফলাফল" মেনু থেকে পরীক্ষা, শ্রেণি ও রোল নম্বর দিয়ে মার্কশিট ডাউনলোড করা যাবে এবং "সনদ যাচাই" মেনু থেকে QR কোড বা রেফারেন্স নম্বর দিয়ে যেকোনো সনদের সত্যতা যাচাই করা যাবে।',
    visible: true,
  },
];

export default function PublicFaqSection({ faqConfig }: PublicFaqSectionProps = {}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (faqConfig && faqConfig.enabled === false) {
    return null;
  }

  const items =
    faqConfig?.items && faqConfig.items.length > 0
      ? faqConfig.items.filter((item) => item.visible !== false)
      : DEFAULT_FAQ_ITEMS;

  if (items.length === 0) return null;

  const sectionTitle = faqConfig?.title || 'সাধারণ প্রশ্নোত্তর (FAQ)';
  const sectionSubtitle =
    faqConfig?.subtitle ||
    'ভর্তি, ফলাফল, একাডেমিক কার্যক্রম ও বিদ্যালয় পরিচালনা সংক্রান্ত সচরাচর জিজ্ঞাসিত প্রশ্নাবলির উত্তর।';

  return (
    <section
      id="faq"
      className="py-12 sm:py-16 bg-[#F8FAFC] dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 transition-colors"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2.5 mb-9">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            <MessageCircleQuestion className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>সচরাচর জিজ্ঞাসা ও উত্তর</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {sectionTitle}
          </h2>

          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="w-12 h-1.5 bg-[#0B5D3B] rounded-full" />
            <span className="w-3 h-1.5 bg-[#F4B400] rounded-full" />
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {sectionSubtitle}
          </p>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={item.id || idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-700 shadow-sm ring-1 ring-emerald-500/10'
                    : 'bg-white/90 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 border-slate-200/90 dark:border-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex((prev) => (prev === idx ? null : idx))}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-extrabold transition-colors ${
                        isOpen
                          ? 'bg-[#0B5D3B] text-white'
                          : 'bg-emerald-50 dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-400'
                      }`}
                    >
                      {toBanglaDigits(idx + 1)}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {item.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'rotate-180 text-[#0B5D3B] dark:text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pl-14 animate-fade-in">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
