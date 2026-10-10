import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
    const backupId = `CBK-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const schoolVaultDir = path.join(this.backupVaultDir, schoolCode);
    fs.mkdirSync(schoolVaultDir, { recursive: true });

    const item: CloudBackupItem = {
      id: backupId,
      schoolCode,
      fileName: meta.fileName,
      sizeBytes: meta.sizeBytes,
      sha256: meta.sha256,
      recordCounts: meta.recordCounts || { students: 0, feeCollections: 0, examMarks: 0 },
      createdAt: new Date().toISOString(),
    };

    // Store metadata JSON in school's vault
    const metaPath = path.join(schoolVaultDir, `${meta.fileName}.meta.json`);
    fs.writeFileSync(metaPath, JSON.stringify(item, null, 2), 'utf8');

    // Record central audit log
    try {
      const tenant = await this.prisma.tenant.findUnique({ where: { schoolCode } });
      if (tenant) {
        await this.prisma.centralAuditLog.create({
          data: {
            tenantId: tenant.id,
            action: 'CLOUD_BACKUP_REGISTERED',
            details: item as any,
            deviceFingerprint: meta.deviceFingerprint,
          },
        });
      }
    } catch (err: any) {
      this.logger.warn(`Could not log central audit for backup: ${err.message}`);
    }

    this.logger.log(`[BackupVault] Registered cloud backup for ${schoolCode}: ${meta.fileName}`);
    return item;
  }

  /**
   * 2. List all backups stored in the cloud vault for a school
   */
  async listBackups(schoolCode: string): Promise<CloudBackupItem[]> {
    const schoolVaultDir = path.join(this.backupVaultDir, schoolCode);
    if (!fs.existsSync(schoolVaultDir)) {
      return [];
    }

    const files = fs.readdirSync(schoolVaultDir).filter((f) => f.endsWith('.meta.json'));
    const list: CloudBackupItem[] = [];

    for (const f of files) {
      try {
        const raw = fs.readFileSync(path.join(schoolVaultDir, f), 'utf8');
        list.push(JSON.parse(raw));
      } catch (err) {}
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * 3. Get specific backup info
   */
  async getBackup(schoolCode: string, backupId: string): Promise<CloudBackupItem> {
    const list = await this.listBackups(schoolCode);
    const found = list.find((b) => b.id === backupId || b.fileName === backupId);
    if (!found) {
      throw new NotFoundException('ব্যাকআপ রেকর্ডটি পাওয়া যায়নি।');
    }
    return found;
  }
}
