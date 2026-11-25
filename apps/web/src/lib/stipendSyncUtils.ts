import { Student } from '@/services/studentService';
import { StudentAttendanceRecord } from '@/services/attendanceService';
import { financeService, StudentFeeLedger } from '@/services/financeService';

export interface StipendCategoryOption {
  name: string;
  amount: number;
  desc: string;
}

export const STIPEND_CATEGORIES: StipendCategoryOption[] = [
  { name: 'সাধারণ উপবৃত্তি', amount: 500, desc: 'সরকারি সাধারণ উপবৃত্তি সুবিধা' },
  { name: 'মেধাভিত্তিক উপবৃত্তি', amount: 1000, desc: 'পরীক্ষায় শীর্ষ ফলাফলের জন্য বিশেষ মেধা অনুদান' },
  { name: 'বিশেষ সহায়তা', amount: 1200, desc: 'আর্থিক অসচ্ছল ও প্রান্তিক শিক্ষার্থীদের বিশেষ সহায়তা' },
  { name: 'প্রতিবন্ধী উপবৃত্তি', amount: 1500, desc: 'বিশেষ চাহিদাসম্পন্ন শিক্ষার্থীদের উপবৃত্তি' },
  { name: 'অনগ্রসর/উপজাতি উপবৃত্তি', amount: 800, desc: 'অনগ্রসর ও নৃগোষ্ঠী শিক্ষার্থীদের শিক্ষা সহায়তা' },
];

export type StipendComplianceState = 'eligible' | 'suspended' | 'no_data';

export interface SyncedStipendStudent extends Student {
  attRate: number | null; // Real attendance % from attendanceService or student profile (null if no records)
  attRecordedDays: number;
  examScore: number | null; // Real exam score % from student GPA / examMarkAvg (null if no exam marks)
  monthlyAmount: number;
  isEligible: boolean;
  complianceState: StipendComplianceState;
  disqualifyReasons: string[];
  waivedTuitionMonths: number;
  totalTuitionWaivedAmount: number;
}

interface AttendanceAccum {
  present: number;
  total: number;
}

/** Scans real `sms_attendance_*` records in localStorage to compute genuine per-student attendance rates. */
export function scanRealAttendanceRates(): Map<string, { rate: number; totalDays: number }> {
  const accMap = new Map<string, AttendanceAccum>();
  if (typeof window === 'undefined') return new Map();

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('sms_attendance_')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const records = JSON.parse(raw);
      if (!Array.isArray(records)) continue;
      records.forEach((rec: StudentAttendanceRecord) => {
        if (!rec || !rec.id) return;
        const curr = accMap.get(rec.id) || { present: 0, total: 0 };
        curr.total += 1;
        if (rec.status === 'Present' || rec.status === 'Leave') {
          curr.present += 1;
        }
        accMap.set(rec.id, curr);
      });
    }
  } catch {
    // Ignore unreadable storage entries
  }

  const rates = new Map<string, { rate: number; totalDays: number }>();
  accMap.forEach((val, studentId) => {
    if (val.total > 0) {
      rates.set(studentId, {
        rate: Math.round((val.present / val.total) * 100),
        totalDays: val.total,
      });
    }
  });
  return rates;
}

/** Determines whether a student is truly enrolled as an active stipend beneficiary (no fake modulo flags). */
export function isTrueStipendBeneficiary(student: Student): boolean {
  if (student.stipendStatus === 'Revoked') return false;
  if (student.isStipend === true) return true;
  if (student.isStipend === undefined && student.stipendStatus === 'Active') return true;
  return false;
}

/** Builds a real, data-synced stipend evaluation list combining Student DB + Attendance + Exam GPA + Finance Fee Ledgers. */
export function buildSyncedStipendList(
  students: Student[],
  attendanceMap?: Map<string, { rate: number; totalDays: number }>,
  ledgersMap?: Record<string, StudentFeeLedger>
): SyncedStipendStudent[] {
  const realAttMap = attendanceMap || scanRealAttendanceRates();
  const realLedgers = ledgersMap || financeService.getAllStudentLedgers();

  return students.map((s) => {
    const attFromLogs = realAttMap.get(s.id);
    const attRate: number | null =
      attFromLogs !== undefined
        ? attFromLogs.rate
        : typeof s.attendance === 'number' && !Number.isNaN(s.attendance)
          ? Math.round(s.attendance)
          : null;
    const attRecordedDays = attFromLogs?.totalDays || 0;

    let examScore: number | null = null;
    if (typeof s.examMarkAvg === 'number' && !Number.isNaN(s.examMarkAvg)) {
      examScore = Math.round(s.examMarkAvg);
    } else if (s.gpa) {
      const parsedGpa = parseFloat(String(s.gpa));
      if (!Number.isNaN(parsedGpa) && parsedGpa > 0) {
        examScore = Math.min(100, Math.round((parsedGpa / 5) * 100));
      }
    }

    const activeStipend = isTrueStipendBeneficiary(s);
    const category = s.stipendCategory || 'সাধারণ উপবৃত্তি';
    const catConfig = STIPEND_CATEGORIES.find((c) => c.name === category);
    const monthlyAmount = catConfig ? catConfig.amount : 500;

    // Bangladesh Government Stipend Compliance: Attendance >= 75%, Exam Average >= 45%
    const disqualifyReasons: string[] = [];
    if (attRate !== null && attRate < 75) {
      disqualifyReasons.push(`উপস্থিতি ${attRate}% (< ৭৫%)`);
    }
    if (examScore !== null && examScore < 45) {
      disqualifyReasons.push(`প্রাপ্ত নম্বর ${examScore}% (< ৪৫%)`);
    }

    let complianceState: StipendComplianceState = 'eligible';
    if (disqualifyReasons.length > 0) {
      complianceState = 'suspended';
    } else if (attRate === null && examScore === null) {
      complianceState = 'no_data';
    }

    const isEligible = disqualifyReasons.length === 0;

    // Live tuition waiver sync from StudentFeeLedger
    const ledger = realLedgers[s.id];
    const waivedTuitionMonths = ledger
      ? (ledger.months || []).filter((m) => m.status === 'waived').length
      : 0;
    const classFees = financeService.getClassFeesConfig();
    const gradeKey = ledger?.grade || '6th';
    const tuitionRate = classFees[gradeKey]?.tuition ?? 400;
    const totalTuitionWaivedAmount = waivedTuitionMonths * tuitionRate;

    return {
      ...s,
      isStipend: activeStipend,
      stipendCategory: activeStipend ? category : s.stipendCategory,
      stipendStartMonth: s.stipendStartMonth || 'জানুয়ারি',
      attRate,
      attRecordedDays,
      examScore,
      monthlyAmount,
      isEligible,
      complianceState,
      disqualifyReasons,
      waivedTuitionMonths,
      totalTuitionWaivedAmount,
    };
  });
}
