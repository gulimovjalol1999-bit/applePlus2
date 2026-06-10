import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/exceptions/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { setupSwagger } from './swagger/swagger.config';

async function bootstrap(): Promise<void> {
  // rawBody: true makes req.rawBody available for webhook HMAC signature verification
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') ?? 3000;
  const nodeEnv = config.get<string>('app.nodeEnv');
  const appUrl = config.get<string>('app.url');

  // Security headers
  app.use(helmet());

  // Global route prefix — health is excluded so /health/live works for Docker probe
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/live', 'health/ready'],
  });

  // Exception handling
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Interceptors run in registration order: request-id → logging → transform
  app.useGlobalInterceptors(
    new RequestIdInterceptor(),
    new LoggingInterceptor(),
    new ResponseTransformInterceptor(),
  );

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS — restrict origin in production
  app.enableCors({
    origin: nodeEnv === 'production' ? appUrl : '*',
    credentials: true,
  });

  // WebSocket adapter (socket.io)
  app.useWebSocketAdapter(new IoAdapter(app));

  setupSwagger(app);

  await app.listen(port);

  Logger.log(`Running in [${nodeEnv}] mode`, 'Bootstrap');
  Logger.log(`Listening on port ${port}`, 'Bootstrap');

  if (nodeEnv !== 'production') {
    Logger.log(`Swagger UI → http://localhost:${port}/api/docs`, 'Bootstrap');
  }
}

bootstrap();
