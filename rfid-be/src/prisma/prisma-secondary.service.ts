import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMssql } from '@prisma/adapter-mssql';
import { interpolateSqlParams } from 'src/common/utils/sql-debug.util';
import { PrismaClient } from 'src/generated/prisma/client';
import { parseMssqlConnectionString } from './parse-mssql-connection-string';

@Injectable()
export class SecondaryPrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SecondaryPrismaService.name);

  constructor(config: ConfigService) {
    // const adapter = new PrismaMssql(
    //   config.getOrThrow<string>('DATABASE_URL_SECONDARY'),
    // );
    // // super({ adapter, log: [{ emit: 'event', level: 'query' }] });
    // super({ adapter });

    // // (this as any).$on('query', (e: any) => {
    // //   this.logger.debug(`SQL: ${e.query}`);
    // //   this.logger.debug(`Params: ${e.params}`);
    // //   this.logger.debug(`Duration: ${e.duration}ms`);
    // //   this.logger.debug(
    // //     `SQL (đã điền giá trị, copy paste vào SSMS):\n${interpolateSqlParams(e.query, e.params)}`,
    // //   );
    // // });
    const connectionConfig = parseMssqlConnectionString(
      config.getOrThrow<string>('DATABASE_URL_SECONDARY'),
    );
    const requestTimeout =
      Number(config.get('DB_SECONDARY_REQUEST_TIMEOUT_MS')) || 60_000;

    const adapter = new PrismaMssql({
      ...connectionConfig,
      requestTimeout,
    });
    super({
      adapter,
    });
    // super({
    //   adapter,
    //   log: [{ emit: 'event', level: 'query' }],
    // });

    // (this as any).$on('query', (e: any) => {
    //   this.logger.debug(`SQL: ${e.query}`);
    //   this.logger.debug(`Params: ${e.params}`);
    //   this.logger.debug(`Duration: ${e.duration}ms`);
    //   this.logger.debug(
    //     `SQL (đã điền giá trị, copy paste vào SSMS):\n${interpolateSqlParams(e.query, e.params)}`,
    //   );
    // });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Secondary Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
