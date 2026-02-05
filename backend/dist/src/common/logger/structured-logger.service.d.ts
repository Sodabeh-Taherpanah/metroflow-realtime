export interface LogContext {
    userId?: string;
    requestId?: string;
    action?: string;
    metadata?: Record<string, any>;
}
export declare class StructuredLogger {
    private logger;
    log(message: string, context?: LogContext): void;
    error(message: string, error?: Error | unknown, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    private formatMessage;
    logApiCall(provider: string, endpoint: string, method: string, statusCode: number, duration: number): void;
    logWebSocketEvent(event: string, clientId: string, data?: any): void;
    logDatabaseOperation(operation: string, entity: string, duration: number, success: boolean): void;
    logCacheOperation(operation: string, key: string, hit: boolean, duration: number): void;
}
