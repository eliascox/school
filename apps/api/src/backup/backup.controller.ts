import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BackupService, CloudBackupItem } from './backup.service';

export class RegisterBackupDto {
  schoolCode!: string;
  fileName!: string;
  sizeBytes!: number;
  sha256!: string;
  recordCounts!: any;
}

@ApiTags('Disaster Recovery Backups')
@Controller('api/v1/backups')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register encrypted backup in Central Cloud Vault' })
  async registerBackup(
    @Body() dto: RegisterBackupDto,
    @Headers('x-device-fingerprint') deviceFingerprint?: string,
  ): Promise<CloudBackupItem> {
    if (!dto.schoolCode || !dto.fileName) {
      throw new BadRequestException('স্কুল কোড এবং ফাইলের নাম আবশ্যক।');
    }
    return this.backupService.registerBackup(dto.schoolCode, {
      fileName: dto.fileName,
      sizeBytes: dto.sizeBytes,
      sha256: dto.sha256,
      recordCounts: dto.recordCounts,
      deviceFingerprint,
    });
  }

  @Get('list')
  @ApiOperation({ summary: 'List cloud disaster recovery backups for school' })
  async listBackups(
    @Query('schoolCode') schoolCode: string,
    @Headers('x-school-code') headerSchoolCode?: string,
  ): Promise<CloudBackupItem[]> {
    const code = schoolCode || headerSchoolCode;
    if (!code) {
      throw new BadRequestException('স্কুল কোড উল্লেখ করা আবশ্যক।');
    }
    return this.backupService.listBackups(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get backup detail from Central Cloud Vault' })
  async getBackup(
    @Param('id') id: string,
    @Query('schoolCode') schoolCode: string,
    @Headers('x-school-code') headerSchoolCode?: string,
  ): Promise<CloudBackupItem> {
    const code = schoolCode || headerSchoolCode;
    if (!code) {
      throw new BadRequestException('স্কুল কোড উল্লেখ করা আবশ্যক।');
    }
    return this.backupService.getBackup(code, id);
  }
}
