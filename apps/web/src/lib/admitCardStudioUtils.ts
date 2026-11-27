/**
 * Pure Utilities for the Admit Card Split-Pane Print Studio (`/dashboard/exam/admit-card`).
 * Supports 4 press-grade A4 layouts, strict single-language (Bangla OR English) output,
 * customizable per-exam subject routine schedules, and Class 6-10 canonical filtering.
 */

import type { SchoolSettings } from '@/services/settingsService';
import {
  getEnglishAddress,
  getEnglishPrincipalTitleFromSettings,
  getEnglishSchoolName,
} from '@/services/settingsService';
import type { Student } from '@/services/studentService';
import { getStudentReligion, type ReligionType } from '@/lib/religionUtils';
import { toAsciiDigits, toBanglaDigits } from '@/lib/omr/omrTemplates';
import {
  RANK_GRADE_BN_MAP,
  RANK_GRADE_EN_MAP,
  getRankGroupEn,
  normalizeRankGrade,
  normalizeRankGroupAndSection,
  type RankStudentBase,
  summarizeAvailableScopes,
} from '@/lib/rankResultUtils';

export type AdmitCardLayoutId =
  | 'a5_two_per_a4'
  | 'compact_four_per_a4'
  | 'single_full_a4'
  | 'two_col_grid';

export type AdmitDocLang = 'bn' | 'en';
export type AdmitGradeId = '6th' | '7th' | '8th' | '9th' | '10th';
export type AdmitGroupBn = 'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা';

export interface AdmitLayoutMeta {
  id: AdmitCardLayoutId;
  cardsPerPage: 1 | 2 | 4;
  orientation: 'portrait' | 'landscape';
  labelBn: string;
  shortDescBn: string;
  labelEn: string;
  shortDescEn: string;
  supportsRoutine: boolean;
}

export const ADMIT_LAYOUT_PRESETS: Record<AdmitCardLayoutId, AdmitLayoutMeta> = {
  a5_two_per_a4: {
    id: 'a5_two_per_a4',
    cardsPerPage: 2,
    orientation: 'portrait',
    labelBn: '২টি / A4 (A5×২)',
    shortDescBn: 'স্ট্যান্ডার্ড পোর্ট্রেট, মাঝখানে কাটিং লাইন',
    labelEn: '2 / A4 (A5×2)',
    shortDescEn: 'Standard portrait with center cut line',
    supportsRoutine: true,
  },
  compact_four_per_a4: {
    id: 'compact_four_per_a4',
    cardsPerPage: 4,
    orientation: 'portrait',
    labelBn: '৪টি / A4 (সাশ্রয়ী ২×২)',
    shortDescBn: '৫০% কাগজ সাশ্রয়ী কমপ্যাক্ট গ্রিড',
    labelEn: '4 / A4 (Compact 2×2)',
    shortDescEn: 'Eco-friendly compact 4-card grid',
    supportsRoutine: false,
  },
  single_full_a4: {
    id: 'single_full_a4',
    cardsPerPage: 1,
    orientation: 'portrait',
    labelBn: '১টি / A4 (রুটিনসহ)',
    shortDescBn: 'পূর্ণাঙ্গ বোর্ড স্টাইল + পরীক্ষার রুটিন',
    labelEn: '1 / A4 (Full + Routine)',
    shortDescEn: 'Full board-style page with exam schedule',
    supportsRoutine: true,
  },
  two_col_grid: {
    id: 'two_col_grid',
    cardsPerPage: 2,
    orientation: 'landscape',
    labelBn: '২-কলাম (ল্যান্ডস্কেপ)',
    shortDescBn: 'A4 আড়াআড়ি পাশাপাশি ২টি প্রবেশপত্র',
    labelEn: '2-Col (Landscape)',
    shortDescEn: 'Side-by-side 2 cards on A4 landscape',
    supportsRoutine: true,
  },
};

export interface AdmitCardDesignOptions {
  showBorder: boolean;
  showCutGuide: boolean;
  showWatermark: boolean;
  inkSaver: boolean;
  showQr: boolean;
  showRoutine: boolean;
  showInstructions: boolean;
  sessionYear: string;
}

export const DEFAULT_ADMIT_DESIGN_OPTIONS: AdmitCardDesignOptions = {
  showBorder: true,
  showCutGuide: true,
  showWatermark: true,
  inkSaver: false,
  showQr: true,
  showRoutine: false,
  showInstructions: true,
  sessionYear: '2026',
};

export interface AdmitScheduleEntry {
  id: string;
  subjectCode: string;
  subjectNameBn: string;
  subjectNameEn: string;
  examDate: string;
  examTime: string;
}

export interface AdmitCardStudent {
  id: string;
  roll: string;
  name: string;
  nameEn?: string;
  fatherName: string;
  motherName: string;
  regNo: string;
  gradeKey: AdmitGradeId;
  section: string;
  groupBn: AdmitGroupBn;
  religion: ReligionType;
  photoUrl?: string;
  isSample?: boolean;
}

const SCHEDULE_STORAGE_KEY = 'sms_admit_schedule_v1';

export function formatAdmitExamTitle(rawTitle: string, lang: AdmitDocLang): string {
  const clean = (rawTitle || '').trim();
  if (!clean) {
    return lang === 'en' ? 'Annual Examination 2026' : 'বার্ষিক পরীক্ষা ২০২৬';
  }

  const lower = clean.toLowerCase();
  const yearMatch = toAsciiDigits(clean).match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : '2026';

  if (lang === 'en') {
    const parenEn = clean.match(/\(([A-Za-z0-9\s\-&./]+)\)/);
    if (parenEn?.[1]) {
      const inner = parenEn[1].trim();
      return inner.includes(year) ? inner : `${inner} ${year}`;
    }
    if (clean.includes('অর্ধ-বার্ষিক') || clean.includes('অর্ধবার্ষিক') || lower.includes('half')) {
      return `Half-Yearly Examination ${year}`;
    }
    if (clean.includes('প্রাক-নির্বাচনী') || lower.includes('pre-test') || lower.includes('pre-selection')) {
      return `Pre-Test Examination ${year}`;
    }
    if (clean.includes('নির্বাচনী') || lower.includes('test exam')) {
      return `Test Examination ${year}`;
    }
    if (clean.includes('১ম সাময়িক') || clean.includes('১ম সাময়িক') || lower.includes('1st terminal')) {
      return `1st Terminal Examination ${year}`;
    }
    if (clean.includes('২য় সাময়িক') || clean.includes('২য় সাময়িক') || lower.includes('2nd terminal')) {
      return `2nd Terminal Examination ${year}`;
    }
    if (clean.includes('মডেল টেস্ট') || lower.includes('model test')) {
      return `Model Test Examination ${year}`;
    }
    if (clean.includes('বার্ষিক') || lower.includes('annual')) {
      return `Annual Examination ${year}`;
    }
    return toAsciiDigits(clean);
  }

  // Strict Bangla mode: strip English parentheticals & translate known English titles
  const stripped = clean.replace(/\s*\([A-Za-z0-9\s\-&./]+\)/g, '').trim();
  const yearBn = toBanglaDigits(year);
  if (/[\u0980-\u09FF]/.test(stripped)) {
    return toBanglaDigits(stripped);
  }
  if (lower.includes('half')) return `অর্ধ-বার্ষিক পরীক্ষা ${yearBn}`;
  if (lower.includes('pre-test') || lower.includes('pre-selection')) {
    return `প্রাক-নির্বাচনী পরীক্ষা ${yearBn}`;
  }
  if (lower.includes('test exam')) return `নির্বাচনী (টেস্ট) পরীক্ষা ${yearBn}`;
  if (lower.includes('1st terminal')) return `১ম সাময়িক পরীক্ষা ${yearBn}`;
  if (lower.includes('2nd terminal')) return `২য় সাময়িক পরীক্ষা ${yearBn}`;
  if (lower.includes('model test')) return `মডেল টেস্ট পরীক্ষা ${yearBn}`;
  if (lower.includes('annual')) return `বার্ষিক পরীক্ষা ${yearBn}`;
  return toBanglaDigits(stripped);
}

export function formatAdmitDigits(val: string | number, lang: AdmitDocLang): string {
  return lang === 'bn' ? toBanglaDigits(val) : toAsciiDigits(val);
}

export function formatAdmitGradeLabel(gradeKey: AdmitGradeId, lang: AdmitDocLang): string {
  return lang === 'en' ? RANK_GRADE_EN_MAP[gradeKey] : RANK_GRADE_BN_MAP[gradeKey];
}

export function formatAdmitSectionOrGroup(
  gradeKey: AdmitGradeId,
  section: string,
  groupBn: AdmitGroupBn,
  lang: AdmitDocLang,
): string {
  const is9or10 = gradeKey === '9th' || gradeKey === '10th';
  if (is9or10) {
    if (lang === 'en') return getRankGroupEn(groupBn);
    if (groupBn === 'বিজ্ঞান') return 'বিজ্ঞান বিভাগ';
    if (groupBn === 'মানবিক') return 'মানবিক বিভাগ';
    if (groupBn === 'ব্যবসায় শিক্ষা') return 'ব্যবসায় শিক্ষা বিভাগ';
    return 'সাধারণ';
  }
  const cleanSec = normalizeRankGroupAndSection(gradeKey, section, groupBn).sectionNorm;
  if (lang === 'en') return `Section ${cleanSec}`;
  const secBn = cleanSec === 'A' ? 'ক (A)' : cleanSec === 'B' ? 'খ (B)' : cleanSec === 'C' ? 'গ (C)' : cleanSec;
  return `শাখা ${secBn}`;
}

export function formatAdmitReligion(religion: ReligionType, lang: AdmitDocLang): string {
  if (lang === 'en') {
    if (religion === 'Muslim') return 'Islam';
    if (religion === 'Hindu') return 'Hinduism';
    if (religion === 'Christian') return 'Christianity';
    if (religion === 'Buddhist') return 'Buddhism';
    return religion || 'Islam';
  }
  if (religion === 'Muslim') return 'ইসলাম';
  if (religion === 'Hindu') return 'হিন্দু';
  if (religion === 'Christian') return 'খ্রিস্টান';
  if (religion === 'Buddhist') return 'বৌদ্ধ';
  return 'ইসলাম';
}

export function getAdmitInstitutionHeader(
  settings: Partial<SchoolSettings> | null | undefined,
  lang: AdmitDocLang,
): {
  schoolName: string;
  address: string;
  metaLine: string;
  principalTitle: string;
  classTeacherTitle: string;
} {
  const eiinRaw = (settings?.eiin || '').trim();
  const estdRaw = (settings?.estdYear || '').trim();

  if (lang === 'en') {
    const parts: string[] = [];
    if (eiinRaw) parts.push(`EIIN: ${toAsciiDigits(eiinRaw)}`);
    if (estdRaw) parts.push(`Estd: ${toAsciiDigits(estdRaw)}`);
    return {
      schoolName: getEnglishSchoolName(settings, 'Smart School'),
      address: getEnglishAddress(settings, ''),
      metaLine: parts.join(' • '),
      principalTitle: getEnglishPrincipalTitleFromSettings(settings, 'Headmaster'),
      classTeacherTitle: 'Class Teacher',
    };
  }

  const parts: string[] = [];
  if (eiinRaw) parts.push(`ইআইআইএন: ${toBanglaDigits(eiinRaw)}`);
  if (estdRaw) parts.push(`স্থাপিত: ${toBanglaDigits(estdRaw)} খ্রি.`);
  return {
    schoolName: (settings?.schoolName || '').trim() || 'শিক্ষা প্রতিষ্ঠান',
    address: (settings?.address || '').trim(),
    metaLine: parts.join(' • '),
    principalTitle: (settings?.principalTitle || '').trim() || 'প্রধান শিক্ষক',
    classTeacherTitle: (settings?.classTeacherTitle || '').trim() || 'শ্রেণি শিক্ষক',
  };
}

export interface AdmitDocLabels {
  badgeTitle: string;
  qrLabel: string;
  photoLabel: string;
  uploadPhotoHint: string;
  changePhotoHint: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  classLabel: string;
  sectionOrGroup: string;
  rollNo: string;
  regNo: string;
  religion: string;
  session: string;
  routineHeading: string;
  colDate: string;
  colSubject: string;
  colCode: string;
  colTime: string;
  instructionsHeading: string;
  instructions: string[];
  sigExaminee: string;
  cutGuideText: string;
}

export function getAdmitDocLabels(lang: AdmitDocLang): AdmitDocLabels {
  if (lang === 'en') {
    return {
      badgeTitle: 'ADMIT CARD',
      qrLabel: 'VERIFY QR',
      photoLabel: 'PHOTO',
      uploadPhotoHint: 'Upload Photo',
      changePhotoHint: 'Change',
      studentName: "Examinee's Name",
      fatherName: "Father's Name",
      motherName: "Mother's Name",
      classLabel: 'Class',
      sectionOrGroup: 'Section / Group',
      rollNo: 'Roll No.',
      regNo: 'Registration No.',
      religion: 'Religion',
      session: 'Session',
      routineHeading: 'EXAMINATION SCHEDULE',
      colDate: 'Date',
      colSubject: 'Subject',
      colCode: 'Code',
      colTime: 'Time',
      instructionsHeading: 'INSTRUCTIONS FOR EXAMINEES',
      instructions: [
        '1. Arrive at the examination hall at least 15 minutes before the exam starts.',
        '2. No examinee will be allowed to sit without the original Admit Card.',
        '3. Mobile phones and unauthorized electronic devices are strictly prohibited.',
        '4. Write your Roll and Registration numbers accurately on the answer script.',
      ],
      sigExaminee: "Examinee's Signature",
      cutGuideText: 'CUT ALONG THIS LINE',
    };
  }

  return {
    badgeTitle: 'প্রবেশপত্র',
    qrLabel: 'যাচাইকরণ কিউআর',
    photoLabel: 'পরীক্ষার্থীর ছবি',
    uploadPhotoHint: 'পাসপোর্ট ছবি আপলোড',
    changePhotoHint: 'ছবি পরিবর্তন',
    studentName: 'পরীক্ষার্থীর নাম',
    fatherName: 'পিতার নাম',
    motherName: 'মাতার নাম',
    classLabel: 'শ্রেণি',
    sectionOrGroup: 'শাখা / বিভাগ',
    rollNo: 'রোল নম্বর',
    regNo: 'রেজিস্ট্রেশন নং',
    religion: 'ধর্ম',
    session: 'শিক্ষাবর্ষ',
    routineHeading: 'পরীক্ষার সময়সূচি',
    colDate: 'তারিখ',
    colSubject: 'বিষয়',
    colCode: 'কোড',
    colTime: 'সময়',
    instructionsHeading: 'পরীক্ষার্থীদের জন্য আবশ্যকীয় নির্দেশাবলী',
    instructions: [
      '১. পরীক্ষা শুরুর অন্তত ১৫ মিনিট পূর্বে নির্ধারিত আসনে বসতে হবে।',
      '২. মূল প্রবেশপত্র ছাড়া কোনোভাবেই পরীক্ষায় অংশগ্রহণ করা যাবে না।',
      '৩. পরীক্ষা কক্ষে মোবাইল ফোন বা ডিজিটাল ডিভাইস আনা সম্পূর্ণ নিষিদ্ধ।',
      '৪. উত্তরপত্রে রোল ও রেজিস্ট্রেশন নম্বর নির্ভুলভাবে পূরণ করতে হবে।',
    ],
    sigExaminee: 'পরীক্ষার্থীর স্বাক্ষর',
    cutGuideText: 'কাটার স্থান',
  };
}

export function buildAdmitQrPayload(params: {
  student: AdmitCardStudent;
  schoolName: string;
  examTitle: string;
  sessionYear: string;
  lang: AdmitDocLang;
}): string {
  const { student, schoolName, examTitle, sessionYear, lang } = params;
  const gradeLabel = formatAdmitGradeLabel(student.gradeKey, lang);
  const secLabel = formatAdmitSectionOrGroup(
    student.gradeKey,
    student.section,
    student.groupBn,
    lang,
  );
  const roll = formatAdmitDigits(student.roll, lang);
  const reg = formatAdmitDigits(student.regNo, lang);
  const yr = formatAdmitDigits(sessionYear, lang);

  if (lang === 'en') {
    return [
      `${schoolName} - Admit Card`,
      `Name: ${student.nameEn || student.name}`,
      `Roll: ${roll}`,
      `Class: ${gradeLabel}`,
      `Section/Group: ${secLabel}`,
      `Reg: ${reg}`,
      `Exam: ${examTitle}`,
      `Session: ${yr}`,
      `Status: Verified Examinee`,
    ].join('\n');
  }

  return [
    `${schoolName} - প্রবেশপত্র`,
    `নাম: ${student.name}`,
    `রোল: ${roll}`,
    `শ্রেণি: ${gradeLabel}`,
    `শাখা/বিভাগ: ${secLabel}`,
    `রেজিস্ট্রেশন নং: ${reg}`,
    `পরীক্ষা: ${examTitle}`,
    `শিক্ষাবর্ষ: ${yr}`,
    `স্ট্যাটাস: যাচাইকৃত পরীক্ষার্থী`,
  ].join('\n');
}

export function filterAndNormalizeAdmitStudents(params: {
  allStudents: Student[];
  grade: AdmitGradeId;
  section: string;
  groupBn: AdmitGroupBn;
  photoMap: Record<string, string>;
  sessionYear: string;
}): AdmitCardStudent[] {
  const { allStudents, grade, section, groupBn, photoMap, sessionYear } = params;
  const is9or10 = grade === '9th' || grade === '10th';

  const matched = allStudents.filter((st) => {
    const g = normalizeRankGrade(st.grade || st.gradeBn);
    if (g !== grade) return false;
    const { groupBn: normGroup, sectionNorm } = normalizeRankGroupAndSection(
      g,
      st.section || st.branch,
      st.group,
    );
    if (is9or10) {
      return normGroup === groupBn;
    }
    return sectionNorm.toLowerCase() === section.toLowerCase();
  });

  const sorted = [...matched].sort((a, b) => {
    const rA = parseInt(toAsciiDigits(a.roll || '0'), 10);
    const rB = parseInt(toAsciiDigits(b.roll || '0'), 10);
    if (!Number.isNaN(rA) && !Number.isNaN(rB) && rA !== rB) return rA - rB;
    return String(a.roll || '').localeCompare(String(b.roll || ''));
  });

  return sorted.map((st, idx) => {
    const rollStr = String(st.roll || idx + 1).trim();
    const gradeKeyNorm = (st.grade || st.gradeBn || grade).toLowerCase().replace(/[^a-z0-9]/g, '');
    const photoUrl =
      st.photo ||
      (st as unknown as { photoUrl?: string }).photoUrl ||
      photoMap[st.id] ||
      (rollStr ? photoMap[`${gradeKeyNorm}_${rollStr}`] : '') ||
      (rollStr ? photoMap[rollStr] : '') ||
      '';
    const rawReg =
      (st as unknown as { registrationNo?: string; regNo?: string }).registrationNo ||
      (st as unknown as { regNo?: string }).regNo ||
      `${toAsciiDigits(sessionYear)}-${toAsciiDigits(rollStr).padStart(3, '0')}`;
    const { sectionNorm } = normalizeRankGroupAndSection(
      grade,
      st.section || st.branch,
      st.group,
    );

    return {
      id: st.id || `st-${grade}-${rollStr}-${idx}`,
      roll: rollStr,
      name: st.name || 'শিক্ষার্থী',
      nameEn: (st as unknown as { nameEn?: string }).nameEn,
      fatherName: st.fatherName || st.guardian || '—',
      motherName: st.motherName || '—',
      regNo: rawReg,
      gradeKey: grade,
      section: is9or10 ? section : sectionNorm,
      groupBn: is9or10 ? groupBn : 'সাধারণ',
      religion: getStudentReligion(st),
      photoUrl,
    };
  });
}

export function paginateAdmitStudents(
  students: AdmitCardStudent[],
  layoutId: AdmitCardLayoutId,
): AdmitCardStudent[][] {
  const perPage = ADMIT_LAYOUT_PRESETS[layoutId]?.cardsPerPage || 2;
  if (students.length === 0) return [];
  const pages: AdmitCardStudent[][] = [];
  for (let i = 0; i < students.length; i += perPage) {
    pages.push(students.slice(i, i + perPage));
  }
  return pages;
}

export function summarizeAdmitScopes(allStudents: Student[]) {
  const mapped: RankStudentBase[] = allStudents.map((st, idx) => {
    const g = normalizeRankGrade(st.grade || st.gradeBn);
    const { groupBn, sectionNorm } = normalizeRankGroupAndSection(
      g,
      st.section || st.branch,
      st.group,
    );
    return {
      id: st.id || `st-${idx}`,
      roll: st.roll || String(idx + 1),
      name: st.name || '',
      grade: g,
      gradeBn: RANK_GRADE_BN_MAP[g],
      section: sectionNorm,
      group: groupBn,
      optionalSubject: st.optionalSubject || '',
      religion: getStudentReligion(st),
    };
  });
  return summarizeAvailableScopes(mapped);
}

export function buildSampleAdmitStudents(
  grade: AdmitGradeId,
  section: string,
  groupBn: AdmitGroupBn,
  sessionYear: string,
): AdmitCardStudent[] {
  const yr = toAsciiDigits(sessionYear || '2026');
  return [
    {
      id: 'sample-admit-1',
      roll: '01',
      name: 'তানভীর আহমেদ চৌধুরী',
      nameEn: 'Tanvir Ahmed Chowdhury',
      fatherName: 'মোঃ সাইফুল ইসলাম চৌধুরী',
      motherName: 'নাসরিন সুলতানা',
      regNo: `${yr}106001`,
      gradeKey: grade,
      section,
      groupBn: grade === '9th' || grade === '10th' ? groupBn : 'সাধারণ',
      religion: 'Muslim',
      isSample: true,
    },
    {
      id: 'sample-admit-2',
      roll: '02',
      name: 'নুসরাত জাহান মীম',
      nameEn: 'Nusrat Jahan Mim',
      fatherName: 'মোঃ কামরুল হাসান',
      motherName: 'ফাতেমা আক্তার',
      regNo: `${yr}106002`,
      gradeKey: grade,
      section,
      groupBn: grade === '9th' || grade === '10th' ? groupBn : 'সাধারণ',
      religion: 'Muslim',
      isSample: true,
    },
  ];
}

const SUBJECT_EN_MAP: Array<[string, string]> = [
  ['বাংলা ১ম', 'Bangla 1st Paper'],
  ['বাংলা ২', 'Bangla 2nd Paper'],
  ['বাংলা', 'Bangla'],
  ['ইংরেজি ১ম', 'English 1st Paper'],
  ['ইংরেজি ২', 'English 2nd Paper'],
  ['ইংরেজি', 'English'],
  ['উচ্চতর গণিত', 'Higher Mathematics'],
  ['গণিত', 'Mathematics'],
  ['পদার্থ', 'Physics'],
  ['রসায়ন', 'Chemistry'],
  ['রসায়ন', 'Chemistry'],
  ['জীববিজ্ঞান', 'Biology'],
  ['বিজ্ঞান', 'General Science'],
  ['বাংলাদেশ ও বিশ্ব', 'Bangladesh & Global Studies'],
  ['তথ্য ও যোগাযোগ', 'ICT'],
  ['ডিজিটাল প্রযুক্তি', 'Digital Technology'],
  ['হিসাববিজ্ঞান', 'Accounting'],
  ['ব্যবসায় উদ্যোগ', 'Business Entrepreneurship'],
  ['ফিন্যান্স', 'Finance & Banking'],
  ['ইতিহাস', 'History'],
  ['ভূগোল', 'Geography'],
  ['পৌরনীতি', 'Civics & Citizenship'],
  ['অর্থনীতি', 'Economics'],
  ['কৃষি', 'Agriculture Studies'],
  ['গার্হস্থ্য', 'Home Science'],
  ['ইসলাম', 'Islam & Moral Education'],
  ['হিন্দু', 'Hinduism & Moral Education'],
  ['ধর্ম', 'Religion & Moral Education'],
];

export function resolveSubjectNames(rawName: string): { bn: string; en: string } {
  const clean = (rawName || '').trim();
  const parenEn = clean.match(/\(([A-Za-z0-9\s\-&./]+)\)/)?.[1]?.trim();
  const bnOnly = clean.replace(/\s*\([A-Za-z0-9\s\-&./]+\)/g, '').trim() || clean;
  if (parenEn) return { bn: bnOnly, en: parenEn };

  for (const [needle, en] of SUBJECT_EN_MAP) {
    if (bnOnly.includes(needle)) {
      return { bn: bnOnly, en };
    }
  }
  return { bn: bnOnly, en: bnOnly };
}

export function buildDefaultExamSchedule(
  subjects: Array<{ code: string; name: string }>,
  startDateIso = '2026-11-15',
): AdmitScheduleEntry[] {
  const baseDate = new Date(`${startDateIso}T00:00:00`);
  const validBase = Number.isNaN(baseDate.getTime()) ? new Date('2026-11-15T00:00:00') : baseDate;

  return subjects.slice(0, 12).map((sub, idx) => {
    const dt = new Date(validBase);
    dt.setDate(validBase.getDate() + idx * 2);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    const names = resolveSubjectNames(sub.name);
    return {
      id: `sched-${sub.code || idx}-${idx}`,
      subjectCode: String(sub.code || 101 + idx),
      subjectNameBn: names.bn,
      subjectNameEn: names.en,
      examDate: `${dd}/${mm}/${yyyy}`,
      examTime: '10:00 AM',
    };
  });
}

function scheduleScopeKey(examTitle: string, grade: AdmitGradeId, groupBn: AdmitGroupBn): string {
  const is9or10 = grade === '9th' || grade === '10th';
  return `${examTitle.trim().toLowerCase()}__${grade}__${is9or10 ? groupBn : 'gen'}`;
}

export function loadExamSchedule(
  examTitle: string,
  grade: AdmitGradeId,
  groupBn: AdmitGroupBn,
  fallbackSubjects: Array<{ code: string; name: string }>,
): AdmitScheduleEntry[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, AdmitScheduleEntry[]>;
        const key = scheduleScopeKey(examTitle, grade, groupBn);
        if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
          return parsed[key];
        }
      }
    } catch {
      // ignore storage read error
    }
  }
  return buildDefaultExamSchedule(fallbackSubjects);
}

export function saveExamSchedule(
  examTitle: string,
  grade: AdmitGradeId,
  groupBn: AdmitGroupBn,
  entries: AdmitScheduleEntry[],
): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    const parsed: Record<string, AdmitScheduleEntry[]> = raw ? JSON.parse(raw) : {};
    const key = scheduleScopeKey(examTitle, grade, groupBn);
    parsed[key] = entries;
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore storage write error
  }
}
