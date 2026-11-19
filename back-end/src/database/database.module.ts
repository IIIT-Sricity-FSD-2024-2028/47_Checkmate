import { Module } from '@nestjs/common';
import { DataService } from './data.service';
import { PrismaService } from './prisma.service';

// PrismaService = the PostgreSQL connection; DataService = the data layer every module uses.
@Module({
  providers: [PrismaService, DataService],
  exports: [DataService, PrismaService],
})
export class DatabaseModule {}
