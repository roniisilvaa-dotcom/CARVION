import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('industrial')
  async industrial() {
    const tenantId = 'tenant_bola_master';
    const [orders, materials, sales, reps] = await Promise.all([
      this.prisma.productionOrder.findMany({ where: { tenantId }, include: { product: true }, take: 20 }),
      this.prisma.material.findMany({ where: { tenantId }, take: 20 }),
      this.prisma.sale.findMany({ where: { tenantId }, include: { customer: true, representative: true }, take: 20 }),
      this.prisma.representative.findMany({ where: { tenantId }, take: 20 }),
    ]);
    const realCost = orders.reduce((sum, order) => sum + Number(order.realCost || order.estimatedCost), 0);
    const produced = orders.reduce((sum, order) => sum + order.quantity, 0);
    const revenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    return {
      kpis: {
        produced,
        averageCostPerBall: produced ? realCost / produced : 0,
        revenue,
        grossProfit: revenue - realCost,
        efficiency: 87.6,
      },
      orders,
      materials,
      sales,
      representatives: reps,
      alerts: [
        'Couro sintético abaixo do estoque mínimo.',
        'Desperdício em costura acima de 3,5% na OP-7718.',
        'Representante Centro-Oeste abaixo de 75% da meta mensal.',
      ],
    };
  }
}
