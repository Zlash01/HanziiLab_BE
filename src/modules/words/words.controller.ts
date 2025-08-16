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
import { WordsService } from './words.service';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { GetWordsQueryDto } from './dto/get-words-query.dto';
import { JWTGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('words')
@UseGuards(JWTGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  // POST /words - Create a new word (Admin only)
  @Post()
  @Roles(Role.Admin)
  async createWord(@Body() createWordDto: CreateWordDto) {
    return this.wordsService.create(createWordDto);
  }

  // GET /words/stats - Get word statistics (Admin only)
  @Get('stats')
  @Roles(Role.Admin)
  async getWordStats() {
    return this.wordsService.getWordStats();
  }

  // GET /words/simplified/:simplified - Get word by simplified form (Both user and admin)
  @Get('simplified/:simplified')
  @Roles(Role.User, Role.Admin)
  async getWordBySimplified(@Param('simplified') simplified: string) {
    return this.wordsService.findBySimplified(simplified);
  }

  // GET /words - Get all words with filtering and pagination (Both user and admin)
  @Get()
  @Roles(Role.User, Role.Admin)
  async getWords(@Query() query: GetWordsQueryDto) {
    return this.wordsService.findAll(query);
  }

  // GET /words/:id - Get word by ID (Both user and admin)
  @Get(':id')
  @Roles(Role.User, Role.Admin)
  async getWordById(@Param('id', ParseIntPipe) id: number) {
    return this.wordsService.findById(id);
  }

  // PUT /words/:id - Update word (Admin only)
  @Put(':id')
  @Roles(Role.Admin)
  async updateWord(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWordDto: UpdateWordDto,
  ) {
    return this.wordsService.update(id, updateWordDto);
  }

  // DELETE /words/:id - Delete word (Admin only)
  @Delete(':id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteWord(@Param('id', ParseIntPipe) id: number) {
    await this.wordsService.remove(id);
  }
}
