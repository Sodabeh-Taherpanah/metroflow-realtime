import { Station } from '../../entities/station.entity';
import { Repository } from 'typeorm';
export declare class StationsService {
    private readonly stationRepository;
    constructor(stationRepository: Repository<Station>);
    getAllStations(): Promise<Station[]>;
    getStationById(id: string): Promise<Station | null>;
    createStation(station: Partial<Station>): Promise<Station>;
}
