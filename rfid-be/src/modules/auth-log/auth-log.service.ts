import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export type AuthLogAction = 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'REFRESH_TOKEN';
export type AuthLogStatus = 'SUCCESS' | 'FAILED';

export interface LogAuthEventInput {
  userId?: string;
  username?: string;
  action: AuthLogAction;
  status: AuthLogStatus;
  message?: string;
  deviceId?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthLogService {
  private readonly logger = new Logger(AuthLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: LogAuthEventInput): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO dbo.auth_logs
          (id, userId, username, action, status, message, deviceId, ipAddress, createdAt)
        VALUES
          (NEWID(), ${input.userId ?? null}, ${input.username ?? null},
           ${input.action}, ${input.status}, ${input.message ?? null},
           ${input.deviceId ?? null}, ${input.ipAddress ?? null}, ${new Date()})
      `;
    } catch (error) {
      this.logger.error('Failed to write auth log', error as Error);
    }
  }
}
