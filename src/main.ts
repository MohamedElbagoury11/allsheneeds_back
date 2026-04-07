import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Security Headers ────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ────────────────────────────────────────────────────────
  // Origins are read from the ALLOWED_ORIGINS env var (comma-separated)
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ── Global Validation ───────────────────────────────────────────
  // whitelist strips unknown fields; forbidNonWhitelisted returns 400 for them
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Auto-exclude @Exclude() fields (e.g. password) ─────────────
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const port = process.env.PORT || 8080;
  
  // Explicitly binding to 0.0.0.0 is required for Railway
  await app.listen(port, '0.0.0.0');
  
  const logger = new (require('@nestjs/common').Logger)('Bootstrap');
  const server = app.getHttpServer();
  const address = server.address();
  
  logger.log(`Application is listening on: ${JSON.stringify(address)}`);
}
bootstrap();
