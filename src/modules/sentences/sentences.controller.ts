import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SentencesService } from './sentences.service';
import { CreateSentenceDto } from './dto/create-sentence.dto';
import { UpdateSentenceDto } from './dto/update-sentence.dto';
import { GetSentencesQueryDto } from './dto/get-sentences-query.dto';
import { SentenceType } from './enums/sentence-type.enum';
import { JWTGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('sentences')
@UseGuards(JWTGuard)
export class SentencesController {
  constructor(private readonly sentencesService: SentencesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  create(@Body() createSentenceDto: CreateSentenceDto) {
    return this.sentencesService.create(createSentenceDto);
  }

  @Get()
  findAll(@Query() query: GetSentencesQueryDto) {
    return this.sentencesService.findAll(query);
  }
  @Get('type/:type')
  findByType(@Param('type') type: string) {
    return this.sentencesService.findByType(type as SentenceType);
  }

  @Get('difficulty/:level')
  findByDifficultyLevel(@Param('level', ParseIntPipe) level: number) {
    return this.sentencesService.findByDifficultyLevel(level);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sentencesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSentenceDto: UpdateSentenceDto,
  ) {
    return this.sentencesService.update(id, updateSentenceDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sentencesService.remove(id);
  }
}
