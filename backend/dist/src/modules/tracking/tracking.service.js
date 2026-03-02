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
var TrackingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const redis_1 = require("redis");
const agent_trace_entity_1 = require("../../entities/agent-trace.entity");
let TrackingService = TrackingService_1 = class TrackingService {
    constructor(agentTraceRepository) {
        this.agentTraceRepository = agentTraceRepository;
        this.logger = new common_1.Logger(TrackingService_1.name);
        this.redisClient = null;
    }
    async onModuleInit() {
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
            this.logger.warn('REDIS_URL is not set; tracking latest-state endpoint will return empty data');
            return;
        }
        this.redisClient = (0, redis_1.createClient)({ url: redisUrl });
        this.redisClient.on('error', (error) => {
            this.logger.error(`Redis tracking client error: ${error}`);
        });
        try {
            await this.redisClient.connect();
            this.logger.log('Tracking Redis client connected');
        }
        catch (error) {
            this.logger.error(`Failed to connect tracking Redis client: ${error}`);
            this.redisClient = null;
        }
    }
    async onModuleDestroy() {
        if (this.redisClient?.isOpen) {
            await this.redisClient.quit();
        }
    }
    async getLatestAgents() {
        if (!this.redisClient || !this.redisClient.isOpen) {
            return [];
        }
        const keys = [];
        for await (const key of this.redisClient.scanIterator({
            MATCH: 'agent:latest:*',
            COUNT: 100,
        })) {
            if (typeof key === 'string') {
                keys.push(key);
            }
        }
        if (keys.length === 0) {
            return [];
        }
        const values = await this.redisClient.mGet(keys);
        const latestAgents = [];
        values.forEach((rawValue, index) => {
            const key = keys[index];
            if (!rawValue || !key) {
                return;
            }
            try {
                const parsed = JSON.parse(rawValue);
                const fallbackAgentId = key.replace('agent:latest:', '');
                parsed.agentId = parsed.agentId || fallbackAgentId;
                parsed.id = parsed.id || parsed.agentId;
                latestAgents.push(parsed);
            }
            catch {
                this.logger.warn(`Skipping invalid JSON for key ${key}`);
            }
        });
        return latestAgents;
    }
    async getAgentHistory(agentId, options) {
        const page = Math.max(1, options.page);
        const limit = Math.min(200, Math.max(1, options.limit));
        const skip = (page - 1) * limit;
        const [items, total] = await this.agentTraceRepository.findAndCount({
            where: { agentId },
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });
        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 0,
            },
        };
    }
};
exports.TrackingService = TrackingService;
exports.TrackingService = TrackingService = TrackingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(agent_trace_entity_1.AgentTrace)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TrackingService);
//# sourceMappingURL=tracking.service.js.map