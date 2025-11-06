import {
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateLessonWordDto {
  @IsInt()
  @Min(1)
  wordSenseId: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}

export class UpdateLessonWordDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}