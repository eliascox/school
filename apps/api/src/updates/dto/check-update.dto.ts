import { CheckUpdateRequest, ReleaseChannel } from '@sms/shared-types';

export class CheckUpdateDto implements CheckUpdateRequest {
  currentVersion!: string;
  releaseChannel?: ReleaseChannel;
  osArchitecture!: 'x64' | 'arm64' | 'ia32';
  schoolId?: string;
}
