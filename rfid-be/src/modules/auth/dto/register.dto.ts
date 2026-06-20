import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Username không được để trống' })
  @MinLength(3, { message: 'Username phải có ít nhất 3 ký tự' })
  @MaxLength(50, { message: 'Username không được vượt quá 50 ký tự' })
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message: 'Username chỉ được chứa chữ, số, dấu chấm và gạch dưới',
  })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Password không được để trống' })
  @MinLength(4, { message: 'Password phải có ít nhất 4 ký tự' })
  @MaxLength(100, { message: 'Password không được vượt quá 100 ký tự' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Tên không được vượt quá 100 ký tự' })
  name?: string;

  @IsOptional()
  @IsString()
  adminSecret?: string;
}
