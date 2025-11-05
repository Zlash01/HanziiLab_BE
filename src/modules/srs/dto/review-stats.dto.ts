import { ApiProperty } from '@nestjs/swagger';

export class ReviewStatsDto {
  @ApiProperty({
    description: 'Total questions in review pool',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Questions due for review today',
    example: 25,
  })
  due: number;

  @ApiProperty({
    description: 'Questions in learning phase (repetitions < 3)',
    example: 40,
  })
  learning: number;

  @ApiProperty({
    description: 'Mature questions (repetitions >= 3)',
    example: 110,
  })
  mature: number;

  @ApiProperty({
    description: 'Average ease factor across all questions',
    example: 2.45,
  })
  averageEaseFactor: number;
}

export class LessonReviewStatsDto {
  @ApiProperty({
    description: 'Lesson ID',
    example: 1,
  })
  lessonId: number;

  @ApiProperty({
    description: 'Lesson name',
    example: 'Introduction to Greetings',
  })
  lessonName: string;

  @ApiProperty({
    description: 'Total questions from this lesson',
    example: 10,
  })
  totalQuestions: number;

  @ApiProperty({
    description: 'Questions due from this lesson',
    example: 3,
  })
  dueQuestions: number;

  @ApiProperty({
    description: 'Average ease factor for this lesson',
    example: 2.6,
  })
  averageEaseFactor: number;
}

export class DueReviewDto {
  @ApiProperty({
    description: 'Question ID',
    example: 1,
  })
  questionId: number;

  @ApiProperty({
    description: 'Lesson ID',
    example: 1,
  })
  lessonId: number;

  @ApiProperty({
    description: 'Question type',
    example: 'question_selection_text_text',
  })
  questionType: string;

  @ApiProperty({
    description: 'Question data (JSON)',
    example: { prompt: 'What is this?', choices: ['A', 'B', 'C'] },
  })
  data: Record<string, any>;

  @ApiProperty({
    description: 'Next review date',
    example: '2025-01-15T10:00:00Z',
  })
  nextReviewDate: Date;

  @ApiProperty({
    description: 'Current ease factor',
    example: 2.5,
  })
  easeFactor: number;

  @ApiProperty({
    description: 'Current interval (days)',
    example: 7,
  })
  interval: number;

  @ApiProperty({
    description: 'Consecutive correct repetitions',
    example: 2,
  })
  repetitions: number;
}

export class UpcomingReviewsDto {
  @ApiProperty({
    description: 'Date of upcoming reviews',
    example: '2025-01-16',
  })
  date: string;

  @ApiProperty({
    description: 'Number of reviews due on this date',
    example: 15,
  })
  count: number;
}
