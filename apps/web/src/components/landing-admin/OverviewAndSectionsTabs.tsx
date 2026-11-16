'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Users,
  UserPlus,
  Camera,
  ArrowRight,
  GraduationCap,
  Upload,
  School,
  ShieldCheck,
  Layers,
  Image as ImageIcon,
  History,
  ChevronRight,
  ExternalLink,
  Plus,
  MoveUp,
  MoveDown,
  Copy,
  Trash2,
} from 'lucide-react';
import {
  LandingPageConfig,
  SectionItem,
  MediaItem,
  VersionSnapshot,
} from '@/services/landingPageService';
import { Student } from '@/services/studentService';
import { ActiveTab, ShowToastFn } from './landingAdminShared';

interface LandingOverviewTabProps {
  config: LandingPageConfig;
  liveStudents: Student[];
  mediaList: MediaItem[];
  versions: VersionSnapshot[];
  setActiveTab: (tab: ActiveTab) => void;
  handleToggleSection: (sectionId: string, current: boolean) => void;
  onOpenImportModal: () => void;
}

export function LandingOverviewTab({
  config,
  liveStudents,
  mediaList,
  versions,
  setActiveTab,
  handleToggleSection,
  onOpenImportModal,
}: LandingOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Quick Management Hub */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>সহজ কুইক এক্সেস কন্ট্রোল প্যানেল</span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              শিক্ষার্থী, গ্যালারি ও সেরা শিক্ষার্থী দ্রুত পরিচালনা
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              এক ক্লিকেই শিক্ষার্থী ডাটাবেজ আপডেট, গ্যালারির ছবি পরিবর্তন কিংবা সেরা কৃতি শিক্ষার্থীদের তথ্য পরিমার্জন করুন।
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Student Database */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                  <Users className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  লাইভ ডাটাবেজ
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">শিক্ষার্থী ডাটাবেজ</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                মোট শিক্ষার্থী: {liveStudents.length > 0 ? `${liveStudents.length} জন` : 'ডাটা প্রস্তুত'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-2">
              <Link
                href="/dashboard/students"
                className="flex-1 text-center py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
              >
                শিক্ষার্থী তালিকা
              </Link>
              <Link
                href="/dashboard/admission"
                className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                title="অনলাইন ভর্তি"
              >
                <UserPlus className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 2. Photo Gallery */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                  <Camera className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                  {config.gallery?.items?.length || 3} টি আইটেম
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">ফটো ও ভিডিও গ্যালারি</h4>
              <p className="text-xs text-slate-300 mt-0.5">ক্যাম্পাস লাইফ, ল্যাব ও ক্রীড়া ছবি</p>
            </div>
            <div className="mt-3 pt-2 border-t border-white/10">
              <button
                onClick={() => setActiveTab('gallery')}
                className="w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <span>গ্যালারি পরিবর্তন করুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3. Achievers */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                  <GraduationCap className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full">
                  {config.achievers.students.length} জন কৃতি
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">সেরা ছাত্র/ছাত্রী</h4>
              <p className="text-xs text-slate-300 mt-0.5">বোর্ড ও মেধা অন্বেষণে শীর্ষস্থান</p>
            </div>
            <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-2">
              <button
                onClick={() => setActiveTab('achievers')}
                className="flex-1 py-1.5 px-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition"
              >
                কৃতি তালিকা এডিট
              </button>
              <button
                onClick={() => {
                  setActiveTab('achievers');
                  onOpenImportModal();
                }}
                className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                title="ডাটাবেজ থেকে শীর্ষ শিক্ষার্থী ইমপোর্ট"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 4. Headmaster & President Message */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
                  <School className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">
                  বাণী ও পরিচিতি
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">প্রধান শিক্ষক ও সভাপতি</h4>
              <p className="text-xs text-slate-300 mt-0.5">ছবি, পদবি ও দিকনির্দেশনামূলক বাণী</p>
            </div>
            <div className="mt-3 pt-2 border-t border-white/10">
              <button
                onClick={() => setActiveTab('about')}
                className="w-full py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <span>বাণী ও পরিচিতি এডিট</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            লাইভ স্ট্যাটাস
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              সংস্করণ {config.version}
            </span>
            <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            সর্বশেষ আপডেট: {new Date(config.lastUpdatedAt).toLocaleDateString('bn-BD')}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            সক্রিয় সেকশন
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {config.sections.filter((s) => s.enabled).length} / {config.sections.length}
            </span>
            <span className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
              <Layers className="w-6 h-6" />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">ল্যান্ডিং পেজে দৃশ্যমান রয়েছে</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            মিডিয়া ফাইলসমূহ
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {mediaList.length} টি ফাইল
            </span>
            <span className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <ImageIcon className="w-6 h-6" />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">লোগো, ব্যানার ও ফটো গ্যালারি</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            প্রকাশের ইতিহাস
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {versions.length} টি স্ন্যাপশট
            </span>
            <span className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <History className="w-6 h-6" />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">যেকোনো সময় আগের সংস্করণে ফেরা যাবে</p>
        </div>
      </div>

      {/* Quick Shortcuts & Section Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              সেকশনসমূহের বর্তমান স্ট্যাটাস
            </h3>
            <button
              onClick={() => setActiveTab('sections')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              সেকশন ম্যানেজার খুলুন <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {config.sections.map((sec, idx) => (
              <div
                key={sec.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{sec.nameBn}</span>
                    <span className="text-xs text-slate-400 block">{sec.description}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      sec.enabled
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {sec.enabled ? 'দৃশ্যমান' : 'লুকানো'}
                  </span>
                  <button
                    onClick={() => handleToggleSection(sec.id, sec.enabled)}
                    className="text-xs font-bold px-3 py-1 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 transition"
                  >
                    {sec.enabled ? 'হাইড করুন' : 'শো করুন'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Guide */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-indigo-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-white/10 text-yellow-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base">সহজ ৩-ধাপে পরিবর্তন</h3>
            </div>
            <ul className="text-xs space-y-2.5 text-indigo-100 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ১
                </span>
                <span>যেকোনো ট্যাবে গিয়ে টেক্সট, ছবি বা ডিজাইন পরিবর্তন করুন।</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ২
                </span>
                <span>
                  <strong>&quot;লাইভ প্রিভিউ&quot;</strong> বাটনে ক্লিক করে মোবাইল বা কম্পিউটারে কেমন দেখাবে তা পরীক্ষা করুন।
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ৩
                </span>
                <span>
                  সব ঠিক থাকলে <strong>&quot;প্রকাশ করুন&quot;</strong> বাটনে ক্লিক করলেই এক ক্লিকে মূল ওয়েবসাইট আপডেট হয়ে যাবে!
                </span>
              </li>
            </ul>

            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-indigo-200">লাইভ ওয়েবসাইট সরাসরি দেখুন:</span>
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-indigo-900 font-extrabold text-xs hover:bg-indigo-50 transition"
              >
                <span>ভিজিট সাইট</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Institution Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              প্রতিষ্ঠান পরিচিতি সংক্ষেপ
            </h4>
            <div className="text-sm">
              <p className="font-extrabold text-slate-900 dark:text-white">{config.header.schoolName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{config.header.topbarAddress}</p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1 text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>EIIN:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{config.footer.eiin}</span>
              </div>
              <div className="flex justify-between">
                <span>স্কুল কোড:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{config.footer.schoolCode}</span>
              </div>
              <div className="flex justify-between">
                <span>ফোন:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{config.header.topbarPhone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LandingSectionsTabProps {
  config: LandingPageConfig;
  handleMoveSection: (index: number, direction: 'up' | 'down') => void;
  handleDuplicateSection: (sec: SectionItem) => void;
  handleToggleSection: (sectionId: string, current: boolean) => void;
  handleDeleteSection: (sec: SectionItem) => Promise<void>;
  showToast: ShowToastFn;
}

export function LandingSectionsTab({
  config,
  handleMoveSection,
  handleDuplicateSection,
  handleToggleSection,
  handleDeleteSection,
  showToast,
}: LandingSectionsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">সেকশন ম্যানেজার ও ক্রম পরিবর্তন</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              ল্যান্ডিং পেজের সেকশনগুলোকে ড্র্যাগ/আপ-ডাউন করে সাজান, প্রদর্শন বা গোপন করুন এবং প্রয়োজনে ডুপ্লিকেট করুন।
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              showToast(
                'সকল মূল সেকশন নিচে তালিকাভুক্ত রয়েছে। যেকোনো সেকশন ডুপ্লিকেট বা চালু/বন্ধ করতে পারেন।',
                'info'
              )
            }
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন সেকশন যোগ করুন</span>
          </button>
        </div>

        <div className="space-y-3">
          {config.sections.map((sec, index) => (
            <div
              key={sec.id}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                sec.enabled
                  ? 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-900/60 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-sm shrink-0 border border-slate-200 dark:border-slate-700">
                  {sec.order}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {sec.nameBn}
                    </span>
                    {sec.type === 'custom' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        কাস্টম
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{sec.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={() => handleMoveSection(index, 'up')}
                  disabled={index === 0}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition text-slate-600 dark:text-slate-300"
                  title="উপরে নিন"
                >
                  <MoveUp className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleMoveSection(index, 'down')}
                  disabled={index === config.sections.length - 1}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition text-slate-600 dark:text-slate-300"
                  title="নিচে নিন"
                >
                  <MoveDown className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDuplicateSection(sec)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300"
                  title="ডুপ্লিকেট করুন"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleToggleSection(sec.id, sec.enabled)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition border ${
                    sec.enabled
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {sec.enabled ? 'দৃশ্যমান' : 'লুকানো'}
                </button>

                <button
                  onClick={() => handleDeleteSection(sec)}
                  className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
