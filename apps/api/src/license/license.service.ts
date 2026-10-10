import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  Logger 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KeyManagementService } from '../crypto/key-management.service';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { LicenseHeartbeatResponse } from '@sms/shared-types';
import { SchoolStatus } from '@prisma/client';

@Injectable()
export class LicenseService {
  private readonly logger = new Logger(LicenseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly keyManagement: KeyManagementService
  ) {}

  /**
   * Process Periodic Heartbeat & License Entitlement from Desktop Client
   */
  async processHeartbeat(dto: HeartbeatDto, ipAddress: string): Promise<LicenseHeartbeatResponse> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.schoolId },
      include: {
        licenses: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        devices: true
      }
    });

    if (!tenant) {
      throw new NotFoundException(`Institution ID '${dto.schoolId}' not recognized.`);
    }

    const latestLicense = tenant.licenses[0];
    const serverTimeUtc = new Date().toISOString();

    // 1. Check for Pending or Rejected Status
    if (tenant.status === SchoolStatus.PENDING) {
      return {
        schoolId: tenant.id,
        status: 'PENDING',
        isAllowed: false,
        revocationReason: 'বিদ্যালয়ের আবেদনটি বর্তমানে সুপার অ্যাডমিনের অনুমোদনের অপেক্ষায় রয়েছে।',
        signedToken: null as any,
        serverTimeUtc,
        hasUpdate: false,
      };
    }

    if (tenant.status === SchoolStatus.REJECTED) {
      return {
        schoolId: tenant.id,
        status: 'REJECTED',
        isAllowed: false,
        revocationReason: tenant.rejectionReason || 'বিদ্যালয়ের আবেদনটি কেন্দ্রীয় কর্তৃপক্ষ দ্বারা বাতিল করা হয়েছে।',
        signedToken: null as any,
        serverTimeUtc,
        hasUpdate: false,
      };
    }

    // 2. REMOTE DEACTIVATION / SUSPENSION TRIGGER
    if (tenant.status === SchoolStatus.SUSPENDED || tenant.status === SchoolStatus.DEACTIVATED) {
      this.logger.warn(`Heartbeat rejected for SUSPENDED/DEACTIVATED school: ${tenant.schoolCode}`);
      return {
        schoolId: tenant.id,
        status: tenant.status,
        isAllowed: false,
        revocationReason: tenant.suspensionReason || 'আপনার প্রতিষ্ঠানের সফটওয়্যার লাইসেন্স সাময়িকভাবে স্থগিত করা হয়েছে। কেন্দ্রীয় কর্তৃপক্ষের সাথে যোগাযোগ করুন।',
        signedToken: latestLicense?.signedPayload ? JSON.parse(latestLicense.signedPayload) : (null as any),
        serverTimeUtc,
        hasUpdate: false,
      };
    }

    // 3. Verify License Expiry & Grace Period
    if (!latestLicense) {
      return {
        schoolId: tenant.id,
        status: 'EXPIRED',
        isAllowed: false,
        revocationReason: 'কোনো সক্রিয় লাইসেন্স পাওয়া যায়নি।',
        signedToken: null as any,
        serverTimeUtc,
        hasUpdate: false,
      };
    }

    const now = new Date();
    const expiryDate = new Date(latestLicense.validUntil);
    const gracePeriodMs = (latestLicense.gracePeriodDays || 7) * 24 * 60 * 60 * 1000;
    const finalGraceDate = new Date(expiryDate.getTime() + gracePeriodMs);

    if (now > finalGraceDate) {
      return {
        schoolId: tenant.id,
        status: 'EXPIRED',
        isAllowed: false,
        revocationReason: 'লাইসেন্সের মেয়াদ ও গ্রেস পিরিয়ড শেষ হয়ে গেছে। অনুগ্রহ করে লাইসেন্স নবায়ন করুন।',
        signedToken: JSON.parse(latestLicense.signedPayload),
        serverTimeUtc,
        hasUpdate: false,
      };
    }

    // 4. Verify & Bind Device Hardware Fingerprint
    let device = tenant.devices.find(d => d.fingerprintHash === dto.deviceFingerprint);

    if (!device) {
      // Check maximum device limit
      if (tenant.devices.length >= latestLicense.maxDevices) {
        throw new ForbiddenException(`আপনার লাইসেন্সে অনুমোদিত পিসির সর্বোচ্চ সীমা (${latestLicense.maxDevices}টি) পূর্ণ হয়ে গেছে। নতুন পিসি যুক্ত করতে সুপার অ্যাডমিনের সাথে যোগাযোগ করুন।`);
      }

      // Auto-register new authorized device
      device = await this.prisma.schoolDevice.create({
        data: {
          tenantId: tenant.id,
          deviceName: `Client Device #${tenant.devices.length + 1}`,
          fingerprintHash: dto.deviceFingerprint,
          appVersion: dto.appVersion,
          isActive: true,
          lastHeartbeatAt: now,
        }
      });
      this.logger.log(`New device registered for ${tenant.schoolCode}: ${dto.deviceFingerprint}`);
    } else {
      // Update heartbeat timestamp & version
      await this.prisma.schoolDevice.update({
        where: { id: device.id },
        data: {
          lastHeartbeatAt: now,
          appVersion: dto.appVersion,
        }
      });
    }

    if (!device.isActive) {
      return {
        schoolId: tenant.id,
        status: 'SUSPENDED',
        isAllowed: false,
        revocationReason: 'এই নির্দিষ্ট পিসিটির অনুমতি কেন্দ্রীয়ভাবে নিষ্ক্রিয় করা হয়েছে।',
        signedToken: null as any,
        serverTimeUtc,
        hasUpdate: false,
      };
    }

    // 5. Check for Available Software Updates
    const latestRelease = await this.prisma.softwareRelease.findFirst({
      where: { releaseChannel: 'STABLE' },
      orderBy: { publishedAt: 'desc' }
    });

    const hasUpdate = !!(latestRelease && latestRelease.versionNumber !== dto.appVersion);

    return {
      schoolId: tenant.id,
      status: SchoolStatus.APPROVED,
      isAllowed: true,
      signedToken: JSON.parse(latestLicense.signedPayload),
      serverTimeUtc,
      hasUpdate,
      latestVersion: hasUpdate ? latestRelease?.versionNumber : undefined,
    };
  }
}
