import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = app.get(ConfigService);
  const nodeEnv = config.get<string>('app.nodeEnv');
  const swaggerEnabled = config.get<string>('SWAGGER_ENABLED');

  if (nodeEnv === 'production' && swaggerEnabled !== 'true') return;

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Apple Plus API')
      .setDescription('Apple Plus e-commerce REST API')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          in: 'header',
        },
        'access-token',
      )
      .addApiKey(
        { type: 'apiKey', name: 'X-Session-Id', in: 'header' },
        'session-id',
      )
      .build(),
  );

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
