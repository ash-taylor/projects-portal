import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): Record<string, string> {
    const message = 'Hello World!';
    return { message };
  }
}
