import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  ParseEnumPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { GetCoursesQueryDto } from './dto/get-courses-query.dto';
import { JWTGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { HskLevel } from './enums/hsk-level.enum';

@ApiTags('courses')
@Controller('courses')
@UseGuards(JWTGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth('JWT-auth')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @ApiOperation({
    summary: 'Create a new course',
    description:
      'Create a new course with HSK level, title, and ordering. Admin access required.',
  })
  @ApiCreatedResponse({
    description: 'Course successfully created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        hskLevel: { type: 'number', example: 1 },
        title: { type: 'string', example: 'HSK 1 - Basic Chinese Characters' },
        description: {
          type: 'string',
          example: 'Introduction to basic Chinese characters',
        },
        totalLessons: { type: 'number', example: 0 },
        prerequisiteCourseId: { type: 'number', nullable: true, example: null },
        isActive: { type: 'boolean', example: true },
        orderIndex: { type: 'number', example: 1 },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({
    description: 'Order index already exists or prerequisite course not found',
  })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiBody({ type: CreateCourseDto })
  @Post()
  @Roles(Role.Admin)
  async createCourse(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @ApiOperation({
    summary: 'Get course statistics',
    description:
      'Get comprehensive statistics about courses including counts by HSK level. Admin access required.',
  })
  @ApiOkResponse({
    description: 'Course statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalCourses: { type: 'number', example: 25 },
        activeCourses: { type: 'number', example: 23 },
        inactiveCourses: { type: 'number', example: 2 },
        coursesByLevel: {
          type: 'object',
          example: {
            '1': 5,
            '2': 4,
            '3': 3,
            '4': 3,
            '5': 2,
            '6': 2,
            '7': 2,
            '8': 1,
            '9': 1,
          },
        },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Get('stats')
  @Roles(Role.Admin)
  async getCourseStats() {
    return this.coursesService.getCourseStats();
  }

  @ApiOperation({
    summary: 'Get courses by HSK level',
    description:
      'Retrieve all active courses for a specific HSK level, ordered by orderIndex. Admin access required.',
  })
  @ApiParam({
    name: 'level',
    enum: HskLevel,
    description: 'HSK level (1-9)',
    example: HskLevel.HSK1,
  })
  @ApiOkResponse({
    description: 'Courses retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          hskLevel: { type: 'number' },
          title: { type: 'string' },
          description: { type: 'string' },
          totalLessons: { type: 'number' },
          prerequisiteCourseId: { type: 'number', nullable: true },
          isActive: { type: 'boolean' },
          orderIndex: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Get('hsk/:level')
  @Roles(Role.Admin)
  async getCoursesByHskLevel(
    @Param('level', new ParseEnumPipe(HskLevel)) level: HskLevel,
  ) {
    return this.coursesService.findByHskLevel(level);
  }

  @ApiOperation({
    summary: 'Get all courses with pagination',
    description:
      'Retrieve paginated list of courses with optional filtering by HSK level and active status. Admin access required.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'hskLevel',
    required: false,
    enum: HskLevel,
    description: 'Filter by HSK level',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'prerequisiteCourseId',
    required: false,
    type: Number,
    description: 'Filter by prerequisite course',
  })
  @ApiOkResponse({
    description: 'Courses retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        courses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              hskLevel: { type: 'number' },
              title: { type: 'string' },
              description: { type: 'string' },
              totalLessons: { type: 'number' },
              prerequisiteCourseId: { type: 'number', nullable: true },
              isActive: { type: 'boolean' },
              orderIndex: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Get()
  @Roles(Role.Admin)
  async getAllCourses(@Query() query: GetCoursesQueryDto) {
    const { courses, total } = await this.coursesService.findAll(query);
    const { page = 1, limit = 10 } = query;

    return {
      courses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @ApiOperation({
    summary: 'Get course by ID',
    description:
      'Retrieve a specific course by its ID with prerequisite course information. Admin access required.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Course ID',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Course retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        hskLevel: { type: 'number' },
        title: { type: 'string' },
        description: { type: 'string' },
        totalLessons: { type: 'number' },
        prerequisiteCourseId: { type: 'number', nullable: true },
        isActive: { type: 'boolean' },
        orderIndex: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' },
        prerequisiteCourse: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'number' },
            title: { type: 'string' },
            hskLevel: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Course not found' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Get(':id')
  @Roles(Role.Admin)
  async getCourseById(@Param('id', ParseIntPipe) id: number) {
    const course = await this.coursesService.findById(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  @ApiOperation({
    summary: 'Update course',
    description:
      'Update course information. Cannot set course as its own prerequisite. Admin access required.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Course ID',
    example: 1,
  })
  @ApiBody({ type: UpdateCourseDto })
  @ApiOkResponse({
    description: 'Course updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        hskLevel: { type: 'number' },
        title: { type: 'string' },
        description: { type: 'string' },
        totalLessons: { type: 'number' },
        prerequisiteCourseId: { type: 'number', nullable: true },
        isActive: { type: 'boolean' },
        orderIndex: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Course not found' })
  @ApiBadRequestResponse({
    description: 'Invalid update data or business rule violation',
  })
  @ApiConflictResponse({ description: 'Order index already exists' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Put(':id')
  @Roles(Role.Admin)
  async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @ApiOperation({
    summary: 'Soft delete course',
    description:
      'Soft delete a course (sets isActive to false). Cannot delete if course is a prerequisite for other courses. Admin access required.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Course ID',
    example: 1,
  })
  @ApiNoContentResponse({ description: 'Course soft deleted successfully' })
  @ApiNotFoundResponse({ description: 'Course not found' })
  @ApiBadRequestResponse({
    description:
      'Cannot delete course that is a prerequisite for other courses',
  })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Delete(':id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCourse(@Param('id', ParseIntPipe) id: number) {
    await this.coursesService.delete(id);
  }

  @ApiOperation({
    summary: 'Hard delete course',
    description:
      'Permanently delete a course from the database. This action is irreversible. Cannot delete if course is a prerequisite for other courses. Admin access required.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Course ID',
    example: 1,
  })
  @ApiNoContentResponse({
    description: 'Course permanently deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Course not found' })
  @ApiBadRequestResponse({
    description:
      'Cannot delete course that is a prerequisite for other courses',
  })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Delete(':id/hard')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDeleteCourse(@Param('id', ParseIntPipe) id: number) {
    await this.coursesService.hardDelete(id);
  }

  @ApiOperation({
    summary: 'Restore soft-deleted course',
    description:
      'Restore a soft-deleted course (sets isActive to true). Admin access required.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Course ID',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Course restored successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        hskLevel: { type: 'number' },
        title: { type: 'string' },
        description: { type: 'string' },
        totalLessons: { type: 'number' },
        prerequisiteCourseId: { type: 'number', nullable: true },
        isActive: { type: 'boolean', example: true },
        orderIndex: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Course not found' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Put(':id/restore')
  @Roles(Role.Admin)
  async restoreCourse(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.restore(id);
  }
}
