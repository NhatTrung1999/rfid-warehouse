import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class UpdateCheckExportDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  epcs: string[];
}
