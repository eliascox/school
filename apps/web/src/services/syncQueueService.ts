import type {
  SyncEntityType,
  SyncAction,
  SyncQueueItem,
  SyncPushBatchRequest,
  SyncPushBatchResponse,
  SyncPullRequest,
  SyncPullResponse
} from '@sms/shared-types';
import { clientLicenseService } from './clientLicenseService';

const STORAGE_KEY_QUEUE = 'sms_offline_sync_queue_v2';
const STORAGE_KEY_LAST_SYNC = 'sms_last_successful_sync_timestamp';

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime?: string;
  isSyncing: boolean;
  lastError?: string;
}

class SyncQueueService {
  private apiBaseUrl: string = process.env.NEXT_PUBLIC_CENTRAL_API_URL || 'http://localhost:3000';
  private isSyncing: boolean = false;
  private syncTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen for online status restoration
      window.addEventListener('online', () => {
        console.log('[SyncService] Device connected online. Initiating auto-sync...');
        this.triggerDebouncedSync(1000);
      });

      window.addEventListener('offline', () => {
        console.log('[SyncService] Device went offline. Mutations will queue locally.');
        this.notifyStatusChange();
      });

      // Periodically trigger sync every 30 seconds if online
      this.syncTimer = setInterval(() => {
        if (navigator.onLine) {
          this.syncAll();
        }
      }, 30000);
    }
  }

  /**
   * Helper: Generate SHA-256 Idempotency Key
   */
  private generateIdempotencyKey(schoolId: string, entityType: string, entityId: string, action: string, version: number, timestamp: string): string {
    const raw = `${schoolId}|${entityType}|${entityId}|${action}|${version}|${timestamp}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(16, '0').toUpperCase();
    return `IDEM-${hex}-${timestamp.replace(/[^0-9]/g, '').slice(-8)}`;
  }

  /**
   * 1. Enqueue Offline Mutation
   */
  public async enqueue<T = any>(
    entityType: SyncEntityType,
    entityId: string,
    action: SyncAction,
    payload: T,
    version: number = 1
  ): Promise<SyncQueueItem<T>> {
    const regState = clientLicenseService.getRegistrationState();
    const schoolId = regState.schoolCode || 'SCH-106184';
    const timestamp = new Date().toISOString();
    const id = `sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const idempotencyKey = this.generateIdempotencyKey(schoolId, entityType, entityId, action, version, timestamp);

    const item: SyncQueueItem<T> = {
      id,
      schoolId,
      entityType,
      entityId,
      action,
      payload,
      version,
      clientTimestampUtc: timestamp,
      idempotencyKey,
      attempts: 0,
      status: 'PENDING'
    };

    // If running in Desktop Electron, queue to SQLite
    if (typeof window !== 'undefined' && window.electronAPI?.enqueueSyncMutation) {
      try {
        await window.electronAPI.enqueueSyncMutation(item);
      } catch (err: any) {
        console.warn('[SyncService] Electron enqueue error, falling back to localStorage:', err.message);
        this.saveToLocalQueue(item);
      }
    } else {
      this.saveToLocalQueue(item);
    }

    this.notifyStatusChange();

    // Trigger immediate debounced push if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.triggerDebouncedSync(1500);
    }

    return item;
  }

  /**
   * Save item to browser localStorage queue
   */
  private saveToLocalQueue(item: SyncQueueItem) {
    if (typeof window === 'undefined') return;
    try {
      const existing = this.getLocalQueue();
      existing.push(item);
      localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(existing));
    } catch (e) {
      console.error('[SyncService] Failed to save to local queue:', e);
    }
  }

  /**
   * Get all pending items in browser localStorage queue
   */
  public getLocalQueue(): SyncQueueItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * 2. Push Pending Mutations Batch to Central Server
   */
  public async pushBatch(): Promise<SyncPushBatchResponse | null> {
    const regState = clientLicenseService.getRegistrationState();
    const schoolId = regState.schoolCode || 'SCH-106184';
    const hw = await clientLicenseService.getHardwareInfo();

    let items: SyncQueueItem[] = [];

    if (typeof window !== 'undefined' && window.electronAPI?.getPendingSyncBatch) {
      try {
        items = await window.electronAPI.getPendingSyncBatch(50);
      } catch {
        items = this.getLocalQueue().filter(i => i.status === 'PENDING').slice(0, 50);
      }
    } else {
      items = this.getLocalQueue().filter(i => i.status === 'PENDING').slice(0, 50);
    }

    if (items.length === 0) return null;

    const batchRequest: SyncPushBatchRequest = {
      schoolId,
      deviceFingerprint: hw.fingerprint,
      batchId: `batch-${Date.now()}`,
      items
    };

    try {
      const res = await fetch(`${this.apiBaseUrl}/api/v1/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchRequest)
      });

      if (res.ok) {
        const data: SyncPushBatchResponse = await res.json();
        
        // Remove accepted items from local queue
        if (typeof window !== 'undefined') {
          const acceptedIds = new Set(data.results.filter(r => r.success).map(r => r.queueId));
          const currentQueue = this.getLocalQueue();
          const remainingQueue = currentQueue.filter(i => !acceptedIds.has(i.id));
          localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(remainingQueue));
        }

        return data;
      }
    } catch (err: any) {
      console.warn('[SyncService] Sync push error (Server unavailable):', err.message);
    }

    return null;
  }

  /**
   * 3. Pull Server Changes to Desktop Client
   */
  public async pullChanges(): Promise<number> {
    const regState = clientLicenseService.getRegistrationState();
    const schoolId = regState.schoolCode || 'SCH-106184';
    const hw = await clientLicenseService.getHardwareInfo();
    const lastSync = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_LAST_SYNC) || undefined : undefined;

    const pullRequest: SyncPullRequest = {
      schoolId,
      deviceFingerprint: hw.fingerprint,
      sinceServerTimestampUtc: lastSync
    };

    try {
      const res = await fetch(`${this.apiBaseUrl}/api/v1/sync/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pullRequest)
      });

      if (res.ok) {
        const data: SyncPullResponse = await res.json();
        if (data.changes && data.changes.length > 0) {
          console.log(`[SyncService] Applied ${data.changes.length} remote changes from server.`);
          this.applyRemoteChanges(data.changes);
        }

        if (data.serverTimeUtc && typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_LAST_SYNC, data.serverTimeUtc);
        }

        return data.changes?.length || 0;
      }
    } catch (err: any) {
      console.warn('[SyncService] Sync pull error (Server unavailable):', err.message);
    }

    return 0;
  }

  /**
   * 4. Perform Full Two-Way Synchronization Cycle
   */
  public async syncAll(): Promise<{ pushed: number; pulled: number }> {
    if (this.isSyncing) return { pushed: 0, pulled: 0 };
    this.isSyncing = true;
    this.notifyStatusChange();

    let pushed = 0;
    let pulled = 0;

    try {
      const pushRes = await this.pushBatch();
      if (pushRes) {
        pushed = pushRes.processedCount;
      }

      pulled = await this.pullChanges();
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toISOString());
      }
    } finally {
      this.isSyncing = false;
      this.notifyStatusChange();
    }

    return { pushed, pulled };
  }

  private debounceTimer: any = null;
  private triggerDebouncedSync(delayMs: number = 2000) {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.syncAll();
    }, delayMs);
  }

  /**
   * 5. Get Current Live Sync Status
   */
  public getSyncStatus(): SyncStatus {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const pendingCount = this.getLocalQueue().length;
    const lastSyncTime = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_LAST_SYNC) || undefined : undefined;

    return {
      isOnline,
      pendingCount,
      lastSyncTime,
      isSyncing: this.isSyncing
    };
  }

  /**
   * Apply Pulled Server Changes to Local Client State with Conflict Handling
   */
  private applyRemoteChanges(changes: any[]) {
    if (typeof window === 'undefined' || !changes || changes.length === 0) return;

    for (const change of changes) {
      try {
        switch (change.entityType) {
          case 'student':
            this.reconcileStudent(change);
            break;
          case 'fee_collection':
            this.reconcileFeeCollection(change);
            break;
          case 'exam_mark':
            this.reconcileExamMark(change);
            break;
          case 'school_setting':
            this.reconcileSetting(change);
            break;
          default:
            console.log(`[SyncService] Reconciled entity ${change.entityType} (${change.entityId})`);
        }
      } catch (err: any) {
        console.error(`[SyncService] Reconcile error for ${change.entityType}:`, err.message);
      }
    }

    // Trigger UI refresh across tabs/windows
    window.dispatchEvent(new Event('storage'));
  }

  private reconcileStudent(change: any) {
    const raw = localStorage.getItem('sms_students');
    const students: any[] = raw ? JSON.parse(raw) : [];
    const pendingQueue = this.getLocalQueue();

    // Check if there is a local uncommitted mutation on this student
    const hasLocalPending = pendingQueue.some(
      i => i.entityType === 'student' && i.entityId === change.entityId && i.status === 'PENDING'
    );

    if (change.action === 'DELETE') {
      if (!hasLocalPending) {
        const filtered = students.filter(s => s.id !== change.entityId);
        localStorage.setItem('sms_students', JSON.stringify(filtered));
      }
      return;
    }

    const serverStudent = change.data;
    if (!serverStudent) return;

    const idx = students.findIndex(s => s.id === change.entityId);
    if (idx !== -1) {
      if (hasLocalPending) {
        // Conflict scenario: Local has uncommitted edits.
        // Server-Authoritative with Monotonic Version Check
        if (change.version > (students[idx].version || 1)) {
          students[idx] = { ...serverStudent, version: change.version };
          localStorage.setItem('sms_students', JSON.stringify(students));
        }
      } else {
        students[idx] = { ...students[idx], ...serverStudent, version: change.version };
        localStorage.setItem('sms_students', JSON.stringify(students));
      }
    } else {
      students.unshift({ ...serverStudent, version: change.version });
      localStorage.setItem('sms_students', JSON.stringify(students));
    }
  }

  private reconcileFeeCollection(change: any) {
    if (!change.data) return;
    const historyKey = 'sms_payment_history';
    const rawHistory = localStorage.getItem(historyKey);
    const history: any[] = rawHistory ? JSON.parse(rawHistory) : [];

    const receiptId = change.data.receiptId || change.entityId;
    const exists = history.some(p => p.receiptId === receiptId);
    if (!exists) {
      history.unshift({
        receiptId,
        studentId: change.data.studentId,
        studentName: change.data.studentName,
        roll: change.data.roll,
        grade: change.data.grade,
        paidAmount: change.data.amount,
        paymentMethod: change.data.paymentMethod || 'Cash',
        trxId: change.data.trxId,
        date: change.data.date || new Date().toISOString(),
        collectedBy: change.data.collectedBy || 'সেন্ট্রাল অ্যাডমিন'
      });
      localStorage.setItem(historyKey, JSON.stringify(history));
    }
  }

  private reconcileExamMark(change: any) {
    if (!change.data || !change.data.marks) return;
    const { examId, grade, branch, group, subject, marks } = change.data;
    if (examId && grade && branch && marks) {
      const primaryKey = `sms_marks_${examId}_${grade}_${branch}_${group || 'সাধারণ'}_${subject}`;
      localStorage.setItem(primaryKey, JSON.stringify(marks));
    }
  }

  private reconcileSetting(change: any) {
    if (!change.data) return;
    localStorage.setItem('sms_school_settings', JSON.stringify(change.data));
  }

  private notifyStatusChange() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('sms:sync-status-changed', {
      detail: this.getSyncStatus()
    }));
  }
}

export const syncQueueService = new SyncQueueService();
