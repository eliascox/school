import { studentService } from '@/services/studentService';
import { UserSession } from '@/services/teacherAuthService';
import { teacherRBACService } from '@/services/teacherRBACService';
import { attendanceService, StudentAttendanceRecord } from '@/services/attendanceService';
import { auditTrailService } from '@/services/auditTrailService';
import { syncQueueService } from '@/services/syncQueueService';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import { getAllSubjectAliases } from '@/lib/markStorageUtils';
import {
  filterStudentsBySubjectReligion,
  getStudentReligion,
  isReligionSubject,
  ReligionType,
} from '@/lib/religionUtils';

export const STANDARD_EXAMS: readonly string[] = [
  'অর্ধ-বার্ষিক পরীক্ষা ২০২৬',
  'বার্ষিক পরীক্ষা ২০২৬',
  'এসএসসি প্রাক-নির্বাচনী ২০২৬',
  '১ম টিউটোরিয়াল পরীক্ষা ২০২৬',
];

export type MarkInputField = 'written' | 'mcq' | 'practical';

const autoAuditThrottleMap = new Map<string, number>();
const AUTO_AUDIT_THROTTLE_MS = 30_000;

/** Returns active + custom exams configured in sms_exam_setup merged with STANDARD_EXAMS. */
export function getAvailableExamNames(): string[] {
  const ordered: string[] = [];
  const pushUnique = (name?: unknown) => {
    const clean = typeof name === 'string' ? name.trim() : '';
    if (clean && !ordered.includes(clean)) ordered.push(clean);
  };

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('sms_exam_setup');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.activeExam) pushUnique(parsed.activeExam);
        if (Array.isArray(parsed?.exams)) {
          parsed.exams.forEach((item: any) => {
            pushUnique(typeof item === 'string' ? item : item?.name || item?.title);
          });
        }
      }
    } catch {
      // Ignore malformed exam setup
    }
  }

  STANDARD_EXAMS.forEach((ex) => pushUnique(ex));
  return ordered;
}

/** Computes the next logical cell key (`studentId:field`) for keyboard/keypad auto-advance during rapid marks entry. */
export function getNextMarkInputKey(
  rowIds: string[],
  currentStudentId: string,
  currentField: MarkInputField,
  limits: Pick<SubjectMarksLimits, 'hasMcq' | 'hasPractical'>
): string | null {
  const fields: MarkInputField[] = ['written'];
  if (limits.hasMcq) fields.push('mcq');
  if (limits.hasPractical) fields.push('practical');

  const fieldIdx = fields.indexOf(currentField);
  if (fieldIdx >= 0 && fieldIdx + 1 < fields.length) {
    return `${currentStudentId}:${fields[fieldIdx + 1]}`;
  }

  const rowIdx = rowIds.indexOf(currentStudentId);
  if (rowIdx >= 0 && rowIdx + 1 < rowIds.length) {
    return `${rowIds[rowIdx + 1]}:written`;
  }

  return null;
}

export type GroupKey = 'science' | 'humanities' | 'commerce';

export interface MobileMarkRow {
  id: string;
  roll: string;
  name: string;
  religion: ReligionType;
  written: number;
  mcq: number;
  practical: number;
  total: number;
}

export interface SubjectMarksLimits {
  writtenMax: number;
  hasMcq: boolean;
  mcqMax: number;
  hasPractical: boolean;
  practicalMax: number;
  fullMarks: number;
}

export function resolveSubjectMarksConfig(
  subjectName: string,
  grade: string,
  group: GroupKey = 'science',
): SubjectMarksLimits {
  const configured = getActiveCurriculumSubjects(grade, group);
  const found =
    configured.find(
      (s) => s.name === subjectName || s.code === subjectName,
    ) ||
    (isReligionSubject(subjectName)
      ? configured.find((s) => isReligionSubject(`${s.code} ${s.name}`))
      : undefined);
  if (found) {
    const writtenMax = found.cq !== undefined ? found.cq : 70;
    const mcqMax = found.mcq || 0;
    const practicalMax = found.practical || found.ca || 0;
    return {
      writtenMax,
      hasMcq: mcqMax > 0,
      mcqMax,
      hasPractical: practicalMax > 0,
      practicalMax,
      fullMarks: writtenMax + mcqMax + practicalMax,
    };
  }

  if (subjectName.includes('ইংরেজি ১ম')) {
    return { writtenMax: 100, hasMcq: false, mcqMax: 0, hasPractical: false, practicalMax: 0, fullMarks: 100 };
  }
  if (subjectName.includes('ইংরেজি ২য়') || subjectName.includes('ইংরেজি ২য়')) {
    return { writtenMax: 50, hasMcq: false, mcqMax: 0, hasPractical: false, practicalMax: 0, fullMarks: 50 };
  }
  if (subjectName.includes('ডিজিটাল') || subjectName.includes('ICT') || subjectName.includes('তথ্য ও যোগাযোগ')) {
    return { writtenMax: 25, hasMcq: false, mcqMax: 0, hasPractical: true, practicalMax: 25, fullMarks: 50 };
  }
  if (
    subjectName.includes('পদার্থ') ||
    subjectName.includes('রসায়ন') ||
    subjectName.includes('রসায়ন') ||
    subjectName.includes('জীববিজ্ঞান') ||
    subjectName.includes('উচ্চতর')
  ) {
    return { writtenMax: 50, hasMcq: true, mcqMax: 25, hasPractical: true, practicalMax: 25, fullMarks: 100 };
  }

  return { writtenMax: 70, hasMcq: true, mcqMax: 30, hasPractical: false, practicalMax: 0, fullMarks: 100 };
}

export function groupKeyToBn(group: GroupKey): string {
  if (group === 'science') return 'বিজ্ঞান';
  if (group === 'humanities') return 'মানবিক';
  return 'ব্যবসায় শিক্ষা';
}

export function groupKeyToBranch(group: GroupKey): string {
  if (group === 'science') return 'Science';
  if (group === 'humanities') return 'Humanities';
  return 'Commerce';
}

export function parseClassTeacherClassId(rawClassId: string): { grade: string; branch: string } {
  const parts = String(rawClassId || '').split(/\s*-\s*/).filter(Boolean);
  const rawGrade = (parts[0] || '6th').trim();
  const rawBranch = (parts[1] || '').trim();
  const is9or10 = rawGrade === '9th' || rawGrade === '10th';

  let branch = rawBranch;
  if (is9or10) {
    const low = rawBranch.toLowerCase();
    if (low.includes('science') || low.includes('বিজ্ঞান') || low === 'a') branch = 'Science';
    else if (low.includes('humanities') || low.includes('মানবিক') || low === 'b') branch = 'Humanities';
    else if (low.includes('commerce') || low.includes('ব্যবসায়') || low.includes('ব্যবসায়') || low === 'c') branch = 'Commerce';
    else branch = rawBranch || 'Science';
  } else {
    const upper = rawBranch.toUpperCase();
    if (upper === 'A' || rawBranch.includes('ক')) branch = 'A';
    else if (upper === 'B' || rawBranch.includes('খ')) branch = 'B';
    else if (upper === 'C' || rawBranch.includes('গ')) branch = 'C';
    else branch = rawBranch || 'A';
  }

  return { grade: rawGrade, branch };
}

export function loadMobileMarkRows(params: {
  exam: string;
  grade: string;
  branch: string;
  group: GroupKey;
  subject: string;
}): { rows: MobileMarkRow[]; limits: SubjectMarksLimits } {
  const { exam, grade, branch, group, subject } = params;
  const limits = resolveSubjectMarksConfig(subject, grade, group);
  const is9or10 = grade === '9th' || grade === '10th';
  const effectiveBranch = is9or10 ? groupKeyToBranch(group) : branch;
  const targetGroupBn = is9or10 ? groupKeyToBn(group) : 'সাধারণ';

  let rawStudents = studentService.getStudentsByFilter(grade, effectiveBranch, targetGroupBn);
  rawStudents = filterStudentsBySubjectReligion(rawStudents, subject);

  const savedMap: Record<string, MobileMarkRow> = {};
  if (typeof window !== 'undefined') {
    const candidateKeys = [
      `sms_marks_${exam}_${grade}_${effectiveBranch}_${is9or10 ? group : 'সাধারণ'}_${subject}`,
      `sms_marks_${exam}_${grade}_${effectiveBranch}_${targetGroupBn}_${subject}`,
      `sms_marks_${exam}_${grade}_${effectiveBranch}__${subject}`,
    ];
    for (const key of candidateKeys) {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed: MobileMarkRow[] = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            parsed.forEach((st) => {
              if (st.roll) savedMap[st.roll] = st;
              if (st.id) savedMap[st.id] = st;
            });
            break;
          }
        } catch {
          // Ignore malformed local entry
        }
      }
    }
  }

  const rows: MobileMarkRow[] = rawStudents
    .sort((a, b) => (parseInt(String(a.roll), 10) || 999) - (parseInt(String(b.roll), 10) || 999))
    .map((s) => {
      const savedSt = savedMap[s.roll] || savedMap[s.id];
      const written = Math.min(limits.writtenMax, Math.max(0, Number(savedSt?.written) || 0));
      const mcq = limits.hasMcq ? Math.min(limits.mcqMax, Math.max(0, Number(savedSt?.mcq) || 0)) : 0;
      const practical = limits.hasPractical ? Math.min(limits.practicalMax, Math.max(0, Number(savedSt?.practical) || 0)) : 0;
      return {
        id: s.id,
        roll: String(s.roll),
        name: s.name,
        religion: getStudentReligion(s),
        written,
        mcq,
        practical,
        total: written + mcq + practical,
      };
    });

  return { rows, limits };
}

export function saveTeacherSubjectMarks(params: {
  session: UserSession | null;
  exam: string;
  grade: string;
  branch: string;
  group: GroupKey;
  subject: string;
  rows: MobileMarkRow[];
  mode?: 'auto' | 'manual';
  skipCloudSync?: boolean;
}): {
  success: boolean;
  message: string;
  savedKeys: string[];
  normalizedRows: MobileMarkRow[];
  savedTimeBn?: string;
} {
  const { session, exam, grade, branch, group, subject, rows, mode = 'manual', skipCloudSync = false } = params;

  if (!session || (session.role !== 'admin' && session.role !== 'teacher')) {
    return {
      success: false,
      message: 'অনুগ্রহ করে আগে শিক্ষক বা অ্যাডমিন অ্যাকাউন্টে লগইন করুন।',
      savedKeys: [],
      normalizedRows: rows,
    };
  }

  const teacherIdentifier = session.teacherId || session.teacherName || '';
  if (
    session.role === 'teacher' &&
    !teacherRBACService.validateSubjectOwnership(teacherIdentifier, grade, subject)
  ) {
    return {
      success: false,
      message: 'আপনার এই শ্রেণিতে এই বিষয়ের নম্বর এন্ট্রি করার অনুমতি নেই!',
      savedKeys: [],
      normalizedRows: rows,
    };
  }

  const limits = resolveSubjectMarksConfig(subject, grade, group);
  const normalizedRows: MobileMarkRow[] = rows.map((st) => {
    const written = Math.min(limits.writtenMax, Math.max(0, Number.isFinite(st.written) ? st.written : 0));
    const mcq = limits.hasMcq
      ? Math.min(limits.mcqMax, Math.max(0, Number.isFinite(st.mcq) ? st.mcq : 0))
      : 0;
    const practical = limits.hasPractical
      ? Math.min(limits.practicalMax, Math.max(0, Number.isFinite(st.practical) ? st.practical : 0))
      : 0;
    return {
      ...st,
      written,
      mcq,
      practical,
      total: written + mcq + practical,
    };
  });

  if (typeof window === 'undefined') {
    return { success: false, message: 'ব্রাউজার স্টোরেজ অনুপস্থিত।', savedKeys: [], normalizedRows };
  }

  const is9or10 = grade === '9th' || grade === '10th';
  const effectiveBranch = is9or10 ? groupKeyToBranch(group) : branch;
  const configuredSubjectsList = getActiveCurriculumSubjects(grade, group);
  const currSubObj = configuredSubjectsList.find((s) => s.name === subject || s.code === subject);
  const aliases = getAllSubjectAliases(subject);
  const allIdentifiers = Array.from(
    new Set([subject, currSubObj?.code || subject, currSubObj?.name || subject, ...aliases.names, ...aliases.codes]),
  ).filter(Boolean);

  const targetGroupBn = is9or10 ? groupKeyToBn(group) : 'সাধারণ';
  const groupsToSave = is9or10 ? [group, targetGroupBn, ''] : ['সাধারণ', ''];
  const jsonVal = JSON.stringify(normalizedRows);
  const savedKeys: string[] = [];

  for (const gp of groupsToSave) {
    for (const ident of allIdentifiers) {
      const k = `sms_marks_${exam}_${grade}_${effectiveBranch}_${gp}_${ident}`;
      localStorage.setItem(k, jsonVal);
      savedKeys.push(k);
    }
  }

  const now = new Date();
  const shortTimeBn = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
  const timeStr = `${now.toLocaleDateString('bn-BD')} ${shortTimeBn}`;
  localStorage.setItem('sms_last_mark_save', timeStr);

  const throttleKey = `marks:${exam}:${grade}:${effectiveBranch}:${subject}`;
  const lastAuditAt = autoAuditThrottleMap.get(throttleKey) || 0;
  const shouldLogAudit = mode === 'manual' || Date.now() - lastAuditAt > AUTO_AUDIT_THROTTLE_MS;

  if (shouldLogAudit) {
    autoAuditThrottleMap.set(throttleKey, Date.now());
    auditTrailService.addLog({
      action: 'UPDATE_EXAM_MARKS',
      category: 'MARKS',
      details: `[মোবাইল অ্যাপ${mode === 'auto' ? ' অটো-সেভ' : ''}] শ্রেণি ${grade} (${effectiveBranch}) এর বিষয় '${subject}' এর নম্বর সংরক্ষণ করা হয়েছে`,
      performedBy: session.teacherName || (session.role === 'admin' ? 'অ্যাডমিন' : 'শিক্ষক'),
      status: 'SUCCESS',
    });
  }

  if (!skipCloudSync) {
    const markEntityId = `${exam}-${grade}-${effectiveBranch}-${subject}`;
    syncQueueService
      .enqueue('exam_mark', markEntityId, 'UPDATE', {
        examId: exam,
        grade,
        branch: effectiveBranch,
        group,
        subject,
        marksCount: normalizedRows.length,
        marks: normalizedRows,
      })
      .catch(() => {});

    import('@/services/firebaseSyncService')
      .then(({ firebaseSyncService }) => {
        firebaseSyncService.syncMarksKeysToCloud(savedKeys).catch(() => {});
      })
      .catch(() => {});
  }

  window.dispatchEvent(new Event('storage'));

  return {
    success: true,
    message:
      mode === 'auto'
        ? `${subject} নম্বর স্বয়ংক্রিয়ভাবে সংরক্ষিত (${shortTimeBn})`
        : `${subject} বিষয়ের ${normalizedRows.length} জন শিক্ষার্থীর নম্বর সফলভাবে সংরক্ষিত হয়েছে!`,
    savedKeys,
    normalizedRows,
    savedTimeBn: shortTimeBn,
  };
}

export function saveClassTeacherDailyAttendance(params: {
  session: UserSession | null;
  date: string;
  grade: string;
  branch: string;
  records: StudentAttendanceRecord[];
  mode?: 'auto' | 'manual';
  skipCloudSync?: boolean;
}): {
  success: boolean;
  message: string;
  savedTimeBn?: string;
  presentCount?: number;
  absentCount?: number;
  leaveCount?: number;
} {
  const { session, date, grade, branch, records, mode = 'manual', skipCloudSync = false } = params;

  if (!session || (session.role !== 'admin' && session.role !== 'teacher')) {
    return {
      success: false,
      message: 'অনুগ্রহ করে আগে শিক্ষক বা অ্যাডমিন অ্যাকাউন্টে লগইন করুন।',
    };
  }

  const classKey = `${grade}-${branch}`;
  const teacherIdentifier = session.teacherId || session.teacherName || '';
  if (
    session.role === 'teacher' &&
    !teacherRBACService.canTakeClassAttendance(teacherIdentifier, classKey)
  ) {
    return {
      success: false,
      message: 'শুধুমাত্র এই শ্রেণির দায়িত্বপ্রাপ্ত শ্রেণি শিক্ষক (Class Teacher) হাজিরা গ্রহণ করতে পারবেন!',
    };
  }

  const throttleKey = `att:${date}:${grade}:${branch}`;
  const lastAuditAt = autoAuditThrottleMap.get(throttleKey) || 0;
  const silentAudit = mode === 'auto' && Date.now() - lastAuditAt <= AUTO_AUDIT_THROTTLE_MS;
  if (!silentAudit) {
    autoAuditThrottleMap.set(throttleKey, Date.now());
  }

  const saved = attendanceService.saveAttendance({
    date,
    grade,
    branch,
    records,
    performedBy: session.teacherName || (session.role === 'admin' ? 'অ্যাডমিন' : 'শিক্ষক'),
    silentAudit,
    skipCloudSync,
  });

  if (!saved) {
    return {
      success: false,
      message: 'হাজিরা সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।',
    };
  }

  const presentCount = records.filter((r) => r.status === 'Present').length;
  const absentCount = records.filter((r) => r.status === 'Absent').length;
  const leaveCount = records.filter((r) => r.status === 'Leave').length;
  const savedTimeBn = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });

  return {
    success: true,
    message:
      mode === 'auto'
        ? `অটো-সেভড (${savedTimeBn}) • উপস্থিত: ${presentCount}, অনুপস্থিত: ${absentCount}`
        : `${date} তারিখের ${records.length} জন শিক্ষার্থীর হাজিরা সফলভাবে সংরক্ষিত হয়েছে!`,
    savedTimeBn,
    presentCount,
    absentCount,
    leaveCount,
  };
}
