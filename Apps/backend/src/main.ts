// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api');

  // Global validation pipe (uses class-validator DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,        // auto-transform payloads to DTO instances
    }),
  );

  // CORS — allow the Vite dev server (and future production domain)
  app.enableCors({
    origin: true, // Allow any origin in development
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);

  console.log(`\n🚀 DespensaNET API running on: http://localhost:${port}/api`);
  console.log(`   Auth → POST http://localhost:${port}/api/auth/login\n`);
}
bootstrap();
