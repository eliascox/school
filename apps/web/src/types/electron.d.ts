export interface ElectronHardwareInfo {
  fingerprint: string;
  rawHash: string;
  deviceName: string;
  platform: string;
  cpuModel: string;
}

export interface ElectronAPI {
  isDesktop?: boolean;
  getHardwareFingerprint: () => Promise<ElectronHardwareInfo>;
  saveLicenseFile: (data: any) => Promise<{ success: boolean; error?: string }>;
  loadLicenseFile: () => Promise<any>;

  // Two-Way Sync Engine Bridge
  enqueueSyncMutation: (item: any) => Promise<any>;
  getPendingSyncBatch: (limit?: number) => Promise<any[]>;
  startTwoWaySync: (config: { schoolId: string; deviceFingerprint: string; token?: string }) => void;

  // Cryptographic Auto-Update Bridge
  checkForUpdates: (config: { currentVersion: string; schoolId: string }) => Promise<any>;
  downloadUpdate: (config: { manifest: any; publicKeyPem?: string }) => Promise<any>;
  applyUpdate: (filePath: string) => Promise<void>;

  // Clock-Tampering & Security Watchdog Bridge
  verifyAndResetClock?: () => Promise<{ success: boolean; isTampered: boolean; message: string }>;
  getClockStatus?: () => Promise<{ isClockTampered: boolean; lastKnownUtc: number; currentUtc: number }>;
  onClockTampered?: (callback: (data: { lastKnownUtc: number; currentUtc: number }) => void) => () => void;

  // Backup & Disaster Recovery Bridge
  createLocalBackup?: (options: { schoolId?: string; password?: string; webStorageData?: any; isAutomated?: boolean }) => Promise<any>;
  listLocalBackups?: () => Promise<any[]>;
  verifyBackupArchive?: (filePath: string, password?: string) => Promise<any>;
  restoreLocalBackup?: (filePath: string, password?: string) => Promise<any>;
  getBackupDirectory?: () => Promise<string>;

  // Local Key-Value Storage
  getCachedData: (key: string) => Promise<any>;
  setCachedData: (key: string, value: any) => Promise<any>;

  // Legacy fallback
  queueOfflineAction: (endpoint: string, method: string, payload: any) => Promise<any>;
  startSyncEngine: (token: string) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
