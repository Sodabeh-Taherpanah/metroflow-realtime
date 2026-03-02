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
exports.RealtimeCache = void 0;
const typeorm_1 = require("typeorm");
let RealtimeCache = class RealtimeCache {
};
exports.RealtimeCache = RealtimeCache;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], RealtimeCache.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RealtimeCache.prototype, "key", void 0);
__decorate([
    (0, typeorm_1.Column)("text"),
    __metadata("design:type", String)
], RealtimeCache.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.Column)("timestamp"),
    __metadata("design:type", Date)
], RealtimeCache.prototype, "expiration", void 0);
exports.RealtimeCache = RealtimeCache = __decorate([
    (0, typeorm_1.Entity)("realtime_cache")
], RealtimeCache);
//# sourceMappingURL=realtime-cache.entity.js.map