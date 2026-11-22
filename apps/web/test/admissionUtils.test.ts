import { describe, it, expect } from 'vitest';
import {
  normalizeNumericField,
  validatePublicAdmissionFields,
  computeAdmissionStepCompletion,
  filterOnlineApplications,
  OnlineApplicationRecord,
} from '@/lib/admissionUtils';

describe('admissionUtils', () => {
  it('normalizes Bangla and English digits for mobile and 17-digit birth reg', () => {
    expect(normalizeNumericField('০১৮১২-৩৪৫৬৭৮')).toBe('01812345678');
    expect(normalizeNumericField('২০১০১৫১২৩৪৫৬৭৮৯০১')).toBe('20101512345678901');
  });

  it('validates public admission fields with Bangla digit support', () => {
    const validRes = validatePublicAdmissionFields({
      selectedClass: '6th',
      fullName: 'মোঃ আরমান হোসেন',
      mobile: '০১৮১২৩৪৫৬৭৮',
      birthRegNo: '২০১০১৫১২৩৪৫৬৭৮৯০১',
      dob: '2013-05-12',
      fatherName: 'মোঃ কামাল হোসেন',
      motherName: 'রাহেলা বেগম',
      currentAddress: 'বরইতলী, চকরিয়া, কক্সবাজার',
      declaredCorrect: true,
    });
    expect(validRes.valid).toBe(true);

    const badBreg = validatePublicAdmissionFields({
      selectedClass: '6th',
      fullName: 'মোঃ আরমান হোসেন',
      mobile: '01812345678',
      birthRegNo: '12345',
      dob: '2013-05-12',
      fatherName: 'মোঃ কামাল হোসেন',
      motherName: '',
      currentAddress: 'বরইতলী',
      declaredCorrect: true,
    });
    expect(badBreg.valid).toBe(false);
    expect(badBreg.scrollSectionId).toBe('admission-step-2');
  });

  it('computes 4-step admission completion state accurately', () => {
    const partial = computeAdmissionStepCompletion({
      selectedClass: '9th',
      section: 'A',
      fullName: 'সাদিয়া ইসলাম',
      mobile: '01711223344',
      dob: '2010-01-10',
      birthRegNo: '20101512345678901',
      fatherName: '',
      motherName: '',
      currentAddress: '',
    });
    expect(partial.step1Academic).toBe(true);
    expect(partial.step2Personal).toBe(true);
    expect(partial.step3Parents).toBe(false);
    expect(partial.step4Address).toBe(false);
    expect(partial.completedCount).toBe(2);
  });

  it('filters online applications by class, group, and Bangla/English search query', () => {
    const apps: OnlineApplicationRecord[] = [
      {
        appId: 'APP-2026-1001',
        name: 'রাফি আহমেদ',
        grade: '9th',
        group: 'বিজ্ঞান',
        mobile: '01811223344',
      },
      {
        appId: 'APP-2026-1002',
        name: 'নুসরাত জাহান',
        grade: '6th',
        group: 'সাধারণ',
        mobile: '01755667788',
      },
    ];

    expect(filterOnlineApplications(apps, { grade: '9th' })).toHaveLength(1);
    expect(filterOnlineApplications(apps, { query: '০১৭৫৫' })).toHaveLength(1);
    expect(filterOnlineApplications(apps, { grade: '9th', group: 'মানবিক' })).toHaveLength(0);
  });
});
