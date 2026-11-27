/**
 * Pure Utilities for Exam Seat Plan 3-Tier Sticker Density & Strict Single-Language Print Views
 * (`/dashboard/exam/seat-plan`).
 */

import type { SchoolSettings } from '@/services/settingsService';
import {
  getEnglishAddress,
  getEnglishPrincipalTitleFromSettings,
  getEnglishSchoolName,
} from '@/services/settingsService';
import { toAsciiDigits, toBanglaDigits } from '@/lib/omr/omrTemplates';
import {
  type ColumnGenderRule,
  type NormalizedGender,
  formatGenderRuleBn,
  formatSeatGradeFull,
  formatSeatGradeShort,
  normalizeSeatGradeKey,
} from '@/lib/seatPlanUtils';
import { formatAdmitExamTitle } from '@/lib/admitCardStudioUtils';
import { getRankGroupEn } from '@/lib/rankResultUtils';

export type SeatPrintLang = 'bn' | 'en';
export type StickerDensityId = 'large_12' | 'medium_18' | 'small_21';

export interface StickerDensitySpec {
  id: StickerDensityId;
  perPage: 12 | 18 | 21;
  cols: 3;
  rows: 4 | 6 | 7;
  labelBn: string;
  labelEn: string;
  printMinHeightMm: number;
}

export const STICKER_DENSITY_SPECS: Record<StickerDensityId, StickerDensitySpec> = {
  large_12: {
    id: 'large_12',
    perPage: 12,
    cols: 3,
    rows: 4,
    labelBn: '১২টি / A4 (বড় ৩×৪)',
    labelEn: '12 / A4 (Large 3×4)',
    printMinHeightMm: 62,
  },
  medium_18: {
    id: 'medium_18',
    perPage: 18,
    cols: 3,
    rows: 6,
    labelBn: '১৮টি / A4 (মাঝারি ৩×৬)',
    labelEn: '18 / A4 (Medium 3×6)',
    printMinHeightMm: 42,
  },
  small_21: {
    id: 'small_21',
    perPage: 21,
    cols: 3,
    rows: 7,
    labelBn: '২১টি / A4 (ছোট ৩×৭)',
    labelEn: '21 / A4 (Compact 3×7)',
    printMinHeightMm: 35,
  },
};

export function paginateStickersByDensity<T>(items: T[], density: StickerDensityId): T[][] {
  const perPage = STICKER_DENSITY_SPECS[density]?.perPage || 18;
  if (items.length === 0) return [];
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += perPage) {
    pages.push(items.slice(i, i + perPage));
  }
  return pages;
}

export function formatSeatPrintDigits(val: string | number | undefined | null, lang: SeatPrintLang): string {
  if (val === undefined || val === null) return '';
  return lang === 'bn' ? toBanglaDigits(val) : toAsciiDigits(val);
}

export function formatSeatPrintExam(examTitle: string, lang: SeatPrintLang): string {
  return formatAdmitExamTitle(examTitle, lang);
}

export function formatSeatPrintGrade(grade: string, short: boolean, lang: SeatPrintLang): string {
  if (lang === 'bn') {
    return short ? formatSeatGradeShort(grade) : formatSeatGradeFull(grade);
  }
  const key = normalizeSeatGradeKey(grade);
  const mapFull: Record<string, string> = {
    '6th': 'Class Six',
    '7th': 'Class Seven',
    '8th': 'Class Eight',
    '9th': 'Class Nine',
    '10th': 'Class Ten',
  };
  const mapShort: Record<string, string> = {
    '6th': 'Class 6',
    '7th': 'Class 7',
    '8th': 'Class 8',
    '9th': 'Class 9',
    '10th': 'Class 10',
  };
  return (short ? mapShort[key] : mapFull[key]) || grade;
}

export function formatSeatPrintGroup(group: string | undefined, lang: SeatPrintLang): string {
  if (!group || group === 'সাধারণ') return '';
  return lang === 'en' ? getRankGroupEn(group) : group;
}

export function formatSeatPrintGender(
  rule: ColumnGenderRule | NormalizedGender,
  lang: SeatPrintLang,
): string {
  if (lang === 'bn') return formatGenderRuleBn(rule);
  if (rule === 'male') return 'Boys';
  if (rule === 'female') return 'Girls';
  return 'Mixed';
}

export function getSeatPlanInstitutionHeader(
  settings: Partial<SchoolSettings> | null | undefined,
  lang: SeatPrintLang,
) {
  const eiin = (settings?.eiin || '').trim();
  if (lang === 'en') {
    return {
      schoolName: getEnglishSchoolName(settings, 'Smart School'),
      address: getEnglishAddress(settings, ''),
      eiinText: eiin ? `EIIN: ${toAsciiDigits(eiin)}` : '',
      principalTitle: getEnglishPrincipalTitleFromSettings(settings, 'Headmaster'),
    };
  }
  return {
    schoolName: (settings?.schoolName || '').trim() || 'শিক্ষা প্রতিষ্ঠান',
    address: (settings?.address || '').trim(),
    eiinText: eiin ? `ইআইআইএন: ${toBanglaDigits(eiin)}` : '',
    principalTitle: (settings?.principalTitle || '').trim() || 'প্রধান শিক্ষক',
  };
}

export function getSeatPlanPrintLabels(lang: SeatPrintLang) {
  if (lang === 'en') {
    return {
      doorSubtitle: 'EXAMINATION HALL DOOR SEATING NOTICE',
      examHallLabel: 'EXAMINATION ROOM',
      roomNoPrefix: 'Room No.',
      totalExaminees: 'Total',
      boys: 'Boys',
      girls: 'Girls',
      colClassGroup: 'Class & Group',
      colRollRange: 'Roll Range (From – To)',
      colTotal: 'Total',
      rowLayoutPrefix: 'Column Layout',
      colWord: 'Col',
      benchWord: 'Bench',
      seatStickerSubtitle: 'INDIVIDUAL DESK SEAT STICKERS',
      benchStickerSubtitle: 'BENCH-WISE SEAT STICKERS',
      rollLabel: 'Roll',
      topSheetSubtitlePrefix: 'EXAMINEE ATTENDANCE & SIGNATURE SHEET — ROOM',
      dateSubjectShiftLine: 'Date: __________________ • Subject: ________________________ • Shift: Morning / Afternoon',
      colSl: 'SL',
      colColBench: 'Col & Bench',
      colName: "Examinee's Name",
      colGender: 'Gender',
      colScriptSerial: 'Script Serial',
      colSignature: 'Signature',
      presentBlank: 'Present: _________',
      absentBlank: 'Absent: _________',
      invigilatorSign: 'Invigilator Signature: _______________',
      dutySubtitle: 'INVIGILATOR DUTY ROSTER',
      colDateShift: 'Date & Shift',
      colExamRoom: 'Exam Room',
      colExaminees: 'Examinees',
      colInvigilators: 'Assigned Invigilators',
      shiftMorning: 'Morning',
      shiftAfternoon: 'Afternoon',
      controllerSign: 'Exam Controller',
    };
  }

  return {
    doorSubtitle: 'পরীক্ষা কক্ষের আসন নির্দেশিকা',
    examHallLabel: 'পরীক্ষা কক্ষ',
    roomNoPrefix: 'কক্ষ নং',
    totalExaminees: 'মোট পরীক্ষার্থী',
    boys: 'ছাত্র',
    girls: 'ছাত্রী',
    colClassGroup: 'শ্রেণি ও বিভাগ',
    colRollRange: 'রোল নম্বর (হতে – পর্যন্ত)',
    colTotal: 'মোট',
    rowLayoutPrefix: 'সারিভিত্তিক বসার বিন্যাস',
    colWord: 'সারি',
    benchWord: 'বেঞ্চ',
    seatStickerSubtitle: 'ব্যক্তিগত আসন স্টিকার',
    benchStickerSubtitle: 'বেঞ্চভিত্তিক আসন স্টিকার',
    rollLabel: 'রোল',
    topSheetSubtitlePrefix: 'পরীক্ষার্থীদের হাজিরা ও স্বাক্ষরপত্র — কক্ষ নং',
    dateSubjectShiftLine: 'তারিখ: __________________ • বিষয়: ________________________ • শিফট: সকাল / বিকাল',
    colSl: 'ক্র.',
    colColBench: 'সারি ও বেঞ্চ',
    colName: 'পরীক্ষার্থীর নাম',
    colGender: 'লিঙ্গ',
    colScriptSerial: 'খাতার ক্রমিক',
    colSignature: 'স্বাক্ষর',
    presentBlank: 'উপস্থিত: _________ জন',
    absentBlank: 'অনুপস্থিত: _________ জন',
    invigilatorSign: 'পরিদর্শকের স্বাক্ষর: _______________',
    dutySubtitle: 'পরিদর্শক ডিউটি রোস্টার',
    colDateShift: 'তারিখ ও শিফট',
    colExamRoom: 'পরীক্ষা কক্ষ',
    colExaminees: 'পরীক্ষার্থী',
    colInvigilators: 'দায়িত্বপ্রাপ্ত পরিদর্শকবৃন্দ',
    shiftMorning: 'সকাল',
    shiftAfternoon: 'বিকাল',
    controllerSign: 'পরীক্ষা নিয়ন্ত্রক',
  };
}
