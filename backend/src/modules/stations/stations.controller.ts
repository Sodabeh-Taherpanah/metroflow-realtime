import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StationsService } from './stations.service';
import { Station } from '@/entities/station.entity';

@ApiTags('Stations')
@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all stations' })
  getAllStations(): Promise<Station[]> {
    return this.stationsService.getAllStations() as Promise<Station[]>;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get station by ID' })
  getStationById(@Param('id') id: string): Promise<Station> {
    return this.stationsService.getStationById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new station' })
  createStation(@Body() station: any): Promise<Station> {
    return this.stationsService.createStation(station);
  }
}
