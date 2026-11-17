import {
  DynamicClassSubject,
  getActiveCurriculumSubjects,
} from '@/lib/curriculumUtils';
import { getUniversalStudentMark } from '@/lib/markStorageUtils';
import { getStudentReligion, isReligionSubject } from '@/lib/religionUtils';
import {
  evaluateSubjectGradeAndPass,
  PassEvaluationMode,
  resultService,
  StudentExamResult,
  SubjectMarkEntry,
} from '@/services/resultService';
import { Student } from '@/services/studentService';

export type GradeBucket = 'A+' | 'A' | 'A-' | 'B' | 'C' | 'D' | 'F';
export const GRADE_BUCKETS: readonly GradeBucket[] = ['A+', 'A', 'A-', 'B', 'C', 'D', 'F'];

export type TieBreakerKey = 'gpa' | 'failedCount' | 'totalMarks' | 'gpaWithout4th' | 'roll';

export interface TieBreakerRule {
  key: TieBreakerKey;
  labelBn: string;
  labelEn: string;
  directionBn: string;
  directionEn: string;
  enabled: boolean;
}

export const DEFAULT_TIE_BREAKER_RULES: TieBreakerRule[] = [
  {
    key: 'gpa',
    labelBn: 'GPA (গ্রেড পয়েন্ট)',
    labelEn: 'GPA (Grade Point)',
    directionBn: 'উচ্চ থেকে নিম্ন',
    directionEn: 'High to Low',
    enabled: true,
  },
  {
    key: 'failedCount',
    labelBn: 'অকৃতকার্য বিষয়ের সংখ্যা',
    labelEn: 'Failed Subjects Count',
    directionBn: 'কম থেকে বেশি',
    directionEn: 'Low to High',
    enabled: true,
  },
  {
    key: 'totalMarks',
    labelBn: 'মোট প্রাপ্ত নম্বর',
    labelEn: 'Total Obtained Marks',
    directionBn: 'উচ্চ থেকে নিম্ন',
    directionEn: 'High to Low',
    enabled: true,
  },
  {
    key: 'gpaWithout4th',
    labelBn: '৪র্থ বিষয় ছাড়া GPA',
    labelEn: 'GPA (Excl. 4th Subject)',
    directionBn: 'উচ্চ থেকে নিম্ন',
    directionEn: 'High to Low',
    enabled: true,
  },
  {
    key: 'roll',
    labelBn: 'শ্রেণি / পূর্বের রোল নম্বর',
    labelEn: 'Class / Previous Roll',
    directionBn: 'ছোট থেকে বড়',
    directionEn: 'Low to High',
    enabled: true,
  },
];

const TIE_BREAKER_STORAGE_KEY = 'sms_result_tie_breakers_v1';
const SUBJECT_ORDER_STORAGE_PREFIX = 'sms_result_subject_order_v1_';

export const parseNumericRoll = (roll: string | number | undefined): number => {
  const digits = String(roll ?? '').replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
};

export function createEmptyGradeDistribution(): Record<GradeBucket, number> {
  return { 'A+': 0, A: 0, 'A-': 0, B: 0, C: 0, D: 0, F: 0 };
}

export function incrementGradeBucket(
  dist: Record<GradeBucket, number>,
  letterGrade: string | undefined,
): void {
  if (letterGrade && letterGrade in dist) {
    dist[letterGrade as GradeBucket] += 1;
  }
}

export function loadTieBreakerRules(): TieBreakerRule[] {
  if (typeof window === 'undefined') return DEFAULT_TIE_BREAKER_RULES;
  try {
    const raw = window.localStorage.getItem(TIE_BREAKER_STORAGE_KEY);
    if (!raw) return DEFAULT_TIE_BREAKER_RULES;
    const parsed = JSON.parse(raw) as Array<Partial<TieBreakerRule>>;
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_TIE_BREAKER_RULES;
    const defaultMap = new Map(DEFAULT_TIE_BREAKER_RULES.map((r) => [r.key, r]));
    const ordered: TieBreakerRule[] = [];
    const seen = new Set<TieBreakerKey>();
    for (const item of parsed) {
      if (item.key && defaultMap.has(item.key) && !seen.has(item.key)) {
        const base = defaultMap.get(item.key)!;
        ordered.push({ ...base, enabled: item.enabled !== false });
        seen.add(item.key);
      }
    }
    for (const base of DEFAULT_TIE_BREAKER_RULES) {
      if (!seen.has(base.key)) ordered.push(base);
    }
    return ordered;
  } catch {
    return DEFAULT_TIE_BREAKER_RULES;
  }
}

export function saveTieBreakerRules(rules: TieBreakerRule[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TIE_BREAKER_STORAGE_KEY, JSON.stringify(rules));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadSubjectOrder(grade: string, group: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`${SUBJECT_ORDER_STORAGE_PREFIX}${grade}_${group}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function saveSubjectOrder(grade: string, group: string, codes: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      `${SUBJECT_ORDER_STORAGE_PREFIX}${grade}_${group}`,
      JSON.stringify(codes),
    );
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Reorder curriculum subjects by saved user priority codes without dropping any subject.
 * Keeps adjacent joint-pass pairs safely together when reordered.
 */
export function applySubjectOrder(
  subjects: DynamicClassSubject[],
  orderedCodes: string[],
): DynamicClassSubject[] {
  if (!orderedCodes || orderedCodes.length === 0) return subjects;
  const rankMap = new Map<string, number>();
  orderedCodes.forEach((code, idx) => rankMap.set(String(code), idx));
  return [...subjects].sort((a, b) => {
    const ra = rankMap.has(String(a.code)) ? rankMap.get(String(a.code))! : Number.MAX_SAFE_INTEGER;
    const rb = rankMap.has(String(b.code)) ? rankMap.get(String(b.code))! : Number.MAX_SAFE_INTEGER;
    return ra - rb;
  });
}

export interface RankedStudentResult extends StudentExamResult {
  meritPosition: number;
  studentObj?: Student;
  gender?: string;
}

/**
 * Configurable multi-criteria merit & rank sorter.
 */
export function sortStudentResults(
  results: StudentExamResult[],
  rules: TieBreakerRule[] = DEFAULT_TIE_BREAKER_RULES,
  specialConsideredIds: string[] = [],
  passedFirst: boolean = true,
): RankedStudentResult[] {
  const activeRules = rules.filter((r) => r.enabled);
  const consideredSet = new Set(specialConsideredIds);

  const sorted = [...results].sort((a, b) => {
    if (consideredSet.size > 0) {
      const aPassOrCons = a.isPassed || consideredSet.has(a.studentId);
      const bPassOrCons = b.isPassed || consideredSet.has(b.studentId);
      if (aPassOrCons !== bPassOrCons) return aPassOrCons ? -1 : 1;
    } else if (passedFirst && a.isPassed !== b.isPassed) {
      return a.isPassed ? -1 : 1;
    }

    for (const rule of activeRules) {
      if (rule.key === 'gpa' && b.gpa !== a.gpa) {
        return b.gpa - a.gpa;
      }
      if (rule.key === 'failedCount' && a.failedCount !== b.failedCount) {
        return a.failedCount - b.failedCount;
      }
      if (rule.key === 'totalMarks' && b.totalObtainedMarks !== a.totalObtainedMarks) {
        return b.totalObtainedMarks - a.totalObtainedMarks;
      }
      if (rule.key === 'gpaWithout4th' && b.gpaWithout4th !== a.gpaWithout4th) {
        return b.gpaWithout4th - a.gpaWithout4th;
      }
      if (rule.key === 'roll') {
        const diff = parseNumericRoll(a.studentRoll) - parseNumericRoll(b.studentRoll);
        if (diff !== 0) return diff;
      }
    }

    return parseNumericRoll(a.studentRoll) - parseNumericRoll(b.studentRoll);
  });

  return sorted.map((res, idx) => ({
    ...res,
    rank: idx + 1,
    meritPosition: idx + 1,
  }));
}

export interface FailedSubjectDetail {
  subjectCode: string;
  subjectName: string;
  obtained: number;
  fullMarks: number;
  minPassMarks: number;
  deficit: number;
  isPending: boolean;
  failedComponents: string[];
}

export interface FailListEntry {
  result: RankedStudentResult;
  failedDetails: FailedSubjectDetail[];
}

export function buildFailList(
  rankedResults: RankedStudentResult[],
  minFailCount: number = 1,
): FailListEntry[] {
  return rankedResults
    .filter((r) => r.failedCount >= minFailCount)
    .map((r) => {
      const entries = Object.values(r.subjectMarks);
      const seenCodes = new Set<string>();
      const failedDetails: FailedSubjectDetail[] = [];

      for (const entry of entries) {
        if (entry.isOptional || seenCodes.has(entry.subjectCode)) continue;
        if (entry.isPassed === false || entry.letterGrade === 'F') {
          if (entry.isJointPass && entry.jointPairCode && r.subjectMarks[entry.jointPairCode]) {
            const pair = r.subjectMarks[entry.jointPairCode];
            seenCodes.add(entry.subjectCode);
            seenCodes.add(pair.subjectCode);
            const combinedObtained = entry.totalMarks + pair.totalMarks;
            const combinedFull = entry.fullMarks + pair.fullMarks;
            const minPass = Math.round(combinedFull * 0.33);
            failedDetails.push({
              subjectCode: `${entry.subjectCode}+${pair.subjectCode}`,
              subjectName: `${entry.subjectName} + ${pair.subjectName}`,
              obtained: combinedObtained,
              fullMarks: combinedFull,
              minPassMarks: minPass,
              deficit: Math.max(0, minPass - combinedObtained),
              isPending: !entry.hasMarks && !pair.hasMarks,
              failedComponents: entry.failedComponents || [],
            });
          } else {
            seenCodes.add(entry.subjectCode);
            const minPass = Math.round(entry.fullMarks * 0.33);
            failedDetails.push({
              subjectCode: entry.subjectCode,
              subjectName: entry.subjectName,
              obtained: entry.totalMarks,
              fullMarks: entry.fullMarks,
              minPassMarks: minPass,
              deficit: Math.max(0, minPass - entry.totalMarks),
              isPending: !entry.hasMarks,
              failedComponents: entry.failedComponents || [],
            });
          }
        }
      }

      return { result: r, failedDetails };
    });
}

export interface ClassSectionSummaryRow {
  grade: string;
  section: string;
  totalStudents: number;
  appearedCount: number;
  pendingCount: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  avgPassedGpa: number;
  avgPercentage: number;
  gradeDistribution: Record<GradeBucket, number>;
}

export function buildClassSectionSummary(results: StudentExamResult[]): ClassSectionSummaryRow[] {
  const grouped = new Map<string, StudentExamResult[]>();

  for (const res of results) {
    const sec = (res.branch || 'A').trim();
    const key = `${res.grade}__${sec}`;
    const arr = grouped.get(key) || [];
    arr.push(res);
    grouped.set(key, arr);
  }

  const rows: ClassSectionSummaryRow[] = [];
  for (const [key, list] of grouped.entries()) {
    const [grade, section] = key.split('__');
    const dist = createEmptyGradeDistribution();
    let passedCount = 0;
    let failedCount = 0;
    let appearedCount = 0;
    let pendingCount = 0;
    let passedGpaSum = 0;
    let pctSum = 0;

    for (const r of list) {
      const hasAnyMarks = (r.enteredSubjectsCount ?? 0) > 0;
      if (hasAnyMarks) {
        appearedCount += 1;
      } else {
        pendingCount += 1;
      }
      if (r.isPassed) {
        passedCount += 1;
        passedGpaSum += r.gpa;
      } else {
        failedCount += 1;
      }
      pctSum += r.obtainedPercentage ?? (r.totalFullMarks > 0 ? (r.totalObtainedMarks / r.totalFullMarks) * 100 : 0);
      incrementGradeBucket(dist, r.letterGrade);
    }

    const totalStudents = list.length;
    const denom = appearedCount > 0 ? appearedCount : totalStudents;
    rows.push({
      grade,
      section,
      totalStudents,
      appearedCount,
      pendingCount,
      passedCount,
      failedCount,
      passRate: denom > 0 ? Number(((passedCount / denom) * 100).toFixed(1)) : 0,
      avgPassedGpa: passedCount > 0 ? Number((passedGpaSum / passedCount).toFixed(2)) : 0,
      avgPercentage: totalStudents > 0 ? Number((pctSum / totalStudents).toFixed(1)) : 0,
      gradeDistribution: dist,
    });
  }

  return rows.sort((a, b) => a.section.localeCompare(b.section));
}

export interface SubjectStudentScoreRow {
  studentId: string;
  roll: string;
  studentName: string;
  gender: string;
  section: string;
  cq: number;
  mcq: number;
  practical: number;
  ca: number;
  totalMarks: number;
  fullMarks: number;
  letterGrade: string;
  gradePoint: number;
  status: 'pass' | 'fail' | 'pending';
  passModeApplied: 'total' | 'part_by_part';
  failedComponents: string[];
  deficit: number;
}

export interface SubjectWiseReport {
  subject: DynamicClassSubject;
  totalStudents: number;
  appearedCount: number;
  pendingCount: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  avgMarks: number;
  highestMarks: number;
  lowestMarks: number;
  gradeDistribution: Record<GradeBucket, number>;
  rows: SubjectStudentScoreRow[];
}

export function buildSubjectWiseReport(params: {
  examId: string;
  grade: string;
  branch: string;
  group: string;
  subject: DynamicClassSubject;
  students: Student[];
  passMode?: PassEvaluationMode;
}): SubjectWiseReport {
  const { examId, grade, branch, group, subject, students, passMode = 'curriculum' } = params;
  const fullMarks = Number(subject.fullMarks) || 100;
  const minPass = Number(subject.passMarks) || Math.round(fullMarks * 0.33);
  const dist = createEmptyGradeDistribution();
  const rows: SubjectStudentScoreRow[] = [];

  let appearedCount = 0;
  let pendingCount = 0;
  let passedCount = 0;
  let failedCount = 0;
  let totalScoreSum = 0;
  let highestMarks = 0;
  let lowestMarks = Number.MAX_SAFE_INTEGER;

  const sortedStudents = [...students].sort(
    (a, b) => parseNumericRoll(a.roll) - parseNumericRoll(b.roll),
  );

  for (const st of sortedStudents) {
    const rel = getStudentReligion(st);
    const effectiveGroup = grade === '9th' || grade === '10th' ? (st.group || group || 'বিজ্ঞান') : 'সাধারণ';

    // Strict check supporting subject code "0" without falsy fallback bugs
    const lookupIdentifier =
      subject.code !== undefined && subject.code !== null && String(subject.code).trim() !== ''
        ? String(subject.code)
        : subject.name;

    const retrieved = getUniversalStudentMark({
      exam: examId,
      grade,
      branch: st.section || st.branch || branch,
      group: effectiveGroup,
      subjectCodeOrName: isReligionSubject(`${subject.code} ${subject.name}`)
        ? subject.name
        : lookupIdentifier,
      studentRoll: st.roll,
      studentId: st.id,
      studentName: st.name,
      religion: rel,
    });

    if (!retrieved.hasMarks) {
      pendingCount += 1;
      rows.push({
        studentId: st.id,
        roll: st.roll,
        studentName: st.name,
        gender: st.gender || '',
        section: st.section || st.branch || branch,
        cq: 0,
        mcq: 0,
        practical: 0,
        ca: 0,
        totalMarks: 0,
        fullMarks,
        letterGrade: '-',
        gradePoint: 0,
        status: 'pending',
        passModeApplied: passMode === 'total' ? 'total' : 'part_by_part',
        failedComponents: [],
        deficit: 0,
      });
      continue;
    }

    appearedCount += 1;
    const evalRes = evaluateSubjectGradeAndPass(retrieved, subject, passMode);
    if (evalRes.isPassed) {
      passedCount += 1;
    } else {
      failedCount += 1;
    }

    totalScoreSum += retrieved.total;
    if (retrieved.total > highestMarks) highestMarks = retrieved.total;
    if (retrieved.total < lowestMarks) lowestMarks = retrieved.total;
    incrementGradeBucket(dist, evalRes.letterGrade);

    rows.push({
      studentId: st.id,
      roll: st.roll,
      studentName: st.name,
      gender: st.gender || '',
      section: st.section || st.branch || branch,
      cq: retrieved.cq,
      mcq: retrieved.mcq,
      practical: retrieved.practical,
      ca: retrieved.ca,
      totalMarks: retrieved.total,
      fullMarks,
      letterGrade: evalRes.letterGrade,
      gradePoint: evalRes.gradePoint,
      status: evalRes.isPassed ? 'pass' : 'fail',
      passModeApplied: evalRes.passModeApplied,
      failedComponents: evalRes.failedComponents,
      deficit: evalRes.isPassed ? 0 : Math.max(0, minPass - retrieved.total),
    });
  }

  return {
    subject,
    totalStudents: sortedStudents.length,
    appearedCount,
    pendingCount,
    passedCount,
    failedCount,
    passRate: appearedCount > 0 ? Number(((passedCount / appearedCount) * 100).toFixed(1)) : 0,
    avgMarks: appearedCount > 0 ? Number((totalScoreSum / appearedCount).toFixed(2)) : 0,
    highestMarks: appearedCount > 0 ? highestMarks : 0,
    lowestMarks: appearedCount > 0 && lowestMarks !== Number.MAX_SAFE_INTEGER ? lowestMarks : 0,
    gradeDistribution: dist,
    rows,
  };
}

export interface AllSubjectsSummaryRow {
  subject: DynamicClassSubject;
  presentCount: number;
  pendingCount: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  tier: 'strong' | 'moderate' | 'critical';
  avgMarks: number;
  highestMarks: number;
  lowestMarks: number;
  gradeDistribution: Record<GradeBucket, number>;
}

export interface AllSubjectsSummaryAggregate {
  totalStudents: number;
  totalSubjects: number;
  avgAttendanceRate: number;
  avgPassRate: number;
  strongestSubject: AllSubjectsSummaryRow | null;
  weakestSubject: AllSubjectsSummaryRow | null;
  rows: AllSubjectsSummaryRow[];
}

export function buildAllSubjectsSummary(params: {
  examId: string;
  grade: string;
  branch: string;
  group: string;
  subjects: DynamicClassSubject[];
  students: Student[];
  passMode?: PassEvaluationMode;
}): AllSubjectsSummaryAggregate {
  const { examId, grade, branch, group, subjects, students, passMode = 'curriculum' } = params;
  const rows: AllSubjectsSummaryRow[] = subjects.map((subject) => {
    const rep = buildSubjectWiseReport({
      examId,
      grade,
      branch,
      group,
      subject,
      students,
      passMode,
    });
    const tier: 'strong' | 'moderate' | 'critical' =
      rep.passRate >= 80 ? 'strong' : rep.passRate >= 50 ? 'moderate' : 'critical';

    return {
      subject,
      presentCount: rep.appearedCount,
      pendingCount: rep.pendingCount,
      passedCount: rep.passedCount,
      failedCount: rep.failedCount,
      passRate: rep.passRate,
      tier,
      avgMarks: rep.avgMarks,
      highestMarks: rep.highestMarks,
      lowestMarks: rep.lowestMarks,
      gradeDistribution: rep.gradeDistribution,
    };
  });

  const totalStudents = students.length;
  const totalSubjects = rows.length;
  const activeRows = rows.filter((r) => r.presentCount > 0);

  const avgAttendanceRate =
    totalStudents > 0 && totalSubjects > 0
      ? Number(
          (
            (rows.reduce((sum, r) => sum + r.presentCount, 0) / (totalStudents * totalSubjects)) *
            100
          ).toFixed(1),
        )
      : 0;

  const avgPassRate =
    activeRows.length > 0
      ? Number((activeRows.reduce((sum, r) => sum + r.passRate, 0) / activeRows.length).toFixed(1))
      : 0;

  const sortedByPerf = [...activeRows].sort((a, b) => {
    if (b.passRate !== a.passRate) return b.passRate - a.passRate;
    return b.avgMarks - a.avgMarks;
  });

  return {
    totalStudents,
    totalSubjects,
    avgAttendanceRate,
    avgPassRate,
    strongestSubject: sortedByPerf[0] || null,
    weakestSubject: sortedByPerf.length > 1 ? sortedByPerf[sortedByPerf.length - 1] : null,
    rows,
  };
}

/**
 * Filter students matching selected grade, branch/section, and group consistently.
 */
export function filterStudentsForCohort(
  allStudents: Student[],
  grade: string,
  branch: string,
  group: string,
): Student[] {
  const isClass9or10 = grade === '9th' || grade === '10th';
  const gradeBnMap: Record<string, string> = {
    '6th': '৬ষ্ঠ শ্রেণি',
    '7th': '৭ম শ্রেণি',
    '8th': '৮ম শ্রেণি',
    '9th': '৯ম শ্রেণি',
    '10th': '১০ম শ্রেণি',
  };
  const targetGradeBn = gradeBnMap[grade] || grade;
  const gradeNum = grade.replace(/\D/g, '');

  const normalized = allStudents.filter((st) => {
    const sGrade = String(st.grade || st.gradeBn || '').trim();
    const sSec = String(st.section || st.branch || 'A').trim();
    const sGroup = String(st.group || 'সাধারণ').trim();

    const matchedGrade =
      sGrade === grade ||
      sGrade === targetGradeBn ||
      (gradeNum ? sGrade.includes(gradeNum) : false) ||
      (grade === '6th' && (sGrade.includes('৬') || sGrade.toLowerCase().includes('six'))) ||
      (grade === '7th' && (sGrade.includes('৭') || sGrade.toLowerCase().includes('seven'))) ||
      (grade === '8th' && (sGrade.includes('৮') || sGrade.toLowerCase().includes('eight'))) ||
      (grade === '9th' && (sGrade.includes('৯') || sGrade.toLowerCase().includes('nine'))) ||
      (grade === '10th' && (sGrade.includes('১০') || sGrade.toLowerCase().includes('ten')));

    const bLower = branch.toLowerCase().trim();
    const sSecLower = sSec.toLowerCase().trim();
    const matchedSection =
      !branch ||
      bLower === 'all' ||
      sSecLower === bLower ||
      (bLower === 'a' && (sSecLower === 'ক' || sSecLower.includes('section a') || sSecLower.includes('শাখা a'))) ||
      (bLower === 'b' && (sSecLower === 'খ' || sSecLower.includes('section b') || sSecLower.includes('শাখা b'))) ||
      (bLower === 'c' && (sSecLower === 'গ' || sSecLower.includes('section c') || sSecLower.includes('শাখা c')));

    let matchedGroup = true;
    if (isClass9or10 && group && group !== 'সকল' && group !== 'all') {
      const gLower = group.toLowerCase();
      const sGrpLower = sGroup.toLowerCase();
      matchedGroup =
        sGrpLower === gLower ||
        sGrpLower.includes(gLower) ||
        (gLower.includes('বিজ্ঞান') && sGrpLower.includes('science')) ||
        (gLower.includes('মানবিক') && (sGrpLower.includes('humanities') || sGrpLower.includes('arts'))) ||
        ((gLower.includes('ব্যবসায়') || gLower.includes('ব্যবসায়')) &&
          (sGrpLower.includes('commerce') || sGrpLower.includes('business')));
    }

    return matchedGrade && matchedSection && matchedGroup;
  });

  return normalized.sort((a, b) => parseNumericRoll(a.roll) - parseNumericRoll(b.roll));
}

export function computeCohortSnapshot(params: {
  examId: string;
  grade: string;
  branch: string;
  group: string;
  allStudents: Student[];
  passMode?: PassEvaluationMode;
  tieBreakerRules?: TieBreakerRule[];
  subjectOrderCodes?: string[];
  specialConsideredIds?: string[];
}): {
  cohortStudents: Student[];
  subjects: DynamicClassSubject[];
  rankedResults: RankedStudentResult[];
  subjectHighestMap: Record<string, number>;
  classSummaryRows: ClassSectionSummaryRow[];
  allSubjectsSummary: AllSubjectsSummaryAggregate;
} {
  const {
    examId,
    grade,
    branch,
    group,
    allStudents,
    passMode = 'curriculum',
    tieBreakerRules = DEFAULT_TIE_BREAKER_RULES,
    subjectOrderCodes = [],
    specialConsideredIds = [],
  } = params;

  const isClass9or10 = grade === '9th' || grade === '10th';
  const effectiveGroup = isClass9or10 ? group || 'বিজ্ঞান' : 'সাধারণ';
  const cohortStudents = filterStudentsForCohort(allStudents, grade, branch, effectiveGroup);
  const baseSubjects = getActiveCurriculumSubjects(grade, effectiveGroup);
  const subjects = applySubjectOrder(baseSubjects, subjectOrderCodes);

  const rawResults: StudentExamResult[] = [];
  const studentMap = new Map<string, Student>();

  for (const st of cohortStudents) {
    studentMap.set(st.id, st);
    const res = resultService.calculateStudentResult({
      examId,
      student: st,
      grade,
      branch: st.section || st.branch || (branch === 'all' ? 'A' : branch),
      group: effectiveGroup,
      passMode,
      customSubjects: subjects,
    });
    if (res) {
      rawResults.push(res);
    }
  }

  const rankedResults = sortStudentResults(rawResults, tieBreakerRules, specialConsideredIds).map(
    (r) => ({
      ...r,
      studentObj: studentMap.get(r.studentId),
      gender: studentMap.get(r.studentId)?.gender || '',
    }),
  );

  // Highest mark map across cohort per subject code & name
  const subjectHighestMap: Record<string, number> = {};
  for (const res of rankedResults) {
    for (const entry of Object.values(res.subjectMarks)) {
      const prevCodeMax = subjectHighestMap[entry.subjectCode] ?? 0;
      if (entry.totalMarks > prevCodeMax) {
        subjectHighestMap[entry.subjectCode] = entry.totalMarks;
      }
      const prevNameMax = subjectHighestMap[entry.subjectName] ?? 0;
      if (entry.totalMarks > prevNameMax) {
        subjectHighestMap[entry.subjectName] = entry.totalMarks;
      }
    }
    if (res.optionalSubjectMark) {
      const opt = res.optionalSubjectMark;
      const prevMax = subjectHighestMap[opt.subjectName] ?? 0;
      if (opt.totalMarks > prevMax) {
        subjectHighestMap[opt.subjectName] = opt.totalMarks;
      }
    }
  }

  const classSummaryRows = buildClassSectionSummary(rankedResults);
  const allSubjectsSummary = buildAllSubjectsSummary({
    examId,
    grade,
    branch: branch === 'all' ? 'A' : branch,
    group: effectiveGroup,
    subjects,
    students: cohortStudents,
    passMode,
  });

  return {
    cohortStudents,
    subjects,
    rankedResults,
    subjectHighestMap,
    classSummaryRows,
    allSubjectsSummary,
  };
}

export interface PopulatedCohort {
  grade: string;
  branch: string;
  group: string;
  count: number;
}

const STANDARD_GRADES = ['6th', '7th', '8th', '9th', '10th'] as const;

/**
 * Discovers populated (grade, branch, group) cohorts from enrolled students
 * so Result Studio can auto-select real data and show live student counts.
 */
export function getPopulatedCohorts(allStudents: Student[]): {
  cohorts: PopulatedCohort[];
  gradeCounts: Record<string, number>;
} {
  const gradeCounts: Record<string, number> = {
    '6th': 0,
    '7th': 0,
    '8th': 0,
    '9th': 0,
    '10th': 0,
  };

  for (const g of STANDARD_GRADES) {
    gradeCounts[g] = filterStudentsForCohort(allStudents, g, 'all', 'সকল').length;
  }

  const cohorts: PopulatedCohort[] = [];
  for (const g of STANDARD_GRADES) {
    if (gradeCounts[g] === 0) continue;
    if (g === '9th' || g === '10th') {
      for (const grp of ['বিজ্ঞান', 'মানবিক', 'ব্যবসায় শিক্ষা']) {
        const branchName = grp === 'বিজ্ঞান' ? 'Science' : grp === 'মানবিক' ? 'Humanities' : 'Commerce';
        const cnt = filterStudentsForCohort(allStudents, g, 'all', grp).length;
        if (cnt > 0) cohorts.push({ grade: g, branch: branchName, group: grp, count: cnt });
      }
    } else {
      for (const sec of ['A', 'B', 'C']) {
        const cnt = filterStudentsForCohort(allStudents, g, sec, 'সাধারণ').length;
        if (cnt > 0) cohorts.push({ grade: g, branch: sec, group: 'সাধারণ', count: cnt });
      }
    }
  }

  return { cohorts, gradeCounts };
}
