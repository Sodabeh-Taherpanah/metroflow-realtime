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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiHealthController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const redis_1 = require("redis");
let ApiHealthController = class ApiHealthController {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getHealth() {
        let databaseStatus = "down";
        let redisStatus = "down";
        try {
            await this.dataSource.query("SELECT 1");
            databaseStatus = "up";
        }
        catch {
            databaseStatus = "down";
        }
        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
            const redisClient = (0, redis_1.createClient)({ url: redisUrl });
            try {
                await redisClient.connect();
                await redisClient.ping();
                redisStatus = "up";
            }
            catch {
                redisStatus = "down";
            }
            finally {
                if (redisClient.isOpen) {
                    await redisClient.quit();
                }
            }
        }
        const status = databaseStatus === "up" && redisStatus === "up" ? "ok" : "degraded";
        return {
            status,
            checks: {
                database: databaseStatus,
                redis: redisStatus,
            },
            timestamp: new Date().toISOString(),
        };
    }
};
exports.ApiHealthController = ApiHealthController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiHealthController.prototype, "getHealth", null);
exports.ApiHealthController = ApiHealthController = __decorate([
    (0, common_1.Controller)("api/health"),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], ApiHealthController);
//# sourceMappingURL=api-health.controller.js.map