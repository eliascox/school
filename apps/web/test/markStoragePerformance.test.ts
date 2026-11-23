import { describe, it, expect, beforeEach } from 'vitest';

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
  getUniversalStudentMark,
  invalidateMarkStorageCache,
} from '@/lib/markStorageUtils';

describe('markStorageUtils High-Speed Indexed Retrieval & Freshness', () => {
  beforeEach(() => {
    localStorage.clear();
    invalidateMarkStorageCache();
  });

  it('evaluates 5,000 student-subject lookups (500 students x 10 subjects) in < 250ms with exact accuracy', () => {
    const mathRows = Array.from({ length: 500 }, (_, i) => ({
      id: `st-${i + 1}`,
      roll: String(i + 1).padStart(2, '0'),
      name: `Student ${i + 1}`,
      cq: 55,
      mcq: 25,
      practical: 0,
      total: 80,
    }));
    localStorage.setItem(
      'sms_marks_অর্ধ-বার্ষিক পরীক্ষা ২০২৬_9th_Science_বিজ্ঞান_109',
      JSON.stringify(mathRows),
    );

    const subjects = ['101', '102', '107', '108', '109', '136', '137', '138', '154', '111'];
    const start = performance.now();
    let foundMathCount = 0;

    for (let i = 1; i <= 500; i++) {
      for (const sub of subjects) {
        const res = getUniversalStudentMark({
          exam: 'অর্ধ-বার্ষিক পরীক্ষা ২০২৬',
          grade: '9th',
          branch: 'Science',
          group: 'বিজ্ঞান',
          subjectCodeOrName: sub,
          studentRoll: i === 5 ? '০৫' : String(i),
          studentId: `st-${i}`,
          studentName: `Student ${i}`,
          religion: 'Muslim',
        });
        if (sub === '109' && res.hasMarks && res.total === 80) {
          foundMathCount++;
        }
      }
    }

    const elapsedMs = performance.now() - start;
    expect(foundMathCount).toBe(500);
    expect(elapsedMs).toBeLessThan(250);
  });

  it('immediately reflects updated marks even when overwritten synchronously in the same tick', () => {
    const key = 'sms_marks_বার্ষিক পরীক্ষা ২০২৬_8th_A_সাধারণ_109';
    localStorage.setItem(
      key,
      JSON.stringify([{ id: 's1', roll: '01', name: 'রাফি', cq: 40, mcq: 20, total: 60 }]),
    );

    const first = getUniversalStudentMark({
      exam: 'বার্ষিক পরীক্ষা ২০২৬',
      grade: '8th',
      branch: 'A',
      subjectCodeOrName: '109',
      studentRoll: '০১',
      studentId: 's1',
    });
    expect(first.total).toBe(60);

    // Synchronously overwrite the same key with new marks (length unchanged!)
    localStorage.setItem(
      key,
      JSON.stringify([{ id: 's1', roll: '01', name: 'রাফি', cq: 62, mcq: 28, total: 90 }]),
    );

    const second = getUniversalStudentMark({
      exam: 'বার্ষিক পরীক্ষা ২০২৬',
      grade: '8th',
      branch: 'A',
      subjectCodeOrName: '109',
      studentRoll: '০১',
      studentId: 's1',
    });
    expect(second.total).toBe(90);
  });
});
