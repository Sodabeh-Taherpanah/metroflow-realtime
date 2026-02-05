import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
export declare class HealthController {
    private health;
    private dbIndicator;
    constructor(health: HealthCheckService, dbIndicator: TypeOrmHealthIndicator);
    liveness(): {
        status: string;
    };
    readiness(): Promise<import("@nestjs/terminus").HealthCheckResult> | {
        status: string;
        detail: string;
    };
}
