import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { TokenService } from '../token.service';

@Injectable()
export class IdTokenMiddleware implements NestMiddleware {
  private readonly log = new Logger(IdTokenMiddleware.name);

  constructor(private readonly tokenService: TokenService) {
    this.log.log('Initializing IdTokenMiddleware...');
  }

  async use(req: Request, _res: Response, next: NextFunction) {
    this.log.debug('Extracting ID token from request...');

    const idToken = this.tokenService.extractToken(req, 'id_token', false);

    if (idToken) {
      try {
        const decodedToken = await this.tokenService.verifyIdToken(idToken);
        req.userId = decodedToken;
      } catch (error) {
        this.log.warn('Failed to verify ID token', error);
      }
    }

    next();
  }
}
