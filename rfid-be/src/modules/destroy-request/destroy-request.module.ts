import { Module } from '@nestjs/common';
import { DestroyRequestService } from './destroy-request.service';
import { DestroyRequestController } from './destroy-request.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DestroyRequestController],
  providers: [DestroyRequestService],
})
export class DestroyRequestModule {}
