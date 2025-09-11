import { IsOptional, IsEnum, IsArray } from 'class-validator';
import { SourceType } from '../entities/embedding.entity';

export class ProcessContentDto {
  @IsOptional()
  @IsArray()
  @IsEnum(SourceType, { each: true })
  sourceTypes?: SourceType[];

  @IsOptional()
  clearExisting?: boolean = true;
}