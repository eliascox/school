import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage for test environment
const store: Record<string, string> = {};

(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};
(globalThis as any).window = {
  ...globalThis,
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

import { studentService, Student } from '@/services/studentService';

describe('Student Bulk Import & Group Deduplication Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('correctly handles 90 students across 3 groups in Class 9 without dropping any', () => {
    // 37 Science students (rolls 01-37)
    const scienceStudents: Student[] = Array.from({ length: 37 }, (_, i) => ({
      id: `STD-9th-SCI-A-${String(i + 1).padStart(2, '0')}`,
      roll: String(i + 1).padStart(2, '0'),
      name: `বিজ্ঞান শিক্ষার্থী ${i + 1}`,
      grade: '9th',
      gradeBn: '৯ম শ্রেণি',
      section: 'A',
      branch: 'A',
      group: 'বিজ্ঞান',
      fatherName: `পিতা বিজ্ঞান ${i + 1}`,
      motherName: `মাতা বিজ্ঞান ${i + 1}`,
      mobile: `018123456${String(i).padStart(2, '0')}`,
    }));

    // 30 Humanities students (rolls 01-30)
    const humanitiesStudents: Student[] = Array.from({ length: 30 }, (_, i) => ({
      id: `STD-9th-HUM-A-${String(i + 1).padStart(2, '0')}`,
      roll: String(i + 1).padStart(2, '0'),
      name: `মানবিক শিক্ষার্থী ${i + 1}`,
      grade: '9th',
      gradeBn: '৯ম শ্রেণি',
      section: 'A',
      branch: 'A',
      group: 'মানবিক',
      fatherName: `পিতা মানবিক ${i + 1}`,
      motherName: `মাতা মানবিক ${i + 1}`,
      mobile: `017123456${String(i).padStart(2, '0')}`,
    }));

    // 23 Business Studies students (rolls 01-23)
    const businessStudents: Student[] = Array.from({ length: 23 }, (_, i) => ({
      id: `STD-9th-BUS-A-${String(i + 1).padStart(2, '0')}`,
      roll: String(i + 1).padStart(2, '0'),
      name: `ব্যবসায় শিক্ষার্থী ${i + 1}`,
      grade: '9th',
      gradeBn: '৯ম শ্রেণি',
      section: 'A',
      branch: 'A',
      group: 'ব্যবসায় শিক্ষা',
      fatherName: `পিতা ব্যবসায় ${i + 1}`,
      motherName: `মাতা ব্যবসায় ${i + 1}`,
      mobile: `019123456${String(i).padStart(2, '0')}`,
    }));

    const totalBatch = [...scienceStudents, ...humanitiesStudents, ...businessStudents];
    expect(totalBatch.length).toBe(90);

    // Save all 90 students using studentService.saveBulkStudents
    studentService.saveBulkStudents(totalBatch, true);

    const savedStudents = studentService.getAllStudents();

    // Verify all 90 students are preserved and NOT collapsed into 37!
    expect(savedStudents.length).toBe(90);

    const sciSaved = savedStudents.filter(s => s.group === 'বিজ্ঞান');
    const humSaved = savedStudents.filter(s => s.group === 'মানবিক');
    const busSaved = savedStudents.filter(s => s.group === 'ব্যবসায় শিক্ষা');

    expect(sciSaved.length).toBe(37);
    expect(humSaved.length).toBe(30);
    expect(busSaved.length).toBe(23);

    // Verify that rolls 01 in each group are 3 distinct students
    const roll1Students = savedStudents.filter(s => s.roll === '01');
    expect(roll1Students.length).toBe(3);

    const sciRoll1 = roll1Students.find(s => s.group === 'বিজ্ঞান');
    const humRoll1 = roll1Students.find(s => s.group === 'মানবিক');
    const busRoll1 = roll1Students.find(s => s.group === 'ব্যবসায় শিক্ষা');

    expect(sciRoll1?.name).toBe('বিজ্ঞান শিক্ষার্থী 1');
    expect(sciRoll1?.fatherName).toBe('পিতা বিজ্ঞান 1');
    expect(sciRoll1?.motherName).toBe('মাতা বিজ্ঞান 1');

    expect(humRoll1?.name).toBe('মানবিক শিক্ষার্থী 1');
    expect(humRoll1?.fatherName).toBe('পিতা মানবিক 1');
    expect(humRoll1?.motherName).toBe('মাতা মানবিক 1');

    expect(busRoll1?.name).toBe('ব্যবসায় শিক্ষার্থী 1');
    expect(busRoll1?.fatherName).toBe('পিতা ব্যবসায় 1');
    expect(busRoll1?.motherName).toBe('মাতা ব্যবসায় 1');
  });

  it('preserves distinct Father and Mother names and never confuses them with Student Name', () => {
    const student: Student = {
      id: 'STD-9th-SCI-A-05',
      roll: '05',
      name: 'সাদিয়া সুলতানা',
      grade: '9th',
      section: 'A',
      group: 'বিজ্ঞান',
      fatherName: 'সুলতান আহমেদ',
      motherName: 'নাছিমা বেগম',
      guardian: 'সুলতান আহমেদ'
    };

    studentService.saveBulkStudents([student], true);
    const saved = studentService.getAllStudents();
    expect(saved.length).toBe(1);

    expect(saved[0].name).toBe('সাদিয়া সুলতানা');
    expect(saved[0].fatherName).toBe('সুলতান আহমেদ');
    expect(saved[0].motherName).toBe('নাছিমা বেগম');
    expect(saved[0].guardian).toBe('সুলতান আহমেদ');
  });
});
