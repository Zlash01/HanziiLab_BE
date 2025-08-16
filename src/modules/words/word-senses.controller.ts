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
} from '@nestjs/common';
import { WordSensesService } from './word-senses.service';
import { CreateWordSenseDto } from './dto/create-word-sense.dto';
import { UpdateWordSenseDto } from './dto/update-word-sense.dto';
import { GetWordSensesQueryDto } from './dto/get-word-senses-query.dto';
import { JWTGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('word-senses')
@UseGuards(JWTGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class WordSensesController {
  constructor(private readonly wordSensesService: WordSensesService) {}

  // POST /word-senses - Create a new word sense (Admin only)
  @Post()
  @Roles(Role.Admin)
  async createWordSense(@Body() createWordSenseDto: CreateWordSenseDto) {
    return this.wordSensesService.create(createWordSenseDto);
  }

  // GET /word-senses/stats - Get word sense statistics (Admin only)
  @Get('stats')
  @Roles(Role.Admin)
  async getWordSenseStats() {
    return this.wordSensesService.getWordSenseStats();
  }

  // GET /word-senses/by-word/:wordId - Get word senses by word ID (Both user and admin)
  @Get('by-word/:wordId')
  @Roles(Role.User, Role.Admin)
  async getWordSensesByWordId(@Param('wordId', ParseIntPipe) wordId: number) {
    return this.wordSensesService.findByWordId(wordId);
  }

  // GET /word-senses - Get all word senses with filtering and pagination (Both user and admin)
  @Get()
  @Roles(Role.User, Role.Admin)
  async getWordSenses(@Query() query: GetWordSensesQueryDto) {
    return this.wordSensesService.findAll(query);
  }

  // GET /word-senses/:id - Get word sense by ID (Both user and admin)
  @Get(':id')
  @Roles(Role.User, Role.Admin)
  async getWordSenseById(@Param('id', ParseIntPipe) id: number) {
    return this.wordSensesService.findById(id);
  }

  // PUT /word-senses/:id - Update word sense (Admin only)
  @Put(':id')
  @Roles(Role.Admin)
  async updateWordSense(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWordSenseDto: UpdateWordSenseDto,
  ) {
    return this.wordSensesService.update(id, updateWordSenseDto);
  }

  // DELETE /word-senses/:id - Delete word sense (Admin only)
  @Delete(':id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteWordSense(@Param('id', ParseIntPipe) id: number) {
    await this.wordSensesService.remove(id);
  }
}
