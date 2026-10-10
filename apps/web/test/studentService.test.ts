import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage for test environment
const store: Record<string, string> = {};
let setItemCallCount = 0;

(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    setItemCallCount++;
    store[k] = v;
  },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
    setItemCallCount = 0;
  },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};
(globalThis as any).window = globalThis;

import { studentService, Student } from '@/services/studentService';

describe('studentService regressions (BUG-005, BUG-007)', () => {
  beforeEach(() => {
    localStorage.clear();
    setItemCallCount = 0;
  });

  it('reads student list without writing to storage on pure read (BUG-007 fix)', () => {
    const initialStudents: Student[] = [
      { id: 'st-1', name: 'Tanvir Ahmed', roll: '01', grade: '6th', section: 'A', group: 'সাধারণ', religion: 'ইসলাম' },
      { id: 'st-2', name: 'Joydeb Nath', roll: '02', grade: '6th', section: 'A', group: 'সাধারণ', religion: 'হিন্দু' },
      { id: 'st-3', name: 'Mong Marma', roll: '03', grade: '6th', section: 'A', group: 'সাধারণ', religion: 'বৌদ্ধ' },
      { id: 'st-4', name: 'Unassigned Rel', roll: '04', grade: '6th', section: 'A', group: 'সাধারণ' },
    ];

    store['sms_students'] = JSON.stringify(initialStudents);

    const result = studentService.getAllStudents();
    expect(result.length).toBe(4);

    // Verifies BUG-007 fix: read-only call does NOT call setItem
    expect(setItemCallCount).toBe(0);

    // Verifies BUG-005 fix: does NOT mutate religion on read
    const joydeb = result.find(s => s.name === 'Joydeb Nath');
    expect(joydeb?.religion).toBe('হিন্দু');

    const mong = result.find(s => s.name === 'Mong Marma');
    expect(mong?.religion).toBe('বৌদ্ধ');

    const unassigned = result.find(s => s.name === 'Unassigned Rel');
    expect(unassigned?.religion).not.toBe('ইসলাম');
  });

  it('merges sms_uploaded_students and writes once upon batch consumption', () => {
    store['sms_students'] = JSON.stringify([
      { id: 'st-1', name: 'Existing Student', roll: '01', grade: '7th', section: 'A', group: 'সাধারণ', religion: 'ইসলাম' }
    ]);
    store['sms_uploaded_students'] = JSON.stringify([
      { id: 'st-upload-1', name: 'Uploaded Student', roll: '02', grade: '7th', section: 'A', group: 'সাধারণ', religion: 'হিন্দু' }
    ]);

    const result = studentService.getAllStudents();
    expect(result.length).toBe(2);
    expect(store['sms_uploaded_students']).toBeUndefined();
    expect(setItemCallCount).toBe(1);

    // Subsequent read must be purely read-only
    setItemCallCount = 0;
    const secondRead = studentService.getAllStudents();
    expect(secondRead.length).toBe(2);
    expect(setItemCallCount).toBe(0);
  });
});
