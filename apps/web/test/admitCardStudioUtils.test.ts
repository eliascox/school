import { beforeEach, describe, expect, it } from 'vitest';
import {
  ADMIT_LAYOUT_PRESETS,
  buildAdmitQrPayload,
  buildDefaultExamSchedule,
  buildSampleAdmitStudents,
  filterAndNormalizeAdmitStudents,
  formatAdmitExamTitle,
  formatAdmitSectionOrGroup,
  getAdmitDocLabels,
  getAdmitInstitutionHeader,
  loadExamSchedule,
  paginateAdmitStudents,
  saveExamSchedule,
} from '../src/lib/admitCardStudioUtils';
import type { Student } from '../src/services/studentService';

// Lightweight localStorage mock for node Vitest runtime
const store = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => {
    store.set(k, String(v));
  },
  removeItem: (k: string) => {
    store.delete(k);
  },
  clear: () => store.clear(),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});
Object.defineProperty(globalThis, 'window', {
  value: globalThis,
  configurable: true,
});

describe('admitCardStudioUtils — Phase 2 Admit Card Split-Pane Studio', () => {
  beforeEach(() => {
    store.clear();
  });

  it('defines all 4 press-grade A4 layouts with expected cards-per-page and orientation', () => {
    expect(ADMIT_LAYOUT_PRESETS.a5_two_per_a4.cardsPerPage).toBe(2);
    expect(ADMIT_LAYOUT_PRESETS.a5_two_per_a4.orientation).toBe('portrait');

    expect(ADMIT_LAYOUT_PRESETS.compact_four_per_a4.cardsPerPage).toBe(4);
    expect(ADMIT_LAYOUT_PRESETS.compact_four_per_a4.orientation).toBe('portrait');

    expect(ADMIT_LAYOUT_PRESETS.single_full_a4.cardsPerPage).toBe(1);
    expect(ADMIT_LAYOUT_PRESETS.single_full_a4.supportsRoutine).toBe(true);

    expect(ADMIT_LAYOUT_PRESETS.two_col_grid.cardsPerPage).toBe(2);
    expect(ADMIT_LAYOUT_PRESETS.two_col_grid.orientation).toBe('landscape');
  });

  it('paginates students accurately for 1, 2, and 4 cards per A4 page', () => {
    const sample = Array.from({ length: 5 }, (_, i) => ({
      ...buildSampleAdmitStudents('8th', 'A', 'সাধারণ', '2026')[0],
      id: `st-${i + 1}`,
      roll: String(i + 1),
    }));

    expect(paginateAdmitStudents(sample, 'single_full_a4')).toHaveLength(5);
    expect(paginateAdmitStudents(sample, 'a5_two_per_a4').map((p) => p.length)).toEqual([2, 2, 1]);
    expect(paginateAdmitStudents(sample, 'compact_four_per_a4').map((p) => p.length)).toEqual([4, 1]);
    expect(paginateAdmitStudents(sample, 'two_col_grid').map((p) => p.length)).toEqual([2, 2, 1]);
  });

  it('enforces strict single-language isolation (no mixed BN+EN text in labels, headers, or exam titles)', () => {
    const bnLabels = getAdmitDocLabels('bn');
    const enLabels = getAdmitDocLabels('en');

    // Bangla labels contain zero Latin letters
    const bnBlob = [
      bnLabels.badgeTitle,
      bnLabels.studentName,
      bnLabels.fatherName,
      bnLabels.motherName,
      bnLabels.instructionsHeading,
      ...bnLabels.instructions,
      bnLabels.sigExaminee,
      bnLabels.cutGuideText,
    ].join(' ');
    expect(bnBlob).not.toMatch(/[A-Za-z]/);

    // English labels contain zero Bengali unicode characters
    const enBlob = [
      enLabels.badgeTitle,
      enLabels.studentName,
      enLabels.fatherName,
      enLabels.motherName,
      enLabels.instructionsHeading,
      ...enLabels.instructions,
      enLabels.sigExaminee,
      enLabels.cutGuideText,
    ].join(' ');
    expect(enBlob).not.toMatch(/[\u0980-\u09FF]/);

    // Exam title translation
    expect(formatAdmitExamTitle('Annual Examination 2026', 'bn')).toBe('বার্ষিক পরীক্ষা ২০২৬');
    expect(formatAdmitExamTitle('অর্ধ-বার্ষিক পরীক্ষা ২০২৬', 'en')).toBe(
      'Half-Yearly Examination 2026',
    );

    const bnHeader = getAdmitInstitutionHeader(
      {
        schoolName: 'বরইতলী উচ্চ বিদ্যালয়',
        schoolNameEn: 'Baraitali High School',
        address: 'বরইতলী, চকরিয়া, কক্সবাজার',
        addressEn: "Baraitoli, Chakaria, Cox's Bazar",
        eiin: '106184',
        estdYear: '1969',
        principalTitle: 'প্রধান শিক্ষক',
        principalTitleEn: 'Headmaster',
      },
      'bn',
    );
    expect(bnHeader.schoolName).toBe('বরইতলী উচ্চ বিদ্যালয়');
    expect(bnHeader.metaLine).not.toMatch(/[A-Za-z]/);

    const enHeader = getAdmitInstitutionHeader(
      {
        schoolName: 'বরইতলী উচ্চ বিদ্যালয়',
        schoolNameEn: 'Baraitali High School',
        address: 'বরইতলী, চকরিয়া, কক্সবাজার',
        addressEn: "Baraitoli, Chakaria, Cox's Bazar",
        eiin: '106184',
        estdYear: '1969',
        principalTitle: 'প্রধান শিক্ষক',
        principalTitleEn: 'Headmaster',
      },
      'en',
    );
    expect(enHeader.schoolName).toBe('Baraitali High School');
    expect(enHeader.metaLine).toBe('EIIN: 106184 • Estd: 1969');
  });

  it('filters Class 6-8 by section and Class 9-10 by group cleanly without section-mismatch loss', () => {
    const mockStudents = [
      { id: '1', roll: '10', name: 'রাফি', grade: '9th', section: 'A', group: 'বিজ্ঞান', religion: 'ইসলাম' },
      { id: '2', roll: '2', name: 'সাদিয়া', grade: '৯ম শ্রেণি', section: 'Science', group: 'Science', religion: 'ইসলাম' },
      { id: '3', roll: '1', name: 'করিম', grade: '9th', section: 'B', group: 'মানবিক', religion: 'ইসলাম' },
      { id: '4', roll: '5', name: 'রিমা', grade: '8th', section: 'A', group: 'সাধারণ', religion: 'হিন্দু' },
    ] as unknown as Student[];

    const sci9 = filterAndNormalizeAdmitStudents({
      allStudents: mockStudents,
      grade: '9th',
      section: 'A',
      groupBn: 'বিজ্ঞান',
      photoMap: {},
      sessionYear: '2026',
    });
    expect(sci9.map((s) => s.id)).toEqual(['2', '1']); // sorted numerically by roll 2, 10

    expect(formatAdmitSectionOrGroup('9th', 'A', 'বিজ্ঞান', 'en')).toBe('Science');
    expect(formatAdmitSectionOrGroup('9th', 'A', 'বিজ্ঞান', 'bn')).toBe('বিজ্ঞান বিভাগ');
  });

  it('builds, persists, and reloads per-exam subject routine schedules and QR payloads', () => {
    const defaults = buildDefaultExamSchedule([
      { code: '101', name: 'বাংলা ১ম পত্র' },
      { code: '107', name: 'ইংরেজি ১ম পত্র' },
    ]);
    expect(defaults).toHaveLength(2);
    expect(defaults[0].subjectNameEn).toBe('Bangla 1st Paper');

    const edited = [{ ...defaults[0], examDate: '01/12/2026', examTime: '02:00 PM' }];
    saveExamSchedule('Annual Examination 2026', '9th', 'বিজ্ঞান', edited);

    const reloaded = loadExamSchedule('Annual Examination 2026', '9th', 'বিজ্ঞান', [
      { code: '101', name: 'বাংলা ১ম পত্র' },
    ]);
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0].examDate).toBe('01/12/2026');

    const sampleSt = buildSampleAdmitStudents('9th', 'Science', 'বিজ্ঞান', '2026')[0];
    const qrEn = buildAdmitQrPayload({
      student: sampleSt,
      schoolName: 'Baraitali High School',
      examTitle: 'Annual Examination 2026',
      sessionYear: '2026',
      lang: 'en',
    });
    expect(qrEn).toContain('Baraitali High School - Admit Card');
    expect(qrEn).toContain('Roll: 01');
  });
});
