import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto, ProcessPayrollDto } from './dto/create-hr.dto';
import { Role } from '@prisma/client';

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  async createStaff(tenantId: string, dto: CreateStaffDto) {
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash: 'defaultPasswordHash123',
        role: Role.TEACHER,
        tenantId,
      },
    });

    const teacherProfile = await this.prisma.teacherProfile.create({
      data: {
        userId: user.id,
        employeeId: dto.employeeId,
        qualification: dto.qualification,
      },
    });

    return { user, teacherProfile, basicSalary: dto.basicSalary };
  }

  async findAllStaff(tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        role: { in: [Role.TEACHER, Role.HR, Role.ACCOUNTANT] },
      },
      include: {
        teacherProfile: true,
      },
    });
  }

  async processPayroll(tenantId: string, dto: ProcessPayrollDto) {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { employeeId: dto.employeeId },
      include: { user: true },
    });

    if (!teacher || teacher.user.tenantId !== tenantId) {
      throw new NotFoundException('Staff member not found');
    }

    const bonus = dto.bonus || 0;
    const deductions = dto.deductions || 0;
    const baseSalary = 25000;
    const netSalary = baseSalary + bonus - deductions;

    return {
      payrollId: `PAY-${Date.now()}`,
      employeeId: dto.employeeId,
      employeeName: teacher.user.name,
      month: dto.month,
      year: dto.year,
      baseSalary,
      bonus,
      deductions,
      netSalary,
      status: 'PAID',
      processedAt: new Date(),
    };
  }
}
