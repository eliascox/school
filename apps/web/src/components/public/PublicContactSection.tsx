'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';
import { ContactConfig, FooterConfig } from '@/services/landingPageService';
import { resolvePublicContactInfo } from '@/lib/publicLandingUtils';
import { normalizeRollDigits } from '@/lib/resultPortalUtils';

interface PublicContactSectionProps {
  settings: SchoolSettings | null;
  contactConfig?: ContactConfig | null;
  footerConfig?: FooterConfig | null;
}

export default function PublicContactSection({
  settings,
  contactConfig,
  footerConfig,
}: PublicContactSectionProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (contactConfig && contactConfig.enabled === false) {
    return null;
  }

  const info = resolvePublicContactInfo(settings, contactConfig, footerConfig);

  const cleanTelHref = (raw: string) => {
    const digits = normalizeRollDigits(raw).replace(/[^\d+]/g, '');
    return digits ? `tel:${digits}` : undefined;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;
    try {
      const existingRaw = localStorage.getItem('sms_public_inquiries');
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const list = Array.isArray(existing) ? existing : [];
      list.unshift({
        id: `INQ-${Date.now()}`,
        name: name.trim(),
        phone: phone.trim(),
        subject: subject.trim() || 'সাধারণ অনুসন্ধান',
        message: message.trim(),
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('sms_public_inquiries', JSON.stringify(list.slice(0, 50)));
    } catch {}
    setSubmitted(true);
  };

  return (
    <section
      id="contact"
      className="py-12 sm:py-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bengali Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5 mb-9 sm:mb-12">
          <div className="inline-flex items-center gap-2 text-[#0B5D3B] dark:text-emerald-300 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <Mail className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>যোগাযোগ ও অবস্থান</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {contactConfig?.title?.trim() || 'প্রশাসনিক অফিসের সাথে যোগাযোগ করুন'}
          </h2>
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="w-14 h-1.5 bg-[#0B5D3B] rounded-full" />
            <span className="w-3.5 h-1.5 bg-[#F4B400] rounded-full" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
            {contactConfig?.subtitle?.trim() ||
              'ভর্তি সংক্রান্ত জিজ্ঞাসা, পরীক্ষার ফলাফল, সনদপত্র বা প্রাতিষ্ঠানিক যেকোনো তথ্যের জন্য সরাসরি যোগাযোগ করুন অথবা নিচে বার্তা পাঠান।'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Synced Institutional Contact Cards */}
          <div className="lg:col-span-5 space-y-3.5">
            <div className="bg-[#F8FAFC] dark:bg-slate-800/70 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-700/80 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-[#0B5D3B] dark:text-emerald-400 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  ক্যাম্পাসের ঠিকানা
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {info.schoolName}, {info.address}
                </p>
                <span className="inline-block mt-1.5 text-[11px] font-bold text-[#0B5D3B] dark:text-emerald-400">
                  EIIN: {info.eiin} • কোড: {info.schoolCode}
                </span>
              </div>
            </div>

            <div className="bg-[#F8FAFC] dark:bg-slate-800/70 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-700/80 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  টেলিফোন ও মোবাইল হেল্পলাইন
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold">
                  <a href={cleanTelHref(info.phone1)} className="hover:text-[#0B5D3B] transition">
                    {info.phone1}
                  </a>
                  {info.phone2 && (
                    <>
                      <br />
                      <a href={cleanTelHref(info.phone2)} className="hover:text-[#0B5D3B] transition">
                        {info.phone2}
                      </a>
                    </>
                  )}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  অফিস চলাকালীন সময়ে সরাসরি কল করতে পারবেন।
                </p>
              </div>
            </div>

            <div className="bg-[#F8FAFC] dark:bg-slate-800/70 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-700/80 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  অফিশিয়াল ইমেইল
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold break-all">
                  <a href={`mailto:${info.email1}`} className="hover:text-[#0B5D3B] transition">
                    {info.email1}
                  </a>
                  {info.email2 && (
                    <>
                      <br />
                      <a href={`mailto:${info.email2}`} className="hover:text-[#0B5D3B] transition">
                        {info.email2}
                      </a>
                    </>
                  )}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  যেকোনো দাপ্তরিক যোগাযোগের জন্য ইমেইল করুন।
                </p>
              </div>
            </div>

            <div className="bg-[#F8FAFC] dark:bg-slate-800/70 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-700/80 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  অফিস ও পাঠদানের সময়সূচি
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold mt-1">
                  {info.officeHours}
                </p>
                <span className="inline-block mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  শুক্রবার ও সরকারি ছুটির দিন বন্ধ থাকে।
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Bengali Inquiry Form */}
          <div className="lg:col-span-7 bg-[#F8FAFC] dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mb-1.5">
              অনুসন্ধান বা মতামত পাঠান
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              নিচের ফর্মটি পূরণ করে আপনার প্রশ্ন বা মতামত পাঠান — আমাদের অফিস টিম দ্রুত যোগাযোগ করবে।
            </p>

            {submitted ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-7 text-center space-y-3 animate-fade-in">
                <CheckCircle2 className="w-12 h-12 text-[#0B5D3B] dark:text-emerald-400 mx-auto" />
                <h4 className="text-lg font-extrabold text-emerald-950 dark:text-emerald-100">
                  ধন্যবাদ! আপনার বার্তাটি সফলভাবে গৃহীত হয়েছে।
                </h4>
                <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
                  বিদ্যালয় অফিস টিম আপনার বার্তাটি পর্যালোচনা করে প্রদত্ত মোবাইল নম্বরে যোগাযোগ করবে।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setName('');
                    setPhone('');
                    setSubject('');
                    setMessage('');
                  }}
                  className="mt-2 px-5 py-2.5 text-xs font-bold text-white bg-[#0B5D3B] hover:bg-[#08492e] rounded-xl cursor-pointer transition"
                >
                  আরেকটি বার্তা পাঠান
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      আপনার পূর্ণ নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="যেমন: মোঃ করিম উদ্দিন"
                      className="w-full h-11 px-3.5 text-sm rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#0B5D3B] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      মোবাইল নম্বর <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="০১৮XXXXXXXX"
                      className="w-full h-11 px-3.5 text-sm rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#0B5D3B] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    অনুসন্ধানের বিষয়
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="যেমন: ভর্তি তথ্য, ট্রান্সফার সার্টিফিকেট, ফলাফল সংক্রান্ত..."
                    className="w-full h-11 px-3.5 text-sm rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#0B5D3B] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    আপনার বার্তা <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="আপনার জিজ্ঞাসা বা মতামত বিস্তারিত লিখুন..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#0B5D3B] resize-none transition"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#0B5D3B] hover:bg-[#08492e] shadow-md shadow-emerald-900/15 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>বার্তা পাঠান</span>
                </button>
              </form>
            )}

            {info.mapEmbedUrl && (
              <div className="mt-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-52">
                <iframe
                  src={info.mapEmbedUrl}
                  title="বিদ্যালয়ের অবস্থান ম্যাপ"
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
