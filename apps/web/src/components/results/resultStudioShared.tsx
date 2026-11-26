'use client';

import React from 'react';
import {
  SchoolSettings,
  getEnglishSchoolName,
  getEnglishAddress,
} from '@/services/settingsService';
import { GRADE_BUCKETS, GradeBucket } from '@/lib/resultAnalyticsEngine';
import { AppLanguage } from '@/services/languageService';

export const toBnDigits = (val: string | number | undefined): string => {
  if (val === undefined || val === null) return '';
  return String(val).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
};

export const fmtNum = (val: string | number | undefined, lang: AppLanguage): string =>
  lang === 'bn' ? toBnDigits(val) : String(val ?? '');

export const GRADE_LABELS: Record<string, { bn: string; en: string }> = {
  '6th': { bn: '৬ষ্ঠ শ্রেণি', en: 'Class 6' },
  '7th': { bn: '৭ম শ্রেণি', en: 'Class 7' },
  '8th': { bn: '৮ম শ্রেণি', en: 'Class 8' },
  '9th': { bn: '৯ম শ্রেণি', en: 'Class 9' },
  '10th': { bn: '১০ম শ্রেণি', en: 'Class 10' },
};

export const cleanSubjectLabel = (rawName: string): string => {
  if (!rawName) return '';
  return rawName.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
};

export const shortTabulationSubject = (rawName: string): string => {
  const cleaned = cleanSubjectLabel(rawName);
  if (cleaned.includes('বাংলা ১ম')) return 'বাংলা ১ম';
  if (cleaned.includes('বাংলা ২')) return 'বাংলা ২য়';
  if (cleaned.includes('ইংরেজি ১ম') || cleaned.toLowerCase().includes('english 1st')) return 'ইংরেজি ১ম';
  if (cleaned.includes('ইংরেজি ২') || cleaned.toLowerCase().includes('english 2nd')) return 'ইংরেজি ২য়';
  if (cleaned.includes('ডিজিটাল প্রযুক্তি') || cleaned.includes('তথ্য ও যোগাযোগ')) return 'আইসিটি';
  if (cleaned.includes('বাংলাদেশ ও বিশ্ব')) return 'বাওবি';
  if (cleaned.includes('ইতিহাস ও সামাজিক')) return 'ইতিহাস ও সামা.';
  if (cleaned.includes('ইসলাম') || cleaned.includes('হিন্দু') || cleaned.includes('ধর্ম')) return 'ধর্ম ও নৈতিক';
  if (cleaned.includes('কৃষি')) return 'কৃষি';
  if (cleaned.includes('উচ্চতর গণিত')) return 'উচ্চ. গণিত';
  if (cleaned.includes('সাধারণ গণিত') || cleaned === 'গণিত') return 'গণিত';
  if (cleaned.includes('সাধারণ বিজ্ঞান')) return 'সা. বিজ্ঞান';
  return cleaned;
};

export function PrintInstitutionalHeader({
  settings,
  reportTitle,
  subtitle,
  hideHeader = false,
  lang = 'bn',
}: {
  settings: Partial<SchoolSettings> | null;
  reportTitle: string;
  subtitle: string;
  hideHeader?: boolean;
  lang?: AppLanguage;
}) {
  if (hideHeader) {
    return (
      <div className="mb-4 text-center border-b border-slate-300 dark:border-slate-700 pb-3 print:border-slate-900">
        <h3 className="text-base font-black text-slate-900 dark:text-white print:text-slate-950">
          {reportTitle}
        </h3>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 print:text-slate-800 mt-0.5">
          {subtitle}
        </p>
      </div>
    );
  }

  const schoolName =
    lang === 'en'
      ? getEnglishSchoolName(settings, 'SchoolPro Smart Institution')
      : settings?.schoolName || 'স্মার্ট শিক্ষা প্রতিষ্ঠান';
  const address =
    lang === 'en'
      ? getEnglishAddress(settings, '')
      : settings?.address || '';

  return (
    <div className="mb-5 pb-4 border-b-2 border-slate-900 dark:border-slate-700 print:border-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-3 text-center sm:text-left">
        {settings?.schoolLogo ? (
          <img
            src={settings.schoolLogo}
            alt={schoolName}
            className="w-12 h-12 rounded-xl object-contain border border-slate-200 dark:border-slate-700 bg-white p-1 shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-indigo-900 text-white font-black text-lg flex items-center justify-center shrink-0">
            {schoolName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white print:text-slate-950">
            {schoolName}
          </h2>
          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 print:text-slate-700">
            {address ? `${address} • ` : ''}EIIN: {settings?.eiin || '---'}
          </p>
        </div>
      </div>

      <div className="text-center sm:text-right">
        <span className="inline-block px-3.5 py-1 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white print:bg-slate-950 print:text-white font-black text-xs tracking-wide">
          {reportTitle}
        </span>
        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 print:text-slate-800 mt-1">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export function PrintSignatureStrip({ lang }: { lang: AppLanguage }) {
  const labels =
    lang === 'bn'
      ? ['প্রস্তুতকারী', 'শ্রেণি শিক্ষক', 'পরীক্ষা নিয়ন্ত্রক', 'প্রধান শিক্ষক']
      : ['Prepared By', 'Class Teacher', 'Exam Controller', 'Head of Institute'];

  return (
    <div className="mt-8 pt-6 hidden print:grid grid-cols-4 gap-6 text-center text-[11px] font-bold text-slate-950">
      {labels.map((label) => (
        <div key={label} className="pt-4">
          <div className="w-full border-b border-slate-900 mb-1.5" />
          <p>{label}</p>
        </div>
      ))}
    </div>
  );
}

const BUCKET_COLORS: Record<GradeBucket, string> = {
  'A+': 'bg-emerald-500',
  A: 'bg-teal-500',
  'A-': 'bg-sky-500',
  B: 'bg-indigo-500',
  C: 'bg-amber-500',
  D: 'bg-orange-500',
  F: 'bg-rose-500',
};

export function GradeDistributionBarChart({
  distribution,
  lang,
}: {
  distribution: Record<GradeBucket, number>;
  lang: AppLanguage;
}) {
  const total = GRADE_BUCKETS.reduce((sum, g) => sum + (distribution[g] || 0), 0);

  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 rounded-2xl p-4 print:bg-white print:border-slate-300">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="text-xs font-black text-slate-800 dark:text-slate-200 print:text-slate-900">
          {lang === 'bn' ? 'গ্রেড বণ্টন বিশ্লেষণ (A+ থেকে F)' : 'Grade Distribution Breakdown'}
        </span>
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          {lang === 'bn' ? `মোট মূল্যায়িত: ${toBnDigits(total)}` : `Total Evaluated: ${total}`}
        </span>
      </div>

      {/* Stacked proportion ribbon */}
      <div className="w-full h-3.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-900 flex mb-3">
        {total === 0 ? (
          <div className="w-full h-full bg-slate-200 dark:bg-slate-700" />
        ) : (
          GRADE_BUCKETS.map((bucket) => {
            const count = distribution[bucket] || 0;
            if (count === 0) return null;
            const pct = (count / total) * 100;
            return (
              <div
                key={bucket}
                style={{ width: `${pct}%` }}
                className={`${BUCKET_COLORS[bucket]} h-full transition-all`}
                title={`${bucket}: ${count} (${pct.toFixed(1)}%)`}
              />
            );
          })
        )}
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {GRADE_BUCKETS.map((bucket) => {
          const count = distribution[bucket] || 0;
          return (
            <div
              key={bucket}
              className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-1.5 px-1 print:border-slate-300"
            >
              <div className="flex items-center justify-center gap-1 text-[10px] font-extrabold text-slate-600 dark:text-slate-300">
                <span className={`w-2 h-2 rounded-full ${BUCKET_COLORS[bucket]}`} />
                <span>{bucket}</span>
              </div>
              <div className="text-sm font-black font-mono text-slate-900 dark:text-white print:text-slate-950">
                {fmtNum(count, lang)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
