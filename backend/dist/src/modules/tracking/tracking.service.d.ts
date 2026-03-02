import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AgentTrace } from '../../entities/agent-trace.entity';
type AgentHistoryOptions = {
    page: number;
    limit: number;
};
export declare class TrackingService implements OnModuleInit, OnModuleDestroy {
    private readonly agentTraceRepository;
    private readonly logger;
    private redisClient;
    constructor(agentTraceRepository: Repository<AgentTrace>);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    getLatestAgents(): Promise<Record<string, unknown>[]>;
    getAgentHistory(agentId: string, options: AgentHistoryOptions): Promise<{
        items: AgentTrace[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
export {};
