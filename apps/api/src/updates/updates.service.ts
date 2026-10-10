import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KeyManagementService } from '../crypto/key-management.service';
import { CheckUpdateDto } from './dto/check-update.dto';
import { PublishReleaseDto } from './dto/publish-release.dto';
import { CheckUpdateResponse, UpdateReleaseManifest } from '@sms/shared-types';
import { signUpdatePackageHash } from '@sms/crypto-utils';

@Injectable()
export class UpdatesService {
  private readonly logger = new Logger(UpdatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly keyManagement: KeyManagementService
  ) {}

  async checkUpdate(dto: CheckUpdateDto): Promise<CheckUpdateResponse> {
    const channel = dto.releaseChannel || 'STABLE';

    const latestRelease = await this.prisma.softwareRelease.findFirst({
      where: { releaseChannel: channel },
      orderBy: { publishedAt: 'desc' },
    });

    if (!latestRelease || latestRelease.versionNumber === dto.currentVersion) {
      return { hasUpdate: false };
    }

    const manifest: UpdateReleaseManifest = {
      version: latestRelease.versionNumber,
      releaseChannel: latestRelease.releaseChannel as any,
      minSupportedVersion: latestRelease.minSupportedVersion || '1.0.0',
      isCritical: latestRelease.isCritical,
      downloadUrl: latestRelease.downloadUrl,
      sha256: latestRelease.packageSha256,
      signature: latestRelease.signature,
      packageSizeBytes: Number(latestRelease.packageSizeBytes),
      releaseNotes: latestRelease.releaseNotes || '',
      publishedAt: latestRelease.publishedAt.toISOString(),
    };

    return {
      hasUpdate: true,
      manifest,
    };
  }

  async publishRelease(dto: PublishReleaseDto) {
    let signature = dto.signature;
    if (!signature) {
      // Auto-generate Ed25519 digital signature of package SHA-256 with Server Authority Private Key
      this.logger.log(`Signing release v${dto.versionNumber} package SHA-256 with Server Authority Private Key...`);
      signature = signUpdatePackageHash(dto.packageSha256, this.keyManagement.getPrivateKey());
    }

    const release = await this.prisma.softwareRelease.upsert({
      where: { versionNumber: dto.versionNumber },
      update: {
        releaseChannel: dto.releaseChannel || 'STABLE',
        minSupportedVersion: dto.minSupportedVersion || '1.0.0',
        downloadUrl: dto.downloadUrl,
        packageSha256: dto.packageSha256,
        signature,
        packageSizeBytes: BigInt(dto.packageSizeBytes || 0),
        releaseNotes: dto.releaseNotes || '',
        isCritical: dto.isCritical ?? false,
        publishedAt: new Date()
      },
      create: {
        versionNumber: dto.versionNumber,
        releaseChannel: dto.releaseChannel || 'STABLE',
        minSupportedVersion: dto.minSupportedVersion || '1.0.0',
        downloadUrl: dto.downloadUrl,
        packageSha256: dto.packageSha256,
        signature,
        packageSizeBytes: BigInt(dto.packageSizeBytes || 0),
        releaseNotes: dto.releaseNotes || '',
        isCritical: dto.isCritical ?? false,
        publishedAt: new Date()
      }
    });

    this.logger.log(`Successfully published release v${release.versionNumber} (${release.releaseChannel}).`);
    return {
      success: true,
      release: {
        ...release,
        packageSizeBytes: Number(release.packageSizeBytes)
      }
    };
  }

  async listReleases() {
    const releases = await this.prisma.softwareRelease.findMany({
      orderBy: { publishedAt: 'desc' }
    });
    return releases.map(r => ({
      ...r,
      packageSizeBytes: Number(r.packageSizeBytes)
    }));
  }
}
