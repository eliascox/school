import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Req, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { RegisterSchoolDto } from './dto/register-school.dto';
import type { Request } from 'express';

@Controller('api/v1/schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  /**
   * Public: School Registration from Desktop Client
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerSchool(@Body() dto: RegisterSchoolDto, @Req() req: Request) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    return this.schoolsService.registerSchool(dto, ipAddress);
  }

  /**
   * Public: Check Registration Status / Fetch License Key
   */
  @Get('status/:schoolCode')
  async getSchoolStatus(@Param('schoolCode') schoolCode: string) {
    return this.schoolsService.getSchoolStatus(schoolCode);
  }
}
