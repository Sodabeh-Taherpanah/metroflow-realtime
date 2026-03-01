import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { createClient, RedisClientType } from 'redis';
import { z } from 'zod';
import { InjectRepository } from '@nestjs/typeorm';
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

const AgentLocationUpdateSchema = z.object({
  id: z.string().min(1),
  type: z.literal('agent.location.update').optional(),
  routeId: z.string().min(1).optional(),
  agentId: z.string().min(1).optional(),
  status: z.string().optional(),
  location: z.object({
    lat: z.number().gte(-90).lte(90),
    lng: z.number().gte(-180).lte(180),
    ts: z.string().datetime().optional(),
  }),
  meta: z.record(z.any()).optional(),
  timestamp: z.string().datetime().optional(),
});

type AgentLocationUpdatePayload = z.infer<typeof AgentLocationUpdateSchema>;

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private departureIntervals = new Map<string, NodeJS.Timeout>();
  private stationSubscriptions = new Map<string, Set<string>>();
  private redisClient: RedisClientType | null = null;
  private readonly tracesEnabled = process.env.ENABLE_TRACES === 'true';

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(AgentTrace)
    private readonly agentTraceRepository: Repository<AgentTrace>,
  ) {
    console.log('RealtimeGateway initialized with cache support');
  }

  afterInit() {
    console.log('WebSocket initialized with real-time caching');
    this.initializeRedisClient();
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.stationSubscriptions.set(client.id, new Set());
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Clean up subscriptions
    this.stationSubscriptions.delete(client.id);

    // Clear intervals if any
    const interval = this.departureIntervals.get(client.id);
    if (interval) {
      clearInterval(interval);
      this.departureIntervals.delete(client.id);
    }
  }

  /**
   * Subscribe to departures for a specific station
   */
  @SubscribeMessage('subscribe:departures')
  async handleSubscribeDepartures(client: Socket, data: { stationId: string }) {
    const { stationId } = data;

    console.log(
      `Client ${client.id} subscribed to departures for station ${stationId}`,
    );

    const subscriptions = this.stationSubscriptions.get(client.id);
    if (subscriptions) {
      subscriptions.add(stationId);
    }

    // Send cached departures if available
    const cachedDepartures = await this.getCachedDepartures(stationId);
    if (cachedDepartures.length > 0) {
      client.emit('departures:update', {
        stationId,
        departures: cachedDepartures,
        cached: true,
      });
    }

    // Set up real-time updates every 10 seconds
    const clientIntervalKey = `${client.id}:${stationId}`;
    if (this.departureIntervals.has(clientIntervalKey)) {
      clearInterval(this.departureIntervals.get(clientIntervalKey));
    }

    const interval = setInterval(async () => {
      if (client.connected) {
        const departures = await this.getCachedDepartures(stationId);
        client.emit('departures:update', {
          stationId,
          departures,
          timestamp: new Date().toISOString(),
        });
      } else {
        clearInterval(interval);
        this.departureIntervals.delete(clientIntervalKey);
      }
    }, 10000); // Update every 10 seconds

    this.departureIntervals.set(clientIntervalKey, interval);
  }

  /**
   * Unsubscribe from station departures
   */
  @SubscribeMessage('unsubscribe:departures')
  handleUnsubscribeDepartures(client: Socket, data: { stationId: string }) {
    const { stationId } = data;
    const subscriptions = this.stationSubscriptions.get(client.id);
    if (subscriptions) {
      subscriptions.delete(stationId);
    }

    const clientIntervalKey = `${client.id}:${stationId}`;
    const interval = this.departureIntervals.get(clientIntervalKey);
    if (interval) {
      clearInterval(interval);
      this.departureIntervals.delete(clientIntervalKey);
    }

    console.log(`Client ${client.id} unsubscribed from station ${stationId}`);
  }

  /**
   * Get cached departures for a station
   */
  private async getCachedDepartures(
    stationId: string,
  ): Promise<CachedDeparture[]> {
    const cacheKey = `departures:${stationId}`;

    try {
      const cached = await this.cacheManager.get<CachedDeparture[]>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (error) {
      console.error('Cache retrieval error:', error);
    }

    // Return mock data if cache miss (in production, fetch from API)
    return this.generateMockDepartures(stationId);
  }

  /**
   * Update departures cache (called by API/service)
   */
  async updateDepartures(stationId: string, departures: CachedDeparture[]) {
    const cacheKey = `departures:${stationId}`;

    try {
      // Cache for 5 minutes
      await this.cacheManager.set(cacheKey, departures, 5 * 60 * 1000);

      // Broadcast to all subscribed clients
      this.server.emit('departures:updated', {
        stationId,
        departures,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Cache update error:', error);
    }
  }

  /**
   * Generate mock departures for testing
   */
  private generateMockDepartures(stationId: string): CachedDeparture[] {
    const now = Date.now();
    return [
      {
        id: `${stationId}-1`,
        stationId,
        lineNumber: 'U6',
        direction: 'Alt-Tegel',
        departureTime: new Date(now + 2 * 60000),
        delayMinutes: 1,
        platform: 'A',
        realtime: true,
        timestamp: now,
      },
      {
        id: `${stationId}-2`,
        stationId,
        lineNumber: 'S1',
        direction: 'Frohnau',
        departureTime: new Date(now + 5 * 60000),
        delayMinutes: 0,
        platform: 'B',
        realtime: true,
        timestamp: now,
      },
      {
        id: `${stationId}-3`,
        stationId,
        lineNumber: 'RE3',
        direction: 'Stralsund',
        departureTime: new Date(now + 8 * 60000),
        delayMinutes: -2,
        platform: '5',
        realtime: false,
        timestamp: now,
      },
    ];
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, data: any) {
    console.log(
      `Client ${client.id} subscribed to ${data.channel} (handleSubscribe)`,
    );
    client.join(data.channel);
    return { status: 'subscribed', channel: data.channel };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, data: any) {
    console.log(
      `Client ${client.id} unsubscribed from ${data.channel} (handleUnsubscribe)`,
    );
    client.leave(data.channel);
    return { status: 'unsubscribed', channel: data.channel };
  }

  broadcastUpdate(channel: string, data: any) {
    console.log(`Broadcasting update to channel: ${channel}`);
    this.server.to(channel).emit('update', data);
  }

  emitAgentLocationUpdate(payload: Record<string, any>) {
    return this.processAgentLocationUpdate(payload, 'internal');
  }

  @SubscribeMessage('agent.location.update')
  async handleAgentLocationUpdate(client: Socket, payload: unknown) {
    const clientId = client?.id || 'unknown';
    return this.processAgentLocationUpdate(payload, clientId);
  }

  private async processAgentLocationUpdate(payload: unknown, source: string) {
    const parsedPayload = AgentLocationUpdateSchema.safeParse(payload);

    if (!parsedPayload.success) {
      console.warn('Rejected agent.location.update payload', {
        source,
        reason: parsedPayload.error.flatten(),
      });
      return {
        ok: false,
        error: 'Invalid payload',
      };
    }

    const validatedPayload: AgentLocationUpdatePayload = {
      ...parsedPayload.data,
      type: 'agent.location.update',
      timestamp: parsedPayload.data.timestamp || new Date().toISOString(),
    };

    await this.writeLatestState(validatedPayload);

    if (this.tracesEnabled) {
      await this.persistTrace(validatedPayload);
    }

    this.server.emit('agent.location.update', validatedPayload);

    return {
      ok: true,
      payload: validatedPayload,
    };
  }

  private async initializeRedisClient() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.warn('REDIS_URL is not set; latest-state writes are disabled');
      return;
    }

    this.redisClient = createClient({ url: redisUrl });
    this.redisClient.on('error', (error) => {
      console.error('Redis client error', error);
    });

    try {
      await this.redisClient.connect();
      console.log('Redis client connected for latest-state writes');
    } catch (error) {
      console.error('Failed to connect Redis client', error);
      this.redisClient = null;
    }
  }

  private async writeLatestState(payload: AgentLocationUpdatePayload) {
    if (!this.redisClient || !this.redisClient.isOpen) {
      return;
    }

    const key = `agent:latest:${payload.id}`;
    await this.redisClient.set(key, JSON.stringify(payload));
  }

  private async persistTrace(payload: AgentLocationUpdatePayload) {
    try {
      await this.agentTraceRepository.insert({
        agentId: payload.id,
        payload,
      });
    } catch (error) {
      console.error('Trace persistence failed for agent.location.update', {
        agentId: payload.id,
        error,
      });
    }
  }
}
