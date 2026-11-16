import { getActiveCurriculumSubjects, DynamicClassSubject } from '@/lib/curriculumUtils';
import { getUniversalStudentMark } from '@/lib/markStorageUtils';
import { getStudentReligion, isReligionSubject, ReligionType } from '@/lib/religionUtils';
import { auditTrailService } from './auditTrailService';
import { syncQueueService } from './syncQueueService';

export type PassEvaluationMode = 'curriculum' | 'total' | 'part_by_part';

export interface SubjectMarkEntry {
  subjectCode: string;
  subjectName: string;
  fullMarks: number;
  cq?: number;
  mcq?: number;
  practical?: number;
  ca?: number;
  totalMarks: number;
  letterGrade: string;
  gradePoint: number;
  hasMarks?: boolean;
  isPassed?: boolean;
  passModeApplied?: 'total' | 'part_by_part';
  failedComponents?: string[];
  isOptional?: boolean;
  isJointPass?: boolean;
  jointPairCode?: string;
  jointPairName?: string;
}

export interface StudentExamResult {
  examId: string;
  studentId: string;
  studentRoll: string;
  studentName: string;
  grade: string;
  branch: string;
  group: string;
  totalObtainedMarks: number;
  totalFullMarks: number;
  obtainedPercentage?: number;
  gpaWithout4th: number;
  bonusGP: number;
  gpa: number;
  letterGrade: string;
  isPassed: boolean;
  failedCount: number;
  failedSubjects: string[];
  hasIncompleteMarks?: boolean;
  enteredSubjectsCount?: number;
  expectedSubjectsCount?: number;
  pendingSubjectNames?: string[];
  optionalSubjectName?: string;
  rank?: number;
  subjectMarks: Record<string, SubjectMarkEntry>;
  optionalSubjectMark?: SubjectMarkEntry;
}

/**
 * Resolve overall letter grade from GPA according to Bangladesh NCTB scale.
 */
export const gpaToLetterGrade = (gpa: number, hasFailed: boolean): string => {
  if (hasFailed) return 'F';
  if (gpa >= 5.0) return 'A+';
  if (gpa >= 4.0) return 'A';
  if (gpa >= 3.5) return 'A-';
  if (gpa >= 3.0) return 'B';
  if (gpa >= 2.0) return 'C';
  if (gpa >= 1.0) return 'D';
  return 'F';
};

/**
 * Standard NCTB Grading Scale calculation based on percentage obtained.
 */
export const calculateGradeAndPoint = (totalMarks: number, fullMarks: number = 100): { letterGrade: string; gradePoint: number } => {
  if (fullMarks <= 0) return { letterGrade: 'F', gradePoint: 0.0 };
  const percentage = (totalMarks / fullMarks) * 100;

  if (percentage >= 79.5) return { letterGrade: 'A+', gradePoint: 5.0 };
  if (percentage >= 69.5) return { letterGrade: 'A', gradePoint: 4.0 };
  if (percentage >= 59.5) return { letterGrade: 'A-', gradePoint: 3.5 };
  if (percentage >= 49.5) return { letterGrade: 'B', gradePoint: 3.0 };
  if (percentage >= 39.5) return { letterGrade: 'C', gradePoint: 2.0 };
  if (percentage >= 32.5) return { letterGrade: 'D', gradePoint: 1.0 };
  return { letterGrade: 'F', gradePoint: 0.0 };
};

/**
 * Determine whether a subject evaluates pass/fail cumulatively or per-component.
 */
export const resolveSubjectPassMode = (
  subject: Pick<DynamicClassSubject, 'passRules'>,
  requestedMode: PassEvaluationMode = 'curriculum',
): 'total' | 'part_by_part' => {
  if (requestedMode === 'total') return 'total';
  if (requestedMode === 'part_by_part') return 'part_by_part';
  const rulesText = (subject.passRules || '').toLowerCase();
  if (rulesText.includes('পৃথক') || rulesText.includes('আলাদা') || rulesText.includes('part')) {
    return 'part_by_part';
  }
  return 'total';
};

/**
 * Evaluate a single subject's grade & pass status supporting both cumulative (Total)
 * and component-wise (Part by Part) 33% pass rules.
 */
export const evaluateSubjectGradeAndPass = (
  mark: { cq?: number; mcq?: number; practical?: number; ca?: number; total: number },
  subject: Pick<DynamicClassSubject, 'fullMarks' | 'cq' | 'mcq' | 'practical' | 'ca' | 'passMarks' | 'passRules'>,
  passMode: PassEvaluationMode = 'curriculum',
): {
  letterGrade: string;
  gradePoint: number;
  isPassed: boolean;
  passModeApplied: 'total' | 'part_by_part';
  failedComponents: string[];
} => {
  const fullMarks = Number(subject.fullMarks) || 100;
  const base = calculateGradeAndPoint(mark.total, fullMarks);
  const appliedMode = resolveSubjectPassMode(subject, passMode);
  const failedComponents: string[] = [];

  if (appliedMode === 'part_by_part') {
    const cqFull = Number(subject.cq) || 0;
    const mcqFull = Number(subject.mcq) || 0;
    const prFull = Number(subject.practical) || 0;
    const caFull = Number(subject.ca) || 0;
    const cqObt = Number(mark.cq) || 0;
    const mcqObt = Number(mark.mcq) || 0;
    const prObt = Number(mark.practical) || 0;
    const caObt = Number(mark.ca) || 0;
    const rulesText = (subject.passRules || '').toLowerCase();
    const combinedCqMcqRule =
      passMode === 'curriculum' &&
      rulesText.includes('একত্রে') &&
      (cqFull > 0 || mcqFull > 0);

    if (combinedCqMcqRule) {
      const theoryFull = cqFull + mcqFull;
      if (theoryFull > 0) {
        const minTheory = Math.round(theoryFull * 0.33);
        if (cqObt + mcqObt < minTheory) {
          failedComponents.push(`CQ+MCQ (${cqObt + mcqObt}/${minTheory})`);
        }
      }
    } else {
      if (cqFull > 0) {
        const minCq = Math.round(cqFull * 0.33);
        if (cqObt < minCq) failedComponents.push(`CQ (${cqObt}/${minCq})`);
      }
      if (mcqFull > 0) {
        const minMcq = Math.round(mcqFull * 0.33);
        if (mcqObt < minMcq) failedComponents.push(`MCQ (${mcqObt}/${minMcq})`);
      }
    }

    if (prFull > 0) {
      const minPr = Math.round(prFull * 0.33);
      if (prObt < minPr) failedComponents.push(`Practical (${prObt}/${minPr})`);
    }
    if (caFull > 0) {
      const minCa = Math.round(caFull * 0.33);
      if (caObt < minCa) failedComponents.push(`CA (${caObt}/${minCa})`);
    }
  }

  // Also enforce custom passMarks override if higher than standard 33%
  const customPassThreshold = Number(subject.passMarks) || 0;
  const failedTotal = base.gradePoint === 0 || (customPassThreshold > 0 && mark.total < customPassThreshold);

  if (failedTotal || failedComponents.length > 0) {
    return {
      letterGrade: 'F',
      gradePoint: 0.0,
      isPassed: false,
      passModeApplied: appliedMode,
      failedComponents,
    };
  }

  return {
    letterGrade: base.letterGrade,
    gradePoint: base.gradePoint,
    isPassed: true,
    passModeApplied: appliedMode,
    failedComponents: [],
  };
};

export const resultService = {
  /**
   * Universal NCTB Exam Result Calculator
   * Accurately supports:
   * 1. 50/75/100 Mark subjects dynamically
   * 2. Joint-pass pairing (Bangla 1st+2nd, English 1st+2nd)
   * 3. 4th Optional subject bonus points (GP > 2.00)
   * 4. Student religion filtering
   */
  calculateStudentResult: (params: {
    examId: string;
    student: {
      id: string;
      roll: string;
      name: string;
      grade?: string;
      gradeBn?: string;
      section?: string;
      branch?: string;
      group?: string;
      optionalSubject?: string;
      religion?: string;
    };
    grade: string;
    branch: string;
    group?: string;
    passMode?: PassEvaluationMode;
    customSubjects?: DynamicClassSubject[];
  }): StudentExamResult | null => {
    const {
      examId,
      student,
      grade,
      branch,
      passMode = 'curriculum',
      customSubjects,
    } = params;
    const isClass9or10 = grade === '9th' || grade === '10th';
    const effectiveGroup = isClass9or10 ? (student.group || params.group || 'বিজ্ঞান') : 'সাধারণ';
    const studentRel = getStudentReligion(student);

    // Get NCTB / dynamic configured subjects for this grade & group
    const configuredSubjects =
      customSubjects && customSubjects.length > 0
        ? customSubjects
        : getActiveCurriculumSubjects(grade, effectiveGroup, student.optionalSubject);
    if (!configuredSubjects || configuredSubjects.length === 0) {
      return null;
    }

    const subjectMarks: Record<string, SubjectMarkEntry> = {};
    let totalObtained = 0;
    let totalFull = 0;
    let mainGPPoints = 0;
    let mainUnitsCount = 0;
    let failedCount = 0;
    let enteredSubjectsCount = 0;
    let expectedSubjectsCount = 0;
    const failedSubjects: string[] = [];
    const pendingSubjectNames: string[] = [];

    const processedCodes = new Set<string>();
    const processedNames = new Set<string>();
    let hasReligionProcessed = false;

    // ─── 4TH / OPTIONAL SUBJECT RESOLUTION PER STUDENT ───
    const rawOpt =
      student.optionalSubject &&
      student.optionalSubject !== 'None' &&
      student.optionalSubject !== 'নাই'
        ? student.optionalSubject.trim()
        : '';

    let effectiveOptName = rawOpt;
    if (!effectiveOptName && isClass9or10) {
      effectiveOptName = effectiveGroup === 'বিজ্ঞান' ? 'উচ্চতর গণিত' : 'কৃষি শিক্ষা';
    } else if (!effectiveOptName && (grade === '8th' || grade === '7th' || grade === '6th')) {
      effectiveOptName = '';
    }

    const OPTIONAL_KEYWORDS = ['কৃষি', 'গার্হস্থ্য', 'উচ্চতর গণিত', 'কম্পিউটার শিক্ষা'];
    const OPTIONAL_CODE_PREFIXES = ['AGR', 'HMS', 'HMT', 'CMP'];

    const isDefaultOptionalSlot = (s: DynamicClassSubject) =>
      s.category === '৪র্থ বিষয়' ||
      OPTIONAL_KEYWORDS.some((kw) => (s.name || '').includes(kw)) ||
      OPTIONAL_CODE_PREFIXES.some((pfx) => (s.code || '').startsWith(pfx));

    // Match student's designated optional subject cleanly
    const isSubjectMatchingOpt = (s: DynamicClassSubject) => {
      if (!effectiveOptName) return false;
      const sName = (s.name || '').trim();
      const sCode = (s.code || '').trim();
      const cleanOpt = effectiveOptName.trim();
      return (
        sName === cleanOpt ||
        sName.includes(cleanOpt) ||
        cleanOpt.includes(sName) ||
        sCode === cleanOpt ||
        (cleanOpt === 'উচ্চতর গণিত' && sCode.startsWith('HMT')) ||
        (cleanOpt === 'কৃষি শিক্ষা' && sCode.startsWith('AGR')) ||
        (cleanOpt === 'জীববিজ্ঞান' && sCode.startsWith('BIO')) ||
        (cleanOpt === 'গার্হস্থ্য বিজ্ঞান' && sCode.startsWith('HMS'))
      );
    };

    // Compulsory subjects exclude both student's optional subject and generic 4th-subject curriculum slots
    const compulsorySubjects = configuredSubjects.filter(
      (s) => !isSubjectMatchingOpt(s) && !(isDefaultOptionalSlot(s) && rawOpt !== 'নাই' && rawOpt !== 'None'),
    );

    const curriculumOptSubject = configuredSubjects.find(
      (s) => isSubjectMatchingOpt(s) || (effectiveOptName && isDefaultOptionalSlot(s)),
    );

    for (let i = 0; i < compulsorySubjects.length; i++) {
      const sub = compulsorySubjects[i];
      if (processedCodes.has(sub.code) || processedNames.has(sub.name)) continue;

      const isRel = isReligionSubject(`${sub.code} ${sub.name}`);
      if (isRel) {
        if (hasReligionProcessed) continue;
        hasReligionProcessed = true;
      }

      // Check Joint Pass Pair (e.g. Bangla 1st + 2nd, English 1st + 2nd)
      const nextSub = compulsorySubjects[i + 1];
      const isJoint = Boolean(
        nextSub &&
          (sub.isJointPass ||
            sub.jointPairCode === nextSub.code ||
            (sub.name.includes('বাংলা ১ম') && (nextSub.name.includes('বাংলা ২য়') || nextSub.name.includes('বাংলা ২য়'))) ||
            (sub.name.includes('ইংরেজি ১ম') && (nextSub.name.includes('ইংরেজি ২য়') || nextSub.name.includes('ইংরেজি ২য়')))),
      );

      if (isJoint && nextSub) {
        const mark1 = getUniversalStudentMark({
          exam: examId,
          grade,
          branch,
          group: effectiveGroup,
          subjectCodeOrName: sub.code || sub.name,
          studentRoll: student.roll,
          studentId: student.id,
          studentName: student.name,
          religion: studentRel,
        });

        const mark2 = getUniversalStudentMark({
          exam: examId,
          grade,
          branch,
          group: effectiveGroup,
          subjectCodeOrName: nextSub.code || nextSub.name,
          studentRoll: student.roll,
          studentId: student.id,
          studentName: student.name,
          religion: studentRel,
        });

        expectedSubjectsCount += 2;
        if (mark1.hasMarks) enteredSubjectsCount += 1;
        else pendingSubjectNames.push(sub.name);

        if (mark2.hasMarks) enteredSubjectsCount += 1;
        else pendingSubjectNames.push(nextSub.name);

        const jointTotal = mark1.total + mark2.total;
        const jointFull = (sub.fullMarks || 100) + (nextSub.fullMarks || 100);
        const evalRes = evaluateSubjectGradeAndPass(
          {
            cq: mark1.cq + mark2.cq,
            mcq: mark1.mcq + mark2.mcq,
            practical: mark1.practical + mark2.practical,
            ca: mark1.ca + mark2.ca,
            total: jointTotal,
          },
          {
            fullMarks: jointFull,
            cq: (Number(sub.cq) || 0) + (Number(nextSub.cq) || 0),
            mcq: (Number(sub.mcq) || 0) + (Number(nextSub.mcq) || 0),
            practical: (Number(sub.practical) || 0) + (Number(nextSub.practical) || 0),
            ca: (Number(sub.ca) || 0) + (Number(nextSub.ca) || 0),
            passRules: sub.passRules || nextSub.passRules,
          },
          passMode,
        );

        if (!evalRes.isPassed) {
          failedCount++;
          failedSubjects.push(`${sub.name} + ${nextSub.name}`);
        }

        subjectMarks[sub.code] = {
          subjectCode: sub.code,
          subjectName: sub.name,
          fullMarks: sub.fullMarks || 100,
          cq: mark1.cq,
          mcq: mark1.mcq,
          practical: mark1.practical,
          ca: mark1.ca,
          totalMarks: mark1.total,
          letterGrade: evalRes.letterGrade,
          gradePoint: evalRes.gradePoint,
          hasMarks: mark1.hasMarks,
          isPassed: evalRes.isPassed,
          passModeApplied: evalRes.passModeApplied,
          failedComponents: evalRes.failedComponents,
          isJointPass: true,
          jointPairCode: nextSub.code,
          jointPairName: nextSub.name,
        };

        subjectMarks[nextSub.code] = {
          subjectCode: nextSub.code,
          subjectName: nextSub.name,
          fullMarks: nextSub.fullMarks || 100,
          cq: mark2.cq,
          mcq: mark2.mcq,
          practical: mark2.practical,
          ca: mark2.ca,
          totalMarks: mark2.total,
          letterGrade: evalRes.letterGrade,
          gradePoint: evalRes.gradePoint,
          hasMarks: mark2.hasMarks,
          isPassed: evalRes.isPassed,
          passModeApplied: evalRes.passModeApplied,
          failedComponents: evalRes.failedComponents,
          isJointPass: true,
          jointPairCode: sub.code,
          jointPairName: sub.name,
        };

        totalObtained += jointTotal;
        totalFull += jointFull;
        mainGPPoints += evalRes.gradePoint;
        mainUnitsCount += 1;

        processedCodes.add(sub.code);
        processedCodes.add(nextSub.code);
        processedNames.add(sub.name);
        processedNames.add(nextSub.name);
      } else {
        const mark = getUniversalStudentMark({
          exam: examId,
          grade,
          branch,
          group: effectiveGroup,
          subjectCodeOrName: sub.code || sub.name,
          studentRoll: student.roll,
          studentId: student.id,
          studentName: student.name,
          religion: studentRel,
        });

        expectedSubjectsCount += 1;
        if (mark.hasMarks) enteredSubjectsCount += 1;
        else pendingSubjectNames.push(sub.name);

        const fullMarks = sub.fullMarks || 100;
        const evalRes = evaluateSubjectGradeAndPass(mark, sub, passMode);

        if (!evalRes.isPassed) {
          failedCount++;
          failedSubjects.push(sub.name);
        }

        subjectMarks[sub.code] = {
          subjectCode: sub.code,
          subjectName: sub.name,
          fullMarks,
          cq: mark.cq,
          mcq: mark.mcq,
          practical: mark.practical,
          ca: mark.ca,
          totalMarks: mark.total,
          letterGrade: evalRes.letterGrade,
          gradePoint: evalRes.gradePoint,
          hasMarks: mark.hasMarks,
          isPassed: evalRes.isPassed,
          passModeApplied: evalRes.passModeApplied,
          failedComponents: evalRes.failedComponents,
        };

        totalObtained += mark.total;
        totalFull += fullMarks;
        mainGPPoints += evalRes.gradePoint;
        mainUnitsCount += 1;

        processedCodes.add(sub.code);
        processedNames.add(sub.name);
      }
    }

    // ─── 4TH / OPTIONAL SUBJECT BONUS (NCTB GP > 2.00 Rule) ───
    let bonusGP = 0;
    let optionalSubjectMark: SubjectMarkEntry | undefined;

    if (effectiveOptName) {
      const optRetrieved = getUniversalStudentMark({
        exam: examId,
        grade,
        branch,
        group: effectiveGroup,
        subjectCodeOrName: curriculumOptSubject?.code || effectiveOptName,
        studentRoll: student.roll,
        studentId: student.id,
        studentName: student.name,
        religion: studentRel,
      });

      const optFullMarks = curriculumOptSubject?.fullMarks || 100;
      const optEval = evaluateSubjectGradeAndPass(
        optRetrieved,
        curriculumOptSubject || {
          fullMarks: optFullMarks,
          cq: optFullMarks,
          mcq: 0,
          practical: 0,
          ca: 0,
        },
        passMode,
      );
      bonusGP = Math.max(0, Number((optEval.gradePoint - 2.00).toFixed(2)));

      optionalSubjectMark = {
        subjectCode: curriculumOptSubject?.code || 'OPT-4TH',
        subjectName: effectiveOptName,
        fullMarks: optFullMarks,
        cq: optRetrieved.cq,
        mcq: optRetrieved.mcq,
        practical: optRetrieved.practical,
        ca: optRetrieved.ca,
        totalMarks: optRetrieved.total,
        letterGrade: optEval.letterGrade,
        gradePoint: optEval.gradePoint,
        hasMarks: optRetrieved.hasMarks,
        isPassed: optEval.isPassed,
        passModeApplied: optEval.passModeApplied,
        failedComponents: optEval.failedComponents,
        isOptional: true,
      };

      totalObtained += optRetrieved.total;
      totalFull += optFullMarks;
    }

    const hasFailed = failedCount > 0;
    const gpaWithout4th = hasFailed || mainUnitsCount === 0 ? 0.0 : Number((mainGPPoints / mainUnitsCount).toFixed(2));
    const finalGPA = hasFailed || mainUnitsCount === 0
      ? 0.0
      : Math.min(5.00, Number(((mainGPPoints + bonusGP) / mainUnitsCount).toFixed(2)));

    const overallGrade = gpaToLetterGrade(finalGPA, hasFailed);
    const obtainedPercentage = totalFull > 0 ? Number(((totalObtained / totalFull) * 100).toFixed(2)) : 0;

    return {
      examId,
      studentId: student.id,
      studentRoll: student.roll,
      studentName: student.name,
      grade,
      branch,
      group: effectiveGroup,
      totalObtainedMarks: totalObtained,
      totalFullMarks: totalFull,
      obtainedPercentage,
      gpaWithout4th,
      bonusGP,
      gpa: finalGPA,
      letterGrade: overallGrade,
      isPassed: !hasFailed,
      failedCount,
      failedSubjects,
      hasIncompleteMarks: pendingSubjectNames.length > 0,
      enteredSubjectsCount,
      expectedSubjectsCount,
      pendingSubjectNames,
      optionalSubjectName: effectiveOptName || undefined,
      subjectMarks,
      optionalSubjectMark,
    };
  },

  /**
   * Backwards compatible legacy resolver
   */
  getResult: (examId: string, studentId: string): StudentExamResult | null => {
    if (typeof window === 'undefined') return null;

    try {
      const storedStudents = localStorage.getItem('sms_students');
      if (storedStudents) {
        const students = JSON.parse(storedStudents);
        const st = students.find((s: any) => s.id === studentId || s.roll === studentId);
        if (st) {
          return resultService.calculateStudentResult({
            examId,
            student: st,
            grade: st.grade || '8th',
            branch: st.section || st.branch || 'A',
            group: st.group || 'সাধারণ'
          });
        }
      }
    } catch (e) {
      console.error('Error in resultService.getResult', e);
    }
    return null;
  },

  /**
   * Save Subject Marks locally & enqueue for offline synchronization
   */
  saveSubjectMarks: (params: {
    examId: string;
    grade: string;
    branch: string;
    group: string;
    subjectName: string;
    subjectCode?: string;
    marks: Array<{
      id?: string;
      studentId?: string;
      roll: string;
      name: string;
      written?: number;
      cq?: number;
      mcq?: number;
      practical?: number;
      ca?: number;
      total: number;
    }>;
    performedBy?: string;
  }): boolean => {
    if (typeof window === 'undefined') return false;
    const { examId, grade, branch, group, subjectName, subjectCode, marks, performedBy } = params;
    const jsonVal = JSON.stringify(marks);

    // Save to primary and normalized storage keys
    const primaryKey = `sms_marks_${examId}_${grade}_${branch}_${group}_${subjectName}`;
    localStorage.setItem(primaryKey, jsonVal);
    if (subjectCode && subjectCode !== subjectName) {
      localStorage.setItem(`sms_marks_${examId}_${grade}_${branch}_${group}_${subjectCode}`, jsonVal);
    }

    // Audit trail log
    auditTrailService.addLog({
      action: 'UPDATE_EXAM_MARKS',
      category: 'MARKS',
      details: `শ্রেণি ${grade} (${branch}) এর বিষয় '${subjectName}' এর নম্বর সংরক্ষণ করা হয়েছে (${marks.length} জন শিক্ষার্থী)`,
      performedBy: performedBy || 'সফটওয়্যার',
      status: 'SUCCESS'
    });

    // Enqueue exam mark batch for offline sync
    const markEntityId = `${examId}-${grade}-${branch}-${subjectCode || subjectName}`;
    syncQueueService.enqueue('exam_mark', markEntityId, 'UPDATE', {
      examId,
      grade,
      branch,
      group,
      subjectName,
      subjectCode,
      marksCount: marks.length,
      marks
    }).catch(() => {});

    return true;
  }
};
