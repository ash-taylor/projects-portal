import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';
import { ApiHandlerConfig } from '../config/api-handler-config';

@Injectable()
export class AuthCookieService {
  private readonly log = new Logger(AuthCookieService.name);
  private readonly globalPrefix: string;
  private readonly cookieOptions: CookieOptions;

  constructor(private readonly configService: ConfigService<ApiHandlerConfig>) {
    this.log.log('Initializing Auth Cookie Service...');

    this.globalPrefix = this.configService.getOrThrow('apiPrefix');
    this.cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: `/${this.globalPrefix}`,
    };
  }

  async setHttpOnlyCookie(name: string, value: string, response: Response, options: CookieOptions = {}) {
    this.log.debug(`Setting cookie: ${name}`);

    if (options.path) options.path = `/${this.globalPrefix}/${options.path.replace(/^\/|\/$/g, '')}`;

    response.cookie(name, value, {
      ...this.cookieOptions,
      ...options,
    });
  }

  async clearHttpOnlyCookie(name: string, response: Response, options: CookieOptions = {}) {
    this.log.debug(`Clearing cookie: ${name}`);

    if (options.path) options.path = `/${this.globalPrefix}/${options.path.replace(/^\/|\/$/g, '')}`;

    response.clearCookie(name, {
      ...this.cookieOptions,
      ...options,
    });
  }
}
