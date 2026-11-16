'use client';

import React, { useState } from 'react';
import { Calendar, Edit3, Eye, Pin, Printer, Trash2 } from 'lucide-react';
import { Notice } from '@/services/noticeService';

export type FeeSector = 'exam' | 'registration' | 'farewell' | 'tuition';

export interface ClassFeeItem {
  className: string;
  examFee: string;
  monthlyFee?: string;
}

export interface NoticeTemplate {
  id: string;
  name: string;
  category: Notice['category'];
  priority: Notice['priority'];
  targetAudience: Notice['targetAudience'];
  feeSector?: FeeSector;
  title: string;
  getContent: (fees: ClassFeeItem[]) => string;
}

export const NOTICE_FEE_SECTORS: Array<{ id: FeeSector; label: string; shortLabel: string }> = [
  { id: 'exam', label: '📝 পরীক্ষার ফি', shortLabel: 'পরীক্ষার ফি' },
  { id: 'registration', label: '📋 রেজিস্ট্রেশন ফি', shortLabel: 'রেজিস্ট্রেশন ফি' },
  { id: 'farewell', label: '🎓 বিদায় অনুষ্ঠান ফি', shortLabel: 'বিদায় অনুষ্ঠান ফি' },
  { id: 'tuition', label: '💵 মাসিক বেতন', shortLabel: 'মাসিক বেতন' },
];

export function generateClassFeeString(fees: ClassFeeItem[]): string {
  return fees.map((f) => `• ${f.className}: ${f.examFee}/- টাকা`).join('\n');
}

export function extractSubjectCore(rawTitle: string): string {
  let clean = rawTitle.trim();
  clean = clean.replace(/^(বিজ্ঞপ্তি\s*[-:/|]\s*)/i, '');
  clean = clean.replace(/(সংক্রান্ত\s*বিজ্ঞপ্তি|সংক্রান্ত\s*নোটিশ|এর\s*বিজ্ঞপ্তি)$/i, '').trim();
  return clean || rawTitle;
}

export function formatNoticeDate(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return isoStr;
  }
}

export function getCategoryBadge(cat: Notice['category']): React.ReactNode {
  switch (cat) {
    case 'exam':
      return (
        <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-800/60 rounded-md text-[11px] font-black inline-flex items-center gap-1 shadow-2xs">
          📝 পরীক্ষা
        </span>
      );
    case 'emergency':
      return (
        <span className="px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border border-rose-300/80 dark:border-rose-800/60 rounded-md text-[11px] font-black inline-flex items-center gap-1 shadow-2xs">
          🚨 জরুরি
        </span>
      );
    case 'holiday':
      return (
        <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-800/60 rounded-md text-[11px] font-black inline-flex items-center gap-1 shadow-2xs">
          🌴 ছুটি
        </span>
      );
    case 'academic':
      return (
        <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 border border-indigo-300/80 dark:border-indigo-800/60 rounded-md text-[11px] font-black inline-flex items-center gap-1 shadow-2xs">
          📚 একাডেমিক
        </span>
      );
    case 'events':
      return (
        <span className="px-2.5 py-0.5 bg-purple-50 dark:bg-purple-950/50 text-purple-950 dark:text-purple-200 border border-purple-300/80 dark:border-purple-800/60 rounded-md text-[11px] font-black inline-flex items-center gap-1 shadow-2xs">
          🎉 অনুষ্ঠান
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-md text-[11px] font-black inline-flex items-center gap-1 shadow-2xs">
          📢 সাধারণ
        </span>
      );
  }
}

export function getTargetAudienceBadge(aud: Notice['targetAudience']): React.ReactNode {
  switch (aud) {
    case 'teachers':
      return (
        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800/60 rounded text-[10px] font-extrabold">
          👨‍🏫 শিক্ষকবৃন্দ
        </span>
      );
    case 'parents':
      return (
        <span className="px-2 py-0.5 bg-pink-50 dark:bg-pink-950/50 text-pink-800 dark:text-pink-200 border border-pink-200 dark:border-pink-800/60 rounded text-[10px] font-extrabold">
          👨‍👩‍👧‍👦 অভিভাবক
        </span>
      );
    case 'students':
      return (
        <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800/60 rounded text-[10px] font-extrabold">
          🎓 শিক্ষার্থী
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold">
          🌐 সকলে
        </span>
      );
  }
}

export const NOTICE_TEMPLATES: NoticeTemplate[] = [
  {
    id: 'exam_fees_combined',
    name: '📝 💰 পরীক্ষা ও শ্রেণি ভিত্তিক ফি',
    category: 'exam',
    priority: 'urgent',
    targetAudience: 'all',
    feeSector: 'exam',
    title: 'অর্ধ-বার্ষিক পরীক্ষা, শ্রেণি ভিত্তিক পরীক্ষার ফি ও বকেয়া বেতন পরিশোধ সংক্রান্ত বিজ্ঞপ্তি',
    getContent: (fees: ClassFeeItem[]) =>
      `এতদ্দ্বারা ৬ষ্ঠ হতে ১০ম শ্রেণির সকল শিক্ষার্থী ও সম্মানিত অভিভাবকদের অবগতির জন্য জানানো যাচ্ছে যে, আগামী ২৫ এপ্রিল ২০২৬ তারিখ হতে অর্ধবার্ষিক পরীক্ষা অনুষ্ঠিত হবে। \n\nপরীক্ষায় অংশগ্রহণের জন্য শ্রেণি ভিত্তিক নির্ধারিত পরীক্ষার ফি ও যাবতীয় বকেয়া বেতন পরিশোধের তালিকা নিম্নরূপ:\n${generateClassFeeString(fees)}\n\nপরীক্ষা সংক্রান্ত প্রয়োজনীয় নির্দেশনাবলী:\n১. আগামী ১০ এপ্রিল ২০২৬ তারিখের মধ্যে চলতি শিক্ষাবর্ষের সকল বকেয়া বেতন ও উপরোক্ত নির্ধারিত পরীক্ষার ফি বিদ্যালয়ের হিসাব শাখায় জমা প্রদান করতে হবে।\n২. ফি পরিশোধের রসিদ প্রদর্শনপূর্বক শ্রেণি শিক্ষকের নিকট হতে পরীক্ষার প্রবেশপত্র (Admit Card) সংগ্রহ করতে হবে।\n৩. প্রবেশপত্র ব্যতীত কোনো শিক্ষার্থীকে পরীক্ষার হলে প্রবেশের অনুমতি দেওয়া হবে না।\n৪. প্রতিদিন পরীক্ষা শুরুর অন্তত ১৫ মিনিট পূর্বে নিজ নিজ নির্ধারিত আসনে উপস্থিত থাকতে হবে।\n৫. পরীক্ষার হলে কোনো প্রকার ডিজিটাল ডিভাইস বা অসদুপায় অবলম্বন সম্পূর্ণ নিষিদ্ধ।`,
  },
  {
    id: 'registration_fees',
    name: '📋 💳 রেজিস্ট্রেশন / ফরম পূরণ ও ফি',
    category: 'academic',
    priority: 'important',
    targetAudience: 'students',
    feeSector: 'registration',
    title: 'এসএসসি / বার্ষিক পরীক্ষার অনলাইন রেজিস্ট্রেশন ও ফি প্রদান সংক্রান্ত বিজ্ঞপ্তি',
    getContent: (fees: ClassFeeItem[]) =>
      `এতদ্দ্বারা সংশ্লিষ্ট সকল শিক্ষার্থী ও সম্মানিত অভিভাবকদের অবগতির জন্য জানানো যাচ্ছে যে, ২০২৬ শিক্ষাবর্ষের রেজিস্ট্রেশন ও ফরম পূরণ কার্যক্রম আগামী ১৫ সেপ্টেম্বর হতে ৩০ সেপ্টেম্বর পর্যন্ত চলবে।\n\nশ্রেণি ভিত্তিক রেজিস্ট্রেশন ফি এর বিবরণ:\n${generateClassFeeString(fees)}\n\nপ্রয়োজনীয় নির্দেশনাবলী:\n১. নির্ধারিত সময়ের মধ্যে ফরম পূরণের যাবতীয় ফি হিসাব শাখায় জমা দিয়ে রেজিস্ট্রেশন নিশ্চিত করতে হবে।\n২. বিলম্ব ফি এড়ানোর জন্য ৩০ সেপ্টেম্বরের পূর্বেই ফরম পূরণের কাজ সম্পন্ন করার অনুরোধ করা হলো।\n৩. ফরম পূরণের জন্য পাসপোর্ট সাইজের ছবি ও প্রয়োজনীয় সনদপত্রের ফটোকপি জমা দিতে হবে।\n৪. নির্ধারিত তারিখের পর অতিরিক্ত বিলম্ব ফি ছাড়া ফরম পূরণ গ্রহণ করা সম্ভব হবে না।`,
  },
  {
    id: 'farewell_fees',
    name: '🎓 🎁 বিদায় অনুষ্ঠান ও ফি সংক্রান্ত',
    category: 'events',
    priority: 'important',
    targetAudience: 'all',
    feeSector: 'farewell',
    title: 'এসএসসি পরীক্ষার্থীদের বিদায় সংবর্ধনা ও ফি প্রদান সংক্রান্ত বিজ্ঞপ্তি',
    getContent: (fees: ClassFeeItem[]) =>
      `এতদ্দ্বারা বিদ্যালয়ের সকল শিক্ষার্থী ও সম্মানিত অভিভাবকদের অবগতির জন্য জানানো যাচ্ছে যে, ২০২৬ সালের এসএসসি পরীক্ষার্থীদের বিদায় সংবর্ধনা ও দোয়া মাহফিল আগামী ... তারিখে অনুষ্ঠিত হবে।\n\nউক্ত মহতী অনুষ্ঠানের সার্বিক আয়োজন ও বিদায়ী উপহার বাবদ শ্রেণি ভিত্তিক নির্ধারিত ফি নিম্নরূপ:\n${generateClassFeeString(fees)}\n\nপ্রয়োজনীয় নির্দেশনাবলী:\n১. আগামী ... তারিখের মধ্যে শ্রেণি শিক্ষকের নিকট অনুষ্ঠান ফি জমা প্রদান করার জন্য অনুরোধ করা হলো।\n২. বিদায় অনুষ্ঠানে সকল শিক্ষার্থীকে যথাসময়ে নির্দিষ্ট প্রাতিষ্ঠানিক পোশাকে উপস্থিত থাকতে হবে।`,
  },
  {
    id: 'holiday_general',
    name: '🌴 ছুটির নোটিশ (পূজা/ঈদ/গ্রীষ্ম)',
    category: 'holiday',
    priority: 'important',
    targetAudience: 'all',
    title: 'দূর্গাপূজা উপলক্ষে বিদ্যালয় বন্ধ সংক্রান্ত বিজ্ঞপ্তি',
    getContent: () =>
      `এতদ্দ্বারা বিদ্যালয়ের সকল সম্মানিত শিক্ষক, কর্মচারী, অভিভাবক ও শিক্ষার্থীদের অবগতির জন্য জানানো যাচ্ছে যে, দূর্গাপূজা উপলক্ষে আগামী ১০ অক্টোবর হতে ২০ অক্টোবর ২০২৬ পর্যন্ত বিদ্যালয়ের সকল একাডেমিক ও প্রশাসনিক কার্যক্রম বন্ধ থাকবে।\n\nআগামী ২১ অক্টোবর ২০২৬ তারিখ শনিবার হতে যথারীতি বিদ্যালয়ের নিয়মিত শ্রেণি কার্যক্রম চালু হবে। \n\nসকলেকে শারদীয় দূর্গাপূজার আন্তরিক শুভেচ্ছা ও অভিনন্দন।`,
  },
  {
    id: 'parent_meeting',
    name: '👨‍👩‍👧‍👦 অভিভাবক সমাবেশ ও রেজাল্ট',
    category: 'events',
    priority: 'normal',
    targetAudience: 'parents',
    title: 'শিক্ষক-অভিভাবক মতবিনিময় সভা ও মূল্যায়ন ফলাফল প্রকাশ সংক্রান্ত বিজ্ঞপ্তি',
    getContent: () =>
      `সম্মানিত অভিভাবকবৃন্দের সদয় অবগতির জন্য জানানো যাচ্ছে যে, শিক্ষার্থীদের অর্ধবার্ষিক মূল্যায়নের অগ্রগতি ও পড়ালেখার মানোন্নয়ন বিষয়ে এক মতবিনিময় সভা আগামী শনিবার সকাল ১০:০০ ঘটিকায় বিদ্যালয় মিলনায়তনে অনুষ্ঠিত হবে। \n\nউক্ত সভায় আপনার সন্তানের মূল্যায়ন রিপোর্ট ও প্রগ্রেস কার্ড প্রদান করা হবে। সকল অভিভাবককে যথাসময়ে উপস্থিত থাকার জন্য বিনীত অনুরোধ করা হলো।`,
  },
  {
    id: 'emergency_weather',
    name: '🚨 জরুরি পাঠদান স্থগিত',
    category: 'emergency',
    priority: 'urgent',
    targetAudience: 'all',
    title: 'প্রাকৃতিক দুর্যোগ / আবহাওয়ার কারণে পাঠদান স্থগিত সংক্রান্ত জরুরি বিজ্ঞপ্তি',
    getContent: () =>
      `উপকূলীয় অঞ্চলে বৈরী আবহাওয়া ও সরকারি নির্দেশনার প্রেক্ষিতে শিক্ষার্থীদের সার্বিক নিরাপত্তা বিবেচনায় আগামী দুই দিন বিদ্যালয়ের প্রত্যক্ষ পাঠদান কার্যক্রম স্থগিত ঘোষণা করা হলো। \n\nপরিস্থিতি স্বাভাবিক হলে পরবর্তী নির্দেশনার মাধ্যমে বিদ্যালয় খোলার তারিখ জানানো হবে। শিক্ষার্থীদের নিরাপদে ঘরে অবস্থানের পরামর্শ দেওয়া হচ্ছে।`,
  },
];

export interface NoticeCardProps {
  notice: Notice;
  isAdmin?: boolean;
  onPin: (id: string, e?: React.MouseEvent) => void;
  onPrint: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: (id: string, title: string, e?: React.MouseEvent) => void;
}

export function NoticeCard({
  notice,
  isAdmin,
  onPin,
  onPrint,
  onView,
  onEdit,
  onDelete,
}: NoticeCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-200 shadow-sm hover:shadow-md p-5 sm:p-6 space-y-4 print:hidden ${
        notice.isPinned
          ? 'border-amber-300 dark:border-amber-800/60 ring-2 ring-amber-400/20 bg-amber-50/10 dark:bg-amber-950/50'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {notice.isPinned && (
            <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 rounded-full font-black text-[10px] uppercase flex items-center gap-1 shadow-sm">
              <Pin size={12} className="fill-slate-950" /> Pinned Notice
            </span>
          )}
          {getCategoryBadge(notice.category)}
          {getTargetAudienceBadge(notice.targetAudience)}

          {notice.priority === 'urgent' && (
            <span className="px-2 py-0.5 bg-rose-600 text-white rounded-md text-[10px] font-black animate-pulse flex items-center gap-1">
              🚨 জরুরি
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400 font-bold">
          {notice.refNo && (
            <span className="hidden sm:inline bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
              {notice.refNo}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={13} /> {formatNoticeDate(notice.publishedAt)}
          </span>
        </div>
      </div>

      <div>
        <h3
          onClick={onView}
          className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug hover:text-indigo-600 transition cursor-pointer"
        >
          {notice.title}
        </h3>
      </div>

      <div className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-line bg-slate-50/80 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        {expanded
          ? notice.content
          : notice.content.length > 220
            ? `${notice.content.substring(0, 220)}...`
            : notice.content}
        {notice.content.length > 220 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold ml-2 underline inline-block cursor-pointer"
          >
            {expanded ? 'সংক্ষিপ্ত করুন' : 'আরও পড়ুন...'}
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-black text-xs shadow">
            ম
          </div>
          <div>
            <strong className="font-extrabold text-slate-900 dark:text-white block leading-tight">
              {notice.publisherName}
            </strong>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
              {notice.publisherRole}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
          <button
            onClick={onView}
            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="নোটিশটি বিস্তারিত দেখুন"
          >
            <Eye size={13} /> বিস্তারিত ভিউ
          </button>

          {isAdmin && (
            <button
              onClick={onPrint}
              className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white rounded-xl font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
              title="অফিসিয়াল ই-প্যাডে দেখুন ও প্রিন্ট করুন"
            >
              <Printer size={13} /> প্রিন্ট
            </button>
          )}

          {isAdmin && (
            <>
              <button
                onClick={onEdit}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition cursor-pointer"
                title="এডিট করুন"
              >
                <Edit3 size={14} />
              </button>

              <button
                onClick={(e) => onDelete(notice.id, notice.title, e)}
                className="p-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white rounded-xl font-bold transition cursor-pointer"
                title="মুছে ফেলুন"
              >
                <Trash2 size={14} />
              </button>

              <button
                onClick={(e) => onPin(notice.id, e)}
                className={`p-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ${
                  notice.isPinned
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 hover:bg-amber-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title={notice.isPinned ? 'আনপিন করুন' : 'পিন করুন'}
              >
                <Pin size={14} className={notice.isPinned ? 'fill-amber-900' : ''} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
