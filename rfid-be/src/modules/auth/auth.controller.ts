import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from 'src/decorators/customes';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @ResponseMessage('Đăng ký tài khoản thành công')
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: ExpressRequest) {
    return this.authService.register(dto, req.ip);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @ResponseMessage('Đăng nhập thành công')
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user, req.user.ipAddress);
  }

  @Public()
  @ResponseMessage('Làm mới token thành công')
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: ExpressRequest) {
    return this.authService.refresh(dto.refreshToken, dto.deviceId, req.ip);
  }

  @Public()
  @ResponseMessage('Đăng xuất thành công')
  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto, @Req() req: ExpressRequest) {
    return this.authService.logout(dto.refreshToken, req.ip);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Lấy thông tin tài khoản thành công')
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
