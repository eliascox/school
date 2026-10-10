import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto, CreateSectionDto, CreateSubjectDto } from './dto/create-academic.dto';

@Injectable()
export class AcademicService {
  constructor(private readonly prisma: PrismaService) {}

  // --- CLASS MANAGEMENT ---
  async createClass(tenantId: string, dto: CreateClassDto) {
    return this.prisma.class.create({
      data: {
        name: dto.name,
        tenantId,
      },
    });
  }

  async findAllClasses(tenantId: string) {
    return this.prisma.class.findMany({
      where: { tenantId },
      include: { sections: true },
    });
  }

  async findOneClass(tenantId: string, id: string) {
    const cls = await this.prisma.class.findFirst({
      where: { id, tenantId },
      include: { sections: true },
    });
    if (!cls) throw new NotFoundException('Class not found');
    return cls;
  }

  async deleteClass(tenantId: string, id: string) {
    await this.findOneClass(tenantId, id);
    return this.prisma.class.delete({ where: { id } });
  }

  // --- SECTION MANAGEMENT ---
  async createSection(dto: CreateSectionDto) {
    return this.prisma.section.create({
      data: {
        name: dto.name,
        classId: dto.classId,
      },
    });
  }

  async findSectionsByClass(classId: string) {
    return this.prisma.section.findMany({
      where: { classId },
    });
  }

  // --- SUBJECT MANAGEMENT ---
  async createSubject(tenantId: string, dto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: {
        name: dto.name,
        code: dto.code,
        tenantId,
      },
    });
  }

  async findAllSubjects(tenantId: string) {
    return this.prisma.subject.findMany({
      where: { tenantId },
    });
  }
}
