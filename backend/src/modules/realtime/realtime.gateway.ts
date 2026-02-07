import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

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

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private departureIntervals = new Map<string, NodeJS.Timeout>();
  private stationSubscriptions = new Map<string, Set<string>>();

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    console.log("RealtimeGateway initialized with cache support");
  }

  afterInit() {
    console.log("WebSocket initialized with real-time caching");
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
  @SubscribeMessage("subscribe:departures")
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
      client.emit("departures:update", {
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
        client.emit("departures:update", {
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
  @SubscribeMessage("unsubscribe:departures")
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
      console.error("Cache retrieval error:", error);
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
      this.server.emit("departures:updated", {
        stationId,
        departures,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Cache update error:", error);
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
        lineNumber: "U6",
        direction: "Alt-Tegel",
        departureTime: new Date(now + 2 * 60000),
        delayMinutes: 1,
        platform: "A",
        realtime: true,
        timestamp: now,
      },
      {
        id: `${stationId}-2`,
        stationId,
        lineNumber: "S1",
        direction: "Frohnau",
        departureTime: new Date(now + 5 * 60000),
        delayMinutes: 0,
        platform: "B",
        realtime: true,
        timestamp: now,
      },
      {
        id: `${stationId}-3`,
        stationId,
        lineNumber: "RE3",
        direction: "Stralsund",
        departureTime: new Date(now + 8 * 60000),
        delayMinutes: -2,
        platform: "5",
        realtime: false,
        timestamp: now,
      },
    ];
  }

  @SubscribeMessage("subscribe")
  handleSubscribe(client: Socket, data: any) {
    console.log(
      `Client ${client.id} subscribed to ${data.channel} (handleSubscribe)`,
    );
    client.join(data.channel);
    return { status: "subscribed", channel: data.channel };
  }

  @SubscribeMessage("unsubscribe")
  handleUnsubscribe(client: Socket, data: any) {
    console.log(
      `Client ${client.id} unsubscribed from ${data.channel} (handleUnsubscribe)`,
    );
    client.leave(data.channel);
    return { status: "unsubscribed", channel: data.channel };
  }

  broadcastUpdate(channel: string, data: any) {
    console.log(`Broadcasting update to channel: ${channel}`);
    this.server.to(channel).emit("update", data);
  }
}
