import {
  Module,
  Injectable,
  CanActivate,
  ExecutionContext,
  NestMiddleware,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './common/logger/logger.module';
import { ConfigurationModule } from './common/config/config.module';
import { VbbController } from './vbb/vbb.controller';
import { VbbService } from './vbb/vbb.service';

import { StationsModule } from './modules/stations/stations.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { RoutesModule } from './modules/routes/routes.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProvidersModule } from './modules/providers/providers.module';
import { HealthModule } from './modules/health/health.module';
import { SecurityMiddlewareService } from './common/security/security-middleware.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { Request, Response, NextFunction } from 'express';

@Injectable()
class NoopGuard implements CanActivate {
  canActivate(_ctx: ExecutionContext) {
    return true;
  }
}

@Injectable()
class SecurityHeadersMiddleware implements NestMiddleware {
  constructor(private securityService: SecurityMiddlewareService) {}

  use(_req: Request, res: Response, next: NextFunction) {
    const headers = this.securityService.getSecurityHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    next();
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Cache manager for real-time data
    CacheModule.register({
      isGlobal: true,
      ttl: 5 * 60 * 1000, // 5 minutes default TTL
      max: 100, // Maximum number of cached items
    }),
    // Temporarily disabled TypeORM to debug startup issue
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true, // Use migrations instead
    }),
    // Rate limiting: provide `throttlers` array to match newer package shape
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: process.env.RATE_TTL ? parseInt(process.env.RATE_TTL, 10) : 60,
          limit: Number(process.env.RATE_LIMIT) || 100,
          name: 'default',
        },
      ],
    } as any),
    // Health checks
    TerminusModule,
    LoggerModule,
    ConfigurationModule,
    // Modules that depend on TypeORM are disabled for now
    ProvidersModule,
    StationsModule,
    RoutesModule,
    RealtimeModule,
    HealthModule,
  ],
  controllers: [AppController, VbbController],
  providers: [
    AppService,
    VbbService,
    SecurityMiddlewareService,
    {
      provide: APP_GUARD,
      useClass:
        process.env.NODE_ENV === 'development' ? NoopGuard : ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: any) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}
