import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/models/user.entity';
import { UsersService } from '../users/users.service';
import { AuthCookieService } from './auth-cookie.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IdTokenMiddleware } from './middlewares/id-token.middleware';
import { SecretsManagerService } from './secrets-manager.service';
import { TokenService } from './token.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [AuthService, SecretsManagerService, AuthCookieService, TokenService, UsersService],
  exports: [SecretsManagerService, TokenService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(IdTokenMiddleware)
      .exclude(
        {
          path: 'auth/signup',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/signin',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/verify',
          method: RequestMethod.POST,
        },
      )
      .forRoutes('*splat');
  }
}
