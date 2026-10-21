'use client';

import React from 'react';
import Link from 'next/link';
import { 
  School, 
  MapPin, 
  Phone, 
  Mail, 
  ChevronRight, 
  ExternalLink, 
  Clock, 
  ArrowUp, 
  Heart,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';
import { FooterConfig } from '@/services/landingPageService';

interface PublicFooterProps {
  settings?: SchoolSettings | null;
  footerConfig?: FooterConfig | null;
}

export default function PublicFooter({ settings, footerConfig }: PublicFooterProps) {
  const schoolName = settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const eiin = footerConfig?.eiin || settings?.eiin || '১০৬১৮৪';
  const schoolCode = footerConfig?.schoolCode || '৩৪১২';
  const regNo = footerConfig?.regNo || 'বি-৭৮৯৪ (চট্টগ্রাম বোর্ড)';
  const address = footerConfig?.address || settings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার, বাংলাদেশ।';
  const phone1 = footerConfig?.phone1 || '+৮৮০ ১৮১২-৩৪৫৬৭৮ (অফিস)';
  const phone2 = footerConfig?.phone2 || '+৮৮০ ৩৪১-৬৫৪৩২ (অধ্যক্ষ)';
  const email1 = footerConfig?.email1 || 'info@baraitolihs.edu.bd';
  const email2 = footerConfig?.email2 || 'principal@baraitolihs.edu.bd';
  const copyrightText = footerConfig?.copyrightText || `© ২০২৬ ${schoolName}। সর্বস্বত্ব সংরক্ষিত।`;
  
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 relative">
      {/* Decorative Top Accent Border */}
      <div className="h-1.5 bg-gradient-to-r from-[#0B5D3B] via-[#F4B400] to-[#0B5D3B]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        
        {/* ৪ কলামের মূল ফুটার গ্রিড */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* ===================================================================
              কলাম ১: অন্যান্য লিঙ্ক
              (ওয়েব মেইল, পিডিএস, ই-স্কুল, শিক্ষা মন্ত্রণালয়, ব্যানবেইস, নায়েম, এনসিটিবি)
              =================================================================== */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F4B400]" />
              <span>অন্যান্য লিঙ্ক</span>
            </h4>
            
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#login" className="hover:text-[#F4B400] transition-colors flex items-center gap-2 text-slate-400 hover:translate-x-1 duration-200">
                  <ChevronRight className="w-3.5 h-3.5 text-[#0B5D3B]" />
                  <span>ওয়েব মেইল (Webmail)</span>
                </a>
              </li>
              <li>
                <a href="https://pds.emis.gov.bd" target="_blank" rel="noopener noreferrer" className="hover:text-[#F4B400] transition-colors flex items-center gap-2 text-slate-400 hover:translate-x-1 duration-200">
                  <ChevronRight className="w-3.5 h-3.5 text-[#0B5D3B]" />
                  <span>পিডিএস (PDS - শিক্ষক তথ্য)</span>
                </a>
              </li>
              <li>
                <a href="#login" className="hover:text-[#F4B400] transition-colors flex items-center gap-2 text-slate-400 hover:translate-x-1 duration-200">
                  <ChevronRight className="w-3.5 h-3.5 text-[#0B5D3B]" />
                  <span>ই-স্কুল পোর্টাল (E-School)</span>
                </a>
              </li>
              <li>
                <a href="https://moedu.gov.bd" target="_blank" rel="noopener noreferrer" className="hover:text-[#F4B400] transition-colors flex items-center gap-2 text-slate-400 hover:translate-x-1 duration-200">
                  <ChevronRight className="w-3.5 h-3.5 text-[#0B5D3B]" />
                  <span>শিক্ষা মন্ত্রণালয় (MoEDU)</span>
                </a>
              </li>
              <li>
                <a href="https://banbeis.gov.bd" target="_blank" rel="noopener noreferrer" className="hover:text-[#F4B400] transition-colors flex items-center gap-2 text-slate-400 hover:translate-x-1 duration-200">
                  <ChevronRight className="w-3.5 h-3.5 text-[#0B5D3B]" />
                  <span>ব্যানবেইস (BANBEIS)</span>
                </a>
              </li>
              <li>
                <a href="https://naem.gov.bd" target="_blank" rel="noopener noreferrer" className="hover:text-[#F4B400] transition-colors flex items-center gap-2 text-slate-400 hover:translate-x-1 duration-200">
                  <ChevronRight className="w-3.5 h-3.5 text-[#0B5D3B]" />
                  <span>নায়েম (NAEM)</span>
                </a>
              </li>
              <li>
                <a href="https://nctb.gov.bd" target="_blank" rel="noopener noreferrer" className="hover:text-[#F4B400] transition-colors flex items-center gap-2 text-slate-400 hover:translate-x-1 duration-200">
                  <ChevronRight className="w-3.5 h-3.5 text-[#0B5D3B]" />
                  <span>এনসিটিবি (NCTB)</span>
                </a>
              </li>
            </ul>
          </div>

          {/* ===================================================================
              কলাম ২: গুরুত্বপূর্ণ লিঙ্ক
              (যোগাযোগ, প্রতিষ্ঠান পরিচিতি, শিক্ষক, কমিটি, গ্যালারী, ব্লগ)
              =================================================================== */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0B5D3B]" />
              <span>গুরুত্বপূর্ণ লিঙ্ক</span>
            </h4>

            <ul className="space-y-2 text-xs">
              <li>
                <a href="#about" className="hover:text-[#F4B400] transition-colors flex items-center gap-2 text-slate-400 hover:translate-x-1 duration-200">
                  <ChevronRight className="w-3.5 h-3.5 text-[#F4B400]" />
                  <span>প্রতিষ্ঠান পরিচিতি ও ইতিহাস</span>
                </a>
              </li>
              <li>
                <a href="#teachers" className="hover:text-[#F4B400] transition-colors flex items-center gap-2 text-slate-400 hover:translate-x-1 duration-200">
                  <ChevronRight className="w-3.5 h-3.5 text-[#F4B400]" />
                  <span>শিক্ষক ও শিক্ষিকাবৃন্দ</span>
                </a>
              </li>
              <li>
                <a href="#committee" className="hover:text-[#F4B400] transition-colors flex items-center gap-2 text-slate-400 hover:translate-x-1 duration-200">
                  <ChevronRight className="w-3.5 h-3.5 text-[#F4B400]" />
                  <span>পরিচালনা কমিটি (Managing Committee)</span>
                </a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-[#F4B400] transition-colors flex items-center gap-2 text-slate-400 hover:translate-x-1 duration-200">
                  <ChevronRight className="w-3.5 h-3.5 text-[#F4B400]" />
                  <span>ছবির গ্যালারী ও ভিডিও</span>
                </a>
              </li>
              <li>
                <a href="#blog" className="hover:text-[#F4B400] transition-colors flex items-center gap-2 text-slate-400 hover:translate-x-1 duration-200">
                  <ChevronRight className="w-3.5 h-3.5 text-[#F4B400]" />
                  <span>সংবাদ ও ব্লগ প্রতিবেদন</span>
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-[#F4B400] transition-colors flex items-center gap-2 text-slate-400 hover:translate-x-1 duration-200">
                  <ChevronRight className="w-3.5 h-3.5 text-[#F4B400]" />
                  <span>যোগাযোগ ও লোকেশন ম্যাপ</span>
                </a>
              </li>
            </ul>
          </div>

          {/* ===================================================================
              কলাম ৩: যোগাযোগ (ঠিকানা, ২টি ফোন, ২টি ইমেইল, আইকন সহ)
              =================================================================== */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F4B400]" />
              <span>যোগাযোগ</span>
            </h4>

            <div className="space-y-3.5 text-xs text-slate-400">
              {/* ঠিকানা */}
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#F4B400] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{address}</span>
              </div>

              {/* ২টি ফোন নম্বর */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#0B5D3B] shrink-0" />
                  <a href="tel:+8801812345678" className="hover:text-white transition-colors">+৮৮০ ১৮১২-৩৪৫৬৭৮ (অফিস)</a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#0B5D3B] shrink-0" />
                  <a href="tel:+88034165432" className="hover:text-white transition-colors">+৮৮০ ৩৪১-৬৫৪৩২ (অধ্যক্ষ)</a>
                </div>
              </div>

              {/* ২টি ইমেইল */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#F4B400] shrink-0" />
                  <a href="mailto:info@baraitolihs.edu.bd" className="hover:text-white transition-colors">info@baraitolihs.edu.bd</a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#F4B400] shrink-0" />
                  <a href="mailto:principal@baraitolihs.edu.bd" className="hover:text-white transition-colors">principal@baraitolihs.edu.bd</a>
                </div>
              </div>

              {/* অফিস সময় */}
              <div className="flex items-center gap-2.5 pt-1 text-[11px] text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>রবি - বৃহস্পতি: সকাল ৯:০০ - বিকাল ৪:০০</span>
              </div>
            </div>
          </div>

          {/* ===================================================================
              কলাম ৪: EIIN/স্কুল কোড/রেজি. নং ও "Connect us" সোশ্যাল আইকন
              =================================================================== */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0B5D3B]" />
              <span>প্রতিষ্ঠান পরিচিতি</span>
            </h4>

            {/* লোগো ও নাম */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B5D3B] to-slate-900 border border-emerald-600/40 flex items-center justify-center text-[#F4B400] shadow-md shrink-0">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-sm font-bold text-white leading-tight">{schoolName}</h5>
                <span className="text-[11px] text-slate-400">চকোরিয়া, কক্সবাজার</span>
              </div>
            </div>

            {/* প্রাতিষ্ঠানিক কোড বক্স */}
            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">EIIN নং:</span>
                <span className="font-bold text-[#F4B400]">{eiin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">স্কুল কোড:</span>
                <span className="font-bold text-white">{schoolCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">রেজি. নং:</span>
                <span className="font-semibold text-slate-300">{regNo}</span>
              </div>
            </div>

            {/* "Connect us" সোশ্যাল আইকন */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-300 block mb-2.5">
                Connect us (আমাদের সাথে যুক্ত থাকুন):
              </span>
              <div className="flex items-center gap-2.5">
                {/* Facebook */}
                <a href="#" aria-label="Facebook" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#0B5D3B] text-white flex items-center justify-center transition-all hover:scale-110 shadow-sm" title="Facebook">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                {/* YouTube */}
                <a href="#" aria-label="YouTube" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-600 text-white flex items-center justify-center transition-all hover:scale-110 shadow-sm" title="YouTube">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
                {/* LinkedIn */}
                <a href="#" aria-label="LinkedIn" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#0B5D3B] text-white flex items-center justify-center transition-all hover:scale-110 shadow-sm" title="LinkedIn">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
                {/* WhatsApp */}
                <a href="https://wa.me/8801812345678" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-emerald-600 text-white flex items-center justify-center transition-all hover:scale-110 shadow-sm" title="WhatsApp">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                </a>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ===================================================================
          সবার নিচে কপিরাইট বার (BOTTOM COPYRIGHT BAR)
          =================================================================== */}
      <div className="bg-black/60 border-t border-slate-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          
          {/* কপিরাইট নোটিশ */}
          <div className="text-center sm:text-left">
            <p className="text-slate-400">
              {copyrightText}
            </p>
          </div>

          {/* সিস্টেম ক্রেডিট ও ব্যাক টু টপ বাটন */}
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-400">
              ডিজিটাল স্কুল ম্যানেজমেন্ট সিস্টেম দ্বারা পরিচালিত
            </span>

            {/* ব্যাক টু টপ বাটন */}
            <button
              type="button"
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-slate-800 hover:bg-[#0B5D3B] text-slate-300 hover:text-white transition-colors"
              title="উপরে যান"
              aria-label="পৃষ্ঠার শীর্ষে ফিরে যান"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </footer>
  );
}
