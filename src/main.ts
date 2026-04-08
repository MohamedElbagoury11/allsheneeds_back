import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Security Headers ────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ────────────────────────────────────────────────────────
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Add the Netlify domain explicitly as a fallback to ensure it's always allowed in production
  if (process.env.NODE_ENV === 'production' && !allowedOrigins.includes('https://allsheneeds.netlify.app')) {
    allowedOrigins.push('https://allsheneeds.netlify.app');
    allowedOrigins.push('https://www.allsheneeds.netlify.app');
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(o => origin.startsWith(o))) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked for origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
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
