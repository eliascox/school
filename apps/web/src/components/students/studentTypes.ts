import { Student } from '@/services/studentService';

export interface StudentRecord extends Omit<Student, 'section' | 'branch'> {
  section?: string;
  branch?: string;
  nameEn?: string;
  fatherNameEn?: string;
  fatherOccupation?: string;
  motherNameEn?: string;
  motherOccupation?: string;
  studyStartYear?: string;
  studyEndYear?: string;
  guardianRelation?: string;
  prevSchoolName?: string;
  prevGpa?: string;
}

export interface BulkPhotoItemView {
  preview: string;
  fileName: string;
  matchedStudentId: string | null;
  matchedStudentName?: string;
  matchedGrade?: string;
  matchedRoll?: string;
}

export interface ClassSummaryRow {
  grade: string;
  group: string;
  boys: number;
  girls: number;
  total: number;
}

export interface PrintSheetPage<T extends StudentRecord = StudentRecord> {
  pageNumber: number;
  rows: Array<{ student: T; globalIndex: number }>;
}

export interface PrintColumnMeta {
  key: string;
  labelBn: string;
  labelEn: string;
  required?: boolean;
}

export const STUDENT_PRINT_COLUMNS: PrintColumnMeta[] = [
  { key: 'sl', labelBn: 'ক্র.নং', labelEn: 'SL', required: true },
  { key: 'roll', labelBn: 'রোল', labelEn: 'Roll' },
  { key: 'id', labelBn: 'শিক্ষার্থী আইডি', labelEn: 'Student ID' },
  { key: 'name', labelBn: 'শিক্ষার্থীর নাম', labelEn: 'Student Name' },
  { key: 'gender', labelBn: 'লিঙ্গ', labelEn: 'Gender' },
  { key: 'religion', labelBn: 'ধর্ম', labelEn: 'Religion' },
  { key: 'grade', labelBn: 'শ্রেণি ও শাখা', labelEn: 'Class & Sec' },
  { key: 'group', labelBn: 'বিভাগ', labelEn: 'Group' },
  { key: 'guardian', labelBn: '৯. পিতার নাম/অভিভাবক', labelEn: '9. Guardian Name' },
  { key: 'fatherNid', labelBn: '১০. পিতার NID', labelEn: '10. Father NID' },
  { key: 'motherName', labelBn: '১১. মাতার নাম', labelEn: '11. Mother Name' },
  { key: 'motherNid', labelBn: '১২. মাতার NID', labelEn: '12. Mother NID' },
  { key: 'mobile', labelBn: '১৩. মোবাইল নম্বর', labelEn: '13. Mobile' },
  { key: 'optionalSubject', labelBn: '১৪. ৪র্থ/ঐচ্ছিক বিষয়', labelEn: '14. Optional Subject' },
  { key: 'birthRegNo', labelBn: '১৫. জন্ম নিবন্ধন নম্বর', labelEn: '15. Birth Reg No' },
  { key: 'dob', labelBn: 'জন্ম তারিখ', labelEn: 'Date of Birth' },
  { key: 'bloodGroup', labelBn: '১৭. রক্তের গ্রুপ', labelEn: '17. Blood Group' },
  { key: 'address', labelBn: '১৮. ঠিকানা / গ্রাম', labelEn: '18. Address / Village' },
  { key: 'stipend', labelBn: '১৯. উপবৃত্তি স্ট্যাটাস', labelEn: '19. Stipend Status' },
  { key: 'remarks', labelBn: '২০. মন্তব্য / স্বাক্ষর', labelEn: '20. Remarks / Signature' },
];

export const toBanglaNumeral = (str: string | number | undefined): string => {
  if (str === undefined || str === null) return '';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(str).replace(/\d/g, (d) => bnDigits[parseInt(d, 10)] ?? d);
};

export const normalizeGradeKey = (grade?: string): '6th' | '7th' | '8th' | '9th' | '10th' | 'other' => {
  const g = (grade || '').toString().toLowerCase().trim();
  if (g === '6th' || g.includes('6') || g.includes('৬')) return '6th';
  if (g === '7th' || g.includes('7') || g.includes('৭')) return '7th';
  if (g === '8th' || g.includes('8') || g.includes('৮')) return '8th';
  if (g === '9th' || g.includes('9') || g.includes('৯')) return '9th';
  if (g === '10th' || g.includes('10') || g.includes('১০')) return '10th';
  return 'other';
};

export const formatGradeLabel = (grade?: string, lang: 'bn' | 'en' = 'bn'): string => {
  const key = normalizeGradeKey(grade);
  const mapBn: Record<string, string> = {
    '6th': '৬ষ্ঠ শ্রেণি',
    '7th': '৭ম শ্রেণি',
    '8th': '৮ম শ্রেণি',
    '9th': '৯ম শ্রেণি',
    '10th': '১০ম শ্রেণি',
  };
  const mapEn: Record<string, string> = {
    '6th': 'Class 6',
    '7th': 'Class 7',
    '8th': 'Class 8',
    '9th': 'Class 9',
    '10th': 'Class 10',
  };
  if (key !== 'other') {
    return lang === 'en' ? mapEn[key] : mapBn[key];
  }
  return grade || (lang === 'en' ? 'Unassigned' : 'অনির্ধারিত');
};

export const formatSectionLabel = (branch?: string, lang: 'bn' | 'en' = 'bn'): string => {
  const clean = (branch || '').trim();
  if (!clean) return lang === 'en' ? 'Sec A' : 'শাখা A';
  if (clean.length <= 2) {
    return lang === 'en' ? `Sec ${clean}` : `শাখা ${clean}`;
  }
  return clean;
};

export const matchStudentReligion = (religion: string | undefined, filter: string): boolean => {
  if (filter === 'all') return true;
  if (!religion) return false;
  const r = religion.toLowerCase();
  if (filter === 'ইসলাম') return r.includes('ইসলাম') || r.includes('মুসলিম') || r.includes('muslim') || r.includes('islam');
  if (filter === 'হিন্দু') return r.includes('হিন্দু') || r.includes('hindu') || r.includes('সনাতন') || r.includes('sanatan');
  if (filter === 'বৌদ্ধ') return r.includes('বৌদ্ধ') || r.includes('buddhist');
  if (filter === 'খ্রিস্টান') return r.includes('খ্রিস্ট') || r.includes('খ্রিষ্ট') || r.includes('christian');
  return r.includes(filter.toLowerCase());
};

export const isMaleGender = (gender?: string): boolean => {
  if (!gender) return false;
  const g = gender.toLowerCase().trim();
  return g.includes('পুরুষ') || g.includes('ছেলে') || (g.includes('ছাত্র') && !g.includes('ছাত্রী')) || g === 'male' || g === 'm';
};

export const isFemaleGender = (gender?: string): boolean => {
  if (!gender) return false;
  const g = gender.toLowerCase().trim();
  return g.includes('মহিলা') || g.includes('মেয়ে') || g.includes('মেয়ে') || g.includes('নারী') || g.includes('ছাত্রী') || g === 'female' || g === 'f';
};

export const buildClassSummaryRows = <T extends StudentRecord>(
  students: T[],
  branchFilter: string,
  religionFilter: string,
  stipendFilter: string
): ClassSummaryRow[] => {
  const standardSpecs = [
    { gradeKey: '6', gradeBn: '৬ষ্ঠ শ্রেণি', group: 'সাধারণ' },
    { gradeKey: '7', gradeBn: '৭ম শ্রেণি', group: 'সাধারণ' },
    { gradeKey: '8', gradeBn: '৮ম শ্রেণি', group: 'সাধারণ' },
    { gradeKey: '9_sci', gradeKeyNum: '9', gradeBn: '৯ম শ্রেণি', group: 'বিজ্ঞান' },
    { gradeKey: '9_hum', gradeKeyNum: '9', gradeBn: '৯ম শ্রেণি', group: 'মানবিক' },
    { gradeKey: '9_bs', gradeKeyNum: '9', gradeBn: '৯ম শ্রেণি', group: 'ব্যবসায় শিক্ষা' },
    { gradeKey: '10_sci', gradeKeyNum: '10', gradeBn: '১০ম শ্রেণি', group: 'বিজ্ঞান' },
    { gradeKey: '10_hum', gradeKeyNum: '10', gradeBn: '১০ম শ্রেণি', group: 'মানবিক' },
    { gradeKey: '10_bs', gradeKeyNum: '10', gradeBn: '১০ম শ্রেণি', group: 'ব্যবসায় শিক্ষা' },
  ];

  const baseList = students.filter((st) => {
    const matchBranch = branchFilter === 'all' || (st.branch && st.branch.toLowerCase() === branchFilter.toLowerCase());
    const matchReligion = matchStudentReligion(st.religion, religionFilter);
    const matchStipend = stipendFilter === 'all' || (stipendFilter === 'stipend_only' && Boolean(st.isStipend));
    return Boolean(matchBranch && matchReligion && matchStipend);
  });

  return standardSpecs.map((spec) => {
    const matched = baseList.filter((st) => {
      const g = (st.grade || '').toLowerCase();
      const grp = st.group || 'সাধারণ';

      let matchGrade = false;
      if (spec.gradeKey === '6') matchGrade = g.includes('6') || g.includes('৬');
      else if (spec.gradeKey === '7') matchGrade = g.includes('7') || g.includes('৭');
      else if (spec.gradeKey === '8') matchGrade = g.includes('8') || g.includes('৮');
      else if (spec.gradeKeyNum === '9') matchGrade = g.includes('9') || g.includes('৯');
      else if (spec.gradeKeyNum === '10') matchGrade = g.includes('10') || g.includes('১০');

      let matchGroup = false;
      if (spec.gradeKey === '6' || spec.gradeKey === '7' || spec.gradeKey === '8') {
        matchGroup = true;
      } else if (spec.group === 'বিজ্ঞান') {
        matchGroup = grp.includes('বিজ্ঞান') || grp.toLowerCase().includes('sci');
      } else if (spec.group === 'মানবিক') {
        matchGroup = grp.includes('মানবিক') || grp.toLowerCase().includes('hum') || grp.toLowerCase().includes('arts');
      } else if (spec.group === 'ব্যবসায় শিক্ষা') {
        matchGroup =
          grp.includes('ব্যবসায়') ||
          grp.includes('বাণিজ্য') ||
          grp.toLowerCase().includes('com') ||
          grp.toLowerCase().includes('bus');
      }

      return matchGrade && matchGroup;
    });

    const boys = matched.filter((s) => isMaleGender(s.gender)).length;
    const girls = matched.filter((s) => isFemaleGender(s.gender)).length;

    return {
      grade: spec.gradeBn,
      group: spec.group,
      boys,
      girls,
      total: matched.length,
    };
  });
};

export const buildPaginatedPrintSheets = <T extends StudentRecord>(
  printableStudents: T[],
  orientation: 'portrait' | 'landscape',
  rowsPerPage: number
): PrintSheetPage<T>[] => {
  const firstPageMax = rowsPerPage > 0 ? rowsPerPage : orientation === 'portrait' ? 24 : 15;
  const subsequentPageMax = rowsPerPage > 0 ? rowsPerPage : orientation === 'portrait' ? 28 : 18;

  if (printableStudents.length === 0) {
    return [{ pageNumber: 1, rows: [] }];
  }

  const sheets: PrintSheetPage<T>[] = [];
  let cursor = 0;
  let pageNum = 1;

  while (cursor < printableStudents.length) {
    const limit = pageNum === 1 ? firstPageMax : subsequentPageMax;
    const chunk = printableStudents.slice(cursor, cursor + limit).map((student, i) => ({
      student,
      globalIndex: cursor + i + 1,
    }));
    sheets.push({ pageNumber: pageNum, rows: chunk });
    cursor += limit;
    pageNum += 1;
  }

  return sheets;
};

export const exportPrintableStudentsCsv = <T extends StudentRecord>(
  printableStudents: T[],
  selectedColumns: Record<string, boolean>,
  gradeFilter: string
) => {
  const headers: string[] = [];
  if (selectedColumns.sl) headers.push('ক্রমিক');
  if (selectedColumns.roll) headers.push('রোল');
  if (selectedColumns.id) headers.push('আইডি');
  if (selectedColumns.name) headers.push('শিক্ষার্থীর নাম');
  if (selectedColumns.gender) headers.push('লিঙ্গ');
  if (selectedColumns.religion) headers.push('ধর্ম');
  if (selectedColumns.grade) headers.push('শ্রেণি ও শাখা');
  if (selectedColumns.group) headers.push('বিভাগ/গ্রুপ');
  if (selectedColumns.guardian) headers.push('পিতার নাম/অভিভাবক');
  if (selectedColumns.fatherNid) headers.push('পিতার NID');
  if (selectedColumns.motherName) headers.push('মাতার নাম');
  if (selectedColumns.motherNid) headers.push('মাতার NID');
  if (selectedColumns.mobile) headers.push('মোবাইল নম্বর');
  if (selectedColumns.optionalSubject) headers.push('ঐচ্ছিক বিষয়');
  if (selectedColumns.birthRegNo) headers.push('জন্ম নিবন্ধন');
  if (selectedColumns.dob) headers.push('জন্ম তারিখ');
  if (selectedColumns.bloodGroup) headers.push('রক্তের গ্রুপ');
  if (selectedColumns.address) headers.push('ঠিকানা');
  if (selectedColumns.stipend) headers.push('উপবৃত্তি');
  if (selectedColumns.remarks) headers.push('মন্তব্য');

  const rows = printableStudents.map((st, idx) => {
    const row: string[] = [];
    if (selectedColumns.sl) row.push(String(idx + 1));
    if (selectedColumns.roll) row.push(`"${st.roll}"`);
    if (selectedColumns.id) row.push(`"${st.id}"`);
    if (selectedColumns.name) row.push(`"${st.name}"`);
    if (selectedColumns.gender) row.push(`"${st.gender || 'পুরুষ'}"`);
    if (selectedColumns.religion) row.push(`"${st.religion || 'ইসলাম'}"`);
    if (selectedColumns.grade) row.push(`"${st.grade} (${st.branch})"`);
    if (selectedColumns.group) row.push(`"${st.group}"`);
    if (selectedColumns.guardian) row.push(`"${st.guardian || ''}"`);
    if (selectedColumns.fatherNid) row.push(`"${st.fatherNid || ''}"`);
    if (selectedColumns.motherName) row.push(`"${st.motherName || ''}"`);
    if (selectedColumns.motherNid) row.push(`"${st.motherNid || ''}"`);
    if (selectedColumns.mobile) row.push(`"${st.mobile || ''}"`);
    if (selectedColumns.optionalSubject) row.push(`"${st.optionalSubject || ''}"`);
    if (selectedColumns.birthRegNo) row.push(`"${st.birthRegNo || ''}"`);
    if (selectedColumns.dob) row.push(`"${st.dob || ''}"`);
    if (selectedColumns.bloodGroup) row.push(`"${st.bloodGroup || 'B+'}"`);
    if (selectedColumns.address) row.push(`"${st.currentAddress || ''}"`);
    if (selectedColumns.stipend) row.push(`"${st.isStipend ? 'হ্যাঁ' : 'না'}"`);
    if (selectedColumns.remarks) row.push('""');
    return row.join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Student_List_${gradeFilter}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportClassSummaryCsv = (
  classSummaryData: ClassSummaryRow[],
  summaryTotalBoys: number,
  summaryTotalGirls: number,
  summaryGrandTotal: number
) => {
  const headers = ['ক্রমিক', 'শ্রেণি', 'গ্রুপ/বিভাগ', 'ছাত্র', 'ছাত্রী', 'মোট'];
  const rows = classSummaryData.map((row, idx) =>
    [String(idx + 1), `"${row.grade}"`, `"${row.group}"`, String(row.boys), String(row.girls), String(row.total)].join(',')
  );

  rows.push(
    ['""', '"সর্বমোট"', '""', String(summaryTotalBoys), String(summaryTotalGirls), String(summaryGrandTotal)].join(',')
  );

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Student_Summary_Report_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
