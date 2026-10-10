import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { RateLimiterGuard } from './common/guards/rate-limiter.guard';
import { json, urlencoded, Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Enterprise Security Headers Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' *;",
    );
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // 2. Strict CORS Configuration
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Electron desktop shell, curl, server-to-server)
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      // Allow localhost on any port for local development and desktop webview
      if (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS request blocked by Central API security policy'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-device-fingerprint', 'x-school-code'],
    credentials: true,
  });

  // 3. Request Payload Size Limits (10MB for batch sync & update payloads)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  // 4. Global Security Guards & Exception Filtering
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new RateLimiterGuard(reflector));
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // 5. OpenAPI / Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('SchoolPro Central Cloud API')
    .setDescription('Enterprise School Management Central Authority & Sync API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  // Validate critical security secrets in production
  if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'super-secret')) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable must be set to a secure secret in production.');
  }

  // Default Central API port is 4000 to prevent collision with web frontend on 3000
  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`[SchoolPro Central API] Running securely on port ${port}`);
}
bootstrap();
