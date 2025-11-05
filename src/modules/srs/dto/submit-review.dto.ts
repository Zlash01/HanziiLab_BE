import { IsInt, IsNumber, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitReviewDto {
  @ApiProperty({
    description: 'Question ID being reviewed',
    example: 1,
  })
  @IsInt()
  questionId: number;

  @ApiProperty({
    description:
      'Quality of recall (0-5): 0=complete blackout, 1=incorrect but remembered, 2=incorrect but easy to recall, 3=correct with difficulty, 4=correct after hesitation, 5=perfect recall',
    example: 4,
    minimum: 0,
    maximum: 5,
  })
  @IsNumber()
  @Min(0)
  @Max(5)
  quality: number;
}
