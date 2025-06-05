import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AuthCookieService } from './auth-cookie.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IdTokenMiddleware } from './middlewares/id-token.middleware';
import { SecretsManagerService } from './secrets-manager.service';
import { TokenService } from './token.service';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, SecretsManagerService, AuthCookieService, TokenService],
  exports: [SecretsManagerService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(IdTokenMiddleware)
      .exclude(
        {
          path: 'signup',
          method: RequestMethod.POST,
        },
        {
          path: 'signin',
          method: RequestMethod.POST,
        },
        {
          path: 'verify',
          method: RequestMethod.POST,
        },
      )
      .forRoutes('*splat');
  }
}
