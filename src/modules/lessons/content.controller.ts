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
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @ApiOperation({ summary: 'Create new lesson content' })
  @ApiResponse({ status: 201, description: 'Content created successfully' })
  @ApiBody({ type: CreateContentDto })
  @Post()
  create(@Body() createContentDto: CreateContentDto) {
    return this.contentService.create(createContentDto);
  }

  @ApiOperation({ summary: 'Get all lesson content' })
  @ApiResponse({ status: 200, description: 'Content retrieved successfully' })
  @Get()
  findAll() {
    return this.contentService.findAll();
  }

  @ApiOperation({ summary: 'Get content by lesson ID' })
  @ApiResponse({ status: 200, description: 'Content retrieved successfully' })
  @ApiParam({ name: 'lessonId', type: 'number', description: 'Lesson ID' })
  @Get('lesson/:lessonId')
  findByLessonId(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.contentService.findByLessonId(lessonId);
  }

  @ApiOperation({ summary: 'Get content by ID' })
  @ApiResponse({ status: 200, description: 'Content retrieved successfully' })
  @ApiParam({ name: 'id', type: 'number', description: 'Content ID' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contentService.findOne(id);
  }

  @ApiOperation({ summary: 'Update lesson content' })
  @ApiResponse({ status: 200, description: 'Content updated successfully' })
  @ApiParam({ name: 'id', type: 'number', description: 'Content ID' })
  @ApiBody({ type: UpdateContentDto })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContentDto: UpdateContentDto,
  ) {
    return this.contentService.update(id, updateContentDto);
  }

  @ApiOperation({ summary: 'Soft delete lesson content' })
  @ApiResponse({ status: 200, description: 'Content soft deleted successfully' })
  @ApiParam({ name: 'id', type: 'number', description: 'Content ID' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contentService.remove(id);
  }

  @ApiOperation({ summary: 'Permanently delete lesson content' })
  @ApiResponse({ status: 200, description: 'Content permanently deleted successfully' })
  @ApiParam({ name: 'id', type: 'number', description: 'Content ID' })
  @Delete(':id/hard')
  hardDelete(@Param('id', ParseIntPipe) id: number) {
    return this.contentService.hardDelete(id);
  }

  @ApiOperation({ summary: 'Restore soft-deleted lesson content' })
  @ApiResponse({ status: 200, description: 'Content restored successfully' })
  @ApiParam({ name: 'id', type: 'number', description: 'Content ID' })
  @Patch(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.contentService.restore(id);
  }
}