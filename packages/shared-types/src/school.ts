/**
 * School Lifecycle Statuses
 */
export type SchoolStatus = 
  | 'PENDING'       // Submitted registration, awaiting Super Admin approval
  | 'APPROVED'      // Approved by Super Admin, license issued, active
  | 'REJECTED'      // Rejected by Super Admin with a stated reason
  | 'SUSPENDED'     // Temporarily suspended by Super Admin (remote auto-lock triggers)
  | 'DEACTIVATED'   // Permanently closed/deactivated by Super Admin
  | 'EXPIRED';      // Subscription license expired beyond grace period

/**
 * School Entity Model
 */
export interface School {
  id: string; // UUID v4
  schoolCode: string; // Unique school identifier (e.g., 'SCH-106184')
  schoolName: string;
  eiinNumber?: string;
  division: string;
  district: string;
  upazila: string;
  address: string;
  contactPhone: string;
  contactEmail?: string;
  principalName: string;
  principalPhone: string;
  authorizedPerson?: string;
  studentCountEstimate?: number;
  teacherCountEstimate?: number;
  status: SchoolStatus;
  rejectionReason?: string;
  suspensionReason?: string;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string;
  deletedAt?: string | null;
}

/**
 * Payload sent by Desktop Client during Initial School Registration
 */
export interface SchoolRegistrationRequest {
  schoolName: string;
  schoolCode?: string; // Optional user suggestion or auto-generated
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
  
  // Initial registering device hardware fingerprint
  deviceFingerprint: string;
  deviceName: string;
  osInfo: string;
  appVersion: string;
}

/**
 * Super Admin Decision Actions on a School
 */
export type SuperAdminActionType = 
  | 'APPROVE'
  | 'REJECT'
  | 'SUSPEND'
  | 'REACTIVATE'
  | 'DEACTIVATE';

export interface SchoolApprovalDto {
  schoolId: string;
  action: SuperAdminActionType;
  reason?: string;
  
  // Parameters when approving
  planType?: 'TRIAL' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
  validUntil?: string; // ISO 8601 Date
  gracePeriodDays?: number; // Default 7
  maxDevices?: number; // Default 2
  maxStudents?: number; // Default 1500
}
