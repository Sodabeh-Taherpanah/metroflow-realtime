import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as pino from 'pino';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: pino.Logger;

  constructor() {
    // Simple pino logger without transport to avoid configuration issues
    this.logger = pino.pino({
      level: process.env.LOG_LEVEL || 'info',
    });
  }

  log(message: string, context?: string) {
    this.logger.info({ context }, message);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error({ context, trace }, message);
  }

  warn(message: string, context?: string) {
    this.logger.warn({ context }, message);
  }

  debug(message: string, context?: string) {
    this.logger.debug({ context }, message);
  }

  verbose(message: string, context?: string) {
    this.logger.trace({ context }, message);
  }
}
