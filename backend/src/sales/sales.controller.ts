import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('sales')
export class SalesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.sale.findMany({
      where: { tenantId: 'tenant_bola_master' },
      include: { customer: true, representative: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
