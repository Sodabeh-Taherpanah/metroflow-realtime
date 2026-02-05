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
exports.VbbController = void 0;
const common_1 = require("@nestjs/common");
const vbb_service_1 = require("./vbb.service");
let VbbController = class VbbController {
    constructor(vbbService) {
        this.vbbService = vbbService;
    }
    async getStations(query = 'Berlin', limit = 10) {
        return this.vbbService.getStations(query, limit);
    }
    async getDepartures(stationId = '900029305', duration = 60) {
        return this.vbbService.getDepartures(stationId, duration);
    }
};
exports.VbbController = VbbController;
__decorate([
    (0, common_1.Get)('stations'),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], VbbController.prototype, "getStations", null);
__decorate([
    (0, common_1.Get)('departures'),
    __param(0, (0, common_1.Query)('stationId')),
    __param(1, (0, common_1.Query)('duration')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], VbbController.prototype, "getDepartures", null);
exports.VbbController = VbbController = __decorate([
    (0, common_1.Controller)('vbb'),
    __metadata("design:paramtypes", [vbb_service_1.VbbService])
], VbbController);
//# sourceMappingURL=vbb.controller.js.map