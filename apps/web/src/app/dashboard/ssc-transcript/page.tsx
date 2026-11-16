'use client';

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 🎓 SCHOOLPRO SSC BULK TESTIMONIAL GENERATOR (ENGLISH)
 * ─────────────────────────────────────────────────────────────────────────────
 * এসএসসি পরীক্ষার্থীদের বাল্ক প্রশংসাপত্র জেনারেটর (Official English Testimonials)
 * ═════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { validateAndSanitizeImage } from '@/lib/securityUtils';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  Eye,
  FileText,
  Layers,
  Printer,
  RotateCcw,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import { certificateService, CertificateRecord } from '@/services/certificateService';
import { studentService, Student } from '@/services/studentService';
import { settingsService, SchoolSettings, CustomPngBorder } from '@/services/settingsService';
import { languageService, AppLanguage } from '@/services/languageService';
import {
  buildRecordFromStudent,
  cleanFatherName,
  cleanMotherName,
  DEFAULT_LAYOUT_CONFIG,
  formatDobInWords,
  getEnglishSchoolAddress,
  getEnglishSchoolName,
  getStudentExtraField,
  MainTab,
  PrintLayoutConfig,
  SSCTestimonialRecord,
  translateGroupToEnglish,
} from '@/components/ssc-transcript/sscTranscriptUtils';
import SscLayoutDrawer from '@/components/ssc-transcript/SscLayoutDrawer';
import SscBulkGeneratorTab from '@/components/ssc-transcript/SscBulkGeneratorTab';
import SscSingleGeneratorTab from '@/components/ssc-transcript/SscSingleGeneratorTab';
import SscBatchPrintTab from '@/components/ssc-transcript/SscBatchPrintTab';
import {
  SscPreviewModal,
  SscRegisterTab,
  SscSettingsTab,
} from '@/components/ssc-transcript/SscSettingsAndRegisterTabs';

function SSCTestimonialsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const [mounted, setMounted] = useState(false);
  const [currentLang, setCurrentLang] = useState<AppLanguage>('bn');
  const [activeTab, setActiveTab] = useState<MainTab>('single_generator');

  useEffect(() => {
    if (!tabParam) return;
    if (tabParam === 'settings' || tabParam === 'border_manager') {
      setActiveTab('settings');
    } else if (['single_generator', 'bulk_generator', 'batch_print', 'register'].includes(tabParam)) {
      setActiveTab(tabParam as MainTab);
    }
  }, [tabParam]);

  const handleTabChange = (newTab: MainTab) => {
    setActiveTab(newTab);
    router.push(`/dashboard/ssc-transcript?tab=${newTab}`, { scroll: false });
  };

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(settingsService.getSettings());

  const [layoutConfig, setLayoutConfig] = useState<PrintLayoutConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sms_ssc_layout_config_v2');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.topMargin === 0.65 || parsed.leftMargin === 0.85) {
            return {
              ...DEFAULT_LAYOUT_CONFIG,
              ...parsed,
              topMargin: 0.5,
              leftMargin: 0.5,
              rightMargin: 0.5,
              bottomMargin: 0.5,
            };
          }
          return { ...DEFAULT_LAYOUT_CONFIG, ...parsed };
        } catch {}
      }
    }
    return DEFAULT_LAYOUT_CONFIG;
  });

  const [showLayoutDrawer, setShowLayoutDrawer] = useState(false);

  const updateLayoutConfig = (newConfig: Partial<PrintLayoutConfig>) => {
    setLayoutConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      if (typeof window !== 'undefined') {
        localStorage.setItem('sms_ssc_layout_config_v2', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const [customBorders, setCustomBorders] = useState<CustomPngBorder[]>([]);
  const [selectedBorderId, setSelectedBorderId] = useState<string>('none');
  const [directBorderUrl, setDirectBorderUrl] = useState<string>('');

  const [students, setStudents] = useState<Student[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [passingYearFilter, setPassingYearFilter] = useState('2026');
  const [groupFilter, setGroupFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Single Form State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [singleStudentName, setSingleStudentName] = useState('');
  const [singleFatherName, setSingleFatherName] = useState('');
  const [singleMotherName, setSingleMotherName] = useState('');
  const [singleVillage, setSingleVillage] = useState('Boraitoli');
  const [singlePostOffice, setSinglePostOffice] = useState('Boraitoli');
  const [singleUpazilla, setSingleUpazilla] = useState('Chakaria');
  const [singleDistrict, setSingleDistrict] = useState("Cox's Bazar");
  const [singleDob, setSingleDob] = useState('2009-05-14');
  const [singleGender, setSingleGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [singleGroup, setSingleGroup] = useState('Science');
  const [singleBoardRoll, setSingleBoardRoll] = useState('102931');
  const [singleBoardReg, setSingleBoardReg] = useState('1810293819');
  const [singleSession, setSingleSession] = useState('2024-2025');
  const [singlePassingYear, setSinglePassingYear] = useState('2026');
  const [singleGpa, setSingleGpa] = useState('5.00');
  const [singleGradeLetter, setSingleGradeLetter] = useState('A+');
  const [singleRefNo, setSingleRefNo] = useState('');
  const [singleIssueDate, setSingleIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [singleRemarks, setSingleRemarks] = useState('He bears an exemplary moral character.');

  const [previewTestimonial, setPreviewTestimonial] = useState<SSCTestimonialRecord | null>(null);
  const [batchPrintList, setBatchPrintList] = useState<SSCTestimonialRecord[]>([]);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});

  const loadData = useCallback(() => {
    if (typeof window === 'undefined') return;
    setStudents(studentService.getAllStudents());
    setCertificates(certificateService.getCertificates());
    const settings = settingsService.getSettings();
    setSchoolSettings(settings);

    let borders: CustomPngBorder[] = settings.customBorders || [];
    if (borders.length === 0 && settings.customBorderPng) {
      borders = [{ id: 'border-1', name: 'বর্ডার ১ (কাস্টম ফ্রেম)', url: settings.customBorderPng }];
    }
    setCustomBorders(borders);
    const initialBorderId = settings.selectedBorderId || (borders.length > 0 ? borders[0].id : 'none');
    setSelectedBorderId(initialBorderId);
    if (settings.customBorderPng) {
      setDirectBorderUrl(settings.customBorderPng);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    setCurrentLang(languageService.getLanguage());
    const unsubLang = languageService.subscribe((l) => setCurrentLang(l));
    loadData();

    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    setSingleRefNo(`BHS/SSC-TEST/${year}/${rand}`);

    const handleSyncSettings = () => {
      setSchoolSettings(settingsService.getSettings());
    };
    window.addEventListener('focus', handleSyncSettings);
    window.addEventListener('storage', handleSyncSettings);

    return () => {
      unsubLang();
      window.removeEventListener('focus', handleSyncSettings);
      window.removeEventListener('storage', handleSyncSettings);
    };
  }, [loadData]);

  const sscCandidates = useMemo(() => {
    return students.filter((s) => {
      const is10 = s.grade === '10th' || s.grade === 'SSC' || s.grade === '10';
      const grpEn = translateGroupToEnglish(s.group);
      const matchGroup = groupFilter === 'all' || s.group === groupFilter || grpEn === groupFilter;
      const matchSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.roll.includes(searchQuery);
      return is10 && matchGroup && matchSearch;
    });
  }, [students, groupFilter, searchQuery]);

  const ensureTestimonialSyncedForVerification = useCallback((record: SSCTestimonialRecord) => {
    try {
      const existing =
        certificateService.getCertificateById(record.refNo) || certificateService.getCertificateById(record.id);
      return certificateService.saveCertificate({
        id: existing?.id || record.id,
        type: 'ssc_testimonial',
        issueDate: record.issueDate,
        refNo: record.refNo,
        studentId: record.studentId || record.boardRoll || 'SSC-CANDIDATE',
        studentName: record.studentName,
        fatherName: cleanFatherName(record.fatherName),
        motherName: cleanMotherName(record.motherName),
        village: record.village || 'Boraitoli',
        postOffice: record.postOffice || 'Boraitoli',
        upazila: record.upazilla || 'Chakaria',
        district: record.district || "Cox's Bazar",
        dob: record.dob || '2009-05-14',
        grade: '10th',
        roll: record.boardRoll || '01',
        section: 'A',
        group: record.group || 'Science',
        boardRoll: record.boardRoll,
        boardReg: record.boardReg,
        session: record.session || '2024-2025',
        passingYear: record.passingYear || '2026',
        gpa: record.gpa || '5.00',
        characterRemarks: record.characterRemarks || 'He bears an exemplary moral character.',
        isAlumni: true,
        padType: 'digital_server',
      });
    } catch {
      return null;
    }
  }, []);

  const generateQRCode = useCallback(
    async (record: SSCTestimonialRecord) => {
      try {
        ensureTestimonialSyncedForVerification(record);
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const params = new URLSearchParams({
          id: record.refNo || record.id,
          n: record.studentName || '',
          f: cleanFatherName(record.fatherName),
          m: cleanMotherName(record.motherName),
          r: record.boardRoll || '',
          reg: record.boardReg || '',
          g: record.gpa || '',
          y: record.passingYear || '',
          grp: record.group || '',
          s: record.session || '',
          d: record.issueDate || '',
        });
        const verifyUrl = `${origin}/verify-certificate?${params.toString()}`;
        const url = await QRCode.toDataURL(verifyUrl, {
          width: 280,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: { dark: '#0f172a', light: '#ffffff' },
        });
        setQrCodeDataUrls((prev) => ({ ...prev, [record.id]: url }));
        return url;
      } catch {
        return '';
      }
    },
    [ensureTestimonialSyncedForVerification]
  );

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // PNG Border Handlers
  const handleSelectBorder = (borderId: string) => {
    setSelectedBorderId(borderId);
    if (borderId === 'none') {
      setDirectBorderUrl('');
    } else {
      const found = customBorders.find((b) => b.id === borderId);
      if (found) setDirectBorderUrl(found.url);
    }
    settingsService.updateSettings({ selectedBorderId: borderId });
    setSchoolSettings(settingsService.getSettings());
    showAlert(
      'success',
      borderId === 'none' ? 'বর্ডার ছাড়া প্লেইন ফ্রেম নির্বাচিত হয়েছে!' : 'পিএনজি বর্ডার ফ্রেম সক্রিয় করা হয়েছে!'
    );
  };

  const validateBorderUpload = async (file: File) =>
    validateAndSanitizeImage(file, {
      maxSizeMB: 2,
      maxWidth: 1600,
      maxHeight: 2200,
      quality: 0.9,
      preserveTransparency: true,
    });

  const handleDirectBorderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const val = await validateBorderUpload(file);
    if (!val.valid || !val.sanitizedDataUrl) {
      e.target.value = '';
      showAlert('error', val.error || 'বর্ডার ফাইলটি সঠিক নয়।');
      return;
    }

    const base64 = val.sanitizedDataUrl;
    setDirectBorderUrl(base64);
    const newBorderObj: CustomPngBorder = {
      id: `border-custom-${Date.now()}`,
      name: `বর্ডার (${file.name.replace(/\.[^/.]+$/, '').substring(0, 15)})`,
      url: base64,
    };
    const updated = [newBorderObj, ...customBorders.slice(0, 2)];
    setCustomBorders(updated);
    setSelectedBorderId(newBorderObj.id);
    settingsService.updateSettings({
      customBorderPng: base64,
      customBorders: updated,
      selectedBorderId: newBorderObj.id,
    });
    setSchoolSettings(settingsService.getSettings());
    showAlert('success', 'নতুন পিএনজি বর্ডার সফলভাবে যুক্ত হয়েছে!');
    e.target.value = '';
  };

  const handleClearBorder = () => {
    setDirectBorderUrl('');
    setSelectedBorderId('none');
    settingsService.updateSettings({ customBorderPng: '', selectedBorderId: 'none' });
    setSchoolSettings(settingsService.getSettings());
    showAlert('success', 'পিএনজি বর্ডার সরানো হয়েছে!');
  };

  const handleUploadBorderSlot = async (slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const val = await validateBorderUpload(file);
    if (!val.valid || !val.sanitizedDataUrl) {
      e.target.value = '';
      showAlert('error', val.error || 'বর্ডার ফাইলটি সঠিক নয়।');
      return;
    }

    const base64 = val.sanitizedDataUrl;
    const updated = [...customBorders];
    const newBorderObj: CustomPngBorder = {
      id: `border-slot-${slotIndex + 1}-${Date.now()}`,
      name: `বর্ডার ${slotIndex + 1} (${file.name.replace(/\.[^/.]+$/, '').substring(0, 15)})`,
      url: base64,
    };

    if (slotIndex < updated.length) updated[slotIndex] = newBorderObj;
    else updated.push(newBorderObj);

    setCustomBorders(updated);
    setSelectedBorderId(newBorderObj.id);
    setDirectBorderUrl(base64);
    settingsService.updateSettings({
      customBorders: updated,
      selectedBorderId: newBorderObj.id,
      customBorderPng: base64,
    });
    setSchoolSettings(settingsService.getSettings());
    showAlert('success', `স্লট ${slotIndex + 1} এ নতুন পিএনজি বর্ডার সফলভাবে সংরক্ষিত হয়েছে!`);
    e.target.value = '';
  };

  const handleDeleteBorder = (borderId: string) => {
    const updated = customBorders.filter((b) => b.id !== borderId);
    setCustomBorders(updated);
    const newSelected =
      selectedBorderId === borderId ? (updated.length > 0 ? updated[0].id : 'none') : selectedBorderId;
    setSelectedBorderId(newSelected);
    if (newSelected === 'none') {
      setDirectBorderUrl('');
    } else {
      const f = updated.find((b) => b.id === newSelected);
      if (f) setDirectBorderUrl(f.url);
    }
    settingsService.updateSettings({ customBorders: updated, selectedBorderId: newSelected });
    setSchoolSettings(settingsService.getSettings());
    showAlert('success', 'পিএনজি বর্ডার মুছে ফেলা হয়েছে!');
  };

  const handleSelectStudentForSingle = (s: Student) => {
    setSelectedStudent(s);
    setSingleStudentName(s.name || '');
    setSingleFatherName(s.fatherName || 'Md. Ibrahim');
    setSingleMotherName(s.motherName || 'Fatema Begum');
    setSingleVillage(getStudentExtraField(s, 'village') || 'Boraitoli');
    setSinglePostOffice(getStudentExtraField(s, 'postOffice') || 'Boraitoli');
    setSingleUpazilla(getStudentExtraField(s, 'upazilla') || getStudentExtraField(s, 'upazila') || 'Chakaria');
    setSingleDistrict(getStudentExtraField(s, 'district') || "Cox's Bazar");
    setSingleDob(s.dob || '2009-05-14');
    const normalizedGender: 'Male' | 'Female' | 'Other' =
      s.gender === 'Female' || s.gender?.includes('মহিলা') || s.gender?.includes('নারী') || s.gender?.includes('মেয়ে')
        ? 'Female'
        : s.gender === 'Other'
          ? 'Other'
          : 'Male';
    setSingleGender(normalizedGender);
    setSingleGroup(translateGroupToEnglish(s.group));
    const pseudoBoardRoll = (102000 + parseInt(s.roll || '1', 10)).toString();
    const pseudoRegNo = `1810293${s.roll?.padStart(3, '0') || '001'}`;
    setSingleBoardRoll(pseudoBoardRoll);
    setSingleBoardReg(pseudoRegNo);
    handleTabChange('single_generator');
  };

  const handleDownloadExcelTemplate = () => {
    try {
      const excelData = sscCandidates.map((s, idx) => {
        const pseudoBoardRoll = (102900 + parseInt(s.roll || `${idx + 1}`, 10)).toString();
        const pseudoRegNo = `1810293${(s.roll || `${idx + 1}`).toString().padStart(3, '0')}`;
        const gender = s.gender === 'Female' ? 'Female' : 'Male';
        const grpEn = translateGroupToEnglish(s.group);

        return {
          Student_ID: s.id || `std-${idx + 1}`,
          Class_Roll: s.roll || `${idx + 1}`,
          Student_Name: s.name || '',
          Father_Name: s.fatherName || 'Md. Guardian',
          Mother_Name: s.motherName || 'Fatema Begum',
          Gender: gender,
          Group: grpEn,
          Session: '2024-2025',
          Board_Reg_No: pseudoRegNo,
          Board_Roll: pseudoBoardRoll,
          GPA: '5.00',
          Letter_Grade: 'A+',
          Passing_Year: passingYearFilter || '2026',
          Date_of_Birth: s.dob || '2009-05-14',
          Character_Remarks:
            gender === 'Female'
              ? 'She bears an exemplary moral character.'
              : 'He bears an exemplary moral character.',
          Village: 'Boraitoli',
          Post_Office: 'Boraitoli',
          Upazilla: 'Chakaria',
          District: "Cox's Bazar",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      worksheet['!cols'] = [
        { wch: 14 }, { wch: 10 }, { wch: 28 }, { wch: 24 }, { wch: 24 },
        { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 18 }, { wch: 14 },
        { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 42 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'SSC_Candidates');
      XLSX.writeFile(workbook, `SSC_Testimonial_Students_Template_${passingYearFilter || '2026'}.xlsx`);
      showAlert('success', `১০ম শ্রেণির ${sscCandidates.length} জন শিক্ষার্থীর তথ্য ছক এক্সেল (.xlsx) নমুনা ফাইল ডাউনলোড হয়েছে!`);
    } catch (err) {
      console.error('Error generating Excel file:', err);
      showAlert('error', 'এক্সেল ফাইল তৈরিতে সমস্যা হয়েছে। সিএসভি টেমপ্লেটটি ব্যবহার করতে পারেন।');
    }
  };

  const handleDownloadSSCCandidateCSV = () => {
    if (sscCandidates.length === 0) {
      showAlert('error', '১০ম শ্রেণির কোনো পরীক্ষার্থী পাওয়া যায়নি!');
      return;
    }

    const headers = [
      'student_id', 'class_roll', 'student_name', 'father_name', 'mother_name',
      'gender', 'group', 'session', 'board_reg', 'board_roll',
      'gpa', 'grade_letter', 'passing_year', 'date_of_birth', 'character_remarks',
    ];

    const rows = sscCandidates.map((s) => {
      const pseudoBoardRoll = (102000 + parseInt(s.roll || '1', 10)).toString();
      const pseudoRegNo = `1810293${s.roll?.padStart(3, '0') || '001'}`;
      const gender = s.gender || 'Male';
      const grpEn = translateGroupToEnglish(s.group);

      return [
        s.id,
        s.roll,
        `"${s.name}"`,
        `"${s.fatherName || 'Md. Ibrahim'}"`,
        `"${s.motherName || 'Fatema Begum'}"`,
        gender,
        grpEn,
        '2024-2025',
        pseudoRegNo,
        pseudoBoardRoll,
        '5.00',
        'A+',
        passingYearFilter,
        s.dob || '2009-05-14',
        `"${gender === 'Female' ? 'She bears a good moral character.' : 'He bears a good moral character.'}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SSC_Candidates_English_Testimonial_Template_${passingYearFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert('success', `১০ম শ্রেণির ${sscCandidates.length} জন পরীক্ষার্থীর সিএসভি টেমপ্লেট ডাউনলোড হয়েছে!`);
  };

  const handleBulkFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkProcessing(true);

    try {
      let dataRows: unknown[][] = [];

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as unknown[][];
        if (rawRows.length <= 1) throw new Error('এক্সেল ফাইলে কোনো শিক্ষার্থীর ডাটা পাওয়া যায়নি!');
        dataRows = rawRows
          .slice(1)
          .filter((r) => r.some((c) => c !== null && c !== undefined && String(c).trim().length > 0));
      } else {
        const text = await file.text();
        if (!text) throw new Error('ফাইলটি সম্পূর্ণ খালি!');
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) throw new Error('CSV ফাইলে কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি!');
        dataRows = lines.slice(1).map((line) => line.split(',').map((c) => c.replace(/^"|"$/g, '').trim()));
      }

      if (dataRows.length === 0) throw new Error('ফাইলে কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি!');

      const newTestimonials: SSCTestimonialRecord[] = [];
      const certBatchRecords: (Omit<CertificateRecord, 'id' | 'createdDate'> & { id?: string })[] = [];

      dataRows.forEach((cols, idx) => {
        if (cols.length < 3) return;
        const cell = (i: number, fallback = '') => (cols[i] !== undefined && cols[i] !== null ? String(cols[i]).trim() || fallback : fallback);
        const studentId = cell(0, `std-${idx + 1}`);
        const roll = cell(1, `${idx + 1}`);
        const name = cell(2, `Student ${idx + 1}`);
        const father = cell(3, 'Md. Guardian');
        const mother = cell(4, 'Fatema Begum');
        const genderRaw = cell(5, 'male').toLowerCase();
        const genderVal: 'Male' | 'Female' | 'Other' =
          genderRaw === 'female' || genderRaw === 'মহিলা' || genderRaw === 'ছাত্রী' ? 'Female' : 'Male';
        const grp = translateGroupToEnglish(cell(6, 'Science'));
        const sess = cell(7, '2024-2025');
        const bReg = cell(8, `181029300${idx + 1}`);
        const bRoll = cell(9, `${102900 + idx + 1}`);
        const gpaVal = cell(10, '5.00');
        const gradeLet = cell(11, parseFloat(gpaVal) >= 5.0 ? 'A+' : 'A');
        const yearVal = cell(12, passingYearFilter);
        const dobVal = cell(13, '2009-05-14');
        const remarks = cell(
          14,
          genderVal === 'Female' ? 'She bears an exemplary moral character.' : 'He bears an exemplary moral character.'
        );
        const village = cell(15, 'Boraitoli');
        const postOffice = cell(16, 'Boraitoli');
        const upazilla = cell(17, 'Chakaria');
        const district = cell(18, "Cox's Bazar");

        const rec: SSCTestimonialRecord = {
          id: `TESTIMONIAL-SSC-${yearVal}-${idx + 1}`,
          studentId,
          studentName: name,
          fatherName: father,
          motherName: mother,
          village,
          postOffice,
          upazilla,
          district,
          dob: dobVal,
          dobWords: formatDobInWords(dobVal),
          gender: genderVal,
          schoolName: schoolSettings.schoolName || 'শিক্ষা প্রতিষ্ঠান',
          schoolNameEn: getEnglishSchoolName(schoolSettings.schoolNameEn || schoolSettings.schoolName),
          schoolAddress: schoolSettings.address || '',
          schoolAddressEn: getEnglishSchoolAddress(schoolSettings.addressEn || schoolSettings.address),
          eiin: schoolSettings.eiin || '---',
          boardName: 'Board of Intermediate and Secondary Education, Chattogram',
          centerName: 'Chakaria-1',
          group: grp,
          boardRoll: bRoll,
          boardReg: bReg,
          session: sess,
          passingYear: yearVal,
          gpa: gpaVal,
          gradeLetter: gradeLet,
          issueDate: new Date().toISOString().split('T')[0],
          refNo: `BHS/SSC/${yearVal}/${101 + idx}`,
          characterRemarks: remarks,
        };
        newTestimonials.push(rec);

        certBatchRecords.push({
          type: 'ssc_testimonial',
          issueDate: rec.issueDate,
          refNo: rec.refNo,
          studentId,
          studentName: name,
          fatherName: father,
          motherName: mother,
          village,
          postOffice,
          upazila: upazilla,
          district,
          dob: dobVal,
          grade: '10th',
          roll,
          section: 'A',
          group: grp,
          boardRoll: bRoll,
          boardReg: bReg,
          session: sess,
          passingYear: yearVal,
          gpa: gpaVal,
          characterRemarks: remarks,
          isAlumni: true,
          padType: 'digital_server',
        });
      });

      if (certBatchRecords.length > 0) {
        certificateService.saveBatchCertificates(certBatchRecords);
        setCertificates(certificateService.getCertificates());
      }

      for (const t of newTestimonials) {
        generateQRCode(t);
      }

      setBatchPrintList(newTestimonials);
      setBulkProcessing(false);
      showAlert('success', `অভিনন্দন! মোট ${newTestimonials.length} জন শিক্ষার্থীর ইংরেজি প্রশংসাপত্র (Testimonial) সফলভাবে তৈরি হয়েছে!`);
      handleTabChange('batch_print');
    } catch (err) {
      setBulkProcessing(false);
      const message = err instanceof Error ? err.message : 'ফাইল প্রসেস করতে সমস্যা হয়েছে!';
      showAlert('error', message);
    } finally {
      e.target.value = '';
    }
  };

  const handleGenerateSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleStudentName.trim() || !singleBoardRoll.trim()) {
      showAlert('error', 'শিক্ষার্থীর নাম ও বোর্ড রোল পূরণ করা আবশ্যক!');
      return;
    }

    const record: SSCTestimonialRecord = {
      id: `TESTIMONIAL-SINGLE-${Date.now()}`,
      studentId: selectedStudent?.id || 'manual',
      studentName: singleStudentName,
      fatherName: singleFatherName,
      motherName: singleMotherName,
      village: singleVillage.trim() || 'Boraitoli',
      postOffice: singlePostOffice.trim() || 'Boraitoli',
      upazilla: singleUpazilla.trim() || 'Chakaria',
      district: singleDistrict.trim() || "Cox's Bazar",
      dob: singleDob,
      dobWords: formatDobInWords(singleDob),
      gender: singleGender,
      schoolName: schoolSettings.schoolName || 'শিক্ষা প্রতিষ্ঠান',
      schoolNameEn: getEnglishSchoolName(schoolSettings.schoolNameEn || schoolSettings.schoolName),
      schoolAddress: schoolSettings.address || '',
      schoolAddressEn: getEnglishSchoolAddress(schoolSettings.addressEn || schoolSettings.address),
      eiin: schoolSettings.eiin || '---',
      boardName: 'Board of Intermediate and Secondary Education, Chattogram',
      centerName: 'Chakaria-1',
      group: translateGroupToEnglish(singleGroup),
      boardRoll: singleBoardRoll,
      boardReg: singleBoardReg,
      session: singleSession,
      passingYear: singlePassingYear,
      gpa: singleGpa,
      gradeLetter: singleGradeLetter,
      issueDate: singleIssueDate,
      refNo: singleRefNo,
      characterRemarks: singleRemarks,
    };

    certificateService.saveCertificate({
      type: 'ssc_testimonial',
      issueDate: singleIssueDate,
      refNo: singleRefNo,
      studentId: record.studentId,
      studentName: singleStudentName,
      fatherName: singleFatherName,
      motherName: singleMotherName,
      village: singleVillage.trim() || 'Boraitoli',
      postOffice: singlePostOffice.trim() || 'Boraitoli',
      upazila: singleUpazilla.trim() || 'Chakaria',
      district: singleDistrict.trim() || "Cox's Bazar",
      dob: singleDob,
      grade: '10th',
      roll: selectedStudent?.roll || '01',
      section: 'A',
      group: record.group,
      boardRoll: singleBoardRoll,
      boardReg: singleBoardReg,
      session: singleSession,
      passingYear: singlePassingYear,
      gpa: singleGpa,
      characterRemarks: singleRemarks,
      isAlumni: true,
      padType: 'digital_server',
    });

    setCertificates(certificateService.getCertificates());
    generateQRCode(record);
    setPreviewTestimonial(record);
    showAlert('success', 'ইংরেজি প্রশংসাপত্র (Testimonial) সফলভাবে প্রস্তুত হয়েছে!');
  };

  const handleQuickPreviewCandidate = (s: Student, idx: number, notify = false) => {
    const rec = buildRecordFromStudent(s, schoolSettings, passingYearFilter, currentLang, idx);
    generateQRCode(rec);
    setPreviewTestimonial(rec);
    if (notify) {
      showAlert('success', `${s.name}-এর প্রশংসাপত্র প্রিন্টের জন্য প্রস্তুত!`);
    }
  };

  const handlePrepareAllCandidatesForBatch = () => {
    if (sscCandidates.length === 0) {
      showAlert('error', '১০ম শ্রেণির কোনো পরীক্ষার্থী পাওয়া যায়নি!');
      return;
    }
    const all = sscCandidates.map((s, idx) =>
      buildRecordFromStudent(s, schoolSettings, passingYearFilter, currentLang, idx)
    );
    all.forEach((rec) => generateQRCode(rec));
    setBatchPrintList(all);
    handleTabChange('batch_print');
    showAlert('success', `${all.length} জন পরীক্ষার্থীর ইংরেজি প্রশংসাপত্র (Testimonials) প্রিন্টের জন্য প্রস্তুত!`);
  };

  const activeBorderUrl = useMemo(() => {
    if (directBorderUrl) return directBorderUrl;
    if (selectedBorderId === 'none') return null;
    const found = customBorders.find((b) => b.id === selectedBorderId);
    return found ? found.url : null;
  }, [directBorderUrl, customBorders, selectedBorderId]);

  if (!mounted) return null;

  return (
    <div className="space-y-6 print:p-0 print:m-0 print:space-y-0 text-slate-900 dark:text-white">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Cinzel+Decorative:wght@700;900&display=swap');

        @media print {
          @page {
            size: 9.2in 8.2in !important;
            margin: 0mm !important;
          }
          html, body {
            margin: 0mm !important;
            padding: 0mm !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .testimonial-sheet-wrapper {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .testimonial-sheet {
            width: 9.2in !important;
            min-height: 8.2in !important;
            height: 8.2in !important;
            max-height: 8.2in !important;
            overflow: hidden !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            border: none !important;
            position: relative !important;
            background: #ffffff !important;
          }
          .testimonial-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .print-quality-boost {
            image-rendering: -webkit-optimize-contrast !important;
            image-rendering: high-quality !important;
            text-rendering: optimizeLegibility !important;
          }
        }
      `}</style>

      {alertMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold transition-all animate-bounce print:hidden ${
            alertMsg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {alertMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Unified Single-Line Header Bar */}
      <div className="bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-wrap xl:flex-nowrap items-center justify-between gap-2.5 print:hidden">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
            <Award size={18} />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs sm:text-sm font-black text-slate-950 dark:text-white whitespace-nowrap">
              এসএসসি প্রশংসাপত্র
            </h2>
            <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 rounded-md text-[10px] font-mono font-black whitespace-nowrap">
              ৯.২&quot; × ৮.২&quot;
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar shrink-0">
          {[
            { id: 'single_generator' as const, label: 'প্রশংসা পত্র তৈরি', Icon: FileText, activeIconColor: 'text-indigo-400', ring: 'ring-indigo-400/50' },
            { id: 'bulk_generator' as const, label: 'বাল্ক', Icon: Award, activeIconColor: 'text-amber-400', ring: 'ring-amber-400/50' },
            { id: 'batch_print' as const, label: `ব্যাচ প্রিন্ট প্রিভিউ (${batchPrintList.length} জন)`, Icon: Layers, activeIconColor: 'text-emerald-400', ring: 'ring-emerald-400/50' },
            { id: 'register' as const, label: 'প্রদানকৃত', Icon: BookOpen, activeIconColor: 'text-sky-400', ring: 'ring-sky-400/50' },
            { id: 'settings' as const, label: 'সেটিংস (পিএনজি বর্ডার, সাইজ ও মার্জিন)', Icon: SlidersHorizontal, activeIconColor: 'text-purple-400', ring: 'ring-purple-400/50' },
          ].map(({ id, label, Icon, activeIconColor, ring }) => {
            const active =
              id === 'settings'
                ? activeTab === 'settings' || activeTab === 'border_manager'
                : activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleTabChange(id)}
                className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  active
                    ? `bg-slate-950 text-white shadow-xs ring-1 ${ring}`
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-slate-800'
                }`}
              >
                <Icon size={13} className={active ? activeIconColor : 'text-slate-400'} />
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <label className="relative cursor-pointer">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleDirectBorderUpload}
            />
            <span
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition border ${
                activeBorderUrl
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Upload size={12} />
              {activeBorderUrl ? '✓ বর্ডার সেট' : 'বর্ডার আপলোড'}
            </span>
          </label>

          {activeBorderUrl && (
            <button
              type="button"
              onClick={handleClearBorder}
              title="বর্ডার সরান"
              className="px-2 py-1.5 rounded-xl font-bold text-xs border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition cursor-pointer"
            >
              ✕
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowLayoutDrawer(!showLayoutDrawer)}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-xs ${
              showLayoutDrawer
                ? 'bg-amber-500 text-slate-950 dark:text-white ring-2 ring-amber-400 font-black'
                : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
            title="সাইজ ও মার্জিন কন্ট্রোল প্যানেল খুলুন"
          >
            <SlidersHorizontal size={12} />
            <span>সাইজ ও মার্জিন</span>
          </button>

          {activeTab === 'settings' || activeTab === 'border_manager' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  updateLayoutConfig(DEFAULT_LAYOUT_CONFIG);
                  showAlert('success', 'ডিফল্ট সাইজ ও মার্জিনে রিসেট করা হয়েছে!');
                }}
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                title="ডিফল্ট মাপ ও মার্জিনে রিসেট করুন"
              >
                <RotateCcw size={12} /> রিসেট
              </button>
              <button
                type="button"
                onClick={() => {
                  const sampleRec: SSCTestimonialRecord = {
                    id: 'sample-preview',
                    studentId: 'SAMPLE-01',
                    studentName: 'MOHAMMAD SHIHAB UDDIN',
                    fatherName: 'MD. IBRAHIM',
                    motherName: 'BEGUM FATEMA',
                    village: 'Boraitoli',
                    postOffice: 'Boraitoli',
                    upazilla: 'Chakaria',
                    district: "Cox's Bazar",
                    gender: 'Male',
                    dob: '2009-05-14',
                    dobWords: 'Fourteenth May Two Thousand and Nine',
                    schoolName: schoolSettings.schoolName || 'শিক্ষা প্রতিষ্ঠান',
                    schoolNameEn: getEnglishSchoolName(schoolSettings.schoolNameEn || schoolSettings.schoolName),
                    schoolAddress: schoolSettings.address || '',
                    schoolAddressEn: getEnglishSchoolAddress(schoolSettings.addressEn || schoolSettings.address),
                    eiin: schoolSettings.eiin || '---',
                    centerName: 'Chakaria-1',
                    group: 'Science',
                    boardRoll: '102931',
                    boardReg: '1810293819',
                    session: '2024-2025',
                    passingYear: '2026',
                    boardName: 'Board of Intermediate and Secondary Education, Chattogram',
                    gpa: '5.00',
                    gradeLetter: 'A+',
                    issueDate: new Date().toISOString().split('T')[0],
                    refNo: 'BHS/SSC-TEST/2026/SAMPLE',
                    characterRemarks: 'He bears an exemplary moral character.',
                  };
                  generateQRCode(sampleRec);
                  setPreviewTestimonial(sampleRec);
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Eye size={12} /> নমুনা টেস্ট
              </button>
            </>
          ) : activeTab === 'batch_print' ? (
            <button
              type="button"
              onClick={() => window.print()}
              disabled={batchPrintList.length === 0}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Printer size={12} /> প্রিন্ট ({batchPrintList.length})
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePrepareAllCandidatesForBatch}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Printer size={12} /> বাল্ক প্রিন্ট ({sscCandidates.length})
            </button>
          )}
        </div>
      </div>

      {showLayoutDrawer && (
        <SscLayoutDrawer
          layoutConfig={layoutConfig}
          schoolSettings={schoolSettings}
          customBorders={customBorders}
          selectedBorderId={selectedBorderId}
          activeBorderUrl={activeBorderUrl}
          onUpdateLayoutConfig={updateLayoutConfig}
          onResetLayoutConfig={() => {
            setLayoutConfig(DEFAULT_LAYOUT_CONFIG);
            localStorage.removeItem('sms_ssc_layout_config_v2');
            showAlert('success', 'মার্জিন ও সাইজ ডিফল্ট মানে (০.৫ ইঞ্চি) রিসেট করা হয়েছে!');
          }}
          onSelectBorder={handleSelectBorder}
          onOpenSettingsTab={handleTabChange}
          onClose={() => setShowLayoutDrawer(false)}
        />
      )}

      {activeTab === 'bulk_generator' && (
        <SscBulkGeneratorTab
          sscCandidates={sscCandidates}
          passingYearFilter={passingYearFilter}
          setPassingYearFilter={setPassingYearFilter}
          groupFilter={groupFilter}
          setGroupFilter={setGroupFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          bulkProcessing={bulkProcessing}
          onDownloadExcelTemplate={handleDownloadExcelTemplate}
          onDownloadCsvTemplate={handleDownloadSSCCandidateCSV}
          onBulkFileUpload={handleBulkFileUpload}
          onPrepareAllForBatch={handlePrepareAllCandidatesForBatch}
          onPrintSingleCandidate={(s, idx) => handleQuickPreviewCandidate(s, idx, true)}
          onQuickPreviewCandidate={(s, idx) => handleQuickPreviewCandidate(s, idx, false)}
          onEditStudentForSingle={handleSelectStudentForSingle}
        />
      )}

      {activeTab === 'single_generator' && (
        <SscSingleGeneratorTab
          form={{
            studentName: singleStudentName,
            setStudentName: setSingleStudentName,
            fatherName: singleFatherName,
            setFatherName: setSingleFatherName,
            motherName: singleMotherName,
            setMotherName: setSingleMotherName,
            village: singleVillage,
            setVillage: setSingleVillage,
            postOffice: singlePostOffice,
            setPostOffice: setSinglePostOffice,
            upazilla: singleUpazilla,
            setUpazilla: setSingleUpazilla,
            district: singleDistrict,
            setDistrict: setSingleDistrict,
            gender: singleGender,
            setGender: setSingleGender,
            dob: singleDob,
            setDob: setSingleDob,
            group: singleGroup,
            setGroup: setSingleGroup,
            boardRoll: singleBoardRoll,
            setBoardRoll: setSingleBoardRoll,
            boardReg: singleBoardReg,
            setBoardReg: setSingleBoardReg,
            gpa: singleGpa,
            setGpa: setSingleGpa,
            gradeLetter: singleGradeLetter,
            setGradeLetter: setSingleGradeLetter,
            passingYear: singlePassingYear,
            setPassingYear: setSinglePassingYear,
            refNo: singleRefNo,
            setRefNo: setSingleRefNo,
            issueDate: singleIssueDate,
            setIssueDate: setSingleIssueDate,
            session: singleSession,
            setSession: setSingleSession,
            remarks: singleRemarks,
            setRemarks: setSingleRemarks,
          }}
          onSubmit={handleGenerateSingle}
        />
      )}

      {activeTab === 'batch_print' && (
        <SscBatchPrintTab
          batchPrintList={batchPrintList}
          schoolSettings={schoolSettings}
          layoutConfig={layoutConfig}
          activeBorderUrl={activeBorderUrl}
          qrCodeDataUrls={qrCodeDataUrls}
          hasActiveSinglePreview={Boolean(previewTestimonial)}
          onToggleLayoutDrawer={() => setShowLayoutDrawer(!showLayoutDrawer)}
          onPreviewSingle={setPreviewTestimonial}
          onRemoveFromBatch={(idx, studentName) => {
            setBatchPrintList((prev) => prev.filter((_, i) => i !== idx));
            showAlert('success', `${studentName}-কে বাল্ক প্রিন্ট তালিকা থেকে বাদ দেওয়া হয়েছে`);
          }}
          onPrint={() => window.print()}
        />
      )}

      {(activeTab === 'settings' || activeTab === 'border_manager') && (
        <SscSettingsTab
          customBorders={customBorders}
          selectedBorderId={selectedBorderId}
          activeBorderUrl={activeBorderUrl}
          layoutConfig={layoutConfig}
          schoolSettings={schoolSettings}
          onSelectBorder={handleSelectBorder}
          onDeleteBorder={handleDeleteBorder}
          onUploadBorderSlot={handleUploadBorderSlot}
          onUpdateLayoutConfig={updateLayoutConfig}
        />
      )}

      {activeTab === 'register' && (
        <SscRegisterTab
          certificates={certificates}
          schoolSettings={schoolSettings}
          onReprintCertificate={(rec) => {
            generateQRCode(rec);
            setPreviewTestimonial(rec);
          }}
        />
      )}

      <SscPreviewModal
        record={previewTestimonial}
        schoolSettings={schoolSettings}
        layoutConfig={layoutConfig}
        activeBorderUrl={activeBorderUrl}
        qrCodeUrl={previewTestimonial ? qrCodeDataUrls[previewTestimonial.id] : undefined}
        onUpdateLayoutConfig={updateLayoutConfig}
        onDirectBorderUpload={handleDirectBorderUpload}
        onClose={() => setPreviewTestimonial(null)}
      />
    </div>
  );
}

export default function SSCTestimonialsPage() {
  return (
    <React.Suspense
      fallback={<div className="p-12 text-center text-slate-500 font-bold text-sm">প্রশংসাপত্র সিস্টেম লোড হচ্ছে...</div>}
    >
      <SSCTestimonialsContent />
    </React.Suspense>
  );
}
