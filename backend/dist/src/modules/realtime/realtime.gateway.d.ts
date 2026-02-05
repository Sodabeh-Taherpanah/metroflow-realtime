import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Cache } from 'cache-manager';
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
    server: Server;
    private departureIntervals;
    private stationSubscriptions;
    constructor(cacheManager: Cache);
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
}
export {};
