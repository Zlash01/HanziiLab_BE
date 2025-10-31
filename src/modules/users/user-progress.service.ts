import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
  async completeLesson(userId: number, lessonId: number, scorePercentage: number): Promise<UserLessonProgress> {
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

    const now = new Date();

    if (!progress) {
      progress = this.userLessonProgressRepository.create({
        userId,
        lessonId,
        status: LessonProgressStatus.COMPLETED,
        scorePercentage,
        completedAt: now,
      });
    } else {
      progress.status = LessonProgressStatus.COMPLETED;
      progress.scorePercentage = scorePercentage;
      progress.completedAt = now;
    }

    const savedProgress = await this.userLessonProgressRepository.save(progress);

    // Update study streak automatically
    await this.updateStudyStreak(userId, now);

    return savedProgress;
  }

  // Update study streak logic (private method)
  private async updateStudyStreak(userId: number, currentDate: Date): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return;
    }

    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    // If no last study date, this is the first study session
    if (!user.lastStudyDate) {
      user.currentStreak = 1;
      user.longestStreak = 1;
      user.totalStudyDays = 1;
      user.lastStudyDate = today;
      await this.userRepository.save(user);
      return;
    }

    const lastStudy = new Date(user.lastStudyDate);
    lastStudy.setHours(0, 0, 0, 0); // Normalize to start of day

    const daysDifference = Math.floor((today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDifference === 0) {
      // Same day, no changes to streak but they studied
      return;
    } else if (daysDifference === 1) {
      // Next consecutive day - increment streak
      user.currentStreak += 1;
      user.totalStudyDays += 1;
    } else {
      // More than 1 day gap - reset streak
      user.currentStreak = 1;
      user.totalStudyDays += 1;
    }

    // Update longest streak if current exceeds it
    if (user.currentStreak > user.longestStreak) {
      user.longestStreak = user.currentStreak;
    }

    user.lastStudyDate = today;
    await this.userRepository.save(user);
  }

  // Get user's progress for a specific lesson
  async getLessonProgress(userId: number, lessonId: number): Promise<UserLessonProgress | null> {
    return this.userLessonProgressRepository.findOne({
      where: { userId, lessonId },
      relations: ['lesson'],
    });
  }

  // Get user's progress for all lessons in a course
  async getCourseProgress(userId: number, courseId: number): Promise<Array<{
    lessonId: number;
    name: string;
    status: LessonProgressStatus;
    scorePercentage: number | null;
    completedAt: Date | null;
  }>> {
    // Get all lessons in the course
    const lessons = await this.lessonsRepository.find({
      where: { courseId, isActive: true },
      order: { orderIndex: 'ASC' },
    });

    if (lessons.length === 0) {
      return [];
    }

    const lessonIds = lessons.map(lesson => lesson.id);

    // Get user's progress for these lessons
    const progressRecords = await this.userLessonProgressRepository.find({
      where: { userId, lessonId: In(lessonIds) },
    });

    // Create a map for quick lookup
    const progressMap = new Map<number, UserLessonProgress>();
    progressRecords.forEach(p => progressMap.set(p.lessonId, p));

    // Build response with all lessons
    return lessons.map(lesson => {
      const progress = progressMap.get(lesson.id);
      return {
        lessonId: lesson.id,
        name: lesson.name,
        status: progress?.status || LessonProgressStatus.NOT_STARTED,
        scorePercentage: progress?.scorePercentage ?? null,
        completedAt: progress?.completedAt ?? null,
      };
    });
  }

  // Get user's study info (streak and study days)
  async getStudyInfo(userId: number): Promise<{
    currentStreak: number;
    longestStreak: number;
    totalStudyDays: number;
    lastStudyDate: Date | null;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalStudyDays: user.totalStudyDays,
      lastStudyDate: user.lastStudyDate,
    };
  }

}