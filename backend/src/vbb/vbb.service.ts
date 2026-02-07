import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

export interface VbbLocation {
  type: string;
  id: string;
  name: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

@Injectable()
export class VbbService {
  private logger = new Logger('VbbService');
  private readonly BASE_URL = 'https://v6.vbb.transport.rest';

  constructor(private readonly httpService: HttpService) {
    this.logger.log('VbbService initialized');
  }

  async getStations(
    query: string = 'Berlin',
    limit: number = 10,
  ): Promise<VbbLocation[]> {
    this.logger.log(`Fetching stations: query=${query}, limit=${limit}`);
    const response = await lastValueFrom(
      this.httpService.get(`${this.BASE_URL}/locations`, {
        params: { query, limit },
      }),
    );
    const result = Array.isArray(response.data) ? response.data : [];
    this.logger.log(`Got ${result.length} stations from VBB API`);
    return result;
  }

  async getDepartures(stationId: string = '900029305', duration: number = 60) {
    this.logger.log(
      `Fetching departures: stationId=${stationId}, duration=${duration}`,
    );
    const response = await lastValueFrom(
      this.httpService.get(`${this.BASE_URL}/stops/${stationId}/departures`, {
        params: { duration },
      }),
    );
    const result = response.data?.departures || [];
    this.logger.log(`Got ${result.length} departures`);
    return result;
  }
}
