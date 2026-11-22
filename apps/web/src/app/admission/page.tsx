'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  Save,
  CheckCircle2,
  RefreshCw,
  User,
  Users,
  MapPin,
  BookOpen,
  Printer,
  GraduationCap,
  Phone,
  Award,
  X,
  Send,
  Droplet,
  Camera,
  AlertCircle,
  Calendar,
  RotateCcw,
  Home,
  ShieldCheck,
  FileBadge2,
  Lock,
} from 'lucide-react';
import QRCode from 'qrcode';
import { showToast } from '@/components/ui/ToastProvider';
import { studentService } from '@/services/studentService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { curriculumService } from '@/services/curriculumService';
import { smsService } from '@/services/smsService';
import OfficialAdmissionForm, { AdmissionFormData } from '@/components/OfficialAdmissionForm';
import { autoCropAndCompressStudentPhoto } from '@/lib/imageUtils';
import { triggerProfessionalPrint } from '@/lib/printPdfUtils';
import {
  normalizeNumericField,
  validatePublicAdmissionFields,
  computeAdmissionStepCompletion,
} from '@/lib/admissionUtils';
import { toBanglaDigits } from '@/lib/resultPortalUtils';

const CLASS_DISPLAY_MAP: Record<string, string> = {
  '6th': '৬ষ্ঠ শ্রেণি',
  '7th': '৭ম শ্রেণি',
  '8th': '৮ম শ্রেণি',
  '9th': '৯ম শ্রেণি',
  '10th': '১০ম শ্রেণি',
};

export default function PublicOnlineAdmissionPage() {
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);

  useEffect(() => {
    setSchoolSettings(settingsService.getSettings());
    const unsub = settingsService.subscribe((s) => {
      setSchoolSettings(s);
    });

    // Pull live school settings from cloud for external/mobile visitors
    import('@/services/firebaseSyncService')
      .then(({ firebaseSyncService }) =>
        firebaseSyncService.fetchLandingPageCloudData().then((data) => {
          if (data.settings) setSchoolSettings(data.settings);
        })
      )
      .catch(() => {});

    return unsub;
  }, []);

  // ── Form State ──
  const [fullName, setFullName] = useState('');
  const [fullNameEn, setFullNameEn] = useState('');
  const [selectedClass, setSelectedClass] = useState('6th');
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
  const [isStipend, setIsStipend] = useState(false);
  const [stipendCategory, setStipendCategory] = useState('সাধারণ উপবৃত্তি');

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
  const [declaredCorrect, setDeclaredCorrect] = useState<boolean>(true);

  // Post Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [applicationRecord, setApplicationRecord] = useState<AdmissionFormData | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [errorNotice, setErrorNotice] = useState<string>('');

  // Automated SMS Delivery Status
  const [smsDeliveryStatus, setSmsDeliveryStatus] = useState<{
    sent: boolean;
    recipientMobile: string;
    messageText: string;
    timestamp: string;
    isResending?: boolean;
  } | null>(null);

  // Reset group when junior secondary classes are selected
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

  useEffect(() => {
    if (applicationRecord && applicationRecord.appId) {
      QRCode.toDataURL(applicationRecord.appId, { margin: 1, width: 130 })
        .then((url) => setQrCodeUrl(url))
        .catch(() => {});
    }
  }, [applicationRecord]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('ছবির সাইজ সর্বোচ্চ ৫MB হতে পারবে।', 'warning');
        return;
      }
      const compressed = await autoCropAndCompressStudentPhoto(file, 300, 360, 0.85);
      setPhoto(compressed);
    }
  };

  // ── FINAL APPLICATION SUBMISSION & AUTOMATED SMS DISPATCH ──
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice('');

    const validation = validatePublicAdmissionFields({
      selectedClass,
      fullName,
      mobile,
      birthRegNo,
      dob,
      fatherName,
      motherName,
      currentAddress,
      declaredCorrect,
    });

    if (!validation.valid) {
      setErrorNotice(validation.errorMessage || 'অনুগ্রহ করে সকল আবশ্যক তথ্য পূরণ করুন।');
      if (validation.scrollSectionId) {
        document.getElementById(validation.scrollSectionId)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
      return;
    }

    setIsSubmitting(true);
    const cleanPhone = normalizeNumericField(mobile);
    const cleanBirthReg = normalizeNumericField(birthRegNo);
    const autoAppId = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const studentData = {
      id: autoAppId,
      appId: autoAppId,
      name: fullName.trim(),
      nameEn: fullNameEn.trim(),
      grade: selectedClass,
      section,
      branch: section,
      roll: 'অপেক্ষমাণ',
      group,
      optionalSubject: group === 'বিজ্ঞান' ? 'উচ্চতর গণিত' : optionalSubject,
      dob,
      gender,
      religion,
      bloodGroup,
      fatherName: fatherName.trim(),
      fatherNid: fatherNid.trim(),
      fatherOcc: fatherOcc.trim(),
      fatherOccupation: fatherOcc.trim(),
      motherName: motherName.trim(),
      motherNid: motherNid.trim(),
      motherOcc: motherOcc.trim(),
      motherOccupation: motherOcc.trim(),
      guardian: fatherName.trim() || motherName.trim() || 'অভিভাবক',
      mobile: cleanPhone,
      birthRegNo: cleanBirthReg,
      prevSchoolName: prevSchoolName.trim(),
      prevGpa: prevGpa.trim(),
      currentAddress: currentAddress.trim(),
      permanentAddress: (isSameAddress ? currentAddress : permanentAddress).trim(),
      photo,
      appliedAt: new Date().toISOString(),
      status: 'Admitted',
      isStipend,
      stipendCategory: isStipend ? stipendCategory : undefined,
    };

    // 1. Save to Central Student Database
    const registeredStudent = studentService.addStudent(studentData);
    setApplicationRecord({
      ...studentData,
      ...registeredStudent,
      appId: autoAppId,
      nameEn: fullNameEn.trim(),
      fatherOccupation: fatherOcc.trim(),
      motherOccupation: motherOcc.trim(),
    });

    // 2. Persist in Online Applications Registry (Local + Cloud Firestore)
    if (typeof window !== 'undefined') {
      const storedApps = localStorage.getItem('sms_online_applications');
      let appList: unknown[] = [];
      if (storedApps) {
        try {
          const parsed = JSON.parse(storedApps);
          if (Array.isArray(parsed)) appList = parsed;
        } catch {
          appList = [];
        }
      }
      appList.unshift(studentData);
      localStorage.setItem('sms_online_applications', JSON.stringify(appList));
      import('@/services/firebaseSyncService')
        .then(({ firebaseSyncService }) => {
          firebaseSyncService
            .syncOnlineApplicationToCloud({
              ...studentData,
              studentName: studentData.name,
              appliedClass: studentData.grade,
              status: 'pending',
            })
            .catch(() => {});
        })
        .catch(() => {});
    }

    // 3. 🚀 AUTOMATED CONFIRMATION SMS TRIGGER
    try {
      const currentSchoolName = schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান';
      const smsRes = await smsService.sendAdmissionConfirmationSMS({
        name: studentData.name,
        appId: autoAppId,
        grade: studentData.grade,
        mobile: studentData.mobile,
        schoolName: currentSchoolName,
      });

      setSmsDeliveryStatus({
        sent: smsRes.success,
        recipientMobile: studentData.mobile,
        messageText: smsRes.message,
        timestamp: new Date().toLocaleTimeString('bn-BD', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      });
    } catch (smsErr) {
      console.error('Failed to trigger confirmation SMS:', smsErr);
      setSmsDeliveryStatus({
        sent: false,
        recipientMobile: studentData.mobile,
        messageText: 'এসএমএস গেটওয়ে সাময়িক অফলাইনে থাকায় বার্তা পাঠানো সম্ভব হয়নি।',
        timestamp: new Date().toLocaleTimeString('bn-BD', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      });
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResendSMS = async () => {
    if (!applicationRecord || !applicationRecord.mobile) return;
    if (smsDeliveryStatus) {
      setSmsDeliveryStatus({ ...smsDeliveryStatus, isResending: true });
    }

    try {
      const currentSchoolName = schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান';
      const res = await smsService.sendAdmissionConfirmationSMS({
        name: applicationRecord.name || '',
        appId: applicationRecord.appId || '',
        grade: applicationRecord.grade || '',
        mobile: applicationRecord.mobile,
        schoolName: currentSchoolName,
      });

      setSmsDeliveryStatus({
        sent: res.success,
        recipientMobile: applicationRecord.mobile,
        messageText: res.message,
        timestamp: new Date().toLocaleTimeString('bn-BD', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        isResending: false,
      });
    } catch {
      setSmsDeliveryStatus((prev) => (prev ? { ...prev, isResending: false } : null));
    }
  };

  const handleResetForm = () => {
    setFullName('');
    setFullNameEn('');
    setSelectedClass('6th');
    setSection('A');
    setGroup('সাধারণ');
    setMobile('');
    setDob('');
    setBirthRegNo('');
    setFatherName('');
    setFatherNid('');
    setFatherOcc('');
    setMotherName('');
    setMotherNid('');
    setMotherOcc('');
    setCurrentAddress('');
    setPermanentAddress('');
    setIsSameAddress(false);
    setPhoto('');
    setPrevSchoolName('');
    setPrevGpa('');
    setIsStipend(false);
    setStipendCategory('সাধারণ উপবৃত্তি');
    setIsSubmitted(false);
    setApplicationRecord(null);
    setErrorNotice('');
    setSmsDeliveryStatus(null);
  };

  const handlePrintSlip = () => {
    triggerProfessionalPrint([
      schoolSettings?.schoolName || 'SchoolPro',
      'Online_Admission',
      applicationRecord?.appId,
      applicationRecord?.name,
    ]);
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

  const schoolName = schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান';
  const schoolAddress = schoolSettings?.address || '';
  const eiinNumber = schoolSettings?.eiin || '';
  const estdYear = schoolSettings?.estdYear || '';
  const schoolLogo = schoolSettings?.schoolLogo;
  const currentYear = new Date().getFullYear();

  const isGroupDisabled = selectedClass === '6th' || selectedClass === '7th' || selectedClass === '8th';
  const isOptionalDisabled = isGroupDisabled;
  const birthRegDigitCount = normalizeNumericField(birthRegNo).length;

  const fieldInputClass =
    'w-full h-11 px-3.5 bg-slate-50/75 dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#0B5D3B] focus:ring-2 focus:ring-emerald-600/15 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition';
  const fieldTextareaClass =
    'w-full px-3.5 py-2.5 bg-slate-50/75 dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#0B5D3B] focus:ring-2 focus:ring-emerald-600/15 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition';
  const fieldSelectClass = `${fieldInputClass} cursor-pointer`;
  const fieldDisabledClass =
    'w-full h-11 px-3.5 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-400 cursor-not-allowed outline-none';
  const fieldLabelClass =
    'block text-xs sm:text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5';

  // ── SHARED INSTITUTIONAL HEADER (Matches /result & /verify-certificate) ──
  const renderInstitutionalHeader = () => (
    <>
      <div className="h-1 bg-gradient-to-r from-[#064e3b] via-[#0B5D3B] to-teal-500 print:hidden" />
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-2xs print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 min-w-0 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0B5D3B] to-emerald-600 p-0.5 shadow-md shadow-emerald-900/15 group-hover:scale-[1.03] transition-transform shrink-0">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center overflow-hidden p-1">
                {schoolLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={schoolLogo} alt={schoolName} className="w-full h-full object-contain" />
                ) : (
                  <GraduationCap className="w-6 h-6 text-[#0B5D3B] dark:text-emerald-400" />
                )}
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition-colors">
                {schoolName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {schoolAddress && <span className="truncate max-w-[200px] sm:max-w-xs">{schoolAddress}</span>}
                {eiinNumber && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                      EIIN: {toBanglaDigits(eiinNumber)}
                    </span>
                  </>
                )}
                {estdYear && (
                  <span className="hidden md:inline-flex items-center gap-1">
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    স্থাপিত: {toBanglaDigits(estdYear)}
                  </span>
                )}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
            >
              <Home className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
              <span>হোম</span>
            </Link>
            <Link
              href="/result"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
            >
              <Award className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>ফলাফল</span>
            </Link>
            <Link
              href="/verify-certificate"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
            >
              <FileBadge2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>সনদ যাচাই</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg bg-[#0B5D3B] hover:bg-emerald-800 text-white shadow-sm shadow-emerald-900/20 transition"
            >
              <User className="w-3.5 h-3.5" />
              <span>লগইন</span>
            </Link>
          </div>
        </div>
      </header>
    </>
  );

  // ── SHARED INSTITUTIONAL FOOTER ──
  const renderInstitutionalFooter = () => (
    <footer className="border-t border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 py-6 mt-auto print:hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="text-center sm:text-left space-y-0.5">
          <p className="font-bold text-slate-700 dark:text-slate-200">
            © {toBanglaDigits(currentYear)} {schoolName}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {schoolAddress}
            {eiinNumber ? ` • EIIN: ${toBanglaDigits(eiinNumber)}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold">
          <Link href="/" className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition">
            মূল ওয়েবসাইট
          </Link>
          <Link href="/result" className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition">
            অনলাইন ফলাফল
          </Link>
          <Link href="/verify-certificate" className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition">
            সনদ যাচাই
          </Link>
          <Link href="/login" className="hover:text-[#0B5D3B] dark:hover:text-emerald-400 transition">
            অ্যাডমিন / শিক্ষক লগইন
          </Link>
        </div>
      </div>
    </footer>
  );

  // ── IF ONLINE ADMISSION IS SUSPENDED ──
  if (schoolSettings && schoolSettings.onlineAdmissionEnabled === false) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
        {renderInstitutionalHeader()}

        <main className="flex-1 max-w-lg w-full mx-auto px-4 py-16 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-4 w-full">
            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-2xl mx-auto flex items-center justify-center">
              <Lock size={26} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              অনলাইন ভর্তি আবেদন বর্তমানে বন্ধ রয়েছে
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
              ২০২৬ শিক্ষাবর্ষের নতুন অনলাইন ভর্তি কার্যক্রম বর্তমানে স্থগিত রয়েছে। ভর্তিসংক্রান্ত যেকোনো
              তথ্যের জন্য সরাসরি বিদ্যালয় অফিসে যোগাযোগ করুন।
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/"
                className="px-5 py-2.5 bg-[#0B5D3B] hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                মূল ওয়েবসাইটে ফিরে যান
              </Link>
              <Link
                href="/result"
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition"
              >
                অনলাইন ফলাফল দেখুন
              </Link>
            </div>
          </div>
        </main>

        {renderInstitutionalFooter()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-600 selection:text-white print:bg-white print:text-black print:block print:min-h-0 print:p-0 print:m-0">
      {renderInstitutionalHeader()}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 🎓 OFFICIAL EMERALD-SLATE HERO BANNER (print:hidden)          */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-[#053b26] via-[#0B5D3B] to-[#0f172a] text-white pt-8 pb-20 sm:pt-10 sm:pb-24 overflow-hidden print:hidden">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        <div className="absolute -top-24 right-0 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-0 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3.5">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 border border-white/20 text-emerald-100 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ভর্তি আবেদন উন্মুক্ত • শিক্ষাবর্ষ ২০২৬</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-black/20 border border-white/15 text-emerald-100/90 backdrop-blur-sm">
              <Send className="w-3 h-3 text-emerald-300" />
              <span>স্বয়ংক্রিয় এসএমএস নিশ্চিতকরণ ও A4 প্রিন্ট স্লিপ</span>
            </span>
          </div>

          <div className="space-y-1.5 max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              অনলাইন শিক্ষার্থী ভর্তি আবেদনপত্র
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/85 font-medium leading-relaxed max-w-2xl mx-auto">
              ৬ষ্ঠ থেকে ১০ম শ্রেণিতে ভর্তির জন্য শিক্ষার্থীর সঠিক তথ্য পূরণ করুন। আবেদন জমা দেওয়ার সাথে
              সাথে অভিভাবকের মোবাইলে নিশ্চিতকরণ SMS এবং প্রিন্টযোগ্য A4 ফরম তৈরি হবে।
            </p>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 📋 MAIN OVERLAPPING APPLICATION WORKSPACE                     */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-14 pb-12 space-y-6 relative z-20 print:p-0 print:m-0 print:mt-0 print:pb-0 print:max-w-none print:w-full print:space-y-0">
        {isSubmitted && applicationRecord ? (
          /* ═══════════════════════════════════════════════════════ */
          /* ✅ SUCCESS CONFIRMATION SLIP & SMS DELIVERY             */
          /* ═══════════════════════════════════════════════════════ */
          <div className="space-y-6 print:space-y-0">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/50 p-6 sm:p-8 shadow-xl space-y-5 print:hidden">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={30} />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold">
                      আবেদন সফল হয়েছে
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                      আবেদন আইডি: {applicationRecord.appId}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    অভিনন্দন! আপনার ভর্তি আবেদনটি সফলভাবে গৃহীত হয়েছে
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                    শিক্ষার্থীর নাম: <strong className="text-slate-900 dark:text-white">{applicationRecord.name}</strong> •
                    শ্রেণি:{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {CLASS_DISPLAY_MAP[applicationRecord.grade || ''] || applicationRecord.grade}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Automated SMS Confirmation Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#0B5D3B] text-white flex items-center justify-center shrink-0">
                      <Send size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>নিশ্চিতকরণ এসএমএস ডেলিভারি তথ্য</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] font-extrabold">
                          {smsDeliveryStatus?.sent === false ? 'অফলাইন' : 'SMS Sent'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        মোবাইল নম্বর:{' '}
                        <strong className="font-mono text-slate-900 dark:text-slate-200">
                          {smsDeliveryStatus?.recipientMobile || applicationRecord.mobile}
                        </strong>{' '}
                        • সময়: {smsDeliveryStatus?.timestamp || 'এখনই'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResendSMS}
                    disabled={smsDeliveryStatus?.isResending}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0B5D3B] dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={smsDeliveryStatus?.isResending ? 'animate-spin' : ''} />
                    <span>{smsDeliveryStatus?.isResending ? 'পাঠানো হচ্ছে...' : 'এসএমএস পুনরায় পাঠান'}</span>
                  </button>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200/80 dark:border-emerald-800/50 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    মোবাইলে প্রেরিত বার্তা:
                  </span>
                  &ldquo;
                  {smsDeliveryStatus?.messageText ||
                    `অভিনন্দন! ${schoolName}-এ ${applicationRecord.name}-এর ${
                      CLASS_DISPLAY_MAP[applicationRecord.grade || ''] || applicationRecord.grade
                    } শ্রেণিতে অনলাইন ভর্তি আবেদন গৃহীত হয়েছে। আপনার আবেদন আইডি: ${
                      applicationRecord.appId
                    }। ধন্যবাদ।`}
                  &rdquo;
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="px-6 py-3 rounded-xl bg-[#0B5D3B] hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-900/20 transition flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Printer size={16} />
                  <span>আবেদনপত্র প্রিন্ট / PDF ডাউনলোড</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus size={16} />
                  <span>নতুন আরেকটি আবেদন করুন</span>
                </button>
              </div>
            </div>

            {/* Official A4 Admission Form Print Slip */}
            <OfficialAdmissionForm
              data={{
                ...applicationRecord,
                qrCodeUrl,
              }}
              settings={schoolSettings}
              onPrint={handlePrintSlip}
              onClose={handleResetForm}
            />
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════ */
          /* 📝 CLEAN INSTITUTIONAL SINGLE-PAGE ADMISSION FORM       */
          /* ═══════════════════════════════════════════════════════ */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-900/8 dark:shadow-black/40 overflow-hidden print:hidden">
            {/* Compact 4-Section Indicator Strip */}
            <div className="px-5 sm:px-8 py-3.5 bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                {[
                  { id: 'admission-step-1', num: '১', label: 'শ্রেণি ও বিভাগ', done: stepStatus.step1Academic },
                  { id: 'admission-step-2', num: '২', label: 'ব্যক্তিগত তথ্য ও ছবি', done: stepStatus.step2Personal },
                  { id: 'admission-step-3', num: '৩', label: 'পিতা ও মাতা', done: stepStatus.step3Parents },
                  { id: 'admission-step-4', num: '৪', label: 'পূর্ববর্তী স্কুল ও ঠিকানা', done: stepStatus.step4Address },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
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
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                লাল (<span className="text-rose-500 font-bold">*</span>) চিহ্নিত ঘর আবশ্যক •{' '}
                {toBanglaDigits(stepStatus.completedCount)}/৪ ধাপ প্রস্তুত
              </span>
            </div>

            {/* Inline Validation Notice */}
            {errorNotice && (
              <div className="mx-5 sm:mx-8 mt-5 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200 rounded-xl text-xs sm:text-sm font-bold flex items-start gap-2.5">
                <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{errorNotice}</span>
              </div>
            )}

            <form onSubmit={handleSubmitApplication} className="p-5 sm:p-8 space-y-8">
              {/* ── SECTION 1: ACADEMIC INFO ── */}
              <section id="admission-step-1" className="scroll-mt-24 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black text-xs">
                      ১
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="text-[#0B5D3B] dark:text-emerald-400" size={16} />
                      ভর্তির শ্রেণি ও শাখা সংক্রান্ত তথ্য
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className={fieldLabelClass}>
                      ভর্তির শ্রেণি <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className={fieldSelectClass}
                    >
                      <option value="6th">৬ষ্ঠ শ্রেণি (Class 6)</option>
                      <option value="7th">৭ম শ্রেণি (Class 7)</option>
                      <option value="8th">৮ম শ্রেণি (Class 8)</option>
                      <option value="9th">৯ম শ্রেণি (Class 9)</option>
                      <option value="10th">১০ম শ্রেণি (Class 10)</option>
                    </select>
                  </div>

                  <div>
                    <label className={fieldLabelClass}>
                      পছন্দসই শাখা <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className={fieldSelectClass}
                    >
                      <option value="A">শাখা ক (Section A)</option>
                      <option value="B">শাখা খ (Section B)</option>
                      <option value="C">শাখা গ (Section C)</option>
                    </select>
                  </div>

                  <div>
                    <label className={fieldLabelClass}>বিভাগ / গ্রুপ (৯ম-১০ম শ্রেণি)</label>
                    <select
                      value={group}
                      onChange={(e) =>
                        setGroup(e.target.value as 'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা')
                      }
                      disabled={isGroupDisabled}
                      className={isGroupDisabled ? fieldDisabledClass : fieldSelectClass}
                    >
                      <option value="সাধারণ">সাধারণ</option>
                      <option value="বিজ্ঞান">বিজ্ঞান (Science)</option>
                      <option value="মানবিক">মানবিক (Humanities)</option>
                      <option value="ব্যবসায় শিক্ষা">ব্যবসায় শিক্ষা (Business)</option>
                    </select>
                  </div>

                  <div>
                    <label className={fieldLabelClass}>৪র্থ / ঐচ্ছিক বিষয়</label>
                    <select
                      value={optionalSubject}
                      onChange={(e) => setOptionalSubject(e.target.value)}
                      disabled={isOptionalDisabled}
                      className={isOptionalDisabled ? fieldDisabledClass : fieldSelectClass}
                    >
                      {optionalSubjectOptions.map((opt) => (
                        <option key={opt.code || opt.name} value={opt.name}>
                          {opt.name} {opt.category && opt.name !== 'কোনটিই নয়' ? `(${opt.category})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clean Stipend Option Row */}
                  <div className="sm:col-span-2 lg:col-span-4 px-4 py-3 rounded-xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label
                      htmlFor="admissionIsStipend"
                      className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-2.5 select-none"
                    >
                      <input
                        type="checkbox"
                        id="admissionIsStipend"
                        checked={isStipend}
                        onChange={(e) => setIsStipend(e.target.checked)}
                        className="w-4 h-4 accent-[#0B5D3B] rounded cursor-pointer shrink-0"
                      />
                      <Award size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>শিক্ষার্থী উপবৃত্তি প্রাপ্ত / উপবৃত্তি সুবিধাভোগী</span>
                    </label>

                    {isStipend && (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-slate-500">ক্যাটাগরি:</span>
                        <select
                          value={stipendCategory}
                          onChange={(e) => setStipendCategory(e.target.value)}
                          className="h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs text-slate-800 dark:text-slate-100 outline-none"
                        >
                          <option value="সাধারণ উপবৃত্তি">সাধারণ উপবৃত্তি</option>
                          <option value="মেধাভিত্তিক উপবৃত্তি">মেধাভিত্তিক উপবৃত্তি</option>
                          <option value="বিশেষ সহায়তা">বিশেষ সহায়তা</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* ── SECTION 2: PERSONAL DETAILS & PHOTO ── */}
              <section id="admission-step-2" className="scroll-mt-24 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black text-xs">
                      ২
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <User className="text-[#0B5D3B] dark:text-emerald-400" size={16} />
                      শিক্ষার্থীর ব্যক্তিগত তথ্যাবলী ও পাসপোর্ট ছবি
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={fieldLabelClass}>
                        শিক্ষার্থীর পূর্ণ নাম (বাংলায়) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="যেমন: মোঃ আরমান হোসেন"
                        className={fieldInputClass}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={fieldLabelClass}>নাম (ইংরেজিতে ক্যাপিটাল অক্ষরে)</label>
                      <input
                        type="text"
                        value={fullNameEn}
                        onChange={(e) => setFullNameEn(e.target.value.toUpperCase())}
                        placeholder="MD. ARMAN HOSSAIN"
                        className={fieldInputClass}
                      />
                    </div>

                    {/* Guardian Mobile with clean emerald SMS callout */}
                    <div className="sm:col-span-2 p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 space-y-1.5">
                      <div className="flex flex-wrap justify-between items-center gap-1">
                        <label className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <Phone size={13} className="text-[#0B5D3B] dark:text-emerald-400" />
                          <span>
                            অভিভাবকের সচল মোবাইল নম্বর <span className="text-rose-500">*</span>
                          </span>
                        </label>
                        <span className="text-[10px] font-bold text-[#0B5D3B] dark:text-emerald-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                          <Send size={10} />
                          <span>এই নম্বরে নিশ্চিতকরণ SMS যাবে</span>
                        </span>
                      </div>
                      <input
                        type="tel"
                        required
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="01812345678 অথবা ০১৮১২৩৪৫৬৭৮"
                        className={`${fieldInputClass} font-mono bg-white dark:bg-slate-900`}
                      />
                    </div>

                    {/* 17-Digit Birth Registration */}
                    <div className="sm:col-span-2">
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs sm:text-[13px] font-bold text-slate-700 dark:text-slate-300">
                          ১৭ ডিজিটের ডিজিটাল জন্ম নিবন্ধন নম্বর <span className="text-rose-500">*</span>
                        </label>
                        <span
                          className={`text-[11px] font-mono font-bold ${
                            birthRegDigitCount >= 17
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {toBanglaDigits(birthRegDigitCount)}/১৭
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        value={birthRegNo}
                        onChange={(e) => setBirthRegNo(e.target.value)}
                        placeholder="যেমন: ২০১০১৫১২৩৪৫৬৭৮৯০১"
                        className={`${fieldInputClass} font-mono`}
                      />
                    </div>

                    <div>
                      <label className={fieldLabelClass}>
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={13} className="text-[#0B5D3B] dark:text-emerald-400" />
                          জন্ম তারিখ <span className="text-rose-500">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className={fieldInputClass}
                      />
                    </div>

                    <div>
                      <label className={fieldLabelClass}>
                        লিঙ্গ <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as 'পুরুষ' | 'নারী' | 'অন্যান্য')}
                        className={fieldSelectClass}
                      >
                        <option value="পুরুষ">পুরুষ (ছাত্র)</option>
                        <option value="নারী">নারী (ছাত্রী)</option>
                        <option value="অন্যান্য">অন্যান্য</option>
                      </select>
                    </div>

                    <div>
                      <label className={fieldLabelClass}>
                        ধর্ম <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={religion}
                        onChange={(e) =>
                          setReligion(
                            e.target.value as 'ইসলাম' | 'হিন্দু' | 'খ্রিস্টান' | 'বৌদ্ধ' | 'অন্যান্য'
                          )
                        }
                        className={fieldSelectClass}
                      >
                        <option value="ইসলাম">ইসলাম</option>
                        <option value="হিন্দু">হিন্দু</option>
                        <option value="খ্রিস্টান">খ্রিস্টান</option>
                        <option value="বৌদ্ধ">বৌদ্ধ</option>
                        <option value="অন্যান্য">অন্যান্য</option>
                      </select>
                    </div>

                    <div>
                      <label className={fieldLabelClass}>
                        <span className="inline-flex items-center gap-1">
                          <Droplet size={13} className="text-rose-500" />
                          রক্তের গ্রুপ
                        </span>
                      </label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className={fieldSelectClass}
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

                  {/* Right: Passport Photo Upload Card */}
                  <div className="lg:col-span-4 flex flex-col items-center p-5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                      শিক্ষার্থীর পাসপোর্ট ছবি
                    </span>

                    <div className="relative w-36 h-44 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#0B5D3B] bg-white dark:bg-slate-900 flex flex-col items-center justify-center overflow-hidden group transition cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-20"
                      />
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo} alt="Student" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-3 text-slate-400">
                          <Camera
                            size={30}
                            className="mx-auto mb-1.5 text-slate-400 group-hover:text-[#0B5D3B] transition"
                          />
                          <span className="text-xs font-extrabold block text-slate-700 dark:text-slate-200">
                            ছবি আপলোড করুন
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            সর্বোচ্চ ৫MB • অটো-ক্রপ
                          </span>
                        </div>
                      )}
                    </div>

                    {photo ? (
                      <button
                        type="button"
                        onClick={() => setPhoto('')}
                        className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <X size={13} />
                        <span>ছবিটি মুছুন</span>
                      </button>
                    ) : (
                      <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 leading-relaxed">
                        সদ্য তোলা স্পষ্ট রঙিন ছবি দিন—আপলোড করলে স্বয়ংক্রিয়ভাবে পাসপোর্ট সাইজে ক্রপ হবে।
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* ── SECTION 3: PARENTS DETAILS ── */}
              <section id="admission-step-3" className="scroll-mt-24 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black text-xs">
                      ৩
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="text-[#0B5D3B] dark:text-emerald-400" size={16} />
                      পিতা ও মাতার বিবরণী
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Father */}
                  <div className="p-4 sm:p-5 bg-slate-50/75 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-3.5">
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-200/70 dark:border-slate-800">
                      <ShieldCheck size={15} className="text-[#0B5D3B] dark:text-emerald-400" /> পিতার তথ্য
                    </span>
                    <div className="space-y-3">
                      <div>
                        <label className={fieldLabelClass}>
                          পিতার নাম <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={fatherName}
                          onChange={(e) => setFatherName(e.target.value)}
                          placeholder="পিতার পূর্ণ নাম লিখুন"
                          className={fieldInputClass}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={fieldLabelClass}>পিতার এনআইডি নম্বর</label>
                          <input
                            type="text"
                            value={fatherNid}
                            onChange={(e) => setFatherNid(e.target.value)}
                            placeholder="জাতীয় পরিচয়পত্র নং"
                            className={`${fieldInputClass} font-mono`}
                          />
                        </div>
                        <div>
                          <label className={fieldLabelClass}>পিতার পেশা</label>
                          <input
                            type="text"
                            value={fatherOcc}
                            onChange={(e) => setFatherOcc(e.target.value)}
                            placeholder="শিক্ষক / ব্যবসায়ী / চাকুরীজীবী"
                            className={fieldInputClass}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mother */}
                  <div className="p-4 sm:p-5 bg-slate-50/75 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-3.5">
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-200/70 dark:border-slate-800">
                      <ShieldCheck size={15} className="text-teal-600 dark:text-teal-400" /> মাতার তথ্য
                    </span>
                    <div className="space-y-3">
                      <div>
                        <label className={fieldLabelClass}>
                          মাতার নাম <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={motherName}
                          onChange={(e) => setMotherName(e.target.value)}
                          placeholder="মাতার পূর্ণ নাম লিখুন"
                          className={fieldInputClass}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={fieldLabelClass}>মাতার এনআইডি নম্বর</label>
                          <input
                            type="text"
                            value={motherNid}
                            onChange={(e) => setMotherNid(e.target.value)}
                            placeholder="জাতীয় পরিচয়পত্র নং"
                            className={`${fieldInputClass} font-mono`}
                          />
                        </div>
                        <div>
                          <label className={fieldLabelClass}>মাতার পেশা</label>
                          <input
                            type="text"
                            value={motherOcc}
                            onChange={(e) => setMotherOcc(e.target.value)}
                            placeholder="গৃহিণী / শিক্ষিকা / চাকুরীজীবী"
                            className={fieldInputClass}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── SECTION 4: PREVIOUS SCHOOL & ADDRESS ── */}
              <section id="admission-step-4" className="scroll-mt-24 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black text-xs">
                      ৪
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin className="text-[#0B5D3B] dark:text-emerald-400" size={16} />
                      পূর্ববর্তী বিদ্যালয় ও ঠিকানা বিবরণী
                    </h3>
                  </div>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0B5D3B] dark:text-emerald-400 select-none">
                    <input
                      type="checkbox"
                      checked={isSameAddress}
                      onChange={(e) => setIsSameAddress(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#0B5D3B] cursor-pointer"
                    />
                    <span>বর্তমান ও স্থায়ী ঠিকানা একই</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={fieldLabelClass}>পূর্বে অধ্যয়নকৃত বিদ্যালয়ের নাম</label>
                    <input
                      type="text"
                      value={prevSchoolName}
                      onChange={(e) => setPrevSchoolName(e.target.value)}
                      placeholder="পূর্বে অধ্যয়নকৃত বিদ্যালয়ের নাম"
                      className={fieldInputClass}
                    />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>সর্বশেষ উত্তীর্ণ শ্রেণির ফলাফল</label>
                    <input
                      type="text"
                      value={prevGpa}
                      onChange={(e) => setPrevGpa(e.target.value)}
                      placeholder="যেমন: GPA 5.00 বা উত্তীর্ণ"
                      className={fieldInputClass}
                    />
                  </div>

                  <div>
                    <label className={fieldLabelClass}>
                      বর্তমান ঠিকানা (গ্রাম/রোড, ডাকঘর, উপজেলা, জেলা){' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={currentAddress}
                      onChange={(e) => setCurrentAddress(e.target.value)}
                      placeholder="গ্রাম/রোড, ডাকঘর, উপজেলা, জেলা"
                      className={fieldTextareaClass}
                    />
                  </div>

                  <div>
                    <label className={fieldLabelClass}>
                      স্থায়ী ঠিকানা <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required={!isSameAddress}
                      disabled={isSameAddress}
                      value={permanentAddress}
                      onChange={(e) => setPermanentAddress(e.target.value)}
                      placeholder={
                        isSameAddress ? 'বর্তমান ঠিকানার অনুরূপ' : 'গ্রাম/রোড, ডাকঘর, উপজেলা, জেলা'
                      }
                      className={
                        isSameAddress
                          ? 'w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-400 cursor-not-allowed outline-none'
                          : fieldTextareaClass
                      }
                    />
                  </div>
                </div>
              </section>

              {/* ── DECLARATION & SUBMIT AREA ── */}
              <div className="pt-2 space-y-4">
                <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-start gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Send size={14} className="text-[#0B5D3B] dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>স্বয়ংক্রিয় এসএমএস:</strong> আবেদন জমা হওয়ার সাথে সাথে অভিভাবকের মোবাইল
                      নম্বরে (<span className="font-mono font-bold">{mobile || '০১৮...'}</span>) নিশ্চিতকরণ
                      এসএমএস পাঠানো হবে।
                    </span>
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={declaredCorrect}
                      onChange={(e) => setDeclaredCorrect(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#0B5D3B] cursor-pointer mt-0.5 shrink-0"
                    />
                    <span className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 font-bold select-none">
                      আমি নিশ্চয়তা দিচ্ছি যে উপরে প্রদত্ত শিক্ষার্থীর সকল তথ্য সম্পূর্ণ সত্য ও সঠিক।
                    </span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="w-full sm:w-auto h-11 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 transition inline-flex items-center justify-center gap-1.5 cursor-pointer order-2 sm:order-1"
                  >
                    <RotateCcw size={15} />
                    <span>ফর্ম রিসেট করুন</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || !declaredCorrect}
                    className="w-full sm:w-auto h-11 px-7 bg-[#0B5D3B] hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-900/20 transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 order-1 sm:order-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>আবেদন প্রক্রিয়া সম্পন্ন ও এসএমএস পাঠানো হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>অনলাইন আবেদন জমা দিন ও এসএমএস গ্রহণ করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>

      {renderInstitutionalFooter()}
    </div>
  );
}
