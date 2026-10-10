import { PartialType } from '@nestjs/swagger';
import { CreateStaffDto } from './create-hr.dto';

export class UpdateStaffDto extends PartialType(CreateStaffDto) {}
