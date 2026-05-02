import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.material.findMany({
      where: { tenantId: 'tenant_bola_master' },
      orderBy: { name: 'asc' },
    });
  }
}
