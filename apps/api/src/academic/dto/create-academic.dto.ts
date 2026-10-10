import { ApiProperty } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({ example: 'Class 10' })
  name!: string;
}

export class CreateSectionDto {
  @ApiProperty({ example: 'Section A' })
  name!: string;

  @ApiProperty({ example: 'class-uuid-here' })
  classId!: string;
}

export class CreateSubjectDto {
  @ApiProperty({ example: 'Mathematics' })
  name!: string;

  @ApiProperty({ example: 'MATH101' })
  code!: string;
}
