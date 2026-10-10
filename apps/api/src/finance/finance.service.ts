import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeeStructureDto, ProcessPaymentDto } from './dto/create-finance.dto';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async createFeeStructure(tenantId: string, dto: CreateFeeStructureDto) {
    return {
      id: `FEE-${Date.now()}`,
      tenantId,
      title: dto.title,
      amount: dto.amount,
      classId: dto.classId,
      createdAt: new Date(),
    };
  }

  async processPayment(tenantId: string, dto: ProcessPaymentDto) {
    if (dto.gateway === 'bKash' || dto.gateway === 'Nagad') {
      if (!dto.transactionId) {
        throw new BadRequestException('Transaction ID is required for mobile banking payments');
      }
    }

    return {
      paymentReceiptId: `RCPT-${Date.now()}`,
      invoiceId: dto.invoiceId,
      amountPaid: dto.amount,
      gateway: dto.gateway,
      transactionId: dto.transactionId || `CASH-${Date.now()}`,
      status: 'SUCCESS',
      paidAt: new Date(),
    };
  }

  async getFinancialReport(tenantId: string) {
    return {
      tenantId,
      totalRevenueThisMonth: 125000,
      totalExpensesThisMonth: 45000,
      netProfit: 80000,
      pendingFeesCount: 14,
      currency: 'BDT',
    };
  }
}
