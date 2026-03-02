import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { AgentTrace } from '../../entities/agent-trace.entity';
interface CachedDeparture {
    id: string;
    stationId: string;
    lineNumber: string;
    direction: string;
    departureTime: Date;
    delayMinutes: number;
    platform?: string;
    realtime: boolean;
    timestamp: number;
}
export declare class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private cacheManager;
    private readonly agentTraceRepository;
    server: Server;
    private departureIntervals;
    private stationSubscriptions;
    private redisClient;
    private readonly tracesEnabled;
    constructor(cacheManager: Cache, agentTraceRepository: Repository<AgentTrace>);
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
    updateDepartures(stationId: string, departures: CachedDeparture[]): Promise<void>;
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
    handleAgentLocationUpdate(client: Socket, payload: unknown): Promise<{
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
    private processAgentLocationUpdate;
    private initializeRedisClient;
    private writeLatestState;
    private persistTrace;
}
export {};
