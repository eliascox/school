import { 
  Controller, 
  Post, 
  Get,
  Body, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { UpdatesService } from './updates.service';
import { CheckUpdateDto } from './dto/check-update.dto';
import { PublishReleaseDto } from './dto/publish-release.dto';

@Controller('api/v1/updates')
export class UpdatesController {
  constructor(private readonly updatesService: UpdatesService) {}

  @Post('check')
  @HttpCode(HttpStatus.OK)
  async checkUpdate(@Body() dto: CheckUpdateDto) {
    return this.updatesService.checkUpdate(dto);
  }

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
