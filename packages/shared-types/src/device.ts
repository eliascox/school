/**
 * Hardware Fingerprint and Registered Client Device Types
 */
export interface DeviceHardwareComponents {
  motherboardUuid: string;
  cpuId: string;
  systemDiskSerial: string;
  primaryMacAddress: string;
  osPlatform: string;
}

export interface DeviceRegistrationDto {
  schoolId: string;
  fingerprintHash: string; // SHA-256 of combined hardware components
  deviceName: string;
  osInfo: string;
  appVersion: string;
}

export interface DeviceEntity {
  id: string; // UUID v4
  schoolId: string;
  deviceName: string;
  fingerprintHash: string;
  osInfo: string;
  appVersion: string;
  isActive: boolean;
  lastHeartbeatAt?: string;
  createdAt: string;
}
