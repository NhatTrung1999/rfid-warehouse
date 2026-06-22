import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SecondaryPrismaService } from './prisma-secondary.service';

@Module({
  providers: [PrismaService, SecondaryPrismaService],
  exports: [PrismaService, SecondaryPrismaService],
})
export class PrismaModule {}
