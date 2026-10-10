import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Req 
} from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { ApprovalActionDto } from './dto/approval-action.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, SchoolStatus } from '@prisma/client';
import type { Request } from 'express';

@Controller('api/v1/admin/schools')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminSchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  /**
   * Super Admin: List Schools with Filter & Search
   */
  @Get()
  async findAll(
    @Query('status') status?: SchoolStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.schoolsService.findAll(status, search, pageNum, limitNum);
  }

  /**
   * Super Admin: Get Full School Details
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.schoolsService.findOne(id);
  }

  /**
   * Super Admin: Execute Lifecycle Action (APPROVE, REJECT, SUSPEND, REACTIVATE, DEACTIVATE)
   */
  @Post(':id/action')
  async executeAction(
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
    @Req() req: Request
  ) {
    const adminUser = (req as any).user;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    return this.schoolsService.handleApprovalAction(id, dto, adminUser, ipAddress);
  }
}
