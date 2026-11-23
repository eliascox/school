'use client';

import React from 'react';
import { Bell, ArrowRight, Calendar } from 'lucide-react';
import { Notice } from '@/services/noticeService';

interface PublicNoticeTickerProps {
  notices: Notice[];
  onSelectNotice: (notice: Notice) => void;
}

export default function PublicNoticeTicker({ notices, onSelectNotice }: PublicNoticeTickerProps) {
  const publishedNotices = notices.slice(0, 6);

  if (publishedNotices.length === 0) return null;

  // Duplicate list twice so translate3d(-50%, 0, 0) produces a seamless infinite marquee
  const tickerItems = [...publishedNotices, ...publishedNotices];

  return (
    <div className="group bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white border-b border-indigo-900/60 overflow-hidden shadow-xs relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center py-2.5 gap-3">
        {/* Modern Announcement Badge with Pulsing Light */}
        <div className="shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm shadow-red-900/50 whitespace-nowrap">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <Bell className="w-3.5 h-3.5 ml-0.5" />
          <span>LATEST NOTICE</span>
        </div>

        {/* Seamless Infinite Marquee Content with Soft Edge Mask */}
        <div className="flex-1 overflow-hidden relative notice-ticker-mask">
          <div className="animate-marquee items-center gap-10 whitespace-nowrap cursor-pointer text-xs sm:text-sm text-slate-200">
            {tickerItems.map((n, idx) => (
              <button
                key={`${n.id || 'ntc'}-${idx}`}
                type="button"
                onClick={() => onSelectNotice(n)}
                className="inline-flex items-center gap-2.5 hover:text-amber-300 transition-colors text-left focus:outline-hidden group/item pr-4"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover/item:scale-125 transition-transform"></span>
                <span className="font-semibold">{n.title}</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded-md border border-slate-800">
                  <Calendar className="w-2.5 h-2.5 text-indigo-400" />
                  {n.publishedAt
                    ? new Date(n.publishedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'সদ্য প্রকাশিত'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* View All Notices Link */}
        <a
          href="#notices"
          className="shrink-0 hidden md:inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider transition-all duration-200 bg-indigo-950/60 hover:bg-indigo-900/80 px-2.5 py-1 rounded-lg border border-indigo-800/60 hover:-translate-y-0.5"
        >
          <span>All Notices</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
