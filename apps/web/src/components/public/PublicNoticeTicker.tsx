'use client';

import React from 'react';
import { Bell, ArrowRight } from 'lucide-react';
import { Notice } from '@/services/noticeService';

interface PublicNoticeTickerProps {
  notices: Notice[];
  onSelectNotice: (notice: Notice) => void;
}

export default function PublicNoticeTicker({ notices, onSelectNotice }: PublicNoticeTickerProps) {
  const publishedNotices = notices.slice(0, 5);

  if (publishedNotices.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white border-b border-indigo-900/60 overflow-hidden shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center py-2.5 gap-3">
        {/* Professional Announcement Badge */}
        <div className="shrink-0 flex items-center gap-1.5 bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse shadow-xs">
          <Bell className="w-3.5 h-3.5" />
          <span>LATEST NOTICE</span>
        </div>

        {/* Ticker Content */}
        <div className="flex-1 overflow-hidden relative">
          <div className="flex items-center gap-8 whitespace-nowrap animate-marquee hover:pause cursor-pointer text-xs sm:text-sm text-slate-200">
            {publishedNotices.map((n, idx) => (
              <button
                key={n.id || idx}
                onClick={() => onSelectNotice(n)}
                className="inline-flex items-center gap-2 hover:text-amber-400 transition-colors text-left focus:outline-hidden"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span className="font-medium">{n.title}</span>
                <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
                  {new Date(n.publishedAt || Date.now()).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* View all link */}
        <a
          href="#notices"
          className="shrink-0 hidden md:inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider transition-colors"
        >
          <span>All Notices</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
