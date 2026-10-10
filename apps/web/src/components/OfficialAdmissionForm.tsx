'use client';

import React from 'react';
import { School, User, Users, Printer, ArrowLeft, BookOpen, MapPin, GraduationCap, X } from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';

export interface AdmissionFormData {
  appId?: string;
  name?: string;
  nameEn?: string;
  grade?: string;
  gradeBn?: string;
  section?: string;
  roll?: string;
  group?: string;
  optionalSubject?: string;
  dob?: string;
  gender?: string;
  religion?: string;
  bloodGroup?: string;
  birthRegNo?: string;
  fatherName?: string;
  fatherNameEn?: string;
  fatherNid?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherNameEn?: string;
  motherNid?: string;
  motherOccupation?: string;
  guardian?: string;
  guardianRelation?: string;
  mobile?: string;
  currentAddress?: string;
  permanentAddress?: string;
  prevSchoolName?: string;
  prevGpa?: string;
  photo?: string;
  qrCodeUrl?: string;
  isStipend?: boolean;
}

interface OfficialAdmissionFormProps {
  data?: AdmissionFormData;
  isBlank?: boolean;
  settings?: SchoolSettings | null;
  onClose?: () => void;
  onPrint?: () => void;
}

const toBnDigit = (num: number | string): string => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num || '').replace(/[0-9]/g, (d) => bn[parseInt(d, 10)]);
};

const getGradeBnName = (grade?: string): string => {
  if (!grade) return '_________';
  const g = grade.toLowerCase();
  if (g.includes('6') || g.includes('six') || g.includes('৬')) return '৬ষ্ঠ শ্রেণি (Class 6)';
  if (g.includes('7') || g.includes('seven') || g.includes('৭')) return '৭ম শ্রেণি (Class 7)';
  if (g.includes('8') || g.includes('eight') || g.includes('৮')) return '৮ম শ্রেণি (Class 8)';
  if (g.includes('9') || g.includes('nine') || g.includes('৯')) return '৯ম শ্রেণি (Class 9)';
  if (g.includes('10') || g.includes('ten') || g.includes('১০')) return '১০ম শ্রেণি (Class 10)';
  return grade;
};

export default function OfficialAdmissionForm({
  data,
  isBlank = false,
  settings,
  onClose,
  onPrint,
}: OfficialAdmissionFormProps) {
  const schoolName = settings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';
  const schoolAddress = settings?.address || 'ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার।';
  const eiin = settings?.eiin || '108234';
  const schoolLogo = settings?.schoolLogo;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const formNo = isBlank ? 'ADM-2026-________' : (data?.appId || `ADM-2026-${data?.roll || '001'}`);
  const formattedRoll = isBlank ? '____' : toBnDigit(data?.roll || '০১');
  const todayBn = new Date().toLocaleDateString('bn-BD');

  return (
    <div className="w-full max-w-[210mm] mx-auto bg-white text-slate-900 font-sans print:max-w-none print:w-full print:m-0 print:p-0">
      
      {/* ─── PRINT CSS: GUARANTEED EXACT MARGINS IN PDF & A4 PRINT ─── */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0mm !important;
        }
        @media print {
          html, body {
            margin: 0mm !important;
            padding: 0mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 210mm !important;
            height: 297mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          form, header, aside, nav, .print-hide {
            display: none !important;
          }
          .printable-admission-container {
            width: 210mm !important;
            max-width: 210mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            height: 297mm !important;
            margin: 0 auto !important;
            padding: 0.5in !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            overflow: hidden !important;
          }
        }
      `}</style>
      
      {/* ─── SCREEN-ONLY ACTION BAR (Matches User Reference Image) ───────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm print:hidden mb-4">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs transition cursor-pointer self-start sm:self-auto"
          >
            <ArrowLeft size={16} /> প্রোফাইলে ফিরে যান
          </button>
        ) : <div />}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-xl transition transform active:scale-95 cursor-pointer"
          >
            <Printer size={16} /> অফিশিয়াল ভর্তি ফরম প্রিন্ট করুন / PDF ডাউনলোড
          </button>
        </div>
      </div>

      {/* ─── A4 PRINTABLE DOCUMENT CONTAINER (No Outer Border, Full Page Flow) ── */}
      <div className="printable-admission-container bg-white text-slate-900 font-sans p-6 sm:p-8 border-none rounded-none shadow-lg print:border-none print:rounded-none print:shadow-none box-border flex flex-col justify-between space-y-2.5">
        
        {/* ─── 1. OFFICIAL INSTITUTION HEADER ─── */}
        <div className="border-b-2 border-slate-900 pb-3 relative">
          <div className="flex items-center justify-between gap-4">
            
            {/* Left School Crest Logo */}
            <div className="w-16 h-16 shrink-0 flex items-center justify-center">
              {schoolLogo ? (
                <img src={schoolLogo} alt="School Logo" className="w-16 h-16 object-contain" />
              ) : (
                <div className="w-16 h-16 flex flex-col items-center justify-center text-slate-800">
                  <School size={36} className="text-slate-800" />
                </div>
              )}
            </div>

            {/* Center School Identity */}
            <div className="text-center flex-1">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight font-serif">
                {schoolName}
              </h1>
              <h2 className="text-xs sm:text-sm font-extrabold text-indigo-900 uppercase tracking-widest mt-0.5">
                BARAITALI HIGH SCHOOL
              </h2>
              <p className="text-[11px] font-bold text-slate-700 mt-1">
                {schoolAddress} | EIIN: {toBnDigit(eiin)} | স্থাপিত: ১৯৬৫ খ্রিঃ
              </p>
              <p className="text-[10px] text-slate-500 font-medium">ফোন: ০১৮১২-০০০১০৯ | ইমেইল: info@baraitalihs.edu.bd</p>
            </div>

            {/* Right: Student Passport Photo Frame (Top Right) */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-24 h-28 border-2 border-slate-900 rounded-md overflow-hidden bg-slate-50 flex flex-col items-center justify-center text-center shadow-xs relative">
                {data?.photo && !isBlank ? (
                  <img src={data.photo} alt="Student Photo" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-1 flex flex-col items-center justify-center">
                    <User size={26} className="text-slate-400 mb-0.5" />
                    <span className="text-[8.5px] font-bold text-slate-700 leading-tight">শিক্ষার্থীর ছবি</span>
                    <span className="text-[7.5px] text-slate-500">(পাসপোর্ট সাইজ)</span>
                  </div>
                )}
              </div>
              <span className="text-[8px] font-bold text-slate-600 mt-0.5 uppercase tracking-wider">পাসপোর্ট সাইজ</span>
            </div>
          </div>

          {/* Center Pill Banner */}
          <div className="flex justify-center mt-2">
            <span className="inline-block px-8 py-1.5 bg-slate-900 text-white text-xs sm:text-sm font-black rounded-full tracking-wider shadow-xs">
              অফিশিয়াল শিক্ষার্থী ভর্তি আবেদন ফরম - ২০২৬
            </span>
          </div>
        </div>

        {/* ─── 2. METADATA RIBBON STRIP ─── */}
        <div className="border-t border-b border-slate-900 py-1.5 px-3 flex justify-between items-center text-[11px] font-bold text-slate-900 bg-slate-50">
          <div>ফরম নম্বর: <span className="font-mono font-black text-indigo-900">{formNo}</span></div>
          <div>ভর্তি সেশন: <span className="font-black">২০২৬ খ্রিঃ</span></div>
          <div>শ্রেণি রোল: <span className="font-mono font-black">{formattedRoll}</span></div>
          <div>তারিখ: <span className="font-mono">{todayBn}</span></div>
        </div>

        {/* ─── 3. STUDENT PERSONAL INFORMATION SECTION ─── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <User size={14} className="text-indigo-800" /> ১. শিক্ষার্থীর ব্যক্তিগত তথ্য (STUDENT PERSONAL INFORMATION)
            </h3>
          </div>

          <div className="border border-slate-900 rounded-md overflow-hidden text-xs">
            <div className="grid grid-cols-2 divide-x divide-y divide-slate-800">
              <div className="p-2 col-span-2">
                <strong>শিক্ষার্থীর পূর্ণ নাম:</strong> <span className="font-bold text-slate-900 text-sm ml-1">{isBlank ? '____________________________________________________________________' : data?.name}</span>
              </div>
              <div className="p-2">
                <strong>জন্ম তারিখ (DOB):</strong> <span className="font-bold text-slate-900 ml-1">{isBlank ? '____/____/________' : (data?.dob || 'N/A')}</span>
              </div>
              <div className="p-2 font-mono">
                <strong>জন্ম নিবন্ধন নম্বর:</strong> <span className="font-bold text-indigo-900 ml-1">{isBlank ? '_________________' : (data?.birthRegNo || 'N/A')}</span>
              </div>
              <div className="p-2">
                <strong>লিঙ্গ:</strong> <span className="ml-1 font-bold">{isBlank ? '[ ] ছাত্র   [ ] ছাত্রী' : data?.gender}</span>
              </div>
              <div className="p-2">
                <strong>ধর্ম:</strong> <span className="ml-1">{isBlank ? '[ ] ইসলাম   [ ] হিন্দু   [ ] বৌদ্ধ   [ ] খ্রিস্টান' : data?.religion}</span>
              </div>
              <div className="p-2">
                <strong>রক্তের গ্রুপ:</strong> <span className="ml-1 font-bold text-rose-600">{isBlank ? '________' : (data?.bloodGroup || 'A+')}</span>
              </div>
              <div className="p-2">
                <strong>জাতীয়তা:</strong> <span className="ml-1 font-bold">বাংলাদেশী</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 4. PARENTS & GUARDIAN DETAILS SECTION ─── */}
        <div className="space-y-1.5">
          <div className="bg-slate-900 text-white px-3 py-1 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 rounded-t-md">
            <Users size={13} /> ২. পিতা-মাতা ও অভিভাবকের তথ্য
          </div>
          <div className="border border-slate-900 rounded-b-md overflow-hidden text-xs">
            <div className="grid grid-cols-2 divide-x divide-y divide-slate-800">
              <div className="p-2">
                <strong>পিতার নাম:</strong> <span className="font-bold text-slate-900 ml-1">{isBlank ? '____________________________________________' : (data?.fatherName || data?.guardian || '')}</span>
              </div>
              <div className="p-2 font-mono">
                <strong>পিতার জাতীয় পরিচয়পত্র (NID):</strong> <span className="font-bold text-indigo-900 ml-1">{isBlank ? '____________________' : (data?.fatherNid || 'N/A')}</span>
              </div>
              <div className="p-2">
                <strong>মাতার নাম:</strong> <span className="font-bold text-slate-900 ml-1">{isBlank ? '____________________________________________' : (data?.motherName || '')}</span>
              </div>
              <div className="p-2 font-mono">
                <strong>মাতার জাতীয় পরিচয়পত্র (NID):</strong> <span className="font-bold text-indigo-900 ml-1">{isBlank ? '____________________' : (data?.motherNid || 'N/A')}</span>
              </div>
              <div className="p-2 font-mono">
                <strong>জরুরি মোবাইল নম্বর:</strong> <span className="font-bold text-emerald-800 ml-1">{isBlank ? '০১__________________' : (data?.mobile || 'N/A')}</span>
              </div>
              <div className="p-2">
                <strong>অভিভাবকের পেশা:</strong> <span className="ml-1">{isBlank ? '____________________' : (data?.fatherOccupation || data?.motherOccupation || 'ব্যবসা / চাকরি')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 5. ACADEMIC & ADDRESS DUAL SECTIONS (2 COLUMNS) ─── */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          
          {/* Column 1: Academic Info */}
          <div className="border border-slate-900 rounded-md overflow-hidden">
            <div className="bg-slate-900 text-white px-3 py-1 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap size={13} /> ৩. একাডেমিক তথ্য
            </div>
            <div className="p-2.5 space-y-1 divide-y divide-slate-200">
              <div className="flex justify-between pt-0.5">
                <span>ভর্তিকৃত শ্রেণি:</span> <strong className="text-indigo-900">{isBlank ? '__________' : getGradeBnName(data?.grade)}</strong>
              </div>
              <div className="flex justify-between pt-1">
                <span> শাখা (Section):</span> <strong>{isBlank ? '____' : (data?.section || 'A')}</strong>
              </div>
              <div className="flex justify-between pt-1">
                <span>বিভাগ / গ্রুপ:</span> <strong className="text-emerald-800">{isBlank ? '________' : (data?.group || 'সাধারণ')}</strong>
              </div>
              <div className="flex justify-between pt-1">
                <span>ঐচ্ছিক বিষয়:</span> <strong>{isBlank ? '________' : (data?.optionalSubject || 'কৃষি শিক্ষা')}</strong>
              </div>
            </div>
          </div>

          {/* Column 2: Address Info */}
          <div className="border border-slate-900 rounded-md overflow-hidden">
            <div className="bg-slate-900 text-white px-3 py-1 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={13} /> ৪. ঠিকানা বিবরণী
            </div>
            <div className="p-2.5 space-y-1 divide-y divide-slate-200">
              <div className="pt-0.5">
                <span className="text-slate-600 block text-[10px]">বর্তমান ঠিকানা:</span>
                <strong className="text-slate-900 text-[11px] block truncate">{isBlank ? 'গ্রাম: ____________ ডাকঘর: ____________ উপজেলা: ____________ জেলা: ____________' : (data?.currentAddress || 'বরইতলী, চকরিয়া, কক্সবাজার')}</strong>
              </div>
              <div className="pt-1">
                <span className="text-slate-600 block text-[10px]">স্থায়ী ঠিকানা:</span>
                <strong className="text-slate-900 text-[11px] block truncate">{isBlank ? 'গ্রাম: ____________ ডাকঘর: ____________ উপজেলা: ____________ জেলা: ____________' : (data?.permanentAddress || data?.currentAddress || 'বরইতলী, চকরিয়া, কক্সবাজার')}</strong>
              </div>
              <div className="pt-1">
                <span className="text-slate-600 block text-[10px]">পূর্ববর্তী বিদ্যালয়ের নাম:</span>
                <strong className="text-slate-900 text-[11px] block truncate">{isBlank ? '________________________________________' : (data?.prevSchoolName || 'বরইতলী সরকারি প্রাথমিক বিদ্যালয়')}</strong>
              </div>
            </div>
          </div>

        </div>

        {/* ─── 6. DECLARATION & TERMS ─── */}
        <div className="p-3 bg-slate-50 border border-slate-800 rounded-md text-[10.5px] text-slate-800 leading-relaxed">
          <p className="font-bold text-slate-950 mb-0.5">অঙ্গীকারনামা:</p>
          <p>আমি এই মর্মে অঙ্গীকার করিতেছি যে, অত্র ফরমে প্রদত্ত যাবতীয় তথ্যাবলী সম্পূর্ণ সত্য ও সঠিক। বিদ্যালয়ের যাবতীয় নিয়ম-শৃঙ্খলা ও আচরণবিধি মানিয়া চলিতে বাধ্য থাকিব। কোনো তথ্য অসত্য বা ভুল প্রমাণিত হইলে অত্র ভর্তি সরাসরি বাতিল বলিয়া গণ্য হইবে।</p>
        </div>

        {/* ─── 7. OFFICE & ADMISSION COMMITTEE APPROVAL (FOR OFFICE USE ONLY) ─── */}
        <div className="border border-slate-800 rounded-md overflow-hidden text-xs">
          <div className="bg-slate-100/90 px-3 py-1 font-bold text-[11px] uppercase tracking-wider border-b border-slate-800 flex justify-between items-center text-slate-900">
            <span>দাপ্তরিক ও ভর্তি কমিটির ব্যবহারের জন্য (FOR OFFICE USE ONLY)</span>
            <span className="text-[10px] font-semibold text-slate-600">ভর্তি যাচাই ও চূড়ান্ত সিদ্ধান্ত</span>
          </div>
          <div className="p-2.5 sm:p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] bg-white items-center">
            <div>
              <span className="text-slate-600">ভর্তি অনুমোদন:</span>
              <span className="font-bold ml-1.5 text-slate-900">[ &nbsp; ] অনুমোদিত &nbsp; [ &nbsp; ] অপেক্ষমাণ</span>
            </div>
            <div>
              <span className="text-slate-600">চূড়ান্ত শ্রেণি রোল:</span>
              <span className="font-mono font-bold ml-1.5 text-indigo-900">{formattedRoll}</span>
            </div>
            <div>
              <span className="text-slate-600">ভর্তি ফি রসিদ নং:</span>
              <span className="font-mono font-bold ml-1.5 text-slate-900">REC-২০২৬-________</span>
            </div>
          </div>
        </div>

        {/* ─── 8. SIGNATURES ROW ─── */}
        <div className="pt-6 pb-2 flex justify-between items-end text-xs font-bold text-slate-950">
          <div className="text-center">
            <div className="border-t border-slate-900 w-36 pt-1">শিক্ষার্থীর স্বাক্ষর ও তারিখ</div>
          </div>
          <div className="text-center">
            <div className="border-t border-slate-900 w-40 pt-1">পিতা/অভিভাবকের স্বাক্ষর</div>
          </div>
          <div className="text-center">
            <div className="border-t border-slate-900 w-48 pt-1 text-indigo-950 font-black">
              ভারপ্রাপ্ত শিক্ষক / প্রধান শিক্ষক
            </div>
          </div>
        </div>

        {/* ─── 9. FOOTER SYSTEM BRANDING ─── */}
        <div className="pt-2 border-t border-slate-300 flex justify-between text-[9px] text-slate-400 font-mono">
          <span>প্রিন্ট তারিখ: {new Date().toLocaleString('bn-BD')}</span>
          <span>বরইতলী উচ্চ বিদ্যালয় — অফিশিয়াল ভর্তি আবেদন নথি</span>
        </div>

      </div>

    </div>
  );
}
