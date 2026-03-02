import { DataSource } from "typeorm";
export declare class ApiHealthController {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    getHealth(): Promise<{
        status: string;
        checks: {
            database: "up" | "down";
            redis: "up" | "down";
        };
        timestamp: string;
    }>;
}
