import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { HrService } from './hr.service';
import { CreateStaffDto, ProcessPayrollDto } from './dto/create-hr.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('HR & Payroll')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Post('staff')
  @ApiOperation({ summary: 'Add a new teacher/staff member' })
  createStaff(@Request() req: any, @Body() dto: CreateStaffDto) {
    return this.hrService.createStaff(req.user.tenantId, dto);
  }

  @Get('staff')
  @ApiOperation({ summary: 'Get all staff members' })
  findAllStaff(@Request() req: any) {
    return this.hrService.findAllStaff(req.user.tenantId);
  }

  @Post('payroll/process')
  @ApiOperation({ summary: 'Process monthly payroll for staff' })
  processPayroll(@Request() req: any, @Body() dto: ProcessPayrollDto) {
    return this.hrService.processPayroll(req.user.tenantId, dto);
  }
}
