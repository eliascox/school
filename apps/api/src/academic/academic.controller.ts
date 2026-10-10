import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AcademicService } from './academic.service';
import { CreateClassDto, CreateSectionDto, CreateSubjectDto } from './dto/create-academic.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Academic')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  // --- CLASSES ---
  @Post('classes')
  @ApiOperation({ summary: 'Create a new class' })
  createClass(@Request() req: any, @Body() dto: CreateClassDto) {
    return this.academicService.createClass(req.user.tenantId, dto);
  }

  @Get('classes')
  @ApiOperation({ summary: 'Get all classes for current school' })
  findAllClasses(@Request() req: any) {
    return this.academicService.findAllClasses(req.user.tenantId);
  }

  @Get('classes/:id')
  @ApiOperation({ summary: 'Get details of a specific class' })
  findOneClass(@Request() req: any, @Param('id') id: string) {
    return this.academicService.findOneClass(req.user.tenantId, id);
  }

  @Delete('classes/:id')
  @ApiOperation({ summary: 'Delete a class' })
  deleteClass(@Request() req: any, @Param('id') id: string) {
    return this.academicService.deleteClass(req.user.tenantId, id);
  }

  // --- SECTIONS ---
  @Post('sections')
  @ApiOperation({ summary: 'Create a new section under a class' })
  createSection(@Body() dto: CreateSectionDto) {
    return this.academicService.createSection(dto);
  }

  @Get('classes/:classId/sections')
  @ApiOperation({ summary: 'Get all sections for a class' })
  findSectionsByClass(@Param('classId') classId: string) {
    return this.academicService.findSectionsByClass(classId);
  }

  // --- SUBJECTS ---
  @Post('subjects')
  @ApiOperation({ summary: 'Create a new subject' })
  createSubject(@Request() req: any, @Body() dto: CreateSubjectDto) {
    return this.academicService.createSubject(req.user.tenantId, dto);
  }

  @Get('subjects')
  @ApiOperation({ summary: 'Get all subjects for current school' })
  findAllSubjects(@Request() req: any) {
    return this.academicService.findAllSubjects(req.user.tenantId);
  }
}
