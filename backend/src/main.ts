import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser'; // Middleware to parse Cookie headers and populate req.cookies
import { AppModule } from './app.module';
import {
  ADMIN_SESSION_COOKIE,
  DEFAULT_FRONTEND_URL,
} from './auth/auth.constants';

async function bootstrap() {
  // Create the Nest application instance with the root module (AppModule)
  const app = await NestFactory.create(AppModule);

  // Enable cookie parsing middleware globally so we can read the admin session cookie
  app.use(cookieParser());

  // Enable CORS (Cross-Origin Resource Sharing) to allow requests from the frontend client
  app.enableCors({
    // Trust and allow requests from the configured frontend URL or default port 3000
    origin: process.env.FRONTEND_URL ?? DEFAULT_FRONTEND_URL,
    // Allow the browser to send credentials (cookies, authorization headers) with requests
    credentials: true,
  });

  // Apply validation globally for all incoming request payloads
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically convert plain request payloads into instances of their DTO classes
      whitelist: true, // Automatically strip out properties that do not have any validation decorators in the DTO class
    }),
  );

  // Configure Swagger OpenAPI documentation metadata
  const config = new DocumentBuilder()
    .setTitle('Salon Booking API')
    .setDescription('REST API for the Beauty Parlor Booking MVP')
    .setVersion('1.0')
    // Document that the API supports cookie-based authorization for the admin session
    .addCookieAuth(ADMIN_SESSION_COOKIE)
    .build();
  
  // Create the Swagger document object based on app modules and configuration
  const document = SwaggerModule.createDocument(app, config);
  
  // Set up the interactive Swagger UI at the "/api/docs" path
  SwaggerModule.setup('api/docs', app, document);

  // Start listening on the port specified in environment variables, defaulting to 3001
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
