import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { HskLevel } from '../enums/hsk-level.enum';

export class UpdateCourseDto {
  @IsOptional()
  @IsEnum(HskLevel)
  hskLevel?: HskLevel;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalLessons?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  prerequisiteCourseId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  orderIndex?: number;
}
