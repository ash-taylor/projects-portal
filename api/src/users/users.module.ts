import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenService } from '../auth/token.service';
import { User } from './models/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, TokenService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
