import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthGuard } from './admin-auth.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    // Register Nest's JwtModule. Passing empty config {} since we sign/verify dynamically with specific secrets/expiration times
    JwtModule.register({}), 
    // Import PrismaModule so AuthService can access PrismaService for database operations
    PrismaModule,
  ],
  // Controllers to be instantiated by this module (handles incoming HTTP auth endpoints)
  controllers: [AuthController],
  // Providers defined in this module that will be instantiated by the dependency injection container
  providers: [AdminAuthGuard, AuthService],
  // Export AdminAuthGuard and AuthService so they can be imported and used in other modules (like AppModule or feature modules)
  exports: [AdminAuthGuard, AuthService],
})
export class AuthModule {}

