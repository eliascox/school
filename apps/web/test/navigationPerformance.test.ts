import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  toCanonicalRouteHref,
  syncUrlQueryParams,
  trySameRouteQueryNavigation,
  createLiveQueryLookup,
  areSessionsEqual,
  URL_QUERY_CHANGED_EVENT,
} from '../src/lib/urlTabSync';
import { studentService } from '../src/services/studentService';
import { financeService } from '../src/services/financeService';
import type { UserSession } from '../src/services/teacherAuthService';

function createMemoryStorage() {
  const store = new Map<string, string>();
  const api = {
    get length() {
      return store.size;
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
  return { store, api };
}

describe('Navigation, URL Query Sync & Service Caching Performance', () => {
  let mem: ReturnType<typeof createMemoryStorage>;

  beforeEach(() => {
    mem = createMemoryStorage();
    vi.stubGlobal('localStorage', mem.api);
    studentService.invalidateCache();
  });

  it('toCanonicalRouteHref appends trailing slash cleanly for Vercel trailingSlash: true', () => {
    expect(toCanonicalRouteHref('/dashboard')).toBe('/dashboard/');
    expect(toCanonicalRouteHref('/dashboard/')).toBe('/dashboard/');
    expect(toCanonicalRouteHref('/dashboard/students')).toBe('/dashboard/students/');
    expect(toCanonicalRouteHref('/dashboard/finance?tab=expenses')).toBe(
      '/dashboard/finance/?tab=expenses',
    );
    expect(toCanonicalRouteHref('/dashboard/students?view=print#top')).toBe(
      '/dashboard/students/?view=print#top',
    );
    expect(toCanonicalRouteHref('/')).toBe('/');
    expect(toCanonicalRouteHref('/manifest.json')).toBe('/manifest.json');
    expect(toCanonicalRouteHref('https://example.com/path')).toBe('https://example.com/path');
  });

  it('syncUrlQueryParams preserves window.history.state, updates query, and emits live event', () => {
    const existingHistoryState = { __NA: true, tree: ['dashboard'] };
    let lastUrl = '/dashboard/finance/?tab=student_fees';
    let lastState: unknown = existingHistoryState;
    const dispatched: Event[] = [];

    const mockWin = {
      location: { pathname: '/dashboard/finance/', search: '?tab=student_fees' },
      history: {
        get state() {
          return lastState;
        },
        replaceState: vi.fn((state: unknown, _title: string, url: string) => {
          lastState = state;
          lastUrl = url;
          const [p, q = ''] = url.split('?');
          mockWin.location.pathname = p;
          mockWin.location.search = q ? `?${q}` : '';
        }),
        pushState: vi.fn((state: unknown, _title: string, url: string) => {
          lastState = state;
          lastUrl = url;
          const [p, q = ''] = url.split('?');
          mockWin.location.pathname = p;
          mockWin.location.search = q ? `?${q}` : '';
        }),
      },
      dispatchEvent: vi.fn((evt: Event) => {
        dispatched.push(evt);
        return true;
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    vi.stubGlobal('window', mockWin);

    const next = syncUrlQueryParams('/dashboard/finance', { tab: 'expenses' });
    expect(next).toBe('/dashboard/finance/?tab=expenses');
    expect(lastUrl).toBe('/dashboard/finance/?tab=expenses');
    expect(lastState).toBe(existingHistoryState);
    expect(mockWin.history.replaceState).toHaveBeenCalledTimes(1);
    expect(dispatched.some((e) => e.type === URL_QUERY_CHANGED_EVENT)).toBe(true);

    // Same-route sidebar click switches tab in 0ms without router RSC round-trip
    const handledSame = trySameRouteQueryNavigation(
      '/dashboard/finance?tab=payroll',
      '/dashboard/finance/',
    );
    expect(handledSame).toBe(true);
    expect(lastUrl).toBe('/dashboard/finance/?tab=payroll');

    // Cross-route click returns false so Next.js <Link> navigates normally
    const handledDiff = trySameRouteQueryNavigation(
      '/dashboard/students',
      '/dashboard/finance/',
    );
    expect(handledDiff).toBe(false);

    const lookup = createLiveQueryLookup({ get: () => 'old' }, '?tab=payroll');
    expect(lookup.get('tab')).toBe('payroll');

    vi.unstubAllGlobals();
    vi.stubGlobal('localStorage', mem.api);
  });

  it('areSessionsEqual prevents redundant shell re-renders on unrelated storage events', () => {
    const a: UserSession = {
      role: 'admin',
      loginAt: 1000,
      expiresAt: 999999,
      sig: 'v2_abc',
    };
    const b: UserSession = { ...a };
    const c: UserSession = { ...a, role: 'teacher', teacherId: 'T-1' };

    expect(areSessionsEqual(a, b)).toBe(true);
    expect(areSessionsEqual(a, c)).toBe(false);
    expect(areSessionsEqual(null, null)).toBe(true);
    expect(areSessionsEqual(a, null)).toBe(false);
  });

  it('studentService.getAllStudents caches repeated reads and auto-invalidates on external writes', () => {
    vi.stubGlobal('window', {
      localStorage: mem.api,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const bulk = Array.from({ length: 300 }, (_, i) => ({
      id: `STD-${i + 1}`,
      name: `শিক্ষার্থী ${i + 1}`,
      roll: String((i % 60) + 1),
      grade: ['6th', '7th', '8th', '9th', '10th'][i % 5],
      section: 'A',
      group: i % 5 >= 3 ? 'বিজ্ঞান' : 'সাধারণ',
    }));
    mem.api.setItem('sms_students', JSON.stringify(bulk));

    const parseSpy = vi.spyOn(JSON, 'parse');
    const first = studentService.getAllStudents();
    expect(first.length).toBe(300);
    const parseCallsAfterFirst = parseSpy.mock.calls.length;
    expect(parseCallsAfterFirst).toBeGreaterThanOrEqual(1);

    // 25 repeated reads must hit the raw-string fingerprint cache with ZERO JSON.parse calls
    const t0 = performance.now();
    for (let i = 0; i < 25; i++) {
      const res = studentService.getAllStudents();
      expect(res.length).toBe(300);
    }
    const elapsed = performance.now() - t0;
    expect(parseSpy.mock.calls.length).toBe(parseCallsAfterFirst);
    expect(elapsed).toBeLessThan(50);

    // Mutating returned array must NOT corrupt the internal cache
    first.pop();
    expect(studentService.getAllStudents().length).toBe(300);

    // Direct external localStorage write must automatically invalidate the cache
    const smaller = bulk.slice(0, 10);
    mem.api.setItem('sms_students', JSON.stringify(smaller));
    expect(studentService.getAllStudents().length).toBe(10);

    parseSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('financeService.getAllStudentLedgers caches repeated reads without redundant localStorage writes', () => {
    vi.stubGlobal('window', {
      localStorage: mem.api,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const students = [
      { id: 'STD-1', name: 'রহিম', roll: '1', grade: '6th', section: 'A', group: 'সাধারণ' },
      { id: 'STD-2', name: 'করিম', roll: '2', grade: '7th', section: 'A', group: 'সাধারণ' },
    ];
    mem.api.setItem('sms_students', JSON.stringify(students));

    // Seed initial ledgers
    const ledger1 = financeService.getStudentFeeLedger('STD-1', '6th');
    const ledger2 = financeService.getStudentFeeLedger('STD-2', '7th');
    mem.api.setItem(
      'sms_student_fee_ledgers',
      JSON.stringify({ 'STD-1': ledger1, 'STD-2': ledger2 }),
    );

    // First read performs sync & warms fingerprint cache
    const initial = financeService.getAllStudentLedgers();
    expect(Object.keys(initial).length).toBe(2);

    const setItemSpy = vi.spyOn(mem.api, 'setItem');
    // Subsequent 20 reads must perform ZERO localStorage.setItem writes
    for (let i = 0; i < 20; i++) {
      const ledgers = financeService.getAllStudentLedgers();
      expect(Object.keys(ledgers).length).toBe(2);
    }
    expect(setItemSpy).not.toHaveBeenCalled();

    setItemSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
