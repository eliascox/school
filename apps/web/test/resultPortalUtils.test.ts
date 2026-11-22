import { describe, it, expect } from 'vitest';
import {
  normalizeRollDigits,
  toBanglaDigits,
  formatPortalClassName,
  formatPortalGroupName,
  pickDefaultExamTitle,
  buildResultShareUrl,
} from '@/lib/resultPortalUtils';

describe('resultPortalUtils', () => {
  it('normalizes Bangla and English roll digits cleanly', () => {
    expect(normalizeRollDigits(' ০১৫ ')).toBe('015');
    expect(normalizeRollDigits('104')).toBe('104');
    expect(toBanglaDigits('GPA 5.00 (2026)')).toBe('GPA ৫.০০ (২০২৬)');
  });

  it('formats class and group labels in both Bangla and English', () => {
    expect(formatPortalClassName('9th', 'bn')).toBe('৯ম শ্রেণি');
    expect(formatPortalClassName('9th', 'en')).toBe('Class 9');
    expect(formatPortalGroupName('বিজ্ঞান', 'en')).toBe('Science');
    expect(formatPortalGroupName('Business Studies', 'bn')).toBe('ব্যবসায় শিক্ষা');
  });

  it('prefers published exam by default while respecting explicit URL exam match', () => {
    const exams = [
      { id: '1', title: 'Annual Examination 2026', date: '', status: 'Upcoming', isActive: true, isPublished: false },
      { id: '2', title: 'Half-Yearly Examination 2026', date: '', status: 'Completed', isActive: true, isPublished: true },
    ];
    expect(pickDefaultExamTitle(exams, '')).toBe('Half-Yearly Examination 2026');
    expect(pickDefaultExamTitle(exams, 'Annual Examination 2026')).toBe('Annual Examination 2026');
  });

  it('builds shareable result URL including group only for classes 9 and 10', () => {
    const url9 = buildResultShareUrl('https://school.edu.bd/', {
      exam: 'Annual Examination 2026',
      grade: '9th',
      group: 'Science',
      roll: '০৭',
    });
    expect(url9).toContain('/result/?');
    expect(url9).toContain('grade=9th');
    expect(url9).toContain('group=Science');
    expect(url9).toContain('roll=07');

    const url6 = buildResultShareUrl('https://school.edu.bd', {
      exam: 'Annual Examination 2026',
      grade: '6th',
      group: 'Science',
      roll: '12',
    });
    expect(url6).not.toContain('group=');
    expect(url6).toContain('roll=12');
  });
});
