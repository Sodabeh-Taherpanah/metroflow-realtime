import { Injectable, Logger } from '@nestjs/common';

export interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class StructuredLogger {
  private logger = new Logger('App');

  log(message: string, context?: LogContext) {
    this.logger.log(this.formatMessage(message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    this.logger.error(this.formatMessage(`${message} - ${errorMsg}`, context));
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(this.formatMessage(message, context));
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(this.formatMessage(message, context));
  }

  private formatMessage(message: string, context?: LogContext): string {
    const parts = [message];

    if (context) {
      if (context.userId) parts.push(`[User: ${context.userId}]`);
      if (context.requestId) parts.push(`[Request: ${context.requestId}]`);
      if (context.action) parts.push(`[Action: ${context.action}]`);
      if (context.metadata)
        parts.push(`[Meta: ${JSON.stringify(context.metadata)}]`);
    }

    return parts.join(' ');
  }

  /**
   * Log external API calls
   */
  logApiCall(
    provider: string,
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
  ) {
    this.log(
      `API Call: ${provider} ${method} ${endpoint} - Status: ${statusCode} - Duration: ${duration}ms`,
    );
  }

  /**
   * Log WebSocket events
   */
  logWebSocketEvent(event: string, clientId: string, data?: any) {
    this.log(`WebSocket: ${event} - Client: ${clientId}`, {
      metadata: data,
    });
  }

  /**
   * Log database operations
   */
  logDatabaseOperation(
    operation: string,
    entity: string,
    duration: number,
    success: boolean,
  ) {
    const status = success ? 'Success' : 'Failed';
    this.log(
      `Database: ${operation} ${entity} - Status: ${status} - Duration: ${duration}ms`,
    );
  }

  /**
   * Log cache operations
   */
  logCacheOperation(
    operation: string,
    key: string,
    hit: boolean,
    duration: number,
  ) {
    const cacheStatus = hit ? 'Hit' : 'Miss';
    this.log(
      `Cache: ${operation} ${key} - ${cacheStatus} - Duration: ${duration}ms`,
    );
  }
}
