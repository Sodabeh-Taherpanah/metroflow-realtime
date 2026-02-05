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
        this.BASE_URL = 'https://v6.vbb.transport.rest';
    }
    async searchLocations(query, limit = 10) {
        try {
            const response = await (0, rxjs_1.lastValueFrom)(this.httpService.get(`${this.BASE_URL}/locations`, {
                params: { query, limit },
            }));
            return response.data?.locations || [];
        }
        catch (error) {
            console.error('Error searching locations from VBB API:', error);
            throw new Error(`Failed to search locations: ${error.message}`);
        }
    }
    async fetchDepartures(stationId, duration = 60) {
        try {
            const response = await (0, rxjs_1.lastValueFrom)(this.httpService.get(`${this.BASE_URL}/stops/${stationId}/departures`, {
                params: { duration },
            }));
            return response.data?.departures || [];
        }
        catch (error) {
            console.error('Error fetching departures from VBB API:', error);
            throw new Error(`Failed to fetch departures: ${error.message}`);
        }
    }
    async fetchStation(stationId) {
        try {
            const response = await (0, rxjs_1.lastValueFrom)(this.httpService.get(`${this.BASE_URL}/stops/${stationId}`));
            return response.data || null;
        }
        catch (error) {
            console.error('Error fetching station from VBB API:', error);
            throw new Error(`Failed to fetch station: ${error.message}`);
        }
    }
    async fetchJourney(from, to) {
        try {
            const response = await (0, rxjs_1.lastValueFrom)(this.httpService.get(`${this.BASE_URL}/journeys`, {
                params: { from, to },
            }));
            return response.data || null;
        }
        catch (error) {
            console.error('Error fetching journey from VBB API:', error);
            throw new Error(`Failed to fetch journey: ${error.message}`);
        }
    }
    async fetchData() {
        try {
            const response = await (0, rxjs_1.lastValueFrom)(this.httpService.get(this.BASE_URL));
            return response.data;
        }
        catch (error) {
            console.error('Error fetching VBB API info:', error);
            throw new Error('Failed to fetch VBB API info');
        }
    }
    normalizeData(data) {
        if (Array.isArray(data)) {
            return data.map((item) => this.normalizeSingleItem(item));
        }
        return this.normalizeSingleItem(data);
    }
    normalizeSingleItem(item) {
        return {
            id: item.id || item.tripId,
            name: item.name || item.lineName,
            latitude: item.latitude,
            longitude: item.longitude,
            type: item.type,
            provider: 'VBB',
        };
    }
};
exports.VbbService = VbbService;
exports.VbbService = VbbService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], VbbService);
//# sourceMappingURL=vbb.service.js.map