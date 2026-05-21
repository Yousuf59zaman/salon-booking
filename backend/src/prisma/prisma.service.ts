import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient // Inherits all database query methods (findUnique, create, etc.) from the auto-generated PrismaClient class
  implements OnModuleInit, OnModuleDestroy // Implements NestJS lifecycle interfaces to handle startup and teardown tasks
{
  constructor() {
    // Read the database connection string from environment variables
    const connectionString = process.env.DATABASE_URL;

    // Safety guard: throw an error if the database connection string is not defined
    if (!connectionString) {
      throw new Error('DATABASE_URL is required before Prisma can connect.');
    }

    // Call the parent constructor (PrismaClient) and pass the serverless pg adapter for PostgreSQL connection pooling
    super({
      adapter: new PrismaPg({ connectionString }),
    });
  }

  // NestJS lifecycle hook: runs when the module is fully initialized
  async onModuleInit(): Promise<void> {
    // Establish the physical database connection pool
    await this.$connect();
  }

  // NestJS lifecycle hook: runs when the application is shutting down (e.g. on server stop)
  async onModuleDestroy(): Promise<void> {
    // Gracefully disconnect from the database to prevent hanging connections
    await this.$disconnect();
  }
}

