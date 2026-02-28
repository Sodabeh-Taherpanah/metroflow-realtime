import {
  Body,
  Controller,
  Get,
  NotImplementedException,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { SimulatorService } from './simulator.service';

class TestEmitDto {
  @IsOptional()
  @IsString()
  routeId?: string;

  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsNumber()
  seq?: number;
}

@ApiTags('Simulator')
@Controller('api/simulator')
export class SimulatorController {
  constructor(private readonly simulatorService: SimulatorService) {}

  @Get()
  @ApiOperation({ summary: 'Simulator status (stub)' })
  @ApiResponse({ status: 501, description: 'Not Implemented' })
  getStatus() {
    throw new NotImplementedException(
      'Simulator endpoint is not implemented yet.',
    );
  }

  @Post('run')
  @ApiOperation({ summary: 'Run simulator (stub)' })
  @ApiResponse({ status: 501, description: 'Not Implemented' })
  runSimulator() {
    throw new NotImplementedException(
      'Simulator run endpoint is not implemented yet.',
    );
  }

  @Post('test-emit')
  @ApiOperation({ summary: 'Emit one agent.location.update test event' })
  @ApiResponse({
    status: 200,
    description: 'Event emitted to websocket gateway',
  })
  testEmit(@Body() body: TestEmitDto) {
    return this.simulatorService.emitTestUpdate(body);
  }
}
