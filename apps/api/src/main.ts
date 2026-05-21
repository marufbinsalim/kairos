import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import express from 'express';

const server = express();
let app: any;

async function bootstrap() {
  if (app) return app;
  app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.WEB_URL
      ? process.env.WEB_URL.split(',')
      : /^http:\/\/localhost:\d+$/,
    credentials: true,
  });
  await app.init();
  return app;
}

// Local dev
if (require.main === module) {
  bootstrap().then((nestApp) => {
    nestApp.listen(process.env.PORT ?? 3001, () => {
      console.log(`API running on port ${process.env.PORT ?? 3001}`);
    });
  });
}

// Vercel handler
export default async (req: any, res: any) => {
  await bootstrap();
  server(req, res);
};
