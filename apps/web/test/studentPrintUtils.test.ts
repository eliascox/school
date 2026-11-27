import { describe, expect, it } from 'vitest';
import {
  STUDENT_PRINT_PRESETS,
  buildColumnsMapForPreset,
  buildSamplePrintStudents,
  buildStudentPrintExcelRows,
  computeStudentClassSummary,
  filterAndSortPrintStudents,
  getStudentPrintHeader,
  paginateStudentPrintRows,
} from '../src/lib/studentPrintUtils';

describe('studentPrintUtils — Phase 4 Student Print Register Studio', () => {
  it('configures all 4 official 1-click register presets with expected orientations & columns', () => {
    expect(STUDENT_PRINT_PRESETS.attendance_register.orientation).toBe('portrait');
    expect(STUDENT_PRINT_PRESETS.guardian_directory.orientation).toBe('landscape');
    expect(STUDENT_PRINT_PRESETS.board_register.columns).toContain('birthRegNo');
    expect(STUDENT_PRINT_PRESETS.board_register.columns).toContain('fatherNid');
    expect(STUDENT_PRINT_PRESETS.class_summary.reportType).toBe('summary');

    const boardCols = buildColumnsMapForPreset('board_register');
    expect(boardCols.sl).toBe(true);
    expect(boardCols.birthRegNo).toBe(true);
    expect(boardCols.remarks).toBe(false);
  });

  it('filters, sorts, paginates, and computes class statistical summary cleanly', () => {
    const sample = buildSamplePrintStudents();
    expect(sample).toHaveLength(4);

    const onlyClass9 = filterAndSortPrintStudents(sample, {
      grade: '9th',
      branch: 'all',
      group: 'all',
      gender: 'all',
      religion: 'all',
      stipend: 'all',
      q: '',
    });
    expect(onlyClass9).toHaveLength(2);

    const onlyStipend = filterAndSortPrintStudents(sample, {
      grade: 'all',
      branch: 'all',
      group: 'all',
      gender: 'all',
      religion: 'all',
      stipend: 'stipend_only',
      q: '',
    });
    expect(onlyStipend).toHaveLength(3);

    const summary = computeStudentClassSummary(sample, {
      branch: 'all',
      religion: 'all',
      stipend: 'all',
    });
    const row8 = summary.find((r) => r.key === '8');
    const row9Sci = summary.find((r) => r.key === '9_sci');
    expect(row8?.total).toBe(2);
    expect(row8?.boys).toBe(1);
    expect(row8?.girls).toBe(1);
    expect(row9Sci?.total).toBe(2);

    const pages = paginateStudentPrintRows(sample, 'portrait', 2);
    expect(pages).toHaveLength(2);
    expect(pages[0].rows.map((r) => r.globalIndex)).toEqual([1, 2]);
    expect(pages[1].rows.map((r) => r.globalIndex)).toEqual([3, 4]);
  });

  it('exports ONLY selected columns in strict single language (BN or EN) for Excel (.xlsx)', () => {
    const sample = buildSamplePrintStudents();
    const cols = buildColumnsMapForPreset('attendance_register');

    const rowsEn = buildStudentPrintExcelRows(sample, cols, 'en');
    expect(rowsEn).toHaveLength(4);
    expect(Object.keys(rowsEn[0])).toEqual([
      'SL',
      'Roll',
      "Student's Name",
      'Gender',
      "Father's Name / Guardian",
      'Mobile',
      'Remarks / Sign',
    ]);
    expect(rowsEn[0].Gender).toBe('Boy');
    expect(rowsEn[1].Gender).toBe('Girl');

    const rowsBn = buildStudentPrintExcelRows(sample, cols, 'bn');
    expect(Object.keys(rowsBn[0]).join(' ')).not.toMatch(/[A-Za-z]/);
    expect(rowsBn[0]['লিঙ্গ']).toBe('ছাত্র');

    const bnHdr = getStudentPrintHeader(
      {
        schoolName: 'বরইতলী উচ্চ বিদ্যালয়',
        schoolNameEn: 'Baraitali High School',
        eiin: '106184',
        estdYear: '1969',
      },
      'bn',
    );
    expect(bnHdr.metaLine).not.toMatch(/[A-Za-z]/);

    const enHdr = getStudentPrintHeader(
      {
        schoolName: 'বরইতলী উচ্চ বিদ্যালয়',
        schoolNameEn: 'Baraitali High School',
        eiin: '106184',
        estdYear: '1969',
      },
      'en',
    );
    expect(enHdr.schoolName).toBe('Baraitali High School');
    expect(enHdr.metaLine).toBe('EIIN: 106184 • Estd: 1969');
  });
});
