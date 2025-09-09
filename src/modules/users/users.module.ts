import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserProgressService } from './user-progress.service';
import { User } from './entities/user.entity';
import { UserLessonProgress } from './entities/user-lesson-progress.entity';
import { Lessons } from '../lessons/entities/lesson.entities';
import { Courses } from '../courses/entities/course.entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserLessonProgress, Lessons, Courses])],
  controllers: [UsersController],
  providers: [UsersService, UserProgressService],
  exports: [UsersService, UserProgressService], // Export so other modules can use them
})
export class UsersModule {}
