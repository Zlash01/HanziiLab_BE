import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UserProgressService } from './user-progress.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { JWTGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth, 
  ApiParam, 
  ApiBody, 
  ApiQuery,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiNoContentResponse
} from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JWTGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userProgressService: UserProgressService,
  ) {}

  @ApiOperation({ 
    summary: 'Get current user profile',
    description: 'Retrieve the profile information of the currently authenticated user'
  })
  @ApiOkResponse({ 
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'user@example.com' },
        displayName: { type: 'string', example: 'John Doe' },
        role: { type: 'string', enum: ['admin', 'user'], example: 'user' },
        currentHskLevel: { type: 'number', minimum: 1, maximum: 9, example: 3 },
        nativeLanguage: { type: 'string', example: 'en' },
        totalStudyDays: { type: 'number', example: 45 },
        currentStreak: { type: 'number', example: 7 },
        longestStreak: { type: 'number', example: 23 },
        lastStudyDate: { type: 'string', format: 'date', example: '2024-01-15' },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  // GET /users/profile - Get current user's profile
  @Get('profile')
  @Roles(Role.User, Role.Admin)
  async getProfile(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.usersService.findById(user.id);
  }

  @ApiOperation({ 
    summary: 'Update current user profile',
    description: 'Update profile information for the currently authenticated user'
  })
  @ApiOkResponse({ description: 'Profile updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input data or email already exists' })
  @ApiBody({ type: UpdateUserDto })
  // PUT /users/profile - Update current user's profile
  @Put('profile')
  @Roles(Role.User, Role.Admin)
  async updateProfile(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = req.user as JwtPayload;
    return this.usersService.updateProfile(
      user.id,
      updateUserDto,
      user.id,
      user.role,
    );
  }

  @ApiOperation({ 
    summary: 'Get user statistics (Admin only)',
    description: 'Retrieve comprehensive statistics about all users in the system'
  })
  @ApiOkResponse({ 
    description: 'User statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number', example: 150 },
        activeUsers: { type: 'number', example: 145 },
        inactiveUsers: { type: 'number', example: 5 },
        adminUsers: { type: 'number', example: 3 },
        regularUsers: { type: 'number', example: 147 }
      }
    }
  })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  // GET /users/stats - Get user statistics (Admin only)
  @Get('stats')
  @Roles(Role.Admin)
  async getUserStats() {
    return this.usersService.getUserStats();
  }

  @ApiOperation({ 
    summary: 'Get all users with pagination and filters (Admin only)',
    description: 'Retrieve all users with optional filtering by role and active status'
  })
  @ApiOkResponse({ 
    description: 'Users retrieved successfully with pagination info',
    schema: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              email: { type: 'string' },
              displayName: { type: 'string' },
              role: { type: 'string', enum: ['admin', 'user'] },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 150 },
            totalPages: { type: 'number', example: 15 }
          }
        }
      }
    }
  })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @ApiQuery({ type: GetUsersQueryDto })
  // GET /users - Get all users with pagination and filters (Admin only)
  @Get()
  @Roles(Role.Admin)
  async getAllUsers(@Query() query: GetUsersQueryDto) {
    const { users, total } = await this.usersService.findAll(query);
    const { page = 1, limit = 10 } = query;

    return {
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @ApiOperation({ 
    summary: 'Get user by ID (Admin only)',
    description: 'Retrieve detailed information about a specific user by their ID'
  })
  @ApiOkResponse({ description: 'User retrieved successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @ApiParam({ name: 'id', type: 'number', description: 'User ID' })
  // GET /users/:id - Get user by ID (Admin only)
  @Get(':id')
  @Roles(Role.Admin)
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @ApiOperation({ 
    summary: 'Update any user (Admin only)',
    description: 'Update any user\'s profile including role changes (Admin privilege required)'
  })
  @ApiOkResponse({ description: 'User updated successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @ApiBadRequestResponse({ description: 'Invalid input data or email already exists' })
  @ApiParam({ name: 'id', type: 'number', description: 'User ID to update' })
  @ApiBody({ type: AdminUpdateUserDto })
  // PUT /users/:id - Update any user (Admin only)
  @Put(':id')
  @Roles(Role.Admin)
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() adminUpdateUserDto: AdminUpdateUserDto,
  ) {
    return this.usersService.adminUpdateUser(id, adminUpdateUserDto);
  }

  @ApiOperation({ 
    summary: 'Soft delete user (Admin only)',
    description: 'Deactivate a user account (soft delete - can be restored)'
  })
  @ApiNoContentResponse({ description: 'User soft deleted successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @ApiParam({ name: 'id', type: 'number', description: 'User ID to delete' })
  // DELETE /users/:id - Soft delete user (Admin only)
  @Delete(':id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.deleteUser(id);
  }

  @ApiOperation({ 
    summary: 'Hard delete user (Admin only)',
    description: 'Permanently delete a user account and all associated data (irreversible)'
  })
  @ApiNoContentResponse({ description: 'User permanently deleted successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @ApiParam({ name: 'id', type: 'number', description: 'User ID to permanently delete' })
  // DELETE /users/:id/hard - Hard delete user (Admin only)
  @Delete(':id/hard')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDeleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.hardDeleteUser(id);
  }

  @ApiOperation({ 
    summary: 'Restore soft-deleted user (Admin only)',
    description: 'Reactivate a previously soft-deleted user account'
  })
  @ApiOkResponse({ description: 'User restored successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @ApiParam({ name: 'id', type: 'number', description: 'User ID to restore' })
  // PUT /users/:id/restore - Restore soft-deleted user (Admin only)
  @Put(':id/restore')
  @Roles(Role.Admin)
  async restoreUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.restoreUser(id);
  }

  // Progress tracking endpoints
  @ApiOperation({
    summary: 'Mark lesson as completed',
    description: 'Mark a specific lesson as completed with score percentage. Automatically updates study streak.'
  })
  @ApiOkResponse({ description: 'Lesson marked as completed successfully and streak updated' })
  @ApiBadRequestResponse({ description: 'Invalid lesson ID or score percentage' })
  @ApiNotFoundResponse({ description: 'Lesson not found' })
  @ApiBody({ type: CompleteLessonDto })
  // PUT /users/progress/complete
  @Put('progress/complete')
  @Roles(Role.User, Role.Admin)
  async completeLesson(
    @Req() req: Request,
    @Body() completeLessonDto: CompleteLessonDto,
  ) {
    const user = req.user as JwtPayload;
    return this.userProgressService.completeLesson(
      user.id,
      completeLessonDto.lessonId,
      completeLessonDto.scorePercentage
    );
  }

  @ApiOperation({ 
    summary: 'Get lesson progress',
    description: 'Get progress for a specific lesson'
  })
  @ApiOkResponse({ description: 'Lesson progress retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Lesson not found' })
  @ApiParam({ name: 'lessonId', type: 'number', description: 'Lesson ID' })
  // GET /users/progress/lesson/:lessonId
  @Get('progress/lesson/:lessonId')
  @Roles(Role.User, Role.Admin)
  async getLessonProgress(
    @Req() req: Request,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ) {
    const user = req.user as JwtPayload;
    return this.userProgressService.getLessonProgress(user.id, lessonId);
  }

  @ApiOperation({
    summary: 'Get course progress',
    description: 'Get status of all lessons in a course with completion details and scores'
  })
  @ApiOkResponse({
    description: 'Course progress retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          lessonId: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Introduction to Pinyin' },
          status: { type: 'string', enum: ['not_started', 'completed'], example: 'completed' },
          scorePercentage: { type: 'number', nullable: true, example: 85.5 },
          completedAt: { type: 'string', format: 'date-time', nullable: true }
        }
      }
    }
  })
  @ApiParam({ name: 'courseId', type: 'number', description: 'Course ID' })
  // GET /users/progress/course/:courseId
  @Get('progress/course/:courseId')
  @Roles(Role.User, Role.Admin)
  async getCourseProgress(
    @Req() req: Request,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    const user = req.user as JwtPayload;
    return this.userProgressService.getCourseProgress(user.id, courseId);
  }

  @ApiOperation({
    summary: 'Get study info',
    description: 'Get study streak and study days information for the current user'
  })
  @ApiOkResponse({
    description: 'Study info retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        currentStreak: { type: 'number', example: 7, description: 'Current consecutive study days' },
        longestStreak: { type: 'number', example: 23, description: 'Best streak achieved' },
        totalStudyDays: { type: 'number', example: 45, description: 'Total days studied' },
        lastStudyDate: { type: 'string', format: 'date', nullable: true, example: '2024-01-15' }
      }
    }
  })
  // GET /users/progress/study-info
  @Get('progress/study-info')
  @Roles(Role.User, Role.Admin)
  async getStudyInfo(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.userProgressService.getStudyInfo(user.id);
  }
}
