import { beforeEach, describe, expect, it } from 'vitest';

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
  get length() {
    return Object.keys(store).length;
  },
  key: (i: number) => Object.keys(store)[i] ?? null,
};
(globalThis as any).window = {
  ...globalThis,
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

import { studentService, Student } from '@/services/studentService';
import {
  executeBulkImport,
  getGroupPriority,
  normalizeStudentRow,
  parseRollNumber,
  sortStudentsGroupAndRoll,
} from '@/services/studentBulkImportEngine';

describe('Automatic Roll & Class 9-10 Group A-Z Sorting across Single Admission, Edit, Bulk Import & Directory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('automatically places smaller roll before larger roll when entered out of order via addStudent (supporting Bangla & English digits)', () => {
    // Enter Roll 15 first, then Roll 02, then Bangla Roll ০১, then Roll 9
    studentService.addStudent({
      id: 'ST-15',
      name: 'রহিম উদ্দিন',
      grade: '7th',
      section: 'A',
      roll: '15',
    });
    studentService.addStudent({
      id: 'ST-02',
      name: 'করিম মিয়া',
      grade: '7th',
      section: 'A',
      roll: '02',
    });
    studentService.addStudent({
      id: 'ST-01-BN',
      name: 'আরিফুল ইসলাম',
      grade: '7th',
      section: 'A',
      roll: '০১',
    });
    studentService.addStudent({
      id: 'ST-9',
      name: 'সোহেল রানা',
      grade: '7th',
      section: 'A',
      roll: '9',
    });

    const list = studentService.getAllStudents();
    expect(list.map((s) => s.id)).toEqual(['ST-01-BN', 'ST-02', 'ST-9', 'ST-15']);

    // Verify localStorage itself is persisted in ascending roll order
    const rawSaved: Student[] = JSON.parse(store['sms_students']);
    expect(rawSaved.map((s) => s.id)).toEqual(['ST-01-BN', 'ST-02', 'ST-9', 'ST-15']);
  });

  it('re-sorts automatically when a student roll is edited via updateStudent', () => {
    const s1 = studentService.addStudent({
      id: 'ST-1',
      name: 'শিক্ষার্থী ১',
      grade: '6th',
      section: 'A',
      roll: '01',
    });
    studentService.addStudent({
      id: 'ST-5',
      name: 'শিক্ষার্থী ৫',
      grade: '6th',
      section: 'A',
      roll: '05',
    });
    studentService.addStudent({
      id: 'ST-10',
      name: 'শিক্ষার্থী ১০',
      grade: '6th',
      section: 'A',
      roll: '10',
    });

    // Update ST-1's roll from 01 to 25
    studentService.updateStudent({ ...s1, roll: '25' });

    const list = studentService.getAllStudents();
    expect(list.map((s) => s.roll)).toEqual(['05', '10', '25']);
  });

  it('sorts Classes 6-8 by Grade -> Section (A -> B -> C) -> Roll ascending (1, 2, 3...)', () => {
    const unsorted: Student[] = [
      { id: '8-A-2', name: 'A', grade: '8th', section: 'A', group: 'সাধারণ', roll: '02' },
      { id: '6-B-1', name: 'B', grade: '6th', section: 'Section B (খ শাখা)', group: 'সাধারণ', roll: '01' },
      { id: '6-A-12', name: 'C', grade: '6th', section: 'Section A (ক শাখা)', group: 'সাধারণ', roll: '12' },
      { id: '6-A-2', name: 'D', grade: '6th', section: 'A', group: 'সাধারণ', roll: '০২' },
      { id: '7-A-5', name: 'E', grade: '7th', section: 'A', group: 'সাধারণ', roll: '5' },
    ];

    const sorted = sortStudentsGroupAndRoll(unsorted);
    expect(sorted.map((s) => s.id)).toEqual([
      '6-A-2',
      '6-A-12',
      '6-B-1',
      '7-A-5',
      '8-A-2',
    ]);
  });

  it('sorts Classes 9-10 by Grade -> Group A-Z (Business Studies -> Humanities -> Science) -> Roll ascending (1, 2, 3...)', () => {
    expect(getGroupPriority('ব্যবসায় শিক্ষা')).toBeLessThan(getGroupPriority('মানবিক'));
    expect(getGroupPriority('মানবিক')).toBeLessThan(getGroupPriority('বিজ্ঞান'));
    expect(parseRollNumber('০২')).toBe(2);

    const unsorted: Student[] = [
      { id: '9-SCI-10', name: 'S10', grade: '9th', section: 'A', group: 'বিজ্ঞান', roll: '10' },
      { id: '9-SCI-02', name: 'S02', grade: '9th', section: 'A', group: 'বিজ্ঞান', roll: '০২' },
      { id: '9-HUM-05', name: 'H05', grade: '9th', section: 'A', group: 'মানবিক', roll: '05' },
      { id: '9-HUM-01', name: 'H01', grade: '9th', section: 'A', group: 'মানবিক', roll: '01' },
      { id: '9-BUS-15', name: 'B15', grade: '9th', section: 'A', group: 'ব্যবসায় শিক্ষা', roll: '15' },
      { id: '9-BUS-03', name: 'B03', grade: '9th', section: 'A', group: 'ব্যবসায় শিক্ষা', roll: '03' },
      { id: '10-BUS-01', name: '10B1', grade: '10th', section: 'A', group: 'ব্যবসায় শিক্ষা', roll: '01' },
    ];

    const sorted = sortStudentsGroupAndRoll(unsorted);
    expect(sorted.map((s) => s.id)).toEqual([
      '9-BUS-03',
      '9-BUS-15',
      '9-HUM-01',
      '9-HUM-05',
      '9-SCI-02',
      '9-SCI-10',
      '10-BUS-01',
    ]);
  });

  it('commits bulk-imported rows with out-of-order rolls into canonical Group A-Z & Roll ascending order', () => {
    const rawRows = [
      { 'Student Name': 'Sci Roll 15', Class: '9th', Group: 'Science', Roll: '15' },
      { 'Student Name': 'Sci Roll 02', Class: '9th', Group: 'Science', Roll: '02' },
      { 'Student Name': 'Bus Roll 09', Class: '9th', Group: 'Business Studies', Roll: '09' },
      { 'Student Name': 'Bus Roll 01', Class: '9th', Group: 'Business Studies', Roll: '01' },
      { 'Student Name': 'Hum Roll 04', Class: '9th', Group: 'Humanities', Roll: '04' },
    ];

    const normalized = rawRows.map((r, i) => normalizeStudentRow(r, i));
    const res = executeBulkImport(normalized, {
      mode: 'replace',
      targetGrade: '9th',
      keepUploadedRoll: true,
    });
    expect(res.success).toBe(true);

    const saved = studentService.getAllStudents();
    expect(saved.map((s) => `${s.group}:${s.roll}`)).toEqual([
      'ব্যবসায় শিক্ষা:01',
      'ব্যবসায় শিক্ষা:09',
      'মানবিক:04',
      'বিজ্ঞান:02',
      'বিজ্ঞান:15',
    ]);
  });
});
