import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VbbService } from './vbb/vbb.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly vbbService: VbbService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getHello(): { message: string; timestamp: string } {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Detailed health check' })
  @ApiResponse({ status: 200, description: 'Health status' })
  getHealth(): { status: string; uptime: number } {
    return this.appService.getHealth();
  }

  @Get('departures')
  @ApiOperation({ summary: 'Get departures (top-level)' })
  getDepartures() {
    return this.vbbService.getDepartures();
  }
}
