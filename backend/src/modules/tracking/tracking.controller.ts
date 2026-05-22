import { Controller, Get, Param, Query } from '@nestjs/common';
import { TrackingService } from './tracking.service';

@Controller('api/tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('summary')
  getSummary() {
    return this.trackingService.getSummary();
  }

  @Get('agents')
  getAgents() {
    return this.trackingService.getLatestAgents();
  }

  @Get('agents/:id/history')
  getAgentHistory(
    @Param('id') agentId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    return this.trackingService.getAgentHistory(agentId, {
      page:
        Number.isFinite(pageNumber) && pageNumber > 0
          ? Math.floor(pageNumber)
          : 1,
      limit:
        Number.isFinite(limitNumber) && limitNumber > 0
          ? Math.floor(limitNumber)
          : 50,
    });
  }
}
