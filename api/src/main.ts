import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ApiConfig } from './config/api-config';
import { loadEnvConfig } from './config/load-env';

// Local entry point to NestJS application

const config = loadEnvConfig(ApiConfig);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app
    .setGlobalPrefix(config.apiPrefix)
    .useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
    .use(cookieParser())
    .enableCors({
      origin: ['http://localhost:5173'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
