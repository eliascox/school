import { getActiveCurriculumSubjects, DynamicClassSubject } from '@/lib/curriculumUtils';
import { getUniversalStudentMark } from '@/lib/markStorageUtils';
import { getStudentReligion, isReligionSubject, ReligionType } from '@/lib/religionUtils';
import { auditTrailService } from './auditTrailService';
import { syncQueueService } from './syncQueueService';

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
  gpaWithout4th: number;
  bonusGP: number;
  gpa: number;
  letterGrade: string;
  isPassed: boolean;
  failedCount: number;
  failedSubjects: string[];
  rank?: number;
  subjectMarks: Record<string, SubjectMarkEntry>;
  optionalSubjectMark?: SubjectMarkEntry;
}

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
  }): StudentExamResult | null => {
    const { examId, student, grade, branch } = params;
    const isClass9or10 = grade === '9th' || grade === '10th';
    const effectiveGroup = isClass9or10 ? (student.group || params.group || 'বিজ্ঞান') : 'সাধারণ';
    const studentRel = getStudentReligion(student);

    // Get NCTB / dynamic configured subjects for this grade & group
    const configuredSubjects = getActiveCurriculumSubjects(grade, effectiveGroup);
    if (!configuredSubjects || configuredSubjects.length === 0) {
      return null;
    }

    const subjectMarks: Record<string, SubjectMarkEntry> = {};
    let totalObtained = 0;
    let totalFull = 0;
    let mainGPPoints = 0;
    let mainUnitsCount = 0;
    let failedCount = 0;
    const failedSubjects: string[] = [];

    const processedCodes = new Set<string>();
    const processedNames = new Set<string>();
    let hasReligionProcessed = false;

    // ─── 4TH / OPTIONAL SUBJECT RESOLUTION PER STUDENT ───
    const rawOpt = student.optionalSubject && student.optionalSubject !== 'None' && student.optionalSubject !== 'নাই'
      ? student.optionalSubject.trim()
      : '';

    let effectiveOptName = rawOpt;
    if (!effectiveOptName && isClass9or10) {
      effectiveOptName = effectiveGroup === 'বিজ্ঞান' ? 'উচ্চতর গণিত' : 'কৃষি শিক্ষা';
    } else if (!effectiveOptName && (grade === '8th' || grade === '7th' || grade === '6th')) {
      effectiveOptName = '';
    }

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

    // Compulsory subjects = All configured subjects EXCEPT the student's designated 4th subject
    const compulsorySubjects = configuredSubjects.filter(s => !isSubjectMatchingOpt(s));

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
        sub.isJointPass ||
        (nextSub && (
          (sub.name.includes('বাংলা ১ম') && nextSub.name.includes('বাংলা ২য়')) ||
          (sub.name.includes('বাংলা ১ম') && nextSub.name.includes('বাংলা ২য়')) ||
          (sub.name.includes('ইংরেজি ১ম') && nextSub.name.includes('ইংরেজি ২য়')) ||
          (sub.name.includes('ইংরেজি ১ম') && nextSub.name.includes('ইংরেজি ২য়'))
        ))
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
          religion: studentRel
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
          religion: studentRel
        });

        const jointTotal = mark1.total + mark2.total;
        const jointFull = (sub.fullMarks || 100) + (nextSub.fullMarks || 100);
        const { letterGrade, gradePoint } = calculateGradeAndPoint(jointTotal, jointFull);

        if (gradePoint === 0) {
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
          letterGrade,
          gradePoint,
          isJointPass: true,
          jointPairCode: nextSub.code,
          jointPairName: nextSub.name
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
          letterGrade,
          gradePoint,
          isJointPass: true,
          jointPairCode: sub.code,
          jointPairName: sub.name
        };

        totalObtained += jointTotal;
        totalFull += jointFull;
        mainGPPoints += gradePoint;
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
          religion: studentRel
        });

        const fullMarks = sub.fullMarks || 100;
        const { letterGrade, gradePoint } = calculateGradeAndPoint(mark.total, fullMarks);

        if (gradePoint === 0) {
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
          letterGrade,
          gradePoint
        };

        totalObtained += mark.total;
        totalFull += fullMarks;
        mainGPPoints += gradePoint;
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
        subjectCodeOrName: effectiveOptName,
        studentRoll: student.roll,
        studentId: student.id,
        studentName: student.name,
        religion: studentRel
      });

      const optFullMarks = 100;
      const optResult = calculateGradeAndPoint(optRetrieved.total, optFullMarks);
      bonusGP = Math.max(0, Number((optResult.gradePoint - 2.00).toFixed(2)));

      optionalSubjectMark = {
        subjectCode: 'OPT-4TH',
        subjectName: effectiveOptName,
        fullMarks: optFullMarks,
        cq: optRetrieved.cq,
        mcq: optRetrieved.mcq,
        practical: optRetrieved.practical,
        ca: optRetrieved.ca,
        totalMarks: optRetrieved.total,
        letterGrade: optResult.letterGrade,
        gradePoint: optResult.gradePoint,
        isOptional: true
      };

      totalObtained += optRetrieved.total;
      totalFull += optFullMarks;
    }

    const hasFailed = failedCount > 0;
    const gpaWithout4th = hasFailed || mainUnitsCount === 0 ? 0.0 : Number((mainGPPoints / mainUnitsCount).toFixed(2));
    const finalGPA = hasFailed || mainUnitsCount === 0
      ? 0.0
      : Math.min(5.00, Number(((mainGPPoints + bonusGP) / mainUnitsCount).toFixed(2)));

    const overallGrade = hasFailed
      ? 'F'
      : finalGPA >= 5.0
      ? 'A+'
      : finalGPA >= 4.0
      ? 'A'
      : finalGPA >= 3.5
      ? 'A-'
      : finalGPA >= 3.0
      ? 'B'
      : finalGPA >= 2.0
      ? 'C'
      : 'D';

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
      gpaWithout4th,
      bonusGP,
      gpa: finalGPA,
      letterGrade: overallGrade,
      isPassed: !hasFailed,
      failedCount,
      failedSubjects,
      subjectMarks,
      optionalSubjectMark
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
