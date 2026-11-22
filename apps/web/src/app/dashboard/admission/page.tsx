'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserPlus,
  Save,
  CheckCircle2,
  User,
  Users,
  MapPin,
  BookOpen,
  Printer,
  Globe,
  FileSpreadsheet,
  Camera,
  X,
  RotateCcw,
  Award,
  Search,
  Inbox,
  Send,
  Eye,
  Droplet,
  Calendar,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import QRCode from 'qrcode';
import { studentService } from '@/services/studentService';
import { auditTrailService } from '@/services/auditTrailService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { curriculumService } from '@/services/curriculumService';
import { languageService, AppLanguage } from '@/services/languageService';
import { smsService } from '@/services/smsService';
import { showToast } from '@/components/ui/ToastProvider';
import { teacherAuthService } from '@/services/teacherAuthService';
import OfficialAdmissionForm, { AdmissionFormData } from '@/components/OfficialAdmissionForm';
import { autoCropAndCompressStudentPhoto } from '@/lib/imageUtils';
import { triggerProfessionalPrint } from '@/lib/printPdfUtils';
import {
  normalizeNumericField,
  computeAdmissionStepCompletion,
  filterOnlineApplications,
  OnlineApplicationRecord,
} from '@/lib/admissionUtils';
import { toBanglaDigits } from '@/lib/resultPortalUtils';

type DashboardAdmissionTab = 'form' | 'applications';

const CLASS_PILLS: Array<{ value: string; labelBn: string; labelEn: string }> = [
  { value: '6th', labelBn: '৬ষ্ঠ', labelEn: 'Class 6' },
  { value: '7th', labelBn: '৭ম', labelEn: 'Class 7' },
  { value: '8th', labelBn: '৮ম', labelEn: 'Class 8' },
  { value: '9th', labelBn: '৯ম', labelEn: 'Class 9' },
  { value: '10th', labelBn: '১০ম', labelEn: 'Class 10' },
];

const CLASS_FULL_LABEL: Record<string, { bn: string; en: string }> = {
  '6th': { bn: '৬ষ্ঠ শ্রেণি', en: 'Class 6' },
  '7th': { bn: '৭ম শ্রেণি', en: 'Class 7' },
  '8th': { bn: '৮ম শ্রেণি', en: 'Class 8' },
  '9th': { bn: '৯ম শ্রেণি', en: 'Class 9' },
  '10th': { bn: '১০ম শ্রেণি', en: 'Class 10' },
};

export default function AdmissionPage() {
  const router = useRouter();
  const [lang, setLang] = useState<AppLanguage>('bn');
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [showClassSelection, setShowClassSelection] = useState<boolean>(true);
  const [showSectionSelection, setShowSectionSelection] = useState<boolean>(true);
  const [showRollInput, setShowRollInput] = useState<boolean>(true);

  // View & Print States
  const [activeTab, setActiveTab] = useState<DashboardAdmissionTab>('form');
  const [printableBlankModal, setPrintableBlankModal] = useState(false);
  const [previewApplication, setPreviewApplication] = useState<OnlineApplicationRecord | null>(null);
  const [previewQrUrl, setPreviewQrUrl] = useState<string>('');

  // Online Applications List State
  const [onlineApps, setOnlineApps] = useState<OnlineApplicationRecord[]>([]);
  const [appGradeFilter, setAppGradeFilter] = useState<string>('all');
  const [appGroupFilter, setAppGroupFilter] = useState<string>('all');
  const [appSearchQuery, setAppSearchQuery] = useState<string>('');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [fullNameEn, setFullNameEn] = useState('');
  const [selectedClass, setSelectedClass] = useState('6th');
  const [roll, setRoll] = useState('');
  const [section, setSection] = useState('A');
  const [group, setGroup] = useState<'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা'>('সাধারণ');
  const [optionalSubjectOptions, setOptionalSubjectOptions] = useState<
    { code: string; name: string; category: string }[]
  >([]);
  const [optionalSubject, setOptionalSubject] = useState<string>('কৃষি শিক্ষা');

  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'পুরুষ' | 'নারী' | 'অন্যান্য'>('পুরুষ');
  const [religion, setReligion] = useState<'ইসলাম' | 'হিন্দু' | 'খ্রিস্টান' | 'বৌদ্ধ' | 'অন্যান্য'>('ইসলাম');
  const [bloodGroup, setBloodGroup] = useState<string>('A+');
  const [birthRegNo, setBirthRegNo] = useState('');
  const [photo, setPhoto] = useState<string>('');
  const [isStipend, setIsStipend] = useState<boolean>(false);
  const [stipendCategory, setStipendCategory] = useState<string>('সাধারণ উপবৃত্তি');

  const [prevSchoolName, setPrevSchoolName] = useState('');
  const [prevGpa, setPrevGpa] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [fatherNid, setFatherNid] = useState('');
  const [fatherOcc, setFatherOcc] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherNid, setMotherNid] = useState('');
  const [motherOcc, setMotherOcc] = useState('');

  const [currentAddress, setCurrentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [isSameAddress, setIsSameAddress] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);
  const [admittedStudent, setAdmittedStudent] = useState<AdmissionFormData | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const isBn = lang === 'bn';

  const loadOnlineApps = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('sms_online_applications');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setOnlineApps(parsed);
          return;
        }
      }
      setOnlineApps([]);
    } catch {
      setOnlineApps([]);
    }
  }, []);

  useEffect(() => {
    const sess = teacherAuthService.getSession();
    if (sess && sess.role === 'teacher') {
      router.replace('/dashboard/teacher-portal');
      return;
    }

    const current = settingsService.getSettings();
    setSchoolSettings(current);
    const initialLang = languageService.getLanguage() || (current.language as AppLanguage) || 'bn';
    setLang(initialLang);
    setShowClassSelection(current.showClassSelection);
    setShowSectionSelection(current.showSectionSelection);
    setShowRollInput(current.showRollInput);
    loadOnlineApps();

    const unsubSettings = settingsService.subscribe((s) => {
      setSchoolSettings(s);
      if (s.language) setLang(s.language as AppLanguage);
      setShowClassSelection(s.showClassSelection);
      setShowSectionSelection(s.showSectionSelection);
      setShowRollInput(s.showRollInput);
    });

    const unsubLang = languageService.subscribe((l) => {
      setLang(l);
    });

    const handleOpenBlankModal = () => {
      setPrintableBlankModal(true);
    };
    const handleStorage = (ev: StorageEvent) => {
      if (!ev.key || ev.key === 'sms_online_applications') {
        loadOnlineApps();
      }
    };

    window.addEventListener('open_blank_admission_modal', handleOpenBlankModal);
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubSettings();
      unsubLang();
      window.removeEventListener('open_blank_admission_modal', handleOpenBlankModal);
      window.removeEventListener('storage', handleStorage);
    };
  }, [router, loadOnlineApps]);

  useEffect(() => {
    if (admittedStudent && admittedStudent.appId) {
      QRCode.toDataURL(admittedStudent.appId, { margin: 1, width: 120 })
        .then((url) => setQrCodeUrl(url))
        .catch(() => {});
    }
  }, [admittedStudent]);

  useEffect(() => {
    if (previewApplication) {
      const qrKey = previewApplication.appId || previewApplication.id || previewApplication.name;
      QRCode.toDataURL(qrKey, { margin: 1, width: 120 })
        .then((url) => setPreviewQrUrl(url))
        .catch(() => {});
    } else {
      setPreviewQrUrl('');
    }
  }, [previewApplication]);

  useEffect(() => {
    if (selectedClass === '6th' || selectedClass === '7th' || selectedClass === '8th') {
      setGroup('সাধারণ');
    }
  }, [selectedClass]);

  // Dynamically load optional subjects from Curriculum
  useEffect(() => {
    const updateOptions = () => {
      const opts = curriculumService.getOptionalSubjects(selectedClass, group);
      setOptionalSubjectOptions(opts);
      if (opts.length > 0) {
        setOptionalSubject((prev) => {
          const matched = opts.find(
            (o) => o.name === prev || prev.includes(o.name) || o.name.includes(prev)
          );
          return matched ? matched.name : opts[0].name;
        });
      }
    };

    updateOptions();
    const unsub = curriculumService.subscribe(updateOptions);
    return () => unsub();
  }, [selectedClass, group]);

  useEffect(() => {
    if (isSameAddress) setPermanentAddress(currentAddress);
  }, [currentAddress, isSameAddress]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast(isBn ? 'ছবির সাইজ সর্বোচ্চ ৫MB হতে পারবে।' : 'Photo size cannot exceed 5MB.', 'warning');
        return;
      }
      const compressed = await autoCropAndCompressStudentPhoto(file, 300, 360, 0.85);
      setPhoto(compressed);
    }
  };

  const handlePrintForm = (docTitleParts: Array<string | undefined>) => {
    triggerProfessionalPrint([
      schoolSettings?.schoolName || 'SchoolPro',
      'Admission_Form',
      ...docTitleParts,
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      showToast(isBn ? 'শিক্ষার্থীর নাম অবশ্যই দিতে হবে!' : 'Student name is required!', 'warning');
      return;
    }
    const cleanPhone = normalizeNumericField(mobile);
    if (!cleanPhone || cleanPhone.length < 11) {
      showToast(
        isBn
          ? 'অভিভাবকের সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন!'
          : 'Please enter a valid 11-digit guardian mobile number!',
        'warning'
      );
      return;
    }

    const studentData = {
      name: fullName.trim(),
      nameEn: fullNameEn.trim() || undefined,
      grade: selectedClass,
      section,
      branch: section,
      roll: normalizeNumericField(roll) || '01',
      group,
      optionalSubject: group === 'বিজ্ঞান' ? 'উচ্চতর গণিত' : optionalSubject,
      dob,
      gender,
      religion,
      bloodGroup,
      fatherName: fatherName.trim(),
      fatherNid: fatherNid.trim(),
      fatherOccupation: fatherOcc.trim(),
      motherName: motherName.trim(),
      motherNid: motherNid.trim(),
      motherOccupation: motherOcc.trim(),
      guardian: fatherName.trim() || motherName.trim() || 'অভিভাবক',
      mobile: cleanPhone,
      birthRegNo: normalizeNumericField(birthRegNo) || birthRegNo.trim(),
      currentAddress: currentAddress.trim(),
      permanentAddress: (isSameAddress ? currentAddress : permanentAddress).trim(),
      prevSchoolName: prevSchoolName.trim(),
      prevGpa: prevGpa.trim(),
      remarks: prevSchoolName.trim()
        ? `পূর্বতন প্রতিষ্ঠান: ${prevSchoolName.trim()} (GPA: ${prevGpa.trim() || 'N/A'})`
        : '',
      photo,
      isStipend,
      stipendCategory: isStipend ? stipendCategory : undefined,
    };

    const admitted = studentService.addStudent(studentData);
    setAdmittedStudent({
      ...studentData,
      ...admitted,
      appId: admitted.id,
      nameEn: fullNameEn.trim(),
      fatherOccupation: fatherOcc.trim(),
      motherOccupation: motherOcc.trim(),
    });

    auditTrailService.addLog({
      action: 'Student Admitted',
      category: 'student',
      details: `${fullName.trim()} (${selectedClass}, ${gender}, ${religion}) নতুন ভর্তি সম্পন্ন হয়েছে।`,
      performedBy: 'Admin',
      status: 'success',
    });

    // 📱 Automated Admission Confirmation SMS
    if (studentData.mobile) {
      smsService
        .sendAdmissionConfirmationSMS({
          name: studentData.name,
          appId: admitted.id,
          grade: studentData.grade,
          mobile: studentData.mobile,
          schoolName: schoolSettings?.schoolName,
        })
        .catch(console.error);
    }

    showToast(
      isBn ? `${fullName.trim()}-এর ভর্তি সফলভাবে সংরক্ষিত হয়েছে।` : `${fullName.trim()} admitted successfully.`,
      'success'
    );
    setIsSuccess(true);
  };

  const handleReset = () => {
    setFullName('');
    setFullNameEn('');
    setRoll('');
    setSection('A');
    setGroup('সাধারণ');
    setOptionalSubject('কৃষি শিক্ষা');
    setMobile('');
    setDob('');
    setGender('পুরুষ');
    setReligion('ইসলাম');
    setBloodGroup('A+');
    setBirthRegNo('');
    setPhoto('');
    setIsStipend(false);
    setStipendCategory('সাধারণ উপবৃত্তি');
    setPrevSchoolName('');
    setPrevGpa('');
    setFatherName('');
    setFatherNid('');
    setFatherOcc('');
    setMotherName('');
    setMotherNid('');
    setMotherOcc('');
    setCurrentAddress('');
    setPermanentAddress('');
    setIsSameAddress(false);
    setIsSuccess(false);
    setAdmittedStudent(null);
  };

  const stepStatus = useMemo(
    () =>
      computeAdmissionStepCompletion({
        selectedClass,
        section,
        fullName,
        mobile,
        dob,
        birthRegNo,
        fatherName,
        motherName,
        currentAddress,
      }),
    [selectedClass, section, fullName, mobile, dob, birthRegNo, fatherName, motherName, currentAddress]
  );

  const filteredOnlineApps = useMemo(
    () =>
      filterOnlineApplications(onlineApps, {
        grade: appGradeFilter,
        group: appGroupFilter,
        query: appSearchQuery,
      }),
    [onlineApps, appGradeFilter, appGroupFilter, appSearchQuery]
  );

  const isGroupDisabled = selectedClass === '6th' || selectedClass === '7th' || selectedClass === '8th';
  const isOptionalDisabled = group === 'মানবিক' || group === 'ব্যবসায় শিক্ষা';
  const birthRegDigits = normalizeNumericField(birthRegNo).length;

  const inputClass =
    'w-full h-10 px-3.5 bg-slate-50/70 dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#0B5D3B] focus:ring-2 focus:ring-emerald-600/15 rounded-xl text-[13px] font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition';
  const selectClass = `${inputClass} cursor-pointer`;
  const disabledClass =
    'w-full h-10 px-3.5 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 rounded-xl text-[13px] font-semibold text-slate-400 cursor-not-allowed outline-none';
  const labelClass = 'block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5';

  const scrollToStep = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const isOverlayOpen = printableBlankModal || (isSuccess && Boolean(admittedStudent)) || Boolean(previewApplication);

  return (
    <div className="pb-12 print:pb-0 print:p-0 print:m-0">
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 📌 FLUSH STICKY SUB-HEADER & FILTER / STEP BAR (0px GAP)          */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {!isOverlayOpen && (
        <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)] dark:shadow-none print:hidden">
          {/* Row 1: Mode Switcher + Class Quick Pills + Institutional Actions */}
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
            {/* Left: Tabs + Class Pills */}
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              {/* View Switcher */}
              <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className={`h-7 px-3 rounded-lg text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'form'
                      ? 'bg-[#0B5D3B] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserPlus size={13} />
                  <span>{isBn ? 'নতুন ভর্তি ফরম' : 'Admission Form'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loadOnlineApps();
                    setActiveTab('applications');
                  }}
                  className={`h-7 px-3 rounded-lg text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'applications'
                      ? 'bg-[#0B5D3B] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Inbox size={13} />
                  <span>{isBn ? 'অনলাইন আবেদন' : 'Online Apps'}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      activeTab === 'applications'
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-[#0B5D3B] dark:text-emerald-300'
                    }`}
                  >
                    {isBn ? toBanglaDigits(onlineApps.length) : onlineApps.length}
                  </span>
                </button>
              </div>

              <span className="hidden md:block h-5 w-px bg-slate-200 dark:bg-slate-700" />

              {/* Compact Class Quick-Select / Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-full">
                {activeTab === 'applications' && (
                  <button
                    type="button"
                    onClick={() => setAppGradeFilter('all')}
                    className={`h-7 px-2.5 rounded-lg text-xs font-bold border transition cursor-pointer whitespace-nowrap ${
                      appGradeFilter === 'all'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isBn ? 'সকল শ্রেণি' : 'All'}
                  </button>
                )}
                {CLASS_PILLS.map((cls) => {
                  const isActive =
                    activeTab === 'form'
                      ? selectedClass === cls.value
                      : appGradeFilter === cls.value;
                  return (
                    <button
                      key={cls.value}
                      type="button"
                      onClick={() => {
                        if (activeTab === 'form') {
                          setSelectedClass(cls.value);
                        } else {
                          setAppGradeFilter(cls.value);
                        }
                      }}
                      className={`h-7 px-2.5 rounded-lg text-xs font-bold border transition cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isBn ? cls.labelBn : cls.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Clean Compact Action Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setPrintableBlankModal(true)}
                className="h-8 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer size={13} />
                <span>{isBn ? 'ফাঁকা ফরম প্রিন্ট' : 'Blank Form'}</span>
              </button>

              <Link
                href="/dashboard/students/bulk-import"
                className="h-8 px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition"
              >
                <FileSpreadsheet size={13} className="text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">{isBn ? 'বাল্ক ইম্পোর্ট' : 'Bulk Import'}</span>
              </Link>

              <a
                href="/admission"
                target="_blank"
                rel="noreferrer"
                className="h-8 px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition"
              >
                <Globe size={13} className="text-[#0B5D3B] dark:text-emerald-400" />
                <span className="hidden md:inline">{isBn ? 'পাবলিক ফরম ↗' : 'Public Form ↗'}</span>
              </a>

              <Link
                href="/dashboard/students"
                className="h-8 px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition"
              >
                <Users size={13} className="text-slate-500 dark:text-slate-400" />
                <span className="hidden xl:inline">{isBn ? 'শিক্ষার্থী তালিকা' : 'Students'}</span>
              </Link>
            </div>
          </div>

          {/* Row 2: Contextual Compact Strip (Form 4-Step Nav OR Applications Filter Bar) */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2.5">
              {activeTab === 'form' ? (
                <>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                    {[
                      {
                        id: 'admission-step-1',
                        num: isBn ? '১' : '1',
                        label: isBn ? 'একাডেমিক তথ্য' : 'Academic',
                        done: stepStatus.step1Academic,
                      },
                      {
                        id: 'admission-step-2',
                        num: isBn ? '২' : '2',
                        label: isBn ? 'ব্যক্তিগত বিবরণী ও ছবি' : 'Personal & Photo',
                        done: stepStatus.step2Personal,
                      },
                      {
                        id: 'admission-step-3',
                        num: isBn ? '৩' : '3',
                        label: isBn ? 'পিতা ও মাতার তথ্য' : 'Parents',
                        done: stepStatus.step3Parents,
                      },
                      {
                        id: 'admission-step-4',
                        num: isBn ? '৪' : '4',
                        label: isBn ? 'পূর্ববর্তী স্কুল ও ঠিকানা' : 'School & Address',
                        done: stepStatus.step4Address,
                      },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => scrollToStep(s.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                          s.done
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {s.done ? (
                          <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black inline-flex items-center justify-center">
                            {s.num}
                          </span>
                        )}
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>
                      {isBn
                        ? `সেশন ২০২৬ • ${toBanglaDigits(stepStatus.completedCount)}/৪ ধাপ প্রস্তুত`
                        : `Session 2026 • ${stepStatus.completedCount}/4 sections ready`}
                    </span>
                  </div>
                </>
              ) : (
                /* Applications Filter Bar */
                <div className="w-full flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
                    <div className="relative flex-1 max-w-sm">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="text"
                        value={appSearchQuery}
                        onChange={(e) => setAppSearchQuery(e.target.value)}
                        placeholder={
                          isBn
                            ? 'নাম, আবেদন আইডি, মোবাইল বা জন্ম নিবন্ধন খুঁজুন...'
                            : 'Search by name, App ID, mobile...'
                        }
                        className="w-full h-8 pl-8 pr-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#0B5D3B] outline-none"
                      />
                    </div>

                    <select
                      value={appGroupFilter}
                      onChange={(e) => setAppGroupFilter(e.target.value)}
                      className="h-8 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="all">{isBn ? 'সকল বিভাগ' : 'All Groups'}</option>
                      <option value="সাধারণ">{isBn ? 'সাধারণ' : 'General'}</option>
                      <option value="বিজ্ঞান">{isBn ? 'বিজ্ঞান' : 'Science'}</option>
                      <option value="মানবিক">{isBn ? 'মানবিক' : 'Humanities'}</option>
                      <option value="ব্যবসায় শিক্ষা">{isBn ? 'ব্যবসায় শিক্ষা' : 'Business Studies'}</option>
                    </select>

                    {(appGradeFilter !== 'all' || appGroupFilter !== 'all' || appSearchQuery) && (
                      <button
                        type="button"
                        onClick={() => {
                          setAppGradeFilter('all');
                          setAppGroupFilter('all');
                          setAppSearchQuery('');
                        }}
                        className="h-8 px-2.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        {isBn ? 'ফিল্টার মুছুন' : 'Clear'}
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {isBn
                      ? `প্রদর্শিত: ${toBanglaDigits(filteredOnlineApps.length)} / ${toBanglaDigits(onlineApps.length)} টি আবেদন`
                      : `Showing ${filteredOnlineApps.length} of ${onlineApps.length} applications`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 🖨️ VIEW 1: PRINTABLE OFFICIAL BLANK ADMISSION FORM (A4 LAYOUT)    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {printableBlankModal ? (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[96vh] overflow-y-auto print:max-h-none print:shadow-none print:w-full print:rounded-none p-4 sm:p-6 print:p-0">
            <OfficialAdmissionForm
              isBlank={true}
              settings={schoolSettings}
              onPrint={() => handlePrintForm(['Blank_Form'])}
              onClose={() => setPrintableBlankModal(false)}
            />
          </div>
        </div>
      ) : previewApplication ? (
        /* ═════════════════════════════════════════════════════════════════ */
        /* 🖨️ VIEW 2: ONLINE APPLICATION OFFICIAL A4 PRINT PREVIEW           */
        /* ═════════════════════════════════════════════════════════════════ */
        <div className="max-w-4xl mx-auto px-4 pt-6 print:p-0 print:m-0 print:max-w-none">
          <OfficialAdmissionForm
            data={{
              ...previewApplication,
              fatherOccupation: previewApplication.fatherOccupation || previewApplication.fatherOcc,
              motherOccupation: previewApplication.motherOccupation || previewApplication.motherOcc,
              appId: previewApplication.appId || previewApplication.id,
              qrCodeUrl: previewQrUrl,
            }}
            settings={schoolSettings}
            onPrint={() =>
              handlePrintForm([
                previewApplication.grade,
                previewApplication.appId || previewApplication.id,
                previewApplication.name,
              ])
            }
            onClose={() => setPreviewApplication(null)}
          />
        </div>
      ) : isSuccess && admittedStudent ? (
        /* ═════════════════════════════════════════════════════════════════ */
        /* ✅ VIEW 3: OFFICIAL ADMISSION SLIP ON SUCCESS                     */
        /* ═════════════════════════════════════════════════════════════════ */
        <div className="max-w-4xl mx-auto px-4 pt-6 space-y-4 print:p-0 print:m-0 print:max-w-none print:space-y-0">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/70 text-[#0B5D3B] dark:text-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-emerald-950 dark:text-emerald-100">
                  {isBn
                    ? 'শিক্ষার্থীর ভর্তি সফলভাবে সম্পন্ন হয়েছে!'
                    : 'Student Admission Completed Successfully!'}
                </h2>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                  {admittedStudent.name} • {isBn ? 'আইডি:' : 'ID:'}{' '}
                  <span className="font-mono font-bold">{admittedStudent.appId}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <UserPlus size={14} />
                <span>{isBn ? 'নতুন শিক্ষার্থী ভর্তি' : 'Admit Another'}</span>
              </button>
              <Link
                href="/dashboard/students"
                className="px-3.5 py-2 rounded-xl bg-[#0B5D3B] hover:bg-emerald-800 text-white text-xs font-bold transition inline-flex items-center gap-1.5"
              >
                <Users size={14} />
                <span>{isBn ? 'শিক্ষার্থী তালিকা' : 'View Directory'}</span>
              </Link>
            </div>
          </div>

          <OfficialAdmissionForm
            data={{
              ...admittedStudent,
              qrCodeUrl,
            }}
            settings={schoolSettings}
            onPrint={() =>
              handlePrintForm([
                admittedStudent.grade,
                admittedStudent.roll,
                admittedStudent.name,
              ])
            }
            onClose={handleReset}
          />
        </div>
      ) : activeTab === 'applications' ? (
        /* ═════════════════════════════════════════════════════════════════ */
        /* 📥 VIEW 4: ONLINE APPLICATIONS REGISTRY TABLE                     */
        /* ═════════════════════════════════════════════════════════════════ */
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            {filteredOnlineApps.length === 0 ? (
              <div className="py-16 px-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Inbox size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">
                    {onlineApps.length === 0
                      ? isBn
                        ? 'এখনো কোনো অনলাইন ভর্তি আবেদন জমা পড়েনি'
                        : 'No online admission applications yet'
                      : isBn
                      ? 'ফিল্টারের সাথে কোনো আবেদন মেলেনি'
                      : 'No applications match the active filters'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    {isBn
                      ? 'পাবলিক অনলাইন ভর্তি ফরম (/admission) থেকে কোনো শিক্ষার্থী আবেদন করলে তা এখানে স্বয়ংক্রিয়ভাবে তালিকাবদ্ধ হবে।'
                      : 'Applications submitted through the public /admission portal will appear here automatically.'}
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <a
                    href="/admission"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
                  >
                    <Globe size={14} />
                    <span>{isBn ? 'পাবলিক ভর্তি পোর্টাল দেখুন ↗' : 'Open Public Form ↗'}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setActiveTab('form')}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                  >
                    {isBn ? 'অফিস থেকে ভর্তি ফরম পূরণ করুন' : 'Fill Admin Admission Form'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-[13px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                      <th className="py-3 px-4 text-left font-bold">{isBn ? 'আবেদনকারী শিক্ষার্থী' : 'Applicant'}</th>
                      <th className="py-3 px-4 text-left font-bold">{isBn ? 'আবেদন আইডি' : 'App ID'}</th>
                      <th className="py-3 px-4 text-left font-bold">{isBn ? 'শ্রেণি ও বিভাগ' : 'Class & Group'}</th>
                      <th className="py-3 px-4 text-left font-bold">{isBn ? 'অভিভাবক ও মোবাইল' : 'Guardian & Mobile'}</th>
                      <th className="py-3 px-4 text-left font-bold">{isBn ? 'তারিখ' : 'Submitted'}</th>
                      <th className="py-3 px-4 text-right font-bold">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredOnlineApps.map((app, idx) => {
                      const clsObj = CLASS_FULL_LABEL[app.grade];
                      const clsText = clsObj ? (isBn ? clsObj.bn : clsObj.en) : app.grade;
                      const appliedDate = app.appliedAt
                        ? new Date(app.appliedAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-GB')
                        : '—';
                      return (
                        <tr
                          key={app.appId || app.id || `${app.name}-${idx}`}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {app.photo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={app.photo}
                                  alt={app.name}
                                  className="w-9 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                                  <User size={16} />
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{app.name}</p>
                                {app.nameEn && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{app.nameEn}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs font-bold text-[#0B5D3B] dark:text-emerald-400">
                            {app.appId || app.id || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{clsText}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {isBn ? `শাখা ${app.section || 'A'}` : `Sec ${app.section || 'A'}`} •{' '}
                              {app.group || 'সাধারণ'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              {app.fatherName || app.guardian || '—'}
                            </p>
                            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {app.mobile || '—'}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                            {appliedDate}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setPreviewApplication(app)}
                              className="h-8 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Eye size={13} />
                              <span>{isBn ? 'A4 ফরম / প্রিন্ট' : 'A4 Form'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ═════════════════════════════════════════════════════════════════ */
        /* 📝 VIEW 5: CLEAN INSTITUTIONAL 4-SECTION ADMISSION FORM           */
        /* ═════════════════════════════════════════════════════════════════ */
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 print:hidden">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── SECTION 1: ACADEMIC SELECTION ── */}
            <section
              id="admission-step-1"
              className="scroll-mt-28 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black text-xs">
                    {isBn ? '১' : '1'}
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-[15px] font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <BookOpen size={15} className="text-[#0B5D3B] dark:text-emerald-400" />
                      <span>{isBn ? 'একাডেমিক ও শ্রেণি নির্বাচন' : 'Academic & Class Selection'}</span>
                    </h2>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  {isBn ? 'লাল (*) চিহ্নিত ঘর আবশ্যক' : 'Fields marked * are required'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {showClassSelection && (
                  <div>
                    <label className={labelClass}>
                      {isBn ? 'ভর্তির শ্রেণি' : 'Class'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className={selectClass}
                    >
                      <option value="6th">{isBn ? '৬ষ্ঠ শ্রেণি (Class 6)' : 'Class 6'}</option>
                      <option value="7th">{isBn ? '৭ম শ্রেণি (Class 7)' : 'Class 7'}</option>
                      <option value="8th">{isBn ? '৮ম শ্রেণি (Class 8)' : 'Class 8'}</option>
                      <option value="9th">{isBn ? '৯ম শ্রেণি (Class 9)' : 'Class 9'}</option>
                      <option value="10th">{isBn ? '১০ম শ্রেণি (Class 10)' : 'Class 10'}</option>
                    </select>
                  </div>
                )}

                {showRollInput && (
                  <div>
                    <label className={labelClass}>
                      {isBn ? 'শ্রেণি রোল নম্বর' : 'Class Roll'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={roll}
                      onChange={(e) => setRoll(e.target.value)}
                      placeholder={isBn ? 'যেমন: ০১ বা 01' : 'e.g. 01'}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                )}

                {showSectionSelection && (
                  <div>
                    <label className={labelClass}>
                      {isBn ? 'নির্ধারিত শাখা' : 'Section'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className={selectClass}
                    >
                      <option value="A">{isBn ? 'শাখা ক (Section A)' : 'Section A'}</option>
                      <option value="B">{isBn ? 'শাখা খ (Section B)' : 'Section B'}</option>
                      <option value="C">{isBn ? 'শাখা গ (Section C)' : 'Section C'}</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className={labelClass}>
                    {isBn ? 'বিভাগ (৯ম-১০ম)' : 'Group (9-10)'}
                  </label>
                  <select
                    value={group}
                    onChange={(e) =>
                      setGroup(e.target.value as 'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা')
                    }
                    disabled={isGroupDisabled}
                    className={isGroupDisabled ? disabledClass : selectClass}
                  >
                    <option value="সাধারণ">{isBn ? 'সাধারণ' : 'General'}</option>
                    <option value="বিজ্ঞান">{isBn ? 'বিজ্ঞান (Science)' : 'Science'}</option>
                    <option value="মানবিক">{isBn ? 'মানবিক (Humanities)' : 'Humanities'}</option>
                    <option value="ব্যবসায় শিক্ষা">
                      {isBn ? 'ব্যবসায় শিক্ষা (Business)' : 'Business Studies'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    {isBn ? 'ঐচ্ছিক / ৪র্থ বিষয়' : 'Optional Subject'}
                  </label>
                  <select
                    value={optionalSubject}
                    onChange={(e) => setOptionalSubject(e.target.value)}
                    disabled={isOptionalDisabled}
                    className={isOptionalDisabled ? disabledClass : selectClass}
                  >
                    {optionalSubjectOptions.map((opt) => (
                      <option key={opt.code || opt.name} value={opt.name}>
                        {opt.name} {opt.category && opt.name !== 'কোনটিই নয়' ? `(${opt.category})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subtle Stipend Checkbox Row */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isStipend}
                    onChange={(e) => setIsStipend(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#0B5D3B] cursor-pointer"
                  />
                  <Award size={15} className="text-amber-600 dark:text-amber-400" />
                  <span>{isBn ? 'শিক্ষার্থী উপবৃত্তি সুবিধাভোগী (Stipend)' : 'Stipend Beneficiary'}</span>
                </label>

                {isStipend && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      {isBn ? 'ক্যাটাগরি:' : 'Category:'}
                    </span>
                    <select
                      value={stipendCategory}
                      onChange={(e) => setStipendCategory(e.target.value)}
                      className="h-8 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
                    >
                      <option value="সাধারণ উপবৃত্তি">সাধারণ উপবৃত্তি</option>
                      <option value="মেধাভিত্তিক উপবৃত্তি">মেধাভিত্তিক উপবৃত্তি</option>
                      <option value="বিশেষ সহায়তা">বিশেষ সহায়তা</option>
                    </select>
                  </div>
                )}
              </div>
            </section>

            {/* ── SECTION 2: PERSONAL PROFILE & PASSPORT PHOTO ── */}
            <section
              id="admission-step-2"
              className="scroll-mt-28 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black text-xs">
                    {isBn ? '২' : '2'}
                  </span>
                  <h2 className="text-sm sm:text-[15px] font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <User size={15} className="text-[#0B5D3B] dark:text-emerald-400" />
                    <span>{isBn ? 'শিক্ষার্থীর ব্যক্তিগত বিবরণী ও পাসপোর্ট ছবি' : 'Student Profile & Photo'}</span>
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B5D3B] dark:text-emerald-400">
                  <Send size={12} />
                  <span>{isBn ? 'স্বয়ংক্রিয় ভর্তি SMS সক্রিয়' : 'Auto SMS Active'}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left: Form Inputs */}
                <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>
                      {isBn ? 'শিক্ষার্থীর পূর্ণ নাম (বাংলায়)' : 'Student Full Name (Bangla)'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isBn ? 'যেমন: মোঃ আরমান হোসেন' : 'Full Name in Bangla'}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      <span className="inline-flex items-center gap-1">
                        <Phone size={12} className="text-[#0B5D3B] dark:text-emerald-400" />
                        {isBn ? 'অভিভাবকের মোবাইল' : 'Guardian Mobile'}
                        <span className="text-rose-500">*</span>
                      </span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="01812345678"
                      className={`${inputClass} font-mono`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>
                      {isBn ? 'শিক্ষার্থীর নাম (ইংরেজিতে ক্যাপিটাল অক্ষরে)' : 'Full Name (English Block Letters)'}
                    </label>
                    <input
                      type="text"
                      value={fullNameEn}
                      onChange={(e) => setFullNameEn(e.target.value.toUpperCase())}
                      placeholder="MD. ARMAN HOSSAIN"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} className="text-[#0B5D3B] dark:text-emerald-400" />
                        {isBn ? 'জন্ম তারিখ' : 'Date of Birth'}
                        <span className="text-rose-500">*</span>
                      </span>
                    </label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isBn ? '১৭ ডিজিটের ডিজিটাল জন্ম নিবন্ধন নম্বর' : '17-Digit Birth Registration No.'}{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <span
                        className={`text-[11px] font-mono font-bold ${
                          birthRegDigits >= 17
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {isBn ? `${toBanglaDigits(birthRegDigits)}/১৭` : `${birthRegDigits}/17`}
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={birthRegNo}
                      onChange={(e) => setBirthRegNo(e.target.value)}
                      placeholder={isBn ? 'যেমন: ২০১০১৫১২৩৪৫৬৭৮৯০১' : 'e.g. 20101512345678901'}
                      className={`${inputClass} font-mono`}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      {isBn ? 'লিঙ্গ' : 'Gender'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'পুরুষ' | 'নারী' | 'অন্যান্য')}
                      className={selectClass}
                    >
                      <option value="পুরুষ">{isBn ? 'পুরুষ (ছাত্র)' : 'Male'}</option>
                      <option value="নারী">{isBn ? 'নারী (ছাত্রী)' : 'Female'}</option>
                      <option value="অন্যান্য">{isBn ? 'অন্যান্য' : 'Other'}</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>
                      {isBn ? 'ধর্ম' : 'Religion'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={religion}
                      onChange={(e) =>
                        setReligion(
                          e.target.value as 'ইসলাম' | 'হিন্দু' | 'খ্রিস্টান' | 'বৌদ্ধ' | 'অন্যান্য'
                        )
                      }
                      className={selectClass}
                    >
                      <option value="ইসলাম">{isBn ? 'ইসলাম' : 'Islam'}</option>
                      <option value="হিন্দু">{isBn ? 'হিন্দু' : 'Hinduism'}</option>
                      <option value="খ্রিস্টান">{isBn ? 'খ্রিস্টান' : 'Christianity'}</option>
                      <option value="বৌদ্ধ">{isBn ? 'বৌদ্ধ' : 'Buddhism'}</option>
                      <option value="অন্যান্য">{isBn ? 'অন্যান্য' : 'Other'}</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>
                      <span className="inline-flex items-center gap-1">
                        <Droplet size={12} className="text-rose-500" />
                        {isBn ? 'রক্তের গ্রুপ' : 'Blood Group'}
                      </span>
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className={selectClass}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                {/* Right: Clean Passport Photo Card */}
                <div className="lg:col-span-3 flex flex-col items-center p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {isBn ? 'পাসপোর্ট সাইজ ছবি' : 'Passport Photo'}
                  </span>
                  <div className="relative w-32 h-40 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#0B5D3B] bg-white dark:bg-slate-900 flex flex-col items-center justify-center overflow-hidden group transition cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <Camera
                          size={26}
                          className="mx-auto text-slate-400 group-hover:text-[#0B5D3B] transition"
                        />
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mt-1.5">
                          {isBn ? 'ছবি আপলোড করুন' : 'Upload Photo'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {isBn ? 'অটো-ক্রপ • সর্বোচ্চ ৫MB' : 'Auto-crop • Max 5MB'}
                        </span>
                      </div>
                    )}
                  </div>
                  {photo ? (
                    <button
                      type="button"
                      onClick={() => setPhoto('')}
                      className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <X size={12} />
                      <span>{isBn ? 'ছবি সরান' : 'Remove Photo'}</span>
                    </button>
                  ) : (
                    <p className="text-[10px] text-center text-slate-500 dark:text-slate-400">
                      {isBn ? 'স্বয়ংক্রিয়ভাবে পাসপোর্ট অনুপাতে ক্রপ হবে' : 'Auto-cropped to passport ratio'}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* ── SECTION 3: PARENTS INFORMATION ── */}
            <section
              id="admission-step-3"
              className="scroll-mt-28 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black text-xs">
                  {isBn ? '৩' : '3'}
                </span>
                <h2 className="text-sm sm:text-[15px] font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Users size={15} className="text-[#0B5D3B] dark:text-emerald-400" />
                  <span>{isBn ? 'পিতা ও মাতার বিবরণী' : 'Parents Information'}</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Father */}
                <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-200/70 dark:border-slate-800">
                    <ShieldCheck size={14} className="text-[#0B5D3B] dark:text-emerald-400" />
                    <span>{isBn ? 'পিতার তথ্য' : 'Father Information'}</span>
                  </div>
                  <div>
                    <label className={labelClass}>
                      {isBn ? 'পিতার পূর্ণ নাম' : "Father's Name"} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder={isBn ? 'পিতার নাম লিখুন' : "Enter father's name"}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>{isBn ? 'পিতার এনআইডি' : "Father's NID"}</label>
                      <input
                        type="text"
                        value={fatherNid}
                        onChange={(e) => setFatherNid(e.target.value)}
                        placeholder={isBn ? 'জাতীয় পরিচয়পত্র নং' : 'NID Number'}
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{isBn ? 'পিতার পেশা' : 'Occupation'}</label>
                      <input
                        type="text"
                        value={fatherOcc}
                        onChange={(e) => setFatherOcc(e.target.value)}
                        placeholder={isBn ? 'যেমন: ব্যবসায়ী / শিক্ষক' : 'e.g. Teacher / Business'}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Mother */}
                <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-200/70 dark:border-slate-800">
                    <ShieldCheck size={14} className="text-teal-600 dark:text-teal-400" />
                    <span>{isBn ? 'মাতার তথ্য' : 'Mother Information'}</span>
                  </div>
                  <div>
                    <label className={labelClass}>
                      {isBn ? 'মাতার পূর্ণ নাম' : "Mother's Name"} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      placeholder={isBn ? 'মাতার নাম লিখুন' : "Enter mother's name"}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>{isBn ? 'মাতার এনআইডি' : "Mother's NID"}</label>
                      <input
                        type="text"
                        value={motherNid}
                        onChange={(e) => setMotherNid(e.target.value)}
                        placeholder={isBn ? 'জাতীয় পরিচয়পত্র নং' : 'NID Number'}
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{isBn ? 'মাতার পেশা' : 'Occupation'}</label>
                      <input
                        type="text"
                        value={motherOcc}
                        onChange={(e) => setMotherOcc(e.target.value)}
                        placeholder={isBn ? 'যেমন: গৃহিণী / শিক্ষিকা' : 'e.g. Homemaker / Teacher'}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── SECTION 4: PREVIOUS SCHOOL & ADDRESS ── */}
            <section
              id="admission-step-4"
              className="scroll-mt-28 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black text-xs">
                    {isBn ? '৪' : '4'}
                  </span>
                  <h2 className="text-sm sm:text-[15px] font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin size={15} className="text-[#0B5D3B] dark:text-emerald-400" />
                    <span>{isBn ? 'পূর্ববর্তী বিদ্যালয় ও ঠিকানা বিবরণী' : 'Previous School & Address'}</span>
                  </h2>
                </div>

                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0B5D3B] dark:text-emerald-400 select-none">
                  <input
                    type="checkbox"
                    checked={isSameAddress}
                    onChange={(e) => setIsSameAddress(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#0B5D3B] cursor-pointer"
                  />
                  <span>{isBn ? 'বর্তমান ও স্থায়ী ঠিকানা একই' : 'Same as current address'}</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    {isBn ? 'পূর্ববর্তী বিদ্যালয়ের নাম' : 'Previous School Name'}
                  </label>
                  <input
                    type="text"
                    value={prevSchoolName}
                    onChange={(e) => setPrevSchoolName(e.target.value)}
                    placeholder={isBn ? 'পূর্বে অধ্যয়নকৃত বিদ্যালয়ের নাম' : 'Name of previous school'}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    {isBn ? 'সর্বশেষ উত্তীর্ণ ফলাফল / জিপিএ' : 'Last Exam Result / GPA'}
                  </label>
                  <input
                    type="text"
                    value={prevGpa}
                    onChange={(e) => setPrevGpa(e.target.value)}
                    placeholder={isBn ? 'যেমন: GPA 5.00 বা উত্তীর্ণ' : 'e.g. GPA 5.00'}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    {isBn ? 'বর্তমান ঠিকানা (গ্রাম/রোড, ডাকঘর, উপজেলা, জেলা)' : 'Current Address'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    placeholder={isBn ? 'গ্রাম/রোড, ডাকঘর, উপজেলা, জেলা' : 'Village/Road, PO, Upazila, District'}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    {isBn ? 'স্থায়ী ঠিকানা' : 'Permanent Address'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={!isSameAddress}
                    disabled={isSameAddress}
                    value={permanentAddress}
                    onChange={(e) => setPermanentAddress(e.target.value)}
                    placeholder={
                      isSameAddress
                        ? isBn
                          ? 'বর্তমান ঠিকানার অনুরূপ'
                          : 'Same as current address'
                        : isBn
                        ? 'গ্রাম/রোড, ডাকঘর, উপজেলা, জেলা'
                        : 'Permanent Address'
                    }
                    className={isSameAddress ? disabledClass : inputClass}
                  />
                </div>
              </div>
            </section>

            {/* ── CLEAN BOTTOM SUBMIT BAR ── */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isBn
                  ? 'ভর্তি নিশ্চিত করলে শিক্ষার্থী আইডি তৈরি হবে, অভিভাবকের মোবাইলে SMS যাবে এবং A4 ভর্তি স্লিপ পাওয়া যাবে।'
                  : 'Saving generates a Student ID, dispatches confirmation SMS, and prepares the A4 admission slip.'}
              </p>
              <div className="flex items-center gap-2.5 shrink-0 justify-end">
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>{isBn ? 'ফরম রিসেট' : 'Reset'}</span>
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 rounded-xl bg-[#0B5D3B] hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-900/15 inline-flex items-center gap-2 transition active:scale-[0.98] cursor-pointer"
                >
                  <Save size={15} />
                  <span>{isBn ? 'ভর্তি নিশ্চিত ও সংরক্ষণ করুন' : 'Confirm & Save Admission'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
