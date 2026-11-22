import { describe, it, expect, beforeEach } from 'vitest';

const store: Record<string, string> = {};
(globalThis as unknown as { localStorage: Storage }).localStorage = {
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
  get length() {
    return Object.keys(store).length;
  },
  key: (i: number) => Object.keys(store)[i] ?? null,
};
(globalThis as unknown as { window: unknown }).window = {
  ...globalThis,
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

import {
  computePromotionCounts,
  computeNewRollPreviewMap,
  filterPromotionStudents,
  StudentPromotionItem,
} from '@/lib/promotionUtils';
import { studentService } from '@/services/studentService';

const SAMPLE_STUDENTS: StudentPromotionItem[] = [
  {
    id: 'STU-1',
    roll: '05',
    name: 'তানভীর আহমেদ',
    grade: '8th',
    section: 'A',
    group: 'সাধারণ',
    gpa: '4.50',
    letterGrade: 'A',
    status: 'Pass',
    hasMarks: true,
    totalObtained: 820,
    selected: true,
  },
  {
    id: 'STU-2',
    roll: '02',
    name: 'নুসরাত জাহান',
    grade: '8th',
    section: 'A',
    group: 'সাধারণ',
    gpa: '5.00',
    letterGrade: 'A+',
    status: 'Pass',
    hasMarks: true,
    totalObtained: 910,
    selected: true,
  },
  {
    id: 'STU-3',
    roll: '01',
    name: 'রাফি ইসলাম',
    grade: '8th',
    section: 'A',
    group: 'সাধারণ',
    gpa: '0.00',
    letterGrade: 'F',
    status: 'Fail',
    hasMarks: true,
    failedCount: 2,
    totalObtained: 410,
    selected: false,
  },
  {
    id: 'STU-4',
    roll: '08',
    name: 'সাবরিনা আক্তার',
    grade: '8th',
    section: 'A',
    group: 'সাধারণ',
    gpa: '--',
    letterGrade: '-',
    status: 'Pending',
    hasMarks: false,
    totalObtained: 0,
    selected: true,
  },
];

describe('promotionUtils & studentService.promoteStudents', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('computes inline promotion counters accurately', () => {
    const counts = computePromotionCounts(SAMPLE_STUDENTS);
    expect(counts.total).toBe(4);
    expect(counts.passed).toBe(2);
    expect(counts.failed).toBe(1);
    expect(counts.pending).toBe(1);
    expect(counts.selected).toBe(3);
    expect(counts.selectedPassed).toBe(2);
    expect(counts.selectedPending).toBe(1);
    expect(counts.selectedFailed).toBe(0);
  });

  it('previews merit-ranked new rolls and keep-existing rolls accurately', () => {
    const meritMap = computeNewRollPreviewMap(SAMPLE_STUDENTS, 'merit', '9th');
    expect(meritMap['STU-2']).toBe('01');
    expect(meritMap['STU-1']).toBe('02');
    expect(meritMap['STU-4']).toBe('03');
    expect(meritMap['STU-3']).toBeUndefined();

    const keepMap = computeNewRollPreviewMap(SAMPLE_STUDENTS, 'keep', '9th');
    expect(keepMap['STU-1']).toBe('05');
    expect(keepMap['STU-2']).toBe('02');
    expect(keepMap['STU-4']).toBe('08');

    const alumniMap = computeNewRollPreviewMap(SAMPLE_STUDENTS, 'merit', 'Alumni');
    expect(Object.keys(alumniMap)).toHaveLength(0);
  });

  it('filters promotion rows by status, group, and Bangla/English roll search', () => {
    expect(filterPromotionStudents(SAMPLE_STUDENTS, { statusFilter: 'Pass' })).toHaveLength(2);
    expect(filterPromotionStudents(SAMPLE_STUDENTS, { statusFilter: 'Fail' })).toHaveLength(1);
    expect(filterPromotionStudents(SAMPLE_STUDENTS, { query: '০৫' })).toHaveLength(1);
    expect(filterPromotionStudents(SAMPLE_STUDENTS, { query: 'নুসরাত' })).toHaveLength(1);
  });

  it('promotes students with optional rollOverrides while remaining backwards-compatible', () => {
    const s1 = studentService.addStudent({ name: 'আরিফ', grade: '8th', roll: '05', section: 'A', group: 'সাধারণ' });
    const s2 = studentService.addStudent({ name: 'সাদিয়া', grade: '8th', roll: '02', section: 'A', group: 'সাধারণ' });

    const res = studentService.promoteStudents([s1.id, s2.id], '9th', '২০২৭', 'বিজ্ঞান', {
      [s2.id]: '01',
      [s1.id]: '02',
    });

    expect(res.success).toBe(true);
    expect(res.count).toBe(2);

    const allAfter = studentService.getAllStudents();
    const afterS1 = allAfter.find((s) => s.id === s1.id);
    const afterS2 = allAfter.find((s) => s.id === s2.id);
    expect(afterS1?.grade).toBe('9th');
    expect(afterS1?.group).toBe('বিজ্ঞান');
    expect(afterS1?.session).toBe('২০২৭');
    expect(afterS1?.roll).toBe('02');
    expect(afterS2?.roll).toBe('01');
  });
});
