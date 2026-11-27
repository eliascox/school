import { describe, expect, it } from 'vitest';
import {
  STICKER_DENSITY_SPECS,
  formatSeatPrintGrade,
  getSeatPlanInstitutionHeader,
  getSeatPlanPrintLabels,
  paginateStickersByDensity,
} from '../src/lib/seatPlanPrintUtils';
import {
  buildAttendanceExcelRows,
  formatAttendanceClassAndBranch,
  getAttendanceInstitutionHeader,
  getAttendancePrintLabels,
} from '../src/lib/attendancePrintUtils';
import type { StudentAttendanceRecord } from '../src/services/attendanceService';

describe('Phase 5 — Seat Plan 3-Tier Stickers & Daily Attendance Printable Sheets', () => {
  it('defines 3-tier A4 3-col sticker densities (12 Large, 18 Medium, 21 Small) and paginates accurately', () => {
    expect(STICKER_DENSITY_SPECS.large_12).toMatchObject({ perPage: 12, cols: 3, rows: 4 });
    expect(STICKER_DENSITY_SPECS.medium_18).toMatchObject({ perPage: 18, cols: 3, rows: 6 });
    expect(STICKER_DENSITY_SPECS.small_21).toMatchObject({ perPage: 21, cols: 3, rows: 7 });

    const items = Array.from({ length: 40 }, (_, i) => i + 1);
    expect(paginateStickersByDensity(items, 'large_12').map((p) => p.length)).toEqual([12, 12, 12, 4]);
    expect(paginateStickersByDensity(items, 'medium_18').map((p) => p.length)).toEqual([18, 18, 4]);
    expect(paginateStickersByDensity(items, 'small_21').map((p) => p.length)).toEqual([21, 19]);
  });

  it('enforces strict single-language isolation for Seat Plan print views (BN vs EN)', () => {
    const bn = getSeatPlanPrintLabels('bn');
    const en = getSeatPlanPrintLabels('en');

    expect(Object.values(bn).join(' ')).not.toMatch(/[A-Za-z]/);
    expect(Object.values(en).join(' ')).not.toMatch(/[\u0980-\u09FF]/);

    expect(formatSeatPrintGrade('9th', true, 'en')).toBe('Class 9');
    expect(formatSeatPrintGrade('9th', false, 'en')).toBe('Class Nine');

    const hdrEn = getSeatPlanInstitutionHeader(
      { schoolName: 'বরইতলী উচ্চ বিদ্যালয়', schoolNameEn: 'Baraitali High School', eiin: '106184' },
      'en',
    );
    expect(hdrEn.schoolName).toBe('Baraitali High School');
    expect(hdrEn.eiinText).toBe('EIIN: 106184');
  });

  it('enforces strict single-language isolation for Daily Attendance sheets & builds Excel rows', () => {
    const bn = getAttendancePrintLabels('absent', 'bn');
    const en = getAttendancePrintLabels('absent', 'en');
    expect(Object.values(bn).join(' ')).not.toMatch(/[A-Za-z]/);
    expect(Object.values(en).join(' ')).not.toMatch(/[\u0980-\u09FF]/);

    expect(formatAttendanceClassAndBranch('9th', 'Science', 'en')).toBe('Class Nine (Science)');
    expect(formatAttendanceClassAndBranch('9th', 'Science', 'bn')).toBe('৯ম শ্রেণি (বিজ্ঞান)');

    const bnHdr = getAttendanceInstitutionHeader(
      { schoolName: 'বরইতলী উচ্চ বিদ্যালয়', eiin: '106184', estdYear: '1969' },
      'bn',
    );
    expect(bnHdr.metaLine).not.toMatch(/[A-Za-z]/);

    const sampleRecords: StudentAttendanceRecord[] = [
      {
        id: 'st-1',
        roll: '01',
        name: 'তানভীর আহমেদ',
        grade: '8th',
        branch: 'A',
        guardian: 'সাইফুল ইসলাম',
        mobile: '01819001122',
        status: 'Absent',
        reason: 'জ্বর',
      },
    ];

    const excelEn = buildAttendanceExcelRows({
      records: sampleRecords,
      reportType: 'absent',
      lang: 'en',
    });
    expect(excelEn[0]['Class & Section']).toBe('Class Eight (Section A)');
    expect(excelEn[0]['Status']).toBe('Absent');

    const excelBn = buildAttendanceExcelRows({
      records: sampleRecords,
      reportType: 'absent',
      lang: 'bn',
    });
    expect(Object.keys(excelBn[0]).join(' ')).not.toMatch(/[A-Za-z]/);
    expect(excelBn[0]['অবস্থা']).toBe('অনুপস্থিত');
  });
});
