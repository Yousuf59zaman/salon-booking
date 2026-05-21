import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  // Providers: registers PrismaService to be managed by the NestJS dependency injection container
  providers: [PrismaService],
  // Exports: exports PrismaService so other modules (like AuthModule) can import PrismaModule and use the same database connection instance
  exports: [PrismaService],
})
export class PrismaModule {}

