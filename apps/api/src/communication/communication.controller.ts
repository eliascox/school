import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { CreateNoticeDto, SendSmsDto, SendPushNotificationDto } from './dto/create-communication.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Communication')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('communication')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Post('notices')
  @ApiOperation({ summary: 'Create a new notice on the Notice Board' })
  createNotice(@Request() req: any, @Body() dto: CreateNoticeDto) {
    return this.communicationService.createNotice(req.user.tenantId, dto);
  }

  @Get('notices')
  @ApiOperation({ summary: 'Get all active notices for current school' })
  getNotices(@Request() req: any) {
    return this.communicationService.getNotices(req.user.tenantId);
  }

  @Post('sms/send')
  @ApiOperation({ summary: 'Send SMS via SMS Gateway' })
  sendSms(@Request() req: any, @Body() dto: SendSmsDto) {
    return this.communicationService.sendBulkSms(req.user.tenantId, dto);
  }

  @Post('push-notifications/send')
  @ApiOperation({ summary: 'Send Push Notification to mobile devices' })
  sendPushNotification(@Request() req: any, @Body() dto: SendPushNotificationDto) {
    return this.communicationService.sendPushNotification(req.user.tenantId, dto);
  }
}
