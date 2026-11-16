'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Student } from '@/services/studentService';
import { SchoolSettings, getEnglishSchoolName } from '@/services/settingsService';
import { Phone, Droplet, MapPin, ShieldCheck } from 'lucide-react';

export type IdCardOrientation = 'portrait' | 'landscape';
export type IdCardSideMode = 'both' | 'front' | 'back';
export type IdCardTheme = 'indigo' | 'emerald' | 'crimson';

interface StudentIdCardPreviewProps {
  student: Student;
  settings: SchoolSettings;
  orientation: IdCardOrientation;
  sideMode: IdCardSideMode;
  theme: IdCardTheme;
  sessionYear: string;
  showCropMarks?: boolean;
}

const THEME_CLASSES: Record<
  IdCardTheme,
  { headerBg: string; accentText: string; badgeBg: string; stripBg: string }
> = {
  indigo: {
    headerBg: 'bg-gradient-to-br from-indigo-900 via-blue-800 to-indigo-700',
    accentText: 'text-indigo-800',
    badgeBg: 'bg-indigo-700',
    stripBg: 'bg-indigo-900',
  },
  emerald: {
    headerBg: 'bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-700',
    accentText: 'text-emerald-800',
    badgeBg: 'bg-emerald-700',
    stripBg: 'bg-emerald-900',
  },
  crimson: {
    headerBg: 'bg-gradient-to-br from-rose-900 via-red-800 to-rose-700',
    accentText: 'text-rose-800',
    badgeBg: 'bg-rose-700',
    stripBg: 'bg-rose-900',
  },
};

const gradeLabelBn = (grade: string) => {
  const m: Record<string, string> = {
    '6th': '৬ষ্ঠ শ্রেণি',
    '7th': '৭ম শ্রেণি',
    '8th': '৮ম শ্রেণি',
    '9th': '৯ম শ্রেণি',
    '10th': '১০ম শ্রেণি',
  };
  return m[grade] || grade;
};

export function StudentIdCardPreview({
  student,
  settings,
  orientation,
  sideMode,
  theme,
  sessionYear,
  showCropMarks = true,
}: StudentIdCardPreviewProps) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const palette = THEME_CLASSES[theme];
  const isPortrait = orientation === 'portrait';

  useEffect(() => {
    let active = true;
    const payload = `SMS-STU|${student.id}|${student.roll}|${student.grade}`;
    QRCode.toDataURL(payload, {
      margin: 0,
      width: 140,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => {
        if (active) setQrUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [student.id, student.roll, student.grade]);

  const cardSizeStyle: React.CSSProperties = {
    width: isPortrait ? '53.98mm' : '85.6mm',
    height: isPortrait ? '85.6mm' : '53.98mm',
    WebkitPrintColorAdjust: 'exact',
    printColorAdjust: 'exact',
  };

  const cropClass = showCropMarks
    ? 'border border-dashed border-slate-300 dark:border-slate-700 print:border-slate-300'
    : 'border border-slate-200 print:border-transparent';

  const initials = (student.name || 'S')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const schoolEn = getEnglishSchoolName(settings);

  const renderFront = () => (
    <div
      style={cardSizeStyle}
      className={`relative bg-white text-slate-900 rounded-md overflow-hidden flex flex-col justify-between shadow-sm select-none shrink-0 print:shadow-none print:rounded-none cr80-card-sheet ${cropClass}`}
    >
      {/* Header Band */}
      <div className={`${palette.headerBg} text-white px-2.5 py-2 flex items-center gap-2 shrink-0`}>
        {settings.schoolLogo ? (
          <img
            src={settings.schoolLogo}
            alt="Logo"
            className="w-7 h-7 rounded-full bg-white object-contain p-0.5 shrink-0"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black shrink-0">
            SMS
          </div>
        )}
        <div className="min-w-0 leading-tight">
          <p className="text-[8.5px] font-black truncate">{settings.schoolName || 'স্মার্ট স্কুল'}</p>
          <p className="text-[6.5px] text-white/80 font-semibold truncate">{schoolEn}</p>
          <p className="text-[6px] text-white/75">EIIN: {settings.eiin || '—'} • সেশন {sessionYear}</p>
        </div>
      </div>

      {/* Body */}
      {isPortrait ? (
        <div className="flex-1 flex flex-col items-center justify-center px-2.5 py-1.5 text-center gap-1">
          <span className={`px-2 py-0.5 rounded-full text-[6.5px] font-black text-white uppercase tracking-wider ${palette.badgeBg}`}>
            পরিচয়পত্র (Student ID)
          </span>
          {student.photo ? (
            <img
              src={student.photo}
              alt={student.name}
              className="w-16 h-16 rounded-lg object-cover border-2 border-slate-200 shadow-xs mt-0.5"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-sm font-black text-slate-600 mt-0.5">
              {initials}
            </div>
          )}
          <div className="w-full mt-0.5">
            <h4 className={`text-[10px] font-black leading-tight line-clamp-2 ${palette.accentText}`}>
              {student.name}
            </h4>
            <p className="text-[7.5px] font-bold text-slate-700 mt-0.5">
              {gradeLabelBn(student.grade)} ({student.section || student.branch || 'A'}) • রোল: {student.roll}
            </p>
          </div>
          <div className="w-full grid grid-cols-2 gap-1 text-left bg-slate-50 rounded p-1.5 border border-slate-200 text-[6.8px]">
            <div>
              <span className="text-slate-400 block leading-none">আইডি নং</span>
              <span className="font-black text-slate-800 truncate block">{student.id}</span>
            </div>
            <div>
              <span className="text-slate-400 block leading-none">রক্তের গ্রুপ</span>
              <span className="font-black text-rose-600 flex items-center gap-0.5">
                <Droplet className="w-2 h-2" /> {student.bloodGroup || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-2.5 px-3 py-1.5">
          {student.photo ? (
            <img
              src={student.photo}
              alt={student.name}
              className="w-14 h-16 rounded-md object-cover border-2 border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-14 h-16 rounded-md bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-0.5 text-[7.5px]">
            <span className={`inline-block px-1.5 py-0.5 rounded text-[6px] font-black text-white uppercase ${palette.badgeBg}`}>
              Student Identity Card
            </span>
            <h4 className={`text-[10px] font-black truncate ${palette.accentText}`}>{student.name}</h4>
            <p className="font-bold text-slate-700">
              শ্রেণি: {gradeLabelBn(student.grade)} ({student.section || student.branch || 'A'}) • রোল: {student.roll}
            </p>
            <p className="text-slate-600 truncate">অভিভাবক: {student.guardian || student.fatherName || '—'}</p>
            <div className="flex items-center justify-between pt-0.5 text-[6.8px] font-bold">
              <span className="text-slate-700">ID: {student.id}</span>
              <span className="text-rose-600 flex items-center gap-0.5">
                <Droplet className="w-2 h-2" /> {student.bloodGroup || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer Signature Strip */}
      <div className="px-2.5 py-1 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[6.2px] shrink-0">
        <span className="text-slate-500 font-bold">আইডি নং: {student.id}</span>
        <span className="font-black text-slate-700 border-t border-slate-400 px-1 pt-0.5">
          {settings.principalTitle || 'প্রধান শিক্ষক'}
        </span>
      </div>
    </div>
  );

  const renderBack = () => (
    <div
      style={cardSizeStyle}
      className={`relative bg-white text-slate-900 rounded-md overflow-hidden flex flex-col justify-between shadow-sm select-none shrink-0 print:shadow-none print:rounded-none cr80-card-sheet ${cropClass}`}
    >
      <div className={`${palette.stripBg} text-white px-2.5 py-1.5 flex items-center justify-between shrink-0`}>
        <span className="text-[7.5px] font-black tracking-wide flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> ডিজিটাল স্মার্ট পরিচয়পত্র
        </span>
        <span className="text-[6.5px] font-bold text-white/80">সেশন {sessionYear}</span>
      </div>

      <div className={`flex-1 px-2.5 py-1.5 flex ${isPortrait ? 'flex-col items-center justify-between' : 'flex-row items-center gap-2.5'}`}>
        <div className="flex flex-col items-center shrink-0">
          {qrUrl ? (
            <img src={qrUrl} alt="Student ID Verification QR" className="w-16 h-16 border border-slate-200 rounded p-0.5 bg-white" />
          ) : (
            <div className="w-16 h-16 border border-slate-200 rounded flex items-center justify-center text-[7px] text-slate-400">
              QR
            </div>
          )}
          <span className="text-[5.8px] font-bold text-slate-500 mt-0.5">Student ID Verification QR</span>
        </div>

        <div className={`text-[6.8px] space-y-1 min-w-0 ${isPortrait ? 'w-full' : 'flex-1'}`}>
          <div className="bg-slate-50 border border-slate-200 rounded p-1.5 space-y-0.5">
            <p className="font-bold text-slate-800 truncate">
              অভিভাবক: {student.guardian || student.fatherName || '—'}
            </p>
            <p className="font-bold text-slate-700 flex items-center gap-1">
              <Phone className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> জরুরি: {student.mobile || settings.phone || '—'}
            </p>
            <p className="text-slate-600 flex items-start gap-1 line-clamp-2">
              <MapPin className="w-2.5 h-2.5 text-indigo-600 shrink-0 mt-0.5" />
              <span>{student.currentAddress || settings.address || 'বাংলাদেশ'}</span>
            </p>
          </div>
          <p className="text-[6px] text-slate-500 leading-snug text-center">
            এই কার্ডটি বিদ্যালয়ের সম্পত্তি। হারিয়ে গেলে নিকটস্থ অফিসে বা {settings.phone || 'বিদ্যালয় নম্বরে'} যোগাযোগ করুন।
          </p>
        </div>
      </div>

      <div className={`${palette.stripBg} text-white/90 px-2.5 py-1 text-[6px] font-semibold flex items-center justify-between shrink-0`}>
        <span className="truncate">{settings.schoolName || 'স্মার্ট স্কুল'}</span>
        <span>EIIN: {settings.eiin || '—'}</span>
      </div>
    </div>
  );

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap print:gap-1">
      {(sideMode === 'front' || sideMode === 'both') && renderFront()}
      {(sideMode === 'back' || sideMode === 'both') && renderBack()}
    </div>
  );
}
