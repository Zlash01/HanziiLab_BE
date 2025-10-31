import { IsInt, Min, IsNumber, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteLessonDto {
  @ApiProperty({
    description: 'ID of the lesson to mark as completed',
    example: 1,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  lessonId: number;

  @ApiProperty({
    description: 'Score percentage (0-100) for the lesson completion',
    example: 85.5,
    minimum: 0,
    maximum: 100,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  scorePercentage: number;
}