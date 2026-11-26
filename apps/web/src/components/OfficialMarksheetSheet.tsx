'use client';

import React from 'react';
import {
  getStudentReligion,
  isReligionSubject,
} from '@/lib/religionUtils';
import { getUniversalStudentMark } from '@/lib/markStorageUtils';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import { studentService } from '@/services/studentService';
import {
  getEnglishSchoolName as resolveEnglishSchoolName,
  getEnglishAddress as resolveEnglishAddress,
  getEnglishPrincipalNameFromSettings,
  getEnglishPrincipalTitleFromSettings,
  getSchoolInitials,
} from '@/services/settingsService';
import {
  evaluateSubjectGradeAndPass,
  gpaToLetterGrade,
  PassEvaluationMode,
} from '@/services/resultService';
import {
  MarksheetBorderPreset,
  buildMarksheetQrPayload,
  formatMeritPositionEn,
  generateQrSvgPath,
  normalizeMarksheetRollNumber,
  resolveBranchForGradeAndGroup,
} from '@/lib/marksheetStudioUtils';

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
  cqFull?: number;
  mcqFull?: number;
  practicalFull?: number;
  caFull?: number;
  passMarks?: number;
  passRules?: string;
  isPassed?: boolean;
  failedComponents?: string[];
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
  const { normalizedBranch, normalizedGroupBn } = resolveBranchForGradeAndGroup(grade, section, group);
  const targetGroup = isClass9or10 ? normalizedGroupBn : 'সাধারণ';
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
        try { all = [...all, ...JSON.parse(storedUploaded)]; } catch {}
      }
      if (storedStudents) {
        try { all = [...all, ...JSON.parse(storedStudents)]; } catch {}
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

    if (!matchedGrade) return false;

    if (isClass9or10) {
      // Auto-sync Class 9-10 strictly by Group (accepting section/branch aligned to group OR legacy 'A'/'')
      const resolvedSt = resolveBranchForGradeAndGroup(grade, sSection, sGroup);
      return resolvedSt.normalizedGroupBn === targetGroup;
    }

    const secLower = (normalizedBranch || '').toLowerCase().trim();
    const sSecLower = sSection.toLowerCase().trim();
    const matchedSection = !section || secLower === 'all' || sSecLower === secLower ||
      (secLower === 'a' && (sSecLower === 'a' || sSecLower === 'ক' || sSecLower.includes('section a') || sSecLower.includes('শাখা a'))) ||
      (secLower === 'b' && (sSecLower === 'b' || sSecLower === 'খ' || sSecLower.includes('section b') || sSecLower.includes('শাখা b'))) ||
      (secLower === 'c' && (sSecLower === 'c' || sSecLower === 'গ' || sSecLower.includes('section c') || sSecLower.includes('শাখা c')));

    return matchedSection;
  });

  // Sort numerically ascending (supports both Bengali ০–৯ and English 0–9 rolls)
  filtered.sort((a, b) => {
    const rA = normalizeMarksheetRollNumber(a.roll);
    const rB = normalizeMarksheetRollNumber(b.roll);
    if (rA !== rB) return rA - rB;
    return String(a.roll || '').localeCompare(String(b.roll || ''));
  });

  // Deduplicate cleanly by normalized roll inside this class/section/group
  const seenKeys = new Set<string>();
  const uniqueList: StudentProfile[] = [];
  const currentYearBn = String(new Date().getFullYear());

  filtered.forEach((st, idx) => {
    const r = String(st.roll || String(idx + 1).padStart(2, '0')).trim();
    const rollNum = normalizeMarksheetRollNumber(r);
    const dedupKey = `${grade}_${targetGroup}_${normalizedBranch}_${rollNum !== Number.MAX_SAFE_INTEGER ? rollNum : r}`;
    if (seenKeys.has(dedupKey)) return;
    seenKeys.add(dedupKey);

    uniqueList.push({
      id: st.id || `st_${dedupKey}`,
      roll: r,
      name: st.name || `শিক্ষার্থী ${r}`,
      grade: grade,
      gradeBn: gradeBn,
      section: isClass9or10 ? normalizedBranch : (st.section || st.branch || normalizedBranch),
      group: isClass9or10 ? targetGroup : 'সাধারণ',
      fatherName: st.fatherName || (st as { guardian?: string }).guardian || '',
      motherName: st.motherName || '',
      session: st.session || currentYearBn,
      optionalSubject: st.optionalSubject || (isClass9or10 && targetGroup === 'বিজ্ঞান' ? 'উচ্চতর গণিত' : 'কৃষি শিক্ষা')
    });
  });

  return uniqueList;
};

// ─── NCTB MARKSHEET DATA CALCULATION ENGINE ───
export interface MarksheetCalculationOptions {
  selectedExam: string;
  selectedGrade: string;
  selectedBranch: string;
  passMode?: PassEvaluationMode;
}

export const generateStudentMarksheetData = (
  targetStudent: StudentProfile,
  options: MarksheetCalculationOptions
) => {
  const { selectedExam, selectedGrade, selectedBranch, passMode = 'curriculum' } = options;
  const gradeNumMap: Record<string, number> = { '6th': 6, '7th': 7, '8th': 8, '9th': 9, '10th': 10 };
  const targetGradeNum = gradeNumMap[selectedGrade] || 8;

  const studentRel = getStudentReligion(targetStudent);

  const classConfigured = getActiveCurriculumSubjects(
    selectedGrade,
    targetStudent.group,
    targetStudent.optionalSubject,
    studentRel
  );

  // 1. Filter classConfigured so religion subjects of OTHER religions are excluded
  const religionMatchedConfigured = classConfigured.filter((sub: any) => {
    const codeOrName = `${sub.code || ''} ${sub.name || ''}`.toLowerCase();
    const isRel = isReligionSubject(codeOrName);
    if (!isRel) return true;

    if (studentRel === 'Muslim') {
      if (codeOrName.includes('হিন্দু') || codeOrName.includes('hindu') || codeOrName.includes('hrel') ||
          codeOrName.includes('খ্রিস্ট') || codeOrName.includes('খ্রিষ্ট') || codeOrName.includes('christian') || codeOrName.includes('crel') ||
          codeOrName.includes('বৌদ্ধ') || codeOrName.includes('buddhist') || codeOrName.includes('brel')) {
        return false;
      }
    } else if (studentRel === 'Hindu') {
      if (codeOrName.includes('ইসলাম') || codeOrName.includes('islam') || codeOrName.includes('irel') ||
          codeOrName.includes('খ্রিস্ট') || codeOrName.includes('খ্রিষ্ট') || codeOrName.includes('christian') || codeOrName.includes('crel') ||
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
          codeOrName.includes('খ্রিস্ট') || codeOrName.includes('খ্রিষ্ট') || codeOrName.includes('christian') || codeOrName.includes('crel')) {
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
    let displayCode = sub.code;
    if (isRel) {
      if (studentRel === 'Hindu') {
        displaySubjectName = 'হিন্দুধর্ম ও নৈতিক শিক্ষা';
        displayCode = '112';
      } else if (studentRel === 'Muslim') {
        displaySubjectName = 'ইসলাম ও নৈতিক শিক্ষা';
        displayCode = '111';
      } else if (studentRel === 'Christian') {
        displaySubjectName = 'খ্রিষ্টধর্ম ও নৈতিক শিক্ষা';
        displayCode = '114';
      } else if (studentRel === 'Buddhist') {
        displaySubjectName = 'বৌদ্ধধর্ম ও নৈতিক শিক্ষা';
        displayCode = '113';
      } else {
        displaySubjectName = 'ধর্ম ও নৈতিক শিক্ষা';
      }
    }

    rawSubjects.push({
      code: displayCode,
      name: displaySubjectName,
      fullMarks,
      cq: retrieved.cq,
      mcq: retrieved.mcq,
      practical: retrieved.practical,
      ca: retrieved.ca,
      totalMarks: retrieved.total,
      cqFull: Number(sub.cq) || 0,
      mcqFull: Number(sub.mcq) || 0,
      practicalFull: Number(sub.practical) || 0,
      caFull: Number(sub.ca) || 0,
      passMarks: Number(sub.passMarks) || 0,
      passRules: sub.passRules || '',
      hasEnteredMarks: retrieved.hasMarks,
      isJointPass: Boolean(sub.isJointPass),
      jointPairCode: sub.jointPairCode
    });
  }

  // ══════════════════════════════════════════════════════════════
  // STRIP optional/4th subjects from rawSubjects — they MUST only
  // appear in the ADDITIONAL SUBJECT section, never in main rows.
  // ══════════════════════════════════════════════════════════════
  const OPTIONAL_KEYWORDS = ['কৃষি', 'গার্হস্থ্য', 'উচ্চতর গণিত', 'কম্পিউটার শিক্ষা', 'agriculture', 'home science', 'higher math'];
  const OPTIONAL_CODE_PREFIXES = ['AGR', 'HMS', 'HMT', 'CMP'];
  const OPTIONAL_NCTB_CODES = ['126', '134', '151'];
  const isOptionalSub = (s: any) =>
    OPTIONAL_KEYWORDS.some(kw => s.name && String(s.name).toLowerCase().includes(kw)) ||
    OPTIONAL_CODE_PREFIXES.some(pfx => s.code && String(s.code).startsWith(pfx)) ||
    (s.code && OPTIONAL_NCTB_CODES.includes(String(s.code).trim()));

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
      'উচ্চতর গণিত': '126',
      'কৃষি শিক্ষা': '134',
      'গার্হস্থ্য বিজ্ঞান': '151',
      'জীববিজ্ঞান': '138',
      'কম্পিউটার শিক্ষা': '135'
    };
    const optCode = optionalCodeMap[optName] || '134';
    const matchedOptConfig = religionMatchedConfigured.find(
      (s: any) => s.code === optCode || (s.name && s.name.includes(optName)) || isOptionalSub(s)
    );
    const optFullMarks = matchedOptConfig?.fullMarks || 100;

    const optRetrieved = getUniversalStudentMark({
      exam: selectedExam,
      grade: selectedGrade,
      branch: selectedBranch,
      group: targetStudent.group,
      subjectCodeOrName: matchedOptConfig?.code || optName,
      studentRoll: targetStudent.roll,
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      religion: studentRel
    });

    const optTotal = optRetrieved.hasMarks ? optRetrieved.total : 0;
    const optEval = evaluateSubjectGradeAndPass(
      {
        cq: optRetrieved.cq,
        mcq: optRetrieved.mcq,
        practical: optRetrieved.practical,
        ca: optRetrieved.ca,
        total: optTotal,
      },
      matchedOptConfig || {
        fullMarks: optFullMarks,
        cq: optFullMarks,
        mcq: 0,
        practical: 0,
        ca: 0,
      },
      passMode,
    );

    optionalSubjectMarkData = {
      code: optCode,
      name: optName,
      fullMarks: optFullMarks,
      cq: optRetrieved.cq,
      mcq: optRetrieved.mcq,
      practical: optRetrieved.practical || optRetrieved.ca,
      totalMarks: optTotal,
      hasEnteredMarks: optRetrieved.hasMarks,
      isPassed: optRetrieved.hasMarks ? optEval.isPassed : false,
      failedComponents: optRetrieved.hasMarks ? optEval.failedComponents : [],
      letterGrade: optRetrieved.hasMarks ? optEval.letterGrade : '-',
      gradePoint: optRetrieved.hasMarks ? optEval.gradePoint : 0
    };

    totalFull += optFullMarks;
    if (optRetrieved.hasMarks) {
      totalObtained += optTotal;
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
      (sub.name.includes('বাংলা ১ম') && (nextSub.name.includes('বাংলা ২য়') || nextSub.name.includes('বাংলা ২য়'))) ||
      (sub.name.includes('ইংরেজি ১ম') && (nextSub.name.includes('ইংরেজি ২য়') || nextSub.name.includes('ইংরেজি ২য়'))) ||
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
      const jointEval = evaluateSubjectGradeAndPass(
        {
          cq: (sub.cq || 0) + (nextSub.cq || 0),
          mcq: (sub.mcq || 0) + (nextSub.mcq || 0),
          practical: (sub.practical || 0) + (nextSub.practical || 0),
          ca: (sub.ca || 0) + (nextSub.ca || 0),
          total: jointCombinedTotal,
        },
        {
          fullMarks: jointCombinedFull,
          cq: (sub.cqFull || 0) + (nextSub.cqFull || 0),
          mcq: (sub.mcqFull || 0) + (nextSub.mcqFull || 0),
          practical: (sub.practicalFull || 0) + (nextSub.practicalFull || 0),
          ca: (sub.caFull || 0) + (nextSub.caFull || 0),
          passMarks: (sub.passMarks || 0) + (nextSub.passMarks || 0),
          passRules: sub.passRules || nextSub.passRules,
        },
        passMode,
      );

      if (!jointEval.isPassed) hasFailed = true;

      totalObtained += jointCombinedTotal;
      totalFull += jointCombinedFull;
      totalCq += (sub.cq || 0) + (nextSub.cq || 0);
      totalMcq += (sub.mcq || 0) + (nextSub.mcq || 0);
      totalPrac += (sub.practical || sub.ca || 0) + (nextSub.practical || nextSub.ca || 0);
      mainGradePoints += jointEval.gradePoint;
      mainUnitsCount++;

      processedSubjects.push({
        ...sub,
        isJointMaster: true,
        isPassed: jointEval.isPassed,
        failedComponents: jointEval.failedComponents,
        jointCombinedTotal,
        jointCombinedGrade: jointEval.letterGrade,
        jointCombinedPoint: jointEval.gradePoint,
        letterGrade: jointEval.letterGrade,
        gradePoint: jointEval.gradePoint
      });

      processedSubjects.push({
        ...nextSub,
        isJointSlave: true,
        isPassed: jointEval.isPassed,
        failedComponents: jointEval.failedComponents,
        letterGrade: jointEval.letterGrade,
        gradePoint: jointEval.gradePoint
      });

      processedCodes.add(sub.code);
      processedCodes.add(nextSub.code);
      processedNames.add(sub.name);
      processedNames.add(nextSub.name);
    } else {
      // Single non-joint subject
      const evalRes = evaluateSubjectGradeAndPass(
        {
          cq: sub.cq,
          mcq: sub.mcq,
          practical: sub.practical,
          ca: sub.ca,
          total: sub.totalMarks,
        },
        {
          fullMarks: sub.fullMarks,
          cq: sub.cqFull || 0,
          mcq: sub.mcqFull || 0,
          practical: sub.practicalFull || 0,
          ca: sub.caFull || 0,
          passMarks: sub.passMarks,
          passRules: sub.passRules,
        },
        passMode,
      );
      if (!evalRes.isPassed) hasFailed = true;

      totalObtained += sub.totalMarks;
      totalFull += sub.fullMarks;
      totalCq += (sub.cq || 0);
      totalMcq += (sub.mcq || 0);
      totalPrac += (sub.practical || sub.ca || 0);
      mainGradePoints += evalRes.gradePoint;
      mainUnitsCount++;

      processedSubjects.push({
        ...sub,
        isPassed: evalRes.isPassed,
        failedComponents: evalRes.failedComponents,
        letterGrade: evalRes.letterGrade,
        gradePoint: evalRes.gradePoint
      });

      processedCodes.add(sub.code);
      processedNames.add(sub.name);
    }
  }

  // 4th Subject Bonus Calculation (GP > 2.00)
  const optionalGP = optionalSubjectMarkData?.gradePoint || 0;
  const bonusGP = Math.max(0, Number((optionalGP - 2.00).toFixed(2)));

  const gpaWithout4th = hasFailed || mainUnitsCount === 0 ? 0.0 : Number((mainGradePoints / mainUnitsCount).toFixed(2));
  const finalGPA = hasFailed || mainUnitsCount === 0 ? 0.0 : Math.min(5.00, Number(((mainGradePoints + bonusGP) / mainUnitsCount).toFixed(2)));

  const overallGrade = gpaToLetterGrade(finalGPA, hasFailed);

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

export const MARKSHEET_A4_PRINT_STYLES = `
  @media print {
    @page {
      size: A4 portrait !important;
      margin: 0mm !important;
    }
    html, body {
      margin: 0mm !important;
      padding: 0mm !important;
      width: 210mm !important;
      height: auto !important;
      min-height: 100% !important;
      overflow: visible !important;
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
    /* Force parent containers to have zero margins/paddings and zero screen-scale transforms */
    main, #marksheet-result-container, [id^="marksheet"], .marksheet-preview-shell {
      margin: 0mm !important;
      padding: 0mm !important;
      border: none !important;
      display: block !important;
      width: 210mm !important;
      max-width: none !important;
      transform: none !important;
      box-shadow: none !important;
      background: #ffffff !important;
    }
    /* Neutralize Tailwind sibling vertical space-y margins on outer wrappers only */
    .marksheet-bulk-container > * {
      margin-top: 0mm !important;
      margin-bottom: 0mm !important;
    }
    .marksheet-bulk-container {
      display: block !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 210mm !important;
    }
    .marksheet-card-wrapper {
      width: 210mm !important;
      max-width: 210mm !important;
      min-height: 297mm !important;
      height: 297mm !important;
      max-height: 297mm !important;
      padding: 11mm !important;
      box-sizing: border-box !important;
      margin: 0mm auto !important;
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      overflow: hidden !important;
    }
    /* Multi-page bulk marksheet: strictly 1 student per A4 page */
    .marksheet-bulk-container > .marksheet-card-wrapper:not(:last-child) {
      page-break-after: always !important;
      break-after: page !important;
    }
    /* Single or last marksheet MUST NEVER create an extra trailing blank page */
    .marksheet-card-wrapper:only-child,
    .marksheet-card-wrapper:last-child {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
  }
`;

interface BorderThemePalette {
  outerBorderColor: string;
  innerBorderColor: string;
  cornerColor: string;
  bannerBg: string;
  accentSoftBg: string;
  accentText: string;
  showCorners: boolean;
  showDoubleInner: boolean;
}

const BORDER_PALETTES: Record<Exclude<MarksheetBorderPreset, 'custom_png'>, BorderThemePalette> = {
  classic_double: {
    outerBorderColor: '#0f172a',
    innerBorderColor: '#334155',
    cornerColor: '#0f172a',
    bannerBg: '#0f172a',
    accentSoftBg: '#f1f5f9',
    accentText: '#0f172a',
    showCorners: true,
    showDoubleInner: true,
  },
  emerald_gold: {
    outerBorderColor: '#0B5D3B',
    innerBorderColor: '#b48228',
    cornerColor: '#0B5D3B',
    bannerBg: '#0B5D3B',
    accentSoftBg: '#ecfdf5',
    accentText: '#064e3b',
    showCorners: true,
    showDoubleInner: true,
  },
  royal_navy: {
    outerBorderColor: '#0f294a',
    innerBorderColor: '#9a7b3c',
    cornerColor: '#0f294a',
    bannerBg: '#0f294a',
    accentSoftBg: '#eff6ff',
    accentText: '#0f294a',
    showCorners: true,
    showDoubleInner: true,
  },
  minimal: {
    outerBorderColor: '#1e293b',
    innerBorderColor: '#cbd5e1',
    cornerColor: '#334155',
    bannerBg: '#1e293b',
    accentSoftBg: '#f8fafc',
    accentText: '#0f172a',
    showCorners: false,
    showDoubleInner: false,
  },
};

// ═════════════════════════════════════════════════════════════════
// 🖨️ A4 PRINTABLE MARKSHEET SHEET COMPONENT (BOARD-GRADE MASTER TEMPLATE)
// ═════════════════════════════════════════════════════════════════
function MarksheetSheetCardInner({
  student,
  settings,
  examName,
  data,
  borderImageUrl = '',
  borderPreset,
  meritPosition = null,
  totalClassStudents,
  showWatermark,
  showQrCode = true,
  includePrintStyles = true,
}: {
  student: StudentProfile;
  settings: any;
  examName: string;
  data: any;
  borderImageUrl?: string;
  lang?: 'bn' | 'en';
  borderPreset?: MarksheetBorderPreset;
  meritPosition?: number | null;
  totalClassStudents?: number;
  showWatermark?: boolean;
  showQrCode?: boolean;
  includePrintStyles?: boolean;
}) {
  // Official Academic Transcript renders in crisp standard English
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

  const getEnglishSchoolName = (name: string | undefined): string =>
    resolveEnglishSchoolName({ ...settings, schoolName: name || settings?.schoolName }).toUpperCase();

  const getEnglishAddress = (addr: string | undefined): string =>
    resolveEnglishAddress({ ...settings, address: addr || settings?.address });

  const schoolInitials = getSchoolInitials(settings);

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
    if (n.includes('খ্রিস্টান') || n.includes('খ্রিষ্ট') || n.includes('Christian')) return 'Christianity & Moral Education';
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

  const translateExamName = (name: string): string => {
    if (!name) return `EXAMINATION ${new Date().getFullYear()}`;
    return name
      .replace(/অর্ধ[\s-]?বার্ষিক\s*পরীক্ষা/gi, 'Half-Yearly Examination')
      .replace(/বার্ষিক\s*পরীক্ষা/gi, 'Annual Examination')
      .replace(/১ম\s*সাময়িক\s*পরীক্ষা|১ম\s*সাময়িক\s*পরীক্ষা/gi, '1st Terminal Examination')
      .replace(/২য়\s*সাময়িক\s*পরীক্ষা|২য়\s*সাময়িক\s*পরীক্ষা/gi, '2nd Terminal Examination')
      .replace(/মডেল\s*টেস্ট\s*পরীক্ষা/gi, 'Model Test Examination')
      .replace(/এসএসসি\s*নির্বাচনী\s*\(টেস্ট\)\s*পরীক্ষা/gi, 'SSC Selection (Test) Examination')
      .replace(/নির্বাচনী\s*পরীক্ষা/gi, 'Test Examination')
      .replace(/এসএসসি\s*প্রাক[\s-]?নির্বাচনী(\s*পরীক্ষা)?/gi, 'SSC Pre-Selection Examination')
      .replace(/[০-৯]/g, d => "0123456789"["০১২৩৪৫৬৭৮৯".indexOf(d)]);
  };

  // Resolve active border preset & palette
  const useCustomPngBorder = Boolean(
    borderImageUrl && (borderPreset === 'custom_png' || !borderPreset),
  );
  const resolvedPresetKey: Exclude<MarksheetBorderPreset, 'custom_png'> =
    borderPreset && borderPreset !== 'custom_png' ? borderPreset : 'classic_double';
  const palette = BORDER_PALETTES[resolvedPresetKey];

  const watermarkEnabled =
    showWatermark !== undefined ? showWatermark : settings?.showWatermark !== false;

  const isCompactTable = (data?.subjects?.length || 0) >= 11;
  const cellPadY = isCompactTable ? 'py-[2.5px]' : 'py-[4px]';
  const isClass9or10 = student.grade === '9th' || student.grade === '10th';
  const percentageVal =
    data?.totalFull > 0 ? Number(((data.totalObtained / data.totalFull) * 100).toFixed(1)) : 0;
  const meritFormatted =
    !data?.hasFailed && meritPosition
      ? totalClassStudents
        ? `${formatMeritPositionEn(meritPosition)} (of ${totalClassStudents})`
        : formatMeritPositionEn(meritPosition)
      : '—';
  const translatedExam = translateExamName(examName);
  const issueDateEn = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Synchronous Vector QR Code (memoized; zero async flash on immediate single/batch print!)
  const qrPayload = showQrCode
    ? buildMarksheetQrPayload({
        eiin: settings?.eiin,
        examName: translatedExam,
        grade: student.grade,
        roll: student.roll,
        studentName: student.name,
        gpa: data?.hasFailed ? '0.00' : Number(data?.finalGPA || 0).toFixed(2),
        gradeLetter: data?.overallGrade || 'F',
        meritPosition: data?.hasFailed ? null : meritPosition,
      })
    : '';

  const qrData = React.useMemo(
    () => (qrPayload ? generateQrSvgPath(qrPayload) : null),
    [qrPayload],
  );

  return (
    <div
      className="marksheet-card-wrapper bg-white shadow-lg border border-slate-200/80 rounded-xl print:rounded-none mx-auto text-slate-950 font-sans relative print:shadow-none print:max-w-none print:m-0 print:[&:not(:last-child)]:break-after-page"
      style={{
        width: '210mm',
        maxWidth: '100%',
        minHeight: '297mm',
        padding: '11mm',
        boxSizing: 'border-box',
        position: 'relative',
        background: '#ffffff',
      }}
    >
      {/* ── CUSTOM PNG BORDER OVERLAY ── */}
      {useCustomPngBorder && (
        // eslint-disable-next-line @next/next/no-img-element
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

      {/* ── INNER OFFICIAL A4 DOCUMENT FRAME ── */}
      <div
        className="h-full min-h-[275mm] print:min-h-0 print:h-full flex flex-col justify-between relative z-10"
        style={{
          border: useCustomPngBorder ? 'none' : `2.2px solid ${palette.outerBorderColor}`,
          padding: useCustomPngBorder ? '4mm' : '3.5mm',
        }}
      >
        {/* Inner Hairline Double Frame & Ornamental Corner L-Brackets */}
        {!useCustomPngBorder && palette.showDoubleInner && (
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute inset-[3.5px]"
            style={{ border: `0.9px solid ${palette.innerBorderColor}` }}
          />
        )}
        {!useCustomPngBorder && palette.showCorners && (
          <>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-[6px] left-[6px] w-3.5 h-3.5"
              style={{
                borderTop: `2px solid ${palette.cornerColor}`,
                borderLeft: `2px solid ${palette.cornerColor}`,
              }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-[6px] right-[6px] w-3.5 h-3.5"
              style={{
                borderTop: `2px solid ${palette.cornerColor}`,
                borderRight: `2px solid ${palette.cornerColor}`,
              }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-[6px] left-[6px] w-3.5 h-3.5"
              style={{
                borderBottom: `2px solid ${palette.cornerColor}`,
                borderLeft: `2px solid ${palette.cornerColor}`,
              }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-[6px] right-[6px] w-3.5 h-3.5"
              style={{
                borderBottom: `2px solid ${palette.cornerColor}`,
                borderRight: `2px solid ${palette.cornerColor}`,
              }}
            />
          </>
        )}

        {/* Background School Logo Watermark */}
        {watermarkEnabled && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
            style={{ opacity: settings?.watermarkOpacity || 0.045 }}
          >
            {settings?.schoolLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.schoolLogo}
                alt="Watermark Logo"
                className="w-[330px] h-[330px] object-contain grayscale"
              />
            ) : (
              <div className="w-[300px] h-[300px] flex flex-col items-center justify-center text-slate-950">
                <span className="text-5xl font-bold">★</span>
                <span className="text-5xl font-black tracking-tighter">{schoolInitials}</span>
                <span className="text-2xl font-bold text-slate-700">
                  {toEnNumber(settings?.estdYear || String(new Date().getFullYear()))}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ══ TOP & BODY CONTENT ══ */}
        <div className="relative z-10 px-2 pt-1.5">
          {/* 1. SCHOOL IDENTITY BANNER */}
          <div className="mb-2.5">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center overflow-hidden shrink-0">
                {settings?.schoolLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={settings.schoolLogo}
                    alt="School Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex flex-col items-center justify-center p-1"
                    style={{ border: `1.5px solid ${palette.outerBorderColor}` }}
                  >
                    <span className="text-[10px] font-bold" style={{ color: palette.innerBorderColor }}>
                      ★
                    </span>
                    <span className="text-[9px] font-black tracking-tighter text-slate-950">
                      {schoolInitials}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight uppercase leading-tight">
                  {getEnglishSchoolName(settings?.schoolName)}
                </h1>
                {getEnglishAddress(settings?.address) && (
                  <p className="text-[11px] font-bold text-slate-800 leading-snug">
                    {getEnglishAddress(settings?.address)}
                  </p>
                )}
                <p className="text-[10px] font-bold text-slate-700 font-mono">
                  {`${settings?.estdYear ? `Estd: ${toEnNumber(settings.estdYear)}  |  ` : ''}EIIN: ${toEnNumber(settings?.eiin || '---')}`}
                </p>
              </div>
            </div>

            {/* Institutional Double Divider */}
            <div
              className="w-full mt-2"
              style={{
                borderTop: `1.8px solid ${palette.outerBorderColor}`,
                borderBottom: `0.7px solid ${palette.innerBorderColor}`,
                height: '3px',
              }}
            />
          </div>

          {/* 2. TRANSCRIPT TITLE + STUDENT PROFILE + FLOATING GRADING SCALE */}
          <div className="relative mb-2.5">
            {/* Compact Top-Right Grading Scale Table */}
            <div className="absolute right-0 top-0 z-20 w-[122px] border border-slate-900 bg-white overflow-hidden hidden sm:block print:block">
              <div
                className="text-white font-black text-[7.5px] tracking-wider py-0.5 text-center uppercase"
                style={{ backgroundColor: palette.bannerBg }}
              >
                GRADING SCALE
              </div>
              <table className="w-full border-collapse text-center text-[7.5px] leading-tight">
                <thead>
                  <tr className="bg-slate-100 text-slate-950 font-black border-b border-slate-900">
                    <th className="py-0.5 px-1 border-r border-slate-900">Marks</th>
                    <th className="py-0.5 px-1 border-r border-slate-900">Grade</th>
                    <th className="py-0.5 px-1">GP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-bold text-slate-950">
                  {[
                    { r: '80-100', g: 'A+', gp: '5.00', cls: 'text-emerald-900 font-black' },
                    { r: '70-79', g: 'A', gp: '4.00', cls: '' },
                    { r: '60-69', g: 'A-', gp: '3.50', cls: '' },
                    { r: '50-59', g: 'B', gp: '3.00', cls: '' },
                    { r: '40-49', g: 'C', gp: '2.00', cls: '' },
                    { r: '33-39', g: 'D', gp: '1.00', cls: '' },
                    { r: '00-32', g: 'F', gp: '0.00', cls: 'text-rose-700 font-black bg-rose-50/70' },
                  ].map((row, idx) => (
                    <tr key={row.g} className={idx % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'}>
                      <td className="py-[1.5px] px-1 border-r border-slate-800 font-mono">{row.r}</td>
                      <td className={`py-[1.5px] px-1 border-r border-slate-800 font-black ${row.cls}`}>
                        {row.g}
                      </td>
                      <td className="py-[1.5px] px-1 font-mono">{row.gp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Centered Transcript Heading & Exam Ribbon */}
            <div className="text-center pb-2 space-y-1">
              <h2 className="text-sm sm:text-base font-black text-slate-950 tracking-wider uppercase">
                ACADEMIC TRANSCRIPT / MARKSHEET
              </h2>
              <div className="flex justify-center">
                <span
                  className="inline-block px-4 py-0.5 text-white font-extrabold text-[11px] uppercase tracking-wider"
                  style={{ backgroundColor: palette.bannerBg }}
                >
                  {translatedExam}
                </span>
              </div>
            </div>

            {/* Student Identity Grid (clears top-right grading scale cleanly) */}
            <div className="py-1.5 px-2.5 text-[10.5px] font-bold grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1 sm:mr-[132px] print:mr-[132px] bg-slate-50/70 border border-slate-300">
              <div className="space-y-1">
                <div className="flex items-baseline">
                  <span className="w-[86px] text-slate-600 font-bold shrink-0">Student&apos;s Name</span>
                  <span className="mr-1.5 font-black text-slate-900">:</span>
                  <span className="font-black text-slate-950 text-[11.5px] truncate">{student.name}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-[86px] text-slate-600 font-bold shrink-0">Father&apos;s Name</span>
                  <span className="mr-1.5 font-black text-slate-900">:</span>
                  <span className="font-bold text-slate-900 truncate">{student.fatherName || '—'}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-[86px] text-slate-600 font-bold shrink-0">Mother&apos;s Name</span>
                  <span className="mr-1.5 font-black text-slate-900">:</span>
                  <span className="font-bold text-slate-900 truncate">{student.motherName || '—'}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-[86px] text-slate-600 font-bold shrink-0">Class</span>
                  <span className="mr-1.5 font-black text-slate-900">:</span>
                  <span className="font-black text-slate-950">
                    {isClass9or10
                      ? formatGrade(student.grade, student.gradeBn)
                      : `${formatGrade(student.grade, student.gradeBn)} (Sec: ${student.section})`}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline">
                  <span className="w-[78px] text-slate-600 font-bold shrink-0">Roll No.</span>
                  <span className="mr-1.5 font-black text-slate-900">:</span>
                  <span className="font-black text-slate-950 font-mono text-[11.5px]">
                    {toEnNumber(student.roll)}
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-[78px] text-slate-600 font-bold shrink-0">Group</span>
                  <span className="mr-1.5 font-black text-slate-900">:</span>
                  <span className="font-black text-slate-950">{translateGroup(student.group)}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-[78px] text-slate-600 font-bold shrink-0">Session</span>
                  <span className="mr-1.5 font-black text-slate-900">:</span>
                  <span className="font-bold text-slate-950 font-mono">{toEnNumber(student.session)}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-[78px] text-slate-600 font-bold shrink-0">Merit Pos.</span>
                  <span className="mr-1.5 font-black text-slate-900">:</span>
                  <span className="font-black" style={{ color: palette.accentText }}>
                    {meritFormatted}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. SUBJECT-WISE MARKS TABLE (BOARD-GRADE DUAL GPA LAYOUT) */}
          <div className="mb-2.5 border border-slate-950 overflow-hidden">
            <table className="w-full text-left text-[10.5px] border-collapse font-sans table-fixed">
              <colgroup>
                <col className="w-[34px]" />
                <col className="w-auto" />
                <col className="w-[42px]" />
                <col className="w-[36px]" />
                <col className="w-[36px]" />
                <col className="w-[44px]" />
                <col className="w-[52px]" />
                <col className="w-[38px]" />
                <col className="w-[38px]" />
                <col className="w-[74px]" />
                <col className="w-[64px]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-200/90 text-slate-950 font-black uppercase text-[8.5px] border-b border-slate-950">
                  <th className="py-1.5 px-1 text-center border-r border-slate-950">Sl.</th>
                  <th className="py-1.5 px-1.5 border-r border-slate-950">Subject Name</th>
                  <th className="py-1.5 px-1 text-center border-r border-slate-950">Full</th>
                  <th className="py-1.5 px-1 text-center border-r border-slate-950">CQ</th>
                  <th className="py-1.5 px-1 text-center border-r border-slate-950">MCQ</th>
                  <th className="py-1.5 px-1 text-center border-r border-slate-950">Prac/CA</th>
                  <th className="py-1.5 px-1 text-center border-r border-slate-950">Obtained</th>
                  <th className="py-1.5 px-1 text-center border-r border-slate-950">Grade</th>
                  <th className="py-1.5 px-1 text-center border-r border-slate-950">GP</th>
                  <th className="py-1 px-1 text-center border-r border-slate-950 leading-tight bg-slate-200">
                    <div>GPA</div>
                    <div className="text-[6.5px] font-bold text-slate-700 tracking-tighter">(Excl. 4th)</div>
                  </th>
                  <th
                    className="py-1 px-1 text-center font-black leading-tight"
                    style={{ backgroundColor: palette.accentSoftBg, color: palette.accentText }}
                  >
                    <div>Final GPA</div>
                    <div className="text-[6.5px] font-bold tracking-tighter">(Total)</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {data.subjects.map((sub: any, idx: number) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                    <td className={`${cellPadY} px-1 text-center font-bold font-mono border-r border-slate-900`}>
                      {idx + 1}
                    </td>
                    <td className={`${cellPadY} px-1.5 font-bold border-r border-slate-900 truncate`}>
                      {translateSubject(sub.name)}
                    </td>
                    <td className={`${cellPadY} px-1 text-center border-r border-slate-900 font-mono`}>
                      {sub.fullMarks}
                    </td>
                    <td className={`${cellPadY} px-1 text-center border-r border-slate-900 font-mono`}>
                      {sub.cq || '-'}
                    </td>
                    <td className={`${cellPadY} px-1 text-center border-r border-slate-900 font-mono`}>
                      {sub.mcq || '-'}
                    </td>
                    <td className={`${cellPadY} px-1 text-center border-r border-slate-900 font-mono`}>
                      {sub.practical || sub.ca || '-'}
                    </td>

                    {sub.isJointMaster ? (
                      <>
                        <td
                          rowSpan={2}
                          className={`${cellPadY} px-1 text-center border-r border-slate-900 font-black font-mono text-[11px] align-middle bg-slate-50`}
                        >
                          {sub.jointCombinedTotal}
                        </td>
                        <td
                          rowSpan={2}
                          className={`${cellPadY} px-1 text-center border-r border-slate-900 font-black text-[11px] align-middle bg-slate-50`}
                        >
                          <span
                            className={
                              sub.jointCombinedGrade === 'A+'
                                ? 'text-emerald-800'
                                : sub.jointCombinedGrade === 'F'
                                  ? 'text-rose-700'
                                  : 'text-slate-950'
                            }
                          >
                            {sub.jointCombinedGrade}
                          </span>
                        </td>
                        <td
                          rowSpan={2}
                          className={`${cellPadY} px-1 text-center border-r border-slate-900 font-black font-mono text-[11px] align-middle bg-slate-50`}
                        >
                          {sub.jointCombinedPoint?.toFixed(2)}
                        </td>
                      </>
                    ) : sub.isJointSlave ? null : (
                      <>
                        <td className={`${cellPadY} px-1 text-center border-r border-slate-900 font-black font-mono`}>
                          {sub.totalMarks}
                        </td>
                        <td className={`${cellPadY} px-1 text-center border-r border-slate-900 font-black`}>
                          <span
                            className={
                              sub.letterGrade === 'A+'
                                ? 'text-emerald-800'
                                : sub.letterGrade === 'F'
                                  ? 'text-rose-700'
                                  : ''
                            }
                          >
                            {sub.letterGrade}
                          </span>
                        </td>
                        <td className={`${cellPadY} px-1 text-center border-r border-slate-900 font-black font-mono`}>
                          {sub.gradePoint?.toFixed(2)}
                        </td>
                      </>
                    )}

                    {idx === 0 && (
                      <td
                        rowSpan={data.subjects.length}
                        className="p-1 text-center font-black align-middle border-r border-slate-900 bg-slate-50/90 font-mono text-sm select-none"
                      >
                        {data.hasFailed ? '0.00' : data.gpaWithout4th?.toFixed(2)}
                      </td>
                    )}

                    {idx === 0 && (
                      <td
                        rowSpan={data.subjects.length + (data.optionalSubject ? 3 : 1)}
                        className="p-1.5 text-center font-black align-middle border-l border-slate-950 select-none"
                        style={{ backgroundColor: palette.accentSoftBg, color: palette.accentText }}
                      >
                        <span className="text-base sm:text-lg font-black font-mono block">
                          {data.hasFailed ? '0.00' : data.finalGPA?.toFixed(2)}
                        </span>
                        <span className="text-[8.5px] font-extrabold uppercase tracking-wide block mt-0.5">
                          {data.overallGrade}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}

                {/* ── ADDITIONAL / OPTIONAL SUBJECT ── */}
                {data.optionalSubject && (
                  <>
                    <tr className="bg-slate-200/80 border-t-2 border-b border-slate-950 font-black text-[8.5px]">
                      <td colSpan={9} className="px-2 py-0.5 text-slate-950 uppercase tracking-wide border-r border-slate-950">
                        Additional / 4th Subject :
                      </td>
                      <td className="py-0.5 px-1 text-center font-extrabold text-[7.5px] border-r border-slate-950 text-slate-800 uppercase leading-none">
                        GP Above 2
                      </td>
                    </tr>

                    <tr className="border-b border-slate-950 bg-amber-50/35">
                      <td className={`${cellPadY} px-1 text-center font-bold font-mono border-r border-slate-900`}>
                        {data.subjects.length + 1}
                      </td>
                      <td className={`${cellPadY} px-1.5 font-bold border-r border-slate-900 truncate`}>
                        {translateSubject(data.optionalSubject.name)}
                      </td>
                      <td className={`${cellPadY} px-1 text-center border-r border-slate-900 font-mono`}>
                        {data.optionalSubject.fullMarks}
                      </td>
                      <td className={`${cellPadY} px-1 text-center border-r border-slate-900 font-mono`}>
                        {data.optionalSubject.hasEnteredMarks ? (data.optionalSubject.cq || '-') : '-'}
                      </td>
                      <td className={`${cellPadY} px-1 text-center border-r border-slate-900 font-mono`}>
                        {data.optionalSubject.hasEnteredMarks ? (data.optionalSubject.mcq || '-') : '-'}
                      </td>
                      <td className={`${cellPadY} px-1 text-center border-r border-slate-900 font-mono`}>
                        {data.optionalSubject.hasEnteredMarks ? (data.optionalSubject.practical || data.optionalSubject.ca || '-') : '-'}
                      </td>
                      <td className={`${cellPadY} px-1 text-center border-r border-slate-900 font-mono font-black`}>
                        {data.optionalSubject.hasEnteredMarks ? data.optionalSubject.totalMarks : '-'}
                      </td>
                      <td className={`${cellPadY} px-1 text-center border-r border-slate-900 font-black`}>
                        {data.optionalSubject.hasEnteredMarks ? data.optionalSubject.letterGrade : '-'}
                      </td>
                      <td className={`${cellPadY} px-1 text-center border-r border-slate-900 font-mono font-black`}>
                        {data.optionalSubject.hasEnteredMarks ? Number(data.optionalSubject.gradePoint || 0).toFixed(2) : '-'}
                      </td>
                      <td
                        className={`${cellPadY} px-1 text-center border-r border-slate-900 font-mono font-black text-[11px]`}
                        style={{ backgroundColor: palette.accentSoftBg, color: palette.accentText }}
                      >
                        {data.optionalSubject.hasEnteredMarks && data.bonusGP > 0
                          ? `+${data.bonusGP.toFixed(2)}`
                          : '0.00'}
                      </td>
                    </tr>
                  </>
                )}

                {/* ── GRAND TOTAL ROW ── */}
                <tr className="bg-slate-200/90 text-slate-950 font-black border-t-2 border-slate-950 text-[10.5px]">
                  <td colSpan={2} className="py-1.5 px-2 text-center border-r border-slate-950 uppercase tracking-wider text-[9.5px]">
                    GRAND TOTAL
                  </td>
                  <td className="py-1.5 px-1 text-center border-r border-slate-950 font-mono font-black">
                    {data.totalFull}
                  </td>
                  <td className="py-1.5 px-1 text-center border-r border-slate-950 font-mono">
                    {data.totalCq || '-'}
                  </td>
                  <td className="py-1.5 px-1 text-center border-r border-slate-950 font-mono">
                    {data.totalMcq || '-'}
                  </td>
                  <td className="py-1.5 px-1 text-center border-r border-slate-950 font-mono">
                    {data.totalPrac || '-'}
                  </td>
                  <td className="py-1.5 px-1 text-center border-r border-slate-950 font-mono font-black text-[11px]">
                    {data.totalObtained}
                  </td>
                  <td className="py-1.5 px-1 text-center border-r border-slate-950 font-black text-[11px]">
                    {data.overallGrade}
                  </td>
                  <td className="py-1.5 px-1 text-center border-r border-slate-950 font-mono font-black">
                    {data.hasFailed ? '0.00' : data.gpaWithout4th?.toFixed(2)}
                  </td>
                  <td className="py-1 px-1 text-center bg-amber-100/90 text-slate-950 font-black border-r border-slate-950">
                    <div className="text-[7px] uppercase font-extrabold text-slate-700 leading-none">
                      Percentage
                    </div>
                    <div className="text-[11px] font-mono font-black leading-tight">{percentageVal}%</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. BOARD-GRADE 5-METRIC RESULT SUMMARY BAR */}
          <div
            className="border-2 bg-slate-50/90 overflow-hidden"
            style={{ borderColor: palette.outerBorderColor }}
          >
            <div
              className="text-[9px] font-black text-white tracking-widest uppercase py-0.5 text-center"
              style={{ backgroundColor: palette.bannerBg }}
            >
              RESULT SUMMARY &amp; MERIT EVALUATION
            </div>
            <div className="grid grid-cols-5 divide-x divide-slate-400 text-center py-1.5">
              <div className="px-1">
                <span className="text-[8px] text-slate-600 block uppercase font-bold">Total Marks</span>
                <span className="text-xs font-black font-mono text-slate-950">
                  {data.totalObtained} / {data.totalFull}
                </span>
              </div>
              <div className="px-1">
                <span className="text-[8px] text-slate-600 block uppercase font-bold">Percentage</span>
                <span className="text-xs font-black font-mono text-slate-950">{percentageVal}%</span>
              </div>
              <div className="px-1">
                <span className="text-[8px] text-slate-600 block uppercase font-bold">GPA (Excl. 4th)</span>
                <span className="text-xs font-black font-mono text-slate-900">
                  {data.hasFailed ? '0.00' : data.gpaWithout4th?.toFixed(2)}
                </span>
              </div>
              <div className="px-1" style={{ backgroundColor: palette.accentSoftBg }}>
                <span
                  className="text-[8px] block uppercase font-black"
                  style={{ color: palette.accentText }}
                >
                  Final GPA
                </span>
                <span
                  className="text-sm font-black font-mono leading-none"
                  style={{ color: palette.accentText }}
                >
                  {data.hasFailed ? '0.00' : data.finalGPA?.toFixed(2)}
                </span>
              </div>
              <div className="px-1">
                <span className="text-[8px] text-slate-600 block uppercase font-bold">Grade / Merit</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span
                    className={`inline-block px-1.5 py-0.2 text-[10px] font-black text-white ${
                      data.overallGrade === 'A+'
                        ? 'bg-emerald-700'
                        : data.overallGrade === 'F'
                          ? 'bg-rose-700'
                          : 'bg-slate-900'
                    }`}
                  >
                    {data.overallGrade}
                  </span>
                  {!data.hasFailed && meritPosition && (
                    <span className="text-[10px] font-black text-slate-900">
                      · {formatMeritPositionEn(meritPosition)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ 5. OFFICIAL QR VERIFICATION & THREE-SIGNATURE FOOTER ══ */}
        <div className="relative z-10 px-2 pb-1.5 pt-3">
          <div className="flex items-end justify-between gap-4">
            {/* Synchronous Vector QR Verification Seal */}
            {qrData ? (
              <div className="flex items-center gap-2 shrink-0">
                <div className="p-1 bg-white border border-slate-800">
                  <svg
                    viewBox={`0 0 ${qrData.size} ${qrData.size}`}
                    className="w-11 h-11 block"
                    shapeRendering="crispEdges"
                    aria-label="Transcript Verification QR"
                  >
                    <rect width={qrData.size} height={qrData.size} fill="#ffffff" />
                    <path d={qrData.path} fill="#0f172a" />
                  </svg>
                </div>
                <div className="text-[8.5px] leading-tight text-slate-700">
                  <div className="font-black text-slate-950 uppercase tracking-wide">
                    Verified Transcript
                  </div>
                  <div className="font-mono">Roll: {toEnNumber(student.roll)}</div>
                  <div>Date: {issueDateEn}</div>
                </div>
              </div>
            ) : (
              <div className="text-[9px] font-bold text-slate-600 shrink-0">
                Date of Issue: <span className="text-slate-900 font-mono">{issueDateEn}</span>
              </div>
            )}

            {/* 3 Official Signatures */}
            <div className="flex-1 grid grid-cols-3 gap-4 text-center text-[10.5px] font-bold text-slate-950 pt-4">
              <div>
                <div className="w-28 sm:w-32 border-b border-slate-900 mx-auto" />
                <p className="mt-1">Class Teacher</p>
              </div>
              <div>
                <div className="w-28 sm:w-32 border-b border-slate-900 mx-auto" />
                <p className="mt-1">Guardian&apos;s Signature</p>
              </div>
              <div>
                <div className="w-28 sm:w-32 border-b border-slate-900 mx-auto" />
                <p className="mt-1 font-black">
                  {getEnglishPrincipalTitleFromSettings(settings, 'Headmaster')}
                </p>
                {settings?.principalNameEn?.trim() && (
                  <p className="text-[9px] text-slate-700 font-semibold leading-tight truncate">
                    {getEnglishPrincipalNameFromSettings(settings, '')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🖨️ CANONICAL A4 PRINT & PDF EXPORT STYLES */}
      {includePrintStyles && <style>{MARKSHEET_A4_PRINT_STYLES}</style>}
    </div>
  );
}

export const MarksheetSheetCard = React.memo(MarksheetSheetCardInner);
