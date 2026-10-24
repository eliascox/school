'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  Search, 
  Filter, 
  User, 
  Phone, 
  Eye, 
  Printer, 
  Pencil, 
  Trash2,
  Plus,
  X,
  Building2,
  Users,
  TrendingUp,
  UserCheck,
  GraduationCap,
  Download,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  ArrowLeft,
  Sparkles,
  Save,
  QrCode as QrIcon,
  Award,
  Heart,
  Calendar,
  Lock,
  FileSpreadsheet,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Layers,
  BarChart3,
  Check,
  RefreshCw,
  Camera,
  Upload,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { studentService, Student } from '@/services/studentService';
import { languageService, AppLanguage } from '@/services/languageService';
import { certificateService, CertificateRecord } from '@/services/certificateService';
import { settingsService } from '@/services/settingsService';
import OfficialCertificateDoc from '@/components/OfficialCertificateDoc';
import SchoolPadWrapper from '@/components/SchoolPadWrapper';
import OfficialAdmissionForm from '@/components/OfficialAdmissionForm';
import { compressImage } from '@/lib/imageUtils';

interface StudentItem {
  id: string;
  name: string;
  nameEn?: string;
  roll: string;
  grade: string;
  branch: string;
  section?: string;
  group: string;
  optionalSubject: string;
  guardian: string;
  fatherName?: string;
  fatherNameEn?: string;
  fatherNid?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherNameEn?: string;
  motherNid?: string;
  motherOccupation?: string;
  guardianRelation?: string;
  mobile: string;
  attendance: number;
  gpa: string;
  birthRegNo?: string;
  dob?: string;
  gender?: string;
  religion?: string;
  bloodGroup?: string;
  currentAddress?: string;
  permanentAddress?: string;
  prevSchoolName?: string;
  prevGpa?: string;
  photo?: string;
  remarks?: string;
  isStipend?: boolean;
}

type ViewState = 'list' | 'view' | 'edit' | 'print_form' | 'print_list';

// Bengali numeral converter helper
const toBnDigit = (num: number | string) => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bn[parseInt(d, 10)]);
};

export default function StudentListPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentLang, setCurrentLang] = useState<AppLanguage>('bn');
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // In-Page Active View State (No Popups!)
  const [activeView, setActiveView] = useState<ViewState>('list');
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [editFormData, setEditFormData] = useState<StudentItem | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoadingView, setIsLoadingView] = useState<boolean>(false);

  // ─── 📜 STUDENT CERTIFICATES & DOCUMENTS TAB STATE ────────────────────────
  const [studentProfileTab, setStudentProfileTab] = useState<'details' | 'certificates'>('details');
  const [studentCertificates, setStudentCertificates] = useState<CertificateRecord[]>([]);
  const [selectedCertForPrint, setSelectedCertForPrint] = useState<CertificateRecord | null>(null);

  useEffect(() => {
    if (selectedStudent?.id) {
      setStudentCertificates(certificateService.getCertificatesByStudentId(selectedStudent.id));
    } else {
      setStudentCertificates([]);
    }
  }, [selectedStudent]);

  // ─── 📸 DRAG & DROP PHOTO UPLOAD STATE ────────────────────────────────────
  const [dragOverStudentId, setDragOverStudentId] = useState<string | null>(null);
  const [targetStudentIdForUpload, setTargetStudentIdForUpload] = useState<string | null>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showBulkPhotoModal, setShowBulkPhotoModal] = useState<boolean>(false);
  const [bulkPhotos, setBulkPhotos] = useState<Array<{
    file: File;
    preview: string;
    fileName: string;
    matchedStudentId: string | null;
    matchedStudentName?: string;
    matchedGrade?: string;
    matchedRoll?: string;
  }>>([]);
  const [bulkTargetGrade, setBulkTargetGrade] = useState<string>('all');
  const [isBulkDragging, setIsBulkDragging] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleStudentPhotoUpload = async (studentId: string, file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      showToast('অনুগ্রহ করে একটি সঠিক ছবি ফাইল (JPG, PNG, WEBP) নির্বাচন করুন!', 'error');
      return;
    }

    try {
      const compressed = await compressImage(file, 400, 400, 0.85);
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const updatedStudent = { ...student, photo: compressed };
      const success = studentService.updateStudent(updatedStudent as any);

      if (success) {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, photo: compressed } : s));
        if (selectedStudent?.id === studentId) {
          setSelectedStudent(prev => prev ? { ...prev, photo: compressed } : null);
        }
        if (editFormData?.id === studentId) {
          setEditFormData(prev => prev ? { ...prev, photo: compressed } : null);
        }
        showToast(`"${student.name}" এর ছবি সফলভাবে আপলোড হয়েছে!`, 'success');
      } else {
        showToast('ছবি সংরক্ষণ করতে সমস্যা হয়েছে!', 'error');
      }
    } catch (err: any) {
      showToast('ছবি প্রসেসিং করতে ত্রুটি হয়েছে!', 'error');
    }
  };

  const triggerSinglePhotoSelect = (studentId: string) => {
    setTargetStudentIdForUpload(studentId);
    if (singleFileInputRef.current) {
      singleFileInputRef.current.value = '';
      singleFileInputRef.current.click();
    }
  };

  const handleSingleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && targetStudentIdForUpload) {
      handleStudentPhotoUpload(targetStudentIdForUpload, file);
      setTargetStudentIdForUpload(null);
    }
  };

  const handleBulkFilesAdded = async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArr.length === 0) {
      showToast('কোনো বৈধ ছবি ফাইল পাওয়া যায়নি!', 'error');
      return;
    }

    const newBulkItems: typeof bulkPhotos = [];
    for (const f of fileArr) {
      const preview = await compressImage(f, 300, 300, 0.8);
      const cleanFileName = f.name.replace(/\.[^/.]+$/, '').trim().toLowerCase();
      
      // Matching priority:
      // 1. Exact or suffix match on Student ID
      let matched = students.find(s => {
        const sId = (s.id || '').toLowerCase();
        return sId === cleanFileName || sId.endsWith(cleanFileName);
      });

      // 2. Match by Roll Number (filtered by bulkTargetGrade if selected)
      if (!matched) {
        const cleanRoll = cleanFileName.replace(/[^0-9]/g, '');
        if (cleanRoll) {
          matched = students.find(s => {
            const sRoll = String(s.roll || '').trim().replace(/[^0-9]/g, '');
            const matchGrade = bulkTargetGrade === 'all' || s.grade === bulkTargetGrade;
            return matchGrade && (parseInt(sRoll, 10) === parseInt(cleanRoll, 10) || sRoll === cleanRoll);
          });
        }
      }

      // 3. Match by Student Name
      if (!matched) {
        matched = students.find(s => {
          const sName = (s.name || '').toLowerCase();
          const sNameEn = (s.nameEn || '').toLowerCase();
          return (sName && cleanFileName.includes(sName)) || (sNameEn && cleanFileName.includes(sNameEn)) || (sName && sName.includes(cleanFileName));
        });
      }

      newBulkItems.push({
        file: f,
        preview,
        fileName: f.name,
        matchedStudentId: matched ? matched.id : null,
        matchedStudentName: matched ? matched.name : undefined,
        matchedGrade: matched ? matched.grade : undefined,
        matchedRoll: matched ? matched.roll : undefined,
      });
    }

    setBulkPhotos(prev => [...prev, ...newBulkItems]);
  };

  const handleSaveBulkPhotos = () => {
    let savedCount = 0;
    bulkPhotos.forEach(item => {
      if (item.matchedStudentId && item.preview) {
        const st = students.find(s => s.id === item.matchedStudentId);
        if (st) {
          studentService.updateStudent({ ...st, photo: item.preview } as any);
          savedCount++;
        }
      }
    });

    if (savedCount > 0) {
      setStudents(studentService.getAllStudents() as any);
      showToast(`সফলভাবে ${savedCount} জন শিক্ষার্থীর ছবি আপডেট হয়েছে!`, 'success');
      setShowBulkPhotoModal(false);
      setBulkPhotos([]);
    } else {
      showToast('কোনো শিক্ষার্থীর সাথে ছবি মেলেনি! অনুগ্রহ করে ড্রপডাউন থেকে শিক্ষার্থী নির্বাচন করুন।', 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 🖨️ STATE FOR PROFESSIONAL STUDENT LIST PRINT & REPORT SUITE
  // ─────────────────────────────────────────────────────────────
  const [printGradeFilter, setPrintGradeFilter] = useState<string>('all');
  const [printBranchFilter, setPrintBranchFilter] = useState<string>('all');
  const [printGroupFilter, setPrintGroupFilter] = useState<string>('all');
  const [printReligionFilter, setPrintReligionFilter] = useState<string>('all');
  const [printGenderFilter, setPrintGenderFilter] = useState<string>('all');
  const [printStipendFilter, setPrintStipendFilter] = useState<string>('all');
  const [printSearchQuery, setPrintSearchQuery] = useState<string>('');
  const [printOrientation, setPrintOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [printFontSize, setPrintFontSize] = useState<'xs' | 'sm' | 'base'>('xs');
  const [showColumnSelector, setShowColumnSelector] = useState<boolean>(false);
  const [showBlankPadModal, setShowBlankPadModal] = useState<boolean>(false);
  const [printReportTab, setPrintReportTab] = useState<'detailed' | 'summary'>('detailed');
  const [schoolSettings, setSchoolSettings] = useState<any>(null);

  // Column configuration list (User can check/uncheck columns)
  const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({
    sl: true,
    roll: true,
    id: true,
    name: true,
    gender: true,
    religion: true,
    grade: true,
    group: true,
    guardian: true,
    fatherNid: false,
    motherName: false,
    motherNid: false,
    mobile: true,
    optionalSubject: true,
    birthRegNo: false,
    dob: false,
    bloodGroup: false,
    address: false,
    stipend: false,
    remarks: true,
  });

  const toggleColumn = (key: string) => {
    setSelectedColumns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const setColumnPreset = (preset: 'basic' | 'contact' | 'official' | 'all' | 'none') => {
    if (preset === 'all') {
      const allTrue: Record<string, boolean> = {};
      Object.keys(selectedColumns).forEach(k => { allTrue[k] = true; });
      setSelectedColumns(allTrue);
    } else if (preset === 'none') {
      const allFalse: Record<string, boolean> = {};
      Object.keys(selectedColumns).forEach(k => { allFalse[k] = false; });
      allFalse.sl = true;
      allFalse.name = true;
      setSelectedColumns(allFalse);
    } else if (preset === 'basic') {
      setSelectedColumns({
        sl: true,
        roll: true,
        id: true,
        name: true,
        gender: true,
        religion: false,
        grade: true,
        group: true,
        guardian: false,
        fatherNid: false,
        motherName: false,
        motherNid: false,
        mobile: true,
        optionalSubject: true,
        birthRegNo: false,
        dob: false,
        bloodGroup: false,
        address: false,
        stipend: false,
        remarks: true,
      });
    } else if (preset === 'contact') {
      setSelectedColumns({
        sl: true,
        roll: true,
        id: false,
        name: true,
        gender: false,
        religion: false,
        grade: true,
        group: false,
        guardian: true,
        fatherNid: true,
        motherName: true,
        motherNid: false,
        mobile: true,
        optionalSubject: false,
        birthRegNo: false,
        dob: false,
        bloodGroup: false,
        address: true,
        stipend: false,
        remarks: true,
      });
    } else if (preset === 'official') {
      setSelectedColumns({
        sl: true,
        roll: true,
        id: true,
        name: true,
        gender: true,
        religion: true,
        grade: true,
        group: true,
        guardian: true,
        fatherNid: false,
        motherName: false,
        motherNid: false,
        mobile: true,
        optionalSubject: true,
        birthRegNo: true,
        dob: true,
        bloodGroup: true,
        address: false,
        stipend: false,
        remarks: true,
      });
    }
  };

  const loadStudentsFromStorage = () => {
    const allSt = studentService.getAllStudents();
    let pMap: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      const savedPhotos = localStorage.getItem('sms_student_photos');
      if (savedPhotos) {
        try { pMap = JSON.parse(savedPhotos); } catch (e) {}
      }
    }

    const mapped: StudentItem[] = allSt.map((s, idx) => {
      const g = (s.grade || s.gradeBn || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const photo = s.photo || pMap[s.id] || (s.roll ? pMap[`${g}_${s.roll}`] : undefined) || (s.roll ? pMap[s.roll] : undefined);
      return {
        id: s.id || `STD-2026-${4554 + idx}`,
        name: s.name,
        roll: s.roll || String(idx + 1).padStart(2, '0'),
        grade: s.grade || '8th',
        branch: s.branch || s.section || 'A',
        group: s.group || 'সাধারণ',
        optionalSubject: s.optionalSubject || 'কৃষি শিক্ষা',
        guardian: s.guardian || s.fatherName || 'অভিভাবকের নাম',
        fatherNid: s.fatherNid || '19801234567890101',
        motherName: s.motherName || 'মাতার নাম',
        motherNid: s.motherNid || '19841234567890102',
        mobile: s.mobile || '01812000109',
        attendance: s.attendance || 100,
        gpa: s.gpa || 'N/A',
        birthRegNo: s.birthRegNo || '20101234567890123',
        dob: s.dob || '2010-05-15',
        gender: s.gender || 'পুরুষ',
        religion: s.religion || 'ইসলাম',
        bloodGroup: s.bloodGroup || 'B+',
        currentAddress: s.currentAddress || 'বরইতলী, চকরিয়া, কক্সবাজার',
        permanentAddress: s.permanentAddress || 'বরইতলী, চকরিয়া, কক্সবাজার',
        photo: photo,
        remarks: s.remarks || 'শিক্ষার্থী ডিরেক্টরি'
      };
    });

    setStudents(mapped);
  };

  const loadSchoolSettings = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sms_school_settings');
      if (stored) {
        try {
          setSchoolSettings(JSON.parse(stored));
        } catch (e) {}
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    setCurrentLang(languageService.getLanguage());
    const unsubLang = languageService.subscribe(l => setCurrentLang(l));
    loadStudentsFromStorage();
    loadSchoolSettings();

    if (typeof window !== 'undefined') {
      const handleStorage = () => {
        loadStudentsFromStorage();
        loadSchoolSettings();
      };
      window.addEventListener('storage', handleStorage);
      return () => {
        unsubLang();
        window.removeEventListener('storage', handleStorage);
      };
    }
    return () => unsubLang();
  }, []);

  // Reactively respond to URL query params (e.g. ?view=print or ?tab=summary)
  useEffect(() => {
    if (searchParams) {
      const view = searchParams.get('view');
      const tab = searchParams.get('tab');
      const print = searchParams.get('print');

      if (view === 'print' || print === 'true') {
        setActiveView('print_list');
        setPrintReportTab('detailed');
      } else if (view === 'summary' || tab === 'summary') {
        setActiveView('print_list');
        setPrintReportTab('summary');
      } else if (view === 'list') {
        setActiveView('list');
      }
    }
  }, [searchParams]);

  const handleExportCSV = () => {
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

    const rows = printableFilteredStudents.map((st, idx) => {
      const row: string[] = [];
      if (selectedColumns.sl) row.push(String(idx + 1));
      if (selectedColumns.roll) row.push(`"${st.roll}"`);
      if (selectedColumns.id) row.push(`"${st.id}"`);
      if (selectedColumns.name) row.push(`"${st.name}"`);
      if (selectedColumns.gender) row.push(`"${st.gender || 'পুরুষ'}"`);
      if (selectedColumns.religion) row.push(`"${st.religion || 'ইসলাম'}"`);
      if (selectedColumns.grade) row.push(`"${st.grade} (${st.branch})"`);
      if (selectedColumns.group) row.push(`"${st.group}"`);
      if (selectedColumns.guardian) row.push(`"${st.guardian}"`);
      if (selectedColumns.fatherNid) row.push(`"${st.fatherNid || ''}"`);
      if (selectedColumns.motherName) row.push(`"${st.motherName || ''}"`);
      if (selectedColumns.motherNid) row.push(`"${st.motherNid || ''}"`);
      if (selectedColumns.mobile) row.push(`"${st.mobile}"`);
      if (selectedColumns.optionalSubject) row.push(`"${st.optionalSubject}"`);
      if (selectedColumns.birthRegNo) row.push(`"${st.birthRegNo || ''}"`);
      if (selectedColumns.dob) row.push(`"${st.dob || ''}"`);
      if (selectedColumns.bloodGroup) row.push(`"B+"`);
      if (selectedColumns.address) row.push(`"${st.currentAddress || ''}"`);
      if (selectedColumns.stipend) row.push(`"${(st as any).isStipend ? 'হ্যাঁ' : 'না'}"`);
      if (selectedColumns.remarks) row.push(`""`);
      return row.join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Student_List_${printGradeFilter}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSummaryCSV = () => {
    const headers = ['ক্রমিক', 'শ্রেণি', 'গ্রুপ/বিভাগ', 'ছাত্র', 'ছাত্রী', 'মোট'];
    const rows = classSummaryData.map((row, idx) => [
      String(idx + 1),
      `"${row.grade}"`,
      `"${row.group}"`,
      String(row.boys),
      String(row.girls),
      String(row.total)
    ].join(','));

    rows.push([
      '""',
      '"সর্বমোট"',
      '""',
      String(summaryTotalBoys),
      String(summaryTotalGirls),
      String(summaryGrandTotal)
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Student_Summary_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate QR code whenever selected student changes for view or print
  useEffect(() => {
    if (selectedStudent && selectedStudent.id) {
      QRCode.toDataURL(selectedStudent.id, { margin: 1, width: 140 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error(err));
    }
  }, [selectedStudent]);

  const switchView = (targetView: ViewState, student: StudentItem | null = null) => {
    setIsLoadingView(true);
    setSelectedStudent(student);
    if (student && targetView === 'edit') {
      setEditFormData({ ...student });
    }
    
    if (typeof window !== 'undefined') {
      if (targetView === 'print_list') {
        window.history.replaceState(null, '', '/dashboard/students?view=print');
      } else if (targetView === 'list') {
        window.history.replaceState(null, '', '/dashboard/students');
      }
    }

    // Smooth in-page loading transition
    setTimeout(() => {
      setActiveView(targetView);
      setIsLoadingView(false);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleDelete = (id: string) => {
    if (confirm('আপনি কি নিশ্চিত যে এই শিক্ষার্থীকে অপসারণ করতে চান?')) {
      studentService.deleteStudent(id);
      loadStudentsFromStorage();
      if (selectedStudent?.id === id) {
        switchView('list');
      }
    }
  };

  const handleSaveEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    studentService.updateStudent(editFormData as any);
    if (editFormData.photo) {
      studentService.saveStudentPhoto(editFormData.id, editFormData.photo);
    }
    loadStudentsFromStorage();
    
    alert('🎉 শিক্ষার্থীর সকল তথ্য প্রফেশনালভাবে আপডেট ও সংরক্ষিত হয়েছে!');
    switchView('view', editFormData);
  };

  const filteredStudents = students.filter((st) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      st.name.toLowerCase().includes(q) ||
      st.roll.includes(q) ||
      st.id.toLowerCase().includes(q) ||
      st.guardian.toLowerCase().includes(q) ||
      st.mobile.includes(q);

    const matchesGrade =
      gradeFilter === 'all' ||
      st.grade.toLowerCase() === gradeFilter.toLowerCase() ||
      (gradeFilter === '6th' && (st.grade.includes('6') || st.grade.includes('৬'))) ||
      (gradeFilter === '7th' && (st.grade.includes('7') || st.grade.includes('৭'))) ||
      (gradeFilter === '8th' && (st.grade.includes('8') || st.grade.includes('৮'))) ||
      (gradeFilter === '9th' && (st.grade.includes('9') || st.grade.includes('৯'))) ||
      (gradeFilter === '10th' && (st.grade.includes('10') || st.grade.includes('১০')));

    const matchesBranch =
      branchFilter === 'all' ||
      (st.branch && st.branch.toLowerCase() === branchFilter.toLowerCase()) ||
      (st.branch && branchFilter === 'A' && (st.branch.includes('A') || st.branch.includes('ক'))) ||
      (st.branch && branchFilter === 'B' && (st.branch.includes('B') || st.branch.includes('খ'))) ||
      (st.branch && branchFilter === 'C' && (st.branch.includes('C') || st.branch.includes('গ')));

    const matchesGender =
      genderFilter === 'all' ||
      (genderFilter === 'male' && (st.gender?.includes('পুরুষ') || st.gender?.includes('ছেলে') || st.gender?.toLowerCase() === 'male')) ||
      (genderFilter === 'female' && (st.gender?.includes('নারী') || st.gender?.includes('মহিলা') || st.gender?.includes('মেয়ে') || st.gender?.toLowerCase() === 'female'));

    const matchesGroup =
      groupFilter === 'all' ||
      (st.group && (st.group.toLowerCase().includes(groupFilter.toLowerCase()) || (groupFilter === 'সাধারণ' && st.group === 'সাধারণ')));

    return matchesSearch && matchesGrade && matchesBranch && matchesGender && matchesGroup;
  });

  const totalStudents = students.length;

  // ─────────────────────────────────────────────────────────────
  // 🖨️ FILTERED STUDENTS & METRICS FOR PRINT LIST VIEW
  // ─────────────────────────────────────────────────────────────
  const printableFilteredStudents = students.filter((st) => {
    // 1. Grade filter
    const matchGrade = printGradeFilter === 'all' || 
      st.grade.toLowerCase() === printGradeFilter.toLowerCase() ||
      (printGradeFilter === '6th' && (st.grade.includes('6') || st.grade.includes('৬'))) ||
      (printGradeFilter === '7th' && (st.grade.includes('7') || st.grade.includes('৭'))) ||
      (printGradeFilter === '8th' && (st.grade.includes('8') || st.grade.includes('৮'))) ||
      (printGradeFilter === '9th' && (st.grade.includes('9') || st.grade.includes('৯'))) ||
      (printGradeFilter === '10th' && (st.grade.includes('10') || st.grade.includes('১০')));

    // 2. Branch/Section filter
    const matchBranch = printBranchFilter === 'all' || (st.branch && st.branch.toLowerCase() === printBranchFilter.toLowerCase());

    // 3. Group filter
    const matchGroup = printGroupFilter === 'all' || (st.group && st.group.includes(printGroupFilter));

    // 4. Religion filter
    const matchReligion = printReligionFilter === 'all' || (st.religion && (
      printReligionFilter === 'ইসলাম' ? (st.religion.includes('ইসলাম') || st.religion.includes('Muslim')) :
      printReligionFilter === 'হিন্দু' ? (st.religion.includes('হিন্দু') || st.religion.includes('Hindu') || st.religion.includes('সনাতন')) :
      printReligionFilter === 'বৌদ্ধ' ? (st.religion.includes('বৌদ্ধ') || st.religion.includes('Buddhist')) :
      printReligionFilter === 'খ্রিস্টান' ? (st.religion.includes('খ্রিস্টান') || st.religion.includes('Christian')) :
      st.religion.includes(printReligionFilter)
    ));

    // 5. Gender filter
    const matchGender = printGenderFilter === 'all' || (st.gender && (
      printGenderFilter === 'পুরুষ' ? (st.gender.includes('পুরুষ') || st.gender.includes('ছেলে') || st.gender.toLowerCase() === 'male') :
      (st.gender.includes('মহিলা') || st.gender.includes('মেয়ে') || st.gender.toLowerCase() === 'female')
    ));

    // 6. Stipend filter
    const matchStipend = printStipendFilter === 'all' || (printStipendFilter === 'stipend_only' && (st as any).isStipend);

    // 7. Search query
    const matchSearch = !printSearchQuery ||
      st.name.toLowerCase().includes(printSearchQuery.toLowerCase()) ||
      st.roll.includes(printSearchQuery) ||
      st.id.toLowerCase().includes(printSearchQuery.toLowerCase()) ||
      st.guardian.toLowerCase().includes(printSearchQuery.toLowerCase()) ||
      st.mobile.includes(printSearchQuery);

    return matchGrade && matchBranch && matchGroup && matchReligion && matchGender && matchStipend && matchSearch;
  });

  // Calculate Print List Statistics
  const printTotalCount = printableFilteredStudents.length;
  const printMaleCount = printableFilteredStudents.filter(s => s.gender && (s.gender.includes('পুরুষ') || s.gender.includes('ছেলে') || s.gender.toLowerCase() === 'male')).length;
  const printFemaleCount = printableFilteredStudents.filter(s => s.gender && (s.gender.includes('মহিলা') || s.gender.includes('মেয়ে') || s.gender.toLowerCase() === 'female')).length;
  const printMuslimCount = printableFilteredStudents.filter(s => s.religion && (s.religion.includes('ইসলাম') || s.religion.includes('Muslim'))).length;
  const printHinduCount = printableFilteredStudents.filter(s => s.religion && (s.religion.includes('হিন্দু') || s.religion.includes('Hindu') || s.religion.includes('সনাতন'))).length;
  const printOthersCount = Math.max(0, printTotalCount - printMuslimCount - printHinduCount);
  const printStipendCount = printableFilteredStudents.filter(s => (s as any).isStipend).length;

  // ─────────────────────────────────────────────────────────────
  // 📊 CLASS & GROUP-WISE SUMMARY REPORT CALCULATION
  // ─────────────────────────────────────────────────────────────
  const classSummaryData = React.useMemo(() => {
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

    const baseList = students.filter(st => {
      const matchBranch = printBranchFilter === 'all' || (st.branch && st.branch.toLowerCase() === printBranchFilter.toLowerCase());
      const matchReligion = printReligionFilter === 'all' || (st.religion && (
        printReligionFilter === 'ইসলাম' ? (st.religion.includes('ইসলাম') || st.religion.includes('Muslim')) :
        printReligionFilter === 'হিন্দু' ? (st.religion.includes('হিন্দু') || st.religion.includes('Hindu') || st.religion.includes('সনাতন')) :
        printReligionFilter === 'বৌদ্ধ' ? (st.religion.includes('বৌদ্ধ') || st.religion.includes('Buddhist')) :
        printReligionFilter === 'খ্রিস্টান' ? (st.religion.includes('খ্রিস্টান') || st.religion.includes('Christian')) :
        st.religion.includes(printReligionFilter)
      ));
      const matchStipend = printStipendFilter === 'all' || (printStipendFilter === 'stipend_only' && (st as any).isStipend);
      return matchBranch && matchReligion && matchStipend;
    });

    const rows = standardSpecs.map(spec => {
      const matched = baseList.filter(st => {
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
        } else {
          if (spec.group === 'বিজ্ঞান') matchGroup = grp.includes('বিজ্ঞান') || grp.toLowerCase().includes('sci');
          else if (spec.group === 'মানবিক') matchGroup = grp.includes('মানবিক') || grp.toLowerCase().includes('hum') || grp.toLowerCase().includes('arts');
          else if (spec.group === 'ব্যবসায় শিক্ষা') matchGroup = grp.includes('ব্যবসায়') || grp.includes('বাণিজ্য') || grp.toLowerCase().includes('com') || grp.toLowerCase().includes('bus');
        }

        return matchGrade && matchGroup;
      });

      const boys = matched.filter(s => s.gender && (s.gender.includes('পুরুষ') || s.gender.includes('ছেলে') || s.gender.toLowerCase() === 'male')).length;
      const girls = matched.filter(s => s.gender && (s.gender.includes('মহিলা') || s.gender.includes('মেয়ে') || s.gender.toLowerCase() === 'female')).length;
      const total = matched.length;

      return {
        grade: spec.gradeBn,
        group: spec.group,
        boys,
        girls,
        total,
      };
    });

    return rows;
  }, [students, printBranchFilter, printReligionFilter, printStipendFilter]);

  const summaryTotalBoys = classSummaryData.reduce((sum, r) => sum + r.boys, 0);
  const summaryTotalGirls = classSummaryData.reduce((sum, r) => sum + r.girls, 0);
  const summaryGrandTotal = classSummaryData.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Loading Overlay State for seamless in-page transitions */}
      {(!mounted || isLoadingView) && (
        <div className="py-12 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-extrabold text-indigo-900 uppercase tracking-widest">
            {!mounted ? 'শিক্ষার্থী ডিরেক্টরি লোড হচ্ছে...' : 'পৃষ্ঠা প্রস্তুত করা হচ্ছে...'}
          </p>
        </div>
      )}

      {mounted && !isLoadingView && (
        <>
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* 👁️ IN-PAGE VIEW 1: FULL STUDENT PROFILE VIEWER                    */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeView === 'view' && selectedStudent && (
            <div className="space-y-6">
              
              {/* Executive Top Navigation Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <button
                  onClick={() => switchView('list')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs transition cursor-pointer self-start sm:self-auto"
                >
                  <ArrowLeft size={16} /> শিক্ষার্থী তালিকায় ফিরে যান
                </button>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => switchView('print_form', selectedStudent)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition cursor-pointer"
                  >
                    <Printer size={15} /> অফিশিয়াল ভর্তি ফরম ও রসিদ
                  </button>
                  <button
                    onClick={() => switchView('edit', selectedStudent)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs shadow-md transition cursor-pointer"
                  >
                    <Pencil size={15} /> তথ্য সম্পাদনা করুন
                  </button>
                </div>
              </div>

              {/* Profile Main Card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-6">
                
                {/* Banner Header */}
                <div className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-950 p-6 sm:p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                  
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                    <div className="w-28 h-28 rounded-3xl bg-white/15 backdrop-blur-md border-4 border-white/20 flex items-center justify-center font-black text-white text-3xl shrink-0 overflow-hidden shadow-2xl">
                      {selectedStudent.photo ? (
                        <img src={selectedStudent.photo} alt="Student Photo" className="w-full h-full object-cover" />
                      ) : (
                        selectedStudent.name.charAt(0)
                      )}
                    </div>

                    <div className="space-y-2 text-center sm:text-left flex-1">
                      <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                        <span className="px-3 py-0.5 bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase rounded-full border border-emerald-400/30 flex items-center gap-1">
                          <CheckCircle2 size={12} /> সক্রিয় শিক্ষার্থী
                        </span>
                        <span className="px-3 py-0.5 bg-white/10 text-white font-bold text-[10px] rounded-full border border-white/20">
                          সেশন: ২০২৬
                        </span>
                      </div>
                      
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{selectedStudent.name}</h2>
                      
                      <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-indigo-200 font-semibold flex-wrap">
                        <span>আইডি: <strong className="font-mono text-amber-300">{selectedStudent.id}</strong></span>
                        <span>রোল: <strong className="font-mono text-white">{selectedStudent.roll}</strong></span>
                        <span>শ্রেণি: <strong className="text-white">{selectedStudent.grade} ({selectedStudent.branch})</strong></span>
                        <span>বিভাগ: <strong className="text-amber-300">{selectedStudent.group}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 📜 Profile Section Tabs: Details vs Certificates & Documents */}
                <div className="px-6 sm:px-8 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <button
                      onClick={() => setStudentProfileTab('details')}
                      className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                        studentProfileTab === 'details'
                          ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs rounded-t-xl'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <User size={15} /> ১. ব্যক্তিগত ও একাডেমিক তথ্য
                    </button>
                    <button
                      onClick={() => setStudentProfileTab('certificates')}
                      className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                        studentProfileTab === 'certificates'
                          ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs rounded-t-xl'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Award size={15} /> ২. সনদ ও অফিশিয়াল ডকুমেন্টস
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 font-mono">
                        {studentCertificates.length}
                      </span>
                    </button>
                  </div>

                  {studentProfileTab === 'certificates' && (
                    <Link
                      href={`/dashboard/certificates?action=create&studentId=${selectedStudent.id}`}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0 self-start sm:self-auto mb-2 sm:mb-0"
                    >
                      <Plus size={14} /> নতুন সনদ ইস্যু করুন
                    </Link>
                  )}
                </div>

                {/* Profile Grid Information */}
                {studentProfileTab === 'details' ? (
                <div className="p-6 sm:p-8 space-y-6">
                  
                  {/* Section 1: Personal Info */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                      <User size={16} className="text-indigo-600" /> ১. শিক্ষার্থীর ব্যক্তিগত তথ্য (Personal Details)
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">পূর্ণ নাম</span>
                        <span className="text-slate-900">{selectedStudent.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">জন্ম তারিখ</span>
                        <span className="text-slate-900">{selectedStudent.dob || '২০১০-০৫-১৫'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">লিঙ্গ (Gender)</span>
                        <span className="text-indigo-700">{selectedStudent.gender || 'পুরুষ'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">ধর্ম (Religion)</span>
                        <span className="text-slate-900">{selectedStudent.religion || 'ইসলাম'}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">ডিজিটাল জন্ম নিবন্ধন (17 Digits)</span>
                        <span className="text-indigo-900 font-mono">{selectedStudent.birthRegNo || '20101234567890123'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">রক্তের গ্রুপ</span>
                        <span className="text-rose-600 font-black">{(selectedStudent as any).bloodGroup || 'অজানা (Not set)'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">জাতীয়তা</span>
                        <span className="text-slate-900">বাংলাদেশী</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Academic Info */}
                  <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 space-y-4">
                    <h3 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-2 border-b border-indigo-200/60 pb-2">
                      <GraduationCap size={16} className="text-indigo-600" /> ২. একাডেমিক ও পারফরম্যান্স (Academic & Performance)
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">শ্রেণি</span>
                        <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs">{selectedStudent.grade}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">শাখা (Section)</span>
                        <span className="text-slate-900">{selectedStudent.branch || 'A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">বিভাগ/গ্রুপ</span>
                        <span className="text-emerald-700">{selectedStudent.group || 'সাধারণ'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">ঐচ্ছিক বিষয়</span>
                        <span className="text-slate-900">{selectedStudent.optionalSubject || 'প্রযোজ্য নয়'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">সর্বশেষ জিপিএ (GPA)</span>
                        <span className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs ${
                          selectedStudent.gpa === 'N/A' || !selectedStudent.gpa
                            ? 'bg-slate-100 text-slate-500 border border-slate-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {selectedStudent.gpa || 'N/A'}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">উপস্থিতির হার</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${selectedStudent.attendance}%` }}></div>
                          </div>
                          <span className="text-emerald-700 font-mono">{selectedStudent.attendance}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Parents & Address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Parents */}
                    <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 space-y-3">
                      <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-200/60 pb-2">
                        <Users size={16} className="text-emerald-600" /> ৩. পিতা-মাতা ও অভিভাবক
                      </h3>
                      <div className="space-y-2 text-xs font-bold text-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">পিতার নাম</span>
                          <span>{selectedStudent.guardian}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">পিতার NID</span>
                          <span className="font-mono text-indigo-900">{selectedStudent.fatherNid || '19801234567890101'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">মাতার নাম</span>
                          <span>{selectedStudent.motherName || 'ফাতেমা বেগম'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">মোবাইল নম্বর</span>
                          <span className="font-mono text-emerald-800">{selectedStudent.mobile}</span>
                        </div>
                      </div>
                    </div>

                    {/* Address & Verification */}
                    <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 space-y-3">
                      <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-2 border-b border-amber-200/60 pb-2">
                        <Building2 size={16} className="text-amber-600" /> ৪. ঠিকানা ও তথ্য ভেরিফিকেশন
                      </h3>
                      <div className="space-y-2 text-xs font-bold text-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">বর্তমান ঠিকানা</span>
                          <span>{selectedStudent.currentAddress || 'বরইতলী, চকরিয়া'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">স্থায়ী ঠিকানা</span>
                          <span>{selectedStudent.permanentAddress || selectedStudent.currentAddress || 'বরইতলী, চকরিয়া'}</span>
                        </div>
                        <div className="pt-2 flex items-center gap-3 border-t border-amber-200/60">
                          {qrCodeUrl && <img src={qrCodeUrl} alt="QR Verification" className="w-14 h-14 p-1 bg-white border border-amber-300 rounded-lg" />}
                          <div className="text-[10px]">
                            <span className="text-slate-500 block">ডিজিটাল ভেরিফিকেশন কোড</span>
                            <span className="font-mono font-black text-slate-900">{selectedStudent.id}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
                ) : (
                /* ─── 📜 TAB 2: CERTIFICATES & OFFICIAL DOCUMENTS ─── */
                <div className="p-6 sm:p-8 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Award size={18} className="text-indigo-600" />
                        শিক্ষার্থীর প্রত্যয়ন ও সনদপত্র হিস্ট্রি (Certificate Records)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedStudent.name} (রোল: {selectedStudent.roll}) এর নামে প্রস্তুতকৃত সকল সনদ ও দাপ্তরিক প্রত্যয়ন
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/certificates?action=create&studentId=${selectedStudent.id}`}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
                    >
                      <Plus size={14} /> নতুন সনদ তৈরি করুন
                    </Link>
                  </div>

                  {studentCertificates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studentCertificates.map((cert) => {
                        const isValid = cert.status === 'valid';
                        return (
                          <div
                            key={cert.id}
                            className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5 shadow-xs hover:shadow-md hover:border-indigo-300 transition"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                  {cert.id}
                                </span>
                                <h4 className="font-black text-slate-900 text-sm mt-1.5">
                                  {cert.title || cert.type}
                                </h4>
                                <p className="text-[11px] text-slate-500 font-mono">
                                  স্মারক: {cert.refNo || '—'}
                                </p>
                              </div>

                              {isValid ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                  <CheckCircle2 size={11} /> বৈধ
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                  <AlertCircle size={11} /> বাতিলকৃত
                                </span>
                              )}
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1 text-slate-600">
                              <p><strong>ইস্যুর তারিখ:</strong> <span className="font-mono">{cert.issueDate}</span></p>
                              <p><strong>প্রস্তুতকারক:</strong> {cert.createdBy || 'প্রধান শিক্ষক'}</p>
                              {cert.achievementTitle && (
                                <p className="text-amber-800 font-semibold"><strong>স্বীকৃতি:</strong> {cert.achievementTitle}</p>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                              <Link
                                href={`/verify-certificate?id=${cert.id}`}
                                target="_blank"
                                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                              >
                                <ShieldCheck size={14} /> অনলাইন যাচাই
                              </Link>

                              <button
                                onClick={() => setSelectedCertForPrint(cert)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <Printer size={13} /> ভিউ ও প্রিন্ট
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                        <FileText size={24} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-slate-900 text-sm">কোনো সনদপত্র ইস্যু করা হয়নি</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          {selectedStudent.name} এর জন্য এখনো কোনো প্রত্যয়ন পত্র বা সনদ তৈরি করা হয়নি।
                        </p>
                      </div>
                      <div className="pt-2">
                        <Link
                          href={`/dashboard/certificates?action=create&studentId=${selectedStudent.id}`}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition inline-flex items-center gap-2"
                        >
                          <Plus size={14} /> এই শিক্ষার্থীর জন্য প্রথম প্রত্যয়ন প্রস্তুত করুন
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Certificate Print Preview Modal */}
              {selectedCertForPrint && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto print:p-0 print:bg-white print:relative print:z-auto print:block">
                  <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[96vh] overflow-y-auto print:overflow-visible print:shadow-none print:max-w-none print:rounded-none">
                    <div className="flex items-center justify-between p-4 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-20 print:hidden">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">প্রত্যয়ন পত্র প্রিন্ট প্রিভিউ</h3>
                        <p className="text-[11px] text-slate-500 font-mono">সনদ নং: {selectedCertForPrint.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            certificateService.logPrintAction(selectedCertForPrint.id);
                            window.print();
                          }}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition"
                        >
                          <Printer size={14} /> প্রিন্ট (A4)
                        </button>
                        <button
                          onClick={() => setSelectedCertForPrint(null)}
                          className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="bg-slate-100/70 p-4 sm:p-6 flex justify-center overflow-x-auto print:p-0 print:bg-transparent">
                      <OfficialCertificateDoc
                        cert={selectedCertForPrint}
                        settings={settingsService.getSettings()}
                        overrideStyle={selectedCertForPrint.layoutStyle}
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* ✏️ IN-PAGE VIEW 2: EDIT STUDENT PANEL                             */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeView === 'edit' && editFormData && (
            <div className="space-y-6">
              
              {/* Executive Top Navigation Bar */}
              <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <button
                  onClick={() => switchView('view', editFormData)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs transition cursor-pointer"
                >
                  <ArrowLeft size={16} /> বাতিল ও প্রোফাইলে ফিরে যান
                </button>
                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                  <Pencil size={15} /> শিক্ষার্থী তথ্য সম্পাদনা মোড
                </div>
              </div>

              {/* Edit Form Container */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900">শিক্ষার্থী তথ্য সম্পাদনা (Edit Student Profile)</h2>
                  <p className="text-xs text-slate-400 font-semibold">শিক্ষার্থীর প্রয়োজনীয় ব্যক্তিগত, একাডেমিক ও পিতা-মাতার বিবরণ পরিবর্তন করুন</p>
                </div>

                <form onSubmit={handleSaveEditSubmit} className="space-y-6">
                  
                  {/* 📷 STUDENT PHOTO PREVIEW & UPLOAD CARD */}
                  <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-2xl text-white flex flex-col sm:flex-row items-center gap-5 shadow-sm border border-indigo-900/50">
                    <div className="relative group shrink-0">
                      <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-2xl bg-white/10 border-2 border-indigo-400/40 overflow-hidden flex flex-col items-center justify-center text-center shadow-lg relative">
                        {editFormData.photo ? (
                          <img
                            src={editFormData.photo}
                            alt={editFormData.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-300 p-2">
                            <User size={36} className="text-indigo-300 mb-1" />
                            <span className="text-[10px] font-extrabold text-indigo-200">কোনো ছবি নেই</span>
                          </div>
                        )}
                      </div>
                      {editFormData.photo && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md">
                          <Check size={12} />
                        </span>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center justify-center sm:justify-start gap-2">
                          শিক্ষার্থীর পাসপোর্ট ছবি (Student Photo)
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-400/30">
                            পাসপোর্ট সাইজ
                          </span>
                        </h4>
                        <p className="text-xs text-slate-300 font-medium mt-0.5">
                          ছবি আপলোড করলে স্বয়ংক্রিয়ভাবে পাসপোর্ট সাইজে অপ্টিমাইজড ও ডাটাবেজে সংরক্ষিত হবে।
                        </p>
                      </div>

                      <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap pt-1">
                        <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-1.5">
                          <Camera size={15} />
                          {editFormData.photo ? 'নতুন ছবি পরিবর্তন / আপলোড' : 'ছবি আপলোড করুন'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  alert('ছবির সাইজ সর্বোচ্চ ৫MB হতে পারবে।');
                                  return;
                                }
                                const compressed = await compressImage(file);
                                setEditFormData((prev) => prev ? { ...prev, photo: compressed } : null);
                              }
                            }}
                          />
                        </label>

                        {editFormData.photo && (
                          <button
                            type="button"
                            onClick={() => setEditFormData((prev) => prev ? { ...prev, photo: '' } : null)}
                            className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={14} /> ছবি অপসারণ
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Section 1: Personal Details */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                      <User size={15} /> ১. শিক্ষার্থীর ব্যক্তিগত তথ্য
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-bold">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">শিক্ষার্থীর পূর্ণ নাম *</label>
                        <input
                          type="text"
                          required
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">জন্ম তারিখ (DOB)</label>
                        <input
                          type="date"
                          value={editFormData.dob || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">লিঙ্গ (Gender)</label>
                        <select
                          value={editFormData.gender || 'পুরুষ'}
                          onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 cursor-pointer"
                        >
                          <option value="পুরুষ">{currentLang === 'en' ? 'Male' : 'পুরুষ'}</option>
                          <option value="নারী">{currentLang === 'en' ? 'Female' : 'নারী'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">ধর্ম (Religion)</label>
                        <select
                          value={editFormData.religion || 'ইসলাম'}
                          onChange={(e) => setEditFormData({ ...editFormData, religion: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 cursor-pointer"
                        >
                          <option value="ইসলাম">{currentLang === 'en' ? 'Islam' : 'ইসলাম'}</option>
                          <option value="হিন্দু">{currentLang === 'en' ? 'Hinduism' : 'হিন্দু'}</option>
                          <option value="খ্রিস্টান">{currentLang === 'en' ? 'Christianity' : 'খ্রিস্টান'}</option>
                          <option value="বৌদ্ধ">{currentLang === 'en' ? 'Buddhism' : 'বৌদ্ধ'}</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">১৭ ডিজিটের ডিজিটাল জন্ম নিবন্ধন নম্বর</label>
                        <input
                          type="text"
                          value={editFormData.birthRegNo || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, birthRegNo: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Academic Details */}
                  <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 space-y-4">
                    <h3 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-2 border-b border-indigo-200/60 pb-2">
                      <GraduationCap size={15} /> ২. একাডেমিক তথ্য
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">শ্রেণি রোল *</label>
                        <input
                          type="text"
                          required
                          value={editFormData.roll}
                          onChange={(e) => setEditFormData({ ...editFormData, roll: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">শ্রেণি (Grade) *</label>
                        <select
                          value={editFormData.grade}
                          onChange={(e) => setEditFormData({ ...editFormData, grade: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 cursor-pointer"
                        >
                          <option value="6th">৬ষ্ঠ শ্রেণি (Class 6)</option>
                          <option value="7th">৭ম শ্রেণি (Class 7)</option>
                          <option value="8th">৮ম শ্রেণি (Class 8)</option>
                          <option value="9th">৯ম শ্রেণি (Class 9)</option>
                          <option value="10th">১০ম শ্রেণি (Class 10)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">
                          {editFormData.grade === '9th' || editFormData.grade === '10th' ? (currentLang === 'en' ? 'Group' : 'বিভাগ') : (currentLang === 'en' ? 'Section' : 'শাখা')}
                        </label>
                        <select
                          value={editFormData.branch}
                          onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 cursor-pointer"
                        >
                          <option value="A">Section A</option>
                          <option value="B">Section B</option>
                          <option value="C">Section C</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">বিভাগ / গ্রুপ</label>
                        <select
                          value={editFormData.group}
                          onChange={(e) => setEditFormData({ ...editFormData, group: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 cursor-pointer"
                        >
                          <option value="সাধারণ">{currentLang === 'en' ? 'General' : 'সাধারণ'}</option>
                          <option value="বিজ্ঞান">{currentLang === 'en' ? 'Science' : 'বিজ্ঞান'}</option>
                          <option value="মানবিক">{currentLang === 'en' ? 'Humanities' : 'মানবিক'}</option>
                          <option value="ব্যবসায় শিক্ষা">{currentLang === 'en' ? 'Business Studies' : 'ব্যবসায় শিক্ষা'}</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">ঐচ্ছিক বিষয়</label>
                        <select
                          value={editFormData.optionalSubject}
                          onChange={(e) => setEditFormData({ ...editFormData, optionalSubject: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 cursor-pointer"
                        >
                          <option value="কৃষি শিক্ষা">কৃষি শিক্ষা</option>
                          <option value="উচ্চতর গণিত">উচ্চতর গণিত</option>
                          <option value="কম্পিউটার শিক্ষা">কম্পিউটার শিক্ষা</option>
                          <option value="গার্হস্থ্য বিজ্ঞান">গার্হস্থ্য বিজ্ঞান</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">GPA / গ্রেড পয়েন্ট</label>
                        <input
                          type="text"
                          value={editFormData.gpa}
                          onChange={(e) => setEditFormData({ ...editFormData, gpa: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                        />
                      </div>

                      {/* Stipend Beneficiary Selection Field */}
                      <div className="sm:col-span-4 bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="editIsStipend"
                            checked={!!(editFormData as any).isStipend}
                            onChange={(e) => setEditFormData({ ...editFormData, isStipend: e.target.checked } as any)}
                            className="w-5 h-5 accent-amber-500 rounded cursor-pointer shrink-0"
                          />
                          <label htmlFor="editIsStipend" className="text-xs font-black text-amber-950 cursor-pointer flex items-center gap-1.5">
                            <Award size={16} className="text-amber-600 shrink-0" />
                            {currentLang === 'en' ? 'Mark as Stipend Beneficiary (100% Free Tuition)' : 'উপবৃত্তি প্রাপ্ত শিক্ষার্থী হিসেবে চিহ্নিত করুন (১০০% ফ্রি বেতন)'}
                          </label>
                        </div>

                        {!!(editFormData as any).isStipend && (
                          <div className="flex items-center gap-2 shrink-0">
                            <label className="text-[10px] font-black text-amber-800 uppercase">ক্যাটাগরি:</label>
                            <select
                              value={(editFormData as any).stipendCategory || 'সাধারণ উপবৃত্তি'}
                              onChange={(e) => setEditFormData({ ...editFormData, stipendCategory: e.target.value } as any)}
                              className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl font-bold text-xs text-amber-900 outline-none"
                            >
                              <option value="সাধারণ উপবৃত্তি">সাধারণ উপবৃত্তি</option>
                              <option value="মেধাভিত্তিক উপবৃত্তি">মেধাভিত্তিক উপবৃত্তি</option>
                              <option value="বিশেষ সহায়তা">বিশেষ সহায়তা</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Parents & Contact */}
                  <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 space-y-4">
                    <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-200/60 pb-2">
                      <Users size={15} /> ৩. পিতা-মাতা ও অভিভাবক বিবরণী
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-bold">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">পিতার নাম *</label>
                        <input
                          type="text"
                          required
                          value={editFormData.guardian}
                          onChange={(e) => setEditFormData({ ...editFormData, guardian: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">পিতার NID</label>
                        <input
                          type="text"
                          value={editFormData.fatherNid || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, fatherNid: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">মাতার নাম</label>
                        <input
                          type="text"
                          value={editFormData.motherName || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, motherName: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">মোবাইল নম্বর *</label>
                        <input
                          type="tel"
                          required
                          value={editFormData.mobile}
                          onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Address */}
                  <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 space-y-4">
                    <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-2 border-b border-amber-200/60 pb-2">
                      <Building2 size={15} /> ৪. ঠিকানা
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">বর্তমান ঠিকানা</label>
                        <input
                          type="text"
                          value={editFormData.currentAddress || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, currentAddress: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase mb-1">স্থায়ী ঠিকানা</label>
                        <input
                          type="text"
                          value={editFormData.permanentAddress || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, permanentAddress: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Footer Action */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => switchView('view', selectedStudent)}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Save size={16} /> পরিবর্তনসমূহ সেভ করুন
                    </button>
                  </div>

                </form>

              </div>

            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* 🖨️ IN-PAGE VIEW 3: OFFICIAL PRINTABLE ADMISSION FORM (A4)        */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeView === 'print_form' && selectedStudent && (
            <div className="space-y-6">
              <OfficialAdmissionForm
                data={{
                  appId: selectedStudent.id,
                  name: selectedStudent.name,
                  nameEn: selectedStudent.nameEn || selectedStudent.name,
                  grade: selectedStudent.grade,
                  section: selectedStudent.branch || selectedStudent.section,
                  roll: selectedStudent.roll,
                  group: selectedStudent.group,
                  optionalSubject: selectedStudent.optionalSubject,
                  dob: selectedStudent.dob,
                  gender: selectedStudent.gender,
                  religion: selectedStudent.religion,
                  bloodGroup: selectedStudent.bloodGroup,
                  birthRegNo: selectedStudent.birthRegNo,
                  fatherName: selectedStudent.fatherName || selectedStudent.guardian,
                  fatherNameEn: selectedStudent.fatherNameEn,
                  fatherNid: selectedStudent.fatherNid,
                  fatherOccupation: selectedStudent.fatherOccupation,
                  motherName: selectedStudent.motherName,
                  motherNameEn: selectedStudent.motherNameEn,
                  motherNid: selectedStudent.motherNid,
                  motherOccupation: selectedStudent.motherOccupation,
                  guardian: selectedStudent.guardian,
                  guardianRelation: selectedStudent.guardianRelation,
                  mobile: selectedStudent.mobile,
                  currentAddress: selectedStudent.currentAddress,
                  permanentAddress: selectedStudent.permanentAddress,
                  prevSchoolName: selectedStudent.prevSchoolName,
                  prevGpa: selectedStudent.prevGpa,
                  photo: selectedStudent.photo,
                  isStipend: selectedStudent.isStipend,
                }}
                settings={schoolSettings}
                onPrint={() => window.print()}
                onClose={() => switchView('view', selectedStudent)}
              />
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* 🖨️ IN-PAGE VIEW: PROFESSIONAL STUDENT LIST PRINTING & REPORT SUITE */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeView === 'print_list' && (
            <div className="space-y-6">
              
              {/* TOP ACTION & CONTROLS RIBBON (Hidden in print) */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm print:hidden space-y-4">
                
                {/* ─── REPORT MODE SWITCHER TABS ─── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  
                  {/* Left: Back Button & Mode Tabs */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => switchView('list')}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs transition cursor-pointer"
                    >
                      <ArrowLeft size={16} /> শিক্ষার্থী তালিকায় ফিরুন
                    </button>

                    <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                      <button
                        onClick={() => {
                          setPrintReportTab('detailed');
                          setPrintOrientation('landscape');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          printReportTab === 'detailed' 
                            ? 'bg-white text-indigo-950 shadow-sm font-black' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FileText size={15} className="text-indigo-600" />
                        বিস্তারিত শিক্ষার্থী তালিকা
                      </button>
                      <button
                        onClick={() => {
                          setPrintReportTab('summary');
                          setPrintOrientation('portrait');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          printReportTab === 'summary' 
                            ? 'bg-white text-emerald-950 shadow-sm font-black' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <BarChart3 size={15} className="text-emerald-600" />
                        শ্রেণি ও বিভাগ সামারি রিপোর্ট
                      </button>
                    </div>
                  </div>

                  {/* Right: Print & Export Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    
                    {/* Custom Column Selector Button (Only on detailed list) */}
                    {printReportTab === 'detailed' && (
                      <button
                        onClick={() => setShowColumnSelector(!showColumnSelector)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-black text-xs transition border cursor-pointer ${
                          showColumnSelector 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        <SlidersHorizontal size={15} /> 
                        কাস্টম কলাম ({Object.values(selectedColumns).filter(Boolean).length})
                      </button>
                    )}

                    {/* Orientation Toggle */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                      <button
                        onClick={() => setPrintOrientation('portrait')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          printOrientation === 'portrait' ? 'bg-white text-indigo-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        📄 পোর্ট্রেট
                      </button>
                      <button
                        onClick={() => setPrintOrientation('landscape')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          printOrientation === 'landscape' ? 'bg-white text-indigo-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        📜 ল্যান্ডস্কেপ
                      </button>
                    </div>

                    {/* CSV Export Button */}
                    <button
                      onClick={printReportTab === 'summary' ? handleExportSummaryCSV : handleExportCSV}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs transition border border-slate-200 cursor-pointer"
                      title="CSV এক্সপোর্ট"
                    >
                      <FileSpreadsheet size={15} className="text-emerald-600" /> এক্সেল / CSV
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowBlankPadModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-2xl font-black text-xs transition border border-emerald-200 cursor-pointer"
                    >
                      <Printer size={15} /> ফাঁকা স্কুল প্যাড
                    </button>

                    {/* Print / PDF Button */}
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-xl transition transform active:scale-95 cursor-pointer"
                    >
                      <Printer size={16} /> প্রিন্ট / PDF সংরক্ষণ
                    </button>
                  </div>
                </div>

                {/* ─── CUSTOM COLUMN SELECTOR DRAWER / PANEL ─── */}
                {showColumnSelector && (
                  <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-indigo-200 space-y-4 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div>
                        <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                          <CheckSquare size={16} className="text-indigo-600" />
                          {currentLang === 'en' ? 'Select Print Columns' : 'প্রিন্ট কলাম নির্বাচন'}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">যে যে কলামগুলো তালিকায় ও প্রিন্টে রাখতে চান সেগুলো টিক চিহ্ন দিন</p>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase">প্রিসেট:</span>
                        <button
                          onClick={() => setColumnPreset('basic')}
                          className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          বেসিক তালিকা
                        </button>
                        <button
                          onClick={() => setColumnPreset('contact')}
                          className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          যোগাযোগ ও অভিভাবক
                        </button>
                        <button
                          onClick={() => setColumnPreset('official')}
                          className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          অফিশিয়াল রেজিস্টার
                        </button>
                        <button
                          onClick={() => setColumnPreset('all')}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-[11px] font-black transition cursor-pointer"
                        >
                          সব কলাম অন
                        </button>
                      </div>
                    </div>

                    {/* Columns Checkbox Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs">
                      {[
                        { key: 'sl', label: currentLang === 'en' ? 'SL' : 'ক্র.নং', required: true },
                        { key: 'roll', label: currentLang === 'en' ? 'Roll' : 'রোল' },
                        { key: 'id', label: currentLang === 'en' ? 'Student ID' : 'শিক্ষার্থী আইডি' },
                        { key: 'name', label: currentLang === 'en' ? 'Student Name' : 'শিক্ষার্থীর নাম' },
                        { key: 'gender', label: currentLang === 'en' ? 'Gender' : 'লিঙ্গ' },
                        { key: 'religion', label: currentLang === 'en' ? 'Religion' : 'ধর্ম' },
                        { key: 'grade', label: currentLang === 'en' ? 'Class & Sec' : 'শ্রেণি ও শাখা' },
                        { key: 'group', label: currentLang === 'en' ? 'Group' : 'বিভাগ' },
                        { key: 'guardian', label: '৯. পিতার নাম/অভিভাবক' },
                        { key: 'fatherNid', label: '১০. পিতার NID' },
                        { key: 'motherName', label: '১১. মাতার নাম' },
                        { key: 'motherNid', label: '১২. মাতার NID' },
                        { key: 'mobile', label: '১৩. মোবাইল নম্বর' },
                        { key: 'optionalSubject', label: '১৪. ৪র্থ/ঐচ্ছিক বিষয়' },
                        { key: 'birthRegNo', label: '১৫. জন্ম নিবন্ধন নম্বর' },
                        { key: 'dob', label: currentLang === 'en' ? 'Date of Birth' : 'জন্ম তারিখ' },
                        { key: 'bloodGroup', label: '১৭. রক্তের গ্রুপ' },
                        { key: 'address', label: '১৮. ঠিকানা / গ্রাম' },
                        { key: 'stipend', label: '১৯. উপবৃত্তি স্ট্যাটাস' },
                        { key: 'remarks', label: '২০. মন্তব্য / স্বাক্ষর' },
                      ].map(col => (
                        <label
                          key={col.key}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border transition cursor-pointer ${
                            selectedColumns[col.key] 
                              ? 'bg-white border-indigo-400 text-indigo-950 font-bold shadow-xs' 
                              : 'bg-slate-100/70 border-slate-200 text-slate-500 font-medium hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={!!selectedColumns[col.key]}
                            onChange={() => toggleColumn(col.key)}
                            disabled={col.required}
                            className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                          />
                          <span className="text-[11px] truncate">{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── MULTI-DIMENSIONAL FILTERS BAR (Only on Detailed List) ─── */}
                {printReportTab === 'detailed' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  
                  {/* 1. Grade/Class Filter */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1 flex items-center gap-1">
                      <GraduationCap size={12} className="text-indigo-600" /> শ্রেণি (Class)
                    </label>
                    <select
                      value={printGradeFilter}
                      onChange={(e) => setPrintGradeFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="all">{currentLang === 'en' ? 'All Classes' : 'সকল শ্রেণি'}</option>
                      <option value="6th">৬ষ্ঠ শ্রেণি (Class 6)</option>
                      <option value="7th">৭ম শ্রেণি (Class 7)</option>
                      <option value="8th">৮ম শ্রেণি (Class 8)</option>
                      <option value="9th">৯ম শ্রেণি (Class 9)</option>
                      <option value="10th">১০ম শ্রেণি (Class 10)</option>
                    </select>
                  </div>

                  {/* 2. Section/Branch Filter */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1 flex items-center gap-1">
                      <Building2 size={12} className="text-indigo-600" /> শাখা (Section)
                    </label>
                    <select
                      value={printBranchFilter}
                      onChange={(e) => setPrintBranchFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="all">{currentLang === 'en' ? 'All Sections' : 'সকল শাখা'}</option>
                      <option value="A">শাখা A</option>
                      <option value="B">শাখা B</option>
                      <option value="C">শাখা C</option>
                    </select>
                  </div>

                  {/* 3. Group/Department Filter */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1 flex items-center gap-1">
                      <Layers size={12} className="text-indigo-600" /> বিভাগ / গ্রুপ
                    </label>
                    <select
                      value={printGroupFilter}
                      onChange={(e) => setPrintGroupFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="all">{currentLang === 'en' ? 'All Groups' : 'সকল বিভাগ'}</option>
                      <option value="সাধারণ">{currentLang === 'en' ? 'General' : 'সাধারণ'}</option>
                      <option value="বিজ্ঞান">{currentLang === 'en' ? 'Science' : 'বিজ্ঞান'}</option>
                      <option value="মানবিক">{currentLang === 'en' ? 'Humanities' : 'মানবিক'}</option>
                      <option value="ব্যবসায় শিক্ষা">{currentLang === 'en' ? 'Business Studies' : 'ব্যবসায় শিক্ষা'}</option>
                    </select>
                  </div>

                  {/* 4. Religion Filter */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1 flex items-center gap-1">
                      <Heart size={12} className="text-indigo-600" /> ধর্ম ভিত্তিক (Religion)
                    </label>
                    <select
                      value={printReligionFilter}
                      onChange={(e) => setPrintReligionFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="all">{currentLang === 'en' ? 'All Religions' : 'সকল ধর্ম'}</option>
                      <option value="ইসলাম">{currentLang === 'en' ? 'Islam' : 'ইসলাম ধর্ম'}</option>
                      <option value="হিন্দু">{currentLang === 'en' ? 'Hinduism' : 'হিন্দু ধর্ম'}</option>
                      <option value="বৌদ্ধ">{currentLang === 'en' ? 'Buddhism' : 'বৌদ্ধ ধর্ম'}</option>
                      <option value="খ্রিস্টান">{currentLang === 'en' ? 'Christianity' : 'খ্রিস্ট ধর্ম'}</option>
                    </select>
                  </div>

                  {/* 5. Gender Filter */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1 flex items-center gap-1">
                      <User size={12} className="text-indigo-600" /> লিঙ্গ ভিত্তিক (Gender)
                    </label>
                    <select
                      value={printGenderFilter}
                      onChange={(e) => setPrintGenderFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="all">{currentLang === 'en' ? 'All Students' : 'সকল শিক্ষার্থী'}</option>
                      <option value="পুরুষ">{currentLang === 'en' ? 'Boys / Male' : 'ছাত্র / পুরুষ'}</option>
                      <option value="মহিলা">{currentLang === 'en' ? 'Girls / Female' : 'ছাত্রী / মহিলা'}</option>
                    </select>
                  </div>

                  {/* 6. Instant Search */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1 flex items-center gap-1">
                      <Search size={12} className="text-indigo-600" /> তাৎক্ষণিক খুঁজুন
                    </label>
                    <input
                      type="text"
                      value={printSearchQuery}
                      onChange={(e) => setPrintSearchQuery(e.target.value)}
                      placeholder="নাম, রোল, মোবাইল..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                </div>
                )}

              </div>

              {/* ─── INTERACTIVE SUMMARY STATISTICS BAR (Screen view) ─── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 print:hidden">
                <div className="bg-gradient-to-br from-indigo-900 to-slate-950 text-white p-4 rounded-2xl border border-indigo-800 shadow-sm">
                  <span className="text-[10px] font-bold text-indigo-300 block uppercase">মোট শিক্ষার্থী</span>
                  <div className="text-2xl font-black text-white mt-1">{printTotalCount} <span className="text-xs font-normal">জন</span></div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">ছাত্র (Boys)</span>
                  <div className="text-2xl font-black text-indigo-700 mt-1">
                    {printMaleCount} 
                    <span className="text-[11px] font-bold text-slate-400 ml-1.5">
                      ({printTotalCount > 0 ? ((printMaleCount/printTotalCount)*100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">ছাত্রী (Girls)</span>
                  <div className="text-2xl font-black text-rose-600 mt-1">
                    {printFemaleCount}
                    <span className="text-[11px] font-bold text-slate-400 ml-1.5">
                      ({printTotalCount > 0 ? ((printFemaleCount/printTotalCount)*100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-emerald-600 block uppercase">মুসলিম শিক্ষার্থী</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">{printMuslimCount} <span className="text-xs font-normal text-slate-400">জন</span></div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-amber-600 block uppercase">হিন্দু শিক্ষার্থী</span>
                  <div className="text-2xl font-black text-amber-700 mt-1">{printHinduCount} <span className="text-xs font-normal text-slate-400">জন</span></div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-purple-600 block uppercase">অন্যান্য / উপবৃত্তি</span>
                  <div className="text-2xl font-black text-purple-700 mt-1">{printStipendCount} <span className="text-xs font-normal text-slate-400">জন</span></div>
                </div>
              </div>

              {/* ─── PRINT CSS INJECTION ─── */}
              <style>{`
                @page {
                  size: A4 ${printOrientation};
                  margin: 0.5in;
                }
                @media print {
                  body {
                    background: white !important;
                    color: black !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .print\\:hidden {
                    display: none !important;
                  }
                  .print-table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    page-break-inside: auto !important;
                  }
                  .print-table tr {
                    page-break-inside: avoid !important;
                    page-break-after: auto !important;
                  }
                  .print-table thead {
                    display: table-header-group !important;
                  }
                  .print-table th, .print-table td {
                    border: 1px solid #1e293b !important;
                  }
                }
              `}</style>

              {/* ═════════════════════════════════════════════════════════════════ */}
              {/* 📄 OFFICIAL A4 PRINTABLE DOCUMENT CONTAINER                        */}
              {/* ═════════════════════════════════════════════════════════════════ */}
              <div className="bg-white text-slate-900 font-sans p-6 sm:p-8 border-2 border-slate-800 rounded-2xl shadow-md print:border-0 print:p-0 print:shadow-none box-border relative overflow-hidden">
                
                {/* Translucent Watermark (জলছাপ) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none z-0">
                  <div className="text-center transform -rotate-12">
                    <h2 className="text-7xl font-black uppercase text-slate-900 tracking-widest">
                      {schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                    </h2>
                    <p className="text-3xl font-black text-slate-900 mt-2">OFFICIAL STUDENT DIRECTORY</p>
                  </div>
                </div>

                <div className="relative z-10 space-y-3">
                  
                  {/* 1. THREE-LINE INSTITUTION HEADER WITH SYSTEM LOGO */}
                  <div className="border-b-2 border-slate-900 pb-3">
                    <div className="flex items-center justify-between gap-4">
                      
                      {/* Left System School Logo */}
                      <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                        {schoolSettings?.schoolLogo ? (
                          <img 
                            src={schoolSettings.schoolLogo} 
                            alt="School Logo" 
                            className="w-16 h-16 object-contain" 
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-emerald-800 text-white border-2 border-emerald-600 shadow-xs flex flex-col items-center justify-center">
                            <span className="text-amber-300 text-xs font-bold">★</span>
                            <span className="text-[9px] font-black tracking-tighter">BHS</span>
                            <span className="text-[7px] font-bold text-amber-200">১৯৬৯</span>
                          </div>
                        )}
                      </div>

                      {/* 03 Line Official School Identity (Centered) */}
                      <div className="text-center flex-1 pr-16">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-serif">
                          {schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                        </h1>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                          {schoolSettings?.address || 'বরইতলী , চকরিয়া , কক্সবাজার।'}
                        </p>
                        <p className="text-[11px] sm:text-xs font-semibold text-slate-600 mt-0.5">
                          EIIN: {schoolSettings?.eiin || '106184'} , স্থাপিত: {schoolSettings?.estdYear || '১৯৬৯'} খ্রি .
                        </p>
                      </div>

                    </div>

                    {/* Detailed Tab specific title and filters (Only shown when on detailed tab) */}
                    {printReportTab === 'detailed' && (
                      <>
                        <div className="text-center mt-2">
                          <div className="inline-block px-6 py-1 bg-[#0a2558] text-white font-black text-xs uppercase tracking-wider rounded-md border border-amber-400 shadow-xs">
                            শিক্ষার্থী তালিকা ও সাধারণ বিবরণী - ২০২৬
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-[10px] font-bold text-slate-700 mt-2 px-1 bg-slate-50 py-1 rounded border border-slate-200">
                          <div>
                            শ্রেণি: <span className="text-indigo-950 font-black">{printGradeFilter === 'all' ? 'সকল শ্রেণি' : printGradeFilter === '6th' ? '৬ষ্ঠ' : printGradeFilter === '7th' ? '৭ম' : printGradeFilter === '8th' ? '৮ম' : printGradeFilter === '9th' ? '৯ম' : '১০ম'}</span> | 
                            শাখা: <span className="text-indigo-950 font-black">{printBranchFilter === 'all' ? 'সকল শাখা' : printBranchFilter}</span> | 
                            বিভাগ: <span className="text-indigo-950 font-black">{printGroupFilter === 'all' ? 'সকল বিভাগ' : printGroupFilter}</span> | 
                            ধর্ম: <span className="text-indigo-950 font-black">{printReligionFilter === 'all' ? 'সকল ধর্ম' : printReligionFilter}</span> | 
                            লিঙ্গ: <span className="text-indigo-950 font-black">{printGenderFilter === 'all' ? 'সকল' : printGenderFilter}</span>
                          </div>
                          <div>
                            তারিখ: <span className="font-mono text-slate-900">{new Date().toLocaleDateString('bn-BD')}</span>
                          </div>
                        </div>

                        {/* Detailed Tab Summary Strip */}
                        <div className="bg-slate-100/90 border border-slate-800 px-3 py-1 text-[10px] font-bold text-slate-900 flex justify-between items-center rounded-sm mt-2">
                          <span>মোট শিক্ষার্থী: <strong className="text-indigo-900">{printTotalCount} জন</strong></span>
                          <span>ছাত্র: <strong>{printMaleCount} জন</strong> ({printTotalCount > 0 ? ((printMaleCount / printTotalCount) * 100).toFixed(0) : 0}%)</span>
                          <span> ছাত্রী: <strong>{printFemaleCount} জন</strong> ({printTotalCount > 0 ? ((printFemaleCount / printTotalCount) * 100).toFixed(0) : 0}%)</span>
                          <span>মুসলিম: <strong>{printMuslimCount} জন</strong></span>
                          <span>হিন্দু: <strong>{printHinduCount} জন</strong></span>
                          {printStipendCount > 0 && <span>উপবৃত্তি: <strong>{printStipendCount} জন</strong></span>}
                        </div>
                      </>
                    )}
                  </div>

                  {/* 2. DYNAMIC DATA TABLE / SIMPLE OFFICIAL SUMMARY REPORT TABLE (EXACTLY MATCHING USER IMAGE) */}
                  {printReportTab === 'summary' ? (
                    <div className="overflow-x-auto my-3">
                      
                      {/* Section Title matching reference image */}
                      <div className="text-center font-bold text-base sm:text-lg my-3 text-slate-950 font-serif">
                        ২০২৬ সালের শিক্ষার্থী সংখ্যা
                      </div>

                      {/* MAIN STATISTICAL TABLE */}
                      <table className="print-table w-full text-center text-xs border-collapse border border-black shadow-xs bg-white">
                        <thead>
                          <tr className="bg-white text-black font-bold text-xs uppercase border border-black">
                            <th className="p-2 w-16 border border-black text-center font-bold">ক্র: নং:</th>
                            <th className="p-2 w-20 border border-black text-center font-bold">শ্রেণি</th>
                            <th className="p-2 w-36 border border-black text-center font-bold">বিভাগ</th>
                            <th className="p-2 w-24 border border-black text-center font-bold">ছাত্র</th>
                            <th className="p-2 w-24 border border-black text-center font-bold">ছাত্রী</th>
                            <th className="p-2 w-24 border border-black text-center font-bold">মোট</th>
                            <th className="p-2 w-36 border border-black text-center font-bold">মন্তব্য</th>
                          </tr>
                        </thead>
                        <tbody className="text-black font-semibold text-xs">
                          {(() => {
                            const r6 = classSummaryData[0] || { boys: 0, girls: 0, total: 0 };
                            const r7 = classSummaryData[1] || { boys: 0, girls: 0, total: 0 };
                            const r8 = classSummaryData[2] || { boys: 0, girls: 0, total: 0 };
                            const r9Sci = classSummaryData[3] || { boys: 0, girls: 0, total: 0 };
                            const r9Hum = classSummaryData[4] || { boys: 0, girls: 0, total: 0 };
                            const r9Bs = classSummaryData[5] || { boys: 0, girls: 0, total: 0 };
                            const r10Sci = classSummaryData[6] || { boys: 0, girls: 0, total: 0 };
                            const r10Hum = classSummaryData[7] || { boys: 0, girls: 0, total: 0 };
                            const r10Bs = classSummaryData[8] || { boys: 0, girls: 0, total: 0 };

                            return (
                              <>
                                {/* Row 1: 6th */}
                                <tr>
                                  <td className="p-2 text-center border border-black font-mono">০১</td>
                                  <td className="p-2 text-center border border-black font-bold">৬ষ্ঠ</td>
                                  <td className="p-2 text-center border border-black"></td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r6.boys)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r6.girls)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r6.total)}</td>
                                  <td rowSpan={10} className="p-2 text-center border border-black align-middle text-xs text-slate-500 font-normal"></td>
                                </tr>

                                {/* Row 2: 7th */}
                                <tr>
                                  <td className="p-2 text-center border border-black font-mono">০২</td>
                                  <td className="p-2 text-center border border-black font-bold">৭ম</td>
                                  <td className="p-2 text-center border border-black"></td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r7.boys)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r7.girls)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r7.total)}</td>
                                </tr>

                                {/* Row 3: 8th */}
                                <tr>
                                  <td className="p-2 text-center border border-black font-mono">০৩</td>
                                  <td className="p-2 text-center border border-black font-bold">৮ম</td>
                                  <td className="p-2 text-center border border-black"></td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r8.boys)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r8.girls)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r8.total)}</td>
                                </tr>

                                {/* Row 4: 9th Science */}
                                <tr>
                                  <td rowSpan={3} className="p-2 text-center border border-black font-mono align-middle">০৪</td>
                                  <td rowSpan={3} className="p-2 text-center border border-black font-bold align-middle">৯ম</td>
                                  <td className="p-2 text-center border border-black">বিজ্ঞান</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r9Sci.boys)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r9Sci.girls)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r9Sci.total)}</td>
                                </tr>
                                {/* Row 5: 9th Humanities */}
                                <tr>
                                  <td className="p-2 text-center border border-black">মানবিক</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r9Hum.boys)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r9Hum.girls)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r9Hum.total)}</td>
                                </tr>
                                {/* Row 6: 9th Business */}
                                <tr>
                                  <td className="p-2 text-center border border-black">ব্যবসায় শিক্ষা</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r9Bs.boys)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r9Bs.girls)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r9Bs.total)}</td>
                                </tr>

                                {/* Row 7: 10th Science */}
                                <tr>
                                  <td rowSpan={3} className="p-2 text-center border border-black font-mono align-middle">০৫</td>
                                  <td rowSpan={3} className="p-2 text-center border border-black font-bold align-middle">১০ম</td>
                                  <td className="p-2 text-center border border-black">বিজ্ঞান</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r10Sci.boys)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r10Sci.girls)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r10Sci.total)}</td>
                                </tr>
                                {/* Row 8: 10th Humanities */}
                                <tr>
                                  <td className="p-2 text-center border border-black">মানবিক</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r10Hum.boys)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r10Hum.girls)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r10Hum.total)}</td>
                                </tr>
                                {/* Row 9: 10th Business */}
                                <tr>
                                  <td className="p-2 text-center border border-black">ব্যবসায় শিক্ষা</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r10Bs.boys)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r10Bs.girls)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(r10Bs.total)}</td>
                                </tr>

                                {/* Row 10: Total */}
                                <tr className="font-bold border-2 border-black">
                                  <td colSpan={3} className="p-2 text-center border border-black font-bold">মোট</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(summaryTotalBoys)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(summaryTotalGirls)}</td>
                                  <td className="p-2 text-center border border-black font-mono font-bold">{toBnDigit(summaryGrandTotal)}</td>
                                </tr>
                              </>
                            );
                          })()}
                        </tbody>
                      </table>

                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                    <table className="print-table w-full text-left text-[11px] border-collapse border border-slate-800">
                      <thead>
                        <tr className="bg-[#0a2558] text-white font-extrabold text-[10px] uppercase border border-slate-800">
                          {selectedColumns.sl && <th className="p-1.5 text-center w-8 border border-slate-700">ক্র.</th>}
                          {selectedColumns.roll && <th className="p-1.5 text-center w-12 border border-slate-700">রোল</th>}
                          {selectedColumns.id && <th className="p-1.5 text-center border border-slate-700">আইডি</th>}
                          {selectedColumns.name && <th className="p-1.5 border border-slate-700">শিক্ষার্থীর নাম</th>}
                          {selectedColumns.gender && <th className="p-1.5 text-center border border-slate-700">লিঙ্গ</th>}
                          {selectedColumns.religion && <th className="p-1.5 text-center border border-slate-700">ধর্ম</th>}
                          {selectedColumns.grade && <th className="p-1.5 text-center border border-slate-700">শ্রেণি ও শাখা</th>}
                          {selectedColumns.group && <th className="p-1.5 text-center border border-slate-700">বিভাগ/গ্রুপ</th>}
                          {selectedColumns.guardian && <th className="p-1.5 border border-slate-700">পিতার নাম / অভিভাবক</th>}
                          {selectedColumns.fatherNid && <th className="p-1.5 text-center border border-slate-700">পিতার NID</th>}
                          {selectedColumns.motherName && <th className="p-1.5 border border-slate-700">মাতার নাম</th>}
                          {selectedColumns.motherNid && <th className="p-1.5 text-center border border-slate-700">মাতার NID</th>}
                          {selectedColumns.mobile && <th className="p-1.5 text-center border border-slate-700">মোবাইল নম্বর</th>}
                          {selectedColumns.optionalSubject && <th className="p-1.5 text-center border border-slate-700">৪র্থ/ঐচ্ছিক বিষয়</th>}
                          {selectedColumns.birthRegNo && <th className="p-1.5 text-center border border-slate-700">জন্ম নিবন্ধন নম্বর</th>}
                          {selectedColumns.dob && <th className="p-1.5 text-center border border-slate-700">জন্ম তারিখ</th>}
                          {selectedColumns.bloodGroup && <th className="p-1.5 text-center font-bold text-rose-700 border border-slate-700">রক্তের গ্রুপ</th>}
                          {selectedColumns.address && <th className="p-1.5 border border-slate-700">ঠিকানা</th>}
                          {selectedColumns.stipend && <th className="p-1.5 text-center border border-slate-700">উপবৃত্তি</th>}
                          {selectedColumns.remarks && <th className="p-1.5 text-center w-24 border border-slate-700">মন্তব্য / স্বাক্ষর</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 text-slate-900 font-semibold">
                        {printableFilteredStudents.map((st, idx) => (
                          <tr key={st.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                            {selectedColumns.sl && (
                              <td className="p-1.5 text-center font-mono font-bold border border-slate-400 text-[10px]">
                                {idx + 1}
                              </td>
                            )}
                            {selectedColumns.roll && (
                              <td className="p-1.5 text-center font-mono font-black text-slate-950 border border-slate-400">
                                {st.roll}
                              </td>
                            )}
                            {selectedColumns.id && (
                              <td className="p-1.5 text-center font-mono text-[9px] text-slate-700 border border-slate-400">
                                {st.id}
                              </td>
                            )}
                            {selectedColumns.name && (
                              <td className="p-1.5 font-bold text-slate-950 border border-slate-400 whitespace-nowrap">
                                {st.name}
                              </td>
                            )}
                            {selectedColumns.gender && (
                              <td className="p-1.5 text-center text-[10px] border border-slate-400">
                                {st.gender || 'পুরুষ'}
                              </td>
                            )}
                            {selectedColumns.religion && (
                              <td className="p-1.5 text-center text-[10px] border border-slate-400">
                                {st.religion || 'ইসলাম'}
                              </td>
                            )}
                            {selectedColumns.grade && (
                              <td className="p-1.5 text-center text-[10px] font-bold border border-slate-400">
                                {st.grade} ({st.branch})
                              </td>
                            )}
                            {selectedColumns.group && (
                              <td className="p-1.5 text-center text-[10px] border border-slate-400">
                                {st.group}
                              </td>
                            )}
                            {selectedColumns.guardian && (
                              <td className="p-1.5 border border-slate-400 whitespace-nowrap text-slate-800 text-[10px]">
                                {st.guardian}
                              </td>
                            )}
                            {selectedColumns.fatherNid && (
                              <td className="p-1.5 text-center font-mono text-[9px] border border-slate-400">
                                {st.fatherNid || '-'}
                              </td>
                            )}
                            {selectedColumns.motherName && (
                              <td className="p-1.5 border border-slate-400 whitespace-nowrap text-[10px]">
                                {st.motherName || '-'}
                              </td>
                            )}
                            {selectedColumns.motherNid && (
                              <td className="p-1.5 text-center font-mono text-[9px] border border-slate-400">
                                {st.motherNid || '-'}
                              </td>
                            )}
                            {selectedColumns.mobile && (
                              <td className="p-1.5 text-center font-mono text-[10px] border border-slate-400 text-slate-800">
                                {st.mobile}
                              </td>
                            )}
                            {selectedColumns.optionalSubject && (
                              <td className="p-1.5 text-center text-[10px] border border-slate-400">
                                {st.optionalSubject || '-'}
                              </td>
                            )}
                            {selectedColumns.birthRegNo && (
                              <td className="p-1.5 text-center font-mono text-[9px] border border-slate-400">
                                {st.birthRegNo || '-'}
                              </td>
                            )}
                            {selectedColumns.dob && (
                              <td className="p-1.5 text-center font-mono text-[9px] border border-slate-400">
                                {st.dob || '-'}
                              </td>
                            )}
                            {selectedColumns.bloodGroup && (
                              <td className="p-1.5 text-center font-bold text-rose-700 text-[10px] border border-slate-400">
                                B+
                              </td>
                            )}
                            {selectedColumns.address && (
                              <td className="p-1.5 border border-slate-400 text-[9px] truncate max-w-xs">
                                {st.currentAddress || '-'}
                              </td>
                            )}
                            {selectedColumns.stipend && (
                              <td className="p-1.5 text-center text-[9px] font-bold border border-slate-400">
                                {(st as any).isStipend ? 'উপবৃত্তি' : '-'}
                              </td>
                            )}
                            {selectedColumns.remarks && (
                              <td className="p-1.5 border border-slate-400 text-center"></td>
                            )}
                          </tr>
                        ))}

                        {printableFilteredStudents.length === 0 && (
                          <tr>
                            <td colSpan={20} className="p-8 text-center text-slate-400 font-bold text-xs border border-slate-300">
                              নির্বাচিত ফিল্টারের ভিত্তিতে কোনো শিক্ষার্থী পাওয়া যায়নি।
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  )}

                  {/* 3. FORMAL SIGNATURE BLOCKS (Only single Principal signature on Summary tab, full 3 signatures on Detailed tab) */}
                  {printReportTab === 'summary' ? (
                    <div className="pt-14 pb-2 flex justify-end text-center text-xs font-bold text-slate-900">
                      <div className="space-y-1">
                        <div className="w-48 border-b border-slate-900 mx-auto"></div>
                        <p className="font-extrabold text-slate-950">প্রধান শিক্ষক</p>
                        <p className="text-[10px] text-slate-600 font-bold">
                          {schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}, {schoolSettings?.address?.split(' ')[1] || 'চকরিয়া'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-12 pb-2 flex justify-between items-end text-center text-xs font-bold text-slate-900">
                      <div className="space-y-1">
                        <div className="w-40 border-b border-slate-900 mx-auto"></div>
                        <p>শ্রেণি শিক্ষকের স্বাক্ষর</p>
                        <p className="text-[9px] text-slate-500 font-normal">তারিখ: ....................</p>
                      </div>
                      <div className="space-y-1">
                        <div className="w-40 border-b border-slate-900 mx-auto"></div>
                        <p>সহকারী প্রধান শিক্ষক</p>
                        <p className="text-[9px] text-slate-500 font-normal">তারিখ: ....................</p>
                      </div>
                      <div className="space-y-1">
                        <div className="w-48 border-b border-slate-900 mx-auto"></div>
                        <p className="font-extrabold text-slate-950">প্রধান শিক্ষক</p>
                        <p className="text-[9px] text-slate-600 font-bold">
                          {schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}, চকরিয়া
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 5. FOOTER SYSTEM BRANDING */}
                  <div className="pt-2 border-t border-slate-400 flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>প্রিন্ট সময়: {new Date().toLocaleString('bn-BD')}</span>
                    <span>পৃষ্ঠা: ১ / ১</span>
                    <span>EduPulse School Management System - Official Student Report</span>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* 📋 IN-PAGE VIEW 4: MAIN STUDENT DIRECTORY TABLE                    */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeView === 'list' && (
            <div className="space-y-4">
              
              {/* TOP COMPACT FILTER & ACTION BAR (Single Row Bar like Image 1) */}
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
                
                {/* Left Side: Search & Dropdown Filters (Image 1 Style) */}
                <div className="flex items-center gap-2.5 flex-wrap flex-1">
                  
                  {/* Search Input */}
                  <div className="relative w-full sm:w-56 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search students..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
                    />
                  </div>

                  {/* Class / Grade Filter Dropdown */}
                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="all">All Classes</option>
                    <option value="6th">৬ষ্ঠ শ্রেণি (Class 6)</option>
                    <option value="7th">৭ম শ্রেণি (Class 7)</option>
                    <option value="8th">৮ম শ্রেণি (Class 8)</option>
                    <option value="9th">৯ম শ্রেণি (Class 9)</option>
                    <option value="10th">১০ম শ্রেণি (Class 10)</option>
                  </select>

                  {/* Section / Branch Filter Dropdown */}
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="all">All Sections</option>
                    <option value="A">শাখা ক (Sec A)</option>
                    <option value="B">শাখা খ (Sec B)</option>
                    <option value="C">শাখা গ (Sec C)</option>
                  </select>

                  {/* Gender Filter Dropdown */}
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="all">All Genders</option>
                    <option value="male">{currentLang === 'en' ? 'Male' : 'ছাত্র'}</option>
                    <option value="female">{currentLang === 'en' ? 'Female' : 'ছাত্রী'}</option>
                  </select>

                  {/* Group Filter Dropdown */}
                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="all">All Statuses / Groups</option>
                    <option value="সাধারণ">{currentLang === 'en' ? 'General' : 'সাধারণ'}</option>
                    <option value="বিজ্ঞান">{currentLang === 'en' ? 'Science' : 'বিজ্ঞান'}</option>
                    <option value="মানবিক">{currentLang === 'en' ? 'Humanities' : 'মানবিক'}</option>
                    <option value="ব্যবসায়">{currentLang === 'en' ? 'Business Studies' : 'ব্যবসায় শিক্ষা'}</option>
                  </select>

                  {/* Clear filter button if any active */}
                  {(searchQuery || gradeFilter !== 'all' || branchFilter !== 'all' || genderFilter !== 'all' || groupFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setGradeFilter('all');
                        setBranchFilter('all');
                        setGenderFilter('all');
                        setGroupFilter('all');
                      }}
                      className="px-2.5 py-2 text-slate-500 hover:text-rose-600 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="ফিল্টার রিসেট করুন"
                    >
                      <X size={14} /> রিসেট
                    </button>
                  )}

                </div>

                {/* Right Side: Print & Add Student Action Buttons */}
                <div className="flex items-center gap-2.5 shrink-0 self-end xl:self-center">
                  <button
                    type="button"
                    onClick={() => setShowBulkPhotoModal(true)}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="একসাথে একাধিক শিক্ষার্থীর ছবি ড্রাগ ও ড্রপ করে আপলোড করুন"
                  >
                    <Camera size={15} /> বাল্ক ছবি ড্রপ
                  </button>
                  <button
                    onClick={() => switchView('print_list')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Printer size={15} /> শিক্ষার্থী তালিকা প্রিন্ট
                  </button>
                  <Link
                    href="/dashboard/admission"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Plus size={15} /> নতুন ভর্তি
                  </Link>
                </div>

              </div>

              {/* MAIN DIRECTORY TABLE (Matching Header Structure of Image 1) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <th className="p-3.5 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIds(filteredStudents.map(s => s.id));
                              } else {
                                setSelectedStudentIds([]);
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </th>
                        <th className="p-3.5">STUDENT <span className="text-[9px] text-indigo-500 font-bold ml-1 lowercase hidden sm:inline">(drag & drop photo)</span></th>
                        <th className="p-3.5">STUDENT ID</th>
                        <th className="p-3.5">CLASS &amp; SECTION</th>
                        <th className="p-3.5">ROLL</th>
                        <th className="p-3.5">GENDER</th>
                        <th className="p-3.5">GUARDIAN</th>
                        <th className="p-3.5">PHONE</th>
                        <th className="p-3.5 text-center">STATUS</th>
                        <th className="p-3.5 text-center">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 font-medium text-xs">
                      {filteredStudents.map((st) => {
                        const isSelected = selectedStudentIds.includes(st.id);
                        return (
                          <tr key={st.id} className={`hover:bg-slate-50/80 transition group ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                            {/* Checkbox */}
                            <td className="p-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedStudentIds(prev =>
                                    prev.includes(st.id) ? prev.filter(id => id !== st.id) : [...prev, st.id]
                                  );
                                }}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>

                            {/* Student Avatar & Name with Drag & Drop Upload */}
                            <td 
                              className={`p-3.5 transition-colors ${dragOverStudentId === st.id ? 'bg-indigo-50/90 ring-2 ring-indigo-500/50 rounded-xl' : ''}`}
                              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverStudentId(st.id); }}
                              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverStudentId(st.id); }}
                              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverStudentId(null); }}
                              onDrop={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragOverStudentId(null);
                                const file = e.dataTransfer.files?.[0];
                                if (file) {
                                  await handleStudentPhotoUpload(st.id, file);
                                }
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  onClick={() => triggerSinglePhotoSelect(st.id)}
                                  title="ছবি ড্রাগ করে এখানে ছেড়ে দিন অথবা ক্লিক করে ছবি পরিবর্তন করুন"
                                  className={`relative w-9 h-9 rounded-full cursor-pointer transition-all duration-200 group/avatar shrink-0 select-none ${
                                    dragOverStudentId === st.id
                                      ? 'ring-4 ring-indigo-500 ring-offset-2 scale-110 shadow-lg bg-indigo-100'
                                      : 'hover:ring-2 hover:ring-indigo-400 hover:scale-105'
                                  }`}
                                >
                                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-indigo-700 text-xs">
                                    {st.photo ? (
                                      <img src={st.photo} alt={st.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{st.name.charAt(0)}</span>
                                    )}
                                  </div>

                                  {/* Camera & Drag Overlay */}
                                  <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-all ${
                                    dragOverStudentId === st.id
                                      ? 'opacity-100 bg-indigo-600/85 text-white'
                                      : 'opacity-0 group-hover/avatar:opacity-100 bg-black/50 text-white'
                                  }`}>
                                    <Camera size={14} className={dragOverStudentId === st.id ? 'animate-bounce text-amber-300' : 'text-white'} />
                                  </div>

                                  {/* Drag Over Floating Badge */}
                                  {dragOverStudentId === st.id && (
                                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg z-30 pointer-events-none animate-in fade-in">
                                      ছবি ড্রপ করুন
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <span className="font-extrabold text-slate-900 block text-xs leading-tight">
                                    {st.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {st.group || 'সাধারণ'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Student ID */}
                            <td className="p-3.5 font-mono font-bold text-slate-700 text-xs">
                              {st.id}
                            </td>

                            {/* Class & Section */}
                            <td className="p-3.5 font-semibold text-slate-800 text-xs">
                              {st.grade} ({st.branch || 'A'})
                            </td>

                            {/* Roll */}
                            <td className="p-3.5 font-mono font-black text-slate-900 text-xs">
                              {st.roll || '০১'}
                            </td>

                            {/* Gender */}
                            <td className="p-3.5 text-slate-700 text-xs">
                              {st.gender?.includes('নারী') || st.gender?.includes('মহিলা') || st.gender?.toLowerCase() === 'female' ? 'Female' : 'Male'}
                            </td>

                            {/* Guardian */}
                            <td className="p-3.5 font-semibold text-slate-800 text-xs">
                              {st.guardian || 'অভিভাবক'}
                            </td>

                            {/* Phone */}
                            <td className="p-3.5 font-mono text-slate-600 text-xs">
                              {st.mobile || '০১৮১২-০০০১০৯'}
                            </td>

                            {/* Status */}
                            <td className="p-3.5 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Active
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                
                                {/* 👁️ View Profile Button */}
                                <button
                                  onClick={() => switchView('view', st)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                  title="প্রোফাইল দেখুন"
                                >
                                  <Eye size={15} />
                                </button>

                                {/* 🖨️ Print Admission Form Button */}
                                <button
                                  onClick={() => switchView('print_form', st)}
                                  className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                  title="ভর্তি ফরম প্রিন্ট"
                                >
                                  <Printer size={15} />
                                </button>

                                {/* ✏️ Edit Button */}
                                <button
                                  onClick={() => switchView('edit', st)}
                                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                  title="এডিট"
                                >
                                  <Pencil size={15} />
                                </button>

                                {/* 🗑️ Delete Button */}
                                <button
                                  onClick={() => handleDelete(st.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="অপসারণ"
                                >
                                  <Trash2 size={15} />
                                </button>

                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={10} className="p-12 text-center text-slate-400 font-bold text-xs">
                            কোনো শিক্ষার্থী পাওয়া যায়নি।
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Directory Footer */}
                <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>মোট রেজিস্টার্ড শিক্ষার্থী: <strong>{totalStudents}</strong> জন (প্রদর্শিত: {filteredStudents.length})</span>
                  <span>বরইতলী উচ্চ বিদ্যালয় ডিজিটাল ডিরেক্টরি</span>
                </div>
              </div>

            </div>
          )}

        </>
      )}

      {/* 🖨️ BLANK SCHOOL PAD MODAL */}
      {showBlankPadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 print:p-0 print:bg-white print:relative print:z-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-0 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <div>
                <h3 className="font-black text-slate-950 text-base flex items-center gap-2">
                  <Printer className="text-emerald-600" size={18} />
                  ফাঁকা স্কুল প্যাড প্রিন্ট প্রিভিউ (Blank School Letterhead)
                </h3>
                <p className="text-xs text-slate-500">
                  মার্জিন: উপরে {schoolSettings?.padMargins?.top ?? 0.5}&quot; | বামে {schoolSettings?.padMargins?.left ?? 0.5}&quot; | ডানে {schoolSettings?.padMargins?.right ?? 0.5}&quot; | নিচে {schoolSettings?.padMargins?.bottom ?? 0.5}&quot;
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={15} /> প্রিন্ট করুন (A4)
                </button>
                <button
                  type="button"
                  onClick={() => setShowBlankPadModal(false)}
                  className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="py-2">
              <SchoolPadWrapper
                settings={schoolSettings}
                mode="blank_pad"
                title=""
                hideHeaderActions={true}
                signatures={[
                  {
                    title: schoolSettings?.principalName || 'মোহাম্মদ রফিকুল ইসলাম',
                    designation: schoolSettings?.principalTitle || 'প্রধান শিক্ষক',
                    institution: schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
                    address: schoolSettings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার।',
                    rightAligned: true
                  }
                ]}
              />
            </div>
          </div>
        </div>
      )}
      {/* Hidden single file input for avatar click upload */}
      <input
        type="file"
        ref={singleFileInputRef}
        accept="image/*"
        onChange={handleSingleFileInputChange}
        className="hidden"
      />

      {/* 🍞 TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3 animate-in slide-in-from-bottom-5 backdrop-blur-md">
          {toastMsg.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-bold">{toastMsg.text}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 📦 MODAL: BULK DRAG & DROP PHOTO UPLOADER                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {showBulkPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center font-black">
                  <Camera size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    বাল্ক ছবি ড্রাগ ও ড্রপ আপলোডার (Bulk Photo Upload)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    একসাথে একাধিক শিক্ষার্থীর ছবি টেনে এনে ছেড়ে দিন, স্বয়ংক্রিয়ভাবে রোল বা আইডি অনুযায়ী মিলে যাবে
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setShowBulkPhotoModal(false); setBulkPhotos([]); }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Optional Class Filter for Roll Matching */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/50 dark:bg-purple-950/20 p-3.5 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                <div className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-600" />
                  <span>রোল নম্বর দিয়ে নির্ভুল ম্যাচ করতে শ্রেণি নির্ধারণ করুন:</span>
                </div>
                <select
                  value={bulkTargetGrade}
                  onChange={(e) => setBulkTargetGrade(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-black text-purple-900 dark:text-purple-200 outline-none cursor-pointer"
                >
                  <option value="all">সকল শ্রেণি (All Classes)</option>
                  <option value="6th">৬ষ্ঠ শ্রেণি (6th)</option>
                  <option value="7th">৭ম শ্রেণি (7th)</option>
                  <option value="8th">৮ম শ্রেণি (8th)</option>
                  <option value="9th">৯ম শ্রেণি (9th)</option>
                  <option value="10th">১০ম শ্রেণি (10th)</option>
                </select>
              </div>

              {/* Big Drag & Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsBulkDragging(true); }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsBulkDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsBulkDragging(false); }}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsBulkDragging(false);
                  if (e.dataTransfer.files) {
                    await handleBulkFilesAdded(e.dataTransfer.files);
                  }
                }}
                onClick={() => bulkFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer select-none ${
                  isBulkDragging
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/50 scale-[1.01] shadow-inner'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-purple-400 hover:bg-purple-50/30'
                }`}
              >
                <input
                  type="file"
                  ref={bulkFileInputRef}
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) handleBulkFilesAdded(e.target.files);
                  }}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center shadow-sm">
                    <Upload size={24} className={isBulkDragging ? 'animate-bounce text-purple-600' : ''} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-sm">
                      এখানে একসাথে একাধিক ছবি টেনে এনে ছেড়ে দিন (Drag & Drop)
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      অথবা কম্পিউটার থেকে ফাইল ব্রাউজ করতে এখানে ক্লিক করুন
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-900/40 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                    💡 ফাইলের নাম রোল নম্বর (যেমন: 01.jpg, 02.jpg) বা আইডি হলে অটোমেটিক ম্যাচ হবে
                  </span>
                </div>
              </div>

              {/* Dropped Images Preview List */}
              {bulkPhotos.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
                      <ImageIcon size={14} className="text-purple-600" />
                      মোট ড্রপকৃত ছবি ({bulkPhotos.length} টি)
                    </h5>
                    <button
                      type="button"
                      onClick={() => setBulkPhotos([])}
                      className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                    >
                      সব ক্লিয়ার করুন
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {bulkPhotos.map((item, idx) => {
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-2xl border flex items-center gap-3 ${
                            item.matchedStudentId
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          <img
                            src={item.preview}
                            alt={item.fileName}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                              {item.fileName}
                            </p>

                            {item.matchedStudentId ? (
                              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 truncate flex items-center gap-1">
                                <CheckCircle2 size={12} className="shrink-0" />
                                <span>{item.matchedStudentName} (রোল: {item.matchedRoll}, {item.matchedGrade})</span>
                              </div>
                            ) : (
                              <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                <AlertCircle size={12} className="shrink-0" />
                                <span>কোনো শিক্ষার্থী মেলেনি</span>
                              </div>
                            )}

                            {/* Manual Selection Dropdown if not matched or to reassign */}
                            <select
                              value={item.matchedStudentId || ''}
                              onChange={(e) => {
                                const chosenId = e.target.value;
                                const st = students.find(s => s.id === chosenId);
                                setBulkPhotos(prev => prev.map((p, pIdx) => pIdx === idx ? {
                                  ...p,
                                  matchedStudentId: chosenId || null,
                                  matchedStudentName: st ? st.name : undefined,
                                  matchedGrade: st ? st.grade : undefined,
                                  matchedRoll: st ? st.roll : undefined
                                } : p));
                              }}
                              className="mt-1 w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                            >
                              <option value="">{item.matchedStudentId ? 'শিক্ষার্থী পরিবর্তন করুন...' : 'শিক্ষার্থী নির্বাচন করুন...'}</option>
                              {students.map(st => (
                                <option key={st.id} value={st.id}>
                                  {st.name} - রোল {st.roll} ({st.grade})
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => setBulkPhotos(prev => prev.filter((_, pIdx) => pIdx !== idx))}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="মুছে ফেলুন"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <span className="text-xs font-bold text-slate-500">
                ম্যাচ হয়েছে: <strong className="text-emerald-600">{bulkPhotos.filter(p => p.matchedStudentId).length}</strong> / {bulkPhotos.length} টি ছবি
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setShowBulkPhotoModal(false); setBulkPhotos([]); }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleSaveBulkPhotos}
                  disabled={bulkPhotos.filter(p => p.matchedStudentId).length === 0}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Save size={14} /> সব ছবি সেভ করুন ({bulkPhotos.filter(p => p.matchedStudentId).length})
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
