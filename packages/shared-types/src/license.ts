import { SchoolStatus } from './school';

export type LicensePlan = 'TRIAL' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';

/**
 * License Database Entity
 */
export interface SchoolLicense {
  id: string; // UUID v4
  schoolId: string;
  licenseKey: string;
  planType: LicensePlan;
  maxDevices: number;
  maxStudents: number;
  validFrom: string; // ISO 8601
  validUntil: string;
  gracePeriodDays: number;
  lastVerifiedAt?: string;
  signedPayload: string; // Base64 JSON containing Ed25519 signature
  createdAt: string;
}

/**
 * Payload encoded inside the Cryptographic Entitlement Token
 * Signed by Central Server Private Key (Ed25519)
 */
export interface EntitlementPayload {
  schoolId: string;
  schoolCode: string;
  schoolName: string;
  status: SchoolStatus;
  licenseKey: string;
  planType: LicensePlan;
  validFromEpochMs: number;
  validUntilEpochMs: number;
  gracePeriodDays: number;
  maxDevices: number;
  maxStudents: number;
  issuedAtEpochMs: number;
  nonce: string; // Cryptographic anti-replay nonce
}

export interface SignedEntitlementToken {
  payload: EntitlementPayload;
  signature: string; // Base64 Ed25519 signature
  keyId: string;     // Key identifier for key-rotation
}

/**
 * Heartbeat Payload sent periodically by the Desktop Client
 */
export interface LicenseHeartbeatRequest {
  schoolId: string;
  deviceFingerprint: string;
  appVersion: string;
  lastKnownServerTimeUtc?: string;
}

export interface LicenseHeartbeatResponse {
  schoolId: string;
  status: SchoolStatus;
  isAllowed: boolean;
  signedToken: SignedEntitlementToken;
  serverTimeUtc: string;
  revocationReason?: string;
  hasUpdate: boolean;
  latestVersion?: string;
}
