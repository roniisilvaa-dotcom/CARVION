import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('production-orders')
export class ProductionController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.productionOrder.findMany({
      where: { tenantId: 'tenant_bola_master' },
      include: { product: true, steps: true, materialUsage: { include: { material: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
