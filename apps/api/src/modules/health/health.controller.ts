import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  /** Simple liveness probe — used by Docker HEALTHCHECK */
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse()
  live(): { status: string } {
    return { status: 'ok' };
  }

  /** Readiness probe — checks DB connectivity */
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe (DB check)' })
  ready() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  /** Legacy root — kept for backwards compat */
  @Get()
  @ApiOperation({ summary: 'Root health (legacy)' })
  check(): { status: string } {
    return { status: 'ok' };
  }
}
