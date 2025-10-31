import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminProgressService } from './admin-progress.service';
import { JWTGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

@ApiTags('admin-progress')
@ApiBearerAuth('JWT-auth')
@Controller('admin/progress')
@UseGuards(JWTGuard, RolesGuard)
@Roles(Role.Admin)
export class AdminProgressController {
  constructor(private readonly adminProgressService: AdminProgressService) {}

  @ApiOperation({
    summary: 'Get platform overview statistics (Admin only)',
    description: 'Get comprehensive platform-wide statistics including user counts, completions, and averages'
  })
  @ApiOkResponse({
    description: 'Platform statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number', example: 150 },
        activeUsers: { type: 'number', example: 145 },
        totalCompletions: { type: 'number', example: 3420 },
        averageScore: { type: 'number', example: 78.5 },
        averageStreak: { type: 'number', example: 5.2 },
        topUsers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'number' },
              displayName: { type: 'string' },
              metric: { type: 'number' }
            }
          }
        }
      }
    }
  })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @Get('overview')
  async getOverviewStats() {
    return this.adminProgressService.getOverviewStats();
  }

  @ApiOperation({
    summary: 'Get detailed progress for a specific user (Admin only)',
    description: 'Get comprehensive progress information for a specific user including all completed lessons and course breakdown'
  })
  @ApiOkResponse({
    description: 'User progress details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            displayName: { type: 'string' },
            currentHskLevel: { type: 'number' }
          }
        },
        studyInfo: {
          type: 'object',
          properties: {
            currentStreak: { type: 'number' },
            longestStreak: { type: 'number' },
            totalStudyDays: { type: 'number' },
            lastStudyDate: { type: 'string', format: 'date', nullable: true }
          }
        },
        completedLessons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              lessonId: { type: 'number' },
              lessonTitle: { type: 'string' },
              courseId: { type: 'number' },
              courseTitle: { type: 'string' },
              scorePercentage: { type: 'number' },
              completedAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        courseBreakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              courseId: { type: 'number' },
              courseTitle: { type: 'string' },
              totalLessons: { type: 'number' },
              completedLessons: { type: 'number' },
              averageScore: { type: 'number' }
            }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  @Get('user/:userId')
  async getUserProgressDetails(@Param('userId', ParseIntPipe) userId: number) {
    return this.adminProgressService.getUserProgressDetails(userId);
  }

  @ApiOperation({
    summary: 'Get course analytics (Admin only)',
    description: 'Get detailed analytics for a specific course including completion rates and per-lesson statistics'
  })
  @ApiOkResponse({
    description: 'Course analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        course: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            title: { type: 'string' },
            hskLevel: { type: 'number' }
          }
        },
        totalLessons: { type: 'number', example: 12 },
        usersStarted: { type: 'number', example: 45 },
        usersCompleted: { type: 'number', example: 23 },
        averageCompletionRate: { type: 'number', example: 67.5 },
        lessonStats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              lessonId: { type: 'number' },
              lessonTitle: { type: 'string' },
              completionCount: { type: 'number' },
              averageScore: { type: 'number' }
            }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Course not found' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @ApiParam({ name: 'courseId', type: 'number', description: 'Course ID' })
  @Get('course/:courseId/analytics')
  async getCourseAnalytics(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.adminProgressService.getCourseAnalytics(courseId);
  }

  @ApiOperation({
    summary: 'Get lesson analytics (Admin only)',
    description: 'Get detailed analytics for a specific lesson including completion count, average score, and score distribution'
  })
  @ApiOkResponse({
    description: 'Lesson analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        lesson: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            title: { type: 'string' },
            courseId: { type: 'number' },
            courseTitle: { type: 'string' }
          }
        },
        totalCompletions: { type: 'number', example: 87 },
        averageScore: { type: 'number', example: 82.3 },
        scoreDistribution: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              range: { type: 'string', example: '81-100' },
              count: { type: 'number', example: 45 }
            }
          }
        },
        recentCompletions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'number' },
              displayName: { type: 'string' },
              scorePercentage: { type: 'number' },
              completedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Lesson not found' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @ApiParam({ name: 'lessonId', type: 'number', description: 'Lesson ID' })
  @Get('lesson/:lessonId/analytics')
  async getLessonAnalytics(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.adminProgressService.getLessonAnalytics(lessonId);
  }

  @ApiOperation({
    summary: 'Get leaderboard (Admin only)',
    description: 'Get top performers by various metrics: longest streak, most lessons completed, and highest average score'
  })
  @ApiOkResponse({
    description: 'Leaderboard retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        byStreak: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'number' },
              displayName: { type: 'string' },
              longestStreak: { type: 'number' }
            }
          }
        },
        byLessonsCompleted: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'number' },
              displayName: { type: 'string' },
              lessonsCompleted: { type: 'number' }
            }
          }
        },
        byAverageScore: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'number' },
              displayName: { type: 'string' },
              averageScore: { type: 'number' }
            }
          }
        }
      }
    }
  })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Number of top users to return (default: 20)' })
  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit?: number) {
    return this.adminProgressService.getLeaderboard(limit ? parseInt(limit.toString()) : 20);
  }
}
