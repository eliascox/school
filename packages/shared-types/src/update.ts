/**
 * Auto-Update Release Channel
 */
export type ReleaseChannel = 'STABLE' | 'BETA';

/**
 * Manifest published by the Central Update Server
 */
export interface UpdateReleaseManifest {
  version: string; // e.g. "1.3.0"
  releaseChannel: ReleaseChannel;
  minSupportedVersion: string;
  isCritical: boolean; // If true, force update before allowing operations
  downloadUrl: string; // HTTPS URL to signed .exe / installer package
  sha256: string; // 64-character SHA-256 hexadecimal hash
  signature: string; // Ed25519 signature of the package hash
  packageSizeBytes: number;
  releaseNotes: string;
  publishedAt: string; // ISO 8601 UTC
}

/**
 * Check-Update Request from Desktop Client
 */
export interface CheckUpdateRequest {
  currentVersion: string;
  releaseChannel?: ReleaseChannel;
  osArchitecture: 'x64' | 'arm64' | 'ia32';
  schoolId?: string;
}

export interface CheckUpdateResponse {
  hasUpdate: boolean;
  manifest?: UpdateReleaseManifest;
}
