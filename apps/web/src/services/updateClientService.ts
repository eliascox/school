import { UpdateReleaseManifest } from '@sms/shared-types';
import { clientLicenseService } from './clientLicenseService';
import { centralAdminService } from './centralAdminService';

const CURRENT_APP_VERSION = '1.0.0';
const STORAGE_KEY_PENDING_UPDATE = 'sms_pending_update_manifest_v1';
const STORAGE_KEY_DISMISSED_VERSION = 'sms_dismissed_update_version_v1';

export interface UpdateCheckResult {
  hasUpdate: boolean;
  isMandatory: boolean;
  manifest?: UpdateReleaseManifest;
  currentVersion: string;
}

class UpdateClientService {
  private apiBaseUrl: string = process.env.NEXT_PUBLIC_CENTRAL_API_URL || 'http://localhost:3000';
  private cachedManifest: UpdateReleaseManifest | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_PENDING_UPDATE);
      if (stored) {
        try {
          this.cachedManifest = JSON.parse(stored);
        } catch {}
      }

      // Check for updates on startup and every 30 minutes
      setTimeout(() => this.checkForUpdates(), 5000);
      setInterval(() => this.checkForUpdates(), 30 * 60 * 1000);
    }
  }

  public getCurrentVersion(): string {
    return CURRENT_APP_VERSION;
  }

  /**
   * 1. Check for Software Updates
   */
  public async checkForUpdates(): Promise<UpdateCheckResult> {
    const regState = clientLicenseService.getRegistrationState();
    const schoolId = regState.schoolCode || 'SCH-106184';

    // 1. If running in Electron Desktop Shell
    if (typeof window !== 'undefined' && window.electronAPI?.checkForUpdates) {
      try {
        const electronRes = await window.electronAPI.checkForUpdates({
          currentVersion: CURRENT_APP_VERSION,
          schoolId
        });
        const manifest = electronRes.manifest || electronRes.latestRelease;
        if (electronRes.hasUpdate && manifest) {
          return this.processUpdateManifest(manifest);
        }
      } catch (err: any) {
        console.warn('[UpdateService] Electron update check fallback:', err.message);
      }
    }

    // 2. Live Central Backend API
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/v1/updates/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          currentVersion: CURRENT_APP_VERSION,
          platform: 'win32'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const manifest = data.manifest || data.latestRelease;
        if (data.hasUpdate && manifest) {
          return this.processUpdateManifest(manifest);
        }
      }
    } catch (err: any) {
      // 3. Fallback to Central Admin Local Bridge
      const releases = centralAdminService.getReleases();
      if (releases.length > 0) {
        const latest = releases[0];
        if (this.isVersionNewer(latest.version, CURRENT_APP_VERSION)) {
          return this.processUpdateManifest(latest);
        }
      }
    }

    return {
      hasUpdate: false,
      isMandatory: false,
      currentVersion: CURRENT_APP_VERSION
    };
  }

  private processUpdateManifest(manifest: UpdateReleaseManifest): UpdateCheckResult {
    this.cachedManifest = manifest;

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PENDING_UPDATE, JSON.stringify(manifest));
      window.dispatchEvent(new CustomEvent('sms:update-available', { detail: manifest }));
    }

    const isMandatory = !!manifest.isCritical;
    return {
      hasUpdate: true,
      isMandatory,
      manifest,
      currentVersion: CURRENT_APP_VERSION
    };
  }

  /**
   * Helper: Semver Comparison (e.g. 1.1.0 > 1.0.0)
   */
  public isVersionNewer(remoteVersion: string, currentVersion: string): boolean {
    const clean = (v: string) => v.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
    const r = clean(remoteVersion);
    const c = clean(currentVersion);

    for (let i = 0; i < Math.max(r.length, c.length); i++) {
      const rNum = r[i] || 0;
      const cNum = c[i] || 0;
      if (rNum > cNum) return true;
      if (rNum < cNum) return false;
    }
    return false;
  }

  /**
   * 2. Download and Verify Package
   */
  public async downloadAndInstall(manifest: UpdateReleaseManifest): Promise<{ success: boolean; message: string }> {
    if (typeof window !== 'undefined' && window.electronAPI?.downloadUpdate) {
      try {
        const res = await window.electronAPI.downloadUpdate({ manifest });
        if (res.success && res.filePath) {
          if (window.electronAPI.applyUpdate) {
            await window.electronAPI.applyUpdate(res.filePath);
          }
          return { success: true, message: 'আপডেট ডাউনলোড ও ভেরিফাই সম্পন্ন। ইনস্টল হচ্ছে...' };
        }
      } catch (err: any) {
        return { success: false, message: `আপডেট ব্যর্থ: ${err.message}` };
      }
    }

    // Web Fallback: trigger download link
    if (typeof window !== 'undefined') {
      window.open(manifest.downloadUrl || 'https://releases.schoolpro.edu.bd/download/latest', '_blank');
      return { success: true, message: 'আপডেট প্যাকেজ ডাউনলোড লিঙ্ক খোলা হয়েছে।' };
    }

    return { success: false, message: 'ডাউনলোড সম্পন্ন করা যায়নি।' };
  }

  public getCachedUpdate(): UpdateReleaseManifest | null {
    return this.cachedManifest;
  }

  public dismissUpdate(version: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_DISMISSED_VERSION, version);
    }
  }

  public isDismissed(version: string): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY_DISMISSED_VERSION) === version;
  }
}

export const updateClientService = new UpdateClientService();
