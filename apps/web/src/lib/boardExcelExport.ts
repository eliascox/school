'use client';

import * as XLSX from 'xlsx';
import { Student } from '@/services/studentService';
import { SchoolSettings } from '@/services/settingsService';

const GRADES_ORDER = ['6th', '7th', '8th', '9th', '10th'];

const GRADE_LABEL: Record<string, string> = {
  '6th': '৬ষ্ঠ শ্রেণি (6th)',
  '7th': '৭ম শ্রেণি (7th)',
  '8th': '৮ম শ্রেণি (8th)',
  '9th': '৯ম শ্রেণি (9th)',
  '10th': '১০ম শ্রেণি (10th)',
};

const isFemale = (gender?: string) => {
  const g = (gender || '').toLowerCase();
  return g.includes('ছাত্রী') || g.includes('মেয়ে') || g.includes('মেয়ে') || g.includes('female') || g === 'f';
};

export interface BanbeisClassSummaryRow {
  শ্রেণি: string;
  মোট_শিক্ষার্থী: number;
  ছাত্র: number;
  ছাত্রী: number;
  বিজ্ঞান: number;
  মানবিক: number;
  ব্যবসায়_শিক্ষা: number;
  উপবৃত্তিপ্রাপ্ত: number;
  মুসলিম: number;
  অন্যান্য_ধর্ম: number;
}

/** Builds structured multi-sheet BANBEIS Excel data ready for export or unit verification. */
export function buildBANBEISData(students: Student[], settings: SchoolSettings) {
  const summaryRows: BanbeisClassSummaryRow[] = GRADES_ORDER.map((grade) => {
    const list = students.filter((s) => s.grade === grade);
    const girls = list.filter((s) => isFemale(s.gender)).length;
    const boys = list.length - girls;
    const sci = list.filter((s) => (s.group || '').includes('বিজ্ঞান') || (s.group || '').toLowerCase() === 'science').length;
    const hum = list.filter((s) => (s.group || '').includes('মানবিক') || (s.group || '').toLowerCase() === 'humanities').length;
    const com = list.filter((s) => (s.group || '').includes('ব্যবসায়') || (s.group || '').includes('ব্যবসায়') || (s.group || '').toLowerCase().includes('com')).length;
    const stipend = list.filter((s) => s.isStipend || s.stipendCategory || s.stipendStatus === 'Active').length;
    const muslim = list.filter((s) => !s.religion || s.religion.includes('ইসলাম') || s.religion.toLowerCase().includes('islam')).length;

    return {
      শ্রেণি: GRADE_LABEL[grade] || grade,
      মোট_শিক্ষার্থী: list.length,
      ছাত্র: boys,
      ছাত্রী: girls,
      বিজ্ঞান: sci,
      মানবিক: hum,
      ব্যবসায়_শিক্ষা: com,
      উপবৃত্তিপ্রাপ্ত: stipend,
      মুসলিম: muslim,
      অন্যান্য_ধর্ম: Math.max(0, list.length - muslim),
    };
  });

  const infoRows = [
    { ক্ষেত্র: 'প্রতিষ্ঠানের নাম', তথ্য: settings.schoolName || 'Smart School' },
    { ক্ষেত্র: 'EIIN নম্বর', তথ্য: settings.eiin || 'N/A' },
    { ক্ষেত্র: 'ঠিকানা', তথ্য: settings.address || 'N/A' },
    { ক্ষেত্র: 'প্রতিষ্ঠাকাল', তথ্য: settings.estdYear || 'N/A' },
    { ক্ষেত্র: 'প্রস্তুতের তারিখ', তথ্য: new Date().toISOString().split('T')[0] },
    { ক্ষেত্র: 'সর্বমোট শিক্ষার্থী', তথ্য: String(students.length) },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(infoRows), 'School_Info');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'BANBEIS_Summary');
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      students.map((s, idx) => ({
        ক্রমিক: idx + 1,
        ID: s.id,
        রোল: s.roll,
        নাম: s.name,
        শ্রেণি: GRADE_LABEL[s.grade] || s.grade,
        শাখা: s.section || s.branch || 'A',
        বিভাগ: s.group || 'সাধারণ',
        লিঙ্গ: s.gender || '',
        ধর্ম: s.religion || '',
        জন্মতারিখ: s.dob || '',
        জন্মনিবন্ধন: s.birthRegNo || '',
        পিতার_নাম: s.fatherName || s.guardian || '',
        মাতার_নাম: s.motherName || '',
        মোবাইল: s.mobile || '',
        উপবৃত্তি: s.isStipend ? s.stipendCategory || 'হ্যাঁ' : 'না',
      }))
    ),
    'Student_Roster'
  );
  return { wb, summaryRows };
}

export function downloadBANBEISWorkbook(students: Student[], settings: SchoolSettings): number {
  const { wb, summaryRows } = buildBANBEISData(students, settings);
  const fileName = `BANBEIS_Report_${settings.eiin || 'School'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return summaryRows.reduce((s, r) => s + r.মোট_শিক্ষার্থী, 0);
}

export function buildEMISWorkbook(students: Student[], settings: SchoolSettings): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const rows = students.map((s, i) => ({
    SL: i + 1,
    EIIN: settings.eiin || '',
    Student_ID: s.id,
    Roll_No: s.roll,
    Student_Name: s.name,
    Class: s.grade,
    Section: s.section || s.branch || 'A',
    Group: s.group || 'General',
    Gender: s.gender || '',
    Religion: s.religion || '',
    DOB: s.dob || '',
    Birth_Reg_No: s.birthRegNo || '',
    Board_Reg_No: s.registrationNo || '',
    Father_Name: s.fatherName || s.guardian || '',
    Father_NID: s.fatherNid || '',
    Mother_Name: s.motherName || '',
    Mother_NID: s.motherNid || '',
    Guardian_Mobile: s.mobile || '',
    Permanent_Address: s.permanentAddress || s.currentAddress || '',
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'EMIS_Students');
  return wb;
}

export function downloadEMISWorkbook(students: Student[], settings: SchoolSettings): number {
  const wb = buildEMISWorkbook(students, settings);
  XLSX.writeFile(wb, `EMIS_Export_${settings.eiin || 'School'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  return students.length;
}

export interface StipendExportRow extends Student {
  attRate?: number;
  examScore?: number;
  monthlyAmount?: number;
  isEligible?: boolean;
}

export function buildStipendBoardWorkbook(rows: StipendExportRow[], settings: SchoolSettings): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const formatted = rows.map((s, idx) => ({
    ক্রমিক: idx + 1,
    EIIN: settings.eiin || '',
    শিক্ষার্থীর_নাম: s.name,
    শ্রেণি: GRADE_LABEL[s.grade] || s.grade,
    শাখা: s.section || s.branch || 'A',
    রোল: s.roll,
    জন্মনিবন্ধন_নম্বর: s.birthRegNo || '',
    পিতা_অভিভাবকের_নাম: s.guardian || s.fatherName || '',
    পিতা_অভিভাবকের_NID: s.fatherNid || '',
    মাতার_নাম: s.motherName || '',
    মাতার_NID: s.motherNid || '',
    মোবাইল_নগদ_বিকাশ: s.mobile || '',
    উপবৃত্তি_ক্যাটাগরি: s.stipendCategory || 'সাধারণ উপবৃত্তি',
    উপস্থিতি_শতাংশ: s.attRate ?? s.attendance ?? 0,
    পরীক্ষার_গড়_নম্বর: s.examScore ?? s.examMarkAvg ?? 0,
    মাসিক_হার_টাকা: s.monthlyAmount ?? 500,
    যোগ্যতা_স্থিতি: s.isEligible ? 'যোগ্য (Eligible)' : 'স্থগিত/অযোগ্য',
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatted), 'Upobritti_Stipend_List');
  return wb;
}

export function downloadStipendBoardWorkbook(rows: StipendExportRow[], settings: SchoolSettings): number {
  const wb = buildStipendBoardWorkbook(rows, settings);
  XLSX.writeFile(wb, `Stipend_Upobritti_${settings.eiin || 'School'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  return rows.length;
}
