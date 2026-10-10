import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const RATE_LIMIT_KEY = 'sms_rate_limit';
export interface RateLimitOptions {
  limit: number;      // Maximum requests allowed in the window
  windowMs: number;   // Sliding window in milliseconds (default 60s)
}

export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);

interface ClientRecord {
  timestamps: number[];
}

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private static readonly clients = new Map<string, ClientRecord>();
  private static cleanupTimer: NodeJS.Timeout | null = null;

  constructor(private reflector?: Reflector) {
    if (!RateLimiterGuard.cleanupTimer) {
      // Periodic garbage collector every 2 minutes for expired records
      RateLimiterGuard.cleanupTimer = setInterval(() => {
        const now = Date.now();
        for (const [key, record] of RateLimiterGuard.clients.entries()) {
          record.timestamps = record.timestamps.filter((t) => now - t < 120000);
          if (record.timestamps.length === 0) {
            RateLimiterGuard.clients.delete(key);
          }
        }
      }, 120000);
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    // Determine custom options or fall back to defaults (60 req / 60 sec)
    const options = this.reflector
      ? this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
          context.getHandler(),
          context.getClass(),
        ]) || { limit: 120, windowMs: 60000 }
      : { limit: 120, windowMs: 60000 };

    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const fingerprint = req.headers['x-device-fingerprint'] || '';
    const key = `${ip}:${fingerprint}:${req.baseUrl || req.path}`;

    const now = Date.now();
    let record = RateLimiterGuard.clients.get(key);
    if (!record) {
      record = { timestamps: [] };
      RateLimiterGuard.clients.set(key, record);
    }

    // Filter out timestamps outside window
    record.timestamps = record.timestamps.filter((t) => now - t < options.windowMs);

    if (record.timestamps.length >= options.limit) {
      const oldestInWindow = record.timestamps[0];
      const retryAfterSeconds = Math.ceil((options.windowMs - (now - oldestInWindow)) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds.toString());
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'অনুরোধের সীমা অতিক্রম করেছে। অনুগ্রহ করে কিছুক্ষণ পর পুনরায় চেষ্টা করুন। (Rate limit exceeded)',
          retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.timestamps.push(now);
    res.setHeader('X-RateLimit-Limit', options.limit.toString());
    res.setHeader('X-RateLimit-Remaining', (options.limit - record.timestamps.length).toString());

    return true;
  }
}
