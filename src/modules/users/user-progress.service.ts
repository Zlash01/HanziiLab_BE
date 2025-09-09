import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, LessThanOrEqual } from 'typeorm';
import { UserLessonProgress, LessonProgressStatus } from './entities/user-lesson-progress.entity';
import { User } from './entities/user.entity';
import { Lessons } from '../lessons/entities/lesson.entities';
import { Courses } from '../courses/entities/course.entities';

@Injectable()
export class UserProgressService {
  constructor(
    @InjectRepository(UserLessonProgress)
    private userLessonProgressRepository: Repository<UserLessonProgress>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Lessons)
    private lessonsRepository: Repository<Lessons>,
    @InjectRepository(Courses)
    private coursesRepository: Repository<Courses>,
  ) {}

  // Mark lesson as completed
  async completeLesson(userId: number, lessonId: number): Promise<UserLessonProgress> {
    // Verify user and lesson exist
    const [user, lesson] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.lessonsRepository.findOne({ where: { id: lessonId } }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Find or create progress record
    let progress = await this.userLessonProgressRepository.findOne({
      where: { userId, lessonId },
    });

    if (!progress) {
      progress = this.userLessonProgressRepository.create({
        userId,
        lessonId,
        status: LessonProgressStatus.COMPLETED,
        completedAt: new Date(),
      });
    } else {
      progress.status = LessonProgressStatus.COMPLETED;
      progress.completedAt = new Date();
    }

    return this.userLessonProgressRepository.save(progress);
  }

  // Get user's progress for a specific lesson
  async getLessonProgress(userId: number, lessonId: number): Promise<UserLessonProgress | null> {
    return this.userLessonProgressRepository.findOne({
      where: { userId, lessonId },
      relations: ['lesson'],
    });
  }

  // Get user's progress for all lessons in a course
  async getCourseProgress(userId: number, courseId: number): Promise<{
    totalLessons: number;
    completedLessons: number;
    progress: UserLessonProgress[];
  }> {
    // Get all lessons in the course
    const lessons = await this.lessonsRepository.find({
      where: { courseId, isActive: true },
      order: { orderIndex: 'ASC' },
    });

    const totalLessons = lessons.length;

    if (totalLessons === 0) {
      return { totalLessons: 0, completedLessons: 0, progress: [] };
    }

    const lessonIds = lessons.map(lesson => lesson.id);

    // Get user's progress for these lessons
    const progress = await this.userLessonProgressRepository.find({
      where: { userId, lessonId: In(lessonIds) },
      relations: ['lesson'],
      order: { lesson: { orderIndex: 'ASC' } },
    });

    const completedLessons = progress.filter(p => p.status === LessonProgressStatus.COMPLETED).length;

    return { totalLessons, completedLessons, progress };
  }

  // Get user's overall progress across all courses
  async getUserOverallProgress(userId: number): Promise<{
    courses: Array<{
      courseId: number;
      courseName: string;
      totalLessons: number;
      completedLessons: number;
      isCompleted: boolean;
    }>;
  }> {
    const courses = await this.coursesRepository.find({
      where: { isActive: true },
      order: { hskLevel: 'ASC', orderIndex: 'ASC' },
    });

    const courseProgress = await Promise.all(
      courses.map(async (course) => {
        const { totalLessons, completedLessons } = await this.getCourseProgress(userId, course.id);
        return {
          courseId: course.id,
          courseName: course.title,
          totalLessons,
          completedLessons,
          isCompleted: completedLessons === totalLessons && totalLessons > 0,
        };
      })
    );

    return { courses: courseProgress };
  }

  // Get next lesson user should study (sequential progression)
  async getNextLesson(userId: number): Promise<Lessons | null> {
    // Get user's current HSK level
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get courses for current HSK level and below, in order
    const courses = await this.coursesRepository.find({
      where: { hskLevel: LessThanOrEqual(user.currentHskLevel), isActive: true },
      order: { hskLevel: 'ASC', orderIndex: 'ASC' },
    });

    for (const course of courses) {
      // Check if course prerequisites are met
      if (course.prerequisiteCourseId) {
        const { completedLessons, totalLessons } = await this.getCourseProgress(userId, course.prerequisiteCourseId);
        if (completedLessons !== totalLessons || totalLessons === 0) {
          continue; // Skip this course, prerequisite not completed
        }
      }

      // Get lessons in this course
      const lessons = await this.lessonsRepository.find({
        where: { courseId: course.id, isActive: true },
        order: { orderIndex: 'ASC' },
      });

      // Find first incomplete lesson
      for (const lesson of lessons) {
        const progress = await this.userLessonProgressRepository.findOne({
          where: { userId, lessonId: lesson.id },
        });

        if (!progress || progress.status !== LessonProgressStatus.COMPLETED) {
          return lesson;
        }
      }
    }

    return null; // No next lesson available
  }

  // Check if user can access a lesson (prerequisites met)
  async canAccessLesson(userId: number, lessonId: number): Promise<boolean> {
    const lesson = await this.lessonsRepository.findOne({
      where: { id: lessonId },
      relations: ['course'],
    });

    if (!lesson) {
      return false;
    }

    // Get user
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return false;
    }

    // Check HSK level requirement
    if (lesson.course.hskLevel > user.currentHskLevel) {
      return false;
    }

    // Check course prerequisite
    if (lesson.course.prerequisiteCourseId) {
      const { completedLessons, totalLessons } = await this.getCourseProgress(userId, lesson.course.prerequisiteCourseId);
      if (completedLessons !== totalLessons || totalLessons === 0) {
        return false;
      }
    }

    // Check if previous lessons in same course are completed
    const previousLessons = await this.lessonsRepository.find({
      where: { 
        courseId: lesson.courseId, 
        orderIndex: LessThan(lesson.orderIndex),
        isActive: true 
      },
    });

    for (const prevLesson of previousLessons) {
      const progress = await this.userLessonProgressRepository.findOne({
        where: { userId, lessonId: prevLesson.id },
      });

      if (!progress || progress.status !== LessonProgressStatus.COMPLETED) {
        return false;
      }
    }

    return true;
  }
}