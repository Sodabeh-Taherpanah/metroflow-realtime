import { SimulatorService } from "./simulator.service";
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
            status: "completed" | "running" | "failed";
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
        status: "completed" | "running" | "failed";
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
        status: "completed" | "running" | "failed";
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
                type?: "agent.location.update";
                timestamp?: string;
                id?: string;
                location?: {
                    lat?: number;
                    lng?: number;
                    ts?: string;
                };
                agentId?: string;
                routeId?: string;
                status?: string;
                meta?: Record<string, any>;
            };
            error?: undefined;
        }>;
    };
    private parsePositiveNumber;
    private parseNonNegativeNumber;
}
export {};
