import { Provider } from '../provider.interface';
import { HttpService } from '@nestjs/axios';
interface VbbLocation {
    id: string;
    name: string;
    latitude?: number;
    longitude?: number;
    type?: string;
}
interface VbbDeparture {
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
export declare class VbbService implements Provider {
    private readonly httpService;
    private readonly BASE_URL;
    constructor(httpService: HttpService);
    searchLocations(query: string, limit?: number): Promise<VbbLocation[]>;
    fetchDepartures(stationId: string, duration?: number): Promise<VbbDeparture[]>;
    fetchStation(stationId: string): Promise<VbbLocation | null>;
    fetchJourney(from: string, to: string): Promise<any>;
    fetchData(): Promise<any>;
    normalizeData(data: any): any;
    private normalizeSingleItem;
}
export {};
