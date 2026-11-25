import { BANGLA_MONTHS, PayrollRecord } from '@/services/financeService';
import { leaveService } from '@/services/leaveService';
import { TeacherRecord } from '@/services/teacherRBACService';

export type StaffCategory = 'teacher' | 'staff';

export interface StaffSalaryProfile {
  teacherId: string;
  staffCategory: StaffCategory;
  baseSalary: number;
  houseRent: number;
  medicalAllowance: number;
  otherAllowance: number;
  pfPercent: number; // e.g. 5 or 10 (% of baseSalary)
  defaultPaymentMethod: PayrollRecord['paymentMethod'];
  bankAccountId?: string;
  bankAccountNo?: string;
  mobileBankingNo?: string;
  updatedAt?: string;
}

export interface PayrollCalculationInput {
  baseSalary: number;
  allowances: number;
  bonus: number;
  pfDeduction: number;
  otherDeduction?: number;
}

export interface PayrollCalculationResult {
  valid: boolean;
  error?: string;
  grossSalary: number;
  pfDeduction: number;
  otherDeduction: number;
  totalDeductions: number;
  netPayable: number;
}

const SALARY_PROFILES_STORAGE_KEY = 'sms_staff_salary_profiles';

const OFFICE_STAFF_KEYWORDS = [
  'অফিস',
  'সহকারী কাম',
  'ক্লার্ক',
  'পিয়ন',
  'দপ্তরি',
  'নৈশপ্রহরী',
  'আয়া',
  'মালি',
  'গার্ড',
  'হিসাবরক্ষক',
  'কম্পিউটার অপারেটর',
  'ল্যাব সহকারী',
  'staff',
  'clerk',
  'office',
  'peon',
  'guard',
  'accountant',
];

/** Infers whether a designation belongs to Teachers (COA 5010) or Office Staff (COA 5020). */
export function inferStaffCategory(designation?: string): StaffCategory {
  const lower = (designation || '').toLowerCase();
  return OFFICE_STAFF_KEYWORDS.some((kw) => lower.includes(kw)) ? 'staff' : 'teacher';
}

/** Computes and validates payroll totals, enforcing non-negative salary and deduction <= gross invariants. */
export function computePayrollBreakdown(input: PayrollCalculationInput): PayrollCalculationResult {
  const baseSalary = Math.max(0, Math.round(Number(input.baseSalary) || 0));
  const allowances = Math.max(0, Math.round(Number(input.allowances) || 0));
  const bonus = Math.max(0, Math.round(Number(input.bonus) || 0));
  const pfDeduction = Math.max(0, Math.round(Number(input.pfDeduction) || 0));
  const otherDeduction = Math.max(0, Math.round(Number(input.otherDeduction) || 0));

  const grossSalary = baseSalary + allowances + bonus;
  const totalDeductions = pfDeduction + otherDeduction;

  if (grossSalary <= 0) {
    return {
      valid: false,
      error: 'মূল বেতন বা মোট প্রাপ্য ০ টাকার বেশি হতে হবে।',
      grossSalary,
      pfDeduction,
      otherDeduction,
      totalDeductions,
      netPayable: 0,
    };
  }

  if (totalDeductions > grossSalary) {
    return {
      valid: false,
      error: `মোট কর্তন (৳${totalDeductions}) মোট বেতন (৳${grossSalary}) এর বেশি হতে পারবে না।`,
      grossSalary,
      pfDeduction,
      otherDeduction,
      totalDeductions,
      netPayable: 0,
    };
  }

  return {
    valid: true,
    grossSalary,
    pfDeduction,
    otherDeduction,
    totalDeductions,
    netPayable: grossSalary - totalDeductions,
  };
}

/** Loads all saved staff salary profiles indexed by teacherId. */
export function getStaffSalaryProfiles(): Record<string, StaffSalaryProfile> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SALARY_PROFILES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // Ignore malformed profile storage
  }
  return {};
}

/** Persists a single teacher/staff salary structure profile. */
export function saveStaffSalaryProfile(profile: StaffSalaryProfile): Record<string, StaffSalaryProfile> {
  const all = getStaffSalaryProfiles();
  all[profile.teacherId] = {
    ...profile,
    baseSalary: Math.max(0, Number(profile.baseSalary) || 0),
    houseRent: Math.max(0, Number(profile.houseRent) || 0),
    medicalAllowance: Math.max(0, Number(profile.medicalAllowance) || 0),
    otherAllowance: Math.max(0, Number(profile.otherAllowance) || 0),
    pfPercent: Math.min(50, Math.max(0, Number(profile.pfPercent) || 0)),
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SALARY_PROFILES_STORAGE_KEY, JSON.stringify(all));
      window.dispatchEvent(new Event('storage'));
    } catch {
      // Ignore quota errors
    }
  }
  return all;
}

/** Returns default salary profile merged with saved profile for a teacher/staff member. */
export function getEffectiveSalaryProfile(
  teacher: Pick<TeacherRecord, 'id' | 'designation' | 'phone'>,
  profilesMap?: Record<string, StaffSalaryProfile>
): StaffSalaryProfile {
  const map = profilesMap || getStaffSalaryProfiles();
  if (map[teacher.id]) return map[teacher.id];
  return {
    teacherId: teacher.id,
    staffCategory: inferStaffCategory(teacher.designation),
    baseSalary: 0,
    houseRent: 0,
    medicalAllowance: 0,
    otherAllowance: 0,
    pfPercent: 0,
    defaultPaymentMethod: 'Bank Transfer',
    mobileBankingNo: teacher.phone || '',
  };
}

/** Counts approved leave days overlapping a given Bangla month & year from leaveService. */
export function getStaffMonthlyApprovedLeaveDays(
  teacherId: string,
  teacherName: string,
  month: string,
  year: number
): number {
  const monthIdx = BANGLA_MONTHS.indexOf(month);
  if (monthIdx < 0) return 0;

  const monthStart = new Date(year, monthIdx, 1);
  const monthEnd = new Date(year, monthIdx + 1, 0);
  const leaves = leaveService.getLeaves().filter((l) => {
    if (l.status !== 'approved') return false;
    const matchId = teacherId && l.teacherId?.toLowerCase() === teacherId.toLowerCase();
    const matchName = teacherName && l.teacherName?.toLowerCase() === teacherName.toLowerCase();
    return Boolean(matchId || matchName);
  });

  let totalDays = 0;
  for (const leave of leaves) {
    const s = new Date(leave.startDate);
    const e = new Date(leave.endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) continue;
    const overlapStart = s > monthStart ? s : monthStart;
    const overlapEnd = e < monthEnd ? e : monthEnd;
    if (overlapEnd >= overlapStart) {
      const diff = Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      totalDays += diff;
    }
  }
  return totalDays;
}

/** Checks whether a payroll entry already exists for the same staff member, month, and year. */
export function hasDuplicatePayrollEntry(
  existingPayrolls: PayrollRecord[],
  teacherId: string,
  teacherName: string,
  month: string,
  year: number,
  excludeId?: string
): boolean {
  const normId = (teacherId || '').trim().toLowerCase();
  const normName = (teacherName || '').trim().toLowerCase();
  return existingPayrolls.some((p) => {
    if (excludeId && p.id === excludeId) return false;
    if (p.month !== month || Number(p.year) !== Number(year)) return false;
    if (normId && p.teacherId && p.teacherId.trim().toLowerCase() === normId) return true;
    if (!normId && normName && p.teacherName.trim().toLowerCase() === normName) return true;
    return false;
  });
}

/** Generates Draft/Pending payroll records for all active teachers/staff using their saved salary profiles & approved leaves. */
export function buildMonthlyPayrollDrafts(params: {
  teachers: TeacherRecord[];
  existingPayrolls: PayrollRecord[];
  month: string;
  year: number;
  profiles?: Record<string, StaffSalaryProfile>;
  defaultBankAccountId?: string;
}): {
  createdDrafts: PayrollRecord[];
  skippedExisting: number;
  skippedNoSalary: number;
} {
  const profiles = params.profiles || getStaffSalaryProfiles();
  const monthIdx = Math.max(0, BANGLA_MONTHS.indexOf(params.month));
  const activeTeachers = params.teachers.filter((t) => t.status !== 'inactive');

  const createdDrafts: PayrollRecord[] = [];
  let skippedExisting = 0;
  let skippedNoSalary = 0;

  activeTeachers.forEach((t, idx) => {
    if (hasDuplicatePayrollEntry(params.existingPayrolls, t.id, t.name, params.month, params.year)) {
      skippedExisting++;
      return;
    }

    const prof = getEffectiveSalaryProfile(t, profiles);
    const totalAllowances =
      (Number(prof.houseRent) || 0) +
      (Number(prof.medicalAllowance) || 0) +
      (Number(prof.otherAllowance) || 0);
    const pfAmount = Math.round(((Number(prof.baseSalary) || 0) * (Number(prof.pfPercent) || 0)) / 100);
    const calc = computePayrollBreakdown({
      baseSalary: prof.baseSalary,
      allowances: totalAllowances,
      bonus: 0,
      pfDeduction: pfAmount,
      otherDeduction: 0,
    });

    if (!calc.valid) {
      skippedNoSalary++;
      return;
    }

    const leaveDays = getStaffMonthlyApprovedLeaveDays(t.id, t.name, params.month, params.year);
    const seq = String(params.existingPayrolls.length + createdDrafts.length + 1).padStart(3, '0');
    const vNo = `PR-${params.year}-${String(monthIdx + 1).padStart(2, '0')}-${seq}`;

    createdDrafts.push({
      id: `PAY-${Date.now()}-${idx}-${Math.floor(100 + Math.random() * 900)}`,
      voucherNo: vNo,
      teacherId: t.id,
      teacherName: t.name,
      designation: t.designation || 'সহকারী শিক্ষক',
      staffCategory: prof.staffCategory,
      month: params.month,
      year: params.year,
      baseSalary: prof.baseSalary,
      allowances: totalAllowances,
      bonus: 0,
      deductions: calc.totalDeductions,
      pfDeduction: calc.pfDeduction,
      otherDeduction: 0,
      approvedLeaveDays: leaveDays,
      netPayable: calc.netPayable,
      paidAmount: 0,
      status: 'Pending',
      paymentDate: '',
      paymentMethod: prof.defaultPaymentMethod || 'Bank Transfer',
      bankAccountId: prof.bankAccountId || params.defaultBankAccountId,
      trxId: '',
      note: leaveDays > 0 ? `মাসিক বেতন শিট (অনুমোদিত ছুটি: ${leaveDays} দিন)` : 'মাসিক বেতন শিট (অটো-জেনারেটেড)',
    });
  });

  return {
    createdDrafts,
    skippedExisting,
    skippedNoSalary,
  };
}
