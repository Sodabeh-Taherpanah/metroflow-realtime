"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const redis_1 = require("redis");
const zod_1 = require("zod");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const agent_trace_entity_1 = require("../../entities/agent-trace.entity");
const vbb_service_1 = require("../../vbb/vbb.service");
const AgentLocationUpdateSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    type: zod_1.z.literal('agent.location.update').optional(),
    routeId: zod_1.z.string().min(1).optional(),
    agentId: zod_1.z.string().min(1).optional(),
    status: zod_1.z.string().optional(),
    location: zod_1.z.object({
        lat: zod_1.z.number().gte(-90).lte(90),
        lng: zod_1.z.number().gte(-180).lte(180),
        ts: zod_1.z.string().datetime().optional(),
    }),
    meta: zod_1.z.record(zod_1.z.any()).optional(),
    timestamp: zod_1.z.string().datetime().optional(),
});
let RealtimeGateway = class RealtimeGateway {
    constructor(cacheManager, agentTraceRepository, vbbService) {
        this.cacheManager = cacheManager;
        this.agentTraceRepository = agentTraceRepository;
        this.vbbService = vbbService;
        this.departureIntervals = new Map();
        this.stationSubscriptions = new Map();
        this.redisClient = null;
        this.tracesEnabled = process.env.ENABLE_TRACES === 'true';
        console.log('RealtimeGateway initialized with cache support');
    }
    afterInit() {
        console.log('WebSocket initialized with real-time caching');
        this.initializeRedisClient().catch((error) => {
            console.error('Redis initialization error:', error);
        });
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
        this.stationSubscriptions.set(client.id, new Set());
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        this.stationSubscriptions.delete(client.id);
        const interval = this.departureIntervals.get(client.id);
        if (interval) {
            clearInterval(interval);
            this.departureIntervals.delete(client.id);
        }
    }
    async handleSubscribeDepartures(client, data) {
        const { stationId } = data;
        console.log(`Client ${client.id} subscribed to departures for station ${stationId}`);
        const subscriptions = this.stationSubscriptions.get(client.id);
        if (subscriptions) {
            subscriptions.add(stationId);
        }
        const cachedDepartures = await this.getCachedDepartures(stationId);
        if (cachedDepartures.length > 0) {
            client.emit('departures:update', {
                stationId,
                departures: cachedDepartures,
                cached: true,
            });
        }
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
            }
            else {
                clearInterval(interval);
                this.departureIntervals.delete(clientIntervalKey);
            }
        }, 10000);
        this.departureIntervals.set(clientIntervalKey, interval);
    }
    handleUnsubscribeDepartures(client, data) {
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
    async getCachedDepartures(stationId) {
        const cacheKey = `departures:${stationId}`;
        try {
            const cached = await this.cacheManager.get(cacheKey);
            if (cached) {
                return cached;
            }
        }
        catch (error) {
            console.error('Cache retrieval error:', error);
        }
        try {
            const departures = await this.vbbService.getDepartures(stationId);
            if (Array.isArray(departures) && departures.length > 0) {
                await this.cacheManager
                    .set(cacheKey, departures, 60 * 1000)
                    .catch(() => { });
                return departures;
            }
        }
        catch (error) {
            console.error(`VBB departures fetch failed for station ${stationId}:`, error);
        }
        return this.generateMockDepartures(stationId);
    }
    async updateDepartures(stationId, departures) {
        const cacheKey = `departures:${stationId}`;
        try {
            await this.cacheManager.set(cacheKey, departures, 5 * 60 * 1000);
            this.server.emit('departures:updated', {
                stationId,
                departures,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error('Cache update error:', error);
        }
    }
    generateMockDepartures(stationId) {
        const now = new Date();
        return [
            {
                tripId: `${stationId}-trip-1`,
                stop: { id: stationId, name: 'Berlin, Staaken Bhf' },
                when: new Date(now.getTime() + 2 * 60000).toISOString(),
                plannedWhen: new Date(now.getTime() + 2 * 60000).toISOString(),
                direction: 'Alt-Tegel',
                line: { name: 'U6', id: 'u6' },
            },
            {
                tripId: `${stationId}-trip-2`,
                stop: { id: stationId, name: 'Berlin, Staaken Bhf' },
                when: new Date(now.getTime() + 5 * 60000).toISOString(),
                plannedWhen: new Date(now.getTime() + 5 * 60000).toISOString(),
                direction: 'Frohnau',
                line: { name: 'S1', id: 's1' },
            },
            {
                tripId: `${stationId}-trip-3`,
                stop: { id: stationId, name: 'Berlin, Staaken Bhf' },
                when: new Date(now.getTime() + 8 * 60000).toISOString(),
                plannedWhen: new Date(now.getTime() + 10 * 60000).toISOString(),
                direction: 'Stralsund',
                line: { name: 'RE3', id: 're3' },
            },
        ];
    }
    handleSubscribe(client, data) {
        console.log(`Client ${client.id} subscribed to ${data.channel} (handleSubscribe)`);
        client.join(data.channel);
        return { status: 'subscribed', channel: data.channel };
    }
    handleUnsubscribe(client, data) {
        console.log(`Client ${client.id} unsubscribed from ${data.channel} (handleUnsubscribe)`);
        client.leave(data.channel);
        return { status: 'unsubscribed', channel: data.channel };
    }
    broadcastUpdate(channel, data) {
        console.log(`Broadcasting update to channel: ${channel}`);
        this.server.to(channel).emit('update', data);
    }
    emitAgentLocationUpdate(payload) {
        return this.processAgentLocationUpdate(payload, 'internal');
    }
    async handleAgentLocationUpdate(client, payload) {
        const clientId = client?.id || 'unknown';
        return this.processAgentLocationUpdate(payload, clientId);
    }
    async processAgentLocationUpdate(payload, source) {
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
        const validatedPayload = {
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
    async initializeRedisClient() {
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
            console.warn('REDIS_URL is not set; latest-state writes are disabled');
            return;
        }
        this.redisClient = (0, redis_1.createClient)({ url: redisUrl });
        this.redisClient.on('error', (error) => {
            console.error('Redis client error', error);
        });
        try {
            await this.redisClient.connect();
            console.log('Redis client connected for latest-state writes');
        }
        catch (error) {
            console.error('Failed to connect Redis client', error);
            this.redisClient = null;
        }
    }
    async writeLatestState(payload) {
        if (!this.redisClient || !this.redisClient.isOpen) {
            return;
        }
        const agentId = payload.agentId || payload.id;
        const key = `agent:latest:${agentId}`;
        await this.redisClient.set(key, JSON.stringify(payload));
    }
    async persistTrace(payload) {
        const agentId = payload.agentId || payload.id;
        try {
            await this.agentTraceRepository.insert({
                agentId,
                payload,
            });
        }
        catch (error) {
            console.error('Trace persistence failed for agent.location.update', {
                agentId,
                error,
            });
        }
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe:departures'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleSubscribeDepartures", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe:departures'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleUnsubscribeDepartures", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleUnsubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('agent.location.update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleAgentLocationUpdate", null);
exports.RealtimeGateway = RealtimeGateway = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        },
    }),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __param(1, (0, typeorm_1.InjectRepository)(agent_trace_entity_1.AgentTrace)),
    __metadata("design:paramtypes", [Object, typeorm_2.Repository,
        vbb_service_1.VbbService])
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map