import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SrsController } from './srs.controller';
import { SrsService } from './srs.service';
import { UserQuestionReview } from './entities/user-question-review.entity';
import { Question } from '../lessons/entities/question.entity';
import { Lessons } from '../lessons/entities/lesson.entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserQuestionReview, Question, Lessons]),
  ],
  controllers: [SrsController],
  providers: [SrsService],
  exports: [SrsService], // Export for use in other modules (e.g., users module)
})
export class SrsModule {}
