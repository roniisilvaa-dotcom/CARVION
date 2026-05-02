import { Body, Controller, Get, Post } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

const TENANT_ID = 'carvion_financeiro';
const DATA_KEY = 'financeiro_local_data';

type SyncPayload = {
  version?: string;
  updatedAt?: string;
  clients?: unknown[];
  suppliers?: unknown[];
  products?: unknown[];
  fixedExpenses?: unknown[];
  settings?: Record<string, unknown>;
  notes?: unknown[];
};

@Controller('sync')
export class SyncController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('financeiro')
  async getFinanceiro() {
    const row = await this.prisma.appSyncData.findUnique({
      where: { tenantId_key: { tenantId: TENANT_ID, key: DATA_KEY } },
    });
    return {
      ok: true,
      data: row?.payload ?? {},
      updatedAt: row?.updatedAt ?? null,
    };
  }

  @Post('financeiro')
  async saveFinanceiro(@Body() payload: SyncPayload) {
    const data = {
      ...payload,
      updatedAt: new Date().toISOString(),
    } as Prisma.InputJsonObject;
    const row = await this.prisma.appSyncData.upsert({
      where: { tenantId_key: { tenantId: TENANT_ID, key: DATA_KEY } },
      update: { payload: data },
      create: { tenantId: TENANT_ID, key: DATA_KEY, payload: data },
    });
    return {
      ok: true,
      data: row.payload,
      updatedAt: row.updatedAt,
    };
  }
}
