import { HttpService } from '@nestjs/axios';
export interface VbbLocation {
    type: string;
    id: string;
    name: string;
    location?: {
        latitude: number;
        longitude: number;
    };
}
export declare class VbbService {
    private readonly httpService;
    private logger;
    private readonly BASE_URL;
    constructor(httpService: HttpService);
    getStations(query?: string, limit?: number): Promise<VbbLocation[]>;
    getDepartures(stationId?: string, duration?: number): Promise<any>;
}
