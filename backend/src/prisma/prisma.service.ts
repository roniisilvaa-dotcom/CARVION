import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      await this.ensureSyncTable();
    } catch (err) {
      console.error('CARVION Neon unavailable on boot:', err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect().catch(() => undefined);
  }

  private async ensureSyncTable() {
    await this.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AppSyncData" (
        "id" TEXT PRIMARY KEY,
        "tenantId" TEXT NOT NULL,
        "key" TEXT NOT NULL,
        "payload" JSONB NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await this.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "AppSyncData_tenantId_key_key"
      ON "AppSyncData" ("tenantId", "key")
    `);
    await this.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AppSyncData_tenantId_updatedAt_idx"
      ON "AppSyncData" ("tenantId", "updatedAt")
    `);
  }
}
