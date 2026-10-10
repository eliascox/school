/**
 * Types of Entities that can be Synchronized
 */
export type SyncEntityType = 
  | 'student'
  | 'teacher'
  | 'class'
  | 'section'
  | 'subject'
  | 'attendance'
  | 'fee_collection'
  | 'exam'
  | 'exam_mark'
  | 'school_setting';

export type SyncAction = 'CREATE' | 'UPDATE' | 'DELETE';

export type SyncItemStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CONFLICT';

/**
 * An individual item in the local Sync Queue
 */
export interface SyncQueueItem<T = any> {
  id: string; // Unique transaction UUID
  schoolId: string;
  entityType: SyncEntityType;
  entityId: string; // The primary key (UUID) of the affected record
  action: SyncAction;
  payload: T;
  version: number; // Monotonically increasing version per entity
  clientTimestampUtc: string;
  idempotencyKey: string; // SHA-256(schoolId + entityId + version + action)
  attempts?: number;
  lastError?: string;
  status?: SyncItemStatus;
}

/**
 * Batch Push Request from Desktop Client to Central API
 */
export interface SyncPushBatchRequest {
  schoolId: string;
  deviceFingerprint: string;
  batchId: string; // UUID v4
  items: SyncQueueItem[];
}

export interface SyncPushItemResult {
  queueId: string;
  entityId: string;
  success: boolean;
  status: 'ACCEPTED' | 'REJECTED' | 'CONFLICT_RESOLVED';
  serverVersion?: number;
  error?: string;
}

export interface SyncPushBatchResponse {
  batchId: string;
  processedCount: number;
  results: SyncPushItemResult[];
  serverTimeUtc: string;
}

/**
 * Pull Request from Central API to Desktop Client (Server -> Local sync)
 */
export interface SyncPullRequest {
  schoolId: string;
  deviceFingerprint: string;
  sinceServerTimestampUtc?: string;
  entityTypes?: SyncEntityType[];
}

export interface SyncPullResponse {
  changes: Array<{
    entityType: SyncEntityType;
    entityId: string;
    action: SyncAction;
    data: any;
    version: number;
    updatedAt: string;
  }>;
  serverTimeUtc: string;
  hasMore: boolean;
}
