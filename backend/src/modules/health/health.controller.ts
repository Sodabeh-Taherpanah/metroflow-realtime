import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private dbIndicator: TypeOrmHealthIndicator,
  ) {}

  @Get('liveness')
  liveness() {
    return { status: 'ok' };
  }

  @Get('readiness')
  @HealthCheck()
  readiness() {
    // Attempt a DB check if TypeORM indicator available
    try {
      return this.health.check([() => this.dbIndicator.pingCheck('database')]);
    } catch (err) {
      return { status: 'ok', detail: 'db-check-skipped' };
    }
  }
}
