import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Prefijo global ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Validación de DTOs ────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ignora propiedades no declaradas en el DTO
      forbidNonWhitelisted: true, // lanza error si llegan propiedades extra
      transform: true, // castea tipos automáticamente
    }),
  );

  // ── Filtro global de errores ──────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? '*' });

  // ── Swagger / OpenAPI ─────────────────────────────────────────────────────
  const swaggerCfg = new DocumentBuilder()
    .setTitle('ReCircula API')
    .setDescription(
      'Backend de la plataforma de economía circular de electrónicos.\n\n' +
        '**RF-01** — Gestión de Identidad y Acceso está implementado bajo `/identity`.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerCfg);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n🚀  ReCircula API   → http://localhost:${port}/api/v1`);
  console.log(`📖  Swagger docs    → http://localhost:${port}/api/docs\n`);
}

bootstrap().catch((err) => console.error(err));
