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
let RealtimeGateway = class RealtimeGateway {
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
        this.departureIntervals = new Map();
        this.stationSubscriptions = new Map();
        console.log('RealtimeGateway initialized with cache support');
    }
    afterInit() {
        console.log('WebSocket initialized with real-time caching');
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
exports.RealtimeGateway = RealtimeGateway = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        },
    }),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object])
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map