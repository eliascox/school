'use client';

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 🛡️ SCHOOLPRO — PUBLIC CERTIFICATE & DOCUMENT VERIFICATION PORTAL
 * ─────────────────────────────────────────────────────────────────────────────
 * Accessible publicly by scanning QR Code or visiting:
 * /verify-certificate?id=CERT-2026-XXXXX or by entering Verification Code manually.
 * ═════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  School,
  Calendar,
  User,
  GraduationCap,
  FileText,
  Award,
  ArrowRight,
  ExternalLink,
  Printer,
  Sparkles,
  Building2,
  Lock,
  Clock
} from 'lucide-react';
import { certificateService, CertificateRecord } from '@/services/certificateService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import Link from 'next/link';

function VerificationContent() {
  const searchParams = useSearchParams();
  const certIdParam = searchParams.get('id') || searchParams.get('cert') || searchParams.get('code') || '';

  const [searchQuery, setSearchQuery] = useState(certIdParam);
  const [searchedId, setSearchedId] = useState(certIdParam);
  const [cert, setCert] = useState<CertificateRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(settingsService.getSettings());

  useEffect(() => {
    setSchoolSettings(settingsService.getSettings());
    if (certIdParam) {
      setSearchQuery(certIdParam);
      setSearchedId(certIdParam);
      const found = certificateService.getCertificateById(certIdParam);
      setCert(found);
      setHasSearched(true);
    }
  }, [certIdParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setSearchedId(query);
    const found = certificateService.getCertificateById(query);
    setCert(found);
    setHasSearched(true);
  };

  const getCertTypeName = (type: string) => {
    switch (type) {
      case 'ssc_testimonial': return 'এসএসসি প্রশংসাপত্র (Testimonial)';
      case 'character_certificate': return 'চারিত্রিক সনদ পত্র (Character Certificate)';
      case 'transfer_certificate': return 'ছাড়পত্র / টিসি (Transfer Certificate - TC)';
      case 'current_student': return 'অধ্যয়নরত প্রত্যয়ন পত্র (Bonafide/Study Certificate)';
      case 'appreciation': return 'কৃতিত্ব ও প্রশংসা সনদ (Appreciation Certificate)';
      case 'merit_certificate': return 'মেধা সনদ পত্র (Certificate of Merit)';
      case 'student_verification': return 'শিক্ষার্থী যাচাইকরণ প্রত্যয়ন (Verification Certificate)';
      case 'participation': return 'অংশগ্রহণ সনদ (Participation Certificate)';
      case 'activity_certificate': return 'সহশিক্ষা কার্যক্রম ও অভিজ্ঞতা সনদ';
      case 'custom_certificate': return 'বিশেষ কাস্টম প্রত্যয়ন পত্র';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* ── Top Header ────────────────────────────────────────── */}
      <header className="max-w-4xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-amber-400 p-0.5 shadow-xl">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <School className="text-amber-400" size={24} />
            </div>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
            </h1>
            <p className="text-xs text-indigo-300 font-medium">
              অফিশিয়াল ডিজিটাল সনদ যাচাইকরণ পোর্টাল (Official Verification Portal)
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/certificates"
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-white/10 shadow-sm"
        >
          <Building2 size={14} className="text-amber-300" /> অ্যাডমিন প্যানেল
        </Link>
      </header>

      {/* ── Main Content Area ─────────────────────────────────── */}
      <main className="max-w-3xl w-full mx-auto my-8 space-y-6">
        
        {/* Search Box Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 p-6 rounded-3xl shadow-2xl space-y-4">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <ShieldCheck size={14} /> সরকারি ও শিক্ষাপ্রতিষ্ঠান স্বীকৃতি যাচাই
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              সনদপত্র বা প্রত্যয়ন নম্বর দিয়ে যাচাই করুন
            </h2>
            <p className="text-xs text-slate-300">
              সনদের ওপর উল্লেখিত সার্টিফিকেট নং (যেমন: <span className="font-mono text-amber-300">CERT-2026-XXXXX</span>) অথবা স্মারক নং প্রবেশ করান।
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="সনদ নং লিখুন (যেমন: CERT-2026-10293)..."
                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/80 border border-white/20 rounded-2xl text-sm font-semibold text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              যাচাই করুন <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* ── RESULT CARD ─────────────────────────────────────── */}
        {hasSearched && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            {cert ? (
              cert.status === 'valid' ? (
                // 🟢 VALID CERTIFICATE
                <div className="bg-slate-900/90 backdrop-blur-xl border-2 border-emerald-500/50 rounded-3xl overflow-hidden shadow-2xl">
                  {/* Status Banner */}
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <CheckCircle2 size={24} className="text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                            VERIFIED OFFICIAL
                          </span>
                        </div>
                        <h3 className="text-lg font-black mt-0.5">সনদপত্রটি সম্পূর্ণ বৈধ ও নিবন্ধিত</h3>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
                      {cert.id}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 sm:p-8 space-y-6">
                    {/* Information Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-5 rounded-2xl border border-white/10">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">শিক্ষার্থীর নাম</span>
                        <span className="text-base font-black text-white">{cert.studentName}</span>
                        {cert.studentNameEn && <span className="text-xs text-indigo-300 block font-serif">{cert.studentNameEn}</span>}
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">প্রত্যয়নের ধরন (Type)</span>
                        <span className="text-sm font-bold text-amber-300">{getCertTypeName(cert.type)}</span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">শ্রেণি, শাখা ও বিভাগ</span>
                        <span className="text-xs font-bold text-slate-200">
                          শ্রেণি: {cert.grade} | শাখা: {cert.section} | বিভাগ: {cert.group}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">রোল ও শিক্ষাবর্ষ</span>
                        <span className="text-xs font-bold text-slate-200">
                          রোল: {cert.roll} | সেশন: {cert.session}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">পিতা ও মাতার নাম</span>
                        <span className="text-xs text-slate-300 block">পিতা: {cert.fatherName}</span>
                        <span className="text-xs text-slate-300 block">মাতা: {cert.motherName}</span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">স্মারক নং ও ইস্যুর তারিখ</span>
                        <span className="text-xs font-mono text-indigo-300 block">স্মারক: {cert.refNo}</span>
                        <span className="text-xs text-slate-300 block">ইস্যু তারিখ: {cert.issueDate}</span>
                      </div>

                      {cert.boardRoll && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">বোর্ড পরীক্ষার তথ্য</span>
                          <span className="text-xs text-slate-300 block">রোল: {cert.boardRoll} | রেজি: {cert.boardReg}</span>
                          <span className="text-xs text-amber-400 font-bold block">GPA: {cert.gpa} ({cert.passingYear})</span>
                        </div>
                      )}

                      {cert.achievementTitle && (
                        <div className="sm:col-span-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">কৃতিত্ব / বিশেষ ভূমিকা</span>
                          <span className="text-xs text-emerald-400 font-semibold">{cert.achievementTitle}</span>
                        </div>
                      )}
                    </div>

                    {/* School Authority Seal Badge */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                          <ShieldCheck size={22} />
                        </div>
                        <div className="text-xs">
                          <p className="font-bold text-white">ইস্যুকারী প্রতিষ্ঠান: {schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}</p>
                          <p className="text-slate-400">EIIN: {schoolSettings.eiin || '106184'} | প্রধান শিক্ষক: {schoolSettings.principalName || 'মোহাম্মদ রফিকুল ইসলাম'}</p>
                        </div>
                      </div>

                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-black text-xs rounded-xl border border-emerald-400/40 flex items-center gap-1.5 shrink-0">
                        <CheckCircle2 size={14} /> সরকারি নিয়মানুযায়ী বৈধ
                      </span>
                    </div>

                    {/* Audit Trail Note */}
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 border-t border-white/10 pt-4">
                      <Clock size={13} className="text-slate-500" />
                      <span>তৈরির তারিখ ও সময়: {cert.createdDate}</span>
                      <span className="text-slate-600">|</span>
                      <span>ভেরিফিকেশন কোড: <strong className="font-mono text-slate-300">{cert.verificationCode}</strong></span>
                    </div>
                  </div>
                </div>
              ) : (
                // 🔴 CANCELLED CERTIFICATE
                <div className="bg-slate-900/90 backdrop-blur-xl border-2 border-rose-500/50 rounded-3xl overflow-hidden shadow-2xl">
                  {/* Status Banner */}
                  <div className="bg-gradient-to-r from-rose-600 to-red-700 px-6 py-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <XCircle size={24} className="text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                            CANCELLED / REVOKED
                          </span>
                        </div>
                        <h3 className="text-lg font-black mt-0.5">সনদপত্রটি কর্তৃপক্ষ কর্তৃক বাতিল করা হয়েছে</h3>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
                      {cert.id}
                    </span>
                  </div>

                  <div className="p-6 sm:p-8 space-y-5">
                    <div className="bg-rose-950/40 border border-rose-500/40 p-5 rounded-2xl space-y-2 text-rose-200">
                      <p className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle size={15} /> সতর্কবার্তা ও বাতিলকরণের তথ্য
                      </p>
                      <p className="text-sm font-semibold">
                        বাতিলকরণের কারণ: <strong className="text-white">{cert.cancellationReason || 'প্রযোজ্য নয়'}</strong>
                      </p>
                      <p className="text-xs text-rose-300">
                        বাতিল করার সময়: {cert.cancelledAt || 'অজানা'} | বাতিলের নির্দেশক: {cert.cancelledBy || 'প্রধান শিক্ষক'}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/10 text-xs space-y-1.5 text-slate-300">
                      <p><strong>শিক্ষার্থীর নাম:</strong> {cert.studentName}</p>
                      <p><strong>সনদের ধরন:</strong> {getCertTypeName(cert.type)}</p>
                      <p><strong>মূল ইস্যুর তারিখ:</strong> {cert.issueDate}</p>
                      <p className="text-slate-400 text-[11px] pt-1 border-t border-white/10">
                        এই সনদটি আর কোনো দাপ্তরিক বা শিক্ষাগত কাজে গ্রহণযোগ্য নয়। প্রয়োজনে সরাসরি বিদ্যালয় অফিসে যোগাযোগ করুন।
                      </p>
                    </div>
                  </div>
                </div>
              )
            ) : (
              // ⚠️ NOT FOUND
              <div className="bg-slate-900/90 backdrop-blur-xl border border-amber-500/40 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                  <AlertTriangle size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">কোনো সনদপত্র পাওয়া যায়নি</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    প্রদত্ত আইডি <strong className="font-mono text-amber-300">&quot;{searchedId}&quot;</strong> দিয়ে কোনো সনদ পাওয়া যায়নি। অনুগ্রহ করে সার্টিফিকেট নম্বর সঠিকভাবে প্রবেশ করিয়েছেন কিনা নিশ্চিত হোন।
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setHasSearched(false);
                    }}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs transition border border-white/10 cursor-pointer"
                  >
                    পুনরায় অনুসন্ধান করুন
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="max-w-4xl w-full mx-auto pt-6 border-t border-white/10 text-center text-xs text-slate-400 space-y-1">
        <p>© {new Date().getFullYear()} {schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'} — সর্বস্বত্ব সংরক্ষিত।</p>
        <p className="text-[11px] text-slate-500">
          ডিজিটাল সার্টিফিকেট ভেরিফিকেশন সিস্টেম | চালিত SchoolPro
        </p>
      </footer>
    </div>
  );
}

export default function CertificateVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-sans text-sm">
          যাচাইকরণ পোর্টাল লোড হচ্ছে...
        </div>
      }
    >
      <VerificationContent />
    </Suspense>
  );
}
