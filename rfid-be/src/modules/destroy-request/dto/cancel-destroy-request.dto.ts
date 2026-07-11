import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class CancelDestroyRequestDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  epcs: string[];
}
