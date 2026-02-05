import { Injectable } from '@nestjs/common';
import { Provider } from '../provider.interface';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

export interface VbbLocation {
  type: string;
  id: string;
  name: string;
  location?: {
    type: string;
    id: string;
    latitude: number;
    longitude: number;
  };
  products?: Record<string, boolean>;
  stationDHID?: string;
}

export interface VbbDeparture {
  tripId: string;
  lineId: string;
  lineName: string;
  direction: string;
  when: string;
  scheduledWhen: string;
  delay?: number;
  platform?: string;
  cancelled?: boolean;
}

@Injectable()
export class VbbService implements Provider {
  private readonly BASE_URL = 'https://v6.vbb.transport.rest';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Search for stations/locations by query
   */
  async searchLocations(
    query: string,
    limit: number = 10,
  ): Promise<VbbLocation[]> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.BASE_URL}/locations`, {
          params: { query, limit },
        }),
      );
      // VBB API returns array directly, not wrapped in locations object
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error searching locations from VBB API:', error);
      throw new Error(`Failed to search locations: ${error.message}`);
    }
  }

  /**
   * Get departures for a specific station
   */
  async fetchDepartures(
    stationId: string,
    duration: number = 60,
  ): Promise<VbbDeparture[]> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.BASE_URL}/stops/${stationId}/departures`, {
          params: { duration },
        }),
      );
      return response.data?.departures || [];
    } catch (error) {
      console.error('Error fetching departures from VBB API:', error);
      throw new Error(`Failed to fetch departures: ${error.message}`);
    }
  }

  /**
   * Get a specific station by ID
   */
  async fetchStation(stationId: string): Promise<VbbLocation | null> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.BASE_URL}/stops/${stationId}`),
      );
      return response.data || null;
    } catch (error) {
      console.error('Error fetching station from VBB API:', error);
      throw new Error(`Failed to fetch station: ${error.message}`);
    }
  }

  /**
   * Get journey/route between two stations
   */
  async fetchJourney(from: string, to: string): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.BASE_URL}/journeys`, {
          params: { from, to },
        }),
      );
      return response.data || null;
    } catch (error) {
      console.error('Error fetching journey from VBB API:', error);
      throw new Error(`Failed to fetch journey: ${error.message}`);
    }
  }

  async fetchData(): Promise<any> {
    // Legacy method - returns API info
    try {
      const response = await lastValueFrom(this.httpService.get(this.BASE_URL));
      return response.data;
    } catch (error) {
      console.error('Error fetching VBB API info:', error);
      throw new Error('Failed to fetch VBB API info');
    }
  }

  normalizeData(data: any): any {
    // Normalize VBB data to internal format
    if (Array.isArray(data)) {
      return data.map((item) => this.normalizeSingleItem(item));
    }
    return this.normalizeSingleItem(data);
  }

  private normalizeSingleItem(item: any): any {
    return {
      id: item.id || item.tripId,
      name: item.name || item.lineName,
      latitude: item.latitude,
      longitude: item.longitude,
      type: item.type,
      provider: 'VBB',
    };
  }
}
