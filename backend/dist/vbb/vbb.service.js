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
exports.VbbService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let VbbService = class VbbService {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger('VbbService');
        this.BASE_URL = 'https://v6.vbb.transport.rest';
        this.logger.log('VbbService initialized');
    }
    async getStations(query = 'Berlin', limit = 10) {
        try {
            this.logger.log(`Fetching stations: query=${query}, limit=${limit}`);
            const response = await (0, rxjs_1.lastValueFrom)(this.httpService.get(`${this.BASE_URL}/locations`, {
                params: { query, limit },
            }));
            const result = Array.isArray(response.data) ? response.data : [];
            this.logger.log(`Got ${result.length} stations from VBB API`);
            return result;
        }
        catch (error) {
            this.logger.error(`Error getting stations: ${error.message}`, error.stack);
            return [];
        }
    }
    async getDepartures(stationId = '900029305', duration = 60) {
        try {
            this.logger.log(`Fetching departures: stationId=${stationId}, duration=${duration}`);
            const response = await (0, rxjs_1.lastValueFrom)(this.httpService.get(`${this.BASE_URL}/stops/${stationId}/departures`, {
                params: { duration },
            }));
            const result = response.data?.departures || [];
            this.logger.log(`Got ${result.length} departures`);
            return result;
        }
        catch (error) {
            this.logger.error(`Error getting departures: ${error.message}`, error.stack);
            return [];
        }
    }
};
exports.VbbService = VbbService;
exports.VbbService = VbbService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], VbbService);
//# sourceMappingURL=vbb.service.js.map