import { ReleaseChannel } from '@sms/shared-types';

export class PublishReleaseDto {
  versionNumber!: string;
  releaseChannel?: ReleaseChannel;
  minSupportedVersion?: string;
  downloadUrl!: string;
  packageSha256!: string;
  packageSizeBytes?: number;
  releaseNotes?: string;
  isCritical?: boolean;
  signature?: string;
}
