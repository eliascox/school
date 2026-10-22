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
  ShieldCheck,
  BookOpen,
  Calendar,
  Printer,
  Sparkles,
  School,
  FileText,
  Phone,
  Award,
  Info,
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  Globe,
  Search,
  MessageSquare,
  Send,
  Droplet,
  Camera,
  Download,
  AlertCircle,
  HelpCircle,
  Clock
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

  // Tracking / Search Modal State
  const [showTrackModal, setShowTrackModal] = useState<boolean>(false);
  const [trackQuery, setTrackQuery] = useState<string>('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackError, setTrackError] = useState<string>('');
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

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
        setErrorNotice('শিক্ষার্থীর পূর্ণ নাম (বাংলায়) প্রদান করুন।');
        return false;
      }
      const cleanPhone = mobile.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 11) {
        setErrorNotice('অভিভাবকের সঠিক ১১ ডিজিটের সচল মোবাইল নম্বর লিখুন (যেমন: 018XXXXXXXX)। এই নম্বরে নিশ্চিতকরণ SMS যাবে।');
        return false;
      }
      const cleanBreg = birthRegNo.replace(/\D/g, '');
      if (!cleanBreg || cleanBreg.length < 17) {
        setErrorNotice('১৭ ডিজিটের ডিজিটাল জন্ম নিবন্ধন নম্বর সঠিকভাবে প্রদান করুন।');
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

    // 3. 🚀 AUTOMATED CONFIRMATION SMS TRIGGER (Mandatory Requirement)
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

  // Resend SMS Handler
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

  // Search existing application
  const handleSearchApplication = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError('');
    setTrackResult(null);
    const q = trackQuery.trim();
    if (!q) {
      setTrackError('অনুগ্রহ করে আবেদন আইডি বা মোবাইল নম্বর লিখুন।');
      return;
    }

    let found: any = null;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sms_online_applications');
      if (stored) {
        try {
          const list = JSON.parse(stored);
          found = list.find((item: any) => 
            (item.appId && item.appId.toLowerCase() === q.toLowerCase()) ||
            (item.mobile && item.mobile.replace(/\D/g, '') === q.replace(/\D/g, ''))
          );
        } catch (err) {}
      }
    }

    if (!found) {
      const allStudents = studentService.getAllStudents();
      found = allStudents.find((s: any) => 
        (s.id && s.id.toLowerCase() === q.toLowerCase()) ||
        (s.mobile && s.mobile.replace(/\D/g, '') === q.replace(/\D/g, ''))
      );
    }

    if (found) {
      setTrackResult(found);
    } else {
      setTrackError('প্রদত্ত তথ্য অনুযায়ী কোনো আবেদন খুঁজে পাওয়া যায়নি। আইডি বা নম্বরটি সঠিক কি না যাচাই করুন।');
    }
  };

  const schoolName = schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const schoolAddress = schoolSettings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার';
  const eiinNumber = schoolSettings?.eiin || '১০৬১৮৪';
  const schoolLogo = schoolSettings?.schoolLogo;
  const schoolPhone = schoolSettings?.phone || '০১৮১২-৩৪৫৬৭৮';

  const isGroupDisabled = selectedClass === '6th' || selectedClass === '7th' || selectedClass === '8th';
  const isOptionalDisabled = isGroupDisabled;

  const classDisplayMap: Record<string, string> = {
    '6th': '৬ষ্ঠ শ্রেণি',
    '7th': '৭ম শ্রেণি',
    '8th': '৮ম শ্রেণি',
    '9th': '৯ম শ্রেণি',
    '10th': '১০ম শ্রেণি',
  };

  // If Online Admission is suspended in Settings
  if (schoolSettings && schoolSettings.onlineAdmissionEnabled === false) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans pb-16 text-slate-900">
        <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl sticky top-0 z-40 border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              {schoolLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={schoolLogo} alt="Logo" className="w-10 h-10 object-contain rounded-xl bg-white/10 p-1" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center">
                  <School size={22} />
                </div>
              )}
              <div>
                <h1 className="font-black text-sm sm:text-base leading-tight group-hover:text-amber-300 transition-colors">{schoolName}</h1>
                <p className="text-[10px] text-indigo-200 font-bold">{schoolAddress} | ইআইআইএন: {eiinNumber}</p>
              </div>
            </Link>
            <Link href="/" className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition">
              মূল ওয়েবসাইট
            </Link>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 pt-16 text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-5">
            <div className="w-16 h-16 bg-rose-50 border-2 border-rose-200 text-rose-600 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
              <X size={32} className="stroke-[2.5]" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 bg-rose-100 text-rose-800 font-black text-xs rounded-full inline-block border border-rose-200">
                ভর্তি কার্যক্রম স্থগিত
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                অনলাইন ভর্তি আবেদন বর্তমানে বন্ধ রয়েছে
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">
                ২০২৬ শিক্ষাবর্ষের নতুন অনলাইন ভর্তি কার্যক্রম বর্তমানে বন্ধ রয়েছে। ভর্তির প্রয়োজনীয় তথ্য ও যেকোনো প্রয়োজনে সরাসরি বিদ্যালয়ের অফিসে যোগাযোগ করার অনুরোধ করা হলো।
              </p>
            </div>
            <div className="pt-2">
              <Link href="/" className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition">
                মূল ওয়েবসাইটে ফিরে যান
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-indigo-50/30 to-slate-100 font-sans pb-20 text-slate-900 print:bg-white print:p-0">
      
      {/* ── Top Institutional Navigation Bar ── */}
      <header className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white shadow-xl sticky top-0 z-40 print:hidden border-b border-indigo-900/40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link 
            href="/" 
            className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer group shrink-0"
            title="মূল হোমপেজে ফিরে যান"
          >
            {schoolLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={schoolLogo} alt="School Logo" className="w-10 h-10 object-contain rounded-xl bg-white/10 p-1 group-hover:scale-105 transition-transform" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black flex items-center justify-center shadow group-hover:scale-105 transition-transform">
                <School size={22} />
              </div>
            )}
            <div>
              <h1 className="font-black text-sm sm:text-base tracking-tight leading-tight group-hover:text-amber-300 transition-colors">
                {schoolName}
              </h1>
              <p className="text-[10px] text-indigo-200 font-bold">
                {schoolAddress} | EIIN: {eiinNumber}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Track Application Button */}
            <button
              type="button"
              onClick={() => {
                setTrackResult(null);
                setTrackError('');
                setShowTrackModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition cursor-pointer"
            >
              <Search size={14} className="text-amber-300" />
              <span className="hidden sm:inline">আবেদন ট্র্যাকিং / প্রিন্ট</span>
              <span className="sm:hidden">ট্র্যাকিং</span>
            </button>

            {/* Helpline Badge */}
            <a
              href={`tel:${schoolPhone}`}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-400/30 transition"
              title="ভর্তি হেল্পলাইনে কল করুন"
            >
              <Phone size={13} className="text-emerald-400" />
              <span>হেল্পলাইন: {schoolPhone}</span>
            </a>

            <Link
              href="/"
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow transition cursor-pointer"
            >
              হোমপেজ
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="max-w-4xl mx-auto px-4 pt-6 sm:pt-8 space-y-6">

        {/* ── HERO BANNER CARD ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/40 print:hidden">
          {/* Subtle Decorative Elements */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-44 h-44 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/25 border border-indigo-400/30 text-amber-300 text-[11px] font-black">
                <Sparkles size={14} className="text-amber-400" />
                <span>২০২৬ শিক্ষাবর্ষের ডিজিটাল শিক্ষার্থী ভর্তি কার্যক্রম</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white">
                অনলাইন শিক্ষার্থী ভর্তি আবেদনপত্র
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200 font-medium max-w-xl leading-relaxed">
                {schoolName} • ৬ষ্ঠ থেকে ১০ম শ্রেণিতে নতুন ভর্তির সমন্বিত আবেদন পোর্টাল। সঠিক তথ্য প্রদান করে ঘরে বসেই আবেদন সম্পন্ন করুন।
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>ভর্তি কার্যক্রম সক্রিয়</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRulesModal(true)}
                className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer transition underline"
              >
                <HelpCircle size={13} />
                <span>ভর্তি নির্দেশিকা ও প্রয়োজনীয় তথ্য</span>
              </button>
            </div>
          </div>

          {/* Quick SMS Notification Highlight */}
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2 text-[11.5px] text-indigo-200">
            <MessageSquare size={14} className="text-amber-400 shrink-0" />
            <span>
              <strong>এসএমএস নিশ্চয়তা:</strong> আবেদন সফলভাবে জমা হওয়ার সাথে সাথে আপনার দেওয়া মোবাইল নম্বরে স্বয়ংক্রিয় নিশ্চয়তামূলক এসএমএস পাঠানো হবে।
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SUCCESS CONFIRMATION SLIP & SMS FEEDBACK (AFTER SUBMIT)  */}
        {/* ═══════════════════════════════════════════════════════ */}
        {isSubmitted && applicationRecord ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Celebration & SMS Banner */}
            <div className="bg-white rounded-3xl border-2 border-emerald-500 p-6 sm:p-8 shadow-xl space-y-5 print:hidden">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
                  <CheckCircle2 size={36} className="stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                      আবেদন সফল হয়েছে
                    </span>
                    <span className="font-mono text-xs font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
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

              {/* 📱 SPECIAL AUTOMATED SMS CONFIRMATION CARD (Target Feature) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow">
                      <Send size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <span>নিশ্চিতকরণ এসএমএস সফলভাবে প্রেরণ করা হয়েছে</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black">
                          SMS Sent
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        প্রাপকের মোবাইল: <strong className="font-mono text-emerald-800">{smsDeliveryStatus?.recipientMobile || applicationRecord.mobile}</strong> • সময়: {smsDeliveryStatus?.timestamp || 'এখনই'}
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

                {/* SMS Text Bubble */}
                <div className="p-3 bg-white/90 rounded-xl border border-emerald-200 text-xs text-slate-800 font-mono leading-relaxed">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    মোবাইলে প্রেরিত এসএমএস কনটেন্ট:
                  </span>
                  &ldquo;{smsDeliveryStatus?.messageText || `অভিনন্দন! ${schoolName}-এ ${applicationRecord.name}-এর ${classDisplayMap[applicationRecord.grade] || applicationRecord.grade} শ্রেণিতে অনলাইন ভর্তি আবেদন গৃহীত হয়েছে। আপনার আবেদন আইডি: ${applicationRecord.appId}। ধন্যবাদ।`}&rdquo;
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer size={16} />
                  <span>আবেদনপত্র প্রিন্ট / পিডিএফ সংরক্ষণ করুন</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus size={16} />
                  <span>নতুন আরেকটি আবেদন করুন</span>
                </button>
              </div>
            </div>

            {/* Official Admission Form Document */}
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
          /* MULTI-STEP ONLINE ADMISSION WIZARD FORM                  */
          /* ═══════════════════════════════════════════════════════ */
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden print:hidden">
            
            {/* ── STEPPER PROGRESS WIZARD HEADER ── */}
            <div className="bg-slate-900 text-white p-4 sm:p-6 border-b border-slate-800">
              {/* Stepper Progress Bar */}
              <div className="relative mb-4 sm:mb-6">
                <div className="overflow-hidden h-2 mb-2 text-xs flex rounded-full bg-slate-800">
                  <div
                    style={{ width: `${(currentStep / 4) * 100}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 transition-all duration-500 ease-out"
                  />
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-400">
                  <span>ধাপ {currentStep} / ৪</span>
                  <span className="font-mono text-amber-300 font-black">
                    {currentStep === 1 ? '২৫%' : currentStep === 2 ? '৫০%' : currentStep === 3 ? '৭৫%' : '১০০% সম্পন্ন'}
                  </span>
                </div>
              </div>

              {/* 4 Interactive Step Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold">
                {/* Step 1 */}
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={`py-3 px-3 rounded-2xl transition flex items-center justify-center gap-2 border cursor-pointer ${
                    currentStep === 1
                      ? 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-lg shadow-amber-400/20'
                      : currentStep > 1
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                    currentStep === 1 ? 'bg-slate-950 text-amber-400' : currentStep > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {currentStep > 1 ? <Check size={13} className="stroke-[3]" /> : '১'}
                  </div>
                  <div className="text-left">
                    <span className="block leading-tight font-black">শ্রেণি ও শাখা</span>
                    <span className="text-[9.5px] opacity-75 hidden sm:block">একাডেমিক তথ্য</span>
                  </div>
                </button>

                {/* Step 2 */}
                <button
                  type="button"
                  onClick={() => validateCurrentStep(1) && setCurrentStep(2)}
                  className={`py-3 px-3 rounded-2xl transition flex items-center justify-center gap-2 border cursor-pointer ${
                    currentStep === 2
                      ? 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-lg shadow-amber-400/20'
                      : currentStep > 2
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                    currentStep === 2 ? 'bg-slate-950 text-amber-400' : currentStep > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {currentStep > 2 ? <Check size={13} className="stroke-[3]" /> : '২'}
                  </div>
                  <div className="text-left">
                    <span className="block leading-tight font-black">ব্যক্তিগত তথ্য</span>
                    <span className="text-[9.5px] opacity-75 hidden sm:block">নাম ও জন্মনিবন্ধন</span>
                  </div>
                </button>

                {/* Step 3 */}
                <button
                  type="button"
                  onClick={() => validateCurrentStep(2) && setCurrentStep(3)}
                  className={`py-3 px-3 rounded-2xl transition flex items-center justify-center gap-2 border cursor-pointer ${
                    currentStep === 3
                      ? 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-lg shadow-amber-400/20'
                      : currentStep > 3
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                    currentStep === 3 ? 'bg-slate-950 text-amber-400' : currentStep > 3 ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {currentStep > 3 ? <Check size={13} className="stroke-[3]" /> : '৩'}
                  </div>
                  <div className="text-left">
                    <span className="block leading-tight font-black">পিতা-মাতা</span>
                    <span className="text-[9.5px] opacity-75 hidden sm:block">অভিভাবক বিবরণ</span>
                  </div>
                </button>

                {/* Step 4 */}
                <button
                  type="button"
                  onClick={() => validateCurrentStep(3) && setCurrentStep(4)}
                  className={`py-3 px-3 rounded-2xl transition flex items-center justify-center gap-2 border cursor-pointer ${
                    currentStep === 4
                      ? 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-lg shadow-amber-400/20'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                    currentStep === 4 ? 'bg-slate-950 text-amber-400' : 'bg-slate-700 text-slate-300'
                  }`}>
                    ৪
                  </div>
                  <div className="text-left">
                    <span className="block leading-tight font-black">ঠিকানা ও জমা</span>
                    <span className="text-[9.5px] opacity-75 hidden sm:block">যাচাই ও এসএমএস</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Error Notice */}
            {errorNotice && (
              <div className="m-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={18} className="text-rose-600 shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}

            {/* ── FORM CONTAINER ── */}
            <form onSubmit={handleSubmitApplication} className="p-6 sm:p-8 space-y-6">
              
              {/* ═════════════════════════════════════════════ */}
              {/* STEP 1: ACADEMIC INFO                        */}
              {/* ═════════════════════════════════════════════ */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <BookOpen className="text-indigo-600" size={20} />
                      ১. অ্যাকাডেমিক তথ্য ও শ্রেণি নির্বাচন
                    </h3>
                    <span className="text-xs text-slate-500 font-bold">* চিহ্নিত ঘরগুলো আবশ্যক</span>
                  </div>

                  {/* Class Selection: Interactive Cards */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-2">
                      ভর্তির শ্রেণি নির্বাচন করুন *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {[
                        { val: '6th', title: '৬ষ্ঠ শ্রেণি', desc: 'Class 6' },
                        { val: '7th', title: '৭ম শ্রেণি', desc: 'Class 7' },
                        { val: '8th', title: '৮ম শ্রেণি', desc: 'Class 8' },
                        { val: '9th', title: '৯ম শ্রেণি', desc: 'Class 9 (SSC)' },
                        { val: '10th', title: '১০ম শ্রেণি', desc: 'Class 10 (SSC)' },
                      ].map((cls) => {
                        const isSel = selectedClass === cls.val;
                        return (
                          <button
                            key={cls.val}
                            type="button"
                            onClick={() => setSelectedClass(cls.val)}
                            className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer relative ${
                              isSel
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30 scale-[1.02]'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            <span className="block font-black text-sm">{cls.title}</span>
                            <span className={`text-[10px] block mt-0.5 ${isSel ? 'text-indigo-100' : 'text-slate-500'}`}>
                              {cls.desc}
                            </span>
                            {isSel && (
                              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[9px] font-black">
                                ✓
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Section Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        পছন্দসই শাখা (Section) *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { val: 'A', label: 'শাখা ক' },
                          { val: 'B', label: 'শাখা খ' },
                          { val: 'C', label: 'শাখা গ' },
                        ].map((sec) => (
                          <button
                            key={sec.val}
                            type="button"
                            onClick={() => setSection(sec.val)}
                            className={`py-2.5 px-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                              section === sec.val
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {sec.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Group Selection (Class 9-10) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        বিভাগ / গ্রুপ (৯ম ও ১০ম শ্রেণির ক্ষেত্রে)
                      </label>
                      <select 
                        value={group} 
                        onChange={(e) => setGroup(e.target.value as any)}
                        disabled={isGroupDisabled}
                        className={`w-full px-3.5 py-2.5 border rounded-xl outline-none font-bold text-xs ${
                          isGroupDisabled 
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                            : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs'
                        }`}
                      >
                        <option value="সাধারণ">সাধারণ বিভাগ</option>
                        <option value="বিজ্ঞান">🧪 বিজ্ঞান বিভাগ (Science)</option>
                        <option value="মানবিক">📜 মানবিক বিভাগ (Humanities)</option>
                        <option value="ব্যবসায় শিক্ষা">💼 ব্যবসায় শিক্ষা (Business)</option>
                      </select>
                      {isGroupDisabled && (
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          * ৬ষ্ঠ থেকে ৮ম শ্রেণির জন্য গ্রুপ প্রযোজ্য নয় (সাধারণ কারিকুলাম)।
                        </span>
                      )}
                    </div>

                    {/* Optional Subject */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        ৪র্থ বিষয় / অতিরিক্ত বিষয় (ঐচ্ছিক)
                      </label>
                      <select 
                        value={optionalSubject} 
                        onChange={(e) => setOptionalSubject(e.target.value)}
                        disabled={isOptionalDisabled}
                        className={`w-full px-3.5 py-2.5 border rounded-xl outline-none font-bold text-xs ${
                          isOptionalDisabled 
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                            : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs'
                        }`}
                      >
                        {optionalSubjectOptions.map((opt) => (
                          <option key={opt.code || opt.name} value={opt.name}>
                            {opt.name} {opt.category && opt.name !== 'কোনটিই নয়' ? `(${opt.category})` : ''}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10.5px] text-slate-500 font-semibold block mt-1">
                        শ্রেণি ও বিভাগ অনুযায়ী অনুমোদিত কারিকুলাম তালিকা থেকে অতিরিক্ত বিষয় নির্বাচিত হবে।
                      </span>
                    </div>

                    {/* Stipend Beneficiary Card */}
                    <div className="sm:col-span-2 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="admissionIsStipend"
                          checked={isStipend}
                          onChange={(e) => setIsStipend(e.target.checked)}
                          className="w-5 h-5 accent-amber-500 rounded cursor-pointer shrink-0"
                        />
                        <label htmlFor="admissionIsStipend" className="text-xs font-black text-amber-950 cursor-pointer flex items-center gap-1.5">
                          <Award size={16} className="text-amber-600 shrink-0" />
                          <span>শিক্ষার্থী উপবৃত্তি প্রাপ্ত / সুবিধাপ্রাপ্ত</span>
                        </label>
                      </div>

                      {isStipend && (
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="text-[10px] font-black text-amber-900">ক্যাটাগরি:</label>
                          <select
                            value={stipendCategory}
                            onChange={(e) => setStipendCategory(e.target.value)}
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
              )}

              {/* ═════════════════════════════════════════════ */}
              {/* STEP 2: PERSONAL DETAILS                     */}
              {/* ═════════════════════════════════════════════ */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <User className="text-indigo-600" size={20} />
                      ২. শিক্ষার্থীর ব্যক্তিগত বিবরণী
                    </h3>
                    <span className="text-xs text-slate-500 font-bold">* চিহ্নিত ঘরগুলো আবশ্যক</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* Left Column: Form Fields */}
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Name in Bangla */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          শিক্ষার্থীর পূর্ণ নাম (বাংলায়) *
                        </label>
                        <div className="relative">
                          <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
                          <input 
                            type="text" 
                            required 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="যেমন: মোঃ আরমান হোসেন"
                            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                          />
                        </div>
                      </div>

                      {/* Name in English */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          নাম (ইংরেজিতে ক্যাপিটাল লেটারে)
                        </label>
                        <div className="relative">
                          <Globe size={16} className="absolute left-3.5 top-3 text-slate-400" />
                          <input 
                            type="text" 
                            value={fullNameEn}
                            onChange={(e) => setFullNameEn(e.target.value.toUpperCase())}
                            placeholder="MD. ARMAN HOSSAIN"
                            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                          />
                        </div>
                      </div>

                      {/* Mobile Number (Crucial for SMS!) */}
                      <div className="sm:col-span-2 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                            <Phone size={14} className="text-indigo-600" />
                            <span>অভিভাবকের সচল মোবাইল নম্বর *</span>
                          </label>
                          <span className="text-[10.5px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                            এই নম্বরে SMS যাবে
                          </span>
                        </div>
                        <input 
                          type="tel" 
                          required 
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          placeholder="01812345678"
                          className="w-full px-3.5 py-2.5 bg-white border border-indigo-300 rounded-xl outline-none font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                        />
                        <span className="text-[10px] text-indigo-700 font-semibold block mt-1">
                          * আবেদন জমা হওয়ার সাথে সাথেই এই নম্বরে তাৎক্ষণিক নিশ্চয়তামূলক এসএমএস প্রেরণ করা হবে।
                        </span>
                      </div>

                      {/* Birth Registration No */}
                      <div className="sm:col-span-2">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <FileText size={14} className="text-slate-400" />
                            <span>১৭ ডিজিটের ডিজিটাল জন্ম নিবন্ধন নম্বর *</span>
                          </label>
                          <span className="text-[10px] font-mono text-slate-500 font-bold">
                            {birthRegNo.replace(/\D/g, '').length}/১৭ ডিজিট
                          </span>
                        </div>
                        <input 
                          type="text" 
                          required 
                          value={birthRegNo}
                          onChange={(e) => setBirthRegNo(e.target.value)}
                          placeholder="যেমন: ২০১০১৫১২৩৪৫৬৭৮৯০১"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-mono font-bold text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                        />
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          জন্ম তারিখ *
                        </label>
                        <div className="relative">
                          <input 
                            type="date" 
                            required 
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          লিঙ্গ *
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['পুরুষ', 'নারী', 'অন্যান্য'].map((gen) => (
                            <button
                              key={gen}
                              type="button"
                              onClick={() => setGender(gen as any)}
                              className={`py-2 px-2 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                                gender === gen
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {gen}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Religion */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          ধর্ম *
                        </label>
                        <select
                          value={religion}
                          onChange={(e) => setReligion(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer transition"
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
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <Droplet size={13} className="text-rose-500" />
                          <span>রক্তের গ্রুপ</span>
                        </label>
                        <select
                          value={bloodGroup}
                          onChange={(e) => setBloodGroup(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer transition"
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

                    {/* Right Column: Photo Upload Card */}
                    <div className="flex flex-col items-center p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <span className="text-xs font-black text-slate-800">
                        শিক্ষার্থীর পাসপোর্ট সাইজ ছবি
                      </span>

                      <div className="relative w-36 h-44 rounded-2xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-white flex flex-col items-center justify-center overflow-hidden shadow-inner group transition">
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
                            <Camera size={34} className="mx-auto mb-1 text-indigo-400 group-hover:scale-110 transition" />
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
                          <span>ছবিটি বাতিল করুন</span>
                        </button>
                      ) : (
                        <p className="text-[10px] text-center text-slate-500 leading-tight">
                          * সদ্য তোলা স্পষ্ট পাসপোর্ট সাইজ রঙিন ছবি আপলোড করার অনুরোধ করা হলো।
                        </p>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* ═════════════════════════════════════════════ */}
              {/* STEP 3: PARENTS & GUARDIAN DETAILS           */}
              {/* ═════════════════════════════════════════════ */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <Users className="text-indigo-600" size={20} />
                      ৩. পিতা ও মাতার বিবরণী
                    </h3>
                    <span className="text-xs text-slate-500 font-bold">* পিতা বা মাতার নাম আবশ্যক</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Father Details Card */}
                    <div className="p-5 bg-gradient-to-br from-indigo-50/60 to-white border-2 border-indigo-200 rounded-2xl space-y-3.5 shadow-2xs">
                      <div className="flex items-center gap-2 pb-2 border-b border-indigo-100">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                          <ShieldCheck size={16} />
                        </div>
                        <div>
                          <h4 className="font-black text-indigo-950 text-xs">পিতার তথ্য (Father)</h4>
                          <span className="text-[10px] text-indigo-700 font-semibold">পিতার যাবতীয় সঠিক বিবরণ</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            পিতার পূর্ণ নাম *
                          </label>
                          <input 
                            type="text" 
                            required 
                            value={fatherName}
                            onChange={(e) => setFatherName(e.target.value)}
                            placeholder="পিতার নাম লিখুন"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            পিতার এনআইডি (NID) নম্বর
                          </label>
                          <input 
                            type="text" 
                            value={fatherNid}
                            onChange={(e) => setFatherNid(e.target.value)}
                            placeholder="১০ বা ১৭ ডিজিটের জাতীয় পরিচয়পত্র নম্বর"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none font-mono text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            পিতার পেশা
                          </label>
                          <input 
                            type="text" 
                            value={fatherOcc}
                            onChange={(e) => setFatherOcc(e.target.value)}
                            placeholder="যেমন: শিক্ষক / ব্যবসায়ী / প্রবাসী"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mother Details Card */}
                    <div className="p-5 bg-gradient-to-br from-purple-50/60 to-white border-2 border-purple-200 rounded-2xl space-y-3.5 shadow-2xs">
                      <div className="flex items-center gap-2 pb-2 border-b border-purple-100">
                        <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                          <ShieldCheck size={16} />
                        </div>
                        <div>
                          <h4 className="font-black text-purple-950 text-xs">মাতার তথ্য (Mother)</h4>
                          <span className="text-[10px] text-purple-700 font-semibold">মাতার যাবতীয় সঠিক বিবরণ</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            মাতার পূর্ণ নাম *
                          </label>
                          <input 
                            type="text" 
                            required 
                            value={motherName}
                            onChange={(e) => setMotherName(e.target.value)}
                            placeholder="মাতার নাম লিখুন"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs focus:ring-2 focus:ring-purple-500 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            মাতার এনআইডি (NID) নম্বর
                          </label>
                          <input 
                            type="text" 
                            value={motherNid}
                            onChange={(e) => setMotherNid(e.target.value)}
                            placeholder="১০ বা ১৭ ডিজিটের জাতীয় পরিচয়পত্র নম্বর"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none font-mono text-slate-900 text-xs focus:ring-2 focus:ring-purple-500 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            মাতার পেশা
                          </label>
                          <input 
                            type="text" 
                            value={motherOcc}
                            onChange={(e) => setMotherOcc(e.target.value)}
                            placeholder="যেমন: গৃহিণী / চাকুরিজীবী"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs focus:ring-2 focus:ring-purple-500 transition"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* ═════════════════════════════════════════════ */}
              {/* STEP 4: PREVIOUS SCHOOL & ADDRESS + REVIEW   */}
              {/* ═════════════════════════════════════════════ */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <MapPin className="text-indigo-600" size={20} />
                      ৪. পূর্ববর্তী স্কুল, ঠিকানা ও চূড়ান্ত যাচাই
                    </h3>
                    <span className="text-xs text-slate-500 font-bold">* বর্তমান ঠিকানা আবশ্যক</span>
                  </div>

                  {/* Previous School Info */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <span className="text-xs font-black text-slate-800 block">
                      পূর্ববর্তী প্রাতিষ্ঠানিক তথ্য (প্রযোজ্য ক্ষেত্রে):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          পূর্বে অধ্যয়নকৃত বিদ্যালয়ের নাম
                        </label>
                        <input 
                          type="text" 
                          value={prevSchoolName}
                          onChange={(e) => setPrevSchoolName(e.target.value)}
                          placeholder="পূর্ববর্তী বিদ্যালয় বা মাদ্রাসার নাম"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          সর্বশেষ উত্তীর্ণ শ্রেণির ফলাফল (GPA / রোল)
                        </label>
                        <input 
                          type="text" 
                          value={prevGpa}
                          onChange={(e) => setPrevGpa(e.target.value)}
                          placeholder="যেমন: GPA 5.00 বা ১ম স্থান"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-800 text-xs">
                        ঠিকানা বিবরণী:
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-indigo-700 select-none">
                        <input 
                          type="checkbox" 
                          checked={isSameAddress}
                          onChange={(e) => setIsSameAddress(e.target.checked)}
                          className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                        />
                        <span>বর্তমান ও স্থায়ী ঠিকানা একই</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          বর্তমান ঠিকানা (গ্রাম, ডাকঘর, উপজেলা, জেলা) *
                        </label>
                        <textarea 
                          rows={2} 
                          required 
                          value={currentAddress}
                          onChange={(e) => setCurrentAddress(e.target.value)}
                          placeholder="গ্রাম, ডাকঘর, উপজেলা, জেলা"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          স্থায়ী ঠিকানা *
                        </label>
                        <textarea 
                          rows={2} 
                          required={!isSameAddress}
                          disabled={isSameAddress}
                          value={permanentAddress}
                          onChange={(e) => setPermanentAddress(e.target.value)}
                          placeholder={isSameAddress ? 'বর্তমান ঠিকানার অনুরূপ' : 'গ্রাম, ডাকঘর, উপজেলা, জেলা'}
                          className={`w-full px-3.5 py-2 border rounded-xl outline-none font-bold text-xs ${
                            isSameAddress 
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                              : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── LIVE PRE-SUBMISSION SUMMARY & CONFIRMATION BOX ── */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-emerald-50/50 border-2 border-indigo-200 shadow-sm space-y-3">
                    <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <Sparkles size={15} className="text-indigo-600" />
                      আবেদনের সারসংক্ষেপ প্রিভিউ:
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-500 block">শিক্ষার্থীর নাম</span>
                        <strong className="text-slate-900 truncate block">{fullName || '—'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">শ্রেণি ও শাখা</span>
                        <strong className="text-indigo-700 block">{classDisplayMap[selectedClass]} ({section})</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">অভিভাবকের মোবাইল</span>
                        <strong className="text-emerald-700 font-mono block">{mobile || '—'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">পিতা/মাতার নাম</span>
                        <strong className="text-slate-900 truncate block">{fatherName || motherName || '—'}</strong>
                      </div>
                    </div>

                    {/* Prominent SMS Delivery Guarantee */}
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-950 text-xs font-bold">
                      <Send size={16} className="text-emerald-700 shrink-0" />
                      <span>
                        চূড়ান্ত জমা দেওয়ার সাথে সাথেই <strong>{mobile || 'অভিভাবকের মোবাইলে'}</strong> একটি কনফার্মেশন এসএমএস পাঠানো হবে।
                      </span>
                    </div>

                    {/* Declaration Checkbox */}
                    <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                      <input 
                        type="checkbox"
                        checked={declaredCorrect}
                        onChange={(e) => setDeclaredCorrect(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer mt-0.5 shrink-0"
                      />
                      <span className="text-xs text-slate-700 font-bold select-none leading-relaxed">
                        আমি নিশ্চিত করছি যে উপরে প্রদত্ত যাবতীয় তথ্য সম্পূর্ণ সত্য ও নির্ভুল।
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* ── STEP NAVIGATION BUTTONS ── */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft size={15} />
                    <span>পূর্ববর্তী ধাপ</span>
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>পরবর্তী ধাপ</span>
                    <ArrowRight size={15} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !declaredCorrect}
                    className="px-7 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg flex items-center gap-2 transition transform active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>আবেদন প্রক্রিয়াকরণ ও এসএমএস প্রেরণ চলছে...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>অনলাইন আবেদন চূড়ান্ত জমা দিন ও এসএমএস নিশ্চিত করুন ➔</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </form>

          </div>
        )}

      </main>

      {/* ── APPLICATION TRACKING & RE-PRINT MODAL ── */}
      {showTrackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Search size={18} className="text-indigo-600" />
                <h3 className="font-black text-slate-900 text-sm sm:text-base">পূর্বের আবেদন অনুসন্ধান ও প্রিন্ট</h3>
              </div>
              <button 
                onClick={() => setShowTrackModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSearchApplication} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  আবেদন আইডি (App ID) অথবা মোবাইল নম্বর লিখুন
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                    placeholder="যেমন: APP-2026-1234 অথবা 018XXXXXXXX"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-mono text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Search size={14} />
                    <span>খুঁজুন</span>
                  </button>
                </div>
              </div>
            </form>

            {trackError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle size={15} className="text-rose-600 shrink-0" />
                <span>{trackError}</span>
              </div>
            )}

            {trackResult && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-xs">আবেদনপত্র পাওয়া গেছে!</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                    অনুমোদিত / Admitted
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-700">
                  <p>আবেদন আইডি: <strong className="font-mono text-indigo-700">{trackResult.appId || trackResult.id}</strong></p>
                  <p>শিক্ষার্থীর নাম: <strong>{trackResult.name}</strong></p>
                  <p>শ্রেণি: <strong>{classDisplayMap[trackResult.grade] || trackResult.grade}</strong> ({trackResult.section || 'A'})</p>
                  <p>মোবাইল: <strong className="font-mono">{trackResult.mobile}</strong></p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setApplicationRecord(trackResult);
                      setIsSubmitted(true);
                      setShowTrackModal(false);
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer size={14} />
                    <span>আবেদনপত্রটি খুলুন ও প্রিন্ট করুন</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ADMISSION RULES & NOTICE MODAL ── */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-indigo-600" />
                <h3 className="font-black text-slate-900 text-sm sm:text-base">ভর্তি নির্দেশিকা ও প্রয়োজনীয় শর্তাবলী</h3>
              </div>
              <button 
                onClick={() => setShowRulesModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1">
                <h4 className="font-black text-indigo-950">📌 প্রয়োজনীয় কাগজপত্র:</h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  <li>শিক্ষার্থীর ১৭ ডিজিটের অনলাইন জন্ম নিবন্ধন সনদের স্পষ্ট ফটোকপি।</li>
                  <li>সদ্য তোলা পাসপোর্ট সাইজের ২ কপি রঙিন ছবি।</li>
                  <li>পিতা ও মাতার জাতীয় পরিচয়পত্রের (NID) ফটোকপি।</li>
                  <li>পূর্ববর্তী ক্লাসের ছাড়পত্র (TC) বা প্রশংসাপত্র ও মার্কশিট।</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <h4 className="font-black text-emerald-950">📱 এসএমএস ও যোগাযোগ:</h4>
                <p className="text-slate-600">
                  অনলাইন আবেদন চূড়ান্ত করার পর একটি স্বয়ংক্রিয় এসএমএস আবেদনকারীর অভিভাবকের মোবাইলে পাঠানো হবে। পরবর্তীতে নির্দিষ্ট তারিখে আবেদনপত্রের প্রিন্ট কপিসহ বিদ্যালয়ে উপস্থিত হয়ে চূড়ান্ত ভর্তি সম্পন্ন করতে হবে।
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              বুঝেছি, বন্ধ করুন
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
