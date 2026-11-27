'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, X, Check, Quote, UserCheck } from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';
import { AboutConfig } from '@/services/landingPageService';
import InitialsAvatar from './InitialsAvatar';

interface PublicHeadmasterMessageProps {
  settings: SchoolSettings | null;
  aboutConfig?: AboutConfig | null;
}

function cleanQuoteText(raw: string): string {
  return raw.trim().replace(/^[“”"']+/, '').replace(/[“”"']+$/, '').trim();
}

function splitParagraphs(text: string): string[] {
  const cleaned = cleanQuoteText(text);
  const parts = cleaned
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [cleaned];
}

export default function PublicHeadmasterMessage({
  settings,
  aboutConfig,
}: PublicHeadmasterMessageProps) {
  const schoolName = settings?.schoolName?.trim() || 'বরইতলী উচ্চ বিদ্যালয়';

  const anySettings = settings as (SchoolSettings & Record<string, string | undefined>) | null;
  const committeePresident = settings?.committeeMembers?.find((m) => m.role.includes('সভাপতি'));

  const presidentVisible = aboutConfig?.president?.visible !== false;
  const presidentName =
    anySettings?.presidentName ||
    aboutConfig?.president?.name ||
    committeePresident?.name ||
    'আলহাজ্ব মোস্তফা কামাল';
  const presidentTitle =
    anySettings?.presidentTitle || aboutConfig?.president?.title || 'সভাপতি, পরিচালনা পর্ষদ';
  const presidentPhoto =
    anySettings?.presidentPhoto || aboutConfig?.president?.photo || committeePresident?.photo || '';
  const presidentMessage =
    anySettings?.presidentMessage ||
    aboutConfig?.president?.message ||
    'বিদ্যালয়ের অবকাঠামোগত উন্নয়ন ও মানসম্মত শিক্ষা নিশ্চিত করতে পরিচালনা পর্ষদ অভিভাবক ও শিক্ষকদের সাথে নিরলসভাবে কাজ করে যাচ্ছে। আধুনিক শ্রেণিকক্ষ, বিজ্ঞানাগার ও সহশিক্ষা কার্যক্রমের সুষ্ঠু বিকাশে আমরা অঙ্গীকারবদ্ধ।';
  const presidentQuote = cleanQuoteText(
    anySettings?.presidentQuote ||
      (aboutConfig?.president as { quote?: string } | undefined)?.quote ||
      presidentMessage
  );

  const principalVisible = aboutConfig?.headmaster?.visible !== false;
  const principalName =
    settings?.principalName?.trim() || aboutConfig?.headmaster?.name || 'মোহাম্মদ রফিকুল ইসলাম';
  const principalTitle =
    settings?.principalTitle?.trim() || aboutConfig?.headmaster?.title || 'প্রধান শিক্ষক';
  const principalPhoto = anySettings?.principalPhoto || aboutConfig?.headmaster?.photo || '';
  const principalMessage =
    anySettings?.principalMessage ||
    aboutConfig?.headmaster?.message ||
    'বরইতলী উচ্চ বিদ্যালয়ের পক্ষ থেকে সবাইকে আন্তরিক শুভেচ্ছা। আমরা বিশ্বাস করি প্রতিটি শিশুর মধ্যেই অফুরন্ত সম্ভাবনা রয়েছে। জ্ঞান, শৃঙ্খলা, নৈতিক মূল্যবোধ ও আধুনিক প্রযুক্তির সমন্বয়ে শিক্ষার্থীদের আলোকিত ভবিষ্যৎ গড়ে তোলাই আমাদের মূল লক্ষ্য।';
  const principalQuote = cleanQuoteText(
    anySettings?.principalQuote ||
      (aboutConfig?.headmaster as { quote?: string } | undefined)?.quote ||
      principalMessage
  );

  const [activeLeaderModal, setActiveLeaderModal] = useState<{
    name: string;
    role: string;
    roleEn: string;
    photo: string;
    fullMessage: string[];
  } | null>(null);

  useEffect(() => {
    if (!activeLeaderModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveLeaderModal(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [activeLeaderModal]);

  const leaders = [
    ...(presidentVisible
      ? [
          {
            id: 'president',
            role: presidentTitle,
            roleEn: 'President, Managing Committee',
            name: presidentName,
            photo: presidentPhoto,
            topBar: 'from-amber-500 via-[#F4B400] to-emerald-600',
            badgeClass:
              'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
            ringClass: 'ring-2 ring-amber-400/50 border-2 border-white dark:border-slate-800',
            badgeBg: 'bg-amber-500',
            quote: presidentQuote,
            fullMessage: splitParagraphs(presidentMessage),
          },
        ]
      : []),
    ...(principalVisible
      ? [
          {
            id: 'headmaster',
            role: principalTitle,
            roleEn: 'Headmaster & Principal',
            name: principalName,
            photo: principalPhoto,
            topBar: 'from-[#0B5D3B] via-emerald-500 to-teal-500',
            badgeClass:
              'bg-emerald-50 text-[#0B5D3B] dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
            ringClass: 'ring-2 ring-emerald-500/40 border-2 border-white dark:border-slate-800',
            badgeBg: 'bg-[#0B5D3B]',
            quote: principalQuote,
            fullMessage: splitParagraphs(principalMessage),
          },
        ]
      : []),
  ];

  if (leaders.length === 0) return null;

  return (
    <section
      id="principal"
      className="py-12 sm:py-16 bg-gradient-to-b from-[#F8FAFC] via-white to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800 relative overflow-hidden"
    >
      <div id="headmaster" className="absolute top-0 left-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-9 sm:mb-12 space-y-2.5">
          <div className="inline-flex items-center gap-2 text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
            <UserCheck className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>নেতৃত্ব ও দিকনির্দেশনা</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            স্কুল নেতৃবৃন্দের বাণী
          </h2>

          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="w-14 h-1.5 bg-[#0B5D3B] rounded-full" />
            <span className="w-3.5 h-1.5 bg-[#F4B400] rounded-full" />
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            {schoolName}-এর সার্বিক উন্নয়ন, শিক্ষার মানোন্নয়ন ও ভবিষ্যৎ পরিকল্পনা নিয়ে সভাপতি ও প্রধান শিক্ষকের দিকনির্দেশনামূলক বক্তব্য।
          </p>
        </div>

        {/* Clean Pearl Elevated Leader Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {leaders.map((leader) => (
            <div
              key={leader.id}
              className="relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 rounded-3xl p-6 sm:p-8 shadow-[0_10px_30px_-14px_rgba(15,23,42,0.1)] hover:shadow-[0_22px_50px_-18px_rgba(11,93,59,0.16)] transition-all duration-300 flex flex-col justify-between overflow-hidden group"
            >
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${leader.topBar}`} />

              <div>
                <div className="flex items-center gap-4 sm:gap-5 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="relative shrink-0">
                    <InitialsAvatar
                      src={leader.photo}
                      name={leader.name}
                      className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full ${leader.ringClass} shadow-md`}
                      textClassName="text-2xl sm:text-3xl"
                    />
                    <div
                      className={`absolute bottom-0 right-0 w-6 h-6 rounded-full ${leader.badgeBg} border-2 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-sm`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <span
                      className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border mb-1.5 ${leader.badgeClass}`}
                    >
                      {leader.role}
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug truncate">
                      {leader.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                      {schoolName}
                    </p>
                  </div>
                </div>

                {/* Single Clean Quotation Block */}
                <div className="pt-5 space-y-2">
                  <Quote className="w-6 h-6 text-emerald-600/35 dark:text-emerald-400/40" />
                  <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-[15px] leading-relaxed text-justify line-clamp-4">
                    “{leader.quote}”
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveLeaderModal(leader)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0B5D3B] dark:text-emerald-400 hover:text-emerald-700 group/btn transition-colors cursor-pointer"
                >
                  <span>পূর্ণাঙ্গ বাণী পড়ুন</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>

                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-en font-semibold">
                  {leader.roleEn}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Full Speech Modal */}
      {activeLeaderModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setActiveLeaderModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B5D3B] via-[#F4B400] to-[#0B5D3B]" />

            <button
              type="button"
              onClick={() => setActiveLeaderModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 pr-8">
              <InitialsAvatar
                src={activeLeaderModal.photo}
                name={activeLeaderModal.name}
                className="w-16 h-16 rounded-full border-2 border-emerald-200 dark:border-slate-700 shadow-sm shrink-0"
                textClassName="text-xl"
              />
              <div>
                <span className="text-xs font-bold text-[#0B5D3B] dark:text-emerald-400">
                  {activeLeaderModal.role}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {activeLeaderModal.name}
                </h3>
                <p className="text-xs text-slate-500">{schoolName}</p>
              </div>
            </div>

            <div className="space-y-3.5 text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed text-justify">
              {activeLeaderModal.fullMessage.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveLeaderModal(null)}
                className="px-5 py-2.5 bg-[#0B5D3B] hover:bg-[#08492e] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
