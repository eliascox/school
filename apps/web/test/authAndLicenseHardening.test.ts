import { describe, it, expect, beforeEach } from 'vitest';

const store: Record<string, string> = {};
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v;
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

(globalThis as unknown as { window: Record<string, unknown> }).window = {
  dispatchEvent: () => true,
  screen: { width: 1920, height: 1080 },
};

if (typeof (globalThis as unknown as { CustomEvent?: unknown }).CustomEvent === 'undefined') {
  (globalThis as unknown as { CustomEvent: unknown }).CustomEvent = class CustomEventShim {
    type: string;
    detail?: unknown;
    constructor(type: string, init?: { detail?: unknown }) {
      this.type = type;
      this.detail = init?.detail;
    }
  };
}

import { teacherAuthService } from '@/services/teacherAuthService';
import { teacherRBACService } from '@/services/teacherRBACService';
import { clientLicenseService } from '@/services/clientLicenseService';

describe('Auth & License Security Hardening (Phase 1)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Admin authentication without default password fallback', () => {
    it('rejects admin login with legacy default "admin123" when uninitialized and signals requiresSetup', async () => {
      expect(teacherAuthService.isAdminInitialized()).toBe(false);

      const res = await teacherAuthService.unifiedLogin('admin', 'admin123');
      expect(res.success).toBe(false);
      expect(res.requiresSetup).toBe(true);
      expect(teacherAuthService.getSession()).toBeNull();
    });

    it('rejects short or weak passwords during initializeAdminPassword', async () => {
      const tooShort = await teacherAuthService.initializeAdminPassword('12345');
      expect(tooShort.success).toBe(false);

      const weakDefault = await teacherAuthService.initializeAdminPassword('admin123');
      expect(weakDefault.success).toBe(false);

      const seqPass = await teacherAuthService.initializeAdminPassword('123456');
      expect(seqPass.success).toBe(false);

      expect(teacherAuthService.isAdminInitialized()).toBe(false);
    });

    it('initializes admin password with PBKDF2 hash and rejects "admin123" afterward', async () => {
      const setupRes = await teacherAuthService.initializeAdminPassword('Baraitali#2026', '01711112222');
      expect(setupRes.success).toBe(true);
      expect(teacherAuthService.isAdminInitialized()).toBe(true);

      const storedHash = localStorage.getItem('sms_admin_password') || '';
      expect(storedHash.startsWith('pbkdf2:')).toBe(true);
      expect(storedHash).not.toBe('Baraitali#2026');

      const badLogin = await teacherAuthService.unifiedLogin('admin', 'admin123');
      expect(badLogin.success).toBe(false);

      const goodLogin = await teacherAuthService.unifiedLogin('01711112222', 'Baraitali#2026');
      expect(goodLogin.success).toBe(true);
      expect(goodLogin.role).toBe('admin');
      expect(teacherAuthService.getSession()?.role).toBe('admin');
    });
  });

  describe('Teacher RBAC password hardening (no "123456" fallback)', () => {
    it('rejects teacher creation without an explicit >= 6 char password', async () => {
      const noPass = await teacherRBACService.createTeacher({
        name: 'মোঃ করিম উদ্দিন',
        phone: '01712345678',
        designation: 'সহকারী শিক্ষক',
        dob: '1990-01-01',
        status: 'active',
        passwordHash: '',
      });
      expect(noPass.success).toBe(false);

      const shortPass = await teacherRBACService.createTeacher({
        name: 'মোঃ করিম উদ্দিন',
        phone: '01712345678',
        designation: 'সহকারী শিক্ষক',
        dob: '1990-01-01',
        status: 'active',
        passwordHash: '12345',
      });
      expect(shortPass.success).toBe(false);
      expect(teacherRBACService.getTeachers()).toHaveLength(0);
    });

    it('stores PBKDF2 hash on valid teacher creation and rejects "123456" fallback login', async () => {
      const created = await teacherRBACService.createTeacher({
        name: 'মোঃ করিম উদ্দিন',
        phone: '01712345678',
        designation: 'সহকারী শিক্ষক',
        dob: '1990-01-01',
        status: 'active',
        passwordHash: 'TchStrong#2026',
      });
      expect(created.success).toBe(true);
      expect(created.teacher?.passwordHash.startsWith('pbkdf2:')).toBe(true);
      expect(created.teacher?.mustChangePassword).toBe(true);

      const fallbackLogin = await teacherAuthService.unifiedLogin('01712345678', '123456');
      expect(fallbackLogin.success).toBe(false);

      const validLogin = await teacherAuthService.unifiedLogin('01712345678', 'TchStrong#2026');
      expect(validLogin.success).toBe(true);
      expect(validLogin.role).toBe('teacher');
    });

    it('rejects teacher login when a legacy stored record has no passwordHash', async () => {
      localStorage.setItem(
        'sms_teachers_list',
        JSON.stringify([{ id: 'TCH-LEGACY', name: 'Legacy Teacher', phone: '01800000001' }])
      );

      const legacyDefaultLogin = await teacherAuthService.unifiedLogin('01800000001', '123456');
      expect(legacyDefaultLogin.success).toBe(false);
    });
  });

  describe('Client license activation without silent bypass', () => {
    it('stays unregistered on fresh state and never auto-activates during read or unlockSchool', () => {
      const initial = clientLicenseService.getRegistrationState();
      expect(initial.isRegistered).toBe(false);
      expect(initial.status).toBe('PENDING');

      clientLicenseService.unlockSchool();
      const afterUnlock = clientLicenseService.getRegistrationState();
      expect(afterUnlock.isRegistered).toBe(false);
    });

    it('rejects malformed or unapproved license keys during activateByLicenseKey', async () => {
      const tooShort = await clientLicenseService.activateByLicenseKey('BAD');
      expect(tooShort.success).toBe(false);

      const invalidKey = await clientLicenseService.activateByLicenseKey('SCH-0000-0000-0000', 'SCH-106184');
      expect(invalidKey.success).toBe(false);
      expect(clientLicenseService.getRegistrationState().isRegistered).toBe(false);
    });

    it('activates cleanly only when given a matching APPROVED school license key', async () => {
      const validActivation = await clientLicenseService.activateByLicenseKey(
        'SCH-98F1-4A2B-7C3D-88E2',
        'SCH-106184'
      );
      expect(validActivation.success).toBe(true);

      const registered = clientLicenseService.getRegistrationState();
      expect(registered.isRegistered).toBe(true);
      expect(registered.status).toBe('APPROVED');
      expect(registered.schoolCode).toBe('SCH-106184');
    });
  });
});
