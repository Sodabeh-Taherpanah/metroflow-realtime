import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { AgentTrace } from '../../entities/agent-trace.entity';
import { VbbService } from '../../vbb/vbb.service';
export declare class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private cacheManager;
    private readonly agentTraceRepository;
    private readonly vbbService;
    server: Server;
    private departureIntervals;
    private stationSubscriptions;
    private redisClient;
    private readonly tracesEnabled;
    constructor(cacheManager: Cache, agentTraceRepository: Repository<AgentTrace>, vbbService: VbbService);
    afterInit(): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleSubscribeDepartures(client: Socket, data: {
        stationId: string;
    }): Promise<void>;
    handleUnsubscribeDepartures(client: Socket, data: {
        stationId: string;
    }): void;
    private getCachedDepartures;
    updateDepartures(stationId: string, departures: unknown[]): Promise<void>;
    private generateMockDepartures;
    handleSubscribe(client: Socket, data: any): {
        status: string;
        channel: any;
    };
    handleUnsubscribe(client: Socket, data: any): {
        status: string;
        channel: any;
    };
    broadcastUpdate(channel: string, data: any): void;
    emitAgentLocationUpdate(payload: Record<string, any>): Promise<{
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
    handleAgentLocationUpdate(client: Socket, payload: unknown): Promise<{
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
    private processAgentLocationUpdate;
    private initializeRedisClient;
    private writeLatestState;
    private persistTrace;
}
