import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module'; // Import AuthModule to enable authentication routes and guards globally

// The @Module decorator defines this class as the root module of the NestJS application
@Module({
  // Register imports: imports other modules that export providers needed in this module
  imports: [AuthModule],
  // Register controllers: define the API controllers instantiated by this module (handling HTTP requests)
  controllers: [AppController],
  // Register providers: define the services/injectables instantiated by NestJS's dependency injection container
  providers: [AppService],
})
export class AppModule {}

