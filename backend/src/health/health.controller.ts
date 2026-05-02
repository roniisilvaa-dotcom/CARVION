import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('healthz')
  healthz() {
    return { ok: true, service: 'CARVION', at: new Date().toISOString() };
  }
}
