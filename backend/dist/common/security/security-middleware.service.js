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
exports.SecurityMiddlewareService = void 0;
const common_1 = require("@nestjs/common");
let SecurityMiddlewareService = class SecurityMiddlewareService {
    constructor() { }
    getCSPHeader() {
        return `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://vercel.live;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https: blob:;
      font-src 'self' https://fonts.gstatic.com data:;
      connect-src 'self' https://v6.vbb.transport.rest https://sentry.io wss: https:;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    `
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ');
    }
    getSecurityHeaders() {
        return {
            'Content-Security-Policy': this.getCSPHeader(),
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        };
    }
    getCORSConfig() {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            process.env.FRONTEND_URL,
            process.env.PRODUCTION_URL,
        ].filter(Boolean);
        return {
            origin: allowedOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'Accept',
                'Origin',
                'X-Requested-With',
            ],
        };
    }
};
exports.SecurityMiddlewareService = SecurityMiddlewareService;
exports.SecurityMiddlewareService = SecurityMiddlewareService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SecurityMiddlewareService);
//# sourceMappingURL=security-middleware.service.js.map