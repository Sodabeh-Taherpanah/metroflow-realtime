import { VbbService } from "./vbb.service";
export declare class VbbController {
    private readonly vbbService;
    constructor(vbbService: VbbService);
    getStations(): Promise<{
        id: string;
        name: string;
    }[]>;
    getDepartures(): Promise<{
        id: string;
        train: string;
        time: string;
    }[]>;
}
