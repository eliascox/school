import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let prismaService: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prismaService = {
      $queryRaw: jest.fn().mockResolvedValue([1]),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });

    it('should report healthy status when database query succeeds', async () => {
      const json = jest.fn();
      const status = jest.fn().mockReturnValue({ json });
      await appController.getHealth({ status } as any);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          database: { status: 'connected' },
        }),
      );
    });

    it('should expose process metrics', () => {
      const metrics = appController.getMetrics();
      expect(metrics).toHaveProperty('node_uptime_seconds');
      expect(metrics).toHaveProperty('node_memory_rss_bytes');
    });
  });
});
