"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructuredLogger = void 0;
const common_1 = require("@nestjs/common");
let StructuredLogger = class StructuredLogger {
    constructor() {
        this.logger = new common_1.Logger('App');
    }
    log(message, context) {
        this.logger.log(this.formatMessage(message, context));
    }
    error(message, error, context) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logger.error(this.formatMessage(`${message} - ${errorMsg}`, context));
    }
    warn(message, context) {
        this.logger.warn(this.formatMessage(message, context));
    }
    debug(message, context) {
        this.logger.debug(this.formatMessage(message, context));
    }
    formatMessage(message, context) {
        const parts = [message];
        if (context) {
            if (context.userId)
                parts.push(`[User: ${context.userId}]`);
            if (context.requestId)
                parts.push(`[Request: ${context.requestId}]`);
            if (context.action)
                parts.push(`[Action: ${context.action}]`);
            if (context.metadata)
                parts.push(`[Meta: ${JSON.stringify(context.metadata)}]`);
        }
        return parts.join(' ');
    }
    logApiCall(provider, endpoint, method, statusCode, duration) {
        this.log(`API Call: ${provider} ${method} ${endpoint} - Status: ${statusCode} - Duration: ${duration}ms`);
    }
    logWebSocketEvent(event, clientId, data) {
        this.log(`WebSocket: ${event} - Client: ${clientId}`, {
            metadata: data,
        });
    }
    logDatabaseOperation(operation, entity, duration, success) {
        const status = success ? 'Success' : 'Failed';
        this.log(`Database: ${operation} ${entity} - Status: ${status} - Duration: ${duration}ms`);
    }
    logCacheOperation(operation, key, hit, duration) {
        const cacheStatus = hit ? 'Hit' : 'Miss';
        this.log(`Cache: ${operation} ${key} - ${cacheStatus} - Duration: ${duration}ms`);
    }
};
exports.StructuredLogger = StructuredLogger;
exports.StructuredLogger = StructuredLogger = __decorate([
    (0, common_1.Injectable)()
], StructuredLogger);
//# sourceMappingURL=structured-logger.service.js.map