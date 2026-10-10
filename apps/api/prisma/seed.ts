import { PrismaClient, Role, SchoolStatus, LicensePlan } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { 
  generateEd25519KeyPair, 
  signEntitlementPayload, 
  generateLicenseKey,
  generateNonce 
} from '@sms/crypto-utils';
import { EntitlementPayload } from '@sms/shared-types';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Central Server Database ---');

  // 1. Generate / Retrieve Central Server Ed25519 Keypair
  const { publicKeyPem, privateKeyPem } = generateEd25519KeyPair();
  console.log('✓ Central Server Ed25519 Keypair prepared.');

  // 2. Create Default Central System Tenant / Super Admin
  const adminSchoolCode = 'SYS-000001';
  let adminTenant = await prisma.tenant.findUnique({
    where: { schoolCode: adminSchoolCode }
  });

  if (!adminTenant) {
    adminTenant = await prisma.tenant.create({
      data: {
        schoolCode: adminSchoolCode,
        name: 'SchoolPro Central Administration',
        contactPhone: '01800000000',
        contactEmail: 'superadmin@schoolpro.com',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Motijheel',
        address: 'Central Cloud HQ',
        status: SchoolStatus.APPROVED,
      }
    });
    console.log('✓ Central System Tenant created.');
  }

  // 3. Create Super Admin User
  const superAdminEmail = 'superadmin@schoolpro.com';
  let superAdminUser = await prisma.user.findUnique({
    where: { email: superAdminEmail }
  });

  if (!superAdminUser) {
    const passwordHash = await bcrypt.hash('SuperAdmin@2026!', 10);
    superAdminUser = await prisma.user.create({
      data: {
        tenantId: adminTenant.id,
        name: 'System Super Administrator',
        email: superAdminEmail,
        passwordHash,
        role: Role.SUPER_ADMIN,
        isActive: true,
      }
    });
    console.log('✓ Default Super Admin created: superadmin@schoolpro.com / SuperAdmin@2026!');
  }

  // 4. Seed Initial Sample School (বরইতলী উচ্চ বিদ্যালয়)
  const sampleSchoolCode = 'SCH-106184';
  let sampleSchool = await prisma.tenant.findUnique({
    where: { schoolCode: sampleSchoolCode }
  });

  if (!sampleSchool) {
    sampleSchool = await prisma.tenant.create({
      data: {
        schoolCode: sampleSchoolCode,
        name: 'বরইতলী উচ্চ বিদ্যালয়',
        eiinNumber: '106184',
        division: 'Chittagong',
        district: 'Coxs Bazar',
        upazila: 'Chakaria',
        address: 'বরইতলী, চকরিয়া, কক্সবাজার',
        contactPhone: '01819000000',
        contactEmail: 'boroitolihs@gmail.com',
        principalName: 'মোহাম্মদ রফিকুল ইসলাম',
        principalPhone: '01819000000',
        authorizedPerson: 'প্রধান শিক্ষক',
        studentCountEstimate: 1200,
        teacherCountEstimate: 35,
        status: SchoolStatus.APPROVED,
      }
    });
    console.log('✓ Sample School created:', sampleSchool.name);
  }

  // 5. Issue License & Ed25519 Signed Entitlement Token for Sample School
  const existingLicense = await prisma.schoolLicense.findFirst({
    where: { tenantId: sampleSchool.id }
  });

  if (!existingLicense) {
    const licenseKey = generateLicenseKey('SCH');
    const validFrom = new Date();
    const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

    const entitlementPayload: EntitlementPayload = {
      schoolId: sampleSchool.id,
      schoolCode: sampleSchool.schoolCode,
      schoolName: sampleSchool.name,
      status: 'APPROVED',
      licenseKey,
      planType: 'STANDARD',
      validFromEpochMs: validFrom.getTime(),
      validUntilEpochMs: validUntil.getTime(),
      gracePeriodDays: 7,
      maxDevices: 2,
      maxStudents: 1500,
      issuedAtEpochMs: Date.now(),
      nonce: generateNonce()
    };

    const signedToken = signEntitlementPayload(entitlementPayload, privateKeyPem);

    await prisma.schoolLicense.create({
      data: {
        tenantId: sampleSchool.id,
        licenseKey,
        planType: LicensePlan.STANDARD,
        maxDevices: 2,
        maxStudents: 1500,
        validFrom,
        validUntil,
        gracePeriodDays: 7,
        signedPayload: JSON.stringify(signedToken),
      }
    });
    console.log('✓ License & Ed25519 Signed Entitlement issued for', sampleSchool.schoolCode);
  }

  // 6. Seed Initial Software Release Record (v1.0.0)
  const versionNumber = '1.0.0';
  const existingRelease = await prisma.softwareRelease.findUnique({
    where: { versionNumber }
  });

  if (!existingRelease) {
    await prisma.softwareRelease.create({
      data: {
        versionNumber,
        releaseChannel: 'STABLE',
        downloadUrl: 'https://releases.schoolpro.com/desktop/v1.0.0-setup.exe',
        packageSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        signature: 'dGhpcy1pcy1hLXNhbXBsZS1zaWduYXR1cmUtZm9yLXYxLjAuMA==',
        packageSizeBytes: BigInt(25600000),
        releaseNotes: 'অফলাইন-ফার্স্ট স্কুল ম্যানেজমেন্ট সফটওয়্যারের প্রথম পূর্ণাঙ্গ রিলিজ।',
        isCritical: false,
      }
    });
    console.log('✓ Software Release v1.0.0 recorded.');
  }

  console.log('Central Server Database Seeding COMPLETED successfully! 🎉');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
