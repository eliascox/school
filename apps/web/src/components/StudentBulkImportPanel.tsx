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
  Users,
  RefreshCw,
  Eye,
  Info,
  Check,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Hash,
  GraduationCap,
  Trash2,
} from 'lucide-react';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';
import { studentService, Student } from '@/services/studentService';
import {
  enToBnDigits,
  normalizeStudentRow,
  generateGroupWiseRolls,
  validateBulkImportBatch,
  executeBulkImport,
  RollSortStrategy,
  GroupWiseRollResult,
  BatchValidationReport,
} from '@/services/studentBulkImportEngine';

// ─── 1. BENGALI SAMPLE DATA (Pure Bengali Headers & Data per Specification) ─
export const SAMPLE_STUDENTS_BN = [
  {
    রোল: '০১',
    বিভাগ: 'বিজ্ঞান',
    'শিক্ষার্থীর নাম': 'সাদিয়া বিনতে সুলতান',
    লিঙ্গ: 'মহিলা',
    'পিতার নাম': 'সুলতান মাহমুদ',
    'মাতার নাম': 'নাছিমা আক্তার',
    ধর্ম: 'ইসলাম',
    'রেজিস্ট্রেশন নম্বর': '২১১৫৬৮৪৩০১',
    'এসএসসি রোল': '১০৬১৮১',
    'জন্ম তারিখ': '১৮/০৯/২০১০',
    ঠিকানা: 'পূর্ব বরইতলী, চকরিয়া, কক্সবাজার',
    মোবাইল: '০১৮১২৩৪৫৬০১',
    'ঐচ্ছিক বিষয়': 'উচ্চতর গণিত',
  },
  {
    রোল: '০২',
    বিভাগ: 'বিজ্ঞান',
    'শিক্ষার্থীর নাম': 'তাহমিদ ইসলাম চৌধুরী',
    লিঙ্গ: 'পুরুষ',
    'পিতার নাম': 'নুরুল ইসলাম চৌধুরী',
    'মাতার নাম': 'আমেনা বেগম',
    ধর্ম: 'ইসলাম',
    'রেজিস্ট্রেশন নম্বর': '২১১৫৬৮৪৩০২',
    'এসএসসি রোল': '১০৬১৮২',
    'জন্ম তারিখ': '১৫/০৩/২০১০',
    ঠিকানা: 'দক্ষিণ বরইতলী, চকরিয়া, কক্সবাজার',
    মোবাইল: '০১৮১২৩৪৫৬০২',
    'ঐচ্ছিক বিষয়': 'জীববিজ্ঞান',
  },
  {
    রোল: '০১',
    বিভাগ: 'মানবিক',
    'শিক্ষার্থীর নাম': 'ফারহানা আক্তার মিলি',
    লিঙ্গ: 'মহিলা',
    'পিতার নাম': 'মফিজুর রহমান',
    'মাতার নাম': 'হাসিনা বেগম',
    ধর্ম: 'ইসলাম',
    'রেজিস্ট্রেশন নম্বর': '২১১৫৬৮৪৩০৩',
    'এসএসসি রোল': '১০৬১৮৩',
    'জন্ম তারিখ': '০৩/১২/২০১০',
    ঠিকানা: 'গোয়াবাগান, বরইতলী, চকরিয়া, কক্সবাজার',
    মোবাইল: '০১৮১২৩৪৫৬০৩',
    'ঐচ্ছিক বিষয়': 'কৃষি শিক্ষা',
  },
  {
    রোল: '০২',
    বিভাগ: 'মানবিক',
    'শিক্ষার্থীর নাম': 'অনিন্দ্য পাল দীপ',
    লিঙ্গ: 'পুরুষ',
    'পিতার নাম': 'সুনীল কুমার পাল',
    'মাতার নাম': 'সুচিত্রা সেন পাল',
    ধর্ম: 'হিন্দু',
    'রেজিস্ট্রেশন নম্বর': '২১১৫৬৮৪৩০৪',
    'এসএসসি রোল': '১০৬১৮৪',
    'জন্ম তারিখ': '১০/০৫/২০১০',
    ঠিকানা: 'শান্তিবাজার, হারবাং, চকরিয়া, কক্সবাজার',
    মোবাইল: '০১৭১২৩৪৫৬০৪',
    'ঐচ্ছিক বিষয়': 'পৌরনীতি ও নাগরিকতা',
  },
  {
    রোল: '০১',
    বিভাগ: 'ব্যবসায় শিক্ষা',
    'শিক্ষার্থীর নাম': 'তানভীর আহমেদ রিফাত',
    লিঙ্গ: 'পুরুষ',
    'পিতার নাম': 'কামরুল আহসান',
    'মাতার নাম': 'শাহিনুর বেগম',
    ধর্ম: 'ইসলাম',
    'রেজিস্ট্রেশন নম্বর': '২১১৫৬৮৪৩০৫',
    'এসএসসি রোল': '১০৬১৮৫',
    'জন্ম তারিখ': '২৫/০১/২০১০',
    ঠিকানা: 'কলেজ রোড, চকরিয়া, কক্সবাজার',
    মোবাইল: '০১৮১২৩৪৫৬০৫',
    'ঐচ্ছিক বিষয়': 'কৃষি শিক্ষা',
  },
  {
    রোল: '০২',
    বিভাগ: 'ব্যবসায় শিক্ষা',
    'শিক্ষার্থীর নাম': 'শ্রাবন্তী দাশ তিথী',
    লিঙ্গ: 'মহিলা',
    'পিতার নাম': 'সুধীর চন্দ্র দাশ',
    'মাতার নাম': 'সন্ধ্যা রানী দাশ',
    ধর্ম: 'হিন্দু',
    'রেজিস্ট্রেশন নম্বর': '২১১৫৬৮৪৩০৬',
    'এসএসসি রোল': '১০৬১৮৬',
    'জন্ম তারিখ': '১৪/০৮/২০১০',
    ঠিকানা: 'মাস্টারপাড়া, বরইতলী, চকরিয়া, কক্সবাজার',
    মোবাইল: '০১৭১২৩৪৫৬০৬',
    'ঐচ্ছিক বিষয়': 'গার্হস্থ্য বিজ্ঞান',
  },
];

// ─── 2. ENGLISH SAMPLE DATA (Exact English Headers per User Specification) ─
export const SAMPLE_STUDENTS_EN = [
  {
    Roll: '01',
    Group: 'Science',
    'Student Name': 'Sadia Binte Sultan',
    Gender: 'Female',
    "Father's Name": 'Sultan Mahmud',
    "Mother's Name": 'Nasima Akhter',
    Religion: 'Islam',
    'Registration Number': '2115684301',
    'SSC Roll': '106181',
    'Date of Birth': '2010-09-18',
    Address: 'East Baraitali, Chakaria, Coxs Bazar',
    Mobile: '01812345601',
    'Optional Subject': 'Higher Mathematics',
  },
  {
    Roll: '02',
    Group: 'Science',
    'Student Name': 'Tahmid Islam Chowdhury',
    Gender: 'Male',
    "Father's Name": 'Nurul Islam Chowdhury',
    "Mother's Name": 'Amena Begum',
    Religion: 'Islam',
    'Registration Number': '2115684302',
    'SSC Roll': '106182',
    'Date of Birth': '2010-03-15',
    Address: 'South Baraitali, Chakaria, Coxs Bazar',
    Mobile: '01812345602',
    'Optional Subject': 'Biology',
  },
  {
    Roll: '01',
    Group: 'Humanities',
    'Student Name': 'Farhana Akhter Mili',
    Gender: 'Female',
    "Father's Name": 'Mofizur Rahman',
    "Mother's Name": 'Hasina Begum',
    Religion: 'Islam',
    'Registration Number': '2115684303',
    'SSC Roll': '106183',
    'Date of Birth': '2010-12-03',
    Address: 'Goabagan, Baraitali, Chakaria, Coxs Bazar',
    Mobile: '01812345603',
    'Optional Subject': 'Agriculture Studies',
  },
  {
    Roll: '02',
    Group: 'Humanities',
    'Student Name': 'Anindya Paul Dip',
    Gender: 'Male',
    "Father's Name": 'Sunil Kumar Paul',
    "Mother's Name": 'Suchitra Sen Paul',
    Religion: 'Hindu',
    'Registration Number': '2115684304',
    'SSC Roll': '106184',
    'Date of Birth': '2010-05-10',
    Address: 'Shantibazar, Harbang, Chakaria, Coxs Bazar',
    Mobile: '01712345604',
    'Optional Subject': 'Civics',
  },
  {
    Roll: '01',
    Group: 'Business Studies',
    'Student Name': 'Tanvir Ahmed Rifat',
    Gender: 'Male',
    "Father's Name": 'Kamrul Ahsan',
    "Mother's Name": 'Shahinur Begum',
    Religion: 'Islam',
    'Registration Number': '2115684305',
    'SSC Roll': '106185',
    'Date of Birth': '2010-01-25',
    Address: 'College Road, Chakaria, Coxs Bazar',
    Mobile: '01812345605',
    'Optional Subject': 'Agriculture Studies',
  },
  {
    Roll: '02',
    Group: 'Business Studies',
    'Student Name': 'Srabanti Das Tithi',
    Gender: 'Female',
    "Father's Name": 'Sudhir Chandra Das',
    "Mother's Name": 'Sandhya Rani Das',
    Religion: 'Hindu',
    'Registration Number': '2115684306',
    'SSC Roll': '106186',
    'Date of Birth': '2010-08-14',
    Address: 'Masterpara, Baraitali, Chakaria, Coxs Bazar',
    Mobile: '01712345606',
    'Optional Subject': 'Home Science',
  },
];

// ─── 3. FIELD SPECIFICATION GUIDE (Exact 13 Specified Columns) ──────────────
export const FIELD_GUIDE_ROWS = [
  { field: 'Roll', bnName: 'রোল', required: 'আবশ্যক', sampleEn: '01', sampleBn: '০১', desc: 'শিক্ষার্থীর রোল নম্বর (বিভাগ বা শ্রেণি অনুসারে)' },
  { field: 'Group', bnName: 'বিভাগ / গ্রুপ', required: 'আবশ্যক (৯ম-১০ম)', sampleEn: 'Science / Humanities / Business Studies', sampleBn: 'বিজ্ঞান / মানবিক / ব্যবসায় শিক্ষা', desc: '৬ষ্ঠ–৮ম শ্রেণির জন্য সাধারণ; ৯ম–১০ম শ্রেণির জন্য বিভাগ' },
  { field: 'Student Name', bnName: 'শিক্ষার্থীর নাম', required: 'আবশ্যক', sampleEn: 'Sadia Binte Sultan', sampleBn: 'সাদিয়া বিনতে সুলতান', desc: 'ইংরেজি বা বাংলা পূর্ণাঙ্গ নাম' },
  { field: 'Gender', bnName: 'লিঙ্গ', required: 'ঐচ্ছিক', sampleEn: 'Male / Female', sampleBn: 'পুরুষ / মহিলা', desc: 'পুরুষ (Male) বা মহিলা (Female)' },
  { field: "Father's Name", bnName: 'পিতার নাম', required: 'ঐচ্ছিক', sampleEn: 'Sultan Mahmud', sampleBn: 'সুলতান মাহমুদ', desc: 'পিতার পূর্ণ নাম' },
  { field: "Mother's Name", bnName: 'মাতার নাম', required: 'ঐচ্ছিক', sampleEn: 'Nasima Akhter', sampleBn: 'নাছিমা আক্তার', desc: 'মাতার পূর্ণ নাম' },
  { field: 'Religion', bnName: 'ধর্ম', required: 'ঐচ্ছিক', sampleEn: 'Islam / Hindu / Buddhist / Christian', sampleBn: 'ইসলাম / হিন্দু / বৌদ্ধ / খ্রিস্টান', desc: 'ধর্মবিশ্বাস' },
  { field: 'Registration Number', bnName: 'রেজিস্ট্রেশন নম্বর', required: 'ঐচ্ছিক (৯ম-১০ম)', sampleEn: '2115684301', sampleBn: '২১১৫৬৮৪৩০১', desc: 'শিক্ষা বোর্ড প্রদত্ত রেজিস্ট্রেশন নম্বর' },
  { field: 'SSC Roll', bnName: 'এসএসসি রোল', required: 'ঐচ্ছিক', sampleEn: '106184', sampleBn: '১০৬১৮৪', desc: 'শিক্ষা বোর্ড প্রদত্ত এসএসসি রোল নম্বর' },
  { field: 'Date of Birth', bnName: 'জন্ম তারিখ', required: 'ঐচ্ছিক', sampleEn: '2010-09-18', sampleBn: '১৮/০৯/২০১০', desc: 'YYYY-MM-DD অথবা DD/MM/YYYY' },
  { field: 'Address', bnName: 'ঠিকানা', required: 'ঐচ্ছিক', sampleEn: 'East Baraitali, Chakaria', sampleBn: 'পূর্ব বরইতলী, চকরিয়া', desc: 'বর্তমান বা স্থায়ী ঠিকানা' },
  { field: 'Mobile', bnName: 'মোবাইল নম্বর', required: 'প্রস্তাবিত', sampleEn: '01812345601', sampleBn: '০১৮১২৩৪৫৬০১', desc: '১১ ডিজিটের অভিভাবকের মোবাইল নম্বর' },
  { field: 'Optional Subject', bnName: 'ঐচ্ছিক / ৪র্থ বিষয়', required: 'ঐচ্ছিক', sampleEn: 'Higher Mathematics / Agriculture Studies', sampleBn: 'উচ্চতর গণিত / কৃষি শিক্ষা', desc: 'শিক্ষার্থীর ৪র্থ বা ঐচ্ছিক বিষয়' },
];

const GRADE_OPTIONS = [
  { key: '6th', labelBn: '৬ষ্ঠ শ্রেণি', shortBn: '৬ষ্ঠ', fileTag: 'Class_6' },
  { key: '7th', labelBn: '৭ম শ্রেণি', shortBn: '৭ম', fileTag: 'Class_7' },
  { key: '8th', labelBn: '৮ম শ্রেণি', shortBn: '৮ম', fileTag: 'Class_8' },
  { key: '9th', labelBn: '৯ম শ্রেণি', shortBn: '৯ম', fileTag: 'Class_9' },
  { key: '10th', labelBn: '১০ম শ্রেণি', shortBn: '১০ম', fileTag: 'Class_10' },
] as const;

type GradeOptionKey = (typeof GRADE_OPTIONS)[number]['key'];

interface StudentBulkImportPanelProps {
  onSuccess?: (count: number) => void;
  onParsedChange?: (count: number) => void;
  compactMode?: boolean;
}

export default function StudentBulkImportPanel({
  onSuccess,
  onParsedChange,
  compactMode = false,
}: StudentBulkImportPanelProps) {
  const [targetGrade, setTargetGrade] = useState<GradeOptionKey>('9th');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [rawParsedStudents, setRawParsedStudents] = useState<Student[]>([]);
  const [rollSortStrategy, setRollSortStrategy] = useState<RollSortStrategy>('roll_asc');
  const [keepUploadedRoll, setKeepUploadedRoll] = useState<boolean>(true);
  const [selectedSaveMode, setSelectedSaveMode] = useState<'merge' | 'replace_grade' | 'replace'>('merge');
  const [groupTabFilter, setGroupTabFilter] = useState<'all' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা'>('all');
  const [searchPreview, setSearchPreview] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [validationReport, setValidationReport] = useState<BatchValidationReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentDbStats, setCurrentDbStats] = useState({ total: 0, byGrade: {} as Record<string, number> });

  const activeGradeMeta = useMemo(
    () => GRADE_OPTIONS.find((g) => g.key === targetGrade) || GRADE_OPTIONS[3],
    [targetGrade],
  );

  const isSecondaryStreamClass = targetGrade === '9th' || targetGrade === '10th';

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

    return generateGroupWiseRolls(rawParsedStudents, rollSortStrategy, targetGrade, keepUploadedRoll);
  }, [rawParsedStudents, rollSortStrategy, targetGrade, keepUploadedRoll]);

  useEffect(() => {
    if (onParsedChange) {
      onParsedChange(rolledResult.students.length);
    }
  }, [rolledResult.students.length, onParsedChange]);

  useEffect(() => {
    if (rolledResult.students.length > 0) {
      const report = validateBulkImportBatch(rolledResult.students);
      setValidationReport(report);
    } else {
      setValidationReport(null);
    }
  }, [rolledResult.students]);

  // ─── DOWNLOAD EXCEL TEMPLATE ─────────────────────────────────────────────
  const downloadExcelTemplate = (lang: 'bn' | 'en') => {
    try {
      const data = lang === 'bn' ? SAMPLE_STUDENTS_BN : SAMPLE_STUDENTS_EN;
      const wsStudents = XLSX.utils.json_to_sheet(data);
      wsStudents['!cols'] = [
        { wch: 10 },
        { wch: 20 },
        { wch: 28 },
        { wch: 12 },
        { wch: 26 },
        { wch: 26 },
        { wch: 14 },
        { wch: 22 },
        { wch: 16 },
        { wch: 16 },
        { wch: 38 },
        { wch: 18 },
        { wch: 22 },
      ];

      const wsGuide = XLSX.utils.json_to_sheet(
        FIELD_GUIDE_ROWS.map((g) => ({
          'কলাম (English)': g.field,
          'বাংলা শিরোনাম (Bengali)': g.bnName,
          'স্ট্যাটাস (Status)': g.required,
          'নমুনা মান (English)': g.sampleEn,
          'নমুনা মান (বাংলা)': g.sampleBn,
          'নিয়মাবলী (Instructions)': g.desc,
        })),
      );
      wsGuide['!cols'] = [{ wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 24 }, { wch: 24 }, { wch: 60 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        wsStudents,
        lang === 'bn' ? 'শিক্ষার্থী_তালিকা' : `${activeGradeMeta.fileTag}_Students`,
      );
      XLSX.utils.book_append_sheet(wb, wsGuide, 'Field_Guide');

      const fileName =
        lang === 'bn'
          ? `${activeGradeMeta.fileTag}_Student_Bulk_Import_Bengali_2026.xlsx`
          : `${activeGradeMeta.fileTag}_Student_Bulk_Import_English_2026.xlsx`;

      XLSX.writeFile(wb, fileName);
      setAlertInfo({
        type: 'success',
        message: `${activeGradeMeta.labelBn}-এর ${lang === 'bn' ? 'বাংলা' : 'ইংরেজি'} এক্সেল টেমপ্লেট ডাউনলোড হয়েছে। তথ্য পূরণ করে বাম পাশের ড্রপজোনে আপলোড করুন।`,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      setAlertInfo({ type: 'error', message: `এক্সেল তৈরি ব্যর্থ: ${msg}` });
    }
  };

  // ─── DOWNLOAD CSV TEMPLATE ───────────────────────────────────────────────
  const downloadCsvTemplate = (lang: 'bn' | 'en') => {
    try {
      const data = lang === 'bn' ? SAMPLE_STUDENTS_BN : SAMPLE_STUDENTS_EN;
      const headers = Object.keys(data[0]);
      const rows = data.map((row) =>
        headers.map((h) => `"${String((row as Record<string, unknown>)[h] ?? '')}"`).join(','),
      );
      const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download =
        lang === 'bn'
          ? `${activeGradeMeta.fileTag}_Student_Bulk_Import_Bengali_2026.csv`
          : `${activeGradeMeta.fileTag}_Student_Bulk_Import_English_2026.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setAlertInfo({
        type: 'success',
        message: `${activeGradeMeta.labelBn}-এর ${lang === 'bn' ? 'বাংলা' : 'ইংরেজি'} CSV টেমপ্লেট ডাউনলোড হয়েছে।`,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      setAlertInfo({ type: 'error', message: `CSV তৈরি ব্যর্থ: ${msg}` });
    }
  };

  // ─── UNIFIED FILE PROCESSOR (DRAG-DROP & CLICK BROWSE) ───────────────────
  const processUploadedFile = async (selectedFile: File) => {
    const ext = selectedFile.name.toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls') && !ext.endsWith('.csv') && !ext.endsWith('.txt')) {
      setAlertInfo({
        type: 'error',
        message: 'শুধুমাত্র .xlsx, .xls, .csv অথবা .txt ফাইল আপলোড করা যাবে।',
      });
      return;
    }

    setFile(selectedFile);
    setParsing(true);
    setAlertInfo(null);

    try {
      const rawJsonRows: Record<string, unknown>[] = [];
      let detectedGrade: GradeOptionKey | null = null;

      if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) {
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });

        const ignoredSheets = [
          'field_guide',
          'fieldguide',
          'guide',
          'instructions',
          'instruction',
          'নিয়মাবলী',
          'সহায়িকা',
          'নির্দেশিকা',
        ];
        const studentSheets = workbook.SheetNames.filter((sn) => {
          const lower = sn.toLowerCase().trim().replace(/[\s_\-]+/g, '');
          return !ignoredSheets.some((ign) => lower.includes(ign));
        });

        const sheetsToRead = studentSheets.length > 0 ? studentSheets : [workbook.SheetNames[0]];

        for (const sheetName of sheetsToRead) {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) continue;
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
          if (!rows || rows.length === 0) continue;

          const sLower = sheetName.toLowerCase().trim();
          let sheetGroup = '';
          if (sLower.includes('বিজ্ঞান') || sLower.includes('science') || sLower.includes('sci')) {
            sheetGroup = 'বিজ্ঞান';
          } else if (sLower.includes('মানবিক') || sLower.includes('humanities') || sLower.includes('arts')) {
            sheetGroup = 'মানবিক';
          } else if (
            sLower.includes('ব্যবসায়') ||
            sLower.includes('ব্যবসায়') ||
            sLower.includes('বাণিজ্য') ||
            sLower.includes('commerce') ||
            sLower.includes('business')
          ) {
            sheetGroup = 'ব্যবসায় শিক্ষা';
          }

          let sheetGrade: GradeOptionKey | '' = '';
          if (sLower.includes('১০') || sLower.includes('10th') || sLower.includes('class_10') || sLower.includes('ten')) {
            sheetGrade = '10th';
          } else if (sLower.includes('৯') || sLower.includes('9th') || sLower.includes('class_9') || sLower.includes('nine')) {
            sheetGrade = '9th';
          } else if (sLower.includes('৮') || sLower.includes('8th') || sLower.includes('class_8')) {
            sheetGrade = '8th';
          } else if (sLower.includes('৭') || sLower.includes('7th') || sLower.includes('class_7')) {
            sheetGrade = '7th';
          } else if (sLower.includes('৬') || sLower.includes('6th') || sLower.includes('class_6')) {
            sheetGrade = '6th';
          }

          if (sheetGrade && !detectedGrade) {
            detectedGrade = sheetGrade;
          }

          rows.forEach((r) => {
            const hasData = Object.values(r).some(
              (v) => v !== null && v !== undefined && String(v).trim().length > 0,
            );
            if (hasData) {
              rawJsonRows.push({
                ...r,
                _sheetGroup: sheetGroup,
                _sheetGrade: sheetGrade,
              });
            }
          });
        }
      } else {
        const text = await selectedFile.text();
        const workbook = XLSX.read(text, { type: 'string' });
        const firstSheet = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheet], {
          defval: '',
        });
        rows.forEach((r) => {
          const hasData = Object.values(r).some(
            (v) => v !== null && v !== undefined && String(v).trim().length > 0,
          );
          if (hasData) rawJsonRows.push(r);
        });
      }

      if (rawJsonRows.length === 0) {
        throw new Error('ফাইলে কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি!');
      }

      if (detectedGrade) {
        setTargetGrade(detectedGrade);
      }

      const parsed = rawJsonRows.map((row, idx) => normalizeStudentRow(row, idx));
      setRawParsedStudents(parsed);
      setGroupTabFilter('all');

      setAlertInfo({
        type: 'success',
        message: `ফাইল সফলভাবে বিশ্লেষণ হয়েছে — মোট ${enToBnDigits(parsed.length)} জন শিক্ষার্থীর তথ্য পাওয়া গেছে। নিচের প্রিভিউ যাচাই করে "ডাটাবেজে সংরক্ষণ করুন" বাটনে ক্লিক করুন।`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'অনুগ্রহ করে সঠিক এক্সেল বা সিএসভি ফরম্যাট আপলোড করুন।';
      setRawParsedStudents([]);
      setAlertInfo({ type: 'error', message: `ফাইল পার্স করতে ব্যর্থ: ${msg}` });
    } finally {
      setParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processUploadedFile(selectedFile);
    }
  };

  const handleClearUploadedFile = () => {
    setFile(null);
    setRawParsedStudents([]);
    setValidationReport(null);
    setAlertInfo(null);
    setSearchPreview('');
    setGroupTabFilter('all');
  };

  // ─── FILTERED PREVIEW STUDENTS ───────────────────────────────────────────
  const filteredPreview = useMemo(() => {
    return rolledResult.students.filter((st) => {
      const matchGroup = groupTabFilter === 'all' || st.group === groupTabFilter;
      const q = searchPreview.trim().toLowerCase();
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

  // ─── SAVE TO DATABASE HANDLER ────────────────────────────────────────────
  const handleSaveToDatabase = async () => {
    if (rolledResult.students.length === 0) return;

    if (validationReport && !validationReport.canProceed) {
      showToast(
        `সতর্কতা: ফাইলে ${validationReport.errorCount} টি গুরুতর ত্রুটি রয়েছে। অনুগ্রহ করে ত্রুটিযুক্ত রো-গুলো সংশোধন করুন।`,
        'warning',
      );
      return;
    }

    if (selectedSaveMode === 'replace') {
      const confirmed = await confirmDialog({
        title: 'চূড়ান্ত সতর্কতা',
        message: `আপনি "সকল প্রতিস্থাপন (Replace All)" নির্বাচন করেছেন!\nবিদ্যমান ${currentDbStats.total} জন শিক্ষার্থীর রেকর্ড মুছে নতুন ${rolledResult.students.length} জন শিক্ষার্থী সংরক্ষণ করা হবে।\nআপনি কি নিশ্চিত?`,
        confirmLabel: 'প্রতিস্থাপন করুন',
        danger: true,
      });
      if (!confirmed) return;
    } else if (selectedSaveMode === 'replace_grade') {
      const confirmed = await confirmDialog({
        title: `${activeGradeMeta.labelBn} প্রতিস্থাপন নিশ্চিতকরণ`,
        message: `সতর্কতা: শুধুমাত্র ${activeGradeMeta.labelBn}-এর পূর্ববর্তী শিক্ষার্থীদের মুছে নতুন তালিকা দিয়ে প্রতিস্থাপন করা হবে। অন্য শ্রেণির রেকর্ড অপরিবর্তিত থাকবে। এগিয়ে যেতে চান?`,
        confirmLabel: 'এগিয়ে যান',
        danger: true,
      });
      if (!confirmed) return;
    }

    const execResult = executeBulkImport(rolledResult.students, {
      mode: selectedSaveMode,
      sortStrategy: rollSortStrategy,
      targetGrade,
      autoAssignRolls: true,
      keepUploadedRoll,
      performedBy: 'অ্যাডমিন / প্রধান শিক্ষক',
      abortOnError: true,
    });

    if (execResult.success) {
      setAlertInfo({
        type: 'success',
        message: `${activeGradeMeta.labelBn}-এর মোট ${enToBnDigits(execResult.importedCount)} জন শিক্ষার্থী সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে ও ক্লাউডে সিঙ্ক হচ্ছে।`,
      });
      loadDbStats();
      if (onSuccess) {
        onSuccess(execResult.importedCount);
      }
    } else {
      setAlertInfo({
        type: 'error',
        message: execResult.message,
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* ─── TOP 12-COLUMN EXECUTIVE WORKSPACE: UPLOAD (7) + TEMPLATES (5) ─── */}
      <div className={`grid grid-cols-1 ${compactMode ? '' : 'lg:grid-cols-12'} gap-5 items-stretch`}>
        {/* LEFT 7 COLS: TARGET CLASS + INTERACTIVE DRAG & DROP UPLOAD */}
        <div
          className={`${compactMode ? '' : 'lg:col-span-7'} bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between gap-4`}
        >
          {/* Card Header + Target Grade Selector */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload size={16} className="text-indigo-600 dark:text-indigo-400" />
                  এক্সেল / CSV ফাইল আপলোড করুন
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  প্রথমে শ্রেণি নির্বাচন করুন, তারপর পূরণকৃত ফাইল ড্রাগ করে ছেড়ে দিন অথবা ব্রাউজ করুন।
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold font-mono">
                নিবন্ধিত: {enToBnDigits(currentDbStats.total)} জন
              </span>
            </div>

            {/* Target Class Segmented Selector */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 mr-1">
                লক্ষ্য শ্রেণি:
              </span>
              {GRADE_OPTIONS.map((g) => {
                const active = targetGrade === g.key;
                const existingInGrade = currentDbStats.byGrade[g.key] || 0;
                return (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setTargetGrade(g.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition cursor-pointer border ${
                      active
                        ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-500 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <span>{g.labelBn}</span>
                    {existingInGrade > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black leading-none ${
                          active
                            ? 'bg-emerald-400 text-slate-950'
                            : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {enToBnDigits(existingInGrade)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Real Drag-and-Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) {
                await processUploadedFile(dropped);
              }
            }}
            className={`relative rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/50 hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-slate-800/40'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition ${
                isDragging
                  ? 'bg-indigo-600 text-white scale-110 shadow-md'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50'
              }`}
            >
              {parsing ? <RefreshCw size={22} className="animate-spin" /> : <FileSpreadsheet size={22} />}
            </div>

            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                {parsing
                  ? 'ফাইল বিশ্লেষণ করা হচ্ছে...'
                  : isDragging
                    ? 'এখনই ফাইলটি ছেড়ে দিন'
                    : 'কম্পিউটার থেকে Excel বা CSV ফাইল ড্রাগ করে এখানে ছাড়ুন'}
              </p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                সাপোর্টেড ফরম্যাট: <strong className="font-mono">.xlsx, .xls, .csv</strong> • একাধিক শিট (বিজ্ঞান/মানবিক/ব্যবসায়) স্বয়ংক্রিয়ভাবে শনাক্ত হবে
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <label className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-2xs inline-flex items-center gap-1.5 cursor-pointer transition active:scale-95">
                <Upload size={14} />
                <span>{file ? 'অন্য ফাইল নির্বাচন করুন' : 'ফাইল ব্রাউজ করুন'}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {file && (
                <button
                  type="button"
                  onClick={handleClearUploadedFile}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 hover:text-rose-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition"
                >
                  <Trash2 size={13} /> ফাইল মুছুন
                </button>
              )}
            </div>

            {file && (
              <div className="mt-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-2 max-w-full">
                <FileCheck size={14} className="text-emerald-600 shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="text-slate-400 font-mono shrink-0">
                  ({Math.max(1, Math.round(file.size / 1024))} KB)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT 5 COLS: CLEAN TEMPLATE DOWNLOADS & COLUMN GUIDE */}
        <div
          className={`${compactMode ? '' : 'lg:col-span-5'} bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between gap-4`}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Download size={16} className="text-emerald-600 dark:text-emerald-400" />
                  নমুনা টেমপ্লেট ডাউনলোড
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  বাংলা বা ইংরেজি যেকোনো কলাম হেডারে ফাইল প্রস্তুত করুন — সিস্টেম স্বয়ংক্রিয়ভাবে চিনতে পারবে।
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* Bangla Template Tile */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black">
                      বাংলা ফরম্যাট
                    </span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      বাংলা কলাম ও নমুনা ডাটা
                    </span>
                  </div>
                  <span className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400">
                    ১৩ কলাম
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadExcelTemplate('bn')}
                    className="flex-1 h-8.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black inline-flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
                  >
                    <FileSpreadsheet size={13} /> বাংলা Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadCsvTemplate('bn')}
                    className="h-8.5 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition"
                  >
                    <Download size={13} /> CSV
                  </button>
                </div>
              </div>

              {/* English Template Tile */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-black">
                      English Format
                    </span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      Standard English Headers
                    </span>
                  </div>
                  <span className="text-[10.5px] font-bold text-indigo-700 dark:text-indigo-400">
                    13 Columns
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadExcelTemplate('en')}
                    className="flex-1 h-8.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black inline-flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
                  >
                    <FileSpreadsheet size={13} /> English Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadCsvTemplate('en')}
                    className="h-8.5 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition"
                  >
                    <Download size={13} /> CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Toggleable Column Reference Button */}
          <button
            type="button"
            onClick={() => setShowGuide((prev) => !prev)}
            className="w-full py-2 px-3 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center justify-between cursor-pointer transition"
          >
            <span className="inline-flex items-center gap-1.5">
              <Info size={14} className="text-indigo-600 dark:text-indigo-400" />
              ১৩টি কলাম ও ফিল্ড নির্দেশিকা দেখুন
            </span>
            {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* ─── EXPANDABLE COLUMN SPECIFICATION GUIDE ─── */}
      {showGuide && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/60">
            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <BookOpen size={14} className="text-indigo-600 dark:text-indigo-400" />
              কলাম ও ফিল্ড নির্দেশিকা (মোট {enToBnDigits(FIELD_GUIDE_ROWS.length)}টি কলাম)
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              বাংলা বা ইংরেজি যেকোনো শিরোনাম স্বয়ংক্রিয়ভাবে ম্যাচ হবে
            </span>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 font-black text-[11px] sticky top-0 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3.5">কলাম (English)</th>
                  <th className="py-2.5 px-3">বাংলা শিরোনাম</th>
                  <th className="py-2.5 px-3">স্ট্যাটাস</th>
                  <th className="py-2.5 px-3">নমুনা (EN)</th>
                  <th className="py-2.5 px-3">নমুনা (বাংলা)</th>
                  <th className="py-2.5 px-3.5">নিয়মাবলী</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {FIELD_GUIDE_ROWS.map((g, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3.5 font-mono font-bold text-indigo-700 dark:text-indigo-400">{g.field}</td>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{g.bnName}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          g.required.includes('আবশ্যক')
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/60'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {g.required}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">{g.sampleEn}</td>
                    <td className="py-2 px-3 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">{g.sampleBn}</td>
                    <td className="py-2 px-3.5 text-[11px] text-slate-500 dark:text-slate-400">{g.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── INLINE FEEDBACK ALERT & VALIDATION REPORT ─── */}
      {alertInfo && (
        <div
          className={`px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 border shadow-2xs ${
            alertInfo.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-200'
              : alertInfo.type === 'warning'
                ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-200'
                : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertInfo.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle size={16} className={alertInfo.type === 'warning' ? 'text-amber-600 shrink-0' : 'text-rose-600 shrink-0'} />
            )}
            <span>{alertInfo.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertInfo(null)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {validationReport && validationReport.errors.length > 0 && (
        <div className="p-4 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-black text-xs">
            <AlertTriangle size={15} className="text-amber-600 shrink-0" />
            <span>
              ফাইলে {enToBnDigits(validationReport.errorCount)}টি গুরুতর ত্রুটি এবং{' '}
              {enToBnDigits(validationReport.warningCount)}টি সতর্কতা শনাক্ত হয়েছে:
            </span>
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

      {/* ─── STEP 3: EXECUTIVE PREVIEW & COMMIT STUDIO ─── */}
      {rolledResult.students.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
          {/* Top Commit & Save Mode Header */}
          <div className="p-4 sm:px-5 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
                <FileCheck size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>প্রিভিউ ও চূড়ান্ত সংরক্ষণ</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-mono">
                    {activeGradeMeta.labelBn} • {enToBnDigits(rolledResult.students.length)} জন
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {keepUploadedRoll
                    ? 'আপলোডকৃত রোল নম্বর অক্ষুণ্ণ রেখে বিভাগ ও ক্রম অনুযায়ী সাজানো হয়েছে।'
                    : 'প্রতিটি বিভাগের জন্য ১ থেকে নতুন ক্রমিক রোল তৈরি করা হয়েছে।'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Save Mode Segmented Control */}
              <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11.5px] font-bold border border-slate-200/80 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setSelectedSaveMode('merge')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    selectedSaveMode === 'merge'
                      ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs font-black'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  মার্জ ও আপডেট
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSaveMode('replace_grade')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    selectedSaveMode === 'replace_grade'
                      ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {activeGradeMeta.shortBn} প্রতিস্থাপন
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSaveMode('replace')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    selectedSaveMode === 'replace'
                      ? 'bg-rose-600 text-white shadow-2xs font-black'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  সকল প্রতিস্থাপন
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveToDatabase}
                disabled={validationReport ? !validationReport.canProceed : false}
                className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black shadow-2xs inline-flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <Check size={15} />
                <span>ডাটাবেজে সংরক্ষণ করুন ({enToBnDigits(rolledResult.students.length)})</span>
              </button>
            </div>
          </div>

          {/* Unified Preview Toolbar: Group Filter Tabs + Roll Strategy + Search */}
          <div className="px-4 sm:px-5 py-2.5 bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            {/* Group Filter Tabs with Roll Ranges */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setGroupTabFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer whitespace-nowrap border ${
                  groupTabFilter === 'all'
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                সকল ({enToBnDigits(rolledResult.students.length)})
              </button>

              {isSecondaryStreamClass && (
                <>
                  <button
                    type="button"
                    onClick={() => setGroupTabFilter('বিজ্ঞান')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer whitespace-nowrap border inline-flex items-center gap-1.5 ${
                      groupTabFilter === 'বিজ্ঞান'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span>বিজ্ঞান ({enToBnDigits(rolledResult.groupStats.science)})</span>
                    {rolledResult.rollRanges['বিজ্ঞান']?.rangeBn && (
                      <span className="text-[10px] font-mono opacity-80">
                        [{rolledResult.rollRanges['বিজ্ঞান'].rangeBn}]
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupTabFilter('মানবিক')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer whitespace-nowrap border inline-flex items-center gap-1.5 ${
                      groupTabFilter === 'মানবিক'
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span>মানবিক ({enToBnDigits(rolledResult.groupStats.humanities)})</span>
                    {rolledResult.rollRanges['মানবিক']?.rangeBn && (
                      <span className="text-[10px] font-mono opacity-80">
                        [{rolledResult.rollRanges['মানবিক'].rangeBn}]
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupTabFilter('ব্যবসায় শিক্ষা')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer whitespace-nowrap border inline-flex items-center gap-1.5 ${
                      groupTabFilter === 'ব্যবসায় শিক্ষা'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span>ব্যবসায় ({enToBnDigits(rolledResult.groupStats.business)})</span>
                    {rolledResult.rollRanges['ব্যবসায় শিক্ষা']?.rangeBn && (
                      <span className="text-[10px] font-mono opacity-80">
                        [{rolledResult.rollRanges['ব্যবসায় শিক্ষা'].rangeBn}]
                      </span>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Right: Roll Strategy + Preview Search */}
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <div className="inline-flex items-center gap-1.5">
                <Hash size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
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
                  className="h-8 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="keep_roll_asc">রোল অক্ষুণ্ণ: ছোট থেকে বড়</option>
                  <option value="keep_name_asc">রোল অক্ষুণ্ণ: নাম A–Z</option>
                  <option value="keep_file_order">ফাইলের মূল ক্রম</option>
                  <option value="reassign_1_to_n">১ থেকে নতুন ক্রমিক রোল তৈরি</option>
                </select>
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchPreview}
                  onChange={(e) => setSearchPreview(e.target.value)}
                  placeholder="প্রিভিউতে খুঁজুন..."
                  className="w-full h-8 pl-8 pr-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
                {searchPreview && (
                  <button
                    type="button"
                    onClick={() => setSearchPreview('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Clean Preview Table */}
          <div className="overflow-x-auto max-h-[520px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 font-black text-[11px] sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center text-slate-400 font-mono">#</th>
                  <th className="py-2.5 px-3 w-20 text-center">রোল</th>
                  <th className="py-2.5 px-3 w-28">বিভাগ</th>
                  <th className="py-2.5 px-3 min-w-[190px]">শিক্ষার্থীর নাম</th>
                  <th className="py-2.5 px-3 w-20 text-center">লিঙ্গ</th>
                  <th className="py-2.5 px-3 min-w-[150px]">পিতার নাম</th>
                  <th className="py-2.5 px-3 min-w-[150px]">মাতার নাম</th>
                  <th className="py-2.5 px-3 w-20 text-center">ধর্ম</th>
                  <th className="py-2.5 px-3 w-32 text-center">রেজিস্ট্রেশন নং</th>
                  <th className="py-2.5 px-3 w-24 text-center">এসএসসি রোল</th>
                  <th className="py-2.5 px-3 w-28 text-center">জন্ম তারিখ</th>
                  <th className="py-2.5 px-3 min-w-[180px]">ঠিকানা</th>
                  <th className="py-2.5 px-3 w-32 text-center">মোবাইল</th>
                  <th className="py-2.5 px-3 w-32 text-center">৪র্থ বিষয়</th>
                  <th className="py-2.5 px-3 w-14 text-center">বিস্তারিত</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-800 dark:text-slate-200">
                {filteredPreview.map((st, i) => {
                  const isSci = st.group === 'বিজ্ঞান';
                  const isHum = st.group === 'মানবিক';
                  const isBus = st.group === 'ব্যবসায় শিক্ষা';
                  const isFemale = st.gender === 'মহিলা' || st.gender?.toLowerCase() === 'female';

                  return (
                    <tr key={i} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                        {enToBnDigits(i + 1)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-black">
                          {st.roll}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${
                            isSci
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : isHum
                                ? 'bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800'
                                : isBus
                                  ? 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {st.group || 'সাধারণ'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white whitespace-nowrap">{st.name}</div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {activeGradeMeta.labelBn} {st.section ? `• শাখা ${st.section}` : ''}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isFemale
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                              : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                          }`}
                        >
                          {isFemale ? 'ছাত্রী' : 'ছাত্র'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{st.fatherName || '—'}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {st.motherName || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            st.religion === 'হিন্দু'
                              ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300'
                              : 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300'
                          }`}
                        >
                          {st.religion || 'ইসলাম'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] whitespace-nowrap">
                        {st.registrationNo || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] whitespace-nowrap">
                        {st.sscRoll || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {st.dob || '—'}
                      </td>
                      <td
                        className="py-2.5 px-3 text-[11px] text-slate-600 dark:text-slate-400 max-w-[180px]"
                        title={st.currentAddress || st.permanentAddress}
                      >
                        <span className="truncate block">{st.currentAddress || st.permanentAddress || '—'}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        {st.mobile || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap text-[11px] font-semibold">
                        {st.optionalSubject || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentDetail(st)}
                          className="p-1.5 hover:bg-indigo-50 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg transition cursor-pointer"
                          title="বিস্তারিত দেখুন"
                        >
                          <Eye size={14} />
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

          <div className="px-4 sm:px-5 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <Users size={13} className="text-indigo-500" />
              প্রিভিউ প্রদর্শিত: <strong className="font-mono text-slate-900 dark:text-white">{enToBnDigits(filteredPreview.length)}</strong> / {enToBnDigits(rolledResult.students.length)} জন
            </span>
            <span className="text-[11px]">সংরক্ষণের পর স্বয়ংক্রিয়ভাবে শিক্ষার্থী তালিকায় যুক্ত হবে</span>
          </div>
        </div>
      )}

      {/* ─── DETAIL MODAL ─── */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap size={18} className="text-indigo-600" />
                  {selectedStudentDetail.name} (রোল: {selectedStudentDetail.roll})
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeGradeMeta.labelBn} • শাখা: {selectedStudentDetail.section} • বিভাগ: {selectedStudentDetail.group}
                  {selectedStudentDetail.prevRoll ? ` • পূর্বের রোল: ${selectedStudentDetail.prevRoll}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">ব্যক্তিগত তথ্য</span>
                <p><strong>জন্ম তারিখ:</strong> {selectedStudentDetail.dob || 'দেওয়া হয়নি'}</p>
                <p><strong>জন্ম নিবন্ধন:</strong> {selectedStudentDetail.birthRegNo || 'দেওয়া হয়নি'}</p>
                <p><strong>লিঙ্গ:</strong> {selectedStudentDetail.gender}</p>
                <p><strong>ধর্ম:</strong> {selectedStudentDetail.religion}</p>
                <p><strong>রক্তের গ্রুপ:</strong> {selectedStudentDetail.bloodGroup || 'দেওয়া হয়নি'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">পিতা ও মাতা</span>
                <p><strong>পিতার নাম:</strong> {selectedStudentDetail.fatherName || 'দেওয়া হয়নি'}</p>
                <p><strong>পিতার এনআইডি:</strong> {selectedStudentDetail.fatherNid || 'দেওয়া হয়নি'}</p>
                <p><strong>মাতার নাম:</strong> {selectedStudentDetail.motherName || 'দেওয়া হয়নি'}</p>
                <p><strong>মাতার এনআইডি:</strong> {selectedStudentDetail.motherNid || 'দেওয়া হয়নি'}</p>
                <p><strong>অভিভাবক:</strong> {selectedStudentDetail.guardian || 'দেওয়া হয়নি'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl space-y-1 sm:col-span-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">যোগাযোগ ও একাডেমিক</span>
                <p>
                  <strong>মোবাইল:</strong>{' '}
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedStudentDetail.mobile || 'দেওয়া হয়নি'}
                  </span>
                </p>
                <p><strong>ঠিকানা:</strong> {selectedStudentDetail.currentAddress || selectedStudentDetail.permanentAddress || 'দেওয়া হয়নি'}</p>
                <p><strong>আইডি:</strong> <span className="font-mono">{selectedStudentDetail.id}</span></p>
                <p><strong>বোর্ড রেজিস্ট্রেশন:</strong> {selectedStudentDetail.registrationNo || 'দেওয়া হয়নি'} • <strong>এসএসসি রোল:</strong> {selectedStudentDetail.sscRoll || 'দেওয়া হয়নি'}</p>
                <p><strong>৪র্থ / ঐচ্ছিক বিষয়:</strong> {selectedStudentDetail.optionalSubject || 'দেওয়া হয়নি'}</p>
              </div>
            </div>

            <div className="text-right pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-xs font-bold hover:opacity-90 cursor-pointer"
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
