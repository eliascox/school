import { describe, it, expect } from 'vitest';
import { localDateKey, parseLocalDate } from '@/lib/dateUtils';

describe('dateUtils (BUG-003 fix)', () => {
  it('localDateKey produces YYYY-MM-DD from local calendar date', () => {
    const d = new Date(2026, 9, 4, 1, 30, 0); // Oct 4, 2026 at 01:30 local time
    expect(localDateKey(d)).toBe('2026-10-04');
  });

  it('localDateKey pads single digit months and days with leading zeros', () => {
    const d = new Date(2026, 0, 5, 3, 0, 0); // Jan 5, 2026 at 03:00 local time
    expect(localDateKey(d)).toBe('2026-01-05');
  });

  it('parseLocalDate parses YYYY-MM-DD back to local Date object', () => {
    const parsed = parseLocalDate('2026-10-04');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(9); // 0-indexed month: 9 = October
    expect(parsed.getDate()).toBe(4);
  });
});
