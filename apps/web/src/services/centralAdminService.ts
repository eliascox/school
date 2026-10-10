import { 
  School, 
  SchoolStatus, 
  SchoolLicense, 
  DeviceEntity, 
  AuditLogEntry, 
  UpdateReleaseManifest,
  LicensePlan,
  SchoolRegistrationRequest
} from '@sms/shared-types';

export interface ExtendedSchoolData extends School {
  license?: SchoolLicense;
  devices: DeviceEntity[];
  auditLogs: AuditLogEntry[];
}

const STORAGE_KEY_SCHOOLS = 'sms_central_schools_db_v1';
const STORAGE_KEY_AUDITS = 'sms_central_audits_db_v1';
const STORAGE_KEY_RELEASES = 'sms_central_releases_db_v1';

// Initial Mock Seed Data if browser cache is empty
const INITIAL_SCHOOLS: ExtendedSchoolData[] = [
  {
    id: 'school-uuid-106184',
    schoolCode: 'SCH-106184',
    schoolName: 'বরইতলী উচ্চ বিদ্যালয়',
    eiinNumber: '106184',
    division: 'চট্টগ্রাম',
    district: 'কক্সবাজার',
    upazila: 'চকরিয়া',
    address: 'বরইতলী, চকরিয়া, কক্সবাজার।',
    contactPhone: '01819-000000',
    contactEmail: 'boroitolihs@gmail.com',
    principalName: 'মোহাম্মদ রফিকুল ইসলাম',
    principalPhone: '01819-000000',
    authorizedPerson: 'প্রধান শিক্ষক',
    studentCountEstimate: 1250,
    teacherCountEstimate: 36,
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    license: {
      id: 'lic-001',
      schoolId: 'school-uuid-106184',
      licenseKey: 'SCH-98F1-4A2B-7C3D-88E2',
      planType: 'STANDARD',
      maxDevices: 2,
      maxStudents: 1500,
      validFrom: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      validUntil: new Date(Date.now() + 335 * 24 * 3600 * 1000).toISOString(),
      gracePeriodDays: 7,
      signedPayload: '{"alg":"Ed25519","valid":true}',
      createdAt: new Date().toISOString(),
    },
    devices: [
      {
        id: 'dev-001',
        schoolId: 'school-uuid-106184',
        deviceName: 'অফিস প্রধান সার্ভার পিসি',
        fingerprintHash: '40a5f237ff35158dd24aa0eed7620472364ceaeafd2147795a4e0bc06ce67567',
        osInfo: 'Windows 11 Pro 64-bit',
        appVersion: '1.0.0',
        isActive: true,
        lastHeartbeatAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 'dev-002',
        schoolId: 'school-uuid-106184',
        deviceName: 'সহকারী শিক্ষক ল্যাপটপ',
        fingerprintHash: '7b89f134ee11029aa87bb900dc1234567890abcdef1234567890abcdef123456',
        osInfo: 'Windows 10 Enterprise',
        appVersion: '1.0.0',
        isActive: true,
        lastHeartbeatAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      }
    ],
    auditLogs: [
      {
        action: 'SCHOOL_APPROVED',
        userEmail: 'superadmin@schoolpro.com',
        timestamp: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        details: { plan: 'STANDARD', key: 'SCH-98F1-4A2B-7C3D-88E2' },
        ipAddress: '103.205.71.12'
      }
    ]
  },
  {
    id: 'school-uuid-204192',
    schoolCode: 'SCH-204192',
    schoolName: 'চকরিয়া কেন্দ্রীয় উচ্চ বিদ্যালয়',
    eiinNumber: '106192',
    division: 'চট্টগ্রাম',
    district: 'কক্সবাজার',
    upazila: 'চকরিয়া',
    address: 'পৌরসভা চত্বর, চকরিয়া।',
    contactPhone: '01815-112233',
    contactEmail: 'chakaria.high@gmail.com',
    principalName: 'আবুল কালাম আজাদ',
    principalPhone: '01815-112233',
    authorizedPerson: 'প্রধান শিক্ষক',
    studentCountEstimate: 950,
    teacherCountEstimate: 28,
    status: 'PENDING',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    devices: [
      {
        id: 'dev-003',
        schoolId: 'school-uuid-204192',
        deviceName: 'অ্যাডমিন ডেস্কটপ পিসি',
        fingerprintHash: '3c99f123dd887711aa223344556677889900aabbccddeeff0011223344556677',
        osInfo: 'Windows 11 Home',
        appVersion: '1.0.0',
        isActive: true,
        lastHeartbeatAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      }
    ],
    auditLogs: [
      {
        action: 'REGISTRATION_SUBMITTED',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        details: { source: 'Desktop Client Registration Wizard' },
        ipAddress: '118.179.88.54'
      }
    ]
  },
  {
    id: 'school-uuid-305881',
    schoolCode: 'SCH-305881',
    schoolName: 'রামু মডেল হাই স্কুল',
    eiinNumber: '106205',
    division: 'চট্টগ্রাম',
    district: 'কক্সবাজার',
    upazila: 'রামু',
    address: 'চৌমুহনী বাজার সংলগ্ন, রামু।',
    contactPhone: '01712-445566',
    contactEmail: 'ramu.model@gmail.com',
    principalName: 'নুরুল ইসলাম ভূঁইয়া',
    principalPhone: '01712-445566',
    authorizedPerson: 'প্রধান শিক্ষক',
    studentCountEstimate: 800,
    teacherCountEstimate: 24,
    status: 'SUSPENDED',
    suspensionReason: 'বাৎসরিক সফটওয়্যার সাবস্ক্রিপশন ফি অপরিশোধিত থাকায় স্থগিত করা হয়েছে।',
    createdAt: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    devices: [],
    auditLogs: [
      {
        action: 'SCHOOL_SUSPENDED',
        userEmail: 'superadmin@schoolpro.com',
        timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        details: { reason: 'বাৎসরিক সফটওয়্যার সাবস্ক্রিপশন ফি অপরিশোধিত' },
        ipAddress: '103.205.71.12'
      }
    ]
  }
];

const INITIAL_RELEASES: UpdateReleaseManifest[] = [
  {
    version: '1.0.0',
    releaseChannel: 'STABLE',
    minSupportedVersion: '1.0.0',
    isCritical: false,
    downloadUrl: 'https://releases.schoolpro.com/desktop/SchoolPro-v1.0.0-Setup.exe',
    sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    signature: 'MEQCID8jKk/3y9Z4jQ9W/...',
    packageSizeBytes: 26843545,
    releaseNotes: 'প্রথম পূর্ণাঙ্গ অফলাইন-ফার্স্ট উইন্ডোজ ডেস্কটপ রিলিজ। শিক্ষার্থী ও ফি মডিউল সংযুক্ত।',
    publishedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  }
];

export const centralAdminService = {
  // Load Schools from Local Storage or Seed
  getSchools(): ExtendedSchoolData[] {
    if (typeof window === 'undefined') return INITIAL_SCHOOLS;
    try {
      const data = localStorage.getItem(STORAGE_KEY_SCHOOLS);
      if (data) {
        return JSON.parse(data);
      }
      localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(INITIAL_SCHOOLS));
      return INITIAL_SCHOOLS;
    } catch {
      return INITIAL_SCHOOLS;
    }
  },

  saveSchools(schools: ExtendedSchoolData[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(schools));
  },

  getSchoolById(id: string): ExtendedSchoolData | undefined {
    const list = this.getSchools();
    return list.find(s => s.id === id || s.schoolCode === id);
  },

  // 1. APPROVE SCHOOL & ISSUE LICENSE
  approveSchool(id: string, options: { plan: LicensePlan; maxDevices: number; validUntilDays: number; adminEmail: string }) {
    const schools = this.getSchools();
    const idx = schools.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('স্কুল পাওয়া যায়নি');

    const school = schools[idx];
    const now = new Date();
    const validUntil = new Date(now.getTime() + options.validUntilDays * 24 * 3600 * 1000);
    const licenseKey = `SCH-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newLicense: SchoolLicense = {
      id: `lic-${Date.now()}`,
      schoolId: school.id,
      licenseKey,
      planType: options.plan,
      maxDevices: options.maxDevices,
      maxStudents: 1500,
      validFrom: now.toISOString(),
      validUntil: validUntil.toISOString(),
      gracePeriodDays: 7,
      signedPayload: JSON.stringify({
        schoolId: school.id,
        schoolCode: school.schoolCode,
        status: 'APPROVED',
        plan: options.plan,
        validUntil: validUntil.toISOString(),
        verified: true,
      }),
      createdAt: now.toISOString(),
    };

    school.status = 'APPROVED';
    school.rejectionReason = undefined;
    school.suspensionReason = undefined;
    school.license = newLicense;
    school.updatedAt = now.toISOString();

    const auditEntry: AuditLogEntry = {
      action: 'SCHOOL_APPROVED',
      schoolId: school.id,
      userEmail: options.adminEmail,
      timestamp: now.toISOString(),
      details: { plan: options.plan, maxDevices: options.maxDevices, licenseKey },
      ipAddress: '127.0.0.1'
    };

    school.auditLogs = [auditEntry, ...(school.auditLogs || [])];
    this.saveSchools(schools);
    return school;
  },

  // 2. SUSPEND SCHOOL (REMOTE LOCKOUT TRIGGER)
  suspendSchool(id: string, reason: string, adminEmail: string) {
    const schools = this.getSchools();
    const idx = schools.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('স্কুল পাওয়া যায়নি');

    const school = schools[idx];
    const now = new Date();
    school.status = 'SUSPENDED';
    school.suspensionReason = reason;
    school.updatedAt = now.toISOString();

    const auditEntry: AuditLogEntry = {
      action: 'SCHOOL_SUSPENDED',
      schoolId: school.id,
      userEmail: adminEmail,
      timestamp: now.toISOString(),
      details: { reason },
      ipAddress: '127.0.0.1'
    };

    school.auditLogs = [auditEntry, ...(school.auditLogs || [])];
    this.saveSchools(schools);
    return school;
  },

  // 3. REACTIVATE SCHOOL
  reactivateSchool(id: string, adminEmail: string) {
    const schools = this.getSchools();
    const idx = schools.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('স্কুল পাওয়া যায়নি');

    const school = schools[idx];
    const now = new Date();
    school.status = 'APPROVED';
    school.suspensionReason = undefined;
    school.updatedAt = now.toISOString();

    const auditEntry: AuditLogEntry = {
      action: 'SCHOOL_REACTIVATED',
      schoolId: school.id,
      userEmail: adminEmail,
      timestamp: now.toISOString(),
      details: { action: 'Reactivated by Super Admin' },
      ipAddress: '127.0.0.1'
    };

    school.auditLogs = [auditEntry, ...(school.auditLogs || [])];
    this.saveSchools(schools);
    return school;
  },

  // 4. REJECT SCHOOL REGISTRATION
  rejectSchool(id: string, reason: string, adminEmail: string) {
    const schools = this.getSchools();
    const idx = schools.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('স্কুল পাওয়া যায়নি');

    const school = schools[idx];
    const now = new Date();
    school.status = 'REJECTED';
    school.rejectionReason = reason;
    school.updatedAt = now.toISOString();

    const auditEntry: AuditLogEntry = {
      action: 'SCHOOL_REJECTED',
      schoolId: school.id,
      userEmail: adminEmail,
      timestamp: now.toISOString(),
      details: { reason },
      ipAddress: '127.0.0.1'
    };

    school.auditLogs = [auditEntry, ...(school.auditLogs || [])];
    this.saveSchools(schools);
    return school;
  },

  // 5. GET RELEASES
  getReleases(): UpdateReleaseManifest[] {
    if (typeof window === 'undefined') return INITIAL_RELEASES;
    try {
      const data = localStorage.getItem(STORAGE_KEY_RELEASES);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEY_RELEASES, JSON.stringify(INITIAL_RELEASES));
      return INITIAL_RELEASES;
    } catch {
      return INITIAL_RELEASES;
    }
  },

  // 6. PUBLISH NEW SOFTWARE UPDATE
  publishRelease(manifest: UpdateReleaseManifest) {
    const list = this.getReleases();
    list.unshift(manifest);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_RELEASES, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('sms:update-available', { detail: manifest }));
    }

    // Forward to Central Backend API
    const apiUrl = process.env.NEXT_PUBLIC_CENTRAL_API_URL || 'http://localhost:3000';
    fetch(`${apiUrl}/api/v1/updates/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        versionNumber: manifest.version,
        releaseChannel: manifest.releaseChannel,
        minSupportedVersion: manifest.minSupportedVersion,
        downloadUrl: manifest.downloadUrl,
        packageSha256: manifest.sha256,
        packageSizeBytes: manifest.packageSizeBytes,
        releaseNotes: manifest.releaseNotes,
        isCritical: manifest.isCritical,
        signature: manifest.signature
      })
    }).catch(err => {
      console.warn('[CentralAdmin] Could not forward release to API:', err.message);
    });

    return list;
  },

  // 7. GET SYSTEM STATS
  getStats() {
    const schools = this.getSchools();
    const total = schools.length;
    const pending = schools.filter(s => s.status === 'PENDING').length;
    const active = schools.filter(s => s.status === 'APPROVED').length;
    const suspended = schools.filter(s => s.status === 'SUSPENDED').length;
    const rejected = schools.filter(s => s.status === 'REJECTED').length;
    const totalDevices = schools.reduce((acc, s) => acc + (s.devices?.length || 0), 0);

    return { total, pending, active, suspended, rejected, totalDevices };
  },

  // 8. GET SCHOOL BY CODE
  getSchoolByCode(schoolCode: string): ExtendedSchoolData | undefined {
    const schools = this.getSchools();
    return schools.find(s => s.schoolCode.toUpperCase() === schoolCode.toUpperCase());
  },

  // 9. REGISTER NEW SCHOOL (DESKTOP CLIENT FIRST-RUN)
  registerSchool(req: SchoolRegistrationRequest): { school: ExtendedSchoolData; schoolCode: string } {
    const schools = this.getSchools();
    const generatedCode = req.schoolCode || `SCH-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const schoolId = `school-uuid-${Date.now()}`;

    const newSchool: ExtendedSchoolData = {
      id: schoolId,
      schoolCode: generatedCode,
      schoolName: req.schoolName,
      eiinNumber: req.eiinNumber,
      division: req.division,
      district: req.district,
      upazila: req.upazila,
      address: req.address,
      contactPhone: req.contactPhone,
      contactEmail: req.contactEmail,
      principalName: req.principalName,
      principalPhone: req.principalPhone,
      authorizedPerson: req.authorizedPerson,
      studentCountEstimate: req.studentCountEstimate,
      teacherCountEstimate: req.teacherCountEstimate,
      status: 'PENDING',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      devices: [
        {
          id: `dev-${Date.now()}`,
          schoolId,
          fingerprintHash: req.deviceFingerprint,
          deviceName: req.deviceName || 'Primary Desktop Workstation',
          osInfo: req.osInfo || 'win32',
          appVersion: req.appVersion || '1.0.0',
          isActive: true,
          createdAt: now.toISOString()
        }
      ],
      auditLogs: [
        {
          action: 'REGISTRATION_SUBMITTED',
          schoolId,
          timestamp: now.toISOString(),
          details: { schoolName: req.schoolName, schoolCode: generatedCode },
          ipAddress: '127.0.0.1'
        }
      ]
    };

    schools.unshift(newSchool);
    this.saveSchools(schools);
    return { school: newSchool, schoolCode: generatedCode };
  }
};

