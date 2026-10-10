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
  CreditCard,
  Building2,
  Award,
  Info,
  X,
  Check,
  ArrowRight,
  ChevronRight,
  QrCode,
  Globe
} from 'lucide-react';
import QRCode from 'qrcode';
import Link from 'next/link';
import { studentService } from '@/services/studentService';
import { settingsService } from '@/services/settingsService';
import { curriculumService } from '@/services/curriculumService';
import OfficialAdmissionForm from '@/components/OfficialAdmissionForm';
import { compressImage } from '@/lib/imageUtils';

export default function PublicOnlineAdmissionPage() {
  const [schoolSettings, setSchoolSettings] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);

  useEffect(() => {
    setSchoolSettings(settingsService.getSettings());
    return settingsService.subscribe((s) => {
      setSchoolSettings(s);
    });
  }, []);

  // Form Fields
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

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationRecord, setApplicationRecord] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [errorNotice, setErrorNotice] = useState<string>('');

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
      QRCode.toDataURL(applicationRecord.appId, { margin: 1, width: 120 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error(err));
    }
  }, [applicationRecord]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert('ছবি সাইজ সর্বোচ্চ ৫MB হতে পারবে।');
      const compressed = await compressImage(file);
      setPhoto(compressed);
    }
  };

  const validateCurrentStep = (step: number): boolean => {
    setErrorNotice('');
    if (step === 1) {
      if (!selectedClass) {
        setErrorNotice('ভর্তির শ্রেণি নির্বাচন করুন।');
        return false;
      }
    } else if (step === 2) {
      if (!fullName.trim()) {
        setErrorNotice('শিক্ষার্থীর পূর্ণ নাম (বাংলায়) লিখুন।');
        return false;
      }
      if (!mobile.trim() || mobile.length < 11) {
        setErrorNotice('অভিভাবকের সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন।');
        return false;
      }
      if (!birthRegNo.trim()) {
        setErrorNotice('১৭ ডিজিটের জন্ম নিবন্ধন নম্বর অবশ্যই প্রদান করতে হবে।');
        return false;
      }
      if (!dob) {
        setErrorNotice('শিক্ষার্থীর জন্ম তারিখ নির্বাচন করুন।');
        return false;
      }
    } else if (step === 3) {
      if (!fatherName.trim() && !motherName.trim()) {
        setErrorNotice('পিতা বা মাতার নাম অবশ্যই পূরণ করুন।');
        return false;
      }
    } else if (step === 4) {
      if (!currentAddress.trim()) {
        setErrorNotice('বর্তমান ঠিকানা প্রদান করুন।');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep(currentStep)) {
      setCurrentStep(prev => Math.min(4, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setErrorNotice('');
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep(4)) return;

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
      status: 'Admitted'
    };

    // Save to Central Student Database
    const registeredStudent = studentService.addStudent(studentData);
    setApplicationRecord({
      ...registeredStudent,
      appId: autoAppId
    });

    // Also persist in online applications list
    if (typeof window !== 'undefined') {
      const storedApps = localStorage.getItem('sms_online_applications');
      let appList: any[] = [];
      if (storedApps) {
        try { appList = JSON.parse(storedApps); } catch (err) {}
      }
      appList.unshift(studentData);
      localStorage.setItem('sms_online_applications', JSON.stringify(appList));
    }

    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetForm = () => {
    setFullName('');
    setFullNameEn('');
    setSelectedClass('6th');
    setSection('A');
    setGroup('সাধারণ');
    setOptionalSubject('কৃষি');
    setMobile('');
    setDob('');
    setGender('পুরুষ');
    setReligion('ইসলাম');
    setBloodGroup('A+');
    setBirthRegNo('');
    setPhoto('');
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
  };

  const schoolName = schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const schoolAddress = schoolSettings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার';
  const eiinNumber = schoolSettings?.eiin || '১০৬২৮৮';
  const schoolLogo = schoolSettings?.schoolLogo;

  const isGroupDisabled = selectedClass === '6th' || selectedClass === '7th' || selectedClass === '8th';
  const isOptionalDisabled = isGroupDisabled;

  // If Online Admission is turned OFF in Settings
  if (schoolSettings && schoolSettings.onlineAdmissionEnabled === false) {
    return (
      <div className="min-h-screen bg-slate-100 font-sans pb-16 text-slate-900">
        <header className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white shadow-xl sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {schoolLogo ? (
                <img src={schoolLogo} alt="School Logo" className="w-10 h-10 object-contain rounded-xl bg-white/10 p-1" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow">
                  <School size={22} />
                </div>
              )}
              <div>
                <h1 className="font-black text-sm sm:text-base tracking-tight leading-tight">{schoolName}</h1>
                <p className="text-[10px] text-indigo-200 font-bold">{schoolAddress} | ইআইআইএন: {eiinNumber}</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition"
            >
              ড্যাশবোর্ড
            </Link>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 pt-12 text-center">
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

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <School size={16} className="text-indigo-600 shrink-0" />
                <span>{schoolName}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={16} className="text-slate-400 shrink-0" />
                <span>{schoolAddress}</span>
              </div>
              {schoolSettings.phone && (
                <div className="flex items-center gap-2 text-slate-600 font-mono">
                  <Phone size={16} className="text-slate-400 shrink-0" />
                  <span>হেল্পলাইন: {schoolSettings.phone}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                বিদ্যালয় ড্যাশবোর্ডে প্রবেশ ➔
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-16 text-slate-900 print:bg-white print:p-0">
      
      {/* Top Branding Navigation Bar */}
      <header className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white shadow-xl sticky top-0 z-40 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {schoolLogo ? (
              <img src={schoolLogo} alt="School Logo" className="w-10 h-10 object-contain rounded-xl bg-white/10 p-1" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow">
                <School size={22} />
              </div>
            )}
            <div>
              <h1 className="font-black text-sm sm:text-base tracking-tight leading-tight">{schoolName}</h1>
              <p className="text-[10px] text-indigo-200 font-bold">{schoolAddress} | ইআইআইএন: {eiinNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase rounded-full items-center gap-1">
              <Globe size={12} /> অনলাইন আবেদন পোর্টাল ২০২৬
            </span>
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition"
            >
              ড্যাশবোর্ড
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">

        {/* COMPACT & ELEGANT ADMISSION HEADER */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
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
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ভর্তি কার্যক্রম চলমান
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* SUCCESS CONFIRMATION SLIP (AFTER SUBMIT)  */}
        {/* ═══════════════════════════════════════════ */}
        {isSubmitted && applicationRecord ? (
          <OfficialAdmissionForm
            data={{
              ...applicationRecord,
              qrCodeUrl: qrCodeUrl,
            }}
            settings={schoolSettings}
            onPrint={() => window.print()}
            onClose={handleResetForm}
          />
        ) : (
          /* ═══════════════════════════════════════════ */
          /* MULTI-STEP ONLINE ADMISSION WIZARD FORM     */
          /* ═══════════════════════════════════════════ */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:hidden">
            
            {/* Step Progress Wizard Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 border-b border-slate-800">
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={`py-2 px-2 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                    currentStep === 1 ? 'bg-amber-400 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen size={15} />
                  <span>১. শ্রেণি ও শাখা</span>
                </button>

                <button
                  type="button"
                  onClick={() => validateCurrentStep(1) && setCurrentStep(2)}
                  className={`py-2 px-2 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                    currentStep === 2 ? 'bg-amber-400 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <User size={15} />
                  <span>২. ব্যক্তিগত তথ্য</span>
                </button>

                <button
                  type="button"
                  onClick={() => validateCurrentStep(2) && setCurrentStep(3)}
                  className={`py-2 px-2 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                    currentStep === 3 ? 'bg-amber-400 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users size={15} />
                  <span>৩. পিতা-মাতার তথ্য</span>
                </button>

                <button
                  type="button"
                  onClick={() => validateCurrentStep(3) && setCurrentStep(4)}
                  className={`py-2 px-2 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                    currentStep === 4 ? 'bg-amber-400 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <MapPin size={15} />
                  <span>৪. ঠিকানা ও স্কুল</span>
                </button>
              </div>
            </div>

            {/* Error Notice */}
            {errorNotice && (
              <div className="m-5 p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <Info size={16} className="text-rose-600 shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}

            {/* FORM CONTAINER */}
            <form onSubmit={handleSubmitApplication} className="p-6 sm:p-8 space-y-6 text-xs font-medium">
              
              {/* STEP 1: ACADEMIC INFO */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
                    <BookOpen className="text-indigo-600" size={18} />
                    ১. একাডেমিক তথ্য
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">ভর্তির শ্রেণি *</label>
                      <select 
                        value={selectedClass} 
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl outline-none font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="6th">৬ষ্ঠ শ্রেণি</option>
                        <option value="7th">৭ম শ্রেণি</option>
                        <option value="8th">৮ম শ্রেণি</option>
                        <option value="9th">৯ম শ্রেণি</option>
                        <option value="10th">১০ম শ্রেণি</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">পছন্দসই শাখা *</label>
                      <select 
                        value={section} 
                        onChange={(e) => setSection(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl outline-none font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="A">শাখা ক</option>
                        <option value="B">শাখা খ</option>
                        <option value="C">শাখা গ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">বিভাগ / গ্রুপ (৯ম-১০ম শ্রেণি)</label>
                      <select 
                        value={group} 
                        onChange={(e) => setGroup(e.target.value as any)}
                        disabled={isGroupDisabled}
                        className={`w-full px-3.5 py-2.5 border rounded-2xl outline-none font-bold text-xs ${
                          isGroupDisabled ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-slate-50 text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500 cursor-pointer'
                        }`}
                      >
                        <option value="সাধারণ">সাধারণ</option>
                        <option value="বিজ্ঞান">🧪 বিজ্ঞান</option>
                        <option value="মানবিক">📜 মানবিক</option>
                        <option value="ব্যবসায় শিক্ষা">💼 ব্যবসায় শিক্ষা</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ৪র্থ বিষয় / অতিরিক্ত বিষয় *
                      </label>
                      <select 
                        value={optionalSubject} 
                        onChange={(e) => setOptionalSubject(e.target.value)}
                        disabled={isOptionalDisabled}
                        className={`w-full px-3.5 py-2.5 border rounded-2xl outline-none font-bold text-xs ${
                          isOptionalDisabled ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-slate-50 text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500 cursor-pointer'
                        }`}
                      >
                        {optionalSubjectOptions.map((opt) => (
                          <option key={opt.code || opt.name} value={opt.name}>
                            {opt.name} {opt.category && opt.name !== 'কোনটিই নয়' ? `(${opt.category})` : ''}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                        শ্রেণি ও বিভাগ অনুযায়ী অনুমোদিত কারিকুলাম তালিকা থেকে অতিরিক্ত বিষয় নির্বাচিত হবে।
                      </span>
                    </div>

                    {/* Stipend Beneficiary Checkbox Option */}
                    <div className="sm:col-span-2 bg-amber-50/90 p-4 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                          শিক্ষার্থী উপবৃত্তি প্রাপ্ত
                        </label>
                      </div>

                      {isStipend && (
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="text-[10px] font-black text-amber-800 uppercase">ক্যাটাগরি:</label>
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

              {/* STEP 2: PERSONAL DETAILS */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
                    <User className="text-indigo-600" size={18} />
                    ২. শিক্ষার্থীর ব্যক্তিগত বিবরণী
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
                    <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">শিক্ষার্থীর পূর্ণ নাম (বাংলায়) *</label>
                        <input 
                          type="text" 
                          required 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="যেমন: মোঃ আরমান হোসেন"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">নাম (ইংরেজিতে)</label>
                        <input 
                          type="text" 
                          value={fullNameEn}
                          onChange={(e) => setFullNameEn(e.target.value.toUpperCase())}
                          placeholder="MD. ARMAN HOSSAIN"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">অভিভাবকের মোবাইল নম্বর *</label>
                        <input 
                          type="text" 
                          required 
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          placeholder="01812345678"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl outline-none font-bold text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">১৭ ডিজিটের ডিজিটাল জন্ম নিবন্ধন নম্বর *</label>
                        <input 
                          type="text" 
                          required 
                          value={birthRegNo}
                          onChange={(e) => setBirthRegNo(e.target.value)}
                          placeholder="যেমন: ২০১০১৫১২৩৪৫৬৭৮৯০১"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl outline-none font-bold text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">জন্ম তারিখ *</label>
                        <input 
                          type="date" 
                          required 
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">লিঙ্গ *</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="পুরুষ">পুরুষ</option>
                          <option value="নারী">নারী</option>
                          <option value="অন্যান্য">অন্যান্য</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">ধর্ম *</label>
                        <select
                          value={religion}
                          onChange={(e) => setReligion(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="ইসলাম">ইসলাম</option>
                          <option value="হিন্দু">হিন্দু</option>
                          <option value="খ্রিস্টান">খ্রিস্টান</option>
                          <option value="বৌদ্ধ">বৌদ্ধ</option>
                          <option value="অন্যান্য">অন্যান্য</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">রক্তের গ্রুপ</label>
                        <select
                          value={bloodGroup}
                          onChange={(e) => setBloodGroup(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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

                    {/* Photo Box */}
                    <div className="flex flex-col items-center space-y-2">
                      <label className="block text-xs font-bold text-slate-700">পাসপোর্ট সাইজ ছবি</label>
                      <div className="relative w-32 h-36 border-2 border-dashed border-indigo-300 hover:border-indigo-600 rounded-2xl bg-indigo-50/40 flex flex-col items-center justify-center cursor-pointer overflow-hidden group shadow-inner transition">
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        {photo ? (
                          <img src={photo} alt="Student" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center text-slate-400 p-2">
                            <User size={32} className="mx-auto text-indigo-300 group-hover:scale-110 transition" />
                            <span className="text-[10px] font-extrabold text-indigo-700 block mt-1">ছবি আপলোড</span>
                            <span className="text-[8px] text-slate-400 block mt-0.5">সর্বোচ্চ ২MB</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PARENTS INFO */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
                    <Users className="text-indigo-600" size={18} />
                    ৩. পিতা ও মাতার বিবরণী
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Father Box */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <span className="font-black text-indigo-900 text-xs flex items-center gap-1.5">
                        <ShieldCheck size={16} className="text-indigo-600" /> পিতার তথ্য
                      </span>
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          required 
                          value={fatherName}
                          onChange={(e) => setFatherName(e.target.value)}
                          placeholder="পিতার নাম *"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            value={fatherNid}
                            onChange={(e) => setFatherNid(e.target.value)}
                            placeholder="পিতার এনআইডি নম্বর"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none font-mono text-slate-900 text-xs"
                          />
                          <input 
                            type="text" 
                            value={fatherOcc}
                            onChange={(e) => setFatherOcc(e.target.value)}
                            placeholder="পিতার পেশা"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mother Box */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <span className="font-black text-purple-900 text-xs flex items-center gap-1.5">
                        <ShieldCheck size={16} className="text-purple-600" /> মাতার তথ্য
                      </span>
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          required 
                          value={motherName}
                          onChange={(e) => setMotherName(e.target.value)}
                          placeholder="মাতার নাম *"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            value={motherNid}
                            onChange={(e) => setMotherNid(e.target.value)}
                            placeholder="মাতার এনআইডি নম্বর"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none font-mono text-slate-900 text-xs"
                          />
                          <input 
                            type="text" 
                            value={motherOcc}
                            onChange={(e) => setMotherOcc(e.target.value)}
                            placeholder="মাতার পেশা"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: PREVIOUS SCHOOL & ADDRESS */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
                    <MapPin className="text-indigo-600" size={18} />
                    ৪. পূর্ববর্তী স্কুল ও ঠিকানা বিবরণী
                  </h3>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">পূর্বে অধ্যয়নকৃত বিদ্যালয়ের নাম</label>
                        <input 
                          type="text" 
                          value={prevSchoolName}
                          onChange={(e) => setPrevSchoolName(e.target.value)}
                          placeholder="পূর্বে অধ্যয়নকৃত বিদ্যালয়"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">সর্বশেষ উত্তীর্ণ শ্রেণির ফলাফল</label>
                        <input 
                          type="text" 
                          value={prevGpa}
                          onChange={(e) => setPrevGpa(e.target.value)}
                          placeholder="যেমন: GPA 5.00 বা ১ম স্থান"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="font-bold text-slate-800 text-xs">ঠিকানা বিস্তারিত:</span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-indigo-700 select-none">
                        <input 
                          type="checkbox" 
                          checked={isSameAddress}
                          onChange={(e) => setIsSameAddress(e.target.checked)}
                          className="rounded text-indigo-600 w-4 h-4"
                        />
                        বর্তমান ও স্থায়ী ঠিকানা একই
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">বর্তমান ঠিকানা (গ্রাম/রোড, ডাকঘর, উপজেলা, জেলা) *</label>
                        <textarea 
                          rows={2} 
                          required 
                          value={currentAddress}
                          onChange={(e) => setCurrentAddress(e.target.value)}
                          placeholder="গ্রাম/রোড, ডাকঘর, উপজেলা, জেলা"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-2xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">স্থায়ী ঠিকানা *</label>
                        <textarea 
                          rows={2} 
                          required={!isSameAddress}
                          disabled={isSameAddress}
                          value={permanentAddress}
                          onChange={(e) => setPermanentAddress(e.target.value)}
                          placeholder={isSameAddress ? 'বর্তমান ঠিকানার অনুরূপ' : 'স্থায়ী ঠিকানা'}
                          className={`w-full px-3.5 py-2 border rounded-2xl outline-none font-bold ${
                            isSameAddress ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP NAVIGATION BUTTONS */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl transition cursor-pointer"
                  >
                    ⬅️ পূর্ববর্তী ধাপ
                  </button>
                ) : (
                  <div></div>
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow transition flex items-center gap-2 cursor-pointer"
                  >
                    পরবর্তী ধাপ <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-7 py-3 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-black text-xs rounded-2xl shadow-lg flex items-center gap-2 transition transform active:scale-95 cursor-pointer"
                  >
                    <Save size={16} /> অনলাইন আবেদন চূড়ান্ত জমা দিন
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
