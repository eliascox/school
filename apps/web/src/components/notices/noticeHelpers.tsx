'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CalendarDays,
  Edit3,
  Eye,
  FileText,
  Globe,
  GraduationCap,
  Megaphone,
  Pin,
  Printer,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
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
  { id: 'exam', label: 'পরীক্ষার ফি', shortLabel: 'পরীক্ষার ফি' },
  { id: 'registration', label: 'রেজিস্ট্রেশন ফি', shortLabel: 'রেজিস্ট্রেশন ফি' },
  { id: 'farewell', label: 'বিদায় অনুষ্ঠান ফি', shortLabel: 'বিদায় অনুষ্ঠান ফি' },
  { id: 'tuition', label: 'মাসিক বেতন', shortLabel: 'মাসিক বেতন' },
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

export function getPublisherInitial(name?: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'প্র';
  return trimmed.charAt(0);
}

export function getCategoryBadge(cat: Notice['category']): React.ReactNode {
  switch (cat) {
    case 'exam':
      return (
        <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60 rounded-lg text-[10.5px] font-extrabold inline-flex items-center gap-1">
          <FileText size={11} /> পরীক্ষা
        </span>
      );
    case 'emergency':
      return (
        <span className="px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-200 border border-rose-200/80 dark:border-rose-800/60 rounded-lg text-[10.5px] font-extrabold inline-flex items-center gap-1">
          <AlertTriangle size={11} /> জরুরি
        </span>
      );
    case 'holiday':
      return (
        <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg text-[10.5px] font-extrabold inline-flex items-center gap-1">
          <CalendarDays size={11} /> ছুটি
        </span>
      );
    case 'academic':
      return (
        <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-800/60 rounded-lg text-[10.5px] font-extrabold inline-flex items-center gap-1">
          <BookOpen size={11} /> একাডেমিক
        </span>
      );
    case 'events':
      return (
        <span className="px-2.5 py-0.5 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-200 border border-violet-200/80 dark:border-violet-800/60 rounded-lg text-[10.5px] font-extrabold inline-flex items-center gap-1">
          <Sparkles size={11} /> অনুষ্ঠান
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[10.5px] font-extrabold inline-flex items-center gap-1">
          <Megaphone size={11} /> সাধারণ
        </span>
      );
  }
}

export function getTargetAudienceBadge(aud: Notice['targetAudience']): React.ReactNode {
  switch (aud) {
    case 'teachers':
      return (
        <span className="px-2 py-0.5 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-200 border border-sky-200/70 dark:border-sky-800/60 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
          <UserCheck size={10} /> শিক্ষকবৃন্দ
        </span>
      );
    case 'parents':
      return (
        <span className="px-2 py-0.5 bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-200 border border-pink-200/70 dark:border-pink-800/60 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
          <Users size={10} /> অভিভাবক
        </span>
      );
    case 'students':
      return (
        <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-200 border border-teal-200/70 dark:border-teal-800/60 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
          <GraduationCap size={10} /> শিক্ষার্থী
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
          <Globe size={10} /> সকলে
        </span>
      );
  }
}

export const NOTICE_TEMPLATES: NoticeTemplate[] = [
  {
    id: 'exam_fees_combined',
    name: 'পরীক্ষা ও শ্রেণিভিত্তিক ফি',
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
    name: 'রেজিস্ট্রেশন / ফরম পূরণ ও ফি',
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
    name: 'বিদায় অনুষ্ঠান ও ফি সংক্রান্ত',
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
    name: 'ছুটির নোটিশ (পূজা/ঈদ/গ্রীষ্ম)',
    category: 'holiday',
    priority: 'important',
    targetAudience: 'all',
    title: 'দূর্গাপূজা উপলক্ষে বিদ্যালয় বন্ধ সংক্রান্ত বিজ্ঞপ্তি',
    getContent: () =>
      `এতদ্দ্বারা বিদ্যালয়ের সকল সম্মানিত শিক্ষক, কর্মচারী, অভিভাবক ও শিক্ষার্থীদের অবগতির জন্য জানানো যাচ্ছে যে, দূর্গাপূজা উপলক্ষে আগামী ১০ অক্টোবর হতে ২০ অক্টোবর ২০২৬ পর্যন্ত বিদ্যালয়ের সকল একাডেমিক ও প্রশাসনিক কার্যক্রম বন্ধ থাকবে।\n\nআগামী ২১ অক্টোবর ২০২৬ তারিখ শনিবার হতে যথারীতি বিদ্যালয়ের নিয়মিত শ্রেণি কার্যক্রম চালু হবে। \n\nসকলেকে শারদীয় দূর্গাপূজার আন্তরিক শুভেচ্ছা ও অভিনন্দন।`,
  },
  {
    id: 'parent_meeting',
    name: 'অভিভাবক সমাবেশ ও রেজাল্ট',
    category: 'events',
    priority: 'normal',
    targetAudience: 'parents',
    title: 'শিক্ষক-অভিভাবক মতবিনিময় সভা ও মূল্যায়ন ফলাফল প্রকাশ সংক্রান্ত বিজ্ঞপ্তি',
    getContent: () =>
      `সম্মানিত অভিভাবকবৃন্দের সদয় অবগতির জন্য জানানো যাচ্ছে যে, শিক্ষার্থীদের অর্ধবার্ষিক মূল্যায়নের অগ্রগতি ও পড়ালেখার মানোন্নয়ন বিষয়ে এক মতবিনিময় সভা আগামী শনিবার সকাল ১০:০০ ঘটিকায় বিদ্যালয় মিলনায়তনে অনুষ্ঠিত হবে। \n\nউক্ত সভায় আপনার সন্তানের মূল্যায়ন রিপোর্ট ও প্রগ্রেস কার্ড প্রদান করা হবে। সকল অভিভাবককে যথাসময়ে উপস্থিত থাকার জন্য বিনীত অনুরোধ করা হলো।`,
  },
  {
    id: 'emergency_weather',
    name: 'জরুরি পাঠদান স্থগিত',
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

  const leftBorderTone = notice.isPinned
    ? 'border-l-amber-500'
    : notice.priority === 'urgent'
      ? 'border-l-rose-500'
      : 'border-l-indigo-500';

  return (
    <article
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 border-l-4 ${leftBorderTone} transition-all duration-200 shadow-2xs hover:shadow-md p-5 flex flex-col justify-between gap-4 print:hidden`}
    >
      <div className="space-y-3">
        {/* Meta Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            {notice.isPinned && (
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-lg font-black text-[10px] inline-flex items-center gap-1">
                <Pin size={10} className="fill-amber-500 text-amber-600" /> পিনকৃত
              </span>
            )}
            {getCategoryBadge(notice.category)}
            {getTargetAudienceBadge(notice.targetAudience)}
            {notice.priority === 'urgent' && (
              <span className="px-2 py-0.5 bg-rose-600 text-white rounded-lg text-[10px] font-black inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white" /> জরুরি
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {notice.refNo && (
              <span className="font-mono text-[10.5px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                {notice.refNo}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} className="text-slate-400" />
              {formatNoticeDate(notice.publishedAt)}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={onView}
          className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-snug hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
        >
          {notice.title}
        </h3>

        {/* Content Preview */}
        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50/70 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
          {expanded
            ? notice.content
            : notice.content.length > 200
              ? `${notice.content.substring(0, 200)}...`
              : notice.content}
          {notice.content.length > 200 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-extrabold ml-1.5 cursor-pointer"
            >
              {expanded ? 'সংক্ষিপ্ত করুন' : 'আরও পড়ুন'}
            </button>
          )}
        </div>
      </div>

      {/* Footer Publisher + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0">
            {getPublisherInitial(notice.publisherName)}
          </div>
          <div className="min-w-0">
            <strong className="font-extrabold text-slate-900 dark:text-white block leading-tight truncate">
              {notice.publisherName}
            </strong>
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold block truncate">
              {notice.publisherRole}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={onView}
            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white rounded-xl font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
            title="বিস্তারিত দেখুন"
          >
            <Eye size={13} /> পড়ুন
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={onPrint}
                className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white rounded-xl font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                title="অফিসিয়াল A4 প্যাডে প্রিন্ট"
              >
                <Printer size={13} /> প্রিন্ট
              </button>

              <button
                type="button"
                onClick={onEdit}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition cursor-pointer"
                title="সম্পাদনা করুন"
              >
                <Edit3 size={14} />
              </button>

              <button
                type="button"
                onClick={(e) => onPin(notice.id, e)}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  notice.isPinned
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                }`}
                title={notice.isPinned ? 'আনপিন করুন' : 'পিন করুন'}
              >
                <Pin size={14} className={notice.isPinned ? 'fill-amber-600' : ''} />
              </button>

              <button
                type="button"
                onClick={(e) => onDelete(notice.id, notice.title, e)}
                className="p-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white rounded-xl transition cursor-pointer"
                title="মুছে ফেলুন"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
