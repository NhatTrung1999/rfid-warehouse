import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID, createHash } from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/common/enums/role.enum';
import { AuthLogService } from '../auth-log/auth-log.service';

interface AuthUser {
  id: string;
  username: string;
  role: string;
  deviceId?: string;
  deviceName?: string;
}

interface StoredRefreshToken {
  id: string;
  tokenHash: string;
  deviceId: string | null;
  deviceName: string | null;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

interface RegisterInput {
  username: string;
  password: string;
  name?: string;
  adminSecret?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
    private authLogService: AuthLogService,
  ) {}

  async register(input: RegisterInput, ipAddress?: string) {
    const role = this.resolveRole(input.adminSecret);

    try {
      const user = await this.usersService.create({
        username: input.username,
        password: input.password,
        name: input.name,
        role,
      });

      await this.authLogService.log({
        userId: user.id,
        username: user.username,
        action: 'REGISTER',
        status: 'SUCCESS',
        ipAddress,
      });

      return user;
    } catch (error) {
      await this.authLogService.log({
        username: input.username,
        action: 'REGISTER',
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Đăng ký thất bại',
        ipAddress,
      });
      throw error;
    }
  }

  private resolveRole(adminSecret?: string): Role {
    const configuredSecret = this.configService.get<string>(
      'ADMIN_REGISTER_SECRET',
    );

    if (configuredSecret && adminSecret && adminSecret === configuredSecret) {
      return Role.ADMIN;
    }
    return Role.USER;
  }

  async validateUser(
    username: string,
    password: string,
    ipAddress?: string,
  ): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      await this.authLogService.log({
        username,
        action: 'LOGIN',
        status: 'FAILED',
        message: 'Username không tồn tại',
        ipAddress,
      });
      return null;
    }

    const isMatch = await this.usersService.validatePassword(
      password,
      user.password,
    );
    if (!isMatch) {
      await this.authLogService.log({
        userId: user.id,
        username,
        action: 'LOGIN',
        status: 'FAILED',
        message: 'Sai mật khẩu',
        ipAddress,
      });
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: AuthUser, ipAddress?: string) {
    if (user.deviceId) {
      await this.prisma.$executeRaw`
        UPDATE dbo.refresh_tokens
        SET revokedAt = ${new Date()}, updatedAt = ${new Date()}
        WHERE userId = ${user.id}
          AND deviceId = ${user.deviceId}
          AND revokedAt IS NULL
      `;
    }

    const accessToken = this.signAccessToken(user.id, user.username, user.role);
    const refreshToken = await this.createRefreshToken(
      user.id,
      user.deviceId,
      user.deviceName,
    );

    await this.authLogService.log({
      userId: user.id,
      username: user.username,
      action: 'LOGIN',
      status: 'SUCCESS',
      deviceId: user.deviceId,
      ipAddress,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string, deviceId?: string, ipAddress?: string) {
    const tokenHash = this.hashToken(refreshToken);

    const rows = await this.prisma.$queryRaw<StoredRefreshToken[]>`
      SELECT id, tokenHash, deviceId, deviceName, userId, expiresAt, revokedAt
      FROM dbo.refresh_tokens
      WHERE tokenHash = ${tokenHash}
    `;
    const stored = rows[0];

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      await this.authLogService.log({
        userId: stored?.userId,
        action: 'REFRESH_TOKEN',
        status: 'FAILED',
        message: 'Refresh token không hợp lệ hoặc đã hết hạn',
        deviceId,
        ipAddress,
      });
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }

    const user = await this.usersService.findById(stored.userId);
    if (!user) {
      await this.authLogService.log({
        userId: stored.userId,
        action: 'REFRESH_TOKEN',
        status: 'FAILED',
        message: 'User không tồn tại',
        deviceId,
        ipAddress,
      });
      throw new UnauthorizedException('User không tồn tại');
    }

    await this.prisma.$executeRaw`
      UPDATE dbo.refresh_tokens
      SET revokedAt = ${new Date()}, updatedAt = ${new Date()}
      WHERE id = ${stored.id}
    `;

    const accessToken = this.signAccessToken(user.id, user.username, user.role);
    const newRefreshToken = await this.createRefreshToken(
      user.id,
      deviceId ?? stored.deviceId ?? undefined,
      stored.deviceName ?? undefined,
    );

    await this.authLogService.log({
      userId: user.id,
      username: user.username,
      action: 'REFRESH_TOKEN',
      status: 'SUCCESS',
      deviceId,
      ipAddress,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async logout(refreshToken: string, ipAddress?: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.$executeRaw`
      UPDATE dbo.refresh_tokens
      SET revokedAt = ${new Date()}, updatedAt = ${new Date()}
      WHERE tokenHash = ${tokenHash} AND revokedAt IS NULL
    `;

    await this.authLogService.log({
      action: 'LOGOUT',
      status: 'SUCCESS',
      ipAddress,
    });

    return { success: true };
  }

  private signAccessToken(userId: string, username: string, role: string) {
    const payload = { sub: userId, username, role };
    return this.jwtService.sign(payload);
  }

  private async createRefreshToken(
    userId: string,
    deviceId?: string,
    deviceName?: string,
  ): Promise<string> {
    const rawToken = randomUUID() + randomUUID();
    const tokenHash = this.hashToken(rawToken);

    const expiresInDays = Number(
      this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN_DAYS', '30'),
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    const now = new Date();

    await this.prisma.$executeRaw`
      INSERT INTO dbo.refresh_tokens
        (id, tokenHash, deviceId, deviceName, userId, expiresAt, createdAt, updatedAt)
      VALUES
        (NEWID(), ${tokenHash}, ${deviceId ?? null}, ${deviceName ?? null}, ${userId}, ${expiresAt}, ${now}, ${now})
    `;

    return rawToken;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
