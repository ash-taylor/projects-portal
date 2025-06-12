import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SecretsManagerService } from './auth/secrets-manager.service';
import { ApiConfig } from './config/api-config';
import { ApiHandlerConfig } from './config/api-handler-config';
import { loadEnvConfig } from './config/load-env';
import { ProjectsModule } from './projects/projects.module';
import { UsersModule } from './users/users.module';

const dbConfig: TypeOrmModuleOptions = { type: 'postgres', synchronize: false, autoLoadEntities: true };

@Module({
  imports: [
    ConfigModule.forRoot({ cache: true, isGlobal: true, load: [() => loadEnvConfig(ApiConfig)] }),
    AuthModule,
    ProjectsModule,
    UsersModule,
    TypeOrmModule.forRootAsync({
      imports: [AuthModule, ConfigModule],
      inject: [SecretsManagerService, ConfigService],
      useFactory: async (
        secretManagerService: SecretsManagerService,
        configService: ConfigService<ApiHandlerConfig>,
      ) => {
        const environment = configService.getOrThrow('environment');

        if (environment === 'local') {
          return {
            ...dbConfig,
            host: configService.getOrThrow('dbHost'),
            port: configService.getOrThrow('dbPort'),
            username: configService.getOrThrow('dbUser'),
            password: configService.getOrThrow('dbPassword'),
            database: configService.getOrThrow<string>('dbName'),
          };
        }

        if (environment === 'production') {
          const dbSecretId = configService.getOrThrow('rdsSecretId');
          const result = await secretManagerService.getSecret(dbSecretId);
          const { dbname, username, password, host, port } = JSON.parse(result);

          return {
            ...dbConfig,
            host,
            port,
            username,
            password,
            database: dbname,
            ssl: { rejectUnauthorized: false },
          };
        }

        throw new Error('Invalid environment');
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, SecretsManagerService],
})
export class AppModule {}
