import { clientLicenseService } from './clientLicenseService';

export interface BackupRecordCounts {
  students: number;
  feeCollections: number;
  examMarks: number;
  syncMutations?: number;
  cachedEntities?: number;
}

export interface BackupMetadata {
  fileName: string;
  filePath: string;
  sizeBytes: number;
  createdAt: string;
  schoolId: string;
  isAutomated: boolean;
  recordCounts: BackupRecordCounts;
  isPasswordProtected: boolean;
}

export interface BackupCreateResult {
  success: boolean;
  fileName?: string;
  filePath?: string;
  sizeBytes?: number;
  createdAt?: string;
  recordCounts?: BackupRecordCounts;
  error?: string;
}

export interface BackupRestoreResult {
  success: boolean;
  recordCounts?: BackupRecordCounts;
  restoredAt?: string;
  error?: string;
}

import { isSafeRestoreKey } from '@/lib/securityUtils';

export interface BackupValidationResult {
  valid: boolean;
  isValid: boolean;
  message: string;
  error?: string;
  preview?: {
    schoolName: string;
    exportDateBangla: string;
    studentsCount: number;
    totalKeys: number;
  };
  data?: any;
}

export interface DatabaseStats {
  studentsCount: number;
  teachersCount: number;
  markEntriesCount: number;
  attendanceDaysCount: number;
  noticesCount: number;
  totalSizeKb: number;
  lastBackup?: {
    dateBangla: string;
    sizeKb: number;
  };
}

class BackupService {
  /**
   * 1. Gather all local operational data from client storage
   */
  public getWebOperationalData(): any {
    if (typeof window === 'undefined') return {};

    let students = [];
    let fee_collections = [];
    let exam_marks = [];
    let settings = {};

    try {
      students = JSON.parse(localStorage.getItem('students') || '[]');
    } catch (e) {}

    try {
      fee_collections = JSON.parse(localStorage.getItem('fee_collections_v1') || '[]');
    } catch (e) {}

    try {
      exam_marks = JSON.parse(localStorage.getItem('exam_results_v1') || '[]');
    } catch (e) {}

    try {
      settings = JSON.parse(localStorage.getItem('school_settings_v1') || '{}');
    } catch (e) {}

    return {
      students,
      fee_collections,
      exam_marks,
      settings,
    };
  }

  /**
   * 2. Create a full system backup (Encrypted AES-256-GCM)
   */
  public async createBackup(password?: string): Promise<BackupCreateResult> {
    const regState = clientLicenseService.getRegistrationState();
    const schoolId = regState.schoolCode || 'SCH-106184';
    const webStorageData = this.getWebOperationalData();

    // Desktop native backup
    if (typeof window !== 'undefined' && window.electronAPI?.createLocalBackup) {
      try {
        const result = await window.electronAPI.createLocalBackup({
          schoolId,
          password: password?.trim() || undefined,
          webStorageData,
          isAutomated: false,
        });
        return result;
      } catch (err: any) {
        return {
          success: false,
          error: `ডেস্কটপ ব্যাকআপ ব্যর্থ: ${err.message}`,
        };
      }
    }

    // Web Fallback: Export JSON backup blob
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `SchoolPro_WebBackup_${schoolId}_${timestamp}.json`;
      const payload = {
        schemaVersion: 1,
        schoolId,
        createdAt: new Date().toISOString(),
        recordCounts: {
          students: webStorageData.students.length,
          feeCollections: webStorageData.fee_collections.length,
          examMarks: webStorageData.exam_marks.length,
        },
        webStorageData,
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return {
        success: true,
        fileName,
        filePath: 'Browser Downloads',
        sizeBytes: blob.size,
        createdAt: payload.createdAt,
        recordCounts: payload.recordCounts,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `ব্রাউজার ব্যাকআপ ব্যর্থ: ${err.message}`,
      };
    }
  }

  /**
   * 3. List local backups from storage
   */
  public async listBackups(): Promise<BackupMetadata[]> {
    if (typeof window !== 'undefined' && window.electronAPI?.listLocalBackups) {
      try {
        const list = await window.electronAPI.listLocalBackups();
        return list || [];
      } catch (err) {
        console.error('[BackupService] Failed to list backups:', err);
        return [];
      }
    }
    return [];
  }

  /**
   * 4. Verify integrity of a backup archive
   */
  public async verifyBackup(filePath: string, password?: string): Promise<{ isValid: boolean; error?: string; recordCounts?: BackupRecordCounts }> {
    if (typeof window !== 'undefined' && window.electronAPI?.verifyBackupArchive) {
      try {
        const result = await window.electronAPI.verifyBackupArchive(filePath, password);
        return result;
      } catch (err: any) {
        return { isValid: false, error: err.message };
      }
    }
    return { isValid: false, error: 'শুধুমাত্র ডেস্কটপ সংস্করণে এই ফিচারটি সক্রিয়।' };
  }

  /**
   * 5. One-Click Safe Disaster Recovery
   */
  public async restoreBackup(filePath: string, password?: string): Promise<BackupRestoreResult> {
    if (typeof window !== 'undefined' && window.electronAPI?.restoreLocalBackup) {
      try {
        const res = await window.electronAPI.restoreLocalBackup(filePath, password);
        if (!res.success) {
          return { success: false, error: res.error };
        }

        // Apply restored web operational data
        if (res.restoredPayload?.webStorageData) {
          const web = res.restoredPayload.webStorageData;
          if (web.students) {
            localStorage.setItem('students', JSON.stringify(web.students));
          }
          if (web.fee_collections) {
            localStorage.setItem('fee_collections_v1', JSON.stringify(web.fee_collections));
          }
          if (web.exam_marks) {
            localStorage.setItem('exam_results_v1', JSON.stringify(web.exam_marks));
          }
          if (web.settings) {
            localStorage.setItem('school_settings_v1', JSON.stringify(web.settings));
          }
        }

        // Notify app components to refresh
        window.dispatchEvent(new CustomEvent('sms:data-restored'));

        return {
          success: true,
          recordCounts: res.recordCounts,
          restoredAt: res.restoredAt,
        };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    return {
      success: false,
      error: 'শুধুমাত্র ডেস্কটপ মোডে সম্পূর্ণ রিস্টোর করা সম্ভব।',
    };
  }

  /**
   * Restore from Web JSON backup file
   */
  public async restoreFromWebJson(jsonFile: File): Promise<BackupRestoreResult> {
    try {
      const text = await jsonFile.text();
      const payload = JSON.parse(text);

      if (!payload.webStorageData) {
        return { success: false, error: 'অবৈধ ব্যাকআপ ফাইল ফরম্যাট।' };
      }

      const web = payload.webStorageData;
      if (web.students) localStorage.setItem('students', JSON.stringify(web.students));
      if (web.fee_collections) localStorage.setItem('fee_collections_v1', JSON.stringify(web.fee_collections));
      if (web.exam_marks) localStorage.setItem('exam_results_v1', JSON.stringify(web.exam_marks));
      if (web.settings) localStorage.setItem('school_settings_v1', JSON.stringify(web.settings));

      window.dispatchEvent(new CustomEvent('sms:data-restored'));

      return {
        success: true,
        recordCounts: payload.recordCounts,
        restoredAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return { success: false, error: `ওয়েব ব্যাকআপ রিস্টোর ব্যর্থ: ${err.message}` };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // BACKWARD-COMPATIBLE SETTINGS PAGE METHODS
  // ═══════════════════════════════════════════════════════════════

  public getDatabaseStats(): DatabaseStats {
    if (typeof window === 'undefined') {
      return {
        studentsCount: 0,
        teachersCount: 0,
        markEntriesCount: 0,
        attendanceDaysCount: 0,
        noticesCount: 0,
        totalSizeKb: 0,
      };
    }

    let studentsCount = 0;
    let teachersCount = 0;
    let markEntriesCount = 0;
    let attendanceDaysCount = 0;
    let noticesCount = 0;
    let totalSize = 0;

    try {
      const s = JSON.parse(localStorage.getItem('students') || '[]');
      studentsCount = s.length;
    } catch (e) {}

    try {
      const t = JSON.parse(localStorage.getItem('teachers_v1') || '[]');
      teachersCount = t.length;
    } catch (e) {}

    try {
      const m = JSON.parse(localStorage.getItem('exam_results_v1') || '[]');
      markEntriesCount = m.length;
    } catch (e) {}

    try {
      const a = JSON.parse(localStorage.getItem('attendance_records_v1') || '[]');
      attendanceDaysCount = a.length;
    } catch (e) {}

    try {
      const n = JSON.parse(localStorage.getItem('school_notices_v1') || '[]');
      noticesCount = n.length;
    } catch (e) {}

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        totalSize += (localStorage.getItem(key) || '').length * 2;
      }
    }

    let lastBackup: { dateBangla: string; sizeKb: number } | undefined;
    const storedLastBackup = localStorage.getItem('sms_last_backup_meta_v1');
    if (storedLastBackup) {
      try {
        lastBackup = JSON.parse(storedLastBackup);
      } catch (e) {}
    }

    return {
      studentsCount,
      teachersCount,
      markEntriesCount,
      attendanceDaysCount,
      noticesCount,
      totalSizeKb: Math.round(totalSize / 1024),
      lastBackup,
    };
  }

  public downloadBackupFile(userName?: string): { success: boolean; message: string; filename?: string; sizeKb?: number } {
    if (typeof window === 'undefined') return { success: false, message: 'Window not available' };

    try {
      const fullDump: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith('next-') && !key.startsWith('webpack')) {
          try {
            fullDump[key] = JSON.parse(localStorage.getItem(key) || 'null');
          } catch (e) {
            fullDump[key] = localStorage.getItem(key);
          }
        }
      }

      const settings = fullDump['school_settings_v1'] || {};
      const schoolName = settings.schoolName || 'SchoolPro';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${schoolName}_Backup_${timestamp}.json`;

      const payload = {
        exportDate: new Date().toISOString(),
        exportedBy: userName || 'Admin',
        schoolName,
        totalKeys: Object.keys(fullDump).length,
        data: fullDump,
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const sizeKb = Math.round(blob.size / 1024);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const meta = {
        dateBangla: new Date().toLocaleDateString('bn-BD'),
        sizeKb,
      };
      localStorage.setItem('sms_last_backup_meta_v1', JSON.stringify(meta));

      return {
        success: true,
        message: `${filename} ডাউনলোড সম্পন্ন হয়েছে!`,
        filename,
        sizeKb,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `ব্যাকআপ তৈরি ব্যর্থ: ${err.message}`,
      };
    }
  }

  public validateBackupFile(fileContent: string): BackupValidationResult {
    try {
      const parsed = JSON.parse(fileContent);
      if (!parsed || (!parsed.data && !parsed.webStorageData)) {
        return {
          valid: false,
          isValid: false,
          message: 'অবৈধ ব্যাকআপ ফাইল। SchoolPro ব্যাকআপ ফাইল নির্বাচন করুন।',
          error: 'অবৈধ ব্যাকআপ ফাইল। SchoolPro ব্যাকআপ ফাইল নির্বাচন করুন।',
        };
      }

      const data = parsed.data || parsed.webStorageData;
      const settings = (data && data.school_settings_v1) || (data && data.settings) || {};
      const students = (data && data.students) || [];

      return {
        valid: true,
        isValid: true,
        message: 'বৈধ ব্যাকআপ ফাইল।',
        data,
        preview: {
          schoolName: settings.schoolName || parsed.schoolName || 'স্কুল ম্যানেজমেন্ট সিস্টেম',
          exportDateBangla: parsed.exportDate ? new Date(parsed.exportDate).toLocaleDateString('bn-BD') : 'অজানা তারিখ',
          studentsCount: Array.isArray(students) ? students.length : 0,
          totalKeys: Object.keys(data).length,
        },
      };
    } catch (err: any) {
      return {
        valid: false,
        isValid: false,
        message: `ফাইল রিড ত্রুটি: ${err.message}`,
        error: `ফাইল রিড ত্রুটি: ${err.message}`,
      };
    }
  }

  public restoreDatabase(data: any, userName?: string): { success: boolean; message: string; count?: number } {
    if (typeof window === 'undefined') return { success: false, message: 'Window not available' };

    try {
      let count = 0;
      for (const [key, value] of Object.entries(data)) {
        // 🛡️ SECURITY: Prevent prototype pollution & unauthorized admin key overwrite
        if (!isSafeRestoreKey(key)) {
          continue;
        }

        if (typeof value === 'object' && value !== null) {
          localStorage.setItem(key, JSON.stringify(value));
        } else if (typeof value === 'string') {
          localStorage.setItem(key, value);
        }
        count++;
      }

      window.dispatchEvent(new CustomEvent('sms:data-restored'));
      return {
        success: true,
        message: `${count} টি মডিউল সফলভাবে রিস্টোর হয়েছে!`,
        count,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `রিস্টোর ব্যর্থ: ${err.message}`,
      };
    }
  }
}

export const backupService = new BackupService();
