import { VbbService, VbbLocation } from './vbb.service';
export declare class VbbController {
    private readonly vbbService;
    constructor(vbbService: VbbService);
    getStations(query?: string, limit?: number): Promise<VbbLocation[]>;
    getDepartures(stationId?: string, duration?: number): Promise<any>;
}
