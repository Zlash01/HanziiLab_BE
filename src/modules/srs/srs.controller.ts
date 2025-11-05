import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JWTGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { SrsService } from './srs.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import {
  ReviewStatsDto,
  LessonReviewStatsDto,
  DueReviewDto,
  UpcomingReviewsDto,
} from './dto/review-stats.dto';

@ApiTags('Spaced Repetition System (SRS)')
@ApiBearerAuth()
@Controller('srs')
@UseGuards(JWTGuard, RolesGuard)
export class SrsController {
  constructor(private readonly srsService: SrsService) {}

  @ApiOperation({
    summary: 'Get questions due for review today',
    description:
      'Returns all questions that are scheduled for review today or overdue',
  })
  @ApiResponse({
    status: 200,
    description: 'Due reviews retrieved successfully',
    type: [DueReviewDto],
  })
  @Get('reviews/due')
  @Roles(Role.User, Role.Admin)
  async getDueReviews(@Req() req): Promise<DueReviewDto[]> {
    const userId = req.user.id;
    return this.srsService.getDueReviews(userId);
  }

  @ApiOperation({
    summary: 'Get upcoming review schedule',
    description:
      'Returns the number of reviews scheduled for each day in the next 30 days',
  })
  @ApiResponse({
    status: 200,
    description: 'Upcoming reviews retrieved successfully',
    type: [UpcomingReviewsDto],
  })
  @Get('reviews/upcoming')
  @Roles(Role.User, Role.Admin)
  async getUpcomingReviews(@Req() req): Promise<UpcomingReviewsDto[]> {
    const userId = req.user.id;
    return this.srsService.getUpcomingReviews(userId);
  }

  @ApiOperation({
    summary: 'Submit a review result',
    description:
      'Submit the quality of recall for a question and update SM-2 algorithm parameters. Quality scale: 0=complete blackout, 1=incorrect but remembered, 2=incorrect but easy to recall, 3=correct with difficulty, 4=correct after hesitation, 5=perfect recall',
  })
  @ApiBody({ type: SubmitReviewDto })
  @ApiResponse({
    status: 200,
    description: 'Review submitted successfully, next review scheduled',
  })
  @ApiResponse({
    status: 404,
    description:
      'Review record not found. Ensure the lesson is completed first.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid quality value (must be 0-5)',
  })
  @Post('reviews/submit')
  @Roles(Role.User, Role.Admin)
  async submitReview(
    @Req() req,
    @Body() submitReviewDto: SubmitReviewDto,
  ): Promise<any> {
    const userId = req.user.id;
    const result = await this.srsService.submitReviewResult(
      userId,
      submitReviewDto,
    );

    return {
      message: 'Review submitted successfully',
      nextReviewDate: result.nextReviewDate,
      interval: result.interval,
      easeFactor: result.easeFactor,
      repetitions: result.repetitions,
    };
  }

  @ApiOperation({
    summary: 'Get overall review statistics',
    description:
      'Returns comprehensive statistics about the user\'s review progress including total, due, learning, and mature questions',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: ReviewStatsDto,
  })
  @Get('stats')
  @Roles(Role.User, Role.Admin)
  async getReviewStats(@Req() req): Promise<ReviewStatsDto> {
    const userId = req.user.id;
    return this.srsService.getReviewStats(userId);
  }

  @ApiOperation({
    summary: 'Get review statistics for a specific lesson',
    description:
      'Returns statistics about review progress for questions from a specific lesson',
  })
  @ApiParam({ name: 'lessonId', type: 'number', description: 'Lesson ID' })
  @ApiResponse({
    status: 200,
    description: 'Lesson statistics retrieved successfully',
    type: LessonReviewStatsDto,
  })
  @Get('stats/lesson/:lessonId')
  @Roles(Role.User, Role.Admin)
  async getLessonReviewStats(
    @Req() req,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ): Promise<LessonReviewStatsDto> {
    const userId = req.user.id;
    return this.srsService.getLessonReviewStats(userId, lessonId);
  }

  @ApiOperation({
    summary: 'Reset a question review',
    description:
      'Reset the review parameters for a specific question back to initial values (ease factor 2.5, interval 1 day, repetitions 0)',
  })
  @ApiParam({ name: 'questionId', type: 'number', description: 'Question ID' })
  @ApiResponse({
    status: 200,
    description: 'Question review reset successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Review record not found',
  })
  @Delete('reviews/:questionId/reset')
  @Roles(Role.User, Role.Admin)
  async resetQuestionReview(
    @Req() req,
    @Param('questionId', ParseIntPipe) questionId: number,
  ): Promise<any> {
    const userId = req.user.id;
    await this.srsService.resetQuestionReview(userId, questionId);

    return {
      message: 'Question review reset successfully',
    };
  }
}
