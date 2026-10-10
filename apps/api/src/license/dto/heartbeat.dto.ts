import { LicenseHeartbeatRequest } from '@sms/shared-types';

export class HeartbeatDto implements LicenseHeartbeatRequest {
  schoolId!: string;
  deviceFingerprint!: string;
  appVersion!: string;
  lastKnownServerTimeUtc?: string;
}
