import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: {
    user: { findUnique: jest.Mock; create: jest.Mock };
    tenant: { create: jest.Mock };
  };
  let jwtMock: { sign: jest.Mock };

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      tenant: {
        create: jest.fn(),
      },
    };
    jwtMock = {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw UnauthorizedException when credentials are invalid', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'nobody@school.edu', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should return access_token and sanitized user on valid login', async () => {
    const passwordHash = await bcrypt.hash('secret123', 4);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u-1',
      email: 'admin@school.edu',
      name: 'Head Teacher',
      role: 'SUPER_ADMIN',
      tenantId: 't-1',
      passwordHash,
    });

    const res = await service.login({
      email: 'admin@school.edu',
      password: 'secret123',
    });

    expect(res.access_token).toBe('mock.jwt.token');
    expect(res.user).toEqual({
      id: 'u-1',
      email: 'admin@school.edu',
      name: 'Head Teacher',
      role: 'SUPER_ADMIN',
      tenantId: 't-1',
    });
  });
});
