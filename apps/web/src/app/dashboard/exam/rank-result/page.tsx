'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  Trophy, 
  Medal, 
  Printer, 
  Search, 
  CheckCircle2, 
  XCircle, 
  UserX, 
  Star, 
  AlertCircle,
  Layers,
  Crown,
  X
} from 'lucide-react';
import { studentService } from '@/services/studentService';
import {
  getStudentReligion,
  ReligionType,
  isReligionSubject,
} from '@/lib/religionUtils';
import { getUniversalStudentMark } from '@/lib/markStorageUtils';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import SchoolPadWrapper from '@/components/SchoolPadWrapper';

interface StudentInfo {
  id: string;
  roll: string;
  name: string;
  grade: string;
  gradeBn: string;
  section: string;
  group: string;
  optionalSubject: string;
  religion: ReligionType;
}

interface RankedStudent extends StudentInfo {
  totalObtained: number;
  totalFull: number;
  obtainedPercentage: number;
  gpaWithout4th: number;
  bonusGP: number;
  finalGPA: number;
  overallGrade: string;
  hasFailed: boolean;
  failedCount: number;
  failedSubjects: string[];
  isConsidered: boolean;
  position: number;
  classPosition: number;
  schoolPosition: number;
  badge: string;
}

export interface CombinedCriteria {
  includePass: boolean;
  includeFail1: boolean;
  includeFail2: boolean;
  includeFail3: boolean;
  includeFail4Plus: boolean;
  includeConsidered: boolean;
}

type MainTab = 'class_rank' | 'school_champions';

export default function FreshRankBasedResultPage() {
  const [mounted, setMounted] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('class_rank');
  const [selectedExam, setSelectedExam] = useState('অর্ধ-বার্ষিক পরীক্ষা ২০২৬');
  const [selectedGrade, setSelectedGrade] = useState('8th');
  const [selectedBranch, setSelectedBranch] = useState('A');
  const [selectedGroup, setSelectedGroup] = useState('বিজ্ঞান');
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolSettings, setSchoolSettings] = useState<any>(null);

  // 🎯 Clean Checkbox Inclusions (Default: Pass + 1 & 2 Fail included)
  const [criteria, setCriteria] = useState<CombinedCriteria>({
    includePass: true,
    includeFail1: true,
    includeFail2: true,
    includeFail3: false,
    includeFail4Plus: false,
    includeConsidered: true
  });

  // Special Consideration Persistence
  const [specialConsideredIds, setSpecialConsideredIds] = useState<string[]>([]);
  const [showBlankPadModal, setShowBlankPadModal] = useState<boolean>(false);

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

  // Load Special Considered IDs from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = "sms_special_considered_" + selectedExam + "_" + selectedGrade + "_" + selectedBranch + "_" + selectedGroup;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setSpecialConsideredIds(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      } else {
        setSpecialConsideredIds([]);
      }
    }
  }, [selectedExam, selectedGrade, selectedBranch, selectedGroup]);

  // Toggle Special Consideration for a student
  const handleToggleSpecialConsideration = (studentId: string) => {
    let updated: string[];
    if (specialConsideredIds.includes(studentId)) {
      updated = specialConsideredIds.filter(id => id !== studentId);
    } else {
      updated = [...specialConsideredIds, studentId];
    }
    setSpecialConsideredIds(updated);

    if (typeof window !== 'undefined') {
      const key = "sms_special_considered_" + selectedExam + "_" + selectedGrade + "_" + selectedBranch + "_" + selectedGroup;
      localStorage.setItem(key, JSON.stringify(updated));
    }
  };

  const gradeNumMap: Record<string, number> = { '6th': 6, '7th': 7, '8th': 8, '9th': 9, '10th': 10 };
  const targetGradeNum = gradeNumMap[selectedGrade] || 8;
  const isClass9or10 = targetGradeNum >= 9;

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

  const getSubjectMarkForStudent = (student: StudentInfo, subCode: string, subName: string, examName: string, gradeStr: string, branchStr: string) => {
    const is9or10 = (gradeNumMap[gradeStr] || 6) >= 9;
    const retrieved = getUniversalStudentMark({
      exam: examName,
      grade: gradeStr,
      branch: branchStr,
      group: is9or10 ? student.group : 'সাধারণ',
      subjectCodeOrName: subCode || subName,
      studentRoll: student.roll,
      studentId: student.id,
      studentName: student.name,
      religion: student.religion
    });
    return retrieved.total;
  };

  const computeStudentMetrics = (student: StudentInfo, examName: string, gradeStr: string, branchStr: string): RankedStudent => {
    const configuredSubs = getActiveCurriculumSubjects(gradeStr, student.group).map((s: any) => ({
      code: s.code,
      name: s.name,
      fullMarks: s.fullMarks || 100,
      jointPass: s.isJointPass,
      jointWith: s.jointPairCode
    }));

    let totalObtained = 0;
    let totalFull = 0;
    let mainGPPoints = 0;
    let mainUnitsCount = 0;
    let failedCount = 0;
    let failedSubjects: string[] = [];

    const processedCodes = new Set<string>();
    const processedNames = new Set<string>();
    let hasReligionProcessed = false;

    for (let i = 0; i < configuredSubs.length; i++) {
      const sub = configuredSubs[i];
      const isRel = isReligionSubject(sub.code + " " + sub.name);

      if (processedCodes.has(sub.code) || processedNames.has(sub.name)) continue;
      if (isRel) {
        if (hasReligionProcessed) continue;
        hasReligionProcessed = true;
      }

      const nextSub = configuredSubs[i + 1];
      const isJointPair = Boolean(nextSub && (
        (sub.name.includes('বাংলা ১ম') && nextSub.name.includes('বাংলা ২য়')) ||
        (sub.name.includes('ইংরেজি ১ম') && nextSub.name.includes('ইংরেজি ২য়')) ||
        (sub.jointPass && sub.jointWith === nextSub.name)
      ));

      if (isJointPair) {
        const mark1 = getSubjectMarkForStudent(student, sub.code, sub.name, examName, gradeStr, branchStr);
        const mark2 = getSubjectMarkForStudent(student, nextSub.code, nextSub.name, examName, gradeStr, branchStr);
        const jointTotal = mark1 + mark2;
        const jointFull = sub.fullMarks + nextSub.fullMarks;
        const jointCalc = calculateGP(jointTotal, jointFull);

        if (jointCalc.grade === 'F') {
          failedCount++;
          failedSubjects.push(sub.name + " + " + nextSub.name);
        }

        totalObtained += jointTotal;
        totalFull += jointFull;
        mainGPPoints += jointCalc.point;
        mainUnitsCount++;

        processedCodes.add(sub.code);
        processedCodes.add(nextSub.code);
        processedNames.add(sub.name);
        processedNames.add(nextSub.name);
      } else {
        const mark = getSubjectMarkForStudent(student, sub.code, sub.name, examName, gradeStr, branchStr);
        const calc = calculateGP(mark, sub.fullMarks || 100);

        if (calc.grade === 'F') {
          failedCount++;
          failedSubjects.push(sub.name);
        }

        totalObtained += mark;
        totalFull += sub.fullMarks || 100;
        mainGPPoints += calc.point;
        mainUnitsCount++;

        processedCodes.add(sub.code);
        processedNames.add(sub.name);
      }
    }

    const is9or10 = (gradeNumMap[gradeStr] || 6) >= 9;
    // Determine optional subject name (4th subject) — excluded from main GPA loop
    const optSubjectName = student.optionalSubject || (is9or10 && student.group === 'বিজ্ঞান' ? 'উচ্চতর গণিত' : 'কৃষি শিক্ষা');

    // Re-compute excluding optional subject from main GPA (it was already included in the loop above — remove it)
    // The configuredSubs loop above may have already included the optional subject; we re-derive finalGPA correctly:
    const optMark = getSubjectMarkForStudent(student, optSubjectName, optSubjectName, examName, gradeStr, branchStr);
    const optCalc = calculateGP(optMark, 100);
    // NCTB bonus: optional subject adds (GP - 2) but minimum 0 — only when student has NOT failed core subjects
    const bonusGP = Math.max(0, optCalc.point - 2.00);

    const hasFailed = failedCount > 0;
    const gpaWithout4th = hasFailed || mainUnitsCount === 0 ? 0.0 : Number((mainGPPoints / mainUnitsCount).toFixed(2));
    // NCTB formula: GPA = (sum of core GPs + bonus) / number of core units — optional subject NOT in denominator
    const finalGPA = hasFailed || mainUnitsCount === 0 ? 0.0 : Math.min(5.00, Number(((mainGPPoints + bonusGP) / mainUnitsCount).toFixed(2)));
    const overallGrade = hasFailed ? 'F' : finalGPA >= 5.0 ? 'A+' : finalGPA >= 4.0 ? 'A' : finalGPA >= 3.5 ? 'A-' : finalGPA >= 3.0 ? 'B' : finalGPA >= 2.0 ? 'C' : 'D';
    const isConsidered = specialConsideredIds.includes(student.id);

    const totalCalculatedObtained = totalObtained + optMark;
    const totalCalculatedFull = totalFull + 100;
    const obtainedPercentage = totalCalculatedFull > 0 ? Number(((totalCalculatedObtained / totalCalculatedFull) * 100).toFixed(2)) : 0;

    return {
      ...student,
      totalObtained: totalCalculatedObtained,
      totalFull: totalCalculatedFull,
      obtainedPercentage,
      gpaWithout4th,
      bonusGP,
      finalGPA,
      overallGrade,
      hasFailed,
      failedCount,
      failedSubjects,
      isConsidered,
      position: 0,
      classPosition: 0,
      schoolPosition: 0,
      badge: ''
    };
  };

  // Load All Active Students
  const allCentralStudents: StudentInfo[] = useMemo(() => {
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

    const uniqueMap = new Map<string, StudentInfo>();
    combinedRaw.forEach((st, idx) => {
      const rawGrade = (st.grade || st.gradeBn || '6th').toString().trim();
      let normalizedGrade = '6th';
      if (rawGrade.includes('10') || rawGrade.includes('১০') || rawGrade.includes('ten') || rawGrade.includes('দশম')) normalizedGrade = '10th';
      else if (rawGrade.includes('9') || rawGrade.includes('৯') || rawGrade.includes('nine') || rawGrade.includes('নবম')) normalizedGrade = '9th';
      else if (rawGrade.includes('8') || rawGrade.includes('৮') || rawGrade.includes('eight') || rawGrade.includes('অষ্টম')) normalizedGrade = '8th';
      else if (rawGrade.includes('7') || rawGrade.includes('৭') || rawGrade.includes('seven') || rawGrade.includes('সপ্তম')) normalizedGrade = '7th';
      else normalizedGrade = '6th';

      const gradeBnMap: Record<string, string> = {
        '6th': '৬ষ্ঠ শ্রেণি', '7th': '৭ম শ্রেণি', '8th': '৮ম শ্রেণি', '9th': '৯ম শ্রেণি', '10th': '১০ম শ্রেণি'
      };

      const r = st.roll || String(idx + 1).padStart(2, '0');
      const uniqueKey = normalizedGrade + "_" + (st.section || st.branch || 'A') + "_" + r;

      if (!uniqueMap.has(uniqueKey)) {
        uniqueMap.set(uniqueKey, {
          id: st.id || ("st_" + uniqueKey),
          roll: r,
          name: st.name,
          grade: normalizedGrade,
          gradeBn: gradeBnMap[normalizedGrade] || (normalizedGrade + ' শ্রেণি'),
          section: st.section || st.branch || 'A',
          group: (normalizedGrade === '9th' || normalizedGrade === '10th') ? (st.group || 'বিজ্ঞান') : 'সাধারণ',
          optionalSubject: st.optionalSubject || ((normalizedGrade === '9th' || normalizedGrade === '10th') && st.group === 'বিজ্ঞান' ? 'উচ্চতর গণিত' : 'কৃষি শিক্ষা'),
          religion: getStudentReligion(st),
        });
      }
    });

    return Array.from(uniqueMap.values());
  }, [mounted]);

  // Evaluated Students
  const allSchoolEvaluatedStudents: RankedStudent[] = useMemo(() => {
    return allCentralStudents.map(st => {
      return computeStudentMetrics(st, selectedExam, st.grade, st.section);
    });
  }, [allCentralStudents, selectedExam, specialConsideredIds]);

  // All-School Passed List (100% Pass Required)
  const allSchoolPassedList: RankedStudent[] = useMemo(() => {
    const passedOnly = allSchoolEvaluatedStudents.filter(s => !s.hasFailed);
    
    return [...passedOnly].sort((a, b) => {
      if (b.finalGPA !== a.finalGPA) return b.finalGPA - a.finalGPA;
      if (b.obtainedPercentage !== a.obtainedPercentage) return b.obtainedPercentage - a.obtainedPercentage;
      if (b.gpaWithout4th !== a.gpaWithout4th) return b.gpaWithout4th - a.gpaWithout4th;
      if (b.totalObtained !== a.totalObtained) return b.totalObtained - a.totalObtained;
      return parseInt(a.roll, 10) - parseInt(b.roll, 10);
    }).map((st, idx) => ({
      ...st,
      schoolPosition: idx + 1
    }));
  }, [allSchoolEvaluatedStudents]);

  // School First (Strict 100% Pass)
  const schoolChampion = allSchoolPassedList.length > 0 ? allSchoolPassedList[0] : null;

  // Class-wise Top 3 (Strict 100% Pass)
  const classWiseTop3Map = useMemo(() => {
    const grades = ['6th', '7th', '8th', '9th', '10th'];
    const result: Record<string, RankedStudent[]> = {};

    grades.forEach(g => {
      const classPassed = allSchoolEvaluatedStudents.filter(s => s.grade === g && !s.hasFailed);
      const sortedClass = [...classPassed].sort((a, b) => {
        if (b.finalGPA !== a.finalGPA) return b.finalGPA - a.finalGPA;
        if (b.obtainedPercentage !== a.obtainedPercentage) return b.obtainedPercentage - a.obtainedPercentage;
        if (b.gpaWithout4th !== a.gpaWithout4th) return b.gpaWithout4th - a.gpaWithout4th;
        if (b.totalObtained !== a.totalObtained) return b.totalObtained - a.totalObtained;
        return parseInt(a.roll, 10) - parseInt(b.roll, 10);
      });

      result[g] = sortedClass.slice(0, 3).map((st, idx) => ({
        ...st,
        classPosition: idx + 1
      }));
    });

    return result;
  }, [allSchoolEvaluatedStudents]);

  // Active Class Students
  const currentClassStudents = useMemo(() => {
    return allSchoolEvaluatedStudents.filter(st => {
      const matchGrade = st.grade === selectedGrade;
      const matchSection = !selectedBranch || st.section === selectedBranch || st.section.toLowerCase() === selectedBranch.toLowerCase();
      const matchGroup = isClass9or10 ? (st.group === selectedGroup || (selectedGroup === 'বিজ্ঞান' && st.group === 'science') || (selectedGroup === 'মানবিক' && st.group === 'humanities') || (selectedGroup === 'ব্যবসায় শিক্ষা' && st.group === 'commerce')) : true;
      return matchGrade && matchSection && matchGroup;
    });
  }, [allSchoolEvaluatedStudents, selectedGrade, selectedBranch, selectedGroup, isClass9or10]);

  // Counts for active class
  const allPassStudentsCount = currentClassStudents.filter(s => !s.hasFailed).length;
  const fail1Count = currentClassStudents.filter(s => s.failedCount === 1).length;
  const fail2Count = currentClassStudents.filter(s => s.failedCount === 2).length;
  const fail3Count = currentClassStudents.filter(s => s.failedCount === 3).length;
  const fail4PlusCount = currentClassStudents.filter(s => s.failedCount >= 4).length;
  const consideredCount = currentClassStudents.filter(s => s.isConsidered).length;

  const toggleCriteria = (key: keyof CombinedCriteria) => {
    setCriteria(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Filtered & Ranked Student List for Class View
  const displayedClassList: RankedStudent[] = useMemo(() => {
    const matched = currentClassStudents.filter(st => {
      if (searchQuery && !st.name.toLowerCase().includes(searchQuery.toLowerCase()) && !st.roll.includes(searchQuery)) {
        return false;
      }
      if (criteria.includeConsidered && st.isConsidered) return true;
      if (!st.hasFailed && criteria.includePass) return true;
      if (st.failedCount === 1 && criteria.includeFail1) return true;
      if (st.failedCount === 2 && criteria.includeFail2) return true;
      if (st.failedCount === 3 && criteria.includeFail3) return true;
      if (st.failedCount >= 4 && criteria.includeFail4Plus) return true;
      return false;
    });

    const sorted = [...matched].sort((a, b) => {
      if (a.hasFailed !== b.hasFailed) return a.hasFailed ? 1 : -1;

      if (!a.hasFailed && !b.hasFailed) {
        if (b.finalGPA !== a.finalGPA) return b.finalGPA - a.finalGPA;
        if (b.gpaWithout4th !== a.gpaWithout4th) return b.gpaWithout4th - a.gpaWithout4th;
        if (b.totalObtained !== a.totalObtained) return b.totalObtained - a.totalObtained;
        return parseInt(a.roll, 10) - parseInt(b.roll, 10);
      }

      if (a.isConsidered !== b.isConsidered) return a.isConsidered ? -1 : 1;
      if (a.failedCount !== b.failedCount) return a.failedCount - b.failedCount;
      if (b.totalObtained !== a.totalObtained) return b.totalObtained - a.totalObtained;

      return parseInt(a.roll, 10) - parseInt(b.roll, 10);
    });

    return sorted.map((st, index) => {
      const position = index + 1;
      let badge = position + "তম স্থান";
      if (!st.hasFailed) {
        if (position === 1) badge = '🥇 ১ম স্থান (১ম মেধা)';
        else if (position === 2) badge = '🥈 ২য় স্থান (২য় মেধা)';
        else if (position === 3) badge = '🥉 ৩য় স্থান (৩য় মেধা)';
        else badge = "🎖️ " + position + "তম মেধা";
      } else if (st.isConsidered) {
        badge = "⭐ বিশেষ বিবেচনা (" + position + "তম)";
      } else {
        badge = "বিশেষ বিবেচনা (" + position + "তম)";
      }

      return {
        ...st,
        position,
        badge
      };
    });
  }, [currentClassStudents, criteria, searchQuery]);

  // Dynamic Printable Header Title
  const printableListTitle = useMemo(() => {
    const gradeBn = selectedGrade === '6th' ? '৬ষ্ঠ' : selectedGrade === '7th' ? '৭ম' : selectedGrade === '8th' ? '৮ম' : selectedGrade === '9th' ? '৯ম' : '১০ম';
    const groupStr = isClass9or10 ? (" (" + selectedGroup + ")") : (" - শাখা: " + selectedBranch);

    if (activeMainTab === 'school_champions') {
      return "সর্ব-বিদ্যালয় সেরা মেধা (স্কুল ফার্স্ট) ও শ্রেণিভিত্তিক শীর্ষ ৩ মেধা তালিকা ২০২৬ (সকল বিষয়ে উত্তীর্ণ)";
    }

    if (criteria.includePass && !criteria.includeFail1 && !criteria.includeFail2 && !criteria.includeFail3 && !criteria.includeFail4Plus) {
      return "শ্রেণিভিত্তিক মেধা তালিকা ২০২৬ (" + gradeBn + " শ্রেণি" + groupStr + " — সকল বিষয়ে উত্তীর্ণ)";
    }
    return "সম্মিলিত ফলাফল ও মেধা তালিকা ২০২৬ (" + gradeBn + " শ্রেণি" + groupStr + ")";
  }, [activeMainTab, criteria, selectedGrade, selectedGroup, selectedBranch, isClass9or10]);

  if (!mounted) {
    return <div className="p-8 text-center text-slate-400 font-bold">মেধা তালিকা লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-4 pb-12 print:p-0 print:space-y-0">
      
      {/* 🌟 1. FRESH COMPACT TOP BAR: Tabs on Left + Actions on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveMainTab('class_rank')}
            className={"py-2 px-3.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 " + (
              activeMainTab === 'class_rank'
                ? 'bg-white text-indigo-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Layers size={14} className="text-indigo-600" />
            <span>১. শ্রেণিভিত্তিক মেধা ও ফলাফল</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('school_champions')}
            className={"py-2 px-3.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 " + (
              activeMainTab === 'school_champions'
                ? 'bg-white text-amber-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Crown size={14} className="text-amber-500" />
            <span>২. 🏆 স্কুল ফার্স্ট ও শীর্ষ ৩ মেধা</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBlankPadModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer border border-slate-200"
          >
            <Printer size={13} /> ফাঁকা প্যাড
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Printer size={14} /> প্রিন্ট / PDF
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 🏛️ TAB 1: CLASS-SPECIFIC VIEW (CLEAN & MINIMALIST)                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'class_rank' && (
        <div className="space-y-3">
          
          {/* COMPACT FILTER & INCLUSIONS CONSOLE */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3 print:hidden">
            
            {/* Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs font-bold">
              <div>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-bold cursor-pointer"
                >
                  <option value="অর্ধ-বার্ষিক পরীক্ষা ২০২৬">অর্ধ-বার্ষিক পরীক্ষা ২০২৬</option>
                  <option value="বার্ষিক পরীক্ষা ২০২৬">বার্ষিক পরীক্ষা ২০২৬</option>
                  <option value="এসএসসি প্রাক-নির্বাচনী পরীক্ষা ২০২৬">এসএসসি প্রাক-নির্বাচনী পরীক্ষা ২০২৬</option>
                  <option value="এসএসসি নির্বাচনী (টেস্ট) পরীক্ষা ২০২৬">এসএসসি নির্বাচনী (টেস্ট) পরীক্ষা ২০২৬</option>
                </select>
              </div>

              <div>
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-bold cursor-pointer"
                >
                  <option value="6th">৬ষ্ঠ শ্রেণি (Class 6)</option>
                  <option value="7th">৭ম শ্রেণি (Class 7)</option>
                  <option value="8th">৮ম শ্রেণি (Class 8)</option>
                  <option value="9th">৯ম শ্রেণি (Class 9)</option>
                  <option value="10th">১০ম শ্রেণি (Class 10)</option>
                </select>
              </div>

              <div>
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
                  className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-950 font-bold cursor-pointer"
                >
                  {isClass9or10 ? (
                    <>
                      <option value="বিজ্ঞান">🧪 বিজ্ঞান বিভাগ</option>
                      <option value="মানবিক">📚 মানবিক বিভাগ</option>
                      <option value="ব্যবসায় শিক্ষা">💼 ব্যবসায় শিক্ষা</option>
                    </>
                  ) : (
                    <>
                      <option value="A">শাখা: A (ক)</option>
                      <option value="B">শাখা: B (খ)</option>
                      <option value="C">শাখা: C (গ)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="রোল বা নাম খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                />
                <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
              </div>
            </div>

            {/* Clean, Simple Filter Checkbox Badges */}
            <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-bold mr-1">তালিকা ফিল্টার:</span>

                <button
                  type="button"
                  onClick={() => toggleCriteria('includePass')}
                  className={"px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[11px] " + (
                    criteria.includePass
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-black'
                      : 'bg-white border-slate-200 text-slate-400 line-through'
                  )}
                >
                  <CheckCircle2 size={12} className={criteria.includePass ? "text-emerald-600" : "text-slate-400"} />
                  <span>পাস ({allPassStudentsCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleCriteria('includeFail1')}
                  className={"px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[11px] " + (
                    criteria.includeFail1
                      ? 'bg-amber-50 border-amber-300 text-amber-950 font-black'
                      : 'bg-white border-slate-200 text-slate-400 line-through'
                  )}
                >
                  <span>১ বিষয়ে ফেল ({fail1Count})</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleCriteria('includeFail2')}
                  className={"px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[11px] " + (
                    criteria.includeFail2
                      ? 'bg-orange-50 border-orange-300 text-orange-950 font-black'
                      : 'bg-white border-slate-200 text-slate-400 line-through'
                  )}
                >
                  <span>২ বিষয়ে ফেল ({fail2Count})</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleCriteria('includeFail3')}
                  className={"px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[11px] " + (
                    criteria.includeFail3
                      ? 'bg-rose-50 border-rose-300 text-rose-950 font-black'
                      : 'bg-white border-slate-200 text-slate-400'
                  )}
                >
                  <span>৩ বিষয় ({fail3Count})</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleCriteria('includeFail4Plus')}
                  className={"px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[11px] " + (
                    criteria.includeFail4Plus
                      ? 'bg-red-50 border-red-300 text-red-950 font-black'
                      : 'bg-white border-slate-200 text-slate-400'
                  )}
                >
                  <span>৪+ বিষয় ({fail4PlusCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleCriteria('includeConsidered')}
                  className={"px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[11px] " + (
                    criteria.includeConsidered
                      ? 'bg-purple-50 border-purple-300 text-purple-950 font-black'
                      : 'bg-white border-slate-200 text-slate-400'
                  )}
                >
                  <Star size={11} className={criteria.includeConsidered ? "text-purple-600" : "text-slate-400"} />
                  <span>বিবেচনাপ্রাপ্ত ({consideredCount})</span>
                </button>
              </div>

              <div className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                মোট নির্বাচিত: {displayedClassList.length} জন
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 🏆 TAB 2: SCHOOL CHAMPIONS & CLASS TOP 3 (CLEAN & MINIMALIST)         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'school_champions' && (
        <div className="space-y-3">
          
          {/* Exam Filter Strip */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs font-bold print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-slate-600">পরীক্ষা:</span>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 font-bold cursor-pointer"
              >
                <option value="অর্ধ-বার্ষিক পরীক্ষা ২০২৬">অর্ধ-বার্ষিক পরীক্ষা ২০২৬</option>
                <option value="বার্ষিক পরীক্ষা ২০২৬">বার্ষিক পরীক্ষা ২০২৬</option>
                <option value="এসএসসি প্রাক-নির্বাচনী পরীক্ষা ২০২৬">এসএসসি প্রাক-নির্বাচনী পরীক্ষা ২০২৬</option>
                <option value="এসএসসি নির্বাচনী (টেস্ট) পরীক্ষা ২০২৬">এসএসসি নির্বাচনী (টেস্ট) পরীক্ষা ২০২৬</option>
              </select>
            </div>

            <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>১ম শর্ত: মেধা তালিকায় স্থান পেতে সকল বিষয়ে পাস বাধ্যতামূলক</span>
            </div>
          </div>

          {/* 👑 SCHOOL CHAMPION HIGHLIGHT STRIP */}
          {schoolChampion ? (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-xs shrink-0">
                  👑
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200 px-2 py-0.5 rounded">
                      স্কুল ফার্স্ট ২০২৬ (সর্ব-বিদ্যালয় সেরা মেধা)
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mt-0.5">
                    {schoolChampion.name}
                  </h3>
                  <p className="text-xs text-slate-600 font-semibold">
                    শ্রেণি: <b>{schoolChampion.gradeBn}</b> • রোল: <b>{schoolChampion.roll}</b> • প্রাপ্ত নম্বর: <b>{schoolChampion.totalObtained}/{schoolChampion.totalFull}</b>
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right bg-white p-2 rounded-xl border border-amber-200 shrink-0">
                <span className="text-base font-black text-indigo-700 font-mono block">
                  GPA {schoolChampion.finalGPA.toFixed(2)} ({schoolChampion.overallGrade})
                </span>
                <span className="text-xs font-black text-emerald-700">
                  শতকরা হার: {schoolChampion.obtainedPercentage}%
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span>বিদ্যালয়ে সকল বিষয়ে পাস করেছে এমন কোনো শিক্ষার্থীর নম্বর পাওয়া যায়নি। মেধা তালিকায় স্থান পেতে সকল বিষয়ে পাস আবশ্যক।</span>
            </div>
          )}

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 🖨️ MASTER TABLE (EMPATHETIC & RESPECTFUL NOTICE BOARD FORMAT)          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div 
        className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-900 shadow-sm space-y-4 print:shadow-none print:border-none"
        style={{
          paddingLeft: (schoolSettings?.padMargins?.left ?? 0.5) + "in",
          paddingRight: (schoolSettings?.padMargins?.right ?? 0.5) + "in",
          paddingBottom: (schoolSettings?.padMargins?.bottom ?? 0.5) + "in",
          paddingTop: (schoolSettings?.padMargins?.top ?? 0.5) + "in"
        }}
      >
        
        {/* HEADER */}
        <div className="text-center border-b-2 border-slate-950 pb-3 space-y-1">
          <h2 className="text-2xl font-black text-slate-950 tracking-tight">
            {schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
          </h2>
          <p className="text-xs font-bold text-slate-800">
            {schoolSettings?.address || 'চকরিয়া, কক্সবাজার।'} | EIIN: {schoolSettings?.eiin || '106184'}
          </p>
          <div className="pt-1">
            <span className="inline-block px-4 py-0.5 bg-slate-950 text-white font-black text-xs uppercase tracking-wide rounded-md">
              {selectedExam} — {printableListTitle}
            </span>
          </div>
        </div>

        {/* ─── TAB 2 TABLE: ALL-SCHOOL CLASS-WISE TOP 3 (PURE LIST TABLE) ─── */}
        {activeMainTab === 'school_champions' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans border border-slate-950">
              <thead>
                <tr className="bg-slate-200 text-slate-950 font-black uppercase text-[10px] border-b border-slate-950">
                  <th className="p-2.5 border-r border-slate-950 w-28">শ্রেণি</th>
                  <th className="p-2.5 text-center border-r border-slate-950 w-20">মেধা স্থান</th>
                  <th className="p-2.5 text-center border-r border-slate-950 w-16">রোল</th>
                  <th className="p-2.5 border-r border-slate-950">শিক্ষার্থীর নাম</th>
                  <th className="p-2.5 text-center border-r border-slate-950 w-24">প্রাপ্ত নম্বর</th>
                  <th className="p-2.5 text-center border-r border-slate-950 w-20">শতকরা (%)</th>
                  <th className="p-2.5 text-center border-r border-slate-950 w-20">GPA</th>
                  <th className="p-2.5 text-center border-r border-slate-950 w-16">গ্রেড</th>
                  <th className="p-2.5 text-center w-24">ফলাফল</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-950 font-medium">
                {['6th', '7th', '8th', '9th', '10th'].flatMap((gradeKey) => {
                  const winners = classWiseTop3Map[gradeKey] || [];
                  const gradeNames: Record<string, string> = {
                    '6th': '৬ষ্ঠ শ্রেণি',
                    '7th': '৭ম শ্রেণি',
                    '8th': '৮ম শ্রেণি',
                    '9th': '৯ম শ্রেণি',
                    '10th': '১০ম শ্রেণি'
                  };
                  const gradeTitle = gradeNames[gradeKey] || (gradeKey + ' শ্রেণি');

                  if (winners.length === 0) {
                    return [(
                      <tr key={gradeKey + "_empty"} className="border-b border-slate-950">
                        <td className="p-2.5 font-black border-r border-slate-950 bg-slate-50">{gradeTitle}</td>
                        <td colSpan={8} className="p-2.5 text-center text-slate-500 italic">
                          এই শ্রেণিতে সকল বিষয়ে পাসকৃত কোনো শিক্ষার্থী নেই (মেধাতালিকায় স্থান পেতে সকল বিষয়ে পাস আবশ্যক)
                        </td>
                      </tr>
                    )];
                  }

                  return winners.map((st, idx) => (
                    <tr key={st.id + "_" + gradeKey} className="border-b border-slate-950">
                      {idx === 0 && (
                        <td rowSpan={winners.length} className="p-2.5 font-black border-r border-slate-950 bg-slate-50 align-top">
                          {gradeTitle}
                        </td>
                      )}
                      <td className="p-2.5 text-center font-black border-r border-slate-950">
                        <span className={"inline-block px-2 py-0.5 rounded text-xs font-black " + (
                          idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : 'bg-amber-700 text-white'
                        )}>
                          {idx === 0 ? '১ম মেধা' : idx === 1 ? '২য় মেধা' : '৩য় মেধা'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-black font-mono border-r border-slate-950">{st.roll}</td>
                      <td className="p-2.5 font-black border-r border-slate-950 text-slate-950">{st.name}</td>
                      <td className="p-2.5 text-center font-mono font-bold border-r border-slate-950">{st.totalObtained}/{st.totalFull}</td>
                      <td className="p-2.5 text-center font-mono font-bold border-r border-slate-950">{st.obtainedPercentage}%</td>
                      <td className="p-2.5 text-center font-mono font-black border-r border-slate-950 bg-amber-50 text-slate-950">
                        {st.finalGPA.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-center font-black border-r border-slate-950">
                        {st.overallGrade}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          উত্তীর্ণ
                        </span>
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ─── TAB 1 TABLE: CLASS-WISE RESPECTFUL NOTICE BOARD TABLE ─── */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans border border-slate-950">
              <thead>
                <tr className="bg-slate-200 text-slate-950 font-black uppercase text-[10px] border-b border-slate-950">
                  <th className="p-2.5 text-center border-r border-slate-950 w-16">স্থান / ক্রম</th>
                  <th className="p-2.5 text-center border-r border-slate-950 w-16">রোল</th>
                  <th className="p-2.5 border-r border-slate-950">শিক্ষার্থীর নাম</th>
                  <th className="p-2.5 text-center border-r border-slate-950 w-24">প্রাপ্ত নম্বর</th>
                  <th className="p-2.5 text-center border-r border-slate-950 w-20">GPA (৪র্থ ছাড়া)</th>
                  <th className="p-2.5 text-center border-r border-slate-950 w-24 bg-amber-100/60 text-slate-950">চূড়ান্ত GPA</th>
                  <th className="p-2.5 text-center border-r border-slate-950 w-20">গ্রেড</th>
                  <th className="p-2.5 text-center border-r border-slate-950 w-36">ফলাফল / মন্তব্য</th>
                  <th className="p-2.5 text-center w-28 print:hidden">বিবেচনা কন্ট্রোল</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-950 font-medium">
                {displayedClassList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                        <UserX size={20} />
                      </div>
                      <p className="text-xs font-black text-slate-900">বর্তমান ফিল্টারে কোনো শিক্ষার্থী নেই</p>
                    </td>
                  </tr>
                ) : (
                  displayedClassList.map((st) => (
                    <tr key={st.id} className={"border-b border-slate-950 hover:bg-slate-50/80 " + (st.hasFailed ? 'bg-amber-50/30' : '')}>
                      <td className="p-2.5 text-center font-black border-r border-slate-950">
                        <span className={"inline-block px-2 py-0.5 rounded text-xs font-black " + (
                          st.position === 1 && !st.hasFailed ? 'bg-amber-400 text-slate-950' :
                          st.position === 2 && !st.hasFailed ? 'bg-slate-300 text-slate-950' :
                          st.position === 3 && !st.hasFailed ? 'bg-amber-700 text-white' :
                          st.hasFailed ? 'bg-slate-100 text-slate-700' : 'bg-indigo-50 text-indigo-950'
                        )}>
                          {st.position}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-black font-mono border-r border-slate-950">{st.roll}</td>
                      <td className="p-2.5 font-black border-r border-slate-950 text-slate-950">{st.name}</td>
                      <td className="p-2.5 text-center font-mono font-bold border-r border-slate-950">{st.totalObtained}</td>
                      <td className="p-2.5 text-center font-mono font-bold border-r border-slate-950">{st.hasFailed ? '0.00' : st.gpaWithout4th.toFixed(2)}</td>
                      <td className="p-2.5 text-center font-mono font-black border-r border-slate-950 bg-amber-50/50 text-slate-950 text-sm">
                        {st.hasFailed ? '0.00' : st.finalGPA.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-center font-black border-r border-slate-950">
                        <span className={st.overallGrade === 'F' ? 'text-amber-800 font-bold' : 'text-emerald-700 font-black'}>
                          {st.overallGrade}
                        </span>
                      </td>
                      {/* 🌟 RESPECTFUL STATUS: Shows 'উত্তীর্ণ' for pass and 'বিশেষ বিবেচনা' for consideration without showing failed subjects */}
                      <td className="p-2.5 text-center border-r border-slate-950">
                        {st.hasFailed ? (
                          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-extrabold text-amber-900 bg-amber-100 border border-amber-300">
                            বিশেষ বিবেচনা
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200">
                            উত্তীর্ণ (পাস)
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-center print:hidden">
                        {st.hasFailed && (
                          <button
                            onClick={() => handleToggleSpecialConsideration(st.id)}
                            className={"px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition cursor-pointer flex items-center justify-center gap-1 mx-auto " + (
                              st.isConsidered
                                ? 'bg-amber-500 text-slate-950 shadow border border-amber-600'
                                : 'bg-slate-100 text-slate-700 hover:bg-amber-100 border border-slate-200'
                            )}
                          >
                            <Star size={10} className={st.isConsidered ? 'fill-slate-950' : ''} />
                            {st.isConsidered ? 'অনুমোদিত' : 'অনুমোদন'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SIGNATURE FOOTER */}
        <div className="pt-8 hidden print:flex justify-between items-end text-center text-xs font-bold text-slate-950">
          <div>
            <div className="w-36 border-b border-slate-950 mx-auto"></div>
            <p className="mt-1">শ্রেণি শিক্ষকের স্বাক্ষর</p>
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

      {/* 🖨️ BLANK SCHOOL PAD MODAL */}
      {showBlankPadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 print:p-0 print:bg-white print:relative print:z-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-0 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <div>
                <h3 className="font-black text-slate-950 text-base flex items-center gap-2">
                  <Printer className="text-emerald-600" size={18} />
                  ফাঁকা স্কুল প্যাড প্রিন্ট প্রিভিউ
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={15} /> প্রিন্ট করুন (A4)
                </button>
                <button
                  type="button"
                  onClick={() => setShowBlankPadModal(false)}
                  className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="py-2">
              <SchoolPadWrapper
                settings={schoolSettings}
                mode="blank_pad"
                title=""
                hideHeaderActions={true}
                signatures={[
                  {
                    title: schoolSettings?.principalName || 'মোহাম্মদ রফিকুল ইসলাম',
                    designation: schoolSettings?.principalTitle || 'প্রধান শিক্ষক',
                    institution: schoolSettings?.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
                    address: schoolSettings?.address || 'বরইতলী, চকরিয়া, কক্সবাজার।',
                    rightAligned: true
                  }
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
