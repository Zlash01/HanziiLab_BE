import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { UserQuestionReview } from './entities/user-question-review.entity';
import { Question } from '../lessons/entities/question.entity';
import {
  ReviewStatsDto,
  LessonReviewStatsDto,
  DueReviewDto,
  UpcomingReviewsDto,
} from './dto/review-stats.dto';
import { SubmitReviewDto } from './dto/submit-review.dto';

@Injectable()
export class SrsService {
  constructor(
    @InjectRepository(UserQuestionReview)
    private userQuestionReviewRepository: Repository<UserQuestionReview>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  /**
   * SM-2 Algorithm: Calculate next review parameters
   * @param quality - Quality of recall (0-5)
   * @param easeFactor - Current ease factor
   * @param interval - Current interval in days
   * @param repetitions - Current number of consecutive correct answers
   * @returns Updated SM-2 parameters
   */
  private calculateNextReview(
    quality: number,
    easeFactor: number,
    interval: number,
    repetitions: number,
  ): {
    newEaseFactor: number;
    newInterval: number;
    newRepetitions: number;
  } {
    // Calculate new ease factor
    let newEaseFactor =
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Ensure ease factor doesn't go below 1.3
    if (newEaseFactor < 1.3) {
      newEaseFactor = 1.3;
    }

    let newInterval: number;
    let newRepetitions: number;

    if (quality < 3) {
      // Failed recall - restart the sequence
      newRepetitions = 0;
      newInterval = 1;
    } else {
      // Successful recall
      newRepetitions = repetitions + 1;

      if (newRepetitions === 1) {
        newInterval = 1;
      } else if (newRepetitions === 2) {
        newInterval = 6;
      } else {
        // For repetitions >= 3, multiply previous interval by ease factor
        newInterval = Math.round(interval * newEaseFactor);
      }
    }

    return {
      newEaseFactor: Math.round(newEaseFactor * 100) / 100, // Round to 2 decimal places
      newInterval,
      newRepetitions,
    };
  }

  /**
   * Initialize a question for review (called when lesson is completed)
   * @param userId - User ID
   * @param questionId - Question ID
   * @param lessonId - Lesson ID (denormalized for performance)
   */
  async initializeQuestionForReview(
    userId: number,
    questionId: number,
    lessonId: number,
  ): Promise<UserQuestionReview> {
    // Check if already exists
    const existing = await this.userQuestionReviewRepository.findOne({
      where: { userId, questionId },
    });

    if (existing) {
      return existing; // Already in review pool
    }

    // Verify question exists
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    // Create new review record with default SM-2 values
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Set to midnight

    const review = this.userQuestionReviewRepository.create({
      userId,
      questionId,
      lessonId,
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReviewDate: tomorrow,
      lastReviewedAt: null,
    });

    return this.userQuestionReviewRepository.save(review);
  }

  /**
   * Initialize all questions from a lesson when it's completed
   * @param userId - User ID
   * @param lessonId - Lesson ID
   */
  async initializeLessonQuestionsForReview(
    userId: number,
    lessonId: number,
  ): Promise<UserQuestionReview[]> {
    // Get all active questions for this lesson
    const questions = await this.questionRepository.find({
      where: { lessonId, isActive: true },
    });

    if (questions.length === 0) {
      return []; // No questions to initialize
    }

    // Initialize each question
    const reviews = await Promise.all(
      questions.map((question) =>
        this.initializeQuestionForReview(userId, question.id, lessonId),
      ),
    );

    return reviews;
  }

  /**
   * Submit a review result and update SM-2 parameters
   * @param userId - User ID
   * @param submitReviewDto - Review submission data
   */
  async submitReviewResult(
    userId: number,
    submitReviewDto: SubmitReviewDto,
  ): Promise<UserQuestionReview> {
    const { questionId, quality } = submitReviewDto;

    // Validate quality range
    if (quality < 0 || quality > 5) {
      throw new BadRequestException('Quality must be between 0 and 5');
    }

    // Find the review record
    const review = await this.userQuestionReviewRepository.findOne({
      where: { userId, questionId },
    });

    if (!review) {
      throw new NotFoundException(
        `Review record not found for question ${questionId}. Make sure the lesson is completed first.`,
      );
    }

    // ADD: Convert string to number (TypeORM returns DECIMAL as string)
    const currentEaseFactor = Number(review.easeFactor);
    const currentInterval = Number(review.interval);
    const currentRepetitions = Number(review.repetitions);

    // Calculate new SM-2 parameters
    const { newEaseFactor, newInterval, newRepetitions } =
      this.calculateNextReview(
        quality,
        currentEaseFactor,
        currentInterval,
        currentRepetitions,
      );

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
    nextReviewDate.setHours(0, 0, 0, 0); // Set to midnight

    // Update the review record
    review.easeFactor = newEaseFactor;
    review.interval = newInterval;
    review.repetitions = newRepetitions;
    review.nextReviewDate = nextReviewDate;
    review.lastReviewedAt = new Date();

    return this.userQuestionReviewRepository.save(review);
  }

  /**
   * Get all questions due for review today
   * @param userId - User ID
   */
  async getDueReviews(userId: number): Promise<DueReviewDto[]> {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    const reviews = await this.userQuestionReviewRepository.find({
      where: {
        userId,
        nextReviewDate: LessThanOrEqual(today),
      },
      relations: ['question'],
      order: { nextReviewDate: 'ASC' },
    });

    return reviews.map((review) => ({
      questionId: review.questionId,
      lessonId: review.lessonId,
      questionType: review.question.questionType,
      data: review.question.data,
      nextReviewDate: review.nextReviewDate,
      easeFactor: review.easeFactor,
      interval: review.interval,
      repetitions: review.repetitions,
    }));
  }

  /**
   * Get upcoming review schedule (next 30 days)
   * @param userId - User ID
   */
  async getUpcomingReviews(userId: number): Promise<UpcomingReviewsDto[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const reviews = await this.userQuestionReviewRepository
      .createQueryBuilder('review')
      .select('DATE(review.nextReviewDate)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('review.userId = :userId', { userId })
      .andWhere('review.nextReviewDate > :today', { today })
      .andWhere('review.nextReviewDate <= :thirtyDaysLater', {
        thirtyDaysLater,
      })
      .groupBy('DATE(review.nextReviewDate)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return reviews.map((row) => ({
      date: row.date,
      count: parseInt(row.count),
    }));
  }

  /**
   * Get review statistics for a user
   * @param userId - User ID
   */
  async getReviewStats(userId: number): Promise<ReviewStatsDto> {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const [total, due, learning, mature, avgEaseFactorResult] =
      await Promise.all([
        // Total questions in review pool
        this.userQuestionReviewRepository.count({
          where: { userId },
        }),

        // Questions due today
        this.userQuestionReviewRepository.count({
          where: {
            userId,
            nextReviewDate: LessThanOrEqual(today),
          },
        }),

        // Questions in learning phase (repetitions < 3)
        this.userQuestionReviewRepository.count({
          where: { userId },
          // Note: TypeORM doesn't support complex where conditions easily
          // We'll calculate this with a query builder
        }),

        // Mature questions (repetitions >= 3)
        this.userQuestionReviewRepository.count({
          where: { userId },
        }),

        // Average ease factor
        this.userQuestionReviewRepository
          .createQueryBuilder('review')
          .select('AVG(review.easeFactor)', 'avg')
          .where('review.userId = :userId', { userId })
          .getRawOne(),
      ]);

    // Get accurate counts for learning and mature
    const learningCount = await this.userQuestionReviewRepository
      .createQueryBuilder('review')
      .where('review.userId = :userId', { userId })
      .andWhere('review.repetitions < 3')
      .getCount();

    const matureCount = await this.userQuestionReviewRepository
      .createQueryBuilder('review')
      .where('review.userId = :userId', { userId })
      .andWhere('review.repetitions >= 3')
      .getCount();

    return {
      total,
      due,
      learning: learningCount,
      mature: matureCount,
      averageEaseFactor: avgEaseFactorResult?.avg
        ? parseFloat(avgEaseFactorResult.avg)
        : 2.5,
    };
  }

  /**
   * Get review statistics for a specific lesson
   * @param userId - User ID
   * @param lessonId - Lesson ID
   */
  async getLessonReviewStats(
    userId: number,
    lessonId: number,
  ): Promise<LessonReviewStatsDto> {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const [totalQuestions, dueQuestions, avgEaseFactorResult, lesson] =
      await Promise.all([
        this.userQuestionReviewRepository.count({
          where: { userId, lessonId },
        }),

        this.userQuestionReviewRepository.count({
          where: {
            userId,
            lessonId,
            nextReviewDate: LessThanOrEqual(today),
          },
        }),

        this.userQuestionReviewRepository
          .createQueryBuilder('review')
          .select('AVG(review.easeFactor)', 'avg')
          .where('review.userId = :userId', { userId })
          .andWhere('review.lessonId = :lessonId', { lessonId })
          .getRawOne(),

        // Get lesson name
        this.userQuestionReviewRepository
          .createQueryBuilder('review')
          .leftJoinAndSelect('review.lesson', 'lesson')
          .where('review.userId = :userId', { userId })
          .andWhere('review.lessonId = :lessonId', { lessonId })
          .getOne(),
      ]);

    return {
      lessonId,
      lessonName: lesson?.lesson?.name || 'Unknown Lesson',
      totalQuestions,
      dueQuestions,
      averageEaseFactor: avgEaseFactorResult?.avg
        ? parseFloat(avgEaseFactorResult.avg)
        : 2.5,
    };
  }

  /**
   * Reset a question review (for testing or if user wants to restart)
   * @param userId - User ID
   * @param questionId - Question ID
   */
  async resetQuestionReview(
    userId: number,
    questionId: number,
  ): Promise<UserQuestionReview> {
    const review = await this.userQuestionReviewRepository.findOne({
      where: { userId, questionId },
    });

    if (!review) {
      throw new NotFoundException(
        `Review record not found for question ${questionId}`,
      );
    }

    // Reset to initial values
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    review.easeFactor = 2.5;
    review.interval = 1;
    review.repetitions = 0;
    review.nextReviewDate = tomorrow;
    review.lastReviewedAt = null;

    return this.userQuestionReviewRepository.save(review);
  }
}
