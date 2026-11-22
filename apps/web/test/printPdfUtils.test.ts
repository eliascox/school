import { describe, it, expect } from 'vitest';
import { buildSafePdfTitle, getRoutePdfLabel } from '@/lib/printPdfUtils';

describe('printPdfUtils PDF filename & route label helpers', () => {
  it('sanitizes illegal filesystem characters and builds clean bilingual PDF titles', () => {
    expect(
      buildSafePdfTitle(['বরইতলী উচ্চ বিদ্যালয়', 'মার্কশিট / ৯ম: রোল*০১?', '2026-11-20']),
    ).toBe('বরইতলী উচ্চ বিদ্যালয় - মার্কশিট ৯ম রোল০১ - 2026-11-20');

    expect(buildSafePdfTitle([null, undefined, ''])).toBe('SchoolPro_Document');
  });

  it('maps core dashboard and public print routes to accurate Bangla document labels', () => {
    expect(getRoutePdfLabel('/dashboard/academic/marksheet')).toBe('মার্কশিট');
    expect(getRoutePdfLabel('/dashboard/exam/admit-card/')).toBe('প্রবেশপত্র'.includes('প্রবেশপত্র') ? 'পরীক্ষার প্রবেশপত্র' : '');
    expect(getRoutePdfLabel('/dashboard/exam/tabulation')).toBe('ফলাফল ট্যাবুলেশন শিট');
    expect(getRoutePdfLabel('/dashboard/students/print')).toBe('শিক্ষার্থী তালিকা রিপোর্ট');
    expect(getRoutePdfLabel('/dashboard/students/id-card')).toBe('শিক্ষার্থী আইডি কার্ড');
    expect(getRoutePdfLabel('/dashboard/finance')).toBe('আর্থিক হিসাব ও রসিদ');
    expect(getRoutePdfLabel('/result')).toBe('একাডেমিক ট্রান্সক্রিপ্ট');
  });
});
