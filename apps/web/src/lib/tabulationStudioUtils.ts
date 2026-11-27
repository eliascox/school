/**
 * Pure Utilities for the Master Tabulation Sheet Split-Pane Studio (`/dashboard/exam/tabulation`).
 * Fixes the Class 9-10 section/group filter bug, computes official merit positions,
 * supports A4 / Legal / A3 Landscape printing, strict single-language (BN | EN) output,
 * and 1-click Excel (.xlsx) export rows.
 */

import type { SchoolSettings } from '@/services/settingsService';
import {
  getEnglishAddress,
  getEnglishPrincipalTitleFromSettings,
  getEnglishSchoolName,
} from '@/services/settingsService';
import type { Student } from '@/services/studentService';
import type { StudentExamResult, SubjectMarkEntry } from '@/services/resultService';
import { getStudentReligion, type ReligionType } from '@/lib/religionUtils';
import { toAsciiDigits, toBanglaDigits } from '@/lib/omr/omrTemplates';
import {
  RANK_GRADE_BN_MAP,
  RANK_GRADE_EN_MAP,
  formatEnglishOrdinal,
  getRankGroupEn,
  normalizeRankGrade,
  normalizeRankGroupAndSection,
  normalizeRankRollNumber,
} from '@/lib/rankResultUtils';
import { formatAdmitExamTitle } from '@/lib/admitCardStudioUtils';

export type TabulationGradeId = '6th' | '7th' | '8th' | '9th' | '10th';
export type TabulationGroupBn = 'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা';
export type TabulationPaperSize = 'a4' | 'legal' | 'a3';
export type TabulationDocLang = 'bn' | 'en';
export type TabulationStatusFilter = 'all' | 'pass' | 'fail';

export interface TabulationPaperSpec {
  id: TabulationPaperSize;
  cssPageSize: string;
  labelBn: string;
  labelEn: string;
  dimensionsText: string;
}

export const TABULATION_PAPER_SPECS: Record<TabulationPaperSize, TabulationPaperSpec> = {
  a4: {
    id: 'a4',
    cssPageSize: 'A4 landscape',
    labelBn: 'A4 ল্যান্ডস্কেপ',
    labelEn: 'A4 Landscape',
    dimensionsText: '297mm × 210mm',
  },
  legal: {
    id: 'legal',
    cssPageSize: 'legal landscape',
    labelBn: 'Legal ল্যান্ডস্কেপ',
    labelEn: 'Legal Landscape',
    dimensionsText: '355.6mm × 215.9mm',
  },
  a3: {
    id: 'a3',
    cssPageSize: 'A3 landscape',
    labelBn: 'A3 ওয়াইড শিট',
    labelEn: 'A3 Wide Sheet',
    dimensionsText: '420mm × 297mm',
  },
};

export interface TabulationColumnOptions {
  showBreakdown: boolean;
  show4thSubject: boolean;
  showMerit: boolean;
  showGradePoint: boolean;
  compactRows: boolean;
}

export const DEFAULT_TABULATION_COLUMNS: TabulationColumnOptions = {
  showBreakdown: false,
  show4thSubject: true,
  showMerit: true,
  showGradePoint: false,
  compactRows: false,
};

export interface TabulationSubjectSpec {
  code: string;
  name: string;
  fullMarks: number;
  isJointPass?: boolean;
  jointPairCode?: string;
}

export interface TabulationStudentBase {
  id: string;
  roll: string;
  name: string;
  nameEn?: string;
  gradeKey: TabulationGradeId;
  sectionNorm: string;
  groupBn: TabulationGroupBn;
  optionalSubject: string;
  religion: ReligionType;
}

export interface TabulationCellMark {
  total: number;
  cq?: number;
  mcq?: number;
  practical?: number;
  ca?: number;
  grade: string;
  point: number;
  isOptional?: boolean;
  isPassed?: boolean;
}

export interface TabulationRow extends TabulationStudentBase {
  subjectMarksMap: Record<string, TabulationCellMark>;
  totalObtained: number;
  totalFull: number;
  gpaWithout4th: number;
  bonusGP: number;
  finalGPA: number;
  overallGrade: string;
  hasFailed: boolean;
  failedCount: number;
  meritPosition: number | null;
  isSample?: boolean;
}

export interface TabulationSummaryStats {
  total: number;
  passed: number;
  failed: number;
  aPlus: number;
  passRate: number;
  avgMarks: number;
  avgGpa: number;
  highestMarks: number;
}

/**
 * Filters students accurately for Tabulation Sheet:
 * - Class 6-8: matches canonical grade + section (A/B/C)
 * - Class 9-10: matches canonical grade + group (বিজ্ঞান/মানবিক/ব্যবসায় শিক্ষা)
 *   WITHOUT falsely rejecting students whose raw `section` is 'A' or 'Science'.
 */
export function filterTabulationStudents(params: {
  allStudents: Student[];
  grade: TabulationGradeId;
  section: string;
  groupBn: TabulationGroupBn;
}): TabulationStudentBase[] {
  const { allStudents, grade, section, groupBn } = params;
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
    return sectionNorm.toLowerCase() === section.trim().toLowerCase();
  });

  const sorted = [...matched].sort(
    (a, b) => normalizeRankRollNumber(a.roll) - normalizeRankRollNumber(b.roll),
  );

  const uniqueByRoll = new Map<string, TabulationStudentBase>();
  sorted.forEach((st, idx) => {
    const rollStr = String(st.roll || idx + 1).trim();
    const dedupKey = String(normalizeRankRollNumber(rollStr)) || rollStr;
    if (uniqueByRoll.has(dedupKey)) return;

    const { groupBn: normGroup, sectionNorm } = normalizeRankGroupAndSection(
      grade,
      st.section || st.branch,
      st.group,
    );

    uniqueByRoll.set(dedupKey, {
      id: st.id || `tab-${grade}-${rollStr}-${idx}`,
      roll: rollStr,
      name: st.name || 'শিক্ষার্থী',
      nameEn: (st as unknown as { nameEn?: string }).nameEn,
      gradeKey: grade,
      sectionNorm,
      groupBn: (is9or10 ? normGroup : 'সাধারণ') as TabulationGroupBn,
      optionalSubject:
        st.optionalSubject ||
        (is9or10 && groupBn === 'বিজ্ঞান' ? 'উচ্চতর গণিত' : 'কৃষি শিক্ষা'),
      religion: getStudentReligion(st),
    });
  });

  return Array.from(uniqueByRoll.values());
}

/**
 * Converts a `StudentExamResult` into a TabulationRow (before merit assignment).
 */
export function buildTabulationRow(
  student: TabulationStudentBase,
  evaluated: StudentExamResult | null | undefined,
  configuredSubjects: TabulationSubjectSpec[],
): TabulationRow {
  const subjectMarksMap: Record<string, TabulationCellMark> = {};

  const mapEntry = (entry: SubjectMarkEntry, isOpt = false): TabulationCellMark => ({
    total: entry.totalMarks,
    cq: entry.cq,
    mcq: entry.mcq,
    practical: entry.practical,
    ca: entry.ca,
    grade: entry.letterGrade,
    point: entry.gradePoint,
    isOptional: isOpt || Boolean(entry.isOptional),
    isPassed: entry.isPassed ?? entry.letterGrade !== 'F',
  });

  if (evaluated) {
    for (const [code, entry] of Object.entries(evaluated.subjectMarks || {})) {
      subjectMarksMap[code] = mapEntry(entry, false);
    }
    if (evaluated.optionalSubjectMark) {
      const opt = evaluated.optionalSubjectMark;
      const matchedCfg = configuredSubjects.find(
        (s) =>
          s.code === opt.subjectCode ||
          s.name.includes(opt.subjectName) ||
          opt.subjectName.includes(s.name),
      );
      const targetKey = matchedCfg ? matchedCfg.code : opt.subjectCode;
      subjectMarksMap[targetKey] = mapEntry(opt, true);
    }
  }

  return {
    ...student,
    subjectMarksMap,
    totalObtained: evaluated?.totalObtainedMarks ?? 0,
    totalFull: evaluated?.totalFullMarks ?? 0,
    gpaWithout4th: evaluated?.gpaWithout4th ?? 0,
    bonusGP: evaluated?.bonusGP ?? 0,
    finalGPA: evaluated?.gpa ?? 0,
    overallGrade: evaluated?.letterGrade ?? 'F',
    hasFailed: evaluated ? !evaluated.isPassed : true,
    failedCount: evaluated?.failedCount ?? 0,
    meritPosition: null,
  };
}

/**
 * Assigns official class merit positions (1..N) strictly to passed students.
 * Priority: Final GPA -> GPA w/o 4th -> Total Obtained Marks -> Roll (asc).
 * Output preserves roll-ascending order for the Tabulation Register!
 */
export function assignTabulationMeritPositions(rows: TabulationRow[]): TabulationRow[] {
  const passed = rows
    .filter((r) => !r.hasFailed)
    .sort((a, b) => {
      if (b.finalGPA !== a.finalGPA) return b.finalGPA - a.finalGPA;
      if (b.gpaWithout4th !== a.gpaWithout4th) return b.gpaWithout4th - a.gpaWithout4th;
      if (b.totalObtained !== a.totalObtained) return b.totalObtained - a.totalObtained;
      return normalizeRankRollNumber(a.roll) - normalizeRankRollNumber(b.roll);
    });

  const rankById = new Map<string, number>();
  passed.forEach((r, idx) => rankById.set(r.id, idx + 1));

  return rows.map((r) => ({
    ...r,
    meritPosition: r.hasFailed ? null : (rankById.get(r.id) ?? null),
  }));
}

export function computeTabulationSummary(rows: TabulationRow[]): TabulationSummaryStats {
  if (rows.length === 0) {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      aPlus: 0,
      passRate: 0,
      avgMarks: 0,
      avgGpa: 0,
      highestMarks: 0,
    };
  }
  const passed = rows.filter((r) => !r.hasFailed).length;
  const failed = rows.length - passed;
  const aPlus = rows.filter((r) => !r.hasFailed && r.finalGPA >= 5).length;
  const sumMarks = rows.reduce((acc, r) => acc + r.totalObtained, 0);
  const sumGpa = rows.reduce((acc, r) => acc + (r.hasFailed ? 0 : r.finalGPA), 0);
  const highestMarks = rows.reduce((mx, r) => Math.max(mx, r.totalObtained), 0);

  return {
    total: rows.length,
    passed,
    failed,
    aPlus,
    passRate: (passed / rows.length) * 100,
    avgMarks: sumMarks / rows.length,
    avgGpa: sumGpa / rows.length,
    highestMarks,
  };
}

export function formatTabulationDigits(val: string | number, lang: TabulationDocLang): string {
  return lang === 'bn' ? toBanglaDigits(val) : toAsciiDigits(val);
}

/**
 * Formats subject column headers strictly in the selected single language.
 */
export function formatTabulationSubjectName(rawName: string, lang: TabulationDocLang): string {
  if (!rawName) return '';
  const bnClean = rawName
    .replace(/\s*\([A-Za-z0-9\s.&\-/]+\)/g, '')
    .replace(/[A-Za-z]+/g, '')
    .trim();

  if (lang === 'en') {
    if (bnClean.includes('বাংলা ১')) return 'Ban 1st';
    if (bnClean.includes('বাংলা ২')) return 'Ban 2nd';
    if (bnClean.includes('বাংলা')) return 'Bangla';
    if (bnClean.includes('ইংরেজি ১')) return 'Eng 1st';
    if (bnClean.includes('ইংরেজি ২')) return 'Eng 2nd';
    if (bnClean.includes('ইংরেজি')) return 'English';
    if (bnClean.includes('উচ্চতর গণিত')) return 'H. Math';
    if (bnClean.includes('গণিত')) return 'Math';
    if (bnClean.includes('পদার্থ')) return 'Physics';
    if (bnClean.includes('রসায়ন') || bnClean.includes('রসায়ন')) return 'Chemistry';
    if (bnClean.includes('জীববিজ্ঞান')) return 'Biology';
    if (bnClean.includes('বিজ্ঞান')) return 'Science';
    if (bnClean.includes('ডিজিটাল') || bnClean.includes('তথ্য ও যোগাযোগ')) return 'ICT';
    if (bnClean.includes('বাংলাদেশ ও বিশ্ব')) return 'BGS';
    if (bnClean.includes('হিসাববিজ্ঞান')) return 'Accounting';
    if (bnClean.includes('ব্যবসায় উদ্যোগ') || bnClean.includes('ব্যবসায় উদ্যোগ')) return 'Bus. Ent.';
    if (bnClean.includes('ফিন্যান্স')) return 'Finance';
    if (bnClean.includes('ইতিহাস')) return 'History';
    if (bnClean.includes('ভূগোল')) return 'Geography';
    if (bnClean.includes('পৌরনীতি')) return 'Civics';
    if (bnClean.includes('অর্থনীতি')) return 'Economics';
    if (bnClean.includes('কৃষি')) return 'Agri.';
    if (bnClean.includes('গার্হস্থ্য')) return 'Home Sci.';
    if (bnClean.includes('ইসলাম') || bnClean.includes('হিন্দু') || bnClean.includes('ধর্ম')) {
      return 'Religion';
    }
    const paren = rawName.match(/\(([A-Za-z0-9\s.&\-/]+)\)/)?.[1]?.trim();
    return paren || toAsciiDigits(rawName).replace(/[\u0980-\u09FF]+/g, '').trim() || 'Sub';
  }

  // Strict Bangla short headers
  if (bnClean.includes('বাংলা ১')) return 'বাংলা ১';
  if (bnClean.includes('বাংলা ২')) return 'বাংলা ২';
  if (bnClean.includes('ইংরেজি ১')) return 'ইংরেজি ১';
  if (bnClean.includes('ইংরেজি ২')) return 'ইংরেজি ২';
  if (bnClean.includes('ডিজিটাল প্রযুক্তি') || bnClean.includes('তথ্য ও যোগাযোগ')) return 'তথ্যপ্রযুক্তি';
  if (bnClean.includes('বাংলাদেশ ও বিশ্ব')) return 'বাওবি';
  if (bnClean.includes('ইতিহাস')) return 'ইতিহাস';
  if (bnClean.includes('কৃষি')) return 'কৃষি';
  if (bnClean.includes('গার্হস্থ্য')) return 'গার্হস্থ্য';
  if (bnClean.includes('উচ্চতর গণিত')) return 'উ. গণিত';
  if (bnClean.includes('ব্যবসায় উদ্যোগ') || bnClean.includes('ব্যবসায় উদ্যোগ')) return 'ব্য. উদ্যোগ';
  if (bnClean.includes('ইসলাম') || bnClean.includes('হিন্দু') || bnClean.includes('ধর্ম')) return 'ধর্ম';
  return toBanglaDigits(bnClean || rawName);
}

export function getTabulationInstitutionHeader(
  settings: Partial<SchoolSettings> | null | undefined,
  lang: TabulationDocLang,
) {
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
  };
}

export function getTabulationDocLabels(lang: TabulationDocLang) {
  if (lang === 'en') {
    return {
      sheetTitle: 'MASTER TABULATION REGISTER',
      colRoll: 'Roll',
      colName: "Student's Name",
      colTotal: 'Total',
      colGpaNo4th: 'GPA (Ex.4th)',
      colGpa: 'GPA',
      colGrade: 'Grade',
      colMerit: 'Merit',
      colStatus: 'Status',
      statusPass: 'PASS',
      statusFail: 'FAIL',
      summaryTitle: 'Summary',
      summaryExaminees: 'Examinees',
      summaryPassed: 'Passed',
      summaryFailed: 'Failed',
      summaryAPlus: 'GPA 5.00',
      summaryAvg: 'Avg',
      summaryPassRate: 'Pass Rate',
      sigPreparedBy: 'Prepared By',
      sigController: 'Exam Controller',
      printDateLabel: 'Date',
    };
  }
  return {
    sheetTitle: 'ফলাফল টেবুলেশন রেজিস্টার',
    colRoll: 'রোল',
    colName: 'শিক্ষার্থীর নাম',
    colTotal: 'মোট',
    colGpaNo4th: '৪র্থ ছাড়া জিপিএ',
    colGpa: 'জিপিএ',
    colGrade: 'গ্রেড',
    colMerit: 'মেধাক্রম',
    colStatus: 'ফলাফল',
    statusPass: 'কৃতকার্য',
    statusFail: 'অকৃতকার্য',
    summaryTitle: 'পরিসংখ্যান',
    summaryExaminees: 'মোট পরীক্ষার্থী',
    summaryPassed: 'কৃতকার্য',
    summaryFailed: 'অকৃতকার্য',
    summaryAPlus: 'জিপিএ ৫.০০',
    summaryAvg: 'গড়',
    summaryPassRate: 'পাস হার',
    sigPreparedBy: 'প্রস্তুতকারীর স্বাক্ষর',
    sigController: 'পরীক্ষা নিয়ন্ত্রক',
    printDateLabel: 'তারিখ',
  };
}

export function formatTabulationScopeBanner(params: {
  examTitle: string;
  grade: TabulationGradeId;
  section: string;
  groupBn: TabulationGroupBn;
  lang: TabulationDocLang;
}): string {
  const { examTitle, grade, section, groupBn, lang } = params;
  const formattedExam = formatAdmitExamTitle(examTitle, lang);
  const labels = getTabulationDocLabels(lang);
  const is9or10 = grade === '9th' || grade === '10th';
  if (lang === 'en') {
    const scope = is9or10 ? getRankGroupEn(groupBn) : `Section ${section}`;
    return `${formattedExam} — ${labels.sheetTitle} (${RANK_GRADE_EN_MAP[grade]} • ${scope})`;
  }
  const scope = is9or10 ? `${groupBn} বিভাগ` : `শাখা ${section}`;
  return `${formattedExam} — ${labels.sheetTitle} (${RANK_GRADE_BN_MAP[grade]} • ${scope})`;
}

export function formatMeritCell(pos: number | null, lang: TabulationDocLang): string {
  if (!pos || pos <= 0) return '—';
  if (lang === 'en') return formatEnglishOrdinal(pos);
  if (pos === 1) return '১ম';
  if (pos === 2) return '২য়';
  if (pos === 3) return '৩য়';
  if (pos === 4) return '৪র্থ';
  if (pos === 5) return '৫ম';
  if (pos === 6) return '৬ষ্ঠ';
  if (pos === 7) return '৭ম';
  if (pos === 8) return '৮ম';
  if (pos === 9) return '৯ম';
  if (pos === 10) return '১০ম';
  return `${toBanglaDigits(pos)}তম`;
}

/**
 * Builds clean flat rows for 1-click Excel (.xlsx) download.
 */
export function buildTabulationExcelRows(params: {
  rows: TabulationRow[];
  subjects: TabulationSubjectSpec[];
  lang: TabulationDocLang;
  columns: TabulationColumnOptions;
}): Array<Record<string, string | number>> {
  const { rows, subjects, lang, columns } = params;
  const labels = getTabulationDocLabels(lang);

  return rows.map((st) => {
    const out: Record<string, string | number> = {
      [labels.colRoll]: formatTabulationDigits(st.roll, lang),
      [labels.colName]: lang === 'en' ? st.nameEn || st.name : st.name,
    };

    for (const sub of subjects) {
      const colHeader = `${formatTabulationSubjectName(sub.name, lang)} (${formatTabulationDigits(sub.fullMarks, lang)})`;
      const mark = st.subjectMarksMap[sub.code];
      if (!mark) {
        out[colHeader] = '-';
      } else if (columns.showBreakdown) {
        const parts: string[] = [];
        if (mark.cq !== undefined) parts.push(`CQ:${mark.cq}`);
        if (mark.mcq !== undefined) parts.push(`MCQ:${mark.mcq}`);
        if (mark.practical !== undefined && mark.practical > 0) parts.push(`PR:${mark.practical}`);
        out[colHeader] =
          parts.length > 0
            ? `${mark.total} (${mark.grade}) [${parts.join('/')}]`
            : `${mark.total} (${mark.grade})`;
      } else {
        out[colHeader] = `${mark.total} (${mark.grade})`;
      }
    }

    out[labels.colTotal] = st.totalObtained;
    if (columns.show4thSubject) {
      out[labels.colGpaNo4th] = st.hasFailed ? '0.00' : st.gpaWithout4th.toFixed(2);
    }
    out[labels.colGpa] = st.hasFailed ? '0.00' : st.finalGPA.toFixed(2);
    out[labels.colGrade] = st.overallGrade;
    if (columns.showMerit) {
      out[labels.colMerit] = formatMeritCell(st.meritPosition, lang);
    }
    out[labels.colStatus] = st.hasFailed ? labels.statusFail : labels.statusPass;
    return out;
  });
}

/**
 * Generates clean read-only sample tabulation rows when DB has 0 students
 * so administrators can inspect print layout & paper widths immediately.
 */
export function buildSampleTabulationRows(
  grade: TabulationGradeId,
  section: string,
  groupBn: TabulationGroupBn,
  subjects: TabulationSubjectSpec[],
): TabulationRow[] {
  const presets = [
    {
      id: 'sample-tab-1',
      roll: '01',
      name: 'তানভীর আহমেদ চৌধুরী',
      nameEn: 'Tanvir Ahmed Chowdhury',
      scores: [86, 82, 84, 80, 92, 88, 85, 90, 84, 87, 89, 86],
      gpa: 5.0,
      gpaNo4th: 4.88,
      grade: 'A+',
      failed: false,
    },
    {
      id: 'sample-tab-2',
      roll: '02',
      name: 'নুসরাত জাহান মীম',
      nameEn: 'Nusrat Jahan Mim',
      scores: [78, 74, 76, 72, 82, 79, 75, 81, 77, 74, 80, 76],
      gpa: 4.5,
      gpaNo4th: 4.25,
      grade: 'A',
      failed: false,
    },
    {
      id: 'sample-tab-3',
      roll: '03',
      name: 'রাফিউল ইসলাম সাকিব',
      nameEn: 'Rafiul Islam Sakib',
      scores: [64, 62, 68, 60, 71, 66, 63, 70, 65, 67, 68, 64],
      gpa: 3.75,
      gpaNo4th: 3.5,
      grade: 'A-',
      failed: false,
    },
    {
      id: 'sample-tab-4',
      roll: '04',
      name: 'সাদিয়া আফরিন',
      nameEn: 'Sadia Afrin',
      scores: [55, 52, 26, 48, 50, 58, 54, 60, 52, 56, 54, 51],
      gpa: 0.0,
      gpaNo4th: 0.0,
      grade: 'F',
      failed: true,
    },
  ];

  const rows: TabulationRow[] = presets.map((p) => {
    const map: Record<string, TabulationCellMark> = {};
    let total = 0;
    let full = 0;
    subjects.forEach((sub, idx) => {
      const fm = sub.fullMarks || 100;
      const rawScore = p.scores[idx % p.scores.length];
      const sc = fm === 50 ? Math.round(rawScore / 2) : rawScore;
      const pct = (sc / fm) * 100;
      const lg =
        pct >= 80
          ? 'A+'
          : pct >= 70
          ? 'A'
          : pct >= 60
          ? 'A-'
          : pct >= 50
          ? 'B'
          : pct >= 40
          ? 'C'
          : pct >= 33
          ? 'D'
          : 'F';
      const gp =
        lg === 'A+'
          ? 5
          : lg === 'A'
          ? 4
          : lg === 'A-'
          ? 3.5
          : lg === 'B'
          ? 3
          : lg === 'C'
          ? 2
          : lg === 'D'
          ? 1
          : 0;
      map[sub.code] = {
        total: sc,
        cq: Math.round(sc * 0.7),
        mcq: sc - Math.round(sc * 0.7),
        grade: lg,
        point: gp,
        isPassed: lg !== 'F',
      };
      total += sc;
      full += fm;
    });

    return {
      id: p.id,
      roll: p.roll,
      name: p.name,
      nameEn: p.nameEn,
      gradeKey: grade,
      sectionNorm: section,
      groupBn: grade === '9th' || grade === '10th' ? groupBn : 'সাধারণ',
      optionalSubject: '',
      religion: 'Muslim',
      subjectMarksMap: map,
      totalObtained: total,
      totalFull: full,
      gpaWithout4th: p.gpaNo4th,
      bonusGP: Math.max(0, p.gpa - p.gpaNo4th),
      finalGPA: p.gpa,
      overallGrade: p.grade,
      hasFailed: p.failed,
      failedCount: p.failed ? 1 : 0,
      meritPosition: null,
      isSample: true,
    };
  });

  return assignTabulationMeritPositions(rows);
}
