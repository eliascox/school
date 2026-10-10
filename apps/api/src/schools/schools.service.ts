import { 
  Injectable, 
  BadRequestException, 
  NotFoundException, 
  Logger 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KeyManagementService } from '../crypto/key-management.service';
import { RegisterSchoolDto } from './dto/register-school.dto';
import { ApprovalActionDto } from './dto/approval-action.dto';
import { SchoolStatus, LicensePlan } from '@prisma/client';
import { 
  generateLicenseKey, 
  signEntitlementPayload, 
  generateNonce 
} from '@sms/crypto-utils';
import { EntitlementPayload } from '@sms/shared-types';

@Injectable()
export class SchoolsService {
  private readonly logger = new Logger(SchoolsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly keyManagement: KeyManagementService
  ) {}

  /**
   * 1. Public School Registration from Desktop Application
   */
  async registerSchool(dto: RegisterSchoolDto, ipAddress: string) {
    // Generate unique school code if none provided
    const schoolCode = (dto.schoolCode?.trim() || `SCH-${Math.floor(100000 + Math.random() * 900000)}`).toUpperCase();

    // Check for duplicate school code
    const existingCode = await this.prisma.tenant.findUnique({
      where: { schoolCode }
    });
    if (existingCode) {
      throw new BadRequestException(`School Code '${schoolCode}' is already registered.`);
    }

    // Create the School (Tenant) in PENDING status
    const tenant = await this.prisma.tenant.create({
      data: {
        schoolCode,
        name: dto.schoolName,
        eiinNumber: dto.eiinNumber,
        division: dto.division,
        district: dto.district,
        upazila: dto.upazila,
        address: dto.address,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        principalName: dto.principalName,
        principalPhone: dto.principalPhone,
        authorizedPerson: dto.authorizedPerson,
        studentCountEstimate: dto.studentCountEstimate || 0,
        teacherCountEstimate: dto.teacherCountEstimate || 0,
        status: SchoolStatus.PENDING,
      }
    });

    // Register initial device for this school
    if (dto.deviceFingerprint) {
      await this.prisma.schoolDevice.create({
        data: {
          tenantId: tenant.id,
          deviceName: dto.deviceName || 'Primary Server PC',
          fingerprintHash: dto.deviceFingerprint,
          osInfo: dto.osInfo,
          appVersion: dto.appVersion,
          isActive: true,
          lastHeartbeatAt: new Date(),
        }
      });
    }

    // Record Immutable Audit Log
    await this.prisma.centralAuditLog.create({
      data: {
        tenantId: tenant.id,
        action: 'REGISTRATION_SUBMITTED',
        details: {
          schoolCode: tenant.schoolCode,
          schoolName: tenant.name,
          phone: tenant.contactPhone,
          initialDevice: dto.deviceName,
        },
        ipAddress,
        deviceFingerprint: dto.deviceFingerprint,
      }
    });

    this.logger.log(`New school registered [PENDING]: ${tenant.schoolCode} - ${tenant.name}`);

    return {
      success: true,
      message: 'রেজিস্ট্রেশন সফলভাবে জমা হয়েছে। কেন্দ্রীয় সুপার অ্যাডমিনের অনুমোদনের পর সফটওয়্যার সক্রিয় হবে।',
      schoolId: tenant.id,
      schoolCode: tenant.schoolCode,
      status: tenant.status,
    };
  }

  /**
   * 2. Public Status Polling Endpoint (Used by Desktop Client)
   */
  async getSchoolStatus(schoolCode: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { schoolCode: schoolCode.toUpperCase() },
      include: {
        licenses: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!tenant) {
      throw new NotFoundException(`School with code '${schoolCode}' not found.`);
    }

    const latestLicense = tenant.licenses[0];

    return {
      schoolId: tenant.id,
      schoolCode: tenant.schoolCode,
      schoolName: tenant.name,
      status: tenant.status,
      rejectionReason: tenant.rejectionReason,
      suspensionReason: tenant.suspensionReason,
      hasLicense: !!latestLicense,
      licenseKey: latestLicense?.licenseKey,
      signedToken: latestLicense?.signedPayload ? JSON.parse(latestLicense.signedPayload) : null,
      validUntil: latestLicense?.validUntil,
    };
  }

  /**
   * 3. Super Admin: List all Schools with Pagination & Filters
   */
  async findAll(status?: SchoolStatus, search?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { schoolCode: { contains: search, mode: 'insensitive' } },
        { contactPhone: { contains: search } },
        { district: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, schools] = await Promise.all([
      this.prisma.tenant.count({ where }),
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          licenses: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          _count: {
            select: { devices: true, users: true }
          }
        }
      })
    ]);

    return {
      data: schools,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 4. Super Admin: Get Full School Details
   */
  async findOne(id: string) {
    const school = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        licenses: { orderBy: { createdAt: 'desc' } },
        devices: { orderBy: { createdAt: 'desc' } },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      }
    });

    if (!school) {
      throw new NotFoundException(`School ID '${id}' not found.`);
    }

    return school;
  }

  /**
   * 5. Super Admin: Lifecycle Action (APPROVE, REJECT, SUSPEND, REACTIVATE, DEACTIVATE)
   */
  async handleApprovalAction(id: string, dto: ApprovalActionDto, adminUser: any, ipAddress: string) {
    const school = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        licenses: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    if (!school) {
      throw new NotFoundException(`School ID '${id}' not found.`);
    }

    const privateKey = this.keyManagement.getPrivateKey();

    switch (dto.action) {
      case 'APPROVE': {
        const licenseKey = generateLicenseKey('SCH');
        const validFrom = new Date();
        const validUntil = dto.validUntil ? new Date(dto.validUntil) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        const gracePeriodDays = dto.gracePeriodDays || 7;
        const maxDevices = dto.maxDevices || 2;
        const maxStudents = dto.maxStudents || 1500;
        const planType = dto.planType || LicensePlan.STANDARD;

        // Construct Cryptographic Entitlement Payload
        const payload: EntitlementPayload = {
          schoolId: school.id,
          schoolCode: school.schoolCode,
          schoolName: school.name,
          status: 'APPROVED',
          licenseKey,
          planType,
          validFromEpochMs: validFrom.getTime(),
          validUntilEpochMs: validUntil.getTime(),
          gracePeriodDays,
          maxDevices,
          maxStudents,
          issuedAtEpochMs: Date.now(),
          nonce: generateNonce()
        };

        const signedToken = signEntitlementPayload(payload, privateKey);

        // Update School and create License in transaction
        const updated = await this.prisma.$transaction(async (tx) => {
          const updatedSchool = await tx.tenant.update({
            where: { id },
            data: {
              status: SchoolStatus.APPROVED,
              rejectionReason: null,
              suspensionReason: null,
            }
          });

          const createdLicense = await tx.schoolLicense.create({
            data: {
              tenantId: school.id,
              licenseKey,
              planType,
              maxDevices,
              maxStudents,
              validFrom,
              validUntil,
              gracePeriodDays,
              signedPayload: JSON.stringify(signedToken),
            }
          });

          await tx.centralAuditLog.create({
            data: {
              tenantId: school.id,
              userId: adminUser?.userId,
              userEmail: adminUser?.email,
              action: 'SCHOOL_APPROVED',
              details: {
                licenseKey,
                planType,
                validUntil: validUntil.toISOString(),
                maxDevices,
              },
              ipAddress,
            }
          });

          return { school: updatedSchool, license: createdLicense };
        });

        this.logger.log(`Super Admin APPROVED school: ${school.schoolCode}`);
        return {
          success: true,
          message: `School ${school.schoolCode} has been APPROVED and license issued.`,
          data: updated
        };
      }

      case 'REJECT': {
        const updated = await this.prisma.$transaction(async (tx) => {
          const res = await tx.tenant.update({
            where: { id },
            data: {
              status: SchoolStatus.REJECTED,
              rejectionReason: dto.reason || 'আবেদনটির প্রয়োজনীয় তথ্য সন্তোষজনক নয়।',
            }
          });

          await tx.centralAuditLog.create({
            data: {
              tenantId: school.id,
              userId: adminUser?.userId,
              userEmail: adminUser?.email,
              action: 'SCHOOL_REJECTED',
              details: { reason: dto.reason },
              ipAddress,
            }
          });

          return res;
        });

        this.logger.log(`Super Admin REJECTED school: ${school.schoolCode}`);
        return {
          success: true,
          message: `School ${school.schoolCode} has been REJECTED.`,
          data: updated
        };
      }

      case 'SUSPEND': {
        const suspensionReason = dto.reason || 'সিস্টেম ব্যবহারের শর্তাবলী লঙ্ঘন বা সাবস্ক্রিপশন ফি অপরিশোধিত থাকায় স্থগিত করা হয়েছে।';
        
        // Re-sign token with SUSPENDED status
        const latestLicense = school.licenses[0];
        let signedPayload = '';
        if (latestLicense) {
          const payload: EntitlementPayload = {
            schoolId: school.id,
            schoolCode: school.schoolCode,
            schoolName: school.name,
            status: 'SUSPENDED',
            licenseKey: latestLicense.licenseKey,
            planType: latestLicense.planType,
            validFromEpochMs: latestLicense.validFrom.getTime(),
            validUntilEpochMs: latestLicense.validUntil.getTime(),
            gracePeriodDays: 0,
            maxDevices: latestLicense.maxDevices,
            maxStudents: latestLicense.maxStudents,
            issuedAtEpochMs: Date.now(),
            nonce: generateNonce()
          };
          signedPayload = JSON.stringify(signEntitlementPayload(payload, privateKey));
        }

        const updated = await this.prisma.$transaction(async (tx) => {
          const res = await tx.tenant.update({
            where: { id },
            data: {
              status: SchoolStatus.SUSPENDED,
              suspensionReason,
            }
          });

          if (latestLicense && signedPayload) {
            await tx.schoolLicense.update({
              where: { id: latestLicense.id },
              data: { signedPayload }
            });
          }

          await tx.centralAuditLog.create({
            data: {
              tenantId: school.id,
              userId: adminUser?.userId,
              userEmail: adminUser?.email,
              action: 'SCHOOL_SUSPENDED',
              details: { reason: suspensionReason },
              ipAddress,
            }
          });

          return res;
        });

        this.logger.warn(`Super Admin SUSPENDED school: ${school.schoolCode}`);
        return {
          success: true,
          message: `School ${school.schoolCode} is now SUSPENDED. Remote clients will be auto-locked.`,
          data: updated
        };
      }

      case 'REACTIVATE': {
        // Re-sign token with APPROVED status
        const latestLicense = school.licenses[0];
        let signedPayload = '';
        if (latestLicense) {
          const payload: EntitlementPayload = {
            schoolId: school.id,
            schoolCode: school.schoolCode,
            schoolName: school.name,
            status: 'APPROVED',
            licenseKey: latestLicense.licenseKey,
            planType: latestLicense.planType,
            validFromEpochMs: latestLicense.validFrom.getTime(),
            validUntilEpochMs: latestLicense.validUntil.getTime(),
            gracePeriodDays: latestLicense.gracePeriodDays,
            maxDevices: latestLicense.maxDevices,
            maxStudents: latestLicense.maxStudents,
            issuedAtEpochMs: Date.now(),
            nonce: generateNonce()
          };
          signedPayload = JSON.stringify(signEntitlementPayload(payload, privateKey));
        }

        const updated = await this.prisma.$transaction(async (tx) => {
          const res = await tx.tenant.update({
            where: { id },
            data: {
              status: SchoolStatus.APPROVED,
              suspensionReason: null,
            }
          });

          if (latestLicense && signedPayload) {
            await tx.schoolLicense.update({
              where: { id: latestLicense.id },
              data: { signedPayload }
            });
          }

          await tx.centralAuditLog.create({
            data: {
              tenantId: school.id,
              userId: adminUser?.userId,
              userEmail: adminUser?.email,
              action: 'SCHOOL_REACTIVATED',
              details: { reason: dto.reason || 'Reactivated by Super Admin' },
              ipAddress,
            }
          });

          return res;
        });

        this.logger.log(`Super Admin REACTIVATED school: ${school.schoolCode}`);
        return {
          success: true,
          message: `School ${school.schoolCode} has been REACTIVATED successfully.`,
          data: updated
        };
      }

      case 'DEACTIVATE': {
        const updated = await this.prisma.$transaction(async (tx) => {
          const res = await tx.tenant.update({
            where: { id },
            data: {
              status: SchoolStatus.DEACTIVATED,
              deletedAt: new Date(),
            }
          });

          await tx.centralAuditLog.create({
            data: {
              tenantId: school.id,
              userId: adminUser?.userId,
              userEmail: adminUser?.email,
              action: 'SCHOOL_DEACTIVATED',
              details: { reason: dto.reason || 'Permanently deactivated' },
              ipAddress,
            }
          });

          return res;
        });

        this.logger.warn(`Super Admin DEACTIVATED school: ${school.schoolCode}`);
        return {
          success: true,
          message: `School ${school.schoolCode} is now DEACTIVATED.`,
          data: updated
        };
      }

      default:
        throw new BadRequestException(`Unsupported action '${dto.action}'`);
    }
  }
}
