import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Role } from './models/role.enum';
import { ROLES_KEY } from './role.decorator';
import { TokenService } from './token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly log = new Logger(AuthGuard.name);

  constructor(
    private readonly tokenService: TokenService,
    private reflector: Reflector,
  ) {
    this.log.log('Initializing Auth Guard...');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.log.log('Checking user auth...');

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();

    const encodedAccessToken = this.tokenService.extractTokenFromHeader(request);

    if (!encodedAccessToken) throw new UnauthorizedException();

    try {
      const verifiedAccessToken = await this.tokenService.verifyAccessToken(encodedAccessToken);
      request.userAccessToken = verifiedAccessToken;

      const userRoles = verifiedAccessToken['cognito:groups'] || [];

      if (!this.checkRoles(requiredRoles, userRoles)) throw new UnauthorizedException();

      return true;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  private checkRoles(requiredRoles: Role[], userRoles: string[]) {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return requiredRoles.some((role) => userRoles.includes(role));
  }
}
