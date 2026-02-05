import { AppService } from './app.service';
import { VbbService } from './vbb/vbb.service';
export declare class AppController {
    private readonly appService;
    private readonly vbbService;
    constructor(appService: AppService, vbbService: VbbService);
    getHello(): {
        message: string;
        timestamp: string;
    };
    getHealth(): {
        status: string;
        uptime: number;
    };
    getDepartures(): Promise<any>;
}
