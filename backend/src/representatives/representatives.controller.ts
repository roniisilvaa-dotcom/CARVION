import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('representatives')
export class RepresentativesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.representative.findMany({
      where: { tenantId: 'tenant_bola_master' },
      include: { sales: true },
      orderBy: { region: 'asc' },
    });
  }
}
