import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'node:path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const publicRoot = join(process.cwd(), '..');
  const server = app.getHttpAdapter().getInstance();
  server.use((req, res, next) => {
    const pathname = decodeURIComponent(req.path || '');
    if (pathname === '/CA.RO Sistema Financeiro' || pathname === '/financeiro') {
      return res.sendFile(join(publicRoot, 'CA.RO Sistema Financeiro.html'));
    }
    return next();
  });
  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  app.use(helmet({ contentSecurityPolicy: false }));
  app.useStaticAssets(publicRoot, { index: false });
  await app.listen(config.get('PORT', 4000));
}

bootstrap();
