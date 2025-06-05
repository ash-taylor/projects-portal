import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ApiConfig } from './config/api-config';
import { loadEnvConfig } from './config/load-env';

@Module({
  imports: [ConfigModule.forRoot({ cache: true, isGlobal: true, load: [() => loadEnvConfig(ApiConfig)] }), AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
