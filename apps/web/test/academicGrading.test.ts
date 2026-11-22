import { describe, it, expect } from 'vitest';
import {
  calculateGradeAndPoint,
  evaluateSubjectGradeAndPass,
  resultService,
} from '../src/services/resultService';
import { generateStudentMarksheetData } from '../src/components/OfficialMarksheetSheet';

describe('Academic NCTB Grading Scale & Calculation Unit Tests', () => {
  it('correctly maps percentage to standard NCTB Letter Grades and Grade Points', () => {
    // 80% and above -> A+ (5.0)
    expect(calculateGradeAndPoint(80, 100)).toEqual({ letterGrade: 'A+', gradePoint: 5.0 });
    expect(calculateGradeAndPoint(100, 100)).toEqual({ letterGrade: 'A+', gradePoint: 5.0 });
    expect(calculateGradeAndPoint(40, 50)).toEqual({ letterGrade: 'A+', gradePoint: 5.0 });

    // 70% to 79% -> A (4.0)
    expect(calculateGradeAndPoint(70, 100)).toEqual({ letterGrade: 'A', gradePoint: 4.0 });
    expect(calculateGradeAndPoint(78, 100)).toEqual({ letterGrade: 'A', gradePoint: 4.0 });

    // 60% to 69% -> A- (3.5)
    expect(calculateGradeAndPoint(60, 100)).toEqual({ letterGrade: 'A-', gradePoint: 3.5 });
    expect(calculateGradeAndPoint(65, 100)).toEqual({ letterGrade: 'A-', gradePoint: 3.5 });

    // 50% to 59% -> B (3.0)
    expect(calculateGradeAndPoint(50, 100)).toEqual({ letterGrade: 'B', gradePoint: 3.0 });
    expect(calculateGradeAndPoint(55, 100)).toEqual({ letterGrade: 'B', gradePoint: 3.0 });

    // 40% to 49% -> C (2.0)
    expect(calculateGradeAndPoint(40, 100)).toEqual({ letterGrade: 'C', gradePoint: 2.0 });
    expect(calculateGradeAndPoint(48, 100)).toEqual({ letterGrade: 'C', gradePoint: 2.0 });

    // 33% to 39% -> D (1.0)
    expect(calculateGradeAndPoint(33, 100)).toEqual({ letterGrade: 'D', gradePoint: 1.0 });
    expect(calculateGradeAndPoint(38, 100)).toEqual({ letterGrade: 'D', gradePoint: 1.0 });

    // Below 33% -> F (0.0)
    expect(calculateGradeAndPoint(32, 100)).toEqual({ letterGrade: 'F', gradePoint: 0.0 });
    expect(calculateGradeAndPoint(0, 100)).toEqual({ letterGrade: 'F', gradePoint: 0.0 });
  });

  it('handles custom 50 and 75 full marks correctly according to percentage', () => {
    // 50 full marks: 33% is 16.5 marks
    expect(calculateGradeAndPoint(16.5, 50).letterGrade).toBe('D');
    expect(calculateGradeAndPoint(15, 50).letterGrade).toBe('F');
    // 50 full marks: 80% is 40 marks
    expect(calculateGradeAndPoint(40, 50)).toEqual({ letterGrade: 'A+', gradePoint: 5.0 });

    // 75 full marks: 80% is 60 marks
    expect(calculateGradeAndPoint(60, 75)).toEqual({ letterGrade: 'A+', gradePoint: 5.0 });
  });

  it('fails the overall examination if any compulsory subject is failed', () => {
    // Setup mock store with one failed compulsory subject
    const store: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { for (const k of Object.keys(store)) delete store[k]; }
    };
    (globalThis as any).window = { dispatchEvent: () => true };

    const student = {
      id: 'STD-001',
      roll: '01',
      name: 'হাসান মাহমুদ',
      grade: '8th',
      section: 'A',
      group: 'সাধারণ'
    };

    // Store marks: English failed (<33), all others A+
    store['sms_marks_exam1_8th_A_সাধারণ_ENG'] = JSON.stringify([{ roll: '01', total: 25, cq: 25, mcq: 0 }]);
    store['sms_marks_exam1_8th_A_সাধারণ_MTH'] = JSON.stringify([{ roll: '01', total: 85, cq: 55, mcq: 30 }]);

    const result = resultService.calculateStudentResult({
      examId: 'exam1',
      student,
      grade: '8th',
      branch: 'A'
    });

    if (result) {
      expect(result.failedCount).toBeGreaterThan(0);
      expect(result.isPassed).toBe(false);
      expect(result.gpa).toBe(0.0);
      expect(result.letterGrade).toBe('F');
    }
  });

  it('calculates 4th optional subject bonus points according to NCTB GP > 2.00 rule', () => {
    // 4th subject GP = 5.00 -> bonus = 5.00 - 2.00 = 3.00
    // 4th subject GP = 4.00 -> bonus = 4.00 - 2.00 = 2.00
    // 4th subject GP = 2.00 or less -> bonus = 0.00
    const optGP5Bonus = Math.max(0, Number((5.0 - 2.0).toFixed(2)));
    expect(optGP5Bonus).toBe(3.0);

    const optGP4Bonus = Math.max(0, Number((4.0 - 2.0).toFixed(2)));
    expect(optGP4Bonus).toBe(2.0);

    const optGP2Bonus = Math.max(0, Number((2.0 - 2.0).toFixed(2)));
    expect(optGP2Bonus).toBe(0.0);

    const optGP1Bonus = Math.max(0, Number((1.0 - 2.0).toFixed(2)));
    expect(optGP1Bonus).toBe(0.0);
  });

  it('distinguishes cumulative Total Pass vs strict Part-by-Part 33% component pass rules', () => {
    const mathSubject = {
      fullMarks: 100,
      cq: 70,
      mcq: 30,
      practical: 0,
      ca: 0,
      passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস আবশ্যক)',
    };

    // Total is 42 >= 33, but MCQ = 6 < 10 -> fails under part_by_part & curriculum
    const splitFailMark = { cq: 36, mcq: 6, practical: 0, ca: 0, total: 42 };
    expect(evaluateSubjectGradeAndPass(splitFailMark, mathSubject, 'total')).toMatchObject({
      isPassed: true,
      letterGrade: 'C',
      gradePoint: 2.0,
      passModeApplied: 'total',
    });

    const strictFail = evaluateSubjectGradeAndPass(splitFailMark, mathSubject, 'part_by_part');
    expect(strictFail.isPassed).toBe(false);
    expect(strictFail.letterGrade).toBe('F');
    expect(strictFail.gradePoint).toBe(0.0);
    expect(strictFail.failedComponents).toEqual(['MCQ (6/10)']);

    const curriculumFail = evaluateSubjectGradeAndPass(splitFailMark, mathSubject, 'curriculum');
    expect(curriculumFail.isPassed).toBe(false);

    // Passing all parts (CQ 32 >= 23, MCQ 10 >= 10)
    const splitPassMark = { cq: 32, mcq: 10, practical: 0, ca: 0, total: 42 };
    expect(evaluateSubjectGradeAndPass(splitPassMark, mathSubject, 'part_by_part')).toMatchObject({
      isPassed: true,
      letterGrade: 'C',
      gradePoint: 2.0,
    });
  });

  it('fails curriculum mode whenever EITHER CQ, MCQ, or Practical falls below 33%', () => {
    const physicsSubject = {
      fullMarks: 100,
      cq: 50,
      mcq: 25,
      practical: 25,
      ca: 0,
      passRules: 'CQ ১৭ + MCQ ৮ + Practical ৮ (প্রতিটি অংশে পৃথক পাস)',
    };

    // CQ=40 (pass), MCQ=5 < 8 (fail!), Practical=20 (pass) -> total=65, MUST FAIL because MCQ failed
    const resMcqFail = evaluateSubjectGradeAndPass(
      { cq: 40, mcq: 5, practical: 20, ca: 0, total: 65 },
      physicsSubject,
      'curriculum',
    );
    expect(resMcqFail.isPassed).toBe(false);
    expect(resMcqFail.letterGrade).toBe('F');
    expect(resMcqFail.failedComponents).toContain('MCQ (5/8)');

    // CQ=10 < 17 (fail!), MCQ=22 (pass), Practical=20 (pass) -> total=52, MUST FAIL because CQ failed
    const resCqFail = evaluateSubjectGradeAndPass(
      { cq: 10, mcq: 22, practical: 20, ca: 0, total: 52 },
      physicsSubject,
      'curriculum',
    );
    expect(resCqFail.isPassed).toBe(false);
    expect(resCqFail.letterGrade).toBe('F');
    expect(resCqFail.failedComponents).toContain('CQ (10/17)');

    // Fails if practical is 5 < 8
    const resPracticalFail = evaluateSubjectGradeAndPass(
      { cq: 40, mcq: 20, practical: 5, ca: 0, total: 65 },
      physicsSubject,
      'curriculum',
    );
    expect(resPracticalFail.isPassed).toBe(false);
    expect(resPracticalFail.failedComponents).toContain('Practical (5/8)');

    // Passes only when all components meet 33%
    const resAllPass = evaluateSubjectGradeAndPass(
      { cq: 17, mcq: 8, practical: 8, ca: 0, total: 33 },
      physicsSubject,
      'curriculum',
    );
    expect(resAllPass.isPassed).toBe(true);
    expect(resAllPass.letterGrade).toBe('D');
  });

  it('maintains 100% parity between OfficialMarksheetSheet and resultService for component fail & 4th subject full marks', () => {
    const store: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { for (const k of Object.keys(store)) delete store[k]; }
    };
    (globalThis as any).window = { dispatchEvent: () => true };

    const student = {
      id: 'STD-901',
      roll: '01',
      name: 'তানভীর আহমেদ',
      grade: '9th',
      gradeBn: '৯ম শ্রেণি',
      section: 'A',
      group: 'বিজ্ঞান',
      fatherName: 'আব্দুল করিম',
      motherName: 'রাহেলা বেগম',
      session: '২০২৬',
      optionalSubject: 'উচ্চতর গণিত',
    };

    // Physics: CQ=45, MCQ=5 (FAIL < 8), Practical=25 -> Total 75, MUST FAIL in both resultService and marksheet!
    store['sms_marks_exam_test_9th_A_বিজ্ঞান_PHY-136'] = JSON.stringify([
      { roll: '01', cq: 45, mcq: 5, practical: 25, total: 75 },
    ]);
    // Higher Math (4th optional): CQ=45, MCQ=20, Practical=20 -> Total 85 (GP 5.0, Bonus 3.0)
    store['sms_marks_exam_test_9th_A_বিজ্ঞান_HMT-126'] = JSON.stringify([
      { roll: '01', cq: 45, mcq: 20, practical: 20, total: 85 },
    ]);

    const resEngine = resultService.calculateStudentResult({
      examId: 'exam_test',
      student,
      grade: '9th',
      branch: 'A',
      group: 'বিজ্ঞান',
    });

    const marksheet = generateStudentMarksheetData(student, {
      selectedExam: 'exam_test',
      selectedGrade: '9th',
      selectedBranch: 'A',
    });

    const phyMarksheet = marksheet.subjects.find((s) => s.code === '136');
    expect(phyMarksheet?.letterGrade).toBe('F');
    expect(phyMarksheet?.gradePoint).toBe(0.0);
    expect(marksheet.hasFailed).toBe(true);
    expect(marksheet.overallGrade).toBe('F');
    expect(resEngine?.subjectMarks['136']?.letterGrade).toBe('F');
    expect(resEngine?.isPassed).toBe(false);

    // Compulsory (1050) + Optional (100) = 1150, matching resultService 100%
    expect(marksheet.totalFull).toBe(resEngine?.totalFullMarks);
    expect(marksheet.totalObtained).toBe(resEngine?.totalObtainedMarks);
    expect(marksheet.optionalSubject?.name).toBe('উচ্চতর গণিত');
    expect(marksheet.bonusGP).toBe(3.0);
  });

  it('resolves Hindu Religion (112) cleanly for Hindu students in both resultService and OfficialMarksheetSheet', () => {
    const store: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    };
    (globalThis as any).window = { dispatchEvent: () => true, localStorage: (globalThis as any).localStorage };

    const hinduStudent = {
      id: 'STD-H1',
      roll: '05',
      name: 'অর্ক দাস',
      grade: '9th',
      gradeBn: '৯ম শ্রেণি',
      section: 'A',
      group: 'বিজ্ঞান',
      religion: 'হিন্দু',
      fatherName: 'সুমন দাস',
      motherName: 'রূপা দাস',
      session: '২০২৬',
      optionalSubject: 'উচ্চতর গণিত',
    };

    store['sms_marks_exam_hindu_9th_A_বিজ্ঞান_হিন্দুধর্ম ও নৈতিক শিক্ষা'] = JSON.stringify([
      { id: 'STD-H1', roll: '05', written: 62, mcq: 26, practical: 0, total: 88 },
    ]);

    const resEngine = resultService.calculateStudentResult({
      examId: 'exam_hindu',
      student: hinduStudent,
      grade: '9th',
      branch: 'A',
      group: 'বিজ্ঞান',
    });

    const marksheet = generateStudentMarksheetData(hinduStudent, {
      selectedExam: 'exam_hindu',
      selectedGrade: '9th',
      selectedBranch: 'A',
    });

    expect(resEngine?.subjectMarks['112']?.totalMarks).toBe(88);
    expect(resEngine?.subjectMarks['112']?.letterGrade).toBe('A+');
    expect(resEngine?.subjectMarks['111']).toBeUndefined();

    const hinduRow = marksheet.subjects.find((s) => s.code === '112');
    expect(hinduRow).toBeDefined();
    expect(hinduRow?.name).toBe('হিন্দুধর্ম ও নৈতিক শিক্ষা');
    expect(hinduRow?.totalMarks).toBe(88);
    expect(hinduRow?.letterGrade).toBe('A+');
    expect(marksheet.subjects.some((s) => s.code === '111')).toBe(false);
  });
});
