import { describe, expect, it } from 'vitest';
import {
  computeTeacherDirectoryCounts,
  filterTeacherDirectory,
  formatClassSectionLabelBn,
  formatClassShortLabelBn,
  generateSecureTeacherPassword,
  getDesignationSeniorityRank,
  sortTeachersExecutive,
  toAsciiDigits,
  toBanglaDigits,
} from '@/components/teacher/teacherUtils';
import type {
  ClassTeacherAssignment,
  SubjectAssignment,
  TeacherRecord,
} from '@/services/teacherRBACService';

const SAMPLE_TEACHERS: TeacherRecord[] = [
  {
    id: 'TCH-001',
    name: 'মোঃ আব্দুর রহমান',
    phone: '01711000001',
    designation: 'সিনিয়র শিক্ষক',
    dob: '1985-04-12',
    status: 'active',
    passwordHash: 'hash1',
    mustChangePassword: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'TCH-002',
    name: 'ফারহানা আক্তার',
    phone: '01812000002',
    designation: 'সহকারী শিক্ষক',
    dob: '1991-08-20',
    status: 'active',
    passwordHash: 'hash2',
    mustChangePassword: true,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'TCH-003',
    name: 'সুমন চন্দ্র দাস',
    phone: '01913000003',
    designation: 'সহকারী শিক্ষক (ধর্ম)',
    dob: '1988-11-05',
    status: 'inactive',
    passwordHash: 'hash3',
    mustChangePassword: false,
    createdAt: '2026-01-03T00:00:00.000Z',
  },
];

const SAMPLE_ASSIGNMENTS: SubjectAssignment[] = [
  {
    id: 'SA-1',
    teacherId: 'TCH-001',
    classId: '8th',
    subjectId: 'সাধারণ গণিত',
    academicYear: 2026,
  },
  {
    id: 'SA-2',
    teacherId: 'TCH-002',
    classId: '9th',
    subjectId: 'ইংরেজি ১ম পত্র',
    academicYear: 2026,
  },
  {
    id: 'SA-3',
    teacherId: 'TCH-003',
    classId: '6th',
    subjectId: 'হিন্দুধর্ম ও নৈতিক শিক্ষা',
    academicYear: 2026,
  },
];

const SAMPLE_CLASS_TEACHERS: ClassTeacherAssignment[] = [
  {
    id: 'CT-1',
    teacherId: 'TCH-001',
    classId: '8th-A',
    academicYear: 2026,
  },
  {
    id: 'CT-2',
    teacherId: 'TCH-001',
    classId: '9th-A',
    academicYear: 2026,
  },
];

describe('teacherDirectoryUtils', () => {
  it('converts digits accurately between Bangla and ASCII', () => {
    expect(toAsciiDigits('০১৭১১-০০০০০১')).toBe('01711-000001');
    expect(toBanglaDigits(2026)).toBe('২০২৬');
    expect(toBanglaDigits('8th-A')).toBe('৮th-A');
  });

  it('formats class and section IDs into natural Bangla labels', () => {
    expect(formatClassSectionLabelBn('8th-A')).toBe('৮ম শ্রেণি — শাখা A');
    expect(formatClassSectionLabelBn('9th')).toBe('৯ম শ্রেণি');
    expect(formatClassSectionLabelBn('10th-B')).toBe('১০ম শ্রেণি — শাখা B');
    expect(formatClassSectionLabelBn('6th')).toBe('৬ষ্ঠ শ্রেণি');
    expect(formatClassSectionLabelBn('')).toBe('');
    expect(formatClassShortLabelBn('7th')).toBe('৭ম');
    expect(formatClassShortLabelBn('8th-A')).toBe('৮ম (A)');
  });

  it('computes accurate directory counts with unique class teachers', () => {
    const counts = computeTeacherDirectoryCounts(SAMPLE_TEACHERS, SAMPLE_CLASS_TEACHERS);
    expect(counts).toEqual({
      all: 3,
      active: 2,
      inactive: 1,
      classTeacher: 1,
      mustChangePassword: 1,
    });
  });

  it('filters teachers by status, class teacher role, and password flag', () => {
    expect(
      filterTeacherDirectory(SAMPLE_TEACHERS, SAMPLE_ASSIGNMENTS, SAMPLE_CLASS_TEACHERS, {
        filter: 'active',
      }).map((t) => t.id)
    ).toEqual(['TCH-001', 'TCH-002']);

    expect(
      filterTeacherDirectory(SAMPLE_TEACHERS, SAMPLE_ASSIGNMENTS, SAMPLE_CLASS_TEACHERS, {
        filter: 'inactive',
      }).map((t) => t.id)
    ).toEqual(['TCH-003']);

    expect(
      filterTeacherDirectory(SAMPLE_TEACHERS, SAMPLE_ASSIGNMENTS, SAMPLE_CLASS_TEACHERS, {
        filter: 'class_teacher',
      }).map((t) => t.id)
    ).toEqual(['TCH-001']);

    expect(
      filterTeacherDirectory(SAMPLE_TEACHERS, SAMPLE_ASSIGNMENTS, SAMPLE_CLASS_TEACHERS, {
        filter: 'must_change_password',
      }).map((t) => t.id)
    ).toEqual(['TCH-002']);
  });

  it('supports Bangla-digit phone search, subject search, class search, and combined filters', () => {
    // Bangla digits matching ASCII phone
    expect(
      filterTeacherDirectory(SAMPLE_TEACHERS, SAMPLE_ASSIGNMENTS, SAMPLE_CLASS_TEACHERS, {
        query: '০১৭১১',
      }).map((t) => t.id)
    ).toEqual(['TCH-001']);

    // Assigned subject search
    expect(
      filterTeacherDirectory(SAMPLE_TEACHERS, SAMPLE_ASSIGNMENTS, SAMPLE_CLASS_TEACHERS, {
        query: 'ইংরেজি',
      }).map((t) => t.id)
    ).toEqual(['TCH-002']);

    // Bangla class label search
    expect(
      filterTeacherDirectory(SAMPLE_TEACHERS, SAMPLE_ASSIGNMENTS, SAMPLE_CLASS_TEACHERS, {
        query: '৮ম শ্রেণি',
      }).map((t) => t.id)
    ).toEqual(['TCH-001']);

    // Combined filter + query excludes inactive teacher
    expect(
      filterTeacherDirectory(SAMPLE_TEACHERS, SAMPLE_ASSIGNMENTS, SAMPLE_CLASS_TEACHERS, {
        query: 'হিন্দুধর্ম',
        filter: 'active',
      })
    ).toEqual([]);

    expect(
      filterTeacherDirectory(SAMPLE_TEACHERS, SAMPLE_ASSIGNMENTS, SAMPLE_CLASS_TEACHERS, {
        query: 'হিন্দুধর্ম',
        filter: 'inactive',
      }).map((t) => t.id)
    ).toEqual(['TCH-003']);
  });

  it('ranks designations by Bangladeshi institutional seniority and sorts active teachers first', () => {
    expect(getDesignationSeniorityRank('প্রধান শিক্ষক')).toBeLessThan(
      getDesignationSeniorityRank('সহকারী প্রধান শিক্ষক')
    );
    expect(getDesignationSeniorityRank('সহকারী প্রধান শিক্ষক')).toBeLessThan(
      getDesignationSeniorityRank('সিনিয়র শিক্ষক')
    );
    expect(getDesignationSeniorityRank('সিনিয়র শিক্ষক')).toBeLessThan(
      getDesignationSeniorityRank('সহকারী শিক্ষক (গণিত)')
    );
    expect(getDesignationSeniorityRank('সহকারী শিক্ষক')).toBeLessThan(
      getDesignationSeniorityRank('সহকারী গ্রন্থাগারিক')
    );

    const mixed: TeacherRecord[] = [
      { ...SAMPLE_TEACHERS[2], id: 'T-INACTIVE', designation: 'প্রধান শিক্ষক', status: 'inactive' },
      { ...SAMPLE_TEACHERS[1], id: 'T-ASST', designation: 'সহকারী শিক্ষক', status: 'active' },
      { ...SAMPLE_TEACHERS[0], id: 'T-HEAD', designation: 'প্রধান শিক্ষক', status: 'active' },
      { ...SAMPLE_TEACHERS[0], id: 'T-ASST-HEAD', designation: 'সহকারী প্রধান শিক্ষক', status: 'active' },
      { ...SAMPLE_TEACHERS[0], id: 'T-SENIOR', designation: 'সিনিয়র শিক্ষক', status: 'active' },
    ];

    expect(sortTeachersExecutive(mixed).map((t) => t.id)).toEqual([
      'T-HEAD',
      'T-ASST-HEAD',
      'T-SENIOR',
      'T-ASST',
      'T-INACTIVE',
    ]);
  });

  it('filters by designation, indexNo (Bangla/ASCII), qualification, and generates secure passwords', () => {
    const enriched: TeacherRecord[] = [
      {
        ...SAMPLE_TEACHERS[0],
        indexNo: 'N1048291',
        qualification: 'এম.এসসি (গণিত), বি.এড',
        email: 'rahman@school.edu.bd',
      },
      {
        ...SAMPLE_TEACHERS[1],
        indexNo: 'N2091144',
        qualification: 'এম.এ (ইংরেজি)',
      },
    ];

    expect(
      filterTeacherDirectory(enriched, SAMPLE_ASSIGNMENTS, SAMPLE_CLASS_TEACHERS, {
        designation: 'সিনিয়র শিক্ষক',
      }).map((t) => t.id)
    ).toEqual(['TCH-001']);

    expect(
      filterTeacherDirectory(enriched, SAMPLE_ASSIGNMENTS, SAMPLE_CLASS_TEACHERS, {
        query: '১০৪৮২৯১',
      }).map((t) => t.id)
    ).toEqual(['TCH-001']);

    expect(
      filterTeacherDirectory(enriched, SAMPLE_ASSIGNMENTS, SAMPLE_CLASS_TEACHERS, {
        query: 'বি.এড',
      }).map((t) => t.id)
    ).toEqual(['TCH-001']);

    const pwd = generateSecureTeacherPassword(8);
    expect(pwd).toHaveLength(8);
    expect(pwd).toMatch(/^[A-Za-z0-9]+$/);
    expect(pwd).not.toMatch(/[0O1lI]/);
  });
});
