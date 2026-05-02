import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsController } from './analytics/analytics.controller.js';
import { AppService } from './app.service.js';
import { MaterialsController } from './materials/materials.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductionController } from './production/production.controller.js';
import { RepresentativesController } from './representatives/representatives.controller.js';
import { SalesController } from './sales/sales.controller.js';
import { SyncController } from './sync/sync.controller.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
  controllers: [AnalyticsController, ProductionController, MaterialsController, SalesController, RepresentativesController, SyncController],
  providers: [AppService],
})
export class AppModule {}
