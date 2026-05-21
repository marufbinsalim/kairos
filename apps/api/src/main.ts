import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

let app: INestApplication;

async function bootstrap() {
  if (app) return app;
  app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const doc = new DocumentBuilder()
    .setTitle('Kairos API')
    .setDescription('End-to-end encrypted secrets manager')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, doc));

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

// Vercel handler — gets the underlying Express instance without importing express directly
export default async (req: any, res: any) => {
  const nestApp = await bootstrap();
  nestApp.getHttpAdapter().getInstance()(req, res);
};
