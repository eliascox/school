'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Edit3,
  GraduationCap,
  Minus,
  PenTool,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';
import { Student, studentService } from '@/services/studentService';
import { AlumniRecord } from '@/services/alumniService';
import { SchoolSettings } from '@/services/settingsService';
import {
  CertificateCanvasMode,
  CertificateInput,
  CertificateRecord,
  CertificateType,
  certificateService,
} from '@/services/certificateService';
import {
  BOARD_EXAM_TYPES,
  buildDefaultRefNo,
  CertificateDraft,
  CertificateGender,
  CertificateLanguage,
  composeCertificateBody,
  CUSTOM_DOCUMENT_PRESETS,
  EDUCATION_BOARDS,
  getDefaultCertificateTitle,
  mapAlumniToCertificateDraft,
  mapStudentToCertificateDraft,
  sortStudentsByRoll,
  StudentSourceKind,
} from '@/lib/certificateEngine';
import { exportElementToPng } from '@/lib/certificatePngExport';
import OfficialCertificateDoc from '@/components/OfficialCertificateDoc';
import { ALL_CERTIFICATE_TYPES } from './certificateThemes';

interface CertificateStudioWorkspaceProps {
  students: Student[];
  alumniList: AlumniRecord[];
  schoolSettings: SchoolSettings;
  padCanvasMode: 'uploaded_pad' | 'preprinted_pad';
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

const CORE_CERT_TYPES: CertificateType[] = [
  'current_student',
  'character_certificate',
  'transfer_certificate',
  'ssc_testimonial',
];

const EXTRA_CERT_TYPES = ALL_CERTIFICATE_TYPES.filter(
  (t) => !CORE_CERT_TYPES.includes(t.id),
);

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
  grade: '',
  section: '',
  group: '',
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
  padCanvasMode,
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

  // Core Certificate State
  const [certType, setCertType] = useState<CertificateType>(
    initialType || editingCert?.type || 'current_student',
  );
  const [language, setLanguage] = useState<CertificateLanguage>(
    editingCert?.language || 'bn',
  );
  const [sourceMode, setSourceMode] = useState<'sync' | 'custom'>(
    editingCert && (editingCert.studentId === 'MANUAL' || editingCert.studentId?.startsWith('CUSTOM-'))
      ? 'custom'
      : 'sync',
  );
  const [syncListKind, setSyncListKind] = useState<'active' | 'alumni'>('active');
  const [customSubMode, setCustomSubMode] = useState<'structured' | 'freeform'>(
    editingCert?.customRecipientMode || 'structured',
  );

  // Student Picker Filters (compact)
  const [pickerExpanded, setPickerExpanded] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniRecord | null>(null);

  // Form Data
  const [draft, setDraft] = useState<CertificateDraft>(EMPTY_DRAFT);
  const [refNo, setRefNo] = useState<string>(() => buildDefaultRefNo(schoolSettings));
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customTitle, setCustomTitle] = useState<string>(() =>
    getDefaultCertificateTitle(
      initialType || editingCert?.type || 'current_student',
      editingCert?.language || 'bn',
    ),
  );
  const [customBody, setCustomBody] = useState<string>('');
  const [isBodyLocked, setIsBodyLocked] = useState<boolean>(false);
  const [isTitleLocked, setIsTitleLocked] = useState<boolean>(false);
  const [showExtraFields, setShowExtraFields] = useState<boolean>(false);
  const [achievementTitle, setAchievementTitle] = useState<string>('');

  // Minimal Pad Display Options (No digital borders/frames!)
  const [showQrCode, setShowQrCode] = useState<boolean>(editingCert?.showQrCode !== false);
  const [showPhotoBox, setShowPhotoBox] = useState<boolean>(Boolean(editingCert?.showPhotoBox));
  const [showSecondarySigner, setShowSecondarySigner] = useState<boolean>(
    Boolean(editingCert?.showSecondarySigner),
  );
  const [secondarySignerTitle, setSecondarySignerTitle] = useState<string>(
    editingCert?.secondarySignerTitle || 'শ্রেণি শিক্ষক',
  );
  const [hideTitle, setHideTitle] = useState<boolean>(Boolean(editingCert?.hideTitle));
  const [fontSize, setFontSize] = useState<number>(
    editingCert?.fontSize || schoolSettings.padFontSize || 14.5,
  );

  // Preview Controls
  const [inlineEditable, setInlineEditable] = useState<boolean>(false);
  const [previewScale, setPreviewScale] = useState<number>(0.72);
  const [savedCertId, setSavedCertId] = useState<string | null>(editingCert?.id || null);
  const [exportingPng, setExportingPng] = useState<boolean>(false);

  const selectActiveStudent = useCallback(
    (st: Student) => {
      setSelectedStudent(st);
      setSelectedAlumni(null);
      setSourceMode('sync');
      setSyncListKind('active');
      const mapped = mapStudentToCertificateDraft(st, schoolSettings);
      if (certType === 'ssc_testimonial' || certType === 'transfer_certificate') {
        mapped.currentlyStudying = false;
      }
      setDraft(mapped);
      setPickerExpanded(false);
      setSavedCertId(null);
      setIsBodyLocked(false);
    },
    [certType, schoolSettings],
  );

  const selectAlumniRecord = useCallback(
    (alm: AlumniRecord) => {
      setSelectedAlumni(alm);
      setSelectedStudent(null);
      setSourceMode('sync');
      setSyncListKind('alumni');
      setDraft(mapAlumniToCertificateDraft(alm, schoolSettings));
      setPickerExpanded(false);
      setSavedCertId(null);
      setIsBodyLocked(false);
    },
    [schoolSettings],
  );

  // Deep-link hydration
  useEffect(() => {
    if (initialType) {
      setCertType(initialType);
      if (initialType === 'ssc_testimonial') setShowExtraFields(true);
    }
  }, [initialType]);

  useEffect(() => {
    if (initialStudentId && students.length > 0) {
      const match = students.find((s) => s.id === initialStudentId);
      if (match) selectActiveStudent(match);
    }
  }, [initialStudentId, students, selectActiveStudent]);

  useEffect(() => {
    if (initialAlumniId && alumniList.length > 0) {
      const match = alumniList.find(
        (a) => a.id === initialAlumniId || a.studentId === initialAlumniId,
      );
      if (match) selectAlumniRecord(match);
    }
  }, [initialAlumniId, alumniList, selectAlumniRecord]);

  // Edit existing certificate from Register
  useEffect(() => {
    if (!editingCert) return;
    setSavedCertId(editingCert.id);
    setCertType(editingCert.type);
    setLanguage(editingCert.language === 'en' ? 'en' : 'bn');
    setRefNo(editingCert.refNo || buildDefaultRefNo(schoolSettings));
    setIssueDate(editingCert.issueDate || new Date().toISOString().split('T')[0]);
    setShowQrCode(editingCert.showQrCode !== false);
    setShowPhotoBox(Boolean(editingCert.showPhotoBox));
    setShowSecondarySigner(Boolean(editingCert.showSecondarySigner));
    setSecondarySignerTitle(editingCert.secondarySignerTitle || 'শ্রেণি শিক্ষক');
    setHideTitle(Boolean(editingCert.hideTitle));
    setFontSize(editingCert.fontSize || schoolSettings.padFontSize || 14.5);
    const isCustom =
      editingCert.studentId === 'MANUAL' || editingCert.studentId?.startsWith('CUSTOM-');
    setSourceMode(isCustom ? 'custom' : 'sync');
    setCustomSubMode(editingCert.customRecipientMode || 'structured');
    setPickerExpanded(false);
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
      sourceKind: (isCustom ? 'manual' : editingCert.isAlumni ? 'alumni' : 'active') as StudentSourceKind,
      studentId: editingCert.studentId,
      studentName: editingCert.studentName,
      studentNameEn: editingCert.studentNameEn || '',
      fatherName: editingCert.fatherName || '',
      fatherNameEn: editingCert.fatherNameEn || '',
      motherName: editingCert.motherName || '',
      motherNameEn: editingCert.motherNameEn || '',
      gender:
        editingCert.gender === 'female' ||
        editingCert.gender === 'Female' ||
        editingCert.gender === 'নারী'
          ? 'female'
          : editingCert.gender === 'unspecified'
          ? 'unspecified'
          : 'male',
      roll: editingCert.roll || '',
      grade: editingCert.grade || '',
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
      currentlyStudying:
        editingCert.currentlyStudying !== undefined
          ? editingCert.currentlyStudying
          : !editingCert.isAlumni,
    }));
  }, [editingCert, schoolSettings]);

  // Auto-update title unless user edited it manually
  useEffect(() => {
    if (!isTitleLocked) {
      setCustomTitle(getDefaultCertificateTitle(certType, language));
    }
  }, [certType, language, isTitleLocked]);

  // Auto-compose body prose unless user locked it or is in freeform mode
  useEffect(() => {
    if (isBodyLocked) return;
    if (sourceMode === 'custom' && customSubMode === 'freeform') return;
    const composed = composeCertificateBody({
      type: certType,
      language,
      draft,
      schoolSettings,
      selectedTraits: ['meritorious', 'regular', 'disciplined'],
      purposeId: 'general',
      achievementTitle,
      omitEmptyFields: sourceMode === 'custom' || certType === 'custom_certificate',
    });
    setCustomBody(composed);
  }, [
    isBodyLocked,
    sourceMode,
    customSubMode,
    certType,
    language,
    draft,
    schoolSettings,
    achievementTitle,
  ]);

  const handleSelectCertType = (nextType: CertificateType) => {
    setCertType(nextType);
    if (nextType === 'ssc_testimonial') {
      setShowExtraFields(true);
    }
    setDraft((prev) => ({
      ...prev,
      currentlyStudying:
        nextType === 'ssc_testimonial' || nextType === 'transfer_certificate'
          ? false
          : prev.sourceKind !== 'alumni',
    }));
    setIsTitleLocked(false);
    setIsBodyLocked(false);
    setSavedCertId(null);
  };

  const handleSwitchSource = (next: 'sync' | 'custom') => {
    setSourceMode(next);
    if (next === 'custom') {
      setSelectedStudent(null);
      setSelectedAlumni(null);
      setDraft({
        ...EMPTY_DRAFT,
        currentlyStudying:
          certType !== 'ssc_testimonial' && certType !== 'transfer_certificate',
      });
      setIsBodyLocked(false);
      setSavedCertId(null);
    } else {
      setCustomSubMode('structured');
      setPickerExpanded(true);
    }
  };

  const applyCustomPreset = (presetId: string) => {
    const preset = CUSTOM_DOCUMENT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const rawBody = language === 'en' ? preset.bodyEn : preset.bodyBn;
    const interpolated = certificateService.interpolateTemplate(rawBody, {
      student_name:
        (language === 'en' ? draft.studentNameEn || draft.studentName : draft.studentName) ||
        (language === 'en' ? 'Recipient Name' : 'প্রাপকের নাম'),
      father_name: draft.fatherName || '...',
      mother_name: draft.motherName || '...',
      class: draft.grade || '১০ম',
      roll_no: draft.roll || '০১',
      session: draft.session || String(new Date().getFullYear()),
      school_name: schoolSettings.schoolName || 'অত্র বিদ্যালয়',
    });
    setCustomSubMode('freeform');
    setCertType('custom_certificate');
    setIsTitleLocked(true);
    setCustomTitle(language === 'en' ? preset.titleEn : preset.titleBn);
    setIsBodyLocked(true);
    setCustomBody(interpolated);
  };

  // Filtered & sorted students
  const uniqueGrades = useMemo(
    () => Array.from(new Set(students.map((s) => s.grade).filter(Boolean))),
    [students],
  );
  const uniqueSections = useMemo(
    () =>
      Array.from(
        new Set(
          students
            .filter((s) => gradeFilter === 'all' || s.grade === gradeFilter)
            .map((s) => s.section || s.branch || '')
            .filter(Boolean),
        ),
      ),
    [students, gradeFilter],
  );

  const filteredActiveStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = students.filter((s) => {
      const matchGrade = gradeFilter === 'all' || s.grade === gradeFilter;
      const sec = s.section || s.branch || '';
      const matchSec = sectionFilter === 'all' || sec === sectionFilter;
      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.nameEn || '').toLowerCase().includes(q) ||
        s.roll.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q);
      return matchGrade && matchSec && matchQuery;
    });
    return sortStudentsByRoll(matched);
  }, [students, gradeFilter, sectionFilter, searchQuery]);

  const filteredAlumni = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return alumniList.filter(
      (a) =>
        !q ||
        a.name.toLowerCase().includes(q) ||
        (a.sscRoll || '').toLowerCase().includes(q) ||
        (a.batch || '').toLowerCase().includes(q),
    );
  }, [alumniList, searchQuery]);

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
    onNotify('success', `${selectedStudent.name}-এর ইংরেজি নাম প্রোফাইলে সেভ হয়েছে!`);
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
      canvasMode: padCanvasMode as CertificateCanvasMode,
      hideTitle,
      customRecipientMode: sourceMode === 'custom' ? customSubMode : 'structured',
      layoutStyle: 'pad',
      studentId: draft.studentId || (sourceMode === 'custom' ? 'CUSTOM' : 'MANUAL'),
      studentName:
        draft.studentName || (sourceMode === 'custom' ? 'প্রাপকের নাম' : 'শিক্ষার্থীর নাম'),
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
      address: [draft.village, draft.postOffice, draft.upazila, draft.district]
        .filter(Boolean)
        .join(', '),
      boardRoll: draft.boardRoll || undefined,
      boardReg: draft.boardReg || undefined,
      passingYear: draft.passingYear || undefined,
      gpa: draft.gpa || undefined,
      gradeLetter: draft.gradeLetter || undefined,
      gpaScale: draft.gpaScale || '5.00',
      examType: draft.examType,
      boardName: draft.boardName,
      currentlyStudying: draft.currentlyStudying,
      isAlumni: !draft.currentlyStudying,
      achievementTitle: achievementTitle.trim() || undefined,
      customBody,
      language,
      orientation: 'portrait',
      titleVariant: 'boxed',
      borderPreset: 'no_border_pad',
      showHeader: false,
      showPhotoBox,
      photoUrl: draft.photoUrl || undefined,
      showOfficeStub: false,
      showCornerBands: false,
      fontSize,
      showQrCode,
      cursiveNames: true,
      showSecondarySigner,
      secondarySignerTitle,
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
      padCanvasMode,
      hideTitle,
      sourceMode,
      customSubMode,
      draft,
      achievementTitle,
      customBody,
      showPhotoBox,
      fontSize,
      showQrCode,
      showSecondarySigner,
      secondarySignerTitle,
    ],
  );

  const persistCertificate = (quiet = false): CertificateRecord | null => {
    const resolvedName = (draft.studentName || draft.studentNameEn).trim();
    if (!resolvedName && customSubMode !== 'freeform') {
      onNotify('error', 'অনুগ্রহ করে শিক্ষার্থী বা প্রাপকের নাম লিখুন!');
      return null;
    }
    const {
      id: _id,
      verificationCode: _vc,
      createdDate: _cd,
      status: _st,
      auditTrail: _at,
      ...rest
    } = liveCertRecord;
    const payload: CertificateInput = {
      ...rest,
      id: savedCertId || undefined,
      studentId:
        draft.studentId ||
        (sourceMode === 'custom'
          ? `CUSTOM-${Date.now().toString().slice(-5)}`
          : `STU-${Date.now().toString().slice(-5)}`),
      studentName: resolvedName || customTitle.trim() || 'কাস্টম সনদ',
      createdBy: createdByName,
    };
    const saved = certificateService.saveCertificate(payload);
    setSavedCertId(saved.id);
    onSaved(saved);
    if (!quiet) {
      onNotify('success', `সনদ (${saved.id}) রেজিস্টারে সংরক্ষিত হয়েছে!`);
    }
    return saved;
  };

  const handlePrint = () => {
    const saved = savedCertId
      ? certificateService.getCertificateById(savedCertId)
      : persistCertificate(true);
    if (saved) {
      certificateService.logPrintAction(saved.id, createdByName);
      onSaved(saved);
    }
    setTimeout(() => window.print(), 120);
  };

  const handleDownloadPng = async () => {
    if (!sheetRef.current) return;
    setExportingPng(true);
    try {
      const saved = savedCertId
        ? certificateService.getCertificateById(savedCertId)
        : persistCertificate(true);
      const safeName = (draft.studentNameEn || draft.studentName || customTitle || 'certificate')
        .replace(/[^a-zA-Z0-9\u0980-\u09FF_-]+/g, '_')
        .slice(0, 32);
      const res = await exportElementToPng(
        sheetRef.current,
        `${safeName}_${saved?.id || certType}.png`,
      );
      if (res.ok) onNotify('success', 'PNG ছবি ডাউনলোড হয়েছে!');
      else onNotify('error', 'PNG ডাউনলোডে সমস্যা — প্রিন্ট / PDF ব্যবহার করুন।');
    } finally {
      setExportingPng(false);
    }
  };

  const isExtraTypeSelected = EXTRA_CERT_TYPES.some((t) => t.id === certType);
  const showBoardFields =
    certType === 'ssc_testimonial' || certType === 'merit_certificate' || !draft.currentlyStudying;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* LEFT PANEL: CLEAN, UNCLUTTERED SINGLE-FLOW CERTIFICATE FORM       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="xl:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 space-y-4 text-xs print:hidden">
        {/* 1. Certificate Type Selector (Clean 4 Pills + Other Dropdown) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black text-slate-600 dark:text-slate-300">
              ১. সনদের ধরন
            </label>
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10.5px] font-bold">
              {[
                { id: 'bn' as const, label: 'বাংলা' },
                { id: 'en' as const, label: 'English' },
              ].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    setLanguage(l.id);
                    setIsTitleLocked(false);
                    if (customSubMode !== 'freeform') setIsBodyLocked(false);
                  }}
                  className={`px-2.5 py-0.5 rounded-md cursor-pointer transition ${
                    language === l.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'current_student' as const, label: 'প্রত্যয়ন পত্র' },
              { id: 'character_certificate' as const, label: 'চারিত্রিক সনদ' },
              { id: 'transfer_certificate' as const, label: 'ছাড়পত্র (TC)' },
              { id: 'ssc_testimonial' as const, label: 'প্রশংসাপত্র' },
            ].map((item) => {
              const active = certType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectCertType(item.id)}
                  className={`py-2 px-3 rounded-xl font-black text-xs border transition cursor-pointer flex items-center justify-between ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50/80 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {active && <Check size={13} className="text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          <select
            value={isExtraTypeSelected ? certType : ''}
            onChange={(e) => {
              if (e.target.value) handleSelectCertType(e.target.value as CertificateType);
            }}
            className={`w-full px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
              isExtraTypeSelected
                ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-400 text-indigo-800 dark:text-indigo-200'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            <option value="">অন্যান্য সনদ (যাচাইকরণ, মেধা, কৃতিত্ব, অংশগ্রহণ, কাস্টম)...</option>
            {EXTRA_CERT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.titleBn}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Source Switcher: Student Directory Sync vs Custom */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleSwitchSource('sync')}
              className={`py-1.5 px-2.5 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                sourceMode === 'sync'
                  ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Users size={13} /> শিক্ষার্থী সিংক
            </button>
            <button
              type="button"
              onClick={() => handleSwitchSource('custom')}
              className={`py-1.5 px-2.5 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                sourceMode === 'custom'
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <PenTool size={13} /> কাস্টম তৈরি
            </button>
          </div>

          {/* Sync Picker (collapses cleanly to a 1-line badge once a student is picked) */}
          {sourceMode === 'sync' && (
            <div>
              {(selectedStudent || selectedAlumni) && !pickerExpanded ? (
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <UserCheck size={14} className="text-indigo-600 shrink-0" />
                    <span className="font-bold text-indigo-950 dark:text-indigo-200 truncate">
                      {selectedStudent
                        ? `${selectedStudent.name} (রোল ${selectedStudent.roll}, ${selectedStudent.grade})`
                        : `${selectedAlumni?.name} (${selectedAlumni?.batch})`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPickerExpanded(true)}
                    className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer shrink-0"
                  >
                    বদলান
                  </button>
                </div>
              ) : (
                <div className="space-y-2 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Search
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="নাম বা রোল খুঁজুন..."
                        className="w-full pl-7 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    {syncListKind === 'active' && (
                      <select
                        value={gradeFilter}
                        onChange={(e) => {
                          setGradeFilter(e.target.value);
                          setSectionFilter('all');
                        }}
                        className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-bold"
                      >
                        <option value="all">সব শ্রেণি</option>
                        {uniqueGrades.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    )}
                    {syncListKind === 'active' && uniqueSections.length > 1 && (
                      <select
                        value={sectionFilter}
                        onChange={(e) => setSectionFilter(e.target.value)}
                        className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-bold"
                      >
                        <option value="all">শাখা</option>
                        {uniqueSections.map((sec) => (
                          <option key={sec} value={sec}>
                            {sec}
                          </option>
                        ))}
                      </select>
                    )}
                    {alumniList.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setSyncListKind((k) => (k === 'active' ? 'alumni' : 'active'))
                        }
                        className={`px-2 py-1.5 rounded-lg text-[10.5px] font-bold border cursor-pointer shrink-0 ${
                          syncListKind === 'alumni'
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600'
                        }`}
                        title="অ্যালুমনাই তালিকা"
                      >
                        <GraduationCap size={13} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {syncListKind === 'active' ? (
                      filteredActiveStudents.length === 0 ? (
                        <p className="text-center py-3 text-[11px] text-slate-400">
                          কোনো শিক্ষার্থী নেই — &quot;কাস্টম তৈরি&quot; ব্যবহার করুন
                        </p>
                      ) : (
                        filteredActiveStudents.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => selectActiveStudent(s)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800 text-left flex items-center justify-between gap-2 cursor-pointer transition"
                          >
                            <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                              {s.name}
                            </span>
                            <span className="text-[10.5px] text-slate-500 font-mono shrink-0">
                              রোল {s.roll} • {s.grade}
                            </span>
                          </button>
                        ))
                      )
                    ) : (
                      filteredAlumni.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => selectAlumniRecord(a)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-violet-50 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800 text-left flex items-center justify-between gap-2 cursor-pointer transition"
                        >
                          <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                            {a.name}
                          </span>
                          <span className="text-[10.5px] text-slate-500 font-mono shrink-0">
                            {a.batch} • GPA {a.gpa || '—'}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Quick Presets */}
          {sourceMode === 'custom' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setCustomSubMode('structured');
                  setIsBodyLocked(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition ${
                  customSubMode === 'structured'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                ফর্ম পূরণ
              </button>
              {CUSTOM_DOCUMENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyCustomPreset(preset.id)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-500 hover:text-slate-950 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60 cursor-pointer transition"
                >
                  {preset.labelBn}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Core Details Form (Clean & Minimal) */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          {/* Title + Ref + Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10.5px] font-bold text-slate-500">সনদের শিরোনাম</label>
              <label className="flex items-center gap-1 text-[10.5px] text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideTitle}
                  onChange={(e) => setHideTitle(e.target.checked)}
                  className="rounded text-indigo-600 cursor-pointer"
                />
                লুকান
              </label>
            </div>
            <input
              type="text"
              disabled={hideTitle}
              value={customTitle}
              onChange={(e) => {
                setIsTitleLocked(true);
                setCustomTitle(e.target.value);
              }}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-slate-900 dark:text-white disabled:opacity-40"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                স্মারক / সূত্র নং
              </label>
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-bold text-slate-500 mb-1">তারিখ</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          {/* Recipient Name + Gender */}
          {sourceMode === 'custom' && customSubMode === 'freeform' ? (
            <div>
              <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                প্রাপকের নাম
              </label>
              <input
                type="text"
                value={draft.studentName}
                onChange={(e) => {
                  const prevName = draft.studentName.trim();
                  const nextName = e.target.value;
                  setDraft((p) => ({ ...p, studentName: nextName }));
                  const target =
                    nextName.trim() || (language === 'en' ? 'Recipient Name' : 'প্রাপকের নাম');
                  setCustomBody((prevBody) => {
                    if (prevName && prevBody.includes(`**${prevName}**`)) {
                      return prevBody.split(`**${prevName}**`).join(`**${target}**`);
                    }
                    if (prevBody.includes('**প্রাপকের নাম**')) {
                      return prevBody.split('**প্রাপকের নাম**').join(`**${target}**`);
                    }
                    if (prevBody.includes('**Recipient Name**')) {
                      return prevBody.split('**Recipient Name**').join(`**${target}**`);
                    }
                    return prevBody;
                  });
                }}
                placeholder="যার নামে সনদ দেওয়া হচ্ছে..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-8">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10.5px] font-bold text-slate-500">
                      {language === 'en' ? 'Student Name (EN)' : 'শিক্ষার্থীর নাম'} *
                    </label>
                    {language === 'en' &&
                      selectedStudent &&
                      draft.studentNameEn &&
                      draft.studentNameEn !== selectedStudent.nameEn && (
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
                    value={language === 'en' ? draft.studentNameEn || draft.studentName : draft.studentName}
                    onChange={(e) =>
                      setDraft((p) =>
                        language === 'en'
                          ? { ...p, studentNameEn: e.target.value }
                          : { ...p, studentName: e.target.value },
                      )
                    }
                    placeholder="পূর্ণ নাম লিখুন"
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                  />
                </div>
                <div className="col-span-4">
                  <label className="block text-[10.5px] font-bold text-slate-500 mb-1">লিঙ্গ</label>
                  <select
                    value={draft.gender}
                    onChange={(e) => {
                      setIsBodyLocked(false);
                      setDraft((p) => ({ ...p, gender: e.target.value as CertificateGender }));
                    }}
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                  >
                    <option value="male">ছাত্র</option>
                    <option value="female">ছাত্রী</option>
                    <option value="unspecified">সাধারণ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={language === 'en' ? draft.fatherNameEn || draft.fatherName : draft.fatherName}
                  onChange={(e) =>
                    setDraft((p) =>
                      language === 'en'
                        ? { ...p, fatherNameEn: e.target.value }
                        : { ...p, fatherName: e.target.value },
                    )
                  }
                  placeholder={language === 'en' ? "Father's Name" : 'পিতার নাম'}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                />
                <input
                  type="text"
                  value={language === 'en' ? draft.motherNameEn || draft.motherName : draft.motherName}
                  onChange={(e) =>
                    setDraft((p) =>
                      language === 'en'
                        ? { ...p, motherNameEn: e.target.value }
                        : { ...p, motherName: e.target.value },
                    )
                  }
                  placeholder={language === 'en' ? "Mother's Name" : 'মাতার নাম'}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <input
                  type="text"
                  value={draft.grade}
                  onChange={(e) => setDraft((p) => ({ ...p, grade: e.target.value }))}
                  placeholder="শ্রেণি"
                  className="px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                />
                <input
                  type="text"
                  value={draft.roll}
                  onChange={(e) => setDraft((p) => ({ ...p, roll: e.target.value }))}
                  placeholder="রোল"
                  className="px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold"
                />
                <input
                  type="text"
                  value={draft.group}
                  onChange={(e) => setDraft((p) => ({ ...p, group: e.target.value }))}
                  placeholder="বিভাগ"
                  className="px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                />
                <input
                  type="text"
                  value={draft.session}
                  onChange={(e) => setDraft((p) => ({ ...p, session: e.target.value }))}
                  placeholder="সেশন"
                  className="px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold"
                />
              </div>

              {/* Collapsible Address, DOB & Board Details */}
              <button
                type="button"
                onClick={() => setShowExtraFields((v) => !v)}
                className="w-full py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <span>ঠিকানা, জন্ম তারিখ ও বোর্ড পরীক্ষার তথ্য</span>
                {showExtraFields ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showExtraFields && (
                <div className="space-y-2 p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        জন্ম তারিখ
                      </label>
                      <input
                        type="date"
                        value={draft.dob}
                        onChange={(e) => setDraft((p) => ({ ...p, dob: e.target.value }))}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-[11px]"
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.currentlyStudying}
                          onChange={(e) => {
                            setIsBodyLocked(false);
                            setDraft((p) => ({ ...p, currentlyStudying: e.target.checked }));
                          }}
                          className="rounded text-indigo-600 cursor-pointer"
                        />
                        বর্তমানে অধ্যয়নরত
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <input
                      type="text"
                      value={draft.village}
                      onChange={(e) => setDraft((p) => ({ ...p, village: e.target.value }))}
                      placeholder="গ্রাম"
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                    />
                    <input
                      type="text"
                      value={draft.postOffice}
                      onChange={(e) => setDraft((p) => ({ ...p, postOffice: e.target.value }))}
                      placeholder="ডাকঘর"
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                    />
                    <input
                      type="text"
                      value={draft.upazila}
                      onChange={(e) => setDraft((p) => ({ ...p, upazila: e.target.value }))}
                      placeholder="উপজেলা"
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                    />
                    <input
                      type="text"
                      value={draft.district}
                      onChange={(e) => setDraft((p) => ({ ...p, district: e.target.value }))}
                      placeholder="জেলা"
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                    />
                  </div>

                  {showBoardFields && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-200/70 dark:border-slate-800">
                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={draft.examType}
                          onChange={(e) => setDraft((p) => ({ ...p, examType: e.target.value }))}
                          className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold"
                        >
                          {BOARD_EXAM_TYPES.map((ex) => (
                            <option key={ex.id} value={ex.id}>
                              {ex.labelBn}
                            </option>
                          ))}
                        </select>
                        <select
                          value={draft.boardName}
                          onChange={(e) => setDraft((p) => ({ ...p, boardName: e.target.value }))}
                          className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold"
                        >
                          {EDUCATION_BOARDS.map((b) => (
                            <option key={b.bn} value={b.bn}>
                              {b.bn}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        <input
                          type="text"
                          value={draft.boardRoll}
                          onChange={(e) => setDraft((p) => ({ ...p, boardRoll: e.target.value }))}
                          placeholder="বোর্ড রোল"
                          className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono"
                        />
                        <input
                          type="text"
                          value={draft.boardReg}
                          onChange={(e) => setDraft((p) => ({ ...p, boardReg: e.target.value }))}
                          placeholder="রেজি. নং"
                          className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono"
                        />
                        <input
                          type="text"
                          value={draft.passingYear}
                          onChange={(e) => setDraft((p) => ({ ...p, passingYear: e.target.value }))}
                          placeholder="পাসের সন"
                          className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono"
                        />
                        <input
                          type="text"
                          value={draft.gpa}
                          onChange={(e) => setDraft((p) => ({ ...p, gpa: e.target.value }))}
                          placeholder="GPA"
                          className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono font-bold text-emerald-700"
                        />
                      </div>
                    </div>
                  )}

                  {(certType === 'merit_certificate' ||
                    certType === 'appreciation' ||
                    certType === 'participation' ||
                    certType === 'activity_certificate') && (
                    <input
                      type="text"
                      value={achievementTitle}
                      onChange={(e) => {
                        setIsBodyLocked(false);
                        setAchievementTitle(e.target.value);
                      }}
                      placeholder="অর্জন / কৃতিত্ব (যেমন: বার্ষিক ক্রীড়া ১ম স্থান)"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold"
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Body Text Editor */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black text-slate-600 dark:text-slate-300">
              মূল বয়ান
            </label>
            {isBodyLocked && customSubMode !== 'freeform' && (
              <button
                type="button"
                onClick={() => setIsBodyLocked(false)}
                className="text-[10.5px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={11} /> অটো-বয়ান রিসেট
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
            placeholder="প্রত্যয়নের মূল লেখা এখানে থাকবে..."
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs leading-relaxed font-serif"
          />
        </div>

        {/* 5. Compact 1-Row Essential Footer Toggles */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-3 flex-wrap font-bold text-slate-600 dark:text-slate-300">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showQrCode}
                onChange={(e) => setShowQrCode(e.target.checked)}
                className="rounded text-indigo-600 cursor-pointer"
              />
              QR কোড
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showPhotoBox}
                onChange={(e) => setShowPhotoBox(e.target.checked)}
                className="rounded text-indigo-600 cursor-pointer"
              />
              ছবি
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showSecondarySigner}
                onChange={(e) => setShowSecondarySigner(e.target.checked)}
                className="rounded text-indigo-600 cursor-pointer"
              />
              ২য় স্বাক্ষর
            </label>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 pr-1">ফন্ট</span>
            <button
              type="button"
              onClick={() => setFontSize((f) => Math.max(12, +(f - 0.5).toFixed(1)))}
              className="p-0.5 hover:bg-white dark:hover:bg-slate-800 rounded cursor-pointer"
              title="ফন্ট ছোট"
            >
              <Minus size={12} />
            </button>
            <span className="font-mono font-bold text-[11px] w-7 text-center">{fontSize}</span>
            <button
              type="button"
              onClick={() => setFontSize((f) => Math.min(20, +(f + 0.5).toFixed(1)))}
              className="p-0.5 hover:bg-white dark:hover:bg-slate-800 rounded cursor-pointer"
              title="ফন্ট বড়"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        {showSecondarySigner && (
          <input
            type="text"
            value={secondarySignerTitle}
            onChange={(e) => setSecondarySignerTitle(e.target.value)}
            placeholder="২য় স্বাক্ষরকারীর পদবি (যেমন: শ্রেণি শিক্ষক)"
            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
          />
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* RIGHT PANEL: CLEAN STICKY A4 UPLOADED-PAD LIVE PREVIEW            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="xl:col-span-7 space-y-2.5 xl:sticky xl:top-4 print:static print:col-span-12">
        {/* Slim Preview Action Strip */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xs print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInlineEditable((v) => !v)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition border ${
                inlineEditable
                  ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-200'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
              title="প্যাডের লেখায় সরাসরি ক্লিক করে এডিট করুন"
            >
              <Edit3 size={13} />
              {inlineEditable ? 'সরাসরি এডিট চালু' : 'প্যাডে এডিট'}
            </button>

            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 px-1.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setPreviewScale((s) => Math.max(0.5, +(s - 0.08).toFixed(2)))}
                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded cursor-pointer"
                title="জুম আউট"
              >
                <Minus size={12} />
              </button>
              <span className="w-9 text-center">{Math.round(previewScale * 100)}%</span>
              <button
                type="button"
                onClick={() => setPreviewScale((s) => Math.min(1, +(s + 0.08).toFixed(2)))}
                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded cursor-pointer"
                title="জুম ইন"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => persistCertificate(false)}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition"
            >
              <Save size={13} /> {savedCertId ? 'আপডেট' : 'সেভ'}
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={exportingPng}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
            >
              {exportingPng ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
              PNG
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition"
            >
              <Printer size={13} /> প্রিন্ট / PDF
            </button>
          </div>
        </div>

        {/* Scaled A4 Uploaded Pad Canvas */}
        <div className="bg-slate-100/90 dark:bg-slate-950/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 overflow-x-auto flex justify-center print:bg-white print:border-0 print:p-0 print:overflow-visible print:block">
          <div
            className="print:!w-auto print:!h-auto"
            style={{
              width: `${Math.round(794 * previewScale)}px`,
              height: `${Math.round(1122 * previewScale)}px`,
            }}
          >
            <div
              className="origin-top-left print:!transform-none print:!w-auto"
              style={{
                transform: previewScale < 1 ? `scale(${previewScale})` : undefined,
                transformOrigin: 'top left',
                width: '210mm',
              }}
            >
              <OfficialCertificateDoc
                sheetRef={sheetRef}
                cert={liveCertRecord}
                settings={schoolSettings}
                canvasMode={padCanvasMode}
                onOpenSettings={onOpenPadSettings}
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
