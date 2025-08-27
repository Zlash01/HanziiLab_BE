import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JWTGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { GetLessonsQueryDto } from './dto/get-lessons-query.dto';
import { CreateLessonWordDto } from './dto/lesson-word.dto';
import { CreateLessonGrammarPatternDto } from './dto/lesson-grammar-pattern.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('lessons')
@UseGuards(JWTGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  //POST /lessons - Create a new lesson (Admin only)
  @Post()
  @Roles(Role.Admin)
  async createLesson(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonsService.createLesson(createLessonDto);
  }

  //GET /lessons - Get all lessons with pagination and filters
  @Get()
  @Roles(Role.Admin, Role.User)
  async findAll(@Query() query: GetLessonsQueryDto) {
    return this.lessonsService.findAll(query);
  }

  //GET /lessons/content/:id - Get complete lesson with content and questions
  @Get('content/:id')
  @Roles(Role.Admin, Role.User)
  async findCompleteLesson(@Param('id', ParseIntPipe) id: number) {
    return this.lessonsService.findCompleteLesson(id);
  }

  //GET /lessons/:id - Get lesson by ID (Both user and admin)
  @Get(':id')
  @Roles(Role.Admin, Role.User)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lessonsService.findOne(id);
  }

  //GET /lessons/course/:courseId - Get lessons by course ID
  @Get('course/:courseId')
  @Roles(Role.Admin, Role.User)
  async findByCourseId(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.lessonsService.findByCourseId(courseId);
  }

  //GET /lessons/course/:courseId/all - Get all lessons by course ID including inactive (Admin only)
  @Get('course/:courseId/all')
  @Roles(Role.Admin)
  async findByCourseIdIncludeInactive(
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.lessonsService.findByCourseIdIncludeInactive(courseId);
  }

  //PUT /lessons/:id - Update lesson by ID (Admin only)
  @Put(':id')
  @Roles(Role.Admin)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(id, updateLessonDto);
  }

  //DELETE /lessons/:id/soft - Soft delete lesson by ID (Admin only)
  @Delete(':id/soft')
  @Roles(Role.Admin)
  async softDelete(@Param('id', ParseIntPipe) id: number) {
    const lesson = await this.lessonsService.softDelete(id);
    return {
      message: 'Lesson soft deleted successfully',
      lesson,
    };
  }

  //DELETE /lessons/:id/hard - Hard delete lesson by ID (Admin only)
  @Delete(':id/hard')
  @Roles(Role.Admin)
  async hardDelete(@Param('id', ParseIntPipe) id: number) {
    await this.lessonsService.hardDelete(id);
    return { message: 'Lesson permanently deleted successfully' };
  }

  //PATCH /lessons/:id/restore - Restore soft deleted lesson (Admin only)
  @Patch(':id/restore')
  @Roles(Role.Admin)
  async restore(@Param('id', ParseIntPipe) id: number) {
    const lesson = await this.lessonsService.restore(id);
    return {
      message: 'Lesson restored successfully',
      lesson,
    };
  }

  // Word Management Endpoints
  //GET /lessons/:id/words - Get all words for a lesson
  @Get(':id/words')
  @Roles(Role.Admin, Role.User)
  async getLessonWords(@Param('id', ParseIntPipe) id: number) {
    return this.lessonsService.getLessonWords(id);
  }

  //POST /lessons/:id/words - Add words to a lesson (Admin only)
  @Post(':id/words')
  @Roles(Role.Admin)
  async addWordsToLesson(
    @Param('id', ParseIntPipe) id: number,
    @Body() words: CreateLessonWordDto[],
  ) {
    const addedWords = await this.lessonsService.addWordsToLesson(id, words);
    return {
      message: 'Words added to lesson successfully',
      words: addedWords,
    };
  }

  //DELETE /lessons/:id/words - Remove words from a lesson (Admin only)
  @Delete(':id/words')
  @Roles(Role.Admin)
  async removeWordsFromLesson(
    @Param('id', ParseIntPipe) id: number,
    @Body('wordSenseIds') wordSenseIds: number[],
  ) {
    await this.lessonsService.removeWordsFromLesson(id, wordSenseIds);
    return {
      message: 'Words removed from lesson successfully',
    };
  }

  // Grammar Pattern Management Endpoints
  //GET /lessons/:id/grammar-patterns - Get all grammar patterns for a lesson
  @Get(':id/grammar-patterns')
  @Roles(Role.Admin, Role.User)
  async getLessonGrammarPatterns(@Param('id', ParseIntPipe) id: number) {
    return this.lessonsService.getLessonGrammarPatterns(id);
  }

  //POST /lessons/:id/grammar-patterns - Add grammar patterns to a lesson (Admin only)
  @Post(':id/grammar-patterns')
  @Roles(Role.Admin)
  async addGrammarPatternsToLesson(
    @Param('id', ParseIntPipe) id: number,
    @Body() patterns: CreateLessonGrammarPatternDto[],
  ) {
    const addedPatterns = await this.lessonsService.addGrammarPatternsToLesson(id, patterns);
    return {
      message: 'Grammar patterns added to lesson successfully',
      patterns: addedPatterns,
    };
  }

  //DELETE /lessons/:id/grammar-patterns - Remove grammar patterns from a lesson (Admin only)
  @Delete(':id/grammar-patterns')
  @Roles(Role.Admin)
  async removeGrammarPatternsFromLesson(
    @Param('id', ParseIntPipe) id: number,
    @Body('grammarPatternIds') grammarPatternIds: number[],
  ) {
    await this.lessonsService.removeGrammarPatternsFromLesson(id, grammarPatternIds);
    return {
      message: 'Grammar patterns removed from lesson successfully',
    };
  }
}
