import { ApiProperty } from '@nestjs/swagger';

export class CreateStaffDto {
  @ApiProperty({ example: 'Rahim Uddin' })
  name!: string;

  @ApiProperty({ example: 'rahim@school.com' })
  email!: string;

  @ApiProperty({ example: 'EMP1001' })
  employeeId!: string;

  @ApiProperty({ example: 'B.Ed, M.Sc' })
  qualification!: string;

  @ApiProperty({ example: 25000 })
  basicSalary!: number;
}

export class ProcessPayrollDto {
  @ApiProperty({ example: 'EMP1001' })
  employeeId!: string;

  @ApiProperty({ example: 'July' })
  month!: string;

  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ example: 2000 })
  bonus?: number;

  @ApiProperty({ example: 500 })
  deductions?: number;
}
