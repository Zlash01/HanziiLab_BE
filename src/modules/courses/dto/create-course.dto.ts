import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HskLevel } from '../enums/hsk-level.enum';

export class CreateCourseDto {
  @ApiProperty({
    enum: HskLevel,
    description: 'HSK level for the course (1-9)',
    example: HskLevel.HSK1,
    enumName: 'HskLevel',
  })
  @IsNotEmpty()
  @IsEnum(HskLevel)
  hskLevel: HskLevel;

  @ApiProperty({
    description: 'Course title',
    example: 'HSK 1 - Basic Chinese Characters',
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Course description',
    example: 'Introduction to basic Chinese characters and pronunciation',
    type: String,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'ID of prerequisite course (must exist)',
    example: 1,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  prerequisiteCourseId?: number;

  @ApiPropertyOptional({
    description: 'Whether the course is active',
    example: true,
    default: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    description: 'Order index for sorting courses (auto-incremented if not provided)',
    example: 1,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  orderIndex?: number;
}
