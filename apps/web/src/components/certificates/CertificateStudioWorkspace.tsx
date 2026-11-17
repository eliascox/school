'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Download,
  Edit3,
  FileText,
  GraduationCap,
  Languages,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { Student, studentService } from '@/services/studentService';
import { AlumniRecord } from '@/services/alumniService';
import { SchoolSettings } from '@/services/settingsService';
import {
  CertificateInput,
  CertificateRecord,
  CertificateType,
  certificateService,
} from '@/services/certificateService';
import {
  BOARD_EXAM_TYPES,
  buildDefaultRefNo,
  CERTIFICATE_PURPOSES,
  CERTIFICATE_TRAITS,
  CertificateDraft,
  CertificateGender,
  CertificateLanguage,
  composeCertificateBody,
  EDUCATION_BOARDS,
  getDefaultCertificateTitle,
  mapAlumniToCertificateDraft,
  mapStudentToCertificateDraft,
  StudentSourceKind,
} from '@/lib/certificateEngine';
import { exportElementToPng } from '@/lib/certificatePngExport';
import OfficialCertificateDoc from '@/components/OfficialCertificateDoc';
import CertificateDesignControls, { StudioDesignState } from './CertificateDesignControls';
import { ALL_CERTIFICATE_TYPES } from './certificateThemes';

interface CertificateStudioWorkspaceProps {
  students: Student[];
  alumniList: AlumniRecord[];
  schoolSettings: SchoolSettings;
  createdByName: string;
  initialStudentId?: string;
  initialAlumniId?: string;
  initialType?: CertificateType;
  editingCert?: CertificateRecord | null;
  onSaved: (saved: CertificateRecord) => void;
  onOpenPadSettings: () => void;
  onStudentUpdated?: () => void;
  onNotify: (type: 'success' | 'error', text: string) => void;
}

const EMPTY_DRAFT: CertificateDraft = {
  sourceKind: 'manual',
  studentId: '',
  studentName: '',
  studentNameEn: '',
  fatherName: '',
  fatherNameEn: '',
  motherName: '',
  motherNameEn: '',
  gender: 'male',
  roll: '',
  grade: '10th',
  section: 'A',
  group: 'সাধারণ',
  session: String(new Date().getFullYear()),
  dob: '',
  birthRegNo: '',
  photoUrl: '',
  village: '',
  postOffice: '',
  upazila: '',
  district: '',
  boardRoll: '',
  boardReg: '',
  passingYear: String(new Date().getFullYear()),
  gpa: '',
  gradeLetter: '',
  gpaScale: '5.00',
  examType: 'SSC',
  boardName: EDUCATION_BOARDS[0].bn,
  studyPeriod: '',
  currentlyStudying: true,
};

export default function CertificateStudioWorkspace({
  students,
  alumniList,
  schoolSettings,
  createdByName,
  initialStudentId,
  initialAlumniId,
  initialType,
  editingCert,
  onSaved,
  onOpenPadSettings,
  onStudentUpdated,
  onNotify,
}: CertificateStudioWorkspaceProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [studioStep, setStudioStep] = useState<'source' | 'details' | 'design'>('source');

  // Step 1: Type, Source & Language
  const [certType, setCertType] = useState<CertificateType>(initialType || editingCert?.type || 'current_student');
  const [language, setLanguage] = useState<CertificateLanguage>(
    editingCert?.language || (initialType === 'ssc_testimonial' ? 'en' : 'bn')
  );
  const [sourceTab, setSourceTab] = useState<StudentSourceKind>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniRecord | null>(null);

  // Step 2: Draft Data & Smart Traits/Purpose
  const [draft, setDraft] = useState<CertificateDraft>(EMPTY_DRAFT);
  const [refNo, setRefNo] = useState<string>(() => buildDefaultRefNo(schoolSettings));
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [selectedTraits, setSelectedTraits] = useState<string[]>(['meritorious', 'regular', 'disciplined']);
  const [purposeId, setPurposeId] = useState<string>('general');
  const [customPurposeText, setCustomPurposeText] = useState<string>('');
  const [achievementTitle, setAchievementTitle] = useState<string>('');
  const [characterRemarks, setCharacterRemarks] = useState<string>('');
  const [customBody, setCustomBody] = useState<string>('');
  const [isBodyLocked, setIsBodyLocked] = useState<boolean>(false);
  const [isTitleLocked, setIsTitleLocked] = useState<boolean>(false);

  // Step 3: Visual Design Controls
  const [design, setDesign] = useState<StudioDesignState>({
    orientation: editingCert?.orientation || (initialType === 'ssc_testimonial' ? 'landscape' : 'portrait'),
    themeColor: editingCert?.themeColor || '#1e1b4b',
    titleVariant: editingCert?.titleVariant || 'ribbon',
    borderPreset: editingCert?.borderPreset || 'royal_crest',
    showHeader: editingCert?.showHeader !== undefined ? editingCert.showHeader : true,
    showPhotoBox: Boolean(editingCert?.showPhotoBox),
    showOfficeStub: Boolean(editingCert?.showOfficeStub || initialType === 'ssc_testimonial'),
    showCornerBands: editingCert?.showCornerBands !== undefined ? editingCert.showCornerBands : true,
    showQrCode: editingCert?.showQrCode !== false,
    showSecondarySigner: Boolean(editingCert?.showSecondarySigner),
    secondarySignerTitle: editingCert?.secondarySignerTitle || 'শ্রেণি শিক্ষক / সহকারী প্রধান শিক্ষক',
    fontSize: editingCert?.fontSize || 15,
  });

  // Live Canvas Interactions
  const [inlineEditable, setInlineEditable] = useState<boolean>(false);
  const [previewScale, setPreviewScale] = useState<number>(0.68);
  const [savedCertId, setSavedCertId] = useState<string | null>(editingCert?.id || null);
  const [exportingPng, setExportingPng] = useState<boolean>(false);

  const selectActiveStudent = useCallback(
    (st: Student) => {
      setSelectedStudent(st);
      setSelectedAlumni(null);
      setSourceTab('active');
      const mapped = mapStudentToCertificateDraft(st, schoolSettings);
      if (certType === 'ssc_testimonial' || certType === 'transfer_certificate') {
        mapped.currentlyStudying = false;
      }
      setDraft(mapped);
      setSavedCertId(null);
      setIsBodyLocked(false);
    },
    [certType, schoolSettings]
  );

  const selectAlumniRecord = useCallback(
    (alm: AlumniRecord) => {
      setSelectedAlumni(alm);
      setSelectedStudent(null);
      setSourceTab('alumni');
      const mapped = mapAlumniToCertificateDraft(alm, schoolSettings);
      setDraft(mapped);
      setSavedCertId(null);
      setIsBodyLocked(false);
    },
    [schoolSettings]
  );

  // Deep-link sync from Student Directory / Alumni / Register edit
  useEffect(() => {
    if (initialType) {
      setCertType(initialType);
      const meta = ALL_CERTIFICATE_TYPES.find((t) => t.id === initialType);
      if (meta) {
        setLanguage(meta.defaultLang);
        setDesign((prev) => ({
          ...prev,
          orientation: meta.defaultOrientation,
          showOfficeStub: initialType === 'ssc_testimonial',
        }));
      }
    }
  }, [initialType]);

  useEffect(() => {
    if (initialStudentId && students.length > 0) {
      const match = students.find((s) => s.id === initialStudentId);
      if (match) {
        selectActiveStudent(match);
        setStudioStep('details');
      }
    }
  }, [initialStudentId, students, selectActiveStudent]);

  useEffect(() => {
    if (initialAlumniId && alumniList.length > 0) {
      const match = alumniList.find((a) => a.id === initialAlumniId || a.studentId === initialAlumniId);
      if (match) {
        selectAlumniRecord(match);
        setStudioStep('details');
      }
    }
  }, [initialAlumniId, alumniList, selectAlumniRecord]);

  useEffect(() => {
    if (!editingCert) return;
    setSavedCertId(editingCert.id);
    setCertType(editingCert.type);
    setLanguage(editingCert.language === 'en' ? 'en' : 'bn');
    setRefNo(editingCert.refNo || buildDefaultRefNo(schoolSettings));
    setIssueDate(editingCert.issueDate || new Date().toISOString().split('T')[0]);
    setDesign((prev) => ({
      ...prev,
      orientation: editingCert.orientation || prev.orientation,
      themeColor: editingCert.themeColor || prev.themeColor,
      titleVariant: editingCert.titleVariant || prev.titleVariant,
      borderPreset: editingCert.borderPreset || prev.borderPreset,
      showHeader: editingCert.showHeader !== undefined ? editingCert.showHeader : prev.showHeader,
      showPhotoBox: editingCert.showPhotoBox !== undefined ? editingCert.showPhotoBox : prev.showPhotoBox,
      showOfficeStub: editingCert.showOfficeStub !== undefined ? editingCert.showOfficeStub : prev.showOfficeStub,
      showCornerBands: editingCert.showCornerBands !== undefined ? editingCert.showCornerBands : prev.showCornerBands,
      showQrCode: editingCert.showQrCode !== false,
      showSecondarySigner: Boolean(editingCert.showSecondarySigner),
      secondarySignerTitle: editingCert.secondarySignerTitle || prev.secondarySignerTitle,
      fontSize: editingCert.fontSize || prev.fontSize,
    }));
    if (editingCert.title) {
      setIsTitleLocked(true);
      setCustomTitle(editingCert.title);
    }
    if (editingCert.customBody) {
      setIsBodyLocked(true);
      setCustomBody(editingCert.customBody);
    }
    setDraft((prev) => ({
      ...prev,
      studentId: editingCert.studentId,
      studentName: editingCert.studentName,
      studentNameEn: editingCert.studentNameEn || '',
      fatherName: editingCert.fatherName || '',
      fatherNameEn: editingCert.fatherNameEn || '',
      motherName: editingCert.motherName || '',
      motherNameEn: editingCert.motherNameEn || '',
      gender: editingCert.gender === 'female' || editingCert.gender === 'Female' || editingCert.gender === 'নারী' ? 'female' : editingCert.gender === 'unspecified' ? 'unspecified' : 'male',
      roll: editingCert.roll || '',
      grade: editingCert.grade || '10th',
      section: editingCert.section || 'A',
      group: editingCert.group || 'সাধারণ',
      session: editingCert.session || '',
      dob: editingCert.dob || '',
      village: editingCert.village || '',
      postOffice: editingCert.postOffice || '',
      upazila: editingCert.upazila || '',
      district: editingCert.district || '',
      boardRoll: editingCert.boardRoll || '',
      boardReg: editingCert.boardReg || '',
      passingYear: editingCert.passingYear || '',
      gpa: editingCert.gpa || '',
      photoUrl: editingCert.photoUrl || '',
      currentlyStudying: editingCert.currentlyStudying !== undefined ? editingCert.currentlyStudying : !editingCert.isAlumni,
    }));
    setStudioStep('details');
  }, [editingCert, schoolSettings]);

  // Adjust preview scale cleanly when orientation switches
  useEffect(() => {
    setPreviewScale(design.orientation === 'landscape' ? 0.58 : 0.68);
  }, [design.orientation]);

  // Auto-compose title unless user manually customized it
  useEffect(() => {
    if (!isTitleLocked) {
      setCustomTitle(getDefaultCertificateTitle(certType, language));
    }
  }, [certType, language, isTitleLocked]);

  // Auto-compose prose unless user manually edited / typed inline
  useEffect(() => {
    if (isBodyLocked) return;
    const composed = composeCertificateBody({
      type: certType,
      language,
      draft,
      schoolSettings,
      selectedTraits,
      purposeId,
      customPurposeText,
      achievementTitle,
      characterRemarks,
    });
    setCustomBody(composed);
  }, [
    isBodyLocked,
    certType,
    language,
    draft,
    schoolSettings,
    selectedTraits,
    purposeId,
    customPurposeText,
    achievementTitle,
    characterRemarks,
  ]);

  const handleTypeSelect = (nextType: CertificateType) => {
    setCertType(nextType);
    const meta = ALL_CERTIFICATE_TYPES.find((t) => t.id === nextType);
    if (meta) {
      setLanguage(meta.defaultLang);
      setDesign((prev) => ({
        ...prev,
        orientation: meta.defaultOrientation,
        borderPreset: meta.defaultLayout === 'pad' ? prev.borderPreset : 'royal_crest',
        showOfficeStub: nextType === 'ssc_testimonial' ? true : prev.showOfficeStub,
      }));
    }
    setDraft((prev) => ({
      ...prev,
      currentlyStudying: nextType === 'ssc_testimonial' || nextType === 'transfer_certificate' ? false : prev.sourceKind !== 'alumni',
    }));
    setIsTitleLocked(false);
    setIsBodyLocked(false);
    setSavedCertId(null);
  };

  const handleSwitchManual = () => {
    setSourceTab('manual');
    setSelectedStudent(null);
    setSelectedAlumni(null);
    setDraft({
      ...EMPTY_DRAFT,
      currentlyStudying: certType !== 'ssc_testimonial' && certType !== 'transfer_certificate',
    });
    setIsBodyLocked(false);
    setSavedCertId(null);
    setStudioStep('details');
  };

  const uniqueGrades = useMemo(
    () => Array.from(new Set(students.map((s) => s.grade).filter(Boolean))),
    [students]
  );

  const filteredActiveStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      const matchGrade = gradeFilter === 'all' || s.grade === gradeFilter;
      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.nameEn || '').toLowerCase().includes(q) ||
        s.roll.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.mobile || '').toLowerCase().includes(q);
      return matchGrade && matchQuery;
    });
  }, [students, gradeFilter, searchQuery]);

  const filteredAlumni = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return alumniList.filter((a) => {
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        (a.sscRoll || '').toLowerCase().includes(q) ||
        (a.batch || '').toLowerCase().includes(q) ||
        (a.passingYear || '').toLowerCase().includes(q)
      );
    });
  }, [alumniList, searchQuery]);

  const toggleTrait = (traitId: string) => {
    setIsBodyLocked(false);
    setSelectedTraits((prev) =>
      prev.includes(traitId) ? prev.filter((id) => id !== traitId) : [...prev, traitId]
    );
  };

  const handleSaveEnglishProfileBack = () => {
    if (!selectedStudent) return;
    const updated: Student = {
      ...selectedStudent,
      nameEn: draft.studentNameEn.trim() || selectedStudent.nameEn,
      fatherNameEn: draft.fatherNameEn.trim() || selectedStudent.fatherNameEn,
      motherNameEn: draft.motherNameEn.trim() || selectedStudent.motherNameEn,
    };
    studentService.updateStudent(updated);
    setSelectedStudent(updated);
    onStudentUpdated?.();
    onNotify('success', `${selectedStudent.name}-এর ইংরেজি নাম প্রোফাইলে স্থায়ীভাবে সেভ হয়েছে!`);
  };

  const liveCertRecord: CertificateRecord = useMemo(
    () => ({
      id: savedCertId || 'PREVIEW-DRAFT',
      verificationCode: savedCertId ? undefined : 'LIVE-PREVIEW',
      type: certType,
      title: customTitle.trim() || getDefaultCertificateTitle(certType, language),
      refNo: refNo.trim() || buildDefaultRefNo(schoolSettings),
      issueDate,
      status: 'valid',
      layoutStyle: design.borderPreset === 'no_border_pad' ? 'pad' : 'royal_border',
      studentId: draft.studentId || 'MANUAL',
      studentName: draft.studentName || 'শিক্ষার্থীর নাম',
      studentNameEn: draft.studentNameEn || undefined,
      fatherName: draft.fatherName || '',
      fatherNameEn: draft.fatherNameEn || undefined,
      motherName: draft.motherName || '',
      motherNameEn: draft.motherNameEn || undefined,
      roll: draft.roll || '',
      grade: draft.grade || '',
      section: draft.section || 'A',
      group: draft.group || 'সাধারণ',
      session: draft.session || '',
      dob: draft.dob || '',
      gender: draft.gender,
      birthRegNo: draft.birthRegNo || undefined,
      village: draft.village,
      postOffice: draft.postOffice,
      upazila: draft.upazila,
      district: draft.district,
      address: [draft.village, draft.postOffice, draft.upazila, draft.district].filter(Boolean).join(', '),
      boardRoll: draft.boardRoll || undefined,
      boardReg: draft.boardReg || undefined,
      passingYear: draft.passingYear || undefined,
      gpa: draft.gpa || undefined,
      gradeLetter: draft.gradeLetter || undefined,
      gpaScale: draft.gpaScale || '5.00',
      examType: draft.examType,
      boardName: draft.boardName,
      studyPeriod: draft.studyPeriod || undefined,
      currentlyStudying: draft.currentlyStudying,
      isAlumni: !draft.currentlyStudying,
      achievementTitle: achievementTitle.trim() || undefined,
      characterRemarks: characterRemarks.trim() || undefined,
      customBody,
      language,
      traits: selectedTraits,
      purposeCode: purposeId,
      purposeText: customPurposeText.trim() || undefined,
      orientation: design.orientation,
      themeColor: design.themeColor,
      titleVariant: design.titleVariant,
      borderPreset: design.borderPreset,
      showHeader: design.showHeader,
      showPhotoBox: design.showPhotoBox,
      photoUrl: draft.photoUrl || undefined,
      showOfficeStub: design.showOfficeStub,
      showCornerBands: design.showCornerBands,
      fontSize: design.fontSize,
      showQrCode: design.showQrCode,
      showSecondarySigner: design.showSecondarySigner,
      secondarySignerTitle: design.secondarySignerTitle,
      createdDate: issueDate,
    }),
    [
      savedCertId,
      certType,
      customTitle,
      language,
      refNo,
      schoolSettings,
      issueDate,
      design,
      draft,
      achievementTitle,
      characterRemarks,
      customBody,
      selectedTraits,
      purposeId,
      customPurposeText,
    ]
  );

  const persistCertificate = (quiet = false): CertificateRecord | null => {
    if (!draft.studentName.trim() && !draft.studentNameEn.trim()) {
      onNotify('error', 'অনুগ্রহ করে শিক্ষার্থীর নাম প্রদান করুন!');
      setStudioStep('details');
      return null;
    }

    const { id: _id, verificationCode: _vc, createdDate: _cd, status: _st, auditTrail: _at, ...rest } = liveCertRecord;
    const payload: CertificateInput = {
      ...rest,
      id: savedCertId || undefined,
      studentId: draft.studentId || `STU-${Date.now().toString().slice(-5)}`,
      studentName: (draft.studentName || draft.studentNameEn).trim(),
      createdBy: createdByName,
    };

    const saved = certificateService.saveCertificate(payload);
    setSavedCertId(saved.id);
    onSaved(saved);
    if (!quiet) {
      onNotify('success', `সনদ (${saved.id}) সফলভাবে রেজিস্টারে সংরক্ষিত হয়েছে!`);
    }
    return saved;
  };

  const handlePrintCertificate = () => {
    const saved = savedCertId
      ? certificateService.getCertificateById(savedCertId)
      : persistCertificate(true);
    if (saved) {
      certificateService.logPrintAction(saved.id, createdByName);
      onSaved(saved);
    }
    setTimeout(() => {
      window.print();
    }, 120);
  };

  const handleDownloadPng = async () => {
    if (!sheetRef.current) return;
    setExportingPng(true);
    try {
      const saved = savedCertId
        ? certificateService.getCertificateById(savedCertId)
        : persistCertificate(true);
      const safeName = (draft.studentNameEn || draft.studentName || 'certificate')
        .replace(/[^a-zA-Z0-9\u0980-\u09FF_-]+/g, '_')
        .slice(0, 32);
      const result = await exportElementToPng(
        sheetRef.current,
        `${safeName}_${saved?.id || certType}.png`
      );
      if (result.ok) {
        onNotify('success', 'হাই-রেজল্যুশন PNG ছবি সফলভাবে ডাউনলোড হয়েছে!');
      } else {
        onNotify('error', `PNG ডাউনলোডে সমস্যা (${result.error}) — অনুগ্রহ করে "প্রিন্ট / PDF" ব্যবহার করুন।`);
      }
    } finally {
      setExportingPng(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* LEFT / CONTROL WORKSPACE (5 Cols on XL)                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="xl:col-span-5 space-y-4 print:hidden">
        {/* 3-Step Navigator Pills */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1.5 grid grid-cols-3 gap-1 shadow-xs">
          {[
            { id: 'source' as const, step: '১', label: 'ধরন ও শিক্ষার্থী' },
            { id: 'details' as const, step: '২', label: 'তথ্য ও ব্যাকরণ' },
            { id: 'design' as const, step: '৩', label: 'ডিজাইন ও ফ্রেম' },
          ].map((s) => {
            const active = studioStep === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStudioStep(s.id)}
                className={`py-2 px-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center ${
                    active ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  {s.step}
                </span>
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* STEP 1: Certificate Type + Student Directory / Alumni / Manual Sync */}
        {studioStep === 'source' && (
          <div className="space-y-4">
            {/* Certificate Type Catalog (All 10 types!) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="font-black text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  সনদ বা প্রশংসাপত্রের ধরন বাছাই করুন
                </span>
                <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                  {ALL_CERTIFICATE_TYPES.length} ধরন
                </span>
              </div>

              <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-60 overflow-y-auto">
                {ALL_CERTIFICATE_TYPES.map((t) => {
                  const selected = certType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTypeSelect(t.id)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-start justify-between gap-2 ${
                        selected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200/70 dark:border-slate-800 hover:border-indigo-300 text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: selected ? '#fbbf24' : t.badgeHex }}
                          />
                          <p className="text-xs font-black truncate">{t.titleBn}</p>
                        </div>
                        <p className={`text-[10px] truncate mt-0.5 ${selected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {t.descBn}
                        </p>
                      </div>
                      {selected && <CheckCircle2 size={14} className="text-amber-400 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Source Picker: Student Directory | Alumni Archive | Manual */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <span className="font-black text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Users size={14} className="text-indigo-600" />
                  শিক্ষার্থী তালিকা সিঙ্ক ({students.length + alumniList.length})
                </span>
                <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-xl text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setSourceTab('active')}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
                      sourceTab === 'active' ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    শিক্ষার্থী ({students.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceTab('alumni')}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
                      sourceTab === 'alumni' ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    অ্যালুমনাই ({alumniList.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleSwitchManual}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition flex items-center gap-1 ${
                      sourceTab === 'manual' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <UserPlus size={11} /> হাতে লিখে
                  </button>
                </div>
              </div>

              {sourceTab !== 'manual' ? (
                <div className="p-3 space-y-2.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="নাম, রোল, আইডি বা মোবাইল..."
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    {sourceTab === 'active' && (
                      <select
                        value={gradeFilter}
                        onChange={(e) => setGradeFilter(e.target.value)}
                        className="px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                      >
                        <option value="all">সকল শ্রেণি</option>
                        {uniqueGrades.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {sourceTab === 'active' ? (
                      filteredActiveStudents.length === 0 ? (
                        <p className="text-center py-6 text-xs text-slate-400 font-bold">কোনো শিক্ষার্থী পাওয়া যায়নি</p>
                      ) : (
                        filteredActiveStudents.map((s) => {
                          const isSelected = selectedStudent?.id === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                selectActiveStudent(s);
                                setStudioStep('details');
                              }}
                              className={`w-full p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-slate-50/70 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 hover:bg-indigo-50/50 dark:hover:bg-slate-800'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="font-bold truncate">{s.name}</p>
                                <p className={`text-[10px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                                  রোল: {s.roll} | শ্রেণি: {s.grade} ({s.section || s.branch || 'A'}) | {s.group}
                                </p>
                              </div>
                              {isSelected ? (
                                <Check size={15} className="shrink-0" />
                              ) : (
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                                  সিঙ্ক করুন →
                                </span>
                              )}
                            </button>
                          );
                        })
                      )
                    ) : filteredAlumni.length === 0 ? (
                      <p className="text-center py-6 text-xs text-slate-400 font-bold">অ্যালুমনাই আর্কাইভে শিক্ষার্থী নেই</p>
                    ) : (
                      filteredAlumni.map((a) => {
                        const isSelected = selectedAlumni?.id === a.id;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              selectAlumniRecord(a);
                              setStudioStep('details');
                            }}
                            className={`w-full p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-violet-600 text-white border-violet-600'
                                : 'bg-slate-50/70 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 hover:bg-violet-50/40'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="font-bold truncate flex items-center gap-1.5">
                                <GraduationCap size={13} className="shrink-0" /> {a.name}
                              </p>
                              <p className={`text-[10px] truncate ${isSelected ? 'text-violet-100' : 'text-slate-400'}`}>
                                {a.batch} | SSC রোল: {a.sscRoll || '—'} | GPA: {a.gpa || '—'}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold shrink-0">লোড →</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <p className="font-bold text-slate-800 dark:text-slate-100">
                    ম্যানুয়াল / বহিরাগত শিক্ষার্থী মোড চালু আছে
                  </p>
                  <p className="text-[11px] text-slate-500">
                    ডাটাবেসে না থাকা যেকোনো শিক্ষার্থীর তথ্য ধাপ ২-এ লিখে সরাসরি প্রিন্ট ও রেজিস্টারে সংরক্ষণ করতে পারবেন।
                  </p>
                  <button
                    type="button"
                    onClick={() => setStudioStep('details')}
                    className="px-3.5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer"
                  >
                    ধাপ ২: শিক্ষার্থীর তথ্য লিখুন →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Bilingual Data, Gender Grammar, Traits, Purpose & Body Editor */}
        {studioStep === 'details' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 space-y-3.5 text-xs">
            {/* Quick Language + Tense Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <Languages size={13} className="ml-1.5 text-indigo-600" />
                {[
                  { id: 'bn' as const, label: 'বাংলা সনদ' },
                  { id: 'en' as const, label: 'English' },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setLanguage(l.id);
                      setIsTitleLocked(false);
                      setIsBodyLocked(false);
                    }}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition ${
                      language === l.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 font-bold text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <input
                  type="checkbox"
                  checked={draft.currentlyStudying}
                  onChange={(e) => {
                    setIsBodyLocked(false);
                    setDraft((p) => ({ ...p, currentlyStudying: e.target.checked }));
                  }}
                  className="rounded text-indigo-600 cursor-pointer"
                />
                এখনো অধ্যয়নরত
              </label>
            </div>

            {/* Ref & Date */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">স্মারক নম্বর</label>
                <input
                  type="text"
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">ইস্যুর তারিখ</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            {/* Student Name BN & EN + Profile Save-back */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">শিক্ষার্থীর নাম (বাংলা) *</label>
                <input
                  type="text"
                  value={draft.studentName}
                  onChange={(e) => setDraft((p) => ({ ...p, studentName: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-500">Student Name (English)</label>
                  {selectedStudent && draft.studentNameEn && draft.studentNameEn !== selectedStudent.nameEn && (
                    <button
                      type="button"
                      onClick={handleSaveEnglishProfileBack}
                      className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      প্রোফাইলে সেভ
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={draft.studentNameEn}
                  onChange={(e) => setDraft((p) => ({ ...p, studentNameEn: e.target.value }))}
                  placeholder="English name"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                />
              </div>
            </div>

            {/* Father, Mother + Gender Pills */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  {language === 'en' ? 'Father Name' : 'পিতার নাম'}
                </label>
                <input
                  type="text"
                  value={language === 'en' ? draft.fatherNameEn || draft.fatherName : draft.fatherName}
                  onChange={(e) =>
                    setDraft((p) =>
                      language === 'en'
                        ? { ...p, fatherNameEn: e.target.value }
                        : { ...p, fatherName: e.target.value }
                    )
                  }
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  {language === 'en' ? 'Mother Name' : 'মাতার নাম'}
                </label>
                <input
                  type="text"
                  value={language === 'en' ? draft.motherNameEn || draft.motherName : draft.motherName}
                  onChange={(e) =>
                    setDraft((p) =>
                      language === 'en'
                        ? { ...p, motherNameEn: e.target.value }
                        : { ...p, motherName: e.target.value }
                    )
                  }
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                />
              </div>
            </div>

            {/* Smart Gender Switch */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">লিঙ্গ (সর্বনাম অটো-ঠিক হবে)</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  {[
                    { id: 'male' as CertificateGender, label: 'ছেলে' },
                    { id: 'female' as CertificateGender, label: 'মেয়ে' },
                    { id: 'unspecified' as CertificateGender, label: 'সাধারণ' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setIsBodyLocked(false);
                        setDraft((p) => ({ ...p, gender: g.id }));
                      }}
                      className={`py-1 rounded-lg font-bold text-[11px] cursor-pointer transition ${
                        draft.gender === g.id
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">জন্ম তারিখ</label>
                <input
                  type="date"
                  value={draft.dob}
                  onChange={(e) => setDraft((p) => ({ ...p, dob: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            {/* Academic & Board Grid */}
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">শ্রেণি</label>
                <input
                  type="text"
                  value={draft.grade}
                  onChange={(e) => setDraft((p) => ({ ...p, grade: e.target.value }))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">রোল</label>
                <input
                  type="text"
                  value={draft.roll}
                  onChange={(e) => setDraft((p) => ({ ...p, roll: e.target.value }))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">বিভাগ</label>
                <input
                  type="text"
                  value={draft.group}
                  onChange={(e) => setDraft((p) => ({ ...p, group: e.target.value }))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">সেশন</label>
                <input
                  type="text"
                  value={draft.session}
                  onChange={(e) => setDraft((p) => ({ ...p, session: e.target.value }))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            {(!draft.currentlyStudying || certType === 'ssc_testimonial' || certType === 'merit_certificate') && (
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900 rounded-xl space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-800 dark:text-indigo-200 mb-1">পরীক্ষা</label>
                    <select
                      value={draft.examType}
                      onChange={(e) => setDraft((p) => ({ ...p, examType: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg font-bold"
                    >
                      {BOARD_EXAM_TYPES.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.labelBn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-800 dark:text-indigo-200 mb-1">শিক্ষা বোর্ড</label>
                    <select
                      value={draft.boardName}
                      onChange={(e) => setDraft((p) => ({ ...p, boardName: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg font-bold"
                    >
                      {EDUCATION_BOARDS.map((b) => (
                        <option key={b.bn} value={b.bn}>
                          {b.bn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={draft.boardRoll}
                    onChange={(e) => setDraft((p) => ({ ...p, boardRoll: e.target.value }))}
                    placeholder="বোর্ড রোল"
                    className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg font-mono font-bold"
                  />
                  <input
                    type="text"
                    value={draft.boardReg}
                    onChange={(e) => setDraft((p) => ({ ...p, boardReg: e.target.value }))}
                    placeholder="রেজি. নং"
                    className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg font-mono font-bold"
                  />
                  <input
                    type="text"
                    value={draft.passingYear}
                    onChange={(e) => setDraft((p) => ({ ...p, passingYear: e.target.value }))}
                    placeholder="পাসের সন"
                    className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg font-mono font-bold"
                  />
                  <input
                    type="text"
                    value={draft.gpa}
                    onChange={(e) => setDraft((p) => ({ ...p, gpa: e.target.value }))}
                    placeholder="GPA"
                    className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg font-mono font-bold text-emerald-700 dark:text-emerald-300"
                  />
                </div>
              </div>
            )}

            {/* Address Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input
                type="text"
                value={draft.village}
                onChange={(e) => setDraft((p) => ({ ...p, village: e.target.value }))}
                placeholder="গ্রাম"
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
              />
              <input
                type="text"
                value={draft.postOffice}
                onChange={(e) => setDraft((p) => ({ ...p, postOffice: e.target.value }))}
                placeholder="ডাকঘর"
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
              />
              <input
                type="text"
                value={draft.upazila}
                onChange={(e) => setDraft((p) => ({ ...p, upazila: e.target.value }))}
                placeholder="উপজেলা"
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
              />
              <input
                type="text"
                value={draft.district}
                onChange={(e) => setDraft((p) => ({ ...p, district: e.target.value }))}
                placeholder="জেলা"
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
              />
            </div>

            {/* 8 Quick Trait Pills */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500">গুণাবলি ও আচরণ পিল (১ ক্লিকে যুক্ত)</label>
              <div className="flex flex-wrap gap-1.5">
                {CERTIFICATE_TRAITS.map((tr) => {
                  const active = selectedTraits.includes(tr.id);
                  return (
                    <button
                      key={tr.id}
                      type="button"
                      onClick={() => toggleTrait(tr.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                        active
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {language === 'en' ? tr.labelEn : tr.labelBn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Purpose Presets + Achievement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">প্রদানের উদ্দেশ্য</label>
                <select
                  value={purposeId}
                  onChange={(e) => {
                    setIsBodyLocked(false);
                    setPurposeId(e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                >
                  {CERTIFICATE_PURPOSES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {language === 'en' ? p.labelEn : p.labelBn}
                    </option>
                  ))}
                  <option value="custom">কাস্টম উদ্দেশ্য লিখুন...</option>
                </select>
              </div>

              {(certType === 'merit_certificate' ||
                certType === 'appreciation' ||
                certType === 'participation' ||
                certType === 'activity_certificate') && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">অর্জন / কৃতিত্ব</label>
                  <input
                    type="text"
                    value={achievementTitle}
                    onChange={(e) => {
                      setIsBodyLocked(false);
                      setAchievementTitle(e.target.value);
                    }}
                    placeholder="যেমন: বার্ষিক ক্রীড়া / ১ম স্থান"
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                  />
                </div>
              )}
            </div>

            {purposeId === 'custom' && (
              <input
                type="text"
                value={customPurposeText}
                onChange={(e) => {
                  setIsBodyLocked(false);
                  setCustomPurposeText(e.target.value);
                }}
                placeholder="সনদ প্রদানের বিশেষ উদ্দেশ্য লিখুন..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
              />
            )}

            {/* Body Editor with Lock Protection */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                  <FileText size={12} /> মূল বিবরণী ({isBodyLocked ? 'ম্যানুয়াল লকড' : 'অটো-সিঙ্ক চালু'})
                </label>
                {isBodyLocked && (
                  <button
                    type="button"
                    onClick={() => setIsBodyLocked(false)}
                    className="text-[10px] font-bold text-amber-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={11} /> অটো-বয়ান পুনঃতৈরি
                  </button>
                )}
              </div>
              <textarea
                rows={5}
                value={customBody}
                onChange={(e) => {
                  setIsBodyLocked(true);
                  setCustomBody(e.target.value);
                }}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs leading-relaxed font-serif"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">বিশেষ মন্তব্য (ঐচ্ছিক)</label>
              <input
                type="text"
                value={characterRemarks}
                onChange={(e) => {
                  setIsBodyLocked(false);
                  setCharacterRemarks(e.target.value);
                }}
                placeholder="অতিরিক্ত চরিত্র বা সুপারিশ সংক্রান্ত মন্তব্য..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Visual Design Controls */}
        {studioStep === 'design' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 space-y-3">
            <h3 className="font-black text-xs text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              ডিজাইন, রঙ, বর্ডার ও অফিস কপি স্টুডিও
            </h3>
            <CertificateDesignControls
              design={design}
              setDesign={setDesign}
              onOpenPadSettings={onOpenPadSettings}
            />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* RIGHT / LIVE STICKY PREVIEW & EXPORT CANVAS (7 Cols on XL)        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="xl:col-span-7 space-y-3 xl:sticky xl:top-4 print:static print:col-span-12">
        {/* Live Preview Action Bar */}
        <div className="bg-slate-900 text-white rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-md print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setInlineEditable((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition ${
                inlineEditable
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title="শিটের শিরোনাম বা লেখায় সরাসরি ক্লিক করে এডিট করুন"
            >
              <Edit3 size={13} />
              {inlineEditable ? 'সরাসরি এডিট চালু ✓' : 'সরাসরি লেখা এডিট'}
            </button>

            <div className="flex items-center bg-slate-800 rounded-xl p-0.5 text-[10px] font-bold">
              {[0.58, 0.68, 0.85, 1].map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setPreviewScale(z)}
                  className={`px-2 py-1 rounded-lg cursor-pointer transition ${
                    Math.abs(previewScale - z) < 0.02
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {Math.round(z * 100)}%
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => persistCertificate(false)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer transition"
            >
              <Save size={13} /> {savedCertId ? 'হালনাগাদ করুন' : 'রেজিস্টারে সেভ'}
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={exportingPng}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer transition"
            >
              {exportingPng ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
              PNG ছবি
            </button>

            <button
              type="button"
              onClick={handlePrintCertificate}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer transition"
            >
              <Printer size={13} /> প্রিন্ট / PDF
            </button>
          </div>
        </div>

        {/* Scaled Interactive Sheet Wrapper (Print resets transform to 100%) */}
        <div className="bg-slate-100 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-5 overflow-x-auto flex justify-center print:bg-white print:border-0 print:p-0 print:overflow-visible print:block">
          <div
            className="print:!w-auto print:!h-auto"
            style={{
              width: `${Math.round((design.orientation === 'landscape' ? 1122 : 794) * previewScale)}px`,
              height: `${Math.round((design.orientation === 'landscape' ? 794 : 1122) * previewScale)}px`,
            }}
          >
            <div
              className="origin-top-left print:!transform-none print:!w-auto"
              style={{
                transform: previewScale < 1 ? `scale(${previewScale})` : undefined,
                transformOrigin: 'top left',
                width: design.orientation === 'landscape' ? '297mm' : '210mm',
              }}
            >
              <OfficialCertificateDoc
                sheetRef={sheetRef}
                cert={liveCertRecord}
                settings={schoolSettings}
                overrideStyle={liveCertRecord.layoutStyle}
                mode={design.showHeader ? 'full_pad' : 'preprinted'}
                hideHeaderActions={true}
                inlineEditable={inlineEditable}
                onInlineTitleChange={(next) => {
                  setIsTitleLocked(true);
                  setCustomTitle(next);
                }}
                onInlineBodyChange={(next) => {
                  setIsBodyLocked(true);
                  setCustomBody(next);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
