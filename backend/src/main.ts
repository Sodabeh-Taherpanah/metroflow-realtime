import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  console.log('🚀 Starting NestJS application...');

  // Initialize Sentry if DSN provided (guarded)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/node');
    if (process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      });
      console.log('✅ Sentry initialized');
    }
  } catch (err) {
    // package might not be installed — skip
  }

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Ensure socket.io adapter is set
  try {
    app.useWebSocketAdapter(new IoAdapter(app));
    console.log('✅ WebSocket IoAdapter set');
  } catch (err) {
    console.warn('⚠️ IoAdapter not available yet:', err?.message || err);
  }

  console.log('✅ NestFactory created', process.env.DATABASE_URL);

  // Security: helmet with stricter CSP and frameguard
  try {
    app.use(
      helmet({
        crossOriginResourcePolicy: { policy: 'same-origin' },
      }),
    );

    // Apply a strict Content-Security-Policy
    app.use((_req: Request, res: Response, next: NextFunction) => {
      const csp = [
        "default-src 'self'",
        "base-uri 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
        "img-src 'self' data: blob:",
        "font-src 'self' fonts.gstatic.com data:",
        "connect-src 'self' ws: wss:",
        "object-src 'none'",
        "frame-ancestors 'none'",
      ].join('; ');
      res.setHeader('Content-Security-Policy', csp);
      next();
    });
  } catch (err) {
    console.warn(
      '⚠️ Helmet not configured (missing package?):',
      err?.message || err,
    );
  }

  // Basic HTTPS enforcement when running behind a proxy/load balancer
  app.use((req: Request, res: Response, next: NextFunction) => {
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
    if (process.env.ENFORCE_HTTPS === 'true' && proto && proto !== 'https') {
      const host = req.headers.host;
      return res.redirect(301, `https://${host}${req.originalUrl}`);
    }
    next();
  });

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Validation
  // Sanitization middleware: lightweight removal of <script> tags (best-effort)
  app.use((req: Request, _res: Response, next: NextFunction) => {
    try {
      if (req.body && typeof req.body === 'object') {
        const sanitize = (obj: any) => {
          for (const k of Object.keys(obj)) {
            const v = obj[k];
            if (typeof v === 'string') {
              obj[k] = v.replace(/<script.*?>.*?<\/script>/gi, '');
            } else if (v && typeof v === 'object') {
              sanitize(v);
            }
          }
        };
        sanitize(req.body);
      }
    } catch (err) {
      // ignore
    }
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('MetroFlow API')
    .setDescription('Real-time transport intelligence platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Basic metrics endpoint if prom-client present (guarded)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const promClient = require('prom-client');
    const collectDefault = promClient.collectDefaultMetrics;
    collectDefault();
    // Register on underlying Express instance
    const server =
      app.getHttpAdapter &&
      app.getHttpAdapter().getInstance &&
      app.getHttpAdapter().getInstance();
    if (server && typeof server.get === 'function') {
      server.get('/metrics', (_req: Request, res: Response) => {
        res.set('Content-Type', promClient.register.contentType);
        res.send(promClient.register.metrics());
      });
    }
  } catch (err) {
    // prom-client not installed — skip metrics
  }

  const port = process.env.PORT || 3001;

  console.log(`📍 Attempting to listen on port ${port}...`);
  try {
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(
      `📚 Swagger docs available at: http://localhost:${port}/api/docs`,
    );
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    throw error;
  }
}

bootstrap()
  .then(() => console.log('✅ Bootstrap completed'))
  .catch((err) => console.error('❌ Bootstrap error:', err));
