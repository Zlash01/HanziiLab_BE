import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { HskLevel } from '../enums/hsk-level.enum';

export class CreateCourseDto {
  @IsNotEmpty()
  @IsEnum(HskLevel)
  hskLevel: HskLevel;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalLessons?: number = 0;

  @IsOptional()
  @IsInt()
  @Min(1)
  prerequisiteCourseId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  orderIndex: number;
}
