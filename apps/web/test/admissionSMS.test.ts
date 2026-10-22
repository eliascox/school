import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage and window for Node test environment
const store: Record<string, string> = {};
if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  };
}
if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  };
}

import { smsService } from '../src/services/smsService';

describe('Admission Confirmation SMS Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('correctly constructs and triggers admission confirmation SMS with Bangla text and App ID', async () => {
    const applicant = {
      name: 'মোঃ তানভীর হাসান',
      appId: 'APP-2026-9876',
      grade: '6th',
      mobile: '01812345678',
      schoolName: 'বরইতলী উচ্চ বিদ্যালয়'
    };

    const result = await smsService.sendAdmissionConfirmationSMS(applicant);

    expect(result.success).toBe(true);
    expect(result.message).toContain('মোঃ তানভীর হাসান');
    expect(result.message).toContain('৬ষ্ঠ');
    expect(result.message).toContain('APP-2026-9876');
    expect(result.message).toContain('বরইতলী উচ্চ বিদ্যালয়');

    // Verify SMS was logged in history
    const logs = smsService.getLogs();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].recipientName).toBe('মোঃ তানভীর হাসান');
    expect(logs[0].mobile).toBe('01812345678');
    expect(logs[0].status).toBe('Sent');
  });

  it('rejects invalid or too short mobile numbers gracefully', async () => {
    const applicant = {
      name: 'সাদিয়া আফরিন',
      appId: 'APP-2026-1111',
      grade: '9th',
      mobile: '12345', // invalid
    };

    const result = await smsService.sendAdmissionConfirmationSMS(applicant);
    expect(result.success).toBe(false);
    expect(result.gatewayResponse).toBe('অবৈধ মোবাইল নম্বর');
  });

  it('correctly maps 9th class to ৯ম শ্রেণি in message', async () => {
    const applicant = {
      name: 'নুসরাত জাহান',
      appId: 'APP-2026-5544',
      grade: '9th',
      mobile: '01700000000',
    };

    const result = await smsService.sendAdmissionConfirmationSMS(applicant);
    expect(result.success).toBe(true);
    expect(result.message).toContain('৯ম');
  });
});
