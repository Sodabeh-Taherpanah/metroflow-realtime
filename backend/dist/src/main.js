"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const swagger_1 = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const helmet_1 = require("helmet");
async function bootstrap() {
    console.log('🚀 Starting NestJS application...');
    try {
        const Sentry = require('@sentry/node');
        if (process.env.SENTRY_DSN) {
            Sentry.init({
                dsn: process.env.SENTRY_DSN,
                environment: process.env.NODE_ENV,
                tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            });
            console.log('✅ Sentry initialized');
        }
    }
    catch (err) {
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    try {
        app.useWebSocketAdapter(new platform_socket_io_1.IoAdapter(app));
        console.log('✅ WebSocket IoAdapter set');
    }
    catch (err) {
        console.warn('⚠️ IoAdapter not available yet:', err?.message || err);
    }
    console.log('✅ NestFactory created', process.env.DATABASE_URL);
    try {
        app.use((0, helmet_1.default)({
            crossOriginResourcePolicy: { policy: 'same-origin' },
        }));
        app.use((_req, res, next) => {
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
    }
    catch (err) {
        console.warn('⚠️ Helmet not configured (missing package?):', err?.message || err);
    }
    app.use((req, res, next) => {
        const proto = req.headers['x-forwarded-proto'] || req.protocol;
        if (process.env.ENFORCE_HTTPS === 'true' && proto && proto !== 'https') {
            const host = req.headers.host;
            return res.redirect(301, `https://${host}${req.originalUrl}`);
        }
        next();
    });
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    });
    app.use((req, _res, next) => {
        try {
            if (req.body && typeof req.body === 'object') {
                const sanitize = (obj) => {
                    for (const k of Object.keys(obj)) {
                        const v = obj[k];
                        if (typeof v === 'string') {
                            obj[k] = v.replace(/<script.*?>.*?<\/script>/gi, '');
                        }
                        else if (v && typeof v === 'object') {
                            sanitize(v);
                        }
                    }
                };
                sanitize(req.body);
            }
        }
        catch (err) {
        }
        next();
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('MetroFlow API')
        .setDescription('Real-time transport intelligence platform API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    try {
        const promClient = require('prom-client');
        const collectDefault = promClient.collectDefaultMetrics;
        collectDefault();
        const server = app.getHttpAdapter &&
            app.getHttpAdapter().getInstance &&
            app.getHttpAdapter().getInstance();
        if (server && typeof server.get === 'function') {
            server.get('/metrics', (_req, res) => {
                res.set('Content-Type', promClient.register.contentType);
                res.send(promClient.register.metrics());
            });
        }
    }
    catch (err) {
    }
    const port = process.env.PORT || 3001;
    console.log(`📍 Attempting to listen on port ${port}...`);
    try {
        await app.listen(port);
        console.log(`🚀 Application is running on: http://localhost:${port}`);
        console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        throw error;
    }
}
bootstrap()
    .then(() => console.log('✅ Bootstrap completed'))
    .catch((err) => console.error('❌ Bootstrap error:', err));
//# sourceMappingURL=main.js.map