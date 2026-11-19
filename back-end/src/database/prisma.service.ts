/**
 * PrismaService — the one PostgreSQL connection the app shares.
 *
 * PrismaClient is generated from prisma/schema.prisma. Nest creates this once
 * (DatabaseModule), it connects when the app starts and disconnects on shutdown.
 * The connection string is DATABASE_URL in back-end/.env.
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
