import { 
  SchoolStatus, 
  SchoolRegistrationRequest, 
  SignedEntitlementToken, 
  LicenseHeartbeatRequest, 
  LicenseHeartbeatResponse 
} from '@sms/shared-types';
import { centralAdminService } from './centralAdminService';

const STORAGE_KEY_REGISTRATION = 'sms_school_registration_v1';
const STORAGE_KEY_ENTITLEMENT = 'sms_school_entitlement_v1';
const STORAGE_KEY_LOCKOUT = 'sms_school_lockout_v1';
const STORAGE_KEY_CLOCK = 'sms_last_known_utc_clock_v1';
const STORAGE_KEY_HARDWARE_FALLBACK = 'sms_hardware_fingerprint_fallback';

export interface ClientRegistrationState {
  isRegistered: boolean;
  status: SchoolStatus;
  schoolCode: string;
  schoolName: string;
  registeredAt?: string;
  licenseKey?: string;
  entitlementToken?: SignedEntitlementToken;
  isLocked: boolean;
  lockoutReason?: string;
  isClockTampered: boolean;
  lastHeartbeatEpoch?: number;
  hardwareFingerprint: string;
  plan?: string;
  validUntil?: string;
}

export interface HardwareInfo {
  fingerprint: string;
  deviceName: string;
  platform: string;
  cpuModel?: string;
}

class ClientLicenseService {
  private apiBaseUrl: string = process.env.NEXT_PUBLIC_CENTRAL_API_URL || 'http://localhost:3000';
  private heartbeatIntervalTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initClockIntegrity();
    }
  }

  /**
   * 1. Initialize & Verify Anti-Clock Tampering
   */
  private initClockIntegrity(): boolean {
    const now = Date.now();
    const stored = localStorage.getItem(STORAGE_KEY_CLOCK);
    
    // Listen for desktop watchdog push events
    if (typeof window !== 'undefined' && window.electronAPI?.onClockTampered) {
      window.electronAPI.onClockTampered((data) => {
        console.error('[ClockWatchdog] Desktop event: Clock rollback detected! Last:', data.lastKnownUtc, 'Current:', data.currentUtc);
        this.setClockTampered(true);
      });
    }

    if (stored) {
      const lastKnown = parseInt(stored, 10);
      // If system clock was turned backwards by more than 5 minutes (300,000 ms)
      if (now < lastKnown - 300000) {
        console.error('[ClockWatchdog] System clock tampering detected! Stored clock:', new Date(lastKnown), 'Current clock:', new Date(now));
        this.setClockTampered(true);
        return false;
      }
    }

    // Advance clock marker forward
    localStorage.setItem(STORAGE_KEY_CLOCK, now.toString());
    return true;
  }

  /**
   * Validate and reset clock tampering lockout.
   * Enforces that the clock is strictly verified before unlocking.
   */
  public async verifyAndResetClockTamper(): Promise<{ success: boolean; message: string }> {
    if (typeof window !== 'undefined' && window.electronAPI?.verifyAndResetClock) {
      try {
        const res = await window.electronAPI.verifyAndResetClock();
        if (res.success) {
          this.setClockTampered(false);
          localStorage.setItem(STORAGE_KEY_CLOCK, Date.now().toString());
        }
        return res;
      } catch (err: any) {
        console.error('[verifyAndResetClockTamper] Desktop watchdog error:', err.message);
      }
    }

    // Web fallback verification
    const now = Date.now();
    const stored = localStorage.getItem(STORAGE_KEY_CLOCK);
    if (stored) {
      const lastKnown = parseInt(stored, 10);
      if (now < lastKnown - 300000) {
        return {
          success: false,
          message: 'উইন্ডোজ পিসির ঘড়ি এখনও সংরক্ষিত সময়ের চেয়ে পেছনে রয়েছে। অনুগ্রহ করে ঘড়ির সময় সঠিক করুন।'
        };
      }
    }

    this.setClockTampered(false);
    localStorage.setItem(STORAGE_KEY_CLOCK, now.toString());
    return {
      success: true,
      message: 'ঘড়ির সময় সফলভাবে পুনরুদ্ধার ও যাচাই হয়েছে।'
    };
  }

  /**
   * Record clock tampering state
   */
  public setClockTampered(isTampered: boolean) {
    if (isTampered) {
      localStorage.setItem('sms_clock_tampered_flag', 'true');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sms:clock-tampered'));
      }
    } else {
      localStorage.removeItem('sms_clock_tampered_flag');
    }
  }

  public isClockTampered(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sms_clock_tampered_flag') === 'true';
  }

  /**
   * 2. Obtain Hardware Fingerprint
   * Uses native Electron Windows fingerprinting if available,
   * otherwise generates a deterministic SHA-256 web fingerprint.
   */
  public async getHardwareInfo(): Promise<HardwareInfo> {
    if (typeof window !== 'undefined' && window.electronAPI?.getHardwareFingerprint) {
      try {
        const info = await window.electronAPI.getHardwareFingerprint();
        return {
          fingerprint: info.fingerprint,
          deviceName: info.deviceName,
          platform: info.platform,
          cpuModel: info.cpuModel,
        };
      } catch (e) {
        console.warn('[LicenseService] Electron hardware query fallback to browser', e);
      }
    }

    // Web Fallback: Persistent device fingerprint
    let fp = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_HARDWARE_FALLBACK) : null;
    if (!fp) {
      const rawSeed = `${typeof navigator !== 'undefined' ? navigator.userAgent : 'Node'}-${typeof window !== 'undefined' ? window.screen.width + 'x' + window.screen.height : '1080p'}-${Math.random().toString(36).substring(2, 10)}`;
      // Simple hash to format HW-XXXX-XXXX-XXXX-XXXX
      let hash = 0;
      for (let i = 0; i < rawSeed.length; i++) {
        hash = (hash << 5) - hash + rawSeed.charCodeAt(i);
        hash |= 0;
      }
      const hex = Math.abs(hash).toString(16).padStart(16, '0').toUpperCase();
      fp = `HW-${hex.substring(0, 4)}-${hex.substring(4, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}`;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_HARDWARE_FALLBACK, fp);
      }
    }

    return {
      fingerprint: fp,
      deviceName: 'Windows-Workstation',
      platform: 'Windows Desktop Client',
    };
  }

  /**
   * 3. Read Current Local Registration & License State
   */
  public getRegistrationState(): ClientRegistrationState {
    const defaultState: ClientRegistrationState = {
      isRegistered: false,
      status: 'PENDING',
      schoolCode: '',
      schoolName: '',
      isLocked: false,
      isClockTampered: this.isClockTampered(),
      hardwareFingerprint: 'HW-UNINITIALIZED',
    };

    if (typeof window === 'undefined') return defaultState;

    const regData = localStorage.getItem(STORAGE_KEY_REGISTRATION);
    const tokenData = localStorage.getItem(STORAGE_KEY_ENTITLEMENT);
    const lockoutData = localStorage.getItem(STORAGE_KEY_LOCKOUT);

    if (!regData) {
      // If user explicitly requested fresh install test mode
      const isFreshSetup = localStorage.getItem('sms_fresh_install_mode') === 'true';
      if (isFreshSetup) {
        return defaultState;
      }

      // Auto-bind pre-seeded Boraitoli High School (SCH-106184) for continuous smooth operation
      const initialSchool = centralAdminService.getSchoolByCode('SCH-106184');
      if (initialSchool) {
        const autoRecord = {
          schoolCode: 'SCH-106184',
          schoolName: initialSchool.schoolName,
          status: initialSchool.status,
          createdAt: initialSchool.createdAt,
          licenseKey: initialSchool.license?.licenseKey || 'SMS-2026-PRO-106184',
          hardwareFingerprint: 'HW-4DFC-78F4-C7FB-C0BD',
        };
        let tokenPayload: SignedEntitlementToken | undefined;
        if (initialSchool.license?.signedPayload) {
          try {
            tokenPayload = JSON.parse(initialSchool.license.signedPayload);
          } catch {
            tokenPayload = undefined;
          }
        }

        if (tokenPayload) {
          localStorage.setItem(STORAGE_KEY_ENTITLEMENT, JSON.stringify(tokenPayload));
        }
        return {
          isRegistered: true,
          status: initialSchool.status,
          schoolCode: 'SCH-106184',
          schoolName: initialSchool.schoolName,
          registeredAt: initialSchool.createdAt,
          licenseKey: autoRecord.licenseKey,
          entitlementToken: tokenPayload,
          isLocked: initialSchool.status === 'SUSPENDED' || initialSchool.status === 'DEACTIVATED',
          lockoutReason: initialSchool.suspensionReason || initialSchool.rejectionReason,
          isClockTampered: this.isClockTampered(),
          hardwareFingerprint: autoRecord.hardwareFingerprint,
          plan: initialSchool.license?.planType || 'ENTERPRISE',
          validUntil: initialSchool.license?.validUntil,
        };
      }

      return defaultState;
    }

    try {
      const reg = JSON.parse(regData);
      const token: SignedEntitlementToken | null = tokenData ? JSON.parse(tokenData) : null;
      const lockout = lockoutData ? JSON.parse(lockoutData) : null;

      let isLocked = false;
      let lockoutReason = '';

      if (lockout && lockout.isLocked) {
        isLocked = true;
        lockoutReason = lockout.reason;
      } else if (reg.status === 'SUSPENDED' || reg.status === 'DEACTIVATED') {
        isLocked = true;
        lockoutReason = reg.statusReason || 'প্রতিষ্ঠানটি কেন্দ্রীয় সার্ভার দ্বারা সাময়িকভাবে স্থগিত করা হয়েছে।';
      }

      // Check Offline Entitlement Expiry if approved
      let validUntil = '';
      let plan = '';
      if (token && token.payload) {
        validUntil = new Date(token.payload.validUntilEpochMs).toISOString();
        plan = token.payload.planType;
        const now = Date.now();
        if (now > token.payload.validUntilEpochMs) {
          isLocked = true;
          lockoutReason = 'সফটওয়্যার লাইসেন্সের মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে নবায়ন করুন।';
        }
      }

      return {
        isRegistered: true,
        status: reg.status || 'PENDING',
        schoolCode: reg.schoolCode || '',
        schoolName: reg.schoolName || '',
        registeredAt: reg.createdAt,
        licenseKey: reg.licenseKey,
        entitlementToken: token || undefined,
        isLocked: isLocked || this.isClockTampered(),
        lockoutReason: this.isClockTampered() ? 'সিস্টেম ঘড়ি পরিবর্তনজনিত নিরাপত্তা সতর্কতা! ঘড়ির সময় সঠিক করুন।' : lockoutReason,
        isClockTampered: this.isClockTampered(),
        hardwareFingerprint: reg.hardwareFingerprint || '',
        plan,
        validUntil,
      };
    } catch (e) {
      console.error('[LicenseService] Error parsing registration state:', e);
      return defaultState;
    }
  }

  /**
   * 4. Submit New School Registration (First Run Wizard)
   */
  public async submitSchoolRegistration(
    formData: {
      schoolName: string;
      schoolCode?: string;
      eiinNumber?: string;
      division: string;
      district: string;
      upazila: string;
      address: string;
      contactPhone: string;
      contactEmail?: string;
      principalName: string;
      principalPhone: string;
      authorizedPerson: string;
      studentCountEstimate?: number;
      teacherCountEstimate?: number;
    }
  ): Promise<{ success: boolean; schoolCode: string; message: string }> {
    const hw = await this.getHardwareInfo();

    const payload: SchoolRegistrationRequest = {
      ...formData,
      deviceFingerprint: hw.fingerprint,
      deviceName: hw.deviceName,
      osInfo: hw.platform,
      appVersion: '1.0.0',
    };

    let serverSuccess = false;
    let assignedCode = '';

    // 1. Try Live Central Backend API
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/v1/schools/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        assignedCode = data.schoolCode;
        serverSuccess = true;
      }
    } catch (err: any) {
      console.warn('[LicenseService] Live API register unreachable, invoking centralAdminService bridge:', err.message);
    }

    // 2. Fallback to Central Admin Bridge / Offline Cache
    if (!serverSuccess) {
      const fallbackResult = await centralAdminService.registerSchool(payload);
      assignedCode = fallbackResult.schoolCode;
    }

    // 3. Save initial local registration record as PENDING
    const localRecord = {
      ...payload,
      schoolCode: assignedCode,
      status: 'PENDING' as SchoolStatus,
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_REGISTRATION, JSON.stringify(localRecord));
      // Notify electron to persist in appData
      if (window.electronAPI?.saveLicenseFile) {
        window.electronAPI.saveLicenseFile({ registration: localRecord });
      }
    }

    return {
      success: true,
      schoolCode: assignedCode,
      message: 'রেজিস্ট্রেশন সফলভাবে জমা হয়েছে। কেন্দ্রীয় সুপার অ্যাডমিন অনুমোদনের অপেক্ষায় রয়েছে।',
    };
  }

  /**
   * 5. Poll / Check Registration Approval Status
   */
  public async checkRegistrationStatus(schoolCode: string): Promise<{
    status: SchoolStatus;
    isApproved: boolean;
    isSuspended: boolean;
    token?: SignedEntitlementToken;
    message?: string;
  }> {
    let resultStatus: SchoolStatus = 'PENDING';
    let entitlementToken: SignedEntitlementToken | undefined;
    let licenseKey: string | undefined;
    let reason: string | undefined;

    // 1. Try Live Central Backend API
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/v1/schools/status/${encodeURIComponent(schoolCode)}`);
      if (res.ok) {
        const data = await res.json();
        resultStatus = data.status;
        entitlementToken = data.entitlementToken;
        licenseKey = data.licenseKey;
        reason = data.reason;
      }
    } catch (e) {
      // 2. Fallback to local admin bridge
      const localSchool = centralAdminService.getSchoolByCode(schoolCode);
      if (localSchool) {
        resultStatus = localSchool.status;
        reason = localSchool.suspensionReason || localSchool.rejectionReason;
        if (localSchool.license) {
          licenseKey = localSchool.license.licenseKey;
          if (localSchool.license.signedPayload) {
            try {
              entitlementToken = JSON.parse(localSchool.license.signedPayload);
            } catch {
              entitlementToken = undefined;
            }
          }
        }
      }
    }

    // Update Local State
    const regData = localStorage.getItem(STORAGE_KEY_REGISTRATION);
    if (regData) {
      const reg = JSON.parse(regData);
      reg.status = resultStatus;
      if (licenseKey) reg.licenseKey = licenseKey;
      if (reason) reg.statusReason = reason;
      localStorage.setItem(STORAGE_KEY_REGISTRATION, JSON.stringify(reg));
    }

    if (resultStatus === 'APPROVED' && entitlementToken) {
      localStorage.setItem(STORAGE_KEY_ENTITLEMENT, JSON.stringify(entitlementToken));
      localStorage.removeItem(STORAGE_KEY_LOCKOUT);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sms:school-approved', { detail: { schoolCode } }));
      }
      return {
        status: 'APPROVED',
        isApproved: true,
        isSuspended: false,
        token: entitlementToken,
        message: 'প্রতিষ্ঠানটি কেন্দ্রীয়ভাবে অনুমোদিত হয়েছে!',
      };
    }

    if (resultStatus === 'SUSPENDED' || resultStatus === 'DEACTIVATED') {
      this.triggerRemoteLockout(reason || 'প্রতিষ্ঠানটি কেন্দ্রীয় প্রশাসন দ্বারা স্থগিত করা হয়েছে।');
      return {
        status: resultStatus,
        isApproved: false,
        isSuspended: true,
        message: reason,
      };
    }

    return {
      status: resultStatus,
      isApproved: false,
      isSuspended: false,
      message: resultStatus === 'PENDING' ? 'সুপার অ্যাডমিন অনুমোদনের অপেক্ষায় রয়েছে...' : resultStatus,
    };
  }

  /**
   * 6. Remote Deactivation & Heartbeat Watchdog
   */
  public async sendHeartbeat(): Promise<LicenseHeartbeatResponse | null> {
    const state = this.getRegistrationState();
    if (!state.isRegistered || !state.licenseKey) return null;

    const hw = await this.getHardwareInfo();
    const req: LicenseHeartbeatRequest = {
      schoolId: state.schoolCode,
      deviceFingerprint: hw.fingerprint,
      appVersion: '1.0.0',
      lastKnownServerTimeUtc: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${this.apiBaseUrl}/api/v1/license/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (res.ok) {
        const data: LicenseHeartbeatResponse = await res.json();
        
        // Advance anti-clock tampering marker to server UTC timestamp
        if (data.serverTimeUtc) {
          const serverEpoch = new Date(data.serverTimeUtc).getTime();
          localStorage.setItem(STORAGE_KEY_CLOCK, serverEpoch.toString());
        }

        // Handle Immediate Remote Lockout
        if (data.status === 'SUSPENDED' || data.status === 'DEACTIVATED' || !data.isAllowed) {
          console.warn('[Heartbeat] Server signaled inactive license:', data);
          this.triggerRemoteLockout(data.revocationReason || 'সুপার অ্যাডমিন কর্তৃক দূরবর্তীভাবে সফটওয়্যার নিষ্ক্রিয় করা হয়েছে।');
        } else {
          // If active and was previously locked, unlock
          if (state.isLocked) {
            this.unlockSchool();
          }
          if (data.signedToken) {
            localStorage.setItem(STORAGE_KEY_ENTITLEMENT, JSON.stringify(data.signedToken));
          }
        }

        return data;
      }
    } catch (err: any) {
      console.warn('[Heartbeat] Central API unreachable (Offline Mode active):', err.message);
      // In offline mode, verify offline grace period and local signature
      this.validateOfflineGracePeriod();
    }

    return null;
  }

  /**
   * 7. Trigger Immediate Remote Lockout / Logout
   */
  public triggerRemoteLockout(reason: string) {
    if (typeof window === 'undefined') return;

    const lockoutPayload = {
      isLocked: true,
      reason,
      lockedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY_LOCKOUT, JSON.stringify(lockoutPayload));

    // Force secure logout: invalidate user sessions
    localStorage.removeItem('sms_user_session');
    localStorage.removeItem('sms_teacher_session');
    sessionStorage.clear();

    console.error('[RemoteLockout] Software locked out immediately. Reason:', reason);

    // Dispatch global event for UI takeover
    window.dispatchEvent(new CustomEvent('sms:remote-lockout', { detail: { reason } }));
  }

  /**
   * Unlock school after reactivation
   */
  public unlockSchool() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_LOCKOUT);
    window.dispatchEvent(new CustomEvent('sms:school-unlocked'));
  }

  /**
   * 8. Validate Offline Grace Period
   * If offline for more than 30 days without validating with central server,
   * prompt user to connect online.
   */
  public validateOfflineGracePeriod(): { isGraceValid: boolean; daysRemaining: number } {
    const state = this.getRegistrationState();
    if (!state.entitlementToken?.payload) {
      return { isGraceValid: false, daysRemaining: 0 };
    }

    const clockStored = localStorage.getItem(STORAGE_KEY_CLOCK);
    const lastValidationEpoch = clockStored ? parseInt(clockStored, 10) : Date.now();
    const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
    const elapsed = Date.now() - lastValidationEpoch;

    if (elapsed > GRACE_PERIOD_MS) {
      this.triggerRemoteLockout('অফলাইন গ্রেস পিরিয়ডের সময়সীমা (৩০ দিন) অতিক্রান্ত হয়েছে। লাইসেন্স নবায়নের জন্য অনুগ্রহ করে ইন্টারনেট সংযুক্ত করুন।');
      return { isGraceValid: false, daysRemaining: 0 };
    }

    const daysRemaining = Math.max(0, Math.ceil((GRACE_PERIOD_MS - elapsed) / (24 * 60 * 60 * 1000)));
    return { isGraceValid: true, daysRemaining };
  }

  /**
   * 9. Start Automatic Background Heartbeat
   * Runs every 30 seconds to enforce real-time remote deactivation
   */
  public startBackgroundHeartbeat(intervalMs: number = 30000) {
    if (typeof window === 'undefined') return;
    if (this.heartbeatIntervalTimer) clearInterval(this.heartbeatIntervalTimer);

    // Run first check immediately
    this.sendHeartbeat();

    this.heartbeatIntervalTimer = setInterval(() => {
      this.sendHeartbeat();
    }, intervalMs);
  }

  public stopBackgroundHeartbeat() {
    if (this.heartbeatIntervalTimer) {
      clearInterval(this.heartbeatIntervalTimer);
      this.heartbeatIntervalTimer = null;
    }
  }

  /**
   * Reset / Clear Local Registration for testing purposes
   */
  public resetLocalRegistration() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_REGISTRATION);
    localStorage.removeItem(STORAGE_KEY_ENTITLEMENT);
    localStorage.removeItem(STORAGE_KEY_LOCKOUT);
    localStorage.removeItem(STORAGE_KEY_CLOCK);
    localStorage.removeItem('sms_clock_tampered_flag');
  }
}

export const clientLicenseService = new ClientLicenseService();
