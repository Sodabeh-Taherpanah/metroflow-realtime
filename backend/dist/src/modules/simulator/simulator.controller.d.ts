import { SimulatorService } from './simulator.service';
declare class TestEmitDto {
    routeId?: string;
    agentId?: string;
    lat?: string;
    lng?: string;
    speed?: string;
    seq?: string;
}
declare class StartSimulatorDto {
    routeId: string;
    intervalMs?: string;
    loop?: string;
    agents?: string;
    jitterMeters?: string;
    speedKph?: string;
}
export declare class SimulatorController {
    private readonly simulatorService;
    constructor(simulatorService: SimulatorService);
    getStatus(): {
        jobs: {
            jobId: string;
            routeId: string;
            status: "running" | "completed" | "failed";
            createdAt: string;
            updatedAt: string;
            config: {
                intervalMs: number;
                loop: boolean;
                agents: number;
                jitterMeters: number;
                speedKph: number;
                sampleCount: number;
            };
            emittedCount: number;
            error?: string;
        }[];
    };
    getJob(jobId: string): {
        jobId: string;
        routeId: string;
        status: "running" | "completed" | "failed";
        createdAt: string;
        updatedAt: string;
        config: {
            intervalMs: number;
            loop: boolean;
            agents: number;
            jitterMeters: number;
            speedKph: number;
            sampleCount: number;
        };
        emittedCount: number;
        error?: string;
    };
    start(body: StartSimulatorDto): {
        jobId: `${string}-${string}-${string}-${string}-${string}`;
        status: "running" | "completed" | "failed";
        routeId: string;
        config: {
            intervalMs: number;
            loop: boolean;
            agents: number;
            jitterMeters: number;
            speedKph: number;
            sampleCount: number;
        };
    };
    testEmit(body: TestEmitDto): {
        ok: boolean;
        event: string;
        emitted: Promise<{
            ok: boolean;
            error: string;
            payload?: undefined;
        } | {
            ok: boolean;
            payload: {
                id?: string;
                type?: "agent.location.update";
                routeId?: string;
                agentId?: string;
                status?: string;
                location?: {
                    lat?: number;
                    lng?: number;
                    ts?: string;
                };
                meta?: Record<string, any>;
                timestamp?: string;
            };
            error?: undefined;
        }>;
    };
    private parsePositiveNumber;
    private parseNonNegativeNumber;
}
export {};
