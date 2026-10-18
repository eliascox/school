'use client';

import React from 'react';
import { Phone, Mail, Clock, ShieldCheck, MapPin } from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';

interface PublicTopBarProps {
  settings: SchoolSettings | null;
}

export default function PublicTopBar({ settings }: PublicTopBarProps) {
  const phone = settings?.phone || '01819-000000';
  const email = settings?.email || 'baraitoli.highschool@gmail.com';
  const eiin = settings?.eiin || '106184';
  const address = settings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার';

  return (
    <div className="bg-slate-950 text-slate-300 text-xs py-2 border-b border-slate-800/80 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-3">
        {/* Left Info: Phone, Email, Office Hours */}
        <div className="flex items-center flex-wrap gap-4 lg:gap-6 font-medium">
          <a 
            href={`tel:${phone}`}
            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-emerald-400 transition-colors group"
            title="স্কুল হটলাইন নম্বরে কল করুন"
          >
            <span className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Phone className="w-3 h-3" />
            </span>
            <span className="font-semibold tracking-wide">{phone}</span>
          </a>

          <a 
            href={`mailto:${email}`}
            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-emerald-400 transition-colors group"
            title="অফিসিয়াল ইমেইল"
          >
            <span className="w-5 h-5 rounded-full bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Mail className="w-3 h-3" />
            </span>
            <span className="tracking-tight">{email}</span>
          </a>

          <div className="hidden lg:inline-flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>অফিস: শনি - বৃহস্পতি (সকাল ৯:০০ - বিকাল ৪:০০)</span>
          </div>
        </div>

        {/* Right Info: EIIN Badge, Location & Socials */}
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="hidden xl:inline-flex items-center gap-1 text-slate-400 text-[11px]">
            <MapPin className="w-3 h-3 text-red-400" />
            <span>{address}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-emerald-950/60 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold border border-emerald-800/80 text-[11px] tracking-wider shadow-xs">
            <ShieldCheck className="w-3 h-3" />
            <span>EIIN: {eiin}</span>
          </div>

          <span className="hidden sm:inline-block text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
            BISE Chattogram
          </span>

          {/* Social Links */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook Page"
              className="w-6 h-6 rounded-md bg-slate-900 hover:bg-blue-600 text-slate-400 hover:text-white flex items-center justify-center transition-all border border-slate-800"
            >
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube Channel"
              className="w-6 h-6 rounded-md bg-slate-900 hover:bg-red-600 text-slate-400 hover:text-white flex items-center justify-center transition-all border border-slate-800"
            >
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
