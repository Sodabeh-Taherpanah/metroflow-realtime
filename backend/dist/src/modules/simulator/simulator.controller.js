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
exports.SimulatorController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const simulator_service_1 = require("./simulator.service");
class TestEmitDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TestEmitDto.prototype, "routeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TestEmitDto.prototype, "agentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TestEmitDto.prototype, "lat", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TestEmitDto.prototype, "lng", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TestEmitDto.prototype, "speed", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TestEmitDto.prototype, "seq", void 0);
class StartSimulatorDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StartSimulatorDto.prototype, "routeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StartSimulatorDto.prototype, "intervalMs", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StartSimulatorDto.prototype, "loop", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StartSimulatorDto.prototype, "agents", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StartSimulatorDto.prototype, "jitterMeters", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StartSimulatorDto.prototype, "speedKph", void 0);
let SimulatorController = class SimulatorController {
    constructor(simulatorService) {
        this.simulatorService = simulatorService;
    }
    getStatus() {
        return {
            jobs: this.simulatorService.listSimulationJobs(),
        };
    }
    getJob(jobId) {
        return this.simulatorService.getSimulationJob(jobId);
    }
    start(body) {
        const intervalMs = this.parsePositiveNumber(body.intervalMs, "intervalMs");
        const agents = this.parsePositiveNumber(body.agents, "agents");
        const jitterMeters = this.parseNonNegativeNumber(body.jitterMeters, "jitterMeters");
        const speedKph = this.parsePositiveNumber(body.speedKph, "speedKph");
        let loop;
        if (body.loop !== undefined) {
            const value = body.loop.trim().toLowerCase();
            if (value === "true" || value === "1") {
                loop = true;
            }
            else if (value === "false" || value === "0") {
                loop = false;
            }
            else {
                throw new common_1.BadRequestException("loop must be true/false.");
            }
        }
        return this.simulatorService.startSimulation({
            routeId: body.routeId,
            intervalMs,
            loop,
            agents,
            jitterMeters,
            speedKph,
        });
    }
    testEmit(body) {
        return this.simulatorService.emitTestUpdate({
            routeId: body.routeId,
            agentId: body.agentId,
            lat: body.lat !== undefined ? Number(body.lat) : undefined,
            lng: body.lng !== undefined ? Number(body.lng) : undefined,
            speed: body.speed !== undefined ? Number(body.speed) : undefined,
            seq: body.seq !== undefined ? Number(body.seq) : undefined,
        });
    }
    parsePositiveNumber(raw, field) {
        if (raw === undefined) {
            return undefined;
        }
        const value = Number(raw);
        if (!Number.isFinite(value) || value <= 0) {
            throw new common_1.BadRequestException(`${field} must be a positive number.`);
        }
        return value;
    }
    parseNonNegativeNumber(raw, field) {
        if (raw === undefined) {
            return undefined;
        }
        const value = Number(raw);
        if (!Number.isFinite(value) || value < 0) {
            throw new common_1.BadRequestException(`${field} must be a non-negative number.`);
        }
        return value;
    }
};
exports.SimulatorController = SimulatorController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "List simulator jobs" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Simulation job list" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SimulatorController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)("jobs/:jobId"),
    (0, swagger_1.ApiOperation)({ summary: "Get simulator job status" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Simulation job payload" }),
    __param(0, (0, common_1.Param)("jobId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SimulatorController.prototype, "getJob", null);
__decorate([
    (0, common_1.Post)("start"),
    (0, swagger_1.ApiOperation)({ summary: "Start simulator replay run" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Simulation started" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [StartSimulatorDto]),
    __metadata("design:returntype", void 0)
], SimulatorController.prototype, "start", null);
__decorate([
    (0, common_1.Post)("test-emit"),
    (0, swagger_1.ApiOperation)({ summary: "Emit one agent.location.update test event" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Event emitted to websocket gateway",
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TestEmitDto]),
    __metadata("design:returntype", void 0)
], SimulatorController.prototype, "testEmit", null);
exports.SimulatorController = SimulatorController = __decorate([
    (0, swagger_1.ApiTags)("Simulator"),
    (0, common_1.Controller)("api/simulator"),
    __metadata("design:paramtypes", [simulator_service_1.SimulatorService])
], SimulatorController);
//# sourceMappingURL=simulator.controller.js.map