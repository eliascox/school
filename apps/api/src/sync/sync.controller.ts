import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SyncService } from './sync.service';
import type { 
  SyncPushBatchRequest, 
  SyncPushBatchResponse, 
  SyncPullRequest, 
  SyncPullResponse 
} from '@sms/shared-types';

@Controller('api/v1/sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  @HttpCode(HttpStatus.OK)
  async pushBatch(@Body() dto: SyncPushBatchRequest): Promise<SyncPushBatchResponse> {
    return this.syncService.pushBatch(dto);
  }

  @Post('pull')
  @HttpCode(HttpStatus.OK)
  async pullChanges(@Body() dto: SyncPullRequest): Promise<SyncPullResponse> {
    return this.syncService.pullChanges(dto);
  }
}
