import { describe, it, expect } from 'vitest';
import {
  EvaluatedRankStudent,
  buildChampionsExcelRows,
  buildClassRankExcelRows,
  buildStudentRankDedupKey,
  computeSchoolChampions,
  formatBanglaOrdinal,
  normalizeRankGrade,
  normalizeRankGroupAndSection,
  normalizeRankRollNumber,
  rankAndFilterClassStudents,
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
  });
});
