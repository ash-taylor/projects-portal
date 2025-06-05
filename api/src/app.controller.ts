import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private readonly log: Logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {
    this.log.log('Initializing App Controller...');
  }

  @Get()
  getHello(): Record<string, string> {
    return this.appService.getHello();
  }
}
