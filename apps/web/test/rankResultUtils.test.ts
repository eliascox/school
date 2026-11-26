import { describe, it, expect } from 'vitest';
import {
  EvaluatedRankStudent,
  buildChampionsExcelRows,
  buildClassRankExcelRows,
  buildCriteriaForPreset,
  buildStudentRankDedupKey,
  computeSchoolChampions,
  detectRankPresetMode,
  formatBanglaOrdinal,
  formatEnglishOrdinal,
  getRankGroupEn,
  normalizeRankGrade,
  normalizeRankGroupAndSection,
  normalizeRankRollNumber,
  rankAndFilterClassStudents,
  summarizeAvailableScopes,
} from '@/lib/rankResultUtils';

function makeStudent(overrides: Partial<EvaluatedRankStudent>): EvaluatedRankStudent {
  return {
    id: overrides.id || 'st-1',
    roll: overrides.roll || '01',
    name: overrides.name || 'শিক্ষার্থী',
    grade: overrides.grade || '9th',
    gradeBn: overrides.gradeBn || '৯ম শ্রেণি',
    section: overrides.section || 'Science',
    group: overrides.group || 'বিজ্ঞান',
    optionalSubject: overrides.optionalSubject || 'উচ্চতর গণিত',
    religion: overrides.religion || 'Muslim',
    totalObtained: overrides.totalObtained ?? 900,
    totalFull: overrides.totalFull ?? 1200,
    obtainedPercentage: overrides.obtainedPercentage ?? 75,
    gpaWithout4th: overrides.gpaWithout4th ?? 4.5,
    bonusGP: overrides.bonusGP ?? 0.5,
    finalGPA: overrides.finalGPA ?? 5.0,
    overallGrade: overrides.overallGrade || 'A+',
    hasFailed: overrides.hasFailed ?? false,
    failedCount: overrides.failedCount ?? 0,
    failedSubjects: overrides.failedSubjects ?? [],
    isConsidered: overrides.isConsidered ?? false,
    meritPosition: null,
    listOrder: 0,
    schoolPosition: null,
    classPosition: null,
    badge: '',
  };
}

describe('rankResultUtils — Board-Grade Merit Ranking, Deduplication & Print/Export Logic', () => {
  it('prevents Class 9–10 group roll collisions and parses Bengali/English rolls accurately', () => {
    expect(normalizeRankRollNumber('০৫')).toBe(5);
    expect(normalizeRankRollNumber('0012')).toBe(12);
    expect(normalizeRankGrade('৯ম শ্রেণি')).toBe('9th');
    expect(normalizeRankGrade('১০ম')).toBe('10th');

    const sci = normalizeRankGroupAndSection('9th', 'A', 'বিজ্ঞান');
    const hum = normalizeRankGroupAndSection('9th', 'A', 'মানবিক');
    expect(sci).toEqual({ groupBn: 'বিজ্ঞান', sectionNorm: 'Science' });
    expect(hum).toEqual({ groupBn: 'মানবিক', sectionNorm: 'Humanities' });

    const keySci = buildStudentRankDedupKey('9th', sci.sectionNorm, sci.groupBn, '01');
    const keyHum = buildStudentRankDedupKey('9th', hum.sectionNorm, hum.groupBn, '০১');
    expect(keySci).not.toBe(keyHum);
  });

  it('preserves TRUE meritPosition and listOrder during search and never assigns merit rank to failed students', () => {
    const students: EvaluatedRankStudent[] = [
      makeStudent({ id: 's1', roll: '০৫', name: 'রাফি', finalGPA: 5.0, gpaWithout4th: 4.8, totalObtained: 1020 }),
      makeStudent({ id: 's2', roll: '০২', name: 'তাসনিম', finalGPA: 5.0, gpaWithout4th: 5.0, totalObtained: 1050 }),
      makeStudent({ id: 's3', roll: '০৮', name: 'মাহিন', finalGPA: 4.5, gpaWithout4th: 4.3, overallGrade: 'A', totalObtained: 890 }),
      makeStudent({
        id: 's4',
        roll: '০১',
        name: 'নাফিস',
        hasFailed: true,
        failedCount: 1,
        failedSubjects: ['গণিত'],
        finalGPA: 0,
        gpaWithout4th: 0,
        overallGrade: 'F',
        totalObtained: 680,
      }),
      makeStudent({
        id: 's5',
        roll: '০৯',
        name: 'আরিফ',
        hasFailed: true,
        failedCount: 2,
        failedSubjects: ['গণিত', 'ইংরেজি'],
        finalGPA: 0,
        gpaWithout4th: 0,
        overallGrade: 'F',
        totalObtained: 610,
        isConsidered: true,
      }),
    ];

    const defaultCriteria = {
      includePass: true,
      includeFail1: true,
      includeFail2: true,
      includeFail3: false,
      includeFail4Plus: false,
      includeConsidered: true,
    };

    const full = rankAndFilterClassStudents(students, defaultCriteria, '');
    // Order: Passed (tashnim 1st -> rafi 2nd -> mahin 3rd), then Considered (arif 4th), then 1-fail (nafis 5th)
    expect(full.displayedList.map((s) => s.id)).toEqual(['s2', 's1', 's3', 's5', 's4']);
    expect(full.displayedList[0].meritPosition).toBe(1);
    expect(full.displayedList[1].meritPosition).toBe(2);
    expect(full.displayedList[2].meritPosition).toBe(3);
    // Failed students MUST NOT get a passed merit position
    expect(full.displayedList[3].meritPosition).toBeNull();
    expect(full.displayedList[4].meritPosition).toBeNull();
    expect(full.displayedList[3].listOrder).toBe(4);
    expect(full.displayedList[4].listOrder).toBe(5);
    expect(full.summary.passedCount).toBe(3);
    expect(full.summary.aPlusCount).toBe(2);
    expect(full.summary.passRate).toBe(60);

    // Searching for 3rd-place student ("মাহিন") MUST KEEP meritPosition = 3 & listOrder = 3 (NOT 1!)
    const searched = rankAndFilterClassStudents(students, defaultCriteria, 'মাহিন');
    expect(searched.displayedList).toHaveLength(1);
    expect(searched.displayedList[0].meritPosition).toBe(3);
    expect(searched.displayedList[0].listOrder).toBe(3);

    // Searching with ASCII roll "8" matches Bengali roll "০৮"
    const searchedRoll = rankAndFilterClassStudents(students, defaultCriteria, '8');
    expect(searchedRoll.displayedList).toHaveLength(1);
    expect(searchedRoll.displayedList[0].id).toBe('s3');

    // Notice-board Excel hides failed subjects; Office Copy Excel exposes them
    const noticeRows = buildClassRankExcelRows(full.displayedList, { isClass9or10: true, officeCopyMode: false });
    expect(noticeRows[0]['মেধা স্থান']).toBe('১ম');
    expect(noticeRows[4]['মেধা স্থান']).toBe('—');
    expect(noticeRows[4]['অকৃতকার্য বিষয়সমূহ']).toBeUndefined();

    const officeRows = buildClassRankExcelRows(full.displayedList, { isClass9or10: true, officeCopyMode: true });
    expect(officeRows[4]['অকৃতকার্য বিষয়সমূহ']).toBe('গণিত');
  });

  it('ranks School Champion strictly among 100% passed students across classes and supports Class vs Group-wise Top 3', () => {
    const pool: EvaluatedRankStudent[] = [
      makeStudent({
        id: 'c8-top',
        grade: '8th',
        gradeBn: '৮ম শ্রেণি',
        section: 'A',
        group: 'সাধারণ',
        roll: '01',
        finalGPA: 5.0,
        totalObtained: 860,
        totalFull: 950,
        obtainedPercentage: 90.53,
      }),
      makeStudent({
        id: 'c9-sci',
        grade: '9th',
        gradeBn: '৯ম শ্রেণি',
        section: 'Science',
        group: 'বিজ্ঞান',
        roll: '01',
        finalGPA: 5.0,
        totalObtained: 1050,
        totalFull: 1200,
        obtainedPercentage: 87.5,
      }),
      makeStudent({
        id: 'c9-hum',
        grade: '9th',
        gradeBn: '৯ম শ্রেণি',
        section: 'Humanities',
        group: 'মানবিক',
        roll: '01',
        finalGPA: 4.8,
        totalObtained: 920,
        totalFull: 1200,
        obtainedPercentage: 76.67,
      }),
      makeStudent({
        id: 'c9-fail',
        grade: '9th',
        gradeBn: '৯ম শ্রেণি',
        section: 'Science',
        group: 'বিজ্ঞান',
        roll: '02',
        hasFailed: true,
        failedCount: 1,
        finalGPA: 0,
        totalObtained: 1100,
        totalFull: 1200,
        obtainedPercentage: 91.67,
      }),
    ];

    const byClass = computeSchoolChampions(pool, false);
    // School champion uses GPA -> Percentage -> GPA w/o 4th (excluding failed!)
    expect(byClass.schoolChampion?.id).toBe('c8-top');
    expect(byClass.buckets).toHaveLength(5); // 6th..10th
    expect(byClass.buckets.find((b) => b.key === '9th')?.winners.map((w) => w.id)).toEqual(['c9-sci', 'c9-hum']);

    const byGroup = computeSchoolChampions(pool, true);
    // 6th, 7th, 8th (3) + 9th x 3 groups (3) + 10th x 3 groups (3) = 9 buckets
    expect(byGroup.buckets).toHaveLength(9);
    expect(byGroup.buckets.find((b) => b.key === '9th_মানবিক')?.winners[0].id).toBe('c9-hum');

    const excelChamp = buildChampionsExcelRows(byClass.buckets);
    expect(excelChamp).toHaveLength(3);
    expect(formatBanglaOrdinal(1)).toBe('১ম');
    expect(formatBanglaOrdinal(4)).toBe('৪র্থ');

    // English Champions Excel export emits English headers & ordinals
    const excelChampEn = buildChampionsExcelRows(byClass.buckets, 'en');
    expect(excelChampEn).toHaveLength(3);
    expect(excelChampEn[0]['Merit Rank']).toBe('1st Merit');
    expect(excelChampEn[0]['School Position']).toBe('1st');
    expect(excelChampEn[1]['Section / Group']).toBe('Science');
  });

  it('supports roll-order sorting while preserving true meritPosition, marks_first tie-breaker, topN slicing, presets, scope summary, and English export', () => {
    const students: EvaluatedRankStudent[] = [
      makeStudent({ id: 'a', roll: '১০', name: 'আহমেদ', finalGPA: 5.0, gpaWithout4th: 4.8, totalObtained: 980 }),
      makeStudent({ id: 'b', roll: '০২', name: 'নুসরাত', finalGPA: 4.8, gpaWithout4th: 4.7, overallGrade: 'A', totalObtained: 1040 }),
      makeStudent({ id: 'c', roll: '০৫', name: 'সাকিব', finalGPA: 4.5, gpaWithout4th: 4.4, overallGrade: 'A', totalObtained: 910 }),
      makeStudent({
        id: 'd',
        roll: '০১',
        name: 'তানভীর',
        hasFailed: true,
        failedCount: 1,
        failedSubjects: ['গণিত'],
        finalGPA: 0,
        gpaWithout4th: 0,
        overallGrade: 'F',
        totalObtained: 650,
      }),
    ];

    const allCriteria = buildCriteriaForPreset('all');
    expect(detectRankPresetMode(allCriteria)).toBe('all');
    expect(detectRankPresetMode(buildCriteriaForPreset('pass_only'))).toBe('pass_only');
    expect(detectRankPresetMode(buildCriteriaForPreset('notice_default'))).toBe('notice_default');
    expect(detectRankPresetMode(buildCriteriaForPreset('fail_only'))).toBe('fail_only');
    expect(
      detectRankPresetMode({
        ...allCriteria,
        includeFail3: false,
      }),
    ).toBe('custom');

    // 1. Roll-order sorting keeps roll ascending (01, 02, 05, 10) while keeping true meritPosition intact
    const rollOrdered = rankAndFilterClassStudents(students, allCriteria, '', {
      sortMode: 'roll',
      tieBreaker: 'gpa_first',
    });
    expect(rollOrdered.displayedList.map((s) => s.id)).toEqual(['d', 'b', 'c', 'a']);
    expect(rollOrdered.displayedList[0].meritPosition).toBeNull(); // failed roll 01
    expect(rollOrdered.displayedList[1].meritPosition).toBe(2); // b (GPA 4.8)
    expect(rollOrdered.displayedList[2].meritPosition).toBe(3); // c (GPA 4.5)
    expect(rollOrdered.displayedList[3].meritPosition).toBe(1); // a (GPA 5.0)

    // 2. Marks-first tie-breaker ranks b (1040 marks, GPA 4.8) ahead of a (980 marks, GPA 5.0)
    const marksFirst = rankAndFilterClassStudents(students, buildCriteriaForPreset('pass_only'), '', {
      sortMode: 'merit',
      tieBreaker: 'marks_first',
    });
    expect(marksFirst.displayedList.map((s) => s.id)).toEqual(['b', 'a', 'c']);
    expect(marksFirst.displayedList[0].meritPosition).toBe(1);
    expect(marksFirst.displayedList[1].meritPosition).toBe(2);

    // 3. Top-N slicing caps displayed rows after true ranking
    const top2FailPlusPass = rankAndFilterClassStudents(students, allCriteria, '', {
      sortMode: 'merit',
      topN: 3,
    });
    expect(top2FailPlusPass.displayedList).toHaveLength(3);
    expect(top2FailPlusPass.displayedList.map((s) => s.id)).toEqual(['a', 'b', 'c']);

    // 4. Fail-only preset returns strictly failed students
    const failOnly = rankAndFilterClassStudents(students, buildCriteriaForPreset('fail_only'), '');
    expect(failOnly.displayedList.map((s) => s.id)).toEqual(['d']);
    expect(failOnly.displayedList[0].meritPosition).toBeNull();

    // 5. Scope summary aggregates grade counts & populated jump chips
    const scopePool = [
      makeStudent({ id: 'p1', grade: '6th', section: 'A', group: 'সাধারণ' }),
      makeStudent({ id: 'p2', grade: '6th', section: 'A', group: 'সাধারণ' }),
      makeStudent({ id: 'p3', grade: '9th', section: 'Humanities', group: 'মানবিক' }),
    ];
    const scopeSummary = summarizeAvailableScopes(scopePool);
    expect(scopeSummary.byGrade['6th']).toBe(2);
    expect(scopeSummary.byGrade['9th']).toBe(1);
    expect(scopeSummary.byGrade['8th']).toBe(0);
    expect(scopeSummary.populatedScopes).toHaveLength(2);
    expect(scopeSummary.populatedScopes[0]).toMatchObject({ grade: '6th', section: 'A', count: 2 });
    expect(scopeSummary.populatedScopes[1]).toMatchObject({ grade: '9th', group: 'মানবিক', count: 1 });

    // 6. English ordinal, group translation & English Excel export
    expect(formatEnglishOrdinal(1)).toBe('1st');
    expect(formatEnglishOrdinal(2)).toBe('2nd');
    expect(formatEnglishOrdinal(3)).toBe('3rd');
    expect(formatEnglishOrdinal(4)).toBe('4th');
    expect(formatEnglishOrdinal(11)).toBe('11th');
    expect(formatEnglishOrdinal(21)).toBe('21st');
    expect(getRankGroupEn('ব্যবসায় শিক্ষা')).toBe('Business Studies');

    const enRows = buildClassRankExcelRows(rollOrdered.displayedList, {
      isClass9or10: true,
      officeCopyMode: true,
      lang: 'en',
    });
    expect(enRows[0]['Merit Position']).toBe('—');
    expect(enRows[0]['Roll']).toBe('01');
    expect(enRows[0]['Failed Subjects']).toBe('গণিত');
    expect(enRows[3]['Merit Position']).toBe('1st');
    expect(enRows[3]['Result / Status']).toBe('Passed');
  });
});
