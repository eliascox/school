/**
 * Pure Utilities for Daily Attendance Printable Sheets & Excel Export (`/dashboard/academic/attendance`).
 * Enforces strict single-language (Bangla OR English) official print headers, badges, and spreadsheets.
 */

import type { SchoolSettings } from '@/services/settingsService';
import {
  getEnglishAddress,
  getEnglishPrincipalTitleFromSettings,
  getEnglishSchoolName,
} from '@/services/settingsService';
import type { StudentAttendanceRecord } from '@/services/attendanceService';
import { toAsciiDigits, toBanglaDigits } from '@/lib/omr/omrTemplates';
import { RANK_GRADE_BN_MAP, RANK_GRADE_EN_MAP, normalizeRankGrade } from '@/lib/rankResultUtils';

export type AttendancePrintLang = 'bn' | 'en';
export type AttendanceReportType = 'all' | 'present' | 'absent';

export function formatAttendanceDigits(val: string | number, lang: AttendancePrintLang): string {
  return lang === 'bn' ? toBanglaDigits(val) : toAsciiDigits(val);
}

export function getAttendanceInstitutionHeader(
  settings: Partial<SchoolSettings> | null | undefined,
  lang: AttendancePrintLang,
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
      preparedByTitle: 'Class Teacher / Prepared By',
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
    preparedByTitle: 'শ্রেণি শিক্ষক / প্রস্তুতকারক',
  };
}

export function getAttendancePrintLabels(
  reportType: AttendanceReportType,
  lang: AttendancePrintLang,
) {
  if (lang === 'en') {
    const title =
      reportType === 'absent'
        ? 'ABSENT & LEAVE STUDENTS CALLING LIST'
        : reportType === 'present'
        ? 'DAILY PRESENT STUDENTS REGISTER'
        : 'DAILY COMPLETE ATTENDANCE SHEET';
    return {
      reportTitle: title,
      scopeLabel: 'Scope',
      allClassesScope: 'All Classes (Class 6 - Class 10)',
      dateLabel: 'Date',
      totalRecordsLabel: 'Total Records',
      colSl: 'SL',
      colClass: 'Class & Section',
      colRoll: 'Roll',
      colName: "Student's Name",
      colGuardian: 'Guardian',
      colMobile: 'Mobile',
      colStatus: 'Status',
      colReason: 'Remarks / Reason',
      statusPresent: 'Present',
      statusAbsent: 'Absent',
      statusLeave: 'Leave',
      emptyText: 'No attendance records found for this selection.',
    };
  }

  const title =
    reportType === 'absent'
      ? 'অনুপস্থিত ও ছুটিপ্রাপ্ত শিক্ষার্থীদের অভিভাবক যোগাযোগ তালিকা'
      : reportType === 'present'
      ? 'দৈনিক উপস্থিত শিক্ষার্থীদের তালিকা'
      : 'দৈনিক সম্পূর্ণ হাজিরা রেজিস্টার';
  return {
    reportTitle: title,
    scopeLabel: 'শ্রেণি পরিসর',
    allClassesScope: 'সকল শ্রেণি (৬ষ্ঠ – ১০ম)',
    dateLabel: 'তারিখ',
    totalRecordsLabel: 'মোট শিক্ষার্থী',
    colSl: 'ক্র.',
    colClass: 'শ্রেণি ও শাখা/বিভাগ',
    colRoll: 'রোল',
    colName: 'শিক্ষার্থীর নাম',
    colGuardian: 'পিতা / অভিভাবক',
    colMobile: 'মোবাইল',
    colStatus: 'অবস্থা',
    colReason: 'কারণ / মন্তব্য',
    statusPresent: 'উপস্থিত',
    statusAbsent: 'অনুপস্থিত',
    statusLeave: 'ছুটি',
    emptyText: 'কোনো শিক্ষার্থীর হাজিরা রেকর্ড পাওয়া যায়নি।',
  };
}

export function formatAttendanceClassAndBranch(
  grade: string,
  branch: string,
  lang: AttendancePrintLang,
): string {
  const gKey = normalizeRankGrade(grade);
  const is9or10 = gKey === '9th' || gKey === '10th';
  const bLower = (branch || '').toLowerCase();

  if (lang === 'en') {
    const gradeLabel = RANK_GRADE_EN_MAP[gKey].replace(/\s*\(.+\)/, '');
    if (is9or10) {
      if (bLower.includes('sci') || bLower.includes('বিজ্ঞান') || bLower === 'a') {
        return `${gradeLabel} (Science)`;
      }
      if (bLower.includes('hum') || bLower.includes('মানবিক') || bLower === 'b') {
        return `${gradeLabel} (Humanities)`;
      }
      if (bLower.includes('com') || bLower.includes('bus') || bLower.includes('ব্যবসা') || bLower === 'c') {
        return `${gradeLabel} (Business Studies)`;
      }
      return `${gradeLabel} (${branch || 'General'})`;
    }
    return `${gradeLabel} (Section ${branch || 'A'})`;
  }

  const gradeLabel = RANK_GRADE_BN_MAP[gKey];
  if (is9or10) {
    if (bLower.includes('sci') || bLower.includes('বিজ্ঞান') || bLower === 'a') {
      return `${gradeLabel} (বিজ্ঞান)`;
    }
    if (bLower.includes('hum') || bLower.includes('মানবিক') || bLower === 'b') {
      return `${gradeLabel} (মানবিক)`;
    }
    if (bLower.includes('com') || bLower.includes('bus') || bLower.includes('ব্যবসা') || bLower === 'c') {
      return `${gradeLabel} (ব্যবসায় শিক্ষা)`;
    }
    return `${gradeLabel} (${branch || 'সাধারণ'})`;
  }
  const secBn = branch === 'A' ? 'ক' : branch === 'B' ? 'খ' : branch === 'C' ? 'গ' : branch || 'ক';
  return `${gradeLabel} (শাখা ${secBn})`;
}

export function formatAttendanceStatusLabel(
  status: StudentAttendanceRecord['status'],
  lang: AttendancePrintLang,
): string {
  const labels = getAttendancePrintLabels('all', lang);
  if (status === 'Present') return labels.statusPresent;
  if (status === 'Absent') return labels.statusAbsent;
  return labels.statusLeave;
}

export function buildAttendanceExcelRows(params: {
  records: StudentAttendanceRecord[];
  reportType: AttendanceReportType;
  lang: AttendancePrintLang;
}): Array<Record<string, string>> {
  const { records, reportType, lang } = params;
  const labels = getAttendancePrintLabels(reportType, lang);

  return records.map((st, idx) => {
    const row: Record<string, string> = {
      [labels.colSl]: formatAttendanceDigits(idx + 1, lang),
      [labels.colClass]: formatAttendanceClassAndBranch(st.grade, st.branch, lang),
      [labels.colRoll]: formatAttendanceDigits(st.roll, lang),
      [labels.colName]: st.name,
      [labels.colGuardian]: st.guardian || '—',
      [labels.colMobile]: formatAttendanceDigits(st.mobile || '—', lang),
      [labels.colStatus]: formatAttendanceStatusLabel(st.status, lang),
    };
    if (reportType === 'all' || reportType === 'absent') {
      row[labels.colReason] = st.reason || '—';
    }
    return row;
  });
}
