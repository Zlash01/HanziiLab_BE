import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @ApiOperation({ summary: 'Create new lesson question' })
  @ApiResponse({ status: 201, description: 'Question created successfully' })
  @ApiBody({ type: CreateQuestionDto })
  @Post()
  create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @ApiOperation({ summary: 'Get all lesson questions' })
  @ApiResponse({ status: 200, description: 'Questions retrieved successfully' })
  @Get()
  findAll() {
    return this.questionsService.findAll();
  }

  @ApiOperation({ summary: 'Get questions by lesson ID' })
  @ApiResponse({ status: 200, description: 'Questions retrieved successfully' })
  @ApiParam({ name: 'lessonId', type: 'number', description: 'Lesson ID' })
  @Get('lesson/:lessonId')
  findByLessonId(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.questionsService.findByLessonId(lessonId);
  }

  @ApiOperation({ summary: 'Get question by ID' })
  @ApiResponse({ status: 200, description: 'Question retrieved successfully' })
  @ApiParam({ name: 'id', type: 'number', description: 'Question ID' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update lesson question' })
  @ApiResponse({ status: 200, description: 'Question updated successfully' })
  @ApiParam({ name: 'id', type: 'number', description: 'Question ID' })
  @ApiBody({ type: UpdateQuestionDto })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @ApiOperation({ summary: 'Soft delete lesson question' })
  @ApiResponse({ status: 200, description: 'Question soft deleted successfully' })
  @ApiParam({ name: 'id', type: 'number', description: 'Question ID' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.remove(id);
  }

  @ApiOperation({ summary: 'Permanently delete lesson question' })
  @ApiResponse({ status: 200, description: 'Question permanently deleted successfully' })
  @ApiParam({ name: 'id', type: 'number', description: 'Question ID' })
  @Delete(':id/hard')
  hardDelete(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.hardDelete(id);
  }
}