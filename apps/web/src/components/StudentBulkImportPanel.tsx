'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Search, 
  Filter, 
  Users, 
  Shield, 
  RefreshCw, 
  Eye, 
  Info, 
  Check, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  UserCheck,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Languages,
  Hash,
  ArrowUpDown,
  GraduationCap
} from 'lucide-react';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';
import { studentService, Student } from '@/services/studentService';
import { 
  bnToEnDigits, 
  enToBnDigits, 
  normalizeStudentRow, 
  generateGroupWiseRolls, 
  validateBulkImportBatch, 
  executeBulkImport,
  RollSortStrategy,
  GroupWiseRollResult,
  BatchValidationReport
} from '@/services/studentBulkImportEngine';

// ─── 1. BENGALI SAMPLE DATA (Pure Bengali Headers & Data per Specification) ─
export const SAMPLE_STUDENTS_BN = [
  {
    'রোল': '০১',
    'বিভাগ': 'বিজ্ঞান',
    'শিক্ষার্থীর নাম': 'সাদিয়া বিনতে সুলতান',
    'লিঙ্গ': 'মহিলা',
    'পিতার নাম': 'সুলতান মাহমুদ',
    'মাতার নাম': 'নাছিমা আক্তার',
    'ধর্ম': 'ইসলাম',
    'রেজিস্ট্রেশন নম্বর': '২১১৫৬৮৪৩০১',
    'এসএসসি রোল': '১০৬১৮১',
    'জন্ম তারিখ': '১৮/০৯/২০১০',
    'ঠিকানা': 'পূর্ব বরইতলী, চকরিয়া, কক্সবাজার',
    'মোবাইল': '০১৮১২৩৪৫৬০১',
    'ঐচ্ছিক বিষয়': 'উচ্চতর গণিত'
  },
  {
    'রোল': '০২',
    'বিভাগ': 'বিজ্ঞান',
    'শিক্ষার্থীর নাম': 'তাহমিদ ইসলাম চৌধুরী',
    'লিঙ্গ': 'পুরুষ',
    'পিতার নাম': 'নুরুল ইসলাম চৌধুরী',
    'মাতার নাম': 'আমেনা বেগম',
    'ধর্ম': 'ইসলাম',
    'রেজিস্ট্রেশন নম্বর': '২১১৫৬৮৪৩০২',
    'এসএসসি রোল': '১০৬১৮২',
    'জন্ম তারিখ': '১৫/০৩/২০১০',
    'ঠিকানা': 'দক্ষিণ বরইতলী, চকরিয়া, কক্সবাজার',
    'মোবাইল': '০১৮১২৩৪৫৬০২',
    'ঐচ্ছিক বিষয়': 'জীববিজ্ঞান'
  },
  {
    'রোল': '০১',
    'বিভাগ': 'মানবিক',
    'শিক্ষার্থীর নাম': 'ফারহানা আক্তার মিলি',
    'লিঙ্গ': 'মহিলা',
    'পিতার নাম': 'মফিজুর রহমান',
    'মাতার নাম': 'হাসিনা বেগম',
    'ধর্ম': 'ইসলাম',
    'রেজিস্ট্রেশন নম্বর': '২১১৫৬৮৪৩০৩',
    'এসএসসি রোল': '১০৬১৮৩',
    'জন্ম তারিখ': '০৩/১২/২০১০',
    'ঠিকানা': 'গোয়াবাগান, বরইতলী, চকরিয়া, কক্সবাজার',
    'মোবাইল': '০১৮১২৩৪৫৬০৩',
    'ঐচ্ছিক বিষয়': 'কৃষি শিক্ষা'
  },
  {
    'রোল': '০২',
    'বিভাগ': 'মানবিক',
    'শিক্ষার্থীর নাম': 'অনিন্দ্য পাল দীপ',
    'লিঙ্গ': 'পুরুষ',
    'পিতার নাম': 'সুনীল কুমার পাল',
    'মাতার নাম': 'সুচিত্রা সেন পাল',
    'ধর্ম': 'হিন্দু',
    'রেজিস্ট্রেশন নম্বর': '২১১৫৬৮৪৩০৪',
    'এসএসসি রোল': '১০৬১৮৪',
    'জন্ম তারিখ': '১০/০৫/২০১০',
    'ঠিকানা': 'শান্তিবাজার, হারবাং, চকরিয়া, কক্সবাজার',
    'মোবাইল': '০১৭১২৩৪৫৬০৪',
    'ঐচ্ছিক বিষয়': 'পৌরনীতি ও নাগরিকতা'
  },
  {
    'রোল': '০১',
    'বিভাগ': 'ব্যবসায় শিক্ষা',
    'শিক্ষার্থীর নাম': 'তানভীর আহমেদ রিফাত',
    'লিঙ্গ': 'পুরুষ',
    'পিতার নাম': 'কামরুল আহসান',
    'মাতার নাম': 'শাহিনুর বেগম',
    'ধর্ম': 'ইসলাম',
    'রেজিস্ট্রেশন নম্বর': '২১১৫৬৮৪৩০৫',
    'এসএসসি রোল': '১০৬১৮৫',
    'জন্ম তারিখ': '২৫/০১/২০১০',
    'ঠিকানা': 'কলেজ রোড, চকরিয়া, কক্সবাজার',
    'মোবাইল': '০১৮১২৩৪৫৬০৫',
    'ঐচ্ছিক বিষয়': 'কৃষি শিক্ষা'
  },
  {
    'রোল': '০২',
    'বিভাগ': 'ব্যবসায় শিক্ষা',
    'শিক্ষার্থীর নাম': 'শ্রাবন্তী দাশ তিথী',
    'লিঙ্গ': 'মহিলা',
    'পিতার নাম': 'সুধীর চন্দ্র দাশ',
    'মাতার নাম': 'সন্ধ্যা রানী দাশ',
    'ধর্ম': 'হিন্দু',
    'রেজিস্ট্রেশন নম্বর': '২১১৫৬৮৪৩০৬',
    'এসএসসি রোল': '১০৬১৮৬',
    'জন্ম তারিখ': '১৪/০৮/২০১০',
    'ঠিকানা': 'মাস্টারপাড়া, বরইতলী, চকরিয়া, কক্সবাজার',
    'মোবাইল': '০১৭১২৩৪৫৬০৬',
    'ঐচ্ছিক বিষয়': 'গার্হস্থ্য বিজ্ঞান'
  }
];

// ─── 2. ENGLISH SAMPLE DATA (Exact English Headers per User Specification) ─
// Order: Roll, Group, Student Name, Gender, Father's Name, Mother's Name, Religion, Registration Number, SSC Roll, Date of Birth, Address, Mobile, Optional Subject
export const SAMPLE_STUDENTS_EN = [
  {
    'Roll': '01',
    'Group': 'Science',
    'Student Name': 'Sadia Binte Sultan',
    'Gender': 'Female',
    "Father's Name": 'Sultan Mahmud',
    "Mother's Name": 'Nasima Akhter',
    'Religion': 'Islam',
    'Registration Number': '2115684301',
    'SSC Roll': '106181',
    'Date of Birth': '2010-09-18',
    'Address': 'East Baraitali, Chakaria, Coxs Bazar',
    'Mobile': '01812345601',
    'Optional Subject': 'Higher Mathematics'
  },
  {
    'Roll': '02',
    'Group': 'Science',
    'Student Name': 'Tahmid Islam Chowdhury',
    'Gender': 'Male',
    "Father's Name": 'Nurul Islam Chowdhury',
    "Mother's Name": 'Amena Begum',
    'Religion': 'Islam',
    'Registration Number': '2115684302',
    'SSC Roll': '106182',
    'Date of Birth': '2010-03-15',
    'Address': 'South Baraitali, Chakaria, Coxs Bazar',
    'Mobile': '01812345602',
    'Optional Subject': 'Biology'
  },
  {
    'Roll': '01',
    'Group': 'Humanities',
    'Student Name': 'Farhana Akhter Mili',
    'Gender': 'Female',
    "Father's Name": 'Mofizur Rahman',
    "Mother's Name": 'Hasina Begum',
    'Religion': 'Islam',
    'Registration Number': '2115684303',
    'SSC Roll': '106183',
    'Date of Birth': '2010-12-03',
    'Address': 'Goabagan, Baraitali, Chakaria, Coxs Bazar',
    'Mobile': '01812345603',
    'Optional Subject': 'Agriculture Studies'
  },
  {
    'Roll': '02',
    'Group': 'Humanities',
    'Student Name': 'Anindya Paul Dip',
    'Gender': 'Male',
    "Father's Name": 'Sunil Kumar Paul',
    "Mother's Name": 'Suchitra Sen Paul',
    'Religion': 'Hindu',
    'Registration Number': '2115684304',
    'SSC Roll': '106184',
    'Date of Birth': '2010-05-10',
    'Address': 'Shantibazar, Harbang, Chakaria, Coxs Bazar',
    'Mobile': '01712345604',
    'Optional Subject': 'Civics'
  },
  {
    'Roll': '01',
    'Group': 'Business Studies',
    'Student Name': 'Tanvir Ahmed Rifat',
    'Gender': 'Male',
    "Father's Name": 'Kamrul Ahsan',
    "Mother's Name": 'Shahinur Begum',
    'Religion': 'Islam',
    'Registration Number': '2115684305',
    'SSC Roll': '106185',
    'Date of Birth': '2010-01-25',
    'Address': 'College Road, Chakaria, Coxs Bazar',
    'Mobile': '01812345605',
    'Optional Subject': 'Agriculture Studies'
  },
  {
    'Roll': '02',
    'Group': 'Business Studies',
    'Student Name': 'Srabanti Das Tithi',
    'Gender': 'Female',
    "Father's Name": 'Sudhir Chandra Das',
    "Mother's Name": 'Sandhya Rani Das',
    'Religion': 'Hindu',
    'Registration Number': '2115684306',
    'SSC Roll': '106186',
    'Date of Birth': '2010-08-14',
    'Address': 'Masterpara, Baraitali, Chakaria, Coxs Bazar',
    'Mobile': '01712345606',
    'Optional Subject': 'Home Science'
  }
];

// ─── 3. FIELD SPECIFICATION GUIDE (Exact 13 Specified Columns) ──────────────
export const FIELD_GUIDE_ROWS = [
  { field: 'Roll', bnName: 'রোল', required: 'আবশ্যক', sampleEn: '01', sampleBn: '০১', desc: 'শিক্ষার্থীর রোল নম্বর (বিজ্ঞান, মানবিক বা ব্যবসায় শিক্ষা অনুসারে)' },
  { field: 'Group', bnName: 'বিভাগ / গ্রুপ', required: 'আবশ্যক', sampleEn: 'Science / Humanities / Business Studies', sampleBn: 'বিজ্ঞান / মানবিক / ব্যবসায় শিক্ষা', desc: 'বিজ্ঞান (Science), মানবিক (Humanities), ব্যবসায় শিক্ষা (Business Studies)' },
  { field: 'Student Name', bnName: 'শিক্ষার্থীর নাম', required: 'আবশ্যক', sampleEn: 'Sadia Binte Sultan', sampleBn: 'সাদিয়া বিনতে সুলতান', desc: 'ইংরেজি বা বাংলা পূর্ণাঙ্গ নাম' },
  { field: 'Gender', bnName: 'লিঙ্গ', required: 'ঐচ্ছিক', sampleEn: 'Male / Female', sampleBn: 'পুরুষ / মহিলা', desc: 'পুরুষ (Male) বা মহিলা (Female)' },
  { field: "Father's Name", bnName: 'পিতার নাম', required: 'ঐচ্ছিক', sampleEn: 'Sultan Mahmud', sampleBn: 'সুলতান মাহমুদ', desc: 'পিতার পূর্ণ নাম' },
  { field: "Mother's Name", bnName: 'মাতার নাম', required: 'ঐচ্ছিক', sampleEn: 'Nasima Akhter', sampleBn: 'নাছিমা আক্তার', desc: 'মাতার পূর্ণ নাম' },
  { field: 'Religion', bnName: 'ধর্ম', required: 'ঐচ্ছিক', sampleEn: 'Islam / Hindu / Buddhist / Christian', sampleBn: 'ইসলাম / হিন্দু / বৌদ্ধ / খ্রিস্টান', desc: 'ধর্মবিশ্বাস' },
  { field: 'Registration Number', bnName: 'রেজিস্ট্রেশন নম্বর', required: 'ঐচ্ছিক (৯ম-১০ম)', sampleEn: '2115684301', sampleBn: '২১১৫৬৮৪৩০১', desc: 'শিক্ষা বোর্ড প্রদত্ত রেজিস্ট্রেশন নম্বর (১০ ডিজিট)' },
  { field: 'SSC Roll', bnName: 'এসএসসি রোল', required: 'ঐচ্ছিক', sampleEn: '106184', sampleBn: '১০৬১৮৪', desc: 'শিক্ষা বোর্ড প্রদত্ত এসএসসি রোল নম্বর (৬ ডিজিট)' },
  { field: 'Date of Birth', bnName: 'জন্ম তারিখ', required: 'ঐচ্ছিক', sampleEn: '2010-09-18', sampleBn: '১৮/০৯/২০১০', desc: 'YYYY-MM-DD অথবা DD/MM/YYYY' },
  { field: 'Address', bnName: 'ঠিকানা', required: 'ঐচ্ছিক', sampleEn: 'East Baraitali, Chakaria', sampleBn: 'পূর্ব বরইতলী, চকরিয়া', desc: 'বর্তমান বা স্থায়ী ঠিকানা' },
  { field: 'Mobile', bnName: 'মোবাইল নম্বর', required: 'প্রস্তাবিত', sampleEn: '01812345601', sampleBn: '০১৮১২৩৪৫৬০১', desc: '১১ ডিজিটের মোবাইল নম্বর' },
  { field: 'Optional Subject', bnName: 'ঐচ্ছিক বিষয় / ৪র্থ বিষয়', required: 'ঐচ্ছিক', sampleEn: 'Higher Mathematics / Agriculture Studies', sampleBn: 'উচ্চতর গণিত / কৃষি শিক্ষা', desc: 'শিক্ষার্থীর ৪র্থ বা ঐচ্ছিক বিষয়' }
];

interface StudentBulkImportPanelProps {
  onSuccess?: (count: number) => void;
  compactMode?: boolean;
}

export default function StudentBulkImportPanel({ onSuccess, compactMode = false }: StudentBulkImportPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [rawParsedStudents, setRawParsedStudents] = useState<Student[]>([]);
  const [rollSortStrategy, setRollSortStrategy] = useState<RollSortStrategy>('roll_asc');
  const [keepUploadedRoll, setKeepUploadedRoll] = useState<boolean>(true); // 🛡️ Default true: retaining uploaded rolls sorted group & roll-wise
  const [autoAssignRolls, setAutoAssignRolls] = useState<boolean>(true);
  const [selectedSaveMode, setSelectedSaveMode] = useState<'merge' | 'replace_grade' | 'replace'>('merge');
  const [groupTabFilter, setGroupTabFilter] = useState<'all' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা'>('all');
  const [searchPreview, setSearchPreview] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [validationReport, setValidationReport] = useState<BatchValidationReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats of current DB
  const [currentDbStats, setCurrentDbStats] = useState({ total: 0, byGrade: {} as Record<string, number> });

  const loadDbStats = () => {
    if (typeof window !== 'undefined') {
      const all = studentService.getAllStudents();
      const byGrade: Record<string, number> = {};
      all.forEach((s) => {
        const g = s.grade || s.gradeBn || 'অন্যান্য';
        byGrade[g] = (byGrade[g] || 0) + 1;
      });
      setCurrentDbStats({ total: all.length, byGrade });
    }
  };

  useEffect(() => {
    loadDbStats();
  }, []);

  // ─── REACTIVE GROUP-WISE ROLL & SORT ENGINE ────────────────────────────────
  const rolledResult: GroupWiseRollResult = useMemo(() => {
    if (rawParsedStudents.length === 0) {
      return {
        students: [],
        groupStats: { science: 0, humanities: 0, business: 0, general: 0, total: 0 },
        rollRanges: {},
      };
    }

    if (!autoAssignRolls) {
      const sci = rawParsedStudents.filter((s) => s.group === 'বিজ্ঞান').length;
      const hum = rawParsedStudents.filter((s) => s.group === 'মানবিক').length;
      const bus = rawParsedStudents.filter((s) => s.group === 'ব্যবসায় শিক্ষা').length;
      return {
        students: rawParsedStudents,
        groupStats: {
          science: sci,
          humanities: hum,
          business: bus,
          general: rawParsedStudents.length - (sci + hum + bus),
          total: rawParsedStudents.length,
        },
        rollRanges: {},
      };
    }

    // 🛡️ Passes keepUploadedRoll to keep uploaded roll while sorting A-Z
    return generateGroupWiseRolls(rawParsedStudents, rollSortStrategy, '9th', keepUploadedRoll);
  }, [rawParsedStudents, rollSortStrategy, autoAssignRolls, keepUploadedRoll]);

  // Run validation whenever rolled results change
  useEffect(() => {
    if (rolledResult.students.length > 0) {
      const report = validateBulkImportBatch(rolledResult.students);
      setValidationReport(report);
    } else {
      setValidationReport(null);
    }
  }, [rolledResult.students]);

  // ─── DOWNLOAD EXCEL (BENGALI OR ENGLISH FORMAT) ──────────────────────────
  const downloadExcelTemplate = (lang: 'bn' | 'en') => {
    try {
      const data = lang === 'bn' ? SAMPLE_STUDENTS_BN : SAMPLE_STUDENTS_EN;
      const wsStudents = XLSX.utils.json_to_sheet(data);

      wsStudents['!cols'] = [
        { wch: 10 }, // Roll
        { wch: 20 }, // Group
        { wch: 28 }, // Student Name
        { wch: 12 }, // Gender
        { wch: 26 }, // Father's Name
        { wch: 26 }, // Mother's Name
        { wch: 14 }, // Religion
        { wch: 22 }, // Registration Number
        { wch: 16 }, // SSC Roll
        { wch: 16 }, // Date of Birth
        { wch: 38 }, // Address
        { wch: 18 }, // Mobile
        { wch: 22 }  // Optional Subject
      ];

      const wsGuide = XLSX.utils.json_to_sheet(
        FIELD_GUIDE_ROWS.map((g) => ({
          'কলাম (English)': g.field,
          'বাংলা শিরোনাম (Bengali)': g.bnName,
          'স্ট্যাটাস (Status)': g.required,
          'নমুনা মান (English)': g.sampleEn,
          'নমুনা মান (বাংলা)': g.sampleBn,
          'নিয়মাবলী (Instructions)': g.desc
        }))
      );
      wsGuide['!cols'] = [{ wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 24 }, { wch: 24 }, { wch: 60 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsStudents, lang === 'bn' ? 'শিক্ষার্থী_তালিকা' : 'Class_9_Students');
      XLSX.utils.book_append_sheet(wb, wsGuide, 'Field_Guide');

      const fileName = lang === 'bn' 
        ? `Class_9_Student_Bulk_Import_Bengali_২০২৬.xlsx`
        : `Class_9_Student_Bulk_Import_English_2026.xlsx`;

      XLSX.writeFile(wb, fileName);
      setAlertInfo({
        type: 'success',
        message: `${lang === 'bn' ? 'বাংলা' : 'ইংরেজি'} কলাম সম্বলিত এক্সেল টেমপ্লেট সফলভাবে ডাউনলোড হয়েছে! তথ্য পূরণ করে নিচে আপলোড করুন।`
      });
    } catch (e: any) {
      console.error(e);
      setAlertInfo({ type: 'error', message: 'এক্সেল তৈরি ব্যর্থ: ' + (e.message || '') });
    }
  };

  // ─── DOWNLOAD CSV (BENGALI OR ENGLISH FORMAT) ────────────────────────────
  const downloadCsvTemplate = (lang: 'bn' | 'en') => {
    try {
      const data = lang === 'bn' ? SAMPLE_STUDENTS_BN : SAMPLE_STUDENTS_EN;
      const headers = Object.keys(data[0]);
      const rows = data.map((row) => headers.map((h) => `"${(row as any)[h] || ''}"`).join(','));
      const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = lang === 'bn'
        ? `Class_9_Student_Bulk_Import_Bengali_২০২৬.csv`
        : `Class_9_Student_Bulk_Import_English_2026.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setAlertInfo({
        type: 'success',
        message: `${lang === 'bn' ? 'বাংলা' : 'ইংরেজি'} কলাম সম্বলিত CSV টেমপ্লেট সফলভাবে ডাউনলোড হয়েছে!`
      });
    } catch (e: any) {
      console.error(e);
      setAlertInfo({ type: 'error', message: 'CSV তৈরি ব্যর্থ: ' + (e.message || '') });
    }
  };

  // ─── 4. FILE UPLOAD & PARSER (XLSX / XLS / CSV) ──────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsing(true);
    setAlertInfo(null);

    try {
      const rawJsonRows: any[] = [];

      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        
        // Multi-Sheet Engine: filter out guide sheets and parse student sheets
        const ignoredSheets = ['field_guide', 'fieldguide', 'guide', 'instructions', 'instruction', 'নিয়মাবলী', 'সহায়িকা', 'নির্দেশিকা'];
        const studentSheets = workbook.SheetNames.filter((sn) => {
          const lower = sn.toLowerCase().trim().replace(/[\s_\-]+/g, '');
          return !ignoredSheets.some((ign) => lower.includes(ign));
        });

        const sheetsToRead = studentSheets.length > 0 ? studentSheets : [workbook.SheetNames[0]];

        for (const sheetName of sheetsToRead) {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) continue;
          const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          if (!rows || rows.length === 0) continue;

          // Detect implied Group from Sheet Name (e.g. 'Science', 'Humanities', 'Commerce', 'বিজ্ঞান')
          const sLower = sheetName.toLowerCase().trim();
          let sheetGroup = '';
          if (sLower.includes('বিজ্ঞান') || sLower.includes('science') || sLower.includes('sci')) {
            sheetGroup = 'বিজ্ঞান';
          } else if (sLower.includes('মানবিক') || sLower.includes('humanities') || sLower.includes('arts')) {
            sheetGroup = 'মানবিক';
          } else if (sLower.includes('ব্যবসায়') || sLower.includes('ব্যবসায়') || sLower.includes('বাণিজ্য') || sLower.includes('commerce') || sLower.includes('business')) {
            sheetGroup = 'ব্যবসায় শিক্ষা';
          }

          let sheetGrade = '';
          if (sLower.includes('৯') || sLower.includes('9th') || sLower.includes('nine')) sheetGrade = '9th';
          else if (sLower.includes('১০') || sLower.includes('10th') || sLower.includes('ten')) sheetGrade = '10th';
          else if (sLower.includes('৮') || sLower.includes('8th')) sheetGrade = '8th';
          else if (sLower.includes('৭') || sLower.includes('7th')) sheetGrade = '7th';
          else if (sLower.includes('৬') || sLower.includes('6th')) sheetGrade = '6th';

          rows.forEach((r) => {
            const hasData = Object.values(r).some((v) => v !== null && v !== undefined && String(v).trim().length > 0);
            if (hasData) {
              rawJsonRows.push({
                ...r,
                _sheetGroup: sheetGroup,
                _sheetGrade: sheetGrade
              });
            }
          });
        }
      } else {
        // CSV or TXT
        const text = await selectedFile.text();
        const workbook = XLSX.read(text, { type: 'string' });
        const firstSheet = workbook.SheetNames[0];
        const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
        rows.forEach((r) => {
          const hasData = Object.values(r).some((v) => v !== null && v !== undefined && String(v).trim().length > 0);
          if (hasData) rawJsonRows.push(r);
        });
      }

      if (!rawJsonRows || rawJsonRows.length === 0) {
        throw new Error('ফাইলে কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি!');
      }

      const validRows = rawJsonRows.filter((r) =>
        Object.values(r).some((v) => v !== null && v !== undefined && String(v).trim().length > 0)
      );

      const parsed = validRows.map((row, idx) => normalizeStudentRow(row, idx));
      setRawParsedStudents(parsed);

      setAlertInfo({
        type: 'success',
        message: `ফাইল সফলভাবে পার্স হয়েছে! মোট ${parsed.length} জন শিক্ষার্থীর তথ্য সনাক্ত হয়েছে। স্বয়ংক্রিয় গ্রুপভিত্তিক রোল জেনারেশন সক্রিয় রয়েছে। নিচের প্রিভিউ পর্যালোচনা করুন।`
      });
    } catch (err: any) {
      console.error(err);
      setRawParsedStudents([]);
      setAlertInfo({
        type: 'error',
        message: 'ফাইল পার্স করতে ব্যর্থ: ' + (err.message || 'অনুগ্রহ করে সঠিক এক্সেল বা সিএসভি ফরম্যাট আপলোড করুন।')
      });
    } finally {
      setParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ─── 5. FILTERED PREVIEW STUDENTS ────────────────────────────────────────
  const filteredPreview = useMemo(() => {
    return rolledResult.students.filter((st) => {
      const matchGroup = groupTabFilter === 'all' || st.group === groupTabFilter;
      const q = searchPreview.toLowerCase();
      const matchSearch =
        !q ||
        st.name.toLowerCase().includes(q) ||
        st.roll.includes(q) ||
        (st.prevRoll && st.prevRoll.includes(q)) ||
        (st.mobile && st.mobile.includes(q)) ||
        (st.fatherName && st.fatherName.toLowerCase().includes(q)) ||
        (st.motherName && st.motherName.toLowerCase().includes(q)) ||
        (st.currentAddress && st.currentAddress.toLowerCase().includes(q));
      return matchGroup && matchSearch;
    });
  }, [rolledResult.students, groupTabFilter, searchPreview]);

  // ─── 6. SAVE TO DATABASE HANDLER (REQUIREMENT 6) ──────────────────────────
  const handleSaveToDatabase = async () => {
    if (rolledResult.students.length === 0) return;

    if (validationReport && !validationReport.canProceed) {
      showToast(`সতর্কতা: ফাইলে ${validationReport.errorCount} টি গুরুতর ত্রুটি রয়েছে। অনুগ্রহ করে ত্রুটিযুক্ত রো-গুলো সংশোধন করুন।`, 'warning');
      return;
    }

    if (selectedSaveMode === 'replace') {
      const confirmed = await confirmDialog({
        title: 'চূড়ান্ত সতর্কতা',
        message: `আপনি "সম্পূর্ণ ডাটাবেজ প্রতিস্থাপন (Replace All)" নির্বাচন করেছেন!\nবিদ্যমান ${currentDbStats.total} জন শিক্ষার্থীর রেকর্ড মুছে নতুন ${rolledResult.students.length} জন শিক্ষার্থী প্রতিস্থাপন করা হবে।\nআপনি কি নিশ্চিত?`,
        confirmLabel: 'প্রতিস্থাপন করুন',
        danger: true,
      });
      if (!confirmed) return;
    } else if (selectedSaveMode === 'replace_grade') {
      const confirmed = await confirmDialog({
        title: 'শ্রেণি প্রতিস্থাপন নিশ্চিতকরণ',
        message: `সতর্কতা: শুধুমাত্র ৯ম শ্রেণির বিদ্যমান শিক্ষার্থীদের মুছে নতুন তালিকা দিয়ে প্রতিস্থাপন করা হবে। অন্য শ্রেণির রেকর্ড অপরিবর্তিত থাকবে। এগিয়ে যেতে চান?`,
        confirmLabel: 'এগিয়ে যান',
        danger: true,
      });
      if (!confirmed) return;
    }

    const execResult = executeBulkImport(rolledResult.students, {
      mode: selectedSaveMode,
      sortStrategy: rollSortStrategy,
      targetGrade: '9th',
      autoAssignRolls,
      keepUploadedRoll,
      performedBy: 'অ্যাডমিন / প্রধান শিক্ষক',
      abortOnError: true
    });

    if (execResult.success) {
      setAlertInfo({
        type: 'success',
        message: `🎉 অভিনন্দন! সফলভাবে মোট ${execResult.importedCount} জন শিক্ষার্থীর তথ্য লোকাল ডাটাবেজে সংরক্ষিত হয়েছে এবং গুগল ক্লাউড সার্ভারে (Firebase) স্বয়ংক্রিয়ভাবে সিঙ্ক হচ্ছে! (বিজ্ঞান: ${execResult.groupStats.science} জন, মানবিক: ${execResult.groupStats.humanities} জন, ব্যবসায় শিক্ষা: ${execResult.groupStats.business} জন)`
      });
      loadDbStats();
      if (onSuccess) {
        onSuccess(execResult.importedCount);
      }
    } else {
      setAlertInfo({
        type: 'error',
        message: execResult.message
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* 🌟 1. BANNER & STATS CARD */}
      <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-purple-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold tracking-wide text-violet-100 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>৯ম শ্রেণি: গ্রুপভিত্তিক স্বয়ংক্রিয় রোল জেনারেশন ইঞ্জিন (Group-wise Auto Roll)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              বাল্ক শিক্ষার্থী আপলোড (বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা)
            </h2>
            <p className="text-xs sm:text-sm text-violet-100/90 max-w-2xl leading-relaxed">
              এক্সেলে এলোমেলো বা ডুপ্লিকেট রোল থাকলেও সিস্টেম স্বয়ংক্রিয়ভাবে <strong>বিজ্ঞান (Science)</strong>, <strong>মানবিক (Humanities)</strong> ও <strong>ব্যবসায় শিক্ষা (Business Studies)</strong> গ্রুপ আলাদা করে প্রতিটি গ্রুপের জন্য ১ থেকে ক্রমানুসারে নতুন রোল তৈরি করবে।
            </p>
          </div>

          {/* Database Counter */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 text-center min-w-[140px] shrink-0">
            <span className="text-[11px] font-bold text-violet-200 block">বর্তমান শিক্ষার্থী সংখ্যা</span>
            <span className="text-2xl font-black text-white font-mono">{currentDbStats.total} জন</span>
            <span className="text-[10px] text-emerald-300 font-semibold block mt-0.5">অটো-রোল ইঞ্জিন সক্রিয়</span>
          </div>
        </div>
      </div>

      {/* 🌟 2. DOWNLOAD TEMPLATES */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-violet-600" />
              ধাপ ১: পছন্দের ভাষায় নমুনা ফরম্যাট ডাউনলোড করুন
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ইংরেজি (English) বা বাংলা (Bengali) যেকোনো একটি ফরম্যাটে শিক্ষার্থীদের তথ্য পূরণ করুন
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
          >
            <Info className="w-4 h-4 text-violet-600" />
            <span>কলাম নির্দেশিকা {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</span>
          </button>
        </div>

        {/* 2 Format Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* English Format Card */}
          <div className="p-4 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-md">English Format</span>
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Standard English Headers</span>
              </div>
              <span className="text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold">প্রস্তাবিত</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              কলামসমূহ: <span className="font-semibold text-slate-800 dark:text-slate-200">Roll, Group, Student Name, Gender, Father&apos;s Name, Mother&apos;s Name, Religion, Registration Number, SSC Roll, Date of Birth, Address, Mobile, Optional Subject</span>
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => downloadExcelTemplate('en')}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> English Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => downloadCsvTemplate('en')}
                className="py-2 px-3 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>

          {/* Bengali Format Card */}
          <div className="p-4 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-md">বাংলা ফরম্যাট</span>
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">খাঁটি বাংলা হেডার ও ডাটা</span>
              </div>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">সহজ</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              কলামসমূহ: <span className="font-semibold text-slate-800 dark:text-slate-200">রোল, বিভাগ, শিক্ষার্থীর নাম, লিঙ্গ, পিতার নাম, মাতার নাম, ধর্ম, রেজিস্ট্রেশন নম্বর, এসএসসি রোল, জন্ম তারিখ, ঠিকানা, মোবাইল, ঐচ্ছিক বিষয়</span>
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => downloadExcelTemplate('bn')}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> বাংলা Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => downloadCsvTemplate('bn')}
                className="py-2 px-3 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Field Reference Table */}
        {showGuide && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-violet-600" />
                কলাম ও ফিল্ড নির্দেশিকা (মোট {FIELD_GUIDE_ROWS.length} টি কলাম)
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                ইংরেজি বা বাংলা যেকোনো কলাম হেডার স্বয়ংক্রিয়ভাবে শনাক্ত হবে
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold sticky top-0">
                  <tr>
                    <th className="p-2 border-b">কলামের নাম (English)</th>
                    <th className="p-2 border-b">বাংলা শিরোনাম</th>
                    <th className="p-2 border-b">আবশ্যিকতা</th>
                    <th className="p-2 border-b">নমুনা মান (English)</th>
                    <th className="p-2 border-b">নমুনা মান (বাংলা)</th>
                    <th className="p-2 border-b">নিয়মাবলী</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                  {FIELD_GUIDE_ROWS.map((g, i) => (
                    <tr key={i} className="hover:bg-violet-50/40 dark:hover:bg-slate-800">
                      <td className="p-2 font-mono font-bold text-indigo-700 dark:text-indigo-400">{g.field}</td>
                      <td className="p-2 font-bold">{g.bnName}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.required.includes('আবশ্যক')
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {g.required}
                        </span>
                      </td>
                      <td className="p-2 font-mono text-indigo-700 dark:text-indigo-400 font-bold">{g.sampleEn}</td>
                      <td className="p-2 font-mono text-emerald-700 dark:text-emerald-400 font-bold">{g.sampleBn}</td>
                      <td className="p-2 text-[11px] text-slate-500 dark:text-slate-400">{g.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 🌟 3. UPLOAD DROPZONE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-violet-600" />
            ধাপ ২: পূরণকৃত ফাইল আপলোড করুন
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            সাপোর্টেড ফরম্যাট: .xlsx, .xls, .csv, .txt (৯ম শ্রেণির ৯০ জন শিক্ষার্থীর তথ্য একসাথে আপলোডযোগ্য)
          </p>
        </div>

        {/* Dropzone Container */}
        <div className="p-8 border-2 border-dashed border-violet-300 dark:border-violet-800/80 bg-violet-50/30 dark:bg-violet-950/20 rounded-2xl text-center space-y-3 transition-all hover:bg-violet-50/60">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/30">
            {parsing ? <RefreshCw className="w-8 h-8 animate-spin" /> : <FileSpreadsheet className="w-8 h-8" />}
          </div>

          <div>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-lg cursor-pointer transition-all active:scale-95">
              <Upload className="w-4 h-4" />
              <span>{file ? `ফাইল পরিবর্তন করুন (${file.name})` : 'ফাইল নির্বাচন করুন (.xlsx / .csv)'}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, .txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-2">
              কম্পিউটার থেকে ড্রাগ করে এখানে ছেড়ে দিন অথবা ব্রাউজ করুন
            </p>
          </div>
        </div>

        {/* Notifications */}
        {alertInfo && (
          <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border shadow-xs animate-in fade-in ${
            alertInfo.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
              : alertInfo.type === 'warning'
              ? 'bg-amber-50 text-amber-950 border-amber-300 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-200'
              : 'bg-rose-50 text-rose-950 border-rose-300 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {alertInfo.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : alertInfo.type === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{alertInfo.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlertInfo(null)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold ml-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Validation Issues Alert Box (Requirement 5) */}
        {validationReport && validationReport.errors.length > 0 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>ফাইলে {validationReport.errorCount} টি গুরুতর ত্রুটি এবং {validationReport.warningCount} টি সতর্কতা পাওয়া গেছে:</span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] text-amber-800 dark:text-amber-300 pl-6">
              {validationReport.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="font-mono font-bold">•</span>
                  <span>{err.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 🌟 4. PREVIEW & ROLL GENERATION DASHBOARD (REQUIREMENTS 3 & 4) */}
      {rolledResult.students.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
          {/* Header & Main Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  ধাপ ৩: শিক্ষার্থী প্রিভিউ ও গ্রুপভিত্তিক স্বয়ংক্রিয় রোল
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                মোট প্রাপ্ত: <span className="text-violet-700 dark:text-violet-400 font-black font-mono text-sm">{rolledResult.students.length} জন</span> শিক্ষার্থী।
                সিস্টেম প্রতিটি গ্রুপের জন্য স্বাধীনভাবে ১ থেকে নতুন রোল তৈরি করেছে।
              </p>
            </div>

            {/* Save Mode Selector & Commit Button */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setSelectedSaveMode('merge')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedSaveMode === 'merge'
                      ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="বিদ্যমান শিক্ষার্থীদের সাথে নতুন শিক্ষার্থী মার্জ করবে"
                >
                  মার্জ ও আপডেট
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSaveMode('replace_grade')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedSaveMode === 'replace_grade'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="শুধুমাত্র ৯ম শ্রেণির পূর্ববর্তী শিক্ষার্থী প্রতিস্থাপন করবে"
                >
                  ৯ম শ্রেণি প্রতিস্থাপন
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSaveMode('replace')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedSaveMode === 'replace'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="সম্পূর্ণ স্কুল ডাটাবেজ প্রতিস্থাপন করবে"
                >
                  সকল প্রতিস্থাপন
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveToDatabase}
                disabled={validationReport ? !validationReport.canProceed : false}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>ডাটাবেজে সংরক্ষণ করুন ({rolledResult.students.length})</span>
              </button>
            </div>
          </div>

          {/* 🌟 4.1 GROUP BREAKDOWN PREVIEW CARDS (CORE REQUIREMENT 4) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Detected Card */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-violet-600" />
                মোট সনাক্তকৃত
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {rolledResult.groupStats.total} জন
                </span>
                <span className="text-xs text-slate-500 font-medium">৯ম শ্রেণি</span>
              </div>
            </div>

            {/* Science Card */}
            <div className="p-3.5 rounded-2xl border-2 border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-1">
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase flex items-center gap-1">
                🔬 বিজ্ঞান (Science)
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-blue-950 dark:text-blue-200 font-mono">
                  {rolledResult.groupStats.science} জন
                </span>
                <span className="text-xs font-black text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded-md">
                  রোল: {rolledResult.rollRanges['বিজ্ঞান']?.rangeBn || '০১–' + enToBnDigits(rolledResult.groupStats.science)}
                </span>
              </div>
            </div>

            {/* Humanities Card */}
            <div className="p-3.5 rounded-2xl border-2 border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 space-y-1">
              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase flex items-center gap-1">
                📚 মানবিক (Humanities)
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-purple-950 dark:text-purple-200 font-mono">
                  {rolledResult.groupStats.humanities} জন
                </span>
                <span className="text-xs font-black text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900 px-2 py-0.5 rounded-md">
                  রোল: {rolledResult.rollRanges['মানবিক']?.rangeBn || '০১–' + enToBnDigits(rolledResult.groupStats.humanities)}
                </span>
              </div>
            </div>

            {/* Business Studies Card */}
            <div className="p-3.5 rounded-2xl border-2 border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-1">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase flex items-center gap-1">
                💼 ব্যবসায় শিক্ষা (Business)
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-950 dark:text-amber-200 font-mono">
                  {rolledResult.groupStats.business} জন
                </span>
                <span className="text-xs font-black text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900 px-2 py-0.5 rounded-md">
                  রোল: {rolledResult.rollRanges['ব্যবসায় শিক্ষা']?.rangeBn || '০১–' + enToBnDigits(rolledResult.groupStats.business)}
                </span>
              </div>
            </div>
          </div>

          {/* 🌟 4.2 ROLL & SORT STRATEGY BAR */}
          <div className="p-4 bg-gradient-to-r from-slate-50 to-violet-50/40 dark:from-slate-800/60 dark:to-violet-950/20 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  রোল নম্বর ও নামানুসারে (A–Z) সাজানোর পদ্ধতি
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  {keepUploadedRoll
                    ? 'আপলোডকৃত ফাইলের রোল নম্বর অক্ষুণ্ণ রেখে শিক্ষার্থীদের নামানুসারে (A–Z) সাজানো হচ্ছে।'
                    : 'প্রতিটি গ্রুপের জন্য ১ থেকে ক্রমানুসারে নতুন ক্রমিক রোল তৈরি হচ্ছে (১, ২, ৩...)।'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch md:self-auto">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                রোল ও সর্টিং মোড:
              </span>
              <select
                value={
                  keepUploadedRoll
                    ? rollSortStrategy === 'roll_asc'
                      ? 'keep_roll_asc'
                      : rollSortStrategy === 'name_asc'
                      ? 'keep_name_asc'
                      : 'keep_file_order'
                    : 'reassign_1_to_n'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'keep_roll_asc') {
                    setKeepUploadedRoll(true);
                    setRollSortStrategy('roll_asc');
                  } else if (val === 'keep_name_asc') {
                    setKeepUploadedRoll(true);
                    setRollSortStrategy('name_asc');
                  } else if (val === 'keep_file_order') {
                    setKeepUploadedRoll(true);
                    setRollSortStrategy('file_order');
                  } else if (val === 'reassign_1_to_n') {
                    setKeepUploadedRoll(false);
                    setRollSortStrategy('roll_asc');
                  }
                }}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-violet-300 dark:border-violet-700 rounded-xl text-xs font-black text-violet-700 dark:text-violet-300 outline-none cursor-pointer focus:ring-2 focus:ring-violet-500"
              >
                <option value="keep_roll_asc">✅ গ্রুপভিত্তিক রোল অনুযায়ী: ছোট থেকে বড় (১, ২, ৩...) [ডিফল্ট]</option>
                <option value="keep_name_asc">🔤 গ্রুপভিত্তিক নামানুসারে: এ-ঝেড (A–Z) সাজানো</option>
                <option value="keep_file_order">📑 ফাইলে যেভাবে আছে সেই মূল ক্রম (Original Order)</option>
                <option value="reassign_1_to_n">🔢 ১ থেকে নতুন ক্রমিক রোল তৈরি (A–Z)</option>
              </select>
            </div>
          </div>

          {/* 🌟 4.3 GROUP TABS & SEARCH BAR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
            {/* Group Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setGroupTabFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                  groupTabFilter === 'all'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                সব বিভাগ ({rolledResult.students.length})
              </button>
              <button
                type="button"
                onClick={() => setGroupTabFilter('বিজ্ঞান')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                  groupTabFilter === 'বিজ্ঞান'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50'
                }`}
              >
                🔬 বিজ্ঞান ({rolledResult.groupStats.science})
              </button>
              <button
                type="button"
                onClick={() => setGroupTabFilter('মানবিক')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                  groupTabFilter === 'মানবিক'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 hover:bg-purple-50'
                }`}
              >
                📚 মানবিক ({rolledResult.groupStats.humanities})
              </button>
              <button
                type="button"
                onClick={() => setGroupTabFilter('ব্যবসায় শিক্ষা')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                  groupTabFilter === 'ব্যবসায় শিক্ষা'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 hover:bg-amber-50'
                }`}
              >
                💼 ব্যবসায় শিক্ষা ({rolledResult.groupStats.business})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchPreview}
                onChange={(e) => setSearchPreview(e.target.value)}
                placeholder="নাম, রোল, মোবাইল বা পিতা..."
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* 🌟 4.4 PREVIEW TABLE WITH EXACT SPECIFIED 12 COLUMNS */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[520px] shadow-sm bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 backdrop-blur-xs">
                <tr>
                  <th className="p-3 w-10 text-center text-slate-400 font-mono">#</th>
                  <th className="p-3 w-20 text-center">
                    <span className="block font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Roll</span>
                    <span className="text-[10px] text-slate-500 font-normal">রোল</span>
                  </th>
                  <th className="p-3 w-32">
                    <span className="block font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Group</span>
                    <span className="text-[10px] text-slate-500 font-normal">বিভাগ</span>
                  </th>
                  <th className="p-3 min-w-[200px]">
                    <span className="block font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Student Name</span>
                    <span className="text-[10px] text-slate-500 font-normal">শিক্ষার্থীর নাম</span>
                  </th>
                  <th className="p-3 w-24 text-center">
                    <span className="block font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">GENDER</span>
                    <span className="text-[10px] text-slate-500 font-normal">লিঙ্গ</span>
                  </th>
                  <th className="p-3 min-w-[160px]">
                    <span className="block font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Fathers Name</span>
                    <span className="text-[10px] text-slate-500 font-normal">পিতার নাম</span>
                  </th>
                  <th className="p-3 min-w-[160px]">
                    <span className="block font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Mother&apos;s Name</span>
                    <span className="text-[10px] text-slate-500 font-normal">মাতার নাম</span>
                  </th>
                  <th className="p-3 w-24 text-center">
                    <span className="block font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">RELIGION</span>
                    <span className="text-[10px] text-slate-500 font-normal">ধর্ম</span>
                  </th>
                  <th className="p-3 w-36 text-center">
                    <span className="block font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Registration Number</span>
                    <span className="text-[10px] text-slate-500 font-normal">রেজিস্ট্রেশন নম্বর</span>
                  </th>
                  <th className="p-3 w-28 text-center">
                    <span className="block font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">SSC Roll</span>
                    <span className="text-[10px] text-slate-500 font-normal">এসএসসি রোল</span>
                  </th>
                  <th className="p-3 w-28 text-center">
                    <span className="block font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">DATE OF BIRTH</span>
                    <span className="text-[10px] text-slate-500 font-normal">জন্ম তারিখ</span>
                  </th>
                  <th className="p-3 min-w-[220px]">
                    <span className="block font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Address</span>
                    <span className="text-[10px] text-slate-500 font-normal">ঠিকানা</span>
                  </th>
                  <th className="p-3 w-32 text-center">
                    <span className="block font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">MOBILE</span>
                    <span className="text-[10px] text-slate-500 font-normal">মোবাইল</span>
                  </th>
                  <th className="p-3 w-36 text-center">
                    <span className="block font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">OPTIONAL SUBJECT</span>
                    <span className="text-[10px] text-slate-500 font-normal">ঐচ্ছিক বিষয়</span>
                  </th>
                  <th className="p-3 w-16 text-center">
                    <span className="block font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Action</span>
                    <span className="text-[10px] text-slate-500 font-normal">পূর্ণাঙ্গ</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                {filteredPreview.map((st, i) => {
                  const isSci = st.group === 'বিজ্ঞান';
                  const isHum = st.group === 'মানবিক';
                  const isBus = st.group === 'ব্যবসায় শিক্ষা';

                  return (
                    <tr key={i} className="hover:bg-violet-50/40 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Index # */}
                      <td className="p-3 text-center font-mono text-slate-400 text-[11px]">
                        {i + 1}
                      </td>

                      {/* 1. Roll */}
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[34px] px-2.5 py-0.5 rounded-lg text-xs font-mono font-black shadow-xs ${
                          isSci
                            ? 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800'
                            : isHum
                            ? 'bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800'
                            : isBus
                            ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200'
                        }`}>
                          {st.roll}
                        </span>
                      </td>

                      {/* 2. Group */}
                      <td className="p-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                          isSci
                            ? 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                            : isHum
                            ? 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                            : isBus
                            ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {isSci ? '🔬 বিজ্ঞান' : isHum ? '📚 মানবিক' : isBus ? '💼 ব্যবসায় শিক্ষা' : st.group || 'সাধারণ'}
                        </span>
                      </td>

                      {/* 3. Student Name */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {st.name}
                        </div>
                        {(st.gradeBn || st.grade) && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {st.gradeBn || st.grade} {st.section ? `(${st.section})` : ''}
                          </span>
                        )}
                      </td>

                      {/* 4. GENDER */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          st.gender === 'মহিলা' || st.gender?.toLowerCase() === 'female'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900'
                            : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900'
                        }`}>
                          {st.gender || 'পুরুষ'}
                        </span>
                      </td>

                      {/* 5. Fathers Name */}
                      <td className="p-3 text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">
                        {st.fatherName || <span className="text-slate-300 dark:text-slate-600">-</span>}
                      </td>

                      {/* 6. Mother's Name */}
                      <td className="p-3 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                        {st.motherName || <span className="text-slate-300 dark:text-slate-600">-</span>}
                      </td>

                      {/* 7. RELIGION */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          st.religion === 'ইসলাম'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900'
                            : st.religion === 'হিন্দু'
                            ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-900'
                            : st.religion === 'বৌদ্ধ'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-900'
                            : st.religion === 'খ্রিস্টান'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900'
                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {st.religion || 'ইসলাম'}
                        </span>
                      </td>

                      {/* 8. Registration Number */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {st.registrationNo ? (
                          <span className="font-mono font-bold text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 tracking-wider">
                            {st.registrationNo}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 font-mono">-</span>
                        )}
                      </td>

                      {/* 9. SSC Roll */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {st.sscRoll ? (
                          <span className="font-mono font-bold text-[11px] text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-md border border-teal-200 dark:border-teal-800 tracking-wider">
                            {st.sscRoll}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 font-mono">-</span>
                        )}
                      </td>

                      {/* 10. DATE OF BIRTH */}
                      <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap text-[11px]">
                        {st.dob || <span className="text-slate-300 dark:text-slate-600">-</span>}
                      </td>

                      {/* 11. Address */}
                      <td className="p-3 text-slate-600 dark:text-slate-400 text-[11px] max-w-[220px]" title={st.currentAddress || st.permanentAddress}>
                        <span className="truncate block">
                          {st.currentAddress || st.permanentAddress || <span className="text-slate-300 dark:text-slate-600">-</span>}
                        </span>
                      </td>

                      {/* 12. MOBILE */}
                      <td className="p-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap text-xs">
                        {st.mobile || <span className="text-slate-300 dark:text-slate-600">-</span>}
                      </td>

                      {/* 13. OPTIONAL SUBJECT */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {st.optionalSubject ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                            {st.optionalSubject}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 font-mono">-</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentDetail(st)}
                          className="p-1.5 hover:bg-violet-100 dark:hover:bg-slate-800 text-violet-700 dark:text-violet-400 rounded-lg transition-all cursor-pointer"
                          title="সম্পূর্ণ বিস্তারিত প্রোফাইল দেখুন"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredPreview.length === 0 && (
                  <tr>
                    <td colSpan={15} className="p-8 text-center text-slate-400 font-bold">
                      কোনো শিক্ষার্থী পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🌟 5. DETAIL MODAL */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-violet-600" />
                  {selectedStudentDetail.name} (নতুন রোল: {selectedStudentDetail.roll})
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedStudentDetail.gradeBn || selectedStudentDetail.grade} | শাখা: {selectedStudentDetail.section} | বিভাগ: {selectedStudentDetail.group} {selectedStudentDetail.prevRoll ? `| পূর্বের রোল: ${selectedStudentDetail.prevRoll}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">ব্যক্তিগত ও জন্ম সংক্রান্ত</span>
                <p><strong>জন্ম তারিখ:</strong> {selectedStudentDetail.dob || 'দেওয়া হয়নি'}</p>
                <p><strong>জন্ম নিবন্ধন (BRN):</strong> {selectedStudentDetail.birthRegNo || 'দেওয়া হয়নি'}</p>
                <p><strong>লিঙ্গ:</strong> {selectedStudentDetail.gender}</p>
                <p><strong>ধর্ম:</strong> {selectedStudentDetail.religion}</p>
                <p><strong>রক্তের গ্রুপ:</strong> {selectedStudentDetail.bloodGroup || 'দেওয়া হয়নি'}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">পিতা ও মাতার বিবরণ</span>
                <p><strong>পিতার নাম:</strong> <span className="font-semibold text-slate-900 dark:text-white">{selectedStudentDetail.fatherName || 'দেওয়া হয়নি'}</span></p>
                <p><strong>পিতার এনআইডি:</strong> {selectedStudentDetail.fatherNid || 'দেওয়া হয়নি'}</p>
                <p><strong>মাতার নাম:</strong> <span className="font-semibold text-slate-900 dark:text-white">{selectedStudentDetail.motherName || 'দেওয়া হয়নি'}</span></p>
                <p><strong>মাতার এনআইডি:</strong> {selectedStudentDetail.motherNid || 'দেওয়া হয়নি'}</p>
                <p><strong>আইনগত অভিভাবক:</strong> {selectedStudentDetail.guardian || 'দেওয়া হয়নি'}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 sm:col-span-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">যোগাযোগ ও ঠিকানা</span>
                <p><strong>অভিভাবকের মোবাইল:</strong> <span className="font-mono font-bold text-violet-600">{selectedStudentDetail.mobile || 'দেওয়া হয়নি'}</span></p>
                <p><strong>বর্তমান ঠিকানা:</strong> {selectedStudentDetail.currentAddress || 'দেওয়া হয়নি'}</p>
                <p><strong>স্থায়ী ঠিকানা:</strong> {selectedStudentDetail.permanentAddress || 'দেওয়া হয়নি'}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 sm:col-span-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">একাডেমিক তথ্য</span>
                <p><strong>স্বয়ংক্রিয়ভাবে জেনারেটকৃত আইডি:</strong> <span className="font-mono text-violet-600 font-bold">{selectedStudentDetail.id}</span></p>
                <p><strong>বোর্ড রেজিস্ট্রেশন নম্বর:</strong> <span className="font-mono text-indigo-700 dark:text-indigo-400 font-bold">{selectedStudentDetail.registrationNo || 'দেওয়া হয়নি'}</span></p>
                <p><strong>এসএসসি রোল (SSC Roll):</strong> <span className="font-mono text-teal-700 dark:text-teal-400 font-bold">{selectedStudentDetail.sscRoll || 'দেওয়া হয়নি'}</span></p>
                <p><strong>শিক্ষাবর্ষ:</strong> {selectedStudentDetail.session || '২০২৬'}</p>
                <p><strong>৪র্থ / ঐচ্ছিক বিষয়:</strong> {selectedStudentDetail.optionalSubject || 'দেওয়া হয়নি'}</p>
                {selectedStudentDetail.remarks && <p><strong>মন্তব্য:</strong> {selectedStudentDetail.remarks}</p>}
              </div>
            </div>

            <div className="text-right pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
