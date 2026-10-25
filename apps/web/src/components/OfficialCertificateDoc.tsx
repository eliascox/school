'use client';

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 📜 OFFICIAL TESTIMONIAL & CERTIFICATE PRINT ENGINE
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders authentic school testimonials strictly on official School Letterhead Pad:
 * - Automatically places text within user-customized margins
 * - Flows Principal's 4-line signature with dynamic auto-scaling gap
 * - Supports uploaded PDF / Image pad background or preprinted paper pad
 * ═════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { SchoolSettings, settingsService, DEFAULT_PAD_MARGINS } from '@/services/settingsService';
import { CertificateRecord, CertificateLayoutStyle } from '@/services/certificateService';
import SchoolPadWrapper from './SchoolPadWrapper';

interface OfficialCertificateDocProps {
  cert: CertificateRecord;
  settings: SchoolSettings;
  overrideStyle?: CertificateLayoutStyle;
  mode?: 'full_pad' | 'preprinted' | 'blank_pad';
  onModeChange?: (mode: 'full_pad' | 'preprinted' | 'blank_pad') => void;
  onOpenSettings?: () => void;
  hideHeaderActions?: boolean;
}

export default function OfficialCertificateDoc({
  cert,
  settings,
  mode = 'full_pad',
  onModeChange,
  onOpenSettings,
  hideHeaderActions = true,
}: OfficialCertificateDocProps) {
  const safeSettings: SchoolSettings = {
    ...settingsService.getSettings(),
    ...(settings || {}),
  };

  // Ensure writing begins 3 inches down from the top as required by official school letterhead pad
  const padMargins = {
    ...(safeSettings.padMargins || DEFAULT_PAD_MARGINS),
    top: Math.max(3.0, safeSettings.padMargins?.top || 3.0),
  };
  const docSettings: SchoolSettings = {
    ...safeSettings,
    padMargins,
  };

  // Compute Title - boldly emphasized
  const title =
    cert.title ||
    (cert.type === 'current_student'
      ? 'অধ্যয়নরত প্রত্যয়ন পত্র'
      : cert.type === 'character_certificate'
      ? 'চারিত্রিক সনদ পত্র'
      : cert.type === 'transfer_certificate'
      ? 'ছাড়পত্র / টিসি (TC)'
      : cert.type === 'student_verification'
      ? 'শিক্ষার্থী তথ্য যাচাইকরণ প্রত্যয়ন'
      : 'প্রত্যয়ন পত্র');

  // Format Text with Line breaks and bold formatting (**text**)
  const renderFormattedText = (para: string) => {
    const parts = para.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-black text-slate-950 font-serif">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const formatParagraphs = (text?: string) => {
    if (!text) return null;
    return text.split('\n\n').map((para, i) => (
      <p key={i} className="mb-4 leading-relaxed text-justify indent-6">
        {renderFormattedText(para)}
      </p>
    ));
  };

  return (
    <SchoolPadWrapper
      settings={docSettings}
      mode={mode}
      onModeChange={onModeChange}
      onOpenSettings={onOpenSettings}
      refNo={cert.refNo ? `স্মারক নং: ${cert.refNo}` : undefined}
      date={cert.issueDate}
      dateLabel="তারিখ"
      title={title}
      hideHeaderActions={hideHeaderActions}
      signatures={[
        {
          title: safeSettings.principalName || 'মোহাম্মদ রফিকুল ইসলাম',
          designation: safeSettings.principalTitle || 'প্রধান শিক্ষক',
          institution: safeSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
          address: safeSettings.address || 'বরইতলী, চকরিয়া, কক্সবাজার।',
          rightAligned: true,
        },
      ]}
    >
      <div className="space-y-4 text-justify px-1 pt-1 pb-2">
        {/* Dynamic / Custom Body */}
        {cert.customBody ? (
          formatParagraphs(cert.customBody)
        ) : (
          <div className="space-y-4 text-justify indent-6">
            <p className="leading-loose">
              এই মর্মে <strong className="font-black text-slate-950 underline decoration-slate-900">{title}</strong> প্রদান করা যাচ্ছে যে, <strong className="font-black underline">{cert.studentName}</strong>
              {cert.studentNameEn && <span> ({cert.studentNameEn})</span>}, পিতা: <strong className="font-extrabold">{cert.fatherName}</strong>, মাতা: <strong className="font-extrabold">{cert.motherName}</strong>, 
              {cert.address && !cert.village ? (
                <>ঠিকানা: <strong className="font-bold">{cert.address}</strong>।</>
              ) : (
                <>গ্রাম: <strong className="font-bold">{cert.village || 'বরইতলী'}</strong>, ডাকঘর: <strong className="font-bold">{cert.postOffice || 'বরইতলী'}</strong>, উপজেলা: <strong className="font-bold">{cert.upazila || 'চকরিয়া'}</strong>, জেলা: <strong className="font-bold">{cert.district || 'কক্সবাজার'}</strong>।</>
              )}
            </p>
            
            <p className="leading-loose">
              সে এই বিদ্যালয়ের <strong className="font-bold">{cert.grade}</strong> শ্রেণির <strong className="font-bold">{cert.group}</strong> বিভাগের একজন নিয়মিত শিক্ষার্থী {cert.isAlumni ? 'ছিল' : 'হিসেবে বর্তমানে অধ্যয়নরত আছে'}। 
              তার শ্রেণি রোল নম্বর: <strong className="font-mono font-black">#{cert.roll}</strong> এবং শিক্ষাবর্ষ: <strong className="font-mono font-bold">{cert.session}</strong>। 
              ভর্তিবহি মতে তার জন্ম তারিখ: <strong className="font-mono font-bold">{cert.dob}</strong> খ্রি.।
            </p>

            {cert.achievementTitle && (
              <p className="leading-loose">
                এই প্রতিষ্ঠানে অধ্যয়নকালে সে <strong className="font-bold">{cert.achievementTitle}</strong> হিসেবে বিশেষ ভূমিকা পালন করে।
              </p>
            )}

            <p className="leading-loose">
              {cert.characterRemarks || 'বিদ্যালয়ে অবস্থানকালে তার চরিত্র, শৃঙ্খলা ও আচার-আচরণ প্রশংসনীয় ছিল। আমার জানামতে সে কোন প্রকার রাষ্ট্র বা সমাজবিরোধী কর্মকাণ্ডে জড়িত নয়।'}
            </p>

            <p className="leading-loose">
              আমি তার উজ্জ্বল ভবিষ্যৎ ও সার্বিক উন্নতি কামনা করি।
            </p>
          </div>
        )}
      </div>
    </SchoolPadWrapper>
  );
}
