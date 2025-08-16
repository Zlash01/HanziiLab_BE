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
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { GetCoursesQueryDto } from './dto/get-courses-query.dto';
import { JWTGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { HskLevel } from './enums/hsk-level.enum';

@Controller('courses')
@UseGuards(JWTGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // POST /courses - Create a new course (Admin only)
  @Post()
  @Roles(Role.Admin)
  async createCourse(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  // GET /courses/stats - Get course statistics (Admin only)
  @Get('stats')
  @Roles(Role.Admin)
  async getCourseStats() {
    return this.coursesService.getCourseStats();
  }

  // GET /courses/hsk/:level - Get courses by HSK level (Admin only for now)
  @Get('hsk/:level')
  @Roles(Role.Admin)
  async getCoursesByHskLevel(
    @Param('level', new ParseEnumPipe(HskLevel)) level: HskLevel,
  ) {
    return this.coursesService.findByHskLevel(level);
  }

  // GET /courses - Get all courses with pagination and filters (Admin only)
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

  // GET /courses/:id - Get course by ID (Admin only)
  @Get(':id')
  @Roles(Role.Admin)
  async getCourseById(@Param('id', ParseIntPipe) id: number) {
    const course = await this.coursesService.findById(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  // PUT /courses/:id - Update course (Admin only)
  @Put(':id')
  @Roles(Role.Admin)
  async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, updateCourseDto);
  }

  // DELETE /courses/:id - Soft delete course (Admin only)
  @Delete(':id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCourse(@Param('id', ParseIntPipe) id: number) {
    await this.coursesService.delete(id);
  }

  // DELETE /courses/:id/hard - Hard delete course (Admin only)
  @Delete(':id/hard')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDeleteCourse(@Param('id', ParseIntPipe) id: number) {
    await this.coursesService.hardDelete(id);
  }

  // PUT /courses/:id/restore - Restore soft-deleted course (Admin only)
  @Put(':id/restore')
  @Roles(Role.Admin)
  async restoreCourse(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.restore(id);
  }
}
