import { PartialType } from '@nestjs/swagger';
import { CreateNoticeDto } from './create-communication.dto';

export class UpdateNoticeDto extends PartialType(CreateNoticeDto) {}
