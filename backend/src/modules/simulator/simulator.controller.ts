import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsOptional, IsString } from 'class-validator';
import { SimulatorService } from './simulator.service';

class TestEmitDto {
  @IsOptional()
  @IsString()
  routeId?: string;

  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @IsString()
  lat?: string;

  @IsOptional()
  @IsString()
  lng?: string;

  @IsOptional()
  @IsString()
  speed?: string;

  @IsOptional()
  @IsString()
  seq?: string;
}

class StartSimulatorDto {
  @IsString()
  routeId!: string;

  @IsOptional()
  @IsString()
  intervalMs?: string;

  @IsOptional()
  @IsString()
  loop?: string;

  @IsOptional()
  @IsString()
  agents?: string;

  @IsOptional()
  @IsString()
  jitterMeters?: string;

  @IsOptional()
  @IsString()
  speedKph?: string;
}

@ApiTags('Simulator')
@Controller('api/simulator')
export class SimulatorController {
  constructor(private readonly simulatorService: SimulatorService) {}

  @Get()
  @ApiOperation({ summary: 'List simulator jobs' })
  @ApiResponse({ status: 200, description: 'Simulation job list' })
  getStatus() {
    return {
      jobs: this.simulatorService.listSimulationJobs(),
    };
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Get simulator job status' })
  @ApiResponse({ status: 200, description: 'Simulation job payload' })
  getJob(@Param('jobId') jobId: string) {
    return this.simulatorService.getSimulationJob(jobId);
  }

  @Post('start')
  @Throttle({ default: { limit: 10, ttl: 60 } })
  @ApiOperation({ summary: 'Start simulator replay run' })
  @ApiResponse({ status: 201, description: 'Simulation started' })
  start(@Body() body: StartSimulatorDto) {
    const intervalMs = this.parsePositiveNumber(body.intervalMs, 'intervalMs');
    const agents = this.parsePositiveNumber(body.agents, 'agents');
    const jitterMeters = this.parseNonNegativeNumber(
      body.jitterMeters,
      'jitterMeters',
    );
    const speedKph = this.parsePositiveNumber(body.speedKph, 'speedKph');

    let loop: boolean | undefined;
    if (body.loop !== undefined) {
      const value = body.loop.trim().toLowerCase();
      if (value === 'true' || value === '1') {
        loop = true;
      } else if (value === 'false' || value === '0') {
        loop = false;
      } else {
        throw new BadRequestException('loop must be true/false.');
      }
    }

    return this.simulatorService.startSimulation({
      routeId: body.routeId,
      intervalMs,
      loop,
      agents,
      jitterMeters,
      speedKph,
    });
  }

  @Post('test-emit')
  @Throttle({ default: { limit: 30, ttl: 60 } })
  @ApiOperation({ summary: 'Emit one agent.location.update test event' })
  @ApiResponse({
    status: 200,
    description: 'Event emitted to websocket gateway',
  })
  testEmit(@Body() body: TestEmitDto) {
    return this.simulatorService.emitTestUpdate({
      routeId: body.routeId,
      agentId: body.agentId,
      lat: body.lat !== undefined ? Number(body.lat) : undefined,
      lng: body.lng !== undefined ? Number(body.lng) : undefined,
      speed: body.speed !== undefined ? Number(body.speed) : undefined,
      seq: body.seq !== undefined ? Number(body.seq) : undefined,
    });
  }

  private parsePositiveNumber(
    raw: string | undefined,
    field: string,
  ): number | undefined {
    if (raw === undefined) {
      return undefined;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException(`${field} must be a positive number.`);
    }
    return value;
  }

  private parseNonNegativeNumber(
    raw: string | undefined,
    field: string,
  ): number | undefined {
    if (raw === undefined) {
      return undefined;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      throw new BadRequestException(`${field} must be a non-negative number.`);
    }
    return value;
  }
}
