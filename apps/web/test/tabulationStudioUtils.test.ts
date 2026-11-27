import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TABULATION_COLUMNS,
  TABULATION_PAPER_SPECS,
  assignTabulationMeritPositions,
  buildSampleTabulationRows,
  buildTabulationExcelRows,
  computeTabulationSummary,
  filterTabulationStudents,
  formatTabulationSubjectName,
  getTabulationDocLabels,
} from '../src/lib/tabulationStudioUtils';
import type { Student } from '../src/services/studentService';

describe('tabulationStudioUtils — Phase 3 Master Tabulation Sheet Studio', () => {
  it('REGRESSION: includes Class 9-10 students regardless of whether raw section is "A" or "Science"', () => {
    const mockStudents = [
      { id: 'c9-1', roll: '12', name: 'রাফি', grade: '9th', section: 'A', group: 'বিজ্ঞান', religion: 'ইসলাম' },
      { id: 'c9-2', roll: '2', name: 'সাদিয়া', grade: '৯ম শ্রেণি', section: 'Science', group: 'Science', religion: 'ইসলাম' },
      { id: 'c9-3', roll: '1', name: 'করিম', grade: '9th', section: 'A', group: 'মানবিক', religion: 'ইসলাম' },
      { id: 'c8-1', roll: '5', name: 'মীম', grade: '8th', section: 'A', group: 'সাধারণ', religion: 'হিন্দু' },
      { id: 'c8-2', roll: '6', name: 'সাকিব', grade: '8th', section: 'B', group: 'সাধারণ', religion: 'ইসলাম' },
    ] as unknown as Student[];

    // Previously the legacy filter rejected c9-1 because section='A' !== selectedBranch='Science'
    const sci9 = filterTabulationStudents({
      allStudents: mockStudents,
      grade: '9th',
      section: 'Science',
      groupBn: 'বিজ্ঞান',
    });
    expect(sci9.map((s) => s.id)).toEqual(['c9-2', 'c9-1']); // roll 2 then roll 12

    const hum9 = filterTabulationStudents({
      allStudents: mockStudents,
      grade: '9th',
      section: 'Humanities',
      groupBn: 'মানবিক',
    });
    expect(hum9.map((s) => s.id)).toEqual(['c9-3']);

    // Class 8 still separates Section A vs B cleanly
    const sec8A = filterTabulationStudents({
      allStudents: mockStudents,
      grade: '8th',
      section: 'A',
      groupBn: 'সাধারণ',
    });
    expect(sec8A.map((s) => s.id)).toEqual(['c8-1']);
  });

  it('assigns merit ranks strictly to passed students while keeping roll order in the tabulation sheet', () => {
    const subjects = [
      { code: '101', name: 'বাংলা ১ম পত্র', fullMarks: 100 },
      { code: '107', name: 'ইংরেজি ১ম পত্র', fullMarks: 100 },
    ];
    const rows = buildSampleTabulationRows('9th', 'Science', 'বিজ্ঞান', subjects);
    const ranked = assignTabulationMeritPositions(rows);

    expect(ranked.map((r) => r.roll)).toEqual(['01', '02', '03', '04']);
    expect(ranked[0].meritPosition).toBe(1);
    expect(ranked[1].meritPosition).toBe(2);
    expect(ranked[2].meritPosition).toBe(3);
    expect(ranked[3].meritPosition).toBeNull(); // Failed student has no merit rank

    const stats = computeTabulationSummary(ranked);
    expect(stats.total).toBe(4);
    expect(stats.passed).toBe(3);
    expect(stats.failed).toBe(1);
    expect(stats.aPlus).toBe(1);
    expect(stats.passRate).toBeCloseTo(75, 1);
  });

  it('enforces strict single-language subject names & labels (zero cross-language mixing)', () => {
    expect(formatTabulationSubjectName('বাংলা ১ম পত্র (Bangla 1st)', 'bn')).toBe('বাংলা ১');
    expect(formatTabulationSubjectName('তথ্য ও যোগাযোগ প্রযুক্তি (ICT)', 'bn')).toBe('তথ্যপ্রযুক্তি');
    expect(formatTabulationSubjectName('বাংলা ১ম পত্র', 'en')).toBe('Ban 1st');
    expect(formatTabulationSubjectName('পদার্থবিজ্ঞান', 'en')).toBe('Physics');

    const bnLabels = getTabulationDocLabels('bn');
    const enLabels = getTabulationDocLabels('en');
    expect(Object.values(bnLabels).join(' ')).not.toMatch(/[A-Za-z]/);
    expect(Object.values(enLabels).join(' ')).not.toMatch(/[\u0980-\u09FF]/);
  });

  it('supports A4, Legal, and A3 Landscape paper specs and builds clean Excel rows', () => {
    expect(TABULATION_PAPER_SPECS.a4.cssPageSize).toBe('A4 landscape');
    expect(TABULATION_PAPER_SPECS.legal.cssPageSize).toBe('legal landscape');
    expect(TABULATION_PAPER_SPECS.a3.cssPageSize).toBe('A3 landscape');

    const subjects = [
      { code: '101', name: 'বাংলা ১ম পত্র', fullMarks: 100 },
      { code: '109', name: 'সাধারণ গণিত', fullMarks: 100 },
    ];
    const rows = buildSampleTabulationRows('8th', 'A', 'সাধারণ', subjects);
    const excelEn = buildTabulationExcelRows({
      rows,
      subjects,
      lang: 'en',
      columns: { ...DEFAULT_TABULATION_COLUMNS, showBreakdown: true },
    });

    expect(excelEn).toHaveLength(4);
    expect(excelEn[0]['Roll']).toBe('01');
    expect(excelEn[0]['Merit']).toBe('1st');
    expect(excelEn[0]['Status']).toBe('PASS');
    expect(String(excelEn[0]['Ban 1st (100)'])).toContain('CQ:');
  });
});
