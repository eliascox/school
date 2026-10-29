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
  FileCheck
} from 'lucide-react';
import { studentService, Student } from '@/services/studentService';
import { auditTrailService } from '@/services/auditTrailService';

// ─── 1. COMPLETE SAMPLE DATA (Real Bangladesh Secondary School Model) ────────
export const SAMPLE_STUDENTS_TEMPLATE_DATA = [
  {
    Roll: '01',
    Name: 'তাহমিদ ইসলাম চৌধুরী',
    Class: '6th',
    Section: 'A',
    Group: 'সাধারণ',
    Session: '২০২৬',
    Gender: 'পুরুষ',
    DOB: '2013-03-15',
    BirthRegNo: '20131592612345601',
    BloodGroup: 'B+',
    Religion: 'ইসলাম',
    Mobile: '01812345601',
    FatherName: 'নুরুল ইসলাম চৌধুরী',
    FatherNID: '19801592612345601',
    MotherName: 'আমেনা বেগম',
    MotherNID: '19841592612345601',
    Guardian: 'নুরুল ইসলাম চৌধুরী',
    CurrentAddress: 'গ্রাম: দক্ষিণ বরইতলী, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    PermanentAddress: 'গ্রাম: দক্ষিণ বরইতলী, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    OptionalSubject: 'কৃষি শিক্ষা',
    IsStipend: 'হ্যাঁ',
    StipendCategory: 'সাধারণ উপবৃত্তি',
    Remarks: 'নিয়মিত ও মনোযোগী শিক্ষার্থী'
  },
  {
    Roll: '02',
    Name: 'আফরিন জাহান সুমাইয়া',
    Class: '6th',
    Section: 'A',
    Group: 'সাধারণ',
    Session: '২০২৬',
    Gender: 'মহিলা',
    DOB: '2013-07-22',
    BirthRegNo: '20131592612345602',
    BloodGroup: 'O+',
    Religion: 'ইসলাম',
    Mobile: '01812345602',
    FatherName: 'আনোয়ার হোসেন',
    FatherNID: '19791592612345602',
    MotherName: 'জাহানারা পারভীন',
    MotherNID: '19831592612345602',
    Guardian: 'আনোয়ার হোসেন',
    CurrentAddress: 'গ্রাম: মধ্য বরইতলী, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    PermanentAddress: 'গ্রাম: মধ্য বরইতলী, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    OptionalSubject: 'গার্হস্থ্য বিজ্ঞান',
    IsStipend: 'হ্যাঁ',
    StipendCategory: 'মেধাভিত্তিক উপবৃত্তি',
    Remarks: 'ক্লাস ক্যাপ্টেন'
  },
  {
    Roll: '01',
    Name: 'অনিন্দ্য পাল দ্বীপ',
    Class: '7th',
    Section: 'A',
    Group: 'সাধারণ',
    Session: '২০২৬',
    Gender: 'পুরুষ',
    DOB: '2012-05-10',
    BirthRegNo: '20121592612345603',
    BloodGroup: 'A+',
    Religion: 'হিন্দু',
    Mobile: '01712345603',
    FatherName: 'সুনীল কুমার পাল',
    FatherNID: '19781592612345603',
    MotherName: 'সুচিত্রা সেন পাল',
    MotherNID: '19821592612345603',
    Guardian: 'সুনীল কুমার পাল',
    CurrentAddress: 'গ্রাম: শান্তিবাজার, ডাকঘর: হারবাং, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    PermanentAddress: 'গ্রাম: শান্তিবাজার, ডাকঘর: হারবাং, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    OptionalSubject: 'কৃষি শিক্ষা',
    IsStipend: 'না',
    StipendCategory: '',
    Remarks: 'বিজ্ঞান মেলায় ১ম স্থান'
  },
  {
    Roll: '01',
    Name: 'মাহমুদুল হাসান সিফাত',
    Class: '8th',
    Section: 'A',
    Group: 'সাধারণ',
    Session: '২০২৬',
    Gender: 'পুরুষ',
    DOB: '2011-11-05',
    BirthRegNo: '20111592612345604',
    BloodGroup: 'AB+',
    Religion: 'ইসলাম',
    Mobile: '01912345604',
    FatherName: 'মোবারক আলী',
    FatherNID: '19771592612345604',
    MotherName: 'রোকেয়া বেগম',
    MotherNID: '19811592612345604',
    Guardian: 'মোবারক আলী',
    CurrentAddress: 'গ্রাম: বানিয়ারছড়া, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    PermanentAddress: 'গ্রাম: বানিয়ারছড়া, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    OptionalSubject: 'কৃষি শিক্ষা',
    IsStipend: 'হ্যাঁ',
    StipendCategory: 'সাধারণ উপবৃত্তি',
    Remarks: 'বিতর্ক ক্লাবের সদস্য'
  },
  {
    Roll: '01',
    Name: 'সাদিয়া বিনতে সুলতান',
    Class: '9th',
    Section: 'A',
    Group: 'বিজ্ঞান',
    Session: '২০২৬',
    Gender: 'মহিলা',
    DOB: '2010-09-18',
    BirthRegNo: '20101592612345605',
    BloodGroup: 'O+',
    Religion: 'ইসলাম',
    Mobile: '01812345605',
    FatherName: 'সুলতান মাহমুদ',
    FatherNID: '19761592612345605',
    MotherName: 'নাছিমা আক্তার',
    MotherNID: '19801592612345605',
    Guardian: 'সুলতান মাহমুদ',
    CurrentAddress: 'গ্রাম: পূর্ব বরইতলী, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    PermanentAddress: 'গ্রাম: পূর্ব বরইতলী, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    OptionalSubject: 'উচ্চতর গণিত',
    IsStipend: 'হ্যাঁ',
    StipendCategory: 'মেধাভিত্তিক উপবৃত্তি',
    Remarks: 'গণিত অলিম্পিয়াড অংশগ্রহণকারী'
  },
  {
    Roll: '02',
    Name: 'তানভীর আহমেদ রিফাত',
    Class: '9th',
    Section: 'B',
    Group: 'ব্যবসায় শিক্ষা',
    Session: '২০২৬',
    Gender: 'পুরুষ',
    DOB: '2010-01-25',
    BirthRegNo: '20101592612345606',
    BloodGroup: 'A+',
    Religion: 'ইসলাম',
    Mobile: '01812345606',
    FatherName: 'কামরুল আহসান',
    FatherNID: '19751592612345606',
    MotherName: 'শাহিনুর বেগম',
    MotherNID: '19791592612345606',
    Guardian: 'কামরুল আহসান',
    CurrentAddress: 'গ্রাম: কলেজ রোড, ডাকঘর: চকরিয়া, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    PermanentAddress: 'গ্রাম: কলেজ রোড, ডাকঘর: চকরিয়া, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    OptionalSubject: 'কম্পিউটার শিক্ষা',
    IsStipend: 'না',
    StipendCategory: '',
    Remarks: ''
  },
  {
    Roll: '01',
    Name: 'শ্রাবন্তী দাশ তিথি',
    Class: '10th',
    Section: 'A',
    Group: 'বিজ্ঞান',
    Session: '২০২৬',
    Gender: 'মহিলা',
    DOB: '2009-08-14',
    BirthRegNo: '20091592612345607',
    BloodGroup: 'B+',
    Religion: 'হিন্দু',
    Mobile: '01712345607',
    FatherName: 'সুধীর চন্দ্র দাশ',
    FatherNID: '19741592612345607',
    MotherName: 'সন্ধ্যা রানী দাশ',
    MotherNID: '19781592612345607',
    Guardian: 'সুধীর চন্দ্র দাশ',
    CurrentAddress: 'গ্রাম: মাস্টারপাড়া, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    PermanentAddress: 'গ্রাম: মাস্টারপাড়া, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    OptionalSubject: 'উচ্চতর গণিত',
    IsStipend: 'হ্যাঁ',
    StipendCategory: 'মেধাভিত্তিক উপবৃত্তি',
    Remarks: 'এসএসসি পরীক্ষার্থী ২০২৬'
  },
  {
    Roll: '02',
    Name: 'ফারহানা আক্তার মিলি',
    Class: '10th',
    Section: 'B',
    Group: 'মানবিক',
    Session: '২০২৬',
    Gender: 'মহিলা',
    DOB: '2009-12-03',
    BirthRegNo: '20091592612345608',
    BloodGroup: 'AB-',
    Religion: 'ইসলাম',
    Mobile: '01812345608',
    FatherName: 'মফিজুর রহমান',
    FatherNID: '19731592612345608',
    MotherName: 'হাসিনা বেগম',
    MotherNID: '19771592612345608',
    Guardian: 'মফিজুর রহমান',
    CurrentAddress: 'গ্রাম: গোয়াবাগান, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    PermanentAddress: 'গ্রাম: গোয়াবাগান, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    OptionalSubject: 'কৃষি শিক্ষা',
    IsStipend: 'হ্যাঁ',
    StipendCategory: 'সাধারণ উপবৃত্তি',
    Remarks: 'সাংস্কৃতিক প্রতিযোগিতায় পুরস্কৃত'
  }
];

// ─── 2. COMPLETE FIELD SPECIFICATION GUIDE ──────────────────────────────────
export const FIELD_GUIDE_ROWS = [
  { field: 'Roll', bnName: 'রোল নম্বর', required: 'আবশ্যক', sample: '01', desc: 'শ্রেণির ক্রমিক রোল নম্বর (যেমন: 01, 02 বা 1, 2)' },
  { field: 'Name', bnName: 'শিক্ষার্থীর নাম', required: 'আবশ্যক', sample: 'তাহমিদ ইসলাম চৌধুরী', desc: 'শিক্ষার্থীর পূর্ণাঙ্গ নাম (বাংলা বা ইংরেজিতে)' },
  { field: 'Class', bnName: 'শ্রেণি', required: 'আবশ্যক', sample: '8th', desc: '6th, 7th, 8th, 9th, 10th বা ৬ষ্ঠ, ৭ম, ৮ম, ৯ম, ১০ম' },
  { field: 'Section', bnName: 'শাখা', required: 'ঐচ্ছিক', sample: 'A', desc: 'শাখা: A, B, C বা ক, খ, গ, পদ্মা, মেঘনা (ডিফল্ট: A)' },
  { field: 'Group', bnName: 'বিভাগ / গ্রুপ', required: 'ঐচ্ছিক', sample: 'বিজ্ঞান', desc: 'সাধারণ (৬ষ্ঠ-৮ম), বিজ্ঞান, মানবিক, ব্যবসায় শিক্ষা (৯ম-১০ম)' },
  { field: 'Session', bnName: 'শিক্ষাবর্ষ', required: 'ঐচ্ছিক', sample: '২০২৬', desc: 'শিক্ষাবর্ষ বছর (যেমন: ২০২৬ বা 2026)' },
  { field: 'Gender', bnName: 'লিঙ্গ', required: 'ঐচ্ছিক', sample: 'পুরুষ', desc: 'পুরুষ / মহিলা / অন্যান্য (বা Male / Female)' },
  { field: 'DOB', bnName: 'জন্ম তারিখ', required: 'ঐচ্ছিক', sample: '2011-04-12', desc: 'তারিখ ফরম্যাট: YYYY-MM-DD অথবা DD/MM/YYYY' },
  { field: 'BirthRegNo', bnName: 'জন্ম নিবন্ধন (BRN)', required: 'ঐচ্ছিক', sample: '20111592612345601', desc: '১৭ ডিজিটের অনলাইন ডিজিটাল জন্ম নিবন্ধন নম্বর' },
  { field: 'BloodGroup', bnName: 'রক্তের গ্রুপ', required: 'ঐচ্ছিক', sample: 'B+', desc: 'A+, B+, O+, AB+, A-, B-, O-, AB-' },
  { field: 'Religion', bnName: 'ধর্ম', required: 'ঐচ্ছিক', sample: 'ইসলাম', desc: 'ইসলাম, হিন্দু, বৌদ্ধ, খ্রিস্টান (ডিফল্ট: ইসলাম)' },
  { field: 'Mobile', bnName: 'অভিভাবকের মোবাইল', required: 'প্রস্তাবিত', sample: '01812345601', desc: '১১ ডিজিটের মোবাইল নম্বর (SMS নোটিশ পাঠানোর জন্য)' },
  { field: 'FatherName', bnName: 'পিতার নাম', required: 'ঐচ্ছিক', sample: 'নুরুল ইসলাম চৌধুরী', desc: 'পিতার পূর্ণাঙ্গ নাম (সনদ ও রেজাল্টশিটে ব্যবহৃত)' },
  { field: 'FatherNID', bnName: 'পিতার এনআইডি', required: 'ঐচ্ছিক', sample: '19801592612345601', desc: 'পিতার ১০/১৩/১৭ ডিজিটের জাতীয় পরিচয়পত্র নম্বর' },
  { field: 'MotherName', bnName: 'মাতার নাম', required: 'ঐচ্ছিক', sample: 'আমেনা বেগম', desc: 'মাতার পূর্ণাঙ্গ নাম (সনদ ও রেজাল্টশিটে ব্যবহৃত)' },
  { field: 'MotherNID', bnName: 'মাতার এনআইডি', required: 'ঐচ্ছিক', sample: '19841592612345601', desc: 'মাতার ১০/১৩/১৭ ডিজিটের জাতীয় পরিচয়পত্র নম্বর' },
  { field: 'Guardian', bnName: 'আইনগত অভিভাবক', required: 'ঐচ্ছিক', sample: 'নুরুল ইসলাম চৌধুরী', desc: 'পিতা/মাতা অথবা স্থানীয় অভিভাবকের নাম' },
  { field: 'CurrentAddress', bnName: 'বর্তমান ঠিকানা', required: 'ঐচ্ছিক', sample: 'গ্রাম: দক্ষিণ বরইতলী, উপজেলা: চকরিয়া...', desc: 'বর্তমান যোগাযোগের পূর্ণাঙ্গ ঠিকানা' },
  { field: 'PermanentAddress', bnName: 'স্থায়ী ঠিকানা', required: 'ঐচ্ছিক', sample: 'গ্রাম: দক্ষিণ বরইতলী, উপজেলা: চকরিয়া...', desc: 'স্থায়ী বাসস্থান এর পূর্ণাঙ্গ ঠিকানা' },
  { field: 'OptionalSubject', bnName: '৪র্থ / ঐচ্ছিক বিষয়', required: 'ঐচ্ছিক', sample: 'কৃষি শিক্ষা', desc: 'উচ্চতর গণিত, কৃষি শিক্ষা, গার্হস্থ্য বিজ্ঞান ইত্যাদি' },
  { field: 'IsStipend', bnName: 'উপবৃত্তি সুবিধাভোগী', required: 'ঐচ্ছিক', sample: 'হ্যাঁ', desc: 'হ্যাঁ / না (বা Yes / No / 1 / 0)' },
  { field: 'StipendCategory', bnName: 'উপবৃত্তি ক্যাটাগরি', required: 'ঐচ্ছিক', sample: 'সাধারণ উপবৃত্তি', desc: 'সাধারণ উপবৃত্তি, মেধাভিত্তিক উপবৃত্তি ইত্যাদি' },
  { field: 'Remarks', bnName: 'মন্তব্য', required: 'ঐচ্ছিক', sample: 'নিয়মিত শিক্ষার্থী', desc: 'বিশেষ কোনো অর্জন, নোট বা মন্তব্য' }
];

interface StudentBulkImportPanelProps {
  onSuccess?: (count: number) => void;
  compactMode?: boolean;
}

export default function StudentBulkImportPanel({ onSuccess, compactMode = false }: StudentBulkImportPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedStudents, setParsedStudents] = useState<Student[]>([]);
  const [selectedSaveMode, setSelectedSaveMode] = useState<'merge' | 'replace'>('merge');
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [searchPreview, setSearchPreview] = useState('');
  const [gradePreviewFilter, setGradePreviewFilter] = useState('all');
  const [showGuide, setShowGuide] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);
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

  // ─── 1. DOWNLOAD COMPLETE EXCEL TEMPLATE (.xlsx) ─────────────────────────
  const downloadExcelTemplate = () => {
    try {
      // Sheet 1: Students Data Template
      const wsStudents = XLSX.utils.json_to_sheet(SAMPLE_STUDENTS_TEMPLATE_DATA);
      
      // Sheet 1 Column Widths
      wsStudents['!cols'] = [
        { wch: 8 },  // Roll
        { wch: 26 }, // Name
        { wch: 10 }, // Class
        { wch: 10 }, // Section
        { wch: 16 }, // Group
        { wch: 12 }, // Session
        { wch: 10 }, // Gender
        { wch: 14 }, // DOB
        { wch: 22 }, // BirthRegNo
        { wch: 12 }, // BloodGroup
        { wch: 12 }, // Religion
        { wch: 16 }, // Mobile
        { wch: 24 }, // FatherName
        { wch: 20 }, // FatherNID
        { wch: 22 }, // MotherName
        { wch: 20 }, // MotherNID
        { wch: 24 }, // Guardian
        { wch: 36 }, // CurrentAddress
        { wch: 36 }, // PermanentAddress
        { wch: 18 }, // OptionalSubject
        { wch: 12 }, // IsStipend
        { wch: 20 }, // StipendCategory
        { wch: 26 }, // Remarks
      ];

      // Sheet 2: Field Instructions & Guide
      const wsGuide = XLSX.utils.json_to_sheet(
        FIELD_GUIDE_ROWS.map((g) => ({
          'কলামের নাম (English Header)': g.field,
          'বাংলা শিরোনাম (Bengali Name)': g.bnName,
          'বাধ্যতামূলক কিনা (Status)': g.required,
          'নমুনা মান (Sample)': g.sample,
          'বিস্তারিত নির্দেশনা (Instructions)': g.desc
        }))
      );
      wsGuide['!cols'] = [
        { wch: 24 },
        { wch: 22 },
        { wch: 16 },
        { wch: 24 },
        { wch: 55 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsStudents, 'Students');
      XLSX.utils.book_append_sheet(wb, wsGuide, 'Field_Guide');

      XLSX.writeFile(wb, `Student_Complete_Bulk_Import_Template_2026.xlsx`);
      setAlertInfo({
        type: 'success',
        message: 'সম্পূর্ণ শিক্ষার্থী বাল্ক এক্সেল ফরম্যাট (.xlsx) সফলভাবে ডাউনলোড হয়েছে! ফাইলে প্রয়োজনীয় তথ্য পূরণ করে নিচে আপলোড করুন।'
      });
    } catch (e: any) {
      console.error(e);
      setAlertInfo({ type: 'error', message: 'এক্সেল টেমপ্লেট তৈরিতে সমস্যা হয়েছে: ' + (e.message || '') });
    }
  };

  // ─── 2. DOWNLOAD COMPLETE CSV TEMPLATE (.csv) ───────────────────────────
  const downloadCsvTemplate = () => {
    try {
      const headers = Object.keys(SAMPLE_STUDENTS_TEMPLATE_DATA[0]);
      const rows = SAMPLE_STUDENTS_TEMPLATE_DATA.map((row) =>
        headers.map((h) => `"${(row as any)[h] || ''}"`).join(',')
      );
      const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Student_Complete_Bulk_Import_Template_2026.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setAlertInfo({
        type: 'success',
        message: 'সম্পূর্ণ শিক্ষার্থী বাল্ক সিএসভি ফরম্যাট (.csv) সফলভাবে ডাউনলোড হয়েছে!'
      });
    } catch (e: any) {
      console.error(e);
      setAlertInfo({ type: 'error', message: 'সিএসভি টেমপ্লেট তৈরিতে সমস্যা হয়েছে: ' + (e.message || '') });
    }
  };

  // ─── 3. INTELLIGENT COLUMN HEADER MAPPER (Bengali & English) ──────────────
  const normalizeKey = (key: string): string => {
    const k = key.toLowerCase().trim().replace(/[\s_\-.]+/g, '');
    if (k.includes('roll') || k.includes('রোল') || k.includes('ক্রমিক')) return 'roll';
    if (k.includes('studentname') || k.includes('name') || k.includes('নাম') || k.includes('শিক্ষার্থী')) return 'name';
    if (k.includes('grade') || k.includes('class') || k.includes('শ্রেণি') || k.includes('শ্রেণী')) return 'grade';
    if (k.includes('section') || k.includes('branch') || k.includes('শাখা') || k.includes('সেকশন')) return 'section';
    if (k.includes('group') || k.includes('বিভাগ') || k.includes('গ্রুপ') || k.includes('stream')) return 'group';
    if (k.includes('session') || k.includes('year') || k.includes('শিক্ষাবর্ষ') || k.includes('বছর')) return 'session';
    if (k.includes('gender') || k.includes('sex') || k.includes('লিঙ্গ') || k.includes('ছাত্রছাত্রী')) return 'gender';
    if (k.includes('dob') || k.includes('birthdate') || k.includes('জন্মতারিখ') || k.includes('তারিখ')) return 'dob';
    if (k.includes('birthreg') || k.includes('brn') || k.includes('জন্মনিবন্ধন') || k.includes('সনদ')) return 'birthRegNo';
    if (k.includes('blood') || k.includes('রক্ত')) return 'bloodGroup';
    if (k.includes('religion') || k.includes('ধর্ম')) return 'religion';
    if (k.includes('mobile') || k.includes('phone') || k.includes('মোবাইল') || k.includes('ফোন')) return 'mobile';
    if (k.includes('fathernid') || k.includes('পিতারএনআইডি') || k.includes('পিতারজাতীয়')) return 'fatherNid';
    if (k.includes('father') || k.includes('পিতা') || k.includes('বাবারনাম')) return 'fatherName';
    if (k.includes('mothernid') || k.includes('মাতারএনআইডি') || k.includes('মাতারজাতীয়')) return 'motherNid';
    if (k.includes('mother') || k.includes('মাতা') || k.includes('মায়েরনাম')) return 'motherName';
    if (k.includes('guardian') || k.includes('অভিভাবক')) return 'guardian';
    if (k.includes('permanentaddress') || k.includes('স্থায়ীঠিকানা') || k.includes('স্থায়িঠিকানা')) return 'permanentAddress';
    if (k.includes('currentaddress') || k.includes('address') || k.includes('ঠিকানা') || k.includes('বর্তমানঠিকানা')) return 'currentAddress';
    if (k.includes('optional') || k.includes('ঐচ্ছিক') || k.includes('৪র্থ') || k.includes('চতুর্থ')) return 'optionalSubject';
    if (k.includes('isstipend') || k.includes('stipendstatus') || k.includes('উপবৃত্তিপ্রাপ্ত') || k.includes('উপবৃত্তি')) return 'isStipend';
    if (k.includes('stipendcat') || k.includes('উপবৃত্তিক্যাটাগরি') || k.includes('উপবৃত্তিধরন')) return 'stipendCategory';
    if (k.includes('remark') || k.includes('note') || k.includes('মন্তব্য') || k.includes('বিশেষ')) return 'remarks';
    return k;
  };

  // ─── 4. NORMALIZE INDIVIDUAL STUDENT VALUES ──────────────────────────────
  const normalizeStudentRow = (rawRow: Record<string, any>, idx: number): Student => {
    const row: Record<string, string> = {};
    Object.keys(rawRow).forEach((k) => {
      const val = rawRow[k];
      const normKey = normalizeKey(k);
      row[normKey] = val !== null && val !== undefined ? String(val).trim() : '';
    });

    const rollVal = (row['roll'] || String(idx + 1)).padStart(2, '0');
    const nameVal = row['name'] || `শিক্ষার্থী ${idx + 1}`;

    // Normalize Grade
    let rawGrade = (row['grade'] || '6th').toLowerCase();
    let gradeVal = '6th';
    let gradeBn = '৬ষ্ঠ শ্রেণি';
    if (rawGrade.includes('7') || rawGrade.includes('৭') || rawGrade.includes('seven')) {
      gradeVal = '7th';
      gradeBn = '৭ম শ্রেণি';
    } else if (rawGrade.includes('8') || rawGrade.includes('৮') || rawGrade.includes('eight')) {
      gradeVal = '8th';
      gradeBn = '৮ম শ্রেণি';
    } else if (rawGrade.includes('9') || rawGrade.includes('৯') || rawGrade.includes('nine')) {
      gradeVal = '9th';
      gradeBn = '৯ম শ্রেণি';
    } else if (rawGrade.includes('10') || rawGrade.includes('১০') || rawGrade.includes('ten')) {
      gradeVal = '10th';
      gradeBn = '১০ম শ্রেণি';
    } else {
      gradeVal = '6th';
      gradeBn = '৬ষ্ঠ শ্রেণি';
    }

    // Normalize Section
    let rawSec = (row['section'] || 'A').toUpperCase();
    if (rawSec === 'ক' || rawSec.includes('পদ্মা')) rawSec = 'A';
    else if (rawSec === 'খ' || rawSec.includes('মেঘনা')) rawSec = 'B';
    else if (rawSec === 'গ' || rawSec.includes('যমুনা')) rawSec = 'C';
    else if (!['A', 'B', 'C', 'D'].includes(rawSec)) rawSec = rawSec.slice(0, 1) || 'A';

    // Normalize Group
    let rawGroup = row['group'] || (['9th', '10th'].includes(gradeVal) ? 'বিজ্ঞান' : 'সাধারণ');
    if (rawGroup.includes('বিজ্ঞান') || rawGroup.toLowerCase().includes('science')) rawGroup = 'বিজ্ঞান';
    else if (rawGroup.includes('মানবিক') || rawGroup.toLowerCase().includes('humanities') || rawGroup.toLowerCase().includes('arts')) rawGroup = 'মানবিক';
    else if (rawGroup.includes('ব্যবসায়') || rawGroup.toLowerCase().includes('commerce') || rawGroup.toLowerCase().includes('business')) rawGroup = 'ব্যবসায় শিক্ষা';
    else if (!['9th', '10th'].includes(gradeVal)) rawGroup = 'সাধারণ';

    // Normalize Gender
    let rawGender = (row['gender'] || 'পুরুষ').toLowerCase();
    let genderVal = 'পুরুষ';
    if (rawGender.includes('মহিলা') || rawGender.includes('মেয়ে') || rawGender.includes('নারী') || rawGender.includes('female') || rawGender === 'f') {
      genderVal = 'মহিলা';
    } else if (rawGender.includes('অন্যান্য') || rawGender.includes('other')) {
      genderVal = 'অন্যান্য';
    }

    // Normalize Religion
    let rawRel = (row['religion'] || 'ইসলাম').toLowerCase();
    let religionVal = 'ইসলাম';
    if (rawRel.includes('হিন্দু') || rawRel.includes('সনাতন') || rawRel.includes('hindu')) {
      religionVal = 'হিন্দু';
    } else if (rawRel.includes('বৌদ্ধ') || rawRel.includes('buddhist')) {
      religionVal = 'বৌদ্ধ';
    } else if (rawRel.includes('খ্রিস্টান') || rawRel.includes('christian')) {
      religionVal = 'খ্রিস্টান';
    }

    // Normalize Stipend Boolean
    let rawStipend = (row['isStipend'] || '').toLowerCase();
    const isStipendVal = rawStipend === 'হ্যাঁ' || rawStipend === 'yes' || rawStipend === 'true' || rawStipend === '1';

    // Normalize Mobile (Clean Bangladeshi Number)
    let mobileVal = (row['mobile'] || '').replace(/[^0-9]/g, '');
    if (mobileVal.startsWith('880')) mobileVal = mobileVal.slice(2);
    if (mobileVal.length > 11) mobileVal = mobileVal.slice(-11);

    const fatherVal = row['fatherName'] || row['guardian'] || '';
    const motherVal = row['motherName'] || '';
    const guardianVal = row['guardian'] || fatherVal || '';

    return {
      id: `STD-${gradeVal}-${rawSec}-${rollVal}`,
      roll: rollVal,
      name: nameVal,
      grade: gradeVal,
      gradeBn,
      section: rawSec,
      branch: rawSec,
      group: rawGroup,
      session: row['session'] || '২০২৬',
      gender: genderVal,
      dob: row['dob'] || '',
      birthRegNo: row['birthRegNo'] || '',
      bloodGroup: row['bloodGroup'] || '',
      religion: religionVal,
      mobile: mobileVal,
      fatherName: fatherVal,
      fatherNid: row['fatherNid'] || '',
      motherName: motherVal,
      motherNid: row['motherNid'] || '',
      guardian: guardianVal,
      currentAddress: row['currentAddress'] || '',
      permanentAddress: row['permanentAddress'] || row['currentAddress'] || '',
      optionalSubject: row['optionalSubject'] || (['9th', '10th'].includes(gradeVal) ? 'উচ্চতর গণিত' : 'কৃষি শিক্ষা'),
      isStipend: isStipendVal,
      stipendCategory: isStipendVal ? (row['stipendCategory'] || 'সাধারণ উপবৃত্তি') : '',
      stipendStatus: isStipendVal ? 'Active' : undefined,
      remarks: row['remarks'] || ''
    };
  };

  // ─── 5. FILE UPLOAD & PARSER (XLSX / XLS / CSV) ──────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsing(true);
    setAlertInfo(null);

    try {
      let rawJsonRows: any[] = [];

      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        // Use the first sheet or a sheet named 'Students'
        const sheetName = workbook.SheetNames.includes('Students') ? 'Students' : workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rawJsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      } else {
        // CSV or TXT
        const text = await selectedFile.text();
        const workbook = XLSX.read(text, { type: 'string' });
        const firstSheet = workbook.SheetNames[0];
        rawJsonRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
      }

      if (!rawJsonRows || rawJsonRows.length === 0) {
        throw new Error('ফাইলে কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি!');
      }

      // Filter out completely empty rows
      const validRows = rawJsonRows.filter((r) =>
        Object.values(r).some((v) => v !== null && v !== undefined && String(v).trim().length > 0)
      );

      const parsed = validRows.map((row, idx) => normalizeStudentRow(row, idx));

      setParsedStudents(parsed);
      setAlertInfo({
        type: 'success',
        message: `ফাইল পার্স সফল! মোট ${parsed.length} জন শিক্ষার্থীর সম্পূর্ণ তথ্য পাওয়া গেছে। নিচের টেবিলে প্রিভিউ দেখে "ডাটাবেজে সংরক্ষণ করুন" বাটনে ক্লিক করুন।`
      });
    } catch (err: any) {
      console.error(err);
      setParsedStudents([]);
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

  // ─── 6. DUPLICATE ROLL DETECTION IN PARSED LIST ─────────────────────────
  const duplicatesMap = useMemo(() => {
    const map = new Map<string, number>();
    parsedStudents.forEach((st) => {
      const key = `${st.grade}_${st.section}_${st.roll.replace(/^0+/, '')}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [parsedStudents]);

  // ─── 7. FILTERED PREVIEW STUDENTS ────────────────────────────────────────
  const filteredPreview = useMemo(() => {
    return parsedStudents.filter((st) => {
      const matchGrade = gradePreviewFilter === 'all' || st.grade === gradePreviewFilter;
      const q = searchPreview.toLowerCase();
      const matchSearch =
        !q ||
        st.name.toLowerCase().includes(q) ||
        st.roll.includes(q) ||
        (st.mobile && st.mobile.includes(q)) ||
        (st.fatherName && st.fatherName.toLowerCase().includes(q)) ||
        (st.birthRegNo && st.birthRegNo.includes(q));
      return matchGrade && matchSearch;
    });
  }, [parsedStudents, gradePreviewFilter, searchPreview]);

  // ─── 8. SAVE PARSED STUDENTS TO SYSTEM DATABASE ─────────────────────────
  const handleSaveToDatabase = () => {
    if (parsedStudents.length === 0) return;

    if (selectedSaveMode === 'replace') {
      const confirmed = window.confirm(
        `সতর্কতা: আপনি "সম্পূর্ণ প্রতিস্থাপন (Replace All)" নির্বাচন করেছেন!\nবিদ্যমান ${currentDbStats.total} জন শিক্ষার্থীর রেকর্ড মুছে নতুন ${parsedStudents.length} জন শিক্ষার্থী প্রতিস্থাপন করা হবে।\nআপনি কি নিশ্চিত?`
      );
      if (!confirmed) return;
    }

    try {
      studentService.saveBulkStudents(parsedStudents, selectedSaveMode === 'replace');

      auditTrailService.addLog({
        action: selectedSaveMode === 'replace' ? 'BULK_IMPORT_REPLACE' : 'BULK_IMPORT_MERGE',
        category: 'STUDENT',
        details: `বাল্ক এক্সেল/সিএসভি থেকে ${parsedStudents.length} জন শিক্ষার্থীর সম্পূর্ণ তথ্য ডাটাবেজে সংরক্ষণ করা হয়েছে (${selectedSaveMode === 'replace' ? 'সম্পূর্ণ প্রতিস্থাপন' : 'মার্জ ও আপডেট'})`,
        performedBy: 'অ্যাডমিন / প্রধান শিক্ষক',
        status: 'SUCCESS'
      });

      setAlertInfo({
        type: 'success',
        message: `অভিনন্দন! সফলভাবে ${parsedStudents.length} জন শিক্ষার্থীর সম্পূর্ণ তথ্য কেন্দ্রীয় ডাটাবেজে সংরক্ষিত ও হালনাগাদ হয়েছে!`
      });

      loadDbStats();
      if (onSuccess) {
        onSuccess(parsedStudents.length);
      }
    } catch (err: any) {
      console.error(err);
      setAlertInfo({
        type: 'error',
        message: 'ডাটাবেজে সংরক্ষণে সমস্যা হয়েছে: ' + (err.message || 'অজানা ত্রুটি')
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* 🌟 1. BANNER & STATS CARD */}
      <div className="bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold tracking-wide text-violet-100 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>এক ক্লিকে সকল শিক্ষার্থীর পূর্ণাঙ্গ প্রোফাইল আপলোড</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              বাল্ক শিক্ষার্থী তথ্য আপলোড ও প্রমিত ফরম্যাট
            </h2>
            <p className="text-xs sm:text-sm text-violet-100/90 max-w-2xl leading-relaxed">
              এক্সেলে (.xlsx) অথবা সিএসভি (.csv) ফাইলে শিক্ষার্থীদের সমস্ত ব্যক্তিগত, পারিবারিক, অভিভাবকীয়, একাডেমিক ও উপবৃত্তির তথ্য একত্রে আপলোড ও ডেটাবেজে যুক্ত করুন।
            </p>
          </div>

          {/* Quick Counter */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 text-center min-w-[140px] shrink-0">
            <span className="text-[11px] font-bold text-violet-200 block">বর্তমান শিক্ষার্থী সংখ্যা</span>
            <span className="text-2xl font-black text-white font-mono">{currentDbStats.total} জন</span>
            <span className="text-[10px] text-emerald-300 font-semibold block mt-0.5">সিস্টেম রেডি</span>
          </div>
        </div>
      </div>

      {/* 🌟 2. DOWNLOAD TEMPLATES & FORMAT SPECIFICATION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-violet-600" />
              ধাপ ১: সম্পূর্ণ ফিল্ড সম্বলিত নমুনা ফরম্যাট ডাউনলোড করুন
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              নিচের যেকোনো একটি ফরম্যাট ডাউনলোড করে শিক্ষার্থীদের বাস্তব তথ্য পূরণ করুন
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={downloadExcelTemplate}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>নমুনা Excel ফরম্যাট (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={downloadCsvTemplate}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-amber-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-amber-100" />
              <span>নমুনা CSV ফরম্যাট (.csv)</span>
            </button>
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Info className="w-4 h-4 text-violet-600" />
              <span>ফিল্ড নির্দেশিকা {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</span>
            </button>
          </div>
        </div>

        {/* Expandable Field Reference Table */}
        {showGuide && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-violet-600" />
                সম্পূর্ণ কলাম ও ফিল্ড নির্দেশিকা (মোট {FIELD_GUIDE_ROWS.length} টি কলাম)
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                ইংরেজি বা বাংলা যেকোনো কলাম হেডার স্বয়ংক্রিয়ভাবে শনাক্ত হবে
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold sticky top-0">
                  <tr>
                    <th className="p-2 border-b">কলামের নাম (English)</th>
                    <th className="p-2 border-b">বাংলা শিরোনাম</th>
                    <th className="p-2 border-b">আবশ্যিকতা</th>
                    <th className="p-2 border-b">নমুনা মান</th>
                    <th className="p-2 border-b">বর্ণনা ও নিয়মাবলী</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                  {FIELD_GUIDE_ROWS.map((g, i) => (
                    <tr key={i} className="hover:bg-violet-50/40 dark:hover:bg-slate-800">
                      <td className="p-2 font-mono font-bold text-violet-700 dark:text-violet-400">{g.field}</td>
                      <td className="p-2 font-bold">{g.bnName}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.required === 'আবশ্যক'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {g.required}
                        </span>
                      </td>
                      <td className="p-2 font-mono text-slate-600 dark:text-slate-400">{g.sample}</td>
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
            ধাপ ২: পূরণকৃত ফাইল আপলোড ও প্রিভিউ যাচাই করুন
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            সাপোর্টেড ফরম্যাট: .xlsx, .xls, .csv, .txt (সর্বোচ্চ সাইজ: ২০ মেগাবাইট)
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
      </div>

      {/* 🌟 4. PARSED STUDENTS PREVIEW & BULK SAVE ACTION */}
      {parsedStudents.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  ধাপ ৩: প্রাপ্ত শিক্ষার্থীদের প্রিভিউ ও ডেটাবেজে সংরক্ষণ
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                মোট প্রাপ্ত: <span className="text-violet-700 dark:text-violet-400 font-black font-mono">{parsedStudents.length} জন</span> শিক্ষার্থী।
                নিচে ফিল্টার ও সার্চ করে তথ্য দেখে নিন।
              </p>
            </div>

            {/* Save Mode Selector & Action Button */}
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
                  title="বিদ্যমান শিক্ষার্থীদের সাথে নতুন শিক্ষার্থী যুক্ত করবে এবং একই রোল/শ্রেণি হলে আপডেট করবে"
                >
                  মার্জ ও আপডেট (Merge)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSaveMode('replace')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedSaveMode === 'replace'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="পূর্ববর্তী সমস্ত শিক্ষার্থী মুছে নতুন তালিকা দিয়ে সম্পূর্ণ প্রতিস্থাপন করবে"
                >
                  সম্পূর্ণ প্রতিস্থাপন (Replace)
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveToDatabase}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>ডাটাবেজে সংরক্ষণ করুন ({parsedStudents.length})</span>
              </button>
            </div>
          </div>

          {/* Quick Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchPreview}
                  onChange={(e) => setSearchPreview(e.target.value)}
                  placeholder="নাম, রোল, মোবাইল বা এনআইডি দিয়ে খুঁজুন..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <select
                value={gradePreviewFilter}
                onChange={(e) => setGradePreviewFilter(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="all">সকল শ্রেণি (All Classes)</option>
                <option value="6th">৬ষ্ঠ শ্রেণি (6th)</option>
                <option value="7th">৭ম শ্রেণি (7th)</option>
                <option value="8th">৮ম শ্রেণি (8th)</option>
                <option value="9th">৯ম শ্রেণি (9th)</option>
                <option value="10th">১০ম শ্রেণি (10th)</option>
              </select>
            </div>

            <span className="text-[11px] font-bold text-slate-500 text-right">
              প্রদর্শিত: {filteredPreview.length} / {parsedStudents.length} জন
            </span>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold sticky top-0 z-10">
                <tr>
                  <th className="p-2.5 border-b w-14 text-center">রোল</th>
                  <th className="p-2.5 border-b">শিক্ষার্থীর নাম</th>
                  <th className="p-2.5 border-b">শ্রেণি ও শাখা</th>
                  <th className="p-2.5 border-b">বিভাগ</th>
                  <th className="p-2.5 border-b">পিতা / অভিভাবক</th>
                  <th className="p-2.5 border-b">মোবাইল নম্বর</th>
                  <th className="p-2.5 border-b">ধর্ম / লিঙ্গ</th>
                  <th className="p-2.5 border-b">জন্ম নিবন্ধন (BRN)</th>
                  <th className="p-2.5 border-b text-center">উপবৃত্তি</th>
                  <th className="p-2.5 border-b text-center">পূর্ণাঙ্গ তথ্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                {filteredPreview.map((st, i) => {
                  const dupKey = `${st.grade}_${st.section}_${st.roll.replace(/^0+/, '')}`;
                  const isDup = (duplicatesMap.get(dupKey) || 0) > 1;

                  return (
                    <tr key={i} className="hover:bg-violet-50/30 dark:hover:bg-slate-800/50">
                      <td className="p-2.5 text-center font-mono font-bold">
                        {isDup ? (
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-black" title="একই শ্রেণি ও শাখায় ডুপ্লিকেট রোল">
                            {st.roll} ⚠️
                          </span>
                        ) : (
                          <span className="text-violet-700 dark:text-violet-400">{st.roll}</span>
                        )}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                        {st.name}
                      </td>
                      <td className="p-2.5">
                        <span className="font-semibold">{st.gradeBn || st.grade}</span>{' '}
                        <span className="text-slate-500 font-bold">({st.section})</span>
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">
                        {st.group || 'সাধারণ'}
                      </td>
                      <td className="p-2.5 text-slate-700 dark:text-slate-300">
                        {st.fatherName || st.guardian || '-'}
                      </td>
                      <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">
                        {st.mobile || '-'}
                      </td>
                      <td className="p-2.5 text-[11px]">
                        <span>{st.religion}</span> • <span className="text-slate-500">{st.gender}</span>
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {st.birthRegNo || '-'}
                      </td>
                      <td className="p-2.5 text-center">
                        {st.isStipend ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            উপবৃত্তি
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentDetail(st)}
                          className="p-1 hover:bg-violet-100 dark:hover:bg-slate-700 text-violet-700 dark:text-violet-400 rounded-lg transition"
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
                    <td colSpan={10} className="p-6 text-center text-slate-400 font-bold">
                      কোনো শিক্ষার্থী পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🌟 5. DETAIL MODAL (Displays ALL 20+ fields of any student) */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-600" />
                  {selectedStudentDetail.name} (রোল: {selectedStudentDetail.roll})
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedStudentDetail.gradeBn || selectedStudentDetail.grade} | শাখা: {selectedStudentDetail.section} | বিভাগ: {selectedStudentDetail.group}
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

            {/* Complete Profile Grid */}
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
                <p><strong>পিতার নাম:</strong> {selectedStudentDetail.fatherName || 'দেওয়া হয়নি'}</p>
                <p><strong>পিতার এনআইডি:</strong> {selectedStudentDetail.fatherNid || 'দেওয়া হয়নি'}</p>
                <p><strong>মাতার নাম:</strong> {selectedStudentDetail.motherName || 'দেওয়া হয়নি'}</p>
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
                <span className="text-[10px] text-slate-400 font-bold uppercase block">একাডেমিক ও উপবৃত্তি তথ্য</span>
                <p><strong>শিক্ষাবর্ষ:</strong> {selectedStudentDetail.session || '২০২৬'}</p>
                <p><strong>৪র্থ / ঐচ্ছিক বিষয়:</strong> {selectedStudentDetail.optionalSubject || 'দেওয়া হয়নি'}</p>
                <p><strong>উপবৃত্তি সুবিধাভোগী:</strong> {selectedStudentDetail.isStipend ? `হ্যাঁ (${selectedStudentDetail.stipendCategory || 'সাধারণ উপবৃত্তি'})` : 'না'}</p>
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
