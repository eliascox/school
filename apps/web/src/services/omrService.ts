/**
 * OMR Exam Session, Universal Class 6–10 Curriculum Sync, Auto-Routing
 * by 3-Digit Subject Code + Class + Group, Student-Wise Persistence,
 * Item Analysis, and Lossless Mark-Entry Synchronization Service (v2).
 */

import {
  OmrColorTheme,
  OmrOptionStyle,
  OmrPaperFormat,
  OmrTemplateId,
  OMR_SET_LABELS,
  clampOmrQuestionCount,
  recommendTemplateForMcqCount,
  toAsciiDigits,
} from '@/lib/omr/omrTemplates';
import type { BubbleChoiceStatus, OmrDecodeResult } from '@/lib/omr/omrVisionEngine';
import { studentService, Student } from './studentService';
import { sortStudentsGroupAndRoll } from './studentBulkImportEngine';
import { filterStudentsBySubjectReligion, getStudentReligion, isReligionSubject } from '@/lib/religionUtils';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import { curriculumService } from './curriculumService';
import { SUBJECT_SYNONYMS, getAllSubjectAliases } from '@/lib/markStorageUtils';
import { auditTrailService } from './auditTrailService';
import { syncQueueService } from './syncQueueService';

export const OMR_SESSIONS_STORAGE_KEY = 'sms_omr_sessions';
export const OMR_SCANS_STORAGE_KEY = 'sms_omr_scans';

export interface OmrCurriculumSubjectOption {
  code: string;
  name: string;
  nameEn?: string;
  mcqMax: number;
  category: string;
  group: string;
  isReligion: boolean;
}

export interface OmrExamSession {
  id: string;
  examId: string;
  examTitle: string;
  academicYear: string;
  grade: string; // '6th' | '7th' | '8th' | '9th' | '10th'
  branch: string; // 'A' | 'B' | 'C' | 'Science' | 'Humanities' | 'Commerce'
  group: string; // 'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা'
  subjectCode: string;
  subjectName: string;
  subjectMcqMax: number; // NCTB max MCQ marks (e.g. 25 or 30), or custom
  templateId: OmrTemplateId;
  paperFormat: OmrPaperFormat; // 'legal_half' (default) | 'a5' | 'a4'
  questionCount: number; // dynamic 10..100
  rollDigits: number; // 2..6
  optionStyle: OmrOptionStyle; // 'bn' | 'en'
  setCount: 1 | 4;
  colorTheme: OmrColorTheme;
  markPerCorrect: number;
  negativeMark: number;
  /** Map of setCode ('default' or 'ক'/'খ'/'গ'/'ঘ' or 'A'/'B'/'C'/'D') -> Array<0|1|2|3|null> */
  answerKeys: Record<string, Array<number | null>>;
  /** Optional lock flag preventing accidental Answer Key edits during scanning */
  isKeyLocked?: boolean;
  /** Optional teacher note about this Answer Key (e.g., revision note or paper set reference) */
  keyNote?: string;
  /** Name of the admin/teacher who last edited or locked the Answer Key */
  keyUpdatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OmrStoredQuestionAnswer {
  questionNumber: number; // 1-based
  selectedIndex: number | null; // 0..3 or null
  filledIndices: number[];
  status: BubbleChoiceStatus;
  confidence: number;
  correctIndex: number | null;
  outcome: 'correct' | 'wrong' | 'blank' | 'double' | 'unkeyed';
}

export type OmrStudentMatchStatus = 'matched' | 'unmatched';

export interface OmrScanRecord {
  id: string;
  sessionId: string;
  examTitle: string;
  grade: string;
  branch: string;
  group: string;
  subjectCode: string;
  subjectName: string;
  studentId: string | null;
  studentName: string;
  studentRoll: string; // Normalized clean roll (e.g. "05" or "5")
  decodedRollRaw: string; // Raw digits from OMR (e.g. "005" or "0?5")
  /** Auto-decoded identity fields from the sheet */
  decodedSubjectCodeRaw?: string;
  decodedGrade?: string | null;
  decodedGroup?: string | null;
  autoRouted?: boolean;
  matchStatus: OmrStudentMatchStatus;
  setCode: string; // 'default' or 'ক'/'খ'/'গ'/'ঘ' or 'A'/'B'/'C'/'D'
  setIndex: number | null;
  answers: OmrStoredQuestionAnswer[];
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  doubleCount: number;
  uncertainCount: number;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  isPassedMcq: boolean;
  needsReview: boolean;
  overallConfidence: number;
  syncedToMarkEntry: boolean;
  syncedAt?: string;
  scannedAt: string;
  scannedBy: string;
  sourceType: 'camera' | 'image' | 'pdf' | 'manual';
  /** Compact local JPEG preview of perspective-warped sheet (stripped before cloud sync) */
  warpedThumbnail?: string;
}

export interface OmrClassRosterRow {
  student: Student;
  scan: OmrScanRecord | null;
}

export interface OmrQuestionItemStat {
  questionNumber: number;
  correctOption: number | null;
  totalScanned: number;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  doubleCount: number;
  accuracyPercent: number;
  optionCounts: [number, number, number, number];
}

export interface OmrSaveScanOutcome {
  status: 'saved' | 'updated' | 'duplicate_conflict';
  record: OmrScanRecord;
  existingRecord?: OmrScanRecord;
  targetSession: OmrExamSession;
  autoRouted: boolean;
  routingSummaryBn?: string;
}

export interface OmrMarkSyncReport {
  syncedCount: number;
  skippedUnmatchedCount: number;
  totalClassStudents: number;
  storageKeysWritten: string[];
}

export interface OmrSetReadinessSummary {
  setCode: string;
  filled: number;
  total: number;
  isComplete: boolean;
}

export interface OmrSubjectKeyReadiness {
  subjectCode: string;
  subjectName: string;
  defaultMcqMax: number;
  category: string;
  subjectGroup: string;
  sessionId: string | null;
  questionCount: number;
  setCount: 1 | 4;
  optionStyle: OmrOptionStyle;
  markPerCorrect: number;
  negativeMark: number;
  setSummaries: OmrSetReadinessSummary[];
  completedSetCount: number;
  totalSetCount: number;
  totalFilledAcrossSets: number;
  status: 'complete' | 'partial' | 'empty';
  isKeyLocked: boolean;
  keyNote: string;
  scannedCount: number;
  updatedAt: string | null;
}

export interface OmrSiblingScopeDescriptor {
  branch: string;
  group: string;
  labelBn: string;
}

export interface OmrSiblingScopeSyncResult {
  updatedCount: number;
  targetLabelsBn: string[];
}

export interface OmrAnswerKeyBackupEntry {
  examTitle: string;
  academicYear: string;
  grade: string;
  branch: string;
  group: string;
  subjectCode: string;
  subjectName: string;
  subjectMcqMax: number;
  questionCount: number;
  paperFormat: OmrPaperFormat;
  rollDigits: number;
  optionStyle: OmrOptionStyle;
  setCount: 1 | 4;
  markPerCorrect: number;
  negativeMark: number;
  answerKeys: Record<string, Array<number | null>>;
  isKeyLocked?: boolean;
  keyNote?: string;
}

export interface OmrAnswerKeyBackupBundle {
  schemaVersion: 1;
  exportedAt: string;
  examTitleFilter?: string;
  gradeFilter?: string;
  entries: OmrAnswerKeyBackupEntry[];
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export const OMR_GRADE_LABELS_BN: Record<string, string> = {
  '6th': '৬ষ্ঠ শ্রেণি',
  '7th': '৭ম শ্রেণি',
  '8th': '৮ম শ্রেণি',
  '9th': '৯ম শ্রেণি',
  '10th': '১০ম শ্রেণি',
};

export function normalizeRollNumeric(roll: string | number | null | undefined): string {
  const ascii = toAsciiDigits(String(roll ?? '')).trim();
  const digits = ascii.replace(/\D/g, '');
  if (!digits) return ascii;
  const num = parseInt(digits, 10);
  return Number.isFinite(num) ? String(num) : digits;
}

export function normalizeSubjectCode3Digit(code: string | number | null | undefined): string {
  const digits = toAsciiDigits(String(code ?? '')).replace(/\D/g, '');
  if (!digits) return '';
  return digits.slice(-3).padStart(3, '0');
}

export function normalizeGroupToBn(grade: string, group?: string, branch?: string): string {
  const is9or10 = grade === '9th' || grade === '10th';
  if (!is9or10) return 'সাধারণ';
  const raw = `${group || ''} ${branch || ''}`.toLowerCase();
  if (raw.includes('মানবিক') || raw.includes('humanities')) return 'মানবিক';
  if (raw.includes('ব্যবসা') || raw.includes('commerce') || raw.includes('business')) return 'ব্যবসায় শিক্ষা';
  return 'বিজ্ঞান';
}

export function normalizeGroupToBranch(grade: string, groupBn: string, fallbackBranch = 'A'): string {
  if (grade === '9th' || grade === '10th') {
    if (groupBn === 'মানবিক') return 'Humanities';
    if (groupBn === 'ব্যবসায় শিক্ষা' || groupBn === 'ব্যবসায় শিক্ষা') return 'Commerce';
    return 'Science';
  }
  if (['Science', 'Humanities', 'Commerce'].includes(fallbackBranch)) return 'A';
  return fallbackBranch || 'A';
}

export function normalizeGroupToCode(grade: string, group?: string, branch?: string): 'science' | 'humanities' | 'commerce' | 'সাধারণ' {
  const bn = normalizeGroupToBn(grade, group, branch);
  if (bn === 'বিজ্ঞান') return 'science';
  if (bn === 'মানবিক') return 'humanities';
  if (bn === 'ব্যবসায় শিক্ষা') return 'commerce';
  return 'সাধারণ';
}

export function getSessionSetCodes(session: Pick<OmrExamSession, 'setCount' | 'optionStyle'>): string[] {
  if (session.setCount === 1) return ['default'];
  return [...OMR_SET_LABELS[session.optionStyle === 'en' ? 'en' : 'bn']];
}

export function createEmptyAnswerKeys(
  questionCount: number,
  setCount: 1 | 4,
  optionStyle: OmrOptionStyle,
): Record<string, Array<number | null>> {
  const count = clampOmrQuestionCount(questionCount, 30);
  const keys: Record<string, Array<number | null>> = {};
  const codes = setCount === 1 ? ['default'] : [...OMR_SET_LABELS[optionStyle]];
  for (const code of codes) {
    keys[code] = Array.from({ length: count }, () => null);
  }
  return keys;
}

/**
 * Universal Class 6–10 Curriculum Sync for OMR Studio.
 *
 * Combines `curriculumService.getCurriculumList()` (custom + NCTB subjects)
 * and `getActiveCurriculumSubjects(grade, group)` so EVERY compulsory,
 * group-specific (Science/Humanities/Business Studies), Islam (111), Hindu (112),
 * 4th/optional, and custom-added subject is available in real time —
 * including subjects with `mcq: 0` for custom MCQ class/model tests.
 * (Excludes Buddhist 113 & Christian 114 unless explicitly added by the school.)
 */
export function getAllOmrCurriculumSubjects(
  grade: string,
  group?: string,
): OmrCurriculumSubjectOption[] {
  const is9or10 = grade === '9th' || grade === '10th';
  const groupBn = normalizeGroupToBn(grade, group);
  const groupCode = normalizeGroupToCode(grade, group);

  const rawList = curriculumService.getCurriculumList();
  const gradeMatches = rawList.filter((item) => {
    const g = String(item.grade || '').toLowerCase();
    return (
      g === grade.toLowerCase() ||
      (grade === '6th' && (g.includes('6') || g.includes('৬'))) ||
      (grade === '7th' && (g.includes('7') || g.includes('৭'))) ||
      (grade === '8th' && (g.includes('8') || g.includes('৮'))) ||
      (grade === '9th' && (g.includes('9') || g.includes('৯'))) ||
      (grade === '10th' && (g.includes('10') || g.includes('১০')))
    );
  });

  const filterByGroup = (itemGroupRaw: string): boolean => {
    if (!is9or10) return true;
    const itemGroup = (itemGroupRaw || '').replace('ব্যবসায়', 'ব্যবসায়').trim();
    if (!itemGroup || itemGroup === 'সাধারণ' || itemGroup === 'সকল') return true;
    if (
      itemGroup.includes('মানবিক ও ব্যবসায়') &&
      (groupBn === 'মানবিক' || groupBn === 'ব্যবসায় শিক্ষা')
    ) {
      return true;
    }
    return itemGroup === groupBn || itemGroup.includes(groupBn);
  };

  const result: OmrCurriculumSubjectOption[] = [];
  const seenCodes = new Set<string>();
  const seenNames = new Set<string>();

  const pushUnique = (opt: OmrCurriculumSubjectOption) => {
    const cleanCode = String(opt.code || '').trim();
    const cleanName = String(opt.name || '').trim();
    if (!cleanName) return;
    // Skip Buddhist (113) & Christian (114) default noise if not explicitly custom-configured
    if (cleanCode && seenCodes.has(cleanCode)) return;
    if (seenNames.has(cleanName.toLowerCase())) return;
    if (cleanCode) seenCodes.add(cleanCode);
    seenNames.add(cleanName.toLowerCase());
    result.push({ ...opt, code: cleanCode || cleanName, name: cleanName });
  };

  // 1. Primary source: live Curriculum Manager subjects (includes custom subjects & both 111 Islam + 112 Hindu!)
  for (const item of gradeMatches) {
    if (!filterByGroup(item.group)) continue;
    const code = String(item.code || '').trim();
    // Skip 113/114 unless school intentionally customized it
    if (code === '113' || code === '114') continue;
    const mcqNum = typeof item.mcq === 'number' ? item.mcq : Number(item.mcq) || 0;
    const isRel =
      item.subjectType === 'religion' ||
      isReligionSubject(`${code} ${item.name}`);

    pushUnique({
      code,
      name: item.name,
      nameEn: item.nameEn,
      mcqMax: mcqNum,
      category: item.category || 'আবশ্যিক',
      group: item.group || (is9or10 ? groupBn : 'সাধারণ'),
      isReligion: isRel,
    });
  }

  // 2. Supplement with active curriculum defaults (in case custom storage had sparse subset)
  const activeDefaults = getActiveCurriculumSubjects(grade, groupCode, undefined, 'Muslim');
  for (const sub of activeDefaults) {
    const code = String(sub.code || '').trim();
    if (code === '113' || code === '114') continue;
    const isRel = isReligionSubject(`${code} ${sub.name}`);
    pushUnique({
      code,
      name: sub.name,
      nameEn: sub.nameEn,
      mcqMax: Number(sub.mcq) || 0,
      category: sub.category || 'আবশ্যিক',
      group: sub.group || (is9or10 ? groupBn : 'সাধারণ'),
      isReligion: isRel,
    });
  }

  // 3. Ensure Hindu Religion (112) is always selectable alongside Islam (111)
  if (!seenCodes.has('112')) {
    pushUnique({
      code: '112',
      name: 'হিন্দুধর্ম ও নৈতিক শিক্ষা',
      nameEn: 'Hindu Religion & Moral Education',
      mcqMax: is9or10 ? 30 : 0,
      category: 'আবশ্যিক',
      group: 'সাধারণ',
      isReligion: true,
    });
  }

  return result;
}

/**
 * Resolves a 3-digit subject code (e.g. "136", "101", "154") against the school's
 * live Class 6–10 Curriculum + `markStorageUtils.ts` alias dictionary.
 */
export function resolveOmrSubjectByCode(
  grade: string,
  preferredGroup: string,
  rawCode: string,
): { subject: OmrCurriculumSubjectOption; inferredGroup: string } | null {
  const digits = normalizeSubjectCode3Digit(rawCode);
  if (!digits || digits.includes('?')) return null;

  const is9or10 = grade === '9th' || grade === '10th';
  const normalizedPrefGroup = normalizeGroupToBn(grade, preferredGroup);

  const groupsToSearch = is9or10
    ? Array.from(new Set([normalizedPrefGroup, 'বিজ্ঞান', 'মানবিক', 'ব্যবসায় শিক্ষা']))
    : ['সাধারণ'];

  // 1. Direct code match in preferred group first, then other groups
  for (const grp of groupsToSearch) {
    const subjects = getAllOmrCurriculumSubjects(grade, grp);
    const exact = subjects.find((s) => normalizeSubjectCode3Digit(s.code) === digits);
    if (exact) {
      // If subject is compulsory ('সাধারণ'), keep caller's preferredGroup; if group-specific, infer group
      const subGroupClean = (exact.group || '').replace('ব্যবসায়', 'ব্যবসায়');
      const inferred =
        !is9or10
          ? 'সাধারণ'
          : subGroupClean === 'বিজ্ঞান' || subGroupClean === 'মানবিক' || subGroupClean === 'ব্যবসায় শিক্ষা'
            ? subGroupClean
            : normalizedPrefGroup;
      return { subject: exact, inferredGroup: inferred };
    }
  }

  // 2. Fallback via SUBJECT_SYNONYMS alias table from markStorageUtils.ts
  for (const syn of Object.values(SUBJECT_SYNONYMS)) {
    const hasCode = syn.codes.some((c) => normalizeSubjectCode3Digit(c) === digits);
    if (!hasCode) continue;
    for (const grp of groupsToSearch) {
      const subjects = getAllOmrCurriculumSubjects(grade, grp);
      const aliasHit = subjects.find((s) =>
        syn.names.some((n) => s.name.toLowerCase().includes(n.toLowerCase())),
      );
      if (aliasHit) {
        return { subject: aliasHit, inferredGroup: is9or10 ? grp : 'সাধারণ' };
      }
    }
  }

  return null;
}

/**
 * Computes sibling scopes that share the exact same question paper / Answer Key:
 *  - Class 6–8: sibling sections ('A' | 'B' | 'C') other than the active branch
 *  - Class 9–10: sibling groups ('বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা') that also offer this subject
 */
export function getSiblingScopesForSession(
  session: Pick<OmrExamSession, 'grade' | 'branch' | 'group' | 'subjectCode' | 'subjectName'>,
): OmrSiblingScopeDescriptor[] {
  const is9or10 = session.grade === '9th' || session.grade === '10th';
  if (!is9or10) {
    const currentBranch = session.branch || 'A';
    return ['A', 'B', 'C']
      .filter((b) => b !== currentBranch)
      .map((b) => ({
        branch: b,
        group: 'সাধারণ',
        labelBn: `শাখা ${b}`,
      }));
  }

  const currentGroup = normalizeGroupToBn(session.grade, session.group, session.branch);
  const targetCodeNorm = normalizeSubjectCode3Digit(session.subjectCode);
  const targetNameNorm = (session.subjectName || '').trim().toLowerCase();
  const siblingGroups: Array<'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা'> = [
    'বিজ্ঞান',
    'মানবিক',
    'ব্যবসায় শিক্ষা',
  ].filter((g): g is 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা' => g !== currentGroup);

  const scopes: OmrSiblingScopeDescriptor[] = [];
  for (const grp of siblingGroups) {
    const grpSubjects = getAllOmrCurriculumSubjects(session.grade, grp);
    const hasMatch = grpSubjects.some(
      (s) =>
        s.name.trim().toLowerCase() === targetNameNorm ||
        (Boolean(targetCodeNorm) && normalizeSubjectCode3Digit(s.code) === targetCodeNorm),
    );
    if (hasMatch) {
      scopes.push({
        branch: normalizeGroupToBranch(session.grade, grp),
        group: grp,
        labelBn: grp,
      });
    }
  }
  return scopes;
}

export function getEligibleStudentsForSession(
  session: Pick<OmrExamSession, 'grade' | 'branch' | 'group' | 'subjectName'>,
): Student[] {
  const targetGroupBn = normalizeGroupToBn(session.grade, session.group, session.branch);
  const effectiveBranch = normalizeGroupToBranch(session.grade, targetGroupBn, session.branch);

  let students = studentService.getStudentsByFilter(session.grade, effectiveBranch, targetGroupBn);
  if (students.length === 0 && (session.grade === '9th' || session.grade === '10th')) {
    students = studentService.getStudentsByFilter(session.grade, 'all', targetGroupBn);
  }
  // Strictly guard 9th–10th group isolation so Science Roll 1 NEVER matches Humanities Roll 1
  if (session.grade === '9th' || session.grade === '10th') {
    students = students.filter((st) => {
      const stGroupBn = normalizeGroupToBn(session.grade, st.group, st.section || st.branch);
      return stGroupBn === targetGroupBn;
    });
  }
  students = filterStudentsBySubjectReligion(students, session.subjectName);
  return sortStudentsGroupAndRoll(students, 'roll_asc');
}

export function matchStudentByRollForSession(
  session: Pick<OmrExamSession, 'grade' | 'branch' | 'group' | 'subjectName'>,
  rawRoll: string,
  explicitStudentId?: string | null,
): { student: Student | null; normalizedRoll: string } {
  const eligible = getEligibleStudentsForSession(session);

  if (explicitStudentId) {
    const byId = eligible.find((s) => s.id === explicitStudentId);
    if (byId) {
      return { student: byId, normalizedRoll: String(byId.roll).trim() };
    }
  }

  const cleanAscii = toAsciiDigits(rawRoll || '').trim();
  if (!cleanAscii || cleanAscii.includes('?')) {
    return { student: null, normalizedRoll: cleanAscii || '?' };
  }

  const targetNum = normalizeRollNumeric(cleanAscii);
  const found = eligible.find((s) => {
    const stNum = normalizeRollNumeric(s.roll);
    return stNum !== '' && stNum === targetNum;
  });

  if (found) {
    return { student: found, normalizedRoll: String(found.roll).trim() };
  }

  return { student: null, normalizedRoll: targetNum || cleanAscii };
}

/**
 * Grades a list of question answers against the active Answer Key for the session & setCode.
 */
export function gradeOmrQuestionResponses(
  session: OmrExamSession,
  setCode: string,
  responses: Array<{
    questionNumber: number;
    selectedIndex: number | null;
    filledIndices: number[];
    status: BubbleChoiceStatus;
    confidence: number;
  }>,
): {
  answers: OmrStoredQuestionAnswer[];
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  doubleCount: number;
  uncertainCount: number;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  isPassedMcq: boolean;
} {
  const validCodes = getSessionSetCodes(session);
  const resolvedSet = validCodes.includes(setCode) ? setCode : validCodes[0];
  const answerKey = session.answerKeys[resolvedSet] || [];

  let correctCount = 0;
  let wrongCount = 0;
  let blankCount = 0;
  let doubleCount = 0;
  let uncertainCount = 0;

  const answers: OmrStoredQuestionAnswer[] = [];

  for (let i = 0; i < session.questionCount; i++) {
    const qNum = i + 1;
    const resp = responses[i] || {
      questionNumber: qNum,
      selectedIndex: null,
      filledIndices: [],
      status: 'blank' as BubbleChoiceStatus,
      confidence: 1,
    };
    const correctIndex = answerKey[i] !== undefined ? answerKey[i] : null;
    if (resp.status === 'uncertain') uncertainCount++;

    let outcome: OmrStoredQuestionAnswer['outcome'] = 'blank';
    if (resp.status === 'double') {
      doubleCount++;
      outcome = 'double';
    } else if (resp.selectedIndex === null) {
      blankCount++;
      outcome = 'blank';
    } else if (correctIndex === null) {
      outcome = 'unkeyed';
    } else if (resp.selectedIndex === correctIndex) {
      correctCount++;
      outcome = 'correct';
    } else {
      wrongCount++;
      outcome = 'wrong';
    }

    answers.push({
      questionNumber: qNum,
      selectedIndex: resp.selectedIndex,
      filledIndices: resp.filledIndices || (resp.selectedIndex !== null ? [resp.selectedIndex] : []),
      status: resp.status,
      confidence: resp.confidence,
      correctIndex,
      outcome,
    });
  }

  const markPerCorrect = Number(session.markPerCorrect) > 0 ? Number(session.markPerCorrect) : 1;
  const negativeMark = Math.max(0, Number(session.negativeMark) || 0);
  const rawScore = correctCount * markPerCorrect - (wrongCount + doubleCount) * negativeMark;
  const obtainedMarks = Number(Math.max(0, rawScore).toFixed(2));
  const totalMarks = Number((session.questionCount * markPerCorrect).toFixed(2));
  const percentage = totalMarks > 0 ? Number(((obtainedMarks / totalMarks) * 100).toFixed(1)) : 0;
  const passCutoff = Math.round(totalMarks * 0.33);
  const isPassedMcq = obtainedMarks >= passCutoff;

  return {
    answers,
    correctCount,
    wrongCount,
    blankCount,
    doubleCount,
    uncertainCount,
    obtainedMarks,
    totalMarks,
    percentage,
    isPassedMcq,
  };
}

// ─── SERVICE CLASS ───────────────────────────────────────────────────────────

class OmrService {
  private listeners: Array<() => void> = [];

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  private triggerCloudSync(): void {
    if (typeof window === 'undefined') return;
    const sessions = this.getSessions();
    const scans = this.getAllScans().map((scan) => {
      const rest = { ...scan };
      delete rest.warpedThumbnail;
      return rest;
    });
    import('./firebaseSyncService')
      .then(({ firebaseSyncService }) => {
        if (typeof firebaseSyncService.syncOmrStoreToCloud === 'function') {
          firebaseSyncService.syncOmrStoreToCloud(sessions, scans).catch(() => {});
        }
      })
      .catch(() => {});
  }

  // ── SESSIONS ──────────────────────────────────────────────────────────────

  public getSessions(): OmrExamSession[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(OMR_SESSIONS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((s: OmrExamSession) => ({
        ...s,
        paperFormat: s.paperFormat || (s.templateId === 'a4_100' ? 'a4' : 'legal_half'),
        questionCount: clampOmrQuestionCount(s.questionCount, 30),
      }));
    } catch {
      return [];
    }
  }

  private saveSessions(sessions: OmrExamSession[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(OMR_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    this.notify();
    this.triggerCloudSync();
  }

  public getSessionById(id: string): OmrExamSession | undefined {
    return this.getSessions().find((s) => s.id === id);
  }

  public findOrCreateSession(params: {
    examId: string;
    examTitle: string;
    academicYear?: string;
    grade: string;
    branch: string;
    group?: string;
    subjectCode: string;
    subjectName: string;
    subjectMcqMax?: number;
    questionCount?: number;
    paperFormat?: OmrPaperFormat;
    templateId?: OmrTemplateId;
    rollDigits?: number;
    optionStyle?: OmrOptionStyle;
    setCount?: 1 | 4;
    colorTheme?: OmrColorTheme;
  }): OmrExamSession {
    const groupBn = normalizeGroupToBn(params.grade, params.group, params.branch);
    const branchNorm = normalizeGroupToBranch(params.grade, groupBn, params.branch);
    const targetSubCode = normalizeSubjectCode3Digit(params.subjectCode) || params.subjectCode;

    const sessions = this.getSessions();
    const existing = sessions.find((s) => {
      const sameScope =
        s.examTitle === params.examTitle &&
        s.grade === params.grade &&
        s.branch === branchNorm &&
        s.group === groupBn;
      if (!sameScope) return false;
      if (s.subjectName === params.subjectName) return true;
      const sCodeNorm = normalizeSubjectCode3Digit(s.subjectCode);
      return Boolean(targetSubCode && sCodeNorm && sCodeNorm === targetSubCode);
    });
    if (existing) return existing;

    const mcqDefault =
      params.questionCount !== undefined
        ? clampOmrQuestionCount(params.questionCount, 30)
        : Number(params.subjectMcqMax) >= 10
          ? clampOmrQuestionCount(params.subjectMcqMax, 30)
          : 30;
    const templateId = params.templateId || recommendTemplateForMcqCount(mcqDefault);
    const paperFormat: OmrPaperFormat =
      params.paperFormat || (templateId === 'a4_100' ? 'a4' : 'legal_half');
    const optionStyle: OmrOptionStyle = params.optionStyle || 'bn';
    const setCount: 1 | 4 = params.setCount === 1 ? 1 : 4;
    const now = new Date().toISOString();

    const created: OmrExamSession = {
      id: `omr-sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      examId: params.examId || params.examTitle,
      examTitle: params.examTitle,
      academicYear: params.academicYear || String(new Date().getFullYear()),
      grade: params.grade,
      branch: branchNorm,
      group: groupBn,
      subjectCode: params.subjectCode || params.subjectName,
      subjectName: params.subjectName,
      subjectMcqMax: Number(params.subjectMcqMax) > 0 ? Number(params.subjectMcqMax) : mcqDefault,
      templateId,
      paperFormat,
      questionCount: mcqDefault,
      rollDigits: params.rollDigits ?? (paperFormat === 'a4' ? 4 : 3),
      optionStyle,
      setCount,
      colorTheme: params.colorTheme || 'pink',
      markPerCorrect: 1,
      negativeMark: 0,
      answerKeys: createEmptyAnswerKeys(mcqDefault, setCount, optionStyle),
      createdAt: now,
      updatedAt: now,
    };

    this.saveSessions([created, ...sessions]);
    return created;
  }

  public updateSessionConfig(
    sessionId: string,
    updates: Partial<
      Pick<
        OmrExamSession,
        | 'templateId'
        | 'paperFormat'
        | 'questionCount'
        | 'rollDigits'
        | 'optionStyle'
        | 'setCount'
        | 'colorTheme'
        | 'markPerCorrect'
        | 'negativeMark'
      >
    >,
  ): OmrExamSession | null {
    const sessions = this.getSessions();
    let updatedSession: OmrExamSession | null = null;

    const nextSessions = sessions.map((s) => {
      if (s.id !== sessionId) return s;

      // Determine new questionCount (explicit questionCount takes priority over templateId)
      let questionCount = s.questionCount;
      if (updates.questionCount !== undefined) {
        questionCount = clampOmrQuestionCount(updates.questionCount, s.questionCount);
      } else if (updates.templateId && updates.templateId !== 'custom') {
        const presetCounts: Record<Exclude<OmrTemplateId, 'custom'>, number> = {
          a5_25: 25,
          a5_30: 30,
          a5_40: 40,
          a5_50: 50,
          a4_100: 100,
        };
        questionCount = presetCounts[updates.templateId];
      }

      const templateId = updates.templateId || recommendTemplateForMcqCount(questionCount);
      const paperFormat = updates.paperFormat || s.paperFormat || 'legal_half';
      const optionStyle = updates.optionStyle || s.optionStyle;
      const setCount = updates.setCount ?? s.setCount;
      const validSetCodes = setCount === 1 ? ['default'] : [...OMR_SET_LABELS[optionStyle]];

      // Preserve existing answers when resizing questionCount or switching optionStyle
      const nextKeys: Record<string, Array<number | null>> = {};
      const oldCodes = Object.keys(s.answerKeys);
      validSetCodes.forEach((code, idx) => {
        const sourceArr = s.answerKeys[code] || s.answerKeys[oldCodes[idx]] || [];
        nextKeys[code] = Array.from({ length: questionCount }, (_, qIdx) =>
          qIdx < sourceArr.length ? sourceArr[qIdx] : null,
        );
      });

      updatedSession = {
        ...s,
        ...updates,
        templateId,
        paperFormat,
        questionCount,
        optionStyle,
        setCount,
        answerKeys: nextKeys,
        updatedAt: new Date().toISOString(),
      };
      return updatedSession;
    });

    if (!updatedSession) return null;
    this.saveSessions(nextSessions);
    this.regradeSessionScans(updatedSession);
    return updatedSession;
  }

  public updateAnswerKey(
    sessionId: string,
    setCode: string,
    answers: Array<number | null>,
    options?: { bypassLock?: boolean; updatedBy?: string },
  ): OmrExamSession | null {
    const sessions = this.getSessions();
    let updatedSession: OmrExamSession | null = null;
    let blockedByLock = false;

    const nextSessions = sessions.map((s) => {
      if (s.id !== sessionId) return s;
      if (s.isKeyLocked && !options?.bypassLock) {
        blockedByLock = true;
        return s;
      }
      const normalized = Array.from({ length: s.questionCount }, (_, i) => {
        const val = answers[i];
        return val === 0 || val === 1 || val === 2 || val === 3 ? val : null;
      });
      updatedSession = {
        ...s,
        answerKeys: {
          ...s.answerKeys,
          [setCode]: normalized,
        },
        keyUpdatedBy: options?.updatedBy || s.keyUpdatedBy,
        updatedAt: new Date().toISOString(),
      };
      return updatedSession;
    });

    if (blockedByLock || !updatedSession) return null;
    this.saveSessions(nextSessions);
    this.regradeSessionScans(updatedSession);
    return updatedSession;
  }

  public setAnswerKeyLock(
    sessionId: string,
    locked: boolean,
    updatedBy?: string,
  ): OmrExamSession | null {
    return this.updateSessionKeyMeta(sessionId, {
      isKeyLocked: locked,
      keyUpdatedBy: updatedBy,
    });
  }

  public updateSessionKeyMeta(
    sessionId: string,
    updates: { keyNote?: string; isKeyLocked?: boolean; keyUpdatedBy?: string },
  ): OmrExamSession | null {
    const sessions = this.getSessions();
    let updatedSession: OmrExamSession | null = null;

    const nextSessions = sessions.map((s) => {
      if (s.id !== sessionId) return s;
      updatedSession = {
        ...s,
        ...(updates.keyNote !== undefined ? { keyNote: updates.keyNote } : {}),
        ...(updates.isKeyLocked !== undefined ? { isKeyLocked: updates.isKeyLocked } : {}),
        ...(updates.keyUpdatedBy !== undefined ? { keyUpdatedBy: updates.keyUpdatedBy } : {}),
        updatedAt: new Date().toISOString(),
      };
      return updatedSession;
    });

    if (!updatedSession) return null;
    this.saveSessions(nextSessions);
    return updatedSession;
  }

  /**
   * Read-only Answer Key readiness matrix for EVERY subject of a Class + Branch/Group.
   * Deliberately does NOT auto-create empty sessions for untouched subjects.
   */
  public getSubjectKeyReadinessList(params: {
    examTitle: string;
    grade: string;
    branch: string;
    group?: string;
    subjects: Array<{
      code: string;
      name: string;
      mcqMax: number;
      category?: string;
      group?: string;
    }>;
  }): OmrSubjectKeyReadiness[] {
    const groupBn = normalizeGroupToBn(params.grade, params.group, params.branch);
    const branchNorm = normalizeGroupToBranch(params.grade, groupBn, params.branch);
    const allSessions = this.getSessions();
    const scanCounts = this.getScanCountBySession();

    const scopedSessions = allSessions.filter(
      (s) =>
        s.examTitle === params.examTitle &&
        s.grade === params.grade &&
        s.branch === branchNorm &&
        s.group === groupBn,
    );

    return params.subjects.map((sub) => {
      const subCodeNorm = normalizeSubjectCode3Digit(sub.code);
      const matched = scopedSessions.find(
        (s) =>
          s.subjectName === sub.name ||
          (Boolean(subCodeNorm) && normalizeSubjectCode3Digit(s.subjectCode) === subCodeNorm),
      );

      const questionCount = matched
        ? matched.questionCount
        : sub.mcqMax >= 10
          ? clampOmrQuestionCount(sub.mcqMax, 30)
          : 30;
      const setCount: 1 | 4 = matched ? matched.setCount : 4;
      const optionStyle: OmrOptionStyle = matched ? matched.optionStyle : 'bn';
      const validSetCodes = getSessionSetCodes({ setCount, optionStyle });

      const setSummaries: OmrSetReadinessSummary[] = validSetCodes.map((sc) => {
        const arr = matched?.answerKeys?.[sc] || [];
        let filled = 0;
        for (let i = 0; i < questionCount; i++) {
          const v = arr[i];
          if (v === 0 || v === 1 || v === 2 || v === 3) filled++;
        }
        return {
          setCode: sc,
          filled,
          total: questionCount,
          isComplete: filled === questionCount && questionCount > 0,
        };
      });

      const completedSetCount = setSummaries.filter((st) => st.isComplete).length;
      const totalFilledAcrossSets = setSummaries.reduce((acc, st) => acc + st.filled, 0);
      const status: 'complete' | 'partial' | 'empty' =
        completedSetCount === validSetCodes.length && validSetCodes.length > 0
          ? 'complete'
          : totalFilledAcrossSets > 0
            ? 'partial'
            : 'empty';

      return {
        subjectCode: sub.code || sub.name,
        subjectName: sub.name,
        defaultMcqMax: sub.mcqMax,
        category: sub.category || 'আবশ্যিক',
        subjectGroup: sub.group || groupBn,
        sessionId: matched?.id ?? null,
        questionCount,
        setCount,
        optionStyle,
        markPerCorrect: matched?.markPerCorrect ?? 1,
        negativeMark: matched?.negativeMark ?? 0,
        setSummaries,
        completedSetCount,
        totalSetCount: validSetCodes.length,
        totalFilledAcrossSets,
        status,
        isKeyLocked: Boolean(matched?.isKeyLocked),
        keyNote: matched?.keyNote || '',
        scannedCount: matched ? scanCounts[matched.id] || 0 : 0,
        updatedAt: matched?.updatedAt ?? null,
      };
    });
  }

  /**
   * Copies a prepared Answer Key (+ questionCount, setCount, optionStyle, scoring rules, note)
   * to sibling sections (Class 6-8: A/B/C) or sibling groups (Class 9-10 shared compulsory subjects),
   * and automatically re-grades any scans already recorded in those sibling sessions.
   */
  public applyAnswerKeyToSiblingScopes(
    sessionId: string,
    options?: { updatedBy?: string },
  ): OmrSiblingScopeSyncResult {
    const source = this.getSessionById(sessionId);
    if (!source) return { updatedCount: 0, targetLabelsBn: [] };

    const siblingScopes = getSiblingScopesForSession(source);
    if (siblingScopes.length === 0) {
      return { updatedCount: 0, targetLabelsBn: [] };
    }

    const sessions = this.getSessions();
    const nextSessions = [...sessions];
    const regradeTargets: OmrExamSession[] = [];
    const targetLabelsBn: string[] = [];
    const now = new Date().toISOString();
    const sourceCodeNorm = normalizeSubjectCode3Digit(source.subjectCode);

    const cloneKeys = (keys: Record<string, Array<number | null>>): Record<string, Array<number | null>> => {
      const cloned: Record<string, Array<number | null>> = {};
      for (const [k, arr] of Object.entries(keys)) {
        cloned[k] = Array.from({ length: source.questionCount }, (_, i) =>
          arr[i] === 0 || arr[i] === 1 || arr[i] === 2 || arr[i] === 3 ? arr[i] : null,
        );
      }
      return cloned;
    };

    for (const scope of siblingScopes) {
      const existingIdx = nextSessions.findIndex((s) => {
        const sameScope =
          s.examTitle === source.examTitle &&
          s.grade === source.grade &&
          s.branch === scope.branch &&
          s.group === scope.group;
        if (!sameScope) return false;
        if (s.subjectName === source.subjectName) return true;
        return Boolean(sourceCodeNorm) && normalizeSubjectCode3Digit(s.subjectCode) === sourceCodeNorm;
      });

      if (existingIdx >= 0) {
        const existing = nextSessions[existingIdx];
        const updated: OmrExamSession = {
          ...existing,
          templateId: source.templateId,
          paperFormat: source.paperFormat,
          questionCount: source.questionCount,
          rollDigits: source.rollDigits,
          optionStyle: source.optionStyle,
          setCount: source.setCount,
          colorTheme: source.colorTheme,
          markPerCorrect: source.markPerCorrect,
          negativeMark: source.negativeMark,
          answerKeys: cloneKeys(source.answerKeys),
          isKeyLocked: source.isKeyLocked,
          keyNote: source.keyNote,
          keyUpdatedBy: options?.updatedBy || source.keyUpdatedBy,
          updatedAt: now,
        };
        nextSessions[existingIdx] = updated;
        regradeTargets.push(updated);
      } else {
        const created: OmrExamSession = {
          ...source,
          id: `omr-sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          branch: scope.branch,
          group: scope.group,
          answerKeys: cloneKeys(source.answerKeys),
          keyUpdatedBy: options?.updatedBy || source.keyUpdatedBy,
          createdAt: now,
          updatedAt: now,
        };
        nextSessions.unshift(created);
        regradeTargets.push(created);
      }
      targetLabelsBn.push(scope.labelBn);
    }

    this.saveSessions(nextSessions);
    for (const target of regradeTargets) {
      this.regradeSessionScans(target);
    }

    return {
      updatedCount: targetLabelsBn.length,
      targetLabelsBn,
    };
  }

  /**
   * Exports Answer Keys as a portable versioned JSON bundle (filtered optionally by examTitle / grade).
   */
  public exportAnswerKeysBundle(filter?: {
    examTitle?: string;
    grade?: string;
  }): OmrAnswerKeyBackupBundle {
    const sessions = this.getSessions().filter((s) => {
      if (filter?.examTitle && s.examTitle !== filter.examTitle) return false;
      if (filter?.grade && s.grade !== filter.grade) return false;
      // Include sessions that have at least 1 answer set
      return Object.values(s.answerKeys || {}).some((arr) =>
        Array.isArray(arr) && arr.some((v) => v === 0 || v === 1 || v === 2 || v === 3),
      );
    });

    const entries: OmrAnswerKeyBackupEntry[] = sessions.map((s) => ({
      examTitle: s.examTitle,
      academicYear: s.academicYear,
      grade: s.grade,
      branch: s.branch,
      group: s.group,
      subjectCode: s.subjectCode,
      subjectName: s.subjectName,
      subjectMcqMax: s.subjectMcqMax,
      questionCount: s.questionCount,
      paperFormat: s.paperFormat,
      rollDigits: s.rollDigits,
      optionStyle: s.optionStyle,
      setCount: s.setCount,
      markPerCorrect: s.markPerCorrect,
      negativeMark: s.negativeMark,
      answerKeys: s.answerKeys,
      isKeyLocked: s.isKeyLocked,
      keyNote: s.keyNote,
    }));

    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      examTitleFilter: filter?.examTitle,
      gradeFilter: filter?.grade,
      entries,
    };
  }

  /**
   * Safely validates and restores a portable Answer Key JSON bundle across devices,
   * creating missing sessions or updating existing ones and re-grading any affected scans.
   */
  public importAnswerKeysBundle(
    raw: unknown,
    updatedBy?: string,
  ): { importedCount: number; updatedCount: number; skippedCount: number } {
    if (!raw || typeof raw !== 'object') {
      throw new Error('অবৈধ উত্তরপত্র ব্যাকআপ ফাইল।');
    }
    const bundle = raw as Partial<OmrAnswerKeyBackupBundle>;
    if (!Array.isArray(bundle.entries) || bundle.entries.length === 0) {
      throw new Error('ফাইলে কোনো উত্তরপত্র পাওয়া যায়নি।');
    }

    const sessions = this.getSessions();
    const nextSessions = [...sessions];
    const regradeTargets: OmrExamSession[] = [];
    const now = new Date().toISOString();

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const entry of bundle.entries) {
      if (
        !entry ||
        typeof entry !== 'object' ||
        !entry.examTitle ||
        !entry.grade ||
        !entry.subjectName ||
        !entry.answerKeys ||
        typeof entry.answerKeys !== 'object'
      ) {
        skippedCount++;
        continue;
      }

      const groupBn = normalizeGroupToBn(entry.grade, entry.group, entry.branch);
      const branchNorm = normalizeGroupToBranch(entry.grade, groupBn, entry.branch);
      const qCount = clampOmrQuestionCount(entry.questionCount, 30);
      const setCount: 1 | 4 = entry.setCount === 1 ? 1 : 4;
      const optionStyle: OmrOptionStyle = entry.optionStyle === 'en' ? 'en' : 'bn';
      const validSetCodes = getSessionSetCodes({ setCount, optionStyle });

      const cleanKeys: Record<string, Array<number | null>> = {};
      for (const code of validSetCodes) {
        const srcArr = Array.isArray(entry.answerKeys[code]) ? entry.answerKeys[code] : [];
        cleanKeys[code] = Array.from({ length: qCount }, (_, i) => {
          const val = srcArr[i];
          return val === 0 || val === 1 || val === 2 || val === 3 ? val : null;
        });
      }

      const targetCodeNorm = normalizeSubjectCode3Digit(entry.subjectCode);
      const existingIdx = nextSessions.findIndex((s) => {
        const sameScope =
          s.examTitle === entry.examTitle &&
          s.grade === entry.grade &&
          s.branch === branchNorm &&
          s.group === groupBn;
        if (!sameScope) return false;
        if (s.subjectName === entry.subjectName) return true;
        return Boolean(targetCodeNorm) && normalizeSubjectCode3Digit(s.subjectCode) === targetCodeNorm;
      });

      const templateId = recommendTemplateForMcqCount(qCount);
      const paperFormat: OmrPaperFormat =
        entry.paperFormat === 'a4' || entry.paperFormat === 'a5' || entry.paperFormat === 'legal_half'
          ? entry.paperFormat
          : templateId === 'a4_100'
            ? 'a4'
            : 'legal_half';

      if (existingIdx >= 0) {
        const existing = nextSessions[existingIdx];
        const updated: OmrExamSession = {
          ...existing,
          templateId,
          paperFormat,
          questionCount: qCount,
          optionStyle,
          setCount,
          markPerCorrect: Number(entry.markPerCorrect) > 0 ? Number(entry.markPerCorrect) : existing.markPerCorrect,
          negativeMark: Math.max(0, Number(entry.negativeMark) || 0),
          answerKeys: cleanKeys,
          isKeyLocked: Boolean(entry.isKeyLocked),
          keyNote: typeof entry.keyNote === 'string' ? entry.keyNote : existing.keyNote,
          keyUpdatedBy: updatedBy || existing.keyUpdatedBy,
          updatedAt: now,
        };
        nextSessions[existingIdx] = updated;
        regradeTargets.push(updated);
        updatedCount++;
      } else {
        const created: OmrExamSession = {
          id: `omr-sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          examId: entry.examTitle,
          examTitle: entry.examTitle,
          academicYear: entry.academicYear || String(new Date().getFullYear()),
          grade: entry.grade,
          branch: branchNorm,
          group: groupBn,
          subjectCode: entry.subjectCode || entry.subjectName,
          subjectName: entry.subjectName,
          subjectMcqMax: Number(entry.subjectMcqMax) > 0 ? Number(entry.subjectMcqMax) : qCount,
          templateId,
          paperFormat,
          questionCount: qCount,
          rollDigits: Math.min(6, Math.max(2, Number(entry.rollDigits) || 3)),
          optionStyle,
          setCount,
          colorTheme: 'pink',
          markPerCorrect: Number(entry.markPerCorrect) > 0 ? Number(entry.markPerCorrect) : 1,
          negativeMark: Math.max(0, Number(entry.negativeMark) || 0),
          answerKeys: cleanKeys,
          isKeyLocked: Boolean(entry.isKeyLocked),
          keyNote: typeof entry.keyNote === 'string' ? entry.keyNote : '',
          keyUpdatedBy: updatedBy,
          createdAt: now,
          updatedAt: now,
        };
        nextSessions.unshift(created);
        regradeTargets.push(created);
        importedCount++;
      }
    }

    this.saveSessions(nextSessions);
    for (const target of regradeTargets) {
      this.regradeSessionScans(target);
    }

    return { importedCount, updatedCount, skippedCount };
  }

  public deleteSession(sessionId: string): void {
    const sessions = this.getSessions().filter((s) => s.id !== sessionId);
    const scans = this.getAllScans().filter((sc) => sc.sessionId !== sessionId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(OMR_SCANS_STORAGE_KEY, JSON.stringify(scans));
    }
    this.saveSessions(sessions);
  }

  // ── SCANS & AUTO-SYNC ROUTING ─────────────────────────────────────────────

  public getAllScans(): OmrScanRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(OMR_SCANS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveAllScans(scans: OmrScanRecord[]): void {
    if (typeof window === 'undefined') return;
    const trimmed = scans.map((scan, idx) =>
      idx >= 120 && scan.warpedThumbnail ? { ...scan, warpedThumbnail: undefined } : scan,
    );
    localStorage.setItem(OMR_SCANS_STORAGE_KEY, JSON.stringify(trimmed));
    this.notify();
    this.triggerCloudSync();
  }

  public getScansForSession(sessionId: string): OmrScanRecord[] {
    return this.getAllScans()
      .filter((sc) => sc.sessionId === sessionId)
      .sort((a, b) => {
        const numA = parseInt(normalizeRollNumeric(a.studentRoll), 10);
        const numB = parseInt(normalizeRollNumeric(b.studentRoll), 10);
        if (Number.isFinite(numA) && Number.isFinite(numB) && numA !== numB) {
          return numA - numB;
        }
        return a.studentRoll.localeCompare(b.studentRoll);
      });
  }

  public getScanCountBySession(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const sc of this.getAllScans()) {
      counts[sc.sessionId] = (counts[sc.sessionId] || 0) + 1;
    }
    return counts;
  }

  /**
   * Resolves the exact destination OMR session from decoded on-sheet identity bubbles:
   * 3-digit Subject Code + Class (6th–10th) + Department/Group.
   * Falls back cleanly to `activeSession` when identity grids are left blank.
   */
  public resolveAutoSyncTargetSession(
    activeSession: OmrExamSession,
    decode: Pick<
      OmrDecodeResult,
      | 'decodedSubjectCodeRaw'
      | 'subjectCodeFilled'
      | 'subjectCodeUncertain'
      | 'decodedGrade'
      | 'gradeStatus'
      | 'decodedGroup'
      | 'groupStatus'
    >,
  ): { targetSession: OmrExamSession; autoRouted: boolean; routingSummaryBn?: string } {
    const targetGrade =
      decode.decodedGrade && (decode.gradeStatus === 'filled' || decode.gradeStatus === 'uncertain')
        ? decode.decodedGrade
        : activeSession.grade;

    const decodedGroupValid =
      decode.decodedGroup && (decode.groupStatus === 'filled' || decode.groupStatus === 'uncertain')
        ? decode.decodedGroup
        : null;

    let targetGroupBn = normalizeGroupToBn(
      targetGrade,
      decodedGroupValid || (targetGrade === activeSession.grade ? activeSession.group : 'বিজ্ঞান'),
      targetGrade === activeSession.grade ? activeSession.branch : undefined,
    );

    let targetSubjectCode = activeSession.subjectCode;
    let targetSubjectName = activeSession.subjectName;
    let targetSubjectMcqMax = activeSession.subjectMcqMax;

    if (
      decode.subjectCodeFilled &&
      decode.decodedSubjectCodeRaw &&
      !decode.decodedSubjectCodeRaw.includes('?')
    ) {
      const resolved = resolveOmrSubjectByCode(
        targetGrade,
        targetGroupBn,
        decode.decodedSubjectCodeRaw,
      );
      if (resolved) {
        targetSubjectCode = resolved.subject.code;
        targetSubjectName = resolved.subject.name;
        if (resolved.subject.mcqMax > 0) {
          targetSubjectMcqMax = resolved.subject.mcqMax;
        }
        // Only override group with subject's inferred group if sheet didn't explicitly fill a group bubble
        if (!decodedGroupValid && (targetGrade === '9th' || targetGrade === '10th')) {
          targetGroupBn = resolved.inferredGroup;
        }
      }
    }

    const targetBranch = normalizeGroupToBranch(targetGrade, targetGroupBn, activeSession.branch);

    const sameAsActive =
      targetGrade === activeSession.grade &&
      targetGroupBn === activeSession.group &&
      targetBranch === activeSession.branch &&
      (targetSubjectName === activeSession.subjectName ||
        normalizeSubjectCode3Digit(targetSubjectCode) ===
          normalizeSubjectCode3Digit(activeSession.subjectCode));

    if (sameAsActive) {
      return { targetSession: activeSession, autoRouted: false };
    }

    const targetSession = this.findOrCreateSession({
      examId: activeSession.examId,
      examTitle: activeSession.examTitle,
      academicYear: activeSession.academicYear,
      grade: targetGrade,
      branch: targetBranch,
      group: targetGroupBn,
      subjectCode: targetSubjectCode,
      subjectName: targetSubjectName,
      subjectMcqMax: targetSubjectMcqMax,
      questionCount: activeSession.questionCount,
      paperFormat: activeSession.paperFormat,
      rollDigits: activeSession.rollDigits,
      optionStyle: activeSession.optionStyle,
      setCount: activeSession.setCount,
      colorTheme: activeSession.colorTheme,
    });

    const gradeBn = OMR_GRADE_LABELS_BN[targetSession.grade] || targetSession.grade;
    const grpOrSec =
      targetSession.grade === '9th' || targetSession.grade === '10th'
        ? targetSession.group
        : `শাখা ${targetSession.branch}`;

    return {
      targetSession,
      autoRouted: true,
      routingSummaryBn: `${gradeBn} (${grpOrSec}) · ${targetSession.subjectName} (${targetSession.subjectCode})`,
    };
  }

  /**
   * Converts a Vision Engine decode result into a graded, student-matched OmrScanRecord,
   * automatically routing to the exact Class/Group/Subject session when on-sheet identity
   * bubbles (3-digit Subject Code / Class / Group) are filled.
   */
  public recordDecodedScan(params: {
    session: OmrExamSession;
    decode: OmrDecodeResult;
    sourceType: 'camera' | 'image' | 'pdf' | 'manual';
    scannedBy: string;
    warpedThumbnail?: string;
    overwriteDuplicate?: boolean;
    autoSyncIdentity?: boolean; // default true
    overrideRoll?: string;
    overrideSetCode?: string;
    overrideStudentId?: string | null;
  }): OmrSaveScanOutcome {
    const { decode, sourceType, scannedBy, warpedThumbnail } = params;
    const enableAutoSync = params.autoSyncIdentity !== false;

    const routed = enableAutoSync
      ? this.resolveAutoSyncTargetSession(params.session, decode)
      : { targetSession: params.session, autoRouted: false };

    const session = routed.targetSession;
    const rawRoll = params.overrideRoll !== undefined ? params.overrideRoll : decode.decodedRollRaw;
    const match = matchStudentByRollForSession(session, rawRoll, params.overrideStudentId);

    const validSets = getSessionSetCodes(session);
    const resolvedSetCode =
      params.overrideSetCode && validSets.includes(params.overrideSetCode)
        ? params.overrideSetCode
        : decode.setCode && validSets.includes(decode.setCode)
          ? decode.setCode
          : validSets[0];

    const resolvedSetIndex =
      session.setCount === 4 ? validSets.indexOf(resolvedSetCode) : null;

    const graded = gradeOmrQuestionResponses(
      session,
      resolvedSetCode,
      decode.questions.map((q) => ({
        questionNumber: q.questionNumber,
        selectedIndex: q.selectedIndex,
        filledIndices: q.filledIndices,
        status: q.status,
        confidence: q.confidence,
      })),
    );

    const needsReview =
      !match.student ||
      decode.rollUncertain ||
      decode.subjectCodeUncertain ||
      graded.uncertainCount > 0 ||
      graded.doubleCount > 0 ||
      (session.setCount === 4 && decode.setStatus === 'uncertain');

    const proposedRecord: OmrScanRecord = {
      id: `omr-scan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sessionId: session.id,
      examTitle: session.examTitle,
      grade: session.grade,
      branch: session.branch,
      group: session.group,
      subjectCode: session.subjectCode,
      subjectName: session.subjectName,
      studentId: match.student?.id ?? null,
      studentName: match.student?.name ?? 'অজানা শিক্ষার্থী (রোল যাচাই করুন)',
      studentRoll: match.normalizedRoll,
      decodedRollRaw: rawRoll,
      decodedSubjectCodeRaw: decode.decodedSubjectCodeRaw || undefined,
      decodedGrade: decode.decodedGrade ?? null,
      decodedGroup: decode.decodedGroup ?? null,
      autoRouted: routed.autoRouted,
      matchStatus: match.student ? 'matched' : 'unmatched',
      setCode: resolvedSetCode,
      setIndex: resolvedSetIndex !== null && resolvedSetIndex >= 0 ? resolvedSetIndex : null,
      answers: graded.answers,
      correctCount: graded.correctCount,
      wrongCount: graded.wrongCount,
      blankCount: graded.blankCount,
      doubleCount: graded.doubleCount,
      uncertainCount: graded.uncertainCount,
      obtainedMarks: graded.obtainedMarks,
      totalMarks: graded.totalMarks,
      percentage: graded.percentage,
      isPassedMcq: graded.isPassedMcq,
      needsReview,
      overallConfidence: decode.overallConfidence,
      syncedToMarkEntry: false,
      scannedAt: new Date().toISOString(),
      scannedBy: scannedBy || 'অ্যাডমিন',
      sourceType,
      warpedThumbnail,
    };

    const allScans = this.getAllScans();
    const existing = allScans.find((sc) => {
      if (sc.sessionId !== session.id) return false;
      if (proposedRecord.studentId && sc.studentId === proposedRecord.studentId) return true;
      if (
        proposedRecord.studentRoll &&
        !proposedRecord.studentRoll.includes('?') &&
        normalizeRollNumeric(sc.studentRoll) === normalizeRollNumeric(proposedRecord.studentRoll)
      ) {
        return true;
      }
      return false;
    });

    if (existing && !params.overwriteDuplicate) {
      return {
        status: 'duplicate_conflict',
        record: proposedRecord,
        existingRecord: existing,
        targetSession: session,
        autoRouted: routed.autoRouted,
        routingSummaryBn: routed.routingSummaryBn,
      };
    }

    if (existing) {
      const updated: OmrScanRecord = {
        ...proposedRecord,
        id: existing.id,
      };
      const nextScans = allScans.map((sc) => (sc.id === existing.id ? updated : sc));
      this.saveAllScans(nextScans);
      return {
        status: 'updated',
        record: updated,
        existingRecord: existing,
        targetSession: session,
        autoRouted: routed.autoRouted,
        routingSummaryBn: routed.routingSummaryBn,
      };
    }

    this.saveAllScans([proposedRecord, ...allScans]);
    return {
      status: 'saved',
      record: proposedRecord,
      targetSession: session,
      autoRouted: routed.autoRouted,
      routingSummaryBn: routed.routingSummaryBn,
    };
  }

  /**
   * Updates a scan record after manual teacher verification (roll, class, group,
   * 3-digit subject code, set code, or tap-to-fix MCQ bubble). Automatically moves
   * the scan into the right target session if class/group/subject changed!
   */
  public updateScanAfterVerification(
    scanId: string,
    updates: {
      roll?: string;
      studentId?: string | null;
      grade?: string;
      group?: string;
      subjectCode?: string;
      setCode?: string;
      answers?: Array<number | null>;
    },
  ): OmrScanRecord | null {
    const allScans = this.getAllScans();
    const target = allScans.find((sc) => sc.id === scanId);
    if (!target) return null;

    const currentSession = this.getSessionById(target.sessionId);
    if (!currentSession) return null;

    // Resolve destination session if teacher edited grade, group, or subjectCode
    let destSession = currentSession;
    const nextGrade = updates.grade || currentSession.grade;
    const nextGroupBn = normalizeGroupToBn(
      nextGrade,
      updates.group || currentSession.group,
      currentSession.branch,
    );
    const nextBranch = normalizeGroupToBranch(nextGrade, nextGroupBn, currentSession.branch);

    let nextSubCode = currentSession.subjectCode;
    let nextSubName = currentSession.subjectName;
    let nextSubMcqMax = currentSession.subjectMcqMax;

    if (updates.subjectCode && normalizeSubjectCode3Digit(updates.subjectCode)) {
      const resolvedSub = resolveOmrSubjectByCode(nextGrade, nextGroupBn, updates.subjectCode);
      if (resolvedSub) {
        nextSubCode = resolvedSub.subject.code;
        nextSubName = resolvedSub.subject.name;
        if (resolvedSub.subject.mcqMax > 0) nextSubMcqMax = resolvedSub.subject.mcqMax;
      } else {
        nextSubCode = updates.subjectCode.trim();
      }
    }

    if (
      nextGrade !== currentSession.grade ||
      nextGroupBn !== currentSession.group ||
      nextBranch !== currentSession.branch ||
      nextSubName !== currentSession.subjectName ||
      normalizeSubjectCode3Digit(nextSubCode) !== normalizeSubjectCode3Digit(currentSession.subjectCode)
    ) {
      destSession = this.findOrCreateSession({
        examId: currentSession.examId,
        examTitle: currentSession.examTitle,
        academicYear: currentSession.academicYear,
        grade: nextGrade,
        branch: nextBranch,
        group: nextGroupBn,
        subjectCode: nextSubCode,
        subjectName: nextSubName,
        subjectMcqMax: nextSubMcqMax,
        questionCount: currentSession.questionCount,
        paperFormat: currentSession.paperFormat,
        rollDigits: currentSession.rollDigits,
        optionStyle: currentSession.optionStyle,
        setCount: currentSession.setCount,
        colorTheme: currentSession.colorTheme,
      });
    }

    const nextRawRoll = updates.roll !== undefined ? updates.roll : target.studentRoll;
    const match = matchStudentByRollForSession(destSession, nextRawRoll, updates.studentId);

    const validSets = getSessionSetCodes(destSession);
    const nextSetCode =
      updates.setCode && validSets.includes(updates.setCode) ? updates.setCode : target.setCode;

    const nextResponses = Array.from({ length: destSession.questionCount }, (_, idx) => {
      const orig = target.answers[idx];
      if (!updates.answers || idx >= updates.answers.length) {
        return {
          questionNumber: idx + 1,
          selectedIndex: orig?.selectedIndex ?? null,
          filledIndices: orig?.filledIndices ?? [],
          status: orig?.status ?? ('blank' as BubbleChoiceStatus),
          confidence: orig?.confidence ?? 1,
        };
      }
      const chosen = updates.answers[idx];
      return {
        questionNumber: idx + 1,
        selectedIndex: chosen,
        filledIndices: chosen !== null ? [chosen] : [],
        status: (chosen !== null ? 'filled' : 'blank') as BubbleChoiceStatus,
        confidence: 1,
      };
    });

    const graded = gradeOmrQuestionResponses(destSession, nextSetCode, nextResponses);

    const updatedRecord: OmrScanRecord = {
      ...target,
      sessionId: destSession.id,
      grade: destSession.grade,
      branch: destSession.branch,
      group: destSession.group,
      subjectCode: destSession.subjectCode,
      subjectName: destSession.subjectName,
      decodedSubjectCodeRaw: updates.subjectCode ?? target.decodedSubjectCodeRaw,
      decodedGrade: destSession.grade,
      decodedGroup: destSession.group,
      studentId: match.student?.id ?? null,
      studentName: match.student?.name ?? 'অজানা শিক্ষার্থী (রোল যাচাই করুন)',
      studentRoll: match.normalizedRoll,
      decodedRollRaw: nextRawRoll,
      matchStatus: match.student ? 'matched' : 'unmatched',
      setCode: nextSetCode,
      setIndex: destSession.setCount === 4 ? validSets.indexOf(nextSetCode) : null,
      answers: graded.answers,
      correctCount: graded.correctCount,
      wrongCount: graded.wrongCount,
      blankCount: graded.blankCount,
      doubleCount: graded.doubleCount,
      uncertainCount: graded.uncertainCount,
      obtainedMarks: graded.obtainedMarks,
      totalMarks: graded.totalMarks,
      percentage: graded.percentage,
      isPassedMcq: graded.isPassedMcq,
      needsReview: !match.student || graded.uncertainCount > 0 || graded.doubleCount > 0,
      syncedToMarkEntry: false,
    };

    const duplicateOther = allScans.find(
      (sc) =>
        sc.id !== scanId &&
        sc.sessionId === destSession.id &&
        updatedRecord.studentId &&
        sc.studentId === updatedRecord.studentId,
    );

    const nextScans = allScans
      .filter((sc) => !duplicateOther || sc.id !== duplicateOther.id)
      .map((sc) => (sc.id === scanId ? updatedRecord : sc));

    this.saveAllScans(nextScans);
    return updatedRecord;
  }

  public deleteScan(scanId: string): void {
    const next = this.getAllScans().filter((sc) => sc.id !== scanId);
    this.saveAllScans(next);
  }

  private regradeSessionScans(session: OmrExamSession): void {
    const allScans = this.getAllScans();
    let changed = false;

    const nextScans = allScans.map((sc) => {
      if (sc.sessionId !== session.id) return sc;
      changed = true;
      const graded = gradeOmrQuestionResponses(
        session,
        sc.setCode,
        sc.answers.map((a) => ({
          questionNumber: a.questionNumber,
          selectedIndex: a.selectedIndex,
          filledIndices: a.filledIndices,
          status: a.status,
          confidence: a.confidence,
        })),
      );
      return {
        ...sc,
        answers: graded.answers,
        correctCount: graded.correctCount,
        wrongCount: graded.wrongCount,
        blankCount: graded.blankCount,
        doubleCount: graded.doubleCount,
        uncertainCount: graded.uncertainCount,
        obtainedMarks: graded.obtainedMarks,
        totalMarks: graded.totalMarks,
        percentage: graded.percentage,
        isPassedMcq: graded.isPassedMcq,
        syncedToMarkEntry: false,
      };
    });

    if (changed) {
      this.saveAllScans(nextScans);
    }
  }

  // ── ROSTER & ANALYTICS ────────────────────────────────────────────────────

  public getClassStudentOmrRoster(session: OmrExamSession): {
    roster: OmrClassRosterRow[];
    unmatchedScans: OmrScanRecord[];
  } {
    const students = getEligibleStudentsForSession(session);
    const scans = this.getScansForSession(session.id);

    const byStudentId = new Map<string, OmrScanRecord>();
    const byNormRoll = new Map<string, OmrScanRecord>();
    const unmatchedScans: OmrScanRecord[] = [];

    for (const sc of scans) {
      if (sc.studentId) {
        byStudentId.set(sc.studentId, sc);
      } else if (sc.matchStatus === 'matched') {
        byNormRoll.set(normalizeRollNumeric(sc.studentRoll), sc);
      } else {
        unmatchedScans.push(sc);
      }
    }

    const roster: OmrClassRosterRow[] = students.map((student) => {
      const scan =
        byStudentId.get(student.id) || byNormRoll.get(normalizeRollNumeric(student.roll)) || null;
      return { student, scan };
    });

    return { roster, unmatchedScans };
  }

  public computeSessionItemAnalysis(session: OmrExamSession): OmrQuestionItemStat[] {
    const scans = this.getScansForSession(session.id);
    const defaultSet = getSessionSetCodes(session)[0];
    const defaultKey = session.answerKeys[defaultSet] || [];

    const stats: OmrQuestionItemStat[] = [];
    for (let i = 0; i < session.questionCount; i++) {
      let correctCount = 0;
      let wrongCount = 0;
      let blankCount = 0;
      let doubleCount = 0;
      const optionCounts: [number, number, number, number] = [0, 0, 0, 0];

      for (const sc of scans) {
        const ans = sc.answers[i];
        if (!ans) continue;
        if (ans.selectedIndex !== null && ans.selectedIndex >= 0 && ans.selectedIndex <= 3) {
          optionCounts[ans.selectedIndex]++;
        }
        if (ans.outcome === 'correct') correctCount++;
        else if (ans.outcome === 'wrong') wrongCount++;
        else if (ans.outcome === 'double') doubleCount++;
        else if (ans.outcome === 'blank') blankCount++;
      }

      const totalScanned = scans.length;
      const accuracyPercent =
        totalScanned > 0 ? Number(((correctCount / totalScanned) * 100).toFixed(1)) : 0;

      stats.push({
        questionNumber: i + 1,
        correctOption: defaultKey[i] ?? null,
        totalScanned,
        correctCount,
        wrongCount,
        blankCount,
        doubleCount,
        accuracyPercent,
        optionCounts,
      });
    }

    return stats;
  }

  // ── LOSSLESS SYNC INTO OFFICIAL MARK ENTRY (sms_marks_*) ──────────────────

  public syncSessionMarksToMarkEntry(
    sessionId: string,
    performedBy: string = 'অ্যাডমিন',
  ): OmrMarkSyncReport {
    if (typeof window === 'undefined') {
      return { syncedCount: 0, skippedUnmatchedCount: 0, totalClassStudents: 0, storageKeysWritten: [] };
    }

    const session = this.getSessionById(sessionId);
    if (!session) {
      throw new Error('OMR সেশন পাওয়া যায়নি।');
    }

    const is9or10 = session.grade === '9th' || session.grade === '10th';
    const groupBn = normalizeGroupToBn(session.grade, session.group, session.branch);
    const groupCode = normalizeGroupToCode(session.grade, session.group, session.branch);
    const configuredSubjects = getActiveCurriculumSubjects(session.grade, groupCode);
    const matchedSubCfg = configuredSubjects.find(
      (s) =>
        s.name === session.subjectName ||
        normalizeSubjectCode3Digit(s.code) === normalizeSubjectCode3Digit(session.subjectCode),
    );

    const mcqMax =
      Number(matchedSubCfg?.mcq) > 0
        ? Number(matchedSubCfg?.mcq)
        : Math.max(
            session.subjectMcqMax || 0,
            Math.round(session.questionCount * (session.markPerCorrect || 1)),
          );

    const students = getEligibleStudentsForSession(session);
    const scans = this.getScansForSession(session.id);

    const matchedScansByStudent = new Map<string, OmrScanRecord>();
    let skippedUnmatchedCount = 0;

    for (const sc of scans) {
      if (sc.matchStatus === 'matched' && sc.studentId) {
        matchedScansByStudent.set(sc.studentId, sc);
      } else {
        skippedUnmatchedCount++;
      }
    }

    const aliases = getAllSubjectAliases(session.subjectName);
    const allIdentifiers = Array.from(
      new Set([
        session.subjectName,
        session.subjectCode,
        ...(matchedSubCfg?.code ? [matchedSubCfg.code] : []),
        ...(matchedSubCfg?.name ? [matchedSubCfg.name] : []),
        ...aliases.names,
        ...aliases.codes,
      ]),
    ).filter(Boolean);

    const groupsToSave = is9or10 ? [groupCode, groupBn, ''] : ['সাধারণ', ''];
    const savedExistingMap: Record<string, { written?: number; cq?: number; mcq?: number; practical?: number }> = {};

    for (const ident of allIdentifiers) {
      let foundExisting = false;
      for (const gp of groupsToSave) {
        const key = `sms_marks_${session.examTitle}_${session.grade}_${session.branch}_${gp}_${ident}`;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.forEach((row: Record<string, unknown>) => {
              const rId = String(row.id || row.studentId || '');
              const rRoll = normalizeRollNumeric(String(row.roll || ''));
              const entry = {
                written: Number(row.written !== undefined ? row.written : row.cq || 0),
                cq: Number(row.cq !== undefined ? row.cq : row.written || 0),
                mcq: Number(row.mcq || 0),
                practical: Number(row.practical || 0),
              };
              if (rId) savedExistingMap[rId] = entry;
              if (rRoll) savedExistingMap[`roll:${rRoll}`] = entry;
            });
            foundExisting = true;
            break;
          }
        } catch {
          // ignore malformed entry
        }
      }
      if (foundExisting) break;
    }

    let syncedCount = 0;
    const syncedScanIds = new Set<string>();

    const mergedRows = students.map((st) => {
      const existing = savedExistingMap[st.id] || savedExistingMap[`roll:${normalizeRollNumeric(st.roll)}`];
      const written = Math.max(0, Number(existing?.written ?? existing?.cq ?? 0));
      const practical = Math.max(0, Number(existing?.practical ?? 0));

      const omrScan = matchedScansByStudent.get(st.id);
      let mcq = Math.max(0, Number(existing?.mcq ?? 0));

      if (omrScan) {
        mcq = Math.min(mcqMax, Math.max(0, Math.round(omrScan.obtainedMarks)));
        syncedCount++;
        syncedScanIds.add(omrScan.id);
      }

      const total = written + mcq + practical;
      return {
        id: st.id,
        roll: st.roll,
        name: st.name,
        religion: getStudentReligion(st),
        written,
        cq: written,
        mcq,
        practical,
        total,
      };
    });

    const jsonVal = JSON.stringify(mergedRows);
    const storageKeysWritten: string[] = [];

    for (const gp of groupsToSave) {
      for (const ident of allIdentifiers) {
        if (!ident) continue;
        const key = `sms_marks_${session.examTitle}_${session.grade}_${session.branch}_${gp}_${ident}`;
        localStorage.setItem(key, jsonVal);
        storageKeysWritten.push(key);
      }
    }

    const now = new Date();
    localStorage.setItem(
      'sms_last_mark_save',
      `${now.toLocaleDateString('bn-BD')} ${now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}`,
    );

    const syncedAt = now.toISOString();
    const allScans = this.getAllScans();
    const updatedScans = allScans.map((sc) =>
      syncedScanIds.has(sc.id) ? { ...sc, syncedToMarkEntry: true, syncedAt } : sc,
    );
    this.saveAllScans(updatedScans);

    import('./firebaseSyncService')
      .then(({ firebaseSyncService }) => {
        firebaseSyncService.syncMarksKeysToCloud(storageKeysWritten).catch(() => {});
      })
      .catch(() => {});

    auditTrailService.addLog({
      action: 'OMR_SYNC_MCQ_MARKS',
      category: 'MARKS',
      details: `OMR স্ক্যানার থেকে শ্রেণি ${session.grade} (${session.branch}) '${session.subjectName}' বিষয়ের ${syncedCount} জন শিক্ষার্থীর MCQ নম্বর মার্ক এন্ট্রিতে সিঙ্ক করা হয়েছে`,
      performedBy,
      status: 'SUCCESS',
    });

    const markEntityId = `${session.examTitle}-${session.grade}-${session.branch}-${session.subjectName}`;
    syncQueueService
      .enqueue('exam_mark', markEntityId, 'UPDATE', {
        examId: session.examTitle,
        grade: session.grade,
        branch: session.branch,
        group: groupCode,
        subject: session.subjectName,
        marksCount: mergedRows.length,
        marks: mergedRows,
      })
      .catch(() => {});

    return {
      syncedCount,
      skippedUnmatchedCount,
      totalClassStudents: students.length,
      storageKeysWritten,
    };
  }
}

export const omrService = new OmrService();
