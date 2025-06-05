import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiHandlerConfig } from './config/api-handler-config';

@Injectable()
export class AppService {
  private readonly log = new Logger(AppService.name);

  constructor(configService: ConfigService<ApiHandlerConfig>) {
    this.log.log('Initializing App Service...');
  }

  getHello(): Record<string, string> {
    const message = 'Hello World!';
    return { message };
  }
}
