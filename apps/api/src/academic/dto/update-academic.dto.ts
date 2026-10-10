import { PartialType } from '@nestjs/swagger';
import { CreateClassDto } from './create-academic.dto';

export class UpdateClassDto extends PartialType(CreateClassDto) {}
