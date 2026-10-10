import { 
  Controller, 
  Post, 
  Get,
  Body, 
  HttpCode, 
  HttpStatus,
  UseGuards
} from '@nestjs/common';
import { UpdatesService } from './updates.service';
import { CheckUpdateDto } from './dto/check-update.dto';
import { PublishReleaseDto } from './dto/publish-release.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Updates')
@Controller('api/v1/updates')
export class UpdatesController {
  constructor(private readonly updatesService: UpdatesService) {}

  @Post('check')
  @HttpCode(HttpStatus.OK)
  async checkUpdate(@Body() dto: CheckUpdateDto) {
    return this.updatesService.checkUpdate(dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @Post('publish')
  @HttpCode(HttpStatus.CREATED)
  async publishRelease(@Body() dto: PublishReleaseDto) {
    return this.updatesService.publishRelease(dto);
  }

  @Get('releases')
  async listReleases() {
    return this.updatesService.listReleases();
  }
}
