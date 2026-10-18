'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  Calendar, 
  User, 
  FileText, 
  ArrowRight, 
  X
} from 'lucide-react';
import { Notice } from '@/services/noticeService';

interface PublicNoticesSectionProps {
  notices: Notice[];
  selectedNotice: Notice | null;
  onSelectNotice: (n: Notice | null) => void;
}

export default function PublicNoticesSection({
  notices,
  selectedNotice,
  onSelectNotice
}: PublicNoticesSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { key: 'all', label: 'All Notices' },
    { key: 'exam', label: 'Examinations' },
    { key: 'academic', label: 'Academics' },
    { key: 'holiday', label: 'Holidays' },
    { key: 'general', label: 'General' },
  ];

  const filteredNotices = notices.filter((n) => {
    if (activeCategory === 'all') return true;
    return n.category === activeCategory;
  });

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'exam':
        return <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-300 dark:border-amber-700">Examinations</span>;
      case 'holiday':
        return <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-300 dark:border-emerald-700">Holidays</span>;
      case 'academic':
        return <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-indigo-300 dark:border-indigo-700">Academics</span>;
      default:
        return <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-slate-300 dark:border-slate-700">General</span>;
    }
  };

  return (
    <section id="notices" className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 mb-3">
              <Bell className="w-3.5 h-3.5" />
              <span>OFFICIAL NOTICE BOARD</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Latest Announcements & Circulars
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Official institutional notifications, exam routines, and academic calendars.
            </p>
          </div>

          {/* Category Filter Tabs in English */}
          <div className="flex flex-wrap gap-1.5 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setActiveCategory(c.key)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeCategory === c.key
                    ? 'bg-indigo-950 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notices Cards Grid */}
        {filteredNotices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotices.map((notice) => (
              <div
                key={notice.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {getCategoryBadge(notice.category)}
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(notice.publishedAt || Date.now()).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                    {notice.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-3 leading-relaxed">
                    {notice.content}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 truncate max-w-[170px]">
                    <User className="w-3 h-3 shrink-0" />
                    <span className="truncate">{notice.publisherRole || 'Principal'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectNotice(notice)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors cursor-pointer"
                  >
                    <span>Read Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 text-slate-500">
            <FileText className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No notices found in this category.</p>
          </div>
        )}
      </div>

      {/* Notice Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => onSelectNotice(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              {getCategoryBadge(selectedNotice.category)}
              {selectedNotice.refNo && (
                <span className="text-xs text-slate-500 font-mono">Ref: {selectedNotice.refNo}</span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
              {selectedNotice.title}
            </h3>

            <div className="flex items-center gap-4 text-xs text-slate-500 py-3 my-3 border-y border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(selectedNotice.publishedAt || Date.now()).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {selectedNotice.publisherName} ({selectedNotice.publisherRole})
              </span>
            </div>

            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap space-y-3">
              {selectedNotice.content}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => onSelectNotice(null)}
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-950 hover:bg-indigo-900 rounded-xl shadow-xs cursor-pointer"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
