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
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const terminus_1 = require("@nestjs/terminus");
const cache_manager_1 = require("@nestjs/cache-manager");
const axios_1 = require("@nestjs/axios");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const logger_module_1 = require("./common/logger/logger.module");
const config_module_1 = require("./common/config/config.module");
const vbb_controller_1 = require("./vbb/vbb.controller");
const vbb_service_1 = require("./vbb/vbb.service");
const stations_module_1 = require("./modules/stations/stations.module");
const realtime_module_1 = require("./modules/realtime/realtime.module");
const routes_module_1 = require("./modules/routes/routes.module");
const typeorm_1 = require("@nestjs/typeorm");
const providers_module_1 = require("./modules/providers/providers.module");
const health_module_1 = require("./modules/health/health.module");
const security_middleware_service_1 = require("./common/security/security-middleware.service");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
let NoopGuard = class NoopGuard {
    canActivate(_ctx) {
        return true;
    }
};
NoopGuard = __decorate([
    (0, common_1.Injectable)()
], NoopGuard);
let SecurityHeadersMiddleware = class SecurityHeadersMiddleware {
    constructor(securityService) {
        this.securityService = securityService;
    }
    use(_req, res, next) {
        const headers = this.securityService.getSecurityHeaders();
        Object.entries(headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        next();
    }
};
SecurityHeadersMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [security_middleware_service_1.SecurityMiddlewareService])
], SecurityHeadersMiddleware);
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            cache_manager_1.CacheModule.register({
                isGlobal: true,
                ttl: 5 * 60 * 1000,
                max: 100,
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                url: process.env.DATABASE_URL,
                autoLoadEntities: true,
                synchronize: true,
            }),
            throttler_1.ThrottlerModule.forRoot({
                throttlers: [
                    {
                        ttl: process.env.RATE_TTL ? parseInt(process.env.RATE_TTL, 10) : 60,
                        limit: Number(process.env.RATE_LIMIT) || 100,
                        name: 'default',
                    },
                ],
            }),
            terminus_1.TerminusModule,
            logger_module_1.LoggerModule,
            config_module_1.ConfigurationModule,
            axios_1.HttpModule,
            providers_module_1.ProvidersModule,
            stations_module_1.StationsModule,
            routes_module_1.RoutesModule,
            realtime_module_1.RealtimeModule,
            health_module_1.HealthModule,
        ],
        controllers: [app_controller_1.AppController, vbb_controller_1.VbbController],
        providers: [
            app_service_1.AppService,
            vbb_service_1.VbbService,
            security_middleware_service_1.SecurityMiddlewareService,
            {
                provide: core_1.APP_GUARD,
                useClass: process.env.NODE_ENV === 'development' ? NoopGuard : throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: logging_interceptor_1.LoggingInterceptor,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map