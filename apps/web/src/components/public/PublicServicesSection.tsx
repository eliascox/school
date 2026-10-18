'use client';

import React from 'react';
import Link from 'next/link';
import { 
  UserPlus, 
  Search, 
  ShieldCheck, 
  CreditCard, 
  CalendarCheck, 
  Users, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function PublicServicesSection() {
  const services = [
    {
      title: 'Online Admission Portal',
      desc: 'Digital admission applications for Classes 6 to 9 with guidelines, requirements, and confirmation receipts.',
      icon: <UserPlus className="w-6 h-6 text-emerald-500" />,
      href: '/admission',
      ctaText: 'Apply Online',
      badge: 'Admission Open',
      primary: true
    },
    {
      title: 'Online Examination Results',
      desc: 'Check published examination marks, grades, and digital transcripts using class and roll numbers.',
      icon: <Search className="w-6 h-6 text-indigo-500" />,
      href: '/result',
      ctaText: 'Check Results',
      badge: 'Official Transcripts',
      primary: true
    },
    {
      title: 'Digital Certificate Verification',
      desc: 'Verify the authenticity of school testimonials, academic certificates, and student documents via QR Code.',
      icon: <ShieldCheck className="w-6 h-6 text-amber-500" />,
      href: '/verify-certificate',
      ctaText: 'Verify QR Certificate',
      badge: 'Instant QR Check',
      primary: false
    },
    {
      title: 'Student Attendance Portal',
      desc: 'Real-time daily attendance records, leave history, and monthly reports accessible for guardians.',
      icon: <CalendarCheck className="w-6 h-6 text-cyan-500" />,
      href: '/login',
      ctaText: 'Guardian Portal',
      badge: 'Parent Corner',
      primary: false
    },
    {
      title: 'Fee & Payment Records',
      desc: 'Transparent student monthly tuition fee logs, examination fee structures, and downloadable payment receipts.',
      icon: <CreditCard className="w-6 h-6 text-rose-500" />,
      href: '/login',
      ctaText: 'Payment History',
      badge: 'Financial Records',
      primary: false
    },
    {
      title: 'Faculty & Staff Portal',
      desc: 'Administrative hub for teachers to record attendance, enter examination marks, and submit leave requests.',
      icon: <Users className="w-6 h-6 text-purple-500" />,
      href: '/login',
      ctaText: 'Faculty Login',
      badge: 'Staff Dashboard',
      primary: false
    }
  ];

  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DIGITAL E-SERVICES & PORTALS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            All School Online Services at Your Fingertips
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            Fast, secure, and intuitive digital access for students, guardians, prospective applicants, and educators.
          </p>
        </div>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-6 border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between ${
                srv.primary
                  ? 'bg-gradient-to-b from-indigo-50/40 to-white dark:from-indigo-950/20 dark:to-slate-900 border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                  : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200 dark:border-slate-700">
                    {srv.icon}
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {srv.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                  {srv.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {srv.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                <Link
                  href={srv.href}
                  className={`inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                    srv.primary
                      ? 'bg-indigo-950 hover:bg-indigo-900 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600'
                  }`}
                >
                  <span>{srv.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
