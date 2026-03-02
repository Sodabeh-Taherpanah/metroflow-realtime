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
var SimulatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulatorService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = require("path");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
let SimulatorService = SimulatorService_1 = class SimulatorService {
    constructor(realtimeGateway) {
        this.realtimeGateway = realtimeGateway;
        this.logger = new common_1.Logger(SimulatorService_1.name);
        this.jobs = new Map();
        this.timers = new Map();
    }
    startSimulation(input) {
        const routeId = input.routeId?.trim();
        if (!routeId) {
            throw new common_1.BadRequestException('routeId is required.');
        }
        const intervalMs = Number.isFinite(input.intervalMs) && input.intervalMs > 0
            ? Number(input.intervalMs)
            : 1000;
        const agents = Number.isFinite(input.agents) && input.agents > 0
            ? Math.max(1, Math.floor(Number(input.agents)))
            : 1;
        const loop = input.loop !== undefined ? Boolean(input.loop) : true;
        const jitterMeters = Number.isFinite(input.jitterMeters) && input.jitterMeters >= 0
            ? Number(input.jitterMeters)
            : Number(process.env.SIM_JITTER_METERS || 0);
        const speedKph = Number.isFinite(input.speedKph) && input.speedKph > 0
            ? Number(input.speedKph)
            : 28;
        const samples = this.loadSamples(routeId);
        const jobId = (0, crypto_1.randomUUID)();
        const now = new Date().toISOString();
        const job = {
            jobId,
            routeId,
            status: 'running',
            createdAt: now,
            updatedAt: now,
            config: {
                intervalMs,
                loop,
                agents,
                jitterMeters,
                speedKph,
                sampleCount: samples.length,
            },
            emittedCount: 0,
        };
        this.jobs.set(jobId, job);
        let tick = 0;
        const timer = setInterval(() => {
            try {
                const activeJob = this.jobs.get(jobId);
                if (!activeJob || activeJob.status !== 'running') {
                    this.stopTimer(jobId);
                    return;
                }
                const baseTs = Date.now();
                let emittedThisTick = 0;
                let completedAgents = 0;
                for (let agentIndex = 0; agentIndex < agents; agentIndex += 1) {
                    const agentId = `${jobId}-${agentIndex + 1}`;
                    const offset = Math.floor((agentIndex * samples.length) / agents);
                    const absoluteIndex = tick + offset;
                    if (!loop && absoluteIndex >= samples.length) {
                        completedAgents += 1;
                        continue;
                    }
                    const sampleIndex = loop
                        ? absoluteIndex % samples.length
                        : Math.min(absoluteIndex, samples.length - 1);
                    const sample = samples[sampleIndex];
                    if (!sample) {
                        continue;
                    }
                    const jittered = this.applyJitter({ lat: sample.lat, lng: sample.lng }, jitterMeters);
                    const locationTs = new Date(baseTs + agentIndex * 250).toISOString();
                    const payload = {
                        id: agentId,
                        agentId,
                        type: 'agent.location.update',
                        routeId,
                        location: {
                            lat: Number(jittered.lat.toFixed(6)),
                            lng: Number(jittered.lng.toFixed(6)),
                            ts: locationTs,
                        },
                        status: 'active',
                        meta: {
                            speedKph,
                            bearing: sample.bearing,
                            seq: sample.seq,
                        },
                    };
                    this.realtimeGateway.emitAgentLocationUpdate(payload);
                    emittedThisTick += 1;
                }
                activeJob.emittedCount += emittedThisTick;
                activeJob.updatedAt = new Date().toISOString();
                this.jobs.set(jobId, activeJob);
                tick += 1;
                if (!loop && completedAgents >= agents) {
                    activeJob.status = 'completed';
                    activeJob.updatedAt = new Date().toISOString();
                    this.jobs.set(jobId, activeJob);
                    this.stopTimer(jobId);
                }
            }
            catch (error) {
                const activeJob = this.jobs.get(jobId);
                if (activeJob) {
                    activeJob.status = 'failed';
                    activeJob.error =
                        error instanceof Error ? error.message : 'Unknown simulator error';
                    activeJob.updatedAt = new Date().toISOString();
                    this.jobs.set(jobId, activeJob);
                }
                this.stopTimer(jobId);
            }
        }, intervalMs);
        this.timers.set(jobId, timer);
        this.logger.log(`[sim:${jobId}] started route=${routeId} agents=${agents} intervalMs=${intervalMs} loop=${loop} jitterMeters=${jitterMeters}`);
        return {
            jobId,
            status: job.status,
            routeId,
            config: job.config,
        };
    }
    getSimulationJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new common_1.NotFoundException(`Simulation job not found: ${jobId}`);
        }
        return job;
    }
    listSimulationJobs() {
        return Array.from(this.jobs.values()).sort((a, b) => a.createdAt < b.createdAt ? 1 : -1);
    }
    emitTestUpdate(input) {
        const locationTs = new Date().toISOString();
        const payload = {
            id: `test-${Date.now()}`,
            type: 'agent.location.update',
            routeId: input.routeId || 'test-route',
            location: {
                lat: Number.isFinite(input.lat) ? input.lat : 52.52,
                lng: Number.isFinite(input.lng) ? input.lng : 13.405,
                ts: locationTs,
            },
            status: 'active',
            meta: {
                speedKph: Number.isFinite(input.speed) ? input.speed : 8.5,
                bearing: 0,
                seq: Number.isFinite(input.seq) ? input.seq : 0,
            },
            agentId: input.agentId || `agent-${Date.now()}`,
        };
        const emitted = this.realtimeGateway.emitAgentLocationUpdate(payload);
        return {
            ok: true,
            event: 'agent.location.update',
            emitted,
        };
    }
    loadSamples(routeId) {
        const dataDir = process.env.DATA_DIR || './data';
        const absoluteDataDir = (0, path_1.isAbsolute)(dataDir)
            ? dataDir
            : (0, path_1.resolve)(process.cwd(), dataDir);
        const safeRouteId = this.safeFileSegment(routeId);
        const samplePath = (0, path_1.resolve)(absoluteDataDir, 'samples', `route-${safeRouteId}-samples.json`);
        if (!(0, fs_1.existsSync)(samplePath)) {
            throw new common_1.NotFoundException(`Sample file not found for routeId=${routeId}: ${samplePath}. Run /api/ingest/sample first.`);
        }
        const parsed = JSON.parse((0, fs_1.readFileSync)(samplePath, 'utf-8'));
        const samples = Array.isArray(parsed?.samples)
            ? parsed.samples
            : [];
        if (samples.length === 0) {
            throw new common_1.BadRequestException(`No samples available in ${samplePath} for route ${routeId}.`);
        }
        return samples;
    }
    applyJitter(point, jitterMeters) {
        if (!Number.isFinite(jitterMeters) || jitterMeters <= 0) {
            return point;
        }
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * jitterMeters;
        const northMeters = Math.cos(angle) * distance;
        const eastMeters = Math.sin(angle) * distance;
        const latOffset = northMeters / 111320;
        const lngScale = Math.max(Math.cos((point.lat * Math.PI) / 180) * 111320, 1e-6);
        const lngOffset = eastMeters / lngScale;
        return {
            lat: point.lat + latOffset,
            lng: point.lng + lngOffset,
        };
    }
    stopTimer(jobId) {
        const timer = this.timers.get(jobId);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(jobId);
        }
    }
    safeFileSegment(value) {
        return (value
            .trim()
            .replace(/[^a-zA-Z0-9_-]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'route');
    }
};
exports.SimulatorService = SimulatorService;
exports.SimulatorService = SimulatorService = SimulatorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [realtime_gateway_1.RealtimeGateway])
], SimulatorService);
//# sourceMappingURL=simulator.service.js.map