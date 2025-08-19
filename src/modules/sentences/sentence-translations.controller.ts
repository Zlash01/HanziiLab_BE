import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SentenceTranslationsService } from './sentence-translations.service';
import { CreateSentenceTranslationDto } from './dto/create-sentence-translation.dto';
import { UpdateSentenceTranslationDto } from './dto/update-sentence-translation.dto';
import { JWTGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('sentence-translations')
@UseGuards(JWTGuard)
export class SentenceTranslationsController {
  constructor(
    private readonly sentenceTranslationsService: SentenceTranslationsService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  create(@Body() createSentenceTranslationDto: CreateSentenceTranslationDto) {
    return this.sentenceTranslationsService.create(
      createSentenceTranslationDto,
    );
  }

  @Get()
  findAll() {
    return this.sentenceTranslationsService.findAll();
  }

  @Get('sentence/:sentenceId')
  findBySentenceId(@Param('sentenceId', ParseIntPipe) sentenceId: number) {
    return this.sentenceTranslationsService.findBySentenceId(sentenceId);
  }

  @Get('sentence/:sentenceId/language/:language')
  findBySentenceAndLanguage(
    @Param('sentenceId', ParseIntPipe) sentenceId: number,
    @Param('language') language: string,
  ) {
    return this.sentenceTranslationsService.findBySentenceAndLanguage(
      sentenceId,
      language,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sentenceTranslationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSentenceTranslationDto: UpdateSentenceTranslationDto,
  ) {
    return this.sentenceTranslationsService.update(
      id,
      updateSentenceTranslationDto,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sentenceTranslationsService.remove(id);
  }

  @Delete('sentence/:sentenceId')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  removeAllBySentenceId(@Param('sentenceId', ParseIntPipe) sentenceId: number) {
    return this.sentenceTranslationsService.removeAllBySentenceId(sentenceId);
  }
}
