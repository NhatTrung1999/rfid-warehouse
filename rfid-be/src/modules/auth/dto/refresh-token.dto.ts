import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'refreshToken không được để trống' })
  refreshToken: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
