import { PartialType } from '@nestjs/swagger';
import { CreateFeeStructureDto } from './create-finance.dto';

export class UpdateFeeStructureDto extends PartialType(CreateFeeStructureDto) {}
