import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateFeeStructureDto, ProcessPaymentDto } from './dto/create-finance.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Finance & Payments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('fee-structure')
  @ApiOperation({ summary: 'Create a fee structure for a class' })
  createFeeStructure(@Request() req: any, @Body() dto: CreateFeeStructureDto) {
    return this.financeService.createFeeStructure(req.user.tenantId, dto);
  }

  @Post('payments/process')
  @ApiOperation({ summary: 'Process fee payment via bKash, Nagad, Stripe or Cash' })
  processPayment(@Request() req: any, @Body() dto: ProcessPaymentDto) {
    return this.financeService.processPayment(req.user.tenantId, dto);
  }

  @Get('report')
  @ApiOperation({ summary: 'Get monthly financial summary report' })
  getFinancialReport(@Request() req: any) {
    return this.financeService.getFinancialReport(req.user.tenantId);
  }
}
