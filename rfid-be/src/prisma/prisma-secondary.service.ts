import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMssql } from '@prisma/adapter-mssql';
import { PrismaClient } from 'src/generated/prisma/client';

@Injectable()
export class SecondaryPrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SecondaryPrismaService.name);

  constructor(config: ConfigService) {
    const adapter = new PrismaMssql(
      config.getOrThrow<string>('DATABASE_URL_SECONDARY'),
    );
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Secondary Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
