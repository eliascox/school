'use client';

import React from 'react';
import { Bell, ArrowRight, Calendar } from 'lucide-react';
import { PublicNoticeViewItem } from '@/lib/publicLandingUtils';

interface PublicNoticeTickerProps {
  notices: PublicNoticeViewItem[];
  onSelectNotice: (notice: PublicNoticeViewItem) => void;
}

export default function PublicNoticeTicker({ notices, onSelectNotice }: PublicNoticeTickerProps) {
  const publishedNotices = notices.slice(0, 6);

  if (publishedNotices.length === 0) return null;

  const tickerItems = [...publishedNotices, ...publishedNotices];

  return (
    <div
      aria-label="সর্বশেষ নোটিশ টিকার"
      className="group bg-gradient-to-r from-[#064e3b] via-[#0B5D3B] to-[#064e3b] text-white border-b border-emerald-800/80 overflow-hidden shadow-xs relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center py-2.5 gap-3">
        {/* Live Bengali Announcement Badge */}
        <div className="shrink-0 flex items-center gap-1.5 bg-[#F4B400] text-slate-950 text-[11px] font-black px-3 py-1 rounded-full tracking-wide shadow-sm whitespace-nowrap">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-600 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
          </span>
          <Bell className="w-3.5 h-3.5" />
          <span>সর্বশেষ নোটিশ</span>
        </div>

        {/* Seamless Infinite Marquee */}
        <div className="flex-1 overflow-hidden relative notice-ticker-mask">
          <div className="animate-marquee items-center gap-9 whitespace-nowrap text-xs sm:text-sm text-emerald-50">
            {tickerItems.map((n, idx) => (
              <button
                key={`${n.id || 'ntc'}-${idx}`}
                type="button"
                onClick={() => onSelectNotice(n)}
                className="inline-flex items-center gap-2.5 hover:text-[#F4B400] transition-colors text-left focus:outline-hidden group/item pr-4 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#F4B400] group-hover/item:scale-125 transition-transform" />
                <span className="font-bold">{n.title}</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-100/90 bg-black/25 px-2 py-0.5 rounded-md border border-white/15">
                  <Calendar className="w-2.5 h-2.5 text-[#F4B400]" />
                  {n.date}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Jump to Notice Board */}
        <a
          href="#notices"
          className="shrink-0 hidden md:inline-flex items-center gap-1 text-xs text-[#F4B400] hover:text-amber-200 font-bold transition-all duration-200 bg-black/20 hover:bg-black/35 px-3 py-1 rounded-lg border border-white/15"
        >
          <span>সব নোটিশ</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
