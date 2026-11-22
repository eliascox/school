import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CLASSES,
  ClassItem,
  countSectionStudents,
  matchesSubjectGroupFilter,
  migrateLegacyAutoDefaultSections,
  normalizeAndMigrateClasses,
  suggestNextSectionDefaults,
} from '@/lib/classesSectionUtils';

function createLegacyClassesSnapshot(): ClassItem[] {
  return [
    {
      id: 'cls-6',
      code: 'CLS-06',
      name: 'Class 6',
      nameBn: '৬ষ্ঠ শ্রেণি',
      gradeNumber: 6,
      shift: 'দিবা (Day)',
      classTeacher: '',
      totalStudents: 0,
      groups: ['সাধারণ (General)'],
      sections: [
        {
          id: 'sec-6a',
          name: 'Section A (ক শাখা)',
          room: 'রুম ১০১',
          capacity: 50,
          studentCount: 0,
          sectionTeacher: '',
          shift: 'দিবা (Day)',
        },
        {
          id: 'sec-6b',
          name: 'Section B (খ শাখা)',
          room: 'রুম ১০২',
          capacity: 50,
          studentCount: 0,
          sectionTeacher: '',
          shift: 'দিবা (Day)',
        },
        {
          id: 'sec-6c',
          name: 'Section C (গ শাখা)',
          room: 'রুম ১০৩',
          capacity: 50,
          studentCount: 0,
          sectionTeacher: '',
          shift: 'দিবা (Day)',
        },
      ],
    },
    {
      id: 'cls-7',
      code: 'CLS-07',
      name: 'Class 7',
      nameBn: '৭ম শ্রেণি',
      gradeNumber: 7,
      shift: 'দিবা (Day)',
      classTeacher: '',
      totalStudents: 0,
      groups: ['সাধারণ (General)'],
      sections: [
        {
          id: 'sec-7a',
          name: 'Section A (ক শাখা)',
          room: 'রুম ১০৩',
          capacity: 50,
          studentCount: 0,
          sectionTeacher: '',
          shift: 'দিবা (Day)',
        },
        {
          id: 'sec-7b',
          name: 'Section B (খ শাখা)',
          room: 'রুম ১০৪',
          capacity: 50,
          studentCount: 0,
          sectionTeacher: '',
          shift: 'দিবা (Day)',
        },
      ],
    },
    {
      id: 'cls-8',
      code: 'CLS-08',
      name: 'Class 8',
      nameBn: '৮ম শ্রেণি',
      gradeNumber: 8,
      shift: 'দিবা (Day)',
      classTeacher: '',
      totalStudents: 0,
      groups: ['সাধারণ (General)'],
      sections: [
        {
          id: 'sec-8a',
          name: 'Section A (ক শাখা)',
          room: 'রুম ২০১',
          capacity: 50,
          studentCount: 0,
          sectionTeacher: '',
          shift: 'দিবা (Day)',
        },
        {
          id: 'sec-8b',
          name: 'Section B (খ শাখা)',
          room: 'রুম ২০২',
          capacity: 50,
          studentCount: 0,
          sectionTeacher: '',
          shift: 'দিবা (Day)',
        },
        {
          id: 'sec-8c',
          name: 'Section C (গ শাখা)',
          room: 'রুম ২০৩',
          capacity: 50,
          studentCount: 0,
          sectionTeacher: '',
          shift: 'দিবা (Day)',
        },
      ],
    },
    {
      id: 'cls-9',
      code: 'CLS-09',
      name: 'Class 9',
      nameBn: '৯ম শ্রেণি',
      gradeNumber: 9,
      shift: 'দিবা (Day)',
      classTeacher: '',
      totalStudents: 0,
      groups: ['বিজ্ঞান (Science)', 'মানবিক (Humanities)', 'ব্যবসায় শিক্ষা (Commerce)'],
      sections: [
        {
          id: 'sec-9a',
          name: 'Section A (বিজ্ঞান)',
          room: 'রুম ৩০১',
          capacity: 60,
          studentCount: 0,
          sectionTeacher: '',
          shift: 'দিবা (Day)',
        },
        {
          id: 'sec-9b',
          name: 'Section B (মানবিক)',
          room: 'রুম ৩০২',
          capacity: 50,
          studentCount: 0,
          sectionTeacher: '',
          shift: 'দিবা (Day)',
        },
        {
          id: 'sec-9c',
          name: 'Section C (ব্যবসায়)',
          room: 'রুম ৩০৩',
          capacity: 50,
          studentCount: 0,
          sectionTeacher: '',
          shift: 'দিবা (Day)',
        },
      ],
    },
    {
      id: 'cls-10',
      code: 'CLS-10',
      name: 'Class 10',
      nameBn: '১০ম শ্রেণি',
      gradeNumber: 10,
      shift: 'দিবা (Day)',
      classTeacher: '',
      totalStudents: 0,
      groups: ['বিজ্ঞান (Science)', 'মানবিক (Humanities)', 'ব্যবসায় শিক্ষা (Commerce)'],
      sections: [
        {
          id: 'sec-10a',
          name: 'Section A (বিজ্ঞান)',
          room: 'রুম ৪০১',
          capacity: 60,
          studentCount: 0,
          sectionTeacher: '',
          shift: 'দিবা (Day)',
        },
        {
          id: 'sec-10b',
          name: 'Section B (মানবিক)',
          room: 'রুম ৪০২',
          capacity: 50,
          studentCount: 0,
          sectionTeacher: '',
          shift: 'দিবা (Day)',
        },
        {
          id: 'sec-10c',
          name: 'Section C (ব্যবসায়)',
          room: 'রুম ৪০৩',
          capacity: 50,
          studentCount: 0,
          sectionTeacher: '',
          shift: 'দিবা (Day)',
        },
      ],
    },
  ];
}

describe('classesSectionUtils', () => {
  it('defines only 1 default Section A (ক শাখা) for Classes 6, 7, 8 and keeps Classes 9 & 10 groups intact', () => {
    for (const grade of [6, 7, 8]) {
      const cls = DEFAULT_CLASSES.find((c) => c.gradeNumber === grade);
      expect(cls).toBeDefined();
      expect(cls?.sections).toHaveLength(1);
      expect(cls?.sections[0].id).toBe(`sec-${grade}a`);
      expect(cls?.sections[0].name).toBe('Section A (ক শাখা)');
    }

    for (const grade of [9, 10]) {
      const cls = DEFAULT_CLASSES.find((c) => c.gradeNumber === grade);
      expect(cls).toBeDefined();
      expect(cls?.groups).toHaveLength(3);
      expect(cls?.sections).toHaveLength(3);
      expect(cls?.sections.map((s) => s.id)).toEqual([
        `sec-${grade}a`,
        `sec-${grade}b`,
        `sec-${grade}c`,
      ]);
    }
  });

  it('(a) removes empty legacy auto-default sec-6b/6c/7b/8b/8c in Classes 6-8 and is idempotent', () => {
    const legacy = createLegacyClassesSnapshot();
    const res = migrateLegacyAutoDefaultSections(legacy, {
      getLiveStudentCount: () => 0,
    });

    expect(res.migrated).toBe(true);
    expect(res.removedCount).toBe(5);

    const cls6 = res.classes.find((c) => c.gradeNumber === 6)!;
    const cls7 = res.classes.find((c) => c.gradeNumber === 7)!;
    const cls8 = res.classes.find((c) => c.gradeNumber === 8)!;

    expect(cls6.sections.map((s) => s.id)).toEqual(['sec-6a']);
    expect(cls7.sections.map((s) => s.id)).toEqual(['sec-7a']);
    expect(cls8.sections.map((s) => s.id)).toEqual(['sec-8a']);

    // Running migration a second time makes no further modifications
    const secondPass = migrateLegacyAutoDefaultSections(res.classes, {
      getLiveStudentCount: () => 0,
    });
    expect(secondPass.migrated).toBe(false);
    expect(secondPass.removedCount).toBe(0);
  });

  it('(a-legacy) cleans older ID-less legacy auto-default Section B/C snapshots safely', () => {
    const rawOldSnapshot = [
      {
        id: 'cls-6',
        gradeNumber: 6,
        nameBn: '৬ষ্ঠ শ্রেণি',
        sections: [
          { name: 'Section A', room: '101', studentCount: 0 },
          { name: 'Section B', room: '102', studentCount: 0 },
        ],
      },
      {
        id: 'cls-8',
        gradeNumber: 8,
        nameBn: '৮ম শ্রেণি',
        sections: [
          { name: 'Section A', room: '201', studentCount: 0 },
          { name: 'Section B', room: '202', studentCount: 0 },
          { name: 'Section C', room: '203', studentCount: 0 },
        ],
      },
    ];

    const res = normalizeAndMigrateClasses(rawOldSnapshot as Partial<ClassItem>[], {
      getLiveStudentCount: () => 0,
    });

    expect(res.migrated).toBe(true);
    expect(res.removedCount).toBe(3);
    expect(res.classes[0].sections).toHaveLength(1);
    expect(res.classes[0].sections[0].name).toBe('Section A');
    expect(res.classes[1].sections).toHaveLength(1);
    expect(res.classes[1].sections[0].name).toBe('Section A');
  });

  it('(b) preserves sec-6b when it has live students > 0 (or stored studentCount > 0)', () => {
    const legacy = createLegacyClassesSnapshot();
    const liveStudents = [
      { grade: '6th', section: 'B', group: 'সাধারণ' },
      { grade: '6th', section: 'A', group: 'সাধারণ' },
    ];

    const res = migrateLegacyAutoDefaultSections(legacy, {
      getLiveStudentCount: (gradeNum, secName) =>
        countSectionStudents(liveStudents, gradeNum, secName),
    });

    const cls6 = res.classes.find((c) => c.gradeNumber === 6)!;
    const cls7 = res.classes.find((c) => c.gradeNumber === 7)!;
    const cls8 = res.classes.find((c) => c.gradeNumber === 8)!;

    // sec-6b has 1 live student so it MUST be preserved; empty sec-6c is removed
    expect(cls6.sections.map((s) => s.id)).toEqual(['sec-6a', 'sec-6b']);
    // Empty sec-7b, sec-8b, sec-8c are still cleaned up
    expect(cls7.sections.map((s) => s.id)).toEqual(['sec-7a']);
    expect(cls8.sections.map((s) => s.id)).toEqual(['sec-8a']);

    // Also preserves when stored studentCount > 0 even if live callback returns 0
    const withStoredCount = createLegacyClassesSnapshot();
    withStoredCount[0].sections[1].studentCount = 12;
    const resStored = migrateLegacyAutoDefaultSections(withStoredCount, {
      getLiveStudentCount: () => 0,
    });
    expect(resStored.classes[0].sections.map((s) => s.id)).toEqual(['sec-6a', 'sec-6b']);
  });

  it('(c) preserves manually added sections even with 0 students (both isCustom and timestamped manual IDs)', () => {
    const classes = createLegacyClassesSnapshot();

    // Admin manually added Section B (খ শাখা) with timestamped ID (even without isCustom flag)
    classes[0].sections = [
      classes[0].sections[0],
      {
        id: 'sec-6-1715000000123',
        name: 'Section B (খ শাখা)',
        room: 'রুম ১০৫',
        capacity: 50,
        studentCount: 0,
        sectionTeacher: '',
        shift: 'দিবা (Day)',
      },
      {
        id: 'sec-6-1715000000456',
        name: 'পদ্মা শাখা',
        room: 'রুম ১০৬',
        capacity: 45,
        studentCount: 0,
        sectionTeacher: '',
        shift: 'প্রভাতি (Morning)',
        isCustom: true,
      },
    ];

    // Admin explicitly customized sec-7b (isCustom: true)
    classes[1].sections[1] = {
      ...classes[1].sections[1],
      isCustom: true,
    };

    const res = migrateLegacyAutoDefaultSections(classes, {
      getLiveStudentCount: () => 0,
    });

    const cls6 = res.classes.find((c) => c.gradeNumber === 6)!;
    const cls7 = res.classes.find((c) => c.gradeNumber === 7)!;
    const cls8 = res.classes.find((c) => c.gradeNumber === 8)!;

    expect(cls6.sections.map((s) => s.id)).toEqual([
      'sec-6a',
      'sec-6-1715000000123',
      'sec-6-1715000000456',
    ]);
    expect(cls7.sections.map((s) => s.id)).toEqual(['sec-7a', 'sec-7b']);
    // Class 8 still had untouched legacy empty sec-8b/sec-8c
    expect(cls8.sections.map((s) => s.id)).toEqual(['sec-8a']);
  });

  it('(d) preserves Class 9 and Class 10 groups and sections completely untouched even with 0 students', () => {
    const legacy = createLegacyClassesSnapshot();
    const res = migrateLegacyAutoDefaultSections(legacy, {
      getLiveStudentCount: () => 0,
    });

    const cls9 = res.classes.find((c) => c.gradeNumber === 9)!;
    const cls10 = res.classes.find((c) => c.gradeNumber === 10)!;

    expect(cls9.groups).toEqual([
      'বিজ্ঞান (Science)',
      'মানবিক (Humanities)',
      'ব্যবসায় শিক্ষা (Commerce)',
    ]);
    expect(cls9.sections.map((s) => s.id)).toEqual(['sec-9a', 'sec-9b', 'sec-9c']);

    expect(cls10.groups).toEqual([
      'বিজ্ঞান (Science)',
      'মানবিক (Humanities)',
      'ব্যবসায় শিক্ষা (Commerce)',
    ]);
    expect(cls10.sections.map((s) => s.id)).toEqual(['sec-10a', 'sec-10b', 'sec-10c']);
  });

  it('never leaves a class with 0 sections even if only a legacy B section exists', () => {
    const onlyLegacyB: ClassItem[] = [
      {
        ...createLegacyClassesSnapshot()[0],
        sections: [
          {
            id: 'sec-6b',
            name: 'Section B (খ শাখা)',
            room: 'রুম ১০২',
            capacity: 50,
            studentCount: 0,
            sectionTeacher: '',
            shift: 'দিবা (Day)',
          },
        ],
      },
    ];

    const res = migrateLegacyAutoDefaultSections(onlyLegacyB, {
      getLiveStudentCount: () => 0,
    });

    expect(res.migrated).toBe(false);
    expect(res.classes[0].sections).toHaveLength(1);
    expect(res.classes[0].sections[0].id).toBe('sec-6b');
  });

  it('accurately counts section students without false substring collisions and supports both Bangla Commerce spellings', () => {
    const students = [
      { grade: '8th', section: 'Section A (ক শাখা)', group: 'সাধারণ' },
      { grade: '8th', section: 'A', group: 'সাধারণ' },
      { grade: '8th', section: '', group: 'সাধারণ' },
      { grade: '9th', section: 'A', group: 'বিজ্ঞান' },
      { grade: '9th', section: 'B', group: 'মানবিক' },
      { grade: '9th', section: 'C', group: 'ব্যবসায় শিক্ষা' },
      { grade: '9th', section: 'C', group: 'ব্যবসায় শিক্ষা' },
    ];

    // Section A students must NOT falsely match Section C because of 'c' inside "Section"
    expect(countSectionStudents(students, 8, 'Section A (ক শাখা)')).toBe(3);
    expect(countSectionStudents(students, 8, 'Section B (খ শাখা)')).toBe(0);
    expect(countSectionStudents(students, 8, 'Section C (গ শাখা)')).toBe(0);

    // Class 9 groups match accurately including both Unicode variants of ব্যবসায়/ব্যবসায়
    expect(countSectionStudents(students, 9, 'Section A (বিজ্ঞান)')).toBe(1);
    expect(countSectionStudents(students, 9, 'Section B (মানবিক)')).toBe(1);
    expect(countSectionStudents(students, 9, 'Section C (ব্যবসায়)')).toBe(2);
  });

  it('preserves a legacy section if a real (non-demo) teacher is assigned, and suggests Section B next', () => {
    const legacy = createLegacyClassesSnapshot();
    legacy[0].sections[1].sectionTeacher = 'মো. আনোয়ার হোসেন'; // real teacher on sec-6b
    legacy[1].sections[1].sectionTeacher = 'ইমরান রেজা'; // demo teacher on sec-7b (should still be cleaned)

    const res = normalizeAndMigrateClasses(legacy, {
      getLiveStudentCount: () => 0,
    });

    expect(res.classes[0].sections.map((s) => s.id)).toEqual(['sec-6a', 'sec-6b']);
    expect(res.classes[1].sections.map((s) => s.id)).toEqual(['sec-7a']);

    const suggestedFor7 = suggestNextSectionDefaults(res.classes[1]);
    expect(suggestedFor7.placeholderName).toBe('Section B (খ শাখা)');

    expect(matchesSubjectGroupFilter({ group: 'ব্যবসায় শিক্ষা' }, 'ব্যবসায় শিক্ষা')).toBe(true);
    expect(matchesSubjectGroupFilter({ group: 'মানবিক ও ব্যবসায় শিক্ষা' }, 'ব্যবসায় শিক্ষা')).toBe(true);
    expect(matchesSubjectGroupFilter({ group: 'মানবিক ও ব্যবসায় শিক্ষা' }, 'মানবিক')).toBe(true);
  });
});
