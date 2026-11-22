/**
 * OMR Exam Session, Student-Wise & Class-Wise Storage, Grading,
 * Item Analysis, and Lossless Mark-Entry Synchronization Service.
 *
 * Guarantees:
 *  - Accurate class-wise & student-wise linkage via `studentService` + religion filtering
 *  - Duplicate-roll conflict guard (never creates silent duplicate student records)
 *  - Automatic re-grading whenever Answer Keys or marking rules change
 *  - Automatic roll ordering consistent with `sortStudentsGroupAndRoll`
 *  - Lossless MCQ sync into `sms_marks_*` (strictly preserving CQ & Practical marks)
 */

import {
  OmrColorTheme,
  OmrOptionStyle,
  OmrTemplateId,
  OMR_SET_LABELS,
  OMR_TEMPLATE_PRESETS,
  recommendTemplateForMcqCount,
  toAsciiDigits,
} from '@/lib/omr/omrTemplates';
import type { BubbleChoiceStatus, OmrDecodeResult } from '@/lib/omr/omrVisionEngine';
import { studentService, Student } from './studentService';
import { sortStudentsGroupAndRoll } from './studentBulkImportEngine';
import { filterStudentsBySubjectReligion, getStudentReligion } from '@/lib/religionUtils';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import { getAllSubjectAliases } from '@/lib/markStorageUtils';
import { auditTrailService } from './auditTrailService';
import { syncQueueService } from './syncQueueService';

export const OMR_SESSIONS_STORAGE_KEY = 'sms_omr_sessions';
export const OMR_SCANS_STORAGE_KEY = 'sms_omr_scans';

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
  subjectMcqMax: number; // NCTB max MCQ marks (e.g. 25 or 30), 0 if custom test
  templateId: OmrTemplateId;
  questionCount: number;
  rollDigits: number; // 2..6
  optionStyle: OmrOptionStyle; // 'bn' | 'en'
  setCount: 1 | 4;
  colorTheme: OmrColorTheme;
  markPerCorrect: number;
  negativeMark: number;
  /** Map of setCode ('default' or 'ক'/'খ'/'গ'/'ঘ' or 'A'/'B'/'C'/'D') -> Array<0|1|2|3|null> */
  answerKeys: Record<string, Array<number | null>>;
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
}

export interface OmrMarkSyncReport {
  syncedCount: number;
  skippedUnmatchedCount: number;
  totalClassStudents: number;
  storageKeysWritten: string[];
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function normalizeRollNumeric(roll: string | number | null | undefined): string {
  const ascii = toAsciiDigits(String(roll ?? '')).trim();
  const digits = ascii.replace(/\D/g, '');
  if (!digits) return ascii;
  const num = parseInt(digits, 10);
  return Number.isFinite(num) ? String(num) : digits;
}

export function normalizeGroupToBn(grade: string, group?: string, branch?: string): string {
  const is9or10 = grade === '9th' || grade === '10th';
  if (!is9or10) return 'সাধারণ';
  const raw = `${group || ''} ${branch || ''}`.toLowerCase();
  if (raw.includes('মানবিক') || raw.includes('humanities')) return 'মানবিক';
  if (raw.includes('ব্যবসা') || raw.includes('commerce') || raw.includes('business')) return 'ব্যবসায় শিক্ষা';
  return 'বিজ্ঞান';
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
  const keys: Record<string, Array<number | null>> = {};
  const codes = setCount === 1 ? ['default'] : [...OMR_SET_LABELS[optionStyle]];
  for (const code of codes) {
    keys[code] = Array.from({ length: questionCount }, () => null);
  }
  return keys;
}

export function getEligibleStudentsForSession(
  session: Pick<OmrExamSession, 'grade' | 'branch' | 'group' | 'subjectName'>,
): Student[] {
  const targetGroupBn = normalizeGroupToBn(session.grade, session.group, session.branch);
  const effectiveBranch =
    session.grade === '9th' || session.grade === '10th'
      ? targetGroupBn === 'বিজ্ঞান'
        ? 'Science'
        : targetGroupBn === 'মানবিক'
          ? 'Humanities'
          : 'Commerce'
      : session.branch || 'A';

  let students = studentService.getStudentsByFilter(session.grade, effectiveBranch, targetGroupBn);
  if (students.length === 0 && (session.grade === '9th' || session.grade === '10th')) {
    // Fallback when students are stored under section A/B/C with Bengali group
    students = studentService.getStudentsByFilter(session.grade, 'all', targetGroupBn);
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
      return Array.isArray(parsed) ? parsed : [];
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
    templateId?: OmrTemplateId;
    rollDigits?: number;
    optionStyle?: OmrOptionStyle;
    setCount?: 1 | 4;
    colorTheme?: OmrColorTheme;
  }): OmrExamSession {
    const groupBn = normalizeGroupToBn(params.grade, params.group, params.branch);
    const branchNorm =
      params.grade === '9th' || params.grade === '10th'
        ? groupBn === 'বিজ্ঞান'
          ? 'Science'
          : groupBn === 'মানবিক'
            ? 'Humanities'
            : 'Commerce'
        : params.branch || 'A';

    const sessions = this.getSessions();
    const existing = sessions.find(
      (s) =>
        s.examTitle === params.examTitle &&
        s.grade === params.grade &&
        s.branch === branchNorm &&
        s.group === groupBn &&
        (s.subjectName === params.subjectName ||
          (params.subjectCode && s.subjectCode === params.subjectCode)),
    );
    if (existing) return existing;

    const mcqMax = Number(params.subjectMcqMax) > 0 ? Number(params.subjectMcqMax) : 30;
    const templateId = params.templateId || recommendTemplateForMcqCount(mcqMax);
    const preset = OMR_TEMPLATE_PRESETS[templateId];
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
      subjectMcqMax: mcqMax,
      templateId,
      questionCount: preset.questionCount,
      rollDigits: params.rollDigits ?? preset.defaultRollDigits,
      optionStyle,
      setCount,
      colorTheme: params.colorTheme || 'pink',
      markPerCorrect: 1,
      negativeMark: 0,
      answerKeys: createEmptyAnswerKeys(preset.questionCount, setCount, optionStyle),
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

      const templateId = updates.templateId || s.templateId;
      const preset = OMR_TEMPLATE_PRESETS[templateId] || OMR_TEMPLATE_PRESETS[s.templateId];
      const questionCount = preset.questionCount;
      const optionStyle = updates.optionStyle || s.optionStyle;
      const setCount = updates.setCount ?? s.setCount;
      const validSetCodes = setCount === 1 ? ['default'] : [...OMR_SET_LABELS[optionStyle]];

      // Preserve existing answers when resizing or switching optionStyle
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
  ): OmrExamSession | null {
    const sessions = this.getSessions();
    let updatedSession: OmrExamSession | null = null;

    const nextSessions = sessions.map((s) => {
      if (s.id !== sessionId) return s;
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
        updatedAt: new Date().toISOString(),
      };
      return updatedSession;
    });

    if (!updatedSession) return null;
    this.saveSessions(nextSessions);
    this.regradeSessionScans(updatedSession);
    return updatedSession;
  }

  public deleteSession(sessionId: string): void {
    const sessions = this.getSessions().filter((s) => s.id !== sessionId);
    const scans = this.getAllScans().filter((sc) => sc.sessionId !== sessionId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(OMR_SCANS_STORAGE_KEY, JSON.stringify(scans));
    }
    this.saveSessions(sessions);
  }

  // ── SCANS ─────────────────────────────────────────────────────────────────

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
    // Keep storage quota safe: cap stored thumbnails to latest 120 scans
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
   * Converts a Vision Engine decode result into a graded, student-matched OmrScanRecord
   * and saves it with duplicate-roll protection.
   */
  public recordDecodedScan(params: {
    session: OmrExamSession;
    decode: OmrDecodeResult;
    sourceType: 'camera' | 'image' | 'pdf' | 'manual';
    scannedBy: string;
    warpedThumbnail?: string;
    overwriteDuplicate?: boolean;
    overrideRoll?: string;
    overrideSetCode?: string;
    overrideStudentId?: string | null;
  }): OmrSaveScanOutcome {
    const { session, decode, sourceType, scannedBy, warpedThumbnail } = params;
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
      };
    }

    if (existing) {
      const updated: OmrScanRecord = {
        ...proposedRecord,
        id: existing.id,
      };
      const nextScans = allScans.map((sc) => (sc.id === existing.id ? updated : sc));
      this.saveAllScans(nextScans);
      return { status: 'updated', record: updated, existingRecord: existing };
    }

    this.saveAllScans([proposedRecord, ...allScans]);
    return { status: 'saved', record: proposedRecord };
  }

  /**
   * Updates a scan record after manual teacher verification (roll fix, set fix, or tap-to-fix bubble).
   */
  public updateScanAfterVerification(
    scanId: string,
    updates: {
      roll?: string;
      studentId?: string | null;
      setCode?: string;
      answers?: Array<number | null>;
    },
  ): OmrScanRecord | null {
    const allScans = this.getAllScans();
    const target = allScans.find((sc) => sc.id === scanId);
    if (!target) return null;

    const session = this.getSessionById(target.sessionId);
    if (!session) return null;

    const nextRawRoll = updates.roll !== undefined ? updates.roll : target.studentRoll;
    const match = matchStudentByRollForSession(session, nextRawRoll, updates.studentId);

    const validSets = getSessionSetCodes(session);
    const nextSetCode =
      updates.setCode && validSets.includes(updates.setCode) ? updates.setCode : target.setCode;

    const nextResponses = target.answers.map((ans, idx) => {
      if (!updates.answers || idx >= updates.answers.length) {
        return {
          questionNumber: ans.questionNumber,
          selectedIndex: ans.selectedIndex,
          filledIndices: ans.filledIndices,
          status: ans.status,
          confidence: ans.confidence,
        };
      }
      const chosen = updates.answers[idx];
      return {
        questionNumber: ans.questionNumber,
        selectedIndex: chosen,
        filledIndices: chosen !== null ? [chosen] : [],
        status: (chosen !== null ? 'filled' : 'blank') as BubbleChoiceStatus,
        confidence: 1,
      };
    });

    const graded = gradeOmrQuestionResponses(session, nextSetCode, nextResponses);

    const updatedRecord: OmrScanRecord = {
      ...target,
      studentId: match.student?.id ?? null,
      studentName: match.student?.name ?? 'অজানা শিক্ষার্থী (রোল যাচাই করুন)',
      studentRoll: match.normalizedRoll,
      decodedRollRaw: nextRawRoll,
      matchStatus: match.student ? 'matched' : 'unmatched',
      setCode: nextSetCode,
      setIndex: session.setCount === 4 ? validSets.indexOf(nextSetCode) : null,
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

    // If re-matching resolved to an already existing student record, merge cleanly to prevent duplicates
    const duplicateOther = allScans.find(
      (sc) =>
        sc.id !== scanId &&
        sc.sessionId === session.id &&
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

  /**
   * Syncs verified matched student MCQ marks from this OMR session straight into
   * SchoolPro's official Exam Mark Entry storage (`sms_marks_*`), strictly preserving
   * existing `written` (CQ) and `practical` marks and updating `total`.
   */
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
      (s) => s.name === session.subjectName || s.code === session.subjectCode,
    );

    const mcqMax =
      Number(matchedSubCfg?.mcq) > 0
        ? Number(matchedSubCfg?.mcq)
        : session.subjectMcqMax > 0
          ? session.subjectMcqMax
          : Math.round(session.questionCount * (session.markPerCorrect || 1));

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

    // 1. Read existing saved marks so CQ (written) & Practical are 100% preserved!
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

    // 2. Merge OMR MCQ score into each student row without touching CQ or Practical
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

    // 3. Persist across canonical + alias storage keys (identical to mark-entry/page.tsx)
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

    // Track last mark save time
    const now = new Date();
    localStorage.setItem(
      'sms_last_mark_save',
      `${now.toLocaleDateString('bn-BD')} ${now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}`,
    );

    // 4. Mark synced OMR scan records
    const syncedAt = now.toISOString();
    const allScans = this.getAllScans();
    const updatedScans = allScans.map((sc) =>
      syncedScanIds.has(sc.id) ? { ...sc, syncedToMarkEntry: true, syncedAt } : sc,
    );
    this.saveAllScans(updatedScans);

    // 5. Cloud Firestore sync + Audit Trail + Offline Sync Queue
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
