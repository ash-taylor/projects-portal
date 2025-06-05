import { Logger } from '@aws-lambda-powertools/logger';
import serverlessExpress from '@codegenie/serverless-express';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { APIGatewayProxyHandler, Handler } from 'aws-lambda';
import cookieParser from 'cookie-parser';
import express from 'express';
import { AppModule } from './app.module';
import { ApiConfig } from './config/api-config';
import { loadEnvConfig } from './config/load-env';
import { PowertoolsLoggerAdapter } from './utils/logger/powertools-logger-adapter';

const config = loadEnvConfig(ApiConfig);

const logger = new PowertoolsLoggerAdapter(new Logger({ logLevel: 'DEBUG', serviceName: 'API Handler' }));

let server: Handler;

async function bootstrapServer(): Promise<Handler> {
  const expressApp = express();

  expressApp.disable('x-powered-by');

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), { logger });

  app
    .setGlobalPrefix(config.apiPrefix)
    .useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
    .use(cookieParser())
    .enableCors({
      origin: [config.uiDomain],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });

  await app.init();

  return serverlessExpress({ app: expressApp });
}

export const handler: APIGatewayProxyHandler = async (event, context, callback) => {
  server = server ?? (await bootstrapServer());

  return server(event, context, callback);
};
