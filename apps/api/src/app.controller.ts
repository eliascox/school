import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import type { Response } from 'express';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/v1/health')
  async getHealth(@Res() res: Response) {
    let dbStatus = 'connected';
    let isHealthy = true;

    try {
      // Quick ping to database
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'disconnected';
      isHealthy = false;
    }

    const healthData = {
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'schoolpro-central-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
      },
      memory: {
        rssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(process.memoryUsage().heapTotal / (1024 * 1024)),
      },
    };

    return res.status(isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json(healthData);
  }

  @Get('api/v1/metrics')
  getMetrics() {
    const mem = process.memoryUsage();
    return {
      node_uptime_seconds: Math.floor(process.uptime()),
      node_memory_rss_bytes: mem.rss,
      node_memory_heap_used_bytes: mem.heapUsed,
      node_memory_heap_total_bytes: mem.heapTotal,
      process_cpu_usage: process.cpuUsage(),
      active_handles: (process as any)._getActiveHandles ? (process as any)._getActiveHandles().length : 0,
    };
  }
}

