import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lessons } from './entities/lesson.entities';
import { LessonWord } from './entities/lesson-word.entity';
import { LessonGrammarPattern } from './entities/lesson-grammar-pattern.entity';
import { Content } from './entities/content.entity';
import { Question } from './entities/question.entity';
import { WordSense } from '../words/entities/word-sense.entity';
import { GrammarPattern } from '../grammar/entities/grammar-pattern.entity';
import { Courses } from '../courses/entities/course.entities';
import { LessonsService } from './lessons.service';
import { ContentService } from './content.service';
import { QuestionsService } from './questions.service';
import { LessonsController } from './lessons.controller';
import { ContentController } from './content.controller';
import { QuestionsController } from './questions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Lessons, LessonWord, LessonGrammarPattern, Content, Question, WordSense, GrammarPattern, Courses])],
  controllers: [LessonsController, ContentController, QuestionsController],
  providers: [LessonsService, ContentService, QuestionsService],
  exports: [LessonsService, ContentService, QuestionsService],
})
export class LessonsModule {}
