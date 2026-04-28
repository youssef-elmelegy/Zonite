import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from '@/common/filters';
import { HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './env';
import { pool } from '@/db';

const logLevelMap: Record<string, string> = {
  development: 'debug',
  production: 'error',
  test: 'verbose',
};

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Zonite');

  // Set logger level
  const logLevel = logLevelMap[env.NODE_ENV] ?? 'error';
  app.useLogger(logger);

  // Socket.io adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Trust proxy (for reverse proxy support)
  app.set('trust proxy', true);

  // Global prefix
  app.setGlobalPrefix('api');

  // Cookie parser
  app.use(cookieParser(env.COOKIE_SECRET));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

  // CORS
  app.enableCors({
    origin: env.CORS_ORIGINS.length ? env.CORS_ORIGINS : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Info'],
  });

  // Swagger/Scalar docs
  const config = new DocumentBuilder()
    .setTitle('Zonite API')
    .setDescription('Zonite backend — real-time block-claiming game')
    .setVersion('0.0.1')
    .addTag('App', 'General application endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  app.use(
    '/api/docs',
    apiReference({
      spec: { content: document },
      theme: 'kepler',
      defaultHttpClient: {
        targetKey: 'js',
        clientKey: 'axios',
      },
    }),
  );

  // DB startup probe
  try {
    await pool.query('SELECT 1');
  } catch {
    logger.error('[startup] database unreachable');
    process.exit(1);
  }

  // Start server
  await app.listen(env.PORT, '0.0.0.0');

  // Startup logs
  console.log(`[startup] port: ${env.PORT}`);
  console.log(`[startup] environment: ${env.NODE_ENV}`);
  console.log(`[startup] log level: ${logLevel}`);
  console.log(`[startup] docs: http://localhost:${env.PORT}/api/docs`);
}

void bootstrap();
