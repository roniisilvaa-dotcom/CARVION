import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'node:path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  app.use(helmet({ contentSecurityPolicy: false }));
  const publicRoot = join(process.cwd(), '..');
  app.useStaticAssets(publicRoot, { index: false });
  const server = app.getHttpAdapter().getInstance();
  server.get(['/CA.RO Sistema Financeiro', '/financeiro'], (_req, res) => {
    res.sendFile(join(publicRoot, 'CA.RO Sistema Financeiro.html'));
  });
  await app.listen(config.get('PORT', 4000));
}

bootstrap();
