import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && await bcrypt.compare(pass, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { email: user.email, sub: user.id, role: user.role, tenantId: user.tenantId };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    // For this example, we assume they are joining an existing tenant or creating one.
    // In a real multi-tenant app, registration logic handles tenant creation vs joining.
    // Here we'll just create a tenant for them if they are an ADMIN, or assign them to a default one.

    const schoolCode = `SCH-${Date.now().toString().slice(-6)}`;
    const tenant = await this.prisma.tenant.create({
      data: {
        name: registerDto.tenantName || 'Default School',
        schoolCode,
        contactPhone: '01800000000',
      },
    });

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        name: registerDto.name,
        passwordHash: hashedPassword,
        role: Role.SUPER_ADMIN,
        tenantId: tenant.id,
      },
    });

    const { passwordHash, ...result } = user;
    return result;
  }
}
