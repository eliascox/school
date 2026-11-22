export type SessionAdmissionStatus = 'Open' | 'Closed' | 'Upcoming';
export type SessionLifecycleStatus = 'Active' | 'Archived' | 'Upcoming';
export type SessionStatusFilter = 'all' | SessionLifecycleStatus;

export interface AcademicSession {
  id: string;
  name: string;
  nameBn: string;
  year: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  admissionStatus: SessionAdmissionStatus;
  totalStudents: number;
  totalClasses: number;
  status: SessionLifecycleStatus;
  remarks?: string;
}

export interface SessionInputPayload {
  nameBn: string;
  year: number;
  startDate: string;
  endDate: string;
  admissionStatus?: SessionAdmissionStatus;
  status?: SessionLifecycleStatus;
  remarks?: string;
}

export interface SessionValidationResult {
  valid: boolean;
  error?: string;
}

export interface SessionDeleteGuardResult {
  allowed: boolean;
  reason?: string;
}

export interface SessionStatusCounts {
  all: number;
  active: number;
  upcoming: number;
  archived: number;
}

export const ACADEMIC_SESSIONS_STORAGE_KEY = 'sms_academic_sessions';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const BN_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export const DEFAULT_ACADEMIC_SESSIONS: AcademicSession[] = [
  {
    id: 'ses-2026',
    name: 'Academic Session 2026',
    nameBn: '২০২৬ শিক্ষাবর্ষ',
    year: 2026,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    isCurrent: true,
    admissionStatus: 'Open',
    totalStudents: 0,
    totalClasses: 5,
    status: 'Active',
    remarks: 'বর্তমান সক্রিয় শিক্ষাবর্ষ। নিয়মিত শ্রেণি কার্যক্রম ও অনলাইন ভর্তি চলমান।',
  },
  {
    id: 'ses-2025',
    name: 'Academic Session 2025',
    nameBn: '২০২৫ শিক্ষাবর্ষ',
    year: 2025,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    isCurrent: false,
    admissionStatus: 'Closed',
    totalStudents: 0,
    totalClasses: 5,
    status: 'Archived',
    remarks: 'বিগত শিক্ষাবর্ষ। সকল পরীক্ষার নম্বর, ফলাফল ও রেকর্ড আর্কাইভে সংরক্ষিত।',
  },
  {
    id: 'ses-2027',
    name: 'Academic Session 2027',
    nameBn: '২০২৭ শিক্ষাবর্ষ (প্রস্তাবিত)',
    year: 2027,
    startDate: '2027-01-01',
    endDate: '2027-12-31',
    isCurrent: false,
    admissionStatus: 'Upcoming',
    totalStudents: 0,
    totalClasses: 5,
    status: 'Upcoming',
    remarks: 'আগামী শিক্ষাবর্ষের আগাম সেশন পরিকল্পনা ও ভর্তি পোর্টাল প্রস্তুতি।',
  },
];

export function toAsciiDigits(value: string | number | null | undefined): string {
  return String(value ?? '').replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
}

export function toBanglaDigits(value: string | number | null | undefined): string {
  return String(value ?? '').replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

/**
 * Parses a strict YYYY-MM-DD date string into UTC year/month/day parts without timezone drift.
 */
export function parseIsoDateParts(isoDate: string): { year: number; month: number; day: number } | null {
  const clean = String(isoDate ?? '').trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clean);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

/**
 * Formats an ISO date ('2026-01-01') into natural Bangla ('১ জানুয়ারি ২০২৬').
 */
export function formatBanglaDateBn(isoDate: string): string {
  const parts = parseIsoDateParts(isoDate);
  if (!parts) return String(isoDate ?? '').trim() || '—';
  const monthName = BN_MONTHS[parts.month - 1] || '';
  return `${toBanglaDigits(parts.day)} ${monthName} ${toBanglaDigits(parts.year)}`;
}

/**
 * Computes real formatted Bangla start/end dates and inclusive duration in months/days.
 */
export function formatSessionDateRangeBn(
  startDate: string,
  endDate: string
): {
  startLabelBn: string;
  endLabelBn: string;
  rangeLabelBn: string;
  durationMonths: number | null;
  durationLabelBn: string;
} {
  const startParts = parseIsoDateParts(startDate);
  const endParts = parseIsoDateParts(endDate);
  const startLabelBn = formatBanglaDateBn(startDate);
  const endLabelBn = formatBanglaDateBn(endDate);
  const rangeLabelBn = `${startLabelBn} — ${endLabelBn}`;

  if (!startParts || !endParts) {
    return {
      startLabelBn,
      endLabelBn,
      rangeLabelBn,
      durationMonths: null,
      durationLabelBn: '',
    };
  }

  const startMs = Date.UTC(startParts.year, startParts.month - 1, startParts.day);
  const endMs = Date.UTC(endParts.year, endParts.month - 1, endParts.day);
  if (endMs < startMs) {
    return {
      startLabelBn,
      endLabelBn,
      rangeLabelBn,
      durationMonths: null,
      durationLabelBn: 'তারিখ অসামঞ্জস্যপূর্ণ',
    };
  }

  const totalDays = Math.floor((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
  // Inclusive calendar month approximation (e.g. Jan 1 - Dec 31 => 12 months)
  const rawMonthDiff =
    (endParts.year - startParts.year) * 12 +
    (endParts.month - startParts.month) +
    (endParts.day >= startParts.day ? 1 : 0);

  if (totalDays < 28) {
    return {
      startLabelBn,
      endLabelBn,
      rangeLabelBn,
      durationMonths: 0,
      durationLabelBn: `${toBanglaDigits(totalDays)} দিন`,
    };
  }

  const durationMonths = Math.max(1, rawMonthDiff);
  return {
    startLabelBn,
    endLabelBn,
    rangeLabelBn,
    durationMonths,
    durationLabelBn: `${toBanglaDigits(durationMonths)} মাস`,
  };
}

/**
 * Counts real students belonging to a given academic session.
 * - Matches students whose `session` string contains the session's 4-digit year (Bangla or ASCII digits).
 * - For the current active session, also includes enrolled students with no explicit `session` field.
 * - For archived/upcoming sessions with 0 live tagged students, falls back to any saved historical `totalStudents`.
 */
export function countStudentsForSession(
  students: Array<{ session?: string }>,
  session: Pick<AcademicSession, 'year' | 'isCurrent' | 'totalStudents'>
): number {
  const yearStr = String(session.year);
  let matched = 0;

  for (const st of students) {
    const rawSession = toAsciiDigits(st.session ?? '').trim();
    if (!rawSession) {
      if (session.isCurrent) {
        matched++;
      }
      continue;
    }

    // Extract 4-digit years (supports '2026', '2025-2026', 'Session 2026', etc.)
    const years = rawSession.match(/\d{4}/g);
    if (years) {
      // If a range like '2025-2026', match the ending/primary year or exact year
      if (years[years.length - 1] === yearStr || years.includes(yearStr)) {
        matched++;
      }
    } else if (rawSession === yearStr) {
      matched++;
    }
  }

  if (matched > 0 || session.isCurrent) {
    return matched;
  }

  return Math.max(0, Number(session.totalStudents) || 0);
}

/**
 * Strict validation for creating or editing an Academic Session:
 * - Requires non-empty Bangla name
 * - Requires valid integer year (2000–2100)
 * - Blocks duplicate year across sessions (excluding `editingId`)
 * - Requires valid ISO startDate and endDate with `startDate <= endDate`
 */
export function validateSessionInput(
  input: SessionInputPayload,
  existingSessions: AcademicSession[],
  editingId?: string
): SessionValidationResult {
  const trimmedName = String(input.nameBn ?? '').trim();
  if (!trimmedName) {
    return { valid: false, error: 'অনুগ্রহ করে শিক্ষাবর্ষের নাম (বাংলা) লিখুন।' };
  }

  const yearNum = Number(toAsciiDigits(String(input.year ?? '')));
  if (!Number.isInteger(yearNum) || yearNum < 2000 || yearNum > 2100) {
    return { valid: false, error: 'অনুগ্রহ করে ২০০০ থেকে ২১০০-এর মধ্যে একটি সঠিক সাল লিখুন।' };
  }

  const duplicate = existingSessions.find(
    (s) => Number(s.year) === yearNum && s.id !== editingId
  );
  if (duplicate) {
    return {
      valid: false,
      error: `${toBanglaDigits(yearNum)} সালের শিক্ষাবর্ষ (${duplicate.nameBn}) ইতোমধ্যে তালিকায় রয়েছে। একই সালের ডুপ্লিকেট সেশন তৈরি করা যাবে না।`,
    };
  }

  const startParts = parseIsoDateParts(input.startDate);
  if (!startParts) {
    return { valid: false, error: 'অনুগ্রহ করে সঠিক শুরুর তারিখ নির্বাচন করুন।' };
  }

  const endParts = parseIsoDateParts(input.endDate);
  if (!endParts) {
    return { valid: false, error: 'অনুগ্রহ করে সঠিক শেষের তারিখ নির্বাচন করুন।' };
  }

  if (input.startDate > input.endDate) {
    return {
      valid: false,
      error: 'শুরুর তারিখ শেষের তারিখের চেয়ে বড় হতে পারবে না (শুরুর তারিখ <= শেষের তারিখ হতে হবে)।',
    };
  }

  return { valid: true };
}

/**
 * Safety guard preventing deletion of:
 * 1. The sole remaining session in the system
 * 2. The currently active session (`isCurrent` or `status === 'Active'`)
 */
export function canDeleteSession(
  sessions: AcademicSession[],
  targetId: string
): SessionDeleteGuardResult {
  const target = sessions.find((s) => s.id === targetId);
  if (!target) {
    return { allowed: false, reason: 'নির্বাচিত শিক্ষাবর্ষটি খুঁজে পাওয়া যায়নি।' };
  }

  if (sessions.length <= 1) {
    return {
      allowed: false,
      reason: 'সিস্টেমে অন্তত একটি শিক্ষাবর্ষ থাকতে হবে; একমাত্র সেশনটি মুছে ফেলা যাবে না।',
    };
  }

  if (target.isCurrent || target.status === 'Active') {
    return {
      allowed: false,
      reason: 'বর্তমান সক্রিয় শিক্ষাবর্ষটি সরাসরি মুছে ফেলা যাবে না। আগে অন্য একটি সেশন সক্রিয় করুন।',
    };
  }

  return { allowed: true };
}

/**
 * Safely normalizes raw localStorage (`sms_academic_sessions`) JSON into valid AcademicSession[].
 * Ensures:
 * - Falls back to DEFAULT_ACADEMIC_SESSIONS when empty or invalid
 * - Deduplicates accidental duplicate IDs
 * - Guarantees valid startDate/endDate fallbacks and exactly ONE `isCurrent: true` session
 */
export function normalizeLoadedSessions(raw: unknown): AcademicSession[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_ACADEMIC_SESSIONS.map((s) => ({ ...s }));
  }

  const seenIds = new Set<string>();
  const normalized: AcademicSession[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Partial<AcademicSession>;
    const yearNum = Number(toAsciiDigits(String(rec.year ?? ''))) || new Date().getFullYear();
    const id = String(rec.id || `ses-${yearNum}`).trim() || `ses-${yearNum}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const startDate = parseIsoDateParts(String(rec.startDate ?? ''))
      ? String(rec.startDate)
      : `${yearNum}-01-01`;
    const endDate =
      parseIsoDateParts(String(rec.endDate ?? '')) && String(rec.endDate) >= startDate
        ? String(rec.endDate)
        : `${yearNum}-12-31`;

    const admissionStatus: SessionAdmissionStatus =
      rec.admissionStatus === 'Open' ||
      rec.admissionStatus === 'Closed' ||
      rec.admissionStatus === 'Upcoming'
        ? rec.admissionStatus
        : 'Closed';

    const status: SessionLifecycleStatus =
      rec.status === 'Active' || rec.status === 'Archived' || rec.status === 'Upcoming'
        ? rec.status
        : rec.isCurrent
        ? 'Active'
        : 'Upcoming';

    normalized.push({
      id,
      name: String(rec.name || `Academic Session ${yearNum}`),
      nameBn: String(rec.nameBn || `${toBanglaDigits(yearNum)} শিক্ষাবর্ষ`),
      year: yearNum,
      startDate,
      endDate,
      isCurrent: Boolean(rec.isCurrent),
      admissionStatus,
      totalStudents: Math.max(0, Number(rec.totalStudents) || 0),
      totalClasses: Math.max(1, Number(rec.totalClasses) || 5),
      status,
      remarks: typeof rec.remarks === 'string' ? rec.remarks : '',
    });
  }

  if (normalized.length === 0) {
    return DEFAULT_ACADEMIC_SESSIONS.map((s) => ({ ...s }));
  }

  // Ensure strictly one current active session
  let currentIdx = normalized.findIndex((s) => s.isCurrent);
  if (currentIdx === -1) {
    currentIdx = normalized.findIndex((s) => s.status === 'Active');
  }
  if (currentIdx === -1) {
    currentIdx = 0;
  }

  return normalized.map((s, idx) => {
    const isCurrent = idx === currentIdx;
    return {
      ...s,
      isCurrent,
      status: isCurrent ? 'Active' : s.status === 'Active' ? 'Archived' : s.status,
    };
  });
}

/**
 * Computes tab counts for the flush sticky sub-header.
 */
export function computeSessionStatusCounts(sessions: AcademicSession[]): SessionStatusCounts {
  let active = 0;
  let upcoming = 0;
  let archived = 0;

  for (const s of sessions) {
    if (s.isCurrent || s.status === 'Active') active++;
    else if (s.status === 'Upcoming') upcoming++;
    else archived++;
  }

  return {
    all: sessions.length,
    active,
    upcoming,
    archived,
  };
}

/**
 * Filters and sorts sessions: Active first, then Upcoming, then Archived (newest year first within each group).
 */
export function filterAcademicSessions(
  sessions: AcademicSession[],
  options: { statusFilter?: SessionStatusFilter; query?: string } = {}
): AcademicSession[] {
  const statusFilter = options.statusFilter || 'all';
  const rawQuery = (options.query || '').trim();
  const rawLower = rawQuery.toLowerCase();
  const asciiQuery = toAsciiDigits(rawQuery).toLowerCase();

  const filtered = sessions.filter((s) => {
    const effectiveStatus: SessionLifecycleStatus = s.isCurrent ? 'Active' : s.status;
    if (statusFilter !== 'all' && effectiveStatus !== statusFilter) {
      return false;
    }

    if (!rawQuery) return true;

    const range = formatSessionDateRangeBn(s.startDate, s.endDate);
    const haystack = [
      s.nameBn,
      s.name,
      String(s.year),
      toBanglaDigits(s.year),
      s.startDate,
      s.endDate,
      range.rangeLabelBn,
      s.remarks || '',
      s.admissionStatus,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(rawLower) || toAsciiDigits(haystack).includes(asciiQuery);
  });

  const priority = (s: AcademicSession) => {
    if (s.isCurrent || s.status === 'Active') return 0;
    if (s.status === 'Upcoming') return 1;
    return 2;
  };

  return [...filtered].sort((a, b) => {
    const pDiff = priority(a) - priority(b);
    if (pDiff !== 0) return pDiff;
    return b.year - a.year;
  });
}

export interface SessionProgressInfo {
  percent: number;
  state: 'not_started' | 'in_progress' | 'completed';
  remainingDays: number;
  labelBn: string;
}

/**
 * Computes real calendar progress percentage and remaining/upcoming days for a session.
 */
export function computeSessionProgress(
  startDate: string,
  endDate: string,
  referenceDate: Date = new Date()
): SessionProgressInfo {
  const startParts = parseIsoDateParts(startDate);
  const endParts = parseIsoDateParts(endDate);
  if (!startParts || !endParts) {
    return { percent: 0, state: 'not_started', remainingDays: 0, labelBn: 'তারিখ অনির্ধারিত' };
  }

  const dayMs = 1000 * 60 * 60 * 24;
  const startMs = Date.UTC(startParts.year, startParts.month - 1, startParts.day);
  const endMs = Date.UTC(endParts.year, endParts.month - 1, endParts.day);
  const todayMs = Date.UTC(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  if (endMs < startMs) {
    return { percent: 0, state: 'not_started', remainingDays: 0, labelBn: 'তারিখ অসামঞ্জস্যপূর্ণ' };
  }

  if (todayMs < startMs) {
    const daysUntil = Math.ceil((startMs - todayMs) / dayMs);
    return {
      percent: 0,
      state: 'not_started',
      remainingDays: daysUntil,
      labelBn: `শুরু হতে ${toBanglaDigits(daysUntil)} দিন বাকি`,
    };
  }

  if (todayMs > endMs) {
    return {
      percent: 100,
      state: 'completed',
      remainingDays: 0,
      labelBn: 'মেয়াদ সম্পন্ন',
    };
  }

  const totalDays = Math.max(1, Math.floor((endMs - startMs) / dayMs) + 1);
  const elapsedDays = Math.floor((todayMs - startMs) / dayMs) + 1;
  const remainingDays = Math.max(0, Math.floor((endMs - todayMs) / dayMs));
  const percent = Math.min(100, Math.max(1, Math.round((elapsedDays / totalDays) * 100)));

  return {
    percent,
    state: 'in_progress',
    remainingDays,
    labelBn:
      remainingDays === 0
        ? 'আজ শেষ দিন'
        : `${toBanglaDigits(percent)}% সম্পন্ন • ${toBanglaDigits(remainingDays)} দিন বাকি`,
  };
}

/**
 * Suggests the next non-duplicate year and full-year date range when opening "+ নতুন সেশন".
 */
export function suggestNextSessionDraft(sessions: AcademicSession[]): {
  nameBn: string;
  year: number;
  startDate: string;
  endDate: string;
  admissionStatus: SessionAdmissionStatus;
  remarks: string;
} {
  const maxYear = sessions.reduce(
    (max, s) => (Number.isInteger(s.year) && s.year > max ? s.year : max),
    new Date().getFullYear()
  );
  const nextYear = maxYear + 1;
  return {
    nameBn: `${toBanglaDigits(nextYear)} শিক্ষাবর্ষ`,
    year: nextYear,
    startDate: `${nextYear}-01-01`,
    endDate: `${nextYear}-12-31`,
    admissionStatus: 'Upcoming',
    remarks: '',
  };
}
