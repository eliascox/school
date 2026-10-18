'use client';

import React from 'react';
import { Phone, Mail, Clock } from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';

interface PublicTopBarProps {
  settings: SchoolSettings | null;
}

export default function PublicTopBar({ settings }: PublicTopBarProps) {
  const phone = settings?.phone || '০১৭১১-XXXXXX';
  const email = settings?.email || 'baraitoli.highschool@gmail.com';
  const eiin = settings?.eiin || '106184';

  return (
    <div className="bg-slate-950 text-slate-300 text-xs py-2 border-b border-slate-800/80 hidden sm:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-between items-center gap-2">
        {/* Left Info: Phone, Email, Office Hours */}
        <div className="flex items-center flex-wrap gap-4 sm:gap-6 font-medium">
          <span className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>{phone}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            <span>{email}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Office Hours: Sat - Thu (9:00 AM - 4:00 PM)</span>
          </span>
        </div>

        {/* Right Info: EIIN & Socials */}
        <div className="flex items-center gap-4">
          <span className="bg-slate-900 text-emerald-400 px-2.5 py-0.5 rounded-full font-semibold border border-slate-700 text-[11px] tracking-wide">
            EIIN: {eiin}
          </span>
          <div className="flex items-center gap-2.5 border-l border-slate-800 pl-3">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook Page"
              className="text-slate-400 hover:text-blue-400 transition-colors p-0.5"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube Channel"
              className="text-slate-400 hover:text-red-400 transition-colors p-0.5"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
