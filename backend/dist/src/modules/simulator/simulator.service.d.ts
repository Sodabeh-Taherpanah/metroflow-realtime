import { RealtimeGateway } from '../realtime/realtime.gateway';
type TestEmitInput = {
    routeId?: string;
    agentId?: string;
    lat?: number;
    lng?: number;
    speed?: number;
    seq?: number;
};
type StartSimulationInput = {
    routeId: string;
    intervalMs?: number;
    loop?: boolean;
    agents?: number;
    jitterMeters?: number;
    speedKph?: number;
};
type SimulationJobStatus = 'running' | 'completed' | 'failed';
type SimulationJob = {
    jobId: string;
    routeId: string;
    status: SimulationJobStatus;
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
export declare class SimulatorService {
    private readonly realtimeGateway;
    private readonly logger;
    private readonly jobs;
    private readonly timers;
    constructor(realtimeGateway: RealtimeGateway);
    startSimulation(input: StartSimulationInput): {
        jobId: `${string}-${string}-${string}-${string}-${string}`;
        status: SimulationJobStatus;
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
    getSimulationJob(jobId: string): SimulationJob;
    listSimulationJobs(): SimulationJob[];
    emitTestUpdate(input: TestEmitInput): {
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
    private loadSamples;
    private applyJitter;
    private stopTimer;
    private safeFileSegment;
}
export {};
