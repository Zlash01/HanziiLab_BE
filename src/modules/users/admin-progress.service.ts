import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserLessonProgress, LessonProgressStatus } from './entities/user-lesson-progress.entity';
import { User } from './entities/user.entity';
import { Lessons } from '../lessons/entities/lesson.entities';
import { Courses } from '../courses/entities/course.entities';

@Injectable()
export class AdminProgressService {
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

  // Platform-wide overview statistics
  async getOverviewStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalCompletions: number;
    averageScore: number;
    averageStreak: number;
    topUsers: Array<{ userId: number; displayName: string; metric: number }>;
  }> {
    // Get user counts
    const [totalUsers, activeUsers] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
    ]);

    // Get total completions
    const totalCompletions = await this.userLessonProgressRepository.count({
      where: { status: LessonProgressStatus.COMPLETED },
    });

    // Calculate average score
    const scoreResult = await this.userLessonProgressRepository
      .createQueryBuilder('progress')
      .select('AVG(progress.score_percentage)', 'avg')
      .where('progress.status = :status', { status: LessonProgressStatus.COMPLETED })
      .andWhere('progress.score_percentage IS NOT NULL')
      .getRawOne();
    const averageScore = scoreResult?.avg ? parseFloat(scoreResult.avg) : 0;

    // Calculate average streak
    const streakResult = await this.userRepository
      .createQueryBuilder('user')
      .select('AVG(user.current_streak)', 'avg')
      .getRawOne();
    const averageStreak = streakResult?.avg ? parseFloat(streakResult.avg) : 0;

    // Get top users by longest streak
    const topUsersRaw = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id as userId', 'user.display_name as displayName', 'user.longest_streak as metric'])
      .orderBy('user.longest_streak', 'DESC')
      .limit(10)
      .getRawMany<{ userId: number; displayName: string; metric: number }>();

    const topUsers = topUsersRaw.map(u => ({
      userId: u.userId,
      displayName: u.displayName,
      metric: u.metric,
    }));

    return {
      totalUsers,
      activeUsers,
      totalCompletions,
      averageScore: Math.round(averageScore * 100) / 100,
      averageStreak: Math.round(averageStreak * 100) / 100,
      topUsers,
    };
  }

  // Get detailed progress for a specific user
  async getUserProgressDetails(userId: number): Promise<{
    user: {
      id: number;
      email: string;
      displayName: string;
      currentHskLevel: number;
    };
    studyInfo: {
      currentStreak: number;
      longestStreak: number;
      totalStudyDays: number;
      lastStudyDate: Date | null;
    };
    completedLessons: Array<{
      lessonId: number;
      lessonTitle: string;
      courseId: number;
      courseTitle: string;
      scorePercentage: number;
      completedAt: Date;
    }>;
    courseBreakdown: Array<{
      courseId: number;
      courseTitle: string;
      totalLessons: number;
      completedLessons: number;
      averageScore: number;
    }>;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get all completed lessons with details
    const completedLessons = await this.userLessonProgressRepository
      .createQueryBuilder('progress')
      .innerJoinAndSelect('progress.lesson', 'lesson')
      .innerJoinAndSelect('lesson.course', 'course')
      .where('progress.userId = :userId', { userId })
      .andWhere('progress.status = :status', { status: LessonProgressStatus.COMPLETED })
      .orderBy('progress.completedAt', 'DESC')
      .getMany();

    const completedLessonsData = completedLessons.map(p => ({
      lessonId: p.lessonId,
      lessonTitle: p.lesson.name,
      courseId: p.lesson.courseId,
      courseTitle: p.lesson.course.title,
      scorePercentage: p.scorePercentage || 0,
      completedAt: p.completedAt!,
    }));

    // Get course breakdown
    const courses = await this.coursesRepository.find({ where: { isActive: true } });
    const courseBreakdown = await Promise.all(
      courses.map(async (course) => {
        const lessons = await this.lessonsRepository.find({
          where: { courseId: course.id, isActive: true },
        });
        const lessonIds = lessons.map(l => l.id);

        const completed = await this.userLessonProgressRepository
          .createQueryBuilder('progress')
          .where('progress.userId = :userId', { userId })
          .andWhere('progress.lessonId IN (:...lessonIds)', { lessonIds })
          .andWhere('progress.status = :status', { status: LessonProgressStatus.COMPLETED })
          .getMany();

        const avgScore = completed.length > 0
          ? completed.reduce((sum, p) => sum + (p.scorePercentage || 0), 0) / completed.length
          : 0;

        return {
          courseId: course.id,
          courseTitle: course.title,
          totalLessons: lessons.length,
          completedLessons: completed.length,
          averageScore: Math.round(avgScore * 100) / 100,
        };
      })
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        currentHskLevel: user.currentHskLevel,
      },
      studyInfo: {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        totalStudyDays: user.totalStudyDays,
        lastStudyDate: user.lastStudyDate,
      },
      completedLessons: completedLessonsData,
      courseBreakdown,
    };
  }

  // Course analytics
  async getCourseAnalytics(courseId: number): Promise<{
    course: {
      id: number;
      title: string;
      hskLevel: number;
    };
    totalLessons: number;
    usersStarted: number;
    usersCompleted: number;
    averageCompletionRate: number;
    lessonStats: Array<{
      lessonId: number;
      lessonTitle: string;
      completionCount: number;
      averageScore: number;
    }>;
  }> {
    const course = await this.coursesRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const lessons = await this.lessonsRepository.find({
      where: { courseId, isActive: true },
      order: { orderIndex: 'ASC' },
    });

    const lessonIds = lessons.map(l => l.id);

    // Count unique users who started (have at least one lesson completed)
    const usersStartedResult = await this.userLessonProgressRepository
      .createQueryBuilder('progress')
      .select('COUNT(DISTINCT progress.userId)', 'count')
      .where('progress.lessonId IN (:...lessonIds)', { lessonIds })
      .andWhere('progress.status = :status', { status: LessonProgressStatus.COMPLETED })
      .getRawOne();
    const usersStarted = parseInt(usersStartedResult?.count || '0');

    // Count users who completed all lessons
    const completionData = await this.userLessonProgressRepository
      .createQueryBuilder('progress')
      .select('progress.userId', 'userId')
      .addSelect('COUNT(progress.id)', 'completed')
      .where('progress.lessonId IN (:...lessonIds)', { lessonIds })
      .andWhere('progress.status = :status', { status: LessonProgressStatus.COMPLETED })
      .groupBy('progress.userId')
      .getRawMany();

    const usersCompleted = completionData.filter(
      d => parseInt(d.completed) === lessons.length
    ).length;

    // Calculate average completion rate
    const totalPossible = usersStarted * lessons.length;
    const totalCompleted = completionData.reduce(
      (sum, d) => sum + parseInt(d.completed),
      0
    );
    const averageCompletionRate = totalPossible > 0
      ? (totalCompleted / totalPossible) * 100
      : 0;

    // Get per-lesson stats
    const lessonStats = await Promise.all(
      lessons.map(async (lesson) => {
        const stats = await this.userLessonProgressRepository
          .createQueryBuilder('progress')
          .select('COUNT(progress.id)', 'count')
          .addSelect('AVG(progress.score_percentage)', 'avgScore')
          .where('progress.lessonId = :lessonId', { lessonId: lesson.id })
          .andWhere('progress.status = :status', { status: LessonProgressStatus.COMPLETED })
          .getRawOne();

        return {
          lessonId: lesson.id,
          lessonTitle: lesson.name,
          completionCount: parseInt(stats?.count || '0'),
          averageScore: stats?.avgScore ? Math.round(parseFloat(stats.avgScore) * 100) / 100 : 0,
        };
      })
    );

    return {
      course: {
        id: course.id,
        title: course.title,
        hskLevel: course.hskLevel,
      },
      totalLessons: lessons.length,
      usersStarted,
      usersCompleted,
      averageCompletionRate: Math.round(averageCompletionRate * 100) / 100,
      lessonStats,
    };
  }

  // Lesson analytics
  async getLessonAnalytics(lessonId: number): Promise<{
    lesson: {
      id: number;
      title: string;
      courseId: number;
      courseTitle: string;
    };
    totalCompletions: number;
    averageScore: number;
    scoreDistribution: {
      range: string;
      count: number;
    }[];
    recentCompletions: Array<{
      userId: number;
      displayName: string;
      scorePercentage: number;
      completedAt: Date;
    }>;
  }> {
    const lesson = await this.lessonsRepository.findOne({
      where: { id: lessonId },
      relations: ['course'],
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Get completion stats
    const stats = await this.userLessonProgressRepository
      .createQueryBuilder('progress')
      .select('COUNT(progress.id)', 'count')
      .addSelect('AVG(progress.score_percentage)', 'avgScore')
      .where('progress.lessonId = :lessonId', { lessonId })
      .andWhere('progress.status = :status', { status: LessonProgressStatus.COMPLETED })
      .getRawOne();

    const totalCompletions = parseInt(stats?.count || '0');
    const averageScore = stats?.avgScore ? parseFloat(stats.avgScore) : 0;

    // Get score distribution
    const completions = await this.userLessonProgressRepository.find({
      where: { lessonId, status: LessonProgressStatus.COMPLETED },
      select: ['scorePercentage'],
    });

    const distribution = [
      { range: '0-20', count: 0 },
      { range: '21-40', count: 0 },
      { range: '41-60', count: 0 },
      { range: '61-80', count: 0 },
      { range: '81-100', count: 0 },
    ];

    completions.forEach(c => {
      const score = c.scorePercentage || 0;
      if (score <= 20) distribution[0].count++;
      else if (score <= 40) distribution[1].count++;
      else if (score <= 60) distribution[2].count++;
      else if (score <= 80) distribution[3].count++;
      else distribution[4].count++;
    });

    // Get recent completions with user info
    const recentCompletions = await this.userLessonProgressRepository
      .createQueryBuilder('progress')
      .innerJoinAndSelect('progress.user', 'user')
      .where('progress.lessonId = :lessonId', { lessonId })
      .andWhere('progress.status = :status', { status: LessonProgressStatus.COMPLETED })
      .orderBy('progress.completedAt', 'DESC')
      .limit(10)
      .getMany();

    const recentCompletionsData = recentCompletions.map(p => ({
      userId: p.userId,
      displayName: p.user.displayName,
      scorePercentage: p.scorePercentage || 0,
      completedAt: p.completedAt!,
    }));

    return {
      lesson: {
        id: lesson.id,
        title: lesson.name,
        courseId: lesson.courseId,
        courseTitle: lesson.course.title,
      },
      totalCompletions,
      averageScore: Math.round(averageScore * 100) / 100,
      scoreDistribution: distribution,
      recentCompletions: recentCompletionsData,
    };
  }

  // Leaderboard
  async getLeaderboard(limit: number = 20): Promise<{
    byStreak: Array<{ userId: number; displayName: string; longestStreak: number }>;
    byLessonsCompleted: Array<{ userId: number; displayName: string; lessonsCompleted: number }>;
    byAverageScore: Array<{ userId: number; displayName: string; averageScore: number }>;
  }> {
    // Top by longest streak
    const byStreakRaw = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id as userId', 'user.display_name as displayName', 'user.longest_streak as longestStreak'])
      .orderBy('user.longest_streak', 'DESC')
      .limit(limit)
      .getRawMany<{ userId: number; displayName: string; longestStreak: number }>();

    const byStreak = byStreakRaw.map(u => ({
      userId: u.userId,
      displayName: u.displayName,
      longestStreak: u.longestStreak,
    }));

    // Top by lessons completed
    const byLessonsCompletedRaw = await this.userLessonProgressRepository
      .createQueryBuilder('progress')
      .innerJoin('progress.user', 'user')
      .select('user.id', 'userId')
      .addSelect('user.display_name', 'displayName')
      .addSelect('COUNT(progress.id)', 'lessonsCompleted')
      .where('progress.status = :status', { status: LessonProgressStatus.COMPLETED })
      .groupBy('user.id')
      .addGroupBy('user.display_name')
      .orderBy('lessonsCompleted', 'DESC')
      .limit(limit)
      .getRawMany();

    const byLessonsCompleted = byLessonsCompletedRaw.map(item => ({
      userId: item.userId,
      displayName: item.displayName,
      lessonsCompleted: parseInt(item.lessonsCompleted),
    }));

    // Top by average score
    const byAverageScoreRaw = await this.userLessonProgressRepository
      .createQueryBuilder('progress')
      .innerJoin('progress.user', 'user')
      .select('user.id', 'userId')
      .addSelect('user.display_name', 'displayName')
      .addSelect('AVG(progress.score_percentage)', 'averageScore')
      .where('progress.status = :status', { status: LessonProgressStatus.COMPLETED })
      .andWhere('progress.score_percentage IS NOT NULL')
      .groupBy('user.id')
      .addGroupBy('user.display_name')
      .orderBy('averageScore', 'DESC')
      .limit(limit)
      .getRawMany();

    const byAverageScore = byAverageScoreRaw.map(item => ({
      userId: item.userId,
      displayName: item.displayName,
      averageScore: Math.round(parseFloat(item.averageScore) * 100) / 100,
    }));

    return {
      byStreak,
      byLessonsCompleted,
      byAverageScore,
    };
  }
}
