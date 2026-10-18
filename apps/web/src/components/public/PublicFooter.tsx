'use client';

import React from 'react';
import Link from 'next/link';
import { School, MapPin, Phone, Mail, ChevronRight, ExternalLink } from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';

interface PublicFooterProps {
  settings: SchoolSettings | null;
}

export default function PublicFooter({ settings }: PublicFooterProps) {
  const schoolName = settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const eiin = settings?.eiin || '106184';
  const estd = settings?.estdYear || '1969';
  const address = settings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার।';
  const phone = settings?.phone || '০১৭১১-XXXXXX';
  const email = settings?.email || 'baraitoli.highschool@gmail.com';

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Col 1: School Identity */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-700 to-slate-900 flex items-center justify-center text-amber-400 border border-indigo-600/50 shadow-md">
                <School className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">{schoolName}</h3>
                <span className="text-xs text-slate-400">EIIN: {eiin} • Estd. {estd}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              A premier secondary educational institution in Chakaria, Cox's Bazar. Dedicated to academic excellence, digital literacy, moral ethics, and preparing tomorrow's national leaders.
            </p>

            <div className="pt-2 text-xs text-slate-400 space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{email}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links in English */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#about" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span>About Our School & History</span>
                </a>
              </li>
              <li>
                <a href="#principal" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span>Principal's Message</span>
                </a>
              </li>
              <li>
                <a href="#teachers" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span>Faculty & Staff Directory</span>
                </a>
              </li>
              <li>
                <a href="#academic" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span>Academic Curriculum & Streams</span>
                </a>
              </li>
              <li>
                <a href="#notices" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span>Notice Board</span>
                </a>
              </li>
              <li>
                <a href="#facilities" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span>Campus Facilities & Labs</span>
                </a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span>Photo Gallery</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Online Portals in English */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              E-Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/admission" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span>Online Admission</span>
                </Link>
              </li>
              <li>
                <Link href="/result" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span>Check Exam Results</span>
                </Link>
              </li>
              <li>
                <Link href="/verify-certificate" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span>QR Certificate Check</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span>Teacher Portal Login</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span>Admin Dashboard</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Official Educational Portals */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Official Education Portals
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a
                  href="https://moedu.gov.bd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>Ministry of Education (moedu.gov.bd)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://dshe.gov.bd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>DSHE (dshe.gov.bd)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://bise-ctg.portal.gov.bd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>BISE Chattogram Board</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="http://nctb.gov.bd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>NCTB (nctb.gov.bd)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="pt-8 mt-12 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 {schoolName}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>EIIN: {eiin}</span>
            <span>•</span>
            <span>BISE Chattogram</span>
            <span>•</span>
            <Link href="/login" className="text-slate-400 hover:text-white underline">
              Management Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
