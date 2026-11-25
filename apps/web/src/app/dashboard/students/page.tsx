'use client';

import React, { useEffect, useState, useRef, useMemo, Suspense } from 'react';
import {
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { confirmDialog } from '@/components/ui/ToastProvider';
import { useSearchParams } from 'next/navigation';
import QRCode from 'qrcode';
import { URL_QUERY_CHANGED_EVENT, syncUrlQueryParams } from '@/lib/urlTabSync';
import { studentService } from '@/services/studentService';
import { classSectionService } from '@/services/classSectionService';
import { sortStudentsGroupAndRoll } from '@/services/studentBulkImportEngine';
import { languageService, AppLanguage } from '@/services/languageService';
import { certificateService, CertificateRecord } from '@/services/certificateService';
import OfficialAdmissionForm from '@/components/OfficialAdmissionForm';
import { autoCropAndCompressStudentPhoto } from '@/lib/imageUtils';

import { StudentProfileView } from '@/components/students/StudentProfileView';
import { StudentEditFormView } from '@/components/students/StudentEditFormView';
import { StudentPrintSuiteView } from '@/components/students/StudentPrintSuiteView';
import { StudentDirectoryTable, SortStrategy } from '@/components/students/StudentDirectoryTable';
import { StudentBlankPadModal, StudentBulkPhotoModal } from '@/components/students/StudentModals';
import {
  StudentRecord,
  matchStudentReligion,
  isFemaleGender,
  isMaleGender,
  normalizeGradeKey,
  formatGradeLabel,
} from '@/components/students/studentTypes';

type StudentItem = StudentRecord;

type ViewState = 'list' | 'view' | 'edit' | 'print_form' | 'print_list';

// 🔍 Robust search normalizer: null-safe, case-insensitive, বাংলা ↔ English digit tolerant
const normalizeSearchText = (val: unknown): string =>
  String(val ?? '')
    .toLowerCase()
    .replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)))
    .replace(/\s+/g, ' ')
    .trim();

const studentMatchesSearch = (st: Partial<StudentItem>, rawQuery: string): boolean => {
  const q = normalizeSearchText(rawQuery);
  if (!q) return true;
  const haystack = [
    st.name, st.nameEn, st.roll, st.id, st.guardian, st.fatherName, st.fatherNameEn,
    st.motherName, st.motherNameEn, st.mobile, st.grade, st.branch, st.section, st.group,
    st.birthRegNo, st.registrationNo, st.sscRoll, st.religion, st.gender,
  ]
    .map(normalizeSearchText)
    .join(' | ');
  const digitsOnlyQ = q.replace(/[^0-9]/g, '');
  // Every word in the query must match somewhere (multi-word search: "rahim 12")
  return q.split(' ').every((term) => haystack.includes(term)) ||
    (digitsOnlyQ.length >= 4 && normalizeSearchText(st.mobile).replace(/[^0-9]/g, '').includes(digitsOnlyQ));
};

function StudentListPageContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [currentLang, setCurrentLang] = useState<AppLanguage>('bn');
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [religionFilter, setReligionFilter] = useState<string>('all');
  const [stipendFilter, setStipendFilter] = useState<string>('all');
  const [photoFilter, setPhotoFilter] = useState<string>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [sortStrategy, setSortStrategy] = useState<SortStrategy>('roll_asc');

  // Clear stale selections when filters change significantly
  useEffect(() => {
    setSelectedStudentIds((prev) => prev.filter((id) => students.some((s) => s.id === id)));
  }, [students]);

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
    const syncCerts = () => {
      if (selectedStudent?.id) {
        setStudentCertificates(certificateService.getCertificatesByStudentId(selectedStudent.id));
      } else {
        setStudentCertificates([]);
      }
    };
    syncCerts();
    window.addEventListener('storage', syncCerts);
    window.addEventListener('focus', syncCerts);
    return () => {
      window.removeEventListener('storage', syncCerts);
      window.removeEventListener('focus', syncCerts);
    };
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
      const compressed = await autoCropAndCompressStudentPhoto(file, 300, 360, 0.85);
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
        showToast(`🎉 "${student.name}" এর ছবি অটো ক্রপ ও পাসপোর্ট সাইজে (৩০০×৩৬০) ছোট করে সংরক্ষণ করা হয়েছে!`, 'success');
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
      const preview = await autoCropAndCompressStudentPhoto(f, 300, 360, 0.85);
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
  const [printMargin, setPrintMargin] = useState<'normal' | 'wide' | 'compact'>('normal');

  // 📐 Unified print margin config: @page margin (real paper margin on EVERY page)
  // + identical on-screen sheet padding so the preview matches the printed output exactly.
  const printMarginMm = printMargin === 'wide' ? { v: 18, h: 20 } : printMargin === 'compact' ? { v: 8, h: 10 } : { v: 12, h: 14 };
  const printPageMarginCss = `${printMarginMm.v}mm ${printMarginMm.h}mm`;
  const printContentHeightCss = `${(printOrientation === 'landscape' ? 210 : 297) - printMarginMm.v * 2 - 1}mm`;
  const inPageSheetStyle: React.CSSProperties = {
    padding: printPageMarginCss,
    width: printOrientation === 'landscape' ? '297mm' : '210mm',
    maxWidth: '100%',
    minHeight: printOrientation === 'landscape' ? '210mm' : '297mm',
  };
  const [printRowsPerPage, setPrintRowsPerPage] = useState<number>(0); // 0 = Auto (Portrait 25 / Landscape 18)
  const [printPreviewPage, setPrintPreviewPage] = useState<number>(1);
  const [showAllPrintSheets, setShowAllPrintSheets] = useState<boolean>(true);
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
      const photo =
        s.photo ||
        pMap[s.id] ||
        (s.roll ? pMap[`${g}_${s.roll}`] : undefined) ||
        (s.roll ? pMap[s.roll] : undefined);
      const sec = s.branch || s.section || 'A';
      return {
        ...s,
        id: s.id || `STD-2026-${4554 + idx}`,
        name: s.name,
        roll: s.roll || String(idx + 1).padStart(2, '0'),
        grade: s.grade || '8th',
        branch: sec,
        section: sec,
        group: s.group || 'সাধারণ',
        optionalSubject: s.optionalSubject || '',
        guardian: s.guardian || s.fatherName || '',
        fatherName: s.fatherName || s.guardian || '',
        mobile: s.mobile || '',
        attendance: s.attendance ?? 0,
        gpa: s.gpa || 'N/A',
        gender: s.gender || '',
        religion: s.religion || '',
        photo,
        isStipend: Boolean(s.isStipend || s.stipendStatus === 'Active'),
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

    // ☁️ Fresh-PC empty-database restore ONLY (never upload entire DB on page visit!)
    if (typeof window !== 'undefined' && navigator.onLine) {
      const localCount = studentService.getAllStudents().length;
      if (localCount === 0 && sessionStorage.getItem('sms_students_cloud_pull_done') !== '1') {
        sessionStorage.setItem('sms_students_cloud_pull_done', '1');
        import('@/services/firebaseSyncService').then(({ firebaseSyncService }) => {
          firebaseSyncService.pullAllFromCloud().then((res) => {
            if (res.studentCount > 0) {
              loadStudentsFromStorage();
            }
          }).catch(() => {});
        }).catch(() => {});
      }
    }

    if (typeof window !== 'undefined') {
      let storageTimer: ReturnType<typeof setTimeout> | null = null;
      const handleStorage = () => {
        if (storageTimer) clearTimeout(storageTimer);
        storageTimer = setTimeout(() => {
          loadStudentsFromStorage();
          loadSchoolSettings();
        }, 120);
      };
      window.addEventListener('storage', handleStorage);
      return () => {
        if (storageTimer) clearTimeout(storageTimer);
        unsubLang();
        window.removeEventListener('storage', handleStorage);
      };
    }
    return () => unsubLang();
  }, []);

  // Reactively respond to URL query params (e.g. ?view=print, ?tab=summary, ?search=...)
  useEffect(() => {
    const applyQueryFromUrl = () => {
      const params =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search)
          : searchParams;
      if (!params) return;

      const view = params.get('view');
      const tab = params.get('tab');
      const print = params.get('print');
      const search = params.get('search') || params.get('q');

      if (search !== null) {
        setSearchQuery(search);
      }

      if (view === 'print' || print === 'true') {
        setActiveView('print_list');
        setPrintReportTab('detailed');
      } else if (view === 'summary' || tab === 'summary') {
        setActiveView('print_list');
        setPrintReportTab('summary');
      } else if (view === 'list' || (!view && !tab && !print)) {
        setActiveView((prev) => (prev === 'print_list' ? 'list' : prev));
      }
    };

    applyQueryFromUrl();
    window.addEventListener(URL_QUERY_CHANGED_EVENT, applyQueryFromUrl);
    window.addEventListener('popstate', applyQueryFromUrl);
    return () => {
      window.removeEventListener(URL_QUERY_CHANGED_EVENT, applyQueryFromUrl);
      window.removeEventListener('popstate', applyQueryFromUrl);
    };
  }, [searchParams]);

  // Generate QR code whenever selected student changes for view or print
  useEffect(() => {
    if (selectedStudent && selectedStudent.id) {
      QRCode.toDataURL(selectedStudent.id, { margin: 1, width: 140 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error(err));
    }
  }, [selectedStudent]);

  const switchView = (targetView: ViewState, student: StudentItem | null = null) => {
    setSelectedStudent(student);
    if (student && targetView === 'edit') {
      setEditFormData({ ...student });
    }

    if (typeof window !== 'undefined') {
      if (targetView === 'print_list') {
        syncUrlQueryParams('/dashboard/students', { view: 'print' });
      } else if (targetView === 'list') {
        syncUrlQueryParams('/dashboard/students', { view: null, print: null, tab: null });
      }
    }

    setActiveView(targetView);
    setIsLoadingView(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = async (id: string) => {
    if (await confirmDialog({ title: 'শিক্ষার্থী অপসারণ', message: 'আপনি কি নিশ্চিত যে এই শিক্ষার্থীকে অপসারণ করতে চান?', confirmLabel: 'অপসারণ করুন', danger: true })) {
      studentService.deleteStudent(id);
      loadStudentsFromStorage();
      if (selectedStudent?.id === id) {
        switchView('list');
      }
      showToast('শিক্ষার্থী তালিকা থেকে অপসারণ করা হয়েছে।', 'success');
    }
  };

  const handleClearAllStudents = async () => {
    if (students.length === 0) return;
    if (await confirmDialog({ title: 'সকল শিক্ষার্থী মুছে ফেলা', message: 'আপনি কি নিশ্চিত যে সিস্টেম থেকে সকল শিক্ষার্থীর তালিকা মুছে ফ্রেশ করতে চান? এটি অপরিবর্তনীয়!', confirmLabel: 'সব মুছে ফেলুন', danger: true })) {
      const res = studentService.clearAllStudents();
      loadStudentsFromStorage();
      setSelectedStudentIds([]);
      if (activeView !== 'list') switchView('list');
      showToast(res.message, 'success');
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
    
    showToast('🎉 শিক্ষার্থীর সকল তথ্য প্রফেশনালভাবে আপডেট ও সংরক্ষিত হয়েছে!', 'success');
    switchView('view', editFormData);
  };

  const handleBulkDelete = async () => {
    if (selectedStudentIds.length === 0) return;
    if (
      await confirmDialog({
        title: 'নির্বাচিত শিক্ষার্থী অপসারণ',
        message: `আপনি কি নিশ্চিত যে নির্বাচিত ${selectedStudentIds.length} জন শিক্ষার্থীকে তালিকা থেকে স্থায়ীভাবে অপসারণ করতে চান?`,
        confirmLabel: 'অপসারণ করুন',
        danger: true,
      })
    ) {
      selectedStudentIds.forEach((id) => {
        studentService.deleteStudent(id);
      });
      setSelectedStudentIds([]);
      loadStudentsFromStorage();
      showToast(`${selectedStudentIds.length} জন শিক্ষার্থী তালিকা থেকে অপসারণ করা হয়েছে।`, 'success');
    }
  };

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setGradeFilter('all');
    setBranchFilter('all');
    setGenderFilter('all');
    setGroupFilter('all');
    setReligionFilter('all');
    setStipendFilter('all');
    setPhotoFilter('all');
    setSortStrategy('roll_asc');
  };

  // Dynamic section list from both classSectionService & existing students
  const availableSections = useMemo(() => {
    const set = new Set<string>();
    if (mounted) {
      try {
        const classes = classSectionService.getClasses();
        classes.forEach((cls) => {
          cls.sections?.forEach((sec) => {
            if (sec.name?.trim()) set.add(sec.name.trim());
          });
        });
      } catch {}
    }
    students.forEach((st) => {
      const b = (st.branch || st.section || '').trim();
      if (b) set.add(b);
    });
    if (set.size === 0) {
      ['A', 'B', 'C'].forEach((s) => set.add(s));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'bn'));
  }, [mounted, students]);

  const rawFilteredStudents = students.filter((st) => {
    const matchesSearch = studentMatchesSearch(st, searchQuery);

    const matchesGrade =
      gradeFilter === 'all' ||
      normalizeGradeKey(st.grade) === normalizeGradeKey(gradeFilter);

    const stBranch = (st.branch || st.section || '').trim();
    const matchesBranch =
      branchFilter === 'all' ||
      stBranch.toLowerCase() === branchFilter.toLowerCase() ||
      (branchFilter === 'A' && (stBranch.includes('A') || stBranch.includes('ক'))) ||
      (branchFilter === 'B' && (stBranch.includes('B') || stBranch.includes('খ'))) ||
      (branchFilter === 'C' && (stBranch.includes('C') || stBranch.includes('গ')));

    const matchesGender =
      genderFilter === 'all' ||
      (genderFilter === 'male' && isMaleGender(st.gender)) ||
      (genderFilter === 'female' && isFemaleGender(st.gender));

    const stGroup = (st.group || '').toLowerCase();
    const matchesGroup =
      groupFilter === 'all' ||
      (groupFilter === 'ব্যবসায়'
        ? stGroup.includes('ব্যবসায়') || stGroup.includes('ব্যবসায়') || stGroup.includes('commerce') || stGroup.includes('business')
        : stGroup.includes(groupFilter.toLowerCase()) ||
          (groupFilter === 'সাধারণ' && (!st.group || st.group === 'সাধারণ')));

    const matchesReligion = matchStudentReligion(st.religion, religionFilter);

    const isStipend = Boolean(st.isStipend || st.stipendStatus === 'Active');
    const matchesStipend =
      stipendFilter === 'all' ||
      (stipendFilter === 'stipend' && isStipend) ||
      (stipendFilter === 'non_stipend' && !isStipend);

    const hasPhoto = Boolean(st.photo && st.photo.trim().length > 0);
    const matchesPhoto =
      photoFilter === 'all' ||
      (photoFilter === 'has_photo' && hasPhoto) ||
      (photoFilter === 'missing_photo' && !hasPhoto);

    return (
      matchesSearch &&
      matchesGrade &&
      matchesBranch &&
      matchesGender &&
      matchesGroup &&
      matchesReligion &&
      matchesStipend &&
      matchesPhoto
    );
  });

  // 🌟 Auto Roll & Group A-Z Sorting: ৬ষ্ঠ–৮ম (শ্রেণি -> শাখা -> রোল ছোট থেকে বড়), ৯ম–১০ম (শ্রেণি -> গ্রুপ A-Z -> রোল ছোট থেকে বড়)
  const filteredStudents = sortStudentsGroupAndRoll(rawFilteredStudents as any, 'roll_asc') as unknown as StudentItem[];
  const paginatedStudents = filteredStudents;
  const totalStudents = students.length;

  const handleExportFilteredExcel = async (onlySelected = false) => {
    const rowsSource =
      onlySelected && selectedStudentIds.length > 0
        ? filteredStudents.filter((s) => selectedStudentIds.includes(s.id))
        : filteredStudents;

    if (rowsSource.length === 0) {
      showToast('এক্সপোর্ট করার জন্য কোনো শিক্ষার্থী পাওয়া যায়নি!', 'error');
      return;
    }

    const XLSX = await import('xlsx');
    const sheetRows = rowsSource.map((st, idx) => ({
      'ক্র.নং': idx + 1,
      রোল: st.roll || '',
      'শিক্ষার্থী আইডি': st.id,
      'শিক্ষার্থীর নাম': st.name,
      'ইংরেজি নাম': st.nameEn || '',
      শ্রেণি: formatGradeLabel(st.grade, 'bn'),
      শাখা: st.branch || st.section || '',
      বিভাগ: st.group || 'সাধারণ',
      লিঙ্গ: isFemaleGender(st.gender) ? 'ছাত্রী' : isMaleGender(st.gender) ? 'ছাত্র' : st.gender || '',
      ধর্ম: st.religion || '',
      উপবৃত্তি: st.isStipend || st.stipendStatus === 'Active' ? 'হ্যাঁ' : 'না',
      'পিতা / অভিভাবক': st.guardian || st.fatherName || '',
      'মাতার নাম': st.motherName || '',
      'মোবাইল নম্বর': st.mobile || '',
      '৪র্থ / ঐচ্ছিক বিষয়': st.optionalSubject || '',
      'জন্ম নিবন্ধন নম্বর': st.birthRegNo || '',
      'জন্ম তারিখ': st.dob || '',
      'রক্তের গ্রুপ': st.bloodGroup || '',
      ঠিকানা: st.currentAddress || st.permanentAddress || '',
    }));

    const ws = XLSX.utils.json_to_sheet(sheetRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    const dateTag = new Date().toISOString().slice(0, 10);
    const gradeTag = gradeFilter === 'all' ? 'All' : gradeFilter;
    XLSX.writeFile(wb, `Student_Directory_${gradeTag}_${dateTag}.xlsx`);
    showToast(`${rowsSource.length} জন শিক্ষার্থীর এক্সেল (.xlsx) ডাউনলোড হয়েছে!`, 'success');
  };

  useEffect(() => {
    setPrintPreviewPage(1);
  }, [printGradeFilter, printBranchFilter, printGroupFilter, printReligionFilter, printGenderFilter, printStipendFilter, printSearchQuery, printOrientation, printRowsPerPage, printReportTab]);

  return (
    <div
      className={
        activeView === 'list' || activeView === 'print_list'
          ? 'pb-10 print:pb-0'
          : 'p-4 sm:p-6 lg:p-8 space-y-6 pb-12 print:p-0'
      }
    >
      
      {/* Loading Overlay State for seamless in-page transitions */}
      {(!mounted || isLoadingView) && (
        <div className="py-12 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200 uppercase tracking-widest">
            {!mounted ? 'শিক্ষার্থী ডিরেক্টরি লোড হচ্ছে...' : 'পৃষ্ঠা প্রস্তুত করা হচ্ছে...'}
          </p>
        </div>
      )}

      {mounted && !isLoadingView && (
        <>
          {activeView === 'view' && selectedStudent && (
            <StudentProfileView
              selectedStudent={selectedStudent}
              studentProfileTab={studentProfileTab}
              setStudentProfileTab={setStudentProfileTab}
              studentCertificates={studentCertificates}
              selectedCertForPrint={selectedCertForPrint}
              setSelectedCertForPrint={setSelectedCertForPrint}
              qrCodeUrl={qrCodeUrl}
              onBackToList={() => switchView('list')}
              onPrintForm={() => switchView('print_form', selectedStudent)}
              onEditStudent={() => switchView('edit', selectedStudent)}
            />
          )}

          {activeView === 'edit' && editFormData && (
            <StudentEditFormView
              editFormData={editFormData}
              setEditFormData={setEditFormData}
              currentLang={currentLang}
              onCancel={() => switchView('view', selectedStudent)}
              onSubmit={handleSaveEditSubmit}
              showToast={(text, type = 'success') => showToast(text, type)}
            />
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

          {activeView === 'print_list' && (
            <StudentPrintSuiteView
              students={students}
              schoolSettings={schoolSettings}
              currentLang={currentLang}
              sortStrategy={sortStrategy}
              availableSections={availableSections}
              studentMatchesSearch={studentMatchesSearch}
              printReportTab={printReportTab}
              setPrintReportTab={setPrintReportTab}
              printOrientation={printOrientation}
              setPrintOrientation={setPrintOrientation}
              printMargin={printMargin}
              setPrintMargin={setPrintMargin}
              printRowsPerPage={printRowsPerPage}
              setPrintRowsPerPage={setPrintRowsPerPage}
              showColumnSelector={showColumnSelector}
              setShowColumnSelector={setShowColumnSelector}
              selectedColumns={selectedColumns}
              toggleColumn={toggleColumn}
              setColumnPreset={setColumnPreset}
              printGradeFilter={printGradeFilter}
              setPrintGradeFilter={setPrintGradeFilter}
              printBranchFilter={printBranchFilter}
              setPrintBranchFilter={setPrintBranchFilter}
              printGroupFilter={printGroupFilter}
              setPrintGroupFilter={setPrintGroupFilter}
              printReligionFilter={printReligionFilter}
              setPrintReligionFilter={setPrintReligionFilter}
              printGenderFilter={printGenderFilter}
              setPrintGenderFilter={setPrintGenderFilter}
              printStipendFilter={printStipendFilter}
              setPrintStipendFilter={setPrintStipendFilter}
              printSearchQuery={printSearchQuery}
              setPrintSearchQuery={setPrintSearchQuery}
              printPreviewPage={printPreviewPage}
              setPrintPreviewPage={setPrintPreviewPage}
              showAllPrintSheets={showAllPrintSheets}
              setShowAllPrintSheets={setShowAllPrintSheets}
              printPageMarginCss={printPageMarginCss}
              printContentHeightCss={printContentHeightCss}
              inPageSheetStyle={inPageSheetStyle}
              onOpenBlankPad={() => setShowBlankPadModal(true)}
              onBackToList={() => switchView('list')}
            />
          )}

          {activeView === 'list' && (
            <StudentDirectoryTable
              currentLang={currentLang}
              allStudents={students}
              totalStudents={totalStudents}
              filteredStudents={filteredStudents}
              paginatedStudents={paginatedStudents}
              availableSections={availableSections}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              gradeFilter={gradeFilter}
              setGradeFilter={setGradeFilter}
              branchFilter={branchFilter}
              setBranchFilter={setBranchFilter}
              genderFilter={genderFilter}
              setGenderFilter={setGenderFilter}
              groupFilter={groupFilter}
              setGroupFilter={setGroupFilter}
              religionFilter={religionFilter}
              setReligionFilter={setReligionFilter}
              stipendFilter={stipendFilter}
              setStipendFilter={setStipendFilter}
              photoFilter={photoFilter}
              setPhotoFilter={setPhotoFilter}
              sortStrategy={sortStrategy}
              setSortStrategy={setSortStrategy}
              selectedStudentIds={selectedStudentIds}
              setSelectedStudentIds={setSelectedStudentIds}
              dragOverStudentId={dragOverStudentId}
              setDragOverStudentId={setDragOverStudentId}
              handleStudentPhotoUpload={handleStudentPhotoUpload}
              triggerSinglePhotoSelect={triggerSinglePhotoSelect}
              onOpenBulkPhotoModal={() => setShowBulkPhotoModal(true)}
              onSwitchToPrintList={() => switchView('print_list')}
              onExportExcel={handleExportFilteredExcel}
              onBulkDelete={handleBulkDelete}
              onResetAllFilters={handleResetAllFilters}
              onViewStudent={(st) => switchView('view', st)}
              onPrintStudentForm={(st) => switchView('print_form', st)}
              onEditStudent={(st) => switchView('edit', st)}
              onDeleteStudent={handleDelete}
            />
          )}

        </>
      )}

      {showBlankPadModal && (
        <StudentBlankPadModal schoolSettings={schoolSettings} onClose={() => setShowBlankPadModal(false)} />
      )}

      <input
        type="file"
        ref={singleFileInputRef}
        accept="image/*"
        onChange={handleSingleFileInputChange}
        className="hidden"
      />

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

      {showBulkPhotoModal && (
        <StudentBulkPhotoModal
          students={students}
          bulkPhotos={bulkPhotos}
          bulkTargetGrade={bulkTargetGrade}
          setBulkTargetGrade={setBulkTargetGrade}
          isBulkDragging={isBulkDragging}
          setIsBulkDragging={setIsBulkDragging}
          bulkFileInputRef={bulkFileInputRef}
          onFilesAdded={handleBulkFilesAdded}
          onSaveBulkPhotos={handleSaveBulkPhotos}
          onClearAll={() => setBulkPhotos([])}
          onReassignStudent={(idx, chosenId) => {
            const st = students.find((s) => s.id === chosenId);
            setBulkPhotos((prev) =>
              prev.map((p, pIdx) =>
                pIdx === idx
                  ? {
                      ...p,
                      matchedStudentId: chosenId || null,
                      matchedStudentName: st ? st.name : undefined,
                      matchedGrade: st ? st.grade : undefined,
                      matchedRoll: st ? st.roll : undefined,
                    }
                  : p
              )
            );
          }}
          onRemoveItem={(idx) => setBulkPhotos((prev) => prev.filter((_, pIdx) => pIdx !== idx))}
          onClose={() => {
            setShowBulkPhotoModal(false);
            setBulkPhotos([]);
          }}
        />
      )}

    </div>
  );
}

export default function StudentListPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 font-bold">শিক্ষার্থী তালিকা লোড হচ্ছে...</div>
      }
    >
      <StudentListPageContent />
    </Suspense>
  );
}
