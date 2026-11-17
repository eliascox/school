import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildAllSubjectsSummary,
  buildClassSectionSummary,
  buildFailList,
  buildSubjectWiseReport,
  getPopulatedCohorts,
  sortStudentResults,
  TieBreakerRule,
} from '../src/lib/resultAnalyticsEngine';
import { buildResultWorkbook } from '../src/lib/resultExcelExport';
import { DynamicClassSubject } from '../src/lib/curriculumUtils';
import { resultService, StudentExamResult } from '../src/services/resultService';
import { Student } from '../src/services/studentService';

function setupMockStorage(): Record<string, string> {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
  (globalThis as any).window = {
    localStorage: (globalThis as any).localStorage,
    dispatchEvent: () => true,
  };
  return store;
}

describe('SchoolPro Result Analytics Engine & Reports Suite', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = setupMockStorage();
  });

  it('avoids 4th-subject double counting and tracks incomplete/pending subjects accurately', () => {
    const customSubjects: DynamicClassSubject[] = [
      { code: 'BAN-101', name: 'বাংলা ১ম পত্র', fullMarks: 100, cq: 70, mcq: 30, practical: 0, ca: 0, category: 'আবশ্যিক', group: 'সাধারণ' },
      { code: 'MAT-109', name: 'সাধারণ গণিত', fullMarks: 100, cq: 70, mcq: 30, practical: 0, ca: 0, category: 'আবশ্যিক', group: 'সাধারণ' },
      { code: 'HMT-126', name: 'উচ্চতর গণিত', fullMarks: 100, cq: 50, mcq: 25, practical: 25, ca: 0, category: '৪র্থ বিষয়', group: 'বিজ্ঞান' },
    ];

    store['sms_marks_ex1_9th_Science_বিজ্ঞান_BAN-101'] = JSON.stringify([
      { roll: '01', cq: 55, mcq: 25, total: 80 },
    ]);
    // MAT-109 intentionally unentered -> pending!
    store['sms_marks_ex1_9th_Science_বিজ্ঞান_HMT-126'] = JSON.stringify([
      { roll: '01', cq: 45, mcq: 20, practical: 20, total: 85 },
    ]);

    const res = resultService.calculateStudentResult({
      examId: 'ex1',
      student: {
        id: 'ST-901',
        roll: '01',
        name: 'রাফি আহমেদ',
        grade: '9th',
        section: 'Science',
        group: 'বিজ্ঞান',
        optionalSubject: 'উচ্চতর গণিত',
      },
      grade: '9th',
      branch: 'Science',
      group: 'বিজ্ঞান',
      customSubjects,
    });

    expect(res).not.toBeNull();
    // Compulsory (200) + Optional (100) = 300 max (never 400 double-counted)
    expect(res!.totalFullMarks).toBe(300);
    expect(res!.totalObtainedMarks).toBe(165);
    expect(res!.hasIncompleteMarks).toBe(true);
    expect(res!.enteredSubjectsCount).toBe(1);
    expect(res!.expectedSubjectsCount).toBe(2);
    expect(res!.pendingSubjectNames).toEqual(['সাধারণ গণিত']);
    expect(res!.bonusGP).toBe(3.0);
  });

  it('handles subject code "0" without PHP-style falsy crashes in Subject-Wise & Heatmap reports', () => {
    const subjects: DynamicClassSubject[] = [
      { code: '0', name: 'General Science', fullMarks: 100, cq: 70, mcq: 30, practical: 0, ca: 0, category: 'আবশ্যিক', group: 'সাধারণ' },
      { code: '101', name: 'Bangla 1st', fullMarks: 100, cq: 100, mcq: 0, practical: 0, ca: 0, category: 'আবশ্যিক', group: 'সাধারণ' },
    ];

    const students: Student[] = [
      { id: 's1', roll: '01', name: 'Rahim', grade: '6th', section: 'A', group: 'সাধারণ', gender: 'Male' },
      { id: 's2', roll: '02', name: 'Karim', grade: '6th', section: 'A', group: 'সাধারণ', gender: 'Male' },
    ];

    store['sms_marks_ex1_6th_A_সাধারণ_0'] = JSON.stringify([
      { roll: '01', cq: 60, mcq: 22, total: 82 },
      { roll: '02', cq: 18, mcq: 8, total: 26 },
    ]);

    const subReport = buildSubjectWiseReport({
      examId: 'ex1',
      grade: '6th',
      branch: 'A',
      group: 'সাধারণ',
      subject: subjects[0],
      students,
      passMode: 'total',
    });

    expect(subReport.appearedCount).toBe(2);
    expect(subReport.passedCount).toBe(1);
    expect(subReport.failedCount).toBe(1);
    expect(subReport.passRate).toBe(50.0);
    expect(subReport.highestMarks).toBe(82);
    expect(subReport.lowestMarks).toBe(26);
    expect(subReport.rows[1].deficit).toBe(7); // 33 - 26

    const heatmap = buildAllSubjectsSummary({
      examId: 'ex1',
      grade: '6th',
      branch: 'A',
      group: 'সাধারণ',
      subjects,
      students,
      passMode: 'total',
    });

    expect(heatmap.totalSubjects).toBe(2);
    expect(heatmap.rows[0].subject.code).toBe('0');
    expect(heatmap.rows[0].presentCount).toBe(2);
    expect(heatmap.rows[0].tier).toBe('moderate'); // 50%
    expect(heatmap.rows[1].pendingCount).toBe(2);
  });

  it('sorts merit rankings using configurable tie-breaker rules and filters fail thresholds cleanly', () => {
    const mockResults: StudentExamResult[] = [
      {
        examId: 'ex1',
        studentId: 'A',
        studentRoll: '02',
        studentName: 'Student A',
        grade: '8th',
        branch: 'A',
        group: 'সাধারণ',
        totalObtainedMarks: 620,
        totalFullMarks: 700,
        gpaWithout4th: 4.8,
        bonusGP: 0.2,
        gpa: 5.0,
        letterGrade: 'A+',
        isPassed: true,
        failedCount: 0,
        failedSubjects: [],
        enteredSubjectsCount: 7,
        expectedSubjectsCount: 7,
        subjectMarks: {},
      },
      {
        examId: 'ex1',
        studentId: 'B',
        studentRoll: '01',
        studentName: 'Student B',
        grade: '8th',
        branch: 'A',
        group: 'সাধারণ',
        totalObtainedMarks: 645,
        totalFullMarks: 700,
        gpaWithout4th: 5.0,
        bonusGP: 0.0,
        gpa: 5.0,
        letterGrade: 'A+',
        isPassed: true,
        failedCount: 0,
        failedSubjects: [],
        enteredSubjectsCount: 7,
        expectedSubjectsCount: 7,
        subjectMarks: {},
      },
      {
        examId: 'ex1',
        studentId: 'C',
        studentRoll: '03',
        studentName: 'Student C',
        grade: '8th',
        branch: 'A',
        group: 'সাধারণ',
        totalObtainedMarks: 250,
        totalFullMarks: 700,
        gpaWithout4th: 0,
        bonusGP: 0,
        gpa: 0,
        letterGrade: 'F',
        isPassed: false,
        failedCount: 2,
        failedSubjects: ['গণিত', 'ইংরেজি ১ম পত্র'],
        enteredSubjectsCount: 7,
        expectedSubjectsCount: 7,
        subjectMarks: {
          MTH: {
            subjectCode: 'MTH',
            subjectName: 'গণিত',
            fullMarks: 100,
            totalMarks: 21,
            letterGrade: 'F',
            gradePoint: 0,
            hasMarks: true,
            isPassed: false,
          },
          ENG: {
            subjectCode: 'ENG',
            subjectName: 'ইংরেজি ১ম পত্র',
            fullMarks: 100,
            totalMarks: 28,
            letterGrade: 'F',
            gradePoint: 0,
            hasMarks: true,
            isPassed: false,
          },
        },
      },
    ];

    const ranked = sortStudentResults(mockResults);
    expect(ranked[0].studentId).toBe('B'); // Higher total marks breaks 5.00 GPA tie
    expect(ranked[1].studentId).toBe('A');
    expect(ranked[2].studentId).toBe('C');

    // Flip roll first priority when GPA & totalMarks disabled
    const rollFirst: TieBreakerRule[] = [
      { key: 'roll', labelBn: 'রোল', labelEn: 'Roll', directionBn: '', directionEn: '', enabled: true },
      { key: 'gpa', labelBn: 'GPA', labelEn: 'GPA', directionBn: '', directionEn: '', enabled: false },
      { key: 'totalMarks', labelBn: 'মোট', labelEn: 'Total', directionBn: '', directionEn: '', enabled: false },
      { key: 'failedCount', labelBn: 'ফেল', labelEn: 'Fail', directionBn: '', directionEn: '', enabled: true },
      { key: 'gpaWithout4th', labelBn: '৪র্থ ছাড়া', labelEn: 'No 4th', directionBn: '', directionEn: '', enabled: false },
    ];
    const rankedByRoll = sortStudentResults(mockResults, rollFirst);
    expect(rankedByRoll[0].studentId).toBe('B'); // roll 01

    const failAtLeast2 = buildFailList(ranked, 2);
    expect(failAtLeast2).toHaveLength(1);
    expect(failAtLeast2[0].failedDetails.map((d) => d.deficit)).toEqual([12, 5]); // 33-21, 33-28

    const summary = buildClassSectionSummary(ranked);
    expect(summary).toHaveLength(1);
    expect(summary[0].passedCount).toBe(2);
    expect(summary[0].failedCount).toBe(1);
    expect(summary[0].passRate).toBe(66.7);

    // Verify XLSX workbook structure builds cleanly
    const wb = buildResultWorkbook({
      view: 'fail_list',
      examTitle: 'Half-Yearly 2026',
      gradeLabel: 'Class 8',
      sectionLabel: 'Section A',
      settings: { schoolName: 'Test High School', eiin: '100200' },
      subjects: [],
      rankedResults: ranked,
      failEntries: failAtLeast2,
      classSummaryRows: summary,
      subjectWiseReport: null,
      allSubjectsSummary: {
        totalStudents: 3,
        totalSubjects: 2,
        avgAttendanceRate: 100,
        avgPassRate: 66.7,
        strongestSubject: null,
        weakestSubject: null,
        rows: [],
      },
    });
    expect(wb.SheetNames).toEqual(['Report_Info', 'Fail_Analysis']);
  });

  it('discovers populated cohorts and grade counts accurately for smart default selection', () => {
    const students: Student[] = [
      { id: '1', roll: '01', name: 'Nusrat', grade: '6th', section: 'A', group: 'সাধারণ' },
      { id: '2', roll: '02', name: 'Karim', grade: '6th', section: 'A', group: 'সাধারণ' },
      { id: '3', roll: '01', name: 'Tariq', grade: '9th', section: 'Science', group: 'বিজ্ঞান' },
    ];
    const meta = getPopulatedCohorts(students);
    expect(meta.gradeCounts['6th']).toBe(2);
    expect(meta.gradeCounts['9th']).toBe(1);
    expect(meta.gradeCounts['8th']).toBe(0);
    expect(meta.cohorts).toEqual([
      { grade: '6th', branch: 'A', group: 'সাধারণ', count: 2 },
      { grade: '9th', branch: 'Science', group: 'বিজ্ঞান', count: 1 },
    ]);
  });
});
