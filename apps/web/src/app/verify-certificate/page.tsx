'use client';

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 🛡️ SCHOOLPRO — PUBLIC CERTIFICATE & DOCUMENT VERIFICATION PORTAL
 * ─────────────────────────────────────────────────────────────────────────────
 * Accessible publicly by scanning QR Code or visiting:
 * /verify-certificate?id=CERT-2026-XXXXX or by entering Verification Code manually.
 * Also supports digital fee receipt verification (REC-*, BKS-*, NGD-*, SSL-*, TRX-*).
 * ═════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  GraduationCap,
  FileText,
  Award,
  ArrowRight,
  Printer,
  Download,
  Lock,
  Clock,
  Home,
  User,
  Copy,
  Check,
  RotateCcw,
  QrCode,
  Cloud,
  RefreshCw,
  Receipt,
  FileBadge2,
  Phone,
  Mail,
  UserPlus,
  ShieldAlert,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { certificateService, CertificateRecord } from '@/services/certificateService';
import { paymentGatewayService } from '@/services/paymentGatewayService';
import { PaymentRecord } from '@/components/finance/financeShared';
import {
  settingsService,
  SchoolSettings,
  getEnglishSchoolName as resolveEnglishSchoolName,
  getEnglishAddress as resolveEnglishAddress,
} from '@/services/settingsService';
import { firebaseSyncService } from '@/services/firebaseSyncService';
import { triggerProfessionalPrint } from '@/lib/printPdfUtils';
import {
  PortalLang,
  formatPortalNumber,
  formatPortalClassName,
  formatPortalGroupName,
} from '@/lib/resultPortalUtils';
import {
  extractVerificationCode,
  isReceiptCode,
  getCertificateTypeLabel,
  buildVerificationShareUrl,
} from '@/lib/certificateVerifyUtils';

type VerificationSource = 'cloud' | 'registry' | 'qr_payload' | null;

const VERIFY_A4_PRINT_STYLES = `
  @media print {
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    html, body {
      background: #ffffff !important;
      color: #0f172a !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`;

function VerificationContent() {
  const searchParams = useSearchParams();
  const certIdParam =
    searchParams.get('id') ||
    searchParams.get('ref') ||
    searchParams.get('cert') ||
    searchParams.get('code') ||
    '';
  const typeParam = searchParams.get('type') || '';

  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<PortalLang>('bn');
  const [searchQuery, setSearchQuery] = useState(certIdParam);
  const [searchedId, setSearchedId] = useState(certIdParam);
  const [cert, setCert] = useState<CertificateRecord | null>(null);
  const [receipt, setReceipt] = useState<PaymentRecord | null>(null);
  const [verificationSource, setVerificationSource] = useState<VerificationSource>(null);
  const [verifiedAt, setVerifiedAt] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isVerifyingCloud, setIsVerifyingCloud] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [pdfHelpToast, setPdfHelpToast] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(settingsService.getSettings());

  const isBn = lang === 'bn';

  // Build fallback certificate from signed/encoded QR query parameters if present
  const buildQrParamFallbackCert = useCallback(
    (queryId: string): CertificateRecord | null => {
      const qName = searchParams.get('n') || searchParams.get('name') || '';
      const qRoll = searchParams.get('r') || searchParams.get('roll') || '';
      const qReg = searchParams.get('reg') || '';
      const qGpa = searchParams.get('g') || searchParams.get('gpa') || '';
      const qYear = searchParams.get('y') || searchParams.get('year') || '';
      const qFather = searchParams.get('f') || searchParams.get('father') || '';
      const qMother = searchParams.get('m') || searchParams.get('mother') || '';
      const qGroup = searchParams.get('grp') || searchParams.get('group') || 'Science';
      const qSession = searchParams.get('s') || searchParams.get('session') || '2024-2025';
      const qDate =
        searchParams.get('d') || searchParams.get('date') || new Date().toISOString().split('T')[0];

      if (!queryId || (!qName && !qRoll)) return null;

      return {
        id: queryId,
        verificationCode: queryId,
        type: 'ssc_testimonial',
        title: 'TESTIMONIAL',
        refNo: queryId,
        issueDate: qDate,
        status: 'valid',
        studentId: qRoll || 'SSC-CANDIDATE',
        studentName: qName || 'SSC Examinee',
        fatherName: qFather || '—',
        motherName: qMother || '—',
        roll: qRoll || '—',
        grade: '10th (SSC)',
        section: 'A',
        group: qGroup,
        session: qSession,
        dob: '',
        boardRoll: qRoll,
        boardReg: qReg,
        passingYear: qYear || String(new Date().getFullYear()),
        gpa: qGpa || '5.00',
        createdDate: qDate,
      };
    },
    [searchParams]
  );

  const stampNow = () => {
    try {
      return new Date().toLocaleString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return new Date().toISOString().slice(0, 16).replace('T', ' ');
    }
  };

  const performVerification = useCallback(
    async (rawQuery: string) => {
      const cleanQuery = extractVerificationCode(rawQuery);
      if (!cleanQuery) return;

      setSearchQuery(cleanQuery);
      setSearchedId(cleanQuery);
      setReceipt(null);
      setCert(null);
      setVerificationSource(null);
      setHasSearched(true);
      setVerifiedAt(stampNow());

      if (isReceiptCode(cleanQuery, typeParam)) {
        const foundReceipt = paymentGatewayService.findReceiptById(cleanQuery);
        if (foundReceipt) {
          setReceipt(foundReceipt);
          setCert(null);
          setVerificationSource('registry');
          setIsVerifyingCloud(false);
          return;
        }
      }

      // 1. Check local storage first for instant feedback
      const localFound = certificateService.getCertificateById(cleanQuery);
      const qrFallback = buildQrParamFallbackCert(cleanQuery);
      if (localFound) {
        setCert(localFound);
        setVerificationSource('registry');
      } else if (qrFallback) {
        setCert(qrFallback);
        setVerificationSource('qr_payload');
      }

      // 2. Always verify / fetch latest status from Google Cloud Firestore (for mobile QR scans & revocation status)
      setIsVerifyingCloud(true);
      try {
        const cloudCert = await firebaseSyncService.fetchCertificateFromCloudById(cleanQuery);
        if (cloudCert) {
          setCert(cloudCert as CertificateRecord);
          setVerificationSource('cloud');
        } else if (!localFound && !qrFallback) {
          const foundRec = paymentGatewayService.findReceiptById(cleanQuery);
          if (foundRec) {
            setReceipt(foundRec);
            setCert(null);
            setVerificationSource('registry');
          } else {
            setCert(null);
            setVerificationSource(null);
          }
        }
      } catch {
        if (!localFound && !qrFallback) {
          setCert(null);
          setVerificationSource(null);
        }
      } finally {
        setIsVerifyingCloud(false);
        setVerifiedAt(stampNow());
      }
    },
    [buildQrParamFallbackCert, typeParam]
  );

  useEffect(() => {
    setMounted(true);
    setSchoolSettings(settingsService.getSettings());
    const unsub = settingsService.subscribe((next) => setSchoolSettings(next));

    // Sync school settings from cloud for external/mobile QR visitors
    firebaseSyncService
      .fetchLandingPageCloudData()
      .then((data) => {
        if (data.settings) setSchoolSettings(data.settings);
      })
      .catch(() => {});

    if (certIdParam) {
      setSearchQuery(certIdParam);
      void performVerification(certIdParam);
    }

    return () => unsub();
  }, [certIdParam, performVerification]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performVerification(searchQuery);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSearchedId('');
    setCert(null);
    setReceipt(null);
    setVerificationSource(null);
    setHasSearched(false);
    setIsVerifyingCloud(false);
  };

  const handlePrintStatement = () => {
    const docId = receipt?.receiptId || cert?.id || searchedId;
    const holder = receipt?.studentName || cert?.studentName;
    triggerProfessionalPrint([
      schoolSettings?.schoolName || 'SchoolPro',
      'Verification_Statement',
      docId,
      holder,
    ]);
  };

  const handleDownloadPdf = () => {
    setPdfHelpToast(true);
    setTimeout(() => {
      handlePrintStatement();
    }, 260);
    setTimeout(() => {
      setPdfHelpToast(false);
    }, 6000);
  };

  const handleCopyShareLink = async () => {
    if (typeof window === 'undefined') return;
    const docId = receipt?.receiptId || cert?.id || searchedId;
    if (!docId) return;
    const shareUrl = buildVerificationShareUrl(window.location.origin, docId, Boolean(receipt));
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0B5D3B] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
            সনদ যাচাইকরণ পোর্টাল লোড হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  const schoolDisplayName = isBn
    ? schoolSettings?.schoolName || resolveEnglishSchoolName(schoolSettings)
    : resolveEnglishSchoolName(schoolSettings);
  const schoolDisplayAddress = isBn
    ? schoolSettings?.address || resolveEnglishAddress(schoolSettings)
    : resolveEnglishAddress(schoolSettings);
  const currentYear = new Date().getFullYear();

  const sourceBadgeText =
    verificationSource === 'cloud'
      ? isBn
        ? 'লাইভ ক্লাউড রেজিস্ট্রি যাচাইকৃত'
        : 'Live Cloud Registry Verified'
      : verificationSource === 'qr_payload'
      ? isBn
        ? 'ডিজিটাল QR পেলোড যাচাইকৃত'
        : 'Signed QR Record Verified'
      : isBn
      ? 'প্রাতিষ্ঠানিক রেজিস্ট্রি যাচাইকৃত'
      : 'Institutional Registry Verified';

  const hasVerifiedResult = Boolean(receipt || cert);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-emerald-600 selection:text-white print:bg-white print:text-black print:min-h-0 print:block print:p-0 print:m-0">
      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 🏛️ INSTITUTIONAL TOP ACCENT & NAVIGATION HEADER (print:hidden) */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="h-1 bg-gradient-to-r from-[#064e3b] via-[#0B5D3B] to-teal-500 print:hidden" />

      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-2xs print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          {/* Left: Official School Crest & Identity */}
          <Link
            href="/"
            className="flex items-center gap-3 min-w-0 group"
            title={isBn ? 'মূল ওয়েবসাইটে ফিরে যান' : 'Back to School Home'}
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0B5D3B] to-emerald-600 p-0.5 shadow-md shadow-emerald-900/15 group-hover:scale-[1.03] transition-transform shrink-0">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center overflow-hidden p-1">
                {schoolSettings?.schoolLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={schoolSettings.schoolLogo}
                    alt={schoolDisplayName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <GraduationCap className="w-6 h-6 text-[#0B5D3B] dark:text-emerald-400" />
                )}
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition-colors">
                {schoolDisplayName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span className="truncate max-w-[200px] sm:max-w-xs">{schoolDisplayAddress}</span>
                {schoolSettings?.eiin && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                      EIIN: {formatPortalNumber(schoolSettings.eiin, lang)}
                    </span>
                  </>
                )}
                {schoolSettings?.estdYear && (
                  <span className="hidden md:inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    {isBn ? 'স্থাপিত:' : 'ESTD:'} {formatPortalNumber(schoolSettings.estdYear, lang)}
                  </span>
                )}
              </div>
            </div>
          </Link>

          {/* Right: Language Switcher & Compact Portal Links */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700"
              role="group"
              aria-label="Language Switcher"
            >
              <button
                type="button"
                onClick={() => setLang('bn')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  isBn
                    ? 'bg-[#0B5D3B] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  !isBn
                    ? 'bg-[#0B5D3B] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
            >
              <Home className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
              <span>{isBn ? 'হোম' : 'Home'}</span>
            </Link>

            <Link
              href="/result"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
            >
              <Award className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{isBn ? 'ফলাফল' : 'Results'}</span>
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg bg-[#0B5D3B] hover:bg-emerald-800 text-white shadow-sm shadow-emerald-900/20 transition active:scale-[0.98]"
            >
              <User className="w-3.5 h-3.5" />
              <span>{isBn ? 'লগইন' : 'Login'}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 🛡️ INSTITUTIONAL EMERALD HERO BANNER (print:hidden)          */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-[#053b26] via-[#0B5D3B] to-[#0f172a] text-white pt-8 pb-20 sm:pt-10 sm:pb-24 overflow-hidden print:hidden">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        <div className="absolute -top-24 right-0 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-0 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-white/10 border border-white/20 text-emerald-100 backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>
                {isBn
                  ? 'অফিশিয়াল ডিজিটাল সনদ ও নথি যাচাইকরণ রেজিস্ট্রি'
                  : 'OFFICIAL DOCUMENT AUTHENTICITY REGISTRY'}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-black/20 border border-white/15 text-emerald-100/90 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Cloud className="w-3 h-3 text-emerald-300" />
              <span>{isBn ? 'লাইভ ক্লাউড ভেরিফিকেশন সক্রিয়' : 'Live Cloud Verification Active'}</span>
            </span>
          </div>

          <div className="space-y-2 max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              {isBn
                ? 'সনদপত্র, প্রশংসাপত্র ও মানি রিসিপ্ট অনলাইন যাচাই'
                : 'Verify Certificates, Testimonials & Digital Receipts'}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/85 font-medium leading-relaxed max-w-2xl mx-auto">
              {isBn
                ? 'প্রতিষ্ঠান কর্তৃক ইস্যুকৃত যেকোনো সনদের আইডি, স্মারক নম্বর, মানি রিসিপ্ট নম্বর অথবা QR কোডের লিঙ্ক প্রবেশ করিয়ে তাৎক্ষণিক বৈধতা যাচাই করুন।'
                : 'Enter a certificate ID, reference number, payment receipt ID, or paste a QR link to verify authenticity against the institutional registry.'}
            </p>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 🔍 MAIN VERIFICATION WORKSPACE                                */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-14 pb-12 space-y-7 relative z-20 print:p-0 print:m-0 print:mt-0 print:pb-0 print:space-y-0 print:max-w-none print:w-full print:block">
        {/* ─── ELEVATED VERIFICATION CONSOLE CARD (print:hidden) ─── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/8 dark:shadow-black/50 overflow-hidden print:hidden">
          <div className="px-5 py-3 bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
              <QrCode className="w-4 h-4 text-[#0B5D3B] dark:text-emerald-400" />
              <span>
                {isBn
                  ? 'ভেরিফিকেশন কোড, স্মারক নং বা QR লিঙ্ক লিখুন'
                  : 'Enter Verification Code, Ref No., Receipt ID, or QR Link'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                CERT-2026-XXXXX
              </span>
              <span className="hidden sm:inline px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                REC-XXXXX
              </span>
            </div>
          </div>

          <form onSubmit={handleSearch} className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isBn
                      ? 'উদাহরণ: CERT-2026-10293 অথবা REC-2026-0041 অথবা QR লিঙ্ক পেস্ট করুন...'
                      : 'e.g. CERT-2026-10293, REC-2026-0041, or paste verification URL...'
                  }
                  className="w-full h-12 pl-10 pr-9 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-mono text-slate-900 dark:text-white placeholder:font-sans placeholder:font-medium placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-600/20 focus:border-[#0B5D3B] outline-none transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs p-1 rounded cursor-pointer"
                    aria-label={isBn ? 'মুছুন' : 'Clear'}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="submit"
                  disabled={isVerifyingCloud}
                  className="flex-1 sm:flex-none h-12 px-6 rounded-xl bg-[#0B5D3B] hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 whitespace-nowrap"
                >
                  {isVerifyingCloud ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isBn ? 'যাচাই চলছে...' : 'Verifying...'}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isBn ? 'যাচাই করুন' : 'Verify Document'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {hasSearched && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="h-12 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    title={isBn ? 'নতুন কোড যাচাই' : 'Reset'}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden md:inline">{isBn ? 'রিসেট' : 'Reset'}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* ─── LIVE CLOUD VERIFICATION LOADING STATE (No premature Not Found flash!) ─── */}
        {isVerifyingCloud && !hasVerifiedResult && (
          <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-8 text-center space-y-3 shadow-md print:hidden">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-[#0B5D3B] dark:text-emerald-400">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {isBn ? 'ক্লাউড রেজিস্ট্রির সাথে সনদ যাচাই করা হচ্ছে...' : 'Verifying Against Cloud Registry...'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {searchedId}
            </p>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* 📄 VERIFICATION RESULT DOSSIER (Printable A4 Official Statement) */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {hasSearched && (!isVerifyingCloud || hasVerifiedResult) && (
          <div className="space-y-4 print:space-y-0">
            {/* Action Command Bar (Only shown when a Certificate or Receipt record exists; hidden on print) */}
            {hasVerifiedResult && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs print:hidden">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  {isVerifyingCloud ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0B5D3B]" />
                      <span>{isBn ? 'ক্লাউড স্ট্যাটাস নিশ্চিত করা হচ্ছে...' : 'Confirming latest cloud status...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{sourceBadgeText}</span>
                      {verifiedAt && (
                        <span className="hidden sm:inline text-slate-400 font-normal">
                          • {verifiedAt}
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="px-3.5 py-2 rounded-xl bg-[#0B5D3B] hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isBn ? 'PDF রিপোর্ট' : 'Save PDF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintStatement}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                    <span>{isBn ? 'প্রিন্ট (A4)' : 'Print'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 dark:text-emerald-400">
                          {isBn ? 'কপি হয়েছে' : 'Copied'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isBn ? 'লিঙ্ক কপি' : 'Copy Link'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* PDF Help Tip Toast */}
            {pdfHelpToast && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-700/60 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2 print:hidden">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {isBn ? (
                    <>
                      টিপস: প্রিন্ট ডায়ালগে Destination হিসেবে <strong>&ldquo;Save as PDF&rdquo;</strong> নির্বাচন
                      করলে অফিশিয়াল যাচাইকরণ বিবরণী A4 PDF হিসেবে সেভ হবে।
                    </>
                  ) : (
                    <>
                      Tip: Choose <strong>&ldquo;Save as PDF&rdquo;</strong> in the print dialog to download the
                      Official Verification Statement as A4 PDF.
                    </>
                  )}
                </span>
              </div>
            )}

            {/* Print-Only Official Institutional Letterhead (Shown ONLY in A4 Print / PDF) */}
            {hasVerifiedResult && (
              <div className="hidden print:flex items-center justify-between border-b-2 border-[#0B5D3B] pb-4 mb-5">
                <div className="flex items-center gap-3">
                  {schoolSettings?.schoolLogo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={schoolSettings.schoolLogo}
                      alt={schoolDisplayName}
                      className="w-14 h-14 object-contain"
                    />
                  )}
                  <div>
                    <h1 className="text-xl font-black text-slate-900">{schoolDisplayName}</h1>
                    <p className="text-xs text-slate-600">
                      {schoolDisplayAddress}
                      {schoolSettings?.eiin ? ` • EIIN: ${schoolSettings.eiin}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#0B5D3B]">
                    OFFICIAL VERIFICATION STATEMENT
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Checked: {verifiedAt}</p>
                </div>
              </div>
            )}

            {/* ── CASE 1: VERIFIED DIGITAL PAYMENT RECEIPT ── */}
            {receipt ? (
              <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-600/50 rounded-2xl overflow-hidden shadow-lg print:shadow-none print:border print:border-slate-300">
                <div className="bg-gradient-to-r from-[#064e3b] via-[#0B5D3B] to-teal-700 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-emerald-200" />
                    </div>
                    <div>
                      <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                        {isBn ? 'বৈধ ডিজিটাল মানি রিসিপ্ট' : 'VERIFIED DIGITAL RECEIPT'}
                      </span>
                      <h3 className="text-lg sm:text-xl font-black mt-1">
                        {isBn
                          ? 'ফি জমার ডিজিটাল রসিদটি বৈধ ও নিবন্ধিত'
                          : 'Official Fee Payment Receipt Verified'}
                      </h3>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-200 block">
                      {isBn ? 'রসিদ নম্বর' : 'Receipt ID'}
                    </span>
                    <span className="font-mono text-sm font-black bg-black/25 px-3 py-1 rounded-lg border border-white/15 inline-block mt-0.5">
                      {receipt.receiptId}
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Highlight Payment Summary Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/35 border border-emerald-200/80 dark:border-emerald-800/60">
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">
                        {isBn ? 'মোট পরিশোধিত অর্থ' : 'Amount Paid'}
                      </span>
                      <span className="text-2xl font-black font-mono text-emerald-900 dark:text-emerald-200 mt-0.5 block">
                        ৳{formatPortalNumber(receipt.paidAmount, lang)}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                        {isBn ? 'অবশিষ্ট বকেয়া' : 'Remaining Due'}
                      </span>
                      <span className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                        ৳{formatPortalNumber(receipt.dueRemaining ?? 0, lang)}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                        {isBn ? 'জমার তারিখ' : 'Payment Date'}
                      </span>
                      <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white mt-1 block">
                        {formatPortalNumber(receipt.date, lang)}
                      </span>
                    </div>
                  </div>

                  {/* Detailed Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 dark:bg-slate-950/50 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                        {isBn ? 'শিক্ষার্থীর নাম' : 'Student Name'}
                      </span>
                      <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">
                        {receipt.studentName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                        {isBn ? 'শ্রেণি, শাখা ও রোল' : 'Class, Section & Roll'}
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {formatPortalClassName(receipt.grade, lang)} ({receipt.section}) •{' '}
                        {isBn ? 'রোল' : 'Roll'} #{formatPortalNumber(receipt.roll, lang)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                        {isBn ? 'পরিশোধের মাধ্যম ও TrxID' : 'Payment Method & TrxID'}
                      </span>
                      <span className="text-sm font-bold text-[#0B5D3B] dark:text-emerald-400 mt-0.5 block font-mono">
                        {receipt.paymentMethod} {receipt.trxId ? `(${receipt.trxId})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                        {isBn ? 'আদায়কারী কর্মকর্তা' : 'Collected By'}
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {receipt.collectedBy || (isBn ? 'বিদ্যালয় হিসাব শাখা' : 'School Accounts Desk')}
                      </span>
                    </div>
                  </div>

                  {/* Authority Seal Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-800/60">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-[#0B5D3B] dark:text-emerald-300 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="text-xs">
                        <p className="font-extrabold text-slate-900 dark:text-white">
                          {schoolDisplayName}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                          EIIN: {formatPortalNumber(schoolSettings.eiin || '---', lang)} •{' '}
                          {isBn ? 'অফিশিয়াল হিসাব শাখা কর্তৃক নিবন্ধিত' : 'Registered by Official Accounts'}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-black self-start sm:self-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isBn ? 'যাচাইকৃত ও বৈধ' : 'Verified Valid'}
                    </span>
                  </div>
                </div>
              </div>
            ) : cert ? (
              cert.status === 'valid' ? (
                /* ── CASE 2: VALID OFFICIAL CERTIFICATE ── */
                <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-600/50 rounded-2xl overflow-hidden shadow-lg print:shadow-none print:border print:border-slate-300">
                  {/* Verified Institutional Banner */}
                  <div className="bg-gradient-to-r from-[#064e3b] via-[#0B5D3B] to-teal-700 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-emerald-200" />
                      </div>
                      <div>
                        <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                          {isBn ? 'অফিশিয়াল যাচাইকৃত সনদ' : 'VERIFIED OFFICIAL CERTIFICATE'}
                        </span>
                        <h3 className="text-lg sm:text-xl font-black mt-1">
                          {isBn
                            ? 'সনদপত্রটি সম্পূর্ণ বৈধ ও নিবন্ধিত'
                            : 'This Certificate is Authentic & Valid'}
                        </h3>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase tracking-wider text-emerald-200 block">
                        {isBn ? 'সনদ আইডি' : 'Certificate ID'}
                      </span>
                      <span className="font-mono text-sm font-black bg-black/25 px-3 py-1 rounded-lg border border-white/15 inline-block mt-0.5">
                        {cert.id}
                      </span>
                    </div>
                  </div>

                  {/* Verified Dossier Body */}
                  <div className="p-6 sm:p-8 space-y-6">
                    {/* Top Highlight: Student & Certificate Type */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          {isBn ? 'সনদধারী শিক্ষার্থী' : 'Certificate Holder'}
                        </span>
                        <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                          {cert.studentName}
                        </h4>
                        {cert.studentNameEn && (
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {cert.studentNameEn}
                          </p>
                        )}
                      </div>

                      <div className="sm:text-right space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          {isBn ? 'সনদের ধরন' : 'Document Type'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#0B5D3B] dark:text-emerald-300 text-xs font-extrabold">
                          <FileBadge2 className="w-3.5 h-3.5" />
                          {getCertificateTypeLabel(cert.type, lang)}
                        </span>
                      </div>
                    </div>

                    {/* Structured Verified Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/80 dark:bg-slate-950/50 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                          {isBn ? 'পিতা ও মাতার নাম' : 'Parents Information'}
                        </span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {isBn ? 'পিতা:' : 'Father:'} {cert.fatherName || '—'}
                        </p>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {isBn ? 'মাতা:' : 'Mother:'} {cert.motherName || '—'}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                          {isBn ? 'শ্রেণি, শাখা ও বিভাগ' : 'Class, Section & Group'}
                        </span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {formatPortalClassName(cert.grade, lang)} •{' '}
                          {isBn ? `শাখা ${cert.section}` : `Section ${cert.section}`}
                        </p>
                        <p className="font-semibold text-slate-600 dark:text-slate-300">
                          {isBn ? 'বিভাগ:' : 'Group:'} {formatPortalGroupName(cert.group, lang)}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                          {isBn ? 'রোল ও শিক্ষাবর্ষ' : 'Roll & Academic Session'}
                        </span>
                        <p className="font-bold font-mono text-slate-800 dark:text-slate-200">
                          {isBn ? 'রোল:' : 'Roll:'} {formatPortalNumber(cert.roll || '—', lang)}
                        </p>
                        <p className="font-semibold font-mono text-slate-600 dark:text-slate-300">
                          {isBn ? 'সেশন:' : 'Session:'} {formatPortalNumber(cert.session || '—', lang)}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                          {isBn ? 'স্মারক নম্বর (Ref No.)' : 'Reference Number'}
                        </span>
                        <p className="font-bold font-mono text-[#0B5D3B] dark:text-emerald-400">
                          {cert.refNo || cert.id}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                          {isBn ? 'ইস্যুর তারিখ' : 'Date of Issue'}
                        </span>
                        <p className="font-bold font-mono text-slate-800 dark:text-slate-200">
                          {formatPortalNumber(cert.issueDate || '—', lang)}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                          {isBn ? 'ভেরিফিকেশন কোড' : 'Verification Code'}
                        </span>
                        <p className="font-bold font-mono text-slate-800 dark:text-slate-200">
                          {cert.verificationCode || cert.id}
                        </p>
                      </div>

                      {cert.boardRoll && (
                        <div className="sm:col-span-2 lg:col-span-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-x-6 gap-y-2">
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                              {isBn ? 'বোর্ড রোল' : 'Board Roll'}
                            </span>
                            <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                              {formatPortalNumber(cert.boardRoll, lang)}
                            </span>
                          </div>
                          {cert.boardReg && (
                            <div>
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                                {isBn ? 'রেজিস্ট্রেশন নং' : 'Registration No.'}
                              </span>
                              <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                                {formatPortalNumber(cert.boardReg, lang)}
                              </span>
                            </div>
                          )}
                          {cert.passingYear && (
                            <div>
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                                {isBn ? 'পাসের সাল' : 'Passing Year'}
                              </span>
                              <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                                {formatPortalNumber(cert.passingYear, lang)}
                              </span>
                            </div>
                          )}
                          {cert.gpa && (
                            <div>
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                                {isBn ? 'অর্জিত জিপিএ' : 'Achieved GPA'}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-mono font-black">
                                GPA {formatPortalNumber(cert.gpa, lang)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {cert.achievementTitle && (
                        <div className="sm:col-span-2 lg:col-span-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                            {isBn ? 'কৃতিত্ব / বিশেষ সম্মাননা' : 'Achievement / Citation'}
                          </span>
                          <p className="text-sm font-bold text-[#0B5D3B] dark:text-emerald-400">
                            {cert.achievementTitle}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Issuing Authority Verification Seal Box */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50/75 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-800/60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-[#0B5D3B] dark:text-emerald-300 shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="text-xs space-y-0.5">
                          <p className="font-extrabold text-slate-900 dark:text-white">
                            {isBn ? 'ইস্যুকারী প্রতিষ্ঠান:' : 'Issuing Institution:'} {schoolDisplayName}
                          </p>
                          <p className="text-slate-600 dark:text-slate-400">
                            {schoolSettings.eiin
                              ? `EIIN: ${formatPortalNumber(schoolSettings.eiin, lang)}`
                              : ''}
                            {schoolSettings.eiin && schoolSettings.principalName ? ' • ' : ''}
                            {schoolSettings.principalName
                              ? `${isBn ? schoolSettings.principalTitle || 'প্রধান শিক্ষক' : 'Head Teacher'}: ${schoolSettings.principalName}`
                              : ''}
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-black text-xs border border-emerald-300 dark:border-emerald-700 shrink-0 self-start sm:self-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isBn ? 'প্রাতিষ্ঠানিকভাবে বৈধ' : 'Authentic Record'}
                      </span>
                    </div>

                    {/* Audit Trail Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {isBn ? 'নিবন্ধনের তারিখ:' : 'Recorded:'}{' '}
                          {formatPortalNumber(cert.createdDate || cert.issueDate, lang)}
                        </span>
                      </div>
                      <span className="font-mono text-slate-600 dark:text-slate-300">
                        {sourceBadgeText}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── CASE 3: REVOKED / CANCELLED CERTIFICATE ── */
                <div className="bg-white dark:bg-slate-900 border-2 border-rose-500/50 rounded-2xl overflow-hidden shadow-lg print:shadow-none print:border print:border-rose-400">
                  <div className="bg-gradient-to-r from-rose-700 to-red-800 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                        <XCircle className="w-6 h-6 text-rose-100" />
                      </div>
                      <div>
                        <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                          {isBn ? 'বাতিলকৃত সনদপত্র' : 'REVOKED / CANCELLED'}
                        </span>
                        <h3 className="text-lg sm:text-xl font-black mt-1">
                          {isBn
                            ? 'সনদপত্রটি কর্তৃপক্ষ কর্তৃক বাতিল করা হয়েছে'
                            : 'This Certificate Has Been Revoked'}
                        </h3>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-black bg-black/25 px-3 py-1 rounded-lg border border-white/15 self-start sm:self-center">
                      {cert.id}
                    </span>
                  </div>

                  <div className="p-6 sm:p-8 space-y-5">
                    <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-5 rounded-xl space-y-2 text-rose-950 dark:text-rose-200">
                      <p className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" />
                        {isBn ? 'বাতিলকরণের বিবরণ ও সতর্কবার্তা' : 'Revocation Notice & Reason'}
                      </p>
                      <p className="text-sm font-bold">
                        {isBn ? 'বাতিলকরণের কারণ:' : 'Reason:'}{' '}
                        <span className="text-rose-900 dark:text-white">
                          {cert.cancellationReason || (isBn ? 'প্রাতিষ্ঠানিক নির্দেশে বাতিল' : 'Revoked by authority')}
                        </span>
                      </p>
                      <p className="text-xs text-rose-800/90 dark:text-rose-300">
                        {isBn ? 'বাতিলের সময়:' : 'Revoked At:'} {cert.cancelledAt || '—'} •{' '}
                        {isBn ? 'কর্তৃপক্ষ:' : 'Authorized By:'}{' '}
                        {cert.cancelledBy || (isBn ? 'প্রধান শিক্ষক' : 'Head Teacher')}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                      <p>
                        <strong>{isBn ? 'শিক্ষার্থীর নাম:' : 'Student Name:'}</strong> {cert.studentName}
                      </p>
                      <p>
                        <strong>{isBn ? 'সনদের ধরন:' : 'Document Type:'}</strong>{' '}
                        {getCertificateTypeLabel(cert.type, lang)}
                      </p>
                      <p>
                        <strong>{isBn ? 'মূল ইস্যুর তারিখ:' : 'Original Issue Date:'}</strong>{' '}
                        {formatPortalNumber(cert.issueDate, lang)}
                      </p>
                      <p className="text-rose-700 dark:text-rose-400 font-semibold pt-2 border-t border-slate-200 dark:border-slate-800">
                        {isBn
                          ? 'সতর্কতা: এই সনদটি বর্তমানে অকার্যকর এবং কোনো দাপ্তরিক বা শিক্ষাগত কাজে গ্রহণযোগ্য নয়।'
                          : 'Warning: This certificate is no longer valid and must not be accepted for official use.'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* ── CASE 4: RECORD NOT FOUND ── */
              <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 rounded-2xl p-8 text-center space-y-4 shadow-md print:hidden">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {isBn ? 'কোনো নিবন্ধিত সনদ বা রসিদ পাওয়া যায়নি' : 'No Matching Document Found'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                    {isBn ? (
                      <>
                        প্রদত্ত কোড{' '}
                        <strong className="font-mono text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                          {searchedId}
                        </strong>{' '}
                        দিয়ে আমাদের রেজিস্ট্রিতে কোনো বৈধ রেকর্ড মেলেনি। হাইফেন (-) সহ সঠিক কোডটি যাচাই করুন অথবা সনদের QR কোডটি সরাসরি স্ক্যান করুন।
                      </>
                    ) : (
                      <>
                        No registered certificate or digital receipt matches{' '}
                        <strong className="font-mono text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                          {searchedId}
                        </strong>
                        . Verify the code including hyphens (-) or scan the original QR code.
                      </>
                    )}
                  </p>
                </div>
                <div className="pt-1 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-5 py-2.5 rounded-xl bg-[#0B5D3B] hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isBn ? 'নতুন কোড যাচাই করুন' : 'Try Another Code'}</span>
                  </button>
                  {schoolSettings.phone && (
                    <a
                      href={`tel:${schoolSettings.phone}`}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition inline-flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                      <span>{isBn ? 'অফিসে যোগাযোগ' : 'Contact Office'}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* 📋 PRE-SEARCH DOCUMENT FORMAT GUIDE & SECURITY ASSURANCE      */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {!hasVerifiedResult && !isVerifyingCloud && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
            {/* Left: Supported Verifiable Document Formats */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center border border-emerald-200/70 dark:border-emerald-800">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {isBn ? 'যে সকল নথি এখানে যাচাই করা যাবে' : 'Supported Verifiable Documents'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isBn
                      ? 'প্রতিষ্ঠান কর্তৃক ইস্যুকৃত সকল ডিজিটাল সনদ ও রসিদ সমর্থিত'
                      : 'All official certificates, testimonials, and fee receipts issued by the school'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    icon: FileBadge2,
                    code: 'CERT-2026-XXXXX',
                    title: isBn ? 'প্রাতিষ্ঠানিক সনদপত্র' : 'Institutional Certificates',
                    desc: isBn
                      ? 'চারিত্রিক সনদ, অধ্যয়নরত প্রত্যয়ন, ছাড়পত্র (TC), মেধা ও প্রশংসা সনদ।'
                      : 'Character, Bonafide Study, Transfer Certificate (TC), and Merit awards.',
                  },
                  {
                    icon: Award,
                    code: 'SSC-TEST-XXXXX',
                    title: isBn ? 'এসএসসি প্রশংসাপত্র' : 'SSC Testimonials',
                    desc: isBn
                      ? 'বোর্ড রোল, রেজিস্ট্রেশন ও জিপিএ সম্বলিত অফিশিয়াল প্রশংসাপত্র।'
                      : 'Official testimonials with board roll, registration, and achieved GPA.',
                  },
                  {
                    icon: Receipt,
                    code: 'REC-XXXXX / BKS-...',
                    title: isBn ? 'ডিজিটাল মানি রিসিপ্ট' : 'Digital Fee Receipts',
                    desc: isBn
                      ? 'বেতন ও ফি পরিশোধের রসিদ নম্বর বা অনলাইন TrxID দিয়ে যাচাই।'
                      : 'Verify tuition payment receipts by Receipt ID or gateway TrxID.',
                  },
                  {
                    icon: QrCode,
                    code: 'QR Code / URL',
                    title: isBn ? 'সরাসরি QR কোড যাচাই' : 'Direct QR Code Scan',
                    desc: isBn
                      ? 'যেকোনো সনদের QR কোড মোবাইল ক্যামেরায় স্ক্যান করলেই সরাসরি তথ্য দেখাবে।'
                      : 'Scan the printed QR code on any document or paste its verification URL.',
                  },
                ].map((item) => {
                  const IconComp = item.icon;
                  return (
                    <div
                      key={item.code}
                      className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-900 dark:text-white">
                          <IconComp className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
                          {item.title}
                        </span>
                      </div>
                      <span className="inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#0B5D3B] dark:text-emerald-400">
                        {item.code}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: 3-Layer Security Assurance + Helpdesk */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between gap-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center border border-emerald-200/70 dark:border-emerald-800">
                    <Lock className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {isBn ? '৩-স্তরের নিরাপত্তা নিশ্চয়তা' : '3-Layer Authenticity Assurance'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isBn ? 'জালিয়াতি প্রতিরোধে স্বয়ংক্রিয় ডিজিটাল রেজিস্ট্রি' : 'Anti-forgery institutional verification'}
                    </p>
                  </div>
                </div>

                <ul className="space-y-3 text-xs">
                  {[
                    {
                      step: isBn ? '০১' : '01',
                      title: isBn ? 'লাইভ ক্লাউড রেজিস্ট্রি ম্যাচিং' : 'Live Cloud Registry Match',
                      desc: isBn
                        ? 'প্রতিটি সার্টিফিকেট আইডি বিদ্যালয়ের কেন্দ্রীয় ক্লাউড ডাটাবেজের সাথে তাৎক্ষণিক মিলিয়ে দেখা হয়।'
                        : 'Each ID is checked live against the institution’s cloud registry.',
                    },
                    {
                      step: isBn ? '০২' : '02',
                      title: isBn ? 'তাৎক্ষণিক বাতিল (Revocation) শনাক্তকরণ' : 'Real-Time Revocation Check',
                      desc: isBn
                        ? 'কোনো সনদ কর্তৃপক্ষ বাতিল করলে তা লাল সতর্কবার্তাসহ সাথে সাথে প্রদর্শিত হয়।'
                        : 'Revoked or superseded certificates immediately trigger a red security alert.',
                    },
                    {
                      step: isBn ? '০৩' : '03',
                      title: isBn ? 'প্রিন্টযোগ্য ভেরিফিকেশন বিবরণী' : 'Printable Official Statement',
                      desc: isBn
                        ? 'দাপ্তরিক বা ভর্তি কাজে জমা দেওয়ার জন্য যাচাইকৃত রিপোর্টটি A4 PDF হিসেবে সংরক্ষণ করা যায়।'
                        : 'Save or print a clean A4 Verification Statement for formal submissions.',
                    },
                  ].map((item) => (
                    <li key={item.step} className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#0B5D3B] dark:text-emerald-400 font-mono text-[11px] font-black flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 mt-0.5">
                        {item.step}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Helpdesk & Quick Links */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                {(schoolSettings.phone || schoolSettings.email) && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                    {schoolSettings.phone && (
                      <span className="inline-flex items-center gap-1.5 font-semibold">
                        <Phone className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                        {formatPortalNumber(schoolSettings.phone, lang)}
                      </span>
                    )}
                    {schoolSettings.email && (
                      <span className="inline-flex items-center gap-1.5 font-semibold">
                        <Mail className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                        {schoolSettings.email}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/result"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                    <span>{isBn ? 'অনলাইন ফলাফল' : 'Online Results'}</span>
                  </Link>
                  <Link
                    href="/admission"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>{isBn ? 'অনলাইন ভর্তি' : 'Online Admission'}</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 🏛️ INSTITUTIONAL FOOTER (print:hidden)                       */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 py-6 mt-auto print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="text-center sm:text-left space-y-0.5">
            <p className="font-bold text-slate-700 dark:text-slate-200">
              © {formatPortalNumber(currentYear, lang)} {schoolDisplayName}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {schoolDisplayAddress}
              {schoolSettings?.eiin ? ` • EIIN: ${formatPortalNumber(schoolSettings.eiin, lang)}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold">
            <Link href="/" className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition">
              {isBn ? 'মূল ওয়েবসাইট' : 'Home'}
            </Link>
            <Link href="/result" className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition">
              {isBn ? 'অনলাইন ফলাফল' : 'Results'}
            </Link>
            <Link href="/admission" className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition">
              {isBn ? 'অনলাইন ভর্তি' : 'Admission'}
            </Link>
            <Link href="/login" className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition">
              {isBn ? 'অ্যাডমিন / শিক্ষক লগইন' : 'Portal Login'}
            </Link>
          </div>
        </div>
      </footer>

      {/* A4 Portrait Print & PDF Setup for Official Verification Statement */}
      <style>{VERIFY_A4_PRINT_STYLES}</style>
    </div>
  );
}

export default function CertificateVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-800 dark:text-slate-200">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#0B5D3B] border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
              সনদ যাচাইকরণ পোর্টাল লোড হচ্ছে...
            </p>
          </div>
        </div>
      }
    >
      <VerificationContent />
    </Suspense>
  );
}
