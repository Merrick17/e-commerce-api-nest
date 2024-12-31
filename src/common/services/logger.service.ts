import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import DailyRotateFile from 'winston-daily-rotate-file';

interface LogMetadata extends winston.Logform.TransformableInfo {
  timestamp: string;
  metadata: {
    context?: string;
    [key: string]: any;
  };
}

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger implements LoggerService {
  private logger: winston.Logger;

  constructor(context?: string) {
    this.logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.metadata({ fillWith: ['timestamp', 'context'] }),
        winston.format.json(),
      ),
      defaultMeta: { context },
      transports: [
        // Console logging
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf((info: winston.Logform.TransformableInfo) => {
              const logInfo = info as LogMetadata;
              return `[${logInfo.timestamp}] ${logInfo.level} [${logInfo.metadata.context || 'App'}]: ${logInfo.message}`;
            }),
          ),
        }),
        // Error logging
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxFiles: '30d',
        }) as winston.transport,
        // Combined logging
        new DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
        }) as winston.transport,
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}