import { describe, it, expect, beforeEach, vi } from 'vitest';

const store: Record<string, string> = {};
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = String(v);
  },
  removeItem: (k: string) => {
    delete store[k];
  },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
  get length() {
    return Object.keys(store).length;
  },
  key: (i: number) => Object.keys(store)[i] ?? null,
};
(globalThis as Record<string, unknown>).window = {
  localStorage: (globalThis as Record<string, unknown>).localStorage,
  dispatchEvent: () => true,
};

import { teacherAuthService } from '@/services/teacherAuthService';
import { smsService } from '@/services/smsService';

describe('Admin & Teacher SMS Gateway OTP Password Recovery', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('sends 6-digit Admin OTP strictly to Admin registered phone, hides OTP on real SMS gateway, rejects teacher/unknown phones, and resets password securely', async () => {
    await teacherAuthService.initializeAdminPassword('OldStrong#2026', 'admin');
    teacherAuthService.setAdminRecoveryPhone('01811223344');

    // Register a teacher with a different mobile number
    localStorage.setItem(
      'sms_rbac_teachers',
      JSON.stringify([
        {
          id: 'TCH-101',
          name: 'মোহাম্মদ কামরুল ইসলাম',
          phone: '01755667788',
          mobile: '01755667788',
        },
      ]),
    );

    // 1. Attempting Admin recovery with a teacher's phone MUST fail
    const wrongPhoneRes = await teacherAuthService.sendAdminResetOTP('01755667788');
    expect(wrongPhoneRes.success).toBe(false);
    expect(wrongPhoneRes.message).toContain('মেলেনি');

    // 2. Simulate REAL SMS Gateway (BulkSMSDhaka) returning success
    const spySendOtp = vi.spyOn(smsService, 'sendOTP').mockResolvedValue({
      success: true,
      otp: '749281',
      message: 'OTP 01811223344 নম্বরে সফলভাবে পাঠানো হয়েছে!',
      gatewayResponse: '202 OK',
      isDemoMode: false,
    });

    const sentRes = await teacherAuthService.sendAdminResetOTP('০১৮১১২২৩৩৪৪');
    expect(sentRes.success).toBe(true);
    expect(sentRes.maskedPhone).toBe('018****3344');
    expect(sentRes.isDemoMode).toBe(false);
    // CRITICAL SECURITY: Live SMS Gateway OTP MUST NOT be exposed in UI payload!
    expect(sentRes.demoOtp).toBeUndefined();
    expect(spySendOtp).toHaveBeenCalledWith(
      '01811223344',
      'প্রধান শিক্ষক / অ্যাডমিন',
      expect.any(String),
      6,
    );

    // 3. Wrong OTP is rejected; Bengali digits of correct 6-digit OTP succeed
    const badOtp = teacherAuthService.verifyAdminResetOTP('01811223344', '111111');
    expect(badOtp.success).toBe(false);

    const okOtp = teacherAuthService.verifyAdminResetOTP('01811223344', '৭৪৯২৮১');
    expect(okOtp.success).toBe(true);

    // 4. Weak new password rejected, strong new password succeeds and unlocks login
    const weakReset = await teacherAuthService.resetAdminPasswordWithOTP('01811223344', '749281', '123456');
    expect(weakReset.success).toBe(false);

    const strongReset = await teacherAuthService.resetAdminPasswordWithOTP(
      '01811223344',
      '749281',
      'Headmaster#2027',
    );
    expect(strongReset.success).toBe(true);
    expect(strongReset.loginId).toBe('admin');

    // Verify new password works and old password no longer works
    const oldLogin = await teacherAuthService.unifiedLogin('admin', 'OldStrong#2026');
    expect(oldLogin.success).toBe(false);
    const newLogin = await teacherAuthService.unifiedLogin('admin', 'Headmaster#2027');
    expect(newLogin.success).toBe(true);
    expect(newLogin.role).toBe('admin');
  });

  it('sends 4-digit Teacher OTP strictly to Teacher phone, refuses gateway failures, and blocks Admin phone from teacher reset', async () => {
    teacherAuthService.setAdminRecoveryPhone('01811223344');
    localStorage.setItem(
      'sms_rbac_teachers',
      JSON.stringify([
        {
          id: 'TCH-202',
          name: 'মিসেস সালমা খাতুন',
          phone: '01755667788',
          mobile: '01755667788',
        },
      ]),
    );

    // Admin's phone is NOT registered as a teacher -> rejected
    const adminOnTeacher = await teacherAuthService.sendTeacherResetOTP('01811223344');
    expect(adminOnTeacher.success).toBe(false);

    // If SMS Gateway fails (e.g. missing API key / network error), NO OTP should be stored
    vi.spyOn(smsService, 'sendOTP').mockResolvedValueOnce({
      success: false,
      otp: '9999',
      message: 'API Key missing',
      isDemoMode: false,
    });
    const failedSend = await teacherAuthService.sendTeacherResetOTP('01755667788');
    expect(failedSend.success).toBe(false);
    expect(localStorage.getItem('sms_teacher_otp_01755667788')).toBeNull();

    // Live gateway success: OTP goes strictly to teacher's phone & is hidden from UI payload
    vi.spyOn(smsService, 'sendOTP').mockResolvedValueOnce({
      success: true,
      otp: '4829',
      message: 'Sent',
      isDemoMode: false,
    });
    const teacherSent = await teacherAuthService.sendTeacherResetOTP('01755667788');
    expect(teacherSent.success).toBe(true);
    expect(teacherSent.teacherName).toBe('মিসেস সালমা খাতুন');
    expect(teacherSent.otp).toBeUndefined();

    // Teacher completes password reset with Bengali digits
    const resetRes = await teacherAuthService.resetTeacherPasswordWithOTP(
      '01755667788',
      '৪৮২৯',
      'Salma@2027',
    );
    expect(resetRes.success).toBe(true);

    const loginRes = await teacherAuthService.unifiedLogin('01755667788', 'Salma@2027');
    expect(loginRes.success).toBe(true);
    expect(loginRes.role).toBe('teacher');
  });
});
