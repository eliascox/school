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
  Globe
} from 'lucide-react';
import QRCode from 'qrcode';
import { studentService } from '@/services/studentService';
import { auditTrailService } from '@/services/auditTrailService';
import { settingsService } from '@/services/settingsService';
import { curriculumService } from '@/services/curriculumService';
import { languageService, AppLanguage } from '@/services/languageService';
import { useRouter } from 'next/navigation';
import { teacherAuthService } from '@/services/teacherAuthService';
import OfficialAdmissionForm from '@/components/OfficialAdmissionForm';
import { compressImage } from '@/lib/imageUtils';

export default function AdmissionPage() {
  const router = useRouter();
  const [lang, setLang] = useState<AppLanguage>('bn');
  const [schoolSettings, setSchoolSettings] = useState<any>(null);

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
    if (typeof window !== 'undefined') {
      window.addEventListener('open_blank_admission_modal', handleOpenBlankModal);
    }

    return () => {
      unsubSettings();
      unsubLang();
      if (typeof window !== 'undefined') {
        window.removeEventListener('open_blank_admission_modal', handleOpenBlankModal);
      }
    };
  }, []);

  const t = {
    title: lang === 'bn' ? 'অফিশিয়াল শিক্ষার্থী ভর্তি ফরম' : 'Official Student Admission Form',
    subtext: lang === 'bn' ? '২০২৬ শিক্ষাবর্ষের নতুন ভর্তির আবেদনপত্র ও আইডি রেজিস্ট্রেশন' : 'New Student Admission Application & ID Registration for 2026',
    session: lang === 'bn' ? 'শিক্ষাবর্ষ ২০২৬' : 'Session 2026',
    
    // Section 1: Academic
    sec1Title: lang === 'bn' ? '১. একাডেমিক নির্বাচন (Academic Info)' : '1. Academic Information',
    classLabel: lang === 'bn' ? 'ভর্তির শ্রেণি *' : 'Class *',
    rollLabel: lang === 'bn' ? 'শ্রেণি রোল নম্বর *' : 'Class Roll *',
    rollPlaceholder: lang === 'bn' ? 'যেমন: ০১' : 'e.g. 01',
    sectionLabel: lang === 'bn' ? 'নির্ধারিত শাখা *' : 'Section *',
    groupLabel: lang === 'bn' ? 'বিভাগ / গ্রুপ (৯ম-১০ম)' : 'Group (Class 9-10)',
    optionalLabel: lang === 'bn' ? 'ঐচ্ছিক বিষয় (Optional Subject)' : 'Optional Subject',

    // Classes & Sections
    class6: lang === 'bn' ? '৬ষ্ঠ শ্রেণি (Class 6)' : 'Class 6',
    class7: lang === 'bn' ? '৭ম শ্রেণি (Class 7)' : 'Class 7',
    class8: lang === 'bn' ? '৮ম শ্রেণি (Class 8)' : 'Class 8',
    class9: lang === 'bn' ? '৯ম শ্রেণি (Class 9)' : 'Class 9',
    class10: lang === 'bn' ? '১০ম শ্রেণি (Class 10)' : 'Class 10',
    secA: lang === 'bn' ? 'শাখা ক (Sec A)' : 'Section A',
    secB: lang === 'bn' ? 'শাখা খ (Sec B)' : 'Section B',
    secC: lang === 'bn' ? 'শাখা গ (Sec C)' : 'Section C',

    // Groups
    groupGen: lang === 'bn' ? 'সাধারণ' : 'General',
    groupSci: lang === 'bn' ? '🧪 বিজ্ঞান' : '🧪 Science',
    groupHum: lang === 'bn' ? '📜 মানবিক' : '📜 Humanities',
    groupBus: lang === 'bn' ? '💼 ব্যবসায় শিক্ষা' : '💼 Business Studies',

    // Section 2: Personal
    sec2Title: lang === 'bn' ? '২. শিক্ষার্থীর ব্যক্তিগত বিবরণী (Student Profile)' : '2. Student Personal Information',
    studentNameLabel: lang === 'bn' ? 'শিক্ষার্থীর পূর্ণ নাম (বাংলায়) *' : 'Student Full Name *',
    studentNameEnLabel: lang === 'bn' ? 'শিক্ষার্থীর নাম (ইংরেজিতে)' : 'Full Name (English Block Letters)',
    studentNamePlaceholder: lang === 'bn' ? 'যেমন: মোঃ আরমান হোসেন' : 'e.g. MD. ARMAN HOSSAIN',
    mobileLabel: lang === 'bn' ? 'অভিভাবকের ব্যবহৃত মোবাইল নম্বর *' : 'Guardian Mobile Number *',
    mobilePlaceholder: '01812345678',
    dobLabel: lang === 'bn' ? 'জন্ম তারিখ (Date of Birth) *' : 'Date of Birth *',
    genderLabel: lang === 'bn' ? 'লিঙ্গ (Gender) *' : 'Gender *',
    genderMale: lang === 'bn' ? 'পুরুষ (Male)' : 'Male',
    genderFemale: lang === 'bn' ? 'নারী (Female)' : 'Female',
    genderOther: lang === 'bn' ? 'অন্যান্য (Other)' : 'Other',
    
    religionLabel: lang === 'bn' ? 'ধর্ম (Religion) *' : 'Religion *',
    relIslam: lang === 'bn' ? 'ইসলাম (Islam)' : 'Islam',
    relHindu: lang === 'bn' ? 'হিন্দু (Hindu)' : 'Hinduism',
    relChristian: lang === 'bn' ? 'খ্রিস্টান (Christian)' : 'Christianity',
    relBuddhist: lang === 'bn' ? 'বৌদ্ধ (Buddhist)' : 'Buddhism',
    relOther: lang === 'bn' ? 'অন্যান্য (Other)' : 'Other',

    bloodGroupLabel: lang === 'bn' ? 'রক্তের গ্রুপ (Blood Group)' : 'Blood Group',
    birthRegLabel: lang === 'bn' ? '১৭ ডিজিটের ডিজিটাল জন্ম নিবন্ধন নম্বর *' : '17-Digit Digital Birth Registration No *',
    birthRegPlaceholder: lang === 'bn' ? 'যেমন: ২০১০১৫১২৩৪৫৬৭৮৯০১' : 'e.g. 20101512345678901',
    photoLabel: lang === 'bn' ? 'শিক্ষার্থীর পাসপোর্ট ছবি' : 'Passport Photo',
    photoUpload: lang === 'bn' ? 'ছবি আপলোড করুন' : 'Upload Photo',
    passportSubtext: lang === 'bn' ? 'পাসপোর্ট সাইজ' : 'Passport Size',

    // Section 3: Parents
    sec3Title: lang === 'bn' ? '৩. পিতা ও মাতার বিবরণী (Parents Information)' : '3. Parents Information',
    fatherTitle: lang === 'bn' ? 'পিতার বিবরণ (Father Info)' : 'Father Information',
    fatherNameLabel: lang === 'bn' ? 'পিতার নাম (বাংলা/Eng) *' : 'Father\'s Name *',
    fatherNidLabel: lang === 'bn' ? 'পিতার এনআইডি নম্বর' : 'Father\'s NID No',
    fatherOccLabel: lang === 'bn' ? 'পিতার পেশা' : 'Father\'s Occupation',

    motherTitle: lang === 'bn' ? 'মাতার বিবরণ (Mother Info)' : 'Mother Information',
    motherNameLabel: lang === 'bn' ? 'মাতার নাম (বাংলা/Eng) *' : 'Mother\'s Name *',
    motherNidLabel: lang === 'bn' ? 'মাতার এনআইডি নম্বর' : 'Mother\'s NID No',
    motherOccLabel: lang === 'bn' ? 'মাতার পেশা' : 'Mother\'s Occupation',

    // Section 4 & 5: Prev School & Address
    sec4Title: lang === 'bn' ? '৪. পূর্ববর্তী স্কুলের তথ্য (Previous School)' : '4. Previous School Information',
    prevSchoolName: lang === 'bn' ? 'পূর্ববর্তী স্কুলের নাম ও ঠিকানা' : 'Previous School Name & Address',
    prevSchoolPlaceholder: lang === 'bn' ? 'পূর্বে অধ্যয়নকৃত বিদ্যালয়ের নাম' : 'Name of previous school',
    prevGpa: lang === 'bn' ? 'উত্তীর্ণ পরীক্ষা / জিপিএ' : 'Exam Passed / GPA',
    sec5Title: lang === 'bn' ? '৫. ঠিকানা বিবরণী (Address Details)' : '5. Address Details',
    sameAddressLabel: lang === 'bn' ? 'বর্তমান ও স্থায়ী ঠিকানা একই' : 'Same as current address',
    currentAddressLabel: lang === 'bn' ? 'বর্তমান ঠিকানা (গ্রাম/রোড, ডাকঘর, উপজেলা, জেলা) *' : 'Current Address (Village/Road, PO, Upazila, District) *',
    currentAddressPlaceholder: lang === 'bn' ? 'গ্রাম/রোড, ডাকঘর, উপজেলা, জেলা' : 'Village/Road, Post Office, Upazila, District',
    permanentAddressLabel: lang === 'bn' ? 'স্থায়ী ঠিকানা *' : 'Permanent Address *',
    permanentAddressPlaceholder: lang === 'bn' ? 'স্থায়ী ঠিকানা' : 'Permanent Address',
    sameAsCurrentPlaceholder: lang === 'bn' ? 'বর্তমান ঠিকানার অনুরূপ' : 'Same as current address',

    // Actions & Notices
    requiredFooter: lang === 'bn' 
      ? '* চিহ্নযুক্ত ফিল্ডগুলো পূরণ করা আবশ্যক। সাবমিট করলে তথ্য স্থায়ীভাবে সংরক্ষিত হবে।'
      : '* Mandatory fields must be filled. Submitting will permanently save the record.',
    resetBtn: lang === 'bn' ? 'ফরম রিসেট' : 'Reset Form',
    submitBtn: lang === 'bn' ? 'ভর্তি নিশ্চিতকরণ সেভ করুন' : 'Confirm & Save Admission',

    // Success
    successTitle: lang === 'bn' ? 'অফিশিয়াল ভর্তি সফলভাবে সম্পন্ন হয়েছে!' : 'Official Admission Successfully Completed!',
    receiptReset: lang === 'bn' ? 'নতুন শিক্ষার্থীর ভর্তি ফরম' : 'New Admission Form',
    printSlipBtn: lang === 'bn' ? 'ভর্তি স্লিপ প্রিন্ট / PDF' : 'Print Admission Slip / PDF',
    idCardBtn: lang === 'bn' ? 'আইডি কার্ড জেনারেট' : 'Generate ID Card',
    studentIdLbl: lang === 'bn' ? 'শিক্ষার্থী আইডি' : 'Student ID',
    classSecLbl: lang === 'bn' ? 'শ্রেণি ও শাখা' : 'Class & Section',
    rollLbl: lang === 'bn' ? 'রোল' : 'Roll',
    groupLbl: lang === 'bn' ? 'বিভাগ (Group)' : 'Group',
    optionalSubLbl: lang === 'bn' ? 'ঐচ্ছিক বিষয়' : 'Optional Subject',
    mobileLbl: lang === 'bn' ? 'অভিভাবকের মোবাইল' : 'Guardian Mobile',
    fatherNameLbl: lang === 'bn' ? 'পিতার নাম' : 'Father\'s Name',
    motherNameLbl: lang === 'bn' ? 'মাতার নাম' : 'Mother\'s Name',
    birthRegLbl: lang === 'bn' ? 'জন্ম নিবন্ধন নং' : 'Birth Reg No',
    dobLbl: lang === 'bn' ? 'জন্ম তারিখ' : 'Date of Birth',
    genderRelLbl: lang === 'bn' ? 'লিঙ্গ ও ধর্ম' : 'Gender & Religion',
    bloodGroupLbl: lang === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group',
    scanIdLbl: lang === 'bn' ? 'ডিজিটাল স্ক্যান আইডি' : 'Digital Scan ID'
  };

  const [showClassSelection, setShowClassSelection] = useState<boolean>(true);
  const [showSectionSelection, setShowSectionSelection] = useState<boolean>(true);
  const [showRollInput, setShowRollInput] = useState<boolean>(true);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [fullNameEn, setFullNameEn] = useState('');
  const [selectedClass, setSelectedClass] = useState('6th');
  const [roll, setRoll] = useState('');
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
  const [admittedStudent, setAdmittedStudent] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const [printableBlankModal, setPrintableBlankModal] = useState(false);

  useEffect(() => {
    const handleOpenBlank = () => setPrintableBlankModal(true);
    window.addEventListener('open_blank_admission_modal', handleOpenBlank);
    return () => window.removeEventListener('open_blank_admission_modal', handleOpenBlank);
  }, []);

  useEffect(() => {
    if (admittedStudent && admittedStudent.id) {
      QRCode.toDataURL(admittedStudent.id, { margin: 1, width: 120 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error(err));
    }
  }, [admittedStudent]);

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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert('ছবি সাইজ সর্বোচ্চ ৫MB হতে পারবে।');
      const compressed = await compressImage(file);
      setPhoto(compressed);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) return alert('শিক্ষার্থীর নাম অবশ্যই দিতে হবে!');
    if (!mobile.trim()) return alert('অভিভাবকের মোবাইল নম্বর অবশ্যই দিতে হবে!');

    const studentData = {
      name: fullName.trim(),
      grade: selectedClass,
      section,
      branch: section,
      roll: roll.trim() || '01',
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
      mobile: mobile.trim(),
      birthRegNo: birthRegNo.trim(),
      currentAddress: currentAddress.trim(),
      permanentAddress: permanentAddress.trim(),
      prevSchoolName: prevSchoolName.trim(),
      prevGpa: prevGpa.trim(),
      remarks: prevSchoolName.trim() ? `পূর্বতন প্রতিষ্ঠান: ${prevSchoolName.trim()} (GPA: ${prevGpa.trim() || 'N/A'})` : '',
      photo,
    };

    const admitted = studentService.addStudent(studentData);
    setAdmittedStudent(admitted);

    auditTrailService.addLog({
      action: 'Student Admitted',
      category: 'student',
      details: `${fullName.trim()} (${selectedClass}, ${gender}, ${religion}) নতুন ভর্তি সম্পন্ন হয়েছে।`,
      performedBy: 'Admin',
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
    setIsSuccess(false);
    setAdmittedStudent(null);
  };

  const isGroupDisabled = selectedClass === '6th' || selectedClass === '7th' || selectedClass === '8th';
  const isOptionalDisabled = group === 'মানবিক' || group === 'ব্যবসায় শিক্ষা';

  const schoolName = schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const schoolAddress = schoolSettings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার';
  const eiinNumber = schoolSettings?.eiin || '১০৬২৮৮';
  const schoolLogo = schoolSettings?.schoolLogo;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 print:p-0 print:m-0">

      {/* Strict Print Suppression for Form & Navigation */}
      <style>{`
        @media print {
          form,
          .print\\:hidden,
          header,
          aside,
          nav {
            display: none !important;
          }
        }
      `}</style>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 🖨️ VIEW 1: PRINTABLE OFFICIAL BLANK ADMISSION FORM (A4 LAYOUT)    */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {printableBlankModal ? (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[96vh] overflow-y-auto print:max-h-none print:shadow-none print:w-full print:rounded-none p-4 sm:p-6 print:p-0">
            <OfficialAdmissionForm
              isBlank={true}
              settings={schoolSettings}
              onPrint={() => window.print()}
              onClose={() => setPrintableBlankModal(false)}
            />
          </div>
        </div>
      ) : isSuccess && admittedStudent ? (
        /* ═══════════════════════════════════════════ */
        /* VIEW 2: OFFICIAL ADMISSION SLIP ON SUCCESS */
        /* ═══════════════════════════════════════════ */
        <OfficialAdmissionForm
          data={{
            ...admittedStudent,
            appId: admittedStudent.id,
            qrCodeUrl: qrCodeUrl,
          }}
          settings={schoolSettings}
          onPrint={() => window.print()}
          onClose={handleReset}
        />
      ) : (
        /* ═══════════════════════════════════════════ */
        /* VIEW 3: ONLINE ADMISSION DATA ENTRY FORM   */
        /* ═══════════════════════════════════════════ */
        <>
          {/* Top Quick Action & Information Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-indigo-900/50 print:hidden">
            <div className="flex items-center gap-3.5 text-left w-full md:w-auto">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                <UserPlus size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                  শিক্ষার্থী নতুন ভর্তি ও নিবন্ধন ফরম
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">২০২৬ খ্রি.</span>
                </h2>
                <p className="text-xs text-slate-300 font-medium">
                  নতুন শিক্ষার্থীর প্রাতিষ্ঠানিক তথ্য এন্ট্রি, ১৭ ডিজিট জন্ম নিবন্ধন ও অভিভাবক বিবরণী
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0">
              <button
                type="button"
                onClick={() => setPrintableBlankModal(true)}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Printer size={15} /> ফাঁকা ভর্তি ফরম প্রিন্ট (Blank Form)
              </button>
              <a
                href="/admission"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-white/15"
              >
                <Globe size={15} className="text-cyan-400" /> অনলাইন আবেদন লিংক ↗
              </a>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6 text-xs print:hidden">
          
          {/* SECTION 1: ACADEMIC */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-extrabold text-sm">
              <BookOpen size={18} className="text-indigo-600" />
              {t.sec1Title}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
              {showClassSelection && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.classLabel}</label>
                  <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="6th">{t.class6}</option>
                    <option value="7th">{t.class7}</option>
                    <option value="8th">{t.class8}</option>
                    <option value="9th">{t.class9}</option>
                    <option value="10th">{t.class10}</option>
                  </select>
                </div>
              )}

              {showRollInput && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.rollLabel}</label>
                  <input 
                    type="text" 
                    value={roll} 
                    onChange={(e) => setRoll(e.target.value)}
                    placeholder={t.rollPlaceholder}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {showSectionSelection && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.sectionLabel}</label>
                  <select 
                    value={section} 
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="A">{t.secA}</option>
                    <option value="B">{t.secB}</option>
                    <option value="C">{t.secC}</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.groupLabel}</label>
                <select 
                  value={group} 
                  onChange={(e) => setGroup(e.target.value as any)}
                  disabled={isGroupDisabled}
                  className={`w-full px-3 py-2 border rounded-xl outline-none font-bold ${
                    isGroupDisabled ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-slate-50 text-slate-900 border-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer'
                  }`}
                >
                  <option value="সাধারণ">{t.groupGen}</option>
                  <option value="বিজ্ঞান">{t.groupSci}</option>
                  <option value="মানবিক">{t.groupHum}</option>
                  <option value="ব্যবসায় শিক্ষা">{t.groupBus}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.optionalLabel}</label>
                <select 
                  value={optionalSubject} 
                  onChange={(e) => setOptionalSubject(e.target.value)}
                  disabled={isOptionalDisabled}
                  className={`w-full px-3 py-2 border rounded-xl outline-none font-bold ${
                    isOptionalDisabled ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-slate-50 text-slate-900 border-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer'
                  }`}
                >
                  {optionalSubjectOptions.map((opt) => (
                    <option key={opt.code || opt.name} value={opt.name}>
                      {lang === 'en' ? (
                        opt.name.includes('কৃষি') ? 'Agriculture Studies' :
                        opt.name.includes('উচ্চতর গণিত') ? 'Higher Mathematics' :
                        opt.name.includes('অর্থনীতি') ? 'Economics' :
                        opt.name.includes('কোনটিই নয়') ? 'None' : opt.name
                      ) : (
                        opt.name
                      )} {opt.category && opt.name !== 'কোনটিই নয়' ? `(${opt.category})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: PERSONAL DETAILS */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-extrabold text-sm">
              <User size={18} className="text-indigo-600" />
              {t.sec2Title}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
              <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                
                {/* Full Name BN */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.studentNameLabel}</label>
                  <input 
                    type="text" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t.studentNamePlaceholder}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.mobileLabel}</label>
                  <input 
                    type="text" 
                    required 
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder={t.mobilePlaceholder}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* DOB */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar size={12} className="text-indigo-600" />
                    {t.dobLabel}
                  </label>
                  <input 
                    type="date" 
                    required 
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.genderLabel}</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="পুরুষ">{t.genderMale}</option>
                    <option value="নারী">{t.genderFemale}</option>
                    <option value="অন্যান্য">{t.genderOther}</option>
                  </select>
                </div>

                {/* Religion */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.religionLabel}</label>
                  <select
                    value={religion}
                    onChange={(e) => setReligion(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="ইসলাম">{t.relIslam}</option>
                    <option value="হিন্দু">{t.relHindu}</option>
                    <option value="খ্রিস্টান">{t.relChristian}</option>
                    <option value="বৌদ্ধ">{t.relBuddhist}</option>
                    <option value="অন্যান্য">{t.relOther}</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.bloodGroupLabel}</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="A+">A+ (A Positive)</option>
                    <option value="A-">A- (A Negative)</option>
                    <option value="B+">B+ (B Positive)</option>
                    <option value="B-">B- (B Negative)</option>
                    <option value="O+">O+ (O Positive)</option>
                    <option value="O-">O- (O Negative)</option>
                    <option value="AB+">AB+ (AB Positive)</option>
                    <option value="AB-">AB- (AB Negative)</option>
                  </select>
                </div>

                {/* Birth Reg No */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.birthRegLabel}</label>
                  <input 
                    type="text" 
                    required 
                    value={birthRegNo}
                    onChange={(e) => setBirthRegNo(e.target.value)}
                    placeholder={t.birthRegPlaceholder}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Photo Box */}
              <div className="flex flex-col items-center space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">{t.photoLabel}</label>
                <div className="relative w-32 h-36 border-2 border-dashed border-indigo-300 hover:border-indigo-600 rounded-2xl bg-indigo-50/40 flex flex-col items-center justify-center cursor-pointer overflow-hidden group shadow-inner transition">
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  {photo ? (
                    <img src={photo} alt="Student" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-slate-400 p-2">
                      <User size={32} className="mx-auto text-indigo-300 group-hover:scale-110 transition" />
                      <span className="text-[10px] font-extrabold text-indigo-700 block mt-1">{t.photoUpload}</span>
                      <span className="text-[8px] text-slate-400 block mt-0.5">{t.passportSubtext}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: PARENTS INFORMATION */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-extrabold text-sm">
              <Users size={18} className="text-indigo-600" />
              {t.sec3Title}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Father Box */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5">
                <span className="font-black text-indigo-900 text-xs flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-indigo-600" /> {t.fatherTitle}
                </span>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    required 
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder={t.fatherNameLabel}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      value={fatherNid}
                      onChange={(e) => setFatherNid(e.target.value)}
                      placeholder={t.fatherNidLabel}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl outline-none font-mono text-slate-900 text-xs"
                    />
                    <input 
                      type="text" 
                      value={fatherOcc}
                      onChange={(e) => setFatherOcc(e.target.value)}
                      placeholder={t.fatherOccLabel}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Mother Box */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5">
                <span className="font-black text-purple-900 text-xs flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-purple-600" /> {t.motherTitle}
                </span>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    required 
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    placeholder={t.motherNameLabel}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      value={motherNid}
                      onChange={(e) => setMotherNid(e.target.value)}
                      placeholder={t.motherNidLabel}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl outline-none font-mono text-slate-900 text-xs"
                    />
                    <input 
                      type="text" 
                      value={motherOcc}
                      onChange={(e) => setMotherOcc(e.target.value)}
                      placeholder={t.motherOccLabel}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4 & 5: ADDRESS & PREVIOUS SCHOOL */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <MapPin size={18} className="text-indigo-600" />
                {t.sec5Title}
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-indigo-700 select-none">
                <input 
                  type="checkbox" 
                  checked={isSameAddress}
                  onChange={(e) => setIsSameAddress(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4"
                />
                {t.sameAddressLabel}
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.prevSchoolName}</label>
                <input 
                  type="text" 
                  value={prevSchoolName}
                  onChange={(e) => setPrevSchoolName(e.target.value)}
                  placeholder={t.prevSchoolPlaceholder}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.currentAddressLabel}</label>
                <input 
                  type="text" 
                  required 
                  value={currentAddress}
                  onChange={(e) => setCurrentAddress(e.target.value)}
                  placeholder={t.currentAddressPlaceholder}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.permanentAddressLabel}</label>
                <input 
                  type="text" 
                  required={!isSameAddress}
                  disabled={isSameAddress}
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  placeholder={isSameAddress ? t.sameAsCurrentPlaceholder : t.permanentAddressPlaceholder}
                  className={`w-full px-3 py-2 border rounded-xl outline-none font-bold ${
                    isSameAddress ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Form Bottom Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500 font-medium">
              {t.requiredFooter}
            </p>

            <div className="flex items-center gap-3 justify-end">
              <button 
                type="button" 
                onClick={handleReset}
                className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition text-xs cursor-pointer"
              >
                {t.resetBtn}
              </button>
              <button 
                type="submit"
                className="px-7 py-3 bg-gradient-to-r from-indigo-700 to-indigo-900 hover:from-indigo-600 hover:to-indigo-800 text-white font-black text-xs rounded-2xl shadow-lg flex items-center gap-2 transition transform active:scale-95 cursor-pointer"
              >
                <Save size={16} /> {t.submitBtn}
              </button>
            </div>
          </div>

        </form>
        </>
      )}
    </div>
  );
}
