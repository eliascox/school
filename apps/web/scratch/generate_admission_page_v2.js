const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/dashboard/admission/page.tsx');

const content = `'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Globe, 
  Upload, 
  Camera, 
  QrCode as QrIcon, 
  ChevronRight, 
  DollarSign, 
  GraduationCap, 
  Layers, 
  Search, 
  Eye,
  Heart,
  Droplets,
  BadgeCheck,
  CheckCircle,
  Clock,
  Briefcase,
  Home,
  FileCheck2,
  HelpCircle,
  Flame,
  LayoutGrid
} from 'lucide-react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { studentService, Student } from '@/services/studentService';
import { auditTrailService } from '@/services/auditTrailService';
import { settingsService } from '@/services/settingsService';
import { financeService } from '@/services/financeService';

export default function AdmissionPage() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [schoolSettings, setSchoolSettings] = useState<any>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<'form' | 'recent_admissions'>('form');

  // ─── FORM FIELDS ──────────────────────────────────────────────────
  // 1. Academic Info
  const [selectedClass, setSelectedClass] = useState('6th');
  const [section, setSection] = useState('A');
  const [roll, setRoll] = useState('');
  const [group, setGroup] = useState<'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা'>('সাধারণ');
  const [optionalSubject, setOptionalSubject] = useState<'কৃষি' | 'উচ্চতর গণিত' | 'জীববিজ্ঞান' | 'গার্হস্থ্য বিজ্ঞান' | 'কম্পিউটার শিক্ষা' | 'কোনটিই নয়'>('কৃষি');
  const [isStipend, setIsStipend] = useState(false);
  const [stipendCategory, setStipendCategory] = useState('সাধারণ উপবৃত্তি');

  // 2. Personal Info
  const [fullName, setFullName] = useState('');
  const [fullNameEn, setFullNameEn] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'পুরুষ' | 'নারী' | 'অন্যান্য'>('পুরুষ');
  const [religion, setReligion] = useState<'ইসলাম' | 'হিন্দু' | 'বৌদ্ধ' | 'খ্রিস্টান' | 'অন্যান্য'>('ইসলাম');
  const [bloodGroup, setBloodGroup] = useState<string>('A+');
  const [birthRegNo, setBirthRegNo] = useState('');
  const [photo, setPhoto] = useState<string>('');

  // 3. Parents & Guardian Info
  const [fatherName, setFatherName] = useState('');
  const [fatherNid, setFatherNid] = useState('');
  const [fatherOcc, setFatherOcc] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherNid, setMotherNid] = useState('');
  const [motherOcc, setMotherOcc] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('পিতা');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // 4. Previous Academic Record
  const [prevSchoolName, setPrevSchoolName] = useState('');
  const [prevExam, setPrevExam] = useState('বার্ষিক পরীক্ষা');
  const [prevGpa, setPrevGpa] = useState('');
  const [tcNumber, setTcNumber] = useState('');

  // 5. Address Details
  const [currentAddress, setCurrentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [isSameAddress, setIsSameAddress] = useState(false);

  // 6. Admission Fee & Finance
  const [collectAdmissionFee, setCollectAdmissionFee] = useState(true);
  const [admissionFeeAmount, setAdmissionFeeAmount] = useState<number>(1500);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'bKash' | 'Bank Transfer'>('Cash');

  // Modals & Slips
  const [isSuccess, setIsSuccess] = useState(false);
  const [admittedStudent, setAdmittedStudent] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [printableBlankModal, setPrintableBlankModal] = useState(false);
  const [recentSearch, setRecentSearch] = useState('');

  // Initial Load
  useEffect(() => {
    setMounted(true);
    setSchoolSettings(settingsService.getSettings());
    setAllStudents(studentService.getAllStudents());

    const unsubSettings = settingsService.subscribe((s) => setSchoolSettings(s));
    const unsubStudents = studentService.subscribe(() => setAllStudents(studentService.getAllStudents()));
    return () => {
      unsubSettings();
      unsubStudents();
    };
  }, []);

  // Update Admission Fee based on selected class
  useEffect(() => {
    const classFees = financeService.getClassFeesConfig();
    const fee = classFees[selectedClass]?.admission || 1500;
    setAdmissionFeeAmount(fee);
  }, [selectedClass]);

  // Adjust Group & Optional Subject based on Class
  useEffect(() => {
    if (selectedClass === '6th' || selectedClass === '7th' || selectedClass === '8th') {
      setGroup('সাধারণ');
      setOptionalSubject('কোনটিই নয়');
    } else {
      if (group === 'সাধারণ') setGroup('বিজ্ঞান');
      if (group === 'বিজ্ঞান') setOptionalSubject('উচ্চতর গণিত');
      else setOptionalSubject('কৃষি');
    }
  }, [selectedClass]);

  useEffect(() => {
    if (group === 'মানবিক' || group === 'ব্যবসায় শিক্ষা') {
      setOptionalSubject('কৃষি');
    } else if (group === 'বিজ্ঞান') {
      setOptionalSubject('উচ্চতর গণিত');
    }
  }, [group]);

  // Auto-sync permanent address
  useEffect(() => {
    if (isSameAddress) setPermanentAddress(currentAddress);
  }, [currentAddress, isSameAddress]);

  // Generate QR Code
  useEffect(() => {
    if (admittedStudent && admittedStudent.id) {
      QRCode.toDataURL(\`STUDENT_ID:\${admittedStudent.id}|NAME:\${admittedStudent.name}|CLASS:\${admittedStudent.grade}|ROLL:\${admittedStudent.roll}\`, { margin: 1, width: 140 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error(err));
    }
  }, [admittedStudent]);

  // Photo Upload Handler
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert('ছবি সাইজ সর্বোচ্চ ২MB হতে পারবে।');
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Form Completion Calculation (Progress Bar)
  const formProgress = useMemo(() => {
    let score = 0;
    const total = 10;
    if (fullName.trim()) score++;
    if (mobile.trim()) score++;
    if (dob) score++;
    if (roll.trim()) score++;
    if (fatherName.trim()) score++;
    if (motherName.trim()) score++;
    if (birthRegNo.trim()) score++;
    if (currentAddress.trim()) score++;
    if (photo) score++;
    if (prevSchoolName.trim() || selectedClass === '6th') score++;
    return Math.round((score / total) * 100);
  }, [fullName, mobile, dob, roll, fatherName, motherName, birthRegNo, currentAddress, photo, prevSchoolName, selectedClass]);

  // Submit Admission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) return alert('শিক্ষার্থীর নাম (বাংলায়) অবশ্যই পূরণ করতে হবে!');
    if (!mobile.trim()) return alert('অভিভাবকের মোবাইল নম্বর অবশ্যই পূরণ করতে হবে!');

    const studentData: Partial<Student> = {
      name: fullName.trim(),
      grade: selectedClass,
      section,
      branch: section,
      roll: roll.trim() || '০১',
      group,
      optionalSubject: selectedClass === '9th' || selectedClass === '10th' ? optionalSubject : 'সাধারণ',
      dob,
      gender,
      religion,
      bloodGroup,
      fatherName: fatherName.trim(),
      fatherNid: fatherNid.trim(),
      motherName: motherName.trim(),
      motherNid: motherNid.trim(),
      guardian: guardianName.trim() || fatherName.trim() || motherName.trim() || 'অভিভাবক',
      mobile: mobile.trim(),
      birthRegNo: birthRegNo.trim(),
      currentAddress: currentAddress.trim(),
      permanentAddress: permanentAddress.trim(),
      remarks: prevSchoolName.trim() ? \`পূর্বতন প্রতিষ্ঠান: \${prevSchoolName.trim()} (GPA: \${prevGpa.trim() || 'N/A'}, TC: \${tcNumber.trim() || 'N/A'})\` : '',
      photo,
      isStipend,
      stipendCategory: isStipend ? stipendCategory : undefined,
      stipendStatus: isStipend ? 'Active' : undefined,
      session: '2026'
    };

    const admitted = studentService.addStudent(studentData);
    setAdmittedStudent({ ...studentData, id: admitted.id, admissionFee: collectAdmissionFee ? admissionFeeAmount : 0 });

    // Auto-post Admission Fee to Finance Module if checked
    if (collectAdmissionFee && admissionFeeAmount > 0) {
      financeService.postFeeReceiptJournal({
        receiptId: \`ADM-REC-\${Date.now().toString().slice(-6)}\`,
        studentName: fullName.trim(),
        roll: roll.trim() || '০১',
        grade: selectedClass,
        paidAmount: admissionFeeAmount,
        subtotal: admissionFeeAmount,
        discount: 0,
        paymentMethod,
        feeItems: [{ name: 'ভর্তি ফি / নতুন সেশন রেজিস্ট্রেশন', amount: admissionFeeAmount }],
        date: new Date().toISOString().split('T')[0],
        collectedBy: 'ভর্তি শাখা'
      });
    }

    auditTrailService.addLog({
      action: 'Student Admitted',
      category: 'student',
      details: \`\${fullName.trim()} (\${selectedClass}, রোল: \${roll || '০১'}, শাখা: \${section}) নতুন ভর্তি সম্পন্ন হয়েছে।\`,
      performedBy: 'অ্যাডমিন / ভর্তি শাখা',
      status: 'success'
    });

    setIsSuccess(true);
  };

  const handleReset = () => {
    setFullName('');
    setFullNameEn('');
    setRoll('');
    setSection('A');
    setGroup('সাধারণ');
    setOptionalSubject('কৃষি');
    setIsStipend(false);
    setMobile('');
    setDob('');
    setGender('পুরুষ');
    setReligion('ইসলাম');
    setBloodGroup('A+');
    setBirthRegNo('');
    setPhoto('');
    setPrevSchoolName('');
    setPrevExam('বার্ষিক পরীক্ষা');
    setPrevGpa('');
    setTcNumber('');
    setFatherName('');
    setFatherNid('');
    setFatherOcc('');
    setMotherName('');
    setMotherNid('');
    setMotherOcc('');
    setGuardianName('');
    setGuardianRelation('পিতা');
    setEmergencyPhone('');
    setCurrentAddress('');
    setPermanentAddress('');
    setIsSameAddress(false);
    setIsSuccess(false);
    setAdmittedStudent(null);
  };

  const schoolName = schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const schoolAddress = schoolSettings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার';
  const eiinNumber = schoolSettings?.eiin || '106184';
  const schoolLogo = schoolSettings?.schoolLogo;

  // Class enrollment stats
  const classStats = useMemo(() => {
    const stats: Record<string, number> = { '6th': 0, '7th': 0, '8th': 0, '9th': 0, '10th': 0 };
    allStudents.forEach(st => {
      const g = st.grade || '6th';
      if (stats[g] !== undefined) stats[g]++;
    });
    return stats;
  }, [allStudents]);

  // Filtered recent admissions
  const filteredRecent = useMemo(() => {
    return allStudents.filter(s => 
      recentSearch === '' ||
      s.name.toLowerCase().includes(recentSearch.toLowerCase()) ||
      s.roll.includes(recentSearch) ||
      (s.id && s.id.toLowerCase().includes(recentSearch.toLowerCase()))
    ).slice(0, 20);
  }, [allStudents, recentSearch]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-bold tracking-wider">ভর্তি পোর্টাল লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-20 print:p-0 print:m-0">
      
      {/* ─── PRINT STYLES ─────────────────────────────────────────── */}
      <style jsx global>{\`
        @media print {
          body * {
            visibility: hidden;
          }
          #admission-print-area, #admission-print-area * {
            visibility: visible;
          }
          #admission-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 10px;
            background: white !important;
            color: black !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      \`}</style>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* FULL-WIDTH LUXURY HERO HEADER BANNER                          */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-indigo-500/30 print:hidden relative overflow-hidden">
        {/* Glow Circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Institution Crest & Title */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-indigo-600/30 shrink-0 border border-indigo-400/40">
              <UserPlus className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  অফিশিয়াল শিক্ষার্থী ভর্তি ও আইডি পোর্টাল
                </h1>
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black border border-emerald-500/30 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  সেশন ২০২৬
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-1 flex items-center gap-2 font-medium">
                <span>{schoolName}</span>
                <span>•</span>
                <span>EIIN: {eiinNumber}</span>
                <span>•</span>
                <span>মোট রেজিস্টার্ড শিক্ষার্থী: <strong className="text-white font-mono">{allStudents.length} জন</strong></span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* View Switcher Tabs */}
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={\`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all \${
                  activeTab === 'form'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }\`}
              >
                <UserPlus size={15} />
                <span>ভর্তি ফরম</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('recent_admissions')}
                className={\`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all \${
                  activeTab === 'recent_admissions'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }\`}
              >
                <Users size={15} />
                <span>ভর্তি রেজিস্টার ({allStudents.length})</span>
              </button>
            </div>

            {/* Print Blank A4 Form */}
            <button
              type="button"
              onClick={() => setPrintableBlankModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white rounded-2xl font-bold text-xs shadow-md border border-slate-700 transition"
            >
              <Printer size={15} className="text-amber-400" />
              <span>ব্ল্যাঙ্ক ফরম প্রিন্ট</span>
            </button>

            {/* Public Online Admission Link */}
            <Link
              href="/admission"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-600/20 border border-emerald-400/30 transition transform hover:-translate-y-0.5"
            >
              <Globe size={15} />
              <span>অনলাইন আবেদন লিংক ↗</span>
            </Link>
          </div>
        </div>

        {/* Real-time Class Enrollment Status Meter */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-5 mt-6 border-t border-slate-800/90 text-xs">
          {[
            { id: '6th', name: '৬ষ্ঠ শ্রেণি', count: classStats['6th'], max: 120, color: 'from-sky-500 to-blue-600' },
            { id: '7th', name: '৭ম শ্রেণি', count: classStats['7th'], max: 120, color: 'from-emerald-500 to-teal-600' },
            { id: '8th', name: '৮ম শ্রেণি', count: classStats['8th'], max: 120, color: 'from-purple-500 to-indigo-600' },
            { id: '9th', name: '৯ম শ্রেণি', count: classStats['9th'], max: 120, color: 'from-amber-500 to-orange-600' },
            { id: '10th', name: '১০ম শ্রেণি', count: classStats['10th'], max: 120, color: 'from-rose-500 to-pink-600' }
          ].map(c => {
            const pct = Math.min(100, Math.round((c.count / c.max) * 100));
            return (
              <div key={c.id} className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3 space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-300">{c.name}</span>
                  <span className="font-mono font-bold text-indigo-400">{c.count} জন</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={\`h-full bg-gradient-to-r \${c.color} rounded-full transition-all duration-500\`}
                    style={{ width: \`\${pct}%\` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* IF SUCCESS: ADMISSION CONFIRMATION & OFFICIAL RECEIPT SLIP    */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {isSuccess && admittedStudent && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Top Success Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/30 print:hidden">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 text-slate-950 rounded-2xl flex items-center justify-center shadow-lg font-black shrink-0">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h2 className="text-base font-black text-white">ভর্তি রেজিস্ট্রেশন সফলভাবে সম্পন্ন হয়েছে!</h2>
                <p className="text-xs text-emerald-400 mt-0.5">
                  শিক্ষার্থী: <strong>{admittedStudent.name}</strong> • আইডি: <strong className="font-mono">{admittedStudent.id}</strong> • শ্রেণি: {admittedStudent.grade} ({admittedStudent.section})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2"
              >
                <Printer size={16} />
                <span>ভর্তি রসিদ ও প্রত্যয়ন প্রিন্ট (A4)</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
              >
                <RefreshCw size={15} /> 
                <span>নতুন ভর্তি ফরম</span>
              </button>
            </div>
          </div>

          {/* PRINTABLE CONFIRMATION SLIP (A4 PORTRAIT) */}
          <div id="admission-print-area" className="bg-white text-slate-950 p-6 sm:p-8 rounded-2xl border-2 border-slate-900 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-4">
                {schoolLogo ? (
                  <img src={schoolLogo} alt="Logo" className="w-16 h-16 object-contain" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-indigo-900 text-white font-black text-2xl flex items-center justify-center">
                    <School size={28} />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-black tracking-tight">{schoolName}</h1>
                  <p className="text-xs font-bold text-slate-600">{schoolAddress} • EIIN: {eiinNumber}</p>
                  <p className="text-xs font-black text-indigo-800 mt-0.5">অফিশিয়াল শিক্ষার্থী ভর্তি নিশ্চিতকরণ ও আইডি স্লিপ — ২০২৬</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="px-3 py-1 bg-slate-900 text-white font-black text-xs rounded-lg uppercase">
                  অফিস ও শিক্ষার্থী কপি
                </span>
                <p className="text-xs font-mono font-bold mt-1 text-slate-700">ID: {admittedStudent.id}</p>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-12 gap-6 items-start">
              <div className="col-span-9 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">শিক্ষার্থীর নাম</span>
                    <strong className="text-sm font-black text-slate-950">{admittedStudent.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">শ্রেণি ও শাখা</span>
                    <strong className="text-sm font-black text-indigo-900">{admittedStudent.grade} | শাখা: {admittedStudent.section}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">শ্রেণি রোল নম্বর</span>
                    <strong className="text-xs font-black text-slate-900">#{admittedStudent.roll || '০১'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">বিভাগ ও ঐচ্ছিক বিষয়</span>
                    <strong className="text-xs font-black text-slate-900">{admittedStudent.group} ({admittedStudent.optionalSubject})</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">পিতার নাম</span>
                    <strong className="text-xs font-bold text-slate-800">{admittedStudent.fatherName || 'অভিভাবক'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">মাতার নাম</span>
                    <strong className="text-xs font-bold text-slate-800">{admittedStudent.motherName || 'মাতার নাম'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">অভিভাবকের মোবাইল</span>
                    <strong className="text-xs font-mono font-bold text-slate-900">{admittedStudent.mobile}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">জন্ম নিবন্ধন নম্বর</span>
                    <strong className="text-xs font-mono font-bold text-slate-900">{admittedStudent.birthRegNo || 'N/A'}</strong>
                  </div>
                </div>

                <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">বর্তমান ও স্থায়ী ঠিকানা</span>
                  <p className="font-semibold text-slate-800">{admittedStudent.currentAddress || schoolAddress}</p>
                </div>
              </div>

              {/* QR & Photo Box */}
              <div className="col-span-3 flex flex-col items-center justify-center space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                {admittedStudent.photo ? (
                  <img src={admittedStudent.photo} alt="Photo" className="w-24 h-28 object-cover rounded-lg border border-slate-300" />
                ) : (
                  <div className="w-24 h-28 bg-slate-200 border border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-xs font-bold">
                    ছবি
                  </div>
                )}
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20 border border-slate-300 rounded" />
                )}
                <span className="text-[9px] font-mono text-slate-500 font-bold">ডিজিটাল ভেরিফায়েড</span>
              </div>
            </div>

            {/* Signature Block */}
            <div className="flex justify-between items-end pt-12 text-xs border-t border-slate-300 mt-6">
              <div className="text-center">
                <p className="border-t border-slate-900 px-6 font-bold">অভিভাবকের স্বাক্ষর</p>
              </div>
              <div className="text-center">
                <p className="border-t border-slate-900 px-6 font-bold">ভর্তি কর্মকর্তা</p>
              </div>
              <div className="text-center">
                <p className="border-t border-slate-900 px-6 font-bold">প্রধান শিক্ষক</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 1: FULL-SCREEN MAIN ADMISSION FORM & LIVE STUDIO          */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'form' && !isSuccess && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ─── LEFT COLUMN: COMPREHENSIVE MULTI-SECTION FORM (7/12) ─── */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 📌 SECTION 1: ACADEMIC SELECTION */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xs border border-indigo-500/30">
                    ০১
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-indigo-400" />
                      একাডেমিক ও শ্রেণি নির্বাচন (Academic Information)
                    </h3>
                    <p className="text-[11px] text-slate-400">ভর্তির শ্রেণি, শাখা, রোল ও বিভাগ নির্ধারণ করুন</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  সেশন ২০২৬
                </span>
              </div>

              {/* Class Selector Chips */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">ভর্তির শ্রেণি নির্বাচন করুন *</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: '6th', name: '৬ষ্ঠ শ্রেণি' },
                    { id: '7th', name: '৭ম শ্রেণি' },
                    { id: '8th', name: '৮ম শ্রেণি' },
                    { id: '9th', name: '৯ম শ্রেণি' },
                    { id: '10th', name: '১০ম শ্রেণি' }
                  ].map(cls => {
                    const isSelected = selectedClass === cls.id;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => setSelectedClass(cls.id)}
                        className={\`py-2.5 px-2 rounded-2xl text-xs font-bold transition-all border text-center \${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-white'
                        }\`}
                      >
                        {cls.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Section Chips */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">নির্ধারিত শাখা (Section) *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'A', name: 'ক শাখা (A)' },
                      { id: 'B', name: 'খ শাখা (B)' },
                      { id: 'C', name: 'গ শাখা (C)' }
                    ].map(sec => {
                      const isSelected = section === sec.id;
                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => setSection(sec.id)}
                          className={\`py-2 px-1 rounded-xl text-xs font-bold transition-all border text-center \${
                            isSelected
                              ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500 font-black'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
                          }\`}
                        >
                          {sec.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Roll */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">শ্রেণি রোল নম্বর *</label>
                  <input
                    type="text"
                    placeholder="যেমন: ০১"
                    value={roll}
                    onChange={e => setRoll(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white font-bold font-mono focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    required
                  />
                </div>
              </div>

              {/* Group & Optional Subject (9th & 10th only) */}
              {(selectedClass === '9th' || selectedClass === '10th') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 bg-indigo-950/20 p-4 rounded-2xl border border-indigo-500/30">
                  <div>
                    <label className="text-xs font-bold text-indigo-300 block mb-1.5">বিভাগ / গ্রুপ (Group) *</label>
                    <select
                      value={group}
                      onChange={e => setGroup(e.target.value as any)}
                      className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-400"
                    >
                      <option value="বিজ্ঞান">বিজ্ঞান বিভাগ (Science)</option>
                      <option value="মানবিক">মানবিক বিভাগ (Humanities)</option>
                      <option value="ব্যবসায় শিক্ষা">ব্যবসায় শিক্ষা বিভাগ (Business Studies)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-indigo-300 block mb-1.5">ঐচ্ছিক বিষয় (Optional Subject)</label>
                    <select
                      value={optionalSubject}
                      onChange={e => setOptionalSubject(e.target.value as any)}
                      className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-400"
                    >
                      {group === 'বিজ্ঞান' ? (
                        <>
                          <option value="উচ্চতর গণিত">উচ্চতর গণিত (Higher Math)</option>
                          <option value="জীববিজ্ঞান">জীববিজ্ঞান (Biology)</option>
                          <option value="কৃষি">কৃষি শিক্ষা (Agriculture)</option>
                        </>
                      ) : (
                        <>
                          <option value="কৃষি">কৃষি শিক্ষা (Agriculture)</option>
                          <option value="গার্হস্থ্য বিজ্ঞান">গার্হস্থ্য বিজ্ঞান (Home Science)</option>
                          <option value="কম্পিউটার শিক্ষা">কম্পিউটার শিক্ষা</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              )}

              {/* Stipend Flag */}
              <div className="pt-1">
                <label className="flex items-center gap-3 p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                  <input
                    type="checkbox"
                    checked={isStipend}
                    onChange={e => setIsStipend(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
                  />
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-slate-300">শিক্ষার্থী কি সরকারি উপবৃত্তি সুবিধাভোগী? (Stipend Beneficiary)</span>
                    {isStipend && (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        মাসিক বেতন ১০০% মওকুফ
                      </span>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* 📌 SECTION 2: STUDENT PROFILE */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-xs border border-sky-500/30">
                    ০২
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-sky-400" />
                      শিক্ষার্থীর ব্যক্তিগত বিবরণী (Student Profile)
                    </h3>
                    <p className="text-[11px] text-slate-400">নাম, জন্ম নিবন্ধন ও যোগাযোগ নম্বর</p>
                  </div>
                </div>
                <span className="text-[11px] text-rose-400 font-bold">* চিহ্নিত ঘর আবশ্যিক</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name Bangla */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">শিক্ষার্থীর পূর্ণ নাম (বাংলায়) *</label>
                  <input
                    type="text"
                    placeholder="যেমন: মোঃ আরমান হোসেন"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition"
                    required
                  />
                </div>

                {/* Name English */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Full Name (English Block Letters)</label>
                  <input
                    type="text"
                    placeholder="e.g. MD. ARMAN HOSSAIN"
                    value={fullNameEn}
                    onChange={e => setFullNameEn(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white font-bold font-mono uppercase focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Mobile */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">অভিভাবকের মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    placeholder="01812345678"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition"
                    required
                  />
                </div>

                {/* DOB */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">জন্ম তারিখ (Date of Birth) *</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition"
                    required
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">লিঙ্গ (Gender) *</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'পুরুষ', label: 'পুরুষ' },
                      { id: 'নারী', label: 'নারী' }
                    ].map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGender(g.id as any)}
                        className={\`py-2 rounded-xl text-xs font-bold border transition text-center \${
                          gender === g.id
                            ? 'bg-sky-600/30 text-sky-300 border-sky-500 font-black'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }\`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Religion */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">ধর্ম (Religion)</label>
                  <select
                    value={religion}
                    onChange={e => setReligion(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-sky-500"
                  >
                    <option value="ইসলাম">ইসলাম (Islam)</option>
                    <option value="হিন্দু">হিন্দু (Hinduism)</option>
                    <option value="বৌদ্ধ">বৌদ্ধ (Buddhism)</option>
                    <option value="খ্রিস্টান">খ্রিস্টান (Christianity)</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">রক্তের গ্রুপ (Blood Group)</label>
                  <select
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-sky-500"
                  >
                    <option value="A+">A Positive (A+)</option>
                    <option value="A-">A Negative (A-)</option>
                    <option value="B+">B Positive (B+)</option>
                    <option value="B-">B Negative (B-)</option>
                    <option value="O+">O Positive (O+)</option>
                    <option value="O-">O Negative (O-)</option>
                    <option value="AB+">AB Positive (AB+)</option>
                    <option value="AB-">AB Negative (AB-)</option>
                  </select>
                </div>

                {/* Birth Reg */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">১৭ ডিজিটের জন্ম নিবন্ধন নম্বর</label>
                  <input
                    type="text"
                    placeholder="যেমন: ২০১০১৫১২৩৪৫৬৭৮৯০১"
                    value={birthRegNo}
                    onChange={e => setBirthRegNo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* 📌 SECTION 3: PARENTS & GUARDIANS */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs border border-emerald-500/30">
                    ০৩
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      পিতা, মাতা ও অভিভাবকের বিবরণী (Parents Information)
                    </h3>
                    <p className="text-[11px] text-slate-400">পিতা ও মাতার নাম, NID ও জরুরি যোগাযোগের তথ্য</p>
                  </div>
                </div>
              </div>

              {/* Father */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">পিতার নাম (Father Name) *</label>
                  <input
                    type="text"
                    placeholder="পিতার নাম..."
                    value={fatherName}
                    onChange={e => setFatherName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">পিতার জাতীয় পরিচয়পত্র (NID)</label>
                  <input
                    type="text"
                    placeholder="১০/১৩/১৭ ডিজিট NID"
                    value={fatherNid}
                    onChange={e => setFatherNid(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">পিতার পেশা</label>
                  <input
                    type="text"
                    placeholder="যেমন: ব্যবসা / চাকরি / কৃষি"
                    value={fatherOcc}
                    onChange={e => setFatherOcc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Mother */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">মাতার নাম (Mother Name) *</label>
                  <input
                    type="text"
                    placeholder="মাতার নাম..."
                    value={motherName}
                    onChange={e => setMotherName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">মাতার জাতীয় পরিচয়পত্র (NID)</label>
                  <input
                    type="text"
                    placeholder="১০/১৩/১৭ ডিজিট NID"
                    value={motherNid}
                    onChange={e => setMotherNid(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">মাতার পেশা</label>
                  <input
                    type="text"
                    placeholder="যেমন: গৃহিণী / শিক্ষিকা"
                    value={motherOcc}
                    onChange={e => setMotherOcc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* 📌 SECTION 4: PREVIOUS SCHOOL RECORD */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-xs border border-purple-500/30">
                    ০৪
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      পূর্ববর্তী স্কুলের তথ্য (Previous Academic Record)
                    </h3>
                    <p className="text-[11px] text-slate-400">পূর্বে অধ্যয়নরত প্রতিষ্ঠান ও ছাড়পত্রের বিবরণ</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">পূর্ববর্তী শিক্ষা প্রতিষ্ঠানের নাম ও ঠিকানা</label>
                  <input
                    type="text"
                    placeholder="যেমন: বরইতলী সরকারি প্রাথমিক বিদ্যালয়"
                    value={prevSchoolName}
                    onChange={e => setPrevSchoolName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">সর্বশেষ পরীক্ষা ও জিপিএ</label>
                  <input
                    type="text"
                    placeholder="যেমন: সমাপনী / GPA 4.80"
                    value={prevGpa}
                    onChange={e => setPrevGpa(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* 📌 SECTION 5: ADDRESS DETAILS */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-xs border border-rose-500/30">
                    ০৫
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-400" />
                      ঠিকানা বিবরণী (Address Details)
                    </h3>
                    <p className="text-[11px] text-slate-400">বর্তমান ও স্থায়ী যোগাযোগের পূর্ণাঙ্গ ঠিকানা</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">বর্তমান ঠিকানা (গ্রাম/রোড, ডাকঘর, উপজেলা, জেলা) *</label>
                <input
                  type="text"
                  placeholder="যেমন: বরইতলী, চকরিয়া, কক্সবাজার"
                  value={currentAddress}
                  onChange={e => setCurrentAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 transition"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2.5 my-2 cursor-pointer text-xs text-slate-300 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    checked={isSameAddress}
                    onChange={e => setIsSameAddress(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-0"
                  />
                  <span>বর্তমান ও স্থায়ী ঠিকানা একই (Same as current address)</span>
                </label>
              </div>

              {!isSameAddress && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">স্থায়ী ঠিকানা *</label>
                  <input
                    type="text"
                    placeholder="স্থায়ী ঠিকানার বিবরণ..."
                    value={permanentAddress}
                    onChange={e => setPermanentAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 transition"
                  />
                </div>
              )}
            </div>

            {/* 📌 SECTION 6: ADMISSION FEE & AUTO-LINK TO FINANCE */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs border border-amber-500/30">
                    ০৬
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-amber-400" />
                      ভর্তি ফি ও ফাইন্যান্স সমন্বয় (Admission Fee & Finance Link)
                    </h3>
                    <p className="text-[11px] text-slate-400">ভর্তি ফি স্বয়ংক্রিয়ভাবে হিসাব শাখায় পোস্টিং হবে</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  অটো ডাবল-এন্ট্রি
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">এককালীন ভর্তি ফি (টাকা)</label>
                  <input
                    type="number"
                    value={admissionFeeAmount}
                    onChange={e => setAdmissionFeeAmount(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-emerald-400 font-bold font-mono focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">পেমেন্ট মাধ্যম</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="Cash">নগদ ক্যাশ (Cash in Hand)</option>
                    <option value="bKash">বিকাশ মার্চেন্ট (bKash)</option>
                    <option value="Bank Transfer">সোনালী ব্যাংক ডিপোজিট</option>
                  </select>
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={collectAdmissionFee}
                      onChange={e => setCollectAdmissionFee(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                    />
                    <span className="text-xs font-bold text-white">ভর্তি ফি রসিদ ইস্যু করুন</span>
                  </label>
                </div>
              </div>
            </div>

            {/* STICKY BOTTOM ACTIONS */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-2xl">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                ফরম রিসেট (Reset)
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
              >
                <Save className="w-5 h-5" />
                <span>ভর্তি নিশ্চিতকরণ ও আইডি তৈরি (Confirm & Save)</span>
              </button>
            </div>

          </div>

          {/* ─── RIGHT COLUMN: LIVE INTERACTIVE ID CARD & PHOTO STUDIO (5/12) ─── */}
          <div className="lg:col-span-5 space-y-6 sticky top-6">
            
            {/* FORM FILL PROGRESS BAR */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-indigo-400" />
                  ফরম পূরণ অগ্রগতি
                </span>
                <span className="font-mono font-black text-indigo-400">{formProgress}% সম্পন্ন</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: \`\${formProgress}%\` }}
                />
              </div>
            </div>

            {/* PASSPORT PHOTO UPLOAD STUDIO */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                <span>শিক্ষার্থীর পাসপোর্ট ছবি আপলোড</span>
              </h3>

              <div className="flex items-center gap-5">
                <div className="relative w-28 h-32 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center overflow-hidden shrink-0 group shadow-inner">
                  {photo ? (
                    <>
                      <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhoto('')}
                        className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow"
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center text-slate-500">
                      <User size={36} className="mb-1 text-slate-600" />
                      <span className="text-[10px] font-semibold">পাসপোর্ট সাইজ ছবি</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-2xl text-xs font-bold border border-indigo-500/30 cursor-pointer transition">
                    <Upload size={14} />
                    <span>ছবি আপলোড করুন</span>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    সুপারিশ: পাসপোর্ট সাইজ ছবি (৩০০x৩০০ px)। স্বয়ংক্রিয়ভাবে আইডি কার্ড ও ভর্তি রসিদে বসে যাবে।
                  </p>
                </div>
              </div>
            </div>

            {/* REAL-TIME LIVE DIGITAL STUDENT ID CARD PREVIEW */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>লাইভ আইডি কার্ড প্রিভিউ (Live ID Card)</span>
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                  লাইভ প্রিভিউ
                </span>
              </div>

              {/* Realistic Digital ID Card */}
              <div className="w-full bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border-2 border-indigo-500/40 rounded-3xl p-5 text-white shadow-2xl relative overflow-hidden">
                {/* Lanyard Hole Mock */}
                <div className="w-8 h-2 bg-slate-950/80 rounded-full mx-auto mb-3 border border-white/10" />

                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-xs shadow">
                      স
                    </div>
                    <div>
                      <h4 className="text-xs font-black tracking-tight leading-tight">{schoolName}</h4>
                      <p className="text-[9px] text-indigo-300">শিক্ষার্থী পরিচয়পত্র • সেশন ২০২৬</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-lg border border-indigo-400/20">
                    EIIN: {eiinNumber}
                  </span>
                </div>

                {/* Card Body */}
                <div className="flex items-center gap-4 py-4">
                  {/* Photo Frame */}
                  <div className="w-20 h-24 rounded-2xl bg-slate-950 border-2 border-indigo-400/40 overflow-hidden shrink-0 flex items-center justify-center shadow-md">
                    {photo ? (
                      <img src={photo} alt="ID" className="w-full h-full object-cover" />
                    ) : (
                      <User size={36} className="text-slate-600" />
                    )}
                  </div>

                  {/* Student Credentials */}
                  <div className="space-y-1 flex-1 min-w-0">
                    <h2 className="text-sm font-black text-white truncate">
                      {fullName || 'শিক্ষার্থীর নাম...'}
                    </h2>
                    {fullNameEn && (
                      <p className="text-[10px] font-mono text-indigo-300 font-bold uppercase truncate">
                        {fullNameEn}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                      <div>
                        <span className="text-[9px] text-slate-400 block">শ্রেণি:</span>
                        <strong className="text-amber-300">{selectedClass} ({section})</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">রোল নং:</span>
                        <strong className="text-emerald-400 font-mono">#{roll || '০১'}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">রক্তের গ্রুপ:</span>
                        <strong className="text-rose-400 font-bold">{bloodGroup}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">বিভাগ:</span>
                        <strong className="text-slate-300">{group}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                  <span>জরুরি: <strong className="text-white font-mono">{mobile || '018XXXXXXXX'}</strong></span>
                  <span className="text-indigo-300 font-bold">বরইতলী, চকরিয়া</span>
                </div>
              </div>
            </div>

            {/* ADMISSION GUIDELINES INFO */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Info size={16} className="text-sky-400" />
                ভর্তি নির্দেশিকা ও তথ্যাবলী
              </h4>
              <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc list-inside leading-relaxed">
                <li>ফরমটি সফলভাবে জমা দিলে শিক্ষার্থী স্বয়ংক্রিয়ভাবে ডাটাবেজে যুক্ত হবে।</li>
                <li>এককালীন ভর্তি ফি সরাসরি হিসাবরক্ষণ লেজারে (Receipt Voucher) জমা হবে।</li>
                <li>ভর্তি শেষে অভিভাবকের মোবাইল নম্বরে ডিজিটাল আইডি ও রোল সংরক্ষিত থাকবে।</li>
              </ul>
            </div>

          </div>

        </form>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 2: RECENT ADMISSIONS REGISTRY TABLE                       */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'recent_admissions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>ভর্তি রেজিস্টার ও সাম্প্রতিক আবেদন তালিকা</span>
              </h3>
              <p className="text-xs text-slate-400">২০২৬ শিক্ষাবর্ষের সকল ভর্তি তালিকা ও বিবরণ</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="নাম / রোল / আইডি দিয়ে খুঁজুন..."
                value={recentSearch}
                onChange={e => setRecentSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-3">আইডি নং</th>
                  <th className="p-3">শিক্ষার্থীর নাম</th>
                  <th className="p-3">শ্রেণি ও শাখা</th>
                  <th className="p-3">রোল</th>
                  <th className="p-3">পিতার নাম</th>
                  <th className="p-3">মোবাইল</th>
                  <th className="p-3">উপবৃত্তি</th>
                  <th className="p-3 text-right">আইডি কার্ড</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredRecent.map((st, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition">
                    <td className="p-3 font-mono font-bold text-indigo-400">{st.id}</td>
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      {st.photo ? (
                        <img src={st.photo} alt="thumb" className="w-7 h-7 rounded-full object-cover border border-slate-700" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-indigo-400 font-bold">
                          {st.name.slice(0, 1)}
                        </div>
                      )}
                      <span>{st.name}</span>
                    </td>
                    <td className="p-3">{st.grade || '৬ষ্ঠ'} ({st.section || 'A'})</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">#{st.roll}</td>
                    <td className="p-3 text-slate-400">{st.fatherName || 'অভিভাবক'}</td>
                    <td className="p-3 font-mono text-slate-300">{st.mobile || 'N/A'}</td>
                    <td className="p-3">
                      {st.isStipend ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          উপবৃত্তি
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">সাধারণ</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setAdmittedStudent(st);
                          setIsSuccess(true);
                        }}
                        className="px-3 py-1 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30"
                      >
                        রসিদ স্লিপ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL: BLANK A4 FORM PRINTABLE                                */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {printableBlankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <span>ব্ল্যাঙ্ক A4 ভর্তি ফরম প্রিন্ট ভিউ</span>
              </h3>
              <button onClick={() => setPrintableBlankModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white text-slate-950 p-6 rounded-2xl border-2 border-slate-900 space-y-4 text-xs">
              <div className="text-center border-b pb-2">
                <h2 className="text-base font-black">{schoolName}</h2>
                <p className="text-[10px] text-slate-600">{schoolAddress} • EIIN: {eiinNumber}</p>
                <p className="text-xs font-bold text-indigo-900 mt-1">শিক্ষার্থী ভর্তি আবেদন ফরম — ২০২৬</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <p>১. শিক্ষার্থীর পূর্ণ নাম (বাংলায়): ............................................</p>
                <p>২. Full Name (English): ...................................................</p>
                <p>৩. ভর্তির শ্রেণি: ....................... শাখা: ......... রোল: ..............</p>
                <p>৪. জন্ম তারিখ: ......................... লিঙ্গ: ..............................</p>
                <p>৫. পিতার নাম: .................................................................</p>
                <p>৬. মাতার নাম: .................................................................</p>
                <p>৭. অভিভাবকের মোবাইল নম্বর: ...............................................</p>
                <p>৮. জন্ম নিবন্ধন নম্বর: ......................................................</p>
              </div>

              <div className="pt-8 flex justify-between text-[10px]">
                <p className="border-t border-slate-900 px-4">অভিভাবকের স্বাক্ষর</p>
                <p className="border-t border-slate-900 px-4">ভর্তি কমিটির স্বাক্ষর</p>
                <p className="border-t border-slate-900 px-4">প্রধান শিক্ষক</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPrintableBlankModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow"
              >
                প্রিন্ট করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
`;

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully written refined admission page to:', targetPath);
