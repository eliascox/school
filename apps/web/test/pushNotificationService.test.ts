import { describe, it, expect, beforeEach } from 'vitest';

const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};
(globalThis as any).sessionStorage = (globalThis as any).localStorage;
(globalThis as any).window = globalThis;

import { pushNotificationService } from '../src/services/pushNotificationService';
import { FIREBASE_VAPID_KEY } from '../src/lib/firebase';

describe('pushNotificationService Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('verifies that the Firebase VAPID Web Push certificate key is loaded', () => {
    expect(FIREBASE_VAPID_KEY).toBeDefined();
    expect(FIREBASE_VAPID_KEY).toBe('BAYtfWauVBDI_va8v9cRCFnXLIO4eKRBlCEEeBUUt1GdMoEanmOfLKnUsD80tMm8yhymeNbiA7cgcHkgnLYzUh0');
  });

  it('returns null when no token has been saved in local storage', () => {
    expect(pushNotificationService.getCurrentToken()).toBeNull();
  });

  it('returns stored token when user is subscribed', () => {
    localStorage.setItem('sms_fcm_push_token_v1', 'mock_fcm_token_12345');
    expect(pushNotificationService.getCurrentToken()).toBe('mock_fcm_token_12345');
  });

  it('handles subscription failure gracefully in environments without Notification API', async () => {
    const res = await pushNotificationService.subscribeToPush('admin');
    expect(res.success).toBe(false);
    expect(res.message).toBeDefined();
  });
});
