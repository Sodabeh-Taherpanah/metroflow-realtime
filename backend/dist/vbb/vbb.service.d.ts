export declare class VbbService {
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
