import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage and window for Node test environment
const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};
(globalThis as any).window = {
  dispatchEvent: () => true
};

import { teacherAuthService } from '../src/services/teacherAuthService';

describe('teacherAuthService Security & Brute-Force Lockout (SEC-105)', () => {
  beforeEach(() => {
    localStorage.clear();
    // Default admin password setup
    localStorage.setItem('sms_admin_password', 'admin123');
    localStorage.setItem('sms_admin_phone', '01711000000');
  });

  it('allows successful admin login with correct password and clears any failed attempts', async () => {
    const res = await teacherAuthService.unifiedLogin('admin', 'admin123');
    expect(res.success).toBe(true);
    expect(res.role).toBe('admin');

    const lockout = teacherAuthService.getLockoutStatus('admin');
    expect(lockout.isLocked).toBe(false);
    expect(lockout.attempts).toBe(0);
  });

  it('tracks failed attempts and warns the user before lockout', async () => {
    const res1 = await teacherAuthService.unifiedLogin('admin', 'wrongpass1');
    expect(res1.success).toBe(false);
    expect(res1.message).toContain('৪ বার ভুল করলে');

    const status1 = teacherAuthService.getLockoutStatus('admin');
    expect(status1.attempts).toBe(1);
    expect(status1.isLocked).toBe(false);

    const res2 = await teacherAuthService.unifiedLogin('admin', 'wrongpass2');
    expect(res2.success).toBe(false);
    expect(res2.message).toContain('৩ বার ভুল করলে');

    const status2 = teacherAuthService.getLockoutStatus('admin');
    expect(status2.attempts).toBe(2);
  });

  it('locks out account after 5 consecutive failed attempts and blocks subsequent attempts', async () => {
    // 4 wrong attempts
    for (let i = 0; i < 4; i++) {
      await teacherAuthService.unifiedLogin('admin', `wrongpass${i}`);
    }

    const preStatus = teacherAuthService.getLockoutStatus('admin');
    expect(preStatus.attempts).toBe(4);
    expect(preStatus.isLocked).toBe(false);

    // 5th wrong attempt -> triggers lockout!
    const res5 = await teacherAuthService.unifiedLogin('admin', 'wrongpass5');
    expect(res5.success).toBe(false);
    expect(res5.message).toContain('লক করা হয়েছে');

    const lockedStatus = teacherAuthService.getLockoutStatus('admin');
    expect(lockedStatus.isLocked).toBe(true);
    expect(lockedStatus.remainingSeconds).toBeGreaterThan(0);

    // Even if the hacker now tries the CORRECT password, they must be rejected because the account is locked!
    const blockedRes = await teacherAuthService.unifiedLogin('admin', 'admin123');
    expect(blockedRes.success).toBe(false);
    expect(blockedRes.message).toContain('লক করা আছে');

    // Verify audit log has the lockout and blocked attempts
    const auditRaw = localStorage.getItem('sms_audit_logs');
    expect(auditRaw).toBeTruthy();
    const logs = JSON.parse(auditRaw || '[]');
    const lockoutLogs = logs.filter((l: any) => l.action === 'LOGIN_BRUTE_FORCE_LOCKOUT');
    expect(lockoutLogs.length).toBeGreaterThanOrEqual(1);
    const blockedLogs = logs.filter((l: any) => l.action === 'LOGIN_BLOCKED_LOCKOUT');
    expect(blockedLogs.length).toBeGreaterThanOrEqual(1);
  });

  it('locks out unknown accounts/probes after 5 attempts to prevent username enumeration brute-forcing', async () => {
    const fakePhone = '01899999999';
    for (let i = 0; i < 5; i++) {
      await teacherAuthService.unifiedLogin(fakePhone, 'guesspass');
    }

    const lockedStatus = teacherAuthService.getLockoutStatus(fakePhone);
    expect(lockedStatus.isLocked).toBe(true);

    const blockedRes = await teacherAuthService.unifiedLogin(fakePhone, 'guesspass');
    expect(blockedRes.success).toBe(false);
    expect(blockedRes.message).toContain('লক করা আছে');
  });

  it('automatically unlocks after the lockout time expires', async () => {
    const fakeId = 'attacker123';
    // Artificially record 5 failed attempts
    teacherAuthService.recordFailedAttempt(fakeId);
    teacherAuthService.recordFailedAttempt(fakeId);
    teacherAuthService.recordFailedAttempt(fakeId);
    teacherAuthService.recordFailedAttempt(fakeId);
    const lockRes = teacherAuthService.recordFailedAttempt(fakeId);
    expect(lockRes.isNewlyLocked).toBe(true);

    // Manipulate time to simulate 65 seconds passed
    const key = 'sms_auth_lock_' + fakeId;
    const raw = localStorage.getItem(key);
    const parsed = JSON.parse(raw!);
    parsed.lockedUntil = Date.now() - 5000; // 5 seconds in the past
    localStorage.setItem(key, JSON.stringify(parsed));

    const statusAfterExpiry = teacherAuthService.getLockoutStatus(fakeId);
    expect(statusAfterExpiry.isLocked).toBe(false);
    expect(statusAfterExpiry.remainingSeconds).toBe(0);
  });
});
