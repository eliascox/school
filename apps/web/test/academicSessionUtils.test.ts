import { describe, expect, it } from 'vitest';
import {
  AcademicSession,
  canDeleteSession,
  computeSessionProgress,
  computeSessionStatusCounts,
  countStudentsForSession,
  DEFAULT_ACADEMIC_SESSIONS,
  filterAcademicSessions,
  formatBanglaDateBn,
  formatSessionDateRangeBn,
  normalizeLoadedSessions,
  suggestNextSessionDraft,
  validateSessionInput,
} from '@/lib/academicSessionUtils';

describe('academicSessionUtils', () => {
  it('formats real ISO start and end dates into Bangla with accurate month/day durations', () => {
    expect(formatBanglaDateBn('2026-01-01')).toBe('১ জানুয়ারি ২০২৬');
    expect(formatBanglaDateBn('2026-12-31')).toBe('৩১ ডিসেম্বর ২০২৬');

    const fullYear = formatSessionDateRangeBn('2026-01-01', '2026-12-31');
    expect(fullYear.rangeLabelBn).toBe('১ জানুয়ারি ২০২৬ — ৩১ ডিসেম্বর ২০২৬');
    expect(fullYear.durationMonths).toBe(12);
    expect(fullYear.durationLabelBn).toBe('১২ মাস');

    const customRange = formatSessionDateRangeBn('2026-07-01', '2027-06-30');
    expect(customRange.startLabelBn).toBe('১ জুলাই ২০২৬');
    expect(customRange.endLabelBn).toBe('৩০ জুন ২০২৭');
    expect(customRange.durationMonths).toBe(12);

    const shortRange = formatSessionDateRangeBn('2026-03-01', '2026-03-15');
    expect(shortRange.durationLabelBn).toBe('১৫ দিন');
  });

  it('prevents duplicate year creation, allows keeping own year during edit, and enforces startDate <= endDate', () => {
    // Duplicate year on create -> rejected
    const dupRes = validateSessionInput(
      {
        nameBn: 'আরেকটি ২০২৬',
        year: 2026,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      },
      DEFAULT_ACADEMIC_SESSIONS
    );
    expect(dupRes.valid).toBe(false);
    expect(dupRes.error).toContain('ডুপ্লিকেট');

    // Editing same session with its own year -> allowed
    const editSameYear = validateSessionInput(
      {
        nameBn: '২০২৬ শিক্ষাবর্ষ (হালনাগাদ)',
        year: 2026,
        startDate: '2026-01-15',
        endDate: '2026-12-20',
      },
      DEFAULT_ACADEMIC_SESSIONS,
      'ses-2026'
    );
    expect(editSameYear.valid).toBe(true);

    // Editing a session to collide with another session's year -> rejected
    const editCollision = validateSessionInput(
      {
        nameBn: '২০২৭ এডিট',
        year: 2026,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      },
      DEFAULT_ACADEMIC_SESSIONS,
      'ses-2027'
    );
    expect(editCollision.valid).toBe(false);

    // startDate > endDate -> rejected
    const badRange = validateSessionInput(
      {
        nameBn: '২০২৮ শিক্ষাবর্ষ',
        year: 2028,
        startDate: '2028-12-31',
        endDate: '2028-01-01',
      },
      DEFAULT_ACADEMIC_SESSIONS
    );
    expect(badRange.valid).toBe(false);
    expect(badRange.error).toContain('শুরুর তারিখ');

    // Equal startDate === endDate -> valid (startDate <= endDate)
    const sameDay = validateSessionInput(
      {
        nameBn: '২০২৮ বিশেষ সেশন',
        year: 2028,
        startDate: '2028-06-01',
        endDate: '2028-06-01',
      },
      DEFAULT_ACADEMIC_SESSIONS
    );
    expect(sameDay.valid).toBe(true);
  });

  it('blocks deleting the active session or the sole remaining session, while allowing inactive session deletion', () => {
    // Active session blocked
    const activeGuard = canDeleteSession(DEFAULT_ACADEMIC_SESSIONS, 'ses-2026');
    expect(activeGuard.allowed).toBe(false);

    // Inactive/Upcoming session allowed when > 1 session exists
    expect(canDeleteSession(DEFAULT_ACADEMIC_SESSIONS, 'ses-2027').allowed).toBe(true);
    expect(canDeleteSession(DEFAULT_ACADEMIC_SESSIONS, 'ses-2025').allowed).toBe(true);

    // Sole session blocked even if marked Archived
    const soleOnly: AcademicSession[] = [
      { ...DEFAULT_ACADEMIC_SESSIONS[1], isCurrent: false, status: 'Archived' },
    ];
    const soleGuard = canDeleteSession(soleOnly, 'ses-2025');
    expect(soleGuard.allowed).toBe(false);
  });

  it('computes real per-session student counts including untagged students in the active session and Bangla digits', () => {
    const students = [
      { session: '2026' },
      { session: '২০২৬' },
      { session: '' }, // untagged -> counts under active session (2026)
      { session: undefined }, // untagged -> counts under active session (2026)
      { session: '2027' },
      { session: '2025-2026' }, // contains 2026 & 2025
    ];

    expect(countStudentsForSession(students, DEFAULT_ACADEMIC_SESSIONS[0])).toBe(5);
    expect(countStudentsForSession(students, DEFAULT_ACADEMIC_SESSIONS[2])).toBe(1);
    expect(countStudentsForSession(students, DEFAULT_ACADEMIC_SESSIONS[1])).toBe(1);
  });

  it('normalizes loaded localStorage data safely and enforces strictly one active session', () => {
    expect(normalizeLoadedSessions(null)).toHaveLength(3);
    expect(normalizeLoadedSessions([])).toHaveLength(3);

    const messy = [
      { id: 'ses-2025', year: 2025, status: 'Archived', isCurrent: false },
      { id: 'ses-2026', year: 2026, status: 'Active', isCurrent: true },
      { id: 'ses-2027', year: 2027, status: 'Active', isCurrent: true }, // duplicate active
    ];
    const clean = normalizeLoadedSessions(messy);
    expect(clean.filter((s) => s.isCurrent)).toHaveLength(1);
    expect(clean.find((s) => s.id === 'ses-2026')?.isCurrent).toBe(true);
    expect(clean.find((s) => s.id === 'ses-2027')?.status).toBe('Archived');
    expect(clean.find((s) => s.id === 'ses-2025')?.startDate).toBe('2025-01-01');
  });

  it('filters by status tabs and bilingual Bangla/ASCII search and suggests next unique year', () => {
    const counts = computeSessionStatusCounts(DEFAULT_ACADEMIC_SESSIONS);
    expect(counts).toEqual({ all: 3, active: 1, upcoming: 1, archived: 1 });

    expect(
      filterAcademicSessions(DEFAULT_ACADEMIC_SESSIONS, { statusFilter: 'Upcoming' }).map((s) => s.id)
    ).toEqual(['ses-2027']);

    expect(
      filterAcademicSessions(DEFAULT_ACADEMIC_SESSIONS, { query: '২০২৫' }).map((s) => s.id)
    ).toEqual(['ses-2025']);

    expect(
      filterAcademicSessions(DEFAULT_ACADEMIC_SESSIONS, { query: '2027' }).map((s) => s.id)
    ).toEqual(['ses-2027']);

    const draft = suggestNextSessionDraft(DEFAULT_ACADEMIC_SESSIONS);
    expect(draft.year).toBe(2028);
    expect(draft.startDate).toBe('2028-01-01');
    expect(draft.endDate).toBe('2028-12-31');
    expect(draft.nameBn).toBe('২০২৮ শিক্ষাবর্ষ');
  });

  it('computes accurate session calendar progress for upcoming, in-progress, and completed dates', () => {
    const midYear = computeSessionProgress('2026-01-01', '2026-12-31', new Date(2026, 6, 2));
    expect(midYear.state).toBe('in_progress');
    expect(midYear.percent).toBeGreaterThanOrEqual(49);
    expect(midYear.percent).toBeLessThanOrEqual(52);
    expect(midYear.remainingDays).toBeGreaterThan(170);

    const upcoming = computeSessionProgress('2027-01-01', '2027-12-31', new Date(2026, 11, 22));
    expect(upcoming.state).toBe('not_started');
    expect(upcoming.percent).toBe(0);
    expect(upcoming.remainingDays).toBe(10);

    const completed = computeSessionProgress('2025-01-01', '2025-12-31', new Date(2026, 0, 5));
    expect(completed.state).toBe('completed');
    expect(completed.percent).toBe(100);
    expect(completed.remainingDays).toBe(0);
  });
});
