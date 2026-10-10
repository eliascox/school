import { 
  Controller, 
  Post, 
  Body, 
  Req, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { LicenseService } from './license.service';
import { HeartbeatDto } from './dto/heartbeat.dto';
import type { Request } from 'express';

@Controller('api/v1/license')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  /**
   * Periodic Desktop Client Heartbeat & Remote Lockup Watchdog
   */
  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  async heartbeat(@Body() dto: HeartbeatDto, @Req() req: Request) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    return this.licenseService.processHeartbeat(dto, ipAddress);
  }
}
