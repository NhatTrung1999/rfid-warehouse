import { Module } from '@nestjs/common';
import { DestroyScanService } from './destroy-scan.service';
import { DestroyScanController } from './destroy-scan.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DestroyScanController],
  providers: [DestroyScanService],
})
export class DestroyScanModule {}
