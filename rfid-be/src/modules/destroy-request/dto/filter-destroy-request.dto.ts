import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterDestroyRequestDto {
  @IsOptional()
  @IsString()
  epc?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modelName?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stage?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  season?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  category?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  article?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fd?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  location?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  status?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  noticeNo?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}
