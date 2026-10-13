import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage & window
const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null
};
(globalThis as any).window = { dispatchEvent: () => true };

import { studentService } from '../src/services/studentService';

describe('studentService Validation & Duplicate Detection Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('validates required fields: student name and roll', () => {
    expect(studentService.validateStudent({ name: '', roll: '01', grade: '8th' }).isValid).toBe(false);
    expect(studentService.validateStudent({ name: 'করিম', roll: '', grade: '8th' }).isValid).toBe(false);
    expect(studentService.validateStudent({ name: 'করিম', roll: '01', grade: '8th' }).isValid).toBe(true);
  });

  it('detects duplicate student roll in the same grade and section', () => {
    // Add student 1
    studentService.addStudent({
      id: 'STD-01',
      name: 'আব্দুল করিম',
      roll: '01',
      grade: '8th',
      section: 'A'
    });

    // Check duplicate check for same grade, section, roll
    const validation = studentService.validateStudent({
      name: 'নতুন ছাত্র',
      roll: '01',
      grade: '8th',
      section: 'A'
    });

    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain('বিদ্যমান');

    // Different section or grade must be valid
    const validSectionB = studentService.validateStudent({
      name: 'নতুন ছাত্র',
      roll: '01',
      grade: '8th',
      section: 'B'
    });
    expect(validSectionB.isValid).toBe(true);

    const validGrade9 = studentService.validateStudent({
      name: 'নতুন ছাত্র',
      roll: '01',
      grade: '9th',
      section: 'A'
    });
    expect(validGrade9.isValid).toBe(true);
  });

  it('allows editing an existing student without self-duplicate conflict', () => {
    const student = studentService.addStudent({
      id: 'STD-101',
      name: 'সাকিব',
      roll: '07',
      grade: '8th',
      section: 'A'
    });

    // Validating self with excludeId should be valid
    const selfValidation = studentService.validateStudent(
      { name: 'সাকিব আল হাসান', roll: '07', grade: '8th', section: 'A' },
      student.id
    );
    expect(selfValidation.isValid).toBe(true);
  });
});
