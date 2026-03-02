import { TrackingService } from "./tracking.service";
export declare class TrackingController {
    private readonly trackingService;
    constructor(trackingService: TrackingService);
    getAgents(): Promise<Record<string, unknown>[]>;
    getAgentHistory(agentId: string, page?: string, limit?: string): Promise<{
        items: import("../../entities/agent-trace.entity").AgentTrace[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
