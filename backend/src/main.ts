import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create the Nest application instance with the root module
  const app = await NestFactory.create(AppModule);

  // Apply validation globally for all incoming requests
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // automatically transform payloads to DTO instances
      whitelist: true, // strip validated objects of any properties that do not have decorators, e.g. {name:'Jane', extra:'x'} => {name:'Jane'}
    }),
  );

  // Configure Swagger documentation metadata
  const config = new DocumentBuilder()
    .setTitle('Salon Booking API')
    .setDescription('REST API for the Beauty Parlor Booking MVP')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // expose docs at /api/docs

  // Start listening on the configured port or default to 3001
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
