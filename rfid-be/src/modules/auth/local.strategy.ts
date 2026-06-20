import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ passReqToCallback: true });
  }

  async validate(
    req: ExpressRequest,
    username: string,
    password: string,
  ): Promise<any> {
    const ipAddress = req.ip;
    const user = await this.authService.validateUser(
      username,
      password,
      ipAddress,
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    const body = req.body as { deviceId?: string; deviceName?: string };
    return {
      ...user,
      deviceId: body?.deviceId,
      deviceName: body?.deviceName,
      ipAddress,
    };
  }
}
