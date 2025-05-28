import serverlessExpress from '@codegenie/serverless-express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, Handler } from 'aws-lambda';
import express from 'express';
import { AppModule } from './app.module';

let server: Handler;

async function bootstrapServer(): Promise<Handler> {
  const expressApp = express();

  expressApp.disable('x-powered-by');

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  app.enableCors({
    origin: [process.env.UI_DOMAIN],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.init();

  return serverlessExpress({ app: expressApp });
}

export const handler: APIGatewayProxyHandler = async (event, context, callback) => {
  server = server ?? (await bootstrapServer());

  const nextEvent: APIGatewayProxyEvent = {
    ...event,
    path: event.path.replace(/^\/api/, ''),
  };

  return server(nextEvent, context, callback);
};
