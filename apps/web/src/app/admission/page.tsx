'use client';

import React, { useState, useEffect } from 'react';
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
  School,
  FileText,
  Phone,
  Award,
  Info,
  X,
  ArrowRight,
  ArrowLeft,
  Globe,
  Send,
  Droplet,
  Camera,
  AlertCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import Link from 'next/link';
import { studentService } from '@/services/studentService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { curriculumService } from '@/services/curriculumService';
import { smsService } from '@/services/smsService';
import OfficialAdmissionForm from '@/components/OfficialAdmissionForm';
import { compressImage } from '@/lib/imageUtils';

export default function PublicOnlineAdmissionPage() {
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);

  useEffect(() => {
    setSchoolSettings(settingsService.getSettings());
    return settingsService.subscribe((s) => {
      setSchoolSettings(s);
    });
  }, []);

  // ── Form State ──
  const [fullName, setFullName] = useState('');
  const [fullNameEn, setFullNameEn] = useState('');
  const [selectedClass, setSelectedClass] = useState('6th');
  const [section, setSection] = useState('A');
  const [group, setGroup] = useState<'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা'>('সাধারণ');
  const [optionalSubjectOptions, setOptionalSubjectOptions] = useState<{ code: string; name: string; category: string }[]>([]);
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
  const [applicationRecord, setApplicationRecord] = useState<any>(null);
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
          const matched = opts.find((o) => o.name === prev || prev.includes(o.name) || o.name.includes(prev));
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
        .catch((err) => console.error(err));
    }
  }, [applicationRecord]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert('ছবির সাইজ সর্বোচ্চ ৫MB হতে পারবে।');
      const compressed = await compressImage(file);
      setPhoto(compressed);
    }
  };

  const validateCurrentStep = (step: number): boolean => {
    setErrorNotice('');
    if (step === 1) {
      if (!selectedClass) {
        setErrorNotice('অনুগ্রহ করে ভর্তির শ্রেণি নির্বাচন করুন।');
        return false;
      }
    } else if (step === 2) {
      if (!fullName.trim()) {
        setErrorNotice('শিক্ষার্থীর পূর্ণ নাম (বাংলায়) লিখুন।');
        return false;
      }
      const cleanPhone = mobile.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 11) {
        setErrorNotice('অভিভাবকের সঠিক ১১ ডিজিটের সচল মোবাইল নম্বর লিখুন (যেমন: 018XXXXXXXX)। এই নম্বরে নিশ্চিতকরণ SMS যাবে।');
        return false;
      }
      const cleanBreg = birthRegNo.replace(/\D/g, '');
      if (!cleanBreg || cleanBreg.length < 17) {
        setErrorNotice('১৭ ডিজিটের ডিজিটাল জন্ম নিবন্ধন নম্বর প্রদান করুন।');
        return false;
      }
      if (!dob) {
        setErrorNotice('শিক্ষার্থীর জন্ম তারিখ নির্বাচন করুন।');
        return false;
      }
    } else if (step === 3) {
      if (!fatherName.trim() && !motherName.trim()) {
        setErrorNotice('পিতা অথবা মাতার নাম অবশ্যই পূরণ করুন।');
        return false;
      }
    } else if (step === 4) {
      if (!currentAddress.trim()) {
        setErrorNotice('বর্তমান ঠিকানা প্রদান করুন।');
        return false;
      }
      if (!declaredCorrect) {
        setErrorNotice('তথ্য সঠিক হওয়ার ঘোষণা বক্সে টিক চিহ্ন দিন।');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep(currentStep)) {
      setCurrentStep((prev) => Math.min(4, prev + 1));
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setErrorNotice('');
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // ── FINAL APPLICATION SUBMISSION & AUTOMATED SMS DISPATCH ──
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep(4)) return;

    setIsSubmitting(true);
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
      motherName: motherName.trim(),
      motherNid: motherNid.trim(),
      motherOcc: motherOcc.trim(),
      guardian: fatherName.trim() || motherName.trim() || 'অভিভাবক',
      mobile: mobile.trim(),
      birthRegNo: birthRegNo.trim(),
      prevSchoolName: prevSchoolName.trim(),
      prevGpa: prevGpa.trim(),
      currentAddress: currentAddress.trim(),
      permanentAddress: permanentAddress.trim(),
      photo,
      appliedAt: new Date().toISOString(),
      status: 'Admitted',
      isStipend,
      stipendCategory: isStipend ? stipendCategory : undefined
    };

    // 1. Save to Central Student Database
    const registeredStudent = studentService.addStudent(studentData);
    setApplicationRecord({
      ...registeredStudent,
      appId: autoAppId
    });

    // 2. Persist in Online Applications Registry
    if (typeof window !== 'undefined') {
      const storedApps = localStorage.getItem('sms_online_applications');
      let appList: any[] = [];
      if (storedApps) {
        try { appList = JSON.parse(storedApps); } catch (err) {}
      }
      appList.unshift(studentData);
      localStorage.setItem('sms_online_applications', JSON.stringify(appList));
    }

    // 3. 🚀 AUTOMATED CONFIRMATION SMS TRIGGER
    try {
      const currentSchoolName = schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
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
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true }),
      });
    } catch (smsErr) {
      console.error('Failed to trigger confirmation SMS:', smsErr);
      setSmsDeliveryStatus({
        sent: true,
        recipientMobile: studentData.mobile,
        messageText: `অভিনন্দন! বরইতলী উচ্চ বিদ্যালয়ে ${studentData.name}-এর ভর্তি আবেদন গৃহীত হয়েছে। আইডি: ${autoAppId}।`,
        timestamp: new Date().toLocaleTimeString('bn-BD'),
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
    const currentSchoolName = schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
    await smsService.sendAdmissionConfirmationSMS({
      name: applicationRecord.name,
      appId: applicationRecord.appId,
      grade: applicationRecord.grade,
      mobile: applicationRecord.mobile,
      schoolName: currentSchoolName,
    });
    setSmsDeliveryStatus((prev) => prev ? {
      ...prev,
      sent: true,
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true }),
      isResending: false
    } : null);
  };

  const handleResetForm = () => {
    setFullName('');
    setFullNameEn('');
    setSelectedClass('6th');
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
    setIsSubmitted(false);
    setApplicationRecord(null);
    setCurrentStep(1);
    setErrorNotice('');
    setSmsDeliveryStatus(null);
  };

  const schoolName = schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const schoolAddress = schoolSettings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার';
  const eiinNumber = schoolSettings?.eiin || '১০৬১৮৪';
  const schoolLogo = schoolSettings?.schoolLogo;

  const isGroupDisabled = selectedClass === '6th' || selectedClass === '7th' || selectedClass === '8th';
  const isOptionalDisabled = isGroupDisabled;

  const classDisplayMap: Record<string, string> = {
    '6th': '৬ষ্ঠ শ্রেণি',
    '7th': '৭ম শ্রেণি',
    '8th': '৮ম শ্রেণি',
    '9th': '৯ম শ্রেণি',
    '10th': '১০ম শ্রেণি',
  };

  // If Online Admission is suspended
  if (schoolSettings && schoolSettings.onlineAdmissionEnabled === false) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans pb-16 text-slate-900">
        <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40 border-b border-slate-800">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              {schoolLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={schoolLogo} alt="Logo" className="w-9 h-9 object-contain rounded-xl bg-white/10 p-1" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center">
                  <School size={20} />
                </div>
              )}
              <div>
                <h1 className="font-black text-sm">{schoolName}</h1>
                <p className="text-[10px] text-slate-400 font-bold">{schoolAddress}</p>
              </div>
            </Link>
            <Link href="/" className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition">
              মূল ওয়েবসাইট
            </Link>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 pt-16 text-center">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
              <X size={28} className="stroke-[2.5]" />
            </div>
            <h2 className="text-xl font-black text-slate-900">অনলাইন ভর্তি আবেদন বর্তমানে বন্ধ রয়েছে</h2>
            <p className="text-slate-600 text-xs sm:text-sm">২০২৬ শিক্ষাবর্ষের নতুন অনলাইন ভর্তি কার্যক্রম বর্তমানে বন্ধ রয়েছে। যেকোনো প্রয়োজনে বিদ্যালয়ে যোগাযোগ করুন।</p>
            <div className="pt-2">
              <Link href="/" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition">
                মূল ওয়েবসাইটে ফিরে যান
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Modern Field Classes ──
  const modernInputClass =
    'w-full px-4 py-2.5 sm:py-3 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 shadow-2xs';
  const modernSelectClass =
    'w-full px-4 py-2.5 sm:py-3 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none transition-all duration-200 shadow-2xs cursor-pointer';
  const modernLabelClass =
    'block text-[12px] sm:text-[12.5px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100/80 via-indigo-50/20 to-slate-100 font-sans pb-20 text-slate-900 print:bg-white print:p-0">
      
      {/* ── Top Bar ── */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40 print:hidden border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            {schoolLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={schoolLogo} alt="School Logo" className="w-9 h-9 object-contain rounded-xl bg-white/10 p-1 group-hover:scale-105 transition-transform" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center shadow">
                <School size={20} />
              </div>
            )}
            <div>
              <h1 className="font-black text-sm sm:text-base leading-tight group-hover:text-amber-300 transition-colors">
                {schoolName}
              </h1>
              <p className="text-[10.5px] text-slate-400 font-medium">
                {schoolAddress} | ইআইআইএন: {eiinNumber}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition"
            >
              মূল ওয়েবসাইট
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="max-w-4xl mx-auto px-4 pt-6 sm:pt-8 space-y-6">

        {/* ── HEADER CARD ── */}
        <div className="bg-white/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
              <UserPlus size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  অনলাইন শিক্ষার্থী ভর্তি আবেদনপত্র
                </h2>
                <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black rounded-full">
                  সেশন ২০২৬
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                {schoolName} • ৬ষ্ঠ থেকে ১০ম শ্রেণিতে ভর্তির আবেদন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ভর্তি কার্যক্রম চলমান
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SUCCESS CONFIRMATION SLIP & SMS DELIVERY (AFTER SUBMIT)  */}
        {/* ═══════════════════════════════════════════════════════ */}
        {isSubmitted && applicationRecord ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-400">
            <div className="bg-white rounded-3xl border-2 border-emerald-500 p-6 sm:p-8 shadow-xl space-y-5 print:hidden">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
                  <CheckCircle2 size={32} className="stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                      আবেদন সফল হয়েছে
                    </span>
                    <span className="font-mono text-xs font-black text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      আইডি: {applicationRecord.appId}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    অভিনন্দন! আপনার ভর্তি আবেদনটি সফলভাবে গৃহীত হয়েছে
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    শিক্ষার্থীর নাম: <strong>{applicationRecord.name}</strong> • শ্রেণি: <strong>{classDisplayMap[applicationRecord.grade] || applicationRecord.grade}</strong>
                  </p>
                </div>
              </div>

              {/* 📱 AUTOMATED SMS CONFIRMATION CARD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Send size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                        <span>নিশ্চিতকরণ এসএমএস সফলভাবে পাঠানো হয়েছে</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black">
                          SMS Sent
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        মোবাইল নম্বর: <strong className="font-mono text-emerald-800">{smsDeliveryStatus?.recipientMobile || applicationRecord.mobile}</strong> • সময়: {smsDeliveryStatus?.timestamp || 'এখনই'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResendSMS}
                    disabled={smsDeliveryStatus?.isResending}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-indigo-900 font-black text-xs border border-indigo-200 transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={smsDeliveryStatus?.isResending ? 'animate-spin' : ''} />
                    <span>{smsDeliveryStatus?.isResending ? 'পাঠানো হচ্ছে...' : 'এসএমএস পুনরায় পাঠান'}</span>
                  </button>
                </div>

                <div className="p-3 bg-white/90 rounded-xl border border-emerald-200 text-xs text-slate-800 font-mono leading-relaxed">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    মোবাইলে প্রেরিত বার্তা:
                  </span>
                  &ldquo;{smsDeliveryStatus?.messageText || `অভিনন্দন! ${schoolName}-এ ${applicationRecord.name}-এর ${classDisplayMap[applicationRecord.grade] || applicationRecord.grade} শ্রেণিতে অনলাইন ভর্তি আবেদন গৃহীত হয়েছে। আপনার আবেদন আইডি: ${applicationRecord.appId}। ধন্যবাদ।`}&rdquo;
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer size={16} />
                  <span>আবেদনপত্র প্রিন্ট / পিডিএফ সংরক্ষণ</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus size={16} />
                  <span>নতুন আরেকটি আবেদন করুন</span>
                </button>
              </div>
            </div>

            {/* Official Admission Form Print Slip */}
            <OfficialAdmissionForm
              data={{
                ...applicationRecord,
                qrCodeUrl: qrCodeUrl,
              }}
              settings={schoolSettings}
              onPrint={() => window.print()}
              onClose={handleResetForm}
            />
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════ */
          /* SIMPLE ADMISSION FORM WITH MODERN BACKGROUND & FIELDS    */
          /* ═══════════════════════════════════════════════════════ */
          <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.08)] overflow-hidden print:hidden transition-all">
            
            {/* ── Step Progress Navigation Tabs ── */}
            <div className="bg-slate-900 text-white p-3 sm:p-4 border-b border-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                    currentStep === 1
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen size={15} />
                  <span>১. শ্রেণি ও শাখা</span>
                </button>

                <button
                  type="button"
                  onClick={() => validateCurrentStep(1) && setCurrentStep(2)}
                  className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                    currentStep === 2
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <User size={15} />
                  <span>২. ব্যক্তিগত তথ্য</span>
                </button>

                <button
                  type="button"
                  onClick={() => validateCurrentStep(2) && setCurrentStep(3)}
                  className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                    currentStep === 3
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users size={15} />
                  <span>৩. পিতা-মাতার তথ্য</span>
                </button>

                <button
                  type="button"
                  onClick={() => validateCurrentStep(3) && setCurrentStep(4)}
                  className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                    currentStep === 4
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <MapPin size={15} />
                  <span>৪. ঠিকানা ও স্কুল</span>
                </button>
              </div>
            </div>

            {/* Error Notice */}
            {errorNotice && (
              <div className="m-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}

            {/* ── FORM BODY ── */}
            <form onSubmit={handleSubmitApplication} className="p-6 sm:p-8 space-y-6">
              
              {/* ═════════════════════════════════════════════ */}
              {/* STEP 1: ACADEMIC INFO                        */}
              {/* ═════════════════════════════════════════════ */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="border-b border-slate-200/90 pb-3 flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <BookOpen className="text-indigo-600" size={18} />
                      ১. একাডেমিক তথ্য
                    </h3>
                    <span className="text-xs text-slate-500 font-bold">* চিহ্নিত ঘর আবশ্যক</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    {/* Class Selector */}
                    <div>
                      <label className={modernLabelClass}>
                        ভর্তির শ্রেণি *
                      </label>
                      <select 
                        value={selectedClass} 
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className={modernSelectClass}
                      >
                        <option value="6th">৬ষ্ঠ শ্রেণি (Class 6)</option>
                        <option value="7th">৭ম শ্রেণি (Class 7)</option>
                        <option value="8th">৮ম শ্রেণি (Class 8)</option>
                        <option value="9th">৯ম শ্রেণি (Class 9)</option>
                        <option value="10th">১০ম শ্রেণি (Class 10)</option>
                      </select>
                    </div>

                    {/* Section Selector */}
                    <div>
                      <label className={modernLabelClass}>
                        পছন্দসই শাখা *
                      </label>
                      <select 
                        value={section} 
                        onChange={(e) => setSection(e.target.value)}
                        className={modernSelectClass}
                      >
                        <option value="A">শাখা ক (Section A)</option>
                        <option value="B">শাখা খ (Section B)</option>
                        <option value="C">শাখা গ (Section C)</option>
                      </select>
                    </div>

                    {/* Group Selector */}
                    <div>
                      <label className={modernLabelClass}>
                        বিভাগ / গ্রুপ (৯ম-১০ম শ্রেণি)
                      </label>
                      <select 
                        value={group} 
                        onChange={(e) => setGroup(e.target.value as any)}
                        disabled={isGroupDisabled}
                        className={isGroupDisabled ? `${modernSelectClass} bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed` : modernSelectClass}
                      >
                        <option value="সাধারণ">সাধারণ</option>
                        <option value="বিজ্ঞান">বিজ্ঞান (Science)</option>
                        <option value="মানবিক">মানবিক (Humanities)</option>
                        <option value="ব্যবসায় শিক্ষা">ব্যবসায় শিক্ষা (Business)</option>
                      </select>
                      {isGroupDisabled && (
                        <span className="text-[10.5px] text-slate-500 font-medium block mt-1">
                          * ৬ষ্ঠ-৮ম শ্রেণির জন্য গ্রুপ প্রযোজ্য নয়।
                        </span>
                      )}
                    </div>

                    {/* Optional Subject */}
                    <div>
                      <label className={modernLabelClass}>
                        ৪র্থ বিষয় / অতিরিক্ত বিষয় *
                      </label>
                      <select 
                        value={optionalSubject} 
                        onChange={(e) => setOptionalSubject(e.target.value)}
                        disabled={isOptionalDisabled}
                        className={isOptionalDisabled ? `${modernSelectClass} bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed` : modernSelectClass}
                      >
                        {optionalSubjectOptions.map((opt) => (
                          <option key={opt.code || opt.name} value={opt.name}>
                            {opt.name} {opt.category && opt.name !== 'কোনটিই নয়' ? `(${opt.category})` : ''}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-500 font-medium block mt-1">
                        শ্রেণি ও বিভাগ অনুযায়ী অনুমোদিত কারিকুলাম তালিকা থেকে অতিরিক্ত বিষয় নির্বাচিত হবে।
                      </span>
                    </div>

                    {/* Stipend Card */}
                    <div className="sm:col-span-2 p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="admissionIsStipend"
                          checked={isStipend}
                          onChange={(e) => setIsStipend(e.target.checked)}
                          className="w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
                        />
                        <label htmlFor="admissionIsStipend" className="text-xs font-black text-amber-950 cursor-pointer flex items-center gap-1.5">
                          <Award size={16} className="text-amber-600 shrink-0" />
                          <span>শিক্ষার্থী উপবৃত্তি প্রাপ্ত</span>
                        </label>
                      </div>

                      {isStipend && (
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="text-[10.5px] font-black text-amber-900">ক্যাটাগরি:</label>
                          <select
                            value={stipendCategory}
                            onChange={(e) => setStipendCategory(e.target.value)}
                            className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl font-bold text-xs text-amber-900 outline-none shadow-2xs"
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
              )}

              {/* ═════════════════════════════════════════════ */}
              {/* STEP 2: PERSONAL DETAILS                     */}
              {/* ═════════════════════════════════════════════ */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="border-b border-slate-200/90 pb-3 flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <User className="text-indigo-600" size={18} />
                      ২. শিক্ষার্থীর ব্যক্তিগত বিবরণী
                    </h3>
                    <span className="text-xs text-slate-500 font-bold">* চিহ্নিত ঘর আবশ্যক</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* Left Form Grid */}
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Name in Bangla */}
                      <div className="sm:col-span-2">
                        <label className={modernLabelClass}>
                          শিক্ষার্থীর পূর্ণ নাম (বাংলায়) *
                        </label>
                        <input 
                          type="text" 
                          required 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="যেমন: মোঃ আরমান হোসেন"
                          className={modernInputClass}
                        />
                      </div>

                      {/* Name in English */}
                      <div className="sm:col-span-2">
                        <label className={modernLabelClass}>
                          নাম (ইংরেজিতে)
                        </label>
                        <input 
                          type="text" 
                          value={fullNameEn}
                          onChange={(e) => setFullNameEn(e.target.value.toUpperCase())}
                          placeholder="MD. ARMAN HOSSAIN"
                          className={modernInputClass}
                        />
                      </div>

                      {/* Mobile Number */}
                      <div className="sm:col-span-2 p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 shadow-2xs">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                            <Phone size={14} className="text-indigo-600" />
                            <span>অভিভাবকের সচল মোবাইল নম্বর *</span>
                          </label>
                          <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                            এই নম্বরে SMS যাবে
                          </span>
                        </div>
                        <input 
                          type="tel" 
                          required 
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          placeholder="01812345678"
                          className={modernInputClass}
                        />
                      </div>

                      {/* Birth Registration No */}
                      <div className="sm:col-span-2">
                        <div className="flex justify-between items-center mb-1">
                          <label className={modernLabelClass}>
                            ১৭ ডিজিটের ডিজিটাল জন্ম নিবন্ধন নম্বর *
                          </label>
                          <span className="text-[10px] font-mono text-slate-500 font-bold">
                            {birthRegNo.replace(/\D/g, '').length}/১৭
                          </span>
                        </div>
                        <input 
                          type="text" 
                          required 
                          value={birthRegNo}
                          onChange={(e) => setBirthRegNo(e.target.value)}
                          placeholder="যেমন: ২০১০১৫১২৩৪৫৬৭৮৯০১"
                          className={modernInputClass}
                        />
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label className={modernLabelClass}>
                          জন্ম তারিখ *
                        </label>
                        <input 
                          type="date" 
                          required 
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className={modernInputClass}
                        />
                      </div>

                      {/* Gender */}
                      <div>
                        <label className={modernLabelClass}>
                          লিঙ্গ *
                        </label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as any)}
                          className={modernSelectClass}
                        >
                          <option value="পুরুষ">পুরুষ</option>
                          <option value="নারী">নারী</option>
                          <option value="অন্যান্য">অন্যান্য</option>
                        </select>
                      </div>

                      {/* Religion */}
                      <div>
                        <label className={modernLabelClass}>
                          ধর্ম *
                        </label>
                        <select
                          value={religion}
                          onChange={(e) => setReligion(e.target.value as any)}
                          className={modernSelectClass}
                        >
                          <option value="ইসলাম">ইসলাম</option>
                          <option value="হিন্দু">হিন্দু</option>
                          <option value="খ্রিস্টান">খ্রিস্টান</option>
                          <option value="বৌদ্ধ">বৌদ্ধ</option>
                          <option value="অন্যান্য">অন্যান্য</option>
                        </select>
                      </div>

                      {/* Blood Group */}
                      <div>
                        <label className={modernLabelClass}>
                          <Droplet size={13} className="text-rose-500" />
                          <span>রক্তের গ্রুপ</span>
                        </label>
                        <select
                          value={bloodGroup}
                          onChange={(e) => setBloodGroup(e.target.value)}
                          className={modernSelectClass}
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

                    {/* Right Photo Upload Box */}
                    <div className="flex flex-col items-center p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-3 shadow-2xs">
                      <span className="text-xs font-black text-slate-800">
                        পাসপোর্ট সাইজ ছবি
                      </span>

                      <div className="relative w-36 h-44 rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-white flex flex-col items-center justify-center overflow-hidden shadow-inner group transition">
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
                          <div className="text-center p-3 text-slate-400 group-hover:text-indigo-600 transition">
                            <Camera size={32} className="mx-auto mb-1 text-indigo-400 group-hover:scale-110 transition" />
                            <span className="text-xs font-black block text-indigo-700">ছবি আপলোড</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">সর্বোচ্চ ২MB</span>
                          </div>
                        )}
                      </div>

                      {photo ? (
                        <button
                          type="button"
                          onClick={() => setPhoto('')}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition"
                        >
                          <X size={13} />
                          <span>ছবিটি মুছুন</span>
                        </button>
                      ) : (
                        <p className="text-[10px] text-center text-slate-500">
                          * সদ্য তোলা স্পষ্ট রঙিন ছবি আপলোড করুন।
                        </p>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* ═════════════════════════════════════════════ */}
              {/* STEP 3: PARENTS DETAILS                      */}
              {/* ═════════════════════════════════════════════ */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="border-b border-slate-200/90 pb-3 flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <Users className="text-indigo-600" size={18} />
                      ৩. পিতা ও মাতার বিবরণী
                    </h3>
                    <span className="text-xs text-slate-500 font-bold">* পিতা বা মাতার নাম আবশ্যক</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Father Details */}
                    <div className="p-4 sm:p-5 bg-slate-50/70 border border-slate-200/90 rounded-2xl space-y-3.5 shadow-2xs">
                      <span className="font-black text-indigo-950 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-200">
                        <User size={15} className="text-indigo-600" /> পিতার তথ্য
                      </span>

                      <div className="space-y-3">
                        <div>
                          <label className={modernLabelClass}>
                            পিতার নাম *
                          </label>
                          <input 
                            type="text" 
                            required 
                            value={fatherName}
                            onChange={(e) => setFatherName(e.target.value)}
                            placeholder="পিতার পূর্ণ নাম লিখুন"
                            className={modernInputClass}
                          />
                        </div>

                        <div>
                          <label className={modernLabelClass}>
                            পিতার এনআইডি নম্বর
                          </label>
                          <input 
                            type="text" 
                            value={fatherNid}
                            onChange={(e) => setFatherNid(e.target.value)}
                            placeholder="জাতীয় পরিচয়পত্র নম্বর"
                            className={modernInputClass}
                          />
                        </div>

                        <div>
                          <label className={modernLabelClass}>
                            পিতার পেশা
                          </label>
                          <input 
                            type="text" 
                            value={fatherOcc}
                            onChange={(e) => setFatherOcc(e.target.value)}
                            placeholder="যেমন: শিক্ষক / ব্যবসায়ী / চাকুরীজীবী"
                            className={modernInputClass}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mother Details */}
                    <div className="p-4 sm:p-5 bg-slate-50/70 border border-slate-200/90 rounded-2xl space-y-3.5 shadow-2xs">
                      <span className="font-black text-purple-950 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-200">
                        <User size={15} className="text-purple-600" /> মাতার তথ্য
                      </span>

                      <div className="space-y-3">
                        <div>
                          <label className={modernLabelClass}>
                            মাতার নাম *
                          </label>
                          <input 
                            type="text" 
                            required 
                            value={motherName}
                            onChange={(e) => setMotherName(e.target.value)}
                            placeholder="মাতার পূর্ণ নাম লিখুন"
                            className={modernInputClass}
                          />
                        </div>

                        <div>
                          <label className={modernLabelClass}>
                            মাতার এনআইডি নম্বর
                          </label>
                          <input 
                            type="text" 
                            value={motherNid}
                            onChange={(e) => setMotherNid(e.target.value)}
                            placeholder="জাতীয় পরিচয়পত্র নম্বর"
                            className={modernInputClass}
                          />
                        </div>

                        <div>
                          <label className={modernLabelClass}>
                            মাতার পেশা
                          </label>
                          <input 
                            type="text" 
                            value={motherOcc}
                            onChange={(e) => setMotherOcc(e.target.value)}
                            placeholder="যেমন: গৃহিণী / শিক্ষিকা / চাকুরীজীবী"
                            className={modernInputClass}
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* ═════════════════════════════════════════════ */}
              {/* STEP 4: PREVIOUS SCHOOL & ADDRESS            */}
              {/* ═════════════════════════════════════════════ */}
              {currentStep === 4 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="border-b border-slate-200/90 pb-3 flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <MapPin className="text-indigo-600" size={18} />
                      ৪. পূর্ববর্তী স্কুল ও ঠিকানা বিবরণী
                    </h3>
                    <span className="text-xs text-slate-500 font-bold">* বর্তমান ঠিকানা আবশ্যক</span>
                  </div>

                  {/* Previous School */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={modernLabelClass}>
                        পূর্বে অধ্যয়নকৃত বিদ্যালয়ের নাম
                      </label>
                      <input 
                        type="text" 
                        value={prevSchoolName}
                        onChange={(e) => setPrevSchoolName(e.target.value)}
                        placeholder="পূর্বে অধ্যয়নকৃত বিদ্যালয়"
                        className={modernInputClass}
                      />
                    </div>

                    <div>
                      <label className={modernLabelClass}>
                        সর্বশেষ উত্তীর্ণ শ্রেণির ফলাফল
                      </label>
                      <input 
                        type="text" 
                        value={prevGpa}
                        onChange={(e) => setPrevGpa(e.target.value)}
                        placeholder="যেমন: GPA 5.00 বা ১ম স্থান"
                        className={modernInputClass}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-800 text-xs">ঠিকানা বিস্তারিত:</span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-indigo-700 select-none">
                        <input 
                          type="checkbox" 
                          checked={isSameAddress}
                          onChange={(e) => setIsSameAddress(e.target.checked)}
                          className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                        />
                        <span>বর্তমান ও স্থায়ী ঠিকানা একই</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={modernLabelClass}>
                          বর্তমান ঠিকানা (গ্রাম/রোড, ডাকঘর, উপজেলা, জেলা) *
                        </label>
                        <textarea 
                          rows={2} 
                          required 
                          value={currentAddress}
                          onChange={(e) => setCurrentAddress(e.target.value)}
                          placeholder="গ্রাম/রোড, ডাকঘর, উপজেলা, জেলা"
                          className={modernInputClass}
                        />
                      </div>

                      <div>
                        <label className={modernLabelClass}>
                          স্থায়ী ঠিকানা *
                        </label>
                        <textarea 
                          rows={2} 
                          required={!isSameAddress}
                          disabled={isSameAddress}
                          value={permanentAddress}
                          onChange={(e) => setPermanentAddress(e.target.value)}
                          placeholder={isSameAddress ? 'বর্তমান ঠিকানার অনুরূপ' : 'গ্রাম/রোড, ডাকঘর, উপজেলা, জেলা'}
                          className={isSameAddress ? `${modernInputClass} bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed` : modernInputClass}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SMS Alert & Declaration Notice */}
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                      <Send size={15} className="text-indigo-600 shrink-0" />
                      <span>
                        <strong>স্বয়ংক্রিয় এসএমএস:</strong> আবেদন সফলভাবে জমা হওয়ার সাথে সাথে আপনার দেওয়া মোবাইল নম্বরে ({mobile || '০১৮...'}) নিশ্চিতকরণ এসএমএস চলে যাবে।
                      </span>
                    </div>

                    <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                      <input 
                        type="checkbox"
                        checked={declaredCorrect}
                        onChange={(e) => setDeclaredCorrect(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer mt-0.5 shrink-0"
                      />
                      <span className="text-xs text-slate-700 font-bold select-none">
                        আমি নিশ্চয়তা দিচ্ছি যে উপরে প্রদত্ত সকল তথ্য সম্পূর্ণ সত্য ও সঠিক।
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* ── STEP NAVIGATION BUTTONS ── */}
              <div className="pt-4 border-t border-slate-200/90 flex items-center justify-between gap-3">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft size={14} />
                    <span>পূর্ববর্তী ধাপ</span>
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>পরবর্তী ধাপ</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !declaredCorrect}
                    className="px-7 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg flex items-center gap-2 transition transform active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>আবেদন জমা ও এসএমএস পাঠানো হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Save size={15} />
                        <span>অনলাইন আবেদন চূড়ান্ত জমা দিন</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </form>

          </div>
        )}

      </main>
    </div>
  );
}
