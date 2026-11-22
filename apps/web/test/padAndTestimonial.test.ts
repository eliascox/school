import { describe, it, expect, beforeEach } from 'vitest';

const store: Record<string, string> = {};
const mockStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = String(v);
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
(globalThis as any).localStorage = mockStorage;
(globalThis as any).window = {
  localStorage: mockStorage,
  dispatchEvent: () => true,
};

import { cleanRefNoForPad, parsePadDateBoxes, formatDobOrdinalEn } from '@/lib/padUtils';
import {
  settingsService,
  DEFAULT_PAD_HEADER_FIELDS,
  DEFAULT_PAD_MARGINS,
} from '@/services/settingsService';
import { DEFAULT_LAYOUT_CONFIG } from '@/components/ssc-transcript/sscTranscriptUtils';

describe('Pad Header Alignment & Stylish Testimonial Formatting', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('cleanRefNoForPad strips redundant prefix labels while keeping clean ref code', () => {
    expect(cleanRefNoForPad('স্মারক নং: BHS/SSC-TEST/2026/364')).toBe('BHS/SSC-TEST/2026/364');
    expect(cleanRefNoForPad('সূত্র: ব.উ.বি/২০২৬/০৪১')).toBe('ব.উ.বি/২০২৬/০৪১');
    expect(cleanRefNoForPad('Ref. No: BHS/2026/101')).toBe('BHS/2026/101');
    expect(cleanRefNoForPad('BHS/SSC-TEST/2026/364')).toBe('BHS/SSC-TEST/2026/364');
  });

  it('parsePadDateBoxes extracts day, month, and year across ISO and localized formats', () => {
    expect(parsePadDateBoxes('2026-11-19', 'bn')).toEqual({
      day: '১৯',
      month: '১১',
      year: '২০২৬',
    });
    expect(parsePadDateBoxes('১১ নভেম্বর ২০২৬ খ্রি.', 'bn')).toEqual({
      day: '১১',
      month: '১১',
      year: '২০২৬',
    });
    expect(parsePadDateBoxes('19 Nov 2026', 'en')).toEqual({
      day: '19',
      month: '11',
      year: '2026',
    });
    expect(parsePadDateBoxes('05/03/2026', 'en')).toEqual({
      day: '05',
      month: '03',
      year: '2026',
    });
  });

  it('formatDobOrdinalEn formats dates with correct English ordinal suffixes', () => {
    expect(formatDobOrdinalEn('2009-09-25')).toBe('25th September 2009');
    expect(formatDobOrdinalEn('2009-05-01')).toBe('1st May 2009');
    expect(formatDobOrdinalEn('2009-05-02')).toBe('2nd May 2009');
    expect(formatDobOrdinalEn('2009-05-03')).toBe('3rd May 2009');
    expect(formatDobOrdinalEn('2009-05-11')).toBe('11th May 2009');
  });

  it('persists custom padMargins below 3.0in and padHeaderFields without overwriting them', () => {
    settingsService.updateSettings({
      padMargins: { top: 2.25, left: 0.7, right: 0.7, bottom: 0.85 },
      padHeaderFields: {
        ...DEFAULT_PAD_HEADER_FIELDS,
        refTopMm: 48.0,
        refLeftMm: 47.0,
      },
    });

    const reloaded = settingsService.getSettings();
    expect(reloaded.padMargins?.top).toBe(2.25);
    expect(reloaded.padMargins?.left).toBe(0.7);
    expect(reloaded.padHeaderFields?.placement).toBe('pad_header_boxes');
    expect(reloaded.padHeaderFields?.refTopMm).toBe(48.0);
    expect(reloaded.padHeaderFields?.refLeftMm).toBe(47.0);
  });

  it('uses calibrated defaults including stylish cursive testimonial name preset', () => {
    expect(DEFAULT_PAD_MARGINS.top).toBe(2.4);
    expect(DEFAULT_PAD_HEADER_FIELDS.placement).toBe('pad_header_boxes');
    expect(DEFAULT_LAYOUT_CONFIG.nameFontStyle).toBe('cursive');
  });
});
