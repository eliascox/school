import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { 
  SyncPushBatchRequest, 
  SyncPushBatchResponse, 
  SyncPushItemResult,
  SyncPullRequest,
  SyncPullResponse,
  SyncAction,
  SyncEntityType
} from '@sms/shared-types';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. Push Batch Mutations from Client to Central Server
   * Ensures Strict Idempotency & Conflict Resolution (Last-Write-Wins / Version Checks)
   */
  async pushBatch(dto: SyncPushBatchRequest): Promise<SyncPushBatchResponse> {
    const results: SyncPushItemResult[] = [];
    const nowUtc = new Date().toISOString();

    // Verify Tenant / School
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { id: dto.schoolId },
          { schoolCode: dto.schoolId }
        ]
      }
    });

    if (!tenant) {
      this.logger.warn(`Sync push rejected: Tenant ${dto.schoolId} not found`);
      return {
        batchId: dto.batchId,
        processedCount: 0,
        results: dto.items.map(item => ({
          queueId: item.id,
          entityId: item.entityId,
          success: false,
          status: 'REJECTED',
          error: 'School not registered on central server'
        })),
        serverTimeUtc: nowUtc
      };
    }

    // 🛡️ SECURITY: Verify device is not deactivated or revoked
    if (dto.deviceFingerprint) {
      const device = await this.prisma.schoolDevice.findFirst({
        where: {
          tenantId: tenant.id,
          fingerprintHash: dto.deviceFingerprint
        }
      });
      if (device && !device.isActive) {
        this.logger.warn(`Sync push rejected: Device ${dto.deviceFingerprint} is revoked or deactivated`);
        return {
          batchId: dto.batchId,
          processedCount: 0,
          results: dto.items.map(item => ({
            queueId: item.id,
            entityId: item.entityId,
            success: false,
            status: 'REJECTED',
            error: 'This device is deactivated or revoked for this school.'
          })),
          serverTimeUtc: nowUtc
        };
      }
    }

    // Process each mutation in the batch
    for (const item of dto.items) {
      try {
        // Step A: Idempotency Check
        const existingRecord = await this.prisma.centralSyncRecord.findUnique({
          where: { idempotencyKey: item.idempotencyKey }
        });

        if (existingRecord) {
          // Already processed, return idempotent success
          results.push({
            queueId: item.id,
            entityId: item.entityId,
            success: true,
            status: 'ACCEPTED',
            serverVersion: existingRecord.version
          });
          continue;
        }

        // Step B: Conflict Resolution Check
        const latestEntityRecord = await this.prisma.centralSyncRecord.findFirst({
          where: {
            tenantId: tenant.id,
            entityType: item.entityType,
            entityId: item.entityId
          },
          orderBy: { version: 'desc' }
        });

        if (latestEntityRecord && latestEntityRecord.version > item.version) {
          // Server version is strictly higher -> Conflict Resolved (Server Authoritative)
          results.push({
            queueId: item.id,
            entityId: item.entityId,
            success: true,
            status: 'CONFLICT_RESOLVED',
            serverVersion: latestEntityRecord.version,
            error: 'Server version is newer. Local mutation superseded.'
          });
          continue;
        }

        // Step C: Persist mutation to CentralSyncRecord
        await this.prisma.centralSyncRecord.create({
          data: {
            tenantId: tenant.id,
            entityType: item.entityType,
            entityId: item.entityId,
            action: item.action,
            payload: typeof item.payload === 'object' ? item.payload : JSON.parse(item.payload || '{}'),
            version: item.version,
            idempotencyKey: item.idempotencyKey,
            deviceFingerprint: dto.deviceFingerprint
          }
        });

        // Step D: Record Central Audit Log
        await this.prisma.centralAuditLog.create({
          data: {
            tenantId: tenant.id,
            action: 'DATA_SYNC_BATCH',
            details: {
              entityType: item.entityType,
              entityId: item.entityId,
              action: item.action,
              version: item.version
            },
            deviceFingerprint: dto.deviceFingerprint,
            ipAddress: '127.0.0.1'
          }
        });

        results.push({
          queueId: item.id,
          entityId: item.entityId,
          success: true,
          status: 'ACCEPTED',
          serverVersion: item.version
        });

      } catch (itemErr: any) {
        this.logger.error(`Error syncing item ${item.entityId}: ${itemErr.message}`);
        results.push({
          queueId: item.id,
          entityId: item.entityId,
          success: false,
          status: 'REJECTED',
          error: itemErr.message
        });
      }
    }

    return {
      batchId: dto.batchId,
      processedCount: results.filter(r => r.success).length,
      results,
      serverTimeUtc: nowUtc
    };
  }

  /**
   * 2. Pull Changes from Central Server to Client
   * Delivers remote updates that happened since client's last sync timestamp
   */
  async pullChanges(dto: SyncPullRequest): Promise<SyncPullResponse> {
    const nowUtc = new Date().toISOString();

    const tenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { id: dto.schoolId },
          { schoolCode: dto.schoolId }
        ]
      }
    });

    if (!tenant) {
      return {
        changes: [],
        serverTimeUtc: nowUtc,
        hasMore: false
      };
    }

    // 🛡️ SECURITY: Verify device is not deactivated or revoked
    if (dto.deviceFingerprint) {
      const device = await this.prisma.schoolDevice.findFirst({
        where: {
          tenantId: tenant.id,
          fingerprintHash: dto.deviceFingerprint
        }
      });
      if (device && !device.isActive) {
        this.logger.warn(`Sync pull rejected: Device ${dto.deviceFingerprint} is deactivated`);
        return { changes: [], serverTimeUtc: nowUtc, hasMore: false };
      }
    }

    const whereClause: any = {
      tenantId: tenant.id,
    };

    if (dto.sinceServerTimestampUtc) {
      whereClause.createdAt = {
        gt: new Date(dto.sinceServerTimestampUtc)
      };
    }

    if (dto.deviceFingerprint) {
      whereClause.NOT = {
        deviceFingerprint: dto.deviceFingerprint
      };
    }

    if (dto.entityTypes && dto.entityTypes.length > 0) {
      whereClause.entityType = {
        in: dto.entityTypes
      };
    }

    const records = await this.prisma.centralSyncRecord.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      take: 200 // Max 200 items per pull batch
    });

    const changes = records.map(r => ({
      entityType: r.entityType as SyncEntityType,
      entityId: r.entityId,
      action: r.action as SyncAction,
      data: r.payload,
      version: r.version,
      updatedAt: r.createdAt.toISOString()
    }));

    return {
      changes,
      serverTimeUtc: nowUtc,
      hasMore: records.length === 200
    };
  }
}
