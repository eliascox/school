'use client';

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 📜 OFFICIAL CERTIFICATE & DOCUMENT PRINT ENGINE
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders print-ready A4 Portrait or Landscape certificates with:
 * - High-resolution School Seal & Logo
 * - Dynamic QR Code for Online Verification
 * - Multiple Styles: Official School Pad, Royal Border, Modern Clean
 * - Watermark, Dual Signatures, Verification ID
 * ═════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { SchoolSettings } from '@/services/settingsService';
import { CertificateRecord, CertificateLayoutStyle } from '@/services/certificateService';
import SchoolPadWrapper from './SchoolPadWrapper';
import { ShieldCheck, Award, CheckCircle2 } from 'lucide-react';

interface OfficialCertificateDocProps {
  cert: CertificateRecord;
  settings: SchoolSettings;
  overrideStyle?: CertificateLayoutStyle;
  mode?: 'full_pad' | 'preprinted' | 'blank_pad';
  onModeChange?: (mode: 'full_pad' | 'preprinted' | 'blank_pad') => void;
}

export default function OfficialCertificateDoc({
  cert,
  settings,
  overrideStyle,
  mode = 'full_pad',
  onModeChange
}: OfficialCertificateDocProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const layoutStyle: CertificateLayoutStyle = overrideStyle || cert.layoutStyle || 'pad';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Generate Verification URL
    const origin = window.location.origin;
    const verifyUrl = `${origin}/verify-certificate?id=${encodeURIComponent(cert.id)}`;

    QRCode.toDataURL(verifyUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('QR Gen error:', err));
  }, [cert.id]);

  // Compute Title
  const title =
    cert.title ||
    (cert.type === 'ssc_testimonial'
      ? 'TESTIMONIAL'
      : cert.type === 'current_student'
      ? 'অধ্যয়নরত প্রত্যয়ন পত্র'
      : cert.type === 'character_certificate'
      ? 'চারিত্রিক সনদ পত্র'
      : cert.type === 'transfer_certificate'
      ? 'ছাড়পত্র / টিসি (TC)'
      : cert.type === 'appreciation'
      ? 'কৃতিত্ব ও প্রশংসা সনদ'
      : cert.type === 'merit_certificate'
      ? 'মেধা সনদ পত্র'
      : cert.type === 'school_leaving'
      ? 'বিদ্যালয় ত্যাগের সনদ'
      : cert.type === 'participation'
      ? 'অংশগ্রহণ সনদ'
      : cert.type === 'student_verification'
      ? 'শিক্ষার্থী তথ্য যাচাইকরণ প্রত্যয়ন'
      : 'প্রত্যয়ন পত্র');

  // Format Text with Line breaks
  const formatParagraphs = (text?: string) => {
    if (!text) return null;
    return text.split('\n\n').map((para, i) => (
      <p key={i} className="mb-4 leading-relaxed text-justify indent-6">
        {para}
      </p>
    ));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // STYLE 1: ROYAL BORDER CERTIFICATE (For Merit, Appreciation, Testimonial)
  // ═══════════════════════════════════════════════════════════════════════════
  if (layoutStyle === 'royal_border') {
    return (
      <div className="w-[210mm] min-h-[297mm] p-6 bg-white text-slate-900 font-sans relative overflow-hidden mx-auto shadow-2xl print:shadow-none print:m-0 print:w-full print:min-h-0 print:p-4">
        
        {/* Outer Ornate Border */}
        <div className="border-[6px] border-double border-amber-600/80 p-3 h-full rounded-2xl relative flex flex-col justify-between">
          {/* Inner Thin Border */}
          <div className="border border-amber-500/50 p-6 sm:p-8 h-full rounded-xl relative flex flex-col justify-between bg-gradient-to-b from-amber-50/20 via-white to-amber-50/30">
            
            {/* Corner Ornaments */}
            <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-600"></div>
            <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-600"></div>
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-600"></div>
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-600"></div>

            {/* Background Watermark */}
            {settings.showWatermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] select-none">
                <span className="text-7xl font-black text-slate-900 uppercase tracking-widest text-center -rotate-25">
                  {settings.schoolName || 'BORATOLI HIGH SCHOOL'}
                </span>
              </div>
            )}

            {/* Header Section */}
            <div className="text-center space-y-2 relative z-10 border-b border-amber-300/60 pb-5">
              <div className="flex items-center justify-center gap-3">
                {settings.schoolLogo ? (
                  <img src={settings.schoolLogo} alt="Logo" className="w-16 h-16 object-contain" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-400 flex items-center justify-center text-amber-800 font-black text-xl">
                    BHS
                  </div>
                )}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 uppercase">
                    {settings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                  </h1>
                  <p className="text-xs text-slate-600 font-sans font-medium">
                    {settings.address || 'বরইতলী, চকরিয়া, কক্সবাজার'} | স্থাপিত: {settings.estdYear || '১৯৬৯'} খ্রি. | EIIN: {settings.eiin || '106184'}
                  </p>
                </div>
              </div>

              {/* Certificate Title Badge */}
              <div className="pt-3">
                <div className="inline-block relative">
                  <div className="px-8 py-1.5 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-700 text-amber-50 font-black text-lg uppercase tracking-widest rounded-md shadow-md border border-amber-900">
                    {title}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1 font-semibold">
                    স্মারক নং: {cert.refNo} | সনদ নং: {cert.id}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Certificate Content */}
            <div className="my-auto py-6 relative z-10 text-sm sm:text-base leading-relaxed text-slate-900">
              {cert.customBody ? (
                formatParagraphs(cert.customBody)
              ) : cert.type === 'ssc_testimonial' ? (
                <div className="space-y-4 text-justify font-sans">
                  <p className="leading-relaxed">
                    This is to certify that <strong className="font-black text-slate-950 uppercase border-b border-slate-900">{cert.studentName}</strong>
                    {cert.studentNameEn && <span> ({cert.studentNameEn})</span>}, son/daughter of Mr. <strong className="font-bold">{cert.fatherName}</strong> and Mrs. <strong className="font-bold">{cert.motherName}</strong>, Village: <strong className="font-bold">{cert.village || 'Boraitoli'}</strong>, Post Office: <strong className="font-bold">{cert.postOffice || 'Boraitoli'}</strong>, Upazilla: <strong className="font-bold">{cert.upazila || 'Chakaria'}</strong>, District: <strong className="font-bold">{cert.district || "Cox's Bazar"}</strong>, was a bona fide student of this institution.
                  </p>
                  <p className="leading-relaxed">
                    He/She bore Board Roll No. <strong className="font-mono font-bold">{cert.boardRoll || '102931'}</strong>, Registration No. <strong className="font-mono font-bold">{cert.boardReg || '1810293819'}</strong>, Session <strong className="font-mono font-bold">{cert.session || '2024-2025'}</strong> in <strong className="font-bold uppercase">{cert.group || 'Science'}</strong> group. He/She has duly passed the Secondary School Certificate (S.S.C.) Examination held in <strong className="font-bold">{cert.passingYear || '2026'}</strong> and secured a GPA of <strong className="font-mono font-black text-slate-950">{cert.gpa || '5.00'}</strong> out of 5.00 under the Board of Intermediate and Secondary Education, Chattogram.
                  </p>
                  <p className="leading-relaxed">
                    During the period of study in this institution, his/her moral character and conduct were found to be exemplary. There is no report of his/her involvement in any activity subversive of the state or against discipline.
                  </p>
                  <p className="leading-relaxed">
                    We wish him/her all the best and a very bright future.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-justify font-sans">
                  <p className="leading-loose">
                    এই মর্মে প্রত্যয়ন করা যাইতেছে যে, শিক্ষার্থী <strong className="text-base font-sans font-black underline">{cert.studentName}</strong>, পিতা: <strong className="font-bold">{cert.fatherName}</strong>, মাতা: <strong className="font-bold">{cert.motherName}</strong>, 
                    গ্রাম: {cert.village || 'বরইতলী'}, ডাকঘর: {cert.postOffice || 'বরইতলী'}, উপজেলা: {cert.upazila || 'চকরিয়া'}, জেলা: {cert.district || 'কক্সবাজার'}।
                  </p>
                  <p className="leading-loose">
                    সে অত্র বিদ্যালয়ের <strong className="font-bold">{cert.grade}</strong> শ্রেণির <strong className="font-bold">{cert.group}</strong> বিভাগের একজন নিয়মিত শিক্ষার্থী (রোল: <strong className="font-mono font-bold">{cert.roll}</strong>, সেশন: <strong className="font-mono font-bold">{cert.session}</strong>)। 
                    ভর্তিবহি অনুযায়ী তাহার জন্ম তারিখ: <strong className="font-mono font-bold">{cert.dob}</strong> খ্রি.।
                  </p>
                  {cert.achievementTitle && (
                    <div className="p-3 my-2 bg-amber-50 border border-amber-300 rounded-lg text-center font-bold text-amber-900">
                      স্বীকৃতি / বিশেষ অবদান: {cert.achievementTitle}
                    </div>
                  )}
                  <p className="leading-loose">
                    {cert.characterRemarks || 'অত্র বিদ্যালয়ে অবস্থানকালে তাহার নৈতিক চরিত্র, শৃঙ্খলা ও আচার-আচরণ অত্যন্ত সন্তোষজনক ও প্রশংসনীয় ছিল। সে কোন প্রকার আইন বা সমাজবিরোধী কাজে জড়িত নয়।'}
                  </p>
                  <p className="leading-loose">
                    আমি তাহার জীবনের উত্তরোত্তর সাফল্য, সুস্বাস্থ্য ও দীর্ঘায়ু কামনা করি।
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Footer Section: Signatures & QR Code */}
            <div className="pt-6 border-t border-amber-300/60 relative z-10">
              <div className="flex items-end justify-between gap-4">
                
                {/* Left: QR Code & Verification info */}
                <div className="flex items-center gap-3">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Verification" className="w-20 h-20 border border-amber-300 p-1 bg-white rounded-lg shadow-sm" />
                  ) : (
                    <div className="w-20 h-20 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                      QR Code
                    </div>
                  )}
                  <div className="text-[10px] space-y-0.5">
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-600" /> সরকারি ডিজিটাল ভেরিফিকেশন
                    </p>
                    <p className="text-slate-500 font-mono">আইডি: {cert.id}</p>
                    <p className="text-slate-500">ইস্যুর তারিখ: {cert.issueDate}</p>
                    <p className="text-[9px] text-amber-800 font-medium">ক্যামেরা দিয়ে স্ক্যান করে যাচাই করুন</p>
                  </div>
                </div>

                {/* Middle: Golden Seal Illustration */}
                <div className="hidden sm:flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-full border-2 border-amber-600 bg-amber-100/50 flex items-center justify-center text-amber-700 shadow-inner">
                    <Award size={26} />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 mt-1">OFFICIAL SEAL</span>
                </div>

                {/* Right: Principal Signature */}
                <div className="text-right space-y-1">
                  <div className="h-12 flex items-end justify-end">
                    <div className="font-sans italic font-bold text-slate-600 text-sm border-b border-slate-900 pb-1 w-44 text-center">
                      {settings.principalName || 'মোহাম্মদ রফিকুল ইসলাম'}
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-900">{settings.principalTitle || 'প্রধান শিক্ষক'}</p>
                  <p className="text-[10px] text-slate-600">{settings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}</p>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STYLE 2: OFFICIAL INSTITUTIONAL LETTERHEAD PAD (Standard Official)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SchoolPadWrapper
      settings={settings}
      mode={mode}
      refNo={cert.refNo ? `স্মারক নং: ${cert.refNo}` : undefined}
      date={cert.issueDate}
      dateLabel="তারিখ"
      title={title}
      hideHeaderActions={true}
      signaturePosition="flow"
      signatures={[
        {
          title: cert.authorizedPersonTitle || 'প্রস্তুতকারক / সহকারী শিক্ষক',
          subtitle: 'যাচাইকৃত',
          rightAligned: false
        },
        {
          title: settings.principalName || 'মোহাম্মদ রফিকুল ইসলাম',
          subtitle: `${settings.principalTitle || 'প্রধান শিক্ষক'}, ${settings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}`,
          rightAligned: true
        }
      ]}
    >
      <div className="text-xs sm:text-sm font-sans leading-relaxed text-slate-950 px-2 pt-2 pb-4 space-y-4">
        
        {/* Dynamic / Custom Body */}
        {cert.customBody ? (
          formatParagraphs(cert.customBody)
        ) : (
          <div className="space-y-4 text-justify">
            <p className="leading-loose">
              এই মর্মে প্রত্যয়ন করা যাইতেছে যে, <strong className="text-sm font-sans font-black underline">{cert.studentName}</strong>
              {cert.studentNameEn && <span> ({cert.studentNameEn})</span>}, পিতা: <strong className="font-sans font-extrabold">{cert.fatherName}</strong>, মাতা: <strong className="font-sans font-extrabold">{cert.motherName}</strong>, 
              গ্রাম: <strong className="font-bold">{cert.village || 'বরইতলী'}</strong>, ডাকঘর: <strong className="font-bold">{cert.postOffice || 'বরইতলী'}</strong>, উপজেলা: <strong className="font-bold">{cert.upazila || 'চকরিয়া'}</strong>, জেলা: <strong className="font-bold">{cert.district || 'কক্সবাজার'}</strong>।
            </p>
            
            <p className="leading-loose">
              সে অত্র বিদ্যালয়ের <strong className="font-mono font-bold">{cert.grade}</strong> শ্রেণির <strong className="font-sans font-bold">{cert.group}</strong> বিভাগের একজন নিয়মিত শিক্ষার্থী {cert.isAlumni ? 'ছিল' : 'হিসেবে বর্তমানে অধ্যয়নরত আছে'}। 
              তার শ্রেণি রোল নম্বর: <strong className="font-mono font-black">#{cert.roll}</strong> এবং শিক্ষাবর্ষ: <strong className="font-mono font-bold">{cert.session}</strong>। 
              ভর্তিবহি মতে তাহার জন্ম তারিখ: <strong className="font-mono font-bold">{cert.dob}</strong> খ্রি.।
            </p>

            {cert.achievementTitle && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 text-center">
                বিশেষ কৃতিত্ব / ভূমিকা: {cert.achievementTitle}
              </div>
            )}

            <p className="leading-loose">
              {cert.characterRemarks || 'বিদ্যালয়ে অবস্থানকালে তাহার চরিত্র, শৃঙ্খলা ও ব্যবহার প্রশংসনীয় ছিল। আমার জানামতে সে কোন রাষ্ট্র বা সমাজবিরোধী কর্মকাণ্ডে জড়িত নয়।'}
            </p>

            <p className="leading-loose">
              আমি তাহার উজ্জ্বল ভবিষ্যৎ ও সার্বিক উন্নতি কামনা করি।
            </p>
          </div>
        )}

        {/* QR Code & Online Verification Footnote */}
        <div className="pt-6 border-t border-slate-200/80 flex items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-3">
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Verification" className="w-16 h-16 border border-slate-300 p-1 bg-white rounded-lg shadow-sm" />
            )}
            <div className="text-[10px] space-y-0.5">
              <p className="font-bold text-slate-800 flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-600" /> সরকারি ডিজিটাল সনদ ভেরিফিকেশন
              </p>
              <p className="font-mono text-slate-500">সনদ নম্বর: <strong className="text-slate-800">{cert.id}</strong></p>
              <p className="text-slate-500">অনলাইনে সত্যতা নিশ্চিত করতে QR কোডটি স্ক্যান করুন।</p>
            </div>
          </div>

          <div className="text-[10px] text-right text-slate-400 font-mono">
            ইস্যুর তারিখ: {cert.issueDate}<br />
            SchoolPro Digital Registry
          </div>
        </div>

      </div>
    </SchoolPadWrapper>
  );
}
