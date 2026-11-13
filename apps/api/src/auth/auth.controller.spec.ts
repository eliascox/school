import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: {
    login: jest.Mock;
    register: jest.Mock;
  };

  beforeEach(async () => {
    authServiceMock = {
      login: jest.fn().mockResolvedValue({ access_token: 'tok', user: { id: '1' } }),
      register: jest.fn().mockResolvedValue({ id: '1', email: 'a@b.com' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return req.user from getProfile', () => {
    const req = { user: { id: 'u1', role: 'SUPER_ADMIN' } };
    expect(controller.getProfile(req)).toEqual(req.user);
  });
});
