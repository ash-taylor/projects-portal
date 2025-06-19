import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenService } from '../auth/token.service';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer } from './models/customer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  controllers: [CustomersController],
  providers: [CustomersService, TokenService],
  exports: [CustomersService],
})
export class CustomersModule {}
