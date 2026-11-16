import { auditTrailService } from './auditTrailService';
import { studentService, Student } from './studentService';
import { syncQueueService } from './syncQueueService';
import { smsService } from './smsService';

export interface StudentAttendanceRecord {
  id: string;
  roll: string;
  name: string;
  grade: string;
  branch: string;
  guardian: string;
  mobile: string;
  status: 'Present' | 'Absent' | 'Leave';
  reason?: string;
  checkInTime?: string;
  checkOutTime?: string;
  verificationMethod?: 'manual' | 'qr' | 'biometric';
  deviceId?: string;
}

export interface ParsedQrStudentToken {
  raw: string;
  studentId?: string;
  roll?: string;
  grade?: string;
}

const normalizeGradeCode = (raw?: string): string => {
  const v = String(raw || '').trim();
  if (!v) return '';
  const low = v.toLowerCase();
  if (low === '6th' || low.includes('6') || v.includes('৬') || low.includes('six')) return '6th';
  if (low === '7th' || low.includes('7') || v.includes('৭') || low.includes('seven')) return '7th';
  if (low === '8th' || low.includes('8') || v.includes('৮') || low.includes('eight')) return '8th';
  if (low === '9th' || low.includes('9') || v.includes('৯') || low.includes('nine')) return '9th';
  if (low === '10th' || low.includes('10') || v.includes('১০') || low.includes('ten')) return '10th';
  return v;
};

const resolveAttendanceBranch = (student: Student, grade: string, fallbackBranch = 'A'): string => {
  const is9or10 = grade === '9th' || grade === '10th';
  const rawGroup = String(student.group || '').toLowerCase();
  const rawSection = String(student.section || student.branch || '').toLowerCase();
  if (is9or10) {
    if (rawGroup.includes('বিজ্ঞান') || rawGroup.includes('science') || rawSection.includes('science') || rawSection.includes('বিজ্ঞান')) {
      return 'Science';
    }
    if (rawGroup.includes('মানবিক') || rawGroup.includes('humanities') || rawSection.includes('humanities') || rawSection.includes('মানবিক')) {
      return 'Humanities';
    }
    if (rawGroup.includes('ব্যবসায়') || rawGroup.includes('commerce') || rawSection.includes('commerce') || rawSection.includes('ব্যবসায়')) {
      return 'Commerce';
    }
    if (rawSection === 'a') return 'Science';
    if (rawSection === 'b') return 'Humanities';
    if (rawSection === 'c') return 'Commerce';
    return ['Science', 'Humanities', 'Commerce'].includes(fallbackBranch) ? fallbackBranch : 'Science';
  }
  const secClean = String(student.section || student.branch || '').trim().toUpperCase();
  if (['A', 'B', 'C'].includes(secClean)) return secClean;
  if (secClean.includes('ক')) return 'A';
  if (secClean.includes('খ')) return 'B';
  if (secClean.includes('গ')) return 'C';
  return ['A', 'B', 'C'].includes(fallbackBranch) ? fallbackBranch : 'A';
};

const formatNowHHMM = (d = new Date()): string =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const matchStudentFromToken = (
  allStudents: Student[],
  token: ParsedQrStudentToken,
  fallbackGrade?: string
): Student | undefined => {
  if (token.studentId) {
    const byId = allStudents.find((s) => s.id === token.studentId);
    if (byId) return byId;
  }
  const targetGrade = normalizeGradeCode(token.grade || fallbackGrade);
  const rollCandidate = (token.roll || token.studentId || '').trim();
  if (!rollCandidate) return undefined;

  if (targetGrade) {
    const byRollAndGrade = allStudents.find(
      (s) => String(s.roll).trim() === rollCandidate && normalizeGradeCode(s.grade || s.gradeBn) === targetGrade
    );
    if (byRollAndGrade) return byRollAndGrade;
  }

  return allStudents.find((s) => String(s.roll).trim() === rollCandidate);
};

export interface AttendanceMonthlySummary {
  studentId: string;
  studentName: string;
  roll: string;
  grade: string;
  branch: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  attendancePercentage: number;
}

const listeners: (() => void)[] = [];

export const attendanceService = {
  /**
   * Generates standard storage key for daily class attendance
   */
  getStorageKey: (date: string, grade: string, branch: string): string => {
    return `sms_attendance_${date}_${grade}-${branch}`;
  },

  /**
   * Retrieves attendance records for a class on a specific date.
   * If not yet marked, generates an initial list from active students in that class.
   */
  getAttendance: (date: string, grade: string, branch: string): StudentAttendanceRecord[] => {
    if (typeof window === 'undefined') return [];

    const key = attendanceService.getStorageKey(date, grade, branch);
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading attendance storage:', e);
    }

    // Default: initialize from student list
    const isClass9or10 = grade === '9th' || grade === '10th';
    const targetGroup = isClass9or10
      ? (branch === 'Science' || branch === 'A' ? 'বিজ্ঞান' :
         branch === 'Humanities' || branch === 'B' ? 'মানবিক' :
         branch === 'Commerce' || branch === 'C' ? 'ব্যবসায় শিক্ষা' : branch)
      : undefined;

    const rawStudents = studentService.getStudentsByFilter(grade, branch, targetGroup);
    return rawStudents.map((s, idx) => ({
      id: s.id || `st-${s.roll || idx + 1}`,
      roll: s.roll || String(idx + 1).padStart(2, '0'),
      name: s.name,
      grade: s.grade || grade,
      branch: branch,
      guardian: s.guardian || s.fatherName || 'অভিভাবক',
      mobile: s.mobile || '01800000000',
      status: 'Present'
    }));
  },

  /**
   * Saves and persists attendance records for a class on a specific date.
   * Enforces uniqueness (no duplicate students within the same date/class).
   */
  saveAttendance: (params: {
    date: string;
    grade: string;
    branch: string;
    records: StudentAttendanceRecord[];
    performedBy?: string;
  }): boolean => {
    if (typeof window === 'undefined') return false;
    const { date, grade, branch, records, performedBy } = params;

    // Deduplicate records by student id / roll to prevent duplicate attendance lines
    const uniqueMap = new Map<string, StudentAttendanceRecord>();
    records.forEach((rec) => {
      const dedupeKey = rec.id || `${grade}_${branch}_${rec.roll}`;
      uniqueMap.set(dedupeKey, rec);
    });
    const validatedRecords = Array.from(uniqueMap.values());

    const key = attendanceService.getStorageKey(date, grade, branch);
    try {
      localStorage.setItem(key, JSON.stringify(validatedRecords));
    } catch (e) {
      console.error('Error saving attendance:', e);
      return false;
    }

    const presentCnt = validatedRecords.filter(s => s.status === 'Present').length;
    const absentCnt = validatedRecords.filter(s => s.status === 'Absent').length;
    const leaveCnt = validatedRecords.filter(s => s.status === 'Leave').length;

    auditTrailService.addLog({
      action: 'MARK_ATTENDANCE',
      category: 'ATTENDANCE',
      details: `শ্রেণি ${grade} (${branch}) এর তারিখ ${date} এর উপস্থিতি সেভ করা হয়েছে (উপস্থিত: ${presentCnt}, অনুপস্থিত: ${absentCnt}, ছুটি: ${leaveCnt})`,
      performedBy: performedBy || 'শিক্ষক',
      status: 'SUCCESS'
    });

    // Enqueue mutation for sync
    const syncEntityId = `${date}-${grade}-${branch}`;
    syncQueueService.enqueue('attendance', syncEntityId, 'UPDATE', {
      date,
      grade,
      branch,
      presentCnt,
      absentCnt,
      leaveCnt,
      recordsCount: validatedRecords.length
    }).catch(() => {});

    window.dispatchEvent(new Event('storage'));
    listeners.forEach(fn => fn());
    return true;
  },

  /**
   * Gathers all absentees and students on leave across all grades for a specific date
   */
  getAllAbsenteesForDate: (date: string): StudentAttendanceRecord[] => {
    if (typeof window === 'undefined') return [];

    const grades = ['6th', '7th', '8th', '9th', '10th'];
    const list: StudentAttendanceRecord[] = [];
    const seen = new Set<string>();

    grades.forEach(g => {
      const is9or10 = g === '9th' || g === '10th';
      const branches = is9or10
        ? ['Science', 'Humanities', 'Commerce', 'A', 'B', 'C', 'বিজ্ঞান', 'মানবিক', 'ব্যবসায় শিক্ষা']
        : ['A', 'B', 'C'];

      branches.forEach(b => {
        const key = attendanceService.getStorageKey(date, g, b);
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const records: StudentAttendanceRecord[] = JSON.parse(stored);
            records.forEach(r => {
              if (r.status === 'Absent' || r.status === 'Leave') {
                const uid = `${g}_${r.id || r.roll}`;
                if (!seen.has(uid)) {
                  seen.add(uid);
                  list.push({ ...r, grade: g, branch: b });
                }
              }
            });
          }
        } catch (e) {}
      });
    });

    return list;
  },

  /**
   * Calculates monthly attendance stats for a specific class or student
   */
  getMonthlyClassAttendance: (yearMonthPrefix: string, grade: string, branch: string): {
    totalRecordedDays: number;
    dates: string[];
  } => {
    if (typeof window === 'undefined') return { totalRecordedDays: 0, dates: [] };

    const matchingDates: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(`sms_attendance_${yearMonthPrefix}`) && k.endsWith(`_${grade}-${branch}`)) {
          const parts = k.replace('sms_attendance_', '').split('_');
          if (parts[0]) matchingDates.push(parts[0]);
        }
      }
    } catch (e) {}

    return {
      totalRecordedDays: matchingDates.length,
      dates: matchingDates.sort()
    };
  },

  subscribe: (fn: () => void) => {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx > -1) listeners.splice(idx, 1);
    };
  },

  dispatchAbsentAlerts: async (params: {
    date: string;
    absentees: StudentAttendanceRecord[];
    sendSms: boolean;
    sendPush: boolean;
    schoolName: string;
    performedBy?: string;
  }): Promise<{
    smsSentCount: number;
    skippedNoPhone: number;
    message: string;
  }> => {
    const valid = params.absentees.filter((s) => s.mobile && s.mobile.replace(/\D/g, '').length >= 11);
    const skippedNoPhone = params.absentees.length - valid.length;
    let smsSentCount = 0;

    if (params.sendSms && valid.length > 0) {
      const batch = valid.map((s) => ({
        name: s.guardian || s.name,
        category: 'Parent' as const,
        mobile: s.mobile,
        text: `${params.schoolName}: সম্মানিত অভিভাবক, আজ (${params.date}) আপনার সন্তান ${s.name} (শ্রেণি: ${s.grade}, রোল: ${s.roll}) বিদ্যালয়ে অনুপস্থিত রয়েছে।`,
      }));
      const res = await smsService.sendSMSBatch(batch);
      smsSentCount = res.sentCount;
    }

    auditTrailService.addLog({
      action: 'GUARDIAN_ABSENT_ALERT_DISPATCHED',
      category: 'Notification',
      details: `${params.date}: অনুপস্থিত ${params.absentees.length} জনের মধ্যে ${smsSentCount} জন অভিভাবককে SMS/পুশ সতর্কবার্তা পাঠানো হয়েছে।`,
      performedBy: params.performedBy || 'অ্যাডমিন',
      status: 'Success',
    });

    return {
      smsSentCount,
      skippedNoPhone,
      message:
        params.sendSms
          ? `${smsSentCount} জন অভিভাবককে অনুপস্থিতির সতর্কবার্তা পাঠানো হয়েছে (${skippedNoPhone} জনের সঠিক মোবাইল নম্বর ছিল না)।`
          : `অনুপস্থিত ${params.absentees.length} জনের জন্য পুশ অডিট এলার্ট নথিভুক্ত হয়েছে।`,
    };
  },

  parseStudentQrPayload: (rawPayload: string): ParsedQrStudentToken | null => {
    const trimmed = String(rawPayload || '').trim();
    if (!trimmed) return null;

    if (trimmed.toUpperCase().startsWith('SMS-STU|')) {
      const parts = trimmed.split('|');
      const studentId = parts[1]?.trim() || undefined;
      const roll = parts[2]?.trim() || undefined;
      const grade = parts[3]?.trim() || undefined;
      if (!studentId && !roll) return null;
      return { raw: trimmed, studentId, roll, grade };
    }

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed) as Record<string, unknown>;
        const studentId = String(parsed.studentId || parsed.id || '').trim() || undefined;
        const roll = String(parsed.roll || '').trim() || undefined;
        const grade = String(parsed.grade || '').trim() || undefined;
        if (studentId || roll) {
          return { raw: trimmed, studentId, roll, grade };
        }
      } catch {
        // Fallback to raw identifier below
      }
    }

    return {
      raw: trimmed,
      studentId: trimmed,
      roll: trimmed,
    };
  },

  recordQrCheckIn: (
    rawPayload: string,
    options: {
      date: string;
      fallbackGrade?: string;
      fallbackBranch?: string;
      mode?: 'check-in' | 'check-out';
      verificationMethod?: 'qr' | 'biometric';
      deviceId?: string;
      performedBy?: string;
      customTime?: string;
    }
  ): {
    success: boolean;
    message: string;
    student?: StudentAttendanceRecord;
  } => {
    const token = attendanceService.parseStudentQrPayload(rawPayload);
    if (!token) {
      return { success: false, message: 'অবৈধ QR কোড বা শিক্ষার্থী আইডি ফরম্যাট।' };
    }

    const allStudents = studentService.getAllStudents();
    const matched = matchStudentFromToken(allStudents, token, options.fallbackGrade);
    if (!matched) {
      return { success: false, message: `ডাটাবেজে "${token.studentId || token.roll}" আইডি বা রোলের শিক্ষার্থী পাওয়া যায়নি।` };
    }

    const grade = normalizeGradeCode(matched.grade || matched.gradeBn || options.fallbackGrade || '6th') || '6th';
    const branch = resolveAttendanceBranch(matched, grade, options.fallbackBranch || 'A');
    const timeStr = options.customTime || formatNowHHMM();
    const mode = options.mode || 'check-in';
    const verificationMethod = options.verificationMethod || 'qr';

    const existingList = attendanceService.getAttendance(options.date, grade, branch);
    let updatedStudent: StudentAttendanceRecord | undefined;

    const updatedRecords = existingList.map((rec) => {
      const isTarget = rec.id === matched.id || (rec.roll === matched.roll && normalizeGradeCode(rec.grade) === grade);
      if (!isTarget) return rec;
      const nextRec: StudentAttendanceRecord = {
        ...rec,
        status: 'Present',
        reason: '',
        verificationMethod,
        deviceId: options.deviceId || rec.deviceId,
        checkInTime: mode === 'check-in' ? timeStr : rec.checkInTime || timeStr,
        checkOutTime: mode === 'check-out' ? timeStr : rec.checkOutTime,
      };
      updatedStudent = nextRec;
      return nextRec;
    });

    if (!updatedStudent) {
      updatedStudent = {
        id: matched.id,
        roll: matched.roll,
        name: matched.name,
        grade,
        branch,
        guardian: matched.guardian || matched.fatherName || 'অভিভাবক',
        mobile: matched.mobile || '01800000000',
        status: 'Present',
        verificationMethod,
        deviceId: options.deviceId,
        checkInTime: mode === 'check-in' ? timeStr : undefined,
        checkOutTime: mode === 'check-out' ? timeStr : undefined,
      };
      updatedRecords.push(updatedStudent);
    }

    attendanceService.saveAttendance({
      date: options.date,
      grade,
      branch,
      records: updatedRecords,
      performedBy: options.performedBy || `${verificationMethod.toUpperCase()} স্ক্যানার`,
    });

    return {
      success: true,
      message: `${matched.name} (রোল: ${matched.roll}) — ${mode === 'check-out' ? 'চেক-আউট' : 'চেক-ইন'} নথিভুক্ত হয়েছে (${timeStr})।`,
      student: updatedStudent,
    };
  },

  importZKTecoLogs: (
    rawText: string,
    options?: {
      defaultDate?: string;
      deviceId?: string;
      performedBy?: string;
    }
  ): {
    importedCount: number;
    skippedCount: number;
    matchedStudents: string[];
    message: string;
  } => {
    const lines = String(rawText || '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return { importedCount: 0, skippedCount: 0, matchedStudents: [], message: 'কোনো বায়োমেট্রিক লগ পাওয়া যায়নি।' };
    }

    const defaultDate = options?.defaultDate || new Date().toISOString().split('T')[0];
    const allStudents = studentService.getAllStudents();
    const pendingBatches = new Map<string, { date: string; grade: string; branch: string; records: StudentAttendanceRecord[] }>();

    let importedCount = 0;
    let skippedCount = 0;
    const matchedNames = new Set<string>();

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.startsWith('#') || lower.startsWith('userid') || lower.startsWith('pin') || lower.startsWith('roll,')) {
        continue;
      }

      const delimited = line.includes('\t') || line.includes(',')
        ? line.split(/[\t,]+/).map((c) => c.trim()).filter(Boolean)
        : line.split(/\s+/).map((c) => c.trim()).filter(Boolean);

      if (delimited.length < 1) {
        skippedCount++;
        continue;
      }

      const identifier = delimited[0];
      const matched = matchStudentFromToken(allStudents, { raw: identifier, studentId: identifier, roll: identifier });
      if (!matched) {
        skippedCount++;
        continue;
      }

      let dateStr = defaultDate;
      let timeStr = formatNowHHMM();
      let mode: 'check-in' | 'check-out' = 'check-in';
      let lineDevice = options?.deviceId || 'ZKTECO-01';

      for (let i = 1; i < delimited.length; i++) {
        const part = delimited[i];
        const dtMatch = part.match(/(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2})/);
        if (dtMatch) {
          dateStr = dtMatch[1];
          timeStr = dtMatch[2];
          continue;
        }
        const dateOnly = part.match(/^(\d{4}-\d{2}-\d{2})$/);
        if (dateOnly) {
          dateStr = dateOnly[1];
          continue;
        }
        const timeOnly = part.match(/^(\d{2}:\d{2})(?::\d{2})?$/);
        if (timeOnly) {
          timeStr = timeOnly[1];
          continue;
        }
        const stateLow = part.toLowerCase();
        if (stateLow === 'out' || stateLow === 'checkout' || stateLow === 'check-out' || stateLow === '1') {
          mode = 'check-out';
        } else if (stateLow === 'in' || stateLow === 'checkin' || stateLow === 'check-in' || stateLow === '0') {
          mode = 'check-in';
        } else if (part.length >= 2) {
          lineDevice = part;
        }
      }

      const grade = normalizeGradeCode(matched.grade || matched.gradeBn || '6th') || '6th';
      const branch = resolveAttendanceBranch(matched, grade, 'A');
      const batchKey = `${dateStr}|${grade}|${branch}`;

      if (!pendingBatches.has(batchKey)) {
        pendingBatches.set(batchKey, {
          date: dateStr,
          grade,
          branch,
          records: attendanceService.getAttendance(dateStr, grade, branch),
        });
      }

      const batch = pendingBatches.get(batchKey)!;
      let foundInBatch = false;
      batch.records = batch.records.map((rec) => {
        if (rec.id !== matched.id && rec.roll !== matched.roll) return rec;
        foundInBatch = true;
        return {
          ...rec,
          status: 'Present',
          reason: '',
          verificationMethod: 'biometric',
          deviceId: lineDevice,
          checkInTime: mode === 'check-in' ? (rec.checkInTime || timeStr) : (rec.checkInTime || timeStr),
          checkOutTime: mode === 'check-out' ? timeStr : rec.checkOutTime,
        };
      });

      if (!foundInBatch) {
        batch.records.push({
          id: matched.id,
          roll: matched.roll,
          name: matched.name,
          grade,
          branch,
          guardian: matched.guardian || matched.fatherName || 'অভিভাবক',
          mobile: matched.mobile || '01800000000',
          status: 'Present',
          verificationMethod: 'biometric',
          deviceId: lineDevice,
          checkInTime: mode === 'check-in' ? timeStr : undefined,
          checkOutTime: mode === 'check-out' ? timeStr : undefined,
        });
      }

      importedCount++;
      matchedNames.add(matched.name);
    }

    pendingBatches.forEach((batch) => {
      attendanceService.saveAttendance({
        date: batch.date,
        grade: batch.grade,
        branch: batch.branch,
        records: batch.records,
        performedBy: options?.performedBy || 'বায়োমেট্রিক ইমপোর্ট',
      });
    });

    const matchedStudents = Array.from(matchedNames);
    return {
      importedCount,
      skippedCount,
      matchedStudents,
      message: `${importedCount}টি বায়োমেট্রিক পাঞ্চ ইমপোর্ট হয়েছে (${skippedCount}টি লাইন ম্যাচ হয়নি)।`,
    };
  },
};
