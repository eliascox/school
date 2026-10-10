import * as crypto from 'crypto';
import { DeviceHardwareComponents } from '@sms/shared-types';

/**
 * Generate a deterministic SHA-256 fingerprint from hardware components
 */
export function generateDeviceFingerprint(components: DeviceHardwareComponents): string {
  const normalizedString = [
    components.motherboardUuid.trim().toLowerCase(),
    components.cpuId.trim().toLowerCase(),
    components.systemDiskSerial.trim().toLowerCase(),
    components.primaryMacAddress.trim().toLowerCase(),
    components.osPlatform.trim().toLowerCase()
  ].join('::');

  return crypto
    .createHash('sha256')
    .update(normalizedString, 'utf8')
    .digest('hex');
}

/**
 * Generate an Idempotency Key for a Sync Queue item
 */
export function generateSyncIdempotencyKey(
  schoolId: string,
  entityType: string,
  entityId: string,
  version: number,
  action: string
): string {
  const raw = `${schoolId}:${entityType}:${entityId}:v${version}:${action}`;
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}
