import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

export interface CloudBackupItem {
  id: string;
  schoolCode: string;
  fileName: string;
  sizeBytes: number;
  sha256: string;
  recordCounts: {
    students: number;
    feeCollections: number;
    examMarks: number;
    syncMutations?: number;
  };
  createdAt: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupVaultDir = path.resolve(process.cwd(), 'cloud_vault_backups');

  constructor(private readonly prisma: PrismaService) {
    if (!fs.existsSync(this.backupVaultDir)) {
      fs.mkdirSync(this.backupVaultDir, { recursive: true });
    }
  }

  /**
   * 🛡️ Anti-Path-Traversal Sanitizer: strips directory traversal and special chars
   */
  private sanitizeIdentifier(input: string, label = 'Identifier'): string {
    if (!input || typeof input !== 'string') {
      throw new BadRequestException(`নিরাপত্তা ত্রুটি: ${label} অনুপস্থিত।`);
    }
    const sanitized = input.replace(/[/\\?%*:|"<>.]/g, '').replace(/[^a-zA-Z0-9_-]/g, '').trim();
    if (!sanitized) {
      throw new BadRequestException(`নিরাপত্তা ত্রুটি: ${label} শুধুমাত্র বর্ণ, সংখ্যা ও হাইফেন হতে পারবে।`);
    }
    return sanitized;
  }

  /**
   * 1. Register or store an encrypted disaster recovery backup
   */
  async registerBackup(
    schoolCode: string,
    meta: {
      fileName: string;
      sizeBytes: number;
      sha256: string;
      recordCounts: any;
      deviceFingerprint?: string;
    },
  ): Promise<CloudBackupItem> {
    const safeSchoolCode = this.sanitizeIdentifier(schoolCode, 'School Code');
    const safeFileName = this.sanitizeIdentifier(meta.fileName.replace(/\.json$/i, ''), 'File Name');

    // 🛡️ SECURITY: Verify tenant exists on server before creating any file
    const tenant = await this.prisma.tenant.findUnique({ where: { schoolCode: safeSchoolCode } });
    if (!tenant) {
      throw new BadRequestException('অননুমোদিত প্রতিষ্ঠান: স্কুল কেন্দ্রীয় ক্লাউডে নিবন্ধিত নয়।');
    }

    const backupId = `CBK-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const schoolVaultDir = path.resolve(this.backupVaultDir, safeSchoolCode);
    
    // 🛡️ SECURITY: Strict boundary check to prevent directory escape
    if (!schoolVaultDir.startsWith(this.backupVaultDir)) {
      throw new BadRequestException('Security Violation: Path traversal attempt detected.');
    }
    fs.mkdirSync(schoolVaultDir, { recursive: true });

    const item: CloudBackupItem = {
      id: backupId,
      schoolCode: safeSchoolCode,
      fileName: safeFileName,
      sizeBytes: meta.sizeBytes,
      sha256: meta.sha256,
      recordCounts: meta.recordCounts || { students: 0, feeCollections: 0, examMarks: 0 },
      createdAt: new Date().toISOString(),
    };

    // Store metadata JSON in school's vault
    const metaPath = path.resolve(schoolVaultDir, `${safeFileName}.meta.json`);
    if (!metaPath.startsWith(schoolVaultDir)) {
      throw new BadRequestException('Security Violation: Path traversal attempt detected.');
    }
    fs.writeFileSync(metaPath, JSON.stringify(item, null, 2), 'utf8');

    // Record central audit log
    try {
      await this.prisma.centralAuditLog.create({
        data: {
          tenantId: tenant.id,
          action: 'CLOUD_BACKUP_REGISTERED',
          details: item as any,
          deviceFingerprint: meta.deviceFingerprint,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Could not log central audit for backup: ${err.message}`);
    }

    this.logger.log(`[BackupVault] Registered cloud backup for ${safeSchoolCode}: ${safeFileName}`);
    return item;
  }

  /**
   * 2. List all backups stored in the cloud vault for a school
   */
  async listBackups(schoolCode: string): Promise<CloudBackupItem[]> {
    const safeSchoolCode = this.sanitizeIdentifier(schoolCode, 'School Code');
    const schoolVaultDir = path.resolve(this.backupVaultDir, safeSchoolCode);
    if (!schoolVaultDir.startsWith(this.backupVaultDir) || !fs.existsSync(schoolVaultDir)) {
      return [];
    }

    const files = fs.readdirSync(schoolVaultDir).filter((f) => f.endsWith('.meta.json'));
    const list: CloudBackupItem[] = [];

    for (const f of files) {
      try {
        const filePath = path.resolve(schoolVaultDir, f);
        if (filePath.startsWith(schoolVaultDir)) {
          const raw = fs.readFileSync(filePath, 'utf8');
          list.push(JSON.parse(raw));
        }
      } catch (err) {}
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * 3. Get specific backup info
   */
  async getBackup(schoolCode: string, backupId: string): Promise<CloudBackupItem> {
    const safeSchoolCode = this.sanitizeIdentifier(schoolCode, 'School Code');
    const safeBackupId = this.sanitizeIdentifier(backupId, 'Backup ID');
    const list = await this.listBackups(safeSchoolCode);
    const found = list.find((b) => b.id === safeBackupId || b.fileName === safeBackupId);
    if (!found) {
      throw new NotFoundException('ব্যাকআপ রেকর্ডটি পাওয়া যায়নি।');
    }
    return found;
  }
}
