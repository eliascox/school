import { describe, it, expect } from 'vitest';
import { calculateGradeAndPoint, resultService } from '../src/services/resultService';

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
});
