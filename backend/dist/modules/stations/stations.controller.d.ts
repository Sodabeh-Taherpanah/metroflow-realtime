import { StationsService } from './stations.service';
import { Station } from '@/entities/station.entity';
export declare class StationsController {
    private readonly stationsService;
    constructor(stationsService: StationsService);
    getAllStations(): Promise<Station[]>;
    getStationById(id: string): Promise<Station>;
    createStation(station: any): Promise<Station>;
}
