import { describe, it, expect, beforeEach } from 'vitest';

// Polyfill browser localStorage/window for Node Vitest environment
const memStore: Record<string, string> = {};
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => (k in memStore ? memStore[k] : null),
  setItem: (k: string, v: string) => {
    memStore[k] = String(v);
  },
  removeItem: (k: string) => {
    delete memStore[k];
  },
  clear: () => {
    for (const k of Object.keys(memStore)) delete memStore[k];
  },
  get length() {
    return Object.keys(memStore).length;
  },
  key: (i: number) => Object.keys(memStore)[i] ?? null,
};
(globalThis as unknown as { window: unknown }).window = globalThis;

import {
  buildMarksheetQrPayload,
  evaluateClassMarksheetsWithMerit,
  filterMarksheetBatchStudents,
  filterMarksheetDirectory,
  formatMeritPositionBn,
  formatMeritPositionEn,
  generateQrSvgPath,
  normalizeMarksheetRollNumber,
  resolveBranchForGradeAndGroup,
} from '@/lib/marksheetStudioUtils';
import {
  StudentProfile,
  getStudentsForClassSectionGroup,
} from '@/components/OfficialMarksheetSheet';

function makeProfile(overrides: Partial<StudentProfile>): StudentProfile {
  return {
    id: overrides.id || 'st-1',
    roll: overrides.roll || '01',
    name: overrides.name || 'Student',
    grade: overrides.grade || '9th',
    gradeBn: overrides.gradeBn || '৯ম শ্রেণি',
    section: overrides.section || 'Science',
    group: overrides.group || 'বিজ্ঞান',
    fatherName: overrides.fatherName || 'Father',
    motherName: overrides.motherName || 'Mother',
    session: overrides.session || '2026',
    optionalSubject: overrides.optionalSubject || 'উচ্চতর গণিত',
  };
}

describe('marksheetStudioUtils — Auto-Sync Group/Branch, Merit Position, Selective Batch & QR', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('auto-syncs Class 9–10 groups with canonical branches and loads students without section mismatch', () => {
    expect(resolveBranchForGradeAndGroup('9th', 'A', 'বিজ্ঞান')).toEqual({
      normalizedBranch: 'Science',
      normalizedGroupBn: 'বিজ্ঞান',
    });
    expect(resolveBranchForGradeAndGroup('10th', 'A', 'মানবিক')).toEqual({
      normalizedBranch: 'Humanities',
      normalizedGroupBn: 'মানবিক',
    });
    expect(resolveBranchForGradeAndGroup('9th', 'A', 'ব্যবসায় শিক্ষা')).toEqual({
      normalizedBranch: 'Commerce',
      normalizedGroupBn: 'ব্যবসায় শিক্ষা',
    });
    expect(resolveBranchForGradeAndGroup('8th', 'B', 'বিজ্ঞান')).toEqual({
      normalizedBranch: 'B',
      normalizedGroupBn: 'সাধারণ',
    });

    // Store Class 9 students with mixed section/branch formats and Bengali rolls
    localStorage.setItem(
      'sms_students',
      JSON.stringify([
        { id: 's-10', roll: '১০', name: 'সাকিব', grade: '9th', section: 'Science', group: 'বিজ্ঞান' },
        { id: 's-02', roll: '০২', name: 'আরিফ', grade: '9th', section: 'A', group: 'বিজ্ঞান' },
        { id: 'h-01', roll: '০১', name: 'মাহি', grade: '9th', section: 'Humanities', group: 'মানবিক' },
      ]),
    );

    const sciStudents = getStudentsForClassSectionGroup('9th', 'Science', 'বিজ্ঞান');
    // Both 'Science' and legacy 'A' Science students are found and sorted numerically (2 before 10)!
    expect(sciStudents.map((s) => s.id)).toEqual(['s-02', 's-10']);
    expect(sciStudents.every((s) => s.section === 'Science' && s.group === 'বিজ্ঞান')).toBe(true);

    const humStudents = getStudentsForClassSectionGroup('9th', 'Humanities', 'মানবিক');
    expect(humStudents.map((s) => s.id)).toEqual(['h-01']);
  });

  it('computes TRUE Merit Position among passed students and supports all 4 selective batch print modes', () => {
    expect(normalizeMarksheetRollNumber('১৫')).toBe(15);
    expect(formatMeritPositionEn(1)).toBe('1st');
    expect(formatMeritPositionEn(2)).toBe('2nd');
    expect(formatMeritPositionEn(3)).toBe('3rd');
    expect(formatMeritPositionEn(11)).toBe('11th');
    expect(formatMeritPositionEn(21)).toBe('21st');
    expect(formatMeritPositionBn(1)).toBe('১ম');
    expect(formatMeritPositionBn(4)).toBe('৪র্থ');

    const profiles = [
      makeProfile({ id: 'st-01', roll: '০১', name: 'নাফিস' }),
      makeProfile({ id: 'st-05', roll: '০৫', name: 'তাসনিম' }),
      makeProfile({ id: 'st-12', roll: '১২', name: 'রাফি' }),
      makeProfile({ id: 'st-25', roll: '২৫', name: 'মাহিন' }),
    ];

    const fakeMarksById: Record<
      string,
      { totalObtained: number; totalFull: number; gpaWithout4th: number; finalGPA: number; overallGrade: string; hasFailed: boolean }
    > = {
      'st-01': { totalObtained: 620, totalFull: 1200, gpaWithout4th: 0, finalGPA: 0, overallGrade: 'F', hasFailed: true },
      'st-05': { totalObtained: 1040, totalFull: 1200, gpaWithout4th: 4.9, finalGPA: 5.0, overallGrade: 'A+', hasFailed: false },
      'st-12': { totalObtained: 1080, totalFull: 1200, gpaWithout4th: 5.0, finalGPA: 5.0, overallGrade: 'A+', hasFailed: false },
      'st-25': { totalObtained: 880, totalFull: 1200, gpaWithout4th: 4.2, finalGPA: 4.5, overallGrade: 'A', hasFailed: false },
    };

    const evaluated = evaluateClassMarksheetsWithMerit(
      profiles,
      (st) => fakeMarksById[st.id],
      { selectedExam: 'অর্ধ-বার্ষিক পরীক্ষা ২০২৬', selectedGrade: '9th', selectedBranch: 'Science' },
    );

    // Verify TRUE Merit Positions computed strictly among 100% passed students!
    const byId = new Map(evaluated.map((it) => [it.student.id, it]));
    expect(byId.get('st-12')?.meritPosition).toBe(1); // GPA 5.00, w/o 4th 5.00, 1080
    expect(byId.get('st-05')?.meritPosition).toBe(2); // GPA 5.00, w/o 4th 4.90, 1040
    expect(byId.get('st-25')?.meritPosition).toBe(3); // GPA 4.50
    expect(byId.get('st-01')?.meritPosition).toBeNull(); // Failed -> NEVER receives merit position

    // Directory search by ASCII roll "12" finds Bengali roll "১২" and preserves meritPosition = 1
    const dirSearch = filterMarksheetDirectory(evaluated, { searchQuery: '12', statusFilter: 'all' });
    expect(dirSearch).toHaveLength(1);
    expect(dirSearch[0].student.id).toBe('st-12');
    expect(dirSearch[0].meritPosition).toBe(1);

    // Batch Mode 1: Selected only
    expect(
      filterMarksheetBatchStudents(evaluated, { mode: 'selected', selectedIds: ['st-05', 'st-25'] }).map(
        (i) => i.student.id,
      ),
    ).toEqual(['st-05', 'st-25']);

    // Batch Mode 2: Passed only
    expect(
      filterMarksheetBatchStudents(evaluated, { mode: 'passed_only', selectedIds: [] }).map(
        (i) => i.student.id,
      ),
    ).toEqual(['st-05', 'st-12', 'st-25']);

    // Batch Mode 3: Roll Range (Bangla numerals ১ to ১৫ -> rolls 1, 5, 12)
    expect(
      filterMarksheetBatchStudents(evaluated, {
        mode: 'roll_range',
        selectedIds: [],
        rollFrom: '১',
        rollTo: '১৫',
      }).map((i) => i.student.id),
    ).toEqual(['st-01', 'st-05', 'st-12']);

    // Batch Mode 4: Full class
    expect(
      filterMarksheetBatchStudents(evaluated, { mode: 'all', selectedIds: [] }),
    ).toHaveLength(4);
  });

  it('generates synchronous vector QR code SVG paths for immediate print', () => {
    const payload = buildMarksheetQrPayload({
      eiin: '106285',
      examName: 'Annual Examination 2026',
      grade: '9th',
      roll: '০৫',
      studentName: 'Tasnim Akter',
      gpa: '5.00',
      gradeLetter: 'A+',
      meritPosition: 1,
    });
    expect(payload).toContain('EIIN:106285');
    expect(payload).toContain('ROLL:05');
    expect(payload).toContain('MERIT:1st');

    const qrSvg = generateQrSvgPath(payload);
    expect(qrSvg).not.toBeNull();
    expect(qrSvg!.size).toBeGreaterThanOrEqual(21);
    expect(qrSvg!.path.length).toBeGreaterThan(100);
  });
});
