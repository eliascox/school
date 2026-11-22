import { describe, it, expect } from 'vitest';
import {
  MASTER_SUBJECT_LIBRARIES,
  ALL_MASTER_SUBJECTS,
  computeComponentPass,
  formatPassMarksBreakdown,
  mapStreamTagToGroupBn,
  mapCatalogItemToCurriculumItem,
  pairCombinedSubjectsBidirectionally,
  assignMasterSubjectsToGrades,
} from '../src/data/masterSubjectCatalog';
import {
  DEFAULT_CURRICULUM_DATA,
  ensureHinduReligionSubjects,
  normalizeLegacyNctbSubjectCodes,
} from '../src/services/curriculumService';
import {
  DEFAULT_6_TO_8_SUBJECTS,
  DEFAULT_9_TO_10_SUBJECTS,
  getActiveCurriculumSubjects,
} from '../src/lib/curriculumUtils';

describe('Master Subject Catalog & Class-wise Assignment Engine', () => {
  it('contains all 10 institutional libraries and 259 total subjects with bilingual names & codes', () => {
    expect(MASTER_SUBJECT_LIBRARIES).toHaveLength(10);
    expect(ALL_MASTER_SUBJECTS).toHaveLength(259);

    const expectedCounts: Record<string, number> = {
      'school.secondary': 33,
      'school.primary': 12,
      'school.junior': 13,
      'college.hsc': 53,
      'madrasah.dakhil': 30,
      'madrasah.ebtedayi': 10,
      'madrasah.alim': 34,
      'madrasah.alim_old': 34,
      'madrasah.hifz': 12,
      'preschool.kg': 28,
    };

    for (const lib of MASTER_SUBJECT_LIBRARIES) {
      expect(lib.subjects.length).toBe(expectedCounts[lib.id]);
    }

    for (const entry of ALL_MASTER_SUBJECTS) {
      expect(entry.code.trim().length).toBeGreaterThan(0);
      expect(entry.nameEn.trim().length).toBeGreaterThan(0);
      expect(entry.nameBn.trim().length).toBeGreaterThan(0);
      expect(entry.cq + entry.mcq + entry.practical).toBeGreaterThan(0);
    }
  });

  it('computes NCTB 33% component & total pass thresholds accurately', () => {
    expect(computeComponentPass(100)).toBe(33);
    expect(computeComponentPass(70)).toBe(23);
    expect(computeComponentPass(50)).toBe(17);
    expect(computeComponentPass(30)).toBe(10);
    expect(computeComponentPass(25)).toBe(8);
    expect(computeComponentPass(0)).toBe(0);

    const banglaPart = formatPassMarksBreakdown({
      cq: 70,
      mcq: 30,
      practical: 0,
      passRuleMode: 'part',
    });
    expect(banglaPart.totalMarks).toBe(100);
    expect(banglaPart.totalPass).toBe(33);
    expect(banglaPart.summaryText).toBe('CQ 23 · MCQ 10');

    const physicsPart = formatPassMarksBreakdown({
      cq: 50,
      mcq: 25,
      practical: 25,
      passRuleMode: 'part',
    });
    expect(physicsPart.totalMarks).toBe(100);
    expect(physicsPart.summaryText).toBe('CQ 17 · MCQ 8 · ব্যব 8');

    const englishTotal = formatPassMarksBreakdown({
      cq: 100,
      mcq: 0,
      practical: 0,
      passRuleMode: 'total',
    });
    expect(englishTotal.summaryText).toBe('মোট 33');
  });

  it('maps catalog entries into curriculum items with accurate groups, 4th-subject category, and joint pair codes', () => {
    expect(mapStreamTagToGroupBn('Science')).toBe('বিজ্ঞান');
    expect(mapStreamTagToGroupBn('Business Studies')).toBe('ব্যবসায় শিক্ষা');
    expect(mapStreamTagToGroupBn('Humanities')).toBe('মানবিক');
    expect(mapStreamTagToGroupBn(undefined)).toBe('সাধারণ');

    const bangla1 = ALL_MASTER_SUBJECTS.find(
      (s) => s.libraryId === 'school.secondary' && s.code === '101',
    );
    expect(bangla1).toBeDefined();
    const mappedBangla1 = mapCatalogItemToCurriculumItem(bangla1!, '9th', 'bn');
    expect(mappedBangla1.name).toBe('বাংলা ১ম পত্র');
    expect(mappedBangla1.nameEn).toBe('Bangla 1st Paper');
    expect(mappedBangla1.isJointPass).toBe(true);
    expect(mappedBangla1.combinedWithCode).toBe('102');
    expect(mappedBangla1.passRuleMode).toBe('part');
    expect(mappedBangla1.fullMarks).toBe(100);

    const agri = ALL_MASTER_SUBJECTS.find(
      (s) => s.libraryId === 'school.secondary' && s.code === '134',
    );
    expect(agri).toBeDefined();
    const mappedAgri = mapCatalogItemToCurriculumItem(agri!, '10th', 'en');
    expect(mappedAgri.name).toBe('Agriculture Studies');
    expect(mappedAgri.category).toBe('৪র্থ বিষয়');
  });

  it('pairs and unpairs combined papers bidirectionally without dangling links', () => {
    const bangla1 = mapCatalogItemToCurriculumItem(
      ALL_MASTER_SUBJECTS.find((s) => s.libraryId === 'school.secondary' && s.code === '101')!,
      '9th',
    );
    const bangla2 = mapCatalogItemToCurriculumItem(
      ALL_MASTER_SUBJECTS.find((s) => s.libraryId === 'school.secondary' && s.code === '102')!,
      '9th',
    );
    const eng1 = mapCatalogItemToCurriculumItem(
      ALL_MASTER_SUBJECTS.find((s) => s.libraryId === 'school.secondary' && s.code === '107')!,
      '9th',
    );

    // Unpair 101 -> should clear both 101 and 102
    const unpaired = pairCombinedSubjectsBidirectionally(
      [bangla1, bangla2, eng1],
      '9th',
      bangla1.id,
      '',
    );
    expect(unpaired.find((i) => i.code === '101')?.combinedWithCode).toBeUndefined();
    expect(unpaired.find((i) => i.code === '102')?.combinedWithCode).toBeUndefined();
    expect(unpaired.find((i) => i.code === '102')?.isJointPass).toBe(false);

    // Pair 101 with 102 -> symmetric pairing
    const paired = pairCombinedSubjectsBidirectionally(unpaired, '9th', bangla1.id, '102');
    expect(paired.find((i) => i.code === '101')?.combinedWithCode).toBe('102');
    expect(paired.find((i) => i.code === '102')?.combinedWithCode).toBe('101');
    expect(paired.find((i) => i.code === '101')?.isJointPass).toBe(true);
    expect(paired.find((i) => i.code === '102')?.isJointPass).toBe(true);

    // Re-pair 101 with 107 -> should cleanly detach 102 and symmetrically link 101 <-> 107
    const repaired = pairCombinedSubjectsBidirectionally(paired, '9th', bangla1.id, '107');
    expect(repaired.find((i) => i.code === '102')?.combinedWithCode).toBeUndefined();
    expect(repaired.find((i) => i.code === '101')?.combinedWithCode).toBe('107');
    expect(repaired.find((i) => i.code === '107')?.combinedWithCode).toBe('101');
  });

  it('batch-assigns master subjects across multiple grades while deduplicating existing codes/names', () => {
    const physics = ALL_MASTER_SUBJECTS.find(
      (s) => s.libraryId === 'school.secondary' && s.code === '136',
    )!;
    const chemistry = ALL_MASTER_SUBJECTS.find(
      (s) => s.libraryId === 'school.secondary' && s.code === '137',
    )!;

    const firstPass = assignMasterSubjectsToGrades([], [physics, chemistry], ['9th', '10th'], 'bn');
    expect(firstPass.addedCount).toBe(4);
    expect(firstPass.updated).toHaveLength(4);

    // Second pass with overlapping subjects must not duplicate
    const secondPass = assignMasterSubjectsToGrades(
      firstPass.updated,
      [physics, chemistry],
      ['9th', '10th'],
      'bn',
    );
    expect(secondPass.addedCount).toBe(0);
    expect(secondPass.updated).toHaveLength(4);
  });

  it('uses authentic Bangladesh NCTB board codes across catalog, defaults, and legacy migration', () => {
    // 1. Secondary catalog checks for Sanskrit (123), Pali (124), Work & Life Oriented Ed (155)
    const secondary = ALL_MASTER_SUBJECTS.filter((s) => s.libraryId === 'school.secondary');
    expect(secondary.find((s) => s.nameEn === 'Sanskrit')?.code).toBe('123');
    expect(secondary.find((s) => s.nameEn === 'Pali')?.code).toBe('124');
    expect(secondary.find((s) => s.nameEn === 'Work & Life Oriented Education')?.code).toBe('155');
    expect(secondary.find((s) => s.nameEn === 'Civics & Citizenship')?.code).toBe('140');
    expect(secondary.find((s) => s.nameEn === 'Agriculture Studies')?.code).toBe('134');

    // 2. Default curriculum classes 6-10 should all carry authentic numeric NCTB codes including Islam (111) & Hindu (112)
    const class6 = DEFAULT_CURRICULUM_DATA.filter((i) => i.grade === '6th');
    expect(class6.map((s) => s.code)).toEqual(['101', '102', '107', '108', '109', '127', '154', '150', '111', '112', '134']);
    expect(class6.find((s) => s.code === '101')?.combinedWithCode).toBe('102');
    expect(class6.find((s) => s.code === '112')?.name).toBe('হিন্দুধর্ম ও নৈতিক শিক্ষা');

    const class9 = DEFAULT_CURRICULUM_DATA.filter((i) => i.grade === '9th');
    expect(class9.find((s) => s.name.includes('পৌরনীতি'))?.code).toBe('140');
    expect(class9.find((s) => s.name.includes('ব্যবসায় উদ্যোগ'))?.code).toBe('143');
    expect(class9.find((s) => s.name.includes('ফিন্যান্স'))?.code).toBe('152');
    expect(class9.find((s) => s.code === '112')?.name).toBe('হিন্দুধর্ম ও নৈতিক শিক্ষা');
    expect(class9.filter((s) => s.name.includes('কৃষি শিক্ষা')).every((s) => s.code === '134')).toBe(true);

    // 3. Curriculum utils fallbacks & faith-aware resolution
    expect(DEFAULT_6_TO_8_SUBJECTS(8).map((s) => s.code)).toEqual(['101', '102', '107', '108', '109', '127', '154', '150', '111', '134']);
    expect(DEFAULT_6_TO_8_SUBJECTS(8, 'Hindu').find((s) => s.code === '112')?.name).toBe('হিন্দুধর্ম ও নৈতিক শিক্ষা');
    expect(DEFAULT_9_TO_10_SUBJECTS('ব্যবসায় শিক্ষা').find((s) => s.name === 'ব্যবসায় উদ্যোগ')?.code).toBe('143');
    expect(DEFAULT_9_TO_10_SUBJECTS('মানবিক', 'হিন্দু').find((s) => s.code === '112')?.name).toBe('হিন্দুধর্ম ও নৈতিক শিক্ষা');
    expect(DEFAULT_9_TO_10_SUBJECTS('মানবিক').find((s) => s.name === 'কৃষি শিক্ষা')?.code).toBe('134');

    // 4. ensureHinduReligionSubjects cleanly injects 112 without duplicating if already present
    const seeded6th = ensureHinduReligionSubjects(
      class6.filter((i) => i.code !== '112'),
    );
    expect(seeded6th.changed).toBe(true);
    expect(seeded6th.updated.some((i) => i.code === '112' && i.name.includes('হিন্দু'))).toBe(true);
    const secondRun = ensureHinduReligionSubjects(seeded6th.updated);
    expect(secondRun.changed).toBe(false);

    // Faith-aware getActiveCurriculumSubjects picks 112 for Hindu students & 111 for Muslim students
    const store: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    };
    (globalThis as any).window = { localStorage: (globalThis as any).localStorage };
    store['sms_curriculum_subjects'] = JSON.stringify(DEFAULT_CURRICULUM_DATA);
    const hinduClass9 = getActiveCurriculumSubjects('9th', 'বিজ্ঞান', undefined, 'Hindu');
    expect(hinduClass9.filter((s) => s.code === '112')).toHaveLength(1);
    expect(hinduClass9.some((s) => s.code === '111')).toBe(false);
    const muslimClass9 = getActiveCurriculumSubjects('9th', 'বিজ্ঞান', undefined, 'Muslim');
    expect(muslimClass9.filter((s) => s.code === '111')).toHaveLength(1);
    expect(muslimClass9.some((s) => s.code === '112')).toBe(false);

    // 4. Legacy migration cleans old non-NCTB prefixes while keeping custom subjects intact
    const migrated = normalizeLegacyNctbSubjectCodes([
      {
        id: 'old-1',
        code: 'BAN-601',
        name: 'বাংলা ১ম পত্র',
        grade: '6th',
        group: 'সাধারণ',
        cq: 100,
        mcq: '-',
        practical: '-',
        ca: 0,
        fullMarks: 100,
        passMarks: 33,
        passRules: '',
        isJointPass: true,
        category: 'আবশ্যিক',
      },
      {
        id: 'old-2',
        code: 'CIV-112',
        name: 'পৌরনীতি ও নাগরিকতা',
        grade: '9th',
        group: 'মানবিক',
        cq: 70,
        mcq: 30,
        practical: '-',
        ca: 0,
        fullMarks: 100,
        passMarks: 33,
        passRules: '',
        category: 'আবশ্যিক',
      },
      {
        id: 'custom-1',
        code: 'ARAB-99',
        name: 'কাস্টম আরবি',
        grade: '6th',
        group: 'সাধারণ',
        cq: 100,
        mcq: 0,
        practical: 0,
        ca: 0,
        fullMarks: 100,
        passMarks: 33,
        passRules: '',
        category: 'ঐচ্ছিক',
      },
    ]);

    expect(migrated[0].code).toBe('101');
    expect(migrated[0].combinedWithCode).toBe('102');
    expect(migrated[1].code).toBe('140');
    expect(migrated[2].code).toBe('ARAB-99');
  });
});
