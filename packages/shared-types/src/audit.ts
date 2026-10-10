/**
 * Central and Local Immutable Audit Actions
 */
export type AuditAction = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'REGISTRATION_SUBMITTED'
  | 'SCHOOL_APPROVED'
  | 'SCHOOL_REJECTED'
  | 'SCHOOL_SUSPENDED'
  | 'SCHOOL_REACTIVATED'
  | 'SCHOOL_DEACTIVATED'
  | 'LICENSE_GENERATED'
  | 'LICENSE_EXTENDED'
  | 'DEVICE_BOUND'
  | 'DEVICE_REVOKED'
  | 'REMOTE_LOCK_TRIGGERED'
  | 'CLOCK_TAMPER_DETECTED'
  | 'DATA_SYNC_BATCH'
  | 'UPDATE_DOWNLOADED'
  | 'UPDATE_INSTALLED';

export interface AuditLogEntry {
  id?: string;
  schoolId?: string;
  userId?: string;
  userEmail?: string;
  action: AuditAction;
  details?: Record<string, any>;
  ipAddress?: string;
  deviceFingerprint?: string;
  timestamp: string; // ISO 8601 UTC
}
