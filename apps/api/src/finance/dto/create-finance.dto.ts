import { ApiProperty } from '@nestjs/swagger';

export class CreateFeeStructureDto {
  @ApiProperty({ example: 'Tuition Fee - Monthly' })
  title!: string;

  @ApiProperty({ example: 1500 })
  amount!: number;

  @ApiProperty({ example: 'class-uuid-here' })
  classId!: string;
}

export class ProcessPaymentDto {
  @ApiProperty({ example: 'INV-100203' })
  invoiceId!: string;

  @ApiProperty({ example: 1500 })
  amount!: number;

  @ApiProperty({ example: 'bKash', enum: ['bKash', 'Nagad', 'Stripe', 'SSLCommerz', 'Cash'] })
  gateway!: string;

  @ApiProperty({ example: '8X9201L02' })
  transactionId?: string;
}
