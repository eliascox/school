/**
 * Pure Utilities for the Student Print Register Split-Pane Studio (`/dashboard/students/print`).
 * Supports 4 official 1-click register presets, strict single-language (BN | EN) output,
 * class-wise statistical summary matrix, A4 pagination, and selected-column Excel (.xlsx) export.
 */

import type { SchoolSettings } from '@/services/settingsService';
import {
  getEnglishAddress,
  getEnglishPrincipalTitleFromSettings,
  getEnglishSchoolName,
} from '@/services/settingsService';
import type { Student } from '@/services/studentService';
import { sortStudentsGroupAndRoll } from '@/services/studentBulkImportEngine';
import { toAsciiDigits, toBanglaDigits } from '@/lib/omr/omrTemplates';
import {
  RANK_GRADE_BN_MAP,
  RANK_GRADE_EN_MAP,
  getRankGroupEn,
  normalizeRankGrade,
} from '@/lib/rankResultUtils';

export type StudentPrintOrientation = 'portrait' | 'landscape';
export type StudentPrintMargin = 'normal' | 'wide' | 'compact';
export type StudentPrintLang = 'bn' | 'en';
export type StudentPrintReportType = 'summary' | 'detailed';

export type StudentPrintPresetId =
  | 'attendance_register'
  | 'guardian_directory'
  | 'board_register'
  | 'class_summary';

export type StudentPrintColumnKey =
  | 'sl'
  | 'roll'
  | 'id'
  | 'name'
  | 'gender'
  | 'religion'
  | 'grade'
  | 'group'
  | 'guardian'
  | 'fatherNid'
  | 'motherName'
  | 'motherNid'
  | 'mobile'
  | 'optionalSubject'
  | 'birthRegNo'
  | 'dob'
  | 'bloodGroup'
  | 'address'
  | 'stipend'
  | 'remarks';

export interface StudentPrintFilters {
  grade: string;
  branch: string;
  group: string;
  gender: string;
  religion: string;
  stipend: string;
  q: string;
}

export interface StudentPrintColumnMeta {
  key: StudentPrintColumnKey;
  labelBn: string;
  labelEn: string;
  align: 'left' | 'center';
  width?: string;
}

export const STUDENT_PRINT_COLUMNS_META: StudentPrintColumnMeta[] = [
  { key: 'sl', labelBn: 'ক্র.', labelEn: 'SL', align: 'center', width: '34px' },
  { key: 'roll', labelBn: 'রোল', labelEn: 'Roll', align: 'center', width: '46px' },
  { key: 'id', labelBn: 'আইডি', labelEn: 'Student ID', align: 'center', width: '86px' },
  { key: 'name', labelBn: 'শিক্ষার্থীর নাম', labelEn: "Student's Name", align: 'left' },
  { key: 'gender', labelBn: 'লিঙ্গ', labelEn: 'Gender', align: 'center', width: '50px' },
  { key: 'religion', labelBn: 'ধর্ম', labelEn: 'Religion', align: 'center', width: '58px' },
  { key: 'grade', labelBn: 'শ্রেণি ও শাখা', labelEn: 'Class & Sec', align: 'center', width: '76px' },
  { key: 'group', labelBn: 'বিভাগ', labelEn: 'Group', align: 'center', width: '82px' },
  { key: 'guardian', labelBn: 'পিতার নাম / অভিভাবক', labelEn: "Father's Name / Guardian", align: 'left' },
  { key: 'fatherNid', labelBn: 'পিতার এনআইডি', labelEn: 'Father NID', align: 'center' },
  { key: 'motherName', labelBn: 'মাতার নাম', labelEn: "Mother's Name", align: 'left' },
  { key: 'motherNid', labelBn: 'মাতার এনআইডি', labelEn: 'Mother NID', align: 'center' },
  { key: 'mobile', labelBn: 'মোবাইল', labelEn: 'Mobile', align: 'center', width: '94px' },
  { key: 'optionalSubject', labelBn: '৪র্থ/ঐচ্ছিক বিষয়', labelEn: '4th Subject', align: 'center' },
  { key: 'birthRegNo', labelBn: 'জন্ম নিবন্ধন', labelEn: 'Birth Reg. No.', align: 'center' },
  { key: 'dob', labelBn: 'জন্ম তারিখ', labelEn: 'Date of Birth', align: 'center' },
  { key: 'bloodGroup', labelBn: 'রক্ত', labelEn: 'Blood', align: 'center', width: '46px' },
  { key: 'address', labelBn: 'ঠিকানা', labelEn: 'Address', align: 'left' },
  { key: 'stipend', labelBn: 'উপবৃত্তি', labelEn: 'Stipend', align: 'center', width: '56px' },
  { key: 'remarks', labelBn: 'মন্তব্য/স্বাক্ষর', labelEn: 'Remarks / Sign', align: 'center', width: '76px' },
];

export const DEFAULT_PRINT_COLUMNS: Record<StudentPrintColumnKey, boolean> = {
  sl: true,
  roll: true,
  id: false,
  name: true,
  gender: true,
  religion: false,
  grade: true,
  group: true,
  guardian: true,
  fatherNid: false,
  motherName: false,
  motherNid: false,
  mobile: true,
  optionalSubject: false,
  birthRegNo: false,
  dob: false,
  bloodGroup: false,
  address: false,
  stipend: false,
  remarks: true,
};

export interface StudentPrintPresetConfig {
  id: StudentPrintPresetId;
  labelBn: string;
  shortDescBn: string;
  titleBn: string;
  titleEn: string;
  reportType: StudentPrintReportType;
  orientation: StudentPrintOrientation;
  columns: StudentPrintColumnKey[];
}

export const STUDENT_PRINT_PRESETS: Record<StudentPrintPresetId, StudentPrintPresetConfig> = {
  attendance_register: {
    id: 'attendance_register',
    labelBn: 'হাজিরা রেজিস্টার',
    shortDescBn: 'পোর্ট্রেট • রোল, নাম, অভিভাবক, মোবাইল ও স্বাক্ষর',
    titleBn: 'শ্রেণি হাজিরা ও শিক্ষার্থী রেজিস্টার',
    titleEn: 'CLASS ATTENDANCE & STUDENT REGISTER',
    reportType: 'detailed',
    orientation: 'portrait',
    columns: ['sl', 'roll', 'name', 'gender', 'guardian', 'mobile', 'remarks'],
  },
  guardian_directory: {
    id: 'guardian_directory',
    labelBn: 'অভিভাবক ডিরেক্টরি',
    shortDescBn: 'ল্যান্ডস্কেপ • পিতা-মাতা, মোবাইল ও ঠিকানা',
    titleBn: 'অভিভাবক যোগাযোগ ডিরেক্টরি',
    titleEn: 'GUARDIAN CONTACT DIRECTORY',
    reportType: 'detailed',
    orientation: 'landscape',
    columns: ['sl', 'roll', 'name', 'grade', 'group', 'guardian', 'motherName', 'mobile', 'address'],
  },
  board_register: {
    id: 'board_register',
    labelBn: 'বোর্ড রেজিস্ট্রেশন ও NID',
    shortDescBn: 'ল্যান্ডস্কেপ • জন্ম নিবন্ধন, NID, জন্ম তারিখ ও ৪র্থ বিষয়',
    titleBn: 'বোর্ড রেজিস্ট্রেশন ও জাতীয় পরিচয়পত্র তালিকা',
    titleEn: 'BOARD REGISTRATION & NID REGISTER',
    reportType: 'detailed',
    orientation: 'landscape',
    columns: [
      'sl',
      'roll',
      'name',
      'grade',
      'group',
      'guardian',
      'fatherNid',
      'motherName',
      'motherNid',
      'birthRegNo',
      'dob',
      'optionalSubject',
    ],
  },
  class_summary: {
    id: 'class_summary',
    labelBn: 'শ্রেণিভিত্তিক পরিসংখ্যান',
    shortDescBn: 'পোর্ট্রেট • ৬ষ্ঠ–১০ম ছাত্র-ছাত্রী ও বিভাগভিত্তিক ছক',
    titleBn: 'শ্রেণি ও বিভাগভিত্তিক শিক্ষার্থী সংখ্যা',
    titleEn: 'CLASS & GROUP-WISE STUDENT STATISTICS',
    reportType: 'summary',
    orientation: 'portrait',
    columns: ['sl', 'roll', 'name', 'gender', 'grade', 'group'],
  },
};

export function buildColumnsMapForPreset(
  presetId: StudentPrintPresetId,
): Record<StudentPrintColumnKey, boolean> {
  const allowed = new Set(STUDENT_PRINT_PRESETS[presetId].columns);
  const out = { ...DEFAULT_PRINT_COLUMNS };
  (Object.keys(out) as StudentPrintColumnKey[]).forEach((k) => {
    out[k] = allowed.has(k);
  });
  out.sl = true;
  return out;
}

export function formatPrintDigits(val: string | number, lang: StudentPrintLang): string {
  return lang === 'bn' ? toBanglaDigits(val) : toAsciiDigits(val);
}

export function isMaleGender(gender?: string): boolean {
  const g = (gender || '').toLowerCase();
  return g.includes('পুরুষ') || g.includes('ছেলে') || g.includes('ছাত্র') && !g.includes('ছাত্রী') || g === 'male';
}

export function isFemaleGender(gender?: string): boolean {
  const g = (gender || '').toLowerCase();
  return g.includes('মহিলা') || g.includes('মেয়ে') || g.includes('মেয়ে') || g.includes('ছাত্রী') || g === 'female';
}

export function filterAndSortPrintStudents(
  allStudents: Student[],
  filters: StudentPrintFilters,
): Student[] {
  const norm = (v: unknown) =>
    toAsciiDigits(String(v ?? ''))
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  const qNorm = norm(filters.q);

  const filtered = allStudents.filter((st) => {
    const gNorm = normalizeRankGrade(st.grade || st.gradeBn);
    const matchGrade = filters.grade === 'all' || gNorm === filters.grade;

    const stBranch = String(st.branch || st.section || 'A').toLowerCase();
    const matchBranch =
      filters.branch === 'all' || stBranch === filters.branch.toLowerCase();

    const stGroup = String(st.group || 'সাধারণ');
    const matchGroup =
      filters.group === 'all' ||
      stGroup.includes(filters.group) ||
      (filters.group === 'বিজ্ঞান' && stGroup.toLowerCase().includes('sci')) ||
      (filters.group === 'মানবিক' && stGroup.toLowerCase().includes('hum')) ||
      (filters.group === 'ব্যবসায় শিক্ষা' &&
        (stGroup.includes('ব্যবসায়') || stGroup.toLowerCase().includes('com') || stGroup.toLowerCase().includes('bus')));

    const matchGender =
      filters.gender === 'all' ||
      (filters.gender === 'পুরুষ' && isMaleGender(st.gender)) ||
      (filters.gender === 'মহিলা' && isFemaleGender(st.gender));

    const stRel = String(st.religion || 'ইসলাম');
    const matchReligion =
      filters.religion === 'all' ||
      stRel.includes(filters.religion) ||
      (filters.religion === 'ইসলাম' && stRel.toLowerCase().includes('muslim')) ||
      (filters.religion === 'হিন্দু' && (stRel.toLowerCase().includes('hindu') || stRel.includes('সনাতন')));

    const matchStipend =
      filters.stipend === 'all' || (filters.stipend === 'stipend_only' && Boolean(st.isStipend));

    const extra = st as unknown as Record<string, unknown>;
    const haystack = [
      st.name,
      extra.nameEn,
      st.roll,
      st.id,
      st.guardian,
      st.fatherName,
      st.motherName,
      st.mobile,
      st.grade,
      st.branch,
      st.group,
      st.birthRegNo,
      extra.registrationNo,
    ]
      .map(norm)
      .join(' | ');
    const matchSearch = !qNorm || qNorm.split(' ').every((term) => haystack.includes(term));

    return (
      matchGrade &&
      matchBranch &&
      matchGroup &&
      matchGender &&
      matchReligion &&
      matchStipend &&
      matchSearch
    );
  });

  return sortStudentsGroupAndRoll(filtered, 'roll_asc');
}

export interface ClassSummaryRow {
  key: string;
  gradeBn: string;
  gradeEn: string;
  groupBn: string;
  groupEn: string;
  boys: number;
  girls: number;
  total: number;
}

export function computeStudentClassSummary(
  allStudents: Student[],
  filters: Pick<StudentPrintFilters, 'branch' | 'religion' | 'stipend'>,
): ClassSummaryRow[] {
  const specs = [
    { key: '6', gradeKey: '6th', gradeBn: '৬ষ্ঠ', gradeEn: 'Class 6', groupBn: '', groupEn: '' },
    { key: '7', gradeKey: '7th', gradeBn: '৭ম', gradeEn: 'Class 7', groupBn: '', groupEn: '' },
    { key: '8', gradeKey: '8th', gradeBn: '৮ম', gradeEn: 'Class 8', groupBn: '', groupEn: '' },
    { key: '9_sci', gradeKey: '9th', gradeBn: '৯ম', gradeEn: 'Class 9', groupBn: 'বিজ্ঞান', groupEn: 'Science' },
    { key: '9_hum', gradeKey: '9th', gradeBn: '৯ম', gradeEn: 'Class 9', groupBn: 'মানবিক', groupEn: 'Humanities' },
    { key: '9_bs', gradeKey: '9th', gradeBn: '৯ম', gradeEn: 'Class 9', groupBn: 'ব্যবসায় শিক্ষা', groupEn: 'Business Studies' },
    { key: '10_sci', gradeKey: '10th', gradeBn: '১০ম', gradeEn: 'Class 10', groupBn: 'বিজ্ঞান', groupEn: 'Science' },
    { key: '10_hum', gradeKey: '10th', gradeBn: '১০ম', gradeEn: 'Class 10', groupBn: 'মানবিক', groupEn: 'Humanities' },
    { key: '10_bs', gradeKey: '10th', gradeBn: '১০ম', gradeEn: 'Class 10', groupBn: 'ব্যবসায় শিক্ষা', groupEn: 'Business Studies' },
  ];

  const baseList = allStudents.filter((st) => {
    const matchBranch =
      filters.branch === 'all' ||
      String(st.branch || st.section || '').toLowerCase() === filters.branch.toLowerCase();
    const matchReligion =
      filters.religion === 'all' || String(st.religion || '').includes(filters.religion);
    const matchStipend =
      filters.stipend === 'all' || (filters.stipend === 'stipend_only' && Boolean(st.isStipend));
    return matchBranch && matchReligion && matchStipend;
  });

  return specs.map((spec) => {
    const matched = baseList.filter((st) => {
      if (normalizeRankGrade(st.grade || st.gradeBn) !== spec.gradeKey) return false;
      if (!spec.groupBn) return true;
      const grp = String(st.group || '').toLowerCase();
      if (spec.groupBn === 'বিজ্ঞান') return grp.includes('বিজ্ঞান') || grp.includes('sci');
      if (spec.groupBn === 'মানবিক') return grp.includes('মানবিক') || grp.includes('hum') || grp.includes('arts');
      return grp.includes('ব্যবসায়') || grp.includes('ব্যবসায়') || grp.includes('বাণিজ্য') || grp.includes('com') || grp.includes('bus');
    });

    const boys = matched.filter((s) => isMaleGender(s.gender)).length;
    const girls = matched.filter((s) => isFemaleGender(s.gender)).length;
    return {
      key: spec.key,
      gradeBn: spec.gradeBn,
      gradeEn: spec.gradeEn,
      groupBn: spec.groupBn,
      groupEn: spec.groupEn,
      boys,
      girls,
      total: matched.length,
    };
  });
}

export function paginateStudentPrintRows(
  students: Student[],
  orientation: StudentPrintOrientation,
  rowsPerPage: number,
): Array<{ pageNumber: number; rows: Array<{ student: Student; globalIndex: number }> }> {
  const firstPageMax = rowsPerPage > 0 ? rowsPerPage : orientation === 'portrait' ? 24 : 15;
  const nextPageMax = rowsPerPage > 0 ? rowsPerPage : orientation === 'portrait' ? 28 : 18;

  if (students.length === 0) {
    return [{ pageNumber: 1, rows: [] }];
  }

  const pages: Array<{ pageNumber: number; rows: Array<{ student: Student; globalIndex: number }> }> = [];
  let cursor = 0;
  let pageNumber = 1;
  while (cursor < students.length) {
    const limit = pageNumber === 1 ? firstPageMax : nextPageMax;
    const rows = students.slice(cursor, cursor + limit).map((student, idx) => ({
      student,
      globalIndex: cursor + idx + 1,
    }));
    pages.push({ pageNumber, rows });
    cursor += limit;
    pageNumber += 1;
  }
  return pages;
}

export function formatStudentCellValue(
  st: Student,
  colKey: StudentPrintColumnKey,
  globalIndex: number,
  lang: StudentPrintLang,
): string {
  const extra = st as unknown as Record<string, unknown>;
  switch (colKey) {
    case 'sl':
      return formatPrintDigits(globalIndex, lang);
    case 'roll':
      return formatPrintDigits(st.roll || globalIndex, lang);
    case 'id':
      return String(st.id || '—');
    case 'name':
      return lang === 'en' ? String(extra.nameEn || st.name || '—') : String(st.name || '—');
    case 'gender':
      if (lang === 'en') return isMaleGender(st.gender) ? 'Boy' : 'Girl';
      return isMaleGender(st.gender) ? 'ছাত্র' : 'ছাত্রী';
    case 'religion': {
      const r = String(st.religion || 'ইসলাম');
      if (lang === 'en') {
        if (r.includes('ইসলাম') || r.toLowerCase().includes('muslim')) return 'Islam';
        if (r.includes('হিন্দু') || r.toLowerCase().includes('hindu')) return 'Hinduism';
        if (r.includes('খ্রিস্টান') || r.toLowerCase().includes('christ')) return 'Christianity';
        if (r.includes('বৌদ্ধ') || r.toLowerCase().includes('buddh')) return 'Buddhism';
        return r;
      }
      if (r.toLowerCase().includes('muslim')) return 'ইসলাম';
      if (r.toLowerCase().includes('hindu')) return 'হিন্দু';
      return r;
    }
    case 'grade': {
      const gKey = normalizeRankGrade(st.grade || st.gradeBn);
      const sec = st.branch || st.section || 'A';
      return lang === 'en'
        ? `${RANK_GRADE_EN_MAP[gKey].replace(/\s*\(.+\)/, '')} (${sec})`
        : `${RANK_GRADE_BN_MAP[gKey]} (${sec})`;
    }
    case 'group':
      return lang === 'en' ? getRankGroupEn(st.group || '') : String(st.group || 'সাধারণ');
    case 'guardian':
      return String(st.guardian || st.fatherName || '—');
    case 'fatherNid':
      return formatPrintDigits(String(st.fatherNid || '—'), lang);
    case 'motherName':
      return String(st.motherName || '—');
    case 'motherNid':
      return formatPrintDigits(String(st.motherNid || '—'), lang);
    case 'mobile':
      return formatPrintDigits(String(st.mobile || '—'), lang);
    case 'optionalSubject':
      return String(st.optionalSubject || '—');
    case 'birthRegNo':
      return formatPrintDigits(String(st.birthRegNo || '—'), lang);
    case 'dob':
      return formatPrintDigits(String(st.dob || '—'), lang);
    case 'bloodGroup':
      return String(st.bloodGroup || '—');
    case 'address':
      return String(st.currentAddress || '—');
    case 'stipend':
      return st.isStipend ? (lang === 'en' ? 'Yes' : 'হ্যাঁ') : '—';
    case 'remarks':
      return '';
  }
}

export function buildStudentPrintExcelRows(
  students: Student[],
  activeCols: Record<StudentPrintColumnKey, boolean>,
  lang: StudentPrintLang,
): Array<Record<string, string>> {
  const visibleMeta = STUDENT_PRINT_COLUMNS_META.filter((m) => activeCols[m.key]);
  return students.map((st, idx) => {
    const row: Record<string, string> = {};
    for (const col of visibleMeta) {
      const header = lang === 'en' ? col.labelEn : col.labelBn;
      row[header] = formatStudentCellValue(st, col.key, idx + 1, lang);
    }
    return row;
  });
}

export function getStudentPrintHeader(
  settings: Partial<SchoolSettings> | null | undefined,
  lang: StudentPrintLang,
) {
  const eiin = (settings?.eiin || '').trim();
  const estd = (settings?.estdYear || '').trim();
  if (lang === 'en') {
    const parts: string[] = [];
    if (eiin) parts.push(`EIIN: ${toAsciiDigits(eiin)}`);
    if (estd) parts.push(`Estd: ${toAsciiDigits(estd)}`);
    return {
      schoolName: getEnglishSchoolName(settings, 'Smart School'),
      address: getEnglishAddress(settings, ''),
      metaLine: parts.join(' • '),
      principalTitle: getEnglishPrincipalTitleFromSettings(settings, 'Headmaster'),
      asstHeadTitle: 'Assistant Headmaster',
      classTeacherTitle: 'Class Teacher',
    };
  }
  const parts: string[] = [];
  if (eiin) parts.push(`ইআইআইএন: ${toBanglaDigits(eiin)}`);
  if (estd) parts.push(`স্থাপিত: ${toBanglaDigits(estd)} খ্রি.`);
  return {
    schoolName: (settings?.schoolName || '').trim() || 'শিক্ষা প্রতিষ্ঠান',
    address: (settings?.address || '').trim(),
    metaLine: parts.join(' • '),
    principalTitle: (settings?.principalTitle || '').trim() || 'প্রধান শিক্ষক',
    asstHeadTitle: 'সহকারী প্রধান শিক্ষক',
    classTeacherTitle: (settings?.classTeacherTitle || '').trim() || 'শ্রেণি শিক্ষকের স্বাক্ষর',
  };
}

export function buildSamplePrintStudents(): Student[] {
  return [
    {
      id: 'SMS-2026-001',
      roll: '01',
      name: 'তানভীর আহমেদ চৌধুরী',
      grade: '9th',
      branch: 'Science',
      section: 'Science',
      group: 'বিজ্ঞান',
      gender: 'পুরুষ',
      religion: 'ইসলাম',
      guardian: 'মোঃ সাইফুল ইসলাম চৌধুরী',
      fatherName: 'মোঃ সাইফুল ইসলাম চৌধুরী',
      fatherNid: '1980151122334',
      motherName: 'নাসরিন সুলতানা',
      motherNid: '1986151122339',
      mobile: '01819001122',
      optionalSubject: 'উচ্চতর গণিত',
      birthRegNo: '20112214011001234',
      dob: '2011-03-14',
      bloodGroup: 'B+',
      currentAddress: 'বরইতলী, চকরিয়া, কক্সবাজার',
      isStipend: true,
    } as unknown as Student,
    {
      id: 'SMS-2026-002',
      roll: '02',
      name: 'নুসরাত জাহান মীম',
      grade: '9th',
      branch: 'Science',
      section: 'Science',
      group: 'বিজ্ঞান',
      gender: 'মহিলা',
      religion: 'ইসলাম',
      guardian: 'মোঃ কামরুল হাসান',
      fatherName: 'মোঃ কামরুল হাসান',
      fatherNid: '1979152233445',
      motherName: 'ফাতেমা আক্তার',
      motherNid: '1985152233449',
      mobile: '01712334455',
      optionalSubject: 'জীববিজ্ঞান',
      birthRegNo: '20112214011005678',
      dob: '2011-06-21',
      bloodGroup: 'O+',
      currentAddress: 'পহরাচাঁদা, চকরিয়া, কক্সবাজার',
      isStipend: true,
    } as unknown as Student,
    {
      id: 'SMS-2026-003',
      roll: '01',
      name: 'অনির্বান বড়ুয়া',
      grade: '8th',
      branch: 'A',
      section: 'A',
      group: 'সাধারণ',
      gender: 'পুরুষ',
      religion: 'বৌদ্ধ',
      guardian: 'সুমন বড়ুয়া',
      fatherName: 'সুমন বড়ুয়া',
      fatherNid: '1981153344556',
      motherName: 'রূপা বড়ুয়া',
      motherNid: '1987153344551',
      mobile: '01911445566',
      optionalSubject: 'কৃষি শিক্ষা',
      birthRegNo: '20122214011009911',
      dob: '2012-01-19',
      bloodGroup: 'A+',
      currentAddress: 'হারবাং, চকরিয়া, কক্সবাজার',
      isStipend: false,
    } as unknown as Student,
    {
      id: 'SMS-2026-004',
      roll: '02',
      name: 'পূজা রানী দাশ',
      grade: '8th',
      branch: 'A',
      section: 'A',
      group: 'সাধারণ',
      gender: 'মহিলা',
      religion: 'হিন্দু',
      guardian: 'রতন কুমার দাশ',
      fatherName: 'রতন কুমার দাশ',
      fatherNid: '1978154455667',
      motherName: 'অনিতা রানী দাশ',
      motherNid: '1984154455662',
      mobile: '01610556677',
      optionalSubject: 'গার্হস্থ্য বিজ্ঞান',
      birthRegNo: '20122214011007722',
      dob: '2012-09-08',
      bloodGroup: 'AB+',
      currentAddress: 'বরইতলী বাজার, চকরিয়া',
      isStipend: true,
    } as unknown as Student,
  ];
}
