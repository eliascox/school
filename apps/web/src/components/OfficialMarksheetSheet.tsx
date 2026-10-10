'use client';

import React from 'react';
import {
  getStudentReligion,
  isReligionSubject,
} from '@/lib/religionUtils';
import { getUniversalStudentMark } from '@/lib/markStorageUtils';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import { studentService } from '@/services/studentService';

export interface StudentProfile {
  id: string;
  roll: string;
  name: string;
  grade: string;
  gradeBn: string;
  section: string;
  group: string;
  fatherName: string;
  motherName: string;
  session: string;
  optionalSubject: string;
}

export interface SubjectMark {
  code: string;
  name: string;
  fullMarks: number;
  cq: number;
  mcq: number;
  practical: number;
  ca: number;
  totalMarks: number;
  isJointPass?: boolean;
  jointPairCode?: string;
  jointPairName?: string;
  jointFullMarks?: number;
  isJointMaster?: boolean;
  isJointSlave?: boolean;
  jointCombinedTotal?: number;
  jointCombinedGrade?: string;
  jointCombinedPoint?: number;
  letterGrade?: string;
  gradePoint?: number;
  hasEnteredMarks?: boolean;
}

// NCTB Grading Scale Calculation
export const calculateGradeAndPoint = (obtained: number, full: number): { grade: string; point: number } => {
  if (full <= 0) return { grade: 'F', point: 0.0 };
  const percentage = (obtained / full) * 100;
  if (percentage >= 80) return { grade: 'A+', point: 5.0 };
  if (percentage >= 70) return { grade: 'A', point: 4.0 };
  if (percentage >= 60) return { grade: 'A-', point: 3.5 };
  if (percentage >= 50) return { grade: 'B', point: 3.0 };
  if (percentage >= 40) return { grade: 'C', point: 2.0 };
  if (percentage >= 33) return { grade: 'D', point: 1.0 };
  return { grade: 'F', point: 0.0 };
};

// ─── GET STUDENTS FOR CLASS / SECTION / GROUP ───
export const getStudentsForClassSectionGroup = (
  grade: string,
  section: string,
  group: string
): StudentProfile[] => {
  const isClass9or10 = grade === '9th' || grade === '10th';
  const targetGroup = isClass9or10 ? group : 'সাধারণ';
  const gradeBnMap: Record<string, string> = {
    '6th': '৬ষ্ঠ শ্রেণি',
    '7th': '৭ম শ্রেণি',
    '8th': '৮ম শ্রেণি',
    '9th': '৯ম শ্রেণি',
    '10th': '১০ম শ্রেণি'
  };
  const gradeBn = gradeBnMap[grade] || grade;

  if (typeof window === 'undefined') return [];

  // 1. Load from central studentService
  let all = studentService.getAllStudents();

  // 2. Fallback to direct localStorage if needed
  if (all.length === 0) {
    try {
      const storedUploaded = localStorage.getItem('sms_uploaded_students');
      const storedStudents = localStorage.getItem('sms_students');
      if (storedUploaded) {
        try { all = [...all, ...JSON.parse(storedUploaded)]; } catch (e) {}
      }
      if (storedStudents) {
        try { all = [...all, ...JSON.parse(storedStudents)]; } catch (e) {}
      }
    } catch (e) {
      console.error('Error reading student storage', e);
    }
  }

  const filtered = all.filter(s => {
    const sGrade = (s.grade || s.gradeBn || '').trim();
    const sSection = (s.section || s.branch || 'A').trim();
    const sGroup = (s.group || 'সাধারণ').trim();

    const matchedGrade = !grade || grade === 'all' || sGrade === grade || sGrade === gradeBn || sGrade.includes(grade) ||
      (grade === '6th' && (sGrade.includes('6') || sGrade.includes('Six') || sGrade.includes('৬'))) ||
      (grade === '7th' && (sGrade.includes('7') || sGrade.includes('Seven') || sGrade.includes('৭'))) ||
      (grade === '8th' && (sGrade.includes('8') || sGrade.includes('Eight') || sGrade.includes('৮'))) ||
      (grade === '9th' && (sGrade.includes('9') || sGrade.includes('Nine') || sGrade.includes('৯'))) ||
      (grade === '10th' && (sGrade.includes('10') || sGrade.includes('Ten') || sGrade.includes('১০')));

    const secLower = (section || '').toLowerCase().trim();
    const sSecLower = sSection.toLowerCase().trim();
    const matchedSection = !section || secLower === 'all' || sSecLower === secLower ||
      (secLower === 'a' && (sSecLower === 'a' || sSecLower === 'ক' || sSecLower.includes('section a') || sSecLower.includes('শাখা a'))) ||
      (secLower === 'b' && (sSecLower === 'b' || sSecLower === 'খ' || sSecLower.includes('section b') || sSecLower.includes('শাখা b'))) ||
      (secLower === 'c' && (sSecLower === 'c' || sSecLower === 'গ' || sSecLower.includes('section c') || sSecLower.includes('শাখা c')));

    let matchedGroup = true;
    if (isClass9or10) {
      const grpLower = targetGroup.toLowerCase().trim();
      const sGrpLower = sGroup.toLowerCase().trim();
      matchedGroup = sGrpLower === grpLower || sGrpLower.includes(grpLower) ||
        ((grpLower.includes('বিজ্ঞান') || grpLower.includes('science')) && (sGrpLower.includes('science') || sGrpLower.includes('বিজ্ঞান'))) ||
        ((grpLower.includes('মানবিক') || grpLower.includes('humanities') || grpLower.includes('arts')) && (sGrpLower.includes('humanities') || sGrpLower.includes('মানবিক') || sGrpLower.includes('arts'))) ||
        ((grpLower.includes('ব্যবসায়') || grpLower.includes('ব্যবসায়') || grpLower.includes('commerce') || grpLower.includes('business')) && (sGrpLower.includes('commerce') || sGrpLower.includes('business') || sGrpLower.includes('ব্যবসায়') || sGrpLower.includes('ব্যবসায়'))) ||
        ((grpLower.includes('সাধারণ') || grpLower.includes('general')) && (sGrpLower.includes('general') || sGrpLower.includes('সাধারণ')));
    }

    return matchedGrade && matchedSection && matchedGroup;
  });

  // Sort by roll ascending
  filtered.sort((a, b) => {
    const rA = parseInt(String(a.roll || '').replace(/\D/g, ''), 10) || 0;
    const rB = parseInt(String(b.roll || '').replace(/\D/g, ''), 10) || 0;
    return rA - rB;
  });

  return filtered.map((st, idx) => {
    const r = st.roll || String(idx + 1).padStart(2, '0');
    return {
      id: st.id || `st_${r}_${idx}`,
      roll: r,
      name: st.name || `শিক্ষার্থী ${r}`,
      grade: grade,
      gradeBn: gradeBn,
      section: st.section || st.branch || section,
      group: isClass9or10 ? (st.group || targetGroup) : 'সাধারণ',
      fatherName: st.fatherName || (st as any).guardian || '',
      motherName: st.motherName || '',
      session: st.session || '২০২৬',
      optionalSubject: st.optionalSubject || (isClass9or10 && (st.group || targetGroup).includes('বিজ্ঞান') ? 'উচ্চতর গণিত' : 'কৃষি শিক্ষা')
    };
  });
};

// ─── NCTB MARKSHEET DATA CALCULATION ENGINE ───
export interface MarksheetCalculationOptions {
  selectedExam: string;
  selectedGrade: string;
  selectedBranch: string;
}

export const generateStudentMarksheetData = (
  targetStudent: StudentProfile,
  options: MarksheetCalculationOptions
) => {
  const { selectedExam, selectedGrade, selectedBranch } = options;
  const gradeNumMap: Record<string, number> = { '6th': 6, '7th': 7, '8th': 8, '9th': 9, '10th': 10 };
  const targetGradeNum = gradeNumMap[selectedGrade] || 8;

  const classConfigured = getActiveCurriculumSubjects(
    selectedGrade,
    targetStudent.group,
    targetStudent.optionalSubject
  );

  const studentRel = getStudentReligion(targetStudent);

  // 1. Filter classConfigured so religion subjects of OTHER religions are excluded
  const religionMatchedConfigured = classConfigured.filter((sub: any) => {
    const codeOrName = `${sub.code || ''} ${sub.name || ''}`.toLowerCase();
    const isRel = isReligionSubject(codeOrName);
    if (!isRel) return true;

    if (studentRel === 'Muslim') {
      if (codeOrName.includes('হিন্দু') || codeOrName.includes('hindu') || codeOrName.includes('hrel') ||
          codeOrName.includes('খ্রিস্টান') || codeOrName.includes('christian') || codeOrName.includes('crel') ||
          codeOrName.includes('বৌদ্ধ') || codeOrName.includes('buddhist') || codeOrName.includes('brel')) {
        return false;
      }
    } else if (studentRel === 'Hindu') {
      if (codeOrName.includes('ইসলাম') || codeOrName.includes('islam') || codeOrName.includes('irel') ||
          codeOrName.includes('খ্রিস্টান') || codeOrName.includes('christian') || codeOrName.includes('crel') ||
          codeOrName.includes('বৌদ্ধ') || codeOrName.includes('buddhist') || codeOrName.includes('brel')) {
        return false;
      }
    } else if (studentRel === 'Christian') {
      if (codeOrName.includes('ইসলাম') || codeOrName.includes('islam') || codeOrName.includes('irel') ||
          codeOrName.includes('হিন্দু') || codeOrName.includes('hindu') || codeOrName.includes('hrel') ||
          codeOrName.includes('বৌদ্ধ') || codeOrName.includes('buddhist') || codeOrName.includes('brel')) {
        return false;
      }
    } else if (studentRel === 'Buddhist') {
      if (codeOrName.includes('ইসলাম') || codeOrName.includes('islam') || codeOrName.includes('irel') ||
          codeOrName.includes('হিন্দু') || codeOrName.includes('hindu') || codeOrName.includes('hrel') ||
          codeOrName.includes('খ্রিস্টান') || codeOrName.includes('christian') || codeOrName.includes('crel')) {
        return false;
      }
    }
    return true;
  });

  // Map configured class subjects to mark values using universal robust resolver
  let hasReligionMapped = false;
  const rawSubjects: (SubjectMark & { hasEnteredMarks?: boolean })[] = [];

  for (const sub of religionMatchedConfigured) {
    const cleanName = sub.name.replace(/\s*\(.*?\)/g, '').trim();
    const fullMarks = sub.fullMarks || 100;
    const isRel = isReligionSubject(`${sub.code} ${sub.name}`);

    if (isRel) {
      if (hasReligionMapped) continue; // Only 1 religion subject ever in table
      hasReligionMapped = true;
    }
    
    const retrieved = getUniversalStudentMark({
      exam: selectedExam,
      grade: selectedGrade,
      branch: selectedBranch,
      group: targetStudent.group,
      subjectCodeOrName: sub.code || sub.name,
      studentRoll: targetStudent.roll,
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      religion: studentRel
    });

    let displaySubjectName = cleanName;
    if (isRel) {
      if (studentRel === 'Hindu') {
        displaySubjectName = 'হিন্দুধর্ম ও নৈতিক শিক্ষা';
      } else if (studentRel === 'Muslim') {
        displaySubjectName = 'ইসলাম ও নৈতিক শিক্ষা';
      } else if (studentRel === 'Christian') {
        displaySubjectName = 'খ্রিস্টানধর্ম ও নৈতিক শিক্ষা';
      } else if (studentRel === 'Buddhist') {
        displaySubjectName = 'বৌদ্ধধর্ম ও নৈতিক শিক্ষা';
      } else {
        displaySubjectName = 'ধর্ম ও নৈতিক শিক্ষা';
      }
    }

    rawSubjects.push({
      code: sub.code,
      name: displaySubjectName,
      fullMarks,
      cq: retrieved.cq,
      mcq: retrieved.mcq,
      practical: retrieved.practical,
      ca: retrieved.ca,
      totalMarks: retrieved.total,
      hasEnteredMarks: retrieved.hasMarks,
      isJointPass: Boolean(sub.isJointPass),
      jointPairCode: sub.jointPairCode
    });
  }

  // ══════════════════════════════════════════════════════════════
  // STRIP optional/4th subjects from rawSubjects — they MUST only
  // appear in the ADDITIONAL SUBJECT section, never in main rows.
  // ══════════════════════════════════════════════════════════════
  const OPTIONAL_KEYWORDS = ['কৃষি', 'গার্হস্থ্য', 'উচ্চতর গণিত', 'কম্পিউটার শিক্ষা'];
  const OPTIONAL_CODE_PREFIXES = ['AGR', 'HMS', 'HMT', 'CMP'];
  const isOptionalSub = (s: any) =>
    OPTIONAL_KEYWORDS.some(kw => s.name && s.name.includes(kw)) ||
    OPTIONAL_CODE_PREFIXES.some(pfx => s.code && String(s.code).startsWith(pfx));

  const filteredRawSubjects = rawSubjects.filter((s: any) => !isOptionalSub(s));

  // ═════════════════════════════════════════════════════════════════
  // 🧠 NCTB DYNAMIC JOINT PASS & 4TH SUB BONUS ENGINE (ALL CLASSES 6-10)
  // ═════════════════════════════════════════════════════════════════
  let totalObtained = 0;
  let totalFull = 0;
  let totalCq = 0;
  let totalMcq = 0;
  let totalPrac = 0;
  let mainGradePoints = 0;
  let mainUnitsCount = 0;
  let hasFailed = false;

  const processedCodes = new Set<string>();
  const processedNames = new Set<string>();
  let hasReligionProcessed = false;
  const processedSubjects: SubjectMark[] = [];
  let optionalSubjectMarkData: any = null;

  // Identify optional 4th subject for ALL classes
  const targetOptionalName = targetStudent.optionalSubject;
  const isOptionalSubjectAssigned = Boolean(targetOptionalName && targetOptionalName !== 'নাই' && targetOptionalName !== 'None');

  // Populate optionalSubjectMarkData for ALL classes (6-10)
  if (isOptionalSubjectAssigned) {
    const optName = targetOptionalName || 'কৃষি শিক্ষা';

    const optionalCodeMap: Record<string, string> = {
      'উচ্চতর গণিত': 'HMT-126',
      'কৃষি শিক্ষা': `AGR-${targetGradeNum <= 8 ? targetGradeNum + '07' : '139'}`,
      'গার্হস্থ্য বিজ্ঞান': `HMS-${targetGradeNum <= 8 ? targetGradeNum + '01' : '140'}`,
      'জীববিজ্ঞান': 'BIO-138',
      'কম্পিউটার শিক্ষা': 'CMP-135'
    };
    const optCode = optionalCodeMap[optName] || `AGR-${targetGradeNum}07`;

    const optRetrieved = getUniversalStudentMark({
      exam: selectedExam,
      grade: selectedGrade,
      branch: selectedBranch,
      group: targetStudent.group,
      subjectCodeOrName: optName,
      studentRoll: targetStudent.roll,
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      religion: studentRel
    });

    const optTotal = optRetrieved.hasMarks ? optRetrieved.total : 0;
    const optCalc = calculateGradeAndPoint(optTotal, 100);

    optionalSubjectMarkData = {
      code: optCode,
      name: optName,
      fullMarks: 100,
      cq: optRetrieved.cq,
      mcq: optRetrieved.mcq,
      practical: optRetrieved.practical || optRetrieved.ca,
      totalMarks: optTotal,
      hasEnteredMarks: optRetrieved.hasMarks,
      letterGrade: optRetrieved.hasMarks ? optCalc.grade : '-',
      gradePoint: optRetrieved.hasMarks ? optCalc.point : 0
    };

    if (optRetrieved.hasMarks) {
      totalObtained += optTotal;
      totalFull += 100;
      totalCq += optRetrieved.cq;
      totalMcq += optRetrieved.mcq;
      totalPrac += (optRetrieved.practical || optRetrieved.ca);
    }
  }

  for (let i = 0; i < filteredRawSubjects.length; i++) {
    const sub = filteredRawSubjects[i];
    const isRel = isReligionSubject(`${sub.code} ${sub.name}`);

    if (processedCodes.has(sub.code) || processedNames.has(sub.name)) continue;
    if (isRel) {
      if (hasReligionProcessed) continue;
      hasReligionProcessed = true;
    }

    // Final guard: never push optional/4th subjects into main rows
    if (isOptionalSub(sub)) continue;

    // Check if this subject is part of a joint pass pair
    const nextSub = filteredRawSubjects[i + 1];
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
      // Master = sub, Slave = nextSub
      const jointCombinedTotal = sub.totalMarks + nextSub.totalMarks;
      const jointCombinedFull = sub.fullMarks + nextSub.fullMarks;
      const jointCalc = calculateGradeAndPoint(jointCombinedTotal, jointCombinedFull);

      if (jointCalc.grade === 'F') hasFailed = true;

      totalObtained += jointCombinedTotal;
      totalFull += jointCombinedFull;
      totalCq += (sub.cq || 0) + (nextSub.cq || 0);
      totalMcq += (sub.mcq || 0) + (nextSub.mcq || 0);
      totalPrac += (sub.practical || sub.ca || 0) + (nextSub.practical || nextSub.ca || 0);
      mainGradePoints += jointCalc.point;
      mainUnitsCount++;

      processedSubjects.push({
        ...sub,
        isJointMaster: true,
        jointCombinedTotal,
        jointCombinedGrade: jointCalc.grade,
        jointCombinedPoint: jointCalc.point,
        letterGrade: jointCalc.grade,
        gradePoint: jointCalc.point
      });

      processedSubjects.push({
        ...nextSub,
        isJointSlave: true,
        letterGrade: jointCalc.grade,
        gradePoint: jointCalc.point
      });

      processedCodes.add(sub.code);
      processedCodes.add(nextSub.code);
      processedNames.add(sub.name);
      processedNames.add(nextSub.name);
    } else {
      // Single non-joint subject
      const calc = calculateGradeAndPoint(sub.totalMarks, sub.fullMarks);
      if (calc.grade === 'F') hasFailed = true;

      totalObtained += sub.totalMarks;
      totalFull += sub.fullMarks;
      totalCq += (sub.cq || 0);
      totalMcq += (sub.mcq || 0);
      totalPrac += (sub.practical || sub.ca || 0);
      mainGradePoints += calc.point;
      mainUnitsCount++;

      processedSubjects.push({
        ...sub,
        letterGrade: calc.grade,
        gradePoint: calc.point
      });

      processedCodes.add(sub.code);
      processedNames.add(sub.name);
    }
  }

  // 4th Subject Bonus Calculation (GP > 2.00)
  const optionalGP = optionalSubjectMarkData?.gradePoint || 0;
  const bonusGP = Math.max(0, optionalGP - 2.00);

  const gpaWithout4th = hasFailed || mainUnitsCount === 0 ? 0.0 : Number((mainGradePoints / mainUnitsCount).toFixed(2));
  const finalGPA = hasFailed || mainUnitsCount === 0 ? 0.0 : Math.min(5.00, Number(((mainGradePoints + bonusGP) / mainUnitsCount).toFixed(2)));

  const overallGrade = hasFailed ? 'F' : finalGPA >= 5.0 ? 'A+' : finalGPA >= 4.0 ? 'A' : finalGPA >= 3.5 ? 'A-' : finalGPA >= 3.0 ? 'B' : finalGPA >= 2.0 ? 'C' : 'D';

  const safeSubjects = processedSubjects.filter((s: any) => !isOptionalSub(s));

  return {
    subjects: safeSubjects,
    optionalSubject: optionalSubjectMarkData,
    totalObtained,
    totalFull,
    totalCq,
    totalMcq,
    totalPrac,
    gpa: gpaWithout4th,
    gpaWithout4th,
    bonusGP,
    finalGPA,
    overallGrade,
    hasFailed
  };
};

// ═════════════════════════════════════════════════════════════════
// 🖨️ A4 PRINTABLE MARKSHEET SHEET COMPONENT (EXACT MASTER TEMPLATE)
// ═════════════════════════════════════════════════════════════════
export function MarksheetSheetCard({
  student,
  settings,
  examName,
  data,
  borderImageUrl = '',
  lang = 'bn'
}: {
  student: StudentProfile;
  settings: any;
  examName: string;
  data: any;
  borderImageUrl?: string;
  lang?: 'bn' | 'en';
}) {
  // Marksheet is ALWAYS in English as requested by user ("মার্কশীট সবসময় ইংরেজীতে থাকবে")
  const isEn = true;

  // ── Convert Bengali numerals to English numerals ──
  const toEnNumber = (str: string | number | undefined): string => {
    if (str === undefined || str === null) return '';
    return String(str).replace(/[০-৯]/g, d => "0123456789"["০১২৩৪৫৬৭৮৯".indexOf(d)]);
  };

  // ── Translate Group (Science, Humanities, Business Studies, General) ──
  const translateGroup = (grp: string | undefined): string => {
    if (!grp) return 'General';
    const g = grp.trim();
    if (g.includes('বিজ্ঞান') || g.toLowerCase().includes('science')) return 'Science';
    if (g.includes('মানবিক') || g.toLowerCase().includes('humanities') || g.toLowerCase().includes('arts')) return 'Humanities';
    if (g.includes('ব্যবসায়') || g.includes('ব্যবসায়') || g.toLowerCase().includes('commerce') || g.toLowerCase().includes('business')) return 'Business Studies';
    if (g.includes('সাধারণ') || g.toLowerCase().includes('general')) return 'General';
    return g;
  };

  // ── School Name & Address in English ──
  const getEnglishSchoolName = (name: string | undefined): string => {
    if (!name) return 'BARAITOLI HIGH SCHOOL';
    if (/[\u0980-\u09FF]/.test(name)) {
      if (name.includes('বরইতলী') || name.includes('বড়াইতলী')) {
        return 'BARAITOLI HIGH SCHOOL';
      }
      return name
        .replace(/উচ্চ\s*বিদ্যালয়|উচ্চ\s*বিদ্যালয়/g, 'HIGH SCHOOL')
        .replace(/মাধ্যমিক\s*বিদ্যালয়|মাধ্যমিক\s*বিদ্যালয়/g, 'SECONDARY SCHOOL')
        .replace(/মডেল\s*স্কুল/g, 'MODEL SCHOOL')
        .replace(/কলেজ/g, 'COLLEGE')
        .replace(/মাদ্রাসা|মাদরাসা/g, 'MADRASAH')
        .replace(/সরকারি/g, 'GOVT.')
        .trim();
    }
    return name.toUpperCase();
  };

  const getEnglishAddress = (addr: string | undefined): string => {
    if (!addr) return "Baraitoli, Chakaria, Cox's Bazar.";
    if (/[\u0980-\u09FF]/.test(addr)) {
      if (addr.includes('বরইতলী') || addr.includes('চকরিয়া') || addr.includes('কক্সবাজার')) {
        return "Baraitoli, Chakaria, Cox's Bazar.";
      }
      return addr;
    }
    return addr;
  };

  // ── Format Class / Grade ──
  const formatGrade = (grade: string, gradeBn: string): string => {
    const raw = `${grade || ''} ${gradeBn || ''}`;
    if (raw.includes('6') || raw.includes('৬') || raw.toLowerCase().includes('six')) return 'Class Six (6th)';
    if (raw.includes('7') || raw.includes('৭') || raw.toLowerCase().includes('seven')) return 'Class Seven (7th)';
    if (raw.includes('8') || raw.includes('৮') || raw.toLowerCase().includes('eight')) return 'Class Eight (8th)';
    if (raw.includes('9') || raw.includes('৯') || raw.toLowerCase().includes('nine')) return 'Class Nine (9th)';
    if (raw.includes('10') || raw.includes('১০') || raw.toLowerCase().includes('ten')) return 'Class Ten (10th)';
    const num = (grade || '').replace(/\D/g, '');
    if (num) {
      const suffix = num === '1' ? 'st' : num === '2' ? 'nd' : num === '3' ? 'rd' : 'th';
      return `Class ${num}${suffix}`;
    }
    return grade || gradeBn;
  };

  // ── Robust Subject Translation (handles all Yya / Nukta character variations) ──
  const translateSubject = (name: string | undefined): string => {
    if (!name) return '';
    const n = name.trim().normalize('NFC');

    if (n.includes('বাংলা ১ম') || n.includes('Bangla 1st')) return 'Bangla 1st Paper';
    if (n.includes('বাংলা ২') || n.includes('Bangla 2nd')) return 'Bangla 2nd Paper';
    if (n.includes('ইংরেজি ১ম') || n.includes('English 1st')) return 'English 1st Paper';
    if (n.includes('ইংরেজি ২') || n.includes('English 2nd')) return 'English 2nd Paper';
    if (n.includes('উচ্চতর গণিত') || n.includes('Higher Math')) return 'Higher Mathematics';
    if (n.includes('গণিত') || n.includes('Math')) return 'Mathematics';
    if (n.includes('ডিজিটাল প্রযুক্তি') || n.includes('Digital Tech')) return 'Digital Technology';
    if (n.includes('ইতিহাস ও সামাজিক') || n.includes('History & Social')) return 'History & Social Science';
    if (n.includes('বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা') || n.includes('ইতিহাস ও বিশ্বসভ্যতা')) return 'History of Bangladesh & World Civilization';
    if (n.includes('ইসলাম') || n.includes('Islam')) return 'Islam & Moral Education';
    if (n.includes('হিন্দু') || n.includes('Hindu')) return 'Hinduism & Moral Education';
    if (n.includes('খ্রিস্টান') || n.includes('Christian')) return 'Christianity & Moral Education';
    if (n.includes('বৌদ্ধ') || n.includes('Buddhist')) return 'Buddhism & Moral Education';
    if (n.includes('ধর্ম') || n.includes('Religion')) return 'Religion & Moral Education';
    if (n.includes('কৃষি') || n.includes('Agri')) return 'Agricultural Studies';
    if (n.includes('গার্হস্থ্য') || n.includes('Home Science')) return 'Home Science';
    if (n.includes('কম্পিউটার') || n.includes('Computer')) return 'Computer Studies';
    if (n.includes('তথ্য ও যোগাযোগ') || n.includes('ICT')) return 'Information & Communication Technology (ICT)';
    if (n.includes('পদার্থ') || n.includes('Physics')) return 'Physics';
    if (n.includes('রসায়ন') || n.includes('রসায়') || n.includes('Chemistry')) return 'Chemistry';
    if (n.includes('জীববিজ্ঞান') || n.includes('Biology')) return 'Biology';
    if (n.includes('সাধারণ বিজ্ঞান') || n.includes('General Science')) return 'General Science';
    if (n.includes('বিজ্ঞান') || n.includes('Science')) return 'Science';
    if (n.includes('হিসাববিজ্ঞান') || n.includes('Accounting')) return 'Accounting';
    if (n.includes('ব্যবসায়') || n.includes('ব্যবসায়') || n.includes('Business')) return 'Business Entrepreneurship';
    if (n.includes('ফিন্যান্স') || n.includes('Finance')) return 'Finance & Banking';
    if (n.includes('পৌরনীতি') || n.includes('Civics')) return 'Civics & Citizenship';
    if (n.includes('ভূগোল') || n.includes('Geography')) return 'Geography & Environment';
    if (n.includes('অর্থনীতি') || n.includes('Economics')) return 'Economics';
    if (n.includes('বাংলাদেশ ও বিশ্ব') || n.includes('BGS')) return 'Bangladesh & Global Studies';
    if (n.includes('চারু ও কারুকলা') || n.includes('Arts')) return 'Arts & Crafts';
    if (n.includes('স্বাস্থ্য সুরক্ষা') || n.includes('Health')) return 'Wellbeing / Health & Physical Education';
    if (n.includes('জীবন ও জীবিকা')) return 'Life & Livelihood';
    return n;
  };

  // ── Translate exam name ──
  const translateExamName = (name: string): string => {
    if (!name) return 'EXAMINATION 2026';
    return name
      .replace(/অর্ধ[\s-]?বার্ষিক\s*পরীক্ষা/gi, 'Half-Yearly Examination')
      .replace(/বার্ষিক\s*পরীক্ষা/gi, 'Annual Examination')
      .replace(/১ম\s*সাময়িক\s*পরীক্ষা|১ম\s*সাময়িক\s*পরীক্ষা/gi, '1st Terminal Examination')
      .replace(/২য়\s*সাময়িক\s*পরীক্ষা|২য়\s*সাময়িক\s*পরীক্ষা/gi, '2nd Terminal Examination')
      .replace(/মডেল\s*টেস্ট\s*পরীক্ষা/gi, 'Model Test Examination')
      .replace(/নির্বাচনী\s*পরীক্ষা/gi, 'Test Examination')
      .replace(/এসএসসি\s*প্রাক[\s-]?নির্বাচনী/gi, 'SSC Pre-Selection Examination')
      .replace(/২০২৬/g, '2026')
      .replace(/২০২৫/g, '2025')
      .replace(/২০২৪/g, '2024')
      .replace(/[০-৯]/g, d => "0123456789"["০১২৩৪৫৬৭৮৯".indexOf(d)]);
  };

  // ── English Labels ──
  const L = {
    transcript: 'ACADEMIC TRANSCRIPT / MARKSHEET',
    studentName: "Student's Name",
    fatherName: "Father's Name",
    motherName: "Mother's Name",
    roll: 'Roll No.',
    class: 'Class',
    session: 'Session',
    group: 'Group',
    optional: 'Optional Sub.',
    slNo: 'Sl. No.',
    subjectName: 'Subject Name',
    fullMarks: 'Full Marks',
    obtained: 'Obtained',
    grade: 'Grade',
    addSub: 'ADDITIONAL SUBJECT :',
    gpAbove2: 'GP above 2',
    grandTotal: 'GRAND TOTAL',
    resultSummary: 'RESULT SUMMARY',
    totalMarks: 'Total Marks Obtained',
    gpaExcl: 'GPA (Excl. 4th Sub.)',
    finalGpa: 'Final GPA (Incl. Bonus)',
    overallGrade: 'Overall Grade',
    totalGrade: 'Overall Grade',
    classTeacher: "Class Teacher's Signature",
    guardian: "Guardian's Signature",
    headmaster: 'Headmaster',
    branch: 'Section',
  };

  return (
    <div
      className="marksheet-card-wrapper bg-white shadow-xl max-w-4xl mx-auto text-slate-950 font-sans relative print:shadow-none print:max-w-none print:m-0 print:[&:not(:last-child)]:break-after-page"
      style={{
        padding: '0.5in',
        boxSizing: 'border-box',
        position: 'relative',
        background: '#ffffff',
      }}
    >
      {/* ── PNG BORDER OVERLAY (Layer above background, spans all 4 edges of the marksheet) ── */}
      {borderImageUrl && (
        <img
          src={borderImageUrl}
          alt="Marksheet Border"
          aria-hidden="true"
          className="marksheet-border-img pointer-events-none select-none"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            zIndex: 1,
          }}
        />
      )}

      {/* ── INNER OFFICIAL A4 DOCUMENT FRAME (0.5in safe margin content container) ── */}
      <div 
        className={`h-full min-h-[260mm] print:min-h-0 print:h-full flex flex-col justify-between relative z-10 ${
          borderImageUrl ? 'p-3 sm:p-4 print:p-3' : 'border-2 border-slate-950 p-5 sm:p-6 print:p-4'
        }`}
      >

        {/* Background School Logo Watermark */}
        {settings?.showWatermark !== false && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
            style={{ opacity: settings?.watermarkOpacity || 0.04 }}
          >
            {settings?.schoolLogo ? (
              <img src={settings.schoolLogo} alt="Watermark Logo" className="w-[360px] h-[360px] object-contain grayscale" />
            ) : (
              <div className="w-[320px] h-[320px] flex flex-col items-center justify-center text-slate-950">
                <span className="text-amber-500 text-6xl font-bold">★</span>
                <span className="text-5xl font-black tracking-tighter">BHS</span>
                <span className="text-2xl font-bold text-slate-700">{isEn ? toEnNumber(settings?.estdYear || '1969') : (settings?.estdYear || '১৯৬৯')}</span>
              </div>
            )}
          </div>
        )}

        <div>
          {/* 1. SCHOOL IDENTITY HEADER (CENTERED WITH INLINE LEFT LOGO & CLEAN DIVIDER) */}
          <div className="relative mb-3">
            
            {/* Centered School Name & Address Block with Logo on the Left of School Name */}
            <div className="text-center flex flex-col items-center justify-center space-y-1">
              
              {/* Inline Header with Logo directly on the left of School Name */}
              <div className="flex items-center justify-center gap-3">
                
                {/* School Logo (Positioned on Left of School Name) */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center overflow-hidden shrink-0">
                  {settings?.schoolLogo ? (
                    <img src={settings.schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-12 h-12 rounded-full border border-slate-950 flex flex-col items-center justify-center p-1">
                      <span className="text-amber-600 text-[10px] font-bold">★</span>
                      <span className="text-[9px] font-black tracking-tighter text-slate-950">BHS</span>
                    </div>
                  )}
                </div>

                {/* School Name Centered */}
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-sans uppercase leading-snug">
                  {isEn ? getEnglishSchoolName(settings?.schoolName) : (settings?.schoolName || 'BARAITOLI HIGH SCHOOL')}
                </h1>
              </div>

              {/* Location */}
              <p className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
                {isEn ? getEnglishAddress(settings?.address) : (settings?.address || "Baraitoli, Chakaria, Cox's Bazar.")}
              </p>

              {/* Estd & EIIN */}
              <p className="text-[11px] font-bold text-slate-800 font-mono">
                {isEn
                  ? `Estd: ${toEnNumber(settings?.estdYear || '1969')} | EIIN: ${toEnNumber(settings?.eiin || '106184')}`
                  : `স্থাপিত: ${settings?.estdYear || '1969'} খ্রি. । EIIN: ${settings?.eiin || '106184'}`
                }
              </p>
            </div>

            {/* FULL WIDTH HORIZONTAL DIVIDING LINE (ডান থেকে বামে টানা দাগ) */}
            <div className="w-full border-b-2 border-slate-950 my-2"></div>

          </div>

          {/* 2. TRANSCRIPT TITLE + STUDENT PROFILE + INDEPENDENT FLOATING GRADING TABLE LAYER */}
          <div className="relative mb-3">

            {/* ── INDEPENDENT GRADING TABLE LAYER (Absolute right-0 top-0, completely separate layer) ── */}
            <div 
              className="absolute right-0 top-0 z-20 w-[124px] border border-slate-950 bg-white shadow-xs overflow-hidden font-sans hidden sm:block print:block"
              style={{ pointerEvents: 'auto' }}
            >
              {/* Header */}
              <div className="bg-slate-950 text-white font-black text-[8px] tracking-wider py-0.5 text-center uppercase border-b border-slate-950">
                GRADING SYSTEM
              </div>

              {/* Table with Clean Grid & Sub-headers */}
              <table className="w-full border-collapse text-center text-[7.5px] leading-tight">
                <thead>
                  <tr className="bg-slate-200/90 text-slate-950 font-black border-b border-slate-950">
                    <th className="py-0.5 px-1 border-r border-slate-950 font-black">Range</th>
                    <th className="py-0.5 px-1 border-r border-slate-950 font-black">Grade</th>
                    <th className="py-0.5 px-1 font-black">GPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-950 font-bold text-slate-950">
                  <tr className="bg-white">
                    <td className="py-[1.5px] px-1 border-r border-slate-950 font-mono font-bold">80-100</td>
                    <td className="py-[1.5px] px-1 border-r border-slate-950 font-black text-emerald-900">A+</td>
                    <td className="py-[1.5px] px-1 font-mono font-black">5.00</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-[1.5px] px-1 border-r border-slate-950 font-mono font-bold">70-79</td>
                    <td className="py-[1.5px] px-1 border-r border-slate-950 font-black">A</td>
                    <td className="py-[1.5px] px-1 font-mono">4.00</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-[1.5px] px-1 border-r border-slate-950 font-mono font-bold">60-69</td>
                    <td className="py-[1.5px] px-1 border-r border-slate-950 font-black">A-</td>
                    <td className="py-[1.5px] px-1 font-mono">3.50</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-[1.5px] px-1 border-r border-slate-950 font-mono font-bold">50-59</td>
                    <td className="py-[1.5px] px-1 border-r border-slate-950 font-black">B</td>
                    <td className="py-[1.5px] px-1 font-mono">3.00</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-[1.5px] px-1 border-r border-slate-950 font-mono font-bold">40-49</td>
                    <td className="py-[1.5px] px-1 border-r border-slate-950 font-black">C</td>
                    <td className="py-[1.5px] px-1 font-mono">2.00</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-[1.5px] px-1 border-r border-slate-950 font-mono font-bold">33-39</td>
                    <td className="py-[1.5px] px-1 border-r border-slate-950 font-black">D</td>
                    <td className="py-[1.5px] px-1 font-mono">1.00</td>
                  </tr>
                  <tr className="bg-rose-50/70 text-rose-900">
                    <td className="py-[1.5px] px-1 border-r border-slate-950 font-mono font-black text-rose-800">00-32</td>
                    <td className="py-[1.5px] px-1 border-r border-slate-950 font-black text-rose-700">F</td>
                    <td className="py-[1.5px] px-1 font-mono font-black text-rose-800">0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── ACADEMIC TRANSCRIPT TITLE & EXAM NAME BADGE (TRUE PAGE CENTER) ── */}
            <div className="text-center pt-0.5 pb-2.5 space-y-1 w-full">
              <h2 className="text-base sm:text-lg font-black text-slate-950 tracking-wide uppercase font-sans">
                {L.transcript}
              </h2>
              <div className="flex justify-center">
                <span className="inline-block px-5 py-0.5 bg-slate-950 text-white font-black text-xs rounded-none uppercase tracking-wider">
                  {translateExamName(examName)}
                </span>
              </div>
            </div>

            {/* ── STUDENT PROFILE DETAILS (2 Columns with right-margin to clear floating grading table) ── */}
            <div className="py-1 px-1 text-[11px] font-bold grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 sm:mr-[135px]">
              
              {/* Left Column */}
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <span className="w-24 text-slate-950 font-black shrink-0">{L.studentName}</span>
                  <span className="mr-2 font-black text-slate-950">:</span>
                  <span className="font-black text-slate-950 text-xs">{student.name}</span>
                </div>

                <div className="flex items-center">
                  <span className="w-24 text-slate-950 font-black shrink-0">{L.fatherName}</span>
                  <span className="mr-2 font-black text-slate-950">:</span>
                  <span className="font-black text-slate-950">{student.fatherName}</span>
                </div>

                <div className="flex items-center">
                  <span className="w-24 text-slate-950 font-black shrink-0">{L.motherName}</span>
                  <span className="mr-2 font-black text-slate-950">:</span>
                  <span className="font-black text-slate-950">{student.motherName}</span>
                </div>

                <div className="flex items-center">
                  <span className="w-24 text-slate-950 font-black shrink-0">{L.roll}</span>
                  <span className="mr-2 font-black text-slate-950">:</span>
                  <span className="font-black text-slate-950 font-mono">{toEnNumber(student.roll)}</span>
                </div>

                <div className="flex items-center">
                  <span className="w-24 text-slate-950 font-black shrink-0">{L.class}</span>
                  <span className="mr-2 font-black text-slate-950">:</span>
                  <span className="font-black text-slate-950">
                    {isEn
                      ? `${formatGrade(student.grade, student.gradeBn)} (${L.branch} ${student.section})`
                      : `${student.gradeBn} (${L.branch} ${student.section})`
                    }
                  </span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-1.5 sm:pl-2">
                <div className="flex items-center">
                  <span className="w-20 text-slate-950 font-black shrink-0">{L.session}</span>
                  <span className="mr-2 font-black text-slate-950">:</span>
                  <span className="font-black text-slate-950 font-mono">{toEnNumber(student.session)}</span>
                </div>

                <div className="flex items-center">
                  <span className="w-20 text-slate-950 font-black shrink-0">{L.group}</span>
                  <span className="mr-2 font-black text-slate-950">:</span>
                  <span className="font-black text-slate-950">{translateGroup(student.group)}</span>
                </div>

                <div className="flex items-center">
                  <span className="w-20 text-slate-950 font-black shrink-0">{L.optional}</span>
                  <span className="mr-2 font-black text-slate-950">:</span>
                  <span className="font-black text-slate-950">{translateSubject(student.optionalSubject || '-')}</span>
                </div>
              </div>

            </div>

          </div>

          {/* 3. SUBJECT-WISE MARKS TABLE WITH DUAL GPA COLUMNS */}
          <div className="mb-3 border border-slate-950 rounded-none overflow-hidden">
            <table className="w-full text-left text-[11px] border-collapse font-sans table-fixed">
              <colgroup>
                <col className="w-[55px]" />
                <col className="w-auto" />
                <col className="w-[50px]" />
                <col className="w-[40px]" />
                <col className="w-[40px]" />
                <col className="w-[50px]" />
                <col className="w-[60px]" />
                <col className="w-[42px]" />
                <col className="w-[42px]" />
                <col className="w-[85px]" />
                <col className="w-[70px]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-200 text-slate-950 font-black uppercase text-[9px] border-b border-slate-950">
                  <th className="p-1 text-center border-r border-slate-950 whitespace-nowrap">{L.slNo}</th>
                  <th className="p-1 border-r border-slate-950">{L.subjectName}</th>
                  <th className="p-1 text-center border-r border-slate-950">{L.fullMarks}</th>
                  <th className="p-1 text-center border-r border-slate-950">CQ</th>
                  <th className="p-1 text-center border-r border-slate-950">MCQ</th>
                  <th className="p-1 text-center border-r border-slate-950">Prac/CA</th>
                  <th className="p-1 text-center border-r border-slate-950">{L.obtained}</th>
                  <th className="p-1 text-center border-r border-slate-950">{L.grade}</th>
                  <th className="p-1 text-center border-r border-slate-950">GP</th>
                  <th className="p-1 text-center border-r border-slate-950 leading-tight bg-slate-250">
                    <div>GPA</div>
                    <div className="text-[7px] font-bold text-slate-700 font-sans tracking-tighter uppercase">(Without add. sub)</div>
                  </th>
                  <th className="p-1 text-center bg-indigo-100 text-indigo-950 font-black leading-tight">
                    <div>GPA</div>
                    <div className="text-[7.5px] font-bold text-indigo-800 font-sans tracking-tighter uppercase">{isEn ? '(Total GPA)' : '(মোট জিপিএ)'}</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-950 font-medium">
                
                {/* ── MAIN SUBJECTS ROWS ── */}
                {data.subjects.map((sub: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-950">
                    <td className="p-1 text-center font-black font-mono border-r border-slate-950 whitespace-nowrap text-[11px]">{idx + 1}</td>
                    <td className="p-1 font-bold border-r border-slate-950 truncate text-[11px]">{translateSubject(sub.name)}</td>
                    <td className="p-1 text-center border-r border-slate-950 font-mono text-[10.5px]">{sub.fullMarks}</td>
                    <td className="p-1 text-center border-r border-slate-950 font-mono text-[10.5px]">{sub.cq || '-'}</td>
                    <td className="p-1 text-center border-r border-slate-950 font-mono text-[10.5px]">{sub.mcq || '-'}</td>
                    <td className="p-1 text-center border-r border-slate-950 font-mono text-[10.5px]">{sub.practical || sub.ca || '-'}</td>

                    {/* MERGED CELL LOGIC FOR OBTAINED MARKS, GRADE & GP */}
                    {sub.isJointMaster ? (
                      <>
                        <td rowSpan={2} className="p-1 text-center border-r border-slate-950 font-black font-mono text-xs align-middle bg-slate-50/70">
                          {sub.jointCombinedTotal}
                        </td>
                        <td rowSpan={2} className="p-1 text-center border-r border-slate-950 font-black text-xs align-middle bg-slate-50/70">
                          <span className={sub.jointCombinedGrade === 'A+' ? 'text-emerald-800' : sub.jointCombinedGrade === 'F' ? 'text-rose-800' : 'text-slate-950'}>
                            {sub.jointCombinedGrade}
                          </span>
                        </td>
                        <td rowSpan={2} className="p-1 text-center border-r border-slate-950 font-black font-mono text-xs align-middle bg-slate-50/70">
                          {sub.jointCombinedPoint?.toFixed(2)}
                        </td>
                      </>
                    ) : sub.isJointSlave ? (
                      null
                    ) : (
                      <>
                        <td className="p-1 text-center border-r border-slate-950 font-black font-mono text-[10.5px]">{sub.totalMarks}</td>
                        <td className="p-1 text-center border-r border-slate-950 font-black text-[11px]">
                          <span className={sub.letterGrade === 'A+' ? 'text-emerald-800' : sub.letterGrade === 'F' ? 'text-rose-800' : ''}>
                            {sub.letterGrade}
                          </span>
                        </td>
                        <td className="p-1 text-center border-r border-slate-950 font-black font-mono text-[10.5px]">{sub.gradePoint?.toFixed(2)}</td>
                      </>
                    )}

                    {/* GPA (WITHOUT ADDITIONAL SUBJECT) COLUMN - SPANS ALL MAIN SUBJECTS */}
                    {idx === 0 && (
                      <td
                        rowSpan={data.subjects.length}
                        className="p-1 text-center font-black align-middle border-r border-slate-950 bg-slate-50 font-mono text-xs select-none"
                      >
                        <span className="text-sm font-black font-mono text-slate-900 block">
                          {data.hasFailed ? '0.00' : data.gpaWithout4th?.toFixed(2)}
                        </span>
                      </td>
                    )}

                    {/* RIGHTMOST TOTAL GPA COLUMN - SPANS ENTIRE TABLE */}
                    {idx === 0 && (
                      <td
                        rowSpan={data.subjects.length + (data.optionalSubject ? 3 : 1)}
                        className="p-2 text-center font-black align-middle bg-indigo-50/90 text-indigo-950 border-l border-slate-950 select-none"
                      >
                        <span className="text-base sm:text-lg font-black font-mono text-indigo-950 block">
                          {data.hasFailed ? '0.00' : data.finalGPA?.toFixed(2)}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}

                {/* ── ADDITIONAL / OPTIONAL SUBJECT ROW ── */}
                {data.optionalSubject && (
                  <>
                    <tr className="bg-slate-200 border-t-2 border-b border-slate-950 font-black text-[9px]">
                      <td colSpan={9} className="px-2 py-0.5 text-slate-950 uppercase tracking-wide border-r border-slate-950">
                        Additional Subject :
                      </td>
                      <td className="p-0.5 text-center font-extrabold text-[7.5px] border-r border-slate-950 text-slate-800 uppercase leading-none bg-slate-250">
                        GP above 2
                      </td>
                    </tr>

                    <tr className="border-b border-slate-950 text-[10.5px] font-medium bg-amber-50/30">
                      <td className="p-1 text-center font-black font-mono border-r border-slate-950 whitespace-nowrap text-[11px]">
                        {data.subjects.length + 1}
                      </td>
                      <td className="p-1 font-bold border-r border-slate-950 truncate text-[11px]">{translateSubject(data.optionalSubject.name)}</td>
                      <td className="p-1 text-center border-r border-slate-950 font-mono">{data.optionalSubject.fullMarks}</td>
                      <td className="p-1 text-center border-r border-slate-950 font-mono">{data.optionalSubject.hasEnteredMarks ? (data.optionalSubject.cq || '-') : '-'}</td>
                      <td className="p-1 text-center border-r border-slate-950 font-mono">{data.optionalSubject.hasEnteredMarks ? (data.optionalSubject.mcq || '-') : '-'}</td>
                      <td className="p-1 text-center border-r border-slate-950 font-mono">{data.optionalSubject.hasEnteredMarks ? (data.optionalSubject.practical || data.optionalSubject.ca || '-') : '-'}</td>
                      <td className="p-1 text-center border-r border-slate-950 font-mono font-black">{data.optionalSubject.hasEnteredMarks ? data.optionalSubject.totalMarks : '-'}</td>
                      <td className="p-1 text-center border-r border-slate-950 font-black text-[11px]">{data.optionalSubject.hasEnteredMarks ? data.optionalSubject.letterGrade : '-'}</td>
                      <td className="p-1 text-center border-r border-slate-950 font-mono font-black">{data.optionalSubject.hasEnteredMarks ? data.optionalSubject.gradePoint?.toFixed(0) : '-'}</td>
                      <td className="p-1 text-center border-r border-slate-950 font-mono font-black text-xs text-indigo-950 bg-indigo-50/70">
                        {data.optionalSubject.hasEnteredMarks && data.bonusGP > 0 ? data.bonusGP.toFixed(1) : '-'}
                      </td>
                    </tr>
                  </>
                )}

                {/* ── 📊 TOTAL SUMMARY ROW ── */}
                <tr className="bg-slate-200 text-slate-950 font-black border-t-2 border-slate-950 text-[10.5px]">
                  <td colSpan={2} className="p-1 text-center border-r border-slate-950 font-black tracking-wider uppercase text-[10px]">
                    {L.grandTotal}
                  </td>
                  <td className="p-1 text-center border-r border-slate-950 font-mono font-black text-xs">{data.totalFull}</td>
                  <td className="p-1 text-center border-r border-slate-950 font-mono">{data.totalCq || '-'}</td>
                  <td className="p-1 text-center border-r border-slate-950 font-mono">{data.totalMcq || '-'}</td>
                  <td className="p-1 text-center border-r border-slate-950 font-mono">{data.totalPrac || '-'}</td>
                  <td className="p-1 text-center border-r border-slate-950 font-mono text-xs font-black">{data.totalObtained}</td>
                  <td className="p-1 text-center border-r border-slate-950 text-xs font-black">{data.overallGrade}</td>
                  <td className="p-1 text-center border-r border-slate-950 font-mono text-xs font-black">{data.gpaWithout4th?.toFixed(2)}</td>
                  
                  {/* BOTTOM CELL FOR OVERALL TOTAL GRADE */}
                  <td className="p-1 text-center bg-amber-200 text-amber-950 font-black border-r border-slate-950">
                    <div className="text-[7.5px] uppercase font-extrabold text-amber-900 leading-tight">{isEn ? 'Overall\nGrade' : 'মোট গ্রেড'}</div>
                    <div className="text-xs font-black leading-none">{data.overallGrade}</div>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          {/* 📊 RESULT SUMMARY BOX */}
          <div className="mb-3 border-2 border-slate-950 bg-slate-100/90 p-2 text-center font-sans">
            <div className="text-[9.5px] font-black text-slate-950 tracking-wider uppercase mb-1 border-b border-slate-950 pb-0.5">
              {L.resultSummary}
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs font-bold divide-x divide-slate-950">
              
              {/* TOTAL OBTAINED MARKS */}
              <div className="px-1">
                <span className="text-[9px] text-slate-700 block uppercase font-bold">{L.totalMarks}</span>
                <span className="text-xs font-black font-mono text-slate-950">{data.totalObtained} / {data.totalFull}</span>
              </div>

              {/* GPA WITHOUT 4TH SUBJECT */}
              <div className="px-1">
                <span className="text-[9px] text-slate-700 block uppercase font-bold">{L.gpaExcl}</span>
                <span className="text-xs font-black font-mono text-slate-800">{data.hasFailed ? '0.00' : data.gpaWithout4th?.toFixed(2)}</span>
              </div>

              {/* FINAL COMBINED GPA WITH BONUS */}
              <div className="px-1 bg-indigo-50/80 py-0.5">
                <span className="text-[9px] text-indigo-950 block uppercase font-black">{L.finalGpa}</span>
                <span className="text-sm font-black font-mono text-indigo-950 leading-none">
                  {data.hasFailed ? '0.00' : data.finalGPA?.toFixed(2)}
                </span>
              </div>

              {/* OVERALL GRADE BADGE */}
              <div className="px-1 flex flex-col items-center justify-center">
                <span className="text-[9px] text-slate-700 block uppercase font-bold mb-0.5">{L.overallGrade}</span>
                <span className={`inline-block px-2.5 py-0.5 rounded-none text-[11px] font-black uppercase text-white shadow-sm ${
                  data.overallGrade === 'A+' ? 'bg-emerald-700' :
                  data.overallGrade === 'F' ? 'bg-rose-700' : 'bg-slate-950'
                }`}>
                  {data.overallGrade}
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* 5. OFFICIAL THREE SIGNATURE FOOTER */}
        <div className="pt-5 flex justify-between items-end text-center text-xs font-bold text-slate-950 relative z-10">
          <div className="space-y-1">
            <div className="w-36 border-b border-slate-950 mx-auto"></div>
            <p>{L.classTeacher}</p>
          </div>

          <div className="space-y-1">
            <div className="w-36 border-b border-slate-950 mx-auto"></div>
            <p>{L.guardian}</p>
          </div>

          <div className="space-y-1">
            <div className="w-36 border-b border-slate-950 mx-auto"></div>
            <p className="font-black">{L.headmaster}</p>
            {settings?.principalName && (
              <p className="text-[10px] text-slate-700 font-normal">
                ({isEn && (settings.principalName === 'মোহাম্মদ রফিকুল ইসলাম' || settings.principalName.includes('রফিকুল ইসলাম'))
                  ? 'Mohammad Rafiqul Islam'
                  : settings.principalName})
              </p>
            )}
          </div>
        </div>

      </div>

      {/* 🖨️ PROFESSIONAL A4 PRINT & PDF EXPORT STYLES (EXACT ZERO-OFFSET 1-PAGE A4) */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 0mm !important;
          }
          html, body {
            margin: 0mm !important;
            padding: 0mm !important;
            width: 210mm !important;
            height: 100% !important;
            max-height: 100% !important;
            overflow: hidden !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Eliminate any non-printable element spacing completely */
          header, footer, nav, aside, .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            max-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            overflow: hidden !important;
          }
          /* Force parent containers to have zero margins/paddings */
          main, #marksheet-result-container, [id^="marksheet"] {
            margin: 0mm !important;
            padding: 0mm !important;
            border: none !important;
            display: block !important;
            width: 100% !important;
            max-width: none !important;
          }
          /* Neutralize Tailwind sibling vertical space-y margins */
          [class*="space-y-"] > * {
            margin-top: 0mm !important;
            margin-bottom: 0mm !important;
          }
          .marksheet-bulk-container {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .marksheet-card-wrapper {
            width: 210mm !important;
            max-width: 210mm !important;
            min-height: 295mm !important;
            height: 296mm !important;
            max-height: 296mm !important;
            padding: 0.45in !important;
            box-sizing: border-box !important;
            margin: 0mm auto !important;
            box-shadow: none !important;
            border: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }
          /* Single marksheet MUST NEVER create page 2 */
          .marksheet-card-wrapper:only-child,
          .marksheet-card-wrapper:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          /* Multi-page bulk marksheet */
          .marksheet-bulk-container .marksheet-card-wrapper:not(:last-child) {
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}</style>

    </div>
  );
}
