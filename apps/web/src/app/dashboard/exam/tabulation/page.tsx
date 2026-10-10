'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Printer, BookOpen, Search, Filter, CheckCircle2, XCircle, Award, UserX, Upload, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { studentService } from '@/services/studentService';
import {
  getStudentReligion,
  getReligionSubjectKeys,
  ReligionType,
} from '@/lib/religionUtils';
import { getUniversalStudentMark } from '@/lib/markStorageUtils';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';

interface StudentInfo {
  id: string;
  roll: string;
  name: string;
  group: string;
  optionalSubject: string;
  religion: ReligionType;
}

// Standard NCTB configured subjects list per class (Dynamically linked to Curriculum)
const getNormalizedSubjects = (grade: string, group: string) => {
  const list = getActiveCurriculumSubjects(grade, group);
  return list.map((s: any) => ({
    code: s.code,
    name: s.name,
    fullMarks: s.fullMarks || 100,
    isJointPass: Boolean(s.isJointPass),
    jointPairCode: s.jointPairCode
  }));
};

export default function DynamicTabulationSheetPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedExam, setSelectedExam] = useState('অর্ধ-বার্ষিক পরীক্ষা ২০২৬');
  const [selectedGrade, setSelectedGrade] = useState('8th');
  const [selectedBranch, setSelectedBranch] = useState('A');
  const [selectedGroup, setSelectedGroup] = useState('বিজ্ঞান');
  const [pageSize, setPageSize] = useState<'a4' | 'legal'>('a4');
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolSettings, setSchoolSettings] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const storedSettings = localStorage.getItem('sms_school_settings');
      if (storedSettings) {
        try {
          setSchoolSettings(JSON.parse(storedSettings));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const gradeNumMap: Record<string, number> = { '6th': 6, '7th': 7, '8th': 8, '9th': 9, '10th': 10 };
  const targetGradeNum = gradeNumMap[selectedGrade] || 8;
  const isClass9or10 = targetGradeNum >= 9;

  // Helper to ensure NO English appears in subject names and apply short Bengali names
  const cleanBengaliSubjectName = (rawName: string) => {
    if (!rawName) return '';
    let cleaned = rawName.replace(/\s*\([A-Za-z0-9\s\.\-]+\)/g, '').trim();
    cleaned = cleaned.replace(/[A-Za-z]+/g, '').trim();

    if (cleaned === 'বাংলা ১ম পত্র' || cleaned === 'বাংলা ১ম') return 'বাংলা ১';
    if (cleaned === 'বাংলা ২য় পত্র' || cleaned === 'বাংলা ২য়') return 'বাংলা ২';
    if (cleaned === 'ইংরেজি ১ম পত্র' || cleaned === 'ইংরেজি ১ম') return 'ইংরেজি ১';
    if (cleaned === 'ইংরেজি ২য় পত্র' || cleaned === 'ইংরেজি ২য়') return 'ইংরেজি ২';
    if (cleaned === 'ডিজিটাল প্রযুক্তি' || cleaned === 'তথ্য ও যোগাযোগ প্রযুক্তি') return 'আইসিটি';
    if (cleaned.includes('ইতিহাস ও সামাজিক') || cleaned.includes('ইতিহাস')) return 'ইতিহাস';
    if (cleaned === 'কৃষি শিক্ষা' || cleaned.includes('কৃষি')) return 'কৃষি';
    if (cleaned === 'গার্হস্থ্য বিজ্ঞান' || cleaned.includes('গার্হস্থ্য')) return 'গার্হস্থ্য';
    if (cleaned === 'উচ্চতর গণিত' || cleaned.includes('উচ্চতর')) return 'উচ্চতর গণিত';
    if (cleaned === 'ব্যবসায় উদ্যোগ') return 'ব্যবসায় উদ্যোগ';
    if (cleaned === 'ইসলাম ও নৈতিক শিক্ষা' || cleaned === 'ধর্ম ও নৈতিক শিক্ষা' || cleaned.includes('ধর্ম')) return 'ধর্ম';
    return cleaned;
  };

  const configuredSubjects = getNormalizedSubjects(selectedGrade, selectedGroup);

  // Helper to calculate Grade & Point
  const calculateGP = (obtained: number, full: number) => {
    const pct = full > 0 ? (obtained / full) * 100 : 0;
    if (pct >= 80) return { grade: 'A+', point: 5.0 };
    if (pct >= 70) return { grade: 'A', point: 4.0 };
    if (pct >= 60) return { grade: 'A-', point: 3.5 };
    if (pct >= 50) return { grade: 'B', point: 3.0 };
    if (pct >= 40) return { grade: 'C', point: 2.0 };
    if (pct >= 33) return { grade: 'D', point: 1.0 };
    return { grade: 'F', point: 0.0 };
  };

  // 2. Compute Tabulation Data for each student dynamically from storage
  const getTabulationStudents = (): StudentInfo[] => {
    let combinedRaw: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        const storedUploaded = localStorage.getItem('sms_uploaded_students');
        const storedStudents = localStorage.getItem('sms_students');
        if (storedUploaded) combinedRaw = [...combinedRaw, ...JSON.parse(storedUploaded)];
        if (storedStudents) combinedRaw = [...combinedRaw, ...JSON.parse(storedStudents)];
      } catch (e) {
        console.error(e);
      }
    }

    if (combinedRaw.length === 0) {
      combinedRaw = studentService.getAllStudents();
    }

    const gradeBnMap: Record<string, string> = {
      '6th': '৬ষ্ঠ শ্রেণি', '7th': '৭ম শ্রেণি', '8th': '৮ম শ্রেণি', '9th': '৯ম শ্রেণি', '10th': '১০ম শ্রেণি'
    };
    const targetGradeBn = gradeBnMap[selectedGrade] || selectedGrade;

    const filtered = combinedRaw.filter(s => {
      const sGrade = s.grade || s.gradeBn || '';
      const sSection = s.section || s.branch || 'A';
      const sGroup = s.group || 'সাধারণ';

      const matchGrade = sGrade === selectedGrade || sGrade === targetGradeBn || sGrade.includes(selectedGrade) ||
        (selectedGrade === '6th' && (sGrade.includes('6') || sGrade.includes('Six') || sGrade.includes('৬'))) ||
        (selectedGrade === '7th' && (sGrade.includes('7') || sGrade.includes('Seven') || sGrade.includes('৭'))) ||
        (selectedGrade === '8th' && (sGrade.includes('8') || sGrade.includes('Eight') || sGrade.includes('৮'))) ||
        (selectedGrade === '9th' && (sGrade.includes('9') || sGrade.includes('Nine') || sGrade.includes('৯'))) ||
        (selectedGrade === '10th' && (sGrade.includes('10') || sGrade.includes('Ten') || sGrade.includes('১০')));

      const matchSection = !selectedBranch || sSection === selectedBranch || sSection.toLowerCase() === selectedBranch.toLowerCase();
      const matchGroup = isClass9or10 ? (sGroup === selectedGroup || sGroup.includes(selectedGroup) || (selectedGroup === 'বিজ্ঞান' && sGroup === 'science') || (selectedGroup === 'মানবিক' && sGroup === 'humanities') || (selectedGroup === 'ব্যবসায় শিক্ষা' && sGroup === 'commerce')) : true;

      return matchGrade && matchSection && matchGroup;
    });

    const uniqueMap = new Map<string, StudentInfo>();
    filtered.forEach((st, idx) => {
      const r = st.roll || String(idx + 1).padStart(2, '0');
      if (!uniqueMap.has(r)) {
        uniqueMap.set(r, {
          id: st.id || `st_${r}`,
          roll: r,
          name: st.name,
          group: isClass9or10 ? selectedGroup : 'সাধারণ',
          optionalSubject: st.optionalSubject || (isClass9or10 && selectedGroup === 'বিজ্ঞান' ? 'উচ্চতর গণিত' : 'কৃষি শিক্ষা'),
          religion: getStudentReligion(st),
        });
      }
    });

    return Array.from(uniqueMap.values());
  };

  const currentTabulationStudents = getTabulationStudents();

  const processedStudents = currentTabulationStudents.filter(st => {
    if (searchQuery && !st.name.toLowerCase().includes(searchQuery.toLowerCase()) && !st.roll.includes(searchQuery)) return false;
    return true;
  }).map(student => {
    let totalObtained = 0;
    let totalFull = 0;
    let mainGPPoints = 0;
    let mainUnitsCount = 0;
    let hasFailed = false;

    const subjectMarksMap: Record<string, { total: number; grade: string; point: number }> = {};

    const OPTIONAL_KEYWORDS = ['কৃষি', 'গার্হস্থ্য', 'উচ্চতর গণিত', 'কম্পিউটার শিক্ষা'];
    const OPTIONAL_CODE_PREFIXES = ['AGR', 'HMS', 'HMT', 'CMP'];
    const isOptionalSub = (s: any) =>
      OPTIONAL_KEYWORDS.some(kw => s.name && s.name.includes(kw)) ||
      OPTIONAL_CODE_PREFIXES.some(pfx => s.code && String(s.code).startsWith(pfx));

    const mainSubjects = configuredSubjects.filter((s: any) => !isOptionalSub(s));
    const optSubject = configuredSubjects.find((s: any) => isOptionalSub(s));

    const processedCodes = new Set<string>();

    for (let i = 0; i < mainSubjects.length; i++) {
      const sub = mainSubjects[i];
      if (processedCodes.has(sub.code)) continue;

      const nextSub = mainSubjects[i + 1];
      const isJointPair = Boolean(nextSub && (
        (sub.name.includes('বাংলা ১ম') && nextSub.name.includes('বাংলা ২য়')) ||
        (sub.name.includes('ইংরেজি ১ম') && nextSub.name.includes('ইংরেজি ২য়')) ||
        (sub.isJointPass && (
          (sub.code.startsWith('BAN') && nextSub.code.startsWith('BAN')) ||
          (sub.code.startsWith('ENG') && nextSub.code.startsWith('ENG')) ||
          sub.jointPairCode === nextSub.code
        ))
      ));

      if (isJointPair) {
        const ret1 = getUniversalStudentMark({
          exam: selectedExam,
          grade: selectedGrade,
          branch: selectedBranch,
          group: isClass9or10 ? student.group : 'সাধারণ',
          subjectCodeOrName: sub.code || sub.name,
          studentRoll: student.roll,
          studentId: student.id,
          studentName: student.name,
          religion: student.religion
        });
        const ret2 = getUniversalStudentMark({
          exam: selectedExam,
          grade: selectedGrade,
          branch: selectedBranch,
          group: isClass9or10 ? student.group : 'সাধারণ',
          subjectCodeOrName: nextSub.code || nextSub.name,
          studentRoll: student.roll,
          studentId: student.id,
          studentName: student.name,
          religion: student.religion
        });

        const jointTotal = ret1.total + ret2.total;
        const jointFull = (sub.fullMarks || 100) + (nextSub.fullMarks || 100);
        const jointCalc = calculateGP(jointTotal, jointFull);

        if (jointCalc.grade === 'F') hasFailed = true;

        subjectMarksMap[sub.code] = { total: ret1.total, grade: jointCalc.grade, point: jointCalc.point };
        subjectMarksMap[nextSub.code] = { total: ret2.total, grade: jointCalc.grade, point: jointCalc.point };

        totalObtained += jointTotal;
        totalFull += jointFull;
        mainGPPoints += jointCalc.point;
        mainUnitsCount++;

        processedCodes.add(sub.code);
        processedCodes.add(nextSub.code);
      } else {
        const ret = getUniversalStudentMark({
          exam: selectedExam,
          grade: selectedGrade,
          branch: selectedBranch,
          group: isClass9or10 ? student.group : 'সাধারণ',
          subjectCodeOrName: sub.code || sub.name,
          studentRoll: student.roll,
          studentId: student.id,
          studentName: student.name,
          religion: student.religion
        });

        const calc = calculateGP(ret.total, sub.fullMarks || 100);
        if (calc.grade === 'F') hasFailed = true;

        subjectMarksMap[sub.code] = { total: ret.total, grade: calc.grade, point: calc.point };

        totalObtained += ret.total;
        totalFull += (sub.fullMarks || 100);
        mainGPPoints += calc.point;
        mainUnitsCount++;

        processedCodes.add(sub.code);
      }
    }

    // 4th Subject Bonus (GP > 2.00)
    let bonusGP = 0;
    if (optSubject) {
      const optRet = getUniversalStudentMark({
        exam: selectedExam,
        grade: selectedGrade,
        branch: selectedBranch,
        group: isClass9or10 ? student.group : 'সাধারণ',
        subjectCodeOrName: student.optionalSubject || optSubject.name || optSubject.code,
        studentRoll: student.roll,
        studentId: student.id,
        studentName: student.name,
        religion: student.religion
      });

      const optCalc = calculateGP(optRet.total, optSubject.fullMarks || 100);
      subjectMarksMap[optSubject.code] = { total: optRet.total, grade: optCalc.grade, point: optCalc.point };
      totalObtained += optRet.total;
      totalFull += (optSubject.fullMarks || 100);
      bonusGP = Math.max(0, optCalc.point - 2.00);
    }

    const gpaWithout4th = hasFailed || mainUnitsCount === 0 ? 0.0 : Number((mainGPPoints / mainUnitsCount).toFixed(2));
    const finalGPA = hasFailed || mainUnitsCount === 0 ? 0.0 : Math.min(5.00, Number(((mainGPPoints + bonusGP) / mainUnitsCount).toFixed(2)));
    const overallGrade = hasFailed ? 'F' : finalGPA >= 5.0 ? 'A+' : finalGPA >= 4.0 ? 'A' : finalGPA >= 3.5 ? 'A-' : finalGPA >= 3.0 ? 'B' : finalGPA >= 2.0 ? 'C' : 'D';

    return {
      ...student,
      subjectMarksMap,
      totalObtained,
      totalFull,
      gpaWithout4th,
      finalGPA,
      overallGrade,
      hasFailed
    };
  });

  if (!mounted) {
    return (
      <div className="max-w-[98%] mx-auto py-16" suppressHydrationWarning>
        <div className="animate-pulse space-y-6">
          <div className="h-28 bg-slate-200 rounded-3xl" />
          <div className="h-96 bg-slate-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 print:p-0 print:m-0 print:space-y-0" suppressHydrationWarning>

      {/* DYNAMIC LANDSCAPE PRINT PAGE STYLES */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${pageSize === 'legal' ? 'legal landscape' : 'A4 landscape'};
            margin: 4mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      
      {/* TOP ACTIONS (Clean & Compact) */}
      <div className="flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-xs transition transform active:scale-95 shrink-0 cursor-pointer"
        >
          <Printer size={15} />
          টেবুলেশন শীট প্রিন্ট করুন (Landscape)
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-bold">
          
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">১. পরীক্ষা (Exam)</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-200 text-slate-900 font-bold cursor-pointer"
            >
              <option value="অর্ধ-বার্ষিক পরীক্ষা ২০২৬">অর্ধ-বার্ষিক পরীক্ষা ২০২৬</option>
              <option value="বার্ষিক পরীক্ষা ২০২৬">বার্ষিক পরীক্ষা ২০২৬</option>
              <option value="এসএসসি প্রাক-নির্বাচনী পরীক্ষা ২০২৬">এসএসসি প্রাক-নির্বাচনী পরীক্ষা ২০২৬</option>
              <option value="এসএসসি নির্বাচনী (টেস্ট) পরীক্ষা ২০২৬">এসএসসি নির্বাচনী (টেস্ট) পরীক্ষা ২০২৬</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">২. শ্রেণি (Class)</label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                const newGrade = e.target.value;
                setSelectedGrade(newGrade);
                if (newGrade === '9th' || newGrade === '10th') {
                  setSelectedBranch('Science');
                  setSelectedGroup('বিজ্ঞান');
                } else {
                  setSelectedBranch('A');
                  setSelectedGroup('সাধারণ');
                }
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-200 text-slate-900 font-bold cursor-pointer"
            >
              <option value="6th">৬ষ্ঠ শ্রেণি (Class 6)</option>
              <option value="7th">৭ম শ্রেণি (Class 7)</option>
              <option value="8th">৮ম শ্রেণি (Class 8)</option>
              <option value="9th">৯ম শ্রেণি (Class 9)</option>
              <option value="10th">১০ম শ্রেণি (Class 10)</option>
            </select>
          </div>

          {/* SECTION OR GROUP SELECTOR */}
          <div>
            <label className="block text-[10px] font-extrabold text-indigo-700 uppercase mb-1">
              {isClass9or10 ? '৩. বিভাগ / গ্রুপ (Group)' : '৩. শাখা (Section)'}
            </label>
            <select
              value={isClass9or10 ? selectedGroup : selectedBranch}
              onChange={(e) => {
                const val = e.target.value;
                if (isClass9or10) {
                  setSelectedGroup(val);
                  setSelectedBranch(val === 'বিজ্ঞান' ? 'Science' : val === 'মানবিক' ? 'Humanities' : 'Commerce');
                } else {
                  setSelectedBranch(val);
                  setSelectedGroup('সাধারণ');
                }
              }}
              className="w-full px-3 py-2.5 bg-indigo-50/50 border border-indigo-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-200 text-indigo-950 font-bold cursor-pointer"
            >
              {isClass9or10 ? (
                <>
                  <option value="বিজ্ঞান">🧪 বিজ্ঞান বিভাগ (Science)</option>
                  <option value="মানবিক">📚 মানবিক বিভাগ (Humanities)</option>
                  <option value="ব্যবসায় শিক্ষা">💼 ব্যবসায় শিক্ষা (Commerce)</option>
                </>
              ) : (
                <>
                  <option value="A">Section A (ক শাখা)</option>
                  <option value="B">Section B (খ শাখা)</option>
                  <option value="C">Section C (গ শাখা)</option>
                </>
              )}
            </select>
          </div>

          {/* PAGE SIZE SELECTOR FOR LANDSCAPE PRINTING */}
          <div>
            <label className="block text-[10px] font-extrabold text-amber-700 uppercase mb-1">৪. প্রিন্ট পেইজ সাইজ (Page Size)</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as 'a4' | 'legal')}
              className="w-full px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-200 text-amber-950 font-bold cursor-pointer"
            >
              <option value="a4">📄 A4 (Landscape 297mm × 210mm)</option>
              <option value="legal">📜 Legal (Landscape 355.6mm × 215.9mm)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">৫. খোঁজ করুন (Search)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="রোল বা নাম লিখুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-200 font-bold text-slate-900"
              />
              <Search className="absolute left-3 top-3 text-slate-400" size={15} />
            </div>
          </div>

        </div>
      </div>

      {/* PRINTABLE OFFICIAL TABULATION SHEET */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-950 shadow-sm space-y-5 print:shadow-none print:p-0 print:border-none">
        
        {/* TABULATION HEADER */}
        <div className="text-center border-b-2 border-slate-950 pb-4 space-y-1">
          <h2 className="text-2xl font-black text-slate-950 tracking-tight">
            {schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
          </h2>
          <p className="text-xs font-bold text-slate-800">
            {schoolSettings?.address || 'চকরিয়া, কক্সবাজার।'} | EIIN: {schoolSettings?.eiin || '106184'}
          </p>
          <div className="pt-1">
            <span className="inline-block px-5 py-1 bg-slate-950 text-white font-black text-xs uppercase tracking-widest">
              {selectedExam} — ফলাফল টেবুলেশন রেজিস্টার ২০২৬ ({selectedGrade === '6th' ? '৬ষ্ঠ' : selectedGrade === '7th' ? '৭ম' : selectedGrade === '8th' ? '৮ম' : selectedGrade === '9th' ? '৯ম' : '১০ম'} শ্রেণি {isClass9or10 ? `| ${selectedGroup}` : ''})
            </span>
          </div>
        </div>

        {/* TABULATION TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse font-sans border border-slate-950">
            <thead>
              <tr className="bg-slate-200 text-slate-950 font-black uppercase text-[9.5px] border-b border-slate-950">
                <th className="p-1.5 text-center border-r border-slate-950 w-12">রোল</th>
                <th className="p-1.5 border-r border-slate-950 min-w-[140px]">শিক্ষার্থীর নাম</th>
                
                {/* DYNAMIC SUBJECT COLUMNS WITH CLEAN BENGALI NAMES ONLY */}
                {configuredSubjects.map((sub: any) => (
                  <th key={sub.code} className="p-1.5 text-center border-r border-slate-950 min-w-[60px]">
                    <div className="truncate font-black">{cleanBengaliSubjectName(sub.name)}</div>
                    <div className="text-[7.5px] text-slate-600 font-mono font-normal">({sub.fullMarks})</div>
                  </th>
                ))}

                <th className="p-1.5 text-center border-r border-slate-950 w-20">মোট নম্বর</th>
                <th className="p-1.5 text-center border-r border-slate-950 w-16 bg-indigo-50 text-indigo-950">GPA</th>
                <th className="p-1.5 text-center border-r border-slate-950 w-14">গ্রেড</th>
                <th className="p-1.5 text-center w-20">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-950 font-medium">
              {processedStudents.length === 0 ? (
                <tr>
                  <td colSpan={configuredSubjects.length + 6} className="p-10 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                      <UserX size={24} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-900">এই শ্রেণি বা শাখায় কোনো শিক্ষার্থী পাওয়া যায়নি</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        অনুগ্রহ করে সেটিংস পেজ থেকে বাল্ক শিক্ষার্থী সিএসভি ফাইল আপলোড করুন অথবা শিক্ষার্থী তালিকায় নতুন শিক্ষার্থী যোগ করুন।
                      </p>
                    </div>
                    <div className="pt-1 flex justify-center gap-3 print:hidden">
                      <Link href="/dashboard/settings" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5">
                        <Upload size={14} /> বাল্ক আপলোড দিন
                      </Link>
                      <Link href="/dashboard/students" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5">
                        <UserCheck size={14} /> শিক্ষার্থী তালিকা
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                processedStudents.map((st) => (
                  <tr key={st.roll} className="border-b border-slate-950 hover:bg-slate-50/80">
                    <td className="p-1.5 text-center font-black font-mono border-r border-slate-950">{st.roll}</td>
                    <td className="p-1.5 font-bold border-r border-slate-950 text-slate-950">{st.name}</td>

                    {/* DYNAMIC SUBJECT MARKS */}
                    {configuredSubjects.map((sub: any) => {
                      const markObj = st.subjectMarksMap[sub.code];
                      return (
                        <td key={sub.code} className="p-1.5 text-center font-mono border-r border-slate-950">
                          {markObj ? (
                            <span className={markObj.grade === 'F' ? 'text-rose-700 font-black' : 'text-slate-900 font-bold'}>
                              {markObj.total} ({markObj.grade})
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="p-1.5 text-center font-mono font-black text-slate-950 border-r border-slate-950">{st.totalObtained}</td>
                    <td className="p-1.5 text-center font-mono font-black text-indigo-950 bg-indigo-50/50 border-r border-slate-950 text-xs">
                      {st.hasFailed ? '0.00' : st.finalGPA.toFixed(2)}
                    </td>
                    <td className="p-1.5 text-center font-black border-r border-slate-950">{st.overallGrade}</td>
                    <td className="p-1.5 text-center font-black">
                      {st.hasFailed ? (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black uppercase inline-flex items-center gap-1">
                          <XCircle size={12} /> অকৃতকার্য
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase inline-flex items-center gap-1">
                          <CheckCircle2 size={12} /> কৃতকার্য
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {processedStudents.length > 0 && (
              <tfoot className="bg-slate-100 font-black text-[10px] text-slate-900 border-t-2 border-slate-950">
                <tr>
                  <td colSpan={2} className="p-2 border-r border-slate-950 text-center uppercase tracking-wider">
                    পরিসংখ্যান (Summary)
                  </td>
                  <td colSpan={configuredSubjects.length} className="p-2 border-r border-slate-950 text-center font-bold">
                    মোট পরীক্ষার্থী: {processedStudents.length} জন | কৃতকার্য: {processedStudents.filter(s => !s.hasFailed).length} জন | অকৃতকার্য: {processedStudents.filter(s => s.hasFailed).length} জন
                  </td>
                  <td className="p-2 text-center border-r border-slate-950 font-mono">
                    গড়: {(processedStudents.reduce((acc, s) => acc + s.totalObtained, 0) / processedStudents.length).toFixed(0)}
                  </td>
                  <td className="p-2 text-center border-r border-slate-950 font-mono bg-indigo-100/70 text-indigo-950">
                    {(processedStudents.reduce((acc, s) => acc + (s.hasFailed ? 0 : s.finalGPA), 0) / processedStudents.length).toFixed(2)}
                  </td>
                  <td colSpan={2} className="p-2 text-center font-black text-emerald-800">
                    পাস হার: {((processedStudents.filter(s => !s.hasFailed).length / processedStudents.length) * 100).toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* FOOTER SIGNATURES FOR OFFICIAL PRINT */}
        <div className="pt-8 hidden print:flex justify-between items-end text-center text-xs font-bold text-slate-950">
          <div>
            <div className="w-36 border-b border-slate-950 mx-auto"></div>
            <p className="mt-1">প্রস্তুতকারীর স্বাক্ষর</p>
          </div>
          <div>
            <div className="w-36 border-b border-slate-950 mx-auto"></div>
            <p className="mt-1">পরীক্ষা নিয়ন্ত্রক</p>
          </div>
          <div>
            <div className="w-36 border-b border-slate-950 mx-auto"></div>
            <p className="mt-1 font-black">প্রধান শিক্ষক</p>
          </div>
        </div>

      </div>

    </div>
  );
}
