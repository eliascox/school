import { ApiProperty } from '@nestjs/swagger';

export class CreateNoticeDto {
  @ApiProperty({ example: 'School Closed on Sunday' })
  title!: string;

  @ApiProperty({ example: 'Due to national holiday, school will remain closed.' })
  content!: string;

  @ApiProperty({ example: 'ALL', enum: ['ALL', 'STUDENTS', 'TEACHERS', 'PARENTS'] })
  targetAudience!: string;
}

export class SendSmsDto {
  @ApiProperty({ example: ['+8801700000000', '+8801800000000'] })
  phoneNumbers!: string[];

  @ApiProperty({ example: 'Dear Parent, fee payment reminder for July.' })
  message!: string;
}

export class SendPushNotificationDto {
  @ApiProperty({ example: 'EXPO_PUSH_TOKEN_HERE' })
  targetDeviceToken!: string;

  @ApiProperty({ example: 'Exam Schedule Published' })
  title!: string;

  @ApiProperty({ example: 'Please check your portal for term exam timetable.' })
  body!: string;
}
