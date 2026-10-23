'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Sparkles, MessageCircleQuestion } from 'lucide-react';
import { FAQConfig } from '@/services/landingPageService';

interface PublicFaqSectionProps {
  faqConfig?: FAQConfig | null;
}

const DEFAULT_FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'কীভাবে অনলাইনে ভর্তির আবেদন করা যাবে?',
    answer: 'আমাদের ওয়েবসাইটের "অনলাইন ভর্তি আবেদন" লিংকে ক্লিক করে প্রয়োজনীয় তথ্য ও পূর্ববর্তী ক্লাসের মার্কশীটের কপি আপলোড করে সহজে আবেদন সম্পন্ন করা যায়।',
    visible: true,
  },
  {
    id: 'faq-2',
    question: 'বিদ্যালয়ের পাঠদানের সময়সূচি কী?',
    answer: 'বিদ্যালয়ের একাডেমিক কার্যক্রম রবিবার থেকে বৃহস্পতিবার সকাল ৯:৩০ টা থেকে বিকাল ৪:০০ টা পর্যন্ত পরিচালিত হয়।',
    visible: true,
  },
  {
    id: 'faq-3',
    question: 'কোন কোন গ্রুপ বা বিভাগ চালু আছে?',
    answer: 'নবম ও দশম শ্রেণিতে বিজ্ঞান, ব্যবসায় শিক্ষা ও মানবিক — তিনটি বিভাগেই অভিজ্ঞ শিক্ষকদের দ্বারা পাঠদান করানো হয়।',
    visible: true,
  },
  {
    id: 'faq-4',
    question: 'উপবৃত্তি ও মেধা বৃত্তির সুযোগ কেমন?',
    answer: 'সরকারের নির্ধারিত উপবৃত্তি সুবিধার পাশাপাশি বিদ্যালয় পরিচালনা পর্ষদের পক্ষ থেকে দরিদ্র ও মেধাবী শিক্ষার্থীদের মাসিক বেতন মওকুফ ও বিশেষ বৃত্তি প্রদান করা হয়।',
    visible: true,
  },
];

export default function PublicFaqSection({ faqConfig }: PublicFaqSectionProps = {}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (faqConfig && faqConfig.enabled === false) {
    return null;
  }

  const items = (faqConfig?.items && faqConfig.items.length > 0)
    ? faqConfig.items.filter((item) => item.visible !== false)
    : DEFAULT_FAQ_ITEMS;

  if (items.length === 0) {
    return null;
  }

  const sectionTitle = faqConfig?.title || 'সাধারণ প্রশ্নোত্তর (FAQ)';
  const sectionSubtitle = faqConfig?.subtitle || 'ভর্তি, একাডেমিক কার্যক্রম ও বিদ্যালয় পরিচালনা সংক্রান্ত সচরাচর জিজ্ঞাসিত প্রশ্নাবলীর উত্তর।';

  const toggleAccordion = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section id="faq" className="py-12 sm:py-16 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 shadow-xs">
            <MessageCircleQuestion className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>সচরাচর জিজ্ঞাসা ও উত্তর</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {sectionTitle}
          </h2>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="w-8 h-1 bg-emerald-600 rounded-full"></span>
            <span className="w-2.5 h-1 bg-amber-500 rounded-full"></span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {sectionSubtitle}
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {items.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={item.id || idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-700 shadow-sm shadow-emerald-600/5 ring-1 ring-emerald-500/10'
                    : 'bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                        isOpen
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Q{idx + 1}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'transform rotate-180 text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/60 mt-1 pl-14">
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
