import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenService } from '../auth/token.service';
import { CustomersModule } from '../customers/customers.module';
import { UsersModule } from '../users/users.module';
import { Project } from './models/project.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project]), CustomersModule, UsersModule],
  providers: [ProjectsService, TokenService],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}
