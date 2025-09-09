import { IsInt, Min } from 'class-validator';
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
}