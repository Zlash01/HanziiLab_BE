import {
  IsInt,
  IsBoolean,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateLessonWordDto {
  @IsInt()
  @Min(1)
  wordSenseId: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = false;

  @IsInt()
  @Min(0)
  orderIndex: number;
}

export class UpdateLessonWordDto {
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}