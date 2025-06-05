import { Logger } from '@aws-lambda-powertools/logger';
import { LogAttributes } from '@aws-lambda-powertools/logger/types';
import { LoggerService } from '@nestjs/common';
import { Context } from 'aws-lambda';

export class PowertoolsLoggerAdapter implements LoggerService {
  constructor(private readonly logger: Logger) {}

  log(message: string, context?: object, ...optionalParams: LogAttributes[]) {
    this.logger.info(message, { context }, ...optionalParams);
  }
  error(message: string, context?: object, ...optionalParams: LogAttributes[]) {
    this.logger.error(message, { context }, ...optionalParams);
  }
  warn(message: string, context?: object, ...optionalParams: LogAttributes[]) {
    this.logger.warn(message, { context }, ...optionalParams);
  }
  debug(message: string, context?: object, ...optionalParams: LogAttributes[]) {
    this.logger.debug(message, { context }, ...optionalParams);
  }

  addContext(context: Context) {
    this.logger.addContext(context);
  }
}
